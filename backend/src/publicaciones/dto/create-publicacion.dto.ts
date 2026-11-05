import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  TIPOS_CONTENIDO,
  type TipoContenido,
  UrlSegunContenido,
} from '../contenido-externo.js';
import {
  MAXIMO_DESCRIPCION,
  MAXIMO_TITULO,
} from '../publicaciones.constants.js';

// Las publicaciones nuevas requieren ambos textos; contenido se conserva solo como alias de lectura.
/**
 * Contrato de alta con título y descripción obligatorios: trim de strings, tipo correcto,
 * texto no vacío y límites 120/2000. El archivo se valida por otro pipe del controller.
 * No admite autor/likes/activo desde el body: ValidationPipe rechaza propiedades no previstas.
 * Un DTO valida forma y contenido; identidad, existencia y permisos requieren guard/servicio.
 */
export class CreatePublicacionDto {
  // Omitir el tipo conserva el contrato de clientes anteriores; null no es omisión.
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(TIPOS_CONTENIDO)
  tipoContenido?: TipoContenido;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @UrlSegunContenido()
  urlExterna?: string;

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
