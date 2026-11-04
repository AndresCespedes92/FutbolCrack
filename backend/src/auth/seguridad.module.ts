import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from '../usuarios/entities/usuario.entity.js';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthGuard } from './guards/auth.guard.js';
import { DURACION_SESION_SEGUNDOS } from './sesion.constants.js';

/**
 * Concentra JwtModule, el secreto de entorno y la duración, y exporta el guard compartido.
 * Inyección de dependencias permite reutilizar el mismo verificador en publicaciones/usuarios.
 * No existe una estrategia Passport en este proyecto: AuthGuard llama directamente a JwtService.
 * El secreto nunca se debe mostrar en la defensa; alcanza con señalar el nombre de la variable.
 */
@Module({
  imports: [
    // Reutiliza el schema para consultar estado sin un ciclo SeguridadModule <-> UsuariosModule.
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: DURACION_SESION_SEGUNDOS },
    }),
  ],

  providers: [AuthGuard],

  // Permite que otros módulos utilicen JwtService
  // y AuthGuard al importar SeguridadModule.
  exports: [JwtModule, AuthGuard, MongooseModule],
})
export class SeguridadModule {}
