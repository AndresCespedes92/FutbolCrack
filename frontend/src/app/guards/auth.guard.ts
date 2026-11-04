import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth';

// Reutiliza la autorización inicial o la misma solicitud en curso. Nest protege los datos de verdad.
/**
 * Guard funcional de navegación: consulta el estado compartido y devuelve true o UrlTree.
 * UrlTree describe el destino login/returnUrl sin disparar una navegación paralela desde el guard.
 * No intercepta Postman ni protege MongoDB: AuthGuard de Nest sigue siendo obligatorio para datos privados.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService),
    router = inject(Router);
  return auth
    .comprobarAcceso()
    .pipe(
      map(
        (valida) =>
          valida || router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
      ),
    );
};
