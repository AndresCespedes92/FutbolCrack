import { ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { vi } from 'vitest';
import { ValidarOrigenMiddleware } from './validar-origen.middleware.js';
describe('ValidarOrigenMiddleware: defensa CSRF y compatibilidad', () => {
  const middleware = new ValidarOrigenMiddleware();
  afterEach(() => vi.unstubAllEnvs());
  function comprobar(
    method: string,
    url: string,
    headers: Record<string, string> = {},
  ) {
    const next = vi.fn();
    const ejecutar = () =>
      middleware.use(
        { method, originalUrl: url, headers } as Request,
        {} as Response,
        next,
      );
    return { ejecutar, next };
  }
  it.each(['GET', 'HEAD', 'OPTIONS'])(
    '%s no altera estado y conserva acceso a lectura/preflight',
    (method) => {
      const { ejecutar, next } = comprobar(method, '/publicaciones');
      ejecutar();
      expect(next).toHaveBeenCalledTimes(1);
    },
  );
  it('rechaza escritura con cookies sin Origin/Referer', () => {
    const { ejecutar, next } = comprobar('PUT', '/comentarios/1', {
      cookie: 'token=prueba',
    });
    expect(ejecutar).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });
  it('no bloquea un cliente Bearer sin cookies por ausencia de Origin', () => {
    const { ejecutar, next } = comprobar('POST', '/publicaciones', {
      authorization: 'Bearer prueba',
    });
    ejecutar();
    expect(next).toHaveBeenCalledTimes(1);
  });
  it('no confía en Origin null ni en Referer mal formado', () => {
    for (const headers of [{ origin: 'null' }, { referer: 'no-es-url' }])
      expect(comprobar('POST', '/auth/refrescar', headers).ejecutar).toThrow(
        ForbiddenException,
      );
  });
  it('usa FRONTEND_URL exacto también para operaciones del perfil', () => {
    vi.stubEnv('FRONTEND_URL', 'https://club.example');
    const { ejecutar, next } = comprobar('DELETE', '/publicaciones/1', {
      origin: 'https://club.example',
      cookie: 'token=prueba',
    });
    ejecutar();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
