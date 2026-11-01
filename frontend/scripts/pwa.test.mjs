// Tests Node de configuración/artefactos, separados del DOM Angular. Ejecutar después de npm run build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Generator } from '@angular/service-worker/config';
const raiz = fileURLToPath(new URL('../', import.meta.url));
const leer = (ruta) => readFile(path.join(raiz, ruta));
const json = async (ruta) => JSON.parse(await leer(ruta));
const config = await json('ngsw-config.json');
const manifest = await json('public/manifest.webmanifest');
const generado = await json('dist/frontend/browser/ngsw.json');
const endpoints = ['/auth', '/usuarios', '/publicaciones', '/comentarios', '/estadisticas'];
const esNavegacion = (url, control = generado) =>
  control.navigationUrls.some((p) => p.positive && new RegExp(p.regex).test(url)) &&
  !control.navigationUrls.some((p) => !p.positive && new RegExp(p.regex).test(url));

test('manifest de FutbolCrack con identidad, alcance, inicio y modo instalado', () => {
  assert.equal(manifest.name, 'FutbolCrack');
  assert.equal(manifest.short_name, 'FutbolCrack');
  assert.ok(manifest.description.length > 30);
  assert.equal(manifest.lang, 'es-AR');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#596b42');
  assert.equal(manifest.background_color, '#101310');
});
test('iconos PNG propios 192/512 y variante maskable tienen dimensiones reales', async () => {
  assert.ok(manifest.icons.some((icono) => icono.sizes === '192x192'));
  assert.ok(
    manifest.icons.some((icono) => icono.sizes === '512x512' && icono.purpose === 'maskable'),
  );
  for (const icono of manifest.icons) {
    const png = await leer('public/' + icono.src),
      [ancho, alto] = icono.sizes.split('x').map(Number);
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), ancho);
    assert.equal(png.readUInt32BE(20), alto);
  }
});
test('index enlaza manifest/icono y declara theme-color', async () => {
  const html = (await leer('src/index.html')).toString();
  assert.match(html, /rel="manifest" href="manifest.webmanifest"/);
  assert.match(html, /name="theme-color" content="#596b42"/);
  assert.match(html, /icons\/icon-192.png/);
});
test('worker oficial coincide con Angular y se habilita únicamente en producción', async () => {
  const paquete = await json('node_modules/@angular/service-worker/package.json'),
    core = await json('node_modules/@angular/core/package.json');
  assert.equal(paquete.version, core.version);
  const angular = await json('angular.json');
  assert.equal(
    angular.projects.frontend.architect.build.configurations.production.serviceWorker,
    'ngsw-config.json',
  );
  assert.equal(
    angular.projects.frontend.architect.build.configurations.development.serviceWorker,
    undefined,
  );
  const app = (await leer('src/app/app.config.ts')).toString();
  assert.match(app, /provideServiceWorker\('ngsw-worker.js'/);
  assert.match(app, /enabled: !isDevMode\(\)/);
  assert.match(app, /updateViaCache: 'none'/);
});
test('build genera worker/control y precarga shell, estilos, chunks e iconos', async () => {
  const archivos = await readdir(path.join(raiz, 'dist/frontend/browser'));
  assert.ok(archivos.includes('ngsw-worker.js'));
  assert.ok(archivos.includes('safety-worker.js'));
  const urls = generado.assetGroups.flatMap((grupo) => grupo.urls);
  for (const ruta of [
    '/index.html',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
  ])
    assert.ok(urls.includes(ruta));
  for (const archivo of archivos.filter(
    (nombre) =>
      nombre.endsWith('.js') &&
      !['ngsw-worker.js', 'safety-worker.js', 'worker-basic.min.js'].includes(nombre),
  ))
    assert.ok(urls.includes('/' + archivo));
  assert.ok(urls.some((ruta) => ruta.endsWith('.css')));
  assert.ok(generado.assetGroups.every((g) => g.installMode === 'prefetch'));
});
test('control generado contiene solo archivos estáticos y hashes de sus contenidos', async () => {
  for (const [ruta, hash] of Object.entries(generado.hashTable)) {
    assert.match(
      ruta,
      /^\/(?:index\.html|manifest\.webmanifest|favicon\.svg|[^/]+\.(?:js|css)|icons\/[^/]+)$/,
    );
    const bytes = await leer('dist/frontend/browser' + ruta);
    assert.equal(createHash('sha1').update(bytes).digest('hex'), hash);
  }
});
test('no existen grupos de datos ni patrones de caché de URLs externas/dinámicas', () => {
  assert.deepEqual(config.dataGroups, []);
  assert.deepEqual(generado.dataGroups, []);
  for (const grupo of config.assetGroups) assert.equal(grupo.resources.urls, undefined);
  for (const grupo of generado.assetGroups) assert.deepEqual(grupo.patterns, []);
});
test('API: ningún endpoint, subruta o query coincide con caché ni fallback de navegación', () => {
  const urls = new Set(generado.assetGroups.flatMap((g) => g.urls));
  for (const ruta of endpoints)
    for (const sufijo of ['', '/', '/123', '/123/comentarios', '?offset=0&limit=10']) {
      const url = ruta + sufijo;
      assert.ok(!urls.has(url));
      assert.ok(!esNavegacion(url.split('?')[0]));
      assert.ok(!urls.has('https://futbol-crackbackend.vercel.app' + url));
    }
});
test('navegación offline permite solo raíz/login/registro y no dashboards privados', () => {
  for (const ruta of ['/', '/login', '/registro'])
    assert.ok(esNavegacion(ruta), 'Debe abrir shell en ' + ruta);
  for (const ruta of [
    '/dashboard/usuarios',
    '/dashboard/estadisticas',
    '/mi-perfil',
    '/login/extra',
  ])
    assert.ok(!esNavegacion(ruta));
});
test('generador OFICIAL rechaza inclusiones accidentales de archivos con rutas de API', async () => {
  // Se incluyen archivos señuelo privados en el filesystem: una regla /** los cachearía y fallaría.
  const archivos = [
    '/index.html',
    '/main-test.js',
    '/styles-test.css',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    ...endpoints.map((p) => p + '/respuesta.json'),
  ];
  const fs = {
    list: async () => archivos,
    read: async () => '',
    hash: async () => 'hash-prueba',
    write: async () => {},
  };
  const resultado = await new Generator(fs, '/').process(config);
  const urls = resultado.assetGroups.flatMap((grupo) => grupo.urls);
  assert.ok(urls.includes('/main-test.js'));
  for (const endpoint of endpoints)
    assert.ok(!urls.some((ruta) => ruta.startsWith(endpoint + '/')));
});
test('no se agregan sincronización/background-sync ni almacenamiento de respuestas de sesión', async () => {
  // Se inspecciona el manifiesto que gobierna runtime: auth/usuarios no tienen caché offline.
  assert.equal(generado.index, '/index.html');
  assert.equal(generado.navigationRequestStrategy, 'performance');
  assert.ok(
    !Object.keys(generado.hashTable).some((ruta) =>
      endpoints.some((e) => ruta.startsWith(e + '/')),
    ),
  );
  const app = (await leer('src/app/app.html')).toString();
  assert.match(app, /No se guardan acciones pendientes/);
});
