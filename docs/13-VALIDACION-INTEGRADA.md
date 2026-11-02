# 13 — Validación integrada y cierre de pendientes · Tarea 5E

Fecha: 2026-11-01. **Resultado: integración funcional local con servicios externos reales aprobada en los casos detallados; todavía no listo para aceptación integral de entrega.** No se realizó merge, deploy ni commit de 5E.

## Preparación y conservación

Se revisaron rama, estado y documentación completa 09/11/12. Se conservaron los cambios de 5D, se repitieron compilaciones y suites y, al coincidir con 5D, se creó el respaldo local **725c03e** (`fix(auditoria): corregir validaciones y preparar entrega final`, 30 archivos). Desde ese respaldo se creó **test/integracion-final**. No se instalaron dependencias ni se modificaron archivos productivos, secretos o configuración .env. La comparación SHA-256 con la instantánea inicial confirmó intactos los archivos originales de frontend/backend, incluidas sus pruebas y dependencias.

| Verificación de preparación | Resultado exacto |
| --- | --- |
| Frontend `npm run build` | exit 0; sin advertencias de presupuesto |
| Frontend `node node_modules/@angular/cli/bin/ng.js test --watch=false` | 236/236; 26 archivos; exit 0 |
| Frontend `npm run test:pwa` | 11/11; exit 0; configuración y artefactos |
| Backend `npm run build` | exit 0 |
| Backend `node node_modules/vitest/vitest.mjs run --no-file-parallelism --pool=threads` | 275/275; 14 archivos; exit 0 |
| `node --check backend/scripts/integracion-qa.mjs` | exit 0 después de corregir/formatear el ensayo |
| `node scripts/integracion-qa.mjs` sin autorización, desde backend | exit 1 esperado; rechaza el arranque y no ejecuta ningún ensayo |

Las suites existentes contienen dobles: sus resultados no se presentan como integración. La integración siguiente ejecutó HTTP, MongoDB Atlas y Cloudinary reales, sin mocks. Al no modificar aplicación ni suites, no se repitieron innecesariamente las suites completas después de redactar documentación.

## Cinco requisitos que estaban abiertos

| ID | Qué exige / qué existía | Qué faltaba y decisión con evidencia |
| --- | --- | --- |
| S2-02 | Subida de imagen mediante Cloudinary; servicio, interceptor, validaciones y formulario existentes | Faltaba upload y lectura reales. Se realizaron ambos por HTTP y por formulario; URL persistida en Atlas y recurso HTTP 200. **Pasa de Parcial a Cumple**, en QA. |
| S4-04 | Deshabilitar/rehabilitar usuarios; guard comprueba estado actual y baja lógica | Se probó en Atlas que la baja bloquea login y JWT previo, y la rehabilitación permite acceso. La política de 5A sigue protegiendo a **todos** los administradores: requiere decisión funcional para ampliar esa operación. **Parcial**, sin cambio improvisado. |
| S4-08 | PWA instalable, disponible offline y actualizable | Worker real NORMAL y shell sin servidores comprobados. Faltan instalación, ciclo de actualización e inspección directa de caché. **Parcial**; necesita pruebas manuales, no nueva funcionalidad demostrada necesaria. |
| G-14 | Aceptación integral con validaciones, mensajes, regresión y evidencia | Ahora hay flujos autenticados, uploads, reportes y móvil de un ancho reales. Restan las condiciones de M01/M03/M04/M14–M18 indicadas abajo. **Parcial**. |
| G-15 | Tarea 0 limitada históricamente a auditar | No existe checkpoint independiente que permita certificar retrospectivamente ese alcance; primer commit documental c8383c9 agrupa cambios posteriores. **No verificado**; no se resuelve cambiando código hoy. |

Matriz vigente de 44 requisitos: **40 Cumple / 3 Parcial / 0 No cumple / 1 No verificado**. Solo cambia el estado de S2-02. El dictamen original 5D (39/4/0/1) se conserva como antecedente en 11. Cumple no certifica un despliegue productivo ni reemplaza el contraste con los enunciados oficiales completos que no están disponibles en el repositorio.

