// test/contrato-habitantes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as posicion from '../src/posicion.js';
import * as movimiento from '../src/movimiento.js';
import { azarReproducible } from './ayuda.js';

test('contrato del catálogo de habitantes: listas cerradas y límites', () => {
  assert.deepEqual(Object.values(catalogo.ASPECTOS), ['Adulto', 'Adulta', 'Niño', 'Niña', 'Anciano', 'Anciana', 'Neutro']);
  assert.deepEqual(catalogo.ESPECIES, { perro: 'Perro', gato: 'Gato', conejo: 'Conejo', hamster: 'Hámster', loro: 'Loro', otro: 'Otro' });
  assert.deepEqual(catalogo.LIMITES_HABITANTES, { familiar: 8, mascota: 4 });
});

test('contrato del modelo y del almacén: funciones de habitantes y migración', () => {
  for (const f of ['agregarHabitante', 'editarHabitante', 'eliminarHabitante', 'puedeAgregarHabitante', 'puedeEliminarMiembro',
    'familiares', 'mascotas', 'habitantes', 'contarHabitantes', 'buscarMiembro', 'esPropietario']) {
    assert.equal(typeof hogar[f], 'function', f);
  }
  assert.equal(typeof hogar.MENSAJES_ERROR.limite, 'string');
  assert.equal(typeof almacen.migrarAV2, 'function');
});

test('contrato del movimiento: funciones y constantes del ADR', () => {
  for (const f of ['colocarHabitantes', 'avanzarHabitantes', 'sincronizarHabitantes', 'congelarHabitantes',
    'ocupadasPorHabitantes', 'ocupadasPorJugador']) {
    assert.equal(typeof movimiento[f], 'function', f);
  }
  assert.deepEqual(
    [movimiento.MS_POR_PASO, movimiento.PAUSA_MIN_MS, movimiento.PAUSA_MAX_MS, movimiento.TRAMO_MIN, movimiento.TRAMO_MAX],
    [500, 1000, 4000, 1, 6],
  );
  assert.equal(posicion.claveCasilla(3, 4), '3,4');
});

test('azar reproducible: misma semilla, misma secuencia, valores en [0, 1)', () => {
  const a = Array.from({ length: 200 }, azarReproducible(42));
  const b = Array.from({ length: 200 }, azarReproducible(42));
  assert.deepEqual(a, b);
  assert.ok(a.every((n) => n >= 0 && n < 1));
  assert.notDeepEqual(a, Array.from({ length: 200 }, azarReproducible(43)));
});
