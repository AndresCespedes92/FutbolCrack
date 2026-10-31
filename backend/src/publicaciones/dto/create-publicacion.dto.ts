import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  MAXIMO_DESCRIPCION,
  MAXIMO_TITULO,
} from '../publicaciones.constants.js';

// Las publicaciones nuevas requieren ambos textos; contenido se conserva solo como alias de lectura.
export class CreatePublicacionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(MAXIMO_TITULO, {
    message: 'El título admite hasta 120 caracteres',
  })
  titulo: string;

  // No convertimos números/objetos: se rechazan antes de llamar al servicio.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MaxLength(MAXIMO_DESCRIPCION, {
    message: 'La descripción admite hasta 2000 caracteres',
  })
  descripcion: string;
}
