# 14 — Aceptación final y cierre de entrega · Tarea 5F

Fecha: **2026-11-01, America/Buenos_Aires**. Los timestamps de las evidencias JSON están en UTC y algunos corresponden al 02/11 UTC, todavía 01/11 local.

**Dictamen: listo para demostrar los flujos locales ensayados; aceptación integral de entrega pendiente de HTTPS real y las limitaciones manuales identificadas.** No se realizó merge, push ni deploy. La autorización recibida fue preparar una propuesta de despliegue; no ejecutarla.

## Git, alcance y autorización

Se revisó `test/integracion-final`: cambios de 5E limitados a herramienta QA, documentación y evidencias. Se repitieron ambos builds, Angular 236/236, Nest 275/275 y PWA 11/11. Después se creó el respaldo **6a66fc9**, `test(integracion): respaldar validacion real y evidencias de QA`, y la rama **test/aceptacion-final**. Los cambios de 5F quedan sin commit para revisión.

El usuario autorizó mantener el entorno QA aislado y su limpieza, preparar la propuesta HTTPS, permitir la baja de otro administrador con protección de la cuenta propia/último activo e instalar la PWA local. No se instalaron dependencias ni se redujo la duración JWT. Se preservó la estrategia de caché existente.

## Requisitos que llegaron abiertos y estado final

| ID | Estado al comenzar | Qué necesitaba | Evidencia/decisión 5F | Estado final |
| --- | --- | --- | --- | --- |
| S4-04 | Parcial | Decisión funcional y corrección limitada: se protegían todos los administradores | Usuario autorizó suspender otro administrador. Transacción Nest, cuenta propia protegida, actor actual validado y al menos uno activo; pruebas reales de carreras opuestas y modal UI | **Cumple** |
| S4-08 | Parcial | Ensayo de instalación, actualización y caché, sin ampliar funcionalidades | Edge instaló y abrió PWA; worker activo, versión nueva real, offline/recuperación online y caché inspeccionado después de logout | **Cumple en QA local** |
| G-14 | Parcial | Aceptación integrada y manual completa | JWT con reloj real, responsive y PWA avanzaron; falta HTTPS entre sitios y revisión manual residual indicada abajo | **Parcial** |
| G-15 | No verificado | Evidencia histórica de Tarea 0 | No hay checkpoint exclusivo retrospectivo; no se cambia con código actual | **No verificado** |

Los otros 40 requisitos conservan su estado. **Total vigente: 42 Cumple / 1 Parcial / 0 No cumple / 1 No verificado**, según las 44 filas de [09](09-REQUISITOS-SPRINTS.md). Cumple se limita a la implementación y evidencia descritas, no certifica un despliegue inexistente. Siguen sin estar disponibles los enunciados oficiales completos para contrastar detalles adicionales.

## Entorno utilizado

Frontend: copia del build de producción en localhost:4200. Backend Nest compilado en localhost:4301; instancia adicional de regresión en 4302, cerrada al terminar. MongoDB Atlas real, exclusivamente **futbolcrack_qa**. Cloudinary real con imágenes sintéticas en carpetas `futbolcrack/qa/<namespace>`.

Se usaron dos namespaces nuevos exclusivos de 5F: `qa5e_42cc15ec` y `qa5e_eea429b3`; el prefijo del ejecutor existente conserva el nombre 5E, aunque estas ejecuciones pertenecen a 5F. Credenciales aleatorias permanecieron privadas; cookies/JWT solo en memoria del ejecutor y navegador. No se registraron sus valores. No se utilizaron cuentas reales. La clave QA efímera cambia al reiniciar Nest: eso invalida sus sesiones anteriores y no es una falla de producción.

Navegadores: integrado para rutas, JWT sin renovar, responsive y update; Microsoft Edge/PWA instalada para renovación voluntaria, instalación, sesión propia, logout y Cache Storage. Las evidencias distinguen cada contexto; no se afirma que compartan cookies/cachés.

## Corrección S4-04: otro administrador y concurrencia

