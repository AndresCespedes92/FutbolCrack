import { EstadisticasComentariosController } from './estadisticas-comentarios.controller.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeguridadModule } from '../auth/seguridad.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { PublicacionesModule } from '../publicaciones/publicaciones.module.js';
import { Comentario, ComentarioSchema } from './entities/comentario.entity.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';

// Único módulo funcional nuevo autorizado. Reutiliza identidad, usuarios y modelo de publicaciones.
@Module({
  imports: [
    SeguridadModule,
    UsuariosModule,
    PublicacionesModule,
    MongooseModule.forFeature([
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
  ],
  controllers: [ComentariosController, EstadisticasComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
