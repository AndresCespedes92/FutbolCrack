import { Writable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadStream } from 'cloudinary';
import { vi } from 'vitest';
import { CloudinaryService } from './cloudinary.service.js';

// Prueba del adaptador real con transporte simulado: nunca se suben imágenes ni se usan credenciales.
describe('CloudinaryService: carpetas y compatibilidad de avatares', () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([undefined, 'publicaciones'] as const)(
    'mantiene la carpeta esperada al recibir %s',
    async (carpeta) => {
      vi.spyOn(cloudinary, 'config').mockReturnValue({});
      const subir = vi
        .spyOn(cloudinary.uploader, 'upload_stream')
        .mockImplementation((_opciones, callback) => {
          const flujo = new Writable({
            write(_datos, _codificacion, siguiente) {
              siguiente();
            },
          });
          flujo.on('finish', () =>
            callback?.(undefined, {
              secure_url:
                'https://res.cloudinary.com/demo/image/upload/foto.png',
            } as UploadApiResponse),
          );
          return flujo as UploadStream;
        });
      const servicio = new CloudinaryService();
      const imagen = { buffer: Buffer.from('imagen de prueba') };
      // La llamada sin segundo argumento es la que sigue usando AuthService.registrar.
      const resultado = carpeta
        ? await servicio.subirImagen(imagen, carpeta)
        : await servicio.subirImagen(imagen);
      expect(resultado).toContain('/foto.png');
      expect(subir).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: `futbolcrack/${carpeta ?? 'perfiles'}`,
          resource_type: 'image',
        }),
        expect.any(Function),
      );
    },
  );
  it('convierte el error de subida en un mensaje controlado', async () => {
    vi.spyOn(cloudinary, 'config').mockReturnValue({});
    vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(
      (_opciones, callback) => {
        const flujo = new Writable({
          write(_datos, _codificacion, siguiente) {
            siguiente();
          },
        });
        flujo.on('finish', () =>
          callback?.(new Error('fallo de prueba'), undefined),
        );
        return flujo as UploadStream;
      },
    );
    await expect(
      new CloudinaryService().subirImagen(
        { buffer: Buffer.from('foto') },
        'publicaciones',
      ),
    ).rejects.toThrow('No se pudo subir la imagen a Cloudinary');
  });
});
