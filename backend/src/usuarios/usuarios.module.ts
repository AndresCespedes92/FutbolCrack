
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsuariosService } from './usuarios.service.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { UsuariosController } from './usuarios.controller.js';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';

// Módulo que proporciona AuthGuard y JwtService.
import { SeguridadModule } from '../auth/seguridad.module.js';

@Module({
  imports: [
    // Registra el modelo Usuario para utilizarlo con Mongoose.
    MongooseModule.forFeature([
      {
        name: Usuario.name,
        schema: UsuarioSchema,
      },
    ]),

    // Permite utilizar AuthGuard en las rutas de usuarios.
    SeguridadModule,
  ],

  controllers: [UsuariosController],

  // El guard de rol reutiliza el servicio existente; no modifica JWT ni cookies.
  providers: [UsuariosService, AdministradorGuard],

  // AuthModule necesita UsuariosService para registro y login.
  exports: [UsuariosService],
})
export class UsuariosModule {}
