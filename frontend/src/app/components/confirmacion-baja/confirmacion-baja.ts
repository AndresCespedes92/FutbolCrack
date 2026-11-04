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
/**
 * Modal propio de confirmación: recibe jugada/estado y emite confirmar o cancelar al padre.
 * No conoce el endpoint ni envía DELETE. Sirve para evitar una baja por clic accidental,
 * no para asegurar permisos: eso corresponde a Nest. Escape usa las reglas de Cancelar
 * y el foco vuelve al elemento anterior al destruirse el dialog, mejorando uso con teclado.
 */
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
