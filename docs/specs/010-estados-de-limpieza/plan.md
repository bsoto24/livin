# Implementation Plan: Estados de limpieza

**Spec:** docs/specs/010-estados-de-limpieza/spec.md (v1.0.0)
**Decisions:** docs/adr/010-estado-de-limpieza-en-la-composicion-del-mundo.md, docs/adr/008-arte-cuadriculas-con-paleta.md
**Created:** 2026-10-10

No hay `data-model.md`: la feature no guarda datos nuevos ni cambia el documento guardado (FR-10, AC-10.1, AC-10.2).

## Context

Tras la 008 y la 009 el mundo y los personajes son pixel art, pero los estados de limpieza siguen siendo 4 o 12 cuadros de color en una capa `Graphics` aparte, más una insignia de texto. La 010 dibuja el desorden: seis objetos propios por grupo de arte (siete grupos), manchas, telarañas, moscas y muebles desordenados o sucios, todo compuesto en el mismo `RenderTexture` del mundo (ADR-010, opción A). Se aprobaron el PRD, el ADR-010 y la spec (60 AC, 11 FR). El código de las Fases 1 a 4 de este plan ya se ejecutó en memoria (sin escribir archivos del repositorio) contra los tests del propio plan; ver "Validación previa" al final.

## Global Constraints

- **Estados (FR-8, AC-8.5):** `limpio`, `desordenado`, `desastre`, derivados por `limpiezaDeEspacio(estado, espacioId, hoy)` de `src/actividades.js` (umbrales 1 y 3 días). Nada de esto cambia: la 010 solo cambia cómo se ven.
- **Objetos (FR-1, FR-2):** 7 grupos de arte (`dormitorio`, `cocina`, `sala`, `lavanderia`, `bano`, `mascota`, `oficina`) con 6 objetos cada uno; `sala` y `comedor` comparten el grupo `sala`; todos los espacios de tipo `bano` (común e internos) comparten `bano`. La cantidad (4 en desordenado, 12 en desastre, limitada por las casillas libres), las casillas y la `variante` de 0 a 5 de `objetosDelSuelo` (`src/aspecto.js`) no cambian; la `variante` elige el objeto entre los seis de su grupo.
- **Manchas (FR-3):** solo en `desastre`, hasta `MANCHAS_POR_DESASTRE = 6` casillas libres con otra sal del hash (`mancha:`); en `cocina` y `bano` las 2 primeras (`MANCHAS_DE_AGUA = 2`) son de agua; las de suciedad alternan grande y pequeña empezando por la grande.
- **Moscas (FR-4):** solo en `desastre` y solo en `cocina`, `bano` y `mascota`: `MOSCAS_POR_DESASTRE = 2` casillas libres con otra sal (`moscas:`).
- **Telarañas (FR-4):** solo en `desastre`; casilla interior del espacio (ni `#` ni ` `) con `#` al norte y `#` al oeste (`izquierda`) o, si no, `#` al norte y `#` al este (`derecha`); una por casilla; se dibuja también sobre un mueble.
- **Sobreposiciones (FR-5):** cuadrículas de 16×16 transparentes sobre el mueble limpio; clave `sobre:<letra>:<variante>:<estado>`; solo las de la lista de FR-5. Las demás piezas se ven como en la 008.
- **Claves de textura:** `objeto:<grupo>:<0..5>`, `mancha:suciedad-grande`, `mancha:suciedad-pequena`, `mancha:agua`, `telarana:izquierda`, `telarana:derecha`, `moscas`, `sobre:<letra>:<variante>:<estado>`; viven en la misma hoja `arte` que ya prepara `prepararArte`; las claves de la 008 y la 009 no cambian y `TEXTURAS` de `casillas.js` no cambia.
- **Orden de capas por casilla (FR-6):** `ORDEN_DE_CAPAS = ['base', 'mancha', 'mueble', 'sobre', 'telarana', 'objeto', 'moscas']`.
- **Arte (ADR-008, FR-1, FR-11):** cuadrículas de 16 cadenas de 16 caracteres con claves de `PALETA` (`src/arte/paleta.js`, 32 colores) o `.` (transparente), armadas con `lienzo`, `rect`, `caja` y `cuadricula` de `src/arte/lienzo.js`. No se amplía la paleta (los dibujos de este plan caben en ella). Arte original; sin PNG ni dependencias nuevas.
- **Módulos de arte puros:** `src/arte/suciedad.js` y `src/arte/casillas.js` no importan Phaser ni tocan el DOM; `casillas.js` puede importar `hogar.js` y `aspecto.js`. Ni el dominio ni el generador importan nada de `src/arte/`. `aspecto.js` no importa arte.
- **Formato (FR-10):** documento `version: 7`, claves `livin:datos:v1` y `livin:posicion:v1`. No cambian `catalogo.js`, `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js`, `movimiento.js`, `rutas.js`, `rutinas.js`, `actividades.js`, `intercambios.js`, `historial.js`, `src/arte/paleta.js`, `texturas.js`, `mobiliario.js`, `personajes.js` ni `caminar.js`. Las suites 001 a 009 (391 pruebas) pasan sin cambiar sus expectativas.
- **Capas de la presentación (FR-8):** el desorden se compone dentro del `RenderTexture` del mundo (profundidad 0); personajes, etiquetas, insignias, burbujas y cartel conservan sus profundidades. Desaparecen la capa `Graphics` de objetos, `COLOR_OBJETO` y `dibujarObjetosDelSuelo`.
- **Cuándo se redibuja (FR-7):** `estadosCambiaron(antes, despues)` decide; el mundo se recompone si cambian los estados de limpieza o la distribución, no si ningún estado cambió.
- **Hojas de dibujos (FR-8, AC-10.6):** se reparten en una cuadrícula de 64 columnas para no pasar de 4.096 px por lado.
- **Hogares de prueba (FR-9):** en `poc/test/hogares-de-prueba.js`, armados con las operaciones reales del modelo, sin `crypto.randomUUID` (lección 2026-10-05). No se cargan ni se enlazan desde la app.
- **Rendimiento (NFR):** 60 fps con la carga completa y todo en desastre; recomposición del mundo en menos de 100 ms y sin superar lo medido en la 008 (7,5 a 11,7 ms en escritorio) ni los 45,3 ms de `regen` del teléfono con la 009; preparación de la hoja en menos de 300 ms, una sola vez.

**Pre-implementation gates:**
- *Simplicity:* 3 componentes: arte puro (`src/arte/suciedad.js` y la ampliación de `casillas.js`), selección de casillas (`src/aspecto.js`) y presentación (`src/juego.js`), más una ayuda de pruebas (`hogares-de-prueba.js`). Dominio y generador sin cambios. Sin dependencias nuevas. ✓
- *Anti-Abstraction:* se usan `RenderTexture.batchDrawFrame` y las texturas de canvas de Phaser directamente; las capas por casilla son un objeto plano y no envuelven nada. ✓
- *Integration-First:* las exportaciones nuevas de `aspecto.js`, `suciedad.js`, `casillas.js` y `hogares-de-prueba.js` quedan fijadas por la prueba de contrato de la Fase 0. ✓

---

## Goal

Que cada espacio del mapa se vea limpio, desordenado o en desastre con objetos propios de su tipo, manchas, telarañas, moscas y muebles sucios, y que el mapa se actualice solo cuando cambia un estado, sin cambiar ninguna regla del juego. Pruebas: 391 existentes + 39 nuevas = **430** (4 de contrato, 9 de selección de casillas, 8 de arte, 14 de composición del arte y 4 de hogares de prueba).

Archivos (bajo `poc/`):
- **Selección de casillas:** `src/aspecto.js` (tres exportaciones nuevas).
- **Arte (nuevo y ampliado):** `src/arte/suciedad.js` (nuevo) y `src/arte/casillas.js` (arte de cada casilla con estados, regla de redibujo).
- **Presentación:** `src/juego.js`.
- **Pruebas nuevas:** `test/contrato-estados.test.js`, `test/aspecto-estados.test.js`, `test/suciedad.test.js`, `test/casillas-estados.test.js`, `test/hogares-de-estados.test.js`; ampliación de `test/hogares-de-prueba.js`.
- **Docs:** `docs/specs/010-estados-de-limpieza/verification.md`; con confirmación del usuario, `CLAUDE.md` y `.claude/rules/{phaser,javascript,testing}.md`.

Rama: `feat/010-estados-de-limpieza`, desde `main` (la crea `sdd-execute`, que hace primero el commit de los documentos: PRD, ADR-010, spec y este plan).

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1, FR-2, FR-3, FR-4, FR-6, FR-7, FR-9 (contrato) | **Satisfies:** — (fija contratos)
**Files:** `poc/test/contrato-estados.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de `src/aspecto.js` (`MANCHAS_POR_DESASTRE`, `MOSCAS_POR_DESASTRE`, `manchasDelSuelo`, `moscasDelSuelo`, `esquinasDelEspacio`), de `src/arte/suciedad.js` (`GRUPOS`, `GRUPO_DE_TIPO`, `NOMBRES_DE_OBJETOS`, `OBJETOS`, `MANCHAS`, `TELARANAS`, `MOSCAS`, `SOBREPOSICIONES`, `SUCIEDAD`, `TIPOS_CON_AGUA`, `TIPOS_CON_MOSCAS`, `MANCHAS_DE_AGUA`), de `src/arte/casillas.js` (`ORDEN_DE_CAPAS`, `estadosCambiaron`, `arteDelMapa` con tercer parámetro) y de `test/hogares-de-prueba.js` (`hogarDePruebaDeEstados`).

La prueba queda en rojo hasta el final de la Fase 4. Las Fases 1 a 4 se verifican con sus propios archivos de prueba.

- [ ] Escribir la prueba:
```js
// test/contrato-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as aspecto from '../src/aspecto.js';
import * as suciedad from '../src/arte/suciedad.js';
import * as casillas from '../src/arte/casillas.js';
import * as hogares from './hogares-de-prueba.js';

test('contrato de la selección de casillas del desastre', () => {
  assert.equal(aspecto.MANCHAS_POR_DESASTRE, 6);
  assert.equal(aspecto.MOSCAS_POR_DESASTRE, 2);
  for (const nombre of ['manchasDelSuelo', 'moscasDelSuelo', 'esquinasDelEspacio']) assert.equal(typeof aspecto[nombre], 'function', nombre);
});

test('contrato del arte del desorden: grupos, objetos, manchas, telarañas, moscas y sobreposiciones', () => {
  assert.ok(Array.isArray(suciedad.GRUPOS));
  for (const nombre of ['GRUPO_DE_TIPO', 'NOMBRES_DE_OBJETOS', 'OBJETOS', 'MANCHAS', 'TELARANAS', 'SOBREPOSICIONES', 'SUCIEDAD']) {
    assert.equal(typeof suciedad[nombre], 'object', nombre);
  }
  assert.ok(Array.isArray(suciedad.MOSCAS));
  assert.ok(Array.isArray(suciedad.TIPOS_CON_AGUA));
  assert.ok(Array.isArray(suciedad.TIPOS_CON_MOSCAS));
  assert.equal(suciedad.MANCHAS_DE_AGUA, 2);
});

test('contrato de la elección del arte con estados', () => {
  assert.deepEqual(casillas.ORDEN_DE_CAPAS, ['base', 'mancha', 'mueble', 'sobre', 'telarana', 'objeto', 'moscas']);
  for (const nombre of ['arteDelMapa', 'estadosCambiaron']) assert.equal(typeof casillas[nombre], 'function', nombre);
});

test('contrato de los hogares de prueba de estados', () => {
  assert.equal(typeof hogares.hogarDePruebaDeEstados, 'function');
});
```
- [ ] Run: `cd poc && node --test test/contrato-estados.test.js`. Expect: FAIL (`SyntaxError` o `ERR_MODULE_NOT_FOUND` de `src/arte/suciedad.js`: el módulo todavía no existe).
- [ ] Commit: `test(poc): add contract tests for the cleanliness states` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 010-estados-de-limpieza`)

---

## Phase 1: Selección de casillas del desastre

**Implements:** FR-3, FR-4 | **Satisfies:** AC-3.2, AC-3.5, AC-3.6, AC-4.2, AC-4.3, AC-4.5, AC-4.7, AC-8.5
**Files:** `poc/src/aspecto.js`, `poc/test/aspecto-estados.test.js`
**Interfaces:** Consumes: `casillasLibres(distribucion, espacioId)`, `objetosDelSuelo(distribucion, espacioId, limpieza)`, `hash` y `claveCasilla` (ya en `aspecto.js`). Produces: `MANCHAS_POR_DESASTRE` (6), `MOSCAS_POR_DESASTRE` (2), `manchasDelSuelo(distribucion, espacioId, limpieza)` → `[{ x, y }]` (vacío si `limpieza !== 'desastre'`), `moscasDelSuelo(distribucion, espacioId, limpieza)` → `[{ x, y }]` (ídem), `esquinasDelEspacio(distribucion, espacioId)` → `[{ x, y, lado: 'izquierda' | 'derecha' }]` en orden de lectura.

Dónde van las manchas, las moscas y las telarañas es lógica de casillas y no de dibujo, así que vive junto a los objetos del suelo en `aspecto.js` (puro y sin azar). El contrato de `objetosDelSuelo` no cambia.

