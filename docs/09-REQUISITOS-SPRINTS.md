# 09 — Requisitos, trazabilidad y plan

## Fuentes y criterio de aceptación

Se usa el resumen de Sprints 2, 3 y 4 del adjunto «Tarea 0» y los requisitos generales obligatorios enviados el 31/10/2026. No se recibieron los enunciados oficiales completos: sus detalles adicionales, los nombres exactos de módulos obligatorios y la identidad precisa de los tres reportes son **No verificado**. Las propuestas no amplían automáticamente el alcance autorizado.

Estados: **Implementado en código** = existe, sin afirmar integración externa; **Parcial** = falta parte del criterio; **Pendiente** = no existe implementación; **No verificado** = falta evidencia/detalle. Ninguna funcionalidad se considera aceptada solo porque compila. Para cerrar cada fila se debe comprobar alcance, validaciones, permisos, mensajes, regresión, documentación y pruebas o limitaciones claramente identificadas.

Los caminos de esta matriz parten de la raíz. Para controllers/services/métodos exactos y modelos, ver [00](00-MAPA-DEL-PROYECTO.md). El estado de ejecución y comandos está en [08](08-PRUEBAS-Y-DESPLIEGUE.md).

## Sprint 2

| ID    | Requisito                                           | Estado                                                 | Evidencia / archivos actuales                                                                 | Trabajo pendiente                                                                                         | Criterio y prueba de aceptación                                                                                  |
| ----- | --------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| S2-01 | Publicación con título, descripción e imagen        | Implementado localmente; externo No verificado         | Modelo, CreatePublicacionDto, servicio y formulario actualizados en 3A                        | Probar contra entorno de ensayo y coordinar despliegue; documentos antiguos normalizados solo en lectura. | Nuevos campos obligatorios, imagen opcional y sin elección de autor por cliente; pruebas HTTP/Angular aprobadas. |
| S2-02 | Subida de imagen de publicación                     | Implementado localmente; Cloudinary real No verificado | CloudinaryService.subirImagen reutilizado, carpeta publicaciones y validación de firma/tamaño | Ensayo con cuenta real y evaluar compensación si falla save después de subir.                             | JPEG/PNG/WebP hasta 5 MiB; exceso 413, formato inválido 400, sin guardado ante fallo.                            |
| S2-03 | Listar por fecha o cantidad de likes | Implementado localmente; externo No verificado | Selector recientes/populares, DTO/consulta 3B; cambiarOrden vuelve a offset 0 | Ensayo integrado en base/navegador real. | El selector envía fecha/likes, resultados ordenados y empates backend comprobados localmente. |
| S2-04 | Paginación backend offset/limit | Implementado localmente; MongoDB real No verificado | DTO, aggregate con match/facet/skip/limit y total; sobre tipado Angular | Ensayo con base real; navegación visual pertenece a 3C. | 23 registros dan 10/10/3 y total 23; offsets y límites inválidos 400. |
| S2-05 | Filtro de publicaciones por usuario | Implementado localmente; externo No verificado | DTO/consulta 3B y MiPerfil.cargarPublicaciones con usuarioId real | Ensayo contra base real. | Se filtra antes de limitar; perfil solicita fecha/offset 0/limit 3 del usuario autenticado. |
| S2-06 | Componente individual de publicación | Implementado localmente | PublicacionCard real compartido en feed/perfil; Input y Outputs de like/baja/detalle | Habilitar detalle al implementar Sprint 3; ensayo navegador. | Datos recibidos por Input; acciones emitidas sin HTTP dentro del hijo. |
| S2-07 | Dar/quitar likes sin duplicados | Implementado localmente; MongoDB real No verificado | Backend atómico 3B; botones/estado y AccionesPublicaciones en 3C | Ensayo real de concurrencia y cookies. | Doble clic bloqueado, POST/DELETE, cantidad/estado tras recarga, errores comprensibles. |
| S2-08 | Baja lógica por autor o administrador | Implementado localmente; externo No verificado | Backend 3A + modal y permisos visibles 3C | Ensayo de roles/modal en navegador y base real. | Cancelar no envía DELETE; confirmar espera éxito, recarga y excluye inactiva; errores visibles. |
| S2-09 | Perfil con últimas tres publicaciones y comentarios | Implementado localmente; externo No verificado | Perfil limit 3, cada jugada comparte ComentariosPublicacion por id con limit 3 inicial | Ensayo en navegador/base real. | Tres propias con comentarios asociados, colecciones aisladas, carga acotada y sin demos. |

