# Implementation Plan: Habitantes animados

**Spec:** docs/specs/009-habitantes-animados/spec.md (v1.0.0)
**Decisions:** docs/adr/009-personajes-compuestos-por-piezas.md, docs/adr/008-arte-cuadriculas-con-paleta.md
**Created:** 2026-10-10

No hay `data-model.md`: la feature no guarda datos nuevos ni cambia el documento guardado (FR-8, AC-4.10, AC-9.2).

## Context

Tras la 008 el mundo es pixel art, pero los habitantes y el jugador siguen siendo rectángulos (12×14 y 8×8) y el jugador se gira con `setAngle`. La 009 los convierte en 14 personajes de 16×16 (protagonista, 7 aspectos, 6 especies) con 9 cuadros cada uno, que miran y caminan en cuatro direcciones. Se aprobaron el PRD, el ADR-009 y la spec (67 AC, 9 FR). Los dibujos y los hogares de prueba de este plan ya se ejecutaron en memoria (sin escribir archivos) contra las reglas de la spec: 0 fallos; alturas de frente 15 para los adultos y 12 para los niños; hámster con 72 píxeles de color frente a los 128 del perro; los dos hogares de prueba los acepta `crearAlmacen().cargar` sin error.

## Global Constraints

- **Personajes (FR-1):** 14 claves: `protagonista`, las de `ASPECTOS` (`adulto`, `adulta`, `nino`, `nina`, `anciano`, `anciana`, `neutro`) y las de `ESPECIES` (`perro`, `gato`, `conejo`, `hamster`, `loro`, `otro`). Cada uno tiene las vistas `frente`, `espalda` y `lado` (mirando a la derecha), cada una con los cuadros 0 (parado), 1 y 2 (paso con cada pie): 9 cuadros, 126 en total. No hay cuadros para la izquierda: es `lado` volteado.
- **Formato (ADR-008, ADR-009):** cuadrículas de 16 cadenas de 16 caracteres; cada carácter es una clave de `PALETA` (`src/arte/paleta.js`, 32 colores) o `.` (transparente). Se arman con `lienzo`, `rect`, `caja` y `cuadricula` de `src/arte/lienzo.js`. No se amplía la paleta (los dibujos de este plan caben en ella).
- **Claves de textura:** `personaje:<clave>:<vista>:<cuadro>`, en la misma hoja `arte` que ya prepara `prepararArte`; las 36 texturas de la 008 no cambian.
- **Elección del personaje (FR-3):** propietario → `protagonista`; persona con aspecto de `ASPECTOS` → su aspecto; mascota con especie de `ESPECIES` → su especie; respaldo: `neutro` (persona) u `otro` (mascota). No depende de nombre, id ni posición.
- **Caminar (FR-4, FR-5):** abajo → `frente`; arriba → `espalda`; derecha → `lado`; izquierda → `lado` volteado. Registro por miembro `{ direccion, pie, inicio, duracion }`, que vive en la presentación (no se guarda). En la primera mitad de un paso (`progreso < 0.5`) se ve el cuadro `pie` (1 o 2); en la segunda mitad y fuera de un paso, 0. El pie alterna en cada paso. Los pasos duran `MS_POR_PASO` (500 ms) para los habitantes y `MS_POR_CASILLA` (250 ms) para el jugador; las velocidades no cambian. En modo edición, todos se ven parados. Los habitantes que el juego coloca de nuevo miran de frente (`REPOSO`).
- **Capas (FR-6):** sin cambios. Personajes en `PROF_PERSONAJE` (10) o `PROF_EN_RUTA` (9), nombres en 20, burbujas y cartel en 30. Los toques siguen resolviéndose por casilla. La nitidez ya la da `pixelArt: true` en la configuración del juego (filtro NEAREST para todas las texturas).
- **Capas que no se tocan (FR-8):** `catalogo.js`, `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js`, `movimiento.js`, `rutas.js`, `rutinas.js`, `actividades.js`, `intercambios.js`, `historial.js`. Documento `version: 7`, claves `livin:datos:v1` y `livin:posicion:v1`. Las suites 001 a 008 (367 pruebas) pasan sin cambiar sus expectativas.
- **Módulos de arte puros:** `src/arte/personajes.js` y `src/arte/caminar.js` no importan Phaser ni tocan el DOM; pueden importar `catalogo.js` y `hogar.js`, como ya hace `casillas.js`. Ni el dominio ni el generador los importan.
- **Hogares de prueba (FR-7):** en `poc/test/hogares-de-prueba.js`, armados con las operaciones reales del modelo, sin `crypto.randomUUID` (lección 2026-10-05: no existe en `http://<IP>`). No se cargan ni se enlazan desde la app.
- **Rendimiento (NFR):** 60 fps con la carga completa; edición en menos de 100 ms y sin superar 62,7 ms; preparación de la hoja en menos de 300 ms, una sola vez.
- **Procedencia (FR-9):** arte original; sin dependencias npm; Phaser 3.80.1 desde cdnjs.

**Pre-implementation gates:**
- *Simplicity:* 3 componentes: arte puro (`personajes.js`, `caminar.js`), presentación (`juego.js`) y ayuda de pruebas (`hogares-de-prueba.js`). Dominio y generador sin cambios. Sin dependencias nuevas. ✓
- *Anti-Abstraction:* las imágenes de Phaser se usan directamente (`add.image`, `setFrame`, `setFlipX`). El registro de caminar es un objeto plano y no envuelve nada. ✓
- *Integration-First:* las exportaciones de los tres módulos nuevos quedan fijadas por la prueba de contrato de la Fase 0. ✓

---

## Goal

Que cada miembro del hogar se vea como su personaje de pixel art y camine en cuatro direcciones alternando los pies, sin cambiar ninguna regla del juego. Pruebas: 367 existentes + 24 nuevas = **391**.

Archivos (bajo `poc/`):
- **Arte (nuevo):** `src/arte/caminar.js` (reglas puras del caminar) y `src/arte/personajes.js` (los 126 cuadros y `personajeDe`).
- **Presentación:** `src/juego.js`.
- **Pruebas:** `test/contrato-personajes.test.js` (3), `test/caminar.test.js` (5), `test/personajes.test.js` (11), `test/hogares-de-prueba.test.js` (5), y el módulo de ayuda `test/hogares-de-prueba.js`.
- **Docs:** `docs/specs/009-habitantes-animados/verification.md`. Si el usuario lo confirma, también `CLAUDE.md` y `.claude/rules/{phaser,javascript,testing}.md`.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1, FR-3, FR-4, FR-5, FR-7 (contrato) | **Satisfies:** — (fija contratos)
**Files:** `poc/test/contrato-personajes.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de `src/arte/personajes.js` (`VISTAS`, `CUADROS`, `PERSONAJES`, `CUADROS_DE_PERSONAJES`, `claveDeCuadro`, `personajeDe`), de `src/arte/caminar.js` (`REPOSO`, `vistaDeDireccion`, `direccionDelPaso`, `otroPie`, `pasoNuevo`, `mirarHacia`, `progresoDelPaso`, `cuadroDeCaminar`) y de `test/hogares-de-prueba.js` (`ctxDePrueba`, `hogarDePrueba1`, `hogarDePrueba2`).

La prueba queda en rojo (`ERR_MODULE_NOT_FOUND`) hasta el final de la Fase 3. Las Fases 1 a 3 se verifican con sus propios archivos de prueba.

- [ ] Escribir la prueba:
```js
// test/contrato-personajes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as personajes from '../src/arte/personajes.js';
import * as caminar from '../src/arte/caminar.js';
import * as hogares from './hogares-de-prueba.js';

