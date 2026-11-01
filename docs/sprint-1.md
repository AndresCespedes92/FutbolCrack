# Sprint 1 — Estructura Angular y navegación (reconstrucción para entrega)

Este archivo faltaba al iniciar 5D. Se reconstruye a partir del enunciado Sprint 1 aportado y del código actual; **no es un registro histórico inventado de cada edición original**. Las funcionalidades de backend/seguridad incorporadas después fueron autorizadas en tareas posteriores y no se atribuyen al primer sprint.

## Pantallas, rutas y estructura

| Pantalla | Carpeta | Función actual |
| --- | --- | --- |
| Login, /login | frontend/src/app/pages/login/ | Acceso por correo/usuario y contraseña, mensajes y navegación |
| Registro, /registro | frontend/src/app/pages/registro/ | Nueve campos, formularios reactivos y validación roja/verde |
| Publicaciones, /publicaciones | frontend/src/app/pages/publicaciones/ | Contenedor de feed, tarjetas y navegación; hoy conectado a API |
| Mi Perfil, /mi-perfil | frontend/src/app/pages/mi-perfil/ | Ficha de jugador y últimas jugadas; hoy protegido por sesión |

`frontend/src/app/app.routes.ts` define Routes y lazy loadComponent. Navbar usa routerLink/routerLinkActive; App coloca router-outlet. Cada componente separa .ts/.html/.css. Se usan bindings, @if/@for, FormGroup/FormControl, servicios/DI y comunicación Input/Output. Las rutas protegidas y la API actuales pertenecen a ampliaciones posteriores; en Sprint 1 se pedía navegación visual sin autenticación simulada.

## Diseño y decisiones

Variables en frontend/src/styles.css: carbón #101310, musgo #596b42, musgo oscuro #34452f, grafito #242824, gris #929990 y blanco #f1f1e9. Componentes conservan identidad futbolera, foco visible, estados y media queries. El usuario pidió posteriormente bordes redondeados: radios globales 12/20 px, sin reinterpretar como error las instrucciones iniciales anteriores. Favicon propio en frontend/public/favicon.svg e iconos PWA posteriores en public/icons.

No se ofrecen acciones falsas. Feed/perfil usan API y estados vacíos, no PUBLICACIONES_DEMO. 5D retiró dataset/tipo heredados y avatar con apellido ficticio; el fallback usa escudo FC. Una camiseta/ilustración genérica no se presenta como información del jugador. La apariencia responsive fue inspeccionada en CSS, no aprobada visualmente en navegador en esta auditoría.

## Relación verificable con CineBera

En 5D se inspeccionaron en el workspace vecino, solo lectura:

- CineBera/src/app/forms/registro-form.ts: factoría que crea FormGroup nuevo, Validators y confirmación.
- CineBera/src/app/pages/registro/registro.html: formGroup/ngClass y feedback de campos.
- CineBera/src/app/components/pelicula-card/pelicula-card.ts: Input requerido y Output desde tarjeta.

FutbolCrack aplica esos conceptos en forms/registro-form.ts, pages/registro y PublicacionCard; adapta nombres, reglas, dominio y estilos. No se afirma igualdad byte a byte ni copia literal/histórica de archivos: la evidencia disponible demuestra relación de patrones/conceptos. No se modificó CineBera ni se importó su Angular Material al proyecto.

## Ejecutar, estudiar y probar

Desde frontend, `npm start` inicia desarrollo; `npm run build` compila; `node node_modules/@angular/cli/bin/ng.js test --watch=false` ejecuta Angular. El destino API actual es la constante pública de services/api.config.ts; las condiciones backend/env/credenciales se preparan fuera de la proyección. Para el estado inicial de 5D hubo 230 pruebas; al finalizar 236. Pruebas de navegación en app.spec.ts y registro en registro.spec.ts, formularios en registro-form.spec.ts. Detalle de resultados y limitaciones en 08/11.

Recorrido para estudiar: main.ts → App/AppConfig → Routes → Navbar/RouterOutlet → página → plantilla/bindings → servicio o Output. Ejemplo del club: la tarjeta de una jugada recibe información del padre y le avisa que el jugador pulsó Me gusta; la tarjeta no conoce MongoDB.

Pendientes de aceptación: revisión visual en tamaños móvil/escritorio y teclado/navegador real, junto con integración posterior. No se declara aquí que el Sprint 1 histórico incluyera JWT, administración ni PWA. Usar guia-angular.md y 12-GUIA-DE-DEMOSTRACION.md para la defensa del estado completo.
