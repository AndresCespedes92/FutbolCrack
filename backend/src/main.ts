
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

/**
 * Configuración CORS de FutbolCrack.
 *
 * En desarrollo permitimos Angular en localhost:4200.
 * En producción utilizaremos FRONTEND_URL, configurada
 * como variable de entorno en Vercel.
 */
const corsOptions = {
  origin: [
    'http://localhost:4200',
    ...(process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : []),
  ],
  credentials: true,
};

// Conservamos la instancia para reutilizarla en Vercel.
let appInstance: any;

/**
 * Inicialización utilizada por Vercel.
 */
async function bootstrap() {
  if (!appInstance) {
    const app = await NestFactory.create(AppModule, {
      cors: corsOptions,
    });

    // Validaciones globales de los DTO.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    appInstance = app.getHttpAdapter().getInstance();
  }

  return appInstance;
}

/**
 * Vercel ejecuta esta función para atender peticiones HTTP.
 */
export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}

/**
 * En desarrollo iniciamos NestJS en localhost:3000.
 */
if (!process.env.VERCEL) {
  async function startLocal() {
    const app = await NestFactory.create(AppModule, {
      cors: corsOptions,
    });

    // Aplicamos las mismas validaciones en local.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.listen(process.env.PORT ?? 3000);
  }

  startLocal();
}
