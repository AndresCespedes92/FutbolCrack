
import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Publicacion,
  PublicacionDocument,
} from './entities/publicacion.entity.js';

/**
 * SERVICIO DE PUBLICACIONES
 *
 * Contiene la lógica de negocio para crear
 * y consultar publicaciones en MongoDB.
 */
@Injectable()
export class PublicacionesService {

  constructor(
    // NestJS inyecta el modelo Mongoose de Publicacion.
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<Publicacion>,
  ) {}

  /**
   * CREAR PUBLICACIÓN
   *
   * El ID del autor proviene del JWT autenticado.
   * Por ahora permitimos publicaciones de texto.
   */
  async crear(
    autorId: string,
    contenido: string,
  ): Promise<PublicacionDocument> {

    // Comprobamos que el texto sea válido.
    const texto = contenido?.trim();

    if (!texto || texto.length > 2000) {
      throw new BadRequestException(
        'La publicación debe contener entre 1 y 2000 caracteres',
      );
    }

    // Convertimos el ID del usuario a ObjectId.
    if (!Types.ObjectId.isValid(autorId)) {
      throw new BadRequestException(
        'El identificador del autor no es válido',
      );
    }

    // Creamos el documento en MongoDB.
    const nuevaPublicacion = new this.publicacionModel({
      autorId: new Types.ObjectId(autorId),
      contenido: texto,
      multimediaUrl: '',
      tipoMultimedia: 'ninguno',
    });

    return nuevaPublicacion.save();
  }

  /**
   * LISTAR PUBLICACIONES
   *
   * Devuelve las publicaciones más recientes primero.
   * Incluye solamente los datos públicos del autor.
   */
  async listar() {
    return this.publicacionModel
      .find()
      .populate(
        'autorId',
        'nombre apellido nombreUsuario imagenPerfil',
      )
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
