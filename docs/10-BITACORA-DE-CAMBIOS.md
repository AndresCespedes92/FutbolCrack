# 10 — Bitácora de cambios

## Uso obligatorio en tareas posteriores

Agregar una entrada por tarea, sin borrar la historia. Explicar el problema, el ejemplo de uso, los archivos reales, el recorrido Angular/Nest/MongoDB, validaciones/permisos, conceptos y resultados. Actualizar también el mapa y la matriz para evitar que la documentación quede en una versión anterior al código.

## 31/10/2026 — Tarea 0: auditoría técnica y documentación base

### Objetivo y base

Auditar el repositorio real y preparar la implementación de los Sprints 2–4 con los requisitos generales, sin modificar comportamiento. Base revisada: commit `5e6eb8987e96490bbccbbc08320aec3f2b4f8168`. Rama inicial `main`, limpia. Se creó la rama solicitada `docs/auditoria-inicial`.

### Cambios realizados

Se creó únicamente la carpeta docs en la raíz y estos 11 archivos:

- `00-MAPA-DEL-PROYECTO.md`: ubicación de flujos, componentes, controllers, métodos, modelos y estados.
- `01-ARQUITECTURA.md`: responsabilidades y recorridos con diagramas Mermaid.
- `02-AUTENTICACION-Y-SEGURIDAD.md`: registro/login, hash, JWT, cookies, CORS, origen, logout y plan de sesión.
- `03-PUBLICACIONES.md`: texto real, contratos, permisos y pendientes de Sprint 2.
- `04-COMENTARIOS.md`: ausencia actual y propuesta de relaciones, paginación y edición.
- `05-ADMINISTRACION.md`: rol existente, carencias de autorización y plan de gestión.
- `06-ESTADISTICAS.md`: tres propuestas, consultas orientativas y semántica de rango.
- `07-ANGULAR-PWA-PIPES-DIRECTIVAS.md`: estructura actual y propuestas de tres pipes/directivas y PWA.
- `08-PRUEBAS-Y-DESPLIEGUE.md`: comandos, resultados, nombres de variables, endpoints y verificaciones pendientes.
- `09-REQUISITOS-SPRINTS.md`: 44 filas de trazabilidad con evidencia, pendientes y aceptación; orden y primera tarea.
- `10-BITACORA-DE-CAMBIOS.md`: esta entrada, hallazgos y plantilla futura.

Se conservaron fuentes, configuración, dependencias, pruebas y archivos de entorno. Las compilaciones generan dist/cachés ignorados. No se realizaron commits, merges ni deploys. No se leyó ni publicó el contenido de .env; los nombres de variables se obtuvieron de referencias process.env en el código.

### Funcionalidades encontradas y alcance de la comprobación

Hay integración escrita de registro con avatar opcional, login por cookie HttpOnly, consulta de perfil, logout y publicaciones de texto con listado MongoDB. Los servicios y contratos se verificaron por lectura de fuentes y compilación. No se validó un ciclo completo contra Atlas/Cloudinary/Vercel, por lo que no se afirma que el despliegue o la integración externa funcionen.

MiPerfil mezcla usuario real con material demo; el feed real no utiliza la tarjeta reusable. No hay comentarios reales, likes operativos, bajas, administración por rol, reportes, pipes/directivas propios ni PWA.

### Decisiones documentales

- Diferenciar implementado en código, parcial, pendiente y no verificado; no tratar una demo como persistencia real.
- Mantener una única matriz para el resumen oficial y las obligaciones generales.
- Marcar contratos/rutas/consultas futuras como propuestas; no generar archivos funcionales con esos ejemplos.
- No inventar las tres métricas oficiales ni detalles de enunciados no recibidos.
- Proponer Desde/Hasta inclusivos por día local, implementados internamente con inicio inclusivo y fin exclusivo UTC; esto todavía no está implementado.
- Contabilizar TruncatePipe como uno de los tres pipes, aunque se incorpore antes que el resto del Sprint 4.
- Reutilizar módulos de usuarios/auth/publicaciones/Cloudinary; no proponer módulos funcionales ajenos al TP.

### Pruebas realizadas

| Comprobación                                           | Resultado                                                                                                                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend npm run build                                 | Correcto, con aviso de publicaciones.css: 4,68 KB frente a 4 KB.                                                                                                                   |
| Backend npm run build                                  | Correcto.                                                                                                                                                                          |
| Frontend test, ejecución final fuera de aislamiento    | 17 pruebas: 14 aprobadas, 3 fallidas; 3 suites, 2 fallidas.                                                                                                                        |
| Backend npm test, ejecución final fuera de aislamiento | 1 prueba fallida: falta UsuarioModel en módulo de prueba.                                                                                                                          |
| Primeros intentos de tests restringidos                | ENOENT/EPERM sobre archivos temporales; repetidos con permiso para distinguir los fallos reales.                                                                                   |
| Revisión de cambios y documentación                    | Correcto: 11 documentos UTF-8, 44 IDs únicos, enlaces locales existentes y bloques de código cerrados. Git muestra únicamente docs/ nuevo; no hay diferencias en frontend/backend. |
| Integración externa, e2e y revisión visual             | No verificadas; no se ejecutaron operaciones manuales de escritura productiva ni despliegues.                                                                                      |

Las pruebas Angular fallidas conservan expectativas antiguas: aviso de que no se crea cuenta, cuatro tarjetas demo en el feed y datos de contraseña que ya no satisfacen la nueva regla. No se corrigieron en esta tarea.

### Hallazgos y riesgos: no corregidos

La prioridad es de planificación, no una clasificación de vulnerabilidades demostradas. Ver los documentos temáticos para evidencia y pruebas pendientes.

| ID  | Prioridad                        | Hallazgo y archivo                                                                                                         | Consecuencia / propuesta posterior                                                                                                                       |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H01 | Alta para Sprint 3               | SeguridadModule y AuthController.login: JWT/cookie de 20 segundos                                                          | Sesión muy corta, sin renovación ni aviso; alinear a 15 minutos y completar el ciclo con pruebas temporales.                                             |
| H02 | Alta                             | UsuariosController.findAll tiene AuthGuard pero no autorización de administrador                                           | Cualquier JWT válido puede solicitar el listado; agregar permiso backend explícito en la tarea correspondiente.                                          |
| H03 | Alta                             | UsuariosService.findAll usa find sin proyección de directorio                                                              | Se exponen campos personales a usuarios autenticados; definir datos necesarios y control de rol. No hubo extracción remota de datos.                     |
| H04 | Alta                             | CrearPublicacionBody es interface y PublicacionesService.crear invoca trim                                                 | Un tipo incorrecto puede producir excepción en vez de validación 400; introducir DTO concreto sin romper el texto válido.                                |
| H05 | Media                            | FormGroup de registro y CreateUsuarioDto tienen límites distintos                                                          | Reglas de nombre/usuario/máximo de clave y fecha futura no están igualmente protegidas en servidor; acordar y probar equivalencia.                       |
| H06 | Alta para trabajar con seguridad | Suites actuales fallidas                                                                                                   | Cambios funcionales no tienen regresión confiable. Primero aislar prueba de UsuariosController y luego actualizar tests de integración Angular simulada. |
| H07 | Media                            | Dos interfaces Publicacion: models y services; tarjeta usada solo en demo                                                  | Evitar duplicar implementaciones al conectar tarjeta al feed y al perfil real.                                                                           |
| H08 | Alta para Sprint 4               | Usuario sin campo de habilitación; AuthGuard no consulta estado                                                            | No existe deshabilitación efectiva ni bloqueo de token vigente por estado; diseñarlo antes de afirmar que se puede dar de baja un usuario.               |
| H09 | Media/por verificar en ejecución | Middleware de origen permite ausencia de Origin; no hay defensa CSRF dedicada                                              | Revisar política de cabeceras y protección elegida en despliegue entre sitios; no se probó una explotación.                                              |
| H10 | Media                            | AuthService.registrar sube avatar antes de verificar duplicados/guardar                                                    | Posibles imágenes huérfanas si falla registro; evaluar orden y compensación sin eliminar recursos en esta auditoría.                                     |
| H11 | Media                            | URLs Vercel fijas en servicios Angular; configuración del proveedor no disponible                                          | Local apunta al remoto; no hay ambientes frontend. Verificar configuración, cookies y producción antes de desplegar.                                     |
| H12 | Baja                             | Publicaciones.css supera presupuesto de advertencia                                                                        | Revisar estilos/reutilización posteriormente; no elevar el límite ni refactorizar por esta auditoría.                                                    |
| H13 | Media académica                  | frontend/README afirma que no hay API; enlaza frontend/docs inexistente; comentarios aún describen comportamiento anterior | La documentación anterior no explica el estado actual. docs raíz aporta la auditoría sin tocar README ni comentarios existentes.                         |
| H14 | Baja/Media                       | Publicaciones.publicar conserva console.log de contenido y retorno silencioso para espacios                                | Revisar logs y mensaje para contenido vacío tras trim; no confundir con una corrección ya hecha.                                                         |
| H15 | Baja                             | Registro tiene aria-describedby=aviso-registro sin elemento con ese id                                                     | Revisar relación accesible y comentarios que aún dicen que se cancela submit; la plantilla actual sí registra.                                           |

### Pendientes y siguiente tarea propuesta

Completar los requisitos del mapa de Sprints en el orden de 09. Primero conviene aislar la prueba existente de UsuariosController mediante un doble de UsuariosService, sin tocar lógica productiva. Después, corregir las expectativas antiguas del frontend y avanzar con DTO/paginación/tarjeta y el resto del alcance aprobado.

La auditoría se detiene aquí. Los problemas se documentaron y no se corrigieron. Toda implementación, merge o deploy posterior necesita la aprobación correspondiente.

---

## 31/10/2026 — Tarea 1: recuperar pruebas existentes

### Objetivo, base y alcance

Recuperar las pruebas fallidas identificadas en Tarea 0 sin cambiar el comportamiento productivo. Rama `test/recuperar-pruebas`, creada desde `docs/auditoria-inicial`; ambas partían del commit `5e6eb8987e96490bbccbbc08320aec3f2b4f8168`. Los documentos de la auditoría todavía estaban sin seguimiento y se conservaron en el directorio de trabajo sin hacer commits.

### Diagnóstico previo a la edición

1. app.spec.ts esperaba el aviso viejo de cuenta deshabilitada, aunque registro ya envía datos.
2. app.spec.ts esperaba cuatro tarjetas demo en el feed y un CV estático; el feed actual obtiene API y el perfil mezcla usuario real con dos demos.
3. registro.spec.ts llamaba válida a una contraseña sin mayúscula y suponía que enviar siempre estaba deshabilitado.
4. UsuariosController se construía con el servicio real sin UsuarioModel en su módulo de prueba.

El diagnóstico se contrastó con componentes, templates, formularios, servicios, rutas y controller actuales. Las tres pruebas de Angular se actualizaron para su comportamiento real; la prueba de creación Nest se mantuvo con dependencia simulada.

### Archivos modificados

- `frontend/src/app/app.spec.ts`: backend HTTP de pruebas; comprobaciones reales de navegación, registro, feed, datos personales/demo de perfil y 401.
- `frontend/src/app/pages/registro/registro.spec.ts`: backend HTTP de pruebas; contraseña válida y contrato de submit/FormData, duplicado de envío, éxito, inválido sin solicitud y error 409.
- `backend/src/usuarios/usuarios.controller.spec.ts`: doble useValue de UsuariosService y overrideGuard solo de test; conserva creación y añade delegación.
- `docs/00-MAPA-DEL-PROYECTO.md`: mapa de pruebas actualizado, sin cambiar estados funcionales.
- `docs/08-PRUEBAS-Y-DESPLIEGUE.md`: antes/después, causas, soluciones y limitaciones.
- `docs/09-REQUISITOS-SPRINTS.md`: evidencia de pruebas en G-14 y cierre de la primera tarea propuesta; ningún avance funcional ficticio.
- `docs/10-BITACORA-DE-CAMBIOS.md`: esta entrada.

### Recorrido y conceptos para estudiar

En un test de registro, el evento submit llama al componente real, que construye FormData y usa AuthService/HttpClient. HttpTestingController retiene esa solicitud; el test inspecciona sus campos y devuelve éxito o 409 mediante flush. El componente actualiza su mensaje y botón. No llega a Nest ni MongoDB: verificamos la parte Angular del contrato, no una cuenta creada.

En el test Nest, findAll del controller llama al doble de UsuariosService. Se verifica una sola llamada sin argumentos y que devuelve el mismo resultado. No se construye el servicio productivo ni su modelo Mongoose. El guard simulado no cambia el guard del endpoint real y no acredita autorización de administrador.

Se usan inyección de dependencias, dobles de prueba, intercepción HTTP, fixtures, aserciones de DOM/contrato y eventos, y limpieza de solicitudes/módulos. No se agregaron librerías. Las pruebas originales no se eliminaron ni saltaron; se agregaron casos para reforzar el contrato actualizado.

### Verificación y resultados

| Comando y directorio                                                  | Antes de Tarea 1                 | Resultado final                                                                   |
| --------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| frontend: npm run build                                               | Correcto con advertencia CSS     | Correcto, salida 0. Publicaciones.css 4,68 KB frente a 4 KB, excedente 678 bytes. |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 14 aprobadas / 3 fallidas, de 17 | 20 aprobadas / 0 fallidas, 3 suites aprobadas.                                    |
| backend: npm run build                                                | Correcto                         | Correcto, salida 0, sin advertencias reportadas.                                  |
| backend: npm test                                                     | 0 aprobadas / 1 fallida          | 2 aprobadas / 0 fallidas, 1 suite aprobada en ejecución aislada.                  |

