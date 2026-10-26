# Guía Angular — FutbolCrack, Sprint 1

Esta guía explica el código existente y dónde modificarlo. Todos los caminos son relativos a `frontend/`. El propósito es mostrar el talento de jugadores, reunir su CV futbolístico y presentar oportunidades de pruebas. Se usa un único tipo de perfil, sin panel de reclutadores.

## 1. Mapa de componentes

| Componente      | Archivos                                                 | Responsabilidad                                                                        |
| --------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| App             | `src/app/app.ts`, `app.html`, `app.css`                  | Contenedor, Navbar, RouterOutlet y pie compartido.                                     |
| Navbar          | `src/app/components/navbar/navbar.*`                     | Marca y enlaces a las cuatro pantallas; indica cuál está activa.                       |
| Login           | `src/app/pages/login/login.*`                            | Formulario visual de acceso y enlaces; no inicia sesión.                               |
| Registro        | `src/app/pages/registro/registro.*`                      | Formulario reactivo, estados rojo/verde, mensajes y selección local de imagen.         |
| Publicaciones   | `src/app/pages/publicaciones/publicaciones.*`            | Lista las cuatro publicaciones de demostración.                                        |
| MiPerfil        | `src/app/pages/mi-perfil/mi-perfil.*`                    | CV visual y publicaciones del jugador ficticio con autorId 10.                         |
| PublicacionCard | `src/app/components/publicacion-card/publicacion-card.*` | Presenta autor, mensaje, imagen opcional, espacio de video, convocatoria y contadores. |

`.*` representa tres archivos separados: `.ts`, `.html` y `.css`. Los componentes son standalone: declaran en `imports` las directivas y componentes que usan, sin un módulo de aplicación propio.

Otros archivos importantes:

- `src/main.ts`: inicia Angular con `bootstrapApplication(App, appConfig)`.
- `src/app/app.config.ts`: registra Router mediante `provideRouter(routes)`.
- `src/app/app.routes.ts`: relaciona URLs con pantallas.
- `src/app/forms/registro-form.ts`: crea los controles y reúne las reglas del registro.
- `src/app/validators/registro.validators.ts`: coincidencia de claves, fecha y archivo de imagen.
- `src/app/models/publicacion.ts`: define las interfaces Publicacion y PruebaJugadores.
- `src/app/data/publicaciones-demo.ts`: datos ficticios compartidos por feed y perfil.
- `src/styles.css`: variables, controles y estilos globales.
- `public/favicon.svg` y `public/images/`: ilustraciones locales, sin dependencias externas.

## 2. Relación entre TypeScript, HTML y CSS

En `registro.ts`, el decorador tiene `templateUrl: './registro.html'` y `styleUrl: './registro.css'`. TypeScript mantiene el formulario y sus métodos; HTML muestra los datos y conecta eventos; CSS define cómo se ve la pantalla.

Angular limita los estilos de cada componente a su plantilla mediante encapsulación. Por eso `registro.css` colorea los campos del registro sin cambiar el login. `styles.css` es global: sus variables y reglas compartidas sí alcanzan a todas las pantallas. Las variables CSS se heredan y permiten usar `var(--color-primary)` en cualquier componente.

Para una modificación puntual, empezá por el CSS de la pantalla. Para cambiar todos los botones o la paleta, usá el CSS global. No edites `dist/`: contiene archivos generados que se reemplazan al compilar.

## 3. Routing y recorrido de navegación

La configuración real de una ruta es:

```ts
{ path: 'registro', title: 'Registro | FutbolCrack', loadComponent: () => import('./pages/registro/registro').then(m => m.Registro) }
```

`path` es el tramo de la URL; `title` actualiza el título de la pestaña; `loadComponent` carga la pantalla cuando se navega a ella.

| URL                       | Pantalla                          |
| ------------------------- | --------------------------------- |
| `/publicaciones`          | Feed de ejemplos                  |
| `/mi-perfil`              | CV del jugador de ejemplo         |
| `/login`                  | Acceso visual                     |
| `/registro`               | Registro con validaciones locales |
| `/`                       | Redirige a Publicaciones          |
| Cualquier URL desconocida | Redirige a Publicaciones          |

Recorrido paso a paso:

