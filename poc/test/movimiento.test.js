// test/movimiento.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo, espaciosActivos, banoDe } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { paso, claveCasilla } from '../src/posicion.js';
import { rutaMasCorta, casillasDe } from '../src/rutas.js';
import {
  MS_POR_PASO, PAUSA_MIN_MS, PAUSA_MAX_MS, TRAMO_MAX, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes,
  congelarHabitantes, ocupadasPorHabitantes, fijarObjetivos, mismoObjetivo,
} from '../src/movimiento.js';
import { crearCtx, azarReproducible } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const IDS = Array.from({ length: 12 }, (_, i) => `h-${i + 1}`);
const LIBRE = { tipo: 'libre' };
const movil = (id, x, y, extra = {}) => ({
  id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null, objetivo: LIBRE, fase: 'pasea', ruta: [], ...extra,
});
const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function hogarMasGrande() {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  return agregar(e, ctx, ...Array(6).fill('bano'));
}

function alcanzablesDesde(d, inicio) {
  const visto = new Set([claveCasilla(inicio.x, inicio.y)]);
  const cola = [inicio];
  while (cola.length) {
    const { x, y } = cola.shift();
    for (const [dx, dy] of VECINOS) {
      const k = claveCasilla(x + dx, y + dy);
      if (!visto.has(k) && esTransitable(d, x + dx, y + dy)) { visto.add(k); cola.push({ x: x + dx, y: y + dy }); }
    }
  }
  return visto;
}

// Invariantes de FR-5 y FR-6 de la 002 y de FR-7 de la 004: nadie en una casilla no transitable; el jugador y quienes pasean nunca
// comparten casilla (incluidos los orígenes de sus pasos); quien va en ruta o planifica puede pisar la casilla de otro habitante,
// pero nunca las del jugador; quien está fuera no ocupa ninguna.
function verificarInvariantes(d, moviles, jugador) {
  const vistas = new Set();
  const delJugador = new Set();
  const marcar = (x, y, quien, unica) => {
    assert.ok(esTransitable(d, x, y), `${quien} en una casilla no transitable (${x},${y})`);
    const k = claveCasilla(x, y);
    assert.ok(!delJugador.has(k), `${quien} en una casilla del jugador ${k}`);
    if (!unica) return;
    assert.ok(!vistas.has(k), `${quien} comparte la casilla ${k}`);
    vistas.add(k);
  };
  for (const c of [jugador, jugador.desde].filter(Boolean)) {
    assert.ok(esTransitable(d, c.x, c.y), `jugador en una casilla no transitable (${c.x},${c.y})`);
    vistas.add(claveCasilla(c.x, c.y));
    delJugador.add(claveCasilla(c.x, c.y));
  }
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    marcar(h.x, h.y, h.id, h.fase === 'pasea');
    if (h.desde) marcar(h.desde.x, h.desde.y, `${h.id} (origen)`, h.fase === 'pasea');
  }
}

// Simula `ms` milisegundos en cuadros de 50 ms con el jugador caminando al azar a 4 casillas por segundo.
function simular(d, moviles, jugadorInicial, ms, azar, alCuadro = () => {}) {
  const DT = 50;
  let jugador = { x: jugadorInicial.x, y: jugadorInicial.y, direccion: 'abajo', desde: null };
  let restanteJugador = 0;
  for (let t = 0; t < ms; t += DT) {
    if (restanteJugador > 0) {
      restanteJugador -= DT;
      if (restanteJugador <= 0) jugador = { ...jugador, desde: null };
    } else {
      const direccion = ['arriba', 'abajo', 'izquierda', 'derecha'][Math.floor(azar() * 4)];
      const r = paso(d, jugador, direccion, ocupadasPorHabitantes(moviles));
      if (r.movio) {
        jugador = { x: r.x, y: r.y, direccion, desde: { x: jugador.x, y: jugador.y } };
        restanteJugador = 250;
      }
    }
    moviles = avanzarHabitantes(moviles, d, jugador, DT, azar);
    verificarInvariantes(d, moviles, jugador);
    moviles = alCuadro(moviles, t) ?? moviles; // `alCuadro` puede devolver los móviles con objetivos nuevos
  }
  return moviles;
}

test('AC-6.1, AC-6.3: los habitantes se colocan en casillas libres distintas, transitables y alcanzables', () => {
  for (const estado of [crearHogarInicial(crearCtx()), hogarMasGrande()]) {
    const d = generarDistribucion(estado);
    const jugador = { ...d.aparicion };
    const alcanzables = alcanzablesDesde(d, d.aparicion);
    const moviles = colocarHabitantes(IDS, d, jugador, azarReproducible(7));
    assert.deepEqual(moviles.map((h) => h.id), IDS);
    verificarInvariantes(d, moviles, jugador);
    for (const h of moviles) {
      assert.ok(alcanzables.has(claveCasilla(h.x, h.y)), `${h.id} inalcanzable`);
      assert.deepEqual(h, movil(h.id, h.x, h.y));
    }
  }
});

test('AC-4.2: cada paso dura 500 ms (2 casillas por segundo)', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: d.aparicion.x, y: d.aparicion.y + 3 };
  const inicio = movil('h-1', d.aparicion.x - 2, d.aparicion.y, { tramo: 1, direccion: 'izquierda' });
  let [h] = avanzarHabitantes([inicio], d, jugador, 0, azarReproducible(1));
  assert.deepEqual([h.x, h.y, h.desde, h.progresoMs], [inicio.x - 1, inicio.y, { x: inicio.x, y: inicio.y }, MS_POR_PASO]);
  assert.equal(MS_POR_PASO, 500);
  [h] = avanzarHabitantes([h], d, jugador, 499, azarReproducible(1));
  assert.notEqual(h.desde, null);
  [h] = avanzarHabitantes([h], d, jugador, 1, azarReproducible(1));
  assert.equal(h.desde, null);
  assert.equal(h.progresoMs, 0);
});

