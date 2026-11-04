import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import {
  LIMITE_LISTADO_PREDETERMINADO,
  MAXIMO_LIMITE_LISTADO,
} from '../publicaciones.constants.js';

import { enteroDeQuery } from '../../common/validation/entero-query.js';

/**
 * Valida parámetros del listado antes del pipeline: orden fecha/likes, usuarioId MongoDB,
 * offset entero no negativo y limit entre 1 y 100 (default diez).
 * No obliga a cada consumidor a pedir diez: Mi perfil usa tres. Ordenar/filtrar sucede antes
 * del límite; recortar el array descargado en Angular no sería paginación real del backend.
 */
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