## Entorno y aislamiento autorizados

El usuario autorizó base QA aislada, carpeta Cloudinary exclusiva, cuentas ficticias y limpieza. Indicó localhost:4200 y prohibió usar cuentas reales o desplegar Vercel. Se utilizó:

- Angular build de producción servido localmente en `http://localhost:4200`.
- NestJS compilado real en `http://localhost:4301`, con AppModule, guards, controllers, servicios y ValidationPipe existentes.
- Base **futbolcrack_qa** en el Atlas configurado, imponiendo ese nombre antes de importar AppModule; nunca la base original de la URI.
- Imágenes sintéticas del propio icono del proyecto, dentro de `futbolcrack/qa/<namespace>/publicaciones` en Cloudinary.
- Cuentas `@example.test` con prefijo aleatorio exclusivo. Registro público a través de la aplicación; promoción local de una cuenta recién creada para iniciar las pruebas administrativas. El registro público continuó forzando rol usuario.

`backend/scripts/integracion-qa.mjs` requiere el argumento explícito `--autorizar-escrituras-qa`. No forma parte del arranque productivo. Ejecuta el servicio Cloudinary real, añadiendo únicamente la carpeta QA; no simula uploads. Usa clave JWT efímera de este Nest QA. Adapta el origen API **solo en una copia ignorada del build**, regenerando hashes con el generador oficial Angular. Esas adaptaciones permiten probar localhost sin cambiar la aplicación ni su configuración de producción.

Ejemplo del club: abrimos una cancha de práctica con jugadores ficticios, separada del padrón real. Angular envía el formulario, Nest valida identidad/DTO, MongoDB guarda la jugada y Cloudinary almacena la foto. El navegador vuelve a consultar esos registros reales. Al terminar se retira exclusivamente el material de esa práctica.

Credenciales aleatorias se mantuvieron en memoria y en un archivo privado temporal fuera de la raíz web, eliminado al limpiar. No se guardaron cookies/JWT en informes ni se publicaron contraseñas. El atributo HttpOnly se comprobó sin mostrar su valor. Localhost usa HTTP y modo desarrollo: no demuestra Secure/SameSite ni cookies entre sitios HTTPS en producción.

## Matriz M01–M18

**Aprobado** se aplica al escenario comprobado descrito en la fila. **Bloqueado** indica que parte del criterio original no pudo certificarse, aunque sus subpruebas indicadas funcionaron. No se ocultan esos pendientes detrás de una suite verde. Resultado: **10 Aprobado, 0 Fallido, 8 Bloqueado, 0 No ejecutado**. Las subpruebas pendientes se identifican explícitamente.

Entornos: **H** = HTTP real contra Nest/Atlas/Cloudinary QA; **N** = navegador integrado, build local; **A** = verificación automatizada de artefactos. Evidencia primaria: [HTTP real](evidencias-5e/http-real.json), [observaciones y repetición](evidencias-5e/observaciones-reales.json), [captura de reportes](evidencias-5e/estadisticas-qa.png), [shell sin servidores](evidencias-5e/sin-servidores-qa.png).

