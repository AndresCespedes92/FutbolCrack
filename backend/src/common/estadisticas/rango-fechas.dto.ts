import { BadRequestException } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';

// Día de calendario estricto. No usamos Date.parse sin validar: normaliza algunos días inexistentes.
export class RangoFechasDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  desde: string;
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  hasta: string;
}
export const ZONA_REPORTES = 'UTC-03:00';
export function construirRango(datos: RangoFechasDto) {
  function inicioDia(valor: string): Date {
    if (
      typeof valor !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
      valor.startsWith('0000')
    )
      throw new BadRequestException(
        'Desde y Hasta son obligatorios, en formato AAAA-MM-DD',
      );
    const medianocheUTC = new Date(valor + 'T00:00:00.000Z');
    if (
      !Number.isFinite(medianocheUTC.getTime()) ||
      medianocheUTC.toISOString().slice(0, 10) !== valor
    )
      throw new BadRequestException(
        'Ingresá fechas que existan en el calendario',
      );
    // Zona FIJA UTC−03:00, independiente del servidor y sin reglas históricas de horario de verano.
    return new Date(medianocheUTC.getTime() + 3 * 60 * 60 * 1000);
  }
  const inicio = inicioDia(datos.desde),
    ultimoDia = inicioDia(datos.hasta);
  if (inicio > ultimoDia)
    throw new BadRequestException('Desde no puede ser posterior a Hasta');
  // Hasta incluye todo su día; $lt al siguiente inicio incluye también las fracciones del último segundo.
  const finExclusivo = new Date(ultimoDia.getTime() + 86400000);
  return {
    inicio,
    finExclusivo,
    metadatos: {
      desde: datos.desde,
      hasta: datos.hasta,
      zonaHoraria: ZONA_REPORTES,
    },
  };
}
