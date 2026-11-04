import { CrearComentarioDto } from './crear-comentario.dto.js';

// PUT reemplaza el texto completo: hereda las mismas validaciones obligatorias del alta.
// No usamos PartialType porque permitiría omitir el único campo que debe editarse.
/**
 * PUT reemplaza el texto completo, por eso hereda las mismas reglas obligatorias de creación.
 * No se usa PartialType: omitir texto no es una edición válida. El DTO no concede autoría;
 * esa comprobación requiere leer el comentario y la identidad autenticada en el servicio.
 */
export class EditarComentarioDto extends CrearComentarioDto {}
