# Bitácora

## 2026-11-05 — Likes en colección separada

Rama: `feature/likes-coleccion`, creada desde `main` limpia.

- Se registra `MeGustaSchema` dentro de PublicacionesModule, con índice único publicación/usuario.
- Publicacion conserva un contador y una marca interna; el array antiguo queda solo para lectura/migración, sin default en nuevos documentos.
- `cambiarMeGusta` confirma voto y contador con una transacción; conserva el contrato de los endpoints y revierte duplicados/retiros inválidos.
- `consultarListado` respeta votos históricos y obtiene el voto propio con una consulta limitada a los IDs de la página.
- Se prepara un script explícito, idempotente y en modo solo lectura por defecto. No se ejecutó sobre datos reales.
- Angular explica el 503 de migración pendiente. No cambia formularios ni contratos.
- Las pruebas HTTP se adaptan al almacenamiento separado conservando comprobaciones de identidad, duplicados, concurrencia, retiro propio, ordenamiento y errores. Los dobles de los módulos de comentarios registran la nueva dependencia.
- Se agregan pruebas del índice/esquema y cinco pruebas del algoritmo de migración, incluidas repetición, rollback e IDs inválidos.
- Se verifica que las referencias del nuevo esquema sean ObjectId reales usando `Schema.Types.ObjectId`; se evita que Nest/Mongoose las interpreten como Mixed.

Los archivos funcionales y métodos están enumerados en `00-MAPA-DEL-PROYECTO.md`. Los resultados de ejecución se registran en `08-PRUEBAS-Y-DESPLIEGUE.md`.

Pendientes: ejecución de transacciones/índice real y migración en QA autorizada; ensayo de navegador y carga. No se hicieron commit, push, merge ni despliegue.
