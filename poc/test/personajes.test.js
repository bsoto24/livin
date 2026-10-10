// test/personajes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { crearHogarInicial, agregarHabitante, esPropietario } from '../src/hogar.js';
import { PALETA } from '../src/arte/paleta.js';
import { VISTAS, CUADROS, PERSONAJES, CUADROS_DE_PERSONAJES, claveDeCuadro, personajeDe } from '../src/arte/personajes.js';
import { crearCtx } from './ayuda.js';

const CLAVES = ['protagonista', ...Object.keys(ASPECTOS), ...Object.keys(ESPECIES)];
const texto = (g) => g.join('\n');
const altura = (g) => {
  const filas = g.map((fila, y) => (/[^.]/.test(fila) ? y : null)).filter((y) => y !== null);
  return filas.at(-1) - filas[0] + 1;
};
const pixelesDeColor = (g) => g.join('').replace(/\./g, '').length;
const todosLosCuadros = () => Object.entries(PERSONAJES).flatMap(([p, vistas]) =>
  Object.entries(vistas).flatMap(([v, cuadros]) => cuadros.map((g, c) => [`${p} ${v} ${c}`, g])));
const miembro = (datos) => ({ cuentaId: null, aspecto: null, especie: null, ...datos });

test('AC-1.1: hay 14 personajes: el protagonista, los siete aspectos y las seis especies', () => {
  assert.equal(CLAVES.length, 14);
  assert.deepEqual(Object.keys(PERSONAJES).sort(), [...CLAVES].sort());
});

test('AC-1.2: cada personaje tiene 9 cuadros, tres por vista, y ninguno para la izquierda', () => {
  for (const clave of CLAVES) {
    assert.deepEqual(Object.keys(PERSONAJES[clave]), VISTAS, clave);
    for (const vista of VISTAS) assert.equal(PERSONAJES[clave][vista].length, CUADROS.length, `${clave} ${vista}`);
  }
  assert.equal(Object.keys(CUADROS_DE_PERSONAJES).length, 126);
  assert.equal(claveDeCuadro('perro', 'frente', 0), 'personaje:perro:frente:0');
  assert.equal(CUADROS_DE_PERSONAJES[claveDeCuadro('nina', 'lado', 2)], PERSONAJES.nina.lado[2]);
  assert.ok(Object.keys(CUADROS_DE_PERSONAJES).every((k) => !k.includes('izquierda')));
});

test('AC-1.3 y AC-1.4: cada cuadro mide 16×16 y solo usa la paleta o el transparente', () => {
  for (const [nombre, g] of todosLosCuadros()) {
    assert.equal(g.length, 16, `${nombre}: alto`);
    for (const fila of g) {
      assert.equal(fila.length, 16, `${nombre}: ancho`);
      for (const c of fila) assert.ok(c === '.' || c in PALETA, `${nombre}: la clave ${c} no está en la paleta`);
    }
  }
});

test('AC-1.5: cada cuadro tiene transparencia, color y contorno', () => {
  for (const [nombre, g] of todosLosCuadros()) {
    const pixeles = g.join('');
    assert.ok(pixeles.includes('.'), `${nombre}: sin transparencia`);
    assert.ok(/[^.]/.test(pixeles), `${nombre}: vacío`);
    assert.ok(pixeles.includes('k'), `${nombre}: sin contorno`);
  }
});

test('AC-1.6: en cada vista, el parado y los dos pasos son tres dibujos distintos', () => {
  for (const clave of CLAVES) for (const vista of VISTAS) {
    assert.equal(new Set(PERSONAJES[clave][vista].map(texto)).size, 3, `${clave} ${vista}`);
  }
});

test('AC-1.7: las tres vistas de cada personaje son distintas', () => {
  for (const clave of CLAVES) assert.equal(new Set(VISTAS.map((v) => texto(PERSONAJES[clave][v][0]))).size, 3, clave);
});

test('AC-1.8: no hay dos personajes con el mismo cuadro parado de frente', () => {
  assert.equal(new Set(CLAVES.map((c) => texto(PERSONAJES[c].frente[0]))).size, 14);
});

test('AC-2.1: el niño y la niña son al menos dos filas más bajos que el adulto, el neutro y el protagonista', () => {
  for (const nino of ['nino', 'nina']) for (const mayor of ['adulto', 'neutro', 'protagonista']) {
    assert.ok(altura(PERSONAJES[nino].frente[0]) <= altura(PERSONAJES[mayor].frente[0]) - 2, `${nino} frente a ${mayor}`);
  }
});

test('AC-2.2: el hámster es más pequeño que el perro', () => {
  assert.ok(pixelesDeColor(PERSONAJES.hamster.frente[0]) < pixelesDeColor(PERSONAJES.perro.frente[0]));
});

test('AC-3.1 a AC-3.4: el propietario es el protagonista; familiares y mascotas usan su aspecto o su especie', () => {
  const ctx = crearCtx();
  const estado = crearHogarInicial(ctx);
  assert.equal(personajeDe(estado, estado.miembros.find((m) => esPropietario(estado, m))), 'protagonista');
  for (const aspecto of Object.keys(ASPECTOS)) assert.equal(personajeDe(estado, miembro({ tipo: 'persona', aspecto })), aspecto);
  for (const especie of Object.keys(ESPECIES)) assert.equal(personajeDe(estado, miembro({ tipo: 'mascota', especie })), especie);
  let r = agregarHabitante(estado, 'familiar', { nombre: 'Ana', aspecto: 'adulta' }, ctx);
  r = agregarHabitante(r.estado, 'familiar', { nombre: 'Bea', aspecto: 'adulta' }, ctx);
  const [ana, bea] = r.estado.miembros.filter((m) => m.aspecto === 'adulta');
  assert.notEqual(ana.id, bea.id);
  assert.equal(personajeDe(r.estado, ana), personajeDe(r.estado, bea)); // AC-3.4: no depende del nombre ni del id
});

test('Error: un miembro sin personaje usa el de respaldo de su clase, y elegir no modifica el estado', () => {
  const estado = crearHogarInicial(crearCtx());
  const copia = structuredClone(estado);
  assert.equal(personajeDe(estado, miembro({ tipo: 'persona', aspecto: 'pirata' })), 'neutro');
  assert.equal(personajeDe(estado, miembro({ tipo: 'persona', aspecto: 'protagonista' })), 'neutro');
  assert.equal(personajeDe(estado, miembro({ tipo: 'mascota', especie: 'dragon' })), 'otro');
  personajeDe(estado, estado.miembros[0]);
  assert.deepEqual(estado, copia);
});
