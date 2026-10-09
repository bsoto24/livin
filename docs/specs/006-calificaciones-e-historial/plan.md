# Implementation Plan: Calificaciones e historial de actividades hechas

**Spec:** docs/specs/006-calificaciones-e-historial/spec.md (v1.0.0)
**Decisions:** docs/adr/006-historial-calificaciones-formato-v6.md
**Data model:** docs/specs/006-calificaciones-e-historial/data-model.md
**Created:** 2026-10-08

## Global Constraints

- **Entrada del historial:** cada "Hecho" que se aplica (la actividad estaba por hacer: no eliminada, no hecha y con `vence` hoy o antes) agrega exactamente una entrada, en la misma operación pura que `marcarHecha`. Se acredita a `miembroId` de la actividad **antes** de que una repetitiva intercambiada vuelva a su responsable original. Guarda `actividadId`, `miembroId`, `espacioId` (o `null`), `nombre` e `icono` (instantánea), `hechaEn` (instante, de `ctx.ahora()`), `dia` (el `hoy` local, `AAAA-MM-DD`), `estrellas` y `calificadoPor` (ambos `null` al crear) y la auditoría de siempre. Si el "Hecho" no se aplica, no se agrega nada y se devuelve el mismo estado.
- **Tope:** como máximo las últimas 200 entradas. Al agregar, si hay más de 200 se descartan las más antiguas **por orden de creación** (posición en el arreglo), calificadas o no. Solo se aplica al agregar, nunca al cargar. Ninguna otra operación elimina entradas: ni editar o eliminar una actividad, un espacio o un miembro.
- **Orden:** el arreglo `historial` está en orden de creación; la lista se muestra invertida (la última creada, primero).
- **Calificar:** lo hace quien juega, que debe ser una persona activa (propietario o familiar) distinta de la acreditada; estrellas enteras de 1 a 5; a lo sumo una calificación por entrada. Una entrada ya calificada solo la cambia o la quita quien la dio; repetir las mismas estrellas no cambia nada (ni la auditoría). Quitar deja `estrellas` y `calificadoPor` en `null`. La calificación de quien se eliminó se conserva y queda bloqueada para todos. Las entradas de mascotas y de personas eliminadas se pueden calificar.
- **Orden de comprobación al calificar:** entrada existe → quien califica es persona activa → estrellas válidas → no está bloqueada por otra persona → no es propia. Motivos: `no-encontrada`, `no-persona`, `estrellas`, `bloqueada`, `propia`; al quitar además `sin-calificacion`.
- **Promedio de un miembro:** media de las estrellas de sus entradas calificadas que siguen en el historial; un decimal, coma decimal, mitades hacia arriba (aritmética entera); "sin calificaciones" si no hay ninguna; no se muestra con "Todos". Nunca se guarda.
- **Textos fijos:** "Aún no hay actividades hechas", "<nombre> no tiene actividades hechas en el historial", "<nombre>: <promedio> ★ (<n> calificadas)", "<nombre>: sin calificaciones", "Tu calificación", "Calificó <nombre>", "No puedes calificar tus propias actividades", "Espacio eliminado", "<nombre> (ya no está)", "Hoy", "Ayer", "Hace N días" (N ≥ 2) y, si el día es posterior a hoy, su fecha `AAAA-MM-DD`.
- **Documento `version: 6`** en la misma clave `livin:datos:v1`, con `historial: []`. Las versiones 1 a 5 se migran al cargar (cadena de migraciones puras) y se guardan como v6 en el siguiente guardado. Una entrada es válida si: `nombre` y `hechaEn` son texto no vacío; `dia` es una fecha real; `actividadId` y `miembroId` existen en el documento (eliminados incluidos); `espacioId` es `null` o existe; y o bien `estrellas` y `calificadoPor` son `null`, o `estrellas` es un entero de 1 a 5 y `calificadoPor` es un miembro del documento. Si no, el documento es ilegible (aviso y hogar inicial).
- **Botón y panel** (solo en exploración): "Historial" en la esquina superior derecha, debajo de "Intercambios"; el panel cubre la pantalla como el de intercambios, con un filtro de miembro ("Todos" al abrir), el resumen, la lista y "Cerrar". El filtro ofrece el propietario, los familiares y las mascotas activos, en ese orden. Los textos del usuario se insertan siempre como texto, nunca como marcado.
- **Rendimiento:** 60 cuadros por segundo con 8 familiares, 4 mascotas, el propietario caminando solo, 50 actividades y 200 entradas; abrir, filtrar y calificar muestran el resultado en menos de 100 ms.
- Ningún dato sale del dispositivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs; arte de marcador original. `historial.js` y el resto del dominio no importan Phaser ni el DOM.

**Pre-implementation gates:**
- *Simplicity:* siguen siendo 3 componentes. Dominio (`catalogo.js`, `hogar.js`, `almacen.js`, `actividades.js` y el nuevo `historial.js`), lógica pura de mapa, tiempo y movimiento (sin cambios) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* un único modelo canónico (objetos planos del estado guardado). El orden, el filtro, el promedio y los textos son resultados de funciones puras, no vistas guardadas ni clases. Phaser y el DOM se usan directamente. ✓
- *Integration-First:* los contratos (exportaciones, motivos de rechazo, formato v6) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que cada "Hecho" deje constancia de qué se hizo, quién estaba a cargo y cuándo, que otra persona del hogar pueda calificar lo hecho de 1 a 5 estrellas desde un botón "Historial", y que al filtrar por un miembro se vea su promedio; con el formato guardado v6 y migración desde los hogares de las features 001 a 005. Todo cubierto por pruebas automáticas (258 existentes + 41 nuevas = 299).

Archivos (bajo `poc/`):
- **Lógica:** `src/catalogo.js` (tope y escala), `src/hogar.js` (hogar inicial v6), `src/almacen.js` (formato v6), `src/actividades.js` (`marcarHecha` agrega la entrada), `src/historial.js` (nuevo).
- **Presentación:** `src/juego.js`, `index.html`.
- **Pruebas en `test/`:** `contrato-historial.test.js` (nuevo), `almacen.test.js`, `habitantes.test.js`, `contrato-rutinas.test.js`, `contrato-intercambios.test.js`, `historial.test.js` (nuevo), `calificaciones.test.js` (nuevo).

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1, FR-2, FR-4, FR-5, FR-6, FR-8 (contrato) | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/contrato-historial.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de nombres exportados por `src/catalogo.js` (`LIMITE_HISTORIAL = 200`, `MIN_ESTRELLAS = 1`, `MAX_ESTRELLAS = 5`), `src/hogar.js` (el hogar inicial con `version: 6` e `historial: []`), `src/almacen.js` (`migrarAV6`) y `src/historial.js` (consultas, operaciones, textos y `MENSAJES_HISTORIAL`).

Fija la forma pública de lo nuevo antes de implementarlo. La prueba de contrato queda en rojo (`ERR_MODULE_NOT_FOUND` o exportaciones que faltan) hasta el final de la Fase 3; las Fases 1 a 3 se verifican con sus propios archivos de prueba.

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato-historial.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as historial from '../src/historial.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo del historial: tope y escala de estrellas', () => {
  assert.equal(catalogo.LIMITE_HISTORIAL, 200);
  assert.deepEqual([catalogo.MIN_ESTRELLAS, catalogo.MAX_ESTRELLAS], [1, 5]);
});

test('contrato del modelo y del almacén: hogar inicial v6 y migración', () => {
  assert.equal(typeof almacen.migrarAV6, 'function');
  const e = hogar.crearHogarInicial(crearCtx());
  assert.deepEqual([e.version, e.historial], [6, []]);
});

test('contrato del historial: funciones y mensajes', () => {
  for (const f of ['buscarEntrada', 'agregarEntrada', 'entradasDelHistorial', 'entradasDe', 'miembrosDelFiltro', 'textoAcreditada',
    'textoEspacio', 'textoDia', 'textoLinea', 'promedioDe', 'textoResumen', 'textoVacio', 'estadoDeCalificacion', 'textoCalificacion',
    'calificar', 'quitarCalificacion']) {
    assert.equal(typeof historial[f], 'function', f);
  }
  for (const clave of ['no-encontrada', 'no-persona', 'estrellas', 'bloqueada', 'propia', 'sin-calificacion']) {
    assert.equal(typeof historial.MENSAJES_HISTORIAL[clave], 'string', clave);
  }
});
```

- [ ] Run: `cd poc && node --test test/contrato-historial.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/historial.js`)
- [ ] Commit: `test(poc): add contract tests for the activity history and ratings` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 006-calificaciones-e-historial`)

---

## Phase 1: Formato guardado v6 y migración

**Implements:** FR-8 (registro guardado), FR-9 (datos) | **Satisfies:** AC-6.6, AC-8.1, AC-8.3, AC-8.4, AC-8.5, AC-8.6, AC-8.8, AC-9.3
**Files:** `poc/src/catalogo.js`, `poc/src/hogar.js`, `poc/src/almacen.js`, `poc/test/almacen.test.js`, `poc/test/habitantes.test.js`, `poc/test/contrato-rutinas.test.js`, `poc/test/contrato-intercambios.test.js`
**Interfaces:** Consumes: `esTexto`, `enLista` y las validaciones de las versiones 1 a 5 (001 a 005); `esFechaValida`; `crearHogarInicial`. Produces: desde `catalogo.js`: `LIMITE_HISTORIAL = 200`, `MIN_ESTRELLAS = 1`, `MAX_ESTRELLAS = 5`. Desde `hogar.js`: `crearHogarInicial(ctx)` devuelve `version: 6` e `historial: []`. Desde `almacen.js`: `migrarAV6(estado)` → documento v6 (pura); `crearAlmacen(storage).cargar()` acepta `version` 1 a 5 (cadena de migraciones) y 6 (valida además el historial), y devuelve `{ estado: null, error: 'ilegible' }` en cualquier otro caso. Las claves `CLAVE_DATOS` y `CLAVE_POSICION` no cambian.

Implementa el ADR de historial en el almacén. Las pruebas existentes que fijaban la versión 5 pasan a fijar la 6, y los documentos que simulan versiones anteriores dejan de llevar `historial`, como los reales.

