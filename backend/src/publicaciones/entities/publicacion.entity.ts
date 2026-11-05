import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TIPOS_CONTENIDO, type TipoContenido } from '../contenido-externo.js';
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
 * activo=false retira sin borrar. cantidadLikes se mantiene junto al voto en una transacción.
 * El enum conserva video para lectura histórica, pero el formulario/controller actual sube
 * solo imágenes JPEG/PNG/WebP; no se debe demostrar una subida de video inexistente.
 */
@Schema({ timestamps: true, collection: 'publicaciones' })
export class Publicacion {
  @Prop({ type: String, enum: TIPOS_CONTENIDO, default: 'propia' })
  tipoContenido: TipoContenido;

  @Prop({ type: String, trim: true, maxlength: 2048 })
  urlExterna?: string;

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

  // Solo compatibilidad de lectura/migración: ningún voto nuevo se agrega a este array.
  @Prop({
    type: [Types.ObjectId],
    ref: 'Usuario',
    default: undefined,
    select: false,
  })
  likes: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0 })
  cantidadLikes: number;

  // Los documentos históricos se distinguen en la agregación (que no aplica defaults).
  @Prop({ type: Boolean, default: true })
  likesMigrados: boolean;

  @Prop({ default: true })
  activo: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
