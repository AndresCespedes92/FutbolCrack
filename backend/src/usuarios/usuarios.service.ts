//Consulta y actualiza el registro de socios

import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { generarHashPassword } from '../common/password.js';
import { CrearUsuarioAdministrativoDto } from './dto/crear-usuario-administrativo.dto.js';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';

/**
 * Datos que recibe el servicio para crear un usuario.
 *
 * A diferencia del DTO de registro, estos datos
 * ya fueron preparados por el módulo de autenticación.
 *
 * Este contrato interno recibe passwordHash, no la contraseña original.
 * El alta administrativa usa otro DTO y convierte sus datos a este contrato.
 */
export interface CrearUsuarioData {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  passwordHash: string;
  fechaNacimiento: Date;
  descripcion?: string;
  imagenPerfil?: string;
}

/**
 * Servicio responsable de las operaciones
 * relacionadas con usuarios en MongoDB.
 *
 * @Injectable permite que NestJS inyecte
 * este servicio en otros componentes.
 */

//Este decorador le indica a NestJS que UsuariosService
// es una clase que puede administrarse mediante su sistema de inyección de dependencias
//constructor() Recibe las dependencias que necesita el servicio
//@InjectModel(Usuario.name) Solicita a NestJS el modelo de Mongoose llamado Usuario
// private Limita el acceso a la propiedad dentro de la clase
// readonly Impide reasignar la referencia del modelo
// Model<Usuario> Permite utilizar las operaciones de Mongoose sobre usuarios .