test('contrato de los personajes: catálogo, cuadros y elección por miembro', () => {
  assert.deepEqual(personajes.VISTAS, ['frente', 'espalda', 'lado']);
  assert.deepEqual(personajes.CUADROS, [0, 1, 2]);
  assert.equal(typeof personajes.PERSONAJES, 'object');
  assert.equal(typeof personajes.CUADROS_DE_PERSONAJES, 'object');
  for (const nombre of ['claveDeCuadro', 'personajeDe']) assert.equal(typeof personajes[nombre], 'function', nombre);
});

test('contrato del caminar: vista, dirección, registro y cuadro', () => {
  assert.equal(typeof caminar.REPOSO, 'object');
  for (const nombre of ['vistaDeDireccion', 'direccionDelPaso', 'otroPie', 'pasoNuevo', 'mirarHacia', 'progresoDelPaso', 'cuadroDeCaminar']) {
    assert.equal(typeof caminar[nombre], 'function', nombre);
  }
});

test('contrato de los hogares de prueba', () => {
  for (const nombre of ['ctxDePrueba', 'hogarDePrueba1', 'hogarDePrueba2']) assert.equal(typeof hogares[nombre], 'function', nombre);
});
```
- [ ] Run: `cd poc && node --test test/contrato-personajes.test.js`. Expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/personajes.js`).
- [ ] Commit: `test(poc): add contract tests for the animated inhabitants` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 009-habitantes-animados`)

---

## Phase 1: Reglas del caminar

**Implements:** FR-4, FR-5 | **Satisfies:** AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.6, AC-4.7, AC-5.1, AC-5.2, AC-5.3
**Files:** `poc/src/arte/caminar.js`, `poc/test/caminar.test.js`
**Interfaces:** Consumes: nada. Produces: `vistaDeDireccion(direccion)` → `{ vista, volteada }`; `direccionDelPaso(desde, hasta)` → `'arriba' | 'abajo' | 'izquierda' | 'derecha' | null`; el registro `{ direccion, pie, inicio, duracion }` con `REPOSO`, `otroPie(pie)`, `pasoNuevo(registro, direccion, inicio, duracion)` y `mirarHacia(registro, direccion)`; `progresoDelPaso(registro, ahoraMs)` → número en `[0, 1)` o `null`; `cuadroDeCaminar(progreso, pie)` → `0 | 1 | 2`.

Son las reglas que deciden hacia dónde mira cada personaje y qué cuadro muestra, sin Phaser.

- [ ] Escribir las pruebas:
```js
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
```
- [ ] Run: `cd poc && node --test test/caminar.test.js`. Expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/caminar.js`).
- [ ] Implementar:
```js
// src/arte/caminar.js
// Reglas del caminar de los personajes (FR-4 y FR-5 de la 009, ADR-009): hacia dónde mira cada uno y qué cuadro muestra. Son puras:
// la presentación guarda el registro de cada miembro (no entra en el documento guardado) y le pasa la hora.

// Vista de cada dirección; la izquierda es la de lado volteada horizontalmente (AC-4.1).
const VISTA_DE_DIRECCION = {
  abajo: { vista: 'frente', volteada: false },
  arriba: { vista: 'espalda', volteada: false },
  derecha: { vista: 'lado', volteada: false },
  izquierda: { vista: 'lado', volteada: true },
};
export const vistaDeDireccion = (direccion) => VISTA_DE_DIRECCION[direccion] ?? VISTA_DE_DIRECCION.abajo;

// Dirección del paso entre dos casillas vecinas (AC-4.2); null si no son vecinas (por ejemplo, al reaparecer en otra casilla).
export function direccionDelPaso(desde, hasta) {
  const dx = hasta.x - desde.x;
  const dy = hasta.y - desde.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1) return 'derecha';
  if (dx === -1) return 'izquierda';
  return dy === 1 ? 'abajo' : 'arriba';
}

// Registro de caminar de un personaje: hacia dónde mira, el pie de su último paso (1 o 2) y, si está dando un paso, cuándo empezó
// y cuánto dura, en milisegundos. Quien se coloca de nuevo en el mapa mira de frente y quieto (AC-4.7).
export const REPOSO = Object.freeze({ direccion: 'abajo', pie: 2, inicio: null, duracion: 0 });
export const otroPie = (pie) => (pie === 1 ? 2 : 1);
// Cada paso nuevo cambia de pie (AC-5.2).
export const pasoNuevo = (registro, direccion, inicio, duracion) => ({ direccion, pie: otroPie(registro.pie), inicio, duracion });
// Girar sin dar un paso: mira hacia `direccion` y queda parado (AC-4.4, AC-4.6).
export const mirarHacia = (registro, direccion) => ({ ...registro, direccion, inicio: null });

// Lo avanzado del paso en curso, de 0 a menos de 1; null si no está dando un paso o ya terminó.
export function progresoDelPaso(registro, ahoraMs) {
  if (registro.inicio === null || registro.duracion <= 0) return null;
  const progreso = (ahoraMs - registro.inicio) / registro.duracion;
  return progreso >= 0 && progreso < 1 ? progreso : null;
}

// AC-5.1 y AC-5.3: en la primera mitad del paso, el cuadro del pie que toca; en la segunda mitad y fuera de un paso, el parado (0).
export const cuadroDeCaminar = (progreso, pie) => (progreso !== null && progreso < 0.5 ? pie : 0);
```
- [ ] Run: `cd poc && node --test test/caminar.test.js`. Expect: PASS (5 pruebas).
- [ ] Commit: `feat(arte): add the walking rules for the characters` (cuerpo: `Plan section: Phase 1: Reglas del caminar` y `Feature: 009-habitantes-animados`)

---

## Phase 2: Los 14 personajes

**Implements:** FR-1, FR-2, FR-3, FR-9 | **Satisfies:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6, AC-1.7, AC-1.8, AC-2.1, AC-2.2, AC-3.1, AC-3.2, AC-3.3, AC-3.4
**Files:** `poc/src/arte/personajes.js`, `poc/test/personajes.test.js`
**Interfaces:** Consumes: `lienzo`, `rect`, `caja`, `cuadricula` de `src/arte/lienzo.js`; `ASPECTOS` y `ESPECIES` de `src/catalogo.js`; `esPropietario` de `src/hogar.js`. Produces: `VISTAS`, `CUADROS`, `PERSONAJES` (`{ [clave]: { frente, espalda, lado } }`, donde cada vista es una lista de 3 cuadrículas), `claveDeCuadro(personaje, vista, cuadro)` → `'personaje:<clave>:<vista>:<cuadro>'`, `CUADROS_DE_PERSONAJES` (`{ [claveDeCuadro]: cuadrícula }`, 126 claves) y `personajeDe(estado, miembro)` → clave de personaje.

Las personas se componen a partir de rasgos con nombre y las mascotas con una función por especie (ADR-009). Este código ya se ejecutó en memoria contra las pruebas de abajo y no dio ningún fallo.

- [ ] Escribir las pruebas:
```js
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
```
- [ ] Run: `cd poc && node --test test/personajes.test.js`. Expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/personajes.js`).
- [ ] Implementar:
```js
// src/arte/personajes.js
import { ASPECTOS, ESPECIES } from '../catalogo.js';
import { esPropietario } from '../hogar.js';
import { lienzo, rect, caja, cuadricula } from './lienzo.js';

