# 08 — Pruebas y despliegue

## Estado actual — Sprint 3, Tarea 4C (01/11/2026)

Inicio limpio en main 0d94da5 (merge de 4B ya confirmado por el usuario). Antes de modificar: ambas compilaciones salida 0, frontend 97/97 (13 suites) y backend 162/162 (8 suites, en serie). No había cambios para respaldo y no se hizo un commit vacío. Se creó feature/renovacion-sesion desde esa base. Sin commits nuevos, merge ni deploy.

| Comando | Resultado final |
| --- | --- |
| frontend: npm run build | Salida 0, sin advertencias CSS. |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 138/138 aprobadas, 18 suites. Conserva 97 y agrega 41. |
| backend: npm run build | Salida 0. |
| backend: node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads | 187/187 aprobadas, 10 suites. Conserva 162 y agrega 25. |

No se instalan dependencias, cambian timeouts/scripts/presupuestos ni se omiten tests. La ejecución backend en serie con forks pasó 187/187 al principio; una repetición terminó con cierre inesperado de worker (177/187 contabilizados, sin aserción fallida). La suite completa se repitió aislada con pool threads y pasó 187/187 sin errores no controlados. Se conserva el historial de limitaciones del entorno, no se presenta el cierre del worker como una prueba aprobada.

### Cobertura backend nueva: 25 casos

18 HTTP con AuthController/AuthService/AuthGuard, firma y verificación JWT, bcrypt, cookie y middleware de origen reales; se simulan UsuariosService y Cloudinary para no abrir Atlas. Comprueban login JWT de 900 segundos, cookie alineada al exp, autorizar sin renovar, rol actual desde MongoDB, ausencia de cookie/Bearer no sustituto, JWT vencido/inválido, usuario eliminado, renovación voluntaria válida y rechazo durante/tras vencimiento, cookie antigua de 20 segundos, HttpOnly/Secure/None de producción y logout, credenciales incorrectas/GET me, origen ajeno/null/ausente y Referer permitido.

Siete casos adicionales del middleware: GET/HEAD/OPTIONS, cookies sin origen rechazadas, Bearer sin cookie compatible, null/Referer mal formado rechazados y FRONTEND_URL exacto.

Se usan relojes simulados de Date en HTTP (sin detener sockets/timers del servidor), no esperas de quince minutos. **Usuario deshabilitado no está probado ni implementado:** el modelo no tiene un campo de habilitación. Hay una comprobación explícita de esa limitación, sin fingir que usuario inexistente cubre deshabilitado. No se agrega un estado de Sprint 4.

### Cobertura frontend nueva: 41 casos

- 16 de AuthService con reloj simulado: recuperación/cache/sin token almacenado, solicitud compartida, aviso a diez minutos, recarga con plazo remanente, Ahora no, renovación/reinicio de timers, no renovar vencido, error transitorio/401, suspensión/focus, desfase servidor, logout correcto/fallido, limpieza al destruir y descarte de respuesta vieja.
- 12 del interceptor: 401 protegido en me/refrescar/usuarios/escrituras, 403/500 sin cerrar sesión, login/autorizar excluidos y otra API/URL relativa no interceptadas.
- Ocho de App: spinner, continuidad de ruta, login por inválida, login/registro públicos, error/reintento, modal/renovación/error, Ahora no y una sola autorización compartida raíz/guard.
- Dos de ExtenderSesion: Outputs, tiempo/estado visible y Escape/bloqueo.
- Tres de Login: recuperación desde metadatos, vuelta al detalle interno, destino externo rechazado y credenciales incorrectas sin borrar formulario (tres casos: retorno, externo y error).

Se conserva la suite de navegación anterior y se adapta el guard a POST autorizar/caché sin GET me duplicado. La expectativa de redirección incorpora el returnUrl nuevo. La primera regresión pasó 96/97: fallaba solamente esperar /login en lugar de /login?returnUrl=%2Fmi-perfil. Se corrigió la expectativa al contrato nuevo, conservando la comprobación exacta de destino.

Un primer build backend detectó una llave sobrante durante la edición de AuthController; se corrigió antes de ejecutar la suite ampliada. Los builds finales completos pasan. No se relajaron comprobaciones de autenticación, permisos o seguridad para aprobar.

### Límites y ensayo pendiente

Las pruebas HTTP no montan el AppModule con conexión productiva ni prueban Vercel/Atlas/Cloudinary. Sí montan el middleware de origen nuevo en las pruebas de sesión. Angular usa HttpTestingController y rutas/componentes reales o pantallas de prueba para aislar arranque; no toca la API externa. El dialog de JSDOM usa el doble existente: no valida capa modal/foco inicial nativos ni aspecto en dispositivos.

Antes de validación final: desplegar conjuntamente endpoints/metadatos/interceptor, verificar FRONTEND_URL exacto, HTTPS, Set-Cookie/credenciales y restricciones de cookies de terceros en navegador. Recargar una URL de detalle con sesión válida e inválida, esperar/simular aviso a diez minutos, probar Ahora no, renovar vigente, rechazar vencido, restaurar pestaña suspendida, logout y 403 de una baja ajena sin perder sesión. Un cliente HTTP manual de sesión debe enviar Origin/Referer permitido; sin él obtiene 403 por CSRF antes de autenticación.

Pendiente del modelo: habilitación de usuarios y su prueba real. Pendiente externo: navegador/cookies/CORS/BD/modal/suspensión reales. No hay revocación persistente ni refresh tokens: logout borra cookie, no invalida una copia de JWT aún vigente. El reloj de UI es orientativo; el backend impone exp. Estos límites impiden declarar validación productiva o cierre total del TP a partir de las suites locales.

## Historial — Sprint 3, Tarea 4B (01/11/2026)

Base: feature/comentarios-backend con los 20 archivos de 4A pendientes esperados, HEAD 9224cad. Antes de guardar se repitieron ambas compilaciones (salida 0), FE 60/60 en 10 suites y BE 157/157 en 8 suites con archivos en serie. Se creó el respaldo autorizado **70622bb**, «feat(comentarios): agregar backend con paginacion y edicion propia», y luego feature/comentarios-interfaz. No hay commit de 4B, merge ni deploy.

| Comando | Resultado final |
| --- | --- |
| frontend: npm run build | Correcto, salida 0 y sin advertencias CSS. |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 97/97, 13 suites; conserva las 60 anteriores y agrega 37. |
| backend: npm run build | Correcto, salida 0. |
| backend: node node_modules/vitest/vitest.mjs run --no-file-parallelism | 162/162, 8 suites; conserva 157 y agrega cinco del GET individual. |

Se utiliza el mismo Vitest instalado, con archivos en serie por los cierres de workers observados en 4A; no se modifican scripts, timeouts, configuración o dependencias. No se omiten ni deshabilitan tests.

### Cobertura y ajustes

- 23 casos de ComentariosPublicacion: tres iniciales, anexado 3/3/2, doble carga, deduplicación con offset por recibidos, error/reintento sin borrar, alta tras dos páginas reiniciando offset 0, vacíos/longitud/UTF-16, errores POST/PUT sin perder texto, identidad propia frente a admin ajeno/visitante, edición/cancelación/modificado, 404 con Output al padre, Input de nueva publicación y TruncatePipe/autor ausente.
- Tres casos de ComentariosService: GET con offset/limit 3, POST y PUT solo con texto, cookies y respuestas reales de 4A.
- Ocho casos de PublicacionDetalle: URL directa y navegación desde Output de tarjeta, descripción completa, imágenes/likes/comentarios, visitante, 404/inactiva/id inválido, error/reintento, documentos antiguos y cambio de id.
- Un caso adicional de PublicacionCard para texto completo, uno de PublicacionesService para GET individual y uno de MiPerfil para comentarios asociados a las tres jugadas. Se amplía el test de like del perfil para comprobar conservación de borrador durante recarga.
- Cinco casos backend nuevos: detalle autenticado con flag de like/consulta por id, lectura anónima, ausente/inactiva e id inválido. El doble de aggregate ahora también respeta `_id`; los casos anteriores se mantienen.

