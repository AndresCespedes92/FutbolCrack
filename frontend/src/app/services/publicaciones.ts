
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  multimediaUrl: string;
  tipoMultimedia: 'ninguno' | 'imagen' | 'video';
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos necesarios para crear una publicación.
 */
export interface CrearPublicacionDto {
  contenido: string;
}

@Injectable({
  providedIn: 'root',
})
export class PublicacionesService {

  private readonly http = inject(HttpClient);

  // Backend local de FutbolCrack.
  private readonly apiUrl =
    'https://futbol-crackbackend.vercel.app/publicaciones';

  /**
   * GET /publicaciones
   *
   * Endpoint público.
   * Devuelve las últimas publicaciones de MongoDB.
   */
  listar(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(this.apiUrl);
  }

  /**
   * POST /publicaciones
   *
   * Endpoint protegido por AuthGuard en NestJS.
   * El navegador envía la cookie HttpOnly.
   */
  crear(datos: CrearPublicacionDto): Observable<Publicacion> {
    return this.http.post<Publicacion>(
      this.apiUrl,
      datos,
      {
        withCredentials: true,
      },
    );
  }
}
