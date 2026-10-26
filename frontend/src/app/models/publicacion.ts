// Los tipos describen publicaciones, no roles: todas las personas usan el mismo perfil.
export interface Publicacion {
  id: number;
  autorId: number;
  autor: string;
  usuario: string;
  iniciales: string;
  tipo: 'Jugada' | 'Entrenamiento' | 'Comentario' | 'Prueba de jugadores';
  contexto: string;
  titulo: string;
  mensaje: string;
  imagen?: string;
  imagenDescripcion?: string;
  videoDemo?: boolean;
  convocatoria?: PruebaJugadores;
  likes: number;
  comentarios: number;
}

// Datos opcionales de una prueba, usados únicamente cuando la publicación la anuncia.
export interface PruebaJugadores {
  categoria: string;
  lugar: string;
  fecha: string;
  requisitos: string;
}