- [ ] Escribir las pruebas:
```js
// test/aspecto-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, espaciosActivos, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion } from '../src/distribucion.js';
import {
  casillasLibres, objetosDelSuelo, manchasDelSuelo, moscasDelSuelo, esquinasDelEspacio, MANCHAS_POR_DESASTRE, MOSCAS_POR_DESASTRE,
} from '../src/aspecto.js';
import { crearCtx } from './ayuda.js';

const hogarCon = (...tipos) => {
  const ctx = crearCtx();
  return tipos.reduce((e, t) => agregarEspacio(e, t, ctx), crearHogarInicial(ctx));
};
const clave = (c) => `${c.x},${c.y}`;
const banoInterno = (e) => espaciosActivos(e).find((s) => s.tipo === 'bano' && s.contenidoEn !== null);

test('AC-3.2, AC-3.5, AC-3.6: las manchas son hasta 6 casillas libres distintas, solo en desastre y siempre las mismas', () => {
  const e = hogarCon('dormitorio', 'bano', 'comedor');
  const d = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    assert.deepEqual(manchasDelSuelo(d, espacio.id, 'limpio'), []);
    assert.deepEqual(manchasDelSuelo(d, espacio.id, 'desordenado'), []);
    const manchas = manchasDelSuelo(d, espacio.id, 'desastre');
    assert.equal(manchas.length, Math.min(MANCHAS_POR_DESASTRE, libres.size), espacio.tipo);
    assert.equal(new Set(manchas.map(clave)).size, manchas.length);
    for (const m of manchas) assert.ok(libres.has(clave(m)), `${espacio.tipo}: mancha fuera de las casillas libres`);
    assert.deepEqual(manchasDelSuelo(generarDistribucion(e), espacio.id, 'desastre'), manchas);
  }
});

test('AC-4.5, AC-4.7: las moscas son 2 casillas libres distintas, solo en desastre y siempre las mismas', () => {
  const e = hogarCon('dormitorio', 'bano', 'mascota');
  const d = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    assert.deepEqual(moscasDelSuelo(d, espacio.id, 'limpio'), []);
    assert.deepEqual(moscasDelSuelo(d, espacio.id, 'desordenado'), []);
    const moscas = moscasDelSuelo(d, espacio.id, 'desastre');
    assert.equal(moscas.length, Math.min(MOSCAS_POR_DESASTRE, libres.size));
    assert.equal(new Set(moscas.map(clave)).size, moscas.length);
    for (const m of moscas) assert.ok(libres.has(clave(m)));
    assert.deepEqual(moscasDelSuelo(generarDistribucion(e), espacio.id, 'desastre'), moscas);
  }
});

test('AC-3.2, AC-4.5: el baño interno, con 4 casillas libres, muestra 4 manchas y 2 moscas', () => {
  const e = hogarCon('dormitorio', 'bano');
  const d = generarDistribucion(e);
  const bano = banoInterno(e);
  assert.equal(casillasLibres(d, bano.id).length, 4);
  assert.equal(manchasDelSuelo(d, bano.id, 'desastre').length, 4);
  assert.equal(moscasDelSuelo(d, bano.id, 'desastre').length, 2);
});

test('AC-3.5: las manchas y las moscas usan otra tanda de casillas que los objetos del suelo', () => {
  const e = hogarCon('dormitorio', 'cocina');
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  const objetos = objetosDelSuelo(d, cocina.id, 'desastre').map(clave);
  assert.notDeepEqual(manchasDelSuelo(d, cocina.id, 'desastre').map(clave), objetos.slice(0, MANCHAS_POR_DESASTRE));
});

test('AC-4.2: las esquinas superiores de la cocina son la izquierda y la derecha de su primera fila', () => {
  const e = hogarCon();
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  // Fila 1 de la cocina: '#KLR...#'; la cocina ocupa x de 0 a 7.
  assert.deepEqual(esquinasDelEspacio(d, cocina.id), [{ x: 1, y: 1, lado: 'izquierda' }, { x: 6, y: 1, lado: 'derecha' }]);
});

test('AC-4.2, AC-4.3: la telaraña va en la esquina aunque la ocupe un mueble, y el baño interno tiene las suyas', () => {
  const e = hogarCon('dormitorio', 'bano');
  const d = generarDistribucion(e);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[1];
  const esquinas = esquinasDelEspacio(d, dormitorio.id);
  assert.ok(esquinas.length >= 2);
  assert.ok(esquinas.some((c) => d.tiles[c.y][c.x] === 'B'), 'la cama del dormitorio ocupa una esquina');
  const bano = banoInterno(e);
  assert.deepEqual(esquinasDelEspacio(d, bano.id).map((c) => c.lado), ['izquierda', 'derecha']);
});

test('AC-4.2: ninguna casilla lleva más de una esquina y todas tienen pared al norte y a un costado', () => {
  const e = hogarCon('comedor', 'lavanderia', 'mascota', 'dormitorio', 'oficina', 'bano', 'bano');
  const d = generarDistribucion(e);
  const pared = (x, y) => d.tiles[y]?.[x] === '#';
  for (const espacio of espaciosActivos(e)) {
    const esquinas = esquinasDelEspacio(d, espacio.id);
    assert.equal(new Set(esquinas.map(clave)).size, esquinas.length);
    for (const c of esquinas) {
      assert.ok(pared(c.x, c.y - 1), `${espacio.tipo} ${clave(c)}: sin pared al norte`);
      assert.ok(pared(c.lado === 'izquierda' ? c.x - 1 : c.x + 1, c.y), `${espacio.tipo} ${clave(c)}: sin pared al costado`);
      assert.equal(d.espacioEn[c.y][c.x], espacio.id);
      assert.notEqual(d.tiles[c.y][c.x], '#');
    }
  }
});

test('AC-4.2: la sala bajo un comedor no tiene esquinas superiores; sin comedor, tiene dos', () => {
  const sin = hogarCon();
  const con = hogarCon('comedor');
  const salaSin = espaciosDeTipo(sin, 'sala')[0];
  const salaCon = espaciosDeTipo(con, 'sala')[0];
  assert.equal(esquinasDelEspacio(generarDistribucion(sin), salaSin.id).length, 2);
  assert.equal(esquinasDelEspacio(generarDistribucion(con), salaCon.id).length, 0);
  assert.equal(esquinasDelEspacio(generarDistribucion(con), espaciosDeTipo(con, 'comedor')[0].id).length, 2);
});

test('AC-8.5: objetosDelSuelo conserva su contrato de la 003 (4 y 12 objetos, variante de 0 a 5)', () => {
  const e = hogarCon('dormitorio');
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  assert.equal(objetosDelSuelo(d, cocina.id, 'desordenado').length, 4);
  assert.equal(objetosDelSuelo(d, cocina.id, 'desastre').length, 12);
  for (const o of objetosDelSuelo(d, cocina.id, 'desastre')) assert.ok(Number.isInteger(o.variante) && o.variante >= 0 && o.variante < 6);
});
```
- [ ] Run: `cd poc && node --test test/aspecto-estados.test.js`. Expect: FAIL (`SyntaxError`: `manchasDelSuelo` no se exporta de `aspecto.js`).
- [ ] Implementar, añadiendo al final de `src/aspecto.js`:
```js
// ---------- Casillas del desastre (FR-3 y FR-4 de la 010) ----------
export const MANCHAS_POR_DESASTRE = 6;
export const MOSCAS_POR_DESASTRE = 2;

// Casillas libres de un espacio en orden de hash con una sal propia: otra tanda que la de los objetos del suelo. Mismo espacio, misma tanda.
function casillasPorHash(distribucion, espacioId, sal) {
  return casillasLibres(distribucion, espacioId)
    .map((c) => ({ ...c, h: hash(`${sal}${espacioId}:${claveCasilla(c.x, c.y)}`) }))
    .sort((a, b) => a.h - b.h)
    .map(({ x, y }) => ({ x, y }));
}

// Manchas del piso: solo en desastre, hasta MANCHAS_POR_DESASTRE casillas libres.
export const manchasDelSuelo = (distribucion, espacioId, limpieza) => (limpieza === 'desastre'
  ? casillasPorHash(distribucion, espacioId, 'mancha:').slice(0, MANCHAS_POR_DESASTRE)
  : []);

// Casillas con moscas: solo en desastre, MOSCAS_POR_DESASTRE casillas libres. Qué tipos de espacio las llevan lo decide el arte.
export const moscasDelSuelo = (distribucion, espacioId, limpieza) => (limpieza === 'desastre'
  ? casillasPorHash(distribucion, espacioId, 'moscas:').slice(0, MOSCAS_POR_DESASTRE)
  : []);

const esPared = (distribucion, x, y) => distribucion.tiles[y]?.[x] === '#';

// Esquinas superiores de un espacio (FR-4): casillas interiores suyas (ni pared ni vacío) con pared al norte y pared al oeste ('izquierda')
// o, si no, pared al este ('derecha'). En orden de lectura; una sola esquina por casilla. Vale también si un mueble ocupa la casilla.
export function esquinasDelEspacio(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const esquinas = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const ch = distribucion.tiles[y][x];
      if (distribucion.espacioEn[y][x] !== espacioId || ch === '#' || ch === ' ' || !esPared(distribucion, x, y - 1)) continue;
      if (esPared(distribucion, x - 1, y)) esquinas.push({ x, y, lado: 'izquierda' });
      else if (esPared(distribucion, x + 1, y)) esquinas.push({ x, y, lado: 'derecha' });
    }
  }
  return esquinas;
}
```
- [ ] Run: `cd poc && node --test test/aspecto-estados.test.js test/aspecto.test.js`. Expect: PASS (9 pruebas nuevas y las existentes de `aspecto.test.js`).
- [ ] Commit: `feat(poc): choose the cells of stains, flies and cobwebs` (cuerpo: `Plan section: Phase 1: Selección de casillas del desastre` y `Feature: 010-estados-de-limpieza`)

---

## Phase 2: Arte del desorden

**Implements:** FR-1, FR-5 (datos), FR-11 | **Satisfies:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6, AC-5.1, AC-5.2, AC-5.5, AC-5.6
**Files:** `poc/src/arte/suciedad.js`, `poc/test/suciedad.test.js`
**Interfaces:** Consumes: `lienzo`, `rect`, `caja`, `cuadricula` de `src/arte/lienzo.js`; `TIPOS` de `src/catalogo.js` (solo en la prueba); `PALETA`, `TAM` de `src/arte/paleta.js` y `EJE_DE_PIEZA` de `src/arte/mobiliario.js` (solo en la prueba). Produces: `GRUPOS`, `GRUPO_DE_TIPO` (tipo de espacio → grupo), `NOMBRES_DE_OBJETOS` (grupo → 6 nombres), `OBJETOS` (`'objeto:<grupo>:<i>'` → cuadrícula), `MANCHAS`, `TELARANAS`, `MOSCAS` (lista de una cuadrícula, ver abajo), `SOBREPOSICIONES` (`'sobre:<letra>:<variante>:<estado>'` → cuadrícula), `SUCIEDAD` (todas las anteriores por clave), `TIPOS_CON_AGUA`, `TIPOS_CON_MOSCAS`, `MANCHAS_DE_AGUA`.

Los dibujos son bocetos con la paleta de la 008 (los mismos que se aprobaron en el brainstorm, completados hasta seis por grupo); se revisan en el juego en la Fase 6 y se retocan allí si hace falta. Las sobreposiciones son cuadrículas transparentes que se dibujan encima del mueble limpio.

