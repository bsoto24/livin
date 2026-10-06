// test/almacen.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
import {
  agregarEspacio, renombrarEspacio, espaciosDeTipo, crearHogarInicial, agregarHabitante, eliminarHabitante, familiares, mascotas,
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

// Documento como lo guardaba la feature 001: versión 1, sin actividades y miembros sin tipo, parentesco, género ni especie.
function comoV1(estado) {
  const { actividades, ...resto } = estado;
  return { ...resto, version: 1, miembros: estado.miembros.map(({ tipo, parentesco, genero, especie, ...m }) => m) };
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

test('AC-9.3 (002), AC-8.3 (003): un hogar de la feature 001 se abre sin aviso y se guarda como versión 3 en el siguiente guardado', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  e = renombrarEspacio(e, espaciosDeTipo(e, 'dormitorio')[1].id, 'Cuarto de Bryam', ctx).estado;
  const textoV1 = JSON.stringify(comoV1(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV1 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, nombres y personaje, sin actividades; ya en versión 3 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV1); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 3);
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

const abrirDatos = (datos) => iniciarSesion(crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(datos) })), crearCtx());
const conMiembro = (base, nuevo) => ({ ...base, miembros: base.miembros.map((m) => (m.id === nuevo.id ? nuevo : m)) });

test('FR-10: un miembro eliminado con datos inválidos no vuelve ilegible el documento', () => {
  const ctx = crearCtx();
  const base = hogarConHabitantes(ctx);
  const [, diana, firulais] = base.miembros;
  const sinDiana = eliminarHabitante(base, diana.id, ctx);
  const sinFirulais = eliminarHabitante(base, firulais.id, ctx);
  const eliminadaDiana = sinDiana.miembros.find((m) => m.id === diana.id);
  const eliminadoFirulais = sinFirulais.miembros.find((m) => m.id === firulais.id);
  assert.notEqual(eliminadaDiana.eliminadoEn, null);
  assert.notEqual(eliminadoFirulais.eliminadoEn, null);
  const casos = [
    [sinDiana, { ...eliminadaDiana, parentesco: 'tia' }],
    [sinDiana, { ...eliminadaDiana, tipo: 'robot' }],
    [sinDiana, { ...eliminadaDiana, especie: 'perro' }],
    [sinDiana, { ...eliminadaDiana, genero: 'x' }],
    [sinFirulais, { ...eliminadoFirulais, parentesco: 'pareja' }],
  ];
  for (const [documento, malo] of casos) {
    const guardado = conMiembro(documento, malo);
    const { estado, aviso } = abrirDatos(guardado);
    assert.equal(aviso, null, JSON.stringify(malo));
    assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)), JSON.stringify(malo));
  }
});

test('AC-9.5: los valores de prototipo no cuentan como valores de las listas cerradas', () => {
  const base = hogarConHabitantes(crearCtx());
  const [, diana, firulais] = base.miembros;
  const variantes = [];
  for (const clave of ['toString', 'constructor', '__proto__']) {
    variantes.push({ ...diana, parentesco: clave }, { ...diana, genero: clave }, { ...firulais, especie: clave });
  }
  for (const malo of variantes) {
    const { estado, aviso } = abrirDatos(conMiembro(base, malo));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-9.5: un miembro activo sin tipo hace ilegible el documento', () => {
  const base = hogarConHabitantes(crearCtx());
  for (const indice of [0, 1, 2]) { // propietario, familiar y mascota
    const { tipo, ...sinTipo } = base.miembros[indice];
    assert.equal('tipo' in sinTipo, false);
    const { estado, aviso } = abrirDatos(conMiembro(base, sinTipo));
    assert.match(aviso, /No se pudo recuperar/, `miembro ${indice}`);
    assert.equal(estado.miembros.length, 1);
  }
});

// Documento como lo guardaba la feature 002: versión 2 y sin actividades.
function comoV2(estado) {
  const { actividades, ...resto } = estado;
  return { ...resto, version: 2 };
}

// Actividad guardada tal como la escribe la feature 003 (para probar el almacén sin depender de sus operaciones).
function actividadGuardada(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, nombre: 'Lavar los platos', icono: 'platos', miembroId: diana.id,
    espacioId: espaciosDeTipo(estado, 'cocina')[0].id, tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null, hechaEn: null,
    creadoEn: '2026-10-06T10:00:00.000Z', actualizadoEn: '2026-10-06T10:00:00.000Z',
    creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1', eliminadoEn: null, ...extra,
  };
}

