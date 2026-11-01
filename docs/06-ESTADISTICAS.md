# 06 — Estadísticas y reportes

## Estado vigente — Sprint 4, Tarea 5B (2026-11-01)

Las métricas quedan definidas por 5B: publicaciones por usuario, total de comentarios y comentarios por publicación. Se implementan consultas MongoDB y dashboard administrativo. Las propuestas de auditoría al final son antecedentes, no métricas adicionales implementadas.

### Problema y ejemplo del club

La comisión quiere saber quién publicó jugadas y cuántos comentarios recibieron en octubre. Descargar todo y contar en Angular sería costoso y permitiría que cada navegador aplicara reglas distintas. MongoDB filtra, cuenta y agrupa; Angular recibe cantidades y dibuja gráficos. Nest exige identidad habilitada y rol administrador actual incluso si se llama a la API sin pasar por la pantalla.

### Endpoints reales y contratos

Todos son GET con query obligatoria `desde=AAAA-MM-DD&hasta=AAAA-MM-DD`, AuthGuard y AdministradorGuard. No hay un módulo funcional nuevo: EstadisticasPublicacionesController vive en PublicacionesModule y EstadisticasComentariosController en ComentariosModule. Reutilizan servicios/modelos existentes.

| Endpoint | Método Nest | Qué cuenta y respuesta |
| --- | --- | --- |
| `/estadisticas/publicaciones-por-usuario` | PublicacionesService.publicacionesPorUsuario | Publicaciones visibles creadas en el rango; `datos:[{usuarioId,nombre,nombreUsuario,cantidad}]` |
| `/estadisticas/comentarios-totales` | ComentariosService.totalEnRango | Comentarios creados en el rango sobre publicaciones visibles; `total` y `dias:[{fecha,cantidad}]` |
| `/estadisticas/comentarios-por-publicacion` | ComentariosService.porPublicacionEnRango | Mismo conjunto de comentarios, agrupado por publicación; `datos:[{publicacionId,titulo,cantidad}]` |

Cada respuesta incluye `desde`, `hasta` y `zonaHoraria:'UTC-03:00'`. Los grupos se ordenan por cantidad descendente y por ID para desempatar; los días cronológicamente. Vacío: arrays vacíos y total 0; un error nunca se convierte en cero exitoso. Usuarios sin publicaciones y publicaciones sin comentarios no generan grupos cero.

```json
{"desde":"2026-10-01","hasta":"2026-10-02","zonaHoraria":"UTC-03:00","total":4,"dias":[{"fecha":"2026-10-01","cantidad":1},{"fecha":"2026-10-02","cantidad":3}]}
```

No se devuelven correo, hash, claves ni texto de comentarios. En A se seleccionan solo nombre, apellido y nombreUsuario del autor; si ya no existe se informa Usuario no disponible sin perder el conteo. Una cuenta deshabilitada no implica retirar su contenido: sus publicaciones visibles siguen contando.

### Fechas: calendario e inclusión de días completos

`backend/src/common/estadisticas/rango-fechas.dto.ts` contiene RangoFechasDto y construirRango. El DTO exige dos strings YYYY-MM-DD. El ayudante compara la fecha interpretada con el texto para rechazar normalizaciones como 30 de febrero; rechaza año 0000 y Desde posterior a Hasta. No acepta horas, formatos locales ni parámetros extra. Entrada inválida: 400; sin sesión: 401; usuario común: 403; fallo de consulta: error de servidor. Se comprueban permisos antes de ejecutar reportes.

La zona es **offset fijo UTC−03:00**, coherente con la hora argentina actual e independiente de la zona del servidor/navegador. No es una conversión histórica mediante America/Argentina/Buenos_Aires: no aplica antiguos horarios de verano. El rango admite días de calendario pasados/futuros; no se agrega un máximo de duración en esta tarea.

Desde incluye las 00:00 locales; Hasta incluye su día entero. Internamente se usa `$gte` en inicio y `$lt` en las 00:00 del día siguiente. Ejemplo: 01/10/2026 a 02/10/2026 equivale a `[2026-10-01T03:00:00.000Z,2026-10-03T03:00:00.000Z)`. El milisegundo anterior al límite superior se incluye y el instante exacto superior se excluye. Un mismo día es válido y cubre sus 24 horas.

