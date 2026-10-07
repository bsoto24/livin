# Implementation Plan: Rutinas

**Spec:** docs/specs/004-rutinas/spec.md (v1.0.0)
**Decisions:** docs/adr/004-modelo-rutinas-formato-v4.md, docs/adr/004-movimiento-hacia-objetivo-reloj.md
**Data model:** docs/specs/004-rutinas/data-model.md
**Created:** 2026-10-07

## Global Constraints

- Rutina solo para **familiares** (personas activas que no son el personaje del propietario). Dos horarios: `laborables` ("Lun–Vie", lunes a viernes) y `finde` ("Sáb–Dom", sábado y domingo), según el día de la semana de la fecha local.
- Bloque: `inicio` de 0 a 1410 y `fin` de 30 a 1440, enteros múltiplos de 30 (minutos desde las 00:00), `fin > inicio` (no cruza la medianoche); lugar = un espacio activo (nunca un pasillo) o "Fuera de casa" (`espacioId: null`). Sin superposición dentro del mismo familiar y horario; pueden tocarse. Hasta 8 bloques activos por familiar y horario. El horario y el familiar de un bloque no cambian al editarlo.
- **Bloque vigente** = el del horario de hoy con `inicio ≤ minuto < fin`. Objetivo del familiar: el espacio del bloque vigente, `fuera` o `libre`. Nada de esto se guarda; `ahora = { fecha, minuto }` lo inyecta la presentación.
- Movimiento (ADR-004): ruta más corta sobre las casillas transitables (búsqueda en anchura, orden fijo arriba, abajo, izquierda, derecha). En ruta, un familiar puede pisar la casilla de otro habitante, pero espera al jugador. Quien pasea no entra en la casilla de quien va en ruta. Al cambiar el objetivo, cancela la pausa o el tramo y termina el paso empezado. Tiempo de llegada ≤ (casillas de la ruta desde la casilla que ocupa o a la que se dirige + 1) × 500 ms, si el jugador no le cierra el paso.
- *Ruling:* un familiar que **espera** a que se libere su espacio lleno (fase `planifica` con pausa) **no bloquea a quien pasea**. Si bloqueara, en un baño interno lleno, cuya única puerta es una casilla, el que espera taparía la salida del que debe irse y nadie se movería. Las invariantes de no superposición valen entre quienes pasean (fase `pasea`) y el jugador; quien está en ruta o planificando solo debe evitar las casillas del jugador. Coste si es incorrecto: cambiar `bloquea` en `avanzarHabitantes` y una prueba.
- Entrada: casilla transitable de la pared inferior de la sala, en la columna de la aparición; pertenece a la sala; el resto de la distribución no cambia. Ni objetos del suelo ni burbujas sobre ella. El jugador puede pisarla, pero no salir.
- Cartel: "n fuera" (más " !" si algún familiar fuera tiene actividades por hacer sin espacio), oculto con n = 0. *Ruling:* se dibuja alineado a la derecha contra el borde izquierdo de la entrada, sobre la pared (no tapa la entrada), y responde al toque en toda su área dibujada (lección de la 003). Toque en edición: personaje del propietario, habitante, cartel, burbuja, espacio.
- *Ruling:* en modo edición el `ahora` de las rutinas queda congelado (AC-6.5): el cartel y la hora de vuelta se calculan con el minuto en que se entró a editar.
- Documento `version: 4` en la misma clave `livin:datos:v1`; las versiones 1, 2 y 3 se migran al cargar y se guardan como v4 en el siguiente guardado. Solo se validan los bloques no eliminados. Bajas lógicas en cascada en la misma operación que elimina el espacio o el familiar (incluida la excepción del baño interno).
- 60 cuadros por segundo con 8 familiares en ruta, 4 mascotas y 50 actividades en el dispositivo de referencia; menos de 100 ms al tocar "Listo". Textos del usuario siempre como texto. Ningún dato sale del dispositivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs; arte de marcador original.
- Modelo, fechas, rutinas, rutas, movimiento y aspecto no importan Phaser ni el DOM.

**Pre-implementation gates:**
- *Simplicity:* siguen siendo 3 componentes. Dominio (`catalogo.js`, `hogar.js`, `almacen.js`, `actividades.js` y el nuevo `rutinas.js`), lógica pura de mapa, tiempo y movimiento (`distribucion.js`, `posicion.js`, `etiquetas.js`, `fechas.js`, `aspecto.js`, `movimiento.js` y el nuevo `rutas.js`) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* un único modelo canónico de bloque (objetos planos del estado guardado). Objetivos, rutas y fases son datos de sesión en los mismos objetos `movil` de la 002; no hay clases ni vistas. ✓
- *Integration-First:* los contratos (exportaciones, constantes, forma de `entrada` y del móvil) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que el propietario defina la rutina de cada familiar (dos horarios de hasta 8 bloques) y que, en exploración, cada familiar vaya caminando a su espacio, salga por la entrada cuando está fuera y vuelva al terminar, con un cartel que dice quién está fuera. Que las bajas de espacios y familiares arrastren sus bloques y que los hogares de las features 001 a 003 se abran sin pérdida. Todo cubierto por 201 pruebas automáticas (150 existentes + 51 nuevas).

Archivos (bajo `poc/`):
- **Lógica:** `src/catalogo.js`, `src/fechas.js`, `src/distribucion.js` (entrada), `src/aspecto.js`, `src/hogar.js` (bloques y cascada), `src/almacen.js` (v4), `src/rutinas.js` (nuevo: operaciones, hora y lugar), `src/rutas.js` (nuevo: rutas), `src/movimiento.js` (objetivos y fases).
- **Presentación:** `src/juego.js`, `index.html`.
- **Pruebas en `test/`:** `contrato-rutinas.test.js`, `rutinas.test.js` y `rutinas-lugar.test.js` (nuevos), `rutas.test.js` (nuevo), y cambios en `fechas.test.js`, `distribucion.test.js`, `aspecto.test.js`, `almacen.test.js`, `habitantes.test.js` y `movimiento.test.js`.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1 (constantes), FR-2/FR-3 (contrato de hora, objetivos y movimiento), FR-10 (migración), FR-12 (forma de la entrada) | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/contrato-rutinas.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de nombres exportados por `src/catalogo.js` (`DIAS_RUTINA`, `PASO_RUTINA = 30`, `LIMITE_BLOQUES = 8`), `src/fechas.js` (`diaDeSemana`, `minutoLocal`, `ahoraLocal`), `src/rutinas.js` (operaciones, hora y lugar, `MINUTOS_DIA = 1440`, `MENSAJES_BLOQUE`), `src/hogar.js` (`bloquesActivos`, `bloquesDeEspacios`, `bloquesDeMiembro`; hogar inicial `version: 4` con `bloques: []`), `src/almacen.js` (`migrarAV4`), `src/rutas.js` (`rutaMasCorta`, `casillasDe`), `src/movimiento.js` (`fijarObjetivos`, `mismoObjetivo`, `ESPERA_MS = 1000`; móvil con `objetivo`, `fase` y `ruta`) y `generarDistribucion(...).entrada = { x, y }`.

Fija la forma pública de lo nuevo antes de implementarlo. La prueba de contrato queda en rojo (`ERR_MODULE_NOT_FOUND`) hasta el final de la Fase 6; las Fases 1 a 5 se verifican con sus propios archivos de prueba.

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato-rutinas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as fechas from '../src/fechas.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as rutinas from '../src/rutinas.js';
import * as rutas from '../src/rutas.js';
import * as movimiento from '../src/movimiento.js';
import { generarDistribucion } from '../src/distribucion.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo de rutinas: horarios, paso y límite', () => {
  assert.deepEqual(catalogo.DIAS_RUTINA, { laborables: 'Lun–Vie', finde: 'Sáb–Dom' });
  assert.deepEqual([catalogo.PASO_RUTINA, catalogo.LIMITE_BLOQUES], [30, 8]);
});

test('contrato de fechas y rutinas: funciones, minutos del día y mensajes', () => {
  for (const f of ['diaDeSemana', 'minutoLocal', 'ahoraLocal']) assert.equal(typeof fechas[f], 'function', f);
  for (const f of ['esFamiliar', 'buscarBloque', 'bloquesDe', 'contarBloques', 'puedeAgregarBloque', 'agregarBloque', 'editarBloque',
    'eliminarBloque', 'textoHora', 'textoBloque', 'textoBajas', 'horarioDelDia', 'bloqueVigente', 'objetivoDe', 'objetivosDeFamiliares',
    'finDeSalida', 'textoVuelta']) {
    assert.equal(typeof rutinas[f], 'function', f);
  }
  assert.equal(rutinas.MINUTOS_DIA, 1440);
  for (const clave of ['familiar', 'dias', 'limite', 'hora', 'fin', 'lugar', 'superpuesto', 'no-encontrado']) {
    assert.equal(typeof rutinas.MENSAJES_BLOQUE[clave], 'string', clave);
  }
});

test('contrato del modelo y del almacén: consultas de bloques, hogar inicial v4 y migración', () => {
  for (const f of ['bloquesActivos', 'bloquesDeEspacios', 'bloquesDeMiembro']) assert.equal(typeof hogar[f], 'function', f);
  assert.equal(typeof almacen.migrarAV4, 'function');
  const e = hogar.crearHogarInicial(crearCtx());
  assert.deepEqual([e.version, e.bloques], [4, []]);
});

test('contrato de rutas, movimiento y entrada: funciones, fases y constantes del ADR', () => {
  for (const f of ['rutaMasCorta', 'casillasDe']) assert.equal(typeof rutas[f], 'function', f);
  for (const f of ['fijarObjetivos', 'mismoObjetivo', 'colocarHabitantes', 'avanzarHabitantes']) assert.equal(typeof movimiento[f], 'function', f);
  assert.equal(movimiento.ESPERA_MS, 1000);
  const d = generarDistribucion(hogar.crearHogarInicial(crearCtx()));
  assert.deepEqual(Object.keys(d.entrada).sort(), ['x', 'y']);
  const [h] = movimiento.colocarHabitantes(['h-1'], d, { ...d.aparicion, desde: null }, () => 0);
  assert.deepEqual([h.objetivo, h.fase, h.ruta], [{ tipo: 'libre' }, 'pasea', []]);
});
```
- [ ] Run: `cd poc && node --test test/contrato-rutinas.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` de `src/rutinas.js`)
- [ ] Commit: `test(poc): add contract tests for routines` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 004-rutinas`)

---

## Phase 1: Catálogo de rutinas y hora local

**Implements:** FR-1 (constantes), FR-2 (día de la semana y minuto local) | **Satisfies:** AC-7.3 (días), AC-7.5
**Files:** `poc/src/catalogo.js`, `poc/src/fechas.js`, `poc/test/fechas.test.js`
**Interfaces:** Consumes: `numeroDeDia`, `fechaLocal` (feature 003). Produces: `DIAS_RUTINA`, `PASO_RUTINA`, `LIMITE_BLOQUES` (`catalogo.js`); `diaDeSemana(texto) → 1..7` (1 lunes, 7 domingo), `minutoLocal(instante) → 0..1439`, `ahoraLocal(instante) → { fecha, minuto }` (`fechas.js`).

- [ ] En `test/fechas.test.js`, reemplazar la línea `import { numeroDeDia, esFechaValida, sumarDias, diasEntre, fechaLocal } from '../src/fechas.js';` por:
```js
import { numeroDeDia, esFechaValida, sumarDias, diasEntre, fechaLocal, diaDeSemana, minutoLocal, ahoraLocal } from '../src/fechas.js';
```
- [ ] Agregar al final de `test/fechas.test.js`:
```js

test('AC-7.3, FR-2 (004): diaDeSemana va de 1 (lunes) a 7 (domingo), también entre meses, años y antes de 1970', () => {
  assert.deepEqual(
    ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12'].map(diaDeSemana),
    [1, 2, 3, 4, 5, 6, 7, 1],
  );
  assert.deepEqual(['1970-01-01', '1969-12-31', '2024-02-29', '2026-01-01', '2025-12-31'].map(diaDeSemana), [4, 3, 4, 4, 3]);
  let dia = '2024-01-01'; // lunes
  for (let i = 0; i < 400; i++) {
    assert.equal(diaDeSemana(dia), (i % 7) + 1, dia);
    dia = sumarDias(dia, 1);
  }
});

test('AC-7.5, FR-2 (004): el minuto local no depende de los segundos y ahoraLocal da la fecha y el minuto', () => {
  assert.equal(minutoLocal(new Date(2026, 9, 9, 0, 0, 0)), 0);
  assert.equal(minutoLocal(new Date(2026, 9, 9, 9, 30, 0)), 570);
  assert.equal(minutoLocal(new Date(2026, 9, 9, 23, 59, 0)), 1439);
  assert.equal(minutoLocal(new Date(2026, 9, 9, 23, 59, 59)), 1439);
  assert.deepEqual(ahoraLocal(new Date(2026, 9, 9, 18, 0, 30)), { fecha: '2026-10-09', minuto: 1080 });
});
```
- [ ] Run: `cd poc && node --test test/fechas.test.js` — expect: FAIL (`SyntaxError`: `../src/fechas.js` no exporta `ahoraLocal`)
- [ ] Agregar al final de `src/catalogo.js`:
```js

// Rutinas (feature 004): horarios, paso y límite. Las claves se guardan; las etiquetas se muestran.
export const DIAS_RUTINA = { laborables: 'Lun–Vie', finde: 'Sáb–Dom' };
export const PASO_RUTINA = 30; // minutos
export const LIMITE_BLOQUES = 8; // por familiar y por horario
```
- [ ] Agregar al final de `src/fechas.js`:
```js

// Día de la semana de una fecha válida, de 1 (lunes) a 7 (domingo). El día 0 (1970-01-01) fue jueves (FR-2 de la 004).
export const diaDeSemana = (texto) => ((((numeroDeDia(texto) + 3) % 7) + 7) % 7) + 1;

// Minuto local del día de un instante, de 0 a 1439: la rutina se mide en minutos, sin segundos (AC-7.5 de la 004).
export const minutoLocal = (instante) => instante.getHours() * 60 + instante.getMinutes();

// Fecha y minuto locales de un instante: el `ahora` que la presentación inyecta en las rutinas (ADR-004 de movimiento).
export const ahoraLocal = (instante) => ({ fecha: fechaLocal(instante), minuto: minutoLocal(instante) });
```
- [ ] Run: `cd poc && node --test test/fechas.test.js` — expect: PASS (`# pass 7`, `# fail 0`)
- [ ] Commit: `feat(poc): add routine catalog and local weekday and minute` (cuerpo: `Plan section: Phase 1: Catálogo de rutinas y hora local` y `Feature: 004-rutinas`)

---

## Phase 2: La entrada del hogar

**Implements:** FR-12, NFR Reliability (verificación exhaustiva) | **Satisfies:** AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6, AC-9.7
**Files:** `poc/src/distribucion.js`, `poc/src/aspecto.js`, `poc/test/distribucion.test.js`, `poc/test/aspecto.test.js`
**Interfaces:** Consumes: `generarDistribucion`, `esTransitable`, `paso`, `casillasLibres` (features 001 a 003). Produces: `generarDistribucion(estado).entrada = { x, y }` (casilla transitable de la pared inferior de la sala, en la columna de `aparicion`); `casillasLibres` ya no devuelve la entrada.

La entrada se abre después de estampar la columna central. Como la pared inferior de la sala pertenece a la sala (`espacioEn`), la entrada también. La posición guardada del personaje sigue siendo válida (AC-9.7): ninguna otra casilla cambia.

- [ ] En `test/distribucion.test.js`, reemplazar las tres primeras líneas `import` de módulos del proyecto (las de `../src/hogar.js`, `../src/distribucion.js` y `./ayuda.js`) por:
```js
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo, espaciosActivos, banoDe, banoComun, cuartosEnOrden } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { paso } from '../src/posicion.js';
import { crearCtx } from './ayuda.js';
```
- [ ] En `verificarMapa`, insertar justo antes de `assert.deepEqual(generarDistribucion(estado), d, 'no determinista');`:
```js
  // Entrada (AC-9.1, AC-9.2 de la 004): casilla transitable de la pared inferior de la sala, bajo la aparición, alcanzable y que no
  // lleva a ninguna parte. Como el mapa es conexo, desde ella se llega a cada espacio.
  const salaId = espaciosDeTipo(estado, 'sala')[0].id;
  const sala = d.rects[salaId];
  assert.deepEqual(d.entrada, { x: d.aparicion.x, y: sala.y + sala.h - 1 });
  assert.equal(d.espacioEn[d.entrada.y][d.entrada.x], salaId);
  assert.ok(visto.has(`${d.entrada.x},${d.entrada.y}`), 'entrada inalcanzable');
  for (let x = sala.x; x < sala.x + sala.w; x++) {
    assert.equal(esTransitable(d, x, d.entrada.y), x === d.entrada.x, `pared inferior de la sala en x=${x}`);
  }
  assert.equal(esTransitable(d, d.entrada.x, d.entrada.y + 1), false, 'la entrada lleva fuera del hogar');
```
- [ ] Agregar al final de `test/distribucion.test.js`:
```js

function hogarMasGrande() {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  return agregar(e, ctx, ...Array(6).fill('bano'));
}

test('AC-9.1, AC-9.3: la entrada es la única diferencia con el mapa de las features anteriores', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  assert.deepEqual(d.entrada, { x: 13, y: 10 });
  assert.deepEqual(d.tiles, [
    '###########################',
    '#KLR...##........##.....nB#',
    '#..........SSSS..##......B#',
    '#......##.................#',
    '#......##...TT...##.......#',
    '#########....*...##.......#',
    '#########........##########',
    '#WwU...##........#         ',
    '#................#         ',
    '#......##........#         ',
    '#############.####         ',
  ]);
  const grande = generarDistribucion(hogarMasGrande());
  assert.deepEqual([grande.entrada, grande.ancho, grande.alto], [{ x: 16, y: 11 }, 33, 40]);
  assert.equal(grande.tiles[11], '#########.######.#####.##....####');
  assert.equal(grande.tiles[12], '#########.#          #.##.......#');
});

test('AC-9.5, FR-12: el jugador puede pisar la entrada pero no salir por ella', () => {
  for (const estado of [crearHogarInicial(crearCtx()), hogarMasGrande()]) {
    const d = generarDistribucion(estado);
    const r = paso(d, { x: d.entrada.x, y: d.entrada.y - 1 }, 'abajo');
    assert.deepEqual([r.x, r.y, r.movio], [d.entrada.x, d.entrada.y, true]);
    assert.deepEqual(paso(d, d.entrada, 'abajo'), { x: d.entrada.x, y: d.entrada.y, direccion: 'abajo', movio: false });
    for (const lado of ['izquierda', 'derecha']) assert.equal(paso(d, d.entrada, lado).movio, false);
  }
});
```
- [ ] Agregar al final de `test/aspecto.test.js`:
```js

test('AC-9.6: ni los objetos del suelo ni las burbujas se ponen en la entrada', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  const enEntrada = (c) => c.x === d.entrada.x && c.y === d.entrada.y;
  assert.equal(d.espacioEn[d.entrada.y][d.entrada.x], espaciosDeTipo(e, 'sala')[0].id);
  for (const espacio of espaciosActivos(e)) {
    assert.ok(!casillasLibres(d, espacio.id).some(enEntrada), espacio.tipo);
    assert.ok(!enEntrada(casillaDeBurbuja(d, espacio.id)), espacio.tipo);
    for (const limpieza of ['desordenado', 'desastre']) assert.ok(!objetosDelSuelo(d, espacio.id, limpieza).some(enEntrada), espacio.tipo);
  }
});
```
- [ ] Run: `cd poc && node --test test/distribucion.test.js test/aspecto.test.js` — expect: FAIL (`TypeError` al leer `x` de `d.entrada`, que no existe)
- [ ] En `src/distribucion.js`, reemplazar las dos líneas que calculan `filaAparicion` y `aparicion` por:
```js
  const filaAparicion = filasCentro.findIndex((f) => f.includes('*'));
  const aparicion = { x: xCentro + filasCentro[filaAparicion].indexOf('*'), y: filaAparicion };
  // Entrada del hogar (FR-12 de la 004): la casilla de la pared inferior de la sala bajo la de aparición. Pertenece a la sala
  // y no lleva a ninguna parte; el resto de la distribución no cambia.
  const entrada = { x: aparicion.x, y: filasCentro.length - 1 };
  tiles[entrada.y][entrada.x] = '.';
```
- [ ] En `src/distribucion.js`, reemplazar la línea `espacioEn, rects, puertas, pasillos, aparicion,` del objeto devuelto por:
```js
    espacioEn, rects, puertas, pasillos, aparicion, entrada,
```
- [ ] En `src/aspecto.js`, reemplazar la función `casillasLibres` completa (con su comentario) por:
```js
// Casillas del área de un espacio donde se puede pisar y que no son puertas ni la entrada del hogar, en orden de lectura
// (fila a fila). La entrada queda libre de objetos y de burbujas (AC-9.6 de la 004).
export function casillasLibres(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const excluidas = new Set([...distribucion.puertas, distribucion.entrada].map((p) => claveCasilla(p.x, p.y)));
  const libres = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (distribucion.espacioEn[y][x] === espacioId && esTransitable(distribucion, x, y) && !excluidas.has(claveCasilla(x, y))) {
        libres.push({ x, y });
      }
    }
  }
  return libres;
}
```
- [ ] Run: `cd poc && node --test test/distribucion.test.js test/aspecto.test.js test/posicion.test.js test/etiquetas.test.js` — expect: PASS (`# pass 33`, `# fail 0`: 10 de distribución, 6 de aspecto, 6 de posición y 11 de etiquetas)
- [ ] Commit: `feat(poc): open a front door in the bottom wall of the living room` (cuerpo: `Plan section: Phase 2: La entrada del hogar` y `Feature: 004-rutinas`)

