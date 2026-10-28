//Angular es la recepción del club y NestJS es la oficina administrativa
// Hasta ahora, la recepción muestra formularios, pero no puede enviar las solicitudes a la oficina. 
// HttpClient es el mensajero que permite enviar esos datos y recibir una respuesta.


import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { provideRouter } from '@angular/router';

// Importamos el proveedor para realizar peticiones HTTP.
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Manejo global de errores del navegador.
    provideBrowserGlobalErrorListeners(),

    // Habilita la navegación entre componentes.
    provideRouter(routes),

    // Habilita HttpClient para comunicarnos con NestJS.
    provideHttpClient(),
  ],
};
