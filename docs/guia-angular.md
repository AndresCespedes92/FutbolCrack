# Guía Angular — FutbolCrack (3C)

## Dónde empezar

| Pieza | Archivo principal en frontend/src/app | Responsabilidad |
| --- | --- | --- |
| Rutas | app.routes.ts | Pantallas públicas y guard de Mi Perfil. |
| Feed padre | pages/publicaciones/publicaciones.ts | Formulario, orden, páginas y lectura de datos. |
| Perfil padre | pages/mi-perfil/mi-perfil.ts | Ficha real y últimas tres jugadas propias. |
| Tarjeta hija | components/publicacion-card/publicacion-card.ts | Presentación, expansión y emisión de acciones. |
| Modal hijo | components/confirmacion-baja/confirmacion-baja.ts | Confirmación propia, teclado y foco. |
| HTTP | services/publicaciones.ts | Contratos tipados y llamadas a NestJS. |
| Acciones | services/acciones-publicaciones.ts | Evita duplicados y coordina mutaciones/mensajes compartidos. |
| Pipe | pipes/truncate.pipe.ts | Recorta solo el texto presentado; primero de tres pipes de S4. |

Cada componente usa tres archivos: `.ts` define datos/métodos/importaciones; `.html` describe lo que se muestra y eventos; `.css` controla su apariencia. `templateUrl` y `styleUrl` los conectan. Para cambiar el ancho/radio de una tarjeta se edita su CSS; para cambiar el endpoint se revisa el servicio HTTP. Los comentarios CSS marcan las secciones que pueden ajustarse manualmente.

## Bindings y comunicación

Ejemplo real de las plantillas: `[publicacion]="publicacion"` es property binding de un Input; `(solicitarBaja)="acciones.solicitarBaja($event, usuario)"` escucha un Output. `{{ publicacion.cantidadLikes ?? 0 }}` interpola un número. `[disabled]="procesando"` bloquea un botón y `[attr.aria-pressed]` comunica el estado a tecnologías de asistencia.

El padre conoce la colección y los servicios; el hijo conoce una ficha. Como el encargado de la cartelera del club, el padre entrega cada parte al hijo; cuando el socio quiere votarlo, el hijo avisa y el encargado tramita la operación. EventEmitter emite la publicación, no modifica la base ni llama HTTP.

`@if` muestra carga/error/contenido según el estado; `@for (...; track publicacion._id)` identifica cada ficha por su id. Son bloques de control de Angular. No se duplicó el formulario ni se creó un módulo funcional nuevo: se usan componentes standalone e imports explícitos.

## Formularios y pipe

Publicaciones conserva FormGroup con titulo, descripcion e imagen. `[formGroup]` conecta el objeto a `<form>` y `formControlName` a cada control. Validators exige texto no vacío, título de hasta 120 y descripción de hasta 2000; el validador compartido limita formato/tamaño de imagen. Nest vuelve a comprobar los datos: validar en Angular ayuda al usuario, pero no concede confianza al cliente.

El archivo no usa formControlName: seleccionarImagen toma File y lo guarda en el control. crear arma FormData; el navegador agrega el boundary multipart. Ante error no se borra lo escrito; tras éxito se limpia el formulario y se vuelve a offset cero.

En la tarjeta, `descripcion | truncate: limiteTexto : expandido` llama al pipe puro. El límite actual es 280. Ver más cambia expandido a true y devuelve todo; Ver menos vuelve a recortar. No cambia el documento original. Para modificar el largo visual, cambiar limiteTexto en la tarjeta y revisar sus pruebas; no alterar los 2000 de validación de la descripción.

## Señales, servicios y peticiones

AccionesPublicaciones usa `signal` para mensaje, error, IDs pendientes y modal seleccionado. Una señal se lee como función (`acciones.mensaje()`) y se actualiza con set/update. Angular detecta esas lecturas y actualiza la vista. Cada pantalla declara providers para tener estado propio, reutilizando la misma implementación.

El servicio HTTP devuelve Observable tipado. El contenedor o servicio de acciones se suscribe y trata éxito/error. takeUntilDestroyed cancela suscripciones al destruir la pantalla; el feed además cancela el GET anterior antes de solicitar otra página. markForCheck marca los cambios de estado ordinarios, incluido el comienzo de carga. No se cambió la estrategia global de detección ni la autenticación.

## Routing: recorrido paso a paso

