# 12 — Guía de demostración ante el profesor

Esta es una secuencia **para ejecutar en un entorno de prueba**, no una lista de pruebas que ya pasaron en navegador. Consultar [11-AUDITORIA-FINAL.md](11-AUDITORIA-FINAL.md) para estados y limitaciones reales. Ejemplo: club Los Pases, jugadores A/B y un secretario administrador, todos ficticios y autorizados para ensayo.

## Preparar antes de la clase

- Identificar versión frontend/backend y entorno; cuentas A/B y administrador habilitado. El registro público no crea administradores. No usar datos de personas reales ni retirar publicaciones ajenas.
- Ejecutar los comandos de compilación y pruebas de 08. Frontend desarrollo: `npm start` desde frontend; backend local, si corresponde: `npm run start:dev` desde backend con configuración privada ya preparada. No abrir .env, tokens ni secretos ante el proyector.
- Atención: `frontend/src/app/services/api.config.ts` apunta al backend desplegado. Levantar Nest local no cambia automáticamente ese destino. Acordar un entorno de ensayo y origen CORS/CSRF antes de escribir; no mostrar una demo con dos backends distintos sin advertirlo.
- Preparar jugadas de prueba suficientes para varias páginas y ocho comentarios en una jugada, solo en entorno autorizado. No hay semilla automática ni demos que sustituyan la API en el producto. En tests hay fixtures aislados, que se explican como tales.
- Para PWA usar build de producción por HTTPS/localhost con un servidor estático disponible y rutas SPA apropiadas; `npm start` de desarrollo no registra worker. Esperar activación y revisar el manifest. La auditoría no consiguió acceso del navegador al servidor local: resolverlo antes de la clase.
- Reservar 15–20 minutos para la demostración. Iniciar sesión al comienzo y mostrar otras secciones mientras transcurren los diez minutos del aviso real. Si el tiempo no alcanza, mostrar la prueba con reloj simulado identificándola expresamente; no presentarla como tiempo real.

## 1. Registro y login

**Pantalla:** `/registro`, luego `/login`.

**Acción:** dejar un obligatorio vacío y salir; corregirlo para pasar de rojo a verde. Probar confirmación de clave, fecha futura, tipo/tamaño de foto y duplicado con cuenta de ensayo. Registrar A con información ficticia válida y luego ingresar por nombre de usuario o correo. Mostrar error de credenciales incorrectas sin borrar campos.

**Esperado:** inválidos no envían registro; éxito real muestra mensaje, duplicado 409; login devuelve ficha/fechas y el navegador guarda cookie HttpOnly. No se inicia sesión automáticamente al registrar. Una clave Unicode demasiado larga se rechaza, no se recorta.

**Explicar:** FormGroup/FormControl, Validators, validación cruzada, ngClass y bindings; DTO whitelist y control de tipos en Nest; bcrypt costo 12 y límite de 72 bytes UTF-8, además de máximo 64 caracteres. El nombre de un jugador puede estar bien en la recepción, pero la oficina vuelve a validar.

**Archivos:** `forms/registro-form.ts`, `validators/registro.validators.ts`, `pages/registro/`, `pages/login/`, `backend/src/usuarios/dto/create-usuario.dto.ts`, `backend/src/common/password.ts`, `AuthController/AuthService`.

No mostrar el valor de token/hash ni una contraseña real. En Network basta método/status y atributos de cookie, evitando proyectar sus valores. La demo de cookies reales sigue pendiente hasta M03.

## 2. Publicaciones y likes

**Pantalla:** `/publicaciones`.

**Acción:** A publica título/descripción y archivo sintético JPEG/PNG/WebP; recargar para comprobar persistencia e imagen. B da me gusta y lo quita; intentar doble clic. Cambiar recientes/populares y navegar por números, anterior/siguiente. Con 23 jugadas de prueba deben aparecer 10/10/3.

**Esperado:** estado/mensajes del backend, botón bloqueado durante solicitud; orden y páginas se piden a Nest con offset/limit. Imagen debe estar disponible después de recargar: un ping de Cloudinary no demuestra esa subida.

**Explicar:** PublicacionCard recibe Input y emite Output, sin hacer HTTP; PublicacionesService y AccionesPublicaciones coordinan el padre. MongoDB agrega/quita al array con condición atómica, no suma duplicados. El texto se muestra con bindings, no innerHTML sin controlar.

