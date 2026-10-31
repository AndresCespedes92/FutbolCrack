import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

// Integración HTTP local: guards y firmas reales, pero padrón simulado y sin conexión MongoDB.
// Esta clave existe solo en pruebas; no se lee ni cambia JWT_SECRET del entorno real.
describe('GET /usuarios: autenticación y rol administrador', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const usuarioId = '000000000000000000000001';
  const listado = [
    {
      _id: usuarioId,
      nombre: 'Mateo',
      apellido: 'Ríos',
      nombreUsuario: 'mateo.10',
      perfil: 'administrador',
    },
  ];
  const usuarios = { findById: vi.fn(), findAll: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'clave-exclusiva-tests-locales',
          signOptions: { expiresIn: '1m' },
        }),
      ],
      controllers: [UsuariosController],
      providers: [
        AuthGuard,
        AdministradorGuard,
        { provide: UsuariosService, useValue: usuarios },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    jwt = module.get(JwtService);
  });

  beforeEach(() => {
    usuarios.findById.mockReset();
    usuarios.findAll.mockReset().mockResolvedValue(listado);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  function token(perfil: string): string {
    return jwt.sign({ sub: usuarioId, perfil });
  }

  it('responde 401 sin autenticación y no consulta el padrón', async () => {
    await request(app.getHttpServer()).get('/usuarios').expect(401);
    expect(usuarios.findById).not.toHaveBeenCalled();
    expect(usuarios.findAll).not.toHaveBeenCalled();
  });

  it('responde 401 ante un JWT inválido antes de consultar usuarios', async () => {
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', 'Bearer token-de-prueba-invalido')
      .expect(401);
    expect(usuarios.findById).not.toHaveBeenCalled();
    expect(usuarios.findAll).not.toHaveBeenCalled();
  });

  it('responde 403 a un usuario normal autenticado', async () => {
    usuarios.findById.mockResolvedValue({ perfil: 'usuario' });
    const respuesta = await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token('usuario')}`)
      .expect(403);
    expect(respuesta.body.message).toContain('Solo un administrador');
    expect(usuarios.findById).toHaveBeenCalledWith(usuarioId);
    expect(usuarios.findAll).not.toHaveBeenCalled();
  });

  it('responde 200 al administrador y devuelve el listado sin credenciales', async () => {
    usuarios.findById.mockResolvedValue({ perfil: 'administrador' });
    const respuesta = await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token('administrador')}`)
      .expect(200);
    expect(respuesta.body).toEqual(listado);
    for (const usuario of respuesta.body) {
      expect(usuario).not.toHaveProperty('password');
      expect(usuario).not.toHaveProperty('passwordHash');
    }
    expect(usuarios.findById).toHaveBeenCalledWith(usuarioId);
    expect(usuarios.findAll).toHaveBeenCalledTimes(1);
  });

  it('no acepta un rol administrador enviado en query o cabecera libre', async () => {
    usuarios.findById.mockResolvedValue({ perfil: 'usuario' });
    await request(app.getHttpServer())
      .get('/usuarios?perfil=administrador')
      .set('perfil', 'administrador')
      .set('Authorization', `Bearer ${token('usuario')}`)
      .expect(403);
    expect(usuarios.findAll).not.toHaveBeenCalled();
  });

  it('revoca el permiso si el JWT decía administrador pero el rol actual es usuario', async () => {
    usuarios.findById.mockResolvedValue({ perfil: 'usuario' });
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token('administrador')}`)
      .expect(403);
    expect(usuarios.findAll).not.toHaveBeenCalled();
  });

  it('responde 401 si el usuario identificado por el JWT ya no existe', async () => {
    usuarios.findById.mockResolvedValue(null);
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token('administrador')}`)
      .expect(401);
    expect(usuarios.findAll).not.toHaveBeenCalled();
  });

  it('también permite al administrador autenticado mediante la cookie existente', async () => {
    usuarios.findById.mockResolvedValue({ perfil: 'administrador' });
    const respuesta = await request(app.getHttpServer())
      .get('/usuarios')
      .set('Cookie', `token=${token('administrador')}`)
      .expect(200);
    expect(respuesta.body).toEqual(listado);
    expect(usuarios.findAll).toHaveBeenCalledTimes(1);
  });
});