Antes: `UsuariosService.deshabilitar` rechazaba cualquier administrador con 409 y Angular ocultaba la acción. Después: conserva baja propia 409 y baja lógica, permite otro administrador activo y conserva rehabilitación. No cambió registro público, JWT ni contrato de endpoints.

Archivos y recorrido:

1. `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.ts`: `puedeDeshabilitar` permite otra cuenta activa, incluyendo administradores; la propia queda protegida. Plantilla `.html` explica la nueva política.
2. Modal existente identifica la cuenta. `confirmarBaja` llama `UsuariosService` Angular → `DELETE /usuarios/:id` → AuthGuard/AdministradorGuard → `UsuariosService.deshabilitar` Nest.
3. Si el destinatario es administrador, `deshabilitarAdministrador` ejecuta una transacción de la conexión Mongoose/Atlas. Primero escribe `updatedAt` de la ficha del actor con filtro de rol/estado actual; luego cuenta activos y suspende al destinatario.
4. Dos administradores que intentan suspenderse mutuamente escriben sobre las mismas fichas. MongoDB detecta el conflicto y reintenta; quien ya quedó suspendido no vuelve a pasar la validación del actor. Un conteo fuera de transacción permitiría una carrera, por eso aquí no alcanza por sí solo.
5. Nadie puede suspenderse a sí mismo: se comparan ObjectId normalizados, incluso si el texto del JWT usa mayúsculas. Al confirmar, el actor permanece activo; siempre queda alguien a cargo del padrón. La operación requiere transacciones, disponibles en el Atlas ensayado; no hay fallback inseguro si la base no las soporta.

Ejemplo del club: la secretaria A puede suspender el acceso de B, pero no puede suspenderse a sí misma ni dejar vacía la secretaría. Un administrador suspendido recibe 401 con su JWT previo; al rehabilitarlo recupera acceso según las reglas existentes.

Pruebas: `backend/src/usuarios/usuarios.administracion.http.spec.ts`, `frontend/src/app/pages/dashboard-usuarios/dashboard-usuarios.spec.ts` y **`backend/scripts/aceptacion-admin-qa.mjs`**. Este último usa Nest/Atlas reales, dos cuentas QA existentes y cinco carreras opuestas; resultados **[403,200]** en las cinco, exactamente un administrador propio activo en cada una. Incluye baja propia 409, baja de otro 200, JWT previo/renovación 401 y rehabilitación 200. No confundir la transacción simulada de la suite HTTP con esta contención real en Atlas.

La interfaz nueva se verificó contra el backend actualizado: suspender otro administrador mediante Confirmar mostró Habilitar; rehabilitar volvió a mostrar Deshabilitar. Evidencia: [concurrencia real](evidencias-5f/concurrencia-atlas.json) y [captura del administrador suspendido](evidencias-5f/administrador-suspendido.png).

## Validaciones de aceptación

