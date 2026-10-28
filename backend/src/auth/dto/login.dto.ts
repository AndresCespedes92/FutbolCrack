import { IsNotEmpty, IsString } from 'class-validator';

// Define los datos que el usuario debe enviar para iniciar sesión.
export class LoginDto {
  // Puede ser el correo o el nombre de usuario.
  @IsString()
  @IsNotEmpty({ message: 'Ingresá tu correo o nombre de usuario' })
  identificador: string;

  // Contraseña ingresada por el usuario.
  @IsString()
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  password: string;
}