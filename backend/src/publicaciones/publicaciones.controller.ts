import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseFilePipeBuilder,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { EditarPublicacionDto } from './dto/editar-publicacion.dto.js';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { AutenticacionOpcionalGuard } from './guards/autenticacion-opcional.guard.js';
import { MAXIMO_IMAGEN_BYTES } from './publicaciones.constants.js';

interface RequestAutenticada extends Request {
  user?: { sub: string; perfil: string };
}

/**
 * API de jugadas: GET de listado/detalle admite identidad opcional para calcular meGusta;
 * POST/DELETE requieren AuthGuard. El autor sale del JWT y las reglas de baja/likes del servicio.
 * PATCH edita textos/URL sin cambiar el tipo. DELETE de publicación es baja lógica, mientras
 * DELETE de /likes retira solamente el voto del usuario autenticado.
 */
@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Get()
  @UseGuards(AutenticacionOpcionalGuard)
  listar(
    @Query() consulta: ListarPublicacionesDto,
    @Req() request: RequestAutenticada,
  ) {
    // usuarioId de query filtra al autor; la identidad del lector viene exclusivamente del JWT verificado.
    return this.publicacionesService.listar(consulta, request.user?.sub);
  }

  @Get(':id')
  @UseGuards(AutenticacionOpcionalGuard)
  obtenerPorId(@Param('id') id: string, @Req() request: RequestAutenticada) {
    return this.publicacionesService.obtenerPorId(id, request.user?.sub);
  }

  /**
   * Crear jugada combina DTO de texto y archivo opcional multipart en memoria.
   * Multer limita a 5 MiB y ParseFilePipe verifica tipo/tamaño antes del servicio; la validación
   * de archivo real es más fuerte que confiar en extensión o MIME informado por Angular.
   * AuthGuard identifica al autor. No se fija Content-Type manualmente desde el navegador:
   * FormData debe generar el boundary. Un POST exitoso usa el 201 predeterminado de Nest.
   */
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      // Multer admite hasta este tamaño; el pipe usa < y por eso recibe máximo + 1 abajo.
      limits: { fileSize: MAXIMO_IMAGEN_BYTES },
    }),
  )
  crear(
    @Req() request: RequestAutenticada,
    @Body() datos: CreatePublicacionDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        // Se validan firmas del archivo, no solo extensión/MIME declarado por el navegador.
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
          errorMessage: 'La imagen debe ser JPEG, PNG o WebP',
        })
        .addMaxSizeValidator({
          maxSize: MAXIMO_IMAGEN_BYTES + 1,
          message: 'La imagen admite hasta 5 MB',
        })
        .build({ fileIsRequired: false }),
    )
    imagen?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(request.user!.sub, datos, imagen);
  }

  @Post(':id/likes')
  @UseGuards(AuthGuard)
  darMeGusta(@Param('id') id: string, @Req() request: RequestAutenticada) {
    return this.publicacionesService.darMeGusta(id, request.user!.sub);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  editar(
    @Param('id') id: string,
    @Req() request: RequestAutenticada,
    @Body() datos: EditarPublicacionDto,
  ) {
    return this.publicacionesService.editar(id, request.user!.sub, datos);
  }

  @Delete(':id/likes')
  @UseGuards(AuthGuard)
  quitarMeGusta(@Param('id') id: string, @Req() request: RequestAutenticada) {
    return this.publicacionesService.quitarMeGusta(id, request.user!.sub);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  darDeBaja(@Param('id') id: string, @Req() request: RequestAutenticada) {
    // Nunca se recibe el rol ni el autor desde el body para conceder permisos de baja.
    return this.publicacionesService.darDeBaja(id, request.user!.sub);
  }
}