1. Entrar a `/` redirige a `/publicaciones`; app.routes.ts carga el componente con loadComponent.
2. Publicaciones consulta la primera página con orden fecha, offset 0 y limit 10. Consulta /auth/me para acciones visibles; sin sesión se puede leer igual.
3. El sobre `{ publicaciones, total, offset, limit, hayMas }` llena colección y metadatos; cada ficha recibe su Input. La API ya filtró y paginó en MongoDB.
4. Pulsar página 2 envía offset 10; Más populares envía orden likes y offset 0. No se descargan todos los documentos.
5. Un voto emite cambiarLike; AccionesPublicaciones bloquea ese id, llama al endpoint y recarga la página para obtener valores actuales. Los fallos muestran mensajes sin simular éxito.
6. Dar de baja abre el modal. Cancelar no envía HTTP; Confirmar recién entonces ejecuta DELETE. Nest comprueba autor/admin y marca activo false.
7. Ir a `/mi-perfil` pasa por authGuard existente. MiPerfil consulta los datos actuales y después solo sus tres publicaciones recientes. Se reutilizan tarjeta, acciones y modal.
8. Desde 4B, abrirDetalle navega a publicaciones/:id. PublicacionDetalle obtiene una jugada y reutiliza ComentariosPublicacion para leer/escribir/editar; Mi Perfil monta la misma sección con el id de cada una de sus tres jugadas.

## Cómo cambiar la apariencia

- `styles.css` contiene `--color-primary`, `--color-secondary`, `--radius-control` y `--radius-card`: ya existían y no se modificaron en 3C.
- `publicacion-card.css`: padding/radio, tamaño del avatar, altura máxima de foto y estados del voto. `object-fit: contain` conserva la imagen completa.
- `confirmacion-baja.css`: ancho del modal, padding, fondo y `::backdrop` oscuro. El dialog usa la capa superior nativa.
- `publicaciones.css`: distribución feed/barra lateral, formulario, selector y botones de páginas. Los estilos de tarjeta se trasladaron al hijo para no duplicarlos.
- `mi-perfil.css`: ficha, datos y CV. Sus publicaciones toman el CSS de la tarjeta compartida.
- Las media queries apilan o ajustan controles en pantallas pequeñas; el foco visible global se conserva para teclado.

## Relación con CineBera y defensa

Se reutiliza la idea de rutas/pantallas, servicios HTTP, formularios reactivos, validaciones y tarjetas con Input. Se adapta el contenido a jugadores/jugadas, la persistencia a los endpoints actuales y la interacción a Outputs, paginación real y confirmación de bajas. No se presume una equivalencia línea por línea con CineBera, cuyo repositorio no forma parte de esta tarea.

| Pregunta del profesor | Respuesta basada en este código |
| --- | --- |
| ¿Por qué la tarjeta no llama al backend? | El padre coordina el listado y las acciones; permite reutilizarla en perfil/feed sin duplicar HTTP. |
| ¿Qué lleva $event? | El objeto Publicacion emitido por EventEmitter del hijo. |
| ¿Es seguro ocultar Dar de baja? | Solo ayuda visualmente; Nest verifica autor/admin actual antes de modificar MongoDB. |
| ¿Por qué un servicio de acciones con providers por pantalla? | Comparte reglas y métodos, pero cada contenedor tiene señales/mensajes/modal independientes. |
| ¿Dónde se pagina realmente? | En listar del backend; Angular manda offset/limit y renderiza la respuesta. |
| ¿Qué evita dos votos por doble clic? | El botón y Set pendiente en Angular; además el filtro atómico con addToSet en MongoDB evita duplicados entre solicitudes. |
| ¿Cancelar elimina algo? | No. Solo borra selección/cierra modal. DELETE solo se llama desde confirmarBaja. |
| ¿El pipe modifica la base? | No. Es puro y transforma exclusivamente la presentación del texto. |
| ¿Están completos comentarios y detalle? | Implementados localmente en 4B, pendientes de ensayo integrado en navegador/API real. |
| ¿Qué falta para aceptar producción? | Ensayo con API/base/cookies reales y navegador, además de los requisitos restantes del TP. |

Pruebas y comandos exactos en [08](08-PRUEBAS-Y-DESPLIEGUE.md); ubicaciones backend/frontend en [00](00-MAPA-DEL-PROYECTO.md). No hay cambios de JWT/cookies, dependencias ni contratos backend en esta tarea.

## Recorrido y conceptos nuevos de 4B

