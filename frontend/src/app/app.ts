import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Navbar } from './components/navbar/navbar';
import { ExtenderSesion } from './components/extender-sesion/extender-sesion';
import { AuthService } from './services/auth';

// La recepción espera al carnet validado antes de montar las pantallas y sus peticiones.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ExtenderSesion],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly cargandoSesion = signal(true);
  readonly errorInicial = signal('');
  ngOnInit(): void {
    this.comprobarSesion();
  }
  /**
   * Punto de entrada del recorrido de sesión: espera POST autorizar antes de montar las pantallas.
   * Si no hay sesión, permite login/registro y encamina las demás URLs al login según esta lógica
   * de arranque, aunque el endpoint GET de publicaciones sea público en Nest.
   * Una falla de red muestra reconexión: no se confunde con un 401 ni se cargan datos privados
   * guardados. Esta diferencia entre router, arranque y API pública es importante en la defensa.
   */
  comprobarSesion(): void {
    this.cargandoSesion.set(true);
    this.errorInicial.set('');
    this.auth
      .autorizar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sesion) => {
          const destino =
            this.router.getCurrentNavigation()?.extractedUrl.toString() ?? this.router.url;
          if (!sesion && !/^\/(login|registro)([/?]|$)/.test(destino)) {
            void this.router
              .navigate(['/login'], { queryParams: { returnUrl: destino } })
              .finally(() => this.cargandoSesion.set(false));
          } else this.cargandoSesion.set(false);
        },
        error: () => {
          this.errorInicial.set(
            'No pudimos comprobar tu sesión. Revisá la conexión e intentá nuevamente.',
          );
          this.cargandoSesion.set(false);
        },
      });
  }
  extenderSesion(): void {
    this.auth
      .refrescar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          /* El servicio conserva el error visible y no borra la sesión por problemas de red. */
        },
      });
  }
}