---

## Phase 3: Formato guardado v4 y migración

**Implements:** FR-10, FR-11 (registro guardado), Story 11 | **Satisfies:** AC-11.1, AC-11.3, AC-11.4, AC-11.5, AC-11.6, AC-11.7, AC-11.8, AC-12.3 (forma guardada)
**Files:** `poc/src/hogar.js`, `poc/src/almacen.js`, `poc/test/almacen.test.js`, `poc/test/habitantes.test.js`
**Interfaces:** Consumes: `DIAS_RUTINA`, `PASO_RUTINA` (Fase 1); `migrarAV2`, `migrarAV3`, `crearAlmacen`, `iniciarSesion` (features 002 y 003). Produces: `crearHogarInicial` con `version: 4` y `bloques: []`; `bloquesActivos(estado)`, `bloquesDeEspacios(estado, ids) → número`, `bloquesDeMiembro(estado, id) → número` (`hogar.js`); `migrarAV4(estado)` y la carga de documentos v1 a v4 (`almacen.js`).

- [ ] En `test/habitantes.test.js`, reemplazar el test `'FR-1, AC-9.4 (002), FR-11 (003): el hogar inicial tiene versión 3, ...'` desde su línea `test(` hasta su primera aserción sobre `e.actividades` (incluida) por:
```js
test('FR-1, AC-9.4 (002), FR-11 (003), FR-10 (004): el hogar inicial tiene versión 4, sin actividades ni bloques, y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 4);
  assert.deepEqual([e.actividades, e.bloques], [[], []]);
```
- [ ] En `test/almacen.test.js`, reemplazar la línea `import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';` por:
```js
import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, migrarAV4, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
```
- [ ] En `test/almacen.test.js`, en las funciones `comoV1` y `comoV2`, reemplazar la línea `const { actividades, ...resto } = estado;` (una en cada función) por:
```js
  const { actividades, bloques, ...resto } = estado;
```
- [ ] En `test/almacen.test.js`, en el test `'AC-9.3 (002), AC-8.3 (003): un hogar de la feature 001 ...'`: reemplazar su título por `'AC-9.3 (002), AC-8.3 (003), AC-11.3 (004): un hogar de la feature 001 se abre sin aviso y se guarda como versión 4 en el siguiente guardado'`, el comentario `// mismos espacios, nombres y personaje, sin actividades; ya en versión 3 en memoria` por `// mismos espacios, nombres y personaje, sin actividades ni bloques; ya en versión 4 en memoria` y `assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 3);` por `assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 4);`.
- [ ] En `test/almacen.test.js`, en el test `'AC-8.4 (003): un hogar de la feature 002 ...'`: reemplazar su título por `'AC-8.4 (003), AC-11.4 (004): un hogar de la feature 002 se abre sin aviso, sin actividades ni bloques, y se guarda como versión 4 en el siguiente guardado'`, el comentario `// mismos espacios y habitantes, sin actividades; ya en versión 3 en memoria` por `// mismos espacios y habitantes, sin actividades ni bloques; ya en versión 4 en memoria` y su `assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 3);` por `assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 4);`.
- [ ] Agregar al final de `test/almacen.test.js`:
```js

// Documento como lo guardaba la feature 003: versión 3 y sin bloques de rutina.
function comoV3(estado) {
  const { bloques, ...resto } = estado;
  return { ...resto, version: 3 };
}

// Bloque guardado tal como lo escribe la feature 004 (para probar el almacén sin depender de sus operaciones).
function bloqueGuardado(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, miembroId: diana.id, dias: 'laborables', inicio: 540, fin: 1080, espacioId: null,
    creadoEn: '2026-10-07T10:00:00.000Z', actualizadoEn: '2026-10-07T10:00:00.000Z',
    creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1', eliminadoEn: null, ...extra,
  };
}

function hogarConBloques(ctx) {
  const e = hogarConActividades(ctx);
  return {
    ...e,
    bloques: [
      bloqueGuardado(e, 'blq-1'), // Lun–Vie 09:00–18:00, fuera de casa
      bloqueGuardado(e, 'blq-2', { dias: 'finde', inicio: 0, fin: 420, espacioId: espaciosDeTipo(e, 'dormitorio')[0].id }),
      bloqueGuardado(e, 'blq-3', { inicio: 1080, fin: 1140, espacioId: espaciosDeTipo(e, 'cocina')[0].id }),
    ],
  };
}

const conBloque = (base, nuevo) => ({ ...base, bloques: base.bloques.map((b) => (b.id === nuevo.id ? nuevo : b)) });

test('AC-11.1, AC-12.3: los bloques de rutina se guardan y se restauran igual, en versión 4', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConBloques(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.equal(estado.version, 4);
});

test('AC-11.5: un hogar de la feature 003 se abre sin aviso, sin bloques, y se guarda como versión 4 en el siguiente guardado', () => {
  const e = hogarConActividades(crearCtx());
  const textoV3 = JSON.stringify(comoV3(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV3 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, habitantes y actividades, sin bloques; ya en versión 4 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV3); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 4);
});

test('migrarAV4 es pura: no modifica el documento de entrada y solo agrega la lista de bloques vacía', () => {
  const v3 = comoV3(hogarConActividades(crearCtx()));
  const copia = structuredClone(v3);
  const v4 = migrarAV4(v3);
  assert.deepEqual(v3, copia);
  assert.equal(v4.version, 4);
  assert.deepEqual(v4.bloques, []);
  assert.deepEqual(comoV3(v4), v3);
});

test('AC-11.6: un bloque activo inválido, o un documento v4 sin lista de bloques, vuelve ilegible el documento', () => {
  const base = hogarConBloques(crearCtx());
  const [b1, b2, b3] = base.bloques;
  const [propietario, , firulais] = base.miembros;
  const { espacioId, ...sinEspacio } = b1;
  const variantes = [
    { ...b1, dias: 'lunes' }, { ...b1, dias: 'toString' }, { ...b1, dias: null },
    { ...b1, inicio: 545 }, { ...b1, inicio: -30 }, { ...b1, inicio: '540' }, { ...b1, fin: 1470 }, { ...b1, fin: 1080.5 },
    { ...b1, inicio: 600, fin: 600 }, { ...b1, inicio: 660, fin: 600 },
    { ...b1, miembroId: propietario.id }, { ...b1, miembroId: firulais.id }, { ...b1, miembroId: 'no-existe' },
    { ...b1, espacioId: 'no-existe' }, { ...b1, espacioId: 'pasillo:izq' }, sinEspacio,
    { ...b3, inicio: 1050 }, // se superpone con blq-1 (Lun–Vie 09:00–18:00)
  ];
  for (const malo of variantes) {
    const { estado, aviso } = abrirDatos(conBloque(base, malo));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.deepEqual(estado.bloques, []);
    assert.equal(estado.miembros.length, 1);
  }
  const { bloques, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const borrado = { ...base.espacios[0], id: 'esp-borrado', tipo: 'lavanderia', eliminadoEn: '2026-10-07T11:00:00.000Z' };
  const conEspacioBorrado = conBloque({ ...base, espacios: [...base.espacios, borrado] }, { ...b2, espacioId: 'esp-borrado' });
  assert.match(abrirDatos(conEspacioBorrado).aviso, /No se pudo recuperar/);
});

test('AC-11.7: un bloque eliminado con datos inválidos no vuelve ilegible el documento', () => {
  const base = hogarConBloques(crearCtx());
  const malo = { ...base.bloques[0], dias: 'lunes', miembroId: 'no-existe', inicio: 7, eliminadoEn: '2026-10-07T11:00:00.000Z' };
  const guardado = conBloque(base, malo);
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
});

test('AC-11.8: el documento guardado no tiene posiciones, objetivos ni datos de la entrada o del cartel', () => {
  const storage = almacenEnMemoria();
  crearAlmacen(storage).guardar(hogarConBloques(crearCtx()));
  const guardado = JSON.parse(storage.datos.get(CLAVE_DATOS));
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'hogares', 'membresias', 'miembros', 'version']);
  for (const b of guardado.bloques) {
    assert.deepEqual(Object.keys(b).sort(), ['actualizadoEn', 'actualizadoPor', 'creadoEn', 'creadoPor', 'dias', 'eliminadoEn',
      'espacioId', 'fin', 'hogarId', 'id', 'inicio', 'miembroId']);
  }
});
```
- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js` — expect: FAIL (`SyntaxError`: `../src/almacen.js` no exporta `migrarAV4`; y en `habitantes.test.js` la versión del hogar inicial es 3, no 4)
- [ ] En `src/hogar.js`, reemplazar en `crearHogarInicial` las dos últimas líneas (el comentario `// Documento versión 3 ...` y el `return`) por:
```js
  // Documento versión 4 (ADR-004 de modelo de rutinas): el hogar empieza sin actividades ni bloques de rutina.
  return {
    version: 4, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [], bloques: [],
  };
```
- [ ] En `src/hogar.js`, agregar después de la función `darDeBajaActividades` (antes de `export const MENSAJES_ERROR`):
```js

// ---------- Bloques de rutina (feature 004): consultas ----------

export const bloquesActivos = (estado) => estado.bloques.filter((b) => b.eliminadoEn === null);
export const bloquesDeEspacios = (estado, ids) => bloquesActivos(estado).filter((b) => ids.includes(b.espacioId)).length;
export const bloquesDeMiembro = (estado, id) => bloquesActivos(estado).filter((b) => b.miembroId === id).length;
```
- [ ] En `src/almacen.js`, reemplazar la línea `import { PARENTESCOS, GENEROS, ESPECIES, ICONOS, FRECUENCIAS } from './catalogo.js';` por:
```js
import { PARENTESCOS, GENEROS, ESPECIES, ICONOS, FRECUENCIAS, DIAS_RUTINA, PASO_RUTINA } from './catalogo.js';
```
- [ ] En `src/almacen.js`, agregar después de la función `actividadesValidas`:
```js

const esMinuto = (n, min, max) => Number.isInteger(n) && n % PASO_RUTINA === 0 && n >= min && n <= max;

// Reglas de los bloques de rutina en la versión 4 (ADR-004 de modelo de rutinas, FR-10 de la 004). Solo se validan los no
// eliminados: horario de la lista, minutos múltiplos de 30 con el fin posterior al inicio, un familiar activo, un espacio activo
// o "Fuera de casa" (null), y sin superposición con otro bloque del mismo familiar y horario.
function bloquesValidos(estado) {
  if (!Array.isArray(estado.bloques)) return false;
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const familiares = new Set(estado.miembros
    .filter((m) => m.eliminadoEn === null && m.tipo === 'persona' && m.cuentaId !== propietaria).map((m) => m.id));
  const espacios = new Set(estado.espacios.filter((e) => e.eliminadoEn === null).map((e) => e.id));
  const activos = estado.bloques.filter((b) => b.eliminadoEn === null);
  const bienFormados = activos.every((b) => enLista(DIAS_RUTINA, b.dias) && esMinuto(b.inicio, 0, 1440 - PASO_RUTINA)
    && esMinuto(b.fin, PASO_RUTINA, 1440) && b.fin > b.inicio && familiares.has(b.miembroId)
    && (b.espacioId === null || espacios.has(b.espacioId)));
  if (!bienFormados) return false;
  return activos.every((a, i) => activos.slice(i + 1)
    .every((b) => a.miembroId !== b.miembroId || a.dias !== b.dias || a.fin <= b.inicio || b.fin <= a.inicio));
}
```
- [ ] En `src/almacen.js`, agregar después de la función `migrarAV3`:
```js

// Migración pura v3 → v4: el hogar pasa a tener una lista de bloques de rutina, vacía.
export function migrarAV4(estado) {
  return { ...estado, version: 4, bloques: [] };
}
```
- [ ] En `src/almacen.js`, dentro de `cargar()`, reemplazar las líneas desde `if (estado?.version === 1 && ...` hasta el cierre `}` del `if` de la versión 3 (antes de `return { estado: null, error: 'ilegible' };`) por:
```js
        if (estado?.version === 1 && tieneHogarValido(estado)) return { estado: migrarAV4(migrarAV3(migrarAV2(estado))), error: null };
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidos(estado)) {
          return { estado: migrarAV4(migrarAV3(estado)), error: null };
        }
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)) {
          return { estado: migrarAV4(estado), error: null };
        }
        if (estado?.version === 4 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)
          && bloquesValidos(estado)) {
          return { estado, error: null };
        }
```
- [ ] En `src/almacen.js`, reemplazar el comentario de `iniciarSesion` por:
```js
// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002, FR-11 de la 003, FR-10 de la 004): recupera el hogar
// (migrándolo si es de una versión anterior) o crea el inicial.
```
- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js test/hogar.test.js test/actividades.test.js` — expect: PASS (`# pass 92`, `# fail 0`: 27 de almacén, 14 de habitantes, 21 de hogar y 30 de actividades)
- [ ] Commit: `feat(poc): save homes in format v4 with routine blocks` (cuerpo: `Plan section: Phase 3: Formato guardado v4 y migración` y `Feature: 004-rutinas`)

---

## Phase 4: Operaciones de rutina y bajas en cascada

**Implements:** FR-1, FR-8 (lógica), FR-9, FR-11, Stories 1, 2, 10 y 12 (lógica) | **Satisfies:** AC-1.3 (orden y texto), AC-1.4 (listas, lógica), AC-1.5 (lógica), AC-1.6, AC-1.7, AC-1.8, AC-1.9, AC-1.11, AC-2.2, AC-2.3, AC-2.4, AC-2.5 (lógica), AC-2.6, AC-10.1 a AC-10.12 (lógica), AC-12.1 a AC-12.5
**Files:** `poc/src/hogar.js`, `poc/src/rutinas.js`, `poc/test/rutinas.test.js`
**Interfaces:** Consumes: `DIAS_RUTINA`, `PASO_RUTINA`, `LIMITE_BLOQUES`, `diaDeSemana` (Fase 1); `bloquesActivos`, `bloquesDeEspacios`, `bloquesDeMiembro` (Fase 3); `buscarMiembro`, `buscarEspacio`, `esPropietario`, `familiares`, `nombreVisible`, `auditoriaNueva`, `tocar` (`hogar.js`). Produces: en `rutinas.js`, `esFamiliar(estado, id)`, `buscarBloque(estado, id)`, `bloquesDe(estado, miembroId, dias)` (por inicio), `contarBloques`, `puedeAgregarBloque`, `agregarBloque(estado, { miembroId, dias, inicio, fin, espacioId }, ctx)`, `editarBloque(estado, id, { inicio, fin, espacioId }, ctx)` y `eliminarBloque(estado, id, ctx)` (las dos primeras devuelven `{ ok, error?, estado }`), `MENSAJES_BLOQUE`, `MINUTOS_DIA`, `textoHora(minutos)`, `textoBloque(estado, bloque)` y `textoBajas(actividades, bloques)`; en `hogar.js`, `consecuenciasDeEliminar(...).bloques` y la baja en cascada de bloques en `eliminarEspacio` y `eliminarHabitante`.