1. El navegador abre la aplicación y `main.ts` inicia App.
2. `app.config.ts` registra las rutas para el servicio Router de Angular.
3. App mantiene Navbar y `<router-outlet />` en su HTML.
4. Al abrir `/`, Angular redirige a `/publicaciones` y coloca Publicaciones en RouterOutlet.
5. Publicaciones recorre `PUBLICACIONES_DEMO` y entrega un objeto a cada PublicacionCard.
6. Al pulsar Mi perfil, `routerLink="/mi-perfil"` cambia la URL sin recargar el documento.
7. RouterOutlet reemplaza Publicaciones por MiPerfil; la barra y el pie permanecen.
8. MiPerfil usa `filter` en TypeScript para mostrar solo el material cuyo `autorId === 10`.
9. Al navegar al registro, Angular crea un componente con su propio FormGroup. Los datos no se guardan al salir de la pantalla.
10. `RouterLinkActive` marca el enlace seleccionado y `ariaCurrentWhenActive="page"` lo comunica al lector de pantalla.

Todas las rutas son públicas. No hay guards de acceso ni una sesión iniciada. En un futuro despliegue, el servidor también deberá entregar `index.html` para las URLs internas; el servidor de desarrollo de Angular ya permite abrirlas directamente.

## 4. Bindings, directivas y comunicación

Ejemplos del código real:

```html
<!-- Interpolación: muestra un dato del objeto recibido. -->
<strong>{{ publicacion.autor }}</strong>

<!-- Property binding: Angular asigna la URL a la propiedad src. -->
<img
  [src]="publicacion.imagen"
  [alt]="publicacion.imagenDescripcion || 'Imagen de la publicación de ejemplo'"
/>

<!-- Binding de atributo: el identificador relaciona el artículo con su título. -->
<article [attr.aria-labelledby]="'publicacion-' + publicacion.id"></article>
```

En `publicaciones.html`:

```html
@for (publicacion of publicaciones; track publicacion.id) {
<app-publicacion-card [publicacion]="publicacion" />
}
```

`@for` repite una tarjeta por dato. `track` identifica cada publicación por su id. El padre entrega el objeto usando `[publicacion]`; en `publicacion-card.ts`, el hijo lo recibe mediante:

```ts
@Input({ required: true }) publicacion!: Publicacion;
```

El `!` informa a TypeScript que el padre asignará ese dato. `required: true` exige que el padre incluya el binding. La interface Publicacion describe la forma del dato; no genera una tabla ni guarda información.

En la tarjeta:

```html
@if (publicacion.convocatoria; as prueba) {
<dl class="trial-details">
  <div>
    <dt>Dónde</dt>
    <dd>{{ prueba.lugar }}</dd>
  </div>
</dl>
}
```

`@if` muestra la sección si existe convocatoria y `as prueba` crea un nombre breve dentro del bloque. Otros @if presentan imágenes y el espacio de video únicamente cuando corresponden. No hay un reproductor funcional ni fotos reales.

El binding `[class.trial-type]="publicacion.convocatoria"` destaca la etiqueta de una prueba. Esto cambia el estilo de una publicación, sin crear un rol de cuenta distinto.

No se incorporaron outputs porque las tarjetas no emiten acciones. Tampoco hay servicios propios: los datos son constantes y no existen consultas HTTP. Angular proporciona Router por inyección de dependencias a las directivas de navegación mediante `provideRouter`; no necesitamos construir otro servicio para navegar.

## 5. Formulario reactivo y reglas de registro

`crearFormularioRegistro()` devuelve un FormGroup nuevo. Cada FormControl representa un dato, su valor y sus errores. `nonNullable: true` mantiene los controles de texto como strings; la imagen usa `File | null` porque no elegir archivo es válido.

| Campo               | Reglas implementadas                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nombre y apellido   | Obligatorios, 2–50 caracteres; letras Unicode, espacios, guiones o apóstrofes entre palabras. Sin números, espacios iniciales/finales ni separadores consecutivos. |
| Correo              | Obligatorio y validado con Validators.email. Sin comprobación de existencia o disponibilidad.                                                                      |
| Usuario             | Obligatorio, 3–20 caracteres; letras sin acentos, números, punto y guion bajo. Comienza con letra o número.                                                        |
| Contraseña          | Obligatoria, 8–64 caracteres; al menos uno distinto de espacio.                                                                                                    |
| Repetir contraseña  | Obligatorio y debe coincidir exactamente con la primera contraseña.                                                                                                |
| Fecha de nacimiento | Obligatoria, fecha real e igual o anterior a hoy. No se impuso una edad mínima.                                                                                    |
| Descripción         | Opcional, máximo 300 caracteres.                                                                                                                                   |
| Imagen              | Opcional; MIME JPEG, PNG o WebP, hasta 5 × 1024 × 1024 bytes.                                                                                                      |

