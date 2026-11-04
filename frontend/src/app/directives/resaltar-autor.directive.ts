import { Directive, input } from '@angular/core';

// Directiva de atributo: solo cambia una clase visual; el componente compara identidad/autor.
/**
 * Directiva de atributo: @Directive registra el selector [appResaltarAutor], que se coloca
 * en el article de cada comentario. El componente le pasa una comparación de identificadores;
 * la directiva no consulta usuarios ni decide quién está autorizado a editar.
 * input(false) crea una entrada reactiva. El binding host agrega o retira la clase
 * comentario-propio del mismo elemento; no crea un componente ni una plantilla nueva.
 * Así reutilizamos el resaltado sin copiar condiciones de CSS en cada pantalla.
 * Para defenderla, mostrar el binding en comentarios-publicacion.html y la clase en su CSS.
 */
@Directive({
  selector: '[appResaltarAutor]',
  standalone: true,
  host: { '[class.comentario-propio]': 'appResaltarAutor()' },
})
export class ResaltarAutorDirective {
  readonly appResaltarAutor = input(false);
}
