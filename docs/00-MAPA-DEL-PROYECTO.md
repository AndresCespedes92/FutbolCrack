# Mapa de los ajustes de navbar y reporte

Registro acotado al cambio del 2026-11-02. La documentación histórica no estaba presente en el estado inicial actual del repositorio; no se reconstruye ni se atribuyen resultados anteriores.

- frontend/src/app/components/navbar/navbar.html: @if/@else sobre auth.usuarioActual() alterna Mi perfil e Ingresar/Registrarse. Reutiliza señal, rutas y directiva administrativa existentes.
- frontend/src/app/components/navbar/navbar.spec.ts: invitado, cambio reactivo de sesión y enlaces administrativos.
- frontend/src/app/pages/dashboard-estadisticas/dashboard-estadisticas.ts: usuariosConMasPublicaciones copia datos del reporte, ordena por cantidad descendente y toma diez.
- dashboard-estadisticas.html: utiliza el ranking únicamente en la tabla del primer reporte y explica el límite en su caption. El gráfico sigue usando la respuesta completa.
- dashboard-estadisticas.spec.ts: doce usuarios en orden ascendente; verifica tabla con diez mayores, gráfico con doce, array original sin mutaciones y actualización a un rango con dos usuarios.

Los endpoints, modelos, permisos y servicios HTTP existentes no cambian.
