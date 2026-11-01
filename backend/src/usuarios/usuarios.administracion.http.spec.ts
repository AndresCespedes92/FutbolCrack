import { Global, Module, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { vi } from 'vitest';
import { UsuariosModule } from './usuarios.module.js';
import { UsuariosService } from './usuarios.service.js';
import { UsuarioSchema } from './entities/usuario.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { SeguridadModule } from '../auth/seguridad.module.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ValidarOrigenMiddleware } from '../common/middlewares/validar-origen.middleware.js';

// Módulos/guards/servicios/DTO/JWT/bcrypt REALES; solo la conexión y ejecución MongoDB se simulan.
// Todas las consultas de guard y servicio leen las mismas fichas, para probar un JWT previo a la baja.
const ValidacionUsuario = model('UsuarioPersistenciaPrueba5A', UsuarioSchema);
let fichas: any[] = [];
let falloConsulta = false;
function coincide(doc: any, filtro: any): boolean {
  return Object.entries(filtro).every(([campo, valor]: [string, any]) => {
    if (campo === '$or')
      return valor.some((parte: any) => coincide(doc, parte));
    if (valor && typeof valor === 'object' && '$ne' in valor)
      return doc[campo] !== valor.$ne;
    return String(doc[campo]) === String(valor);
  });
}
function proyectar(doc: any, seleccion: string): any {
  if (!doc) return null;
  if (seleccion && !seleccion.startsWith('+') && !seleccion.startsWith('-')) {
    const copia: any = { _id: doc._id };
    for (const campo of seleccion.split(' '))
      if (campo in doc) copia[campo] = doc[campo];
    return copia;
  }
  const copia = { ...doc };
  if (seleccion !== '+passwordHash') delete copia.passwordHash;
  return copia;
}
function consulta(resolver: () => any) {
  let seleccion = '';
  return {
    select(campos: string) {
      seleccion = campos;
      return this;
    },
    lean() {
      return this;
    },
    async exec() {
      const valor = resolver();
      return Array.isArray(valor)
        ? valor.map((doc) => proyectar(doc, seleccion))
        : proyectar(valor, seleccion);
    },
  };
}
const guardar = vi.fn();
const actualizar = vi.fn();
class ModeloUsuarioPrueba {
  static db = { base: { isValidObjectId: Types.ObjectId.isValid } };
  static find() {
    return consulta(() => fichas);
  }
  static findOne(filtro: any) {
    return consulta(() => fichas.find((doc) => coincide(doc, filtro)) ?? null);
  }
  static findById(id: any) {
    return consulta(() => {
      if (falloConsulta) throw new Error('Fallo simulado de base de datos');
      return fichas.find((doc) => String(doc._id) === String(id)) ?? null;
    });
  }
  static updateOne = actualizar;
  constructor(private datos: Record<string, unknown>) {}
  save() {
    return guardar(this.datos);
  }
}
@Global()
@Module({
  providers: [
    {
      provide: getConnectionToken(),
      useValue: { models: { Usuario: ModeloUsuarioPrueba } },
    },
  ],
  exports: [getConnectionToken()],
})
class ConexionPrueba {}

