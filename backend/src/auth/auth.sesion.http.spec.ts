import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { UsuarioSchema } from '../usuarios/entities/usuario.entity.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ValidarOrigenMiddleware } from '../common/middlewares/validar-origen.middleware.js';
import { DURACION_SESION_SEGUNDOS } from './sesion.constants.js';

// HTTP real local con guard, firma JWT, bcrypt, servicio, cookies y middleware CSRF.
// Solo ficha/almacenamiento de usuarios y Cloudinary se sustituyen; no abre Atlas.
describe('Sesiones HTTP 4C', () => {
  let app: INestApplication, jwt: JwtService, hash: string;
  const id = '000000000000000000000001';
  const inicio = new Date('2026-11-01T12:00:00Z');
  const usuarios = {
    findById: vi.fn(),
    findByIdentificadorConPassword: vi.fn(),
    create: vi.fn(),
  };
  let usuario: any;
  beforeAll(async () => {
    hash = await bcrypt.hash('ClaveSegura8', 4);
    const modulo = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'clave-exclusiva-tests-sesion',
          signOptions: { expiresIn: DURACION_SESION_SEGUNDOS },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        AuthGuard,
        { provide: UsuariosService, useValue: usuarios },
        { provide: CloudinaryService, useValue: { subirImagen: vi.fn() } },
      ],
    }).compile();
    app = modulo.createNestApplication();
    const origen = new ValidarOrigenMiddleware();
    app.use((req: any, res: any, next: any) => origen.use(req, res, next));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    jwt = modulo.get(JwtService);
  });
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(inicio);
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('FRONTEND_URL', 'https://club.example');
    usuario = {
      _id: new Types.ObjectId(id),
      nombre: 'Lucía',
      apellido: 'Torres',
      correo: 'lucia@club.test',
      nombreUsuario: 'lucia.8',
      fechaNacimiento: new Date('2004-01-01'),
      descripcion: 'Mediocampista',
      imagenPerfil: '/foto.png',
      perfil: 'usuario',
      passwordHash: hash,
    };
    usuarios.findById.mockReset().mockImplementation(async () => usuario);
    usuarios.findByIdentificadorConPassword
      .mockReset()
      .mockImplementation(async () => usuario);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  const token = () => jwt.sign({ sub: id, perfil: 'usuario' });
  const post = (ruta: string, t?: string) => {
    const peticion = request(app.getHttpServer())
      .post(`/auth/${ruta}`)
      .set('Origin', 'http://localhost:4200');
    return t ? peticion.set('Cookie', `token=${t}`) : peticion;
  };
  function noSecretos(body: any, t?: string) {
    expect(body).not.toHaveProperty('access_token');
    expect(body).not.toHaveProperty('token');
    expect(JSON.stringify(body)).not.toContain(hash);
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    if (t) expect(JSON.stringify(body)).not.toContain(t);
  }
  function cookieDe(respuesta: any) {
    const texto = respuesta.headers['set-cookie'][0] as string;
    return {
      texto,
      token: decodeURIComponent(texto.split(';')[0].slice('token='.length)),
    };
  }
  it('login firma 900 segundos, alinea cookie al exp real y devuelve solo datos/fechas públicas', async () => {
    const respuesta = await post('login')
      .send({ identificador: 'lucia.8', password: 'ClaveSegura8' })
      .expect(200);
    const cookie = cookieDe(respuesta);
    const claims = jwt.verify(cookie.token);
    expect(claims.exp - claims.iat).toBe(900);
    expect(cookie.texto).toContain('Max-Age=900');
    expect(cookie.texto).toContain('HttpOnly');
    expect(cookie.texto).toContain('SameSite=Lax');
    expect(cookie.texto).toContain('Path=/');
    expect(respuesta.body.expiraEn).toBe('2026-11-01T12:15:00.000Z');
    expect(respuesta.body.emitidaEn).toBe('2026-11-01T12:00:00.000Z');
    expect(respuesta.body.usuario.id).toBe(id);
    noSecretos(respuesta.body, cookie.token);
  });
  it('autoriza cookie válida sin renovar y consulta el rol vigente de la ficha', async () => {
    const anterior = jwt.sign({ sub: id, perfil: 'administrador' });
    const respuesta = await post('autorizar', anterior)
      .send({ perfil: 'administrador' })
      .expect(200);
    expect(respuesta.headers['set-cookie']).toBeUndefined();
    expect(respuesta.body.usuario.perfil).toBe('usuario');
    expect(respuesta.body.expiraEn).toBe('2026-11-01T12:15:00.000Z');
    noSecretos(respuesta.body, anterior);
  });
  it.each(['autorizar', 'refrescar'])(
    '%s sin cookie responde 401, incluso con Bearer válido',
    async (ruta) => {
      await post(ruta).send({}).expect(401);
      await post(ruta)
        .set('Authorization', `Bearer ${token()}`)
        .send({})
        .expect(401);
    },
  );
  it.each(['autorizar', 'refrescar'])(
    '%s rechaza token vencido o firma inválida sin cookie nueva',
    async (ruta) => {
      for (const t of [
        jwt.sign({ sub: id }, { expiresIn: -1 }),
        'token-invalido',
      ]) {
        const respuesta = await post(ruta, t).send({}).expect(401);
        expect(respuesta.headers['set-cookie']).toBeUndefined();
      }
    },
  );
  it.each(['autorizar', 'refrescar'])(
    '%s rechaza usuario eliminado con 401',
    async (ruta) => {
      usuarios.findById.mockResolvedValue(null);
      const respuesta = await post(ruta, token()).send({}).expect(401);
      expect(respuesta.headers['set-cookie']).toBeUndefined();
    },
  );
  it('documenta que el modelo actual no tiene habilitación y no inventa un estado de Sprint 4', () => {
    expect(UsuarioSchema.path('habilitado')).toBeUndefined();
    expect(UsuarioSchema.path('activo')).toBeUndefined();
  });
  it('renueva solo voluntariamente un token vigente, con rol actual y nueva expiración de 15 minutos', async () => {
    const anterior = token();
    vi.setSystemTime(new Date('2026-11-01T12:10:00Z'));
    usuario.perfil = 'administrador';
    const respuesta = await post('refrescar', anterior)
      .send({ perfil: 'usuario' })
      .expect(200);
    const cookie = cookieDe(respuesta);
    const claims = jwt.verify(cookie.token);
    expect(cookie.token).not.toBe(anterior);
    expect(claims.exp - claims.iat).toBe(900);
    expect(claims.perfil).toBe('administrador');
    expect(respuesta.body.expiraEn).toBe('2026-11-01T12:25:00.000Z');
    noSecretos(respuesta.body, cookie.token);
  });
  it('a los 15 minutos exactos no permite autorizar ni renovar el JWT anterior', async () => {
    const anterior = token();
    vi.setSystemTime(new Date('2026-11-01T12:15:00Z'));
    await post('autorizar', anterior).send({}).expect(401);
    await post('refrescar', anterior).send({}).expect(401);
  });
  it('tampoco renueva si vence durante la consulta del usuario', async () => {
    const anterior = token();
    usuarios.findById.mockImplementationOnce(async () => {
      vi.setSystemTime(new Date('2026-11-01T12:16:00Z'));
      return usuario;
    });
    const respuesta = await post('refrescar', anterior).send({}).expect(401);
    expect(respuesta.headers['set-cookie']).toBeUndefined();
  });
  it('cookies antiguas conservan su exp breve: autorizar no las amplía y vencidas no se renuevan', async () => {
    const breve = jwt.sign({ sub: id, perfil: 'usuario' }, { expiresIn: 20 });
    const respuesta = await post('autorizar', breve).send({}).expect(200);
    expect(respuesta.body.expiraEn).toBe('2026-11-01T12:00:20.000Z');
    vi.setSystemTime(new Date('2026-11-01T12:00:21Z'));
    await post('refrescar', breve).send({}).expect(401);
  });
  it('producción conserva HttpOnly/Secure/SameSite=None y logout limpia con las mismas opciones', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const respuesta = await post('login')
      .send({ identificador: 'lucia.8', password: 'ClaveSegura8' })
      .expect(200);
    const cookie = cookieDe(respuesta);
    expect(cookie.texto).toContain('HttpOnly');
    expect(cookie.texto).toContain('Secure');
    expect(cookie.texto).toContain('SameSite=None');
    const salida = await post('logout', cookie.token).send({}).expect(200);
    const borrada = salida.headers['set-cookie'][0];
    expect(borrada).toContain('Expires=Thu, 01 Jan 1970');
    expect(borrada).toContain('Secure');
    expect(borrada).toContain('SameSite=None');
  });
  it('conserva login incorrecto 401 y GET me disponible sin exponer credenciales', async () => {
    await post('login')
      .send({ identificador: 'lucia.8', password: 'OtraClave8' })
      .expect(401);
    const perfil = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', `token=${token()}`)
      .expect(200);
    expect(perfil.body.id).toBe(id);
    noSecretos(perfil.body);
  });
  it.each(['autorizar', 'refrescar'])(
    'CSRF: %s rechaza origen ajeno, null y cabeceras ausentes',
    async (ruta) => {
      const t = token();
      for (const origen of ['https://atacante.example', 'null'])
        await post(ruta, t).set('Origin', origen).send({}).expect(403);
      await request(app.getHttpServer())
        .post(`/auth/${ruta}`)
        .set('Cookie', `token=${t}`)
        .send({})
        .expect(403);
    },
  );
  it('CSRF acepta Referer permitido cuando Origin falta y compara origen exacto', async () => {
    await request(app.getHttpServer())
      .post('/auth/autorizar')
      .set('Referer', 'https://club.example/mi-perfil')
      .set('Cookie', `token=${token()}`)
      .send({})
      .expect(200);
    await post('autorizar', token())
      .set('Origin', 'https://club.example.atacante.test')
      .send({})
      .expect(403);
  });
});
