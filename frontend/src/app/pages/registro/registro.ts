
import { NgClass } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { crearFormularioRegistro } from '../../forms/registro-form';
import { fechaLocalHoy } from '../../validators/registro.validators';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, ReactiveFormsModule, NgClass],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  // Servicio encargado de comunicarse con NestJS.
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);

  readonly registroForm = crearFormularioRegistro();
  readonly campos = this.registroForm.controls;
  readonly fechaMaxima = fechaLocalHoy();

  // Estados para informar al usuario sobre el registro.
  enviando = false;
  mensajeExito = '';
  mensajeError = '';

  esInvalido(control: AbstractControl): boolean {
    const interactuo = control.touched || control.dirty;
    const clavesDistintas =
      control === this.campos.repetirClave &&
      this.registroForm.hasError('clavesNoCoinciden');

    return interactuo && (control.invalid || clavesDistintas);
  }

  esValido(control: AbstractControl): boolean {
    const tieneDato =
      typeof control.value === 'string'
        ? control.value.trim() !== ''
        : control.value !== null;

    return (
      tieneDato &&
      (control.touched || control.dirty) &&
      control.valid &&
      !this.esInvalido(control)
    );
  }

  clasesCampo(control: AbstractControl) {
    return {
      'input-invalido': this.esInvalido(control),
      'input-valido': this.esValido(control),
    };
  }

  mensajeCampo(control: AbstractControl): string {
    if (!this.esInvalido(control)) {
      return this.esValido(control) ? 'Dato válido.' : '';
    }

    if (control.hasError('required'))
      return 'Este campo es obligatorio.';

    if (control.hasError('minlength'))
      return `Ingresá al menos ${control.getError('minlength').requiredLength} caracteres.`;

    if (control.hasError('maxlength'))
      return `Usá como máximo ${control.getError('maxlength').requiredLength} caracteres.`;

    if (control.hasError('email'))
      return 'Ingresá un correo válido, por ejemplo nombre@ejemplo.com.';

    if (control.hasError('pattern')) {
      if (control === this.campos.usuario)
        return 'Empezá con una letra o número. Usá letras sin acentos, números, puntos o guion bajo.';

      if (control === this.campos.clave)
        return 'La contraseña debe contener al menos una mayúscula y un número.';

      return 'Usá letras; separá las palabras con un espacio, guion o apóstrofe.';
    }

    if (control.hasError('fechaInvalida'))
      return 'Ingresá una fecha de nacimiento real.';

    if (control.hasError('fechaFutura'))
      return 'La fecha de nacimiento no puede ser futura.';

    if (control.hasError('tipoImagen'))
      return 'Elegí una imagen JPG, PNG o WebP.';

    if (control.hasError('imagenGrande'))
      return 'La imagen debe pesar como máximo 5 MB.';

    return 'Las contraseñas deben coincidir.';
  }

  seleccionarImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;

    this.campos.imagenPerfil.setValue(
      entrada.files?.item(0) ?? null,
    );

    this.campos.imagenPerfil.markAsDirty();
    this.campos.imagenPerfil.markAsTouched();
  }

  /**
   * Envía el formulario de registro al backend NestJS.
   */
  registrar(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    // No enviamos datos inválidos ni solicitudes duplicadas.
    if (this.enviando) return;

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    // FormData permite enviar texto e imágenes juntos.
    const datos = new FormData();

    datos.append('nombre', this.campos.nombre.value);
    datos.append('apellido', this.campos.apellido.value);
    datos.append('correo', this.campos.correo.value);
    datos.append('nombreUsuario', this.campos.usuario.value);
    datos.append('password', this.campos.clave.value);
    datos.append('repetirPassword', this.campos.repetirClave.value);
    datos.append('fechaNacimiento', this.campos.fechaNacimiento.value);
    datos.append('descripcion', this.campos.descripcion.value);

    // El nombre "imagen" debe coincidir con FileInterceptor.
    const imagen = this.campos.imagenPerfil.value;

    if (imagen) {
      datos.append('imagen', imagen);
    }

    this.enviando = true;

    // HttpClient envía la solicitud cuando nos suscribimos.
    this.authService.registrar(datos).subscribe({
      next: (respuesta) => {
        this.mensajeExito = respuesta.mensaje;
        this.enviando = false;

        // Notifica a Angular que debe actualizar la pantalla.
        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {
        this.enviando = false;

        if (error.status === 409) {
          this.mensajeError =
            'El correo o nombre de usuario ya está registrado.';
        } else if (error.status === 400) {
          this.mensajeError =
            'Revisá los datos ingresados y volvé a intentarlo.';
        } else if (error.status === 0) {
          this.mensajeError =
            'No se pudo conectar con el servidor.';
        } else {
          this.mensajeError =
            'Ocurrió un error al crear la cuenta.';
        }
        this.cdr.markForCheck();
      },
    });
  }
}
