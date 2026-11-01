import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { vi } from 'vitest';
import { App } from './app';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { API_URL } from './services/api.config';
import { sesionPrueba } from './testing/sesion-fixture';
import { jugadorPrueba } from './testing/publicaciones-fixture';
import { instalarDialogDePrueba } from './testing/dialog-prueba';
@Component({ standalone: true, template: '<h1>Pantalla solicitada</h1>' })
class PantallaPrueba {}
describe('App 4C: carga inicial, recuperación y modal', () => {
  let fixture: ComponentFixture<App>,
    http: HttpTestingController,
    router: Router,
    restaurar: () => void;
  beforeEach(async () => {
    restaurar = instalarDialogDePrueba();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
          { path: 'publicaciones', component: PantallaPrueba },
          { path: 'publicaciones/:id', component: PantallaPrueba },
          { path: 'mi-perfil', component: PantallaPrueba, canActivate: [authGuard] },
          { path: 'login', component: Login },
          { path: 'registro', component: PantallaPrueba },
        ]),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });
  afterEach(() => {
    fixture?.destroy();
    restaurar();
    http.verify();
  });
  function crear() {
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  }
  const autorizacion = () => http.expectOne(`${API_URL}/auth/autorizar`);
  it('muestra spinner hasta autorizar y conserva la URL directa solicitada', async () => {
    await router.navigateByUrl('/publicaciones/000000000000000000000001');
    crear();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Comprobando tu sesión',
    );
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeNull();
    autorizacion().flush(sesionPrueba());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toBe('/publicaciones/000000000000000000000001');
    expect(fixture.nativeElement.textContent).toContain('Pantalla solicitada');
    expect(fixture.nativeElement.querySelector('.carga-sesion')).toBeNull();
  });
  it('sesión inválida redirige una vez a login, conserva destino y muestra mensaje', async () => {
    await router.navigateByUrl('/publicaciones/000000000000000000000001');
    crear();
    autorizacion().flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/login?returnUrl=%2Fpublicaciones%2F000000000000000000000001');
    expect(fixture.nativeElement.textContent).toContain('Iniciá sesión para continuar');
    http.expectNone(`${API_URL}/auth/autorizar`);
  });
  it.each(['/login', '/registro'])(
    'mantiene accesible %s sin sesión y no entra en un bucle',
    async (destino) => {
      await router.navigateByUrl(destino);
      crear();
      autorizacion().flush({}, { status: 401, statusText: 'Unauthorized' });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(router.url).toBe(destino);
      expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
      http.expectNone(`${API_URL}/auth/autorizar`);
    },
  );
  it('un error transitorio muestra Reintentar sin cerrar sesión ni redirigir a login', async () => {
    await router.navigateByUrl('/publicaciones');
    crear();
    autorizacion().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos comprobar',
    );
    expect(router.url).toBe('/publicaciones');
    fixture.nativeElement.querySelector('button').click();
    autorizacion().flush(sesionPrueba());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pantalla solicitada');
  });
  it('reconstruye el aviso al recargar con menos de cinco minutos y solo renueva al aceptar', async () => {
    await router.navigateByUrl('/publicaciones');
    crear();
    autorizacion().flush(sesionPrueba(jugadorPrueba, 4));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').textContent).toContain('4 minuto(s)');
    http.expectNone(`${API_URL}/auth/refrescar`);
    fixture.nativeElement.querySelector('dialog button:last-child').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog button').disabled).toBe(true);
    http.expectOne(`${API_URL}/auth/refrescar`).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog [role="alert"]').textContent).toContain(
      'No se pudo extender',
    );
    fixture.nativeElement.querySelector('dialog button:last-child').click();
    http.expectOne(`${API_URL}/auth/refrescar`).flush(sesionPrueba());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    expect(fixture.componentInstance.auth.expiraEn()).not.toBeNull();
  });
  it('Ahora no cierra el modal sin enviar refrescar', async () => {
    await router.navigateByUrl('/publicaciones');
    crear();
    autorizacion().flush(sesionPrueba(jugadorPrueba, 4));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('dialog button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    http.expectNone(`${API_URL}/auth/refrescar`);
  });
  it('el guard y la pantalla inicial comparten un único POST en una ruta protegida', async () => {
    const navegacion = router.navigateByUrl('/mi-perfil');
    let solicitud!: TestRequest;
    await vi.waitFor(() => {
      solicitud = autorizacion();
    });
    crear();
    http.expectNone(`${API_URL}/auth/autorizar`);
    solicitud.flush(sesionPrueba());
    await navegacion;
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/mi-perfil');
    expect(fixture.nativeElement.textContent).toContain('Pantalla solicitada');
    http.expectNone(`${API_URL}/auth/me`);
  });
  it('sin red ofrece shell de reconexión, no monta datos privados y reintenta autorización real', async () => {
    crear();
    autorizacion().error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('FutbolCrack');
    expect(fixture.nativeElement.textContent).toContain('No se guardan acciones pendientes');
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    const req = autorizacion();
    expect(req.request.method).toBe('POST');
    req.error(new ProgressEvent('error'));
    fixture.detectChanges();
  });
});
