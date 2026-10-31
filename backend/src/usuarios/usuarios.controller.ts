
import { Controller, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdministradorGuard } from './guards/administrador.guard.js';

/**
 * Controlador de usuarios de FutbolCrack.
 *
 * Su responsabilidad es recibir solicitudes HTTP
 * relacionadas con la consulta de usuarios.
 *
 * El registro y el login se implementarán
 * en AuthController, dentro del módulo de autenticación.
 */
@Controller('usuarios')
export class UsuariosController {

  /**
   * Inyección de dependencias:
   *
   * NestJS proporciona una instancia de UsuariosService
   * para utilizar sus métodos desde este controlador.
   */
  constructor(
    private readonly usuariosService: UsuariosService,
  ) {}

  /**
   * GET /usuarios
   *
   * Solicita al servicio todos los usuarios
   * registrados en MongoDB.
   *
   * Primero se verifica la sesión; luego el rol actual en MongoDB.
   * Un socio autenticado no tiene permiso para consultar todo el padrón.
   */
  @UseGuards(AuthGuard, AdministradorGuard)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }
}
