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
  SetMetadata,
  UseGuards,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AuthService } from './auth.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './guards/auth.guard.js';
import { SOLO_COOKIE_SESION } from './sesion.constants.js';
import { guardarCookieSesion, opcionesCookieSesion } from './sesion-cookie.js';

/**
 * Adaptador HTTP de autenticación: decoradores combinan /auth con cada ruta.
 * ValidationPipe global comprueba DTO antes de ejecutar la lógica; el middleware valida origen
 * y AuthGuard protege me/autorizar/refrescar. @Res({passthrough:true}) permite escribir
 * Set-Cookie y seguir devolviendo el JSON normal de Nest, sin exponer el JWT al frontend.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
   * POST /auth/login devuelve 200 al validar credenciales y envía el JWT en cookie HttpOnly.
   * El resultado del servicio incluye access_token para uso interno; este método selecciona
   * solo usuario/fechas/mensaje para el JSON. Nest transforma UnauthorizedException en 401.
   * La cookie la administra el navegador; withCredentials y el origen permitido hacen posible
   * el intercambio entre Angular y API, sin permitir que JavaScript lea el valor HttpOnly.
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

    guardarCookieSesion(respuesta, resultado.access_token, resultado.expiraEn);
    // Se eligen campos positivos: el token interno NUNCA se incluye en el JSON.
    return {
      mensaje: 'Inicio de sesión correcto',
      usuario: resultado.usuario,
      emitidaEn: resultado.emitidaEn,
      expiraEn: resultado.expiraEn,
      horaServidor: resultado.horaServidor,
    };
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
    @Req()
    request: Request & {
      user?: { sub: string; perfil: string };
    },
  ) {
    // El Guard ya verificó el token y agregó su contenido
    // a request.user.
    const usuarioId = request.user!.sub;

    // Consultamos MongoDB y devolvemos el perfil.
    return this.authService.obtenerMiPerfil(usuarioId);
  }

    /**
   * POST /auth/logout expira la cookie con el mismo nombre/ruta/opciones usados al emitirla.
   * No cambia la contraseña, no elimina la cuenta ni revoca todas las copias posibles del JWT.
   * Angular limpia su estado al recibir éxito. Como operación de sesión, requiere origen válido
   * en el middleware aunque no lleve @UseGuards: sin Origin/Referer puede responder 403.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  cerrarSesion(@Res({ passthrough: true }) respuesta: Response) {
    // Eliminamos la cookie con el mismo nombre y ruta.
    respuesta.clearCookie('token', opcionesCookieSesion());

    return {
      mensaje: 'Sesión cerrada correctamente',
    };
  }

  /**
   * SOLO_COOKIE_SESION hace que AuthGuard ignore Bearer en esta ruta: probamos la sesión del
   * navegador, no un token alternativo. El método confirma la cookie sin sustituirla ni renovar exp.
   * Para probar 401 en Postman, enviar Origin permitido y retirar la cookie de ese dominio.
   */
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @SetMetadata(SOLO_COOKIE_SESION, true)
  @UseGuards(AuthGuard)
  autorizar(@Req() request: Request & { user?: JwtPayload }) {
    return this.authService.autorizar(request.user!);
  }

  /**
   * Renovación explícita con cookie vigente: guard y servicio comprueban identidad/exp.
   * Solo después se guarda otra cookie y se devuelven metadatos. No se devuelve access_token.
   * Un vencimiento no se resuelve con este endpoint: se rechaza 401 y corresponde login nuevo.
   */
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @SetMetadata(SOLO_COOKIE_SESION, true)
  @UseGuards(AuthGuard)
  async refrescar(
    @Req() request: Request & { user?: JwtPayload },
    @Res({ passthrough: true }) respuesta: Response,
  ) {
    const resultado = await this.authService.refrescar(request.user!);
    guardarCookieSesion(respuesta, resultado.access_token, resultado.expiraEn);
    return {
      usuario: resultado.usuario,
      emitidaEn: resultado.emitidaEn,
      expiraEn: resultado.expiraEn,
      horaServidor: resultado.horaServidor,
    };
  }
}
