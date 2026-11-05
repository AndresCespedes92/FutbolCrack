import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

interface VentanaInstagram extends Window {
  instgrm?: { Embeds?: { process?: () => void } };
}

/** Carga una sola copia del script OFICIAL, a pedido de un componente.
 * Feed y detalle comparten esta carga: el script se solicita al pulsar «Cargar Instagram».
 * No consulta oEmbed ni interpreta HTML de usuarios. El único script permitido es constante.
 * https://developers.facebook.com/documentation/instagram-platform/oembed (Embed JS).
 */
@Injectable({ providedIn: 'root' })
export class InstagramEmbed {
  private readonly documento = inject(DOCUMENT);
  private carga?: Promise<void>;
  private get api() {
    return (this.documento.defaultView as VentanaInstagram | null)?.instgrm?.Embeds;
  }

  cargar(): Promise<void> {
    if (this.api?.process) return Promise.resolve();
    if (this.carga) return this.carga;
    this.carga = new Promise<void>((resolve, reject) => {
      const script = this.documento.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      const terminar = (error?: Error) => {
        clearTimeout(espera);
        script.onload = null;
        script.onerror = null;
        if (error) {
          script.remove();
          reject(error);
        } else resolve();
      };
      // Evita una promesa pendiente indefinidamente si un bloqueo no emite error.
      const espera = setTimeout(() => terminar(new Error('Instagram no respondió')), 15000);
      script.onload = () =>
        terminar(this.api?.process ? undefined : new Error('Instagram no inicializó la inserción'));
      script.onerror = () => terminar(new Error('No se pudo cargar Instagram'));
      this.documento.head.appendChild(script);
    }).catch((error: unknown) => {
      this.carga = undefined;
      throw error;
    });
    return this.carga;
  }

  procesar(): void {
    this.api?.process?.();
  }
}
