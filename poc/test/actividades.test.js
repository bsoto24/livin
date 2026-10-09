// test/actividades.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, quitarUltimo, ultimoDeTipo, renombrarEspacio,
  renombrarMiembro, eliminarHabitante, espaciosDeTipo, espaciosActivos, miembrosActivos, familiares, mascotas, banoDe,
  consecuenciasDeEliminar, requiereConfirmacion, actividadesPendientes, pendientesDeMiembro, nombreVisible, buscarEspacio,
  puedeEliminar,
} from '../src/hogar.js';
import {
  agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, contarActividades, puedeAgregarActividad,
  atraso, porHacer, limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo, MENSAJES_ACTIVIDAD,
  agregarActividades,
} from '../src/actividades.js';
import { LIMITE_ACTIVIDADES } from '../src/catalogo.js';
import { crearCtx, agregarActividadLegada } from './ayuda.js';

const HOY = '2026-10-06';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', aspecto: 'adulta' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const cocina = (estado) => espaciosDeTipo(estado, 'cocina')[0];
const diana = (estado) => familiares(estado)[0];

// Datos válidos de la ficha: una puntual de Diana en la cocina que vence hoy; `extra` cambia lo que haga falta.
const datos = (estado, extra = {}) => ({
  nombre: 'Lavar los platos', icono: 'platos', miembroId: diana(estado).id, espacioId: cocina(estado).id,
  tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
});

function alta(estado, d, ctx) {
  const r = agregarActividad(estado, d, ctx);
  assert.equal(r.ok, true, `alta de ${d.nombre}: ${r.error}`);
  return r.estado;
}

const ultima = (estado) => estado.actividades.at(-1);

test('AC-1.3, AC-9.2, AC-9.3: crear una puntual guarda sus datos, su auditoría y sus referencias por id', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const e = alta(base, datos(base), ctx);
  const a = ultima(e);
  assert.deepEqual(
    [a.nombre, a.icono, a.miembroId, a.espacioId, a.tipo, a.vence, a.frecuenciaDias, a.hechaEn, a.hogarId],
    ['Lavar los platos', 'platos', diana(base).id, cocina(base).id, 'puntual', HOY, null, null, base.hogares[0].id],
  );
  assert.ok(a.id && a.creadoEn && a.actualizadoEn);
  assert.deepEqual([a.creadoPor, a.actualizadoPor, a.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
  assert.equal('cuentaId' in a, false);
  assert.deepEqual([contarActividades(base), contarActividades(e)], [0, 1]);
  assert.deepEqual(buscarActividad(e, a.id), a);
});

test('AC-1.2, FR-1: una repetitiva exige una frecuencia de la lista; una puntual nunca guarda frecuencia', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  for (const frecuenciaDias of [null, 5, '7', 0]) {
    const r = agregarActividad(e, datos(e, { tipo: 'repetitiva', frecuenciaDias }), ctx);
    assert.equal(r.error, 'frecuencia', String(frecuenciaDias));
    assert.equal(r.estado, e);
  }
  for (const frecuenciaDias of [1, 2, 3, 7, 14, 30]) {
    assert.equal(ultima(alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias }), ctx)).frecuenciaDias, frecuenciaDias);
  }
  assert.equal(ultima(alta(e, datos(e, { tipo: 'puntual', frecuenciaDias: 7 }), ctx)).frecuenciaDias, null);
});

test('AC-1.6, FR-1: faltan datos o están fuera de las listas cerradas', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const firulais = mascotas(e)[0];
  e = eliminarHabitante(e, firulais.id, ctx);
  const casos = [
    [{ nombre: '' }, 'vacio'],
    [{ nombre: '   ' }, 'vacio'],
    [{ miembroId: undefined }, 'miembro'],
    [{ miembroId: '' }, 'miembro'],
    [{ miembroId: firulais.id }, 'miembro'], // miembro eliminado
    [{ icono: 'escoba' }, 'icono'],
    [{ icono: 'toString' }, 'icono'],
    [{ espacioId: 'pasillo:izq' }, 'espacio'],
    [{ espacioId: 'no-existe' }, 'espacio'],
    [{ tipo: 'mensual' }, 'tipo'],
    [{ vence: '2026-02-30' }, 'fecha'],
    [{ vence: '' }, 'fecha'],
  ];
  for (const [extra, error] of casos) {
    const r = agregarActividad(e, datos(e, extra), ctx);
    assert.equal(r.ok, false, JSON.stringify(extra));
    assert.equal(r.error, error, JSON.stringify(extra));
    assert.equal(r.estado, e);
  }
});

test('AC-1.9, AC-1.10: el nombre se recorta, admite hasta 30 caracteres y puede repetirse', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { nombre: '  Barrer  ' }), ctx);
  assert.equal(ultima(e).nombre, 'Barrer');
  e = alta(e, datos(e, { nombre: 'barrer' }), ctx);
  assert.equal(ultima(e).nombre, 'barrer');
  assert.equal(agregarActividad(e, datos(e, { nombre: 'x'.repeat(31) }), ctx).error, 'largo');
  assert.equal(ultima(alta(e, datos(e, { nombre: 'x'.repeat(30) }), ctx)).nombre, 'x'.repeat(30));
});

