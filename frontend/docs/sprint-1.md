# Sprint 1 — FutbolCrack

## Alcance implementado

Frontend Angular para una red social donde los jugadores muestran su juego y su CV, y donde también se pueden publicar pruebas de jugadores. Se conserva un único tipo de perfil: no se creó un panel ni roles específicos de reclutadores.

Los cuatro bloques autorizados están implementados: base visual y navegación; pantallas; registro con validación local; documentación y comprobaciones. La revisión visual en navegador tiene la limitación indicada en Verificación.

### Pantallas

- **Login:** usuario o correo, contraseña, enlaces a Registro y al feed. Formulario visual sin inicio de sesión.
- **Registro:** nueve campos organizados en datos personales, acceso y presentación. Reactive Forms, NgClass, estados neutro/rojo/verde, mensajes y validación local de imagen. Crear cuenta permanece deshabilitado aun con datos válidos.
- **Publicaciones:** cuatro ejemplos ficticios: jugada con espacio para video, convocatoria de club, entrenamiento ilustrado y comentario sobre el juego. Likes y comentarios son cifras de ejemplo.
- **MiPerfil:** CV visual con avatar, usuario, descripción, posiciones, pierna hábil, categoría, localidad, club, trayectoria, características y búsqueda de pruebas. Muestra solo las dos publicaciones del jugador de ejemplo.

No hay reproducción real de video, fotos reales, postulaciones, edición del CV, publicación de contenido, persistencia, API, JWT o autenticación simulada. La imagen seleccionada en el registro se mantiene únicamente en memoria durante esa visita; no se lee su contenido ni se sube.

## Estructura y rutas

```text
frontend/
  src/
    main.ts
    styles.css
    index.html
    app/
      app.ts / app.html / app.css
      app.config.ts / app.routes.ts / app.spec.ts
      components/
        navbar/                  # Marca y enlaces compartidos
        publicacion-card/        # Tarjeta reutilizada en feed y perfil
      pages/
        login/
        registro/                # Incluye registro.spec.ts
        publicaciones/
        mi-perfil/
      forms/
        registro-form.ts
        registro-form.spec.ts
      validators/
        registro.validators.ts
      models/
        publicacion.ts
      data/
        publicaciones-demo.ts
  public/
    favicon.svg
    images/cancha-demo.svg
    images/jugador-demo.svg
  docs/
    sprint-1.md
    guia-angular.md
```

Cada componente separa TypeScript, HTML y CSS. Los comentarios en español explican responsabilidad, decisiones y conceptos. Los CSS tienen secciones comentadas para ubicar layout, tipografía, estados y cortes responsive.

| Ruta                     | Componente                     |
| ------------------------ | ------------------------------ |
| `/login`                 | Login                          |
| `/registro`              | Registro                       |
| `/publicaciones`         | Publicaciones                  |
| `/mi-perfil`             | MiPerfil                       |
| `/` y rutas desconocidas | Redirección a `/publicaciones` |

App contiene Navbar y RouterOutlet. RouterLink cambia la URL sin recargar el documento, loadComponent carga la pantalla correspondiente y RouterLinkActive indica el enlace activo. Las rutas son públicas y tienen títulos de página.

## Conceptos de Angular utilizados

- Componentes standalone e imports locales.
- Angular Router, provideRouter, RouterOutlet, RouterLink y RouterLinkActive.
- Interpolación, property binding, attribute binding y eventos.
- @for con track por id y @if para contenido opcional.
- @Input requerido para entregar una publicación desde feed o perfil a PublicacionCard.
- ReactiveFormsModule, FormGroup, FormControl, Validators y validadores personalizados.
- NgClass y bindings de clases para estados visuales.
- Estados dirty/touched/valid/invalid y validación cruzada del grupo.
- Configuración de Router mediante providers; no se añadieron servicios propios porque no hay consultas HTTP ni estado persistente.

## Validaciones del registro

