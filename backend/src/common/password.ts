import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
// Registro público y alta administrativa comparten coincidencia/hash, sin copiar reglas de negocio.
/**
 * Reglas compartidas por registro y alta administrativa: coincidencia de claves y límite UTF-8.
 * bcrypt utiliza hasta 72 bytes; rechazar un exceso evita aceptar silenciosamente claves distintas
 * con igual prefijo. El costo 12 se usa al hashear; el salt forma parte del hash generado.
 * Devuelve el hash para MongoDB o BadRequestException 400, nunca una contraseña recuperable.
 */
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
