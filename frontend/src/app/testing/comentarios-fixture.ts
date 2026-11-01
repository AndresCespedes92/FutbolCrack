import { HttpTestingController } from '@angular/common/http/testing';
import { Comentario, ListadoComentarios } from '../services/comentarios';
import { API_PRUEBA, jugadorPrueba } from './publicaciones-fixture';
export function comentarioPrueba(
  numero = 1,
  publicacionId = '000000000000000000000001',
): Comentario {
  return {
    _id: (100 + numero).toString().padStart(24, '0'),
    publicacionId,
    autorId: {
      _id: jugadorPrueba.id,
      nombre: jugadorPrueba.nombre,
      apellido: jugadorPrueba.apellido,
      imagenPerfil: jugadorPrueba.imagenPerfil,
    },
    texto: `Comentario ${numero}`,
    modificado: false,
    createdAt: '2026-11-01T12:00:00Z',
    updatedAt: '2026-11-01T12:00:00Z',
  };
}
export function paginaComentarios(
  comentarios: Comentario[] = [],
  total = comentarios.length,
  offset = 0,
): ListadoComentarios {
  return { comentarios, total, offset, limit: 3, hayMas: offset + comentarios.length < total };
}
export function responderComentariosVacios(http: HttpTestingController): void {
  for (const solicitud of http.match(
    (req) =>
      req.url.startsWith(`${API_PRUEBA}/publicaciones/`) &&
      req.url.endsWith('/comentarios') &&
      req.method === 'GET',
  )) {
    if (
      solicitud.request.params.get('limit') !== '3' ||
      solicitud.request.params.get('offset') !== '0'
    ) {
      throw new Error('Los comentarios iniciales deben solicitarse con offset 0 y limit 3');
    }
    solicitud.flush(paginaComentarios());
  }
}
