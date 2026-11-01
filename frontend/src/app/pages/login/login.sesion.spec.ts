import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { Login } from './login';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/api.config';
import { sesionPrueba } from '../../testing/sesion-fixture';
@Component({ standalone: true, template: 'Destino' })
class Destino {}
describe('Login: metadatos y retorno seguro al detalle', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: Login },
          { path: 'publicaciones', component: Destino },
          { path: 'publicaciones/:id', component: Destino },
        ]),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function abrir(retorno: string) {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl(
      '/login?returnUrl=' + encodeURIComponent(retorno),
      Login,
    );
    login.loginForm.setValue({ identificador: 'lucia.8', password: 'ClaveSegura8' });
    login.iniciarSesion();
    return login;
  }
  it('recupera sesión del login y vuelve al detalle solicitado sin otra autorización', async () => {
    const destino = '/publicaciones/000000000000000000000001';
    await abrir(destino);
    http
      .expectOne(`${API_URL}/auth/login`)
      .flush({ mensaje: 'Inicio de sesión correcto', ...sesionPrueba() });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe(destino));
    expect(TestBed.inject(AuthService).usuarioActual()).not.toBeNull();
    http.expectNone(`${API_URL}/auth/autorizar`);
  });
  it('no acepta un returnUrl externo', async () => {
    await abrir('//atacante.example');
    http
      .expectOne(`${API_URL}/auth/login`)
      .flush({ mensaje: 'Inicio correcto', ...sesionPrueba() });
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/publicaciones'));
  });
  it('credenciales incorrectas conservan el formulario sin producir navegación', async () => {
    const login = await abrir('/publicaciones');
    http.expectOne(`${API_URL}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(login.loginForm.controls.identificador.value).toBe('lucia.8');
    expect(login.loginForm.controls.password.value).toBe('ClaveSegura8');
    expect(login.mensajeError).toContain('incorrectos');
    expect(TestBed.inject(Router).url).toContain('/login');
  });
  it('muestra el motivo de cuenta deshabilitada sin borrar las credenciales ni navegar', async () => {
    const login = await abrir('/publicaciones');
    http
      .expectOne(`${API_URL}/auth/login`)
      .flush(
        { message: 'Tu cuenta está deshabilitada. Contactá a un administrador.' },
        { status: 401, statusText: 'Unauthorized' },
      );
    expect(login.mensajeError).toContain('deshabilitada');
    expect(login.loginForm.controls.identificador.value).toBe('lucia.8');
    expect(TestBed.inject(Router).url).toContain('/login');
  });
});
