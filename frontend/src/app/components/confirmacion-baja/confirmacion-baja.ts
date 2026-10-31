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
import { Publicacion } from '../../services/publicaciones';

// Modal propio con dialog nativo: bloquea el fondo y gestiona foco/teclado sin window.confirm.
@Component({
  selector: 'app-confirmacion-baja',
  standalone: true,
  templateUrl: './confirmacion-baja.html',
  styleUrl: './confirmacion-baja.css',
})
export class ConfirmacionBaja implements AfterViewInit, OnDestroy {
  @Input({ required: true }) publicacion!: Publicacion;
  @Input() procesando = false;
  @Input() error = '';
  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
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
  cancelarConTeclado(evento: Event): void {
    evento.preventDefault(); // Escape sigue las mismas reglas que Cancelar, incluso durante el DELETE.
    this.cancelarBaja();
  }
  cancelarBaja(): void {
    if (!this.procesando) {
      this.modal.nativeElement.close();
      this.cancelar.emit();
    }
  }
  confirmarBaja(): void {
    if (!this.procesando) this.confirmar.emit();
  }
}
