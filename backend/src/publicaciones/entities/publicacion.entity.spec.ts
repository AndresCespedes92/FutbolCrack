import { model } from 'mongoose';
import { PublicacionSchema } from './publicacion.entity.js';

// Instanciar/validar un modelo no abre una conexión ni guarda documentos.
const Modelo = model('PublicacionValidacion3A', PublicacionSchema);
describe('Schema de publicaciones', () => {
  it.each(['propia', 'instagram', 'tiktok'])(
    'conserva el tipo %s y URL en la colección existente',
    async (tipoContenido) => {
      const nueva = new Modelo({
        autorId: '000000000000000000000001',
        titulo: 'Club',
        descripcion: 'Entrenamiento',
        tipoContenido,
        ...(tipoContenido !== 'propia'
          ? {
              urlExterna:
                tipoContenido === 'instagram'
                  ? 'https://www.instagram.com/p/Club/'
                  : 'https://www.tiktok.com/@club/video/123',
            }
          : {}),
      });
      await expect(nueva.validate()).resolves.toBeUndefined();
      expect(nueva.tipoContenido).toBe(tipoContenido);
      expect(PublicacionSchema.options.collection).toBe('publicaciones');
      expect(PublicacionSchema.path('urlExterna').options.maxlength).toBe(2048);
    },
  );
  it('usa propia por defecto en nuevos documentos y rechaza un tipo ajeno', async () => {
    const datos = {
      autorId: '000000000000000000000001',
      titulo: 'Club',
      descripcion: 'Entrenamiento',
    };
    expect(new Modelo(datos).tipoContenido).toBe('propia');
    await expect(
      new Modelo({ ...datos, tipoContenido: 'youtube' }).validate(),
    ).rejects.toMatchObject({ errors: { tipoContenido: expect.anything() } });
  });
  it('exige título y descripción en documentos nuevos y deja activo por defecto', async () => {
    const nueva = new Modelo({ autorId: '000000000000000000000001' });
    await expect(nueva.validate()).rejects.toMatchObject({
      errors: { titulo: expect.anything(), descripcion: expect.anything() },
    });
    expect(nueva.activo).toBe(true);
    expect(nueva.likes).toBeUndefined();
    expect(nueva.cantidadLikes).toBe(0);
    expect(nueva.likesMigrados).toBe(true);
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
    expect(PublicacionSchema.path('likes').options.unique).not.toBe(true);
    expect(PublicacionSchema.path('likes').options.select).toBe(false);
  });
});
