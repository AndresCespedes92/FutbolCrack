import { model } from 'mongoose';
import { MeGustaSchema } from './me-gusta.entity.js';
const Modelo = model('MeGustaValidacion', MeGustaSchema);
describe('Esquema de votos separados', () => {
  it('declara un índice único publicación/usuario y exige las dos referencias', async () => {
    // Evita aceptar Mixed por confundir Types.ObjectId con el tipo de Schema de Mongoose.
    expect(MeGustaSchema.path('publicacionId').instance).toBe('ObjectId');
    expect(MeGustaSchema.path('usuarioId').instance).toBe('ObjectId');
    expect(MeGustaSchema.indexes()).toContainEqual([
      { publicacionId: 1, usuarioId: 1 },
      expect.objectContaining({ unique: true, name: 'voto_unico' }),
    ]);
    await expect(new Modelo({}).validate()).rejects.toMatchObject({
      errors: {
        publicacionId: expect.anything(),
        usuarioId: expect.anything(),
      },
    });
  });
});
