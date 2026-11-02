// Regresión REAL de S4-04. Usa únicamente dos administradores del namespace QA ya autorizado.
// Ejecutar desde backend: node --env-file=.env scripts/aceptacion-admin-qa.mjs --run=qa5e_... --autorizar-escrituras-qa
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const run = process.argv.find((a) => a.startsWith('--run='))?.slice(6);
assert(
  process.argv.includes('--autorizar-escrituras-qa') &&
    /^qa5e_[a-f0-9]{8}$/.test(run ?? ''),
);
const carpeta = path.resolve('node_modules/.cache/futbolcrack_qa', run);
const privado = JSON.parse(
  await fs.readFile(path.join(carpeta, 'acceso-privado.json'), 'utf8'),
);
const uri = new URL(process.env.CONNECTION_STRING);
uri.pathname = '/futbolcrack_qa';
process.env.CONNECTION_STRING = uri.toString();
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.NODE_ENV = 'development';
process.env.FRONTEND_URL = privado.origen;
const { AppModule } = await import('../dist/app.module.js');
const app = await NestFactory.create(AppModule, {
  logger: false,
  cors: { origin: [privado.origen], credentials: true },
});
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
);
const evidencia = {
  entorno: 'Nest compilado + Atlas futbolcrack_qa real',
  casos: [],
  sinMocks: true,
};
let usuarios, a, b;
const cookies = new Map(); // Nunca escribir ni imprimir sus valores.
async function pedir(
  ruta,
  { method = 'GET', rol, datos, origin = privado.origen } = {},
) {
  const headers = {};
  if (origin !== null) headers.Origin = origin;
  if (rol) headers.Cookie = cookies.get(rol);
  if (datos !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch('http://localhost:4302' + ruta, {
    method,
    headers,
    body: datos === undefined ? undefined : JSON.stringify(datos),
  });
  return r;
}
async function caso(nombre, ejecutar) {
  try {
    const detalle = await ejecutar();
    evidencia.casos.push({ nombre, resultado: 'Aprobado', detalle });
  } catch (e) {
    evidencia.casos.push({
      nombre,
      resultado: 'Fallido',
      tipo: e.name,
      codigo: e.code,
    });
  }
}
async function restaurar() {
  // Lista cerrada de IDs y nombre exacto: no se rehabilita el padrón completo.
  for (const u of [a, b])
    if (u)
      await usuarios.updateOne(
        { _id: u._id, nombreUsuario: u.nombreUsuario },
        { $set: { activo: true } },
      );
}
try {
  await app.listen(4302, '127.0.0.1');
  const conexion = app.get(getConnectionToken());
  assert.equal(conexion.name, 'futbolcrack_qa');
  usuarios = conexion.model('Usuario');
  a = await usuarios.findOne({ nombreUsuario: run + '_admin' }).lean();
  b = await usuarios.findOne({ nombreUsuario: run + '_ea' }).lean();
  assert(
    a && b && a.perfil === 'administrador' && b.perfil === 'administrador',
  );
  await restaurar();
  for (const [rol, identificador, password] of [
    ['a', a.nombreUsuario, privado.credenciales.admin.password],
    ['b', b.nombreUsuario, privado.credenciales.b.password],
  ]) {
    const r = await pedir('/auth/login', {
      method: 'POST',
      datos: { identificador, password },
    });
    assert.equal(r.status, 200);
    cookies.set(rol, r.headers.get('set-cookie').split(';')[0]);
  }
  await caso('Baja propia rechazada antes de suspender', async () => {
    assert.equal(
      (await pedir('/usuarios/' + a._id, { method: 'DELETE', rol: 'a' }))
        .status,
      409,
    );
  });
  await caso(
    'Otro administrador: baja, JWT previo revocado y rehabilitación',
    async () => {
      assert.equal(
        (await pedir('/usuarios/' + b._id, { method: 'DELETE', rol: 'a' }))
          .status,
        200,
      );
      assert.equal((await pedir('/usuarios', { rol: 'b' })).status, 401);
      assert.equal(
        (
          await pedir('/auth/refrescar', {
            method: 'POST',
            rol: 'b',
            datos: {},
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await pedir('/usuarios/' + b._id + '/habilitar', {
            method: 'POST',
            rol: 'a',
            datos: {},
          })
        ).status,
        200,
      );
      assert.equal((await pedir('/usuarios', { rol: 'b' })).status, 200);
    },
  );
  await caso(
    'CSRF y CORS reales: origen permitido, ajeno y ausente',
    async () => {
      for (const origin of ['https://ajeno.example.test', null])
        assert.equal(
          (
            await pedir('/auth/refrescar', {
              method: 'POST',
              rol: 'a',
              datos: {},
              origin,
            })
          ).status,
          403,
        );
      const preflight = await fetch('http://localhost:4302/usuarios', {
        method: 'OPTIONS',
        headers: {
          Origin: privado.origen,
          'Access-Control-Request-Method': 'DELETE',
        },
      });
      assert.equal(
        preflight.headers.get('access-control-allow-origin'),
        privado.origen,
      );
      assert.equal(
        preflight.headers.get('access-control-allow-credentials'),
        'true',
      );
      return 'Localhost real; no sustituye comprobación HTTPS cross-site';
    },
  );
  await caso(
    'Cinco carreras opuestas nunca dejan ambos administradores suspendidos',
    async () => {
      const resultados = [];
      for (let i = 0; i < 5; i++) {
        await restaurar();
        const respuestas = await Promise.all([
          pedir('/usuarios/' + b._id, { method: 'DELETE', rol: 'a' }),
          pedir('/usuarios/' + a._id, { method: 'DELETE', rol: 'b' }),
        ]);
        const estados = respuestas.map((r) => r.status);
        assert.equal(estados.filter((s) => s === 200).length, 1);
        assert(estados.some((s) => [401, 403, 409].includes(s)));
        const activos = await usuarios.countDocuments({
          _id: { $in: [a._id, b._id] },
          activo: { $ne: false },
        });
        assert.equal(activos, 1);
        const superviviente = await usuarios
          .findOne({ _id: { $in: [a._id, b._id] }, activo: true })
          .lean();
        const rol = String(superviviente._id) === String(a._id) ? 'a' : 'b';
        assert.equal(
          (
            await pedir('/usuarios/' + superviviente._id, {
              method: 'DELETE',
              rol,
            })
          ).status,
          409,
        );
        resultados.push({ estados, administradoresPropiosActivos: activos });
      }
      return resultados;
    },
  );
} finally {
  await restaurar();
  cookies.clear();
  await app.close();
  await fs.writeFile(
    path.join(carpeta, 'aceptacion-admin-publico.json'),
    JSON.stringify(evidencia, null, 2),
  );
}
console.log(JSON.stringify(evidencia));
process.exitCode =
  evidencia.casos.length === 4 &&
  evidencia.casos.every((c) => c.resultado === 'Aprobado')
    ? 0
    : 1;
