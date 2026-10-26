import { AbstractControl, ValidationErrors } from '@angular/forms';

// Como en CineBera, la comparación se aplica al FormGroup para revisar ambos controles.
// No modificamos errores de los hijos: Angular recalcula el grupo al cambiar cualquier clave.
export function confirmarClaveValidator(formulario: AbstractControl): ValidationErrors | null {
  const clave = formulario.get('clave')?.value;
  const repeticion = formulario.get('repetirClave')?.value;
  // Si falta un dato, el mensaje corresponde a Validators.required de ese campo.
  return clave && repeticion && clave !== repeticion ? { clavesNoCoinciden: true } : null;
}

// El input date entrega YYYY-MM-DD. Usamos medianoche local para no desplazar la fecha por UTC.
export function fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const valor = String(control.value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return { fechaInvalida: true };
  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(`${valor}T00:00:00`);
  // JavaScript puede convertir un 30 de febrero en marzo: comparamos los valores originales.
  if (
    anio < 1 ||
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return { fechaInvalida: true };
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha > hoy ? { fechaFutura: true } : null;
}

// Estas constantes permiten cambiar las reglas de imagen sin buscar números en la plantilla.
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

// Comprobación local de tipo MIME y tamaño. No lee, sube ni persiste el contenido del archivo.
export function imagenPerfilValidator(control: AbstractControl): ValidationErrors | null {
  const archivo = control.value as File | null;
  if (!archivo) return null;
  if (!TIPOS_IMAGEN.includes(archivo.type)) return { tipoImagen: true };
  return archivo.size > MAXIMO_IMAGEN_BYTES ? { imagenGrande: true } : null;
}

// Evita toISOString(): usa UTC y podría cambiar el día que ve el usuario en el calendario.
export function fechaLocalHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
