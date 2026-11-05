import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongoSchema, Types } from 'mongoose';

/** Cada voto es un documento pequeño: la publicación ya no crece por cada hincha.
 * El índice único compuesto es la protección real ante dos votos simultáneos.
 */
@Schema({ collection: 'me_gusta', timestamps: true })
export class MeGusta {
  // Schema.Types declara el tipo persistente; Types.ObjectId representa el valor en TypeScript.
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Publicacion', required: true })
  publicacionId: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Usuario', required: true })
  usuarioId: Types.ObjectId;
}
export const MeGustaSchema = SchemaFactory.createForClass(MeGusta);
MeGustaSchema.index(
  { publicacionId: 1, usuarioId: 1 },
  { unique: true, name: 'voto_unico' },
);
