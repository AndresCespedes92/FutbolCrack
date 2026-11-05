import { ValidatorFn } from '@angular/forms';

export type TipoContenido = 'propia' | 'instagram' | 'tiktok';
export type PlataformaExterna = Exclude<TipoContenido, 'propia'>;

/** Reutiliza el patrón de los validators de CineBera: devolver un error o null,
 * sin modificar el control. Esta regla nueva comprueba HTTPS, host exacto y ruta de
 * publicación; no consulta la red ni puede asegurar que el contenido siga siendo público.
 * No alcanza con buscar "instagram.com" dentro de un texto: podría ser un dominio falso.
 */
export function urlContenidoValidator(plataforma: PlataformaExterna): ValidatorFn {
  return (control) => {
    if (control.value === '' || control.value === null || control.value === undefined) return null; // El vacío corresponde a Validators.required.
    if (typeof control.value !== 'string') return { urlContenido: true };
    try {
      const valor = control.value.trim();
      const url = new URL(valor);
      if (
        !/^https:\/\//i.test(valor) ||
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.port ||
        /[\s\\]/.test(valor) ||
        valor.length > 2048
      )
        return { urlContenido: true };
      const host = url.hostname.toLowerCase();
      const instagram =
        ['instagram.com', 'www.instagram.com'].includes(host) &&
        /^\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname);
      const tiktok =
        ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'].includes(host) &&
        /^\/@[A-Za-z0-9._]+\/(?:video|photo)\/\d+\/?$/.test(url.pathname);
      return (plataforma === 'instagram' ? instagram : tiktok) ? null : { urlContenido: true };
    } catch {
      return { urlContenido: true };
    }
  };
}
