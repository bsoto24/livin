# Implementation Plan: Base visual y mundo

**Spec:** docs/specs/008-base-visual-y-mundo/spec.md (v1.0.0)
**Decisions:** docs/adr/008-arte-cuadriculas-con-paleta.md
**Created:** 2026-10-09

No hay `data-model.md`: la feature no guarda datos nuevos ni cambia el documento guardado (FR-9).

## Global Constraints

- **Paleta única (FR-1):** 32 colores en 11 familias, la clave es un carácter y `.` es el píxel transparente. Contorno y pared: `k` `#2e2233`, `a` `#4f4260`, `b` `#7a6a8c`, `c` `#a799b8`. Madera: `d` `#b87f48`, `e` `#d9a066`, `f` `#ecc99a`. Azul: `i` `#3f5fb0`, `g` `#5b7fd6`, `h` `#8fb0f0`. Rosa: `m` `#d4537e`, `n` `#e888a8`, `y` `#e9d6dc`, `Y` `#dcc0c9`. Verde: `o` `#5fa05a`, `p` `#8bc27d`. Neutros: `j` `#f4f1ea`, `l` `#cfc8b8`, `s` `#9aa5ad`, `v` `#c4ccd1`. Azulejo: `t` `#cfe3ea`, `u` `#a9c9d6`. Lavanda: `w` `#dcd8ea`, `x` `#bdb7d6`. Arena y piedra: `z` `#eadfcf`, `A` `#d4c3a8`, `B` `#d6d1c4`, `C` `#b9b3a3`. Verde grisáceo: `D` `#dde3d6`, `E` `#c3ccba`. Acento: `q` `#c0392b`, `r` `#f2c14e`. Ningún dibujo usa un color fuera de ella; el arte no se guarda en el documento del hogar.
- **Dibujos (ADR-008):** cuadrículas de 16×16 píxeles (lista de 16 cadenas de 16 caracteres). Suelos y paredes sin píxeles transparentes; el mobiliario sí tiene transparencia, de modo que se ve el suelo debajo. Los módulos de `src/arte/` son datos y funciones puras: no importan Phaser ni tocan el DOM; ni el dominio ni el generador importan `src/arte/`.
- **Suelos (FR-2):** nueve, claves `sala`, `comedor`, `cocina`, `bano`, `lavanderia`, `mascota`, `dormitorio`, `oficina` y `pasillo`; dos casillas del mismo tipo se ven sin costura; ningún par repite dibujo. El suelo de una casilla sale del tipo del espacio al que pertenece según `espacioEn` (el baño interno es `bano`; las claves `pasillo:*` son `pasillo`; la entrada y la aparición son de la sala), nunca del nombre.
- **Paredes (FR-3):** vista `frente` si la casilla de debajo existe y no es `#` ni ` `; `cima` en cualquier otro caso. Una puerta (casilla `.` dentro de una pared) se dibuja como suelo.
- **Mobiliario (FR-4):** las 17 letras de la leyenda de `catalogo.js` (`B n S T M s K R L W w U E e V P o`). Clave `<letra>:<variante>`; `unico` para las piezas de una casilla (incluida la silla de comedor `s`, una por casilla) y `inicio`/`medio`/`fin` para las que son un solo objeto de varias casillas: `B` en vertical; `S`, `T`, `M`, `E` y `V` en horizontal. Sofá y mesa de comedor tienen los tres; cama, mesa de centro, escritorio y lavadora, `inicio` y `fin`.
- **Elección del arte (FR-5):** `arteDelMapa(estado, distribucion)` es pura y determinista; cada casilla es `null` (vacío) o `{ base, mueble }` con claves de textura (`suelo:<tipo>`, `pared:frente`, `pared:cima`, `mueble:<letra>:<variante>`). Una letra sin arte deja el suelo y no el mueble; no hay color de respaldo. No cambia el generador, el modelo ni el documento guardado.
- **Capas (FR-6), de abajo arriba:** suelo y paredes y mobiliario (profundidad 0), objetos del suelo según el estado de limpieza (1), etiquetas e insignias de los espacios (5), habitantes (10), nombres de los habitantes (20), burbujas y cartel (30). Los habitantes, los objetos del suelo, las insignias, las burbujas y los colores de la interfaz HTML no cambian.
- **Tipografía (FR-7):** Silkscreen (SIL Open Font License) servida con el juego desde `poc/assets/fonts/`, sin servidores externos; pila `"Silkscreen, system-ui, sans-serif"` (la fuente del sistema cubre cualquier letra que falte). Se usa en las etiquetas de nombre, las insignias y el cartel del mapa, en el texto de las pestañas de la barra (8 px, puede partirse en dos líneas) y en el título de cada drawer (16 px); la etiqueta del mapa parte de 12 px y se ajusta con la medida del teléfono. Campos de texto, listas, chips, fichas, hojas, historial, selectores y burbujas siguen con la fuente del sistema. Se espera la fuente hasta 1 segundo; pasado ese tiempo se sigue con la del sistema. La etiqueta de quien juega conserva su fondo de color y ya no va en negrita.
- **Rendimiento (FR-8):** 60 cuadros por segundo con la carga completa (8 familiares, 4 mascotas, 50 actividades, 200 entradas); cada cambio del modo edición se ve en menos de 100 ms y no empeora los 62,7 ms de la 007; los dibujos se preparan una sola vez al arrancar en menos de 300 ms; píxeles nítidos a cualquier zoom.
- **Compatibilidad (FR-9):** documento `version: 7` en la misma clave `livin:datos:v1`, sin tocar `almacen.js`, `hogar.js`, `catalogo.js`, `distribucion.js`, `posicion.js` ni `movimiento.js`; las suites 001 a 007 (346 pruebas) pasan sin cambiar sus expectativas.
- **Procedencia (FR-10):** todo el arte es original; la única pieza externa es la fuente, con su licencia y su origen junto al archivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs. Los textos del usuario se muestran siempre como texto.

**Pre-implementation gates:**
- *Simplicity:* 3 componentes. Dominio y generador (sin cambios), arte (`src/arte/`, nuevo: datos y lógica pura) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* el arte son cuadrículas de texto y objetos planos; Phaser (`RenderTexture`, `CanvasTexture`) y el DOM se usan directamente, sin envoltorios ni modelos intermedios. ✓
- *Integration-First:* los contratos (exportaciones de `src/arte/` y forma de `arteDelMapa`) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que el hogar se vea como un videojuego GBA: suelos con textura por tipo de espacio, paredes de frente o desde arriba, las 17 piezas de mobiliario con forma, y letra pixel Silkscreen en el mapa, la barra y los títulos, sin cambiar ninguna regla del juego. La lógica queda cubierta por pruebas automáticas (346 existentes + 21 nuevas = 367).

Archivos (bajo `poc/`):
- **Arte (nuevo, `src/arte/`):** `paleta.js`, `lienzo.js`, `texturas.js`, `mobiliario.js`, `casillas.js`.
- **Presentación:** `src/juego.js`, `index.html`, `assets/fonts/silkscreen-latin.woff2`, `assets/fonts/OFL.txt`, `assets/fonts/LEEME.md`.
- **Pruebas en `test/`:** `contrato-arte.test.js`, `arte.test.js`, `casillas.test.js`, `tipografia.test.js` (nuevos); `ayuda.js` y `distribucion.test.js` (el generador de las 7.560 combinaciones pasa a `ayuda.js` para compartirlo, sin cambiar sus expectativas).

