import { modeloUsuarioSesion } from '../testing/usuario-sesion.js';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import request from 'supertest';
import { vi } from 'vitest';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ComentariosModule } from './comentarios.module.js';

// Importamos el módulo funcional REAL para comprobar también sus imports/exports e inyección.
// Solo conexión/modelos, padrón y transporte de imágenes se sustituyen: no hay Atlas ni Cloudinary.
const guardar = vi.fn(),
  buscarPublicacion = vi.fn(),
  buscarComentario = vi.fn();
const agregar = vi.fn(),
  actualizar = vi.fn(),
  poblar = vi.fn();
class ModeloComentarioPrueba {
  static aggregate = agregar;
  static populate = poblar;
  static findById = buscarComentario;
  static findOneAndUpdate = actualizar;
  constructor(private readonly datos: Record<string, unknown>) {}
  save() {
    return guardar(this.datos);
  }
}
const usuarios = { findById: vi.fn() };
const conexion = {
  models: {
    MeGusta: {}, // Dependencia del módulo de publicaciones; estos casos no modifican votos.
    Comentario: ModeloComentarioPrueba,
    Publicacion: { findOne: buscarPublicacion },
    Usuario: modeloUsuarioSesion((id) => usuarios.findById(id)),
  },
};
@Global()
@Module({
  providers: [{ provide: getConnectionToken(), useValue: conexion }],
  exports: [getConnectionToken()],
})
class ConexionDePrueba {}

