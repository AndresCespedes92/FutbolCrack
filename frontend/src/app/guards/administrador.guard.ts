import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth';

// Solo navegación: el rol actual/estado se vuelve a consultar en Nest en CADA operación.
/**
 * Primero exige sesión; después habilita pantallas administrativas según rol/estado conocidos.
 * Una persona autenticada sin rol vuelve al feed con acceso=sin-permiso, no se cierra su sesión.
 * Estos datos locales pueden quedar antiguos: AdministradorGuard de Nest consulta la ficha real
 * en cada operación, por eso ocultar enlaces y proteger la URL no sustituyen autorización remota.
 */
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