| ID | Escenario | Entorno | Resultado | Evidencia | Observaciones / intervención necesaria |
| --- | --- | --- | --- | --- | --- |
| M01 | Arranque, rutas y navegación | N | Bloqueado | Raíz redirige a login; registro, feed, detalle, perfil y ambos dashboards abrieron; recarga de detalle correcta | No se completó recorrido exhaustivo back/404. Completar manualmente; no se detectó ruta rota en los recorridos ejecutados. |
| M02 | Registro y login | H + N | Aprobado | Tres altas API persistidas; cuarta cuenta por formulario; login real; incorrecto 401, duplicado 409; feedback Dato válido | Login navegador usa cuentas ficticias y cookies reales. Casos inválidos adicionales cubiertos por suites, no todos repetidos visualmente. |
| M03 | Cookies entre dominios | H + N | Bloqueado | HttpOnly presente; login, autorizar y consultas posteriores funcionaron entre puertos 4200/4301 | Es el mismo sitio localhost. Sin URL QA HTTPS no se puede certificar cookies cross-site; verificar Secure/SameSite/credenciales en entorno desplegado autorizado. |
| M04 | Autorización y renovación JWT | H + N | Bloqueado | JWT emitido con exp−iat=900; autorizar sin renovar cookie; refrescar vigente aumenta expiración; fixture firmado ya vencido rechazado 401 | No se esperaron naturalmente 10/15 minutos ni pestaña suspendida. Fixture firmado con clave QA y tiempo pasado es integración del guard, no observación del aviso temporizado. Probar modal Ahora no/Extender con reloj real. |
| M05 | Logout | H + N | Aprobado | Logout real expira cookie; sin cookie me=401; botón del perfil vuelve a /login | No se afirma revocación de JWT copiado antes de expirar. Inspección directa de caché sigue en M15. |
| M06 | Perfil | H + N | Aprobado | Ficha de cuenta ficticia, avatar neutro y publicación propia visibles | No se usaron perfiles reales; no se afirma prueba de todos los casos de foto opcional en navegador. |
| M07 | Publicación e imagen | H + N | Aprobado | Multipart real con PNG; URL persistida; GET imagen y detalle 200; formulario muestra creación correcta | Dos uploads en el segundo ensayo, ambos retirados. JPEG/WebP y firmas inválidas comprobados por suites, no todos subidos externamente. |
| M08 | Likes, orden y páginas | H + N | Aprobado | Atlas con 23 publicaciones: 10/10/3; orden likes devuelve la más votada; duplicado 409 y retiro correcto; like visual 1 | Volumen y orden reales comprobados por API; no se recorrieron todas las páginas con clics. |
| M09 | Baja lógica y permisos | H + N | Aprobado | Ajeno 403; administrador 200; documento inactivo, comentarios conservados, detalle/comentarios 404 y reporte excluye baja. Modal UI identifica jugada; Cancelar cierra | Primera consulta del ensayo era incorrecta: repetición real con ObjectId aprobada. Confirmación destructiva lógica se verificó por API; en UI de publicación se comprobó Cancelar. |
| M10 | Comentarios y edición | H + N | Aprobado | Ocho comentarios, API 3/3/2 y UI acumulada 3/6/8; autor guarda y aparece Editado; otro usuario y admin ajeno 403 | Botón visible dice «Cargar más». Editor recibe foco. Siete comentarios de apoyo se crearon por API real, no mocks. |
| M11 | Administración | H + N | Aprobado | Usuario normal 403; administrador lista sin hash/clave y crea ambos roles; padrón visible con seis cuentas propias | Altas de ambos roles por API. Formulario administrativo renderizado, pero no se repitió su alta completa por navegador. |
| M12 | Suspensión y rehabilitación | H + N | Aprobado | Baja jugador bloquea login/me/autorizar/refrescar con cookie previa 401; habilitar recupera 200; modal UI Cancelar y Confirmar; estado actualizado y rehabilitado | Self/admin 409 y cuentas protegidas. Conserva política restrictiva S4-04, que sigue Parcial. |
| M13 | Reportes y fechas | H + N | Aprobado | Tres agregaciones reales: 23 publicaciones/8 comentarios antes de baja; después excluye archivadas. UI: 22 de A, 1 de ui y 8 comentarios; histórico vacío y rango invertido rechazado | Tres tipos de gráfico y tablas visibles. Rango independiente en primer reporte no altera los otros. Días inclusivos completos UTC−03:00; extremos horarios exactos cubiertos por suites, no insertados manualmente en Atlas. |
| M14 | Instalación PWA | A + N | Bloqueado | 11/11 artefactos; worker 22.2.3 real NORMAL en /ngsw/state | Navegador integrado sin flujo de instalación comprobado. Usuario debe instalar desde Chrome/Edge y abrir en standalone; no se modificaron preferencias del navegador personal. |
| M15 | Caché, offline y actualización | A + N | Bloqueado | Worker real; tras limpiar y apagar frontend/backend, raíz sirve shell de reconexión sin datos privados. Logout funcionó con worker activo | Esto corta servidores locales, no el adaptador de red completo. Pendientes Cache Storage directa, recuperación online y nueva versión/aviso de actualización. No afirmar que config sin dataGroups certifica todo el caché runtime. |
| M16 | Responsive | N | Bloqueado | Formularios, reportes y padrón observados; documento 375px y scrollWidth 375px, sin desborde global en ese ancho; captura disponible | Se solicitaron 360/390/768/1280 al emulador, pero la lectura siguió siendo 375px. No certifica esos breakpoints ni teléfono físico. Usuario debe completar anchos, teclado móvil y orientación. |
| M17 | Accesibilidad básica | N + suites | Bloqueado | Labels operables, editor enfocado, modal enfoca Cancelar; cancelar/guardar/confirmar funcionan | Pendientes recorrido completo Tab/Enter/Escape, retorno de foco, zoom y contraste. No es auditoría de accesibilidad completa. |
| M18 | Rechazos y fallos | H + N | Bloqueado | 401/403/404/409 reales; rango inválido 400; mensaje de reconexión real al apagar servidores | No se forzó 500 ni se ejecutó toda combinación de 401/403 en navegador. Casos de interceptor cubiertos por suites; faltan ensayos visuales específicos. |

