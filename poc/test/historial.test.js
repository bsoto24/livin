// test/historial.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, eliminarHabitante, espaciosDeTipo, familiares, mascotas, banoDe,
  consecuenciasDeEliminar,
} from '../src/hogar.js';
import { agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, limpiezaDeEspacio } from '../src/actividades.js';
import { proponer, aceptar, esVigente } from '../src/intercambios.js';
import { sumarDias } from '../src/fechas.js';
import { LIMITE_HISTORIAL } from '../src/catalogo.js';
import { crearCtx } from './ayuda.js';

const HOY = '2026-10-06';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', parentesco: 'hermano', genero: 'masculino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const diana = (e) => familiares(e)[0];
const luis = (e) => familiares(e)[1];
const firulais = (e) => mascotas(e)[0];
const cocina = (e) => espaciosDeTipo(e, 'cocina')[0];
const ultima = (e) => e.actividades.at(-1);

// Alta de una actividad; `extra` cambia lo que haga falta (por defecto, una puntual de Diana que vence hoy, sin espacio).
function nueva(estado, nombre, ctx, extra = {}) {
  const r = agregarActividad(estado, {
    nombre, icono: 'otra', miembroId: diana(estado).id, espacioId: null, tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
  }, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return r.estado;
}

// Crea una puntual y la marca "Hecho": el historial gana una entrada.
function hacer(estado, nombre, ctx, extra = {}) {
  const con = nueva(estado, nombre, ctx, extra);
  return marcarHecha(con, ultima(con).id, HOY, ctx);
}

// Deja `n` entradas en el historial ("Tarea 1" la más antigua).
function conHistorial(estado, n, ctx) {
  let e = estado;
  for (let i = 1; i <= n; i += 1) e = hacer(e, `Tarea ${i}`, ctx);
  return e;
}

test('AC-1.1, AC-9.2: "Hecho" en una puntual agrega exactamente una entrada acreditada a su responsable, sin calificación', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Lavar los platos', ctx, { icono: 'platos', espacioId: cocina(e).id });
  const a = ultima(e);
  const despues = marcarHecha(e, a.id, HOY, ctx);
  assert.equal(despues.historial.length, 1);
  const [entrada] = despues.historial;
  assert.deepEqual(
    [entrada.actividadId, entrada.miembroId, entrada.espacioId, entrada.nombre, entrada.icono, entrada.dia, entrada.estrellas, entrada.calificadoPor],
    [a.id, diana(e).id, cocina(e).id, 'Lavar los platos', 'platos', HOY, null, null],
  );
  assert.equal(entrada.hogarId, e.hogares[0].id);
  assert.deepEqual([entrada.creadoPor, entrada.actualizadoPor, entrada.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
  assert.equal(entrada.hechaEn, entrada.creadoEn);
  assert.equal(buscarActividad(despues, a.id), null); // quedó hecha, como en la 003
});

test('AC-1.2: "Hecho" en una repetitiva agrega una entrada y avanza su vencimiento como en la 003', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Barrer', ctx, { icono: 'barrer', tipo: 'repetitiva', frecuenciaDias: 7 });
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  assert.equal(e.historial.length, 1);
  assert.deepEqual([e.historial[0].nombre, e.historial[0].miembroId], ['Barrer', diana(e).id]);
  assert.equal(buscarActividad(e, id).vence, sumarDias(HOY, 7));
});

test('AC-1.3, AC-1.4: la entrada se acredita a quien tenía la actividad por un intercambio, y la repetitiva sigue volviendo a su responsable original', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Barrer', ctx, { icono: 'barrer', tipo: 'repetitiva', frecuenciaDias: 7 });
  e = nueva(e, 'Basura', ctx, { icono: 'basura', miembroId: luis(e).id });
  e = nueva(e, 'Platos', ctx, { icono: 'platos' });
  e = nueva(e, 'Ropa', ctx, { icono: 'ropa', miembroId: luis(e).id });
  const id = (nombre) => e.actividades.find((a) => a.nombre === nombre).id;
  const cambiar = (estado, ofrecida, pedida) => {
    const p = proponer(estado, { proponenteId: diana(estado).id, ofrecidaId: id(ofrecida), pedidaId: id(pedida) }, ctx);
    return aceptar(p.estado, p.estado.intercambios.at(-1).id, luis(estado).id, ctx).estado;
  };
  e = cambiar(e, 'Barrer', 'Basura'); // la repetitiva pasa a Luis y vuelve a Diana al hacerla
  e = cambiar(e, 'Platos', 'Ropa'); // la puntual pasa a Luis
  const barrer = marcarHecha(e, id('Barrer'), HOY, ctx);
  assert.equal(barrer.historial.at(-1).miembroId, luis(e).id);
  assert.equal(buscarActividad(barrer, id('Barrer')).miembroId, diana(e).id);
  const platos = marcarHecha(barrer, id('Platos'), HOY, ctx);
  assert.equal(platos.historial.at(-1).miembroId, luis(e).id);
});

