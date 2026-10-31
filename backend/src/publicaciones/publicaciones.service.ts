import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { ListarPublicacionesDto } from './dto/listar-publicaciones.dto.js';
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

  async listar(
    consulta: ListarPublicacionesDto = new ListarPublicacionesDto(),
    usuarioAutenticadoId?: string,
  ) {
    const { orden, usuarioId, offset, limit } = consulta;
    const filtro: { activo: { $ne: false }; autorId?: Types.ObjectId } = {
      activo: { $ne: false },
    };
    if (usuarioId) filtro.autorId = new Types.ObjectId(usuarioId);
    const ordenamiento: Record<string, 1 | -1> =
      orden === 'likes'
        ? { cantidadLikes: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };
    const identidad =
      usuarioAutenticadoId && Types.ObjectId.isValid(usuarioAutenticadoId)
        ? new Types.ObjectId(usuarioAutenticadoId)
        : null;
    // Una sola fuente de verdad: contamos el array, sin contador persistido que pueda desincronizarse.
    // $match precede a $facet: total y página se calculan con los mismos filtros de estado/autor.
    const pipeline: PipelineStage[] = [
      { $match: filtro },
      {
        $set: {
          cantidadLikes: { $size: { $ifNull: ['$likes', []] } },
          meGusta: identidad
            ? { $in: [identidad, { $ifNull: ['$likes', []] }] }
            : false,
        },
      },
      {
        $facet: {
          publicaciones: [
            { $sort: ordenamiento },
            { $skip: offset },
            { $limit: limit },
            // La lectura pública no expone los IDs de quienes votaron.
            { $project: { likes: 0 } },
          ],
          conteo: [{ $count: 'total' }],
        },
      },
    ];
    const [resultado] = await this.publicacionModel
      .aggregate<{
        publicaciones: (Partial<Publicacion> & {
          cantidadLikes: number;
          meGusta: boolean;
        })[];
        conteo: { total: number }[];
      }>(pipeline)
      .exec();
    const pagina = resultado?.publicaciones ?? [];
    // populate solo resuelve autores de esta página y usa la referencia del modelo, no un nombre de colección fijo.
    const publicaciones = await this.publicacionModel.populate(pagina, {
      path: 'autorId',
      select: 'nombre apellido nombreUsuario imagenPerfil',
    });
    const total = resultado?.conteo[0]?.total ?? 0;
    return {
      publicaciones: publicaciones.map((publicacion) => ({
        ...publicacion,
        titulo: publicacion.titulo || 'Publicación anterior',
        descripcion: publicacion.descripcion ?? publicacion.contenido ?? '',
        contenido: publicacion.descripcion ?? publicacion.contenido ?? '',
        activo: publicacion.activo ?? true,
      })),
      total,
      offset,
      limit,
      hayMas: offset + pagina.length < total,
    };
  }

  darMeGusta(id: string, usuarioId: string) {
    return this.cambiarMeGusta(id, usuarioId, true);
  }
  quitarMeGusta(id: string, usuarioId: string) {
    return this.cambiarMeGusta(id, usuarioId, false);
  }

  private async cambiarMeGusta(
    id: string,
    usuarioId: string,
    agregar: boolean,
  ) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(
        'El identificador de publicación no es válido',
      );
    if (
      !Types.ObjectId.isValid(usuarioId) ||
      !(await this.usuariosService.findById(usuarioId))
    ) {
      throw new UnauthorizedException('El usuario autenticado no existe');
    }
    const actor = new Types.ObjectId(usuarioId);
    const base = { _id: new Types.ObjectId(id), activo: { $ne: false } };
    // El filtro y la modificación se ejecutan en una única operación del documento:
    // dos pedidos simultáneos del mismo socio no pueden sumar dos votos.
    const publicacion = await this.publicacionModel
      .findOneAndUpdate(
        { ...base, likes: agregar ? { $ne: actor } : actor },
        agregar ? { $addToSet: { likes: actor } } : { $pull: { likes: actor } },
        { new: true },
      )
      .select('likes')
      .lean()
      .exec();
    if (!publicacion) {
      const existe = await this.publicacionModel.findOne(base).exec();
      if (!existe)
        throw new NotFoundException(
          'La publicación no existe o está dada de baja',
        );
      throw new ConflictException(
        agregar
          ? 'Ya diste me gusta a esta publicación'
          : 'No tenés un me gusta para quitar en esta publicación',
      );
    }
    return {
      mensaje: agregar
        ? 'Me gusta registrado correctamente'
        : 'Me gusta quitado correctamente',
      cantidadLikes: publicacion.likes?.length ?? 0,
      meGusta: agregar,
    };
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
