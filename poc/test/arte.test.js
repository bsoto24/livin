// test/arte.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS } from '../src/catalogo.js';
import { TAM, FAMILIAS, PALETA } from '../src/arte/paleta.js';
import { SUELOS, PAREDES } from '../src/arte/texturas.js';

// Comprueba que un dibujo mide TAM×TAM y solo usa claves de la paleta (o '.' si admite transparencia).
export function verificarCuadricula(nombre, cuadricula, { opaca }) {
  assert.equal(cuadricula.length, TAM, `${nombre}: alto`);
  for (const fila of cuadricula) {
    assert.equal(fila.length, TAM, `${nombre}: ancho`);
    for (const c of fila) {
      assert.ok(c === '.' || c in PALETA, `${nombre}: la clave ${c} no está en la paleta`);
      if (opaca) assert.notEqual(c, '.', `${nombre}: píxel transparente`);
    }
  }
}

test('AC-1.1: la paleta tiene 32 colores en 11 familias, con claves y valores únicos', () => {
  assert.equal(FAMILIAS.length, 11);
  const claves = FAMILIAS.flatMap((f) => Object.keys(f.colores));
  assert.equal(claves.length, 32);
  assert.equal(new Set(claves).size, 32);
  assert.equal(Object.keys(PALETA).length, 32);
  assert.equal(new Set(Object.values(PALETA)).size, 32);
  for (const [clave, valor] of Object.entries(PALETA)) {
    assert.equal(clave.length, 1);
    assert.notEqual(clave, '.');
    assert.match(valor, /^#[0-9a-f]{6}$/);
  }
});

test('AC-1.2, AC-1.3 y AC-1.4: los suelos y las paredes miden 16×16, usan la paleta y no tienen transparencia', () => {
  for (const [tipo, g] of Object.entries(SUELOS)) verificarCuadricula(`suelo ${tipo}`, g, { opaca: true });
  for (const [vista, g] of Object.entries(PAREDES)) verificarCuadricula(`pared ${vista}`, g, { opaca: true });
});

test('AC-2.1: hay un suelo para cada tipo de espacio y para el pasillo, y no hay dos iguales', () => {
  assert.deepEqual(Object.keys(SUELOS).sort(), [...TIPOS, 'pasillo'].sort());
  assert.equal(new Set(Object.values(SUELOS).map((g) => g.join('\n'))).size, 9);
  assert.notEqual(PAREDES.frente.join('\n'), PAREDES.cima.join('\n'));
});
