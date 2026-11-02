# 15 — Configuración concreta de QA HTTPS temporal · pendiente de aprobación

Fecha: 2026-11-01, America/Buenos_Aires. El usuario aprobó los resultados de 5F y autorizó **preparar** QA HTTPS; prohibió push, merge y deploy hasta aprobar esta configuración. No se crearon proyectos/dominios/usuarios de infraestructura ni se copiaron secretos a Vercel. No se modificó ninguna funcionalidad aprobada.

## Proyectos, rama y dominios

| Parámetro | Frontend QA | Backend QA |
| --- | --- | --- |
| Nombre solicitado | `futbolcrack-qa-web` | `futbolcrack-qa-api` |
| Dominio previsto, NO reservado | `https://futbolcrack-qa-web.vercel.app` | `https://futbolcrack-qa-api.vercel.app` |
| Cuenta/equipo Vercel | Titular por confirmar antes de crear recursos; no se presume una cuenta por el nombre de GitHub | El mismo titular aprobado |
| Rama de origen | `test/aceptacion-final`, con cambios aprobados de 5F conservados | La misma |
| Base Git | `6a66fc9` más los cambios aprobados de 5F; no se presentan como parte de ese commit | La misma |
| Ramas nuevas / integración Git | Ninguna / sin conectar repositorio | Ninguna / sin conectar repositorio |
| Despliegue automático | Desactivado: `git.deploymentEnabled=false` | Igual |
| Target propuesto de Vercel | **Production exclusivamente del proyecto QA nuevo**, para usar el dominio estable previsto | Igual, exclusivamente qa-api |
| Acceso previsto | URL temporal accesible públicamente; noindex; solo datos ficticios | Rutas públicas de la aplicación existentes; operaciones privadas conservan JWT/roles/CSRF |
| Preset | Other / framework null; archivos estáticos ya compilados | Other / framework null; función Node.js |
| Node.js | 24.x para preparar el build, como entorno verificado | 24.x en Settings y engines del package.json de la copia QA |
| Variables Vercel | Ningún secreto ni variable runtime requerida | Scope Production **solo de qa-api** según tabla siguiente |

**Production es el nombre del target de Vercel dentro de estos proyectos QA nuevos; no es el proyecto, dominio, rama main ni base productiva de FutbolCrack.** Esta elección, junto con la exposición pública temporal de esas URLs, forma parte de lo que se pide aprobar. No se ejecutó ningún comando de despliegue. No se tocarán aliases, variables o configuración de proyectos productivos.

Los dominios aún no se comprobaron en una cuenta ni se reservaron: si no están disponibles, no sustituirlos silenciosamente; actualizar esta configuración y obtener aprobación. Si la cuenta impone Deployment Protection que bloquea la prueba, no desactivarla ni saltarla: informar el impedimento y acordar otra configuración. No se introducirán claves de bypass en Angular, URLs ni informes.

## Variables de entorno — nombres y propósito, sin valores secretos

| Nombre | Ubicación | Valor no secreto / tratamiento |
| --- | --- | --- |
| `NODE_ENV` | Backend QA, scope Production | `production` |
| `FRONTEND_URL` | Backend QA, scope Production | `https://futbolcrack-qa-web.vercel.app`, sin slash final |
| `QA_MODE` | Backend QA, scope Production | `futbolcrack-https-temporal`; guard del artefacto de QA |
| `QA_NAMESPACE` | Backend QA, scope Production | `qahttps_1101a`; rechazar si ya contiene recursos previos |
| `CONNECTION_STRING` | Secreto solo backend QA | URI Atlas para base exacta `futbolcrack_qa`; no se muestra ni se copia a documentación |
| `JWT_SECRET` | Secreto solo backend QA | Nueva clave aleatoria exclusiva de QA; nunca reutilizar la productiva |
| `CLOUDINARY_CLOUD_NAME` | Solo backend QA | Nombre del cloud configurado, omitido del informe |
| `CLOUDINARY_API_KEY` | Secreto solo backend QA | Cargado mediante canal seguro del hosting; no incluir en frontend |
| `CLOUDINARY_API_SECRET` | Secreto solo backend QA | Mismo tratamiento |
| `VERCEL`, `VERCEL_ENV`, `VERCEL_URL` | Automáticas del hosting | No asignar manualmente; no usarlas como origen permitido para CSRF/CORS |
| `API_URL` | **Constante de Angular, no variable runtime de Vercel** | En la copia del build: `https://futbolcrack-qa-api.vercel.app`; fuente aprobada intacta |

No se genera `.env` con valores dentro de docs ni del artefacto a subir. Los secretos se proporcionarían directamente a qa-api mediante un canal seguro después de aprobar la configuración; no por chat, argumentos visibles, logs ni capturas. El frontend no recibirá CONNECTION_STRING, JWT_SECRET ni credenciales Cloudinary. No se copiará una carpeta `.vercel` vinculada a otro proyecto.