| Escenario | Resultado | Evidencia y límites |
| --- | --- | --- |
| HTTPS real: login, persistencia, recarga, logout, atributos y administración | **Bloqueado** | No hay URL de QA HTTPS confirmada ni permiso de despliegue. Localhost HTTP no lo sustituye. Propuesta concreta más abajo. |
| CORS/CSRF | **Aprobado local; HTTPS pendiente** | Preflight con origen exacto y credentials=true; renovación con origen ajeno/ausente 403. Código existente reutilizado; no se expusieron valores de cookie. |
| JWT 15 minutos y aviso | **Aprobado con reloj real** | Servidor emite exp−iat=900. IAB inició 23:45:27 UTC: todavía activo a 884 s y login por vencimiento a 988 s. Aviso observado después del umbral de 10 min, con minutos restantes; no se monitoreó el segundo exacto del disparo. No se usaron fake timers ni JWT artificialmente corto. |
| Ahora no y recarga | **Aprobado** | Tras Ahora no, recarga mostró nuevamente aproximadamente 4 minutos restantes; no comenzó una sesión nueva. Tras expirar, recarga permaneció en login. |
| Renovación voluntaria | **Aprobado** | Edge inició 23:46:53 UTC; se eligió Extender sesión a los 621 s. Continuó vigente después de vencer el plazo original; apareció otro aviso aproximadamente 10 min después de renovar, luego perfil y logout funcionaron. |
| Instalación PWA | **Aprobado en Edge local** | Diálogo confirmó Aplicación instalada; ventana propia sin barra de direcciones. Icono visible; manifest e iconos reales también validados por 11 pruebas. Se rechazaron anclajes e inicio automático. La PWA queda instalada por autorización del usuario. |
| Service Worker y actualización | **Aprobado QA local** | Driver 22.2.3 NORMAL; el manifiesto activo pasó de db0e61… a 41a737… y nueva página leyó meta QA `5f-v2`. Se actualizó solo la copia QA con el build nuevo y hashes del generador oficial; ninguna regla de caché productiva cambió. No se afirma un banner personalizado de actualización que la aplicación no implementa. |
| Offline y vuelta online | **Aprobado con corte de servidores** | Tras logout, limpieza y apagado de ambos servidores, raíz cargó shell con Reintentar, sin datos privados ni cola de acciones. Al reiniciar QA, Reintentar llevó a login, autenticación real y dashboard actualizado. No se cortó el adaptador de red del equipo. |
| Caché después de logout | **Aprobado en contexto Edge inspeccionado** | PWA volvió a /login. DevTools Application → Cache Storage mostró control/meta Angular y caché de interfaz. Tabla completa: **24 entradas**, todas estáticas (JS/CSS/HTML/SVG/PNG/manifest), sin endpoints auth/usuarios/publicaciones/comentarios/estadisticas ni origen API. No se inspeccionaron otros orígenes o cachés del usuario. |
| Responsive | **Aprobado en emulación** | Cinco pantallas (feed/formulario, registro, perfil y ambos dashboards), más detalle/comentario en 360/390/768/1280 solicitados. Anchos efectivos 345/375/753/1265, 15px menos por scrollbar; contenido sin desborde global. No certifica teclado/rotación de teléfono físico. |
| Rutas pendientes M01 | **Aprobado** | Ruta inexistente controlada volvió a /publicaciones; Atrás volvió al detalle anterior. Login, registro, feed, perfil y dashboards ya recorridos. |

Evidencias: [tiempos reales JWT](evidencias-5f/jwt-reloj-real.json), [aviso](evidencias-5f/jwt-aviso-real.png), [vencimiento](evidencias-5f/jwt-vencido-real.png), [PWA instalada](evidencias-5f/pwa-instalada.png), [runtime PWA](evidencias-5f/pwa-runtime.json), [caché tras logout](evidencias-5f/cache-despues-logout.json), [mediciones responsive](evidencias-5f/responsive.json) y capturas por ancho en esa carpeta.

En las mediciones se conservan intentos cuyo tamaño efectivo no coincidió con el solicitado. El controlador aplicaba viewport a la pestaña seleccionada: se repitió sobre una pestaña recién abierta, aplicando tamaño después de abrirla, y se verificó clientWidth antes de aceptar el resultado. No se maquillaron las lecturas iniciales. Un timeout de navegación del controlador se recuperó; no se tomó como falla de la aplicación.

## Compilaciones, suites y advertencias

| Comprobación | Resultado final |
| --- | --- |
| Frontend `npm run build` | exit 0; inicial 295.38 kB; sin advertencias de presupuesto |
| Angular `node node_modules/@angular/cli/bin/ng.js test --watch=false` | **237/237**, 26 archivos, exit 0 |
| Frontend `npm run test:pwa` | **11/11**, exit 0; complementadas por navegador real |
| Backend `npm run build` | exit 0 |
| Nest `node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads` | **278/278**, 14 archivos, exit 0 |
| Ensayo HTTP real existente | **14/14** en cada una de dos ejecuciones nuevas; sin mocks |
| Ensayo real específico S4-04 | **4/4 escenarios**, incluyendo cinco carreras reales |
| Sintaxis `node --check backend/scripts/aceptacion-admin-qa.mjs` | exit 0 |

