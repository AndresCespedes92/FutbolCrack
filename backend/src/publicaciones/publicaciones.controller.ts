
import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { AuthGuard } from '../auth/guards/auth.guard.js';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';

/**
 * Request autenticada.
 *
 * AuthGuard agrega los datos del JWT
 * a request.user después de verificarlo.
 */
interface RequestAutenticada extends Request {
  user?: {
    sub: string;
    perfil: string;
  };
}

/**
 * CONTROLLER DE PUBLICACIONES
 *
 * Recibe las peticiones HTTP y delega
 * la lógica de negocio a PublicacionesService.
 */
@Controller('publicaciones')
export class PublicacionesController {

  constructor(
    private readonly publicacionesService: PublicacionesService,
  ) {}

  /**
   * GET /publicaciones
   *
   * Endpoint público.
   * Permite consultar las últimas 50 publicaciones.
   */
  @Get()
  listar() {
    return this.publicacionesService.listar();
  }

  /**
   * POST /publicaciones
   *
   * Endpoint privado.
   * Solamente un usuario autenticado puede publicar.
   */
  @Post()
  @UseGuards(AuthGuard)
  crear(
    @Req() request: RequestAutenticada,
    @Body() datos: CreatePublicacionDto,
  ) {

    // El autor se obtiene del JWT validado.
    // No aceptamos autorId desde el frontend.
    const autorId = request.user!.sub;

    // ValidationPipe global valida el DTO antes de entrar aquí.
    // El servicio conserva sus reglas de negocio y el contrato existente de guardado.
    return this.publicacionesService.crear(
      autorId,
      datos.contenido,
    );
  }
}