> **Nota sobre los dibujos.** El ADR-008 fija el formato (cuadrículas de texto de 16×16 con la paleta). Los dibujos se arman con primitivas de rectángulo (`rect`, `caja`, `patron` de `lienzo.js`) en lugar de escribirse a mano: 36 cuadrículas literales ocuparían unas 600 líneas y se retocan mejor con coordenadas. Lo que exportan los módulos sigue siendo texto de 16×16, que es lo que prueban las suites y lo que reutilizarán las features 009 y 010. Los dibujos son la primera versión: la Fase 6 los revisa a simple vista en el navegador y se ajustan ahí si hace falta.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1, FR-2, FR-3, FR-4, FR-5 (contrato) | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/contrato-arte.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de nombres exportados por `src/arte/paleta.js` (`TAM`, `FAMILIAS`, `PALETA`), `src/arte/lienzo.js` (`lienzo`, `rect`, `caja`, `cuadricula`, `patron`), `src/arte/texturas.js` (`SUELOS`, `PAREDES`), `src/arte/mobiliario.js` (`MUEBLES`, `EJE_DE_PIEZA`, `LETRAS_MUEBLE`) y `src/arte/casillas.js` (`TEXTURAS`, `arteDelMapa`, `vistaDePared`, `varianteDeMueble`).

Fija la forma pública del arte antes de implementarlo. La prueba queda en rojo (`ERR_MODULE_NOT_FOUND`) hasta el final de la Fase 3; las Fases 1 a 3 se verifican con sus propios archivos de prueba.

- [ ] Escribir la prueba de contrato:
```js
// test/contrato-arte.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as paleta from '../src/arte/paleta.js';
import * as lienzo from '../src/arte/lienzo.js';
import * as texturas from '../src/arte/texturas.js';
import * as mobiliario from '../src/arte/mobiliario.js';
import * as casillas from '../src/arte/casillas.js';

test('contrato del arte: paleta, herramientas, suelos, paredes y mobiliario', () => {
  assert.equal(paleta.TAM, 16);
  assert.ok(Array.isArray(paleta.FAMILIAS));
  assert.equal(typeof paleta.PALETA, 'object');
  for (const nombre of ['lienzo', 'rect', 'caja', 'cuadricula', 'patron']) assert.equal(typeof lienzo[nombre], 'function', nombre);
  assert.equal(typeof texturas.SUELOS, 'object');
  assert.deepEqual(Object.keys(texturas.PAREDES).sort(), ['cima', 'frente']);
  assert.equal(typeof mobiliario.MUEBLES, 'object');
  assert.equal(typeof mobiliario.EJE_DE_PIEZA, 'object');
  assert.ok(Array.isArray(mobiliario.LETRAS_MUEBLE));
});

test('contrato de la elección del arte: texturas por clave y mapa de casillas', () => {
  assert.equal(typeof casillas.TEXTURAS, 'object');
  for (const nombre of ['arteDelMapa', 'vistaDePared', 'varianteDeMueble']) assert.equal(typeof casillas[nombre], 'function', nombre);
});
```
- [ ] Run: `cd poc && node --test test/contrato-arte.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/paleta.js`)
- [ ] Commit: `test(poc): add contract tests for the pixel art` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 008-base-visual-y-mundo`)

---

## Phase 1: Paleta, herramientas de dibujo, suelos y paredes

**Implements:** FR-1, FR-2 (dibujos), FR-3 (dibujos) | **Satisfies:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-2.1
**Files:** `poc/src/arte/paleta.js`, `poc/src/arte/lienzo.js`, `poc/src/arte/texturas.js`, `poc/test/arte.test.js`
**Interfaces:** Consumes: `TIPOS` de `src/catalogo.js`. Produces: `TAM`, `FAMILIAS` (`[{ nombre, colores: { clave: '#rrggbb' } }]`) y `PALETA` (`{ clave: '#rrggbb' }`); `lienzo()` (16×16 de `.`), `rect(l, x0, y0, x1, y1, c)`, `caja(l, x0, y0, x1, y1, relleno, borde = 'k')`, `cuadricula(l)` (lienzo → lista de 16 cadenas) y `patron((x, y) => clave)` (lista de 16 cadenas); `SUELOS` (`{ [tipo]: cuadricula }`, nueve claves) y `PAREDES` (`{ frente, cima }`).

La paleta y las herramientas son la base de todo el arte; los suelos y las paredes son patrones por píxel, sin transparencia.

- [ ] Escribir las pruebas:
```js
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
```
- [ ] Run: `cd poc && node --test test/arte.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/paleta.js`)
- [ ] Implementar la paleta:
```js
// src/arte/paleta.js
export const TAM = 16; // lado de una casilla y de cada dibujo, en píxeles

// Paleta única (FR-1 de la 008, ADR-008): 32 colores en 11 familias. La clave de un carácter identifica el color en las cuadrículas;
// '.' queda reservado para el píxel transparente. Las features 009 y 010 la reutilizan y pueden ampliarla, no sustituirla.
export const FAMILIAS = [
  { nombre: 'Contorno y pared', colores: { k: '#2e2233', a: '#4f4260', b: '#7a6a8c', c: '#a799b8' } },
  { nombre: 'Madera', colores: { d: '#b87f48', e: '#d9a066', f: '#ecc99a' } },
  { nombre: 'Azul', colores: { i: '#3f5fb0', g: '#5b7fd6', h: '#8fb0f0' } },
  { nombre: 'Rosa', colores: { m: '#d4537e', n: '#e888a8', y: '#e9d6dc', Y: '#dcc0c9' } },
  { nombre: 'Verde', colores: { o: '#5fa05a', p: '#8bc27d' } },
  { nombre: 'Neutros', colores: { j: '#f4f1ea', l: '#cfc8b8', s: '#9aa5ad', v: '#c4ccd1' } },
  { nombre: 'Azulejo', colores: { t: '#cfe3ea', u: '#a9c9d6' } },
  { nombre: 'Lavanda', colores: { w: '#dcd8ea', x: '#bdb7d6' } },
  { nombre: 'Arena y piedra', colores: { z: '#eadfcf', A: '#d4c3a8', B: '#d6d1c4', C: '#b9b3a3' } },
  { nombre: 'Verde grisáceo', colores: { D: '#dde3d6', E: '#c3ccba' } },
  { nombre: 'Acento', colores: { q: '#c0392b', r: '#f2c14e' } },
];
export const PALETA = Object.fromEntries(FAMILIAS.flatMap((f) => Object.entries(f.colores)));
```
- [ ] Implementar las herramientas de dibujo:
```js
// src/arte/lienzo.js
import { TAM } from './paleta.js';

// Herramientas para armar cuadrículas de texto de TAM×TAM (ADR-008): una lista de TAM cadenas de TAM caracteres, cada uno una clave
// de la paleta, con '.' para el píxel transparente. Un lienzo es una matriz de caracteres que se pinta con `rect` y `caja`.
export const lienzo = () => Array.from({ length: TAM }, () => Array(TAM).fill('.'));

// Rectángulo relleno, con los extremos incluidos.
export function rect(l, x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) l[y][x] = c;
}

// Rectángulo relleno con un borde de un píxel.
export function caja(l, x0, y0, x1, y1, relleno, borde = 'k') {
  rect(l, x0, y0, x1, y1, borde);
  rect(l, x0 + 1, y0 + 1, x1 - 1, y1 - 1, relleno);
}

export const cuadricula = (l) => l.map((fila) => fila.join(''));

// Cuadrícula calculada píxel a píxel: `clave(x, y)` devuelve la clave de la paleta de cada píxel.
export const patron = (clave) => Array.from({ length: TAM }, (_, y) => Array.from({ length: TAM }, (_, x) => clave(x, y)).join(''));
```
- [ ] Implementar los suelos y las paredes:
```js
// src/arte/texturas.js
import { patron } from './lienzo.js';

// Ruido determinista para las motas: el mismo píxel da siempre el mismo valor.
const ruido = (x, y) => (x * 7 + y * 13 + x * y * 3) % 11;

