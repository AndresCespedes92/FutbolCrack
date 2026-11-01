# 02 — Autenticación y seguridad

## Estado vigente de habilitación — Tarea 5A

Las limitaciones históricas de 4C sobre ausencia de `activo` quedan resueltas localmente. UsuarioSchema incorpora booleano con default true; ausencia significa activo. No se migró la base.

AuthGuard verifica firma/expiración y consulta el modelo Usuario (`_id perfil activo`) en **cada solicitud protegida**. Cuenta inexistente o `activo:false`: 401, aun si el JWT fue emitido antes de la baja. Usa el rol actual de la ficha, no el claim antiguo. La consulta se realiza fuera del catch de verificación: una caída de MongoDB produce error de servidor, sin simular una sesión inválida. SeguridadModule registra/exporta el mismo modelo Mongoose existente para permitir la inyección en guards sin crear un ciclo con UsuariosService.

AuthService.login comprueba la contraseña y luego el estado; con credenciales correctas de cuenta deshabilitada informa 401 y un mensaje comprensible, que Angular muestra. No revela el estado si la contraseña es incorrecta. `me`, `autorizar` y `refrescar` también exigen cuenta habilitada. JWT de 900 segundos, cookies HttpOnly y protección CSRF de 4C se conservan. Las respuestas públicas agregan `activo`, nunca JWT ni hash.

Ejemplo: el club suspende el carnet de un jugador. Aunque conserve una credencial firmada, la puerta vuelve a consultar su ficha y lo rechaza. El padrón y su contenido no se destruyen. Las lecturas públicas siguen siendo públicas: el guard opcional puede tratarlas como anónimas, mientras que las escrituras protegidas se rechazan.

Rehabilitar permite usar otra vez un JWT anterior si todavía no venció. No hay revocación individual persistente de tokens ni cancelación de solicitudes que ya superaron el guard antes de la baja. Logout conserva su política anterior de borrar cookie. Esta solución añade una consulta a MongoDB por acceso protegido y depende de su disponibilidad.

AdministradorGuard exige nuevamente cuenta existente/habilitada y rol vigente. Todas las operaciones de UsuariosController lo usan. CrearUsuarioAdministrativoDto es exclusivo del endpoint protegido; el registro público continúa forzando usuario/activo. No se habilita asignación libre de roles. La baja protege todas las cuentas administradoras y la propia cuenta; consultar política detallada en [05-ADMINISTRACION.md](05-ADMINISTRACION.md).

Angular administradorGuard utiliza comprobarAcceso de AuthService y verifica rol/estado para navegar; la decisión definitiva sigue en Nest porque cualquier cliente puede construir una solicitud HTTP. Un 403 mantiene la sesión válida y muestra aviso en el feed; un 401 sigue el tratamiento de expiración de 4C. AuthService también rechaza defensivamente metadatos de sesión que indiquen activo false.

Pruebas HTTP locales cubren 401/403/200, token previo, autorización/renovación, rol actual, fallo de base, CSRF y compatibilidad sin campo. Ver comandos y límites en [08-PRUEBAS-Y-DESPLIEGUE.md](08-PRUEBAS-Y-DESPLIEGUE.md). No se inspeccionaron secretos, cuentas ni roles reales.

## Antecedentes históricos (anteriores a 5A)

## Estado vigente — Sprint 3, Tarea 4C (01/11/2026)

Se implementan JWT de 15 minutos, autorización inicial, renovación voluntaria de JWT vigente, aviso/modal a los diez minutos, expiración/redirección y manejo central de 401. Se reutilizan AuthModule, AuthService, AuthController y el guard existente, sin refresh tokens persistentes ni módulos nuevos. Las descripciones históricas de 20 segundos al final registran estados anteriores y quedan reemplazadas por esta sección.

**Limitación conocida antes de implementar:** Usuario no tiene habilitado/activo ni una operación de deshabilitación. Se valida existencia y se consulta la ficha/rol actual, pero no se puede distinguir un usuario deshabilitado con este modelo. No se inventa un campo ni gestión de usuarios de Sprint 4. El caso real de usuario deshabilitado queda pendiente hasta definir ese modelo; no se presenta como probado por comprobar solamente un usuario eliminado.

## Carnet, firma y sobre: JWT frente a cookie

