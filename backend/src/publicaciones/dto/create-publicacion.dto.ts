import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// La ficha de publicación solo acepta el texto que Angular ya envía: { contenido }.
// La clase conserva metadatos en ejecución; una interface no permite validar con ValidationPipe.
export class CreatePublicacionDto {
  // Igual que el servicio: quitamos espacios externos, sin convertir números/objetos a texto.
  // El chequeo de tipo evita llamar trim sobre un valor que no es string.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El contenido debe ser un texto' })
  @IsNotEmpty({
    message: 'La publicación debe contener entre 1 y 2000 caracteres',
  })
  @MaxLength(2000, {
    message: 'La publicación debe contener entre 1 y 2000 caracteres',
  })
  contenido: string;
}
