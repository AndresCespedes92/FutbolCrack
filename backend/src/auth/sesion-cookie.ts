import type { CookieOptions, Response } from 'express';

// Conserva la arquitectura Vercel entre sitios: None exige HTTPS/Secure en producción.
export function opcionesCookieSesion(): CookieOptions {
  const produccion = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: produccion,
    sameSite: produccion ? 'none' : 'lax',
    path: '/',
  };
}
export function guardarCookieSesion(
  respuesta: Response,
  token: string,
  expiraEn: string,
): void {
  // Alineación con el exp REAL, no 15 minutos adicionales después de firmar el token.
  respuesta.cookie('token', token, {
    ...opcionesCookieSesion(),
    maxAge: Math.max(0, Date.parse(expiraEn) - Date.now()),
  });
}