## Sprint 3

| ID    | Requisito                                     | Estado    | Evidencia / archivos actuales                                                                     | Trabajo pendiente                                                                                     | Criterio y prueba de aceptación                                                                          |
| ----- | --------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| S3-01 | Detalle de publicación | Implementado localmente; externo No verificado | GET /publicaciones/:id y ruta Angular pública; PublicacionDetalle reutiliza tarjeta/comentarios | Ensayo integrado en navegador/base real. | URL directa y Output de tarjeta, activo/ausente/id inválido, carga/error y datos antiguos comprobados. |
| S3-02 | Comentarios con paginación real | Implementado localmente; externo No verificado | Backend 4A y ComentariosPublicacion/ComentariosService 4B; limit 3 y offset incremental | Ensayo real de consultas/cookies/CORS. | Ocho notas se reciben 3/3/2 y se muestran 3/6/8; anexado/deduplicación/error conservan anteriores. |
| S3-03 | Editar comentario propio e indicar modificado | Implementado localmente; externo No verificado | PUT 4A y formulario 4B; puedeEditar solo autor; etiqueta Editado tras respuesta | Ensayo integrado de roles y persistencia. | Admin ajeno sin permiso; guardar/cancelar/validación/doble envío/errores y modificado comprobados. |
| S3-04 | JWT de 15 minutos | Implementado localmente; externo No verificado | DURACION_SESION_SEGUNDOS 900 en firma/módulo; cookie hasta exp real | Ensayo de cookies HTTPS/Vercel y sesiones antiguas. | JWT exp menos iat = 900; cookie coherente; vencido no autoriza ni renueva. |
| S3-05 | POST autorizar | Implementado según modelo actual; habilitación no modelada | AuthGuard cookie + usuario existente/ficha vigente; fechas y usuario sin JWT/hash | Campo/política de habilitación cuando se autorice Sprint 4; ensayo externo. | Válido 200; sin cookie/vencido/inexistente 401; no emite nueva cookie. |
| S3-06 | POST refrescar | Implementado según modelo actual; habilitación no modelada | Token vigente, comprobación de usuario/exp y nueva cookie de 900 segundos | Misma limitación de habilitación y ensayo real. | Solo acción voluntaria; vigente 200 con nueva exp, vencido 401 sin cookie nueva. |
| S3-07 | Pantalla de carga | Implementado localmente | App bloquea outlet durante POST autorizar; error transitorio con Reintentar | Ensayo visual/accesibilidad/dispositivos. | Spinner inicial, salida en éxito/inválida/error; raíz/guard comparten solicitud. |
| S3-08 | Redirección por 401 | Implementado localmente | sesionInterceptor acotado a API/protegidos; estado limpio, mensaje y returnUrl | Ensayo de flujo desplegado y criterios oficiales adicionales. | 401 protegido redirige; 403/red/500 no cierran sesión; login/autorizar sin bucles. |
| S3-09 | Advertencia a los 10 minutos | Implementado localmente | AuthService desde expiraEn menos 5 minutos, con horaServidor y control focus/visibility | Ensayo con navegador suspendido y clocks reales. | Reloj simulado: aviso al minuto 10; recarga conserva plazo restante, no reinicia 15. |
| S3-10 | Modal para extender sesión | Implementado localmente | ExtenderSesion y App.extenderSesion; renovación compartida y timers reiniciados | Ensayo nativo de modal/foco/cookies. | Extender envía refrescar; Ahora no no solicita; fallo permite reintentar y exp cierra sesión. |

## Sprint 4

