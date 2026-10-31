// Límites compartidos por DTO, schema y servicio. Modificarlos exige ajustar también Angular.
export const MAXIMO_TITULO = 120;
export const MAXIMO_DESCRIPCION = 2000;
export const MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

// El feed usa 10 por defecto; el límite acotado permite otros consumidores como el perfil (3).
export const LIMITE_LISTADO_PREDETERMINADO = 10;
export const MAXIMO_LIMITE_LISTADO = 100;
