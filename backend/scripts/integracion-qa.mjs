// Ensayo REAL y opt-in: Nest/Mongoose/Atlas/Cloudinary, sin respuestas simuladas.
// Ejecutar desde backend con --env-file=.env y --autorizar-escrituras-qa.
// Nunca usa la base de la URI original: fija futbolcrack_qa antes de importar AppModule.
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

if (!process.argv.includes('--autorizar-escrituras-qa')) {
  console.log(
    'Requiere autorización explícita y --autorizar-escrituras-qa. No se ejecutó ningún ensayo.',
  );
  process.exit(1);
}
const backend = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const frontend = path.resolve(backend, '../frontend');
const basePermitida = 'futbolcrack_qa';
const run = randomBytes(4).toString('hex');
const prefijo = `qa5e_${run}`;
const carpetaCloud = `futbolcrack/qa/${prefijo}`;
const trabajo = path.resolve(
  backend,
  'node_modules/.cache/futbolcrack_qa',
  prefijo,
);
const web = path.join(trabajo, 'web');
const origen = 'http://localhost:4200';
const api = 'http://localhost:4301';
const imagenes = new Set();
const informe = {
  ejecucion: prefijo,
  base: basePermitida,
  entorno: 'Nest local + Atlas QA real + Cloudinary QA real',
  casos: [],
  limpieza: null,
};
let app, conexion, servidorWeb, usuarios, publicaciones, comentarios;
const credenciales = Object.fromEntries(
  ['a', 'b', 'admin', 'ui'].map((rol) => [
    rol,
    {
      identificador: `${prefijo}_${rol}`,
      password: 'A1' + randomBytes(12).toString('hex'),
    },
  ]),
);
const sesiones = new Map(); // Cookies exclusivamente en memoria: no se guardan ni imprimen.
const propios = new Set();
let finalizando = false;
let namespaceVerificado = false;
function cookie(respuesta) {
  return respuesta.headers.get('set-cookie')?.split(';')[0] ?? '';
}
function cuerpoRegistro(rol) {
  const c = credenciales[rol];
  return {
    nombre: 'Ensayo',
    apellido: 'Futbol',
    correo: c.identificador + '@example.test',
    nombreUsuario: c.identificador,
    password: c.password,
    repetirPassword: c.password,
    fechaNacimiento: '2000-01-01',
    descripcion: 'Cuenta ficticia exclusiva de QA ' + prefijo,
  };
}
async function pedir(
  ruta,
  { metodo = 'GET', rol, datos, token, form, origin = origen } = {},
) {
  const headers = { Origin: origin };
  const valorCookie = token ?? (rol ? sesiones.get(rol) : '');
  if (valorCookie) headers.Cookie = valorCookie;
  let body;
  if (form) body = form;
  else if (datos !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(datos);
  }
  const respuesta = await fetch(api + ruta, {
    method: metodo,
    headers,
    body,
    signal: AbortSignal.timeout(30000),
  });
  let json;
  try {
    json = await respuesta.json();
  } catch {}
  return { respuesta, json, status: respuesta.status };
}
async function caso(id, descripcion, ejecutar) {
  try {
    const evidencia = await ejecutar();
    informe.casos.push({
      id,
      descripcion,
      resultado: 'Aprobado',
      evidencia:
        evidencia ?? 'Aserciones sobre respuesta/persistencia real correctas',
    });
  } catch (e) {
    informe.casos.push({
      id,
      descripcion,
      resultado: 'Fallido',
      evidencia: {
        tipo: e.name,
        codigo: e.code ?? null,
        linea: /integracion-qa.mjs:(\d+):/.exec(e.stack ?? '')?.[1],
        actual: ['number', 'boolean'].includes(typeof e.actual)
          ? e.actual
          : undefined,
        esperado: ['number', 'boolean'].includes(typeof e.expected)
          ? e.expected
          : undefined,
      },
    });
  }
  await guardarInforme();
  const ultimo = informe.casos.at(-1);
  console.log(JSON.stringify({ caso: id, resultado: ultimo.resultado }));
}
async function guardarInforme() {
  await fs.writeFile(
    path.join(trabajo, 'resultado-publico.json'),
    JSON.stringify(informe, null, 2),
  );
}
async function iniciar() {
  assert(process.env.CONNECTION_STRING, 'Falta configuración de Atlas');
  const uri = new URL(process.env.CONNECTION_STRING);
  assert(['mongodb:', 'mongodb+srv:'].includes(uri.protocol));
  uri.pathname = '/' + basePermitida;
  process.env.CONNECTION_STRING = uri.toString();
  process.env.JWT_SECRET = randomBytes(48).toString('hex'); // Clave efímera de este Nest QA, nunca la productiva.
  process.env.NODE_ENV = 'development';
  process.env.FRONTEND_URL = origen;
  await fs.mkdir(trabajo, { recursive: true });
  await fs.writeFile(
    path.join(trabajo, 'acceso-privado.json'),
    JSON.stringify({ credenciales, api, origen }),
    { mode: 0o600 },
  );
  const { AppModule } = await import('../dist/app.module.js');
  app = await NestFactory.create(AppModule, {
    logger: false,
    cors: { origin: [origen], credentials: true },
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.init();
  conexion = app.get(getConnectionToken());
  assert.equal(conexion.name, basePermitida);
  usuarios = conexion.model('Usuario');
  publicaciones = conexion.model('Publicacion');
  comentarios = conexion.model('Comentario');
  // También reservamos las altas administrativas antes de escribir: ninguna cuenta previa puede pertenecer al ensayo.
  const nombres = [
    ...Object.values(credenciales).map((c) => c.identificador),
    `${prefijo}_extra`,
    `${prefijo}_ea`,
  ];
  assert.equal(
    await usuarios.countDocuments({ nombreUsuario: { $in: nombres } }),
    0,
    'Colisión de namespace QA',
  );
  namespaceVerificado = true;
  await usuarios.init();
  await publicaciones.init();
  await comentarios.init();
  const { CloudinaryService } =
    await import('../dist/cloudinary/cloudinary.service.js');
  const servicioCloud = app.get(CloudinaryService);
  const subirOriginal = servicioCloud.subirImagen.bind(servicioCloud);
  // Adaptador de AISLAMIENTO, no mock: el método productivo y la subida HTTP real se ejecutan.
  servicioCloud.subirImagen = (archivo, carpeta = 'perfiles') =>
    subirOriginal(archivo, `qa/${prefijo}/${carpeta}`);
  const streamOriginal = cloudinary.uploader.upload_stream.bind(
    cloudinary.uploader,
  );
  cloudinary.uploader.upload_stream = (opciones, callback) => {
    assert(
      opciones.folder.startsWith(carpetaCloud + '/'),
      'Subida fuera del namespace autorizado',
    );
    return streamOriginal(opciones, (error, recurso) => {
      if (recurso?.public_id) imagenes.add(recurso.public_id);
      callback(error, recurso);
    });
  };
  await app.listen(4301, '127.0.0.1');
  // Copia del build: único cambio es origen API local. Se regeneran hashes con Angular oficial.
  await fs.cp(path.join(frontend, 'dist/frontend/browser'), web, {
    recursive: true,
  });
  for (const nombre of await fs.readdir(web))
    if (nombre.endsWith('.js') && !nombre.includes('worker')) {
      const archivo = path.join(web, nombre);
      const texto = await fs.readFile(archivo, 'utf8');
      await fs.writeFile(
        archivo,
        texto.replaceAll('https://futbol-crackbackend.vercel.app', api),
      );
    }
  const { Generator } = await import(
    pathToFileURL(
      path.join(
        frontend,
        'node_modules/@angular/service-worker/fesm2022/config.mjs',
      ),
    )
  );
  const { createHash } = await import('node:crypto');
  async function listar(directorio, pref = '') {
    const salida = [];
    for (const e of await fs.readdir(directorio, { withFileTypes: true })) {
      const relativo = pref + '/' + e.name;
      if (e.isDirectory())
        salida.push(...(await listar(path.join(directorio, e.name), relativo)));
      else salida.push(relativo);
    }
    return salida;
  }
  const archivos = await listar(web);
  const sistema = {
    list: async () => archivos,
    read: async (f) => fs.readFile(path.join(web, f), 'utf8'),
    hash: async (f) =>
      createHash('sha1')
        .update(await fs.readFile(path.join(web, f)))
        .digest('hex'),
    write: async (f, t) => fs.writeFile(path.join(web, f), t),
  };
  const config = JSON.parse(
    await fs.readFile(path.join(frontend, 'ngsw-config.json'), 'utf8'),
  );
  await fs.writeFile(
    path.join(web, 'ngsw.json'),
    JSON.stringify(await new Generator(sistema, '/').process(config)),
  );
  const tipos = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.ico': 'image/x-icon',
  };
  servidorWeb = createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405).end();
        return;
      }
      const ruta = decodeURIComponent(new URL(req.url, origen).pathname);
      let archivo = path.resolve(web, '.' + ruta);
      const relativa = path.relative(web, archivo);
      if (relativa.startsWith('..') || path.isAbsolute(relativa)) {
        res.writeHead(403).end();
        return;
      }
      try {
        if (!(await fs.stat(archivo)).isFile()) throw new Error();
      } catch {
        if (path.extname(ruta)) {
          res.writeHead(404).end();
          return;
        }
        archivo = path.join(web, 'index.html');
      }
      res.setHeader(
        'Content-Type',
        (tipos[path.extname(archivo)] ?? 'application/octet-stream') +
          '; charset=utf-8',
      );
      res.setHeader('Cache-Control', 'no-cache');
      res.writeHead(200);
      res.end(req.method === 'HEAD' ? undefined : await fs.readFile(archivo));
    } catch {
      res.writeHead(500).end();
    }
  });
  await new Promise((ok, no) => {
    servidorWeb.once('error', no);
    servidorWeb.listen(4200, '127.0.0.1', ok);
  });
  console.log(
    JSON.stringify({
      estado: 'QA iniciada',
      base: basePermitida,
      ejecucion: prefijo,
      origen,
      api,
      pid: process.pid,
    }),
  );
}

