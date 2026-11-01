import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
export type PerfilUsuario = 'usuario' | 'administrador';
export interface UsuarioAdministrativo {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: PerfilUsuario;
  activo: boolean;
}
export interface CrearUsuarioAdministrativo {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  password: string;
  repetirPassword: string;
  fechaNacimiento: string;
  descripcion: string;
  perfil: PerfilUsuario;
}
// HTTP del padrón, separado del registro público: siempre usa cookies y endpoints administrativos.
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/usuarios`;
  listar(): Observable<UsuarioAdministrativo[]> {
    return this.http.get<UsuarioAdministrativo[]>(this.url, { withCredentials: true });
  }
  crear(
    datos: CrearUsuarioAdministrativo,
  ): Observable<{ mensaje: string; usuario: UsuarioAdministrativo }> {
    return this.http.post<{ mensaje: string; usuario: UsuarioAdministrativo }>(this.url, datos, {
      withCredentials: true,
    });
  }
  deshabilitar(id: string): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`, { withCredentials: true });
  }
  habilitar(id: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.url}/${id}/habilitar`,
      {},
      { withCredentials: true },
    );
  }
}
