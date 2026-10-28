//Organiza el departamento de inscripciones - se encargará del registro, login y JWT

//Registro funcionará así:
//1. AuthController recibirá los datos.
//2. CreateUsuarioDto validará el formato.
//3. AuthService comprobará que password y repetirPassword coincidan.
//4. bcrypt generará el hash.
//5. UsuariosService verificará duplicados y guardará el usuario.
//6. La API responderá sin incluir la contraseña ni su hash.


import { Module } from '@nestjs/common';

// Importamos el módulo que administra los usuarios.
import { UsuariosModule } from '../usuarios/usuarios.module.js';

// Controlador que recibirá las peticiones de registro y login.
import { AuthController } from './auth.controller.js';

// Servicio que implementará la lógica de autenticación.
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';

// Módulo que administra la subida de imágenes.
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  // AuthModule necesita utilizar UsuariosService.
  // Por eso importa UsuariosModule, que ya lo exporta.
  imports: [UsuariosModule,

    // Permite utilizar CloudinaryService.
    CloudinaryModule,
    
    // Configuramos el servicio que genera los JWT.
    // La clave secreta se obtiene de las variables de entorno.
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '2s',
      },
    }),
    ],
  // Recibirá las solicitudes HTTP:
  // POST /auth/registro
  // POST /auth/login
  controllers: [AuthController],

  // Contendrá la lógica de registro y autenticación.
  providers: [AuthService],
})
export class AuthModule {}