Intentos fallidos conservados y causa:

- Preparación dentro del sandbox: Angular no pudo abrir archivos temporales (25 suites sin ejecutar sus casos, 12 pruebas ejecutadas pasaron); Nest recibió `connect EACCES 127.0.0.1` en pruebas HTTP: 248 fallidas y 27 aprobadas (6 archivos fallidos y 8 aprobados). Fuera del sandbox, mismo código: 236/236 y 275/275. No se cambió producto para resolver restricciones del entorno.
- Nueva prueba Angular inicialmente añadió un objeto directamente al array sin marcar comprobación de cambios: no aparecía la fila. Se corrigió el ensayo para responder por HttpTestingController a `cargarUsuarios`, igual que el flujo real zoneless. No se debilitó la aserción.
- Siguiente suite Angular: 236/237, timeout de 5000ms en navegación existente; repetición completa sin builds/suites concurrentes: 237/237, sin aumentar límites ni omitir tests.
- Una invocación de `node --check` usó ruta desde el directorio incorrecto y dio MODULE_NOT_FOUND; se corrigió la ruta y pasó. No es error de aplicación.
- Mongoose sigue avisando de opción `new` deprecada en operaciones existentes; funciones pasan. Git avisa LF/CRLF según configuración existente. No se refactorizó ni instaló nada por estos avisos.

No se agregaron funciones ajenas al TP ni se eliminaron/omitieron pruebas. Frontend suma una regresión; backend suma regresiones de pérdida de permiso, último administrador y normalización de identidad; los casos anteriores de política se actualizan para verificar la decisión autorizada.

## Propuesta revisable de QA HTTPS — NO desplegada

Se propone usar **dos proyectos Vercel nuevos y separados de los productivos**, con nombres solicitados `futbolcrack-qa-web` y `futbolcrack-qa-api` (disponibilidad por confirmar). No se crearon proyectos ni se asociaron repositorios. URLs finales se tomarán de la plataforma; no se suponen reservadas. Requiere acceso seguro a la cuenta de hosting, sin enviar tokens por el chat.

| Pieza | Configuración propuesta |
| --- | --- |
| Frontend QA | Artefacto del build Angular actual, salida frontend/dist/frontend/browser; copia QA con API_URL reemplazado únicamente por la URL real de qa-api, más hashes ngsw regenerados. SPA rewrite a index.html para rutas de Angular; estáticos y ngsw servidos como archivos, no como index. |
| Backend QA | Copia de dist Nest y package.json/lock existentes; entrada de función que reutilice handler de dist/main.js. VERCEL del hosting evita startLocal; NODE_ENV=production usa opciones de cookie existentes. No tocar proyecto productivo ni aliases de producción. |
| Atlas | CONNECTION_STRING privada con base exacta futbolcrack_qa, comprobada antes de importar AppModule. Nunca usar la URI productiva sin imponer/verificar esa base. Sin dropDatabase. |
| JWT | JWT_SECRET exclusivo y aleatorio de QA, cargado como secreto del proyecto por un canal seguro; no reutilizar el productivo. Vencimiento sigue 900 segundos. |
| CORS y CSRF | FRONTEND_URL = origen HTTPS exacto asignado a qa-web; reutilizar origenesPermitidos y ValidarOrigenMiddleware. Sin wildcard, sin desactivar validación ni confiar en headers libres. |
| Imágenes | En la entrada exclusiva del artefacto QA, adaptar carpeta de Cloudinary igual que el ensayo local a futbolcrack/qa/qa5f_https_<namespace>. El servicio y upload HTTP siguen reales. Credenciales Cloudinary solo como secretos de QA; nunca dentro del bundle Angular. |
| Datos | Cuentas ficticias example.test creadas por registro; bootstrap controlado de una administradora nueva, como en QA local; solo namespace propio y sin cuentas reales. |
| Automatización | Sin push, conexión de Git que despliegue automáticamente ni cambio de dominio público de producción. Una ejecución manual aprobada, registro de URLs y prueba de acceso antes de crear datos. |
| Cierre | Verificar login/me/recarga/admin/logout y HttpOnly/Secure/SameSite=None; origen ajeno/ausente rechazado por CSRF y sin CORS permisivo. Inspeccionar atributos sin copiar valores. Retirar solo recursos propios y desactivar los proyectos QA al terminar, con autorización para esa limpieza del hosting. |

