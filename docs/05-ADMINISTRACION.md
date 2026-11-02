# 05 — Administración

## Estado vigente — Tarea 5A, 2026-11-01

La administración se implementa en UsuariosModule existente y en `/dashboard/usuarios`. Resuelve que el secretario del club pueda mantener el padrón sin permitir que un jugador común lo descargue o cambie permisos. **Rol** indica qué puede hacer (`usuario`/`administrador`); **activo** indica si puede usar la cuenta. No son tipos nuevos de jugador/reclutador.

### Endpoints y recorrido de datos

Todos los métodos de UsuariosController tienen AuthGuard y AdministradorGuard a nivel de clase. La identidad proviene del JWT verificado y el estado/rol se consultan en MongoDB.

| Endpoint | Método de servicio | Respuesta correcta |
| --- | --- | --- |
| GET `/usuarios` | `findAll` | 200, array con `_id`, ficha, `perfil` y `activo`; selección positiva sin hash |
| POST `/usuarios` | `crearAdministrativo` | 201, `{mensaje, usuario}` sin credenciales |
| DELETE `/usuarios/:id` | `deshabilitar` | 200, `{mensaje}`; establece `activo:false` |
| POST `/usuarios/:id/habilitar` | `habilitar` | 200, `{mensaje}`; establece `activo:true` |

Sin sesión: 401. Sesión de usuario común: 403. DTO/ID inválido: 400; cuenta inexistente: 404; duplicado, operación repetida o cuenta protegida: 409. El middleware CSRF existente puede responder 403 antes de los guards cuando una escritura con cookie no tiene origen permitido. Las pruebas usan Origin autorizado para distinguir permisos de CSRF.

DashboardUsuarios → UsuariosService Angular (`withCredentials`) → UsuariosController Nest → UsuariosService Nest → modelo Usuario/MongoDB → mensaje o listado. El componente de confirmación solo emite eventos; no conoce HTTP.

### Alta y validaciones

CrearUsuarioAdministrativoDto hereda el contrato público y agrega únicamente `perfil` con dos valores. Declara completas las reglas de los campos que redefine: nombres de 2 a 50 letras/separadores; nombreUsuario de 3 a 20 caracteres permitidos; clave de 8 a 64 caracteres con mayúscula y número. Conserva correo, fecha ISO, confirmación y descripción del DTO base; la coincidencia de claves se verifica en `generarHashPassword`. Angular además rechaza fechas futuras. La fecha futura no tiene una validación equivalente nueva en Nest: queda como límite de las reglas heredadas.

`backend/src/common/password.ts` comparte bcrypt costo 12 con AuthService.registrar. `guardarUsuario` concentra normalización de correo, duplicados y persistencia. El registro público sigue forzando `perfil:usuario` y `activo:true`; no acepta campos de rol/estado. El alta administrativa recibe texto, no hash ni imagen. El DTO rechaza propiedades ajenas; no existe PATCH genérico para cambiar roles.

### Baja lógica y política de administradores

Deshabilitar conserva ficha, contraseña y relaciones con publicaciones/comentarios: como suspender el carnet sin destruir el archivo del club. Habilitar recupera el acceso. Los registros antiguos sin campo se interpretan como activos mediante `activo !== false`; no hay migración ni escritura masiva.

**Política conservadora explícita:** nadie puede deshabilitarse a sí mismo y este endpoint no permite deshabilitar ninguna cuenta administradora, aunque existan varias. La UI explica que esas cuentas están protegidas. Esto protege al último administrador incluso frente a bajas simultáneas sin introducir transacciones ni un conteo vulnerable a concurrencia. Otro administrador activo sí puede rehabilitar una cuenta administradora que ya estuviera inactiva. No se implementa edición de roles. Esta restricción es más amplia que proteger únicamente al último administrador.

La actualización incluye el estado esperado y, para baja, el rol distinto de administrador. Si cambian mientras se procesa, responde 409 en lugar de informar una baja inexistente. No se borra ningún documento. Si no existe ningún administrador activo en la base real, se requiere un procedimiento externo autorizado para recuperarlo; esta tarea no crea cuentas reales ni credenciales de emergencia.

