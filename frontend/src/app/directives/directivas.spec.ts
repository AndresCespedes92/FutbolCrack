import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ResaltarAutorDirective } from './resaltar-autor.directive';
import { AutoFocusDirective } from './auto-focus.directive';
import { PermisoRolDirective } from './permiso-rol.directive';
import { AuthService, Usuario } from '../services/auth';
import { jugadorPrueba } from '../testing/publicaciones-fixture';
@Component({
  standalone: true,
  imports: [ResaltarAutorDirective, AutoFocusDirective, PermisoRolDirective],
  template: ` <button class="fuera">Fuera del editor</button>
    <article class="comentario" [appResaltarAutor]="propio()">Comentario</article>
    @if (editando()) {
      <textarea appAutoFocus [disabled]="deshabilitado()"></textarea>
    }
    <p class="admin" *appPermisoRol="roles()">Administrar</p>`,
})
class PantallaDirectivasPrueba {
  propio = signal(false);
  editando = signal(false);
  deshabilitado = signal(false);
  roles = signal<string | readonly string[]>('administrador');
}
describe('Directivas standalone 5C: cambios reales de bindings y sesión', () => {
  let fixture: ComponentFixture<PantallaDirectivasPrueba>;
  const usuario = signal<Usuario | null>(null);
  const admin = { ...jugadorPrueba, perfil: 'administrador' };
  beforeEach(async () => {
    usuario.set(null);
    await TestBed.configureTestingModule({
      imports: [PantallaDirectivasPrueba],
      providers: [{ provide: AuthService, useValue: { usuarioActual: usuario } }],
    }).compileComponents();
    fixture = TestBed.createComponent(PantallaDirectivasPrueba);
    fixture.detectChanges();
  });
  it('resalta al autor y retira la clase cuando cambia identidad sin perder otras clases', () => {
    const articulo = fixture.nativeElement.querySelector('article');
    expect(articulo.classList.contains('comentario-propio')).toBe(false);
    fixture.componentInstance.propio.set(true);
    fixture.detectChanges();
    expect(articulo.classList.contains('comentario-propio')).toBe(true);
    fixture.componentInstance.propio.set(false);
    fixture.detectChanges();
    expect(articulo.classList.contains('comentario-propio')).toBe(false);
    expect(articulo.classList.contains('comentario')).toBe(true);
  });
  it('no roba foco en vista normal y enfoca textarea después de montar edición', async () => {
    const boton = fixture.nativeElement.querySelector('button');
    boton.focus();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(boton);
    fixture.componentInstance.editando.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('textarea'));
  });
  it('al cerrar y reabrir enfoca el nuevo editor, no una referencia destruida', async () => {
    fixture.componentInstance.editando.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const anterior = document.activeElement;
    fixture.componentInstance.editando.set(false);
    fixture.detectChanges();
    fixture.componentInstance.editando.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('textarea'));
    expect(document.activeElement).not.toBe(anterior);
  });
  it('un editor deshabilitado no toma foco', async () => {
    const boton = fixture.nativeElement.querySelector('button');
    boton.focus();
    fixture.componentInstance.deshabilitado.set(true);
    fixture.componentInstance.editando.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(boton);
  });
  it('visitante/usuario común no ve la plantilla; administrador activo sí', () => {
    expect(fixture.nativeElement.querySelector('.admin')).toBeNull();
    usuario.set(jugadorPrueba);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')).toBeNull();
    usuario.set(admin);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')?.textContent).toBe('Administrar');
  });
  it('cambio de rol, baja y logout retiran la plantilla; rehabilitar permite mostrarla', () => {
    usuario.set(admin);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')).not.toBeNull();
    usuario.set({ ...admin, activo: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')).toBeNull();
    usuario.set({ ...admin, activo: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')).not.toBeNull();
    usuario.set(jugadorPrueba);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')).toBeNull();
    usuario.set(admin);
    fixture.detectChanges();
    usuario.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin')).toBeNull();
  });
  it('acepta varios roles y actualiza el permiso sin duplicar vistas', () => {
    usuario.set(jugadorPrueba);
    fixture.componentInstance.roles.set(['usuario', 'administrador']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.admin').length).toBe(1);
    usuario.set({ ...jugadorPrueba, nombre: 'Cambio' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.admin').length).toBe(1);
    fixture.componentInstance.roles.set('administrador');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.admin').length).toBe(0);
  });
});