test('AC-1.4, AC-1.5, FR-1: la fecha puede ser pasada o futura y el espacio es opcional', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  assert.equal(ultima(alta(e, datos(e, { vence: '2026-10-03' }), ctx)).vence, '2026-10-03');
  assert.equal(ultima(alta(e, datos(e, { vence: '2026-12-24' }), ctx)).vence, '2026-12-24');
  assert.equal(ultima(alta(e, datos(e, { espacioId: null }), ctx)).espacioId, null);
  assert.equal(ultima(alta(e, datos(e, { espacioId: undefined }), ctx)).espacioId, null);
});

test('AC-1.7, FR-1: hasta 50 actividades pendientes; las eliminadas y las hechas no cuentan', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  for (let i = 1; i <= 50; i++) e = alta(e, datos(e, { nombre: `Tarea ${i}` }), ctx);
  assert.equal(contarActividades(e), 50);
  assert.equal(puedeAgregarActividad(e), false);
  const r = agregarActividad(e, datos(e, { nombre: 'Tarea 51' }), ctx);
  assert.deepEqual([r.ok, r.error, r.estado === e], [false, 'limite', true]);
  e = eliminarActividad(e, e.actividades[0].id, ctx);
  assert.equal(puedeAgregarActividad(e), true);
  e = alta(e, datos(e, { nombre: 'Tarea 51' }), ctx);
  e = marcarHecha(e, e.actividades[1].id, HOY, ctx);
  assert.equal(contarActividades(e), 49);
  assert.equal(puedeAgregarActividad(e), true);
});

test('AC-6.3, AC-6.4, AC-9.1: editar cambia todos los datos, pasa de puntual a repetitiva y vuelta, y conserva el identificador', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  const { id, creadoEn } = ultima(e);
  const propietario = miembrosActivos(e)[0];
  let r = editarActividad(e, id, {
    nombre: 'Pasear', icono: 'mascota', miembroId: propietario.id, espacioId: null, tipo: 'repetitiva', vence: '2026-10-08', frecuenciaDias: 2,
  }, ctx);
  assert.equal(r.ok, true, r.error);
  let a = buscarActividad(r.estado, id);
  assert.deepEqual(
    [a.id, a.nombre, a.icono, a.miembroId, a.espacioId, a.tipo, a.vence, a.frecuenciaDias, a.hechaEn],
    [id, 'Pasear', 'mascota', propietario.id, null, 'repetitiva', '2026-10-08', 2, null],
  );
  assert.equal(a.creadoEn, creadoEn);
  assert.ok(a.actualizadoEn > a.creadoEn);
  r = editarActividad(r.estado, id, { ...a, tipo: 'puntual' }, ctx);
  a = buscarActividad(r.estado, id);
  assert.deepEqual([a.id, a.tipo, a.frecuenciaDias], [id, 'puntual', null]);
  assert.equal(r.estado.actividades.length, 1);
});

test('AC-6.5: editar con un nombre vacío se rechaza y conserva el nombre anterior', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  const { id } = ultima(e);
  const r = editarActividad(e, id, datos(e, { nombre: '   ' }), ctx);
  assert.deepEqual([r.ok, r.error, r.estado === e], [false, 'vacio', true]);
  assert.equal(buscarActividad(e, id).nombre, 'Lavar los platos');
  assert.equal(editarActividad(e, 'no-existe', datos(e), ctx).error, 'no-encontrada');
});

test('AC-6.6, AC-7.10, FR-8: eliminar es un borrado lógico y no toca nada más', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  e = alta(e, datos(e, { nombre: 'Barrer', icono: 'barrer' }), ctx);
  const [platos, barrer] = e.actividades;
  const despues = eliminarActividad(e, platos.id, ctx);
  const registro = despues.actividades.find((a) => a.id === platos.id);
  assert.ok(registro.eliminadoEn);
  assert.equal(buscarActividad(despues, platos.id), null);
  assert.equal(contarActividades(despues), 1);
  assert.deepEqual(despues.actividades.find((a) => a.id === barrer.id), barrer);
  assert.deepEqual([despues.espacios, despues.miembros], [e.espacios, e.miembros]);
  assert.equal(eliminarActividad(despues, platos.id, ctx), despues);
  assert.equal(eliminarActividad(despues, 'no-existe', ctx), despues);
});

test('AC-3.2, AC-3.6, AC-3.8, AC-9.5: marcar como hecha una puntual de cualquier miembro registra el día y deja de estar pendiente', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = agregarActividadLegada(e, datos(e, { miembroId: mascotas(e)[0].id, vence: '2026-10-04' }), ctx).estado; // dato de una versión anterior
  const { id } = ultima(e);
  const despues = marcarHecha(e, id, HOY, ctx);
  const a = despues.actividades.find((x) => x.id === id);
  assert.deepEqual([a.id, a.hechaEn, a.eliminadoEn, a.vence], [id, HOY, null, '2026-10-04']);
  assert.equal(buscarActividad(despues, id), null);
  assert.deepEqual(actividadesPendientes(despues), []);
});

