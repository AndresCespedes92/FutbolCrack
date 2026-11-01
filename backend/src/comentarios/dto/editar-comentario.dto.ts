import { CrearComentarioDto } from './crear-comentario.dto.js';

// PUT reemplaza el texto completo: hereda las mismas validaciones obligatorias del alta.
// No usamos PartialType porque permitiría omitir el único campo que debe editarse.
export class EditarComentarioDto extends CrearComentarioDto {}