test('AC-4.1: alterna pausas de 1 a 4 s con tramos de 1 a 6 casillas', () => {
  const d = generarDistribucion(hogarMasGrande());
  const azar = azarReproducible(11);
  const jugador = { ...d.aparicion };
  let moviles = colocarHabitantes(['h-1'], d, jugador, azar);
  const pausas = [];
  const tramos = [];
  let pasosSeguidos = 0;
  for (let t = 0; t < 120000; t += 50) {
    const antes = moviles[0];
    moviles = avanzarHabitantes(moviles, d, jugador, 50, azar);
    const h = moviles[0];
    if (h.x !== antes.x || h.y !== antes.y) pasosSeguidos++;
    if (antes.pausaMs === 0 && h.pausaMs > 0) {
      pausas.push(h.pausaMs);
      if (pasosSeguidos > 0) tramos.push(pasosSeguidos);
      pasosSeguidos = 0;
    }
  }
  assert.ok(pausas.length > 10, 'debería alternar pausas');
  assert.ok(pausas.every((p) => p >= PAUSA_MIN_MS && p <= PAUSA_MAX_MS), 'pausa fuera de rango');
  assert.ok(tramos.length > 10, 'debería caminar tramos');
  assert.ok(tramos.every((n) => n >= 1 && n <= TRAMO_MAX), 'tramo fuera de rango');
});

test('AC-4.3, AC-5.2: un habitante no entra en un mueble, en otro habitante ni en las casillas del jugador', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const { x, y } = d.aparicion;
  const casos = [
    ['jugador', { x: x - 1, y, desde: null }, 'izquierda'],
    ['origen del paso del jugador', { x: x + 1, y: y + 1, desde: { x: x + 1, y } }, 'derecha'],
    ['mueble', { x, y: y + 3, desde: null }, 'arriba'],
  ];
  for (const [motivo, jugador, direccion] of casos) {
    const [h] = avanzarHabitantes([movil('h-1', x, y, { tramo: 3, direccion })], d, jugador, 50, azarReproducible(3));
    assert.deepEqual([h.x, h.y], [x, y], motivo);
    assert.ok(h.pausaMs >= PAUSA_MIN_MS, motivo);
    assert.equal(h.tramo, 0, motivo);
  }
  const [h] = avanzarHabitantes(
    [movil('h-1', x, y, { tramo: 2, direccion: 'derecha' }), movil('h-2', x + 1, y, { pausaMs: 2000 })],
    d, { x, y: y + 3, desde: null }, 50, azarReproducible(3),
  );
  assert.deepEqual([h.x, h.y], [x, y], 'otro habitante');
});

test('AC-4.5: si dos habitantes van a la vez a la misma casilla, solo uno entra', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const { x, y } = d.aparicion;
  const a = movil('h-1', x - 1, y, { tramo: 1, direccion: 'derecha' });
  const b = movil('h-2', x + 1, y, { tramo: 1, direccion: 'izquierda' });
  const resultado = avanzarHabitantes([a, b], d, { x, y: y + 3, desde: null }, 50, azarReproducible(5));
  const enDestino = resultado.filter((h) => h.x === x && h.y === y);
  assert.equal(enDestino.length, 1);
  const otro = resultado.find((h) => h !== enDestino[0]);
  assert.ok(otro.pausaMs >= PAUSA_MIN_MS);
});

test('AC-5.4, AC-4.4, Reliability: en recorridos largos nadie comparte casilla y los habitantes cruzan puertas', () => {
  for (const [estado, semilla] of [[crearHogarInicial(crearCtx()), 21], [hogarMasGrande(), 22]]) {
    const d = generarDistribucion(estado);
    const azar = azarReproducible(semilla);
    const espaciosVisitados = new Map(IDS.map((id) => [id, new Set()]));
    simular(d, colocarHabitantes(IDS, d, d.aparicion, azar), d.aparicion, 300000, azar, (moviles) => {
      for (const h of moviles) espaciosVisitados.get(h.id).add(d.espacioEn[h.y][h.x]);
    });
    assert.ok([...espaciosVisitados.values()].some((s) => s.size >= 2), 'ningún habitante cruzó una puerta');
  }
});

test('AC-7.2: al entrar al modo edición cada habitante queda quieto en la casilla a la que se dirigía', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const { x, y } = d.aparicion;
  const [enPaso] = avanzarHabitantes([movil('h-1', x - 1, y, { tramo: 3, direccion: 'derecha' })], d, { x, y: y + 3 }, 0, azarReproducible(1));
  assert.notEqual(enPaso.desde, null);
  assert.deepEqual(congelarHabitantes([enPaso]), [movil('h-1', x, y)]);
});

test('AC-7.7, FR-7: tras un cambio en modo edición solo se reubica al habitante afectado', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  let d = generarDistribucion(e);
  const r = d.rects[d2.id];
  const enDormitorio = movil('h-1', r.x + 2, r.y + 4); // dentro de "Dormitorio 2", que se va a eliminar
  const enSala = movil('h-2', d.aparicion.x - 2, d.aparicion.y); // la sala no cambia de lugar
  const jugador = { ...d.aparicion };
  assert.ok(esTransitable(d, enDormitorio.x, enDormitorio.y));
  e = eliminarEspacio(e, d2.id, ctx);
  d = generarDistribucion(e);
  assert.equal(esTransitable(d, enDormitorio.x, enDormitorio.y), false);
  const despues = sincronizarHabitantes([enDormitorio, enSala], ['h-1', 'h-2'], d, jugador, azarReproducible(9));
  assert.deepEqual(despues.map((h) => h.id), ['h-1', 'h-2']);
  assert.deepEqual(despues[1], enSala);
  assert.notDeepEqual([despues[0].x, despues[0].y], [enDormitorio.x, enDormitorio.y]);
  verificarInvariantes(d, despues, jugador);
});

