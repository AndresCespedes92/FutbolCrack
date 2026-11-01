import { Directive, input } from '@angular/core';

// Directiva de atributo: solo cambia una clase visual; el componente compara identidad/autor.
@Directive({
  selector: '[appResaltarAutor]',
  standalone: true,
  host: { '[class.comentario-propio]': 'appResaltarAutor()' },
})
export class ResaltarAutorDirective {
  readonly appResaltarAutor = input(false);
}
