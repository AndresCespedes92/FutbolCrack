import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ExtenderSesion } from './extender-sesion';
import { instalarDialogDePrueba } from '../../testing/dialog-prueba';
describe('ExtenderSesion: decisión voluntaria y teclado', () => {
  let fixture: ComponentFixture<ExtenderSesion>, restaurar: () => void;
  beforeEach(async () => {
    restaurar = instalarDialogDePrueba();
    await TestBed.configureTestingModule({ imports: [ExtenderSesion] }).compileComponents();
    fixture = TestBed.createComponent(ExtenderSesion);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    restaurar();
  });
  it('identifica el tiempo restante y emite Extender o Ahora no sin ejecutar HTTP propio', () => {
    const extender = vi.fn(),
      ahoraNo = vi.fn();
    fixture.componentInstance.extender.subscribe(extender);
    fixture.componentInstance.ahoraNo.subscribe(ahoraNo);
    expect(fixture.nativeElement.textContent).toContain('5 minuto(s)');
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);
    fixture.nativeElement.querySelectorAll('button')[1].click();
    fixture.nativeElement.querySelectorAll('button')[0].click();
    expect(extender).toHaveBeenCalledTimes(1);
    expect(ahoraNo).toHaveBeenCalledTimes(1);
  });
  it('Escape equivale a Ahora no; durante renovación no permite cancelación ni duplicados', () => {
    const extender = vi.fn(),
      ahoraNo = vi.fn();
    fixture.componentInstance.extender.subscribe(extender);
    fixture.componentInstance.ahoraNo.subscribe(ahoraNo);
    const cancelar = new Event('cancel', { cancelable: true });
    fixture.nativeElement.querySelector('dialog').dispatchEvent(cancelar);
    expect(cancelar.defaultPrevented).toBe(true);
    expect(ahoraNo).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('renovando', true);
    fixture.detectChanges();
    fixture.componentInstance.confirmar();
    fixture.componentInstance.cancelar();
    expect(extender).not.toHaveBeenCalled();
    expect(ahoraNo).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });
});
