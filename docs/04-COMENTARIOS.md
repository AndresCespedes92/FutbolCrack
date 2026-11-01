# 04 — Comentarios

## Estado vigente — Sprint 3, Tarea 4A

Se implementó el backend solicitado: ComentariosModule, modelo, DTO, controller y servicio. Angular y la duración JWT permanecen sin cambios. La propuesta histórica de PATCH/editado al final de este documento queda reemplazada por **PUT /comentarios/:id** y **modificado**, según la consigna 4A recibida.

## Problema y ejemplo del club

Lucía comenta «Excelente pase al espacio» en una jugada de Mateo. El sistema debe recordar la jugada, quién escribió y el texto, sin copiar toda la ficha de Lucía. Mateo y otros visitantes pueden leer la nota; solamente Lucía puede corregirla, incluso si otro socio es administrador. Al corregir, se conserva la fecha original y se registra que fue modificada.

## Modelo y relaciones

Colección `comentarios`, clase Comentario en `backend/src/comentarios/entities/comentario.entity.ts`:

| Campo | Implementación |
| --- | --- |
| _id | ObjectId automático de Mongoose. |
| publicacionId | ObjectId obligatorio, ref Publicacion, inmutable. |
| autorId | ObjectId obligatorio, ref Usuario, inmutable. |
| texto | String obligatorio, trim, máximo 1000 unidades UTF-16. |
| modificado | Boolean, inicialmente false. Solo una edición aceptada lo marca true. |
| createdAt / updatedAt | Timestamps automáticos de Mongoose, fechas guardadas como instantes UTC. |

Un usuario puede escribir muchos comentarios y una publicación puede recibir muchos. Cada comentario conserva dos referencias, no un nombre/foto duplicados. No tiene estado de baja ni endpoint de eliminación porque no se solicitó. La baja lógica de una publicación conserva sus comentarios almacenados, pero los endpoints dejan de permitir leerlos/crearlos/editarlos mientras la publicación esté inactiva.

El máximo 1000 es una decisión técnica local para respuestas breves de club, no una cifra atribuida al TP oficial. Después de trim se acepta de 1 a 1000 por String.length, igual que la política final de publicaciones. Un emoji fuera del plano básico puede ocupar dos unidades UTF-16: la defensa del servicio y el maxlength del schema controlan también ese límite. No se convierte un número/objeto a texto.

Se declara el índice `{ publicacionId: 1, createdAt: -1, _id: -1 }` para filtrar/ordenar. Su creación y uso real se deben verificar en el entorno MongoDB; declarar un índice no prueba un plan de ejecución en Atlas.

## Archivos y responsabilidades

| Archivo en backend/src/ | Qué hace |
| --- | --- |
| comentarios/comentarios.module.ts | Registra el modelo y reúne controller/service; importa SeguridadModule, UsuariosModule y PublicacionesModule existentes. |
| comentarios/comentarios.controller.ts | Rutas GET/POST anidadas en publicación y PUT por id de comentario; pasa sub verificado al servicio. |
| comentarios/comentarios.service.ts | crear, listar y editar; valida identidad, publicación activa, autoría y prepara respuestas públicas. |
| comentarios/entities/comentario.entity.ts | Schema, referencias, límites, timestamps e índice. |
| comentarios/comentarios.constants.ts | Máximo de texto, página predeterminada 3 y máximo técnico 100. |
| comentarios/dto/crear-comentario.dto.ts | Transform de trim solo para strings y validadores de texto. |
| comentarios/dto/editar-comentario.dto.ts | Hereda las validaciones del alta: PUT exige texto, no usa PartialType. |
| comentarios/dto/listar-comentarios.dto.ts | Enteros offset/limit, valores predeterminados y límites. |
| common/validation/entero-query.ts | Conversión estricta reutilizada en comentarios y listado de publicaciones. |
| publicaciones/publicaciones.module.ts | Exporta su MongooseModule para reutilizar el mismo modelo registrado, sin copiar schema. |
| app.module.ts | Incorpora el único módulo funcional nuevo autorizado: ComentariosModule. |

ValidationPipe global existente aplica whitelist y forbidNonWhitelisted: autorId, publicacionId, modificado y fechas no son propiedades aceptadas del body. Los ids se obtienen del JWT y la URL. Los DTO no reemplazan las reglas de autorización del servicio.

## Endpoints y ejemplos

