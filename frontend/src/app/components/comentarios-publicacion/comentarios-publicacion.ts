import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Usuario } from '../../services/auth';
import { Comentario, ComentariosService } from '../../services/comentarios';
import { TruncatePipe } from '../../pipes/truncate.pipe';

// Contenedor reutilizable: recibe la jugada y sesión del padre, y coordina comentarios vía servicio.
// Como los formularios de CineBera, Angular ayuda al usuario; Nest valida texto y autoría otra vez.
@Component({
  selector: 'app-comentarios-publicacion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TruncatePipe],
  templateUrl: './comentarios-publicacion.html',
  styleUrl: './comentarios-publicacion.css',
})
export class ComentariosPublicacion implements OnChanges {
  @Input({ required: true }) publicacionId!: string;
  @Input() usuario: Usuario | null = null;
  @Output() publicacionNoDisponible = new EventEmitter<void>();
  private readonly api = inject(ComentariosService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private lectura?: Subscription;
  private escritura?: Subscription;
  comentarios: Comentario[] = [];
  total = 0;
  siguienteOffset = 0;
  hayMas = false;
  cargando = false;
  enviando = false;
  guardando = false;
  noDisponible = false;
  errorLectura = '';
  errorNuevo = '';
  errorEdicion = '';
  mensaje = '';
  editandoId: string | null = null;
  expandidos = new Set<string>();
  // maxlength usa String.length: 501 emojis de dos unidades UTF-16 exceden 1000.
  readonly nuevoForm = new FormGroup({
    texto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)],
    }),
  });
  readonly edicionForm = new FormGroup({
    texto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(1000)],
    }),
  });
  get ocupado(): boolean {
    return this.cargando || this.enviando || this.guardando;
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['publicacionId']) {
      this.lectura?.unsubscribe();
      this.escritura?.unsubscribe();
      this.enviando = false;
      this.guardando = false;
      this.noDisponible = false;
      this.mensaje = '';
      this.errorNuevo = '';
      this.nuevoForm.reset();
      this.reiniciarListado();
    }
    if (cambios['usuario'] && this.editandoId) {
      const comentario = this.comentarios.find((item) => item._id === this.editandoId);
      if (!comentario || !this.puedeEditar(comentario)) this.cancelarEdicion();
    }
  }
  cargarComentarios(): void {
    if (this.ocupado || this.noDisponible) return;
    this.cargando = true;
    this.errorLectura = '';
    this.cdr.markForCheck();
    this.lectura = this.api
      .listar(this.publicacionId, this.siguienteOffset)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          // El offset avanza por registros RECIBIDOS, no por IDs únicos: una inserción externa
          // puede repetir una fila en la siguiente página sin justificar repetirla en pantalla.
          const porId = new Map(this.comentarios.map((comentario) => [comentario._id, comentario]));
          for (const comentario of respuesta.comentarios) porId.set(comentario._id, comentario);
          this.comentarios = [...porId.values()];
          this.total = respuesta.total;
          this.siguienteOffset = respuesta.offset + respuesta.comentarios.length;
          this.hayMas = respuesta.hayMas;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.cargando = false;
          this.errorLectura = this.explicarError(error);
          if (error.status === 404) this.marcarNoDisponible();
          this.cdr.markForCheck();
        },
      });
  }
  publicar(): void {
    if (!this.usuario || this.ocupado || this.noDisponible || this.editandoId) return;
    this.errorNuevo = '';
    this.mensaje = '';
    if (this.nuevoForm.invalid) {
      this.nuevoForm.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.escritura = this.api
      .crear(this.publicacionId, this.nuevoForm.controls.texto.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.enviando = false;
          this.mensaje = respuesta.mensaje;
          this.nuevoForm.reset();
          // El alta desplaza offsets: reiniciamos a tres recientes, en vez de mezclar páginas viejas.
          this.reiniciarListado();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.enviando = false;
          this.errorNuevo = this.explicarError(error);
          if (error.status === 404) this.marcarNoDisponible();
          this.cdr.markForCheck();
        },
      });
  }
  puedeEditar(comentario: Comentario): boolean {
    // Solo visibilidad; Nest compara el autor almacenado con el sub del JWT, incluso para admin.
    return !!this.usuario && comentario.autorId?._id === this.usuario.id && !this.noDisponible;
  }
  iniciarEdicion(comentario: Comentario): void {
    if (!this.puedeEditar(comentario) || this.ocupado) return;
    this.editandoId = comentario._id;
    this.errorEdicion = '';
    this.mensaje = '';
    this.edicionForm.reset({ texto: comentario.texto });
  }
  cancelarEdicion(): void {
    if (this.guardando) return;
    this.editandoId = null;
    this.errorEdicion = '';
    this.edicionForm.reset();
  }
  guardarEdicion(): void {
    const comentario = this.comentarios.find((item) => item._id === this.editandoId);
    if (!comentario || !this.puedeEditar(comentario) || this.ocupado) return;
    this.errorEdicion = '';
    this.mensaje = '';
    if (this.edicionForm.invalid) {
      this.edicionForm.markAllAsTouched();
      return;
    }
    this.guardando = true;
    this.escritura = this.api
      .editar(comentario._id, this.edicionForm.controls.texto.value.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          // Reemplazamos SOLO el comentario editado: no se pierde la colección ya anexada ni su orden.
          this.comentarios = this.comentarios.map((item) =>
            item._id === comentario._id ? respuesta.comentario : item,
          );
          this.guardando = false;
          this.mensaje = respuesta.mensaje;
          this.cancelarEdicion();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.errorEdicion = this.explicarError(error);
          this.cdr.markForCheck();
        },
      });
  }
  alternarTexto(id: string): void {
    if (this.expandidos.has(id)) this.expandidos.delete(id);
    else this.expandidos.add(id);
  }
  private reiniciarListado(): void {
    this.comentarios = [];
    this.total = 0;
    this.siguienteOffset = 0;
    this.hayMas = false;
    this.expandidos.clear();
    this.cancelarEdicion();
    this.cargando = false;
    this.cargarComentarios();
  }
  private marcarNoDisponible(): void {
    this.noDisponible = true;
    this.comentarios = [];
    this.total = 0;
    this.hayMas = false;
    this.publicacionNoDisponible.emit();
  }
  private explicarError(error: HttpErrorResponse): string {
    if (error.status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente para continuar.';
    if (error.status === 403) return 'Solo el autor puede editar este comentario.';
    if (error.status === 404) return 'El comentario o la publicación ya no está disponible.';
    if (error.status === 400)
      return 'Revisá el texto: es obligatorio y admite hasta 1000 unidades UTF-16.';
    return error.status === 0
      ? 'No se pudo conectar con el servidor. Intentá nuevamente.'
      : 'No pudimos completar la operación. Intentá nuevamente.';
  }
}
