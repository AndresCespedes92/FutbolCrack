import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ComentariosPublicacion } from './comentarios-publicacion';
import { API_PRUEBA, jugadorPrueba, publicacionPrueba } from '../../testing/publicaciones-fixture';
import { comentarioPrueba, paginaComentarios } from '../../testing/comentarios-fixture';

describe('ComentariosPublicacion: flujo compartido de detalle y perfil', () => {
  let fixture: ComponentFixture<ComentariosPublicacion>;
  let http: HttpTestingController;
  const id = publicacionPrueba()._id;
  const url = `${API_PRUEBA}/publicaciones/${id}/comentarios`;
  function lectura() {
    return http.expectOne((req) => req.url === url && req.method === 'GET');
  }
  const lista = (desde: number, cantidad: number) =>
    Array.from({ length: cantidad }, (_, indice) => comentarioPrueba(desde + indice, id));
  function escribir(texto: string, formulario = '.nuevo-comentario'): void {
    const entrada = fixture.nativeElement.querySelector(`${formulario} textarea`);
    entrada.value = texto;
    entrada.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }
  function enviar(formulario = '.nuevo-comentario'): void {
    fixture.nativeElement
      .querySelector(formulario)
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  function responder(desde: number, cantidad: number, total = 8, offset = 0): void {
    lectura().flush(paginaComentarios(lista(desde, cantidad), total, offset));
    fixture.detectChanges();
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComentariosPublicacion],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ComentariosPublicacion);
    fixture.componentRef.setInput('publicacionId', id);
    fixture.componentRef.setInput('usuario', jugadorPrueba);
    fixture.detectChanges();
    responder(1, 3);
  });
  afterEach(() => http.verify());
  it('presenta tres comentarios en el orden recibido con autor/foto y formulario validado', () => {
    expect(fixture.nativeElement.querySelectorAll('.comentario').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Camila Gómez');
    expect(fixture.nativeElement.querySelector('.autor-comentario img').getAttribute('src')).toBe(
      jugadorPrueba.imagenPerfil,
    );
    expect(fixture.nativeElement.querySelector('.nuevo-comentario button').disabled).toBe(true);
    expect(fixture.componentInstance.comentarios.map((c) => c.texto)).toEqual([
      'Comentario 1',
      'Comentario 2',
      'Comentario 3',
    ]);
    expect(fixture.componentInstance.siguienteOffset).toBe(3);
  });
  it('anexa páginas 3/3/2 sin reemplazar y bloquea doble carga', () => {
    fixture.nativeElement.querySelector('.cargar-mas').click();
    fixture.detectChanges();
    const segunda = lectura();
    expect(segunda.request.params.get('offset')).toBe('3');
    expect(segunda.request.params.get('limit')).toBe('3');
    fixture.componentInstance.cargarComentarios();
    http.expectNone((req) => req.url === url);
    segunda.flush(paginaComentarios(lista(4, 3), 8, 3));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.comentario').length).toBe(6);
    fixture.nativeElement.querySelector('.cargar-mas').click();
    const tercera = lectura();
    expect(tercera.request.params.get('offset')).toBe('6');
    tercera.flush(paginaComentarios(lista(7, 2), 8, 6));
    fixture.detectChanges();
    expect(fixture.componentInstance.comentarios.map((c) => c.texto)).toEqual(
      Array.from({ length: 8 }, (_, i) => `Comentario ${i + 1}`),
    );
    expect(fixture.nativeElement.querySelectorAll('.comentario').length).toBe(8);
    expect(fixture.nativeElement.querySelector('.cargar-mas')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No hay más comentarios');
  });
  it('deduplica ids pero avanza offset por filas recibidas al cambiar páginas externas', () => {
    fixture.nativeElement.querySelector('.cargar-mas').click();
    lectura().flush(paginaComentarios(lista(3, 3), 8, 3));
    fixture.detectChanges();
    expect(fixture.componentInstance.comentarios).toHaveLength(5);
    expect(new Set(fixture.componentInstance.comentarios.map((c) => c._id)).size).toBe(5);
    expect(fixture.componentInstance.siguienteOffset).toBe(6);
    fixture.nativeElement.querySelector('.cargar-mas').click();
    const siguiente = lectura();
    expect(siguiente.request.params.get('offset')).toBe('6');
    siguiente.flush(paginaComentarios([], 8, 6));
    fixture.detectChanges();
  });
  it('conserva los comentarios anteriores ante error de carga y reintenta el mismo offset', () => {
    fixture.nativeElement.querySelector('.cargar-mas').click();
    lectura().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.comentario').length).toBe(3);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos completar',
    );
    const reintentar = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Reintentar comentarios'))!;
    reintentar.click();
    const solicitud = lectura();
    expect(solicitud.request.params.get('offset')).toBe('3');
    solicitud.flush(paginaComentarios(lista(4, 3), 8, 3));
    fixture.detectChanges();
    expect(fixture.componentInstance.comentarios).toHaveLength(6);
  });
  it('crea una sola vez y reinicia desde offset cero después de tener dos páginas cargadas', () => {
    fixture.nativeElement.querySelector('.cargar-mas').click();
    responder(4, 3, 8, 3);
    escribir('  Excelente pase  ');
    enviar();
    const solicitud = http.expectOne((req) => req.url === url && req.method === 'POST');
    expect(solicitud.request.body).toEqual({ texto: 'Excelente pase' });
    expect(solicitud.request.withCredentials).toBe(true);
    expect(fixture.nativeElement.querySelector('.nuevo-comentario button').disabled).toBe(true);
    enviar();
    http.expectNone((req) => req.method === 'POST');
    solicitud.flush({
      mensaje: 'Comentario creado correctamente',
      comentario: comentarioPrueba(9, id),
    });
    const reinicio = lectura();
    expect(reinicio.request.params.get('offset')).toBe('0');
    expect(reinicio.request.params.get('limit')).toBe('3');
    reinicio.flush(paginaComentarios([comentarioPrueba(9, id), ...lista(1, 2)], 9, 0));
    fixture.detectChanges();
    expect(fixture.componentInstance.comentarios.map((c) => c._id)).toEqual(
      [9, 1, 2].map((n) => comentarioPrueba(n, id)._id),
    );
    expect(fixture.componentInstance.siguienteOffset).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.comentario').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Comentario creado correctamente');
    expect(fixture.nativeElement.querySelector('.nuevo-comentario textarea').value).toBe('');
  });
  it.each(['', '   ', 'a'.repeat(1001), '😀'.repeat(501)])(
    'rechaza texto nuevo inválido sin POST (%j)',
    (texto) => {
      escribir(texto);
      enviar();
      http.expectNone((req) => req.method === 'POST');
      expect(
        fixture.nativeElement.querySelector('.nuevo-comentario [role="alert"]').textContent,
      ).toContain('1 a 1000');
    },
  );
  it.each([400, 401, 500])('mantiene el borrador y muestra error al fallar POST %s', (status) => {
    escribir('Buen pase');
    enviar();
    http
      .expectOne((req) => req.url === url && req.method === 'POST')
      .flush({}, { status, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.nuevo-comentario textarea').value).toBe(
      'Buen pase',
    );
    expect(fixture.nativeElement.querySelector('.nuevo-comentario [role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.exito')).toBeNull();
    expect(fixture.componentInstance.comentarios).toHaveLength(3);
    if (status === 401) expect(fixture.nativeElement.textContent).toContain('Tu sesión venció');
  });
  it('solo el autor ve Editar; un administrador ajeno no obtiene ese permiso', () => {
    expect(fixture.nativeElement.querySelectorAll('.editar').length).toBe(3);
    fixture.componentRef.setInput('usuario', {
      ...jugadorPrueba,
      id: 'otro',
      perfil: 'administrador',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.editar')).toBeNull();
    fixture.componentInstance.iniciarEdicion(comentarioPrueba(1, id));
    expect(fixture.componentInstance.editandoId).toBeNull();
    fixture.componentRef.setInput('usuario', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.nuevo-comentario')).toBeNull();
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/login');
  });
  it('edita un comentario propio una sola vez, conserva otros y muestra Editado tras PUT', () => {
    fixture.nativeElement.querySelector('.editar').click();
    fixture.detectChanges();
    escribir('  Pase con zurda  ', '.editar-comentario');
    enviar('.editar-comentario');
    const solicitud = http.expectOne(`${API_PRUEBA}/comentarios/${comentarioPrueba(1, id)._id}`);
    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual({ texto: 'Pase con zurda' });
    expect(solicitud.request.withCredentials).toBe(true);
    enviar('.editar-comentario');
    http.expectNone((req) => req.method === 'PUT');
    solicitud.flush({
      mensaje: 'Comentario editado correctamente',
      comentario: {
        ...comentarioPrueba(1, id),
        texto: 'Pase con zurda',
        modificado: true,
        updatedAt: '2026-11-01T13:00:00Z',
      },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.editar-comentario')).toBeNull();
    expect(fixture.nativeElement.querySelector('.editado').textContent).toContain('Editado');
    expect(fixture.componentInstance.comentarios.map((c) => c.texto)).toEqual([
      'Pase con zurda',
      'Comentario 2',
      'Comentario 3',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Comentario editado correctamente');
  });
  it('cancelar edición no solicita PUT ni altera el texto', () => {
    fixture.nativeElement.querySelector('.editar').click();
    fixture.detectChanges();
    escribir('No guardar', '.editar-comentario');
    fixture.nativeElement.querySelector('.editar-comentario button[type="button"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.editar-comentario')).toBeNull();
    expect(fixture.componentInstance.comentarios[0].texto).toBe('Comentario 1');
    http.expectNone((req) => req.method === 'PUT');
  });
  it('valida también el texto de edición antes de enviar PUT', () => {
    fixture.nativeElement.querySelector('.editar').click();
    fixture.detectChanges();
    escribir('   ', '.editar-comentario');
    enviar('.editar-comentario');
    expect(
      fixture.nativeElement.querySelector('.editar-comentario [role="alert"]').textContent,
    ).toContain('texto válido');
    http.expectNone((req) => req.method === 'PUT');
  });
  it.each([401, 403, 404, 500])(
    'conserva la edición para corregir o cancelar ante PUT %s',
    (status) => {
      fixture.nativeElement.querySelector('.editar').click();
      fixture.detectChanges();
      escribir('Corrección pendiente', '.editar-comentario');
      enviar('.editar-comentario');
      http
        .expectOne(`${API_PRUEBA}/comentarios/${comentarioPrueba(1, id)._id}`)
        .flush({}, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.editar-comentario textarea').value).toBe(
        'Corrección pendiente',
      );
      expect(fixture.nativeElement.querySelector('.editar-comentario [role="alert"]')).toBeTruthy();
      expect(fixture.componentInstance.comentarios[0].modificado).toBe(false);
    },
  );
  it('ante 404 del listado limpia contenido y avisa al padre para ocultar la publicación', () => {
    const aviso = vi.fn();
    fixture.componentInstance.publicacionNoDisponible.subscribe(aviso);
    fixture.nativeElement.querySelector('.cargar-mas').click();
    lectura().flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.comentario')).toBeNull();
    expect(fixture.nativeElement.querySelector('.nuevo-comentario')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Esta publicación ya no está disponible');
  });
  it('cambiar el Input de publicación reinicia colección/offset sin mezclar comentarios', () => {
    const otro = publicacionPrueba(2)._id;
    fixture.componentRef.setInput('publicacionId', otro);
    fixture.detectChanges();
    const solicitud = http.expectOne(
      (req) => req.url === `${API_PRUEBA}/publicaciones/${otro}/comentarios`,
    );
    expect(solicitud.request.params.get('offset')).toBe('0');
    solicitud.flush(paginaComentarios([comentarioPrueba(20, otro)]));
    fixture.detectChanges();
    expect(fixture.componentInstance.comentarios).toHaveLength(1);
    expect(fixture.componentInstance.comentarios[0].publicacionId).toBe(otro);
  });
  it('tolera autor ausente y reutiliza TruncatePipe con Ver más/Ver menos sin alterar el texto', () => {
    const otro = publicacionPrueba(2)._id;
    const texto = 'Jugada '.repeat(60);
    fixture.componentRef.setInput('publicacionId', otro);
    fixture.detectChanges();
    http
      .expectOne((req) => req.url === `${API_PRUEBA}/publicaciones/${otro}/comentarios`)
      .flush(
        paginaComentarios([
          { ...comentarioPrueba(20, otro), autorId: null, texto, modificado: true },
        ]),
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Usuario no disponible');
    expect(fixture.nativeElement.querySelector('.editado').textContent).toContain('Editado');
    expect(fixture.nativeElement.querySelector('.texto-comentario').textContent.trim()).toBe(
      texto.slice(0, 280) + '…',
    );
    fixture.nativeElement.querySelector('.texto-expandir').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.texto-comentario').textContent.trim()).toBe(
      texto.trim(),
    );
    expect(fixture.nativeElement.querySelector('.texto-expandir').textContent).toContain(
      'Ver menos',
    );
    fixture.nativeElement.querySelector('.texto-expandir').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.texto-comentario').textContent.trim()).toBe(
      texto.slice(0, 280) + '…',
    );
  });
  it('resalta comentarios propios y actualiza resaltado al cambiar usuario o cerrar sesión', () => {
    expect(fixture.nativeElement.querySelectorAll('.comentario-propio').length).toBe(3);
    fixture.componentRef.setInput('usuario', { ...jugadorPrueba, id: 'otro-usuario' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.comentario-propio').length).toBe(0);
    fixture.componentRef.setInput('usuario', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.comentario-propio').length).toBe(0);
  });
  it('al pulsar Editar enfoca textarea con la directiva y cancelar no envía PUT', async () => {
    fixture.nativeElement.querySelector('.editar').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.editar-comentario textarea'),
    );
    fixture.componentInstance.cancelarEdicion();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.editar-comentario')).toBeNull();
    http.expectNone((req) => req.method === 'PUT');
  });
});
