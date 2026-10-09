// test/catalogo.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASPECTOS, DATOS_ASPECTO, ESPECIES, DATOS_ESPECIE, SUGERENCIAS, ICONOS, MAX_NOMBRE_ACTIVIDAD,
} from '../src/catalogo.js';

test('AC-5.9: los aspectos masculinos comparten color, los femeninos otro y el neutro un tercero, todos distintos', () => {
  const color = (clave) => DATOS_ASPECTO[clave].color;
  assert.equal(new Set(['adulto', 'nino', 'anciano'].map(color)).size, 1);
  assert.equal(new Set(['adulta', 'nina', 'anciana'].map(color)).size, 1);
  assert.equal(new Set([color('adulto'), color('adulta'), color('neutro')]).size, 3);
});

test('AC-5.9: un niño o una niña se dibuja más pequeño que un adulto; un anciano o una anciana, igual', () => {
  const escala = (clave) => DATOS_ASPECTO[clave].escala;
  assert.ok(escala('nino') < escala('adulto') && escala('nina') < escala('adulta'));
  assert.equal(escala('anciano'), escala('adulto'));
  assert.equal(escala('anciana'), escala('adulta'));
  assert.equal(escala('neutro'), escala('adulto'));
  assert.deepEqual(Object.values(ASPECTOS), ['Adulto', 'Adulta', 'Niño', 'Niña', 'Anciano', 'Anciana', 'Neutro']);
});

test('AC-6.4: las seis especies tienen un color propio y sus etiquetas', () => {
  assert.equal(new Set(Object.values(DATOS_ESPECIE).map((d) => d.color)).size, 6);
  assert.deepEqual(Object.values(ESPECIES), ['Perro', 'Gato', 'Conejo', 'Hámster', 'Loro', 'Otro']);
});

test('AC-8.4: las diez sugerencias, con su icono, nombres de a lo sumo 30 caracteres y sin repetir', () => {
  assert.deepEqual(SUGERENCIAS.map((s) => [s.nombre, s.icono]), [
    ['Lavar platos', 'platos'], ['Barrer', 'barrer'], ['Trapear', 'limpiar'], ['Limpiar el baño', 'limpiar'], ['Lavar ropa', 'ropa'],
    ['Sacar la basura', 'basura'], ['Hacer compras', 'compras'], ['Regar las plantas', 'plantas'],
    ['Dar de comer a la mascota', 'mascota'], ['Pasear al perro', 'mascota'],
  ]);
  assert.ok(SUGERENCIAS.every((s) => s.nombre.length <= MAX_NOMBRE_ACTIVIDAD && Object.hasOwn(ICONOS, s.icono)));
  assert.equal(new Set(SUGERENCIAS.map((s) => s.nombre.toLocaleLowerCase('es'))).size, SUGERENCIAS.length);
});
