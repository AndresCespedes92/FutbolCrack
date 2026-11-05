import { FormControl } from '@angular/forms';
import { PlataformaExterna, urlContenidoValidator } from './url-contenido.validator';

describe('URL de contenido externo: formato local sin solicitudes remotas', () => {
  it.each([
    ['instagram', 'https://www.instagram.com/p/Jugada_10-/'],
    ['instagram', 'https://instagram.com/reel/Jugada_10/?igsh=prueba'],
    ['instagram', 'https://www.instagram.com/reels/Jugada10/'],
    ['instagram', '  https://www.instagram.com/p/Jugada10/  '],
    ['tiktok', 'https://www.tiktok.com/@jugador.10/video/1234567890'],
    ['tiktok', 'https://www.tiktok.com/@jugador/photo/1234567890?lang=es'],
    ['tiktok', 'https://m.tiktok.com/@jugador/video/123/'],
    ['tiktok', 'https://vm.tiktok.com/EnlaceQA/'],
    ['tiktok', 'https://vt.tiktok.com/EnlaceQA/'],
    ['tiktok', 'https://www.tiktok.com/t/EnlaceQA/'],
  ] as [PlataformaExterna, string][])('acepta formato %s: %s', (tipo, valor) => {
    expect(urlContenidoValidator(tipo)(new FormControl(valor))).toBeNull();
  });

  it.each([
    ['instagram', 'https://www.tiktok.com/@jugador/video/123'],
    ['tiktok', 'https://instagram.com/reel/Jugada10/'],
    ['instagram', 'http://instagram.com/p/Jugada10/'],
    ['instagram', 'javascript:alert(1)'],
    ['instagram', 'https://instagram.com.ejemplo.test/p/Jugada10/'],
    ['instagram', 'https://ejemplo.test/instagram.com/p/Jugada10/'],
    ['instagram', 'https://usuario:clave@instagram.com/p/Jugada10/'],
    ['instagram', 'https://instagram.com:444/p/Jugada10/'],
    ['instagram', 'https://www.instagram.com/jugador/'],
    ['instagram', 'https://www.instagram.com/stories/jugador/123/'],
    ['instagram', 'instagram.com/p/Jugada10/'],
    ['instagram', '   '],
    ['instagram', 123],
    ['instagram', 0],
    ['tiktok', 'https://tiktok.com.ejemplo.test/@jugador/video/123'],
    ['tiktok', 'https://www.tiktok.com/@jugador'],
    ['tiktok', 'https://vm.tiktok.com/'],
    ['tiktok', 'https://www.tiktok.com/@jugador/video/no-es-numero'],
  ] as [PlataformaExterna, unknown][])('rechaza formato %s: %s', (tipo, valor) => {
    expect(urlContenidoValidator(tipo)(new FormControl(valor))).toEqual({ urlContenido: true });
  });

  it('deja el error de valor vacío al validador required del formulario', () => {
    expect(urlContenidoValidator('instagram')(new FormControl(''))).toBeNull();
  });
});
