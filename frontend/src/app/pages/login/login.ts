//El usuario ingresa su correo o nombre de usuario y contraseña.
// Angular envía los datos mediante AuthService.login().
// NestJS verifica la contraseña con bcrypt.
// Si es correcta, devuelve un JWT y los datos del usuario.
// Angular muestra el resultado y, posteriormente, utilizaremos el token para acceder a funcionalidades protegidas.



import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  // Inyección de dependencias:
  // AuthService realiza las peticiones al backend.
  private readonly authService = inject(AuthService);

  // Permite actualizar la vista cuando responde HTTP.
  private readonly cdr = inject(ChangeDetectorRef);

  // Formulario reactivo con sus validaciones.
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

  // Estados visuales del formulario.
  enviando = false;
  mensajeError = '';
  mensajeExito = '';

  /**
   * Envía las credenciales al backend NestJS.
   */
  iniciarSesion(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    // Evitamos solicitudes duplicadas.
    if (this.enviando) return;

    // Si faltan campos, marcamos los controles.
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.enviando = true;

    // getRawValue() obtiene los valores del formulario.
    const credenciales = this.loginForm.getRawValue();

    this.authService.login(credenciales).subscribe({
      next: (respuesta) => {
        this.enviando = false;

        // Por ahora comprobamos que la autenticación funcione.
        // En el siguiente paso implementaremos el manejo
        // de la sesión y la navegación.
        this.mensajeExito =
          `Bienvenido, ${respuesta.usuario.nombre}. Sesión iniciada correctamente.`;

        // Nunca mostramos el JWT en pantalla ni en consola.
        this.cdr.markForCheck();
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
