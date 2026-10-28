//	Ejecuta las reglas de inscripción


import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,

    // NestJS inyecta el servicio para generar JWT.
    private readonly jwtService: JwtService,
  ) {}

  // REGISTRO: mantenemos la funcionalidad existente.
  async registrar(datos: CreateUsuarioDto) {
    if (datos.password !== datos.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const passwordHash = await bcrypt.hash(datos.password, 12);

    const usuario = await this.usuariosService.create({
      nombre: datos.nombre,
      apellido: datos.apellido,
      correo: datos.correo,
      nombreUsuario: datos.nombreUsuario,
      passwordHash,
      fechaNacimiento: new Date(datos.fechaNacimiento),
      descripcion: datos.descripcion,
    });

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

  // LOGIN: verifica credenciales y genera un JWT.
  async login(identificador: string, password: string) {
    // 1. Buscamos por correo o nombre de usuario.
    const usuario =
      await this.usuariosService.findByIdentificadorConPassword(
        identificador,
      );

    // 2. Si no existe, rechazamos el acceso.
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Comparamos la contraseña con el hash almacenado.
    const passwordValida = await bcrypt.compare(
      password,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 4. Generamos el token con el identificador del usuario.
    const token = await this.jwtService.signAsync({
      sub: usuario._id.toString(),
      perfil: usuario.perfil,
    });

    // 5. Devolvemos el token y los datos públicos del usuario.
    return {
      access_token: token,
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
