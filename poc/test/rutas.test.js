// test/rutas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, espaciosDeTipo, espaciosActivos, banoDe } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { claveCasilla } from '../src/posicion.js';
import { rutaMasCorta, casillasDe } from '../src/rutas.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function hogarMasGrande() {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  return agregar(e, ctx, ...Array(6).fill('bano'));
}

// Distancia por camino desde `inicio` a cada casilla transitable (búsqueda independiente de la del módulo).
function distancias(d, inicio) {
  const dist = new Map([[claveCasilla(inicio.x, inicio.y), 0]]);
  const cola = [inicio];
  for (let i = 0; i < cola.length; i++) {
    const { x, y } = cola[i];
    for (const [dx, dy] of VECINOS) {
      const k = claveCasilla(x + dx, y + dy);
      if (!dist.has(k) && esTransitable(d, x + dx, y + dy)) { dist.set(k, dist.get(claveCasilla(x, y)) + 1); cola.push({ x: x + dx, y: y + dy }); }
    }
  }
  return dist;
}

test('AC-3.1, AC-3.11: la ruta es un camino de casillas contiguas y transitables, del largo mínimo, y siempre la misma', () => {
  for (const estado of [crearHogarInicial(crearCtx()), hogarMasGrande()]) {
    const d = generarDistribucion(estado);
    const dist = distancias(d, d.aparicion);
    for (const espacio of espaciosActivos(estado)) {
      const destino = (x, y) => d.espacioEn[y][x] === espacio.id;
      const ruta = rutaMasCorta(d, d.aparicion, destino);
      assert.deepEqual(rutaMasCorta(d, d.aparicion, destino), ruta);
      let previa = d.aparicion;
      for (const c of ruta) {
        assert.ok(esTransitable(d, c.x, c.y));
        assert.equal(Math.abs(c.x - previa.x) + Math.abs(c.y - previa.y), 1);
        previa = c;
      }
      assert.ok(destino(previa.x, previa.y), espacio.tipo);
      assert.equal(ruta.length, Math.min(...casillasDe(d, espacio.id).map((c) => dist.get(claveCasilla(c.x, c.y)))), espacio.tipo);
    }
    const haciaEntrada = rutaMasCorta(d, d.aparicion, (x, y) => x === d.entrada.x && y === d.entrada.y);
    assert.equal(haciaEntrada.length, dist.get(claveCasilla(d.entrada.x, d.entrada.y)));
  }
});

test('rutaMasCorta devuelve [] si ya está en un destino y null si no hay destino alcanzable', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  assert.deepEqual(rutaMasCorta(d, d.aparicion, () => true), []);
  assert.equal(rutaMasCorta(d, d.aparicion, () => false), null);
  assert.equal(rutaMasCorta(d, d.aparicion, (x, y) => x === 0 && y === 0), null); // una pared nunca es destino
});

test('AC-3.12: casillasDe da las casillas transitables de un espacio en orden de lectura, puertas incluidas', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx);
  const d = generarDistribucion(e);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[0];
  const r = d.rects[banoDe(e, dormitorio.id).id];
  assert.deepEqual(casillasDe(d, banoDe(e, dormitorio.id).id),
    [{ x: r.x, y: r.y + 2 }, { x: r.x + 1, y: r.y + 2 }, { x: r.x + 1, y: r.y + 3 }, { x: r.x + 2, y: r.y + 3 }]);
  const cuarto = casillasDe(d, dormitorio.id);
  assert.ok(cuarto.some((c) => d.puertas.some((p) => p.x === c.x && p.y === c.y)), 'incluye la puerta del cuarto');
  assert.ok(cuarto.every((c) => d.espacioEn[c.y][c.x] === dormitorio.id && esTransitable(d, c.x, c.y)));
  for (let i = 1; i < cuarto.length; i++) {
    assert.ok(cuarto[i - 1].y < cuarto[i].y || (cuarto[i - 1].y === cuarto[i].y && cuarto[i - 1].x < cuarto[i].x));
  }
  assert.deepEqual(casillasDe(d, 'no-existe'), []);
});
