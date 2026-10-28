
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

// Respuesta del endpoint POST /auth/login.
export interface RespuestaLogin {
  access_token: string;
  usuario: Usuario;
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

  // Inyección de dependencias con inject(),
  // concepto que ya trabajamos en Angular.
  private readonly http = inject(HttpClient);

  // Dirección de nuestro backend local.
  // Más adelante la configuraremos por entorno
  // para utilizar también el backend desplegado.
  private readonly apiUrl = 'http://localhost:3000/auth';

  /**
   * REGISTRO
   *
   * Recibe un FormData con los datos del usuario
   * y una imagen opcional.
   *
   * HttpClient envía la solicitud al backend.
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
   * Envía el identificador y la contraseña.
   * El backend responde con un JWT y los datos del usuario.
   */
  login(
    credenciales: CredencialesLogin,
  ): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(
      `${this.apiUrl}/login`,
      credenciales,
    );
  }
}
