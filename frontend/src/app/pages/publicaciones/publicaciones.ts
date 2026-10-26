import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { PUBLICACIONES_DEMO } from '../../data/publicaciones-demo';

// El feed entrega cada publicación a una tarjeta; @for mantiene el listado en la plantilla.
@Component({
  selector: 'app-publicaciones',
  imports: [RouterLink, PublicacionCard],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones {
  readonly publicaciones = PUBLICACIONES_DEMO;
}
