import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';
import { AuthService } from '../../services/auth';

describe('Navbar: enlaces según la sesión compartida', () => {
  const usuarioActual = signal<{ perfil: string; activo: boolean } | null>(null);
  beforeEach(async () => {
    usuarioActual.set(null);
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([]), { provide: AuthService, useValue: { usuarioActual } }],
    }).compileComponents();
  });
  it('sin sesión ofrece ingresar/registrarse y no muestra Mi perfil', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/registro"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/mi-perfil"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/dashboard/usuarios"]')).toBeNull();
  });
  it('actualiza los enlaces al iniciar y finalizar la sesión sin recargar', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    usuarioActual.set({ perfil: 'usuario', activo: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/mi-perfil"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/registro"]')).toBeNull();
    usuarioActual.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/mi-perfil"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/registro"]')).not.toBeNull();
  });
  it('conserva accesos administrativos con sesión de administrador', () => {
    usuarioActual.set({ perfil: 'administrador', activo: true });
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/dashboard/usuarios"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/dashboard/estadisticas"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/registro"]')).toBeNull();
  });
});