Las pruebas antiguas de app/perfil se actualizan para esperar los GET reales nuevos de comentarios y comprobar que ya se muestra la sección, en lugar de la nota temporal. El helper verifica offset 0/limit 3; no simula publicaciones o comentarios en código productivo.

Primer intento con las 60 pruebas previas: 59/60; formatear la interpolación multilinea agregó espacios de plantilla al texto de la tarjeta. Se corrigió la plantilla con binding textContent al resultado del pipe, manteniendo las aserciones exactas previas (incluidos espacios del contenido), sin recortar datos ni debilitar el test. La suite ampliada pasó luego 97/97.

La compilación final detectó que el helper nuevo de tests usaba expect en un archivo .ts incluido en la revisión de tipos productiva. Se reemplazó por una comprobación explícita que arroja Error si los parámetros son incorrectos; no se agregaron globals de Vitest al proyecto productivo ni se relajó la condición. Tras ese ajuste y preservar borradores en Mi Perfil, build y suite completa pasan nuevamente.

### Qué se verificó y qué no

Angular utiliza HttpTestingController y RouterTestingHarness con rutas/componentes/servicios reales y HTTP interceptado; no envía solicitudes a Vercel/Atlas/Cloudinary. La prueba de ruta desde tarjeta sí dispara el Output y espera la navegación real del router. Los tests del perfil comprueban consultas independientes/acotadas por cada id.

Nest mantiene controllers, validaciones, guards y servicios reales con modelos/ejecución MongoDB simulados; el nuevo detalle comparte consulta del listado. Los esquemas Mongoose se validan en memoria. No se comprobó persistencia/timestamps/índices contra base real, cookie/CORS con navegador, capa modal nativa o apariencia en dispositivos. No se realizó despliegue ni ensayo visual manual en navegador.

Pendiente antes de integración externa: backend con 4A y GET /publicaciones/:id, frontend con ruta/servicios nuevos, sesión válida; probar una URL directa, publicación activa/inactiva/antigua, ocho comentarios (3/6/8 visibles), alta tras cargar dos páginas y edición propia/403 ajeno. Verificar en perfil las tres jugadas y sus comentarios, borradores al votar y cancelación de baja. La URL de API continúa apuntando al Vercel existente: su versión desplegada no se verificó. TTL JWT previo de 20 segundos conservado; renovación/avisos/redirección global pertenecen a 4C.

## Historial — Sprint 3, Tarea 4A

Inicio limpio en main, HEAD 9224cad (merge de la interfaz 3C, ya guardada por el usuario). Se verificaron los cambios existentes antes de programar: frontend 60/60 en 10 suites, backend 95/95 en 6 suites al repetir su ejecución, ambas compilaciones salida 0 y sin aviso CSS. No hacía falta otro commit de respaldo y no se creó uno vacío. Nueva rama feature/comentarios-backend, sin commits nuevos, merge ni deploy.

| Verificación | Resultado final |
| --- | --- |
| frontend: npm run build | Correcto, salida 0, sin advertencias CSS. |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 60/60, 10 suites; fuentes/pruebas frontend sin cambios. |
| backend: npm run build | Correcto, salida 0. |
| backend: node node_modules/vitest/vitest.mjs run --no-file-parallelism | 157/157, 8 suites; suite completa sin paralelizar archivos. |

Se conservan las 95 pruebas backend anteriores y se agregan 58 HTTP de comentarios y 4 de schema. No se eliminan, omiten ni deshabilitan casos, no cambian timeouts ni configuración del runner. El comando directo ejecuta el mismo Vitest de npm test con todos los archivos, limitando concurrencia de archivos para esta comprobación.

### Incidencias del entorno y correcciones de pruebas

1. Antes de modificar fuentes, npm test terminó con un worker inesperadamente cerrado (5/6 archivos, 35/95 tests contabilizados). La repetición aislada de npm test pasó 95/95. No se atribuyó ese cierre a una aserción productiva.
2. La primera suite ampliada contabilizó 79 aprobados y un fallo nuevo (156 previstos en ese momento), más otro cierre inesperado de worker. El fallo propio era construir dos solicitudes Supertest sobre un servidor temporal antes de completar la primera: al cerrarse su puerto, la segunda obtenía address null. Se corrige la prueba construyendo/esperando cada solicitud en secuencia. No se toca producción ni se debilita la comprobación de 401.
3. Se agregó además el caso de 501 emojis fuera del plano básico para comprobar el límite final String.length (1002 unidades UTF-16), por lo que el total final es 157.
4. npm test -- --no-file-parallelism fue rechazado por el wrapper npm con EUNKNOWNCONFIG antes de ejecutar tests. Se llamó directamente a node node_modules/vitest/vitest.mjs run --no-file-parallelism; toda la suite pasó 157/157 sin errores no controlados. Es una limitación observada de ejecución local; npm test y sus archivos/configuración no se modificaron.

### Alcance de las pruebas nuevas

HTTP local importa el ComentariosModule real con sus dependencias y comprueba imports/exports del modelo Publicacion. Solo se reemplazan conexión/modelos MongoDB, UsuariosService y transporte Cloudinary; AuthGuard, JwtService con secreto exclusivo de tests, controller, DTO, ValidationPipe y ComentariosService son reales. No se inicia AppModule productivo ni se lee .env. El middleware de origen/CORS del arranque productivo no forma parte de este servidor de pruebas.

Cobertura: 201 válido con texto recortado y referencias, máximo 1000, cookie, vacíos/tipos/propiedades/fechas ajenas rechazados, token ausente/inválido/vencido/sin sujeto/usuario eliminado, publicación ausente/inactiva/antigua, listado público y filtrado de 8 como 3/3/2, desempates por id, total/vacío/offset posterior, autor mínimo o null, queries e ids inválidos, máximo técnico 100, edición propia, modificado/fechas, mismo texto sin alterar orden, 403 a usuario/admin ajeno, PUT obligatorio, pérdida de comentario antes de update y ausencia de DELETE.

Cuatro pruebas con schema Mongoose real validado en memoria comprueban referencias requeridas/default false, trim/texto, máximo, timestamps, inmutabilidad e índice. Los modelos HTTP simulan las fechas que Mongoose asignaría en save/update; verificar la configuración del schema y el contrato HTTP no sustituye una escritura real para comprobar timestamps. La ejecución de aggregate y populate se simula inspeccionando filtros, etapas y selección enviada.

### Ensayo externo pendiente

En base de ensayo: crear una publicación activa y ocho comentarios, pedir offsets 0/3/6; comprobar 3/3/2, total 8 y datos públicos. Editar como autor, repetir como usuario/admin ajeno, retirar la publicación y comprobar 404 en alta/listado/edición propios; probar una publicación antigua sin activo. Verificar fechas/índice/plan de ejecución y ausencia de hashes directamente en respuestas reales. Probar además el recorrido con middleware de origen, cookie y JWT válido (duración previa 20 segundos conservada).

No se conectó Atlas, Cloudinary ni Vercel; no se crearon comentarios reales ni se probó Angular de comentarios, que queda para otra tarea. Las ventanas de concurrencia entre publicación/comentario y entre páginas offset están documentadas en [04](04-COMENTARIOS.md). No se garantiza atomicidad entre colecciones mediante esta implementación.

## Historial — Sprint 2, Tarea 3C

Antes de cambiar archivos se revisaron rama/estado y se repitieron ambas compilaciones y suites: frontend 35/35 (5 suites), backend 95/95 (6 suites), builds salida 0. El aviso inicial era CSS feed 4,88 KB / presupuesto 4 KB (+877 bytes). Los 19 archivos pendientes coincidían con 3B y se guardaron, según autorización de esta consigna, en el commit local 71c0525, «feat(publicaciones): agregar likes y listado paginado». Después se creó feature/publicaciones-interfaz. No se confirmó 3C, hizo merge ni deploy.

