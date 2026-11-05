import { BadRequestException } from '@nestjs/common';
import { registerDecorator, ValidationOptions } from 'class-validator';

export const TIPOS_CONTENIDO = ['propia', 'instagram', 'tiktok'] as const;
export type TipoContenido = (typeof TIPOS_CONTENIDO)[number];

/** Solo interpreta texto: nunca descarga URLs ni sigue redirecciones (evita SSRF).
 * Se admiten enlaces canónicos; los enlaces cortos de TikTok necesitan otra etapa.
 * Se conserva ruta, identificador y query, normalizando solo espacios exteriores.
 */
export function urlExternaValida(tipo: unknown, valor: unknown): boolean {
  if (typeof valor !== 'string' || valor.trim().length > 2048) return false;
  try {
    const texto = valor.trim();
    const url = new URL(texto);
    if (
      !/^https:\/\//i.test(texto) ||
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      /[\s\\]/.test(texto)
    )
      return false;
    if (tipo === 'instagram')
      return (
        ['instagram.com', 'www.instagram.com'].includes(url.hostname) &&
        /^\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
      );
    return (
      tipo === 'tiktok' &&
      ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'].includes(url.hostname) &&
      /^\/@[A-Za-z0-9._]+\/(?:video|photo)\/\d+\/?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

// El DTO comprueba la relación entre controles, como un validator de formulario de CineBera.
export function UrlSegunContenido(
  options?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) =>
    registerDecorator({
      name: 'urlSegunContenido',
      target: object.constructor,
      propertyName: String(propertyName),
      options: {
        message:
          'La URL debe ser HTTPS y corresponder a una publicación de la plataforma seleccionada; propia no admite URL externa',
        ...options,
      },
      validator: {
        validate: (value, args) => {
          const tipo =
            (args!.object as { tipoContenido?: unknown }).tipoContenido ??
            'propia';
          return tipo === 'propia'
            ? value === undefined
            : urlExternaValida(tipo, value);
        },
      },
    });
}

/** Defensa compartida para alta y edición: valida el estado FINAL, no solo el PATCH. */
export function validarContenido(
  tipo: unknown,
  url: unknown,
  imagen = false,
): void {
  if (!TIPOS_CONTENIDO.includes(tipo as TipoContenido))
    throw new BadRequestException('El tipo de contenido no es válido');
  if (tipo === 'propia') {
    if (url !== undefined)
      throw new BadRequestException(
        'Una publicación propia no admite URL externa',
      );
  } else {
    if (imagen)
      throw new BadRequestException(
        'Una publicación externa no admite imagen propia',
      );
    if (!urlExternaValida(tipo, url))
      throw new BadRequestException(
        'Ingresá el enlace HTTPS completo de una publicación de la plataforma seleccionada, sin enlaces acortados',
      );
  }
}