Los ejemplos utilizan ids ilustrativos. En un cliente HTTP autenticado enviar la cookie `token` existente o Authorization Bearer válido. No copiar tokens a documentación.

### Crear: POST /publicaciones/:publicacionId/comentarios

Requiere AuthGuard. Body JSON:

```json
{ "texto": "Excelente pase al espacio" }
```

El servicio valida id de publicación, sujeto del JWT y existencia del usuario actual; exige publicación activa y guarda referencias, texto recortado y modificado false. Mongoose asigna id/fechas. No se permite elegir otro autor ni fijar timestamps desde el cliente.

Respuesta **201** (fechas/id de ejemplo):

```json
{
  "mensaje": "Comentario creado correctamente",
  "comentario": {
    "_id": "000000000000000000000101",
    "publicacionId": "000000000000000000000011",
    "autorId": { "_id": "000000000000000000000001", "nombre": "Lucía", "apellido": "Torres", "imagenPerfil": "/lucia.png" },
    "texto": "Excelente pase al espacio",
    "modificado": false,
    "createdAt": "2026-10-31T12:00:00.000Z",
    "updatedAt": "2026-10-31T12:00:00.000Z"
  }
}
```

### Listar: GET /publicaciones/:publicacionId/comentarios?offset=0&limit=3

La lectura es pública, coherente con el feed. Antes de consultar comentarios se comprueba que la publicación exista y tenga activo distinto de false. Los documentos antiguos sin activo (o null) se mantienen visibles como en 3A/3B; no se migran ni se reescriben.

Respuesta **200**:

```json
{ "comentarios": [], "total": 0, "offset": 0, "limit": 3, "hayMas": false }
```

Con registros, comentarios contiene objetos con la misma estructura pública que el ejemplo del alta. total cuenta todos los comentarios de esa publicación; hayMas compara offset + cantidad recibida con total. Offset posterior al final devuelve array vacío conservando total.

`listar` envía un pipeline a MongoDB: match por publicación → sort por createdAt descendente y _id descendente → facet con skip/limit/proyección y count del total. Ordenar por id desempata fechas iguales. La edición cambia updatedAt, no createdAt, por lo que no convierte una nota vieja en la más reciente.

Limit predeterminado 3, mínimo 1 y máximo técnico 100. Offset predeterminado 0, no negativo y entero seguro. La conversión solo admite enteros decimales canónicos: se rechazan vacíos, fracciones, notación exponencial, arrays, NaN, signos y propiedades ajenas con 400. No se descarga todo para paginar en memoria.

Ejemplo: ocho notas de la jugada se piden con offset 0/3/6 y limit 3; las respuestas son 3/3/2 y total 8. En la futura UI, «Ver más comentarios» deberá anexar los nuevos al array existente (mostrar 3/6/8), no reemplazarlo. El backend no conserva un cursor entre solicitudes; nuevas inserciones pueden desplazar páginas offset y requerir deduplicación/reinicio en Angular.

### Editar: PUT /comentarios/:id

Requiere AuthGuard y body `{ "texto": "Corregí: el pase fue con zurda" }`. El servicio:

1. Valida el id y que el usuario autenticado siga existiendo.
2. Busca el comentario; si falta devuelve 404.
3. Compara autorId almacenado con sub verificado. Si son distintos responde 403, sin excepciones de administrador ni confianza en un rol/body del cliente.
4. Comprueba la publicación activa; si está ausente/inactiva responde 404.
5. Ejecuta findOneAndUpdate condicionado por id, autorId y publicacionId, con `$set` de texto y modificado true, new y runValidators. Las referencias son además inmutables en el schema.
6. Devuelve **200** con `{ mensaje: "Comentario editado correctamente", comentario: ... }`. La respuesta conserva createdAt, cambia updatedAt y trae modificado true.

Si desaparece el comentario entre lectura y escritura se responde 404, sin éxito falso. Un PUT aceptado con el mismo texto también marca modificado true: significa que se aceptó una solicitud de edición, no que se compararon versiones distintas. Angular usará esa marca persistida para mostrar «Editado» en una tarea posterior.

## Populate y seguridad de respuestas

presentar construye una lista positiva de campos públicos del comentario en alta/listado/edición. Luego `comentarioModel.populate(publicos, { path: 'autorId', select: 'nombre apellido imagenPerfil' })` resuelve la referencia de usuario solo para esos comentarios. Incluye _id implícitamente y no devuelve correo, rol, contraseña o hash; tampoco expone campos internos como __v. Si el usuario referenciado ya no existe, autorId se devuelve null, sin inventar una identidad.

