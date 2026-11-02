import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { API_URL } from '../services/api.config';

// 401 = identidad no válida; 403 = identidad válida sin permiso. No se destruyen borradores por 403/red.
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