### Dashboard y comprobación

Formulario con radios de rol, validaciones rojas/verdes y reglas reutilizadas del registro/CineBera; la factoría crea controles independientes. Carga, vacío, reintento y errores tienen texto propio. Durante solicitudes se bloquean envíos repetidos. El modal identifica nombre y usuario, permite cancelar sin DELETE, mantiene el error si falla y muestra éxito solo tras respuesta correcta. Habilitar es una acción directa; la baja siempre requiere confirmar. CSS separado comenta grilla, radios y scroll horizontal local para móviles.

Para probar con cuentas de un entorno de prueba: entrar como admin, abrir Administrar usuarios, crear ambos roles, cancelar una baja y comprobar que no hay DELETE; confirmarla y verificar el estado. Intentar login y un endpoint protegido con el JWT anterior: 401. Rehabilitar y volver a acceder. Un usuario común que navega al dashboard vuelve al feed con aviso, conservando su sesión. No usar cuentas reales para ensayos destructivos.

Pruebas automatizadas: backend 223/223 y frontend 162/162, ambas compilaciones correctas. Se utilizan HTTP local y persistencia simulada, más validación Mongoose en memoria; no se comprobó Atlas, navegador real ni despliegue. El listado administrativo actual no pagina; evaluar paginación si aumenta el padrón. Conceptos: roles/estado, DTO, inyección, guards, proyección, actualización condicional, formularios reactivos e Input/Output.

## Antecedentes históricos (anteriores a 5A)

## Qué existe y qué no

Usuario declara perfil con enum `usuario` o `administrador` y valor por defecto usuario. UsuariosService.create fuerza `perfil: 'usuario'`; CreateUsuarioDto no acepta un perfil enviado desde el registro público. El JWT incluye perfil, pero AuthGuard solo verifica firma/expiración.

GET `/usuarios` usa AuthGuard y AdministradorGuard. Este último consulta el rol actual en MongoDB y exige administrador. UsuariosService.findAll aplica una selección positiva sin credenciales; no tiene paginación. No hay todavía pantalla de administración, alta administrativa, cambio de estado de usuarios. La baja lógica de publicaciones existe en backend desde 3A, sin interfaz todavía.

No hay campo habilitado/activo en Usuario, ni método para establecerlo. UpdateUsuarioDto existe como PartialType de registro, pero no hay un PATCH de usuarios que lo consuma. Su presencia no demuestra edición implementada.

## Ejemplo del club

El secretario puede administrar socios; un socio común no debería descargar el padrón completo ni deshabilitar a otro. Tener un carnet válido responde «quién sos», pero todavía hay que revisar «si podés hacer esta operación». Un rol técnico de administrador no crea un tipo de cuenta de reclutador: se conserva el enfoque del producto de perfiles compartidos.

## Archivos y flujo actual

- `backend/src/usuarios/entities/usuario.entity.ts`: rol y estructura.
- `backend/src/usuarios/usuarios.controller.ts`: UsuariosController.findAll, GET usuarios con AuthGuard y AdministradorGuard.
- `backend/src/usuarios/usuarios.service.ts`: findAll, create, findById y búsquedas para auth.
- `backend/src/auth/auth.service.ts`: firma de JWT y lectura de usuario.
- `backend/src/auth/guards/auth.guard.ts`: autenticación, sin autorización de rol ni consulta de estado.
- `backend/src/usuarios/guards/administrador.guard.ts`: canActivate verifica el rol actual usando findById, sin confiar en un rol libre del cliente.
- `frontend/src/app/guards/auth.guard.ts`: controla MiPerfil; no es guard de administrador.

Flujo existente de listado: cliente HTTP con JWT → AuthGuard → AdministradorGuard → UsuariosService.findById/rol vigente → UsuariosController.findAll → UsuariosService.findAll y proyección → colección esperada usuarios. No existe consumidor de dashboard Angular. La ejecución contra MongoDB no se comprobó.

## Plan Sprint 4, sin implementar

