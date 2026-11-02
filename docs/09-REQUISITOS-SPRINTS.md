# 09 — Requisitos, trazabilidad y plan

## Fuentes y criterio de aceptación

Se usa el resumen de Sprints 2, 3 y 4 del adjunto «Tarea 0» y los requisitos generales obligatorios enviados el 31/10/2026. No se recibieron los enunciados oficiales completos: sus detalles adicionales y nombres exactos de módulos obligatorios siguen sin contrastarse. Las tres métricas quedaron definidas por Tarea 5B y ya no son desconocidas. Las propuestas no amplían automáticamente el alcance autorizado.

Estados: **Implementado en código** = existe, sin afirmar integración externa; **Parcial** = falta parte del criterio; **Pendiente** = no existe implementación; **No verificado** = falta evidencia/detalle. Ninguna funcionalidad se considera aceptada solo porque compila. Para cerrar cada fila se debe comprobar alcance, validaciones, permisos, mensajes, regresión, documentación y pruebas o limitaciones claramente identificadas.

Los caminos de esta matriz parten de la raíz. Para controllers/services/métodos exactos y modelos, ver [00](00-MAPA-DEL-PROYECTO.md). El estado de ejecución y comandos está en [08](08-PRUEBAS-Y-DESPLIEGUE.md).

## Estado vigente después de la aceptación 5F

42 Cumple / 1 Parcial / 0 No cumple / 1 No verificado. Cumple refiere a código y criterio local comprobados, no aceptación de producción. Las 44 filas se contrastaron con fuentes y suites reales. Detalle, niveles I/L/A/R y matriz manual en [11-AUDITORIA-FINAL.md](11-AUDITORIA-FINAL.md). La evidencia integrada 5E está en [13-VALIDACION-INTEGRADA.md](13-VALIDACION-INTEGRADA.md); S2-02 cambió con upload, persistencia y lectura reales. En 5F, S4-04 y S4-08 pasan a Cumple con autorización y evidencia en [14-ACEPTACION-FINAL.md](14-ACEPTACION-FINAL.md). Los párrafos históricos siguientes no sustituyen este dictamen; G-15 se evalúa como criterio histórico de Tarea 0.

## Sprint 2

| ID    | Requisito                                           | Estado                                                 | Evidencia / archivos actuales                                                                 | Trabajo pendiente                                                                                         | Criterio y prueba de aceptación                                                                                  |
| ----- | --------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| S2-01 | Título, descripción e imagen | Cumple | CreatePublicacionDto; PublicacionesService.crear; Publicaciones; B-PUB, F-FEED | Imagen opcional; carga real aprobada en 5E M07. | L: textos obligatorios, tipos/límites, FormData y autor desde JWT |
| S2-02 | Subida de imagen | Cumple | CloudinaryService.subirImagen; FileInterceptor; B-CLOUD, B-PUB; ensayo 5E M07 | QA local con Atlas y Cloudinary reales aprobado; no certifica despliegue. | L: firmas/tamaño/carpeta; R: multipart API y formulario, URL persistida, imagen HTTP 200; docs/13 y evidencias-5e |
| S2-03 | Orden por fecha o likes | Cumple | ListarPublicacionesDto; consultarListado; cambiarOrden; B-PUB, F-INT | 5E: orden likes y 23 registros reales de QA comprobados por HTTP. | L: sort/empates y query fecha/likes; reinicio offset |
| S2-04 | Paginación backend offset/limit | Cumple | PublicacionesService.consultarListado; ListarPublicacionesDto; B-PUB, F-INT | 5E: 23 registros reales en Atlas dan 10/10/3; plan de ejecución no medido. | L: match/facet/skip/limit, 23 registros 10/10/3; R: sobre API 200 |
| S2-05 | Filtro por usuario | Cumple | consultarListado; MiPerfil.cargarPublicaciones; B-PUB, F-PERFIL | No se descarga el feed para filtrar en Angular. | L: filtro autor anterior al límite y usuarioId real |
| S2-06 | Componente individual | Cumple | PublicacionCard; plantillas feed/perfil/detalle; F-CARD, F-APP | Hijo sin HttpClient; detalle ya implementado. | L: DOM, datos y eventos con mismo objeto |
| S2-07 | Likes sin duplicados | Cumple | PublicacionesService.cambiarMeGusta; AccionesPublicaciones; B-PUB, F-INT | Concurrencia MongoDB real pendiente M08. | L: addToSet/pull condicionados y bloqueo doble clic |
| S2-08 | Baja lógica autor/admin | Cumple | PublicacionesService.darDeBaja; ConfirmacionBaja; B-PUB, B-EST, F-INT | No se retiró contenido real. | L: 403 ajeno, baja conserva documento, cancelar sin DELETE |
| S2-09 | Perfil: últimas tres y comentarios | Cumple | MiPerfil; PublicacionCard; ComentariosPublicacion; F-PERFIL | Avatar ficticio sustituido por escudo; M06 pendiente. | L: limit 3, orden, filtro y comentarios por id |

