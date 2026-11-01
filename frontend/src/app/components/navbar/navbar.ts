import { PermisoRolDirective } from '../../directives/permiso-rol.directive';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

// Navegación compartida: routerLink cambia la URL sin recargar el documento.
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, PermisoRolDirective],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  readonly auth = inject(AuthService);
}
