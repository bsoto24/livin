// test/arte.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS, PIEZAS, CENTRO } from '../src/catalogo.js';
import { TAM, FAMILIAS, PALETA } from '../src/arte/paleta.js';
import { SUELOS, PAREDES } from '../src/arte/texturas.js';
import { MUEBLES, EJE_DE_PIEZA, LETRAS_MUEBLE } from '../src/arte/mobiliario.js';

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

const SOLO_UNA_CASILLA = ['n', 's', 'K', 'R', 'L', 'W', 'w', 'U', 'e', 'P', 'o'];
const VARIANTES = { B: ['inicio', 'fin'], S: ['inicio', 'medio', 'fin'], T: ['inicio', 'fin'], M: ['inicio', 'medio', 'fin'], E: ['inicio', 'fin'], V: ['inicio', 'fin'] };

test('AC-4.1: hay dibujo para cada una de las 17 piezas de la leyenda y ninguna repite el de otra', () => {
  const filas = [
    ...Object.values(PIEZAS).flatMap((p) => [...p.filas, ...(p.conBano ? p.conBano.filas : [])]),
    ...CENTRO.comedor, ...CENTRO.sala, CENTRO.salaEstirable, CENTRO.paredSuperior, CENTRO.paredInferior,
  ];
  const enLaLeyenda = [...new Set(filas.join(''))].filter((c) => !'#. *'.includes(c)).sort();
  assert.equal(enLaLeyenda.length, 17);
  assert.deepEqual([...LETRAS_MUEBLE].sort(), enLaLeyenda);
  const base = (letra) => (MUEBLES[`${letra}:unico`] ?? MUEBLES[`${letra}:inicio`]).join('\n');
  assert.equal(new Set(LETRAS_MUEBLE.map(base)).size, 17);
});

test('AC-4.2 y AC-4.3: las piezas de una casilla tienen un dibujo y las de varias casillas tienen sus variantes de borde', () => {
  const esperadas = [
    ...SOLO_UNA_CASILLA.map((l) => `${l}:unico`),
    ...Object.entries(VARIANTES).flatMap(([l, vs]) => vs.map((v) => `${l}:${v}`)),
  ];
  assert.deepEqual(Object.keys(MUEBLES).sort(), esperadas.sort());
  assert.deepEqual(Object.keys(EJE_DE_PIEZA).sort(), Object.keys(VARIANTES).sort());
  assert.equal(EJE_DE_PIEZA.B, 'vertical');
  for (const l of Object.keys(VARIANTES).filter((v) => v !== 'B')) assert.equal(EJE_DE_PIEZA[l], 'horizontal');
});

test('AC-1.2 y AC-1.3: cada dibujo de mueble mide 16×16 y usa solo la paleta', () => {
  for (const [clave, g] of Object.entries(MUEBLES)) {
    verificarCuadricula(`mueble ${clave}`, g, { opaca: false });
    assert.ok(g.some((fila) => /[^.]/.test(fila)), `mueble ${clave}: vacío`);
  }
});

test('AC-4.3: los bordes de unión de las variantes coinciden, de modo que la pieza se ve como un solo objeto', () => {
  const opacas = (celdas) => celdas.map((c) => c !== '.');
  const columna = (g, x) => opacas(g.map((fila) => fila[x]));
  const fila = (g, y) => opacas([...g[y]]);
  const siguientes = { inicio: ['medio', 'fin'], medio: ['medio', 'fin'] };
  for (const [letra, variantes] of Object.entries(VARIANTES)) {
    for (const [desde, hacia] of Object.entries(siguientes)) {
      if (!variantes.includes(desde)) continue;
      for (const a of hacia.filter((v) => variantes.includes(v))) {
        const izquierda = MUEBLES[`${letra}:${desde}`];
        const derecha = MUEBLES[`${letra}:${a}`];
        const [borde, siguiente] = EJE_DE_PIEZA[letra] === 'vertical'
          ? [fila(izquierda, 15), fila(derecha, 0)]
          : [columna(izquierda, 15), columna(derecha, 0)];
        assert.deepEqual(borde, siguiente, `${letra}: ${desde} no encaja con ${a}`);
        assert.ok(borde.some(Boolean), `${letra}: ${desde} no tiene borde de unión`);
      }
    }
  }
});
