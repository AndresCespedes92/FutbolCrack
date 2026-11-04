import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

// Se crea únicamente al abrir el formulario de edición. Espera a que Angular pinte el campo.
// La API de foco es necesaria aquí; no se busca el elemento con document.querySelector ni timers.
/**
 * Directiva de atributo para un comportamiento del DOM: enfocar el campo que acaba de aparecer.
 * El selector restringe el uso a input/textarea. inject(ElementRef) obtiene precisamente ese
 * elemento, no otro campo encontrado por una búsqueda global.
 * afterNextRender espera el render antes de ejecutar focus en la fase write: el textarea de
 * edición vive dentro de un @if y todavía podría no existir al cambiar editandoId.
 * disabled/isConnected evitan actuar sobre un campo deshabilitado o retirado; preventScroll
 * mantiene la posición de lectura. No modifica el texto ni concede permiso de edición.
 */
@Directive({ selector: 'input[appAutoFocus],textarea[appAutoFocus]', standalone: true })
export class AutoFocusDirective {
  private readonly elemento =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  constructor() {
    afterNextRender({
      write: () => {
        const campo = this.elemento.nativeElement;
        if (!campo.disabled && campo.isConnected) campo.focus({ preventScroll: true });
      },
    });
  }
}
