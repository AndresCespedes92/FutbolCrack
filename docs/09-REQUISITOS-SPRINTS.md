# Seguimiento de requisitos del ajuste actual

Fecha: 2026-11-02. Alcance: solicitud de navbar y tabla de publicaciones por usuario; no se reconstruye la matriz histórica ausente ni se cambian sus estados sin evidencia.

| Solicitud | Implementación | Comprobación |
| --- | --- | --- |
| Ocultar Ingresar/Registrarse con sesión | Navbar usa auth.usuarioActual() mediante @if | Prueba de sesión usuario y administrador |
| Ocultar Mi perfil sin sesión | Rama @else ofrece solo acceso/registro; Publicaciones permanece | Prueba de invitado y transición de señal a null |
| Tabla con los diez que más publicaron | Copia ordenada descendente y slice(0, 10) del rango seleccionado | Doce registros, diez mayores en orden; recarga de dos registros |

Compilación frontend aprobada; pruebas específicas de ambos componentes 19/19. Suite completa bloqueada en compilación por imports de fixtures ausentes en frontend/src/app/testing, preexistentes a este cambio. No se eliminó ni deshabilitó ninguna prueba para conseguir un resultado positivo. Ensayo visual/integrado no ejecutado; pruebas de componentes usan datos simulados.