## Artefactos concretos para revisar

Plantillas **inertes** en [qa-https](qa-https/):

- [frontend.vercel.json](qa-https/frontend.vercel.json): estáticos, noindex, revalidación de control del worker, fallback SPA. Los rewrites de Vercel comprueban archivos existentes antes del fallback; se verificarán MIME/200 de JS, CSS, iconos y ngsw.json en HTTPS.
- [backend.vercel.json](qa-https/backend.vercel.json): npm ci con lock existente, npm run build, salida estática `public` vacía; `api/index.js` como única función y dist incluido. Reescritura al handler para conservar endpoints sin prefijo `/api` en Angular. Máximo previsto de función: 60 s; si el plan no lo permite, detenerse antes de cambiarlo o contratar otro plan.
- [api-index.mjs](qa-https/api-index.mjs): plantilla de entrada QA que se copiaría como `api/index.js` en una copia con package type module. Comprueba entorno/base/origen/namespace antes de importar AppModule y adapta únicamente la carpeta Cloudinary. No incorpora endpoints ni modifica servicios productivos.
- [fuentes-aprobadas.sha256.json](qa-https/fuentes-aprobadas.sha256.json): huellas de fuentes/configuración local aprobadas; no contiene secretos. El HEAD por sí solo no representa los cambios pendientes aprobados de 5F.

Empaquetado previsto, todavía no realizado: frontend solo con contenido de `frontend/dist/frontend/browser` y su configuración QA; backend con fuentes/configuración de compilación, package.json/lock existentes, entrada QA y directorio public vacío. Excluir .env, cachés, credenciales locales, capturas, node_modules local y enlaces a proyectos Vercel existentes. La instalación npm ci del backend pertenece al build remoto y al lock aprobado; no agrega dependencias al TP.

En la copia frontend se sustituirá el origen API de producción por el de qa-api y se regenerará ngsw.json con el generador oficial Angular, como en 5E/5F. No cambiar `frontend/src`, reglas de caché, formularios, guards, interceptores ni módulos. Probar ausencia del origen productivo en todos los JS de la copia antes de subirla.

La CLI `vercel` no apareció en PATH y no hay conector Vercel disponible en esta sesión. No se instaló ni autenticó una herramienta de despliegue. Tras aprobar la configuración se necesitará un canal oficial de despliegue y acceso a la cuenta; si requiere instalar una herramienta, se justificará antes de hacerlo. Esto no impide revisar las plantillas ahora.

## Cookies, CORS y CSRF efectivos

Se reutiliza `backend/src/auth/sesion-cookie.ts`, sin cambios:

| Propiedad | Valor previsto con NODE_ENV=production |
| --- | --- |
| Nombre | `token`; su valor no se registra |
| HttpOnly / Secure | true / true |
| SameSite / Path | None / `/` |
| Domain | No se define: cookie del host qa-api; no se comparte con proyecto productivo |
| Vencimiento | Expiración real JWT, 900 s; Max-Age alineado con exp |
| Logout | Elimina usando opciones compatibles con emisión |

CORS y CSRF comparten `origenesPermitidos()`. **Lista efectiva del código aprobado:** `http://localhost:4200` y `https://futbolcrack-qa-web.vercel.app`. `credentials=true`; no wildcard ni aceptación de cualquier dominio vercel.app. No se ocultará localhost en el informe ni se modificará esa lista sin autorización adicional. El código no aplica aislamiento por Origin a lecturas GET/HEAD/OPTIONS mediante CSRF: CORS regula la lectura del navegador y los guards regulan identidad/rol.

`ValidarOrigenMiddleware` rechaza Origin ajeno; si falta, compara origen de Referer. Operaciones de sesión o escrituras con cookies sin ambos se rechazan. Los clientes Bearer sin cookie conservan el comportamiento aprobado: no se describe como protección CSRF absoluta de toda llamada HTTP. No se confía en un rol libre del cliente ni en Host/X-Forwarded-Host.

Ensayo HTTPS: login, me/admin, persistencia y recarga, renovación voluntaria y logout; inspeccionar atributos sin copiar cookie/JWT. Probar preflight/origen correcto, origen ajeno y origen ausente con cookie. Verificar que el rechazo corresponde a Nest/CORS/CSRF y no a una pantalla del hosting. No desactivar protección de cookies de terceros del navegador para conseguir un aprobado; registrar si impide el flujo entre sitios.

## Aislamiento de datos