| ID    | Requisito                                             | Estado                                    | Evidencia / archivos actuales                                                           | Trabajo pendiente                                                                           | Criterio y prueba de aceptación                                                                                |
| ----- | ----------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| S4-01 | Administrador puede dar de baja cualquier publicación | Implementado localmente; externo No verificado | Backend verifica rol actual; UI 3C muestra baja admin y modal propio | Ensayo integrado de roles reales. | Admin retira ajena; cancelación sin HTTP y 403/error visibles; documento conservado. |
| S4-02 | Dashboard de usuarios                                 | Parcial                                   | GET usuarios ahora tiene AuthGuard + AdministradorGuard y selección positiva; no hay UI | Crear dashboard y sus operaciones sin duplicar el listado protegido.                        | Acceso HTTP 401/403/200 comprobado localmente; UI administrativa y resto de operaciones pendientes.            |
| S4-03 | Alta administrativa de usuarios                       | Pendiente                                 | Solo registro público, que fuerza perfil usuario                                        | Reutilizar reglas/hash, definir DTO y permiso para alta admin según TP.                     | Usuario común no crea por endpoint admin; duplicados/errores/success visibles.                                 |
| S4-04 | Habilitar/deshabilitar usuarios                       | Pendiente                                 | Usuario no tiene estado ni endpoint de modificación                                     | Agregar estado con tratamiento de registros existentes y control de sesión/operaciones.     | Modal identifica usuario, cancelar no solicita, éxito/error visibles; deshabilitado no opera con token previo. |
| S4-05 | Validar rol en backend                                | Parcial: implementado para listado        | AdministradorGuard.canActivate consulta UsuariosService.findById tras AuthGuard         | Reutilizar política en las futuras operaciones administrativas; habilitación aún no existe. | GET usuarios deniega rol común/retirado y permite administrador actual; no confiar en perfil del body/query.   |
| S4-06 | Tres estadísticas filtradas por fechas                | Pendiente; métricas exactas No verificado | No hay endpoints/consultas/componentes; timestamps disponibles                          | Contrastar tres métricas con enunciado completo y aplicar rango en MongoDB.                 | Los tres endpoints reciben Desde/Hasta; validan y devuelven cifras del mismo período.                          |
| S4-07 | Gráficos de distintos tipos                           | Pendiente                                 | No hay gráficos ni dependencia específica                                               | Elegir representación simple y justificar dependencia si se necesita.                       | Tres tipos variados coherentes con datos y alternativa legible; actualizar al cambiar rango.                   |
| S4-08 | PWA                                                   | Pendiente                                 | Sin service worker, manifest ni ngsw config en frontend                                 | Soporte oficial y caché de shell/estáticos; excluir respuestas privadas.                    | Instalación/HTTPS/offline/actualización comprobados sin presentar escrituras offline como exitosas.            |
| S4-09 | Tres pipes propios | Parcial: uno de tres implementado | TruncatePipe usado en tarjeta real; 3 pruebas propias | Definir/implementar otros dos según TP. | TruncatePipe puro, texto corto/largo y expandido; cuenta solo una vez. |
| S4-10 | Tres directivas propias                               | Pendiente                                 | No hay @Directive propio; NgClass es de Angular                                         | AutoResizeTextarea, ResaltarAutor y FocoInicial propuestas, a contrastar con TP.            | Tres comportamientos útiles usados/probados; ninguna directiva reemplaza permisos backend.                     |

## Requisitos generales obligatorios

