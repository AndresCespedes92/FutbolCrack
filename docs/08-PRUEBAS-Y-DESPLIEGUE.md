# 08 — Pruebas y despliegue

## Estado actual — Sprint 2, Tarea 3B

Rama feature/publicaciones-likes-paginacion, creada desde feature/publicaciones-modelo en 7b740f4 (commit existente «fix publicaciones»). El árbol estaba limpio y 3A ya estaba confirmado por el usuario: no se creó un commit vacío de respaldo. No se realizaron commits nuevos, merge ni deploy.

| Verificación | Antes (3A) | Después (3B) |
| --- | --- | --- |
| frontend: npm run build | Salida 0 | Salida 0 |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 32/32, 4 suites | 35/35, 5 suites |
| backend: npm run build | Salida 0 | Salida 0 |
| backend: npm test | 59/59, 6 suites | 95/95, 6 suites |

Advertencia existente: publicaciones.css pesa 4,88 KB, presupuesto 4 KB, excedente 877 bytes. No se modificaron CSS ni presupuestos. Las suites completas se ejecutaron fuera del sandbox para evitar las limitaciones temporales/procesos del entorno; no se instalaron dependencias.

Se agregaron 36 casos HTTP backend (10 de likes y 26 de listado) y 3 de servicio Angular. Los casos previos se mantienen; las expectativas antiguas de array se adaptan al nuevo sobre paginado. Schema agrega comprobaciones de likes sin cambiar su número de casos.

Cobertura nueva: identidad JWT frente a body ajeno; usuario ausente; add/remove propio; duplicado/conflicto; ocho altas concurrentes (una 201 y siete 409); votos de distintos usuarios; publicaciones inactivas/inexistentes; 10/10/3 de 23; offsets posteriores; filtro antes de página/total; límites 3 y 100; fecha/likes y desempates; sesión opcional sin exponer votantes; documento antiguo sin likes; 17 variantes de query inválida. Angular comprueba HttpParams, cookies y endpoints sin identidad en body; las suites de feed conservan creación, imágenes y errores.

Las pruebas HTTP usan controller, DTO, guards, JWT y servicio reales con MongoDB/usuarios/transporte Cloudinary simulados. El doble de aggregate interpreta los filtros, cómputos y etapas de esta consulta; además se verifican los operadores y selección pública enviados. La prueba concurrente verifica la intención atómica y el contrato local, no la concurrencia real de MongoDB ni sus planes de ejecución. No se conectó Atlas, Cloudinary real o Vercel ni se modificaron datos externos.

Para completar aceptación externa: en una base de ensayo crear 23 publicaciones de dos autores, pedir offsets 0/10/20, filtros y empates; enviar ocho likes simultáneos con el mismo JWT y comprobar un solo ObjectId; quitarlo y comprobar los demás votos. Usar tokens válidos: el TTL previo de 20 segundos se conserva. Verificar frontend/API conjuntamente porque GET dejó de devolver array. Estas comprobaciones están pendientes y no autorizan despliegue.

Sin variables nuevas, secretos ni .env modificados. Detalles del contrato y límites de arrays/offset en [03](03-PUBLICACIONES.md).

## Historial — Sprint 2, Tarea 3A

Rama feature/publicaciones-modelo, base limpia c8383c9. Las tareas anteriores ya estaban confirmadas: no había cambios para un commit de respaldo y no se creó uno vacío. No se hicieron commits de esta tarea, merge o deploy.

| Comando                                                               | Resultado final                                                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| frontend: npm run build                                               | Correcto; aviso del CSS del feed: 4,88 KB frente a 4 KB, excedente 877 bytes. No se cambió el presupuesto.                  |
| frontend: node node_modules/@angular/cli/bin/ng.js test --watch=false | 32/32 aprobadas, 4 suites. Las 20 anteriores permanecen y se agregan 12.                                                    |
| backend: npm run build                                                | Correcto, salida 0, incluida repetición después del ajuste de límite de archivo.                                            |
| backend: npm test                                                     | 59/59 aprobadas, 6 suites. Incluye 43 HTTP publicaciones, 2 schema, 3 Cloudinary y las 11 anteriores de usuarios/seguridad. |

No se omitieron pruebas. Los 18 casos HTTP de creación de Tarea 2 se adaptaron al nuevo contrato obligatorio; los tipos incorrectos y vacíos se siguen comprobando con el otro campo válido. La prueba de propiedad adicional usa una propiedad realmente ajena, porque titulo ya es parte del contrato.