| Función requerida             | Trabajo propuesto                                                                                                                                           | Validaciones y permisos                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard de usuarios         | Reutilizar UsuariosModule; pantalla standalone y servicio Angular con tabla/estados/mensajes. Definir contrato de listado sin hash y con campos necesarios. | El listado ya exige administrador en Nest; reutilizar esa política para nuevas operaciones y revisar los campos de cada pantalla. |
| Alta desde administración     | Reutilizar reglas/hashing de registro sin duplicarlas; separar el contrato de alta administrativa del registro público.                                     | Solo administrador; validar correo/usuario, duplicados y perfil permitido; nunca aceptar hash desde UI.                           |
| Habilitar/deshabilitar        | Agregar estado al modelo y una operación acotada; planificar qué significa para usuarios existentes.                                                        | Permiso backend y comprobación de estado al autorizar/login/renovar/operaciones privadas; no confiar en un JWT viejo por sí solo. |
| Baja de cualquier publicación | Ampliar PublicacionesService y su controller, no duplicar una segunda lógica de bajas en administración.                                                    | Autor o administrador según Sprint 2/4; baja lógica y filtro de visibles.                                                         |
| Confirmación y resultado      | Modal propio compartido que nombre usuario/publicación; flags mientras espera.                                                                              | Cancelar no manda solicitud; Confirmar espera respuesta y muestra éxito o error.                                                  |

Las rutas nuevas de administración y estados quedan por acordar; no hay endpoints PATCH/DELETE actuales. Reutilizar módulos existentes salvo que el enunciado oficial exija otro. No se debe pasar UpdateUsuarioDto íntegro a una actualización genérica de perfil/rol/contraseña sin definir campos y permisos.

## Riesgos y límites registrados

- **H02 resuelto en Tarea 2 para el listado:** 401 sin sesión, 403 para usuario común y 200 para administrador actual comprobados por HTTP local. Otras operaciones administrativas todavía no existen.
- **H03 mitigado en Tarea 2:** listado restringido a administradores y selección positiva sin credenciales. Los datos personales elegidos son para ese padrón, no para un directorio público; revisar los campos si cambia el uso.
- **H08:** no hay estado para deshabilitar ni invalidación inmediata de permisos almacenados en tokens. No afirmar que una baja de usuario ya impediría operar.
- No se verificó si hay administradores reales creados manualmente en Atlas. No se inspeccionó ni alteró esa base.

## Pruebas para aceptar la implementación futura

Con dos usuarios normales y un administrador de prueba: listado administrativo permitido solo al admin, alta con duplicados, registro público sin escalación de rol, deshabilitación confirmada/cancelada, operación de usuario deshabilitado con token aún vigente, éxito/error visibles y baja lógica de una publicación ajena solo por administrador. Comprobar el comportamiento directo de los endpoints sin Angular.

Conceptos: autorización por rol, privilegio mínimo, proyección de respuesta, baja lógica, relación estado-token, reutilización de servicios y separación de validación/negocio/presentación. Tarea 1 recuperó la unidad del controller con un doble. Tarea 2 agregó ocho casos HTTP con guards reales y una prueba del servicio/proyección; no requieren MongoDB. El resto de funcionalidades administrativas sigue sin implementarse.

## Ejemplo y alcance de Tarea 2

El socio común puede publicar pero no obtener el padrón completo. El secretario que figura hoy como administrador sí puede consultarlo; un carnet viejo no conserva ese permiso si la ficha cambió. Esto se aplica en Nest y no depende de botones Angular. UsuariosModule registra el guard reutilizando su servicio y SeguridadModule, sin módulos nuevos ni cambios al registro público.

Los datos de prueba y el modelo/servicio de persistencia se simulan. No se inspeccionaron ni cambiaron roles reales de Atlas y no se implementó habilitar/deshabilitar: el modelo aún no tiene ese estado. El dashboard de Sprint 4 sigue parcial aunque el permiso de este endpoint ya esté protegido.

## Actualización 3A — Baja administrativa de publicaciones