// Personajes de los habitantes (FR-1 y FR-2 de la 009, ADR-009): 14 personajes de 16×16 con 9 cuadros: las vistas de frente, de espalda
// y de lado (mirando a la derecha; la izquierda es la de lado volteada en la presentación), cada una con el cuadro 0 (parado) y los
// cuadros 1 y 2 (paso con cada pie). Las personas se componen a partir de rasgos con nombre; cada mascota tiene su propia función.
export const VISTAS = ['frente', 'espalda', 'lado'];
export const CUADROS = [0, 1, 2];
const PIEL = 'f';

// Rasgos de las personas (FR-2): colores de pelo, camisa, cuello (detalle de la camisa) y pantalón, y las piezas que las distinguen.
const RASGOS = {
  protagonista: { pelo: 'a', camisa: 'm', cuello: 'n', pantalon: 'a', gorra: 'm', visera: 'n' },
  adulto: { pelo: 'd', camisa: 'g', cuello: 'h', pantalon: 'i' },
  adulta: { pelo: 'd', camisa: 'r', cuello: 'j', pantalon: 'a', largo: true },
  neutro: { pelo: 'a', camisa: 'x', cuello: 'w', pantalon: 'a' },
  nino: { pelo: 'd', camisa: 'g', cuello: 'h', pantalon: 'i', nino: true },
  nina: { pelo: 'd', camisa: 'r', cuello: 'j', pantalon: 'a', nino: true, coletas: true },
  anciano: { pelo: 'l', camisa: 'i', cuello: 'g', pantalon: 'a', baston: true },
  anciana: { pelo: 'l', camisa: 'e', cuello: 'f', pantalon: 'a', mono: true },
};

// Persona de frente o de espalda. Adultos: cabeza de 10×8 desde la fila 1, cuerpo de 4 filas y piernas de 3; niños: cabeza de 8×7
// desde la fila 4, cuerpo de 3 filas y piernas de 2 (AC-2.1). En los pasos, una pierna se acorta una fila: el pie levantado.
function persona(r, vista, cuadro) {
  const l = lienzo();
  const n = Boolean(r.nino);
  const hy = n ? 4 : 1; // fila de arriba de la cabeza
  const hh = n ? 7 : 8; // alto de la cabeza
  const by = hy + hh; // fila de arriba del cuerpo
  const bh = n ? 3 : 4; // alto del cuerpo
  const py = by + bh; // fila de arriba de las piernas
  if (vista === 'lado') return personaDeLado(l, r, cuadro, { n, hy, hh, by, bh, py });
  const [x0, x1] = n ? [4, 11] : [3, 12]; // columnas de la cabeza
  if (r.mono) rect(l, 6, hy - 1, 9, hy - 1, r.pelo);
  caja(l, x0, hy, x1, hy + hh - 1, PIEL);
  if (vista === 'espalda') rect(l, x0 + 1, hy + 1, x1 - 1, hy + hh - 2, r.pelo);
  else {
    rect(l, x0 + 1, hy + 1, x1 - 1, hy + 2, r.pelo);
    rect(l, x0 + 1, hy + 3, x0 + 1, hy + 4, r.pelo);
    rect(l, x1 - 1, hy + 3, x1 - 1, hy + 4, r.pelo);
    l[hy + 4][6] = 'k';
    l[hy + 4][9] = 'k';
  }
  if (r.largo) { rect(l, x0, hy + 3, x0, hy + hh, r.pelo); rect(l, x1, hy + 3, x1, hy + hh, r.pelo); }
  if (r.coletas) { rect(l, 2, hy + 2, 3, hy + 4, r.pelo); rect(l, 12, hy + 2, 13, hy + 4, r.pelo); }
  if (r.gorra) {
    caja(l, x0, hy, x1, hy + 2, r.gorra);
    if (vista === 'frente') rect(l, x0 + 1, hy + 3, x1 - 1, hy + 3, r.visera);
  }
  caja(l, n ? 5 : 3, by, n ? 10 : 12, by + bh - 1, r.camisa);
  if (vista === 'frente') rect(l, n ? 7 : 6, by + 1, n ? 8 : 9, by + 1, r.cuello);
  if (n) { l[by + 2][5] = PIEL; l[by + 2][10] = PIEL; } else { l[by + 3][3] = PIEL; l[by + 3][12] = PIEL; }
  const [i0, i1, d0, d1] = n ? [6, 7, 8, 9] : [5, 7, 8, 10]; // columnas de las piernas izquierda y derecha
  caja(l, i0, py, i1, cuadro === 1 ? 14 : 15, r.pantalon);
  caja(l, d0, py, d1, cuadro === 2 ? 14 : 15, r.pantalon);
  if (r.baston) rect(l, 13, by + 2, 13, 15, 'k');
  return l;
}

// Persona de lado, mirando a la derecha: el pelo cae hacia atrás y, en los pasos, las piernas se separan (la de atrás y la de adelante).
function personaDeLado(l, r, cuadro, { n, hy, hh, by, bh, py }) {
  const [x0, x1] = n ? [5, 11] : [4, 12]; // columnas de la cabeza
  if (r.mono) rect(l, x0 + 1, hy - 1, x0 + 3, hy - 1, r.pelo);
  if (r.coletas) rect(l, x0 - 2, hy + 2, x0 - 1, hy + 4, r.pelo);
  caja(l, x0, hy, x1, hy + hh - 1, PIEL);
  rect(l, x0 + 1, hy + 1, x1 - 1, hy + 2, r.pelo);
  rect(l, x0 + 1, hy + 3, x0 + 3, hy + 5, r.pelo);
  if (r.largo) rect(l, x0, hy + 3, x0 + 1, hy + hh, r.pelo);
  if (r.gorra) { caja(l, x0, hy, x1, hy + 2, r.gorra); rect(l, x1 - 2, hy + 3, x1 + 1, hy + 3, r.visera); }
  l[hy + 4][x1 - 2] = 'k';
  const [c0, c1] = n ? [6, 10] : [5, 11]; // columnas del cuerpo
  caja(l, c0, by, c1, by + bh - 1, r.camisa);
  rect(l, c0 + 2, by + 1, c1 - 2, by + bh - 2, r.cuello);
  if (cuadro === 0) caja(l, c0 + 1, py, c1 - 1, 15, r.pantalon);
  else {
    caja(l, c0, py, c0 + 2, cuadro === 2 ? 14 : 15, r.pantalon); // pierna de atrás
    caja(l, c1 - 2, py, c1, cuadro === 1 ? 14 : 15, r.pantalon); // pierna de adelante
  }
  if (r.baston) rect(l, x1 + 1, by + 2, x1 + 1, 15, 'k');
  return l;
}

// Patas o pies de una mascota, de `y0` a `y1`, a partir de cada columna de `xs`; en un paso se levantan las de un lado (una fila menos).
function patas(l, xs, y0, y1, cuadro, color = 'k', ancho = 2) {
  xs.forEach((x, i) => {
    const levantada = (cuadro === 1 && i % 2 === 0) || (cuadro === 2 && i % 2 === 1);
    rect(l, x, y0, x + ancho - 1, levantada ? y1 - 1 : y1, color);
  });
}

