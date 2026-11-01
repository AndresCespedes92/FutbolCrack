import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from '../publicaciones/entities/publicacion.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Comentario } from './entities/comentario.entity.js';
import { CrearComentarioDto } from './dto/crear-comentario.dto.js';
import { EditarComentarioDto } from './dto/editar-comentario.dto.js';
import { ListarComentariosDto } from './dto/listar-comentarios.dto.js';
import { MAXIMO_TEXTO_COMENTARIO } from './comentarios.constants.js';

type ComentarioConId = Comentario & { _id: Types.ObjectId };

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name)
    private readonly comentarioModel: Model<Comentario>,
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<Publicacion>,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crear(
    publicacionId: string,
    usuarioId: string,
    datos: CrearComentarioDto,
  ) {
    const publicacion = this.validarId(publicacionId, 'publicación');
    await this.validarUsuario(usuarioId);
    await this.exigirPublicacionActiva(publicacion);
    const nuevo = new this.comentarioModel({
      publicacionId: publicacion,
      autorId: new Types.ObjectId(usuarioId),
      texto: this.validarTexto(datos.texto),
      modificado: false,
    });
    // Mongoose asigna _id y timestamps. El cliente no decide autor ni fechas.
    const guardado = await nuevo.save();
    const [comentario] = await this.presentar([guardado]);
    return { mensaje: 'Comentario creado correctamente', comentario };
  }

  async listar(
    publicacionId: string,
    consulta: ListarComentariosDto = new ListarComentariosDto(),
  ) {
    const publicacion = this.validarId(publicacionId, 'publicación');
    await this.exigirPublicacionActiva(publicacion);
    const { offset, limit } = consulta;
    // $match y $sort pueden aprovechar el índice compuesto; $facet mantiene el mismo filtro
    // para total y página. Nunca se descargan todos los comentarios para cortarlos en memoria.
    const [resultado] = await this.comentarioModel
      .aggregate<{
        comentarios: ComentarioConId[];
        conteo: { total: number }[];
      }>([
        { $match: { publicacionId: publicacion } },
        { $sort: { createdAt: -1, _id: -1 } },
        {
          $facet: {
            comentarios: [
              { $skip: offset },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  publicacionId: 1,
                  autorId: 1,
                  texto: 1,
                  modificado: 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
            conteo: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    const comentarios = await this.presentar(resultado?.comentarios ?? []);
    const total = resultado?.conteo[0]?.total ?? 0;
    return {
      comentarios,
      total,
      offset,
      limit,
      hayMas: offset + comentarios.length < total,
    };
  }

  async editar(id: string, usuarioId: string, datos: EditarComentarioDto) {
    const comentarioId = this.validarId(id, 'comentario');
    await this.validarUsuario(usuarioId);
    const anterior = await this.comentarioModel
      .findById(comentarioId)
      .lean()
      .exec();
    if (!anterior) throw new NotFoundException('El comentario no existe');
    // El carnet de administrador NO autoriza a reescribir la nota de otro socio.
    if (anterior.autorId.toString() !== usuarioId)
      throw new ForbiddenException(
        'Solo el autor puede editar este comentario',
      );
    await this.exigirPublicacionActiva(anterior.publicacionId);
    // Repetir autor/publicación en el filtro impide actualizar otra relación por una lectura obsoleta.
    // createdAt permanece intacto; timestamps actualiza updatedAt y el orden sigue por fecha de creación.
    const actualizado = await this.comentarioModel
      .findOneAndUpdate(
        {
          _id: comentarioId,
          autorId: new Types.ObjectId(usuarioId),
          publicacionId: anterior.publicacionId,
        },
        { $set: { texto: this.validarTexto(datos.texto), modificado: true } },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();
    if (!actualizado)
      throw new NotFoundException('El comentario ya no está disponible');
    const [comentario] = await this.presentar([actualizado]);
    return { mensaje: 'Comentario editado correctamente', comentario };
  }

  private validarId(id: string, entidad: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(
        `El identificador de ${entidad} no es válido`,
      );
    return new Types.ObjectId(id);
  }
  private async validarUsuario(id: string): Promise<void> {
    if (
      !Types.ObjectId.isValid(id) ||
      !(await this.usuariosService.findById(id))
    )
      throw new UnauthorizedException('El usuario autenticado no existe');
  }
  private async exigirPublicacionActiva(id: Types.ObjectId): Promise<void> {
    // Igual que en publicaciones: los documentos antiguos sin activo siguen visibles.
    const publicacion = await this.publicacionModel
      .findOne({ _id: id, activo: { $ne: false } })
      .select('_id')
      .lean()
      .exec();
    if (!publicacion)
      throw new NotFoundException(
        'La publicación no existe o está dada de baja',
      );
  }
  private validarTexto(texto: string): string {
    // Defensa adicional para llamadas internas, conservando String.length del proyecto.
    const limpio = typeof texto === 'string' ? texto.trim() : '';
    if (!limpio || limpio.length > MAXIMO_TEXTO_COMENTARIO)
      throw new BadRequestException(
        'Ingresá un comentario de 1 a 1000 caracteres',
      );
    return limpio;
  }
  private presentar(comentarios: ComentarioConId[]) {
    // Lista positiva también para altas/ediciones: ni campos internos futuros ni datos sensibles.
    const publicos = comentarios.map((comentario) => ({
      _id: comentario._id,
      publicacionId: comentario.publicacionId,
      autorId: comentario.autorId,
      texto: comentario.texto,
      modificado: comentario.modificado,
      createdAt: comentario.createdAt,
      updatedAt: comentario.updatedAt,
    }));
    // populate resuelve la referencia, no copia datos del usuario al documento guardado.
    return this.comentarioModel.populate(publicos, {
      path: 'autorId',
      select: 'nombre apellido imagenPerfil',
    });
  }
}
