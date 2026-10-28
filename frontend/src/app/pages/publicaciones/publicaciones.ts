
import {
  Component,
  ChangeDetectorRef,
  OnInit,
  inject,
} from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  PublicacionesService,
  Publicacion,
} from '../../services/publicaciones';

/**
 * Página principal de publicaciones de FutbolCrack.
 *
 * GET  /publicaciones: obtiene el feed.
 * POST /publicaciones: crea una publicación autenticada.
 */
@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {

  private readonly publicacionesService =
    inject(PublicacionesService);

  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);

  // Publicaciones obtenidas desde MongoDB.
  publicaciones: Publicacion[] = [];

  cargando = true;
  mensajeError = '';

  publicando = false;
  mensajePublicacion = '';

  // Validamos el largo; los espacios se verifican al publicar.
  readonly contenidoControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.maxLength(2000),
    ],
  });

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  /**
   * Envía una publicación al backend.
   */
  publicar(): void {

    console.log('Se ejecutó publicar()');

    if (this.publicando) {
      return;
    }

    this.mensajePublicacion = '';

    const contenido = this.contenidoControl.value.trim();

    if (
      this.contenidoControl.invalid ||
      contenido.length === 0
    ) {
      this.contenidoControl.markAsTouched();

      this.mensajePublicacion =
        'Escribí un mensaje antes de publicar.';

      return;
    }

    this.publicando = true;

    console.log('Enviando POST /publicaciones:', contenido);

    this.publicacionesService.crear({ contenido }).subscribe({

      next: () => {

        console.log('Publicación creada correctamente');

        this.publicando = false;

        this.contenidoControl.reset();

        this.cargarPublicaciones();

        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {

        console.error(
          'Error al crear publicación:',
          error.status,
          error.error,
        );

        this.publicando = false;

        if (error.status === 401) {
          this.mensajePublicacion =
            'Tu sesión venció. Iniciá sesión nuevamente.';

          this.cdr.markForCheck();

          void this.router.navigate(['/login']);

          return;
        }

        this.mensajePublicacion =
          error.status === 0
            ? 'No se pudo conectar con el servidor.'
            : 'No se pudo crear la publicación.';

        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Obtiene las publicaciones reales de MongoDB.
   */
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
