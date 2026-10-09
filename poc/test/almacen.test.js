// test/almacen.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, migrarAV4, migrarAV5, migrarAV6, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
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
  const { actividades, bloques, intercambios, historial, ...resto } = estado;
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

test('AC-9.3 (002), AC-8.3 (003), AC-11.3 (004): un hogar de la feature 001 se abre sin aviso y se guarda como versión 6 en el siguiente guardado', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  e = renombrarEspacio(e, espaciosDeTipo(e, 'dormitorio')[1].id, 'Cuarto de Bryam', ctx).estado;
  const textoV1 = JSON.stringify(comoV1(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV1 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, nombres y personaje, sin actividades ni bloques; ya en versión 6 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV1); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 6);
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
  const { actividades, bloques, intercambios, historial, ...resto } = estado;
  return { ...resto, version: 2 };
}

// Actividad guardada tal como la escribe la feature 003 (para probar el almacén sin depender de sus operaciones).
function actividadGuardada(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, nombre: 'Lavar los platos', icono: 'platos', miembroId: diana.id,
    espacioId: espaciosDeTipo(estado, 'cocina')[0].id, tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null, hechaEn: null, devolverA: null,
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

test('AC-8.4 (003), AC-11.4 (004): un hogar de la feature 002 se abre sin aviso, sin actividades ni bloques, y se guarda como versión 6 en el siguiente guardado', () => {
  const e = hogarConHabitantes(crearCtx());
  const textoV2 = JSON.stringify(comoV2(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV2 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios y habitantes, sin actividades ni bloques; ya en versión 6 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV2); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 6);
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

// Documento como lo guardaba la feature 003: versión 3 y sin bloques de rutina.
function comoV3(estado) {
  const { bloques, intercambios, historial, ...resto } = estado;
  return { ...resto, version: 3, actividades: estado.actividades.map(({ devolverA, ...a }) => a) };
}

// Bloque guardado tal como lo escribe la feature 004 (para probar el almacén sin depender de sus operaciones).
function bloqueGuardado(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, miembroId: diana.id, dias: 'laborables', inicio: 540, fin: 1080, espacioId: null,
    creadoEn: '2026-10-07T10:00:00.000Z', actualizadoEn: '2026-10-07T10:00:00.000Z',
    creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1', eliminadoEn: null, ...extra,
  };
}

function hogarConBloques(ctx) {
  const e = hogarConActividades(ctx);
  return {
    ...e,
    bloques: [
      bloqueGuardado(e, 'blq-1'), // Lun–Vie 09:00–18:00, fuera de casa
      bloqueGuardado(e, 'blq-2', { dias: 'finde', inicio: 0, fin: 420, espacioId: espaciosDeTipo(e, 'dormitorio')[0].id }),
      bloqueGuardado(e, 'blq-3', { inicio: 1080, fin: 1140, espacioId: espaciosDeTipo(e, 'cocina')[0].id }),
    ],
  };
}

const conBloque = (base, nuevo) => ({ ...base, bloques: base.bloques.map((b) => (b.id === nuevo.id ? nuevo : b)) });

test('AC-11.1, AC-12.3: los bloques de rutina se guardan y se restauran igual, en versión 6', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConBloques(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.equal(estado.version, 6);
});

test('AC-11.5: un hogar de la feature 003 se abre sin aviso, sin bloques, y se guarda como versión 6 en el siguiente guardado', () => {
  const e = hogarConActividades(crearCtx());
  const textoV3 = JSON.stringify(comoV3(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV3 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, habitantes y actividades, sin bloques; ya en versión 6 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV3); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 6);
});

test('migrarAV4 es pura: no modifica el documento de entrada y solo agrega la lista de bloques vacía', () => {
  const v3 = comoV3(hogarConActividades(crearCtx()));
  const copia = structuredClone(v3);
  const v4 = migrarAV4(v3);
  assert.deepEqual(v3, copia);
  assert.equal(v4.version, 4);
  assert.deepEqual(v4.bloques, []);
  assert.deepEqual(comoV3(v4), v3);
});

test('AC-11.6: un bloque activo inválido, o un documento v4 sin lista de bloques, vuelve ilegible el documento', () => {
  const base = hogarConBloques(crearCtx());
  const [b1, b2, b3] = base.bloques;
  const [propietario, , firulais] = base.miembros;
  const { espacioId, ...sinEspacio } = b1;
  const variantes = [
    { ...b1, dias: 'lunes' }, { ...b1, dias: 'toString' }, { ...b1, dias: null },
    { ...b1, inicio: 545 }, { ...b1, inicio: -30 }, { ...b1, inicio: '540' }, { ...b1, fin: 1470 }, { ...b1, fin: 1080.5 },
    { ...b1, inicio: 600, fin: 600 }, { ...b1, inicio: 660, fin: 600 },
    { ...b1, miembroId: propietario.id }, { ...b1, miembroId: firulais.id }, { ...b1, miembroId: 'no-existe' },
    { ...b1, espacioId: 'no-existe' }, { ...b1, espacioId: 'pasillo:izq' }, sinEspacio,
    { ...b3, inicio: 1050 }, // se superpone con blq-1 (Lun–Vie 09:00–18:00)
  ];
  for (const malo of variantes) {
    const { estado, aviso } = abrirDatos(conBloque(base, malo));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.deepEqual(estado.bloques, []);
    assert.equal(estado.miembros.length, 1);
  }
  const { bloques, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const borrado = { ...base.espacios[0], id: 'esp-borrado', tipo: 'lavanderia', eliminadoEn: '2026-10-07T11:00:00.000Z' };
  const conEspacioBorrado = conBloque({ ...base, espacios: [...base.espacios, borrado] }, { ...b2, espacioId: 'esp-borrado' });
  assert.match(abrirDatos(conEspacioBorrado).aviso, /No se pudo recuperar/);
});

test('AC-11.7: un bloque eliminado con datos inválidos no vuelve ilegible el documento', () => {
  const base = hogarConBloques(crearCtx());
  const malo = { ...base.bloques[0], dias: 'lunes', miembroId: 'no-existe', inicio: 7, eliminadoEn: '2026-10-07T11:00:00.000Z' };
  const guardado = conBloque(base, malo);
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
});

test('AC-11.8: el documento guardado no tiene posiciones, objetivos ni datos de la entrada o del cartel', () => {
  const storage = almacenEnMemoria();
  crearAlmacen(storage).guardar(hogarConBloques(crearCtx()));
  const guardado = JSON.parse(storage.datos.get(CLAVE_DATOS));
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'historial', 'hogares', 'intercambios', 'membresias', 'miembros', 'version']);
  for (const b of guardado.bloques) {
    assert.deepEqual(Object.keys(b).sort(), ['actualizadoEn', 'actualizadoPor', 'creadoEn', 'creadoPor', 'dias', 'eliminadoEn',
      'espacioId', 'fin', 'hogarId', 'id', 'inicio', 'miembroId']);
  }
});

test('AC-11.6: un bloque activo que apunta a un familiar eliminado vuelve ilegible el documento', () => {
  const base = { ...hogarConBloques(crearCtx()), actividades: [] }; // sin actividades: solo los bloques apuntan a Diana
  const diana = base.miembros[1];
  const sinDiana = { ...base, miembros: base.miembros.map((m) => (m.id === diana.id ? { ...m, eliminadoEn: '2026-10-07T11:00:00.000Z' } : m)) };
  assert.ok(sinDiana.bloques.some((b) => b.eliminadoEn === null && b.miembroId === diana.id));
  const { estado, aviso } = abrirDatos(sinDiana);
  assert.match(aviso, /No se pudo recuperar/);
  assert.deepEqual(estado.bloques, []);
  const todosEliminados = { ...sinDiana, bloques: sinDiana.bloques.map((b) => ({ ...b, eliminadoEn: '2026-10-07T11:00:00.000Z' })) };
  assert.equal(abrirDatos(todosEliminados).aviso, null); // si sus bloques también están eliminados, el documento es legible
});

// Documento como lo guardaba la feature 004: versión 4, sin intercambios ni regreso pendiente en las actividades.
function comoV4(estado) {
  const { intercambios, historial, ...resto } = estado;
  return { ...resto, version: 4, actividades: estado.actividades.map(({ devolverA, ...a }) => a) };
}

// Propuesta guardada tal como la escribe la feature 005 (para probar el almacén sin depender de sus operaciones).
function intercambioGuardado(estado, id, extra = {}) {
  const [propietario, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, proponenteId: propietario.id, destinatarioId: diana.id,
    actividadOfrecidaId: 'act-5', actividadPedidaId: 'act-4',
    marcaOfrecida: '2026-10-08T10:00:00.000Z', marcaPedida: '2026-10-08T10:00:00.000Z',
    estado: 'pendiente', respondidoEn: null,
    creadoEn: '2026-10-08T10:00:00.000Z', actualizadoEn: '2026-10-08T10:00:00.000Z',
    creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1', eliminadoEn: null, ...extra,
  };
}

// Hogar con un intercambio ya aceptado ("Barrer", repetitiva, está con Diana y vuelve al propietario; los platos pasaron al
// propietario) y una propuesta pendiente ("Basura" del propietario por "Plantas" de Diana).
function hogarConIntercambios(ctx) {
  const e = hogarConBloques(ctx);
  const [propietario, diana] = e.miembros;
  const [act1, act2, act3] = e.actividades;
  return {
    ...e,
    actividades: [
      { ...act1, miembroId: propietario.id },
      { ...act2, miembroId: diana.id, devolverA: propietario.id },
      act3,
      actividadGuardada(e, 'act-4', { nombre: 'Plantas', icono: 'plantas', espacioId: null }),
      actividadGuardada(e, 'act-5', { nombre: 'Basura', icono: 'basura', miembroId: propietario.id, espacioId: null }),
    ],
    intercambios: [
      intercambioGuardado(e, 'int-1', {
        estado: 'aceptado', actividadOfrecidaId: 'act-2', actividadPedidaId: 'act-1', respondidoEn: '2026-10-08T11:00:00.000Z',
      }),
      intercambioGuardado(e, 'int-2'),
    ],
  };
}

const conIntercambio = (base, nuevo) => ({ ...base, intercambios: base.intercambios.map((i) => (i.id === nuevo.id ? nuevo : i)) });

test('AC-10.1 (005): los intercambios y el regreso pendiente se guardan y se restauran igual, en versión 6', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConIntercambios(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.equal(estado.version, 6);
  assert.equal(estado.actividades[1].devolverA, e.miembros[0].id);
});

test('AC-10.3 (005): un hogar de la feature 004 se abre sin aviso, sin intercambios ni regresos, y se guarda como versión 6 en el siguiente guardado', () => {
  const e = hogarConBloques(crearCtx());
  const textoV4 = JSON.stringify(comoV4(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV4 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, habitantes, actividades y bloques, sin intercambios; ya en versión 6 en memoria
  assert.ok(estado.actividades.every((a) => a.devolverA === null));
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV4); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 6);
});

test('migrarAV5 es pura: no modifica el documento de entrada y solo agrega el regreso vacío y la lista de intercambios vacía', () => {
  const v4 = comoV4(hogarConBloques(crearCtx()));
  const copia = structuredClone(v4);
  const v5 = migrarAV5(v4);
  assert.deepEqual(v4, copia);
  assert.equal(v5.version, 5);
  assert.deepEqual(v5.intercambios, []);
  assert.ok(v5.actividades.every((a) => a.devolverA === null));
  assert.deepEqual(comoV4(v5), v4);
});

test('AC-10.4 (005): un regreso pendiente inválido en una actividad activa vuelve ilegible el documento', () => {
  const base = hogarConIntercambios(crearCtx());
  const [act1, act2] = base.actividades;
  const [, diana, firulais] = base.miembros;
  const { devolverA, ...sinCampo } = act2;
  const variantes = [
    { ...act2, devolverA: 'no-existe' },
    { ...act2, devolverA: diana.id }, // su propio responsable
    { ...act2, devolverA: firulais.id }, // una mascota
    { ...act1, devolverA: diana.id }, // una puntual no recuerda a nadie
    sinCampo,
  ];
  for (const mala of variantes) {
    const { estado, aviso } = abrirDatos(conActividad(base, mala));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(mala));
    assert.deepEqual(estado.intercambios, []);
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-10.5 (005): un documento v5 sin lista de intercambios, o con una propuesta pendiente inválida, es ilegible', () => {
  const base = hogarConIntercambios(crearCtx());
  const [, pendiente] = base.intercambios;
  const { intercambios, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const variantes = [
    { ...pendiente, estado: 'anulado' },
    { ...pendiente, estado: 'toString' },
    { ...pendiente, proponenteId: 'no-existe' },
    { ...pendiente, destinatarioId: 'no-existe' },
    { ...pendiente, actividadOfrecidaId: 'no-existe' },
    { ...pendiente, actividadPedidaId: 'no-existe' },
    { ...pendiente, marcaOfrecida: null },
    { ...pendiente, marcaPedida: 7 },
  ];
  for (const malo of variantes) {
    const { estado, aviso } = abrirDatos(conIntercambio(base, malo));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.deepEqual(estado.intercambios, []);
  }
});

test('AC-10.6 (005): una propuesta ya respondida con datos inválidos, o una actividad eliminada con un regreso inválido, no vuelve ilegible el documento', () => {
  const base = hogarConIntercambios(crearCtx());
  const malo = { ...base.intercambios[0], proponenteId: 'no-existe', actividadPedidaId: 'no-existe', marcaOfrecida: null };
  for (const resuelto of ['aceptado', 'rechazado', 'retirado']) {
    const guardado = conIntercambio(base, { ...malo, estado: resuelto });
    const { estado, aviso } = abrirDatos(guardado);
    assert.equal(aviso, null, resuelto);
    assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
  }
  const eliminada = { ...base.actividades[1], devolverA: 'no-existe', eliminadoEn: '2026-10-08T12:00:00.000Z' };
  const guardado = conActividad(base, eliminada);
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
});

test('AC-10.7 (005): el documento guardado no tiene vigencia calculada, números de propuestas ni posiciones', () => {
  const storage = almacenEnMemoria();
  crearAlmacen(storage).guardar(hogarConIntercambios(crearCtx()));
  const guardado = JSON.parse(storage.datos.get(CLAVE_DATOS));
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'historial', 'hogares', 'intercambios',
    'membresias', 'miembros', 'version']);
  for (const i of guardado.intercambios) {
    assert.deepEqual(Object.keys(i).sort(), ['actividadOfrecidaId', 'actividadPedidaId', 'actualizadoEn', 'actualizadoPor', 'creadoEn',
      'creadoPor', 'destinatarioId', 'eliminadoEn', 'estado', 'hogarId', 'id', 'marcaOfrecida', 'marcaPedida', 'proponenteId', 'respondidoEn']);
  }
});

