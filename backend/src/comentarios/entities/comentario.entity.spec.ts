import { model, Types } from 'mongoose';
import { ComentarioSchema } from './comentario.entity.js';
// Validación Mongoose real en memoria: no inicia conexión ni persiste datos.
const Modelo = model('ComentarioValidacion4A', ComentarioSchema);
describe('Schema de comentarios', () => {
  it('exige ambas referencias y texto, y crea modificado false', async () => {
    const nuevo = new Modelo({});
    await expect(nuevo.validate()).rejects.toMatchObject({
      errors: {
        publicacionId: expect.anything(),
        autorId: expect.anything(),
        texto: expect.anything(),
      },
    });
    expect(nuevo.modificado).toBe(false);
  });
  it('acepta referencias ObjectId/texto válido, recorta espacios y no copia datos del autor', async () => {
    const nuevo = new Modelo({
      publicacionId: new Types.ObjectId(),
      autorId: new Types.ObjectId(),
      texto: '  Buen pase  ',
    });
    await expect(nuevo.validate()).resolves.toBeUndefined();
    expect(nuevo.texto).toBe('Buen pase');
    expect(nuevo.toObject()).not.toHaveProperty('nombre');
    expect(ComentarioSchema.path('autorId').options.ref).toBe('Usuario');
    expect(ComentarioSchema.path('publicacionId').options.ref).toBe(
      'Publicacion',
    );
  });
  it('rechaza longitud excesiva también en persistencia', async () => {
    const nuevo = new Modelo({
      publicacionId: new Types.ObjectId(),
      autorId: new Types.ObjectId(),
      texto: 'a'.repeat(1001),
    });
    await expect(nuevo.validate()).rejects.toMatchObject({
      errors: { texto: expect.anything() },
    });
  });
  it('configura timestamps, relaciones inmutables e índice para listar por publicación y fecha/id', () => {
    expect(ComentarioSchema.options.timestamps).toBe(true);
    expect(ComentarioSchema.path('createdAt').instance).toBe('Date');
    expect(ComentarioSchema.path('updatedAt').instance).toBe('Date');
    expect(ComentarioSchema.path('autorId').options.immutable).toBe(true);
    expect(ComentarioSchema.path('publicacionId').options.immutable).toBe(true);
    expect(
      ComentarioSchema.indexes().some(
        ([campos]) =>
          JSON.stringify(campos) ===
          JSON.stringify({ publicacionId: 1, createdAt: -1, _id: -1 }),
      ),
    ).toBe(true);
  });
});
