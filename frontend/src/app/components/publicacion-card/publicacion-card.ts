import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Publicacion } from '../../services/publicaciones';
import { TruncatePipe } from '../../pipes/truncate.pipe';

// Como PeliculaCard en CineBera: el padre entrega datos por Input; el hijo comunica intenciones.
// Esta tarjeta no conoce HttpClient ni decide permisos del servidor.
@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [TruncatePipe],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard {
  @Input({ required: true }) publicacion!: Publicacion;
  @Input() autenticado = false;
  @Input() puedeDarBaja = false;
  @Input() procesando = false;
  // El detalle y los comentarios todavía no tienen ruta/API de Sprint 3.
  @Input() detalleDisponible = false;
  @Output() cambiarLike = new EventEmitter<Publicacion>();
  @Output() solicitarBaja = new EventEmitter<Publicacion>();
  @Output() abrirDetalle = new EventEmitter<Publicacion>();
  expandido = false;
  readonly limiteTexto = 280;
  get descripcion(): string {
    return this.publicacion.descripcion ?? this.publicacion.contenido;
  }
  get activa(): boolean {
    return this.publicacion.activo !== false;
  }
  emitirLike(): void {
    if (this.autenticado && this.activa && !this.procesando)
      this.cambiarLike.emit(this.publicacion);
  }
  emitirBaja(): void {
    if (this.puedeDarBaja && this.activa && !this.procesando)
      this.solicitarBaja.emit(this.publicacion);
  }
  emitirDetalle(): void {
    if (this.detalleDisponible && this.activa) this.abrirDetalle.emit(this.publicacion);
  }
}
