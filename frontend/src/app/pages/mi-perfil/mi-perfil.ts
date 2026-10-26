import { Component } from '@angular/core';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { PUBLICACIONES_DEMO } from '../../data/publicaciones-demo';

// CV visual y material de un jugador ficticio: no consulta una sesión ni guarda datos.
@Component({
  selector: 'app-mi-perfil',
  imports: [PublicacionCard],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  // filter selecciona las publicaciones del jugador de ejemplo sin duplicar los datos del feed.
  readonly publicaciones = PUBLICACIONES_DEMO.filter((publicacion) => publicacion.autorId === 10);
}
