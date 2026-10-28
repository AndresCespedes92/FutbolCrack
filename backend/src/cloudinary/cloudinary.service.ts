
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Representa el archivo recibido por Multer.
 * El servicio solo necesita el contenido de la imagen.
 */
interface ArchivoImagen {
  buffer: Buffer;
}

@Injectable()
export class CloudinaryService {

  constructor() {
    // Configuramos Cloudinary con las variables de entorno.
    // Nunca escribimos las credenciales directamente en el código.
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  /**
   * Recibe una imagen almacenada temporalmente en memoria.
   * La sube a Cloudinary y devuelve su URL HTTPS.
   */
  async subirImagen(archivo: ArchivoImagen): Promise<string> {

    try {
      // Creamos una promesa porque upload_stream
      // funciona mediante un callback.
      const resultado = await new Promise<string>(
        (resolve, reject) => {

          // Creamos el canal de subida a Cloudinary.
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'futbolcrack/perfiles',
              resource_type: 'image',
            },
            (error, result) => {

              if (error) {
                return reject(error);
              }

              if (!result?.secure_url) {
                return reject(
                  new Error('Cloudinary no devolvió una URL'),
                );
              }

              // Devolvemos la URL HTTPS de la imagen.
              resolve(result.secure_url);
            },
          );

          // Convertimos el Buffer recibido en un stream.
          // Esto permite enviar la imagen a Cloudinary.
          Readable.from(archivo.buffer).pipe(uploadStream);
        },
      );

      return resultado;

    } catch {
      throw new InternalServerErrorException(
        'No se pudo subir la imagen a Cloudinary',
      );
    }
  }
}