test('FR-7: al dar de alta o de baja se agregan habitantes en casillas libres y se quitan los eliminados', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { ...d.aparicion };
  const azar = azarReproducible(4);
  const antes = colocarHabitantes(['h-1', 'h-2'], d, jugador, azar);
  const despues = sincronizarHabitantes(antes, ['h-2', 'h-3'], d, jugador, azar);
  assert.deepEqual(despues.map((h) => h.id), ['h-2', 'h-3']);
  assert.deepEqual(despues[0], antes[1]);
  verificarInvariantes(d, despues, jugador);
});

test('el movimiento es puro y reproducible con la misma semilla', () => {
  const d = generarDistribucion(hogarMasGrande());
  const inicial = colocarHabitantes(IDS, d, d.aparicion, azarReproducible(3));
  const copia = structuredClone(inicial);
  const a = simular(d, inicial, d.aparicion, 20000, azarReproducible(8));
  const b = simular(d, inicial, d.aparicion, 20000, azarReproducible(8));
  assert.deepEqual(a, b);
  assert.deepEqual(inicial, copia);
});

// --- Seguimiento de la revisión: ritmo de pasos (D4) y vacíos de cobertura (G1-G4) ---

const SEMILLAS = Array.from({ length: 300 }, (_, i) => i + 1);

test('AC-4.2: un tramo de 6 pasos tarda 3000 ms a 60 y a 30 cuadros por segundo, sin perder tiempo entre pasos', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: 1, y: 8, desde: null }; // lejos del pasillo por el que camina
  for (const [dt, tolerancia] of [[1000 / 60, 17], [1000 / 30, 34]]) {
    const azar = azarReproducible(1);
    let [h] = avanzarHabitantes([movil('h-1', 9, 3, { tramo: 6, direccion: 'derecha' })], d, jugador, 0, azar); // inicia el 1.er paso
    let transcurrido = 0;
    for (let cuadros = 0; (h.desde !== null || h.tramo !== 0) && cuadros < 1000; cuadros++) {
      transcurrido += dt;
      [h] = avanzarHabitantes([h], d, jugador, dt, azar);
      verificarInvariantes(d, [h], jugador);
    }
    assert.deepEqual([h.x, h.y, h.desde, h.tramo], [15, 3, null, 0], `${dt} ms por cuadro: no completó el tramo`);
    assert.ok(Math.abs(transcurrido - 6 * MS_POR_PASO) <= tolerancia, `${dt} ms por cuadro: el tramo tardó ${transcurrido} ms`);
  }
});

test('AC-6.1, AC-6.2: al colocarlos nunca ocupan la casilla del jugador ni la de la que viene', () => {
  for (const estado of [crearHogarInicial(crearCtx()), hogarMasGrande()]) {
    const d = generarDistribucion(estado);
    const { x, y } = d.aparicion;
    const jugador = { x, y, direccion: 'derecha', desde: { x: x - 1, y } };
    for (const semilla of SEMILLAS) {
      const moviles = colocarHabitantes(IDS, d, jugador, azarReproducible(semilla));
      verificarInvariantes(d, moviles, jugador); // incluye las dos casillas del jugador y que no se repitan
      assert.equal(new Set(moviles.map((h) => claveCasilla(h.x, h.y))).size, IDS.length);
    }
  }
});

test('AC-7.7, FR-7: el habitante que quedó en la casilla del jugador (o en su origen) se reubica y los demás se quedan', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const otro = movil('h-2', d.aparicion.x - 2, d.aparicion.y);
  for (const [motivo, jugador, encima] of [
    ['casilla del jugador', { x: 13, y: 3, desde: null }, { x: 13, y: 3 }],
    ['origen del paso del jugador', { x: 13, y: 3, desde: { x: 14, y: 3 } }, { x: 14, y: 3 }],
  ]) {
    for (const semilla of SEMILLAS.slice(0, 50)) {
      const despues = sincronizarHabitantes([movil('h-1', encima.x, encima.y), otro], ['h-1', 'h-2'], d, jugador, azarReproducible(semilla));
      assert.notDeepEqual([despues[0].x, despues[0].y], [encima.x, encima.y], motivo);
      assert.deepEqual(despues[1], otro, motivo);
      verificarInvariantes(d, despues, jugador);
    }
  }
});

test('AC-7.7, FR-7: lo reubicado o nuevo nunca cae en la casilla de un habitante que se conserva ni en la del jugador', () => {
  const d = generarDistribucion(hogarMasGrande());
  const lejos = { x: d.aparicion.x, y: d.aparicion.y, desde: null };
  for (const semilla of SEMILLAS) {
    const azar = azarReproducible(semilla);
    const antes = colocarHabitantes(IDS.slice(0, 6), d, lejos, azar);
    // el jugador queda sobre la casilla de h-1 y sobre el origen de h-2 (que se deben reubicar)
    const jugador = { x: antes[0].x, y: antes[0].y, desde: { x: antes[1].x, y: antes[1].y } };
    const despues = sincronizarHabitantes(antes, IDS, d, jugador, azar);
    assert.deepEqual(despues.map((h) => h.id), IDS);
    assert.deepEqual(despues.slice(2, 6), antes.slice(2, 6), 'los que están bien no se mueven');
    verificarInvariantes(d, despues, jugador);
  }
});

