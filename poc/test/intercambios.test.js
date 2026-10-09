// test/intercambios.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, eliminarHabitante, renombrarEspacio, renombrarMiembro,
  espaciosActivos, espaciosDeTipo, puedeEliminar, familiares, mascotas, miembrosActivos, pendientesDeMiembro, actividadesPendientes,
} from '../src/hogar.js';
import {
  agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, contarActividades, limpiezaDeEspacio, burbujas,
} from '../src/actividades.js';
import {
  buscarIntercambio, esVigente, intercambiosVigentes, numeroRecibidas, intercambiosDe, actividadesOfrecibles, actividadesPedibles,
  motivoSinPropuesta, proponer, aceptar, rechazar, retirar, quitar, textoIntercambio, textoPropuesta,
} from '../src/intercambios.js';
import { LIMITE_INTERCAMBIOS } from '../src/catalogo.js';
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
const idDe = (estado, nombre) => estado.actividades.find((a) => a.nombre === nombre).id;
const nombres = (lista) => lista.map((a) => a.nombre);
const ultimo = (e) => e.intercambios.at(-1);

// Alta de una actividad de `quien`: una puntual en la cocina que vence hoy; `extra` cambia lo que haga falta.
function nueva(estado, nombre, quien, ctx, extra = {}) {
  const r = agregarActividad(estado, {
    nombre, icono: 'otra', miembroId: quien.id, espacioId: cocina(estado).id, tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
  }, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return r.estado;
}

// Escenario: el propietario tiene "Platos" (puntual) y "Barrer" (repetitiva); Diana, "Basura" (puntual) y "Plantas" (repetitiva,
// vence en dos días); Luis, "Ropa"; y la mascota, "Paseo".
function escenario() {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Platos', propietarioDe(e), ctx);
  e = nueva(e, 'Basura', diana(e), ctx);
  e = nueva(e, 'Barrer', propietarioDe(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 7 });
  e = nueva(e, 'Plantas', diana(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 3, vence: '2026-10-08' });
  e = nueva(e, 'Ropa', luis(e), ctx);
  e = nueva(e, 'Paseo', firulais(e), ctx);
  return { ctx, e };
}

function proponerOk(estado, proponente, ofrecida, pedida, ctx) {
  const r = proponer(estado, { proponenteId: proponente.id, ofrecidaId: idDe(estado, ofrecida), pedidaId: idDe(estado, pedida) }, ctx);
  assert.equal(r.ok, true, r.error);
  return r.estado;
}

const proponerYAceptar = (estado, proponente, ofrecida, pedida, ctx) => {
  const p = proponerOk(estado, proponente, ofrecida, pedida, ctx);
  const r = aceptar(p, ultimo(p).id, ultimo(p).destinatarioId, ctx);
  assert.equal(r.ok, true, r.error);
  return r.estado;
};

test('AC-6.4: ofrecibles y pedibles son las pendientes de cada lado, sin las de las mascotas ni las ya incluidas en una propuesta', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  assert.deepEqual(nombres(actividadesOfrecibles(e, P.id)), ['Platos', 'Barrer']);
  assert.deepEqual(nombres(actividadesPedibles(e, P.id)), ['Basura', 'Plantas', 'Ropa']); // Plantas aún no vence y también se puede pedir
  assert.deepEqual(nombres(actividadesOfrecibles(e, diana(e).id)), ['Basura', 'Plantas']);
  const hecha = marcarHecha(e, idDe(e, 'Platos'), HOY, ctx);
  const eliminada = eliminarActividad(e, idDe(e, 'Barrer'), ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(hecha, P.id)), ['Barrer']);
  assert.deepEqual(nombres(actividadesOfrecibles(eliminada, P.id)), ['Platos']);
  const conPropuesta = proponerOk(e, P, 'Platos', 'Basura', ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(conPropuesta, P.id)), ['Barrer']);
  assert.deepEqual(nombres(actividadesPedibles(conPropuesta, P.id)), ['Plantas', 'Ropa']);
  assert.deepEqual(nombres(actividadesPedibles(conPropuesta, luis(e).id)), ['Barrer', 'Plantas']);
});

