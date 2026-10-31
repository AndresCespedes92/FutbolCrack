import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Publicacion } from './entities/publicacion.entity.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import {
  MAXIMO_DESCRIPCION,
  MAXIMO_TITULO,
} from './publicaciones.constants.js';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<Publicacion>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crear(
    autorId: string,
    datos: CreatePublicacionDto,
    imagen?: Express.Multer.File,
  ) {
    // Defensa de negocio para llamadas internas, además del DTO HTTP. Conserva String.length.
    const titulo = typeof datos.titulo === 'string' ? datos.titulo.trim() : '';
    const descripcion =
      typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
    if (
      !titulo ||
      titulo.length > MAXIMO_TITULO ||
      !descripcion ||
      descripcion.length > MAXIMO_DESCRIPCION
    ) {
      throw new BadRequestException(
        'Ingresá título (1–120) y descripción (1–2000) válidos',
      );
    }
    if (!Types.ObjectId.isValid(autorId))
      throw new BadRequestException('El identificador del autor no es válido');
    // El archivo ya fue validado por Nest; se reutiliza Cloudinary sin alterar la subida de avatares.
    const multimediaUrl = imagen
      ? await this.cloudinaryService.subirImagen(imagen, 'publicaciones')
      : '';
    const nueva = new this.publicacionModel({
      autorId: new Types.ObjectId(autorId),
      titulo,
      descripcion,
      contenido: descripcion, // Un solo origen de texto para clientes de lectura anteriores.
      multimediaUrl,
      tipoMultimedia: imagen ? 'imagen' : 'ninguno',
      activo: true,
    });
    return nueva.save();
  }

  async listar() {
    // $ne:false incluye documentos antiguos sin activo; no hace falta una migración destructiva.
    const publicaciones = await this.publicacionModel
      .find({ activo: { $ne: false } })
      .populate('autorId', 'nombre apellido nombreUsuario imagenPerfil')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();
    // Normalización solo de respuesta: no escribe títulos inventados ni renombra datos en MongoDB.
    return publicaciones.map((publicacion) => ({
      ...publicacion,
      titulo: publicacion.titulo || 'Publicación anterior',
      descripcion: publicacion.descripcion ?? publicacion.contenido ?? '',
      contenido: publicacion.descripcion ?? publicacion.contenido ?? '',
      activo: publicacion.activo ?? true,
    }));
  }

  async darDeBaja(id: string, usuarioId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(
        'El identificador de publicación no es válido',
      );
    const filtro = { _id: new Types.ObjectId(id), activo: { $ne: false } };
    const publicacion = await this.publicacionModel.findOne(filtro).exec();
    if (!publicacion)
      throw new NotFoundException(
        'La publicación no existe o ya fue dada de baja',
      );
    // El carnet identifica al socio; la ficha actual decide si puede actuar como administrador.
    const usuario = await this.usuariosService.findById(usuarioId);
    if (!usuario)
      throw new UnauthorizedException('El usuario autenticado no existe');
    const esAutor = publicacion.autorId.toString() === usuarioId;
    if (!esAutor && usuario.perfil !== 'administrador') {
      throw new ForbiddenException(
        'Solo el autor o un administrador puede dar de baja esta publicación',
      );
    }
    // Actualización atómica y condicionada: dos bajas simultáneas no pueden confirmar el mismo retiro.
    const resultado = await this.publicacionModel
      .updateOne(filtro, { $set: { activo: false } })
      .exec();
    if (resultado.matchedCount === 0)
      throw new NotFoundException('La publicación ya fue dada de baja');
    // No se elimina el documento ni su imagen: se conserva la historia del parte del club.
    return { mensaje: 'Publicación dada de baja correctamente' };
  }
}
