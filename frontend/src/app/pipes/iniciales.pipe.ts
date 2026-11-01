import { Pipe, PipeTransform } from '@angular/core';

// Alternativa a la foto: primera letra del primer y último nombre, conservando acentos.
@Pipe({ name: 'iniciales', standalone: true })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined): string {
    if (typeof nombre !== 'string') return 'FC';
    const partes = nombre
      .normalize('NFC')
      .trim()
      .split(/\s+/)
      .map((parte) => parte.match(/\p{L}/u)?.[0])
      .filter((letra): letra is string => !!letra);
    if (!partes.length) return 'FC';
    return (partes[0] + (partes.length > 1 ? partes[partes.length - 1] : '')).toLocaleUpperCase(
      'es',
    );
  }
}