**Moderación:** solo con jugada de ensayo, abrir baja como autor o admin; cancelar y comprobar ausencia de DELETE. Confirmar luego, mostrar éxito, desaparición del feed y 404 en detalle/comentarios; B ajeno debe recibir 403. Los documentos quedan archivados: no hay borrado físico. No hacer este ejercicio sobre datos productivos.

## 3. Perfil, detalle y comentarios

**Pantallas:** `/mi-perfil` y `/publicaciones/:id` desde Ver detalle.

**Acción:** mostrar ficha real de A, descripción/últimas tres propias y avatar neutro si falta foto. Abrir una jugada, observar tres comentarios; Ver más lleva a seis y luego ocho sin reemplazar anteriores. A edita uno propio y guarda; comprobar Editado. Abrir de nuevo, cancelar sin PUT. Entrar como B y comprobar que no puede editar la nota de A; un admin ajeno tampoco.

**Explicar:** referencia ObjectId entre comentario/publicación/autor, createdAt para orden estable y updatedAt para edición, servicio HTTP, Input de publicación por cada sección, validación de autor también en Nest. Una nota del partido no puede ser reescrita por otro socio aunque cambie el botón en su navegador.

No existe en este alcance un editor avanzado del CV ni carga nueva de videos: la ficha se completa en el registro y publicaciones nuevas admiten imagen; no mostrar como funcionalidad existente lo que no está implementado.

## 4. Autorización inicial y renovación JWT

**Pantalla:** recargar una ruta y continuar la sesión hasta el aviso.

**Acción:** mostrar Comprobando tu sesión y su POST autorizar. Al minuto diez aparece el modal. Ahora no no envía refrescar; Extender sesión sí lo envía y renueva cookie/metadatos quince minutos. Si se dispone de tiempo, dejar vencer y mostrar retorno a login. Probar regreso de pestaña suspendida en ensayo.

**Explicar:** JWT exp-iat=900; HttpOnly evita leerlo desde Angular; AuthService conserva solo ficha/fechas y compara con hora del servidor. La renovación es voluntaria, no un timer que la ejecuta solo. El interceptor diferencia 401 (identidad inválida) y 403 (sin permiso); en 5D se incluyeron los reportes administrativos.

**Logout:** cerrar desde perfil y verificar cookie eliminada/guard. Aclarar que borrar cookie no revoca una copia del JWT antes de exp; una cuenta deshabilitada sí se bloquea por consulta actual de ficha. No extraer ni compartir tokens de una cuenta real para explicar este punto.

## 5. Administración

**Pantalla:** `/dashboard/usuarios`, solo administrador de ensayo.

**Acción:** listar usuarios, crear usuario común y admin mediante radios, probar duplicado/error. Seleccionar baja de un jugador de ensayo; cancelar sin HTTP, luego confirmar y observar estado/mensaje. Intentar login del suspendido y una operación protegida, rehabilitar y volver a ingresar.

**Explicar:** rol indica permisos y activo si la cuenta puede usarse. AuthGuard consulta la ficha actual en MongoDB aunque el JWT anterior tenga firma válida; AdministradorGuard comprueba rol vigente. El registro público fuerza usuario, no permite enviarse administrador/activo.

**Límite que debe decirse:** esta implementación protege todas las cuentas administradoras contra baja, no solo la última; también impide baja propia. Es política conservadora 5A y se evalúa Parcial en 5D respecto de bajas administrativas generales. No intentar eludirla modificando datos reales.

## 6. Estadísticas

**Pantalla:** `/dashboard/estadisticas`.

**Acción:** en cada sección elegir Desde/Hasta propios y Actualizar. Mostrar publicaciones por usuario (barras), total de comentarios con evolución diaria (línea) y comentarios por publicación (dona). Probar mismo día, sin resultados y rango invertido. Comparar contra cantidades conocidas de ensayo; retirar únicamente una jugada de ensayo y actualizar para verificar exclusión.

**Explicar:** `$match` filtra antes de contar; `$group/$sum` produce cantidades por autor/jugada; `$lookup` excluye notas de publicaciones retiradas; `$facet` comparte conjunto para total/días. Angular dibuja proporciones, no descarga los documentos para contarlos.

Fechas son días completos de offset fijo UTC−03:00, inicio incluido y siguiente día de Hasta excluido. A usa fecha de publicación; B/C la del comentario, aunque la jugada sea anterior. Las cifras describen contenido visible hoy y pueden bajar para un período pasado tras moderación. El gráfico no pretende ser una auditoría histórica inmutable.

## 7. Pipes y directivas en pantallas reales

