# 11 — Auditoría final y preparación de entrega

Fecha: 2026-11-01. Rama: `test/auditoria-final`. Base: `main` 7f327ec. 5C ya estaba confirmada por el usuario en 1ca14cb e integrada en 7f327ec; no se duplicó su commit de respaldo ni se hizo un merge nuevo. Git estaba limpio al iniciar. Los arreglos de 5D quedan sin commit.

## Resumen ejecutivo y criterio docente

La revisión de los 44 requisitos existentes arroja **39 Cumple, 4 Parcial, 0 No cumple y 1 No verificado**. Son juicios sobre implementación comprobada, no certificados de producción. Se contrastaron fuentes, contratos y pruebas, no solo documentación. Cada fila indica el nivel de evidencia. Hay cuatro condiciones parciales: subida real de imagen, restricción amplia de bajas de administradores, PWA en navegador y cierre integral. El no verificado es un criterio histórico de auditoría inicial, no una falla funcional actual.

El código está preparado para revisión y demostración local con datos de prueba, pero **no se recomienda declarar cerrada la entrega integrada de los cuatro sprints** antes de completar M01–M18. Las suites finales son Angular 236/236, NestJS 275/275 y PWA configuración 11/11; ambas compilaciones correctas. Atlas y Cloudinary respondieron ping real; API desplegada devolvió feed 200 y endpoints privados 401 anónimo. No se crearon usuarios ni se escribieron/eliminaron datos externos.

Estados: Cumple = implementación y criterio local comprobados en código y tests pertinentes; Parcial = falta parte del criterio o se limita respecto del alcance general; No cumple = ausencia/contradicción confirmada sin resolver; No verificado = no hay evidencia suficiente para emitir juicio. Que una fila Cumple use dobles NO significa que su integración real pasó.

Evidencias: **I** inspección de fuente/historia; **L** ejecución local (unitaria/DOM/HTTP con persistencia simulada); **A** artefactos de producción y generador oficial PWA; **R** operación real de red de solo lectura. Un ping no prueba un upload, y un HTTP simulado no prueba MongoDB ni cookies de terceros.

Los 44 IDs cubren Sprint 2 (9), Sprint 3 (10), Sprint 4 (10) y generales (15). **No contienen una sección de Sprint 1**: se revisa por separado contra el adjunto original disponible y se recupera docs/sprint-1.md. Las restricciones visuales iniciales se interpretan con las correcciones posteriores del usuario (botones redondeados) y las integraciones autorizadas después de Sprint 1.

## Catálogo de pruebas realmente ejecutadas

Rutas desde raíz. F identifica Angular; B NestJS. La totalidad de estos archivos se ejecutó en las suites finales, salvo la inspección de historia indicada como I.

| Clave | Archivo real |
| --- | --- |
| B-PUB | backend/src/publicaciones/publicaciones.controller.http.spec.ts |
| B-CLOUD | backend/src/cloudinary/cloudinary.service.spec.ts |
| B-COM | backend/src/comentarios/comentarios.controller.http.spec.ts |
| B-AUTH | backend/src/auth/auth.sesion.http.spec.ts |
| B-USR | backend/src/usuarios/usuarios.administracion.http.spec.ts |
| B-EST | backend/src/comentarios/estadisticas.http.spec.ts |
| B-CLAVE | backend/src/common/password.spec.ts |
| F-APP | frontend/src/app/app.spec.ts |
| F-FEED | frontend/src/app/pages/publicaciones/publicaciones.spec.ts |
| F-INT | frontend/src/app/pages/publicaciones/publicaciones-interacciones.spec.ts |
| F-CARD | frontend/src/app/components/publicacion-card/publicacion-card.spec.ts |
| F-PERFIL | frontend/src/app/pages/mi-perfil/mi-perfil.spec.ts |
| F-DET | frontend/src/app/pages/publicacion-detalle/publicacion-detalle.spec.ts |
| F-COM | frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.spec.ts |
| F-SES | frontend/src/app/app.sesion.spec.ts |
| F-AUTH | frontend/src/app/services/auth.spec.ts |
| F-HTTP | frontend/src/app/interceptors/sesion.interceptor.spec.ts |
| F-EXT | frontend/src/app/components/extender-sesion/extender-sesion.spec.ts |
| F-USR | frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.spec.ts |
| F-GUARD | frontend/src/app/guards/administrador.guard.spec.ts |
| F-EST | frontend/src/app/pages/dashboard-estadisticas/dashboard-estadisticas.spec.ts |
| F-PIPES | frontend/src/app/pipes/truncate.pipe.spec.ts, fecha-relativa.pipe.spec.ts, iniciales.pipe.spec.ts |
| F-DIR | frontend/src/app/directives/directivas.spec.ts |
| F-MODAL | frontend/src/app/components/confirmacion-baja/confirmacion-baja.spec.ts y confirmacion-usuario/confirmacion-usuario.spec.ts |
| PWA | frontend/scripts/pwa.test.mjs, ejecutado tras build |

