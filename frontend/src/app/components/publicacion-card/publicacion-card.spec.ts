import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { PublicacionCard } from './publicacion-card';
import { publicacionPrueba } from '../../testing/publicaciones-fixture';

describe('PublicacionCard: datos y eventos sin HTTP', () => {
  let fixture: ComponentFixture<PublicacionCard>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PublicacionCard] }).compileComponents();
    fixture = TestBed.createComponent(PublicacionCard);
    fixture.componentRef.setInput('publicacion', publicacionPrueba());
    fixture.detectChanges();
  });
  it('renderiza autor, foto, fecha, título, descripción, imagen y cantidad reales', () => {
    const html = fixture.nativeElement;
    for (const texto of [
      'Camila Gómez',
      '@camila.8',
      '2026-10-31',
      'Jugada 1',
      'Entrenamiento del club',
      '2 Me gusta',
    ])
      expect(html.textContent).toContain(texto);
    expect(html.querySelector('.post-avatar').getAttribute('src')).toBe('/foto-perfil.png');
    expect(html.querySelector('.post-image').getAttribute('src')).toBe('/foto-jugada.png');
    expect(html.querySelector('.like').disabled).toBe(true);
    expect(html.querySelector('.baja')).toBeNull();
  });
  it('emite la misma publicación por cada Output, sin modificar sus datos', () => {
    const like = vi.fn(),
      baja = vi.fn(),
      detalle = vi.fn();
    fixture.componentInstance.cambiarLike.subscribe(like);
    fixture.componentInstance.solicitarBaja.subscribe(baja);
    fixture.componentInstance.abrirDetalle.subscribe(detalle);
    fixture.componentRef.setInput('autenticado', true);
    fixture.componentRef.setInput('puedeDarBaja', true);
    fixture.componentRef.setInput('detalleDisponible', true);
    fixture.detectChanges();
    for (const selector of ['.like', '.baja'])
      fixture.nativeElement.querySelector(selector).click();
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((b) => b.textContent?.includes('Ver detalle'))!
      .click();
    for (const espia of [like, baja, detalle]) {
      expect(espia).toHaveBeenCalledTimes(1);
      expect(espia).toHaveBeenCalledWith(fixture.componentInstance.publicacion);
    }
    expect(fixture.componentInstance.publicacion.meGusta).toBe(false);
  });
  it('bloquea eventos durante una solicitud y oculta acciones de publicaciones inactivas', () => {
    const espia = vi.fn();
    fixture.componentInstance.cambiarLike.subscribe(espia);
    fixture.componentInstance.solicitarBaja.subscribe(espia);
    fixture.componentRef.setInput('autenticado', true);
    fixture.componentRef.setInput('puedeDarBaja', true);
    fixture.componentRef.setInput('procesando', true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.like').click();
    fixture.componentInstance.emitirLike();
    fixture.componentInstance.emitirBaja();
    expect(espia).not.toHaveBeenCalled();
    fixture.componentRef.setInput('procesando', false);
    fixture.componentRef.setInput('publicacion', { ...publicacionPrueba(), activo: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.like')).toBeNull();
    expect(fixture.nativeElement.querySelector('.baja')).toBeNull();
    fixture.componentInstance.emitirLike();
    expect(espia).not.toHaveBeenCalled();
  });
  it('mantiene contenido antiguo, autor ausente y expansión Ver más/Ver menos mediante el pipe', () => {
    const texto = 'Jugada del club '.repeat(30);
    fixture.componentRef.setInput('publicacion', {
      ...publicacionPrueba(),
      titulo: undefined,
      descripcion: undefined,
      contenido: texto,
      autorId: null,
      tipoMultimedia: 'ninguno',
      multimediaUrl: '',
    });
    fixture.detectChanges();
    const html = fixture.nativeElement;
    expect(html.textContent).toContain('Publicación anterior');
    expect(html.textContent).toContain('Usuario no disponible');
    expect(html.querySelector('.post-image')).toBeNull();
    expect(html.querySelector('.post-body p').textContent).toBe(texto.slice(0, 280) + '…');
    html.querySelector('.expandir').click();
    fixture.detectChanges();
    expect(html.querySelector('.post-body p').textContent).toBe(texto);
    expect(html.querySelector('.expandir').textContent).toContain('Ver menos');
    expect(html.querySelector('.expandir').getAttribute('aria-expanded')).toBe('true');
    html.querySelector('.expandir').click();
    fixture.detectChanges();
    expect(html.querySelector('.expandir').textContent).toContain('Ver más');
    expect(html.querySelector('.post-body p').textContent).toBe(texto.slice(0, 280) + '…');
  });
});
