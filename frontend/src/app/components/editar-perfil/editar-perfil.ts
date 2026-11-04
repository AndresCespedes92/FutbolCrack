import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { crearFormularioRegistro } from '../../forms/registro-form';
import { fechaLocalHoy } from '../../validators/registro.validators';
import { AuthService, Usuario } from '../../services/auth';

/** Editor de la ficha propia. Reutiliza las reglas del registro, como en CineBera,
 * sin incluir claves ni permisos. Input entrega una copia inicial; Output comunica
 * al padre únicamente el usuario confirmado por Nest, o la cancelación sin petición.
 */
@Component({
  selector: 'app-editar-perfil', standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './editar-perfil.html', styleUrl: './editar-perfil.css',
})
export class EditarPerfil implements OnInit {
  @Input({ required: true }) usuario!: Usuario;
  @Output() guardado = new EventEmitter<Usuario>();
  @Output() cancelar = new EventEmitter<void>();
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  // Cada editor recibe controles nuevos; se comparten reglas, nunca valores entre usuarios.
  readonly campos = crearFormularioRegistro().controls;
  readonly formulario = new FormGroup({
    nombre: this.campos.nombre, apellido: this.campos.apellido,
    correo: this.campos.correo, usuario: this.campos.usuario,
    fechaNacimiento: this.campos.fechaNacimiento,
    descripcion: this.campos.descripcion, imagenPerfil: this.campos.imagenPerfil,
  });
  readonly camposTexto = [
    { control: 'nombre', etiqueta: 'Nombre', tipo: 'text', autocomplete: 'given-name', maximo: 50 },
    { control: 'apellido', etiqueta: 'Apellido', tipo: 'text', autocomplete: 'family-name', maximo: 50 },
    { control: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', autocomplete: 'email', maximo: 254 },
    { control: 'usuario', etiqueta: 'Nombre de usuario', tipo: 'text', autocomplete: 'username', maximo: 20 },
  ] as const;
  readonly hoy = fechaLocalHoy();
  guardando = false;
  error = '';
  ngOnInit(): void {
    this.campos.correo.addValidators(Validators.maxLength(254));
    this.formulario.patchValue({ ...this.usuario, usuario: this.usuario.nombreUsuario,
      fechaNacimiento: this.usuario.fechaNacimiento.slice(0, 10), imagenPerfil: null });
  }
  clasesCampo(nombre: keyof typeof this.formulario.controls) {
    const campo = this.formulario.controls[nombre];
    const mostrar = campo.touched || campo.dirty;
    return { 'campo-error': mostrar && campo.invalid, 'campo-valido': mostrar && campo.valid };
  }
  errorCampo(nombre: keyof typeof this.formulario.controls): string {
    const campo = this.formulario.controls[nombre];
    if (!(campo.touched || campo.dirty) || !campo.errors) return '';
    if (campo.hasError('required')) return 'Completá este campo.';
    if (nombre === 'imagenPerfil') return 'Elegí una imagen JPEG, PNG o WebP de hasta 5 MiB.';
    if (nombre === 'fechaNacimiento') return 'Ingresá una fecha real que no sea futura.';
    if (nombre === 'correo') return 'Ingresá un correo válido de hasta 254 caracteres.';
    if (nombre === 'descripcion') return 'La descripción admite hasta 300 caracteres.';
    if (nombre === 'usuario') return 'Usá entre 3 y 20 letras, números, puntos o guiones bajos; comenzá con letra o número.';
    return 'Usá entre 2 y 50 letras; se permiten espacios, guiones y apóstrofes entre palabras.';
  }
  seleccionarImagen(evento: Event): void {
    this.campos.imagenPerfil.setValue((evento.target as HTMLInputElement).files?.[0] ?? null);
    this.campos.imagenPerfil.markAsTouched();
    this.campos.imagenPerfil.markAsDirty();
  }
  /** Solo el PATCH exitoso actualiza la ficha; en 400/409/red conservamos el borrador.
   * FormData deja al navegador generar el boundary y omite imagen si no se reemplazó.
   */
  guardar(): void {
    if (this.guardando) return;
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    const datos = new FormData();
    const valor = this.formulario.getRawValue();
    datos.append('nombre', valor.nombre.trim());
    datos.append('apellido', valor.apellido.trim());
    datos.append('correo', valor.correo.trim().toLowerCase());
    datos.append('nombreUsuario', valor.usuario.trim());
    datos.append('fechaNacimiento', valor.fechaNacimiento);
    datos.append('descripcion', valor.descripcion.trim());
    if (valor.imagenPerfil) datos.append('imagen', valor.imagenPerfil);
    this.guardando = true;
    this.error = '';
    this.auth.actualizarMiPerfil(datos).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => { this.guardando = false; this.guardado.emit(respuesta.usuario); },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        const mensaje = error.error?.message;
        this.error = error.status === 401 ? 'Tu sesión venció. Iniciá sesión nuevamente.'
          : error.status === 403 ? 'La solicitud fue rechazada. Revisá tu sesión y volvé a intentar.'
          : [400, 409, 413].includes(error.status) ? (Array.isArray(mensaje) ? mensaje.join(' ') : mensaje) || 'Revisá los datos y el tamaño de la imagen.'
          : 'No pudimos guardar tu perfil. Conservamos tus cambios para que reintentes.';
        this.cdr.markForCheck();
      },
    });
  }
}