test('AC-1.2, AC-2.2: un habitante nuevo se coloca solo en una casilla libre (sin habitantes ni jugador)', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: d.aparicion.x, y: d.aparicion.y, desde: { x: d.aparicion.x, y: d.aparicion.y + 1 } };
  for (const semilla of SEMILLAS) {
    const azar = azarReproducible(semilla);
    const antes = colocarHabitantes(IDS.slice(0, 11), d, jugador, azar);
    const despues = sincronizarHabitantes(antes, [...IDS.slice(0, 11), 'nuevo'], d, jugador, azar);
    const nuevo = despues.find((h) => h.id === 'nuevo');
    for (const h of antes) assert.notDeepEqual([nuevo.x, nuevo.y], [h.x, h.y], `cae sobre ${h.id}`);
    assert.deepEqual(despues.slice(0, 11), antes);
    verificarInvariantes(d, despues, jugador);
  }
});

test('AC-4.1: las pausas y los tramos varían, y mientras dura la pausa el habitante no se mueve y la pausa baja con el tiempo', () => {
  const d = generarDistribucion(hogarMasGrande());
  const azar = azarReproducible(31);
  const jugador = { x: d.aparicion.x, y: d.aparicion.y, desde: null };
  const DT = 50;
  let moviles = colocarHabitantes(IDS.slice(0, 5), d, jugador, azar);
  const pausas = [];
  const tramos = [];
  const pasosSeguidos = moviles.map(() => 0);
  let enPausaVista = 0;
  for (let t = 0; t < 300000; t += DT) {
    const antes = moviles;
    moviles = avanzarHabitantes(moviles, d, jugador, DT, azar);
    verificarInvariantes(d, moviles, jugador);
    moviles.forEach((h, i) => {
      const a = antes[i];
      if (a.progresoMs === 0 && a.pausaMs > 0) { // en pausa: quieto y la pausa baja exactamente lo transcurrido
        enPausaVista++;
        assert.deepEqual([h.x, h.y, h.desde, h.progresoMs], [a.x, a.y, a.desde, 0], `${h.id} se movió durante la pausa`);
        assert.equal(h.pausaMs, Math.max(0, a.pausaMs - DT), `${h.id}: la pausa no bajó ${DT} ms`);
      }
      if (h.x !== a.x || h.y !== a.y) pasosSeguidos[i]++;
      if (a.pausaMs === 0 && h.pausaMs > 0) {
        pausas.push(h.pausaMs);
        if (pasosSeguidos[i] > 0) tramos.push(pasosSeguidos[i]);
        pasosSeguidos[i] = 0;
      }
    });
  }
  assert.ok(enPausaVista > 100, 'debería observar habitantes en pausa');
  assert.ok(new Set(pausas).size > 5, 'las pausas no deberían ser constantes');
  assert.ok(new Set(tramos).size >= 4, 'los tramos no deberían ser constantes');
});

test('AC-4.1: un tramo nuevo solo elige entre las direcciones libres', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: 1, y: 8, desde: null };
  // (12, 3): arriba y abajo son pared y a la izquierda está otro habitante; solo queda libre la derecha
  for (const semilla of SEMILLAS.slice(0, 200)) {
    const [h] = avanzarHabitantes(
      [movil('h-1', 12, 3), movil('h-2', 11, 3, { pausaMs: 2000 })], d, jugador, 0, azarReproducible(semilla),
    );
    assert.deepEqual([h.x, h.y, h.desde], [13, 3, { x: 12, y: 3 }], `semilla ${semilla}`);
  }
});

test('AC-4.1: entre la llegada del último paso de un tramo y el inicio del siguiente transcurre exactamente la pausa sorteada', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: d.aparicion.x, y: d.aparicion.y + 3, desde: null };
  const DT = 50;
  const medidas = [];
  for (let semilla = 1; semilla <= 60; semilla++) {
    const azar = azarReproducible(semilla);
    let h = movil('h-1', d.aparicion.x - 2, d.aparicion.y, { tramo: 1, direccion: 'izquierda' });
    let t = 0;
    let pausa = null; // pausa sorteada al iniciar el último paso
    let llegada = null;
    let siguiente = null;
    let posicion = null; // casilla del habitante entre la llegada y el inicio del siguiente tramo
    for (; t < 10000 && siguiente === null; t += DT) {
      const antes = h;
      [h] = avanzarHabitantes([h], d, jugador, DT, azar);
      verificarInvariantes(d, [h], jugador);
      const movio = h.x !== antes.x || h.y !== antes.y;
      if (pausa === null) {
        if (movio) { // inicia el último paso del tramo (tramo: 1): se sortea la pausa
          assert.equal(h.tramo, 0, `semilla ${semilla}: el tramo debía terminar con este paso`);
          pausa = h.pausaMs;
          assert.ok(pausa >= PAUSA_MIN_MS && pausa <= PAUSA_MAX_MS, `semilla ${semilla}: pausa ${pausa} fuera de rango`);
          t = 0; // el reloj parte de este cuadro
        }
        continue;
      }
      if (llegada === null) {
        if (antes.desde !== null && h.desde === null) { llegada = t; posicion = [h.x, h.y]; }
        continue;
      }
      if (movio) siguiente = t;
      else assert.deepEqual([h.x, h.y], posicion, `semilla ${semilla}: se movió durante la pausa`);
    }
    assert.notEqual(pausa, null, `semilla ${semilla}: nunca inició el paso`);
    assert.notEqual(siguiente, null, `semilla ${semilla}: nunca empezó el siguiente tramo`);
    assert.ok(Math.abs(llegada - MS_POR_PASO) <= DT, `semilla ${semilla}: llegó a los ${llegada} ms, no ~${MS_POR_PASO}`);
    const medida = siguiente - llegada;
    assert.ok(Math.abs(medida - pausa) <= 2 * DT, `semilla ${semilla}: pausa sorteada ${pausa} ms, transcurrieron ${medida} ms`);
    medidas.push(medida);
  }
  assert.ok(Math.max(...medidas) - Math.min(...medidas) > 1500, 'las pausas medidas deberían variar más de 1500 ms');
});

