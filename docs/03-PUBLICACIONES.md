# 03 — Publicaciones

## Estado actual: Sprint 2, Tarea 3A

Las publicaciones nuevas requieren título y descripción y admiten una imagen opcional. GET mantiene el array del feed y su límite previo de 50; no se agregaron paginación, selector de orden, likes o comentarios. DELETE publica una baja lógica protegida por backend, sin botón de eliminación en Angular: la interfaz/modal pertenece a Tarea 3C.

| Capa         | Archivo y método real                                                                                 | Responsabilidad                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Formulario   | frontend/src/app/pages/publicaciones/publicaciones.ts, Publicaciones.publicar/seleccionarImagen       | FormGroup de título, descripción y archivo; mensajes, bloqueo de doble envío y limpieza tras éxito.    |
| Plantilla    | frontend/src/app/pages/publicaciones/publicaciones.html y CSS                                         | Mantiene la estética; agrega campos e imagen y muestra título/descripcion con fallback antiguo.        |
| Transporte   | frontend/src/app/services/publicaciones.ts, PublicacionesService.crear/listar                         | POST FormData con withCredentials; GET público. No fija Content-Type ni permite elegir autorId.        |
| Entrada HTTP | backend/src/publicaciones/publicaciones.controller.ts, PublicacionesController.crear/listar/darDeBaja | POST con imagen opcional, GET y DELETE /publicaciones/:id; AuthGuard en creación y baja.               |
| Validación   | backend/src/publicaciones/dto/create-publicacion.dto.ts, CreatePublicacionDto                         | Textos obligatorios, trim sin conversión de tipos y límites.                                           |
| Negocio      | backend/src/publicaciones/publicaciones.service.ts, PublicacionesService.crear/listar/darDeBaja       | Guardado, adaptación de lecturas antiguas y permisos/actualización atómica de baja.                    |
| Modelo       | backend/src/publicaciones/entities/publicacion.entity.ts                                              | Publicacion, autor referenciado, título/descripcion, alias contenido, multimedia, activo y timestamps. |
| Límites      | backend/src/publicaciones/publicaciones.constants.ts                                                  | Máximo de título 120, descripción 2000 e imagen 5 × 1024 × 1024 bytes.                                 |
| Imágenes     | backend/src/cloudinary/cloudinary.service.ts, CloudinaryService.subirImagen                           | Guarda imagen en carpeta publicaciones; parámetro predeterminado perfiles conserva el registro.        |
| Permisos     | backend/src/usuarios/usuarios.service.ts, UsuariosService.findById                                    | Se reutiliza para obtener el rol real del actor de la baja. No se cambia ese servicio en 3A.           |

PublicacionesModule importa los módulos existentes CloudinaryModule, UsuariosModule y SeguridadModule, además del modelo Mongoose. No se duplicó ningún módulo o servicio.

## Modelo y reglas

- autorId: ObjectId con ref Usuario, obligatorio; siempre se toma del JWT verificado.
- titulo: obligatorio para nuevas publicaciones; 1–120 caracteres después de trim.
- descripcion: obligatoria; 1–2000 después de trim, conservando también la comprobación String.length del servicio.
- contenido: campo de transición, no se elimina. En nuevas publicaciones se asigna desde descripcion una sola vez; no tiene una entrada independiente en el formulario/DTO.
- multimediaUrl: URL HTTPS que devuelve Cloudinary o cadena vacía.
- tipoMultimedia: imagen o ninguno al crear. Se conserva video en el enum para no invalidar posibles datos anteriores, sin implementar carga de video.
- activo: boolean con default true para nuevos documentos.
- createdAt/updatedAt: timestamps de Mongoose; una baja actualiza el documento sin borrar su historia.

El límite 120 del título es una decisión técnica para mantener legible la cabecera; la consigna no fijaba un máximo. Está centralizado en backend y coincide con el formulario Angular. Cambiarlo requiere revisar ambos proyectos y las pruebas.

## Crear una publicación: ejemplo del club

El jugador escribe «Entrenamiento de definición», explica la práctica y elige una foto opcional. Angular valida el formulario y envía FormData con titulo, descripcion y, si existe, imagen. El navegador genera el boundary multipart; el servicio no agrega Content-Type manualmente.

