import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdministradorGuard } from '../usuarios/guards/administrador.guard.js';
import { RangoFechasDto } from '../common/estadisticas/rango-fechas.dto.js';
import { ComentariosService } from './comentarios.service.js';

// Solo cantidades: no entrega textos ni datos privados de los autores de comentarios.
@Controller('estadisticas')
@UseGuards(AuthGuard, AdministradorGuard)
export class EstadisticasComentariosController {
  constructor(private readonly comentarios: ComentariosService) {}
  @Get('comentarios-totales')
  total(@Query() rango: RangoFechasDto) {
    return this.comentarios.totalEnRango(rango);
  }
  @Get('comentarios-por-publicacion')
  porPublicacion(@Query() rango: RangoFechasDto) {
    return this.comentarios.porPublicacionEnRango(rango);
  }
}
