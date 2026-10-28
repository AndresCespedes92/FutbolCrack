
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';

import {
  Publicacion,
  PublicacionSchema,
} from './entities/publicacion.entity.js';

/**
 * MÓDULO DE PUBLICACIONES
 *
 * Registra el esquema de Publicacion en Mongoose.
 *
 * De esta manera, NestJS podrá inyectar
 * el modelo de MongoDB en PublicacionesService.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Publicacion.name,
        schema: PublicacionSchema,
      },
    ]),
  ],

  // Incorporaremos el controller en el siguiente paso.
  controllers: [PublicacionesController],

  // Incorporaremos el servicio en el siguiente paso.
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