1. AuthGuard verifica la sesión antes de procesar la creación.
2. Multer mantiene temporalmente el archivo en memoria y limita el tamaño.
3. ValidationPipe global valida CreatePublicacionDto. No convierte números u objetos a texto y rechaza propiedades ajenas como autorId o activo.
4. ParseFilePipe valida firma real JPEG, PNG o WebP y tamaño; no basta con un nombre foto.png o MIME declarado.
5. PublicacionesService.crear conserva validación de negocio e id del autor. Si hay imagen, llama a subirImagen(imagen, 'publicaciones').
6. CloudinaryService usa upload_stream con carpeta futbolcrack/publicaciones y devuelve secure_url. Sin imagen no se llama a Cloudinary.
7. El modelo guarda título, descripción, contenido como alias, autorId, activo true y multimedia. Angular muestra éxito, limpia campos/selector y recarga el feed.

Si falla la solicitud, el formulario conserva los datos para reintentar. Los errores de validación, tamaño, conexión y sesión tienen mensajes integrados. No se usa alert.

### Imagen y códigos HTTP

Hasta 5 MiB inclusive: 5.242.880 bytes. La versión instalada de Multer admite ese máximo; MaxFileSizeValidator de Nest compara con `<`, por eso el pipe recibe máximo + 1, con comentario en el código. La prueba del límite exacto comprueba que no se rechace una imagen de 5 MiB.

- 201: creación correcta, con o sin imagen.
- 400: textos/tipos/propiedades inválidos, formato de imagen no admitido o archivo disfrazado.
- 401: falta sesión o JWT no válido.
- 413: archivo mayor que 5 MiB, rechazado antes de subir a Cloudinary.
- 500: fallo controlado de subida o persistencia; no se informa un éxito falso.

Se conserva la protección HTTP de Tarea 2 con un contrato ampliado explícitamente. Las peticiones JSON con titulo y descripcion también pueden crear sin imagen. Una creación antigua que manda solo contenido ahora recibe 400: los campos nuevos son obligatorios. El frontend se adaptó en conjunto. La compatibilidad prometida es de documentos/lectura, no mantener indefinidamente POST sin título.

## Compatibilidad de documentos antiguos

No se ejecutó una migración ni se modificaron datos de Atlas. GET usa lean y normaliza únicamente la respuesta:

| Documento guardado             | Presentación devuelta                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Sin titulo                     | titulo: «Publicación anterior». Es una etiqueta de lectura, no un título escrito a MongoDB.      |
| Sin descripcion, con contenido | descripcion y contenido toman el texto anterior.                                                 |
| Sin activo, o con null antiguo | Se considera visible mientras no tenga activo false; respuesta normaliza el ausente/null a true. |
| activo false                   | Excluido por el filtro `{ activo: { $ne: false } }`.                                             |
| Nuevo con descripcion          | contenido sigue devolviéndose como alias para clientes de lectura anteriores.                    |

El fallback Angular también admite respuestas viejas: titulo opcional y descripcion ?? contenido. La interface Angular mantiene esos campos opcionales para la lectura durante la transición, aunque el DTO de creación los exige.

La baja usa updateOne del estado, no save de todo un documento antiguo; no obliga a inventarle un título para retirarlo. Si se agrega edición futura deberá acordarse una migración o completar datos requeridos. El despliegue del formulario y API debe coordinarse porque el POST anterior ya no cumple el contrato nuevo.

## Baja lógica: retirar un parte de la cartelera

DELETE `/publicaciones/:id` no destruye el papel del club: marca activo false para que deje de verse, conservando documento, autor, fechas e imagen.

1. AuthGuard verifica identidad. Un id de publicación mal formado produce 400.
2. El servicio busca por id y activo distinto de false. Inexistente o ya retirado: 404.
3. UsuariosService.findById obtiene al usuario actual. Si ya no existe: 401.
4. El autor puede retirar su publicación; otro usuario solo puede hacerlo si su rol actual en MongoDB es administrador. Un claim viejo o dato de Angular no concede permiso. Si no corresponde: 403.
5. updateOne vuelve a exigir el mismo id y estado visible, y ejecuta únicamente `$set: { activo: false }`. Si otro proceso ya lo retiró, responde 404. No se usa deleteOne/deleteMany.
6. Responde 200 con «Publicación dada de baja correctamente». GET ya no lo devuelve.

No hay botón, método de baja en el servicio Angular ni solicitud DELETE desde la interfaz. En 3C se deberá implementar el modal propio identificando el elemento, Cancelar/Confirmar, sin enviar nada al cancelar y con mensajes posteriores al resultado.