- [ ] Actualizar las pruebas existentes que fijan la versión. En `test/almacen.test.js`, aplicar estos reemplazos (macOS):
```bash
cd poc
# las funciones comoV1..comoV4 también quitan el historial
sed -i '' -E 's/const \{ actividades, bloques, intercambios, \.\.\.resto \} = estado;/const { actividades, bloques, intercambios, historial, ...resto } = estado;/' test/almacen.test.js
sed -i '' -E 's/const \{ bloques, intercambios, \.\.\.resto \} = estado;/const { bloques, intercambios, historial, ...resto } = estado;/' test/almacen.test.js
sed -i '' -E 's/const \{ intercambios, \.\.\.resto \} = estado;/const { intercambios, historial, ...resto } = estado;/' test/almacen.test.js
# lo que se abre y se guarda ahora queda en versión 6 (la prueba de migrarAV5 conserva su 5)
sed -i '' -E '/v5\.version/! s/version, 5\)/version, 6)/' test/almacen.test.js
sed -i '' -E '/^test\(/ s/(en|como) versión 5/\1 versión 6/' test/almacen.test.js
sed -i '' -E 's/ya en versión 5 en memoria/ya en versión 6 en memoria/' test/almacen.test.js
grep -c "historial, \.\.\.resto" test/almacen.test.js
grep -c "version, 6)" test/almacen.test.js
```
  Expect: `4` y `6`. Además, en `test/almacen.test.js`, reemplazar la lista de claves de la prueba `'AC-10.7 (005)'`:
```js
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'hogares', 'intercambios', 'membresias',
    'miembros', 'version']);
```
  por:
```js
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'historial', 'hogares', 'intercambios',
    'membresias', 'miembros', 'version']);
```
  y, en la misma línea de import de `../src/almacen.js`, agregar `migrarAV6`:
```js
import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, migrarAV4, migrarAV5, migrarAV6, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
```

- [ ] En `test/habitantes.test.js`, reemplazar las cuatro primeras líneas de la prueba del hogar inicial (título, `const e`, las dos aserciones) por:
```js
test('FR-1, AC-9.4 (002), FR-11 (003), FR-10 (004), FR-12 (005), FR-8 (006): el hogar inicial tiene versión 6, sin actividades, bloques, intercambios ni historial, y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 6);
  assert.deepEqual([e.actividades, e.bloques, e.intercambios, e.historial], [[], [], [], []]);
```
  (las líneas siguientes de la prueba no cambian)

- [ ] En `test/contrato-rutinas.test.js`, en la prueba `'contrato del modelo y del almacén: consultas de bloques, hogar inicial v5 y migración'`: cambiar `hogar inicial v5` por `hogar inicial v6` en el título y `[5, []]` por `[6, []]`. En `test/contrato-intercambios.test.js`, en la prueba `'contrato del modelo y del almacén: jugador activo, hogar inicial v5 y migración'`: lo mismo (`hogar inicial v6`, `[6, []]`).

- [ ] Agregar al final de `test/almacen.test.js` las pruebas nuevas del formato v6:
```js
// ---------- Feature 006: historial y calificaciones (versión 6) ----------

// Documento como lo guardaba la feature 005: versión 5, sin historial.
function comoV5(estado) {
  const { historial, ...resto } = estado;
  return { ...resto, version: 5 };
}

// Entrada guardada tal como la escribe la feature 006 (para probar el almacén sin depender de sus operaciones).
function entradaGuardada(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, actividadId: 'act-1', miembroId: diana.id, espacioId: espaciosDeTipo(estado, 'cocina')[0].id,
    nombre: 'Lavar los platos', icono: 'platos', hechaEn: '2026-10-08T10:00:00.000Z', dia: '2026-10-08', estrellas: null, calificadoPor: null,
    creadoEn: '2026-10-08T10:00:00.000Z', actualizadoEn: '2026-10-08T10:00:00.000Z', creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1',
    eliminadoEn: null, ...extra,
  };
}

// Hogar con tres entradas: una sin calificar (Diana), una de "Barrer" del propietario calificada por Diana (4) y una de "Basura" de
// Diana calificada por el propietario (2).
function hogarConHistorial(ctx) {
  const e = hogarConIntercambios(ctx);
  const [propietario, diana] = e.miembros;
  return {
    ...e,
    historial: [
      entradaGuardada(e, 'ent-1'),
      entradaGuardada(e, 'ent-2', {
        actividadId: 'act-2', miembroId: propietario.id, espacioId: null, nombre: 'Barrer', icono: 'barrer', estrellas: 4, calificadoPor: diana.id,
      }),
      entradaGuardada(e, 'ent-3', { actividadId: 'act-5', nombre: 'Basura', icono: 'basura', estrellas: 2, calificadoPor: propietario.id }),
    ],
  };
}

const conEntrada = (base, nueva) => ({ ...base, historial: base.historial.map((x) => (x.id === nueva.id ? nueva : x)) });

test('AC-8.1 (006): el historial y sus calificaciones se guardan y se restauran igual, en el mismo orden, en versión 6', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConHistorial(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.equal(estado.version, 6);
  assert.deepEqual(estado.historial.map((x) => x.id), ['ent-1', 'ent-2', 'ent-3']);
  assert.deepEqual([estado.historial[1].estrellas, estado.historial[1].calificadoPor], [4, e.miembros[1].id]);
});

test('AC-8.3, AC-8.8 (006): un hogar de la feature 005 se abre sin aviso, con el historial vacío y todo lo demás igual, y se guarda como versión 6 en el siguiente guardado', () => {
  const e = hogarConIntercambios(crearCtx());
  const textoV5 = JSON.stringify(comoV5(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV5 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, habitantes, actividades, bloques e intercambios; historial vacío; ya en versión 6 en memoria
  assert.deepEqual(estado.historial, []);
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV5); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 6);
});

test('migrarAV6 es pura: no modifica el documento de entrada y solo agrega la lista de historial vacía', () => {
  const v5 = comoV5(hogarConIntercambios(crearCtx()));
  const copia = structuredClone(v5);
  const v6 = migrarAV6(v5);
  assert.deepEqual(v5, copia);
  assert.equal(v6.version, 6);
  assert.deepEqual(v6.historial, []);
  assert.deepEqual(comoV5(v6), v5);
});

test('AC-8.4 (006): un documento v6 sin lista de historial, o con una entrada inválida, es ilegible', () => {
  const base = hogarConHistorial(crearCtx());
  const [sinCalificar, calificada] = base.historial;
  const [, diana] = base.miembros;
  const { historial, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const { dia, ...sinDia } = calificada;
  const variantes = [
    { ...calificada, nombre: '' }, { ...calificada, nombre: 7 },
    { ...calificada, hechaEn: null }, { ...calificada, hechaEn: '' },
    { ...calificada, dia: 'ayer' }, { ...calificada, dia: '2026-02-30' }, { ...calificada, dia: null }, sinDia,
    { ...calificada, actividadId: 'no-existe' }, { ...calificada, miembroId: 'no-existe' },
    { ...calificada, estrellas: 0 }, { ...calificada, estrellas: 6 }, { ...calificada, estrellas: 2.5 }, { ...calificada, estrellas: '4' },
    { ...calificada, estrellas: 4, calificadoPor: null }, // estrellas sin quien las dio
    { ...calificada, estrellas: null }, // quien las dio sin estrellas
    { ...sinCalificar, calificadoPor: diana.id },
    { ...calificada, calificadoPor: 'no-existe' },
  ];
  for (const mala of variantes) {
    const { estado, aviso } = abrirDatos(conEntrada(base, mala));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(mala));
    assert.deepEqual(estado.historial, []);
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-8.5 (006): una entrada con un espacio que no existe en el documento es ilegible; con un espacio eliminado, no', () => {
  const base = hogarConHistorial(crearCtx());
  const [entrada] = base.historial;
  assert.match(abrirDatos(conEntrada(base, { ...entrada, espacioId: 'no-existe' })).aviso, /No se pudo recuperar/);
  const eliminado = { ...espaciosDeTipo(base, 'cocina')[0], id: 'esp-eliminado', secuencia: 99, eliminadoEn: '2026-10-08T12:00:00.000Z' };
  const guardado = { ...conEntrada(base, { ...entrada, espacioId: eliminado.id }), espacios: [...base.espacios, eliminado] };
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.equal(estado.historial[0].espacioId, 'esp-eliminado');
});

test('AC-7.2, AC-7.6 (006): las entradas de una persona o de una actividad eliminadas no vuelven ilegible el documento', () => {
  const ctx = crearCtx();
  const base = hogarConHistorial(ctx);
  const sinDiana = eliminarHabitante(base, base.miembros[1].id, ctx); // elimina a Diana y sus actividades; las entradas quedan
  assert.ok(sinDiana.actividades.some((a) => a.eliminadoEn !== null));
  const { estado, aviso } = abrirDatos(sinDiana);
  assert.equal(aviso, null);
  assert.deepEqual(estado.historial, sinDiana.historial);
});

test('AC-6.6 (006): un historial guardado con más de 200 entradas se abre con normalidad y con todas ellas', () => {
  const base = hogarConHistorial(crearCtx());
  const muchas = Array.from({ length: 205 }, (_, i) => entradaGuardada(base, `ent-${i}`));
  const { estado, aviso } = abrirDatos({ ...base, historial: muchas });
  assert.equal(aviso, null);
  assert.equal(estado.historial.length, 205);
});

test('AC-8.6, AC-9.3 (006): el documento guardado no tiene promedios ni conteos y cada entrada referencia por identificador', () => {
  const storage = almacenEnMemoria();
  crearAlmacen(storage).guardar(hogarConHistorial(crearCtx()));
  const guardado = JSON.parse(storage.datos.get(CLAVE_DATOS));
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'historial', 'hogares', 'intercambios',
    'membresias', 'miembros', 'version']);
  for (const x of guardado.historial) {
    assert.deepEqual(Object.keys(x).sort(), ['actividadId', 'actualizadoEn', 'actualizadoPor', 'calificadoPor', 'creadoEn', 'creadoPor', 'dia',
      'eliminadoEn', 'espacioId', 'estrellas', 'hechaEn', 'hogarId', 'icono', 'id', 'miembroId', 'nombre']);
  }
});
```

- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js test/contrato-rutinas.test.js test/contrato-intercambios.test.js` — expect: FAIL (el hogar inicial sigue en versión 5; `migrarAV6` no existe)
- [ ] En `src/catalogo.js`, después de `export const LIMITE_INTERCAMBIOS = 20;` agregar:
```js

// Historial de actividades hechas y calificaciones (feature 006, ADR-006 de historial): las últimas 200 entradas y estrellas de 1 a 5.
export const LIMITE_HISTORIAL = 200;
export const MIN_ESTRELLAS = 1;
export const MAX_ESTRELLAS = 5;
```
- [ ] En `src/hogar.js`, en `crearHogarInicial`, reemplazar el comentario y el `return` final:
```js
  // Documento versión 5 (ADR-005 de intercambios): el hogar empieza sin actividades, bloques de rutina ni intercambios.
  return {
    version: 5, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [], bloques: [],
    intercambios: [],
  };
