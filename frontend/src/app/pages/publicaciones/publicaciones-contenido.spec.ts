import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_URL } from '../../services/api.config';
import { Publicaciones } from './publicaciones';
import { TipoContenido } from '../../validators/url-contenido.validator';

// Formulario, plantilla y servicio HTTP reales; HttpTestingController impide escribir en la API.
describe('Selector de contenido: etapa 1 solo Angular', () => {
  let fixture: ComponentFixture<Publicaciones>, http: HttpTestingController;
  const url = `${API_URL}/publicaciones`;
  const paginaVacia = { publicaciones: [], total: 0, offset: 0, limit: 10, hayMas: false };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publicaciones],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Publicaciones);
    fixture.detectChanges();
    http.expectOne(`${API_URL}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne((r) => r.url === url && r.method === 'GET').flush(paginaVacia);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  const componente = () => fixture.componentInstance;
  function cambiarTipo(tipo: TipoContenido) {
    const select = fixture.nativeElement.querySelector('#tipo-contenido') as HTMLSelectElement;
    select.value = tipo;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }
  function escribirUrl(valor: string) {
    const input = fixture.nativeElement.querySelector('#url-publicacion') as HTMLInputElement;
    input.value = valor;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }
  function completarTextos() {
    componente().publicacionForm.patchValue({
      titulo: '  Jugada de QA  ',
      descripcion: '  Entrenamiento de pases  ',
    });
  }
  function enviarFormulario() {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('empieza colapsado con propia por defecto y muestra las tres opciones al abrir', () => {
    expect(componente().formularioExpandido).toBe(false);
    fixture.nativeElement.querySelector('.composer-trigger').click();
    fixture.detectChanges();
    expect(componente().formularioExpandido).toBe(true);
    const select = fixture.nativeElement.querySelector('#tipo-contenido') as HTMLSelectElement;
    expect(select.value).toBe('propia');
    expect(Array.from(select.options, (o) => o.value)).toEqual(['propia', 'instagram', 'tiktok']);
    expect(fixture.nativeElement.querySelector('#imagen-publicacion')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#url-publicacion')).toBeNull();
    expect(componente().urlExterna.disabled).toBe(true);
  });

  it.each(['instagram', 'tiktok'] as const)(
    'muestra URL para %s y bloquea botón, submit y llamada directa aunque los datos sean válidos',
    (tipo) => {
      cambiarTipo(tipo);
      completarTextos();
      escribirUrl(
        tipo === 'instagram'
          ? 'https://instagram.com/reel/Jugada10/'
          : 'https://www.tiktok.com/@jugador/video/123',
      );
      expect(componente().urlExterna.valid).toBe(true);
      expect(fixture.nativeElement.querySelector('#imagen-publicacion')).toBeNull();
      expect(fixture.nativeElement.querySelector('#titulo-publicacion')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('#descripcion-publicacion')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.composer-preparation').textContent).toContain(
        'está en preparación',
      );
      enviarFormulario();
      componente().publicar();
      http.expectNone((r) => r.method === 'POST');
      expect(componente().publicando).toBe(false);
      expect(componente().mensajePublicacion).toContain('solo podés guardar publicaciones propias');
      expect(fixture.nativeElement.querySelector('iframe, script, video')).toBeNull();
    },
  );

  it('colorea y explica URL inválida; al corregirla queda verde', () => {
    cambiarTipo('instagram');
    escribirUrl('https://sitio-ajeno.test/p/Jugada10/');
    expect(
      fixture.nativeElement
        .querySelector('#url-publicacion')
        .classList.contains('composer-invalid'),
    ).toBe(true);
    expect(fixture.nativeElement.querySelector('#error-url-publicacion').textContent).toContain(
      'Instagram',
    );
    escribirUrl('https://instagram.com/p/Jugada10/');
    expect(
      fixture.nativeElement.querySelector('#url-publicacion').classList.contains('composer-valid'),
    ).toBe(true);
    expect(fixture.nativeElement.querySelector('#error-url-publicacion')).toBeNull();
  });

  it('limpia foto y errores ajenos al cambiar de tipo, conservando título y descripción', () => {
    completarTextos();
    componente().campos.imagen.setValue(new File(['texto'], 'archivo.txt', { type: 'text/plain' }));
    componente().campos.imagen.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#error-imagen-publicacion')).not.toBeNull();
    cambiarTipo('instagram');
    escribirUrl('invalida');
    enviarFormulario();
    expect(componente().campos.imagen.disabled).toBe(true);
    expect(componente().campos.imagen.value).toBeNull();
    expect(fixture.nativeElement.querySelector('#error-imagen-publicacion')).toBeNull();
    cambiarTipo('tiktok');
    expect(componente().urlExterna.value).toBe('');
    expect(componente().urlExterna.touched).toBe(false);
    expect(componente().urlExterna.dirty).toBe(false);
    expect(componente().mensajePublicacion).toBe('');
    expect(fixture.nativeElement.querySelector('#error-url-publicacion')).toBeNull();
    cambiarTipo('propia');
    expect(componente().campos.imagen.enabled).toBe(true);
    expect(componente().campos.imagen.valid).toBe(true);
    expect(componente().urlExterna.disabled).toBe(true);
    expect(componente().campos.titulo.value).toBe('  Jugada de QA  ');
    expect(componente().campos.descripcion.value).toBe('  Entrenamiento de pases  ');
    expect(fixture.nativeElement.querySelector('#url-publicacion')).toBeNull();
  });

  it('URL es obligatoria en externos y admite como máximo 2048 caracteres', () => {
    cambiarTipo('tiktok');
    escribirUrl('');
    expect(componente().urlExterna.hasError('required')).toBe(true);
    expect(componente().errorUrlExterna).toContain('Pegá la URL');
    componente().urlExterna.setValue(
      'https://www.tiktok.com/@jugador/video/123?x=' + 'a'.repeat(2048),
    );
    expect(componente().urlExterna.hasError('maxlength')).toBe(true);
    expect(componente().errorUrlExterna).toContain('2048');
    componente().publicar();
    http.expectNone((r) => r.method === 'POST');
  });

  it.each([false, true])(
    'propia conserva el contrato y las cookies, con imagen=%s y sin campos nuevos',
    (conImagen) => {
      cambiarTipo('instagram');
      escribirUrl('https://instagram.com/reel/Jugada10/');
      cambiarTipo('propia');
      completarTextos();
      if (conImagen)
        componente().campos.imagen.setValue(new File(['QA'], 'foto.png', { type: 'image/png' }));
      enviarFormulario();
      const req = http.expectOne((r) => r.url === url && r.method === 'POST');
      const datos = req.request.body as FormData;
      expect([...datos.keys()].sort()).toEqual(
        conImagen ? ['descripcion', 'imagen', 'titulo'] : ['descripcion', 'titulo'],
      );
      expect(datos.get('titulo')).toBe('Jugada de QA');
      expect(datos.get('descripcion')).toBe('Entrenamiento de pases');
      expect(datos.get('tipoContenido')).toBeNull();
      expect(datos.get('urlExterna')).toBeNull();
      expect(req.request.withCredentials).toBe(true);
      expect(componente().tipoContenido.disabled).toBe(true);
      expect(req.request.headers.has('Content-Type')).toBe(false);
      req.flush({ _id: 'publicacion-qa' });
      http.expectOne((r) => r.url === url && r.method === 'GET').flush(paginaVacia);
      fixture.detectChanges();
      expect(componente().tipoContenido.enabled).toBe(true);
      expect(componente().tipoContenido.value).toBe('propia');
      expect(componente().publicacionForm.value).toEqual({
        titulo: '',
        descripcion: '',
        imagen: null,
      });
      expect(componente().mensajeExito).toContain('creada correctamente');
    },
  );

  it('un error al crear propia conserva el borrador y permite volver a elegir tipo', () => {
    completarTextos();
    enviarFormulario();
    http
      .expectOne((r) => r.url === url && r.method === 'POST')
      .flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(componente().tipoContenido.enabled).toBe(true);
    expect(componente().campos.titulo.value).toBe('  Jugada de QA  ');
    cambiarTipo('tiktok');
    expect(componente().mensajePublicacion).toBe('');
  });
});