## Pruebas y límites

Backend: 43 casos HTTP de publicaciones, 2 de schema real sin conexión, 3 del adaptador Cloudinary, más las 11 pruebas anteriores de usuarios/seguridad: 59 aprobadas. Se conservan y actualizan los 18 casos HTTP anteriores para la nueva creación obligatoria. Hay límites de texto, tipos, imágenes válidas/falsas/5 MiB/exceso, subida fallida, roles, 404, carreras y normalización sin mutar el documento antiguo.

Frontend: se conservan 20 pruebas anteriores y se agregan 12 del feed/formulario, total 32 aprobadas: FormData, imagen opcional, inválidos sin POST, errores sin limpiar, éxito y lectura nueva/antigua sin interfaz de baja.

Modelo/guardado MongoDB, usuarios y transporte Cloudinary se simulan en las pruebas HTTP; las de schema validan objetos Mongoose en memoria y el adaptador usa un stream simulado. No se probaron Atlas, Cloudinary real ni Vercel. No se crearon ni retiraron publicaciones reales.

Si Cloudinary sube y después falla save, puede quedar una imagen huérfana: no se agregó compensación/borrado remoto en esta tarea. La baja no borra imágenes a propósito. Likes, paginación, filtro de usuario, orden selectable, comentarios, tarjeta real Input/Output, truncado y modal de 3C siguen pendientes.

## Tarea 3B — Contrato vigente: likes, filtros y páginas

Esta sección reemplaza la descripción del GET de 3A (array con límite 50). La creación, imágenes y baja lógica mantienen su comportamiento. El GET ahora usa aggregate en lugar de find/lean; la normalización antigua sigue siendo solo de lectura.

### Un voto por socio

Como una lista de socios que apoyan una jugada, Publicacion.likes guarda ObjectId de los usuarios. Su longitud es cantidadLikes; meGusta indica si contiene al lector autenticado. No hay contador persistido que pueda quedar desfasado ni índice unique sobre el array: ese índice impediría que un socio votara publicaciones distintas.

POST /publicaciones/:id/likes devuelve 201 y DELETE /publicaciones/:id/likes devuelve 200. Ambos devuelven `{ mensaje, cantidadLikes, meGusta }`. AuthGuard existente verifica JWT/cookie y el controller utiliza exclusivamente sub, nunca un usuarioId del body. El servicio verifica además que ese usuario exista actualmente.

cambiarMeGusta ejecuta findOneAndUpdate sobre id y activo distinto de false. Para agregar exige likes distinto del actor y usa `$addToSet`; para quitar exige que el array contenga al actor y usa `$pull`. Filtro y escritura son una sola operación atómica del documento: ocho solicitudes de alta del mismo socio no generan ocho votos. Quitar no afecta los votos de otros socios y permite votar nuevamente después.

Respuestas: 400 id mal formado; 401 sin JWT válido o usuario eliminado; 404 publicación inexistente/inactiva; 409 voto repetido o intento de quitar un voto propio inexistente. Si la actualización no encuentra coincidencia, una segunda consulta distingue ausencia de publicación y conflicto. Esa consulta diagnóstica no es una transacción; si cambia el estado entre ambas lecturas, el diagnóstico refleja el estado observado entonces. No se anuncia un éxito sin actualización.

### GET /publicaciones

| Parámetro | Regla |
| --- | --- |
| orden | fecha (predeterminado) o likes, descendentes. |
| usuarioId | Opcional: ObjectId válido del autor que se quiere consultar; no identifica al lector. |
| offset | Entero decimal no negativo; default 0, máximo Number.MAX_SAFE_INTEGER. |
| limit | Entero decimal entre 1 y 100; default 10. El feed actual pide el valor predeterminado. |

El DTO rechaza con 400 valores vacíos, negativos, fracciones, notación exponencial, límites excesivos, arrays y campos ajenos. Se reutiliza ValidationPipe global. El máximo técnico 100 es una decisión local; permite consultar tres publicaciones de un perfil sin imponer diez a toda consulta.

Ejemplo de contrato (ids y fechas ilustrativos):

```json
{
  "publicaciones": [{ "_id": "000000000000000000000023", "titulo": "Entrenamiento", "descripcion": "Trabajo de pases", "contenido": "Trabajo de pases", "cantidadLikes": 2, "meGusta": true }],
  "total": 23,
  "offset": 0,
  "limit": 10,
  "hayMas": true
}
```