test('AC-1.5: "Hecho" en una actividad de una mascota agrega una entrada acreditada a la mascota', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const e = hacer(base, 'Paseo', ctx, { miembroId: firulais(base).id });
  assert.equal(e.historial.length, 1);
  assert.equal(e.historial[0].miembroId, firulais(e).id);
});

test('AC-1.6, AC-1.7: cada "Hecho" es una entrada propia y una repetitiva hecha en dos días deja dos entradas', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Barrer', ctx, { tipo: 'repetitiva', frecuenciaDias: 7 });
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  e = hacer(e, 'Platos', ctx);
  const otroDia = sumarDias(HOY, 7);
  e = marcarHecha(e, id, otroDia, ctx);
  assert.deepEqual(e.historial.map((x) => [x.nombre, x.dia]), [['Barrer', HOY], ['Platos', HOY], ['Barrer', otroDia]]);
  assert.equal(new Set(e.historial.map((x) => x.id)).size, 3);
});

test('AC-1.8: un "Hecho" que no se aplica no agrega ninguna entrada ni cambia el estado', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Futura', ctx, { vence: sumarDias(HOY, 1) });
  const futura = ultima(e);
  e = hacer(e, 'Hecha', ctx);
  const hecha = e.actividades.find((a) => a.nombre === 'Hecha');
  e = nueva(e, 'Borrada', ctx);
  const borrada = ultima(e);
  e = eliminarActividad(e, borrada.id, ctx);
  assert.equal(e.historial.length, 1);
  for (const id of [futura.id, hecha.id, borrada.id, 'no-existe']) assert.equal(marcarHecha(e, id, HOY, ctx), e);
});

test('AC-1.9, AC-7.10: "Hecho" conserva sus efectos de siempre: estado del espacio, vigencia de las propuestas y el resto del hogar', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Platos', ctx, { espacioId: cocina(e).id, vence: '2026-10-05' });
  e = nueva(e, 'Basura', ctx, { miembroId: luis(e).id });
  const platos = e.actividades.find((a) => a.nombre === 'Platos');
  const basura = e.actividades.find((a) => a.nombre === 'Basura');
  e = proponer(e, { proponenteId: diana(e).id, ofrecidaId: platos.id, pedidaId: basura.id }, ctx).estado;
  const propuesta = e.intercambios[0];
  assert.equal(limpiezaDeEspacio(e, cocina(e).id, HOY), 'desordenado');
  assert.equal(esVigente(e, propuesta), true);
  const despues = marcarHecha(e, platos.id, HOY, ctx);
  assert.equal(limpiezaDeEspacio(despues, cocina(e).id, HOY), 'limpio');
  assert.equal(esVigente(despues, propuesta), false);
  const { historial, actividades, ...resto } = despues;
  const { historial: antesHistorial, actividades: antesActividades, ...restoAntes } = e;
  assert.deepEqual(resto, restoAntes); // espacios, miembros, bloques e intercambios intactos
  assert.deepEqual([antesHistorial.length, historial.length], [0, 1]);
  assert.equal(antesActividades.length, actividades.length);
});

test('AC-6.1, AC-6.2: con 199 entradas no se descarta nada; con 200, la siguiente descarta la más antigua', () => {
  const ctx = crearCtx();
  let e = conHistorial(hogarBase(ctx), LIMITE_HISTORIAL - 1, ctx);
  assert.deepEqual([e.historial.length, e.historial[0].nombre], [199, 'Tarea 1']);
  e = hacer(e, 'Tarea 200', ctx);
  assert.deepEqual([e.historial.length, e.historial[0].nombre], [200, 'Tarea 1']);
  e = hacer(e, 'Tarea 201', ctx);
  assert.deepEqual([e.historial.length, e.historial[0].nombre, e.historial.at(-1).nombre], [200, 'Tarea 2', 'Tarea 201']);
});

