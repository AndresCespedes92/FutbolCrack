import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MAXIMO_TEXTO_COMENTARIO } from '../comentarios.constants.js';

export type ComentarioDocument = HydratedDocument<Comentario>;

// Como una nota sobre la jugada del club: se referencia la publicación y su autor,
// sin copiar nombre, foto ni datos privados del usuario dentro de cada comentario.
/**
 * Persistencia: cada nota referencia publicación y autor por ObjectId inmutable.
 * ref permite populate; no significa una clave foránea SQL que garantice existencia automáticamente,
 * por eso el servicio comprueba las referencias antes de guardar. timestamps mantiene las fechas.
 * modificado registra la edición explícita; no se deduce comparando fechas.
 * El índice compuesto acompaña filtro por publicación y orden reciente. No existe campo de baja
 * ni operación DELETE para comentarios en esta implementación.
 */
@Schema({ timestamps: true, collection: 'comentarios' })
export class Comentario {
  @Prop({
    type: Types.ObjectId,
    ref: 'Publicacion',
    required: true,
    immutable: true,
  })
  publicacionId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Usuario',
    required: true,
    immutable: true,
  })
  autorId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: MAXIMO_TEXTO_COMENTARIO,
  })
  texto: string;

  // No inferimos una edición comparando fechas: solo un PUT de texto marca este valor.
  @Prop({ type: Boolean, default: false })
  modificado: boolean;

  // Las agrega timestamps; se declaran para tipar las respuestas sin asignarlas desde el cliente.
  createdAt: Date;
  updatedAt: Date;
}
export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
// Filtro por jugada + orden estable. MongoDB debe crear/verificar este índice en el entorno real.
ComentarioSchema.index({ publicacionId: 1, createdAt: -1, _id: -1 });