Las suites corrieron fuera del aislamiento por los problemas de temporales conocidos. En un primer intento simultáneo con ambas compilaciones y Angular, Nest agotó 10 segundos en su primer beforeEach; la prueba de delegación sí pasó. La misma suite aislada pasó completa en 1,73 segundos. No se elevó el timeout ni cambió una aserción para resolver ese episodio; su causa exacta no se demostró.

Se conserva la prueba de creación Nest y se agrega una de delegación. En Angular se conservan los 17 casos previos y se agregan 3; no hay skip/todo ni pruebas deshabilitadas. La comparación final de huellas SHA-256 confirmó que únicamente cambiaron estos tres spec entre los archivos versionados y los cuatro documentos autorizados entre los 11 documentos de auditoría. Todos los archivos productivos, de configuración y dependencias conservan su huella original; los otros siete documentos tampoco cambiaron. git diff --check terminó sin errores de espacios. Se comprobaron enlaces locales y bloques de código Markdown.

### Problemas y pendientes

No se corrigió ningún problema productivo. Los hallazgos H01–H05 y H07–H15 de auditoría siguen pendientes. H06 queda resuelto respecto de los fallos de las suites existentes; sigue pendiente ampliar pruebas de integración/e2e y de las futuras funciones. Se conserva el presupuesto de CSS sin elevarlo.

No se modificaron endpoints, servicios, lógica de negocio, autenticación, cookies, modelos, componentes, configuración o dependencias. No hubo commits, merge ni deploy. Se detiene la tarea y se espera aprobación antes de continuar.

---

## 31/10/2026 — Tarea 2: seguridad básica y validación de publicaciones

### Objetivo, rama y conservación

Restringir GET usuarios a administradores y validar el contenido actual de POST publicaciones con DTO, sin ampliar Sprint 2 ni cambiar JWT/cookies. Se revisó git status antes de editar: rama test/recuperar-pruebas con tres specs modificados y docs/ sin seguimiento. Se creó fix/seguridad-validaciones desde el mismo estado, sin checkout de otro contenido, descartes, stash o commit. Los documentos y pruebas anteriores se conservaron.

### Causas y decisiones

- H02: AuthGuard validaba identidad pero no permiso de administrador. El modelo ya tiene perfil y UsuariosService.findById permite consultar el rol actual; no hubo impedimento técnico ni necesidad de improvisar una sesión nueva.
- H03: el listado estaba disponible a cualquier JWT válido y sin selección positiva de respuesta. Se restringe el acceso y se enumeran campos permitidos, manteniendo select:false de hash.
- H04: CrearPublicacionBody era interface y no aportaba metadatos a ValidationPipe; tipos incorrectos podían llegar a trim. Una clase decorada protege ese límite HTTP.

El guard de administrador se ubica en UsuariosModule para reutilizar su servicio sin crear dependencia circular en SeguridadModule. Se ejecuta después de AuthGuard y toma solo sub verificado. El claim perfil, una query o una cabecera no son autoridad final: la ficha actual de MongoDB decide. Usuario inexistente da 401; rol común da 403.

El DTO conserva únicamente contenido: Transform recorta strings sin convertir otros tipos, IsString verifica tipo, IsNotEmpty rechaza vacío y MaxLength limita a 2000. PublicacionesService mantiene sus reglas/trim y guardado, incluidas la longitud String.length y validación de ObjectId. No se agregaron título/imagen, módulos funcionales o dependencias.

### Ejemplo del club y recorrido

Un socio presenta su carnet (AuthGuard). Antes de entregar el padrón, la oficina busca su ficha y comprueba que siga siendo administrador (AdministradorGuard → UsuariosService.findById). Si lo es, UsuariosService.findAll consulta solo los campos previstos, sin credenciales. Un carnet antiguo con cargo retirado no alcanza.

Para publicar, Angular manda el mismo body de entrenamiento `{ contenido }` con cookie. AuthGuard verifica identidad; ValidationPipe valida CreatePublicacionDto; el controller toma autor del JWT y delega en PublicacionesService.crear; el modelo guarda como antes. Un formulario cuyo contenido sea un número o un objeto se rechaza con 400 y no llega al guardado.

### Archivos de esta tarea

Productivos nuevos:

- backend/src/usuarios/guards/administrador.guard.ts: AdministradorGuard.canActivate.
- backend/src/publicaciones/dto/create-publicacion.dto.ts: CreatePublicacionDto y reglas de texto.

Productivos modificados:

- backend/src/usuarios/usuarios.controller.ts: cadena AuthGuard/AdministradorGuard.
- backend/src/usuarios/usuarios.module.ts: registro del guard junto al servicio.
- backend/src/usuarios/usuarios.service.ts: selección positiva de findAll.
- backend/src/publicaciones/publicaciones.controller.ts: DTO concreto en @Body.

Pruebas nuevas:

- backend/src/usuarios/usuarios.controller.http.spec.ts: 8 casos de acceso/rol con guards reales.
- backend/src/usuarios/usuarios.service.spec.ts: 1 caso de consulta y exclusión de hash.
- backend/src/publicaciones/publicaciones.controller.http.spec.ts: 18 casos de HTTP/DTO/servicio con guardado simulado.

Documentación actualizada: 00, 01, 02, 03, 05, 08, 09 y 10. Arquitectura y administración también se actualizaron porque describían una ausencia de autorización que ya no corresponde. Los otros tres documentos conservan su contenido. Ningún archivo Angular ni los tres specs recuperados se modificaron en esta tarea.

### Verificación

| Comando                                                              | Resultado                                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| frontend npm run build                                               | Correcto, salida 0; advertencia existente de publicaciones.css: 4,68 KB frente a 4 KB, excedente 678 bytes. |
| frontend node node_modules/@angular/cli/bin/ng.js test --watch=false | 20/20 aprobadas en 3 suites.                                                                                |
| backend npm run build                                                | Correcto, salida 0; sin advertencias reportadas.                                                            |
| backend npm test                                                     | 29/29 aprobadas en 4 suites: 2 previas, 8 HTTP usuarios, 1 proyección, 18 HTTP publicaciones.               |

Pruebas ejecutadas fuera del aislamiento por los problemas de temporales registrados en tareas anteriores. Usan una aplicación Nest local sin AppModule/main productivos, claves JWT exclusivas de prueba y modelos/servicios de datos simulados. No hubo lecturas/escrituras a Atlas, carga Cloudinary, cambios en roles reales o pruebas de credenciales productivas. No se elevaron timeouts ni se deshabilitaron pruebas.

La comprobación final SHA-256 confirmó que todo el frontend, los tres specs recuperados, registro público, AuthGuard/AuthService/AuthController/SeguridadModule, modelos, configuración y dependencias mantienen su contenido de inicio. Se modificaron exactamente cuatro archivos productivos existentes y ocho documentos, y se agregaron dos archivos productivos y tres specs. Los otros tres documentos no cambiaron. git diff --check pasó, se conservaron los 44 IDs de la matriz y se comprobaron enlaces/bloques Markdown. No hay skip/todo/only en los nuevos specs.

### Pendientes y disposición para integrar

Corregidos H02 y H04 en el alcance solicitado y mitigado H03 para este padrón. El listado está autorizado en Nest y el DTO devuelve errores apropiados sin alterar contenido válido. No equivale a completar dashboard ni Sprint 2/4.

Siguen pendientes JWT de 15 minutos/renovación/aviso, estado de usuarios, paginación, imágenes de publicación, likes, bajas, comentarios, reportes y PWA. La advertencia CSS permanece. Antes de un despliegue corresponde probar con MongoDB de ensayo y la configuración/cookies del entorno destino.

Los cambios están listos para revisión e integración de este alcance con suites locales aprobadas, sujetos a aprobación del usuario. No se realizaron commits, merge ni deploy y no se continúa con otra funcionalidad.

---

## 31/10/2026 — Sprint 2, Tarea 3A: modelo, imágenes y baja lógica

### Git, objetivo y alcance

Se revisaron rama y estado antes de editar. La rama era fix/seguridad-validaciones y el árbol estaba limpio; c8383c9 ya incluía tareas anteriores verificadas. No había cambios para el commit de respaldo solicitado condicionalmente, así que no se generó un commit vacío. Se creó feature/publicaciones-modelo desde ese estado.

Se implementaron título y descripción obligatorios, imagen opcional, activo y baja lógica con permisos reales. No se agregaron likes, paginación, selector de orden, comentarios, cambios visuales grandes ni botón de baja. No se hicieron merge/deploy ni commits de esta tarea.

### Archivos creados/modificados

Backend productivo:

- backend/src/publicaciones/publicaciones.constants.ts (nuevo): límites de título, descripción y archivo.
- backend/src/publicaciones/entities/publicacion.entity.ts: titulo/descripcion requeridos, contenido conservado y activo true.
- backend/src/publicaciones/dto/create-publicacion.dto.ts: validación de los dos textos, sin autor ni campos adicionales del cliente.
- backend/src/publicaciones/publicaciones.controller.ts: imagen opcional en POST y DELETE /publicaciones/:id.
- backend/src/publicaciones/publicaciones.service.ts: creación, respuesta compatible y baja lógica condicionada.
- backend/src/publicaciones/publicaciones.module.ts: reutilización de Cloudinary/Usuarios/Seguridad.
- backend/src/cloudinary/cloudinary.service.ts: carpeta opcional con default perfiles para conservar registro.

Pruebas backend:

- backend/src/publicaciones/publicaciones.controller.http.spec.ts: conserva los 18 casos anteriores adaptados y amplía a 43.
- backend/src/publicaciones/entities/publicacion.entity.spec.ts (nuevo): 2 casos del schema en memoria.
- backend/src/cloudinary/cloudinary.service.spec.ts (nuevo): 3 casos de carpeta/compatibilidad/error con stream simulado.

Frontend:

- frontend/src/app/services/publicaciones.ts: FormData con titulo/descripcion/imagen; interface de lectura tolerante a documentos/respuestas anteriores.
- frontend/src/app/pages/publicaciones/publicaciones.ts: FormGroup, imagen reutilizando validador existente, mensajes y estados.
- frontend/src/app/pages/publicaciones/publicaciones.html: campos, título del post y fallback antiguo, sin botón de baja.
- frontend/src/app/pages/publicaciones/publicaciones.css: reutiliza superficie de controles y foco visible, sin rediseño.
- frontend/src/app/pages/publicaciones/publicaciones.spec.ts (nuevo): 12 casos; los 20 anteriores no se modificaron.

Documentos actualizados: 00, 01, 02, 03, 05, 06, 08, 09 y 10. Los relacionados se actualizaron para no describir la imagen/baja como inexistentes. Se conservó el historial de las tareas anteriores.

### Decisiones y ejemplo del club

Un parte del club ahora tiene encabezado obligatorio y descripción. Si trae fotografía, Nest comprueba el archivo y Cloudinary guarda la imagen; MongoDB conserva su URL y el ObjectId del jugador que lo presentó. AutorId siempre viene del JWT validado, no de Angular.

Contenido sigue existiendo: los documentos nuevos lo reciben como alias de descripcion y GET también lo devuelve. Los documentos viejos se muestran con «Publicación anterior» y descripción desde contenido, sin escribir esos fallbacks a MongoDB. El filtro activo distinto de false incluye ausentes/null antiguos; los nuevos nacen con true. No se ejecutó migración. La creación antigua solo contenido se rechaza porque titulo/descripcion son obligatorios; formulario/API deben desplegarse coordinados.

Retirar un parte de la cartelera es marcar activo false, no romper la ficha ni borrar su foto. El socio puede retirar el suyo; un administrador vigente puede retirar uno ajeno. UsuariosService.findById comprueba el rol actual y la existencia del actor. Un JWT viejo que diga administrador no concede permiso si la ficha actual ya es usuario. El updateOne condicionado evita confirmar dos bajas simultáneas y permite retirar documentos antiguos sin validar nuevamente todo su título/descripcion.

Título máximo 120: límite técnico elegido para cabecera legible, no valor fijado en el enunciado. Descripción máximo 2000: mantiene el límite de texto existente. Archivo opcional hasta 5 MiB; JPEG/PNG/WebP según firma, no solo MIME declarado. El servicio Cloudinary conserva default perfiles y usa publicaciones cuando se solicita; no duplica el adaptador.

### Validaciones y respuestas

POST: AuthGuard, DTO, archivo opcional validado y reglas de servicio. 201 correcto; 400 por vacío/tipo/longitud/propiedades/imagen inválida; 401 sesión; 413 exceso de archivo; 500 si falla servicio. No se guarda cuando falla la subida. Angular muestra estados/mensajes y conserva datos ante error; después de éxito limpia también el selector nativo de archivos.

DELETE: 400 por id inválido, 401 sin sesión/usuario vigente, 403 ajeno no administrador, 404 inexistente/retirada/carrera y 200 con mensaje de confirmación. No existe acción Angular de baja: el modal con Cancelar/Confirmar se implementará en 3C.

### Pruebas y verificación