| Comando | Resultado final 3C |
| --- | --- |
| frontend: npm run build | Correcto, salida 0, sin advertencia CSS. No se aumentaron presupuestos. |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 60/60 aprobadas, 10 suites: conserva 35 y agrega 25. |
| backend: npm run build | Correcto, salida 0; fuentes backend sin cambios. |
| backend: npm test | 95/95 aprobadas, 6 suites. |

Se agregan 4 casos de tarjeta, 3 del pipe, 2 del modal, 12 de interacción del feed y 4 de Mi Perfil. Los casos previos de navegación/formulario no se omiten: sus expectativas ahora comprueban consultas paginadas, sesión para acciones visibles y perfil real sin material demo. PublicacionesService conserva sus tres casos anteriores; solo se actualiza un comentario de alcance.

### Causas de los ajustes durante la verificación

- Primera ejecución: 45/60. JSDOM no define showModal/close; los dos tests de modal y doce de interacción fallaban antes de ejecutarse. Se agregó testing/dialog-prueba.ts para suplir exclusivamente esas APIs ausentes y restaurar sus descriptores al terminar; no se modificó el modal productivo para fingir soporte. El otro fallo era un título con espacios de plantilla: se normaliza whitespace con trim antes de comparar texto.
- Segunda ejecución: 58/60. Faltaba notificar inmediatamente el estado de carga y una prueba intentaba cambiar usuario fuera del recorrido de sesión Angular. Se agregó markForCheck al inicio de cargas del contenedor y se revisó la simulación de permisos.
- Tercera ejecución: 59/60. La mutación directa de usuario del fixture no reproducía la actualización real de sesión. Se reescribió ese caso reabriendo la pantalla y respondiendo GET /auth/me como usuario ajeno, administrador y visitante. Mantiene las aserciones de visibilidad/permisos y usa el camino real de la aplicación. No se relajaron aserciones ni se elevaron timeouts.
- La suite final completa pasa 60/60. El CSS pasó inicialmente a 4,21 KB al agregar controles y trasladar tarjetas; se quitaron selectores sin uso y reglas duplicadas con styles.css. El build final ya no emite presupuesto excedido.

### Qué se comprobó y qué sigue pendiente

Se probaron Inputs/los tres Outputs, renderizado de datos reales y antiguos, pipe y Ver más/menos, bloqueo de doble voto, cambio visual de cantidad/estado tras POST/DELETE y recarga, mensajes 401/409/500, permisos de autor/admin/visitante, navegación 1/2/3 con offset 0/10/20 y limit 10, orden likes volviendo al inicio, estados de carga/error/vacío, apertura/cancelación/confirmación del modal, doble confirmación bloqueada, rechazo 403 y retorno desde última página vacía. Mi Perfil comprueba filtro usuarioId real, fecha/limit 3, foto/datos del usuario, vacío/error/reintento y like compartido.

Los tests Angular usan HttpTestingController: no envían solicitudes a Vercel, Atlas ni Cloudinary. Los del backend mantienen los dobles/alcance de 3B. El doble de dialog verifica eventos y estado, no prueba la capa superior del navegador ni su navegación/foco inicial nativos. No se realizó ensayo manual visual en navegador o dispositivo ni integración con servicios externos.

Antes de integrar en entorno real: probar con API que incluya 3A/3B (la URL Angular sigue apuntando al backend Vercel existente), comprobar cookie/CORS, votar/quitar, probar autor/admin/ajeno, cancelar/confirmar con teclado y recorrer 23 publicaciones en escritorio/móvil. Verificar efecto de popularidad al votar y perfil con más de tres publicaciones. El JWT de 20 segundos preexistente puede expirar durante el ensayo: no se modificó su duración ni renovación. Comentarios/detalle siguen pendientes Sprint 3; no confundir esa falta de alcance con pruebas aprobadas del resto.

## Historial — Sprint 2, Tarea 3B

Rama feature/publicaciones-likes-paginacion, creada desde feature/publicaciones-modelo en 7b740f4 (commit existente «fix publicaciones»). El árbol estaba limpio y 3A ya estaba confirmado por el usuario: no se creó un commit vacío de respaldo. No se realizaron commits nuevos, merge ni deploy.

| Verificación | Antes (3A) | Después (3B) |
| --- | --- | --- |
| frontend: npm run build | Salida 0 | Salida 0 |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 32/32, 4 suites | 35/35, 5 suites |
| backend: npm run build | Salida 0 | Salida 0 |
| backend: npm test | 59/59, 6 suites | 95/95, 6 suites |

Advertencia existente: publicaciones.css pesa 4,88 KB, presupuesto 4 KB, excedente 877 bytes. No se modificaron CSS ni presupuestos. Las suites completas se ejecutaron fuera del sandbox para evitar las limitaciones temporales/procesos del entorno; no se instalaron dependencias.

Se agregaron 36 casos HTTP backend (10 de likes y 26 de listado) y 3 de servicio Angular. Los casos previos se mantienen; las expectativas antiguas de array se adaptan al nuevo sobre paginado. Schema agrega comprobaciones de likes sin cambiar su número de casos.

Cobertura nueva: identidad JWT frente a body ajeno; usuario ausente; add/remove propio; duplicado/conflicto; ocho altas concurrentes (una 201 y siete 409); votos de distintos usuarios; publicaciones inactivas/inexistentes; 10/10/3 de 23; offsets posteriores; filtro antes de página/total; límites 3 y 100; fecha/likes y desempates; sesión opcional sin exponer votantes; documento antiguo sin likes; 17 variantes de query inválida. Angular comprueba HttpParams, cookies y endpoints sin identidad en body; las suites de feed conservan creación, imágenes y errores.

Las pruebas HTTP usan controller, DTO, guards, JWT y servicio reales con MongoDB/usuarios/transporte Cloudinary simulados. El doble de aggregate interpreta los filtros, cómputos y etapas de esta consulta; además se verifican los operadores y selección pública enviados. La prueba concurrente verifica la intención atómica y el contrato local, no la concurrencia real de MongoDB ni sus planes de ejecución. No se conectó Atlas, Cloudinary real o Vercel ni se modificaron datos externos.

Para completar aceptación externa: en una base de ensayo crear 23 publicaciones de dos autores, pedir offsets 0/10/20, filtros y empates; enviar ocho likes simultáneos con el mismo JWT y comprobar un solo ObjectId; quitarlo y comprobar los demás votos. Usar tokens válidos: el TTL previo de 20 segundos se conserva. Verificar frontend/API conjuntamente porque GET dejó de devolver array. Estas comprobaciones están pendientes y no autorizan despliegue.

Sin variables nuevas, secretos ni .env modificados. Detalles del contrato y límites de arrays/offset en [03](03-PUBLICACIONES.md).

## Historial — Sprint 2, Tarea 3A

Rama feature/publicaciones-modelo, base limpia c8383c9. Las tareas anteriores ya estaban confirmadas: no había cambios para un commit de respaldo y no se creó uno vacío. No se hicieron commits de esta tarea, merge o deploy.

| Comando                                                               | Resultado final                                                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| frontend: npm run build                                               | Correcto; aviso del CSS del feed: 4,88 KB frente a 4 KB, excedente 877 bytes. No se cambió el presupuesto.                  |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 32/32 aprobadas, 4 suites. Las 20 anteriores permanecen y se agregan 12.                                                    |
| backend: npm run build                                                | Correcto, salida 0, incluida repetición después del ajuste de límite de archivo.                                            |
| backend: npm test                                                     | 59/59 aprobadas, 6 suites. Incluye 43 HTTP publicaciones, 2 schema, 3 Cloudinary y las 11 anteriores de usuarios/seguridad. |

