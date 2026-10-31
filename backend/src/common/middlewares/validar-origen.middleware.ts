
import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';

import type {
  Request,
  Response,
  NextFunction,
} from 'express';

/**
 * Middleware para verificar el origen de las solicitudes.
 *
 * Protege las operaciones que modifican datos
 * frente a solicitudes provenientes de otros sitios.
 */
@Injectable()
export class ValidarOrigenMiddleware implements NestMiddleware {

  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {

    // Las consultas de lectura no modifican información.
    const metodosSeguros = ['GET', 'HEAD', 'OPTIONS'];

    if (metodosSeguros.includes(req.method)) {
      next();
      return;
    }

    // Orígenes permitidos para FutbolCrack.
    const origenesPermitidos = [
      'http://localhost:4200',
      process.env.FRONTEND_URL,
    ].filter((origen): origen is string => Boolean(origen));

    const origen = req.headers.origin;

    // Si hay un Origin y no está autorizado, rechazamos.
    if (origen && !origenesPermitidos.includes(origen)) {
      throw new ForbiddenException(
        'El origen de la solicitud no está autorizado.',
      );
    }

    // Permitimos continuar con la operación.
    next();
  }
}
