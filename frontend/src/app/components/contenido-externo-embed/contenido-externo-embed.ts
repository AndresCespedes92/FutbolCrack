import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { TipoContenido, urlContenidoValidator } from '../../validators/url-contenido.validator';
import { InstagramEmbed } from '../../services/instagram-embed';

// Lista cerrada: no se reutiliza el host ni la query proporcionados por el usuario.
const ORIGEN_REPRODUCTOR = 'https://www.tiktok.com';
const ORIGENES_PERMITIDOS = [
  ORIGEN_REPRODUCTOR,
  'https://www.instagram.com',
  'https://instagram.com',
] as const;
type EstadoEmbed =
  'inicial' | 'cargando' | 'insertado' | 'disponible' | 'sin-confirmar' | 'no-disponible';

/** Hijo de PublicacionCard: recibe datos por Input, sin HTTP ni permisos de negocio.
 * Documentación oficial: https://developers.tiktok.com/doc/embed-player/
 * Instagram usa el blockquote propio + embed.js oficial; no se inserta HTML recibido.
 * https://developers.facebook.com/documentation/instagram-platform/oembed
 */
@Component({
  selector: 'app-contenido-externo-embed',
  standalone: true,
  templateUrl: './contenido-externo-embed.html',
  styleUrl: './contenido-externo-embed.css',
})
export class ContenidoExternoEmbed implements OnChanges {
  @Input() tipoContenido?: TipoContenido;
  @Input() urlExterna?: string;
  @Input() amplio = false;
  @ViewChild('reproductor') private reproductor?: ElementRef<HTMLIFrameElement>;
  @ViewChild('instagramContenedor') private instagramContenedor?: ElementRef<HTMLDivElement>;
  private readonly instagram = inject(InstagramEmbed);
  private readonly renderer = inject(Renderer2);
  private observador?: MutationObserver;
  private version = 0;
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);
  private temporizador?: ReturnType<typeof setTimeout>;
  enlaceOriginal: string | null = null;
  recurso: SafeResourceUrl | null = null;
  estado: EstadoEmbed = 'inicial';
  cargado = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.version++;
      this.cancelarEspera();
      this.observador?.disconnect();
    });
  }
  get plataforma(): string {
    return this.tipoContenido === 'instagram' ? 'Instagram' : 'TikTok';
  }

  ngOnChanges(cambios: SimpleChanges): void {
    // Ampliar la tarjeta en el detalle solo modifica CSS: no reinicia el video ya cargado.
    if (!cambios['tipoContenido'] && !cambios['urlExterna']) return;
    this.version++;
    this.limpiarInstagram();
    this.cancelarEspera();
    this.estado = 'inicial';
    this.cargado = false;
    this.recurso = null;
    this.enlaceOriginal = null;
    const tipo = this.tipoContenido;
    if ((tipo !== 'instagram' && tipo !== 'tiktok') || typeof this.urlExterna !== 'string') return;
    if (urlContenidoValidator(tipo)(new FormControl(this.urlExterna)) || !this.urlExterna.trim())
      return;
    this.enlaceOriginal = this.urlExterna.trim();
  }

  cargar(): void {
    if (this.tipoContenido === 'instagram') {
      this.cargarInstagram();
      return;
    }
    if (this.tipoContenido !== 'tiktok' || !this.enlaceOriginal || this.recurso) return;
    const id = new URL(this.enlaceOriginal).pathname.match(
      /^\/@[A-Za-z0-9._]+\/(?:video|photo)\/(\d+)\/?$/,
    )?.[1];
    if (!id || !/^\d+$/.test(id)) return;
    const destino = new URL(`/player/v1/${id}`, ORIGEN_REPRODUCTOR);
    destino.search = 'autoplay=0&controls=1&description=1';
    if (!ORIGENES_PERMITIDOS.some((origen) => origen === destino.origin)) return;
    // Angular no sanitiza Resource URLs. Esta excepción SOLO recibe un destino construido
    // aquí con origen/ruta fijos e ID numérico validado; nunca la URL arbitraria del Input.
    this.recurso = this.sanitizer.bypassSecurityTrustResourceUrl(destino.href);
    this.estado = 'cargando';
    // Un load del iframe no prueba que el contenido exista. Sin señal oficial no afirmamos éxito.
    this.temporizador = setTimeout(() => {
      if (this.estado === 'cargando') this.estado = 'sin-confirmar';
      this.cdr.markForCheck(); // También actualiza la vista cuando Angular funciona sin Zone.js.
    }, 20000);
  }

  private cargarInstagram(): void {
    const contenedor = this.instagramContenedor?.nativeElement;
    if (!this.enlaceOriginal || !contenedor || this.estado === 'cargando') return;
    const codigo = new URL(this.enlaceOriginal).pathname.match(
      /^\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)\/?$/,
    )?.[1];
    if (!codigo) return;
    this.cancelarEspera();
    // No incorporamos ruta ni query libres; reels se normaliza al formato oficial reel.
    const formato = new URL(this.enlaceOriginal).pathname.startsWith('/p/') ? 'p' : 'reel';
    const canonica = `https://www.instagram.com/${formato}/${codigo}/`;
    this.limpiarInstagram();
    const bloque = this.renderer.createElement('blockquote') as HTMLElement;
    this.renderer.addClass(bloque, 'instagram-media');
    this.renderer.setAttribute(bloque, 'data-instgrm-permalink', canonica);
    this.renderer.setAttribute(bloque, 'data-instgrm-version', '14');
    this.renderer.setStyle(bloque, 'min-width', '0');
    const enlace = this.renderer.createElement('a') as HTMLAnchorElement;
    this.renderer.setAttribute(enlace, 'href', canonica);
    this.renderer.appendChild(enlace, this.renderer.createText('Ver publicación en Instagram'));
    this.renderer.appendChild(bloque, enlace);
    this.renderer.appendChild(contenedor, bloque);
    this.estado = 'cargando';
    // Cada intento invalida también promesas anteriores de esta misma publicación.
    const version = ++this.version;
    // Meta no documenta una señal equivalente a onPlayerReady: observar un iframe NO prueba
    // que la publicación esté disponible. La plataforma muestra sus propias restricciones.
    this.observador = new MutationObserver(() => {
      const marco = contenedor.querySelector('iframe');
      if (!marco?.src || marco.src === 'about:blank') return;
      let origen: string;
      try {
        origen = new URL(marco.src).origin;
      } catch {
        marco.remove();
        this.marcarNoDisponible();
        return;
      }
      if (
        !ORIGENES_PERMITIDOS.some((permitido) => permitido === origen) ||
        origen === ORIGEN_REPRODUCTOR
      ) {
        marco.remove();
        this.marcarNoDisponible();
      } else {
        this.renderer.setAttribute(marco, 'title', 'Publicación de Instagram');
        this.renderer.setStyle(marco, 'min-width', '0');
        this.renderer.setStyle(marco, 'max-width', '100%');
        this.renderer.setStyle(marco, 'width', '100%');
        this.cancelarEspera();
        // La vista fue insertada, pero solo Instagram conoce si el contenido es público.
        // No mostramos un aviso de fallo por el solo hecho de que Meta no emita onPlayerReady.
        this.estado = 'insertado';
        this.cdr.markForCheck();
      }
    });
    this.observador.observe(contenedor, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
    this.temporizador = setTimeout(() => {
      this.estado = 'sin-confirmar';
      this.cdr.markForCheck();
    }, 20000);
    void this.instagram
      .cargar()
      .then(() => {
        if (version !== this.version) return;
        this.instagram.procesar();
      })
      .catch(() => {
        if (version === this.version) {
          this.marcarNoDisponible();
          this.cdr.markForCheck();
        }
      });
  }

  private limpiarInstagram(): void {
    this.observador?.disconnect();
    const contenedor = this.instagramContenedor?.nativeElement;
    if (contenedor)
      while (contenedor.firstChild) this.renderer.removeChild(contenedor, contenedor.firstChild);
  }

  documentoCargado(): void {
    this.cargado = true;
  }

  @HostListener('window:message', ['$event'])
  recibirMensaje(evento: MessageEvent): void {
    const ventana = this.reproductor?.nativeElement.contentWindow;
    if (
      !this.recurso ||
      !ventana ||
      evento.source !== ventana ||
      evento.origin !== ORIGEN_REPRODUCTOR
    )
      return;
    const datos: unknown = evento.data;
    if (
      !datos ||
      typeof datos !== 'object' ||
      !('x-tiktok-player' in datos) ||
      datos['x-tiktok-player'] !== true ||
      !('type' in datos)
    )
      return;
    if (datos.type === 'onPlayerReady') {
      this.cancelarEspera();
      this.estado = 'disponible';
    } else if (datos.type === 'onPlayerError' || datos.type === 'onError') {
      this.marcarNoDisponible();
    }
  }

  marcarNoDisponible(): void {
    this.cancelarEspera();
    this.limpiarInstagram();
    this.estado = 'no-disponible';
    this.recurso = null;
    this.cdr.markForCheck();
  }
  reintentar(): void {
    this.cancelarEspera();
    this.limpiarInstagram();
    this.recurso = null;
    this.cargado = false;
    this.estado = 'inicial';
    // Retira el iframe anterior antes de crear otro, incluso si ambos usan el mismo ID.
    this.cdr.detectChanges();
    this.cargar();
    this.cdr.markForCheck(); // El render intermedio ya consumió la marca del evento de clic.
  }
  private cancelarEspera(): void {
    clearTimeout(this.temporizador);
  }
}