Populate no copia esos datos en la colección comentarios: en MongoDB permanece el ObjectId. Es similar a consultar la ficha del socio en recepción para mostrar su nombre junto a una nota. No se hacen populate de publicaciones ni se vuelcan fichas completas.

| HTTP | Cuándo |
| --- | --- |
| 201 | Alta válida. |
| 200 | Listado o edición propia válida. |
| 400 | Texto, propiedades, id o query inválidos. |
| 401 | Escritura sin token válido, token vencido/inválido, sujeto inválido o usuario eliminado. |
| 403 | Edición ajena, incluso si el solicitante es administrador. |
| 404 | Publicación inexistente/inactiva, comentario ausente o desaparecido antes del update. |

Los guards se ejecutan antes de pipes/controlador: sin sesión la escritura responde 401 aunque también tenga un body/id inválido. En edición ajena se verifica propiedad antes que el estado de la publicación; puede devolver 403 aun si luego se descubriría una baja. No se cambian reglas de cookies, JWT, likes o baja lógica.

## Cómo probar y conceptos para defender

Leer DTO → controller → service → schema ayuda a seguir el recorrido. Como en el club, el controller recibe la solicitud, el DTO revisa el formato, el servicio verifica carnet/autoría/jugada y Mongoose consulta o guarda fichas referenciadas. En 4A todavía no hay servicio ni pantalla Angular de comentarios; el recorrido completo UI → Nest → MongoDB queda pendiente de integración.

Las pruebas HTTP importan el ComentariosModule real con una conexión/modelos simulados, AuthGuard/JWT, DTO, ValidationPipe y servicio reales; verifican también la exportación del modelo de publicaciones. Casos: altas válidas/límites/vacíos/tipos/propiedades, tokens/cookie, usuario eliminado, publicación ausente/inactiva/antigua, 3/3/2, filtros/desempates, autor mínimo, propios/ajenos/admin, timestamps/modificado, queries e IDs malos. Cuatro casos adicionales validan schema Mongoose real en memoria. Comandos, cantidades y limitaciones en [08](08-PRUEBAS-Y-DESPLIEGUE.md).

Conceptos: módulos e inyección, DTO y herencia, validaciones, autenticación frente a autorización, referencias ObjectId, timestamps, populate/proyección, agregación/facet, índice compuesto y paginación. No se agregaron dependencias, eliminación ni módulos adicionales.

## Límites y pendientes

La verificación de estado de la publicación y la escritura/lectura de comentarios son operaciones en documentos distintos, sin transacción. Se rechaza una publicación ya inactiva al comprobarla; una baja concurrente posterior a ese chequeo puede ocurrir antes de terminar la operación. Las consultas siguientes no muestran comentarios de una publicación ya retirada. No se promete atomicidad entre colecciones: garantizarla requeriría coordinar también la baja en otra tarea; no se alteró el comportamiento existente ni se introdujo una transacción parcial que aparentara resolverlo.

El conteo y página comparten pipeline/filtro; no hay una instantánea entre solicitudes offset. El sort/facet y límites de documento/memoria se deben evaluar si el volumen crece. Las pruebas usan dobles para la ejecución MongoDB y no comprueban índices, escrituras/timestamps reales, carreras entre colecciones ni servicios externos. Pendiente ensayo con base real y verificación de HTTP completo con middleware de origen/cookies/CORS.

Angular sigue sin interfaz de comentarios: faltan formulario, servicio/tipos, carga inicial tres y «Ver más» con anexado, edición solo propia, etiqueta Editado, mensajes/carga/error y conexión con perfil/detalle. La duración de sesión continúa en 20 segundos como antes; no se implementaron autorizar/refrescar ni renovación.

---

## Historial de la auditoría — propuesta anterior, no contrato vigente

El material siguiente conserva el análisis original. Las decisiones aprobadas en 4A y descritas arriba reemplazan nombres/rutas/límites propuestos.

## Estado comprobado en la auditoría (histórico)

No hay controller, service, schema, DTO, endpoint ni servicio Angular de comentarios. La tarjeta de demostración muestra un número `publicacion.comentarios`; ese número es ficticio y no representa documentos ni relaciones. Una publicación demo con tipo Comentario es un post del feed, no un comentario vinculado a otro post.

