import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PublicacionDetalle } from './publicacion-detalle';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { Publicacion, PublicacionesService } from '../../services/publicaciones';
import { API_URL } from '../../services/api.config';

// Pruebas autocontenidas: componentes/HTTP reales, sin depender de fixtures ausentes del repo.
const id = '000000000000000000000011';
function jugada(tipoContenido?: 'instagram' | 'tiktok'): Publicacion {
  return {
    _id: id,
    autorId: {
      _id: '000000000000000000000001',
      nombre: 'Ana',
      apellido: 'Paz',
      nombreUsuario: 'ana10',
      imagenPerfil: '',
    },
    titulo: 'Pase del club',
    descripcion: 'Entrenamiento de pases',
    contenido: 'Entrenamiento de pases',
    tipoContenido,
    ...(tipoContenido
      ? {
          urlExterna:
            tipoContenido === 'instagram'
              ? 'https://instagram.com/reel/Club10/'
              : 'https://www.tiktok.com/@club/video/123',
        }
      : {}),
    tipoMultimedia: 'ninguno',
    multimediaUrl: '',
    cantidadLikes: 2,
    cantidadComentarios: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
describe('Tarjeta compartida: enlaces externos seguros y contenido histórico', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PublicacionCard] }).compileComponents();
  });
  it.each(['instagram', 'tiktok'] as const)(
    'representa %s sin reproductor y conserva acciones Input/Output',
    (tipo) => {
      const fixture = TestBed.createComponent(PublicacionCard);
      const publicacion = jugada(tipo);
      fixture.componentRef.setInput('publicacion', publicacion);
      fixture.componentRef.setInput('autenticado', true);
      fixture.componentRef.setInput('detalleDisponible', true);
      let votada: Publicacion | undefined, detalle: Publicacion | undefined;
      fixture.componentInstance.cambiarLike.subscribe((p) => (votada = p));
      fixture.componentInstance.abrirDetalle.subscribe((p) => (detalle = p));
      fixture.detectChanges();
      const html = fixture.nativeElement as HTMLElement;
      const enlace = html.querySelector('.origen-externo a')!;
      expect(enlace.getAttribute('href')).toBe(publicacion.urlExterna);
      expect(enlace.getAttribute('rel')).toBe('noopener noreferrer');
      expect(enlace.getAttribute('target')).toBe('_blank');
      for (const texto of [
        'Pase del club',
        'Entrenamiento de pases',
        'Ana Paz',
        '2 Me gusta',
        '1 comentario',
      ])
        expect(html.textContent).toContain(texto);
      expect(html.querySelector('time')).not.toBeNull();
      expect(html.querySelector('iframe, video, script, .post-image')).toBeNull();
      (html.querySelector('.like') as HTMLButtonElement).click();
      (html.querySelector('.agregar-comentario') as HTMLButtonElement).click();
      expect(votada).toBe(publicacion);
      expect(detalle).toBe(publicacion);
      if (tipo === 'tiktok') {
        (html.querySelector('app-contenido-externo-embed button') as HTMLButtonElement).click();
        fixture.detectChanges();
        expect(html.querySelector('iframe')!.getAttribute('src')).toContain(
          '/player/v1/123?autoplay=0',
        );
        expect(html.querySelector('.like')).not.toBeNull();
      }
    },
  );
  it.each(['javascript:alert(1)', 'https://instagram.com.ejemplo.com/p/Club10/'])(
    'no renderiza un enlace de respuesta insegura: %s',
    (urlExterna) => {
      const fixture = TestBed.createComponent(PublicacionCard);
      fixture.componentRef.setInput('publicacion', { ...jugada('instagram'), urlExterna });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.origen-externo a')).toBeNull();
    },
  );
  it('sigue mostrando imágenes y descripción antiguas sin tipoContenido', () => {
    const fixture = TestBed.createComponent(PublicacionCard);
    fixture.componentRef.setInput('publicacion', {
      ...jugada(),
      descripcion: undefined,
      tipoMultimedia: 'imagen',
      multimediaUrl: '/club.png',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.post-image').getAttribute('src')).toBe(
      '/club.png',
    );
    expect(fixture.nativeElement.textContent).toContain('Entrenamiento de pases');
    expect(fixture.nativeElement.querySelector('.origen-externo')).toBeNull();
  });
});

describe('Detalle externo y transporte de edición', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionDetalle],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it.each(['instagram', 'tiktok'] as const)(
    'detalle %s reutiliza tarjeta y solicita comentarios propios con paginación',
    async (tipo) => {
      const fixture = TestBed.createComponent(PublicacionDetalle);
      fixture.detectChanges();
      http.expectOne(`${API_URL}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
      http.expectOne(`${API_URL}/publicaciones/${id}`).flush(jugada(tipo));
      fixture.detectChanges();
      const req = http.expectOne((r) => r.url === `${API_URL}/publicaciones/${id}/comentarios`);
      expect(req.request.params.get('limit')).toBe('3');
      req.flush({ comentarios: [], total: 0, offset: 0, limit: 3, hayMas: false });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.origen-externo a').getAttribute('href')).toBe(
        jugada(tipo).urlExterna,
      );
      expect(fixture.nativeElement.querySelector('app-comentarios-publicacion')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('iframe, video')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('app-contenido-externo-embed .amplio'),
      ).not.toBeNull();
      if (tipo === 'tiktok') {
        fixture.nativeElement.querySelector('app-contenido-externo-embed button').click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('iframe')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('app-comentarios-publicacion')).not.toBeNull();
      }
    },
  );
  it('PATCH envía solamente cambios y cookie; conserva respuesta normalizada', () => {
    const datos = { urlExterna: 'https://instagram.com/p/Club20/', titulo: 'Nueva jugada' };
    let recibida: Publicacion | undefined;
    TestBed.inject(PublicacionesService)
      .editar(id, datos)
      .subscribe((p) => (recibida = p));
    const req = http.expectOne(`${API_URL}/publicaciones/${id}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual(datos);
    const respuesta = { ...jugada('instagram'), ...datos };
    req.flush(respuesta);
    expect(recibida).toEqual(respuesta);
  });
});
