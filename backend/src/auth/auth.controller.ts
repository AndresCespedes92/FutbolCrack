//Recibe las solicitudes de los futbolistas y la deriva al departamento que corresponde.

//AuthController recibe la petición HTTP.
//CreateUsuarioDto valida los datos recibidos.
//AuthService procesa el registro y genera el hash.
//UsuariosService guarda el usuario en MongoDB
// Como el recepcionista del club: recibe la ficha del jugador y su fotografía,
//  verifica que la foto tenga un formato permitido y después entrega todo al departamento de inscripciones..

import { Res } from '@nestjs/common';
import type { Response } from 'express';

import type { Request } from 'express';
import { AuthGuard } from './guards/auth.guard.js';

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
  Get,
  Req,
  UseGuards
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
 * Valida las credenciales y guarda el JWT
 * en una cookie HttpOnly.
 */
@Post('login')
@HttpCode(HttpStatus.OK)
async login(
  @Body() datos: LoginDto,
  @Res({ passthrough: true }) respuesta: Response,
) {
  // AuthService comprueba las credenciales y genera el JWT.
  const resultado = await this.authService.login(
    datos.identificador,
    datos.password,
  );

  // En producción, la cookie debe viajar por HTTPS.
  const esProduccion = process.env.NODE_ENV === 'production';

  // El navegador recibe el JWT mediante Set-Cookie.
  respuesta.cookie('token', resultado.access_token, {
    httpOnly: true,
    secure: esProduccion,
    sameSite: esProduccion ? 'none' : 'lax',
    maxAge: 20 * 1000,
    path: '/',
  });

  // Conservamos temporalmente access_token para que
  // las pruebas existentes de Postman sigan funcionando.
  // Lo retiraremos cuando completemos el flujo con cookies.
  return resultado;
}


/**
 * GET /auth/me
 *
 * Devuelve los datos del usuario autenticado.
 * AuthGuard verifica el JWT enviado por cookie o Bearer.
 */
@Get('me')
@UseGuards(AuthGuard)
async obtenerMiPerfil(
  @Req() request: Request & {
    user?: { sub: string; perfil: string };
  },
) {
  // El Guard ya verificó el token y agregó su contenido
  // a request.user.
  const usuarioId = request.user!.sub;

  // Consultamos MongoDB y devolvemos el perfil.
  return this.authService.obtenerMiPerfil(usuarioId);
}


}