test('AC-3.3, AC-5.6: marcar como hecha una repetitiva la hace vencer hoy más su frecuencia, sin acumular atrasos', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias: 7, vence: '2026-09-20' }), ctx);
  e = alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias: 3, vence: HOY }), ctx);
  const [semanal, cadaTres] = e.actividades;
  e = marcarHecha(e, semanal.id, HOY, ctx);
  e = marcarHecha(e, cadaTres.id, HOY, ctx);
  assert.deepEqual([buscarActividad(e, semanal.id).vence, buscarActividad(e, cadaTres.id).vence], ['2026-10-13', '2026-10-09']);
  assert.equal(buscarActividad(e, semanal.id).hechaEn, null);
  assert.equal(contarActividades(e), 2);
});

test('FR-3: no se marca como hecha una actividad futura, ya hecha, eliminada o inexistente', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { vence: '2026-10-07' }), ctx);
  e = alta(e, datos(e, { nombre: 'Barrer' }), ctx);
  e = alta(e, datos(e, { nombre: 'Basura' }), ctx);
  const [futura, barrer, basura] = e.actividades;
  assert.equal(marcarHecha(e, futura.id, HOY, ctx), e);
  e = marcarHecha(e, barrer.id, HOY, ctx);
  assert.equal(marcarHecha(e, barrer.id, HOY, ctx), e);
  e = eliminarActividad(e, basura.id, ctx);
  assert.equal(marcarHecha(e, basura.id, HOY, ctx), e);
  assert.equal(marcarHecha(e, 'no-existe', HOY, ctx), e);
});

test('AC-7.1, AC-7.3, FR-9: eliminar un espacio elimina todas sus actividades y ninguna otra; la confirmación cuenta las pendientes', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'lavanderia', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  e = alta(e, datos(e, { espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { espacioId: d2.id, vence: '2026-10-20' }), ctx);
  e = alta(e, datos(e, { espacioId: d2.id, nombre: 'Hecha' }), ctx);
  e = marcarHecha(e, ultima(e).id, HOY, ctx);
  e = alta(e, datos(e), ctx); // en la cocina
  e = alta(e, datos(e, { espacioId: null }), ctx); // sin espacio
  assert.equal(consecuenciasDeEliminar(e, d2.id).actividades, 2);
  assert.equal(requiereConfirmacion(e, d2.id), true); // sin nombre personalizado, pero con actividades
  assert.equal(requiereConfirmacion(e, lavanderia.id), false); // sin nombre personalizado ni actividades
  const despues = eliminarEspacio(e, d2.id, ctx);
  const deD2 = despues.actividades.filter((a) => a.espacioId === d2.id);
  assert.equal(deD2.length, 3);
  assert.ok(deD2.every((a) => a.eliminadoEn !== null));
  assert.ok(despues.actividades.filter((a) => a.espacioId !== d2.id).every((a) => a.eliminadoEn === null));
  assert.equal(contarActividades(despues), 2);
});

test('AC-7.4: si el baño interno se elimina con su cuarto, también se eliminan sus actividades y la confirmación las suma', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  e = agregarEspacio(agregarEspacio(e, 'bano', ctx), 'bano', ctx); // los dos dormitorios tienen baño: no hay adónde moverlo
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const banoD1 = banoDe(e, d1.id);
  const banoD2 = banoDe(e, d2.id);
  e = alta(e, datos(e, { espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { espacioId: banoD2.id }), ctx);
  e = alta(e, datos(e, { espacioId: banoD2.id, vence: '2026-10-20' }), ctx);
  e = alta(e, datos(e, { espacioId: banoD1.id }), ctx);
  const c = consecuenciasDeEliminar(e, d2.id);
  assert.deepEqual([c.banoSeElimina, c.actividades], [true, 3]);
  const despues = eliminarEspacio(e, d2.id, ctx);
  assert.equal(buscarEspacio(despues, banoD2.id), null);
  assert.deepEqual(actividadesPendientes(despues).map((a) => a.espacioId), [banoD1.id]);
});

test('AC-7.5: si el baño interno se mueve a otro cuarto, conserva sus actividades y solo se eliminan las del cuarto', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx); // el baño va a Dormitorio 1
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = alta(e, datos(e, { espacioId: d1.id }), ctx);
  e = alta(e, datos(e, { espacioId: bano.id }), ctx);
  const c = consecuenciasDeEliminar(e, d1.id);
  assert.deepEqual([c.banoSeMueve, c.actividades], [true, 1]);
  const despues = eliminarEspacio(e, d1.id, ctx);
  assert.equal(buscarEspacio(despues, bano.id).contenidoEn, d2.id);
  assert.deepEqual(actividadesPendientes(despues).map((a) => a.espacioId), [bano.id]);
});

