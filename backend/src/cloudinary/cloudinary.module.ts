
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service.js';

@Module({
  // Registramos el servicio dentro de este módulo.
  providers: [CloudinaryService],

  // Permitimos que otros módulos utilicen CloudinaryService.
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
