import { Component, ChangeDetectorRef, DestroyRef, OnInit, inject } from '@angular/core';

import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService, Usuario } from '../../services/auth';

import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicacionesService, Publicacion } from '../../services/publicaciones';
import { AccionesPublicaciones } from '../../services/acciones-publicaciones';
import { ConfirmacionBaja } from '../../components/confirmacion-baja/confirmacion-baja';

// Contenedor del perfil: ficha real y últimas tres publicaciones del usuario, sin comentarios ficticios.
@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [PublicacionCard, ConfirmacionBaja],
  providers: [AccionesPublicaciones],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiPublicaciones = inject(PublicacionesService);
  private readonly destroyRef = inject(DestroyRef);
  readonly acciones = inject(AccionesPublicaciones);

  // Datos reales recibidos desde el backend.
  usuario: Usuario | null = null;

  // Estados de la pantalla.
  cargando = true;
  cerrandoSesion = false;
  mensajeError = '';

  publicaciones: Publicacion[] = [];
  cargandoPublicaciones = false;
  errorPublicaciones = '';
  // Arrow function conserva el this del padre al entregarse como callback de una acción.
  readonly cargarTrasAccion = () => this.cargarPublicaciones();
  cargarPublicaciones(): void {
    if (!this.usuario) return;
    this.cargandoPublicaciones = true;
    this.errorPublicaciones = '';
    this.cdr.markForCheck();
    this.apiPublicaciones
      .listar({ usuarioId: this.usuario.id, orden: 'fecha', offset: 0, limit: 3 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.publicaciones = respuesta.publicaciones;
          this.cargandoPublicaciones = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorPublicaciones = 'No pudimos cargar tus publicaciones. Intentá nuevamente.';
          this.cargandoPublicaciones = false;
          this.cdr.markForCheck();
        },
      });
  }
  confirmarBaja(): void {
    this.acciones.confirmarBaja(this.cargarTrasAccion);
  }

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

    this.authService
      .obtenerMiPerfil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuario) => {
          this.usuario = usuario;
          this.cargarPublicaciones();
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

          this.mensajeError = 'No pudimos cargar tu perfil. Intentá nuevamente.';

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

    this.authService
      .cerrarSesion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cerrandoSesion = false;
          this.usuario = null;

          // Regresamos a la pantalla de ingreso.
          void this.router.navigate(['/login']);
        },

        error: () => {
          this.cerrandoSesion = false;
          this.mensajeError = 'No se pudo cerrar la sesión. Intentá nuevamente.';
          this.cdr.markForCheck();
        },
      });
  }
}