```
  por:
```js
  // Documento versión 6 (ADR-006 de historial): el hogar empieza sin actividades, bloques de rutina, intercambios ni historial.
  return {
    version: 6, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [], bloques: [],
    intercambios: [], historial: [],
  };
```
- [ ] En `src/almacen.js`, después de la función `intercambiosValidos`, agregar la validación del historial:
```js
// Historial en la versión 6 (ADR-006 de historial, FR-8 de la 006). Todas las entradas se validan: textos no vacíos, un día real,
// referencias a una actividad, un miembro y, si lo hay, un espacio que existen en el documento (eliminados incluidos, porque las
// entradas los sobreviven), y estrellas y autora o ambas nulas o ambas presentes (un entero de 1 a 5 y un miembro del documento).
function historialValido(estado) {
  if (!Array.isArray(estado.historial)) return false;
  const miembros = new Set(estado.miembros.map((m) => m.id));
  const actividades = new Set(estado.actividades.map((a) => a.id));
  const espacios = new Set(estado.espacios.map((e) => e.id));
  return estado.historial.every((x) => esTexto(x.nombre) && esTexto(x.hechaEn) && esFechaValida(x.dia)
    && actividades.has(x.actividadId) && miembros.has(x.miembroId) && (x.espacioId === null || espacios.has(x.espacioId))
    && ((x.estrellas === null && x.calificadoPor === null)
      || (Number.isInteger(x.estrellas) && x.estrellas >= MIN_ESTRELLAS && x.estrellas <= MAX_ESTRELLAS && miembros.has(x.calificadoPor))));
}
```
  y cambiar el import de `./catalogo.js` agregando `MIN_ESTRELLAS, MAX_ESTRELLAS`:
```js
import {
  PARENTESCOS, GENEROS, ESPECIES, ICONOS, FRECUENCIAS, DIAS_RUTINA, PASO_RUTINA, ESTADOS_INTERCAMBIO, MIN_ESTRELLAS, MAX_ESTRELLAS,
} from './catalogo.js';
```
- [ ] En `src/almacen.js`, después de `migrarAV5`, agregar la migración:
```js

// Migración pura v5 → v6: el hogar pasa a tener un historial de actividades hechas, vacío.
export function migrarAV6(estado) {
  return { ...estado, version: 6, historial: [] };
}
```
- [ ] En `src/almacen.js`, reemplazar el cuerpo de `cargar()` (desde `const estado = JSON.parse(texto);` hasta `return { estado: null, error: 'ilegible' };` previo al `catch`) por:
```js
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) {
          return { estado: migrarAV6(migrarAV5(migrarAV4(migrarAV3(migrarAV2(estado))))), error: null };
        }
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidos(estado)) {
          return { estado: migrarAV6(migrarAV5(migrarAV4(migrarAV3(estado)))), error: null };
        }
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)) {
          return { estado: migrarAV6(migrarAV5(migrarAV4(estado))), error: null };
        }
        if (estado?.version === 4 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)
          && bloquesValidos(estado)) {
          return { estado: migrarAV6(migrarAV5(estado)), error: null };
        }
        if (estado?.version === 5 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado)) {
          return { estado: migrarAV6(estado), error: null };
        }
        if (estado?.version === 6 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado) && historialValido(estado)) {
          return { estado, error: null };
        }
        return { estado: null, error: 'ilegible' };
```
  y actualizar el comentario de `iniciarSesion` agregando `FR-8 de la 006` a la lista de features.
- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js test/contrato-rutinas.test.js test/contrato-intercambios.test.js` — expect: PASS
- [ ] Run: `cd poc && npm test` — expect: 266 pruebas pasan (258 + 8 nuevas); solo `contrato-historial.test.js` sigue en rojo (no carga: falta `src/historial.js`) hasta la Fase 3
- [ ] Commit: `feat(poc): save homes in format v6 with the activity history` (cuerpo: `Plan section: Phase 1: Formato guardado v6 y migración` y `Feature: 006-calificaciones-e-historial`)

---

## Phase 2: Entradas del historial y tope de 200

**Implements:** FR-1, FR-2, FR-7, FR-9 (identidad) | **Satisfies:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-1.6, AC-1.7, AC-1.8, AC-1.9, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-7.1, AC-7.2, AC-7.7, AC-7.8, AC-7.9, AC-7.10, AC-9.2, AC-9.5
**Files:** `poc/src/historial.js`, `poc/src/actividades.js`, `poc/test/historial.test.js`
**Interfaces:** Consumes: `marcarHecha(estado, id, hoy, ctx)` (003, ampliada en la 005), `auditoriaNueva(ctx)` de `hogar.js`, `LIMITE_HISTORIAL`. Produces: desde `historial.js`: `buscarEntrada(estado, id)` → entrada o `null`; `agregarEntrada(estado, actividad, hoy, ctx)` → estado con la entrada nueva al final y el historial recortado a 200 (`actividad` es la actividad **antes** de marcarla). `marcarHecha` sigue devolviendo el estado (el mismo objeto si no se aplica) y ahora agrega la entrada.

Hace que cada "Hecho" deje su entrada y aplica el tope. `historial.js` no importa `actividades.js` (así no hay ciclo: `actividades.js` importa `historial.js`).

