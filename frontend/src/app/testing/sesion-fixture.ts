import { DatosSesion, Usuario } from '../services/auth';
import { jugadorPrueba } from './publicaciones-fixture';
export function sesionPrueba(usuario: Usuario = jugadorPrueba, minutosRestantes = 15): DatosSesion {
  const ahora = Date.now();
  return {
    usuario,
    emitidaEn: new Date(ahora - (15 - minutosRestantes) * 60000).toISOString(),
    expiraEn: new Date(ahora + minutosRestantes * 60000).toISOString(),
    horaServidor: new Date(ahora).toISOString(),
  };
}