// Un suelo por tipo de espacio y uno para el pasillo (FR-2 de la 008). Cada patrón se repite sin costura al ponerse casilla con casilla.
export const SUELOS = {
  sala: patron((x, y) => { // madera cálida en tablas horizontales
    if (y % 8 === 7 || (x + (y >> 3) * 5) % 16 === 0) return 'd';
    return y % 8 === 0 && x % 6 < 3 ? 'f' : 'e';
  }),
  comedor: patron((x, y) => ((x % 8 === 7 || (y + (x >> 3) * 5) % 16 === 0) ? 'e' : 'f')), // madera clara en tablas verticales
  cocina: patron((x, y) => { // baldosa en damero con junta gris azulada
    if (x % 8 === 7 || y % 8 === 7) return 's';
    return ((x >> 3) + (y >> 3)) % 2 ? 'v' : 'j';
  }),
  bano: patron((x, y) => ((x % 4 === 3 || y % 4 === 3) ? 'u' : 't')), // azulejo pequeño
  lavanderia: patron((x, y) => (ruido(x, y) % 9 === 0 ? 'E' : 'D')), // concreto verdoso moteado
  mascota: patron((x, y) => ((x + 2 * y) % 9 === 0 ? 'A' : 'z')), // paja con motas
  dormitorio: patron((x, y) => ((x + y) % 4 === 0 ? 'Y' : 'y')), // alfombra rosa tejida
  oficina: patron((x, y) => ((x % 4 === 0 || y % 4 === 0) ? 'x' : 'w')), // alfombra lavanda cuadriculada
  pasillo: patron((x, y) => { // piedra con juntas
    if (y % 8 === 7) return 'C';
    return (x + ((y >> 3) % 2) * 8) % 16 === 15 ? 'C' : 'B';
  }),
};

// Las dos vistas de una casilla de pared (FR-3 de la 008): de frente, con borde claro arriba, ladrillo y zócalo; y desde arriba.
export const PAREDES = {
  frente: patron((x, y) => {
    if (y < 2) return 'c';
    if (y >= 14) return 'k';
    if (y >= 12) return 'a';
    if (y % 6 === 5) return 'a';
    return (x + (Math.floor(y / 6) % 2) * 8) % 16 === 0 ? 'a' : 'b';
  }),
  cima: patron((x, y) => {
    if (y === 0 || y === 15 || x === 0 || x === 15) return 'k';
    return y === 1 ? 'c' : 'b';
  }),
};
```
- [ ] Run: `cd poc && node --test test/arte.test.js` — expect: PASS (3 pruebas)
- [ ] Commit: `feat(arte): add the palette, the drawing tools, the floors and the walls` (cuerpo: `Plan section: Phase 1: Paleta, herramientas de dibujo, suelos y paredes` y `Feature: 008-base-visual-y-mundo`)

---

## Phase 2: Mobiliario

**Implements:** FR-4 (dibujos) | **Satisfies:** AC-1.2, AC-1.3, AC-4.1, AC-4.2, AC-4.3
**Files:** `poc/src/arte/mobiliario.js`, `poc/test/arte.test.js`
**Interfaces:** Consumes: `lienzo`, `rect`, `caja`, `cuadricula` de `src/arte/lienzo.js`; `verificarCuadricula` de `test/arte.test.js`. Produces: `MUEBLES` (`{ '<letra>:<variante>': cuadricula }`, 25 claves), `EJE_DE_PIEZA` (`{ B: 'vertical', S|T|M|E|V: 'horizontal' }`) y `LETRAS_MUEBLE` (las 17 letras).

Las 17 piezas de la leyenda con contorno oscuro y transparencia donde se ve el suelo. Las seis piezas de varias casillas tienen variantes de borde cuyos bordes de unión coinciden, para verse como un solo objeto.

- [ ] Añadir las pruebas a `test/arte.test.js` (importar `PIEZAS` y `CENTRO` de `../src/catalogo.js` y `MUEBLES`, `EJE_DE_PIEZA`, `LETRAS_MUEBLE` de `../src/arte/mobiliario.js` en la cabecera, y poner al final del archivo):
```js
// Cabecera: sustituir la línea `import { TIPOS } from '../src/catalogo.js';` por esta, y añadir la del mobiliario.
import { TIPOS, PIEZAS, CENTRO } from '../src/catalogo.js';
import { MUEBLES, EJE_DE_PIEZA, LETRAS_MUEBLE } from '../src/arte/mobiliario.js';

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
```
- [ ] Run: `cd poc && node --test test/arte.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/mobiliario.js`)
- [ ] Implementar el mobiliario:
```js
// src/arte/mobiliario.js
import { lienzo, rect, caja, cuadricula } from './lienzo.js';

// Mobiliario (FR-4 de la 008): un dibujo por pieza de la leyenda de catalogo.js. La clave es "<letra>:<variante>". Las piezas de una
// casilla usan 'unico'; las que son un solo objeto de varias casillas usan 'inicio', 'medio' y 'fin' según sus vecinas de la misma pieza
// a lo largo de su eje. Los bordes de unión de las variantes coinciden para que se vean como un objeto.
export const EJE_DE_PIEZA = { B: 'vertical', S: 'horizontal', T: 'horizontal', M: 'horizontal', E: 'horizontal', V: 'horizontal' };

const una = (dibujar) => { const l = lienzo(); dibujar(l); return cuadricula(l); };
const sinEsquinas = (l, esquinas) => { for (const [x, y] of esquinas) l[y][x] = '.'; };

const velador = una((l) => { caja(l, 2, 3, 13, 13, 'e'); rect(l, 3, 4, 12, 4, 'f'); caja(l, 4, 8, 11, 11, 'd'); rect(l, 7, 9, 8, 10, 'r'); });
const sillaComedor = una((l) => { caja(l, 4, 2, 11, 4, 'd'); caja(l, 4, 5, 11, 12, 'e'); rect(l, 5, 6, 10, 6, 'f'); });
const cocina = una((l) => {
  caja(l, 1, 1, 14, 14, 'v');
  for (const [x, y] of [[3, 3], [9, 3], [3, 8], [9, 8]]) { caja(l, x, y, x + 3, y + 3, 's'); rect(l, x + 1, y + 1, x + 2, y + 2, 'k'); }
  rect(l, 3, 12, 12, 12, 'l');
});
const refrigeradora = una((l) => {
  caja(l, 2, 1, 13, 14, 'j');
  rect(l, 3, 2, 12, 2, 'l'); rect(l, 3, 7, 12, 7, 'l'); rect(l, 3, 13, 12, 13, 'l');
  rect(l, 11, 3, 11, 6, 's'); rect(l, 11, 9, 11, 12, 's');
});
const lavadero = una((l) => { caja(l, 1, 2, 14, 13, 's'); caja(l, 3, 4, 12, 10, 'u'); rect(l, 4, 5, 11, 9, 't'); rect(l, 7, 3, 8, 3, 'v'); });
const inodoro = una((l) => { caja(l, 4, 1, 11, 4, 'j'); caja(l, 4, 5, 11, 14, 'j'); rect(l, 6, 7, 9, 12, 'l'); });
const lavamanos = una((l) => { caja(l, 3, 3, 12, 12, 'j'); caja(l, 5, 5, 10, 10, 't'); rect(l, 7, 4, 8, 4, 's'); });
const ducha = una((l) => { caja(l, 1, 1, 14, 14, 'h'); rect(l, 2, 7, 13, 7, 'g'); rect(l, 7, 6, 8, 9, 'k'); caja(l, 2, 2, 4, 4, 's'); });
const sillaEscritorio = una((l) => { caja(l, 4, 2, 11, 4, 'a'); caja(l, 4, 5, 11, 12, 'b'); });
const camaMascota = una((l) => { caja(l, 1, 3, 14, 13, 'q'); sinEsquinas(l, [[1, 3], [14, 3], [1, 13], [14, 13]]); rect(l, 3, 5, 12, 11, 'n'); });
const plato = una((l) => { caja(l, 4, 5, 11, 11, 'r'); sinEsquinas(l, [[4, 5], [11, 5], [4, 11], [11, 11]]); rect(l, 6, 7, 9, 9, 'd'); });

