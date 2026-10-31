# 03 — Publicaciones

## Qué resuelve hoy

Un jugador puede escribir un entrenamiento o experiencia y enviarlo al feed. El código obtiene el autor desde la sesión, guarda el texto en MongoDB y vuelve a consultar el listado. No hay título, likes operativos, comentarios ni carga de imagen de publicación.

| Etapa        | Archivo y método real                                                           | Datos que maneja                                            |
| ------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Formulario   | `frontend/src/app/pages/publicaciones/publicaciones.ts`, Publicaciones.publicar | contenidoControl, trim, publicando y mensajePublicacion.    |
| Transporte   | `frontend/src/app/services/publicaciones.ts`, crear/listar                      | POST con cookie y GET público, contra URL Vercel fija.      |
| Controller   | `backend/src/publicaciones/publicaciones.controller.ts`, crear/listar           | CreatePublicacionDto; autorId desde request.user.sub.       |
| Negocio      | `backend/src/publicaciones/publicaciones.service.ts`, crear/listar              | Texto 1–2000 y ObjectId; guardar; find/populate/sort/limit. |
| Persistencia | `backend/src/publicaciones/entities/publicacion.entity.ts`                      | Publicacion, colección publicaciones, timestamps.           |

Ejemplo real de recorrido: Angular manda `{ contenido: 'Hoy entrené pases cortos' }`; AuthGuard identifica al jugador; el servicio crea el documento con multimediaUrl vacío y tipoMultimedia ninguno; `.save()` persiste; Angular limpia el textarea y pide nuevamente GET publicaciones.

## Listado actual y tarjeta reutilizable

El listado usa `.find().populate('autorId', 'nombre apellido nombreUsuario imagenPerfil').sort({ createdAt: -1 }).limit(50).exec()`. La respuesta es un array sin total ni metadatos de paginación. No usa skip, offset ni parámetros de orden/usuario.

El feed recorre los datos reales mediante @for pero dibuja `<article class="feed-post">` en `publicaciones.html`. PublicacionCard existe con @Input requerido y sin @Output, pero está conectada a la interface de demo de `models/publicacion.ts` y se usa en MiPerfil. La interface API está declarada por separado en `services/publicaciones.ts`; ambas se llaman Publicacion y tienen campos diferentes.

El template del feed puede mostrar una multimediaUrl de tipo imagen, pero el endpoint de creación nunca la carga ni recibe una imagen. Esto es presentación parcial, no una funcionalidad de subida terminada. CloudinaryService se usa hoy para avatares, en la carpeta de perfiles.

## Validaciones, permisos y mensajes encontrados

