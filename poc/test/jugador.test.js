// test/jugador.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, eliminarHabitante, espaciosDeTipo, familiares, mascotas, miembrosActivos, propietarioDe,
  personasQueJuegan, puedeJugar, jugadorInicial,
} from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { claveCasilla } from '../src/posicion.js';
import { colocarHabitantes, avanzarHabitantes, cambiarJugador } from '../src/movimiento.js';
import { crearCtx, azarReproducible } from './ayuda.js';

function hogar() {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', aspecto: 'adulta' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', aspecto: 'adulto' }, ctx).estado;
  e = agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
  return { ctx, e };
}

const idsSin = (e, ...sin) => miembrosActivos(e).map((m) => m.id).filter((id) => !sin.includes(id));

// Partida: juega el propietario, quieto en la casilla de aparición; los demás miembros son móviles.
function partida(semilla = 3) {
  const { ctx, e } = hogar();
  const d = generarDistribucion(e);
  const propietario = propietarioDe(e);
  const jugador = { id: propietario.id, x: d.aparicion.x, y: d.aparicion.y, direccion: 'abajo' };
  const azar = azarReproducible(semilla);
  const moviles = colocarHabitantes(idsSin(e, propietario.id), d, { ...jugador, desde: null }, azar);
  return { ctx, e, d, azar, propietario, jugador, moviles };
}

// Nadie en una casilla no transitable ni en la de quien juega; quienes pasean nunca comparten casilla entre sí.
function verificar(d, moviles, jugador) {
  assert.ok(esTransitable(d, jugador.x, jugador.y), 'el jugador en una casilla no transitable');
  const vistas = new Set();
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    assert.ok(esTransitable(d, h.x, h.y), `${h.id} en una casilla no transitable (${h.x},${h.y})`);
    const k = claveCasilla(h.x, h.y);
    assert.notEqual(k, claveCasilla(jugador.x, jugador.y), `${h.id} comparte la casilla del jugador`);
    if (h.fase === 'pasea') {
      assert.ok(!vistas.has(k), `${h.id} comparte la casilla ${k} con otro que pasea`);
      vistas.add(k);
    }
  }
}

