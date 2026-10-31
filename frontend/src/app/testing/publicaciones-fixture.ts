import { Usuario } from '../services/auth';
import { Publicacion } from '../services/publicaciones';
// Datos exclusivos de pruebas: nunca se envían a la API real.
export const API_PRUEBA = 'https://futbol-crackbackend.vercel.app';
export const jugadorPrueba: Usuario = {
  id: '000000000000000000000001',
  nombre: 'Camila',
  apellido: 'Gómez',
  correo: 'camila@ejemplo.com',
  nombreUsuario: 'camila.8',
  fechaNacimiento: '2004-05-10',
  descripcion: 'Mediocampista',
  imagenPerfil: '/foto-perfil.png',
  perfil: 'usuario',
};
export function publicacionPrueba(numero = 1): Publicacion {
  return {
    _id: numero.toString().padStart(24, '0'),
    autorId: {
      _id: jugadorPrueba.id,
      nombre: jugadorPrueba.nombre,
      apellido: jugadorPrueba.apellido,
      nombreUsuario: jugadorPrueba.nombreUsuario,
      imagenPerfil: jugadorPrueba.imagenPerfil,
    },
    titulo: `Jugada ${numero}`,
    descripcion: 'Entrenamiento del club',
    contenido: 'Entrenamiento del club',
    multimediaUrl: '/foto-jugada.png',
    tipoMultimedia: 'imagen',
    cantidadLikes: 2,
    meGusta: false,
    activo: true,
    createdAt: '2026-10-31T12:00:00Z',
    updatedAt: '2026-10-31T12:00:00Z',
  };
}
export function paginaPrueba(
  publicaciones: Publicacion[],
  total = publicaciones.length,
  offset = 0,
  limit = 10,
) {
  return { publicaciones, total, offset, limit, hayMas: offset + publicaciones.length < total };
}