// Mascotas (FR-2): una función por especie, con su silueta de lado y sus vistas de frente y de espalda.
function perro(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    patas(l, [3, 6, 9, 11], 12, 14, cuadro);
    caja(l, 1, 4, 2, 6, 'd'); // cola
    caja(l, 2, 6, 11, 11, 'd'); rect(l, 4, 8, 9, 10, 'e'); // cuerpo y panza
    caja(l, 10, 3, 14, 8, 'd'); caja(l, 9, 3, 11, 6, 'a'); // cabeza y oreja
    l[5][12] = 'k'; caja(l, 13, 6, 14, 8, 'e'); l[6][14] = 'k'; // ojo, hocico y nariz
    return l;
  }
  patas(l, [5, 9], 13, 15, cuadro);
  caja(l, 4, 10, 11, 13, 'd');
  if (vista === 'frente') rect(l, 6, 11, 9, 12, 'e'); else rect(l, 7, 9, 8, 12, 'a'); // pecho o cola
  caja(l, 2, 2, 4, 7, 'a'); caja(l, 11, 2, 13, 7, 'a'); // orejas
  caja(l, 4, 2, 11, 9, 'd');
  if (vista === 'frente') { l[5][6] = 'k'; l[5][9] = 'k'; caja(l, 6, 6, 9, 9, 'e'); rect(l, 7, 7, 8, 7, 'k'); }
  return l;
}

function gato(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 1, 3, 2, 9, 's'); // cola
    patas(l, [4, 7, 10], 12, 14, cuadro);
    caja(l, 3, 7, 11, 11, 's'); rect(l, 5, 8, 5, 9, 'b'); rect(l, 8, 8, 8, 9, 'b'); // cuerpo con rayas
    caja(l, 10, 3, 14, 8, 's'); l[2][10] = 'k'; l[2][14] = 'k'; // cabeza y orejas
    l[5][11] = 'o'; l[5][13] = 'o'; l[7][12] = 'n';
    return l;
  }
  if (vista === 'espalda') rect(l, 12, 6, 13, 12, 'b'); // cola
  patas(l, [5, 9], 13, 15, cuadro);
  caja(l, 4, 9, 11, 13, 's'); rect(l, 6, 10, 6, 11, 'b'); rect(l, 9, 10, 9, 11, 'b');
  caja(l, 3, 1, 5, 3, 's'); caja(l, 10, 1, 12, 3, 's'); // orejas
  caja(l, 3, 3, 12, 9, 's');
  if (vista === 'frente') { l[6][5] = 'o'; l[6][10] = 'o'; rect(l, 7, 7, 8, 7, 'n'); }
  else { rect(l, 6, 4, 6, 7, 'b'); rect(l, 9, 4, 9, 7, 'b'); }
  return l;
}

function conejo(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 9, 0, 10, 5, 'y'); caja(l, 11, 1, 12, 5, 'y'); rect(l, 10, 1, 10, 4, 'n'); // orejas
    patas(l, [4, 9], 14, 15, cuadro, 'k', 3);
    caja(l, 3, 8, 11, 13, 'y'); caja(l, 1, 9, 2, 11, 'j'); // cuerpo y cola
    caja(l, 9, 5, 13, 10, 'y'); l[7][12] = 'k'; l[8][13] = 'n';
    return l;
  }
  caja(l, 4, 0, 6, 5, 'y'); caja(l, 9, 0, 11, 5, 'y'); rect(l, 5, 1, 5, 4, 'n'); rect(l, 10, 1, 10, 4, 'n');
  patas(l, [4, 9], 14, 15, cuadro, 'k', 3);
  caja(l, 4, 10, 11, 13, 'y');
  caja(l, 3, 4, 12, 10, 'y');
  if (vista === 'frente') { l[7][6] = 'k'; l[7][9] = 'k'; rect(l, 7, 8, 8, 8, 'n'); } else rect(l, 6, 11, 9, 12, 'j');
  return l;
}

function hamster(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 3, 7, 12, 13, 'e'); rect(l, 5, 8, 8, 8, 'd'); caja(l, 9, 5, 10, 6, 'd'); // cuerpo, raya y oreja
    rect(l, 9, 9, 11, 12, 'f'); l[9][11] = 'k'; l[10][12] = 'n';
    patas(l, [4, 10], 14, 15, cuadro, 'n');
    return l;
  }
  caja(l, 4, 5, 5, 6, 'd'); caja(l, 10, 5, 11, 6, 'd'); // orejas
  caja(l, 4, 7, 11, 13, 'e');
  if (vista === 'frente') { rect(l, 6, 9, 9, 12, 'f'); l[9][6] = 'k'; l[9][9] = 'k'; rect(l, 7, 11, 8, 11, 'n'); }
  else rect(l, 7, 8, 8, 12, 'd'); // raya del lomo
  patas(l, [5, 9], 14, 15, cuadro, 'n');
  return l;
}

function loro(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    rect(l, 6, 13, 7, 15, 'i'); // cola
    patas(l, [8, 10], 13, 14, cuadro, 'r', 1);
    caja(l, 5, 6, 10, 12, 'o'); caja(l, 5, 7, 8, 11, 'g'); // cuerpo y ala
    caja(l, 6, 1, 11, 6, 'o'); rect(l, 8, 0, 9, 1, 'q'); // cabeza y cresta
    l[3][8] = 'j'; l[3][9] = 'k'; rect(l, 12, 3, 13, 4, 'r'); l[5][12] = 'k'; // ojo y pico
    return l;
  }
  if (vista === 'espalda') rect(l, 7, 13, 8, 15, 'i'); // cola
  patas(l, [6, 9], 14, 15, cuadro, 'r', 1);
  caja(l, 4, 7, 11, 13, 'o'); caja(l, 3, 8, 5, 12, 'g'); caja(l, 10, 8, 12, 12, 'g'); // cuerpo y alas
  caja(l, 4, 1, 11, 7, 'o'); rect(l, 7, 0, 8, 1, 'q');
  if (vista === 'frente') { l[4][6] = 'k'; l[4][9] = 'k'; rect(l, 7, 5, 8, 6, 'r'); }
  return l;
}

function otro(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 8, 3, 9, 5, 'p'); // oreja
    caja(l, 3, 6, 12, 13, 'p');
    rect(l, 10, 8, 11, 9, 'j'); l[9][11] = 'k'; l[11][11] = 'k'; // ojo y boca
    patas(l, [4, 9], 14, 15, cuadro, 'o', 3);
    return l;
  }
  caja(l, 4, 3, 5, 5, 'p'); caja(l, 10, 3, 11, 5, 'p'); // orejas
  caja(l, 3, 6, 12, 13, 'p');
  if (vista === 'frente') {
    rect(l, 5, 8, 6, 9, 'j'); l[9][6] = 'k'; rect(l, 9, 8, 10, 9, 'j'); l[9][10] = 'k'; rect(l, 7, 11, 8, 11, 'k');
  } else rect(l, 7, 12, 8, 12, 'o'); // colita
  patas(l, [4, 9], 14, 15, cuadro, 'o', 3);
  return l;
}

const MASCOTAS = { perro, gato, conejo, hamster, loro, otro };
const dibujo = (clave, vista, cuadro) => (RASGOS[clave] ? persona(RASGOS[clave], vista, cuadro) : MASCOTAS[clave](vista, cuadro));