## Matriz de cumplimiento (44 requisitos)

| ID | Sprint | Descripción | Estado | Archivo/componente/método | Prueba | Evidencia | Observaciones |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S2-01 | 2 | Título, descripción e imagen | Cumple | CreatePublicacionDto; PublicacionesService.crear; Publicaciones | B-PUB, F-FEED | L: textos obligatorios, tipos/límites, FormData y autor desde JWT | Imagen opcional; carga real pendiente M07. |
| S2-02 | 2 | Subida de imagen | Parcial | CloudinaryService.subirImagen; FileInterceptor | B-CLOUD, B-PUB | L: firmas/tamaño/carpeta; R: ping Cloudinary correcto | No se realizó upload real ni lectura posterior: M07. |
| S2-03 | 2 | Orden por fecha o likes | Cumple | ListarPublicacionesDto; consultarListado; cambiarOrden | B-PUB, F-INT | L: sort/empates y query fecha/likes; reinicio offset | No se afirma ordenación real de una base con volumen. |
| S2-04 | 2 | Paginación backend offset/limit | Cumple | PublicacionesService.consultarListado; ListarPublicacionesDto | B-PUB, F-INT | L: match/facet/skip/limit, 23 registros 10/10/3; R: sobre API 200 | Pipelines de suite simulados; plan de MongoDB no medido. |
| S2-05 | 2 | Filtro por usuario | Cumple | consultarListado; MiPerfil.cargarPublicaciones | B-PUB, F-PERFIL | L: filtro autor anterior al límite y usuarioId real | No se descarga el feed para filtrar en Angular. |
| S2-06 | 2 | Componente individual | Cumple | PublicacionCard; plantillas feed/perfil/detalle | F-CARD, F-APP | L: DOM, datos y eventos con mismo objeto | Hijo sin HttpClient; detalle ya implementado. |
| S2-07 | 2 | Likes sin duplicados | Cumple | PublicacionesService.cambiarMeGusta; AccionesPublicaciones | B-PUB, F-INT | L: addToSet/pull condicionados y bloqueo doble clic | Concurrencia MongoDB real pendiente M08. |
| S2-08 | 2 | Baja lógica autor/admin | Cumple | PublicacionesService.darDeBaja; ConfirmacionBaja | B-PUB, B-EST, F-INT | L: 403 ajeno, baja conserva documento, cancelar sin DELETE | No se retiró contenido real. |
| S2-09 | 2 | Perfil: últimas tres y comentarios | Cumple | MiPerfil; PublicacionCard; ComentariosPublicacion | F-PERFIL | L: limit 3, orden, filtro y comentarios por id | Avatar ficticio sustituido por escudo; M06 pendiente. |
| S3-01 | 3 | Detalle por id | Cumple | PublicacionDetalle; obtenerPorId; app.routes | F-DET, B-PUB | L: URL directa/router, id inválido, ausente/inactivo y texto completo | Arranque global aplica política de sesión 4C; componente/API permiten lectura pública. |
| S3-02 | 3 | Paginación de comentarios | Cumple | ComentariosService.listar; ComentariosPublicacion | B-COM, F-COM | L: aggregate/offset/limit y anexado 3/3/2 | No se reemplaza la colección al cargar más. |
| S3-03 | 3 | Editar propio y etiqueta | Cumple | ComentariosService.editar; formulario edición | B-COM, F-COM | L: autor en backend, PUT, modificado y Cancelar sin PUT | Administrador ajeno tampoco puede reescribir comentario. |
| S3-04 | 3 | JWT 15 minutos | Cumple | SeguridadModule; sesion.constants; sesion-cookie | B-AUTH | L: JWT real exp-iat=900 y cookie alineada | Firma real de prueba; no se mostró token productivo. |
| S3-05 | 3 | Autorización inicial | Cumple | AuthController.autorizar; AuthGuard; AuthService | B-AUTH, B-USR, F-SES | L: cookie válida 200 sin nueva emisión; inválida/baja 401 | R: GET me sin sesión 401; POST con cookie real pendiente. |
| S3-06 | 3 | Renovación voluntaria | Cumple | AuthController.refrescar; AuthService.refrescar | B-AUTH, F-AUTH, F-SES | L: token vigente, nuevo exp/cookie solo por acción | No renueva un token vencido; M04 pendiente. |
| S3-07 | 3 | Pantalla de carga | Cumple | App; app.html; signals cargandoSesion/errorInicial | F-SES | L: outlet bloqueado durante autorizar y error/reintento | Error de red conserva explicación; no simula acceso offline. |
| S3-08 | 3 | Redirección por 401 | Cumple | sesionInterceptor; AuthService.invalidarSesion | F-HTTP | L: 401 protegido invalida; 403/500 conserva; estadísticas corregidas en 5D | Tres nuevas regresiones fallaban antes de incluir /estadisticas. |
| S3-09 | 3 | Aviso minuto 10 | Cumple | AuthService temporizadores y revisión focus/visibility | F-AUTH | L: reloj simulado a exp menos cinco minutos | Suspensión de pestaña real pendiente M04. |
| S3-10 | 3 | Modal extender sesión | Cumple | ExtenderSesion; App.extenderSesion | F-SES, F-EXT | L: Extender/refrescar, Ahora no sin HTTP, errores y expiración | API dialog sustituida en DOM de tests; M04 pendiente. |
| S4-01 | 4 | Moderación admin de cualquier publicación | Cumple | darDeBaja; acciones/modal compartidos | B-PUB, B-EST, F-INT | L: admin retira ajena, feed/detalle/comentarios/reportes excluidos | Endpoint DELETE existente; sin duplicado administrativo. |
| S4-02 | 4 | Dashboard usuarios | Cumple | DashboardUsuarios; administradorGuard; UsuariosController | B-USR, F-USR, F-GUARD | L: URL/roles, tabla/formulario/estados y errores | No hay cuenta admin de ensayo suministrada: M11. |
| S4-03 | 4 | Alta administrativa con rol | Cumple | CrearUsuarioAdministrativoDto; crearAdministrativo | B-USR, F-USR | L: usuario/admin, radios, duplicados, campos prohibidos y sin hash | Hash compartido y límite UTF-8 corregido; registro público no escala rol. |
| S4-04 | 4 | Deshabilitar y rehabilitar | Parcial | Usuario.activo; UsuariosService.deshabilitar/habilitar; AuthGuard | B-USR, F-USR | L: JWT previo bloqueado, legado activo, modal y rehabilitación | Política 5A protege TODOS los administradores, incluso si quedan otros; no ampliar sin decisión. |
| S4-05 | 4 | Rol validado en Nest | Cumple | AuthGuard; AdministradorGuard; controllers administrativos | B-USR, B-EST | L: 401/403/200 y rol vigente de DB, no claim antiguo; R: anónimo 401 | Frontend solo controla presentación. |
| S4-06 | 4 | Tres estadísticas por fechas | Cumple | publicacionesPorUsuario; totalEnRango; porPublicacionEnRango | B-EST, F-EST | L: match/group/lookup/facet/count, fechas y exclusión de bajas | Pipelines probados con intérprete/fixtures; ejecución autenticada real pendiente M13. |
| S4-07 | 4 | Gráficos distintos | Cumple | DashboardEstadisticas TS/HTML/CSS | F-EST | L: barras/línea/dona, tablas y actualización independiente | No se hizo inspección visual móvil real. |
| S4-08 | 4 | PWA instalable/offline | Parcial | ngsw-config; manifest; app.config; iconos | PWA | A: worker/control, hashes, iconos, exclusión API; L: shell reconexión | Instalación/activación/actualización/offline real no verificadas: M14/M15. |
| S4-09 | 4 | Exactamente tres pipes | Cumple | TruncatePipe; FechaRelativaPipe; InicialesPipe | F-PIPES, F-CARD, F-COM | I/L: tres declaraciones e imports/uso real; vacíos/invalidos y límites | Fecha relativa pura sin timer, fecha exacta accesible. |
| S4-10 | 4 | Exactamente tres directivas | Cumple | ResaltarAutorDirective; AutoFocusDirective; PermisoRolDirective | F-DIR, F-COM | I/L: tres declaraciones, foco/clase/rol y cambios de sesión | PermisoRol no sustituye guards Nest. |
| G-01 | General | Arquitectura y reutilización | Cumple | Usuarios/Publicaciones/Comentarios/Auth; componentes/services | B-EST, F-CARD, F-PERFIL | I/L: módulos reales, contratos HTTP y servicios compartidos | Se retiran dataset/tipo de demo sin uso; no se crean módulos nuevos. |
| G-02 | General | Diez publicaciones por página | Cumple | Publicaciones.limit=10; PublicacionesService | B-PUB, F-INT | L: solicitudes offset 0/10/20 y remanente | Otros consumidores (perfil limit 3) conservan su contrato. |
| G-03 | General | Páginas numeradas | Cumple | Publicaciones.irAPagina; plantilla paginación | F-INT | L: números 1/2/3, ventana/extremos y aria-current | Teclado/móvil real pendiente M16/M17. |
| G-04 | General | Input/Output por publicación | Cumple | PublicacionCard y contenedores | F-CARD, F-PERFIL, F-DET | L: Output like/baja/detalle y mismo Input | No hay HTTP en la tarjeta. |
| G-05 | General | Modal propio antes de baja | Cumple | ConfirmacionBaja; ConfirmacionUsuario | F-INT, F-USR, F-MODAL | L: nombre/título, cancelar/Escape sin solicitud, envío único | Sin alert/window.confirm; no se ejecutaron bajas productivas. |
| G-06 | General | Notificaciones de resultado | Cumple | AccionesPublicaciones; ComentariosPublicacion; DashboardUsuarios | F-INT, F-COM, F-USR | L: éxito tras respuesta y error conserva borradores/colección | No se confunde 403 con expiración. |
| G-07 | General | Truncate y Ver más/menos | Cumple | TruncatePipe; tarjeta/comentarios | F-PIPES, F-CARD, F-COM | L: límite/exactitud/expandir y aria-expanded | Cuenta una sola vez entre los tres pipes. |
| G-08 | General | Comentarios recientes e inicial 3 | Cumple | ComentariosService.listar; servicio Angular | B-COM, F-COM | L: createdAt/_id descendente, limit 3 | No ordena por updatedAt después de editar. |
| G-09 | General | Anexar otros tres comentarios | Cumple | cargarComentarios; siguienteOffset y Map por id | F-COM, B-COM | L: 3/6/8, no duplicados, errores conservan anteriores | Concurrencia real pendiente M10. |
| G-10 | General | Relaciones y autoría en Nest | Cumple | ComentarioSchema; ComentariosService.editar | B-COM | L: ObjectId/referencias, autor del JWT, admin ajeno 403 | No se confía en autor/publicacion del body. |
| G-11 | General | Desde/Hasta válidos | Cumple | RangoFechasDto/construirRango; formularios | B-EST, F-EST | L: calendario real, formatos, vacíos/invertidos y sin HTTP inválido | Backend obligatorio; no basta validación visual. |
| G-12 | General | Filtro MongoDB y horas inclusivas | Cumple | pipelineVisibles; publicacionesPorUsuario; construirRango | B-EST | L: gte inicio, lt siguiente día y milisegundos límite | UTC-03 fijo; B/C usan creación de comentario; M13 real pendiente. |
| G-13 | General | Documentación pedagógica por tarea | Cumple | docs/00,08,09,10,11,12,guia-angular y sprint-1 | I y revisión de enlaces/inventario | I: archivos, flujo, pruebas, límites y recorrido docente | Se recupera sprint-1.md faltante; comparación CineBera inspeccionada, no se afirma copia literal. |
| G-14 | General | Criterio de cierre integral | Parcial | Suites/builds y matriz manual de esta auditoría | Todas y M01-M18 | L/A/R: compilaciones/suites, API y pings reales | Faltan flujos autenticados, uploads y PWA/móvil reales; no aceptación global. |
| G-15 | General | Auditoría inicial sin implementación/secretos/merge/deploy | No verificado | Historia docs/auditoria-inicial y primer commit docs c8383c9 | Inspección git log/show | I: primer commit con docs también agrupa cambios posteriores | Requisito histórico Tarea 0: no hay checkpoint exclusivo que permita certificar retrospectivamente toda su ejecución. En 5D sí se conservó la base y no se hizo merge/deploy. |