test('AC-6.5: proponer crea la propuesta vigente y no cambia ninguna actividad, espacio ni miembro', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const despues = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const i = ultimo(despues);
  assert.deepEqual(
    [i.proponenteId, i.destinatarioId, i.actividadOfrecidaId, i.actividadPedidaId, i.estado, i.respondidoEn],
    [P.id, diana(e).id, idDe(e, 'Platos'), idDe(e, 'Basura'), 'pendiente', null],
  );
  assert.equal(i.hogarId, e.hogares[0].id);
  assert.deepEqual([despues.actividades, despues.espacios, despues.miembros], [e.actividades, e.espacios, e.miembros]);
  assert.equal(esVigente(despues, i), true);
  assert.deepEqual(intercambiosVigentes(despues), [i]);
  assert.deepEqual(buscarIntercambio(despues, i.id), i);
  assert.equal(buscarIntercambio(despues, 'no-existe'), null);
});

test('AC-6.9: cada motivo de rechazo de una propuesta se informa y no cambia nada', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const id = (nombre) => idDe(e, nombre);
  const intentar = (estado, extra) => proponer(estado, { proponenteId: P.id, ofrecidaId: id('Platos'), pedidaId: id('Basura'), ...extra }, ctx);
  const casos = [
    [{ proponenteId: 'no-existe' }, 'proponente'],
    [{ proponenteId: firulais(e).id }, 'proponente'],
    [{ ofrecidaId: id('Basura') }, 'ofrecida-ajena'],
    [{ pedidaId: id('Barrer') }, 'pedida-propia'],
    [{ pedidaId: id('Paseo') }, 'pedida-mascota'],
    [{ ofrecidaId: 'no-existe' }, 'no-pendiente'],
    [{ pedidaId: 'no-existe' }, 'no-pendiente'],
  ];
  for (const [extra, error] of casos) {
    const r = intentar(e, extra);
    assert.deepEqual([r.ok, r.error, r.estado === e], [false, error, true], JSON.stringify(extra));
  }
  assert.equal(intentar(marcarHecha(e, id('Platos'), HOY, ctx), {}).error, 'no-pendiente');
  assert.equal(intentar(eliminarActividad(e, id('Basura'), ctx), {}).error, 'no-pendiente');
  const conPropuesta = proponerOk(e, P, 'Platos', 'Basura', ctx);
  assert.equal(intentar(conPropuesta, {}).error, 'ya-en-propuesta');
  assert.equal(intentar(conPropuesta, { ofrecidaId: id('Barrer') }).error, 'ya-en-propuesta'); // la pedida (Basura) ya está en una
  assert.equal(intentar(conPropuesta, { pedidaId: id('Ropa') }).error, 'ya-en-propuesta'); // la ofrecida (Platos) ya está en una
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  assert.equal(proponer(intercambiadas, { proponenteId: P.id, ofrecidaId: id('Plantas'), pedidaId: id('Ropa') }, ctx).error, 'regreso');
  assert.equal(proponer(intercambiadas, { proponenteId: luis(e).id, ofrecidaId: id('Ropa'), pedidaId: id('Barrer') }, ctx).error, 'regreso');
});

test('AC-6.6, AC-6.7: sin actividades que intercambiar, o con 20 propuestas vigentes, no se puede proponer', () => {
  const ctx = crearCtx();
  const vacio = hogarBase(ctx);
  assert.equal(motivoSinPropuesta(vacio, propietarioDe(vacio).id), 'nada');
  const solo = crearHogarInicial(ctx);
  const soloConPlatos = nueva(solo, 'Platos', propietarioDe(solo), ctx);
  assert.equal(motivoSinPropuesta(soloConPlatos, propietarioDe(solo).id), 'nada'); // nadie más a quien pedir
  let e = hogarBase(ctx);
  const P = propietarioDe(e);
  for (let n = 0; n < LIMITE_INTERCAMBIOS; n++) {
    e = nueva(nueva(e, `A${n}`, P, ctx), `B${n}`, diana(e), ctx);
  }
  e = nueva(nueva(e, 'Extra 1', P, ctx), 'Extra 2', luis(e), ctx);
  for (let n = 0; n < LIMITE_INTERCAMBIOS; n++) {
    assert.equal(motivoSinPropuesta(e, P.id), null, `con ${n} propuestas`);
    e = proponerOk(e, P, `A${n}`, `B${n}`, ctx);
  }
  assert.equal(intercambiosVigentes(e).length, LIMITE_INTERCAMBIOS);
  assert.equal(motivoSinPropuesta(e, P.id), 'limite');
  const r = proponer(e, { proponenteId: P.id, ofrecidaId: idDe(e, 'Extra 1'), pedidaId: idDe(e, 'Extra 2') }, ctx);
  assert.deepEqual([r.ok, r.error, r.estado === e], [false, 'limite', true]);
  const una = eliminarActividad(e, idDe(e, 'B0'), ctx); // una propuesta que deja de ser vigente libera un lugar
  assert.equal(intercambiosVigentes(una).length, LIMITE_INTERCAMBIOS - 1);
  assert.equal(motivoSinPropuesta(una, P.id), null);
});

