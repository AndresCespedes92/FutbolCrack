# 00 — Mapa del proyecto

Actualización más reciente: Tarea 2, seguridad del listado y DTO de publicaciones. El historial de auditoría y Tarea 1 se conserva al final.

Auditoría del 31/10/2026. Base: commit `5e6eb8987e96490bbccbbc08320aec3f2b4f8168`, rama de origen `main`; trabajo documental en `docs/auditoria-inicial`. Los caminos de este documento parten de la raíz del repositorio.

## Cómo leer los estados

- **Implementado en código:** el flujo y sus archivos existen. No significa que se haya validado contra Atlas, Cloudinary o Vercel.
- **Parcial:** existe una parte, pero faltan requisitos o verificaciones para aceptarla.
- **Pendiente:** no se encontró implementación en las fuentes revisadas.
- **No verificado:** falta acceso, una prueba de ejecución o el detalle del enunciado. No equivale a un resultado correcto.

Esta auditoría solo agrega documentación. Compilar y pasar pruebas son evidencias diferentes de completar un flujo con servicios externos. Ver [pruebas](08-PRUEBAS-Y-DESPLIEGUE.md) y [trazabilidad](09-REQUISITOS-SPRINTS.md).

## Ubicación por funcionalidad

| Funcionalidad y problema que resuelve     | Angular: archivo, clase y método                                                                                         | HTTP / controller y método Nest                                                                   | Service y método Nest                                                                                  | Modelo / colección                                                               | Validaciones y permisos actuales                                                                                           | Estado                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Registro: dar de alta a un jugador        | `frontend/src/app/pages/registro/registro.ts`: Registro.registrar; `services/auth.ts`: AuthService.registrar             | POST `/auth/registro`; `backend/src/auth/auth.controller.ts`: AuthController.registrar            | `auth/auth.service.ts`: AuthService.registrar → `usuarios/usuarios.service.ts`: UsuariosService.create | Usuario; colección esperada `usuarios`                                           | FormGroup, CreateUsuarioDto, coincidencia de claves, imagen opcional, bcrypt, duplicados; público; rol fijado como usuario | Implementado en código; integración externa no verificada                      |
| Login: comprobar identidad                | `pages/login/login.ts`: Login.iniciarSesion → AuthService.login                                                          | POST `/auth/login`; AuthController.login                                                          | AuthService.login → UsuariosService.findByIdentificadorConPassword                                     | Usuario                                                                          | LoginDto, bcrypt.compare, JWT y cookie HttpOnly de 20 s                                                                    | Implementado en código; navegador no verificado                                |
| Mi perfil: consultar al usuario conectado | `pages/mi-perfil/mi-perfil.ts`: MiPerfil.cargarMiPerfil → AuthService.obtenerMiPerfil; `guards/auth.guard.ts`: authGuard | GET `/auth/me`; AuthController.obtenerMiPerfil                                                    | AuthService.obtenerMiPerfil → UsuariosService.findById                                                 | Usuario                                                                          | JWT por cookie/Bearer, ObjectId comprobado y respuesta sin passwordHash; ruta Angular protegida                            | Parcial: datos personales reales, CV deportivo y material propio no integrados |
| Logout: retirar cookie del navegador      | MiPerfil.cerrarSesion → AuthService.cerrarSesion                                                                         | POST `/auth/logout`; AuthController.cerrarSesion                                                  | No llama service; usa Response.clearCookie                                                             | No cambia MongoDB                                                                | Mismas opciones de cookie; middleware de origen; endpoint sin AuthGuard                                                    | Implementado en código; borrado real de cookie no verificado                   |
| Listar usuarios                           | Sin pantalla ni servicio Angular específico                                                                              | GET `/usuarios`; UsuariosController.findAll                                                       | UsuariosService.findById para permiso y findAll para listado                                           | Usuario / colección esperada usuarios                                            | AuthGuard y AdministradorGuard; rol actual desde MongoDB; selección positiva sin credenciales                              | Implementado y verificado HTTP local; dashboard pendiente                      |
| Crear publicación de texto                | `pages/publicaciones/publicaciones.ts`: Publicaciones.publicar → `services/publicaciones.ts`: PublicacionesService.crear | POST `/publicaciones`; `publicaciones/publicaciones.controller.ts`: PublicacionesController.crear | `publicaciones/publicaciones.service.ts`: PublicacionesService.crear                                   | Publicacion / `publicaciones`                                                    | AuthGuard; autor del JWT; trim, 1–2000 caracteres y ObjectId; CreatePublicacionDto validado por ValidationPipe             | Parcial: no hay título ni carga de imagen                                      |
| Listar feed                               | Publicaciones.cargarPublicaciones → PublicacionesService.listar                                                          | GET `/publicaciones`; PublicacionesController.listar                                              | PublicacionesService.listar                                                                            | Publicacion con populate de Usuario                                              | Público; sort createdAt descendente y limit 50; sin offset ni filtro por usuario                                           | Parcial: no cumple página de 10 ni selector de orden                           |
| Subir avatar durante registro             | Registro.seleccionarImagen y registrar; FormData con clave `imagen`                                                      | Dentro de POST `/auth/registro`; FileInterceptor y ParseFilePipeBuilder                           | AuthService.registrar → `cloudinary/cloudinary.service.ts`: CloudinaryService.subirImagen              | URL en Usuario.imagenPerfil; archivo externo en Cloudinary                       | JPEG/PNG/WebP, límite 5 MiB, archivo opcional; memoria Multer                                                              | Implementado en código; carga externa no verificada                            |
| Tarjeta individual y demos                | `components/publicacion-card/publicacion-card.ts`: PublicacionCard, @Input publicacion; usada en MiPerfil                | No tiene endpoint propio                                                                          | No aplica                                                                                              | `models/publicacion.ts` y `data/publicaciones-demo.ts` son datos de demostración | Solo lectura, sin Output; contadores ficticios                                                                             | Parcial: el feed real renderiza article en línea                               |
| Saludo del servidor                       | No hay consumidor específico                                                                                             | GET `/`; `backend/src/app.controller.ts`: AppController.hola                                      | No aplica                                                                                              | No consulta colección                                                            | Público                                                                                                                    | Implementado en código; no es una comprobación de conexión a Atlas             |
| Comentarios, likes y bajas                | No hay flujos reales                                                                                                     | No hay endpoints                                                                                  | No hay servicios de estas operaciones                                                                  | No hay esquema de comentarios, likes ni marca de baja                            | No hay permisos de estas operaciones todavía                                                                               | Pendiente                                                                      |
| Administración, estadísticas y PWA        | No hay pantallas/configuración correspondiente                                                                           | No hay endpoints de reportes ni gestión de estado/rol                                             | No implementados                                                                                       | Rol ya existe en Usuario; estados y reportes no                                  | Rol de listado implementado; otras operaciones administrativas pendientes                                                  | Pendiente                                                                      |

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

**¿Dónde se guarda una publicación?** Publicaciones.publicar llama al servicio Angular; el controller toma autorId del JWT; PublicacionesService.crear de Nest construye `new this.publicacionModel(...)` y ejecuta `.save()` en la colección `publicaciones`. La implementación actual solo guarda texto y metadatos de multimedia vacíos.

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

## Seguridad básica — Tarea 2

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