async function ensayar() {
  await caso(
    'M02-registro',
    'Registro real de tres cuentas ficticias por endpoint de la aplicación',
    async () => {
      for (const rol of ['a', 'b', 'admin']) {
        const r = await pedir('/auth/registro', {
          metodo: 'POST',
          datos: cuerpoRegistro(rol),
        });
        assert.equal(r.status, 201);
        assert(r.json.usuario.id);
        propios.add(r.json.usuario.id);
        const ficha = await usuarios
          .findOne({ nombreUsuario: credenciales[rol].identificador })
          .select('+passwordHash')
          .lean();
        assert(ficha && ficha.perfil === 'usuario');
        assert(!('password' in ficha));
        assert(ficha.passwordHash.startsWith('$2'));
      }
      return { cuentas: 3, persistenciaAtlas: true, rolPublicoForzado: true };
    },
  );
  // Procedimiento local autorizado: solo promover la cuenta recién registrada de ESTE ensayo.
  const admin = await usuarios.findOne({
    nombreUsuario: credenciales.admin.identificador,
  });
  if (!admin || !propios.has(admin.id))
    throw new Error('No se permite bootstrap sobre cuenta ajena');
  await usuarios.updateOne(
    {
      _id: admin._id,
      nombreUsuario: credenciales.admin.identificador,
      perfil: 'usuario',
    },
    { $set: { perfil: 'administrador' } },
  );
  await caso(
    'M02-login',
    'Login real y persistencia, cookie HttpOnly y exp-iat 900',
    async () => {
      for (const rol of ['a', 'b', 'admin']) {
        const r = await pedir('/auth/login', {
          metodo: 'POST',
          datos: credenciales[rol],
        });
        assert.equal(r.status, 200);
        const c = cookie(r.respuesta);
        assert(c);
        sesiones.set(rol, c);
        assert(/httponly/i.test(r.respuesta.headers.get('set-cookie')));
        assert.equal(
          Date.parse(r.json.expiraEn) - Date.parse(r.json.emitidaEn),
          900000,
        );
        assert(!('access_token' in r.json));
        assert(!('passwordHash' in r.json.usuario));
      }
      return {
        cookieHttpOnly: true,
        duracionSegundos: 900,
        sinTokenEnJSON: true,
      };
    },
  );
  await caso(
    'M18-credenciales',
    'Login incorrecto y registro duplicado',
    async () => {
      assert.equal(
        (
          await pedir('/auth/login', {
            metodo: 'POST',
            datos: { ...credenciales.a, password: 'NoEsLaClave8' },
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await pedir('/auth/registro', {
            metodo: 'POST',
            datos: cuerpoRegistro('a'),
          })
        ).status,
        409,
      );
    },
  );
  await caso(
    'M04-autorizar-renovar',
    'Autorización/renovación con cookie emitida por Nest QA',
    async () => {
      const r = await pedir('/auth/autorizar', {
        metodo: 'POST',
        rol: 'a',
        datos: {},
      });
      assert.equal(r.status, 200);
      assert.equal(r.respuesta.headers.get('set-cookie'), null);
      await new Promise((ok) => setTimeout(ok, 1100));
      const nueva = await pedir('/auth/refrescar', {
        metodo: 'POST',
        rol: 'a',
        datos: {},
      });
      assert.equal(nueva.status, 200);
      assert(Date.parse(nueva.json.expiraEn) > Date.parse(r.json.expiraEn));
      sesiones.set('a', cookie(nueva.respuesta));
      const jwt = app.get(JwtService);
      const vencido = jwt.sign(
        { sub: r.json.usuario.id, perfil: 'usuario' },
        { expiresIn: -1 },
      );
      assert.equal(
        (
          await pedir('/auth/autorizar', {
            metodo: 'POST',
            token: 'token=' + vencido,
            datos: {},
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await pedir('/auth/refrescar', {
            metodo: 'POST',
            token: 'token=' + vencido,
            datos: {},
          })
        ).status,
        401,
      );
      return {
        renovacionVoluntaria: true,
        fixtureJwtFirmadoVencidoRechazado: true,
        relojNoSimulado: true,
      };
    },
  );
  await caso('M06-perfil', 'Ficha real de jugador desde Atlas', async () => {
    const r = await pedir('/auth/me', { rol: 'a' });
    assert.equal(r.status, 200);
    assert.equal(r.json.nombreUsuario, credenciales.a.identificador);
    assert(!('passwordHash' in r.json));
  });
  let publicacion;
  await caso(
    'M07-imagen',
    'POST multipart con PNG sintético, persistencia y lectura de imagen real',
    async () => {
      const f = new FormData();
      f.set('titulo', 'Jugada QA ' + prefijo);
      f.set('descripcion', 'Pase de ensayo aislado');
      f.set(
        'imagen',
        new Blob(
          [await fs.readFile(path.join(frontend, 'public/icons/icon-192.png'))],
          { type: 'image/png' },
        ),
        'qa-sintetica.png',
      );
      const r = await pedir('/publicaciones', {
        metodo: 'POST',
        rol: 'a',
        form: f,
      });
      assert.equal(r.status, 201);
      publicacion = r.json._id;
      assert(publicacion);
      const ficha = await publicaciones.findById(publicacion).lean();
      assert(ficha && ficha.multimediaUrl.startsWith('https://'));
      assert(ficha.multimediaUrl.includes('/' + carpetaCloud + '/'));
      const imagen = await fetch(ficha.multimediaUrl, {
        signal: AbortSignal.timeout(20000),
      });
      assert.equal(imagen.status, 200);
      assert((imagen.headers.get('content-type') ?? '').startsWith('image/'));
      const detalle = await pedir('/publicaciones/' + publicacion);
      assert.equal(detalle.status, 200);
      assert.equal(detalle.json.multimediaUrl, ficha.multimediaUrl);
      return {
        uploadCloudinaryReal: true,
        atlasPersistido: true,
        imagenHTTP: 200,
        detalleHTTP: 200,
      };
    },
  );
  await caso('M08-likes', 'Me gusta real, duplicado 409 y retiro', async () => {
    assert(publicacion);
    const alta = await pedir(`/publicaciones/${publicacion}/likes`, {
      metodo: 'POST',
      rol: 'b',
      datos: {},
    });
    assert.equal(alta.status, 201);
    assert.equal(alta.json.cantidadLikes, 1);
    assert.equal(
      (
        await pedir(`/publicaciones/${publicacion}/likes`, {
          metodo: 'POST',
          rol: 'b',
          datos: {},
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await pedir(`/publicaciones/${publicacion}/likes`, {
          metodo: 'DELETE',
          rol: 'b',
        })
      ).status,
      200,
    );
  });
  await caso(
    'M08-paginacion',
    '23 publicaciones reales de A, páginas 10/10/3 y orden',
    async () => {
      assert(publicacion);
      for (let i = 2; i <= 23; i++)
        assert.equal(
          (
            await pedir('/publicaciones', {
              metodo: 'POST',
              rol: 'a',
              datos: {
                titulo: `QA ${prefijo} jugada ${i}`,
                descripcion: 'Texto ficticio aislado',
              },
            })
          ).status,
          201,
        );
      const autor = await usuarios.findOne({
        nombreUsuario: credenciales.a.identificador,
      });
      for (const [offset, cantidad] of [
        [0, 10],
        [10, 10],
        [20, 3],
      ]) {
        const r = await pedir(
          `/publicaciones?usuarioId=${autor.id}&limit=10&offset=${offset}&orden=fecha`,
        );
        assert.equal(r.status, 200);
        assert.equal(r.json.total, 23);
        assert.equal(r.json.publicaciones.length, cantidad);
      }
      assert.equal(
        (
          await pedir(`/publicaciones/${publicacion}/likes`, {
            metodo: 'POST',
            rol: 'b',
            datos: {},
          })
        ).status,
        201,
      );
      const populares = await pedir(
        `/publicaciones?usuarioId=${autor.id}&orden=likes&limit=10&offset=0`,
      );
      assert.equal(populares.status, 200);
      assert.equal(populares.json.publicaciones[0]._id, publicacion);
      return { paginas: [10, 10, 3], total: 23, ordenLikesReal: true };
    },
  );
  let comentario;
  await caso(
    'M10-comentarios',
    'Alta, páginas 3/3/2 y edición de autor; ajeno 403',
    async () => {
      assert(publicacion);
      for (let i = 1; i <= 8; i++) {
        const r = await pedir(`/publicaciones/${publicacion}/comentarios`, {
          metodo: 'POST',
          rol: 'a',
          datos: { texto: `Comentario ficticio ${i} de ${prefijo}` },
        });
        assert.equal(r.status, 201);
        comentario ??= r.json.comentario._id;
      }
      for (const [offset, cantidad] of [
        [0, 3],
        [3, 3],
        [6, 2],
      ]) {
        const r = await pedir(
          `/publicaciones/${publicacion}/comentarios?offset=${offset}&limit=3`,
        );
        assert.equal(r.status, 200);
        assert.equal(r.json.total, 8);
        assert.equal(r.json.comentarios.length, cantidad);
      }
      assert.equal(
        (
          await pedir('/comentarios/' + comentario, {
            metodo: 'PUT',
            rol: 'b',
            datos: { texto: 'No autorizado' },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await pedir('/comentarios/' + comentario, {
            metodo: 'PUT',
            rol: 'admin',
            datos: { texto: 'No autorizado' },
          })
        ).status,
        403,
      );
      const edicion = await pedir('/comentarios/' + comentario, {
        metodo: 'PUT',
        rol: 'a',
        datos: { texto: 'Editado por su autor QA' },
      });
      assert.equal(edicion.status, 200);
      assert.equal(edicion.json.comentario.modificado, true);
    },
  );
  await caso(
    'M11-administracion',
    'Usuario común 403, admin lista y crea roles con API real',
    async () => {
      assert.equal((await pedir('/usuarios', { rol: 'b' })).status, 403);
      const lista = await pedir('/usuarios', { rol: 'admin' });
      assert.equal(lista.status, 200);
      assert(Array.isArray(lista.json));
      assert(
        lista.json.every((u) => !('passwordHash' in u) && !('password' in u)),
      );
      for (const [n, perfil] of [
        ['extra', 'usuario'],
        ['ea', 'administrador'],
      ]) {
        const nombre = `${prefijo}_${n}`;
        assert.equal(
          await usuarios.countDocuments({ nombreUsuario: nombre }),
          0,
        );
        const r = await pedir('/usuarios', {
          metodo: 'POST',
          rol: 'admin',
          datos: {
            ...cuerpoRegistro('b'),
            nombreUsuario: nombre,
            correo: nombre + '@example.test',
            perfil,
          },
        });
        assert.equal(r.status, 201);
        propios.add(r.json.usuario._id);
        assert.equal(r.json.usuario.perfil, perfil);
      }
    },
  );
  const dia = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
  const rango = `desde=${dia}&hasta=${dia}`;
  await caso(
    'M13-estadisticas',
    'Agregaciones reales Atlas, rangos propios y 403 común',
    async () => {
      const rutas = [
        'publicaciones-por-usuario',
        'comentarios-totales',
        'comentarios-por-publicacion',
      ];
      for (const ruta of rutas) {
        assert.equal(
          (await pedir(`/estadisticas/${ruta}?${rango}`, { rol: 'b' })).status,
          403,
        );
        const r = await pedir(`/estadisticas/${ruta}?${rango}`, {
          rol: 'admin',
        });
        assert.equal(r.status, 200);
        if (ruta === 'comentarios-totales') assert.equal(r.json.total, 8);
        else if (ruta === 'publicaciones-por-usuario')
          assert.equal(
            r.json.datos.find(
              (d) => d.nombreUsuario === credenciales.a.identificador,
            ).cantidad,
            23,
          );
        else
          assert.equal(
            r.json.datos.find((d) => d.publicacionId === publicacion).cantidad,
            8,
          );
      }
      assert.equal(
        (
          await pedir(
            '/estadisticas/comentarios-totales?desde=2026-01-02&hasta=2026-01-01',
            { rol: 'admin' },
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await pedir(
            '/estadisticas/comentarios-totales?desde=1900-01-01&hasta=1900-01-01',
            { rol: 'admin' },
          )
        ).json.total,
        0,
      );
    },
  );
  await caso(
    'M09-baja-permisos',
    'Ajeno no elimina; admin baja y retira detalle/comentarios/reportes',
    async () => {
      assert.equal(
        (
          await pedir('/publicaciones/' + publicacion, {
            metodo: 'DELETE',
            rol: 'b',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await pedir('/publicaciones/' + publicacion, {
            metodo: 'DELETE',
            rol: 'admin',
          })
        ).status,
        200,
      );
      assert(await publicaciones.exists({ _id: publicacion, activo: false }));
      assert.equal(
        await comentarios.countDocuments({
          publicacionId: new Types.ObjectId(publicacion),
        }),
        8,
      );
      assert.equal((await pedir('/publicaciones/' + publicacion)).status, 404);
      assert.equal(
        (await pedir(`/publicaciones/${publicacion}/comentarios`)).status,
        404,
      );
      assert.equal(
        (
          await pedir(`/estadisticas/comentarios-totales?${rango}`, {
            rol: 'admin',
          })
        ).json.total,
        0,
      );
    },
  );
  await caso(
    'M12-habilitacion',
    'Baja jugador bloquea login/JWT previo/renovación; habilitar recupera',
    async () => {
      const b = await usuarios.findOne({
        nombreUsuario: credenciales.b.identificador,
      });
      assert(b);
      assert.equal(
        (await pedir('/usuarios/' + b.id, { metodo: 'DELETE', rol: 'admin' }))
          .status,
        200,
      );
      for (const ruta of ['/auth/autorizar', '/auth/refrescar'])
        assert.equal(
          (await pedir(ruta, { metodo: 'POST', rol: 'b', datos: {} })).status,
          401,
        );
      assert.equal((await pedir('/auth/me', { rol: 'b' })).status, 401);
      assert.equal(
        (await pedir('/auth/login', { metodo: 'POST', datos: credenciales.b }))
          .status,
        401,
      );
      assert.equal(
        (
          await pedir('/usuarios/' + b.id + '/habilitar', {
            metodo: 'POST',
            rol: 'admin',
            datos: {},
          })
        ).status,
        200,
      );
      assert.equal((await pedir('/auth/me', { rol: 'b' })).status, 200);
      const adm = await usuarios.findOne({
        nombreUsuario: credenciales.admin.identificador,
      });
      assert.equal(
        (await pedir('/usuarios/' + adm.id, { metodo: 'DELETE', rol: 'admin' }))
          .status,
        409,
      );
    },
  );
  await caso(
    'M05-logout',
    'Logout real emite expiración de cookie; sin cookie la identidad es 401',
    async () => {
      const r = await pedir('/auth/logout', {
        metodo: 'POST',
        rol: 'b',
        datos: {},
      });
      assert.equal(r.status, 200);
      assert(/expires=/i.test(r.respuesta.headers.get('set-cookie')));
      sesiones.delete('b');
      assert.equal((await pedir('/auth/me', { rol: 'b' })).status, 401);
    },
  );
  console.log(
    JSON.stringify({
      estado: 'Ensayo HTTP terminado; UI disponible',
      resultado: informe.casos.map((c) => ({
        id: c.id,
        resultado: c.resultado,
      })),
      directorioPrivado: trabajo,
    }),
  );
}
async function limpiar() {
  if (finalizando) return;
  finalizando = true;
  try {
    assert.equal(conexion.name, basePermitida);
    // Si el arranque detectó nombres preexistentes, no nos pertenecen: nunca limpiarlos.
    assert(
      namespaceVerificado,
      'Namespace sin reserva exclusiva; limpieza de datos prohibida',
    );
    // Recuperar únicamente las cuentas del namespace creado y sus relaciones, nunca limpiar la base entera.
    const fichas = await usuarios
      .find({
        nombreUsuario: {
          $in: [
            ...Object.values(credenciales).map((c) => c.identificador),
            `${prefijo}_extra`,
            `${prefijo}_ea`,
          ],
        },
      })
      .select('_id')
      .lean();
    const ids = fichas.map((u) => u._id);
    const pubs = await publicaciones
      .find({ autorId: { $in: ids } })
      .select('_id')
      .lean();
    const pubIds = pubs.map((p) => p._id);
    for (const id of imagenes) {
      assert(id.startsWith(carpetaCloud + '/'));
      const r = await cloudinary.uploader.destroy(id, {
        resource_type: 'image',
        invalidate: true,
      });
      assert(['ok', 'not found'].includes(r.result));
    }
    const c = await comentarios.deleteMany({ autorId: { $in: ids } });
    const p = await publicaciones.deleteMany({
      _id: { $in: pubIds },
      autorId: { $in: ids },
    });
    const u = await usuarios.deleteMany({ _id: { $in: ids } });
    // No se hace dropDatabase ni se borra una carpeta con datos desconocidos.
    for (const sub of ['publicaciones', 'perfiles'])
      await cloudinary.api
        .delete_folder(carpetaCloud + '/' + sub)
        .catch(() => {});
    await cloudinary.api.delete_folder(carpetaCloud).catch(() => {});
    informe.limpieza = {
      resultado: 'Aprobado',
      usuarios: u.deletedCount,
      publicaciones: p.deletedCount,
      comentarios: c.deletedCount,
      imagenes: imagenes.size,
      restantesPropios: await usuarios.countDocuments({
        nombreUsuario: { $regex: '^' + prefijo + '_' },
      }),
    };
    await guardarInforme();
    await fs.unlink(path.join(trabajo, 'acceso-privado.json')).catch(() => {});
    console.log(JSON.stringify({ limpieza: informe.limpieza }));
  } catch (e) {
    informe.limpieza = {
      resultado: 'Fallido',
      tipo: e.name,
      codigo: e.code ?? null,
    };
    await guardarInforme();
    console.log(JSON.stringify({ limpieza: informe.limpieza }));
  } finally {
    if (servidorWeb) await new Promise((ok) => servidorWeb.close(ok));
    await app?.close();
    process.exit(informe.limpieza?.resultado === 'Aprobado' ? 0 : 1);
  }
}
process.on('SIGINT', () => void limpiar());
process.on('SIGTERM', () => void limpiar());
try {
  await iniciar();
  await ensayar();
  const vigilancia = setInterval(async () => {
    try {
      await fs.access(path.join(trabajo, 'limpiar.senal'));
      await limpiar();
    } catch {}
  }, 1000);
  vigilancia.unref();
  const entrada = createInterface({ input: process.stdin });
  entrada.on('line', (linea) => {
    if (linea.trim() === 'limpiar') void limpiar();
  });
} catch (e) {
  console.log(
    JSON.stringify({
      estado: 'Fallo de inicio/ensayo',
      tipo: e.name,
      codigo: e.code ?? null,
    }),
  );
  if (conexion) await limpiar();
  else {
    await app?.close();
    process.exit(1);
  }
}
