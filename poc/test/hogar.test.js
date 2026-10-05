// test/hogar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, espaciosDeTipo, espaciosActivos, contar, puedeAgregar, puedeQuitar, puedeEliminar,
  agregarEspacio, quitarUltimo, eliminarEspacio, requiereConfirmacion, siguienteDestinoBano, banoDe,
  nombreVisible, renombrarEspacio, renombrarMiembro, buscarEspacio,
} from '../src/hogar.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const nombres = (estado, tipo) => espaciosDeTipo(estado, tipo).map((e) => nombreVisible(estado, e));

test('AC-1.1, AC-1.2, AC-8.4: hogar inicial', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  assert.deepEqual(['sala', 'cocina', 'bano', 'dormitorio', 'comedor', 'oficina'].map((t) => contar(e, t)), [1, 1, 1, 1, 0, 0]);
  assert.equal(e.hogares[0].nombre, 'Mi hogar');
  assert.equal(e.miembros.length, 1);
  assert.equal(e.miembros[0].nombre, 'Personaje 1');
  assert.equal(e.miembros[0].cuentaId, e.cuentas[0].id);
  assert.deepEqual(e.membresias.map((m) => [m.cuentaId, m.hogarId, m.rol]), [[e.cuentas[0].id, e.hogares[0].id, 'propietario']]);
});

test('AC-3.2: + agrega al final del tipo', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  assert.deepEqual(nombres(e, 'dormitorio'), ['Dormitorio 1', 'Dormitorio 2']);
});

test('AC-3.3, AC-3.4: límites desactivan + y −', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  assert.equal(puedeQuitar(e, 'cocina'), false);
  assert.equal(puedeAgregar(e, 'sala'), false);
  assert.equal(puedeQuitar(e, 'sala'), false);
  e = agregar(e, ctx, 'dormitorio', 'dormitorio', 'dormitorio');
  assert.equal(puedeAgregar(e, 'dormitorio'), false);
  const intento = agregarEspacio(e, 'dormitorio', ctx);
  assert.equal(contar(intento, 'dormitorio'), 4);
});

test('AC-3.7: − quita el último y no toca otros espacios', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'lavanderia');
  const idsAntes = espaciosActivos(e).map((x) => x.id);
  const ultimo = espaciosDeTipo(e, 'dormitorio')[2].id;
  const despues = quitarUltimo(e, 'dormitorio', ctx);
  assert.deepEqual(espaciosActivos(despues).map((x) => x.id), idsAntes.filter((id) => id !== ultimo));
});

test('AC-4.1, AC-4.2: + en baños usa el primer cuarto libre', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'oficina');
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  e = agregarEspacio(e, 'bano', ctx);
  assert.equal(banoDe(e, d1.id).contenidoEn, d1.id);
  assert.equal(siguienteDestinoBano(e).id, d2.id);
});

test('AC-4.3, AC-4.5: límites del contador de baños', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  assert.equal(puedeQuitar(e, 'bano'), false);
  e = agregarEspacio(e, 'bano', ctx);
  assert.equal(puedeAgregar(e, 'bano'), false);
});

test('AC-4.4: − elimina el baño creado más recientemente', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano', 'bano', 'bano');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, banoDe(e, d1.id).id, ctx); // libera Dormitorio 1
  e = agregarEspacio(e, 'bano', ctx); // nuevo baño en Dormitorio 1: el más reciente
  const banoD2 = banoDe(e, d2.id).id;
  const banoD3 = banoDe(e, d3.id).id;
  e = quitarUltimo(e, 'bano', ctx);
  assert.equal(banoDe(e, d1.id), null);
  assert.equal(banoDe(e, d2.id).id, banoD2);
  assert.equal(banoDe(e, d3.id).id, banoD3);
});

test('AC-4.6: eliminar un cuarto mueve su baño al primer cuarto libre', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, banoDe(e, d1.id).id, ctx);
  e = agregarEspacio(e, 'bano', ctx); // en Dormitorio 1
  e = agregarEspacio(e, 'bano', ctx); // en Dormitorio 2
  const banoD2 = banoDe(e, d2.id);
  e = renombrarEspacio(e, banoD2.id, 'Baño de visitas', ctx).estado;
  assert.equal(requiereConfirmacion(e, d2.id), false);
  e = eliminarEspacio(e, d2.id, ctx);
  const movido = buscarEspacio(e, banoD2.id);
  assert.equal(movido.contenidoEn, d3.id);
  assert.equal(movido.nombrePersonalizado, 'Baño de visitas');
});

test('AC-4.7: si no hay cuarto libre el baño se elimina con su cuarto, con confirmación', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'oficina', 'bano', 'bano');
  const oficina = espaciosDeTipo(e, 'oficina')[0];
  assert.equal(requiereConfirmacion(e, oficina.id), true);
  e = eliminarEspacio(e, oficina.id, ctx);
  assert.equal(contar(e, 'bano'), 2);
  assert.equal(contar(e, 'oficina'), 0);
});

