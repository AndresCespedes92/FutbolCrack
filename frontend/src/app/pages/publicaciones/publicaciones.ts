import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthService, Usuario } from '../../services/auth';
import { AccionesPublicaciones } from '../../services/acciones-publicaciones';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { ConfirmacionBaja } from '../../components/confirmacion-baja/confirmacion-baja';
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PublicacionesService,
  Publicacion,
  ParametrosListadoPublicaciones,
  OrdenPublicaciones,
} from '../../services/publicaciones';
import { imagenPerfilValidator as imagenPublicacionValidator } from '../../validators/registro.validators';

// Padre del feed: coordina formulario, consultas paginadas y eventos de las tarjetas.
@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, PublicacionCard, ConfirmacionBaja],
  providers: [AccionesPublicaciones],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private solicitudListado?: Subscription;
  readonly acciones = inject(AccionesPublicaciones);
  usuario: Usuario | null = null;
  orden: OrdenPublicaciones = 'fecha';
  mensajeSesion = '';
  get paginaActual(): number {
    return Math.floor(this.offset / this.limit) + 1;
  }
  get totalPaginas(): number {
    return Math.ceil(this.totalPublicaciones / this.limit);
  }
  // Ventana acotada: siempre ofrece varias páginas sin crear miles de botones.
  get paginasVisibles(): number[] {
    const inicio = Math.max(1, Math.min(this.paginaActual - 2, this.totalPaginas - 4));
    return Array.from({ length: Math.min(5, this.totalPaginas) }, (_, indice) => inicio + indice);
  }

  @ViewChild('imagenPublicacion') private imagenInput?: ElementRef<HTMLInputElement>;

  publicaciones: Publicacion[] = [];
  // Los metadatos vienen de MongoDB: el navegador nunca recorta una descarga completa.
  totalPublicaciones = 0;
  offset = 0;
  limit = 10;
  hayMas = false;
  cargando = true;
  mensajeError = '';
  publicando = false;
  mensajePublicacion = '';
  mensajeExito = '';

  // La imagen reutiliza las reglas locales del registro; Nest vuelve a validar el archivo real.
  readonly publicacionForm = new FormGroup({
    titulo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)],
    }),
    imagen: new FormControl<File | null>(null, { validators: [imagenPublicacionValidator] }),
  });
  readonly campos = this.publicacionForm.controls;

  ngOnInit(): void {
    this.cargarPublicaciones();
    // El feed sigue público; /auth/me solo determina las acciones visibles, sin leer la cookie HttpOnly.
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
              'No pudimos comprobar tu sesión. Recargá para habilitar las acciones.';
          this.cdr.markForCheck();
        },
      });
  }

  cambiarOrden(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    if (valor !== 'fecha' && valor !== 'likes') return;
    this.orden = valor;
    this.cargarPublicaciones({ offset: 0 });
  }
  irAPagina(pagina: number): void {
    if (
      this.cargando ||
      !Number.isInteger(pagina) ||
      pagina < 1 ||
      pagina > this.totalPaginas ||
      pagina === this.paginaActual
    )
      return;
    this.cargarPublicaciones({ offset: (pagina - 1) * 10 });
  }
  readonly cargarTrasAccion = () => this.cargarPublicaciones();
  confirmarBaja(): void {
    this.acciones.confirmarBaja(() => this.cargarPublicaciones());
  }

  seleccionarImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.campos.imagen.setValue(entrada.files?.item(0) ?? null);
    this.campos.imagen.markAsTouched();
  }

  publicar(): void {
    if (this.publicando) return;
    this.mensajePublicacion = '';
    this.mensajeExito = '';
    if (this.publicacionForm.invalid) {
      this.publicacionForm.markAllAsTouched();
      this.mensajePublicacion = 'Revisá el título, la descripción y la imagen antes de publicar.';
      return;
    }
    this.publicando = true;
    this.publicacionesService
      .crear({
        titulo: this.campos.titulo.value.trim(),
        descripcion: this.campos.descripcion.value.trim(),
        imagen: this.campos.imagen.value ?? undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.publicando = false;
          this.publicacionForm.reset();
          // File no usa formControlName: limpiamos también el selector nativo tras confirmar el guardado.
          if (this.imagenInput) this.imagenInput.nativeElement.value = '';
          this.mensajeExito = 'Publicación creada correctamente.';
          this.cargarPublicaciones({ offset: 0 });
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.publicando = false;
          if (error.status === 401) {
            this.mensajePublicacion = 'Tu sesión venció. Iniciá sesión nuevamente.';
            void this.router.navigate(['/login']);
          } else if (error.status === 413) {
            this.mensajePublicacion = 'La imagen supera el máximo de 5 MB.';
          } else if (error.status === 400) {
            this.mensajePublicacion =
              'Revisá los textos y que la imagen sea JPEG, PNG o WebP de hasta 5 MB.';
          } else {
            this.mensajePublicacion =
              error.status === 0
                ? 'No se pudo conectar con el servidor.'
                : 'No se pudo crear la publicación. Intentá nuevamente.';
          }
          // En error no se borran los datos: el jugador puede corregirlos o reintentar.
          this.cdr.markForCheck();
        },
      });
  }

  cargarPublicaciones(parametros: ParametrosListadoPublicaciones = {}): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdr.markForCheck();
    // Cancelar la consulta previa evita que una respuesta vieja reemplace otra página/orden.
    this.solicitudListado?.unsubscribe();
    this.solicitudListado = this.publicacionesService
      .listar({ orden: this.orden, offset: this.offset, ...parametros, limit: 10 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          // Si se retiró el último registro de una página, volvemos a la última que aún existe.
          if (respuesta.publicaciones.length === 0 && respuesta.offset > 0) {
            const ultimoOffset = Math.max(0, (Math.ceil(respuesta.total / 10) - 1) * 10);
            if (ultimoOffset !== respuesta.offset) {
              this.cargarPublicaciones({ offset: ultimoOffset });
              return;
            }
          }
          this.publicaciones = respuesta.publicaciones;
          this.totalPublicaciones = respuesta.total;
          this.offset = respuesta.offset;
          this.limit = respuesta.limit;
          this.hayMas = respuesta.hayMas;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.cargando = false;
          this.mensajeError =
            error.status === 0
              ? 'No se pudo conectar con el servidor.'
              : 'No pudimos cargar las publicaciones.';
          this.cdr.markForCheck();
        },
      });
  }
}