## Sprint 3

| ID    | Requisito                                     | Estado    | Evidencia / archivos actuales                                                                     | Trabajo pendiente                                                                                     | Criterio y prueba de aceptación                                                                          |
| ----- | --------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| S3-01 | Detalle por id | Cumple | PublicacionDetalle; obtenerPorId; app.routes; F-DET, B-PUB | Arranque global aplica política de sesión 4C; componente/API permiten lectura pública. | L: URL directa/router, id inválido, ausente/inactivo y texto completo |
| S3-02 | Paginación de comentarios | Cumple | ComentariosService.listar; ComentariosPublicacion; B-COM, F-COM | No se reemplaza la colección al cargar más. | L: aggregate/offset/limit y anexado 3/3/2 |
| S3-03 | Editar propio y etiqueta | Cumple | ComentariosService.editar; formulario edición; B-COM, F-COM | Administrador ajeno tampoco puede reescribir comentario. | L: autor en backend, PUT, modificado y Cancelar sin PUT |
| S3-04 | JWT 15 minutos | Cumple | SeguridadModule; sesion.constants; sesion-cookie; B-AUTH | Firma real de prueba; no se mostró token productivo. | L: JWT real exp-iat=900 y cookie alineada |
| S3-05 | Autorización inicial | Cumple | AuthController.autorizar; AuthGuard; AuthService; B-AUTH, B-USR, F-SES | R: GET me sin sesión 401; POST con cookie real pendiente. | L: cookie válida 200 sin nueva emisión; inválida/baja 401 |
| S3-06 | Renovación voluntaria | Cumple | AuthController.refrescar; AuthService.refrescar; B-AUTH, F-AUTH, F-SES | No renueva un token vencido; M04 pendiente. | L: token vigente, nuevo exp/cookie solo por acción |
| S3-07 | Pantalla de carga | Cumple | App; app.html; signals cargandoSesion/errorInicial; F-SES | Error de red conserva explicación; no simula acceso offline. | L: outlet bloqueado durante autorizar y error/reintento |
| S3-08 | Redirección por 401 | Cumple | sesionInterceptor; AuthService.invalidarSesion; F-HTTP | Tres nuevas regresiones fallaban antes de incluir /estadisticas. | L: 401 protegido invalida; 403/500 conserva; estadísticas corregidas en 5D |
| S3-09 | Aviso minuto 10 | Cumple | AuthService temporizadores y revisión focus/visibility; F-AUTH | Suspensión de pestaña real pendiente M04. | L: reloj simulado a exp menos cinco minutos |
| S3-10 | Modal extender sesión | Cumple | ExtenderSesion; App.extenderSesion; F-SES, F-EXT | API dialog sustituida en DOM de tests; M04 pendiente. | L: Extender/refrescar, Ahora no sin HTTP, errores y expiración |

## Sprint 4

