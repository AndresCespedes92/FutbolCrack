import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EditarPerfil } from './editar-perfil';
import { AuthService, Usuario } from '../../services/auth';
import { API_URL } from '../../services/api.config';

// Independiente de los fixtures faltantes de la suite antigua. HTTP sustituido; formulario/servicio reales.
describe('EditarPerfil: ficha propia y sesión', () => {
  const usuario: Usuario = { id: '000000000000000000000001', nombre: 'Camila', apellido: 'Torres',
    correo: 'camila@club.test', nombreUsuario: 'camila.10', fechaNacimiento: '2001-02-03T00:00:00.000Z',
    descripcion: 'Mediocampista', imagenPerfil: 'https://imagenes.test/actual.png', perfil: 'usuario', activo: true };
  let http: HttpTestingController, auth: AuthService;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EditarPerfil], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
    ] }).compileComponents();
    http = TestBed.inject(HttpTestingController); auth = TestBed.inject(AuthService);
    auth.login({ identificador: 'camila.10', password: 'clave-ficticia' }).subscribe();
    http.expectOne(`${API_URL}/auth/login`).flush({ usuario, emitidaEn: new Date().toISOString(),
      expiraEn: new Date(Date.now() + 600000).toISOString(), horaServidor: new Date().toISOString() });
  });
  afterEach(() => http.verify());
  function editor() {
    const fixture = TestBed.createComponent(EditarPerfil);
    fixture.componentRef.setInput('usuario', usuario); fixture.detectChanges(); return fixture;
  }
  it('precarga la ficha y cancelar no envía PATCH ni cambia la sesión', () => {
    const f = editor(), cancelar = vi.spyOn(f.componentInstance.cancelar, 'emit');
    expect(f.componentInstance.formulario.getRawValue()).toMatchObject({ nombre: usuario.nombre, usuario: usuario.nombreUsuario, fechaNacimiento: '2001-02-03' });
    f.componentInstance.campos.nombre.setValue('Lucía');
    f.nativeElement.querySelector('button[type="button"]').click();
    expect(cancelar).toHaveBeenCalledTimes(1); expect(auth.usuarioActual()?.nombre).toBe('Camila');
    http.expectNone((r) => r.method === 'PATCH');
  });
  it('muestra errores rojos para datos incorrectos y verde al corregir, sin enviar inválidos', () => {
    const f = editor(), c = f.componentInstance;
    c.campos.correo.setValue('mal'); c.guardar(); f.detectChanges();
    expect(f.nativeElement.querySelector('#perfil-correo').classList.contains('campo-error')).toBe(true);
    expect(f.nativeElement.querySelector('#error-perfil-correo').textContent).toContain('correo válido');
    c.campos.correo.setValue('nuevo@club.test'); f.detectChanges();
    expect(f.nativeElement.querySelector('#perfil-correo').classList.contains('campo-valido')).toBe(true);
    http.expectNone((r) => r.method === 'PATCH');
  });
  it('envía solo campos editables, actualiza la ficha y conserva el vencimiento', () => {
    const f = editor(), c = f.componentInstance, guardado = vi.spyOn(c.guardado, 'emit');
    const vence = auth.expiraEn(); c.campos.nombre.setValue('Lucía'); c.guardar();
    const req = http.expectOne(`${API_URL}/auth/me`);
    expect(req.request.method).toBe('PATCH'); expect(req.request.withCredentials).toBe(true);
    const datos = req.request.body as FormData;
    expect(datos.get('nombre')).toBe('Lucía');
    expect([...datos.keys()].sort()).toEqual(['apellido', 'correo', 'descripcion', 'fechaNacimiento', 'nombre', 'nombreUsuario']);
    req.flush({ mensaje: 'Perfil actualizado correctamente', usuario: { ...usuario, nombre: 'Lucía' } });
    expect(auth.usuarioActual()?.nombre).toBe('Lucía'); expect(auth.expiraEn()).toBe(vence);
    expect(guardado).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Lucía' }));
    http.expectNone((r) => r.url.endsWith('/refrescar'));
  });
  it('conserva el borrador y muestra conflicto sin modificar el usuario confirmado', () => {
    const f = editor(), c = f.componentInstance; c.campos.correo.setValue('ocupado@club.test'); c.guardar();
    http.expectOne(`${API_URL}/auth/me`).flush({ message: 'El correo ya está registrado' }, { status: 409, statusText: 'Conflict' });
    f.detectChanges();
    expect(c.campos.correo.value).toBe('ocupado@club.test'); expect(c.guardando).toBe(false);
    expect(f.nativeElement.querySelector('[role="alert"]').textContent).toContain('El correo ya está registrado');
    expect(auth.usuarioActual()?.correo).toBe(usuario.correo);
  });
  it('valida foto y solo adjunta la selección aceptada', () => {
    const f = editor(), c = f.componentInstance;
    c.campos.imagenPerfil.setValue(new File(['texto'], 'foto.txt', { type: 'text/plain' })); c.guardar();
    http.expectNone((r) => r.method === 'PATCH'); expect(c.errorCampo('imagenPerfil')).toContain('JPEG');
    const foto = new File(['contenido de prueba'], 'foto.png', { type: 'image/png' });
    c.campos.imagenPerfil.setValue(foto); c.guardar();
    const req = http.expectOne(`${API_URL}/auth/me`); expect(req.request.body.get('imagen')).toBe(foto);
    req.flush({ usuario: { ...usuario, imagenPerfil: 'https://imagenes.test/nueva.png' }, mensaje: 'Perfil actualizado correctamente' });
    expect(auth.usuarioActual()?.imagenPerfil).toBe('https://imagenes.test/nueva.png');
  });
  it('un éxito tardío de edición no reactiva una sesión cerrada', () => {
    const f = editor(); f.componentInstance.guardar(); const pendiente = http.expectOne(`${API_URL}/auth/me`);
    auth.cerrarSesion().subscribe(); http.expectOne(`${API_URL}/auth/logout`).flush({ mensaje: 'Sesión cerrada' });
    pendiente.flush({ usuario: { ...usuario, nombre: 'Lucía' }, mensaje: 'Perfil actualizado correctamente' });
    expect(auth.usuarioActual()).toBeNull(); expect(auth.expiraEn()).toBeNull();
    expect(f.componentInstance.error).toContain('sesión venció');
  });
});
