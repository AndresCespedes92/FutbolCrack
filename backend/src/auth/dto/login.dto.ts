import { IsNotEmpty, IsString } from 'class-validator';

// Define los datos que el usuario debe enviar para iniciar sesión.
/**
 * Define credenciales de entrada como strings obligatorios; formato incorrecto produce 400
 * por ValidationPipe. Credenciales con forma válida pero incorrectas producen 401 en AuthService.
 */
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