- [ ] Escribir las pruebas:
```js
// test/suciedad.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS } from '../src/catalogo.js';
import { TAM, PALETA } from '../src/arte/paleta.js';
import { EJE_DE_PIEZA } from '../src/arte/mobiliario.js';
import {
  GRUPOS, GRUPO_DE_TIPO, NOMBRES_DE_OBJETOS, OBJETOS, MANCHAS, TELARANAS, MOSCAS, SOBREPOSICIONES, SUCIEDAD,
  TIPOS_CON_AGUA, TIPOS_CON_MOSCAS, MANCHAS_DE_AGUA,
} from '../src/arte/suciedad.js';

// Mide TAM×TAM y solo usa claves de la paleta o '.'.
function verificar(nombre, g) {
  assert.equal(g.length, TAM, `${nombre}: alto`);
  for (const fila of g) {
    assert.equal(fila.length, TAM, `${nombre}: ancho`);
    for (const c of fila) assert.ok(c === '.' || c in PALETA, `${nombre}: la clave ${c} no está en la paleta`);
  }
}
const pixeles = (g) => g.join('').replace(/\./g, '').length;

test('AC-1.1: hay siete grupos de arte y cada tipo de espacio tiene uno; sala y comedor comparten el suyo', () => {
  assert.deepEqual([...GRUPOS].sort(), ['bano', 'cocina', 'dormitorio', 'lavanderia', 'mascota', 'oficina', 'sala']);
  assert.deepEqual(Object.keys(GRUPO_DE_TIPO).sort(), [...TIPOS].sort());
  for (const tipo of TIPOS) assert.ok(GRUPOS.includes(GRUPO_DE_TIPO[tipo]), tipo);
  assert.equal(GRUPO_DE_TIPO.sala, GRUPO_DE_TIPO.comedor);
  assert.equal(GRUPO_DE_TIPO.bano, 'bano');
});

test('AC-1.2 y AC-1.6: cada grupo tiene seis objetos con claves distintas y dibujos distintos, y son los de la spec', () => {
  assert.deepEqual(NOMBRES_DE_OBJETOS, {
    dormitorio: ['camiseta', 'pantalon', 'calcetin', 'zapato', 'libro', 'peluche'],
    cocina: ['olla', 'plato-sucio', 'platano', 'manzana', 'envoltura', 'pizza'],
    sala: ['control', 'cojin', 'revista', 'vaso', 'snacks', 'calcetin'],
    lavanderia: ['ropa-sucia', 'escoba', 'recogedor', 'detergente', 'calcetin', 'balde'],
    bano: ['toalla', 'papel-higienico', 'camiseta', 'patito', 'jabon', 'cepillo'],
    mascota: ['hueso', 'comida', 'plato-volcado', 'pelota', 'pelos', 'pluma'],
    oficina: ['papel', 'taza', 'hoja', 'lapicero', 'cuaderno', 'carpeta'],
  });
  for (const grupo of GRUPOS) {
    assert.equal(NOMBRES_DE_OBJETOS[grupo].length, 6, grupo);
    assert.equal(new Set(NOMBRES_DE_OBJETOS[grupo]).size, 6, grupo);
    const dibujos = [0, 1, 2, 3, 4, 5].map((i) => OBJETOS[`objeto:${grupo}:${i}`].join('\n'));
    assert.equal(new Set(dibujos).size, 6, `${grupo}: dibujos repetidos`);
  }
  assert.equal(Object.keys(OBJETOS).length, 42);
});

test('AC-1.3, AC-1.4 y AC-1.5: cada objeto mide 16×16, usa la paleta y deja ver el piso y tiene color', () => {
  for (const [clave, g] of Object.entries(OBJETOS)) {
    verificar(clave, g);
    assert.ok(g.join('').includes('.'), `${clave}: sin píxeles transparentes`);
    assert.ok(pixeles(g) > 0, `${clave}: vacío`);
  }
});

test('FR-1: las manchas, las telarañas y las moscas miden 16×16, usan la paleta y no están vacías', () => {
  assert.deepEqual(Object.keys(MANCHAS).sort(), ['mancha:agua', 'mancha:suciedad-grande', 'mancha:suciedad-pequena']);
  assert.deepEqual(Object.keys(TELARANAS).sort(), ['telarana:derecha', 'telarana:izquierda']);
  assert.deepEqual(MOSCAS, ['moscas']);
  for (const [clave, g] of Object.entries({ ...MANCHAS, ...TELARANAS, moscas: SUCIEDAD.moscas })) {
    verificar(clave, g);
    assert.ok(pixeles(g) > 0, `${clave}: vacío`);
  }
  assert.ok(pixeles(MANCHAS['mancha:suciedad-grande']) > pixeles(MANCHAS['mancha:suciedad-pequena']));
  assert.deepEqual(TELARANAS['telarana:derecha'], TELARANAS['telarana:izquierda'].map((f) => [...f].reverse().join('')));
  assert.equal(MANCHAS_DE_AGUA, 2);
  assert.deepEqual([...TIPOS_CON_AGUA].sort(), ['bano', 'cocina']);
  assert.deepEqual([...TIPOS_CON_MOSCAS].sort(), ['bano', 'cocina', 'mascota']);
});

test('AC-5.1 y AC-5.2: las sobreposiciones son exactamente las de la spec, de 16×16 y con algún píxel', () => {
  const esperadas = [
    'B:inicio:desordenado', 'B:fin:desordenado', 'B:inicio:desastre', 'B:fin:desastre',
    'K:unico:desastre',
    'L:unico:desordenado', 'L:unico:desastre',
    'M:inicio:desordenado', 'M:medio:desordenado', 'M:fin:desordenado', 'M:inicio:desastre', 'M:medio:desastre', 'M:fin:desastre',
    'T:inicio:desordenado', 'T:fin:desordenado', 'T:inicio:desastre', 'T:fin:desastre',
    'w:unico:desordenado', 'w:unico:desastre',
    'W:unico:desastre', 'U:unico:desastre',
    'P:unico:desordenado', 'P:unico:desastre',
    'E:inicio:desordenado', 'E:fin:desordenado', 'E:inicio:desastre', 'E:fin:desastre',
  ].map((k) => `sobre:${k}`);
  assert.deepEqual(Object.keys(SOBREPOSICIONES).sort(), esperadas.sort());
  for (const [clave, g] of Object.entries(SOBREPOSICIONES)) {
    verificar(clave, g);
    assert.ok(pixeles(g) > 0, `${clave}: vacía`);
  }
});

test('AC-5.6: las sobreposiciones de desordenado y desastre difieren, salvo la cama deshecha, que es la misma', () => {
  for (const [clave, g] of Object.entries(SOBREPOSICIONES)) {
    if (!clave.endsWith(':desordenado')) continue;
    const par = SOBREPOSICIONES[clave.replace(':desordenado', ':desastre')];
    if (clave.startsWith('sobre:B:')) assert.deepEqual(par, g, clave);
    else assert.notDeepEqual(par, g, clave);
  }
});

test('AC-5.5: las sobreposiciones de las partes contiguas de una pieza se unen en el borde que comparten', () => {
  const PARTES = { B: ['inicio', 'fin'], M: ['inicio', 'medio', 'fin'], T: ['inicio', 'fin'], E: ['inicio', 'fin'] };
  const fila = (g, y) => g[y];
  const columna = (g, x) => g.map((f) => f[x]).join('');
  for (const [letra, partes] of Object.entries(PARTES)) {
    for (const estado of ['desordenado', 'desastre']) {
      for (let i = 0; i + 1 < partes.length; i++) {
        const a = SOBREPOSICIONES[`sobre:${letra}:${partes[i]}:${estado}`];
        const b = SOBREPOSICIONES[`sobre:${letra}:${partes[i + 1]}:${estado}`];
        if (EJE_DE_PIEZA[letra] === 'vertical') assert.equal(fila(a, TAM - 1), fila(b, 0), `${letra} ${estado}: unión vertical`);
        else assert.equal(columna(a, TAM - 1), columna(b, 0), `${letra} ${estado}: unión horizontal`);
      }
    }
  }
});

test('FR-1: SUCIEDAD reúne todos los dibujos nuevos por clave, sin repetir claves', () => {
  const partes = [OBJETOS, MANCHAS, TELARANAS, { moscas: SUCIEDAD.moscas }, SOBREPOSICIONES];
  const total = partes.reduce((n, p) => n + Object.keys(p).length, 0);
  assert.equal(Object.keys(SUCIEDAD).length, total);
  assert.equal(total, 42 + 3 + 2 + 1 + 27);
});
```
- [ ] Run: `cd poc && node --test test/suciedad.test.js`. Expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/arte/suciedad.js`).
- [ ] Implementar `src/arte/suciedad.js`:
```js
// src/arte/suciedad.js
import { lienzo, rect, caja, cuadricula } from './lienzo.js';

// Arte del desorden (FR-1 y FR-5 de la 010, ADR-008): objetos del suelo por grupo de arte, manchas, telarañas, moscas y las sobreposiciones de
// los muebles desordenados o sucios. Cuadrículas de 16×16 con claves de la paleta; '.' es transparente. Datos puros: sin Phaser ni DOM, y sin
// importar el dominio ni el generador.
const una = (dibujar) => { const l = lienzo(); dibujar(l); return cuadricula(l); };
const px = (l, puntos, c) => { for (const [x, y] of puntos) if (l[y]?.[x] !== undefined) l[y][x] = c; };
const sinEsquinas = (l, x0, y0, x1, y1) => px(l, [[x0, y0], [x1, y0], [x0, y1], [x1, y1]], '.');
const espejo = (g) => g.map((fila) => [...fila].reverse().join(''));
const ruido = (x, y) => (x * 7 + y * 13 + x * y * 3) % 11; // determinista: el mismo píxel da siempre el mismo valor

// Línea de un píxel de ancho entre dos puntos.
function linea(l, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) px(l, [[Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n)]], c);
}

// Mancha irregular: relleno `c`, borde punteado `borde` y brillos `hi`; `semilla` la desplaza un píxel y cambia su ruido.
function mancha(semilla, rx, ry, c, hi, borde = c) {
  return una((l) => {
    const cx = 7.5 + ((semilla * 3) % 3) - 1;
    const cy = 7.5 + ((semilla * 5) % 3) - 1;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const r = dx * dx + dy * dy + 0.4 * (ruido(x + semilla, y + semilla * 2) / 11 - 0.5);
        if (r < 0.7) l[y][x] = r < 0.45 && ruido(x + semilla * 3, y) % 6 === 0 ? hi : c;
        else if (r < 1 && (x + y) % 2 === 0) l[y][x] = borde;
      }
    }
  });
}

// ---------- Grupos de arte (FR-1) ----------
export const GRUPOS = ['dormitorio', 'cocina', 'sala', 'lavanderia', 'bano', 'mascota', 'oficina'];
// La sala y el comedor comparten grupo; el baño común y los internos, también.
export const GRUPO_DE_TIPO = {
  sala: 'sala', comedor: 'sala', cocina: 'cocina', bano: 'bano', lavanderia: 'lavanderia', mascota: 'mascota', dormitorio: 'dormitorio', oficina: 'oficina',
};
export const NOMBRES_DE_OBJETOS = {
  dormitorio: ['camiseta', 'pantalon', 'calcetin', 'zapato', 'libro', 'peluche'],
  cocina: ['olla', 'plato-sucio', 'platano', 'manzana', 'envoltura', 'pizza'],
  sala: ['control', 'cojin', 'revista', 'vaso', 'snacks', 'calcetin'],
  lavanderia: ['ropa-sucia', 'escoba', 'recogedor', 'detergente', 'calcetin', 'balde'],
  bano: ['toalla', 'papel-higienico', 'camiseta', 'patito', 'jabon', 'cepillo'],
  mascota: ['hueso', 'comida', 'plato-volcado', 'pelota', 'pelos', 'pluma'],
  oficina: ['papel', 'taza', 'hoja', 'lapicero', 'cuaderno', 'carpeta'],
};
export const TIPOS_CON_AGUA = ['cocina', 'bano'];
export const TIPOS_CON_MOSCAS = ['cocina', 'bano', 'mascota'];
export const MANCHAS_DE_AGUA = 2; // las primeras manchas de un espacio con agua