// ---------- Feature 006: historial y calificaciones (versión 6) ----------

// Documento como lo guardaba la feature 005: versión 5, sin historial.
function comoV5(estado) {
  const { historial, ...resto } = estado;
  return { ...resto, version: 5 };
}

// Entrada guardada tal como la escribe la feature 006 (para probar el almacén sin depender de sus operaciones).
function entradaGuardada(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, actividadId: 'act-1', miembroId: diana.id, espacioId: espaciosDeTipo(estado, 'cocina')[0].id,
    nombre: 'Lavar los platos', icono: 'platos', hechaEn: '2026-10-08T10:00:00.000Z', dia: '2026-10-08', estrellas: null, calificadoPor: null,
    creadoEn: '2026-10-08T10:00:00.000Z', actualizadoEn: '2026-10-08T10:00:00.000Z', creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1',
    eliminadoEn: null, ...extra,
  };
}

// Hogar con tres entradas: una sin calificar (Diana), una de "Barrer" del propietario calificada por Diana (4) y una de "Basura" de
// Diana calificada por el propietario (2).
function hogarConHistorial(ctx) {
  const e = hogarConIntercambios(ctx);
  const [propietario, diana] = e.miembros;
  return {
    ...e,
    historial: [
      entradaGuardada(e, 'ent-1'),
      entradaGuardada(e, 'ent-2', {
        actividadId: 'act-2', miembroId: propietario.id, espacioId: null, nombre: 'Barrer', icono: 'barrer', estrellas: 4, calificadoPor: diana.id,
      }),
      entradaGuardada(e, 'ent-3', { actividadId: 'act-5', nombre: 'Basura', icono: 'basura', estrellas: 2, calificadoPor: propietario.id }),
    ],
  };
}

