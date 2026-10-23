
import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema()
export class Usuario {
  @Prop({ required: true })
  nombre: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
