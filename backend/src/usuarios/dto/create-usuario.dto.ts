//	Define qué datos deben presentar para inscribirse

//Define qué datos acepta NestJS y cómo validarlos - DTO significa Data Transfer Object (objeto de transferencia de datos)
//
//Recibe datos del formulario
// 
// define qué información puede enviar Angular cuando un usuario intenta registrarse y qué condiciones debe cumplir
// Por ejemplo, si alguien escribe:
// - Nombre: Juan
// - Correo: juan@gmail.com
// - Contraseña: futbol123
// El DTO debería rechazar esa contraseña porque no contiene ninguna mayúscula.
// mediante ValidationPipe, devolverá un error HTTP 400 Bad Request antes de guardar nada en MongoDB..

//Schema vs. DTO
// Por ejemplo, para registrar a un usuario llamado Juan:
// DTO — Validación de entrada
// ¿El nombre es texto? ¿El correo es válido? ¿La contraseña cumple los requisitos?
// Schema — Estructura de MongoDB
// ¿Qué campos guardamos? ¿Cuáles son obligatorios? ¿Qué valores tienen por defecto?


import {IsString,IsNotEmpty,IsEmail,MinLength,Matches,IsDateString,IsOptional,MaxLength,} from 'class-validator';

// Define y valida los datos recibidos al registrar un usuario.
export class CreateUsuarioDto {
  //Comprueba que el dato sea texto - Impide valores vacíos
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  // Verifica que el correo tenga un formato válido.
  @IsEmail({}, { message: 'Ingresá un correo válido' })
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  // Mínimo 8 caracteres, una mayúscula y un número.
  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener una mayúscula y un número',
  })
  password: string;

  // La coincidencia con password se verificará en el servicio.
  @IsString()
  @IsNotEmpty()
  repetirPassword: string;

  // Comprueba que la fecha tenga formato ISO válido.
  @IsDateString({}, {
    message: 'Ingresá una fecha de nacimiento válida',
  })
  fechaNacimiento: string;

  // La descripción es opcional y admite hasta 300 caracteres.
  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;
}
