import {
  comentarioPrueba,
  paginaComentarios,
  responderComentariosVacios,
} from '../../testing/comentarios-fixture';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MiPerfil } from './mi-perfil';
import {
  API_PRUEBA,
  jugadorPrueba,
  paginaPrueba,
  publicacionPrueba,
} from '../../testing/publicaciones-fixture';

describe('Mi Perfil: material real del jugador', () => {
  let fixture: ComponentFixture<MiPerfil>;
  let http: HttpTestingController;
  const propias = () => http.expectOne((req) => req.url === `${API_PRUEBA}/publicaciones`);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPerfil],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MiPerfil);
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it('consulta primero al usuario y luego sus últimas tres con filtro real, orden fecha y cookies', () => {
    http.expectNone((req) => req.url.endsWith('/publicaciones'));
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    const solicitud = propias();
    expect(solicitud.request.params.get('usuarioId')).toBe(jugadorPrueba.id);
    expect(solicitud.request.params.get('limit')).toBe('3');
    expect(solicitud.request.params.get('offset')).toBe('0');
    expect(solicitud.request.params.get('orden')).toBe('fecha');
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush(
      paginaPrueba([publicacionPrueba(3), publicacionPrueba(2), publicacionPrueba(1)], 8, 0, 3),
    );
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-art img').getAttribute('src')).toBe(
      jugadorPrueba.imagenPerfil,
    );
    expect(fixture.nativeElement.querySelector('.player-facts').textContent).toContain(
      jugadorPrueba.correo,
    );
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(3);
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.post-body h2') as NodeListOf<HTMLElement>,
        (h) => h.textContent?.trim(),
      ),
    ).toEqual(['Jugada 3', 'Jugada 2', 'Jugada 1']);
    expect(fixture.nativeElement.textContent).not.toContain('DEMO');
    expect(fixture.nativeElement.querySelectorAll('app-comentarios-publicacion').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay comentarios');
  });
  it('muestra vacío sin inventar datos ni consultar comentarios', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush({ ...jugadorPrueba, imagenPerfil: '' });
    propias().flush(paginaPrueba([], 0, 0, 3));
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no publicaste');
    expect(fixture.nativeElement.querySelector('app-publicacion-card')).toBeNull();
    http.expectNone((req) => req.url.includes('comentarios'));
    const avatar = fixture.nativeElement.querySelector('.player-art img');
    expect(avatar.getAttribute('src')).toBe('icons/futbolcrack.svg');
    expect(avatar.getAttribute('alt')).toContain('Avatar predeterminado');
  });
  it('distingue error de publicaciones del perfil y permite reintentar la misma consulta', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    propias().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos cargar tus publicaciones',
    );
    expect(fixture.nativeElement.querySelector('#nombre-jugador').textContent).toContain('Camila');
    fixture.nativeElement.querySelector('.player-posts button').click();
    propias().flush(paginaPrueba([publicacionPrueba()], 1, 0, 3));
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(1);
  });
  it('reutiliza el evento de like y vuelve a consultar solo las últimas tres del jugador', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    propias().flush(paginaPrueba([publicacionPrueba()], 1, 0, 3));
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
    const borrador = fixture.nativeElement.querySelector('.nuevo-comentario textarea');
    borrador.value = 'Comentario todavía sin publicar';
    borrador.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.like').click();
    http
      .expectOne(`${API_PRUEBA}/publicaciones/${publicacionPrueba()._id}/likes`)
      .flush({ mensaje: 'Me gusta registrado correctamente', cantidadLikes: 3, meGusta: true });
    const recarga = propias();
    expect(recarga.request.params.get('usuarioId')).toBe(jugadorPrueba.id);
    expect(recarga.request.params.get('limit')).toBe('3');
    recarga.flush(
      paginaPrueba([{ ...publicacionPrueba(), cantidadLikes: 3, meGusta: true }], 1, 0, 3),
    );
    fixture.detectChanges();
    responderComentariosVacios(http);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.like').getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.nuevo-comentario textarea').value).toBe(
      'Comentario todavía sin publicar',
    );
    expect(fixture.nativeElement.textContent).toContain('Me gusta registrado correctamente');
  });
  it('asocia comentarios a cada una de las tres publicaciones sin consultas ilimitadas ni colecciones mezcladas', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    propias().flush(
      paginaPrueba([publicacionPrueba(3), publicacionPrueba(2), publicacionPrueba(1)], 3, 0, 3),
    );
    fixture.detectChanges();
    for (const numero of [3, 2, 1]) {
      const id = publicacionPrueba(numero)._id;
      const solicitud = http.expectOne(
        (req) => req.url === `${API_PRUEBA}/publicaciones/${id}/comentarios`,
      );
      expect(solicitud.request.params.get('offset')).toBe('0');
      expect(solicitud.request.params.get('limit')).toBe('3');
      solicitud.flush(paginaComentarios([comentarioPrueba(numero, id)]));
    }
    fixture.detectChanges();
    const grupos = fixture.nativeElement.querySelectorAll('.publicacion-del-perfil');
    expect(grupos.length).toBe(3);
    for (let indice = 0; indice < 3; indice++) {
      expect(grupos[indice].querySelector('.post-body h2').textContent.trim()).toBe(
        `Jugada ${3 - indice}`,
      );
      expect(grupos[indice].querySelector('.texto-comentario').textContent.trim()).toBe(
        `Comentario ${3 - indice}`,
      );
    }
  });
});
