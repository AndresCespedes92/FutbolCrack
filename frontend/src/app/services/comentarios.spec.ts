import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ComentariosService } from './comentarios';
import { API_PRUEBA } from '../testing/publicaciones-fixture';
import { comentarioPrueba, paginaComentarios } from '../testing/comentarios-fixture';
describe('ComentariosService: contrato de 4A y cookies', () => {
  let http: HttpTestingController;
  let servicio: ComentariosService;
  const id = '000000000000000000000001';
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(ComentariosService);
  });
  afterEach(() => http.verify());
  it('solicita solo los tres siguientes y conserva total/offset/hayMas', () => {
    let respuesta: unknown;
    servicio.listar(id, 3).subscribe((datos) => (respuesta = datos));
    const solicitud = http.expectOne(
      (req) => req.url === `${API_PRUEBA}/publicaciones/${id}/comentarios`,
    );
    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.params.get('offset')).toBe('3');
    expect(solicitud.request.params.get('limit')).toBe('3');
    expect(solicitud.request.withCredentials).toBe(true);
    const pagina = paginaComentarios([comentarioPrueba(4)], 8, 3);
    solicitud.flush(pagina);
    expect(respuesta).toEqual(pagina);
  });
  it('crea con solo texto y mantiene el mensaje/comentario retornado', () => {
    let respuesta: unknown;
    servicio.crear(id, 'Buen pase').subscribe((datos) => (respuesta = datos));
    const solicitud = http.expectOne(`${API_PRUEBA}/publicaciones/${id}/comentarios`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({ texto: 'Buen pase' });
    expect(solicitud.request.withCredentials).toBe(true);
    const datos = { mensaje: 'Comentario creado correctamente', comentario: comentarioPrueba() };
    solicitud.flush(datos);
    expect(respuesta).toEqual(datos);
  });
  it('edita por id mediante PUT sin enviar autor ni marca de edición del cliente', () => {
    let respuesta: unknown;
    servicio.editar(id, 'Corrección').subscribe((datos) => (respuesta = datos));
    const solicitud = http.expectOne(`${API_PRUEBA}/comentarios/${id}`);
    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual({ texto: 'Corrección' });
    expect(solicitud.request.withCredentials).toBe(true);
    const datos = {
      mensaje: 'Comentario editado correctamente',
      comentario: { ...comentarioPrueba(), modificado: true },
    };
    solicitud.flush(datos);
    expect(respuesta).toEqual(datos);
  });
});