// Cama de dos casillas en vertical: la de arriba lleva la cabecera y la almohada; la de abajo, el pie.
function cama(parte) {
  const l = lienzo();
  rect(l, 1, 0, 1, 15, 'k'); rect(l, 14, 0, 14, 15, 'k'); // costados
  rect(l, 2, 0, 2, 15, 'd'); rect(l, 13, 0, 13, 15, 'd'); // marco de madera
  rect(l, 3, 0, 12, 15, 'g'); // colcha
  if (parte === 'inicio') {
    rect(l, 1, 0, 14, 0, 'k');
    rect(l, 2, 1, 13, 3, 'd'); rect(l, 2, 1, 13, 1, 'e'); // cabecera
    rect(l, 4, 4, 11, 8, 'j'); rect(l, 4, 8, 11, 8, 'l'); // almohada
    rect(l, 3, 9, 12, 9, 'i'); rect(l, 3, 10, 12, 10, 'h'); // doblez de la colcha
  } else {
    rect(l, 3, 1, 12, 1, 'h'); rect(l, 3, 6, 12, 6, 'i'); // pliegues
    rect(l, 2, 12, 13, 14, 'd'); // pie de la cama
    rect(l, 1, 15, 14, 15, 'k'); rect(l, 1, 12, 1, 14, 'k'); rect(l, 14, 12, 14, 14, 'k');
  }
  return cuadricula(l);
}

// Sofá de cuatro casillas: brazo en cada extremo y cojines en el medio.
function sofa(parte) {
  const l = lienzo();
  rect(l, 0, 1, 15, 1, 'k'); rect(l, 0, 14, 15, 14, 'k'); // contorno de arriba y de abajo
  rect(l, 0, 2, 15, 5, 'o'); rect(l, 0, 2, 15, 2, 'p'); // respaldo
  rect(l, 0, 6, 15, 6, 'k'); // unión del respaldo y el asiento
  rect(l, 0, 7, 15, 12, 'p'); rect(l, 0, 13, 15, 13, 'o'); // asiento y frente
  if (parte === 'medio') rect(l, 8, 7, 8, 12, 'o'); // costura entre cojines
  if (parte === 'inicio') {
    rect(l, 0, 1, 0, 14, '.'); rect(l, 1, 1, 1, 14, 'k'); rect(l, 2, 2, 3, 13, 'o'); rect(l, 2, 2, 3, 2, 'p'); rect(l, 4, 6, 4, 12, 'k');
  }
  if (parte === 'fin') {
    rect(l, 15, 1, 15, 14, '.'); rect(l, 14, 1, 14, 14, 'k'); rect(l, 12, 2, 13, 13, 'o'); rect(l, 12, 2, 13, 2, 'p'); rect(l, 11, 6, 11, 12, 'k');
  }
  return cuadricula(l);
}

// Tablero de una mesa: de `y0` a `y1`, con borde y brillo arriba; los extremos cierran el contorno.
function mesa(y0, y1, tapa, brillo, parte) {
  const l = lienzo();
  rect(l, 0, y0, 15, y0, 'k'); rect(l, 0, y1, 15, y1, 'k');
  rect(l, 0, y0 + 1, 15, y1 - 1, tapa); rect(l, 0, y0 + 1, 15, y0 + 1, brillo); rect(l, 0, y1 - 1, 15, y1 - 1, 'd');
  if (parte === 'inicio') { rect(l, 0, y0, 0, y1, '.'); rect(l, 1, y0, 1, y1, 'k'); }
  if (parte === 'fin') { rect(l, 15, y0, 15, y1, '.'); rect(l, 14, y0, 14, y1, 'k'); }
  return l;
}

// Escritorio de dos casillas: monitor a la izquierda, papeles y lápiz a la derecha.
function escritorio(parte) {
  const l = mesa(3, 12, 'e', 'f', parte);
  if (parte === 'inicio') { caja(l, 4, 4, 12, 8, 'a'); rect(l, 5, 5, 11, 7, 'h'); rect(l, 7, 9, 9, 10, 'd'); }
  else { rect(l, 3, 5, 9, 9, 'j'); rect(l, 3, 9, 9, 9, 'l'); rect(l, 11, 5, 12, 7, 'r'); }
  return cuadricula(l);
}

// Lavadora de dos casillas: un solo mueble con dos puertas de vidrio.
function lavadora(parte) {
  const l = lienzo();
  rect(l, 0, 2, 15, 2, 'k'); rect(l, 0, 13, 15, 13, 'k'); rect(l, 0, 3, 15, 12, 'v'); rect(l, 0, 12, 15, 12, 's');
  if (parte === 'inicio') { rect(l, 1, 2, 1, 13, 'k'); rect(l, 0, 2, 0, 13, '.'); }
  else { rect(l, 14, 2, 14, 13, 'k'); rect(l, 15, 2, 15, 13, '.'); }
  const cx = parte === 'inicio' ? 9 : 7;
  caja(l, cx - 4, 4, cx + 3, 11, 'j'); rect(l, cx - 2, 6, cx + 1, 9, 'u');
  return cuadricula(l);
}

export const MUEBLES = {
  'n:unico': velador, 's:unico': sillaComedor, 'K:unico': cocina, 'R:unico': refrigeradora, 'L:unico': lavadero, 'W:unico': inodoro,
  'w:unico': lavamanos, 'U:unico': ducha, 'e:unico': sillaEscritorio, 'P:unico': camaMascota, 'o:unico': plato,
  'B:inicio': cama('inicio'), 'B:fin': cama('fin'),
  'S:inicio': sofa('inicio'), 'S:medio': sofa('medio'), 'S:fin': sofa('fin'),
  'T:inicio': cuadricula(mesa(3, 12, 'e', 'f', 'inicio')), 'T:fin': cuadricula(mesa(3, 12, 'e', 'f', 'fin')),
  'M:inicio': cuadricula(mesa(2, 13, 'f', 'j', 'inicio')), 'M:medio': cuadricula(mesa(2, 13, 'f', 'j', 'medio')),
  'M:fin': cuadricula(mesa(2, 13, 'f', 'j', 'fin')),
  'E:inicio': escritorio('inicio'), 'E:fin': escritorio('fin'),
  'V:inicio': lavadora('inicio'), 'V:fin': lavadora('fin'),
};

export const LETRAS_MUEBLE = [...new Set(Object.keys(MUEBLES).map((clave) => clave[0]))];
```
- [ ] Run: `cd poc && node --test test/arte.test.js` — expect: PASS (7 pruebas)
- [ ] Commit: `feat(arte): add the furniture drawings with edge variants` (cuerpo: `Plan section: Phase 2: Mobiliario` y `Feature: 008-base-visual-y-mundo`)

---

## Phase 3: Elección del arte de cada casilla

**Implements:** FR-2, FR-3, FR-4, FR-5 | **Satisfies:** AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6, AC-3.7, AC-3.8, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7, AC-5.4, AC-9.3, AC-9.4
**Files:** `poc/src/arte/casillas.js`, `poc/test/casillas.test.js`, `poc/test/ayuda.js`, `poc/test/distribucion.test.js`
**Interfaces:** Consumes: `SUELOS`, `PAREDES` de `src/arte/texturas.js`; `MUEBLES`, `EJE_DE_PIEZA` de `src/arte/mobiliario.js`; `espaciosActivos` de `src/hogar.js`; `generarDistribucion` de `src/distribucion.js`. Produces: `TEXTURAS` (`{ 'suelo:<tipo>' | 'pared:frente' | 'pared:cima' | 'mueble:<letra>:<variante>': cuadricula }`, 36 claves); `vistaDePared(tiles, x, y)` → `'frente' | 'cima'`; `varianteDeMueble(tiles, x, y)` → `'unico' | 'inicio' | 'medio' | 'fin' | 'solo'`; `arteDelMapa(estado, distribucion)` → matriz `[y][x]` de `null | { base: string | null, mueble: string | null }`; y, en `test/ayuda.js`, `todasLasCombinaciones()` (generador de las 7.560 combinaciones).

La función pura que decide qué arte lleva cada casilla. Es lo único que une el arte con el generador, y se prueba contra los mapas reales, incluidos los 7.560 permitidos. Las colisiones, las puertas y la entrada no se tocan: lo confirma la huella de las 7.560 distribuciones que ya existe (AC-9.3 de la 004).

- [ ] Mover el generador de las 7.560 combinaciones a `test/ayuda.js` para compartirlo (sin cambiar sus expectativas). En `test/ayuda.js`, sustituir la primera línea por estas tres y añadir la función al final:
```js
import { agregarActividad } from '../src/actividades.js';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, banoDe, cuartosEnOrden } from '../src/hogar.js';

