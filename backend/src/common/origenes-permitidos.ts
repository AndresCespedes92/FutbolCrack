// Lista explícita compartida por CORS y la validación CSRF; nunca se confía en Host/X-Forwarded-Host.
/**
 * Lista explícita compartida por CORS y CSRF: incluye localhost:4200 y FRONTEND_URL si existe.
 * No se permite cualquier dominio ni se toma el origen de un Host enviado por el cliente.
 * Mostrar esta función permite explicar la diferencia entre un 403 de origen y un 401 de sesión.
 */
export function origenesPermitidos(): string[] {
  return [
    'http://localhost:4200',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];
}
