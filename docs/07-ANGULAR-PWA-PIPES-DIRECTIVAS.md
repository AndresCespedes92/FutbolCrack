# 07 — Angular, PWA, pipes y directivas

## Estado vigente — Tarea 5C, 2026-11-01

Hay exactamente **tres pipes propios y tres directivas propias**, todos standalone y usados en pantallas reales. Se incorpora soporte PWA oficial compatible con Angular instalado. No se modifica backend ni se agregan módulos funcionales.

### PWA: la recepción del club sin conexión

Una Progressive Web App agrega capacidades de instalación y funcionamiento limitado sin conexión a un sitio web. El manifest describe nombre, icono y presentación. El Service Worker es un intermediario del navegador que puede servir archivos de caché; no es Nest ni reemplaza la autenticación. Como abrir la recepción del club con sus carteles aunque la oficina esté desconectada, la interfaz estática puede estar disponible, pero no las fichas ni las operaciones.

Se revisó la versión real: Angular core 22.2.3, CLI/build 22.2.4. Se agrega únicamente **@angular/service-worker 22.2.3** exacto, alineado con core; package-lock conserva las versiones existentes y añade un paquete. Se usa su worker/generador oficial y el builder de Angular, con configuración explícita; no se instala @angular/pwa como dependencia adicional ni una librería de gráficos/iconos. npm ci debe conservar el lock; al actualizar Angular, revisar también esta coincidencia de versiones.

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/angular.json` | Configuración production.serviceWorker apunta a ngsw-config.json; desarrollo no genera worker |
| `frontend/src/app/app.config.ts` | provideServiceWorker('ngsw-worker.js'), enabled !isDevMode(), registerWhenStable:30000 y updateViaCache none |
| `frontend/ngsw-config.json` | Lista cerrada de estáticos y navegación permitida; sin caché de datos |
| `frontend/public/manifest.webmanifest` | Nombre/descripcion/es-AR, id/start_url/scope '/', standalone, colores negro/musgo |
| `frontend/public/icons/` | Escudo propio FC: SVG de referencia, PNG 192/512 y PNG maskable 512 con fondo opaco |
| `frontend/src/index.html` | Manifest, theme-color, descripción e icono para acceso directo |
| `frontend/src/app/app.html` | Pantalla estática de reconexión tras fallo de autorización; no monta pantallas privadas ni omite sesión |
| `frontend/scripts/pwa.test.mjs` | Tests Node de manifest, iconos, configuración oficial y artefactos del build |

El build de producción genera `frontend/dist/frontend/browser/ngsw-worker.js` y `ngsw.json`; no se editan ni versionan estos artefactos. Se precargan index, JS/CSS (incluidos chunks de rutas), favicon, manifest e iconos propios. No se cachean fotos recibidas de Cloudinary ni contenido del feed. El icono propio se revisó visualmente; no acredita una instalación real.

### Política de caché y autenticación

`dataGroups` es un array vacío. assetGroups no tiene resources.urls ni patrones dinámicos/externos: solo archivos del build. El ngsw.json generado enumera estáticos con hashes. **No hay reglas de caché para /auth, /usuarios, /publicaciones, /comentarios ni /estadisticas**, incluidas sus subrutas/consultas y el origen remoto de la API.

El fallback de navegación es una lista exacta: `/`, `/login`, `/registro`. Se excluyen las rutas API y también dashboards/mi-perfil. `/publicaciones` coincide con nombre de ruta frontend y endpoint API: deliberadamente no recibe fallback offline. Abrir directamente ese enlace sin red puede fallar; volver al inicio `/` muestra el shell. No es lo mismo guardar index.html que guardar una respuesta JSON con publicaciones.

No se cambian cookies HttpOnly, JWT, interceptores, endpoints ni cuerpos/headers de autenticación. Login/logout/autorizar/refrescar y actualización de datos siguen usando red. Sin conexión no se finge una sesión válida: el arranque conserva la comprobación real y presenta explicación/Reintentar. No se agregan localStorage, IndexedDB, cola de escrituras ni sincronización de publicaciones/comentarios. Datos ya recibidos pueden permanecer en memoria de una pestaña abierta; eso no es una copia offline persistente. Las políticas HTTP del servidor no se modifican en esta tarea.

Los tests de autenticación anteriores siguen pasando y la configuración no selecciona respuestas API. Eso **no acredita aún login/logout/renovación con un worker activo en navegador real**: esa verificación queda en la lista de integración.

### Instalación y comprobación manual pendiente

La instalación depende de capacidades/decisión del navegador. Requiere HTTPS en despliegue o entorno local admitido (localhost/127.0.0.1). No se agrega un botón que prometa instalar en todos los equipos. Fuentes: [Angular: inicio](https://angular.dev/ecosystem/service-workers/getting-started), [Angular: configuración](https://angular.dev/ecosystem/service-workers/config), [MDN: instalación](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

1. Compilar `npm run build` desde frontend y servir el contenido de dist/frontend/browser con un servidor estático disponible, vía HTTPS o localhost. `ng serve` de desarrollo no activa este worker; abrir index con file:// no sirve para esta prueba.
2. En navegador de prueba, abrir `/` online y esperar registro/activación del worker (hasta 30 segundos tras el arranque, según estabilidad). Revisar Application/Manifest, Service Workers y Cache Storage.
3. Usar la opción Instalar/Agregar a inicio que ofrezca el navegador, si está disponible; comprobar nombre, icono y ventana standalone.
4. Simular offline y recargar `/`: debe mostrar FutbolCrack y explicación de conexión, sin datos privados ni escrituras pendientes. Recuperar red y Reintentar; no se salta autorización. Probar además las limitaciones de enlaces directos excluidos.
5. Con worker activo, probar registro/login/logout/autorizar/refrescar y cambios de feed/comentarios/estadísticas con cuentas de prueba. Inspeccionar caché: solo estáticos, ninguna respuesta API. No ensayar con secretos o cuentas reales de producción.
6. Verificar una nueva versión en entorno de ensayo y su activación al cerrar/reabrir pestañas. No se fuerza recarga de una sesión/editado ni se llama activateUpdate automáticamente. Una pestaña abierta puede seguir usando su versión hasta el ciclo normal de actualización.

No se realizaron instalación, ensayo visual responsive ni capturas de runtime offline/Cache Storage en navegador real. No se hizo deploy. La caché puede ser desalojada por el navegador y el primer acceso necesita red para descargar/activar; no se promete funcionamiento offline antes de esa primera carga.

### Tres pipes reales

Un pipe transforma un **valor mostrado**; no agrega permisos ni manda HTTP. Sus archivos están en `frontend/src/app/pipes/` y se importan en PublicacionCard y ComentariosPublicacion, compartidos por feed, detalle y perfil.

| Clase / nombre | Uso y reglas | Ejemplo |
| --- | --- | --- |
| TruncatePipe / truncate | Recorta solo presentación; el componente conserva expandido/Ver más/Ver menos. Vacío o valor inválido produce ''. Límite inválido conserva texto; cero produce elipsis para texto no vacío | `descripcion | truncate: limiteTexto : expandido` |
| FechaRelativaPipe / fechaRelativa | Fecha ISO o Date: minutos/horas/días transcurridos; inválido: Fecha no disponible; futuro: Próximamente. time conserva datetime/title exactos | Hace 5 minutos, Hace 2 horas, Ayer, Hace 3 días |
| InicialesPipe / iniciales | Primera letra del primer y último nombre, mayúsculas/acentos. Una palabra da una inicial; sin letras o valor inválido usa FC | Juan Pérez → JP; María → M |

FechaRelativaPipe es puro: se calcula al cambiar entradas o crear la vista; no instala un timer por comentario. El parámetro opcional ahora permite pruebas deterministas. Ayer significa una duración entre 24 y menos de 48 horas, no cambio de día de calendario. El texto no se refresca automáticamente cada minuto; la fecha exacta permanece accesible. No se agrega un cuarto pipe de nombre completo: se adapta el existente fallback de avatar con InicialesPipe.

### Tres directivas reales

Una directiva modifica **comportamiento o presencia de elementos**, no el valor del texto. Archivos en `frontend/src/app/directives/`.

| Clase / selector | Pantalla y decisión |
| --- | --- |
| ResaltarAutorDirective / [appResaltarAutor] | ComentariosPublicacion compara autorId con usuario.id y enlaza booleano; host binding agrega/retira comentario-propio. CSS del componente añade borde musgo sin manipulación de DOM |
| AutoFocusDirective / input[appAutoFocus], textarea[appAutoFocus] | Textarea de edición de comentario. afterNextRender espera el elemento pintado y focus con preventScroll; no consulta document ni usa setTimeout. No roba foco en lectura ni enfoca campos deshabilitados |
| PermisoRolDirective / [appPermisoRol] | Navbar agrupa enlaces Usuarios/Estadísticas en ng-container estructural. input + effect reaccionan a AuthService.usuarioActual; TemplateRef/ViewContainerRef insertan/retiran una sola vista según rol/activo; admite string o lista de roles |

Ejemplo real:

```html
<ng-container *appPermisoRol="'administrador'">
  <!-- Enlaces administrativos de la navegación -->