A filtra `Publicacion.createdAt`. B/C filtran `Comentario.createdAt`, no edición ni creación de la publicación: un comentario de octubre en una jugada de septiembre sí cuenta. `$dateToString` agrupa días con timezone `-03:00`. No se usa `$dateTrunc`, evitando exigir esa operación más reciente del servidor.

Angular inicia los tres formularios con primer día del mes actual y hoy en el mismo offset. El backend no aplica defaults silenciosos: ambos parámetros son obligatorios. Cada formulario tiene rango propio. El texto Rango aplicado proviene de la respuesta: editar un control sin Actualizar no cambia el significado de las cifras anteriores.

### Política de contenido visible

Una publicación es visible si existe y `activo !== false`; incluye documentos antiguos sin campo. Las retiradas se excluyen de A y sus comentarios de B/C. Comentarios huérfanos también se excluyen. No existe baja independiente ni campo activo en Comentario: su disponibilidad depende de la publicación. No se agrega estado ficticio ni endpoint de bajas de comentarios.

Los reportes miden contenido **visible actualmente**, creado en el período: no son historia inmutable. Una baja puede reducir cifras de meses anteriores. Así no se muestran como disponibles comentarios que el público ya no puede consultar. Los documentos permanecen archivados.

### Cómo funcionan las agregaciones

Son etapas ejecutadas por MongoDB, como clasificar planillas del club: elegir período, formar pilas por jugador y contar cada pila.

- `$match` selecciona documentos antes de contar, mediante createdAt y visibilidad.
- `$group` forma grupos por autor/publicación y `$sum:1` suma un documento por fila. `$count` devuelve una cifra global; agrupar devuelve varias identificadas.
- `$lookup` une comentarios con su publicación usando el nombre real de `publicacionModel.collection.name`. `$unwind` deja una fila por coincidencia y descarta relaciones inexistentes; otro `$match` excluye publicaciones inactivas.
- `$facet` usa ese mismo conjunto para total y grupos diarios, sin descargar textos ni reglas distintas. `$dateToString` asigna el día en UTC−03:00.
- `$sort` ordena y `$project` entrega campos del reporte. A resuelve autores con populate después de agrupar y selecciona datos públicos.

Fragmento real de PublicacionesService:

```ts
{ $match: { activo: { $ne: false }, createdAt: { $gte: inicio, $lt: finExclusivo } } },
{ $group: { _id: '$autorId', cantidad: { $sum: 1 } } },
{ $sort: { cantidad: -1, _id: 1 } },
```

Los servicios existentes concentran consultas; los controllers reciben query y delegan. Las consultas complejas están comentadas. No se altera el contrato de publicaciones ni se duplica DELETE para administración.

### Angular y gráficos

`frontend/src/app/pages/dashboard-estadisticas/` separa TS, HTML, CSS y pruebas. DashboardEstadisticas tiene tres formularios reactivos independientes y EstadisticasService centraliza GET con cookie/parámetros. Flujo: administradorGuard → pantalla → Actualizar → servicio Angular → controller/guards Nest → servicio/agregación MongoDB → respuesta → gráfico/tabla.

Cada sección muestra carga, validación roja/verde, vacío y errores. Durante carga bloquea filtros/envíos para evitar consultas superpuestas. Las suscripciones terminan con el componente. Al consultar se retiran cifras anteriores; un error conserva fechas y permite reintentar. Los demás reportes no se recargan. Un 403 mantiene la sesión válida.

Gráficos sin dependencias nuevas:

1. Barras horizontales CSS: comparan publicaciones entre jugadores; longitud proporcional al máximo y cifra exacta al lado.
2. Línea SVG: evolución diaria del total de comentarios; posición por fecha real, puntos en días con actividad y tramos a cero en días ausentes, sin crear un elemento por cada día vacío.
3. Dona SVG: proporción de comentarios entre publicaciones; segmentos y leyenda desde cantidades recibidas. Angular calcula geometría, no nuevos conteos de documentos.

