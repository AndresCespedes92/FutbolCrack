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