describe('Administración 5A: integración de módulos, roles, estado y sesiones', () => {
  let app: INestApplication,
    jwt: JwtService,
    servicio: UsuariosService,
    hash: string;
  const admin = '000000000000000000000001',
    normal = '000000000000000000000002',
    adminInactivo = '000000000000000000000003',
    antiguo = '000000000000000000000004';
  beforeAll(async () => {
    hash = await bcrypt.hash('ClaveSegura8', 4);
    jwt = new JwtService({
      secret: 'clave-exclusiva-admin-tests',
      signOptions: { expiresIn: 900 },
    });
    const modulo = await Test.createTestingModule({
      imports: [ConexionPrueba, SeguridadModule, UsuariosModule, AuthModule],
    })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(CloudinaryService)
      .useValue({ subirImagen: vi.fn() })
      .compile();
    servicio = modulo.get(UsuariosService);
    app = modulo.createNestApplication({ logger: false });
    const origen = new ValidarOrigenMiddleware();
    app.use((req: any, res: any, next: any) => origen.use(req, res, next));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });
  beforeEach(() => {
    falloConsulta = false;
    const base = {
      nombre: 'Mateo',
      apellido: 'Ríos',
      fechaNacimiento: new Date('2000-01-01'),
      descripcion: 'Jugador',
      imagenPerfil: '',
      passwordHash: hash,
      activo: true,
    };
    fichas = [
      {
        ...base,
        _id: new Types.ObjectId(admin),
        correo: 'admin@club.test',
        nombreUsuario: 'secretaria',
        perfil: 'administrador',
      },
      {
        ...base,
        _id: new Types.ObjectId(normal),
        correo: 'jugador@club.test',
        nombreUsuario: 'jugador',
        perfil: 'usuario',
      },
      {
        ...base,
        _id: new Types.ObjectId(adminInactivo),
        correo: 'admin2@club.test',
        nombreUsuario: 'admin2',
        perfil: 'administrador',
        activo: false,
      },
      {
        ...base,
        _id: new Types.ObjectId(antiguo),
        correo: 'antiguo@club.test',
        nombreUsuario: 'antiguo',
        perfil: 'usuario',
      },
    ];
    delete fichas[3].activo;
    guardar.mockReset().mockImplementation(async (datos) => {
      const nuevo = new ValidacionUsuario(datos);
      await nuevo.validate();
      const guardado = nuevo.toObject();
      fichas.push(guardado);
      return guardado;
    });
    actualizar.mockReset().mockImplementation((filtro, cambio) => ({
      exec: async () => {
        const usuario = fichas.find((doc) => coincide(doc, filtro));
        if (!usuario) return { matchedCount: 0 };
        Object.assign(usuario, cambio.$set);
        return { matchedCount: 1 };
      },
    }));
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  const token = (id = admin, perfil = 'administrador') =>
    jwt.sign({ sub: id, perfil });
  const pedir = (
    metodo: 'get' | 'post' | 'delete',
    ruta: string,
    t = token(),
  ) =>
    request(app.getHttpServer())
      [metodo](ruta)
      .set('Origin', 'http://localhost:4200')
      .set('Cookie', `token=${t}`);
  const datos = (perfil = 'usuario') => ({
    nombre: 'Lucía',
    apellido: 'Torres',
    correo: 'lucia@club.test',
    nombreUsuario: 'lucia.8',
    password: 'ClaveSegura8',
    repetirPassword: 'ClaveSegura8',
    fechaNacimiento: '2004-01-01',
    descripcion: 'Mediocampista',
    perfil,
  });
  function noCredenciales(body: any) {
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain(hash);
    expect(body).not.toHaveProperty('password');
  }
  it('admin lista datos reales/estado con proyección sin credenciales y normaliza antiguos solo al responder', async () => {
    const respuesta = await pedir('get', '/usuarios').expect(200);
    expect(respuesta.body).toHaveLength(4);
    for (const usuario of respuesta.body) noCredenciales(usuario);
    expect(respuesta.body.find((u: any) => u._id === antiguo).activo).toBe(
      true,
    );
    expect(
      respuesta.body.find((u: any) => u._id === adminInactivo).activo,
    ).toBe(false);
    expect(fichas[3]).not.toHaveProperty('activo');
  });
  it('sin sesión responde 401 en las cuatro operaciones', async () => {
    for (const [metodo, ruta] of [
      ['get', '/usuarios'],
      ['post', '/usuarios'],
      ['delete', `/usuarios/${normal}`],
      ['post', `/usuarios/${adminInactivo}/habilitar`],
    ] as const)
      await request(app.getHttpServer())
        [metodo](ruta)
        .set('Origin', 'http://localhost:4200')
        .send(metodo === 'post' ? datos() : undefined)
        .expect(401);
    expect(guardar).not.toHaveBeenCalled();
    expect(actualizar).not.toHaveBeenCalled();
  });
  it('usuario común obtiene 403 aun con rol administrador antiguo/libre en JWT/body', async () => {
    for (const [metodo, ruta] of [
      ['get', '/usuarios'],
      ['post', '/usuarios'],
      ['delete', `/usuarios/${antiguo}`],
      ['post', `/usuarios/${adminInactivo}/habilitar`],
    ] as const)
      await pedir(metodo, ruta, token(normal, 'administrador'))
        .send(metodo === 'post' ? datos('administrador') : undefined)
        .expect(403);
    expect(guardar).not.toHaveBeenCalled();
    expect(actualizar).not.toHaveBeenCalled();
  });
  it.each(['usuario', 'administrador'])(
    'admin crea rol %s, hash real y estado activo obligatorio',
    async (perfil) => {
      const respuesta = await pedir('post', '/usuarios')
        .send(datos(perfil))
        .expect(201);
      expect(respuesta.body.mensaje).toBe('Usuario creado correctamente');
      expect(respuesta.body.usuario).toMatchObject({
        perfil,
        activo: true,
        nombreUsuario: 'lucia.8',
      });
      noCredenciales(respuesta.body);
      const persistido = fichas.find((u) => u.nombreUsuario === 'lucia.8');
      expect(persistido.passwordHash).not.toBe('ClaveSegura8');
      expect(
        await bcrypt.compare('ClaveSegura8', persistido.passwordHash),
      ).toBe(true);
      expect(JSON.stringify(respuesta.body)).not.toContain(
        persistido.passwordHash,
      );
    },
  );
  it('registro público rechaza rol/estado elegidos y el registro válido mantiene usuario activo', async () => {
    const { perfil, ...publicos } = datos();
    for (const extra of [{ perfil: 'administrador' }, { activo: false }])
      await request(app.getHttpServer())
        .post('/auth/registro')
        .set('Origin', 'http://localhost:4200')
        .send({ ...publicos, ...extra })
        .expect(400);
    const respuesta = await request(app.getHttpServer())
      .post('/auth/registro')
      .set('Origin', 'http://localhost:4200')
      .send(publicos)
      .expect(201);
    expect(respuesta.body.usuario.perfil).toBe('usuario');
    expect(respuesta.body.usuario.activo).toBe(true);
    noCredenciales(respuesta.body);
  });
  it('el método público create también fuerza rol y estado aunque reciba extras internos', async () => {
    const creado = await servicio.create({
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan@club.test',
      nombreUsuario: 'juan.9',
      passwordHash: hash,
      fechaNacimiento: new Date('2000-01-01'),
      perfil: 'administrador',
      activo: false,
    } as any);
    expect(creado.perfil).toBe('usuario');
    expect(creado.activo).toBe(true);
  });
  it.each(['correo', 'nombreUsuario'])(
    'rechaza duplicado de %s con 409 sin crear otro documento',
    async (campo) => {
      const nuevos = { ...datos(), [campo]: fichas[1][campo] };
      await pedir('post', '/usuarios').send(nuevos).expect(409);
      expect(fichas).toHaveLength(4);
    },
  );
  it.each(['otro', '', null])(
    'rechaza rol inválido %j por DTO',
    async (perfil) => {
      await pedir('post', '/usuarios')
        .send({ ...datos(), perfil })
        .expect(400);
      expect(guardar).not.toHaveBeenCalled();
    },
  );
  it.each([{ activo: false }, { passwordHash: 'elegido' }, { id: normal }])(
    'rechaza campos ajenos en alta administrativa: %j',
    async (extra) => {
      await pedir('post', '/usuarios')
        .send({ ...datos(), ...extra })
        .expect(400);
      expect(guardar).not.toHaveBeenCalled();
    },
  );
  it.each([
    { correo: 'mal' },
    { password: 'sinNumero', repetirPassword: 'sinNumero' },
    { nombre: '   ' },
    { fechaNacimiento: 'no-fecha' },
  ])('rechaza datos inválidos %j', async (cambio) => {
    await pedir('post', '/usuarios')
      .send({ ...datos(), ...cambio })
      .expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });
  it('rechaza contraseñas no coincidentes y conserva el padrón', async () => {
    await pedir('post', '/usuarios')
      .send({ ...datos(), repetirPassword: 'OtraClave8' })
      .expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });
  it('deshabilita lógicamente sin borrar ni cambiar contraseña, datos o rol', async () => {
    const anterior = { ...fichas[1] };
    const respuesta = await pedir('delete', `/usuarios/${normal}`).expect(200);
    expect(respuesta.body.mensaje).toContain('deshabilitado correctamente');
    expect(fichas).toHaveLength(4);
    expect(fichas[1]).toEqual({ ...anterior, activo: false });
    expect(actualizar).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(normal),
        perfil: { $ne: 'administrador' },
        activo: { $ne: false },
      },
      { $set: { activo: false } },
    );
  });
  it('rehabilita sin cambiar rol y permite volver a usar la cuenta', async () => {
    await pedir('delete', `/usuarios/${normal}`).expect(200);
    const respuesta = await pedir('post', `/usuarios/${normal}/habilitar`)
      .send({})
      .expect(200);
    expect(respuesta.body.mensaje).toContain('habilitado correctamente');
    expect(fichas[1].activo).toBe(true);
    expect(fichas[1].perfil).toBe('usuario');
    await pedir('post', '/auth/autorizar', token(normal, 'usuario'))
      .send({})
      .expect(200);
  });
  it('un JWT emitido antes de la baja deja de servir en endpoints protegidos, autorizar y refrescar', async () => {
    const previo = token(normal, 'usuario');
    await pedir('get', '/auth/me', previo).expect(200);
    await pedir('delete', `/usuarios/${normal}`).expect(200);
    await pedir('get', '/auth/me', previo).expect(401);
    await pedir('get', '/usuarios', previo).expect(401);
    for (const ruta of ['/auth/autorizar', '/auth/refrescar']) {
      const respuesta = await pedir('post', ruta, previo).send({}).expect(401);
      expect(respuesta.headers['set-cookie']).toBeUndefined();
    }
  });
  it('cuenta deshabilitada no inicia sesión aunque conozca la contraseña correcta', async () => {
    await pedir('delete', `/usuarios/${normal}`).expect(200);
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'http://localhost:4200')
      .send({ identificador: 'jugador', password: 'ClaveSegura8' })
      .expect(401);
    expect(respuesta.body.message).toContain('deshabilitada');
    expect(respuesta.headers['set-cookie']).toBeUndefined();
  });
  it('un administrador deshabilitado también pierde acceso con su JWT anterior', async () => {
    const previo = token(adminInactivo);
    await pedir('get', '/usuarios', previo).expect(401);
    await pedir('post', '/auth/refrescar', previo).send({}).expect(401);
  });
  it('usuarios antiguos sin activo pueden iniciar/autorizar/renovar y su documento no se migra al leer', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'http://localhost:4200')
      .send({ identificador: 'antiguo', password: 'ClaveSegura8' })
      .expect(200);
    expect(login.body.usuario.activo).toBe(true);
    for (const ruta of ['/auth/autorizar', '/auth/refrescar'])
      await pedir('post', ruta, token(antiguo, 'usuario')).send({}).expect(200);
    expect(fichas[3]).not.toHaveProperty('activo');
  });
  it('bloquea autodeshabilitación y cualquier baja de administrador, incluso el último', async () => {
    await pedir('delete', `/usuarios/${admin}`).expect(409);
    fichas[2].activo = true;
    await pedir('delete', `/usuarios/${adminInactivo}`).expect(409);
    expect(fichas[0].activo).toBe(true);
    expect(fichas[2].activo).toBe(true);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it('permite rehabilitar un administrador inactivo, sin habilitar bajas de administradores', async () => {
    await pedir('post', `/usuarios/${adminInactivo}/habilitar`)
      .send({})
      .expect(200);
    expect(fichas[2].activo).toBe(true);
    await pedir('get', '/usuarios', token(adminInactivo)).expect(200);
  });
  it('baja de usuario antiguo funciona sin completar otros campos nuevos', async () => {
    await pedir('delete', `/usuarios/${antiguo}`).expect(200);
    expect(fichas[3].activo).toBe(false);
  });
  it('operaciones repetidas producen 409 y un id inexistente/incorrecto da 404/400', async () => {
    await pedir('post', `/usuarios/${normal}/habilitar`).send({}).expect(409);
    await pedir('delete', `/usuarios/${normal}`).expect(200);
    await pedir('delete', `/usuarios/${normal}`).expect(409);
    for (const [metodo, sufijo] of [
      ['delete', ''],
      ['post', '/habilitar'],
    ] as const) {
      await pedir(metodo, '/usuarios/000000000000000000000099' + sufijo)
        .send({})
        .expect(404);
      await pedir(metodo, '/usuarios/incorrecto' + sufijo)
        .send({})
        .expect(400);
    }
  });
  it('cambio concurrente de estado no informa un éxito falso', async () => {
    actualizar.mockImplementationOnce(() => ({
      exec: async () => ({ matchedCount: 0 }),
    }));
    await pedir('delete', `/usuarios/${normal}`).expect(409);
    expect(fichas[1].activo).toBe(true);
  });
  it('dos bajas simultáneas del mismo usuario solo modifican una vez', async () => {
    const respuestas = await Promise.all([
      pedir('delete', `/usuarios/${normal}`),
      pedir('delete', `/usuarios/${normal}`),
    ]);
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(fichas[1].activo).toBe(false);
  });
  it('un fallo transitorio de MongoDB no se disfraza como un 401', async () => {
    falloConsulta = true;
    await pedir('get', '/auth/me').expect(500);
  });
  it('mantiene CSRF: cookie administrativa sin Origin/Referer no ejecuta la baja', async () => {
    await request(app.getHttpServer())
      .delete(`/usuarios/${normal}`)
      .set('Cookie', `token=${token()}`)
      .expect(403);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it.each(['/usuarios', '/auth/registro'])(
    'alta %s rechaza Unicode que bcrypt truncaría sin guardar usuario',
    async (ruta) => {
      const clave = 'A1' + 'é'.repeat(36);
      const cuerpo = { ...datos(), password: clave, repetirPassword: clave };
      if (ruta === '/auth/registro') delete (cuerpo as any).perfil;
      await pedir('post', ruta).send(cuerpo).expect(400);
      expect(guardar).not.toHaveBeenCalled();
    },
  );
  it('registro público rechaza más de 64 caracteres también por DTO', async () => {
    const cuerpo = {
      ...datos(),
      password: 'A1' + 'a'.repeat(63),
      repetirPassword: 'A1' + 'a'.repeat(63),
    };
    delete (cuerpo as any).perfil;
    await pedir('post', '/auth/registro').send(cuerpo).expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });
  it.each(['nombre', 'apellido', 'nombreUsuario'])(
    'registro público rechaza %s con espacios como 400, no como error MongoDB',
    async (campo) => {
      const cuerpo = { ...datos(), [campo]: '   ' };
      delete (cuerpo as any).perfil;
      await pedir('post', '/auth/registro').send(cuerpo).expect(400);
      expect(guardar).not.toHaveBeenCalled();
    },
  );
});