Por lo tanto, los comentarios del Sprint 3 están **pendientes**. La forma exacta de la consigna oficial completa no se recibió; se usa el resumen del adjunto y los requisitos generales entregados en esta tarea.

## Problema y ejemplo

Si Lucía comenta una jugada de Mateo, el sistema debe guardar qué escribió, en qué publicación y quién lo escribió. Mateo puede leerlo, pero no editarlo en nombre de Lucía. Si Lucía lo corrige, se debe indicar Editado. No alcanza con ocultar un botón en Angular: Nest tiene que comprobar la propiedad.

## Reutilización y ubicación propuesta

| Responsabilidad    | Reutilizar                                                    | Ubicación propuesta, aún inexistente                                                                                                |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Acceso autenticado | SeguridadModule y AuthGuard de Nest, servicio de auth Angular | Módulo/componente de comentarios que pida el TP; candidato `backend/src/comentarios/` y `frontend/src/app/components/comentarios/`. |
| Relaciones         | ObjectId y schemas registrados por MongooseModule             | Comentario con publicacionId → Publicacion y autorId → Usuario.                                                                     |
| Reglas             | ValidationPipe y patrón DTO de usuarios                       | DTO de creación/edición con texto requerido, trim y longitud acordada con el enunciado.                                             |
| HTTP               | HttpClient y withCredentials actuales                         | Servicio de comentarios Angular, sin mezclar persistencia con la tarjeta.                                                           |
| Comunicación       | PublicacionCard adaptable                                     | Input con publicación e identidad; Output para acciones al padre cuando corresponda.                                                |
| Mensajes y modales | Estados cargando/error y controles ya usados                  | Reutilizar un único modal propio de confirmación para futuras eliminaciones, si el enunciado las pide.                              |

La longitud máxima de comentario y la posibilidad de baja no están detalladas en el material recibido: **No verificado**. No se agregan reglas de negocio inventadas como si fueran oficiales.

## Flujo propuesto Angular → Nest → MongoDB

1. El padre solicita inicialmente 3 comentarios para la publicación seleccionada.
2. GET propuesto `/publicaciones/:publicacionId/comentarios?offset=0&limit=3` valida id y parámetros y comprueba que la publicación sea visible.
3. El service filtra por publicacionId, ordena `{ createdAt: -1, _id: -1 }`, aplica skip/limit y devuelve items y total/hasMore coherentes.
4. Angular muestra los más recientes primero. Al pulsar Ver más comentarios solicita offset 3, después 6, etc., con limit 3.
5. Los nuevos resultados se anexan a los existentes, no reemplazan el array. Deshabilitar la carga mientras está pendiente y evitar duplicar ids si la lista cambia entre solicitudes.
6. POST propuesto sobre la misma ruta toma autorId exclusivamente del JWT, valida el texto y guarda las dos referencias.
7. PATCH propuesto `/comentarios/:id` autentica, carga el documento y compara autorId con request.user.sub. Solo su autor puede editar. El permiso del administrador para bajar publicaciones no implica permiso para editar comentarios ajenos.
8. La edición actualiza el texto e indicador persistente de edición. Angular muestra la etiqueta Editado después de la respuesta correcta. No basta con cambiar el DOM.
9. Ante error se conserva el texto para corregir o reintentar y se muestra un mensaje comprensible. Las operaciones exitosas también deben avisarse.

El campo propuesto editado, más timestamps, permite distinguir una modificación del contenido. No conviene inferir toda edición solo porque updatedAt cambió por otra operación. La decisión final de schema y nombres debe aprobarse antes de implementar.

## Paginación y cambios concurrentes

Con 8 comentarios, la secuencia debe verse 3 → 6 → 8; la última solicitud devuelve 2. Un orden estable por fecha/id reduce empates. Al usar offset, nuevas inserciones pueden desplazar páginas: documentar ese límite y definir actualización de la primera página/deduplicación sin sustituir la paginación del servidor por un recorte en cliente.

## Validaciones y criterios de aceptación

- Validar ids, texto, publicación existente/visible, identidad y autoría en Nest.
- No aceptar autorId arbitrario del body ni usar solo un id de Angular como permiso.
- Cargar 3 inicialmente y pedir otros 3 desde backend, conservando lo anterior.
- Mantener orden reciente primero; editar no debe convertir un comentario viejo en uno recién creado si el orden se define por createdAt.
- Mostrar Editado, éxito/error, vacío y carga; evitar doble clic.
- Si se incorpora eliminación, aplicar modal propio identificando el comentario, Cancelar/Confirmar, permiso backend y la política de baja del TP. No usar alert ni window.confirm.

