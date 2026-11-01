import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdministradorGuard } from '../usuarios/guards/administrador.guard.js';
import { RangoFechasDto } from '../common/estadisticas/rango-fechas.dto.js';
import { PublicacionesService } from './publicaciones.service.js';

// Reporte del padrón de jugadas: reutiliza PublicacionesModule y su servicio, sin otra API de bajas.
@Controller('estadisticas')
@UseGuards(AuthGuard, AdministradorGuard)
export class EstadisticasPublicacionesController {
  constructor(private readonly publicaciones: PublicacionesService) {}
  @Get('publicaciones-por-usuario')
  porUsuario(@Query() rango: RangoFechasDto) {
    return this.publicaciones.publicacionesPorUsuario(rango);
  }
}