test('AC-7.6: quitar con "−" pide la misma confirmación y aplica la misma cascada', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const bano = ultimoDeTipo(e, 'bano');
  e = alta(e, datos(e, { espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { espacioId: bano.id }), ctx);
  assert.equal(ultimoDeTipo(e, 'dormitorio').id, d2.id);
  assert.deepEqual([requiereConfirmacion(e, d2.id), consecuenciasDeEliminar(e, d2.id).actividades], [true, 1]);
  assert.deepEqual([requiereConfirmacion(e, bano.id), consecuenciasDeEliminar(e, bano.id).actividades], [true, 1]);
  assert.deepEqual(actividadesPendientes(quitarUltimo(e, 'dormitorio', ctx)).map((a) => a.espacioId), [bano.id]);
  assert.deepEqual(actividadesPendientes(quitarUltimo(e, 'bano', ctx)).map((a) => a.espacioId), [d2.id]);
});

test('AC-7.7, AC-7.8, AC-7.9, FR-9: eliminar un habitante elimina sus actividades; el propietario no se elimina', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const propietario = miembrosActivos(e)[0];
  const firulais = mascotas(e)[0];
  for (const nombre of ['Uno', 'Dos', 'Tres', 'Hecha']) e = alta(e, datos(e, { nombre }), ctx);
  e = marcarHecha(e, ultima(e).id, HOY, ctx);
  e = alta(e, datos(e, { nombre: 'Del propietario', miembroId: propietario.id }), ctx);
  assert.equal(pendientesDeMiembro(e, diana(e).id), 3);
  assert.equal(pendientesDeMiembro(e, firulais.id), 0);
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.ok(sinDiana.actividades.filter((a) => a.miembroId === diana(e).id).every((a) => a.eliminadoEn !== null));
  assert.deepEqual(actividadesPendientes(sinDiana).map((a) => a.nombre), ['Del propietario']);
  assert.equal(eliminarHabitante(e, propietario.id, ctx), e);
});

test('AC-9.4: renombrar o renumerar el espacio o renombrar el miembro no cambia los vínculos', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'dormitorio', ctx);
  const [, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = alta(e, datos(e, { espacioId: d3.id }), ctx);
  const { id } = ultima(e);
  e = eliminarEspacio(e, d2.id, ctx);
  assert.equal(nombreVisible(e, buscarEspacio(e, d3.id)), 'Dormitorio 2');
  e = renombrarEspacio(e, d3.id, 'Cuarto de Bryam', ctx).estado;
  e = renombrarMiembro(e, diana(e).id, 'Dana', ctx).estado;
  const a = buscarActividad(e, id);
  assert.deepEqual([a.espacioId, a.miembroId], [d3.id, diana(e).id]);
});

// Hogar con todos los tipos de espacio al máximo y `banos` baños internos (de 0 a 6).
function hogarCompleto(ctx, banos) {
  let e = hogarBase(ctx);
  for (const tipo of ['comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota', 'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina']) {
    e = agregarEspacio(e, tipo, ctx);
  }
  for (let i = 0; i < banos; i++) e = agregarEspacio(e, 'bano', ctx);
  return e;
}