test('AC-4.8: agregar o eliminar otros espacios no mueve los baños', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano', 'bano', 'bano');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, banoDe(e, d2.id).id, ctx);
  const b1 = banoDe(e, d1.id).id;
  const b3 = banoDe(e, d3.id).id;
  e = agregar(e, ctx, 'oficina', 'lavanderia');
  e = eliminarEspacio(e, espaciosDeTipo(e, 'lavanderia')[0].id, ctx);
  assert.equal(banoDe(e, d1.id).id, b1);
  assert.equal(banoDe(e, d3.id).id, b3);
});

test('AC-5.2: eliminar un espacio concreto renumera a los demás', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio');
  const [, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, d2.id, ctx);
  assert.deepEqual(nombres(e, 'dormitorio'), ['Dormitorio 1', 'Dormitorio 2']);
  assert.equal(espaciosDeTipo(e, 'dormitorio')[1].id, d3.id);
});

test('AC-5.3, AC-5.4: confirmación solo con nombre personalizado', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  assert.equal(requiereConfirmacion(e, d2.id), false);
  e = renombrarEspacio(e, d2.id, 'Cuarto de Bryam', ctx).estado;
  assert.equal(requiereConfirmacion(e, d2.id), true);
});

test('AC-5.5: no se puede eliminar en el mínimo ni el baño común', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  for (const tipo of ['sala', 'cocina', 'bano', 'dormitorio']) {
    assert.equal(puedeEliminar(e, espaciosDeTipo(e, tipo)[0].id), false, tipo);
  }
});

test('AC-6.1, AC-6.2, AC-6.3: nombre personalizado estable y restablecible', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio');
  const d3 = espaciosDeTipo(e, 'dormitorio')[2];
  e = renombrarEspacio(e, d3.id, '  Cuarto de Bryam ', ctx).estado;
  e = eliminarEspacio(e, espaciosDeTipo(e, 'dormitorio')[0].id, ctx);
  assert.equal(nombreVisible(e, buscarEspacio(e, d3.id)), 'Cuarto de Bryam');
  e = renombrarEspacio(e, d3.id, '   ', ctx).estado;
  assert.equal(nombreVisible(e, buscarEspacio(e, d3.id)), 'Dormitorio 2');
});

test('AC-6.4: rechaza duplicados y formato automático', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  e = renombrarEspacio(e, d1.id, 'Estudio', ctx).estado;
  for (const [texto, error] of [['cocina 1', 'formato-automatico'], ['Dormitorio 3', 'formato-automatico'], ['BAÑO 7', 'formato-automatico'], ['estudio', 'duplicado']]) {
    const r = renombrarEspacio(e, d2.id, texto, ctx);
    assert.equal(r.ok, false, texto);
    assert.equal(r.error, error, texto);
    assert.equal(buscarEspacio(r.estado, d2.id).nombrePersonalizado, null);
  }
});

test('AC-6.5: máximo 20 caracteres', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const sala = espaciosDeTipo(e, 'sala')[0];
  assert.equal(renombrarEspacio(e, sala.id, 'x'.repeat(21), ctx).error, 'largo');
  assert.equal(renombrarEspacio(e, sala.id, 'x'.repeat(20), ctx).ok, true);
});

test('AC-6.6, AC-6.7: renombrar personaje', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const id = e.miembros[0].id;
  assert.equal(renombrarMiembro(e, id, 'Diana', ctx).estado.miembros[0].nombre, 'Diana');
  const vacio = renombrarMiembro(e, id, '  ', ctx);
  assert.equal(vacio.ok, false);
  assert.equal(vacio.estado.miembros[0].nombre, 'Personaje 1');
});

test('AC-8.1: el identificador sobrevive a renombres, renumeraciones y mudanzas', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano');
  const [d1, , d3] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = renombrarEspacio(e, d3.id, 'Taller', ctx).estado;
  e = eliminarEspacio(e, d1.id, ctx);
  assert.ok(buscarEspacio(e, d3.id));
  assert.ok(buscarEspacio(e, bano.id));
  assert.notEqual(buscarEspacio(e, bano.id).contenidoEn, d1.id);
});

test('AC-8.2: borrado lógico y nombre reutilizable', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  e = renombrarEspacio(e, d2.id, 'Taller', ctx).estado;
  e = eliminarEspacio(e, d2.id, ctx);
  const registro = e.espacios.find((x) => x.id === d2.id);
  assert.ok(registro.eliminadoEn);
  assert.equal(buscarEspacio(e, d2.id), null);
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  assert.equal(renombrarEspacio(e, d1.id, 'Taller', ctx).ok, true);
});

test('AC-8.3: auditoría en cada registro', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = agregarEspacio(e, 'oficina', ctx);
  const oficina = espaciosDeTipo(e, 'oficina')[0];
  e = renombrarEspacio(e, oficina.id, 'Estudio', ctx).estado;
  const registros = [...e.cuentas, ...e.hogares, ...e.membresias, ...e.espacios, ...e.miembros];
  for (const r of registros) {
    assert.ok(r.creadoEn && r.actualizadoEn);
    assert.equal(r.creadoPor, 'cuenta-1');
    assert.equal(r.actualizadoPor, 'cuenta-1');
    assert.ok('eliminadoEn' in r);
  }
  const renombrada = buscarEspacio(e, oficina.id);
  assert.ok(renombrada.actualizadoEn > renombrada.creadoEn);
});
