import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ValidarOrigenMiddleware } from '../common/middlewares/validar-origen.middleware.js';

// HTTP, DTO, firma, guards y servicios reales; solo persistencia/Cloudinary son dobles.
describe('Edición del perfil propio', () => {
  let app: INestApplication, jwt: JwtService;
  const id = '000000000000000000000001', otroId = '000000000000000000000002';
  let usuario: any, otro: any;
  const cadena = (dato: unknown) => ({ select() { return this; }, lean() { return this; }, exec: async () => dato });
  const modelo = { findById: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn() };
  const cloudinary = { subirImagen: vi.fn() };
  const datos = { nombre: 'Camila', apellido: 'Torres', correo: 'camila@club.test',
    nombreUsuario: 'camila.10', fechaNacimiento: '2001-02-03', descripcion: 'Mediocampista' };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=', 'base64');
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'clave-exclusiva-prueba-perfil', signOptions: { expiresIn: 600 } })],
      controllers: [AuthController], providers: [AuthService, UsuariosService, AuthGuard,
        { provide: getModelToken(Usuario.name), useValue: modelo },
        { provide: CloudinaryService, useValue: cloudinary }],
    }).compile();
    app = modulo.createNestApplication();
    const origen = new ValidarOrigenMiddleware();
    app.use((req: any, res: any, next: any) => origen.use(req, res, next));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init(); jwt = modulo.get(JwtService);
  });
  afterAll(async () => { await app?.close(); });
  beforeEach(() => {
    vi.clearAllMocks();
    usuario = { ...datos, _id: new Types.ObjectId(id), fechaNacimiento: new Date(datos.fechaNacimiento),
      perfil: 'usuario', activo: true, passwordHash: 'hash-solo-del-doble', imagenPerfil: 'https://imagenes.test/anterior.png' };
    otro = { ...usuario, _id: new Types.ObjectId(otroId), correo: 'otro@club.test', nombreUsuario: 'otro.8' };
    modelo.findById.mockImplementation((identidad) => cadena(String(identidad) === id ? usuario : otro));
    modelo.findOne.mockImplementation((filtro) => cadena(
      filtro.correo === otro.correo || filtro.nombreUsuario === otro.nombreUsuario ? otro : null));
    modelo.findOneAndUpdate.mockImplementation((filtro, actualizacion) => {
      if (String(filtro._id) !== id || usuario.activo === false) return cadena(null);
      Object.assign(usuario, actualizacion.$set); return cadena(usuario);
    });
    cloudinary.subirImagen.mockResolvedValue('https://imagenes.test/nueva.png');
  });
  const editar = () => request(app.getHttpServer()).patch('/auth/me')
    .set('Origin', 'http://localhost:4200').set('Cookie', `token=${jwt.sign({ sub: id, perfil: 'usuario' })}`);
  it('401 sin identidad; no escribe ni sube fotos', async () => {
    await request(app.getHttpServer()).patch('/auth/me').set('Origin', 'http://localhost:4200').send(datos).expect(401);
    expect(modelo.findOneAndUpdate).not.toHaveBeenCalled(); expect(cloudinary.subirImagen).not.toHaveBeenCalled();
  });
  it('actualiza solo la ficha propia, conserva credenciales/rol/avatar y no renueva cookie', async () => {
    const respuesta = await editar().send({ ...datos, nombre: 'Lucía', correo: ' LUCIA@CLUB.TEST ' }).expect(200);
    expect(respuesta.body.usuario).toMatchObject({ id, nombre: 'Lucía', correo: 'lucia@club.test', perfil: 'usuario', imagenPerfil: usuario.imagenPerfil });
    expect(respuesta.body.mensaje).toBe('Perfil actualizado correctamente');
    expect(respuesta.headers['set-cookie']).toBeUndefined();
    expect(respuesta.body).not.toHaveProperty('expiraEn');
    expect(JSON.stringify(respuesta.body)).not.toContain('passwordHash');
    expect(JSON.stringify(respuesta.body)).not.toContain('hash-solo-del-doble');
    expect(usuario.passwordHash).toBe('hash-solo-del-doble'); expect(otro.nombre).toBe('Camila');
    const [filtro, cambio, opciones] = modelo.findOneAndUpdate.mock.calls[0];
    expect(String(filtro._id)).toBe(id); expect(filtro.activo).toEqual({ $ne: false });
    expect(Object.keys(cambio.$set).sort()).toEqual(['apellido', 'correo', 'descripcion', 'fechaNacimiento', 'nombre', 'nombreUsuario']);
    expect(opciones).toEqual({ new: true, runValidators: true });
    expect(cloudinary.subirImagen).not.toHaveBeenCalled();
  });
  it.each(['id', 'autorId', 'perfil', 'activo', 'password', 'passwordHash', 'imagenPerfil'])(
    'rechaza el campo no editable %s sin escribir', async (campo) => {
      await editar().send({ ...datos, [campo]: campo === 'activo' ? false : otroId }).expect(400);
      expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
    });
  it.each([{ nombre: ' ' }, { nombre: 123 }, { apellido: 'A' }, { correo: 'invalido' },
    { nombreUsuario: 'espacios no' }, { fechaNacimiento: '2025-02-30' }, { fechaNacimiento: '9999-01-01' },
    { fechaNacimiento: '0000-01-01' }, { descripcion: null }, { descripcion: 'x'.repeat(301) }])(
    'rechaza datos incorrectos %j', async (cambio) => {
      await editar().send({ ...datos, ...cambio }).expect(400);
      expect(modelo.findOneAndUpdate).not.toHaveBeenCalled(); expect(cloudinary.subirImagen).not.toHaveBeenCalled();
    });
  it.each([{ correo: 'otro@club.test' }, { nombreUsuario: 'otro.8' }])('409 por duplicado %j antes de subir una imagen', async (cambio) => {
    const peticion = editar();
    for (const [campo, valor] of Object.entries({ ...datos, ...cambio })) peticion.field(campo, valor);
    await peticion.attach('imagen', png, 'foto.png').expect(409);
    expect(cloudinary.subirImagen).not.toHaveBeenCalled(); expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('traduce también un duplicado concurrente del índice MongoDB a 409', async () => {
    modelo.findOneAndUpdate.mockReturnValueOnce({ select() { return this; }, exec: async () => { throw { code: 11000 }; } });
    await editar().send(datos).expect(409);
  });
  it('sube PNG multipart y guarda la URL confirmada', async () => {
    const peticion = editar(); for (const [campo, valor] of Object.entries(datos)) peticion.field(campo, valor);
    const respuesta = await peticion.attach('imagen', png, 'foto.png').expect(200);
    expect(cloudinary.subirImagen).toHaveBeenCalledTimes(1);
    expect(respuesta.body.usuario.imagenPerfil).toBe('https://imagenes.test/nueva.png');
  });
  it('rechaza un texto disfrazado de foto antes de subir o actualizar', async () => {
    const peticion = editar(); for (const [campo, valor] of Object.entries(datos)) peticion.field(campo, valor);
    await peticion.attach('imagen', Buffer.from('no es PNG'), { filename: 'foto.png', contentType: 'image/png' }).expect(400);
    expect(cloudinary.subirImagen).not.toHaveBeenCalled(); expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('rechaza una foto mayor a 5 MiB', async () => {
    const peticion = editar(); for (const [campo, valor] of Object.entries(datos)) peticion.field(campo, valor);
    await peticion.attach('imagen', Buffer.alloc(5 * 1024 * 1024 + 1), 'foto.png').expect(413);
    expect(cloudinary.subirImagen).not.toHaveBeenCalled(); expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('si falla Cloudinary no modifica la ficha', async () => {
    cloudinary.subirImagen.mockRejectedValueOnce(new Error('falla de prueba'));
    const peticion = editar(); for (const [campo, valor] of Object.entries(datos)) peticion.field(campo, valor);
    await peticion.attach('imagen', png, 'foto.png').expect(500);
    expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
    expect(usuario.imagenPerfil).toBe('https://imagenes.test/anterior.png');
  });
  it('una cuenta deshabilitada no edita aunque conserve un JWT', async () => {
    usuario.activo = false; await editar().send(datos).expect(401);
    expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('repite el filtro de cuenta activa al escribir, por si fue suspendida después del guard', async () => {
    modelo.findOneAndUpdate.mockReturnValueOnce(cadena(null));
    await editar().send(datos).expect(401);
  });
  it('rechaza cookie sin origen y origen ajeno con 403', async () => {
    const cookie = `token=${jwt.sign({ sub: id, perfil: 'usuario' })}`;
    await request(app.getHttpServer()).patch('/auth/me').set('Cookie', cookie).send(datos).expect(403);
    await request(app.getHttpServer()).patch('/auth/me').set('Cookie', cookie).set('Origin', 'https://ajeno.test').send(datos).expect(403);
    expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
  });
  it('guarda una descripción vacía sin cambiar imagen ni las relaciones del jugador', async () => {
    await editar().send({ ...datos, descripcion: '' }).expect(200);
    expect(usuario.descripcion).toBe(''); expect(String(usuario._id)).toBe(id);
    expect(usuario.imagenPerfil).toBe('https://imagenes.test/anterior.png');
  });
});
