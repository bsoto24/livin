// test/habitantes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, editarHabitante, eliminarHabitante, puedeAgregarHabitante, puedeEliminarMiembro,
  familiares, mascotas, habitantes, contarHabitantes, buscarMiembro, esPropietario, renombrarMiembro, espaciosActivos,
} from '../src/hogar.js';
import { crearCtx } from './ayuda.js';

const FAMILIAR = { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' };
const MASCOTA = { nombre: 'Firulais', especie: 'perro' };

function alta(estado, clase, datos, ctx) {
  const r = agregarHabitante(estado, clase, datos, ctx);
  assert.equal(r.ok, true, `alta de ${datos.nombre}: ${r.error}`);
  return r.estado;
}

test('FR-1, AC-9.4 (002), FR-11 (003), FR-10 (004), FR-12 (005), FR-8 (006): el hogar inicial tiene versión 6, sin actividades, bloques, intercambios ni historial, y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 6);
  assert.deepEqual([e.actividades, e.bloques, e.intercambios, e.historial], [[], [], [], []]);
  const [propietario] = e.miembros;
  assert.deepEqual([propietario.tipo, propietario.parentesco, propietario.genero, propietario.especie], ['persona', null, null, null]);
  assert.equal(esPropietario(e, propietario), true);
  assert.deepEqual(habitantes(e), []);
  assert.deepEqual([contarHabitantes(e, 'familiar'), contarHabitantes(e, 'mascota')], [0, 0]);
});

test('AC-1.2, AC-10.3: alta de un familiar con nombre, parentesco y género', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  const [f] = familiares(e);
  assert.deepEqual([f.nombre, f.tipo, f.parentesco, f.genero, f.especie, f.cuentaId], ['Diana', 'persona', 'pareja', 'femenino', null, null]);
  assert.equal(f.hogarId, e.hogares[0].id);
  assert.equal(contarHabitantes(e, 'familiar'), 1);
  assert.deepEqual(mascotas(e), []);
});

test('AC-2.2, AC-10.3: alta de una mascota con nombre y especie, sin parentesco ni género', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'mascota', { ...MASCOTA, parentesco: 'pareja', genero: 'femenino' }, ctx);
  const [m] = mascotas(e);
  assert.deepEqual([m.nombre, m.tipo, m.parentesco, m.genero, m.especie, m.cuentaId], ['Firulais', 'mascota', null, null, 'perro', null]);
  assert.equal(contarHabitantes(e, 'mascota'), 1);
});

test('AC-1.3, AC-2.3, FR-2: faltan datos o están fuera de las listas cerradas', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const casos = [
    ['familiar', { nombre: 'Ana', genero: 'femenino' }, 'parentesco'],
    ['familiar', { nombre: 'Ana', parentesco: 'pareja' }, 'genero'],
    ['familiar', { nombre: 'Ana', parentesco: 'tia', genero: 'femenino' }, 'parentesco'],
    ['familiar', { nombre: 'Ana', parentesco: 'toString', genero: 'femenino' }, 'parentesco'],
    ['familiar', { nombre: 'Ana', parentesco: 'pareja', genero: 'x' }, 'genero'],
    ['mascota', { nombre: 'Michi' }, 'especie'],
    ['mascota', { nombre: 'Michi', especie: 'loro' }, 'especie'],
    ['familiar', { nombre: '', parentesco: 'pareja', genero: 'femenino' }, 'vacio'],
  ];
  for (const [clase, datos, error] of casos) {
    const r = agregarHabitante(e, clase, datos, ctx);
    assert.equal(r.ok, false, JSON.stringify(datos));
    assert.equal(r.error, error, JSON.stringify(datos));
    assert.equal(r.estado, e);
  }
});

test('AC-1.4, AC-2.4, FR-1: límites de 8 familiares y 4 mascotas; los eliminados no cuentan', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  for (let i = 1; i <= 8; i++) e = alta(e, 'familiar', { nombre: `F${i}`, parentesco: 'hijo', genero: 'otro' }, ctx);
  for (let i = 1; i <= 4; i++) e = alta(e, 'mascota', { nombre: `M${i}`, especie: 'gato' }, ctx);
  assert.equal(puedeAgregarHabitante(e, 'familiar'), false);
  assert.equal(puedeAgregarHabitante(e, 'mascota'), false);
  assert.equal(agregarHabitante(e, 'familiar', { nombre: 'F9', parentesco: 'hijo', genero: 'otro' }, ctx).error, 'limite');
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'M5', especie: 'gato' }, ctx).error, 'limite');
  e = eliminarHabitante(e, familiares(e)[0].id, ctx);
  assert.equal(contarHabitantes(e, 'familiar'), 7);
  assert.equal(puedeAgregarHabitante(e, 'familiar'), true);
});