function referenciasValidas(estado) {
  const miembros = new Set(miembrosActivos(estado).map((m) => m.id));
  const espacios = new Set(espaciosActivos(estado).map((x) => x.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null)
    .every((a) => miembros.has(a.miembroId) && (a.espacioId === null || espacios.has(a.espacioId)));
}

test('Reliability, FR-9: ninguna baja de un espacio o de un miembro deja una actividad activa con referencias rotas', () => {
  for (const banos of [0, 3, 6]) {
    const ctx = crearCtx();
    let e = hogarCompleto(ctx, banos);
    for (const m of miembrosActivos(e).filter((x) => x.tipo === 'persona')) e = alta(e, datos(e, { miembroId: m.id, espacioId: null }), ctx); // las mascotas no pueden encargarse (ADR-007)
    for (const x of espaciosActivos(e)) e = alta(e, datos(e, { espacioId: x.id }), ctx);
    for (const x of espaciosActivos(e).filter((x) => puedeEliminar(e, x.id))) {
      const despues = eliminarEspacio(e, x.id, ctx);
      assert.ok(referenciasValidas(despues), `${banos} baños, sin ${nombreVisible(e, x)}`);
      assert.ok(contarActividades(despues) < contarActividades(e));
    }
    for (const m of miembrosActivos(e).slice(1)) assert.ok(referenciasValidas(eliminarHabitante(e, m.id, ctx)), m.nombre);
  }
});

// ---------- Estado derivado ----------

// Hogar con una actividad de Diana en la cocina por cada fecha de `vences`, en ese orden de creación.
function conVencimientos(vences, extra = {}) {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  for (const vence of vences) e = alta(e, datos(e, { vence, ...extra }), ctx);
  return { e, ctx };
}

test('FR-2, AC-2.7: por hacer son las pendientes que vencen hoy o antes, de la más atrasada a la menos', () => {
  const { e: base, ctx } = conVencimientos([HOY, '2026-10-05', '2026-10-07', '2026-10-01', '2026-10-02']);
  const [hoy, ayer, manana, hecha, eliminada] = base.actividades;
  let e = marcarHecha(base, hecha.id, HOY, ctx);
  e = eliminarActividad(e, eliminada.id, ctx);
  assert.deepEqual(porHacer(e, HOY).map((a) => a.id), [ayer.id, hoy.id]);
  assert.deepEqual([atraso(hoy, HOY), atraso(ayer, HOY), atraso(manana, HOY)], [0, 1, -1]);
});

test('AC-4.1 a AC-4.4, Reliability: umbrales del estado por días de atraso de la actividad más atrasada', () => {
  const casos = [
    [[], 'limpio'], [[HOY], 'limpio'], [['2026-10-07'], 'limpio'], [['2026-10-05'], 'desordenado'],
    [['2026-10-04'], 'desordenado'], [['2026-10-03'], 'desastre'], [['2026-09-01'], 'desastre'],
    [[HOY, '2026-10-04', '2026-10-07'], 'desordenado'],
  ];
  for (const [vences, esperado] of casos) {
    const { e } = conVencimientos(vences);
    assert.equal(limpiezaDeEspacio(e, cocina(e).id, HOY), esperado, vences.join(', '));
  }
});

test('AC-3.4, AC-3.5: al marcar como hecha la más atrasada, el estado sigue a la que queda', () => {
  const { e: base, ctx } = conVencimientos(['2026-10-02', '2026-10-05']);
  const [cuatro, uno] = base.actividades;
  assert.equal(limpiezaDeEspacio(base, cocina(base).id, HOY), 'desastre');
  const e = marcarHecha(base, cuatro.id, HOY, ctx);
  assert.equal(limpiezaDeEspacio(e, cocina(e).id, HOY), 'desordenado');
  assert.equal(limpiezaDeEspacio(marcarHecha(e, uno.id, HOY, ctx), cocina(e).id, HOY), 'limpio');
});

test('AC-4.5, AC-4.6: el estado de un espacio solo considera sus propias actividades; el baño interno es un espacio propio', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'bano', ctx);
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  const bano = banoDe(e, d1.id);
  const sala = espaciosDeTipo(e, 'sala')[0];
  e = alta(e, datos(e, { vence: '2026-10-01' }), ctx);
  e = alta(e, datos(e, { vence: '2026-10-01', espacioId: null }), ctx);
  e = alta(e, datos(e, { vence: '2026-10-05', espacioId: bano.id }), ctx);
  assert.deepEqual(
    [cocina(e), sala, d1, bano].map((x) => limpiezaDeEspacio(e, x.id, HOY)),
    ['desastre', 'limpio', 'limpio', 'desordenado'],
  );
});

test('AC-2.1, AC-2.2, AC-2.5, AC-2.6, FR-6: una burbuja por lugar, con el icono de la más atrasada y el indicador de más', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const sala = espaciosDeTipo(e, 'sala')[0];
  const firulais = mascotas(e)[0];
  e = alta(e, datos(e, { icono: 'platos', vence: HOY }), ctx);
  e = alta(e, datos(e, { icono: 'basura', vence: '2026-10-04' }), ctx);
  e = alta(e, datos(e, { icono: 'limpiar', vence: '2026-10-05' }), ctx);
  e = alta(e, datos(e, { icono: 'barrer', espacioId: sala.id }), ctx);
  e = alta(e, datos(e, { icono: 'ropa', espacioId: null, vence: '2026-10-05' }), ctx);
  e = alta(e, datos(e, { icono: 'compras', espacioId: null }), ctx);
  e = alta(e, datos(e, { icono: 'mascota' }), ctx); // con espacio: va en la burbuja de la cocina
  const [platos, basura, limpiar, barrer, ropa, compras, paseo] = e.actividades;
  assert.deepEqual(burbujas(e, HOY), [
    { tipo: 'espacio', id: cocina(e).id, icono: 'basura', actividades: [basura.id, limpiar.id, platos.id, paseo.id], mas: true },
    { tipo: 'miembro', id: diana(e).id, icono: 'ropa', actividades: [ropa.id, compras.id], mas: true },
    { tipo: 'espacio', id: sala.id, icono: 'barrer', actividades: [barrer.id], mas: false },
  ]);
});

test('AC-2.3: a igual atraso, la burbuja muestra el icono de la actividad creada primero', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { icono: 'plantas', vence: '2026-10-05' }), ctx);
  e = alta(e, datos(e, { icono: 'basura', vence: '2026-10-05' }), ctx);
  assert.equal(burbujas(e, HOY)[0].icono, 'plantas');
});

test('FR-7: la hoja de un lugar lista sus actividades por hacer en el orden de la burbuja', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { nombre: 'Hoy' }), ctx);
  e = alta(e, datos(e, { nombre: 'Atrasada', vence: '2026-10-03' }), ctx);
  e = alta(e, datos(e, { nombre: 'Futura', vence: '2026-10-09' }), ctx);
  e = alta(e, datos(e, { nombre: 'Sin espacio', espacioId: null }), ctx);
  const nombres = (lugar) => actividadesDelLugar(e, lugar, HOY).map((a) => a.nombre);
  assert.deepEqual(nombres({ tipo: 'espacio', id: cocina(e).id }), ['Atrasada', 'Hoy']);
  assert.deepEqual(nombres({ tipo: 'miembro', id: diana(e).id }), ['Sin espacio']);
  assert.deepEqual(nombres({ tipo: 'miembro', id: mascotas(e)[0].id }), []);
});

