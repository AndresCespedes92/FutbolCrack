import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmacionUsuario } from './confirmacion-usuario';
import { usuarioAdministrativoPrueba } from '../../testing/usuarios-fixture';
import { instalarDialogDePrueba } from '../../testing/dialog-prueba';
describe('ConfirmacionUsuario: teclado, foco y Outputs', () => {
  let fixture: ComponentFixture<ConfirmacionUsuario>, restaurar: () => void;
  beforeEach(async () => {
    restaurar = instalarDialogDePrueba();
    await TestBed.configureTestingModule({ imports: [ConfirmacionUsuario] }).compileComponents();
    fixture = TestBed.createComponent(ConfirmacionUsuario);
    fixture.componentRef.setInput('usuario', usuarioAdministrativoPrueba());
  });
  afterEach(() => {
    fixture.destroy();
    restaurar();
  });
  it('Escape cancela, no confirma y devuelve foco al disparador', () => {
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
  it('mientras confirma impide Escape y otra confirmación', () => {
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
