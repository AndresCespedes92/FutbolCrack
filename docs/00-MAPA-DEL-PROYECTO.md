# 00 — Mapa del proyecto

Actualización más reciente: Tarea 3A, modelo de publicaciones, imagen opcional y baja lógica backend. El historial de auditoría y Tarea 1 se conserva al final.

Auditoría del 31/10/2026. Base: commit `5e6eb8987e96490bbccbbc08320aec3f2b4f8168`, rama de origen `main`; trabajo documental en `docs/auditoria-inicial`. Los caminos de este documento parten de la raíz del repositorio.

## Cómo leer los estados

- **Implementado en código:** el flujo y sus archivos existen. No significa que se haya validado contra Atlas, Cloudinary o Vercel.
- **Parcial:** existe una parte, pero faltan requisitos o verificaciones para aceptarla.
- **Pendiente:** no se encontró implementación en las fuentes revisadas.
- **No verificado:** falta acceso, una prueba de ejecución o el detalle del enunciado. No equivale a un resultado correcto.

Esta auditoría solo agrega documentación. Compilar y pasar pruebas son evidencias diferentes de completar un flujo con servicios externos. Ver [pruebas](08-PRUEBAS-Y-DESPLIEGUE.md) y [trazabilidad](09-REQUISITOS-SPRINTS.md).

## Ubicación por funcionalidad

| Funcionalidad y problema que resuelve                       | Angular: archivo, clase y método                                                                                         | HTTP / controller y método Nest                                                        | Service y método Nest                                                                                  | Modelo / colección                                                               | Validaciones y permisos actuales                                                                                           | Estado                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Registro: dar de alta a un jugador                          | `frontend/src/app/pages/registro/registro.ts`: Registro.registrar; `services/auth.ts`: AuthService.registrar             | POST `/auth/registro`; `backend/src/auth/auth.controller.ts`: AuthController.registrar | `auth/auth.service.ts`: AuthService.registrar → `usuarios/usuarios.service.ts`: UsuariosService.create | Usuario; colección esperada `usuarios`                                           | FormGroup, CreateUsuarioDto, coincidencia de claves, imagen opcional, bcrypt, duplicados; público; rol fijado como usuario | Implementado en código; integración externa no verificada                      |
| Login: comprobar identidad                                  | `pages/login/login.ts`: Login.iniciarSesion → AuthService.login                                                          | POST `/auth/login`; AuthController.login                                               | AuthService.login → UsuariosService.findByIdentificadorConPassword                                     | Usuario                                                                          | LoginDto, bcrypt.compare, JWT y cookie HttpOnly de 20 s                                                                    | Implementado en código; navegador no verificado                                |
| Mi perfil: consultar al usuario conectado                   | `pages/mi-perfil/mi-perfil.ts`: MiPerfil.cargarMiPerfil → AuthService.obtenerMiPerfil; `guards/auth.guard.ts`: authGuard | GET `/auth/me`; AuthController.obtenerMiPerfil                                         | AuthService.obtenerMiPerfil → UsuariosService.findById                                                 | Usuario                                                                          | JWT por cookie/Bearer, ObjectId comprobado y respuesta sin passwordHash; ruta Angular protegida                            | Parcial: datos personales reales, CV deportivo y material propio no integrados |
| Logout: retirar cookie del navegador                        | MiPerfil.cerrarSesion → AuthService.cerrarSesion                                                                         | POST `/auth/logout`; AuthController.cerrarSesion                                       | No llama service; usa Response.clearCookie                                                             | No cambia MongoDB                                                                | Mismas opciones de cookie; middleware de origen; endpoint sin AuthGuard                                                    | Implementado en código; borrado real de cookie no verificado                   |
| Listar usuarios                                             | Sin pantalla ni servicio Angular específico                                                                              | GET `/usuarios`; UsuariosController.findAll                                            | UsuariosService.findById para permiso y findAll para listado                                           | Usuario / colección esperada usuarios                                            | AuthGuard y AdministradorGuard; rol actual desde MongoDB; selección positiva sin credenciales                              | Implementado y verificado HTTP local; dashboard pendiente                      |
| Crear publicación con título, descripción e imagen opcional | Publicaciones.publicar/seleccionarImagen y PublicacionesService.crear Angular                                            | POST /publicaciones; PublicacionesController.crear                                     | PublicacionesService.crear; CloudinaryService.subirImagen                                              | Publicacion / publicaciones; imagen externa                                      | DTO obligatorio, firmas JPEG/PNG/WebP, hasta 5 MiB; autor desde JWT                                                        | Implementado y probado localmente; externos no verificados                     |
| Listar feed                                                 | Publicaciones.cargarPublicaciones → PublicacionesService.listar                                                          | GET `/publicaciones`; PublicacionesController.listar                                   | PublicacionesService.listar                                                                            | Publicacion con populate de Usuario                                              | Público; activo distinto de false, fallback antiguo, sort fecha y limit 50; sin paginación                                 | Parcial: no cumple página de 10 ni selector de orden                           |
| Subir avatar durante registro                               | Registro.seleccionarImagen y registrar; FormData con clave `imagen`                                                      | Dentro de POST `/auth/registro`; FileInterceptor y ParseFilePipeBuilder                | AuthService.registrar → `cloudinary/cloudinary.service.ts`: CloudinaryService.subirImagen              | URL en Usuario.imagenPerfil; archivo externo en Cloudinary                       | JPEG/PNG/WebP, límite 5 MiB, archivo opcional; memoria Multer                                                              | Implementado en código; carga externa no verificada                            |
| Tarjeta individual y demos                                  | `components/publicacion-card/publicacion-card.ts`: PublicacionCard, @Input publicacion; usada en MiPerfil                | No tiene endpoint propio                                                               | No aplica                                                                                              | `models/publicacion.ts` y `data/publicaciones-demo.ts` son datos de demostración | Solo lectura, sin Output; contadores ficticios                                                                             | Parcial: el feed real renderiza article en línea                               |
| Saludo del servidor                                         | No hay consumidor específico                                                                                             | GET `/`; `backend/src/app.controller.ts`: AppController.hola                           | No aplica                                                                                              | No consulta colección                                                            | Público                                                                                                                    | Implementado en código; no es una comprobación de conexión a Atlas             |
| Comentarios y likes                                         | Solo contadores demo                                                                                                     | Sin endpoints reales de estas operaciones                                              | No implementados                                                                                       | Sin schema de comentarios/likes                                                  | Pendientes de sus tareas                                                                                                   | Pendiente                                                                      |
| Administración, estadísticas y PWA                          | No hay pantallas/configuración correspondiente                                                                           | No hay endpoints de reportes ni gestión de estado/rol                                  | No implementados                                                                                       | Rol ya existe en Usuario; estados y reportes no                                  | Rol de listado implementado; otras operaciones administrativas pendientes                                                  | Pendiente                                                                      |