## Resultados automatizados y regresiones

| Verificación | Base 5C | Final 5D |
| --- | --- | --- |
| Angular build (`npm run build`, frontend) | exit 0 | exit 0 |
| Angular (`node node_modules/@angular/cli/bin/ng.js test --watch=false`) | 230/230, 26 archivos | 236/236, 26 archivos |
| PWA (`npm run test:pwa`, después del build) | 11/11 | 11/11, artefactos/configuración |
| NestJS build (`npm run build`, backend) | exit 0 | exit 0 |
| NestJS (`node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads`) | 265/265, 13 archivos | 275/275, 14 archivos |

Se agregan 6 casos Angular y 10 backend; se refuerza el caso existente de perfil vacío para probar avatar neutro sin foto. Se conservan todos los casos anteriores, sin skip/only y sin bajar aserciones ni ampliar timeout. Node del entorno: v24.15.0. No se instalaron paquetes.

Una ejecución concurrente Angular dio 218/236 y 18 fallos: el primer caso de navegación agotó 5 segundos y dejó una petición pendiente; después hubo fallos derivados de limpieza/TestBed. La misma suite aislada pasó 6/6 y la repetición completa sin builds concurrentes pasó 236/236. No se presenta ese intento fallido como aprobado ni se alteran límites/configuración para ocultarlo. Backend completo final 275/275. Compilaciones sin advertencias de presupuesto; Git puede avisar conversión LF/CRLF de la configuración existente.