- [ ] Escribir las pruebas:
```js
// test/rutinas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, quitarUltimo, ultimoDeTipo, renombrarEspacio,
  renombrarMiembro, eliminarHabitante, espaciosDeTipo, espaciosActivos, miembrosActivos, familiares, mascotas, banoDe,
  consecuenciasDeEliminar, requiereConfirmacion, bloquesActivos, bloquesDeMiembro, buscarEspacio, puedeEliminar,
} from '../src/hogar.js';
import {
  agregarBloque, editarBloque, eliminarBloque, buscarBloque, bloquesDe, contarBloques, puedeAgregarBloque, textoBloque, textoBajas,
} from '../src/rutinas.js';
import { crearCtx } from './ayuda.js';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Leo', parentesco: 'hijo', genero: 'masculino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const diana = (estado) => familiares(estado)[0];
const leo = (estado) => familiares(estado)[1];

// Datos válidos de la ficha: Diana, Lun–Vie de 09:00 a 18:00, fuera de casa; `extra` cambia lo que haga falta.
const datos = (estado, extra = {}) => ({ miembroId: diana(estado).id, dias: 'laborables', inicio: 540, fin: 1080, espacioId: null, ...extra });

function alta(estado, d, ctx) {
  const r = agregarBloque(estado, d, ctx);
  assert.equal(r.ok, true, `alta de ${d.inicio}–${d.fin}: ${r.error}`);
  return r.estado;
}

const ultimo = (estado) => estado.bloques.at(-1);

test('AC-1.6, AC-12.2, AC-12.3: crear un bloque guarda sus datos, su auditoría y sus referencias por id, y no cambia nada más', () => {
  const ctx = crearCtx();
  const e0 = hogarBase(ctx);
  const cocina = espaciosDeTipo(e0, 'cocina')[0];
  const e1 = alta(e0, datos(e0), ctx);
  const e2 = alta(e1, datos(e1, { inicio: 1080, fin: 1140, espacioId: cocina.id }), ctx);
  const [fuera, enCocina] = e2.bloques;
  assert.deepEqual(
    [fuera.hogarId, fuera.miembroId, fuera.dias, fuera.inicio, fuera.fin, fuera.espacioId],
    [e0.hogares[0].id, diana(e0).id, 'laborables', 540, 1080, null],
  );
  assert.equal(enCocina.espacioId, cocina.id);
  assert.notEqual(fuera.id, enCocina.id);
  for (const b of e2.bloques) {
    assert.ok(b.id && b.creadoEn && b.actualizadoEn);
    assert.deepEqual([b.creadoPor, b.actualizadoPor, b.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
    assert.equal('cuentaId' in b, false);
  }
  assert.deepEqual([e2.espacios, e2.miembros, e2.actividades], [e0.espacios, e0.miembros, e0.actividades]);
});

test('AC-1.4, AC-1.7, FR-1: inicio y fin en pasos de 30 minutos dentro del día, con el fin posterior al inicio', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  for (const [inicio, fin, error] of [
    [545, 600, 'hora'], [-30, 60, 'hora'], [1440, 1470, 'hora'], [0, 1470, 'hora'], [0, 0, 'hora'], ['540', 600, 'hora'],
    [undefined, 600, 'hora'], [600, 600, 'fin'], [660, 600, 'fin'],
  ]) {
    const r = agregarBloque(e, datos(e, { inicio, fin }), ctx);
    assert.deepEqual([r.ok, r.error, r.estado], [false, error, e], `${inicio}–${fin}`);
  }
  for (const [inicio, fin] of [[0, 30], [1410, 1440], [0, 1440]]) {
    assert.equal(agregarBloque(e, datos(e, { inicio, fin }), ctx).ok, true, `${inicio}–${fin}`);
  }
});

test('FR-1, AC-1.11: el lugar es un espacio activo o fuera de casa, el horario uno de los dos y el bloque es de un familiar', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'lavanderia', ctx);
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  e = eliminarEspacio(e, lavanderia.id, ctx);
  const propietario = miembrosActivos(e)[0];
  const casos = [
    [{ espacioId: 'no-existe' }, 'lugar'], [{ espacioId: 'pasillo:der' }, 'lugar'], [{ espacioId: lavanderia.id }, 'lugar'],
    [{ dias: 'lunes' }, 'dias'], [{ dias: 'toString' }, 'dias'], [{ dias: undefined }, 'dias'],
    [{ miembroId: propietario.id }, 'familiar'], [{ miembroId: mascotas(e)[0].id }, 'familiar'], [{ miembroId: 'no-existe' }, 'familiar'],
  ];
  for (const [extra, error] of casos) {
    const r = agregarBloque(e, datos(e, extra), ctx);
    assert.deepEqual([r.ok, r.error], [false, error], JSON.stringify(extra));
  }
  for (const x of espaciosActivos(e)) assert.equal(agregarBloque(e, datos(e, { espacioId: x.id }), ctx).ok, true, x.tipo);
  assert.equal(agregarBloque(e, datos(e, { dias: 'finde' }), ctx).ok, true);
});

test('AC-1.8, AC-1.11: los bloques de un horario no se superponen, pero pueden tocarse; otro horario u otro familiar son independientes', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { inicio: 540, fin: 780 }), ctx); // 09:00–13:00
  for (const [inicio, fin] of [[720, 840], [480, 600], [540, 780], [600, 660], [0, 1440]]) {
    const r = agregarBloque(e, datos(e, { inicio, fin }), ctx);
    assert.deepEqual([r.ok, r.error], [false, 'superpuesto'], `${inicio}–${fin}`);
  }
  for (const extra of [{ inicio: 780, fin: 840 }, { inicio: 480, fin: 540 }, { inicio: 720, fin: 840, dias: 'finde' },
    { inicio: 720, fin: 840, miembroId: leo(e).id }]) {
    assert.equal(agregarBloque(e, datos(e, extra), ctx).ok, true, JSON.stringify(extra));
  }
  assert.deepEqual(bloquesDe(e, leo(e).id, 'laborables'), []);
});

test('AC-1.9: hasta 8 bloques por horario y por familiar; los eliminados no cuentan', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  for (let i = 0; i < 8; i++) e = alta(e, datos(e, { inicio: i * 60, fin: i * 60 + 30 }), ctx);
  assert.deepEqual([contarBloques(e, diana(e).id, 'laborables'), puedeAgregarBloque(e, diana(e).id, 'laborables')], [8, false]);
  const r = agregarBloque(e, datos(e, { inicio: 1200, fin: 1230 }), ctx);
  assert.deepEqual([r.ok, r.error, r.estado], [false, 'limite', e]);
  assert.equal(puedeAgregarBloque(e, diana(e).id, 'finde'), true);
  assert.equal(puedeAgregarBloque(e, leo(e).id, 'laborables'), true);
  e = eliminarBloque(e, e.bloques[0].id, ctx);
  assert.deepEqual([contarBloques(e, diana(e).id, 'laborables'), puedeAgregarBloque(e, diana(e).id, 'laborables')], [7, true]);
  assert.equal(agregarBloque(e, datos(e, { inicio: 1200, fin: 1230 }), ctx).ok, true);
});

test('AC-2.2, AC-2.3, AC-2.4, AC-12.1, FR-8: editar cambia inicio, fin y lugar, rechaza superposiciones y conserva el identificador', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  e = alta(e, datos(e, { inicio: 540, fin: 780 }), ctx);
  const primero = ultimo(e).id;
  e = alta(e, datos(e, { inicio: 840, fin: 1080 }), ctx);
  const segundo = ultimo(e).id;
  for (const [inicio, fin, error] of [[720, 1080, 'superpuesto'], [840, 840, 'fin'], [900, 870, 'fin'], [845, 1080, 'hora']]) {
    const r = editarBloque(e, segundo, { inicio, fin, espacioId: null }, ctx);
    assert.deepEqual([r.ok, r.error, r.estado], [false, error, e], `${inicio}–${fin}`);
  }
  e = editarBloque(e, segundo, { inicio: 780, fin: 1080, espacioId: cocina.id }, ctx).estado; // toca al primero
  e = editarBloque(e, primero, { inicio: 480, fin: 780, espacioId: null }, ctx).estado; // no se superpone consigo mismo
  const b = buscarBloque(e, segundo);
  assert.deepEqual([b.id, b.inicio, b.fin, b.espacioId, b.miembroId, b.dias], [segundo, 780, 1080, cocina.id, diana(e).id, 'laborables']);
  assert.notEqual(b.actualizadoEn, b.creadoEn);
  assert.deepEqual(bloquesDe(e, diana(e).id, 'laborables').map((x) => x.id), [primero, segundo]);
  const r = editarBloque(e, segundo, { inicio: 780, fin: 1080, espacioId: null, miembroId: leo(e).id, dias: 'finde' }, ctx);
  assert.deepEqual([buscarBloque(r.estado, segundo).miembroId, buscarBloque(r.estado, segundo).dias], [diana(e).id, 'laborables']);
  assert.deepEqual(editarBloque(e, 'no-existe', { inicio: 0, fin: 30, espacioId: null }, ctx), { ok: false, error: 'no-encontrado', estado: e });
});

test('AC-2.5, AC-10.10, AC-12.5: eliminar un bloque es un borrado lógico y no toca nada más', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  e = alta(e, datos(e, { dias: 'finde' }), ctx);
  const [uno, dos] = e.bloques;
  const despues = eliminarBloque(e, uno.id, ctx);
  const borrado = despues.bloques.find((b) => b.id === uno.id);
  assert.notEqual(borrado.eliminadoEn, null);
  assert.deepEqual(bloquesActivos(despues), [dos]);
  assert.equal(buscarBloque(despues, uno.id), null);
  assert.deepEqual([despues.espacios, despues.miembros, despues.actividades], [e.espacios, e.miembros, e.actividades]);
  assert.equal(eliminarBloque(despues, uno.id, ctx), despues);
  assert.equal(eliminarBloque(e, 'no-existe', ctx), e);
});

test('AC-1.3, AC-2.6, AC-12.4: la lista va por inicio, muestra hora y lugar, y los vínculos sobreviven a renombres y mudanzas', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'dormitorio', ctx), 'bano', ctx);
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = alta(e, datos(e, { inicio: 1380, fin: 1440, espacioId: d3.id }), ctx);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: bano.id }), ctx);
  e = alta(e, datos(e, { inicio: 540, fin: 1080 }), ctx);
  assert.deepEqual(bloquesDe(e, diana(e).id, 'laborables').map((b) => textoBloque(e, b)),
    ['00:00–07:00 · Baño 2', '09:00–18:00 · Fuera de casa', '23:00–24:00 · Dormitorio 3']);
  e = eliminarEspacio(e, d2.id, ctx); // "Dormitorio 3" pasa a llamarse "Dormitorio 2"
  e = eliminarEspacio(e, d1.id, ctx); // el baño interno se muda al otro dormitorio
  e = renombrarEspacio(e, d3.id, 'Cuarto de Diana', ctx).estado;
  e = renombrarMiembro(e, diana(e).id, 'Dana', ctx).estado;
  const lista = bloquesDe(e, diana(e).id, 'laborables');
  assert.deepEqual(lista.map((b) => b.espacioId), [bano.id, null, d3.id]);
  assert.equal(textoBloque(e, lista[2]), '23:00–24:00 · Cuarto de Diana');
  assert.equal(buscarEspacio(e, bano.id).contenidoEn, d3.id);
});

test('AC-10.1, AC-10.2, AC-10.3, FR-9: eliminar un espacio elimina sus bloques y ningún otro; la confirmación los cuenta', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'lavanderia', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id, dias: 'finde' }), ctx);
  e = alta(e, datos(e, { inicio: 540, fin: 1080 }), ctx); // fuera de casa
  e = alta(e, datos(e, { inicio: 1080, fin: 1140, espacioId: cocina.id }), ctx);
  const c = consecuenciasDeEliminar(e, d2.id);
  assert.deepEqual([c.bloques, c.actividades], [2, 0]);
  assert.equal(requiereConfirmacion(e, d2.id), true); // sin nombre personalizado ni actividades, pero con bloques
  assert.equal(requiereConfirmacion(e, lavanderia.id), false);
  const despues = eliminarEspacio(e, d2.id, ctx);
  assert.ok(despues.bloques.filter((b) => b.espacioId === d2.id).every((b) => b.eliminadoEn !== null));
  assert.deepEqual(bloquesActivos(despues).map((b) => b.espacioId), [null, cocina.id]);
  assert.deepEqual(familiares(despues).map((m) => m.id), familiares(e).map((m) => m.id));
});

test('AC-10.4: si el baño interno se elimina con su cuarto, también se eliminan sus bloques y la confirmación los suma', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  e = agregarEspacio(agregarEspacio(e, 'bano', ctx), 'bano', ctx); // los dos dormitorios tienen baño: no hay adónde moverlo
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const banoD1 = banoDe(e, d1.id);
  const banoD2 = banoDe(e, d2.id);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: banoD2.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: banoD2.id, dias: 'finde' }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: banoD1.id, miembroId: leo(e).id }), ctx);
  const c = consecuenciasDeEliminar(e, d2.id);
  assert.deepEqual([c.banoSeElimina, c.bloques], [true, 3]);
  const despues = eliminarEspacio(e, d2.id, ctx);
  assert.equal(buscarEspacio(despues, banoD2.id), null);
  assert.deepEqual(bloquesActivos(despues).map((b) => b.espacioId), [banoD1.id]);
});

test('AC-10.5: si el baño interno se mueve a otro cuarto, conserva sus bloques y solo se eliminan los del cuarto', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx); // el baño va a Dormitorio 1
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d1.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: bano.id }), ctx);
  const c = consecuenciasDeEliminar(e, d1.id);
  assert.deepEqual([c.banoSeMueve, c.bloques], [true, 1]);
  const despues = eliminarEspacio(e, d1.id, ctx);
  assert.equal(buscarEspacio(despues, bano.id).contenidoEn, d2.id);
  assert.deepEqual(bloquesActivos(despues).map((b) => b.espacioId), [bano.id]);
});

test('AC-10.6: quitar con "−" pide la misma confirmación y aplica la misma cascada', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const bano = ultimoDeTipo(e, 'bano');
  e = alta(e, datos(e, { inicio: 0, fin: 420, espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { inicio: 420, fin: 480, espacioId: bano.id }), ctx);
  assert.equal(ultimoDeTipo(e, 'dormitorio').id, d2.id);
  assert.deepEqual([requiereConfirmacion(e, d2.id), consecuenciasDeEliminar(e, d2.id).bloques], [true, 1]);
  assert.deepEqual([requiereConfirmacion(e, bano.id), consecuenciasDeEliminar(e, bano.id).bloques], [true, 1]);
  assert.deepEqual(bloquesActivos(quitarUltimo(e, 'dormitorio', ctx)).map((b) => b.espacioId), [bano.id]);
  assert.deepEqual(bloquesActivos(quitarUltimo(e, 'bano', ctx)).map((b) => b.espacioId), [d2.id]);
});

test('AC-10.7, AC-10.8, AC-10.9, FR-9: eliminar un familiar elimina sus bloques y la confirmación los cuenta', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  e = alta(e, datos(e, { dias: 'finde' }), ctx);
  e = alta(e, datos(e, { inicio: 0, fin: 420 }), ctx);
  e = alta(e, datos(e, { miembroId: leo(e).id }), ctx);
  assert.deepEqual([bloquesDeMiembro(e, diana(e).id), bloquesDeMiembro(e, leo(e).id), bloquesDeMiembro(e, mascotas(e)[0].id)], [3, 1, 0]);
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.ok(sinDiana.bloques.filter((b) => b.miembroId === diana(e).id).every((b) => b.eliminadoEn !== null));
  assert.deepEqual(bloquesActivos(sinDiana).map((b) => b.miembroId), [leo(e).id]);
  assert.equal(textoBajas(0, 3), 'Se eliminarán 3 bloques de rutina.');
  assert.equal(textoBajas(3, 2), 'Se eliminarán 3 actividades y 2 bloques de rutina.');
  assert.equal(textoBajas(1, 3), 'Se eliminarán 1 actividad y 3 bloques de rutina.');
  assert.equal(textoBajas(1, 0), 'Se eliminará 1 actividad.');
  assert.equal(textoBajas(0, 1), 'Se eliminará 1 bloque de rutina.');
  assert.equal(textoBajas(2, 0), 'Se eliminarán 2 actividades.');
  assert.equal(textoBajas(0, 0), '');
});

// Hogar con todos los tipos de espacio al máximo y `banos` baños internos (de 0 a 6).
function hogarCompleto(ctx, banos) {
  let e = hogarBase(ctx);
  for (const tipo of ['comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota', 'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina']) {
    e = agregarEspacio(e, tipo, ctx);
  }
  for (let i = 0; i < banos; i++) e = agregarEspacio(e, 'bano', ctx);
  return e;
}

function referenciasValidas(estado) {
  const fams = new Set(familiares(estado).map((m) => m.id));
  const espacios = new Set(espaciosActivos(estado).map((x) => x.id));
  return bloquesActivos(estado).every((b) => fams.has(b.miembroId) && (b.espacioId === null || espacios.has(b.espacioId)));
}

test('AC-10.12, Reliability, FR-9: ninguna baja de un espacio o de un familiar deja un bloque activo con referencias rotas', () => {
  for (const banos of [0, 3, 6]) {
    const ctx = crearCtx();
    let e = hogarCompleto(ctx, banos);
    // un bloque por espacio, repartidos entre los dos familiares y los dos horarios, sin superponerse
    espaciosActivos(e).forEach((x, i) => {
      const inicio = Math.floor(i / 4) * 60;
      e = alta(e, datos(e, { miembroId: familiares(e)[i % 2].id, dias: i % 4 < 2 ? 'laborables' : 'finde', inicio, fin: inicio + 30, espacioId: x.id }), ctx);
    });
    for (const x of espaciosActivos(e).filter((x) => puedeEliminar(e, x.id))) {
      const despues = eliminarEspacio(e, x.id, ctx);
      assert.ok(referenciasValidas(despues), `${banos} baños, sin ${x.tipo}`);
      assert.ok(bloquesActivos(despues).length < bloquesActivos(e).length);
    }
    for (const m of familiares(e)) assert.ok(referenciasValidas(eliminarHabitante(e, m.id, ctx)), m.nombre);
  }
});
```
- [ ] Run: `cd poc && node --test test/rutinas.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/rutinas.js`)
- [ ] En `src/hogar.js`, reemplazar la función `consecuenciasDeEliminar` (con su comentario) y `requiereConfirmacion` por:
```js
// Qué pasaría al eliminar este espacio (para decidir si se pide confirmación). `actividades` cuenta las pendientes y `bloques`
// los bloques de rutina que se eliminarían con él, incluidos los de su baño interno si se elimina con él (FR-9 de la 003 y
// de la 004).
export function consecuenciasDeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  const bano = espacio ? banoDe(estado, espacio.id) : null;
  const banoSeElimina = Boolean(bano) && siguienteDestinoBano(estado, id) === null;
  const eliminados = banoSeElimina ? [id, bano.id] : [id];
  return {
    tieneNombrePersonalizado: Boolean(espacio?.nombrePersonalizado),
    banoSeElimina,
    banoSeMueve: Boolean(bano) && !banoSeElimina,
    actividades: pendientesDeEspacios(estado, eliminados),
    bloques: bloquesDeEspacios(estado, eliminados),
  };
}

export const requiereConfirmacion = (estado, id) => {
  const c = consecuenciasDeEliminar(estado, id);
  return c.tieneNombrePersonalizado || c.banoSeElimina || c.actividades > 0 || c.bloques > 0;
};
```
- [ ] En `src/hogar.js`, dentro de `eliminarEspacio`, reemplazar las tres líneas que empiezan en `// Baja en cascada de las actividades del espacio` hasta `resultado = darDeBajaActividades(...)` (incluida) por:
```js
  // Baja en cascada de las actividades y de los bloques de rutina del espacio y, si se elimina con él, de su baño interno
  // (FR-9 de la 003 y de la 004). Si el baño se mueve, conserva los suyos.
  const eliminados = bano && !destino ? [id, bano.id] : [id];
  resultado = darDeBajaActividades(resultado, (a) => eliminados.includes(a.espacioId), ahora, ctx);
  resultado = darDeBajaBloques(resultado, (b) => eliminados.includes(b.espacioId), ahora, ctx);
```
- [ ] En `src/hogar.js`, reemplazar la función `eliminarHabitante` (con su comentario) por:
```js
// Borrado lógico (FR-4, FR-10 de la 002): el registro queda con su fecha de eliminación; no afecta a los espacios ni a los
// demás miembros. Sus actividades y sus bloques de rutina se dan de baja en la misma operación (FR-9 de la 003 y de la 004).
export function eliminarHabitante(estado, id, ctx) {
  if (!puedeEliminarMiembro(estado, id)) return estado;
  const ahora = ctx.ahora();
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), eliminadoEn: ahora } : m));
  const sinActividades = darDeBajaActividades({ ...estado, miembros }, (a) => a.miembroId === id, ahora, ctx);
  return darDeBajaBloques(sinActividades, (b) => b.miembroId === id, ahora, ctx);
}
```
- [ ] En `src/hogar.js`, agregar después de la línea `export const bloquesDeMiembro = ...` (Fase 3):
```js

// Baja lógica, con la misma fecha, de todos los bloques activos que cumplen `afectado` (FR-9 de la 004).
function darDeBajaBloques(estado, afectado, ahora, ctx) {
  const bloques = estado.bloques.map((b) => (b.eliminadoEn === null && afectado(b) ? { ...tocar(b, ctx), eliminadoEn: ahora } : b));
  return { ...estado, bloques };
}
```
- [ ] Crear `src/rutinas.js`:
```js
// src/rutinas.js
// Rutinas de los familiares (feature 004): operaciones puras sobre `estado.bloques` (ADR-004 de modelo de rutinas) y, más
// abajo, el lugar que corresponde a cada familiar según la fecha y el minuto locales (ADR-004 de movimiento).
import { DIAS_RUTINA, PASO_RUTINA, LIMITE_BLOQUES } from './catalogo.js';
import {
  buscarMiembro, buscarEspacio, esPropietario, familiares, bloquesActivos, nombreVisible, auditoriaNueva, tocar,
} from './hogar.js';
import { diaDeSemana } from './fechas.js';

export const MINUTOS_DIA = 1440;

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);
const esMinuto = (n, min, max) => Number.isInteger(n) && n % PASO_RUTINA === 0 && n >= min && n <= max;
const seSuperponen = (a, b) => a.inicio < b.fin && b.inicio < a.fin;

// Solo los familiares tienen rutina: personas activas que no son el personaje del propietario (FR-1).
export function esFamiliar(estado, id) {
  const miembro = buscarMiembro(estado, id);
  return Boolean(miembro) && miembro.tipo === 'persona' && !esPropietario(estado, miembro);
}

export const buscarBloque = (estado, id) => bloquesActivos(estado).find((b) => b.id === id) ?? null;

// Bloques activos de un horario de un familiar, ordenados por inicio (AC-1.3).
export const bloquesDe = (estado, miembroId, dias) => bloquesActivos(estado)
  .filter((b) => b.miembroId === miembroId && b.dias === dias)
  .sort((a, b) => a.inicio - b.inicio);
export const contarBloques = (estado, miembroId, dias) => bloquesDe(estado, miembroId, dias).length;
export const puedeAgregarBloque = (estado, miembroId, dias) => contarBloques(estado, miembroId, dias) < LIMITE_BLOQUES;

// Valida inicio, fin y lugar de un bloque del horario `dias` de `miembroId` (FR-1). `idExcluido` es el bloque que se edita,
// que no se superpone consigo mismo. Devuelve { error } o { datos } listos para guardar.
function validarBloque(estado, miembroId, dias, datos, idExcluido) {
  const { inicio, fin } = datos;
  const espacioId = datos.espacioId ?? null;
  if (!esMinuto(inicio, 0, MINUTOS_DIA - PASO_RUTINA) || !esMinuto(fin, PASO_RUTINA, MINUTOS_DIA)) return { error: 'hora' };
  if (fin <= inicio) return { error: 'fin' };
  if (espacioId !== null && !buscarEspacio(estado, espacioId)) return { error: 'lugar' };
  const choca = bloquesDe(estado, miembroId, dias).some((b) => b.id !== idExcluido && seSuperponen(b, { inicio, fin }));
  if (choca) return { error: 'superpuesto' };
  return { datos: { inicio, fin, espacioId } };
}

export function agregarBloque(estado, datos, ctx) {
  if (!esFamiliar(estado, datos.miembroId)) return { ok: false, error: 'familiar', estado };
  if (!enLista(DIAS_RUTINA, datos.dias)) return { ok: false, error: 'dias', estado };
  if (!puedeAgregarBloque(estado, datos.miembroId, datos.dias)) return { ok: false, error: 'limite', estado };
  const v = validarBloque(estado, datos.miembroId, datos.dias, datos, null);
  if (v.error) return { ok: false, error: v.error, estado };
  const bloque = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, miembroId: datos.miembroId, dias: datos.dias, ...v.datos, ...auditoriaNueva(ctx),
  };
  return { ok: true, estado: { ...estado, bloques: [...estado.bloques, bloque] } };
}

// Editar cambia inicio, fin y lugar; el familiar y el horario de un bloque no cambian (FR-8).
export function editarBloque(estado, id, datos, ctx) {
  const bloque = buscarBloque(estado, id);
  if (!bloque) return { ok: false, error: 'no-encontrado', estado };
  const v = validarBloque(estado, bloque.miembroId, bloque.dias, datos, id);
  if (v.error) return { ok: false, error: v.error, estado };
  const bloques = estado.bloques.map((b) => (b.id === id ? { ...tocar(b, ctx), ...v.datos } : b));
  return { ok: true, estado: { ...estado, bloques } };
}

// Borrado lógico (FR-8): el registro queda con su fecha de eliminación; no afecta a nada más.
export function eliminarBloque(estado, id, ctx) {
  if (!buscarBloque(estado, id)) return estado;
  const ahora = ctx.ahora();
  const bloques = estado.bloques.map((b) => (b.id === id ? { ...tocar(b, ctx), eliminadoEn: ahora } : b));
  return { ...estado, bloques };
}

export const MENSAJES_BLOQUE = {
  familiar: 'Solo los familiares tienen rutina.',
  dias: 'Elige Lun–Vie o Sáb–Dom.',
  limite: 'Este horario ya tiene 8 bloques.',
  hora: 'Elige el inicio y el fin de la lista.',
  fin: 'El fin debe ser posterior al inicio.',
  lugar: 'Elige un lugar de la lista.',
  superpuesto: 'Se superpone con otro bloque de este horario.',
  'no-encontrado': 'Ese bloque ya no existe.',
};

// ---------- Textos ----------

const dos = (n) => String(n).padStart(2, '0');

// Hora "HH:MM" de un minuto del día; el final del día se muestra como 24:00 (AC-1.3).
export const textoHora = (minutos) => `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;