Los caminos cortos Angular de la tabla están debajo de `frontend/src/app/`; los de Nest debajo de `backend/src/`. La colección Usuario no fija `collection` en el decorador: `usuarios` es el nombre esperado por la pluralización de Mongoose, no un inventario comprobado en Atlas. Publicacion sí fija explícitamente `collection: 'publicaciones'`.

## Rutas y piezas compartidas

| Dónde                                                         | Qué hace                                                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `frontend/src/main.ts`, `app/app.config.ts`                   | bootstrapApplication, provideRouter y provideHttpClient. No hay interceptor HTTP propio registrado.               |
| `frontend/src/app/app.routes.ts`                              | `/login`, `/registro`, `/publicaciones` públicas; `/mi-perfil` con authGuard; inicio y comodín redirigen al feed. |
| `frontend/src/app/components/navbar/`                         | Enlaces RouterLink/RouterLinkActive; navegación sin recargar.                                                     |
| `frontend/src/styles.css` y cada `.css` del componente        | Paleta, radios, foco, controles y layouts; el feed excede el presupuesto de estilo de advertencia.                |
| `frontend/src/app/forms/registro-form.ts`                     | crearFormularioRegistro: controles y validadores de nombre, usuario, correo y clave.                              |
| `frontend/src/app/validators/registro.validators.ts`          | confirmarClaveValidator, fechaNacimientoValidator, imagenPerfilValidator y fechaLocalHoy.                         |
| `backend/src/main.ts`                                         | CORS, ValidationPipe global, arranque local y handler exportado para Vercel.                                      |
| `backend/src/app.module.ts`                                   | ConfigModule, conexión Mongoose y módulos Usuarios/Auth/Cloudinary/Publicaciones; registra middleware de origen.  |
| `backend/src/auth/seguridad.module.ts`                        | SeguridadModule: JwtModule global, secreto desde entorno, duración 20 s, AuthGuard.                               |
| `backend/src/auth/guards/auth.guard.ts`                       | AuthGuard.canActivate, extraerTokenBearer, extraerTokenCookie; verifica JWT y adjunta request.user.               |
| `backend/src/common/middlewares/validar-origen.middleware.ts` | ValidarOrigenMiddleware.use: valida Origin si está presente en métodos que modifican datos.                       |

## Preguntas rápidas para estudiar

**¿Dónde se valida la contraseña?** En Angular: crearFormularioRegistro, dentro de `forms/registro-form.ts` (8–64, mayúscula y número). En Nest: CreateUsuarioDto (`usuarios/dto/create-usuario.dto.ts`, mínimo 8, mayúscula y número). La coincidencia se revisa en confirmarClaveValidator y AuthService.registrar. El hash se genera con bcrypt.hash(..., 12); login usa bcrypt.compare. Las reglas entre capas no son idénticas: el DTO no limita a 64.

