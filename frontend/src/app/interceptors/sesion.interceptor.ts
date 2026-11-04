import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { API_URL } from '../services/api.config';

// 401 = identidad no válida; 403 = identidad válida sin permiso. No se destruyen borradores por 403/red.
/**
 * Interceptor funcional registrado por provideHttpClient: observa errores de NUESTRA API
 * y solo invalida por 401 en operaciones protegidas reconocidas por ruta/método.
 * Un login incorrecto y autorizar tienen manejo propio, por eso no fuerzan aquí otra navegación.
 * 403 conserva la sesión (puede ser falta de rol/autoría o rechazo de origen); status 0 indica
 * problema de red/CORS, no una identidad inválida. throwError deja el error al componente para
 * que muestre el mensaje adecuado: el interceptor no convierte un fallo en éxito.
 */
export const sesionInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const url = new URL(request.url, document.baseURI);
  const nuestraApi = url.origin === new URL(API_URL).origin;
  const protegida =
    url.pathname === '/auth/me' ||
    url.pathname === '/auth/refrescar' ||
    url.pathname.startsWith('/usuarios') ||
    // Los tres reportes también son privados: un 401 debe invalidar, un 403 conserva sesión.
    url.pathname.startsWith('/estadisticas') ||
    (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
      (url.pathname.startsWith('/publicaciones') || url.pathname.startsWith('/comentarios')));
  // Login y autorizar tienen 401 esperables y manejadores propios; no generan redirecciones aquí.
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (nuestraApi && protegida && error.status === 401) auth.invalidarSesion();
      return throwError(() => error);
    }),
  );
};
