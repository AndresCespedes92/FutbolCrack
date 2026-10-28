//Define qué datos tiene la ficha de cada socio

//Define cómo se guarda un usuario en MongoDB

//Schema vs. DTO
// Por ejemplo, para registrar a un usuario llamado Juan:
// DTO — Validación de entrada
// ¿El nombre es texto? ¿El correo es válido? ¿La contraseña cumple los requisitos?
// Schema — Estructura de MongoDB
// ¿Qué campos guardamos? ¿Cuáles son obligatorios? ¿Qué valores tienen por defecto?

//@Schema(): indica que la clase representa un esquema de MongoDB.
// @Prop(): define una propiedad que Mongoose almacenará.
// required: true: establece que el campo es obligatorio.
// SchemaFactory.createForClass(Usuario): genera el esquema de Mongoose a partir de la clase.



import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Representa un documento de usuario guardado en MongoDB.
export type UsuarioDocument = HydratedDocument<Usuario>;

// Define la estructura de la colección de usuarios.
// timestamps agrega automáticamente createdAt y updatedAt.
@Schema({ timestamps: true })
export class Usuario {

  @Prop({ required: true, trim: true })
  nombre: string;
  // trim: true Elimina espacios al principio y al final
  @Prop({ required: true, trim: true })
  apellido: string;

  // unique crea un índice de unicidad en MongoDB.
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo: string;

  @Prop({ required: true, unique: true, trim: true })
  nombreUsuario: string;

  // Guardamos el hash, nunca la contraseña original.
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, type: Date })
  fechaNacimiento: Date;

  @Prop({ default: '', maxlength: 300 })
  descripcion: string;

  // Cloudinary devolverá esta URL al subir la imagen.
  @Prop({ default: '' })
  imagenPerfil: string;

  // El registro público asignará siempre el perfil usuario.
  @Prop({
    type: String,
    enum: ['usuario', 'administrador'],
    default: 'usuario',
  })
  perfil: string;
}

// Convierte la clase Usuario en un esquema de Mongoose.
export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