- **Ruta:** app.routes.ts agrega publicaciones/:id. PublicacionDetalle escucha ActivatedRoute.paramMap, consulta un solo id y cancela la lectura anterior al cambiar de jugada. Una URL directa funciona sin haber cargado el feed.
- **Comunicación:** feed/perfil escuchan abrirDetalle de PublicacionCard y llaman verDetalle. La tarjeta sigue sin HTTP. textoCompleto muestra la descripción íntegra en detalle con el mismo TruncatePipe.
- **Comentarios:** components/comentarios-publicacion usa Inputs publicacionId/usuario y Output publicacionNoDisponible. El padre conserva la ficha y sesión; la sección controla su colección, formularios y llamadas delegadas a services/comentarios.ts.
- **Formulario:** nuevoForm y edicionForm son FormGroup. formControlName conecta el texto; validadores impiden vacíos/solo espacios y más de 1000 unidades UTF-16. El contador usa `.length`; un emoji puede contar dos. En error se conserva el texto y en éxito se usa la respuesta real.
- **Página:** siguienteOffset empieza en cero y cada GET envía limit 3. Una Map por _id anexa sin duplicar; el offset avanza por filas recibidas. Tras crear se reinicia desde cero porque los offsets anteriores se desplazaron.
- **Editar:** puedeEditar muestra el botón solo al autor; Nest vuelve a validarlo. Guardar envía PUT, sustituye un único objeto y la marca modificado muestra Editado. Cancelar no solicita HTTP.
- **Perfil:** cada publicacion-del-perfil agrupa la tarjeta y la sección con el mismo id; como máximo tres consultas de tres comentarios al principio. No se duplica el detalle ni se cargan cantidades ilimitadas.
- **CSS:** comentarios-publicacion.css define formularios/autor/texto/estados y su regla móvil; publicacion-detalle.css solo dispone los hijos. mi-perfil.css agrupa cada jugada y comentarios. Paleta y radios globales permanecen iguales.

Ejemplo real: el encargado entrega a cada cuaderno el id de su jugada. «Cargar más» agrega tres notas del mismo cuaderno; si el socio escribe una nueva, vuelve a abrir las primeras tres para no saltar notas con números de página viejos.

| Pregunta de defensa | Respuesta |
| --- | --- |
| ¿Por qué hubo que agregar GET individual? | El listado solo filtraba por autor; buscar un id descargando páginas sería incorrecto. El nuevo GET filtra por id antes de limitar. |
| ¿Por qué offset no es comentarios.length? | Una fila repetida por cambios externos se deduplica en pantalla, pero el servidor ya la contó entre las recibidas. Se avanza por registros recibidos. |
| ¿Se mantiene lo cargado al fallar Cargar más? | Sí; el array y offset previo quedan intactos para reintentar. |
| ¿Por qué vuelve a tres después de crear? | La nueva nota desplaza los offsets de páginas anteriores; reiniciar mantiene una secuencia coherente. |
| ¿Un admin puede editar otra opinión? | No. La UI compara autor y Nest lo exige sin excepción de admin. |
| ¿TruncatePipe ahora cuenta dos veces? | No; se reutiliza el mismo pipe en publicaciones y comentarios. |
| ¿Se renovó la sesión? | Desde 4C se puede extender voluntariamente antes de exp; un 401 protegido redirige a login. Red/403/500 mantienen la sesión y el borrador actual. |

## Gestión de sesión — Tarea 4C

Las referencias anteriores a sesión pendiente corresponden a 3C/4B. Ahora App.ngOnInit llama a comprobarSesion, muestra la pantalla de carga y recién después permite renderizar el outlet. El POST autorizar recupera usuario/emitidaEn/expiraEn/horaServidor, sin JWT. Al recargar no se inventan quince minutos nuevos: se usan las fechas reales del servidor.

### Qué hace cada parte

| Archivo Angular | Responsabilidad |
| --- | --- |
| services/auth.ts | Estado en señales, autorizar compartido/caché, refrescar, aviso/expiración y limpieza de timers/listeners. |
| services/api.config.ts | API_URL que ya usaba el proyecto, compartida por los servicios y el interceptor. |
| app.ts/html/css | Pantalla inicial, error/reintento, continuidad de ruta y modal. |
| components/extender-sesion/ | Presenta minutos restantes y emite extender/ahoraNo; no hace HTTP. |
| interceptors/sesion.interceptor.ts | Trata 401 protegido sin confundirlo con 403 u error de red. |
| guards/auth.guard.ts | Usa comprobarAcceso y preserva returnUrl de la ruta protegida. |
| pages/login/login.ts/html | Guarda estado desde la respuesta del login, muestra mensaje de vencimiento y vuelve a destino interno. |

### Recorrido del carnet del club

1. La recepción (App) pregunta a la oficina (Nest) si el carnet de la cookie sigue vigente. Mientras espera muestra carga.
2. Autorizar verifica firma/exp y ficha actual. Si no hay sesión, App va a login, manteniendo la dirección interna solicitada. Login y registro no se redirigen a sí mismos.
3. Si el carnet es válido, AuthService guarda usuario y fechas en memoria. Las pantallas reutilizan usuario sin otro GET me. Raíz y guard comparten el mismo POST pendiente usando shareReplay.
4. El timer de aviso apunta a exp menos cinco minutos. Carnet emitido 12:00 y válido hasta 12:15: aviso a 12:10. Si se recarga a 12:08, avisa en dos minutos.
5. El modal hijo emite extender solo cuando el usuario pulsa. App llama refrescar; Nest exige que el carnet siga vigente y devuelve otro hasta quince minutos desde ahora. No se manda un rol para pedir permisos.
6. Ahora no cierra el aviso sin solicitar HTTP y mantiene el vencimiento original. No hay renovación automática.
7. Al vencer, AuthService limpia usuario/timers y navega al login con mensaje. Al volver de suspensión compara Date.now ajustado con horaServidor; no depende de que cada callback haya corrido puntualmente.
8. Logout pide al servidor borrar cookie y solo en éxito limpia el estado. Si falla por red, se conserva la sesión para reintentar.

