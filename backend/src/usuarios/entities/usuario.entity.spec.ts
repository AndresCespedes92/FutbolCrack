import { model } from 'mongoose';
import { UsuarioSchema } from './usuario.entity.js';
const Modelo = model('UsuarioValidacion5A', UsuarioSchema);
describe('Usuario: rol y habilitación independientes', () => {
  it('crea activo true por defecto sin cambiar el rol usuario del registro', () => {
    const nuevo = new Modelo({});
    expect(nuevo.activo).toBe(true);
    expect(nuevo.perfil).toBe('usuario');
  });
  it('mantiene false explícito y el hash excluido por defecto', () => {
    const inactivo = new Modelo({ activo: false, perfil: 'administrador' });
    expect(inactivo.activo).toBe(false);
    expect(inactivo.perfil).toBe('administrador');
    expect(UsuarioSchema.path('passwordHash').options.select).toBe(false);
  });
});
