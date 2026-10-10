// test/casillas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, renombrarEspacio, espaciosDeTipo, espaciosActivos, banosInternos } from '../src/hogar.js';
import { generarDistribucion } from '../src/distribucion.js';
import { arteDelMapa, vistaDePared, TEXTURAS } from '../src/arte/casillas.js';
import { LETRAS_MUEBLE } from '../src/arte/mobiliario.js';
import { crearCtx, todasLasCombinaciones } from './ayuda.js';

// Hogar inicial (27×11): sala en el centro, cocina y baño a la izquierda, dormitorio a la derecha. Filas del mapa:
//  0 ###########################      5 #########....*...##.......#
//  1 #KLR...##........##.....nB#      6 #########........##########
//  2 #..........SSSS..##......B#      7 #WwU...##........#
//  3 #......##.................#      ...
//  4 #......##...TT...##.......#     10 #############.####   (entrada en la columna 13)
const inicial = () => {
  const ctx = crearCtx();
  const estado = crearHogarInicial(ctx);
  const d = generarDistribucion(estado);
  return { ctx, estado, d, arte: arteDelMapa(estado, d) };
};

test('AC-3.1, AC-3.2, AC-3.5 y AC-3.6: la pared se ve de frente si debajo no hay pared ni vacío, y desde arriba en los demás casos', () => {
  const { arte } = inicial();
  assert.equal(arte[0][1].base, 'pared:frente'); // sobre la cocina
  assert.equal(arte[0][9].base, 'pared:frente'); // sobre el suelo de la sala
  assert.equal(arte[0][0].base, 'pared:cima'); // sobre otra pared
  assert.equal(arte[0][7].base, 'pared:cima');
  assert.equal(arte[0][8].base, 'pared:cima');
  assert.equal(arte[6][3].base, 'pared:frente'); // pared de arriba del baño: debajo hay una ducha
  assert.equal(arte[5][3].base, 'pared:cima'); // pared de abajo de la cocina: debajo hay otra pared
  assert.equal(arte[10][12].base, 'pared:cima'); // pared inferior de la sala: debajo no hay nada
  assert.equal(arte[10][13].base, 'suelo:sala'); // la entrada es suelo y no pared (AC-2.4)
  assert.equal(arte[10][13].mueble, null);
});

test('AC-3.1 y AC-3.2: vistaDePared mira solo la casilla de debajo', () => {
  const tiles = ['###', '#.#', '###'];
  assert.equal(vistaDePared(tiles, 1, 0), 'frente');
  assert.equal(vistaDePared(tiles, 0, 0), 'cima');
  assert.equal(vistaDePared(tiles, 1, 2), 'cima'); // debajo queda fuera del mapa
  assert.equal(vistaDePared(['# ', '  '], 0, 0), 'cima'); // debajo hay vacío
  assert.equal(vistaDePared(['#', 'K'], 0, 0), 'frente'); // debajo hay un mueble
});

test('AC-3.3 y AC-3.4: una puerta se dibuja como suelo y la pared que está encima se ve de frente', () => {
  const { d, arte } = inicial();
  assert.ok(d.puertas.length > 0);
  for (const { x, y } of d.puertas) {
    assert.match(arte[y][x].base, /^suelo:/);
    if (d.tiles[y - 1][x] === '#') assert.equal(arte[y - 1][x].base, 'pared:frente');
  }
  assert.equal(arte[2][7].base, 'suelo:cocina'); // puerta de la cocina, del lado de la cocina
  assert.equal(arte[2][8].base, 'suelo:sala'); // y del lado de la sala
});

test('AC-2.2 y AC-2.3: el suelo sale del tipo del espacio al que pertenece cada casilla, también el baño interno', () => {
  const ctx = crearCtx();
  let estado = agregarEspacio(crearHogarInicial(ctx), 'comedor', ctx);
  estado = agregarEspacio(estado, 'bano', ctx); // baño interno del dormitorio
  const d = generarDistribucion(estado);
  const arte = arteDelMapa(estado, d);
  const tipoDe = new Map(espaciosActivos(estado).map((e) => [e.id, e.tipo]));
  const internos = new Set(banosInternos(estado).map((b) => b.id));
  let casillasDeBanoInterno = 0;
  d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
    if (ch === ' ' || ch === '#') return;
    const clave = d.espacioEn[y][x];
    const tipo = clave.startsWith('pasillo:') ? 'pasillo' : tipoDe.get(clave);
    assert.equal(arte[y][x].base, `suelo:${tipo}`, `casilla (${x},${y})`);
    if (internos.has(clave)) casillasDeBanoInterno++;
  }));
  assert.ok(casillasDeBanoInterno > 0, 'el baño interno tiene casillas de suelo');
});

test('AC-2.5: el suelo cambia de comedor a sala en el límite exacto entre ambos espacios', () => {
  const ctx = crearCtx();
  const estado = agregarEspacio(crearHogarInicial(ctx), 'comedor', ctx);
  const d = generarDistribucion(estado);
  const arte = arteDelMapa(estado, d);
  const comedor = d.rects[espaciosDeTipo(estado, 'comedor')[0].id];
  const sala = d.rects[espaciosDeTipo(estado, 'sala')[0].id];
  assert.equal(sala.y, comedor.y + comedor.h);
  assert.equal(arte[comedor.y + comedor.h - 1][comedor.x + 1].base, 'suelo:comedor');
  assert.equal(arte[sala.y][sala.x + 1].base, 'suelo:sala');
  // la mesa son cuatro casillas de un solo objeto y las cuatro sillas son iguales y separadas
  assert.deepEqual([3, 4, 5, 6].map((dx) => arte[comedor.y + 2][comedor.x + dx].mueble),
    ['mueble:M:inicio', 'mueble:M:medio', 'mueble:M:medio', 'mueble:M:fin']);
  assert.deepEqual([3, 4, 5, 6].map((dx) => arte[comedor.y + 3][comedor.x + dx].mueble), Array(4).fill('mueble:s:unico'));
});

