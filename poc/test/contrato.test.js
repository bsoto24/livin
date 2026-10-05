// test/contrato.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as hogar from '../src/hogar.js';
import * as distribucion from '../src/distribucion.js';
import * as posicion from '../src/posicion.js';
import * as almacen from '../src/almacen.js';
import { crearCtx } from './ayuda.js';

test('contrato del modelo: funciones exportadas', () => {
  for (const f of ['crearHogarInicial', 'espaciosActivos', 'espaciosDeTipo', 'contar', 'limites', 'puedeAgregar',
    'puedeQuitar', 'puedeEliminar', 'agregarEspacio', 'quitarUltimo', 'ultimoDeTipo', 'eliminarEspacio',
    'consecuenciasDeEliminar', 'requiereConfirmacion', 'siguienteDestinoBano', 'nombreVisible',
    'renombrarEspacio', 'renombrarMiembro']) {
    assert.equal(typeof hogar[f], 'function', f);
  }
});

test('contrato del generador: forma de la distribución', () => {
  const d = distribucion.generarDistribucion(hogar.crearHogarInicial(crearCtx()));
  assert.equal(typeof d.ancho, 'number');
  assert.equal(typeof d.alto, 'number');
  assert.equal(d.tiles.length, d.alto);
  assert.ok(d.tiles.every((fila) => fila.length === d.ancho));
  assert.equal(d.espacioEn.length, d.alto);
  assert.ok(Array.isArray(d.puertas) && Array.isArray(d.pasillos));
  assert.deepEqual(Object.keys(d.aparicion).sort(), ['x', 'y']);
  assert.equal(typeof d.rects, 'object');
});

test('contrato de posición y almacén: funciones exportadas', () => {
  for (const f of ['posicionRelativa', 'resolverPosicion', 'paso']) assert.equal(typeof posicion[f], 'function', f);
  for (const f of ['crearAlmacen', 'iniciarSesion']) assert.equal(typeof almacen[f], 'function', f);
});