- [ ] Escribir las pruebas:
```js
// test/historial.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, eliminarHabitante, espaciosDeTipo, familiares, mascotas, banoDe,
  consecuenciasDeEliminar,
} from '../src/hogar.js';
import { agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, limpiezaDeEspacio } from '../src/actividades.js';
import { proponer, aceptar, esVigente } from '../src/intercambios.js';
import { sumarDias } from '../src/fechas.js';
import { LIMITE_HISTORIAL } from '../src/catalogo.js';
import { crearCtx } from './ayuda.js';

const HOY = '2026-10-06';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', parentesco: 'hermano', genero: 'masculino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const diana = (e) => familiares(e)[0];
const luis = (e) => familiares(e)[1];
const firulais = (e) => mascotas(e)[0];
const cocina = (e) => espaciosDeTipo(e, 'cocina')[0];
const ultima = (e) => e.actividades.at(-1);

// Alta de una actividad; `extra` cambia lo que haga falta (por defecto, una puntual de Diana que vence hoy, sin espacio).
function nueva(estado, nombre, ctx, extra = {}) {
  const r = agregarActividad(estado, {
    nombre, icono: 'otra', miembroId: diana(estado).id, espacioId: null, tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
  }, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return r.estado;
}

// Crea una puntual y la marca "Hecho": el historial gana una entrada.
function hacer(estado, nombre, ctx, extra = {}) {
  const con = nueva(estado, nombre, ctx, extra);
  return marcarHecha(con, ultima(con).id, HOY, ctx);
}

// Deja `n` entradas en el historial ("Tarea 1" la más antigua).
function conHistorial(estado, n, ctx) {
  let e = estado;
  for (let i = 1; i <= n; i += 1) e = hacer(e, `Tarea ${i}`, ctx);
  return e;
}

test('AC-1.1, AC-9.2: "Hecho" en una puntual agrega exactamente una entrada acreditada a su responsable, sin calificación', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Lavar los platos', ctx, { icono: 'platos', espacioId: cocina(e).id });
  const a = ultima(e);
  const despues = marcarHecha(e, a.id, HOY, ctx);
  assert.equal(despues.historial.length, 1);
  const [entrada] = despues.historial;
  assert.deepEqual(
    [entrada.actividadId, entrada.miembroId, entrada.espacioId, entrada.nombre, entrada.icono, entrada.dia, entrada.estrellas, entrada.calificadoPor],
    [a.id, diana(e).id, cocina(e).id, 'Lavar los platos', 'platos', HOY, null, null],
  );
  assert.equal(entrada.hogarId, e.hogares[0].id);
  assert.deepEqual([entrada.creadoPor, entrada.actualizadoPor, entrada.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
  assert.equal(entrada.hechaEn, entrada.creadoEn);
  assert.equal(buscarActividad(despues, a.id), null); // quedó hecha, como en la 003
});

test('AC-1.2: "Hecho" en una repetitiva agrega una entrada y avanza su vencimiento como en la 003', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Barrer', ctx, { icono: 'barrer', tipo: 'repetitiva', frecuenciaDias: 7 });
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  assert.equal(e.historial.length, 1);
  assert.deepEqual([e.historial[0].nombre, e.historial[0].miembroId], ['Barrer', diana(e).id]);
  assert.equal(buscarActividad(e, id).vence, sumarDias(HOY, 7));
});

test('AC-1.3, AC-1.4: la entrada se acredita a quien tenía la actividad por un intercambio, y la repetitiva sigue volviendo a su responsable original', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Barrer', ctx, { icono: 'barrer', tipo: 'repetitiva', frecuenciaDias: 7 });
  e = nueva(e, 'Basura', ctx, { icono: 'basura', miembroId: luis(e).id });
  e = nueva(e, 'Platos', ctx, { icono: 'platos' });
  e = nueva(e, 'Ropa', ctx, { icono: 'ropa', miembroId: luis(e).id });
  const id = (nombre) => e.actividades.find((a) => a.nombre === nombre).id;
  const cambiar = (estado, ofrecida, pedida) => {
    const p = proponer(estado, { proponenteId: diana(estado).id, ofrecidaId: id(ofrecida), pedidaId: id(pedida) }, ctx);
    return aceptar(p.estado, p.estado.intercambios.at(-1).id, luis(estado).id, ctx).estado;
  };
  e = cambiar(e, 'Barrer', 'Basura'); // la repetitiva pasa a Luis y vuelve a Diana al hacerla
  e = cambiar(e, 'Platos', 'Ropa'); // la puntual pasa a Luis
  const barrer = marcarHecha(e, id('Barrer'), HOY, ctx);
  assert.equal(barrer.historial.at(-1).miembroId, luis(e).id);
  assert.equal(buscarActividad(barrer, id('Barrer')).miembroId, diana(e).id);
  const platos = marcarHecha(barrer, id('Platos'), HOY, ctx);
  assert.equal(platos.historial.at(-1).miembroId, luis(e).id);
});

test('AC-1.5: "Hecho" en una actividad de una mascota agrega una entrada acreditada a la mascota', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const e = hacer(base, 'Paseo', ctx, { miembroId: firulais(base).id });
  assert.equal(e.historial.length, 1);
  assert.equal(e.historial[0].miembroId, firulais(e).id);
});

test('AC-1.6, AC-1.7: cada "Hecho" es una entrada propia y una repetitiva hecha en dos días deja dos entradas', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Barrer', ctx, { tipo: 'repetitiva', frecuenciaDias: 7 });
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  e = hacer(e, 'Platos', ctx);
  const otroDia = sumarDias(HOY, 7);
  e = marcarHecha(e, id, otroDia, ctx);
  assert.deepEqual(e.historial.map((x) => [x.nombre, x.dia]), [['Barrer', HOY], ['Platos', HOY], ['Barrer', otroDia]]);
  assert.equal(new Set(e.historial.map((x) => x.id)).size, 3);
});

test('AC-1.8: un "Hecho" que no se aplica no agrega ninguna entrada ni cambia el estado', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Futura', ctx, { vence: sumarDias(HOY, 1) });
  const futura = ultima(e);
  e = hacer(e, 'Hecha', ctx);
  const hecha = e.actividades.find((a) => a.nombre === 'Hecha');
  e = nueva(e, 'Borrada', ctx);
  const borrada = ultima(e);
  e = eliminarActividad(e, borrada.id, ctx);
  assert.equal(e.historial.length, 1);
  for (const id of [futura.id, hecha.id, borrada.id, 'no-existe']) assert.equal(marcarHecha(e, id, HOY, ctx), e);
});

test('AC-1.9, AC-7.10: "Hecho" conserva sus efectos de siempre: estado del espacio, vigencia de las propuestas y el resto del hogar', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Platos', ctx, { espacioId: cocina(e).id, vence: '2026-10-05' });
  e = nueva(e, 'Basura', ctx, { miembroId: luis(e).id });
  const platos = e.actividades.find((a) => a.nombre === 'Platos');
  const basura = e.actividades.find((a) => a.nombre === 'Basura');
  e = proponer(e, { proponenteId: diana(e).id, ofrecidaId: platos.id, pedidaId: basura.id }, ctx).estado;
  const propuesta = e.intercambios[0];
  assert.equal(limpiezaDeEspacio(e, cocina(e).id, HOY), 'desordenado');
  assert.equal(esVigente(e, propuesta), true);
  const despues = marcarHecha(e, platos.id, HOY, ctx);
  assert.equal(limpiezaDeEspacio(despues, cocina(e).id, HOY), 'limpio');
  assert.equal(esVigente(despues, propuesta), false);
  const { historial, actividades, ...resto } = despues;
  const { historial: antesHistorial, actividades: antesActividades, ...restoAntes } = e;
  assert.deepEqual(resto, restoAntes); // espacios, miembros, bloques e intercambios intactos
  assert.deepEqual([antesHistorial.length, historial.length], [0, 1]);
  assert.equal(antesActividades.length, actividades.length);
});

test('AC-6.1, AC-6.2: con 199 entradas no se descarta nada; con 200, la siguiente descarta la más antigua', () => {
  const ctx = crearCtx();
  let e = conHistorial(hogarBase(ctx), LIMITE_HISTORIAL - 1, ctx);
  assert.deepEqual([e.historial.length, e.historial[0].nombre], [199, 'Tarea 1']);
  e = hacer(e, 'Tarea 200', ctx);
  assert.deepEqual([e.historial.length, e.historial[0].nombre], [200, 'Tarea 1']);
  e = hacer(e, 'Tarea 201', ctx);
  assert.deepEqual([e.historial.length, e.historial[0].nombre, e.historial.at(-1).nombre], [200, 'Tarea 2', 'Tarea 201']);
});

test('AC-6.3, AC-6.4, AC-6.5: se descarta la más antigua aunque esté calificada y aunque su día sea posterior', () => {
  const ctx = crearCtx();
  let e = conHistorial(hogarBase(ctx), LIMITE_HISTORIAL, ctx);
  const primera = { ...e.historial[0], dia: '2026-12-31', estrellas: 5, calificadoPor: luis(e).id };
  e = { ...e, historial: [primera, ...e.historial.slice(1)] };
  e = hacer(e, 'Tarea nueva', ctx);
  assert.equal(e.historial.length, LIMITE_HISTORIAL);
  assert.equal(e.historial.some((x) => x.nombre === 'Tarea 1'), false);
  assert.deepEqual([e.historial[0].nombre, e.historial.at(-1).nombre], ['Tarea 2', 'Tarea nueva']);
});

test('AC-6.6: un historial con más de 200 entradas conserva todas hasta el siguiente "Hecho", que lo deja en 200', () => {
  const ctx = crearCtx();
  const base = conHistorial(hogarBase(ctx), LIMITE_HISTORIAL, ctx);
  const copias = base.historial.slice(0, 5).map((x, i) => ({ ...x, id: `extra-${i}` }));
  const e = { ...base, historial: [...copias, ...base.historial] };
  assert.equal(e.historial.length, LIMITE_HISTORIAL + 5);
  const despues = hacer(e, 'Tarea nueva', ctx);
  assert.equal(despues.historial.length, LIMITE_HISTORIAL);
  assert.equal(despues.historial.at(-1).nombre, 'Tarea nueva');
});

test('AC-7.1, AC-7.2: editar o eliminar la actividad de origen no cambia la entrada', () => {
  const ctx = crearCtx();
  let e = nueva(hogarBase(ctx), 'Barrer', ctx, { icono: 'barrer', tipo: 'repetitiva', frecuenciaDias: 7 });
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  const [entrada] = e.historial;
  const editada = editarActividad(e, id, {
    nombre: 'Barrer a fondo', icono: 'limpiar', miembroId: luis(e).id, espacioId: cocina(e).id, tipo: 'puntual', vence: HOY, frecuenciaDias: null,
  }, ctx);
  assert.equal(editada.ok, true);
  assert.deepEqual(editada.estado.historial, [entrada]);
  assert.deepEqual(eliminarActividad(editada.estado, id, ctx).historial, [entrada]);
});

test('AC-7.7: las confirmaciones de eliminar no cuentan entradas del historial', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = hacer(e, 'Platos', ctx, { espacioId: cocina(e).id });
  const sinHistorial = { ...e, historial: [] };
  assert.deepEqual(consecuenciasDeEliminar(e, cocina(e).id), consecuenciasDeEliminar(sinHistorial, cocina(e).id));
});

test('AC-7.8: las entradas de un baño interno se conservan cuando el baño pasa a otro cuarto y cuando se elimina con su cuarto', () => {
  const ctx = crearCtx();
  const preparar = (banos) => {
    let e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
    for (let i = 0; i < banos; i += 1) e = agregarEspacio(e, 'bano', ctx);
    const [d1] = espaciosDeTipo(e, 'dormitorio');
    const bano = banoDe(e, d1.id);
    e = hacer(e, 'Ducha', ctx, { espacioId: bano.id });
    return { e, d1, bano };
  };
  const pasa = preparar(1); // con un solo baño interno, al eliminar el primer cuarto pasa al segundo
  const trasPasar = eliminarEspacio(pasa.e, pasa.d1.id, ctx);
  assert.deepEqual(trasPasar.historial, pasa.e.historial);
  assert.equal(trasPasar.espacios.find((x) => x.id === pasa.bano.id).eliminadoEn, null);
  const sale = preparar(2); // con dos, cada cuarto tiene el suyo: el baño se elimina con su cuarto
  const trasEliminar = eliminarEspacio(sale.e, sale.d1.id, ctx);
  assert.deepEqual(trasEliminar.historial, sale.e.historial);
  assert.notEqual(trasEliminar.espacios.find((x) => x.id === sale.bano.id).eliminadoEn, null);
});

test('AC-7.9, AC-9.5: eliminar a la persona acreditada, o a quien calificó, conserva las entradas y las calificaciones', () => {
  const ctx = crearCtx();
  let e = hacer(hogarBase(ctx), 'Platos', ctx);
  e = { ...e, historial: e.historial.map((x) => ({ ...x, estrellas: 4, calificadoPor: luis(e).id })) };
  assert.deepEqual(eliminarHabitante(e, diana(e).id, ctx).historial, e.historial);
  assert.deepEqual(eliminarHabitante(e, luis(e).id, ctx).historial, e.historial);
});
```

- [ ] Run: `cd poc && node --test test/historial.test.js` — expect: FAIL (las aserciones fallan: `despues.historial.length` es 0 en lugar de 1)
- [ ] Crear `src/historial.js` con la parte de entradas:
```js
// src/historial.js
// Historial de actividades hechas y calificaciones (feature 006): operaciones y consultas puras sobre `estado.historial`
// (ADR-006 de historial). Nada derivado se guarda: el orden, el filtro y el promedio salen de las entradas.
import { LIMITE_HISTORIAL } from './catalogo.js';
import { auditoriaNueva } from './hogar.js';

export const buscarEntrada = (estado, id) => estado.historial.find((x) => x.id === id) ?? null;

// Agrega la entrada de un "Hecho" (FR-1) y recorta el historial a las últimas LIMITE_HISTORIAL por orden de creación (FR-2).
// `actividad` es la actividad tal como estaba antes de marcarla: su responsable de ese momento es quien recibe el crédito, aunque
// una repetitiva intercambiada vuelva después a su responsable original.
export function agregarEntrada(estado, actividad, hoy, ctx) {
  const auditoria = auditoriaNueva(ctx);
  const entrada = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, actividadId: actividad.id, miembroId: actividad.miembroId,
    espacioId: actividad.espacioId, nombre: actividad.nombre, icono: actividad.icono, hechaEn: auditoria.creadoEn, dia: hoy,
    estrellas: null, calificadoPor: null, ...auditoria,
  };
  return { ...estado, historial: [...estado.historial, entrada].slice(-LIMITE_HISTORIAL) };
}
```
- [ ] En `src/actividades.js`, agregar el import y reemplazar el final de `marcarHecha`. Import (después de la línea de `./fechas.js`):
```js
import { agregarEntrada } from './historial.js';
```
  Comentario de `marcarHecha` (agregar al final del bloque de comentarios que la precede): `// Además agrega una entrada al historial, acreditada al responsable de ese momento (FR-1 de la 006).` Y reemplazar:
```js
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...cambio } : a));
  return { ...estado, actividades };
}

export const MENSAJES_ACTIVIDAD
```
  por:
