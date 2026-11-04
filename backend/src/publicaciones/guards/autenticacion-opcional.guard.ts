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

  /**
   * Reutiliza el guard fuerte en GET públicos: si la identidad es válida permite personalizar
   * meGusta; si falta/venció se elimina request.user y la lectura sigue como invitado.
   * Solo absorbe UnauthorizedException. Un error de base u otro fallo no se oculta como anónimo.
   * No usar este guard en escrituras ni afirmar que todo GET sin token devuelve 401.
   */
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
