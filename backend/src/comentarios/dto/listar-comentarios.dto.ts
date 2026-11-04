import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { enteroDeQuery } from '../../common/validation/entero-query.js';
import {
  LIMITE_COMENTARIOS_PREDETERMINADO,
  MAXIMO_LIMITE_COMENTARIOS,
} from '../comentarios.constants.js';

/**
 * Query string llega como texto: enteroDeQuery admite enteros decimales y las validaciones
 * ponen límites a offset/limit antes de consultar MongoDB. El default es tres, máximo técnico 100.
 * Angular siempre pide tres; el total no se calcula con la longitud de la página.
 */
export class ListarComentariosDto {
  @Transform(({ value }) => enteroDeQuery(value))
  @IsInt({ message: 'offset debe ser un entero decimal' })
  @Min(0, { message: 'offset no puede ser negativo' })
  @Max(Number.MAX_SAFE_INTEGER)
  offset: number = 0;

  @Transform(({ value }) => enteroDeQuery(value))
  @IsInt({ message: 'limit debe ser un entero decimal' })
  @Min(1, { message: 'limit debe ser mayor que cero' })
  @Max(MAXIMO_LIMITE_COMENTARIOS, {
    message: 'limit admite como máximo 100 comentarios',
  })
  limit: number = LIMITE_COMENTARIOS_PREDETERMINADO;
}