// ---------- Objetos sueltos del piso ----------
const DIBUJOS = {
  camiseta: una((l) => { caja(l, 2, 5, 13, 8, 'g'); caja(l, 4, 5, 11, 13, 'g'); px(l, [[7, 5], [8, 5]], 'k'); px(l, [[5, 7], [6, 8], [10, 9]], 'h'); }),
  pantalon: una((l) => { caja(l, 4, 3, 11, 6, 'i'); caja(l, 4, 6, 7, 13, 'i'); caja(l, 8, 6, 11, 13, 'i'); px(l, [[5, 4], [6, 4], [5, 9]], 'g'); }),
  calcetin: una((l) => { caja(l, 5, 3, 8, 9, 'm'); caja(l, 5, 8, 12, 12, 'm'); px(l, [[6, 4], [7, 4], [6, 10], [7, 10], [8, 10]], 'n'); }),
  zapato: una((l) => { caja(l, 2, 8, 13, 12, 'd'); caja(l, 3, 5, 7, 8, 'd'); rect(l, 3, 12, 12, 12, 'k'); px(l, [[5, 6], [6, 7], [9, 10]], 'e'); px(l, [[4, 6]], 'j'); }),
  libro: una((l) => { caja(l, 3, 4, 12, 12, 'q'); rect(l, 4, 5, 4, 11, 'k'); rect(l, 6, 6, 10, 6, 'r'); rect(l, 6, 8, 9, 8, 'r'); }),
  peluche: una((l) => { caja(l, 5, 6, 10, 12, 'A'); caja(l, 4, 3, 6, 6, 'A'); caja(l, 9, 3, 11, 6, 'A'); px(l, [[6, 8], [9, 8]], 'k'); px(l, [[7, 10], [8, 10]], 'm'); }),
  olla: una((l) => { caja(l, 3, 5, 12, 12, 's'); rect(l, 1, 7, 2, 8, 'k'); rect(l, 13, 7, 14, 8, 'k'); rect(l, 4, 6, 11, 7, 'a'); px(l, [[5, 9], [6, 9], [9, 10]], 'v'); }),
  'plato-sucio': una((l) => { caja(l, 3, 6, 12, 12, 'j'); sinEsquinas(l, 3, 6, 12, 12); rect(l, 5, 8, 10, 9, 'd'); px(l, [[6, 8], [9, 9], [8, 10]], 'q'); }),
  platano: una((l) => { caja(l, 2, 8, 13, 11, 'r'); sinEsquinas(l, 2, 8, 13, 11); caja(l, 4, 5, 9, 8, 'r'); px(l, [[6, 9], [9, 9], [11, 10]], 'd'); px(l, [[3, 9]], 'k'); }),
  manzana: una((l) => {
    caja(l, 4, 5, 11, 12, 'q'); sinEsquinas(l, 4, 5, 11, 12); rect(l, 9, 5, 11, 8, '.'); rect(l, 9, 7, 10, 9, 'j');
    px(l, [[8, 8]], 'k'); px(l, [[7, 3], [7, 4]], 'd'); px(l, [[8, 3]], 'o'); px(l, [[5, 7]], 'n');
  }),
  envoltura: una((l) => { caja(l, 3, 6, 12, 11, 'r'); px(l, [[2, 7], [2, 9], [13, 8], [13, 10]], 'r'); rect(l, 5, 7, 10, 8, 'q'); px(l, [[6, 10], [8, 10], [9, 10]], 'j'); }),
  pizza: una((l) => { caja(l, 2, 4, 13, 12, 'z'); rect(l, 3, 5, 12, 5, 'A'); px(l, [[5, 8], [8, 7], [10, 9], [6, 10]], 'q'); px(l, [[7, 8], [9, 8], [7, 10]], 'r'); }),
  control: una((l) => { caja(l, 5, 2, 10, 13, 'a'); px(l, [[6, 4]], 'q'); px(l, [[8, 4]], 'o'); px(l, [[6, 6], [7, 6], [8, 6], [9, 6]], 'b'); px(l, [[6, 8], [8, 8], [6, 10], [8, 10]], 'b'); }),
  cojin: una((l) => { caja(l, 3, 4, 12, 12, 'n'); sinEsquinas(l, 3, 4, 12, 12); px(l, [[7, 7], [8, 8], [7, 8], [8, 7]], 'm'); }),
  revista: una((l) => { caja(l, 3, 3, 12, 12, 'h'); rect(l, 5, 5, 10, 6, 'j'); rect(l, 5, 8, 10, 8, 'j'); rect(l, 5, 10, 8, 10, 'g'); }),
  vaso: una((l) => { caja(l, 5, 4, 10, 12, 'u'); rect(l, 6, 8, 9, 11, 'r'); px(l, [[6, 5]], 'j'); }),
  snacks: una((l) => { caja(l, 4, 7, 11, 12, 'j'); sinEsquinas(l, 4, 7, 11, 12); rect(l, 5, 5, 10, 6, 'r'); px(l, [[6, 4], [8, 4], [9, 5], [5, 6]], 'A'); }),
  'ropa-sucia': una((l) => { caja(l, 3, 5, 12, 12, 'e'); sinEsquinas(l, 3, 5, 12, 12); rect(l, 4, 6, 7, 8, 'h'); rect(l, 8, 8, 11, 11, 'n'); px(l, [[9, 6], [5, 10], [7, 11]], 'd'); }),
  escoba: una((l) => { linea(l, 11, 1, 5, 11, 'd'); linea(l, 12, 1, 6, 11, 'd'); caja(l, 2, 11, 8, 14, 'r'); px(l, [[3, 13], [5, 13], [7, 13]], 'd'); }),
  recogedor: una((l) => { caja(l, 2, 8, 11, 12, 's'); rect(l, 11, 5, 12, 10, 'a'); rect(l, 3, 9, 9, 10, 'v'); px(l, [[5, 9], [7, 9]], 'A'); }),
  detergente: una((l) => { caja(l, 5, 4, 10, 13, 'g'); rect(l, 6, 2, 9, 3, 'q'); rect(l, 6, 7, 9, 10, 'j'); px(l, [[7, 8], [8, 9]], 'g'); }),
  balde: una((l) => { caja(l, 4, 6, 11, 13, 's'); rect(l, 5, 7, 10, 8, 'h'); rect(l, 3, 3, 3, 6, 'k'); rect(l, 12, 3, 12, 6, 'k'); rect(l, 3, 3, 12, 3, 'k'); }),
  toalla: una((l) => { caja(l, 3, 4, 12, 12, 'h'); rect(l, 4, 7, 11, 7, 'j'); rect(l, 4, 9, 11, 9, 'j'); px(l, [[3, 12], [5, 12], [7, 12], [9, 12], [11, 12]], 'g'); }),
  'papel-higienico': una((l) => { caja(l, 4, 3, 10, 8, 'j'); px(l, [[7, 5], [7, 6]], 'l'); caja(l, 6, 9, 9, 14, 'j'); px(l, [[7, 11], [8, 12]], 'l'); }),
  patito: una((l) => { caja(l, 5, 7, 11, 12, 'r'); caja(l, 4, 3, 8, 7, 'r'); px(l, [[3, 5], [3, 4]], 'q'); px(l, [[6, 4]], 'k'); px(l, [[10, 9]], 'd'); }),
  jabon: una((l) => { caja(l, 4, 7, 11, 11, 'n'); sinEsquinas(l, 4, 7, 11, 11); px(l, [[6, 8], [7, 8]], 'y'); px(l, [[12, 6], [13, 5], [13, 7]], 'j'); }),
  cepillo: una((l) => { linea(l, 3, 12, 11, 6, 'g'); linea(l, 4, 12, 12, 6, 'g'); rect(l, 11, 3, 13, 5, 'j'); px(l, [[11, 3], [12, 3], [13, 3]], 'h'); }),
  hueso: una((l) => { caja(l, 3, 6, 12, 9, 'j'); caja(l, 2, 4, 4, 7, 'j'); caja(l, 2, 8, 4, 11, 'j'); caja(l, 11, 4, 13, 7, 'j'); caja(l, 11, 8, 13, 11, 'j'); }),
  comida: una((l) => { px(l, [[3, 4], [6, 3], [10, 5], [12, 8], [5, 8], [8, 7], [4, 11], [9, 12], [12, 12], [7, 10]], 'd'); px(l, [[4, 4], [7, 3], [11, 5], [6, 8], [10, 12]], 'e'); }),
  'plato-volcado': una((l) => { caja(l, 3, 7, 12, 12, 'r'); sinEsquinas(l, 3, 7, 12, 12); rect(l, 4, 8, 11, 8, 'q'); px(l, [[13, 10], [14, 9], [14, 11], [15, 10]], 'd'); }),
  pelota: una((l) => { caja(l, 5, 5, 10, 10, 'o'); sinEsquinas(l, 5, 5, 10, 10); px(l, [[6, 6], [7, 6]], 'p'); px(l, [[9, 9]], 'k'); }),
  pelos: una((l) => { linea(l, 3, 10, 8, 6, 'd'); linea(l, 5, 12, 11, 8, 'A'); linea(l, 7, 5, 11, 4, 'r'); linea(l, 6, 9, 12, 12, 'd'); }),
  pluma: una((l) => { linea(l, 4, 12, 12, 3, 'o'); linea(l, 5, 12, 13, 3, 'p'); px(l, [[3, 13]], 'k'); }),
  papel: una((l) => { caja(l, 4, 5, 10, 10, 'j'); sinEsquinas(l, 4, 5, 10, 10); px(l, [[6, 7], [7, 7], [8, 8], [6, 9]], 'l'); }),
  taza: una((l) => { caja(l, 4, 5, 10, 11, 'j'); caja(l, 10, 7, 13, 9, 'j'); rect(l, 5, 6, 9, 7, 'd'); }),
  hoja: una((l) => { caja(l, 3, 3, 12, 13, 'j'); rect(l, 5, 5, 10, 5, 'l'); rect(l, 5, 7, 10, 7, 'l'); rect(l, 5, 9, 8, 9, 'l'); }),
  lapicero: una((l) => { linea(l, 3, 12, 12, 4, 'k'); linea(l, 3, 11, 12, 3, 'r'); linea(l, 4, 12, 13, 4, 'r'); px(l, [[2, 13], [3, 13]], 'k'); }),
  cuaderno: una((l) => { caja(l, 3, 3, 12, 13, 'x'); rect(l, 4, 3, 4, 13, 'k'); rect(l, 6, 5, 11, 5, 'w'); rect(l, 6, 7, 11, 7, 'w'); }),
  carpeta: una((l) => { caja(l, 3, 4, 12, 12, 'r'); rect(l, 3, 4, 7, 5, 'r'); rect(l, 5, 8, 10, 8, 'd'); }),
};
export const OBJETOS = Object.fromEntries(Object.entries(NOMBRES_DE_OBJETOS).flatMap(([grupo, nombres]) =>
  nombres.map((nombre, i) => [`objeto:${grupo}:${i}`, DIBUJOS[nombre]])));

// ---------- Manchas, telarañas y moscas ----------
export const MANCHAS = {
  'mancha:suciedad-grande': mancha(1, 7, 6, 'd', 'e'),
  'mancha:suciedad-pequena': mancha(2, 4.5, 3.8, 'd', 'e'),
  'mancha:agua': mancha(3, 6, 5, 'h', 'j', 'g'),
};
// Telaraña de la esquina superior izquierda; la de la derecha es su espejo.
const telaranaIzquierda = una((l) => {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const r = Math.round(Math.hypot(x, y));
      const radio = x === 0 || y === 0 || x === y || (y > 0 && x === 2 * y) || (x > 0 && y === 2 * x);
      if (r <= 13 && (radio || r === 5 || r === 9 || r === 13)) l[y][x] = 's';
    }
  }
});
export const TELARANAS = { 'telarana:izquierda': telaranaIzquierda, 'telarana:derecha': espejo(telaranaIzquierda) };
export const MOSCAS = ['moscas'];
const dibujoDeMoscas = una((l) => { px(l, [[4, 3], [11, 6], [7, 11], [12, 12]], 'k'); px(l, [[5, 3], [10, 6], [8, 11], [11, 12]], 'c'); });

// ---------- Muebles desordenados o sucios (FR-5): sobreposiciones transparentes sobre el mueble de la 008 ----------
const camaInicio = una((l) => { // colcha corrida, almohada torcida y la sábana que asoma
  rect(l, 3, 4, 12, 8, 'g'); rect(l, 6, 4, 12, 7, 'j'); rect(l, 6, 7, 12, 7, 'l');
  for (let y = 9; y <= 15; y++) rect(l, 3, y, 3 + (y - 9), y, 'j');
  px(l, [[5, 11], [9, 12], [11, 14], [8, 10]], 'i'); px(l, [[11, 10], [10, 11]], 'h');
});
const camaFin = una((l) => { // la sábana sigue en el pie y la colcha cuelga del costado
  for (let y = 0; y <= 6; y++) rect(l, 3, y, 3 + (6 - y), y, 'j');
  px(l, [[10, 3], [11, 4], [9, 8], [6, 9], [12, 9]], 'i'); px(l, [[8, 4]], 'h');
  rect(l, 12, 5, 13, 9, 'g'); px(l, [[13, 5], [13, 6], [13, 7], [13, 8], [13, 9]], 'k');
});
const cocinaGrasa = una((l) => {
  px(l, [[3, 3], [4, 4], [5, 5], [10, 4], [11, 6], [4, 9], [5, 10], [10, 9], [11, 11], [3, 12], [8, 12]], 'd');
  px(l, [[4, 3], [5, 4], [11, 5], [10, 10], [4, 11], [9, 12], [6, 2]], 'r');
  rect(l, 3, 7, 8, 7, 'd'); px(l, [[9, 7], [12, 7]], 'd');
});
const lavaderoPlatos = una((l) => { caja(l, 4, 5, 8, 8, 'j'); caja(l, 7, 6, 11, 9, 'j'); px(l, [[5, 6], [6, 7], [9, 7], [10, 8]], 'd'); px(l, [[8, 7]], 'q'); });
const lavaderoEspuma = una((l) => {
  caja(l, 4, 5, 8, 8, 'j'); caja(l, 7, 6, 11, 9, 'j'); px(l, [[5, 6], [9, 7]], 'd');
  for (const [x, y] of [[3, 4], [7, 3], [11, 4], [5, 10], [9, 10], [6, 6], [10, 7]]) {
    rect(l, x, y, x + 1, y + 1, 'j'); px(l, [[x, y]], 'h');
  }
  px(l, [[13, 9], [2, 8]], 'j'); px(l, [[3, 12], [4, 13], [12, 12], [13, 13]], 'h');
});
// Migas y derrames de las mesas: `dx` desplaza algunos puntos para que las partes de una mesa larga no se vean calcadas.
const mesaMigas = (dx) => una((l) => { px(l, [[3 + dx, 6], [8, 9], [12 - dx, 5], [6, 10]], 'A'); px(l, [[4, 8], [10, 7], [13 - dx, 10]], 'd'); });
const mesaDerrame = (dx) => una((l) => {
  px(l, [[3 + dx, 6], [8, 9], [12 - dx, 5], [6, 10]], 'A');
  rect(l, 3, 6, 11, 9, 'D'); rect(l, 2, 7, 12, 8, 'D'); rect(l, 5, 5, 9, 10, 'D');
  px(l, [[4, 7], [6, 8], [9, 6], [8, 9]], 'd'); px(l, [[10, 8], [11, 8]], 'q');
});
const lavamanosEspuma = una((l) => { px(l, [[7, 5], [8, 5], [6, 6], [9, 6]], 'j'); px(l, [[7, 6]], 'h'); px(l, [[5, 13]], 'h'); });
const lavamanosLleno = una((l) => { rect(l, 6, 5, 9, 8, 'j'); px(l, [[6, 5], [9, 7]], 'h'); px(l, [[4, 13], [5, 13], [11, 13]], 'h'); px(l, [[3, 2], [11, 2]], 'j'); });
const inodoroSucio = una((l) => { px(l, [[6, 7], [8, 8], [9, 10], [7, 12], [6, 11], [9, 3]], 'd'); px(l, [[7, 9], [8, 11]], 'A'); px(l, [[11, 13], [12, 13], [12, 14]], 'h'); });
const duchaMoho = una((l) => {
  px(l, [[3, 11], [4, 12], [5, 13], [5, 11], [10, 12], [11, 13], [12, 12], [12, 10], [3, 9], [4, 10], [11, 5]], 'o');
  px(l, [[4, 11], [11, 12], [4, 9]], 'p'); rect(l, 7, 11, 8, 13, 'j');
});
const camaRevuelta = una((l) => { rect(l, 4, 5, 10, 8, 'n'); rect(l, 5, 9, 12, 11, 'q'); px(l, [[3, 12], [4, 12], [2, 11]], 'q'); px(l, [[6, 6]], 'm'); });
const camaManchada = una((l) => {
  rect(l, 4, 5, 10, 8, 'n'); rect(l, 5, 9, 12, 11, 'q'); px(l, [[3, 12], [4, 12], [2, 11]], 'q'); px(l, [[6, 6]], 'm');
  px(l, [[8, 7], [10, 10]], 'd'); px(l, [[5, 5], [9, 6], [7, 9]], 'A');
});
const escritorioPapeles = (dx) => una((l) => { caja(l, 4 + dx, 4, 9 + dx, 8, 'j'); caja(l, 6 + dx, 6, 11 + dx, 9, 'j'); px(l, [[5 + dx, 5], [7 + dx, 7], [10 + dx, 8]], 'l'); });
const escritorioTaza = (dx) => una((l) => {
  caja(l, 3 + dx, 3, 8 + dx, 8, 'j'); caja(l, 6 + dx, 5, 11 + dx, 9, 'j'); caja(l, 9 + dx, 6, 13 + dx, 10, 'l'); px(l, [[4 + dx, 4], [7 + dx, 7]], 'l');
  rect(l, 4, 9, 9, 10, 'd'); px(l, [[3, 10], [10, 10]], 'd');
});

