import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Ficha editable del jugador. La lista explícita excluye rol, estado y credenciales:
 * con whitelist/forbidNonWhitelisted, intentar cambiarlos responde 400.
 * La imagen se valida como archivo, nunca como una URL elegida por el cliente.
 */
export class EditarPerfilDto {
  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+)*$/u)
  nombre: string;

  @Transform(recortar)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+)*$/u)
  apellido: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'Ingresá un correo válido' })
  @MaxLength(254)
  correo: string;

  @Transform(recortar)
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._]*$/)
  nombreUsuario: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true }, { message: 'Ingresá una fecha de nacimiento válida' })
  fechaNacimiento: string;

  // Ausente conserva la descripción; cadena vacía permite limpiarla. null no es texto válido.
  @ValidateIf((_objeto, valor) => valor !== undefined)
  @IsString()
  @MaxLength(300)
  descripcion?: string;
}
