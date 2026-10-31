import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Datos públicos del autor.
 *
 * NestJS los obtiene mediante populate()
 * sobre la referencia autorId de MongoDB.
 */
export interface AutorPublicacion {
  _id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil: string;
}

/**
 * Representa una publicación almacenada en MongoDB.
 */
export interface Publicacion {
  _id: string;
  autorId: AutorPublicacion | null;
  contenido: string;
  // Opcionales al leer para tolerar respuestas/documentos anteriores al despliegue conjunto.
  titulo?: string;
  descripcion?: string;
  activo?: boolean;
  // Calculados por el listado; opcionales para conservar la respuesta de creación y datos antiguos.
  cantidadLikes?: number;
  meGusta?: boolean;
  multimediaUrl: string;
  tipoMultimedia: 'ninguno' | 'imagen' | 'video';
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos necesarios para crear una publicación.
 */
export interface CrearPublicacionDto {
  titulo: string;
  descripcion: string;
  imagen?: File;
}

// Contrato de consulta separado del formulario de creación: no agrega controles visuales todavía.
export type OrdenPublicaciones = 'fecha' | 'likes';
export interface ParametrosListadoPublicaciones {
  orden?: OrdenPublicaciones;
  usuarioId?: string;
  offset?: number;
  limit?: number;
}
export interface ListadoPublicaciones {
  publicaciones: Publicacion[];
  total: number;
  offset: number;
  limit: number;
  hayMas: boolean;
}
export interface RespuestaMeGusta {
  mensaje: string;
  cantidadLikes: number;
  meGusta: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PublicacionesService {
  private readonly http = inject(HttpClient);

  // Backend local de FutbolCrack.
  private readonly apiUrl = 'https://futbol-crackbackend.vercel.app/publicaciones';

  /**
   * GET /publicaciones
   *
   * Endpoint público.
   * Devuelve una página y el total filtrado desde MongoDB.
   */
  listar(parametros: ParametrosListadoPublicaciones = {}): Observable<ListadoPublicaciones> {
    let query = new HttpParams();
    for (const [nombre, valor] of Object.entries(parametros)) {
      if (valor !== undefined) query = query.set(nombre, String(valor));
    }
    // GET sigue público; las cookies permiten calcular meGusta si hay una sesión válida.
    return this.http.get<ListadoPublicaciones>(this.apiUrl, {
      params: query,
      withCredentials: true,
    });
  }

  darMeGusta(id: string): Observable<RespuestaMeGusta> {
    // No se recibe usuarioId: el servidor lo obtiene de la cookie/JWT.
    return this.http.post<RespuestaMeGusta>(
      `${this.apiUrl}/${id}/likes`,
      {},
      { withCredentials: true },
    );
  }

  quitarMeGusta(id: string): Observable<RespuestaMeGusta> {
    return this.http.delete<RespuestaMeGusta>(`${this.apiUrl}/${id}/likes`, {
      withCredentials: true,
    });
  }

  // Solo el contenedor llama este método después de confirmar en el modal propio.
  darDeBaja(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  /**
   * POST /publicaciones
   *
   * Endpoint protegido por AuthGuard en NestJS.
   * El navegador envía la cookie HttpOnly.
   */
  crear(datos: CrearPublicacionDto): Observable<Publicacion> {
    // El navegador genera el boundary; no fijamos Content-Type manualmente.
    const formulario = new FormData();
    formulario.append('titulo', datos.titulo);
    formulario.append('descripcion', datos.descripcion);
    if (datos.imagen) formulario.append('imagen', datos.imagen);
    return this.http.post<Publicacion>(this.apiUrl, formulario, {
      withCredentials: true,
    });
  }
}
