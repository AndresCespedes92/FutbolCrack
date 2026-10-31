import { InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Publicacion } from './entities/publicacion.entity.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { MAXIMO_IMAGEN_BYTES } from './publicaciones.constants.js';

// Conserva los casos de Tarea 2, ahora con título y descripción; nunca conecta servicios externos.
describe('Publicaciones HTTP: modelo, imágenes, compatibilidad y baja lógica', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let token: string;
  const autorId = '000000000000000000000001';
  const ajenoId = '000000000000000000000002';
  const id = '000000000000000000000011';
  const guardar = vi.fn();
  const cloudinary = { subirImagen: vi.fn() };
  const usuarios = { findById: vi.fn() };
  let documentos: any[];
  const buscar = vi.fn();
  const buscarUno = vi.fn();
  const actualizar = vi.fn();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=',
    'base64',
  );

  class ModeloDePrueba {
    static find = buscar;
    static findOne = buscarUno;
    static updateOne = actualizar;
    constructor(private readonly datos: Record<string, unknown>) {}
    save() {
      return guardar(this.datos);
    }
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'clave-exclusiva-tests-publicaciones',
          signOptions: { expiresIn: '5m' },
        }),
      ],
      controllers: [PublicacionesController],
      providers: [
        AuthGuard,
        PublicacionesService,
        { provide: getModelToken(Publicacion.name), useValue: ModeloDePrueba },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: UsuariosService, useValue: usuarios },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    jwt = module.get(JwtService);
    token = jwt.sign({ sub: autorId, perfil: 'usuario' });
  });

  beforeEach(() => {
    documentos = [];
    guardar.mockReset().mockImplementation(async (datos) => {
      const documento = { _id: id, ...datos };
      documentos.push(documento);
      return documento;
    });
    cloudinary.subirImagen
      .mockReset()
      .mockResolvedValue(
        'https://res.cloudinary.com/demo/image/upload/prueba.png',
      );
    usuarios.findById.mockReset().mockResolvedValue({ perfil: 'usuario' });
    buscar.mockReset().mockImplementation((filtro) => {
      const consulta = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockReturnThis(),
        exec: async () =>
          documentos
            .filter((doc) => !filtro?.activo || doc.activo !== false)
            .slice(0, 50),
      };
      return consulta;
    });
    buscarUno.mockReset().mockImplementation((filtro) => ({
      exec: async () =>
        documentos.find(
          (doc) =>
            doc._id.toString() === filtro._id.toString() &&
            doc.activo !== false,
        ) ?? null,
    }));
    actualizar.mockReset().mockImplementation((filtro, cambio) => ({
      exec: async () => {
        const doc = documentos.find(
          (doc) =>
            doc._id.toString() === filtro._id.toString() &&
            doc.activo !== false,
        );
        if (!doc) return { matchedCount: 0 };
        Object.assign(doc, cambio.$set);
        return { matchedCount: 1 };
      },
    }));
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  function post() {
    return request(app.getHttpServer())
      .post('/publicaciones')
      .set('Authorization', `Bearer ${token}`);
  }
  function body(descripcion = 'Entrenamiento del día') {
    return { titulo: 'Entrenamiento', descripcion };
  }
  function prepararPublicacion() {
    documentos.push({ _id: id, autorId, contenido: 'Parte antiguo' });
  }

  it('mantiene el 401 sin sesión aunque el contenido sea válido', async () => {
    await request(app.getHttpServer())
      .post('/publicaciones')
      .send(body())
      .expect(401);
    expect(guardar).not.toHaveBeenCalled();
  });
  it('acepta el body nuevo de Angular, recorta textos y toma el autor del JWT', async () => {
    const respuesta = await post()
      .send({
        titulo: '  Entrenamiento  ',
        descripcion: '  Hoy entrenamos pases cortos.  ',
      })
      .expect(201);
    expect(respuesta.body.titulo).toBe('Entrenamiento');
    expect(respuesta.body.descripcion).toBe('Hoy entrenamos pases cortos.');
    expect(respuesta.body.contenido).toBe(respuesta.body.descripcion);
    expect(respuesta.body.autorId).toBe(autorId);
    expect(respuesta.body.activo).toBe(true);
    expect(respuesta.body.multimediaUrl).toBe('');
    expect(respuesta.body.tipoMultimedia).toBe('ninguno');
    expect(cloudinary.subirImagen).not.toHaveBeenCalled();
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(guardar.mock.calls[0][0].autorId.toHexString()).toBe(autorId);
  });
  it.each([
    ['un carácter', 'a'],
    ['2000 caracteres', 'a'.repeat(2000)],
    ['espacios externos con 2000 caracteres útiles', `  ${'a'.repeat(2000)}  `],
    ['saltos de línea internos', 'Primera línea\nSegunda línea'],
  ])(
    'acepta %s respetando las reglas existentes',
    async (_caso, descripcion) => {
      const respuesta = await post().send(body(descripcion)).expect(201);
      expect(respuesta.body.descripcion).toBe(descripcion.trim());
      expect(respuesta.body.contenido).toBe(descripcion.trim());
      expect(guardar).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    ['campo ausente', { titulo: 'Entrenamiento' }],
    ['texto vacío', body('')],
    ['solo espacios y saltos', body(' \n\t ')],
    ['null', { ...body(), descripcion: null }],
    ['número', { ...body(), descripcion: 123 }],
    ['booleano', { ...body(), descripcion: true }],
    ['array', { ...body(), descripcion: ['texto'] }],
    ['objeto', { ...body(), descripcion: { texto: 'texto' } }],
    ['2001 caracteres', body('a'.repeat(2001))],
    ['autor enviado por cliente', { ...body(), autorId: ajenoId }],
    ['propiedad ajena al contrato', { ...body(), intruso: true }],
  ])(
    'responde 400 por %s sin guardar ni producir un 500',
    async (_caso, datos) => {
      const respuesta = await post().send(datos).expect(400);
      expect(respuesta.body.statusCode).toBe(400);
      expect(Array.isArray(respuesta.body.message)).toBe(true);
      expect(respuesta.body.message.length).toBeGreaterThan(0);
      expect(guardar).not.toHaveBeenCalled();
      expect(cloudinary.subirImagen).not.toHaveBeenCalled();
    },
  );
  it('conserva el límite del servicio para caracteres de dos unidades UTF-16', async () => {
    await post()
      .send(body('😀'.repeat(1001)))
      .expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });
  it.each([undefined, '', '   ', 123, false, [], {}, 'a'.repeat(121)])(
    'rechaza título inválido: %j',
    async (titulo) => {
      await post().send({ titulo, descripcion: 'Texto válido' }).expect(400);
      expect(guardar).not.toHaveBeenCalled();
    },
  );
  it('acepta exactamente 120 caracteres de título', async () => {
    const respuesta = await post()
      .send({ titulo: 'a'.repeat(120), descripcion: 'Texto válido' })
      .expect(201);
    expect(respuesta.body.titulo.length).toBe(120);
  });
  it('rechaza creación antigua sin los campos nuevos, sin alterar la lectura antigua', async () => {
    await post().send({ contenido: 'Parte antiguo' }).expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('sube una imagen PNG válida junto con título y descripción multipart', async () => {
    const respuesta = await post()
      .field('titulo', 'Entrenamiento')
      .field('descripcion', 'Foto de la práctica')
      .attach('imagen', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(201);
    expect(respuesta.body.tipoMultimedia).toBe('imagen');
    expect(respuesta.body.multimediaUrl).toContain('/prueba.png');
    expect(cloudinary.subirImagen).toHaveBeenCalledWith(
      expect.objectContaining({ buffer: png }),
      'publicaciones',
    );
    expect(guardar).toHaveBeenCalledTimes(1);
  });
  it.each([
    [
      'JPEG',
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0]),
      'image/jpeg',
    ],
    [
      'WebP',
      Buffer.from(
        '52494646200000005745425056503820000000000000000000000000000000000000000000000000',
        'hex',
      ),
      'image/webp',
    ],
  ])('acepta firma de imagen %s', async (_tipo, archivo, mime) => {
    await post()
      .field('titulo', 'Foto')
      .field('descripcion', 'Entrenamiento')
      .attach('imagen', archivo, { filename: 'foto', contentType: mime })
      .expect(201);
    expect(cloudinary.subirImagen).toHaveBeenCalledTimes(1);
  });
  it('rechaza texto disfrazado de PNG aunque el MIME declarado sea imagen', async () => {
    await post()
      .field('titulo', 'Foto')
      .field('descripcion', 'Entrenamiento')
      .attach('imagen', Buffer.from('esto no es una imagen'), {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(cloudinary.subirImagen).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
  });
  it('rechaza GIF fuera de los tipos permitidos', async () => {
    await post()
      .field('titulo', 'Foto')
      .field('descripcion', 'Entrenamiento')
      .attach('imagen', Buffer.from('47494638396101000100000000', 'hex'), {
        filename: 'foto.gif',
        contentType: 'image/gif',
      })
      .expect(400);
    expect(cloudinary.subirImagen).not.toHaveBeenCalled();
  });
  it('acepta exactamente 5 MiB', async () => {
    const archivo = Buffer.alloc(MAXIMO_IMAGEN_BYTES);
    png.copy(archivo);
    await post()
      .field('titulo', 'Foto')
      .field('descripcion', 'Entrenamiento')
      .attach('imagen', archivo, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(201);
    expect(cloudinary.subirImagen).toHaveBeenCalledTimes(1);
  });
  it('rechaza más de 5 MiB con 413 antes de subir', async () => {
    const archivo = Buffer.alloc(MAXIMO_IMAGEN_BYTES + 1);
    png.copy(archivo);
    await post()
      .field('titulo', 'Foto')
      .field('descripcion', 'Entrenamiento')
      .attach('imagen', archivo, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(413);
    expect(cloudinary.subirImagen).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
  });
  it('no guarda si falla Cloudinary', async () => {
    cloudinary.subirImagen.mockRejectedValue(
      new InternalServerErrorException(
        'No se pudo subir la imagen a Cloudinary',
      ),
    );
    await post()
      .field('titulo', 'Foto')
      .field('descripcion', 'Entrenamiento')
      .attach('imagen', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(500);
    expect(guardar).not.toHaveBeenCalled();
  });

  it('normaliza publicaciones antiguas sin migrarlas y excluye inactivas', async () => {
    const anterior = { _id: id, autorId, contenido: 'Parte antiguo' };
    documentos.push(anterior, {
      _id: '000000000000000000000012',
      titulo: 'Retirada',
      descripcion: 'No visible',
      activo: false,
    });
    const respuesta = await request(app.getHttpServer())
      .get('/publicaciones')
      .expect(200);
    expect(buscar).toHaveBeenCalledWith({ activo: { $ne: false } });
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0]).toMatchObject({
      titulo: 'Publicación anterior',
      descripcion: 'Parte antiguo',
      contenido: 'Parte antiguo',
      activo: true,
    });
    expect(anterior).not.toHaveProperty('titulo');
    expect(anterior).not.toHaveProperty('activo');
  });
  it('da de baja al autor, conserva el documento y no lo lista', async () => {
    prepararPublicacion();
    const respuesta = await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(respuesta.body.mensaje).toContain('dada de baja correctamente');
    expect(documentos).toHaveLength(1);
    expect(documentos[0].activo).toBe(false);
    expect(actualizar).toHaveBeenCalledWith(
      expect.objectContaining({ activo: { $ne: false } }),
      { $set: { activo: false } },
    );
    const lista = await request(app.getHttpServer())
      .get('/publicaciones')
      .expect(200);
    expect(lista.body).toEqual([]);
  });
  it('permite al administrador actual dar de baja una publicación ajena', async () => {
    prepararPublicacion();
    usuarios.findById.mockResolvedValue({ perfil: 'administrador' });
    const admin = jwt.sign({ sub: ajenoId, perfil: 'usuario' });
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    expect(usuarios.findById).toHaveBeenCalledWith(ajenoId);
    expect(documentos[0].activo).toBe(false);
  });
  it('rechaza a un tercero aunque su JWT viejo diga administrador', async () => {
    prepararPublicacion();
    const ajeno = jwt.sign({ sub: ajenoId, perfil: 'administrador' });
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${ajeno}`)
      .expect(403);
    expect(actualizar).not.toHaveBeenCalled();
    expect(documentos[0].activo).toBeUndefined();
  });
  it('responde 404 si no existe o ya está de baja, y 400 por id inválido', async () => {
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    documentos.push({ _id: id, autorId, activo: false });
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    await request(app.getHttpServer())
      .delete('/publicaciones/id-invalido')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it('no permite baja sin sesión ni si el usuario ya no existe', async () => {
    prepararPublicacion();
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .expect(401);
    usuarios.findById.mockResolvedValue(null);
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it('rechaza una segunda baja y una carrera donde otro proceso ya retiró el documento', async () => {
    prepararPublicacion();
    actualizar.mockReturnValueOnce({ exec: async () => ({ matchedCount: 0 }) });
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/publicaciones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
