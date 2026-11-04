import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { origenesPermitidos } from './common/origenes-permitidos.js';

/**
 * CORS permite el origen frontend configurado y credenciales en el navegador; no autentica.
 * La app añade además middleware de origen, guards y ValidationPipe para responsabilidades distintas.
 * whitelist/forbidNonWhitelisted rechazan campos ajenos al DTO. Hay dos arranques (Vercel/local)
 * y ambos aplican el pipe; no se debe asumir que compilar TypeScript valida JSON recibido.
 */
const corsOptions = {
  origin: origenesPermitidos(),
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
