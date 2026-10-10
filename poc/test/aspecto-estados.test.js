// test/aspecto-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, espaciosActivos, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion } from '../src/distribucion.js';
import {
  casillasLibres, objetosDelSuelo, manchasDelSuelo, moscasDelSuelo, esquinasDelEspacio, MANCHAS_POR_DESASTRE, MOSCAS_POR_DESASTRE,
} from '../src/aspecto.js';
import { crearCtx } from './ayuda.js';

const hogarCon = (...tipos) => {
  const ctx = crearCtx();
  return tipos.reduce((e, t) => agregarEspacio(e, t, ctx), crearHogarInicial(ctx));
};
const clave = (c) => `${c.x},${c.y}`;
const banoInterno = (e) => espaciosActivos(e).find((s) => s.tipo === 'bano' && s.contenidoEn !== null);

test('AC-3.2, AC-3.5, AC-3.6: las manchas son hasta 6 casillas libres distintas, solo en desastre y siempre las mismas', () => {
  const e = hogarCon('dormitorio', 'bano', 'comedor');
  const d = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    assert.deepEqual(manchasDelSuelo(d, espacio.id, 'limpio'), []);
    assert.deepEqual(manchasDelSuelo(d, espacio.id, 'desordenado'), []);
    const manchas = manchasDelSuelo(d, espacio.id, 'desastre');
    assert.equal(manchas.length, Math.min(MANCHAS_POR_DESASTRE, libres.size), espacio.tipo);
    assert.equal(new Set(manchas.map(clave)).size, manchas.length);
    for (const m of manchas) assert.ok(libres.has(clave(m)), `${espacio.tipo}: mancha fuera de las casillas libres`);
    assert.deepEqual(manchasDelSuelo(generarDistribucion(e), espacio.id, 'desastre'), manchas);
  }
});

test('AC-4.5, AC-4.7: las moscas son 2 casillas libres distintas, solo en desastre y siempre las mismas', () => {
  const e = hogarCon('dormitorio', 'bano', 'mascota');
  const d = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    assert.deepEqual(moscasDelSuelo(d, espacio.id, 'limpio'), []);
    assert.deepEqual(moscasDelSuelo(d, espacio.id, 'desordenado'), []);
    const moscas = moscasDelSuelo(d, espacio.id, 'desastre');
    assert.equal(moscas.length, Math.min(MOSCAS_POR_DESASTRE, libres.size));
    assert.equal(new Set(moscas.map(clave)).size, moscas.length);
    for (const m of moscas) assert.ok(libres.has(clave(m)));
    assert.deepEqual(moscasDelSuelo(generarDistribucion(e), espacio.id, 'desastre'), moscas);
  }
});

test('AC-3.2, AC-4.5: el baño interno, con 4 casillas libres, muestra 4 manchas y 2 moscas', () => {
  const e = hogarCon('dormitorio', 'bano');
  const d = generarDistribucion(e);
  const bano = banoInterno(e);
  assert.equal(casillasLibres(d, bano.id).length, 4);
  assert.equal(manchasDelSuelo(d, bano.id, 'desastre').length, 4);
  assert.equal(moscasDelSuelo(d, bano.id, 'desastre').length, 2);
});

test('AC-3.5: las manchas y las moscas usan otra tanda de casillas que los objetos del suelo', () => {
  const e = hogarCon('dormitorio', 'cocina');
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  const objetos = objetosDelSuelo(d, cocina.id, 'desastre').map(clave);
  assert.notDeepEqual(manchasDelSuelo(d, cocina.id, 'desastre').map(clave), objetos.slice(0, MANCHAS_POR_DESASTRE));
});

test('AC-4.2: las esquinas superiores de la cocina son la izquierda y la derecha de su primera fila', () => {
  const e = hogarCon();
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  // Fila 1 de la cocina: '#KLR...#'; la cocina ocupa x de 0 a 7.
  assert.deepEqual(esquinasDelEspacio(d, cocina.id), [{ x: 1, y: 1, lado: 'izquierda' }, { x: 6, y: 1, lado: 'derecha' }]);
});

test('AC-4.2, AC-4.3: la telaraña va en la esquina aunque la ocupe un mueble, y el baño interno tiene las suyas', () => {
  const e = hogarCon('dormitorio', 'bano');
  const d = generarDistribucion(e);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[1];
  const esquinas = esquinasDelEspacio(d, dormitorio.id);
  assert.ok(esquinas.length >= 2);
  assert.ok(esquinas.some((c) => d.tiles[c.y][c.x] === 'B'), 'la cama del dormitorio ocupa una esquina');
  const bano = banoInterno(e);
  assert.deepEqual(esquinasDelEspacio(d, bano.id).map((c) => c.lado), ['izquierda', 'derecha']);
});

test('AC-4.2: ninguna casilla lleva más de una esquina y todas tienen pared al norte y a un costado', () => {
  const e = hogarCon('comedor', 'lavanderia', 'mascota', 'dormitorio', 'oficina', 'bano', 'bano');
  const d = generarDistribucion(e);
  const pared = (x, y) => d.tiles[y]?.[x] === '#';
  for (const espacio of espaciosActivos(e)) {
    const esquinas = esquinasDelEspacio(d, espacio.id);
    assert.equal(new Set(esquinas.map(clave)).size, esquinas.length);
    for (const c of esquinas) {
      assert.ok(pared(c.x, c.y - 1), `${espacio.tipo} ${clave(c)}: sin pared al norte`);
      assert.ok(pared(c.lado === 'izquierda' ? c.x - 1 : c.x + 1, c.y), `${espacio.tipo} ${clave(c)}: sin pared al costado`);
      assert.equal(d.espacioEn[c.y][c.x], espacio.id);
      assert.notEqual(d.tiles[c.y][c.x], '#');
    }
  }
});

test('AC-4.2: la sala bajo un comedor no tiene esquinas superiores; sin comedor, tiene dos', () => {
  const sin = hogarCon();
  const con = hogarCon('comedor');
  const salaSin = espaciosDeTipo(sin, 'sala')[0];
  const salaCon = espaciosDeTipo(con, 'sala')[0];
  assert.equal(esquinasDelEspacio(generarDistribucion(sin), salaSin.id).length, 2);
  assert.equal(esquinasDelEspacio(generarDistribucion(con), salaCon.id).length, 0);
  assert.equal(esquinasDelEspacio(generarDistribucion(con), espaciosDeTipo(con, 'comedor')[0].id).length, 2);
});

test('AC-8.5: objetosDelSuelo conserva su contrato de la 003 (4 y 12 objetos, variante de 0 a 5)', () => {
  const e = hogarCon('dormitorio');
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  assert.equal(objetosDelSuelo(d, cocina.id, 'desordenado').length, 4);
  assert.equal(objetosDelSuelo(d, cocina.id, 'desastre').length, 12);
  for (const o of objetosDelSuelo(d, cocina.id, 'desastre')) assert.ok(Number.isInteger(o.variante) && o.variante >= 0 && o.variante < 6);
});
