# Trazabilidad del cambio de Me gusta

La matriz histórica de 44 requisitos no estaba presente en este estado del repositorio. No se reconstruyen IDs ni se cambian sus estados sin evidencia. Esta tabla registra únicamente el alcance actual.

| Requisito | Implementación | Aceptación |
| --- | --- | --- |
| Dar/quitar likes autenticados | Endpoints existentes y `cambiarMeGusta` | Voto propio, 401/404 y 409 según el caso; sin duplicados ni contador negativo |
| Evitar arrays crecientes | Colección `me_gusta` e índice compuesto único | Nuevas publicaciones sin array de votantes |
| Consistencia del contador | Transacción compartida con alta/retiro | Error de inserción o retiro revierte el contador |
| Listado y detalle compatibles | `consultarListado` y consulta acotada a la página | `cantidadLikes`, `meGusta`, orden y paginación conservados |
| Conservar votos previos | Script idempotente, validación y fallback de lectura | Migración simulada comprobada; aplicación y verificación real pendientes |

Las pruebas con persistencia simulada no certifican que el índice ni las transacciones se hayan ejecutado en Atlas. La aceptación integrada queda pendiente de ejecutar la migración en QA autorizada y ensayar votos reales.