| ID   | Requisito                                                                         | Estado                           | Evidencia / archivos actuales                                                          | Trabajo pendiente                                                                                        | Criterio y prueba de aceptación                                                                          |
| ---- | --------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| G-01 | Arquitectura sin módulos ajenos ni duplicación de negocio                         | Parcial                          | Angular standalone, Nest, MongoDB y módulos existentes; dos contratos de publicaciones | Conservar arquitectura, adaptar contratos y reutilizar módulos/servicios antes de ampliar.               | Cada tarea justifica alcance y no crea módulos por conveniencia ajena al TP.                             |
| G-02 | Exactamente 10 publicaciones por página de feed | Implementado localmente; externo No verificado | cargarPublicaciones fuerza limit 10; navegación offset 0/10/20 | Ensayo con 23 registros reales. | API y DOM local verifican páginas de diez y última con remanente. |
| G-03 | Navegación por múltiples páginas numeradas | Implementado localmente | Feed: ventana de cinco números más extremos y anterior/siguiente | Ensayo de teclado/móvil. | Se abren páginas 1/2/3 por número; aria-current y límites de navegación correctos. |
| G-04 | Cada post usa componente con Input y Output | Implementado localmente | Feed y perfil usan PublicacionCard; Outputs a acciones del contenedor | Ensayo visual integrado. | El hijo recibe datos y emite intención; no hace HTTP ni duplica llamadas. |
| G-05 | Toda baja/eliminación desde UI requiere modal propio | Implementado para publicaciones; futuras operaciones pendientes | ConfirmacionBaja compartido, Cancelar/Confirmar; sin alert/window.confirm | Reutilizar patrón en bajas de futuros módulos. | Cancelar/Escape no solicitan; Confirmar envía una vez y bloquea mientras espera. |
| G-06 | Notificación clara de éxito y error en bajas/comentarios | Implementado para operaciones actuales localmente | AccionesPublicaciones y ComentariosPublicacion; éxitos tras respuesta y errores inline | Mantener patrón en futuras operaciones y ensayo accesible. | Errores no borran borradores/colección; cancelación no envía solicitud; sin alert/window.confirm. |
| G-07 | TruncatePipe con Ver más/Ver menos, contado en S4 | Implementado localmente | Pipe puro + expandido de tarjeta + aria-expanded/controls | Otros dos pipes S4; ensayo accesible. | Corto intacto, largo recortado y expandible sin modificar el texto guardado. |
| G-08 | Comentarios recientes primero y carga inicial de 3 | Implementado localmente; externo No verificado | Orden backend 4A; servicio Angular fija limit 3 y sección reutilizada | Ensayo real. | Hasta tres iniciales por publicación; respeta orden recibido y datos mínimos de autor. |
| G-09 | Ver más pide otros 3 y anexa sin reemplazar | Implementado localmente | Cargar más, siguienteOffset por recibidos y Map por _id; reinicio tras alta | Ensayo concurrente/navegador real. | 3/6/8; error conserva anteriores; duplicados no se renderizan; nueva nota reinicia primera página. |
| G-10 | Comentarios vinculados a usuario/publicación y edición del autor en Nest | Implementado localmente; externo No verificado | Relaciones y permiso Nest 4A; Input publicacionId/usuario y formularios 4B | Ensayo real de permisos/persistencia. | Solo propio; etiqueta Editado persistente y UI actualizada desde la respuesta, sin autor del body. |
| G-11 | Desde/Hasta válidos y Desde no mayor a Hasta en todos los reportes                | Pendiente                        | No existen formularios/DTOs de rango                                                   | Validar Angular y Nest; no aceptar fechas inexistentes ni rango inverso.                                 | Rangos malos no consultan desde UI y devuelven 400 si se llama a la API.                                 |
| G-12 | Enviar rango y filtrarlo en MongoDB, documentar horas/inclusividad                | Pendiente                        | No hay consultas de reportes por rango                                                 | Propuesta inclusiva por día Buenos Aires, intervalo UTC con fin exclusivo; definir antes de implementar. | Fixtures en límites exactos; cambio de rango modifica query y cifras, no solo etiqueta del gráfico.      |
| G-13 | Documentación por tarea: mapa, matriz, bitácora y explicación pedagógica | Implementado para tareas actuales | 3C actualiza 00/03/08/09/10 y agrega guia-angular.md | Mantener documentación en tareas posteriores. | Explica problema, recorrido, archivos, validaciones, pruebas, conceptos y pendientes. |
| G-14 | Criterio de cierre: compila, valida, mensajes, regresión, documentación y pruebas | Parcial en el proyecto | 4C: FE 138/138, BE 187/187 (threads/serie); builds correctos | Habilitación no modelada, ensayo externo/navegador y Sprint 4 pendiente. | Distinguir pruebas locales de producción; limitación de deshabilitado y CSRF documentadas. |
| G-15 | Auditoría sin implementación, secretos, merge ni deploy                           | Cumplido en esta tarea           | Rama docs/auditoria-inicial, fuentes limpias, solo docs/ nuevos                        | Detenerse y esperar aprobación para cambios funcionales.                                                 | Diff final solo documentación; .env y dependencias intactos; sin merge/despliegue.                       |

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