El ejemplo abrevia los campos de una publicación; también se mantienen autorId poblado con datos públicos, multimedia, activo y timestamps. total cuenta todos los documentos filtrados, no solo los de la página; hayMas compara offset + cantidad recibida con total. Un offset posterior al final devuelve array vacío y conserva el total.

Con 23 partes del club, offset 0/10/20 y limit 10 devuelven 10/10/3. Offset significa cuántos registros omitir, no el número de página. Para la página numerada n: `(n - 1) * 10`. Es paginación backend: MongoDB devuelve solo la página y Angular no descarga 23 para recortar diez.

listar aplica `$match` por estado/autor antes de paginar, calcula cantidadLikes con `$size/$ifNull` y meGusta con `$in`, luego `$facet` calcula página y total del mismo filtro. El orden por fecha desempata con `_id` descendente; por likes usa cantidadLikes, createdAt y finalmente `_id`, todos descendentes. Después se resuelven solo los autores de esa página con populate y selección pública. El GET no expone el array de votantes.

GET sigue público. AutenticacionOpcionalGuard delega al AuthGuard existente: si el JWT es válido aporta sub; sin sesión, con JWT inválido o vencido permite lectura anónima con meGusta false. No renueva cookies ni modifica el mecanismo JWT. POST/DELETE conservan autenticación estricta. usuarioId en query jamás se usa como identidad para votar.

### Compatibilidad y consumo Angular

Documentos sin likes cuentan cero; `$addToSet` crea el array ausente al primer voto. No se migran ni reescriben documentos al leer. Se conservan título de lectura «Publicación anterior», descripcion/contenido y activo ausente considerado visible. La estrategia presupone arrays válidos o campo ausente en datos existentes; no repara documentos manualmente corruptos.

El servicio Angular tipa parámetros y respuestas, usa HttpParams y conserva withCredentials. cargarPublicaciones toma respuesta.publicaciones y guarda metadatos para 3C. crear sigue enviando FormData con imagen opcional. El nuevo sobre GET es un cambio de contrato: API y frontend deben integrarse/desplegarse coordinadamente. Un cliente antiguo que espere un array requiere adaptación.

No se agregaron controles visuales de likes, filtros o páginas. El feed muestra sus primeros diez resultados; navegar visualmente y usar la tarjeta Input/Output corresponde a 3C. Tampoco se modificaron HTML/CSS, perfil demo, comentarios ni modal de baja.

### Cómo estudiar y probar

1. Leer ListarPublicacionesDto para entender valores predeterminados, Transform y decoradores de validación.
2. Seguir controller.listar y AutenticacionOpcionalGuard: diferenciar identidad del lector y filtro de autor.
3. Leer el pipeline de listar: filtro → campos derivados → orden/skip/limit y total → populate → normalización.
4. Seguir darMeGusta/quitarMeGusta hasta cambiarMeGusta: comprobar las condiciones antes de la actualización atómica.
5. Consultar servicios/publicaciones.ts de Angular: Observable tipado y HttpParams; luego cargarPublicaciones y su suscripción.
6. Ejecutar las suites de [08](08-PRUEBAS-Y-DESPLIEGUE.md). Los fixtures crean 23 registros y verifican 10/10/3, autor, empates, cookies, invalidaciones y concurrencia simulada.

Conceptos: referencias ObjectId, DTO/transformación/validación, inyección de dependencias, guards reutilizados, operaciones atómicas, agregación, paginación y contratos TypeScript/Observable. Se conserva el patrón de servicios y formularios conocido de CineBera; el listado incorpora metadatos propios de FutbolCrack.

¿Por qué no sumar un contador aparte? Porque el array ya determina el total y evita mantener dos fuentes de verdad. ¿Por qué desempatar por id? Dos partes pueden tener la misma fecha y los mismos votos. ¿Por qué no filtrar después de paginar? Se perderían partes del autor y el total sería incorrecto.

### Límites y pendientes

El array es sencillo y adecuado al alcance académico. Crece dentro del documento (límite BSON de 16 MiB); ordenar por una cantidad calculada requiere procesar coincidencias y no aprovecha directamente un índice de contador. `$facet` y sus resultados también tienen límites de memoria/documento. Si el volumen lo exige, evaluar colección de votos e índices en una tarea posterior, sin agregarla ahora.