## Incidencias del ensayo y correcciones

No hubo error productivo reproducible que justificara modificar aplicación, añadir una regresión productiva o alterar pruebas existentes.

1. **Nombre de cuenta QA inválido:** primer ensayo pretendía crear un nombre terminado en `_extraadmin` de más de 20 caracteres. El backend lo rechazó correctamente. Se acortó a `_ea`; en la segunda ejecución el alta administrativa real pasó. No se relajó la validación.
2. **Consulta de conservación incorrecta:** ensayo filtraba `publicacionId` con string en una ruta de esquema que no lo convierte implícitamente a ObjectId. Daba cero y parecía pérdida de comentarios. Se confirmó almacenamiento ObjectId y se corrigió únicamente el filtro del ensayo con `new Types.ObjectId(publicacion)`. Repetición real: nueva publicación con ocho comentarios, baja autorizada, ocho conservados y exclusión pública/reportes correctas. Los endpoints productivos ya convierten el identificador y no requirieron cambios.

Se conserva el resultado original fallido en `http-real.json`: segunda pasada automática **13/14** antes de corregir esa consulta cargada en memoria. La repetición suplementaria de M09 aprobó sus aserciones reales, documentada aparte en `observaciones-reales.json`; **no se presenta una tercera suite completa inexistente como 14/14**. Primer ensayo tuvo 12/14 antes de ambos ajustes.

Aviso observado: Mongoose depreca la opción `new` de `findOneAndUpdate` en favor de `returnDocument: 'after'`. Operaciones y aserciones reales correctas; no se hizo refactor general. No hubo advertencias de presupuesto en build frontend. La limitación del emulador de viewport y la falta de instalación se registran como limitaciones de evidencia, no como fallas de producto.

## Limpieza y seguridad del ensayo

Primer namespace `qa5e_547c4982`: eliminados solo sus 4 usuarios, 23 publicaciones, 8 comentarios y 1 imagen. Segundo namespace `qa5e_f1b1b117`: **6 usuarios, 25 publicaciones, 24 comentarios, 2 imágenes; 0 usuarios propios restantes**. No se hizo dropDatabase ni eliminación masiva de carpetas desconocidas. El segundo informe registra la limpieza; se eliminaron los archivos de credenciales de ambos ensayos y se cerraron servicios/pestañas propios. Restan únicamente build e informe públicos en caché local ignorada y evidencias saneadas en docs.

Se verificaron roles desde Nest, usuarios suspendidos con cookies previas, ownership de comentarios/publicaciones, contraseñas no devueltas y duración/rechazo JWT. No se verificó exposición de producción a CSRF/CORS únicamente por probar localhost; mantener la revisión de riesgos potenciales en 11. Ningún token se incluyó en capturas/JSON. Capturas contienen exclusivamente registros ficticios de QA.

## Reproducción y conceptos para estudiar