| Comando                                                              | Resultado final                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Frontend npm run build                                               | Correcto; publicaciones.css 4,88 KB frente al presupuesto de aviso de 4 KB, excedente 877 bytes. |
| Frontend node node_modules/@angular/cli/bin/ng.js test --watch=false | 32/32 aprobadas, 4 suites (20 anteriores + 12 nuevas).                                           |
| Backend npm run build                                                | Correcto, incluida repetición tras ajuste del límite de imagen.                                  |
| Backend npm test                                                     | 59/59 aprobadas, 6 suites.                                                                       |

Primer intento Nest: 55/56 aprobadas; el caso de 5 MiB + 1 byte daba 400 y se esperaba 413. Al inspeccionar la implementación instalada se corrigió Multer a máximo exacto y se dejó máximo + 1 solo en el pipe de comparación estricta. La prueba de 5 MiB exactos y la de exceso pasaron sin debilitar aserciones. Se usó validate asíncrono en tests de modelo para evitar deprecación de validateSync. El fallo Cloudinary simulado usa su excepción HTTP controlada. Se agregaron después los tres casos del adaptador y la suite final pasó completa.

Las pruebas usan HTTP local con AuthGuard/DTO/pipes/servicio reales y modelos/usuarios/transportes simulados. Schema se valida en memoria. No conectan Atlas/Cloudinary ni crean/retiran contenido real. No se omitió ni deshabilitó ningún caso; los cambios de expectativas responden al contrato obligatorio nuevo. No se instalaron dependencias ni se alteró el presupuesto CSS.

La comparación SHA-256 final confirmó que autenticación/JWT/cookies, usuarios/seguridad, las suites recuperadas ajenas al contrato ampliado, configuración y dependencias conservan su huella. Cambiaron 20 archivos existentes y se agregaron 4 (24 en total), exactamente los indicados. Se validaron enlaces, bloques Markdown y 44 IDs únicos de trazabilidad; no hay skip/todo/only ni errores de espacios en git diff --check. HEAD sigue en c8383c9, sin commits nuevos.

### Variables y pendientes

Sin variables nuevas. Se mantienen CONNECTION_STRING, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET y FRONTEND_URL; NODE_ENV, PORT y VERCEL según el entorno. No se muestran ni leen sus valores.

Pendiente: ensayo real con Atlas y Cloudinary, despliegue conjunto, posible compensación de imagen huérfana si Cloudinary sube y falla save, modal/botón de baja 3C y demás requisitos de Sprint 2–4. La baja conserva imagen/documento a propósito. JWT/cookies siguen como antes, incluidos los 20 segundos de prueba.

Listo para revisión e integración del alcance 3A con suites locales aprobadas; no equivale a validar producción. Se detiene la tarea a la espera de aprobación.

---

## 31/10/2026 — Sprint 2, Tarea 3B: likes, filtros y páginas

**Problema y ejemplo:** el club necesitaba votar jugadas sin repetir al mismo socio y consultar la cartelera de diez en diez, ordenada por fecha o apoyo recibido, sin descargar todo. Se implementa la lógica de S2-03/04/05/07 y avance de G-02, dejando la interfaz final para 3C.

**Git:** inicio limpio en feature/publicaciones-modelo, HEAD 7b740f4 («fix publicaciones»), con 3A ya confirmado. Se ejecutaron antes ambas compilaciones y suites (FE 32/32, BE 59/59). No había cambios que respaldar: no se hizo un commit vacío. Se creó feature/publicaciones-likes-paginacion y HEAD permanece en 7b740f4. No hay commits nuevos, merge ni deploy.

### Archivos y decisiones

- backend/src/publicaciones/entities/publicacion.entity.ts y publicaciones.constants.ts: array de votantes default vacío y límites de listado 10/100.
- backend/src/publicaciones/dto/listar-publicaciones.dto.ts (nuevo): parámetros concretos, enteros estrictos, orden y autor validados.
- backend/src/publicaciones/guards/autenticacion-opcional.guard.ts (nuevo): lectura pública con identidad opcional verificada por el AuthGuard existente, sin renovar sesión.
- backend/src/publicaciones/publicaciones.controller.ts y publicaciones.module.ts: GET con DTO/guard opcional y POST/DELETE :id/likes con autenticación obligatoria; guard registrado en el módulo existente.
- backend/src/publicaciones/publicaciones.service.ts: filtro previo a agregación, conteo derivado, orden determinista, facet página/total, autores públicos solo de la página; darMeGusta/quitarMeGusta y helper cambiarMeGusta con actualización atómica condicionada.
- frontend/src/app/services/publicaciones.ts: tipos de parámetros/respuestas, HttpParams, cookies y métodos de likes; crear conserva FormData.
- frontend/src/app/pages/publicaciones/publicaciones.ts: extrae el array del nuevo sobre y conserva metadatos para 3C.
- backend/src/publicaciones/publicaciones.controller.http.spec.ts: mantiene 43 casos previos y agrega 36; entities/publicacion.entity.spec.ts amplía defaults/índice sin quitar sus dos casos.
- frontend/src/app/services/publicaciones.spec.ts (nuevo): tres casos de transporte; app.spec.ts y pages/publicaciones/publicaciones.spec.ts adaptan expectativas del GET conservando casos y aserciones de comportamiento.
- docs/00-MAPA-DEL-PROYECTO.md, 03-PUBLICACIONES.md, 08-PRUEBAS-Y-DESPLIEGUE.md, 09-REQUISITOS-SPRINTS.md y 10-BITACORA-DE-CAMBIOS.md: mapa, contrato, ejemplos, evidencia, matriz y registro de esta tarea.

**Datos y seguridad:** JWT verificado → actor → usuario actual → findOneAndUpdate activo con addToSet/pull → mensaje/cantidad/estado. Nunca se utiliza identidad proporcionada por el cliente. Un único array evita desincronización de contador y la actualización atómica evita duplicados concurrentes; no se agrega índice unique global de usuario. GET no expone votantes ni credenciales; recibe orden/autor/offset/limit, filtra antes de paginar y devuelve publicaciones/total/offset/limit/hayMas. Por fecha desempata id; por likes desempata fecha e id. Ver códigos 201/200/400/401/404/409 y recorrido completo en 03.

**Compatibilidad:** likes ausente se interpreta como vacío y aparece al primer voto; título/descripcion/contenido/activo antiguos se normalizan solo en respuesta. No se migró Atlas ni se alteró creación, imágenes o baja lógica. GET cambia de array a sobre: Angular queda adaptado y requiere integración coordinada. No se modificaron HTML/CSS ni se implementó UI 3C.

**Conceptos para estudiar:** DTO y transformaciones, guards e inyección reutilizada, referencias ObjectId, single-document update atómico, agregación/facet, orden y paginación, HttpParams y Observable tipado. Como en CineBera, la pantalla delega el HTTP al servicio; ahora recibe también metadatos de la cartelera de FutbolCrack.

### Verificación y pendientes

La comparación SHA-256 contra la base confirmó 16 archivos existentes modificados y 3 nuevos, exactamente los inventariados arriba. Autenticación/JWT/cookies, usuarios, Cloudinary productivo, dependencias, configuración y HTML/CSS mantienen su huella. git diff --check terminó sin errores; se comprobaron enlaces locales, bloques Markdown y los 44 IDs únicos de la matriz. No hay skip/todo/only en las pruebas cambiadas. Git advierte únicamente normalización LF/CRLF en los archivos Angular según su configuración.

Ambas compilaciones salen 0. Frontend: 35/35, 5 suites (antes 32/32). Backend: 95/95, 6 suites (antes 59/59). No se eliminaron, saltaron ni deshabilitaron casos. Persiste solo el aviso previo de publicaciones.css: 4,88 KB / presupuesto 4 KB, +877 bytes. Comandos completos y alcance de dobles en 08.

Los modelos de pruebas simulan consultas/actualizaciones y se inspeccionan filtros y operadores enviados. Ocho solicitudes simultáneas producen una 201 y siete 409 en ese entorno; falta verificarlo en una base MongoDB de ensayo. Tampoco se probaron Atlas/Cloudinary/Vercel ni la app contra un backend desplegado. La ordenación calculada, límites BSON/facet y cambios del conjunto entre páginas offset están explicados en 03.

Pendientes: UI de likes/filtros/paginador numerado/tarjeta real/modal de baja en 3C, perfil real/comentarios según tareas posteriores, ensayo externo, integración/despliegue coordinado con aprobación y posible compensación de imagen huérfana ya registrada en 3A. Sin dependencias nuevas ni secretos/.env modificados; JWT/cookies originales conservados. Listo para revisión local del alcance 3B; no equivale a validación productiva. Se detiene al entregar para esperar aprobación.

---

## 31/10/2026 — Sprint 2, Tarea 3C: interfaz y Mi Perfil

**Objetivo y ejemplo del club:** presentar jugadas reales en fichas reutilizables, votar, recorrer la cartelera de diez en diez y confirmar su retiro. El jugador ve sus últimas tres jugadas en el perfil; no se inventan autores, likes ni comentarios.

**Git y respaldo:** inicio en feature/publicaciones-likes-paginacion con los 19 archivos pendientes esperados de 3B. Se verificaron antes compilaciones (salida 0), FE 35/35 y BE 95/95. La consigna autoriza guardar 3B: commit local 71c0525, «feat(publicaciones): agregar likes y listado paginado». Se creó feature/publicaciones-interfaz desde ese commit. HEAD permanece allí; no se hizo commit de 3C, merge ni deploy.

### Inventario completo

- docs/00-MAPA-DEL-PROYECTO.md
- docs/03-PUBLICACIONES.md
- docs/08-PRUEBAS-Y-DESPLIEGUE.md
- docs/09-REQUISITOS-SPRINTS.md
- docs/10-BITACORA-DE-CAMBIOS.md
- docs/guia-angular.md
- frontend/src/app/app.spec.ts
- frontend/src/app/components/confirmacion-baja/confirmacion-baja.css
- frontend/src/app/components/confirmacion-baja/confirmacion-baja.html
- frontend/src/app/components/confirmacion-baja/confirmacion-baja.spec.ts
- frontend/src/app/components/confirmacion-baja/confirmacion-baja.ts
- frontend/src/app/components/publicacion-card/publicacion-card.css
- frontend/src/app/components/publicacion-card/publicacion-card.html
- frontend/src/app/components/publicacion-card/publicacion-card.spec.ts
- frontend/src/app/components/publicacion-card/publicacion-card.ts
- frontend/src/app/pages/mi-perfil/mi-perfil.css
- frontend/src/app/pages/mi-perfil/mi-perfil.html
- frontend/src/app/pages/mi-perfil/mi-perfil.spec.ts
- frontend/src/app/pages/mi-perfil/mi-perfil.ts
- frontend/src/app/pages/publicaciones/publicaciones-interacciones.spec.ts
- frontend/src/app/pages/publicaciones/publicaciones.css
- frontend/src/app/pages/publicaciones/publicaciones.html
- frontend/src/app/pages/publicaciones/publicaciones.spec.ts
- frontend/src/app/pages/publicaciones/publicaciones.ts
- frontend/src/app/pipes/truncate.pipe.spec.ts
- frontend/src/app/pipes/truncate.pipe.ts
- frontend/src/app/services/acciones-publicaciones.ts
- frontend/src/app/services/publicaciones.spec.ts
- frontend/src/app/services/publicaciones.ts
- frontend/src/app/testing/dialog-prueba.ts
- frontend/src/app/testing/publicaciones-fixture.ts

### Implementación y recorrido

- **Tarjeta real compartida:** PublicacionCard recibe Inputs y emite cambiarLike/solicitarBaja/abrirDetalle. No ejecuta HTTP. Feed y perfil coordinan las acciones; detalleDisponible queda false hasta Sprint 3. Se muestran autor/foto/fecha, título/descripcion o contenido antiguo, imagen, cantidad y estado del voto.
- **Pipe:** TruncatePipe puro y expansión Ver más/Ver menos a 280 caracteres, sin mutar el contenido; cuenta como uno de los tres de S4. Se documentan bindings y accesibilidad.
- **Acciones compartidas:** AccionesPublicaciones usa señales locales por pantalla para pendientes, modal y mensajes. La implementación se reutiliza sin compartir el estado de pantallas distintas. Cada voto se bloquea mientras espera y recarga datos reales en éxito; conflictos 409/404 sincronizan sin simular éxito.
- **Paginación/orden:** Publicaciones manda limit 10, offset por página y fecha/likes. Selector vuelve al inicio, controles numerados muestran una ventana de cinco más extremos, con anterior/siguiente. Lecturas anteriores se cancelan y las suscripciones terminan al destruir la pantalla. Una última página vacía tras una baja se reubica en la última válida.
- **Baja:** solicitarBaja solo selecciona; dialog nativo con diseño propio identifica el título. Cancelar/Escape no solicitan. Confirmar envía DELETE mediante el servicio HTTP, bloquea doble confirmación y espera éxito antes de cerrar/mensaje/recarga. El rechazo conserva modal/publicación y muestra error. Nest sigue validando propiedad/rol actual, sin cambios de backend.
- **Perfil:** /auth/me entrega usuario real y se consulta usuarioId/fecha/offset 0/limit 3, reutilizando tarjeta/acciones/modal. Se elimina el consumo de demos; errores de publicaciones no borran la ficha. Los comentarios se anuncian como próximos, sin sistema paralelo ni cifras ficticias.
- **Estilo y estudio:** se conservan negro, verde musgo, gris y radios globales. Los estilos de tarjetas pasan al hijo; CSS comentado explica controles, fotos, estados y móvil. guia-angular.md desarrolla TS/HTML/CSS, routing, formularios, bindings, Input/Output, señales, servicios, recorrido y preguntas de defensa. El patrón de tarjeta/servicio/formulario se relaciona con CineBera sin afirmar equivalencia con un repositorio que no está aquí.

