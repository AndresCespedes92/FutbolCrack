import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth';

// Directiva estructural: inserta/retira su plantilla al cambiar la sesión en memoria.
// SOLO ayuda visual. Nest sigue comprobando rol/activo en cada solicitud protegida.
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
