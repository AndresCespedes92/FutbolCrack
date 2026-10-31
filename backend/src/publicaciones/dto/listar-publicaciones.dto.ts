import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import {
  LIMITE_LISTADO_PREDETERMINADO,
  MAXIMO_LIMITE_LISTADO,
} from '../publicaciones.constants.js';

// Solo convertimos enteros decimales escritos correctamente: vacío, fracciones y arrays se rechazan.
function enteroDeQuery(valor: unknown): unknown {
  return typeof valor === 'string' && /^(0|[1-9]\d*)$/.test(valor)
    ? Number(valor)
    : valor;
}

export class ListarPublicacionesDto {
  @IsIn(['fecha', 'likes'], { message: 'El orden debe ser fecha o likes' })
  orden: 'fecha' | 'likes' = 'fecha';

  @IsOptional()
  @IsMongoId({ message: 'usuarioId debe ser un identificador válido' })
  usuarioId?: string;

  @Transform(({ value }) => enteroDeQuery(value))
  @IsInt({ message: 'offset debe ser un entero decimal' })
  @Min(0, { message: 'offset no puede ser negativo' })
  @Max(Number.MAX_SAFE_INTEGER)
  offset: number = 0;

  @Transform(({ value }) => enteroDeQuery(value))
  @IsInt({ message: 'limit debe ser un entero decimal' })
  @Min(1, { message: 'limit debe ser mayor que cero' })
  @Max(MAXIMO_LIMITE_LISTADO, {
    message: 'limit admite como máximo 100 publicaciones',
  })
  limit: number = LIMITE_LISTADO_PREDETERMINADO;
}