### Ajustes encontrados al verificar

El primer intento Nest pasó 55 de 56; el archivo de 5 MiB + 1 byte era rechazado con 400 por el pipe, pero la prueba esperaba 413. Se inspeccionó la versión instalada de Multer: su límite ya es inclusivo. Se corrigió limits.fileSize a 5 MiB y se mantuvo máximo + 1 solamente en MaxFileSizeValidator, que compara estrictamente con `<`. La prueba exacta de 5 MiB pasa y el exceso devuelve 413 antes de subir.

También se reemplazó validateSync en los tests nuevos por validate asíncrono para evitar la deprecación de Mongoose. Un fallo de Cloudinary se simula con la excepción controlada que ya emite el adaptador. La ejecución final no dejó esos avisos/errores simulados en la salida; solo persiste el presupuesto CSS del frontend.

### Qué se prueba sin servicios externos

- Controllers, AuthGuard, DTO, validación real de firma del archivo y servicio de publicaciones mediante HTTP local. Solo datos/guardado MongoDB, usuarios y transporte Cloudinary se simulan.
- Campos nuevos, alias contenido, activo true, títulos/descripcion vacíos o de tipos incorrectos, límites de texto y autor desde JWT.
- PNG/JPEG/WebP, archivo disfrazado, GIF rechazado, 5 MiB exactos y exceso, sin imagen y fallo de subida sin guardar.
- Baja del autor y del administrador actual, rechazo de tercero aunque su JWT viejo diga admin, usuario inexistente, id inválido, 404 por ausencia/ya retirada/carrera y conservación del documento.
- Filtro público activo != false y adaptación de respuesta antigua sin mutar los documentos de prueba.
- Schema Mongoose real validado en memoria y adaptador Cloudinary con stream simulado: default perfiles y carpeta publicaciones.
- Angular envía FormData, no elige autor, bloquea doble envío, limpia solo tras éxito, conserva datos ante 400/413/500 y muestra documentos nuevos/antiguos. No hay acción de baja en UI.

Las pruebas de consultas usan modelos simulados; no demuestran la ejecución del filtro en un Atlas real. No se subieron ni dieron de baja publicaciones reales. Sigue pendiente un ciclo de ensayo con Atlas/Cloudinary/Vercel y publicación coordinada de frontend/backend. La duración JWT no se cambió.

Variables necesarias: CONNECTION_STRING, JWT_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET y FRONTEND_URL; NODE_ENV, PORT y VERCEL siguen condicionando el arranque/cookies como antes. No se agregaron variables ni se leyeron sus valores.

Las secciones siguientes conservan resultados históricos de Tareas 0, 1 y 2. El contrato y los resultados actuales son los de esta sección y 03.

## Estado actual — Tarea 2: seguridad y DTO, 31/10/2026

Rama `fix/seguridad-validaciones`, creada desde el estado de `test/recuperar-pruebas`. Los tests recuperados y los 11 documentos previos se conservaron sin commit ni descarte. No se instalaron dependencias ni se cambió configuración JWT/cookies.

| Comprobación ejecutada                                                  | Resultado final                                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| frontend: `npm run build`                                               | Correcto, salida 0. Misma advertencia: publicaciones.css 4,68 KB frente a 4 KB, excedente 678 bytes. |
| frontend: `node node_modules/@angular/cli/bin/ng.js test --watch=false` | **20/20 aprobadas**, 3 suites. Ningún archivo del frontend se modificó en Tarea 2.                   |
| backend: `npm run build`                                                | Correcto, salida 0, sin advertencias en la salida.                                                   |
| backend: `npm test`                                                     | **29/29 aprobadas**, 4 suites. Incluye las 2 pruebas recuperadas sin cambios y 27 nuevas.            |

Las suites se ejecutaron fuera del aislamiento por los problemas de temporales ya registrados. No se amplió ningún timeout ni se cambió la configuración de tests. No se levantó el AppModule productivo ni se conectó Atlas/Cloudinary.

### Qué cubren las nuevas pruebas

