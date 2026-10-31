import { instalarDialogDePrueba } from '../../testing/dialog-prueba';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmacionBaja } from './confirmacion-baja';
import { publicacionPrueba } from '../../testing/publicaciones-fixture';
describe('ConfirmacionBaja: teclado y foco del modal propio', () => {
  let fixture: ComponentFixture<ConfirmacionBaja>;
  let restaurarDialog: () => void;
  beforeEach(async () => {
    restaurarDialog = instalarDialogDePrueba();
    await TestBed.configureTestingModule({ imports: [ConfirmacionBaja] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmacionBaja);
    fixture.componentRef.setInput('publicacion', publicacionPrueba());
  });
  afterEach(() => {
    fixture.destroy();
    restaurarDialog();
    vi.restoreAllMocks();
  });
  it('Escape cancela sin confirmar; devuelve el foco al botón que abrió el modal', () => {
    const disparador = document.createElement('button');
    document.body.appendChild(disparador);
    disparador.focus();
    const cancelar = vi.fn(),
      confirmar = vi.fn();
    fixture.componentInstance.cancelar.subscribe(cancelar);
    fixture.componentInstance.confirmar.subscribe(confirmar);
    fixture.detectChanges();
    const evento = new Event('cancel', { cancelable: true });
    fixture.nativeElement.querySelector('dialog').dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(true);
    expect(cancelar).toHaveBeenCalledTimes(1);
    expect(confirmar).not.toHaveBeenCalled();
    fixture.destroy();
    expect(document.activeElement).toBe(disparador);
    disparador.remove();
  });
  it('mientras confirma impide Escape y nuevas confirmaciones', () => {
    const cancelar = vi.fn(),
      confirmar = vi.fn();
    fixture.componentInstance.cancelar.subscribe(cancelar);
    fixture.componentInstance.confirmar.subscribe(confirmar);
    fixture.componentRef.setInput('procesando', true);
    fixture.detectChanges();
    fixture.nativeElement
      .querySelector('dialog')
      .dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.componentInstance.confirmarBaja();
    expect(cancelar).not.toHaveBeenCalled();
    expect(confirmar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
  });
});
