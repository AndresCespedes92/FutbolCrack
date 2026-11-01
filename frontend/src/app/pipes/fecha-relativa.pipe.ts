import { Pipe, PipeTransform } from '@angular/core';

// Pipe puro: transforma presentación, no modifica createdAt ni instala timers por comentario.
// El texto se calcula al recibir la fecha (o un nuevo ahora explícito), no es un reloj en vivo.
@Pipe({ name: 'fechaRelativa', standalone: true })
export class FechaRelativaPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, ahora = Date.now()): string {
    if (!(valor instanceof Date) && (typeof valor !== 'string' || !valor.trim()))
      return 'Fecha no disponible';
    // Date puede normalizar 30 de febrero: comprobamos también el día de un ISO antes de convertirlo.
    if (typeof valor === 'string') {
      const dia = valor.slice(0, 10);
      const calendario = new Date(dia + 'T00:00:00Z');
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dia) ||
        !Number.isFinite(calendario.getTime()) ||
        calendario.toISOString().slice(0, 10) !== dia
      )
        return 'Fecha no disponible';
    }
    const fecha = valor instanceof Date ? valor.getTime() : new Date(valor).getTime();
    if (!Number.isFinite(fecha) || !Number.isFinite(ahora)) return 'Fecha no disponible';
    const minutos = Math.floor((ahora - fecha) / 60000);
    if (fecha > ahora) return 'Próximamente';
    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
  }
}
