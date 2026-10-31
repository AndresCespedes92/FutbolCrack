import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { Usuario } from './services/auth';
import { Publicacion } from './services/publicaciones';

// Antes se esperaban cuatro demos y una cuenta imposible de crear. Ahora comprobamos la UI real.
// HttpClient usa el backend de pruebas: ninguna solicitud llega a Vercel, MongoDB o Cloudinary.
const API = 'https://futbol-crackbackend.vercel.app';
const usuario: Usuario = {
  id: '000000000000000000000001',
  nombre: 'Camila',
  apellido: 'Gómez',
  correo: 'camila@ejemplo.com',
  nombreUsuario: 'camila.8',
  fechaNacimiento: '2004-05-10T00:00:00.000Z',
  descripcion: 'Mediocampista de prueba',
  imagenPerfil: '',
  perfil: 'usuario',
};
const publicaciones: Publicacion[] = [
  {
    _id: '000000000000000000000011',
    autorId: {
      _id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreUsuario: usuario.nombreUsuario,
      imagenPerfil: '',
    },
    contenido: 'Hoy entrenamos pases cortos.',
    multimediaUrl: '',
    tipoMultimedia: 'ninguno',
    createdAt: '2026-10-30T12:00:00.000Z',
    updatedAt: '2026-10-30T12:00:00.000Z',
  },
  {
    _id: '000000000000000000000012',
    autorId: {
      _id: '000000000000000000000002',
      nombre: 'Lucía',
      apellido: 'Torres',
      nombreUsuario: 'luci.torres',
      imagenPerfil: '',
    },
    contenido: 'Control y definición en el entrenamiento.',
    multimediaUrl: 'images/cancha-demo.svg',
    tipoMultimedia: 'imagen',
    createdAt: '2026-10-29T12:00:00.000Z',
    updatedAt: '2026-10-29T12:00:00.000Z',
  },
  {
    _id: '000000000000000000000013',
    autorId: null,
    contenido: 'Publicación cuyo autor no está disponible.',
    multimediaUrl: '',
    tipoMultimedia: 'ninguno',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
  },
];