test('AC-6.3, AC-6.4, AC-6.5: se descarta la más antigua aunque esté calificada y aunque su día sea posterior', () => {
  const ctx = crearCtx();
  let e = conHistorial(hogarBase(ctx), LIMITE_HISTORIAL, ctx);
  const primera = { ...e.historial[0], dia: '2026-12-31', estrellas: 5, calificadoPor: luis(e).id };
  e = { ...e, historial: [primera, ...e.historial.slice(1)] };
  e = hacer(e, 'Tarea nueva', ctx);
  assert.equal(e.historial.length, LIMITE_HISTORIAL);
  assert.equal(e.historial.some((x) => x.nombre === 'Tarea 1'), false);
  assert.deepEqual([e.historial[0].nombre, e.historial.at(-1).nombre], ['Tarea 2', 'Tarea nueva']);
});

test('AC-6.6: un historial con más de 200 entradas conserva todas hasta el siguiente "Hecho", que lo deja en 200', () => {
  const ctx = crearCtx();
  const base = conHistorial(hogarBase(ctx), LIMITE_HISTORIAL, ctx);
  const copias = base.historial.slice(0, 5).map((x, i) => ({ ...x, id: `extra-${i}` }));
  const e = { ...base, historial: [...copias, ...base.historial] };
  assert.equal(e.historial.length, LIMITE_HISTORIAL + 5);
  const despues = hacer(e, 'Tarea nueva', ctx);
  assert.equal(despues.historial.length, LIMITE_HISTORIAL);
  assert.equal(despues.historial.at(-1).nombre, 'Tarea nueva');
});

test('AC-7.1, AC-7.2: editar o eliminar la actividad de origen no cambia la entrada', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Barrer', ctx, { icono: 'barrer', tipo: 'repetitiva', frecuenciaDias: 7 });
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  const [entrada] = e.historial;
  const editada = editarActividad(e, id, {
    nombre: 'Barrer a fondo', icono: 'limpiar', miembroId: luis(e).id, espacioId: cocina(e).id, tipo: 'puntual', vence: HOY, frecuenciaDias: null,
  }, ctx);
  assert.equal(editada.ok, true);
  assert.deepEqual(editada.estado.historial, [entrada]);
  assert.deepEqual(eliminarActividad(editada.estado, id, ctx).historial, [entrada]);
});

test('AC-7.7: las confirmaciones de eliminar no cuentan entradas del historial', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = hacer(e, 'Platos', ctx, { espacioId: cocina(e).id });
  const sinHistorial = { ...e, historial: [] };
  assert.deepEqual(consecuenciasDeEliminar(e, cocina(e).id), consecuenciasDeEliminar(sinHistorial, cocina(e).id));
});

test('AC-7.8: las entradas de un baño interno se conservan cuando el baño pasa a otro cuarto y cuando se elimina con su cuarto', () => {
  const ctx = crearCtx();
  const preparar = (banos) => {
    let e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
    for (let i = 0; i < banos; i += 1) e = agregarEspacio(e, 'bano', ctx);
    const [d1] = espaciosDeTipo(e, 'dormitorio');
    const bano = banoDe(e, d1.id);
    e = hacer(e, 'Ducha', ctx, { espacioId: bano.id });
    return { e, d1, bano };
  };
  const pasa = preparar(1); // con un solo baño interno, al eliminar el primer cuarto pasa al segundo
  const trasPasar = eliminarEspacio(pasa.e, pasa.d1.id, ctx);
  assert.deepEqual(trasPasar.historial, pasa.e.historial);
  assert.equal(trasPasar.espacios.find((x) => x.id === pasa.bano.id).eliminadoEn, null);
  const sale = preparar(2); // con dos, cada cuarto tiene el suyo: el baño se elimina con su cuarto
  const trasEliminar = eliminarEspacio(sale.e, sale.d1.id, ctx);
  assert.deepEqual(trasEliminar.historial, sale.e.historial);
  assert.notEqual(trasEliminar.espacios.find((x) => x.id === sale.bano.id).eliminadoEn, null);
});

test('AC-7.9, AC-9.5: eliminar a la persona acreditada, o a quien calificó, conserva las entradas y las calificaciones', () => {
  const ctx = crearCtx();
  let e = hacer(hogarBase(ctx), 'Platos', ctx);
  e = { ...e, historial: e.historial.map((x) => ({ ...x, estrellas: 4, calificadoPor: luis(e).id })) };
  assert.deepEqual(eliminarHabitante(e, diana(e).id, ctx).historial, e.historial);
  assert.deepEqual(eliminarHabitante(e, luis(e).id, ctx).historial, e.historial);
});
