import { EstadisticasPublicacionesController } from './estadisticas-publicaciones.controller.js';
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
 * Registra el modelo de publicaciones y exporta MongooseModule para que ComentariosModule
 * consulte la misma colección sin duplicar esquema. AuthGuard y Cloudinary se reutilizan por imports.
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
  controllers: [PublicacionesController, EstadisticasPublicacionesController],

  // Un único servicio conserva creación, listado y baja lógica.
  providers: [PublicacionesService, AutenticacionOpcionalGuard],
  // Comentarios consulta el mismo modelo registrado, sin copiar su schema ni sus reglas.
  exports: [MongooseModule],
})
export class PublicacionesModule {}
