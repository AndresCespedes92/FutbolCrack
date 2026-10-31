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
