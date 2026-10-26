import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Punto de entrada: Angular inicia App y registra la configuración de navegación.
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
