// test/calificaciones.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, eliminarHabitante, renombrarEspacio, renombrarMiembro,
  espaciosDeTipo, miembrosActivos, familiares, mascotas, nombreVisible,
} from '../src/hogar.js';
import { agregarActividad, marcarHecha } from '../src/actividades.js';
import {
  buscarEntrada, entradasDelHistorial, entradasDe, miembrosDelFiltro, textoAcreditada, textoEspacio, textoDia, textoLinea, promedioDe,
  textoResumen, textoVacio, estadoDeCalificacion, textoCalificacion, calificar, quitarCalificacion, MENSAJES_HISTORIAL,
} from '../src/historial.js';
import { LIMITE_HISTORIAL } from '../src/catalogo.js';
import { crearCtx } from './ayuda.js';

const HOY = '2026-10-06';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', parentesco: 'hermano', genero: 'masculino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const propietarioDe = (e) => miembrosActivos(e)[0];
const diana = (e) => familiares(e)[0];
const luis = (e) => familiares(e)[1];
const firulais = (e) => mascotas(e)[0];
const cocina = (e) => espaciosDeTipo(e, 'cocina')[0];

// Crea una puntual de Diana (o de `extra.miembroId`) y la marca "Hecho": el historial gana una entrada.
function hacer(estado, nombre, ctx, extra = {}) {
  const r = agregarActividad(estado, {
    nombre, icono: 'otra', miembroId: diana(estado).id, espacioId: null, tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
  }, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return marcarHecha(r.estado, r.estado.actividades.at(-1).id, HOY, ctx);
}

// Escenario: cuatro "Hecho" seguidos: Tarea 1 (Diana, en la cocina), Tarea 2 (Luis), Tarea 3 (Firulais) y Tarea 4 (el propietario).
function escenario() {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  [diana(e), luis(e), firulais(e), propietarioDe(e)].forEach((m, i) => {
    e = hacer(e, `Tarea ${i + 1}`, ctx, { miembroId: m.id, espacioId: i === 0 ? cocina(e).id : null });
  });
  return { ctx, e };
}

const entrada = (e, nombre) => e.historial.find((x) => x.nombre === nombre);
const califica = (e, nombre, quien, estrellas, ctx) => {
  const r = calificar(e, entrada(e, nombre).id, quien.id, estrellas, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return r.estado;
};

test('AC-2.3, AC-3.2: el historial se lista de la más reciente a la más antigua y el filtro deja las entradas de un miembro', () => {
  const { ctx, e } = escenario();
  assert.deepEqual(entradasDelHistorial(e).map((x) => x.nombre), ['Tarea 4', 'Tarea 3', 'Tarea 2', 'Tarea 1']);
  const con = hacer(e, 'Tarea 5', ctx, { miembroId: diana(e).id });
  assert.deepEqual(entradasDe(con, diana(e).id).map((x) => x.nombre), ['Tarea 5', 'Tarea 1']);
  assert.deepEqual(entradasDe(con, luis(e).id).map((x) => x.nombre), ['Tarea 2']);
});

test('AC-3.1, AC-3.9: el filtro ofrece el propietario, los familiares y las mascotas activos, en ese orden', () => {
  const { ctx, e } = escenario();
  assert.deepEqual(miembrosDelFiltro(e).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Luis', 'Firulais']);
  assert.deepEqual(miembrosDelFiltro(eliminarHabitante(e, luis(e).id, ctx)).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Firulais']);
});

test('AC-2.5: el día se muestra como Hoy, Ayer, Hace N días o, si es posterior a hoy, su fecha', () => {
  assert.equal(textoDia('2026-10-06', HOY), 'Hoy');
  assert.equal(textoDia('2026-10-05', HOY), 'Ayer');
  assert.equal(textoDia('2026-10-03', HOY), 'Hace 3 días');
  assert.equal(textoDia('2026-07-08', HOY), 'Hace 90 días');
  assert.equal(textoDia('2026-10-09', HOY), '2026-10-09');
});

test('AC-2.4, AC-7.3, AC-7.5, AC-9.4: la línea de una fila muestra la persona, el espacio si lo tenía y el día, con los nombres actuales', () => {
  const { ctx, e } = escenario();
  const tarea1 = entrada(e, 'Tarea 1');
  assert.equal(textoLinea(e, tarea1, HOY), `Diana · ${nombreVisible(e, cocina(e))} · Hoy`);
  assert.equal(textoLinea(e, entrada(e, 'Tarea 2'), HOY), 'Luis · Hoy'); // sin espacio
  const conEspacio = renombrarEspacio(e, cocina(e).id, 'Cocinita', ctx).estado;
  const renombrado = renombrarMiembro(conEspacio, diana(e).id, 'Dianita', ctx).estado;
  assert.equal(textoLinea(renombrado, tarea1, HOY), 'Dianita · Cocinita · Hoy');
  assert.equal(renombrado.historial[0].nombre, 'Tarea 1'); // el nombre de la actividad es el de entonces
});

test('AC-7.4, AC-7.6: una entrada de un espacio o de una persona eliminados sigue mostrándose', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'lavanderia', ctx);
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  e = hacer(e, 'Ropa sucia', ctx, { espacioId: lavanderia.id });
  e = hacer(e, 'Platos', ctx);
  const sinLavanderia = eliminarEspacio(e, lavanderia.id, ctx);
  assert.equal(textoEspacio(sinLavanderia, entrada(sinLavanderia, 'Ropa sucia')), 'Espacio eliminado');
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.equal(textoAcreditada(sinDiana, entrada(sinDiana, 'Platos')), 'Diana (ya no está)');
  assert.deepEqual(miembrosDelFiltro(sinDiana).map((m) => m.nombre), ['Personaje 1', 'Luis', 'Firulais']);
  assert.equal(entradasDelHistorial(sinDiana).length, 2); // sigue visible con "Todos"
});

test('AC-3.3, AC-3.4: el promedio cuenta solo las entradas calificadas, con un decimal y coma decimal', () => {
  const { ctx, e: base } = escenario();
  let e = base;
  for (const n of [2, 3, 4]) e = hacer(e, `Diana ${n}`, ctx, { miembroId: diana(e).id });
  assert.deepEqual(promedioDe(e, diana(e).id), { calificadas: 0, texto: null });
  assert.equal(textoResumen(e, diana(e).id), 'Diana: sin calificaciones');
  const quien = luis(e);
  e = califica(e, 'Tarea 1', quien, 5, ctx);
  e = califica(e, 'Diana 2', quien, 4, ctx);
  e = califica(e, 'Diana 3', quien, 4, ctx);
  e = califica(e, 'Diana 4', quien, 4, ctx);
  assert.deepEqual(promedioDe(e, diana(e).id), { calificadas: 4, texto: '4,3' }); // 17 / 4 = 4,25, las mitades hacia arriba
  assert.equal(textoResumen(e, diana(e).id), 'Diana: 4,3 ★ (4 calificadas)');
});

test('AC-3.3: el redondeo del promedio usa aritmética entera, con las mitades hacia arriba', () => {
  const { e } = escenario();
  const casos = [[[5, 5], '5,0'], [[1, 2], '1,5'], [[1, 1, 2], '1,3'], [[1, 1, 1, 2], '1,3'], [[1, 1, 1, 1, 2], '1,2'], [[3], '3,0']];
  for (const [estrellas, texto] of casos) {
    const historial = estrellas.map((n, i) => ({ ...e.historial[0], id: `h-${i}`, estrellas: n, calificadoPor: luis(e).id }));
    assert.equal(promedioDe({ ...e, historial }, diana(e).id).texto, texto, estrellas.join());
  }
});

test('AC-2.6, AC-3.5: textos del historial vacío y de un miembro sin entradas; con "Todos" no hay resumen', () => {
  const e = hogarBase(crearCtx());
  assert.equal(textoVacio(e, null), 'Aún no hay actividades hechas');
  assert.equal(textoVacio(e, diana(e).id), 'Diana no tiene actividades hechas en el historial');
  assert.equal(textoResumen(e, diana(e).id), 'Diana: sin calificaciones');
  assert.equal(textoResumen(e, null), '');
});

test('AC-3.7, AC-3.8: el promedio se actualiza al cambiar o quitar una calificación y no cuenta lo que el tope descartó', () => {
  const { ctx, e } = escenario();
  const quien = luis(e);
  let s = califica(e, 'Tarea 1', quien, 5, ctx);
  assert.equal(textoResumen(s, diana(e).id), 'Diana: 5,0 ★ (1 calificadas)');
  s = califica(s, 'Tarea 1', quien, 2, ctx);
  assert.equal(textoResumen(s, diana(e).id), 'Diana: 2,0 ★ (1 calificadas)');
  s = quitarCalificacion(s, entrada(s, 'Tarea 1').id, quien.id, ctx).estado;
  assert.equal(textoResumen(s, diana(e).id), 'Diana: sin calificaciones');
  let t = califica(e, 'Tarea 1', quien, 5, ctx);
  for (let i = 0; i < LIMITE_HISTORIAL; i += 1) t = hacer(t, `Relleno ${i}`, ctx, { miembroId: quien.id });
  assert.equal(buscarEntrada(t, entrada(e, 'Tarea 1').id), null); // el tope la descartó, con su calificación
  assert.equal(textoResumen(t, diana(e).id), 'Diana: sin calificaciones');
});

test('AC-4.2, AC-4.8, AC-9.1, AC-9.2: calificar cambia solo las estrellas, quién las dio y la auditoría de esa entrada', () => {
  const { ctx, e } = escenario();
  const antes = entrada(e, 'Tarea 1');
  const r = calificar(e, antes.id, luis(e).id, 4, ctx);
  assert.equal(r.ok, true);
  const despues = buscarEntrada(r.estado, antes.id);
  assert.deepEqual([despues.estrellas, despues.calificadoPor, despues.id], [4, luis(e).id, antes.id]);
  assert.notEqual(despues.actualizadoEn, antes.actualizadoEn);
  assert.deepEqual({ ...despues, estrellas: null, calificadoPor: null, actualizadoEn: antes.actualizadoEn, actualizadoPor: antes.actualizadoPor }, antes);
  assert.equal(despues.creadoPor, 'cuenta-1');
  assert.deepEqual(r.estado.historial.filter((x) => x.id !== antes.id), e.historial.filter((x) => x.id !== antes.id));
  assert.equal(r.estado.actividades, e.actividades);
  assert.equal(r.estado.intercambios, e.intercambios);
});

test('AC-4.4, AC-4.5: se pueden calificar las entradas de una mascota y de una persona eliminada', () => {
  const { ctx, e } = escenario();
  assert.equal(calificar(e, entrada(e, 'Tarea 3').id, propietarioDe(e).id, 5, ctx).ok, true); // Firulais
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.equal(calificar(sinDiana, entrada(sinDiana, 'Tarea 1').id, luis(e).id, 2, ctx).ok, true);
});

test('AC-4.7: se rechaza con su motivo calificar una entrada inexistente, a sí mismo, sin ser persona, con estrellas inválidas o ya calificada por otra persona', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1').id;
  const rechazado = (r, error) => {
    assert.deepEqual([r.ok, r.error], [false, error]);
    assert.equal(r.estado, e);
  };
  rechazado(calificar(e, 'no-existe', luis(e).id, 3, ctx), 'no-encontrada');
  rechazado(calificar(e, t1, diana(e).id, 3, ctx), 'propia');
  rechazado(calificar(e, t1, firulais(e).id, 3, ctx), 'no-persona');
  rechazado(calificar(e, t1, 'no-existe', 3, ctx), 'no-persona');
  for (const mala of [0, 6, 2.5, '3', NaN, null, undefined]) rechazado(calificar(e, t1, luis(e).id, mala, ctx), 'estrellas');
  const calificada = califica(e, 'Tarea 1', luis(e), 3, ctx);
  const r = calificar(calificada, t1, propietarioDe(e).id, 5, ctx);
  assert.deepEqual([r.ok, r.error], [false, 'bloqueada']);
  assert.equal(r.estado, calificada);
  for (const clave of ['no-encontrada', 'no-persona', 'estrellas', 'bloqueada', 'propia', 'sin-calificacion']) {
    assert.match(MENSAJES_HISTORIAL[clave], /\S/, clave);
  }
});

test('AC-5.2, AC-5.3, AC-5.4: quien calificó puede cambiar sus estrellas, repetir las mismas sin efecto y quitarlas', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1').id;
  let s = califica(e, 'Tarea 1', luis(e), 4, ctx);
  const igual = calificar(s, t1, luis(e).id, 4, ctx);
  assert.deepEqual([igual.ok, igual.estado === s], [true, true]); // ni siquiera cambia la auditoría
  s = califica(s, 'Tarea 1', luis(e), 2, ctx);
  assert.deepEqual([buscarEntrada(s, t1).estrellas, buscarEntrada(s, t1).calificadoPor], [2, luis(e).id]);
  const quitada = quitarCalificacion(s, t1, luis(e).id, ctx);
  assert.equal(quitada.ok, true);
  assert.deepEqual([buscarEntrada(quitada.estado, t1).estrellas, buscarEntrada(quitada.estado, t1).calificadoPor], [null, null]);
  assert.equal(calificar(quitada.estado, t1, propietarioDe(e).id, 5, ctx).ok, true); // queda libre para otra persona
});

