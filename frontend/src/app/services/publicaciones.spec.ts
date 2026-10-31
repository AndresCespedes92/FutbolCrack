import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ListadoPublicaciones, PublicacionesService } from './publicaciones';

// Se verifica transporte/contrato real, sin agregar la interfaz de likes o paginador de 3C.
describe('PublicacionesService: paginación y likes', () => {
  let http: HttpTestingController;
  let servicio: PublicacionesService;
  const url = 'https://futbol-crackbackend.vercel.app/publicaciones';
  const id = '000000000000000000000001';
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(PublicacionesService);
  });
  afterEach(() => http.verify());

  it('envía filtros/orden/offset/limit y conserva la respuesta paginada', () => {
    let resultado: ListadoPublicaciones | undefined;
    servicio
      .listar({ orden: 'likes', usuarioId: id, offset: 10, limit: 10 })
      .subscribe((datos) => (resultado = datos));
    const solicitud = http.expectOne((req) => req.url === url);
    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('orden')).toBe('likes');
    expect(solicitud.request.params.get('usuarioId')).toBe(id);
    expect(solicitud.request.params.get('offset')).toBe('10');
    expect(solicitud.request.params.get('limit')).toBe('10');
    expect(solicitud.request.withCredentials).toBe(true);
    const pagina = { publicaciones: [], total: 23, offset: 10, limit: 10, hayMas: true };
    solicitud.flush(pagina);
    expect(resultado).toEqual(pagina);
  });
  it('da like sin enviar una identidad elegida por el cliente', () => {
    let estado: unknown;
    servicio.darMeGusta(id).subscribe((datos) => (estado = datos));
    const solicitud = http.expectOne(`${url}/${id}/likes`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({});
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush({ mensaje: 'Registrado', cantidadLikes: 1, meGusta: true });
    expect(estado).toEqual({ mensaje: 'Registrado', cantidadLikes: 1, meGusta: true });
  });
  it('quita like propio mediante DELETE con cookies', () => {
    let estado: unknown;
    servicio.quitarMeGusta(id).subscribe((datos) => (estado = datos));
    const solicitud = http.expectOne(`${url}/${id}/likes`);
    expect(solicitud.request.method).toBe('DELETE');
    expect(solicitud.request.body).toBeNull();
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush({ mensaje: 'Quitado', cantidadLikes: 0, meGusta: false });
    expect(estado).toEqual({ mensaje: 'Quitado', cantidadLikes: 0, meGusta: false });
  });
});
