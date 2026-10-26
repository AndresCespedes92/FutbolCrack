import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Navegación compartida: routerLink cambia la URL sin recargar el documento.
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {}
