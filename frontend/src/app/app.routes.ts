import { Routes } from '@angular/router';

// Guard que comprueba la sesión mediante NestJS.
import { authGuard } from './guards/auth.guard';
import { administradorGuard } from './guards/administrador.guard';

/**
 * RUTAS DE FUTBOLCRACK
 *
 * Login, registro y publicaciones son públicos.
 * Mi Perfil requiere una sesión válida.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'publicaciones',
  },
  {
    path: 'login',
    title: 'Ingresar | FutbolCrack',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Registro | FutbolCrack',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'publicaciones',
    title: 'Publicaciones | FutbolCrack',
    loadComponent: () => import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones),
  },
  {
    path: 'publicaciones/:id',
    title: 'Publicación | FutbolCrack',
    // Es pública; el ID viaja por la URL. Las escrituras conservan la autenticación de Nest.
    loadComponent: () =>
      import('./pages/publicacion-detalle/publicacion-detalle').then((m) => m.PublicacionDetalle),
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil | FutbolCrack',

    // Antes de navegar, Angular verifica la sesión.
    canActivate: [authGuard],

    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil),
  },
  {
    path: 'dashboard/usuarios',
    title: 'Usuarios | FutbolCrack',
    canActivate: [administradorGuard],
    loadComponent: () =>
      import('./pages/dashboard-usuarios/dashboard-usuarios').then((m) => m.DashboardUsuarios),
  },
  {
    path: '**',
    redirectTo: 'publicaciones',
  },
];
