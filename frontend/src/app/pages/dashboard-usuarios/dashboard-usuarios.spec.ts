import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardUsuarios } from './dashboard-usuarios';
import { AuthService } from '../../services/auth';
import { API_URL } from '../../services/api.config';
import { sesionPrueba } from '../../testing/sesion-fixture';
import { administradorPrueba, usuarioAdministrativoPrueba } from '../../testing/usuarios-fixture';
import { instalarDialogDePrueba } from '../../testing/dialog-prueba';
describe('DashboardUsuarios: padrón/formulario/confirmación', () => {
  let fixture: ComponentFixture<DashboardUsuarios>,
    http: HttpTestingController,
    restaurar: () => void;
  const url = `${API_URL}/usuarios`,
    normal = usuarioAdministrativoPrueba(),
    inactivo = usuarioAdministrativoPrueba(3, false),
    admin = usuarioAdministrativoPrueba(1);
  function listar() {
    return http.expectOne((req) => req.url === url && req.method === 'GET');
  }
  function boton(texto: string): HTMLButtonElement {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.trim() === texto)!;
  }
  function completar() {
    fixture.componentInstance.formulario.patchValue({
      nombre: 'Lucía',
      apellido: 'Torres',
      correo: 'lucia@club.test',
      usuario: 'lucia.8',
      clave: 'ClaveSegura8',
      repetirClave: 'ClaveSegura8',
      fechaNacimiento: '2004-01-01',
      descripcion: 'Mediocampista',
    });
    fixture.detectChanges();
  }
  function enviar() {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }
  beforeEach(async () => {
    restaurar = instalarDialogDePrueba();
    await TestBed.configureTestingModule({
      imports: [DashboardUsuarios],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).autorizar().subscribe();
    http.expectOne(`${API_URL}/auth/autorizar`).flush(sesionPrueba(administradorPrueba));
    fixture = TestBed.createComponent(DashboardUsuarios);
    fixture.detectChanges();
    listar().flush([admin, normal, inactivo]);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    restaurar();
    http.verify();
  });
  it('muestra datos reales, rol, estado y protección de la cuenta propia', () => {
    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(3);
    expect(filas[0].textContent).toContain('Administrador');
    expect(filas[0].textContent).toContain('Cuenta protegida');
    expect(filas[0].querySelector('.deshabilitar')).toBeNull();
    expect(filas[1].textContent).toContain(normal.correo);
    expect(filas[1].textContent).toContain('Activo');
    expect(filas[2].textContent).toContain('Deshabilitado');
    expect(fixture.nativeElement.querySelectorAll('input[type="radio"]').length).toBe(2);
  });
  it('permite solicitar la baja de otro administrador y cancelarla sin HTTP', () => {
    const otro = { ...usuarioAdministrativoPrueba(4), perfil: 'administrador' as const };
    // La respuesta HTTP dispara markForCheck, igual que el padrón real con Angular zoneless.
    fixture.componentInstance.cargarUsuarios();
    listar().flush([admin, normal, inactivo, otro]);
    fixture.detectChanges();
    const fila = Array.from(
      fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLElement>,
    ).find((elemento) => elemento.textContent?.includes(otro.correo))!;
    expect(fila.textContent).toContain('Administrador');
    fila.querySelector<HTMLButtonElement>('.deshabilitar')!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').textContent).toContain(otro.nombreUsuario);
    boton('Cancelar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    http.expectNone((req) => req.method === 'DELETE');
  });
  it.each(['usuario', 'administrador'] as const)(
    'crea rol %s desde los radios, evita doble POST y limpia solo después de éxito',
    (perfil) => {
      completar();
      fixture.nativeElement.querySelector(`input[type="radio"][value="${perfil}"]`).click();
      enviar();
      const solicitud = http.expectOne((req) => req.url === url && req.method === 'POST');
      expect(solicitud.request.body).toMatchObject({
        nombreUsuario: 'lucia.8',
        perfil,
        password: 'ClaveSegura8',
        repetirPassword: 'ClaveSegura8',
      });
      expect(solicitud.request.withCredentials).toBe(true);
      expect(solicitud.request.body).not.toHaveProperty('activo');
      enviar();
      http.expectNone((req) => req.method === 'POST');
      solicitud.flush({ mensaje: 'Usuario creado correctamente', usuario: normal });
      listar().flush([admin, normal, inactivo]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Usuario creado correctamente');
      expect(fixture.componentInstance.campos.usuario.value).toBe('');
      expect(fixture.componentInstance.perfil.value).toBe('usuario');
    },
  );
  it('un formulario inválido no crea usuarios y muestra validaciones/coincidencia', () => {
    enviar();
    http.expectNone((req) => req.method === 'POST');
    expect(fixture.nativeElement.textContent).toContain('Revisá este campo');
    completar();
    fixture.componentInstance.campos.repetirClave.setValue('OtraClave8');
    enviar();
    http.expectNone((req) => req.method === 'POST');
    expect(fixture.nativeElement.textContent).toContain('Las contraseñas no coinciden');
  });
  it.each([400, 409, 500])('ante alta %s conserva datos/rol y permite corregir', (status) => {
    completar();
    fixture.nativeElement.querySelector('input[value="administrador"]').click();
    enviar();
    http
      .expectOne((req) => req.url === url && req.method === 'POST')
      .flush(
        { message: status === 409 ? 'El correo ya está registrado' : 'Error' },
        { status, statusText: 'Error' },
      );
    fixture.detectChanges();
    expect(fixture.componentInstance.campos.usuario.value).toBe('lucia.8');
    expect(fixture.componentInstance.perfil.value).toBe('administrador');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.componentInstance.creando).toBe(false);
    expect(fixture.nativeElement.querySelector('.exito')).toBeNull();
  });
  it('abre modal identificando usuario; cancelar no solicita DELETE', () => {
    boton('Deshabilitar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    expect(fixture.nativeElement.querySelector('dialog').textContent).toContain(
      '@' + normal.nombreUsuario,
    );
    http.expectNone((req) => req.method === 'DELETE');
    boton('Cancelar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    http.expectNone((req) => req.method === 'DELETE');
  });
  it('confirma una sola baja, bloquea cancelación/confirmación y muestra éxito tras respuesta', () => {
    boton('Deshabilitar').click();
    fixture.detectChanges();
    boton('Confirmar').click();
    fixture.detectChanges();
    const solicitud = http.expectOne(`${url}/${normal._id}`);
    expect(solicitud.request.method).toBe('DELETE');
    expect(boton('Cancelar').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.exito')).toBeNull();
    fixture.componentInstance.confirmarBaja();
    http.expectNone((req) => req.method === 'DELETE');
    solicitud.flush({ mensaje: 'Usuario deshabilitado correctamente' });
    listar().flush([admin, { ...normal, activo: false }, inactivo]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Usuario deshabilitado correctamente');
    expect(fixture.nativeElement.querySelectorAll('.habilitar').length).toBe(2);
  });
  it('una baja rechazada mantiene modal/estado y permite cancelar sin cerrar sesión por 403', () => {
    boton('Deshabilitar').click();
    fixture.detectChanges();
    boton('Confirmar').click();
    http.expectOne(`${url}/${normal._id}`).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog [role="alert"]').textContent).toContain(
      'No tenés permiso',
    );
    expect(boton('Cancelar').disabled).toBe(false);
    expect(TestBed.inject(AuthService).usuarioActual()).not.toBeNull();
    expect(fixture.componentInstance.usuarios[1].activo).toBe(true);
    boton('Cancelar').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });
  it('rehabilita sin duplicar solicitudes y recarga el estado real', () => {
    boton('Habilitar').click();
    fixture.detectChanges();
    const solicitud = http.expectOne(`${url}/${inactivo._id}/habilitar`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({});
    fixture.componentInstance.habilitar(inactivo);
    http.expectNone((req) => req.method === 'POST');
    solicitud.flush({ mensaje: 'Usuario habilitado correctamente' });
    listar().flush([admin, normal, { ...inactivo, activo: true }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Usuario habilitado correctamente');
    expect(fixture.nativeElement.querySelector('.habilitar')).toBeNull();
  });
  it('rehabilitación fallida conserva el estado y muestra error comprensible', () => {
    boton('Habilitar').click();
    http
      .expectOne(`${url}/${inactivo._id}/habilitar`)
      .flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.componentInstance.usuarios[2].activo).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No pudimos completar',
    );
  });
  it('muestra carga/error/reintento/vacío sin borrar el formulario', () => {
    completar();
    fixture.componentInstance.cargarUsuarios();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando usuarios');
    listar().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.componentInstance.campos.usuario.value).toBe('lucia.8');
    boton('Reintentar listado').click();
    listar().flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay usuarios para mostrar');
  });
  it('un 403 del listado no muestra padrón ni formulario y no cierra la sesión', () => {
    fixture.componentInstance.cargarUsuarios();
    listar().flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No tenés permiso');
    expect(TestBed.inject(AuthService).usuarioActual()).not.toBeNull();
  });
});
