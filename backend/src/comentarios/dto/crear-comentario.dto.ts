import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAXIMO_TEXTO_COMENTARIO } from '../comentarios.constants.js';

// Solo texto editable: autor, publicación, fechas y modificado se deciden en el servidor.
// No convertir números a string: deben fallar como tipo incorrecto.
/**
 * Contrato de entrada: Transform recorta espacios de strings sin convertir números/objetos
 * en texto; IsString/IsNotEmpty/MaxLength impiden notas vacías o mayores a 1000.
 * ValidationPipe global rechaza propiedades extra: no se puede elegir autor, fechas o Editado.
 * El formulario Angular ayuda antes del envío, pero solo Nest decide qué datos son admisibles.
 */
export class CrearComentarioDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El texto del comentario debe ser una cadena' })
  @IsNotEmpty({ message: 'El texto del comentario es obligatorio' })
  @MaxLength(MAXIMO_TEXTO_COMENTARIO, {
    message: 'El comentario admite hasta 1000 caracteres',
  })
  texto: string;
}
