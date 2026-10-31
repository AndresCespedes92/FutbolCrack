import { Component, ChangeDetectorRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService, Publicacion } from '../../services/publicaciones';
import { imagenPerfilValidator as imagenPublicacionValidator } from '../../validators/registro.validators';

// Feed existente: incorpora título/descripción e imagen sin agregar acciones de baja todavía.
@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('imagenPublicacion') private imagenInput?: ElementRef<HTMLInputElement>;

  publicaciones: Publicacion[] = [];
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
      .subscribe({
        next: () => {
          this.publicando = false;
          this.publicacionForm.reset();
          // File no usa formControlName: limpiamos también el selector nativo tras confirmar el guardado.
          if (this.imagenInput) this.imagenInput.nativeElement.value = '';
          this.mensajeExito = 'Publicación creada correctamente.';
          this.cargarPublicaciones();
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

  cargarPublicaciones(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.publicacionesService.listar().subscribe({
      next: (publicaciones) => {
        this.publicaciones = publicaciones;
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
