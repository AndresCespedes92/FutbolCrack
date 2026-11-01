import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
export interface RangoEstadistico {
  desde: string;
  hasta: string;
}
export interface DatosReporte extends RangoEstadistico {
  zonaHoraria: string;
}
export interface PublicacionesPorUsuario extends DatosReporte {
  datos: { usuarioId: string | null; nombre: string; nombreUsuario: string; cantidad: number }[];
}
export interface ComentariosTotales extends DatosReporte {
  total: number;
  dias: { fecha: string; cantidad: number }[];
}
export interface ComentariosPorPublicacion extends DatosReporte {
  datos: { publicacionId: string; titulo: string; cantidad: number }[];
}
// Transporte de cantidades ya calculadas por MongoDB. Ningún componente descarga contenido para contarlo.
@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly http = inject(HttpClient);
  publicaciones(rango: RangoEstadistico) {
    return this.http.get<PublicacionesPorUsuario>(
      `${API_URL}/estadisticas/publicaciones-por-usuario`,
      { params: { ...rango }, withCredentials: true },
    );
  }
  totalComentarios(rango: RangoEstadistico) {
    return this.http.get<ComentariosTotales>(`${API_URL}/estadisticas/comentarios-totales`, {
      params: { ...rango },
      withCredentials: true,
    });
  }
  comentariosPorPublicacion(rango: RangoEstadistico) {
    return this.http.get<ComentariosPorPublicacion>(
      `${API_URL}/estadisticas/comentarios-por-publicacion`,
      { params: { ...rango }, withCredentials: true },
    );
  }
}