| Campo             | Regla                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Nombre y apellido | Obligatorios, 2–50 caracteres; letras Unicode con espacios, guiones y apóstrofes entre palabras.                    |
| Correo            | Obligatorio, Validators.email; no consulta si existe.                                                               |
| Usuario           | Obligatorio, 3–20 caracteres; comienza con letra o número, permite letras sin acentos, números, punto y guion bajo. |
| Contraseña        | Obligatoria, 8–64 caracteres y al menos un carácter distinto de espacio.                                            |
| Confirmación      | Obligatoria y coincidente con la primera contraseña.                                                                |
| Fecha             | Obligatoria, real y no futura; sin restricción de edad mínima.                                                      |
| Descripción       | Opcional, máximo 300 caracteres.                                                                                    |
| Imagen            | Opcional; JPEG, PNG o WebP, hasta 5 × 1024 × 1024 bytes.                                                            |

Los controles empiezan neutros. Después de escribir o salir del campo, el borde y el mensaje pasan a rojo o verde según el resultado. Un opcional vacío permanece neutro. La confirmación consulta también el error de coincidencia del grupo; se actualiza aunque cambie la contraseña original. Los campos correctos conservan el verde mientras sigan siendo válidos.

Los mensajes se relacionan con los controles mediante aria-describedby; aria-invalid expresa el error y aria-live permite anunciar los cambios. El estado se comunica con texto además de color. No se bloquean teclas: las reglas también comprueban texto pegado.

## Reutilización verificable de CineBera

Se inspeccionaron los siguientes archivos del proyecto vecino `../CineBera/`:

| Origen                                                | Adaptación                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| `src/app/app.ts`, `app.html`, `app.routes.ts`         | Componentes standalone, outlet y carga por ruta.                    |
| `src/app/pages/login/login.ts`                        | Enlaces contextuales mediante RouterLink.                           |
| `src/app/components/pelicula-card/pelicula-card.ts`   | Tarjeta con dato requerido mediante Input.                          |
| `src/app/pages/registro/registro.ts`, `registro.html` | Formulario reactivo, NgClass, interacción y mensajes.               |
| `src/app/forms/registro-form.ts`                      | Función que construye el formulario fuera del componente.           |
| `src/app/validators/confirmar-password.validator.ts`  | Comparación de claves a nivel grupo.                                |
| `src/app/validators/fecha-nacimiento.validator.ts`    | Fecha real y no futura, adaptada de tres controles a un input date. |

Se escribieron implementaciones nuevas a partir de esos conceptos verificados; no se trasladaron archivos íntegros ni se reutilizaron servicios o autenticación. El mínimo de contraseña pasó de 6 a 8; se agregaron reglas para usuario, descripción e imagen y se usa dirty o touched para responder al escribir. No se incorporaron Supabase, Material, roles ni guards.

## Decisiones visuales

La paleta global mantiene carbón `#101310`, musgo `#596B42`, musgo oscuro `#34452F`, grafito `#242824`, cemento `#929990` y hueso `#F1F1E9`. Se añadieron rojo claro y verde claro únicamente para estados de validación sobre fondos oscuros.

Los radios `--radius-control` y `--radius-card` unifican controles y tarjetas redondeados, según la actualización solicitada. La identidad deportiva se expresa mediante dorsales, cancha, camiseta y tipografía contundente. No se añadieron librerías visuales ni fuentes externas. Los SVG locales son ilustraciones propias, no fotografías ni material de jugadores reales.

Navbar se adapta a dos columnas en celular. Feed y CV apilan sus paneles según el ancho. Se conservan foco visible, enlace para saltar al contenido y respeto a movimiento reducido. La guía incluye una tabla de selectores para modificar el diseño manualmente.

## Archivos creados o modificados durante el sprint

### Creados

