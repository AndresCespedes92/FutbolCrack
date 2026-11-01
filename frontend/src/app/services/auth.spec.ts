import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth';
import { API_URL } from './api.config';
import { sesionPrueba } from '../testing/sesion-fixture';
import { jugadorPrueba } from '../testing/publicaciones-fixture';

describe('AuthService 4C: reloj real del servidor, caché y limpieza', () => {
  let auth: AuthService, http: HttpTestingController;
  const router = {
    url: '/publicaciones/000000000000000000000001',
    navigate: vi.fn().mockResolvedValue(true),
  };
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router.navigate.mockClear();
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  function entrar(minutos = 15) {
    auth.autorizar().subscribe();
    const solicitud = http.expectOne(`${API_URL}/auth/autorizar`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush(sesionPrueba(jugadorPrueba, minutos));
  }
  it('recupera usuario/expiración sin almacenar JWT y reutiliza el perfil sin otro GET', () => {
    const guardar = vi.spyOn(Storage.prototype, 'setItem');
    entrar();
    expect(auth.usuarioActual()?.id).toBe(jugadorPrueba.id);
    expect(auth.expiraEn()).toBe(Date.now() + 900000);
    let usuario: unknown;
    auth.obtenerMiPerfil().subscribe((datos) => (usuario = datos));
    expect(usuario).toEqual(jugadorPrueba);
    http.expectNone(`${API_URL}/auth/me`);
    expect(guardar).not.toHaveBeenCalled();
    guardar.mockRestore();
  });
  it('comparte una autorización pendiente entre raíz/guard y consumidores simultáneos', () => {
    const uno = vi.fn(),
      dos = vi.fn(),
      guard = vi.fn();
    auth.autorizar().subscribe(uno);
    auth.autorizar().subscribe(dos);
    auth.comprobarAcceso().subscribe(guard);
    const solicitud = http.expectOne(`${API_URL}/auth/autorizar`);
    solicitud.flush(sesionPrueba());
    expect(uno).toHaveBeenCalledTimes(1);
    expect(dos).toHaveBeenCalledTimes(1);
    expect(guard).toHaveBeenCalledWith(true);
    http.expectNone(`${API_URL}/auth/autorizar`);
  });
  it('muestra aviso al minuto diez con aproximadamente cinco restantes', () => {
    entrar();
    vi.advanceTimersByTime(599999);
    expect(auth.mostrarAviso()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(auth.mostrarAviso()).toBe(true);
    expect(auth.minutosRestantes()).toBe(5);
    http.expectNone(`${API_URL}/auth/refrescar`);
  });
  it('recargar con siete minutos restantes avisa dos minutos después, no diez desde Angular', () => {
    entrar(7);
    vi.advanceTimersByTime(119999);
    expect(auth.mostrarAviso()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(auth.mostrarAviso()).toBe(true);
    vi.advanceTimersByTime(300000);
    expect(auth.usuarioActual()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
  it('Ahora no no renueva ni reabre el aviso; al vencer limpia y redirige con mensaje', () => {
    entrar();
    vi.advanceTimersByTime(600000);
    auth.ahoraNo();
    expect(auth.mostrarAviso()).toBe(false);
    window.dispatchEvent(new Event('focus'));
    expect(auth.mostrarAviso()).toBe(false);
    http.expectNone(`${API_URL}/auth/refrescar`);
    vi.advanceTimersByTime(300000);
    expect(auth.usuarioActual()).toBeNull();
    expect(auth.expiraEn()).toBeNull();
    expect(auth.mensajeSesion()).toContain('Tu sesión venció');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: router.url },
    });
  });
  it('extiende una sola vez, reinicia aviso/expiración y elimina los timers anteriores', () => {
    entrar();
    vi.advanceTimersByTime(600000);
    auth.refrescar().subscribe();
    auth.refrescar().subscribe();
    expect(auth.renovando()).toBe(true);
    const solicitud = http.expectOne(`${API_URL}/auth/refrescar`);
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush(sesionPrueba());
    expect(auth.renovando()).toBe(false);
    expect(auth.mostrarAviso()).toBe(false);
    expect(auth.expiraEn()).toBe(Date.now() + 900000);
    vi.advanceTimersByTime(300000);
    expect(auth.usuarioActual()).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300000);
    expect(auth.mostrarAviso()).toBe(true);
  });
  it('no envía renovación después de vencer', () => {
    entrar();
    vi.advanceTimersByTime(900000);
    const error = vi.fn();
    auth.refrescar().subscribe({ error });
    expect(error).toHaveBeenCalledWith(expect.any(HttpErrorResponse));
    http.expectNone(`${API_URL}/auth/refrescar`);
  });
  it('un fallo transitorio de renovación mantiene sesión y aviso para reintentar', () => {
    entrar();
    vi.advanceTimersByTime(600000);
    auth.refrescar().subscribe({ error: () => {} });
    http.expectOne(`${API_URL}/auth/refrescar`).flush({}, { status: 500, statusText: 'Error' });
    expect(auth.usuarioActual()).not.toBeNull();
    expect(auth.mostrarAviso()).toBe(true);
    expect(auth.errorRenovacion()).toContain('No se pudo extender');
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('renovación 401 invalida y no reintenta automáticamente', () => {
    entrar();
    auth.refrescar().subscribe({ error: () => {} });
    http
      .expectOne(`${API_URL}/auth/refrescar`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuarioActual()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
    http.expectNone(`${API_URL}/auth/refrescar`);
  });
  it('al volver de suspensión detecta vencimiento aunque el timer no haya corrido', () => {
    entrar();
    vi.setSystemTime(new Date('2026-11-01T12:16:00Z'));
    window.dispatchEvent(new Event('focus'));
    expect(auth.usuarioActual()).toBeNull();
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
  it('corrige el desfase de reloj del cliente con horaServidor', () => {
    auth.autorizar().subscribe();
    const ahora = Date.now();
    http
      .expectOne(`${API_URL}/auth/autorizar`)
      .flush({
        usuario: jugadorPrueba,
        emitidaEn: new Date(ahora + 3600000).toISOString(),
        horaServidor: new Date(ahora + 3600000).toISOString(),
        expiraEn: new Date(ahora + 4500000).toISOString(),
      });
    vi.advanceTimersByTime(600000);
    expect(auth.mostrarAviso()).toBe(true);
    expect(auth.minutosRestantes()).toBe(5);
  });
  it('logout solo limpia al confirmarse y elimina timers', () => {
    entrar();
    auth.cerrarSesion().subscribe();
    expect(auth.usuarioActual()).not.toBeNull();
    http.expectOne(`${API_URL}/auth/logout`).flush({ mensaje: 'Sesión cerrada correctamente' });
    expect(auth.usuarioActual()).toBeNull();
    vi.advanceTimersByTime(900000);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.mostrarAviso()).toBe(false);
  });
  it('no borra sesión al fallar logout por red/servidor', () => {
    entrar();
    auth.cerrarSesion().subscribe({ error: () => {} });
    http.expectOne(`${API_URL}/auth/logout`).flush({}, { status: 500, statusText: 'Error' });
    expect(auth.usuarioActual()).not.toBeNull();
  });
  it('limpia timers/listeners al destruir el servicio', () => {
    entrar();
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(900000);
    window.dispatchEvent(new Event('focus'));
    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.mostrarAviso()).toBe(false);
  });
  it('401 inicial devuelve nulo y el guard no crea una segunda solicitud ni bucle', () => {
    const respuesta = vi.fn();
    auth.autorizar().subscribe(respuesta);
    http
      .expectOne(`${API_URL}/auth/autorizar`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(respuesta).toHaveBeenCalledWith(null);
    auth.comprobarAcceso().subscribe((valida) => expect(valida).toBe(false));
    http.expectNone(`${API_URL}/auth/autorizar`);
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('una autorización vieja no recupera la sesión después de cerrar sesión', () => {
    auth.autorizar().subscribe();
    const anterior = http.expectOne(`${API_URL}/auth/autorizar`);
    auth.cerrarSesion().subscribe();
    http.expectOne(`${API_URL}/auth/logout`).flush({ mensaje: 'Cerrada' });
    anterior.flush(sesionPrueba());
    expect(auth.usuarioActual()).toBeNull();
  });
});