const conEntrada = (base, nueva) => ({ ...base, historial: base.historial.map((x) => (x.id === nueva.id ? nueva : x)) });

test('AC-8.1 (006): el historial y sus calificaciones se guardan y se restauran igual, en el mismo orden, en versión 6', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConHistorial(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.equal(estado.version, 6);
  assert.deepEqual(estado.historial.map((x) => x.id), ['ent-1', 'ent-2', 'ent-3']);
  assert.deepEqual([estado.historial[1].estrellas, estado.historial[1].calificadoPor], [4, e.miembros[1].id]);
});

test('AC-8.3, AC-8.8 (006): un hogar de la feature 005 se abre sin aviso, con el historial vacío y todo lo demás igual, y se guarda como versión 6 en el siguiente guardado', () => {
  const e = hogarConIntercambios(crearCtx());
  const textoV5 = JSON.stringify(comoV5(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV5 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, habitantes, actividades, bloques e intercambios; historial vacío; ya en versión 6 en memoria
  assert.deepEqual(estado.historial, []);
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV5); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 6);
});

test('migrarAV6 es pura: no modifica el documento de entrada y solo agrega la lista de historial vacía', () => {
  const v5 = comoV5(hogarConIntercambios(crearCtx()));
  const copia = structuredClone(v5);
  const v6 = migrarAV6(v5);
  assert.deepEqual(v5, copia);
  assert.equal(v6.version, 6);
  assert.deepEqual(v6.historial, []);
  assert.deepEqual(comoV5(v6), v5);
});

