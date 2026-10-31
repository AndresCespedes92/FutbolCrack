import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Publicaciones } from './publicaciones';

describe('Formulario y feed de publicaciones 3A', () => {
  let fixture: ComponentFixture<Publicaciones>;
  let http: HttpTestingController;
  const url = 'https://futbol-crackbackend.vercel.app/publicaciones';
  const pagina = (publicaciones: unknown[]) => ({
    publicaciones,
    total: publicaciones.length,
    offset: 0,
    limit: 10,
    hayMas: false,
  });
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publicaciones],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Publicaciones);
    fixture.detectChanges();
    http.expectOne(url).flush(pagina([]));
    await fixture.whenStable();
  });
  afterEach(() => http.verify());

  function completar() {
    fixture.componentInstance.publicacionForm.patchValue({
      titulo: '  Entrenamiento  ',
      descripcion: '  Trabajo de pases  ',
    });
    fixture.detectChanges();
  }
  function enviar() {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  it('muestra título, descripción e imagen y no presenta acciones de baja', () => {
    expect(fixture.nativeElement.querySelector('#titulo-publicacion')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#descripcion-publicacion')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#imagen-publicacion').accept).toBe(
      'image/jpeg,image/png,image/webp',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar');
    expect(fixture.nativeElement.textContent).not.toContain('Dar de baja');
  });
  it('envía FormData con imagen, evita duplicados y limpia solo tras el éxito', () => {
    completar();
    const archivo = new File(['foto de prueba'], 'foto.png', { type: 'image/png' });
    const selector = fixture.nativeElement.querySelector('#imagen-publicacion');
    Object.defineProperty(selector, 'files', { value: { item: () => archivo } });
    selector.dispatchEvent(new Event('change'));
    enviar();
    const solicitud = http.expectOne(url);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.withCredentials).toBe(true);
    expect(solicitud.request.body).toBeInstanceOf(FormData);
    const datos = solicitud.request.body as FormData;
    expect(datos.get('titulo')).toBe('Entrenamiento');
    expect(datos.get('descripcion')).toBe('Trabajo de pases');
    expect((datos.get('imagen') as File).name).toBe('foto.png');
    expect(datos.get('autorId')).toBeNull();
    expect(datos.get('contenido')).toBeNull();
    expect(fixture.componentInstance.publicando).toBe(true);
    enviar();
    http.expectNone(url);
    solicitud.flush({ _id: 'nuevo' });
    http.expectOne(url).flush(pagina([]));
    fixture.detectChanges();
    expect(fixture.componentInstance.publicacionForm.value).toEqual({
      titulo: '',
      descripcion: '',
      imagen: null,
    });
    expect(selector.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Publicación creada correctamente');
  });
  it('permite crear sin imagen', () => {
    completar();
    enviar();
    const solicitud = http.expectOne(url);
    expect((solicitud.request.body as FormData).get('imagen')).toBeNull();
    solicitud.flush({ _id: 'nuevo' });
    http.expectOne(url).flush(pagina([]));
    expect(fixture.componentInstance.publicando).toBe(false);
  });
  it.each([
    { titulo: '', descripcion: 'Texto' },
    { titulo: 'Título', descripcion: '   ' },
    { titulo: 'a'.repeat(121), descripcion: 'Texto' },
    { titulo: 'Título', descripcion: 'a'.repeat(2001) },
  ])('no envía textos inválidos: %j', (datos) => {
    fixture.componentInstance.publicacionForm.patchValue(datos);
    enviar();
    http.expectNone(url);
    expect(fixture.nativeElement.textContent).toContain('Revisá el título');
  });
  it('rechaza imagen de tipo no admitido o superior a 5 MiB', () => {
    completar();
    for (const archivo of [
      new File(['texto'], 'foto.txt', { type: 'text/plain' }),
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'foto.png', { type: 'image/png' }),
    ]) {
      fixture.componentInstance.campos.imagen.setValue(archivo);
      enviar();
      http.expectNone(url);
      expect(fixture.componentInstance.campos.imagen.invalid).toBe(true);
    }
  });
  it.each([400, 413, 500])(
    'conserva los datos y permite reintentar si el servidor responde %s',
    (estado) => {
      completar();
      enviar();
      http.expectOne(url).flush({}, { status: estado, statusText: 'Error de prueba' });
      fixture.detectChanges();
      expect(fixture.componentInstance.campos.titulo.value).toBe('  Entrenamiento  ');
      expect(fixture.componentInstance.campos.descripcion.value).toBe('  Trabajo de pases  ');
      expect(fixture.componentInstance.publicando).toBe(false);
      expect(fixture.componentInstance.mensajePublicacion.length).toBeGreaterThan(0);
      expect(fixture.componentInstance.mensajeExito).toBe('');
      http.expectNone(url);
    },
  );
  it('lee publicaciones antiguas y nuevas sin cambiar sus datos', () => {
    const antigua = {
      _id: 'antigua',
      autorId: null,
      contenido: 'Parte antiguo',
      multimediaUrl: '',
      tipoMultimedia: 'ninguno' as const,
      createdAt: '2026-10-31',
      updatedAt: '2026-10-31',
    };
    fixture.componentInstance.cargarPublicaciones();
    http.expectOne(url).flush(
      pagina([
        antigua,
        {
          ...antigua,
          _id: 'nueva',
          titulo: 'Título nuevo',
          descripcion: 'Descripción nueva',
          contenido: 'Descripción nueva',
          activo: true,
        },
      ]),
    );
    fixture.detectChanges();
    const posts = fixture.nativeElement.querySelectorAll('.feed-post');
    expect(posts.length).toBe(2);
    expect(fixture.componentInstance.totalPublicaciones).toBe(2);
    expect(fixture.componentInstance.limit).toBe(10);
    expect(fixture.componentInstance.hayMas).toBe(false);
    expect(posts[0].textContent).toContain('Publicación anterior');
    expect(posts[0].textContent).toContain('Parte antiguo');
    expect(posts[1].textContent).toContain('Título nuevo');
    expect(posts[1].textContent).toContain('Descripción nueva');
    expect(antigua).not.toHaveProperty('titulo');
  });
});