Ejemplo real de `registro-form.ts`:

```ts
correo: new FormControl('', {
  nonNullable: true,
  validators: [Validators.required, Validators.email],
}),
```

En HTML:

```html
<form
  [formGroup]="registroForm"
  (ngSubmit)="$event.preventDefault()"
  aria-describedby="aviso-registro"
  novalidate
></form>
```

`[formGroup]` conecta la plantilla al modelo y `formControlName="correo"` enlaza un input con su control. ReactiveFormsModule aporta estas directivas. `novalidate` deja los mensajes a Angular; no evita los validadores del FormGroup. `(ngSubmit)` cancela cualquier envío, incluso desde Enter. El botón Crear cuenta siempre está deshabilitado.

Las validaciones se ejecutan localmente: cumplirlas no crea una cuenta, no confirma que el correo exista y no verifica que un usuario esté libre. Cuando exista backend, ese servidor también deberá comprobar los datos.

### Cómo funciona ngClass y cuándo cambia el color

Ejemplo real del campo nombre:

```html
[ngClass]="clasesCampo(campos.nombre)" [attr.aria-invalid]="esInvalido(campos.nombre)"
```

`campos` es un alias de `registroForm.controls`. `clasesCampo` devuelve:

```ts
return {
  'input-invalido': this.esInvalido(control),
  'input-valido': this.esValido(control),
};
```

NgClass agrega las clases cuyo valor sea true y quita las otras. El CSS del registro define el borde de cada estado.

- `pristine`: el usuario todavía no cambió el valor.
- `dirty`: cambió el valor desde la interfaz.
- `untouched`: todavía no salió del control.
- `touched`: salió del control, normalmente mediante blur.
- `valid` / `invalid`: resultado de las reglas, independiente de haber interactuado.

El campo empieza neutro. Al escribir (`dirty`) o salir (`touched`), se colorea según su validez. Si se corrige, pasa de rojo a verde; si se vuelve a romper la regla, regresa a rojo. El verde se mantiene mientras el dato sea válido. Los opcionales vacíos quedan neutros, incluso después de editarlos. Los mensajes dicen qué corregir o muestran «Dato válido», para no depender solamente del color.

### Contraseñas, fechas e imagen

`confirmarClaveValidator` se aplica al grupo porque compara dos controles. Devuelve `{ clavesNoCoinciden: true }` cuando hay dos valores distintos. El control repetirClave podría tener `valid === true` por su regla required y, aun así, el grupo ser inválido por la comparación. Por eso `esInvalido` consulta también el error del grupo para pintar la confirmación. Se recalcula al cambiar cualquiera de las claves, sin suscripciones manuales.

La fecha usa un input date. El validador compara año, mes y día con la fecha construida para detectar días inexistentes; después rechaza fechas futuras. Se usa medianoche local y se evita toISOString para no desplazar un día por UTC. `fechaLocalHoy()` también calcula el atributo max del calendario con el día local del navegador.

El archivo no usa formControlName: el navegador no permite escribir un objeto File como valor de un input. `(change)="seleccionarImagen($event)"` toma el archivo seleccionado y lo entrega al FormControl imagenPerfil; luego marca el control como dirty y touched. El control verifica MIME y tamaño. `accept` ayuda a filtrar el selector, pero no sustituye la validación. La comprobación del navegador no inspecciona el contenido real del archivo. No hay lectura, vista previa, subida o persistencia de la imagen.

## 6. Relación verificable con CineBera

Se inspeccionó el proyecto vecino `../CineBera/`. Estas son las fuentes y sus adaptaciones:

| Fuente inspeccionada                                   | Concepto adaptado                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `src/app/app.ts`, `app.html`, `app.routes.ts`          | Componentes standalone, RouterOutlet y loadComponent para cuatro pantallas públicas. |
| `src/app/pages/login/login.ts`                         | RouterLink para navegación contextual, sin copiar autenticación.                     |
| `src/app/components/pelicula-card/pelicula-card.ts`    | Tarjeta reutilizable con un dato requerido mediante @Input.                          |
| `src/app/pages/registro/registro.ts` y `registro.html` | ReactiveFormsModule, NgClass, clases según validez e interacción y mensajes.         |
| `src/app/forms/registro-form.ts`                       | Función que crea un FormGroup separado de la pantalla.                               |
| `src/app/validators/confirmar-password.validator.ts`   | Validación a nivel grupo para confirmar contraseñas.                                 |
| `src/app/validators/fecha-nacimiento.validator.ts`     | Comprobar fecha real y no futura. Aquí se adapta a un único input date.              |

