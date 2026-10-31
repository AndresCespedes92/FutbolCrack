# 07 — Angular, PWA, pipes y directivas

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