| ID    | Requisito                                             | Estado                                    | Evidencia / archivos actuales                                                           | Trabajo pendiente                                                                           | Criterio y prueba de aceptación                                                                                |
| ----- | ----------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| S4-01 | Moderación admin de cualquier publicación | Cumple | darDeBaja; acciones/modal compartidos; B-PUB, B-EST, F-INT | Endpoint DELETE existente; sin duplicado administrativo. | L: admin retira ajena, feed/detalle/comentarios/reportes excluidos |
| S4-02 | Dashboard usuarios | Cumple | DashboardUsuarios; administradorGuard; UsuariosController; B-USR, F-USR, F-GUARD | No hay cuenta admin de ensayo suministrada: M11. | L: URL/roles, tabla/formulario/estados y errores |
| S4-03 | Alta administrativa con rol | Cumple | CrearUsuarioAdministrativoDto; crearAdministrativo; B-USR, F-USR | Hash compartido y límite UTF-8 corregido; registro público no escala rol. | L: usuario/admin, radios, duplicados, campos prohibidos y sin hash |
| S4-04 | Deshabilitar y rehabilitar | Cumple | Usuario.activo; UsuariosService.deshabilitar/deshabilitarAdministrador/habilitar; AuthGuard; B-USR, F-USR; aceptacion-admin-qa.mjs | Política 5F autorizada: otro administrador permitido; propia y último activo protegidos; Atlas requiere transacciones. | L: permisos, estado/identidad; R: cinco carreras con un activo, JWT previo 401, rehabilitación y modal UI; docs/14 |
| S4-05 | Rol validado en Nest | Cumple | AuthGuard; AdministradorGuard; controllers administrativos; B-USR, B-EST | Frontend solo controla presentación. | L: 401/403/200 y rol vigente de DB, no claim antiguo; R: anónimo 401 |
| S4-06 | Tres estadísticas por fechas | Cumple | publicacionesPorUsuario; totalEnRango; porPublicacionEnRango; B-EST, F-EST | Pipelines probados con intérprete/fixtures; ejecución autenticada real pendiente M13. | L: match/group/lookup/facet/count, fechas y exclusión de bajas |
| S4-07 | Gráficos distintos | Cumple | DashboardEstadisticas TS/HTML/CSS; F-EST | No se hizo inspección visual móvil real. | L: barras/línea/dona, tablas y actualización independiente |
| S4-08 | PWA instalable/offline | Cumple | ngsw-config; manifest; app.config; iconos; PWA; docs/evidencias-5f | Aceptado en QA localhost; no certifica hosting HTTPS productivo. | A: 11/11; R: Edge instalada, worker NORMAL, nueva versión, shell sin servidores/recuperación, Cache Storage tras logout 24 estáticos sin API; docs/14 |
| S4-09 | Exactamente tres pipes | Cumple | TruncatePipe; FechaRelativaPipe; InicialesPipe; F-PIPES, F-CARD, F-COM | Fecha relativa pura sin timer, fecha exacta accesible. | I/L: tres declaraciones e imports/uso real; vacíos/invalidos y límites |
| S4-10 | Exactamente tres directivas | Cumple | ResaltarAutorDirective; AutoFocusDirective; PermisoRolDirective; F-DIR, F-COM | PermisoRol no sustituye guards Nest. | I/L: tres declaraciones, foco/clase/rol y cambios de sesión |

## Requisitos generales obligatorios

