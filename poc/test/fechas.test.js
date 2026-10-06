// test/fechas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numeroDeDia, esFechaValida, sumarDias, diasEntre, fechaLocal } from '../src/fechas.js';

test('FR-1, FR-11: solo son válidas las fechas reales con formato AAAA-MM-DD', () => {
  for (const valida of ['2026-10-06', '2024-02-29', '2000-01-01', '2099-12-31']) assert.equal(esFechaValida(valida), true, valida);
  for (const invalida of ['2026-02-29', '2026-13-01', '2026-10-32', '2026-00-10', '2026-1-5', '06-10-2026', '2026-10-06T00:00',
    '0099-01-01', '', null, undefined, 20261006]) {
    assert.equal(esFechaValida(invalida), false, String(invalida));
    assert.equal(numeroDeDia(invalida), null, String(invalida));
  }
  assert.equal(numeroDeDia('1970-01-02'), 1);
});

test('FR-2: diasEntre cuenta días enteros del calendario, también entre meses y años', () => {
  assert.equal(diasEntre('2026-10-04', '2026-10-06'), 2);
  assert.equal(diasEntre('2026-10-06', '2026-10-06'), 0);
  assert.equal(diasEntre('2026-10-07', '2026-10-06'), -1);
  assert.equal(diasEntre('2025-12-31', '2026-01-01'), 1);
  assert.equal(diasEntre('2024-02-28', '2024-03-01'), 2);
});

test('AC-3.3: sumarDias devuelve una fecha AAAA-MM-DD y cruza meses, años y años bisiestos', () => {
  assert.equal(sumarDias('2026-10-06', 7), '2026-10-13');
  assert.equal(sumarDias('2026-12-30', 3), '2027-01-02');
  assert.equal(sumarDias('2024-02-28', 1), '2024-02-29');
  assert.equal(sumarDias('2026-10-06', 30), '2026-11-05');
  assert.equal(sumarDias('2026-03-28', 7), '2026-04-04');
  assert.equal(sumarDias('2026-01-05', -10), '2025-12-26');
});

test('sumarDias y diasEntre son coherentes en todos los días de un año bisiesto', () => {
  let dia = '2024-01-01';
  for (let i = 0; i < 366; i++) {
    const siguiente = sumarDias(dia, 1);
    assert.equal(esFechaValida(siguiente), true, siguiente);
    assert.equal(diasEntre(dia, siguiente), 1, dia);
    assert.equal(sumarDias(siguiente, -1), dia);
    dia = siguiente;
  }
  assert.equal(dia, '2025-01-01');
});

test('AC-5.5, FR-10: fechaLocal da el mismo día a las 00:00 y a las 23:59 de la hora local', () => {
  assert.equal(fechaLocal(new Date(2026, 9, 6, 0, 0, 0)), '2026-10-06');
  assert.equal(fechaLocal(new Date(2026, 9, 6, 23, 59, 59)), '2026-10-06');
  assert.equal(fechaLocal(new Date(2026, 0, 5, 12, 0)), '2026-01-05');
});