Orden propuesto: aprobar alcance → comprobar acceso al hosting → crear proyectos aislados y obtener URLs reales → preparar artefactos/variables anteriores → revisar aliases y prueba de aislamiento → desplegar manualmente solo QA → ejecutar matriz HTTPS → limpiar recursos QA. Si el hosting requiere un costo/cambio de plan o ampliar permisos, detenerse antes de aceptarlo.

Riesgo a medir: dos sitios distintos pueden estar sujetos al bloqueo de cookies de terceros del navegador, aun con SameSite=None/Secure. No se desactivará privacidad del navegador para afirmar que pasó. El ensayo debe registrar navegador/configuración y, si falla, distinguir atributo/CORS/CSRF de política de terceros.

**Pendiente de autorización explícita para ejecutar este despliegue y limpiar los proyectos de hosting al terminar.** La selección «Preparar propuesta» no se toma como ese permiso.

## Limpieza y conservación final

- Namespace qa5e_42cc15ec: retirados **5 usuarios, 23 publicaciones, 9 comentarios y 1 imagen; 0 usuarios propios restantes**.
- Namespace qa5e_eea429b3: retirados **5 usuarios, 23 publicaciones, 8 comentarios y 1 imagen; 0 usuarios propios restantes**.
- Cada imagen se destruyó por su public_id propio; se eliminaron solo las relaciones/cuentas del namespace. Sin dropDatabase ni datos productivos. Credenciales temporales de ambos ensayos eliminadas.
- Logout comprobado en ambos navegadores, copias de informes saneadas en docs/evidencias-5f, servicios cerrados y pestañas temporales cerradas. La instalación PWA permanece autorizada; no se desinstaló ni se configuró inicio automático.
- Evidencias HTTP: [primera ejecución](evidencias-5f/http-real-primera-ejecucion.json) y [backend actualizado](evidencias-5f/http-real-backend-actualizado.json), ambas con limpieza.

## Pendientes y recomendación final

1. Ejecutar HTTPS real con el entorno propuesto o URLs QA ya disponibles. G-14 continúa Parcial hasta esa evidencia y el cierre manual acordado.
2. G-15 conserva limitación histórica. No hay corrección funcional que certifique una actividad pasada sin checkpoint.
3. Revisión complementaria manual: contraste/zoom/recorrido completo de teclado de M17, teléfono físico y combinaciones visuales de error de M18 no recorridas. No se forzaron fallos 500 en producción. Las pruebas automatizadas existentes de accesibilidad/errores no equivalen a esos ensayos visuales.
4. No se certifica un despliegue productivo; no se dispone de consigna oficial completa para detalles adicionales. La PWA instalada apunta a localhost y necesita servidor local para operaciones de red; conservar instalación no significa publicar la app.

**FutbolCrack aún no está cerrado para aceptación integral de entrega.** S4-04 y S4-08 ya tienen evidencia para Cumple; el bloqueo principal restante es QA HTTPS. Detenerse y esperar aprobación. Sin merge, push ni deploy.

## Resultados aprobados y configuración HTTPS preparada

El usuario aprobó 5F y solicitó revisar la configuración concreta antes de ejecutar. Ver [15-CONFIGURACION-QA-HTTPS.md](15-CONFIGURACION-QA-HTTPS.md) y sus plantillas inertes. No se crearon recursos ni se desplegó. G-14 sigue Parcial y G-15 No verificado; no se modificarán funcionalidades aprobadas ni se confundirá ensayo actual con evidencia histórica.
