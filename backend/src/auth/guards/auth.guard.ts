import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { SOLO_COOKIE_SESION } from '../sesion.constants.js';
import type { Request } from 'express';

// Información que guardamos en el JWT al iniciar sesión.
export interface JwtPayload {
  sub: string;
  perfil: string;
  iat?: number;
  exp?: number;
}

// Extendemos Request para incorporar el usuario autenticado.
interface RequestAutenticada extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Se ejecuta antes del método del Controller.
   *
   * Permite acceder solamente si recibe un JWT válido.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestAutenticada>();

    // Opción 1: buscar el JWT en Authorization: Bearer ...
    const soloCookie = this.reflector.get<boolean>(
      SOLO_COOKIE_SESION,
      context.getHandler(),
    );
    const tokenBearer = soloCookie ? null : this.extraerTokenBearer(request);

    // Opción 2: buscar el JWT en la cookie "token".
    // Solo utilizamos la cookie cuando no hay Bearer.
    const tokenCookie = tokenBearer ? null : this.extraerTokenCookie(request);

    const token = tokenBearer ?? tokenCookie;

    if (!token) {
      throw new UnauthorizedException(
        'Debés iniciar sesión para acceder a este recurso',
      );
    }

    try {
      // Verifica la firma y la expiración del JWT.
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (
        typeof payload.sub !== 'string' ||
        !payload.sub ||
        typeof payload.exp !== 'number' ||
        !Number.isFinite(payload.exp) ||
        typeof payload.iat !== 'number' ||
        !Number.isFinite(payload.iat)
      ) {
        throw new UnauthorizedException(
          'La sesión no contiene identidad y vencimiento válidos',
        );
      }
      // Dejamos la identidad disponible para el Controller.
      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('La sesión es inválida o ha vencido');
    }
  }

  /**
   * Extrae el JWT desde el encabezado Authorization.
   */
  private extraerTokenBearer(request: Request): string | null {
    const authorization = request.headers.authorization;

    if (!authorization) return null;

    const [tipo, token] = authorization.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  /**
   * Extrae el JWT desde el encabezado Cookie.
   *
   * Ejemplo:
   * Cookie: token=eyJhbGciOi...
   */
  private extraerTokenCookie(request: Request): string | null {
    const cookies = request.headers.cookie;

    if (!cookies) return null;

    const cookieToken = cookies
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('token='));

    if (!cookieToken) return null;

    return cookieToken.substring('token='.length) || null;
  }
}