// ---------- Feature 004: movimiento hacia un objetivo ----------

// Avanza en cuadros de 50 ms, comprobando las invariantes, hasta que `listo(moviles)` o hasta `limiteMs`; devuelve los móviles y
// los milisegundos transcurridos.
function hasta(d, moviles, jugador, listo, limiteMs = 120000, azar = azarReproducible(1)) {
  let t = 0;
  while (!listo(moviles) && t < limiteMs) {
    moviles = avanzarHabitantes(moviles, d, jugador, 50, azar);
    t += 50;
    verificarInvariantes(d, moviles, jugador);
  }
  return { moviles, t };
}

const enCocina1 = { x: 1, y: 2, desde: null }; // casilla de la primera cocina del hogar más grande, lejos de las rutas que se miden

test('AC-6.1 (004), FR-6: al colocarlos, cada familiar queda en su espacio, fuera del mapa o libre, sin compartir casilla', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const jugador = { ...d.aparicion, desde: null };
  const cocina = espaciosDeTipo(estado, 'cocina')[0].id;
  const oficina = espaciosDeTipo(estado, 'oficina')[1].id;
  const objetivos = new Map([
    ['h-1', { tipo: 'espacio', espacioId: cocina }], ['h-2', { tipo: 'espacio', espacioId: cocina }],
    ['h-3', { tipo: 'espacio', espacioId: oficina }], ['h-4', { tipo: 'fuera' }], ['h-5', { tipo: 'fuera' }],
  ]);
  for (const semilla of SEMILLAS.slice(0, 100)) {
    const moviles = colocarHabitantes(IDS, d, jugador, azarReproducible(semilla), objetivos);
    verificarInvariantes(d, moviles, jugador);
    const por = new Map(moviles.map((h) => [h.id, h]));
    for (const id of ['h-1', 'h-2']) assert.deepEqual([por.get(id).fase, d.espacioEn[por.get(id).y][por.get(id).x]], ['pasea', cocina]);
    assert.equal(d.espacioEn[por.get('h-3').y][por.get('h-3').x], oficina);
    for (const id of ['h-4', 'h-5']) assert.equal(por.get(id).fase, 'fuera');
    assert.equal(ocupadasPorHabitantes(moviles).size, IDS.length - 2);
    assert.ok(moviles.slice(5).every((h) => h.fase === 'pasea' && mismoObjetivo(h.objetivo, LIBRE)));
  }
});

test('AC-3.10, AC-6.3: si su espacio está lleno, el familiar espera en la casilla libre más cercana y entra cuando se libera una', () => {
  const ctx = crearCtx();
  const estado = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx); // baño interno de 4 casillas en "Dormitorio 1"
  const d = generarDistribucion(estado);
  const bano = banoDe(estado, espaciosDeTipo(estado, 'dormitorio')[0].id).id;
  const jugador = { ...d.aparicion, desde: null };
  const ids = IDS.slice(0, 6);
  const objetivos = new Map(ids.map((id) => [id, { tipo: 'espacio', espacioId: bano }]));
  const colocados = colocarHabitantes(ids, d, jugador, azarReproducible(3), objetivos);
  const enBano = (h) => d.espacioEn[h.y][h.x] === bano;
  assert.equal(colocados.filter(enBano).length, 4);
  const esperan = colocados.filter((h) => !enBano(h));
  assert.deepEqual(esperan.map((h) => h.fase), ['planifica', 'planifica']);
  const otraVez = colocarHabitantes(ids, d, jugador, azarReproducible(4), objetivos).filter((h) => !enBano(h));
  assert.deepEqual(otraVez.map((h) => [h.x, h.y]), esperan.map((h) => [h.x, h.y])); // las casillas de espera no dependen del azar
  verificarInvariantes(d, colocados, jugador);
  let { moviles } = hasta(d, colocados, jugador, () => false, 5000);
  assert.equal(moviles.filter(enBano).length, 4); // mientras el baño siga lleno, nadie más entra
  assert.ok(moviles.filter((h) => !enBano(h)).every((h) => h.fase === 'planifica'));
  // quien está junto a la única salida del baño pasa a estar libre y sale; entonces entra uno de los que esperaban
  const [salida] = casillasDe(d, bano);
  const sale = moviles.find((h) => h.x === salida.x && h.y === salida.y).id;
  moviles = fijarObjetivos(moviles, new Map([...objetivos, [sale, LIBRE]]));
  ({ moviles } = hasta(d, moviles, jugador, (ms) => ms.filter((h) => h.id !== sale && h.fase === 'pasea' && enBano(h)).length === 4, 60000));
  assert.equal(moviles.filter((h) => h.id !== sale && enBano(h)).length, 4);
});

