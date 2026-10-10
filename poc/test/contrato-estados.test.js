// test/contrato-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as aspecto from '../src/aspecto.js';
import * as suciedad from '../src/arte/suciedad.js';
import * as casillas from '../src/arte/casillas.js';
import * as hogares from './hogares-de-prueba.js';

test('contrato de la selección de casillas del desastre', () => {
  assert.equal(aspecto.MANCHAS_POR_DESASTRE, 6);
  assert.equal(aspecto.MOSCAS_POR_DESASTRE, 2);
  for (const nombre of ['manchasDelSuelo', 'moscasDelSuelo', 'esquinasDelEspacio']) assert.equal(typeof aspecto[nombre], 'function', nombre);
});

test('contrato del arte del desorden: grupos, objetos, manchas, telarañas, moscas y sobreposiciones', () => {
  assert.ok(Array.isArray(suciedad.GRUPOS));
  for (const nombre of ['GRUPO_DE_TIPO', 'NOMBRES_DE_OBJETOS', 'OBJETOS', 'MANCHAS', 'TELARANAS', 'SOBREPOSICIONES', 'SUCIEDAD']) {
    assert.equal(typeof suciedad[nombre], 'object', nombre);
  }
  assert.ok(Array.isArray(suciedad.MOSCAS));
  assert.ok(Array.isArray(suciedad.TIPOS_CON_AGUA));
  assert.ok(Array.isArray(suciedad.TIPOS_CON_MOSCAS));
  assert.equal(suciedad.MANCHAS_DE_AGUA, 2);
});

test('contrato de la elección del arte con estados', () => {
  assert.deepEqual(casillas.ORDEN_DE_CAPAS, ['base', 'mancha', 'mueble', 'sobre', 'telarana', 'objeto', 'moscas']);
  for (const nombre of ['arteDelMapa', 'estadosCambiaron']) assert.equal(typeof casillas[nombre], 'function', nombre);
});

test('contrato de los hogares de prueba de estados', () => {
  assert.equal(typeof hogares.hogarDePruebaDeEstados, 'function');
});
