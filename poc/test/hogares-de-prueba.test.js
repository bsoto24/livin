// test/hogares-de-prueba.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { familiares, mascotas, miembrosActivos, esPropietario } from '../src/hogar.js';
import { crearAlmacen, CLAVE_DATOS } from '../src/almacen.js';
import { personajeDe } from '../src/arte/personajes.js';
import { almacenEnMemoria } from './ayuda.js';
import { hogarDePrueba1, hogarDePrueba2 } from './hogares-de-prueba.js';

const propietarioDe = (estado) => estado.miembros.find((m) => esPropietario(estado, m));

test('AC-8.1: el primer hogar tiene al protagonista, los seis aspectos de género y edad y cuatro mascotas', () => {
  const e = hogarDePrueba1();
  assert.equal(propietarioDe(e).nombre, 'Protagonista');
  assert.deepEqual(familiares(e).map((m) => m.aspecto), ['adulto', 'adulta', 'nino', 'nina', 'anciano', 'anciana']);
  assert.deepEqual(mascotas(e).map((m) => m.especie), ['perro', 'gato', 'conejo', 'hamster']);
});

test('AC-8.2: el segundo hogar tiene al protagonista, el neutro, el loro y «Otro»', () => {
  const e = hogarDePrueba2();
  assert.equal(propietarioDe(e).nombre, 'Protagonista');
  assert.deepEqual(familiares(e).map((m) => m.aspecto), ['neutro']);
  assert.deepEqual(mascotas(e).map((m) => m.especie), ['loro', 'otro']);
});

test('AC-8.3: cada familiar y cada mascota se llama como su aspecto o su especie', () => {
  for (const e of [hogarDePrueba1(), hogarDePrueba2()]) {
    for (const m of familiares(e)) assert.equal(m.nombre, ASPECTOS[m.aspecto]);
    for (const m of mascotas(e)) assert.equal(m.nombre, ESPECIES[m.especie]);
  }
});

test('AC-8.4: los dos hogares son documentos válidos de la versión 7 y se abren sin aviso', () => {
  for (const e of [hogarDePrueba1(), hogarDePrueba2()]) {
    assert.equal(e.version, 7);
    const r = crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(e) })).cargar(() => '2026-10-10T09:00:00.000Z');
    assert.equal(r.error, null);
    assert.deepEqual(r.estado, e);
  }
});

test('AC-8.5: entre los dos hogares aparecen los 14 personajes, dentro de los límites', () => {
  const personajes = new Set();
  for (const e of [hogarDePrueba1(), hogarDePrueba2()]) {
    assert.ok(familiares(e).length <= 8);
    assert.ok(mascotas(e).length <= 4);
    for (const m of miembrosActivos(e)) personajes.add(personajeDe(e, m));
  }
  assert.equal(personajes.size, 14);
});