export const PERSONAJES = Object.fromEntries([...Object.keys(RASGOS), ...Object.keys(MASCOTAS)].map((clave) => [clave,
  Object.fromEntries(VISTAS.map((vista) => [vista, CUADROS.map((cuadro) => cuadricula(dibujo(clave, vista, cuadro)))]))]));

export const claveDeCuadro = (personaje, vista, cuadro) => `personaje:${personaje}:${vista}:${cuadro}`;

// Los 126 cuadros por clave de textura, para la hoja de dibujos que prepara la presentación.
export const CUADROS_DE_PERSONAJES = Object.fromEntries(Object.entries(PERSONAJES).flatMap(([personaje, vistas]) =>
  Object.entries(vistas).flatMap(([vista, cuadros]) => cuadros.map((g, cuadro) => [claveDeCuadro(personaje, vista, cuadro), g]))));

// FR-3: el personaje de un miembro. El propietario es el protagonista; una persona usa su aspecto y una mascota su especie. Si el dato no
// está en las listas, el de respaldo de su clase (Error Scenarios de la 009). Pura: no depende del nombre, del id ni de la posición.
export function personajeDe(estado, miembro) {
  if (esPropietario(estado, miembro)) return 'protagonista';
  if (miembro.tipo === 'mascota') return Object.hasOwn(ESPECIES, miembro.especie) ? miembro.especie : 'otro';
  return Object.hasOwn(ASPECTOS, miembro.aspecto) ? miembro.aspecto : 'neutro';
}
```
- [ ] Run: `cd poc && node --test test/personajes.test.js`. Expect: PASS (11 pruebas).
- [ ] Commit: `feat(arte): add the 14 characters with their walking frames` (cuerpo: `Plan section: Phase 2: Los 14 personajes` y `Feature: 009-habitantes-animados`)

---

## Phase 3: Hogares de prueba

**Implements:** FR-7 | **Satisfies:** AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.7
**Files:** `poc/test/hogares-de-prueba.js`, `poc/test/hogares-de-prueba.test.js`
**Interfaces:** Consumes: `crearHogarInicial`, `agregarHabitante`, `renombrarMiembro`, `esPropietario` de `src/hogar.js`; `ASPECTOS` y `ESPECIES` de `src/catalogo.js`; `personajeDe` de `src/arte/personajes.js` (solo en la prueba). Produces: `ctxDePrueba()`, `hogarDePrueba1(ctx?)` y `hogarDePrueba2(ctx?)`, que devuelven documentos `version: 7` válidos.

Viven en `test/`, fuera de la app. Se cargan en el navegador a mano, con el fragmento de la Fase 5 (AC-8.7).

- [ ] Escribir las pruebas:
```js
// test/hogares-de-prueba.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { familiares, mascotas, miembrosActivos, esPropietario } from '../src/hogar.js';
import { crearAlmacen, CLAVE_DATOS } from '../src/almacen.js';
import { personajeDe } from '../src/arte/personajes.js';
import { almacenEnMemoria } from './ayuda.js';
import { hogarDePrueba1, hogarDePrueba2 } from './hogares-de-prueba.js';

const propietarioDe = (estado) => estado.miembros.find((m) => esPropietario(estado, m));

test('AC-8.1: el primer hogar tiene al protagonista, los seis aspectos de género y edad y cuatro mascotas', () => {
  const e = hogarDePrueba1();
  assert.equal(propietarioDe(e).nombre, 'Protagonista');
  assert.deepEqual(familiares(e).map((m) => m.aspecto), ['adulto', 'adulta', 'nino', 'nina', 'anciano', 'anciana']);
  assert.deepEqual(mascotas(e).map((m) => m.especie), ['perro', 'gato', 'conejo', 'hamster']);
});

test('AC-8.2: el segundo hogar tiene al protagonista, el neutro, el loro y «Otro»', () => {
  const e = hogarDePrueba2();
  assert.equal(propietarioDe(e).nombre, 'Protagonista');
  assert.deepEqual(familiares(e).map((m) => m.aspecto), ['neutro']);
  assert.deepEqual(mascotas(e).map((m) => m.especie), ['loro', 'otro']);
});

test('AC-8.3: cada familiar y cada mascota se llama como su aspecto o su especie', () => {
  for (const e of [hogarDePrueba1(), hogarDePrueba2()]) {
    for (const m of familiares(e)) assert.equal(m.nombre, ASPECTOS[m.aspecto]);
    for (const m of mascotas(e)) assert.equal(m.nombre, ESPECIES[m.especie]);
  }
});

test('AC-8.4: los dos hogares son documentos válidos de la versión 7 y se abren sin aviso', () => {
  for (const e of [hogarDePrueba1(), hogarDePrueba2()]) {
    assert.equal(e.version, 7);
    const r = crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(e) })).cargar(() => '2026-10-10T09:00:00.000Z');
    assert.equal(r.error, null);
    assert.deepEqual(r.estado, e);
  }
});

test('AC-8.5: entre los dos hogares aparecen los 14 personajes, dentro de los límites', () => {
  const personajes = new Set();
  for (const e of [hogarDePrueba1(), hogarDePrueba2()]) {
    assert.ok(familiares(e).length <= 8);
    assert.ok(mascotas(e).length <= 4);
    for (const m of miembrosActivos(e)) personajes.add(personajeDe(e, m));
  }
  assert.equal(personajes.size, 14);
});
```
- [ ] Run: `cd poc && node --test test/hogares-de-prueba.test.js`. Expect: FAIL (`ERR_MODULE_NOT_FOUND` de `test/hogares-de-prueba.js`).
- [ ] Implementar:
```js
// test/hogares-de-prueba.js
// Dos hogares de prueba (FR-7 de la 009) que juntos muestran los 14 personajes, para revisarlos en el juego. Se arman con las
// operaciones reales del modelo y no forman parte de la aplicación; cómo cargarlos está en docs/specs/009-habitantes-animados/verification.md.
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { crearHogarInicial, agregarHabitante, renombrarMiembro, esPropietario } from '../src/hogar.js';

// Ids y fechas predecibles, sin `crypto.randomUUID`, que no existe al abrir el juego por la IP de la red local (lección del 2026-10-05).
export function ctxDePrueba() {
  let id = 0;
  let tick = 0;
  return {
    cuentaId: 'cuenta-prueba',
    nuevoId: () => `prueba-${++id}`,
    ahora: () => new Date(Date.UTC(2026, 9, 10, 9, 0, tick++)).toISOString(),
  };
}

function exigir(r) {
  if (!r.ok) throw new Error(`hogar de prueba inválido: ${r.error}`);
  return r.estado;
}

// El propietario se llama «Protagonista»; cada familiar y cada mascota, como su aspecto o su especie (AC-8.3).
function armar(aspectos, especies, ctx) {
  let estado = crearHogarInicial(ctx);
  const propietario = estado.miembros.find((m) => esPropietario(estado, m));
  estado = exigir(renombrarMiembro(estado, propietario.id, 'Protagonista', ctx));
  for (const aspecto of aspectos) estado = exigir(agregarHabitante(estado, 'familiar', { nombre: ASPECTOS[aspecto], aspecto }, ctx));
  for (const especie of especies) estado = exigir(agregarHabitante(estado, 'mascota', { nombre: ESPECIES[especie], especie }, ctx));
  return estado;
}