No se omitieron pruebas. Los 18 casos HTTP de creación de Tarea 2 se adaptaron al nuevo contrato obligatorio; los tipos incorrectos y vacíos se siguen comprobando con el otro campo válido. La prueba de propiedad adicional usa una propiedad realmente ajena, porque titulo ya es parte del contrato.

### Ajustes encontrados al verificar

El primer intento Nest pasó 55 de 56; el archivo de 5 MiB + 1 byte era rechazado con 400 por el pipe, pero la prueba esperaba 413. Se inspeccionó la versión instalada de Multer: su límite ya es inclusivo. Se corrigió limits.fileSize a 5 MiB y se mantuvo máximo + 1 solamente en MaxFileSizeValidator, que compara estrictamente con `<`. La prueba exacta de 5 MiB pasa y el exceso devuelve 413 antes de subir.

También se reemplazó validateSync en los tests nuevos por validate asíncrono para evitar la deprecación de Mongoose. Un fallo de Cloudinary se simula con la excepción controlada que ya emite el adaptador. La ejecución final no dejó esos avisos/errores simulados en la salida; solo persiste el presupuesto CSS del frontend.

### Qué se prueba sin servicios externos

- Controllers, AuthGuard, DTO, validación real de firma del archivo y servicio de publicaciones mediante HTTP local. Solo datos/guardado MongoDB, usuarios y transporte Cloudinary se simulan.
- Campos nuevos, alias contenido, activo true, títulos/descripcion vacíos o de tipos incorrectos, límites de texto y autor desde JWT.
- PNG/JPEG/WebP, archivo disfrazado, GIF rechazado, 5 MiB exactos y exceso, sin imagen y fallo de subida sin guardar.
- Baja del autor y del administrador actual, rechazo de tercero aunque su JWT viejo diga admin, usuario inexistente, id inválido, 404 por ausencia/ya retirada/carrera y conservación del documento.
- Filtro público activo != false y adaptación de respuesta antigua sin mutar los documentos de prueba.
- Schema Mongoose real validado en memoria y adaptador Cloudinary con stream simulado: default perfiles y carpeta publicaciones.
- Angular envía FormData, no elige autor, bloquea doble envío, limpia solo tras éxito, conserva datos ante 400/413/500 y muestra documentos nuevos/antiguos. No hay acción de baja en UI.

Las pruebas de consultas usan modelos simulados; no demuestran la ejecución del filtro en un Atlas real. No se subieron ni dieron de baja publicaciones reales. Sigue pendiente un ciclo de ensayo con Atlas/Cloudinary/Vercel y publicación coordinada de frontend/backend. La duración JWT no se cambió.

Variables necesarias: CONNECTION_STRING, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET y FRONTEND_URL; NODE_ENV, PORT y VERCEL siguen condicionando el arranque/cookies como antes. No se agregaron variables ni se leyeron sus valores.

Las secciones siguientes conservan resultados históricos de Tareas 0, 1 y 2. El contrato y los resultados actuales son los de esta sección y 03.

## Estado actual — Tarea 2: seguridad y DTO, 31/10/2026

Rama `fix/seguridad-validaciones`, creada desde el estado de `test/recuperar-pruebas`. Los tests recuperados y los 11 documentos previos se conservaron sin commit ni descarte. No se instalaron dependencias ni se cambió configuración JWT/cookies.

| Comprobación ejecutada                                                  | Resultado final                                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| frontend: `npm run build`                                               | Correcto, salida 0. Misma advertencia: publicaciones.css 4,68 KB frente a 4 KB, excedente 678 bytes. |
| frontend: `node node_modules/@angular/cli/bin/ng.js test --watch=false` | **20/20 aprobadas**, 3 suites. Ningún archivo del frontend se modificó en Tarea 2.                   |
| backend: `npm run build`                                                | Correcto, salida 0, sin advertencias en la salida.                                                   |
| backend: `npm test`                                                     | **29/29 aprobadas**, 4 suites. Incluye las 2 pruebas recuperadas sin cambios y 27 nuevas.            |

Las suites se ejecutaron fuera del aislamiento por los problemas de temporales ya registrados. No se amplió ningún timeout ni se cambió la configuración de tests. No se levantó el AppModule productivo ni se conectó Atlas/Cloudinary.

### Qué cubren las nuevas pruebas

- `usuarios/usuarios.controller.http.spec.ts`: 8 casos HTTP locales. Usa AuthGuard y AdministradorGuard reales y JWT firmados con una clave exclusiva de prueba. UsuariosService es un doble para no consultar el padrón real. Comprueba 401 sin sesión o con JWT inválido, 403 para rol común, 200 para administrador, rol libre ignorado, rol retirado, usuario inexistente y acceso por cookie existente.
- `usuarios/usuarios.service.spec.ts`: 1 caso usa findAll real con un modelo simulado; verifica selección positiva de campos y select:false de passwordHash. No afirma que se haya ejecutado la consulta contra MongoDB.
- `publicaciones/publicaciones.controller.http.spec.ts`: 18 casos usan controller, DTO, ValidationPipe con las opciones actuales de main.ts y PublicacionesService reales. Solo el modelo/save se simula. Comprueba 401, creación 201, recorte, autor desde JWT, límites, saltos internos, cuerpos vacíos/tipos incorrectos/propiedades ajenas y rechazo sin guardado.

En total, 2 pruebas anteriores + 8 + 1 + 18 = 29. El contrato Angular POST `{ contenido }` se mantuvo y la regresión frontend sigue en 20/20. No se usaron claves reales ni se modificaron cookies productivas; los JWT de prueba no son sesiones del sistema publicado.

### Límites de esta verificación

Las pruebas son integración HTTP de la aplicación de test y pruebas unitarias de consulta, no e2e contra Atlas. Antes de desplegar corresponde comprobar un administrador y un usuario de una base de ensayo y las variables/cookies del entorno real. No se creó un administrador desde registro público ni se cambiaron roles reales. Persisten los pendientes de auditoría fuera de este alcance, incluida la duración de 20 segundos y la advertencia CSS.

Las secciones de Tarea 1 y auditoría que siguen conservan sus resultados históricos; este es el estado actual de las suites.

## Estado actual — Tarea 1: recuperar pruebas, 31/10/2026

Rama `test/recuperar-pruebas`, creada explícitamente desde `docs/auditoria-inicial`. Se conservaron los 11 documentos de auditoría que estaban sin seguimiento de Git, sin crear commits. Solo se editaron tres archivos spec y los documentos 00, 08, 09 y 10; producción y dependencias permanecen iguales.

### Antes y después

| Comprobación                                                           | Antes, Tarea 0                   | Después, Tarea 1                                                                                         |
| ---------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Frontend `npm run build`                                               | Correcto, con advertencia de CSS | Correcto, código 0. Misma advertencia: publicaciones.css 4,68 KB, presupuesto 4 KB, excedente 678 bytes. |
| Frontend `node node_modules/@angular/cli/bin/ng.js test --watch=false` | 14 aprobadas y 3 fallidas, de 17 | **20 aprobadas de 20, 3 suites aprobadas.**                                                              |
| Backend `npm run build`                                                | Correcto                         | Correcto, código 0, sin advertencias en la salida.                                                       |
| Backend `npm test`                                                     | 1 fallida de 1 por UsuarioModel  | **2 aprobadas de 2, 1 suite aprobada**, en ejecución final aislada.                                      |

Las suites se ejecutaron fuera del aislamiento por los errores de temporales ya identificados. En el primer intento de esta tarea, Nest se ejecutó junto a las compilaciones y Angular: la delegación pasó, pero el primer beforeEach excedió su límite de 10 segundos. Se repitió la misma suite de forma aislada y pasó en 1,73 segundos (150 ms de pruebas). No se aumentó el timeout, no se cambió configuración ni se atribuyó el resultado a un error productivo. La causa exacta del timeout transitorio no quedó demostrada; el contexto de ejecución concurrente queda registrado.

