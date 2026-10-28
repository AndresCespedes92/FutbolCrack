//administra los usuarios y se comunica con MongoDB.

import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';

@Module({
  // Conecta el modelo Usuario con MongoDB mediante Mongoose.
  imports: [MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports:[UsuariosService],
})
export class UsuariosModule {}
