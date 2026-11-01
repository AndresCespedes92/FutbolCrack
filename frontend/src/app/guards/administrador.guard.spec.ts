import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { routes } from '../app.routes';
import { API_URL } from '../services/api.config';
import { AuthService } from '../services/auth';
import { sesionPrueba } from '../testing/sesion-fixture';
import { jugadorPrueba, paginaPrueba } from '../testing/publicaciones-fixture';
import { administradorPrueba, usuarioAdministrativoPrueba } from '../testing/usuarios-fixture';
describe('Ruta dashboard/usuarios y guard administrativo', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('admin accede por URL directa y obtiene usuarios desde la API protegida', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/dashboard/usuarios');
    await vi.waitFor(() =>
      http.expectOne(`${API_URL}/auth/autorizar`).flush(sesionPrueba(administradorPrueba)),
    );
    await navegacion;
    http.expectOne(`${API_URL}/usuarios`).flush([usuarioAdministrativoPrueba()]);
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/dashboard/usuarios');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Usuarios');
  });
  it('usuario común vuelve al feed con mensaje y conserva sesión; no consulta el padrón', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/dashboard/usuarios');
    await vi.waitFor(() =>
      http.expectOne(`${API_URL}/auth/autorizar`).flush(sesionPrueba(jugadorPrueba)),
    );
    await navegacion;
    http.expectOne((req) => req.url === `${API_URL}/publicaciones`).flush(paginaPrueba([]));
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/publicaciones?acceso=sin-permiso');
    expect(harness.routeNativeElement?.textContent).toContain(
      'No tenés permiso para administrar usuarios',
    );
    expect(TestBed.inject(AuthService).usuarioActual()).not.toBeNull();
    http.expectNone(`${API_URL}/usuarios`);
  });
  it('sin sesión lleva a login conservando el destino y no descarga usuarios', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/dashboard/usuarios');
    await vi.waitFor(() =>
      http
        .expectOne(`${API_URL}/auth/autorizar`)
        .flush({}, { status: 401, statusText: 'Unauthorized' }),
    );
    await navegacion;
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fdashboard%2Fusuarios');
    http.expectNone(`${API_URL}/usuarios`);
  });
  it('admin entra al dashboard de estadísticas y solicita los tres reportes con fechas', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/dashboard/estadisticas');
    await vi.waitFor(() =>
      http.expectOne(`${API_URL}/auth/autorizar`).flush(sesionPrueba(administradorPrueba)),
    );
    await navegacion;
    const solicitudes = http.match((r) => r.url.includes('/estadisticas/'));
    expect(solicitudes.length).toBe(3);
    for (const req of solicitudes) {
      expect(req.request.params.has('desde')).toBe(true);
      expect(req.request.params.has('hasta')).toBe(true);
      req.flush({
        desde: req.request.params.get('desde'),
        hasta: req.request.params.get('hasta'),
        zonaHoraria: 'UTC-03:00',
        datos: [],
        total: 0,
        dias: [],
      });
    }
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/dashboard/estadisticas');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Estadísticas');
  });
  it.each([false, true])(
    'estadísticas rechaza acceso sin permisos; autenticado=%s',
    async (autenticado) => {
      const harness = await RouterTestingHarness.create();
      const navegacion = harness.navigateByUrl('/dashboard/estadisticas');
      await vi.waitFor(() => {
        const req = http.expectOne(`${API_URL}/auth/autorizar`);
        if (autenticado) req.flush(sesionPrueba(jugadorPrueba));
        else req.flush({}, { status: 401, statusText: 'Unauthorized' });
      });
      await navegacion;
      if (autenticado) {
        http.expectOne((r) => r.url === `${API_URL}/publicaciones`).flush(paginaPrueba([]));
        expect(TestBed.inject(Router).url).toBe('/publicaciones?acceso=sin-permiso');
      } else
        expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fdashboard%2Festadisticas');
      http.expectNone((r) => r.url.includes('/estadisticas/'));
    },
  );
});