```js
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...cambio } : a));
  return agregarEntrada({ ...estado, actividades }, actividad, hoy, ctx);
}

export const MENSAJES_ACTIVIDAD
```
- [ ] Run: `cd poc && node --test test/historial.test.js` — expect: PASS (14 pruebas)
- [ ] Run: `cd poc && npm test` — expect: 280 pruebas pasan (266 + 14 nuevas); solo `contrato-historial.test.js` sigue en rojo (la Fase 3 agrega lo que le falta). Si una prueba existente fija un id o una marca generada después de un "Hecho", ajustar el valor esperado (la entrada nueva consume un id y una marca del contexto de pruebas).
- [ ] Commit: `feat(poc): record every completed activity in the history with a 200-entry cap` (cuerpo: `Plan section: Phase 2: Entradas del historial y tope de 200` y `Feature: 006-calificaciones-e-historial`)

---

## Phase 3: Consultas, calificaciones y promedio

**Implements:** FR-3 (textos y orden), FR-4, FR-5, FR-6, FR-7 (nombres), FR-9 | **Satisfies:** AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.7, AC-3.8, AC-3.9, AC-3.11, AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.7, AC-4.8, AC-4.9, AC-4.10, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.7, AC-5.8, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-9.1, AC-9.2, AC-9.4
**Files:** `poc/src/historial.js`, `poc/test/calificaciones.test.js`
**Interfaces:** Consumes: `buscarEntrada`, `agregarEntrada` (Fase 2); de `hogar.js`: `tocar`, `buscarEspacio`, `nombreVisible`, `personasQueJuegan`, `puedeJugar`, `mascotas`; `diasEntre` de `fechas.js`; `MIN_ESTRELLAS`, `MAX_ESTRELLAS`. Produces, desde `historial.js` (todo puro):
`entradasDelHistorial(estado)` → entradas de la más reciente a la más antigua; `entradasDe(estado, miembroId)` → las acreditadas a ese miembro, en el mismo orden; `miembrosDelFiltro(estado)` → propietario, familiares y mascotas activos; `textoAcreditada(estado, entrada)`; `textoEspacio(estado, entrada)` (`''` sin espacio, el nombre actual o `'Espacio eliminado'`); `textoDia(dia, hoy)`; `textoLinea(estado, entrada, hoy)`; `promedioDe(estado, miembroId)` → `{ calificadas, texto }` (`texto` es `null` si no hay); `textoResumen(estado, miembroId | null)`; `textoVacio(estado, miembroId | null)`; `estadoDeCalificacion(entrada, jugadorId)` → `'libre' | 'propia' | 'mia' | 'bloqueada'`; `textoCalificacion(estado, entrada, jugadorId)`; `calificar(estado, entradaId, jugadorId, estrellas, ctx)` y `quitarCalificacion(estado, entradaId, jugadorId, ctx)` → `{ ok: true, estado }` o `{ ok: false, error, estado }`; `MENSAJES_HISTORIAL`.

Completa la lógica pura del historial: lo que la lista muestra, quién puede hacer qué con una calificación y el promedio.

