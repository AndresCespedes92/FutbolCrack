import {
  construirRango,
  RangoFechasDto,
} from '../common/estadisticas/rango-fechas.dto.js';
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

  async publicacionesPorUsuario(datos: RangoFechasDto) {
    const { inicio, finExclusivo, metadatos } = construirRango(datos);
    // $match reduce documentos antes de agrupar: cuenta solo jugadas visibles creadas en el período.
    const grupos = await this.publicacionModel
      .aggregate<{ autorId: Types.ObjectId; cantidad: number }>([
        {
          $match: {
            activo: { $ne: false },
            createdAt: { $gte: inicio, $lt: finExclusivo },
          },
        },
        { $group: { _id: '$autorId', cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1, _id: 1 } },
        { $project: { _id: 0, autorId: '$_id', cantidad: 1 } },
      ])
      .exec();
    // Se resuelven autores de los grupos, no todas las publicaciones; selección pública explícita.
    const autores = (await this.publicacionModel.populate(grupos, {
      path: 'autorId',
      select: 'nombre apellido nombreUsuario',
    })) as unknown as {
      autorId: {
        _id: Types.ObjectId;
        nombre?: string;
        apellido?: string;
        nombreUsuario?: string;
      } | null;
      cantidad: number;
    }[];
    return {
      ...metadatos,
      datos: autores.map((grupo) => {
        const autor = grupo.autorId;
        return {
          usuarioId: autor?._id?.toString() ?? null,
          nombre: autor
            ? `${autor.nombre ?? ''} ${autor.apellido ?? ''}`.trim()
            : 'Usuario no disponible',
          nombreUsuario: autor?.nombreUsuario ?? '',
          cantidad: grupo.cantidad,
        };
      }),
    };
  }

  /**
   * Normaliza título/descripción y repite límites como defensa de llamadas internas al servicio.
   * Si hay imagen, Cloudinary guarda el binario y MongoDB conserva su URL/tipo junto al autor JWT.
   * contenido se mantiene como alias compatible, no como un segundo texto editable independiente.
   * save crea el documento; no hay edición posterior de publicaciones en esta API.
   * Cloudinary y MongoDB son sistemas distintos: aquí no hay transacción distribuida ni compensación
   * automática de una imagen si un guardado posterior falla. No se debe afirmar atomicidad entre ambos.
   */
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
    return this.consultarListado(consulta, usuarioAutenticadoId);
  }

  /**
   * Valida un ObjectId (400 si es inválido) y reutiliza la consulta filtrando por _id.
   * No descarga el feed para buscar una jugada en memoria. La publicación ausente/inactiva da 404;
   * la respuesta conserva normalización antigua, autor público y contadores del listado.
   */
  async obtenerPorId(id: string, usuarioAutenticadoId?: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(
        'El identificador de publicación no es válido',
      );
    // Una consulta filtrada por _id, no una descarga del feed para buscar en memoria.
    // Comparte normalización antigua, autor público y cálculo de likes con el listado.
    const consulta = new ListarPublicacionesDto();
    consulta.limit = 1;
    const resultado = await this.consultarListado(
      consulta,
      usuarioAutenticadoId,
      new Types.ObjectId(id),
    );
    if (!resultado.publicaciones.length)
      throw new NotFoundException(
        'La publicación no existe o está dada de baja',
      );
    return resultado.publicaciones[0];
  }

  /**
   * Única lectura para feed, perfil y detalle: filtra visibles/autor/ID antes de paginar.
   * set calcula cantidadLikes y meGusta a partir del array real, sin confiar en valores del cliente.
   * facet obtiene total y página; sort usa fecha o likes con desempates estables y skip/limit recorta
   * en MongoDB. El lookup de comentarios cuenta solo las jugadas de la página, sin descargar textos.
   * Se ocultan IDs de votantes y se pueblan campos públicos del autor. El sobre devuelve total,
   * offset, limit y hayMas para la navegación; usuarioId filtra AUTOR, no la identidad del lector.
   */
  private async consultarListado(
    consulta: ListarPublicacionesDto,
    usuarioAutenticadoId?: string,
    publicacionId?: Types.ObjectId,
  ) {
    const { orden, usuarioId, offset, limit } = consulta;
    const filtro: {
      activo: { $ne: false };
      autorId?: Types.ObjectId;
      _id?: Types.ObjectId;
    } = {
      activo: { $ne: false },
    };
    if (usuarioId) filtro.autorId = new Types.ObjectId(usuarioId);
    if (publicacionId) filtro._id = publicacionId;
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
            // Contamos notas de cada jugada de ESTA página, sin descargar sus textos
            // ni guardar un contador duplicado que pueda quedar desactualizado.
            {
              $lookup: {
                from: 'comentarios', // Colección explícita del esquema Comentario.
                let: { publicacionId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$publicacionId', '$$publicacionId'] },
                    },
                  },
                  { $count: 'total' },
                ],
                as: 'conteoComentarios',
              },
            },
            {
              $set: {
                cantidadComentarios: {
                  $ifNull: [
                    { $arrayElemAt: ['$conteoComentarios.total', 0] },
                    0,
                  ],
                },
              },
            },
            { $project: { conteoComentarios: 0 } },
          ],
          conteo: [{ $count: 'total' }],
        },
      },
    ];
    const [resultado] = await this.publicacionModel
      .aggregate<{
        publicaciones: (Partial<Publicacion> & {
          cantidadLikes: number;
          cantidadComentarios: number;
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

  /**
   * La relación usuario-publicación se guarda como ObjectId dentro de likes.
   * Filtro y modificación viajan en una única escritura de documento: $addToSet agrega sin
   * duplicar; $pull retira ese usuario. El filtro evita aplicar una transición ya realizada.
   * Dos pedidos de alta simultáneos no suman dos votos. Si no se actualizó, se distingue 404
   * (jugada no visible) de 409 (voto ya dado o ausente), y se devuelve el conteo real del array.
   * Es una operación atómica de un documento, no una transacción distribuida ni un CRUD con
   * colección/ID propio para likes; por eso el mismo método implementa las dos transiciones.
   */
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

  /**
   * Solo autor o administrador actual puede retirar una jugada; otro autenticado recibe 403.
   * El rol se consulta en la ficha y no se acepta libremente en el body. updateOne condicionada
   * marca activo=false; si otra solicitud ya la retiró no devuelve un éxito falso.
   * No se borra imagen/documento ni comentarios: posteriores lecturas exigen publicación activa.
   * La confirmación modal existe en Angular, pero los permisos deben funcionar también por Postman.
   */
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
