// test/formularios.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarTexto, sugerenciasPara, sugerenciaExacta, iconoDeFicha, iconoDeEdicion, OPCIONES_RECURRENCIA, datosDeRecurrencia,
  valorDeRecurrencia, etiquetaDeRecurrencia, resumenDeFicha, inicialDe,
} from '../src/formularios.js';

const nombres = (lista) => lista.map((s) => s.nombre);

test('AC-8.2: con el campo vacío salen las primeras 6 sugerencias, en su orden', () => {
  const esperadas = ['Lavar platos', 'Barrer', 'Trapear', 'Limpiar el baño', 'Lavar ropa', 'Sacar la basura'];
  assert.deepEqual(nombres(sugerenciasPara('')), esperadas);
  assert.deepEqual(nombres(sugerenciasPara('   ')), esperadas);
});

test('AC-8.3: con texto salen las que lo contienen, sin distinguir mayúsculas, acentos ni espacios en los extremos', () => {
  assert.deepEqual(nombres(sugerenciasPara('ba')), ['Barrer', 'Limpiar el baño', 'Sacar la basura']);
  assert.deepEqual(nombres(sugerenciasPara(' BAÑO ')), ['Limpiar el baño']);
  assert.deepEqual(nombres(sugerenciasPara('limpiar el bano')), ['Limpiar el baño']);
  assert.deepEqual(nombres(sugerenciasPara('LAVAR')), ['Lavar platos', 'Lavar ropa']);
  assert.deepEqual(nombres(sugerenciasPara('mascota')), ['Dar de comer a la mascota']);
  assert.deepEqual(sugerenciasPara('zzz'), []);
});

test('AC-8.6: un texto igual a una sugerencia (sin distinguir mayúsculas, acentos ni extremos) la encuentra; uno parcial, no', () => {
  assert.equal(sugerenciaExacta('barrer ')?.icono, 'barrer');
  assert.equal(sugerenciaExacta('LIMPIAR EL BAÑO')?.icono, 'limpiar');
  assert.equal(sugerenciaExacta('limpiar el bano')?.nombre, 'Limpiar el baño');
  assert.equal(sugerenciaExacta('barr'), null);
  assert.equal(sugerenciaExacta(''), null);
  assert.equal(normalizarTexto('  ÁrBol Ñandú '), 'arbol nandu');
});

test('AC-8.5 a AC-8.11: el icono de la ficha — genérico por omisión, fijo con una sugerencia, a mano mientras no coincida', () => {
  assert.deepEqual(iconoDeFicha('', null), { icono: 'otra', editable: true, manual: null }); // AC-8.8
  assert.deepEqual(iconoDeFicha('Podar', null), { icono: 'otra', editable: true, manual: null });
  assert.deepEqual(iconoDeFicha('Barrer', null), { icono: 'barrer', editable: false, manual: null }); // AC-8.5, AC-8.6
  assert.deepEqual(iconoDeFicha('Trapear', 'ropa'), { icono: 'limpiar', editable: false, manual: null }); // AC-8.10: se descarta el manual
  assert.deepEqual(iconoDeFicha('Podar', 'plantas'), { icono: 'plantas', editable: true, manual: 'plantas' }); // AC-8.7, AC-8.9
  assert.deepEqual(iconoDeFicha('Podar mucho', 'plantas'), { icono: 'plantas', editable: true, manual: 'plantas' }); // AC-8.9
  // AC-8.10 y AC-8.11: tras coincidir con una sugerencia, al dejar de coincidir vuelve al genérico
  const coincide = iconoDeFicha('Barrer', 'plantas');
  assert.deepEqual(iconoDeFicha('Barre', coincide.manual), { icono: 'otra', editable: true, manual: null });
});

test('AC-8.15: al editar se respeta el icono guardado hasta que el nombre coincida con una sugerencia', () => {
  assert.deepEqual(iconoDeEdicion('Podar', 'plantas'), { icono: 'plantas', editable: true, manual: 'plantas' });
  assert.deepEqual(iconoDeEdicion('Lavar platos', 'ropa'), { icono: 'ropa', editable: false, manual: 'ropa' });
  // al cambiar el texto, rige la regla de siempre
  assert.deepEqual(iconoDeFicha('Lavar plato', 'ropa'), { icono: 'ropa', editable: true, manual: 'ropa' });
  assert.deepEqual(iconoDeFicha('Lavar platos', 'ropa'), { icono: 'platos', editable: false, manual: null });
});

test('AC-9.7: la recurrencia es un solo selector que se traduce a tipo y frecuencia', () => {
  assert.deepEqual(OPCIONES_RECURRENCIA, [
    ['0', 'Una vez'], ['1', 'Cada día'], ['2', 'Cada 2 días'], ['3', 'Cada 3 días'], ['7', 'Cada 7 días'], ['14', 'Cada 14 días'],
    ['30', 'Cada 30 días'],
  ]);
  assert.deepEqual(datosDeRecurrencia('0'), { tipo: 'puntual', frecuenciaDias: null });
  assert.deepEqual(datosDeRecurrencia('7'), { tipo: 'repetitiva', frecuenciaDias: 7 });
  assert.equal(valorDeRecurrencia({ tipo: 'puntual', frecuenciaDias: null }), '0');
  assert.equal(valorDeRecurrencia({ tipo: 'repetitiva', frecuenciaDias: 14 }), '14');
  assert.equal(etiquetaDeRecurrencia('3'), 'Cada 3 días');
});

test('AC-9.4, AC-9.8: la línea-resumen dice la fecha, la recurrencia y los lugares, sin símbolo al comienzo', () => {
  const hoy = '2026-10-06';
  assert.equal(resumenDeFicha({ vence: hoy, hoy, recurrencia: '0', lugares: [] }), 'Hoy · Una vez · Sin lugar');
  assert.equal(resumenDeFicha({ vence: '2026-10-09', hoy, recurrencia: '7', lugares: ['Sala'] }), '2026-10-09 · Cada 7 días · Sala');
  assert.equal(resumenDeFicha({ vence: hoy, hoy, recurrencia: '1', lugares: ['Sala', 'Cocina', 'Dormitorio 1'] }), 'Hoy · Cada día · 3 lugares');
  assert.equal(resumenDeFicha({ vence: '', hoy, recurrencia: '0', lugares: [] }), 'Sin fecha · Una vez · Sin lugar');
});

test('AC-9.1: la inicial de un círculo es la primera letra del nombre en mayúscula', () => {
  assert.equal(inicialDe('diana'), 'D');
  assert.equal(inicialDe('  ángel'), 'Á');
  assert.equal(inicialDe(''), '?');
});