test('AC-6.11, AC-7.1, AC-7.4, AC-7.6: cada persona ve solo sus propuestas recibidas y enviadas, y el número cuenta las vigentes recibidas', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx); // el propietario → Diana
  const i1 = ultimo(p1);
  assert.deepEqual(intercambiosDe(p1, P.id), { recibidas: [], enviadas: [i1] });
  assert.deepEqual(intercambiosDe(p1, diana(e).id), { recibidas: [i1], enviadas: [] });
  assert.deepEqual(intercambiosDe(p1, luis(e).id), { recibidas: [], enviadas: [] });
  assert.deepEqual([P, diana(e), luis(e)].map((m) => numeroRecibidas(p1, m.id)), [0, 1, 0]);
  const p2 = proponerOk(p1, luis(e), 'Ropa', 'Plantas', ctx); // Luis → Diana
  assert.equal(numeroRecibidas(p2, diana(e).id), 2);
  assert.deepEqual(intercambiosDe(p2, luis(e).id).enviadas.map((i) => i.id), [ultimo(p2).id]);
});

test('AC-8.1, AC-8.15: aceptar dos puntuales intercambia a sus responsables y no cambia nada más', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const r = aceptar(p1, ultimo(p1).id, diana(e).id, ctx);
  assert.equal(r.ok, true);
  const despues = r.estado;
  const [platos, basura] = [idDe(e, 'Platos'), idDe(e, 'Basura')].map((id) => despues.actividades.find((a) => a.id === id));
  const antes = [idDe(e, 'Platos'), idDe(e, 'Basura')].map((id) => e.actividades.find((a) => a.id === id));
  assert.deepEqual([platos.miembroId, platos.devolverA, basura.miembroId, basura.devolverA], [diana(e).id, null, P.id, null]);
  const campos = (a) => [a.nombre, a.icono, a.espacioId, a.tipo, a.vence, a.frecuenciaDias, a.hechaEn];
  assert.deepEqual([campos(platos), campos(basura)], [campos(antes[0]), campos(antes[1])]);
  assert.ok(platos.actualizadoEn > antes[0].actualizadoEn && basura.actualizadoEn > antes[1].actualizadoEn);
  const i = buscarIntercambio(despues, ultimo(p1).id);
  assert.deepEqual([i.estado, i.respondidoEn !== null, i.actualizadoEn > ultimo(p1).actualizadoEn], ['aceptado', true, true]);
  assert.deepEqual([esVigente(despues, i), intercambiosVigentes(despues), numeroRecibidas(despues, diana(e).id)], [false, [], 0]);
  assert.deepEqual([despues.espacios, despues.miembros], [e.espacios, e.miembros]);
});

test('AC-8.2, AC-8.3: cada repetitiva recuerda a su responsable original; una puntual no recuerda a nadie', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const dosRepetitivas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  const [barrer, plantas] = ['Barrer', 'Plantas'].map((n) => dosRepetitivas.actividades.find((a) => a.nombre === n));
  assert.deepEqual([barrer.miembroId, barrer.devolverA, plantas.miembroId, plantas.devolverA], [diana(e).id, P.id, P.id, diana(e).id]);
  const mixta = proponerYAceptar(e, P, 'Platos', 'Plantas', ctx); // una puntual por una repetitiva
  const [platos, plantas2] = ['Platos', 'Plantas'].map((n) => mixta.actividades.find((a) => a.nombre === n));
  assert.deepEqual([platos.miembroId, platos.devolverA, plantas2.miembroId, plantas2.devolverA], [diana(e).id, null, P.id, diana(e).id]);
  assert.equal(barrer.vence, '2026-10-06');
});