// Fila de la lista de la rutina: "09:00–18:00 · Fuera de casa" o "09:00–18:00 · <nombre del espacio>" (AC-1.3).
export function textoBloque(estado, bloque) {
  const lugar = bloque.espacioId === null ? 'Fuera de casa' : nombreVisible(estado, buscarEspacio(estado, bloque.espacioId));
  return `${textoHora(bloque.inicio)}–${textoHora(bloque.fin)} · ${lugar}`;
}

// Aviso de las confirmaciones de eliminar un espacio o un familiar: nombra solo lo que se elimina (AC-10.1, AC-10.2, AC-10.7).
export function textoBajas(actividades, bloques) {
  const partes = [];
  if (actividades > 0) partes.push(actividades === 1 ? '1 actividad' : `${actividades} actividades`);
  if (bloques > 0) partes.push(bloques === 1 ? '1 bloque de rutina' : `${bloques} bloques de rutina`);
  if (partes.length === 0) return '';
  return `Se eliminará${actividades + bloques === 1 ? '' : 'n'} ${partes.join(' y ')}.`;
}
```
- [ ] Run: `cd poc && node --test test/rutinas.test.js test/actividades.test.js test/hogar.test.js test/habitantes.test.js test/almacen.test.js` — expect: PASS (`# pass 106`, `# fail 0`: 14 de rutinas, 30 de actividades, 21 de hogar, 14 de habitantes y 27 de almacén)
- [ ] Commit: `feat(poc): add routine blocks with cascading removal` (cuerpo: `Plan section: Phase 4: Operaciones de rutina y bajas en cascada` y `Feature: 004-rutinas`)

---

## Phase 5: Hora y lugar según la rutina

**Implements:** FR-2, FR-3 (objetivos), FR-5 (hora de vuelta), Stories 5 y 7 (lógica) | **Satisfies:** AC-5.4 a AC-5.7 (textos), AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5 (con la Fase 1)
**Files:** `poc/src/rutinas.js`, `poc/test/rutinas-lugar.test.js`
**Interfaces:** Consumes: `bloquesDe`, `textoHora`, `MINUTOS_DIA` (Fase 4); `diaDeSemana` (Fase 1); `familiares` (`hogar.js`). Produces: `horarioDelDia(fecha) → 'laborables' | 'finde'`, `bloqueVigente(estado, miembroId, ahora)`, `objetivoDe(estado, miembroId, ahora) → { tipo: 'espacio', espacioId } | { tipo: 'fuera' } | { tipo: 'libre' }`, `objetivosDeFamiliares(estado, ahora) → Map(id → objetivo)` (solo familiares), `finDeSalida(estado, miembroId, ahora) → minuto | null` y `textoVuelta(estado, miembroId, ahora)`. `ahora` es `{ fecha: 'AAAA-MM-DD', minuto: 0..1439 }`.

- [ ] Escribir las pruebas:
```js
// test/rutinas-lugar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarHabitante, espaciosDeTipo, familiares, mascotas, miembrosActivos } from '../src/hogar.js';
import {
  agregarBloque, horarioDelDia, bloqueVigente, objetivoDe, objetivosDeFamiliares, finDeSalida, textoVuelta, textoHora, MINUTOS_DIA,
} from '../src/rutinas.js';
import { crearCtx } from './ayuda.js';

const VIERNES = '2026-10-09';
const SABADO = '2026-10-10';
const DOMINGO = '2026-10-11';
const LUNES = '2026-10-12';
const a = (fecha, hora, minuto = 0) => ({ fecha, minuto: hora * 60 + minuto });

// Hogar con Diana (familiar) y Firulais (mascota); `bloques(estado)` da los bloques de Diana, por defecto Lun–Vie y fuera de casa.
function hogarConRutina(bloques) {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
  const diana = familiares(e)[0];
  for (const b of bloques(e)) {
    const r = agregarBloque(e, { miembroId: diana.id, dias: 'laborables', espacioId: null, ...b }, ctx);
    assert.equal(r.ok, true, r.error);
    e = r.estado;
  }
  return { e, diana };
}

test('AC-7.1, AC-7.2, FR-2: un bloque está vigente desde su inicio hasta justo antes de su fin; dos que se tocan se suceden', () => {
  const { e, diana } = hogarConRutina((x) => [
    { inicio: 540, fin: 780, espacioId: espaciosDeTipo(x, 'cocina')[0].id }, // 09:00–13:00
    { inicio: 780, fin: 1080 }, // 13:00–18:00, fuera
  ]);
  const [cocina, fuera] = e.bloques;
  const vigente = (h, m) => bloqueVigente(e, diana.id, a(LUNES, h, m))?.id ?? null;
  assert.deepEqual(
    [vigente(8, 59), vigente(9, 0), vigente(12, 59), vigente(13, 0), vigente(17, 59), vigente(18, 0)],
    [null, cocina.id, cocina.id, fuera.id, fuera.id, null],
  );
});

test('AC-7.3, AC-7.4, FR-2: de lunes a viernes rige "Lun–Vie" y el fin de semana "Sáb–Dom", también al pasar la medianoche', () => {
  assert.deepEqual([VIERNES, SABADO, DOMINGO, LUNES].map(horarioDelDia), ['laborables', 'finde', 'finde', 'laborables']);
  const { e, diana } = hogarConRutina((x) => [
    { inicio: 1080, fin: 1440 }, // Lun–Vie 18:00–24:00, fuera
    { inicio: 0, fin: 420, dias: 'finde', espacioId: espaciosDeTipo(x, 'dormitorio')[0].id },
  ]);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[0];
  assert.deepEqual(objetivoDe(e, diana.id, a(VIERNES, 23, 59)), { tipo: 'fuera' });
  assert.deepEqual(objetivoDe(e, diana.id, a(SABADO, 0, 0)), { tipo: 'espacio', espacioId: dormitorio.id });
  assert.deepEqual(objetivoDe(e, diana.id, a(DOMINGO, 6, 59)), { tipo: 'espacio', espacioId: dormitorio.id });
  assert.deepEqual(objetivoDe(e, diana.id, a(SABADO, 18, 0)), { tipo: 'libre' });
  assert.deepEqual(objetivoDe(e, diana.id, a(LUNES, 0, 0)), { tipo: 'libre' });
});

test('FR-2, FR-3: el objetivo es el espacio del bloque vigente, fuera o libre; solo los familiares tienen objetivo', () => {
  const { e, diana } = hogarConRutina((x) => [{ inicio: 540, fin: 600, espacioId: espaciosDeTipo(x, 'sala')[0].id }, { inicio: 600, fin: 660 }]);
  const sala = espaciosDeTipo(e, 'sala')[0];
  const objetivos = objetivosDeFamiliares(e, a(LUNES, 9, 30));
  assert.deepEqual([...objetivos.keys()], [diana.id]);
  assert.deepEqual(objetivos.get(diana.id), { tipo: 'espacio', espacioId: sala.id });
  assert.deepEqual(objetivosDeFamiliares(e, a(LUNES, 10, 0)).get(diana.id), { tipo: 'fuera' });
  assert.deepEqual(objetivosDeFamiliares(e, a(LUNES, 11, 0)).get(diana.id), { tipo: 'libre' });
  assert.equal(objetivos.has(mascotas(e)[0].id), false);
  assert.equal(objetivos.has(miembrosActivos(e)[0].id), false);
});

test('AC-5.4, AC-5.5, AC-5.6, AC-5.7: la hora de vuelta es el fin del tramo continuo fuera de casa de hoy', () => {
  const { e, diana } = hogarConRutina((x) => [
    { inicio: 540, fin: 780 }, { inicio: 780, fin: 1080 }, // 09:00–13:00 y 13:00–18:00, fuera
    { inicio: 1080, fin: 1140, espacioId: espaciosDeTipo(x, 'cocina')[0].id },
    { inicio: 1200, fin: 1440 }, // 20:00–24:00, fuera
  ]);
  assert.equal(finDeSalida(e, diana.id, a(LUNES, 10, 0)), 1080);
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 10, 0)), 'Vuelve a las 18:00');
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 14, 0)), 'Vuelve a las 18:00');
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 21, 0)), 'Vuelve mañana');
  assert.equal(finDeSalida(e, diana.id, a(LUNES, 18, 30)), null);
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 18, 30)), 'Volviendo');
  assert.equal(textoVuelta(e, diana.id, a(SABADO, 10, 0)), 'Volviendo');
  assert.deepEqual([0, 30, 540, 1410, MINUTOS_DIA].map(textoHora), ['00:00', '00:30', '09:00', '23:30', '24:00']);
});

test('las funciones de hora y lugar son puras y repiten el resultado con los mismos argumentos', () => {
  const { e, diana } = hogarConRutina(() => [{ inicio: 540, fin: 1080 }]);
  const copia = structuredClone(e);
  const ahora = a(LUNES, 10, 0);
  assert.deepEqual(objetivoDe(e, diana.id, ahora), objetivoDe(e, diana.id, ahora));
  assert.deepEqual(objetivosDeFamiliares(e, ahora), objetivosDeFamiliares(e, ahora));
  assert.equal(textoVuelta(e, diana.id, ahora), textoVuelta(e, diana.id, ahora));
  assert.deepEqual(e, copia);
  assert.deepEqual(ahora, a(LUNES, 10, 0));
});
```
- [ ] Run: `cd poc && node --test test/rutinas-lugar.test.js` — expect: FAIL (`SyntaxError`: `../src/rutinas.js` no exporta `bloqueVigente`)
- [ ] Agregar al final de `src/rutinas.js`:
```js

// ---------- Hora y lugar (ADR-004 de movimiento): nada se guarda; todo sale de (estado, ahora) ----------

// Horario de una fecha (FR-2): de lunes a viernes, `laborables`; sábado y domingo, `finde`.
export const horarioDelDia = (fecha) => (diaDeSemana(fecha) >= 6 ? 'finde' : 'laborables');

// Bloque vigente (FR-2): el del horario de hoy que cubre el minuto actual (inicio ≤ minuto < fin), o null.
export const bloqueVigente = (estado, miembroId, ahora) => bloquesDe(estado, miembroId, horarioDelDia(ahora.fecha))
  .find((b) => b.inicio <= ahora.minuto && ahora.minuto < b.fin) ?? null;

// Objetivo de un familiar (ADR-004): el espacio de su bloque vigente, fuera de casa, o libre si no tiene bloque vigente.
export function objetivoDe(estado, miembroId, ahora) {
  const bloque = bloqueVigente(estado, miembroId, ahora);
  if (!bloque) return { tipo: 'libre' };
  return bloque.espacioId === null ? { tipo: 'fuera' } : { tipo: 'espacio', espacioId: bloque.espacioId };
}

// Objetivos de todos los familiares, para el movimiento (FR-3). Las mascotas y el personaje del propietario no tienen rutina.
export const objetivosDeFamiliares = (estado, ahora) => new Map(familiares(estado).map((m) => [m.id, objetivoDe(estado, m.id, ahora)]));

// Fin del tramo continuo de bloques "Fuera de casa" de hoy que incluye el minuto actual, o null si no le toca estar fuera (AC-5.5).
export function finDeSalida(estado, miembroId, ahora) {
  let actual = bloqueVigente(estado, miembroId, ahora);
  if (!actual || actual.espacioId !== null) return null;
  const bloques = bloquesDe(estado, miembroId, horarioDelDia(ahora.fecha));
  const siguienteDe = (b) => bloques.find((x) => x.inicio === b.fin && x.espacioId === null);
  for (let s = siguienteDe(actual); s; s = siguienteDe(actual)) actual = s;
  return actual.fin;
}

// Texto de la fila del cartel (AC-5.4 a AC-5.7): la hora a la que vuelve, "Vuelve mañana" si su salida llega a las 24:00, o
// "Volviendo" si ya no le toca estar fuera (espera a que se libere la entrada).
export function textoVuelta(estado, miembroId, ahora) {
  const fin = finDeSalida(estado, miembroId, ahora);
  if (fin === null) return 'Volviendo';
  return fin === MINUTOS_DIA ? 'Vuelve mañana' : `Vuelve a las ${textoHora(fin)}`;
}
```
- [ ] Run: `cd poc && node --test test/rutinas-lugar.test.js test/rutinas.test.js` — expect: PASS (`# pass 19`, `# fail 0`: 5 de lugar y 14 de rutinas)
- [ ] Commit: `feat(poc): derive each relative's goal and return time from the routine` (cuerpo: `Plan section: Phase 5: Hora y lugar según la rutina` y `Feature: 004-rutinas`)

---

## Phase 6: Rutas y movimiento hacia un objetivo

**Implements:** FR-3, FR-4, FR-6 (lógica), FR-7, NFR Reliability (movimiento), Stories 3, 4, 6 y 8 (lógica) | **Satisfies:** AC-3.1 a AC-3.12, AC-4.1 a AC-4.8, AC-6.1, AC-6.3, AC-6.4 (lógica), AC-6.6, AC-6.7, AC-6.8, AC-8.1 a AC-8.5, AC-9.5 (con la Fase 2)
**Files:** `poc/src/rutas.js`, `poc/src/movimiento.js`, `poc/test/rutas.test.js`, `poc/test/movimiento.test.js`
**Interfaces:** Consumes: `esTransitable`, `entrada` (Fase 2); `DIRECCIONES`, `claveCasilla` (`posicion.js`). Produces: `rutaMasCorta(distribucion, desde, esDestino) → [{x, y}, …] | [] | null` y `casillasDe(distribucion, espacioId)` (`rutas.js`); en `movimiento.js`, el móvil con `objetivo`, `fase` (`'pasea' | 'planifica' | 'ruta' | 'fuera'`) y `ruta`; `colocarHabitantes(ids, distribucion, jugador, azar, objetivos = new Map())`, `fijarObjetivos(moviles, objetivos)`, `mismoObjetivo(a, b)`, `ESPERA_MS`; `avanzarHabitantes`, `sincronizarHabitantes`, `congelarHabitantes` y `ocupadasPorHabitantes` con la misma firma que en la 002.

`rutas.js` es una búsqueda en anchura sobre el mapa, sin personajes, con orden fijo de direcciones. `movimiento.js` conserva el paseo al azar del ADR-002 (con el mismo consumo del azar, así que las pruebas de la 002 no cambian de resultado) y le agrega las fases del ADR-004. Las casillas ocupadas pasan de conjunto a conteo, porque en ruta dos habitantes pueden compartir una casilla y liberar el origen de uno no debe liberar la del otro.

- [ ] Escribir las pruebas de rutas:
```js
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
```

