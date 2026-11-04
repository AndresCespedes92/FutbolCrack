import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  MAXIMO_DESCRIPCION,
  MAXIMO_TITULO,
} from '../publicaciones.constants.js';

export type PublicacionDocument = HydratedDocument<Publicacion>;

// Como un parte del club: conserva autor y fechas aunque después se retire de la cartelera.
/**
 * Modelo persistente de jugadas: referencias de autor/likes, textos, URL multimedia y estado.
 * DTO gobierna la entrada HTTP; @Prop gobierna persistencia/defaults. Referencias no equivalen
 * a claves foráneas SQL automáticas: los servicios deben exigir recursos existentes.
 * activo=false retira sin borrar. Los contadores de likes/comentarios se calculan al consultar.
 * El enum conserva video para lectura histórica, pero el formulario/controller actual sube
 * solo imágenes JPEG/PNG/WebP; no se debe demostrar una subida de video inexistente.
 */
@Schema({ timestamps: true, collection: 'publicaciones' })
export class Publicacion {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: MAXIMO_TITULO })
  titulo: string;

  @Prop({ required: true, trim: true, maxlength: MAXIMO_DESCRIPCION })
  descripcion: string;

  // Alias de transición: no se elimina el campo de documentos antiguos ni de la respuesta.
  @Prop({ type: String, trim: true, maxlength: MAXIMO_DESCRIPCION })
  contenido?: string;

  @Prop({ default: '' })
  multimediaUrl: string;

  // Se conserva video para leer documentos previos; esta tarea solo permite subir imágenes.
  @Prop({
    type: String,
    enum: ['ninguno', 'imagen', 'video'],
    default: 'ninguno',
  })
  tipoMultimedia: string;

  // Un voto por usuario y publicación. No se usa índice unique en el array:
  // la misma persona puede votar publicaciones distintas. La escritura usa $addToSet atómico.
  @Prop({ type: [Types.ObjectId], ref: 'Usuario', default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: true })
  activo: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
