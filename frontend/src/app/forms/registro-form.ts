import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  confirmarClaveValidator,
  fechaNacimientoValidator,
  imagenPerfilValidator,
} from '../validators/registro.validators';

// Adaptación de crearFormularioRegistro de CineBera: reglas separadas de la pantalla.
// Cada llamada crea controles nuevos; ningún dato se comparte entre visitas al registro.
export function crearFormularioRegistro() {
  // Letras Unicode (incluidos acentos), espacios, guiones y apóstrofes entre palabras.
  // Validamos también lo pegado: no bloqueamos teclas ni impedimos corregir el texto.
  const validadoresNombre = [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(50),
    Validators.pattern(/^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+)*$/u),
  ];
  return new FormGroup(
    {
      nombre: new FormControl('', { nonNullable: true, validators: validadoresNombre }),
      apellido: new FormControl('', { nonNullable: true, validators: validadoresNombre }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      usuario: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._]*$/),
        ],
      }),
      clave: new FormControl('', {
  nonNullable: true,
  validators: [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(64),

    // Debe contener al menos una letra mayúscula y un número.
    // (?=.*[A-Z]) busca una mayúscula.
    // (?=.*\d) busca un dígito.
    // .+ permite el resto de los caracteres.
    Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
  ],
}),
      repetirClave: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      fechaNacimiento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, fechaNacimientoValidator],
      }),
      descripcion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(300)],
      }),
      imagenPerfil: new FormControl<File | null>(null, { validators: [imagenPerfilValidator] }),
    },
    { validators: [confirmarClaveValidator] },
  );
}
