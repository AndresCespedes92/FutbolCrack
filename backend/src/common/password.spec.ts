import { generarHashPassword } from './password.js';
import * as bcrypt from 'bcrypt';
// Datos inventados exclusivos de tests. No se consultan ni cambian credenciales reales.
describe('Contraseñas: límite de bcrypt en bytes UTF-8', () => {
  it('rechaza antes de hash una clave ASCII de más de 72 bytes', async () => {
    const clave = 'A1' + 'a'.repeat(71);
    await expect(generarHashPassword(clave, clave)).rejects.toMatchObject({
      status: 400,
    });
  });
  it('rechaza Unicode que cabe en 64 caracteres pero supera 72 bytes', async () => {
    const clave = 'A1' + 'é'.repeat(36);
    expect(clave.length).toBeLessThan(64);
    expect(Buffer.byteLength(clave, 'utf8')).toBe(74);
    await expect(generarHashPassword(clave, clave)).rejects.toMatchObject({
      status: 400,
    });
  });
  it('acepta exactamente 72 bytes con Unicode y conserva hash costo 12 verificable', async () => {
    const clave = 'A1' + 'é'.repeat(35);
    const hash = await generarHashPassword(clave, clave);
    expect(bcrypt.getRounds(hash)).toBe(12);
    expect(await bcrypt.compare(clave, hash)).toBe(true);
    expect(await bcrypt.compare('otra-clave', hash)).toBe(false);
  });
  it('conserva la comprobación de coincidencia', async () => {
    await expect(
      generarHashPassword('Clave1234', 'otra'),
    ).rejects.toMatchObject({ status: 400 });
  });
});
