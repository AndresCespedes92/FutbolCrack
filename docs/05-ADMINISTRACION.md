# 05 — Administración

## Qué existe y qué no

Usuario declara perfil con enum `usuario` o `administrador` y valor por defecto usuario. UsuariosService.create fuerza `perfil: 'usuario'`; CreateUsuarioDto no acepta un perfil enviado desde el registro público. El JWT incluye perfil, pero AuthGuard solo verifica firma/expiración.

GET `/usuarios` usa AuthGuard y AdministradorGuard. Este último consulta el rol actual en MongoDB y exige administrador. UsuariosService.findAll aplica una selección positiva sin credenciales; no tiene paginación. No hay todavía pantalla de administración, alta administrativa, cambio de estado o endpoint de baja de publicaciones.

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
