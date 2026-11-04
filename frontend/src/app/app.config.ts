import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
//Angular es la recepción del club y NestJS es la oficina administrativa
// HttpClient ya conecta los formularios con Nest; el interceptor distingue errores de sesión de otros fallos.
// HttpClient es el mensajero que permite enviar esos datos y recibir una respuesta.

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

import { provideRouter } from '@angular/router';

// Importamos el proveedor para realizar peticiones HTTP.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { sesionInterceptor } from './interceptors/sesion.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Worker oficial SOLO en producción. La lista de estáticos está en ngsw-config.json;
    // sin dataGroups ni URLs externas: cookies/sesión/datos siempre van a Nest por red.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
      updateViaCache: 'none',
    }),
    // Manejo global de errores del navegador.
    provideBrowserGlobalErrorListeners(),

    // Habilita la navegación entre componentes.
    provideRouter(routes),

    // Habilita HttpClient para comunicarnos con NestJS.
    provideHttpClient(withInterceptors([sesionInterceptor])),
  ],
};
