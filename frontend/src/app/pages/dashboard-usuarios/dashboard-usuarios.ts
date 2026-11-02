import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { crearFormularioRegistro } from '../../forms/registro-form';
import { AuthService } from '../../services/auth';
import { PerfilUsuario, UsuarioAdministrativo, UsuariosService } from '../../services/usuarios';
import { ConfirmacionUsuario } from '../../components/confirmacion-usuario/confirmacion-usuario';

// Contenedor del padrón: coordina formulario/listado/confirmación; el modal no conoce HTTP.
@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmacionUsuario],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.css',
})
export class DashboardUsuarios implements OnInit {
  private readonly api = inject(UsuariosService);
  readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  usuarios: UsuarioAdministrativo[] = [];
  cargando = false;
  creando = false;
  procesandoId: string | null = null;
  mensaje = '';
  errorListado = '';
  errorAlta = '';
  errorOperacion = '';
  sinPermiso = false;
  seleccionado: UsuarioAdministrativo | null = null;
  // Reutiliza reglas de CineBera/registro. Imagen queda null: alta administrativa de texto, sin subir fotos.
  readonly formulario = crearFormularioRegistro();
  readonly perfil = new FormControl<PerfilUsuario>('usuario', { nonNullable: true });
  readonly campos = this.formulario.controls;
  readonly camposTexto = [
    {
      nombre: 'nombre' as const,
      etiqueta: 'Nombre',
      tipo: 'text',
      ayuda: 'De 2 a 50 letras y separadores válidos.',
    },
    {
      nombre: 'apellido' as const,
      etiqueta: 'Apellido',
      tipo: 'text',
      ayuda: 'De 2 a 50 letras y separadores válidos.',
    },
    {
      nombre: 'correo' as const,
      etiqueta: 'Correo electrónico',
      tipo: 'email',
      ayuda: 'Ingresá un correo válido.',
    },
    {
      nombre: 'usuario' as const,
      etiqueta: 'Nombre de usuario',
      tipo: 'text',
      ayuda: 'De 3 a 20 caracteres; letras, números, punto o guion bajo.',
    },
    {
      nombre: 'clave' as const,
      etiqueta: 'Contraseña',
      tipo: 'password',
      ayuda:
        'De 8 a 64 caracteres, una mayúscula y un número; reducí longitud si usás muchos caracteres especiales.',
    },
    {
      nombre: 'repetirClave' as const,
      etiqueta: 'Repetir contraseña',
      tipo: 'password',
      ayuda: 'Debe coincidir con la contraseña.',
    },
    {
      nombre: 'fechaNacimiento' as const,
      etiqueta: 'Fecha de nacimiento',
      tipo: 'date',
      ayuda: 'Una fecha válida que no sea futura.',
    },
  ];
  ngOnInit(): void {
    this.cargarUsuarios();
  }
  cargarUsuarios(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.errorListado = '';
    this.cdr.markForCheck();
    this.api
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.cargando = false;
          this.sinPermiso = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.cargando = false;
          this.errorListado = this.explicarError(error);
          if (error.status === 403) {
            this.sinPermiso = true;
            this.usuarios = [];
          }
          this.cdr.markForCheck();
        },
      });
  }
  crearUsuario(): void {
    if (this.creando || this.cargando || this.procesandoId || this.sinPermiso) return;
    this.errorAlta = '';
    this.mensaje = '';
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.creando = true;
    const datos = this.formulario.getRawValue();
    this.api
      .crear({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim(),
        nombreUsuario: datos.usuario.trim(),
        password: datos.clave,
        repetirPassword: datos.repetirClave,
        fechaNacimiento: datos.fechaNacimiento,
        descripcion: datos.descripcion.trim(),
        perfil: this.perfil.value,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.creando = false;
          this.mensaje = respuesta.mensaje;
          this.formulario.reset();
          this.perfil.setValue('usuario');
          this.cargarUsuarios();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.creando = false;
          this.errorAlta = this.explicarError(error);
          this.cdr.markForCheck();
        },
      });
  }
  puedeDeshabilitar(usuario: UsuarioAdministrativo): boolean {
    return usuario.activo !== false && usuario._id !== this.auth.usuarioActual()?.id;
  }
  solicitarDeshabilitar(usuario: UsuarioAdministrativo): void {
    if (
      !this.puedeDeshabilitar(usuario) ||
      this.procesandoId ||
      this.creando ||
      this.cargando ||
      this.sinPermiso
    )
      return;
    this.seleccionado = usuario;
    this.errorOperacion = '';
    this.mensaje = '';
  }
  cancelarBaja(): void {
    if (!this.procesandoId) {
      this.seleccionado = null;
      this.errorOperacion = '';
    }
  }
  confirmarBaja(): void {
    const usuario = this.seleccionado;
    if (!usuario || this.procesandoId || !this.puedeDeshabilitar(usuario)) return;
    this.procesandoId = usuario._id;
    this.errorOperacion = '';
    this.api
      .deshabilitar(usuario._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.procesandoId = null;
          this.seleccionado = null;
          this.mensaje = respuesta.mensaje;
          this.cargarUsuarios();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.procesandoId = null;
          this.errorOperacion = this.explicarError(error);
          this.cdr.markForCheck();
        },
      });
  }
  habilitar(usuario: UsuarioAdministrativo): void {
    if (
      usuario.activo !== false ||
      this.procesandoId ||
      this.creando ||
      this.cargando ||
      this.sinPermiso
    )
      return;
    this.procesandoId = usuario._id;
    this.errorOperacion = '';
    this.mensaje = '';
    this.api
      .habilitar(usuario._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.procesandoId = null;
          this.mensaje = respuesta.mensaje;
          this.cargarUsuarios();
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.procesandoId = null;
          this.errorOperacion = this.explicarError(error);
          this.cdr.markForCheck();
        },
      });
  }
  private explicarError(error: HttpErrorResponse): string {
    if (error.status === 401)
      return 'Tu sesión venció o tu cuenta está deshabilitada. Iniciá sesión nuevamente.';
    if (error.status === 403) return 'No tenés permiso para administrar usuarios.';
    if (error.status === 404) return 'El usuario ya no está disponible. Actualizá el listado.';
    if (error.status === 409)
      return typeof error.error?.message === 'string'
        ? error.error.message
        : 'Los datos o el estado cambiaron. Actualizá el listado.';
    if (error.status === 400)
      return 'Revisá los datos: formato, rol y coincidencia de contraseñas.';
    return error.status === 0
      ? 'No se pudo conectar con el servidor. Intentá nuevamente.'
      : 'No pudimos completar la operación. Intentá nuevamente.';
  }
}