## Pruebas pendientes

Base aislada con una publicación y 8 comentarios: verificar 3/3/2 y anexado, orden de fechas empatadas, ausencia de duplicados tras reintentar, crear con identidad correcta, editar propio con Editado, rechazar edición ajena aun llamando directamente a Nest, rechazar token vencido e ids inexistentes. Probar visualmente mensajes, accesibilidad y cancelación de cualquier baja futura.

Conceptos: relación entre colecciones, integridad de referencias, paginación, array y anexado, autoría, DTO, autenticación/autorización y comunicación entre componentes. No se implementó ninguno de estos endpoints en esta auditoría.

## Interfaz vigente — Sprint 3, Tarea 4B

El backend de 4A se conserva. Se implementó el consumo Angular de creación, listado paginado y edición propia, sin eliminación ni cambio de JWT. Las referencias anteriores a UI pendiente describen el estado de 4A y quedan actualizadas por esta sección.

### Responsabilidades y recorrido

ComentariosService (`frontend/src/app/services/comentarios.ts`) define tipos iguales a las respuestas reales: autor mínimo o null, comentario con texto/modificado/fechas, sobre de página y respuesta mensaje/comentario. listar envía offset y limit fijo 3; crear/editar envían solo `{ texto }` con withCredentials. El autor y la marca de edición continúan siendo decisiones del servidor.

ComentariosPublicacion recibe por Input publicacionId y usuario del padre; emite publicacionNoDisponible si el GET/POST indica 404. Es el contenedor reutilizable de la sección, con formularios, colección, estados y llamadas delegadas al servicio HTTP. Detalle y perfil no copian esa lógica. El padre obtiene la sesión una vez y la comparte; cada comentario no vuelve a pedir /auth/me.

Ejemplo del club: el padre entrega el número de la jugada y quién está mirando. La sección abre el cuaderno correspondiente (GET), muestra sus primeras tres notas y permite al socio agregar/corregir las propias. Nest vuelve a verificar JWT y autoría aunque Angular muestre un botón.

Flujo: ruta o perfil → Input publicacionId → ComentariosService → endpoint/controller Nest → DTO/guard/servicio 4A → MongoDB → respuesta tipada → colección/formularios Angular. La imagen/nombre se toman del autor poblado mínimo; autorId null muestra «Usuario no disponible», sin datos inventados.

### Crear y validar

nuevoForm es un FormGroup con texto requerido, patrón no solo espacios y maxlength 1000. Angular Validators.maxLength y el contador usan String.length/unidades UTF-16; 501 emojis de dos unidades superan el máximo. El textarea tiene maxlength y errores visibles/aria-invalid. Antes de enviar se recortan espacios externos; la UI limita también el borrador sin trim, pudiendo ser más estricta con espacios que luego descartaría el backend. Nest mantiene su validación independiente.

No hay formulario para visitante; aparece el enlace a login y se puede leer públicamente. Al enviar se bloquea la acción, se evita doble POST y el textarea queda de solo lectura mientras espera. Si falla, conserva lo escrito y explica 400/401/404/red/servidor; no usa alert ni window.confirm. Un 401 no renueva ni modifica sesión en esta tarea.

Tras 201 se muestra el mensaje del backend y se limpia el formulario. Se reinicia la colección a offset 0, solicitando solo los tres más recientes: una nota nueva desplaza los offsets y no se mezclan seis/nueve notas anteriores con páginas de una secuencia vieja. Si falla esa recarga, se mantiene el éxito confirmado y el error de lectura permite reintentar; no se repite automáticamente el POST.

### Cargar más y deduplicar

La primera consulta usa offset 0, limit 3; «Cargar más» solicita offset 3, luego 6, etc. Las filas se anexan a una Map por _id basada en lo ya visible, evitando duplicados. siguienteOffset avanza según **offset retornado + cantidad de registros recibidos**, no según cantidad de IDs únicos, porque una inserción externa puede desplazar una nota entre páginas.

Con ocho notas sin cambios, la pantalla muestra 3 → 6 → 8. Se respetan el orden reciente recibido del servidor y sus desempates; no se descarga toda la colección ni se ordena una descarga completa en Angular. La marca hayMas controla el botón; al terminar se informa «No hay más comentarios». Mientras carga se bloquean repeticiones. Un error de una página adicional conserva lo anterior y Reintentar pide el mismo offset.