El código de FutbolCrack se escribió para este proyecto a partir de esos conceptos verificados; no se trasladaron archivos íntegros. Se cambió el mínimo de contraseña de 6 a 8, se agregaron usuario, descripción e imagen, se aceptan nombres compuestos y se utiliza dirty o touched para responder al escribir. CineBera usa tres controles para la fecha; aquí se usa uno. No se copiaron Material, Supabase, servicios de autenticación, roles ni guards.

## 7. Guía para modificar el diseño a mano

Los CSS tienen comentarios por sección. `gap` separa elementos de una grilla o flex; `padding` da espacio dentro; `margin` da espacio fuera; `max-width` limita el ancho. `grid-template-columns` define las proporciones. `@media` cambia reglas según el ancho disponible, no según una marca de teléfono.

| Qué querés cambiar          | Archivo y selector                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Colores de toda la app      | `src/styles.css`, variables dentro de :root.                                                            |
| Rojo y verde de validación  | `--color-error`, `--color-success` en styles.css; clases input-invalido e input-valido en registro.css. |
| Redondeado general          | `--radius-control` para botones/campos y `--radius-card` para tarjetas.                                 |
| Tamaño de botones           | `.button` en styles.css: padding, font-weight, border-radius.                                           |
| Texto o color de un campo   | `.field` en styles.css; estados del registro en registro.css.                                           |
| Ancho total y márgenes      | `src/app/app.css`, selector main.                                                                       |
| Barra y enlaces activos     | `components/navbar/navbar.css`, nav, nav a y nav a.active.                                              |
| Cancha decorativa del login | `pages/login/login.css`, .pitch y sus elementos internos.                                               |
| Columnas del registro       | `pages/registro/registro.css`, .registration-layout y .form-grid.                                       |
| Feed y lateral              | `pages/publicaciones/publicaciones.css`, .feed-layout y .feed-aside.                                    |
| CV y trayectoria            | `pages/mi-perfil/mi-perfil.css`, .player-card, .cv-layout y .career-list.                               |
| Cada publicación            | `components/publicacion-card/publicacion-card.css`, .post, .post-body y .post-footer.                   |
| Datos de publicaciones      | `data/publicaciones-demo.ts`, no el HTML de la tarjeta.                                                 |
| Datos del CV de ejemplo     | `pages/mi-perfil/mi-perfil.html`. El filtro del material está en mi-perfil.ts.                          |
| Reglas del formulario       | `forms/registro-form.ts`; casos personalizados en validators/registro.validators.ts.                    |

Ejemplo: para redondear más todas las tarjetas, modificá en styles.css:

```css
--radius-card: 24px;
```

Para ensanchar el registro respecto de su presentación, cambiá en registro.css:

```css
.registration-layout {
  grid-template-columns: 0.7fr 1.3fr;
}
```

Los cortes principales son 850px para registro/feed, 760px para navbar/login y 700px para perfil. Hay ajustes adicionales de padding y columnas a 600, 540, 480 y 380px. Al modificar uno, revisá al menos 360px, 768px y un escritorio de 1280px. Evitá anchos fijos grandes en inputs o tarjetas. `minmax(0, 1fr)` y `min-width: 0` permiten que el contenido se reduzca; `flex-wrap` permite pasar a otra fila.

La accesibilidad usa etiquetas for/id, grupos fieldset/legend, ayudas aria-describedby, estados aria-invalid, regiones aria-live, foco visible, enlace para saltar al contenido y movimiento reducido. Los avisos de demostración explican qué acciones están pendientes.

## 8. Cómo probar y estudiar

Desde `frontend/`:

```powershell
npm start
npm run build
node node_modules/@angular/cli/bin/ng.js test --watch=false
```

El primer comando inicia el servidor y queda abierto; ejecutá los otros en otra terminal. Se usa Angular CLI directamente para las pruebas porque npm 12 rechazó el reenvío de --watch en este entorno.

Recorrido de práctica:

