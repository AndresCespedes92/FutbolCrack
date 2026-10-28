//Recibe las solicitudes de los futbolistas y la deriva al departamento que corresponde.

//AuthController recibe la petición HTTP.
//CreateUsuarioDto valida los datos recibidos.
//AuthService procesa el registro y genera el hash.
//UsuariosService guarda el usuario en MongoDB.



import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  /**
   * POST /auth/registro
   * Registra un nuevo usuario.
   * Devuelve HTTP 201 si se creó correctamente.
   */
  @Post('registro')
  registrar(@Body() datos: CreateUsuarioDto) {
    return this.authService.registrar(datos);
  }

  /**
   * POST /auth/login
   * Recibe las credenciales y devuelve un JWT.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() datos: LoginDto) {
    return this.authService.login(
      datos.identificador,
      datos.password,
    );
  }
}