test('FR-1, AC-1.9: pueden jugar el propietario y los familiares, no las mascotas, y el propietario va primero', () => {
  const { e } = hogar();
  assert.deepEqual(personasQueJuegan(e).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Luis']);
  assert.deepEqual(personasQueJuegan(e).map((m) => puedeJugar(e, m.id)), [true, true, true]);
  assert.equal(puedeJugar(e, mascotas(e)[0].id), false);
  assert.equal(puedeJugar(e, 'no-existe'), false);
  assert.equal(propietarioDe(e).id, miembrosActivos(e)[0].id);
});

test('AC-5.3, AC-5.4: al abrir juega la persona guardada si todavía puede jugar; si no, el propietario', () => {
  const { ctx, e } = hogar();
  const P = propietarioDe(e);
  const dianaId = familiares(e)[0].id;
  assert.equal(jugadorInicial(e, null), P.id);
  assert.equal(jugadorInicial(e, { clave: 'x', dx: 0, dy: 0, direccion: 'abajo' }), P.id); // posición guardada por una feature anterior
  assert.equal(jugadorInicial(e, { jugadorId: dianaId }), dianaId);
  assert.equal(jugadorInicial(e, { jugadorId: 'no-existe' }), P.id);
  assert.equal(jugadorInicial(e, { jugadorId: mascotas(e)[0].id }), P.id);
  assert.equal(jugadorInicial(e, { jugadorId: 7 }), P.id);
  assert.equal(jugadorInicial(eliminarHabitante(e, dianaId, ctx), { jugadorId: dianaId }), P.id);
});

test('AC-2.1, AC-2.2, AC-2.5: el familiar elegido pasa a ser el jugador en su casilla y quien jugaba queda en la suya', () => {
  const { e, d, propietario, jugador, moviles } = partida();
  const diana = familiares(e)[0];
  const antes = moviles.find((h) => h.id === diana.id);
  const r = cambiarJugador(moviles, jugador, diana.id, d);
  assert.deepEqual(r.jugador, { id: diana.id, x: antes.x, y: antes.y, direccion: 'abajo' });
  assert.equal(r.moviles.length, moviles.length);
  assert.equal(r.moviles.some((h) => h.id === diana.id), false);
  const saliente = r.moviles.find((h) => h.id === propietario.id);
  assert.deepEqual([saliente.x, saliente.y, saliente.fase, saliente.objetivo], [jugador.x, jugador.y, 'pasea', { tipo: 'libre' }]);
  for (const h of moviles.filter((x) => x.id !== diana.id)) assert.deepEqual(r.moviles.find((x) => x.id === h.id), h); // los demás no cambian
  verificar(d, r.moviles, r.jugador);
});

test('AC-2.3, AC-2.4, AC-3.6: quien deja de jugar toma el objetivo de su rutina: espacio, fuera o libre; el propietario, siempre libre', () => {
  const { e, d, propietario, jugador, moviles } = partida();
  const [diana, luis] = familiares(e);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[0];
  const r1 = cambiarJugador(moviles, jugador, diana.id, d); // juega Diana
  const r2 = cambiarJugador(r1.moviles, r1.jugador, luis.id, d, new Map([[diana.id, { tipo: 'espacio', espacioId: dormitorio.id }]]));
  const dianaMovil = r2.moviles.find((h) => h.id === diana.id);
  assert.deepEqual([dianaMovil.objetivo, dianaMovil.fase], [{ tipo: 'espacio', espacioId: dormitorio.id }, 'planifica']);
  const r3 = cambiarJugador(r2.moviles, r2.jugador, propietario.id, d, new Map([[luis.id, { tipo: 'fuera' }]]));
  const luisMovil = r3.moviles.find((h) => h.id === luis.id);
  assert.deepEqual([luisMovil.objetivo, luisMovil.fase], [{ tipo: 'fuera' }, 'planifica']);
  const r4 = cambiarJugador(r3.moviles, r3.jugador, diana.id, d, new Map([[propietario.id, { tipo: 'libre' }]]));
  const propietarioMovil = r4.moviles.find((h) => h.id === propietario.id);
  assert.deepEqual([propietarioMovil.objetivo, propietarioMovil.fase], [{ tipo: 'libre' }, 'pasea']);
  verificar(d, r4.moviles, r4.jugador);
});

test('AC-3.2, AC-3.3: un familiar fuera de casa aparece en la entrada; si está ocupada, en la casilla libre más cercana por camino', () => {
  const { e, d, azar, propietario, jugador } = partida();
  const [diana, luis] = familiares(e);
  const fuera = new Map([[diana.id, { tipo: 'fuera' }]]);
  const solo = colocarHabitantes([diana.id], d, { ...jugador, desde: null }, azar, fuera);
  assert.equal(solo[0].fase, 'fuera');
  const r = cambiarJugador(solo, jugador, diana.id, d);
  assert.deepEqual([r.jugador.x, r.jugador.y], [d.entrada.x, d.entrada.y]);
  assert.equal(r.moviles.find((h) => h.id === propietario.id).x, jugador.x);
  const dos = colocarHabitantes([diana.id, luis.id], d, { ...jugador, desde: null }, azar, fuera);
  const conLuisEnLaEntrada = dos.map((h) => (h.id === luis.id ? { ...h, x: d.entrada.x, y: d.entrada.y } : h));
  const ocupada = cambiarJugador(conLuisEnLaEntrada, jugador, diana.id, d);
  const distancia = Math.abs(ocupada.jugador.x - d.entrada.x) + Math.abs(ocupada.jugador.y - d.entrada.y);
  assert.ok(distancia >= 1 && distancia <= 3, `a ${distancia} casillas de la entrada`); // cerca de la entrada, nunca en ella
  assert.ok(esTransitable(d, ocupada.jugador.x, ocupada.jugador.y));
  assert.notDeepEqual([ocupada.jugador.x, ocupada.jugador.y], [jugador.x, jugador.y]); // ni en la casilla de quien jugaba
  assert.deepEqual(cambiarJugador(conLuisEnLaEntrada, jugador, diana.id, d).jugador, ocupada.jugador); // siempre la misma
  verificar(d, ocupada.moviles, ocupada.jugador);
  const sobreLaEntrada = { ...jugador, x: d.entrada.x, y: d.entrada.y }; // quien jugaba está parado en la entrada
  const sola = cambiarJugador(colocarHabitantes([diana.id], d, { ...sobreLaEntrada, desde: null }, azar, fuera), sobreLaEntrada, diana.id, d);
  assert.notDeepEqual([sola.jugador.x, sola.jugador.y], [d.entrada.x, d.entrada.y]);
  assert.deepEqual([sola.moviles[0].x, sola.moviles[0].y], [d.entrada.x, d.entrada.y]);
});

test('AC-2.5: quien está en ruta en la casilla del nuevo jugador se aparta a la libre más cercana, sin perder su objetivo', () => {
  const { e, d, jugador } = partida();
  const [diana, luis] = familiares(e);
  const [deDiana, deLuis] = colocarHabitantes([diana.id, luis.id], d, { ...jugador, desde: null }, azarReproducible(5));
  const espacioId = d.espacioEn[deDiana.y][deDiana.x];
  const luisEnRuta = { ...deLuis, x: deDiana.x, y: deDiana.y, desde: null, fase: 'ruta', objetivo: { tipo: 'espacio', espacioId } };
  const r = cambiarJugador([deDiana, luisEnRuta], jugador, diana.id, d);
  const luisDespues = r.moviles.find((h) => h.id === luis.id);
  assert.notDeepEqual([luisDespues.x, luisDespues.y], [r.jugador.x, r.jugador.y]);
  const lejos = Math.abs(luisDespues.x - deDiana.x) + Math.abs(luisDespues.y - deDiana.y);
  assert.ok(lejos >= 1 && lejos <= 3, `a ${lejos} casillas de donde estaba`); // la libre más cercana
  assert.deepEqual([luisDespues.objetivo, luisDespues.fase, luisDespues.ruta], [{ tipo: 'espacio', espacioId }, 'planifica', []]);
  verificar(d, r.moviles, r.jugador);
});

test('AC-2.1: el nuevo jugador mira hacia donde miraba su personaje, o hacia abajo si no tenía dirección', () => {
  const { e, d, jugador, moviles } = partida();
  const diana = familiares(e)[0];
  const mirando = moviles.map((h) => (h.id === diana.id ? { ...h, direccion: 'izquierda' } : h));
  assert.equal(cambiarJugador(mirando, jugador, diana.id, d).jugador.direccion, 'izquierda');
  assert.equal(cambiarJugador(moviles, jugador, diana.id, d).jugador.direccion, 'abajo');
});

test('AC-4.7: si quien jugaba ya no existe, juega el propietario en la casilla que ocupaba como personaje quieto', () => {
  const { e, d, propietario, jugador, moviles } = partida();
  const diana = familiares(e)[0];
  const r1 = cambiarJugador(moviles, jugador, diana.id, d); // juega Diana; el propietario queda quieto donde estaba
  const r2 = cambiarJugador(r1.moviles, null, propietario.id, d); // Diana se elimina: ya no hay quien salga
  assert.deepEqual([r2.jugador.id, r2.jugador.x, r2.jugador.y], [propietario.id, jugador.x, jugador.y]);
  assert.equal(r2.moviles.length, r1.moviles.length - 1);
  assert.equal(r2.moviles.some((h) => h.id === propietario.id), false);
  verificar(d, r2.moviles, r2.jugador);
});

test('FR-3: con el propietario entre los móviles, todos ocupan casillas distintas y pasean', () => {
  const { e, d, azar, jugador } = partida();
  const diana = familiares(e)[0];
  const moviles = colocarHabitantes(idsSin(e, diana.id), d, { x: jugador.x, y: jugador.y, desde: null }, azar);
  assert.equal(moviles.length, 3); // el propietario, Luis y la mascota
  assert.ok(moviles.every((h) => h.fase === 'pasea' && h.objetivo.tipo === 'libre'));
  verificar(d, moviles, jugador);
});

test('Reliability, AC-2.5: tras varios cambios de jugador y minutos de movimiento, nadie comparte casilla con quien juega ni pisa una pared', () => {
  const { e, d, azar, jugador: inicial, moviles: iniciales } = partida(9);
  const personas = personasQueJuegan(e).map((m) => m.id);
  let jugador = inicial;
  let moviles = iniciales;
  for (let ronda = 0; ronda < 12; ronda++) {
    const r = cambiarJugador(moviles, jugador, personas[(ronda + 1) % personas.length], d);
    moviles = r.moviles;
    jugador = r.jugador;
    verificar(d, moviles, jugador);
    for (let t = 0; t < 5000; t += 50) {
      moviles = avanzarHabitantes(moviles, d, { x: jugador.x, y: jugador.y, desde: null }, 50, azar);
      verificar(d, moviles, jugador);
    }
  }
  assert.equal(moviles.length + 1, miembrosActivos(e).length); // siempre todos los miembros: uno juega y los demás son móviles
});
