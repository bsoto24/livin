// test/contrato-historial.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as historial from '../src/historial.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo del historial: tope y escala de estrellas', () => {
  assert.equal(catalogo.LIMITE_HISTORIAL, 200);
  assert.deepEqual([catalogo.MIN_ESTRELLAS, catalogo.MAX_ESTRELLAS], [1, 5]);
});

test('contrato del modelo y del almacén: hogar inicial v7 y migración', () => {
  assert.equal(typeof almacen.migrarAV6, 'function');
  const e = hogar.crearHogarInicial(crearCtx());
  assert.deepEqual([e.version, e.historial], [7, []]);
});

test('contrato del historial: funciones y mensajes', () => {
  for (const f of ['buscarEntrada', 'agregarEntrada', 'entradasDelHistorial', 'entradasDe', 'miembrosDelFiltro', 'textoAcreditada',
    'textoEspacio', 'textoDia', 'textoLinea', 'promedioDe', 'textoResumen', 'textoVacio', 'estadoDeCalificacion', 'textoCalificacion',
    'calificar', 'quitarCalificacion']) {
    assert.equal(typeof historial[f], 'function', f);
  }
  for (const clave of ['no-encontrada', 'no-persona', 'estrellas', 'bloqueada', 'propia', 'sin-calificacion']) {
    assert.equal(typeof historial.MENSAJES_HISTORIAL[clave], 'string', clave);
  }
});