1. Abrí `/publicaciones`: identificá el @for y el @Input que producen cada tarjeta.
2. Buscá una convocatoria y seguí su propiedad desde publicaciones-demo.ts hasta el @if de la tarjeta.
3. Abrí Mi perfil y encontrá el filter que limita el material al jugador de ejemplo.
4. Abrí Registro: los campos deben estar neutros.
5. Salí del nombre vacío: aparece rojo con mensaje. Escribí «María»: pasa a verde. Pegá «María123»: vuelve a rojo.
6. Probá correo incorrecto y después `mateo@ejemplo.com`.
7. Escribí una contraseña de 8 caracteres y otra distinta; corregí la confirmación. Luego cambiá la primera: la confirmación vuelve a rojo.
8. Intentá una fecha futura; si el calendario la impide, su atributo max está actuando. Las pruebas también ejercitan el validador directamente.
9. Escribí 301 caracteres de descripción: aparece un error; al borrarla queda neutra por ser opcional.
10. Elegí una imagen admitida de menos de 5 MB y luego una demasiado grande. Al navegar fuera, el archivo no se guarda.
11. Aunque el formulario sea válido, Crear cuenta sigue deshabilitado.
12. Reducí el navegador y recorré los enlaces con Tab; revisá que los mensajes largos no generen scroll horizontal.

Pruebas: `app.spec.ts` cubre navegación y composición; `forms/registro-form.spec.ts` cubre reglas y límites; `pages/registro/registro.spec.ts` comprueba eventos reales y colores del DOM. No reemplazan una revisión visual en navegador.

## 9. Preguntas para la defensa

**¿Cuál es la finalidad de FutbolCrack?** Mostrar el juego y CV de futbolistas para ganar visibilidad y conectar con oportunidades; clubes o buscadores pueden publicar pruebas desde el mismo tipo de perfil.

**¿Qué hace un componente standalone?** Declara sus propias dependencias en imports y no necesita un NgModule propio para usarse.

**¿Por qué separar TS, HTML y CSS?** Para encontrar por separado comportamiento, estructura y presentación, y poder modificarlos sin mezclar responsabilidades.

**¿Qué hace RouterOutlet?** Aloja la pantalla que corresponde a la URL. Navbar permanece fuera y no se reemplaza.

**¿Para qué sirve loadComponent?** Para cargar una pantalla cuando se solicita su ruta.

**¿Cómo llega una publicación a su tarjeta?** El padre la entrega con [publicacion] y el hijo la declara como @Input requerido.

**¿Por qué usar una interface?** Para que TypeScript compruebe los campos del objeto y ayude a detectar errores de nombres o tipos durante el desarrollo.

**¿Qué diferencia hay entre FormControl y FormGroup?** Un control representa un campo; el grupo reúne los controles y puede tener reglas que comparen varios.

**¿Por qué usar ngClass si Angular ya valida?** La validación calcula errores; ngClass traduce esos estados a clases CSS visibles.

**¿Por qué no colorear todo al abrir el registro?** Los controles aún no fueron editados ni abandonados. Mostrar rojo de entrada dificultaría distinguir lo que el usuario ya intentó completar.

**¿Por qué la confirmación consulta el grupo?** La coincidencia depende de dos valores. Un required válido en la confirmación no asegura que coincida con la clave original.

**¿Por qué un opcional vacío no aparece verde?** Aunque sea válido para Angular, no existe un dato que confirmar visualmente.

**¿Para qué sirven los colores y los textos juntos?** Para comunicar el estado aunque el usuario no distinga los colores o utilice un lector de pantalla.

**¿Por qué no hay servicios propios?** Solo hay datos locales fijos y validación de formulario; todavía no hay persistencia, API ni acciones compartidas que los necesiten.

**¿Qué se adaptó de CineBera?** Navegación, tarjeta con Input, organización del formulario, clases de validación y validadores de grupo/fecha. La tabla de fuentes indica dónde se verificó cada concepto.

**¿Por qué no se puede crear una cuenta si todo está verde?** Verde indica validez local. La creación de cuentas y la autenticación todavía no se integraron.

**¿El CV se puede editar o descargar?** Todavía es una presentación estática. La edición, exportación y persistencia quedan para otra etapa.

**¿Se pueden reproducir o subir videos?** No. Hay espacios visuales identificados como demostración; los contadores, comentarios y convocatorias tampoco tienen acciones reales.