### Causa de cada fallo anterior y solución

| Prueba anterior                                              | Por qué fallaba                                                                                                                      | Comprobación actual, sin debilitar el contrato                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| app.spec: campos de registro y envío deshabilitado           | Buscaba «No se crea una cuenta», aviso retirado al integrar el registro.                                                             | Se conservan nueve campos, accept de imágenes y botón deshabilitado con formulario vacío. Se comprueban resumen actual e inicio neutro; el envío válido se ejercita en la suite de registro.                                                                                                                                                     |
| app.spec: tarjetas compartidas entre feed y perfil           | Esperaba cuatro demos en un feed que ahora consulta la API y usa artículos propios. También esperaba datos del CV estático retirado. | Se entregan tres publicaciones de API simuladas y se verifica cantidad, contenidos, autores, fallback de autor ausente e imagen. El perfil recibe un usuario simulado distinto de Mateo; se comprueban sus datos personales y las dos tarjetas demo claramente identificadas. No se oculta que el material sigue sin estar asociado a la cuenta. |
| registro.spec: envío siempre deshabilitado con datos válidos | jugador10 no cumple la regla de mayúscula y la creación de cuentas dejó de estar deshabilitada permanentemente.                      | Se usa Jugador10, se comprueba habilitación, POST y todos los campos de FormData (incluida imagen), bloqueo durante envío, ausencia de duplicado y éxito después de la respuesta.                                                                                                                                                                |
| UsuariosController: should be defined                        | Construía UsuariosService real, que necesita UsuarioModel no provisto en RootTestModule.                                             | useValue entrega un doble de UsuariosService; overrideGuard aísla JWT solo en esta suite. Se conserva la creación y se agrega delegación exacta de findAll y su retorno.                                                                                                                                                                         |

Se mantuvieron las 17 pruebas Angular existentes, actualizando sus expectativas; se agregaron 3: 401 en navegación a perfil, registro inválido sin HTTP y error 409 con posibilidad de reintento. Nest conserva su prueba de creación y agrega la de delegación. No se borró, deshabilitó ni marcó skip/todo ninguna prueba.

### Cómo funciona el aislamiento

En Angular, provideHttpClient conserva el servicio y provideHttpClientTesting cambia únicamente el transporte de la prueba. HttpTestingController.expectOne comprueba la solicitud; flush entrega una respuesta simulada. verify, en afterEach, detecta solicitudes inesperadas o pendientes. Se responde al guard de MiPerfil antes de esperar la navegación, y luego a la segunda consulta de ngOnInit. El guard real de Angular no fue reemplazado.

En Nest, el controller recibe un objeto con findAll simulado. El guard se reemplaza solo dentro del módulo de test porque esta suite unitaria no intenta validar JWT. La prueba no demuestra que el endpoint esté restringido a administradores ni comprueba MongoDB. Se cierra el módulo al terminar cada caso.

Como analogía: probamos que la recepción entrega la ficha correcta a la oficina, usando un mensajero de prueba. No hace falta abrir el archivo real de socios ni inscribir a un jugador para comprobar esa comunicación.

### Alcance y pendientes

No se detectó un error productivo nuevo que hubiera que corregir para recuperar estas pruebas. Siguen los hallazgos de auditoría: JWT de 20 segundos, falta de autorización administrativa, DTO de publicaciones pendiente, material demo en perfil y advertencia CSS. Las pruebas con HTTP simulado no acreditan integración contra Atlas/Cloudinary/Vercel ni reemplazan e2e.

La documentación siguiente conserva los comandos, fallos y limitaciones de **Tarea 0 como historial**, no como resultado actual de las suites.

## Qué se hizo en esta auditoría

Fecha: 31/10/2026. Node `v24.15.0`, npm `12.0.2`. Las dependencias ya estaban instaladas. No se ejecutó npm install, no se cambió configuración y no se instalaron paquetes. No se abrió ni publicó el contenido de archivos .env. La existencia de `backend/.env` no confirma que sus valores sean correctos ni que estén disponibles en Vercel.

Las compilaciones generan archivos ignorados en dist y cachés; no cambian el comportamiento de las fuentes. Los únicos cambios versionables de esta tarea están en docs/. No se realizó merge, commit ni deploy.

## Comandos ejecutados y resultados

| Directorio | Comando                                                                              | Resultado comprobado                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raíz       | `node --version`, `npm --version`, `git branch --show-current`, `git status --short` | Entorno anterior; origen main limpio; rama documental creada.                                                                                                                                            |
| frontend   | `npm run build`                                                                      | Código de salida 0; bundle generado en dist/frontend. Advertencia: publicaciones.css 4,68 KB frente a presupuesto de aviso 4 KB, excedente 678 bytes.                                                    |
| backend    | `npm run build`                                                                      | Código de salida 0; nest build generó dist/main.js.                                                                                                                                                      |
| frontend   | `node node_modules/@angular/cli/bin/ng.js test --watch=false`                        | Primer intento restringido: errores ENOENT en temporales y una expectativa fallida de tarjetas. Repetido fuera del aislamiento: **17 pruebas, 14 aprobadas y 3 fallidas**, 2 suites fallidas/1 aprobada. |
| backend    | `npm test`                                                                           | Primer intento restringido: EPERM al renombrar un temporal, sin pruebas ejecutadas. Repetido fuera del aislamiento: **1 prueba, 1 fallida** por dependencia UsuarioModel ausente.                        |
| Raíz       | `git diff --check` y revisión de cambios                                             | Correcto: solo docs/ nuevo, sin diferencias en frontend/backend; 11 documentos, enlaces locales y bloques de código comprobados; 44 IDs únicos en la matriz.                                             |

Se repitieron las pruebas con permiso de ejecución fuera del aislamiento para separar fallos del entorno y del código. No se alteraron los tests para obtener estos resultados. Los 17 tests aprobados que figuraban en entregas anteriores no describen la revisión actual.

## Fallos y cobertura real