Datos: componente padre → servicio de acciones/servicio HTTP Angular → endpoint NestJS 3A/3B → guard/DTO/servicio → MongoDB → respuesta → recarga de la página y Inputs de los hijos. Cookies HttpOnly se envían con withCredentials; no se leen, renuevan ni cambian. No se tocaron JWT, secretos, modelos o endpoints backend ni se instalaron dependencias.

### Pruebas y cierre

Final: frontend build salida 0 sin advertencias, 60/60 en 10 suites; backend build salida 0, 95/95 en 6 suites. Se conservan las 35 pruebas Angular anteriores y agregan 25. La advertencia CSS anterior de +877 bytes desaparece tras trasladar reglas a la tarjeta y quitar selectores/reglas duplicadas, sin aumentar presupuestos. No se modifican dependencias.

Durante la verificación, JSDOM carecía de showModal/close, una comparación incluía whitespace de plantilla y la simulación directa de usuario no reproducía la sesión Angular. Se agregó un doble DOM exclusivo de pruebas, se compara texto con trim y se prueba permiso mediante respuestas GET /auth/me de sesiones distintas. También se marca el comienzo de carga con markForCheck para actualizar la vista de inmediato. Historial de ejecuciones y comandos en 08; sin saltar casos, debilitar permisos ni elevar timeouts.

La cobertura verifica tarjeta/Input/Output, pipe, likes/cantidad/errores/bloqueos, 10/10/3 y páginas posteriores, cambio de orden, modal/cancelación/confirmación/403, última página vacía, datos/imagen de perfil y últimas tres propias, vacío/error/reintento y compatibilidad antigua. HTTP y API nativa de diálogo están simulados; backend conserva los dobles de 3B. No se probaron servicios externos, cookies/CORS reales, aspecto en dispositivos o la capa modal nativa en navegador.

La revisión SHA-256 final confirma 18 archivos existentes modificados y 13 nuevos (31 en total), coincidentes con el inventario. Backend completo, autenticación/guard Angular, dependencias y configuración conservan su huella de 71c0525. git diff --check no tiene errores; enlaces y bloques Markdown válidos, 44 IDs únicos de matriz y sin pruebas skip/todo/only. Git solo avisa normalización LF/CRLF según configuración existente.

**Pendientes:** comentarios y detalle de Sprint 3; otros dos pipes S4; resto de requisitos de sprints posteriores; ensayo real Atlas/Cloudinary/API y navegador; integración coordinada con 3A/3B. La URL Angular continúa siendo la del backend Vercel existente: no se verificó su versión desplegada y necesita el contrato paginado. El TTL JWT previo de 20 segundos permanece y puede interrumpir un ensayo prolongado. No se detectó impedimento que requiera cambiar contrato/backend; tampoco se declara validada producción. Compensación de imágenes huérfanas sigue pendiente de 3A.

Listo para revisión local del alcance autorizado, con límites externos identificados. Se detiene y espera aprobación; sin merge/deploy ni commit de 3C.

---

## 31/10/2026 — Sprint 3, Tarea 4A: backend de comentarios

**Objetivo y ejemplo:** Lucía deja una nota en la jugada de Mateo, todos pueden leerla y solo Lucía puede corregirla. Un administrador no puede reescribir opiniones de otro socio. Se implementa únicamente backend; sin UI, eliminación ni cambio de sesión.

**Git y base:** inicio limpio main 9224cad, merge de la interfaz 3C ya confirmado por el usuario. Se comprobaron ambas compilaciones, FE 60/60 y BE 95/95 (tras repetir por un cierre de worker). Sin cambios previos para respaldar, no se hizo commit vacío. Se creó feature/comentarios-backend; HEAD continúa en 9224cad. No hay commits nuevos, merge ni deploy.

### Archivos creados/modificados

- backend/src/app.module.ts
- backend/src/comentarios/comentarios.constants.ts
- backend/src/comentarios/comentarios.controller.http.spec.ts
- backend/src/comentarios/comentarios.controller.ts
- backend/src/comentarios/comentarios.module.ts
- backend/src/comentarios/comentarios.service.ts
- backend/src/comentarios/dto/crear-comentario.dto.ts
- backend/src/comentarios/dto/editar-comentario.dto.ts
- backend/src/comentarios/dto/listar-comentarios.dto.ts
- backend/src/comentarios/entities/comentario.entity.spec.ts
- backend/src/comentarios/entities/comentario.entity.ts
- backend/src/common/validation/entero-query.ts
- backend/src/publicaciones/dto/listar-publicaciones.dto.ts
- backend/src/publicaciones/publicaciones.module.ts
- docs/00-MAPA-DEL-PROYECTO.md
- docs/01-ARQUITECTURA.md
- docs/04-COMENTARIOS.md
- docs/08-PRUEBAS-Y-DESPLIEGUE.md
- docs/09-REQUISITOS-SPRINTS.md
- docs/10-BITACORA-DE-CAMBIOS.md


### Implementación y decisiones

**Modelo:** Comentario guarda _id, publicacionId ref Publicacion, autorId ref Usuario, texto, modificado false y timestamps createdAt/updatedAt. Referencias inmutables; no se duplican nombre/foto ni credenciales. Índice declarado por publicacionId/createdAt/_id. Texto máximo 1000 unidades UTF-16 tras trim (decisión técnica local, no requisito oficial supuesto); página default 3, máximo técnico 100.

**Módulo y reutilización:** ComentariosModule registra el único módulo funcional nuevo autorizado. Importa SeguridadModule/UsuariosModule/PublicacionesModule existentes. PublicacionesModule exporta MongooseModule para reutilizar el modelo, sin recrear schema ni lógica. AppModule registra ComentariosModule. enteroDeQuery se extrae literalmente del DTO de publicaciones a common/validation y se reutiliza desde ambos DTO; las reglas de conversión y validación de publicaciones no cambian.

**Endpoints y recorrido:** POST /publicaciones/:publicacionId/comentarios toma texto del body y autor solo del JWT; devuelve 201 con mensaje/comentario. GET misma ruta es público, exige publicación activa, ordena por createdAt/_id descendentes y devuelve comentarios/total/offset/limit/hayMas. PUT /comentarios/:id exige autor original y devuelve 200 con mensaje/comentario modificado. Los tres verifican ObjectId y existencia/actividad; las escrituras verifican además usuario actual. DTO global rechaza propiedades ajenas, texto vacío/tipos incorrectos y longitud inválida. No hay DELETE.

**Edición y permisos:** AuthGuard verifica identidad; servicio compara autorId persistido con sub, sin permiso especial de administrador. La actualización se condiciona por id/autor/publicación y solo cambia texto/modificado; Mongoose actualiza updatedAt y mantiene createdAt. Un PUT aceptado del mismo texto también marca modificado. Ausente/inactiva 404; ajeno 403; falta de sesión/sujeto/usuario 401; datos/ids/query malos 400.

**Respuesta mínima:** presentar arma lista positiva de campos y populate resuelve autor con nombre/apellido/imagenPerfil e id. Ni correo, rol ni contraseña/hash se devuelven. Si el autor desapareció, autorId es null. Solo se pueblan los comentarios de la página; MongoDB conserva ObjectId, no la ficha copiada.

**Paginación:** match de publicación antes de sort y facet; skip/limit en MongoDB y conteo sobre los mismos registros. Ocho comentarios se piden con offsets 0/3/6 y dan 3/3/2; Angular deberá anexar para mostrar 3/6/8. Fechas empatadas usan id descendente. Editar no altera orden por creación. Publicaciones antiguas sin activo siguen habilitadas usando activo distinto de false; no se migran documentos.

**Conceptos pedagógicos:** módulo e inyección de dependencias, controller HTTP, DTO/herencia/Transform/validadores, schema/referencias, timestamps, diferencia entre autenticación/autorización, populate/proyección positiva, agregación/facet, índice compuesto y offset/limit. 04 explica cada método con ejemplo del club, cuerpos/respuestas y cómo probarlo; 00 muestra ubicaciones, 01 arquitectura y 09 estados verificados.

### Comprobaciones

Final: frontend build salida 0, 60/60 en 10 suites; backend build salida 0 y suite completa 157/157 en 8 suites con node node_modules/vitest/vitest.mjs run --no-file-parallelism. Se conservan las 95 pruebas anteriores y agregan 58 HTTP más 4 de schema. No se instalaron dependencias ni se modificaron timeouts/configuración del runner.

La primera ejecución nueva encontró una prueba que construía dos peticiones Supertest antes de completar la primera: cerraba el puerto temporal y fallaba address null. Se corrigió a construcción/envío secuenciales sin alterar producción ni aserciones. También hubo cierres inesperados de workers (uno ya presente en la base); npm rechazó reenviar el flag de serialización con EUNKNOWNCONFIG, por lo que se usó el ejecutable local de Vitest directamente. Historial exacto y límites en 08. No se omitieron tests para lograr resultados positivos.

Las pruebas HTTP importan el módulo funcional real; sustituyen conexión/modelos, usuarios y transporte de imágenes. Comprueban guards/DTO/servicio reales, inyección/exportación de Publicacion, altas, tipos/vacíos/límites (incluidos emojis), sesión, permisos de autor/admin, 3/3/2, empates, proyección mínima, 404/id inválido, modificado y ausencia de DELETE. Schema Mongoose se valida en memoria. Fechas/persistencia/aggregate/populate se modelan con dobles: no es ensayo real contra Atlas.

### Riesgos, pendientes y entrega

No se cambió la interfaz Angular, JWT/cookies, likes ni baja lógica. No se leyeron/modificaron .env ni secretos. Las consultas conservan publicaciones antiguas visibles y el contrato previo de publicaciones.

La comprobación de actividad y operación de comentario son consultas de documentos diferentes sin transacción: una baja que ocurre después del chequeo puede competir con una creación/edición/lectura ya iniciada. Se documenta esa ventana y no se afirma atomicidad entre colecciones; coordinarla requeriría una tarea sobre ambas operaciones. El orden offset tampoco congela el conjunto entre solicitudes; nuevas inserciones pueden desplazar páginas.

Pendiente: ensayo real de MongoDB/índice/timestamps/populate, middleware de origen/cookies/CORS y errores externos; integración Angular de formulario/listado de tres, Ver más con anexado, edición propia, etiqueta Editado, mensajes/carga/error, perfil y detalle. JWT continúa con 20 segundos de prueba. No se implementan eliminación, renovación de sesión ni otros módulos de sprints posteriores.

Revisión final SHA-256: 9 archivos existentes modificados y 11 nuevos (20 en total), coincidentes con el inventario. Frontend completo, autenticación/JWT/cookies, usuarios, Cloudinary, lógica de likes/baja y dependencias conservan su huella de 9224cad. Se validan enlaces, bloques Markdown y 44 IDs únicos de trazabilidad, sin skip/todo/only. git diff --check no tiene errores; el aviso de normalización CRLF/LF del módulo principal responde a la configuración existente de Git.

Listo para revisión del alcance backend local, con pruebas completas y límites externos documentados. Se detiene y espera aprobación; no se realiza commit, merge ni deploy automáticamente.

---

## 01/11/2026 — Sprint 3, Tarea 4B: detalle y comentarios Angular

**Objetivo y ejemplo del club:** abrir una jugada por su id, leer notas de tres en tres, escribir una propia y corregir solo las del autor. El perfil comparte la misma sección para los comentarios de sus últimas tres jugadas, sin contenido demo ni carga ilimitada.

**Git:** inicio en feature/comentarios-backend con los 20 archivos esperados de 4A pendientes, HEAD 9224cad. Antes de guardar: ambas compilaciones correctas, FE 60/60 y BE 157/157 (archivos en serie). Se guardó el respaldo autorizado 70622bb, «feat(comentarios): agregar backend con paginacion y edicion propia», y se creó feature/comentarios-interfaz. HEAD sigue en ese respaldo; no se hace commit de 4B, merge ni deploy.

### Inventario completo

- backend/src/publicaciones/publicaciones.controller.http.spec.ts
- backend/src/publicaciones/publicaciones.controller.ts
- backend/src/publicaciones/publicaciones.service.ts
- docs/00-MAPA-DEL-PROYECTO.md
- docs/01-ARQUITECTURA.md
- docs/03-PUBLICACIONES.md
- docs/04-COMENTARIOS.md
- docs/08-PRUEBAS-Y-DESPLIEGUE.md
- docs/09-REQUISITOS-SPRINTS.md
- docs/10-BITACORA-DE-CAMBIOS.md
- docs/guia-angular.md
- frontend/src/app/app.routes.ts
- frontend/src/app/app.spec.ts
- frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.css
- frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.html
- frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.spec.ts
- frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.ts
- frontend/src/app/components/publicacion-card/publicacion-card.html
- frontend/src/app/components/publicacion-card/publicacion-card.spec.ts
- frontend/src/app/components/publicacion-card/publicacion-card.ts
- frontend/src/app/pages/mi-perfil/mi-perfil.css
- frontend/src/app/pages/mi-perfil/mi-perfil.html
- frontend/src/app/pages/mi-perfil/mi-perfil.spec.ts
- frontend/src/app/pages/mi-perfil/mi-perfil.ts
- frontend/src/app/pages/publicacion-detalle/publicacion-detalle.css
- frontend/src/app/pages/publicacion-detalle/publicacion-detalle.html
- frontend/src/app/pages/publicacion-detalle/publicacion-detalle.spec.ts
- frontend/src/app/pages/publicacion-detalle/publicacion-detalle.ts
- frontend/src/app/pages/publicaciones/publicaciones.html
- frontend/src/app/pages/publicaciones/publicaciones.ts
- frontend/src/app/services/comentarios.spec.ts
- frontend/src/app/services/comentarios.ts
- frontend/src/app/services/publicaciones.spec.ts
- frontend/src/app/services/publicaciones.ts
- frontend/src/app/testing/comentarios-fixture.ts