**¿Dónde se guarda una publicación?** Publicaciones.publicar llama al servicio Angular; el controller toma autorId del JWT; PublicacionesService.crear de Nest construye `new this.publicacionModel(...)` y ejecuta `.save()` en la colección `publicaciones`. La creación actual guarda título/descripción, alias contenido, activo y URL opcional de Cloudinary.

**¿Dónde se ordena el feed?** En PublicacionesService.listar de Nest: `.sort({ createdAt: -1 }).limit(50)`. No existe selector de likes ni parámetros offset/limit.

**¿Dónde están mis publicaciones reales?** El feed consulta MongoDB, pero MiPerfil todavía usa PUBLICACIONES_DEMO filtradas por autorId numérico 10. No son las últimas tres del usuario autenticado.

## Índice documental

1. [Arquitectura y recorridos](01-ARQUITECTURA.md).
2. [Autenticación y seguridad](02-AUTENTICACION-Y-SEGURIDAD.md).
3. [Publicaciones](03-PUBLICACIONES.md).
4. [Comentarios](04-COMENTARIOS.md).
5. [Administración](05-ADMINISTRACION.md).
6. [Estadísticas y rangos](06-ESTADISTICAS.md).
7. [Angular, PWA, pipes y directivas](07-ANGULAR-PWA-PIPES-DIRECTIVAS.md).
8. [Pruebas, variables y despliegue](08-PRUEBAS-Y-DESPLIEGUE.md).
9. [Requisitos y plan](09-REQUISITOS-SPRINTS.md).
10. [Bitácora y riesgos](10-BITACORA-DE-CAMBIOS.md).

## Pruebas recuperadas — Tarea 1, 31/10/2026

Rama `test/recuperar-pruebas`, creada desde `docs/auditoria-inicial`. No cambió ninguna funcionalidad, ruta, permiso o modelo del mapa. La documentación de auditoría ya existente se conservó sin realizar commits.

| Archivo                                            | Qué comprueba ahora                                                                                                                                                        | Aislamiento y resultado                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `frontend/src/app/app.spec.ts`                     | Cuatro enlaces, pantallas públicas, perfil con sesión autorizada, redirecciones, campos de registro, feed real simulado frente a demos del perfil y rechazo 401 del guard. | HttpTestingController; 6 pruebas aprobadas.                                                 |
| `frontend/src/app/pages/registro/registro.spec.ts` | Estados visuales, confirmación, opcionales, imagen, submit válido/FormData, bloqueo de envío duplicado, inválido sin solicitud y error 409.                                | HttpTestingController; 8 pruebas aprobadas.                                                 |
| `frontend/src/app/forms/registro-form.spec.ts`     | Reglas locales del FormGroup. No se modificó.                                                                                                                              | Sin servidor; 6 pruebas aprobadas.                                                          |
| `backend/src/usuarios/usuarios.controller.spec.ts` | Creación de controller y delegación de findAll una sola vez con su resultado intacto.                                                                                      | Doble de UsuariosService y guard simulado solo en el módulo de prueba; 2 pruebas aprobadas. |

El backend HTTP de pruebas de Angular intercepta las solicitudes del servicio real; no se envían a Vercel ni se crean cuentas. El doble Nest reemplaza la dependencia del controller, por lo que esta prueba no necesita UsuarioModel ni conexión MongoDB. No prueba la implementación del servicio, JWT, cookies o autorización backend.

Los resultados de Tarea 0 se conservan como historia. Para el estado actual de las suites y las advertencias, ver [08](08-PRUEBAS-Y-DESPLIEGUE.md). Los documentos temáticos 01–07 describen la auditoría inicial; recuperar tests no corrige sus hallazgos productivos.

## Seguridad básica — Tarea 2 (historial; publicaciones ampliadas en 3A)

Rama `fix/seguridad-validaciones`, creada desde el estado de Tarea 1 sin descartar tests ni documentos pendientes. No se modificó JWT, cookies, registro público ni frontend.

| Archivo / clase y método                                                               | Responsabilidad actual                                                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `backend/src/usuarios/guards/administrador.guard.ts`, AdministradorGuard.canActivate   | Después de AuthGuard, toma sub verificado y consulta UsuariosService.findById. Solo permite perfil administrador actual. |
| `backend/src/usuarios/usuarios.controller.ts`, UsuariosController.findAll              | GET usuarios declara AuthGuard y AdministradorGuard en ese orden.                                                        |
| `backend/src/usuarios/usuarios.module.ts`, UsuariosModule                              | Registra el guard junto a UsuariosService; reutiliza SeguridadModule sin agregar módulo funcional.                       |
| `backend/src/usuarios/usuarios.service.ts`, UsuariosService.findAll                    | find con selección positiva de campos, sin contraseña ni passwordHash.                                                   |
| `backend/src/publicaciones/dto/create-publicacion.dto.ts`, CreatePublicacionDto        | Transform de trim solo para strings; IsString, IsNotEmpty y MaxLength(2000).                                             |
| `backend/src/publicaciones/publicaciones.controller.ts`, PublicacionesController.crear | Recibe el DTO concreto; mantiene contenido y autor desde JWT, sin título ni imagen.                                      |
| `backend/src/usuarios/usuarios.controller.http.spec.ts`                                | 8 casos HTTP con AuthGuard/AdministradorGuard reales y padrón simulado.                                                  |
| `backend/src/usuarios/usuarios.service.spec.ts`                                        | 1 caso que verifica la selección de campos real y la exclusión de hash del esquema.                                      |
| `backend/src/publicaciones/publicaciones.controller.http.spec.ts`                      | 18 casos con controller, DTO, ValidationPipe y servicio reales; guardado de modelo simulado.                             |