test('AC-2.6 y AC-9.4: renombrar un espacio no cambia el suelo y la elección es determinista', () => {
  const { ctx, estado, d, arte } = inicial();
  assert.deepEqual(arteDelMapa(estado, d), arte);
  const sala = espaciosDeTipo(estado, 'sala')[0];
  const r = renombrarEspacio(estado, sala.id, 'Mi sala', ctx);
  assert.equal(r.ok, true);
  assert.deepEqual(arteDelMapa(r.estado, generarDistribucion(r.estado)), arte);
});

test('AC-4.3, AC-4.5 y AC-4.6: cada casilla de mueble lleva su variante sobre el suelo de su espacio', () => {
  const { arte } = inicial();
  assert.deepEqual([11, 12, 13, 14].map((x) => arte[2][x].mueble), ['mueble:S:inicio', 'mueble:S:medio', 'mueble:S:medio', 'mueble:S:fin']);
  assert.deepEqual([12, 13].map((x) => arte[4][x].mueble), ['mueble:T:inicio', 'mueble:T:fin']);
  assert.equal(arte[1][25].mueble, 'mueble:B:inicio');
  assert.equal(arte[2][25].mueble, 'mueble:B:fin');
  assert.equal(arte[1][24].mueble, 'mueble:n:unico');
  assert.deepEqual([1, 2, 3].map((x) => arte[1][x].mueble), ['mueble:K:unico', 'mueble:L:unico', 'mueble:R:unico']);
  assert.deepEqual([1, 2, 3].map((x) => arte[7][x].mueble), ['mueble:W:unico', 'mueble:w:unico', 'mueble:U:unico']);
  assert.equal(arte[2][11].base, 'suelo:sala'); // el suelo está debajo del sofá
  assert.equal(arte[1][1].base, 'suelo:cocina');
  assert.equal(arte[7][1].base, 'suelo:bano');
  assert.equal(arte[2][10].mueble, null);
});

test('AC-9.3: un espacio agregado muestra su suelo y su mobiliario, y uno eliminado no deja arte', () => {
  const ctx = crearCtx();
  let estado = agregarEspacio(crearHogarInicial(ctx), 'lavanderia', ctx);
  const lavanderia = espaciosDeTipo(estado, 'lavanderia')[0];
  const d = generarDistribucion(estado);
  const arte = arteDelMapa(estado, d);
  const r = d.rects[lavanderia.id];
  assert.equal(arte[r.y + 2][r.x + 2].base, 'suelo:lavanderia');
  assert.equal(arte[r.y + 1][r.x + 1].mueble, 'mueble:V:inicio');
  assert.equal(arte[r.y + 1][r.x + 2].mueble, 'mueble:V:fin');
  estado = eliminarEspacio(estado, lavanderia.id, ctx);
  const despues = arteDelMapa(estado, generarDistribucion(estado)).flat();
  assert.equal(despues.filter((c) => c?.base === 'suelo:lavanderia').length, 0);
  assert.equal(despues.filter((c) => c?.mueble?.startsWith('mueble:V')).length, 0);
});

test('Error: una letra sin arte deja el suelo y no el mueble', () => {
  const { estado, d } = inicial();
  const tiles = [...d.tiles];
  tiles[1] = `${tiles[1].slice(0, 5)}Z${tiles[1].slice(6)}`;
  const arte = arteDelMapa(estado, { ...d, tiles });
  assert.equal(arte[1][5].base, 'suelo:cocina');
  assert.equal(arte[1][5].mueble, null);
});

test('Reliability: en los 7.560 mapas toda casilla tiene arte, cada pared una vista, y el resultado es determinista', () => {
  const conocidas = new Set(['#', '.', '*', ' ', ...LETRAS_MUEBLE]);
  let total = 0;
  for (const estado of todasLasCombinaciones()) {
    const d = generarDistribucion(estado);
    const arte = arteDelMapa(estado, d);
    const fallos = [];
    if (arte.length !== d.alto) fallos.push('alto');
    d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (!conocidas.has(ch)) fallos.push(`letra sin arte ${ch} en (${x},${y})`);
      const celda = arte[y][x];
      if (ch === ' ') { if (celda !== null) fallos.push(`vacío con arte en (${x},${y})`); return; }
      if (!TEXTURAS[celda.base]) fallos.push(`sin base en (${x},${y})`);
      else if (celda.base.startsWith('pared:') !== (ch === '#')) fallos.push(`pared mal puesta en (${x},${y})`);
      if (LETRAS_MUEBLE.includes(ch)) { if (!TEXTURAS[celda.mueble]) fallos.push(`sin mueble ${ch} en (${x},${y})`); }
      else if (celda.mueble !== null) fallos.push(`mueble sobre ${ch} en (${x},${y})`);
    }));
    assert.deepEqual(fallos, [], `mapa ${total}`);
    if (total % 100 === 0) assert.deepEqual(arteDelMapa(estado, d), arte, 'no determinista');
    total++;
  }
  assert.equal(total, 7560);
});