Con autorización vigente para escrituras QA, configuración local disponible y builds ya generados: desde backend, ejecutar `node --env-file=.env scripts/integracion-qa.mjs --autorizar-escrituras-qa`. No copiar valores de .env al informe. Al terminar, escribir `limpiar` en stdin si es interactivo, o crear `limpiar.senal` en el directorio privado de la ejecución indicado por el ensayo. El script verifica base y namespace antes de limpiar. No ejecutar automáticamente en CI ni contra producción.

Archivos: `backend/scripts/integracion-qa.mjs` coordina fixtures/aserciones/servidores/limpieza; `backend/src` y `frontend/src` son los componentes productivos referenciados en 00, sin cambios; `docs/evidencias-5e` guarda respuestas saneadas y capturas. Para un club, las páginas son tandas de diez jugadas y «Cargar más» trae tres notas adicionales del entrenador: offset/limit se aplica en MongoDB, no se descarga todo para ocultarlo en Angular.

Conceptos usados: HTTP real y códigos de estado, multipart/FormData, DTO/ValidationPipe, guard y autorización por rol/autor, JWT/cookies HttpOnly, hash de contraseña, referencias ObjectId, paginación y agregaciones, baja lógica, formularios Angular, Input/Output del componente de jugada, persistencia externa, Service Worker y hashes del build. La prueba de regresión funcional es el ensayo opt-in corregido; no sustituye las suites unitarias ni añade una funcionalidad al TP.

## Recomendación para entrega

Sprint 2: código y subida real comprobados; sin pendiente funcional reproducido en esta tarea. Sprint 3: flujos de comentarios y sesión API reales comprobados; falta ensayo temporizado JWT del navegador. Sprint 4: administración/reportes reales funcionan; decisión S4-04 y aceptación PWA/manual siguen abiertas. Sprint 1: navegación/formularios utilizados durante la integración, sin certificar requisitos oficiales adicionales no disponibles.

Antes de aceptar la entrega: completar M01/M03/M04/M14–M18 con la [guía de demostración](12-GUIA-DE-DEMOSTRACION.md), decidir alcance de deshabilitación de administradores y contrastar consigna oficial completa. Prioridad: instalar/actualizar PWA, revisar caché privado/logout, comprobar aviso JWT con reloj real y probar cookies en dominios HTTPS cuando exista URL QA autorizada. G-15 seguirá como limitación histórica incluso si esos ensayos pasan.

**No listo para aceptación integral todavía.** Sí hay evidencia suficiente para demostrar en localhost con Atlas/Cloudinary QA los flujos funcionales probados, utilizando nuevas cuentas ficticias: las utilizadas aquí ya se limpiaron. No hacer merge/deploy sin aprobación.

## Seguimiento de aceptación 5F — 2026-11-01

Este documento conserva los resultados históricos de 5E y su matriz M01–M18. El seguimiento vigente está en [14-ACEPTACION-FINAL.md](14-ACEPTACION-FINAL.md): respaldo 5E 6a66fc9, rama test/aceptacion-final; Angular 237/237, Nest 278/278, PWA 11/11, ambos builds correctos y dos nuevas ejecuciones HTTP reales 14/14.

Usuario autorizó baja de otro administrador (sin baja propia ni pérdida del último activo) e instalación local. S4-04 pasa a Cumple con transacción, cinco carreras reales, JWT previo revocado y modal UI; S4-08 pasa a Cumple en QA con instalación Edge, worker/update, shell offline/recuperación y 24 recursos estáticos del caché tras logout. Estado vigente: 42 Cumple, 1 Parcial (G-14), 1 No verificado (G-15). No se sobrescribe retrospectivamente el 40/3/1 de 5E.

Pendientes M01 y temporización natural M04 se ensayaron; responsive tuvo tamaños efectivos 345/375/753/1265 y detalle con comentario. M03 sigue bloqueado por HTTPS. M14/M15 se comprobaron con los alcances/contextos concretos de 14; no se confunden cachés de Edge e IAB ni corte de servidores con teléfono físico offline. Revisión complementaria M17/M18 no exhaustiva sigue identificada. Propuesta de dos proyectos QA HTTPS en 14, preparada pero no desplegada ni autorizada para ejecutar. Sin merge/push/deploy.