### Señales, Observables y timers

`usuarioActual`, `expiraEn`, `mostrarAviso`, `renovando` y los mensajes son señales: la plantilla lee `auth.mostrarAviso()` y Angular actualiza esa parte. El hijo recibe `[renovando]` y emite `(extender)`/`(ahoraNo)`, como las tarjetas de CineBera y FutbolCrack.

shareReplay permite que dos consumidores esperen una sola autorización/renovación pendiente. finalize limpia la referencia a la solicitud al terminar. takeUntilDestroyed y los callbacks de DestroyRef cancelan lecturas y limpian listeners/timers cuando corresponde. versionSesion evita que una respuesta antigua de autorización restaure un usuario después de logout.

Se mantiene un setTimeout de aviso y otro de expiración. Antes de programar una sesión nueva se limpian ambos. El exp de Nest es la autoridad; el cálculo de UI corrige aproximadamente el desfase de reloj y no reemplaza validación del servidor. No se usa localStorage/sessionStorage ni document.cookie para leer el token.

### Interceptor y errores

El interceptor está registrado en app.config.ts con withInterceptors. Observa respuestas de nuestra API y endpoints protegidos. Un 401 significa sesión no válida y lleva a login; un 403 significa que la solicitud no tiene permiso y no cierra la sesión. Errores de red/500 se muestran en el componente, preservando formularios.

El 401 de credenciales de login y el de autorizar sin sesión son esperables y tienen sus manejadores propios; por eso se excluyen del cierre global. Un 401 real que destruye la pantalla al redirigir no conserva el borrador entre pantallas: la memoria del formulario no es almacenamiento permanente.

### Preguntas para defender

| Pregunta | Respuesta implementada |
| --- | --- |
| ¿JWT y cookie son lo mismo? | No: el JWT es el carnet firmado; la cookie HttpOnly es el medio que el navegador guarda/envía. Angular no lee el token. |
| ¿Por qué autorizar no renueva? | Comprueba el carnet actual y devuelve su exp; emitir otro exige la acción voluntaria de refrescar. |
| ¿Puede renovar un token vencido? | No. AuthGuard y el servicio comprueban exp, incluso después de consultas que puedan tardar. |
| ¿Cómo evitás dos pedidos al iniciar? | Raíz y guard comparten el Observable pendiente; luego usan el estado válido en memoria. |
| ¿Por qué no contás diez minutos desde abrir Angular? | El JWT pudo emitirse antes; se calcula exp menos cinco con metadatos del backend. |
| ¿Qué ocurre con 403 al dar de baja una jugada? | Se informa el rechazo y mantiene sesión; Nest decide permisos actuales. |
| ¿CORS impide CSRF por sí solo? | No. El middleware valida Origin/Referer y rechaza su ausencia en sesión/escrituras con cookies. |
| ¿Se puede comprobar un usuario deshabilitado? | Todavía no: el modelo no tiene habilitación. Se valida existencia, sin inventar campos/administración de Sprint 4. |

CSS del spinner en app.css y del dialog en extender-sesion.css: mismos colores/radios globales, contorno de teclado y preferencia de movimiento reducido. Pruebas con reloj simulado y límites reales en 08; contratos, cookies/CSRF y riesgos en 02.

## Tarea 5A — Cómo estudiar la administración de usuarios

### Archivos y responsabilidades

`pages/dashboard-usuarios/dashboard-usuarios.ts` coordina listado, formulario y operaciones. Su HTML muestra tabla, radios y mensajes; su CSS comenta grilla de dos columnas, cambio móvil, colores y bordes redondeados. Para cambiar espaciado se modifica .panel; para el ancho móvil, @media (max-width:700px); la tabla tiene scroll local. Se conservan variables globales de negro/musgo/gris.

`services/usuarios.ts` concentra HTTP y contratos. `guards/administrador.guard.ts` controla navegación. `components/confirmacion-usuario/` separa TS, HTML y CSS del modal. `app.routes.ts` carga la pantalla al navegar a /dashboard/usuarios; navbar muestra el enlace según el usuario de AuthService. El backend vuelve a verificar todo: esconder un botón no impide llamadas manuales.

### Recorrido paso a paso

