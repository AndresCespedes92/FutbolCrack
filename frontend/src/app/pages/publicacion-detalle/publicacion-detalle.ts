import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Publicacion, PublicacionesService } from '../../services/publicaciones';
import { AuthService, Usuario } from '../../services/auth';
import { AccionesPublicaciones } from '../../services/acciones-publicaciones';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { ConfirmacionBaja } from '../../components/confirmacion-baja/confirmacion-baja';
import { ComentariosPublicacion } from '../../components/comentarios-publicacion/comentarios-publicacion';

// Padre del detalle: la URL identifica una sola jugada. Reutiliza tarjeta, acciones y comentarios.
@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [RouterLink, PublicacionCard, ConfirmacionBaja, ComentariosPublicacion],
  providers: [AccionesPublicaciones],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css',
})
export class PublicacionDetalle implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PublicacionesService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private lectura?: Subscription;
  readonly acciones = inject(AccionesPublicaciones);
  publicacion: Publicacion | null = null;
  usuario: Usuario | null = null;
  id = '';
  cargando = true;
  noDisponible = false;
  mensajeError = '';
  mensajeSesion = '';
  readonly cargarTrasAccion = () => this.cargarDetalle();
  ngOnInit(): void {
    this.auth
      .obtenerMiPerfil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuario) => {
          this.usuario = usuario;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status !== 401)
            this.mensajeSesion =
              'No pudimos comprobar tu sesión. Podés leer, pero las acciones no están disponibles.';
          this.cdr.markForCheck();
        },
      });
    // paramMap permite abrir URL directa y navegar entre dos ids sin conservar la jugada anterior.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parametros) => {
      this.id = parametros.get('id') ?? '';
      this.publicacion = null;
      this.acciones.cancelarBaja();
      this.acciones.mensaje.set('');
      this.acciones.error.set('');
      this.cargarDetalle();
    });
  }
  /**
   * La URL es la entrada: valida formato de ID en la interfaz antes de GET y Nest lo repite.
   * El estado 404/inactivo retira tarjeta/comentarios; un error de red permite reintentar en vez
   * de afirmar que la jugada no existe. Cambiar paramMap cancela la lectura anterior.
   * Esta pantalla conecta la tarjeta por Input/Output con el panel que crea/edita comentarios.
   */
  cargarDetalle(): void {
    this.lectura?.unsubscribe();
    this.noDisponible = false;
    this.mensajeError = '';
    if (!/^[a-f\d]{24}$/i.test(this.id)) {
      this.cargando = false;
      this.mensajeError = 'El identificador de publicación no es válido.';
      this.cdr.markForCheck();
      return;
    }
    this.cargando = true;
    this.cdr.markForCheck();
    this.lectura = this.api
      .obtenerPorId(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (publicacion) => {
          this.cargando = false;
          // Defensa visual además del filtro definitivo del backend.
          if (publicacion.activo === false) this.marcarNoDisponible();
          else this.publicacion = publicacion;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.cargando = false;
          if (error.status === 404) this.marcarNoDisponible();
          else
            this.mensajeError =
              error.status === 400
                ? 'El identificador de publicación no es válido.'
                : 'No pudimos cargar la publicación. Intentá nuevamente.';
          this.cdr.markForCheck();
        },
      });
  }
  marcarNoDisponible(): void {
    this.noDisponible = true;
    this.publicacion = null;
    this.cargando = false;
    this.cdr.markForCheck();
  }
  /**
   * Recibe el totalActualizado del panel, no suma la cantidad de filas visibles.
   * Reemplaza el objeto de publicación y marca la vista para que el contador de la tarjeta
   * muestre el total del backend incluso cuando el panel solo cargó tres notas.
   */
  actualizarTotalComentarios(total: number): void {
    if (this.publicacion) this.publicacion = { ...this.publicacion, cantidadComentarios: total };
    this.cdr.markForCheck();
  }
  confirmarBaja(): void {
    this.acciones.confirmarBaja(() => {
      void this.router.navigate(['/publicaciones']);
    });
  }
}
