// Lista explícita compartida por CORS y la validación CSRF; nunca se confía en Host/X-Forwarded-Host.
export function origenesPermitidos(): string[] {
  return [
    'http://localhost:4200',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];
}