const SOBRE = {
  B: { desordenado: { inicio: camaInicio, fin: camaFin }, desastre: { inicio: camaInicio, fin: camaFin } },
  K: { desastre: { unico: cocinaGrasa } },
  L: { desordenado: { unico: lavaderoPlatos }, desastre: { unico: lavaderoEspuma } },
  M: {
    desordenado: { inicio: mesaMigas(0), medio: mesaMigas(1), fin: mesaMigas(2) },
    desastre: { inicio: mesaDerrame(0), medio: mesaDerrame(1), fin: mesaDerrame(2) },
  },
  T: { desordenado: { inicio: mesaMigas(0), fin: mesaMigas(2) }, desastre: { inicio: mesaDerrame(0), fin: mesaDerrame(2) } },
  w: { desordenado: { unico: lavamanosEspuma }, desastre: { unico: lavamanosLleno } },
  W: { desastre: { unico: inodoroSucio } },
  U: { desastre: { unico: duchaMoho } },
  P: { desordenado: { unico: camaRevuelta }, desastre: { unico: camaManchada } },
  E: { desordenado: { inicio: escritorioPapeles(0), fin: escritorioPapeles(1) }, desastre: { inicio: escritorioTaza(0), fin: escritorioTaza(1) } },
};
export const SOBREPOSICIONES = Object.fromEntries(Object.entries(SOBRE).flatMap(([letra, porEstado]) =>
  Object.entries(porEstado).flatMap(([estado, partes]) =>
    Object.entries(partes).map(([variante, g]) => [`sobre:${letra}:${variante}:${estado}`, g]))));

// Todos los dibujos nuevos por clave, para preparar la hoja de texturas.
export const SUCIEDAD = { ...OBJETOS, ...MANCHAS, ...TELARANAS, moscas: dibujoDeMoscas, ...SOBREPOSICIONES };
```
- [ ] Run: `cd poc && node --test test/suciedad.test.js`. Expect: PASS (8 pruebas).
- [ ] Commit: `feat(poc): add the art of the mess: objects, stains, cobwebs, flies and dirty furniture` (cuerpo: `Plan section: Phase 2: Arte del desorden` y `Feature: 010-estados-de-limpieza`)

---

## Phase 3: Arte de cada casilla con estados y regla de redibujo

**Implements:** FR-2, FR-3, FR-4, FR-5, FR-6, FR-7 | **Satisfies:** AC-2.1 a AC-2.9, AC-3.1 a AC-3.6, AC-4.1 a AC-4.7, AC-5.3, AC-5.4, AC-6.1, AC-6.2, AC-7.5, AC-8.1, AC-8.3
**Files:** `poc/src/arte/casillas.js`, `poc/test/casillas-estados.test.js`
**Interfaces:** Consumes: `objetosDelSuelo`, `manchasDelSuelo`, `moscasDelSuelo`, `esquinasDelEspacio` de `src/aspecto.js`; `claveCasilla` de `src/posicion.js`; `SUCIEDAD`, `GRUPO_DE_TIPO`, `TIPOS_CON_AGUA`, `TIPOS_CON_MOSCAS`, `MANCHAS_DE_AGUA` de `src/arte/suciedad.js`. Produces: `ORDEN_DE_CAPAS`; `arteDelMapa(estado, distribucion, limpiezas = new Map())` → matriz de `null | { base, mueble, mancha, sobre, telarana, objeto, moscas }` (claves de textura o `null`; `limpiezas` es un `Map` de id de espacio → `'limpio' | 'desordenado' | 'desastre'`, y los espacios que faltan, como el pasillo, son limpios); `estadosCambiaron(antes, despues)` → `boolean`.

Aquí se compone lo que se ve en cada casilla. `TEXTURAS`, `vistaDePared` y `varianteDeMueble` no cambian; sin estados el resultado es el de la 008, con cinco capas nuevas en `null`.

- [ ] Escribir las pruebas:
```js
// test/casillas-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, renombrarEspacio, espaciosActivos, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion } from '../src/distribucion.js';
import { casillasLibres, objetosDelSuelo, manchasDelSuelo, moscasDelSuelo, esquinasDelEspacio } from '../src/aspecto.js';
import { arteDelMapa, ORDEN_DE_CAPAS, estadosCambiaron, TEXTURAS } from '../src/arte/casillas.js';
import { LETRAS_MUEBLE } from '../src/arte/mobiliario.js';
import { SUCIEDAD, SOBREPOSICIONES, GRUPO_DE_TIPO, TIPOS_CON_AGUA, TIPOS_CON_MOSCAS } from '../src/arte/suciedad.js';
import { crearCtx, todasLasCombinaciones } from './ayuda.js';

// Hogar con un espacio de cada tipo y dos baños internos: sala, comedor, cocina, baño común, lavandería, mascota, dormitorio, oficina y 2 baños.
function hogarCompleto() {
  const ctx = crearCtx();
  return ['comedor', 'lavanderia', 'mascota', 'oficina', 'bano', 'bano'].reduce((e, t) => agregarEspacio(e, t, ctx), crearHogarInicial(ctx));
}
const todos = (estado, valor) => new Map(espaciosActivos(estado).map((e) => [e.id, valor]));
const solo = (id, valor) => new Map([[id, valor]]);
const clave = (c) => `${c.x},${c.y}`;
// Casillas del mapa con una capa dada: [{ x, y, valor }] en orden de lectura.
const conCapa = (arte, capa) => arte.flatMap((fila, y) => fila.flatMap((celda, x) => (celda?.[capa] ? [{ x, y, valor: celda[capa] }] : [])));
const mapaDe = (e) => { const d = generarDistribucion(e); return { d, arte: (limpiezas) => arteDelMapa(e, d, limpiezas) }; };

test('AC-8.1: con todo limpio, o sin indicar estados, el arte es el de la 008 y las capas nuevas están vacías', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  assert.deepEqual(arte(todos(e, 'limpio')), arte());
  for (const fila of arte()) for (const celda of fila) {
    if (!celda) continue;
    for (const capa of ['mancha', 'sobre', 'telarana', 'objeto', 'moscas']) assert.equal(celda[capa], null, capa);
  }
  assert.deepEqual(ORDEN_DE_CAPAS.filter((c) => c !== 'base' && c !== 'mueble'), ['mancha', 'sobre', 'telarana', 'objeto', 'moscas']);
  assert.ok(d.alto > 0);
});

test('AC-2.1, AC-2.2, AC-2.3, AC-2.5, AC-2.6: los objetos son 4 y 12, en casillas libres, del grupo de su tipo, y el desastre conserva los del desorden', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    const grupo = GRUPO_DE_TIPO[espacio.tipo];
    assert.deepEqual(conCapa(arte(solo(espacio.id, 'limpio')), 'objeto'), []);
    const porEstado = {};
    for (const [estado, n] of [['desordenado', 4], ['desastre', 12]]) {
      const objetos = conCapa(arte(solo(espacio.id, estado)), 'objeto');
      porEstado[estado] = objetos;
      assert.equal(objetos.length, Math.min(n, libres.size), `${espacio.tipo} ${estado}`);
      assert.equal(new Set(objetos.map(clave)).size, objetos.length);
      for (const o of objetos) assert.ok(libres.has(clave(o)), `${espacio.tipo}: objeto fuera de las casillas libres`);
      const esperados = objetosDelSuelo(d, espacio.id, estado).map((o) => ({ x: o.x, y: o.y, valor: `objeto:${grupo}:${o.variante}` }));
      assert.deepEqual(objetos.sort((a, b) => a.y - b.y || a.x - b.x), esperados.sort((a, b) => a.y - b.y || a.x - b.x));
    }
    for (const o of porEstado.desordenado) assert.ok(porEstado.desastre.some((p) => p.x === o.x && p.y === o.y && p.valor === o.valor), 'el desastre conserva el objeto');
  }
});

test('AC-2.4: el baño interno, con 4 casillas libres, muestra 4 objetos en desordenado y en desastre', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  const bano = espaciosActivos(e).find((s) => s.tipo === 'bano' && s.contenidoEn !== null);
  assert.equal(casillasLibres(d, bano.id).length, 4);
  for (const estado of ['desordenado', 'desastre']) assert.equal(conCapa(arte(solo(bano.id, estado)), 'objeto').length, 4);
});

test('AC-2.8 y AC-2.9: el pasillo no tiene arte de estado, y el comedor usa los objetos de la sala', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  assert.ok(d.pasillos.length > 0);
  const mapa = arte(todos(e, 'desastre'));
  d.espacioEn.forEach((fila, y) => fila.forEach((id, x) => {
    if (!id?.startsWith('pasillo:')) return;
    for (const capa of ['mancha', 'sobre', 'telarana', 'objeto', 'moscas']) assert.equal(mapa[y][x]?.[capa] ?? null, null, `pasillo ${x},${y} ${capa}`);
  }));
  const comedor = espaciosDeTipo(e, 'comedor')[0];
  const objetos = conCapa(arte(solo(comedor.id, 'desordenado')), 'objeto');
  assert.equal(objetos.length, 4);
  for (const o of objetos) assert.ok(o.valor.startsWith('objeto:sala:'), o.valor);
});

test('AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5: las manchas solo salen en desastre, con agua en cocina y baño, alternando tamaños y debajo del objeto', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const espacio of espaciosActivos(e)) {
    for (const estado of ['limpio', 'desordenado']) assert.deepEqual(conCapa(arte(solo(espacio.id, estado)), 'mancha'), []);
    const mapa = arte(solo(espacio.id, 'desastre'));
    const manchas = manchasDelSuelo(d, espacio.id, 'desastre');
    assert.equal(conCapa(mapa, 'mancha').length, manchas.length);
    const valores = manchas.map((c) => mapa[c.y][c.x].mancha);
    const conAgua = TIPOS_CON_AGUA.includes(espacio.tipo);
    valores.forEach((v, i) => assert.equal(v === 'mancha:agua', conAgua && i < 2, `${espacio.tipo} mancha ${i}`));
    const suciedad = valores.filter((v) => v !== 'mancha:agua');
    suciedad.forEach((v, i) => assert.equal(v, i % 2 === 0 ? 'mancha:suciedad-grande' : 'mancha:suciedad-pequena', `${espacio.tipo} suciedad ${i}`));
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    for (const c of manchas) assert.ok(libres.has(clave(c)));
  }
  assert.ok(ORDEN_DE_CAPAS.indexOf('mancha') < ORDEN_DE_CAPAS.indexOf('objeto'));
  assert.ok(ORDEN_DE_CAPAS.indexOf('mancha') < ORDEN_DE_CAPAS.indexOf('mueble'));
});

test('AC-4.1, AC-4.5, AC-4.6: las moscas son 2 casillas solo en desastre y solo en cocina, baño y mascota, encima del objeto', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const espacio of espaciosActivos(e)) {
    for (const estado of ['limpio', 'desordenado']) assert.deepEqual(conCapa(arte(solo(espacio.id, estado)), 'moscas'), []);
    const moscas = conCapa(arte(solo(espacio.id, 'desastre')), 'moscas');
    if (!TIPOS_CON_MOSCAS.includes(espacio.tipo)) { assert.deepEqual(moscas, [], espacio.tipo); continue; }
    assert.equal(moscas.length, 2, espacio.tipo);
    assert.deepEqual(moscas.map(clave).sort(), moscasDelSuelo(d, espacio.id, 'desastre').map(clave).sort());
  }
  assert.ok(ORDEN_DE_CAPAS.indexOf('moscas') > ORDEN_DE_CAPAS.indexOf('objeto'));
});

