import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuariosService } from './usuarios';
import { API_URL } from './api.config';
import { usuarioAdministrativoPrueba } from '../testing/usuarios-fixture';
describe('UsuariosService: endpoints administrativos y cookies', () => {
  let api: UsuariosService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsuariosService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('obtiene el padrón real con credenciales', () => {
    let filas: unknown;
    api.listar().subscribe((datos) => (filas = datos));
    const solicitud = http.expectOne(`${API_URL}/usuarios`);
    expect(solicitud.request.method).toBe('GET');
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush([usuarioAdministrativoPrueba()]);
    expect(filas).toEqual([usuarioAdministrativoPrueba()]);
  });
  it('crea con rol seleccionado sin incluir un estado ni hash del cliente', () => {
    const datos = {
      nombre: 'Lucía',
      apellido: 'Torres',
      correo: 'lucia@club.test',
      nombreUsuario: 'lucia.8',
      password: 'ClaveSegura8',
      repetirPassword: 'ClaveSegura8',
      fechaNacimiento: '2004-01-01',
      descripcion: '',
      perfil: 'administrador' as const,
    };
    api.crear(datos).subscribe();
    const solicitud = http.expectOne(`${API_URL}/usuarios`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.withCredentials).toBe(true);
    expect(solicitud.request.body).toEqual(datos);
    expect(solicitud.request.body).not.toHaveProperty('activo');
    expect(solicitud.request.body).not.toHaveProperty('passwordHash');
    solicitud.flush({
      mensaje: 'Usuario creado correctamente',
      usuario: usuarioAdministrativoPrueba(),
    });
  });
  it('baja mediante DELETE y conserva el mensaje del servidor', () => {
    let mensaje = '';
    api.deshabilitar('id').subscribe((datos) => (mensaje = datos.mensaje));
    const solicitud = http.expectOne(`${API_URL}/usuarios/id`);
    expect(solicitud.request.method).toBe('DELETE');
    expect(solicitud.request.withCredentials).toBe(true);
    solicitud.flush({ mensaje: 'Usuario deshabilitado correctamente' });
    expect(mensaje).toContain('deshabilitado correctamente');
  });
  it('rehabilita mediante POST sin permitir cambiar rol', () => {
    api.habilitar('id').subscribe();
    const solicitud = http.expectOne(`${API_URL}/usuarios/id/habilitar`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.withCredentials).toBe(true);
    expect(solicitud.request.body).toEqual({});
    solicitud.flush({ mensaje: 'Usuario habilitado correctamente' });
  });
});
