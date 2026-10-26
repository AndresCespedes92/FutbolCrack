import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('Navegación de FutbolCrack', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('muestra los cuatro enlaces de navegación', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = fixture.nativeElement.querySelectorAll('nav a');
    expect(links.length).toBe(4);
  });

  it('permite acceder directamente a todas las pantallas públicas', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of ['/login', '/registro', '/publicaciones', '/mi-perfil']) {
      await harness.navigateByUrl(url);
      expect(harness.routeNativeElement?.querySelector('h1')).toBeTruthy();
    }
  });

  it('redirige el inicio y las rutas desconocidas a publicaciones', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of ['/', '/pagina-inexistente']) {
      await harness.navigateByUrl(url);
      expect(harness.routeNativeElement?.textContent).toContain('El juego nos conecta');
    }
  });
});