- [ ] Escribir las pruebas:
```js
// test/calificaciones.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, eliminarHabitante, renombrarEspacio, renombrarMiembro,
  espaciosDeTipo, miembrosActivos, familiares, mascotas, nombreVisible,
} from '../src/hogar.js';
import { agregarActividad, marcarHecha } from '../src/actividades.js';
import {
  buscarEntrada, entradasDelHistorial, entradasDe, miembrosDelFiltro, textoAcreditada, textoEspacio, textoDia, textoLinea, promedioDe,
  textoResumen, textoVacio, estadoDeCalificacion, textoCalificacion, calificar, quitarCalificacion, MENSAJES_HISTORIAL,
} from '../src/historial.js';
import { LIMITE_HISTORIAL } from '../src/catalogo.js';
import { crearCtx } from './ayuda.js';

const HOY = '2026-10-06';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', parentesco: 'hermano', genero: 'masculino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const propietarioDe = (e) => miembrosActivos(e)[0];
const diana = (e) => familiares(e)[0];
const luis = (e) => familiares(e)[1];
const firulais = (e) => mascotas(e)[0];
const cocina = (e) => espaciosDeTipo(e, 'cocina')[0];

// Crea una puntual de Diana (o de `extra.miembroId`) y la marca "Hecho": el historial gana una entrada.
function hacer(estado, nombre, ctx, extra = {}) {
  const r = agregarActividad(estado, {
    nombre, icono: 'otra', miembroId: diana(estado).id, espacioId: null, tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
  }, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return marcarHecha(r.estado, r.estado.actividades.at(-1).id, HOY, ctx);
}

// Escenario: cuatro "Hecho" seguidos: Tarea 1 (Diana, en la cocina), Tarea 2 (Luis), Tarea 3 (Firulais) y Tarea 4 (el propietario).
function escenario() {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  [diana(e), luis(e), firulais(e), propietarioDe(e)].forEach((m, i) => {
    e = hacer(e, `Tarea ${i + 1}`, ctx, { miembroId: m.id, espacioId: i === 0 ? cocina(e).id : null });
  });
  return { ctx, e };
}

const entrada = (e, nombre) => e.historial.find((x) => x.nombre === nombre);
const califica = (e, nombre, quien, estrellas, ctx) => {
  const r = calificar(e, entrada(e, nombre).id, quien.id, estrellas, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return r.estado;
};

test('AC-2.3, AC-3.2: el historial se lista de la más reciente a la más antigua y el filtro deja las entradas de un miembro', () => {
  const { ctx, e } = escenario();
  assert.deepEqual(entradasDelHistorial(e).map((x) => x.nombre), ['Tarea 4', 'Tarea 3', 'Tarea 2', 'Tarea 1']);
  const con = hacer(e, 'Tarea 5', ctx, { miembroId: diana(e).id });
  assert.deepEqual(entradasDe(con, diana(e).id).map((x) => x.nombre), ['Tarea 5', 'Tarea 1']);
  assert.deepEqual(entradasDe(con, luis(e).id).map((x) => x.nombre), ['Tarea 2']);
});

test('AC-3.1, AC-3.9: el filtro ofrece el propietario, los familiares y las mascotas activos, en ese orden', () => {
  const { ctx, e } = escenario();
  assert.deepEqual(miembrosDelFiltro(e).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Luis', 'Firulais']);
  assert.deepEqual(miembrosDelFiltro(eliminarHabitante(e, luis(e).id, ctx)).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Firulais']);
});

test('AC-2.5: el día se muestra como Hoy, Ayer, Hace N días o, si es posterior a hoy, su fecha', () => {
  assert.equal(textoDia('2026-10-06', HOY), 'Hoy');
  assert.equal(textoDia('2026-10-05', HOY), 'Ayer');
  assert.equal(textoDia('2026-10-03', HOY), 'Hace 3 días');
  assert.equal(textoDia('2026-07-08', HOY), 'Hace 90 días');
  assert.equal(textoDia('2026-10-09', HOY), '2026-10-09');
});

test('AC-2.4, AC-7.3, AC-7.5, AC-9.4: la línea de una fila muestra la persona, el espacio si lo tenía y el día, con los nombres actuales', () => {
  const { ctx, e } = escenario();
  const tarea1 = entrada(e, 'Tarea 1');
  assert.equal(textoLinea(e, tarea1, HOY), `Diana · ${nombreVisible(e, cocina(e))} · Hoy`);
  assert.equal(textoLinea(e, entrada(e, 'Tarea 2'), HOY), 'Luis · Hoy'); // sin espacio
  const conEspacio = renombrarEspacio(e, cocina(e).id, 'Cocinita', ctx).estado;
  const renombrado = renombrarMiembro(conEspacio, diana(e).id, 'Dianita', ctx).estado;
  assert.equal(textoLinea(renombrado, tarea1, HOY), 'Dianita · Cocinita · Hoy');
  assert.equal(renombrado.historial[0].nombre, 'Tarea 1'); // el nombre de la actividad es el de entonces
});

test('AC-7.4, AC-7.6: una entrada de un espacio o de una persona eliminados sigue mostrándose', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'lavanderia', ctx);
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  e = hacer(e, 'Ropa sucia', ctx, { espacioId: lavanderia.id });
  e = hacer(e, 'Platos', ctx);
  const sinLavanderia = eliminarEspacio(e, lavanderia.id, ctx);
  assert.equal(textoEspacio(sinLavanderia, entrada(sinLavanderia, 'Ropa sucia')), 'Espacio eliminado');
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.equal(textoAcreditada(sinDiana, entrada(sinDiana, 'Platos')), 'Diana (ya no está)');
  assert.deepEqual(miembrosDelFiltro(sinDiana).map((m) => m.nombre), ['Personaje 1', 'Luis', 'Firulais']);
  assert.equal(entradasDelHistorial(sinDiana).length, 2); // sigue visible con "Todos"
});

test('AC-3.3, AC-3.4: el promedio cuenta solo las entradas calificadas, con un decimal y coma decimal', () => {
  const { ctx, e: base } = escenario();
  let e = base;
  for (const n of [2, 3, 4]) e = hacer(e, `Diana ${n}`, ctx, { miembroId: diana(e).id });
  assert.deepEqual(promedioDe(e, diana(e).id), { calificadas: 0, texto: null });
  assert.equal(textoResumen(e, diana(e).id), 'Diana: sin calificaciones');
  const quien = luis(e);
  e = califica(e, 'Tarea 1', quien, 5, ctx);
  e = califica(e, 'Diana 2', quien, 4, ctx);
  e = califica(e, 'Diana 3', quien, 4, ctx);
  e = califica(e, 'Diana 4', quien, 4, ctx);
  assert.deepEqual(promedioDe(e, diana(e).id), { calificadas: 4, texto: '4,3' }); // 17 / 4 = 4,25, las mitades hacia arriba
  assert.equal(textoResumen(e, diana(e).id), 'Diana: 4,3 ★ (4 calificadas)');
});

test('AC-3.3: el redondeo del promedio usa aritmética entera, con las mitades hacia arriba', () => {
  const { e } = escenario();
  const casos = [[[5, 5], '5,0'], [[1, 2], '1,5'], [[1, 1, 2], '1,3'], [[1, 1, 1, 2], '1,3'], [[1, 1, 1, 1, 2], '1,2'], [[3], '3,0']];
  for (const [estrellas, texto] of casos) {
    const historial = estrellas.map((n, i) => ({ ...e.historial[0], id: `h-${i}`, estrellas: n, calificadoPor: luis(e).id }));
    assert.equal(promedioDe({ ...e, historial }, diana(e).id).texto, texto, estrellas.join());
  }
});

test('AC-2.6, AC-3.5: textos del historial vacío y de un miembro sin entradas; con "Todos" no hay resumen', () => {
  const e = hogarBase(crearCtx());
  assert.equal(textoVacio(e, null), 'Aún no hay actividades hechas');
  assert.equal(textoVacio(e, diana(e).id), 'Diana no tiene actividades hechas en el historial');
  assert.equal(textoResumen(e, diana(e).id), 'Diana: sin calificaciones');
  assert.equal(textoResumen(e, null), '');
});

test('AC-3.7, AC-3.8: el promedio se actualiza al cambiar o quitar una calificación y no cuenta lo que el tope descartó', () => {
  const { ctx, e } = escenario();
  const quien = luis(e);
  let s = califica(e, 'Tarea 1', quien, 5, ctx);
  assert.equal(textoResumen(s, diana(e).id), 'Diana: 5,0 ★ (1 calificadas)');
  s = califica(s, 'Tarea 1', quien, 2, ctx);
  assert.equal(textoResumen(s, diana(e).id), 'Diana: 2,0 ★ (1 calificadas)');
  s = quitarCalificacion(s, entrada(s, 'Tarea 1').id, quien.id, ctx).estado;
  assert.equal(textoResumen(s, diana(e).id), 'Diana: sin calificaciones');
  let t = califica(e, 'Tarea 1', quien, 5, ctx);
  for (let i = 0; i < LIMITE_HISTORIAL; i += 1) t = hacer(t, `Relleno ${i}`, ctx, { miembroId: quien.id });
  assert.equal(buscarEntrada(t, entrada(e, 'Tarea 1').id), null); // el tope la descartó, con su calificación
  assert.equal(textoResumen(t, diana(e).id), 'Diana: sin calificaciones');
});

test('AC-4.2, AC-4.8, AC-9.1, AC-9.2: calificar cambia solo las estrellas, quién las dio y la auditoría de esa entrada', () => {
  const { ctx, e } = escenario();
  const antes = entrada(e, 'Tarea 1');
  const r = calificar(e, antes.id, luis(e).id, 4, ctx);
  assert.equal(r.ok, true);
  const despues = buscarEntrada(r.estado, antes.id);
  assert.deepEqual([despues.estrellas, despues.calificadoPor, despues.id], [4, luis(e).id, antes.id]);
  assert.notEqual(despues.actualizadoEn, antes.actualizadoEn);
  assert.deepEqual({ ...despues, estrellas: null, calificadoPor: null, actualizadoEn: antes.actualizadoEn, actualizadoPor: antes.actualizadoPor }, antes);
  assert.equal(despues.creadoPor, 'cuenta-1');
  assert.deepEqual(r.estado.historial.filter((x) => x.id !== antes.id), e.historial.filter((x) => x.id !== antes.id));
  assert.equal(r.estado.actividades, e.actividades);
  assert.equal(r.estado.intercambios, e.intercambios);
});

test('AC-4.4, AC-4.5: se pueden calificar las entradas de una mascota y de una persona eliminada', () => {
  const { ctx, e } = escenario();
  assert.equal(calificar(e, entrada(e, 'Tarea 3').id, propietarioDe(e).id, 5, ctx).ok, true); // Firulais
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.equal(calificar(sinDiana, entrada(sinDiana, 'Tarea 1').id, luis(e).id, 2, ctx).ok, true);
});

test('AC-4.7: se rechaza con su motivo calificar una entrada inexistente, a sí mismo, sin ser persona, con estrellas inválidas o ya calificada por otra persona', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1').id;
  const rechazado = (r, error) => {
    assert.deepEqual([r.ok, r.error], [false, error]);
    assert.equal(r.estado, e);
  };
  rechazado(calificar(e, 'no-existe', luis(e).id, 3, ctx), 'no-encontrada');
  rechazado(calificar(e, t1, diana(e).id, 3, ctx), 'propia');
  rechazado(calificar(e, t1, firulais(e).id, 3, ctx), 'no-persona');
  rechazado(calificar(e, t1, 'no-existe', 3, ctx), 'no-persona');
  for (const mala of [0, 6, 2.5, '3', NaN, null, undefined]) rechazado(calificar(e, t1, luis(e).id, mala, ctx), 'estrellas');
  const calificada = califica(e, 'Tarea 1', luis(e), 3, ctx);
  const r = calificar(calificada, t1, propietarioDe(e).id, 5, ctx);
  assert.deepEqual([r.ok, r.error], [false, 'bloqueada']);
  assert.equal(r.estado, calificada);
  for (const clave of ['no-encontrada', 'no-persona', 'estrellas', 'bloqueada', 'propia', 'sin-calificacion']) {
    assert.match(MENSAJES_HISTORIAL[clave], /\S/, clave);
  }
});

test('AC-5.2, AC-5.3, AC-5.4: quien calificó puede cambiar sus estrellas, repetir las mismas sin efecto y quitarlas', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1').id;
  let s = califica(e, 'Tarea 1', luis(e), 4, ctx);
  const igual = calificar(s, t1, luis(e).id, 4, ctx);
  assert.deepEqual([igual.ok, igual.estado === s], [true, true]); // ni siquiera cambia la auditoría
  s = califica(s, 'Tarea 1', luis(e), 2, ctx);
  assert.deepEqual([buscarEntrada(s, t1).estrellas, buscarEntrada(s, t1).calificadoPor], [2, luis(e).id]);
  const quitada = quitarCalificacion(s, t1, luis(e).id, ctx);
  assert.equal(quitada.ok, true);
  assert.deepEqual([buscarEntrada(quitada.estado, t1).estrellas, buscarEntrada(quitada.estado, t1).calificadoPor], [null, null]);
  assert.equal(calificar(quitada.estado, t1, propietarioDe(e).id, 5, ctx).ok, true); // queda libre para otra persona
});

test('AC-5.5, AC-5.8: nadie más cambia o quita una calificación ajena, tampoco la persona acreditada; quitar sin calificación se rechaza', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1').id;
  const s = califica(e, 'Tarea 1', luis(e), 4, ctx);
  for (const quien of [diana(e), propietarioDe(e)]) {
    const a = calificar(s, t1, quien.id, 5, ctx);
    const b = quitarCalificacion(s, t1, quien.id, ctx);
    assert.deepEqual([a.ok, a.error, b.ok, b.error], [false, 'bloqueada', false, 'bloqueada']);
    assert.deepEqual([a.estado === s, b.estado === s], [true, true]);
  }
  const sin = quitarCalificacion(e, t1, luis(e).id, ctx);
  assert.deepEqual([sin.ok, sin.error], [false, 'sin-calificacion']);
  assert.equal(quitarCalificacion(e, 'no-existe', luis(e).id, ctx).error, 'no-encontrada');
  assert.equal(quitarCalificacion(s, t1, firulais(e).id, ctx).error, 'no-persona');
});

test('AC-5.7, AC-7.9: la calificación de quien se eliminó se conserva, bloqueada para todos y marcada "(ya no está)"', () => {
  const { ctx, e } = escenario();
  const s = eliminarHabitante(califica(e, 'Tarea 1', luis(e), 4, ctx), luis(e).id, ctx);
  const t1 = buscarEntrada(s, entrada(e, 'Tarea 1').id);
  assert.deepEqual([t1.estrellas, t1.calificadoPor], [4, luis(e).id]);
  for (const quien of [diana(s), propietarioDe(s)]) {
    assert.equal(estadoDeCalificacion(t1, quien.id), 'bloqueada');
    assert.equal(calificar(s, t1.id, quien.id, 5, ctx).error, 'bloqueada');
  }
  assert.equal(textoCalificacion(s, t1, propietarioDe(s).id), 'Calificó Luis (ya no está)');
});

test('AC-4.1, AC-4.3, AC-4.10, AC-5.1, AC-5.5: el estado de una entrada para quien juega es libre, propia, mía o bloqueada, con su texto', () => {
  const { ctx, e } = escenario();
  const t1 = entrada(e, 'Tarea 1');
  assert.deepEqual([estadoDeCalificacion(t1, luis(e).id), textoCalificacion(e, t1, luis(e).id)], ['libre', '']);
  assert.deepEqual(
    [estadoDeCalificacion(t1, diana(e).id), textoCalificacion(e, t1, diana(e).id)],
    ['propia', 'No puedes calificar tus propias actividades'],
  );
  const s = califica(e, 'Tarea 1', luis(e), 4, ctx);
  const calificada = buscarEntrada(s, t1.id);
  assert.deepEqual([estadoDeCalificacion(calificada, luis(e).id), textoCalificacion(s, calificada, luis(e).id)], ['mia', 'Tu calificación']);
  for (const quien of [diana(e), propietarioDe(e)]) {
    assert.deepEqual([estadoDeCalificacion(calificada, quien.id), textoCalificacion(s, calificada, quien.id)], ['bloqueada', 'Calificó Luis']);
  }
});
```
- [ ] Run: `cd poc && node --test test/calificaciones.test.js` — expect: FAIL (`textoDia`, `calificar` y las demás exportaciones no existen)
- [ ] En `src/historial.js`, reemplazar las dos líneas de import (`LIMITE_HISTORIAL` y `auditoriaNueva`) por:
```js
import { LIMITE_HISTORIAL, MIN_ESTRELLAS, MAX_ESTRELLAS } from './catalogo.js';
import { auditoriaNueva, tocar, buscarEspacio, nombreVisible, personasQueJuegan, puedeJugar, mascotas } from './hogar.js';
import { diasEntre } from './fechas.js';

const rechazo = (estado, error) => ({ ok: false, error, estado });
const nombreDe = (estado, id) => estado.miembros.find((m) => m.id === id)?.nombre ?? ''; // también de los eliminados
const estaActivo = (estado, id) => estado.miembros.some((m) => m.id === id && m.eliminadoEn === null);
const conAviso = (estado, id) => (estaActivo(estado, id) ? nombreDe(estado, id) : `${nombreDe(estado, id)} (ya no está)`);
```
- [ ] Agregar al final de `src/historial.js`:
```js

// ---------- Consultas ----------

// De la más reciente a la más antigua (AC-2.3): el historial se guarda en orden de creación.
export const entradasDelHistorial = (estado) => [...estado.historial].reverse();
export const entradasDe = (estado, miembroId) => entradasDelHistorial(estado).filter((x) => x.miembroId === miembroId);

// Opciones del filtro (AC-3.1): el propietario, luego los familiares y luego las mascotas, todos activos.
export const miembrosDelFiltro = (estado) => [...personasQueJuegan(estado), ...mascotas(estado)];

// ---------- Textos ----------

const TEXTO_PROPIA = 'No puedes calificar tus propias actividades';

export const textoAcreditada = (estado, entrada) => conAviso(estado, entrada.miembroId);

// El espacio con su nombre actual (AC-7.3), "Espacio eliminado" si ya no existe (AC-7.4) y '' si la actividad no tenía (AC-2.4).
export function textoEspacio(estado, entrada) {
  if (entrada.espacioId === null) return '';
  const espacio = buscarEspacio(estado, entrada.espacioId);
  return espacio ? nombreVisible(estado, espacio) : 'Espacio eliminado';
}

// Día de la entrada respecto de hoy (AC-2.5); si es posterior a hoy (la fecha del teléfono se movió hacia atrás), su fecha.
export function textoDia(dia, hoy) {
  const dias = diasEntre(dia, hoy);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return dias > 1 ? `Hace ${dias} días` : dia;
}

// Línea de datos de una fila (AC-2.4): persona acreditada · espacio (si tenía) · día.
export const textoLinea = (estado, entrada, hoy) => [
  textoAcreditada(estado, entrada), textoEspacio(estado, entrada), textoDia(entrada.dia, hoy),
].filter(Boolean).join(' · ');

export function textoVacio(estado, miembroId) {
  return miembroId === null ? 'Aún no hay actividades hechas' : `${nombreDe(estado, miembroId)} no tiene actividades hechas en el historial`;
}

// ---------- Promedio ----------

// Promedio de las estrellas de las entradas calificadas de un miembro que siguen en el historial (FR-4): un decimal, coma decimal
// y las mitades hacia arriba, en aritmética entera para no depender de decimales binarios. No se guarda.
export function promedioDe(estado, miembroId) {
  const dadas = estado.historial.filter((x) => x.miembroId === miembroId && x.estrellas !== null).map((x) => x.estrellas);
  if (dadas.length === 0) return { calificadas: 0, texto: null };
  const suma = dadas.reduce((a, b) => a + b, 0);
  const decimas = Math.floor((suma * 20 + dadas.length) / (2 * dadas.length));
  return { calificadas: dadas.length, texto: `${Math.floor(decimas / 10)},${decimas % 10}` };
}

// Encabezado del filtro (AC-3.3, AC-3.4); '' con "Todos" (AC-3.6).
export function textoResumen(estado, miembroId) {
  if (miembroId === null) return '';
  const { calificadas, texto } = promedioDe(estado, miembroId);
  const nombre = nombreDe(estado, miembroId);
  return calificadas === 0 ? `${nombre}: sin calificaciones` : `${nombre}: ${texto} ★ (${calificadas} calificadas)`;
}

// ---------- Calificar ----------

// Qué puede hacer quien juega con una entrada (FR-5, FR-6):
//  'libre'     sin calificación y de otra persona: se puede calificar;
//  'propia'    sin calificación y acreditada a quien juega: no se puede calificar;
//  'mia'       la dio quien juega: la puede cambiar o quitar;
//  'bloqueada' la dio otra persona: nadie más la cambia, tampoco la persona acreditada.
export function estadoDeCalificacion(entrada, jugadorId) {
  if (entrada.calificadoPor === null) return entrada.miembroId === jugadorId ? 'propia' : 'libre';
  return entrada.calificadoPor === jugadorId ? 'mia' : 'bloqueada';
}

export function textoCalificacion(estado, entrada, jugadorId) {
  switch (estadoDeCalificacion(entrada, jugadorId)) {
    case 'mia': return 'Tu calificación';
    case 'bloqueada': return `Calificó ${conAviso(estado, entrada.calificadoPor)}`;
    case 'propia': return TEXTO_PROPIA;
    default: return '';
  }
}

const reemplazarEntrada = (estado, nueva) => ({ ...estado, historial: estado.historial.map((x) => (x.id === nueva.id ? nueva : x)) });

// Califica (o cambia la calificación de) una entrada (FR-5, FR-6). Repetir las mismas estrellas no cambia nada: se devuelve el mismo estado.
export function calificar(estado, entradaId, jugadorId, estrellas, ctx) {
  const entrada = buscarEntrada(estado, entradaId);
  if (!entrada) return rechazo(estado, 'no-encontrada');
  if (!puedeJugar(estado, jugadorId)) return rechazo(estado, 'no-persona');
  if (!Number.isInteger(estrellas) || estrellas < MIN_ESTRELLAS || estrellas > MAX_ESTRELLAS) return rechazo(estado, 'estrellas');
  if (entrada.calificadoPor !== null && entrada.calificadoPor !== jugadorId) return rechazo(estado, 'bloqueada');
  if (entrada.miembroId === jugadorId) return rechazo(estado, 'propia');
  if (entrada.estrellas === estrellas) return { ok: true, estado };
  return { ok: true, estado: reemplazarEntrada(estado, { ...tocar(entrada, ctx), estrellas, calificadoPor: jugadorId }) };
}

// Quita la calificación: solo quien la dio. La entrada queda sin estrellas y vuelve a poder calificarse.
export function quitarCalificacion(estado, entradaId, jugadorId, ctx) {
  const entrada = buscarEntrada(estado, entradaId);
  if (!entrada) return rechazo(estado, 'no-encontrada');
  if (!puedeJugar(estado, jugadorId)) return rechazo(estado, 'no-persona');
  if (entrada.calificadoPor === null) return rechazo(estado, 'sin-calificacion');
  if (entrada.calificadoPor !== jugadorId) return rechazo(estado, 'bloqueada');
  return { ok: true, estado: reemplazarEntrada(estado, { ...tocar(entrada, ctx), estrellas: null, calificadoPor: null }) };
}

export const MENSAJES_HISTORIAL = {
  'no-encontrada': 'Esa entrada ya no está en el historial.',
  'no-persona': 'Solo una persona del hogar puede calificar.',
  estrellas: 'Elige de 1 a 5 estrellas.',
  bloqueada: 'Solo quien dio la calificación puede cambiarla.',
  propia: `${TEXTO_PROPIA}.`,
  'sin-calificacion': 'Esa entrada no tiene calificación.',
};
```
- [ ] Run: `cd poc && node --test test/calificaciones.test.js test/contrato-historial.test.js` — expect: PASS (16 + 3 pruebas)
- [ ] Run: `cd poc && npm test` — expect: PASS, 299 pruebas (258 existentes + 41 nuevas), 0 fallos
- [ ] Commit: `feat(poc): rate history entries and derive each member's average` (cuerpo: `Plan section: Phase 3: Consultas, calificaciones y promedio` y `Feature: 006-calificaciones-e-historial`)

