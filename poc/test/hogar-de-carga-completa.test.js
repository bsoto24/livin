// test/hogar-de-carga-completa.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITE_ACTIVIDADES, LIMITE_HISTORIAL, LIMITES_HABITANTES } from '../src/catalogo.js';
import { espaciosActivos, familiares, mascotas, actividadesPendientes } from '../src/hogar.js';
import { limpiezaDeEspacio } from '../src/actividades.js';
import { crearAlmacen, CLAVE_DATOS } from '../src/almacen.js';
import { almacenEnMemoria } from './ayuda.js';
import { hogarDeCargaCompleta } from './hogares-de-prueba.js';

const HOY = '2026-10-11';

test('el hogar de carga completa tiene 8 familiares, 4 mascotas, 50 pendientes y 200 entradas de historial', () => {
  const e = hogarDeCargaCompleta(HOY);
  assert.equal(familiares(e).length, LIMITES_HABITANTES.familiar);
  assert.equal(mascotas(e).length, LIMITES_HABITANTES.mascota);
  assert.equal(actividadesPendientes(e).length, LIMITE_ACTIVIDADES);
  assert.equal(e.historial.length, LIMITE_HISTORIAL);
});

test('el hogar de carga completa deja todos los espacios en desastre', () => {
  const e = hogarDeCargaCompleta(HOY);
  for (const espacio of espaciosActivos(e)) assert.equal(limpiezaDeEspacio(e, espacio.id, HOY), 'desastre', espacio.id);
});

test('el hogar de carga completa es un documento válido de la versión 7 y se abre sin aviso', () => {
  const e = hogarDeCargaCompleta(HOY);
  assert.equal(e.version, 7);
  const r = crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(e) })).cargar(() => '2026-10-11T09:00:00.000Z');
  assert.equal(r.error, null);
  assert.deepEqual(r.estado, e);
});

test('el hogar de carga completa es determinista', () => {
  assert.deepEqual(hogarDeCargaCompleta(HOY), hogarDeCargaCompleta(HOY));
});
