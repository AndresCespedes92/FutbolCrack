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
      expect(harness.routeNativeElement?.textContent).toContain('Tu talento');
    }
  });

  it('presenta los nueve campos de registro y mantiene el envío deshabilitado', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/registro');
    const page = harness.routeNativeElement!;
    expect(page.querySelectorAll('input, textarea').length).toBe(9);
    expect(page.querySelector<HTMLInputElement>('input[type="file"]')?.accept).toBe(
      'image/jpeg,image/png,image/webp',
    );
    expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(page.textContent).toContain('No se crea una cuenta');
  });

  it('comparte tarjetas entre feed y perfil y muestra solo las publicaciones del jugador', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/publicaciones');
    expect(harness.routeNativeElement?.querySelectorAll('app-publicacion-card').length).toBe(4);
    expect(harness.routeNativeElement?.querySelectorAll('.post-image').length).toBe(1);
    expect(harness.routeNativeElement?.querySelectorAll('.video-demo').length).toBe(1);
    expect(harness.routeNativeElement?.querySelector('.trial-details')?.textContent).toContain(
      'Sub-23',
    );
    expect(harness.routeNativeElement?.querySelector('.trial-note')?.textContent).toContain(
      'Convocatoria ficticia',
    );
    await harness.navigateByUrl('/mi-perfil');
    const cards = harness.routeNativeElement!.querySelectorAll('app-publicacion-card');
    expect(cards.length).toBe(2);
    expect(harness.routeNativeElement?.querySelector('.player-facts')?.textContent).toContain(
      'Pierna hábil',
    );
    expect(harness.routeNativeElement?.querySelector('.career-list')?.textContent).toContain(
      'Club Barrio Sur',
    );
    expect(harness.routeNativeElement?.querySelector('.trial-details')).toBeNull();
    for (const card of cards) {
      expect(card.textContent).toContain('Mateo Ríos');
      expect(card.textContent).not.toContain('Lucía Torres');
    }
  });
});