PublicacionesService.darDeBaja comparte una sola operación para autor o administrador actual; reutiliza UsuariosService.findById sin modificar el registro público ni AuthGuard. DELETE /publicaciones/:id responde 403 a un tercero y 404 a una publicación ausente/ya retirada; aplica updateOne activo false, no borrado físico. La prueba permite un administrador actual aunque el claim de rol de su JWT sea viejo, y rechaza el caso inverso.

Es como retirar de la cartelera del club un parte que el administrador puede gestionar, conservándolo en el archivo. El botón/modal y la vista administrativa siguen pendientes: no se agregó baja desde Angular en 3A.

## Actualización 5B — Moderación y estadísticas (2026-11-01)

Se conserva la política de usuarios de 5A, incluyendo protección de todas las cuentas administradoras. Se agrega /dashboard/estadisticas y tres GET administrativos definidos en [06-ESTADISTICAS.md](06-ESTADISTICAS.md), sin dependencias ni otro módulo funcional. El mismo guard protege ambos dashboards; Nest comprueba estado/rol actual.

La revisión confirma que **DELETE /publicaciones/:id ya cumple**: autor o administrador actual, actualización activo false y documento conservado. Un usuario común no retira publicaciones ajenas. Feed/detalle exigen activo distinto de false y ComentariosService.exigirPublicacionActiva impide consultar comentarios de publicaciones retiradas. No se duplica endpoint ni lógica ni se agrega panel de reclutadores.

Ejemplo: el secretario retira una jugada ajena desde el feed. ConfirmacionBaja identifica título; Cancelar no manda DELETE. Confirmar llama al endpoint existente, bloquea envíos repetidos y muestra éxito tras completar; ante error mantiene modal/mensaje. Jugada y notas siguen archivadas, pero detalle/comentarios públicos responden 404 y reportes dejan de contarlos. La prueba HTTP integrada y la nueva prueba Angular del admin verifican ese recorrido; los casos anteriores de 403/error siguen vigentes.

No fueron necesarios cambios productivos al servicio de bajas, permisos o modal; solo enlace estadístico y aviso de acceso denegado, además de la pantalla nueva. Las métricas reflejan contenido visible actualmente, no cifras históricas inmutables. Fechas/política en 06 y evidencia en 08.

## Dictamen 5D

S4-04 se evalúa **Parcial** respecto de habilitar/deshabilitar usuarios en general: la implementación funciona para jugadores y rehabilitación, pero la política 5A prohíbe deshabilitar a cualquier administrador, aunque existan varios. Se conserva esa decisión, sin ampliarla improvisadamente durante una auditoría. La protección real de Nest y las pruebas siguen vigentes; no se cambió ningún rol o cuenta real.

Dashboard/altas/reportes cumplen criterios locales comprobados. Acceso positivo con admin real, cookies entre dominios y datos persistidos siguen pendientes M11–M13. Anónimos reciben 401 real en /usuarios y reportes. Nuevas altas comparten límite de clave seguro de 5D. Ver [11](11-AUDITORIA-FINAL.md) y [12](12-GUIA-DE-DEMOSTRACION.md).

## Política vigente 5F — reemplaza la restricción conservadora anterior

El usuario autorizó permitir la suspensión de otro administrador. La cuenta propia sigue protegida; al menos uno debe permanecer activo. UI deja disponible la acción para otra cuenta activa y exige el modal existente; Nest vuelve a comprobar permisos. UsuariosService.deshabilitarAdministrador usa transacción Atlas, escribe la ficha del actor antes de contar/suspender y evita la carrera de dos secretarios que intentan bloquearse mutuamente. No cambia registro público ni borra fichas. La rehabilitación sigue disponible.

Ejemplo: A suspende a B, B pierde acceso incluso con carnet JWT previo; A puede rehabilitarlo. Ni A ni B pueden suspenderse a sí mismos; si intentan suspenderse mutuamente a la vez, una operación se rechaza y queda un administrador. Pruebas HTTP locales, frontend y cinco carreras reales documentadas en [14](14-ACEPTACION-FINAL.md), con archivos, códigos y evidencia. Requiere transacciones MongoDB; no hay fallback que arriesgue dejar el club sin administración.
