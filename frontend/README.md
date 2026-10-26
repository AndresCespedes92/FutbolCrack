# FutbolCrack — Frontend Angular

Red social para mostrar el talento y CV de futbolistas y presentar pruebas de jugadores. Sprint 1: cuatro pantallas públicas con contenido ficticio y validaciones locales de registro. No hay API, autenticación ni persistencia.

## Ejecutar

Desde esta carpeta:

```powershell
npm install
npm start
```

Abrí http://localhost:4200. Si las dependencias ya están instaladas, alcanza con npm start.

## Comprobar

```powershell
npm run build
node node_modules/@angular/cli/bin/ng.js test --watch=false
```

Crear cuenta e Ingresar permanecen deshabilitados: los formularios no envían datos. Las imágenes son locales y los espacios de video no reproducen archivos.

## Estudiar y modificar

- [Estado del sprint, estructura y pendientes](docs/sprint-1.md).
- [Guía Angular, validaciones, mapa de CSS y preguntas para la defensa](docs/guia-angular.md).

Los CSS tienen comentarios por sección. La paleta y los radios están en src/styles.css; cada componente tiene su propio TS, HTML y CSS. Los datos ficticios del feed están en src/app/data/publicaciones-demo.ts.
