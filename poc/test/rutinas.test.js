// test/rutinas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, quitarUltimo, ultimoDeTipo, renombrarEspacio,
  renombrarMiembro, eliminarHabitante, espaciosDeTipo, espaciosActivos, miembrosActivos, familiares, mascotas, banoDe,
  consecuenciasDeEliminar, requiereConfirmacion, bloquesActivos, bloquesDeMiembro, buscarEspacio, puedeEliminar,
} from '../src/hogar.js';
import {
  agregarBloque, editarBloque, eliminarBloque, buscarBloque, bloquesDe, contarBloques, puedeAgregarBloque, textoBloque, textoBajas,
} from '../src/rutinas.js';
import { crearCtx } from './ayuda.js';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', aspecto: 'adulta' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Leo', aspecto: 'adulto' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const diana = (estado) => familiares(estado)[0];
const leo = (estado) => familiares(estado)[1];

// Datos válidos de la ficha: Diana, Lun–Vie de 09:00 a 18:00, fuera de casa; `extra` cambia lo que haga falta.
const datos = (estado, extra = {}) => ({ miembroId: diana(estado).id, dias: 'laborables', inicio: 540, fin: 1080, espacioId: null, ...extra });

function alta(estado, d, ctx) {
  const r = agregarBloque(estado, d, ctx);
  assert.equal(r.ok, true, `alta de ${d.inicio}–${d.fin}: ${r.error}`);
  return r.estado;
}

const ultimo = (estado) => estado.bloques.at(-1);

test('AC-1.6, AC-12.2, AC-12.3: crear un bloque guarda sus datos, su auditoría y sus referencias por id, y no cambia nada más', () => {
  const ctx = crearCtx();
  const e0 = hogarBase(ctx);
  const cocina = espaciosDeTipo(e0, 'cocina')[0];
  const e1 = alta(e0, datos(e0), ctx);
  const e2 = alta(e1, datos(e1, { inicio: 1080, fin: 1140, espacioId: cocina.id }), ctx);
  const [fuera, enCocina] = e2.bloques;
  assert.deepEqual(
    [fuera.hogarId, fuera.miembroId, fuera.dias, fuera.inicio, fuera.fin, fuera.espacioId],
    [e0.hogares[0].id, diana(e0).id, 'laborables', 540, 1080, null],
  );
  assert.equal(enCocina.espacioId, cocina.id);
  assert.notEqual(fuera.id, enCocina.id);
  for (const b of e2.bloques) {
    assert.ok(b.id && b.creadoEn && b.actualizadoEn);
    assert.deepEqual([b.creadoPor, b.actualizadoPor, b.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
    assert.equal('cuentaId' in b, false);
  }
  assert.deepEqual([e2.espacios, e2.miembros, e2.actividades], [e0.espacios, e0.miembros, e0.actividades]);
});

test('AC-1.4, AC-1.7, FR-1: inicio y fin en pasos de 30 minutos dentro del día, con el fin posterior al inicio', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  for (const [inicio, fin, error] of [
    [545, 600, 'hora'], [-30, 60, 'hora'], [1440, 1470, 'hora'], [0, 1470, 'hora'], [0, 0, 'hora'], ['540', 600, 'hora'],
    [undefined, 600, 'hora'], [600, 600, 'fin'], [660, 600, 'fin'],
  ]) {
    const r = agregarBloque(e, datos(e, { inicio, fin }), ctx);
    assert.deepEqual([r.ok, r.error, r.estado], [false, error, e], `${inicio}–${fin}`);
  }
  for (const [inicio, fin] of [[0, 30], [1410, 1440], [0, 1440]]) {
    assert.equal(agregarBloque(e, datos(e, { inicio, fin }), ctx).ok, true, `${inicio}–${fin}`);
  }
});

test('FR-1, AC-1.11: el lugar es un espacio activo o fuera de casa, el horario uno de los dos y el bloque es de un familiar', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'lavanderia', ctx);
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  e = eliminarEspacio(e, lavanderia.id, ctx);
  const propietario = miembrosActivos(e)[0];
  const casos = [
    [{ espacioId: 'no-existe' }, 'lugar'], [{ espacioId: 'pasillo:der' }, 'lugar'], [{ espacioId: lavanderia.id }, 'lugar'],
    [{ dias: 'lunes' }, 'dias'], [{ dias: 'toString' }, 'dias'], [{ dias: undefined }, 'dias'],
    [{ miembroId: propietario.id }, 'familiar'], [{ miembroId: mascotas(e)[0].id }, 'familiar'], [{ miembroId: 'no-existe' }, 'familiar'],
  ];
  for (const [extra, error] of casos) {
    const r = agregarBloque(e, datos(e, extra), ctx);
    assert.deepEqual([r.ok, r.error], [false, error], JSON.stringify(extra));
  }
  for (const x of espaciosActivos(e)) assert.equal(agregarBloque(e, datos(e, { espacioId: x.id }), ctx).ok, true, x.tipo);
  assert.equal(agregarBloque(e, datos(e, { dias: 'finde' }), ctx).ok, true);
});