test('AC-6.1, FR-8: la lista del panel tiene todas las pendientes por fecha de vencimiento, sin las hechas ni las eliminadas', () => {
  const { e: base, ctx } = conVencimientos(['2026-10-20', HOY, '2026-10-01', '2026-10-09', '2026-10-02']);
  const [veinte, hoy, uno, nueve, dos] = base.actividades;
  let e = marcarHecha(base, dos.id, HOY, ctx);
  e = eliminarActividad(e, nueve.id, ctx);
  assert.deepEqual(listaDelPanel(e).map((a) => a.id), [uno.id, hoy.id, veinte.id]);
});

test('AC-3.1: el texto del plazo dice si vence hoy, cuántos días lleva atrasada o cuándo vence', () => {
  assert.deepEqual(
    [HOY, '2026-10-05', '2026-10-03', '2026-10-07', '2026-10-20'].map((vence) => textoPlazo({ vence }, HOY)),
    ['Vence hoy', 'Atrasada 1 día', 'Atrasada 3 días', 'Vence mañana', 'Vence el 2026-10-20'],
  );
});

test('AC-5.1, AC-5.2, AC-5.6, FR-10: al cambiar el día cambian las burbujas y el estado', () => {
  const ver = (estado, dia) => [burbujas(estado, dia).length, limpiezaDeEspacio(estado, cocina(estado).id, dia)];
  const { e: base } = conVencimientos(['2026-10-07']);
  assert.deepEqual(ver(base, HOY), [0, 'limpio']);
  assert.deepEqual(ver(base, '2026-10-07'), [1, 'limpio']);
  assert.deepEqual(ver(base, '2026-10-09'), [1, 'desordenado']);
  assert.deepEqual(ver(base, '2026-10-10'), [1, 'desastre']);
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias: 3 }), ctx);
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  assert.deepEqual(ver(e, '2026-10-08'), [0, 'limpio']);
  assert.deepEqual(ver(e, '2026-10-09'), [1, 'limpio']);
  assert.equal(atraso(buscarActividad(e, id), '2026-10-09'), 0);
});

test('el estado derivado es puro: no modifica el estado y repite el resultado con los mismos argumentos', () => {
  const { e } = conVencimientos(['2026-10-01', HOY, '2026-10-09'], { espacioId: null });
  const copia = structuredClone(e);
  const calcular = () => [burbujas(e, HOY), porHacer(e, HOY), listaDelPanel(e), limpiezaDeEspacio(e, cocina(e).id, HOY)];
  assert.deepEqual(calcular(), calcular());
  assert.deepEqual(e, copia);
});

// ---------- Regreso pendiente (feature 005): una repetitiva en poder de otra persona vuelve a su responsable al hacerla ----------

// Deja una actividad en poder de `quien` recordando a su responsable original (lo que hará aceptar un intercambio).
const enPoderDe = (estado, id, quien) => ({
  ...estado,
  actividades: estado.actividades.map((a) => (a.id === id ? { ...a, devolverA: a.miembroId, miembroId: quien } : a)),
});

test('FR-9 (005): toda actividad nueva nace sin regreso pendiente', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const e = alta(alta(base, datos(base), ctx), datos(base, { tipo: 'repetitiva', frecuenciaDias: 7 }), ctx);
  assert.deepEqual(e.actividades.map((a) => a.devolverA), [null, null]);
});

test('AC-8.4 (005): "Hecho" en una repetitiva con regreso pendiente la devuelve a su responsable con su nuevo vencimiento', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const propietario = miembrosActivos(base)[0];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 3, vence: '2026-10-04', miembroId: propietario.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const despues = marcarHecha(e, id, HOY, ctx);
  const a = buscarActividad(despues, id);
  assert.deepEqual([a.miembroId, a.devolverA, a.vence, a.hechaEn], [propietario.id, null, '2026-10-09', null]);
  assert.equal(contarActividades(despues), 1);
});

test('AC-8.5 (005): una puntual en poder de otra persona no recuerda a nadie y "Hecho" solo la deja hecha', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  let e = alta(base, datos(base, { miembroId: miembrosActivos(base)[0].id }), ctx);
  const { id } = ultima(e);
  e = { ...e, actividades: e.actividades.map((a) => ({ ...a, miembroId: diana(e).id })) };
  const a = marcarHecha(e, id, HOY, ctx).actividades.find((x) => x.id === id);
  assert.deepEqual([a.miembroId, a.hechaEn, a.devolverA], [diana(e).id, HOY, null]);
});