- `usuarios/usuarios.controller.http.spec.ts`: 8 casos HTTP locales. Usa AuthGuard y AdministradorGuard reales y JWT firmados con una clave exclusiva de prueba. UsuariosService es un doble para no consultar el padrón real. Comprueba 401 sin sesión o con JWT inválido, 403 para rol común, 200 para administrador, rol libre ignorado, rol retirado, usuario inexistente y acceso por cookie existente.
- `usuarios/usuarios.service.spec.ts`: 1 caso usa findAll real con un modelo simulado; verifica selección positiva de campos y select:false de passwordHash. No afirma que se haya ejecutado la consulta contra MongoDB.
- `publicaciones/publicaciones.controller.http.spec.ts`: 18 casos usan controller, DTO, ValidationPipe con las opciones actuales de main.ts y PublicacionesService reales. Solo el modelo/save se simula. Comprueba 401, creación 201, recorte, autor desde JWT, límites, saltos internos, cuerpos vacíos/tipos incorrectos/propiedades ajenas y rechazo sin guardado.

En total, 2 pruebas anteriores + 8 + 1 + 18 = 29. El contrato Angular POST `{ contenido }` se mantuvo y la regresión frontend sigue en 20/20. No se usaron claves reales ni se modificaron cookies productivas; los JWT de prueba no son sesiones del sistema publicado.

### Límites de esta verificación

Las pruebas son integración HTTP de la aplicación de test y pruebas unitarias de consulta, no e2e contra Atlas. Antes de desplegar corresponde comprobar un administrador y un usuario de una base de ensayo y las variables/cookies del entorno real. No se creó un administrador desde registro público ni se cambiaron roles reales. Persisten los pendientes de auditoría fuera de este alcance, incluida la duración de 20 segundos y la advertencia CSS.

Las secciones de Tarea 1 y auditoría que siguen conservan sus resultados históricos; este es el estado actual de las suites.

## Estado actual — Tarea 1: recuperar pruebas, 31/10/2026

Rama `test/recuperar-pruebas`, creada explícitamente desde `docs/auditoria-inicial`. Se conservaron los 11 documentos de auditoría que estaban sin seguimiento de Git, sin crear commits. Solo se editaron tres archivos spec y los documentos 00, 08, 09 y 10; producción y dependencias permanecen iguales.

### Antes y después

| Comprobación                                                           | Antes, Tarea 0                   | Después, Tarea 1                                                                                         |
| ---------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Frontend `npm run build`                                               | Correcto, con advertencia de CSS | Correcto, código 0. Misma advertencia: publicaciones.css 4,68 KB, presupuesto 4 KB, excedente 678 bytes. |
| Frontend `node node_modules/@angular/cli/bin/ng.js test --watch=false` | 14 aprobadas y 3 fallidas, de 17 | **20 aprobadas de 20, 3 suites aprobadas.**                                                              |
| Backend `npm run build`                                                | Correcto                         | Correcto, código 0, sin advertencias en la salida.                                                       |
| Backend `npm test`                                                     | 1 fallida de 1 por UsuarioModel  | **2 aprobadas de 2, 1 suite aprobada**, en ejecución final aislada.                                      |

Las suites se ejecutaron fuera del aislamiento por los errores de temporales ya identificados. En el primer intento de esta tarea, Nest se ejecutó junto a las compilaciones y Angular: la delegación pasó, pero el primer beforeEach excedió su límite de 10 segundos. Se repitió la misma suite de forma aislada y pasó en 1,73 segundos (150 ms de pruebas). No se aumentó el timeout, no se cambió configuración ni se atribuyó el resultado a un error productivo. La causa exacta del timeout transitorio no quedó demostrada; el contexto de ejecución concurrente queda registrado.

### Causa de cada fallo anterior y solución

| Prueba anterior                                              | Por qué fallaba                                                                                                                      | Comprobación actual, sin debilitar el contrato                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| app.spec: campos de registro y envío deshabilitado           | Buscaba «No se crea una cuenta», aviso retirado al integrar el registro.                                                             | Se conservan nueve campos, accept de imágenes y botón deshabilitado con formulario vacío. Se comprueban resumen actual e inicio neutro; el envío válido se ejercita en la suite de registro.                                                                                                                                                     |
| app.spec: tarjetas compartidas entre feed y perfil           | Esperaba cuatro demos en un feed que ahora consulta la API y usa artículos propios. También esperaba datos del CV estático retirado. | Se entregan tres publicaciones de API simuladas y se verifica cantidad, contenidos, autores, fallback de autor ausente e imagen. El perfil recibe un usuario simulado distinto de Mateo; se comprueban sus datos personales y las dos tarjetas demo claramente identificadas. No se oculta que el material sigue sin estar asociado a la cuenta. |
| registro.spec: envío siempre deshabilitado con datos válidos | jugador10 no cumple la regla de mayúscula y la creación de cuentas dejó de estar deshabilitada permanentemente.                      | Se usa Jugador10, se comprueba habilitación, POST y todos los campos de FormData (incluida imagen), bloqueo durante envío, ausencia de duplicado y éxito después de la respuesta.                                                                                                                                                                |
| UsuariosController: should be defined                        | Construía UsuariosService real, que necesita UsuarioModel no provisto en RootTestModule.                                             | useValue entrega un doble de UsuariosService; overrideGuard aísla JWT solo en esta suite. Se conserva la creación y se agrega delegación exacta de findAll y su retorno.                                                                                                                                                                         |

