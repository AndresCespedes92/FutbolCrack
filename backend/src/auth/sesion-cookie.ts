import type { CookieOptions, Response } from 'express';

// Conserva la arquitectura Vercel entre sitios: None exige HTTPS/Secure en producción.
/**
 * HttpOnly impide lectura mediante JavaScript; no evita por sí solo CSRF ni cifra el contenido.
 * Secure restringe transporte a HTTPS y SameSite=None permite el caso entre sitios de producción,
 * pero el navegador puede imponer políticas adicionales de cookies de terceros.
 * En desarrollo se usa Secure=false/SameSite=Lax para localhost HTTP. No hay atributo Domain,
 * por lo que la cookie pertenece al host que la emitió; Path=/ cubre sus endpoints.
 */
export function opcionesCookieSesion(): CookieOptions {
  const produccion = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: produccion,
    sameSite: produccion ? 'none' : 'lax',
    path: '/',
  };
}
/**
 * Alinea vida de cookie y exp del JWT: maxAge usa milisegundos restantes hasta expiraEn.
 * No suma una duración nueva desde el momento en que la respuesta tarda en llegar.
 * Recibir la cookie no autoriza por sí solo: cada operación protegida verifica JWT y usuario.
 */
export function guardarCookieSesion(
  respuesta: Response,
  token: string,
  expiraEn: string,
): void {
  // Alineación con el exp real, sin agregar otro plazo después de firmar el token.
  respuesta.cookie('token', token, {
    ...opcionesCookieSesion(),
    maxAge: Math.max(0, Date.parse(expiraEn) - Date.now()),
  });
}