- [ ] En `test/movimiento.test.js`, reemplazar todas las líneas `import` (de `node:test` a `./ayuda.js`) por:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo, espaciosActivos, banoDe } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { paso, claveCasilla } from '../src/posicion.js';
import { rutaMasCorta, casillasDe } from '../src/rutas.js';
import {
  MS_POR_PASO, PAUSA_MIN_MS, PAUSA_MAX_MS, TRAMO_MAX, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes,
  congelarHabitantes, ocupadasPorHabitantes, fijarObjetivos, mismoObjetivo,
} from '../src/movimiento.js';
import { crearCtx, azarReproducible } from './ayuda.js';
```
- [ ] En `test/movimiento.test.js`, reemplazar la línea `const movil = (id, x, y, extra = {}) => ...` por:
```js
const LIBRE = { tipo: 'libre' };
const movil = (id, x, y, extra = {}) => ({
  id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null, objetivo: LIBRE, fase: 'pasea', ruta: [], ...extra,
});
```
- [ ] En `test/movimiento.test.js`, reemplazar la función `verificarInvariantes` completa (con su comentario) por:
```js
// Invariantes de FR-5 y FR-6 de la 002 y de FR-7 de la 004: nadie en una casilla no transitable; el jugador y quienes pasean nunca
// comparten casilla (incluidos los orígenes de sus pasos); quien va en ruta o planifica puede pisar la casilla de otro habitante,
// pero nunca las del jugador; quien está fuera no ocupa ninguna.
function verificarInvariantes(d, moviles, jugador) {
  const vistas = new Set();
  const delJugador = new Set();
  const marcar = (x, y, quien, unica) => {
    assert.ok(esTransitable(d, x, y), `${quien} en una casilla no transitable (${x},${y})`);
    const k = claveCasilla(x, y);
    assert.ok(!delJugador.has(k), `${quien} en una casilla del jugador ${k}`);
    if (!unica) return;
    assert.ok(!vistas.has(k), `${quien} comparte la casilla ${k}`);
    vistas.add(k);
  };
  for (const c of [jugador, jugador.desde].filter(Boolean)) {
    assert.ok(esTransitable(d, c.x, c.y), `jugador en una casilla no transitable (${c.x},${c.y})`);
    vistas.add(claveCasilla(c.x, c.y));
    delJugador.add(claveCasilla(c.x, c.y));
  }
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    marcar(h.x, h.y, h.id, h.fase === 'pasea');
    if (h.desde) marcar(h.desde.x, h.desde.y, `${h.id} (origen)`, h.fase === 'pasea');
  }
}
```
- [ ] En `test/movimiento.test.js`, dentro de `simular`, reemplazar la línea `alCuadro(moviles);` por:
```js
    moviles = alCuadro(moviles, t) ?? moviles; // `alCuadro` puede devolver los móviles con objetivos nuevos
```
- [ ] Agregar al final de `test/movimiento.test.js`:
```js

// ---------- Feature 004: movimiento hacia un objetivo ----------

// Avanza en cuadros de 50 ms, comprobando las invariantes, hasta que `listo(moviles)` o hasta `limiteMs`; devuelve los móviles y
// los milisegundos transcurridos.
function hasta(d, moviles, jugador, listo, limiteMs = 120000, azar = azarReproducible(1)) {
  let t = 0;
  while (!listo(moviles) && t < limiteMs) {
    moviles = avanzarHabitantes(moviles, d, jugador, 50, azar);
    t += 50;
    verificarInvariantes(d, moviles, jugador);
  }
  return { moviles, t };
}

const enCocina1 = { x: 1, y: 2, desde: null }; // casilla de la primera cocina del hogar más grande, lejos de las rutas que se miden

test('AC-6.1 (004), FR-6: al colocarlos, cada familiar queda en su espacio, fuera del mapa o libre, sin compartir casilla', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const jugador = { ...d.aparicion, desde: null };
  const cocina = espaciosDeTipo(estado, 'cocina')[0].id;
  const oficina = espaciosDeTipo(estado, 'oficina')[1].id;
  const objetivos = new Map([
    ['h-1', { tipo: 'espacio', espacioId: cocina }], ['h-2', { tipo: 'espacio', espacioId: cocina }],
    ['h-3', { tipo: 'espacio', espacioId: oficina }], ['h-4', { tipo: 'fuera' }], ['h-5', { tipo: 'fuera' }],
  ]);
  for (const semilla of SEMILLAS.slice(0, 100)) {
    const moviles = colocarHabitantes(IDS, d, jugador, azarReproducible(semilla), objetivos);
    verificarInvariantes(d, moviles, jugador);
    const por = new Map(moviles.map((h) => [h.id, h]));
    for (const id of ['h-1', 'h-2']) assert.deepEqual([por.get(id).fase, d.espacioEn[por.get(id).y][por.get(id).x]], ['pasea', cocina]);
    assert.equal(d.espacioEn[por.get('h-3').y][por.get('h-3').x], oficina);
    for (const id of ['h-4', 'h-5']) assert.equal(por.get(id).fase, 'fuera');
    assert.equal(ocupadasPorHabitantes(moviles).size, IDS.length - 2);
    assert.ok(moviles.slice(5).every((h) => h.fase === 'pasea' && mismoObjetivo(h.objetivo, LIBRE)));
  }
});

test('AC-3.10, AC-6.3: si su espacio está lleno, el familiar espera en la casilla libre más cercana y entra cuando se libera una', () => {
  const ctx = crearCtx();
  const estado = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx); // baño interno de 4 casillas en "Dormitorio 1"
  const d = generarDistribucion(estado);
  const bano = banoDe(estado, espaciosDeTipo(estado, 'dormitorio')[0].id).id;
  const jugador = { ...d.aparicion, desde: null };
  const ids = IDS.slice(0, 6);
  const objetivos = new Map(ids.map((id) => [id, { tipo: 'espacio', espacioId: bano }]));
  const colocados = colocarHabitantes(ids, d, jugador, azarReproducible(3), objetivos);
  const enBano = (h) => d.espacioEn[h.y][h.x] === bano;
  assert.equal(colocados.filter(enBano).length, 4);
  const esperan = colocados.filter((h) => !enBano(h));
  assert.deepEqual(esperan.map((h) => h.fase), ['planifica', 'planifica']);
  const otraVez = colocarHabitantes(ids, d, jugador, azarReproducible(4), objetivos).filter((h) => !enBano(h));
  assert.deepEqual(otraVez.map((h) => [h.x, h.y]), esperan.map((h) => [h.x, h.y])); // las casillas de espera no dependen del azar
  verificarInvariantes(d, colocados, jugador);
  let { moviles } = hasta(d, colocados, jugador, () => false, 5000);
  assert.equal(moviles.filter(enBano).length, 4); // mientras el baño siga lleno, nadie más entra
  assert.ok(moviles.filter((h) => !enBano(h)).every((h) => h.fase === 'planifica'));
  // quien está junto a la única salida del baño pasa a estar libre y sale; entonces entra uno de los que esperaban
  const [salida] = casillasDe(d, bano);
  const sale = moviles.find((h) => h.x === salida.x && h.y === salida.y).id;
  moviles = fijarObjetivos(moviles, new Map([...objetivos, [sale, LIBRE]]));
  ({ moviles } = hasta(d, moviles, jugador, (ms) => ms.filter((h) => h.id !== sale && h.fase === 'pasea' && enBano(h)).length === 4, 60000));
  assert.equal(moviles.filter((h) => h.id !== sale && enBano(h)).length, 4);
});

test('AC-3.1, AC-3.2, AC-3.3, AC-3.8, AC-3.12: con un bloque en un espacio, va por el camino más corto, llega a tiempo y no sale de él', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  for (const espacio of espaciosActivos(estado)) {
    const inicio = movil('h-1', d.aparicion.x - 2, d.aparicion.y); // en la sala
    const objetivo = new Map([['h-1', { tipo: 'espacio', espacioId: espacio.id }]]);
    const largo = rutaMasCorta(d, inicio, (x, y) => d.espacioEn[y][x] === espacio.id).length;
    const llego = ([h]) => h.fase === 'pasea' && d.espacioEn[h.y][h.x] === espacio.id;
    let { moviles, t } = hasta(d, fijarObjetivos([inicio], objetivo), enCocina1, llego);
    assert.ok(llego(moviles), `no llegó a ${espacio.tipo}`);
    assert.ok(t <= (largo + 1) * MS_POR_PASO, `${espacio.tipo}: tardó ${t} ms para ${largo} casillas`);
    ({ moviles } = hasta(d, moviles, enCocina1, ([h]) => d.espacioEn[h.y][h.x] !== espacio.id, 60000, azarReproducible(5)));
    assert.equal(d.espacioEn[moviles[0].y][moviles[0].x], espacio.id, `${espacio.tipo}: salió de su espacio`);
  }
});

test('AC-3.7: al cambiar el objetivo cancela la pausa o el tramo, termina el paso empezado y sigue su ruta', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const cocina = espaciosDeTipo(estado, 'cocina')[0].id;
  const objetivo = new Map([['h-1', { tipo: 'espacio', espacioId: cocina }]]);
  const x = d.aparicion.x - 2;
  const { y } = d.aparicion;
  const [enPausa] = fijarObjetivos([movil('h-1', x, y, { pausaMs: 3000 })], objetivo);
  assert.deepEqual([enPausa.pausaMs, enPausa.fase], [0, 'planifica']);
  const [conTramo] = avanzarHabitantes([movil('h-1', x, y, { tramo: 5, direccion: 'derecha' })], d, enCocina1, 0, azarReproducible(1));
  assert.deepEqual([conTramo.x, conTramo.desde, conTramo.progresoMs], [x + 1, { x, y }, MS_POR_PASO]); // empezó un paso
  const [cambiado] = fijarObjetivos([conTramo], objetivo);
  assert.deepEqual([cambiado.tramo, cambiado.direccion, cambiado.x, cambiado.progresoMs], [0, null, x + 1, MS_POR_PASO]);
  const largo = rutaMasCorta(d, cambiado, (cx, cy) => d.espacioEn[cy][cx] === cocina).length;
  const { moviles, t } = hasta(d, [cambiado], enCocina1, ([h]) => h.fase === 'pasea' && d.espacioEn[h.y][h.x] === cocina);
  assert.equal(moviles[0].fase, 'pasea');
  assert.ok(t <= (largo + 1) * MS_POR_PASO, `tardó ${t} ms para ${largo} casillas más el paso empezado`);
});

test('AC-4.1, AC-4.2, AC-4.8: con un bloque fuera de casa camina hasta la entrada, desaparece y deja de ocupar casillas', () => {
  const d = generarDistribucion(hogarMasGrande());
  const fuera = new Map([['h-1', { tipo: 'fuera' }]]);
  const inicio = movil('h-1', d.aparicion.x - 2, d.aparicion.y);
  const quieto = movil('h-2', d.aparicion.x + 2, d.aparicion.y, { pausaMs: 999999 });
  const largo = rutaMasCorta(d, inicio, (x, y) => x === d.entrada.x && y === d.entrada.y).length;
  const { moviles, t } = hasta(d, fijarObjetivos([inicio, quieto], fuera), enCocina1, ([h]) => h.fase === 'fuera');
  assert.equal(moviles[0].fase, 'fuera');
  assert.ok(t <= (largo + 1) * MS_POR_PASO, `tardó ${t} ms para ${largo} casillas`);
  assert.deepEqual([...ocupadasPorHabitantes(moviles)], [claveCasilla(quieto.x, quieto.y)]);
  assert.equal(paso(d, { x: d.entrada.x, y: d.entrada.y - 1 }, 'abajo', ocupadasPorHabitantes(moviles)).movio, true);
  const [yaEnEntrada] = avanzarHabitantes(
    fijarObjetivos([movil('h-3', d.entrada.x, d.entrada.y)], new Map([['h-3', { tipo: 'fuera' }]])), d, enCocina1, 50, azarReproducible(1),
  );
  assert.deepEqual([yaEnEntrada.fase, yaEnEntrada.x, yaEnEntrada.y, yaEnEntrada.desde], ['fuera', d.entrada.x, d.entrada.y, null]);
});

test('AC-4.3, AC-4.4, AC-4.5: al terminar la salida reaparece en la entrada y va a su siguiente lugar; si la salida sigue, no reaparece', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const oficina = espaciosDeTipo(estado, 'oficina')[0].id;
  const fuera = new Map([['h-1', { tipo: 'fuera' }], ['h-2', { tipo: 'fuera' }]]);
  let moviles = fijarObjetivos(colocarHabitantes(['h-1', 'h-2'], d, enCocina1, azarReproducible(2), fuera), fuera); // otro bloque fuera seguido
  ({ moviles } = hasta(d, moviles, enCocina1, () => false, 2000));
  assert.deepEqual(moviles.map((h) => h.fase), ['fuera', 'fuera']);
  moviles = fijarObjetivos(moviles, new Map([['h-1', { tipo: 'espacio', espacioId: oficina }]])); // h-2 queda sin bloque
  moviles = avanzarHabitantes(moviles, d, enCocina1, 50, azarReproducible(1));
  assert.deepEqual([moviles[0].fase, moviles[0].x, moviles[0].y], ['planifica', d.entrada.x, d.entrada.y]);
  assert.equal(moviles[1].fase, 'fuera'); // la entrada está ocupada: espera fuera del mapa (AC-4.6)
  ({ moviles } = hasta(d, moviles, enCocina1, ([a, b]) => a.fase === 'pasea' && d.espacioEn[a.y][a.x] === oficina && b.fase === 'pasea', 60000));
  assert.equal(d.espacioEn[moviles[0].y][moviles[0].x], oficina);
  assert.equal(moviles[1].fase, 'pasea');
});

test('AC-4.6, AC-6.8: si el jugador está en la entrada, quien vuelve espera fuera del mapa y aparece cuando se libera', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const enEntrada = { x: d.entrada.x, y: d.entrada.y, desde: null };
  let moviles = fijarObjetivos([movil('h-1', d.entrada.x, d.entrada.y, { fase: 'fuera', objetivo: { tipo: 'fuera' } })], new Map());
  assert.equal(moviles[0].fase, 'fuera');
  ({ moviles } = hasta(d, moviles, enEntrada, () => false, 3000));
  assert.equal(moviles[0].fase, 'fuera');
  moviles = avanzarHabitantes(moviles, d, { x: d.entrada.x, y: d.entrada.y - 1, desde: null }, 50, azarReproducible(1));
  assert.deepEqual([moviles[0].fase, moviles[0].x, moviles[0].y], ['planifica', d.entrada.x, d.entrada.y]);
});

test('AC-8.1: dos familiares en ruta que se cruzan en un pasillo de una casilla llegan ambos a tiempo, sin bloquearse', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const jugador = { x: 27, y: 2, desde: null }; // en un dormitorio, lejos del pasillo izquierdo
  const cocina1 = espaciosDeTipo(estado, 'cocina')[0].id;
  const mascota2 = espaciosDeTipo(estado, 'mascota')[1].id;
  const [ca] = casillasDe(d, cocina1);
  const [cb] = casillasDe(d, mascota2);
  const objetivos = new Map([['h-1', { tipo: 'espacio', espacioId: mascota2 }], ['h-2', { tipo: 'espacio', espacioId: cocina1 }]]);
  const largos = [
    rutaMasCorta(d, ca, (x, y) => d.espacioEn[y][x] === mascota2).length,
    rutaMasCorta(d, cb, (x, y) => d.espacioEn[y][x] === cocina1).length,
  ];
  let moviles = fijarObjetivos([movil('h-1', ca.x, ca.y), movil('h-2', cb.x, cb.y)], objetivos);
  const llegadas = [null, null];
  let ambosEnPasillo = false;
  const azar = azarReproducible(1);
  for (let t = 50; t <= 60000 && llegadas.includes(null); t += 50) {
    moviles = avanzarHabitantes(moviles, d, jugador, 50, azar);
    verificarInvariantes(d, moviles, jugador);
    if (moviles.every((h) => d.espacioEn[h.y][h.x] === 'pasillo:izq')) ambosEnPasillo = true;
    moviles.forEach((h, i) => { if (llegadas[i] === null && h.fase === 'pasea') llegadas[i] = t; });
  }
  assert.ok(ambosEnPasillo, 'deberían cruzarse en el pasillo');
  llegadas.forEach((t, i) => assert.ok(t !== null && t <= (largos[i] + 1) * MS_POR_PASO, `h-${i + 1}: ${t} ms para ${largos[i]} casillas`));
});

test('AC-8.2: quien va en ruta pasa por la casilla de quien pasea; quien pasea no entra en la de quien va en ruta', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: 1, y: 8, desde: null };
  // fila 3 de la sala: (12,3) tiene un sofá arriba y una mesa abajo
  const enRuta = movil('h-1', 11, 3, { fase: 'ruta', ruta: [{ x: 12, y: 3 }, { x: 13, y: 3 }, { x: 14, y: 3 }] });
  const paseando = movil('h-2', 12, 3, { pausaMs: 5000 });
  const [r, w] = avanzarHabitantes([enRuta, paseando], d, jugador, 0, azarReproducible(1));
  assert.deepEqual([r.x, r.y, r.desde], [12, 3, { x: 11, y: 3 }]);
  assert.deepEqual([w.x, w.y], [12, 3]);
  verificarInvariantes(d, [r, w], jugador);
  const [, w2] = avanzarHabitantes([
    movil('h-1', 12, 3, { fase: 'ruta', ruta: [{ x: 11, y: 3 }] }),
    movil('h-2', 13, 3, { tramo: 1, direccion: 'izquierda' }),
  ], d, jugador, 0, azarReproducible(1));
  assert.deepEqual([w2.x, w2.y, w2.tramo], [13, 3, 0]);
  assert.ok(w2.pausaMs >= PAUSA_MIN_MS);
});

test('AC-8.3, AC-8.4: quien va en ruta espera si el jugador le cierra el paso y sigue cuando se aparta; el jugador no lo atraviesa', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const enRuta = movil('h-1', 11, 3, { fase: 'ruta', ruta: [{ x: 12, y: 3 }, { x: 13, y: 3 }] });
  for (const jugador of [{ x: 12, y: 3, desde: null }, { x: 13, y: 3, desde: { x: 12, y: 3 } }]) {
    let [h] = avanzarHabitantes([enRuta], d, jugador, 50, azarReproducible(1));
    assert.deepEqual([h.x, h.y, h.fase, h.ruta.length], [11, 3, 'ruta', 2]);
    [h] = avanzarHabitantes([h], d, jugador, 1000, azarReproducible(1));
    assert.deepEqual([h.x, h.y], [11, 3]);
  }
  const [h] = avanzarHabitantes([enRuta], d, { x: 1, y: 8, desde: null }, 50, azarReproducible(1));
  assert.deepEqual([h.x, h.y], [12, 3]);
  assert.equal(paso(d, { x: 13, y: 3 }, 'izquierda', ocupadasPorHabitantes([h])).movio, false);
});

test('AC-3.9: si llega a una casilla de su espacio ocupada por otro, sigue hasta una libre del espacio', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0].id;
  const llega = movil('h-1', 8, 2, { objetivo: { tipo: 'espacio', espacioId: cocina }, fase: 'ruta', ruta: [{ x: 7, y: 2 }, { x: 6, y: 2 }] });
  const quieto = movil('h-2', 6, 2, { pausaMs: 999999 });
  const { moviles } = hasta(d, [llega, quieto], { x: 13, y: 8, desde: null }, ([a]) => a.fase === 'pasea', 5000);
  const [a, b] = moviles;
  assert.equal(a.fase, 'pasea');
  assert.equal(d.espacioEn[a.y][a.x], cocina);
  assert.notDeepEqual([a.x, a.y], [b.x, b.y]);
  assert.deepEqual([b.x, b.y], [6, 2]);
});