**MongoDB:** base `futbolcrack_qa` en el Atlas autorizado, nunca base productiva. La entrada QA rechaza otra base antes de importar AppModule; no la corrige silenciosamente. Propuesta de credencial Atlas: usuario exclusivo con rol readWrite limitado a futbolcrack_qa, sin administración de otras bases. Ese usuario no se creó: su provisión requiere acceso seguro a Atlas y aprobación de esta configuración. Si no puede provisionarse, no sustituir por credenciales productivas sin revisarlo con el usuario. No ampliar reglas de red del cluster automáticamente.

**Cloudinary:** aislamiento lógico en el cloud configurado, **no una cuenta Cloudinary separada**. Prefijo exacto `futbolcrack/qa/qahttps_1101a/`, con subcarpetas perfiles/publicaciones. El adaptador solo admite esas dos finalidades. Las credenciales del cloud no deben describirse como restringidas criptográficamente a esa carpeta: la restricción aquí está en la entrada QA y el procedimiento de limpieza. No se revocarán claves compartidas ni se modificarán carpetas productivas.

**Cuentas:** `qahttps_1101a_a` (jugador ficticio) y `qahttps_1101a_admin` (administrador ficticio), correos example.test y claves efímeras. Crear mediante registro y promover únicamente la segunda, por procedimiento local seguro sobre su ID exacto y nombre/namespace esperado. No añadir endpoint de bootstrap ni habilitar rol administrativo en registro. Como máximo, una publicación sintética para comprobar imagen y un comentario de ensayo; no repetir el volumen ya aprobado de 5F salvo falla reproducible.

Antes de escribir: comprobar que nombres y prefijo Cloudinary no existían; si hay colisión, detenerse, no limpiar registros previos. MongoDB QA puede contener ensayos ajenos: solo se consideran propios los IDs registrados de esta ejecución. Sin cuentas reales ni datos de demostración en producto.

## Evidencia de G-14 y límite de G-15

G-14 sigue **Parcial** hasta la ejecución. Registrar URL real, proyecto/target, versión y hashes, navegador, fecha, acción, resultado HTTP y atributos saneados. Cerrar la parte HTTPS solo con flujo real Angular ↔ Nest ↔ Atlas, sin mocks. La aceptación integral conserva además las observaciones manuales de 14; este despliegue no convierte en aprobadas pruebas que no se ejecuten.

G-15 continúa **No verificado**. Se revisó otra vez `git show --stat c8383c9`: el primer commit que introduce 09 contiene 23 archivos, incluyendo documentación y cambios productivos/pruebas de tareas posteriores. Existe rama docs/auditoria-inicial, pero no un checkpoint exclusivo suficiente para reconstruir el alcance exacto de Tarea 0. Esto no demuestra por sí solo que Tarea 0 incumplió, ni permite certificar que cumplió. Un despliegue HTTPS de hoy no resuelve ese vacío histórico. Solo evidencia histórica independiente suficiente permitiría revisar el estado.

No se cambia ahora la matriz: **42 Cumple / 1 Parcial / 0 No cumple / 1 No verificado**.

## Cierre temporal y aprobación necesaria

Duración prevista: una sesión de ensayo, máximo 24 h desde el despliegue autorizado; no se creó automatización. Al finalizar, registrar conteos y eliminar solo cuentas/relaciones y public_id propios; borrar únicamente carpetas vacías del prefijo. No dropDatabase ni limpieza del resto de futbolcrack_qa. Eliminar credencial Atlas QA si se creó para este ensayo, retirar secretos de qa-api y eliminar exclusivamente los dos proyectos nuevos de QA, verificando titular e IDs; conservar evidencias saneadas y fuentes aprobadas. No borrar proyectos productivos ni revocar claves Cloudinary compartidas. Si una limpieza falla, dejarlo explícito con recursos pendientes y seguir hasta resolverlo dentro del alcance autorizado.

**Se solicita aprobación de esta configuración antes de crear recursos externos, instalar/autenticar la herramienta necesaria o desplegar.** La aprobación deberá confirmar también el titular/equipo Vercel y la posibilidad de provisionar la credencial Atlas limitada. No se hará push, merge, commit ni deploy en esta preparación. Si cambian dominios, permisos, costos o el aislamiento acordado, volver a revisión antes de ejecutar.

## Verificaciones de esta preparación y fuentes

Solo se revisaron Git/código/documentos y se validaron sintaxis JSON/entrada JS y huellas de fuentes. No hubo compilaciones ni suites nuevas: no cambió la aplicación; se conservan resultados aprobados 5F (237 Angular, 278 Nest, 11 PWA). No se afirma validación de build o routing en Vercel: queda para el despliegue autorizado.

Referencia oficial consultada: [configuración estática y rewrites que comprueban filesystem](https://vercel.com/docs/project-configuration/vercel-json), [desactivar despliegues Git](https://vercel.com/docs/project-configuration/git-configuration), [Node.js 24.x disponible](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) y [Deployment Protection](https://vercel.com/docs/deployment-protection). No se modificó protección de ningún proyecto.