## Hallazgos confirmados y correcciones mínimas

| ID | Hallazgo reproducido | Cambio y prueba de regresión |
| --- | --- | --- |
| H-F01 | bcrypt aceptaba diferencias después del byte 72. Reproducción local con dos claves sintéticas del mismo prefijo: compare true. También ocurría con Unicode de menos de 64 caracteres | common/password.ts rechaza >72 bytes UTF-8 antes de hash; DTO público máximo 64 caracteres; formulario compartido añade maximoBytesClaveValidator. B-CLAVE: dos casos fallaban antes; ahora 4/4. B-USR verifica ambas altas y DTO sin guardar. No se cambian hash costo 12, JWT ni claves existentes |
| H-F02 | /estadisticas no figuraba en el interceptor: sus 401 conservaban una sesión inválida en memoria | Añadida ruta privada al mismo interceptor. Tres regresiones 401 fallaron antes y pasan después; 403 conserva sesión |
| H-F03 | nombre/apellido/nombreUsuario con solo espacios pasaban IsNotEmpty, eran recortados por Mongoose y terminaban en 500 | DTO usa Transform trim sin convertir tipos antes de validar. Tres pruebas HTTP reproducían 500; ahora 400 y no se invoca persistencia |
| H-F04 | Dataset ficticio y tipo antiguo sin imports; avatar de perfil predeterminado contenía apellido RÍOS/dorsal 10; footer de desarrollo visible | Retirados publicaciones-demo.ts, models/publicacion.ts y jugador-demo.svg; fallback usa icons/futbolcrack.svg existente. Se refuerza prueba de perfil sin foto. Footer genérico Red de futbolistas; no se borraron datos MongoDB |
| H-D01 | docs/sprint-1.md exigido por el primer enunciado no existía y varias filas de 09 conservaban descripciones antiguas | Recuperada documentación de Sprint 1 como reconstrucción actual; matriz de 44 contrastada con fuente/tests y niveles de evidencia |

