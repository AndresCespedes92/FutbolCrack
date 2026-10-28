
import { Controller, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';

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
   * IMPORTANTE:
   * Este endpoint es temporal para desarrollo.
   * Antes de publicar la aplicación debemos
   * protegerlo con JWT o limitar su acceso.
   */
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
  return this.usuariosService.findAll();
}
}
