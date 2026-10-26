# Sprint 1 — FutbolCrack

## Bloque 1: base visual y navegación

Implementado: paleta global, navegación responsive, cuatro pantallas provisionales públicas, títulos de página, redirecciones y favicon SVG propio. Las pantallas todavía no incluyen formularios, feed ni ficha de jugador: corresponden al bloque 2 pendiente de aprobación.

## Organización

- `src/app/app.{ts,html,css}`: estructura principal, navegación y espacio para las rutas.
- `src/app/components/navbar/navbar.{ts,html,css}`: marca y enlaces compartidos.
- `src/app/pages/`: componentes login, registro, publicaciones y mi-perfil, con archivos separados.
- `src/app/app.routes.ts`: rutas `/login`, `/registro`, `/publicaciones` y `/mi-perfil`. Inicio y URL desconocida redirigen a publicaciones.
- `src/styles.css`: paleta, tipografía, foco visible y estilos compartidos.
- `src/index.html` y `public/favicon.svg`: idioma, título e identidad del navegador.
- `src/app/app.spec.ts`: comprobaciones de navegación.

## Conceptos y origen

Se inspeccionaron `../CineBera/src/app/app.ts`, `app.html` y `app.routes.ts`. Se implementaron nuevamente los conceptos de componentes standalone, RouterOutlet y carga de componentes mediante loadComponent. No se copiaron servicios, guards ni autenticación. RouterLink navega sin recargar y RouterLinkActive identifica la pantalla actual.

## Diseño

Paleta obligatoria definida mediante variables CSS. Marca con escudo y letras FC, títulos contundentes, bordes rectos y superficies oscuras. Navegación en dos columnas en pantallas pequeñas, foco visible, enlace para saltar al contenido y respeto por movimiento reducido.

## Ejecución y comprobaciones

Desde `frontend/`: `npm install` si faltan dependencias, `npm start` para desarrollo, `npm run build` para compilación y `node node_modules/@angular/cli/bin/ng.js test --watch=false` para pruebas. Se usa Angular CLI directamente porque npm 12 rechazó el reenvío de `--watch` en este entorno.

## Pendientes

Bloque 2: formularios visuales, publicaciones de demostración y ficha de jugador. Bloque 3: ampliar esta documentación y la guía con ejemplos de las pantallas definitivas. No hay conexión con API, JWT, persistencia ni autenticación simulada. Backend sin modificaciones.

Resultado del bloque 1: compilación de producción correcta; 3 pruebas de navegación aprobadas; git diff --check sin errores. La adaptación responsive se definió mediante CSS; queda pendiente la revisión visual en navegador.
