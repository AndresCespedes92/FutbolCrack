import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TIPOS_CONTENIDO, type TipoContenido } from '../contenido-externo.js';
import {
  MAXIMO_DESCRIPCION,
  MAXIMO_TITULO,
} from '../publicaciones.constants.js';

// Solo omisión significa «conservar». El servicio valida la combinación final y el tipo inmutable.
export class EditarPublicacionDto {
  @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAXIMO_TITULO)
  titulo?: string;

  @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAXIMO_DESCRIPCION)
  descripcion?: string;

  @ValidateIf((_o, v) => v !== undefined)
  @IsIn(TIPOS_CONTENIDO)
  tipoContenido?: TipoContenido;

  // La plataforma puede no venir en el PATCH: la relación se comprueba contra MongoDB.
  @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  urlExterna?: string;
}
