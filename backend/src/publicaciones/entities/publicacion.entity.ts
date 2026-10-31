import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  MAXIMO_DESCRIPCION,
  MAXIMO_TITULO,
} from '../publicaciones.constants.js';

export type PublicacionDocument = HydratedDocument<Publicacion>;

// Como un parte del club: conserva autor y fechas aunque después se retire de la cartelera.
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

  @Prop({ default: true })
  activo: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
