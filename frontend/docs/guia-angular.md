# Guía de estudio de Angular — bloque 1

## Componentes y sus archivos

`src/app/app.ts` declara el componente raíz; `app.html` contiene Navbar y RouterOutlet; `app.css` organiza el contenido y pie. Cada componente enlaza su plantilla con `templateUrl` y sus estilos con `styleUrl`. TypeScript define la responsabilidad, HTML la estructura y CSS la presentación.

`src/app/components/navbar/` contiene la navegación compartida. `src/app/pages/login/`, `registro/`, `publicaciones/` y `mi-perfil/` contienen las cuatro pantallas provisionales. Son componentes standalone: declaran sus dependencias en imports, sin módulos propios.

## Recorrido de una navegación

1. `main.ts` inicia la aplicación con su configuración.
2. `app.config.ts` registra `provideRouter(routes)`.
3. App muestra Navbar y el espacio RouterOutlet.
4. Al pulsar `<a routerLink="/mi-perfil">Mi perfil</a>`, Router cambia la URL sin recargar el documento.
5. La ruta usa `loadComponent` para cargar MiPerfil y mostrarlo en RouterOutlet.
6. RouterLinkActive destaca el enlace y `ariaCurrentWhenActive="page"` comunica la página activa a lectores de pantalla.

Al abrir `/` o una URL desconocida se muestra Publicaciones mediante una redirección.

## Bindings, directivas y formularios

En este bloque se utilizan las directivas RouterLink y RouterLinkActive con valores estáticos. No se incorporaron todavía formularios, @if, @for ni comunicación de datos entre componentes. App compone Navbar mediante `<app-navbar />`; no necesita inputs u outputs para esta navegación fija. Estos conceptos se documentarán si se utilizan en los bloques siguientes.

## Relación verificable con CineBera

Se revisaron `../CineBera/src/app/app.ts`, `app.html` y `app.routes.ts`. Allí se utilizan componentes standalone, RouterOutlet y loadComponent. Se adaptaron esos conceptos a las cuatro pantallas de fútbol mediante código nuevo. Las rutas de este sprint son públicas y no incorporan los guards de CineBera.

## Preguntas para la defensa

- ¿Qué hace RouterOutlet? Muestra el componente que corresponde a la URL actual.
- ¿Por qué usar routerLink? Permite navegar mediante Angular Router sin solicitar otra página al servidor.
- ¿Para qué sirve loadComponent? Carga el componente cuando se navega a su ruta.
- ¿Dónde cambio la paleta? En las variables de `src/styles.css`, compartidas por todos los componentes.
- ¿Ingresar inicia sesión? No. En este bloque solo existe la estructura de la pantalla; no hay autenticación.
- ¿Qué falta? Implementar el contenido del bloque 2 y ampliar los ejemplos de esta guía en el bloque 3.
