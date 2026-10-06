// test/etiquetas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, renombrarEspacio, espaciosDeTipo, banoDe } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { etiquetasDeEspacios } from '../src/etiquetas.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const centro = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const medir = () => ({ w: 3, h: 1 }); // etiqueta de 3 × 1 casillas

function casillaDe(d, clave) {
  for (let y = 0; y < d.alto; y++) for (let x = 0; x < d.ancho; x++) {
    if (d.espacioEn[y][x] === clave && esTransitable(d, x, y)) return { x, y };
  }
  return null;
}

test('AC-9.1: una etiqueta por espacio activo, centrada en su área', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const etiquetas = etiquetasDeEspacios(e, d, null, null);
  assert.deepEqual(etiquetas.map((t) => t.texto).sort(), ['Baño 1', 'Cocina 1', 'Dormitorio 1', 'Sala 1']);
  for (const t of etiquetas) {
    assert.deepEqual({ x: t.x, y: t.y }, centro(d.rects[t.clave]));
    assert.equal(t.actual, false);
  }
});

test('AC-9.1: muestra el nombre personalizado en lugar del automático', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  const sala = espaciosDeTipo(e, 'sala')[0];
  e = renombrarEspacio(e, sala.id, 'Living', ctx).estado;
  const t = etiquetasDeEspacios(e, generarDistribucion(e), null, null).find((x) => x.clave === sala.id);
  assert.equal(t.texto, 'Living');
});

test('AC-9.3: tras renumerar y eliminar, las etiquetas son las vigentes y no hay etiquetas de espacios eliminados', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, d2.id, ctx);
  const etiquetas = etiquetasDeEspacios(e, generarDistribucion(e), null, null);
  assert.equal(etiquetas.some((t) => t.clave === d2.id), false);
  assert.deepEqual([d1.id, d3.id].map((id) => etiquetas.find((t) => t.clave === id).texto), ['Dormitorio 1', 'Dormitorio 2']);
  assert.equal(etiquetas.length, 5); // sala, cocina, baño común y los dos dormitorios restantes
});

test('AC-9.2: la etiqueta del espacio actual se desplaza para seguir visible en la vista', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const salaId = espaciosDeTipo(e, 'sala')[0].id;
  const sala = d.rects[salaId];
  // El centro de la sala cae dentro de la vista, pero la etiqueta centrada se saldría por la derecha.
  const vista = { x: sala.x, y: sala.y, w: 6, h: 8 };
  const etiquetas = etiquetasDeEspacios(e, d, d.aparicion, vista, medir);
  const actual = etiquetas.filter((t) => t.actual);
  assert.deepEqual(actual.map((t) => t.clave), [salaId]);
  assert.ok(actual[0].x - 1.5 >= vista.x && actual[0].x + 1.5 <= vista.x + vista.w, 'etiqueta fuera de la vista en x');
  assert.ok(actual[0].y - 0.5 >= vista.y && actual[0].y + 0.5 <= vista.y + vista.h, 'etiqueta fuera de la vista en y');
  const otra = etiquetas.find((t) => !t.actual);
  assert.deepEqual({ x: otra.x, y: otra.y }, centro(d.rects[otra.clave])); // las demás no se mueven
});

test('AC-9.2: si la etiqueta cabe en la vista no se mueve', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  const vista = { x: 0, y: 0, w: d.ancho, h: d.alto };
  const actual = etiquetasDeEspacios(e, d, d.aparicion, vista, medir).find((t) => t.actual);
  assert.deepEqual({ x: actual.x, y: actual.y }, centro(sala));
});

test('AC-9.2: ajusta también en vertical cuando la vista es más baja que el espacio', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  const vista = { x: 0, y: 0, w: d.ancho, h: 4 }; // todo el ancho (x no cambia), pero el centro de la sala queda por debajo
  assert.ok(centro(sala).y > vista.y + vista.h, 'el centro de la sala queda fuera de la vista');
  const actual = etiquetasDeEspacios(e, d, d.aparicion, vista, medir).find((t) => t.actual);
  assert.equal(actual.x, centro(sala).x);
  assert.equal(actual.y, vista.y + vista.h - medir().h / 2); // 3.5: centro limitado al borde inferior de la vista
  assert.ok(actual.y - 0.5 >= vista.y && actual.y + 0.5 <= vista.y + vista.h, 'etiqueta fuera de la vista en y');
});

test('AC-9.2: si la etiqueta es más ancha que la parte visible del espacio se centra en ella', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  const vista = { x: sala.x, y: 0, w: 2, h: d.alto }; // tramo visible en x: [sala.x, sala.x + 2], menor que la etiqueta (3)
  const actual = etiquetasDeEspacios(e, d, d.aparicion, vista, medir).find((t) => t.actual);
  assert.equal(actual.x, sala.x + 1);
  assert.equal(actual.y, centro(sala).y);
});

test('AC-9.2: si el espacio no se ve en absoluto la etiqueta no se mueve', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  const vista = { x: 0, y: 0, w: 4, h: 4 }; // no intersecta el rango x de la sala
  assert.ok(vista.x + vista.w <= sala.x, 'la vista no toca la sala');
  const actual = etiquetasDeEspacios(e, d, d.aparicion, vista, medir).find((t) => t.actual);
  assert.deepEqual({ x: actual.x, y: actual.y }, centro(sala));
});

test('AC-9.2: dentro de un baño interno la etiqueta actual es la del baño', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx);
  const d = generarDistribucion(e);
  const bano = banoDe(e, espaciosDeTipo(e, 'dormitorio')[0].id);
  const casilla = casillaDe(d, bano.id);
  assert.ok(casilla, 'el baño interno tiene casillas transitables');
  const actuales = etiquetasDeEspacios(e, d, casilla, null).filter((t) => t.actual);
  assert.deepEqual(actuales.map((t) => t.clave), [bano.id]);
});

test('AC-9.2: en un pasillo ninguna etiqueta es la actual (los pasillos no tienen nombre)', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'oficina');
  const d = generarDistribucion(e);
  const casilla = casillaDe(d, 'pasillo:der');
  assert.ok(casilla, 'hay un pasillo derecho transitable');
  const etiquetas = etiquetasDeEspacios(e, d, casilla, null);
  assert.equal(etiquetas.length, 6);
  assert.ok(etiquetas.every((t) => !t.actual));
});

test('etiquetasDeEspacios es pura y determinista', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const vista = { x: 8, y: 0, w: 6, h: 8 };
  const copia = structuredClone({ e, d });
  const a = etiquetasDeEspacios(e, d, d.aparicion, vista, medir);
  const b = etiquetasDeEspacios(e, d, d.aparicion, vista, medir);
  assert.deepEqual(a, b);
  assert.deepEqual({ e, d }, copia); // no muta sus entradas
});