// AC-8.1: el protagonista, los seis aspectos de género y edad, y cuatro mascotas.
export const hogarDePrueba1 = (ctx = ctxDePrueba()) =>
  armar(['adulto', 'adulta', 'nino', 'nina', 'anciano', 'anciana'], ['perro', 'gato', 'conejo', 'hamster'], ctx);

// AC-8.2: el protagonista, el neutro, el loro y «Otro».
export const hogarDePrueba2 = (ctx = ctxDePrueba()) => armar(['neutro'], ['loro', 'otro'], ctx);
```
- [ ] Run: `cd poc && node --test test/hogares-de-prueba.test.js test/contrato-personajes.test.js`. Expect: PASS (5 + 3 pruebas).
- [ ] Run: `cd poc && npm test`. Expect: 391 pruebas, 0 fallos (367 + 3 de contrato + 5 de caminar + 11 de personajes + 5 de hogares).
- [ ] Commit: `test(poc): add two test homes that show the 14 characters` (cuerpo: `Plan section: Phase 3: Hogares de prueba` y `Feature: 009-habitantes-animados`)

---

## Phase 4: Presentación de los personajes

**Implements:** FR-3, FR-4, FR-5, FR-6 | **Satisfies:** AC-3.5, AC-3.6, AC-3.7, AC-3.8, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.7, AC-4.8, AC-4.9, AC-4.10, AC-5.4, AC-5.5, AC-5.6, AC-5.7, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6, AC-6.7, AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-7.7, AC-9.5
**Files:** `poc/src/juego.js`
**Interfaces:** Consumes: `CUADROS_DE_PERSONAJES`, `claveDeCuadro`, `personajeDe` de `src/arte/personajes.js`; `REPOSO`, `vistaDeDireccion`, `direccionDelPaso`, `pasoNuevo`, `mirarHacia`, `progresoDelPaso`, `cuadroDeCaminar` de `src/arte/caminar.js`. Produces: los habitantes y el jugador dibujados como imágenes de la hoja `arte`, animados en cada cuadro; el mapa `caminares` (id de miembro → registro de caminar), que vive en la presentación y no se guarda.

La presentación solo aplica las reglas de las Fases 1 y 2. Phaser no se prueba de forma automática (reglas del proyecto), así que esta fase se verifica con `node --check`, la suite completa y la Fase 5.

> **Complexity note** (sin fallo de gate): la hoja `arte` pasa de 36 a 162 cuadros, una tira de 2.592 × 16 px. Cabe en el máximo de textura de cualquier teléfono con WebGL (4.096 px como mínimo). La Fase 5 mide el tiempo de preparación (AC-9.5).

- [ ] Importaciones: después de `import { TEXTURAS, arteDelMapa } from './arte/casillas.js';`, añadir:
```js
import { CUADROS_DE_PERSONAJES, claveDeCuadro, personajeDe } from './arte/personajes.js';
import {
  REPOSO, vistaDeDireccion, direccionDelPaso, pasoNuevo, mirarHacia, progresoDelPaso, cuadroDeCaminar,
} from './arte/caminar.js';
```
- [ ] Constantes: borrar las tres líneas del marcador anterior de los habitantes (AC-3.8):
```js
// Aspecto de los habitantes (FR-8 de la 002, FR-5 y FR-6 de la 007), arte de marcador: personas de 12×14 —más pequeñas si son niños— y
// mascotas de 8×8; los colores y la escala salen del catálogo.
const COLOR_BORDE_HABITANTE = 0x2a221c;
```
  Borrar la línea `const escalaDe = (miembro) => ...;`. Cambiar el comentario `// Jugador activo (FR-1 de la 005): el color de cada miembro y el resalte de la etiqueta de quien juega.` por `// Jugador activo (FR-1 de la 005): el resalte de la etiqueta de quien juega y el color de cada miembro en los círculos de responsable.` (`colorDe` sigue en uso en las fichas HTML).
- [ ] Estado del caminar: justo después de la línea `let moviles = colocarHabitantes(...);` (y de su comentario), añadir:
```js
// Caminar de cada personaje (FR-4 y FR-5 de la 009): id de miembro → registro de caminar. Vive fuera de los dibujos para que un redibujo
// no lo reinicie (AC-6.5) y no se guarda en el documento (AC-4.10). Quien juega empieza mirando hacia donde se guardó (AC-4.8).
const caminares = new Map([[jugador.id, mirarHacia(REPOSO, jugador.direccion)]]);
const caminarDe = (id) => caminares.get(id) ?? REPOSO;
// Quienes el juego coloca de nuevo aparecen parados y de frente (AC-4.7, AC-6.7).
function deFrente(ids) { for (const id of ids) caminares.set(id, REPOSO); }
// Cuadro de la hoja y volteo de un miembro: su personaje, la vista de su dirección y el cuadro de su paso; en edición, parado (AC-6.1).
function cuadroDeMiembro(id, ahoraMs) {
  const registro = caminarDe(id);
  const { vista, volteada } = vistaDeDireccion(registro.direccion);
  const progreso = modo === 'exploracion' ? progresoDelPaso(registro, ahoraMs) : null;
  const personaje = personajeDe(estado, buscarMiembro(estado, id));
  return { clave: claveDeCuadro(personaje, vista, cuadroDeCaminar(progreso, registro.pie)), volteada };
}
```
- [ ] `prepararArte`: sustituir la función completa por:
```js
// FR-1 y AC-9.5 de la 008, FR-6 y AC-9.5 de la 009: todos los dibujos (mundo y personajes) se pintan una sola vez en una hoja de texturas,
// con un cuadro con nombre por clave. Devuelve el tiempo que tardó, en milisegundos, para el indicador de depuración.
function prepararArte(escena) {
  const t0 = performance.now();
  const dibujos = { ...TEXTURAS, ...CUADROS_DE_PERSONAJES };
  const claves = Object.keys(dibujos);
  const hoja = escena.textures.createCanvas('arte', TAM * claves.length, TAM);
  const contexto = hoja.getContext();
  claves.forEach((clave, i) => {
    dibujos[clave].forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (ch === '.') return;
      contexto.fillStyle = PALETA[ch];
      contexto.fillRect(i * TAM + x, y, 1, 1);
    }));
    hoja.add(clave, 0, i * TAM, 0, TAM, TAM);
  });
  hoja.refresh();
  return performance.now() - t0;
}
```
- [ ] `create()`: sustituir las cinco líneas desde `this.cuerpoPersonaje = this.add.rectangle(...)` hasta `]).setDepth(PROF_PERSONAJE);` (el contenedor con el rectángulo y la flecha, AC-7.6) por:
```js
    this.personaje = this.add.image(0, 0, 'arte', cuadroDeMiembro(jugador.id, 0).clave).setDepth(PROF_PERSONAJE); // quien juega (FR-6 de la 009)
```
- [ ] `dibujarJugador(escala)`: sustituir el método completo (con su comentario) por:
```js
  // Nombre y resalte de quien juega (AC-2.8 de la 005): su etiqueta lleva un fondo de color que no tienen las demás. Su dibujo es el de su
  // personaje (AC-3.7 de la 009).
  dibujarJugador(escala) {
    const miembro = buscarMiembro(estado, jugador.id);
    this.pintarCuadro(this.personaje, jugador.id, performance.now());
    this.etiquetaPersonaje.setText(miembro.nombre).setScale(escala).setBackgroundColor(COLOR_RESALTE);
  }
```
- [ ] `sincronizarSprites()`: sustituir el bucle `for (const h of moviles) { ... }` (de `const miembro = buscarMiembro(estado, h.id);` hasta `this.sprites.set(h.id, { cuerpo, etiqueta });`) por:
```js
    for (const id of [...caminares.keys()]) if (!buscarMiembro(estado, id)) caminares.delete(id); // sin estado de los eliminados (AC-6.6)
    const ahoraMs = performance.now();
    for (const h of moviles) {
      const miembro = buscarMiembro(estado, h.id);
      const { clave, volteada } = cuadroDeMiembro(h.id, ahoraMs); // conserva vista y cuadro tras el redibujo (AC-6.5)
      const cuerpo = this.add.image(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2, 'arte', clave)
        .setFlipX(volteada).setDepth(PROF_PERSONAJE);
      const etiqueta = this.add.text(cuerpo.x, cuerpo.y - TILE * 0.6, miembro.nombre, ESTILO_ETIQUETA)
        .setOrigin(0.5, 1).setScale(escala).setDepth(PROF_ETIQUETA_PERSONAJE);
      cuerpo.setVisible(h.fase !== 'fuera'); // quien está fuera de casa no se ve (AC-4.1 de la 004)
      etiqueta.setVisible(h.fase !== 'fuera');
      this.sprites.set(h.id, { cuerpo, etiqueta });
    }
```
  y cambiar el comentario del método a `// Cuerpos y nombres de los habitantes (FR-8 de la 002, FR-6 de la 009): se rehacen desde \`moviles\` al redibujar o cambiar el zoom.`
