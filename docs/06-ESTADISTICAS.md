# 06 — Estadísticas y reportes

## Estado comprobado y alcance de la propuesta

No se encontraron endpoints, services, componentes de gráficos ni filtros por fechas de reportes. Usuario y Publicacion sí tienen timestamps de Mongoose y pueden aportar createdAt para consultas futuras.

Se exigen tres estadísticas y gráficos de distintos tipos, pero el material recibido no identifica exactamente cuáles son las tres métricas oficiales. Su identidad es **No verificado** y requiere contrastar el enunciado completo. Las siguientes son propuestas útiles, no requisitos oficiales inventados ni consultas ejecutadas.

Como en un club, la comisión necesita saber cuántos socios se incorporaron y qué actividad hubo entre dos fechas, sin mezclar toda la historia con el período que está evaluando.

## Tres propuestas con modelos existentes

| Reporte propuesto                                 | Endpoint propuesto, no existente                      | Consulta MongoDB propuesta                                         | Gráfico | Datos disponibles / faltantes                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Altas de usuarios por día                         | GET `/estadisticas/usuarios?desde=...&hasta=...`      | match createdAt, group por día, sum 1, sort por día                | Líneas  | Usuario.createdAt por timestamps; no hay endpoint ni validación de rol.                                                                   |
| Publicaciones creadas por día                     | GET `/estadisticas/publicaciones?desde=...&hasta=...` | match createdAt y política de visibles, group por día, sum 1, sort | Barras  | Publicacion.createdAt; el estado de baja todavía no existe.                                                                               |
| Distribución de publicaciones por tipo multimedia | GET `/estadisticas/multimedia?desde=...&hasta=...`    | match createdAt y visibles, group por tipoMultimedia, sum 1        | Dona    | tipoMultimedia existe; el flujo de creación actual siempre guarda ninguno. No simular otras categorías con datos ficticios de producción. |

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