Las tres secciones tienen texto/tabla equivalente para no depender del color. No muestran gráficos vacíos engañosos. CSS documenta negro/musgo/gris, bordes redondeados, SVG, adaptación móvil y scroll local. Cambiar rango y Actualizar recalcula el gráfico con datos nuevos.

### Pruebas y recorrido manual pendiente

`backend/src/comentarios/estadisticas.http.spec.ts` tiene 42 casos con módulos/servicios/guards/DTO/JWT reales y conexión simulada. El intérprete genérico `backend/src/testing/agregacion-prueba.ts` ejecuta pipelines sobre fixtures en límites, fuera de rango, bajas, legado y huérfanos. Se comprueban también etapas, filtros, proyecciones y zona. No es ejecución de MongoDB real. El test de moderación usa DELETE existente, conserva documentos y comprueba feed, detalle, comentarios y reporte tras baja.

Angular prueba los seis campos, rango, independencia, actualización de tres gráficos, ceros/carga/vacío/errores y acceso mediante Router real. La prueba del feed abre el modal productivo como admin sobre jugada ajena, cancela sin DELETE y confirma con recarga y mensaje. Resultados/comandos en [08-PRUEBAS-Y-DESPLIEGUE.md](08-PRUEBAS-Y-DESPLIEGUE.md).

En entorno de prueba: entrar como admin, visitar /dashboard/estadisticas, modificar cada rango y Actualizar. Probar mismo día, vacío, rango inválido y usuario común. Crear una jugada/comentarios de prueba, comprobar cifras, retirar la jugada desde el feed con modal y consultar de nuevo: cifras visibles deben reducirse. Comprobar endpoints directamente y tamaño móvil. No se ejecutó contra datos reales.

Riesgos pendientes: versión/rendimiento de `$lookup/$facet/$dateToString` desplegados, índices/planes y rangos largos. No se pagina el número de grupos ni se limita duración: con mucho volumen puede requerir mejoras. Pendientes navegador/móvil, cookies HTTPS/CORS y Atlas; sin merge/deploy.

## Antecedentes de auditoría y 3A (propuestas, no implementación vigente)


## Estado comprobado y alcance de la propuesta

No se encontraron endpoints, services, componentes de gráficos ni filtros por fechas de reportes. Usuario y Publicacion sí tienen timestamps de Mongoose y pueden aportar createdAt para consultas futuras.

Se exigen tres estadísticas y gráficos de distintos tipos, pero el material recibido no identifica exactamente cuáles son las tres métricas oficiales. Su identidad es **No verificado** y requiere contrastar el enunciado completo. Las siguientes son propuestas útiles, no requisitos oficiales inventados ni consultas ejecutadas.

Como en un club, la comisión necesita saber cuántos socios se incorporaron y qué actividad hubo entre dos fechas, sin mezclar toda la historia con el período que está evaluando.

## Tres propuestas con modelos existentes

| Reporte propuesto                                 | Endpoint propuesto, no existente                      | Consulta MongoDB propuesta                                         | Gráfico | Datos disponibles / faltantes                                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Altas de usuarios por día                         | GET `/estadisticas/usuarios?desde=...&hasta=...`      | match createdAt, group por día, sum 1, sort por día                | Líneas  | Usuario.createdAt por timestamps; no hay endpoint ni validación de rol.                                                                                              |
| Publicaciones creadas por día                     | GET `/estadisticas/publicaciones?desde=...&hasta=...` | match createdAt y política de visibles, group por día, sum 1, sort | Barras  | Publicacion.createdAt; el estado de baja todavía no existe.                                                                                                          |
| Distribución de publicaciones por tipo multimedia | GET `/estadisticas/multimedia?desde=...&hasta=...`    | match createdAt y visibles, group por tipoMultimedia, sum 1        | Dona    | tipoMultimedia existe; desde 3A la creación puede guardar imagen o ninguno; el reporte aún no existe. No simular otras categorías con datos ficticios de producción. |

Reutilizar modelos y módulos existentes; la necesidad de un módulo EstadisticasModule depende del enunciado oficial. Se puede separar la responsabilidad de consulta sin duplicar usuarios/publicaciones o agregar módulos funcionales por costumbre.

## Contrato común de fechas propuesto