test('AC-4.1, AC-4.2, AC-4.3, AC-4.4: las telarañas van solo en desastre, en las esquinas superiores, encima del mueble y no en la sala bajo el comedor', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  const pared = (x, y) => d.tiles[y]?.[x] === '#';
  for (const espacio of espaciosActivos(e)) {
    for (const estado of ['limpio', 'desordenado']) assert.deepEqual(conCapa(arte(solo(espacio.id, estado)), 'telarana'), []);
  }
  const mapa = arte(todos(e, 'desastre'));
  let sobreMueble = 0;
  d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
    const celda = mapa[y][x];
    if (!celda) return;
    const id = d.espacioEn[y][x];
    let esperada = null;
    if (ch !== '#' && !id?.startsWith('pasillo:') && pared(x, y - 1)) {
      if (pared(x - 1, y)) esperada = 'telarana:izquierda';
      else if (pared(x + 1, y)) esperada = 'telarana:derecha';
    }
    assert.equal(celda.telarana, esperada, `telaraña en ${x},${y}`);
    if (esperada && celda.mueble) sobreMueble++;
  }));
  assert.ok(sobreMueble > 0, 'alguna esquina está ocupada por un mueble y lleva telaraña encima');
  const sala = espaciosDeTipo(e, 'sala')[0];
  assert.deepEqual(esquinasDelEspacio(d, sala.id), []);
  assert.deepEqual(conCapa(arte(solo(sala.id, 'desastre')), 'telarana'), []);
  assert.ok(ORDEN_DE_CAPAS.indexOf('telarana') > ORDEN_DE_CAPAS.indexOf('sobre'));
});

test('AC-5.3 y AC-5.4: un mueble lleva su sobreposición solo en los estados y partes declarados; los demás se ven como en la 008', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const estado of ['limpio', 'desordenado', 'desastre']) {
    const mapa = arte(todos(e, estado));
    let con = 0;
    d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      const celda = mapa[y][x];
      if (!celda) return;
      if (!LETRAS_MUEBLE.includes(ch)) { assert.equal(celda.sobre, null); return; }
      const variante = celda.mueble.split(':')[2];
      const clave = `sobre:${ch}:${variante}:${estado}`;
      if (clave in SOBREPOSICIONES) { assert.equal(celda.sobre, clave); con++; } else assert.equal(celda.sobre, null, clave);
      assert.ok(TEXTURAS[celda.mueble], 'el mueble de la 008 se conserva');
    }));
    if (estado === 'limpio') assert.equal(con, 0);
    else assert.ok(con > 0, estado);
  }
  assert.ok(ORDEN_DE_CAPAS.indexOf('sobre') === ORDEN_DE_CAPAS.indexOf('mueble') + 1);
});

test('AC-6.1 y AC-6.2: cada espacio se ve distinto en los tres estados, y el desastre conserva el desorden y suma lo suyo', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  const area = (mapa, id) => {
    const r = d.rects[id];
    return JSON.stringify(mapa.slice(r.y, r.y + r.h).map((fila) => fila.slice(r.x, r.x + r.w)));
  };
  for (const espacio of espaciosActivos(e)) {
    const vistas = ['limpio', 'desordenado', 'desastre'].map((estado) => area(arte(solo(espacio.id, estado)), espacio.id));
    assert.equal(new Set(vistas).size, 3, `${espacio.tipo}: los tres estados deben verse distintos`);
    const desordenado = conCapa(arte(solo(espacio.id, 'desordenado')), 'objeto');
    const desastre = conCapa(arte(solo(espacio.id, 'desastre')), 'objeto');
    for (const o of desordenado) assert.ok(desastre.some((p) => clave(p) === clave(o)));
    assert.ok(conCapa(arte(solo(espacio.id, 'desastre')), 'mancha').length > 0);
  }
});

test('AC-2.7, AC-3.6, AC-4.7: el mismo hogar y los mismos estados dan el mismo arte, también al renombrar un espacio', () => {
  const e = hogarCompleto();
  const limpiezas = new Map(espaciosActivos(e).map((s, i) => [s.id, ['limpio', 'desordenado', 'desastre'][i % 3]]));
  const a = arteDelMapa(e, generarDistribucion(e), limpiezas);
  assert.deepEqual(arteDelMapa(e, generarDistribucion(e), limpiezas), a);
  const renombrado = renombrarEspacio(e, espaciosDeTipo(e, 'cocina')[0].id, 'Cocina nueva', crearCtx()).estado;
  assert.deepEqual(arteDelMapa(renombrado, generarDistribucion(renombrado), limpiezas), a);
});

test('AC-7.5: el mundo solo se recompone si cambió el estado de algún espacio; un espacio ausente cuenta como limpio', () => {
  const antes = new Map([['a', 'limpio'], ['b', 'desordenado']]);
  assert.equal(estadosCambiaron(antes, new Map([['a', 'limpio'], ['b', 'desordenado']])), false);
  assert.equal(estadosCambiaron(antes, new Map([['b', 'desordenado']])), false); // 'a' ausente = limpio
  assert.equal(estadosCambiaron(new Map(), new Map([['a', 'limpio']])), false);
  assert.equal(estadosCambiaron(antes, new Map([['a', 'limpio'], ['b', 'desastre']])), true);
  assert.equal(estadosCambiaron(antes, new Map([['a', 'desordenado'], ['b', 'desordenado']])), true);
  assert.equal(estadosCambiaron(antes, new Map([['b', 'desordenado'], ['c', 'desastre']])), true);
  assert.equal(estadosCambiaron(antes, new Map()), true); // 'b' deja de estar desordenado
});

test('AC-8.3: los objetos, manchas y muebles sucios no cambian las colisiones ni la distribución', () => {
  const e = hogarCompleto();
  const d1 = generarDistribucion(e);
  arteDelMapa(e, d1, todos(e, 'desastre'));
  assert.deepEqual(generarDistribucion(e), d1);
});

test('Error: un espacio de un tipo sin grupo de objetos se dibuja sin objetos ni manchas pero con el resto de su estado', () => {
  const e = hogarCompleto();
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  // Un tipo que el catálogo de grupos no conoce (dato futuro o corrupto que el validador no atrapó).
  const sinGrupo = { ...e, espacios: e.espacios.map((s) => (s.id === cocina.id ? { ...s, tipo: 'desconocido' } : s)) };
  const mapa = arteDelMapa(sinGrupo, d, solo(cocina.id, 'desastre'));
  assert.deepEqual(conCapa(mapa, 'objeto'), []);
  assert.deepEqual(conCapa(mapa, 'mancha'), []);
  assert.ok(conCapa(mapa, 'telarana').length > 0);
});

test('Reliability: en los 7.560 mapas toda casilla tiene arte en desastre y todo lo dibujado existe, en casillas libres y sin repetir capas', () => {
  const conocidas = new Set([...Object.keys(TEXTURAS), ...Object.keys(SUCIEDAD)]);
  let total = 0;
  for (const estado of todasLasCombinaciones()) {
    const d = generarDistribucion(estado);
    const limpiezas = todos(estado, total % 3 === 0 ? 'desordenado' : 'desastre');
    const arte = arteDelMapa(estado, d, limpiezas);
    const fallos = [];
    const libres = new Set(espaciosActivos(estado).flatMap((s) => casillasLibres(d, s.id).map(clave)));
    d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      const celda = arte[y][x];
      if (ch === ' ') { if (celda !== null) fallos.push(`vacío con arte en (${x},${y})`); return; }
      for (const capa of ORDEN_DE_CAPAS) {
        if (celda[capa] !== null && !conocidas.has(celda[capa])) fallos.push(`${capa} sin dibujo en (${x},${y}): ${celda[capa]}`);
      }
      for (const capa of ['mancha', 'objeto', 'moscas']) {
        if (celda[capa] !== null && !libres.has(clave({ x, y }))) fallos.push(`${capa} fuera de las casillas libres en (${x},${y})`);
      }
      if (ch === '#' && ORDEN_DE_CAPAS.some((c) => c !== 'base' && celda[c] !== null)) fallos.push(`pared con capas en (${x},${y})`);
    }));
    assert.deepEqual(fallos, [], `mapa ${total}`);
    if (total % 500 === 0) assert.deepEqual(arteDelMapa(estado, d, limpiezas), arte, 'no determinista');
    total++;
  }
  assert.equal(total, 7560);
});
```
- [ ] Run: `cd poc && node --test test/casillas-estados.test.js`. Expect: FAIL (`SyntaxError`: `ORDEN_DE_CAPAS` no se exporta de `casillas.js`).
- [ ] Implementar: reemplazar `src/arte/casillas.js` por:
```js
// src/arte/casillas.js
import { espaciosActivos } from '../hogar.js';
import { objetosDelSuelo, manchasDelSuelo, moscasDelSuelo, esquinasDelEspacio } from '../aspecto.js';
import { claveCasilla } from '../posicion.js';
import { SUELOS, PAREDES } from './texturas.js';
import { MUEBLES, EJE_DE_PIEZA } from './mobiliario.js';
import { SUCIEDAD, GRUPO_DE_TIPO, TIPOS_CON_AGUA, TIPOS_CON_MOSCAS, MANCHAS_DE_AGUA } from './suciedad.js';

// Todos los dibujos del mundo por clave de textura: 'suelo:<tipo>', 'pared:frente', 'pared:cima' y 'mueble:<letra>:<variante>'. Los del desorden
// (FR-1 de la 010) están en `SUCIEDAD`, de `suciedad.js`.
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

// FR-6 de la 010: orden en que se dibujan las capas de una casilla, de abajo hacia arriba.
export const ORDEN_DE_CAPAS = ['base', 'mancha', 'mueble', 'sobre', 'telarana', 'objeto', 'moscas'];

// Capas del desorden de un espacio (FR-2 a FR-4 de la 010): "x,y" → { mancha?, telarana?, objeto?, moscas? }. Un tipo sin grupo de objetos
// no lleva objetos ni manchas, pero sí el resto de su estado.
function capasDeDesorden(distribucion, espacioId, tipo, limpieza) {
  const porCasilla = new Map();
  const poner = (c, capa, clave) => {
    const k = claveCasilla(c.x, c.y);
    porCasilla.set(k, { ...porCasilla.get(k), [capa]: clave });
  };
  const grupo = GRUPO_DE_TIPO[tipo];
  if (grupo) {
    for (const o of objetosDelSuelo(distribucion, espacioId, limpieza)) poner(o, 'objeto', `objeto:${grupo}:${o.variante}`);
    let suciedad = 0; // las de suciedad alternan grande y pequeña empezando por la grande; las de agua van primero
    manchasDelSuelo(distribucion, espacioId, limpieza).forEach((c, i) => {
      const agua = TIPOS_CON_AGUA.includes(tipo) && i < MANCHAS_DE_AGUA;
      poner(c, 'mancha', agua ? 'mancha:agua' : `mancha:suciedad-${suciedad++ % 2 === 0 ? 'grande' : 'pequena'}`);
    });
  }
  if (TIPOS_CON_MOSCAS.includes(tipo)) for (const c of moscasDelSuelo(distribucion, espacioId, limpieza)) poner(c, 'moscas', 'moscas');
  if (limpieza === 'desastre') for (const e of esquinasDelEspacio(distribucion, espacioId)) poner(e, 'telarana', `telarana:${e.lado}`);
  return porCasilla;
}

// FR-5 de la 008 y FR-6 de la 010: el arte de cada casilla del mapa. `null` para el vacío; si no, un objeto con las capas de ORDEN_DE_CAPAS
// (clave de textura o `null`). `limpiezas`: Map de id de espacio → estado de limpieza; los espacios que no están, como el pasillo, son limpios.
// Pura y determinista: depende solo del estado (tipos de espacio), de la distribución y de `limpiezas`; no mira la fecha.
export function arteDelMapa(estado, distribucion, limpiezas = new Map()) {
  const espacios = new Map(espaciosActivos(estado).map((e) => [e.id, e]));
  const desorden = new Map();
  for (const [id, limpieza] of limpiezas) {
    const espacio = espacios.get(id);
    if (!espacio || limpieza === 'limpio') continue;
    for (const [k, capas] of capasDeDesorden(distribucion, id, espacio.tipo, limpieza)) desorden.set(k, capas);
  }
  const { tiles, espacioEn } = distribucion;
  const vacias = { mancha: null, sobre: null, telarana: null, objeto: null, moscas: null };
  return tiles.map((fila, y) => [...fila].map((ch, x) => {
    if (ch === ' ') return null;
    if (ch === '#') return { base: `pared:${vistaDePared(tiles, x, y)}`, mueble: null, ...vacias };
    const clave = espacioEn[y][x];
    const tipo = clave?.startsWith('pasillo:') ? 'pasillo' : espacios.get(clave)?.tipo;
    const variante = varianteDeMueble(tiles, x, y);
    const mueble = `mueble:${ch}:${variante}`;
    const sobre = `sobre:${ch}:${variante}:${limpiezas.get(clave) ?? 'limpio'}`;
    return {
      base: SUELOS[tipo] ? `suelo:${tipo}` : null,
      mueble: TEXTURAS[mueble] ? mueble : null,
      ...vacias,
      ...desorden.get(claveCasilla(x, y)),
      sobre: TEXTURAS[mueble] && SUCIEDAD[sobre] ? sobre : null,
    };
  }));
}

