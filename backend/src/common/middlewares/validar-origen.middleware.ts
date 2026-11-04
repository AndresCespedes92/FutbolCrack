import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { origenesPermitidos } from '../origenes-permitidos.js';

@Injectable()
export class ValidarOrigenMiddleware implements NestMiddleware {
  /**
   * Control de origen antes del controller para reducir CSRF en escrituras con cookies.
   * CORS controla qué respuestas puede leer un navegador; este middleware decide si continúa
   * la operación. Comprueba Origin y, si falta, origen de Referer contra una lista explícita.
   * GET/HEAD/OPTIONS siguen por esta capa; guards posteriores pueden exigir identidad.
   * Una escritura con cookie o una operación de sesión sin origen permitido devuelve 403,
   * incluso si el JWT era válido. Un cliente Bearer sin cookie conserva el comportamiento previsto.
   * En Postman hay que separar este 403 de un 401: enviar Origin permitido para probar autenticación.
   */
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
