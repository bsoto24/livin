// test/contrato-arte.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as paleta from '../src/arte/paleta.js';
import * as lienzo from '../src/arte/lienzo.js';
import * as texturas from '../src/arte/texturas.js';
import * as mobiliario from '../src/arte/mobiliario.js';
import * as casillas from '../src/arte/casillas.js';

test('contrato del arte: paleta, herramientas, suelos, paredes y mobiliario', () => {
  assert.equal(paleta.TAM, 16);
  assert.ok(Array.isArray(paleta.FAMILIAS));
  assert.equal(typeof paleta.PALETA, 'object');
  for (const nombre of ['lienzo', 'rect', 'caja', 'cuadricula', 'patron']) assert.equal(typeof lienzo[nombre], 'function', nombre);
  assert.equal(typeof texturas.SUELOS, 'object');
  assert.deepEqual(Object.keys(texturas.PAREDES).sort(), ['cima', 'frente']);
  assert.equal(typeof mobiliario.MUEBLES, 'object');
  assert.equal(typeof mobiliario.EJE_DE_PIEZA, 'object');
  assert.ok(Array.isArray(mobiliario.LETRAS_MUEBLE));
});

test('contrato de la elección del arte: texturas por clave y mapa de casillas', () => {
  assert.equal(typeof casillas.TEXTURAS, 'object');
  for (const nombre of ['arteDelMapa', 'vistaDePared', 'varianteDeMueble']) assert.equal(typeof casillas[nombre], 'function', nombre);
});