test('AC-8.4: "Hecho" devuelve cada repetitiva intercambiada a su responsable original, con su nuevo vencimiento', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  const sinBarrer = marcarHecha(intercambiadas, idDe(e, 'Barrer'), HOY, ctx); // cualquier jugador puede hacerla
  const barrer = buscarActividad(sinBarrer, idDe(e, 'Barrer'));
  assert.deepEqual([barrer.miembroId, barrer.devolverA, barrer.vence], [P.id, null, '2026-10-13']);
  const plantas = buscarActividad(marcarHecha(sinBarrer, idDe(e, 'Plantas'), '2026-10-08', ctx), idDe(e, 'Plantas'));
  assert.deepEqual([plantas.miembroId, plantas.devolverA, plantas.vence], [diana(e).id, null, '2026-10-11']);
  assert.equal(textoIntercambio(sinBarrer, barrer), '');
});

test('AC-7.3, AC-7.5, AC-7.6: rechazar y retirar no cambian las actividades y solo las hacen quienes corresponde', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p1);
  assert.equal(rechazar(p1, id, P.id, ctx).error, 'destinataria');
  assert.equal(rechazar(p1, id, luis(e).id, ctx).error, 'destinataria');
  assert.equal(aceptar(p1, id, P.id, ctx).error, 'destinataria');
  assert.equal(retirar(p1, id, diana(e).id, ctx).error, 'autor');
  assert.equal(retirar(p1, id, luis(e).id, ctx).error, 'autor');
  const rechazada = rechazar(p1, id, diana(e).id, ctx);
  assert.equal(rechazada.ok, true);
  assert.deepEqual(rechazada.estado.actividades, p1.actividades);
  assert.deepEqual([buscarIntercambio(rechazada.estado, id).estado, buscarIntercambio(rechazada.estado, id).respondidoEn !== null], ['rechazado', true]);
  assert.equal(numeroRecibidas(rechazada.estado, diana(e).id), 0);
  const retirada = retirar(p1, id, P.id, ctx);
  assert.equal(retirada.ok, true);
  assert.deepEqual(retirada.estado.actividades, p1.actividades);
  assert.equal(buscarIntercambio(retirada.estado, id).estado, 'retirado');
  assert.equal(aceptar(rechazada.estado, id, diana(e).id, ctx).error, 'no-encontrado');
  assert.equal(rechazar(retirada.estado, id, diana(e).id, ctx).error, 'no-encontrado');
  assert.equal(aceptar(p1, 'no-existe', diana(e).id, ctx).error, 'no-encontrado');
  assert.deepEqual(nombres(actividadesOfrecibles(rechazada.estado, P.id)), ['Platos', 'Barrer']); // quedan libres para otra propuesta
});

test('AC-7.10: una propuesta que dejó de ser vigente no se acepta, ni se rechaza ni se retira', () => {
  const { ctx, e } = escenario();
  const p1 = proponerOk(e, propietarioDe(e), 'Platos', 'Basura', ctx);
  const { id } = ultimo(p1);
  const platos = buscarActividad(p1, idDe(p1, 'Platos'));
  const editada = editarActividad(p1, platos.id, { ...platos, nombre: 'Platos y vasos' }, ctx).estado;
  for (const [f, quien] of [[aceptar, diana(e)], [rechazar, diana(e)], [retirar, propietarioDe(e)]]) {
    const r = f(editada, id, quien.id, ctx);
    assert.deepEqual([r.ok, r.error, r.estado === editada], [false, 'no-vigente', true], f.name);
  }
});

test('AC-9.1 a AC-9.4: cada operación que cambia una de las dos actividades, o las bajas en cascada, deja la propuesta no vigente', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'cocina', ctx);
  const cocina2 = espaciosDeTipo(e, 'cocina')[1];
  e = nueva(e, 'Platos', propietarioDe(e), ctx, { espacioId: cocina2.id });
  e = nueva(e, 'Basura', diana(e), ctx);
  const p = proponerOk(e, propietarioDe(e), 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  assert.equal(esVigente(p, ultimo(p)), true);
  const editar = (nombre) => (s) => editarActividad(s, idDe(s, nombre), { ...buscarActividad(s, idDe(s, nombre)), icono: 'platos' }, ctx).estado;
  const operaciones = {
    'editar la ofrecida': editar('Platos'),
    'editar la pedida': editar('Basura'),
    'eliminar la ofrecida': (s) => eliminarActividad(s, idDe(s, 'Platos'), ctx),
    'eliminar la pedida': (s) => eliminarActividad(s, idDe(s, 'Basura'), ctx),
    'marcar la ofrecida como hecha': (s) => marcarHecha(s, idDe(s, 'Platos'), HOY, ctx),
    'marcar la pedida como hecha': (s) => marcarHecha(s, idDe(s, 'Basura'), HOY, ctx),
    'eliminar el espacio de la ofrecida': (s) => eliminarEspacio(s, cocina2.id, ctx),
    'eliminar a la destinataria': (s) => eliminarHabitante(s, diana(s).id, ctx),
  };
  for (const [nombre, operacion] of Object.entries(operaciones)) {
    const despues = operacion(p);
    assert.notEqual(despues, p, nombre);
    assert.equal(esVigente(despues, buscarIntercambio(despues, id)), false, nombre);
    assert.equal(numeroRecibidas(despues, diana(p).id), 0, nombre);
    assert.equal(aceptar(despues, id, diana(p).id, ctx).ok, false, nombre);
  }
});

