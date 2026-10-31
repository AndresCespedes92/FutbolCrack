import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsuariosService } from '../usuarios.service.js';

interface RequestAutenticada extends Request {
  user?: { sub: string };
}

// AuthGuard comprueba el carnet; este guard comprueba el permiso actual en el padrón del club.
// Vive en UsuariosModule para reutilizar UsuariosService sin crear una dependencia circular en seguridad.
@Injectable()
export class AdministradorGuard implements CanActivate {
  constructor(private readonly usuariosService: UsuariosService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request = contexto.switchToHttp().getRequest<RequestAutenticada>();
    const usuarioId = request.user?.sub;
    // Debe ejecutarse después de AuthGuard; no se toma identidad ni rol desde body/query/headers libres.
    if (typeof usuarioId !== 'string' || !usuarioId) {
      throw new UnauthorizedException(
        'Debés iniciar sesión para acceder a este recurso',
      );
    }
    // Consultamos el rol actual: un JWT anterior no conserva permisos si fueron retirados en MongoDB.
    const usuario = await this.usuariosService.findById(usuarioId);
    if (!usuario)
      throw new UnauthorizedException('El usuario autenticado no existe');
    if (usuario.perfil !== 'administrador') {
      throw new ForbiddenException(
        'Solo un administrador puede consultar el listado de usuarios',
      );
    }
    return true;
  }
}