1. El secretario inicia sesión. AuthService conserva la ficha y metadatos de 4C, sin exponer JWT al componente.
2. Pulsa Administrar usuarios. administradorGuard llama comprobarAcceso. Sin sesión redirige al login con returnUrl; con sesión común vuelve al feed con acceso=sin-permiso y aviso, sin cerrar sesión; un admin continúa.
3. DashboardUsuarios.ngOnInit llama cargarUsuarios. UsuariosService.listar envía GET con cookie. Nest verifica JWT, ficha activa y rol actual, consulta MongoDB y responde sin hash. Angular reemplaza usuarios y termina el estado de carga.
4. El formulario usa crearFormularioRegistro: reutiliza reglas y estilos rojo/verde de CineBera, con controles nuevos para esta pantalla. Perfil es un FormControl separado y se elige con radio buttons. CrearUsuario mapea nombres del formulario a DTO y nunca envía hash ni activo.
5. Nest valida DTO, compara contraseñas, genera hash y guarda mediante el mismo método privado usado por el registro. Tras 201 se limpia el formulario, vuelve el rol usuario y se recarga el padrón. Ante error se conserva el borrador.
6. Deshabilitar solo selecciona una cuenta y abre ConfirmacionUsuario. Input usuario le indica a quién; procesando/error muestran estado. Output cancelar llama cancelarBaja sin HTTP; confirmar llama confirmarBaja en el padre y recién ahí ejecuta DELETE.
7. Si Nest confirma, se cierra el modal y se recarga el listado con mensaje. Si falla, el modal permanece con error. Habilitar llama su endpoint y espera confirmación de éxito del servidor.
8. El jugador suspendido recibe 401 incluso con JWT anterior: la ficha tiene activo false. No se eliminan sus publicaciones ni comentarios. Las cuentas antiguas sin campo continúan activas.

### Fragmentos reales y conceptos

```ts
readonly formulario = crearFormularioRegistro();
readonly perfil = new FormControl<PerfilUsuario>('usuario', { nonNullable: true });
```

La factoría comparte validadores, no instancias de controles: escribir aquí no cambia el registro. Los bindings [formControl] y [class.input-invalido]/[class.input-valido] conectan estado y presentación; @if decide qué mensaje renderizar y @for recorre el padrón. No son directivas propias. takeUntilDestroyed evita mantener suscripciones de un componente destruido. markForCheck notifica los cambios de llamadas asíncronas a la vista.

```ts
cancelarBaja(): void {
  if (!this.procesandoId) {
    this.seleccionado = null;
    this.errorOperacion = '';
  }
}
```

Cancelar cambia estado local. El modal no tiene servicio HTTP: se comunican hijo y padre mediante Input/Output. La comparación de claves, formulario reactivo y feedback visual retoman CineBera; se adaptan al perfil de jugador y al rol administrativo, sin crear un panel de reclutadores.

### Preguntas de defensa

- **¿Rol y activo son lo mismo?** No: rol define permisos; activo permite o bloquea usar la cuenta. Un admin inactivo también queda bloqueado.
- **¿Por qué no alcanza un guard Angular?** El cliente puede evitarlo y llamar al endpoint; Nest consulta identidad, estado y rol.
- **¿Cómo se invalida un JWT anterior?** Su firma puede seguir válida, pero AuthGuard consulta activo en MongoDB y responde 401. No se cambia la duración de 15 minutos.
- **¿Qué es una baja lógica?** Cambiar activo false conservando el documento y sus relaciones, como suspender un carnet del club sin destruir la ficha.
- **¿Cómo se protege el último admin?** Esta implementación no permite deshabilitar ninguna cuenta administradora. Evita contar y luego actualizar con una carrera; es una política explícitamente más restrictiva.
- **¿Qué pasa con un usuario antiguo?** activo !== false considera activa la ausencia; no se migró la base.
- **¿Por qué compartir hash y formulario?** Evita duplicar reglas y negocio. El backend sigue siendo autoridad aunque Angular valide primero.
- **¿Cómo se demuestra cancelar?** Las pruebas abren el modal, cancelan y verifican que no se emitió DELETE. No se usa window.confirm ni alert.
- **¿Qué está pendiente de comprobar?** Navegador/móvil real, Atlas e integración de cookies en producción; las suites locales usan HTTP y dobles controlados.

## Tarea 5B — Estadísticas del club, paso a paso

### Qué estudiar y dónde

- `pages/dashboard-estadisticas/dashboard-estadisticas.ts`: DashboardEstadisticas, tres formularios, actualizar/cargar y geometría (anchoBarra, puntoDia, puntosLinea, segmento, desplazamiento).
- Mismo nombre `.html`: filtros, @for de reportes, @if de estados, gráficos/tablas. `.css`: variables de color, radios, SVG y móvil; comentarios indican qué modificar.
- `services/estadisticas.ts`: EstadisticasService y contratos. Cada método devuelve Observable de GET con desde/hasta y withCredentials; el contenedor se suscribe.
- `app.routes.ts`: ruta lazy /dashboard/estadisticas con administradorGuard existente. Navbar muestra enlace al admin habilitado; Nest exige lo mismo sin depender de Angular.

