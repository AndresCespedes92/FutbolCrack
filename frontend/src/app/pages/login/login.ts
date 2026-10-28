//El usuario ingresa su correo o nombre de usuario y contraseña.
// Angular envía los datos mediante AuthService.login().
// NestJS verifica la contraseña con bcrypt.
// Si es correcta, devuelve un JWT y los datos del usuario.
// Angular muestra el resultado y, posteriormente, utilizaremos el token para acceder a funcionalidades protegidas.




import {
  Component,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  // Servicio que comunica Angular con NestJS.
  private readonly authService = inject(AuthService);

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

        // Navegamos a la pantalla de publicaciones.
        // Ajustaremos la ruta si app.routes.ts
        // utiliza un nombre diferente.
        void this.router.navigate(['/publicaciones'])
          .then((navegacionExitosa) => {
            this.enviando = false;

            if (!navegacionExitosa) {
              this.mensajeError =
                'La sesión se inició, pero no se pudo abrir Publicaciones.';
              this.cdr.markForCheck();
            }
          })
          .catch(() => {
            this.enviando = false;
            this.mensajeError =
              'La sesión se inició, pero ocurrió un error al navegar.';
            this.cdr.markForCheck();
          });
      },

      error: (error: HttpErrorResponse) => {
        this.enviando = false;

        if (error.status === 401) {
          this.mensajeError =
            'El usuario o la contraseña son incorrectos.';
        } else if (error.status === 400) {
          this.mensajeError =
            'Completá tu usuario y contraseña.';
        } else if (error.status === 0) {
          this.mensajeError =
            'No se pudo conectar con el servidor.';
        } else {
          this.mensajeError =
            'Ocurrió un error al iniciar sesión.';
        }

        this.cdr.markForCheck();
      },
    });
  }
}