test('AC-1.8, AC-1.11: los bloques de un horario no se superponen, pero pueden tocarse; otro horario u otro familiar son independientes', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { inicio: 540, fin: 780 }), ctx); // 09:00–13:00
  for (const [inicio, fin] of [[720, 840], [480, 600], [540, 780], [600, 660], [0, 1440]]) {
    const r = agregarBloque(e, datos(e, { inicio, fin }), ctx);
    assert.deepEqual([r.ok, r.error], [false, 'superpuesto'], `${inicio}–${fin}`);
  }
  for (const extra of [{ inicio: 780, fin: 840 }, { inicio: 480, fin: 540 }, { inicio: 720, fin: 840, dias: 'finde' },
    { inicio: 720, fin: 840, miembroId: leo(e).id }]) {
    assert.equal(agregarBloque(e, datos(e, extra), ctx).ok, true, JSON.stringify(extra));
  }
  assert.deepEqual(bloquesDe(e, leo(e).id, 'laborables'), []);
});

test('AC-1.9: hasta 8 bloques por horario y por familiar; los eliminados no cuentan', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  for (let i = 0; i < 8; i++) e = alta(e, datos(e, { inicio: i * 60, fin: i * 60 + 30 }), ctx);
  assert.deepEqual([contarBloques(e, diana(e).id, 'laborables'), puedeAgregarBloque(e, diana(e).id, 'laborables')], [8, false]);
  const r = agregarBloque(e, datos(e, { inicio: 1200, fin: 1230 }), ctx);
  assert.deepEqual([r.ok, r.error, r.estado], [false, 'limite', e]);
  assert.equal(puedeAgregarBloque(e, diana(e).id, 'finde'), true);
  assert.equal(puedeAgregarBloque(e, leo(e).id, 'laborables'), true);
  e = eliminarBloque(e, e.bloques[0].id, ctx);
  assert.deepEqual([contarBloques(e, diana(e).id, 'laborables'), puedeAgregarBloque(e, diana(e).id, 'laborables')], [7, true]);
  assert.equal(agregarBloque(e, datos(e, { inicio: 1200, fin: 1230 }), ctx).ok, true);
});

test('AC-2.2, AC-2.3, AC-2.4, AC-12.1, FR-8: editar cambia inicio, fin y lugar, rechaza superposiciones y conserva el identificador', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  e = alta(e, datos(e, { inicio: 540, fin: 780 }), ctx);
  const primero = ultimo(e).id;
  e = alta(e, datos(e, { inicio: 840, fin: 1080 }), ctx);
  const segundo = ultimo(e).id;
  for (const [inicio, fin, error] of [[720, 1080, 'superpuesto'], [840, 840, 'fin'], [900, 870, 'fin'], [845, 1080, 'hora']]) {
    const r = editarBloque(e, segundo, { inicio, fin, espacioId: null }, ctx);
    assert.deepEqual([r.ok, r.error, r.estado], [false, error, e], `${inicio}–${fin}`);
  }
  e = editarBloque(e, segundo, { inicio: 780, fin: 1080, espacioId: cocina.id }, ctx).estado; // toca al primero
  e = editarBloque(e, primero, { inicio: 480, fin: 780, espacioId: null }, ctx).estado; // no se superpone consigo mismo
  const b = buscarBloque(e, segundo);
  assert.deepEqual([b.id, b.inicio, b.fin, b.espacioId, b.miembroId, b.dias], [segundo, 780, 1080, cocina.id, diana(e).id, 'laborables']);
  assert.notEqual(b.actualizadoEn, b.creadoEn);
  assert.deepEqual(bloquesDe(e, diana(e).id, 'laborables').map((x) => x.id), [primero, segundo]);
  const r = editarBloque(e, segundo, { inicio: 780, fin: 1080, espacioId: null, miembroId: leo(e).id, dias: 'finde' }, ctx);
  assert.deepEqual([buscarBloque(r.estado, segundo).miembroId, buscarBloque(r.estado, segundo).dias], [diana(e).id, 'laborables']);
  assert.deepEqual(editarBloque(e, 'no-existe', { inicio: 0, fin: 30, espacioId: null }, ctx), { ok: false, error: 'no-encontrado', estado: e });
});