@Injectable()
export class UsuariosService {
  /**
   * Inyección de dependencias.
   *
   * @InjectModel obtiene el modelo Usuario
   * registrado en UsuariosModule.
   *
   * usuarioModel permite realizar consultas
   * y operaciones sobre MongoDB.
   */
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<Usuario>,
  ) {}

  /**
   * Busca un usuario mediante su correo.
   *
   * findOne devuelve el documento encontrado
   * o null si no existe.
   */
  async findByCorreo(correo: string): Promise<Usuario | null> {
    return this.usuarioModel
      .findOne({ correo: correo.trim().toLowerCase() })
      .exec();
  }

  /**
   * Busca un usuario por correo o nombre de usuario.
   *
   * Se utiliza exclusivamente para la autenticación.
   * Incluimos passwordHash porque necesitamos verificar
   * la contraseña ingresada mediante bcrypt.
   */
  async findByIdentificadorConPassword(
    identificador: string,
  ): Promise<UsuarioDocument | null> {
    const valor = identificador.trim();

    return this.usuarioModel
      .findOne({
        $or: [{ correo: valor.toLowerCase() }, { nombreUsuario: valor }],
      })
      .select('+passwordHash')
      .exec();
  }

  /**
   * Busca un usuario por nombre de usuario.
   */
  async findByNombreUsuario(nombreUsuario: string): Promise<Usuario | null> {
    return this.usuarioModel.findOne({ nombreUsuario }).exec();
  }

  /**
   * Crea un usuario con datos ya preparados. - Recibe datos preparados por AuthService
   *
   * El hash de la contraseña debe generarse
   * previamente en AuthService.
   *
   * El registro público no recibe un perfil configurable:
   * este método fuerza "usuario" y activo true en guardarUsuario.
   */
  async create(datos: CrearUsuarioData): Promise<UsuarioDocument> {
    // El registro público SIEMPRE fuerza este rol, aunque una llamada interna traiga otro campo.
    return this.guardarUsuario(datos, 'usuario');
  }

  async crearAdministrativo(datos: CrearUsuarioAdministrativoDto) {
    if (!['usuario', 'administrador'].includes(datos.perfil))
      throw new BadRequestException('El rol no es válido');
    const passwordHash = await generarHashPassword(
      datos.password,
      datos.repetirPassword,
    );
    const usuario = await this.guardarUsuario(
      {
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo,
        nombreUsuario: datos.nombreUsuario.trim(),
        passwordHash,
        fechaNacimiento: new Date(datos.fechaNacimiento),
        descripcion: datos.descripcion,
        imagenPerfil: '',
      },
      datos.perfil,
    );
    // Proyección positiva: guardar nunca implica devolver la contraseña ni su hash.
    return {
      mensaje: 'Usuario creado correctamente',
      usuario: {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        nombreUsuario: usuario.nombreUsuario,
        fechaNacimiento: usuario.fechaNacimiento,
        descripcion: usuario.descripcion,
        imagenPerfil: usuario.imagenPerfil,
        perfil: usuario.perfil,
        activo: usuario.activo !== false,
      },
    };
  }

  private async guardarUsuario(
    datos: CrearUsuarioData,
    perfil: 'usuario' | 'administrador',
  ): Promise<UsuarioDocument> {
    // Verificamos si el correo ya está registrado.
    const correoExistente = await this.findByCorreo(datos.correo);

    if (correoExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Verificamos si el nombre de usuario está ocupado.
    const usuarioExistente = await this.findByNombreUsuario(
      datos.nombreUsuario,
    );

    if (usuarioExistente) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Construimos el documento que se guardará.
    const nuevoUsuario = new this.usuarioModel({
      ...datos,
      correo: datos.correo.trim().toLowerCase(),
      perfil,
      activo: true,
    });

    // Guardamos el documento en MongoDB.
    try {
      return await nuevoUsuario.save();
    } catch (error: unknown) {
      // MongoDB puede detectar un duplicado incluso
      // si dos registros ocurren al mismo tiempo.
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('El correo o nombre de usuario ya existe');
      }

      throw error;
    }
  }

  /**
   * Busca un usuario mediante su ID de MongoDB.
   *
   * Se utilizará para obtener los datos del usuario
   * autenticado a partir del campo "sub" del JWT.
   *
   * No devuelve passwordHash porque ese campo
   * está excluido por defecto en el esquema.
   */
  async findById(id: string): Promise<UsuarioDocument | null> {
    // Verificamos que el ID tenga el formato correcto
    // antes de realizar la consulta a MongoDB.
    if (!this.usuarioModel.db.base.isValidObjectId(id)) {
      return null;
    }

    // Buscamos únicamente al usuario identificado.
    return this.usuarioModel.findById(id).select('-passwordHash').exec();
  }

  /**
   * Devuelve el padrón para el endpoint restringido a administradores.
   * La selección positiva permite solo los campos previstos: ni passwordHash
   * ni eventuales campos de credenciales nuevos se agregan a la respuesta.
   * Conservamos también select:false del esquema como defensa adicional.
   */
  async findAll() {
    const usuarios = await this.usuarioModel
      .find()
      .select(
        'nombre apellido correo nombreUsuario fechaNacimiento descripcion imagenPerfil perfil activo createdAt updatedAt',
      )
      .lean()
      .exec();
    return usuarios.map((usuario) => ({
      ...usuario,
      activo: usuario.activo !== false,
    }));
  }
  async deshabilitar(id: string, actorId: string) {
    const identidad = this.validarId(id);
    if (identidad.toString() === actorId)
      throw new ConflictException('No podés deshabilitar tu propia cuenta');
    const usuario = await this.usuarioModel
      .findById(identidad)
      .select('_id perfil activo')
      .lean()
      .exec();
    if (!usuario) throw new NotFoundException('El usuario no existe');
    // Política conservadora: ningún administrador se deshabilita por este endpoint.
    // Protege al último incluso ante bajas simultáneas; no requiere conteos/transacciones frágiles.
    if (usuario.perfil === 'administrador')
      throw new ConflictException(
        'Las cuentas administradoras están protegidas contra la deshabilitación',
      );
    if (usuario.activo === false)
      throw new ConflictException('El usuario ya está deshabilitado');
    const resultado = await this.usuarioModel
      .updateOne(
        {
          _id: identidad,
          perfil: { $ne: 'administrador' },
          activo: { $ne: false },
        },
        { $set: { activo: false } },
      )
      .exec();
    if (!resultado.matchedCount)
      throw new ConflictException(
        'El estado del usuario cambió. Actualizá el listado',
      );
    return { mensaje: 'Usuario deshabilitado correctamente' };
  }
  async habilitar(id: string) {
    const identidad = this.validarId(id);
    const usuario = await this.usuarioModel
      .findById(identidad)
      .select('_id activo')
      .lean()
      .exec();
    if (!usuario) throw new NotFoundException('El usuario no existe');
    if (usuario.activo !== false)
      throw new ConflictException('El usuario ya está habilitado');
    const resultado = await this.usuarioModel
      .updateOne({ _id: identidad, activo: false }, { $set: { activo: true } })
      .exec();
    if (!resultado.matchedCount)
      throw new ConflictException(
        'El estado del usuario cambió. Actualizá el listado',
      );
    return { mensaje: 'Usuario habilitado correctamente' };
  }
  private validarId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('El identificador de usuario no es válido');
    return new Types.ObjectId(id);
  }
}