test('AC-3.1, AC-3.2, AC-3.3, AC-3.8, AC-3.12: con un bloque en un espacio, va por el camino más corto, llega a tiempo y no sale de él', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  for (const espacio of espaciosActivos(estado)) {
    const inicio = movil('h-1', d.aparicion.x - 2, d.aparicion.y); // en la sala
    const objetivo = new Map([['h-1', { tipo: 'espacio', espacioId: espacio.id }]]);
    const largo = rutaMasCorta(d, inicio, (x, y) => d.espacioEn[y][x] === espacio.id).length;
    const llego = ([h]) => h.fase === 'pasea' && d.espacioEn[h.y][h.x] === espacio.id;
    let { moviles, t } = hasta(d, fijarObjetivos([inicio], objetivo), enCocina1, llego);
    assert.ok(llego(moviles), `no llegó a ${espacio.tipo}`);
    assert.ok(t <= (largo + 1) * MS_POR_PASO, `${espacio.tipo}: tardó ${t} ms para ${largo} casillas`);
    ({ moviles } = hasta(d, moviles, enCocina1, ([h]) => d.espacioEn[h.y][h.x] !== espacio.id, 60000, azarReproducible(5)));
    assert.equal(d.espacioEn[moviles[0].y][moviles[0].x], espacio.id, `${espacio.tipo}: salió de su espacio`);
  }
});

test('AC-3.7: al cambiar el objetivo cancela la pausa o el tramo, termina el paso empezado y sigue su ruta', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const cocina = espaciosDeTipo(estado, 'cocina')[0].id;
  const objetivo = new Map([['h-1', { tipo: 'espacio', espacioId: cocina }]]);
  const x = d.aparicion.x - 2;
  const { y } = d.aparicion;
  const [enPausa] = fijarObjetivos([movil('h-1', x, y, { pausaMs: 3000 })], objetivo);
  assert.deepEqual([enPausa.pausaMs, enPausa.fase], [0, 'planifica']);
  const [conTramo] = avanzarHabitantes([movil('h-1', x, y, { tramo: 5, direccion: 'derecha' })], d, enCocina1, 0, azarReproducible(1));
  assert.deepEqual([conTramo.x, conTramo.desde, conTramo.progresoMs], [x + 1, { x, y }, MS_POR_PASO]); // empezó un paso
  const [cambiado] = fijarObjetivos([conTramo], objetivo);
  assert.deepEqual([cambiado.tramo, cambiado.direccion, cambiado.x, cambiado.progresoMs], [0, null, x + 1, MS_POR_PASO]);
  const largo = rutaMasCorta(d, cambiado, (cx, cy) => d.espacioEn[cy][cx] === cocina).length;
  const { moviles, t } = hasta(d, [cambiado], enCocina1, ([h]) => h.fase === 'pasea' && d.espacioEn[h.y][h.x] === cocina);
  assert.equal(moviles[0].fase, 'pasea');
  assert.ok(t <= (largo + 1) * MS_POR_PASO, `tardó ${t} ms para ${largo} casillas más el paso empezado`);
});

test('AC-4.1, AC-4.2, AC-4.8: con un bloque fuera de casa camina hasta la entrada, desaparece y deja de ocupar casillas', () => {
  const d = generarDistribucion(hogarMasGrande());
  const fuera = new Map([['h-1', { tipo: 'fuera' }]]);
  const inicio = movil('h-1', d.aparicion.x - 2, d.aparicion.y);
  const quieto = movil('h-2', d.aparicion.x + 2, d.aparicion.y, { pausaMs: 999999 });
  const largo = rutaMasCorta(d, inicio, (x, y) => x === d.entrada.x && y === d.entrada.y).length;
  const { moviles, t } = hasta(d, fijarObjetivos([inicio, quieto], fuera), enCocina1, ([h]) => h.fase === 'fuera');
  assert.equal(moviles[0].fase, 'fuera');
  assert.ok(t <= (largo + 1) * MS_POR_PASO, `tardó ${t} ms para ${largo} casillas`);
  assert.deepEqual([...ocupadasPorHabitantes(moviles)], [claveCasilla(quieto.x, quieto.y)]);
  assert.equal(paso(d, { x: d.entrada.x, y: d.entrada.y - 1 }, 'abajo', ocupadasPorHabitantes(moviles)).movio, true);
  const [yaEnEntrada] = avanzarHabitantes(
    fijarObjetivos([movil('h-3', d.entrada.x, d.entrada.y)], new Map([['h-3', { tipo: 'fuera' }]])), d, enCocina1, 50, azarReproducible(1),
  );
  assert.deepEqual([yaEnEntrada.fase, yaEnEntrada.x, yaEnEntrada.y, yaEnEntrada.desde], ['fuera', d.entrada.x, d.entrada.y, null]);
});

test('AC-4.3, AC-4.4, AC-4.5: al terminar la salida reaparece en la entrada y va a su siguiente lugar; si la salida sigue, no reaparece', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const oficina = espaciosDeTipo(estado, 'oficina')[0].id;
  const fuera = new Map([['h-1', { tipo: 'fuera' }], ['h-2', { tipo: 'fuera' }]]);
  let moviles = fijarObjetivos(colocarHabitantes(['h-1', 'h-2'], d, enCocina1, azarReproducible(2), fuera), fuera); // otro bloque fuera seguido
  ({ moviles } = hasta(d, moviles, enCocina1, () => false, 2000));
  assert.deepEqual(moviles.map((h) => h.fase), ['fuera', 'fuera']);
  moviles = fijarObjetivos(moviles, new Map([['h-1', { tipo: 'espacio', espacioId: oficina }]])); // h-2 queda sin bloque
  moviles = avanzarHabitantes(moviles, d, enCocina1, 50, azarReproducible(1));
  assert.deepEqual([moviles[0].fase, moviles[0].x, moviles[0].y], ['planifica', d.entrada.x, d.entrada.y]);
  assert.equal(moviles[1].fase, 'fuera'); // la entrada está ocupada: espera fuera del mapa (AC-4.6)
  ({ moviles } = hasta(d, moviles, enCocina1, ([a, b]) => a.fase === 'pasea' && d.espacioEn[a.y][a.x] === oficina && b.fase === 'pasea', 60000));
  assert.equal(d.espacioEn[moviles[0].y][moviles[0].x], oficina);
  assert.equal(moviles[1].fase, 'pasea');
});