test('AC-3.1: el nombre se guarda sin espacios al inicio ni al final', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'familiar', { ...FAMILIAR, nombre: '  Diana  ' }, ctx);
  assert.equal(familiares(e)[0].nombre, 'Diana');
});

test('AC-3.2: el nombre es único entre todos los miembros sin distinguir mayúsculas', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = renombrarMiembro(e, e.miembros[0].id, 'Diana', ctx).estado; // el personaje del propietario
  assert.equal(agregarHabitante(e, 'familiar', { ...FAMILIAR, nombre: 'diana' }, ctx).error, 'duplicado');
  assert.equal(agregarHabitante(e, 'mascota', { ...MASCOTA, nombre: 'DIANA' }, ctx).error, 'duplicado');
  e = alta(e, 'mascota', MASCOTA, ctx);
  assert.equal(agregarHabitante(e, 'familiar', { ...FAMILIAR, nombre: 'firulais' }, ctx).error, 'duplicado');
});

test('AC-3.3: máximo 20 caracteres', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'x'.repeat(21), especie: 'otro' }, ctx).error, 'largo');
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'x'.repeat(20), especie: 'otro' }, ctx).ok, true);
});

test('AC-3.4: el nombre de un habitante eliminado puede reutilizarse', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'mascota', { nombre: 'Luna', especie: 'gato' }, ctx);
  e = eliminarHabitante(e, mascotas(e)[0].id, ctx);
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'Luna', especie: 'perro' }, ctx).ok, true);
});

test('AC-3.5, AC-7.6, AC-10.1: editar cambia nombre y datos, rechaza el nombre vacío y conserva el identificador', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  const id = familiares(e)[0].id;
  const vacio = editarHabitante(e, id, { ...FAMILIAR, nombre: '   ' }, ctx);
  assert.equal(vacio.ok, false);
  assert.equal(vacio.error, 'vacio');
  assert.equal(buscarMiembro(vacio.estado, id).nombre, 'Diana');
  e = editarHabitante(e, id, { nombre: 'Dana', parentesco: 'hermano', genero: 'otro' }, ctx).estado;
  const f = buscarMiembro(e, id);
  assert.deepEqual([f.id, f.nombre, f.parentesco, f.genero], [id, 'Dana', 'hermano', 'otro']);
  assert.ok(f.actualizadoEn > f.creadoEn);
});

test('AC-7.5: editar una mascota cambia su especie y nunca le asigna parentesco ni género', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'mascota', MASCOTA, ctx);
  const id = mascotas(e)[0].id;
  e = editarHabitante(e, id, { nombre: 'Firulais', especie: 'gato', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  const m = buscarMiembro(e, id);
  assert.deepEqual([m.especie, m.parentesco, m.genero], ['gato', null, null]);
});

test('AC-7.8, FR-4: el personaje del propietario no se edita como habitante ni se elimina', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const id = e.miembros[0].id;
  assert.equal(puedeEliminarMiembro(e, id), false);
  assert.equal(eliminarHabitante(e, id, ctx), e);
  const r = editarHabitante(e, id, FAMILIAR, ctx);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'no-editable');
});

test('AC-8.3, AC-8.4: eliminar es un borrado lógico y no toca a nadie más', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  e = alta(e, 'mascota', MASCOTA, ctx);
  const [diana] = familiares(e);
  const espaciosAntes = espaciosActivos(e);
  const mascotaAntes = mascotas(e)[0];
  const despues = eliminarHabitante(e, diana.id, ctx);
  const registro = despues.miembros.find((m) => m.id === diana.id);
  assert.ok(registro.eliminadoEn);
  assert.equal(buscarMiembro(despues, diana.id), null);
  assert.equal(contarHabitantes(despues, 'familiar'), 0);
  assert.deepEqual(espaciosActivos(despues), espaciosAntes);
  assert.deepEqual(mascotas(despues)[0], mascotaAntes);
  assert.equal(esPropietario(despues, despues.miembros[0]), true);
});

test('AC-10.2: cada habitante tiene auditoría con la cuenta del propietario', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  e = alta(e, 'mascota', MASCOTA, ctx);
  for (const h of habitantes(e)) {
    assert.ok(h.creadoEn && h.actualizadoEn);
    assert.equal(h.creadoPor, 'cuenta-1');
    assert.equal(h.actualizadoPor, 'cuenta-1');
    assert.equal(h.eliminadoEn, null);
  }
});