Ejemplo del club: un socio con carnet válido no puede pedir el padrón; el secretario con rol vigente sí. Aunque un carnet antiguo diga administrador, se consulta la ficha actual. Para publicar un parte de entrenamiento, la ficha debe traer solo contenido textual válido; no se aceptan un número, un objeto o un autor elegido por el cliente.

Las pruebas son HTTP locales sin Atlas ni Cloudinary. El listado y la validación de contenido están comprobados en ese alcance; no se afirma un despliegue validado. Resultados completos en 08.

## Tarea 3A — Nuevos puntos de entrada

| Archivo / clase y método                                                      | Dónde buscar y qué hace                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| backend/src/publicaciones/entities/publicacion.entity.ts, Publicacion         | Campos nuevos obligatorios, contenido conservado, activo por defecto y referencia al autor.             |
| backend/src/publicaciones/publicaciones.constants.ts                          | Límites centralizados de título, descripción e imagen.                                                  |
| backend/src/publicaciones/dto/create-publicacion.dto.ts, CreatePublicacionDto | titulo y descripcion; las propiedades ajenas y contenido de creación antiguo se rechazan.               |
| backend/src/publicaciones/publicaciones.controller.ts, crear/listar/darDeBaja | POST multipart/JSON, GET público y DELETE /publicaciones/:id autenticado.                               |
| backend/src/publicaciones/publicaciones.service.ts, crear/listar/darDeBaja    | Cloudinary, adaptación de lecturas antiguas, consulta de rol real y updateOne de activo.                |
| backend/src/publicaciones/publicaciones.module.ts                             | Reutiliza CloudinaryModule, UsuariosModule y SeguridadModule, sin módulos funcionales nuevos.           |
| backend/src/cloudinary/cloudinary.service.ts, subirImagen                     | Segundo argumento opcional perfiles/publicaciones; una llamada antigua sin argumento conserva perfiles. |
| frontend/src/app/services/publicaciones.ts, crear                             | Construye FormData, conserva withCredentials y no elige autor.                                          |
| frontend/src/app/pages/publicaciones/publicaciones.ts/html/css                | Formulario y presentación, sin botón de baja.                                                           |
| backend/src/publicaciones/publicaciones.controller.http.spec.ts               | 43 casos HTTP actuales, incluidos los previos adaptados, imágenes, bajas y datos antiguos.              |
| backend/src/publicaciones/entities/publicacion.entity.spec.ts                 | 2 pruebas de validación de schema en memoria.                                                           |
| backend/src/cloudinary/cloudinary.service.spec.ts                             | 3 pruebas del adaptador/carpeta predeterminada y fallos.                                                |
| frontend/src/app/pages/publicaciones/publicaciones.spec.ts                    | 12 casos de formulario, transporte y feed compatibles.                                                  |

Para retirar un parte del club: DELETE verifica autor o administrador actual y marca activo false, sin borrar documento. Respuestas: 401 sin sesión, 403 ajeno no administrador, 404 inexistente/ya retirado, 200 al completar. El filtro público excluye false pero conserva documentos antiguos sin activo. No hay baja desde UI hasta la confirmación/modal de 3C.

El árbol inicial estaba limpio en c8383c9, con tareas anteriores ya confirmadas. Se creó feature/publicaciones-modelo sin hacer otro commit vacío. No se hicieron merge/deploy ni migraciones reales. Resultados: Angular 32/32 y Nest 59/59; ver 08 y 10.

## Tarea 3B — Mapa actual de likes y listado paginado

Esta sección actualiza los contratos de listado descritos en la auditoría y en 3A. Se reutiliza PublicacionesModule; no se agregó ningún módulo funcional.