- [ ] `moverHabitantes(dtMs)`: dentro del bucle, sustituir desde `if (previo.fase === 'fuera' && visible) {` hasta la línea `this.tweens.add({ targets: s.cuerpo, ... });` por:
```js
      if (previo.fase === 'fuera' && visible) {
        this.tweens.killTweensOf(s.cuerpo);
        s.cuerpo.setPosition(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2);
        caminares.set(h.id, REPOSO); // vuelve parado y de frente, sin animación de llegada (AC-6.3)
        continue;
      }
      if (previo.x === h.x && previo.y === h.y) continue;
      const registro = caminarDe(h.id);
      // AC-4.2, AC-4.3 y AC-5.2: mira hacia donde va y cambia de pie en cada paso nuevo.
      caminares.set(h.id, pasoNuevo(registro, direccionDelPaso(previo, h) ?? registro.direccion, performance.now(), MS_POR_PASO));
      this.tweens.add({ targets: s.cuerpo, x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2, duration: MS_POR_PASO, ease: 'Linear' });
```
- [ ] Animación por cuadro: añadir estos dos métodos a la clase `Escena`, justo después de `moverHabitantes`:
```js
  // FR-4 y FR-5 de la 009: en cada cuadro, quien juega y cada habitante muestran la vista de su dirección y el cuadro de su paso.
  animarPersonajes() {
    const ahoraMs = performance.now();
    this.pintarCuadro(this.personaje, jugador.id, ahoraMs);
    for (const [id, s] of this.sprites) this.pintarCuadro(s.cuerpo, id, ahoraMs);
  }

  // La izquierda es la vista de lado volteada, en la misma casilla (AC-4.5).
  pintarCuadro(imagen, id, ahoraMs) {
    const { clave, volteada } = cuadroDeMiembro(id, ahoraMs);
    if (imagen.frame.name !== clave) imagen.setFrame(clave);
    imagen.setFlipX(volteada);
  }
```
  En `update`, después de `this.moverHabitantes(deltaMs);`, añadir `this.animarPersonajes();`.
- [ ] `colocarPersonaje()`: borrar la línea `this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[jugador.direccion]);` (la vista indica la dirección, AC-7.6).
- [ ] `mover(direccion)`: sustituir `if (!r.movio) { this.colocarPersonaje(); return; }` por:
```js
    if (!r.movio) { caminares.set(jugador.id, mirarHacia(caminarDe(jugador.id), direccion)); this.colocarPersonaje(); return; } // gira sin moverse (AC-4.4)
```
  y sustituir `this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[direccion]);` por:
```js
    caminares.set(jugador.id, pasoNuevo(caminarDe(jugador.id), direccion, performance.now(), MS_POR_CASILLA)); // AC-4.4, AC-5.6, AC-5.7
```
- [ ] `cerrarSeccion()`: después de `moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar, objetivosDeFamiliares(estado, ahora));`, añadir:
```js
  deFrente(moviles.map((h) => h.id)); // todos vuelven a colocarse: parados y de frente (AC-4.7)
```
- [ ] `aplicar(nuevo)`: sustituir la línea `moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7 de la 002` por:
```js
  const antes = new Map(moviles.map((h) => [h.id, h]));
  moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7 de la 002
  // Los nuevos y los recolocados aparecen parados y de frente; los demás conservan su vista (AC-4.7, AC-6.7).
  deFrente(moviles.filter((h) => antes.get(h.id)?.x !== h.x || antes.get(h.id)?.y !== h.y).map((h) => h.id));
```
- [ ] `elegirJugador(id)`: sustituir `jugador = r.jugador;` por:
```js
  jugador = { ...r.jugador, direccion: caminarDe(id).direccion }; // sigue mirando hacia donde miraba (AC-4.9)
```
- [ ] `pasarElJuegoAlPropietario()`: sustituir `jugador = r.jugador;` por:
```js
  jugador = { ...r.jugador, direccion: caminarDe(r.jugador.id).direccion }; // el propietario sigue mirando hacia donde miraba (AC-4.9)
```
- [ ] Run: `cd poc && node --check src/juego.js`. Expect: sin salida.
- [ ] Comprobación estática (desechable, sin commitear). Run: `cd poc && grep -n "cuerpoPersonaje\|escalaDe\|COLOR_BORDE_HABITANTE\|setAngle\|add.rectangle\|add.triangle" src/juego.js`. Expect: sin coincidencias.
- [ ] Run: `cd poc && npm test`. Expect: 391 pruebas, 0 fallos.
- [ ] Commit: `feat(poc): draw and animate the inhabitants as pixel art characters` (cuerpo: `Plan section: Phase 4: Presentación de los personajes` y `Feature: 009-habitantes-animados`)

---

## Phase 5: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs (AC-2.3, AC-2.4, AC-2.5, AC-8.6, AC-9.1 a AC-9.7 y la comprobación a mano del resto)

