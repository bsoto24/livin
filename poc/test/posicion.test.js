// test/posicion.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { posicionRelativa, resolverPosicion, paso } from '../src/posicion.js';
import { crearCtx } from './ayuda.js';

test('AC-2.1: un paso a una casilla transitable avanza una casilla', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const inicio = { ...d.aparicion, direccion: 'abajo' };
  const r = paso(d, inicio, 'abajo');
  assert.deepEqual(r, { x: inicio.x, y: inicio.y + 1, direccion: 'abajo', movio: true });
});

test('AC-2.3: contra una pared no se mueve pero cambia la dirección', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  let pos = { ...d.aparicion, direccion: 'abajo' };
  while (paso(d, pos, 'abajo').movio) pos = paso(d, pos, 'abajo');
  const r = paso(d, { ...pos, direccion: 'izquierda' }, 'abajo');
  assert.equal(r.movio, false);
  assert.equal(r.direccion, 'abajo');
  assert.deepEqual([r.x, r.y], [pos.x, pos.y]);
});

test('AC-2.5: cruzar una puerta no requiere transición (mapa continuo)', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = espaciosDeTipo(e, 'sala')[0].id;
  const dorm = espaciosDeTipo(e, 'dormitorio')[0].id;
  const puerta = d.puertas.find((p) => d.espacioEn[p.y][p.x] === dorm);
  assert.ok(esTransitable(d, puerta.x - 1, puerta.y));
  assert.equal(d.espacioEn[puerta.y][puerta.x - 1], sala);
});

test('AC-7.3: la posición relativa sigue al espacio cuando se desplaza', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const antes = generarDistribucion(e);
  const r = antes.rects[d2.id];
  const guardada = posicionRelativa(antes, r.x + 2, r.y + 4, 'izquierda');
  e = agregarEspacio(e, 'oficina', ctx); // aparece un pasillo: la zona privada se desplaza
  const despues = generarDistribucion(e);
  assert.notEqual(despues.rects[d2.id].x, r.x);
  const resuelta = resolverPosicion(despues, guardada);
  assert.deepEqual(resuelta, { x: despues.rects[d2.id].x + 2, y: despues.rects[d2.id].y + 4, direccion: 'izquierda' });
});

test('AC-7.4: posición inválida vuelve a la aparición de la sala', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  let d = generarDistribucion(e);
  const r = d.rects[d2.id];
  const enD2 = posicionRelativa(d, r.x + 6, r.y + 2, 'arriba'); // espacio que se eliminará
  e = eliminarEspacio(e, d2.id, ctx);
  d = generarDistribucion(e);
  assert.deepEqual(resolverPosicion(d, enD2), { ...d.aparicion, direccion: 'abajo' });
  assert.deepEqual(resolverPosicion(d, null), { ...d.aparicion, direccion: 'abajo' });
  // casilla que queda ocupada por un baño interno
  const ctx2 = crearCtx();
  let e2 = crearHogarInicial(ctx2);
  let d3 = generarDistribucion(e2);
  const dorm = espaciosDeTipo(e2, 'dormitorio')[0].id;
  const rd = d3.rects[dorm];
  const guardada = posicionRelativa(d3, rd.x + 5, rd.y + 1, 'arriba');
  e2 = agregarEspacio(e2, 'bano', ctx2);
  d3 = generarDistribucion(e2);
  assert.deepEqual(resolverPosicion(d3, guardada), { ...d3.aparicion, direccion: 'abajo' });
  // pasillo que desaparece
  const ctx3 = crearCtx();
  let e3 = agregarEspacio(agregarEspacio(crearHogarInicial(ctx3), 'dormitorio', ctx3), 'oficina', ctx3);
  let d4 = generarDistribucion(e3);
  const p = d4.pasillos[0];
  const enPasillo = posicionRelativa(d4, p.x + 1, p.y + 3, 'abajo');
  e3 = eliminarEspacio(e3, espaciosDeTipo(e3, 'oficina')[0].id, ctx3);
  d4 = generarDistribucion(e3);
  assert.deepEqual(resolverPosicion(d4, enPasillo), { ...d4.aparicion, direccion: 'abajo' });
});