- `src/app/components/navbar/navbar.ts`, `navbar.html`, `navbar.css`.
- `src/app/components/publicacion-card/publicacion-card.ts`, `publicacion-card.html`, `publicacion-card.css`.
- `src/app/pages/login/login.ts`, `login.html`, `login.css`.
- `src/app/pages/registro/registro.ts`, `registro.html`, `registro.css`, `registro.spec.ts`.
- `src/app/pages/publicaciones/publicaciones.ts`, `publicaciones.html`, `publicaciones.css`.
- `src/app/pages/mi-perfil/mi-perfil.ts`, `mi-perfil.html`, `mi-perfil.css`.
- `src/app/forms/registro-form.ts`, `registro-form.spec.ts`.
- `src/app/validators/registro.validators.ts`.
- `src/app/models/publicacion.ts` y `src/app/data/publicaciones-demo.ts`.
- `public/favicon.svg`, `public/images/cancha-demo.svg`, `public/images/jugador-demo.svg`.
- `docs/sprint-1.md` y `docs/guia-angular.md`.

### Modificados respecto de la plantilla inicial

- `src/app/app.ts`, `app.html`, `app.css`, `app.routes.ts`, `app.spec.ts`.
- `src/app/app.config.ts` y `src/main.ts`: comentarios sobre Router y arranque.
- `src/styles.css` y `src/index.html`.
- `README.md`: acceso a las guías y comandos reales del proyecto.

No se modificó backend ni se agregaron dependencias. La rama utilizada es `feature/frontend-layout`; no se realizaron commits ni merges automáticos.

## Ejecutar y probar

Desde la raíz del repositorio:

```powershell
cd frontend
npm install  # Solo si faltan las dependencias
npm start
```

Abrir `http://localhost:4200`. En otra terminal, dentro de frontend:

```powershell
npm run build
node node_modules/@angular/cli/bin/ng.js test --watch=false
```

El comando de pruebas usa CLI directamente porque npm 12 rechazó el reenvío de --watch en este entorno. Para compilar también se puede ejecutar `node node_modules/@angular/cli/bin/ng.js build`.

### Comprobación manual

1. Abrir las cuatro rutas desde Navbar y directamente desde la URL. Revisar enlace activo y título.
2. Probar inicio y una URL desconocida: deben llevar al feed.
3. En registro, comprobar neutro inicial, campo vacío al salir, valor inválido, corrección y borrado.
4. Corregir contraseñas diferentes y volver a cambiar la primera para verificar la confirmación.
5. Probar una fecha futura, una descripción de más de 300 caracteres y una imagen no admitida o mayor a 5 MB.
6. Completar datos válidos: el resumen cambia, pero Crear cuenta sigue deshabilitado.
7. Comparar el feed y el perfil: el perfil solo debe mostrar las dos publicaciones de Mateo.
8. Revisar a 360px, 768px y 1280px, con teclado y zoom; comprobar que mensajes y tarjetas no desborden.

### Verificación

La compilación de producción pasó sin advertencias de presupuesto. Pasaron 17 pruebas en 3 suites: navegación y composición del feed/CV (5), reglas del registro (6) y cambios de estado mediante eventos de la plantilla (6). `git diff --check` no detectó errores de espacios.

Dos ejecuciones dentro del entorno restringido fallaron con ENOENT al leer archivos temporales generados por Angular. La ejecución final fuera del aislamiento terminó correctamente; no fue necesario modificar las pruebas ni las reglas para hacerlas pasar.

El navegador integrado agotó el tiempo de conexión al servidor local durante los intentos de revisión visual. Por eso no se afirma una verificación visual de escritorio o celular. El CSS responsive está implementado y queda el recorrido manual anterior para revisar el resultado en el navegador del usuario.

## Fuera de alcance y pendientes funcionales

- Integración con NestJS, creación de cuentas y autenticación real.
- Validación de disponibilidad de correo y usuario en servidor.
- Persistencia, edición y exportación del CV.
- Carga, almacenamiento y reproducción de fotos o videos reales.
- Publicar, comentar, dar likes y participar en pruebas.

No se avanzó sobre esas funciones. La guía `docs/guia-angular.md` contiene el recorrido de estudio, ejemplos reales, mapa de CSS y preguntas para la defensa.
