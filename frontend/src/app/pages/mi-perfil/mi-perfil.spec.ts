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
    expect(fixture.nativeElement.textContent).toContain(
      'Los comentarios de estas publicaciones estarán disponibles próximamente',
    );
  });
  it('muestra vacío sin inventar datos ni consultar comentarios', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    propias().flush(paginaPrueba([], 0, 0, 3));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no publicaste');
    expect(fixture.nativeElement.querySelector('app-publicacion-card')).toBeNull();
    http.expectNone((req) => req.url.includes('comentarios'));
  });
  it('distingue error de publicaciones del perfil y permite reintentar la misma consulta', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    propias().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos cargar tus publicaciones',
    );
    expect(fixture.nativeElement.querySelector('#nombre-jugador').textContent).toContain('Camila');
    fixture.nativeElement.querySelector('.player-posts button').click();
    propias().flush(paginaPrueba([publicacionPrueba()], 1, 0, 3));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-publicacion-card').length).toBe(1);
  });
  it('reutiliza el evento de like y vuelve a consultar solo las últimas tres del jugador', () => {
    http.expectOne(`${API_PRUEBA}/auth/me`).flush(jugadorPrueba);
    propias().flush(paginaPrueba([publicacionPrueba()], 1, 0, 3));
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
    expect(fixture.nativeElement.querySelector('.like').getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Me gusta registrado correctamente');
  });
});
