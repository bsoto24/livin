// test/almacen.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen, iniciarSesion, migrarAV2, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
import {
  agregarEspacio, renombrarEspacio, espaciosDeTipo, crearHogarInicial, agregarHabitante, familiares, mascotas,
} from '../src/hogar.js';
import { crearCtx, almacenEnMemoria } from './ayuda.js';

test('AC-1.1: sin datos se crea y guarda el hogar inicial, sin aviso', () => {
  const storage = almacenEnMemoria();
  const { estado, aviso } = iniciarSesion(crearAlmacen(storage), crearCtx());
  assert.equal(aviso, null);
  assert.equal(espaciosDeTipo(estado, 'sala').length, 1);
  assert.ok(storage.datos.has(CLAVE_DATOS));
});

test('AC-7.1: lo guardado se restaura igual', () => {
  const ctx = crearCtx();
  const almacen = crearAlmacen(almacenEnMemoria());
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  e = agregarEspacio(e, 'bano', ctx);
  e = renombrarEspacio(e, espaciosDeTipo(e, 'dormitorio')[1].id, 'Cuarto de Bryam', ctx).estado;
  almacen.guardar(e);
  assert.deepEqual(iniciarSesion(almacen, crearCtx()).estado, e);
});

test('AC-7.2: la posición se guarda y se recupera', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const pos = { clave: 'id-5', dx: 2, dy: 3, direccion: 'izquierda' };
  almacen.guardarPosicion(pos);
  assert.deepEqual(almacen.cargarPosicion(), pos);
});

test('Error: datos ilegibles crean hogar inicial con aviso', () => {
  for (const basura of ['{no es json', JSON.stringify({ version: 1, espacios: [] })]) {
    const storage = almacenEnMemoria({ [CLAVE_DATOS]: basura });
    const { estado, aviso } = iniciarSesion(crearAlmacen(storage), crearCtx());
    assert.match(aviso, /No se pudo recuperar/);
    assert.equal(espaciosDeTipo(estado, 'dormitorio').length, 1);
  }
});

test('Error: si falla la lectura del almacenamiento se crea el hogar inicial con aviso', () => {
  const storage = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => {} };
  const { estado, aviso } = iniciarSesion(crearAlmacen(storage), crearCtx());
  assert.match(aviso, /No se pudo recuperar/);
  assert.equal(espaciosDeTipo(estado, 'sala').length, 1);
  assert.equal(espaciosDeTipo(estado, 'dormitorio').length, 1);
});

test('AC-8.5: un miembro sin cuenta se carga como válido', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const conMiembroSinCuenta = { ...e, miembros: [...e.miembros, { ...e.miembros[0], id: 'id-99', nombre: 'Firulais', cuentaId: null }] };
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(conMiembroSinCuenta) });
  const { aviso, estado } = iniciarSesion(crearAlmacen(storage), crearCtx());
  assert.equal(aviso, null);
  assert.equal(estado.miembros[1].cuentaId, null);
});

test('Error: si falla el guardado se informa sin lanzar', () => {
  const roto = { getItem: () => null, setItem: () => { throw new Error('cuota llena'); } };
  const almacen = crearAlmacen(roto);
  assert.deepEqual(almacen.guardar({}), { ok: false });
  assert.deepEqual(almacen.guardarPosicion({}), { ok: false });
  assert.equal(CLAVE_POSICION, 'livin:posicion:v1');
});

// Documento como lo guardaba la feature 001: versión 1 y miembros sin tipo, parentesco, género ni especie.
function comoV1(estado) {
  return { ...estado, version: 1, miembros: estado.miembros.map(({ tipo, parentesco, genero, especie, ...resto }) => resto) };
}

function hogarConHabitantes(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

test('AC-9.1: los habitantes y sus datos se guardan y se restauran igual', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConHabitantes(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.deepEqual(familiares(estado).map((f) => [f.nombre, f.parentesco, f.genero]), [['Diana', 'pareja', 'femenino']]);
  assert.deepEqual(mascotas(estado).map((m) => [m.nombre, m.especie]), [['Firulais', 'perro']]);
});

test('AC-9.3: un hogar de la feature 001 se abre sin aviso y se guarda en el formato nuevo en el siguiente guardado', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  e = renombrarEspacio(e, espaciosDeTipo(e, 'dormitorio')[1].id, 'Cuarto de Bryam', ctx).estado;
  const textoV1 = JSON.stringify(comoV1(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV1 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, nombres y personaje; ya en versión 2 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV1); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 2);
});

test('AC-9.4: tras migrar, el personaje del propietario conserva nombre y cuenta y no recibe parentesco ni género', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const migrado = migrarAV2(comoV1(e));
  const conFamilia = agregarHabitante(migrado, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  const propietario = conFamilia.miembros[0];
  assert.deepEqual(
    [propietario.nombre, propietario.cuentaId, propietario.tipo, propietario.parentesco, propietario.genero],
    ['Personaje 1', e.cuentas[0].id, 'persona', null, null],
  );
  assert.equal(familiares(conFamilia).length, 1);
});

test('migrarAV2 es pura: no modifica el documento de entrada y solo agrega los campos nuevos', () => {
  const v1 = comoV1(crearHogarInicial(crearCtx()));
  const copia = structuredClone(v1);
  const v2 = migrarAV2(v1);
  assert.deepEqual(v1, copia);
  assert.equal(v2.version, 2);
  assert.deepEqual(comoV1(v2), v1);
});

test('AC-9.5: datos con un habitante inválido se consideran ilegibles', () => {
  const base = hogarConHabitantes(crearCtx());
  const [, diana, firulais] = base.miembros;
  const variantes = [
    { ...diana, tipo: 'robot' },
    { ...firulais, parentesco: 'pareja' },
    { ...firulais, genero: 'femenino' },
    { ...diana, especie: 'perro' },
    { ...diana, parentesco: 'tia' },
    { ...diana, genero: 'x' },
    { ...firulais, especie: 'loro' },
    { ...diana, cuentaId: base.cuentas[0].id }, // dos miembros vinculados a la cuenta del propietario
  ];
  const abrir = (datos) => iniciarSesion(crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(datos) })), crearCtx());
  for (const malo of variantes) {
    const { estado, aviso } = abrir({ ...base, miembros: base.miembros.map((m) => (m.id === malo.id ? malo : m)) });
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.equal(estado.miembros.length, 1);
  }
  const sinPropietario = { ...base, miembros: base.miembros.map((m, i) => (i === 0 ? { ...m, cuentaId: null } : m)) };
  assert.match(abrir(sinPropietario).aviso, /No se pudo recuperar/);
});