test('AC-9.5, AC-9.6: renombrar a una persona o a un espacio no anula la propuesta, y la vigencia no depende del día', () => {
  const { ctx, e } = escenario();
  const p = proponerOk(e, propietarioDe(e), 'Platos', 'Basura', ctx);
  const i = ultimo(p);
  const renombrada = renombrarMiembro(p, diana(e).id, 'Dana', ctx).estado;
  const espacio = renombrarEspacio(p, cocina(e).id, 'La cocina', ctx).estado;
  assert.equal(esVigente(renombrada, buscarIntercambio(renombrada, i.id)), true);
  assert.equal(esVigente(espacio, buscarIntercambio(espacio, i.id)), true);
  assert.equal(esVigente.length, 2); // solo recibe (estado, intercambio): el paso de los días no la anula
});

test('AC-9.7, AC-9.8: restaurar el valor anterior no revive la propuesta, y las actividades quedan libres para otra', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  const platos = buscarActividad(p, idDe(p, 'Platos'));
  const cambiada = editarActividad(p, platos.id, { ...platos, nombre: 'Otro' }, ctx).estado;
  const restaurada = editarActividad(cambiada, platos.id, { ...platos, nombre: 'Platos' }, ctx).estado;
  assert.equal(esVigente(restaurada, buscarIntercambio(restaurada, id)), false);
  assert.deepEqual(nombres(actividadesOfrecibles(restaurada, P.id)), ['Platos', 'Barrer']);
  const nueva2 = proponerOk(restaurada, P, 'Platos', 'Basura', ctx);
  assert.equal(esVigente(nueva2, buscarIntercambio(nueva2, id)), false);
  assert.equal(esVigente(nueva2, ultimo(nueva2)), true);
  assert.equal(intercambiosVigentes(nueva2).length, 1);
});

test('AC-7.8: quitar una propuesta que no es vigente la deja rechazada o retirada según quién la quita, y una vigente no se quita', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  assert.equal(quitar(p, id, diana(e).id, ctx).error, 'sigue-vigente');
  const platos = buscarActividad(p, idDe(p, 'Platos'));
  const editada = editarActividad(p, platos.id, { ...platos, nombre: 'Platos y vasos' }, ctx).estado;
  assert.deepEqual(intercambiosDe(editada, diana(e).id).recibidas.map((i) => esVigente(editada, i)), [false]); // se muestra como "ya no vigente"
  assert.equal(numeroRecibidas(editada, diana(e).id), 0);
  const quitadaPorDiana = quitar(editada, id, diana(e).id, ctx);
  assert.deepEqual([quitadaPorDiana.ok, buscarIntercambio(quitadaPorDiana.estado, id).estado], [true, 'rechazado']);
  const quitadaPorElPropietario = quitar(editada, id, P.id, ctx);
  assert.deepEqual([quitadaPorElPropietario.ok, buscarIntercambio(quitadaPorElPropietario.estado, id).estado], [true, 'retirado']);
  assert.equal(quitar(editada, id, luis(e).id, ctx).error, 'participante');
  assert.deepEqual(intercambiosDe(quitadaPorDiana.estado, diana(e).id), { recibidas: [], enviadas: [] });
  assert.equal(quitar(quitadaPorDiana.estado, id, diana(e).id, ctx).error, 'no-encontrado');
});

