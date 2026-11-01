import { Global, Module, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import request from 'supertest';
import { vi } from 'vitest';
import { ComentariosModule } from './comentarios.module.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { modeloUsuarioSesion } from '../testing/usuario-sesion.js';
import { ejecutarPipeline } from '../testing/agregacion-prueba.js';
import { ValidarOrigenMiddleware } from '../common/middlewares/validar-origen.middleware.js';

const id = (n: number) => new Types.ObjectId(n.toString().padStart(24, '0'));
const admin = {
  _id: id(1),
  nombre: 'Secretaria',
  apellido: 'Club',
  nombreUsuario: 'secretaria',
  perfil: 'administrador',
  activo: true,
};
const jugador = {
  _id: id(2),
  nombre: 'Ana',
  apellido: 'Goles',
  nombreUsuario: 'ana',
  perfil: 'usuario',
  activo: true,
};
let publicaciones: any[], comentarios: any[];
const consulta = (resolver: () => any) => ({
  select: vi.fn().mockReturnThis(),
  lean: vi.fn().mockReturnThis(),
  exec: async () => resolver(),
});
const usuarios = { findById: vi.fn() };
const agregarPublicaciones = vi.fn((pipeline) =>
  consulta(() => ejecutarPipeline(publicaciones, pipeline)),
);
const agregarComentarios = vi.fn((pipeline) =>
  consulta(() => ejecutarPipeline(comentarios, pipeline, { publicaciones })),
);
const poblar = vi.fn(async (filas, opciones) =>
  filas.map((fila: any) => {
    const autor = [admin, jugador].find(
      (u) => String(u._id) === String(fila.autorId),
    );
    return {
      ...fila,
      autorId: autor
        ? Object.fromEntries(
            ['_id', ...opciones.select.split(' ')].map((clave) => [
              clave,
              (autor as any)[clave],
            ]),
          )
        : null,
    };
  }),
);
const modeloPublicacion = {
  collection: { name: 'publicaciones' },
  aggregate: agregarPublicaciones,
  populate: poblar,
  findOne: (filtro: any) =>
    consulta(
      () =>
        publicaciones.find(
          (p) => String(p._id) === String(filtro._id) && p.activo !== false,
        ) ?? null,
    ),
  updateOne: (filtro: any, cambio: any) =>
    consulta(() => {
      const pub = publicaciones.find(
        (p) => String(p._id) === String(filtro._id) && p.activo !== false,
      );
      if (pub) Object.assign(pub, cambio.$set);
      return { matchedCount: pub ? 1 : 0 };
    }),
};
@Global()
@Module({
  providers: [
    {
      provide: getConnectionToken(),
      useValue: {
        models: {
          Publicacion: modeloPublicacion,
          Comentario: { aggregate: agregarComentarios },
          Usuario: modeloUsuarioSesion((valor) => usuarios.findById(valor)),
        },
      },
    },
  ],
  exports: [getConnectionToken()],
})
class ConexionEstadisticasPrueba {}

describe('Estadísticas 5B HTTP: módulos y agregaciones reales sobre persistencia simulada', () => {
  let app: INestApplication;
  const jwt = new JwtService({
    secret: 'clave-solo-pruebas-5b',
    signOptions: { expiresIn: '15m' },
  });
  const token = jwt.sign({ sub: String(admin._id), perfil: 'usuario' }); // El rol actual de DB debe prevalecer.
  const tokenJugador = jwt.sign({
    sub: String(jugador._id),
    perfil: 'administrador',
  });
  const rutas = [
    'publicaciones-por-usuario',
    'comentarios-totales',
    'comentarios-por-publicacion',
  ];
  const rango = { desde: '2026-10-01', hasta: '2026-10-02' };
  const url = (ruta: string) => '/estadisticas/' + ruta;
  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [ConexionEstadisticasPrueba, ComentariosModule],
    })
      .overrideProvider(JwtService)
      .useValue(jwt)
      .overrideProvider(UsuariosService)
      .useValue(usuarios)
      .overrideProvider(CloudinaryService)
      .useValue({ subirImagen: vi.fn() })
      .compile();
    app = modulo.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const origen = new ValidarOrigenMiddleware();
    app.use(origen.use.bind(origen));
    await app.init();
  });
  afterAll(async () => app?.close());
  beforeEach(() => {
    vi.clearAllMocks();
    usuarios.findById.mockImplementation(
      async (valor) =>
        [admin, jugador].find((u) => String(u._id) === valor) ?? null,
    );
    const pub = (
      n: number,
      autor: number,
      fecha: string,
      activo: boolean | undefined = true,
    ) => ({
      _id: id(n),
      autorId: id(autor),
      titulo: 'Jugada ' + n,
      descripcion: 'Pase de gol',
      createdAt: new Date(fecha),
      activo,
      likes: [],
    });
    publicaciones = [
      pub(11, 2, '2026-10-01T03:00:00.000Z'),
      pub(12, 2, '2026-10-03T02:59:59.999Z', undefined),
      pub(13, 1, '2026-10-02T10:00:00Z'),
      pub(14, 2, '2026-10-02T10:00:00Z', false),
      pub(15, 2, '2026-10-01T02:59:59.999Z'),
      pub(16, 2, '2026-10-03T03:00:00Z'),
    ];
    const com = (n: number, pubId: number, fecha: string) => ({
      _id: id(n),
      publicacionId: id(pubId),
      autorId: id(2),
      texto: 'Muy buena',
      createdAt: new Date(fecha),
    });
    comentarios = [
      com(101, 11, '2026-10-01T03:00:00Z'),
      com(102, 11, '2026-10-03T02:59:59.999Z'),
      com(103, 12, '2026-10-02T15:00:00Z'),
      com(104, 14, '2026-10-02T15:00:00Z'),
      com(105, 15, '2026-10-02T15:00:00Z'),
      com(106, 99, '2026-10-02T15:00:00Z'),
      com(107, 11, '2026-10-01T02:59:59.999Z'),
      com(108, 11, '2026-10-03T03:00:00Z'),
    ];
  });
  it.each(rutas)(
    '%s: sin sesión 401, usuario común 403 y administrador 200',
    async (ruta) => {
      await request(app.getHttpServer())
        .get(url(ruta))
        .query(rango)
        .expect(401);
      await request(app.getHttpServer())
        .get(url(ruta))
        .query(rango)
        .set('Authorization', 'Bearer ' + tokenJugador)
        .expect(403);
      await request(app.getHttpServer())
        .get(url(ruta))
        .query(rango)
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
    },
  );
  it('agrupa publicaciones por usuario, incluye legado y límites, excluye bajas/fuera de rango', async () => {
    const res = await request(app.getHttpServer())
      .get(url(rutas[0]))
      .query(rango)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(res.body).toEqual({
      ...rango,
      zonaHoraria: 'UTC-03:00',
      datos: [
        {
          usuarioId: String(jugador._id),
          nombre: 'Ana Goles',
          nombreUsuario: 'ana',
          cantidad: 2,
        },
        {
          usuarioId: String(admin._id),
          nombre: 'Secretaria Club',
          nombreUsuario: 'secretaria',
          cantidad: 1,
        },
      ],
    });
    expect(agregarPublicaciones.mock.calls[0][0][0]).toEqual({
      $match: {
        activo: { $ne: false },
        createdAt: {
          $gte: new Date('2026-10-01T03:00:00Z'),
          $lt: new Date('2026-10-03T03:00:00Z'),
        },
      },
    });
    expect(poblar.mock.calls[0][1].select).toBe(
      'nombre apellido nombreUsuario',
    );
    expect(JSON.stringify(res.body)).not.toMatch(/password|correo|hash|texto/);
  });
  it('cuenta comentarios por su propia fecha, excluyendo publicaciones inactivas o inexistentes', async () => {
    const res = await request(app.getHttpServer())
      .get(url(rutas[1]))
      .query(rango)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(res.body).toEqual({
      ...rango,
      zonaHoraria: 'UTC-03:00',
      total: 4,
      dias: [
        { fecha: '2026-10-01', cantidad: 1 },
        { fecha: '2026-10-02', cantidad: 3 },
      ],
    });
    const etapas = agregarComentarios.mock.calls[0][0];
    expect(etapas[0].$match.createdAt.$lt).toEqual(
      new Date('2026-10-03T03:00:00Z'),
    );
    expect(etapas[1].$lookup.from).toBe('publicaciones');
    expect(etapas[4].$facet.dias[0].$group._id.$dateToString.timezone).toBe(
      '-03:00',
    );
  });
  it('agrupa comentarios por publicación sin exigir que la publicación se haya creado en el rango', async () => {
    const res = await request(app.getHttpServer())
      .get(url(rutas[2]))
      .query(rango)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(res.body.datos).toEqual([
      { publicacionId: String(id(11)), titulo: 'Jugada 11', cantidad: 2 },
      { publicacionId: String(id(12)), titulo: 'Jugada 12', cantidad: 1 },
      { publicacionId: String(id(15)), titulo: 'Jugada 15', cantidad: 1 },
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(
      /autorId|texto|password|correo/,
    );
  });
  it.each(rutas)(
    '%s: mismo día incluye todas sus horas en zona fija',
    async (ruta) => {
      const res = await request(app.getHttpServer())
        .get(url(ruta))
        .query({ desde: '2026-10-02', hasta: '2026-10-02' })
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
      if (ruta === rutas[0])
        expect(
          res.body.datos.reduce((n: number, d: any) => n + d.cantidad, 0),
        ).toBe(2);
      else if (ruta === rutas[1]) expect(res.body.total).toBe(3);
      else
        expect(
          res.body.datos.reduce((n: number, d: any) => n + d.cantidad, 0),
        ).toBe(3);
    },
  );
  for (const ruta of rutas) {
    it.each([
      {},
      { desde: '2026-10-01' },
      { ...rango, desde: '01/10/2026' },
      { ...rango, desde: '2026-02-30' },
      { ...rango, hasta: '2026-13-01' },
      { desde: '2026-10-03', hasta: '2026-10-01' },
      { ...rango, desde: '0000-01-01' },
      { ...rango, campoAjeno: 'x' },
      { ...rango, desde: ['2026-10-01', '2026-10-02'] },
    ])(
      `${ruta}: rechaza query inválida %# antes de consultar`,
      async (query) => {
        await request(app.getHttpServer())
          .get(url(ruta))
          .query(query)
          .set('Authorization', 'Bearer ' + token)
          .expect(400);
        expect(agregarPublicaciones).not.toHaveBeenCalled();
        expect(agregarComentarios).not.toHaveBeenCalled();
      },
    );
  }
  it.each(rutas)(
    '%s: acepta año bisiesto real y no devuelve datos de otro rango',
    async (ruta) => {
      const res = await request(app.getHttpServer())
        .get(url(ruta))
        .query({ desde: '2024-02-29', hasta: '2024-02-29' })
        .set('Authorization', 'Bearer ' + token)
        .expect(200);
      if (ruta === rutas[1])
        expect(res.body).toMatchObject({ total: 0, dias: [] });
      else expect(res.body.datos).toEqual([]);
    },
  );
  it('moderación admin conserva documentos, retira feed/detalle/comentarios públicos y actualiza reportes', async () => {
    const antes = publicaciones.length,
      notasAntes = comentarios.length;
    await request(app.getHttpServer())
      .delete('/publicaciones/' + id(11))
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(publicaciones.length).toBe(antes);
    expect(comentarios.length).toBe(notasAntes);
    expect(
      publicaciones.find((p) => String(p._id) === String(id(11))).activo,
    ).toBe(false);
    const feed = await request(app.getHttpServer())
      .get('/publicaciones')
      .expect(200);
    expect(
      feed.body.publicaciones.some((p: any) => p._id === String(id(11))),
    ).toBe(false);
    await request(app.getHttpServer())
      .get('/publicaciones/' + id(11))
      .expect(404);
    await request(app.getHttpServer())
      .get('/publicaciones/' + id(11) + '/comentarios')
      .expect(404);
    const reporte = await request(app.getHttpServer())
      .get(url(rutas[1]))
      .query(rango)
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(reporte.body.total).toBe(2);
  });
  it('usuario normal no modera una publicación ajena; sí puede retirar la propia', async () => {
    await request(app.getHttpServer())
      .delete('/publicaciones/' + id(13))
      .set('Authorization', 'Bearer ' + tokenJugador)
      .expect(403);
    await request(app.getHttpServer())
      .delete('/publicaciones/' + id(11))
      .set('Authorization', 'Bearer ' + tokenJugador)
      .expect(200);
  });
  it('no convierte un fallo de agregación en un reporte vacío exitoso', async () => {
    agregarComentarios.mockImplementationOnce(() =>
      consulta(() => {
        throw new Error('MongoDB no disponible');
      }),
    );
    await request(app.getHttpServer())
      .get(url(rutas[1]))
      .query(rango)
      .set('Authorization', 'Bearer ' + token)
      .expect(500);
  });
});