| ID   | Requisito                                                                         | Estado                           | Evidencia / archivos actuales                                                          | Trabajo pendiente                                                                                        | Criterio y prueba de aceptación                                                                          |
| ---- | --------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| G-01 | Arquitectura y reutilización | Cumple | Usuarios/Publicaciones/Comentarios/Auth; componentes/services; B-EST, F-CARD, F-PERFIL | Se retiran dataset/tipo de demo sin uso; no se crean módulos nuevos. | I/L: módulos reales, contratos HTTP y servicios compartidos |
| G-02 | Diez publicaciones por página | Cumple | Publicaciones.limit=10; PublicacionesService; B-PUB, F-INT | Otros consumidores (perfil limit 3) conservan su contrato. | L: solicitudes offset 0/10/20 y remanente |
| G-03 | Páginas numeradas | Cumple | Publicaciones.irAPagina; plantilla paginación; F-INT | Teclado/móvil real pendiente M16/M17. | L: números 1/2/3, ventana/extremos y aria-current |
| G-04 | Input/Output por publicación | Cumple | PublicacionCard y contenedores; F-CARD, F-PERFIL, F-DET | No hay HTTP en la tarjeta. | L: Output like/baja/detalle y mismo Input |
| G-05 | Modal propio antes de baja | Cumple | ConfirmacionBaja; ConfirmacionUsuario; F-INT, F-USR, F-MODAL | Sin alert/window.confirm; no se ejecutaron bajas productivas. | L: nombre/título, cancelar/Escape sin solicitud, envío único |
| G-06 | Notificaciones de resultado | Cumple | AccionesPublicaciones; ComentariosPublicacion; DashboardUsuarios; F-INT, F-COM, F-USR | No se confunde 403 con expiración. | L: éxito tras respuesta y error conserva borradores/colección |
| G-07 | Truncate y Ver más/menos | Cumple | TruncatePipe; tarjeta/comentarios; F-PIPES, F-CARD, F-COM | Cuenta una sola vez entre los tres pipes. | L: límite/exactitud/expandir y aria-expanded |
| G-08 | Comentarios recientes e inicial 3 | Cumple | ComentariosService.listar; servicio Angular; B-COM, F-COM | No ordena por updatedAt después de editar. | L: createdAt/_id descendente, limit 3 |
| G-09 | Anexar otros tres comentarios | Cumple | cargarComentarios; siguienteOffset y Map por id; F-COM, B-COM | Concurrencia real pendiente M10. | L: 3/6/8, no duplicados, errores conservan anteriores |
| G-10 | Relaciones y autoría en Nest | Cumple | ComentarioSchema; ComentariosService.editar; B-COM | No se confía en autor/publicacion del body. | L: ObjectId/referencias, autor del JWT, admin ajeno 403 |
| G-11 | Desde/Hasta válidos | Cumple | RangoFechasDto/construirRango; formularios; B-EST, F-EST | Backend obligatorio; no basta validación visual. | L: calendario real, formatos, vacíos/invertidos y sin HTTP inválido |
| G-12 | Filtro MongoDB y horas inclusivas | Cumple | pipelineVisibles; publicacionesPorUsuario; construirRango; B-EST | UTC-03 fijo; B/C usan creación de comentario; M13 real pendiente. | L: gte inicio, lt siguiente día y milisegundos límite |
| G-13 | Documentación pedagógica por tarea | Cumple | docs/00,08,09,10,11,12,guia-angular y sprint-1; I y revisión de enlaces/inventario | Se recupera sprint-1.md faltante; comparación CineBera inspeccionada, no se afirma copia literal. | I: archivos, flujo, pruebas, límites y recorrido docente |
| G-14 | Criterio de cierre integral | Parcial | Suites/builds y matrices M01-M18; docs/13 y docs/14 | Pendiente HTTPS entre sitios con despliegue QA autorizado y revisión manual residual M17/M18/teléfono físico. | L/A/R: 237 Angular, 278 Nest, 11 PWA, HTTP real 14/14, JWT con reloj real, responsive 4 tamaños y PWA instalada/caché/update |
| G-15 | Auditoría inicial sin implementación/secretos/merge/deploy | No verificado | Historia docs/auditoria-inicial y primer commit docs c8383c9; Inspección git log/show | Requisito histórico Tarea 0: no hay checkpoint exclusivo que permita certificar retrospectivamente toda su ejecución. En 5D sí se conservó la base y no se hizo merge/deploy. | I: primer commit con docs también agrupa cambios posteriores |

## Límites del material oficial

No se fijan como hechos oficiales el largo máximo de comentario, las tres métricas exactas, los nombres de módulos adicionales, los diseños de gráficos ni las rutas nuevas. Los documentos 04–07 los señalan como propuestas o No verificado. La existencia de demo con video, prueba de club o CV no obliga a agregar nuevas funcionalidades fuera de los sprints recibidos.

## Orden recomendado de implementación

Cada paso es una tarea posterior que necesita aprobación; nada se implementa en esta auditoría.

