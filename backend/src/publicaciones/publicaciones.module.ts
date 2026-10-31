import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { SeguridadModule } from '../auth/seguridad.module.js';
import { AutenticacionOpcionalGuard } from './guards/autenticacion-opcional.guard.js';
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
    CloudinaryModule,
    UsuariosModule,
    SeguridadModule,
    MongooseModule.forFeature([
      {
        name: Publicacion.name,
        schema: PublicacionSchema,
      },
    ]),
  ],

  // Reutilizamos los módulos existentes para imágenes, identidad y permisos.
  controllers: [PublicacionesController],

  // Un único servicio conserva creación, listado y baja lógica.
  providers: [PublicacionesService, AutenticacionOpcionalGuard],
})
export class PublicacionesModule {}