test('AC-4.6, AC-6.8: si el jugador está en la entrada, quien vuelve espera fuera del mapa y aparece cuando se libera', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const enEntrada = { x: d.entrada.x, y: d.entrada.y, desde: null };
  let moviles = fijarObjetivos([movil('h-1', d.entrada.x, d.entrada.y, { fase: 'fuera', objetivo: { tipo: 'fuera' } })], new Map());
  assert.equal(moviles[0].fase, 'fuera');
  ({ moviles } = hasta(d, moviles, enEntrada, () => false, 3000));
  assert.equal(moviles[0].fase, 'fuera');
  moviles = avanzarHabitantes(moviles, d, { x: d.entrada.x, y: d.entrada.y - 1, desde: null }, 50, azarReproducible(1));
  assert.deepEqual([moviles[0].fase, moviles[0].x, moviles[0].y], ['planifica', d.entrada.x, d.entrada.y]);
});

test('AC-8.1: dos familiares en ruta que se cruzan en un pasillo de una casilla llegan ambos a tiempo, sin bloquearse', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const jugador = { x: 27, y: 2, desde: null }; // en un dormitorio, lejos del pasillo izquierdo
  const cocina1 = espaciosDeTipo(estado, 'cocina')[0].id;
  const mascota2 = espaciosDeTipo(estado, 'mascota')[1].id;
  const [ca] = casillasDe(d, cocina1);
  const [cb] = casillasDe(d, mascota2);
  const objetivos = new Map([['h-1', { tipo: 'espacio', espacioId: mascota2 }], ['h-2', { tipo: 'espacio', espacioId: cocina1 }]]);
  const largos = [
    rutaMasCorta(d, ca, (x, y) => d.espacioEn[y][x] === mascota2).length,
    rutaMasCorta(d, cb, (x, y) => d.espacioEn[y][x] === cocina1).length,
  ];
  let moviles = fijarObjetivos([movil('h-1', ca.x, ca.y), movil('h-2', cb.x, cb.y)], objetivos);
  const llegadas = [null, null];
  let ambosEnPasillo = false;
  const azar = azarReproducible(1);
  for (let t = 50; t <= 60000 && llegadas.includes(null); t += 50) {
    moviles = avanzarHabitantes(moviles, d, jugador, 50, azar);
    verificarInvariantes(d, moviles, jugador);
    if (moviles.every((h) => d.espacioEn[h.y][h.x] === 'pasillo:izq')) ambosEnPasillo = true;
    moviles.forEach((h, i) => { if (llegadas[i] === null && h.fase === 'pasea') llegadas[i] = t; });
  }
  assert.ok(ambosEnPasillo, 'deberían cruzarse en el pasillo');
  llegadas.forEach((t, i) => assert.ok(t !== null && t <= (largos[i] + 1) * MS_POR_PASO, `h-${i + 1}: ${t} ms para ${largos[i]} casillas`));
});

test('AC-8.2: quien va en ruta pasa por la casilla de quien pasea; quien pasea no entra en la de quien va en ruta', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: 1, y: 8, desde: null };
  // fila 3 de la sala: (12,3) tiene un sofá arriba y una mesa abajo
  const enRuta = movil('h-1', 11, 3, { fase: 'ruta', ruta: [{ x: 12, y: 3 }, { x: 13, y: 3 }, { x: 14, y: 3 }] });
  const paseando = movil('h-2', 12, 3, { pausaMs: 5000 });
  const [r, w] = avanzarHabitantes([enRuta, paseando], d, jugador, 0, azarReproducible(1));
  assert.deepEqual([r.x, r.y, r.desde], [12, 3, { x: 11, y: 3 }]);
  assert.deepEqual([w.x, w.y], [12, 3]);
  verificarInvariantes(d, [r, w], jugador);
  const [, w2] = avanzarHabitantes([
    movil('h-1', 12, 3, { fase: 'ruta', ruta: [{ x: 11, y: 3 }] }),
    movil('h-2', 13, 3, { tramo: 1, direccion: 'izquierda' }),
  ], d, jugador, 0, azarReproducible(1));
  assert.deepEqual([w2.x, w2.y, w2.tramo], [13, 3, 0]);
  assert.ok(w2.pausaMs >= PAUSA_MIN_MS);
});

test('AC-8.3, AC-8.4: quien va en ruta espera si el jugador le cierra el paso y sigue cuando se aparta; el jugador no lo atraviesa', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const enRuta = movil('h-1', 11, 3, { fase: 'ruta', ruta: [{ x: 12, y: 3 }, { x: 13, y: 3 }] });
  for (const jugador of [{ x: 12, y: 3, desde: null }, { x: 13, y: 3, desde: { x: 12, y: 3 } }]) {
    let [h] = avanzarHabitantes([enRuta], d, jugador, 50, azarReproducible(1));
    assert.deepEqual([h.x, h.y, h.fase, h.ruta.length], [11, 3, 'ruta', 2]);
    [h] = avanzarHabitantes([h], d, jugador, 1000, azarReproducible(1));
    assert.deepEqual([h.x, h.y], [11, 3]);
  }
  const [h] = avanzarHabitantes([enRuta], d, { x: 1, y: 8, desde: null }, 50, azarReproducible(1));
  assert.deepEqual([h.x, h.y], [12, 3]);
  assert.equal(paso(d, { x: 13, y: 3 }, 'izquierda', ocupadasPorHabitantes([h])).movio, false);
});