---

## Phase 4: Botón y panel "Historial"

**Implements:** FR-3 (botón y panel), FR-4 (filtro y resumen en pantalla), FR-5 y FR-6 (controles de estrellas), FR-8 (guardado al aplicar) | **Satisfies:** AC-1.10, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.6, AC-2.7, AC-2.8, AC-2.9, AC-2.10, AC-2.11, AC-3.3, AC-3.6, AC-3.10, AC-4.1, AC-4.2, AC-4.3, AC-4.6, AC-4.7, AC-4.10, AC-5.1, AC-5.3, AC-5.4, AC-5.5, AC-5.6, AC-5.9, AC-6.7, AC-8.2, AC-8.7
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: todo lo exportado por `historial.js` (Fases 2 y 3); de `juego.js`: `estado`, `jugador`, `hoy`, `ctx`, `elemento`, `opciones`, `avisar`, `guardarEstado`, `GLIFO_ICONO`, `ultimaRegeneracionMs`, `cerrarPaneles`, `mostrarExploracion`. Produces: el botón `#historial`, el panel `#panel-historial` y las funciones `abrirHistorial`, `cerrarHistorial`, `pintarHistorial`, `filaDeHistorial` y `aplicarHistorial` en `juego.js`. Es la capa de presentación: no tiene pruebas automáticas (toda su lógica está en `historial.js`, probado en las Fases 2 y 3); se verifica con `node --check` y en el navegador (Fase 5).

Muestra el historial. El panel cubre la pantalla como el de intercambios, así que no hace falta cerrar otros paneles al abrirlo.

- [ ] En `index.html`, agregar el botón después de `<button id="intercambios">Intercambios</button>`:
```html
  <button id="historial">Historial</button>
```
- [ ] En `index.html`, agregar el panel antes de `<div id="aviso" role="status"></div>`:
```html
  <div id="panel-historial" class="modal">
    <section aria-label="Historial">
      <header><strong>Historial</strong><button type="button" id="historial-cerrar">Cerrar</button></header>
      <select id="historial-filtro" aria-label="Persona"></select>
      <strong class="resumen" id="historial-resumen"></strong>
      <div id="historial-lista"></div>
      <div class="error" id="historial-error"></div>
    </section>
  </div>
```
- [ ] En `index.html`, en los estilos: cambiar `#juega, #intercambios { position: fixed; ...` por `#juega, #intercambios, #historial { position: fixed; ...` (el resto de la regla igual), y agregar después de la línea `#intercambios { top: calc(108px + env(safe-area-inset-top)); }`:
```css
    #historial { top: calc(156px + env(safe-area-inset-top)); }
```
  y después de la línea `.nota { ... }` (la última regla antes de `</style>`):
```css
    .modal .resumen { display: block; margin: 8px 0; }
    .modal .fila-historial { padding: 8px 0; border-top: 1px solid #d9cfb4; }
    .modal .fila-historial small { display: block; opacity: .7; }
    .modal .fila-historial .pie { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .modal .estrellas { display: flex; gap: 2px; }
    .modal .estrellas button { min-width: 40px; min-height: 40px; padding: 0; font-size: 22px; background: transparent; color: #2a221c; }
    .modal .estrellas button:disabled { opacity: .45; }
```
- [ ] En `src/juego.js`, en el import de `./catalogo.js`, agregar `MAX_ESTRELLAS` al final de la lista (`... DIAS_RUTINA, LIMITE_BLOQUES, MAX_ESTRELLAS,`) y agregar el import del historial antes de `import { ahoraLocal } from './fechas.js';`:
```js
import {
  entradasDelHistorial, entradasDe, miembrosDelFiltro, textoLinea, textoResumen, textoVacio, estadoDeCalificacion, textoCalificacion,
  calificar, quitarCalificacion, MENSAJES_HISTORIAL,
} from './historial.js';
```
- [ ] En `src/juego.js`, en `mostrarExploracion`, agregar después de la línea de `intercambios`:
```js
  $('historial').style.display = visible ? 'block' : 'none';
```
  y en `cerrarPaneles`, agregar `cerrarHistorial();` después de `cerrarIntercambios();`.