| Archivo | Clase / método y responsabilidad |
| --- | --- |
| backend/src/publicaciones/entities/publicacion.entity.ts | Publicacion.likes: array de ObjectId de usuarios, default vacío; sin contador duplicado. |
| backend/src/publicaciones/publicaciones.constants.ts | LIMITE_LISTADO_PREDETERMINADO = 10 y MAXIMO_LIMITE_LISTADO = 100. |
| backend/src/publicaciones/dto/listar-publicaciones.dto.ts | ListarPublicacionesDto y enteroDeQuery: orden, autor, enteros y límites válidos. |
| backend/src/publicaciones/guards/autenticacion-opcional.guard.ts | AutenticacionOpcionalGuard.canActivate reutiliza AuthGuard para identificar al lector sin privatizar el GET. |
| backend/src/publicaciones/publicaciones.controller.ts | listar: GET /publicaciones; darMeGusta: POST /publicaciones/:id/likes; quitarMeGusta: DELETE /publicaciones/:id/likes. |
| backend/src/publicaciones/publicaciones.service.ts | listar: match, cantidad, orden, facet/página/total y populate público; darMeGusta/quitarMeGusta delegan a cambiarMeGusta, actualización atómica. |
| backend/src/publicaciones/publicaciones.module.ts | Registra el guard opcional y conserva las importaciones existentes. |
| frontend/src/app/services/publicaciones.ts | Tipos ParametrosListadoPublicaciones, ListadoPublicaciones y RespuestaMeGusta; métodos listar, darMeGusta y quitarMeGusta. |
| frontend/src/app/pages/publicaciones/publicaciones.ts | cargarPublicaciones extrae publicaciones y conserva total, offset, limit y hayMas. |
| backend/src/publicaciones/publicaciones.controller.http.spec.ts | 79 pruebas HTTP de publicaciones: las 43 previas y 36 de likes/listado. Modelo MongoDB simulado. |
| backend/src/publicaciones/entities/publicacion.entity.spec.ts | 2 pruebas de schema, ampliadas con default likes y ausencia de índice unique global. |
| frontend/src/app/services/publicaciones.spec.ts | 3 pruebas nuevas de parámetros, cookies y endpoints de likes. |
| frontend/src/app/app.spec.ts y pages/publicaciones/publicaciones.spec.ts | Expectativas del GET adaptadas al sobre paginado, sin quitar casos. |

Recorrido: jugador abre cartelera → cargarPublicaciones → servicio Angular → GET + DTO/guard opcional → listar → agregación MongoDB y populate → sobre paginado → array visible. Una futura acción de like recorrerá servicio Angular → AuthGuard obligatorio → sub verificado → cambiarMeGusta → findOneAndUpdate → mensaje/cantidad/estado. Los botones, tarjeta real y paginador visual pertenecen a 3C.

Resultados y límites en [08](08-PRUEBAS-Y-DESPLIEGUE.md); explicación y ejemplos en [03](03-PUBLICACIONES.md).

## Sprint 2, Tarea 3C — Interfaz vigente

La tarjeta real reemplaza la demo en feed y Mi Perfil; no cambian endpoints, modelos ni permisos NestJS de 3A/3B. Esta sección actualiza las referencias históricas que indicaban UI pendiente.

| Archivo (desde la raíz) | Clase / método y responsabilidad |
| --- | --- |
| frontend/src/app/components/publicacion-card/publicacion-card.ts/html/css | PublicacionCard: Input publicacion/autenticado/puedeDarBaja/procesando/detalleDisponible; Output cambiarLike/solicitarBaja/abrirDetalle. Presenta autor, foto, fecha, contenido, imagen y voto; no hace HTTP. |
| frontend/src/app/pipes/truncate.pipe.ts | TruncatePipe.transform: recorta a 280 caracteres por defecto, devuelve texto íntegro al expandir. Primer pipe propio de los tres de S4. |
| frontend/src/app/components/confirmacion-baja/confirmacion-baja.ts/html/css | ConfirmacionBaja: ngAfterViewInit abre dialog; cancelarBaja/confirmarBaja y cancelarConTeclado emiten eventos; ngOnDestroy cierra y restaura foco si el disparador existe. |
| frontend/src/app/services/acciones-publicaciones.ts | AccionesPublicaciones: puedeDarBaja, alternarLike, solicitarBaja, cancelarBaja, confirmarBaja; señales locales de pendientes, seleccionada, eliminando, mensaje/error. Se provee por pantalla. |
| frontend/src/app/services/publicaciones.ts | darDeBaja: DELETE /publicaciones/:id con cookies; se conservan listar, crear, darMeGusta y quitarMeGusta de 3B. |
| frontend/src/app/pages/publicaciones/publicaciones.ts/html/css | Publicaciones: cargarPublicaciones, cambiarOrden, irAPagina, confirmarBaja; formulario preservado, diez registros, selector y ventana de páginas numeradas. |
| frontend/src/app/pages/mi-perfil/mi-perfil.ts/html/css | MiPerfil: cargarMiPerfil obtiene datos reales; cargarPublicaciones pide usuarioId/fecha/offset 0/limit 3; comparte tarjeta, acciones y modal. |
| frontend/src/app/components/publicacion-card/publicacion-card.spec.ts | 4 pruebas: datos reales/antiguos, eventos y bloqueo de acciones. |
| frontend/src/app/components/confirmacion-baja/confirmacion-baja.spec.ts | 2 pruebas: Escape, bloqueo durante DELETE y restauración del foco. |
| frontend/src/app/pipes/truncate.pipe.spec.ts | 3 pruebas de límite, vacíos y expansión. |
| frontend/src/app/pages/publicaciones/publicaciones-interacciones.spec.ts | 12 pruebas de páginas, orden, likes, permisos, modal, cancelación, errores y última página tras baja. |
| frontend/src/app/pages/mi-perfil/mi-perfil.spec.ts | 4 pruebas: filtro real/últimas tres, vacío, error/reintento y likes compartidos. |
| frontend/src/app/testing/publicaciones-fixture.ts y dialog-prueba.ts | Fixtures exclusivos de tests y doble de API modal ausente en JSDOM; no se usan en producción. |
| frontend/src/app/app.spec.ts y pages/publicaciones/publicaciones.spec.ts | Se conservan los 18 casos combinados, adaptando solicitudes y expectativa de perfil sin demos. |
| docs/guia-angular.md | Guía de estudio: recorrido, bindings, formularios, Input/Output, señales, routing y cambios CSS. |

