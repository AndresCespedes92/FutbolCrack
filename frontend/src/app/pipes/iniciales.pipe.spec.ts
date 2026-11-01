import { InicialesPipe } from './iniciales.pipe';
describe('InicialesPipe', () => {
  const pipe = new InicialesPipe();
  it.each([
    ['Juan Pérez', 'JP'],
    ['María', 'M'],
    [' María del Carmen ', 'MC'],
    ['  juan   pérez ', 'JP'],
    ['Ángel López', 'ÁL'],
    ['Ángel López', 'ÁL'],
  ])('%s produce %s', (nombre, esperado) => {
    expect(pipe.transform(nombre)).toBe(esperado);
  });
  it.each([null, undefined, '', '  ', '123', '⚽', 12, {}])(
    'ausencia/valor inválido %# usa marca FC',
    (nombre) => {
      expect(pipe.transform(nombre as string)).toBe('FC');
    },
  );
});
