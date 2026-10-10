// test/hogares-de-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS } from '../src/catalogo.js';
import { espaciosActivos, esPropietario, actividadesPendientes } from '../src/hogar.js';
import { limpiezaDeEspacio } from '../src/actividades.js';
import { crearAlmacen, CLAVE_DATOS } from '../src/almacen.js';
import { almacenEnMemoria } from './ayuda.js';
import { hogarDePruebaDeEstados } from './hogares-de-prueba.js';

const HOY = '2026-10-10';
const ESTADOS = ['limpio', 'desordenado', 'desastre'];

test('AC-9.1: los tres hogares de estados son documentos válidos de la versión 7 y se abren sin aviso', () => {
  for (const limpieza of ESTADOS) {
    const e = hogarDePruebaDeEstados(limpieza, HOY);
    assert.equal(e.version, 7);
    const r = crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(e) })).cargar(() => '2026-10-10T09:00:00.000Z');
    assert.equal(r.error, null, limpieza);
    assert.deepEqual(r.estado, e);
  }
});

test('AC-9.2: cada hogar tiene al menos un espacio de cada uno de los ocho tipos', () => {
  for (const limpieza of ESTADOS) {
    const tipos = new Set(espaciosActivos(hogarDePruebaDeEstados(limpieza, HOY)).map((s) => s.tipo));
    assert.deepEqual([...tipos].sort(), [...TIPOS].sort(), limpieza);
  }
});

test('AC-9.3: todos los espacios quedan en el estado pedido, y el hogar limpio no tiene actividades', () => {
  for (const limpieza of ESTADOS) {
    const e = hogarDePruebaDeEstados(limpieza, HOY);
    for (const espacio of espaciosActivos(e)) assert.equal(limpiezaDeEspacio(e, espacio.id, HOY), limpieza, `${limpieza} ${espacio.tipo}`);
    assert.equal(actividadesPendientes(e).length, limpieza === 'limpio' ? 0 : espaciosActivos(e).length);
  }
});

test('FR-9: las actividades son del propietario, las ids son predecibles y el hogar no usa crypto.randomUUID', () => {
  const e = hogarDePruebaDeEstados('desastre', HOY);
  const propietario = e.miembros.find((m) => esPropietario(e, m));
  for (const a of actividadesPendientes(e)) assert.equal(a.miembroId, propietario.id);
  assert.deepEqual(hogarDePruebaDeEstados('desastre', HOY), e); // mismo ctx de prueba, mismo documento
});
