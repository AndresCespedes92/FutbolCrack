import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Registro } from './registro';

// Ejercitamos eventos de la plantilla para verificar la conexión real entre Forms y ngClass.
describe('Estados visuales del registro', () => {
  let fixture: ComponentFixture<Registro>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Registro);
    await fixture.whenStable();
    pagina = fixture.nativeElement;
  });

  function escribir(id: string, valor: string): HTMLInputElement {
    const campo = pagina.querySelector<HTMLInputElement>(`#${id}`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    return campo;
  }

  it('empieza neutro y muestra un error al salir de un campo obligatorio vacío', () => {
    expect(pagina.querySelector('.input-invalido, .input-valido')).toBeNull();
    pagina.querySelector('#nombre')!.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(pagina.querySelector('#nombre')?.classList.contains('input-invalido')).toBe(true);
    expect(pagina.querySelector('#nombre')?.getAttribute('aria-invalid')).toBe('true');
    expect(pagina.querySelector('#estado-nombre')?.textContent).toContain('obligatorio');
  });

  it('pasa de rojo a verde al corregir y vuelve a rojo si se borra un dato obligatorio', () => {
    const correo = escribir('correo', 'incorrecto');
    expect(correo.classList.contains('input-invalido')).toBe(true);
    escribir('correo', 'mateo@ejemplo.com');
    expect(correo.classList.contains('input-valido')).toBe(true);
    expect(correo.classList.contains('input-invalido')).toBe(false);
    expect(pagina.querySelector('#estado-correo')?.textContent).toContain('Dato válido');
    escribir('correo', '');
    expect(correo.classList.contains('input-invalido')).toBe(true);
    expect(correo.classList.contains('input-valido')).toBe(false);
  });

  it('actualiza la confirmación si se modifica la contraseña original', () => {
    escribir('clave-registro', 'jugador10');
    const repeticion = escribir('repetir-clave', 'jugador10');
    expect(repeticion.classList.contains('input-valido')).toBe(true);
    escribir('clave-registro', 'jugador11');
    expect(repeticion.classList.contains('input-invalido')).toBe(true);
    expect(pagina.querySelector('#estado-repetirClave')?.textContent).toContain('deben coincidir');
  });

  it('deja neutros los opcionales vacíos incluso después de editarlos', () => {
    escribir('descripcion', 'Mediocampista');
    const descripcion = escribir('descripcion', '');
    expect(descripcion.classList.contains('input-valido')).toBe(false);
    expect(descripcion.classList.contains('input-invalido')).toBe(false);
    expect(pagina.querySelector('#estado-descripcion')?.textContent?.trim()).toBe('');
  });

  it('conecta la selección de archivos con el estado visual del control de imagen', () => {
    const archivo = pagina.querySelector<HTMLInputElement>('#imagen-perfil')!;
    const falso = new File(['texto'], 'documento.txt', { type: 'text/plain' });
    Object.defineProperty(archivo, 'files', { configurable: true, value: { item: () => falso } });
    archivo.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(archivo.classList.contains('input-invalido')).toBe(true);
    expect(pagina.querySelector('#estado-imagenPerfil')?.textContent).toContain('JPG, PNG o WebP');
  });

  it('mantiene el envío deshabilitado y evita submit aunque todo el formulario sea válido', () => {
    fixture.componentInstance.registroForm.patchValue({
      nombre: 'Mateo',
      apellido: 'Ríos',
      correo: 'mateo@ejemplo.com',
      usuario: 'mateo.10',
      clave: 'jugador10',
      repetirClave: 'jugador10',
      fechaNacimiento: '2004-05-10',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.registroForm.valid).toBe(true);
    expect(pagina.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    const evento = new Event('submit', { bubbles: true, cancelable: true });
    pagina.querySelector('form')!.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(true);
  });
});