Los desempates estabilizan un conjunto sin cambios; offset no ofrece una instantánea entre solicitudes si otros publican o votan. Las pruebas de concurrencia usan un doble que modela el operador atómico y verifican el filtro/update enviado; no sustituyen un ensayo concurrente contra MongoDB real. Pendientes Atlas/Cloudinary, comprobación de consultas/datos reales, despliegue coordinado y UI 3C. La posible imagen huérfana si falla save después de subir sigue pendiente de 3A.

Resultado actual: frontend 35/35 en 5 suites, backend 95/95 en 6 suites, ambas compilaciones correctas. Se conservan todos los casos anteriores.

## Sprint 2, Tarea 3C — Usar la cartelera y el perfil

Esta sección actualiza los pendientes de interfaz de 3A/3B. Se mantuvo la paleta negro/verde musgo/gris, radios compartidos y distribución general. No se modificaron backend, JWT, cookies ni contrato HTTP.

### Padre, hijo y servicio: problema y recorrido

Publicaciones y MiPerfil son contenedores (padres). PublicacionCard es una ficha reutilizable (hijo) de una jugada. Como en CineBera, la pantalla obtiene datos y los entrega a una tarjeta: Input baja información y Output sube una intención. Así se presenta la misma jugada sin copiar el marcado ni hacer peticiones desde cada hijo.

```html
<app-publicacion-card [publicacion]="publicacion"
  [autenticado]="!!usuario"
  [puedeDarBaja]="acciones.puedeDarBaja(publicacion, usuario)"
  [procesando]="acciones.pendientes().has(publicacion._id)"
  (cambiarLike)="acciones.alternarLike($event, usuario, cargarTrasAccion)"
  (solicitarBaja)="acciones.solicitarBaja($event, usuario)" />
```

PublicacionCard recibe autor/foto/fecha/título/descripcion o contenido anterior, imagen, cantidadLikes y meGusta. Emite cambiarLike, solicitarBaja y abrirDetalle, siempre con la publicación. No conoce HttpClient. abrirDetalle solo se habilita si detalleDisponible es true; hoy permanece false por falta del detalle Sprint 3.

AccionesPublicaciones se registra en providers de cada pantalla: la implementación se comparte, pero mensaje/modal/pendientes de una pantalla no contaminan la otra. Sus signal guardan estado reactivo; la plantilla lee mensaje(), error() o pendientes(). El servicio HTTP PublicacionesService conserva la comunicación con Nest.

Recorrido de un voto: clic → Output de la tarjeta → alternarLike del servicio de acciones del contenedor → POST/DELETE :id/likes con cookies → AuthGuard y servicio Nest → actualización atómica MongoDB → mensaje → recarga de la página actual. La recarga recupera cantidad y estado reales, y mantiene el orden por popularidad consistente; no se suman números optimistas. Durante la solicitud, el Set de IDs pendientes impide otro pedido para esa publicación y su botón queda deshabilitado.

Un 401 explica sesión vencida, 403 falta de permiso, 404 publicación no disponible, 409 conflicto de voto, y red/servidor permiten reintentar con mensajes comprensibles. Un 409/404 de like vuelve a consultar la página para sincronizar. Si el voto tuvo éxito y falla la recarga, se conserva el mensaje del voto confirmado y se muestra el error de lectura; no se inventan datos nuevos.

El feed consulta /auth/me para decidir visibilidad sin leer la cookie HttpOnly. Sin sesión sigue siendo público y deshabilita likes; un error distinto de 401 informa que no se pudo comprobar sesión. Esto no cambia JWT, TTL ni política de cookies. La autorización definitiva siempre permanece en NestJS.

### Paginación y orden

La pantalla solicita siempre limit 10. La página n envía offset `(n - 1) * 10`. MongoDB aplica filtro/orden/skip/limit y devuelve `{ publicaciones, total, offset, limit, hayMas }`; Angular solo renderiza el array de esa página. No se descarga todo para recortarlo.

Con 23 jugadas: página 1 recibe diez, página 2 diez y página 3 tres. Se muestran Anterior/Siguiente y hasta cinco números cercanos; si corresponde, también primera/última con puntos suspensivos. aria-current identifica la página actual y los controles se bloquean durante la carga. Más recientes usa orden fecha; Más populares usa likes y vuelve a offset 0. El alta también regresa a la primera página para consultar la cartelera actualizada.