### Implementación y decisiones

**Detalle y mínimo backend:** la ruta pública Angular publicaciones/:id carga PublicacionDetalle. El listado existente solo filtraba por autor y no podía reutilizarse correctamente para encontrar un id sin descargar páginas. Se agrega GET /publicaciones/:id, autorizado explícitamente en 4B: id válido, activo distinto de false, 400/404 adecuados, lectura anónima y meGusta si hay JWT válido. obtenerPorId comparte consultarListado con filtro _id y limit 1; no duplica normalización antigua, autor público ni cálculo de likes. No cambian los contratos existentes.

**Tarjeta/navegación:** feed y perfil conectan abrirDetalle a verDetalle; PublicacionCard conserva Inputs/Outputs y recibe textoCompleto en el detalle, manteniendo el pipe y todo el texto. PublicacionDetalle observa paramMap, cancela GET previo y limpia la jugada anterior al cambiar id. Distingue carga, error, inválido, inexistente e inactiva; reutiliza likes/modal de baja y comentarios.

**Servicio y sección reutilizable:** ComentariosService tipa los contratos reales de 4A, manda cookies y solo texto en POST/PUT. ComentariosPublicacion recibe publicacionId/usuario y administra su estado local, formularios y llamadas delegadas al servicio. No se duplica el detalle en Mi Perfil ni se solicitan sesiones desde cada comentario.

**Alta y validación:** FormGroup exige texto no vacío/no solo espacios y máximo 1000 unidades UTF-16; contador .length, textarea con maxlength/aria-invalid. Se evita doble envío, el textarea queda de solo lectura mientras espera y se conserva ante error. Tras 201: mensaje real, formulario limpio y reinicio de lista/offset a cero para traer tres recientes sin mezclar páginas desplazadas por la nota nueva.

**Paginación/anexado:** primer GET 0/3; Cargar más pide 3/3 y 6/3. Map por _id anexa/deduplica y actualiza datos de filas repetidas, sin reemplazar la colección previa; offset avanza por cantidad recibida, no por únicos. Errores conservan array/offset y reintentan la misma página. No hay descarga completa. hayMas controla fin de resultados. Las notas largas reutilizan TruncatePipe con estado de expansión por id.

**Edición/seguridad:** botón solo propio (sin excepción admin), formulario obligatorio, guardar/cancelar y bloqueo de duplicados. Cancelar no pide PUT; éxito sustituye solo el comentario confirmado, conserva otros y muestra Editado desde modificado. Error mantiene texto. Nest conserva la verificación definitiva de autor/JWT y publicaciones activas; no se cambian sus endpoints de comentarios, DTO ni modelos.

**Perfil:** cada publicacion-del-perfil agrupa ficha y sección de comentarios con el mismo id, máximo nueve comentarios iniciales (tres para cada una de las tres publicaciones). Se mantienen hijos por id durante recarga de likes para no perder borradores/páginas. Una baja confirmada retira primero el grupo y luego repone el listado. GET/POST de comentarios con 404 avisa al padre para ocultar la publicación; 404 de PUT mantiene edición con error porque puede faltar solamente el comentario.

**Estética y estudio:** se conservan negro/verde musgo/gris y radios globales; CSS comentado explica formularios, fotos, estados y móvil. Documentación 00/01/03/04/08/09/10 y guia-angular.md explica rutas, componentes, padre/hijo, servicio, formularios, bindings, UTF-16, offsets y ejemplos/preguntas de defensa. Se reutilizan patrones de CineBera sin afirmar equivalencia con un repositorio ajeno al workspace.

### Verificación y ajustes

Final: frontend npm run build salida 0 y sin avisos CSS; Angular 97/97 en 13 suites. Backend npm run build salida 0 y 162/162 en 8 suites con node node_modules/vitest/vitest.mjs run --no-file-parallelism. Se conservan 60 tests FE/157 BE anteriores y se agregan 37 FE/cinco BE. Sin dependencias, timeouts o scripts nuevos y sin omitir casos.

Una ejecución de las 60 pruebas anteriores falló 59/60 por espacios de plantilla introducidos al formatear la interpolación del pipe. Se corrigió el HTML con binding textContent, conservando aserciones exactas y espacios del dato original. Después la suite ampliada pasó 97/97. El build final detectó expect global en helper .ts nuevo: se reemplazó por verificación explícita que arroja Error ante parámetros incorrectos, sin exponer globals de tests al proyecto productivo. Tras esa corrección y la protección de borradores del perfil, build y suite completa volvieron a pasar.

Cobertura nueva: servicios/contratos/cookies, Outputs/navegación y URL directa, ID/404/inactiva/errores/datos antiguos, comentario inicial y 3/6/8, duplicados/offset por recibidos, errores de carga con reintento, alta luego de páginas cargadas, validaciones/UTF-16, errores con borrador, edición propia/ajena/admin/cancelación/Editado, cambio de Input y comentarios separados en tres publicaciones del perfil. La prueba previa del like se amplía para conservar borrador. RouterTestingHarness usa rutas reales y HttpTestingController intercepta todo HTTP; backend mantiene modelos simulados.

### Pendientes y límites

No se verifican Vercel/Atlas/Cloudinary, persistencia/timestamps/índices reales, cookies/CORS en navegador o aspecto en dispositivos. Es necesario integrar API con 4A y el nuevo GET individual junto al frontend; no se verificó la versión actualmente desplegada. Las pruebas no sustituyen un ensayo externo ni autorizan despliegue.

Se conservan los límites de consistencia entre publicación/comentario de 4A. Nuevas notas externas pueden desplazar páginas offset: deduplicar no garantiza una instantánea ni incorporar toda nota externa nueva; el alta local reinicia la primera página y la recarga explícita permite resincronizar. Cancelar una suscripción no revierte una escritura ya aceptada por el servidor.

JWT/cookies, backend de comentarios, lógica de likes/baja, secretos/.env y dependencias se conservan. No se implementa eliminación, renovación de sesión, cambio de TTL, interceptor global de 401 ni avisos/modales temporales: quedan para 4C; el TTL previo sigue en 20 segundos. El resto de Sprints 3/4 permanece según matriz.

Revisión SHA-256 final: 24 archivos existentes modificados y 11 nuevos (35 en total), coincidentes con el inventario. Backend de comentarios, autenticación/JWT/cookies, usuarios, Cloudinary, bloques de likes/baja y dependencias conservados respecto de 70622bb. Se validaron enlaces, bloques Markdown y 44 IDs únicos; sin skip/todo/only ni errores de git diff --check. Git solo advierte normalización LF/CRLF de archivos Angular según su configuración existente.

Listo para revisión local del alcance 4B, con límites externos documentados. Se detiene y espera aprobación; sin commit de 4B, merge ni deploy.

---

## 01/11/2026 — Sprint 3, Tarea 4C: autorización y renovación voluntaria

**Objetivo y ejemplo:** el carnet del club dura quince minutos. La recepción Angular consulta si sigue vigente al abrir/recargar, avisa cuando quedan cinco y solo tramita otro si el socio acepta antes de vencer. Un rechazo de permiso no significa que se perdió el carnet.

**Git:** inicio limpio main 0d94da5, merge de 4B ya guardado por el usuario. Base comprobada: builds frontend/backend salida 0, FE 97/97, BE 162/162. No había cambios que respaldar: sin commit vacío. Se creó feature/renovacion-sesion. HEAD permanece en 0d94da5; sin commits nuevos, merge ni deploy.

**Inspección/limitación previa:** revisados registro/login, JWT/cookie, AuthGuard Nest/Angular, GET me/logout, CORS/middleware de origen, ausencia de interceptor y recuperación inicial. Se informó antes de implementar que Usuario no tiene habilitado/activo: se valida existencia/ficha actual, pero no se inventa un estado ni gestión de usuarios de Sprint 4. El rechazo específico de usuario deshabilitado y su prueba real quedan pendientes del modelo.

### Inventario completo

- backend/src/auth/auth.controller.ts
- backend/src/auth/auth.service.ts
- backend/src/auth/auth.sesion.http.spec.ts
- backend/src/auth/guards/auth.guard.ts
- backend/src/auth/seguridad.module.ts
- backend/src/auth/sesion-cookie.ts
- backend/src/auth/sesion.constants.ts
- backend/src/common/middlewares/validar-origen.middleware.spec.ts
- backend/src/common/middlewares/validar-origen.middleware.ts
- backend/src/common/origenes-permitidos.ts
- backend/src/main.ts
- docs/00-MAPA-DEL-PROYECTO.md
- docs/01-ARQUITECTURA.md
- docs/02-AUTENTICACION-Y-SEGURIDAD.md
- docs/04-COMENTARIOS.md
- docs/08-PRUEBAS-Y-DESPLIEGUE.md
- docs/09-REQUISITOS-SPRINTS.md
- docs/10-BITACORA-DE-CAMBIOS.md
- docs/guia-angular.md
- frontend/src/app/app.config.ts
- frontend/src/app/app.css
- frontend/src/app/app.html
- frontend/src/app/app.sesion.spec.ts
- frontend/src/app/app.spec.ts
- frontend/src/app/app.ts
- frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.ts
- frontend/src/app/components/extender-sesion/extender-sesion.css
- frontend/src/app/components/extender-sesion/extender-sesion.html
- frontend/src/app/components/extender-sesion/extender-sesion.spec.ts
- frontend/src/app/components/extender-sesion/extender-sesion.ts
- frontend/src/app/guards/auth.guard.ts
- frontend/src/app/interceptors/sesion.interceptor.spec.ts
- frontend/src/app/interceptors/sesion.interceptor.ts
- frontend/src/app/pages/login/login.html
- frontend/src/app/pages/login/login.sesion.spec.ts
- frontend/src/app/pages/login/login.ts
- frontend/src/app/services/api.config.ts
- frontend/src/app/services/auth.spec.ts
- frontend/src/app/services/auth.ts
- frontend/src/app/services/comentarios.ts
- frontend/src/app/services/publicaciones.ts
- frontend/src/app/testing/sesion-fixture.ts

### Implementación y decisiones

- **JWT/cookie:** DURACION_SESION_SEGUNDOS centraliza 900 segundos en SeguridadModule y emisión. guardarCookieSesion/opcionesCookieSesion comparten HttpOnly, Secure y None en producción, Lax en desarrollo, path / y maxAge calculado hasta exp real. Logout usa las mismas opciones. Datos públicos se proyectan en un método compartido por registro/login/me/sesión; nunca se devuelve token/hash en JSON.
- **Autorizar:** POST /auth/autorizar con AuthGuard existente y metadata de cookie obligatoria. Valida firma/exp/claims, usuario actual y vigencia tras consulta; devuelve usuario/emitidaEn/expiraEn/horaServidor sin renovar. Bearer se conserva en rutas anteriores, no sustituye cookie en los nuevos endpoints.
- **Refrescar:** POST /auth/refrescar acepta solo JWT vigente, comprueba usuario/exp antes y después de consultas/emisión, firma por quince minutos desde ahora y emite cookie. Toma rol de MongoDB, nunca de Angular. No hay refresh token persistente ni aceptación de vencidos.
- **CSRF/CORS:** origenesPermitidos comparte localhost:4200/FRONTEND_URL exactos con main.ts y ValidarOrigenMiddleware. Origin ajeno/null se rechaza; Referer permitido sirve solo si Origin falta. Sin ambos se rechazan sesión y escrituras con cookies. Lecturas/preflight y clientes Bearer sin cookie fuera de sesión conservan uso. No se confía en CORS/SameSite por sí solos, Host ni prefijos de dominios parecidos.
- **Arranque/caché:** App muestra carga mientras POST autorizar; raíz/guard comparten la petición mediante shareReplay. Recupera usuario/fechas, continúa URL solicitada o redirige a login con returnUrl interno. Login/registro no entran en bucle. Red/500 muestran Reintentar. ObtenerMiPerfil usa estado ya autorizado sin GET duplicado, manteniendo GET me como compatibilidad. API_URL centraliza el mismo destino previo en los tres servicios.
- **Aviso/renovación:** AuthService guarda solo usuario/fechas en señales, estima desfase con horaServidor y programa aviso a exp menos cinco minutos y expiración. ExtenderSesion es hijo presentacional con Outputs; Ahora no no solicita ni vuelve a abrir el aviso en esa misma sesión en memoria. Extender llama refrescar una vez, muestra espera/error y reinicia timers al confirmar.
- **Vencimiento/limpieza:** compara exp al foco/visibility para suspensión, limpia timers/listeners al cerrar/vencer/destruir y cancela flujos al destruir el servicio. versionSesion descarta respuestas antiguas después de logout/vencimiento. No hay tokens en almacenamiento web ni lectura de cookie por Angular.
- **401/403:** interceptor acotado al origen exacto/API protegida, excluye login y autorización inicial. 401 limpia estado y navega a login; 403/red/500 mantienen sesión y formularios. La redirección por vencimiento destruye la vista/borrador local; se ajusta el mensaje de comentarios para no prometer persistencia entre pantallas.

