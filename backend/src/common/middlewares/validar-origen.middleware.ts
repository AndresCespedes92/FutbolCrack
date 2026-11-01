import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { origenesPermitidos } from '../origenes-permitidos.js';

@Injectable()
export class ValidarOrigenMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }
    const permitidos = origenesPermitidos();
    let origen = req.headers.origin;
    if (!origen && req.headers.referer) {
      try {
        origen = new URL(req.headers.referer).origin;
      } catch {
        throw new ForbiddenException('El origen de la solicitud no es válido');
      }
    }
    // CSRF: Origin/Referer son del navegador, no un permiso basado en CORS o rol del cliente.
    if (origen && !permitidos.includes(origen))
      throw new ForbiddenException(
        'El origen de la solicitud no está autorizado',
      );
    const ruta = req.originalUrl.split('?')[0].replace(/\/$/, '');
    const operacionSesion = [
      '/auth/login',
      '/auth/logout',
      '/auth/autorizar',
      '/auth/refrescar',
    ].includes(ruta);
    // Fail closed para cookies y operaciones de sesión. Clientes Bearer sin cookie conservan su uso.
    if (!origen && (req.headers.cookie || operacionSesion))
      throw new ForbiddenException(
        'Se requiere un Origin o Referer permitido para esta operación',
      );
    next();
  }
}
