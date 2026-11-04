// Un único plazo para firma JWT y cookie. El aviso Angular se calcula desde expiraEn.
//Está expresada en segundos. Por ejemplo, 30 * 60 serían 30 minutos.
/**
 * Fuente única del plazo al firmar sesiones del backend: aquí el valor actual es 10 * 60.
 * Está en segundos, mientras los timers/cookies del cliente trabajan con milisegundos.
 * Cambiar esta constante solo afectaría JWT nuevos; uno ya firmado conserva su exp original.
 * Para esta guía se documenta el valor existente, sin cambiar la duración ni el umbral del aviso.
 */
export const DURACION_SESION_SEGUNDOS = 10 * 60;
export const SOLO_COOKIE_SESION = 'soloCookieSesion';
