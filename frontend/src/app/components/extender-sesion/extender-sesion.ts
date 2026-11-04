import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

// Modal voluntario: solo el Output extender dispara POST refrescar desde el padre.
@Component({
  selector: 'app-extender-sesion',
  standalone: true,
  templateUrl: './extender-sesion.html',
  styleUrl: './extender-sesion.css',
})
/**
 * Modal de presentación con Input/Output: recibe minutos y estado, emite Ahora no o Extender.
 * No renueva nada por aparecer: App recibe extender y llama AuthService.refrescar.
 * ViewChild da acceso al dialog nativo; se abre tras crear la vista y se restaura el foco al salir.
 * El bloqueo renovando impide cancelar/enviar otra renovación mientras la respuesta está pendiente.
 */
export class ExtenderSesion implements AfterViewInit, OnDestroy {
  @Input() renovando = false;
  @Input() minutosRestantes = 5;
  @Input() error = '';
  @Output() extender = new EventEmitter<void>();
  @Output() ahoraNo = new EventEmitter<void>();
  @ViewChild('modal', { static: true }) modal!: ElementRef<HTMLDialogElement>;
  private focoAnterior: HTMLElement | null = null;
  ngAfterViewInit(): void {
    this.focoAnterior = document.activeElement as HTMLElement | null;
    this.modal.nativeElement.showModal();
  }
  ngOnDestroy(): void {
    this.modal.nativeElement.close();
    if (this.focoAnterior?.isConnected) this.focoAnterior.focus();
  }
  cancelar(evento?: Event): void {
    evento?.preventDefault();
    if (!this.renovando) this.ahoraNo.emit();
  }
  confirmar(): void {
    if (!this.renovando) this.extender.emit();
  }
}