test('AC-8.10 (005): si el responsable original ya no está activo, la repetitiva se queda con quien la tiene', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const propietario = miembrosActivos(base)[0];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 7, miembroId: propietario.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const sinOriginal = { ...e, miembros: e.miembros.map((m) => (m.id === propietario.id ? { ...m, eliminadoEn: '2026-10-06T00:00:00.000Z' } : m)) };
  const a = buscarActividad(marcarHecha(sinOriginal, id, HOY, ctx), id);
  assert.deepEqual([a.miembroId, a.devolverA, a.vence], [diana(e).id, null, '2026-10-13']);
});

test('AC-8.11, AC-8.12 (005): reasignar o volver puntual borra el regreso; guardar sin cambiar a la persona lo conserva', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const propietario = miembrosActivos(base)[0];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 7, miembroId: propietario.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const a = buscarActividad(e, id);
  const datosDe = (extra) => buscarActividad(editarActividad(e, id, { ...a, ...extra }, ctx).estado, id);
  assert.deepEqual([datosDe({ nombre: 'Otro nombre' }).miembroId, datosDe({ nombre: 'Otro nombre' }).devolverA], [diana(e).id, propietario.id]);
  assert.equal(editarActividad(e, id, { ...a, miembroId: mascotas(e)[0].id }, ctx).error, 'mascota'); // una mascota no puede recibirla
  assert.deepEqual([datosDe({ miembroId: propietario.id }).miembroId, datosDe({ miembroId: propietario.id }).devolverA], [propietario.id, null]);
  const puntual = datosDe({ tipo: 'puntual' });
  assert.deepEqual([puntual.tipo, puntual.devolverA, puntual.miembroId], ['puntual', null, diana(e).id]);
});

test('AC-8.13 (005): eliminar al responsable original borra el regreso; eliminar a quien la tiene la elimina y se cuenta en sus pendientes', () => {
  const ctx = crearCtx();
  let base = agregarHabitante(hogarBase(ctx), 'familiar', { nombre: 'Luis', aspecto: 'adulto' }, ctx).estado;
  const luis = familiares(base)[1];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 7, miembroId: luis.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const sinLuis = eliminarHabitante(e, luis.id, ctx);
  const a = buscarActividad(sinLuis, id);
  assert.deepEqual([a.miembroId, a.devolverA], [diana(e).id, null]);
  assert.equal(pendientesDeMiembro(e, diana(e).id), 1);
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.equal(buscarActividad(sinDiana, id), null);
  assert.notEqual(sinDiana.actividades.find((x) => x.id === id).eliminadoEn, null);
});

test('AC-11.2, AC-11.3, FR-10: una mascota no puede ser responsable al crear ni al editar; una persona sí', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  const firulais = mascotas(e)[0];
  const r = agregarActividad(e, datos(e, { miembroId: firulais.id }), ctx);
  assert.deepEqual([r.ok, r.error], [false, 'mascota']);
  assert.equal(r.estado, e);
  assert.equal(MENSAJES_ACTIVIDAD.mascota, 'Las mascotas no pueden encargarse de actividades.');
  const con = alta(e, datos(e), ctx);
  const edicion = editarActividad(con, ultima(con).id, datos(con, { miembroId: firulais.id }), ctx);
  assert.deepEqual([edicion.ok, edicion.error], [false, 'mascota']);
  assert.equal(edicion.estado, con);
  const propietario = miembrosActivos(e)[0];
  assert.equal(agregarActividad(e, datos(e, { miembroId: propietario.id }), ctx).ok, true);
});

test('AC-11.4: sin actividades de mascotas, ninguna burbuja ni lista corresponde a una mascota', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { espacioId: null }), ctx);
  const firulais = mascotas(e)[0];
  assert.equal(pendientesDeMiembro(e, firulais.id), 0);
  assert.ok(burbujas(e, HOY).every((b) => !(b.tipo === 'miembro' && b.id === firulais.id)));
  assert.ok(listaDelPanel(e).every((a) => a.miembroId !== firulais.id));
});

test('AC-11.6: "Dar de comer a la mascota" y "Pasear al perro" se asignan a una persona como cualquier otra', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  for (const nombre of ['Dar de comer a la mascota', 'Pasear al perro']) {
    const con = alta(e, datos(e, { nombre, icono: 'mascota', espacioId: null }), ctx);
    assert.equal(ultima(con).miembroId, diana(e).id);
  }
});

// ---------- Feature 007: una actividad en varios lugares ----------