test('AC-2.5, AC-10.10, AC-12.5: eliminar un bloque es un borrado lógico y no toca nada más', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  e = alta(e, datos(e, { dias: 'finde' }), ctx);
  const [uno, dos] = e.bloques;
  const despues = eliminarBloque(e, uno.id, ctx);
  const borrado = despues.bloques.find((b) => b.id === uno.id);
  assert.notEqual(borrado.eliminadoEn, null);
  assert.deepEqual(bloquesActivos(despues), [dos]);
  assert.equal(buscarBloque(despues, uno.id), null);
  assert.deepEqual([despues.espacios, despues.miembros, despues.actividades], [e.espacios, e.miembros, e.actividades]);
  assert.equal(eliminarBloque(despues, uno.id, ctx), despues);
  assert.equal(eliminarBloque(e, 'no-existe', ctx), e);
});

test('AC-1.3, AC-2.6, AC-12.4: la lista va por inicio, muestra hora y lugar, y los vínculos sobreviven a renombres y mudanzas', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'dormitorio', ctx), 'bano', ctx);
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = alta(e, datos(e, { inicio: 1380, fin: 1440, espacioId: d3.id }), ctx);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: bano.id }), ctx);
  e = alta(e, datos(e, { inicio: 540, fin: 1080 }), ctx);
  assert.deepEqual(bloquesDe(e, diana(e).id, 'laborables').map((b) => textoBloque(e, b)),
    ['00:00–07:00 · Baño 2', '09:00–18:00 · Fuera de casa', '23:00–24:00 · Dormitorio 3']);
  e = eliminarEspacio(e, d2.id, ctx); // "Dormitorio 3" pasa a llamarse "Dormitorio 2"
  e = eliminarEspacio(e, d1.id, ctx); // el baño interno se muda al otro dormitorio
  e = renombrarEspacio(e, d3.id, 'Cuarto de Diana', ctx).estado;
  e = renombrarMiembro(e, diana(e).id, 'Dana', ctx).estado;
  const lista = bloquesDe(e, diana(e).id, 'laborables');
  assert.deepEqual(lista.map((b) => b.espacioId), [bano.id, null, d3.id]);
  assert.equal(textoBloque(e, lista[2]), '23:00–24:00 · Cuarto de Diana');
  assert.equal(buscarEspacio(e, bano.id).contenidoEn, d3.id);
});

test('AC-10.1, AC-10.2, AC-10.3, FR-9: eliminar un espacio elimina sus bloques y ningún otro; la confirmación los cuenta', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'lavanderia', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id, dias: 'finde' }), ctx);
  e = alta(e, datos(e, { inicio: 540, fin: 1080 }), ctx); // fuera de casa
  e = alta(e, datos(e, { inicio: 1080, fin: 1140, espacioId: cocina.id }), ctx);
  const c = consecuenciasDeEliminar(e, d2.id);
  assert.deepEqual([c.bloques, c.actividades], [2, 0]);
  assert.equal(requiereConfirmacion(e, d2.id), true); // sin nombre personalizado ni actividades, pero con bloques
  assert.equal(requiereConfirmacion(e, lavanderia.id), false);
  const despues = eliminarEspacio(e, d2.id, ctx);
  assert.ok(despues.bloques.filter((b) => b.espacioId === d2.id).every((b) => b.eliminadoEn !== null));
  assert.deepEqual(bloquesActivos(despues).map((b) => b.espacioId), [null, cocina.id]);
  assert.deepEqual(familiares(despues).map((m) => m.id), familiares(e).map((m) => m.id));
});

test('AC-10.4: si el baño interno se elimina con su cuarto, también se eliminan sus bloques y la confirmación los suma', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  e = agregarEspacio(agregarEspacio(e, 'bano', ctx), 'bano', ctx); // los dos dormitorios tienen baño: no hay adónde moverlo
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const banoD1 = banoDe(e, d1.id);
  const banoD2 = banoDe(e, d2.id);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: banoD2.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: banoD2.id, dias: 'finde' }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: banoD1.id, miembroId: leo(e).id }), ctx);
  const c = consecuenciasDeEliminar(e, d2.id);
  assert.deepEqual([c.banoSeElimina, c.bloques], [true, 3]);
  const despues = eliminarEspacio(e, d2.id, ctx);
  assert.equal(buscarEspacio(despues, banoD2.id), null);
  assert.deepEqual(bloquesActivos(despues).map((b) => b.espacioId), [banoD1.id]);
});