1. **Recuperar una base de pruebas confiable — completado para las suites existentes en Tarea 1.** Angular 20/20 y Nest 2/2 con HTTP/dobles de servicio, sin dependencias nuevas. Ampliar cobertura según las próximas funcionalidades; no confundir estas pruebas con integración productiva.
2. **DTO básico y listado seguro — completados en Tarea 2.** La creación actual usa DTO de contenido y el padrón exige administrador vigente. Título/imagen y ampliación de contrato del Sprint 2 siguen pendientes; conservar compatibilidad al incorporarlos.
3. **Completar el listado real.** Offset/limit, total, orden, filtro por usuario y páginas numeradas de 10; pruebas con 23 registros.
4. **Reutilizar la tarjeta y agregar TruncatePipe.** Input/Output y expansión del texto; registrar que ya cuenta para S4.
5. **Integrar imágenes de publicación y likes.** Reutilizar Cloudinary, evitar duplicados, probar concurrencia y mensajes.
6. **Implementar baja lógica con autorización y modal compartido.** Mismo servicio para autor/admin; resultado claro y filtros consistentes.
7. **Completar detalle/comentarios y perfil real.** Cargas 3 en 3, anexado, edición de autor/Editado y últimas tres propias con comentarios.
8. **Completar ciclo de sesión Sprint 3.** 15 minutos y cookie alineada, POST autorizar/refrescar, carga/401, aviso de 10 minutos y modal. El TTL de prueba puede priorizarse antes si impide validar los pasos anteriores, pero cambiarlo requiere una tarea explícita.
9. **Administración y habilitación.** Rol backend, alta administrativa y estado de usuarios con política para JWTs vigentes; reutilizar usuarios/publicaciones.
10. **Reportes y gráficos.** Primero obtener las métricas oficiales, después rangos/consultas y tres visualizaciones variadas.
11. **Completar pipes/directivas y PWA.** Los dos pipes restantes, tres directivas útiles y caché segura; documentación y regresión en cada paso.

## Primera tarea pequeña y segura — completada en Tarea 1

**Propuesta original de auditoría: aislar la prueba de UsuariosController.** La tarea consistía en modificar solo `backend/src/usuarios/usuarios.controller.spec.ts` para proporcionar un doble de UsuariosService y simular el guard si corresponde, sin abrir conexión a Atlas ni modificar controller/service. Agregar una comprobación de que findAll delega al servicio y devuelve su resultado. Ejecutar npm test y registrar el resultado en 08/09/10.

Resuelve un fallo concreto y reproducible (UsuarioModel ausente) con riesgo bajo sobre comportamiento productivo. No convierte al endpoint en administrativo ni corrige permisos: esos cambios van en tareas separadas y con pruebas propias.

## Actualización verificada de Tarea 1

El estado de ejecución de las suites cambió de fallido a aprobado: 20/20 en Angular y 2/2 en Nest. Se actualizó la evidencia de G-14, pero su estado global sigue Parcial: integración externa y aceptación de funcionalidades siguen sin comprobarse. No se adelantó ningún requisito funcional de Sprints 2, 3 o 4 por modificar tests. Las causas y pruebas exactas están en 08 y la bitácora de 10.

## Actualización verificada de Tarea 2

| Alcance                                 | Estado y evidencia                                                                                                                                               | Qué sigue pendiente                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| GET usuarios exclusivo de administrador | Implementado: AuthGuard + AdministradorGuard consulta rol actual; HTTP local 401/403/200, rol libre/retirado rechazado y proyección sin credenciales verificada. | Dashboard, alta administrativa, habilitación y otras operaciones de Sprint 4.  |
| DTO de contenido actual                 | Implementado: CreatePublicacionDto y ValidationPipe existente; 201/400/401 comprobados y sin guardado ante rechazo.                                              | Título, imagen, paginación y resto de Sprint 2.                                |
| Regresión recuperada                    | Frontend 20/20 sin cambios y backend 29/29, compilaciones correctas.                                                                                             | Prueba con base de ensayo/despliegue y pendientes históricos ajenos a Tarea 2. |

Se actualiza evidencia de S2-01, S4-02, S4-05 y G-14, sin declarar completos los sprints. JWT, cookies, registro público y contratos Angular no se modificaron. H02/H04 de auditoría quedan corregidos en el alcance local de esta tarea; H03 queda mitigado para el padrón restringido y su selección de campos.

## Actualización verificada — Tarea 3A