| Mostrar | Acción | Concepto y archivo |
| --- | --- | --- |
| Texto largo de jugada/comentario | Ver más/Ver menos | TruncatePipe: transforma solo presentación; `pipes/truncate.pipe.ts` |
| Fecha en tarjeta/comentario | Ver texto relativo y fecha exacta en title/datetime | FechaRelativaPipe puro, no reloj en vivo; `pipes/fecha-relativa.pipe.ts` |
| Autor sin foto | Iniciales en avatar | InicialesPipe, primera/última palabra; `pipes/iniciales.pipe.ts` |
| Comentarios de A | Cambiar entre A y B | ResaltarAutorDirective: host binding de clase, CSS separado |
| Editar comentario | Abrir/cancelar/reabrir | AutoFocusDirective: foco tras afterNextRender, sin timeout |
| Navbar | Entrar/salir con admin/usuario común | PermisoRolDirective estructural, input/effect y TemplateRef/ViewContainerRef; solo visibilidad |

Decir la diferencia: un pipe cambia un valor mostrado; una directiva cambia comportamiento/presencia de un elemento. Hay exactamente tres de cada uno; RouterLink/NgClass no cuentan como propios. Los permisos definitivos están en Nest. Son conceptos adaptados de CineBera; no se atribuye una copia literal sin evidencia de origen.

## 8. Instalación y actualización PWA

**Pantalla:** raíz `/` del frontend de producción servido en HTTPS o localhost, con navegador compatible.

**Acción esperada:** esperar registro/activación (estrategia hasta 30 segundos), revisar manifest/worker y usar Instalar si el navegador lo permite. Mostrar escudo FC y ventana standalone. Después de la primera carga online, simular offline y recargar raíz: se muestra reconexión, sin datos privados ni colas. Volver online y Reintentar.

**Caché:** inspeccionar Cache Storage con cuidado de no proyectar valores sensibles. Debe contener solo index/JS/CSS/manifest/iconos, ninguna respuesta auth/usuarios/publicaciones/comentarios/estadísticas ni fotos recibidas. Probar login/logout/refrescar y actualizaciones con worker activo. Nueva versión únicamente en entorno de ensayo autorizado; cerrar/reabrir pestañas y verificar activación normal. No se fuerza una recarga que pierda ediciones.

**Explicar:** manifest es la ficha de instalación; worker intermedia archivos estáticos; `dataGroups:[]` y lista cerrada evitan cachear datos de negocio. Offline directo a publicaciones/dashboard no tiene fallback, deliberadamente; inicio '/' es la entrada prevista. No hay sincronización offline.

**Advertencia de demostración:** la auditoría pasó 11 verificaciones de configuración/artefactos, pero no instalación/runtime. Marcar este bloque pendiente hasta ejecutarlo en navegador; no sustituirlo por un test Node y decir que la instalación se vio.

## Cierre ante el docente

Mostrar `docs/11-AUDITORIA-FINAL.md`, los 44 IDs con evidencia y los resultados reales. Explicar los tres arreglos funcionales de 5D (bytes de clave, 400 de espacios, 401 estadísticas) y la limpieza de demos. Reconocer límites: 39 Cumple localmente, cuatro Parcial y un No verificado histórico; PWA e integración autenticada aún requieren matriz manual. No presentar el proyecto como validado integralmente en producción sin completar esas verificaciones.

## Preparación posterior a 5E

Consultar [13-VALIDACION-INTEGRADA.md](13-VALIDACION-INTEGRADA.md) antes de exponer qué está realmente probado. Los ensayos autenticados usaron Atlas y Cloudinary reales separados del padrón del club; esas cuentas/contenido ya se limpiaron. Para repetir, crear nuevos jugadores ficticios en QA con autorización, nunca usar registros reales para probar bajas. La foto viaja del formulario a Nest y Cloudinary y su URL queda en MongoDB; los comentarios se acumularon efectivamente 3/6/8. Capturas en evidencias-5e permiten mostrar ese recorrido sin revelar credenciales.

El profesor puede preguntar si pasar once tests PWA demuestra instalación: no; verifican artefactos. En 5E se observó worker NORMAL y shell al apagar servidores, pero falta instalar/actualizar, revisar Cache Storage y probar HTTPS entre sitios. Tampoco exp−iat=900 sustituye esperar 15 minutos: probar el modal al minuto 10 y vencimiento natural antes de cerrar aceptación. El emulador solo certificó ancho observado de 375px; completar teléfono/otros anchos.
