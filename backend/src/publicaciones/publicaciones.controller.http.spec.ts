import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { Publicacion } from './entities/publicacion.entity.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

// Se ejercitan controller, DTO, ValidationPipe y servicio reales. Solo el guardado está simulado.
// No importamos AppModule ni main: no se cargan credenciales ni se conecta MongoDB/Cloudinary.
describe('POST /publicaciones: contrato de contenido y validación HTTP', () => {
  let app: INestApplication;
  let token: string;
  const autorId = '000000000000000000000001';
  const guardar = vi.fn();

  class ModeloPublicacionDePrueba {
    constructor(private readonly datos: Record<string, unknown>) {}
    save() {
      return guardar(this.datos);
    }
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'clave-exclusiva-tests-publicaciones',
          signOptions: { expiresIn: '1m' },
        }),
      ],
      controllers: [PublicacionesController],
      providers: [
        AuthGuard,
        PublicacionesService,
        {
          provide: getModelToken(Publicacion.name),
          useValue: ModeloPublicacionDePrueba,
        },
      ],
    }).compile();
    app = module.createNestApplication();
    // Mismas opciones que main.ts; no cambiamos su configuración para hacer pasar los tests.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    token = module.get(JwtService).sign({ sub: autorId, perfil: 'usuario' });
  });

  beforeEach(() => {
    guardar
      .mockReset()
      .mockImplementation(async (datos) => ({
        _id: '000000000000000000000011',
        ...datos,
      }));
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('mantiene el 401 sin sesión aunque el contenido sea válido', async () => {
    await request(app.getHttpServer())
      .post('/publicaciones')
      .send({ contenido: 'Entrenamiento del día' })
      .expect(401);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('acepta el body de Angular, recorta espacios y toma el autor del JWT', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/publicaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido: '  Hoy entrenamos pases cortos.  ' })
      .expect(201);
    expect(respuesta.body.contenido).toBe('Hoy entrenamos pases cortos.');
    expect(respuesta.body.autorId).toBe(autorId);
    expect(respuesta.body.multimediaUrl).toBe('');
    expect(respuesta.body.tipoMultimedia).toBe('ninguno');
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(guardar.mock.calls[0][0].autorId.toHexString()).toBe(autorId);
  });

  it.each([
    ['un carácter', 'a'],
    ['2000 caracteres', 'a'.repeat(2000)],
    ['espacios externos con 2000 caracteres útiles', `  ${'a'.repeat(2000)}  `],
    ['saltos de línea internos', 'Primera línea\nSegunda línea'],
  ])('acepta %s respetando las reglas existentes', async (_caso, contenido) => {
    const respuesta = await request(app.getHttpServer())
      .post('/publicaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido })
      .expect(201);
    expect(respuesta.body.contenido).toBe(contenido.trim());
    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['campo ausente', {}],
    ['texto vacío', { contenido: '' }],
    ['solo espacios y saltos', { contenido: ' \n\t ' }],
    ['null', { contenido: null }],
    ['número', { contenido: 123 }],
    ['booleano', { contenido: true }],
    ['array', { contenido: ['texto'] }],
    ['objeto', { contenido: { texto: 'texto' } }],
    ['2001 caracteres', { contenido: 'a'.repeat(2001) }],
    [
      'autor enviado por cliente',
      { contenido: 'Texto válido', autorId: 'otro-autor' },
    ],
    [
      'título aún fuera del contrato',
      { contenido: 'Texto válido', titulo: 'No implementado' },
    ],
  ])(
    'responde 400 por %s sin guardar ni producir un 500',
    async (_caso, body) => {
      const respuesta = await request(app.getHttpServer())
        .post('/publicaciones')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
      expect(respuesta.body.statusCode).toBe(400);
      expect(Array.isArray(respuesta.body.message)).toBe(true);
      expect(respuesta.body.message.length).toBeGreaterThan(0);
      expect(guardar).not.toHaveBeenCalled();
    },
  );

  it('conserva también el límite del servicio para caracteres que ocupan dos unidades UTF-16', async () => {
    // El servicio y los controles HTML cuentan con String.length; MaxLength puede contar puntos Unicode.
    const respuesta = await request(app.getHttpServer())
      .post('/publicaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido: '😀'.repeat(1001) })
      .expect(400);
    expect(respuesta.body.statusCode).toBe(400);
    expect(guardar).not.toHaveBeenCalled();
  });
});