Ejemplo del club: el entrenador (padre) entrega a la tarjeta la ficha de una jugada. La tarjeta avisa «quiero votar»; el contenedor coordina al servicio, espera la confirmación de Nest y consulta otra vez la cartelera. No se permite que cada tarjeta gestione una conexión propia.

La salida de detalle está preparada y probada, pero detalleDisponible permanece false porque la pantalla/API de detalle y comentarios son de Sprint 3. No hay enlaces a rutas inexistentes ni comentarios inventados. Ver [03](03-PUBLICACIONES.md), [08](08-PRUEBAS-Y-DESPLIEGUE.md) y [guía Angular](guia-angular.md).

## Sprint 3, Tarea 4A — Backend de comentarios

| Archivo en backend/src/ | Clase / método y endpoint |
| --- | --- |
| comentarios/comentarios.module.ts | ComentariosModule: único módulo funcional nuevo; registra Comentario y reutiliza Seguridad/Usuarios/Publicaciones. |
| comentarios/entities/comentario.entity.ts | Comentario, ComentarioSchema: publicacionId/autorId, texto, modificado, timestamps e índice compuesto. |
| comentarios/comentarios.constants.ts | Máximo texto 1000; página 3, máximo técnico 100. |
| comentarios/dto/crear-comentario.dto.ts | CrearComentarioDto: texto obligatorio, trim, string, máximo; propiedades ajenas rechazadas por pipe global. |
| comentarios/dto/editar-comentario.dto.ts | EditarComentarioDto hereda las mismas validaciones; PUT exige texto. |
| comentarios/dto/listar-comentarios.dto.ts | ListarComentariosDto: offset/limit estrictos. |
| comentarios/comentarios.controller.ts | crear: POST /publicaciones/:publicacionId/comentarios; listar: GET misma ruta; editar: PUT /comentarios/:id. |
| comentarios/comentarios.service.ts | crear/listar/editar; validarId, validarUsuario, exigirPublicacionActiva, validarTexto, presentar. Reglas de autoría, actividad, página/total y populate mínimo. |
| common/validation/entero-query.ts | enteroDeQuery compartido por DTO de comentarios/publicaciones, sin cambiar reglas del listado existente. |
| publicaciones/publicaciones.module.ts | Exporta MongooseModule para reutilizar el modelo Publicacion ya registrado. |
| app.module.ts | Importa ComentariosModule. |
| comentarios/comentarios.controller.http.spec.ts | HTTP con módulo real y conexión/modelos/usuarios simulados; guards/DTO/servicio reales, sin Atlas. |
| comentarios/entities/comentario.entity.spec.ts | Cuatro casos de schema real en memoria: referencias/defaults, texto, fechas/índice. |

El socio envía texto → DTO verifica forma → AuthGuard aporta identidad → servicio comprueba usuario/jugada/propiedad → modelo guarda referencias → presentar/populate devuelve nombre/foto mínimos. Listar es público y devuelve comentarios/total/offset/limit/hayMas, default 3. Editar exige autor real (admin no tiene excepción), marca modificado true y mantiene fecha original. No existe DELETE de comentarios ni integración Angular en 4A.

Contrato, ejemplos, decisiones de límites y riesgos entre colecciones en [04](04-COMENTARIOS.md). La documentación de Sprint 2 se conserva; no cambian sus funcionalidades.

## Sprint 3, Tarea 4B — Detalle y comentarios Angular

Esta sección actualiza los pendientes de UI de 4A. Se conserva Angular standalone y no se agregan módulos funcionales ni dependencias.

