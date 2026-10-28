//	Ejecuta las reglas de inscripción


import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';

@Injectable()
export class AuthService {
  constructor(
    // NestJS inyecta el servicio del módulo Usuarios.
    private readonly usuariosService: UsuariosService,
  ) {}

  // Registra un nuevo usuario en FutbolCrack.
  async registrar(datos: CreateUsuarioDto) {
    // 1. Verificamos que ambas contraseñas coincidan.
    if (datos.password !== datos.repetirPassword) {
      throw new BadRequestException(
        'Las contraseñas no coinciden',
      );
    }

    // 2. Generamos el hash. Nunca guardamos
    // la contraseña original en MongoDB.
    const passwordHash = await bcrypt.hash(datos.password, 12);

    // 3. Delegamos el guardado a UsuariosService.
    // El perfil siempre será "usuario".
    const usuario = await this.usuariosService.create({
      nombre: datos.nombre,
      apellido: datos.apellido,
      correo: datos.correo,
      nombreUsuario: datos.nombreUsuario,
      passwordHash,
      fechaNacimiento: new Date(datos.fechaNacimiento),
      descripcion: datos.descripcion,
    });

    // 4. Construimos una respuesta segura.
    // No devolvemos passwordHash.
    return {
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        id: usuario._id.toString(),
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        nombreUsuario: usuario.nombreUsuario,
        fechaNacimiento: usuario.fechaNacimiento,
        descripcion: usuario.descripcion,
        imagenPerfil: usuario.imagenPerfil,
        perfil: usuario.perfil,
      },
    };
  }
}