test('AC-10.3, AC-10.4, AC-10.5, AC-10.11: n lugares crean n actividades independientes con los mismos datos, en el orden de los espacios', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const sala = espaciosDeTipo(e, 'sala')[0];
  // se piden en otro orden: se crean en el orden en que los espacios se crearon (sala, dormitorio 1, dormitorio 2)
  const r = agregarActividades(e, datos(e, { nombre: 'Barrer', icono: 'barrer' }), [d2.id, sala.id, d1.id], ctx);
  assert.equal(r.ok, true, r.error);
  const nuevas = r.estado.actividades.slice(e.actividades.length);
  assert.deepEqual(nuevas.map((a) => a.espacioId), [sala.id, d1.id, d2.id]);
  assert.ok(nuevas.every((a) => a.nombre === 'Barrer' && a.icono === 'barrer' && a.miembroId === diana(e).id && a.vence === HOY
    && a.tipo === 'puntual' && a.hechaEn === null));
  assert.equal(new Set(nuevas.map((a) => a.id)).size, 3);
  assert.equal(contarActividades(r.estado), 3);
  const { actividades: _despues, ...restoDespues } = r.estado;
  const { actividades: _antes, ...restoAntes } = e;
  assert.deepEqual(restoDespues, restoAntes); // no cambia ningún espacio, miembro, bloque, intercambio ni entrada
});

test('AC-10.2: sin ningún lugar se crea una sola actividad sin espacio', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  const r = agregarActividades(e, datos(e), [], ctx); // `datos` trae la cocina, que se ignora
  assert.equal(r.ok, true, r.error);
  const nuevas = r.estado.actividades.slice(e.actividades.length);
  assert.deepEqual(nuevas.map((a) => a.espacioId), [null]);
});

test('AC-10.6: el tope de 50 pendientes se respeta con todo o nada (48, 49, 50 y 51)', () => {
  const ctx = crearCtx();
  const base = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  const lugares = espaciosActivos(base).map((x) => x.id);
  const llenar = (n) => {
    let e = base;
    for (let i = 0; i < n; i += 1) e = alta(e, datos(e, { nombre: `A${i}` }), ctx);
    return e;
  };
  let r = agregarActividades(llenar(48), datos(base), lugares.slice(0, 2), ctx); // 48 + 2 = 50
  assert.equal(r.ok, true);
  assert.equal(contarActividades(r.estado), LIMITE_ACTIVIDADES);
  const e49 = llenar(49);
  r = agregarActividades(e49, datos(base), lugares.slice(0, 2), ctx); // 49 + 2 = 51
  assert.deepEqual([r.ok, r.error], [false, 'limite-varios']);
  assert.equal(r.estado, e49);
  assert.equal(agregarActividades(e49, datos(base), lugares.slice(0, 1), ctx).ok, true); // 49 + 1 = 50
  const e50 = llenar(50);
  r = agregarActividades(e50, datos(base), lugares.slice(0, 1), ctx); // 50 + 1 = 51
  assert.deepEqual([r.ok, r.error], [false, 'limite']);
  assert.equal(r.estado, e50);
  assert.equal(MENSAJES_ACTIVIDAD['limite-varios'], 'Con estos lugares se superarían las 50 actividades pendientes.');
});

test('AC-10.7, AC-11.2: un dato inválido, un lugar que no existe o una mascota no crean ninguna actividad', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  const lugares = [cocina(e).id];
  const casos = [
    [{ nombre: '' }, lugares, 'vacio'],
    [{ nombre: 'x'.repeat(31) }, lugares, 'largo'],
    [{ icono: 'escoba' }, lugares, 'icono'],
    [{ vence: '2026-02-30' }, lugares, 'fecha'],
    [{ tipo: 'repetitiva', frecuenciaDias: 5 }, lugares, 'frecuencia'],
    [{ miembroId: 'no-existe' }, lugares, 'miembro'],
    [{ miembroId: mascotas(e)[0].id }, lugares, 'mascota'],
    [{}, ['no-existe'], 'espacio'],
    [{}, ['pasillo:izq'], 'espacio'],
    [{}, [cocina(e).id, 'no-existe'], 'espacio'],
  ];
  for (const [extra, espacioIds, error] of casos) {
    const r = agregarActividades(e, datos(e, extra), espacioIds, ctx);
    assert.deepEqual([r.ok, r.error], [false, error], JSON.stringify(extra));
    assert.equal(r.estado, e);
  }
});

test('AC-10.9, AC-10.10: las actividades creadas juntas son independientes al editar, eliminar y marcar "Hecho"', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const r = agregarActividades(e, datos(e, { nombre: 'Barrer', tipo: 'repetitiva', frecuenciaDias: 7 }), [d1.id, d2.id], ctx);
  const [a1, a2] = r.estado.actividades.slice(e.actividades.length);
  const editada = editarActividad(r.estado, a1.id, datos(r.estado, { nombre: 'Barrer fuerte', espacioId: d1.id, tipo: 'repetitiva', frecuenciaDias: 7 }), ctx).estado;
  assert.equal(buscarActividad(editada, a1.id).nombre, 'Barrer fuerte');
  assert.deepEqual(buscarActividad(editada, a2.id), buscarActividad(r.estado, a2.id));
  const eliminada = eliminarActividad(r.estado, a1.id, ctx);
  assert.equal(buscarActividad(eliminada, a1.id), null);
  assert.notEqual(buscarActividad(eliminada, a2.id), null);
  const hecha = marcarHecha(r.estado, a1.id, HOY, ctx);
  assert.equal(buscarActividad(hecha, a1.id).vence, '2026-10-13');
  assert.equal(buscarActividad(hecha, a2.id).vence, HOY);
});