// FR-7 de la 010: ¿cambió el estado de algún espacio? Un espacio que falta en uno de los dos mapas cuenta como limpio.
export function estadosCambiaron(antes, despues) {
  for (const id of new Set([...antes.keys(), ...despues.keys()])) {
    if ((antes.get(id) ?? 'limpio') !== (despues.get(id) ?? 'limpio')) return true;
  }
  return false;
}
```
- [ ] Run: `cd poc && node --test test/casillas-estados.test.js test/casillas.test.js test/contrato-arte.test.js test/arte.test.js`. Expect: PASS (las 14 pruebas de `casillas-estados.test.js`, que incluye la exhaustiva de los 7.560 mapas, y las existentes).
- [ ] Commit: `feat(poc): compose the cleanliness states into the art of each cell` (cuerpo: `Plan section: Phase 3: Arte de cada casilla con estados` y `Feature: 010-estados-de-limpieza`)

---

## Phase 4: Hogares de prueba de estados

**Implements:** FR-9 | **Satisfies:** AC-9.1, AC-9.2, AC-9.3
**Files:** `poc/test/hogares-de-prueba.js`, `poc/test/hogares-de-estados.test.js`
**Interfaces:** Consumes: `crearHogarInicial`, `agregarEspacio`, `renombrarMiembro`, `espaciosActivos`, `esPropietario` de `src/hogar.js`; `agregarActividad` y `limpiezaDeEspacio` de `src/actividades.js`; `sumarDias` de `src/fechas.js`; `ctxDePrueba` (ya en `hogares-de-prueba.js`). Produces: `hogarDePruebaDeEstados(limpieza, hoy, ctx = ctxDePrueba())` → estado `version: 7` con sala, comedor, cocina, baño común, lavandería, mascota, dormitorio, oficina y dos baños internos; con `limpieza` `'desordenado'` o `'desastre'`, una actividad puntual por espacio atrasada 1 o 3 días respecto de `hoy` (`'AAAA-MM-DD'`), a cargo del propietario; con `'limpio'`, ninguna.

Un solo hogar no puede mostrar los tres estados de un mismo tipo a la vez, porque el catálogo limita los espacios por tipo (por ejemplo, una sola sala): hay un hogar por estado y se cambia de uno a otro cargándolos.

- [ ] Escribir las pruebas:
```js
// test/hogares-de-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS } from '../src/catalogo.js';
import { espaciosActivos, esPropietario, actividadesPendientes } from '../src/hogar.js';
import { limpiezaDeEspacio } from '../src/actividades.js';
import { crearAlmacen, CLAVE_DATOS } from '../src/almacen.js';
import { almacenEnMemoria } from './ayuda.js';
import { hogarDePruebaDeEstados } from './hogares-de-prueba.js';

const HOY = '2026-10-10';
const ESTADOS = ['limpio', 'desordenado', 'desastre'];

test('AC-9.1: los tres hogares de estados son documentos válidos de la versión 7 y se abren sin aviso', () => {
  for (const limpieza of ESTADOS) {
    const e = hogarDePruebaDeEstados(limpieza, HOY);
    assert.equal(e.version, 7);
    const r = crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(e) })).cargar(() => '2026-10-10T09:00:00.000Z');
    assert.equal(r.error, null, limpieza);
    assert.deepEqual(r.estado, e);
  }
});

test('AC-9.2: cada hogar tiene al menos un espacio de cada uno de los ocho tipos', () => {
  for (const limpieza of ESTADOS) {
    const tipos = new Set(espaciosActivos(hogarDePruebaDeEstados(limpieza, HOY)).map((s) => s.tipo));
    assert.deepEqual([...tipos].sort(), [...TIPOS].sort(), limpieza);
  }
});

test('AC-9.3: todos los espacios quedan en el estado pedido, y el hogar limpio no tiene actividades', () => {
  for (const limpieza of ESTADOS) {
    const e = hogarDePruebaDeEstados(limpieza, HOY);
    for (const espacio of espaciosActivos(e)) assert.equal(limpiezaDeEspacio(e, espacio.id, HOY), limpieza, `${limpieza} ${espacio.tipo}`);
    assert.equal(actividadesPendientes(e).length, limpieza === 'limpio' ? 0 : espaciosActivos(e).length);
  }
});

test('FR-9: las actividades son del propietario, las ids son predecibles y el hogar no usa crypto.randomUUID', () => {
  const e = hogarDePruebaDeEstados('desastre', HOY);
  const propietario = e.miembros.find((m) => esPropietario(e, m));
  for (const a of actividadesPendientes(e)) assert.equal(a.miembroId, propietario.id);
  assert.deepEqual(hogarDePruebaDeEstados('desastre', HOY), e); // mismo ctx de prueba, mismo documento
});
```
- [ ] Run: `cd poc && node --test test/hogares-de-estados.test.js`. Expect: FAIL (`SyntaxError`: `hogarDePruebaDeEstados` no se exporta de `hogares-de-prueba.js`).
- [ ] Implementar: en `test/hogares-de-prueba.js`, cambiar las importaciones y añadir al final:
```js
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { crearHogarInicial, agregarHabitante, agregarEspacio, renombrarMiembro, esPropietario, espaciosActivos } from '../src/hogar.js';
import { agregarActividad } from '../src/actividades.js';
import { sumarDias } from '../src/fechas.js';
```
(sustituyen a las dos primeras importaciones del archivo) y, al final del archivo:
```js

// Días de atraso que dejan a un espacio en cada estado de limpieza (umbrales de 1 y 3 días de la 003).
const ATRASO = { desordenado: 1, desastre: 3 };