test('AC-8.5, Reliability: con objetivos que cambian, quien pasea nunca comparte casilla, nadie pisa al jugador ni una pared, y casi todos cumplen su rutina', () => {
  const estado = hogarMasGrande();
  const d = generarDistribucion(estado);
  const azar = azarReproducible(41);
  const sorteo = azarReproducible(42);
  const espacios = espaciosActivos(estado).map((x) => x.id);
  const familiaresIds = IDS.slice(0, 8); // IDS.slice(8) hacen de mascotas: siempre libres
  const sortear = () => new Map(familiaresIds.map((id) => {
    const n = sorteo();
    if (n < 0.2) return [id, LIBRE];
    if (n < 0.4) return [id, { tipo: 'fuera' }];
    return [id, { tipo: 'espacio', espacioId: espacios[Math.floor(sorteo() * espacios.length)] }];
  }));
  const cumple = (h, objetivo) => (objetivo.tipo === 'fuera' ? h.fase === 'fuera'
    : h.fase === 'pasea' && (objetivo.tipo === 'libre' || d.espacioEn[h.y][h.x] === objetivo.espacioId));
  let objetivos = sortear();
  let revisados = 0;
  let cumplidos = 0;
  const fases = new Set();
  simular(d, colocarHabitantes(IDS, d, d.aparicion, azar, objetivos), d.aparicion, 400000, azar, (moviles, t) => {
    for (const h of moviles) fases.add(h.fase);
    if (t === 0 || t % 40000 !== 0) return undefined;
    for (const h of moviles.slice(0, 8)) {
      revisados++;
      if (cumple(h, objetivos.get(h.id))) cumplidos++;
    }
    objetivos = sortear();
    return fijarObjetivos(moviles, objetivos);
  });
  for (const fase of ['fuera', 'pasea', 'ruta']) assert.ok(fases.has(fase), `nunca hubo nadie en fase ${fase}`);
  assert.ok(cumplidos / revisados >= 0.9, `${cumplidos} de ${revisados} cumplían su rutina`);
});

test('AC-6.4, AC-6.6, AC-6.7: en modo edición quien está fuera sigue fuera y no se reubica; los demás quedan quietos con su objetivo', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { ...d.aparicion, desde: null };
  const cocina = { tipo: 'espacio', espacioId: 'cocina-x' };
  const fuera = movil('h-1', d.entrada.x, d.entrada.y, { fase: 'fuera', objetivo: { tipo: 'fuera' } });
  const enRuta = movil('h-2', 11, 3, { objetivo: cocina, fase: 'ruta', ruta: [{ x: 10, y: 3 }], desde: { x: 12, y: 3 }, progresoMs: 200 });
  assert.deepEqual(congelarHabitantes([fuera, enRuta]), [fuera, movil('h-2', 11, 3, { objetivo: cocina, fase: 'planifica' })]);
  const despues = sincronizarHabitantes([fuera, movil('h-3', jugador.x, jugador.y)], ['h-1', 'h-3', 'h-4'], d, jugador, azarReproducible(2));
  assert.deepEqual(despues.map((h) => h.id), ['h-1', 'h-3', 'h-4']);
  assert.equal(despues[0], fuera);
  assert.notDeepEqual([despues[1].x, despues[1].y], [jugador.x, jugador.y]);
  assert.deepEqual([despues[2].fase, despues[2].objetivo], ['pasea', LIBRE]); // un familiar nuevo aún no tiene rutina
  verificarInvariantes(d, despues, jugador);
});

test('AC-3.4, AC-3.6: fijarObjetivos solo cambia a quien tiene un objetivo nuevo; mascotas y familiares sin cambios siguen igual', () => {
  const mascota = movil('h-1', 10, 3, { pausaMs: 1500, tramo: 2, direccion: 'derecha' });
  const enSuEspacio = movil('h-2', 12, 3, { objetivo: { tipo: 'espacio', espacioId: 'x' } });
  const despues = fijarObjetivos([mascota, enSuEspacio], new Map([['h-2', { tipo: 'espacio', espacioId: 'x' }]]));
  assert.equal(despues[0], mascota);
  assert.equal(despues[1], enSuEspacio);
  assert.equal(mismoObjetivo({ tipo: 'espacio', espacioId: 'x' }, { tipo: 'espacio', espacioId: 'y' }), false);
  assert.equal(mismoObjetivo({ tipo: 'fuera' }, { tipo: 'fuera' }), true);
  const [libre] = fijarObjetivos([enSuEspacio], new Map());
  assert.deepEqual([libre.objetivo, libre.fase], [LIBRE, 'planifica']);
});
```

- [ ] Run: `cd poc && node --test test/rutas.test.js test/movimiento.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/rutas.js`)
- [ ] Crear `src/rutas.js`:
```js
// src/rutas.js
// Rutas sobre el mapa (ADR-004 de movimiento): búsqueda en anchura sobre las casillas transitables de la distribución, sin tener
// en cuenta a los personajes. Pura y determinista: explora las direcciones siempre en el mismo orden.
import { esTransitable } from './distribucion.js';
import { DIRECCIONES, claveCasilla } from './posicion.js';

const ORDEN = ['arriba', 'abajo', 'izquierda', 'derecha'];

// Camino más corto desde `desde` hasta la casilla más cercana que cumple `esDestino(x, y)`: la lista de casillas que hay que
// pisar, en orden y sin la de partida. Devuelve [] si `desde` ya es un destino y null si no hay ninguno alcanzable.
export function rutaMasCorta(distribucion, desde, esDestino) {
  if (esDestino(desde.x, desde.y)) return [];
  const previa = new Map([[claveCasilla(desde.x, desde.y), null]]);
  const cola = [{ x: desde.x, y: desde.y }];
  for (let i = 0; i < cola.length; i++) {
    const actual = cola[i];
    for (const direccion of ORDEN) {
      const x = actual.x + DIRECCIONES[direccion].dx;
      const y = actual.y + DIRECCIONES[direccion].dy;
      const clave = claveCasilla(x, y);
      if (previa.has(clave) || !esTransitable(distribucion, x, y)) continue;
      previa.set(clave, actual);
      if (esDestino(x, y)) return reconstruir(previa, { x, y });
      cola.push({ x, y });
    }
  }
  return null;
}

function reconstruir(previa, fin) {
  const camino = [];
  for (let c = fin; previa.get(claveCasilla(c.x, c.y)) !== null; c = previa.get(claveCasilla(c.x, c.y))) camino.push(c);
  return camino.reverse();
}

// Casillas transitables de un espacio, en orden de lectura (fila a fila); incluye sus puertas.
export function casillasDe(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const casillas = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (distribucion.espacioEn[y][x] === espacioId && esTransitable(distribucion, x, y)) casillas.push({ x, y });
    }
  }
  return casillas;
}
```
- [ ] Reemplazar `src/movimiento.js` completo por:
```js
// src/movimiento.js
// Movimiento autónomo de los habitantes (ADR-002 de movimiento, ampliado por el ADR-004 de movimiento hacia un objetivo):
// lógica pura; el azar se inyecta y el motor solo anima.
import { esTransitable } from './distribucion.js';
import { DIRECCIONES, claveCasilla } from './posicion.js';
import { rutaMasCorta, casillasDe } from './rutas.js';

export const MS_POR_PASO = 500; // 2 casillas por segundo (AC-4.2 de la 002)
export const PAUSA_MIN_MS = 1000;
export const PAUSA_MAX_MS = 4000;
export const TRAMO_MIN = 1;
export const TRAMO_MAX = 6;
export const ESPERA_MS = 1000; // quien encuentra su espacio lleno vuelve a intentarlo cada segundo (AC-3.10 de la 004)

const ORDEN_DIRECCIONES = ['arriba', 'abajo', 'izquierda', 'derecha'];
const LIBRE = { tipo: 'libre' };
const enteroEntre = (min, max, azar) => min + Math.floor(azar() * (max - min + 1));
const pausaAleatoria = (azar) => enteroEntre(PAUSA_MIN_MS, PAUSA_MAX_MS, azar);

// Dos objetivos son el mismo si coinciden su tipo y, si son un espacio, el espacio.
export const mismoObjetivo = (a, b) => a.tipo === b.tipo && (a.tipo !== 'espacio' || a.espacioId === b.espacioId);

// Estado de sesión de un habitante (no se guarda). (x, y) es la casilla que ocupa o a la que se dirige; mientras progresoMs > 0
// también ocupa `desde`. `objetivo` es { tipo: 'libre' }, { tipo: 'fuera' } o { tipo: 'espacio', espacioId } (ADR-004).
// `fase` dice qué hace: 'pasea' (al azar; dentro de su espacio si su objetivo es uno), 'planifica' (decide su ruta; si tiene
// pausa, espera), 'ruta' (pisa en orden las casillas de `ruta`) o 'fuera' (salió por la entrada y no está en el mapa).
const nuevoMovil = (id, x, y, objetivo = LIBRE, fase = 'pasea') => ({
  id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null, objetivo, fase, ruta: [],
});

// Casillas que ocupan los habitantes en el mapa: la suya y, mientras caminan, también la de origen. Quien está fuera de casa no
// ocupa ninguna (AC-4.2 de la 004).
export function ocupadasPorHabitantes(moviles) {
  const ocupadas = new Set();
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    ocupadas.add(claveCasilla(h.x, h.y));
    if (h.desde) ocupadas.add(claveCasilla(h.desde.x, h.desde.y));
  }
  return ocupadas;
}

// Casillas del jugador: la que ocupa y, mientras da un paso, la de origen (AC-5.2 de la 002).
export function ocupadasPorJugador(jugador) {
  const ocupadas = new Set([claveCasilla(jugador.x, jugador.y)]);
  if (jugador.desde) ocupadas.add(claveCasilla(jugador.desde.x, jugador.desde.y));
  return ocupadas;
}

function casillasLibres(distribucion, ocupadas) {
  const libres = [];
  for (let y = 0; y < distribucion.alto; y++) for (let x = 0; x < distribucion.ancho; x++) {
    if (esTransitable(distribucion, x, y) && !ocupadas.has(claveCasilla(x, y))) libres.push({ x, y });
  }
  return libres;
}

// Saca una casilla al azar de la lista (la quita para que no se repita).
const tomarAlAzar = (libres, azar) => libres.splice(Math.floor(azar() * libres.length), 1)[0];

// Saca de `libres` la más cercana, por camino, a la primera casilla de un espacio lleno (AC-6.3 de la 004): siempre la misma para
// el mismo mapa y las mismas casillas ocupadas.
function tomarMasCercana(libres, distribucion, espacioId) {
  const claves = new Set(libres.map((c) => claveCasilla(c.x, c.y)));
  const [origen] = casillasDe(distribucion, espacioId);
  const destino = rutaMasCorta(distribucion, origen, (x, y) => claves.has(claveCasilla(x, y))).at(-1);
  return libres.splice(libres.findIndex((c) => c.x === destino.x && c.y === destino.y), 1)[0];
}

// Coloca a cada habitante, quieto, después del jugador (FR-7 de la 002, FR-6 de la 004): quien tiene objetivo de espacio, en una
// casilla libre de ese espacio elegida al azar (o en la libre más cercana si está lleno); quien está fuera, fuera del mapa; el resto,
// en cualquier casilla transitable libre al azar. Nunca en la casilla de otro ni en las del jugador.
export function colocarHabitantes(ids, distribucion, jugador, azar, objetivos = new Map()) {
  const libres = casillasLibres(distribucion, ocupadasPorJugador(jugador));
  return ids.map((id) => {
    const objetivo = objetivos.get(id) ?? LIBRE;
    if (objetivo.tipo === 'fuera') return nuevoMovil(id, distribucion.entrada.x, distribucion.entrada.y, objetivo, 'fuera');
    if (objetivo.tipo === 'espacio') {
      const dentro = libres.filter((c) => distribucion.espacioEn[c.y][c.x] === objetivo.espacioId);
      if (dentro.length === 0) {
        const c = tomarMasCercana(libres, distribucion, objetivo.espacioId);
        return nuevoMovil(id, c.x, c.y, objetivo, 'planifica');
      }
      const elegida = dentro[Math.floor(azar() * dentro.length)];
      libres.splice(libres.indexOf(elegida), 1);
      return nuevoMovil(id, elegida.x, elegida.y, objetivo);
    }
    const c = tomarAlAzar(libres, azar);
    return nuevoMovil(id, c.x, c.y, objetivo);
  });
}

// Al entrar al modo edición (AC-7.2 de la 002, AC-6.4 de la 004): cada habitante queda quieto en la casilla a la que se dirigía,
// con su objetivo; quien está fuera sigue fuera.
export const congelarHabitantes = (moviles) => moviles.map((h) => nuevoMovil(h.id, h.x, h.y, h.objetivo,
  h.fase === 'fuera' ? 'fuera' : (h.objetivo.tipo === 'libre' ? 'pasea' : 'planifica')));

// Tras un cambio del modo edición (FR-7 de la 002): conserva a los que siguen, quita a los eliminados, coloca a los nuevos en
// casillas libres al azar y reubica solo a los que quedaron en una casilla inválida u ocupada. Quien está fuera no se toca
// (AC-6.7 de la 004).
export function sincronizarHabitantes(moviles, ids, distribucion, jugador, azar) {
  const ocupadas = ocupadasPorJugador(jugador);
  const conservados = new Map();
  for (const h of moviles) {
    if (!ids.includes(h.id)) continue;
    if (h.fase === 'fuera') { conservados.set(h.id, h); continue; }
    const clave = claveCasilla(h.x, h.y);
    if (esTransitable(distribucion, h.x, h.y) && !ocupadas.has(clave)) {
      ocupadas.add(clave);
      conservados.set(h.id, h);
    }
  }
  const libres = casillasLibres(distribucion, ocupadas);
  return ids.map((id) => {
    if (conservados.has(id)) return conservados.get(id);
    const c = tomarAlAzar(libres, azar);
    return nuevoMovil(id, c.x, c.y);
  });
}

// Al cambiar el minuto (FR-3 de la 004): quien tiene un objetivo nuevo cancela su pausa o su tramo, termina el paso que ya empezó
// y planifica su ruta (AC-3.7); quien está fuera sigue fuera hasta reaparecer. Los demás, mascotas incluidas, no cambian.
export function fijarObjetivos(moviles, objetivos) {
  return moviles.map((h) => {
    const objetivo = objetivos.get(h.id) ?? LIBRE;
    if (mismoObjetivo(h.objetivo, objetivo)) return h;
    return { ...h, objetivo, fase: h.fase === 'fuera' ? 'fuera' : 'planifica', ruta: [], pausaMs: 0, tramo: 0, direccion: null };
  });
}

// Avanza `dtMs` milisegundos el movimiento de todos los habitantes (FR-5 de la 002; FR-3, FR-4 y FR-7 de la 004). Pura: devuelve
// un arreglo nuevo. Se procesan en orden con un único conteo de casillas ocupadas: quien pasea nunca elige una casilla ocupada
// (AC-4.5 de la 002) y quien va en ruta solo evita las del jugador (ADR-004). Si un paso termina y el habitante sigue caminando,
// el siguiente empieza en la misma llamada con el tiempo que sobró del cuadro, para que los pasos promedien 500 ms sin importar
// los cuadros por segundo (AC-4.2 de la 002, AC-3.8 de la 004).
export function avanzarHabitantes(moviles, distribucion, jugador, dtMs, azar) {
  const ocupadas = new Map(); // casilla → cuántos habitantes la ocupan (en ruta pueden compartirla)
  const esperan = new Map(); // casillas de quienes esperan a que se libere su espacio: no bloquean a quien pasea (ruling del plan)
  const sumar = (mapa, x, y) => { const k = claveCasilla(x, y); mapa.set(k, (mapa.get(k) ?? 0) + 1); };
  const restar = (mapa, x, y) => {
    const k = claveCasilla(x, y);
    const n = (mapa.get(k) ?? 0) - 1;
    if (n > 0) mapa.set(k, n); else mapa.delete(k);
  };
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    sumar(ocupadas, h.x, h.y);
    if (h.desde) sumar(ocupadas, h.desde.x, h.desde.y);
    if (h.fase === 'planifica' && h.pausaMs > 0 && h.progresoMs === 0) sumar(esperan, h.x, h.y);
  }
  const delJugador = ocupadasPorJugador(jugador);
  const esDelJugador = (x, y) => delJugador.has(claveCasilla(x, y));
  const ocupada = (x, y) => ocupadas.has(claveCasilla(x, y)) || esDelJugador(x, y);
  const bloquea = (x, y) => esDelJugador(x, y) || (ocupadas.get(claveCasilla(x, y)) ?? 0) > (esperan.get(claveCasilla(x, y)) ?? 0);
  const { entrada } = distribucion;
  const enEntrada = (x, y) => x === entrada.x && y === entrada.y;

  // Paseo al azar del ADR-002: alterna pausas y tramos; con objetivo de espacio, solo por casillas de ese espacio (AC-3.2).
  const pasear = (h, sobranteMs) => {
    const propio = h.objetivo.tipo === 'espacio' ? h.objetivo.espacioId : null;
    const libre = (x, y) => esTransitable(distribucion, x, y) && !bloquea(x, y)
      && (propio === null || distribucion.espacioEn[y][x] === propio);
    let { tramo, direccion } = h;
    if (tramo === 0) {
      const opciones = ORDEN_DIRECCIONES.filter((d) => libre(h.x + DIRECCIONES[d].dx, h.y + DIRECCIONES[d].dy));
      if (opciones.length === 0) return { ...h, pausaMs: pausaAleatoria(azar) };
      direccion = opciones[Math.floor(azar() * opciones.length)];
      tramo = enteroEntre(TRAMO_MIN, TRAMO_MAX, azar);
    }
    const x = h.x + DIRECCIONES[direccion].dx;
    const y = h.y + DIRECCIONES[direccion].dy;
    if (!libre(x, y)) return { ...h, tramo: 0, direccion: null, pausaMs: pausaAleatoria(azar) }; // obstáculo: termina el tramo
    sumar(ocupadas, x, y);
    const restante = tramo - 1;
    return {
      ...h, x, y, desde: { x: h.x, y: h.y }, progresoMs: Math.max(1, MS_POR_PASO - sobranteMs),
      tramo: restante, direccion: restante > 0 ? direccion : null, pausaMs: restante > 0 ? 0 : pausaAleatoria(azar),
    };
  };

  // Sigue su ruta (AC-3.1, AC-8.1, AC-8.3): puede pisar la casilla de otro habitante, pero espera al jugador.
  const seguirRuta = (h, sobranteMs) => {
    const [siguiente, ...resto] = h.ruta;
    if (esDelJugador(siguiente.x, siguiente.y)) return h;
    sumar(ocupadas, siguiente.x, siguiente.y);
    return { ...h, x: siguiente.x, y: siguiente.y, desde: { x: h.x, y: h.y }, progresoMs: Math.max(1, MS_POR_PASO - sobranteMs), ruta: resto };
  };

  // Decide qué hace quien no tiene ruta (ADR-004): sale si está en la entrada; si no, va a ella; con objetivo de espacio (o libre),
  // se queda si ya está en una casilla propia sin compartir (AC-3.3, AC-3.4) o va a la libre más cercana (AC-3.9); si no hay
  // ninguna, espera (AC-3.10). Quien termina una ruta en una casilla compartida se aparta a una libre.
  const planificar = (h) => {
    if (h.objetivo.tipo === 'fuera') {
      if (enEntrada(h.x, h.y)) { restar(ocupadas, h.x, h.y); return { ...h, fase: 'fuera', ruta: [] }; } // AC-4.1, AC-4.8
      return { ...h, fase: 'ruta', ruta: rutaMasCorta(distribucion, h, enEntrada) };
    }
    const propio = h.objetivo.tipo === 'espacio' ? h.objetivo.espacioId : null;
    const dentro = (x, y) => propio === null || distribucion.espacioEn[y][x] === propio;
    const compartida = (ocupadas.get(claveCasilla(h.x, h.y)) ?? 0) > 1;
    if (dentro(h.x, h.y) && !compartida) return { ...h, fase: 'pasea', ruta: [] };
    const hacia = rutaMasCorta(distribucion, h, (x, y) => dentro(x, y) && !ocupada(x, y))
      ?? (compartida ? rutaMasCorta(distribucion, h, (x, y) => !ocupada(x, y)) : null);
    if (hacia && hacia.length > 0) return { ...h, fase: 'ruta', ruta: hacia };
    return { ...h, fase: 'planifica', pausaMs: ESPERA_MS };
  };

  // Quien está fuera reaparece en la entrada cuando su objetivo deja de ser 'fuera' y la entrada está libre (AC-4.3, AC-4.6).
  const reaparecer = (h) => {
    if (h.objetivo.tipo === 'fuera' || ocupada(entrada.x, entrada.y)) return h;
    sumar(ocupadas, entrada.x, entrada.y);
    return nuevoMovil(h.id, entrada.x, entrada.y, h.objetivo, 'planifica');
  };

  return moviles.map((original) => {
    let h = original;
    let sobranteMs = 0;
    if (h.fase === 'fuera') return reaparecer(h);
    if (h.progresoMs > 0) {
      const restanteMs = h.progresoMs - dtMs;
      if (restanteMs > 0) return { ...h, progresoMs: restanteMs };
      restar(ocupadas, h.desde.x, h.desde.y); // llegó: libera la casilla de origen
      h = { ...h, progresoMs: 0, desde: null };
      sobranteMs = -restanteMs;
      if (h.fase === 'ruta' && h.ruta.length === 0) h = { ...h, fase: 'planifica' }; // terminó su ruta: decide si llegó
      else if (h.fase === 'pasea' && h.tramo === 0) return h; // fin del tramo: sigue la pausa que se sorteó al iniciar el último paso
    } else if (h.pausaMs > 0) {
      return { ...h, pausaMs: Math.max(0, h.pausaMs - dtMs) };
    }
    if (h.fase === 'planifica') {
      h = planificar(h);
      if (h.fase === 'fuera' || h.fase === 'planifica') return h;
    }
    if (h.fase === 'ruta') return seguirRuta(h, sobranteMs);
    return pasear(h, sobranteMs);
  });
}
```
- [ ] Run: `cd poc && node --test test/rutas.test.js test/movimiento.test.js test/contrato-rutinas.test.js` — expect: PASS (`# pass 39`, `# fail 0`: 3 de rutas, 32 de movimiento y 4 de contrato)
- [ ] Run: `cd poc && npm test` — expect: PASS (`# pass 201`, `# fail 0`; incluye ya la prueba de contrato de la Fase 0)
- [ ] Commit: `feat(poc): walk relatives to their routine goal along shortest routes` (cuerpo: `Plan section: Phase 6: Rutas y movimiento hacia un objetivo` y `Feature: 004-rutinas`)

