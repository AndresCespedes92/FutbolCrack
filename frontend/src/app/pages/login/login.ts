//El usuario ingresa su correo o nombre de usuario y contraseña.
// Angular envía los datos mediante AuthService.login().
// NestJS verifica la contraseña con bcrypt.
// Si es correcta, guarda el JWT en cookie HttpOnly y devuelve usuario/fechas.
// Angular recupera el estado sin leer ni almacenar el token.

import { Component, ChangeDetectorRef, inject } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // Servicio que comunica Angular con NestJS.
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // Router permite navegar entre las pantallas Angular.
  private readonly router = inject(Router);

  // Actualiza la vista después de las respuestas HTTP.
  private readonly cdr = inject(ChangeDetectorRef);

  // Formulario reactivo con validaciones obligatorias.
  readonly loginForm = new FormGroup({
    identificador: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  // Estados del formulario.
  enviando = false;
  mensajeError = '';
  mensajeExito = '';

  /**
   * INICIAR SESIÓN
   *
   * 1. Valida el formulario.
   * 2. Envía las credenciales a NestJS.
   * 3. NestJS devuelve la cookie HttpOnly.
   * 4. Angular navega a Publicaciones.
   */
  iniciarSesion(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    // Evitamos solicitudes duplicadas.
    if (this.enviando) return;

    // Comprobamos los campos obligatorios.
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.enviando = true;

    const credenciales = this.loginForm.getRawValue();

    this.authService.login(credenciales).subscribe({
      next: () => {
        // No guardamos el JWT en localStorage.
        // El navegador administra la cookie HttpOnly.

        // Recuperamos una ruta interna solicitada (por ejemplo, una jugada), nunca un sitio externo.
        const solicitada = this.route.snapshot.queryParamMap.get('returnUrl');
        const destino =
          solicitada?.startsWith('/') &&
          !solicitada.startsWith('//') &&
          !/^\/(login|registro)([/?]|$)/.test(solicitada)
            ? solicitada
            : '/publicaciones';
        void this.router
          .navigateByUrl(destino)
          .then((navegacionExitosa) => {
            this.enviando = false;

            if (!navegacionExitosa) {
              this.mensajeError = 'La sesión se inició, pero no se pudo abrir Publicaciones.';
              this.cdr.markForCheck();
            }
          })
          .catch(() => {
            this.enviando = false;
            this.mensajeError = 'La sesión se inició, pero ocurrió un error al navegar.';
            this.cdr.markForCheck();
          });
      },

      error: (error: HttpErrorResponse) => {
        this.enviando = false;

        if (error.status === 401) {
          this.mensajeError =
            typeof error.error?.message === 'string' &&
            error.error.message.includes('deshabilitada')
              ? error.error.message
              : 'El usuario o la contraseña son incorrectos.';
        } else if (error.status === 400) {
          this.mensajeError = 'Completá tu usuario y contraseña.';
        } else if (error.status === 0) {
          this.mensajeError = 'No se pudo conectar con el servidor.';
        } else {
          this.mensajeError = 'Ocurrió un error al iniciar sesión.';
        }

        this.cdr.markForCheck();
      },
    });
  }
}
