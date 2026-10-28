
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

// Tipo de documento utilizado por Mongoose.
export type PublicacionDocument = HydratedDocument<Publicacion>;

/**
 * PUBLICACIÓN
 *
 * Representa una publicación realizada
 * por un usuario de FutbolCrack.
 */
@Schema({
  timestamps: true,
  collection: 'publicaciones',
})
export class Publicacion {

  /**
   * Usuario que creó la publicación.
   *
   * Guardamos una referencia al documento
   * correspondiente en la colección usuarios.
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'Usuario',
    required: true,
  })
  autorId: Types.ObjectId;

  /**
   * Texto principal de la publicación.
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  })
  contenido: string;

  /**
   * URL opcional de una imagen o video.
   *
   * Más adelante podremos almacenar
   * archivos multimedia en Cloudinary.
   */
  @Prop({
    type: String,
    default: '',
  })
  multimediaUrl: string;

  /**
   * Tipo de contenido multimedia.
   */
  @Prop({
    type: String,
    enum: ['ninguno', 'imagen', 'video'],
    default: 'ninguno',
  })
  tipoMultimedia: string;
}

// Generamos el esquema que utilizará MongoDB.
export const PublicacionSchema =
  SchemaFactory.createForClass(Publicacion);
