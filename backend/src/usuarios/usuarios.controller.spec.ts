import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';

// El fallo anterior ocurría al crear UsuariosService real sin UsuarioModel en el módulo de prueba.
// Probamos la responsabilidad del controller: delegar al servicio, sin conectar MongoDB.
describe('UsuariosController', () => {
  let controller: UsuariosController;
  let module: TestingModule;
  const usuariosServiceDoble = { findAll: vi.fn() };

  beforeEach(async () => {
    usuariosServiceDoble.findAll.mockReset();
    module = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{ provide: UsuariosService, useValue: usuariosServiceDoble }],
    })
      // Aislamiento de esta prueba unitaria: no comprueba JWT ni permisos del endpoint.
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<UsuariosController>(UsuariosController);
  });

  afterEach(async () => module.close());

  it('crea el controller con sus dependencias de prueba', () => {
    expect(controller).toBeDefined();
  });

  it('delega findAll una sola vez y devuelve el resultado del servicio', async () => {
    const usuarios = [
      { nombre: 'Mateo', apellido: 'Ríos', nombreUsuario: 'mateo.10' },
    ];
    usuariosServiceDoble.findAll.mockResolvedValue(usuarios);
    await expect(controller.findAll()).resolves.toBe(usuarios);
    expect(usuariosServiceDoble.findAll).toHaveBeenCalledTimes(1);
    expect(usuariosServiceDoble.findAll).toHaveBeenCalledWith();
  });
});
