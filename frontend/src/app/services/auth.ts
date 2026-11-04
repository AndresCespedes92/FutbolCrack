import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from './api.config';

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
  activo?: boolean;
}

// Respuesta del endpoint POST /auth/registro.
export interface RespuestaRegistro {
  mensaje: string;
  usuario: Usuario;
}

// El backend confirma el login.
// El JWT viaja únicamente en la cookie HttpOnly.
export interface DatosSesion {
  usuario: Usuario;
  emitidaEn: string;
  expiraEn: string;
  horaServidor: string;
}
export interface RespuestaLogin extends DatosSesion {
  mensaje: string;
}

// Datos que enviaremos al iniciar sesión.
export interface CredencialesLogin {
  identificador: string;
  password: string;
}

// Estado único de sesión en memoria: guarda usuario/fechas, nunca el JWT de la cookie HttpOnly.
/**
 * Estado compartido de autenticación y transporte HTTP del cliente, no un verificador de JWT.
 * El navegador administra la cookie HttpOnly; aquí se conservan en memoria usuario y fechas,
 * nunca la contraseña ni el token como almacenamiento de sesión.
 * Las signals alimentan navbar/modal. Los Observables se suscriben desde componentes o guards;
 * takeUntilDestroyed limpia suscripciones y versionSesion descarta respuestas de una sesión vieja.
 * Nest decide la identidad y los permisos: los timers de Angular mejoran la experiencia,
 * pero no reemplazan la verificación criptográfica ni la consulta del usuario en el servidor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${API_URL}/auth`;
  readonly usuarioActual = signal<Usuario | null>(null);
  readonly expiraEn = signal<number | null>(null);
  readonly mostrarAviso = signal(false);
  readonly renovando = signal(false);
  readonly errorRenovacion = signal('');
  readonly mensajeSesion = signal('');
  private comprobada = false;
  private desfaseServidor = 0;
  private avisoMostrado = false;
  // Descarta respuestas antiguas que lleguen después de logout/vencimiento o de una nueva sesión.
  private versionSesion = 0;
  private avisoTimer?: ReturnType<typeof setTimeout>;
  private vencimientoTimer?: ReturnType<typeof setTimeout>;
  private autorizacionEnCurso?: Observable<DatosSesion | null>;
  private renovacionEnCurso?: Observable<DatosSesion>;
  constructor() {
    // Una pestaña suspendida puede omitir timers: al regresar se compara con el exp real.
    const revisar = () => this.comprobarTiempo();
    const visible = () => {
      if (document.visibilityState === 'visible') revisar();
    };
    window.addEventListener('focus', revisar);
    document.addEventListener('visibilitychange', visible);
    this.destroyRef.onDestroy(() => {
      this.limpiarTemporizadores();
      window.removeEventListener('focus', revisar);
      document.removeEventListener('visibilitychange', visible);
    });
  }
  registrar(datos: FormData): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${this.apiUrl}/registro`, datos);
  }
  /**
   * Envía identificador y contraseña a POST /auth/login con withCredentials.
   * Si Nest acepta, el navegador procesa Set-Cookie y el JSON aporta usuario y vencimiento;
   * tap recupera ese estado antes de que Login navegue. Un 401 se muestra en el formulario.
   * withCredentials permite el intercambio de cookies entre orígenes, pero no permite leer
   * HttpOnly ni saltea CORS, Secure, SameSite o las políticas del navegador.
   */
  login(credenciales: CredencialesLogin): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${this.apiUrl}/login`, credenciales, { withCredentials: true })
      .pipe(tap((datos) => this.recuperarSesion(datos)));
  }
  /**
   * Reconstruye la sesión al arrancar o recargar usando POST /auth/autorizar.
   * Comparte una solicitud en curso con shareReplay para que raíz y guard no dupliquen llamadas.
   * El backend comprueba la cookie vigente SIN emitir un JWT nuevo: recargar no extiende el plazo.
   * Un 401 se transforma en null para continuar como invitado; red/500 se propagan para mostrar
   * reconexión, sin afirmar que una caída de servidor significa credenciales incorrectas.
   */
  autorizar(): Observable<DatosSesion | null> {
    if (this.autorizacionEnCurso) return this.autorizacionEnCurso;
    const version = this.versionSesion;
    // Raíz y guard comparten el mismo POST mientras está pendiente; no hay dos autorizaciones.
    this.autorizacionEnCurso = this.http
      .post<DatosSesion>(`${this.apiUrl}/autorizar`, {}, { withCredentials: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((datos) => {
          if (version !== this.versionSesion) return null;
          this.recuperarSesion(datos);
          return datos;
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.finalizarSesion('Iniciá sesión para continuar.', false);
            return of(null);
          }
          return throwError(() => error); // Red/500 no significan credenciales vencidas.
        }),
        finalize(() => (this.autorizacionEnCurso = undefined)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    return this.autorizacionEnCurso;
  }
  /**
   * El guard del router pide un booleano, no el token. Primero compara la hora de vencimiento;
   * si hay estado válido evita otra llamada, y si todavía no se comprobó la sesión usa autorizar.
   * Esta optimización de navegación no asegura permisos remotos: cada escritura se valida en Nest.
   */
  comprobarAcceso(): Observable<boolean> {
    this.comprobarTiempo();
    if (this.usuarioActual()) return of(true);
    if (this.comprobada) return of(false);
    return this.autorizar().pipe(map((sesion) => !!sesion));
  }
  /**
   * Reutiliza el usuario obtenido al autorizar para evitar un GET me repetido por cada pantalla.
   * En consumidores aislados puede consultar /auth/me. Una sesión ya comprobada como ausente
   * produce HttpErrorResponse 401 local: no todo 401 observado por un componente viajó por la red.
   */
  obtenerMiPerfil(): Observable<Usuario> {
    this.comprobarTiempo();
    const usuario = this.usuarioActual();
    if (usuario) return of(usuario); // Evita repetir GET me tras autorizar al abrir perfil/feed/detalle.
    if (this.comprobada) return throwError(() => new HttpErrorResponse({ status: 401 }));
    // Compatibilidad del método para consumidores aislados; la app real autoriza antes del outlet.
    return this.http.get<Usuario>(`${this.apiUrl}/me`, { withCredentials: true });
  }
  /**
   * Renovación VOLUNTARIA: solo la acción Extender sesión del modal llama a este POST.
   * Comparte solicitudes simultáneas y conserva el usuario si falla la red, permitiendo reintentar.
   * Un 401 invalida la sesión; una respuesta exitosa instala las fechas del nuevo JWT.
   * No existe aquí un refresh token de larga duración: si el JWT ya venció, hay que hacer login.
   */
  refrescar(): Observable<DatosSesion> {
    if (this.renovacionEnCurso) return this.renovacionEnCurso;
    this.comprobarTiempo();
    if (!this.usuarioActual()) return throwError(() => new HttpErrorResponse({ status: 401 }));
    const version = this.versionSesion;
    this.renovando.set(true);
    this.errorRenovacion.set('');
    this.renovacionEnCurso = this.http
      .post<DatosSesion>(`${this.apiUrl}/refrescar`, {}, { withCredentials: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((datos) => {
          if (version === this.versionSesion) this.recuperarSesion(datos);
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) this.invalidarSesion();
          else
            this.errorRenovacion.set(
              'No se pudo extender la sesión. Intentá nuevamente antes del vencimiento.',
            );
          return throwError(() => error);
        }),
        finalize(() => {
          this.renovando.set(false);
          this.renovacionEnCurso = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    return this.renovacionEnCurso;
  }
  ahoraNo(): void {
    if (!this.renovando()) this.mostrarAviso.set(false);
  }
  minutosRestantes(): number {
    return Math.max(
      1,
      Math.ceil(((this.expiraEn() ?? this.ahoraServidor()) - this.ahoraServidor()) / 60000),
    );
  }
  /**
   * Compara expiraEn con la hora corregida por el servidor. Al llegar al vencimiento elimina
   * el estado local y redirige al login; cuando quedan cinco minutos abre el aviso una sola vez.
   * El umbral NO significa siempre diez minutos desde login: depende de la duración del backend.
   * En la configuración actual de sesion.constants.ts son diez minutos de sesión y aviso a los cinco.
   */
  comprobarTiempo(): void {
    const vencimiento = this.expiraEn();
    if (!vencimiento) return;
    const restante = vencimiento - this.ahoraServidor();
    if (restante <= 0) {
      this.invalidarSesion();
      return;
    }
    if (restante <= 5 * 60000 && !this.avisoMostrado) {
      this.avisoMostrado = true;
      this.mostrarAviso.set(true);
    }
  }
  invalidarSesion(): void {
    if (this.comprobada && !this.usuarioActual() && !this.expiraEn()) return;
    this.finalizarSesion(
      'Tu sesión venció o ya no está autorizada. Iniciá sesión nuevamente.',
      true,
    );
  }
  /**
   * Solicita a Nest expirar la cookie y recién en éxito limpia el estado local.
   * Si falla la red, el llamador puede avisar/reintentar sin fingir que la cookie ya desapareció.
   * El logout no implementa una lista de JWT revocados: una copia previa válida puede conservar
   * vigencia hasta exp, salvo que el usuario deje de estar habilitado en MongoDB.
   */
  cerrarSesion(): Observable<{ mensaje: string }> {
    return this.http
      .post<{ mensaje: string }>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.finalizarSesion('', false)));
  }
  /**
   * Recibe metadatos, no un JWT legible por Angular. Valida fechas/usuario antes de usarlos,
   * calcula desfaseServidor y programa aviso/vencimiento respecto de exp real.
   * Reemplaza temporizadores anteriores; no agrega un plazo fijo al momento de recargar.
   * El número versionSesion impide que una respuesta vieja reactive una sesión que ya cerramos.
   */
  private recuperarSesion(datos: DatosSesion): void {
    if (datos.usuario?.activo === false)
      throw new HttpErrorResponse({
        status: 401,
        error: { mensaje: 'La cuenta está deshabilitada' },
      });
    const vence = Date.parse(datos.expiraEn),
      servidor = Date.parse(datos.horaServidor);
    if (
      !datos.usuario ||
      !Number.isFinite(vence) ||
      !Number.isFinite(servidor) ||
      vence <= servidor
    )
      throw new Error('El servidor no devolvió metadatos de sesión vigentes');
    this.versionSesion++;
    this.comprobada = true;
    this.desfaseServidor = servidor - Date.now();
    this.usuarioActual.set(datos.usuario);
    this.expiraEn.set(vence);
    this.mensajeSesion.set('');
    this.avisoMostrado = false;
    this.mostrarAviso.set(false);
    this.errorRenovacion.set('');
    this.limpiarTemporizadores();
    this.avisoTimer = setTimeout(
      () => this.comprobarTiempo(),
      Math.max(0, vence - this.ahoraServidor() - 5 * 60000),
    );
    this.vencimientoTimer = setTimeout(
      () => this.comprobarTiempo(),
      Math.max(0, vence - this.ahoraServidor()),
    );
    this.comprobarTiempo();
  }
  /**
   * Limpieza única para logout, falta de sesión o vencimiento: borra usuario/fechas y timers,
   * restablece modal/errores y, si corresponde, devuelve al login con returnUrl interno.
   * La signal al pasar a null actualiza los enlaces del navbar sin recargar toda la aplicación.
   */
  private finalizarSesion(mensaje: string, redirigir: boolean): void {
    this.versionSesion++;
    this.comprobada = true;
    this.limpiarTemporizadores();
    this.usuarioActual.set(null);
    this.expiraEn.set(null);
    this.mostrarAviso.set(false);
    this.errorRenovacion.set('');
    this.mensajeSesion.set(mensaje);
    if (redirigir && !this.router.url.startsWith('/login')) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    }
  }
  private ahoraServidor(): number {
    return Date.now() + this.desfaseServidor;
  }
  private limpiarTemporizadores(): void {
    clearTimeout(this.avisoTimer);
    clearTimeout(this.vencimientoTimer);
    this.avisoTimer = undefined;
    this.vencimientoTimer = undefined;
  }
}
