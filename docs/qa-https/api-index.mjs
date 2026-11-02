// PLANTILLA DE REVISIÓN. No es un endpoint activo ni se importa desde la aplicación.
// Solo tras aprobación se copiaría a api/index.js del proyecto QA (package type: module).
import 'reflect-metadata';

let inicializacion;

async function prepararHandlerQa() {
  // Fallar antes de importar AppModule: nunca conectar si el aislamiento no coincide.
  if (!process.env.VERCEL || process.env.NODE_ENV !== 'production' ||
      process.env.QA_MODE !== 'futbolcrack-https-temporal' ||
      process.env.QA_NAMESPACE !== 'qahttps_1101a' ||
      process.env.FRONTEND_URL !== 'https://futbolcrack-qa-web.vercel.app') {
    throw new Error('Configuración QA no aprobada o incompleta');
  }
  let conexion;
  try { conexion = new URL(process.env.CONNECTION_STRING); }
  catch { throw new Error('Configuración de base QA inválida'); }
  if (!['mongodb:', 'mongodb+srv:'].includes(conexion.protocol) ||
      conexion.pathname !== '/futbolcrack_qa') {
    throw new Error('Conexión fuera de la base QA autorizada');
  }
  if (!process.env.JWT_SECRET || !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Faltan secretos exclusivos del servidor QA');
  }
  // Adaptador de carpeta exclusivo del artefacto de ensayo. La subida sigue siendo real.
  // No se modifica CloudinaryService ni se añaden endpoints al TP.
  const { CloudinaryService } = await import('../dist/cloudinary/cloudinary.service.js');
  const original = CloudinaryService.prototype.subirImagen;
  CloudinaryService.prototype.subirImagen = function (archivo, carpeta = 'perfiles') {
    if (!['perfiles', 'publicaciones'].includes(carpeta)) {
      throw new Error('Carpeta fuera del alcance QA');
    }
    return original.call(this, archivo, `qa/${process.env.QA_NAMESPACE}/${carpeta}`);
  };
  const { default: handler } = await import('../dist/main.js');
  return handler;
}

export default async function handlerQa(req, res) {
  inicializacion ??= prepararHandlerQa();
  const handler = await inicializacion;
  return handler(req, res);
}