---

## Phase 7: Presentación: rutina, entrada, cartel y familiares que siguen su horario

**Implements:** FR-3, FR-4, FR-5, FR-6, FR-7 (dibujo), FR-8, FR-9 (confirmaciones), NFR Security, Usability y Performance (cableado) | **Satisfies:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.10, AC-1.12, AC-2.1, AC-2.5, AC-2.7, AC-4.7, AC-5.1 a AC-5.15, AC-6.2, AC-6.4, AC-6.5, AC-7.6, AC-7.7, AC-7.8, AC-7.9, AC-8.6, AC-8.7, AC-10.1, AC-10.2, AC-10.6 a AC-10.9, AC-10.11, AC-11.2, y la parte visible de los AC de las Stories 3, 4 y 9
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: todo lo producido en las Fases 1 a 6 (nombres exactos en sus líneas Interfaces) y el global `Phaser` (3.80.1). Produces: la aplicación con rutinas; ningún contrato nuevo.

Capa de presentación delgada: toda regla vive en los módulos puros. `juego.js` guarda `ahora` (fecha y minuto locales). En exploración lo compara en cada cuadro y, al cambiar el minuto, llama a `fijarObjetivos`; en edición queda congelado. Los familiares fuera se ocultan, el cartel se redibuja cuando cambia quién está fuera, y los cambios de rutina se guardan al aplicarse pero solo mueven a alguien al tocar "Listo". Los textos del usuario se insertan con `textContent` o `new Option`. El contenedor de la cruceta deja de capturar los toques en sus huecos: en la validación del plan, con el personaje en la casilla de aparición del hogar inicial, el cartel quedaba debajo de esos huecos y no se podía tocar.

> **Complexity note:** Gate: Integration-First (pruebas antes del código). Violation: la capa de presentación no tiene pruebas automáticas, igual que en las features 001 a 003. Justification: depende del motor de la PoC, que es desechable. Las reglas de la spec quedaron en módulos puros probados en las Fases 1 a 6, y esta capa se verifica con la comprobación estática de este paso, con un navegador con viewport de teléfono y con la lista manual de la Fase 8.

Verificación previa (falla esperada): `cd poc && grep -n "rutinas.js\|id=\"rutina\"\|ficha-bloque" src/juego.js index.html` no encuentra nada.

- [ ] En `index.html`, agregar después de la regla `#hoja .peligro { background: #a32d2d; }`:
```css
    #hoja .item.tocable { cursor: pointer; }
    #cruceta { pointer-events: none; } /* los huecos de la cruceta dejan pasar el toque al mapa: cartel y burbujas (AC-5.4) */
    #cruceta button { pointer-events: auto; }
    #ficha .rutina { width: 100%; padding: 8px; margin: 4px 0; background: #2a221c; color: #f2ead3; }
    #rutina, #ficha-bloque { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    #rutina section, #ficha-bloque form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(340px, 90vw);
      max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
    #rutina header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    #rutina button, #ficha-bloque .acciones button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    #rutina .selector { display: flex; gap: 6px; margin-bottom: 8px; }
    #rutina .selector button[aria-pressed="false"] { background: #d9cfb4; color: #2a221c; }
    #rutina .bloque { padding: 10px 0; border-top: 1px solid #d9cfb4; cursor: pointer; }
    #ficha-bloque select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    #ficha-bloque .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    #ficha-bloque .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha-bloque .acciones .peligro { background: #a32d2d; margin-right: auto; }
```
- [ ] En `index.html`, agregar dentro del formulario de `#ficha`, justo después de `<select id="ficha-especie" aria-label="Especie"></select>`:
```html
      <button type="button" id="ficha-rutina" class="rutina">Rutina</button>
```
- [ ] En `index.html`, agregar después del bloque `<div id="ficha-actividad"> ... </div>` (antes de `<div id="aviso" role="status"></div>`):
```html
  <div id="rutina">
    <section aria-label="Rutina del familiar">
      <header><strong id="rutina-titulo"></strong><button type="button" id="rutina-cerrar">Cerrar</button></header>
      <div class="selector" role="group" aria-label="Horario">
        <button type="button" data-dias="laborables">Lun–Vie</button>
        <button type="button" data-dias="finde">Sáb–Dom</button>
      </div>
      <div class="fila cabecera"><span>Bloques</span><span class="cuenta" id="rutina-cuenta"></span><button type="button" id="rutina-agregar">+ Bloque</button></div>
      <div id="rutina-lista"></div>
    </section>
  </div>
  <div id="ficha-bloque">
    <form>
      <strong id="bloque-titulo"></strong>
      <select id="bloque-inicio" aria-label="Inicio"></select>
      <select id="bloque-fin" aria-label="Fin"></select>
      <select id="bloque-lugar" aria-label="Lugar"></select>
      <div class="error" id="bloque-error"></div>
      <div class="acciones">
        <button type="button" class="peligro" id="bloque-eliminar">Eliminar</button>
        <button type="button" id="bloque-cancelar">Cancelar</button>
        <button type="submit" id="bloque-guardar">Guardar</button>
      </div>
    </form>
  </div>
```
- [ ] En `src/juego.js`, reemplazar todas las líneas `import` (desde la de `./catalogo.js` hasta la de `./fechas.js`) por:
```js
import {
  TIPOS, ETIQUETAS, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES, ICONOS, FRECUENCIAS, LIMITE_ACTIVIDADES, DIAS_RUTINA, LIMITE_BLOQUES,
} from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante, pendientesDeMiembro, bloquesDeMiembro,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';
import {
  MS_POR_PASO, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes, congelarHabitantes, ocupadasPorHabitantes, fijarObjetivos,
} from './movimiento.js';
import {
  contarActividades, puedeAgregarActividad, buscarActividad, agregarActividad, editarActividad, eliminarActividad, marcarHecha,
  limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo, MENSAJES_ACTIVIDAD,
} from './actividades.js';
import {
  buscarBloque, bloquesDe, contarBloques, puedeAgregarBloque, agregarBloque, editarBloque, eliminarBloque, MENSAJES_BLOQUE,
  textoHora, textoBloque, textoBajas, objetivosDeFamiliares, textoVuelta,
} from './rutinas.js';
import { INSIGNIAS, objetosDelSuelo, casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';
import { ahoraLocal } from './fechas.js';
```
- [ ] En `src/juego.js`, agregar después de la línea `const ESTILO_BURBUJA = { ... };`:
```js
// Rutinas (FR-5 y FR-7 de la 004): en una casilla compartida, quien va en ruta se dibuja debajo de quien no; el cartel de la entrada.
const PROF_EN_RUTA = 9;
const ESTILO_CARTEL = { ...ESTILO_ETIQUETA, color: '#ffffff', backgroundColor: '#2a221c' };
```
- [ ] En `src/juego.js`, reemplazar desde la línea `const azar = Math.random; ...` hasta el cierre de la función `posicionesDeMiembros` (incluido) por:
```js
const azar = Math.random; // el movimiento recibe el azar inyectado (ADR-002 de movimiento)
function idsHabitantes() { return habitantes(estado).map((h) => h.id); }
function propietario() { return estado.miembros.find((m) => m.eliminadoEn === null && esPropietario(estado, m)); }
const casillaJugador = () => ({ x: jugador.x, y: jugador.y, desde: jugadorDesde });
let ahora = ahoraLocal(new Date()); // fecha y minuto locales: se inyectan en las rutinas (ADR-004 de movimiento)
let hoy = ahora.fecha; // el día de hoy se inyecta en las funciones puras (ADR-003 de estado derivado)
let hojaActual = null; // hoja abierta: { tipo: 'espacio' | 'miembro', id } o { tipo: 'fuera' } (FR-7 de la 003, FR-5 de la 004)
// FR-6 de la 004: al abrir, después del jugador, cada familiar donde dice su rutina y los demás al azar.
let moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar, objetivosDeFamiliares(estado, ahora));
// Casilla actual de cada miembro en el mapa: el propietario es el jugador; los habitantes, sus móviles (FR-6 de la 003). Quien está
// fuera de casa no está en el mapa (AC-5.8 de la 004).
function posicionesDeMiembros() {
  const posiciones = new Map(moviles.filter((h) => h.fase !== 'fuera').map((h) => [h.id, { x: h.x, y: h.y }]));
  posiciones.set(propietario().id, { x: jugador.x, y: jugador.y });
  return posiciones;
}
// Familiares fuera de casa (FR-5 de la 004) y una firma que cambia cuando alguien sale, vuelve o ya no debería estar fuera.
const familiaresFuera = () => moviles.filter((h) => h.fase === 'fuera');
const firmaFuera = () => familiaresFuera().map((h) => `${h.id}${h.objetivo.tipo === 'fuera' ? '' : '~'}`).join(',');
const tienePendientesSinEspacio = (id) => actividadesDelLugar(estado, { tipo: 'miembro', id }, hoy).length > 0;
```
- [ ] En `src/juego.js`, dentro de `create()`, reemplazar las líneas desde `this.etiquetaPersonaje = ...` hasta `this.input.on('pointerup', ...)` (incluidas) por:
```js
    this.etiquetaPersonaje = this.add.text(0, 0, '', ESTILO_ETIQUETA).setOrigin(0.5, 1).setDepth(PROF_ETIQUETA_PERSONAJE);
    this.cartel = this.add.text(0, 0, '', ESTILO_CARTEL).setOrigin(1, 0.5).setDepth(PROF_BURBUJA).setVisible(false); // FR-5 de la 004
    this.firmaCartel = null;
    this.teclas = this.input.keyboard.createCursorKeys();
    // En exploración responden el cartel y las burbujas; en edición, también personajes y espacios (FR-8 de la 003, FR-5 de la 004).
    this.input.on('pointerup', (p) => tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE), this.tocaCartel(p.worldX, p.worldY)));
```
- [ ] En `src/juego.js`, reemplazar el método `refrescarActividades` (con su comentario) por:
```js
  // Tras un cambio de actividades o de día: suelo, insignias, burbujas y la señal "!" del cartel, sin rehacer a los personajes.
  refrescarActividades() {
    this.dibujarSuelo();
    this.dibujarInsignias();
    this.dibujarBurbujas();
    this.actualizarCartel();
  }
```
- [ ] En `src/juego.js`, dentro de `dibujarEtiquetas`, reemplazar las líneas `this.sincronizarSprites();` y `this.dibujarBurbujas();` por:
```js
    this.sincronizarSprites();
    this.dibujarBurbujas();
    this.actualizarCartel();
```
- [ ] En `src/juego.js`, reemplazar el método `colocarBurbujas` (con su comentario) por:
```js
  // Las burbujas de los miembros siguen a su personaje, centradas en la casilla de encima de él: la misma que responde al toque
  // (AC-6.8 de la 003). La de un familiar fuera de casa no se ve (AC-5.8 de la 004).
  colocarBurbujas() {
    const idPropietario = propietario().id;
    for (const b of this.burbujas) {
      if (b.tipo !== 'miembro') continue;
      const cuerpo = b.id === idPropietario ? this.personaje : this.sprites.get(b.id)?.cuerpo;
      b.texto.setVisible(Boolean(cuerpo?.visible));
      if (cuerpo) b.texto.setPosition(cuerpo.x, cuerpo.y - TILE);
    }
  }
```
- [ ] En `src/juego.js`, dentro de `sincronizarSprites`, reemplazar la línea `this.sprites.set(h.id, { cuerpo, etiqueta });` por:
```js
      cuerpo.setVisible(h.fase !== 'fuera'); // quien está fuera de casa no se ve (AC-4.1 de la 004)
      etiqueta.setVisible(h.fase !== 'fuera');
      this.sprites.set(h.id, { cuerpo, etiqueta });
```
- [ ] En `src/juego.js`, reemplazar el método `moverHabitantes` (con su comentario) por:
```js
  // Por cuadro, solo en exploración: avanza el movimiento (FR-5 de la 002; FR-3 y FR-4 de la 004) y anima cada paso nuevo durante
  // MS_POR_PASO. Quien sale por la entrada se oculta; quien vuelve aparece en ella sin animación. Quien va en ruta se dibuja
  // debajo de quien pasea (AC-8.6 de la 004).
  moverHabitantes(dtMs) {
    if (modo !== 'exploracion') return;
    const antes = new Map(moviles.map((h) => [h.id, h]));
    moviles = avanzarHabitantes(moviles, distribucion, casillaJugador(), dtMs, azar);
    for (const h of moviles) {
      const previo = antes.get(h.id);
      const s = this.sprites.get(h.id);
      if (!s) continue;
      const visible = h.fase !== 'fuera';
      s.cuerpo.setVisible(visible).setDepth(h.fase === 'pasea' ? PROF_PERSONAJE : PROF_EN_RUTA);
      s.etiqueta.setVisible(visible);
      if (previo.fase === 'fuera' && visible) {
        this.tweens.killTweensOf(s.cuerpo);
        s.cuerpo.setPosition(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2);
        continue;
      }
      if (previo.x === h.x && previo.y === h.y) continue;
      this.tweens.add({ targets: s.cuerpo, x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2, duration: MS_POR_PASO, ease: 'Linear' });
    }
    if (firmaFuera() !== this.firmaCartel) this.actualizarCartel();
  }

  // Cartel de la entrada (FR-5 de la 004): "n fuera" y " !" si alguno tiene actividades por hacer sin espacio. Se dibuja sobre la
  // pared, alineado a la derecha contra la entrada para no taparla, y no se ve si no hay nadie fuera.
  actualizarCartel() {
    const fuera = familiaresFuera();
    this.firmaCartel = firmaFuera();
    const aviso = fuera.some((h) => tienePendientesSinEspacio(h.id)) ? ' !' : '';
    this.cartel.setText(`${fuera.length} fuera${aviso}`).setVisible(fuera.length > 0).setScale(1 / this.cameras.main.zoom)
      .setPosition(distribucion.entrada.x * TILE, distribucion.entrada.y * TILE + TILE / 2);
    if (hojaActual?.tipo === 'fuera') pintarHoja();
  }

  // El cartel responde al toque en toda el área donde se dibuja (lección de la 003: área táctil igual al área dibujada).
  tocaCartel(xMundo, yMundo) {
    return this.cartel.visible && this.cartel.getBounds().contains(xMundo, yMundo);
  }
```
- [ ] En `src/juego.js`, dentro de `actualizarEtiquetas`, reemplazar la línea `for (const s of this.sprites.values()) s.etiqueta.setPosition(s.cuerpo.x, s.cuerpo.y - TILE * 0.6);` por:
```js
    // En una casilla compartida, el nombre de quien va en ruta pasa debajo de su cuerpo para no tapar el otro (AC-8.6 de la 004).
    const porCasilla = new Map();
    for (const h of moviles) if (h.fase !== 'fuera') porCasilla.set(`${h.x},${h.y}`, (porCasilla.get(`${h.x},${h.y}`) ?? 0) + 1);
    for (const h of moviles) {
      const s = this.sprites.get(h.id);
      if (!s) continue;
      const debajo = h.fase !== 'pasea' && porCasilla.get(`${h.x},${h.y}`) > 1;
      s.etiqueta.setOrigin(0.5, debajo ? 0 : 1).setPosition(s.cuerpo.x, s.cuerpo.y + (debajo ? TILE * 0.6 : -TILE * 0.6));
    }
```
- [ ] En `src/juego.js`, dentro de `update`, reemplazar las dos primeras líneas (`const fecha = fechaLocal(new Date());` y `if (fecha !== hoy) cambiarDia(fecha); ...`) por:
```js
    const reloj = ahoraLocal(new Date());
    if (reloj.fecha !== hoy) cambiarDia(reloj.fecha); // FR-10 de la 003: medianoche con la app abierta o vuelta a primer plano otro día
    // FR-2 y FR-3 de la 004: en exploración, al cambiar el minuto cada familiar recibe el objetivo de su rutina; en edición no (AC-6.5).
    if (modo === 'exploracion' && (reloj.minuto !== ahora.minuto || reloj.fecha !== ahora.fecha)) cambiarMinuto(reloj);
```
- [ ] En `src/juego.js`, en el manejador de `$('listo')`, reemplazar la línea `moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7: ...` por:
```js
  ahora = ahoraLocal(new Date());
  // FR-6 de la 004: primero el jugador; después cada familiar donde dice su rutina en este momento, con los cambios hechos en edición.
  moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar, objetivosDeFamiliares(estado, ahora));
```