Implementado: título obligatorio (1–120), descripción obligatoria (1–2000), imagen opcional JPEG/PNG/WebP de hasta 5 MiB y activo true. Se conserva contenido como alias y se adapta el GET antiguo sin migración. El POST solo contenido ahora es inválido; se adaptó el formulario y se debe desplegar la pareja API/frontend de forma coordinada.

DELETE /publicaciones/:id retira lógicamente por autor o administrador actual, con 403/404 apropiados, sin borrar documento/imagen. No se implementó interfaz de baja porque el modal pertenece a 3C; por eso S2-08 y S4-01 siguen parciales aunque el backend esté probado.

No se implementaron likes, paginación, filtro/selector de orden, comentarios, TruncatePipe o nueva tarjeta real Input/Output. La ordenación por fecha y el límite 50 preexistentes se conservan, no cumplen la futura paginación de 10.

Regresión: las suites de 3A pasan FE 32/32 y BE 59/59. La prueba externa y los requisitos restantes mantienen su estado pendiente/no verificado. La creación e imagen ya no están pendientes de código como indicaba el plan inicial; su ensayo real y compensación de archivos huérfanos sí lo están.

## Actualización verificada — Tarea 3B

Se implementaron lógica de likes, orden fecha/likes con desempates, filtro usuarioId y paginación real offset/limit en el backend. El servicio Angular consume el sobre y prepara métodos de likes; no se agregaron botones, selector ni paginador visual. S2-03/S2-07 siguen parciales por UI, aunque su lógica esté probada localmente. S2-04/S2-05 distinguen API implementada de ensayo externo y uso en perfil pendientes.

Base limpia 7b740f4 de 3A ya confirmada. Rama feature/publicaciones-likes-paginacion, sin commits nuevos ni merge/deploy. Regresión antes: FE 32/32, BE 59/59; después: FE 35/35, BE 95/95. Se mantienen los 44 IDs de la matriz; no se adelantan comentarios, sesión Sprint 3, reportes, pipes, directivas ni PWA.

El plan histórico se actualiza así: imágenes y baja backend quedaron implementadas en 3A; listado/likes backend y transporte Angular en 3B. Sigue 3C con tarjeta Input/Output, controles/mensajes, paginador numerado y modal propio de baja según su enunciado autorizado. La baja de publicaciones sigue sin UI y requiere confirmación al incorporarla. DELETE de likes solo revierte el voto propio; no borra una publicación ni se expone aún desde UI.

No se declara completo el Sprint 2: continúan pendientes los criterios visuales y de integración externa. Evidencia, contratos y pruebas en 00/03/08/10.

## Actualización verificada — Tarea 3C

Implementados localmente: tarjeta real compartida Input/Output, botones de likes y errores, selector de orden, navegación numerada con diez registros reales por consulta, baja con modal propio y mensajes, últimas tres publicaciones propias de Mi Perfil y TruncatePipe con expansión. No cambia contrato/backend de 3A/3B ni autenticación.

S2-09 permanece parcial exclusivamente por comentarios pendientes de Sprint 3 e integración externa. S3-01 detalle sigue pendiente: la tarjeta prepara Output pero no habilita un enlace a pantalla inexistente. S4-09 avanza a uno de tres pipes; no se atribuyen directivas propias por utilizar @if/@for. El resto de Sprints 3/4 no se adelanta por terminar esta interfaz.

La aprobación de esta tarea autoriza guardar 3B localmente: commit 71c0525 y nueva rama feature/publicaciones-interfaz. No se confirma 3C ni se integra automáticamente. Se conservan los 44 IDs únicos. Resultados 60/60 FE, 95/95 BE; navegador/Atlas/Cloudinary/despliegue siguen No verificado. El plan histórico de tarjeta, paginador, likes e interfaz de baja queda cumplido en el alcance local; siguen detalle/comentarios y demás requisitos autorizados en próximas tareas.

## Actualización verificada — Sprint 3, Tarea 4A

Se recibió y ejecutó la consigna concreta de backend Comentarios: modelo relacionado, POST de alta, GET paginado y PUT de edición solo propia. El nombre de marca aprobado es modificado y la ruta de edición es PUT, reemplazando las propuestas históricas PATCH/editado de auditoría. Máximo de texto 1000 unidades UTF-16, decisión técnica documentada; lectura pública y escrituras con AuthGuard existente.