El límite de bcrypt es una propiedad de la librería, no un ataque observado contra una cuenta real. Fuente primaria: [README oficial de bcrypt](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns). La corrección impide nuevas altas truncadas; no permite identificar ni reparar retroactivamente hashes antiguos que pudieron crearse con claves largas. No se cambió login para bloquear usuarios históricos ni se hizo reset automático de credenciales.

## Revisión de seguridad

| Área | Evidencia comprobada | Límite/riesgo pendiente |
| --- | --- | --- |
| Contraseñas | bcrypt costo 12; coincidencia compartida; límite bytes corregido; passwordHash select:false y proyecciones positivas | Política de fortaleza/longitud es académica. No se hizo auditoría de credenciales históricas ni reset. No se implementó limitación de intentos (endurecimiento antes de apertura pública) |
| DTO/entrada | whitelist/forbidNonWhitelisted; tipos, contenido, IDs, fechas; espacios obligatorios y máximo de clave corregidos | Nombre/username/fecha de nacimiento públicos mantienen reglas menos estrictas que Angular en algunos casos (p.ej. fecha futura). No se afirma identidad/edad real comprobada |
| JWT/cookie | Firma y exp/iat en tests; 900 s; cookie HttpOnly, Secure y SameSite=None en producción, Lax local, path '/' | Cookies de terceros pueden bloquearse entre dominios. Logout borra cookie pero copia de JWT sigue válida hasta exp si cuenta continúa activa; no hay revocación individual persistente |
| CORS/CSRF | Orígenes explícitos; comparación exacta Origin/Referer; fail closed en sesión/cookie; preflight real de permitido/ajeno | FRONTEND_URL no existe en entorno local inspeccionado por presencia, no por valores. No prueba que falte en Vercel. Hace falta origen frontend real autorizado para integración |
| Roles y bajas | DB actual en AuthGuard y AdministradorGuard; cuenta inactiva rechazada incluso con token previo; registro público fija usuario/activo | Una solicitud que ya pasó el guard puede completar. Todas las cuentas admin protegidas es más restrictivo que preservar solo la última |
| Publicaciones/comentarios | Autor desde JWT; baja autor/admin; editar solo autor, incluso frente a admin; inactivos no visibles | Concurrencia e índices se ensayaron con dobles/intérprete, no con carga real en Atlas |
| Datos sensibles/errores | Respuestas de sesión sin JWT/hash; proyección explícita en listados/autores; 401/403/400/404/409 locales; 500 de DB no se falsea como sesión inválida | Pruebas externas no autenticadas no permiten inspeccionar respuestas administrativas reales. No se imprimieron secretos ni cuerpos con datos reales |
| Producción/PWA | Paquete oficial alineado a core; solo assets; dataGroups vacío; sin patrones API ni colas offline | Registro/cache/install/update en navegador pendientes; confirmar HTTPS/rewrite SPA/env en hosting. API_URL Angular está fijo al backend desplegado, no a Nest local |

