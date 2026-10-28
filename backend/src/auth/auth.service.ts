//	Ejecuta las reglas de inscripción
// Valida las contraseñas y genera el hash.



import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

// Representa el contenido de la imagen recibida.
// Es compatible con el archivo en memoria de Multer.
interface ArchivoImagen {
  buffer: Buffer;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,

    // NestJS inyecta el servicio de Cloudinary.
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * REGISTRO DE USUARIOS
   *
   * Recibe los datos del formulario y una foto opcional.
   * La contraseña se almacena como hash.
   * La imagen se almacena en Cloudinary.
   */
  async registrar(
    datos: CreateUsuarioDto,
    imagen?: ArchivoImagen,
  ) {
    // 1. Validamos que ambas contraseñas coincidan.
    if (datos.password !== datos.repetirPassword) {
      throw new BadRequestException(
        'Las contraseñas no coinciden',
      );
    }

    // 2. Generamos el hash de la contraseña.
    const passwordHash = await bcrypt.hash(
      datos.password,
      12,
    );

    // 3. Si recibimos una imagen, la subimos a Cloudinary.
    // Si no hay imagen, guardamos una cadena vacía.
    let imagenPerfil = '';

    if (imagen) {
      imagenPerfil =
        await this.cloudinaryService.subirImagen(imagen);
    }

    // 4. Guardamos el usuario en MongoDB.
    const usuario = await this.usuariosService.create({
      nombre: datos.nombre,
      apellido: datos.apellido,
      correo: datos.correo,
      nombreUsuario: datos.nombreUsuario,
      passwordHash,
      fechaNacimiento: new Date(datos.fechaNacimiento),
      descripcion: datos.descripcion,
      imagenPerfil,
    });

    // 5. Respondemos sin incluir passwordHash.
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

  /**
   * LOGIN DE USUARIOS
   *
   * Busca al usuario, verifica su contraseña
   * y devuelve un JWT.
   */
  async login(identificador: string, password: string) {
    const usuario =
      await this.usuariosService.findByIdentificadorConPassword(
        identificador,
      );

    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales incorrectas',
      );
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException(
        'Credenciales incorrectas',
      );
    }

    const token = await this.jwtService.signAsync({
      sub: usuario._id.toString(),
      perfil: usuario.perfil,
    });

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

  
/**
 * OBTENER MI PERFIL
 *
 * Recupera los datos del usuario autenticado.
 *
 * El ID proviene del campo "sub" del JWT,
 * previamente validado por AuthGuard.
 */
async obtenerMiPerfil(usuarioId: string) {

  // Consultamos MongoDB mediante UsuariosService.
  const usuario = await this.usuariosService.findById(
    usuarioId,
  );

  // Si el usuario fue eliminado o no existe,
  // rechazamos la consulta.
  if (!usuario) {
    throw new NotFoundException(
      'El usuario autenticado no existe',
    );
  }

  // Devolvemos únicamente los datos permitidos.
  // Nunca incluimos passwordHash.
  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    correo: usuario.correo,
    nombreUsuario: usuario.nombreUsuario,
    fechaNacimiento: usuario.fechaNacimiento,
    descripcion: usuario.descripcion,
    imagenPerfil: usuario.imagenPerfil,
    perfil: usuario.perfil,
  };
}

}
