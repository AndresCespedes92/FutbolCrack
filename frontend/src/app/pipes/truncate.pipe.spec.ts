import { TruncatePipe } from './truncate.pipe';
describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();
  it('conserva texto corto y trata valores ausentes como vacío', () => {
    expect(pipe.transform('Pase')).toBe('Pase');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
  it('recorta solo al superar el límite y agrega puntos suspensivos', () => {
    expect(pipe.transform('12345', 5)).toBe('12345');
    expect(pipe.transform('123456', 5)).toBe('12345…');
  });
  it('al expandir devuelve el contenido completo sin modificarlo', () => {
    const texto = 'Jugada '.repeat(60);
    expect(pipe.transform(texto, 280, true)).toBe(texto);
    expect(texto.length).toBe(420);
  });
});