Se mantuvieron las 17 pruebas Angular existentes, actualizando sus expectativas; se agregaron 3: 401 en navegación a perfil, registro inválido sin HTTP y error 409 con posibilidad de reintento. Nest conserva su prueba de creación y agrega la de delegación. No se borró, deshabilitó ni marcó skip/todo ninguna prueba.

### Cómo funciona el aislamiento

En Angular, provideHttpClient conserva el servicio y provideHttpClientTesting cambia únicamente el transporte de la prueba. HttpTestingController.expectOne comprueba la solicitud; flush entrega una respuesta simulada. verify, en afterEach, detecta solicitudes inesperadas o pendientes. Se responde al guard de MiPerfil antes de esperar la navegación, y luego a la segunda consulta de ngOnInit. El guard real de Angular no fue reemplazado.

En Nest, el controller recibe un objeto con findAll simulado. El guard se reemplaza solo dentro del módulo de test porque esta suite unitaria no intenta validar JWT. La prueba no demuestra que el endpoint esté restringido a administradores ni comprueba MongoDB. Se cierra el módulo al terminar cada caso.

Como analogía: probamos que la recepción entrega la ficha correcta a la oficina, usando un mensajero de prueba. No hace falta abrir el archivo real de socios ni inscribir a un jugador para comprobar esa comunicación.

### Alcance y pendientes

No se detectó un error productivo nuevo que hubiera que corregir para recuperar estas pruebas. Siguen los hallazgos de auditoría: JWT de 20 segundos, falta de autorización administrativa, DTO de publicaciones pendiente, material demo en perfil y advertencia CSS. Las pruebas con HTTP simulado no acreditan integración contra Atlas/Cloudinary/Vercel ni reemplazan e2e.

La documentación siguiente conserva los comandos, fallos y limitaciones de **Tarea 0 como historial**, no como resultado actual de las suites.

## Qué se hizo en esta auditoría

Fecha: 31/10/2026. Node `v24.15.0`, npm `12.0.2`. Las dependencias ya estaban instaladas. No se ejecutó npm install, no se cambió configuración y no se instalaron paquetes. No se abrió ni publicó el contenido de archivos .env. La existencia de `backend/.env` no confirma que sus valores sean correctos ni que estén disponibles en Vercel.

Las compilaciones generan archivos ignorados en dist y cachés; no cambian el comportamiento de las fuentes. Los únicos cambios versionables de esta tarea están en docs/. No se realizó merge, commit ni deploy.

## Comandos ejecutados y resultados

| Directorio | Comando                                                                              | Resultado comprobado                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raíz       | `node --version`, `npm --version`, `git branch --show-current`, `git status --short` | Entorno anterior; origen main limpio; rama documental creada.                                                                                                                                            |
| frontend   | `npm run build`                                                                      | Código de salida 0; bundle generado en dist/frontend. Advertencia: publicaciones.css 4,68 KB frente a presupuesto de aviso 4 KB, excedente 678 bytes.                                                    |
| backend    | `npm run build`                                                                      | Código de salida 0; nest build generó dist/main.js.                                                                                                                                                      |
| frontend   | `node node_modules/@angular/cli/bin/ng.js test --watch=false`                        | Primer intento restringido: errores ENOENT en temporales y una expectativa fallida de tarjetas. Repetido fuera del aislamiento: **17 pruebas, 14 aprobadas y 3 fallidas**, 2 suites fallidas/1 aprobada. |
| backend    | `npm test`                                                                           | Primer intento restringido: EPERM al renombrar un temporal, sin pruebas ejecutadas. Repetido fuera del aislamiento: **1 prueba, 1 fallida** por dependencia UsuarioModel ausente.                        |
| Raíz       | `git diff --check` y revisión de cambios                                             | Correcto: solo docs/ nuevo, sin diferencias en frontend/backend; 11 documentos, enlaces locales y bloques de código comprobados; 44 IDs únicos en la matriz.                                             |

