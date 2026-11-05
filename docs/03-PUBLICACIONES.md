# Publicaciones y votos separados

## Problema y ejemplo del club

Antes, cada publicación guardaba un array creciente de IDs de votantes. Una jugada viral podía acercarse al límite de tamaño de un documento MongoDB. Ahora cada hincha que vota agrega un documento pequeño a `me_gusta`, con `publicacionId` y `usuarioId`. La publicación conserva un número, `cantidadLikes`, sin crecer con cada usuario.

El índice `voto_unico`, único sobre `{ publicacionId: 1, usuarioId: 1 }`, impide votos repetidos. No se incorpora un módulo funcional adicional ni se cambian rutas o cuerpos enviados desde Angular.

## Cómo viajan los datos

1. La tarjeta Angular emite la acción al padre y `AccionesPublicaciones` utiliza el servicio HTTP existente.
2. `POST /publicaciones/:id/likes` agrega; `DELETE /publicaciones/:id/likes` retira. El autor de la acción viene del JWT verificado, no del body.
3. `PublicacionesService.cambiarMeGusta` comprueba ID y usuario. Inicia `publicacionModel.db.transaction` y actualiza el contador de la publicación activa, usando esa misma sesión.
4. En esa transacción crea el voto o elimina exclusivamente la pareja publicación/usuario. Si el índice rechaza un duplicado o el voto que se quiere quitar no existe, se revierte también el contador.
5. La respuesta conserva `mensaje`, `cantidadLikes` y `meGusta`. Angular vuelve a consultar para respetar el orden elegido.

Se necesita MongoDB con transacciones, por ejemplo Atlas con replica set; un MongoDB standalone no alcanza. El contador se modifica sobre la publicación para que una baja concurrente produzca conflicto de escritura/reintento, en lugar de confirmar votos sobre una publicación ya retirada.

### Lectura y ordenamiento

`consultarListado` utiliza el contador persistido de documentos con `likesMigrados=true`. Antes de paginar ordena por cantidad de likes, fecha e ID; el orden por fecha sigue disponible. El feed conserva diez publicaciones por página y el perfil sus tres publicaciones.

Después de paginar consulta `me_gusta` por la identidad y los IDs de esa página, seleccionando solo `publicacionId`. Así determina `meGusta` sin descargar un millón de votantes. La respuesta pública no incluye sus IDs ni la marca interna de migración.

La agregación mantiene un fallback para publicaciones históricas: cuenta el array anterior y calcula el voto propio. Esa lectura no escribe ni migra. No se afirma que el sort de esta agregación mixta esté resuelto mediante un índice ni se realizó un ensayo de carga de un millón de votos.

### Errores y permisos

- Sin identidad, cuenta inexistente/deshabilitada: 401.
- ID de publicación inválido: 400.
- Publicación inexistente o inactiva: 404.
- Voto repetido o retiro de voto inexistente: 409, sin alterar contador.
- Publicación histórica pendiente de migración: 503, conservando sus votos y mostrando un mensaje comprensible en Angular.
- Fallo de persistencia/transacción: error; no se informa éxito ni se confirma un contador separado del voto.

La baja lógica conserva los votos. El acceso posterior sigue dependiendo de que la publicación esté activa.

## Migración preparada, no ejecutada sobre datos reales

El script usa la variable existente `CONNECTION_STRING`; no imprime su valor. Requiere indicar una base explícita con `--database`. Por defecto solo valida y cuenta publicaciones pendientes: no crea índices ni actualiza documentos.

Desde `backend/`, ejemplo para un entorno QA autorizado:

```powershell
node --env-file=.env scripts/migrar-likes.mjs --database futbolcrack_qa
```

Aplicación **solo después de autorizar el entorno y conservar un respaldo**:

```powershell
node --env-file=.env scripts/migrar-likes.mjs --database futbolcrack_qa --apply
```

El argumento selecciona esa base dentro de la conexión: revisar que sea el entorno correcto. No ejecutar el ejemplo en una base compartida sin autorización.

Procedimiento de integración:

1. Acordar una ventana de mantenimiento y detener las versiones anteriores que todavía escriben arrays. No ejecutar la migración mientras un backend antiguo siga aceptando votos.
2. Conservar un respaldo y ejecutar primero la inspección sobre QA autorizada.
3. Con `--apply`, crear/verificar el índice único y migrar las publicaciones pendientes, incluso inactivas, con una transacción por publicación.
4. Normalizar y deduplicar los IDs; un ID inválido detiene el proceso sin descartar datos silenciosamente. Insertar con upsert en lotes de hasta 500.
5. Verificar que el conteo real coincide con los usuarios históricos únicos. Entonces guardar el contador y retirar el array en la misma transacción. Un fallo revierte esa publicación; las anteriores ya confirmadas permanecen migradas.
6. Repetir el script si se interrumpió: las publicaciones marcadas se omiten. Esto evita duplicar o resucitar votos retirados después de migrarlas.
7. Verificar en MongoDB el índice, el conteo por publicación y el contador, y ensayar alta/retiro en navegador antes de habilitar el servicio.

Los arrays históricos no contienen la fecha de cada voto: el script registra `migradoEn`, sin inventar `createdAt`. No cambia autores, textos ni estados. No elimina usuarios ni publicaciones. No se puede volver al backend antiguo después de retirar los arrays sin una estrategia de reversión de datos.

Una publicación histórica enorme puede exceder el tiempo/límites operativos de una transacción durante la migración: ensayar sobre una copia y dimensionar la ventana antes de aplicar a producción. El script falla y revierte esa publicación; no existe un proceso de migración online por etapas en este alcance.

## Conceptos para defender

Colecciones relacionadas por ObjectId, índice único compuesto, contador desnormalizado, transacciones y rollback, concurrencia, paginación en MongoDB, proyección de campos e idempotencia de una migración. A diferencia de `$addToSet` en un array, ahora la unicidad pertenece al índice de la colección y la consistencia entre dos documentos se mantiene con una transacción.

Referencias técnicas: [transacciones Mongoose](https://mongoosejs.com/docs/transactions.html) y [arrays sin límite en MongoDB](https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/unbounded-arrays/).
