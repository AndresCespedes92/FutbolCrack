import { Pipe, PipeTransform } from '@angular/core';

// Pipe puro: solo recorta la presentación, nunca modifica el texto guardado en MongoDB.
// Cuenta como UNO de los tres pipes propios del Sprint 4.
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(texto: string | null | undefined, limite = 280, expandido = false): string {
    const contenido = texto ?? '';
    return expandido || contenido.length <= limite ? contenido : contenido.slice(0, limite) + '…';
  }
}
