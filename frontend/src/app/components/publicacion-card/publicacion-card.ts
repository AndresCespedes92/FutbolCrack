import { Component, Input } from '@angular/core';
import { Publicacion } from '../../models/publicacion';

// Como PeliculaCard en CineBera, recibe los datos del padre mediante @Input.
// Solo presenta contenido; los contadores no modifican likes ni comentarios.
@Component({
  selector: 'app-publicacion-card',
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
})
export class PublicacionCard {
  @Input({ required: true }) publicacion!: Publicacion;
}
