// test/secciones.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECCIONES, textoPestana, accionDeToque } from '../src/secciones.js';

const TOQUE = { ocupante: 'm1', enCartel: true, burbuja: { tipo: 'espacio', id: 'e1' }, espacioId: 'e1' };

test('AC-1.1: la barra tiene cuatro secciones, en este orden, cada una con su etiqueta y su icono', () => {
  assert.deepEqual(SECCIONES.map((s) => [s.clave, s.etiqueta, s.icono]), [
    ['espacios', 'Espacios', '🏠'], ['familia', 'Familia', '👨‍👩‍👧'], ['actividades', 'Actividades', '📋'], ['intercambios', 'Intercambios', '🔄'],
  ]);
});

test('AC-1.8: la pestaña Intercambios dice cuántas propuestas recibidas vigentes hay; las demás no cambian', () => {
  assert.equal(textoPestana('intercambios', 0), 'Intercambios');
  assert.equal(textoPestana('intercambios', 3), 'Intercambios (3)');
  assert.equal(textoPestana('familia', 5), 'Familia');
  assert.equal(textoPestana('espacios', 2), 'Espacios');
});

test('AC-2.1, AC-2.6: en Espacios el mapa abre la ficha del espacio, haya o no alguien encima, y no responde a lo demás', () => {
  assert.deepEqual(accionDeToque('espacios', TOQUE), { tipo: 'ficha-espacio', id: 'e1' });
  assert.deepEqual(accionDeToque('espacios', { ocupante: null, enCartel: false, burbuja: null, espacioId: 'e2' }), { tipo: 'ficha-espacio', id: 'e2' });
  assert.equal(accionDeToque('espacios', { ...TOQUE, espacioId: null }), null);
});

test('AC-2.2, AC-2.3, AC-2.6: en Familia el mapa abre la ficha de quien está en la casilla o la hoja del cartel, y nada más', () => {
  assert.deepEqual(accionDeToque('familia', TOQUE), { tipo: 'ficha-miembro', id: 'm1' });
  assert.deepEqual(accionDeToque('familia', { ...TOQUE, ocupante: null }), { tipo: 'hoja-fuera' });
  assert.equal(accionDeToque('familia', { ocupante: null, enCartel: false, burbuja: TOQUE.burbuja, espacioId: 'e1' }), null);
});

test('AC-2.4, AC-2.5: en Actividades el mapa abre la hoja de la burbuja; en Intercambios y en exploración no responde', () => {
  assert.deepEqual(accionDeToque('actividades', TOQUE), { tipo: 'hoja', lugar: { tipo: 'espacio', id: 'e1' } });
  assert.equal(accionDeToque('actividades', { ...TOQUE, burbuja: null }), null);
  assert.equal(accionDeToque('intercambios', TOQUE), null);
  assert.equal(accionDeToque(null, TOQUE), null);
});
