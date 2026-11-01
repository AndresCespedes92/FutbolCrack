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
import { UsuarioAdministrativo } from '../../services/usuarios';
// Modal propio presentacional: identifica al socio; solo el padre ejecuta la baja tras confirmar.
@Component({
  selector: 'app-confirmacion-usuario',
  standalone: true,
  templateUrl: './confirmacion-usuario.html',
  styleUrl: './confirmacion-usuario.css',
})
export class ConfirmacionUsuario implements AfterViewInit, OnDestroy {
  @Input({ required: true }) usuario!: UsuarioAdministrativo;
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
  cancelarBaja(evento?: Event): void {
    evento?.preventDefault();
    if (!this.procesando) this.cancelar.emit();
  }
  confirmarBaja(): void {
    if (!this.procesando) this.confirmar.emit();
  }
}