Los componentes/servicios existentes de publicaciones/comentarios mantienen sus contratos y reglas. No se agrega un módulo funcional ni se implementa habilitación, administración, reportes, PWA u otra funcionalidad de Sprint 4. La paleta/radios existentes se reutilizan para spinner/dialog con comentarios CSS y movimiento reducido.

### Datos, pedagogía y recorrido

Como en el club: cookie es el sobre del navegador, JWT es el carnet firmado y Nest es quien revisa firma/vencimiento/ficha. App pregunta autorizar al abrir; el guard comparte esa comprobación; las pantallas reciben usuario de la memoria; el hijo modal emite la decisión al padre; refrescar solo ocurre por esa decisión y devuelve fechas nuevas, no el token. Si un permiso falla (403), el carnet no se destruye.

02 documenta cuerpos/respuestas, seguridad, cookies antiguas, CSRF y límites. 00 mapa, 01 arquitectura, 08 evidencia, 09 matriz y guia-angular.md desarrollan archivos/clases/métodos, señales/Observable/shareReplay/finalize/DestroyRef, timers, interceptores y preguntas de defensa. 04 aclara los efectos del 401 sobre borradores. JWT de quince minutos no altera retroactivamente un token antiguo de veinte segundos: conserva su exp y, vencido, exige login.

### Pruebas y ajustes

Final: frontend build salida 0 sin avisos CSS; FE 138/138 en 18 suites (97 anteriores + 41). Backend build salida 0; BE 187/187 en 10 suites (162 anteriores + 25), ejecución completa con node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads. Sin tests omitidos, cambios de timeout/scripts/configuración o dependencias instaladas.

Backend añade 18 HTTP (JWT/bcrypt/cookies/guard/servicio/middleware reales con ficha/transporte simulados) y siete de CSRF. Incluye 900 segundos, autorizar/renovar válidos e inválidos, cookie ausente/Bearer no sustituto, expirado/inexistente, vigencia durante consulta, cookies antiguas, producción/logout, no token/hash en JSON y orígenes. La ausencia de habilitación se documenta y prueba como limitación del schema, no como deshabilitado rechazado.

Frontend añade 16 de AuthService con reloj simulado, 12 del interceptor, ocho de App, dos del modal y tres de login: inicio, caché/solicitud única, recarga/plazo restante, diez minutos, renovar/Ahora no, expiración/suspensión/limpieza, 401/403, rutas y retorno seguro. Los 97 casos previos se conservan; el guard ahora espera POST autorizar y el perfil usa caché. Se ajustó la expectativa exacta /login al nuevo /login?returnUrl=%2Fmi-perfil (primera regresión 96/97). No se debilita autenticación ni se omite el caso.

Un primer build encontró una llave sobrante al editar AuthController, corregida antes de suites ampliadas. Backend en serie/forks pasó 187/187; una repetición terminó con cierre inesperado de worker, 177 contabilizados y sin aserción fallida. La repetición aislada con pool threads pasó toda la suite sin errores no controlados. Se documenta la incidencia del entorno y el comando final, sin cambiar la configuración del proyecto.

### Riesgos, pendientes y cierre

Sin .env/secretos modificados ni mostrados. La protección de origen se basa en comparación exacta y rechazo ante ausencia para cookie/sesión; se contrastó con OWASP, y atributos de cookies con MDN (enlaces en 02). Debe probarse FRONTEND_URL/HTTPS/Set-Cookie/credenciales y políticas de terceros en Vercel/navegador real; aquí no se hicieron llamadas/escrituras externas ni ensayo visual manual del modal.

Pendiente importante de modelo: habilitado/activo y rechazo de una cuenta deshabilitada cuando exista esa funcionalidad aprobada. Sin revocación stateless: logout borra cookie pero una copia de JWT podría seguir válida hasta exp; no hay refresh tokens persistentes. Los timers son por pestaña, la estimación horaria es aproximada y el backend es autoridad. Cancelar un flujo no revierte un Set-Cookie ya emitido.

API/frontend deben integrarse juntos: el arranque necesita autorizar y metadatos nuevos. Clientes manuales de sesión requieren Origin/Referer permitido; no se introducen excepciones inseguras para facilitar tests. Cookies antiguas vencidas requieren login, no renovación tardía. No se declara comprobado un bloqueo de cuentas que el modelo no representa.

Revisión SHA-256 final: 26 archivos existentes modificados y 16 nuevos (42 en total), coincidentes con el inventario. Modelos/servicios de usuarios, publicaciones, comentarios, Cloudinary, dependencias y configuración de tests conservados respecto de 0d94da5. Se validaron enlaces/bloques Markdown y 44 IDs únicos; sin skip/todo/only. git diff --check termina sin errores; los avisos LF/CRLF responden a configuración existente, no a fallos de compilación.

El flujo local de sesión está listo para validación integrada del Sprint 3, sin considerarlo cerrado en producción: faltan navegador/base/Vercel/cookies/CORS y la decisión explícita de habilitación. Se detiene y espera aprobación. Sin commit, merge ni deploy automáticos.

---

## 2026-11-01 — Sprint 4, Tarea 5A: Administración de usuarios y roles

### Base y alcance

Se revisó feature/renovacion-sesion y sus 42 cambios de 4C; base 0d94da5. Antes de modificar, frontend compiló y pasó 138/138 y backend compiló y pasó 187/187. Conforme a autorización expresa del enunciado se creó el respaldo local **238c440 — feat(auth): autorizar y renovar sesiones de quince minutos** y después la rama **feature/administracion-usuarios**. Los cambios de 5A quedan sin commit; sin merge ni deploy. No se modifican .env, dependencias, módulos funcionales ni datos externos.

### Problema, ejemplo y decisiones

El secretario necesitaba gestionar fichas del club; un jugador no debe administrar el padrón y un socio suspendido no debe seguir entrando con su carnet anterior. Se agrega activo con compatibilidad de ausencia=true, endpoints administrativos y dashboard. Flujo: formulario/modal → servicio HTTP Angular → controller con guards → servicio Nest → consultas/actualización condicional de Usuario → mensajes y recarga.

Se comparte hashing con registro y persistencia sin duplicar negocio. El registro público siempre fuerza usuario/activo. DTO administrativo restringe perfil y campos; proyección positiva excluye credenciales. AuthGuard consulta MongoDB en cada acceso protegido: baja bloquea JWT anterior, login, autorizar y refrescar. Cookies/15 minutos/CSRF de 4C se conservan. Un fallo de base no se convierte en falso 401.

Política conservadora: no se puede deshabilitar a uno mismo ni a ninguna cuenta administradora; protege al último sin carreras de conteo, a costa de restringir bajas de administradores adicionales. Se puede rehabilitar un admin ya inactivo desde otro activo. No hay edición de rol ni bootstrap de cuentas reales. La baja no elimina publicaciones/comentarios, y al rehabilitar un token anterior aún vigente puede volver a funcionar. Una solicitud que ya pasó el guard puede completar.

Dashboard separado en TS/HTML/CSS, comentarios españoles incluidos estilos; reutiliza validadores de CineBera/registro, radios de rol y modal hijo con Input/Output. Cancelar no hace HTTP; estado de procesamiento evita duplicados. 400/409/500 conservan borrador; 403 no cierra una sesión válida. Se documentan los recorridos, permisos y conceptos en mapa/seguridad/administración/guía.

### Pruebas y dificultades resueltas

Resultado final: **frontend build exit 0, 162/162 en 22 suites; backend build exit 0, 223/223 en 12 suites**. Comandos completos en 08. Se conservan todos los casos anteriores; nuevos casos verifican permisos/altas/estados/JWT/DTO/modal/mensajes y esquema. Modelo de sesión de pruebas actualizado para la nueva consulta del guard. No se instalaron dependencias ni se relajó configuración.

La compilación detectó overrides del DTO que necesitaban declare; la integración detectó que había que exportar MongooseModule para inyectar UsuarioModel en guards de otros módulos. La primera suite ampliada tuvo 222/223: se aceptaba una clave sin número por redecoración incompleta de validadores heredados. Se corrigieron las reglas completas, manteniendo el caso, y pasó 223/223. No se omitieron pruebas.

### Archivos creados/modificados

- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.sesion.http.spec.ts`
- `backend/src/auth/guards/auth.guard.ts`
- `backend/src/auth/seguridad.module.ts`
- `backend/src/comentarios/comentarios.controller.http.spec.ts`
- `backend/src/common/password.ts`
- `backend/src/publicaciones/publicaciones.controller.http.spec.ts`
- `backend/src/testing/usuario-sesion.ts`
- `backend/src/usuarios/dto/crear-usuario-administrativo.dto.ts`
- `backend/src/usuarios/entities/usuario.entity.spec.ts`
- `backend/src/usuarios/entities/usuario.entity.ts`
- `backend/src/usuarios/guards/administrador.guard.ts`
- `backend/src/usuarios/usuarios.administracion.http.spec.ts`
- `backend/src/usuarios/usuarios.controller.http.spec.ts`
- `backend/src/usuarios/usuarios.controller.ts`
- `backend/src/usuarios/usuarios.service.spec.ts`
- `backend/src/usuarios/usuarios.service.ts`
- `docs/00-MAPA-DEL-PROYECTO.md`
- `docs/02-AUTENTICACION-Y-SEGURIDAD.md`
- `docs/05-ADMINISTRACION.md`
- `docs/08-PRUEBAS-Y-DESPLIEGUE.md`
- `docs/09-REQUISITOS-SPRINTS.md`
- `docs/10-BITACORA-DE-CAMBIOS.md`
- `docs/guia-angular.md`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/components/confirmacion-usuario/confirmacion-usuario.css`
- `frontend/src/app/components/confirmacion-usuario/confirmacion-usuario.html`
- `frontend/src/app/components/confirmacion-usuario/confirmacion-usuario.spec.ts`
- `frontend/src/app/components/confirmacion-usuario/confirmacion-usuario.ts`
- `frontend/src/app/components/navbar/navbar.html`
- `frontend/src/app/components/navbar/navbar.ts`
- `frontend/src/app/guards/administrador.guard.spec.ts`
- `frontend/src/app/guards/administrador.guard.ts`
- `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.css`
- `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.html`
- `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.spec.ts`
- `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.ts`
- `frontend/src/app/pages/login/login.sesion.spec.ts`
- `frontend/src/app/pages/login/login.ts`
- `frontend/src/app/pages/publicaciones/publicaciones.html`
- `frontend/src/app/pages/publicaciones/publicaciones.ts`
- `frontend/src/app/services/auth.ts`
- `frontend/src/app/services/usuarios.spec.ts`
- `frontend/src/app/services/usuarios.ts`
- `frontend/src/app/testing/usuarios-fixture.ts`

### Pendientes y criterio de entrega

No se verificaron Atlas, navegador/móvil real, índices ni cookies HTTPS/CORS de producción. Las pruebas HTTP usan persistencia simulada; Mongoose valida el esquema en memoria. El listado no pagina. La validación backend de fecha conserva ISO del DTO existente; la restricción de fecha futura está en el formulario. No se ha creado ni modificado ningún administrador real.

Sprint 4 restante: estadísticas con Desde/Hasta y MongoDB, gráficos, PWA, dos pipes adicionales y tres directivas propias. Revisión final SHA-256: 27 archivos existentes modificados y 18 nuevos (45 en total), coincidentes con el inventario. Sin cambios en lógica productiva de publicaciones/comentarios/Cloudinary, dependencias ni main.ts. La matriz conserva 44 IDs únicos; enlaces y bloques Markdown correctos; sin pruebas omitidas/exclusivas. git diff --check correcto; avisos LF/CRLF de la configuración existente. 5A queda implementada/verificada localmente con estos límites explícitos; no se declara cerrado el sprint. Se detiene para revisión y aprobación, sin commit de 5A/merge/deploy.

---

## 2026-11-01 — Sprint 4, Tarea 5B: Estadísticas y moderación administrativa

### Base y preservación

Rama inicial feature/administracion-usuarios, HEAD 238c440, con 45 cambios de 5A pendientes. Se revisaron status, matriz, administración y arquitectura; ambos builds exit 0, frontend 162/162 y backend 223/223. Por autorización expresa de 5B se respaldó 5A en **92a58e5 — feat(usuarios): administrar cuentas y verificar habilitacion** y después se creó **feature/estadisticas-admin**. 5B sin commit; sin merge/deploy. Sin cambios de .env, dependencias, configuración de tests ni datos externos.

### Problema y solución

La comisión del club necesitaba comparar publicaciones por jugador y comentarios en un período. Tres GET administrativos en controllers de módulos existentes y consultas de PublicacionesService/ComentariosService: match por creación/estado, group/sum, lookup de publicación, facet para total/días, count/sort/project y populate público de autores. No se descargan documentos para contar en Angular ni se crea otro módulo funcional.

Rango obligatorio YYYY-MM-DD, calendario real y Desde <= Hasta. Días completos en offset fijo UTC−03:00, inicio incluido y siguiente día de Hasta excluido; sin reglas históricas de horario de verano. A usa createdAt de publicación; B/C del comentario, aunque la publicación sea anterior. Bajas/huérfanos fuera; publicaciones antiguas sin activo visibles. Comentario no tiene baja independiente: no se añade estado ficticio. Una baja puede reducir cifras pasadas porque los reportes miden visibilidad actual.