- [ ] En `src/juego.js`, agregar antes de `// ---------- Ciclo de vida ----------`:
```js
// ---------- Historial y calificaciones (FR-3 a FR-6 de la 006) ----------
let filtroHistorial = null; // null = "Todos"; si no, el id de un miembro. Vuelve a "Todos" cada vez que se abre el panel (AC-3.10)

function abrirHistorial() {
  filtroHistorial = null;
  opciones($('historial-filtro'), [['', 'Todos'], ...miembrosDelFiltro(estado).map((m) => [m.id, m.nombre])], '');
  $('historial-error').textContent = '';
  pintarHistorial();
  $('panel-historial').style.display = 'flex';
}
function cerrarHistorial() {
  $('panel-historial').style.display = 'none';
}

// Lista del panel (AC-2.3, AC-2.6): el resumen del miembro elegido y una fila por entrada, de la más reciente a la más antigua.
function pintarHistorial() {
  const lista = filtroHistorial === null ? entradasDelHistorial(estado) : entradasDe(estado, filtroHistorial);
  $('historial-resumen').textContent = textoResumen(estado, filtroHistorial); // AC-3.3, AC-3.4, AC-3.6
  $('historial-lista').replaceChildren(...(lista.length === 0
    ? [elemento('p', textoVacio(estado, filtroHistorial))]
    : lista.map(filaDeHistorial)));
}

// Fila de una entrada (AC-2.4): icono y nombre, persona · espacio · día, y cinco estrellas. Según `estadoDeCalificacion`, las estrellas se
// pueden tocar (libre, mía) o no (propia, bloqueada), y solo una calificación mía ofrece "Quitar" (AC-4.1, AC-4.3, AC-5.1, AC-5.5).
function filaDeHistorial(entrada) {
  const situacion = estadoDeCalificacion(entrada, jugador.id);
  const titulo = elemento('div');
  titulo.append(elemento('span', GLIFO_ICONO[entrada.icono], 'icono'), elemento('strong', entrada.nombre));
  const estrellas = elemento('span', undefined, 'estrellas');
  for (let k = 1; k <= MAX_ESTRELLAS; k += 1) {
    const boton = elemento('button', entrada.estrellas !== null && k <= entrada.estrellas ? '★' : '☆');
    boton.type = 'button';
    boton.disabled = situacion === 'propia' || situacion === 'bloqueada';
    boton.setAttribute('aria-label', `${k} ${k === 1 ? 'estrella' : 'estrellas'}`);
    boton.addEventListener('click', () => aplicarHistorial(calificar(estado, entrada.id, jugador.id, k, ctx)));
    estrellas.append(boton);
  }
  const pie = elemento('div', undefined, 'pie');
  pie.append(estrellas);
  const nota = textoCalificacion(estado, entrada, jugador.id);
  if (nota) pie.append(elemento('small', nota));
  if (situacion === 'mia') {
    const quitarEstrellas = elemento('button', 'Quitar', 'peligro');
    quitarEstrellas.type = 'button';
    quitarEstrellas.addEventListener('click', () => aplicarHistorial(quitarCalificacion(estado, entrada.id, jugador.id, ctx)));
    pie.append(quitarEstrellas);
  }
  const fila = elemento('div', undefined, 'fila-historial');
  fila.append(titulo, elemento('small', textoLinea(estado, entrada, hoy)), pie);
  return fila;
}

// Aplica una calificación: guarda en el momento (AC-8.2), repinta conservando el desplazamiento (AC-2.7) y mide los 100 ms (AC-2.10).
// Las mismas estrellas no cambian nada (AC-5.3); un rechazo muestra su motivo y no cambia nada (AC-4.7).
function aplicarHistorial(r) {
  if (!r.ok) { $('historial-error').textContent = MENSAJES_HISTORIAL[r.error]; return; }
  $('historial-error').textContent = '';
  if (r.estado === estado) return;
  const t0 = performance.now();
  estado = r.estado;
  guardarEstado();
  const seccion = $('panel-historial').querySelector('section');
  const desplazamiento = seccion.scrollTop;
  pintarHistorial();
  seccion.scrollTop = desplazamiento;
  ultimaRegeneracionMs = performance.now() - t0;
}

$('historial').addEventListener('click', abrirHistorial);
$('historial-cerrar').addEventListener('click', cerrarHistorial);
$('historial-filtro').addEventListener('change', () => {
  filtroHistorial = $('historial-filtro').value || null;
  pintarHistorial();
});
```
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida (sintaxis válida)
- [ ] Run: `cd poc && npm test` — expect: PASS, 299 pruebas (la presentación no cambia las pruebas)
- [ ] Commit: `feat(poc): add the history button and panel with star ratings` (cuerpo: `Plan section: Phase 4: Botón y panel "Historial"` y `Feature: 006-calificaciones-e-historial`)

> **Complexity note** (Phase 4): no hay prueba automática previa porque la fase es solo de presentación (`.claude/rules/testing.md`: sin pruebas que dependan de renderizado real). Toda decisión de qué mostrar y quién puede hacer qué vive en `historial.js`, con sus pruebas de las Fases 2 y 3; la fase se verifica en el navegador y en el teléfono (Fase 5).

---

## Phase 5: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: 299 pruebas, 0 fallos
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida
- [ ] Verificar en el navegador de escritorio (`cd poc && npm start` → http://localhost:8080), con un hogar con un familiar, una mascota y tres actividades que vencen hoy:
  1. En exploración se ven "Editar", "Juega", "Intercambios" e "Historial" apilados a la derecha, sin tapar la cruceta (AC-2.1); en modo edición no se ve "Historial".
  2. Con el historial vacío, "Historial" abre el panel con "Aún no hay actividades hechas" (AC-2.6).
  3. Marcar "Hecho" en tres actividades (una del propietario, una del familiar, una de la mascota) y abrir "Historial": tres filas, la última hecha primero, con icono, nombre, "persona · espacio · Hoy" y estrellas vacías (AC-1.1, AC-1.5, AC-2.3, AC-2.4).
  4. Como el propietario, tocar la estrella 4 en la fila del familiar: se llenan 4 estrellas, aparece "Tu calificación" y "Quitar" (AC-4.2, AC-5.1). Tocar la misma estrella no cambia nada (AC-5.3). Tocar la 2 la cambia. "Quitar" la deja vacía (AC-5.4).
  5. En la fila del propietario, las estrellas están deshabilitadas con "No puedes calificar tus propias actividades" (AC-4.3). La fila de la mascota se puede calificar (AC-4.4).
  6. Cambiar de jugador al familiar (el panel se cierra), abrir "Historial": la calificación del propietario aparece con "Calificó Personaje 1", sin controles (AC-5.5); las del propietario aparecen con estrellas tocables.
  7. Filtrar por el familiar: el resumen dice "<nombre>: 4,0 ★ (1 calificadas)" (AC-3.3); filtrar por alguien sin calificaciones: "<nombre>: sin calificaciones" (AC-3.4); cerrar y reabrir el panel: vuelve a "Todos" (AC-3.10).
  8. Recargar la página: el historial y las calificaciones siguen (AC-8.1). Un nombre de actividad como `<b>x</b>` se muestra como texto (AC-2.8).
- [ ] Verificar el tope y el rendimiento con 200 entradas: en la consola del navegador, con un hogar que tenga al menos una actividad, ejecutar:
```js
const d = JSON.parse(localStorage.getItem('livin:datos:v1'));
const ahora = new Date().toISOString();
d.historial = Array.from({ length: 200 }, (_, i) => ({
  id: `h-${i}`, hogarId: d.hogares[0].id, actividadId: d.actividades[0].id, miembroId: d.miembros[0].id, espacioId: null,
  nombre: `Tarea ${i + 1}`, icono: 'otra', hechaEn: ahora, dia: ahora.slice(0, 10), estrellas: null, calificadoPor: null,
  creadoEn: ahora, actualizadoEn: ahora, creadoPor: d.cuentas[0].id, actualizadoPor: d.cuentas[0].id, eliminadoEn: null,
}));
localStorage.setItem('livin:datos:v1', JSON.stringify(d));
location.reload();
```
  Abrir "Historial": se recorre toda la lista (AC-2.7); calificar una fila muestra el cambio al instante y `regen` queda por debajo de 100 ms (AC-2.10). Marcar un "Hecho" nuevo deja 200 entradas y "Tarea 1" desaparece (AC-6.2).
- [ ] Verificar un hogar guardado con la feature 005 (sin `historial`, `version: 5`) en el navegador: se abre sin aviso, "Historial" muestra el texto de vacío y, tras un cambio, `JSON.parse(localStorage['livin:datos:v1']).version === 6` (AC-8.3).
- [ ] Verificación en el teléfono Android de referencia (la hace el usuario; servir `poc/` en la red local solo mientras dura la prueba y con `Cache-Control: no-cache`, y apagar el servidor después): con 8 familiares, 4 mascotas, el propietario caminando solo, 50 actividades y 200 entradas, el movimiento se mantiene a 60 cuadros por segundo y abrir, filtrar y calificar muestran el resultado en menos de 100 ms; cuatro botones en la esquina superior derecha no tapan la cruceta ni el cartel; una fila cabe en 340 px con sus cinco estrellas y "Quitar" (riesgos de legibilidad de la spec).
- [ ] Escribir `docs/specs/006-calificaciones-e-historial/verification.md` con los resultados (pruebas automáticas, navegador, teléfono) y los límites aceptados.
- [ ] Commit: `feat: complete 006 calificaciones e historial` (cuerpo: `Plan section: Phase 5: Integration Verification` y `Feature: 006-calificaciones-e-historial`)

**Cobertura de FR por fase:** FR-1 y FR-2 → Fase 2; FR-3 → Fases 3 y 4; FR-4 → Fases 3 y 4; FR-5 y FR-6 → Fases 3 y 4; FR-7 → Fases 2 y 3; FR-8 → Fases 1 y 4; FR-9 → Fases 1, 2 y 3.

---

## Quickstart Validation

```bash
cd poc
npm test                      # 299 pruebas, 0 fallos
node --check src/juego.js     # sintaxis de la escena
npm start                     # http://localhost:8080 (teléfono: http://<IP-LAN>:8080)
```

En la app: marcar "Hecho" en una actividad → tocar "Historial" → ver la entrada con "Hoy" y cinco estrellas vacías → cambiar de jugador con "Juega: …" → abrir "Historial" y tocar una estrella en una entrada de otra persona → ver "Tu calificación" y "Quitar" → volver al jugador original, ver "Calificó <nombre>" con las estrellas bloqueadas → filtrar por la persona acreditada y ver su promedio → recargar la página y comprobar que todo sigue.