test('AC-3.9: si llega a una casilla de su espacio ocupada por otro, sigue hasta una libre del espacio', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0].id;
  const llega = movil('h-1', 8, 2, { objetivo: { tipo: 'espacio', espacioId: cocina }, fase: 'ruta', ruta: [{ x: 7, y: 2 }, { x: 6, y: 2 }] });
  const quieto = movil('h-2', 6, 2, { pausaMs: 999999 });
  const { moviles } = hasta(d, [llega, quieto], { x: 13, y: 8, desde: null }, ([a]) => a.fase === 'pasea', 5000);
  const [a, b] = moviles;
  assert.equal(a.fase, 'pasea');
  assert.equal(d.espacioEn[a.y][a.x], cocina);
  assert.notDeepEqual([a.x, a.y], [b.x, b.y]);
  assert.deepEqual([b.x, b.y], [6, 2]);
});

test('AC-8.5, Reliability: con objetivos que cambian, quien pasea nunca comparte casilla, nadie pisa al jugador ni una pared, y casi todos cumplen su rutina', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const azar = azarReproducible(41);
  const sorteo = azarReproducible(42);
  const espacios = espaciosActivos(estado).map((x) => x.id);
  const familiaresIds = IDS.slice(0, 8); // IDS.slice(8) hacen de mascotas: siempre libres
  const sortear = () => new Map(familiaresIds.map((id) => {
    const n = sorteo();
    if (n < 0.2) return [id, LIBRE];
    if (n < 0.4) return [id, { tipo: 'fuera' }];
    return [id, { tipo: 'espacio', espacioId: espacios[Math.floor(sorteo() * espacios.length)] }];
  }));
  const cumple = (h, objetivo) => (objetivo.tipo === 'fuera' ? h.fase === 'fuera'
    : h.fase === 'pasea' && (objetivo.tipo === 'libre' || d.espacioEn[h.y][h.x] === objetivo.espacioId));
  let objetivos = sortear();
  let revisados = 0;
  let cumplidos = 0;
  const fases = new Set();
  simular(d, colocarHabitantes(IDS, d, d.aparicion, azar, objetivos), d.aparicion, 400000, azar, (moviles, t) => {
    for (const h of moviles) fases.add(h.fase);
    if (t === 0 || t % 40000 !== 0) return undefined;
    for (const h of moviles.slice(0, 8)) {
      revisados++;
      if (cumple(h, objetivos.get(h.id))) cumplidos++;
    }
    objetivos = sortear();
    return fijarObjetivos(moviles, objetivos);
  });
  for (const fase of ['fuera', 'pasea', 'ruta']) assert.ok(fases.has(fase), `nunca hubo nadie en fase ${fase}`);
  assert.ok(cumplidos / revisados >= 0.9, `${cumplidos} de ${revisados} cumplían su rutina`);
});

test('AC-6.4, AC-6.6, AC-6.7: en modo edición quien está fuera sigue fuera y no se reubica; los demás quedan quietos con su objetivo', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { ...d.aparicion, desde: null };
  const cocina = { tipo: 'espacio', espacioId: 'cocina-x' };
  const fuera = movil('h-1', d.entrada.x, d.entrada.y, { fase: 'fuera', objetivo: { tipo: 'fuera' } });
  const enRuta = movil('h-2', 11, 3, { objetivo: cocina, fase: 'ruta', ruta: [{ x: 10, y: 3 }], desde: { x: 12, y: 3 }, progresoMs: 200 });
  assert.deepEqual(congelarHabitantes([fuera, enRuta]), [fuera, movil('h-2', 11, 3, { objetivo: cocina, fase: 'planifica' })]);
  const despues = sincronizarHabitantes([fuera, movil('h-3', jugador.x, jugador.y)], ['h-1', 'h-3', 'h-4'], d, jugador, azarReproducible(2));
  assert.deepEqual(despues.map((h) => h.id), ['h-1', 'h-3', 'h-4']);
  assert.equal(despues[0], fuera);
  assert.notDeepEqual([despues[1].x, despues[1].y], [jugador.x, jugador.y]);
  assert.deepEqual([despues[2].fase, despues[2].objetivo], ['pasea', LIBRE]); // un familiar nuevo aún no tiene rutina
  verificarInvariantes(d, despues, jugador);
});

test('AC-3.4, AC-3.6: fijarObjetivos solo cambia a quien tiene un objetivo nuevo; mascotas y familiares sin cambios siguen igual', () => {
  const mascota = movil('h-1', 10, 3, { pausaMs: 1500, tramo: 2, direccion: 'derecha' });
  const enSuEspacio = movil('h-2', 12, 3, { objetivo: { tipo: 'espacio', espacioId: 'x' } });
  const despues = fijarObjetivos([mascota, enSuEspacio], new Map([['h-2', { tipo: 'espacio', espacioId: 'x' }]]));
  assert.equal(despues[0], mascota);
  assert.equal(despues[1], enSuEspacio);
  assert.equal(mismoObjetivo({ tipo: 'espacio', espacioId: 'x' }, { tipo: 'espacio', espacioId: 'y' }), false);
  assert.equal(mismoObjetivo({ tipo: 'fuera' }, { tipo: 'fuera' }), true);
  const [libre] = fijarObjetivos([enSuEspacio], new Map());
  assert.deepEqual([libre.objetivo, libre.fase], [LIBRE, 'planifica']);
});
