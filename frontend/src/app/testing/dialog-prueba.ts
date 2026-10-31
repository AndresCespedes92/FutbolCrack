// JSDOM no ofrece showModal/close: el doble solo representa apertura/cierre para pruebas DOM.
// No verifica capa superior, bloqueo del fondo ni foco inicial nativo; requieren navegador real.
export function instalarDialogDePrueba(): () => void {
  const prototipo = HTMLDialogElement.prototype;
  const anteriorAbrir = Object.getOwnPropertyDescriptor(prototipo, 'showModal');
  const anteriorCerrar = Object.getOwnPropertyDescriptor(prototipo, 'close');
  Object.defineProperty(prototipo, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(prototipo, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
  return () => {
    if (anteriorAbrir) Object.defineProperty(prototipo, 'showModal', anteriorAbrir);
    else Reflect.deleteProperty(prototipo, 'showModal');
    if (anteriorCerrar) Object.defineProperty(prototipo, 'close', anteriorCerrar);
    else Reflect.deleteProperty(prototipo, 'close');
  };
}
