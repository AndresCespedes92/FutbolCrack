import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard.js';

// GET sigue público: un JWT válido aporta identidad para meGusta; uno ausente/vencido no bloquea leer.
// No renueva cookies ni se usa para escrituras. Los POST/DELETE conservan AuthGuard obligatorio.
@Injectable()
export class AutenticacionOpcionalGuard implements CanActivate {
  constructor(private readonly authGuard: AuthGuard) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    try {
      return await this.authGuard.canActivate(contexto);
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
      const request = contexto
        .switchToHttp()
        .getRequest<Request & { user?: unknown }>();
      delete request.user;
      return true;
    }
  }
}
