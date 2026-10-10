// test/caminar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REPOSO, vistaDeDireccion, direccionDelPaso, otroPie, pasoNuevo, mirarHacia, progresoDelPaso, cuadroDeCaminar,
} from '../src/arte/caminar.js';

test('AC-4.1: cada dirección tiene su vista y la izquierda es la de lado volteada', () => {
  assert.deepEqual(vistaDeDireccion('abajo'), { vista: 'frente', volteada: false });
  assert.deepEqual(vistaDeDireccion('arriba'), { vista: 'espalda', volteada: false });
  assert.deepEqual(vistaDeDireccion('derecha'), { vista: 'lado', volteada: false });
  assert.deepEqual(vistaDeDireccion('izquierda'), { vista: 'lado', volteada: true });
});

test('AC-4.2 y AC-4.3: la dirección sale del desplazamiento entre casillas vecinas', () => {
  const desde = { x: 5, y: 5 };
  assert.equal(direccionDelPaso(desde, { x: 6, y: 5 }), 'derecha');
  assert.equal(direccionDelPaso(desde, { x: 4, y: 5 }), 'izquierda');
  assert.equal(direccionDelPaso(desde, { x: 5, y: 6 }), 'abajo');
  assert.equal(direccionDelPaso(desde, { x: 5, y: 4 }), 'arriba');
  assert.equal(direccionDelPaso(desde, { x: 5, y: 5 }), null); // sin desplazamiento
  assert.equal(direccionDelPaso(desde, { x: 7, y: 9 }), null); // reaparición en otra casilla
  assert.equal(direccionDelPaso(desde, { x: 6, y: 6 }), null); // en diagonal no hay paso
});

test('AC-5.1 y AC-5.3: en la primera mitad del paso se ve el pie; en la segunda y fuera de un paso, parado', () => {
  const registro = pasoNuevo(REPOSO, 'derecha', 1000, 500);
  assert.equal(progresoDelPaso(registro, 1000), 0);
  assert.equal(progresoDelPaso(registro, 1125), 0.25);
  assert.equal(progresoDelPaso(registro, 1500), null); // el paso terminó
  assert.equal(progresoDelPaso(REPOSO, 1200), null); // no está dando un paso
  assert.equal(cuadroDeCaminar(0, 1), 1);
  assert.equal(cuadroDeCaminar(0.49, 2), 2);
  assert.equal(cuadroDeCaminar(0.5, 1), 0);
  assert.equal(cuadroDeCaminar(0.99, 1), 0);
  assert.equal(cuadroDeCaminar(null, 1), 0);
  assert.equal(cuadroDeCaminar(progresoDelPaso(registro, 1249), registro.pie), registro.pie);
  assert.equal(cuadroDeCaminar(progresoDelPaso(registro, 1250), registro.pie), 0);
});

test('AC-5.2: el pie alterna en cada paso nuevo', () => {
  assert.equal(otroPie(1), 2);
  assert.equal(otroPie(2), 1);
  const primero = pasoNuevo(REPOSO, 'abajo', 0, 500);
  const segundo = pasoNuevo(primero, 'abajo', 500, 500);
  const tercero = pasoNuevo(segundo, 'izquierda', 1000, 500);
  assert.notEqual(primero.pie, segundo.pie);
  assert.equal(tercero.pie, primero.pie);
  assert.deepEqual(tercero, { direccion: 'izquierda', pie: primero.pie, inicio: 1000, duracion: 500 });
});

test('AC-4.4, AC-4.6 y AC-4.7: girar sin moverse deja parado y conserva el pie; el reposo mira de frente', () => {
  assert.deepEqual(REPOSO, { direccion: 'abajo', pie: 2, inicio: null, duracion: 0 });
  assert.equal(vistaDeDireccion(REPOSO.direccion).vista, 'frente');
  const enPaso = pasoNuevo(REPOSO, 'derecha', 0, 250);
  const girado = mirarHacia(enPaso, 'arriba');
  assert.equal(girado.direccion, 'arriba');
  assert.equal(girado.pie, enPaso.pie);
  assert.equal(progresoDelPaso(girado, 100), null);
  assert.equal(cuadroDeCaminar(progresoDelPaso(girado, 100), girado.pie), 0);
});