No se confirmó un bypass de autenticación/roles ni exposición de hashes en las rutas auditadas. Eso no equivale a un pentest exhaustivo ni una verificación de todas las dependencias. Los riesgos de esta tabla no son vulnerabilidades explotadas demostradas.

## Integración real: qué se ejecutó

| Prueba real no destructiva | Resultado | Lo que NO demuestra |
| --- | --- | --- |
| GET raíz de API desplegada, también desde navegador | 200, identidad FutbolCrack | Login, MongoDB privado ni coincidencia exacta del despliegue con esta rama |
| GET /publicaciones?limit=1&offset=0 | 200, sobre publicaciones/total/offset/limit/hayMas con array | Mutaciones, paginación sobre gran volumen o ausencia de todos los defectos de datos |
| GET /auth/me, /usuarios y /estadisticas/comentarios-totales sin sesión | 401 los tres | Acceso positivo con cookie/admin ni 403 de cuenta común en despliegue |
| OPTIONS /auth/login con Origin localhost:4200 | 204, allow-origin exacto y allow-credentials true | Aceptación/persistencia de cookie entre dominios por el navegador |
| OPTIONS con origen ajeno de prueba | 204 sin allow-origin para ese origen | CSRF de una operación autenticada; se prueba por separado localmente |
| Ping Atlas con configuración existente | ok; conexión sin autoCreate/autoIndex, sin consultas de usuarios ni cambios de índices | Escrituras, restricciones de unicidad reales, planes de agregación o stats con datos reales |
| Ping Cloudinary con configuración existente | ok | Subir archivo, URL entregada y visualización posterior |
| Build local servido en 127.0.0.1:4200 | Proceso escuchando, pero navegador y sonda host no pudieron conectarse (timeout) | Ninguna pantalla, instalación, offline ni responsive se marcan pasados |