describe('Navegación de FutbolCrack', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  // También detecta peticiones inesperadas: la prueba no puede dejar HTTP pendiente sin verificar.
  afterEach(() => http.verify());

  function responderFeed(harness: RouterTestingHarness): void {
    const solicitud = http.expectOne(`${API}/publicaciones`);
    expect(solicitud.request.method).toBe('GET');
    solicitud.flush(publicaciones);
    harness.detectChanges();
  }

  async function abrirPerfil(harness: RouterTestingHarness): Promise<void> {
    const navegacion = harness.navigateByUrl('/mi-perfil');
    // La navegación espera al guard real. Respondemos su HTTP antes de esperar el resultado.
    await vi.waitFor(() => {
      const autorizacion = http.expectOne(`${API}/auth/me`);
      expect(autorizacion.request.method).toBe('GET');
      expect(autorizacion.request.withCredentials).toBe(true);
      autorizacion.flush(usuario);
    });
    await navegacion;
    // MiPerfil vuelve a consultar sus datos en ngOnInit; es otra petición real del código actual.
    const perfil = http.expectOne(`${API}/auth/me`);
    expect(perfil.request.method).toBe('GET');
    expect(perfil.request.withCredentials).toBe(true);
    perfil.flush(usuario);
    harness.detectChanges();
  }

  it('muestra los cuatro enlaces de navegación', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = fixture.nativeElement.querySelectorAll('nav a') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(4);
    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
      '/publicaciones',
      '/mi-perfil',
      '/login',
      '/registro',
    ]);
  });

  it('permite abrir las pantallas públicas y Mi Perfil con una sesión autorizada', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of ['/login', '/registro', '/publicaciones']) {
      await harness.navigateByUrl(url);
      if (url === '/publicaciones') responderFeed(harness);
      expect(TestBed.inject(Router).url).toBe(url);
      expect(harness.routeNativeElement?.querySelector('h1')).toBeTruthy();
    }
    await abrirPerfil(harness);
    expect(TestBed.inject(Router).url).toBe('/mi-perfil');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Mi perfil');
    expect(harness.routeNativeElement?.querySelector('#nombre-jugador')?.textContent).toContain(
      'Camila',
    );
  });

  it('redirige el inicio y las rutas desconocidas a publicaciones', async () => {
    const harness = await RouterTestingHarness.create();
    for (const url of ['/', '/pagina-inexistente']) {
      await harness.navigateByUrl(url);
      // La segunda URL redirige a la misma pantalla: Router no la crea ni consulta de nuevo.
      if (url === '/') responderFeed(harness);
      expect(TestBed.inject(Router).url).toBe('/publicaciones');
      expect(harness.routeNativeElement?.textContent).toContain('Tu talento');
      expect(harness.routeNativeElement?.querySelectorAll('.feed-post').length).toBe(3);
    }
  });

  it('presenta los nueve campos y deshabilita el envío mientras el registro está incompleto', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/registro');
    const page = harness.routeNativeElement!;
    expect(page.querySelectorAll('input, textarea').length).toBe(9);
    expect(page.querySelector<HTMLInputElement>('input[type="file"]')?.accept).toBe(
      'image/jpeg,image/png,image/webp',
    );
    expect(page.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(page.querySelector('.form-summary')?.textContent).toContain(
      'Completá los campos obligatorios',
    );
    expect(page.querySelector('.input-invalido, .input-valido')).toBeNull();
  });

  it('muestra el feed de la API y distingue los datos del perfil de su material de demostración', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/publicaciones');
    expect(harness.routeNativeElement?.textContent).toContain('Cargando publicaciones');
    responderFeed(harness);
    const feed = harness.routeNativeElement!;
    const articulos = feed.querySelectorAll('.feed-post');
    expect(articulos.length).toBe(publicaciones.length);
    expect(
      Array.from(articulos, (articulo) =>
        articulo.querySelector('.post-body p')?.textContent?.trim(),
      ),
    ).toEqual(publicaciones.map((publicacion) => publicacion.contenido));
    expect(articulos[0].textContent).toContain('Camila');
    expect(articulos[1].textContent).toContain('Lucía');
    expect(articulos[2].textContent).toContain('Usuario no disponible');
    expect(feed.querySelectorAll('.post-image').length).toBe(1);
    expect(feed.querySelector('.post-image')?.getAttribute('src')).toBe('images/cancha-demo.svg');
    expect(feed.querySelectorAll('.video-demo, .trial-details').length).toBe(0);
    expect(feed.textContent).not.toContain('Cargando publicaciones');

    await abrirPerfil(harness);
    const perfil = harness.routeNativeElement!;
    expect(perfil.querySelector('#nombre-jugador')?.textContent).toContain('Camila');
    expect(perfil.querySelector('.player-facts')?.textContent).toContain('camila@ejemplo.com');
    expect(perfil.querySelector('.material-note')?.textContent).toContain(
      'Todavía no están asociadas a tu cuenta',
    );
    const cards = perfil.querySelectorAll('app-publicacion-card');
    expect(cards.length).toBe(2);
    expect(perfil.querySelectorAll('.video-demo').length).toBe(1);
    expect(perfil.querySelector('.trial-details')).toBeNull();
    for (const card of cards) {
      expect(card.textContent).toContain('Mateo Ríos');
      expect(card.textContent).not.toContain('Lucía Torres');
      expect(card.textContent).toContain('DEMO');
    }
  });

  it('redirige al login si el guard recibe un 401 al intentar abrir Mi Perfil', async () => {
    const harness = await RouterTestingHarness.create();
    const navegacion = harness.navigateByUrl('/mi-perfil');
    await vi.waitFor(() => {
      const solicitud = http.expectOne(`${API}/auth/me`);
      expect(solicitud.request.withCredentials).toBe(true);
      solicitud.flush({ message: 'Sesión vencida' }, { status: 401, statusText: 'Unauthorized' });
    });
    await navegacion;
    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.querySelector('#titulo-formulario')?.textContent).toContain(
      'Volvé al juego',
    );
    expect(harness.routeNativeElement?.querySelector('.player-card')).toBeNull();
  });
});
