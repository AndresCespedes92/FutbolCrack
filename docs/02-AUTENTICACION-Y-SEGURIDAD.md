# 02 — Autenticación y seguridad

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
