import { crearFormularioRegistro } from './registro-form';
import { MAXIMO_IMAGEN_BYTES } from '../validators/registro.validators';

// Probamos reglas y casos límite; estas pruebas no crean cuentas ni requieren un servidor.
describe('Reglas del registro', () => {
  it('acepta nombres acentuados y compuestos, pero rechaza números y espacios solos', () => {
    const nombre = crearFormularioRegistro().controls.nombre;
    for (const valor of ['María José', 'O’Connor', 'Jean-Luc', '李明']) {
      nombre.setValue(valor);
      expect(nombre.valid).toBe(true);
    }
    for (const valor of ['Juan123', '  ', 'A', 'a'.repeat(51)]) {
      nombre.setValue(valor);
      expect(nombre.invalid).toBe(true);
    }
  });

  it('verifica correo y formato de usuario sin comprobar su existencia', () => {
    const campos = crearFormularioRegistro().controls;
    campos.correo.setValue('incorrecto');
    expect(campos.correo.hasError('email')).toBe(true);
    campos.correo.setValue('mateo@ejemplo.com');
    expect(campos.correo.valid).toBe(true);
    for (const usuario of ['ab', 'con espacio', 'ácento', '.inicio', 'a'.repeat(21)]) {
      campos.usuario.setValue(usuario);
      expect(campos.usuario.invalid).toBe(true);
    }
    campos.usuario.setValue('mateo.10_crack');
    expect(campos.usuario.valid).toBe(true);
  });

  it('limita las contraseñas y recalcula la coincidencia al cambiar cualquiera de las dos', () => {
    const form = crearFormularioRegistro();
    for (const clave of ['corta', ' '.repeat(8), 'a'.repeat(65)]) {
      form.controls.clave.setValue(clave);
      expect(form.controls.clave.invalid).toBe(true);
    }
    form.patchValue({ clave: 'jugador10', repetirClave: 'jugador11' });
    expect(form.hasError('clavesNoCoinciden')).toBe(true);
    form.controls.repetirClave.setValue('jugador10');
    expect(form.hasError('clavesNoCoinciden')).toBe(false);
    form.controls.clave.setValue('jugador12');
    expect(form.hasError('clavesNoCoinciden')).toBe(true);
  });

  it('rechaza fechas inexistentes y futuras, y acepta el día de hoy y un año bisiesto', () => {
    const fecha = crearFormularioRegistro().controls.fechaNacimiento;
    fecha.setValue('2025-02-29');
    expect(fecha.hasError('fechaInvalida')).toBe(true);
    fecha.setValue('2024-02-29');
    expect(fecha.valid).toBe(true);
    const hoy = new Date();
    const local = (dia: Date) =>
      `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
    fecha.setValue(local(hoy));
    expect(fecha.valid).toBe(true);
    hoy.setDate(hoy.getDate() + 1);
    fecha.setValue(local(hoy));
    expect(fecha.hasError('fechaFutura')).toBe(true);
  });

  it('permite descripción vacía y detecta más de 300 caracteres', () => {
    const descripcion = crearFormularioRegistro().controls.descripcion;
    expect(descripcion.valid).toBe(true);
    descripcion.setValue('a'.repeat(301));
    expect(descripcion.hasError('maxlength')).toBe(true);
  });

  it('verifica imágenes opcionales por tipo y tamaño, incluso si se omite el filtro del selector', () => {
    const imagen = crearFormularioRegistro().controls.imagenPerfil;
    expect(imagen.valid).toBe(true);
    imagen.setValue(new File(['texto'], 'archivo.jpg', { type: 'text/plain' }));
    expect(imagen.hasError('tipoImagen')).toBe(true);
    imagen.setValue(
      new File([new Uint8Array(MAXIMO_IMAGEN_BYTES + 1)], 'foto.png', { type: 'image/png' }),
    );
    expect(imagen.hasError('imagenGrande')).toBe(true);
    for (const tipo of ['image/jpeg', 'image/png', 'image/webp']) {
      imagen.setValue(new File([new Uint8Array(MAXIMO_IMAGEN_BYTES)], 'foto', { type: tipo }));
      expect(imagen.valid).toBe(true);
    }
    imagen.setValue(null);
    expect(imagen.valid).toBe(true);
  });
});