Se repitieron las pruebas con permiso de ejecución fuera del aislamiento para separar fallos del entorno y del código. No se alteraron los tests para obtener estos resultados. Los 17 tests aprobados que figuraban en entregas anteriores no describen la revisión actual.

## Fallos y cobertura real

| Archivo de prueba                                  | Evidencia y motivo                                                                                                                                                                                                                     | Trabajo posterior sugerido                                                                                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/app/app.spec.ts`                     | Espera el aviso «No se crea una cuenta», eliminado al integrar registro. Espera cuatro app-publicacion-card en el feed, que ahora usa artículos con datos API.                                                                         | Actualizar expectativas al contrato real; simular HTTP y sesión; comprobar carga, errores y resultados sin depender del backend remoto.                                   |
| `frontend/src/app/pages/registro/registro.spec.ts` | La prueba de envío deshabilitado usa jugador10, que ya no cumple la regla de mayúscula. El formulario es inválido y la afirmación de validez falla; el envío permanente deshabilitado también dejó de ser el comportamiento requerido. | Datos válidos para las reglas actuales, respuesta HTTP simulada, estado enviando y casos de éxito/error.                                                                  |
| `frontend/src/app/forms/registro-form.spec.ts`     | 6 pruebas aprobadas en la ejecución final.                                                                                                                                                                                             | Ampliar casos de nueva regla de clave y equivalencia de validaciones con DTO, sin confundir aprobación de reglas locales con registro externo.                            |
| `backend/src/usuarios/usuarios.controller.spec.ts` | Nest no puede resolver UsuarioModel al construir UsuariosService real sin un modelo/proveedor en RootTestModule.                                                                                                                       | Prueba aislada del controller con doble de UsuariosService; o proveedor de modelo simulado si se prueba el service. No conectar la base productiva para resolver el test. |

La suite Angular de registro visual pasó 5 de 6; app.spec.ts pasó 3 de 5. No se encontraron suites de integración de auth, publicaciones o Cloudinary ni archivos e2e de backend. Existe el script/config test:e2e, pero su existencia no demuestra cobertura y no se ejecutó. No se hicieron pruebas manuales con cuentas reales ni pruebas de escritura deliberadas contra producción.

## Comandos reales para trabajar después

Desde frontend: `npm start`, `npm run build` y el comando CLI de test anterior. Usar CLI directo evita los problemas de reenvío de --watch observados con npm 12.

Desde backend: `npm run start:dev` carga .env explícitamente con node --env-file y abre watch; `npm run build`, `npm test`, `npm run test:e2e` y `npm run lint` existen en package.json. No se ejecutó start:dev porque iniciaría conexiones externas; tampoco lint ni format (format modifica archivos).

`start:prod` apunta a node dist/main. Con package.json type module y salida main.js, conviene verificar ese comando concreto antes de darlo por válido: la compilación no lo ejecuta. No se cambió el script. `npm run deploy` existe pero no se ejecutó ni se autoriza con esta auditoría.

## Variables de entorno referenciadas por el código

Solo se documentan **nombres**, nunca valores:

| Nombre                | Para qué se consulta                                |
| --------------------- | --------------------------------------------------- |
| CONNECTION_STRING     | Conexión Mongoose a MongoDB.                        |
| JWT_SECRET            | Firma/verificación JWT.                             |
| CLOUDINARY_CLOUD_NAME | Configuración de imágenes.                          |
| CLOUDINARY_API_KEY    | Configuración de imágenes.                          |
| CLOUDINARY_API_SECRET | Configuración de imágenes.                          |
| FRONTEND_URL          | Lista de orígenes CORS y middleware de origen.      |
| NODE_ENV              | Opciones Secure y SameSite de cookie.               |
| PORT                  | Arranque HTTP local.                                |
| VERCEL                | Selección entre handler exportado y listener local. |

Las URLs de API Angular están escritas en services/auth.ts y services/publicaciones.ts; no se encontró configuración de ambientes/API base del frontend. Sus comentarios todavía las llaman locales, aunque apuntan a Vercel. No se tocaron esas URLs.

ConfigModule.forRoot carga variables, pero SeguridadModule lee JWT_SECRET al evaluar JwtModule.register. Debe comprobarse el orden efectivo de carga al usar cada comando; start:dev precarga .env y el entorno de Vercel debería proveer variables antes de evaluar módulos. **No verificado**: no se arrancó el servidor ni se leyó el archivo para comprobarlo.

## Catálogo HTTP existente

Base configurada en Angular: backend Vercel con prefijos auth y publicaciones; dirección local prevista por main.ts: localhost:3000. No hay prefijo global /api en las fuentes.

| Método y ruta               | Acceso y cuerpo                                                                | Respuesta esperada por código                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| GET `/`                     | Público                                                                        | Texto de saludo; no prueba salud de Atlas/Cloudinary.                                                                     |
| POST `/auth/registro`       | Público; multipart/FormData con datos de CreateUsuarioDto e imagen opcional    | Mensaje y usuario sin hash; duplicados 409; validaciones 400; imagen/servicio externo requieren comprobar errores reales. |
| POST `/auth/login`          | Público; identificador y password                                              | 200, mensaje y Set-Cookie HttpOnly; credenciales incorrectas 401.                                                         |
| GET `/auth/me`              | AuthGuard; cookie o Bearer                                                     | Datos personales propios; JWT inválido/vencido 401; usuario inexistente 404.                                              |
| POST `/auth/logout`         | Sin AuthGuard; middleware de origen                                            | 200 y clearCookie.                                                                                                        |
| GET `/usuarios`             | AuthGuard + AdministradorGuard, rol actual desde MongoDB                       | Array con selección positiva de campos sin credenciales; exclusivo para administrador.                                    |
| GET `/publicaciones`        | Público                                                                        | Array de hasta 50, más recientes primero; autor con campos públicos por populate.                                         |
| POST `/publicaciones`       | AuthGuard; titulo, descripcion e imagen opcional multipart (o JSON sin imagen) | 201 con campos nuevos y alias contenido; 400 validación, 401 sesión, 413 exceso y 500 fallo de servicio.                  |
| DELETE `/publicaciones/:id` | AuthGuard; autor o administrador actual según UsuariosService                  | 200 mensaje; 400 id inválido, 401 sesión/usuario, 403 ajeno y 404 ausente/ya retirada. No borra documento.                |

No existen POST autorizar/refrescar, detalle por id, comentarios, likes o estadísticas. DELETE de baja lógica sí existe desde 3A. Las rutas similares de otros documentos son propuestas, no deben probarse como si estuvieran desplegadas.

## Vercel: evidencia y límites

- backend/src/main.ts exporta un handler por defecto y reutiliza una instancia inicializada; si no está VERCEL, escucha un puerto local.
- Configura ValidationPipe y CORS en ambas inicializaciones.
- No se encontró vercel.json ni configuración .vercel versionada. Esto no prueba por sí solo que un despliegue sea inválido: la configuración también puede estar en el proveedor. Ese panel y los logs son **No verificado**.
- Frontend compila con base href /; angular.json copia public y produce dist/frontend/browser. Se debe comprobar la carpeta de salida y el fallback de rutas SPA del proyecto Vercel.
- Revisar que variables del backend existan en el entorno correcto, que FRONTEND_URL coincida con el frontend real y que HTTPS/cookies funcionen entre los dominios concretos. No alcanza con compilar ni con ver una URL en el código.
- La conectividad, índices y datos de Atlas, la cuenta de Cloudinary y la disponibilidad del backend publicado no se verificaron. No se efectuó deploy.

## Pruebas manuales pendientes, con entorno aislado

1. Crear usuario de prueba y avatar; comprobar documento sin password en claro, URL de imagen y respuesta sin hash.
2. Intentar duplicado y confirmar un 409 con mensaje; comprobar si quedó una imagen huérfana.
3. Login válido/incorrecto; inspeccionar atributos de cookie sin copiar su valor a la documentación.
4. Consultar me de inmediato y después de 20 segundos; comprobar 401/redirección en la operación correspondiente.
5. Publicar texto válido, vacío, espacios, >2000 y contenido de tipo incorrecto; comprobar respuesta, autor y persistencia.
6. Probar logout y petición privada posterior. No confundir cookie borrada con revocación de una copia del token.
7. Revisar acceso de usuario común a usuarios, política de Origin ausente y casos 400/401/403/409/500.
8. Recargar rutas SPA, revisar ancho de 360/768/1280px, foco y mensajes, incluido el aria-describedby que referencia aviso-registro sin elemento con ese id.

Los futuros casos de paginación, permisos, comentarios, reportes y PWA figuran en sus documentos y en la matriz. Conceptos: prueba unitaria frente a integración/e2e, doble de dependencia, compilación frente a comportamiento, configuración por entorno y evidencia reproducible.