Dashboard /dashboard/estadisticas: tres formularios/rangos propios, validación, carga/vacío/error/reintento, tablas y barras CSS/línea SVG/dona SVG. Sin dependencias nuevas. Geometría/fechas comentadas y TS/HTML/CSS separados. Angular calcula dimensiones/proporciones, no cantidades de documentos. La línea lleva a cero días sin actividad sin generar un elemento por día vacío.

Flujo: administradorGuard → DashboardEstadisticas → EstadisticasService GET con rango → controller AuthGuard/AdministradorGuard → servicio/agregación → MongoDB → cantidades → gráfico/tabla. Nest controla ficha habilitada/rol actual; sin credenciales/textos privados. Formularios reutilizan conceptos de validación cruzada de CineBera.

### Moderación reutilizada

DELETE /publicaciones/:id ya cumple autor/admin y baja lógica. Sin cambios productivos de moderación ni nuevo endpoint. El test integrado verifica baja admin ajena, conservación de documentos, retiro del feed, 404 detalle/comentarios y exclusión estadística. El caso Angular abre modal productivo como admin, cancela sin HTTP y confirma con recarga/mensaje. Se conservan casos 403/error. Aviso de ruta denegada ampliado para mencionar estadísticas.

### Archivos creados/modificados

- `backend/src/comentarios/comentarios.module.ts`
- `backend/src/comentarios/comentarios.service.ts`
- `backend/src/comentarios/estadisticas-comentarios.controller.ts`
- `backend/src/comentarios/estadisticas.http.spec.ts`
- `backend/src/common/estadisticas/rango-fechas.dto.ts`
- `backend/src/publicaciones/estadisticas-publicaciones.controller.ts`
- `backend/src/publicaciones/publicaciones.module.ts`
- `backend/src/publicaciones/publicaciones.service.ts`
- `backend/src/testing/agregacion-prueba.ts`
- `docs/00-MAPA-DEL-PROYECTO.md`
- `docs/05-ADMINISTRACION.md`
- `docs/06-ESTADISTICAS.md`
- `docs/08-PRUEBAS-Y-DESPLIEGUE.md`
- `docs/09-REQUISITOS-SPRINTS.md`
- `docs/10-BITACORA-DE-CAMBIOS.md`
- `docs/guia-angular.md`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/components/navbar/navbar.html`
- `frontend/src/app/guards/administrador.guard.spec.ts`
- `frontend/src/app/pages/dashboard-estadisticas/dashboard-estadisticas.css`
- `frontend/src/app/pages/dashboard-estadisticas/dashboard-estadisticas.html`
- `frontend/src/app/pages/dashboard-estadisticas/dashboard-estadisticas.spec.ts`
- `frontend/src/app/pages/dashboard-estadisticas/dashboard-estadisticas.ts`
- `frontend/src/app/pages/publicaciones/publicaciones-interacciones.spec.ts`
- `frontend/src/app/pages/publicaciones/publicaciones.html`
- `frontend/src/app/services/estadisticas.ts`

### Pruebas y dificultades

Antes: 162/162 Angular y 223/223 Nest, builds correctos. Después: **181/181 Angular (23 archivos), 265/265 Nest (13 archivos)** y ambos builds exit 0. Comandos en 08. Se agregan 42 casos backend y 19 frontend (15 dashboard, tres router, una baja admin). Se conservan anteriores, sin skip/only. Persistencia simulada/pipelines comprobados; sin Atlas ni llamadas externas.

Primer build backend detectó tipo de Model.populate incompatible con cantidad agregada: se explicitó forma de autor público/cantidad sin cambiar consulta. Primera suite Angular 180/180; se añadió línea a cero y su prueba (181/181 final). Backend completo 265/265; 42 focalizadas repetidas tras reforzar timezone. Sin fallos pendientes de las comprobaciones ejecutadas.

### Documentación y pendientes

Actualizados mapa, administración, estadísticas, pruebas, matriz, bitácora y guía con archivos/métodos/endpoints, ejemplos, flujo/permisos. Propuestas de auditoría en 06 separadas de estado actual. S4-06/07 y G-11/12 implementados localmente; S4-01 refuerza evidencia. Restan PWA, dos pipes y tres directivas adicionales.

Revisión final SHA-256: 16 archivos existentes modificados y 10 nuevos (26 total), con inventario coincidente. Métodos anteriores de PublicacionesService/ComentariosService conservados íntegramente; sin cambios en auth/usuarios/modelos/Cloudinary/dependencias/configuración. Matriz con 44 IDs únicos; enlaces/bloques Markdown correctos; sin skip/only/todo. git diff --check correcto; avisos LF/CRLF de configuración existente.

Pendientes navegador/móvil real, MongoDB/versiones, índices/planes, alto volumen y rangos largos: grupos sin paginar y duración sin límite agregado. El intérprete de tests no equivale a MongoDB. Pendientes cookies/HTTPS/CORS de producción de tareas previas. Sin escrituras externas/deploy. Se detiene para revisión y aprobación, sin commit de 5B ni merge.

---

## 2026-11-01 — Sprint 4, Tarea 5C: PWA, pipes y directivas Angular

### Base, rama y autorización

Inicio en feature/estadisticas-admin, HEAD 92a58e5 con 26 archivos de 5B sin confirmar. Se revisaron status, matriz y guía; frontend compiló y pasó 181/181, backend compiló y pasó 265/265. Según autorización expresa del enunciado, se respaldó 5B en **be005ec — feat(estadisticas): agregar reportes y verificar moderacion**, y se creó **feature/pwa-pipes-directivas**. Los cambios de 5C quedan sin commit, merge ni deploy. No se modifica backend, secretos ni módulos funcionales.

### Problema y ejemplo del club

La recepción del club necesita abrir su cartel sin red y presentar mejor autores/fechas, pero no debe guardar el padrón ni operaciones privadas en caché. Se configura PWA oficial de Angular con estáticos exclusivamente. Se completan exactamente tres pipes y tres directivas, usados en tarjeta, comentarios y navegación. TS/HTML/CSS separados y comentarios españoles en las decisiones importantes.

Se verificaron core 22.2.3 y CLI/build 22.2.4. Se justificó antes de instalar la única dependencia añadida: @angular/service-worker 22.2.3 exacto y compatible con core. Primer intento npm falló ENOTFOUND en red restringida; la repetición autorizada agregó un paquete. No se cambian versiones anteriores del lock ni se instala @angular/pwa u otras librerías.

### Implementación y recorrido

Manifest de FutbolCrack con descripción, es-AR, inicio/alcance '/', standalone y colores propios. Iconos originales FC/escudo/pelota: SVG, PNG 192/512 y maskable 512; PNG creados con System.Drawing disponible en Windows sin instalar librerías y revisados visualmente. Angular production genera worker/control desde ngsw-config; AppConfig registra solo fuera de desarrollo, cuando estable o al límite de 30 segundos, updateViaCache none.

Shell precargado: index/JS/CSS/chunks/manifest/favicon/iconos. dataGroups vacío, sin URLs externas/dinámicas. Se excluyen auth/usuarios/publicaciones/comentarios/estadísticas; navegación offline solo raíz/login/registro. No fallback en publicaciones (ruta compartida con nombre de API), mi-perfil o dashboards. Tras fallo de autorización, App muestra marca, limitaciones y Reintentar sin montar pantallas privadas. No altera cookies/JWT/interceptor ni agrega colas/IndexedDB/localStorage para datos. Volver a conectar ejecuta autorización real.

TruncatePipe se conserva con defensa ante valores/límites inválidos. FechaRelativaPipe transforma ISO/Date a minutos/horas/días, puro y sin timer; datetime/title guardan el ISO exacto. InicialesPipe usa primera/última palabra y fallback FC sin foto. Ambos se usan en PublicacionCard y ComentariosPublicacion, ya compartidos por feed/detalle/perfil.

ResaltarAutorDirective recibe la comparación autor/usuario y agrega clase; CSS comentado dibuja borde musgo. AutoFocusDirective enfoca el textarea tras afterNextRender al editar, sin búsqueda global/timer. PermisoRolDirective usa input/effect y TemplateRef/ViewContainerRef para enlaces administrativos del Navbar, reaccionando a rol/activo/logout sin duplicar vistas. Es visual: Nest mantiene todos sus permisos y guards.

Los datos siguen viajando Angular → HTTP/Nest → MongoDB como antes; pipes/directivas solo actúan sobre presentación y el worker solo sobre archivos estáticos. Offline no se presenta un éxito de publicación/comentario. Los ejemplos/recorridos de estudio se adaptan de CineBera sin patrones innecesarios ni rediseñar pantallas.

### Archivos creados/modificados

- `docs/00-MAPA-DEL-PROYECTO.md`
- `docs/07-ANGULAR-PWA-PIPES-DIRECTIVAS.md`
- `docs/08-PRUEBAS-Y-DESPLIEGUE.md`
- `docs/09-REQUISITOS-SPRINTS.md`
- `docs/10-BITACORA-DE-CAMBIOS.md`
- `docs/guia-angular.md`
- `frontend/angular.json`
- `frontend/ngsw-config.json`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/public/icons/futbolcrack.svg`
- `frontend/public/icons/icon-192.png`
- `frontend/public/icons/icon-512.png`
- `frontend/public/icons/icon-maskable-512.png`
- `frontend/public/manifest.webmanifest`
- `frontend/scripts/pwa.test.mjs`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.html`
- `frontend/src/app/app.sesion.spec.ts`
- `frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.css`
- `frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.html`
- `frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.spec.ts`
- `frontend/src/app/components/comentarios-publicacion/comentarios-publicacion.ts`
- `frontend/src/app/components/navbar/navbar.html`
- `frontend/src/app/components/navbar/navbar.ts`
- `frontend/src/app/components/publicacion-card/publicacion-card.html`
- `frontend/src/app/components/publicacion-card/publicacion-card.spec.ts`
- `frontend/src/app/components/publicacion-card/publicacion-card.ts`
- `frontend/src/app/directives/auto-focus.directive.ts`
- `frontend/src/app/directives/directivas.spec.ts`
- `frontend/src/app/directives/permiso-rol.directive.ts`
- `frontend/src/app/directives/resaltar-autor.directive.ts`
- `frontend/src/app/pipes/fecha-relativa.pipe.spec.ts`
- `frontend/src/app/pipes/fecha-relativa.pipe.ts`
- `frontend/src/app/pipes/iniciales.pipe.spec.ts`
- `frontend/src/app/pipes/iniciales.pipe.ts`
- `frontend/src/app/pipes/truncate.pipe.spec.ts`
- `frontend/src/app/pipes/truncate.pipe.ts`
- `frontend/src/index.html`

### Pruebas y dificultades resueltas

Resultado final: **Angular build exit 0; 230/230 en 26 archivos; PWA configuración/artefactos 11/11; backend build exit 0 y 265/265 en 13 archivos**. Comandos y detalle en 08. Sin pruebas eliminadas/omitidas. Se agregan 49 casos Angular y 11 Node; se conservan 181 anteriores.

La primera regresión dio 180/181: la tarjeta esperaba fecha absoluta visible. Como 5C exige formato relativo, se actualizó a reloj fijo/'Ayer', conservando comprobación ISO exacta en datetime/title. No se debilitaron las verificaciones de fecha. Primera verificación PWA 10/11: navigationUrls con ^ era tratado como ruta relativa por el generador y rompía fallback de raíz. Se corrigieron patrones de configuración; el mismo caso verifica ahora las rutas ancladas generadas.

Las pruebas Node usan manifest/iconos reales, hashes del build y generador oficial con archivos señuelo de API. Garantizan exclusión en la configuración, no ejecución runtime del Service Worker. Angular prueba valores inválidos, directivas/DOM, cambios de usuario, uso real y shell/reintento. Las suites de autenticación siguen pasando con HTTP simulado y worker desactivado, por lo que no se confunden con una prueba de cookies en navegador con worker activo.

### Documentación, advertencias y cierre

Actualizados mapa, PWA/pipes/directivas, pruebas, matriz, bitácora y guía. Queda explicada la diferencia entre transformar un valor, modificar un elemento y cachear recursos; se documentan archivos/clases/métodos y recorrido de instalación. Antecedentes en 07 separados del estado vigente.

S4-09/10 implementados/verificados localmente; S4-08 configurado y verificado por artefactos, pendiente instalación/activación/offline/actualización y auth con worker real. No se declaran cerrados integralmente los cuatro sprints: faltan aceptación externa, navegador/móvil, Atlas/Cloudinary/HTTPS/CORS y contraste con enunciados completos. La caché puede ser desalojada; primera carga necesita red; enlaces directos excluidos no tienen fallback offline. Fechas relativas no son reloj en vivo. Worker/core deben actualizarse juntos.

Revisión final SHA-256: 24 archivos existentes modificados y 15 nuevos (39 total), con inventario coincidente. Backend y secretos íntegros; sin cambios de configuración de tests. Lock: solo @angular/service-worker nuevo, ninguna versión previa alterada. Conteo de código: exactamente tres @Pipe y tres @Directive. Matriz con 44 IDs únicos, enlaces/bloques Markdown correctos y ningún skip/only/todo. git diff --check correcto; avisos LF/CRLF de la configuración existente.

Sin ensayo de instalación ni runtime PWA en navegador, sin despliegue ni escrituras externas. Se detiene para revisión y aprobación; sin commit de 5C, merge o deploy.

---

## 2026-11-01 — Tarea 5D: Auditoría final, integración y preparación de entrega

### Base y conservación

Inicio en **main 7f327ec**, árbol limpio. A diferencia del cierre anterior, el usuario ya había confirmado 5C en **1ca14cb** y la había integrado mediante 7f327ec. Se repitieron builds/suites: Angular 230/230, Nest 265/265 y PWA 11/11, todo correcto. No había cambios de 5C por respaldar, por lo que no se creó commit vacío ni duplicado. Se creó **test/auditoria-final** desde esa base; cambios 5D quedan sin commit. Sin merge ni deploy de esta auditoría.

### Alcance y dictamen

Revisados los 44 IDs contra fuente y pruebas reales: **39 Cumple, 4 Parcial, 0 No cumple y 1 No verificado**. Cumple significa criterio local comprobado, no integración de producción certificada. Parciales: S2-02 upload real, S4-04 política que impide baja de todos los admins, S4-08 PWA runtime, G-14 cierre integral. G-15 es histórico de Tarea 0: la primera documentación versionada aparece agrupada con modificaciones posteriores; no hay checkpoint exclusivo que permita certificar retrospectivamente todo el criterio. Esta limitación no se convierte en falla funcional actual.

La matriz de 44 no incluye Sprint 1; se contrastó el adjunto original y se recuperó docs/sprint-1.md faltante como reconstrucción del estado actual. Se inspeccionaron solo lectura factoría de formulario, registro/ngClass y PeliculaCard de CineBera: se documentan conceptos/adaptaciones verificables, no copia literal histórica. No se modificó el proyecto vecino.

### Problemas reproducidos y arreglos mínimos

1. Hash de clave larga: bcrypt acepta diferencias posteriores al byte 72, confirmado con claves sintéticas. generarHashPassword ahora rechaza UTF-8 >72 bytes antes de hash; DTO público máximo 64 caracteres y validator compartido de Angular con feedback coherente. Se conserva bcrypt costo 12, JWT/cookies/login y hashes previos. Dos regresiones fallaron antes; nuevas pruebas de ambas altas comprueban 400 y no guardado.
2. 401 de estadísticas: interceptor no las clasificaba como privadas. Tres regresiones fallaron antes; se añadió /estadisticas y se conserva sesión ante 403.
3. Campos obligatorios con espacios: registro público devolvía 500 al fallar trim/required de Mongoose. Tres casos lo reprodujeron. Transform trim antes de IsNotEmpty ahora responde 400 sin persistir y sin convertir tipos inválidos a texto.
4. Restos de demo: se retiraron dataset/tipo sin imports y avatar con apellido/dorsal ficticios; perfil sin foto usa escudo FC con prueba reforzada. Footer dice Red de futbolistas. Ningún registro real fue eliminado.

Como en la recepción del club, un dato inválido se explica antes de archivarlo y una credencial inválida no conserva un permiso visual. Flujo de los arreglos: formulario/validator Angular → DTO/helper Nest → persistencia solo si válido; errores 401 de reportes → interceptor → AuthService/Router. Sin módulos nuevos, dependencias ni refactors grandes.

### Integración real y límites

Solo lectura: API raíz/feed 200; me/usuarios/estadística sin sesión 401; OPTIONS localhost permitido con credenciales y origen ajeno sin allow-origin. Ping Atlas correcto con autoCreate/autoIndex desactivados; ping Cloudinary correcto. Se cargó configuración internamente, nunca se imprimieron secretos ni se consultaron usuarios para los pings. No hubo alta de cuentas, uploads, votos, comentarios, bajas ni cambios de índices/datos externos. Ping no se presenta como prueba de upload ni de estadísticas reales.

Servidor estático temporal intentado en restringido y autorizado, puerto 4200 escuchando, pero sonda/navegador no accedieron (timeout). No se alteraron firewall ni permisos para forzar acceso. Servidores temporales detenidos. Sin frontend de ensayo/administrador suministrados; FRONTEND_URL no está presente en configuración local (no implica ausencia en producción). Login/cookies/admin/reportes/PWA/móvil externos quedan en matriz manual M01–M18.

### Pruebas finales e incidencias

**Angular build exit 0; 236/236 en 26 archivos. Nest build exit 0; 275/275 en 14 archivos. PWA 11/11 tras último build.** Se agregaron seis casos Angular y diez backend; se reforzó el caso de avatar sin foto. Ninguna prueba previa eliminada, omitida ni debilitada. Sin cambios de configuraciones de test ni timeouts.

Una ejecución concurrente Angular tuvo 218/236: timeout inicial de navegación y errores derivados de petición pendiente/limpieza de TestBed. Aislada 6/6 y repetición completa 236/236 sin builds concurrentes; se conserva evidencia del intento fallido, sin aumentar límites. Los fallos de regresión de claves/espacios/interceptor fueron causales, se arreglaron en producción y pasaron. Detalle y comandos en 08/11.

### Archivos creados/modificados/retirados

- `backend/src/common/password.spec.ts`
- `backend/src/common/password.ts`
- `backend/src/usuarios/dto/create-usuario.dto.ts`
- `backend/src/usuarios/usuarios.administracion.http.spec.ts`
- `docs/00-MAPA-DEL-PROYECTO.md`
- `docs/02-AUTENTICACION-Y-SEGURIDAD.md`
- `docs/05-ADMINISTRACION.md`
- `docs/07-ANGULAR-PWA-PIPES-DIRECTIVAS.md`
- `docs/08-PRUEBAS-Y-DESPLIEGUE.md`
- `docs/09-REQUISITOS-SPRINTS.md`
- `docs/10-BITACORA-DE-CAMBIOS.md`
- `docs/11-AUDITORIA-FINAL.md`
- `docs/12-GUIA-DE-DEMOSTRACION.md`
- `docs/guia-angular.md`
- `docs/sprint-1.md`
- `frontend/public/images/jugador-demo.svg`
- `frontend/src/app/app.html`
- `frontend/src/app/data/publicaciones-demo.ts`
- `frontend/src/app/forms/registro-form.spec.ts`
- `frontend/src/app/forms/registro-form.ts`
- `frontend/src/app/interceptors/sesion.interceptor.spec.ts`
- `frontend/src/app/interceptors/sesion.interceptor.ts`
- `frontend/src/app/models/publicacion.ts`
- `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.ts`
- `frontend/src/app/pages/mi-perfil/mi-perfil.html`
- `frontend/src/app/pages/mi-perfil/mi-perfil.spec.ts`
- `frontend/src/app/pages/registro/registro.html`
- `frontend/src/app/pages/registro/registro.spec.ts`
- `frontend/src/app/pages/registro/registro.ts`
- `frontend/src/app/validators/registro.validators.ts`

### Documentación y entrega

11 contiene resumen, matriz, niveles I/L/A/R, seguridad, pruebas y M01–M18; 12 describe pantallas/acciones/conceptos para defensa; sprint-1 recupera documentación faltante. Actualizados mapa, seguridad, administración, PWA, pruebas, requisitos, guía y bitácora. Riesgos se distinguen de fallos confirmados: cuentas históricas truncadas, tokens stateless tras logout, cookies de terceros, archivo huérfano tras fallo de guardado y rendimiento de reportes no se presentan como ataques observados.

Revisión final SHA-256: 26 archivos existentes modificados/retirados y cuatro nuevos (30 total), inventario coincidente. Tres retirados son demos/tipo heredado, no datos reales. Sin cambios en dependencias, secretos ni configuración de tests. 09 y 11 contienen los mismos 44 IDs únicos y estados 39/4/0/1; enlaces/bloques Markdown correctos, pruebas citadas existentes, sin skip/only/todo y con tres pipes/tres directivas. git diff --check correcto; avisos LF/CRLF de configuración existente.

Preparado para revisión/local y ensayo con cuentas de prueba, **no cerrado para aceptación integrada de los cuatro sprints**. Faltan la matriz manual, PWA navegador, upload real y decisión de política S4-04. No se agregaron funciones ajenas. Se detiene y espera aprobación, sin commit 5D/merge/deploy.

---

## Plantilla para la próxima tarea

### AAAA-MM-DD — Número y título

- **Objetivo y requisito:** problema a resolver, IDs de la matriz y alcance autorizado.
- **Ejemplo real:** qué hace un jugador/club/administrador y qué resultado espera.
- **Rama y base:** nombre profesional, commit inicial y estado de cambios previos.
- **Archivos creados/modificados:** rutas y responsabilidades; no incluir secretos.
- **Recorrido de datos:** componente → servicio Angular → endpoint/controller → service Nest → modelo/consulta MongoDB → respuesta.
- **Decisiones técnicas:** reutilización, compatibilidad con registros existentes, alternativas y justificación sencilla.
- **Validaciones y permisos:** reglas en UI/backend, identidad/autor/rol/estado y casos rechazados.
- **Mensajes y accesibilidad:** carga, vacío, éxito/error, confirmación de bajas y uso de teclado.
- **Conceptos utilizados:** bindings, Input/Output, forms, DTO, referencias, paginación u otros realmente implementados.
- **Pruebas:** comando, entorno, resultado exacto, casos manuales, regresión y limitaciones.
- **Documentación actualizada:** mapa, matriz y documentos temáticos afectados.
- **Problemas y pendientes:** sin esconder fallos ni marcar como probado lo que no se ejecutó.
- **Criterio de cierre:** compila, respeta sprint, valida, informa, no rompe lo existente y tiene evidencia/documentación.
- **Entrega y aprobación:** resumen revisable; no hacer merge/deploy sin autorización.

## Tarea 5E — 2026-11-01 — Integración real y cierre documentado

Rama test/integracion-final desde respaldo autorizado 725c03e de 5D. Preservadas fuentes, pruebas y configuración originales por comparación SHA-256. Builds correctos; Angular 236/236, Nest 275/275, PWA 11/11. Sin dependencias, commit 5E, merge ni deploy.

Agregado `backend/scripts/integracion-qa.mjs`: herramienta aislada opt-in, Nest/Atlas/Cloudinary reales, cuentas sintéticas y limpieza limitada. Dos fallos de fixtures/consulta resueltos sin cambiar producto: nombre mayor de 20 caracteres y filtro ObjectId. Segunda pasada 13/14; M09 repetido realmente y aprobado. No se eliminó ni debilitó ninguna prueba existente. Mejorada reserva de nombres de la herramienta: ante colisión inicial no puede limpiar cuentas previas. Syntax check correcto; no se reejecutaron escrituras externas solo por formateo/documentación.

Creado docs/13 y evidencias saneadas (JSON original, observaciones suplementarias y capturas); actualizados 00/08/09/10/11/12. S2-02 pasa a Cumple con upload real API/navegador y lectura 200: matriz 40 Cumple, 3 Parcial, 1 No verificado. El resto no cambia de estado. Flujos locales integrados y permisos comprobados; aún faltan instalación/update/cache PWA, cookies cross-site, reloj JWT natural, responsive de otros anchos y decisión S4-04. Limpieza autorizada de ambos namespaces terminada y credenciales eliminadas. Detalle de datos, pruebas y riesgos en 13. No listo para aceptación integral; detenerse y esperar aprobación.

## Tarea 5F — 2026-11-01 — Aceptación final condicionada

Rama test/aceptacion-final desde respaldo 5E 6a66fc9. Usuario eligió permitir baja de otro administrador, preparar propuesta HTTPS e instalar PWA local. Cambios mínimos en UsuariosService (transacción, actor actual, último activo, ObjectId normalizado) y dashboard de usuarios (permite otro administrador y explica política); modal/guards/rehabilitación existentes reutilizados. Pruebas actualizadas/agregadas, sin deshabilitar ni debilitar. Nuevo ejecutor opt-in aceptacion-admin-qa.mjs verifica contención real y restaura solo cuentas propias.

Validación final: builds correctos, Angular 237/237, Nest 278/278, PWA 11/11; dos ensayos HTTP reales 14/14; cuatro escenarios administrativos incluyendo cinco carreras reales. JWT con reloj natural, renovación/expiración/recarga; PWA Edge instalada, worker/update/caché después de logout y shell offline/vuelta online; cuatro anchos efectivos, detalle/comentario y rutas fallback/atrás. Errores de herramientas/fixtures y timeout transitorio documentados sin ocultarlos.

Actualizados 00/02/05/07/08/09/10/13; creado 14 y evidencias-5f. Matriz vigente 42 Cumple, 1 Parcial (G-14), 1 No verificado (G-15). Propuesta HTTPS separada en 14 sin ejecutar; pendiente autorización, además de revisión manual residual. No merge/push/deploy ni commit de 5F. Cierre y limpieza propios registrados en 14.

## Preparación QA HTTPS — 2026-11-01

Usuario aprobó resultados 5F y autorizó preparar configuración antes de deploy. Se conserva test/aceptacion-final y todo el trabajo pendiente de 5F, sin commit. Creados docs/15-CONFIGURACION-QA-HTTPS.md y plantillas inertes docs/qa-https/: proyectos y dominios previstos, target QA, variables sin secretos, cookies existentes, CORS efectivo con localhost, CSRF, Atlas con credencial QA limitada propuesta, prefijo Cloudinary lógico y cierre. Se revisó historia c8383c9 para G-15; no hay evidencia nueva suficiente para cambiarlo. Matriz sin cambios 42/1/0/1. Validación de sintaxis/huellas local; sin cambios funcionales, recursos externos, instalación, push, merge ni deploy. Ejecución pendiente de aprobación de configuración y titular Vercel.
