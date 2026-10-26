
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

let appInstance: any;

async function bootstrap() {
  if (!appInstance) {
    const app = await NestFactory.create(AppModule, {
      cors: true,
    });

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

// Vercel utiliza esta función para atender solicitudes HTTP
export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}

// En desarrollo local iniciamos el servidor normalmente
if (!process.env.VERCEL) {
  async function startLocal() {
    const app = await NestFactory.create(AppModule, {
      cors: true,
    });

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
