# Mapa del cambio de almacenamiento de Me gusta

Este documento describe el cambio realizado en `feature/likes-coleccion`, no una nueva auditoría de todos los sprints.

| Responsabilidad | Archivo / método |
| --- | --- |
| Documento individual e índice único | `backend/src/publicaciones/entities/me-gusta.entity.ts`, `MeGustaSchema` |
| Contador y compatibilidad histórica | `backend/src/publicaciones/entities/publicacion.entity.ts` |
| Registro de ambos modelos en el módulo existente | `backend/src/publicaciones/publicaciones.module.ts` |
| Dar/quitar voto, transacción y permisos | `backend/src/publicaciones/publicaciones.service.ts`, `cambiarMeGusta` |
| Feed, perfil, detalle, ordenamiento y estado propio | Mismo servicio, `consultarListado` |
| Endpoints existentes | `PublicacionesController`: `POST /publicaciones/:id/likes`, `DELETE /publicaciones/:id/likes` |
| Mensaje de migración pendiente | `frontend/src/app/services/acciones-publicaciones.ts`, `explicarError` |
| Migración explícita | `backend/scripts/migrar-likes.mjs`, `votosAntiguos`, `migrarPublicacion` |
| Pruebas de migración | `backend/scripts/migrar-likes.test.mjs` |
| Pruebas HTTP y regresión | `backend/src/publicaciones/publicaciones.controller.http.spec.ts` |
| Validación de esquemas | `backend/src/publicaciones/entities/*.spec.ts` |

Ver [Publicaciones](03-PUBLICACIONES.md) para el recorrido de datos y el procedimiento de migración.