| Archivo | Clase / método y responsabilidad |
| --- | --- |
| backend/src/publicaciones/publicaciones.controller.ts | obtenerPorId: GET /publicaciones/:id público, identidad opcional para meGusta. |
| backend/src/publicaciones/publicaciones.service.ts | obtenerPorId valida ObjectId y 404; consultarListado comparte la consulta/normalización del feed con filtro _id y limit 1. listar mantiene su contrato. |
| backend/src/publicaciones/publicaciones.controller.http.spec.ts | Cinco casos nuevos de detalle; se conservan los anteriores y el doble interpreta el filtro _id. |
| frontend/src/app/app.routes.ts | Nueva ruta pública publicaciones/:id, carga PublicacionDetalle. |
| frontend/src/app/pages/publicacion-detalle/publicacion-detalle.ts/html/css | PublicacionDetalle: paramMap, cargarDetalle, marcarNoDisponible, confirmarBaja; tarjeta completa, likes/baja compartidos y sección de comentarios. |
| frontend/src/app/services/comentarios.ts | Comentario, AutorComentario, ListadoComentarios, RespuestaComentario; listar(publicacionId, offset), crear(publicacionId, texto), editar(id, texto), cookies existentes. |
| frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.ts/html/css | ComentariosPublicacion: Inputs publicacionId/usuario; Output publicacionNoDisponible; cargarComentarios, publicar, puedeEditar, iniciarEdicion, cancelarEdicion, guardarEdicion, alternarTexto; estado local/formularios y páginas de tres. |
| frontend/src/app/services/publicaciones.ts | obtenerPorId: GET individual tipado sin descargar el feed. |
| frontend/src/app/components/publicacion-card/publicacion-card.ts/html | textoCompleto permite descripción íntegra en detalle, preservando TruncatePipe; abrirDetalle ahora se conecta desde feed/perfil. |
| frontend/src/app/pages/publicaciones/publicaciones.ts/html | verDetalle navega con el id recibido del Output. |
| frontend/src/app/pages/mi-perfil/mi-perfil.ts/html/css | Cada una de las tres publicaciones agrupa su tarjeta y ComentariosPublicacion; retirarNoDisponible elimina de la vista una jugada cuyo GET de comentarios da 404. Conserva hijos/borradores al recargar un like. |
| frontend/src/app/services/comentarios.spec.ts | Tres pruebas del contrato HTTP de 4A. |
| frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.spec.ts | 23 casos: anexado, duplicados, offsets, creación/edición, validaciones, errores, permisos, Input y truncado. |
| frontend/src/app/pages/publicacion-detalle/publicacion-detalle.spec.ts | Ocho casos: URL directa/Output, lectura pública, errores/404/inactiva/id inválido, datos antiguos y cambio de id. |
| frontend/src/app/testing/comentarios-fixture.ts | Datos/HTTP simulados exclusivos de tests; no se usan desde componentes productivos. |

Se amplían también los tests de PublicacionCard, PublicacionesService y MiPerfil, conservando las suites existentes. El mapa de relaciones backend sigue en 04 y el recorrido educativo completo en [guia-angular.md](guia-angular.md).

Ejemplo del club: cada ficha de jugada tiene debajo su propio cuaderno de comentarios, identificado por publicacionId. No comparte array con la otra jugada. «Cargar más» pide solo tres hojas siguientes y las anexa. Tras escribir una nota nueva se vuelve a la primera página para no continuar con offsets viejos.

## Sprint 3, Tarea 4C — Sesión inicial y renovación voluntaria

| Archivo | Funcionalidad actual |
| --- | --- |
| backend/src/auth/sesion.constants.ts y seguridad.module.ts | Plazo compartido 900 segundos para JWT. |
| backend/src/auth/sesion-cookie.ts | Opciones HttpOnly/Secure/SameSite y maxAge según exp real; limpieza coherente. |
| backend/src/auth/auth.controller.ts | POST /auth/autorizar y /auth/refrescar (200/401), login con metadatos, me compatible y logout. |
| backend/src/auth/auth.service.ts | Consulta usuario actual, vigencia antes/después, emisión y proyección pública sin JWT en JSON. |
| backend/src/auth/guards/auth.guard.ts | Guard único, cookie obligatoria en nuevos endpoints, claims y firma/exp válidos. |
| backend/src/common/origenes-permitidos.ts | Orígenes exactos compartidos por CORS y CSRF. |
| backend/src/common/middlewares/validar-origen.middleware.ts y main.ts | Origin/Referer/rechazo ante ausencia para cookies/sesión; CORS conserva credentials. |
| frontend/src/app/services/auth.ts | Estado/fechas en memoria, autorizar compartido, renovación, aviso/expiración, timers/listeners y limpieza. |
| frontend/src/app/services/api.config.ts | Origen API compartido con servicios e interceptor. |
| frontend/src/app/interceptors/sesion.interceptor.ts y app.config.ts | 401 de endpoints protegidos; 403/red/500 no cierran sesión. |
| frontend/src/app/app.ts/html/css | Carga inicial/reintento, continuidad de ruta y modal de sesión. |
| frontend/src/app/components/extender-sesion/ | Dialog propio con Extender sesión/Ahora no y estados de espera/error. |
| frontend/src/app/guards/auth.guard.ts y pages/login/ | Reutiliza sesión/autorización pendiente y returnUrl interno. |
| backend/src/auth/auth.sesion.http.spec.ts | 18 casos HTTP con JWT/bcrypt/cookie/middleware reales y usuarios simulados. |
| backend/src/common/middlewares/validar-origen.middleware.spec.ts | Siete casos de política CSRF y compatibilidad de Bearer/lecturas. |
| frontend/src/app/services/auth.spec.ts | 16 casos con reloj simulado: autorización, caché, aviso, renovación, vencimiento, suspensión y limpieza. |
| frontend/src/app/interceptors/sesion.interceptor.spec.ts | 12 casos de 401/403/500, excepciones y origen exacto. |
| frontend/src/app/app.sesion.spec.ts | Ocho casos de pantalla inicial, rutas, errores, modal y solicitud compartida raíz/guard. |
| frontend/src/app/components/extender-sesion/extender-sesion.spec.ts | Dos casos de Outputs/teclado/bloqueo del modal. |
| frontend/src/app/pages/login/login.sesion.spec.ts | Tres casos de destino seguro/credenciales y recuperación del estado. |
| frontend/src/app/testing/sesion-fixture.ts | Metadatos exclusivos de pruebas, sin tokens. |