S3-02/S3-03 y G-08/G-09 siguen parciales porque faltan interfaz, anexado y etiqueta Editado. G-10 identifica el backend implementado sin afirmar UI terminada. No se avanzó detalle de publicación, sesión/refresco/avisos, administración, reportes ni otros requisitos de Sprint 4. No se implementó eliminación de comentarios.

Inicio limpio main 9224cad con Sprint 2 guardado por el usuario; rama feature/comentarios-backend, sin commits nuevos. Base FE 60/60 y BE 95/95; final FE 60/60 y BE 157/157 con archivos en serie, ambas compilaciones correctas. Se conservan 44 IDs únicos y toda la documentación previa. Detalles, ejemplos y límites de concurrencia en 04/08/10. Angular, JWT/cookies y lógica de likes/baja permanecen sin cambios.

## Actualización verificada — Sprint 3, Tarea 4B (01/11/2026)

Implementados localmente detalle, servicio Angular de comentarios, alta validada, anexado de tres en tres sin duplicados, edición propia con Editado y comentarios asociados a las últimas tres publicaciones de Mi Perfil. GET /publicaciones/:id se incorporó de forma mínima y probada porque el listado anterior no podía filtrar por id; no se descarga el feed completo.

Se conserva backend de comentarios 4A y contratos previos. S3-01/02/03 y S2-09 avanzan al estado local implementado, con aceptación externa No verificado. No se considera completo Sprint 3: JWT/renovación/autorizar/refrescar/avisos/modal temporal/401 global continúan para 4C, sin cambios en esta tarea. TruncatePipe se reutiliza y sigue contando uno de tres de Sprint 4.

Base verificada FE 60/60, BE 157/157 y builds correctos; respaldo autorizado 70622bb de 4A. Rama feature/comentarios-interfaz, sin commit de 4B, merge ni deploy. Final FE 97/97 (13 suites), BE 162/162 (8 suites, en serie), ambos builds correctos. Se mantienen 44 IDs únicos de trazabilidad. Prueba contra Vercel/Atlas/Cloudinary/cookies/CORS y visualización en dispositivos siguen pendientes; límites de offset y consistencia entre colecciones conservados en 04.

## Actualización verificada — Sprint 3, Tarea 4C (01/11/2026)

Implementados localmente: JWT/cookie de 15 minutos, POST autorizar/refrescar con cookie vigente y usuario existente, carga inicial, recuperación al recargar, aviso a exp menos cinco minutos, renovación voluntaria, Ahora no, vencimiento/401 y modal. Se conserva navegación al detalle y las funcionalidades de publicaciones/comentarios. API/frontend comparten metadatos y no exponen JWT a JavaScript.

**Límite de aceptación explícito:** Usuario no tiene habilitado/activo ni gestión de bajas de cuenta. No se agrega Sprint 4 para resolverlo; autorizar/refrescar verifican existencia/ficha actual pero el rechazo específico de un usuario deshabilitado queda pendiente del modelo. La prueba de inexistente no se presenta como prueba de deshabilitado. S4-04 y demás funcionalidades de Sprint 4 siguen pendientes.

CSRF deja de permitir cabeceras de origen ausentes en operaciones de sesión/escrituras con cookies; compara Origin o Referer exactos con la lista compartida de CORS. SameSite de producción sigue None con Secure. No se atribuye la protección a CORS por sí solo.

Base limpia main 0d94da5, 4B ya guardado por el usuario; rama feature/renovacion-sesion sin commits nuevos, merge ni deploy. Base FE 97/97 y BE 162/162; final FE 138/138 y BE 187/187 (en serie con pool threads), ambas compilaciones correctas. Se mantienen 44 IDs únicos.

El alcance de sesión está listo para validación integrada local/ensayo, pero no se da por cerrado Sprint 3 en producción: falta comprobar navegador/BD/Vercel/cookies/CORS, y explicitar la política de habilitación con el modelo futuro. No se implementan refresh tokens persistentes, revocación ni reportes/administración/PWA del Sprint 4.

