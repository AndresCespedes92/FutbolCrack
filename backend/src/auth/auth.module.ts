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

@Module({
  // AuthModule necesita utilizar UsuariosService.
  // Por eso importa UsuariosModule, que ya lo exporta.
  imports: [UsuariosModule],

  // Recibirá las solicitudes HTTP:
  // POST /auth/registro
  // POST /auth/login
  controllers: [AuthController],

  // Contendrá la lógica de registro y autenticación.
  providers: [AuthService],
})
export class AuthModule {}
