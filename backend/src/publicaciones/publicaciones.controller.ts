import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
import { AutenticacionOpcionalGuard } from './guards/autenticacion-opcional.guard.js';
import { MAXIMO_IMAGEN_BYTES } from './publicaciones.constants.js';

interface RequestAutenticada extends Request {
  user?: { sub: string; perfil: string };
}

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