Se intentó el servidor en entorno restringido y después autorizado; no se modificaron firewall ni permisos de red para forzar acceso. Se detuvieron los dos servidores temporales de esta auditoría. Las llamadas de prueba no mandaron credenciales de usuarios ni devolvieron cuerpos privados en la evidencia. Para pings, la configuración se cargó internamente y solo se imprimió resultado booleano/código de error; nunca valores secretos.

No se suministró cuenta administrativa ni entorno de ensayo identificado para mutaciones. Por eso no se ejecutaron altas, likes, comentarios, bajas ni uploads sobre producción. El ping real no se mezcla con las pruebas simuladas para declarar flujos completos.

## Matriz manual para navegador (completar antes de entrega)

Usar entorno identificado de pruebas, dos jugadores A/B y un administrador habilitado. Datos ficticios propios marcados como prueba, nunca cuentas o publicaciones ajenas. No proyectar cookies/tokens/hashes al profesor. Registrar fecha, versión, navegador, resultado y evidencia sin secretos para cada fila. Estado inicial de estas filas: pendiente salvo la evidencia parcial de lectura ya indicada.

| ID | Flujo/pantalla | Acción y resultado esperado | Estado/evidencia actual |
| --- | --- | --- | --- |
| M01 | Arranque y rutas | Abrir raíz/login/registro/feed/detalle y recargar rutas; navbar/back/404 controlado. Autorizar inicial, sin blanco ni bucles | No verificado en UI: conexión local bloqueada |
| M02 | Registro/login | Nombres/fecha/clave inválidos, corregir rojo→verde; crear jugador de prueba, duplicado 409, login correcto/incorrecto, mensaje | L pasa; alta/login externos no ejecutados |
| M03 | Cookies entre dominios | Network: login/autorizar con credenciales, atributos HttpOnly/Secure/SameSite y presencia al pedir me; inspeccionar atributos sin mostrar valor | CORS OPTIONS real correcto; cookie navegador no verificada |
| M04 | JWT y renovación | Iniciar sesión; al minuto 10 modal. Ahora no no solicita; Extender emite refrescar y nuevo plazo. Pestaña suspendida; exp a 15 min rechaza | Solo reloj simulado; pendiente navegador/reloj real |
| M05 | Logout | Cerrar sesión desde perfil; cookie desaparece, guard vuelve a login; no prometer revocación del JWT copiado antes de exp | L pasa; pendiente real |
| M06 | Perfil | Datos del jugador A, avatar neutro si falta foto y últimas tres propias con comentarios aislados | L pasa; pendiente real |
| M07 | Publicación/imagen | Título/descripción, JPEG/PNG/WebP válidos y errores; subir archivo sintético en pruebas, recargar y verificar persistencia/URL | Ping Cloudinary real ok; upload no verificado |
| M08 | Likes/orden/páginas | A/B votan/quitan sin duplicados; 23 jugadas de ensayo dan 10/10/3; cambiar orden conserva criterio y reinicia página | API lectura 200; interacción/volumen real pendientes |
| M09 | Baja publicación | En datos de ensayo: autor/admin confirma; Cancelar no DELETE; éxito conserva archivo y retira feed/detalle/comentarios; B ajeno 403 | No ejecutar sobre contenido real; L pasa |
| M10 | Comentarios | Ocho notas: 3/6/8; A edita propia, etiqueta Editado; B/admin ajeno sin permiso. Cancelar sin PUT, foco y texto largo | L pasa; persistencia/concurrencia reales pendientes |
| M11 | Administración | Usuario común 403/aviso; admin lista, crea ambos roles y ve errores; sin hash/contraseña en respuesta | Anónimo real 401; acceso positivo no verificado |
| M12 | Habilitación | Deshabilitar SOLO jugador de ensayo con modal, comprobar JWT previo/login/autorizar/refrescar 401; rehabilitar. Admin/self protegidos 409 | L pasa; pendiente real y política restrictiva explícita |
| M13 | Estadísticas | Cada reporte con rango propio, mismo día/límites/invertido/sin resultados; contrastar MongoDB de ensayo y variar gráfico tras baja de ensayo | Fixtures/pipelines pasan; estadísticas reales autenticadas no verificadas |
| M14 | Instalación PWA | Build producción HTTPS/localhost; esperar worker hasta 30 s; manifest/iconos/standalone; opción Instalar del navegador si existe | 11 tests A pasan; instalación no verificada |
| M15 | Caché/offline/update | Tras primera carga/activación, offline raíz muestra reconexión; sin JSON privado ni colas. Volver online, auth y nuevos datos; probar nueva versión en ensayo | Configuración excluye API; runtime no verificado |
| M16 | Responsive | 360/390/768/desktop, teclado móvil, navbar/tablas/formularios, títulos largos sin scroll global | CSS inspeccionado; no prueba visual real |
| M17 | Accesibilidad | Tab/Enter, labels/errores, foco de modales/editor, Escape/cancelar y regreso de foco; contraste y zoom | DOM/atributos probados; interacción real pendiente |
| M18 | Rechazos y fallos | Sin sesión 401; con rol común 403; 400/404/409 y fallo red/500; 403 preserva sesión y 401 estadísticas redirige | 401 anónimo real y tests locales; resto pendiente en navegador |

