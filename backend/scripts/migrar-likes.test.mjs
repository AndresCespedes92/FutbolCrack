import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { migrarPublicacion, votosAntiguos } from './migrar-likes.mjs';

const id = new Types.ObjectId('000000000000000000000011');
const a = new Types.ObjectId('000000000000000000000001');
const b = new Types.ObjectId('000000000000000000000002');
// Persistencia simulada con rollback para verificar algoritmo e idempotencia; no ejecuta MongoDB.
function entorno(likes) {
  let publicacion = { _id: id, likes, titulo: 'Jugada de QA', activo: false };
  let votos = [];
  const session = { prueba: true };
  const publicaciones = {
    async findOne(_filtro, opciones) {
      assert.equal(opciones.session, session);
      return publicacion;
    },
    async updateOne(_filtro, cambio, opciones) {
      assert.equal(opciones.session, session);
      Object.assign(publicacion, cambio.$set);
      if (cambio.$unset) delete publicacion.likes;
    },
  };
  const meGusta = {
    async bulkWrite(operaciones, opciones) {
      assert.equal(opciones.session, session);
      assert.ok(operaciones.length <= 500);
      for (const { updateOne } of operaciones) {
        assert.equal(updateOne.upsert, true);
        const voto = updateOne.update.$setOnInsert;
        if (!votos.some((v) => String(v.usuarioId) === String(voto.usuarioId)))
          votos.push(voto);
      }
    },
    async countDocuments() {
      return votos.length;
    },
  };
  const db = {
    collection: (nombre) =>
      nombre === 'publicaciones' ? publicaciones : meGusta,
  };
  return {
    db,
    session,
    meGusta,
    get publicacion() {
      return publicacion;
    },
    get votos() {
      return votos;
    },
    async ejecutar() {
      const copia = { ...publicacion },
        anteriores = [...votos];
      try {
        return await migrarPublicacion(db, session, id);
      } catch (error) {
        publicacion = copia;
        votos = anteriores;
        throw error;
      }
    },
  };
}
test('deduplica IDs preservando identidad y rechaza votos inválidos', () => {
  assert.deepEqual(votosAntiguos([a, String(a), b]).map(String), [
    String(a),
    String(b),
  ]);
  assert.throws(() => votosAntiguos(['no-es-id']));
  assert.throws(() => votosAntiguos('no-es-array'));
});
test('migra votos de una publicación incluso inactiva, conserva datos y libera el array', async () => {
  const e = entorno([a, a, b]);
  assert.equal(await e.ejecutar(), true);
  assert.deepEqual(
    e.votos.map((v) => String(v.usuarioId)),
    [String(a), String(b)],
  );
  assert.equal(e.publicacion.cantidadLikes, 2);
  assert.equal(e.publicacion.likesMigrados, true);
  assert.equal(e.publicacion.activo, false);
  assert.equal(e.publicacion.titulo, 'Jugada de QA');
  assert.equal('likes' in e.publicacion, false);
  assert.equal(e.votos[0].createdAt, undefined); // No se inventa cuándo se votó.
});
test('repetir la migración no duplica ni resucita votos retirados posteriormente', async () => {
  const e = entorno([a, b]);
  await e.ejecutar();
  e.votos.pop();
  e.publicacion.cantidadLikes = 1;
  assert.equal(await e.ejecutar(), false);
  assert.equal(e.votos.length, 1);
  assert.equal(e.publicacion.cantidadLikes, 1);
});
test('una publicación sin array queda con contador cero y el proceso usa lotes acotados', async () => {
  const e = entorno(undefined);
  await e.ejecutar();
  assert.equal(e.publicacion.cantidadLikes, 0);
  const grande = entorno(
    Array.from({ length: 1001 }, () => new Types.ObjectId()),
  );
  await grande.ejecutar();
  assert.equal(grande.publicacion.cantidadLikes, 1001);
});
test('un conteo incoherente o ID inválido revierte y conserva los votos originales', async () => {
  const e = entorno([a, b]);
  e.meGusta.countDocuments = async () => 1;
  await assert.rejects(e.ejecutar());
  assert.equal(e.publicacion.likes.length, 2);
  assert.equal(e.publicacion.likesMigrados, undefined);
  assert.equal(e.votos.length, 0);
  const invalida = entorno(['id-invalido']);
  await assert.rejects(invalida.ejecutar());
  assert.deepEqual(invalida.publicacion.likes, ['id-invalido']);
});