cargarPublicaciones cancela la lectura anterior con Subscription antes de reemplazarla y usa takeUntilDestroyed al abandonar la pantalla. Esto evita que una respuesta vieja pise una nueva página. Estados: carga, error con Reintentar, vacío y contenido. Si una baja deja vacía la página 3, calcula el último offset existente y lo consulta: no deja al usuario en una página vacía cuando aún hay publicaciones.

### Baja con confirmación propia

El botón solo aparece para autor o administrador según los datos de /auth/me. Esa condición es presentación; el servidor vuelve a verificar el rol actual y la propiedad.

1. solicitarBaja guarda la publicación seleccionada, sin enviar HTTP.
2. La plantilla crea ConfirmacionBaja; dialog.showModal abre un modal nativo con diseño propio, nombre de la publicación, explicación, Cancelar y Confirmar.
3. Cancelar o Escape emiten cancelar y no ejecutan DELETE. Cancelar recibe foco inicial; el diálogo modal nativo limita la navegación al contenido modal.
4. Confirmar llama a confirmarBaja; recién entonces PublicacionesService.darDeBaja envía DELETE /publicaciones/:id con cookies. Durante la espera se bloquean confirmación, cancelación y Escape para impedir acciones ambiguas o duplicadas.
5. Solo después de 200 se cierra el modal, se muestra «Publicación dada de baja correctamente» y se consulta el listado. No se vuelve a presentar el documento inactivo.
6. Un rechazo mantiene el modal con el error y permite cancelar o reintentar. Al cerrar se restaura foco al disparador si todavía existe; después de una recarga que reemplaza la tarjeta ese disparador puede desaparecer.

No se utiliza alert ni window.confirm. La eliminación sigue siendo lógica en Nest/MongoDB y conserva documento/imagen como en 3A.

### Texto largo y datos antiguos

TruncatePipe es un pipe puro propio: recibe texto, límite (280) y expandido. La tarjeta usa `descripcion | truncate: limiteTexto : expandido`; Ver más/Ver menos cambia únicamente el estado local. aria-expanded y aria-controls relacionan el botón con el párrafo. No hay innerHTML ni edición del texto persistido. Este pipe cuenta una vez para los tres de S4; faltan los otros dos.

Sin título se muestra «Publicación anterior», sin descripcion se usa contenido, autor ausente usa «Usuario no disponible», sin foto usa FC, sin cantidadLikes usa cero. Las publicaciones inactivas no permiten acciones incluso si llegan a la tarjeta. Creación con FormData, imagen opcional y validaciones se conserva y sigue cubierta por sus pruebas previas.

### Mi Perfil y comentarios pendientes

cargarMiPerfil obtiene usuario real y luego cargarPublicaciones consulta `{ usuarioId: usuario.id, orden: 'fecha', offset: 0, limit: 3 }`. El backend filtra al autor antes de limitar y devuelve hasta tres publicaciones, presentadas con la misma tarjeta. Se mantienen los datos e imagen de la ficha y el cierre de sesión existentes. El estado/error de publicaciones es independiente del perfil: un fallo de la cartelera no borra los datos del jugador.

Se retiró PUBLICACIONES_DEMO de esta pantalla; no se inventan likes, jugadas ni autores. El requisito de últimas tres queda implementado; **sus comentarios siguen pendientes de Sprint 3** (modelo/endpoints, carga 3 en 3 y edición propia). Se muestra una nota temporal, sin contador falso, formulario paralelo ni consulta a un endpoint inexistente. Los archivos demo permanecen como material histórico sin uso en estas pantallas.

### Pruebas y edición manual

El mapa de archivos está en 00 y la [guía Angular](guia-angular.md) incluye ejemplos y preguntas de defensa. Los CSS explican radio/padding, colores de estados, fotos y reglas móviles; para ajustar todas las tarjetas se cambia publicacion-card.css, no el feed por separado. La paleta/radios globales de styles.css se reutilizan sin modificarlos.

Las pruebas DOM/HTTP locales cubren renderizado, los tres Outputs, bloqueo, expansión, diez registros/páginas, orden, modal/cancelación/errores, última página tras baja y perfil real. Ver ejecución y límites en 08. El comportamiento modal nativo, aspecto en distintos dispositivos y ciclo con Atlas/Cloudinary/cookies reales deben verificarse en navegador/entorno de ensayo: JSDOM no demuestra esos puntos.
