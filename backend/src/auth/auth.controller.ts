//Recibe las solicitudes de los futbolistas y la deriva al departamento que corresponde.

//AuthController recibe la petición HTTP.
//CreateUsuarioDto valida los datos recibidos.
//AuthService procesa el registro y genera el hash.
//UsuariosService guarda el usuario en MongoDB
// Como el recepcionista del club: recibe la ficha del jugador y su fotografía,
//  verifica que la foto tenga un formato permitido y después entrega todo al departamento de inscripciones..


import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

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
   *
   * Recibe los datos del usuario y una foto opcional.
   * El formulario debe enviarse como multipart/form-data.
   */
  @Post('registro')
  @UseInterceptors(
    FileInterceptor('imagen', {
      // Guardamos temporalmente la imagen en memoria.
      storage: memoryStorage(),

      // Limitamos el tamaño máximo a 5 MB.
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  registrar(
    @Body() datos: CreateUsuarioDto,

    // Valida la imagen antes de entregarla al servicio.
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          fileIsRequired: false,
        }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.authService.registrar(datos, imagen);
  }

  /**
   * POST /auth/login
   *
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
