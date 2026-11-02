import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EstadisticasService,
  RangoEstadistico,
  PublicacionesPorUsuario,
  ComentariosTotales,
  ComentariosPorPublicacion,
} from '../../services/estadisticas';

// Validación cruzada del formulario, como las claves de CineBera. Nest vuelve a comprobar el rango.
function fechaValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor.startsWith('0000')) return false;
  const fecha = new Date(valor + 'T00:00:00.000Z');
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
const validarRango: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const { desde, hasta } = grupo.value as RangoEstadistico;
  return !fechaValida(desde) || !fechaValida(hasta)
    ? { fechasInvalidas: true }
    : desde > hasta
      ? { rangoInvertido: true }
      : null;
};
function crearFiltro() {
  // Defaults del mes actual en la misma zona FIJA UTC−03:00 usada por Nest, no la zona del equipo.
  const hoy = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
  return new FormGroup(
    {
      desde: new FormControl(hoy.slice(0, 8) + '01', { nonNullable: true }),
      hasta: new FormControl(hoy, { nonNullable: true }),
    },
    { validators: validarRango },
  );
}
interface Reporte<T> {
  titulo: string;
  formulario: ReturnType<typeof crearFiltro>;
  cargando: boolean;
  error: string;
  resultado: T | null;
}
function crearReporte<T>(titulo: string): Reporte<T> {
  return { titulo, formulario: crearFiltro(), cargando: false, error: '', resultado: null };
}
@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.css',
})
export class DashboardEstadisticas implements OnInit {
  private readonly api = inject(EstadisticasService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly publicaciones = crearReporte<PublicacionesPorUsuario>('Publicaciones por usuario');
  readonly total = crearReporte<ComentariosTotales>('Comentarios totales');
  readonly comentarios = crearReporte<ComentariosPorPublicacion>('Comentarios por publicación');
  readonly reportes = [this.publicaciones, this.total, this.comentarios];
  // Ranking de la tabla: copia y ordena las cantidades del rango sin modificar los datos del gráfico.
  get usuariosConMasPublicaciones(): PublicacionesPorUsuario['datos'] {
    return [...(this.publicaciones.resultado?.datos ?? [])]
      .sort((primero, segundo) => segundo.cantidad - primero.cantidad)
      .slice(0, 10);
  }
  ngOnInit(): void {
    this.actualizar(0);
    this.actualizar(1);
    this.actualizar(2);
  }
  actualizar(indice: number): void {
    if (indice === 0) this.cargar(this.publicaciones, (rango) => this.api.publicaciones(rango));
    if (indice === 1) this.cargar(this.total, (rango) => this.api.totalComentarios(rango));
    if (indice === 2)
      this.cargar(this.comentarios, (rango) => this.api.comentariosPorPublicacion(rango));
  }
  // Ayudante pequeño: estado y errores iguales; cada reporte conserva formulario y respuesta propios.
  private cargar<T>(
    reporte: Reporte<T>,
    solicitar: (rango: RangoEstadistico) => Observable<T>,
  ): void {
    if (reporte.cargando) return;
    reporte.formulario.markAllAsTouched();
    if (reporte.formulario.invalid) return;
    reporte.cargando = true;
    reporte.error = '';
    reporte.resultado = null;
    solicitar(reporte.formulario.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          reporte.resultado = resultado;
          reporte.cargando = false;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          reporte.cargando = false;
          reporte.error =
            error.status === 401
              ? 'Tu sesión venció o tu cuenta no está habilitada.'
              : error.status === 403
                ? 'No tenés permiso para consultar estadísticas.'
                : error.status === 400
                  ? 'Revisá las fechas y el orden del rango.'
                  : 'No pudimos obtener el reporte. Intentá nuevamente.';
          this.cdr.markForCheck();
        },
      });
  }
  anchoBarra(cantidad: number): number {
    return (
      (100 * cantidad) /
      Math.max(1, ...this.publicaciones.resultado!.datos.map((dato) => dato.cantidad))
    );
  }
  // SVG usa coordenadas de presentación: los conteos siempre llegan calculados por el backend.
  puntoDia(indice: number): { x: number; y: number } {
    const dias = this.total.resultado!.dias;
    const inicio = new Date(this.total.resultado!.desde).getTime();
    const fin = new Date(this.total.resultado!.hasta).getTime();
    return {
      x:
        25 +
        (550 * (new Date(dias[indice].fecha).getTime() - inicio)) /
          Math.max(86400000, fin - inicio),
      y: 165 - (140 * dias[indice].cantidad) / Math.max(1, ...dias.map((dia) => dia.cantidad)),
    };
  }
  puntosLinea(): string {
    const resultado = this.total.resultado!;
    const inicio = new Date(resultado.desde).getTime();
    const fin = new Date(resultado.hasta).getTime();
    const dia = 86400000;
    const puntos: string[] = [];
    const agregarCero = (fecha: number) =>
      puntos.push(`${25 + (550 * (fecha - inicio)) / Math.max(dia, fin - inicio)},165`);
    // Los días ausentes valen cero. Se dibujan los extremos de cada tramo vacío sin crear
    // un elemento por día ni unir dos jornadas activas ocultando días sin comentarios.
    let anterior = inicio - dia;
    resultado.dias.forEach((dato, i) => {
      const fecha = new Date(dato.fecha).getTime();
      if (fecha - anterior > dia) {
        agregarCero(anterior + dia);
        if (fecha - anterior > 2 * dia) agregarCero(fecha - dia);
      }
      const punto = this.puntoDia(i);
      puntos.push(`${punto.x},${punto.y}`);
      anterior = fecha;
    });
    if (anterior < fin) {
      agregarCero(anterior + dia);
      if (anterior + dia < fin) agregarCero(fin);
    }
    return puntos.join(' ');
  }
  get totalDistribucion(): number {
    return this.comentarios.resultado?.datos.reduce((suma, dato) => suma + dato.cantidad, 0) ?? 0;
  }
  segmento(indice: number): number {
    return (
      (100 * this.comentarios.resultado!.datos[indice].cantidad) /
      Math.max(1, this.totalDistribucion)
    );
  }
  desplazamiento(indice: number): number {
    return -this.comentarios
      .resultado!.datos.slice(0, indice)
      .reduce((suma, _, i) => suma + this.segmento(i), 0);
  }
  color(indice: number): string {
    return ['#7fa65a', '#b7cf94', '#657a55', '#d0d5c9', '#859083', '#496443'][indice % 6];
  }
}
