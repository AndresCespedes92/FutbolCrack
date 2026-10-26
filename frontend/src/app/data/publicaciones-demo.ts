import { Publicacion } from '../models/publicacion';

// Personas, club, fechas y cifras ficticias para mostrar el propósito de la plataforma.
// No hace falta un servicio todavía: no hay consultas HTTP ni estado que actualizar.
export const PUBLICACIONES_DEMO: readonly Publicacion[] = [
  {
    id: 1,
    autorId: 10,
    autor: 'Mateo Ríos',
    usuario: 'mateo.10',
    iniciales: 'MR',
    tipo: 'Jugada',
    contexto: 'Mediocampista · La Plata',
    titulo: 'Recuperación, pase y llegada al área.',
    mensaje:
      'Una de mis jugadas del último partido. Recupero en mitad de cancha, busco la pared y acompaño hasta el área. Estoy trabajando la llegada desde segunda línea. ¿Qué mejorarían de la definición?',
    videoDemo: true,
    likes: 24,
    comentarios: 3,
  },
  {
    id: 4,
    autorId: 20,
    autor: 'Atlético Horizonte',
    usuario: 'atletico.horizonte',
    iniciales: 'AH',
    tipo: 'Prueba de jugadores',
    contexto: 'Convocatoria de club · Ejemplo ficticio',
    titulo: 'Buscamos jugadores para nuestro plantel Sub-23.',
    mensaje:
      'Prueba abierta para mediocampistas y delanteros. Una oportunidad para mostrar tu juego y conocer nuestra propuesta de entrenamiento. Todos los datos de esta convocatoria son ilustrativos.',
    convocatoria: {
      categoria: 'Sub-23 · Mediocampistas y delanteros',
      lugar: 'Predio Horizonte, La Plata · Lugar ficticio',
      fecha: '14 de noviembre de 2026 · 09:00 h · Fecha de ejemplo',
      requisitos: 'Botines, canilleras y ropa de entrenamiento.',
    },
    likes: 32,
    comentarios: 8,
  },
  {
    id: 2,
    autorId: 7,
    autor: 'Lucía Torres',
    usuario: 'luci.torres',
    iniciales: 'LT',
    tipo: 'Entrenamiento',
    contexto: 'Delantera · Berisso',
    titulo: 'Control orientado y definición con la zurda.',
    mensaje:
      'Fotos de una sesión enfocada en recibir de espaldas y resolver con el segundo toque. Comparto mi entrenamiento para mostrar cómo juego y seguir aprendiendo con sus comentarios.',
    imagen: 'images/cancha-demo.svg',
    imagenDescripcion:
      'Ilustración de una cancha: control orientado y definición. Material de entrenamiento de ejemplo, sin fotografía real.',
    likes: 18,
    comentarios: 5,
  },
  {
    id: 3,
    autorId: 10,
    autor: 'Mateo Ríos',
    usuario: 'mateo.10',
    iniciales: 'MR',
    tipo: 'Comentario',
    contexto: 'Análisis de juego · Ejemplo',
    titulo: 'Levantar la cabeza antes de recibir.',
    mensaje:
      'Estoy practicando mirar por encima del hombro antes del pase. Me ayuda a decidir más rápido y a encontrar al compañero libre. ¿Cómo entrenan ustedes la lectura del juego?',
    likes: 12,
    comentarios: 2,
  },
];
