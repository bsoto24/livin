// test/aspecto.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, agregarHabitante, espaciosActivos, espaciosDeTipo, banoDe, familiares } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { agregarActividad, burbujas } from '../src/actividades.js';
import { casillasLibres, casillaDeBurbuja, objetosDelSuelo, ubicarBurbujas, OBJETOS_POR_ESTADO } from '../src/aspecto.js';
import { crearCtx } from './ayuda.js';

// Hogar con todos los tipos de espacio y dos baños internos (en Dormitorio 1 y Dormitorio 2).
function hogarConBanos() {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  for (const tipo of ['comedor', 'cocina', 'lavanderia', 'mascota', 'dormitorio', 'dormitorio', 'oficina', 'bano', 'bano']) {
    e = agregarEspacio(e, tipo, ctx);
  }
  return e;
}

const esPuerta = (d, c) => d.puertas.some((p) => p.x === c.x && p.y === c.y);

test('FR-5, AC-4.7: las casillas libres de cada espacio son de su área, transitables y no son puertas', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = casillasLibres(d, espacio.id);
    assert.ok(libres.length > 0, espacio.id);
    for (const c of libres) {
      assert.equal(d.espacioEn[c.y][c.x], espacio.id);
      assert.ok(esTransitable(d, c.x, c.y));
      assert.ok(!esPuerta(d, c));
    }
  }
});

test('AC-2.8: la burbuja de un espacio está en la primera casilla libre de su área, siempre la misma', () => {
  const e = hogarConBanos();
  const d1 = generarDistribucion(e);
  const d2 = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const c = casillaDeBurbuja(d1, espacio.id);
    assert.deepEqual(c, casillasLibres(d1, espacio.id)[0]);
    assert.deepEqual(casillaDeBurbuja(d2, espacio.id), c);
    assert.ok(!esPuerta(d1, c));
  }
});

test('AC-4.3, AC-4.4, AC-4.7: objetos del suelo según el estado, en casillas libres distintas, siempre las mismas', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  for (const espacio of espaciosDeTipo(e, 'cocina')) {
    const libres = new Set(casillasLibres(d, espacio.id).map((c) => `${c.x},${c.y}`));
    const desordenado = objetosDelSuelo(d, espacio.id, 'desordenado');
    const desastre = objetosDelSuelo(d, espacio.id, 'desastre');
    assert.deepEqual(objetosDelSuelo(d, espacio.id, 'limpio'), []);
    assert.equal(desordenado.length, OBJETOS_POR_ESTADO.desordenado);
    assert.equal(desastre.length, OBJETOS_POR_ESTADO.desastre);
    assert.deepEqual(desastre.slice(0, desordenado.length), desordenado); // el desastre agrega objetos a los del desorden
    assert.equal(new Set(desastre.map((o) => `${o.x},${o.y}`)).size, desastre.length);
    for (const o of desastre) {
      assert.ok(libres.has(`${o.x},${o.y}`));
      assert.ok(Number.isInteger(o.variante) && o.variante >= 0 && o.variante < 6);
    }
    assert.deepEqual(objetosDelSuelo(generarDistribucion(e), espacio.id, 'desastre'), desastre);
  }
});

test('AC-4.3, AC-4.7: si hay menos casillas libres que objetos, se muestran tantos como casillas libres haya', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  const bano = banoDe(e, espaciosDeTipo(e, 'dormitorio')[0].id);
  const libres = casillasLibres(d, bano.id).length;
  assert.equal(libres, 4); // el baño interno es el espacio más pequeño del catálogo
  assert.ok(libres < OBJETOS_POR_ESTADO.desastre);
  assert.equal(objetosDelSuelo(d, bano.id, 'desastre').length, libres);
  assert.equal(objetosDelSuelo(d, bano.id, 'desordenado').length, Math.min(OBJETOS_POR_ESTADO.desordenado, libres));
});

test('FR-6: ubicarBurbujas pone la de un espacio en su casilla fija y la de un miembro en la casilla de encima de él', () => {
  const ctx = crearCtx();
  let e = agregarHabitante(crearHogarInicial(ctx), 'familiar', { nombre: 'Diana', aspecto: 'adulta' }, ctx).estado;
  const diana = familiares(e)[0];
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  const base = { nombre: 'Tarea', icono: 'otra', miembroId: diana.id, tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null };
  e = agregarActividad(e, { ...base, espacioId: cocina.id }, ctx).estado;
  e = agregarActividad(e, { ...base, espacioId: null }, ctx).estado;
  const d = generarDistribucion(e);
  const lista = burbujas(e, '2026-10-06');
  const fija = casillaDeBurbuja(d, cocina.id);
  assert.deepEqual(
    ubicarBurbujas(lista, d, new Map([[diana.id, { x: 20, y: 7 }]])).map((b) => [b.tipo, b.x, b.y]),
    [['espacio', fija.x, fija.y], ['miembro', 20, 6]],
  );
  assert.deepEqual(ubicarBurbujas(lista, d, new Map()).map((b) => b.tipo), ['espacio']);
});

test('AC-9.6: ni los objetos del suelo ni las burbujas se ponen en la entrada', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  const enEntrada = (c) => c.x === d.entrada.x && c.y === d.entrada.y;
  assert.equal(d.espacioEn[d.entrada.y][d.entrada.x], espaciosDeTipo(e, 'sala')[0].id);
  for (const espacio of espaciosActivos(e)) {
    assert.ok(!casillasLibres(d, espacio.id).some(enEntrada), espacio.tipo);
    assert.ok(!enEntrada(casillaDeBurbuja(d, espacio.id)), espacio.tipo);
    for (const limpieza of ['desordenado', 'desastre']) assert.ok(!objetosDelSuelo(d, espacio.id, limpieza).some(enEntrada), espacio.tipo);
  }
});