Como en CineBera, TS mantiene estado/validaciones, HTML usa bindings y CSS define presentación. @if/@for y ReactiveFormsModule son de Angular; no se crean pipes/directivas propios para gráficos.

### Recorrido concreto

1. El secretario pulsa Estadísticas. El router comprueba sesión/rol con el guard de 5A. Visitante va a login; jugador común vuelve al feed con aviso, conservando sesión.
2. ngOnInit inicia tres consultas con formularios independientes, desde primer día del mes hasta hoy en UTC−03:00.
3. Actualizar(0) llama cargar para publicaciones. Marca controles, rechaza calendario/rango inválido y bloquea nuevas consultas de ese reporte mientras espera.
4. EstadisticasService envía el rango. Nest verifica JWT/ficha actual, valida query y convierte días a instantes UTC. El navegador no decide permisos ni cuenta documentos.
5. MongoDB aplica match/group para publicaciones, o lookup/match/count/group para comentarios. Como ordenar planillas antes de sumar, primero se descarta lo ajeno al período y a la cartelera visible.
6. La respuesta trae cantidades/rango aplicado. El componente finaliza carga y markForCheck actualiza HTML. Barras comparan jugadores, línea muestra días y dona distribuye comentarios; tablas conservan cifras exactas.
7. Cambiar Hasta en comentarios totales y Actualizar solo reemplaza ese reporte; los otros mantienen datos/rango. Un error retira cifras anteriores, conserva controles y permite reintentar.
8. Si el admin retira una publicación desde el feed con el modal existente, el documento permanece. Al actualizar reportes se excluyen esa jugada y sus comentarios. Las cifras de un mes pasado pueden bajar: reflejan visibilidad actual, no historia inmutable.

### Ejemplos reales y conceptos

```ts
readonly publicaciones = crearReporte<PublicacionesPorUsuario>('Publicaciones por usuario');
readonly total = crearReporte<ComentariosTotales>('Comentarios totales');
```

Cada llamada crea su propio FormGroup: compartir una función evita duplicar estructura, pero no comparte controles. validarRango es un ValidatorFn del grupo, como comparar contraseñas en CineBera. Bindings de clases muestran rojo/verde; [disabled] bloquea fieldset durante consulta. Nest repite validaciones porque un cliente puede omitir Angular.

```ts
{ $match: { activo: { $ne: false }, createdAt: { $gte: inicio, $lt: finExclusivo } } },
{ $group: { _id: '$autorId', cantidad: { $sum: 1 } } },
```

Fragmento real de PublicacionesService: selecciona publicaciones visibles creadas en el intervalo y forma grupos por autor. `$count` da una cifra global; `$group` devuelve varias. `$lookup` de ComentariosService comprueba que la publicación sigue visible. No se envían textos/correos para graficar. Detalle en 06.

SVG/porcentajes son geometría de presentación: segmento divide cantidades ya recibidas, no cuenta documentos. puntosLinea añade tramos a cero en días ausentes sin crear miles de elementos vacíos. El total viene de MongoDB. Las tablas permiten leer sin interpretar colores. takeUntilDestroyed termina suscripciones al destruir el componente; los formularios bloquean envíos simultáneos de un mismo reporte.

### Preguntas de defensa

- **¿Por qué calcular en backend?** Evita descargar todo; MongoDB filtra/agrupa con reglas comunes y Nest controla permisos.
- **¿Contar o agrupar?** Contar devuelve total; agrupar por publicación devuelve una cantidad por jugada.
- **¿Desde/Hasta son inclusivos?** Sí, días completos UTC−03:00. La consulta usa inicio incluido y comienzo del siguiente día excluido para no perder milisegundos.
- **¿Qué fecha se filtra?** Creación de publicación en A; creación de comentario en B/C. Editar no cambia createdAt.
- **¿Qué sucede con bajas?** Jugada inactiva y comentarios fuera aunque existan en MongoDB. Deshabilitar una cuenta no retira sus jugadas por sí mismo.
- **¿Qué es $facet?** Produce varias salidas del mismo conjunto filtrado: aquí total y evolución diaria.
- **¿Librería de gráficos?** No: barras CSS y línea/dona SVG nativas, con tablas equivalentes y estilos separados/comentados.
- **¿Cómo se evita una respuesta vieja?** Cada reporte bloquea nuevos envíos/filtros durante carga; no se superponen sus consultas. Los demás son independientes.
- **¿Qué demuestra la suite?** Reglas, consultas, fixtures, HTTP local y DOM/router. No acredita índices/rendimiento Atlas ni apariencia manual en teléfono.