| Archivo de prueba                                  | Evidencia y motivo                                                                                                                                                                                                                     | Trabajo posterior sugerido                                                                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/app/app.spec.ts`                     | Espera el aviso «No se crea una cuenta», eliminado al integrar registro. Espera cuatro app-publicacion-card en el feed, que ahora usa artículos con datos API.                                                                         | Actualizar expectativas al contrato real; simular HTTP y sesión; comprobar carga, errores y resultados sin depender del backend remoto.                                   |
| `frontend/src/app/pages/registro/registro.spec.ts` | La prueba de envío deshabilitado usa jugador10, que ya no cumple la regla de mayúscula. El formulario es inválido y la afirmación de validez falla; el envío permanente deshabilitado también dejó de ser el comportamiento requerido. | Datos válidos para las reglas actuales, respuesta HTTP simulada, estado enviando y casos de éxito/error.                                                                  |
| `frontend/src/app/forms/registro-form.spec.ts`     | 6 pruebas aprobadas en la ejecución final.                                                                                                                                                                                             | Ampliar casos de nueva regla de clave y equivalencia de validaciones con DTO, sin confundir aprobación de reglas locales con registro externo.                            |
| `backend/src/usuarios/usuarios.controller.spec.ts` | Nest no puede resolver UsuarioModel al construir UsuariosService real sin un modelo/proveedor en RootTestModule.                                                                                                                       | Prueba aislada del controller con doble de UsuariosService; o proveedor de modelo simulado si se prueba el service. No conectar la base productiva para resolver el test. |

La suite Angular de registro visual pasó 5 de 6; app.spec.ts pasó 3 de 5. No se encontraron suites de integración de auth, publicaciones o Cloudinary ni archivos e2e de backend. Existe el script/config test:e2e, pero su existencia no demuestra cobertura y no se ejecutó. No se hicieron pruebas manuales con cuentas reales ni pruebas de escritura deliberadas contra producción.

## Comandos reales para trabajar después

Desde frontend: `npm start`, `npm run build` y el comando CLI de test anterior. Usar CLI directo evita los problemas de reenvío de --watch observados con npm 12.

Desde backend: `npm run start:dev` carga .env explícitamente con node --env-file y abre watch; `npm run build`, `npm test`, `npm run test:e2e` y `npm run lint` existen en package.json. No se ejecutó start:dev porque iniciaría conexiones externas; tampoco lint ni format (format modifica archivos).

`start:prod` apunta a node dist/main. Con package.json type module y salida main.js, conviene verificar ese comando concreto antes de darlo por válido: la compilación no lo ejecuta. No se cambió el script. `npm run deploy` existe pero no se ejecutó ni se autoriza con esta auditoría.

## Variables de entorno referenciadas por el código

Solo se documentan **nombres**, nunca valores:

| Nombre                | Para qué se consulta                                |
| --------------------- | --------------------------------------------------- |
| CONNECTION_STRING     | Conexión Mongoose a MongoDB.                        |
| JWT_SECRET            | Firma/verificación JWT.                             |
| CLOUDINARY_CLOUD_NAME | Configuración de imágenes.                          |
| CLOUDINARY_API_KEY    | Configuración de imágenes.                          |
| CLOUDINARY_API_SECRET | Configuración de imágenes.                          |
| FRONTEND_URL          | Lista de orígenes CORS y middleware de origen.      |
| NODE_ENV              | Opciones Secure y SameSite de cookie.               |
| PORT                  | Arranque HTTP local.                                |
| VERCEL                | Selección entre handler exportado y listener local. |

Las URLs de API Angular están escritas en services/auth.ts y services/publicaciones.ts; no se encontró configuración de ambientes/API base del frontend. Sus comentarios todavía las llaman locales, aunque apuntan a Vercel. No se tocaron esas URLs.

ConfigModule.forRoot carga variables, pero SeguridadModule lee JWT_SECRET al evaluar JwtModule.register. Debe comprobarse el orden efectivo de carga al usar cada comando; start:dev precarga .env y el entorno de Vercel debería proveer variables antes de evaluar módulos. **No verificado**: no se arrancó el servidor ni se leyó el archivo para comprobarlo.

## Catálogo HTTP existente

Base configurada en Angular: backend Vercel con prefijos auth y publicaciones; dirección local prevista por main.ts: localhost:3000. No hay prefijo global /api en las fuentes.

| Método y ruta               | Acceso y cuerpo                                                                | Respuesta esperada por código                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| GET `/`                     | Público                                                                        | Texto de saludo; no prueba salud de Atlas/Cloudinary.                                                                     |
| POST `/auth/registro`       | Público; multipart/FormData con datos de CreateUsuarioDto e imagen opcional    | Mensaje y usuario sin hash; duplicados 409; validaciones 400; imagen/servicio externo requieren comprobar errores reales. |
| POST `/auth/login`          | Público; identificador y password                                              | 200, mensaje y Set-Cookie HttpOnly; credenciales incorrectas 401.                                                         |
| GET `/auth/me`              | AuthGuard; cookie o Bearer                                                     | Datos personales propios; JWT inválido/vencido 401; usuario inexistente 404.                                              |
| POST `/auth/logout`         | Sin AuthGuard; middleware de origen                                            | 200 y clearCookie.                                                                                                        |
| GET `/usuarios`             | AuthGuard + AdministradorGuard, rol actual desde MongoDB                       | Array con selección positiva de campos sin credenciales; exclusivo para administrador.                                    |
| GET `/publicaciones`        | Público                                                                        | Array de hasta 50, más recientes primero; autor con campos públicos por populate.                                         |
| POST `/publicaciones`       | AuthGuard; titulo, descripcion e imagen opcional multipart (o JSON sin imagen) | 201 con campos nuevos y alias contenido; 400 validación, 401 sesión, 413 exceso y 500 fallo de servicio.                  |
| DELETE `/publicaciones/:id` | AuthGuard; autor o administrador actual según UsuariosService                  | 200 mensaje; 400 id inválido, 401 sesión/usuario, 403 ajeno y 404 ausente/ya retirada. No borra documento.                |

No existen POST autorizar/refrescar, detalle por id, comentarios, likes o estadísticas. DELETE de baja lógica sí existe desde 3A. Las rutas similares de otros documentos son propuestas, no deben probarse como si estuvieran desplegadas.

## Vercel: evidencia y límites

- backend/src/main.ts exporta un handler por defecto y reutiliza una instancia inicializada; si no está VERCEL, escucha un puerto local.
- Configura ValidationPipe y CORS en ambas inicializaciones.
- No se encontró vercel.json ni configuración .vercel versionada. Esto no prueba por sí solo que un despliegue sea inválido: la configuración también puede estar en el proveedor. Ese panel y los logs son **No verificado**.
- Frontend compila con base href /; angular.json copia public y produce dist/frontend/browser. Se debe comprobar la carpeta de salida y el fallback de rutas SPA del proyecto Vercel.
- Revisar que variables del backend existan en el entorno correcto, que FRONTEND_URL coincida con el frontend real y que HTTPS/cookies funcionen entre los dominios concretos. No alcanza con compilar ni con ver una URL en el código.
- La conectividad, índices y datos de Atlas, la cuenta de Cloudinary y la disponibilidad del backend publicado no se verificaron. No se efectuó deploy.

## Pruebas manuales pendientes, con entorno aislado

1. Crear usuario de prueba y avatar; comprobar documento sin password en claro, URL de imagen y respuesta sin hash.
2. Intentar duplicado y confirmar un 409 con mensaje; comprobar si quedó una imagen huérfana.
3. Login válido/incorrecto; inspeccionar atributos de cookie sin copiar su valor a la documentación.
4. Consultar me de inmediato y después de 20 segundos; comprobar 401/redirección en la operación correspondiente.
5. Publicar texto válido, vacío, espacios, >2000 y contenido de tipo incorrecto; comprobar respuesta, autor y persistencia.
6. Probar logout y petición privada posterior. No confundir cookie borrada con revocación de una copia del token.
7. Revisar acceso de usuario común a usuarios, política de Origin ausente y casos 400/401/403/409/500.
8. Recargar rutas SPA, revisar ancho de 360/768/1280px, foco y mensajes, incluido el aria-describedby que referencia aviso-registro sin elemento con ese id.

Los futuros casos de paginación, permisos, comentarios, reportes y PWA figuran en sus documentos y en la matriz. Conceptos: prueba unitaria frente a integración/e2e, doble de dependencia, compilación frente a comportamiento, configuración por entorno y evidencia reproducible.

## Verificación 5A — 2026-11-01

| Comprobación | Antes: 4C preservada | Después: 5A |
| --- | --- | --- |
| Frontend `npm run build` | exit 0 | exit 0; sin advertencias de presupuesto |
| Frontend `node node_modules/@angular/cli/bin/ng.js test --watch=false` | 138/138, 18 archivos | **162/162, 22 archivos**, exit 0 |
| Backend `npm run build` | exit 0 | exit 0 |
| Backend `node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads` | 187/187, 10 archivos | **223/223, 12 archivos**, exit 0 |

Ejecutar cada comando desde frontend o backend, respectivamente. Sin instalación de dependencias ni cambios de configuración de tests. Se usan threads en serie por la incidencia de workers ya documentada en 4C. Los npm notice del entorno no son errores de compilación.

Backend incorpora 34 casos HTTP de administración y dos de esquema: autenticación/roles en los cuatro endpoints, ambos tipos de alta, duplicados y DTO, registro público sin escalación, ausencia de hash, baja lógica y rehabilitación, cuentas protegidas, concurrencia sobre el estado, IDs, fallos y CSRF. El mismo JWT deja de acceder a me/listado/autorizar/refrescar después de la baja. Login de baja rechaza con mensaje; registro antiguo sin activo funciona sin escritura de migración. Las suites anteriores conservan sus casos; dobles de modelo se actualizan porque AuthGuard ahora consulta UsuarioModel. La prueba antigua de ausencia de estado pasa a verificar el nuevo default, no una funcionalidad eliminada.

Frontend añade 24 casos: servicio HTTP (4), dashboard (14), guard con router real (3), modal (2), login de cuenta deshabilitada (1). Comprueban radios, creación, datos inválidos, borrador preservado frente a 400/409/500, 403 sin destruir sesión, carga/vacío/reintento, confirmación, cancelación sin DELETE, bloqueo de solicitudes repetidas y éxito/error. Los dos tipos de cuenta se prueban con el formulario real. El dialog usa un doble de API nativa donde el DOM de tests no la implementa.

Durante desarrollo: TypeScript detectó overrides de DTO sin declare y la inyección de UsuarioModel no exportada para guards usados en otros módulos. Se corrigieron las declaraciones y la exportación de MongooseModule, sin debilitar pruebas. Una primera suite ampliada dio 222/223: password sin número se aceptaba al redefinir validadores heredados. Se declararon completas las reglas del campo y el mismo caso ahora espera y recibe 400. Resultado final: 223/223. No hay pruebas eliminadas, skip ni only.

### Ensayos pendientes y límites

No se conectó Atlas ni se modificaron usuarios externos. La persistencia HTTP usa dobles, y el esquema se valida con Mongoose sin conexión: no demuestra índices, latencia ni concurrencia real de MongoDB. No hubo ensayo visual manual en navegador/móvil ni verificación de cookies/HTTPS/CORS en producción. Probar el recorrido detallado en 05 con cuentas de prueba antes de integrar. No se hizo merge/deploy; las condiciones externas de 4C siguen pendientes.

## Verificación 5B — 2026-11-01

Se repitieron comprobaciones de 5A: frontend build exit 0, 162/162 en 22 archivos; backend build exit 0, 223/223 en 12 archivos. Se respaldó ese estado en 92a58e5 antes de crear feature/estadisticas-admin.

| Comando (desde cada proyecto) | Resultado final 5B |
| --- | --- |
| Frontend: `npm run build` | exit 0; sin advertencias de presupuesto |
| Frontend: `node node_modules/@angular/cli/bin/ng.js test --watch=false` | 181/181 en 23 archivos, exit 0 |
| Backend: `npm run build` | exit 0 |
| Backend: `node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads` | 265/265 en 13 archivos, exit 0 |

Se agregan 42 casos backend y 19 frontend (15 dashboard, tres ruta administrativa, una moderación). Todos los anteriores se conservan, sin skip/only. Backend: los tres reportes con 401/403/200 y rol actual; fechas obligatorias/estrictas/inexistentes/invertidas/extra/repetidas; mismo día/bisiesto y límites UTC; cantidades/grupos/días; bajas/legado/huérfanos; proyección pública; fallo de consulta y moderación. El test integrado confirma conservación de documentos, retiro de feed/detalle/comentarios y reducción del reporte.

Los pipelines reales se ejecutan sobre fixtures mediante intérprete limitado exclusivo de tests (agregacion-prueba.ts). No es MongoDB ni acredita índices/planes/semántica completa del servidor; se comprueban etapas, filtros, zona y proyecciones. Los módulos Nest reales prueban inyección/guards; JWT real usa clave exclusiva de tests. Sin Atlas ni instalación de dependencias.

Angular: HttpTestingController verifica GET/cookie/rangos, seis campos, validación roja/verde, independencia, gráficos/tablas, actualizaciones, carga/vacío, 400/401/403/500/red y reintento. RouterTestingHarness verifica admin, común y visitante. Modal productivo con doble de API dialog del DOM: cancelar no solicita; confirmar recarga y muestra éxito. Un caso comprueba línea a cero entre jornadas con actividad. No se descarga feed para contar.

Incidencia resuelta: Model.populate tipaba el resultado agregado como Publicacion y no reconocía cantidad. Se explicitó la forma del grupo poblado, sin cambiar consulta. Primera suite Angular: 180/180; se añadió tratamiento de días vacíos y su caso (181/181 final). Backend completo 265/265; se repitieron 42 focalizadas tras reforzar la aserción de timezone. Sin configuración/dependencias modificadas.

Pendiente: navegador/móvil real, MongoDB desplegado y versión/rendimiento de lookup/facet/dateToString, índices/rangos grandes y cookies HTTPS/CORS de producción. Sin escrituras externas, merge ni deploy. Avisos Git LF/CRLF son de configuración existente, no errores de compilación.

## Verificación 5C — 2026-11-01

Preparación: ambos builds exit 0, Angular 181/181 en 23 archivos, NestJS 265/265 en 13. Se respaldó 5B en be005ec y se creó feature/pwa-pipes-directivas. Se comprobó core 22.2.3/CLI-build 22.2.4 antes de añadir @angular/service-worker 22.2.3 exacto. Instalación inicial falló ENOTFOUND por red restringida; repetición autorizada completó un paquete, sin actualizar dependencias existentes.

| Comprobación final | Resultado |
| --- | --- |
| Frontend: `npm run build` | exit 0; genera ngsw-worker.js/ngsw.json; sin advertencias de presupuesto |
| Frontend: `node node_modules/@angular/cli/bin/ng.js test --watch=false` | **230/230**, 26 archivos, exit 0 |
| Frontend, después de build: `npm run test:pwa` | **11/11** pruebas Node, exit 0 |
| Backend: `npm run build` | exit 0; código sin modificar |
| Backend: `node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads` | **265/265**, 13 archivos, exit 0 |

Angular agrega 49 casos: FechaRelativaPipe 22, InicialesPipe 14, directivas 7, TruncatePipe 2, tarjeta 1, comentarios 2 y shell de reconexión 1. Los 181 casos anteriores se conservan, sin skip/only. Uno se actualiza porque el requisito cambia fecha absoluta por relativa: antes esperaba '2026-10-31' en texto; ahora fija el reloj, espera 'Ayer' y comprueba datetime/title con el ISO exacto. No se elimina la comprobación de la fecha.

Directivas: DOM real de test para clase dinámica, foco al editar/reabrir y campo deshabilitado; sesión común/admin/logout/baja/rehabilitación y cambios de permiso sin vistas duplicadas. Uso real: avatar CG/FC, comentarios propios que dejan de resaltarse al cambiar usuario y autofocus del editor, cancelar sin PUT. App sin red muestra la recepción estática y reintenta un POST de autorización, sin montar router-outlet privado. Se mantienen suites de login/logout/renovación/interceptor/roles.

Las once pruebas Node revisan manifest válido, identidad, PNG/dimensiones reales, enlaces, compatibilidad de versiones/registro, worker generado, precarga de chunks y hashes SHA-1 de estáticos. Verifican dataGroups vacío, ausencia de patrones dinámicos/externos, ninguna coincidencia API/fallback y navegación exacta permitida. El generador oficial se ejecuta además con archivos señuelo privados: una regla amplia de caché haría fallar la prueba.

Incidencias resueltas: primera suite Angular tuvo 180/181 por la expectativa de fecha antigua. Primera prueba PWA tuvo 10/11: el prefijo ^ en navigationUrls era tratado como ruta relativa por el generador y rompía el fallback de '/'. Se corrigió la configuración a rutas exactas sin ese prefijo; ngsw.json generado demuestra los patrones anclados correctos y el mismo caso pasa. No se suavizaron aserciones para aceptar esos errores.

### Alcance y pendientes reales

Las once pruebas de PWA verifican configuración/artefactos, **no ejecutan ni instalan el worker en un navegador**. Las suites de auth son regresión con HTTP simulado y worker desactivado, no prueba integral de cookies con worker activo. Pendientes: instalación HTTPS/localhost, activación/actualización y Cache Storage real, offline tras primera carga, login/logout/autorizar/refrescar con worker activo, móvil/responsive y condiciones externas previas de Atlas/Cloudinary/CORS/HTTPS. Recorrido en 07.

No se hizo merge/deploy ni se tocaron backend/secretos. Avisos Git LF/CRLF son de configuración existente. La dependencia exacta del worker debe mantenerse alineada con core en futuras actualizaciones; npm ci reproduce el lock. No se afirma completo el cierre de los cuatro sprints en producción solo por pasar suites locales.

## Auditoría final 5D — 2026-11-01

Base main 7f327ec limpia, con 5C ya confirmada 1ca14cb. Preparación repitió ambos builds correctos, Angular 230/230, Nest 265/265 y PWA 11/11. Se creó test/auditoria-final sin un commit vacío/duplicado de respaldo.

| Comando | Resultado final |
| --- | --- |
| `npm run build`, frontend | exit 0, sin advertencias de presupuesto |
| `node node_modules/@angular/cli/bin/ng.js test --watch=false`, frontend | **236/236**, 26 archivos, exit 0 |
| `npm run test:pwa`, frontend tras último build | **11/11**, exit 0; artefactos/configuración |
| `npm run build`, backend | exit 0 |
| `node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads`, backend | **275/275**, 14 archivos, exit 0 |

Nuevos casos: 6 Angular (formulario UTF-8, feedback de registro y cuatro de interceptor); 10 Nest (cuatro helper clave y seis HTTP de altas/DTO). Caso existente de perfil vacío reforzado con avatar neutro y usuario sin foto. Sin dependencias nuevas ni pruebas eliminadas/omitidas, sin cambio de timeouts/configuraciones.

Antes de arreglar: dos casos rechazando clave truncable fallaron, tres 401 estadísticas fallaron y tres registros con espacios devolvieron 500 en vez de 400. Se corrigieron las causas productivas y se mantuvieron los casos. Una ejecución completa concurrente Angular tuvo 218/236 por timeout inicial de navegación y errores derivados de limpieza; aislada 6/6 y repetición completa 236/236. Se documenta el intento fallido, sin suavizar aserciones ni aumentar límites. Node v24.15.0.

Integración real de solo lectura: API raíz/feed 200, me/usuarios/reportes 401 anónimos; preflight localhost con origen exacto y credenciales, ajeno sin allow-origin; Atlas ping y Cloudinary ping ok. Sin subir/borrar imágenes, crear cuentas, comentar, votar ni modificar datos/índices. No se imprimieron valores de configuración secretos ni respuestas con datos reales.

El navegador no accedió al servidor local (timeout aun con puerto escuchando); no se verificaron móvil/PWA runtime ni las operaciones autenticadas externas. Un ping no verifica upload y los pipelines simulados no certifican agregaciones reales. Matriz de aceptación manual M01–M18 y dictamen por sprint en 11. Guía docente en 12. No merge/deploy.

## Validación integrada 5E — 2026-11-01

Preparación repitió frontend build exit 0, Angular 236/236 (26 archivos), PWA 11/11, backend build exit 0 y Nest 275/275 (14 archivos). Se respaldó 5D en 725c03e y se creó test/integracion-final. No cambió código productivo ni suites/dependencias.

Ensayo externo opt-in `backend/scripts/integracion-qa.mjs`, sin mocks: primer intento 12/14; segundo 13/14 por consulta de ensayo string/ObjectId; repetición suplementaria real de M09 aprobada con filtro ObjectId. No se declara una tercera suite completa 14/14. La cuenta QA demasiado larga también se corrigió en el ensayo, sin relajar DTO. Explicación, comandos, matriz y evidencias en [13](13-VALIDACION-INTEGRADA.md). `node --check` del script corregido exit 0.

Navegador localhost: registro/login, creación multipart, like, perfil, comentarios acumulados 3/6/8 y Editado; suspensión/rehabilitación con modal, reportes/rangos, logout y worker real NORMAL. Servidores apagados: shell de reconexión sin datos privados. No confundir esto con instalación/update o caché inspeccionado: pendientes explícitos en 13. Lectura de viewport observada 375px; otros tamaños pedidos no quedaron certificados.

Se retiraron solo los recursos propios autorizados: primer ensayo 4 cuentas/23 publicaciones/8 comentarios/1 imagen; segundo 6/25/24/2, 0 cuentas propias restantes. Credenciales temporales eliminadas. No producción, merge ni deploy. Advertencia real Mongoose sobre opción `new` deprecada, sin fallo funcional; no se refactorizó por ello.

## Aceptación 5F — 2026-11-01

Respaldo autorizado 5E 6a66fc9 tras builds correctos, Angular 236/236, Nest 275/275 y PWA 11/11; rama test/aceptacion-final. Resultado final tras política S4-04: builds correctos, **Angular 237/237 (26 archivos), Nest 278/278 (14 archivos), PWA 11/11**. Dos ejecuciones HTTP reales nuevas 14/14; ensayo administrativo real cuatro escenarios aprobados, con cinco carreras opuestas (403/200, siempre un activo). Sintaxis del nuevo ejecutor correcta.

Se documentan intentos fallidos en 14: sandbox ENOENT/EACCES, fixture de Angular sin markForCheck y timeout de navegación existente. Repetición sin concurrencia pasó sin aumentar límites ni omitir tests. Mongoose `new` deprecado y LF/CRLF siguen como avisos, sin refactor. No dependencias ni modificaciones JWT/cookies/caché.

JWT con reloj real, instalación/update/cache PWA y cuatro tamaños responsive comprobados con evidencias. HTTPS real bloqueado a la espera de aprobar propuesta concreta en [14](14-ACEPTACION-FINAL.md); no se crearon proyectos ni se desplegó. Scripts externos se ejecutan únicamente con autorización/namespace QA; las cuentas temporales no son datos de demo del producto.

## Contador de comentarios — 2026-11-02

Ambos npm run build finalizaron exit 0; frontend sin advertencias de presupuesto. Suite Angular completa: **241/241, 26 archivos**. Suite Nest completa con threads sin paralelismo de archivos: **279/279, 14 archivos**. PWA tras el build: **11/11**. Suites Angular/Nest fuera del sandbox por las restricciones temporales/HTTP ya identificadas en esta sesión. Prueba PWA inicialmente invocada desde raíz sin package.json (ENOENT); corregido directorio a frontend, 11/11. Git diff --check correcto; avisos LF/CRLF existentes.

Regresiones nuevas: tarjeta con total ausente/1/8, Output comunica total ocho aunque la página tenga tres, y HTTP listado/detalle con conteo por publicación, cero y filtro de asociación; se verifican explícitamente operadores lookup/count y colocación después del límite. MongoDB se simula en esa suite: no se certifica ejecución real Atlas ni ensayo visual integrado. Prueba manual pendiente detallada en 03. Requiere frontend y backend de esta versión; un backend desplegado anterior todavía no incluye cantidadComentarios. No deploy ni operaciones externas.

## Acceso Agregar comentario — 2026-11-02

Frontend npm run build: exit 0, sin advertencias de presupuesto. Suite Angular completa: **246/246, 26 archivos, exit 0**. Regresiones: sin sesión, procesando, sesión habilitada, ausencia por baja/no disponibilidad de detalle y navegación por Router real para ambos textos (Ver detalle/Agregar comentario) con HTTP simulado. Incluyen bloqueo de llamadas directas al método. Backend y estrategia PWA no cambian, por lo que no se repitieron sus suites. Diff --check correcto; avisos LF/CRLF existentes. Sin despliegue.
