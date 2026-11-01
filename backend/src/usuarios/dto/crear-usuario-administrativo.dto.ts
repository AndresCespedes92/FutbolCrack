import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto.js';

// Hereda correo, confirmación, fecha y descripción del registro. SOLO este DTO admite perfil.
// Al agregar reglas sobre un campo heredado se declaran TODAS sus validaciones: class-validator
// puede reemplazar metadatos custom del padre; un MaxLength aislado no conserva la fuerza de la clave.
export class CrearUsuarioAdministrativoDto extends CreateUsuarioDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+)*$/u)
  declare nombre: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[\p{L}\p{M}]+(?:[ '’\-][\p{L}\p{M}]+)*$/u)
  declare apellido: string;
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._]{2,19}$/, {
    message: 'El usuario debe tener de 3 a 20 caracteres válidos',
  })
  declare nombreUsuario: string;
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener una mayúscula y un número',
  })
  declare password: string;
  @IsIn(['usuario', 'administrador'], {
    message: 'Seleccioná usuario o administrador',
  })
  perfil: 'usuario' | 'administrador';
}
