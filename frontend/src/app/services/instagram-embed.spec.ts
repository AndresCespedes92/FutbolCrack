import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { InstagramEmbed } from './instagram-embed';

// Eventos simulados: estas pruebas NO descargan embed.js ni consultan publicaciones reales.
describe('InstagramEmbed: script oficial único y errores recuperables', () => {
  let api: InstagramEmbed;
  const ventana = window as Window & { instgrm?: { Embeds: { process: () => void } } };
  const script = () =>
    document.querySelector<HTMLScriptElement>('script[src="https://www.instagram.com/embed.js"]')!;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    api = TestBed.inject(InstagramEmbed);
  });
  afterEach(() => {
    script()?.remove();
    delete ventana.instgrm;
    vi.useRealTimers();
  });
  it('no carga automáticamente; dos componentes comparten una sola promesa y un script fijo', async () => {
    expect(script()).toBeNull();
    const primera = api.cargar(),
      segunda = api.cargar();
    expect(segunda).toBe(primera);
    expect(
      document.querySelectorAll('script[src="https://www.instagram.com/embed.js"]'),
    ).toHaveLength(1);
    expect(script().async).toBe(true);
    const procesar = vi.fn();
    ventana.instgrm = { Embeds: { process: procesar } };
    script().dispatchEvent(new Event('load'));
    await primera;
    api.procesar();
    expect(procesar).toHaveBeenCalledOnce();
    await api.cargar();
    expect(
      document.querySelectorAll('script[src="https://www.instagram.com/embed.js"]'),
    ).toHaveLength(1);
  });
  it('error de red retira el script y habilita reintento sin promesa rechazada cacheada', async () => {
    const primera = api.cargar();
    script().dispatchEvent(new Event('error'));
    await expect(primera).rejects.toThrow('No se pudo cargar');
    expect(script()).toBeNull();
    const segunda = api.cargar();
    expect(segunda).not.toBe(primera);
    ventana.instgrm = { Embeds: { process: vi.fn() } };
    script().dispatchEvent(new Event('load'));
    await expect(segunda).resolves.toBeUndefined();
  });
  it('no considera load exitoso si el API oficial no se inicializó', async () => {
    const carga = api.cargar();
    script().dispatchEvent(new Event('load'));
    await expect(carga).rejects.toThrow('no inicializó');
  });
  it('bloqueo silencioso termina con error después de 15 segundos', async () => {
    vi.useFakeTimers();
    const comprobacion = expect(api.cargar()).rejects.toThrow('no respondió');
    await vi.advanceTimersByTimeAsync(15000);
    await comprobacion;
    expect(script()).toBeNull();
  });
});