test('AC-8.6: los textos de la nota "por intercambio" y de las filas del panel', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const i = ultimo(p);
  assert.equal(textoPropuesta(p, i, 'recibida'), 'Personaje 1 te ofrece «Platos» por «Basura»');
  assert.equal(textoPropuesta(p, i, 'enviada'), 'Ofreciste «Platos» a Diana por «Basura»');
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  const barrer = intercambiadas.actividades.find((a) => a.nombre === 'Barrer');
  assert.equal(textoIntercambio(intercambiadas, barrer), 'por intercambio (vuelve a Personaje 1)');
  assert.equal(textoIntercambio(e, e.actividades[0]), '');
  const conMarcado = renombrarMiembro(p, diana(e).id, '<b>Dana</b>', ctx).estado;
  assert.equal(textoPropuesta(conMarcado, i, 'enviada'), 'Ofreciste «Platos» a <b>Dana</b> por «Basura»'); // texto plano: la pantalla lo inserta como texto
});

test('AC-8.7, AC-8.8, AC-8.9: aceptar no cambia el total ni el estado de los espacios; las pendientes y la burbuja de un miembro siguen al responsable actual', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const P = propietarioDe(e);
  e = nueva(e, 'Platos', P, ctx, { vence: '2026-10-03' });
  e = nueva(e, 'Ropa', luis(e), ctx, { espacioId: null });
  e = nueva(e, 'Barrer', P, ctx);
  const despues = proponerYAceptar(e, P, 'Platos', 'Ropa', ctx);
  assert.equal(contarActividades(despues), contarActividades(e));
  assert.equal(limpiezaDeEspacio(despues, cocina(e).id, HOY), limpiezaDeEspacio(e, cocina(e).id, HOY));
  assert.deepEqual(nombres(actividadesPendientes(despues).filter((a) => a.miembroId === P.id)), ['Ropa', 'Barrer']);
  assert.deepEqual([pendientesDeMiembro(despues, luis(e).id), pendientesDeMiembro(despues, P.id)], [1, 2]);
  const delEspacio = (estado) => burbujas(estado, HOY).find((b) => b.tipo === 'espacio');
  assert.deepEqual(delEspacio(despues), delEspacio(e)); // Platos sigue en la cocina
  const delMiembro = (estado, id) => burbujas(estado, HOY).find((b) => b.tipo === 'miembro' && b.id === id);
  assert.equal(delMiembro(e, luis(e).id).actividades.length, 1);
  assert.equal(delMiembro(despues, luis(e).id), undefined);
  assert.deepEqual(delMiembro(despues, P.id).actividades, [idDe(e, 'Ropa')]);
});

test('AC-8.14: una repetitiva con regreso pendiente no se ofrece ni se pide hasta que vuelve a su responsable', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(intercambiadas, P.id)), ['Platos']);
  assert.deepEqual(nombres(actividadesOfrecibles(intercambiadas, diana(e).id)), ['Basura']);
  assert.deepEqual(nombres(actividadesPedibles(intercambiadas, luis(e).id)), ['Platos', 'Basura']);
  const devuelta = marcarHecha(intercambiadas, idDe(e, 'Barrer'), HOY, ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(devuelta, P.id)), ['Platos', 'Barrer']);
});