## Calidad, arquitectura y preparación

Se conservaron módulos funcionales Auth/Usuarios/Publicaciones/Comentarios, standalone, servicios HTTP centralizados, guards/interceptor, Input/Output y TS/HTML/CSS separados. Los reportes viven en servicios existentes; no se agregaron módulos ni grandes refactors. Likes/bajas usan condiciones de actualización, comentarios referencias y paginación, reportes filtros backend; ningún gráfico descarga todo para contar en Angular.

Se revisaron labels, aria-live/alert/status, aria-current/expanded, modales propios con retorno de foco, reduced-motion y media queries. Esa inspección y DOM no equivalen a evaluación visual/manual completa. Hay comentarios pedagógicos y guía; se agregó explicación de bytes UTF-8 y diferencias 401/403. Residuos de demo retirados del producto; fixtures ficticios de tests se conservan y nunca se usan como fuente productiva. No se encontró un botón del producto conectado a un handler vacío en la revisión de rutas/plantillas.

Riesgos operativos adicionales: subida a Cloudinary ocurre antes del guardado MongoDB; un fallo posterior puede dejar archivo huérfano (riesgo por orden de operaciones, no se observaron/limpiaron recursos reales). Usuarios/reportes administrativos no paginan grupos y rangos largos pueden costar recursos; falta medir índices/planes reales. No se cambió eso con refactors de auditoría.

## Estado de cada sprint y recomendación

| Sprint | Dictamen para entrega |
| --- | --- |
| 1 | Cuatro pantallas, Router, paleta, formularios y conceptos comprobados en fuente/DOM; documentación faltante recuperada. Comparación con CineBera inspeccionada como adaptación de conceptos; no se certifica copia literal histórica. Responsive visual pendiente |
| 2 | Implementación local completa salvo evidencia de upload real; lectura API real disponible, escritura/Cloudinary y concurrencia de base pendientes |
| 3 | Flujos locales probados; corregidos 401 de reportes. Cookies entre sitios, reloj/pestaña real y renovación/logout completos requieren M03–M05 |
| 4 | Administración/reportes/pipes/directivas locales; baja de admins restringida por política 5A. PWA configurada por artefactos, sin instalación/worker real ni gráficos/móvil reales comprobados |

Antes de entregar: completar la matriz manual con versión de frontend/backend identificada, resolver aceptación docente de S4-04 y del alcance offline limitado, confirmar origen/frontend/HTTPS y disponibilidad de admin de ensayo, conservar documentación y adjuntar resultados sin secretos. Usar [12-GUIA-DE-DEMOSTRACION.md](12-GUIA-DE-DEMOSTRACION.md). No hace falta agregar funcionalidades fuera del TP para cerrar esos ensayos. No se hizo merge ni deploy y los cambios 5D esperan revisión.

## Seguimiento 5E — conservar el dictamen histórico

El cuerpo anterior conserva resultados y pendientes tal como estaban al cerrar 5D (39/4/0/1). La validación posterior [13-VALIDACION-INTEGRADA.md](13-VALIDACION-INTEGRADA.md) aporta integración real autorizada en localhost/Atlas QA/Cloudinary QA: S2-02 pasa a Cumple y la matriz vigente 09 queda 40 Cumple / 3 Parcial / 0 No cumple / 1 No verificado. Worker NORMAL y shell sin servidores comprobados, pero instalación/actualización/caché y cookies cross-site aún pendientes. No interpretar las filas históricas M01–M18 anteriores como resultado actual: ver su ejecución 5E en 13. No se certifica entrega integral ni se hizo merge/deploy.