## Tarea 5C — Pipe, directiva y PWA para explicar en la defensa

### Dónde mirar primero

1. `pipes/truncate.pipe.ts`: presentación de texto largo; el componente conserva el booleano de expansión.
2. `pipes/fecha-relativa.pipe.ts`: transform convierte Date/ISO en tiempo transcurrido; la fecha exacta queda en time.datetime/title.
3. `pipes/iniciales.pipe.ts`: iniciales del primer/último nombre para avatar sin foto; fallback FC.
4. `directives/resaltar-autor.directive.ts`: host binding agrega comentario-propio al booleano recibido.
5. `directives/auto-focus.directive.ts`: afterNextRender enfoca el editor recién creado.
6. `directives/permiso-rol.directive.ts`: TemplateRef/ViewContainerRef muestran una plantilla y effect observa el usuario actual.
7. `ngsw-config.json`, `app.config.ts`, `angular.json`, `public/manifest.webmanifest`: qué se guarda, cómo se registra y cómo se presenta la PWA.

Los imports standalone están en PublicacionCard, ComentariosPublicacion y Navbar. HTML conserva bindings; el CSS del comentario define borde/color de resaltado y explica dónde cambiarlo. No hay backend nuevo ni un módulo adicional.

### Ejemplos del código real

```html
<ng-container *appPermisoRol="'administrador'">
  <!-- Enlaces de administración -->
</ng-container>
```

El asterisco es sintaxis estructural: Angular entrega una plantilla. La directiva inserta una vista si AuthService.usuarioActual indica rol permitido/activo, y la retira al cambiar rol/estado o cerrar sesión. No valida permisos en Nest ni llama HTTP. Es como ocultar la puerta de oficina del club en el cartel: la cerradura real sigue en el servidor.

```ts
@Directive({ selector: '[appResaltarAutor]', standalone: true,
  host: { '[class.comentario-propio]': 'appResaltarAutor()' } })
```

La directiva de atributo cambia una clase del elemento existente, sin insertar otra plantilla. ComentariosPublicacion compara autorId con usuario.id. El borde musgo identifica notas propias; puedeEditar y Nest siguen decidiendo si se pueden editar. AutoFocus usa el elemento inyectado y afterNextRender para esperar el textarea; no busca el DOM global ni usa temporizadores.

```html
{{ comentario.createdAt | fechaRelativa }}
```

Un pipe transforma un valor; una directiva transforma presencia/comportamiento. FechaRelativaPipe es puro y no instala un reloj por comentario: al volver a crear la vista o cambiar fecha/ahora se recalcula. Ayer representa 24–48 horas transcurridas. InicialesPipe conserva acentos y usa primera/última palabra. TruncatePipe no modifica el texto de MongoDB ni hace HTTP.

### Recorrido de usuario

El jugador abre una jugada: la tarjeta muestra fecha relativa y, si no hay foto, iniciales. Comentarios propios reciben una clase por la directiva. Al pulsar Editar, @if monta el formulario y AutoFocus enfoca textarea después del render. Cancelar destruye el editor sin PUT. Si cambia el usuario, se actualiza resaltado y la lógica existente cancela una edición que ya no le corresponde. Al entrar un administrador, PermisoRol muestra los enlaces de Usuarios/Estadísticas; un GET manual sigue sujeto a guards de Nest.

En una primera visita online, la PWA descarga estáticos y registra el worker de producción. Al volver al inicio sin conexión, puede mostrar FutbolCrack y explicación/Reintentar; no trae publicaciones ni una sesión del caché. Reintentar vuelve a consultar Nest. No hay promesa de que publicar offline guardó algo. El inicio '/' es el acceso offline previsto; enlaces directos a publicaciones/dashboard quedan fuera del fallback.

### Qué es la PWA y cómo estudiarla

Manifest es la ficha del acceso directo (nombre, iconos, colores, inicio, standalone). Service Worker es un intermediario del navegador, distinto de un servicio Angular inyectable. ngsw-config permite solo index/JS/CSS/manifest/iconos y dataGroups está vacío. Angular genera ngsw.json con hashes. Caché de la interfaz no significa caché de JSON privado ni guardar el JWT, que sigue en cookie HttpOnly.

Instalación: servir build de producción por HTTPS o localhost y usar la opción del navegador cuando esté disponible. `ng serve` de desarrollo no registra este worker. Esperar activación y comprobar Application/Cache Storage, instalación, offline y autenticación con cuentas de prueba; este ensayo está pendiente. Pasos y fuentes oficiales en [07](07-ANGULAR-PWA-PIPES-DIRECTIVAS.md).

### Preguntas del profesor y respuestas