Como en un club, JWT es el carnet firmado con identidad y vencimiento; la cookie es el sobre que el navegador guarda y envía. HttpOnly impide leerla desde JavaScript, no significa que el navegador deje de enviarla con HTTP. La firma no cifra el contenido y no concede permisos administrativos por sí sola: las operaciones con rol siguen consultando la ficha actual en MongoDB.

DURACION_SESION_SEGUNDOS en backend/src/auth/sesion.constants.ts vale 900. SeguridadModule lo usa en JwtModule y AuthService.emitirSesion al firmar. El controller pasa el token a guardarCookieSesion, que calcula maxAge según expiraEn real menos Date.now, sin agregar otros quince minutos al terminar la solicitud. JWT tiene resolución de segundos; por tiempo de procesamiento/red el Max-Age puede ser ligeramente menor que 900 segundos.

| Cookie token | Desarrollo | NODE_ENV production |
| --- | --- | --- |
| HttpOnly | true | true |
| Secure | false | true |
| SameSite | lax | none |
| Path | / | / |
| MaxAge | Hasta exp del JWT | Hasta exp del JWT |

Se conservan los atributos de la arquitectura Vercel; no se cambia SameSite ni se agrega Domain. Inicio y renovación comparten guardarCookieSesion/opcionesCookieSesion; logout borra con las mismas opciones. Para peticiones entre orígenes Angular conserva withCredentials. HttpOnly y envío de credenciales tienen responsabilidades distintas, y SameSite=None requiere Secure: [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

El token interno de AuthService nunca se devuelve en JSON. Angular solo guarda usuario/fechas en memoria; no lee document.cookie, no decodifica JWT ni guarda tokens en localStorage/sessionStorage.

## Endpoints y contrato real

### POST /auth/login

Conserva LoginDto, búsqueda de usuario y bcrypt.compare. Firma sub/perfil de la ficha real y emite cookie. Devuelve mensaje y los mismos metadatos que autorizar/renovar; no autoautoriza un registro ni habilita roles libres.

### POST /auth/autorizar

Usa el AuthGuard existente marcado SOLO_COOKIE_SESION: toma la cookie token y verifica firma/expiración, no utiliza Bearer como sustituto de cookie en este endpoint. El mismo guard conserva cookie/Bearer en los endpoints que ya los soportaban; no hay una segunda estrategia.

AuthService.autorizar comprueba exp vigente, consulta UsuariosService.findById y vuelve a comprobar vigencia después de la consulta. Devuelve datos públicos del usuario actual y fechas ISO. No cambia cookie ni emite otro JWT.

### POST /auth/refrescar

Usa el mismo guard y política de cookie. Solo acepta un JWT vigente y usuario existente. Recomprueba vencimiento antes y después de emitir para no renovar si caduca durante la consulta o firma. Emite otro JWT por 900 segundos desde la renovación con el rol actual, actualiza cookie y devuelve fechas/usuario. Un body que diga administrador no concede ese rol. No se acepta un token vencido para recuperar sesión.

Respuesta 200 de ambos endpoints (datos ilustrativos, sin token):

```json
{
  "usuario": {
    "id": "000000000000000000000001",
    "nombre": "Lucía", "apellido": "Torres", "correo": "lucia@club.test",
    "nombreUsuario": "lucia.8", "fechaNacimiento": "2004-01-01T00:00:00.000Z",
    "descripcion": "Mediocampista", "imagenPerfil": "/foto.png", "perfil": "usuario"
  },
  "emitidaEn": "2026-11-01T12:00:00.000Z",
  "expiraEn": "2026-11-01T12:15:00.000Z",
  "horaServidor": "2026-11-01T12:00:00.000Z"
}
```

Login agrega `mensaje: "Inicio de sesión correcto"`. El servicio selecciona estos campos con datosPublicos; no devuelve passwordHash, password ni JWT. GET /auth/me conserva su respuesta de usuario para consumidores anteriores y ahora responde 401 si la ficha de la sesión desapareció. POST /auth/logout conserva borrado de cookie; Angular limpia su estado solo después de éxito, manteniéndolo ante error transitorio.

Errores: 401 para cookie ausente/inválida/vencida, identidad/fechas inválidas o usuario eliminado; 403 si falla origen CSRF o permiso de una operación. Sin Origin/Referer en una operación de sesión el middleware puede responder 403 antes del guard: los casos de autenticación 401 presuponen una solicitud de origen permitido.

## Inicio de Angular y recarga

1. App.ngOnInit llama a comprobarSesion y muestra pantalla de carga en lugar del RouterOutlet.
2. AuthService.autorizar envía POST con cookies. Si el guard de una ruta protegida también lo necesita, shareReplay comparte el único pedido pendiente.
3. Una sesión válida llena usuarioActual/expiraEn y programa tiempos; la app continúa en la URL solicitada, incluido el detalle de una jugada. No vuelve siempre al feed.
4. Sesión inválida lleva a login con returnUrl interno. Login/registro siguen accesibles y no generan redirecciones a sí mismos.
5. Error de red/500 muestra Reintentar; no equivale a vencimiento ni desencadena un bucle.
6. Tras login se recupera estado directamente de su respuesta y se vuelve al destino interno o publicaciones. Se descartan retornos externos y destinos login/registro.

Las rutas y GET públicos de feed/detalle se conservan: el arranque comprueba y redirige al login si no hay sesión; navegar después a una lectura pública no convierte el GET en una operación privada. Mi Perfil sigue usando authGuard. La autorización real de escrituras y datos privados permanece en Nest.

obtenerMiPerfil reutiliza usuarioActual después del arranque y evita GET me duplicados desde perfil/feed/detalle. El método conserva un GET me de compatibilidad para consumidores aislados que todavía no autorizaron. comprobarAcceso consulta estado vigente o comparte autorizar. No se renueva un token desde un guard ni desde el interceptor.

## Aviso, renovación y vencimiento

AuthService calcula la diferencia aproximada entre horaServidor y el reloj del navegador, y programa desde expiraEn, no desde el instante de montar Angular. A exp menos cinco minutos se abre ExtenderSesion; para un token nuevo de quince minutos ocurre al minuto diez.

Ejemplo del club: carnet emitido 12:00, vence 12:15, aviso 12:10. Aceptar a las 12:10 llama refrescar y el carnet nuevo vence 12:25. Ahora no cierra el modal y conserva sesión hasta 12:15, sin refresco automático. Un aviso descartado no se reabre por un focus de esa misma sesión en memoria. Al recargar se vuelve a comprobar la cookie y reconstruir los tiempos; si quedan menos de cinco minutos aparece el aviso con minutos aproximados reales restantes.

ExtenderSesion es un modal propio con dialog nativo, Ahora no/Extender sesión y estado de espera/error. Solo el Output extender dispara refrescar desde App. Durante la solicitud se deshabilitan repeticiones; error transitorio mantiene el modal/sesión y permite reintentar antes de exp. Éxito cierra, reemplaza expiración y limpia/recrea los dos timers. No hay alert/window.confirm.

El servicio tiene un timer de aviso y otro de vencimiento; limpiarTemporizadores se ejecuta al recuperar otra sesión, vencer, cerrar sesión o destruir el servicio. Al volver por focus/visibilitychange compara nuevamente la expiración, porque un navegador suspendido puede haber retrasado callbacks. Los listeners también se eliminan al destruir el servicio. versionSesion descarta respuestas viejas después de logout/vencimiento para no recuperar estado obsoleto.

La hora calculada en Angular es una ayuda de UI (incluye una estimación de desfase y puede tener latencia); la decisión definitiva es la firma/exp en Nest. Si el navegador llega tarde, el backend rechaza y el interceptor redirige.

## Interceptor: 401 no es 403

sesionInterceptor se registra con provideHttpClient(withInterceptors(...)) en app.config.ts. Solo actúa sobre el origen exacto API_URL y endpoints protegidos: me/refrescar/usuarios y escrituras de publicaciones/comentarios. URL relativas se resuelven según document.baseURI y no se atribuyen artificialmente a la API externa.

Un 401 protegido invalida estado y timers y navega a login con un mensaje; el guard/root manejan el 401 esperado de autorizar y login maneja credenciales erróneas, sin bucles. Un 403, error de red o 500 se propaga al componente y mantiene la sesión. Así, un rechazo de permiso al retirar una jugada no cierra el carnet del socio.

Los errores transitorios conservan formularios/borradores existentes. Un vencimiento real/401 que navega a login destruye la vista y su borrador local; no se promete persistencia de texto entre login y pantalla anterior. Se corrigió el mensaje anterior de comentarios para no afirmar lo contrario. No se almacena texto sensible o contraseñas para simular esa continuidad.

## CSRF y CORS: control aplicado

CORS limita qué páginas pueden leer respuestas; no basta como defensa CSRF. ValidarOrigenMiddleware conserva lecturas/preflight y refuerza escrituras:

- Origin presente debe coincidir exactamente con localhost:4200 o FRONTEND_URL. `null`, subdominios parecidos y orígenes ajenos se rechazan.
- Si Origin falta, extrae el origen de Referer con URL y compara la misma lista. Un Referer mal formado se rechaza; uno permitido no anula un Origin ajeno presente.
- Si ambos faltan, rechaza operaciones de sesión (login/logout/autorizar/refrescar) y escrituras con cookies. No se confía en Host/X-Forwarded-Host para construir el permiso.
- Clientes Bearer sin cookies conservan su uso fuera de las operaciones de sesión; un token en cabecera requiere una decisión explícita del cliente y no se envía como cookie ambiental.

La lista origenesPermitidos es compartida entre middleware y main.ts, manteniendo la configuración CORS previa con credentials true. No se leen ni modifican valores de .env en esta tarea. La validación de encabezados y rechazo ante ausencia siguen el criterio de verificación de origen de [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#using-standard-headers-to-verify-origin); no se presenta CORS o SameSite=None como protección suficiente.

Impacto para pruebas manuales/Postman/curl: las operaciones de sesión y escrituras con cookie deben enviar un Origin o Referer permitido. No se incorpora una excepción insegura para facilitar las pruebas. La lista exacta de FRONTEND_URL en Vercel y el comportamiento de cookies de terceros se deben verificar en navegador real.

## Compatibilidad, límites y pendientes

Las cookies antiguas no cambian de duración por configurar 900 segundos: el JWT ya emitido sigue con su exp original. Autorizar no lo extiende; si está vencido exige login y si está vigente puede renovarse solo por decisión del usuario. Cambiar la duración no rota secretos ni invalida todos los JWT anteriores.

No hay revocación de JWT: logout borra cookie, pero una copia previa seguiría siendo válida hasta exp. No hay refresh token persistente ni revocación entre pestañas. Los timers son por pestaña; recargar resincroniza con la cookie. Cerrar una suscripción no revierte un Set-Cookie que el servidor ya haya emitido. XSS/origen permitido comprometido y políticas del navegador siguen siendo riesgos que esta tarea no pretende eliminar.

**Pendientes para aceptación final:** política de habilitación de cuentas cuando exista un campo/operación aprobados; ensayo con MongoDB real, despliegue coordinado de metadatos/endpoints/interceptor, cookie/CORS/FRONTEND_URL/Origin reales y modal/foco/suspensión en navegador/dispositivos. No se da por validada producción ni por implementado Sprint 4.

## Dónde estudiar

| Archivo | Clase / método |
| --- | --- |
| backend/src/auth/sesion.constants.ts | DURACION_SESION_SEGUNDOS y SOLO_COOKIE_SESION. |
| backend/src/auth/sesion-cookie.ts | opcionesCookieSesion y guardarCookieSesion; login/refresco/logout coherentes. |
| backend/src/auth/auth.service.ts | autorizar, refrescar, exigirVigencia, exigirUsuarioDeSesion, emitirSesion, metadatos, datosPublicos. |
| backend/src/auth/auth.controller.ts | POST autorizar/refrescar, login y cookie; GET me compatible. |
| backend/src/auth/guards/auth.guard.ts | AuthGuard: misma verificación de firma/exp, metadata para cookie obligatoria y claims mínimos válidos. |
| backend/src/common/middlewares/validar-origen.middleware.ts | Origin/Referer y rechazo ante ausencia donde corresponde. |
| backend/src/common/origenes-permitidos.ts | Lista compartida con CORS de main.ts. |
| frontend/src/app/services/auth.ts | Estado central, autorizar/comprobarAcceso/recuperarSesion, refrescar/ahoraNo, comprobarTiempo/finalizarSesion/limpiarTemporizadores. |
| frontend/src/app/services/api.config.ts | API_URL compartida por auth/publicaciones/comentarios/interceptor. |
| frontend/src/app/app.ts/html/css | Comprobar inicio, carga/error/reintento y modal. |
| frontend/src/app/components/extender-sesion/ | Modal presentacional, Outputs y foco/teclado. |
| frontend/src/app/interceptors/sesion.interceptor.ts | 401 acotado sin confundir 403. |
| frontend/src/app/guards/auth.guard.ts | Estado compartido y retorno a login con destino. |
| frontend/src/app/pages/login/ | Recupera datos del login y vuelve a returnUrl interno. |

Pruebas y comandos exactos en [08](08-PRUEBAS-Y-DESPLIEGUE.md); guía de defensa y recorrido en [guia-angular.md](guia-angular.md).

---

## Historial previo a 4C — auditoría y tareas anteriores

Las secciones siguientes se conservan como registro. Sus pendientes de duración/renovación describen el estado anterior y no el contrato vigente de esta primera parte.

## Estado y archivos

La identidad del jugador es como su carnet de socio: Angular puede decidir qué pantalla abrir, pero la oficina Nest debe revisar el carnet en cada operación privada. El guard del navegador no reemplaza al del servidor.

| Pieza                | Ubicación y responsabilidad                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| Registro Angular     | Registro.registrar, crearFormularioRegistro y registro.validators.ts: FormData, reglas locales y mensajes. |
| Registro Nest        | AuthController.registrar + CreateUsuarioDto + AuthService.registrar + UsuariosService.create.              |
| Login                | Login.iniciarSesion → AuthService.login Angular → AuthController.login → AuthService.login Nest.           |
| Configuración JWT    | `backend/src/auth/seguridad.module.ts`, expiresIn: '20s'.                                                  |
| Cookie               | AuthController.login: token, HttpOnly, path / y maxAge 20 * 1000.                                          |
| Verificación Nest    | AuthGuard.canActivate: Bearer prioritario o extracción manual de cookie, verifyAsync y request.user.       |
| Verificación Angular | authGuard usa obtenerMiPerfil; 401 genera UrlTree a /login; errores de red se propagan.                    |
| Perfil               | AuthController.obtenerMiPerfil / AuthService.obtenerMiPerfil y UsuariosService.findById.                   |
| Logout               | AuthController.cerrarSesion borra la cookie; Angular vuelve a Login.                                       |

Los archivos Angular están en `frontend/src/app/`; los de servidor, en `backend/src/`. El [mapa](00-MAPA-DEL-PROYECTO.md) identifica rutas completas.

## Registro y contraseña

Angular valida nombre/apellido 2–50 con letras y separadores, usuario 3–20, correo, clave 8–64 con mayúscula y número, fecha no futura, descripción hasta 300 e imagen opcional de hasta 5 MiB. Usa dirty/touched y NgClass para mostrar mensajes rojo/verde.

CreateUsuarioDto valida textos no vacíos, correo, mínimo 8/mayúscula/número, fecha ISO y descripción hasta 300. No replica los límites y patrones de nombres/usuario ni el máximo de clave, y no rechaza explícitamente una fecha futura. Son diferencias a revisar, no una garantía de que toda regla de Angular esté protegida en Nest.

AuthService.registrar compara las claves y usa bcrypt.hash(password, 12). UsuariosService.create consulta correo/usuario, fija perfil usuario y maneja error de duplicado 11000. El schema declara unique para ambos; la creación efectiva de índices en Atlas no se comprobó. PasswordHash tiene select:false y las respuestas de auth usan proyecciones sin hash. `findByIdentificadorConPassword` lo incluye solo para bcrypt.compare durante login.

## Sesión y cookies actuales

Login firma un JWT con sub y perfil, además de las fechas que agrega la biblioteca. El controller no devuelve el token en el JSON; envía un mensaje y una cookie token. Angular utiliza withCredentials en login, me, logout y creación de publicaciones, sin guardarlo en localStorage.

| Opción   | Desarrollo  | NODE_ENV production |
| -------- | ----------- | ------------------- |
| HttpOnly | true        | true                |
| Secure   | false       | true                |
| SameSite | lax         | none                |
| Path     | /           | /                   |
| MaxAge   | 20 segundos | 20 segundos         |

HttpOnly restringe la lectura desde scripts; Secure limita el envío a HTTPS; SameSite controla escenarios de envío entre sitios. Con SameSite=None se requiere Secure. Son propiedades diferentes, y las políticas de cookies del navegador pueden afectar despliegues entre dominios. [Referencia MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

AuthGuard conserva la verificación de firma/expiración. GET me además comprueba que el usuario exista. POST publicaciones no consulta el rol, porque un usuario común autenticado puede publicar. GET usuarios agrega AdministradorGuard después de AuthGuard: consulta el rol actual mediante UsuariosService.findById y solo permite administrador. No hay campo de habilitación todavía.

UsuariosService.findAll ahora selecciona explícitamente nombre, apellido, correo, nombreUsuario, fechaNacimiento, descripción, imagenPerfil, perfil y timestamps; MongoDB incluye _id por defecto. No incluye password ni passwordHash, y el esquema conserva select:false para el hash. Son campos del padrón administrativo, no un directorio público.

Logout borra la cookie con las mismas opciones. No hay lista de revocación: borrar la cookie no invalida una copia de JWT que siga vigente, especialmente porque el guard también acepta Bearer. No se implementa revocación en esta auditoría.

## CORS y CSRF: qué hay y qué falta

`main.ts` permite localhost:4200 y FRONTEND_URL con credentials true. ValidarOrigenMiddleware omite lecturas y rechaza un Origin no permitido en operaciones de escritura; si Origin falta, permite pasar. No consulta Referer ni usa un token CSRF propio.

El control de origen es una defensa parcial; no debe documentarse como protección CSRF completa. Hace falta definir y probar la política para cabeceras ausentes y la defensa elegida, especialmente al usar SameSite=None. CORS tampoco reemplaza la autenticación ni los permisos. Es una revisión pendiente, no una explotación demostrada. [Guía OWASP sobre origen y CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## Por qué 20 segundos no cumplen Sprint 3

Aproximadamente 20 segundos después del login, el JWT vence y la cookie tiene programada su eliminación. No se desloguea automáticamente una pantalla ya abierta: el usuario puede seguir viendo datos que están en memoria. La siguiente operación privada será rechazada, o faltará la cookie. MiPerfil y publicar manejan 401, pero no hay interceptor global, cuenta regresiva ni renovación.

| Requisito Sprint 3           | Estado actual                    | Cambio pendiente y lugar                                                                                                                                           |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JWT 15 minutos               | 20 s                             | SeguridadModule, expiresIn 15m; prueba temporal sin esperar 15 minutos reales.                                                                                     |
| Duración coherente de cookie | 20.000 ms                        | AuthController.login y futura renovación: 900.000 ms; compartir criterio de cookie para evitar diferencias.                                                        |
| POST autorizar               | No existe; hay GET me            | Proponer POST /auth/autorizar en AuthController/AuthService; comprobar JWT y usuario, devolver metadatos de sesión. No reemplazar GET me sin evaluar consumidores. |
| POST refrescar               | No existe                        | Proponer POST /auth/refrescar; validar sesión/usuario y emitir cookie nueva; definir qué sucede ante token vencido.                                                |
| Aviso a 10 minutos           | No hay temporizador              | Extender el servicio Angular de auth para coordinar tiempos a partir de metadatos del servidor.                                                                    |
| Modal para extender          | No hay modal                     | Componente propio con acciones Extender/Cancelar; llamar refrescar solo por la acción prevista.                                                                    |
| Pantalla de carga            | Textos locales cargando/enviando | Acordar el alcance de pantalla global y manejar éxito, error y navegación.                                                                                         |
| Redirección general 401      | Solo manejo puntual              | Interceptor acotado a la API; no renovar indefinidamente ni convertir problemas de red en login fallido.                                                           |

Un flujo mínimo propuesto: login informa cuándo vence la sesión; a los 10 minutos el navegador ofrece extender; si acepta antes de los 15, POST refrescar valida, renueva y reinicia el aviso. Al vencer se vuelve al login. No se debe desactivar la comprobación de exp para aceptar tokens vencidos. Una renovación posterior al vencimiento requeriría otro diseño explícito; no se agregó refresh token ni se asumió que el TP lo exige.

Como la cookie es HttpOnly, Angular no debe intentar leer su JWT para calcular estos tiempos. El contrato de metadatos de sesión todavía debe acordarse.

## Pruebas pendientes y conceptos

En un entorno de prueba: registro válido/duplicado, password inválida/coincidencia, login correcto/incorrecto, rechazo de campo perfil enviado en registro, me sin cookie y con token vencido, logout y nueva petición, política Origin/Referer, cookies en desarrollo/HTTPS, autorización de usuario deshabilitado y roles de las futuras operaciones. El estado de las suites existentes está en [08](08-PRUEBAS-Y-DESPLIEGUE.md); no hubo pruebas contra la cuenta real.

Conceptos: hash frente a contraseña original; firma JWT frente a cifrado; autenticación frente a autorización; cookie y atributos; DI; guards; DTO; validación local frente a servidor; expiración y renovación. La palabra administrador en el payload no constituye por sí sola una comprobación de permisos.

## Tarea 2 — Autorización del padrón y verificación

No se modificaron AuthGuard, AuthService, AuthController, SeguridadModule, los DTO de registro ni las opciones/duraciones de cookie. El registro público sigue fijando perfil usuario; no se agregó una forma pública de crear administradores.

AdministradorGuard está en `backend/src/usuarios/guards/administrador.guard.ts` y se registra en UsuariosModule. Usa únicamente sub del request.user creado por AuthGuard para buscar la ficha. No acepta rol desde query, body ni cabecera libre y tampoco usa el claim perfil como decisión final, porque podría haber quedado viejo. Si la ficha ya no existe, responde 401; si existe y no es administrador, 403.

| Solicitud a GET usuarios                                        | Resultado comprobado por HTTP local                         |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| Sin sesión o JWT inválido                                       | 401, sin consultar el listado.                              |
| JWT válido de usuario común                                     | 403, sin consultar el listado.                              |
| Rol libre enviado como administrador                            | 403 si el rol actual es usuario.                            |
| JWT firmado que antes decía administrador, ficha actual usuario | 403.                                                        |
| Administrador actual con JWT válido                             | 200; también se comprobó acceso por cookie token existente. |
| Usuario del JWT inexistente                                     | 401.                                                        |

La analogía es revisar el carnet y después el cargo vigente del socio antes de entregar el padrón del club. El modelo y el método existentes permiten hacerlo sin cambiar la sesión ni introducir nuevos roles.

Los ocho casos HTTP usan guards reales y claves exclusivas de test, pero sustituyen UsuariosService para no conectar Atlas. Una prueba aparte ejecuta findAll del servicio con un modelo simulado para verificar su selección positiva. No se afirma que se haya probado el servidor MongoDB real ni la configuración de producción. Las duraciones de 20 segundos y los pendientes de Sprint 3 siguen iguales.

## Permiso adicional de 3A, sin cambiar autenticación

DELETE /publicaciones/:id usa el AuthGuard existente. PublicacionesService.darDeBaja obtiene al usuario actual con UsuariosService.findById y permite autor o administrador vigente. No usa un rol del body ni concede permisos solo por un claim viejo. El modelo de usuario y la configuración JWT/cookies no cambiaron.

Como en el club, un socio puede retirar su propio parte; para retirar el de otro tiene que figurar hoy como administrador. Sin usuario vigente se rechaza y nunca se borra físicamente el documento. Creación de imágenes y lógica de bajas se describen en 03, con HTTP local y datos externos simulados.

## Auditoría 5D — Correcciones y límites comprobados

Se confirmó localmente que bcrypt solo considera 72 bytes: dos claves sintéticas con prefijo común se aceptaban como iguales. generarHashPassword ahora rechaza más de 72 bytes UTF-8 antes de hash (registro/admin); DTO público limita además a 64 caracteres como el formulario. TextEncoder en maximoBytesClaveValidator acompaña esa regla en Angular. No se recortan claves ni se cambia algoritmo/costo 12, login, JWT o cookies. Los hashes históricos no permiten saber si hubo truncado: no se hicieron resets ni se modificaron credenciales reales. Fuente primaria: [bcrypt](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns).

El DTO recorta nombre/apellido/nombreUsuario antes de IsNotEmpty: espacios obligatorios ahora dan 400 en vez de pasar a Mongoose y terminar en 500. Se reprodujeron tres casos HTTP antes del arreglo. La regla no convierte números/objetos a string. Otros criterios del formulario (p.ej. fecha futura) siguen siendo más estrictos que el DTO público; no se presenta como validación de identidad/edad.

El interceptor ahora incluye /estadisticas: sus 401 invalidan estado y redirigen; 403 continúa preservando sesión. Tres regresiones fallaron antes y pasan después, junto con todas las anteriores. No se modifica el control de permisos definitivo de Nest.

Pruebas reales sin escritura: API feed 200 y me/usuarios/estadística anónimos 401, CORS OPTIONS con localhost permitido/ajeno no permitido, ping Atlas y Cloudinary correctos. No hubo login/cookie/admin/upload reales ni inspección de valores secretos. Matriz completa y riesgos diferenciados en [11-AUDITORIA-FINAL.md](11-AUDITORIA-FINAL.md); no es certificado de seguridad de producción.
