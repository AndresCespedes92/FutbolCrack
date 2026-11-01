import { Pipe, PipeTransform } from '@angular/core';

// Pipe puro: solo recorta la presentación, nunca modifica el texto guardado en MongoDB.
// Cuenta como UNO de los tres pipes propios del Sprint 4.
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(texto: string | null | undefined, limite = 280, expandido = false): string {
    const contenido = typeof texto === 'string' ? texto : '';
    // Un límite incorrecto conserva el texto; evita recortes sorprendentes por NaN/negativos.
    if (!Number.isInteger(limite) || limite < 0) return contenido;
    return expandido || contenido.length <= limite ? contenido : contenido.slice(0, limite) + '…';
  }
}
