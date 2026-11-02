import { FechaRelativaPipe } from '../../pipes/fecha-relativa.pipe';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Publicacion } from '../../services/publicaciones';
import { TruncatePipe } from '../../pipes/truncate.pipe';

// Como PeliculaCard en CineBera: el padre entrega datos por Input; el hijo comunica intenciones.
// Esta tarjeta no conoce HttpClient ni decide permisos del servidor.
@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [TruncatePipe, FechaRelativaPipe, InicialesPipe],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard {
  @Input({ required: true }) publicacion!: Publicacion;
  @Input() autenticado = false;
  @Input() puedeDarBaja = false;
  @Input() procesando = false;
  // El padre decide si ofrece navegación; en el detalle se muestra el texto completo.
  @Input() detalleDisponible = false;
  @Input() textoCompleto = false;
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
  emitirComentario(): void {
    // Misma habilitación que el like y mismo Output/validaciones que Ver detalle.
    if (this.autenticado && !this.procesando) this.emitirDetalle();
  }
}
