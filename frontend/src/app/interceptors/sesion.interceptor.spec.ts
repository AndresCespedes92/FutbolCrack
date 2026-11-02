import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { sesionInterceptor } from './sesion.interceptor';
import { AuthService } from '../services/auth';
import { API_URL } from '../services/api.config';
import { sesionPrueba } from '../testing/sesion-fixture';
describe('Interceptor: 401 protegido frente a 403/error transitorio', () => {
  let http: HttpTestingController, client: HttpClient, auth: AuthService;
  const router = { url: '/mi-perfil', navigate: vi.fn().mockResolvedValue(true) };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sesionInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    router.navigate.mockClear();
    auth.autorizar().subscribe();
    http.expectOne(`${API_URL}/auth/autorizar`).flush(sesionPrueba());
  });
  afterEach(() => http.verify());
  it.each([
    ['GET', '/auth/me'],
    ['POST', '/auth/refrescar'],
    ['GET', '/usuarios'],
    ['GET', '/estadisticas/publicaciones-por-usuario'],
    ['GET', '/estadisticas/comentarios-totales'],
    ['GET', '/estadisticas/comentarios-por-publicacion'],
    ['POST', '/publicaciones'],
    ['PUT', '/comentarios/1'],
  ])('%s %s con 401 limpia sesión y redirige', (metodo, ruta) => {
    client.request(metodo, API_URL + ruta).subscribe({ error: () => {} });
    http.expectOne(API_URL + ruta).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuarioActual()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
  it.each([403, 500])('status %s conserva sesión y propaga error sin redirigir', (status) => {
    const error = vi.fn();
    client.delete(`${API_URL}/publicaciones/1`).subscribe({ error });
    http.expectOne(`${API_URL}/publicaciones/1`).flush({}, { status, statusText: 'Error' });
    expect(error).toHaveBeenCalledTimes(1);
    expect(auth.usuarioActual()).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it.each(['/auth/login', '/auth/autorizar'])(
    '401 esperado en %s no produce bucle global',
    (ruta) => {
      client.post(API_URL + ruta, {}).subscribe({ error: () => {} });
      http.expectOne(API_URL + ruta).flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(router.navigate).not.toHaveBeenCalled();
      expect(auth.usuarioActual()).not.toBeNull();
    },
  );
  it.each([
    'https://otro.example/publicaciones',
    'https://futbol-crackbackend.vercel.app.atacante.test/publicaciones',
    '/publicaciones',
  ])('no intercepta el 401 de otra API/URL relativa: %s', (url) => {
    client.post(url, {}).subscribe({ error: () => {} });
    http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.usuarioActual()).not.toBeNull();
  });
  it('estadísticas con 403 conserva sesión y permite mostrar el error de permisos', () => {
    client.get(`${API_URL}/estadisticas/comentarios-totales`).subscribe({ error: () => {} });
    http
      .expectOne(`${API_URL}/estadisticas/comentarios-totales`)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.usuarioActual()).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
