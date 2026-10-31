import type { Model } from 'mongoose';
import { vi } from 'vitest';
import { Usuario, UsuarioSchema } from './entities/usuario.entity.js';
import { UsuariosService } from './usuarios.service.js';

// Verifica la construcción de la consulta real; el motor MongoDB no se sustituye por una conexión productiva.
describe('UsuariosService: proyección del padrón', () => {
  it('selecciona solo campos permitidos y conserva la exclusión de passwordHash del esquema', async () => {
    const listado = [{ nombre: 'Mateo', nombreUsuario: 'mateo.10' }];
    const consulta = {
      select: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(listado),
    };
    const modelo = { find: vi.fn().mockReturnValue(consulta) };
    const servicio = new UsuariosService(modelo as unknown as Model<Usuario>);
    await expect(servicio.findAll()).resolves.toBe(listado);
    expect(modelo.find).toHaveBeenCalledWith();
    expect(consulta.select).toHaveBeenCalledWith(
      'nombre apellido correo nombreUsuario fechaNacimiento descripcion imagenPerfil perfil createdAt updatedAt',
    );
    const campos = consulta.select.mock.calls[0][0].split(' ');
    expect(campos).not.toContain('password');
    expect(campos).not.toContain('passwordHash');
    expect(UsuarioSchema.path('passwordHash').options.select).toBe(false);
    expect(consulta.exec).toHaveBeenCalledTimes(1);
  });
});
