import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
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
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
  ) {}

    /**
   * Frontera de autenticación para peticiones protegidas. ExecutionContext da el Request HTTP;
   * Reflector lee si la ruta exige cookie. En las otras rutas se prioriza Bearer sobre cookie.
   * verifyAsync valida criptográficamente la firma y el vencimiento; después exigimos sub/iat/exp
   * con tipos/formato esperados y consultamos el usuario actual en MongoDB.
   * Usuario ausente, deshabilitado o token inválido produce UnauthorizedException (401).
   * El perfil que se asigna a request.user proviene de la ficha, no del body ni de un rol viejo
   * del JWT. Un fallo de base fuera del catch no se disfraza como un problema de credenciales.
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

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (
        typeof payload.sub !== 'string' ||
        !Types.ObjectId.isValid(payload.sub) ||
        typeof payload.exp !== 'number' ||
        !Number.isFinite(payload.exp) ||
        typeof payload.iat !== 'number' ||
        !Number.isFinite(payload.iat)
      ) {
        throw new UnauthorizedException(
          'La sesión no contiene identidad y vencimiento válidos',
        );
      }
    } catch {
      throw new UnauthorizedException('La sesión es inválida o ha vencido');
    }
    // La consulta queda FUERA del catch de JWT: una caída de MongoDB es 500, no una falsa sesión 401.
    const identidad = new Types.ObjectId(payload.sub);
    const usuario = await this.usuarioModel
      .findById(identidad)
      .select('_id perfil activo')
      .lean()
      .exec();
    if (
      !usuario ||
      usuario.activo === false ||
      payload.exp! * 1000 <= Date.now()
    ) {
      throw new UnauthorizedException(
        'La cuenta no está habilitada o la sesión venció',
      );
    }
    // La ficha actual manda sobre el rol anterior del token, sin guardar estado dentro del JWT.
    request.user = {
      ...payload,
      sub: identidad.toString(),
      perfil: usuario.perfil,
    };
    return true;
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
