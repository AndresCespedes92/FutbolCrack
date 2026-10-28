
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthGuard } from './guards/auth.guard.js';

/**
 * Módulo compartido de seguridad.
 *
 * Centraliza la configuración JWT y proporciona
 * el guard a los módulos que necesiten proteger rutas.
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '20s' },
    }),
  ],

  providers: [AuthGuard],

  // Permite que otros módulos utilicen JwtService
  // y AuthGuard al importar SeguridadModule.
  exports: [JwtModule, AuthGuard],
})
export class SeguridadModule {}
