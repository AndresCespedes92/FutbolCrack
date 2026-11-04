import type { PipelineStage } from 'mongoose';
import {
  construirRango,
  RangoFechasDto,
} from '../common/estadisticas/rango-fechas.dto.js';
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

  // Ambos reportes usan createdAt del COMENTARIO. La jugada puede haberse creado antes del rango.
  private pipelineVisibles(inicio: Date, finExclusivo: Date): PipelineStage[] {
    return [
      { $match: { createdAt: { $gte: inicio, $lt: finExclusivo } } },
      // Un comentario pertenece a la cartelera solo mientras su publicación existe y está activa.
      // No hay baja independiente de comentarios en el modelo actual: no inventamos un nuevo estado.
      {
        $lookup: {
          from: this.publicacionModel.collection.name,
          localField: 'publicacionId',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      { $unwind: '$publicacion' },
      { $match: { 'publicacion.activo': { $ne: false } } },
    ];
  }
  async totalEnRango(datos: RangoFechasDto) {
    const { inicio, finExclusivo, metadatos } = construirRango(datos);
    const [resultado] = await this.comentarioModel
      .aggregate<{
        conteo: { cantidad: number }[];
        dias: { fecha: string; cantidad: number }[];
      }>([
        ...this.pipelineVisibles(inicio, finExclusivo),
        // Un mismo conjunto filtrado alimenta el total y su evolución diaria, sin descargar textos.
        {
          $facet: {
            conteo: [{ $count: 'cantidad' }],
            dias: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      date: '$createdAt',
                      format: '%Y-%m-%d',
                      timezone: '-03:00',
                    },
                  },
                  cantidad: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
            ],
          },
        },
      ])
      .exec();
    return {
      ...metadatos,
      total: resultado?.conteo[0]?.cantidad ?? 0,
      dias: resultado?.dias ?? [],
    };
  }

  async porPublicacionEnRango(datos: RangoFechasDto) {
    const { inicio, finExclusivo, metadatos } = construirRango(datos);
    const grupos = await this.comentarioModel
      .aggregate<{
        publicacionId: Types.ObjectId;
        titulo: string;
        cantidad: number;
      }>([
        ...this.pipelineVisibles(inicio, finExclusivo),
        {
          $group: {
            _id: '$publicacionId',
            titulo: { $first: '$publicacion.titulo' },
            cantidad: { $sum: 1 },
          },
        },
        { $sort: { cantidad: -1, _id: 1 } },
        {
          $project: {
            _id: 0,
            publicacionId: '$_id',
            titulo: { $ifNull: ['$titulo', 'Publicación anterior'] },
            cantidad: 1,
          },
        },
      ])
      .exec();
    return { ...metadatos, datos: grupos };
  }

  /**
   * Recibe ID de publicación, usuario autenticado y DTO de texto. Antes de guardar valida ambos
   * identificadores, existencia del usuario y que la jugada siga visible; evita notas huérfanas.
   * MongoDB almacena referencias ObjectId, texto, modificado=false y timestamps de Mongoose.
   * presentar prepara autor público y respuesta; el controller POST devuelve 201 si todo sale bien.
   * Un dato inválido da 400, falta de identidad 401 y una publicación ausente/inactiva 404.
   */
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

  /**
   * Paginación real de notas de una jugada: match por referencia, orden reciente primero y
   * desempate _id, luego facet separa página skip/limit y total con el mismo filtro.
   * Por defecto son tres; el cliente manda offset 0/3/6 y anexa lo recibido. El total puede ser
   * ocho aunque una página tenga tres. populate resuelve solo autores de esa página.
   * La lectura no exige sesión pero sí publicación activa; no se ofrecen notas de una jugada retirada.
   */
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

  /**
   * PUT llega desde guardarEdicion de Angular con solo texto. AuthGuard aporta usuarioId;
   * el servicio lee el comentario real y compara su autor con esa identidad antes de modificar.
   * Otro usuario, incluso administrador, recibe 403: administrar no permite reescribir notas ajenas.
   * El filtro repite _id/autorId/publicacionId y $set modifica texto/modificado; new:true devuelve
   * el resultado y runValidators ejecuta reglas del esquema. updatedAt cambia, createdAt no.
   * La interfaz reemplaza esa fila y muestra Editado por el booleano, sin reordenar la colección.
   * 404 cubre comentario/publicación ausentes; errores de formato/texto son 400.
   */
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
  /**
   * Convierte documentos internos a una proyección pública y resuelve autorId con populate.
   * No se copia el nombre dentro del comentario almacenado: sigue relacionado por ObjectId.
   * Si falta el usuario, el frontend acepta autor null y muestra usuario no disponible;
   * seleccionar nombre/apellido/imagen evita exponer correo, rol o contraseña del autor.
   */
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
