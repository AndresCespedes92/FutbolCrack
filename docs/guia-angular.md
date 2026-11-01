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
| ¿Se renovó la sesión? | No; el 401 conserva el borrador y explica que debe ingresar. Renovación y TTL quedan para 4C. |
