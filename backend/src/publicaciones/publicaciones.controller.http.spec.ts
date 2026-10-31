import { InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { Types } from 'mongoose';
import { AutenticacionOpcionalGuard } from './guards/autenticacion-opcional.guard.js';
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
  const agregar = vi.fn();
  const poblar = vi.fn();
  const cambiarLike = vi.fn();
  const buscarUno = vi.fn();
  const actualizar = vi.fn();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=',
    'base64',
  );

  class ModeloDePrueba {
    static aggregate = agregar;
    static populate = poblar;
    static findOneAndUpdate = cambiarLike;
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
        AutenticacionOpcionalGuard,
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
    // Doble acotado: interpreta los campos del pipeline enviado, no consulta un motor MongoDB.
    // Las pruebas también verifican operadores/filtros; la ejecución real en Atlas queda pendiente.
    agregar.mockReset().mockImplementation((pipeline) => ({
      exec: async () => {
        const filtro = pipeline[0].$match;
        const faceta = pipeline[2].$facet;
        const lector = pipeline[1].$set.meGusta?.$in?.[0]?.toString();
        const filas = documentos
          .filter(
            (doc) =>
              (!filtro.activo || doc.activo !== false) &&
              (!filtro.autorId ||
                doc.autorId?.toString() === filtro.autorId.toString()),
          )
          .map((doc) => ({
            ...doc,
            cantidadLikes: (doc.likes ?? []).length,
            meGusta: Boolean(
              lector &&
              (doc.likes ?? []).some((uid: any) => uid.toString() === lector),
            ),
          }));
        const camposOrden = faceta.publicaciones[0].$sort;
        const comparar = (valor: any) =>
          valor instanceof Date ? valor.toISOString() : (valor ?? '');
        filas.sort((a, b) => {
          for (const [campo, direccion] of Object.entries(camposOrden)) {
            const primero = comparar(a[campo]);
            const segundo = comparar(b[campo]);
            if (primero < segundo) return -Number(direccion);
            if (primero > segundo) return Number(direccion);
          }
          return 0;
        });
        const inicio = faceta.publicaciones[1].$skip;
        const limite = faceta.publicaciones[2].$limit;
        const pagina = filas.slice(inicio, inicio + limite).map((doc) => {
          const vista = { ...doc };
          if (faceta.publicaciones[3].$project.likes === 0) delete vista.likes;
          return vista;
        });
        return [
          {
            publicaciones: pagina,
            conteo: filas.length ? [{ total: filas.length }] : [],
          },
        ];
      },
    }));
    poblar.mockReset().mockImplementation(async (pagina) => pagina);
    cambiarLike.mockReset().mockImplementation((filtro, cambio) => ({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: async () => {
        const doc = documentos.find(
          (doc) =>
            doc._id.toString() === filtro._id.toString() &&
            doc.activo !== false,
        );
        if (!doc) return null;
        const actor = (filtro.likes.$ne ?? filtro.likes).toString();
        const votos = doc.likes ?? [];
        const existe = votos.some((uid: any) => uid.toString() === actor);
        if (filtro.likes.$ne ? existe : !existe) return null;
        // Se modifica antes de resolver la promesa, modelando una sola actualización atómica.
        doc.likes = cambio.$addToSet
          ? [...votos, cambio.$addToSet.likes]
          : votos.filter((uid: any) => uid.toString() !== actor);
        return { likes: [...doc.likes] };
      },
    }));
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
    expect(agregar.mock.calls[0][0][0]).toEqual({
      $match: { activo: { $ne: false } },
    });
    expect(respuesta.body.publicaciones).toHaveLength(1);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.publicaciones[0]).toMatchObject({
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
    expect(lista.body).toEqual({
      publicaciones: [],
      total: 0,
      offset: 0,
      limit: 10,
      hayMas: false,
    });
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

  describe('Likes 3B: identidad y atomicidad', () => {
    it('registra un like propio, cuenta uno y no usa el usuario enviado por cliente', async () => {
      prepararPublicacion();
      const respuesta = await postLike()
        .send({ usuarioId: ajenoId })
        .expect(201);
      expect(respuesta.body).toEqual({
        mensaje: 'Me gusta registrado correctamente',
        cantidadLikes: 1,
        meGusta: true,
      });
      expect(documentos[0].likes.map(String)).toEqual([autorId]);
      expect(cambiarLike).toHaveBeenCalledWith(
        expect.objectContaining({
          activo: { $ne: false },
          likes: { $ne: new Types.ObjectId(autorId) },
        }),
        { $addToSet: { likes: new Types.ObjectId(autorId) } },
        { new: true },
      );
    });
    it('rechaza un voto repetido sin duplicar ni aumentar el conteo', async () => {
      prepararPublicacion();
      await postLike().expect(201);
      const repetido = await postLike().expect(409);
      expect(repetido.body.message).toContain('Ya diste me gusta');
      expect(documentos[0].likes).toHaveLength(1);
    });
    it('ante ocho solicitudes simultáneas solo una registra el voto', async () => {
      prepararPublicacion();
      const respuestas = await Promise.all(
        Array.from({ length: 8 }, () => postLike()),
      );
      expect(respuestas.map((res) => res.status).sort()).toEqual([
        201, 409, 409, 409, 409, 409, 409, 409,
      ]);
      expect(documentos[0].likes.map(String)).toEqual([autorId]);
      for (const llamada of cambiarLike.mock.calls)
        expect(llamada[1]).toHaveProperty('$addToSet');
    });
    it('permite que dos usuarios distintos voten la misma publicación', async () => {
      prepararPublicacion();
      await postLike().expect(201);
      const otro = jwt.sign({ sub: ajenoId, perfil: 'usuario' });
      const respuesta = await request(app.getHttpServer())
        .post(`/publicaciones/${id}/likes`)
        .set('Authorization', `Bearer ${otro}`)
        .expect(201);
      expect(respuesta.body.cantidadLikes).toBe(2);
      expect(documentos[0].likes.map(String).sort()).toEqual(
        [autorId, ajenoId].sort(),
      );
    });
    it('quita únicamente el voto propio y permite volver a votar', async () => {
      prepararPublicacion();
      documentos[0].likes = [
        new Types.ObjectId(autorId),
        new Types.ObjectId(ajenoId),
      ];
      const respuesta = await request(app.getHttpServer())
        .delete(`/publicaciones/${id}/likes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ usuarioId: ajenoId })
        .expect(200);
      expect(respuesta.body.cantidadLikes).toBe(1);
      expect(respuesta.body.meGusta).toBe(false);
      expect(documentos[0].likes.map(String)).toEqual([ajenoId]);
      expect(cambiarLike.mock.calls[0][1]).toEqual({
        $pull: { likes: new Types.ObjectId(autorId) },
      });
      await postLike().expect(201);
      expect(documentos[0].likes).toHaveLength(2);
    });
    it('rechaza quitar un voto inexistente sin tocar los de otros', async () => {
      prepararPublicacion();
      documentos[0].likes = [new Types.ObjectId(ajenoId)];
      const respuesta = await request(app.getHttpServer())
        .delete(`/publicaciones/${id}/likes`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
      expect(respuesta.body.message).toContain('No tenés un me gusta');
      expect(documentos[0].likes.map(String)).toEqual([ajenoId]);
    });
    it('rechaza likes y su retiro sin autenticación', async () => {
      prepararPublicacion();
      await request(app.getHttpServer())
        .post(`/publicaciones/${id}/likes`)
        .expect(401);
      await request(app.getHttpServer())
        .delete(`/publicaciones/${id}/likes`)
        .expect(401);
      expect(cambiarLike).not.toHaveBeenCalled();
    });
    it('rechaza usuario inexistente aunque el JWT esté firmado', async () => {
      prepararPublicacion();
      usuarios.findById.mockResolvedValue(null);
      await postLike().expect(401);
      expect(cambiarLike).not.toHaveBeenCalled();
    });
    it('no permite likes ni retiros sobre publicaciones ausentes o dadas de baja', async () => {
      for (const presente of [false, true]) {
        documentos = presente
          ? [
              {
                _id: id,
                autorId,
                activo: false,
                likes: [new Types.ObjectId(autorId)],
              },
            ]
          : [];
        await postLike().expect(404);
        await request(app.getHttpServer())
          .delete(`/publicaciones/${id}/likes`)
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
        if (presente)
          expect(documentos[0].likes.map(String)).toEqual([autorId]);
      }
    });
    it('rechaza un id inválido sin ejecutar la actualización', async () => {
      await request(app.getHttpServer())
        .post('/publicaciones/id-invalido/likes')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(cambiarLike).not.toHaveBeenCalled();
    });
  });

  function postLike() {
    return request(app.getHttpServer())
      .post(`/publicaciones/${id}/likes`)
      .set('Authorization', `Bearer ${token}`);
  }
  function generarPartes(cantidad: number) {
    for (let numero = 1; numero <= cantidad; numero++)
      documentos.push({
        _id: new Types.ObjectId(numero.toString(16).padStart(24, '0')),
        autorId: new Types.ObjectId(numero % 2 ? autorId : ajenoId),
        titulo: `Parte ${numero}`,
        descripcion: `Práctica ${numero}`,
        contenido: `Práctica ${numero}`,
        createdAt: new Date(Date.UTC(2026, 9, 1, 0, 0, numero)),
        activo: true,
      });
  }

  describe('Listado 3B: filtros, orden y paginación de servidor', () => {
    it('devuelve por defecto diez registros y total filtrado, excluyendo inactivas', async () => {
      generarPartes(23);
      documentos.push({ _id: 'inactiva', activo: false });
      const respuesta = await request(app.getHttpServer())
        .get('/publicaciones')
        .expect(200);
      expect(respuesta.body).toMatchObject({
        total: 23,
        offset: 0,
        limit: 10,
        hayMas: true,
      });
      expect(
        respuesta.body.publicaciones.map((pub: any) => pub.titulo),
      ).toEqual(Array.from({ length: 10 }, (_, i) => `Parte ${23 - i}`));
      const pipeline = agregar.mock.calls[0][0];
      expect(pipeline[0]).toEqual({ $match: { activo: { $ne: false } } });
      expect(pipeline[2].$facet.publicaciones.slice(0, 3)).toEqual([
        { $sort: { createdAt: -1, _id: -1 } },
        { $skip: 0 },
        { $limit: 10 },
      ]);
      expect(pipeline[2].$facet.conteo).toEqual([{ $count: 'total' }]);
      expect(poblar.mock.calls[0][0]).toHaveLength(10);
      expect(poblar.mock.calls[0][1]).toEqual({
        path: 'autorId',
        select: 'nombre apellido nombreUsuario imagenPerfil',
      });
    });
    it('navega a offset 10 y 20 sin repetir la primera página', async () => {
      generarPartes(23);
      const segunda = await request(app.getHttpServer())
        .get('/publicaciones?offset=10&limit=10')
        .expect(200);
      const tercera = await request(app.getHttpServer())
        .get('/publicaciones?offset=20&limit=10')
        .expect(200);
      expect(segunda.body).toMatchObject({
        total: 23,
        offset: 10,
        limit: 10,
        hayMas: true,
      });
      expect(segunda.body.publicaciones.map((pub: any) => pub.titulo)).toEqual(
        Array.from({ length: 10 }, (_, i) => `Parte ${13 - i}`),
      );
      expect(tercera.body).toMatchObject({
        total: 23,
        offset: 20,
        limit: 10,
        hayMas: false,
      });
      expect(tercera.body.publicaciones.map((pub: any) => pub.titulo)).toEqual([
        'Parte 3',
        'Parte 2',
        'Parte 1',
      ]);
    });
    it('aplica filtro por autor antes del total y offset, y permite limit 3', async () => {
      generarPartes(23);
      const respuesta = await request(app.getHttpServer())
        .get(`/publicaciones?usuarioId=${autorId}&offset=10&limit=10`)
        .expect(200);
      expect(respuesta.body).toMatchObject({
        total: 12,
        offset: 10,
        limit: 10,
        hayMas: false,
      });
      expect(
        respuesta.body.publicaciones.map((pub: any) => pub.titulo),
      ).toEqual(['Parte 3', 'Parte 1']);
      expect(agregar.mock.calls[0][0][0].$match.autorId.toString()).toBe(
        autorId,
      );
      const perfil = await request(app.getHttpServer())
        .get(`/publicaciones?usuarioId=${autorId}&limit=3`)
        .expect(200);
      expect(perfil.body.publicaciones).toHaveLength(3);
      expect(perfil.body.total).toBe(12);
      expect(perfil.body.hayMas).toBe(true);
    });
    it('ordena por likes, luego fecha y finalmente id para desempatar', async () => {
      generarPartes(5);
      documentos[0].likes = [
        new Types.ObjectId(autorId),
        new Types.ObjectId(ajenoId),
      ];
      documentos[1].likes = [new Types.ObjectId(autorId)];
      documentos[3].likes = [
        new Types.ObjectId(autorId),
        new Types.ObjectId(ajenoId),
      ];
      documentos[3].createdAt = documentos[0].createdAt;
      documentos[4].likes = [
        new Types.ObjectId(autorId),
        new Types.ObjectId(ajenoId),
      ];
      const respuesta = await request(app.getHttpServer())
        .get('/publicaciones?orden=likes')
        .expect(200);
      expect(
        respuesta.body.publicaciones.map((pub: any) => pub.titulo),
      ).toEqual(['Parte 5', 'Parte 4', 'Parte 1', 'Parte 2', 'Parte 3']);
      expect(
        respuesta.body.publicaciones.map((pub: any) => pub.cantidadLikes),
      ).toEqual([2, 2, 2, 1, 0]);
      expect(agregar.mock.calls[0][0][2].$facet.publicaciones[0]).toEqual({
        $sort: { cantidadLikes: -1, createdAt: -1, _id: -1 },
      });
    });
    it('desempata fecha por id de forma determinista entre páginas', async () => {
      generarPartes(2);
      documentos[1].createdAt = documentos[0].createdAt;
      for (let repeticion = 0; repeticion < 2; repeticion++) {
        const primera = await request(app.getHttpServer())
          .get('/publicaciones?limit=1')
          .expect(200);
        const segunda = await request(app.getHttpServer())
          .get('/publicaciones?limit=1&offset=1')
          .expect(200);
        expect(primera.body.publicaciones[0].titulo).toBe('Parte 2');
        expect(segunda.body.publicaciones[0].titulo).toBe('Parte 1');
      }
    });
    it('devuelve página vacía para offset posterior y total correcto para un filtro sin registros', async () => {
      generarPartes(2);
      const fuera = await request(app.getHttpServer())
        .get('/publicaciones?offset=20')
        .expect(200);
      expect(fuera.body).toEqual({
        publicaciones: [],
        total: 2,
        offset: 20,
        limit: 10,
        hayMas: false,
      });
      const vacio = await request(app.getHttpServer())
        .get('/publicaciones?usuarioId=000000000000000000000099')
        .expect(200);
      expect(vacio.body).toEqual({
        publicaciones: [],
        total: 0,
        offset: 0,
        limit: 10,
        hayMas: false,
      });
    });
    it('calcula el like del lector autenticado sin confundirlo con el filtro de autor ni exponer votantes', async () => {
      generarPartes(2);
      documentos[0].autorId = new Types.ObjectId(ajenoId);
      documentos[0].likes = [new Types.ObjectId(autorId)];
      documentos[1].likes = [new Types.ObjectId(ajenoId)];
      const respuesta = await request(app.getHttpServer())
        .get(`/publicaciones?usuarioId=${ajenoId}`)
        .set('Cookie', `token=${token}`)
        .expect(200);
      expect(
        respuesta.body.publicaciones.map((pub: any) => pub.meGusta),
      ).toEqual([false, true]);
      for (const pub of respuesta.body.publicaciones)
        expect(pub).not.toHaveProperty('likes');
      const anonima = await request(app.getHttpServer())
        .get('/publicaciones')
        .set('Cookie', 'token=token-invalido')
        .expect(200);
      expect(
        anonima.body.publicaciones.every((pub: any) => pub.meGusta === false),
      ).toBe(true);
    });
    it('considera un documento antiguo sin likes como cero y permite su primer voto', async () => {
      prepararPublicacion();
      const anterior = await request(app.getHttpServer())
        .get('/publicaciones')
        .expect(200);
      expect(anterior.body.publicaciones[0]).toMatchObject({
        titulo: 'Publicación anterior',
        cantidadLikes: 0,
        meGusta: false,
      });
      expect(documentos[0]).not.toHaveProperty('likes');
      await postLike().expect(201);
      const votada = await request(app.getHttpServer())
        .get('/publicaciones')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(votada.body.publicaciones[0]).toMatchObject({
        cantidadLikes: 1,
        meGusta: true,
      });
    });
    it.each([
      'orden=otro',
      'offset=-1',
      'offset=1.5',
      'offset=',
      'offset=1e2',
      'offset=NaN',
      'offset=9007199254740992',
      'limit=0',
      'limit=-1',
      'limit=101',
      'limit=1.5',
      'limit=',
      'limit=NaN',
      'limit=1&limit=2',
      'usuarioId=incorrecto',
      'usuarioId=',
      'campoExtra=1',
    ])(
      'rechaza query inválida %s antes de consultar MongoDB',
      async (query) => {
        await request(app.getHttpServer())
          .get(`/publicaciones?${query}`)
          .expect(400);
        expect(agregar).not.toHaveBeenCalled();
      },
    );
    it('acepta el límite máximo técnico de 100', async () => {
      generarPartes(3);
      const respuesta = await request(app.getHttpServer())
        .get('/publicaciones?limit=100')
        .expect(200);
      expect(respuesta.body).toMatchObject({
        limit: 100,
        total: 3,
        hayMas: false,
      });
    });
  });
});