// FR-9 de la 010: un hogar con un espacio de cada uno de los ocho tipos y dos baños internos. Con `limpieza` 'desordenado' o 'desastre', cada
// espacio tiene una actividad puntual a cargo del propietario atrasada 1 o 3 días respecto de `hoy` ('AAAA-MM-DD'); con 'limpio', ninguna.
export function hogarDePruebaDeEstados(limpieza, hoy, ctx = ctxDePrueba()) {
  let estado = crearHogarInicial(ctx);
  const propietario = estado.miembros.find((m) => esPropietario(estado, m));
  estado = exigir(renombrarMiembro(estado, propietario.id, 'Protagonista', ctx));
  for (const tipo of ['comedor', 'lavanderia', 'mascota', 'oficina', 'bano', 'bano']) estado = agregarEspacio(estado, tipo, ctx);
  if (!(limpieza in ATRASO)) return estado;
  for (const espacio of espaciosActivos(estado)) {
    estado = exigir(agregarActividad(estado, {
      nombre: 'Limpiar', icono: 'limpiar', tipo: 'puntual', miembroId: propietario.id, espacioId: espacio.id, vence: sumarDias(hoy, -ATRASO[limpieza]),
    }, ctx));
  }
  return estado;
}
```
- [ ] Run: `cd poc && node --test test/hogares-de-estados.test.js test/hogares-de-prueba.test.js test/contrato-estados.test.js`. Expect: PASS (4 pruebas nuevas, las 5 de `hogares-de-prueba.test.js` y las 4 del contrato, que ya encuentran todo lo que piden).
- [ ] Run: `cd poc && npm test`. Expect: 430 pruebas (391 + 39), 0 fallos.
- [ ] Commit: `test(poc): add three test homes that show the cleanliness states` (cuerpo: `Plan section: Phase 4: Hogares de prueba de estados` y `Feature: 010-estados-de-limpieza`)

---

## Phase 5: Presentación del desorden

**Implements:** FR-6, FR-7, FR-8 | **Satisfies:** AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-8.2, AC-8.3, AC-8.4, AC-10.4, AC-10.5, AC-10.6
**Files:** `poc/src/juego.js`
**Interfaces:** Consumes: `arteDelMapa(estado, distribucion, limpiezas)`, `ORDEN_DE_CAPAS`, `estadosCambiaron` de `src/arte/casillas.js`; `SUCIEDAD` de `src/arte/suciedad.js`; `limpiezaDeEspacio` (ya importada). Produces: el mundo compuesto con el desorden dentro del mismo `RenderTexture`, recompuesto solo si cambió algún estado o la distribución; la hoja `arte` repartida en una cuadrícula de 64 columnas con los cuadros nuevos.

La presentación solo aplica las reglas de las Fases 1 a 3. Phaser no se prueba de forma automática (reglas del proyecto), así que esta fase se verifica con `node --check`, la suite completa y la Fase 6.

> **Complexity note** (sin fallo de gate): la hoja `arte` pasa de 162 a 237 cuadros (3.792 px de ancho en una sola fila, cerca de los 4.096 px que son el límite seguro en móviles); se reparte en una cuadrícula de 64 columnas × 4 filas (1.024 × 64 px). La Fase 6 mide el tiempo de preparación (AC-10.6).

- [ ] Importaciones: en el bloque de `./aspecto.js`, quitar `objetosDelSuelo`, y sustituir las importaciones de arte:
```js
import { INSIGNIAS, casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';
```
```js
import { TEXTURAS, arteDelMapa, ORDEN_DE_CAPAS, estadosCambiaron } from './arte/casillas.js';
import { SUCIEDAD } from './arte/suciedad.js';
```
  (la segunda sustituye a `import { TEXTURAS, arteDelMapa } from './arte/casillas.js';`; la de `./arte/suciedad.js` va justo debajo).
- [ ] Constantes: en el comentario de profundidades, cambiar `// Profundidades: mundo 0, objetos del suelo 1, etiquetas de espacio 5, personaje 10, nombre del personaje 20.` por `// Profundidades: mundo 0 (con el desorden de los espacios dentro), etiquetas de espacio 5, personaje 10, nombre del personaje 20.` Sustituir:
```js
// Actividades (FR-5 y FR-6 de la 003), arte de marcador: iconos como emoji del sistema y objetos como cuadrados de colores.
```
  por `// Actividades (FR-5 y FR-6 de la 003), arte de marcador: iconos como emoji del sistema (feature 011).` y borrar la línea `const COLOR_OBJETO = [0xc0392b, 0x2980b9, 0xf1c40f, 0x8e44ad, 0x16a085, 0xd35400];`.
- [ ] Función nueva: justo antes de `// FR-1 y AC-9.5 de la 008, FR-6 y AC-9.5 de la 009: todos los dibujos...` (encima de `prepararArte`), añadir:
```js
// Estado de limpieza de cada espacio activo (FR-8 de la 010): lo que el mundo necesita para dibujar el desorden. Se deriva de (estado, hoy) y no se guarda.
const limpiezasDelHogar = () => new Map(espaciosActivos(estado).map((e) => [e.id, limpiezaDeEspacio(estado, e.id, hoy)]));
```
- [ ] `prepararArte`: sustituir la función completa por:
```js
// FR-1 y AC-9.5 de la 008, FR-6 y AC-9.5 de la 009, FR-8 y AC-10.6 de la 010: todos los dibujos (mundo, personajes y desorden) se pintan una
// sola vez en una hoja de texturas repartida en una cuadrícula de 64 columnas, con un cuadro con nombre por clave, para no pasar de 4.096 px
// por lado. Devuelve el tiempo que tardó, en milisegundos, para el indicador de depuración.
const COLUMNAS_DE_LA_HOJA = 64;
function prepararArte(escena) {
  const t0 = performance.now();
  const dibujos = { ...TEXTURAS, ...SUCIEDAD, ...CUADROS_DE_PERSONAJES };
  const claves = Object.keys(dibujos);
  const columnas = Math.min(COLUMNAS_DE_LA_HOJA, claves.length);
  const hoja = escena.textures.createCanvas('arte', TAM * columnas, TAM * Math.ceil(claves.length / columnas));
  const contexto = hoja.getContext();
  claves.forEach((clave, i) => {
    const x0 = (i % columnas) * TAM;
    const y0 = Math.floor(i / columnas) * TAM;
    dibujos[clave].forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (ch === '.') return;
      contexto.fillStyle = PALETA[ch];
      contexto.fillRect(x0 + x, y0 + y, 1, 1);
    }));
    hoja.add(clave, 0, x0, y0, TAM, TAM);
  });
  hoja.refresh();
  return performance.now() - t0;
}
```
- [ ] `create()`: borrar la línea `this.mapa = this.add.graphics().setDepth(1); // objetos del suelo: encima del mundo y debajo de los personajes (AC-5.1)`.
- [ ] `redibujar()`: sustituir por:
```js
  redibujar() {
    this.dibujarMundo();
    this.dibujarEtiquetas();
  }
```
- [ ] `dibujarMundo()`: sustituir la función y su comentario por:
```js
  // Suelo, paredes, mobiliario y desorden de los espacios (FR-5 y FR-6 de la 008, FR-6 y FR-8 de la 010): cada casilla se compone a 1:1 en una sola
  // imagen, que se amplía con la cámara. Se recompone cuando cambia la distribución o el estado de limpieza de algún espacio; no cambia las colisiones.
  dibujarMundo() {
    const { ancho, alto } = distribucion;
    const limpiezas = limpiezasDelHogar();
    this.limpiezasDibujadas = limpiezas;
    if (this.mundo.width !== ancho * TILE || this.mundo.height !== alto * TILE) this.mundo.resize(ancho * TILE, alto * TILE);
    this.mundo.clear();
    this.mundo.beginDraw();
    arteDelMapa(estado, distribucion, limpiezas).forEach((fila, y) => fila.forEach((celda, x) => {
      if (!celda) return;
      for (const capa of ORDEN_DE_CAPAS) if (celda[capa]) this.mundo.batchDrawFrame('arte', celda[capa], x * TILE, y * TILE);
    }));
    this.mundo.endDraw();
  }
```
- [ ] `dibujarObjetosDelSuelo()`: borrar la función completa (con su comentario `// Objetos del suelo según el estado de limpieza...`).
- [ ] `refrescarActividades()`: sustituir la función y su comentario por:
```js
  // Tras un cambio de actividades o de día: el mundo solo se recompone si cambió el estado de algún espacio (FR-7 de la 010); las insignias,
  // las burbujas y la señal "!" del cartel se rehacen siempre, sin rehacer a los personajes.
  refrescarActividades() {
    if (estadosCambiaron(this.limpiezasDibujadas, limpiezasDelHogar())) this.dibujarMundo();
    this.dibujarInsignias();
    this.dibujarBurbujas();
    this.actualizarCartel();
  }
```
- [ ] Run: `cd poc && node --check src/juego.js`. Expect: sin salida.
- [ ] Comprobación estática (desechable, sin commitear). Run: `cd poc && grep -n "this\.mapa\|objetosDelSuelo\|COLOR_OBJETO\|dibujarObjetosDelSuelo" src/juego.js`. Expect: sin coincidencias.
- [ ] Run: `cd poc && npm test`. Expect: 430 pruebas, 0 fallos.
- [ ] Commit: `feat(poc): draw the cleanliness states into the world` (cuerpo: `Plan section: Phase 5: Presentación del desorden` y `Feature: 010-estados-de-limpieza`)

---

## Phase 6: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs (AC-6.3, AC-6.4, AC-7.1 a AC-7.6, AC-8.2, AC-8.4, AC-9.4, AC-10.1, AC-10.3 a AC-10.6 y la comprobación a mano del resto)

- [ ] Run: `cd poc && npm test`. Expect: 430 pruebas (391 + 39), 0 fallos (AC-10.3).
- [ ] Run: `cd poc && node --check src/juego.js`. Expect: sin salida.
- [ ] El modelo, el generador, el movimiento, la paleta, las texturas, el mobiliario y los personajes no cambiaron (FR-10, AC-10.2). Run, desde la raíz del repositorio: `git diff --stat main -- poc/src/catalogo.js poc/src/hogar.js poc/src/almacen.js poc/src/distribucion.js poc/src/posicion.js poc/src/movimiento.js poc/src/rutas.js poc/src/rutinas.js poc/src/actividades.js poc/src/intercambios.js poc/src/historial.js poc/src/arte/paleta.js poc/src/arte/texturas.js poc/src/arte/mobiliario.js poc/src/arte/personajes.js poc/src/arte/caminar.js`. Expect: sin salida.
- [ ] Servir `poc/` sin caché: `cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"`. Abrir `http://localhost:8080` en el navegador de la app.
- [ ] Cargar los hogares de prueba de estados desde la consola (AC-9.4; para otro estado, cambiar `'desastre'` por `'desordenado'` o `'limpio'`; la fecha es la de hoy en el navegador):
```js
const { hogarDePruebaDeEstados } = await import('/test/hogares-de-prueba.js');
const { fechaLocal } = await import('/src/fechas.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDePruebaDeEstados('desastre', fechaLocal(new Date()))));
localStorage.removeItem('livin:posicion:v1');
location.reload();
```
- [ ] Verificar en el navegador de escritorio, con los tres hogares de prueba (cargar uno, mirar y pasar al siguiente):
  1. **Arranque (AC-10.1, AC-10.6):** se abre sin aviso. El indicador muestra `arte N ms`, con N menor que 300; anotarlo. En la consola, `game.textures.get('arte').getSourceImage().width` y `.height` (o inspeccionar la hoja) no superan 4.096; anotarlos.
  2. **Los tres estados (AC-6.1, AC-6.3, AC-6.4):** en el hogar `limpio` todo se ve como en la 008, sin objetos; en el `desordenado`, 4 objetos del grupo de cada espacio y las piezas clave desordenadas (cama deshecha, platos en el lavadero, migas en las mesas, espuma en el lavamanos, cama de mascota revuelta, papeles en el escritorio); en el `desastre`, 12 objetos, manchas (de agua en cocina y baño), muebles sucios, telarañas en las esquinas superiores y moscas en cocina, baño y mascota. Hacer capturas de cada tipo de espacio en exploración y en el viewport de teléfono (375×812).
  3. **Reconocimiento y retoque (AC-6.3, AC-6.4):** cada espacio se reconoce sin leer la insignia y los seis objetos de cada grupo se distinguen entre sí; el desastre no tapa el nombre del espacio. Si algún dibujo no se entiende o se confunde con un mueble, retocar sus coordenadas en `src/arte/suciedad.js` y volver a pasar `node --test test/suciedad.test.js`. Anotar los retoques.
  4. **Actualización (AC-7.1, AC-7.2, AC-7.4):** con el hogar `desastre`, abrir la pestaña Actividades y marcar «Hecho» la actividad de una cocina: el mapa la muestra limpia al instante, sin objetos, manchas, telarañas ni muebles sucios, y los demás espacios no cambian. Agregar una actividad atrasada 1 día a ese espacio: pasa a desordenado; con 3 días: a desastre.
  5. **Sin redibujo inútil (AC-7.5):** con el hogar `desastre`, marcar «Hecho» una actividad de un espacio que tenga otra igual de atrasada (agregar una segunda antes) o una actividad sin espacio: el estado no cambia y `regen` no se mueve en lo que respecta al mundo (se mide en el paso 7).
  6. **Día y distribución (AC-7.3, AC-7.6):** con la app abierta y un hogar con actividades que vencen mañana, cambiar la fecha del sistema de forma simulada (en la consola, `Date` y `visibilitychange` como en la verificación de la 003) o dejar el paso para el teléfono; en edición, agregar y quitar un espacio: el mapa se redibuja con los estados vigentes.
  7. **Capas y toques (AC-8.2, AC-8.3, AC-8.4):** los personajes, los nombres, las insignias (✓ ! !!), las burbujas y el cartel quedan por encima del desorden; ningún cuadrado liso de color de la versión anterior; el paso, las colisiones y la aparición son los mismos con el espacio sucio; en edición, los toques siguen abriendo las mismas fichas.
  8. **Hogar guardado (AC-10.1, AC-10.2):** con un hogar guardado antes de esta feature, se abre sin aviso y el documento sigue en `version: 7` sin campos nuevos.
- [ ] Rendimiento con carga completa (AC-10.4, AC-10.5): armar desde la consola, como en la verificación de la 008, un hogar `version: 7` de mayor tamaño con 8 familiares, 4 mascotas, 50 actividades atrasadas 3 días o más repartidas por todos los espacios, y 200 entradas de historial. Caminar 30 segundos. En la pestaña Actividades, marcar «Hecho» una actividad atrasada de un espacio con una sola (cambia el estado): medir el tiempo de recomposición del mundo. En edición, cambiar contadores de espacios. Expect: 60 fps o más; la recomposición y `regen` por debajo de 100 ms y sin superar lo medido en la 008 (7,5 a 11,7 ms en escritorio).
- [ ] Verificación en el teléfono Android (la hace el usuario; servir en `0.0.0.0:8080` solo mientras dura la prueba, con el mismo servidor sin caché, y apagarlo después). Repetir los pasos 2, 3, 4 y 7 con los tres hogares de prueba y anotar fps, `regen` y `arte` con la carga completa. Si la recomposición no cumple los 100 ms o el desastre se ve demasiado cargado, aplicar lo previsto en la spec: pasar a una capa de suciedad aparte (ADR-010, opción B) o bajar la cantidad de manchas.
- [ ] Escribir `docs/specs/010-estados-de-limpieza/verification.md` con:
  - las pruebas automáticas y el comando;
  - el fragmento para cargar los tres hogares de prueba y qué se ve en cada uno (AC-9.4);
  - los pasos de escritorio y sus resultados;
  - el teléfono;
  - los tiempos de `arte`, de recomposición y de `regen`, y el tamaño de la hoja;
  - los retoques hechos a los dibujos;
  - los límites aceptados.
- [ ] Pedir confirmación al usuario y, si la da:
  - En `CLAUDE.md` (capa del renderizador y estado del proyecto), añadir `suciedad.js`, que `arteDelMapa` recibe los estados y la feature 010.
  - En `.claude/rules/phaser.md`, que el desorden de los espacios se compone dentro del `RenderTexture` del mundo y que solo las insignias y las burbujas siguen con marcador hasta la 011.
  - En `.claude/rules/javascript.md`, el módulo nuevo y que `casillas.js` puede importar `aspecto.js`.
  - En `.claude/rules/testing.md`, la validación del arte del desorden y los hogares de prueba de estados.
  
  No editar esos archivos sin confirmación.
- [ ] Commit: `feat: complete 010 estados de limpieza` (cuerpo: `Plan section: Phase 6: Integration Verification` y `Feature: 010-estados-de-limpieza`)

**Cobertura de FR por fase:** FR-1 → Fase 2; FR-2 → Fases 1 y 3; FR-3 → Fases 1 y 3; FR-4 → Fases 1 y 3; FR-5 → Fases 2 y 3; FR-6 → Fases 3 y 5; FR-7 → Fases 3 y 5; FR-8 → Fases 5 y 6; FR-9 → Fases 4 y 6; FR-10 → Fases 3, 4 y 6; FR-11 → Fases 2 y 6.

**Cobertura de AC por fase:**
- **Story 1:** AC-1.1 a AC-1.6 → Fase 2.
- **Story 2:** AC-2.1 a AC-2.9 → Fase 3 (casillas libres y contrato de la 003, también en la Fase 1).
- **Story 3:** AC-3.1 a AC-3.6 → Fases 1 y 3.
- **Story 4:** AC-4.1 a AC-4.7 → Fases 1 y 3.
- **Story 5:** AC-5.1, AC-5.2, AC-5.5 y AC-5.6 → Fase 2; AC-5.3 y AC-5.4 → Fase 3.
- **Story 6:** AC-6.1 y AC-6.2 → Fase 3; AC-6.3 y AC-6.4 → Fase 6.
- **Story 7:** AC-7.5 → Fase 3 (regla pura) y Fase 6; AC-7.1 a AC-7.4 y AC-7.6 → Fases 5 y 6.
- **Story 8:** AC-8.1 y AC-8.3 → Fase 3; AC-8.5 → Fase 1; AC-8.2 y AC-8.4 → Fases 5 y 6.
- **Story 9:** AC-9.1 a AC-9.3 → Fase 4; AC-9.4 → Fase 6.
- **Story 10:** AC-10.1 y AC-10.2 → Fase 6 (y las suites existentes); AC-10.3 → Fases 3 a 6; AC-10.4 y AC-10.5 → Fases 5 y 6; AC-10.6 → Fases 5 y 6.

---

## Quickstart Validation

```bash
cd poc
npm test                      # 430 pruebas, 0 fallos
node --check src/juego.js     # sintaxis de la escena
python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"   # http://localhost:8080
```

En la app:
1. Cargar el hogar de prueba `desastre` con el fragmento de la Fase 6.
2. Comprobar en la cocina: ollas, platos, plátano, manzana mordida, envoltura y caja de pizza en el piso, manchas de suciedad y de agua, grasa en la cocina, espuma en el lavadero, telarañas en las esquinas y moscas.
3. Comprobar el dormitorio (ropa y cama deshecha), la sala y el comedor (mesas manchadas), la lavandería, el baño (charcos, inodoro sucio, moho), el espacio de mascota y la oficina.
4. Cargar el hogar `desordenado` y ver 4 objetos y las piezas desordenadas; cargar el `limpio` y ver el mundo de la 008.
5. En el hogar `desastre`, marcar «Hecho» la actividad de la cocina y ver que queda limpia al instante.

---

## Validación previa

Los bloques de código de las Fases 0 a 4 (módulos y pruebas) y los cambios de la Fase 5 se ejecutaron en memoria, sin escribir archivos del repositorio, extrayéndolos de este mismo plan y cargándolos con un gancho de módulos sobre el código real:
- **Pruebas:** 39 nuevas, todas pasan; junto con las 391 existentes, **430 pasan, 0 fallan** (la exhaustiva de los 7.560 mapas con estados tarda unos 3 s; toda la suite, unos 6 s).
- **Corrección hecha por la validación:** la prueba de `hogares-de-estados.test.js` importaba `actividadesPendientes` de `actividades.js`, pero está en `hogar.js`.
- **Costo de `arteDelMapa`** en el hogar más grande permitido (21 espacios, mapa de 33×40): 0,49 ms por llamada con todos los espacios en desastre y 0,14 ms con todo limpio, en Node (la elección del arte; el dibujo en la textura se mide en la Fase 6).
- **`src/juego.js`:** todas las anclas de la Fase 5 existen y, aplicadas a una copia en memoria, `node --check` no da errores y no quedan referencias a `this.mapa`, `objetosDelSuelo`, `COLOR_OBJETO` ni `dibujarObjetosDelSuelo`.
- **La hoja de dibujos** queda con 162 + 75 = 237 cuadros (los 75 nuevos: 42 objetos, 3 manchas, 2 telarañas, 1 de moscas y 27 sobreposiciones), 1.024 × 64 px en cuadrícula de 64 columnas.
- **No validado en el motor:** los dibujos se vieron solo en los bocetos del brainstorm; su aspecto final, la nitidez, los cuadros por segundo y los tiempos de dibujo se verifican en la Fase 6.