- **¿Son exactamente tres?** Sí: Truncate/FechaRelativa/Iniciales y ResaltarAutor/AutoFocus/PermisoRol. RouterLink/NgClass son de Angular y no cuentan.
- **¿Pipe o directiva?** Formatear fecha: pipe. Enfocar un campo o insertar una plantilla por rol: directiva.
- **¿Dónde se valida el rol de verdad?** En Nest, con JWT y ficha actual; la directiva solo ayuda a presentar opciones.
- **¿Qué se puede hacer offline?** Abrir el shell ya instalado desde raíz y ver la reconexión. Consultar datos, autenticarse y escribir requieren red; no hay colas.
- **¿Qué evita cachear usuarios/estadísticas?** No hay dataGroups ni patrones de URLs; solo archivos estáticos enumerados y fallback limitado. Tests verifican ngsw.json y señuelos privados.
- **¿Cómo se prueban?** Pipes con entradas/límites; directivas con host/DOM y cambios de estado; uso real en componentes; PWA con generador/artefactos y después prueba manual de navegador.
- **¿230 + 11 prueban instalación?** No. 230 son Angular/DOM con HTTP simulado y 11 configuración/build PWA. Instalar/usar worker activo en navegador todavía debe comprobarse.
- **¿Qué reutilizamos de CineBera?** Separación TS/HTML/CSS, bindings y estado visual. Adaptamos comportamiento a autores, rol administrativo y jugadas; el servidor mantiene la autoridad.

## Auditoría 5D — Qué explicar de los arreglos y la entrega

`common/password.ts` de Nest comparte la comparación/hash entre registro y admin. bcrypt considera bytes UTF-8, no letras: muchas letras acentuadas pueden ocupar más espacio. Se rechaza exceso, no se recorta la clave. Angular usa TextEncoder en maximoBytesClaveValidator de registro.validators.ts y la factoría compartida; Nest vuelve a controlar y fija máximo 64 caracteres en el DTO público. La clave no viaja como hash calculado por el navegador y nunca se muestra en la respuesta.

En el DTO, Transform trim se ejecuta antes de IsNotEmpty para nombre/apellido/nombreUsuario. El caso de espacios ahora es 400 de entrada, no 500 de guardado. Como en el club, la recepción debe indicar qué ficha corregir antes de enviarla al archivo.

sesionInterceptor incluía usuarios pero omitía estadísticas: se agregaron esos GET privados. Un 401 invalida identidad; un 403 informa falta de permiso conservando la sesión. Las nuevas pruebas reproducían el problema antes de corregirlo. No se cambió el guard del servidor.

Se retiraron datos/tipo de demo sin uso y una camiseta con apellido ficticio usada como avatar. MiPerfil muestra la ficha real y escudo FC si falta foto. Fixtures de tests siguen existiendo, pero ninguna pantalla productiva los importa. Footer ya no dice Vista de desarrollo.

Para estudiar la evidencia, leer [11-AUDITORIA-FINAL.md](11-AUDITORIA-FINAL.md): 44 filas, fuente/test y diferencia entre inspección, HTTP simulado, artefactos y red real. Para exponer, seguir [12-GUIA-DE-DEMOSTRACION.md](12-GUIA-DE-DEMOSTRACION.md). [sprint-1.md](sprint-1.md) se recuperó como reconstrucción actual, no historia inventada. Se inspeccionaron factoría/registro/tarjeta de CineBera en workspace vecino y se verifican conceptos adaptados, sin afirmar copia literal.

Pregunta de defensa: ¿los tests prueban que la aplicación está completamente integrada? No: Angular 236/236, Nest 275/275 y PWA 11/11 demuestran sus alcances locales. API/pings reales amplían evidencia, pero cookies/upload/admin/PWA/móvil en navegador requieren la matriz manual. Contar pruebas no sustituye comprobar el recorrido del jugador hasta la base.

## Ejemplo real: contador de comentarios junto a Me gusta

La interfaz Publicacion declara cantidadComentarios?: number. La tarjeta lo recibe con su Input publicacion y su plantilla interpola el valor, usando ?? 0 para respuestas antiguas; el texto cambia entre comentario y comentarios. El CSS agrupa ambos totales con flex y flex-wrap para mantenerlos juntos y permitir saltos de línea en móvil.

El panel ComentariosPublicacion usa @Output() totalActualizado = new EventEmitter<number>(). Tras leer la respuesta del servicio ejecuta totalActualizado.emit(this.total). El padre escucha (totalActualizado), llama actualizarTotalComentarios y actualiza el objeto que recibe la tarjeta. Como en CineBera, el hijo comunica un dato mediante evento y el padre coordina lo que se muestra; la tarjeta no necesita HttpClient.

Pregunta de defensa: «¿Por qué no contás los elementos del array de comentarios?». Porque la página inicial solo tiene tres, pero puede haber ocho en MongoDB. El total proviene del backend; el listado de publicaciones también lo calcula por publicación sin descargar todos los textos.
