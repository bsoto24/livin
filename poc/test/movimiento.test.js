// test/movimiento.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { paso, claveCasilla } from '../src/posicion.js';
import {
  MS_POR_PASO, PAUSA_MIN_MS, PAUSA_MAX_MS, TRAMO_MAX, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes,
  congelarHabitantes, ocupadasPorHabitantes,
} from '../src/movimiento.js';
import { crearCtx, azarReproducible } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const IDS = Array.from({ length: 12 }, (_, i) => `h-${i + 1}`);
const movil = (id, x, y, extra = {}) => ({ id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null, ...extra });
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

// Invariantes de FR-5 y FR-6: nadie fuera de una casilla transitable y nadie compartiendo casilla (incluidos los orígenes).
function verificarInvariantes(d, moviles, jugador) {
  const vistas = new Set();
  const marcar = (x, y, quien) => {
    assert.ok(esTransitable(d, x, y), `${quien} en una casilla no transitable (${x},${y})`);
    const k = claveCasilla(x, y);
    assert.ok(!vistas.has(k), `${quien} comparte la casilla ${k}`);
    vistas.add(k);
  };
  marcar(jugador.x, jugador.y, 'jugador');
  if (jugador.desde) marcar(jugador.desde.x, jugador.desde.y, 'jugador (origen)');
  for (const h of moviles) {
    marcar(h.x, h.y, h.id);
    if (h.desde) marcar(h.desde.x, h.desde.y, `${h.id} (origen)`);
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
    alCuadro(moviles);
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