test('AC-11.1 a AC-11.5: cada propuesta conserva su identidad, su auditoría y sus referencias por identificador', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const i = ultimo(p);
  assert.ok(i.id && i.creadoEn && i.actualizadoEn);
  assert.deepEqual([i.creadoPor, i.actualizadoPor, i.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
  assert.equal('cuentaId' in i, false);
  const aceptada = buscarIntercambio(aceptar(p, i.id, diana(e).id, ctx).estado, i.id);
  assert.equal(aceptada.id, i.id);
  assert.ok(aceptada.actualizadoEn > i.creadoEn);
  assert.deepEqual([aceptada.proponenteId, aceptada.destinatarioId], [P.id, diana(e).id]);
  const renombrada = renombrarMiembro(p, diana(e).id, 'Dana', ctx).estado;
  assert.deepEqual(buscarIntercambio(renombrada, i.id), i);
  assert.equal(p.intercambios.length, 1); // quitar o responder nunca borra el registro
});

function sinReferenciasRotas(estado, nombre) {
  const miembros = new Set(miembrosActivos(estado).map((m) => m.id));
  for (const i of intercambiosVigentes(estado)) {
    assert.ok(buscarActividad(estado, i.actividadOfrecidaId) && buscarActividad(estado, i.actividadPedidaId), `${nombre}: propuesta vigente con una actividad que no está pendiente`);
  }
  for (const a of actividadesPendientes(estado)) {
    assert.ok(miembros.has(a.miembroId), `${nombre}: actividad de un miembro eliminado`);
    assert.ok(a.devolverA === null || miembros.has(a.devolverA), `${nombre}: regreso a un miembro eliminado`);
  }
}

test('Reliability, FR-10: ninguna baja de un espacio o de un miembro deja una propuesta vigente con una actividad eliminada ni un regreso a un miembro eliminado', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'cocina', ctx), 'lavanderia', ctx);
  const [c1, c2] = espaciosDeTipo(e, 'cocina');
  const [lavanderia] = espaciosDeTipo(e, 'lavanderia');
  const P = propietarioDe(e);
  e = nueva(e, 'P rep', P, ctx, { tipo: 'repetitiva', frecuenciaDias: 7, espacioId: c1.id });
  e = nueva(e, 'D rep', diana(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 7, espacioId: c2.id });
  e = nueva(e, 'P punt', P, ctx, { espacioId: lavanderia.id });
  e = nueva(e, 'D punt', diana(e), ctx, { espacioId: c2.id });
  e = nueva(e, 'L punt', luis(e), ctx, { espacioId: lavanderia.id });
  e = nueva(e, 'L rep', luis(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 3, espacioId: c1.id });
  e = proponerYAceptar(e, P, 'P rep', 'D rep', ctx); // regreso pendiente en las dos repetitivas
  e = proponerOk(e, P, 'P punt', 'L punt', ctx);
  e = proponerOk(e, diana(e), 'D punt', 'L rep', ctx);
  sinReferenciasRotas(e, 'inicial');
  for (const espacio of espaciosActivos(e).filter((x) => puedeEliminar(e, x.id))) {
    sinReferenciasRotas(eliminarEspacio(e, espacio.id, ctx), `sin el espacio ${espacio.id}`);
  }
  for (const miembro of [diana(e), luis(e), firulais(e)]) {
    sinReferenciasRotas(eliminarHabitante(e, miembro.id, ctx), `sin ${miembro.nombre}`);
  }
});

// Contexto con el reloj detenido: todas las operaciones ocurren en el mismo instante (mismos ids que `crearCtx`).
function crearCtxCongelado() {
  let id = 0;
  return { cuentaId: 'cuenta-1', nuevoId: () => `id-${++id}`, ahora: () => '2026-10-04T00:00:00.000Z' };
}

// Escenario del contrato con el reloj detenido: "Platos" (puntual) está en una segunda cocina, para poder dar de baja su espacio.
function escenarioCongelado() {
  const ctx = crearCtxCongelado();
  let e = agregarEspacio(hogarBase(ctx), 'cocina', ctx);
  const cocina2 = espaciosDeTipo(e, 'cocina')[1];
  e = nueva(e, 'Platos', propietarioDe(e), ctx, { espacioId: cocina2.id });
  e = nueva(e, 'Basura', diana(e), ctx);
  e = nueva(e, 'Barrer', propietarioDe(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 7 });
  e = nueva(e, 'Plantas', diana(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 3 });
  e = nueva(e, 'Ropa', luis(e), ctx);
  return { ctx, e, cocina2 };
}

