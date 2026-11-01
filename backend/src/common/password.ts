import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// Registro público y alta administrativa comparten coincidencia/hash, sin copiar reglas de negocio.
export async function generarHashPassword(
  password: string,
  repetirPassword: string,
): Promise<string> {
  if (password !== repetirPassword)
    throw new BadRequestException('Las contraseñas no coinciden');
  // bcrypt solo usa los primeros 72 bytes, no 72 letras. Rechazar evita claves distintas
  // con el mismo prefijo truncado; se aplica tanto al registro como al alta administrativa.
  if (Buffer.byteLength(password, 'utf8') > 72)
    throw new BadRequestException(
      'La contraseña es demasiado larga; reducí su longitud o los caracteres especiales',
    );
  return bcrypt.hash(password, 12);
}
