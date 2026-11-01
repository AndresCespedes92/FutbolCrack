import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

// Se crea únicamente al abrir el formulario de edición. Espera a que Angular pinte el campo.
// La API de foco es necesaria aquí; no se busca el elemento con document.querySelector ni timers.
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