test('Reliability (contrato), AC-9.1 a AC-9.4: con el reloj detenido, cada operación que cambia una actividad deja la propuesta no vigente', () => {
  const { ctx, e, cocina2 } = escenarioCongelado();
  const P = propietarioDe(e);
  const cambiar = (nombre, cambio) => (s) => {
    const r = editarActividad(s, idDe(s, nombre), { ...buscarActividad(s, idDe(s, nombre)), ...cambio }, ctx);
    assert.equal(r.ok, true, `${nombre}: ${r.error}`);
    return r.estado;
  };
  const casos = [
    ['editar la ofrecida (nombre)', 'Platos', 'Basura', cambiar('Platos', { nombre: 'Platos y vasos' })],
    ['editar la pedida (icono)', 'Platos', 'Basura', cambiar('Basura', { icono: 'platos' })],
    ['editar una repetitiva ofrecida cambiando solo la frecuencia', 'Barrer', 'Ropa', cambiar('Barrer', { frecuenciaDias: 14 })],
    ['editar una repetitiva pedida cambiando solo el vencimiento', 'Platos', 'Plantas', cambiar('Plantas', { vence: '2026-10-07' })],
    ['eliminar la ofrecida', 'Platos', 'Basura', (s) => eliminarActividad(s, idDe(s, 'Platos'), ctx)],
    ['eliminar la pedida', 'Platos', 'Basura', (s) => eliminarActividad(s, idDe(s, 'Basura'), ctx)],
    ['"Hecho" en la ofrecida puntual', 'Platos', 'Basura', (s) => marcarHecha(s, idDe(s, 'Platos'), HOY, ctx)],
    ['"Hecho" en la pedida puntual', 'Platos', 'Basura', (s) => marcarHecha(s, idDe(s, 'Basura'), HOY, ctx)],
    ['"Hecho" en una repetitiva que vence hoy (ofrecida)', 'Barrer', 'Ropa', (s) => marcarHecha(s, idDe(s, 'Barrer'), HOY, ctx)],
    ['"Hecho" en una repetitiva que vence hoy (pedida)', 'Platos', 'Plantas', (s) => marcarHecha(s, idDe(s, 'Plantas'), HOY, ctx)],
    ['baja del espacio de la ofrecida', 'Platos', 'Basura', (s) => eliminarEspacio(s, cocina2.id, ctx)],
    ['baja del miembro destinatario', 'Platos', 'Basura', (s) => eliminarHabitante(s, diana(s).id, ctx)],
  ];
  const fallos = [];
  for (const [nombre, ofrecida, pedida, operacion] of casos) {
    const p = proponerOk(e, P, ofrecida, pedida, ctx);
    const i = ultimo(p);
    assert.equal(esVigente(p, i), true, `${nombre}: antes de la operación debía ser vigente`);
    const despues = operacion(p);
    assert.notEqual(despues, p, nombre);
    if (esVigente(despues, buscarIntercambio(despues, i.id))) fallos.push(`${nombre}: sigue vigente`);
    if (numeroRecibidas(despues, i.destinatarioId) !== 0) fallos.push(`${nombre}: sigue contando como recibida`);
  }
  assert.deepEqual(fallos, []);
});

test('Reliability (contrato), AC-9.3: con el reloj detenido, aceptar cambia las marcas de sus dos actividades y no afecta a otra propuesta', () => {
  const { ctx, e } = escenarioCongelado();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const p2 = proponerOk(p1, diana(e), 'Plantas', 'Barrer', ctx);
  const [i1, i2] = p2.intercambios;
  const r = aceptar(p2, i1.id, diana(e).id, ctx);
  assert.equal(r.ok, true, r.error);
  const marca = (estado, nombre) => buscarActividad(estado, idDe(e, nombre)).actualizadoEn;
  assert.notEqual(marca(r.estado, 'Platos'), i1.marcaOfrecida, 'aceptar: la marca de la ofrecida no cambió');
  assert.notEqual(marca(r.estado, 'Basura'), i1.marcaPedida, 'aceptar: la marca de la pedida no cambió');
  assert.equal(esVigente(r.estado, buscarIntercambio(r.estado, i1.id)), false, 'aceptar: la propuesta aceptada no debe ser vigente');
  assert.equal(esVigente(r.estado, buscarIntercambio(r.estado, i2.id)), true, 'aceptar: otra propuesta de otras actividades debe seguir vigente');
  assert.equal(marca(r.estado, 'Plantas'), i2.marcaOfrecida);
  assert.equal(marca(r.estado, 'Barrer'), i2.marcaPedida);
});

test('Reliability (contrato), AC-9.7: con el reloj detenido, restaurar el valor anterior no revive la propuesta', () => {
  const { ctx, e } = escenarioCongelado();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  const platos = buscarActividad(p, idDe(p, 'Platos'));
  const cambiada = editarActividad(p, platos.id, { ...platos, nombre: 'Otro' }, ctx).estado;
  const restaurada = editarActividad(cambiada, platos.id, { ...platos, nombre: 'Platos' }, ctx).estado;
  assert.equal(esVigente(cambiada, buscarIntercambio(cambiada, id)), false, 'editar una vez');
  assert.equal(esVigente(restaurada, buscarIntercambio(restaurada, id)), false, 'editar dos veces (restaurar el valor)');
  assert.equal(proponer(restaurada, { proponenteId: P.id, ofrecidaId: platos.id, pedidaId: idDe(p, 'Basura') }, ctx).ok, true);
});