function hogarConActividades(ctx) {
  const e = hogarConHabitantes(ctx);
  const propietario = e.miembros[0];
  return {
    ...e,
    actividades: [
      actividadGuardada(e, 'act-1'),
      actividadGuardada(e, 'act-2', { nombre: 'Barrer', icono: 'barrer', miembroId: propietario.id, espacioId: null, tipo: 'repetitiva', frecuenciaDias: 7 }),
      actividadGuardada(e, 'act-3', { hechaEn: '2026-10-05' }),
    ],
  };
}

const conActividad = (base, nueva) => ({ ...base, actividades: base.actividades.map((a) => (a.id === nueva.id ? nueva : a)) });

test('AC-8.1 (003): las actividades se guardan y se restauran igual', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConActividades(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
});

test('AC-8.4 (003): un hogar de la feature 002 se abre sin aviso, sin actividades, y se guarda como versión 3 en el siguiente guardado', () => {
  const e = hogarConHabitantes(crearCtx());
  const textoV2 = JSON.stringify(comoV2(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV2 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios y habitantes, sin actividades; ya en versión 3 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV2); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 3);
});

test('migrarAV3 es pura: no modifica el documento de entrada y solo agrega la lista de actividades vacía', () => {
  const v2 = comoV2(hogarConHabitantes(crearCtx()));
  const copia = structuredClone(v2);
  const v3 = migrarAV3(v2);
  assert.deepEqual(v2, copia);
  assert.equal(v3.version, 3);
  assert.deepEqual(v3.actividades, []);
  assert.deepEqual(comoV2(v3), v2);
});

test('AC-8.5 (003): una actividad activa inválida vuelve ilegible el documento', () => {
  const base = hogarConActividades(crearCtx());
  const [act1, act2, act3] = base.actividades;
  const variantes = [
    { ...act1, tipo: 'mensual' },
    { ...act1, icono: 'escoba' },
    { ...act1, icono: 'toString' },
    { ...act1, nombre: 42 },
    { ...act1, vence: '2026-02-30' },
    { ...act1, vence: null },
    { ...act1, frecuenciaDias: 7 },
    { ...act1, miembroId: 'no-existe' },
    { ...act1, espacioId: 'no-existe' },
    { ...act1, espacioId: 'pasillo:izq' },
    { ...act2, frecuenciaDias: 5 },
    { ...act2, frecuenciaDias: '7' },
    { ...act2, hechaEn: '2026-10-05' },
    { ...act3, hechaEn: '2026-13-01' },
  ];
  for (const mala of variantes) {
    const { estado, aviso } = abrirDatos(conActividad(base, mala));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(mala));
    assert.deepEqual(estado.actividades, []);
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-8.5 (003): un documento v3 sin lista de actividades, o con una activa que apunta a un miembro o a un espacio eliminados, es ilegible', () => {
  const base = hogarConActividades(crearCtx());
  const { actividades, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const diana = base.miembros[1];
  const sinDiana = { ...base, miembros: base.miembros.map((m) => (m.id === diana.id ? { ...m, eliminadoEn: '2026-10-06T11:00:00.000Z' } : m)) };
  assert.match(abrirDatos(sinDiana).aviso, /No se pudo recuperar/); // act-1 sigue activa y apunta a Diana
  const borrado = { ...base.espacios[0], id: 'esp-borrado', tipo: 'lavanderia', eliminadoEn: '2026-10-06T11:00:00.000Z' };
  const conEspacioBorrado = conActividad({ ...base, espacios: [...base.espacios, borrado] }, { ...base.actividades[0], espacioId: 'esp-borrado' });
  assert.match(abrirDatos(conEspacioBorrado).aviso, /No se pudo recuperar/);
});

test('AC-8.6 (003): una actividad eliminada con datos inválidos no vuelve ilegible el documento', () => {
  const base = hogarConActividades(crearCtx());
  const mala = { ...base.actividades[0], icono: 'escoba', miembroId: 'no-existe', vence: 'ayer', eliminadoEn: '2026-10-06T11:00:00.000Z' };
  const guardado = conActividad(base, mala);
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
});