</ng-container>
```

Un jugador común no ve esas opciones; al cerrar sesión o deshabilitarse desaparecen si cambia el estado en memoria. **Es únicamente presentación:** un cliente puede evitar Angular, por eso Nest mantiene AuthGuard/AdministradorGuard y la comprobación de ficha actual. La directiva no consulta por sí sola el servidor, no otorga roles y no reemplaza el guard de ruta.

### Cómo se prueba y qué estudiar

Pruebas Angular: valores/límites/vacíos/invalidos de pipes, acentos e iniciales compuestas; host real para directivas, foco al abrir/reabrir y estado deshabilitado, rol común/admin/logout/baja/rehabilitación y ausencia de vistas duplicadas. Los comentarios y tarjetas reales verifican uso integrado, foco/cancelación sin PUT, resaltado al cambiar usuario e iniciales sin foto. App prueba reconexión y nuevo POST real de autorización con HTTP simulado.

`npm run test:pwa` se ejecuta tras build: once pruebas con Node, generador oficial y ngsw.json real. Validan manifest, PNG/dimensiones, worker/versiones, precarga/hashes y ausencia de caché/fallback API, incluyendo archivos señuelo privados. Es una revisión de configuración/artefactos, no un navegador que instala o ejecuta el worker. Resultados exactos en 08.

Conceptos para defensa: pureza y PipeTransform, signal/input/effect, host bindings, directiva estructural, inyección de dependencias, afterNextRender, caché de estáticos frente a datos, autenticación en servidor y pruebas de presentación frente a integración. CSS de resaltado comentado; no se rediseñan pantallas ni se agregan animaciones.

## Antecedentes de auditoría y tareas anteriores (no representan el estado vigente)


## Estructura actual

App inicia con bootstrapApplication en `frontend/src/main.ts`. AppConfig provee Router y HttpClient. Las pantallas y componentes son standalone, separados en TS/HTML/CSS. RouterOutlet muestra las rutas; MiPerfil usa un CanActivateFn que consulta el backend.

Se usan @if, @for con track, RouterLink, RouterLinkActive, NgClass, bindings de propiedades/atributos/eventos y Reactive Forms. AuthService y PublicacionesService Angular son providedIn root y se inyectan con inject; exponen Observable de HttpClient. Hay estados locales de carga/error y ChangeDetectorRef.markForCheck tras respuestas.

No se encontraron decoradores propios @Pipe o @Directive ni un interceptor HTTP propio. NgClass/RouterLink son directivas de Angular, no cuentan entre las tres propias. AuthGuard es un guard, no una directiva. `createdAt.slice(0, 10)` en el feed tampoco cuenta como pipe.

El [mapa](00-MAPA-DEL-PROYECTO.md) ubica componentes y servicios. Los [requisitos](09-REQUISITOS-SPRINTS.md) contienen criterios de aceptación.

## Tres pipes propios propuestos, no creados

| Pipe / nombre de plantilla propuesto | Problema que resuelve y ejemplo                                                                                             | Archivos propuestos                                                          | Pruebas y condiciones                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **TruncatePipe** / truncate          | Un relato de un partido no ocupa toda la pantalla. Recorta por un límite configurable y agrega un sufijo cuando hace falta. | `frontend/src/app/pipes/truncate.pipe.ts` y spec; import en PublicacionCard. | null/vacío, texto corto/límite/largo, acentos, límite válido. Debe ser uno de los tres del Sprint 4. |
| NombreCompletoPipe / nombreCompleto  | El nombre del autor se arma siempre igual y tiene un fallback si fue dado de baja/no está disponible.                       | `pipes/nombre-completo.pipe.ts` y spec; tarjeta y encabezado de perfil.      | Sin autor, un solo nombre, nombre y apellido, espacios; no mutar el objeto.                          |
| InicialesPipe / iniciales            | Si un jugador no tiene foto, su avatar muestra MR en vez de FC para todos.                                                  | `pipes/iniciales.pipe.ts` y spec; tarjeta con autor real.                    | null, nombre simple, compuesto, letras acentuadas y espacios sobrantes.                              |

Un pipe transforma un valor para presentarlo; no consulta HTTP, no cambia permisos ni guarda datos. Reutilizarlo en feed y perfil evita repetir transformaciones.

TruncatePipe solo recorta texto. El estado expandido pertenece a la tarjeta: Ver más muestra el texto completo y Ver menos vuelve al recorte, con aria-expanded y sin volver a pedir el texto si ya está cargado. La longitud y el texto original no se deben modificar en MongoDB. No crear un cuarto pipe de truncado para cumplir otra pantalla.

## Tres directivas propias propuestas, no creadas

| Directiva propuesta         | Uso útil                                                                                     | Ubicación propuesta                                                     | Pruebas y límites                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AutoResizeTextareaDirective | Ajustar el alto del textarea al escribir un post/comentario sin scroll interior innecesario. | `frontend/src/app/directives/auto-resize-textarea.directive.ts` y spec. | Texto largo, borrado, resize y limpieza de listeners; respetar alto máximo y móvil.                                                             |
| ResaltarAutorDirective      | Destacar visualmente una publicación propia comparando su autor con la identidad actual.     | `directives/resaltar-autor.directive.ts` y spec.                        | Coincidencia, otro usuario, sesión ausente y cambio de input; es presentación, no autorización.                                                 |
| FocoInicialDirective        | Llevar el foco al control inicial al abrir un modal o formulario, útil para teclado.         | `directives/foco-inicial.directive.ts` y spec.                          | Abrir/cerrar repetidamente, elemento disponible y foco esperado. El modal también debe administrar Escape, retorno de foco y recorrido interno. |

Una directiva agrega comportamiento al elemento al que se aplica. Estas propuestas no duplican una funcionalidad de negocio ni justifican un módulo extra. Una directiva de presentación jamás sustituye la verificación de autor/rol en Nest.

## PWA: estado y plan

No hay @angular/service-worker en package.json, manifest.webmanifest, ngsw-config.json ni provideServiceWorker en AppConfig. El favicon por sí solo no convierte la app en PWA.

Pasos propuestos para una tarea posterior autorizada:

1. Verificar el alcance offline que pide el TP y compatibilidad con la versión Angular instalada.
2. Incorporar el soporte oficial. El comando orientativo `ng add @angular/pwa` modifica dependencias y configuración: **no se ejecutó** en esta auditoría.
3. Revisar manifest, nombre, colores, íconos adecuados e instalación. Mantener la marca FutbolCrack.
4. Revisar provideServiceWorker y generación de archivos de producción; documentar el directorio de salida y HTTPS.
5. Cachear el shell y recursos estáticos necesarios. No agregar un cache general de /auth/me, usuarios, respuestas privadas ni credenciales.
6. Mostrar estado offline sin aparentar que una publicación o comentario ya fue guardado. No agregar sincronización en segundo plano si el enunciado no la solicita.
7. Probar instalación, recarga offline del shell, actualización y logout con caché; explicar qué partes necesitan conexión.

El flujo oficial agrega paquete, manifest, registro del service worker y configuración de build. [Guía Angular](https://angular.dev/ecosystem/service-workers/getting-started). El alcance de esta tarea prohíbe agregar dependencias: el trabajo actual es exclusivamente documental.

## Qué estudiar y cómo comprobarlo

Seguir la navegación en app.routes.ts, luego el binding de una tarjeta y el FormGroup del registro. Buscar los imports de cada standalone para explicar qué directivas habilita. Para los futuros pipes/directivas, usar pruebas unitarias y de DOM que comprueben el resultado visible, no solamente la creación de una clase.

Conceptos actuales: standalone, DI, observables, estado de componente, forms y bindings. Conceptos futuros: PipeTransform, directivas de atributo, eventos del host y ciclo de vida; service worker y caché diferenciados de la API. Ninguna propuesta está implementada todavía.
