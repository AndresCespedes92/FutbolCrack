
import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { catchError, map, of, throwError } from 'rxjs';

import { AuthService } from '../services/auth';

/**
 * GUARD DE AUTENTICACIÓN DE ANGULAR
 *
 * Se ejecuta antes de permitir el acceso
 * a una pantalla protegida.
 *
 * A diferencia del AuthGuard de NestJS:
 *
 * - Angular decide si permite navegar.
 * - NestJS protege realmente los datos del servidor.
 */
export const authGuard: CanActivateFn = () => {

  // Inyección de dependencias.
  const authService = inject(AuthService);
  const router = inject(Router);

  /**
   * Consultamos al backend para comprobar
   * que la cookie contiene un JWT válido.
   */
  return authService.obtenerMiPerfil().pipe(

    // Si NestJS responde 200, permitimos la navegación.
    map(() => true),

    // Si responde 401, la sesión no es válida.
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {

        // Redirigimos al login sin entrar a Mi Perfil.
        return of(router.createUrlTree(['/login']));
      }

      // No confundimos un problema de conexión
      // con una sesión vencida.
      return throwError(() => error);
    }),
  );
};
