// test/contrato-personajes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as personajes from '../src/arte/personajes.js';
import * as caminar from '../src/arte/caminar.js';
import * as hogares from './hogares-de-prueba.js';

test('contrato de los personajes: catálogo, cuadros y elección por miembro', () => {
  assert.deepEqual(personajes.VISTAS, ['frente', 'espalda', 'lado']);
  assert.deepEqual(personajes.CUADROS, [0, 1, 2]);
  assert.equal(typeof personajes.PERSONAJES, 'object');
  assert.equal(typeof personajes.CUADROS_DE_PERSONAJES, 'object');
  for (const nombre of ['claveDeCuadro', 'personajeDe']) assert.equal(typeof personajes[nombre], 'function', nombre);
});

test('contrato del caminar: vista, dirección, registro y cuadro', () => {
  assert.equal(typeof caminar.REPOSO, 'object');
  for (const nombre of ['vistaDeDireccion', 'direccionDelPaso', 'otroPie', 'pasoNuevo', 'mirarHacia', 'progresoDelPaso', 'cuadroDeCaminar']) {
    assert.equal(typeof caminar[nombre], 'function', nombre);
  }
});

test('contrato de los hogares de prueba', () => {
  for (const nombre of ['ctxDePrueba', 'hogarDePrueba1', 'hogarDePrueba2']) assert.equal(typeof hogares[nombre], 'function', nombre);
});
