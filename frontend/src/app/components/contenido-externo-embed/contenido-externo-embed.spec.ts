import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ContenidoExternoEmbed } from './contenido-externo-embed';
import { InstagramEmbed } from '../../services/instagram-embed';

const enlace = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
// JSDOM no reproduce multimedia. Los eventos se simulan y no prueban disponibilidad en TikTok.
describe('Contenido externo: validación, carga a pedido y señales oficiales', () => {
  let fixture: ComponentFixture<ContenidoExternoEmbed>;
  const instagram = { cargar: vi.fn(), procesar: vi.fn() };
  const html = () => fixture.nativeElement as HTMLElement;
  beforeEach(async () => {
    instagram.cargar.mockReset().mockResolvedValue(undefined);
    instagram.procesar.mockReset();
    await TestBed.configureTestingModule({
      imports: [ContenidoExternoEmbed],
      providers: [{ provide: InstagramEmbed, useValue: instagram }],
    }).compileComponents();
    fixture = TestBed.createComponent(ContenidoExternoEmbed);
  });
  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });
  function configurar(tipo: 'propia' | 'instagram' | 'tiktok', url?: string) {
    fixture.componentRef.setInput('tipoContenido', tipo);
    fixture.componentRef.setInput('urlExterna', url);
    fixture.detectChanges();
  }
  function cargar() {
    (html().querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
  }
  function mensaje(
    type: string,
    opciones: { origin?: string; source?: Window | null; value?: unknown; marker?: boolean } = {},
  ) {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: opciones.origin ?? 'https://www.tiktok.com',
        source:
          opciones.source === undefined
            ? html().querySelector('iframe')!.contentWindow
            : opciones.source,
        data: { type, value: opciones.value, 'x-tiktok-player': opciones.marker ?? true },
      }),
    );
    fixture.detectChanges();
  }
  it('no muestra reproductor ni mensajes para propia o tipo ausente', () => {
    fixture.detectChanges();
    expect(html().querySelector('section')).toBeNull();
    configurar('propia');
    expect(html().querySelector('section')).toBeNull();
  });
  it.each(['/p/Club10/', '/reel/Club10/', '/reels/Club10/'])(
    'Instagram %s construye un blockquote oficial a pedido y conserva el enlace',
    async (ruta) => {
      configurar('instagram', 'https://www.instagram.com' + ruta);
      expect(html().textContent).toContain('Cargá la vista integrada');
      expect(html().querySelector('a')!.getAttribute('href')).toBe(
        'https://www.instagram.com' + ruta,
      );
      expect(html().querySelector('a')!.rel).toBe('noopener noreferrer');
      expect(html().querySelector('iframe, script')).toBeNull();
      expect(instagram.cargar).not.toHaveBeenCalled();
      cargar();
      await Promise.resolve();
      const formato = ruta.startsWith('/p/') ? 'p' : 'reel';
      expect(html().querySelector('blockquote')!.getAttribute('data-instgrm-permalink')).toBe(
        `https://www.instagram.com/${formato}/Club10/`,
      );
      expect(instagram.cargar).toHaveBeenCalledOnce();
      expect(instagram.procesar).toHaveBeenCalledOnce();
    },
  );
  it.each(['video', 'photo'])(
    'TikTok %s construye solo el destino oficial y no conserva query ajena',
    (formato) => {
      configurar(
        'tiktok',
        enlace.replace('/video/', `/${formato}/`) + '?autoplay=1&host=evil.test',
      );
      expect(html().querySelector('iframe')).toBeNull();
      cargar();
      const iframe = html().querySelector('iframe')!;
      expect(iframe.getAttribute('src')).toBe(
        'https://www.tiktok.com/player/v1/6718335390845095173?autoplay=0&controls=1&description=1',
      );
      expect(iframe.getAttribute('loading')).toBe('lazy');
      expect(iframe.getAttribute('allow')).toBe('fullscreen');
      expect(iframe.getAttribute('sandbox')).toBe(
        'allow-scripts allow-same-origin allow-presentation',
      );
      expect(iframe.getAttribute('title')).toBe('Publicación de TikTok');
      expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
      expect(html().textContent).toContain('Cargando contenido');
      fixture.componentInstance.cargar();
      fixture.detectChanges();
      expect(html().querySelectorAll('iframe')).toHaveLength(1);
    },
  );
  it.each([
    'javascript:alert(1)',
    'http://www.tiktok.com/@club/video/123',
    'https://www.tiktok.com.evil.test/@club/video/123',
    'https://www.tiktok.com@evil.test/@club/video/123',
    'https://www.tiktok.com/@club/video/123%2F..%2Fevil',
    'https://www.tiktok.com/@club/video/no-numero',
    'https://www.tiktok.com/@club/',
    'https://vm.tiktok.com/Enlace/',
    'https://instagram.com/p/Club10/',
    '<iframe src="https://evil.test"></iframe>',
  ])('rechaza URL maliciosa o incompatible sin iframe ni enlace: %s', (url) => {
    configurar('tiktok', url);
    fixture.componentInstance.cargar();
    fixture.detectChanges();
    expect(html().querySelector('iframe, a, script')).toBeNull();
    expect(html().textContent).toContain('URL es inválida o incompatible');
  });
  it('load de iframe no equivale a reproducción disponible', () => {
    configurar('tiktok', enlace);
    cargar();
    html().querySelector('iframe')!.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('cargando');
    expect(html().textContent).toContain('Esperando confirmación');
    mensaje('onPlayerReady');
    expect(fixture.componentInstance.estado).toBe('disponible');
  });
  it('ignora señales con otro origen, otra ventana o marcador falso', () => {
    configurar('tiktok', enlace);
    cargar();
    mensaje('onPlayerReady', { origin: 'https://www.tiktok.com.evil.test' });
    mensaje('onPlayerReady', { source: window });
    mensaje('onPlayerReady', { marker: false });
    window.dispatchEvent(
      new MessageEvent('message', { origin: 'https://www.tiktok.com', data: null }),
    );
    expect(fixture.componentInstance.estado).toBe('cargando');
    mensaje('onPlayerReady');
    expect(fixture.componentInstance.estado).toBe('disponible');
  });
  it.each(['onPlayerError', 'onError'])('error oficial %s ofrece respaldo y reintento', (type) => {
    configurar('tiktok', enlace);
    cargar();
    mensaje(type, { value: { errorCode: 1001, errorType: 'INVALID_VIDEO' } });
    expect(fixture.componentInstance.estado).toBe('no-disponible');
    expect(html().querySelector('iframe')).toBeNull();
    expect(html().querySelector('a')!.getAttribute('href')).toBe(enlace);
    expect(html().textContent).toContain('restringido, eliminado o no disponible');
    cargar();
    expect(html().querySelector('iframe')).not.toBeNull();
    expect(fixture.componentInstance.estado).toBe('cargando');
  });
  it('falla de carga ofrece enlace sin alertas y sin afirmar su causa', () => {
    configurar('tiktok', enlace);
    cargar();
    html().querySelector('iframe')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('no-disponible');
    expect(html().querySelector('a')).not.toBeNull();
  });
  it('sin evento confiable muestra incertidumbre y acepta una confirmación tardía', () => {
    vi.useFakeTimers();
    configurar('tiktok', enlace);
    cargar();
    vi.advanceTimersByTime(20000);
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('sin-confirmar');
    expect(html().textContent).toContain('No pudimos confirmar');
    expect(html().querySelector('iframe')).not.toBeNull();
    expect(html().querySelector('a')).not.toBeNull();
    mensaje('onPlayerReady');
    expect(fixture.componentInstance.estado).toBe('disponible');
  });
  it('cambiar de publicación elimina recurso, timer y estado anteriores', () => {
    vi.useFakeTimers();
    configurar('tiktok', enlace);
    cargar();
    configurar('instagram', 'https://instagram.com/p/Club10/');
    vi.advanceTimersByTime(20000);
    expect(fixture.componentInstance.estado).toBe('inicial');
    expect(html().querySelector('iframe')).toBeNull();
    expect(html().querySelector('a')!.getAttribute('href')).toBe('https://instagram.com/p/Club10/');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('destruir cancela la espera y no deja un timer del reproductor', () => {
    vi.useFakeTimers();
    configurar('tiktok', enlace);
    cargar();
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('detalle usa el ancho ampliado sin crear un reproductor automáticamente', () => {
    configurar('tiktok', enlace);
    fixture.componentRef.setInput('amplio', true);
    fixture.detectChanges();
    expect(html().querySelector('.amplio')).not.toBeNull();
    expect(html().querySelector('iframe')).toBeNull();
  });
  it('error del script Instagram conserva respaldo y permite reintentar', async () => {
    instagram.cargar.mockRejectedValueOnce(new Error('Bloqueo simulado'));
    configurar('instagram', 'https://instagram.com/p/Club10/');
    cargar();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('no-disponible');
    expect(html().querySelector('blockquote')).toBeNull();
    expect(html().querySelector('a')!.getAttribute('href')).toBe('https://instagram.com/p/Club10/');
    cargar();
    await Promise.resolve();
    expect(instagram.cargar).toHaveBeenCalledTimes(2);
  });
  it('iframe Instagram no se interpreta como confirmación de contenido disponible', async () => {
    configurar('instagram', 'https://instagram.com/p/Club10/');
    cargar();
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.instagram.com/p/Club10/embed/';
    html().querySelector('.instagram-container')!.append(iframe);
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('insertado');
    expect(fixture.componentInstance.estado).not.toBe('disponible');
    expect(html().textContent).toContain('Instagram muestra el contenido');
    expect(html().textContent).not.toContain('No pudimos confirmar');
    expect(iframe.title).toBe('Publicación de Instagram');
    expect(iframe.style.maxWidth).toBe('100%');
    expect(html().querySelector('a')).not.toBeNull();
  });
  it('no acepta un iframe de un origen desconocido en el contenedor Instagram', async () => {
    configurar('instagram', 'https://instagram.com/p/Club10/');
    cargar();
    const iframe = document.createElement('iframe');
    iframe.src = 'https://instagram.com.evil.test/embed/';
    html().querySelector('.instagram-container')!.append(iframe);
    await Promise.resolve();
    expect(fixture.componentInstance.estado).toBe('no-disponible');
    expect(html().querySelector('iframe')).toBeNull();
  });
  it('ignora la promesa Instagram cuando el usuario ya cambió de publicación', async () => {
    let resolver!: () => void;
    instagram.cargar.mockReturnValueOnce(new Promise<void>((resolve) => (resolver = resolve)));
    configurar('instagram', 'https://instagram.com/p/Club10/');
    cargar();
    configurar('tiktok', enlace);
    resolver();
    await Promise.resolve();
    expect(instagram.procesar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.estado).toBe('inicial');
  });
  it('cambiar solo el ancho conserva el iframe y el estado de TikTok', () => {
    configurar('tiktok', enlace);
    cargar();
    mensaje('onPlayerReady');
    const iframe = html().querySelector('iframe');
    fixture.componentRef.setInput('amplio', true);
    fixture.detectChanges();
    expect(html().querySelector('iframe')).toBe(iframe);
    expect(fixture.componentInstance.estado).toBe('disponible');
    expect(html().querySelector('.amplio')).not.toBeNull();
  });
  it('espera sin señal permite reintentar y crea un iframe nuevo para el mismo ID', () => {
    vi.useFakeTimers();
    configurar('tiktok', enlace);
    cargar();
    const anterior = html().querySelector('iframe');
    vi.advanceTimersByTime(20000);
    fixture.detectChanges();
    const boton = html().querySelector('button')!;
    expect(boton.textContent).toContain('Reintentar');
    boton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('cargando');
    expect(html().querySelector('iframe')).not.toBe(anterior);
    expect(html().querySelector('a')!.getAttribute('href')).toBe(enlace);
    expect(html().querySelectorAll('iframe')).toHaveLength(1);
  });
  it('ignora mensajes del iframe TikTok anterior después de reintentar', () => {
    configurar('tiktok', enlace);
    cargar();
    const anterior = html().querySelector('iframe')!.contentWindow;
    fixture.componentInstance.reintentar();
    fixture.detectChanges();
    mensaje('onPlayerReady', { source: anterior });
    expect(fixture.componentInstance.estado).toBe('cargando');
    mensaje('onPlayerReady');
    expect(fixture.componentInstance.estado).toBe('disponible');
  });
  it('Instagram sin respuesta permite reintento y procesa únicamente la promesa del intento vigente', async () => {
    vi.useFakeTimers();
    let resolver!: () => void;
    const pendiente = new Promise<void>((resolve) => (resolver = resolve));
    instagram.cargar.mockReturnValue(pendiente);
    configurar('instagram', 'https://instagram.com/reel/Club10/');
    cargar();
    vi.advanceTimersByTime(20000);
    fixture.detectChanges();
    expect(html().querySelector('button')!.textContent).toContain('Reintentar');
    cargar();
    resolver();
    await Promise.resolve();
    expect(instagram.cargar).toHaveBeenCalledTimes(2);
    expect(instagram.procesar).toHaveBeenCalledOnce();
    expect(html().querySelectorAll('blockquote')).toHaveLength(1);
  });
  it('vista Instagram insertada conserva su iframe al ampliar la tarjeta', async () => {
    configurar('instagram', 'https://instagram.com/reel/Club10/');
    cargar();
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.instagram.com/reel/Club10/embed/';
    html().querySelector('.instagram-container')!.append(iframe);
    await Promise.resolve();
    fixture.detectChanges();
    fixture.componentRef.setInput('amplio', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.estado).toBe('insertado');
    expect(html().querySelector('iframe')).toBe(iframe);
    expect(instagram.cargar).toHaveBeenCalledOnce();
  });
});
