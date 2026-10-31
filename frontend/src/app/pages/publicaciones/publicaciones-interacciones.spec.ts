import { instalarDialogDePrueba } from '../../testing/dialog-prueba';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Publicaciones } from './publicaciones';
import {
  API_PRUEBA,
  jugadorPrueba,
  paginaPrueba,
  publicacionPrueba,
} from '../../testing/publicaciones-fixture';

describe('Feed 3C: interacción de usuario y backend simulado', () => {
  let fixture: ComponentFixture<Publicaciones>;
  let http: HttpTestingController;
  const url = `${API_PRUEBA}/publicaciones`;
  const abrir = () => fixture.nativeElement.querySelector('.baja').click();
  function listado() {
    return http.expectOne((req) => req.url === url && req.method === 'GET');
  }
  function boton(texto: string): HTMLButtonElement {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === texto)!;
  }
  function responder(total = 23, offset = 0, cantidad = 10) {
    const solicitud = listado();
    expect(solicitud.request.params.get('limit')).toBe('10');
    solicitud.flush(
      paginaPrueba(
        Array.from({ length: cantidad }, (_, i) => publicacionPrueba(offset + i + 1)),
        total,
        offset,
      ),
    );
    fixture.detectChanges();
    return solicitud;
  }
  let restaurarDialog: () => void;
  beforeEach(async () => {
    // JSDOM no implementa la capa modal nativa; aquí solo sustituimos esa API del navegador.
    restaurarDialog = instalarDialogDePrueba();
    await TestBed.configureTestingModule({
      imports: [Publicaciones],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Publicaciones);
    fixture.detectChanges();
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    responder();
  });
  afterEach(() => {
    http?.verify();
    restaurarDialog();
    vi.restoreAllMocks();
  });
  it('renderiza diez tarjetas y páginas numeradas 1/2/3; pide offset 10 y 20 al navegar', () => {
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(10);
    expect(boton('1').getAttribute('aria-current')).toBe('page');
    expect(boton('3')).toBeTruthy();
    boton('2').click();
    fixture.detectChanges();
    const segunda = responder(23, 10);
    expect(segunda.request.params.get('offset')).toBe('10');
    expect(boton('2').getAttribute('aria-current')).toBe('page');
    boton('Siguiente').click();
    const tercera = responder(23, 20, 3);
    expect(tercera.request.params.get('offset')).toBe('20');
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(3);
    expect(boton('Siguiente').disabled).toBe(true);
    boton('Anterior').click();
    expect(responder(23, 10).request.params.get('offset')).toBe('10');
  });
  it('al cambiar a populares vuelve a offset cero y pide orden likes al backend', () => {
    boton('2').click();
    responder(23, 10);
    const selector = fixture.nativeElement.querySelector('select');
    selector.value = 'likes';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const solicitud = responder();
    expect(solicitud.request.params.get('orden')).toBe('likes');
    expect(solicitud.request.params.get('offset')).toBe('0');
    expect(boton('1').getAttribute('aria-current')).toBe('page');
  });
  it('evita doble like, utiliza cookies y actualiza estado/cantidad después de la respuesta real', () => {
    fixture.nativeElement.querySelector('.like').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.like').disabled).toBe(true);
    const solicitud = http.expectOne(`${url}/${publicacionPrueba()._id}/likes`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.withCredentials).toBe(true);
    expect(solicitud.request.body).toEqual({});
    fixture.componentInstance.acciones.alternarLike(
      fixture.componentInstance.publicaciones[0],
      jugadorPrueba,
      fixture.componentInstance.cargarTrasAccion,
    );
    http.expectNone(`${url}/${publicacionPrueba()._id}/likes`);
    solicitud.flush({
      mensaje: 'Me gusta registrado correctamente',
      cantidadLikes: 3,
      meGusta: true,
    });
    listado().flush(paginaPrueba([{ ...publicacionPrueba(), cantidadLikes: 3, meGusta: true }]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cantidad-likes').textContent).toContain(
      '3 Me gusta',
    );
    expect(fixture.nativeElement.querySelector('.like').getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.like').textContent).toContain('Quitar me gusta');
    expect(fixture.nativeElement.textContent).toContain('Me gusta registrado correctamente');
    fixture.nativeElement.querySelector('.like').click();
    const quitar = http.expectOne(`${url}/${publicacionPrueba()._id}/likes`);
    expect(quitar.request.method).toBe('DELETE');
    expect(quitar.request.withCredentials).toBe(true);
    quitar.flush({ mensaje: 'Me gusta quitado correctamente', cantidadLikes: 2, meGusta: false });
    listado().flush(paginaPrueba([publicacionPrueba()]));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.like').getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('.cantidad-likes').textContent).toContain(
      '2 Me gusta',
    );
  });
  it.each([401, 500])(
    'muestra error de like %s y conserva estado/cantidad sin inventar éxito',
    (status) => {
      fixture.nativeElement.querySelector('.like').click();
      http
        .expectOne(`${url}/${publicacionPrueba()._id}/likes`)
        .flush({}, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
        status === 401 ? 'Tu sesión venció' : 'No pudimos actualizar',
      );
      expect(fixture.nativeElement.querySelector('.like').disabled).toBe(false);
      expect(fixture.nativeElement.querySelector('.cantidad-likes').textContent).toContain(
        '2 Me gusta',
      );
      expect(fixture.nativeElement.querySelector('.action-success')).toBeNull();
    },
  );
  it('sincroniza el listado ante un conflicto de voto, mostrando el error', () => {
    fixture.nativeElement.querySelector('.like').click();
    http
      .expectOne(`${url}/${publicacionPrueba()._id}/likes`)
      .flush({}, { status: 409, statusText: 'Conflict' });
    responder();
    expect(fixture.nativeElement.textContent).toContain('El voto cambió en otra solicitud');
  });
  it('abre modal identificando publicación y Cancelar no ejecuta DELETE', () => {
    abrir();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    expect(fixture.nativeElement.querySelector('dialog').textContent).toContain('Jugada 1');
    http.expectNone((req) => req.method === 'DELETE');
    boton('Cancelar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    http.expectNone((req) => req.method === 'DELETE');
  });
  it('confirma una sola baja, bloquea mientras espera y muestra éxito solo al completarla', () => {
    abrir();
    fixture.detectChanges();
    boton('Confirmar').click();
    fixture.detectChanges();
    const eliminar = http.expectOne(`${url}/${publicacionPrueba()._id}`);
    expect(eliminar.request.method).toBe('DELETE');
    expect(eliminar.request.withCredentials).toBe(true);
    expect(boton('Cancelar').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.action-success')).toBeNull();
    fixture.componentInstance.confirmarBaja();
    http.expectNone((req) => req.method === 'DELETE');
    eliminar.flush({ mensaje: 'Publicación dada de baja correctamente' });
    listado().flush(paginaPrueba([publicacionPrueba(2)], 1));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Publicación dada de baja correctamente');
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.post-body h2').textContent.trim()).toBe(
      'Jugada 2',
    );
  });
  it('ante 403 mantiene el modal y la publicación, explica el error y permite cancelar', () => {
    abrir();
    fixture.detectChanges();
    boton('Confirmar').click();
    http
      .expectOne(`${url}/${publicacionPrueba()._id}`)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog [role="alert"]').textContent).toContain(
      'No tenés permiso',
    );
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(10);
    expect(boton('Cancelar').disabled).toBe(false);
    boton('Cancelar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });
  it('después de retirar el único registro de página 3 vuelve a página 2', () => {
    boton('3').click();
    responder(21, 20, 1);
    abrir();
    fixture.detectChanges();
    boton('Confirmar').click();
    http
      .expectOne(`${url}/${publicacionPrueba(21)._id}`)
      .flush({ mensaje: 'Publicación dada de baja correctamente' });
    listado().flush(paginaPrueba([], 20, 20));
    const anterior = responder(20, 10);
    expect(anterior.request.params.get('offset')).toBe('10');
    expect(fixture.componentInstance.paginaActual).toBe(2);
  });
  it('solo muestra bajas de autor/admin y deshabilita likes para visitante', () => {
    // Reabrimos la pantalla con cada respuesta real de sesión, sin mutar campos fuera del flujo Angular.
    function reabrir(sesion: typeof jugadorPrueba | null): void {
      fixture.destroy();
      fixture = TestBed.createComponent(Publicaciones);
      fixture.detectChanges();
      const perfil = http.expectOne(`${API_PRUEBA}/auth/me`);
      if (sesion) perfil.flush(sesion);
      else perfil.flush({}, { status: 401, statusText: 'Unauthorized' });
      responder();
    }
    reabrir({ ...jugadorPrueba, id: 'otro' });
    expect(fixture.nativeElement.querySelector('.baja')).toBeNull();
    expect(fixture.nativeElement.querySelector('.like').disabled).toBe(false);
    reabrir({ ...jugadorPrueba, id: 'otro', perfil: 'administrador' });
    expect(fixture.nativeElement.querySelector('.baja')).toBeTruthy();
    reabrir(null);
    expect(fixture.nativeElement.querySelector('.like').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.baja')).toBeNull();
    http.expectNone((req) => req.method !== 'GET');
  });
  it('presenta estados de carga, error con reintento y vacío', () => {
    fixture.componentInstance.cargarPublicaciones();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando publicaciones');
    listado().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos cargar',
    );
    boton('Reintentar').click();
    listado().flush(paginaPrueba([]));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay publicaciones');
    expect(fixture.nativeElement.querySelector('.pagination')).toBeNull();
  });
});