test('AC-10.5: si el baño interno se mueve a otro cuarto, conserva sus bloques y solo se eliminan los del cuarto', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx); // el baño va a Dormitorio 1
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d1.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: bano.id }), ctx);
  const c = consecuenciasDeEliminar(e, d1.id);
  assert.deepEqual([c.banoSeMueve, c.bloques], [true, 1]);
  const despues = eliminarEspacio(e, d1.id, ctx);
  assert.equal(buscarEspacio(despues, bano.id).contenidoEn, d2.id);
  assert.deepEqual(bloquesActivos(despues).map((b) => b.espacioId), [bano.id]);
});

test('AC-10.6: quitar con "−" pide la misma confirmación y aplica la misma cascada', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const bano = ultimoDeTipo(e, 'bano');
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: bano.id }), ctx);
  assert.equal(ultimoDeTipo(e, 'dormitorio').id, d2.id);
  assert.deepEqual([requiereConfirmacion(e, d2.id), consecuenciasDeEliminar(e, d2.id).bloques], [true, 1]);
  assert.deepEqual([requiereConfirmacion(e, bano.id), consecuenciasDeEliminar(e, bano.id).bloques], [true, 1]);
  assert.deepEqual(bloquesActivos(quitarUltimo(e, 'dormitorio', ctx)).map((b) => b.espacioId), [bano.id]);
  assert.deepEqual(bloquesActivos(quitarUltimo(e, 'bano', ctx)).map((b) => b.espacioId), [d2.id]);
});

test('AC-10.7, AC-10.8, AC-10.9, FR-9: eliminar un familiar elimina sus bloques y la confirmación los cuenta', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  e = alta(e, datos(e, { dias: 'finde' }), ctx);
  e = alta(e, datos(e, { inicio: 0, fin: 420 }), ctx);
  e = alta(e, datos(e, { miembroId: leo(e).id }), ctx);
  assert.deepEqual([bloquesDeMiembro(e, diana(e).id), bloquesDeMiembro(e, leo(e).id), bloquesDeMiembro(e, mascotas(e)[0].id)], [3, 1, 0]);
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.ok(sinDiana.bloques.filter((b) => b.miembroId === diana(e).id).every((b) => b.eliminadoEn !== null));
  assert.deepEqual(bloquesActivos(sinDiana).map((b) => b.miembroId), [leo(e).id]);
  assert.equal(textoBajas(0, 3), 'Se eliminarán 3 bloques de rutina.');
  assert.equal(textoBajas(3, 2), 'Se eliminarán 3 actividades y 2 bloques de rutina.');
  assert.equal(textoBajas(1, 3), 'Se eliminarán 1 actividad y 3 bloques de rutina.');
  assert.equal(textoBajas(1, 0), 'Se eliminará 1 actividad.');
  assert.equal(textoBajas(0, 1), 'Se eliminará 1 bloque de rutina.');
  assert.equal(textoBajas(2, 0), 'Se eliminarán 2 actividades.');
  assert.equal(textoBajas(0, 0), '');
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
  const fams = new Set(familiares(estado).map((m) => m.id));
  const espacios = new Set(espaciosActivos(estado).map((x) => x.id));
  return bloquesActivos(estado).every((b) => fams.has(b.miembroId) && (b.espacioId === null || espacios.has(b.espacioId)));
}

test('AC-10.12, Reliability, FR-9: ninguna baja de un espacio o de un familiar deja un bloque activo con referencias rotas', () => {
  for (const banos of [0, 3, 6]) {
    const ctx = crearCtx();
    let e = hogarCompleto(ctx, banos);
    // un bloque por espacio, repartidos entre los dos familiares y los dos horarios, sin superponerse
    espaciosActivos(e).forEach((x, i) => {
      const inicio = Math.floor(i / 4) * 60;
      e = alta(e, datos(e, { miembroId: familiares(e)[i % 2].id, dias: i % 4 < 2 ? 'laborables' : 'finde', inicio, fin: inicio + 30, espacioId: x.id }), ctx);
    });
    for (const x of espaciosActivos(e).filter((x) => puedeEliminar(e, x.id))) {
      const despues = eliminarEspacio(e, x.id, ctx);
      assert.ok(referenciasValidas(despues), `${banos} baños, sin ${x.tipo}`);
      assert.ok(bloquesActivos(despues).length < bloquesActivos(e).length);
    }
    for (const m of familiares(e)) assert.ok(referenciasValidas(eliminarHabitante(e, m.id, ctx)), m.nombre);
  }
});
