import { FechaRelativaPipe } from './fecha-relativa.pipe';
describe('FechaRelativaPipe', () => {
  const pipe = new FechaRelativaPipe(),
    ahora = Date.parse('2026-11-01T15:00:00Z');
  it.each([
    [0, 'Hace un momento'],
    [59, 'Hace un momento'],
    [60, 'Hace 1 minuto'],
    [300, 'Hace 5 minutos'],
    [3599, 'Hace 59 minutos'],
    [3600, 'Hace 1 hora'],
    [7200, 'Hace 2 horas'],
    [86400, 'Ayer'],
    [259200, 'Hace 3 días'],
  ])('distancia de %s segundos: %s', (segundos, esperado) => {
    expect(pipe.transform(new Date(ahora - Number(segundos) * 1000).toISOString(), ahora)).toBe(
      esperado,
    );
  });
  it('acepta Date y offsets equivalentes, y no altera la fecha', () => {
    const fecha = new Date(ahora - 300000);
    expect(pipe.transform(fecha, ahora)).toBe('Hace 5 minutos');
    expect(pipe.transform('2026-11-01T11:55:00-03:00', ahora)).toBe('Hace 5 minutos');
    expect(fecha.getTime()).toBe(ahora - 300000);
  });
  it('fecha futura tiene mensaje explícito sin duraciones negativas', () => {
    expect(pipe.transform(new Date(ahora + 1000), ahora)).toBe('Próximamente');
  });
  it.each([
    null,
    undefined,
    '',
    '   ',
    'ayer',
    '2026-02-30T12:00:00Z',
    '2026-13-01',
    new Date('invalida'),
    123,
    {},
  ])('valor inválido %# no arroja excepción', (valor) => {
    expect(pipe.transform(valor as string, ahora)).toBe('Fecha no disponible');
  });
  it('ahora inválido no produce un texto engañoso', () => {
    expect(pipe.transform(new Date(), NaN)).toBe('Fecha no disponible');
  });
});
