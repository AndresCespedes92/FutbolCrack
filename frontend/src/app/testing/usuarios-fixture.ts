import { UsuarioAdministrativo } from '../services/usuarios';
import { jugadorPrueba } from './publicaciones-fixture';
export const administradorPrueba = { ...jugadorPrueba, perfil: 'administrador', activo: true };
export function usuarioAdministrativoPrueba(numero = 2, activo = true): UsuarioAdministrativo {
  return {
    _id: numero.toString().padStart(24, '0'),
    nombre: 'Mateo',
    apellido: 'Ríos',
    correo: `jugador${numero}@club.test`,
    nombreUsuario: `jugador${numero}`,
    fechaNacimiento: '2000-01-01',
    descripcion: 'Jugador',
    imagenPerfil: '',
    perfil: numero === 1 ? 'administrador' : 'usuario',
    activo,
  };
}
