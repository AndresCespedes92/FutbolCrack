
import {
  Component,
  ChangeDetectorRef,
  OnInit,
  inject,
} from '@angular/core';

import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService, Usuario } from '../../services/auth';

import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { PUBLICACIONES_DEMO } from '../../data/publicaciones-demo';

/**
 * MI PERFIL
 *
 * Muestra los datos reales del usuario autenticado.
 * Los obtiene desde MongoDB mediante GET /auth/me.
 *
 * Conservamos las publicaciones ficticias como
 * material de demostración del Sprint 1.
 */
@Component({
  selector: 'app-mi-perfil',
  imports: [PublicacionCard],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Datos reales recibidos desde el backend.
  usuario: Usuario | null = null;

  // Estados de la pantalla.
  cargando = true;
  cerrandoSesion = false;
  mensajeError = '';

  // Publicaciones ficticias, pendientes de integración.
  readonly publicaciones = PUBLICACIONES_DEMO.filter(
    (publicacion) => publicacion.autorId === 10,
  );

  /**
   * Se ejecuta cuando Angular inicializa el componente.
   */
  ngOnInit(): void {
    this.cargarMiPerfil();
  }

  /**
   * Consulta el usuario autenticado.
   *
   * La cookie HttpOnly se envía automáticamente
   * gracias a withCredentials en AuthService.
   */
  cargarMiPerfil(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.authService.obtenerMiPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.cargando = false;
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        this.cargando = false;

        if (error.status === 401) {
          // El token venció o la sesión no existe.
          void this.router.navigate(['/login']);
          return;
        }

        this.mensajeError =
          'No pudimos cargar tu perfil. Intentá nuevamente.';

        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Solicita al backend eliminar la cookie de sesión.
   */
  cerrarSesion(): void {
    if (this.cerrandoSesion) return;

    this.cerrandoSesion = true;
    this.mensajeError = '';

    this.authService.cerrarSesion().subscribe({
      next: () => {
        this.cerrandoSesion = false;
        this.usuario = null;

        // Regresamos a la pantalla de ingreso.
        void this.router.navigate(['/login']);
      },

      error: () => {
        this.cerrandoSesion = false;
        this.mensajeError =
          'No se pudo cerrar la sesión. Intentá nuevamente.';
        this.cdr.markForCheck();
      },
    });
  }
}