- Angular valida requerido y máximo 2000. Publicar comprueba trim y evita solicitudes duplicadas desde la pantalla.
- POST tiene AuthGuard. El cliente no elige autorId; se toma del JWT.
- El servicio rechaza vacío, texto mayor de 2000 y ObjectId mal formado.
- CreatePublicacionDto reemplaza la interface: el ValidationPipe global existente valida tipos, vacío y máximo 2000. Transform recorta solo strings; no convierte números u objetos. Los bodies incorrectos producen 400 antes de guardar. La clase aporta los metadatos necesarios para el pipe, según la [documentación de Nest](https://docs.nestjs.com/techniques/validation).
- Un contenido formado solo por espacios puede retornar sin un mensaje visible: el control required no lo considera vacío, aunque publicar sí lo rechaza al hacer trim.
- Ante 401 se navega al login; ante error de conexión o servidor se muestra un texto. En éxito se recarga el feed sin notificación explícita de éxito.
- Persisten console.log de depuración que incluyen el contenido a publicar. Se propone revisarlos después; no se eliminaron.

## Cambios necesarios para Sprint 2 y requisitos generales

Todo lo siguiente es **propuesta**, no implementación:

1. Ampliar el DTO básico de contenido con título y descripción/contenido e imagen cuando se autorice esa parte del enunciado. Acordar una única traducción entre descripción del TP y contenido actual para evitar duplicados de negocio. Contemplar registros existentes sin título antes de hacer cambios obligatorios.
2. Reutilizar CloudinaryModule para imágenes de publicaciones, separando claramente avatar y publicación. Validar archivo en el servidor; definir errores y qué hacer si se sube un archivo pero falla MongoDB.
3. Agregar paginación real. Propuesta: GET `/publicaciones?offset=0&limit=10&orden=fecha` devuelve items, total, offset y limit. El backend valida enteros, rangos y orden permitido; aplica skip/limit y countDocuments con los mismos filtros. El feed usa siempre 10 por página; el perfil podrá solicitar limit 3.
4. Agregar filtro autorId validado. El usuario autenticado del perfil viene del backend; no debe confundirse con los ids numéricos de demo.
5. Mostrar páginas numeradas a partir de total y limit, con página actual, acceso a varias páginas, vacío y error; anterior/siguiente pueden acompañar, pero no reemplazar los números.
6. Permitir orden por fecha y por cantidad de likes. Usar desempate estable por _id y reiniciar offset al cambiar orden/filtro.
7. Adaptar PublicacionCard al contrato real, conservando Input y agregando Outputs para comunicar solicitudes de acción al padre. El padre coordina servicio y mensajes; no duplicar llamadas en cada tarjeta.
8. Diseñar like/quitar like autenticados, sin duplicados. Una alternativa a evaluar es guardar ids con `$addToSet` y quitar con `$pull`; el conteo debe ser coherente y resistir solicitudes simultáneas. No hay campos ni endpoints actuales de likes.
9. Incorporar baja lógica y permisos autor o administrador. Definir estado y filtrado consistente, contemplando documentos existentes que no tienen ese campo. No usar borrado físico donde el TP pide baja lógica.
10. Antes de la solicitud de baja, abrir un modal propio que identifique la publicación y ofrezca Cancelar/Confirmar. Cancelar no envía HTTP. Confirmar espera el resultado y muestra éxito/error; también revisa permisos en Nest.
11. El perfil debe consultar las últimas tres publicaciones reales del usuario y sus comentarios. Los contadores y demos actuales no cumplen ese punto.
12. Usar TruncatePipe para textos largos y alternar Ver más/Ver menos. Se lo contabiliza como el primero de los tres pipes del Sprint 4; no crear otro truncador en paralelo.

## Ejemplo de aceptación de paginación

Con 23 publicaciones habilitadas: página 1 usa offset 0 y limit 10; página 2, offset 10; página 3, offset 20 y muestra 3 registros. Deben verse los accesos 1, 2 y 3. total debe corresponder al filtro y no a toda la colección. Probar cambios de orden, filtros, offsets inválidos y que una baja no deje un número de página imposible. No sirve descargar 50 y recortar el array en Angular.

## Plan de pruebas

En una base aislada, crear fixtures de al menos 23 publicaciones y dos autores. Comprobar persistencia/autor, rechazo de body inválido, imagen y duplicados de envío; luego páginas 10/10/3, orden por fecha/likes con empates, filtro autor, like repetido/concurrente, baja del autor, baja admin, rechazo de tercero, cancelar sin solicitud, éxito/error visible y últimas tres del perfil. Para TruncatePipe probar texto nulo, corto y largo, y expandir/contraer desde la tarjeta.

Tarea 1 recuperó las pruebas Angular; Tarea 2 agregó HTTP local para la creación de texto con DTO y servicio reales, sin almacenamiento externo. Los casos futuros de paginación, likes, imágenes y bajas siguen pendientes. Los resultados ejecutados están en [08](08-PRUEBAS-Y-DESPLIEGUE.md). Conceptos: Input/Output, formularios reactivos, Observable/subscribe, controller/service, DTO, referencias, populate, sort, skip/limit, count y autorización.

## Tarea 2 — DTO del contrato actual

Archivo nuevo: `backend/src/publicaciones/dto/create-publicacion.dto.ts`, clase CreatePublicacionDto. PublicacionesController.crear la usa en @Body. No se agregó título, imagen ni otro campo y no se modificó PublicacionesService ni el frontend.

Reglas:

1. Transform aplica trim únicamente si el valor ya es string, igual que la normalización actual del servicio.
2. IsString rechaza números, booleanos, arrays, objetos y null.
3. IsNotEmpty rechaza ausencia, vacío y texto que quedó vacío después de trim.
4. MaxLength(2000) controla el máximo; el servicio conserva su límite String.length y ObjectId como defensa de negocio, incluidos casos Unicode.
5. Las opciones whitelist y forbidNonWhitelisted ya presentes en main.ts rechazan propiedades ajenas al DTO. Un autorId o título enviado adicionalmente da 400; el autor sigue saliendo del JWT.

Ejemplo del club: el parte «Hoy entrenamos pases» se acepta; un parte vacío o cuyo texto sea un objeto no pasa la revisión de la ficha y no llega al guardado.

Las pruebas HTTP verifican 201 para texto válido de 1/2000 caracteres, espacios externos y saltos internos; 400 para ausencia, vacío, espacios, null, número, booleano, array, objeto, longitud excesiva y campos adicionales. También verifican 401 sin sesión, autor del JWT y multimedia vacía como antes. Se conserva el límite previo de String.length cuando un emoji ocupa dos unidades UTF-16; no se amplió la longitud efectiva de la API.

Los 18 casos usan controller, DTO, ValidationPipe y PublicacionesService reales y un modelo de guardado simulado. La prueba confirma contrato/validación/normalización y que no se invoca save ante rechazo; no comprueba persistencia en Atlas. Todos los campos que Angular envía siguen siendo aceptados; sus 20 pruebas recuperadas se ejecutan como regresión.
