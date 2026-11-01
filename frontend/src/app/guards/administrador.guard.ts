import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth';

// Solo navegación: el rol actual/estado se vuelve a consultar en Nest en CADA operación.
export const administradorGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService),
    router = inject(Router);
  return auth.comprobarAcceso().pipe(
    map((valida) => {
      if (!valida)
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: estado.url } });
      return auth.usuarioActual()?.perfil === 'administrador' &&
        auth.usuarioActual()?.activo !== false
        ? true
        : router.createUrlTree(['/publicaciones'], { queryParams: { acceso: 'sin-permiso' } });
    }),
  );
};