- [ ] Run: `cd poc && npm test`. Expect: 391 pruebas, 0 fallos (AC-9.4).
- [ ] Run: `cd poc && node --check src/juego.js`. Expect: sin salida.
- [ ] El modelo, el generador y el movimiento no cambiaron (AC-7.8, AC-9.2, FR-8). Run, desde la raíz del repositorio: `git diff --stat main -- poc/src/catalogo.js poc/src/hogar.js poc/src/almacen.js poc/src/distribucion.js poc/src/posicion.js poc/src/movimiento.js poc/src/rutas.js poc/src/rutinas.js poc/src/actividades.js poc/src/intercambios.js poc/src/historial.js poc/src/arte/paleta.js poc/src/arte/casillas.js poc/test/arte.test.js`. Expect: sin salida.
- [ ] Servir `poc/` sin caché, con el mismo servidor de la 008: `cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"`. Abrir `http://localhost:8080` en el navegador de la app.
- [ ] Cargar el hogar de prueba 1 desde la consola (AC-8.6; para el 2, cambiar `hogarDePrueba1` por `hogarDePrueba2`):
```js
const { hogarDePrueba1 } = await import('/test/hogares-de-prueba.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDePrueba1()));
localStorage.removeItem('livin:posicion:v1');
location.reload();
```
- [ ] Verificar en el navegador de escritorio, con los dos hogares de prueba:
  1. **Arranque (AC-8.4, AC-9.1, AC-9.5):** se abre sin aviso. El indicador muestra `arte N ms`, con N menor que 300; anotarlo.
  2. **Reconocimiento (AC-2.3, AC-2.4, AC-2.5, AC-3.8, AC-7.6):** cada personaje coincide con su etiqueta. Ninguno es un rectángulo y el jugador no lleva flecha. Hacer capturas en exploración y en el viewport de teléfono (375×812). Si algún rasgo no se distingue, retocar sus coordenadas en `src/arte/personajes.js` y volver a pasar `node --test test/personajes.test.js`.
  3. **Caminar (AC-4.1 a AC-4.6, AC-5.4 a AC-5.7):** caminar con las flechas en las cuatro direcciones y contra una pared. Mirar a los habitantes durante un minuto (paseos y rutas con giros). Se ven las vistas y el cambio de pie, sin parpadeos al girar ni al llegar. La izquierda está volteada y queda en su casilla.
  4. **Edición y regreso (AC-4.7, AC-6.1, AC-6.2, AC-6.5, AC-6.7):** abrir una sección: todos parados, con su vista. Cambiar el zoom o el tamaño de la ventana: nadie se reinicia. Agregar un familiar: aparece de frente. Tocar «Listo»: todos se colocan de nuevo de frente y quien juega conserva su dirección.
  5. **Cambios de miembro (AC-3.5, AC-3.6, AC-3.7, AC-4.9, AC-6.6):** cambiar el aspecto de «Adulta» a niña y la especie de «Gato» a loro: cambian los dibujos. Cambiar de jugador a «Anciano»: el saliente y el entrante conservan su vista. Eliminar un habitante: desaparece.
  6. **Fuera de casa (AC-6.3, AC-6.4, AC-7.5):** crear un bloque de rutina «Fuera de casa» que empiece en el minuto siguiente para «Adulto». Camina a la entrada y desaparece, y el cartel «1 fuera» responde. Al quitar el bloque, reaparece en la entrada, parado y de frente.
  7. **Capas y toques (AC-7.1 a AC-7.4, AC-7.7):** los nombres van sobre la cabeza, la etiqueta de quien juega está resaltada y las burbujas siguen al miembro. En edición, tocar un personaje abre su ficha. Los píxeles se ven nítidos con el zoom fraccionario de la edición.
  8. **Hogar guardado (AC-9.1, AC-9.2, AC-9.3, AC-4.10):** con un hogar guardado antes de esta feature, se abre sin aviso y el jugador aparece donde estaba. `JSON.parse(localStorage.getItem('livin:datos:v1')).version` es 7 y los miembros no tienen campos nuevos.
- [ ] Rendimiento con carga completa (AC-9.6, AC-9.7): armar desde la consola, como en la verificación de la 008, un hogar `version: 7` con 8 familiares en ruta, 4 mascotas, 50 actividades y 200 entradas. Caminar 30 segundos y, en edición, cambiar contadores de espacios. Expect: 60 fps o más y `regen` por debajo de 62,7 ms.
- [ ] Verificación en el teléfono Android (la hace el usuario; servir en `0.0.0.0:8080` solo mientras dura la prueba, con el mismo servidor sin caché, y apagarlo después). Puede hacerse junto con la verificación pendiente de la 008. Repetir los pasos 2, 3, 4 y 7 con los dos hogares de prueba y anotar fps, `regen` y `arte` con la carga completa.
- [ ] Escribir `docs/specs/009-habitantes-animados/verification.md` con:
  - las pruebas automáticas;
  - el fragmento para cargar los hogares de prueba y qué se ve en cada uno (AC-8.6);
  - los pasos de escritorio y sus resultados;
  - el teléfono;
  - el tiempo de `arte`;
  - los retoques hechos a los dibujos;
  - los límites aceptados.
- [ ] Pedir confirmación al usuario y, si la da:
  - En `CLAUDE.md` (capa del renderizador), añadir `personajes.js` y `caminar.js`.
  - En `.claude/rules/phaser.md`, que los habitantes ya son personajes de `src/arte/`; solo los objetos del suelo, las insignias y las burbujas siguen con marcador hasta la 010.
  - En `.claude/rules/javascript.md`, los dos módulos nuevos.
  - En `.claude/rules/testing.md`, la validación de los 126 cuadros y los hogares de prueba.
  
  No editar esos archivos sin confirmación.
- [ ] Commit: `feat: complete 009 habitantes animados` (cuerpo: `Plan section: Phase 5: Integration Verification` y `Feature: 009-habitantes-animados`)

**Cobertura de FR por fase:** FR-1 → Fase 2; FR-2 → Fases 2 y 5; FR-3 → Fases 2 y 4; FR-4 → Fases 1 y 4; FR-5 → Fases 1 y 4; FR-6 → Fases 4 y 5; FR-7 → Fases 3 y 5; FR-8 → Fases 3 y 5; FR-9 → Fase 2.

**Cobertura de AC por fase:**
- **Story 1:** AC-1.1 a AC-1.8 → Fase 2.
- **Story 2:** AC-2.1 y AC-2.2 → Fase 2; AC-2.3 a AC-2.5 → Fase 5.
- **Story 3:** AC-3.1 a AC-3.4 → Fase 2; AC-3.5 a AC-3.8 → Fases 4 y 5.
- **Story 4:** AC-4.1 a AC-4.4, AC-4.6 y AC-4.7 → Fases 1 y 4; AC-4.5, AC-4.8, AC-4.9 y AC-4.10 → Fases 4 y 5.
- **Story 5:** AC-5.1 a AC-5.3 → Fase 1; AC-5.4 a AC-5.7 → Fases 4 y 5.
- **Story 6:** AC-6.1 a AC-6.7 → Fases 4 y 5.
- **Story 7:** AC-7.1 a AC-7.7 → Fases 4 y 5; AC-7.8 → Fase 5 (suites y `git diff`).
- **Story 8:** AC-8.1 a AC-8.5 y AC-8.7 → Fase 3; AC-8.6 → Fase 5.
- **Story 9:** AC-9.1 a AC-9.3 → Fase 5; AC-9.4 → Fases 3 y 5; AC-9.5 → Fases 4 y 5; AC-9.6 y AC-9.7 → Fase 5.

---

## Quickstart Validation

```bash
cd poc
npm test                      # 391 pruebas, 0 fallos
node --check src/juego.js     # sintaxis de la escena
python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"   # http://localhost:8080
```

En la app:
1. Cargar el hogar de prueba 1 con el fragmento de la Fase 5.
2. Comprobar que se ven el protagonista con gorra rosa, el adulto, la adulta, el niño, la niña, el anciano con bastón, la anciana con moño, el perro, el gato, el conejo y el hámster, cada uno bajo su nombre.
3. Caminar con las flechas en las cuatro direcciones y ver el cambio de pie.
4. Mirar a los habitantes pasear y girar.
5. Abrir «Familia»: todos quedan parados. Tocar «Listo»: todos aparecen de frente.
6. Cargar el hogar de prueba 2 y comprobar el neutro, el loro y «Otro».
