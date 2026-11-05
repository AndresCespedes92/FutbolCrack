# Verificación del cambio de likes

Fecha: 2026-11-05. Rama: `feature/likes-coleccion`.

| Comprobación | Resultado |
| --- | --- |
| Compilación NestJS | Aprobada, sin errores |
| Compilación Angular | Aprobada; advertencia existente de CSS de publicaciones: 4,59 kB frente a presupuesto de 4 kB (588 bytes excedidos) |
| Pruebas NestJS seleccionadas | 188/188 aprobadas, cinco archivos |
| Repetición final de publicaciones/esquemas | 88/88 aprobadas después de comprobar referencias ObjectId reales |
| Pruebas del algoritmo de migración | 5/5 aprobadas |
| Revisión de diferencias | `git diff --check`, sin errores |
| Atlas, índice único y rollback real | Pendiente; no se conectó a datos reales |
| Migración de datos existentes | Preparada, no ejecutada |
| Navegador y carga de un millón de votos | No ejecutados |

Comandos desde `backend/`:

```powershell
node node_modules/@nestjs/cli/bin/nest.js build
node node_modules/vitest/vitest.mjs run src/publicaciones src/comentarios/comentarios.controller.http.spec.ts src/comentarios/estadisticas.http.spec.ts --no-file-parallelism --pool=threads
node --test scripts/migrar-likes.test.mjs
```

Desde `frontend/`:

```powershell
node node_modules/@angular/cli/bin/ng.js build
```

Se ejecutó HTTP local real contra NestJS con controllers, DTO y guards. La persistencia y las transacciones usan un doble con serialización y rollback: eso permite verificar respuesta, contador, permisos y errores, pero no demuestra el comportamiento del motor MongoDB. El esquema declara el índice compuesto; su creación efectiva debe verificarse contra la base QA.

Cobertura: alta/retiro, identidad del JWT frente al body, duplicados, ocho altas simultáneas del mismo usuario, votos de usuarios diferentes, retiro exclusivamente propio, vuelta a votar, contador no negativo, rollback de errores, publicación inactiva/ausente, usuario inexistente/deshabilitado, 400/401/404/409/503, ordenamiento, paginación y `meGusta`. El caso con contador 1.000.000 utiliza un número sintético: no es un ensayo de carga ni un millón de documentos reales.

La primera ejecución seleccionada tuvo 87 aprobadas y una fallida: una prueba antigua esperaba votar sin migrar. Se adaptó para comprobar el 503, conservar los votos y permitir el alta tras representar el resultado de la migración explícita. La ejecución final de 188 pruebas pasó completa. No se deshabilitaron pruebas. El error de persistencia que aparece en el log de Nest se provoca deliberadamente para comprobar un 500 y su rollback; ese caso pasó.

La revisión del esquema compilado detectó que `Types.ObjectId` en `@Prop` se interpretaba como `Mixed` con estas versiones. El nuevo esquema se corrigió a `Schema.Types.ObjectId`, manteniendo `Types.ObjectId` para los valores TypeScript. Una aserción comprueba que ambas referencias sean realmente `ObjectId`. Tras esa corrección se repitieron las 88 pruebas de publicaciones y sus esquemas, todas aprobadas, y se recompiló NestJS.

## Ensayo integrado pendiente

1. Autorizar una base aislada, crear/verificar el índice `voto_unico` y ejecutar inspección/migración según `03-PUBLICACIONES.md`.
2. Comprobar directamente que cada contador coincide con `countDocuments({publicacionId})`.
3. Enviar altas concurrentes reales del mismo jugador: un único voto, contador uno. Enviar retiros concurrentes: un único retiro, contador cero.
4. Verificar rollback real si falla una parte de la transacción y conflicto frente a una baja concurrente.
5. Con dos cuentas ficticias, dar/quitar votos en navegador; comprobar orden por likes, detalle, perfil y recarga.
6. Volver a ejecutar la migración y comprobar que no duplica ni resucita votos retirados.

Antes de producción, detener escritores antiguos y realizar respaldo. No volver al código de arrays sin un plan de reversión. No se hizo commit, push, merge ni despliegue.
