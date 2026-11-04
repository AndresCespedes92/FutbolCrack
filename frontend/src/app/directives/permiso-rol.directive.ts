import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth';

// Directiva estructural: inserta/retira su plantilla al cambiar la sesión en memoria.
// SOLO ayuda visual. Nest sigue comprobando rol/activo en cada solicitud protegida.
/**
 * Directiva estructural: *appPermisoRol transforma el contenido en una plantilla que podemos
 * insertar o retirar. TemplateRef representa ese fragmento y ViewContainerRef el lugar donde vive.
 * input.required acepta un rol o varios; effect vuelve a evaluar al cambiar esa entrada o la
 * signal usuarioActual de AuthService. No consulta HTTP ni lee una cookie HttpOnly.
 * createEmbeddedView muestra el contenido solo una vez; clear lo retira al perder el permiso.
 * El navbar la utiliza para enlaces administrativos. Es presentación: escribir la URL o enviar
 * Postman sigue siendo posible, por eso los guards de Angular/Nest y MongoDB deciden el acceso.
 */
@Directive({ selector: '[appPermisoRol]', standalone: true })
export class PermisoRolDirective {
  readonly appPermisoRol = input.required<string | readonly string[]>();
  private readonly auth = inject(AuthService);
  private readonly plantilla = inject(TemplateRef<unknown>);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;
  constructor() {
    effect(() => {
      const usuario = this.auth.usuarioActual();
      const permiso = this.appPermisoRol();
      const roles = typeof permiso === 'string' ? [permiso] : permiso;
      const permitido = !!usuario && usuario.activo !== false && roles.includes(usuario.perfil);
      if (permitido && !this.visible) this.contenedor.createEmbeddedView(this.plantilla);
      if (!permitido && this.visible) this.contenedor.clear();
      this.visible = permitido;
    });
  }
}
