//Organiza el departamento de inscripciones - se encargará del registro, login y JWT

//Registro funcionará así:
//1. AuthController recibirá los datos.
//2. CreateUsuarioDto validará el formato.
//3. AuthService comprobará que password y repetirPassword coincidan.
//4. bcrypt generará el hash.
//5. UsuariosService verificará duplicados y guardará el usuario.
//6. La API responderá sin incluir la contraseña ni su hash.




import { Module } from '@nestjs/common';

import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

// Módulo compartido que configura JWT y AuthGuard.
import { SeguridadModule } from './seguridad.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    // Permite consultar y crear usuarios en MongoDB.
    UsuariosModule,

    // Permite subir imágenes de perfil.
    CloudinaryModule,

    // Proporciona JwtService y AuthGuard.
    SeguridadModule,
  ],

  controllers: [AuthController],

  providers: [AuthService],
})
export class AuthModule {}