## Actualización 5A — Estado vigente

S4-02/03/04/05 y S3-05/06 tienen evidencia local nueva. La limitación histórica de 4C sobre ausencia de habilitación queda superada por activo y consulta de ficha en cada endpoint protegido. G-05/G-06 (confirmación/notificaciones) se aplican también a bajas de usuarios, sin declarar completo todo el proyecto. G-14 registra 162/162 frontend y 223/223 backend. No se modifican los IDs ni se considera cerrado Sprint 4.

Política aceptada en esta implementación: la baja rechaza todas las cuentas administradoras y la cuenta propia; es más restrictiva que proteger solo al último. Las cuentas antiguas sin activo siguen habilitadas. Ejemplo: el secretario suspende un jugador con confirmación, la ficha se conserva y su carnet/JWT anterior ya no permite entrar; al rehabilitarlo recupera el acceso.

Pendientes S4-06/07/08/09/10: estadísticas con Desde/Hasta y filtros MongoDB, gráficos variados, PWA, dos pipes adicionales a TruncatePipe y tres directivas propias. No se implementan en 5A. Quedan integración externa y validación visual real de lo ya desarrollado.

## Actualización 5B — Evidencia vigente

5B define las tres métricas antes no verificadas: publicaciones por usuario, total de comentarios y comentarios por publicación. S4-06/S4-07 y G-11/G-12 implementados localmente; S4-01 refuerza evidencia sin duplicar bajas. Todos los reportes tienen Desde/Hasta propios y filtros MongoDB. UTC−03:00 es offset fijo, no zona histórica propuesta en auditoría. Se excluyen publicaciones retiradas y sus comentarios; no existe estado independiente de comentarios.

Builds correctos, 181/181 frontend y 265/265 backend. Persistencia simulada: integración externa pendiente. Los estados históricos se conservan como antecedentes, no sustituyen filas vigentes.

Restan S4-08 PWA, S4-09 dos pipes adicionales (TruncatePipe ya es uno de tres) y S4-10 tres directivas propias. No se implementan en 5B; tampoco se adelanta despliegue ni validación visual manual.

## Actualización 5C — Estado vigente y cierre de alcance

Se implementan los tres pipes y tres directivas de S4-09/10, con uso real y pruebas. S4-08 tiene configuración oficial PWA y artefactos comprobados; la instalación/worker activo en navegador se mantiene pendiente, no se presenta como aceptación completa. La matriz conserva sus IDs y no crea requisitos para funcionalidades ajenas.

Alcance funcional solicitado a lo largo de las tareas: implementado localmente. **Los cuatro sprints no se declaran cerrados/verificados integralmente**: la matriz resume material recibido y no sustituye enunciados oficiales completos; faltan ensayos de integración anteriores, navegador/dispositivos y aceptación runtime de PWA. No hay merge ni despliegue. G-14 mantiene esa distinción.

Compatibilidad con sesiones: no hay cambios backend ni reglas de caché API; se conservan cookies/JWT y suites existentes. Las restricciones de baja de todas las cuentas administradoras en 5A y las métricas de visibilidad actual de 5B siguen vigentes. PWA solo guarda interfaz estática; no implementa operaciones offline.

## Seguimiento visual — contador de comentarios, 2026-11-02

Se agrega cantidadComentarios al contrato de lectura de publicaciones y un indicador en la tarjeta reutilizada; Input desde el padre y Output totalActualizado desde los comentarios mantienen sincronizados perfil/detalle. Extiende las evidencias de componente reutilizable/comunicación y comentarios; no cambia el estado de los 44 requisitos ni certifica el QA HTTPS pendiente. Detalle y prueba manual en 03/04; resultados automatizados en 08 y bitácora.

## Seguimiento visual — Agregar comentario, 2026-11-02

Se reutiliza el Output abrirDetalle de PublicacionCard para navegar al detalle desde Agregar comentario, con habilitación equivalente al like. Sin cambios de estados de requisitos ni de autorización de backend. Evidencia Angular de permisos visuales y navegación compartida en 08; no certifica ensayo HTTPS o navegador real.
