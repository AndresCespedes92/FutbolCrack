import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardEstadisticas } from './dashboard-estadisticas';
import { API_URL } from '../../services/api.config';
const rutas = ['publicaciones-por-usuario', 'comentarios-totales', 'comentarios-por-publicacion'];
describe('Dashboard estadísticas: filtros independientes y gráficos con datos de API', () => {
  let fixture: ComponentFixture<DashboardEstadisticas>, http: HttpTestingController;
  function solicitud(indice: number) {
    return http.expectOne((r) => r.url === `${API_URL}/estadisticas/${rutas[indice]}`);
  }
  function responder(indice: number, vacio = false, factor = 1) {
    const req = solicitud(indice);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    const rango = {
      desde: req.request.params.get('desde'),
      hasta: req.request.params.get('hasta'),
      zonaHoraria: 'UTC-03:00',
    };
    if (indice === 0)
      req.flush({
        ...rango,
        datos: vacio
          ? []
          : [
              { usuarioId: '2', nombre: 'Ana Goles', nombreUsuario: 'ana', cantidad: 2 * factor },
              { usuarioId: '3', nombre: 'Beto Club', nombreUsuario: 'beto', cantidad: factor },
            ],
      });
    if (indice === 1)
      req.flush({
        ...rango,
        total: vacio ? 0 : 3 * factor,
        dias: vacio
          ? []
          : [
              { fecha: rango.desde, cantidad: factor },
              { fecha: rango.hasta, cantidad: 2 * factor },
            ],
      });
    if (indice === 2)
      req.flush({
        ...rango,
        datos: vacio
          ? []
          : [
              { publicacionId: '11', titulo: 'Gol de Ana', cantidad: 2 * factor },
              { publicacionId: '12', titulo: 'Pase de Beto', cantidad: factor },
            ],
      });
    fixture.detectChanges();
    return req;
  }
  function enviar(indice: number) {
    fixture.nativeElement
      .querySelectorAll('form')
      [indice].dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardEstadisticas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardEstadisticas);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());
  it('muestra seis campos de fecha, tres cargas independientes y solicitudes con rango/zona coherente', () => {
    expect(fixture.nativeElement.querySelectorAll('input[type=date]').length).toBe(6);
    expect(fixture.nativeElement.textContent).toContain('Cargando reporte');
    for (let i = 0; i < 3; i++) {
      const req = responder(i);
      expect(req.request.params.get('desde')).toMatch(/^\d{4}-\d{2}-01$/);
      expect(req.request.params.get('hasta')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(fixture.nativeElement.querySelectorAll('.rango-aplicado').length).toBe(3);
  });
  it('representa barras, línea, dona y tablas con cantidades reales, sin descargar publicaciones/comentarios', () => {
    for (let i = 0; i < 3; i++) responder(i);
    expect(fixture.nativeElement.querySelectorAll('.barra').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.barra').style.width).toBe('100%');
    expect(fixture.nativeElement.querySelectorAll('.punto').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.linea').getAttribute('points')).toContain(',95');
    expect(fixture.nativeElement.querySelectorAll('.dona circle').length).toBe(2);
    expect(
      parseFloat(
        fixture.nativeElement.querySelector('.dona circle').getAttribute('stroke-dasharray'),
      ),
    ).toBeCloseTo(66.6667, 3);
    expect(fixture.nativeElement.querySelectorAll('table').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Gol de Ana');
    expect(fixture.nativeElement.textContent).toContain('Ana Goles');
    expect(fixture.nativeElement.querySelector('.total').textContent).toContain('3');
    http.expectNone((r) => r.url === `${API_URL}/publicaciones` || r.url.includes('/auth/'));
  });
  it.each([
    { desde: '', hasta: '' },
    { desde: '2026-10-03', hasta: '2026-10-01' },
    { desde: '2026-02-30', hasta: '2026-03-01' },
  ])('rechaza rango inválido %j sin HTTP y con feedback', (rango) => {
    for (let i = 0; i < 3; i++) responder(i);
    fixture.componentInstance.publicaciones.formulario.setValue(rango);
    enviar(0);
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Desde no puede ser posterior');
    http.expectNone((r) => r.url.includes('/estadisticas/'));
  });
  it('actualiza únicamente el reporte seleccionado y sus gráficos usando las nuevas fechas', () => {
    for (let i = 0; i < 3; i++) responder(i);
    const viejoPunto = fixture.nativeElement.querySelector('.linea').getAttribute('points');
    const nuevas = { desde: '2026-01-01', hasta: '2026-01-31' };
    fixture.componentInstance.total.formulario.setValue(nuevas);
    enviar(1);
    const req = solicitud(1);
    expect(req.request.params.get('desde')).toBe(nuevas.desde);
    expect(req.request.params.get('hasta')).toBe(nuevas.hasta);
    req.flush({
      ...nuevas,
      zonaHoraria: 'UTC-03:00',
      total: 9,
      dias: [{ fecha: '2026-01-15', cantidad: 9 }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.total').textContent).toContain('9');
    expect(fixture.nativeElement.querySelectorAll('.punto').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.linea').getAttribute('points')).not.toBe(
      viejoPunto,
    );
    expect(fixture.componentInstance.publicaciones.resultado!.datos[0].cantidad).toBe(2);
    http.expectNone((r) => r.url.includes('/estadisticas/'));
  });
  it('al recargar distribución cambia segmentos y tabla; al recargar barras cambian proporciones', () => {
    for (let i = 0; i < 3; i++) responder(i);
    enviar(2);
    const req = solicitud(2);
    const rango = fixture.componentInstance.comentarios.formulario.getRawValue();
    req.flush({
      ...rango,
      zonaHoraria: 'UTC-03:00',
      datos: [{ publicacionId: '12', titulo: 'Pase de Beto', cantidad: 5 }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.dona circle').length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.dona circle').getAttribute('stroke-dasharray'),
    ).toBe('100 0');
    enviar(0);
    const pub = solicitud(0);
    pub.flush({
      ...rango,
      zonaHoraria: 'UTC-03:00',
      datos: [
        { usuarioId: '2', nombre: 'Ana', nombreUsuario: 'ana', cantidad: 1 },
        { usuarioId: '3', nombre: 'Beto', nombreUsuario: 'beto', cantidad: 4 },
      ],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.barra').style.width).toBe('25%');
  });
  it('muestra los tres estados vacíos sin gráficos engañosos', () => {
    for (let i = 0; i < 3; i++) responder(i, true);
    expect(fixture.nativeElement.querySelectorAll('.sin-datos').length).toBe(3);
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    expect(fixture.nativeElement.querySelector('.barra')).toBeNull();
    expect(fixture.nativeElement.querySelector('.total').textContent).toContain('0');
  });
  it.each([400, 401, 403, 500, 0])(
    'error HTTP %s no muestra cifras viejas y permite reintentar',
    (status) => {
      for (let i = 0; i < 3; i++) responder(i);
      enviar(0);
      const req = solicitud(0);
      if (status === 0) req.error(new ProgressEvent('error'));
      else req.flush({}, { status, statusText: 'Error' });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.barra')).toBeNull();
      expect(fixture.componentInstance.publicaciones.cargando).toBe(false);
      enviar(0);
      responder(0, false, 2);
      expect(fixture.nativeElement.querySelector('.barra')).toBeTruthy();
    },
  );
  it('bloquea envíos repetidos durante carga y conserva el rango aplicado aunque edite los controles', () => {
    fixture.componentInstance.actualizar(0);
    fixture.componentInstance.actualizar(1);
    for (let i = 0; i < 3; i++) responder(i);
    fixture.componentInstance.publicaciones.formulario.setValue({
      desde: '2026-01-01',
      hasta: '2026-01-02',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rango-aplicado').textContent).toContain(
      fixture.componentInstance.publicaciones.resultado!.desde,
    );
  });
  it('dibuja a cero los días sin actividad entre jornadas con comentarios', () => {
    responder(0);
    responder(2);
    const req = solicitud(1);
    req.flush({
      desde: '2026-10-01',
      hasta: '2026-10-05',
      zonaHoraria: 'UTC-03:00',
      total: 3,
      dias: [
        { fecha: '2026-10-02', cantidad: 1 },
        { fecha: '2026-10-04', cantidad: 2 },
      ],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.linea').getAttribute('points')).toBe(
      '25,165 162.5,95 300,165 437.5,25 575,165',
    );
  });
});
