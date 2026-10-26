import { Routes } from '@angular/router';

// Adaptamos la carga por ruta de CineBera. Todas las pantallas son públicas en este sprint.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
  { path: 'login', title: 'Ingresar | FutbolCrack', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'registro', title: 'Registro | FutbolCrack', loadComponent: () => import('./pages/registro/registro').then(m => m.Registro) },
  { path: 'publicaciones', title: 'Publicaciones | FutbolCrack', loadComponent: () => import('./pages/publicaciones/publicaciones').then(m => m.Publicaciones) },
  { path: 'mi-perfil', title: 'Mi perfil | FutbolCrack', loadComponent: () => import('./pages/mi-perfil/mi-perfil').then(m => m.MiPerfil) },
  { path: '**', redirectTo: 'publicaciones' },
];
