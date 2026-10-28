//Recibe las solicitudes de los futbolistas y la deriva al departamento que corresponde.

//AuthController recibe la petición HTTP.
//CreateUsuarioDto valida los datos recibidos.
//AuthService procesa el registro y genera el hash.
//UsuariosService guarda el usuario en MongoDB.


import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';

// Todas las rutas de este controlador comienzan con /auth.
@Controller('auth')
export class AuthController {

  // NestJS inyecta AuthService automáticamente.
  constructor(
    private readonly authService: AuthService,
  ) {}

  // POST /auth/registro
  // Recibe los datos del formulario de Angular.
  @Post('registro')
  registrar(@Body() datos: CreateUsuarioDto) {

    // Delegamos la lógica de negocio a AuthService.
    return this.authService.registrar(datos);
  }
}
