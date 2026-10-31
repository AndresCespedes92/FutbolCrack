//Consulta y actualiza el registro de socios

import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.entity.js';

/**
 * Datos que recibe el servicio para crear un usuario.
 *
 * A diferencia del DTO de registro, estos datos
 * ya fueron preparados por el módulo de autenticación.
 *
 * La contraseña original NO llega a este servicio
 * Recibe datos preparados por AuthService - Contiene passwordHash - El servicio fija perfil usuario
 * .
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
      $or: [
        { correo: valor.toLowerCase() },
        { nombreUsuario: valor },
      ],
    })
    .select('+passwordHash')
    .exec();
}


  /**
   * Busca un usuario por nombre de usuario.
   */
  async findByNombreUsuario(
    nombreUsuario: string,
  ): Promise<Usuario | null> {
    return this.usuarioModel
      .findOne({ nombreUsuario })
      .exec();
  }

  /**
   * Crea un usuario con datos ya preparados. - Recibe datos preparados por AuthService
   *
   * El hash de la contraseña debe generarse
   * previamente en AuthService.
   *
   * El perfil no se recibe como parámetro:
   * MongoDB asigna "usuario" por defecto.
   */
  async create(datos: CrearUsuarioData): Promise<UsuarioDocument> {

    // Verificamos si el correo ya está registrado.
    const correoExistente = await this.findByCorreo(
      datos.correo,
    );

    if (correoExistente) {
      throw new ConflictException(
        'El correo ya está registrado',
      );
    }

    // Verificamos si el nombre de usuario está ocupado.
    const usuarioExistente =
      await this.findByNombreUsuario(datos.nombreUsuario);

    if (usuarioExistente) {
      throw new ConflictException(
        'El nombre de usuario ya está en uso',
      );
    }

    // Construimos el documento que se guardará.
    const nuevoUsuario = new this.usuarioModel({
      ...datos,
      correo: datos.correo.trim().toLowerCase(),
      perfil: 'usuario',
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
        throw new ConflictException(
          'El correo o nombre de usuario ya existe',
        );
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
  return this.usuarioModel
    .findById(id)
    .select('-passwordHash')
    .exec();
}


  /**
   * Devuelve el padrón para el endpoint restringido a administradores.
   * La selección positiva permite solo los campos previstos: ni passwordHash
   * ni eventuales campos de credenciales nuevos se agregan a la respuesta.
   * Conservamos también select:false del esquema como defensa adicional.
   */
  async findAll(): Promise<Usuario[]> {
    return this.usuarioModel
      .find()
      .select('nombre apellido correo nombreUsuario fechaNacimiento descripcion imagenPerfil perfil createdAt updatedAt')
      .exec();
  }
}

