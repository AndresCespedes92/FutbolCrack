

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Datos que devuelve el backend para identificar al usuario.
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: string;
}

// Respuesta del endpoint POST /auth/registro.
export interface RespuestaRegistro {
  mensaje: string;
  usuario: Usuario;
}

// El backend confirma el login.
// El JWT viaja únicamente en la cookie HttpOnly.
export interface RespuestaLogin {
  mensaje: string;
}

// Datos que enviaremos al iniciar sesión.
export interface CredencialesLogin {
  identificador: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // Inyectamos HttpClient para comunicarnos con NestJS.
  private readonly http = inject(HttpClient);

  // Dirección del backend local.
  private readonly apiUrl = 'https://futbol-crackbackend.vercel.app/auth';

  /**
   * REGISTRO
   *
   * Envía los datos del usuario mediante FormData.
   * Puede incluir una imagen de perfil opcional.
   */
  registrar(datos: FormData): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(
      `${this.apiUrl}/registro`,
      datos,
    );
  }

  /**
   * LOGIN
   *
   * Envía las credenciales al backend.
   *
   * withCredentials: true permite que el navegador
   * reciba y envíe cookies en peticiones entre
   * Angular (localhost:4200) y NestJS (localhost:3000).
   *
   * La cookie HttpOnly no puede leerse desde JavaScript.
   */
  login(
    credenciales: CredencialesLogin,
  ): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(
      `${this.apiUrl}/login`,
      credenciales,
      {
        withCredentials: true,
      },
    );
  }

  
/**
 * OBTENER USUARIO AUTENTICADO
 *
 * Consulta GET /auth/me.
 *
 * El navegador envía automáticamente la cookie HttpOnly.
 * AuthGuard verifica el JWT en NestJS.
 *
 * Si el token venció, el backend responde 401.
 */
obtenerMiPerfil(): Observable<Usuario> {
  return this.http.get<Usuario>(
    `${this.apiUrl}/me`,
    {
      withCredentials: true,
    },
  );
}


/**
 * CERRAR SESIÓN
 *
 * Solicita a NestJS eliminar la cookie HttpOnly.
 * Angular no puede borrarla directamente porque
 * está protegida contra acceso desde JavaScript.
 */
cerrarSesion(): Observable<{ mensaje: string }> {
  return this.http.post<{ mensaje: string }>(
    `${this.apiUrl}/logout`,
    {},
    {
      withCredentials: true,
    },
  );
}


}
