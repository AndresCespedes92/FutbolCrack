import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { crearFormularioRegistro } from '../../forms/registro-form';
import { fechaLocalHoy } from '../../validators/registro.validators';

// Registro presenta las reglas y los estados visuales; no crea usuarios ni llama servicios.
@Component({
  selector: 'app-registro',
  imports: [RouterLink, ReactiveFormsModule, NgClass],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  readonly registroForm = crearFormularioRegistro();
  // Alias para que los bindings HTML sean cortos y fáciles de seguir.
  readonly campos = this.registroForm.controls;
  readonly fechaMaxima = fechaLocalHoy();

  // touched = salió del campo; dirty = cambió su valor. Antes de eso no mostramos errores.
  esInvalido(control: AbstractControl): boolean {
    const interactuo = control.touched || control.dirty;
    const clavesDistintas =
      control === this.campos.repetirClave && this.registroForm.hasError('clavesNoCoinciden');
    return interactuo && (control.invalid || clavesDistintas);
  }

  esValido(control: AbstractControl): boolean {
    // Un campo opcional vacío queda neutro aunque Angular lo considere válido.
    const tieneDato =
      typeof control.value === 'string' ? control.value.trim() !== '' : control.value !== null;
    return (
      tieneDato && (control.touched || control.dirty) && control.valid && !this.esInvalido(control)
    );
  }

  // ngClass agrega o quita ambas clases cada vez que cambia el estado del control.
  clasesCampo(control: AbstractControl) {
    return { 'input-invalido': this.esInvalido(control), 'input-valido': this.esValido(control) };
  }

  // Un mensaje por campo evita errores simultáneos; el texto acompaña el color por accesibilidad.
  mensajeCampo(control: AbstractControl): string {
    if (!this.esInvalido(control)) return this.esValido(control) ? 'Dato válido.' : '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
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
        return 'La contraseña no puede contener solamente espacios.';
      return 'Usá letras; separá las palabras con un espacio, guion o apóstrofe.';
    }
    if (control.hasError('fechaInvalida')) return 'Ingresá una fecha de nacimiento real.';
    if (control.hasError('fechaFutura')) return 'La fecha de nacimiento no puede ser futura.';
    if (control.hasError('tipoImagen')) return 'Elegí una imagen JPG, PNG o WebP.';
    if (control.hasError('imagenGrande')) return 'La imagen debe pesar como máximo 5 MB.';
    return 'Las contraseñas deben coincidir.';
  }

  // Los inputs file necesitan un change explícito: formControlName no maneja objetos File.
  seleccionarImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.campos.imagenPerfil.setValue(entrada.files?.item(0) ?? null);
    this.campos.imagenPerfil.markAsDirty();
    this.campos.imagenPerfil.markAsTouched();
  }
}