test('AC-5.5, AC-5.8: nadie más cambia o quita una calificación ajena, tampoco la persona acreditada; quitar sin calificación se rechaza', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1').id;
  const s = califica(e, 'Tarea 1', luis(e), 4, ctx);
  for (const quien of [diana(e), propietarioDe(e)]) {
    const a = calificar(s, t1, quien.id, 5, ctx);
    const b = quitarCalificacion(s, t1, quien.id, ctx);
    assert.deepEqual([a.ok, a.error, b.ok, b.error], [false, 'bloqueada', false, 'bloqueada']);
    assert.deepEqual([a.estado === s, b.estado === s], [true, true]);
  }
  const sin = quitarCalificacion(e, t1, luis(e).id, ctx);
  assert.deepEqual([sin.ok, sin.error], [false, 'sin-calificacion']);
  assert.equal(quitarCalificacion(e, 'no-existe', luis(e).id, ctx).error, 'no-encontrada');
  assert.equal(quitarCalificacion(s, t1, firulais(e).id, ctx).error, 'no-persona');
});

test('AC-5.7, AC-7.9: la calificación de quien se eliminó se conserva, bloqueada para todos y marcada "(ya no está)"', () => {
  const { ctx, e } = escenario();
  const s = eliminarHabitante(califica(e, 'Tarea 1', luis(e), 4, ctx), luis(e).id, ctx);
  const t1 = buscarEntrada(s, entrada(e, 'Tarea 1').id);
  assert.deepEqual([t1.estrellas, t1.calificadoPor], [4, luis(e).id]);
  for (const quien of [diana(s), propietarioDe(s)]) {
    assert.equal(estadoDeCalificacion(t1, quien.id), 'bloqueada');
    assert.equal(calificar(s, t1.id, quien.id, 5, ctx).error, 'bloqueada');
  }
  assert.equal(textoCalificacion(s, t1, propietarioDe(s).id), 'Calificó Luis (ya no está)');
});

test('AC-4.1, AC-4.3, AC-4.10, AC-5.1, AC-5.5: el estado de una entrada para quien juega es libre, propia, mía o bloqueada, con su texto', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1');
  assert.deepEqual([estadoDeCalificacion(t1, luis(e).id), textoCalificacion(e, t1, luis(e).id)], ['libre', '']);
  assert.deepEqual(
    [estadoDeCalificacion(t1, diana(e).id), textoCalificacion(e, t1, diana(e).id)],
    ['propia', 'No puedes calificar tus propias actividades'],
  );
  const s = califica(e, 'Tarea 1', luis(e), 4, ctx);
  const calificada = buscarEntrada(s, t1.id);
  assert.deepEqual([estadoDeCalificacion(calificada, luis(e).id), textoCalificacion(s, calificada, luis(e).id)], ['mia', 'Tu calificación']);
  for (const quien of [diana(e), propietarioDe(e)]) {
    assert.deepEqual([estadoDeCalificacion(calificada, quien.id), textoCalificacion(s, calificada, quien.id)], ['bloqueada', 'Calificó Luis']);
  }
});