El estado es local a cada instancia: los comentarios de la jugada A no se mezclan con los de B. Cambiar publicacionId cancela las suscripciones previas, reinicia formularios/colección/offset y pide los tres iniciales de la nueva jugada. takeUntilDestroyed cancela al salir de la vista; cancelar la suscripción no deshace una escritura que el servidor ya haya procesado.

### Editar propio

puedeEditar exige usuario autenticado y comentario.autorId._id igual a usuario.id; no hay excepción de administrador. iniciarEdicion carga el texto real en edicionForm. Se puede Guardar cambios o Cancelar; cancelar no ejecuta PUT. La validación es la misma que en alta, el botón se bloquea mientras guarda y se evita el doble envío.

Tras 200 se reemplaza solo el comentario con ese id usando el objeto confirmado por el backend. Se mantienen el resto de comentarios, orden, total y offset. modificado true muestra «Editado»; no se simula la etiqueta al hacer clic ni se infiere de timestamps. Una edición fallida mantiene el texto editable y explica el error, incluido 403 aunque el botón hubiera estado visible con datos anteriores.

Las descripciones largas de comentarios usan TruncatePipe con Ver más/Ver menos y estado por id; no se transforma el texto persistido ni se usa innerHTML. Este uso sigue contando como el mismo pipe de Sprint 4, no como un pipe adicional.

### Mi Perfil

MiPerfil conserva su consulta de últimas tres publicaciones propias, orden fecha/limit 3. Cada wrapper publicacion-del-perfil agrupa PublicacionCard y ComentariosPublicacion con el mismo `_id`. Así se cargan como máximo **nueve comentarios iniciales** (tres por publicación), con peticiones independientes y acotadas. No se llama al detalle individual por cada ficha ni se duplica la pantalla de detalle.

Cada sección tiene su propio formulario, edición, offset y botón Cargar más; no hay precarga ilimitada. Se mantienen los componentes por id al refrescar likes para conservar borradores y páginas ya cargadas. Una baja de publicación elimina su grupo y sus comentarios de la vista. Este trabajo completa el requisito local de comentarios asociados a las últimas tres publicaciones del usuario.

### Detalle y estados

PublicacionDetalle usa la ruta pública publicaciones/:id y el GET individual mínimo agregado en 4B. Reutiliza PublicacionCard con textoCompleto y esta misma sección; carga/error/404/id inválido se distinguen. No se montan comentarios antes de recibir una publicación activa. Un 404 de listado/alta de comentarios limpia datos y avisa al padre; un 404 de PUT puede significar comentario ausente y mantiene la edición con error, sin asumir automáticamente que desapareció toda la jugada.

Los CSS explican superficies, radios globales, formularios, fotos, estados y ajuste móvil. Se mantiene negro/verde musgo/gris, sin dependencia visual ni rediseño global. Código y ejemplos para defensa en [guia-angular.md](guia-angular.md).

### Pruebas y límites vigentes

Ver comandos/resultados en 08. Se prueban servicios HTTP, ruta directa y navegación desde tarjeta, datos antiguos/inactivos/404, primera carga, 3/3/2 con anexado, duplicados/offsets, creación después de páginas cargadas, formularios/UTF-16/errores y doble envío, edición propia/ajena/admin/cancelación/Editado, Input nuevo y asociación de tres jugadas del perfil. Se conservan los casos anteriores, adaptando las consultas nuevas esperadas.

Las pruebas Angular interceptan HTTP y no conectan con Vercel/Atlas/Cloudinary. Sigue pendiente ensayo integrado con cookies/CORS/JWT reales, navegador/dispositivos y datos persistidos. Las ventanas entre publicación/comentarios de 4A y el desplazamiento entre páginas offset por nuevas notas externas no desaparecen: se deduplica lo recibido, pero no se promete una instantánea entre páginas ni incorporar automáticamente toda nota externa nueva. Para incorporarlas, volver al detalle/recargar; tras una creación local se reinicia explícitamente.

No se implementan renovación de sesión, interceptor global de 401, autorizar/refrescar, aviso/modal temporal ni cambio de TTL; son de 4C. El JWT sigue con los 20 segundos existentes. No se implementa eliminación de comentarios.