- [ ] En `src/juego.js`, reemplazar la línea `const textoActividades = (n) => ...;` por:
```js
// El minuto cambió en exploración (FR-3 de la 004): cada familiar con un objetivo nuevo empieza a ir a su lugar.
function cambiarMinuto(reloj) {
  ahora = reloj;
  moviles = fijarObjetivos(moviles, objetivosDeFamiliares(estado, ahora));
}
```
- [ ] En `src/juego.js`, reemplazar la función `confirmarEliminacion` (con su comentario) por:
```js
// Confirmación de eliminar un espacio (AC-5.3, AC-4.7 de la 001; AC-7.1, AC-7.4 y AC-7.6 de la 003; AC-10.1, AC-10.2, AC-10.4 y
// AC-10.6 de la 004): dice cuántas actividades y cuántos bloques de rutina se eliminan con él.
function confirmarEliminacion(id) {
  if (!requiereConfirmacion(estado, id)) return true;
  const espacio = buscarEspacio(estado, id);
  const c = consecuenciasDeEliminar(estado, id);
  const partes = [`¿Eliminar "${nombreVisible(estado, espacio)}"?`];
  if (c.banoSeElimina) partes.push('También se eliminará su baño interno.');
  if (c.tieneNombrePersonalizado) partes.push('Se perderá su nombre personalizado.');
  const bajas = textoBajas(c.actividades, c.bloques);
  if (bajas) partes.push(bajas);
  return window.confirm(partes.join(' '));
}
```
- [ ] En `src/juego.js`, dentro de `abrirFicha`, reemplazar la línea `mostrarCampos({});` por:
```js
  mostrarCampos({});
  $('ficha-rutina').style.display = 'none'; // solo los familiares tienen rutina (AC-1.1 de la 004)
```
- [ ] En `src/juego.js`, dentro de `abrirFichaHabitante`, reemplazar la línea `mostrarCampos(familiar ? { parentesco: true, genero: true } : { especie: true });` por:
```js
  mostrarCampos(familiar ? { parentesco: true, genero: true } : { especie: true });
  $('ficha-rutina').style.display = miembro && familiar ? 'block' : 'none'; // AC-1.1 de la 004
```
- [ ] En `src/juego.js`, reemplazar la función `tocarMapa` (con su comentario) por:
```js
// Al tocar el mapa (FR-8 de la 003, FR-5 de la 004): en exploración responden el cartel y las burbujas; en edición la prioridad es
// personaje del propietario, habitante, cartel, burbuja y espacio (AC-5.13 de la 004).
function tocarMapa(x, y, enCartel) {
  if (modo === 'exploracion' && enCartel) { abrirHoja({ tipo: 'fuera' }); return; }
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  const burbuja = ubicarBurbujas(burbujas(estado, hoy), distribucion, posicionesDeMiembros()).find((b) => b.x === x && b.y === y);
  if (modo === 'exploracion') {
    if (burbuja) abrirHoja(burbuja);
    return;
  }
  if (x === jugador.x && y === jugador.y) { abrirFicha('propietario', propietario().id); return; }
  const habitante = moviles.find((h) => h.fase !== 'fuera' && h.x === x && h.y === y);
  if (habitante) {
    const miembro = buscarMiembro(estado, habitante.id);
    abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
    return;
  }
  if (enCartel) { abrirHoja({ tipo: 'fuera' }); return; }
  if (burbuja) { abrirHoja(burbuja); return; }
  const clave = distribucion.espacioEn[y][x];
  if (clave && buscarEspacio(estado, clave)) abrirFicha('espacio', clave);
}
```
- [ ] En `src/juego.js`, en el manejador de `$('ficha-eliminar')`, reemplazar las tres líneas desde `const n = pendientesDeMiembro(estado, id);` hasta `if (!window.confirm(pregunta)) return; ...` por:
```js
    const bajas = textoBajas(pendientesDeMiembro(estado, id), bloquesDeMiembro(estado, id));
    const pregunta = `¿Eliminar a "${buscarMiembro(estado, id).nombre}"?${bajas ? ` ${bajas}` : ''}`;
    if (!window.confirm(pregunta)) return; // AC-8.1, AC-8.2 de la 002; AC-7.7, AC-7.8 de la 003; AC-10.7 a AC-10.9 de la 004
```
- [ ] En `src/juego.js`, agregar justo antes de la línea `// ---------- Hoja de un lugar (FR-7 de la 003) ----------`:
```js
$('ficha-rutina').addEventListener('click', () => abrirRutina(fichaActual.id));

```
- [ ] En `src/juego.js`, eliminar la línea `let hojaActual = null; // lugar de la hoja abierta: { tipo: 'espacio' | 'miembro', id }` (ahora se declara arriba, junto al estado de la sesión).
- [ ] En `src/juego.js`, dentro de `pintarHoja`, reemplazar su primera línea (`const lugar = hojaActual.tipo === 'espacio' ? ...`) por:
```js
  if (hojaActual.tipo === 'fuera') { pintarHojaFuera(); return; }
  const lugar = hojaActual.tipo === 'espacio' ? buscarEspacio(estado, hojaActual.id) : buscarMiembro(estado, hojaActual.id);
```
- [ ] En `src/juego.js`, reemplazar la línea `$('hoja-cerrar').addEventListener('click', cerrarHoja);` por:
```js
$('hoja-cerrar').addEventListener('click', cerrarHoja);

// Hoja del cartel (FR-5 de la 004): los familiares fuera con su hora de vuelta y "!" si tienen actividades por hacer sin espacio.
// En exploración, la fila con "!" abre la hoja de actividades de ese familiar (AC-5.9); en edición, cada fila abre su ficha (AC-5.12).
function pintarHojaFuera() {
  const fuera = familiaresFuera();
  if (fuera.length === 0) { cerrarHoja(); return; }
  $('hoja-titulo').textContent = 'Fuera de casa';
  const cont = $('hoja-lista');
  cont.replaceChildren();
  for (const h of fuera) {
    const conPendientes = tienePendientesSinEspacio(h.id);
    const datos = elemento('span');
    datos.append(elemento('strong', buscarMiembro(estado, h.id).nombre), elemento('small', textoVuelta(estado, h.id, ahora)));
    const item = elemento('div', undefined, 'item');
    item.append(elemento('span', conPendientes ? '!' : '', 'icono'), datos, elemento('span'));
    if (modo === 'edicion') {
      item.classList.add('tocable');
      item.addEventListener('click', () => { cerrarHoja(); abrirFichaHabitante('familiar', h.id); });
    } else if (conPendientes) {
      item.classList.add('tocable');
      item.addEventListener('click', () => abrirHoja({ tipo: 'miembro', id: h.id }));
    }
    cont.append(item);
  }
  $('hoja').style.display = 'block';
}
```
- [ ] En `src/juego.js`, agregar justo antes de la línea `// ---------- Ciclo de vida ----------`:
```js
// ---------- Rutina de un familiar (FR-8 de la 004) ----------
let rutinaActual = null; // { miembroId, dias } de la rutina abierta
let bloqueEnFicha = null; // id del bloque en edición, o null en un alta
const MINUTOS_INICIO = Array.from({ length: 48 }, (_, i) => i * 30); // 00:00 a 23:30
const MINUTOS_FIN = MINUTOS_INICIO.map((m) => m + 30); // 00:30 a 24:00

function abrirRutina(miembroId) {
  cerrarFicha();
  rutinaActual = { miembroId, dias: 'laborables' };
  pintarRutina();
  $('rutina').style.display = 'flex';
}

// Selector de horario, contador "n de 8", lista por inicio y "+ Bloque" (AC-1.2, AC-1.3, AC-1.9).
function pintarRutina() {
  const { miembroId, dias } = rutinaActual;
  $('rutina-titulo').textContent = `Rutina de ${buscarMiembro(estado, miembroId).nombre}`;
  for (const boton of document.querySelectorAll('#rutina [data-dias]')) boton.setAttribute('aria-pressed', String(boton.dataset.dias === dias));
  $('rutina-cuenta').textContent = `${contarBloques(estado, miembroId, dias)} de ${LIMITE_BLOQUES}`;
  $('rutina-agregar').disabled = !puedeAgregarBloque(estado, miembroId, dias);
  const lista = bloquesDe(estado, miembroId, dias);
  $('rutina-lista').replaceChildren(...(lista.length === 0 ? [elemento('p', 'Sin bloques')] : lista.map((b) => {
    const fila = elemento('div', textoBloque(estado, b), 'bloque');
    fila.addEventListener('click', () => abrirFichaBloque(b.id));
    return fila;
  })));
}

// Al cerrar la rutina se vuelve a la ficha del familiar (AC-2.7).
function cerrarRutina() {
  const { miembroId } = rutinaActual;
  $('rutina').style.display = 'none';
  rutinaActual = null;
  abrirFichaHabitante('familiar', miembroId);
}

$('rutina-cerrar').addEventListener('click', cerrarRutina);
for (const boton of document.querySelectorAll('#rutina [data-dias]')) {
  boton.addEventListener('click', () => { rutinaActual.dias = boton.dataset.dias; pintarRutina(); });
}
$('rutina-agregar').addEventListener('click', () => abrirFichaBloque(null));

// Ficha de un bloque (AC-1.4, AC-2.1): alta sin valores elegidos; edición con inicio, fin y lugar actuales.
function abrirFichaBloque(id) {
  bloqueEnFicha = id;
  const b = id ? buscarBloque(estado, id) : null;
  $('bloque-titulo').textContent = `${b ? 'Bloque' : 'Nuevo bloque'} · ${DIAS_RUTINA[rutinaActual.dias]}`;
  opciones($('bloque-inicio'), [['', 'Inicio…'], ...MINUTOS_INICIO.map((m) => [String(m), textoHora(m)])], b ? String(b.inicio) : '');
  opciones($('bloque-fin'), [['', 'Fin…'], ...MINUTOS_FIN.map((m) => [String(m), textoHora(m)])], b ? String(b.fin) : '');
  const lugares = [['fuera', 'Fuera de casa'], ...espaciosActivos(estado).map((e) => [e.id, nombreVisible(estado, e)])];
  opciones($('bloque-lugar'), [['', 'Lugar…'], ...lugares], b ? (b.espacioId ?? 'fuera') : '');
  $('bloque-error').textContent = '';
  $('bloque-eliminar').style.display = b ? 'block' : 'none';
  actualizarFichaBloque();
  $('ficha-bloque').style.display = 'flex';
}

// Guardar se activa con inicio, fin y lugar elegidos (AC-1.5); fin no posterior y superposición los rechaza el dominio con su
// mensaje (AC-1.7, AC-1.8, AC-2.3, AC-2.4).
function actualizarFichaBloque() {
  $('bloque-guardar').disabled = ['bloque-inicio', 'bloque-fin', 'bloque-lugar'].some((campo) => $(campo).value === '');
}

const cerrarFichaBloque = () => { $('ficha-bloque').style.display = 'none'; bloqueEnFicha = null; };

// Los cambios de rutina se guardan al aplicarse (AC-11.2) y no mueven a nadie hasta tocar "Listo" (AC-6.5).
function aplicarRutina(nuevo) {
  estado = nuevo;
  guardarEstado();
  pintarRutina();
}

$('ficha-bloque').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const lugar = $('bloque-lugar').value;
  const datos = { inicio: Number($('bloque-inicio').value), fin: Number($('bloque-fin').value), espacioId: lugar === 'fuera' ? null : lugar };
  const { miembroId, dias } = rutinaActual;
  const r = bloqueEnFicha ? editarBloque(estado, bloqueEnFicha, datos, ctx) : agregarBloque(estado, { ...datos, miembroId, dias }, ctx);
  if (!r.ok) { $('bloque-error').textContent = MENSAJES_BLOQUE[r.error]; return; }
  cerrarFichaBloque();
  aplicarRutina(r.estado);
});
for (const campo of ['bloque-inicio', 'bloque-fin', 'bloque-lugar']) {
  $(campo).addEventListener('change', () => { $('bloque-error').textContent = ''; actualizarFichaBloque(); });
}
$('bloque-cancelar').addEventListener('click', cerrarFichaBloque);
// Eliminar un bloque pide confirmación con el familiar y el horario (AC-2.5).
$('bloque-eliminar').addEventListener('click', () => {
  const b = buscarBloque(estado, bloqueEnFicha);
  const pregunta = `¿Eliminar el bloque ${textoBloque(estado, b)} de "${buscarMiembro(estado, b.miembroId).nombre}" (${DIAS_RUTINA[b.dias]})?`;
  if (!window.confirm(pregunta)) return;
  cerrarFichaBloque();
  aplicarRutina(eliminarBloque(estado, b.id, ctx));
});

```
- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 201`, `# fail 0`
- [ ] Comprobación estática (script desechable con `node -e`, sin commitear): cada nombre que `juego.js` importa existe en su módulo; cada `$('id')` usado en `juego.js` existe como `id=` en `index.html`; y ninguna asignación a `innerHTML` recibe texto del usuario (`grep -n innerHTML src/juego.js` solo muestra la fila fija de "Familiares"/"Mascotas") — expect: 0 faltantes
- [ ] Run: servir `poc/` desde su carpeta con `python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"` y abrir `http://localhost:8080` con un viewport de teléfono. Expect:
  - La pared inferior de la sala tiene una casilla de piso bajo la de aparición; el personaje puede pisarla y no pasa de ella.
  - En "Editar", la ficha de un familiar ofrece "Rutina"; la de una mascota y la del personaje, no.
  - La rutina abre en "Lun–Vie" con "Sin bloques" y "0 de 8"; "+ Bloque" abre la ficha sin valores y con "Guardar" desactivado; un fin anterior al inicio y una superposición muestran su mensaje.
  - Con un bloque "Fuera de casa" que cubre la hora actual en el horario de hoy, al tocar "Listo" el familiar no está en el mapa y junto a la entrada se ve "1 fuera". Al tocar el cartel (en cualquier punto de su dibujo, con los dos zooms, también con el personaje en la casilla de aparición, donde el cartel queda entre los botones de la cruceta) se abre "Fuera de casa" con "Vuelve a las HH:MM". La cruceta sigue moviendo al personaje.
  - Con una actividad sin espacio de ese familiar, el cartel muestra "1 fuera !" y su fila abre su hoja con "Hecho".
  - En "Editar" el cartel sigue visible; su fila abre la ficha del familiar.
  - Con un bloque en la cocina que cubre la hora actual, al tocar "Listo" el familiar aparece en la cocina y pasea sin salir de ella.
  - Eliminar un espacio con bloques, o un familiar con bloques, pide confirmación con el número de bloques.
  - Al recargar, todo sigue.
- [ ] Commit: `feat(poc): edit routines and show relatives following them, with a front door sign` (cuerpo: `Plan section: Phase 7: Presentación: rutina, entrada, cartel y familiares que siguen su horario` y `Feature: 004-rutinas`)

---

## Phase 8: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: `# pass 201`, `# fail 0`
- [ ] Servir en la red local con `python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('0.0.0.0', 8080), h).serve_forever()"` desde `poc/` y abrir `http://<IP-del-computador>:8080` en el Android, en la misma Wi-Fi y con internet para cargar Phaser. Al terminar, parar el servidor.
  > **Nota sobre la caché:** no usar `python3 -m http.server` a secas. Solo envía `Last-Modified`, y el navegador del teléfono puede mezclar módulos viejos y nuevos, y entonces el mapa no se dibuja (incidencia de la 002). Si aun así pasa, borrar los datos de navegación del sitio.
- [ ] Verificar manualmente en el Android, marcando cada uno:
  - [ ] AC-1.1 a AC-1.12 y AC-2.1 a AC-2.7: rutina, selector, contador, ficha de alta y de edición, mensajes de fin y de superposición, confirmación al eliminar un bloque, vuelta a la ficha del familiar, nombres como texto.
  - [ ] AC-3.1 a AC-3.12: con un bloque en un espacio que empieza en el siguiente borde de media hora, el familiar camina hasta él cruzando puertas y pasillos y luego pasea solo dentro. Sin bloque vigente pasea por toda la casa. Las mascotas siguen igual.
  - [ ] AC-4.1 a AC-4.8: sale por la entrada y desaparece; vuelve al terminar el bloque; con el jugador sobre la entrada espera y aparece al apartarse.
  - [ ] AC-5.1 a AC-5.15: cartel, cuenta, hoja, "Vuelve a las", "Vuelve mañana", "Volviendo" (jugador sobre la entrada), "!", hoja de actividades desde la fila, cartel en edición, prioridad al tocar, cartel que no bloquea ni captura la cruceta.
  - [ ] AC-6.1 a AC-6.8: al abrir y al tocar "Listo", cada familiar aparece donde dice su rutina; en edición nadie se mueve aunque cambie la hora o la rutina.
  - [ ] AC-7.6 a AC-7.9: el cambio de bloque con la app abierta y al volver de segundo plano (los demás AC de la Story 7 los cubren pruebas automáticas). Si se puede, dejar la app abierta un viernes a medianoche.
  - [ ] AC-8.1 a AC-8.7: dos familiares que se cruzan en un pasillo (dibujados superpuestos, nombres legibles) y el jugador que les cierra el paso.
  - [ ] AC-9.1 a AC-9.7: la entrada en hogares de distintos tamaños; la posición guardada del personaje se conserva al actualizar.
  - [ ] AC-10.1 a AC-10.11: confirmaciones con bloques al eliminar un espacio (desde la ficha y con "−"), un cuarto con baño interno (que se elimina o que se mueve) y un familiar.
  - [ ] AC-11.1 a AC-11.5: cerrar y reabrir; abrir con los datos guardados por la versión anterior (con actividades) sin aviso. AC-11.6 a AC-11.9 y la Story 12 están cubiertos por pruebas automáticas.
- [ ] Medir rendimiento con el indicador de depuración:
  - Con 8 familiares cuyos bloques empiezan a la vez en espacios del otro extremo del hogar más grande, 4 mascotas y 50 actividades, durante el cambio de bloque y 30 s después: 60 fps o más.
  - En 10 "Listo" seguidos con rutinas cargadas: `regen` por debajo de 100 ms.
  - Anotar el modelo de teléfono y los resultados en `docs/specs/004-rutinas/verification.md`.
- [ ] Commit: `docs(004-rutinas): record integration verification` (cuerpo: `Plan section: Phase 8: Integration Verification` y `Feature: 004-rutinas`)

---

## Quickstart Validation

1. `cd poc && npm test` → `# pass 201`, `# fail 0`.
2. Servir `poc/` con el comando de la Fase 7 y abrir `http://localhost:8080`: aparece el hogar con una entrada en la pared inferior de la sala.
3. **Editar** → "+" en Familiares → nombre "Diana", Pareja, Femenino → **Guardar**. Tocar a Diana → **Rutina**. En el horario de hoy ("Lun–Vie" de lunes a viernes, "Sáb–Dom" el fin de semana), "+ Bloque" → inicio: la media hora en curso (por ejemplo 14:30 si son las 14:47), fin: una hora después, lugar "Fuera de casa" → **Guardar**: la lista muestra el bloque y "1 de 8".
4. **Cerrar** → **Listo**: Diana no está en el mapa y junto a la entrada se ve "1 fuera". Tocar el cartel: "Fuera de casa", con "Diana · Vuelve a las 15:30".
5. **Editar** → tocar el cartel → la fila de Diana → **Rutina** → tocar el bloque → lugar "Cocina 1" → **Guardar** → **Cerrar** → **Listo**: Diana aparece en la cocina y pasea solo por ella; el cartel desaparece.
6. Recargar la página: todo sigue igual.

---

## Plan Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-10-07 | Phases 1, 5 y 7 | Validación del plan en una copia de `poc/` antes de guardarlo: rojo y verde en cada fase (`# pass 201`), 22 mutaciones de reglas clave detectadas (incluida la que hace que quien espera bloquee, que confirma el ruling) y prueba en un navegador con viewport de teléfono. Correcciones: los mensajes de falla esperada de las Fases 1 y 5 nombran el primer export que falta (`ahoraLocal`, `bloqueVigente`); la Fase 7 agrega `pointer-events` a la cruceta, porque sus huecos tapaban el cartel con el personaje en la casilla de aparición. |
