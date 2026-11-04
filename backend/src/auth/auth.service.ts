//	Ejecuta las reglas de inscripción
// Valida las contraseñas y genera el hash.

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './guards/auth.guard.js';
import type { UsuarioDocument } from '../usuarios/entities/usuario.entity.js';
import { DURACION_SESION_SEGUNDOS } from './sesion.constants.js';
import * as bcrypt from 'bcrypt';
import { generarHashPassword } from '../common/password.js';

import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

// Representa el contenido de la imagen recibida.
// Es compatible con el archivo en memoria de Multer.
interface ArchivoImagen {
  buffer: Buffer;
}

/**
 * Reglas de autenticación del servidor: valida credenciales con bcrypt, consulta la ficha
 * MongoDB mediante UsuariosService y emite una sesión firmada con JwtService.
 * El controller administra HTTP/cookie; este servicio devuelve el token solo como resultado
 * interno. datosPublicos elimina credenciales de las respuestas que llegarán al cliente.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,

    // NestJS inyecta el servicio de Cloudinary.
    private readonly cloudinaryService: CloudinaryService,
  ) {}

    /**
   * Registro: valida coincidencia/límite de clave con generarHashPassword y recibe un hash bcrypt,
   * sube foto opcional y guarda la ficha mediante UsuariosService.create (rol usuario forzado).
   * No firma una sesión de login ni devuelve la contraseña. El hash permite verificar una clave
   * posterior sin poder recuperar la original; la foto queda en Cloudinary y su URL en MongoDB.
   */
  async registrar(datos: CreateUsuarioDto, imagen?: ArchivoImagen) {
    const passwordHash = await generarHashPassword(
      datos.password,
      datos.repetirPassword,
    );

    // 3. Si recibimos una imagen, la subimos a Cloudinary.
    // Si no hay imagen, guardamos una cadena vacía.
    let imagenPerfil = '';

    if (imagen) {
      imagenPerfil = await this.cloudinaryService.subirImagen(imagen);
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
      usuario: this.datosPublicos(usuario),
    };
  }

    /**
   * Entrada: identificador (correo o usuario) y contraseña recibidos por LoginDto.
   * Se incluye passwordHash solo en esta consulta interna y bcrypt.compare comprueba la clave;
   * no se descifra el hash. Inexistencia/clave incorrecta producen 401 con mensaje equivalente.
   * Una ficha activo=false tampoco inicia sesión. Solo después se firma el JWT y se construyen
   * los datos públicos: autenticarse prueba identidad, no concede por sí solo rol administrador.
   */
  async login(identificador: string, password: string) {
    const usuario =
      await this.usuariosService.findByIdentificadorConPassword(identificador);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (usuario.activo === false)
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    return this.emitirSesion(usuario);
  }

    /**
   * El ID viene de request.user.sub verificado por el guard, no de un usuario elegido en el body.
   * Se vuelve a leer la ficha y se rechaza con 401 si desapareció o se deshabilitó.
   * Devuelve una proyección pública; el hash no forma parte del perfil enviado a Angular.
   */
  async obtenerMiPerfil(usuarioId: string) {
    // Consultamos MongoDB mediante UsuariosService.
    const usuario = await this.usuariosService.findById(usuarioId);

    // Si el usuario fue eliminado o no existe,
    // rechazamos la consulta.
    if (!usuario || usuario.activo === false) {
      throw new UnauthorizedException(
        'El usuario autenticado no está habilitado',
      );
    }

    return this.datosPublicos(usuario);
  }

  /**
   * POST autorizar confirma usuario y vigencia del JWT existente. Conserva iat/exp originales;
   * la respuesta permite recuperar estado al recargar sin extender silenciosamente la sesión.
   * La lectura de MongoDB impide aceptar una cuenta deshabilitada aunque la firma siga siendo válida.
   */
  async autorizar(payload: JwtPayload) {
    const usuario = await this.exigirUsuarioDeSesion(payload);
    return { usuario: this.datosPublicos(usuario), ...this.metadatos(payload) };
  }
  /**
   * Emite un JWT nuevo únicamente si el anterior sigue vigente y su usuario está habilitado.
   * Se comprueba exp antes y después de operaciones asíncronas: una consulta lenta no permite
   * renovar un token vencido durante la espera. No hay refresh token independiente.
   * Un 401 obliga a iniciar sesión; el controller enviará la cookie nueva solo en caso de éxito.
   */
  async refrescar(payload: JwtPayload) {
    const usuario = await this.exigirUsuarioDeSesion(payload);
    // Consultar MongoDB pudo tardar: un token vencido durante esa espera tampoco se renueva.
    this.exigirVigencia(payload);
    const resultado = await this.emitirSesion(usuario);
    this.exigirVigencia(payload);
    return resultado;
  }
  private exigirVigencia(payload: JwtPayload): void {
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now())
      throw new UnauthorizedException('La sesión ha vencido');
  }
  private async exigirUsuarioDeSesion(
    payload: JwtPayload,
  ): Promise<UsuarioDocument> {
    this.exigirVigencia(payload);
    const usuario = await this.usuariosService.findById(payload.sub);
    if (!usuario || usuario.activo === false)
      throw new UnauthorizedException('El usuario de la sesión no existe');
    // Solo false bloquea: los registros antiguos sin activo conservan su acceso.
    this.exigirVigencia(payload);
    return usuario;
  }
  /**
   * JWT es una credencial firmada para presentar identidad en pedidos posteriores.
   * Incluimos sub (ID MongoDB) y perfil; JwtService agrega iat/exp y firma con JWT_SECRET,
   * configurada en SeguridadModule. No incluimos contraseña/hash: el contenido está codificado,
   * no cifrado, y puede leerse si alguien obtiene el token. La firma detecta alteraciones.
   * signAsync usa DURACION_SESION_SEGUNDOS; el guard verificará firma, exp y ficha actual.
   * decode se usa aquí SOLO sobre el token que acabamos de firmar para obtener sus fechas;
   * no reemplaza verifyAsync para credenciales que llegan del exterior.
   */
  private async emitirSesion(usuario: UsuarioDocument) {
    const token = await this.jwtService.signAsync(
      { sub: usuario._id.toString(), perfil: usuario.perfil },
      { expiresIn: DURACION_SESION_SEGUNDOS },
    );
    const payload = this.jwtService.decode<JwtPayload>(token);
    return {
      access_token: token,
      usuario: this.datosPublicos(usuario),
      ...this.metadatos(payload),
    };
  }
  private metadatos(payload: JwtPayload) {
    return {
      emitidaEn: new Date(payload.iat! * 1000).toISOString(),
      expiraEn: new Date(payload.exp! * 1000).toISOString(),
      horaServidor: new Date().toISOString(),
    };
  }
  /**
   * Proyección positiva de datos permitidos: elegir campos explícitos evita enviar passwordHash
   * o futuros campos internos al devolver perfil, login o registro.
   * No modifica el documento guardado: prepara el contrato que el controller expone a Angular.
   */
  private datosPublicos(usuario: UsuarioDocument) {
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
      activo: usuario.activo !== false,
    };
  }
}
