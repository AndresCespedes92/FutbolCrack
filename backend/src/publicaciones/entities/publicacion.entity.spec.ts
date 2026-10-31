import { model } from 'mongoose';
import { PublicacionSchema } from './publicacion.entity.js';

// Instanciar/validar un modelo no abre una conexión ni guarda documentos.
const Modelo = model('PublicacionValidacion3A', PublicacionSchema);
describe('Schema de publicaciones', () => {
  it('exige título y descripción en documentos nuevos y deja activo por defecto', async () => {
    const nueva = new Modelo({ autorId: '000000000000000000000001' });
    await expect(nueva.validate()).rejects.toMatchObject({
      errors: { titulo: expect.anything(), descripcion: expect.anything() },
    });
    expect(nueva.activo).toBe(true);
  });
  it('valida nuevos campos y conserva contenido como alias opcional', async () => {
    const nueva = new Modelo({
      autorId: '000000000000000000000001',
      titulo: 'Práctica',
      descripcion: 'Trabajo de pases',
    });
    await expect(nueva.validate()).resolves.toBeUndefined();
    expect(PublicacionSchema.path('contenido')).toBeDefined();
    expect(PublicacionSchema.path('activo').options.default).toBe(true);
  });
});
