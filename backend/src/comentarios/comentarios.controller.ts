import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { ComentariosService } from './comentarios.service.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';
import { EditarComentarioDto } from './dto/editar-comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';

interface RequestAutenticada extends Request {
  user?: { sub: string };
}

// Rutas absolutas en un único controller: comentarios están relacionados con una publicación,
// pero se editan por su id propio. La lectura pública sigue la política del feed existente.
@Controller()
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post('publicaciones/:publicacionId/comentarios')
  @UseGuards(AuthGuard)
  crear(
    @Param('publicacionId') publicacionId: string,
    @Req() request: RequestAutenticada,
    @Body() datos: CrearComentarioDto,
  ) {
    return this.comentariosService.crear(
      publicacionId,
      request.user!.sub,
      datos,
    );
  }

  @Get('publicaciones/:publicacionId/comentarios')
  listar(
    @Param('publicacionId') publicacionId: string,
    @Query() consulta: ListarComentariosDto,
  ) {
    return this.comentariosService.listar(publicacionId, consulta);
  }

  @Put('comentarios/:id')
  @UseGuards(AuthGuard)
  editar(
    @Param('id') id: string,
    @Req() request: RequestAutenticada,
    @Body() datos: EditarComentarioDto,
  ) {
    return this.comentariosService.editar(id, request.user!.sub, datos);
  }
}
