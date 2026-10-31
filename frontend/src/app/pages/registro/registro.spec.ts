import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Registro } from './registro';

// Ejercitamos eventos de la plantilla para verificar la conexión real entre Forms y ngClass.
describe('Estados visuales del registro', () => {
  let fixture: ComponentFixture<Registro>;
  let pagina: HTMLElement;
  let http: HttpTestingController;
  const registroUrl = 'https://futbol-crackbackend.vercel.app/auth/registro';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Registro);
    await fixture.whenStable();
    pagina = fixture.nativeElement;
  });

  // Verificamos que cada prueba resuelva su HTTP y nunca dependa del backend publicado.
  afterEach(() => http.verify());

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

  // La regla actual pide mayúscula y número: jugador10 ya no es una contraseña válida.
  function completarRegistroValido(): void {
    fixture.componentInstance.registroForm.patchValue({
      nombre: 'Mateo',
      apellido: 'Ríos',
      correo: 'mateo@ejemplo.com',
      usuario: 'mateo.10',
      clave: 'Jugador10',
      repetirClave: 'Jugador10',
      fechaNacimiento: '2004-05-10',
      descripcion: 'Mediocampista',
    });
    fixture.detectChanges();
  }

  it('habilita el registro válido, envía FormData una sola vez y muestra el éxito del servidor', () => {
    completarRegistroValido();
    const imagen = new File(['imagen de prueba'], 'avatar.png', { type: 'image/png' });
    fixture.componentInstance.campos.imagenPerfil.setValue(imagen);
    fixture.detectChanges();
    const boton = pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(fixture.componentInstance.registroForm.valid).toBe(true);
    expect(boton.disabled).toBe(false);
    expect(pagina.querySelector('.form-summary')?.textContent).toContain(
      'Ya podés crear tu cuenta',
    );

    // Antes se esperaba envío siempre deshabilitado; ahora el submit llama a registrar().
    pagina
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    const solicitud = http.expectOne(registroUrl);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toBeInstanceOf(FormData);
    const cuerpo = solicitud.request.body as FormData;
    expect(cuerpo.get('nombre')).toBe('Mateo');
    expect(cuerpo.get('apellido')).toBe('Ríos');
    expect(cuerpo.get('correo')).toBe('mateo@ejemplo.com');
    expect(cuerpo.get('nombreUsuario')).toBe('mateo.10');
    expect(cuerpo.get('password')).toBe('Jugador10');
    expect(cuerpo.get('repetirPassword')).toBe('Jugador10');
    expect(cuerpo.get('fechaNacimiento')).toBe('2004-05-10');
    expect(cuerpo.get('descripcion')).toBe('Mediocampista');
    expect((cuerpo.get('imagen') as File).name).toBe('avatar.png');
    expect((cuerpo.get('imagen') as File).type).toBe('image/png');
    expect(fixture.componentInstance.enviando).toBe(true);
    expect(boton.disabled).toBe(true);
    expect(pagina.querySelector('.form-summary')?.textContent).toContain('Creando tu cuenta');

    pagina
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectNone(registroUrl);
    solicitud.flush({
      mensaje: 'Usuario registrado correctamente',
      usuario: { id: '000000000000000000000001' },
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.enviando).toBe(false);
    expect(boton.disabled).toBe(false);
    expect(pagina.querySelector('.form-summary')?.textContent).toContain(
      'Usuario registrado correctamente',
    );
    expect(fixture.componentInstance.mensajeError).toBe('');
  });

  it('no envía un registro inválido y muestra los errores de los campos obligatorios', () => {
    pagina
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    http.expectNone(registroUrl);
    expect(fixture.componentInstance.campos.nombre.touched).toBe(true);
    expect(pagina.querySelector('#estado-nombre')?.textContent).toContain('obligatorio');
    expect(pagina.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it('muestra el error de duplicado y permite reintentar al recibir un 409', () => {
    completarRegistroValido();
    pagina
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    const solicitud = http.expectOne(registroUrl);
    expect(solicitud.request.method).toBe('POST');
    expect((solicitud.request.body as FormData).get('imagen')).toBeNull();
    solicitud.flush({ message: 'Duplicado de prueba' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.componentInstance.enviando).toBe(false);
    expect(fixture.componentInstance.mensajeExito).toBe('');
    expect(pagina.querySelector('.form-summary')?.textContent).toContain(
      'El correo o nombre de usuario ya está registrado.',
    );
    expect(pagina.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
  });
});