Limitación de modelo: no existe habilitado/activo en Usuario; solo se puede comprobar existencia/ficha actual. No se implementa bloqueo de cuentas de Sprint 4 ni se declara comprobado un usuario deshabilitado. Explicación, endpoints, decisiones CSRF y límites en [02](02-AUTENTICACION-Y-SEGURIDAD.md).

## Incorporaciones 5A — Administración de usuarios (2026-11-01)

| Ubicación | Responsabilidad y métodos |
| --- | --- |
| `backend/src/usuarios/entities/usuario.entity.ts` | Usuario.activo, default true; esquema existente |
| `backend/src/usuarios/dto/crear-usuario-administrativo.dto.ts` | CrearUsuarioAdministrativoDto; datos de alta y perfil permitido |
| `backend/src/common/password.ts` | generarHashPassword: coincidencia y bcrypt; compartido por alta pública/administrativa |
| `backend/src/usuarios/usuarios.controller.ts` | GET/POST usuarios, DELETE :id, POST :id/habilitar; guards de clase |
| `backend/src/usuarios/usuarios.service.ts` | crearAdministrativo, guardarUsuario, findAll, deshabilitar, habilitar, validarId |
| `backend/src/auth/guards/auth.guard.ts` | canActivate: JWT y ficha/estado/rol actuales |
| `backend/src/usuarios/guards/administrador.guard.ts` | canActivate: cuenta habilitada y administrador actual |
| `backend/src/auth/seguridad.module.ts` | Inyección/exportación del modelo existente para guards |
| `backend/src/auth/auth.service.ts` | registrar comparte hash; login/me/exigirUsuarioDeSesion rechazan bajas |
| `frontend/src/app/services/usuarios.ts` | listar, crear, deshabilitar, habilitar y tipos de contrato |
| `frontend/src/app/guards/administrador.guard.ts` | Ruta privada administrativa, retorno a login/feed según sesión/rol |
| `frontend/src/app/app.routes.ts` | Lazy route /dashboard/usuarios |
| `frontend/src/app/pages/dashboard-usuarios/` | TS contenedor, HTML tabla/formulario, CSS responsive comentado y spec |
| `frontend/src/app/components/confirmacion-usuario/` | Modal TS/HTML/CSS; Inputs usuario/procesando/error y Outputs cancelar/confirmar |
| `frontend/src/app/components/navbar/` | Enlace condicional Administrar usuarios |
| `frontend/src/app/pages/publicaciones/` | Aviso de acceso denegado mediante query param; feed conservado |
| `frontend/src/app/services/auth.ts` y `pages/login/` | Estado compatible y mensaje de cuenta deshabilitada |
| `backend/src/usuarios/usuarios.administracion.http.spec.ts` | 34 casos HTTP integrados, MongoDB simulado |
| `backend/src/usuarios/entities/usuario.entity.spec.ts` | Defaults y selección de hash con Mongoose en memoria |
| `backend/src/testing/usuario-sesion.ts` | Modelo exclusivo de pruebas para consulta de sesión |
| `frontend/src/app/testing/usuarios-fixture.ts` | Datos exclusivos de pruebas administrativas |

El inventario completo de archivos modificados está en [10-BITACORA-DE-CAMBIOS.md](10-BITACORA-DE-CAMBIOS.md). No se agrega módulo funcional; se reutilizan UsuariosModule, AuthService y crearFormularioRegistro. La política vigente y los contratos están en [05-ADMINISTRACION.md](05-ADMINISTRACION.md).
