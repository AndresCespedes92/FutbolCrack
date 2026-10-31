# 04 — Comentarios

## Estado comprobado

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
