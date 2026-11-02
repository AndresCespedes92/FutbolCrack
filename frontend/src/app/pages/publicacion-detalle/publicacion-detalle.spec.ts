import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from '../../app.routes';
import { PublicacionDetalle } from './publicacion-detalle';
import {
  API_PRUEBA,
  jugadorPrueba,
  paginaPrueba,
  publicacionPrueba,
} from '../../testing/publicaciones-fixture';
import { comentarioPrueba, paginaComentarios } from '../../testing/comentarios-fixture';

describe('Detalle: navegación real por ID y componentes compartidos', () => {
  let http: HttpTestingController;
  const url = (id = publicacionPrueba()._id) => `${API_PRUEBA}/publicaciones/${id}`;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function sesion(autenticado = true) {
    const solicitud = http.expectOne(`${API_PRUEBA}/auth/me`);
    if (autenticado) solicitud.flush(jugadorPrueba);
    else solicitud.flush({}, { status: 401, statusText: 'Unauthorized' });
  }
  function comentarios(harness: RouterTestingHarness, id = publicacionPrueba()._id) {
    harness.detectChanges();
    const solicitud = http.expectOne((req) => req.url === `${url(id)}/comentarios`);
    expect(solicitud.request.params.get('limit')).toBe('3');
    solicitud.flush(paginaComentarios([comentarioPrueba(1, id)]));
    harness.detectChanges();
  }
  it('abre URL directa, pide un único ID y muestra descripción íntegra, imagen, likes y comentarios', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/publicaciones/${publicacionPrueba()._id}`, PublicacionDetalle);
    sesion();
    const texto = 'Jugada completa '.repeat(40);
    http.expectOne(url()).flush({ ...publicacionPrueba(), descripcion: texto });
    comentarios(harness);
    const html = harness.routeNativeElement!;
    expect(html.querySelector('h1')?.textContent).toContain('Detalle de publicación');
    expect(html.querySelector('.post-body p')?.textContent).toBe(texto);
    expect(html.querySelector('.post-image')).toBeTruthy();
    expect(html.querySelector('.cantidad-likes')?.textContent).toContain('2 Me gusta');
    expect(html.querySelector('.texto-comentario')?.textContent).toContain('Comentario 1');
    expect(html.querySelector('.expandir')).toBeNull();
    http.expectNone(`${API_PRUEBA}/publicaciones`);
  });
  it.each(['Ver detalle', 'Agregar comentario'])(
    'abre detalle mediante %s y el mismo Output de la tarjeta',
    async (accion) => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/publicaciones');
      sesion();
      http
        .expectOne((req) => req.url === `${API_PRUEBA}/publicaciones`)
        .flush(paginaPrueba([publicacionPrueba()]));
      harness.detectChanges();
      Array.from(harness.routeNativeElement!.querySelectorAll('button'))
        .find((b) => b.textContent?.includes(accion))!
        .click();
      await vi.waitFor(() =>
        expect(TestBed.inject(Router).url).toBe(`/publicaciones/${publicacionPrueba()._id}`),
      );
      sesion();
      http.expectOne(url()).flush(publicacionPrueba());
      comentarios(harness);
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
        'Detalle de publicación',
      );
    },
  );
  it('sin sesión permite leer pero no comentar ni votar', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/publicaciones/${publicacionPrueba()._id}`);
    sesion(false);
    http.expectOne(url()).flush(publicacionPrueba());
    comentarios(harness);
    expect(harness.routeNativeElement?.querySelector<HTMLButtonElement>('.like')?.disabled).toBe(
      true,
    );
    expect(harness.routeNativeElement?.querySelector('.nuevo-comentario')).toBeNull();
    expect(harness.routeNativeElement?.textContent).toContain('Iniciá sesión');
  });
  it('ante 404 muestra publicación inexistente y no solicita comentarios', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/publicaciones/${publicacionPrueba()._id}`);
    sesion();
    http.expectOne(url()).flush({}, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain(
      'La publicación no existe o fue dada de baja',
    );
    expect(harness.routeNativeElement?.querySelector('app-publicacion-card')).toBeNull();
    http.expectNone((req) => req.url.endsWith('/comentarios'));
  });
  it('no muestra una publicación inactiva aunque un cliente/backend viejo la devuelva', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/publicaciones/${publicacionPrueba()._id}`);
    sesion();
    http.expectOne(url()).flush({ ...publicacionPrueba(), activo: false });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('app-publicacion-card')).toBeNull();
    http.expectNone((req) => req.url.endsWith('/comentarios'));
  });
  it('rechaza ID inválido en la URL sin descargar el feed', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/publicaciones/incorrecto');
    sesion(false);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain(
      'El identificador de publicación no es válido',
    );
    http.expectNone((req) => req.url.includes('/publicaciones'));
  });
  it('permite reintentar un error de lectura y conserva el fallback de publicaciones antiguas', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/publicaciones/${publicacionPrueba()._id}`);
    sesion();
    http.expectOne(url()).flush({}, { status: 500, statusText: 'Error' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar',
    );
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.demo-note button')!.click();
    http.expectOne(url()).flush({
      ...publicacionPrueba(),
      titulo: undefined,
      descripcion: undefined,
      contenido: 'Jugada antigua',
    });
    comentarios(harness);
    expect(harness.routeNativeElement?.textContent).toContain('Publicación anterior');
    expect(harness.routeNativeElement?.textContent).toContain('Jugada antigua');
  });
  it('cambia de ID en la misma ruta sin mezclar jugadas ni comentarios', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/publicaciones/${publicacionPrueba()._id}`);
    sesion();
    http.expectOne(url()).flush(publicacionPrueba());
    comentarios(harness);
    const segundo = publicacionPrueba(2)._id;
    await harness.navigateByUrl(`/publicaciones/${segundo}`);
    http.expectOne(url(segundo)).flush(publicacionPrueba(2));
    comentarios(harness, segundo);
    expect(harness.routeNativeElement?.querySelector('.post-body h2')?.textContent).toContain(
      'Jugada 2',
    );
    expect(harness.routeNativeElement?.querySelectorAll('.comentario').length).toBe(1);
  });
});
