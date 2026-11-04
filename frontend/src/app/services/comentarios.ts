import { API_URL } from './api.config';
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Contrato real de 4A: el autor poblado es mínimo y puede ser null si la cuenta desapareció.
export interface AutorComentario {
  _id: string;
  nombre: string;
  apellido: string;
  imagenPerfil: string;
}
export interface Comentario {
  _id: string;
  publicacionId: string;
  autorId: AutorComentario | null;
  texto: string;
  modificado: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ListadoComentarios {
  comentarios: Comentario[];
  total: number;
  offset: number;
  limit: number;
  hayMas: boolean;
}
export interface RespuestaComentario {
  mensaje: string;
  comentario: Comentario;
}

// Centraliza HTTP para detalle y perfil. El servidor obtiene el autor del JWT, nunca del body.
/**
 * Servicio HTTP reutilizado por detalle/perfil. listar pide tres y recibe página más total;
 * crear/editar envían únicamente texto: autor y publicación se fijan/verifican en Nest.
 * withCredentials transporta cookie sin leerla; Observable permite al componente manejar
 * carga, éxito y error al suscribirse. No hay método eliminar porque no existe endpoint DELETE.
 */
@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = API_URL;
  listar(publicacionId: string, offset = 0): Observable<ListadoComentarios> {
    const params = new HttpParams().set('offset', offset).set('limit', 3);
    return this.http.get<ListadoComentarios>(
      `${this.apiUrl}/publicaciones/${publicacionId}/comentarios`,
      { params, withCredentials: true },
    );
  }
  crear(publicacionId: string, texto: string): Observable<RespuestaComentario> {
    return this.http.post<RespuestaComentario>(
      `${this.apiUrl}/publicaciones/${publicacionId}/comentarios`,
      { texto },
      { withCredentials: true },
    );
  }
  editar(id: string, texto: string): Observable<RespuestaComentario> {
    return this.http.put<RespuestaComentario>(
      `${this.apiUrl}/comentarios/${id}`,
      { texto },
      { withCredentials: true },
    );
  }
}