test('AC-8.4 (006): un documento v6 sin lista de historial, o con una entrada inválida, es ilegible', () => {
  const base = hogarConHistorial(crearCtx());
  const [sinCalificar, calificada] = base.historial;
  const [, diana] = base.miembros;
  const { historial, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const { dia, ...sinDia } = calificada;
  const variantes = [
    { ...calificada, nombre: '' }, { ...calificada, nombre: 7 },
    { ...calificada, hechaEn: null }, { ...calificada, hechaEn: '' },
    { ...calificada, dia: 'ayer' }, { ...calificada, dia: '2026-02-30' }, { ...calificada, dia: null }, sinDia,
    { ...calificada, actividadId: 'no-existe' }, { ...calificada, miembroId: 'no-existe' },
    { ...calificada, estrellas: 0 }, { ...calificada, estrellas: 6 }, { ...calificada, estrellas: 2.5 }, { ...calificada, estrellas: '4' },
    { ...calificada, estrellas: 4, calificadoPor: null }, // estrellas sin quien las dio
    { ...calificada, estrellas: null }, // quien las dio sin estrellas
    { ...sinCalificar, calificadoPor: diana.id },
    { ...calificada, calificadoPor: 'no-existe' },
  ];
  for (const mala of variantes) {
    const { estado, aviso } = abrirDatos(conEntrada(base, mala));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(mala));
    assert.deepEqual(estado.historial, []);
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-8.5 (006): una entrada con un espacio que no existe en el documento es ilegible; con un espacio eliminado, no', () => {
  const base = hogarConHistorial(crearCtx());
  const [entrada] = base.historial;
  assert.match(abrirDatos(conEntrada(base, { ...entrada, espacioId: 'no-existe' })).aviso, /No se pudo recuperar/);
  const eliminado = { ...espaciosDeTipo(base, 'cocina')[0], id: 'esp-eliminado', secuencia: 99, eliminadoEn: '2026-10-08T12:00:00.000Z' };
  const guardado = { ...conEntrada(base, { ...entrada, espacioId: eliminado.id }), espacios: [...base.espacios, eliminado] };
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.equal(estado.historial[0].espacioId, 'esp-eliminado');
});

test('AC-7.2, AC-7.6 (006): las entradas de una persona o de una actividad eliminadas no vuelven ilegible el documento', () => {
  const ctx = crearCtx();
  const base = hogarConHistorial(ctx);
  const sinDiana = eliminarHabitante(base, base.miembros[1].id, ctx); // elimina a Diana y sus actividades; las entradas quedan
  assert.ok(sinDiana.actividades.some((a) => a.eliminadoEn !== null));
  const { estado, aviso } = abrirDatos(sinDiana);
  assert.equal(aviso, null);
  assert.deepEqual(estado.historial, sinDiana.historial);
});

test('AC-6.6 (006): un historial guardado con más de 200 entradas se abre con normalidad y con todas ellas', () => {
  const base = hogarConHistorial(crearCtx());
  const muchas = Array.from({ length: 205 }, (_, i) => entradaGuardada(base, `ent-${i}`));
  const { estado, aviso } = abrirDatos({ ...base, historial: muchas });
  assert.equal(aviso, null);
  assert.equal(estado.historial.length, 205);
});

test('AC-8.6, AC-9.3 (006): el documento guardado no tiene promedios ni conteos y cada entrada referencia por identificador', () => {
  const storage = almacenEnMemoria();
  crearAlmacen(storage).guardar(hogarConHistorial(crearCtx()));
  const guardado = JSON.parse(storage.datos.get(CLAVE_DATOS));
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'historial', 'hogares', 'intercambios',
    'membresias', 'miembros', 'version']);
  for (const x of guardado.historial) {
    assert.deepEqual(Object.keys(x).sort(), ['actividadId', 'actualizadoEn', 'actualizadoPor', 'calificadoPor', 'creadoEn', 'creadoPor', 'dia',
      'eliminadoEn', 'espacioId', 'estrellas', 'hechaEn', 'hogarId', 'icono', 'id', 'miembroId', 'nombre']);
  }
});
