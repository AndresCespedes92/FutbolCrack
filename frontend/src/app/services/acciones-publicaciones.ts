import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Usuario } from './auth';
import { Publicacion, PublicacionesService } from './publicaciones';

// Estado local por contenedor (providers), compartiendo reglas entre feed y perfil.
// Centraliza mutaciones/mensajes; las tarjetas solo emiten eventos, como en CineBera.
@Injectable()
/**
 * Coordinador de acciones reutilizado mediante providers locales de feed/perfil/detalle.
 * La tarjeta emite intenciones por Output y este servicio hace HTTP, mensajes y bloqueo de envío.
 * El Set de IDs pendientes evita doble acción sobre una jugada sin bloquear todas las demás.
 * Los permisos visuales ayudan al usuario; Nest consulta autor/rol antes de escribir realmente.
 */
export class AccionesPublicaciones {
  private readonly api = inject(PublicacionesService);
  private readonly destroyRef = inject(DestroyRef);
  readonly pendientes = signal(new Set<string>());
  readonly seleccionada = signal<Publicacion | null>(null);
  readonly eliminando = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  puedeDarBaja(publicacion: Publicacion, usuario: Usuario | null): boolean {
    // Solo visibilidad. NestJS vuelve a verificar autor/administrador actual en MongoDB.
    return (
      !!usuario &&
      publicacion.activo !== false &&
      (publicacion.autorId?._id === usuario.id || usuario.perfil === 'administrador')
    );
  }
  /**
   * El estado meGusta decide POST o DELETE de /likes. No incrementamos un número a ciegas:
   * tras éxito recargamos mediante el callback del contenedor para mostrar el valor confirmado.
   * Si otra pestaña cambió el voto, 409/404 provoca sincronización sin fingir un alta exitosa.
   * Un 401 pasa además por el interceptor; red/403 no son motivo para borrar la sesión.
   */
  alternarLike(publicacion: Publicacion, usuario: Usuario | null, actualizar: () => void): void {
    if (!usuario || publicacion.activo === false || this.pendientes().has(publicacion._id)) return;
    this.mensaje.set('');
    this.error.set('');
    this.pendientes.update((ids) => new Set(ids).add(publicacion._id));
    const solicitud = publicacion.meGusta
      ? this.api.quitarMeGusta(publicacion._id)
      : this.api.darMeGusta(publicacion._id);
    solicitud.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        this.liberar(publicacion._id);
        this.mensaje.set(respuesta.mensaje);
        actualizar();
      },
      error: (error: HttpErrorResponse) => {
        this.liberar(publicacion._id);
        this.error.set(this.explicarError(error, 'actualizar el me gusta'));
        // Un conflicto indica que otra pestaña cambió el voto: sincronizamos sin simular éxito.
        if (error.status === 409 || error.status === 404) actualizar();
      },
    });
  }
  solicitarBaja(publicacion: Publicacion, usuario: Usuario | null): void {
    if (!this.puedeDarBaja(publicacion, usuario) || this.pendientes().has(publicacion._id)) return;
    this.error.set('');
    this.mensaje.set('');
    this.seleccionada.set(publicacion);
  }
  cancelarBaja(): void {
    if (!this.eliminando()) {
      this.seleccionada.set(null);
      this.error.set('');
    }
  }
  /**
   * Único punto del coordinador que envía DELETE: solicitarBaja solo selecciona y muestra modal.
   * Cancelar limpia esa selección sin petición. Confirmar mantiene el modal con error si falla;
   * solo después del éxito lo cierra, informa al usuario y actualiza la colección/destino.
   */
  confirmarBaja(actualizar: () => void): void {
    const publicacion = this.seleccionada();
    if (!publicacion || this.eliminando()) return;
    this.eliminando.set(true);
    this.error.set('');
    this.api
      .darDeBaja(publicacion._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.eliminando.set(false);
          this.seleccionada.set(null);
          this.mensaje.set(respuesta.mensaje);
          actualizar();
        },
        error: (error: HttpErrorResponse) => {
          this.eliminando.set(false);
          this.error.set(this.explicarError(error, 'dar de baja la publicación'));
        },
      });
  }
  private liberar(id: string): void {
    this.pendientes.update((ids) => {
      const copia = new Set(ids);
      copia.delete(id);
      return copia;
    });
  }
  private explicarError(error: HttpErrorResponse, accion: string): string {
    if (error.status === 401) return 'Tu sesión venció. Iniciá sesión nuevamente para continuar.';
    if (error.status === 403) return 'No tenés permiso para dar de baja esta publicación.';
    if (error.status === 404) return 'La publicación ya no está disponible. Actualizá el listado.';
    if (error.status === 409) return 'El voto cambió en otra solicitud. Se actualizará el listado.';
    if (error.status === 503)
      return 'Los votos de esta publicación están en preparación. Intentá nuevamente más tarde.';
    return error.status === 0
      ? 'No se pudo conectar con el servidor. Intentá nuevamente.'
      : `No pudimos ${accion}. Intentá nuevamente.`;
  }
}
