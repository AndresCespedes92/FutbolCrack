import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';

/** Normaliza y deduplica sin inventar votantes. Un ID inválido detiene la migración:
 * no se elimina el array original ni se pierden silenciosamente referencias históricas.
 */
export function votosAntiguos(likes) {
  if (likes !== undefined && !Array.isArray(likes))
    throw new Error('Array histórico inválido');
  const unicos = new Map();
  for (const id of likes ?? []) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error('Un voto histórico tiene un ID inválido');
    const normalizado = new mongoose.Types.ObjectId(id);
    unicos.set(normalizado.toHexString(), normalizado);
  }
  return [...unicos.values()];
}

/** Se llama dentro de withTransaction: bloquear la publicación impide que una baja o
 * una escritura nueva se intercale. Los upserts por lotes hacen el proceso reintentable.
 * Solo al verificar el total retiramos el array, liberando espacio del documento.
 */
export async function migrarPublicacion(db, session, id) {
  const publicaciones = db.collection('publicaciones'),
    votos = db.collection('me_gusta');
  const original = await publicaciones.findOne({ _id: id }, { session });
  if (!original || original.likesMigrados === true) return false;
  const usuarios = votosAntiguos(original.likes);
  await publicaciones.updateOne(
    { _id: id },
    { $set: { likesMigrados: true, cantidadLikes: 0 } },
    { session },
  );
  for (let offset = 0; offset < usuarios.length; offset += 500) {
    await votos.bulkWrite(
      usuarios.slice(offset, offset + 500).map((usuarioId) => ({
        updateOne: {
          filter: { publicacionId: id, usuarioId },
          // El array antiguo no conserva fecha del voto: no inventamos un createdAt histórico.
          update: {
            $setOnInsert: {
              publicacionId: id,
              usuarioId,
              migradoEn: new Date(),
            },
          },
          upsert: true,
        },
      })),
      { session, ordered: true },
    );
  }
  const total = await votos.countDocuments({ publicacionId: id }, { session });
  if (total !== usuarios.length)
    throw new Error(
      'El total de votos no coincide; se revierte esta publicación',
    );
  await publicaciones.updateOne(
    { _id: id },
    {
      $set: { cantidadLikes: total, likesMigrados: true },
      $unset: { likes: '' },
    },
    { session },
  );
  return true;
}

async function main() {
  const argumentos = process.argv.slice(2);
  const nombre = argumentos[argumentos.indexOf('--database') + 1];
  if (!argumentos.includes('--database') || !nombre || nombre.startsWith('--'))
    throw new Error(
      'Indicá --database NOMBRE_EXPLICITO. Sin --apply solo se inspecciona.',
    );
  if (!process.env.CONNECTION_STRING)
    throw new Error('Falta CONNECTION_STRING en el entorno');
  const conexion = await mongoose
    .createConnection(process.env.CONNECTION_STRING, { dbName: nombre })
    .asPromise();
  try {
    const db = conexion.db;
    const aplicar = argumentos.includes('--apply');
    if (aplicar)
      await db
        .collection('me_gusta')
        .createIndex(
          { publicacionId: 1, usuarioId: 1 },
          { unique: true, name: 'voto_unico' },
        );
    let revisadas = 0,
      migradas = 0;
    const cursor = db
      .collection('publicaciones')
      .find(
        { likesMigrados: { $ne: true } },
        { projection: { _id: 1, likes: 1 } },
      );
    for await (const publicacion of cursor) {
      revisadas++;
      if (!aplicar) {
        votosAntiguos(publicacion.likes);
        continue;
      }
      const session = await conexion.startSession();
      try {
        if (
          await session.withTransaction(() =>
            migrarPublicacion(db, session, publicacion._id),
          )
        )
          migradas++;
      } finally {
        await session.endSession();
      }
    }
    // Sin IDs personales, conexión, tokens ni contenido del usuario en los logs.
    console.log(
      JSON.stringify({
        modo: aplicar ? 'aplicación' : 'solo lectura',
        revisadas,
        migradas,
      }),
    );
  } finally {
    await conexion.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error(
      'Migración detenida. Revisá configuración, IDs, índice y soporte de transacciones; no se muestran secretos.',
    );
    process.exitCode = 1;
  });
