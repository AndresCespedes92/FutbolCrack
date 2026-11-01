import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// Registro público y alta administrativa comparten coincidencia/hash, sin copiar reglas de negocio.
export async function generarHashPassword(
  password: string,
  repetirPassword: string,
): Promise<string> {
  if (password !== repetirPassword)
    throw new BadRequestException('Las contraseñas no coinciden');
  return bcrypt.hash(password, 12);
}
