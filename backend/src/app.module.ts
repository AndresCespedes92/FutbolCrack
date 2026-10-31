
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';

import { UsuariosModule } from './usuarios/usuarios.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';

// Middleware que verifica el origen de las solicitudes.
import { ValidarOrigenMiddleware } from './common/middlewares/validar-origen.middleware.js';

/**
 * MÓDULO PRINCIPAL DE FUTBOLCRACK
 *
 * Reúne los módulos funcionales del backend
 * y configura los middlewares globales.
 */
@Module({
  imports: [
    // Variables de entorno.
    ConfigModule.forRoot(),

    // Conexión con MongoDB Atlas.
    MongooseModule.forRoot(process.env.CONNECTION_STRING!),

    // Gestión de usuarios.
    UsuariosModule,

    // Registro, login y seguridad.
    AuthModule,

    // Almacenamiento de imágenes.
    CloudinaryModule,

    // Gestión de publicaciones.
    PublicacionesModule,
  ],

  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {

  /**
   * Configura el middleware de validación de origen.
   *
   * Se ejecuta antes de que NestJS llegue
   * a los controllers.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ValidarOrigenMiddleware)
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL,
      });
  }
}