const agregarTipos = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);

// Las 7.560 combinaciones permitidas de espacios: comedor, cocinas, lavanderías, espacios de mascota, dormitorios, oficinas y baños internos.
export function* todasLasCombinaciones() {
  for (const comedor of [0, 1]) for (const cocinas of [1, 2]) for (const lav of [0, 1, 2]) for (const masc of [0, 1, 2])
    for (const dorms of [1, 2, 3, 4]) for (const ofis of [0, 1, 2]) {
      const ctx = crearCtx();
      let base = crearHogarInicial(ctx);
      base = agregarTipos(base, ctx, ...Array(comedor).fill('comedor'), ...Array(cocinas - 1).fill('cocina'),
        ...Array(lav).fill('lavanderia'), ...Array(masc).fill('mascota'), ...Array(dorms - 1).fill('dormitorio'), ...Array(ofis).fill('oficina'));
      const cuartos = cuartosEnOrden(base);
      base = agregarTipos(base, ctx, ...Array(cuartos.length).fill('bano'));
      for (let mascara = 0; mascara < 2 ** cuartos.length; mascara++) {
        let e = base;
        cuartos.forEach((c, i) => { if (!(mascara & (1 << i))) e = eliminarEspacio(e, banoDe(e, c.id).id, ctx); });
        yield e;
      }
    }
}
```
  En `test/distribucion.test.js`, cambiar la importación por `import { crearCtx, todasLasCombinaciones } from './ayuda.js';` y borrar la función local `function* todasLasCombinaciones() { ... }` (el bloque completo, de `function* todasLasCombinaciones() {` hasta su llave de cierre, justo antes de `test('Reliability: todas las combinaciones generan mapas correctos y navegables'`).
- [ ] Run: `cd poc && node --test test/distribucion.test.js` — expect: PASS con las mismas pruebas que antes (el generador movido no cambia ninguna expectativa); si falla, deshacer el movimiento antes de seguir.
- [ ] Escribir las pruebas:
```js
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
```
- [ ] Run: `cd poc && node --test test/casillas.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/casillas.js`)
- [ ] Implementar la elección del arte:
```js
// src/arte/casillas.js
import { espaciosActivos } from '../hogar.js';
import { SUELOS, PAREDES } from './texturas.js';
import { MUEBLES, EJE_DE_PIEZA } from './mobiliario.js';

// Todos los dibujos por clave de textura: 'suelo:<tipo>', 'pared:frente', 'pared:cima' y 'mueble:<letra>:<variante>'.
export const TEXTURAS = {
  ...Object.fromEntries(Object.entries(SUELOS).map(([tipo, g]) => [`suelo:${tipo}`, g])),
  ...Object.fromEntries(Object.entries(PAREDES).map(([vista, g]) => [`pared:${vista}`, g])),
  ...Object.fromEntries(Object.entries(MUEBLES).map(([clave, g]) => [`mueble:${clave}`, g])),
};

// FR-3 de la 008: la pared se ve de frente si la casilla de debajo existe y no es pared ni vacío; en cualquier otro caso, desde arriba.
export function vistaDePared(tiles, x, y) {
  const debajo = tiles[y + 1]?.[x];
  return debajo !== undefined && debajo !== '#' && debajo !== ' ' ? 'frente' : 'cima';
}

// FR-4 de la 008: variante de una casilla de mueble según sus vecinas de la misma pieza a lo largo de su eje. Las piezas de una sola
// casilla (sin eje) son 'unico'; una pieza de varias casillas sin vecinas es 'solo' y no tiene dibujo.
export function varianteDeMueble(tiles, x, y) {
  const letra = tiles[y][x];
  const eje = EJE_DE_PIEZA[letra];
  if (!eje) return 'unico';
  const [dx, dy] = eje === 'vertical' ? [0, 1] : [1, 0];
  const antes = tiles[y - dy]?.[x - dx] === letra;
  const despues = tiles[y + dy]?.[x + dx] === letra;
  if (antes && despues) return 'medio';
  if (despues) return 'inicio';
  if (antes) return 'fin';
  return 'solo';
}

// FR-5 de la 008: el arte de cada casilla del mapa. `null` para el vacío; si no, el suelo o la pared (`base`) y, si la casilla es de
// mobiliario, el mueble que va encima (`mueble`). Pura y determinista: depende solo del estado (tipos de espacio) y de la distribución.
export function arteDelMapa(estado, distribucion) {
  const tipoDe = new Map(espaciosActivos(estado).map((e) => [e.id, e.tipo]));
  const { tiles, espacioEn } = distribucion;
  return tiles.map((fila, y) => [...fila].map((ch, x) => {
    if (ch === ' ') return null;
    if (ch === '#') return { base: `pared:${vistaDePared(tiles, x, y)}`, mueble: null };
    const clave = espacioEn[y][x];
    const tipo = clave?.startsWith('pasillo:') ? 'pasillo' : tipoDe.get(clave);
    const mueble = `mueble:${ch}:${varianteDeMueble(tiles, x, y)}`;
    return { base: SUELOS[tipo] ? `suelo:${tipo}` : null, mueble: TEXTURAS[mueble] ? mueble : null };
  }));
}
```
- [ ] Run: `cd poc && node --test test/casillas.test.js test/contrato-arte.test.js` — expect: PASS (10 + 2 pruebas)
- [ ] Run: `cd poc && npm test` — expect: 365 pruebas, 0 fallos (346 + 2 de contrato + 7 de arte + 10 de casillas; la de tipografía aún no existe)
- [ ] Commit: `feat(arte): choose the art of every map tile from the layout` (cuerpo: `Plan section: Phase 3: Elección del arte de cada casilla` y `Feature: 008-base-visual-y-mundo`)

> **Cobertura de AC-3.8, AC-4.7 y AC-5.4:** `arteDelMapa` no escribe ni modifica la distribución, y el generador no se toca. La prueba existente «AC-9.3: con la entrada cerrada, las 7.560 distribuciones son idénticas…» de `test/distribucion.test.js` fija la huella de todas las distribuciones; sigue pasando sin cambios. La Fase 6 confirma además con `git diff` que `distribucion.js`, `catalogo.js` y los demás módulos del dominio no cambiaron.

---

## Phase 4: Tipografía local

**Implements:** FR-7 (archivo y licencia), FR-10 | **Satisfies:** AC-8.4
**Files:** `poc/assets/fonts/silkscreen-latin.woff2`, `poc/assets/fonts/OFL.txt`, `poc/assets/fonts/LEEME.md`, `poc/test/tipografia.test.js`
**Interfaces:** Consumes: nada. Produces: el archivo de la fuente `assets/fonts/silkscreen-latin.woff2` (subconjunto latino, peso 400) y el registro de su licencia y origen, que la Fase 5 enlaza desde `index.html`.

La fuente viaja con el juego; no se pide a ningún servidor externo. Antes de la descarga hay que pedir permiso al usuario.

- [ ] Escribir la prueba:
```js
// test/tipografia.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const leer = (ruta) => readFileSync(new URL(ruta, raiz), 'utf8');

test('AC-8.4: la fuente Silkscreen está en el repositorio, con su licencia y su origen al lado', () => {
  const bytes = readFileSync(new URL('assets/fonts/silkscreen-latin.woff2', raiz));
  assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2');
  assert.ok(bytes.length > 1000 && bytes.length < 200000, `tamaño inesperado: ${bytes.length}`);
  assert.match(leer('assets/fonts/OFL.txt'), /SIL OPEN FONT LICENSE/i);
  const leeme = leer('assets/fonts/LEEME.md');
  assert.match(leeme, /Silkscreen/);
  assert.match(leeme, /SIL Open Font License/);
  assert.match(leeme, /https:\/\//);
});
```
- [ ] Run: `cd poc && node --test test/tipografia.test.js` — expect: FAIL (`ENOENT` de `assets/fonts/silkscreen-latin.woff2`)
- [ ] **Pedir permiso al usuario antes de descargar** (regla del proyecto: ninguna descarga sin un sí explícito). Decir: «Voy a descargar dos archivos: `silkscreen-latin.woff2` (la fuente Silkscreen, subconjunto latino, unos pocos KB) desde `fonts.gstatic.com`, cuya dirección sale del CSS de Google Fonts, y `OFL.txt` (el texto de la licencia SIL OFL) desde `raw.githubusercontent.com/google/fonts`. Ambos quedan en `poc/assets/fonts/`». Si el usuario no lo autoriza, parar y pedir que él coloque los archivos.
- [ ] Descargar la fuente y la licencia, y registrar el origen:
```bash
cd poc && mkdir -p assets/fonts
URL=$(curl -sS -A "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Silkscreen&display=swap" | grep -A6 '/\* latin \*/' | grep -o 'https://[^)]*\.woff2' | head -1)
echo "$URL"
curl -sS "$URL" -o assets/fonts/silkscreen-latin.woff2
curl -sS "https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen/OFL.txt" -o assets/fonts/OFL.txt
cat > assets/fonts/LEEME.md <<EOF
# Silkscreen

Tipografía pixel que usan el mapa, la barra inferior y los títulos de los drawers (feature 008, FR-7).

- **Archivo:** \`silkscreen-latin.woff2\` (subconjunto latino, peso 400).
- **Origen:** Google Fonts, https://fonts.google.com/specimen/Silkscreen (archivo servido por fonts.gstatic.com), descargado el $(date +%F).
- **Licencia:** SIL Open Font License 1.1; el texto completo está en \`OFL.txt\`.
- Se sirve con el propio juego: no se pide ninguna fuente a un servidor externo.
EOF
file assets/fonts/silkscreen-latin.woff2 && wc -c assets/fonts/silkscreen-latin.woff2 && head -3 assets/fonts/OFL.txt
```
  Expect: `echo "$URL"` imprime una dirección `https://fonts.gstatic.com/s/silkscreen/...woff2`; `file` dice `Web Open Font Format (Version 2)`; el tamaño es de pocos KB; `OFL.txt` empieza con el aviso de derechos de Silkscreen. Si `$URL` está vacío o `OFL.txt` no es el texto de la licencia (por ejemplo, un `404: Not Found`), borrar los archivos y avisar al usuario en lugar de seguir.
- [ ] Run: `cd poc && node --test test/tipografia.test.js` — expect: PASS (1 prueba)
- [ ] Commit: `feat(poc): add the Silkscreen font with its license and origin` (cuerpo: `Plan section: Phase 4: Tipografía local` y `Feature: 008-base-visual-y-mundo`)

---

## Phase 5: Presentación del mundo y de la letra

**Implements:** FR-6, FR-7, FR-8 | **Satisfies:** AC-5.1, AC-5.2, AC-5.3, AC-5.5, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.7, AC-6.8, AC-7.1, AC-7.3, AC-7.4, AC-7.5, AC-8.1, AC-8.2, AC-8.3, AC-9.5
**Files:** `poc/src/juego.js`, `poc/index.html`, `poc/test/tipografia.test.js`
**Interfaces:** Consumes: `PALETA`, `TAM` de `src/arte/paleta.js`; `TEXTURAS`, `arteDelMapa` de `src/arte/casillas.js`; la fuente de la Fase 4. Produces: el mapa dibujado con las texturas, la letra Silkscreen en el mapa, la barra y los títulos, y el tiempo de preparación del arte en el indicador de depuración (`arte N ms`).

La capa de presentación solo convierte el arte en imágenes y lo coloca; no decide nada. Va después de las pruebas del arte y la fuente. Phaser y el DOM no se prueban de forma automática (reglas del proyecto), así que `index.html` se cubre con una prueba de texto y el resto se verifica a mano en la Fase 6.

> **Complexity note** (decisión de dibujo, sin fallo de gate): el PRD mencionaba un `Tilemap` y fijaba el `RenderTexture` como alternativa si no cumplía los 100 ms. Se empieza por el `RenderTexture`: un `Tilemap` con una hoja de texturas se ve con costuras entre casillas al ampliar con zoom fraccionario (el del modo edición lo es), mientras que el `RenderTexture` compone el mundo a 1:1 y lo amplía como una sola imagen. La spec no fija el mecanismo (AC-2.7 y AC-9.1 son los criterios). Si la Fase 6 mide más de 100 ms de redibujo con la carga completa, la alternativa es dibujar solo las casillas que cambian.

- [ ] Añadir la prueba de `index.html` al final de `test/tipografia.test.js`:
```js
test('AC-7.1, AC-7.3 y AC-8.1: index.html declara Silkscreen local y la usa solo en las pestañas y en el título del drawer', () => {
  const html = leer('index.html');
  assert.match(html, /@font-face\s*\{[^}]*font-family:\s*'Silkscreen'[^}]*url\('assets\/fonts\/silkscreen-latin\.woff2'\)/);
  assert.match(html, /#barra \.pestana small\s*\{[^}]*font-family:\s*'Silkscreen'/);
  assert.match(html, /#drawer-titulo\s*\{[^}]*font-family:\s*'Silkscreen'/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(leer('src/juego.js'), /fonts\.googleapis|fonts\.gstatic/);
});
```
- [ ] Run: `cd poc && node --test test/tipografia.test.js` — expect: FAIL (la nueva prueba: `index.html` no declara `@font-face`)
- [ ] `index.html`: añadir la declaración de la fuente como primera regla de `<style>`, y estilos de la barra y del título. Justo después de la línea `<style>`:
```html
    @font-face { font-family: 'Silkscreen'; src: url('assets/fonts/silkscreen-latin.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
```
  Sustituir la regla `#barra .pestana small { font-size: 11px; white-space: nowrap; }` por estas dos:
```html
    #barra .pestana small { font-family: 'Silkscreen', system-ui, sans-serif; font-size: 8px; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
    #drawer-titulo { font-family: 'Silkscreen', system-ui, sans-serif; font-size: 16px; font-weight: 400; }
```
  (El texto de la pestaña puede partirse en dos líneas: «Intercambios» y «(20)» caben en el ancho de una pestaña de 360 píxeles; la barra mide 56 px y alberga el icono de 20 px y dos líneas de 8 px.)
- [ ] `src/juego.js`, importaciones: añadir tras `import { ahoraLocal } from './fechas.js';`:
```js
import { PALETA, TAM } from './arte/paleta.js';
import { TEXTURAS, arteDelMapa } from './arte/casillas.js';
```
- [ ] `src/juego.js`, constantes: sustituir las tres constantes `COLOR_PISO`, `COLOR_MUEBLE` y `COLOR_PARED` (y su comentario de profundidades, que se actualiza) por:
```js
// Tipografía (FR-7 de la 008): Silkscreen con la fuente del sistema como respaldo, también letra a letra si falta un símbolo (AC-6.5).
// El tamaño de la etiqueta se ajusta con la medida del teléfono (Fase 6 del plan); 12 px es el de partida.
const FUENTE = 'Silkscreen, system-ui, sans-serif';
const TAM_LETRA_MAPA = '12px';
const ESPERA_FUENTE_MS = 1000;
// Profundidades: mundo 0, objetos del suelo 1, etiquetas de espacio 5, personaje 10, nombre del personaje 20.
```
  y en `ESTILO_ETIQUETA` cambiar `fontFamily: 'system-ui, sans-serif', fontSize: '12px'` por `fontFamily: FUENTE, fontSize: TAM_LETRA_MAPA`. (`ESTILO_CARTEL` se deriva de `ESTILO_ETIQUETA`, así que cambia solo; `ESTILO_BURBUJA` no se toca: AC-6.8.)
- [ ] `src/juego.js`, preparación del arte y espera de la fuente: añadir justo antes de `class Escena extends Phaser.Scene {`:
```js
// FR-1 y AC-9.5 de la 008: todos los dibujos se pintan una sola vez en una hoja de texturas, con un cuadro con nombre por clave.
// Devuelve el tiempo que tardó, en milisegundos, para el indicador de depuración.
function prepararArte(escena) {
  const t0 = performance.now();
  const claves = Object.keys(TEXTURAS);
  const hoja = escena.textures.createCanvas('arte', TAM * claves.length, TAM);
  const contexto = hoja.getContext();
  claves.forEach((clave, i) => {
    TEXTURAS[clave].forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (ch === '.') return;
      contexto.fillStyle = PALETA[ch];
      contexto.fillRect(i * TAM + x, y, 1, 1);
    }));
    hoja.add(clave, 0, i * TAM, 0, TAM, TAM);
  });
  hoja.refresh();
  return performance.now() - t0;
}

// FR-7 de la 008: espera a Silkscreen hasta un segundo; si no llega o falla, el juego sigue con la fuente del sistema (AC-8.3).
async function esperarFuente() {
  const limite = new Promise((resolver) => { setTimeout(resolver, ESPERA_FUENTE_MS); });
  try {
    await Promise.race([document.fonts.load(`${TAM_LETRA_MAPA} Silkscreen`), limite]);
  } catch {
    // sin fuente: se usa la del sistema
  }
}
```
- [ ] `src/juego.js`, `create()`: sustituir la línea `this.mapa = this.add.graphics();` por:
```js
    this.msArte = prepararArte(this); // los dibujos se preparan una sola vez (AC-9.5)
    this.mundo = this.add.renderTexture(0, 0, TILE, TILE).setOrigin(0, 0).setDepth(0); // suelo, paredes y mobiliario
    this.mundo.texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // píxeles nítidos a cualquier zoom (AC-9.1)
    this.mapa = this.add.graphics().setDepth(1); // objetos del suelo: encima del mundo y debajo de los personajes (AC-5.1)
```
- [ ] `src/juego.js`, sustituir `redibujar()` y todo `dibujarSuelo()` (desde `redibujar() {` hasta la llave de cierre de `dibujarSuelo`, incluido el comentario «Casillas del mapa y, encima, los objetos del suelo…») por:
```js
  redibujar() {
    this.dibujarMundo();
    this.dibujarObjetosDelSuelo();
    this.dibujarEtiquetas();
  }

  // Suelo, paredes y mobiliario (FR-5 y FR-6 de la 008): cada casilla se compone a 1:1 en una sola imagen, que se amplía con la cámara.
  // Solo hace falta cuando cambia la distribución; no cambia las colisiones.
  dibujarMundo() {
    const { ancho, alto } = distribucion;
    if (this.mundo.width !== ancho * TILE || this.mundo.height !== alto * TILE) this.mundo.resize(ancho * TILE, alto * TILE);
    this.mundo.clear();
    this.mundo.beginDraw();
    arteDelMapa(estado, distribucion).forEach((fila, y) => fila.forEach((celda, x) => {
      if (!celda) return;
      if (celda.base) this.mundo.batchDrawFrame('arte', celda.base, x * TILE, y * TILE);
      if (celda.mueble) this.mundo.batchDrawFrame('arte', celda.mueble, x * TILE, y * TILE);
    }));
    this.mundo.endDraw();
  }

  // Objetos del suelo según el estado de limpieza (FR-5 de la 003): decoración por debajo de los personajes, que no cambia las
  // colisiones. Se redibujan al cambiar las actividades o el día, sin rehacer el mundo.
  dibujarObjetosDelSuelo() {
    const g = this.mapa;
    g.clear();
    for (const espacio of espaciosActivos(estado)) {
      for (const o of objetosDelSuelo(distribucion, espacio.id, limpiezaDeEspacio(estado, espacio.id, hoy))) {
        g.fillStyle(COLOR_OBJETO[o.variante]);
        g.fillRect(o.x * TILE + 4, o.y * TILE + 4, TILE - 8, TILE - 8);
      }
    }
  }
```
- [ ] `src/juego.js`, `refrescarActividades()`: cambiar `this.dibujarSuelo();` por `this.dibujarObjetosDelSuelo();`.
- [ ] `src/juego.js`, `dibujarJugador(escala)`: quitar la negrita, que con la letra pixel se vería emborronada (AC-6.3): sustituir `.setBackgroundColor(COLOR_RESALTE).setFontStyle('bold');` por `.setBackgroundColor(COLOR_RESALTE);`.
- [ ] `src/juego.js`, indicador de depuración (en `update`): sustituir la línea de `$('depuracion').textContent` por:
```js
    $('depuracion').textContent = `${Math.round(this.game.loop.actualFps)} fps · regen ${ultimaRegeneracionMs.toFixed(1)} ms · arte ${this.msArte.toFixed(0)} ms`;
```
- [ ] `src/juego.js`, espera de la fuente: justo antes de `const juego = new Phaser.Game({`, añadir:
```js
await esperarFuente(); // las etiquetas se crean con Silkscreen ya disponible (AC-8.2)
```
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida
- [ ] Run: `cd poc && node --test test/tipografia.test.js` — expect: PASS (2 pruebas)
- [ ] Comprobación estática (desechable, sin commitear): ningún resto de las constantes borradas ni de `dibujarSuelo`. Run: `cd poc && grep -n "COLOR_PISO\|COLOR_MUEBLE\|COLOR_PARED\|dibujarSuelo" src/juego.js` — expect: sin coincidencias
- [ ] Run: `cd poc && npm test` — expect: 367 pruebas, 0 fallos
- [ ] Commit: `feat(poc): draw the world with the pixel art and set the text in Silkscreen` (cuerpo: `Plan section: Phase 5: Presentación del mundo y de la letra` y `Feature: 008-base-visual-y-mundo`)

---

## Phase 6: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: 367 pruebas, 0 fallos
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida
- [ ] El generador y el dominio no cambiaron (AC-3.8, AC-4.7, AC-5.4, AC-10.2). Run (desde la raíz del repositorio): `git diff --stat main -- poc/src/catalogo.js poc/src/hogar.js poc/src/distribucion.js poc/src/posicion.js poc/src/almacen.js poc/src/movimiento.js poc/src/actividades.js poc/src/historial.js poc/src/intercambios.js poc/src/rutinas.js` — expect: sin salida
- [ ] Servir `poc/` sin caché: `cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"` y abrir `http://localhost:8080` en el navegador de la app (limpiar `localStorage` para empezar con un hogar nuevo). No usar `python3 -m http.server` a secas (incidencia de la 002: el navegador mezcla módulos viejos y nuevos).
- [ ] Verificar en el navegador de escritorio, en este orden:
  1. **Phaser y el arte (AC-9.5):** en la consola, `typeof Phaser.GameObjects.RenderTexture.prototype.batchDrawFrame` — expect: `"function"` (si dice `"undefined"`, sustituir `batchDrawFrame` por `drawFrame` en `dibujarMundo` y quitar `beginDraw`/`endDraw`). El indicador de arriba a la izquierda muestra `arte N ms` con N menor que 300; anotarlo.
  2. **Suelos y paredes (AC-2.1 a AC-2.8, AC-3.9, AC-1.5):** en edición, con un hogar de todos los tipos, cada espacio se reconoce por su suelo, las paredes de frente y desde arriba se distinguen, las puertas se ven como suelo, y no hay costuras ni colores lisos de la versión anterior. Revisar a simple vista los dibujos y, si algo se ve mal, ajustar las coordenadas en `src/arte/` y repetir (las pruebas de formato siguen siendo las mismas).
  3. **Mobiliario (AC-4.2, AC-4.3, AC-4.8):** el cuarto, la sala, el comedor, la cocina, los baños, la lavandería, el espacio de mascota y la oficina: las 17 piezas se reconocen; el sofá, la mesa de comedor, la cama, el escritorio, la mesa de centro y la lavadora se ven como un solo objeto.
  4. **Lo de encima (AC-5.1, AC-5.2, AC-5.3, AC-5.5):** una actividad con fecha de hace 3 días deja 12 objetos de colores sobre el suelo y por debajo del personaje; los habitantes siguen siendo rectángulos; tocar un espacio o una burbuja en edición responde igual que antes.
  5. **Letra en el mapa (AC-6.1 a AC-6.8):** las etiquetas, las insignias y el cartel «n fuera» se ven en Silkscreen; la etiqueta de quien juega sigue con fondo amarillo; las burbujas siguen con emoji. Cambiar `TAM_LETRA_MAPA` en `juego.js` a `'16px'`, `'12px'` o `'8px'` y comparar en el viewport de teléfono emulado (375×812) en edición con el zoom bajo, y quedarse con el mayor tamaño que no solape etiquetas vecinas; anotar el valor elegido en `verification.md`. Nombres de prueba: «Lavandería», «Baño», «Niño», «Hámster», «Cocina 2» y uno de 20 caracteres.
  6. **Tildes y ñ (AC-6.6, AC-6.5):** en la consola:
```js
const ancho = (txt, pila) => { const c = document.createElement('canvas').getContext('2d'); c.font = `16px ${pila}`; return c.measureText(txt).width; };
[...'ÁÉÍÓÚÜáéíóúüñÑ¿¡✓'].filter((ch) => ancho(ch, 'Silkscreen, serif') !== ancho(ch, 'Silkscreen, monospace'));
```
     Expect: lista de las letras que Silkscreen **no** tiene (se espera solo `✓`). Cualquier otra letra de la lista se registra en `verification.md` y se dibuja con la fuente del sistema, sin hueco.
  7. **Pestañas de la barra (AC-7.1, AC-7.2, AC-7.5, AC-7.4):** con la ventana a 360 px de ancho, la barra se ve con Silkscreen y cada pestaña contiene su texto; para el caso de 20 propuestas, en la consola: `document.querySelector('#barra [data-seccion="intercambios"] small').textContent = 'Intercambios (20)'` y luego
```js
[...document.querySelectorAll('#barra .pestana')].map((p) => { const s = p.querySelector('small'); return [s.textContent, s.getBoundingClientRect().right <= p.getBoundingClientRect().right + 0.5 && s.getBoundingClientRect().left >= p.getBoundingClientRect().left - 0.5]; });
```
     Expect: todas `true`. Abrir un drawer: su título se ve en Silkscreen; los campos, listas, chips, fichas y el historial siguen con la fuente del sistema, y los colores de la barra y de los drawers son los de antes.
  8. **Sin servidores externos (AC-8.1):** con las herramientas de red del navegador, recargar y comprobar que las únicas peticiones son `localhost` y `cdnjs.cloudflare.com` (Phaser); ninguna a `fonts.googleapis.com` ni `fonts.gstatic.com`.
  9. **Orden de carga y respaldo (AC-8.2, AC-8.3):** recargar varias veces y comprobar que las etiquetas nunca se ven primero con otra letra. Luego renombrar `assets/fonts/silkscreen-latin.woff2` a `.bak`, recargar con la caché desactivada: el mapa y la barra se ven con la fuente del sistema en menos de dos segundos y sin errores en la consola; devolver el nombre original.
  10. **Nitidez (AC-9.1):** capturas en exploración y en edición: los píxeles se ven nítidos y sin suavizado.
  11. **Hogares guardados (AC-10.1, AC-10.2, AC-10.3):** abrir un hogar guardado con la versión anterior del juego (por ejemplo, el del navegador antes de actualizar): se abre sin avisos, con el arte nuevo, y la posición del personaje es la misma; el documento guardado sigue en `version: 7` con los mismos campos.
- [ ] Rendimiento con carga completa (AC-9.2, AC-9.6): con 8 familiares, 4 mascotas, 50 actividades y 200 entradas de historial (la consola puede armar el documento como en la verificación de la 006, con `version: 7`), caminar 30 segundos y, en edición, cambiar contadores de espacios: el indicador muestra 60 fps o más y `regen` por debajo de 100 ms y sin superar los 62,7 ms de la 007.
- [ ] Verificación en el teléfono Android de referencia (la hace el usuario; servir `poc/` en la red local solo mientras dura la prueba, con el mismo servidor sin caché en `0.0.0.0:8080`, y apagarlo después): repetir los pasos 2, 3, 5, 7 y 10; comprobar que Silkscreen es legible con el brillo normal y que las etiquetas de nombre largo no tapan lo importante; con la carga completa, anotar fps, `regen` y `arte` del indicador.
- [ ] Escribir `docs/specs/008-base-visual-y-mundo/verification.md` con los resultados (pruebas automáticas, navegador de escritorio, teléfono, el tamaño de letra elegido, las letras ausentes en Silkscreen y el tiempo de preparación del arte) y los límites aceptados.
- [ ] Pedir confirmación al usuario y, si la da, actualizar `CLAUDE.md` (capa del renderizador: añadir `src/arte/` —paleta y dibujos como datos, elección de arte por casilla— y que no importa Phaser) y `.claude/rules/javascript.md` (la lista de la capa de presentación). No editar esos archivos sin confirmación.
- [ ] Commit: `feat: complete 008 base visual y mundo` (cuerpo: `Plan section: Phase 6: Integration Verification` y `Feature: 008-base-visual-y-mundo`)

**Cobertura de FR por fase:** FR-1 → Fases 1 y 2; FR-2 → Fases 1 y 3; FR-3 → Fases 1 y 3; FR-4 → Fases 2 y 3; FR-5 → Fase 3; FR-6 → Fases 3 y 5; FR-7 → Fases 4 y 5; FR-8 → Fases 5 y 6; FR-9 → Fases 3 y 6; FR-10 → Fases 4 y 6.

**Cobertura de AC por fase:** AC-1.1 a AC-1.4 → Fases 1 y 2; AC-1.5 → Fase 6; AC-2.1 → Fase 1; AC-2.2 a AC-2.6 → Fase 3; AC-2.7, AC-2.8 → Fase 6; AC-3.1 a AC-3.7 → Fase 3; AC-3.8 → Fase 3 y 6 (huella y `git diff`); AC-3.9 → Fase 6; AC-4.1 a AC-4.3 → Fase 2; AC-4.3 a AC-4.6 → Fase 3; AC-4.7 → Fases 3 y 6; AC-4.8 → Fase 6; AC-5.1, AC-5.2, AC-5.3, AC-5.5 → Fases 5 y 6; AC-5.4 → Fases 3 y 6; AC-6.1 a AC-6.4, AC-6.7, AC-6.8 → Fases 5 y 6; AC-6.5, AC-6.6 → Fase 6; AC-7.1, AC-7.3 → Fase 5 (prueba de `index.html`) y 6; AC-7.2 → Fase 6; AC-7.4, AC-7.5 → Fases 5 y 6; AC-8.1 → Fases 5 y 6; AC-8.2, AC-8.3 → Fases 5 y 6; AC-8.4 → Fase 4; AC-9.1 → Fase 6; AC-9.2, AC-9.6 → Fase 6; AC-9.3, AC-9.4 → Fase 3; AC-9.5 → Fases 5 y 6; AC-10.1 a AC-10.3 → Fase 6; AC-10.4 → Fases 3 y 6.

---

## Quickstart Validation

```bash
cd poc
npm test                      # 367 pruebas, 0 fallos
node --check src/juego.js     # sintaxis de la escena
python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"   # http://localhost:8080
```

En la app: abrir el juego y ver el hogar con suelo de madera en la sala, baldosa en la cocina, azulejo en el baño y alfombra rosa en el dormitorio, con la cama, el sofá y la cocina dibujados → tocar «Espacios» y agregar un comedor, una lavandería y un espacio de mascota → comprobar que cada suelo nuevo se reconoce sin leer su etiqueta y que el mapa se actualiza al instante → tocar «Listo» → comprobar que la etiqueta de quien juega sigue resaltada, que las pestañas de la barra y el título del drawer van en letra pixel y que los formularios siguen con la fuente del sistema → recargar y comprobar que todo sigue.