Todos los reportes tendrán **Desde** y **Hasta**, obligatorios. Angular validará formato/calendario y Desde ≤ Hasta antes de solicitar; Nest volverá a validar, rechazará parámetros inválidos con 400 y comprobará rol administrador si el dashboard es administrativo. Los límites y autorización no pueden depender del formulario.

Propuesta de semántica:

- La interfaz recibe días de calendario YYYY-MM-DD en `America/Argentina/Buenos_Aires`.
- Desde incluye el comienzo de ese día; Hasta incluye todo su día.
- Internamente convertir a instantes UTC y usar `$gte` para inicio y `$lt` para el comienzo del día siguiente a Hasta. Este límite superior exclusivo evita perder fracciones del último segundo.
- Agrupar los resultados según la misma zona horaria del filtro, no según la zona del servidor.
- Informar rango y zona en la respuesta para que el título del gráfico sea verificable.

Ejemplo propuesto: Desde 01/10/2026 y Hasta 31/10/2026 comprenden `[2026-10-01T03:00:00.000Z, 2026-11-01T03:00:00.000Z)` para Buenos Aires. Una publicación exactamente en el comienzo de noviembre local queda fuera. No hay filtros actuales con esta semántica: es una decisión a aprobar al implementar.

## Pipeline orientativo, no implementado

Para agrupar publicaciones por día, una vez construidos y validados inicioUTC y finExclusivoUTC:

```js
[
  { $match: { createdAt: { $gte: inicioUTC, $lt: finExclusivoUTC } } },
  {
    $group: {
      _id: {
        $dateTrunc: {
          date: "$createdAt",
          unit: "day",
          timezone: "America/Argentina/Buenos_Aires",
        },
      },
      cantidad: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];
```

Para altas se usa el modelo Usuario con el mismo criterio. Para distribución multimedia se agrupa por `$tipoMultimedia`. El filtrado de baja debe incorporarse cuando exista el estado y según si el reporte mide contenido visible o actividad histórica; esa definición todavía está pendiente, no se debe asumir que son lo mismo.

`$dateTrunc` permite agrupar por unidades temporales y zona horaria. Antes de elegirlo se debe comprobar la versión del servidor Atlas, que no fue consultada. [Documentación MongoDB](https://www.mongodb.com/docs/manual/reference/operator/aggregation/datetrunc/).

## Viaje de datos y presentación

Formulario Angular → servicio HTTP con desde/hasta → controller valida query y permisos → service arma match/aggregate → MongoDB devuelve cantidades → Angular actualiza los tres gráficos con el rango aplicado. No descargar todos los documentos para filtrar en el navegador.

Agregar una acción Actualizar, o un cambio controlado al terminar de editar ambas fechas. Mostrar cargando, sin resultados o error sin confundirlos. Evitar que una respuesta antigua reemplace la de un rango más nuevo. No elegir ni instalar una librería de gráficos en esta tarea: evaluar una solución simple y justificar la dependencia si resulta necesaria.

## Validación y pruebas necesarias

- Ambos días vacíos, uno vacío, formato inválido, día inexistente y Desde posterior a Hasta: no consultar en Angular y rechazar en Nest.
- Mismo día: incluye todo ese día.
- Fixtures justo antes de Desde, exactamente al inicio, al final de Hasta y exactamente al inicio siguiente.
- Datos de dos zonas/franjas horarias, días sin actividad y rango sin resultados.
- Cambiar el rango y comprobar la nueva solicitud y cifras MongoDB, no solo títulos del gráfico.
- Intentar acceder a los endpoints como usuario normal y sin sesión.
- Verificar que los tres gráficos tienen tipos distintos y una tabla o texto equivalente para lectura accesible.

Conceptos: agregación, match/group/sum/sort, instantes UTC frente a fecha de calendario, validación cruzada, autorización, asincronía y visualización. Las consultas anteriores son propuestas y no se ejecutaron contra Atlas.

## Datos disponibles desde 3A

Publicacion ahora incluye activo, titulo y descripcion y puede guardar imágenes reales mediante Cloudinary; los reportes continúan pendientes. Las consultas de contenido visible deberán excluir activo false e incluir documentos antiguos sin activo. La política de medir altas históricas o solo visibles deberá definirse por reporte, sin dar de baja la historia al construir un gráfico.