describe('Comentarios HTTP 4A: módulo, validación, autoría y paginación', () => {
  let app: INestApplication;
  const jwt = new JwtService({
    secret: 'clave-exclusiva-tests-comentarios',
    signOptions: { expiresIn: '5m' },
  });
  const autorId = '000000000000000000000001',
    ajenoId = '000000000000000000000002';
  const publicacionId = '000000000000000000000011',
    otraPublicacionId = '000000000000000000000012';
  const comentarioId = '000000000000000000000101';
  const token = jwt.sign({ sub: autorId, perfil: 'usuario' });
  let publicaciones: any[], comentarios: any[];
  const fichas = [
    {
      _id: autorId,
      nombre: 'Lucía',
      apellido: 'Torres',
      imagenPerfil: '/lucia.png',
      correo: 'privado@club.test',
      passwordHash: 'hash-no-publico',
      password: 'no-publico',
      perfil: 'administrador',
    },
    {
      _id: ajenoId,
      nombre: 'Mateo',
      apellido: 'Ríos',
      imagenPerfil: '',
      correo: 'otro@club.test',
      passwordHash: 'otro-hash',
    },
  ];
  const cadena = (resolver: () => unknown) => ({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: async () => resolver(),
  });
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConexionDePrueba, ComentariosModule],
    })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(UsuariosService)
      .useValue(usuarios)
      .overrideProvider(CloudinaryService)
      .useValue({ subirImagen: vi.fn() })
      .compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });
  beforeEach(() => {
    publicaciones = [{ _id: new Types.ObjectId(publicacionId), activo: true }];
    comentarios = [];
    usuarios.findById
      .mockReset()
      .mockImplementation(
        async (id) => fichas.find((f) => f._id === id) ?? null,
      );
    buscarPublicacion
      .mockReset()
      .mockImplementation((filtro) =>
        cadena(
          () =>
            publicaciones.find(
              (p) =>
                p._id.toString() === filtro._id.toString() &&
                (!filtro.activo || p.activo !== false),
            ) ?? null,
        ),
      );
    guardar.mockReset().mockImplementation(async (datos) => {
      const ahora = new Date('2026-10-31T12:00:00Z');
      const doc = {
        ...datos,
        _id: new Types.ObjectId(comentarioId),
        createdAt: ahora,
        updatedAt: ahora,
        __v: 0,
      };
      comentarios.push(doc);
      return doc;
    });
    buscarComentario
      .mockReset()
      .mockImplementation((id) =>
        cadena(
          () =>
            comentarios.find((c) => c._id.toString() === id.toString()) ?? null,
        ),
      );
    actualizar.mockReset().mockImplementation((filtro, cambio) =>
      cadena(() => {
        const doc = comentarios.find(
          (c) =>
            c._id.toString() === filtro._id.toString() &&
            c.autorId.toString() === filtro.autorId.toString() &&
            c.publicacionId.toString() === filtro.publicacionId.toString(),
        );
        if (!doc) return null;
        Object.assign(doc, cambio.$set, {
          updatedAt: new Date('2026-10-31T13:00:00Z'),
        });
        return { ...doc };
      }),
    );
    // Doble acotado del pipeline: permite comprobar filtro/orden/skip/limit y total sin motor MongoDB.
    agregar.mockReset().mockImplementation((pipeline) =>
      cadena(() => {
        const filtro = pipeline[0].$match,
          orden = pipeline[1].$sort,
          faceta = pipeline[2].$facet;
        const filas = comentarios
          .filter(
            (c) =>
              c.publicacionId.toString() === filtro.publicacionId.toString(),
          )
          .sort((a, b) => {
            for (const [campo, direccion] of Object.entries(orden)) {
              const primero =
                campo === '_id' ? a[campo].toString() : a[campo].getTime();
              const segundo =
                campo === '_id' ? b[campo].toString() : b[campo].getTime();
              if (primero < segundo) return -Number(direccion);
              if (primero > segundo) return Number(direccion);
            }
            return 0;
          });
        const desde = faceta.comentarios[0].$skip,
          limite = faceta.comentarios[1].$limit;
        return [
          {
            comentarios: filas.slice(desde, desde + limite),
            conteo: filas.length ? [{ total: filas.length }] : [],
          },
        ];
      }),
    );
    poblar.mockReset().mockImplementation(async (filas, opciones) =>
      filas.map((c: any) => {
        const ficha = fichas.find((f) => f._id === c.autorId.toString());
        const autor: Record<string, unknown> | null = ficha
          ? { _id: ficha._id }
          : null;
        if (ficha && autor)
          for (const campo of opciones.select.split(' '))
            autor[campo] = ficha[campo as keyof typeof ficha];
        return { ...c, autorId: autor };
      }),
    );
  });
  afterAll(async () => {
    if (app) await app.close();
  });
  const ruta = (pub = publicacionId) => `/publicaciones/${pub}/comentarios`;
  const crear = (pub = publicacionId, identidad = token) =>
    request(app.getHttpServer())
      .post(ruta(pub))
      .set('Authorization', `Bearer ${identidad}`);
  const editar = (id = comentarioId, identidad = token) =>
    request(app.getHttpServer())
      .put(`/comentarios/${id}`)
      .set('Authorization', `Bearer ${identidad}`);
  function preparar(cantidad = 1) {
    for (let i = 1; i <= cantidad; i++)
      comentarios.push({
        _id: new Types.ObjectId((100 + i).toString().padStart(24, '0')),
        publicacionId: new Types.ObjectId(publicacionId),
        autorId: new Types.ObjectId(autorId),
        texto: `Comentario ${i}`,
        modificado: false,
        createdAt: new Date(Date.UTC(2026, 9, 31, 12, 0, i)),
        updatedAt: new Date(Date.UTC(2026, 9, 31, 12, 0, i)),
        datoInterno: 'no-publicar',
      });
  }
  function sinPrivados(comentario: any) {
    expect(Object.keys(comentario).sort()).toEqual(
      [
        '_id',
        'publicacionId',
        'autorId',
        'texto',
        'modificado',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
    expect(Object.keys(comentario.autorId).sort()).toEqual(
      ['_id', 'nombre', 'apellido', 'imagenPerfil'].sort(),
    );
    for (const campo of ['password', 'passwordHash', 'correo', 'perfil'])
      expect(comentario.autorId).not.toHaveProperty(campo);
  }

  it('crea 201 con autor JWT, texto recortado, referencias, fechas y marca false; devuelve autor mínimo', async () => {
    const respuesta = await crear()
      .send({ texto: '  Excelente pase al espacio  ' })
      .expect(201);
    expect(respuesta.body.mensaje).toBe('Comentario creado correctamente');
    expect(respuesta.body.comentario).toMatchObject({
      _id: comentarioId,
      publicacionId,
      texto: 'Excelente pase al espacio',
      modificado: false,
      createdAt: '2026-10-31T12:00:00.000Z',
      updatedAt: '2026-10-31T12:00:00.000Z',
      autorId: { _id: autorId, nombre: 'Lucía', imagenPerfil: '/lucia.png' },
    });
    expect(comentarios[0].autorId).toBeInstanceOf(Types.ObjectId);
    expect(comentarios[0].publicacionId).toBeInstanceOf(Types.ObjectId);
    expect(comentarios[0].autorId.toString()).toBe(autorId);
    sinPrivados(respuesta.body.comentario);
    expect(poblar).toHaveBeenCalledWith(expect.any(Array), {
      path: 'autorId',
      select: 'nombre apellido imagenPerfil',
    });
    expect(guardar.mock.calls[0][0]).not.toHaveProperty('createdAt');
  });
  it('acepta cookie existente como autenticación y texto en límite de 1000', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(ruta())
      .set('Cookie', `token=${token}`)
      .send({ texto: 'a'.repeat(1000) })
      .expect(201);
    expect(respuesta.body.comentario.texto).toHaveLength(1000);
  });
  it.each([
    '',
    '   ',
    12,
    null,
    true,
    {},
    [],
    'a'.repeat(1001),
    '⚽'.repeat(1001),
    '😀'.repeat(501),
  ])('rechaza texto inválido %j con 400 antes de guardar', async (texto) => {
    await crear().send({ texto }).expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });
  it('rechaza texto ausente', async () => {
    await crear().send({}).expect(400);
    expect(guardar).not.toHaveBeenCalled();
  });
  it.each(['autorId', 'publicacionId', 'modificado', 'createdAt', 'updatedAt'])(
    'rechaza propiedad de cliente %s en alta',
    async (campo) => {
      await crear()
        .send({
          texto: 'Correcto',
          [campo]: campo === 'modificado' ? true : ajenoId,
        })
        .expect(400);
      expect(guardar).not.toHaveBeenCalled();
    },
  );
  it('sin sesión o con JWT vencido/inválido rechaza creación y edición con 401', async () => {
    for (const identidad of [
      null,
      'invalido',
      jwt.sign({ sub: autorId }, { expiresIn: -1 }),
    ]) {
      let alta = request(app.getHttpServer())
        .post(ruta())
        .send({ texto: 'Comentario' });
      if (identidad) alta = alta.set('Authorization', `Bearer ${identidad}`);
      await alta.expect(401);
      // Construir la siguiente solicitud DESPUÉS de finalizar la anterior: Supertest administra
      // el puerto temporal de un servidor no escuchando y lo cierra al terminar cada pedido.
      let cambio = request(app.getHttpServer())
        .put(`/comentarios/${comentarioId}`)
        .send({ texto: 'Corrección' });
      if (identidad)
        cambio = cambio.set('Authorization', `Bearer ${identidad}`);
      await cambio.expect(401);
    }
    expect(guardar).not.toHaveBeenCalled();
    expect(actualizar).not.toHaveBeenCalled();
  });
  it('JWT firmado sin sujeto válido o de usuario eliminado no autoriza a escribir', async () => {
    for (const identidad of [
      jwt.sign({}),
      jwt.sign({ sub: 'incorrecto' }),
      jwt.sign({ sub: '000000000000000000000099' }),
    ]) {
      await crear(publicacionId, identidad)
        .send({ texto: 'Comentario' })
        .expect(401);
      await editar(comentarioId, identidad)
        .send({ texto: 'Corrección' })
        .expect(401);
    }
    expect(guardar).not.toHaveBeenCalled();
    expect(actualizar).not.toHaveBeenCalled();
  });
  it.each(['inexistente', 'inactiva'])(
    'alta y listado 404 sobre publicación %s',
    async (estado) => {
      if (estado === 'inexistente') publicaciones = [];
      else publicaciones[0].activo = false;
      await crear().send({ texto: 'Comentario' }).expect(404);
      await request(app.getHttpServer()).get(ruta()).expect(404);
      expect(guardar).not.toHaveBeenCalled();
      expect(agregar).not.toHaveBeenCalled();
    },
  );
  it('admite publicaciones antiguas sin activo sin reescribirlas', async () => {
    delete publicaciones[0].activo;
    await crear()
      .send({ texto: 'Comentario a una jugada antigua' })
      .expect(201);
    const respuesta = await request(app.getHttpServer())
      .get(ruta())
      .expect(200);
    expect(respuesta.body.total).toBe(1);
    expect(publicaciones[0]).not.toHaveProperty('activo');
    await editar().send({ texto: 'Corrección antigua' }).expect(200);
    expect(buscarPublicacion).toHaveBeenCalledWith({
      _id: new Types.ObjectId(publicacionId),
      activo: { $ne: false },
    });
  });
  it('lista públicamente de reciente a antiguo y pagina 8 comentarios como 3/3/2 sin mezclar otras publicaciones', async () => {
    preparar(8);
    comentarios.push({
      ...comentarios[0],
      _id: new Types.ObjectId(),
      publicacionId: new Types.ObjectId(otraPublicacionId),
      texto: 'Otra jugada',
    });
    const recibidos: string[] = [];
    for (const offset of [0, 3, 6]) {
      const respuesta = await request(app.getHttpServer())
        .get(ruta() + (offset ? `?offset=${offset}&limit=3` : ''))
        .expect(200);
      expect(respuesta.body).toMatchObject({
        total: 8,
        offset,
        limit: 3,
        hayMas: offset < 6,
      });
      expect(respuesta.body.comentarios).toHaveLength(offset === 6 ? 2 : 3);
      for (const comentario of respuesta.body.comentarios) {
        sinPrivados(comentario);
        expect(comentario.publicacionId).toBe(publicacionId);
        recibidos.push(comentario.texto);
      }
    }
    expect(recibidos).toEqual(
      Array.from({ length: 8 }, (_, i) => `Comentario ${8 - i}`),
    );
    expect(new Set(recibidos).size).toBe(8);
    const pipeline = agregar.mock.calls[0][0];
    expect(pipeline[0]).toEqual({
      $match: { publicacionId: new Types.ObjectId(publicacionId) },
    });
    expect(pipeline[1]).toEqual({ $sort: { createdAt: -1, _id: -1 } });
    expect(pipeline[2].$facet.comentarios.slice(0, 2)).toEqual([
      { $skip: 0 },
      { $limit: 3 },
    ]);
    expect(pipeline[2].$facet.conteo).toEqual([{ $count: 'total' }]);
    expect(poblar.mock.calls[0][0]).toHaveLength(3);
  });
  it('desempata fechas iguales por id descendente de manera estable', async () => {
    preparar(2);
    comentarios[1].createdAt = comentarios[0].createdAt;
    for (let vez = 0; vez < 2; vez++) {
      const primera = await request(app.getHttpServer())
        .get(ruta() + '?limit=1')
        .expect(200);
      const segunda = await request(app.getHttpServer())
        .get(ruta() + '?offset=1&limit=1')
        .expect(200);
      expect(primera.body.comentarios[0].texto).toBe('Comentario 2');
      expect(segunda.body.comentarios[0].texto).toBe('Comentario 1');
    }
  });
  it('devuelve total cero si no hay comentarios y página vacía más allá del final', async () => {
    const vacia = await request(app.getHttpServer()).get(ruta()).expect(200);
    expect(vacia.body).toEqual({
      comentarios: [],
      total: 0,
      offset: 0,
      limit: 3,
      hayMas: false,
    });
    preparar(2);
    const posterior = await request(app.getHttpServer())
      .get(ruta() + '?offset=3')
      .expect(200);
    expect(posterior.body).toEqual({
      comentarios: [],
      total: 2,
      offset: 3,
      limit: 3,
      hayMas: false,
    });
  });
  it('autor eliminado se presenta como null, sin datos inventados', async () => {
    preparar();
    comentarios[0].autorId = new Types.ObjectId('000000000000000000000099');
    const respuesta = await request(app.getHttpServer())
      .get(ruta())
      .expect(200);
    expect(respuesta.body.comentarios[0].autorId).toBeNull();
  });
  it.each([
    'offset=-1',
    'offset=1.5',
    'offset=',
    'offset=1e2',
    'offset=9007199254740992',
    'limit=0',
    'limit=-1',
    'limit=101',
    'limit=1.5',
    'limit=',
    'limit=NaN',
    'limit=3&limit=2',
    'autorId=otro',
  ])('rechaza query %s con 400', async (query) => {
    await request(app.getHttpServer())
      .get(ruta() + '?' + query)
      .expect(400);
    expect(agregar).not.toHaveBeenCalled();
  });
  it('admite el máximo de página 100', async () => {
    preparar();
    const respuesta = await request(app.getHttpServer())
      .get(ruta() + '?limit=100')
      .expect(200);
    expect(respuesta.body.limit).toBe(100);
  });
  it('edita solo el texto propio, marca modificado y cambia updatedAt sin alterar creación/referencias', async () => {
    preparar();
    const fechaOriginal = comentarios[0].createdAt.toISOString();
    const respuesta = await editar()
      .send({ texto: '  Corregí: pase con zurda  ' })
      .expect(200);
    expect(respuesta.body).toMatchObject({
      mensaje: 'Comentario editado correctamente',
      comentario: {
        texto: 'Corregí: pase con zurda',
        modificado: true,
        createdAt: fechaOriginal,
        updatedAt: '2026-10-31T13:00:00.000Z',
        publicacionId,
        autorId: { _id: autorId },
      },
    });
    sinPrivados(respuesta.body.comentario);
    expect(actualizar).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(comentarioId),
        autorId: new Types.ObjectId(autorId),
        publicacionId: new Types.ObjectId(publicacionId),
      },
      { $set: { texto: 'Corregí: pase con zurda', modificado: true } },
      { new: true, runValidators: true },
    );
    const listado = await request(app.getHttpServer()).get(ruta()).expect(200);
    expect(listado.body.comentarios[0].modificado).toBe(true);
  });
  it('una edición del mismo texto también queda marcada y no cambia el orden de creación', async () => {
    preparar(2);
    const original = comentarios[0].texto;
    await editar().send({ texto: original }).expect(200);
    const respuesta = await request(app.getHttpServer())
      .get(ruta())
      .expect(200);
    expect(respuesta.body.comentarios.map((c: any) => c.texto)).toEqual([
      'Comentario 2',
      'Comentario 1',
    ]);
    expect(respuesta.body.comentarios[1].modificado).toBe(true);
  });
  it.each(['usuario', 'administrador'])(
    'rechaza con 403 edición ajena aunque el JWT tenga perfil %s',
    async (perfil) => {
      preparar();
      const identidad = jwt.sign({ sub: ajenoId, perfil });
      await editar(comentarioId, identidad)
        .send({ texto: 'Cambio ajeno' })
        .expect(403);
      expect(comentarios[0].texto).toBe('Comentario 1');
      expect(comentarios[0].modificado).toBe(false);
      expect(actualizar).not.toHaveBeenCalled();
    },
  );
  it('comentario inexistente devuelve 404', async () => {
    await editar().send({ texto: 'Cambio' }).expect(404);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it.each(['inactiva', 'inexistente'])(
    'rechaza edición si la publicación está %s',
    async (estado) => {
      preparar();
      if (estado === 'inexistente') publicaciones = [];
      else publicaciones[0].activo = false;
      await editar().send({ texto: 'Cambio' }).expect(404);
      expect(actualizar).not.toHaveBeenCalled();
      expect(comentarios[0].modificado).toBe(false);
    },
  );
  it.each(['', '   ', 23, null, {}, 'a'.repeat(1001)])(
    'valida el nuevo texto %j con 400 sin modificar el anterior',
    async (texto) => {
      preparar();
      await editar().send({ texto }).expect(400);
      expect(actualizar).not.toHaveBeenCalled();
      expect(comentarios[0].texto).toBe('Comentario 1');
    },
  );
  it('PUT exige texto y rechaza elegir autor/publicación/marca/fecha desde cliente', async () => {
    preparar();
    await editar().send({}).expect(400);
    for (const campo of [
      'autorId',
      'publicacionId',
      'modificado',
      'createdAt',
      'updatedAt',
    ])
      await editar()
        .send({ texto: 'Corrección', [campo]: ajenoId })
        .expect(400);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it('IDs inválidos de publicación/comentario producen 400 antes de acceder a modelos', async () => {
    await crear('incorrecto').send({ texto: 'Comentario' }).expect(400);
    await request(app.getHttpServer()).get(ruta('incorrecto')).expect(400);
    await editar('incorrecto').send({ texto: 'Cambio' }).expect(400);
    expect(guardar).not.toHaveBeenCalled();
    expect(buscarPublicacion).not.toHaveBeenCalled();
    expect(buscarComentario).not.toHaveBeenCalled();
  });
  it('si desaparece el comentario entre lectura y escritura devuelve 404 sin éxito falso', async () => {
    preparar();
    actualizar.mockImplementationOnce(() => cadena(() => null));
    await editar().send({ texto: 'Cambio' }).expect(404);
    expect(comentarios[0].texto).toBe('Comentario 1');
  });
  it('no implementa eliminación de comentarios', async () => {
    preparar();
    await request(app.getHttpServer())
      .delete(`/comentarios/${comentarioId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(comentarios).toHaveLength(1);
  });
});
