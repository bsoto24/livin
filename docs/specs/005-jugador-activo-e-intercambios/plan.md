# Implementation Plan: Jugador activo e intercambios

**Spec:** docs/specs/005-jugador-activo-e-intercambios/spec.md (v1.0.0)
**Decisions:** docs/adr/005-jugador-activo-movimiento-unificado.md, docs/adr/005-intercambios-formato-v5.md
**Data model:** docs/specs/005-jugador-activo-e-intercambios/data-model.md
**Created:** 2026-10-08

## Global Constraints

- **Jugador activo:** pueden jugar el propietario y los familiares activos; nunca las mascotas. Es estado del dispositivo: se guarda como campo opcional `jugadorId` de la posición (`livin:posicion:v1`), junto con la posición de quien juega. Sin ese campo, o con un jugador que ya no puede jugar, juega el propietario.
- **Móviles:** todos los miembros salvo quien juega (el propietario incluido, sin objetivo: pasea al azar por toda la casa). Un familiar que juega no tiene objetivo de rutina. Cambiar de jugador no mueve a nadie, salvo al familiar fuera de casa que se elige, que aparece en la entrada (o en la casilla libre más cercana por camino si está ocupada).
- **Intercambio:** una actividad pendiente de quien propone (ofrecida) por una pendiente de otra persona (pedida). Ninguna mascota participa. Una actividad está a lo sumo en una propuesta vigente; una repetitiva con regreso pendiente no se ofrece ni se pide; hasta 20 propuestas vigentes por hogar (se aplica al crear).
- **Estados de una propuesta:** `pendiente`, `aceptado`, `rechazado`, `retirado`. **Vigente** = `pendiente` con sus dos actividades pendientes y sin ningún cambio desde que se propuso (la marca `actualizadoEn` de cada una igual a la guardada). La vigencia se calcula, no se guarda. Renombrar a una persona o a un espacio no toca las actividades y por eso no anula; el paso de los días tampoco.
- **Aceptar** (solo la destinataria, solo una vigente): intercambia los `miembroId` de las dos actividades. En cada repetitiva, `devolverA` guarda al responsable original; en una puntual queda en `null`. **Rechazar** (la destinataria) y **retirar** (quien propuso) solo valen para vigentes; **quitar** (cualquiera de las dos personas) solo para las no vigentes y las deja `rechazado` si las quita la destinataria o `retirado` si las quita quien propuso. Los registros nunca se borran.
- **Regreso pendiente (`devolverA`):** "Hecho" en una repetitiva con regreso avanza su vencimiento a hoy más su frecuencia y la devuelve a su responsable original (si ese ya no está activo, se queda con quien la tiene). Se borra al reasignarla a otra persona desde su ficha, al volverla puntual y al eliminar a su responsable original. Editar sin cambiar a la persona responsable lo conserva. Si se elimina a quien la tiene, se elimina con él (baja en cascada por responsable actual).
- **La nota "por intercambio (vuelve a <nombre>)"** solo se muestra en las repetitivas con regreso pendiente (hoja, ficha de edición y lista del panel).
- **Documento `version: 5`** en la misma clave `livin:datos:v1`, con `intercambios: []` y `devolverA` en cada actividad. Las versiones 1 a 4 se migran al cargar (cadena de migraciones puras) y se guardan como v5 en el siguiente guardado. Se validan solo las actividades no eliminadas (su `devolverA`) y las propuestas `pendiente` (estado, referencias a ids que existen en el documento y marcas de texto); de las resueltas solo se exige un estado de la lista.
- **Botones y paneles** (solo en exploración): "Juega: <nombre>" y "Intercambios" (con "(n)" si quien juega tiene propuestas recibidas vigentes) en la esquina superior derecha, debajo de "Editar". Al cambiar de jugador se cierran las hojas y los paneles. La etiqueta de nombre de quien juega se dibuja resaltada, y solo la suya.
- **Rendimiento:** 60 cuadros por segundo con 8 familiares, 4 mascotas, el propietario caminando solo y 50 actividades; el cambio de jugador y las acciones del panel muestran el resultado en menos de 100 ms. Los textos del usuario se insertan siempre como texto, nunca como marcado.
- Ningún dato sale del dispositivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs; arte de marcador original. Modelo, intercambios y movimiento no importan Phaser ni el DOM.

**Pre-implementation gates:**
- *Simplicity:* siguen siendo 3 componentes. Dominio (`catalogo.js`, `hogar.js`, `almacen.js`, `actividades.js` y el nuevo `intercambios.js`), lógica pura de mapa, tiempo y movimiento (`movimiento.js`, con `cambiarJugador`) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* un único modelo canónico (objetos planos del estado guardado). La vigencia, los avisos y las listas del panel son resultados de funciones puras, no vistas guardadas ni clases. Phaser y el DOM se usan directamente. ✓
- *Integration-First:* los contratos (exportaciones, estados, mensajes, formato v5) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que en un teléfono compartido cada persona del hogar juegue como ella misma, y que dos personas puedan acordar cambiar una tarea por otra desde la app. Cubre el jugador activo (selector, cambio sin saltos, familiar fuera de casa, continuidad al reabrir), los intercambios (proponer, responder, retirar, quitar; efecto de aceptar; vigencia) y el formato guardado v5 con migración desde los hogares de las features 001 a 004. Todo cubierto por pruebas automáticas (207 existentes + 46 nuevas = 253).

Archivos (bajo `poc/`):
- **Lógica:** `src/catalogo.js` (estados y límite), `src/hogar.js` (hogar inicial v5, jugador, baja de un miembro que limpia regresos), `src/almacen.js` (formato v5), `src/actividades.js` (regreso pendiente), `src/intercambios.js` (nuevo), `src/movimiento.js` (`cambiarJugador`).
- **Presentación:** `src/juego.js`, `index.html`.
- **Pruebas en `test/`:** `contrato-intercambios.test.js`, `almacen.test.js`, `habitantes.test.js`, `contrato-rutinas.test.js`, `actividades.test.js`, `intercambios.test.js`, `jugador.test.js`.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-7, FR-8, FR-9, FR-10 (contrato), FR-1, FR-2, FR-6, FR-12 (contrato) | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/contrato-intercambios.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de nombres exportados por `src/catalogo.js` (`ESTADOS_INTERCAMBIO`, `LIMITE_INTERCAMBIOS = 20`), `src/hogar.js` (`propietarioDe`, `personasQueJuegan`, `puedeJugar`, `jugadorInicial`; el hogar inicial con `version: 5` e `intercambios: []`), `src/almacen.js` (`migrarAV5`), `src/intercambios.js` (consultas, operaciones, textos y `MENSAJES_INTERCAMBIO`) y `src/movimiento.js` (`cambiarJugador`).

Fija la forma pública de lo nuevo antes de implementarlo. La prueba de contrato queda en rojo (`ERR_MODULE_NOT_FOUND` o exportaciones que faltan) hasta el final de la Fase 4; las Fases 1 a 4 se verifican con sus propios archivos de prueba.

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato-intercambios.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as intercambios from '../src/intercambios.js';
import * as movimiento from '../src/movimiento.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo de intercambios: estados y límite', () => {
  assert.deepEqual(Object.keys(catalogo.ESTADOS_INTERCAMBIO), ['pendiente', 'aceptado', 'rechazado', 'retirado']);
  assert.equal(catalogo.LIMITE_INTERCAMBIOS, 20);
});

test('contrato del modelo y del almacén: jugador activo, hogar inicial v5 y migración', () => {
  for (const f of ['propietarioDe', 'personasQueJuegan', 'puedeJugar', 'jugadorInicial']) assert.equal(typeof hogar[f], 'function', f);
  assert.equal(typeof almacen.migrarAV5, 'function');
  const e = hogar.crearHogarInicial(crearCtx());
  assert.deepEqual([e.version, e.intercambios], [5, []]);
});

test('contrato de los intercambios: funciones y mensajes', () => {
  for (const f of ['buscarIntercambio', 'esVigente', 'intercambiosVigentes', 'numeroRecibidas', 'intercambiosDe', 'actividadesOfrecibles',
    'actividadesPedibles', 'motivoSinPropuesta', 'proponer', 'aceptar', 'rechazar', 'retirar', 'quitar', 'textoIntercambio',
    'textoPropuesta']) {
    assert.equal(typeof intercambios[f], 'function', f);
  }
  for (const clave of ['proponente', 'ofrecida-ajena', 'pedida-propia', 'pedida-mascota', 'no-pendiente', 'ya-en-propuesta', 'regreso',
    'limite', 'no-encontrado', 'destinataria', 'autor', 'no-vigente', 'participante', 'sigue-vigente']) {
    assert.equal(typeof intercambios.MENSAJES_INTERCAMBIO[clave], 'string', clave);
  }
});

test('contrato del movimiento: cambio de jugador', () => {
  assert.equal(typeof movimiento.cambiarJugador, 'function');
});
```

- [ ] Run: `cd poc && node --test test/contrato-intercambios.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/intercambios.js`)
- [ ] Commit: `test(poc): add contract tests for active player and exchanges` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 1: Formato guardado v5 y migración

**Implements:** FR-12 (registro guardado) | **Satisfies:** AC-10.1, AC-10.3, AC-10.4, AC-10.5, AC-10.6, AC-10.7, AC-11.3 (datos)
**Files:** `poc/src/catalogo.js`, `poc/src/hogar.js`, `poc/src/almacen.js`, `poc/test/almacen.test.js`, `poc/test/habitantes.test.js`, `poc/test/contrato-rutinas.test.js`
**Interfaces:** Consumes: `enLista` y las validaciones de las versiones 1 a 4 (001 a 004); `crearHogarInicial`. Produces: desde `catalogo.js`: `ESTADOS_INTERCAMBIO` (clave → etiqueta) y `LIMITE_INTERCAMBIOS = 20`. Desde `hogar.js`: `crearHogarInicial(ctx)` devuelve `version: 5` e `intercambios: []`. Desde `almacen.js`: `migrarAV5(estado)` → documento v5 (pura); `crearAlmacen(storage).cargar()` acepta `version` 1 a 4 (cadena de migraciones) y 5 (valida también el regreso pendiente de las actividades activas y las propuestas pendientes), y devuelve `{ estado: null, error: 'ilegible' }` en cualquier otro caso. Las claves `CLAVE_DATOS` y `CLAVE_POSICION` no cambian.

Implementa el ADR de intercambios en el almacén. Una actividad activa tiene un regreso válido si `devolverA` es `null` o, siendo repetitiva, el id de una **persona activa** distinta de su responsable. Una propuesta `pendiente` es válida si tiene personas y actividades que existen en el documento (eliminadas incluidas, porque su vigencia se calcula) y marcas de texto; de las resueltas solo se exige un estado de la lista. Las pruebas existentes que fijaban la versión 4 pasan a fijar la 5, y los documentos que simulan versiones anteriores dejan de llevar `intercambios` y `devolverA`, como los reales.

- [ ] En `test/habitantes.test.js`, reemplazar la prueba `'FR-1, AC-9.4 (002), FR-11 (003), FR-10 (004): el hogar inicial tiene versión 4, ...'` (sus tres primeras líneas de cuerpo) por:
```js
test('FR-1, AC-9.4 (002), FR-11 (003), FR-10 (004), FR-12 (005): el hogar inicial tiene versión 5, sin actividades, bloques ni intercambios, y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 5);
  assert.deepEqual([e.actividades, e.bloques, e.intercambios], [[], [], []]);
```
  (las líneas siguientes de la prueba no cambian)

- [ ] En `test/contrato-rutinas.test.js`, en la prueba `'contrato del modelo y del almacén: consultas de bloques, hogar inicial v4 y migración'`: cambiar `hogar inicial v4` por `hogar inicial v5` en el título y `assert.deepEqual([e.version, e.bloques], [4, []]);` por `assert.deepEqual([e.version, e.bloques], [5, []]);`.

- [ ] En `test/almacen.test.js`, hacer estos reemplazos exactos:
  1. La línea de import de `../src/almacen.js` por:
```js
import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, migrarAV4, migrarAV5, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
```
  2. En `comoV1`, `function comoV1(estado) {\n  const { actividades, bloques, ...resto } = estado;` por `function comoV1(estado) {\n  const { actividades, bloques, intercambios, ...resto } = estado;`.
  3. En `comoV2`, `function comoV2(estado) {\n  const { actividades, bloques, ...resto } = estado;` por `function comoV2(estado) {\n  const { actividades, bloques, intercambios, ...resto } = estado;`.
  4. `comoV3` completa por:
```js
function comoV3(estado) {
  const { bloques, intercambios, ...resto } = estado;
  return { ...resto, version: 3, actividades: estado.actividades.map(({ devolverA, ...a }) => a) };
}
```
  5. En `actividadGuardada`, `tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null, hechaEn: null,` por `tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null, hechaEn: null, devolverA: null,`.
  6. Todas las apariciones (3) de `assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 4);` por la misma línea con `5`; todas las apariciones (3) de `se guarda como versión 4 en el siguiente guardado` por `se guarda como versión 5 en el siguiente guardado`; todas las apariciones (3) de `ya en versión 4 en memoria` por `ya en versión 5 en memoria`.
  7. `assert.equal(estado.version, 4);` por `assert.equal(estado.version, 5);` y, en el título de esa prueba, `se guardan y se restauran igual, en versión 4` por `se guardan y se restauran igual, en versión 5`.
  8. En la prueba de claves del documento, `'hogares', 'membresias', 'miembros', 'version']` por `'hogares', 'intercambios', 'membresias', 'miembros', 'version']`.

- [ ] Agregar al final de `test/almacen.test.js`:
```js
// Documento como lo guardaba la feature 004: versión 4, sin intercambios ni regreso pendiente en las actividades.
function comoV4(estado) {
  const { intercambios, ...resto } = estado;
  return { ...resto, version: 4, actividades: estado.actividades.map(({ devolverA, ...a }) => a) };
}

// Propuesta guardada tal como la escribe la feature 005 (para probar el almacén sin depender de sus operaciones).
function intercambioGuardado(estado, id, extra = {}) {
  const [propietario, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, proponenteId: propietario.id, destinatarioId: diana.id,
    actividadOfrecidaId: 'act-5', actividadPedidaId: 'act-4',
    marcaOfrecida: '2026-10-08T10:00:00.000Z', marcaPedida: '2026-10-08T10:00:00.000Z',
    estado: 'pendiente', respondidoEn: null,
    creadoEn: '2026-10-08T10:00:00.000Z', actualizadoEn: '2026-10-08T10:00:00.000Z',
    creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1', eliminadoEn: null, ...extra,
  };
}

// Hogar con un intercambio ya aceptado ("Barrer", repetitiva, está con Diana y vuelve al propietario; los platos pasaron al
// propietario) y una propuesta pendiente ("Basura" del propietario por "Plantas" de Diana).
function hogarConIntercambios(ctx) {
  const e = hogarConBloques(ctx);
  const [propietario, diana] = e.miembros;
  const [act1, act2, act3] = e.actividades;
  return {
    ...e,
    actividades: [
      { ...act1, miembroId: propietario.id },
      { ...act2, miembroId: diana.id, devolverA: propietario.id },
      act3,
      actividadGuardada(e, 'act-4', { nombre: 'Plantas', icono: 'plantas', espacioId: null }),
      actividadGuardada(e, 'act-5', { nombre: 'Basura', icono: 'basura', miembroId: propietario.id, espacioId: null }),
    ],
    intercambios: [
      intercambioGuardado(e, 'int-1', {
        estado: 'aceptado', actividadOfrecidaId: 'act-2', actividadPedidaId: 'act-1', respondidoEn: '2026-10-08T11:00:00.000Z',
      }),
      intercambioGuardado(e, 'int-2'),
    ],
  };
}

const conIntercambio = (base, nuevo) => ({ ...base, intercambios: base.intercambios.map((i) => (i.id === nuevo.id ? nuevo : i)) });

test('AC-10.1 (005): los intercambios y el regreso pendiente se guardan y se restauran igual, en versión 5', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConIntercambios(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.equal(estado.version, 5);
  assert.equal(estado.actividades[1].devolverA, e.miembros[0].id);
});

test('AC-10.3 (005): un hogar de la feature 004 se abre sin aviso, sin intercambios ni regresos, y se guarda como versión 5 en el siguiente guardado', () => {
  const e = hogarConBloques(crearCtx());
  const textoV4 = JSON.stringify(comoV4(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV4 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, habitantes, actividades y bloques, sin intercambios; ya en versión 5 en memoria
  assert.ok(estado.actividades.every((a) => a.devolverA === null));
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV4); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 5);
});

test('migrarAV5 es pura: no modifica el documento de entrada y solo agrega el regreso vacío y la lista de intercambios vacía', () => {
  const v4 = comoV4(hogarConBloques(crearCtx()));
  const copia = structuredClone(v4);
  const v5 = migrarAV5(v4);
  assert.deepEqual(v4, copia);
  assert.equal(v5.version, 5);
  assert.deepEqual(v5.intercambios, []);
  assert.ok(v5.actividades.every((a) => a.devolverA === null));
  assert.deepEqual(comoV4(v5), v4);
});

test('AC-10.4 (005): un regreso pendiente inválido en una actividad activa vuelve ilegible el documento', () => {
  const base = hogarConIntercambios(crearCtx());
  const [act1, act2] = base.actividades;
  const [, diana, firulais] = base.miembros;
  const { devolverA, ...sinCampo } = act2;
  const variantes = [
    { ...act2, devolverA: 'no-existe' },
    { ...act2, devolverA: diana.id }, // su propio responsable
    { ...act2, devolverA: firulais.id }, // una mascota
    { ...act1, devolverA: diana.id }, // una puntual no recuerda a nadie
    sinCampo,
  ];
  for (const mala of variantes) {
    const { estado, aviso } = abrirDatos(conActividad(base, mala));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(mala));
    assert.deepEqual(estado.intercambios, []);
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-10.5 (005): un documento v5 sin lista de intercambios, o con una propuesta pendiente inválida, es ilegible', () => {
  const base = hogarConIntercambios(crearCtx());
  const [, pendiente] = base.intercambios;
  const { intercambios, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const variantes = [
    { ...pendiente, estado: 'anulado' },
    { ...pendiente, estado: 'toString' },
    { ...pendiente, proponenteId: 'no-existe' },
    { ...pendiente, destinatarioId: 'no-existe' },
    { ...pendiente, actividadOfrecidaId: 'no-existe' },
    { ...pendiente, actividadPedidaId: 'no-existe' },
    { ...pendiente, marcaOfrecida: null },
    { ...pendiente, marcaPedida: 7 },
  ];
  for (const malo of variantes) {
    const { estado, aviso } = abrirDatos(conIntercambio(base, malo));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.deepEqual(estado.intercambios, []);
  }
});

test('AC-10.6 (005): una propuesta ya respondida con datos inválidos, o una actividad eliminada con un regreso inválido, no vuelve ilegible el documento', () => {
  const base = hogarConIntercambios(crearCtx());
  const malo = { ...base.intercambios[0], proponenteId: 'no-existe', actividadPedidaId: 'no-existe', marcaOfrecida: null };
  for (const resuelto of ['aceptado', 'rechazado', 'retirado']) {
    const guardado = conIntercambio(base, { ...malo, estado: resuelto });
    const { estado, aviso } = abrirDatos(guardado);
    assert.equal(aviso, null, resuelto);
    assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
  }
  const eliminada = { ...base.actividades[1], devolverA: 'no-existe', eliminadoEn: '2026-10-08T12:00:00.000Z' };
  const guardado = conActividad(base, eliminada);
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
});

test('AC-10.7 (005): el documento guardado no tiene vigencia calculada, números de propuestas ni posiciones', () => {
  const storage = almacenEnMemoria();
  crearAlmacen(storage).guardar(hogarConIntercambios(crearCtx()));
  const guardado = JSON.parse(storage.datos.get(CLAVE_DATOS));
  assert.deepEqual(Object.keys(guardado).sort(), ['actividades', 'bloques', 'cuentas', 'espacios', 'hogares', 'intercambios', 'membresias',
    'miembros', 'version']);
  for (const i of guardado.intercambios) {
    assert.deepEqual(Object.keys(i).sort(), ['actividadOfrecidaId', 'actividadPedidaId', 'actualizadoEn', 'actualizadoPor', 'creadoEn',
      'creadoPor', 'destinatarioId', 'eliminadoEn', 'estado', 'hogarId', 'id', 'marcaOfrecida', 'marcaPedida', 'proponenteId', 'respondidoEn']);
  }
});
```

- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js test/contrato-rutinas.test.js` — expect: FAIL (`SyntaxError`: `../src/almacen.js` no exporta `migrarAV5`; y los hogares iniciales siguen en versión 4)
- [ ] Agregar al final de `src/catalogo.js`:
```js

// Intercambios (feature 005): estados de una propuesta y límite de propuestas vigentes. Las claves se guardan; las etiquetas se muestran.
export const ESTADOS_INTERCAMBIO = { pendiente: 'Pendiente', aceptado: 'Aceptado', rechazado: 'Rechazado', retirado: 'Retirado' };
export const LIMITE_INTERCAMBIOS = 20;
```

- [ ] En `src/hogar.js`, en `crearHogarInicial`, reemplazar el comentario y el `return` finales:
```js
  // Documento versión 5 (ADR-005 de intercambios): el hogar empieza sin actividades, bloques de rutina ni intercambios.
  return {
    version: 5, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [], bloques: [],
    intercambios: [],
  };
```
  (reemplaza el comentario `// Documento versión 4 (ADR-004 de modelo de rutinas): ...` y el `return { version: 4, ... };` anteriores)

- [ ] Reemplazar `src/almacen.js` completo por:
```js
// src/almacen.js
import { crearHogarInicial } from './hogar.js';
import {
  PARENTESCOS, GENEROS, ESPECIES, ICONOS, FRECUENCIAS, DIAS_RUTINA, PASO_RUTINA, ESTADOS_INTERCAMBIO,
} from './catalogo.js';
import { esFechaValida } from './fechas.js';

export const CLAVE_DATOS = 'livin:datos:v1';
export const CLAVE_POSICION = 'livin:posicion:v1';

// Condiciones de la feature 001, comunes a todas las versiones del documento.
function tieneHogarValido(estado) {
  for (const lista of ['cuentas', 'hogares', 'membresias', 'espacios', 'miembros']) {
    if (!Array.isArray(estado[lista])) return false;
  }
  const activos = estado.espacios.filter((e) => e.eliminadoEn === null);
  const cuenta = (tipo) => activos.filter((e) => e.tipo === tipo).length;
  return estado.hogares.length === 1 && cuenta('sala') === 1 && cuenta('cocina') >= 1 && cuenta('dormitorio') >= 1
    && activos.filter((e) => e.tipo === 'bano' && e.contenidoEn === null).length === 1;
}

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);
const nuloOEnLista = (lista, valor) => valor === null || enLista(lista, valor);

// Reglas de los miembros desde la versión 2 (ADR-002 de modelo de miembros, FR-9 de la 002).
// Solo se validan los miembros activos: los eliminados quedan fuera de toda validación (FR-10).
function miembrosValidos(estado) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const activos = estado.miembros.filter((m) => m.eliminadoEn === null);
  if (!propietaria || activos.filter((m) => m.cuentaId === propietaria).length !== 1) return false;
  return activos.every((m) => {
    if (m.tipo === 'mascota') return m.parentesco === null && m.genero === null && enLista(ESPECIES, m.especie);
    if (m.tipo === 'persona') return m.especie === null && nuloOEnLista(PARENTESCOS, m.parentesco) && nuloOEnLista(GENEROS, m.genero);
    return false;
  });
}

// Reglas de las actividades en la versión 3 (ADR-003 de modelo de actividades, FR-11 de la 003).
// Solo se validan las no eliminadas; deben apuntar a un miembro activo y, si tienen espacio, a un espacio activo.
function actividadesValidas(estado) {
  if (!Array.isArray(estado.actividades)) return false;
  const miembros = new Set(estado.miembros.filter((m) => m.eliminadoEn === null).map((m) => m.id));
  const espacios = new Set(estado.espacios.filter((e) => e.eliminadoEn === null).map((e) => e.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null).every((a) => {
    if (typeof a.nombre !== 'string' || !enLista(ICONOS, a.icono) || !esFechaValida(a.vence)) return false;
    if (!miembros.has(a.miembroId) || (a.espacioId !== null && !espacios.has(a.espacioId))) return false;
    if (a.tipo === 'puntual') return a.frecuenciaDias === null && (a.hechaEn === null || esFechaValida(a.hechaEn));
    if (a.tipo === 'repetitiva') return FRECUENCIAS.includes(a.frecuenciaDias) && a.hechaEn === null;
    return false;
  });
}

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

// Regreso pendiente en la versión 5 (ADR-005 de intercambios, FR-12 de la 005). Solo se validan las actividades no eliminadas:
// `devolverA` es null o, en una repetitiva, una persona activa distinta de su responsable.
function regresosValidos(estado) {
  const personas = new Set(estado.miembros.filter((m) => m.eliminadoEn === null && m.tipo === 'persona').map((m) => m.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null)
    .every((a) => a.devolverA === null || (a.tipo === 'repetitiva' && personas.has(a.devolverA) && a.devolverA !== a.miembroId));
}

const esTexto = (valor) => typeof valor === 'string' && valor !== '';

// Propuestas en la versión 5 (ADR-005 de intercambios, FR-12 de la 005). Todas deben tener un estado de la lista; solo las
// pendientes se validan además: personas y actividades que existen en el documento (eliminadas incluidas, porque su vigencia se
// calcula) y marcas de texto. Las resueltas no se validan más.
function intercambiosValidos(estado) {
  if (!Array.isArray(estado.intercambios)) return false;
  const miembros = new Set(estado.miembros.map((m) => m.id));
  const actividades = new Set(estado.actividades.map((a) => a.id));
  return estado.intercambios.every((i) => enLista(ESTADOS_INTERCAMBIO, i.estado)
    && (i.estado !== 'pendiente' || (miembros.has(i.proponenteId) && miembros.has(i.destinatarioId)
      && actividades.has(i.actividadOfrecidaId) && actividades.has(i.actividadPedidaId)
      && esTexto(i.marcaOfrecida) && esTexto(i.marcaPedida))));
}

// Migración pura v1 → v2: todo miembro existente pasa a ser una persona sin parentesco, género ni especie.
export function migrarAV2(estado) {
  return {
    ...estado,
    version: 2,
    miembros: estado.miembros.map((m) => ({ ...m, tipo: 'persona', parentesco: null, genero: null, especie: null })),
  };
}

// Migración pura v2 → v3: el hogar pasa a tener una lista de actividades, vacía.
export function migrarAV3(estado) {
  return { ...estado, version: 3, actividades: [] };
}

// Migración pura v3 → v4: el hogar pasa a tener una lista de bloques de rutina, vacía.
export function migrarAV4(estado) {
  return { ...estado, version: 4, bloques: [] };
}

// Migración pura v4 → v5: ninguna actividad tiene regreso pendiente y el hogar pasa a tener una lista de intercambios, vacía.
export function migrarAV5(estado) {
  return { ...estado, version: 5, actividades: estado.actividades.map((a) => ({ ...a, devolverA: null })), intercambios: [] };
}

export function crearAlmacen(storage) {
  return {
    cargar() {
      try {
        const texto = storage.getItem(CLAVE_DATOS);
        if (texto === null) return { estado: null, error: null };
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) {
          return { estado: migrarAV5(migrarAV4(migrarAV3(migrarAV2(estado)))), error: null };
        }
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidos(estado)) {
          return { estado: migrarAV5(migrarAV4(migrarAV3(estado))), error: null };
        }
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)) {
          return { estado: migrarAV5(migrarAV4(estado)), error: null };
        }
        if (estado?.version === 4 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)
          && bloquesValidos(estado)) {
          return { estado: migrarAV5(estado), error: null };
        }
        if (estado?.version === 5 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado)) {
          return { estado, error: null };
        }
        return { estado: null, error: 'ilegible' };
      } catch {
        return { estado: null, error: 'ilegible' };
      }
    },
    guardar(estado) {
      try { storage.setItem(CLAVE_DATOS, JSON.stringify(estado)); return { ok: true }; } catch { return { ok: false }; }
    },
    cargarPosicion() {
      try { return JSON.parse(storage.getItem(CLAVE_POSICION)); } catch { return null; }
    },
    guardarPosicion(posicion) {
      try { storage.setItem(CLAVE_POSICION, JSON.stringify(posicion)); return { ok: true }; } catch { return { ok: false }; }
    },
  };
}

// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002, FR-11 de la 003, FR-10 de la 004, FR-12 de la 005): recupera el hogar
// (migrándolo si es de una versión anterior) o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar();
  if (estado) return { estado, aviso: null };
  const nuevo = crearHogarInicial(ctx);
  almacen.guardar(nuevo);
  return { estado: nuevo, aviso: error === 'ilegible' ? 'No se pudo recuperar tu hogar guardado. Se creó un hogar nuevo.' : null };
}
```

- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js test/contrato-rutinas.test.js` — expect: PASS (`# fail 0`; las pruebas de almacén pasan de 28 a 35 y las de habitantes y de contrato de rutinas siguen igual en número)
- [ ] Run: `cd poc && npm test` — expect: solo falla `test/contrato-intercambios.test.js` (`ERR_MODULE_NOT_FOUND` para `src/intercambios.js`); todo lo demás pasa
- [ ] Commit: `feat(poc): save homes in format v5 with exchanges and pending returns` (cuerpo: `Plan section: Phase 1: Formato guardado v5 y migración` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 2: Regreso pendiente en las actividades

**Implements:** FR-9 (regreso pendiente) | **Satisfies:** AC-8.4, AC-8.5, AC-8.10, AC-8.11, AC-8.12, AC-8.13
**Files:** `poc/src/actividades.js`, `poc/src/hogar.js`, `poc/test/actividades.test.js`
**Interfaces:** Consumes: `tocar`, `buscarMiembro` (001/002); `marcarHecha`, `editarActividad`, `agregarActividad` (003). Produces: toda actividad nueva nace con `devolverA: null`; `marcarHecha` devuelve una repetitiva con regreso pendiente a su responsable original; `editarActividad` conserva el regreso solo si la actividad sigue siendo repetitiva y con la misma persona responsable; `eliminarHabitante` borra el `devolverA` de las actividades que debían volver al miembro eliminado (y da de baja a las que tenía en su poder, como hasta ahora).

Implementa el regreso del ADR de intercambios, sin intercambios todavía: el campo, su mantenimiento y sus tres reglas de borrado. Las pruebas simulan el efecto de aceptar dejando una repetitiva en poder de otra persona con `devolverA` a mano.

- [ ] Agregar al final de `test/actividades.test.js`:
```js
// ---------- Regreso pendiente (feature 005): una repetitiva en poder de otra persona vuelve a su responsable al hacerla ----------

// Deja una actividad en poder de `quien` recordando a su responsable original (lo que hará aceptar un intercambio).
const enPoderDe = (estado, id, quien) => ({
  ...estado,
  actividades: estado.actividades.map((a) => (a.id === id ? { ...a, devolverA: a.miembroId, miembroId: quien } : a)),
});

test('FR-9 (005): toda actividad nueva nace sin regreso pendiente', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const e = alta(alta(base, datos(base), ctx), datos(base, { tipo: 'repetitiva', frecuenciaDias: 7 }), ctx);
  assert.deepEqual(e.actividades.map((a) => a.devolverA), [null, null]);
});

test('AC-8.4 (005): "Hecho" en una repetitiva con regreso pendiente la devuelve a su responsable con su nuevo vencimiento', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const propietario = miembrosActivos(base)[0];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 3, vence: '2026-10-04', miembroId: propietario.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const despues = marcarHecha(e, id, HOY, ctx);
  const a = buscarActividad(despues, id);
  assert.deepEqual([a.miembroId, a.devolverA, a.vence, a.hechaEn], [propietario.id, null, '2026-10-09', null]);
  assert.equal(contarActividades(despues), 1);
});

test('AC-8.5 (005): una puntual en poder de otra persona no recuerda a nadie y "Hecho" solo la deja hecha', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  let e = alta(base, datos(base, { miembroId: miembrosActivos(base)[0].id }), ctx);
  const { id } = ultima(e);
  e = { ...e, actividades: e.actividades.map((a) => ({ ...a, miembroId: diana(e).id })) };
  const a = marcarHecha(e, id, HOY, ctx).actividades.find((x) => x.id === id);
  assert.deepEqual([a.miembroId, a.hechaEn, a.devolverA], [diana(e).id, HOY, null]);
});

test('AC-8.10 (005): si el responsable original ya no está activo, la repetitiva se queda con quien la tiene', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const propietario = miembrosActivos(base)[0];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 7, miembroId: propietario.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const sinOriginal = { ...e, miembros: e.miembros.map((m) => (m.id === propietario.id ? { ...m, eliminadoEn: '2026-10-06T00:00:00.000Z' } : m)) };
  const a = buscarActividad(marcarHecha(sinOriginal, id, HOY, ctx), id);
  assert.deepEqual([a.miembroId, a.devolverA, a.vence], [diana(e).id, null, '2026-10-13']);
});

test('AC-8.11, AC-8.12 (005): reasignar o volver puntual borra el regreso; guardar sin cambiar a la persona lo conserva', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const propietario = miembrosActivos(base)[0];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 7, miembroId: propietario.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const a = buscarActividad(e, id);
  const datosDe = (extra) => buscarActividad(editarActividad(e, id, { ...a, ...extra }, ctx).estado, id);
  assert.deepEqual([datosDe({ nombre: 'Otro nombre' }).miembroId, datosDe({ nombre: 'Otro nombre' }).devolverA], [diana(e).id, propietario.id]);
  assert.equal(datosDe({ miembroId: mascotas(e)[0].id }).devolverA, null);
  assert.deepEqual([datosDe({ miembroId: propietario.id }).miembroId, datosDe({ miembroId: propietario.id }).devolverA], [propietario.id, null]);
  const puntual = datosDe({ tipo: 'puntual' });
  assert.deepEqual([puntual.tipo, puntual.devolverA, puntual.miembroId], ['puntual', null, diana(e).id]);
});

test('AC-8.13 (005): eliminar al responsable original borra el regreso; eliminar a quien la tiene la elimina y se cuenta en sus pendientes', () => {
  const ctx = crearCtx();
  let base = agregarHabitante(hogarBase(ctx), 'familiar', { nombre: 'Luis', parentesco: 'hermano', genero: 'masculino' }, ctx).estado;
  const luis = familiares(base)[1];
  let e = alta(base, datos(base, { tipo: 'repetitiva', frecuenciaDias: 7, miembroId: luis.id }), ctx);
  const { id } = ultima(e);
  e = enPoderDe(e, id, diana(e).id);
  const sinLuis = eliminarHabitante(e, luis.id, ctx);
  const a = buscarActividad(sinLuis, id);
  assert.deepEqual([a.miembroId, a.devolverA], [diana(e).id, null]);
  assert.equal(pendientesDeMiembro(e, diana(e).id), 1);
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.equal(buscarActividad(sinDiana, id), null);
  assert.notEqual(sinDiana.actividades.find((x) => x.id === id).eliminadoEn, null);
});
```

- [ ] Run: `cd poc && node --test test/actividades.test.js` — expect: FAIL (las pruebas nuevas: `devolverA` es `undefined` en las actividades nuevas y "Hecho" no devuelve la actividad)
- [ ] En `src/actividades.js`, en `agregarActividad`, reemplazar la línea `const actividad = ...` por:
```js
  const actividad = { id: ctx.nuevoId(), hogarId: estado.hogares[0].id, ...v.datos, hechaEn: null, devolverA: null, ...auditoriaNueva(ctx) };
```

- [ ] En `src/actividades.js`, reemplazar `editarActividad` completa por:
```js
export function editarActividad(estado, id, datos, ctx) {
  const actual = buscarActividad(estado, id);
  if (!actual) return { ok: false, error: 'no-encontrada', estado };
  const v = validarActividad(estado, datos);
  if (v.error) return { ok: false, error: v.error, estado };
  // El regreso pendiente sobrevive solo si sigue siendo repetitiva y con la misma persona responsable (FR-9 de la 005).
  const devolverA = v.datos.tipo === 'repetitiva' && v.datos.miembroId === actual.miembroId ? (actual.devolverA ?? null) : null;
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...v.datos, devolverA } : a));
  return { ok: true, estado: { ...estado, actividades } };
}
```

- [ ] En `src/actividades.js`, reemplazar `marcarHecha` completa y su comentario por:
```js
// "Hecho" (FR-3): solo para una actividad por hacer (vence hoy o antes). La puntual registra el día; la repetitiva vuelve a vencer
// hoy más su frecuencia, sin acumular atrasos, y, si estaba en poder de otra persona por un intercambio, vuelve a su responsable
// original (si ese ya no está activo, se queda con quien la tiene; FR-9 de la 005).
export function marcarHecha(estado, id, hoy, ctx) {
  const actividad = buscarActividad(estado, id);
  if (!actividad || diasEntre(actividad.vence, hoy) < 0) return estado;
  let cambio = { hechaEn: hoy };
  if (actividad.tipo === 'repetitiva') {
    cambio = { vence: sumarDias(hoy, actividad.frecuenciaDias), devolverA: null };
    if (actividad.devolverA && buscarMiembro(estado, actividad.devolverA)) cambio.miembroId = actividad.devolverA;
  }
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...cambio } : a));
  return { ...estado, actividades };
}
```

- [ ] En `src/hogar.js`, reemplazar `eliminarHabitante` completa y su comentario por:
```js
// Borrado lógico (FR-4, FR-10 de la 002): el registro queda con su fecha de eliminación; no afecta a los espacios ni a los
// demás miembros. Sus actividades y sus bloques de rutina se dan de baja en la misma operación (FR-9 de la 003 y de la 004), y
// las repetitivas que debían volver a él se quedan con quien las tiene (FR-9 de la 005).
export function eliminarHabitante(estado, id, ctx) {
  if (!puedeEliminarMiembro(estado, id)) return estado;
  const ahora = ctx.ahora();
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), eliminadoEn: ahora } : m));
  const sinActividades = darDeBajaActividades({ ...estado, miembros }, (a) => a.miembroId === id, ahora, ctx);
  const sinRegresos = quitarRegresosA(sinActividades, id, ctx);
  return darDeBajaBloques(sinRegresos, (b) => b.miembroId === id, ahora, ctx);
}
```

- [ ] En `src/hogar.js`, agregar después de `darDeBajaActividades`:
```js

// Las actividades activas que debían volver a esta persona dejan de recordarla (FR-9 de la 005).
function quitarRegresosA(estado, id, ctx) {
  const actividades = estado.actividades.map((a) => (a.eliminadoEn === null && a.devolverA === id ? { ...tocar(a, ctx), devolverA: null } : a));
  return { ...estado, actividades };
}
```

- [ ] Run: `cd poc && node --test test/actividades.test.js test/almacen.test.js test/hogar.test.js test/habitantes.test.js test/rutinas.test.js` — expect: PASS (`# fail 0`; actividades pasa de 30 a 36 pruebas)
- [ ] Commit: `feat(poc): keep a repeating activity's original owner while it is exchanged` (cuerpo: `Plan section: Phase 2: Regreso pendiente en las actividades` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 3: Intercambios

**Implements:** FR-7, FR-8, FR-9 (efecto de aceptar), FR-10, FR-13 | **Satisfies:** AC-6.4, AC-6.5, AC-6.6, AC-6.7, AC-6.9, AC-6.11, AC-7.1 a AC-7.10 (lógica), AC-8.1, AC-8.2, AC-8.3, AC-8.6 (textos), AC-8.8, AC-8.9, AC-8.14, AC-8.15, AC-9.1 a AC-9.9, AC-10.2, AC-11.1 a AC-11.5
**Files:** `poc/src/intercambios.js`, `poc/test/intercambios.test.js`
**Interfaces:** Consumes: `LIMITE_INTERCAMBIOS` (Fase 1); `buscarActividad` (003), `actividadesPendientes`, `miembrosActivos`, `auditoriaNueva`, `tocar` (001 a 003); el regreso pendiente (Fase 2). Produces, desde `intercambios.js`:
- Registro `Intercambio`: `{ id, hogarId, proponenteId, destinatarioId, actividadOfrecidaId, actividadPedidaId, marcaOfrecida, marcaPedida, estado, respondidoEn, ...auditoría }`.
- Consultas: `buscarIntercambio(estado, id)`; `esVigente(estado, intercambio)`; `intercambiosVigentes(estado)`; `numeroRecibidas(estado, personaId)`; `intercambiosDe(estado, personaId)` → `{ recibidas, enviadas }` (pendientes, vigentes o no); `actividadesOfrecibles(estado, personaId)`; `actividadesPedibles(estado, personaId)`; `motivoSinPropuesta(estado, personaId)` → `null | 'limite' | 'nada'`.
- Operaciones, todas → `{ ok, estado, error? }`: `proponer(estado, { proponenteId, ofrecidaId, pedidaId }, ctx)`; `aceptar(estado, id, respondeId, ctx)`; `rechazar(estado, id, respondeId, ctx)`; `retirar(estado, id, quienId, ctx)`; `quitar(estado, id, quienId, ctx)`.
- Textos: `textoIntercambio(estado, actividad)` → `''` o `por intercambio (vuelve a <nombre>)`; `textoPropuesta(estado, intercambio, vista)` con `vista ∈ 'recibida' | 'enviada'`; `MENSAJES_INTERCAMBIO`.

Implementa el ADR de intercambios: un registro por propuesta, la vigencia derivada de la marca `actualizadoEn` de las dos actividades y el efecto de aceptar sobre los responsables. No se toca ninguna operación existente: editar, eliminar, "Hecho" y las bajas en cascada ya actualizan la marca de la actividad con `tocar`.

- [ ] Escribir las pruebas de intercambios:
```js
// test/intercambios.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, eliminarHabitante, renombrarEspacio, renombrarMiembro,
  espaciosActivos, espaciosDeTipo, puedeEliminar, familiares, mascotas, miembrosActivos, pendientesDeMiembro, actividadesPendientes,
} from '../src/hogar.js';
import {
  agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, contarActividades, limpiezaDeEspacio, burbujas,
} from '../src/actividades.js';
import {
  buscarIntercambio, esVigente, intercambiosVigentes, numeroRecibidas, intercambiosDe, actividadesOfrecibles, actividadesPedibles,
  motivoSinPropuesta, proponer, aceptar, rechazar, retirar, quitar, textoIntercambio, textoPropuesta,
} from '../src/intercambios.js';
import { LIMITE_INTERCAMBIOS } from '../src/catalogo.js';
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
const idDe = (estado, nombre) => estado.actividades.find((a) => a.nombre === nombre).id;
const nombres = (lista) => lista.map((a) => a.nombre);
const ultimo = (e) => e.intercambios.at(-1);

// Alta de una actividad de `quien`: una puntual en la cocina que vence hoy; `extra` cambia lo que haga falta.
function nueva(estado, nombre, quien, ctx, extra = {}) {
  const r = agregarActividad(estado, {
    nombre, icono: 'otra', miembroId: quien.id, espacioId: cocina(estado).id, tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
  }, ctx);
  assert.equal(r.ok, true, `${nombre}: ${r.error}`);
  return r.estado;
}

// Escenario: el propietario tiene "Platos" (puntual) y "Barrer" (repetitiva); Diana, "Basura" (puntual) y "Plantas" (repetitiva,
// vence en dos días); Luis, "Ropa"; y la mascota, "Paseo".
function escenario() {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = nueva(e, 'Platos', propietarioDe(e), ctx);
  e = nueva(e, 'Basura', diana(e), ctx);
  e = nueva(e, 'Barrer', propietarioDe(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 7 });
  e = nueva(e, 'Plantas', diana(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 3, vence: '2026-10-08' });
  e = nueva(e, 'Ropa', luis(e), ctx);
  e = nueva(e, 'Paseo', firulais(e), ctx);
  return { ctx, e };
}

function proponerOk(estado, proponente, ofrecida, pedida, ctx) {
  const r = proponer(estado, { proponenteId: proponente.id, ofrecidaId: idDe(estado, ofrecida), pedidaId: idDe(estado, pedida) }, ctx);
  assert.equal(r.ok, true, r.error);
  return r.estado;
}

const proponerYAceptar = (estado, proponente, ofrecida, pedida, ctx) => {
  const p = proponerOk(estado, proponente, ofrecida, pedida, ctx);
  const r = aceptar(p, ultimo(p).id, ultimo(p).destinatarioId, ctx);
  assert.equal(r.ok, true, r.error);
  return r.estado;
};

test('AC-6.4: ofrecibles y pedibles son las pendientes de cada lado, sin las de las mascotas ni las ya incluidas en una propuesta', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  assert.deepEqual(nombres(actividadesOfrecibles(e, P.id)), ['Platos', 'Barrer']);
  assert.deepEqual(nombres(actividadesPedibles(e, P.id)), ['Basura', 'Plantas', 'Ropa']); // Plantas aún no vence y también se puede pedir
  assert.deepEqual(nombres(actividadesOfrecibles(e, diana(e).id)), ['Basura', 'Plantas']);
  const hecha = marcarHecha(e, idDe(e, 'Platos'), HOY, ctx);
  const eliminada = eliminarActividad(e, idDe(e, 'Barrer'), ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(hecha, P.id)), ['Barrer']);
  assert.deepEqual(nombres(actividadesOfrecibles(eliminada, P.id)), ['Platos']);
  const conPropuesta = proponerOk(e, P, 'Platos', 'Basura', ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(conPropuesta, P.id)), ['Barrer']);
  assert.deepEqual(nombres(actividadesPedibles(conPropuesta, P.id)), ['Plantas', 'Ropa']);
  assert.deepEqual(nombres(actividadesPedibles(conPropuesta, luis(e).id)), ['Barrer', 'Plantas']);
});

test('AC-6.5: proponer crea la propuesta vigente y no cambia ninguna actividad, espacio ni miembro', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const despues = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const i = ultimo(despues);
  assert.deepEqual(
    [i.proponenteId, i.destinatarioId, i.actividadOfrecidaId, i.actividadPedidaId, i.estado, i.respondidoEn],
    [P.id, diana(e).id, idDe(e, 'Platos'), idDe(e, 'Basura'), 'pendiente', null],
  );
  assert.equal(i.hogarId, e.hogares[0].id);
  assert.deepEqual([despues.actividades, despues.espacios, despues.miembros], [e.actividades, e.espacios, e.miembros]);
  assert.equal(esVigente(despues, i), true);
  assert.deepEqual(intercambiosVigentes(despues), [i]);
  assert.deepEqual(buscarIntercambio(despues, i.id), i);
  assert.equal(buscarIntercambio(despues, 'no-existe'), null);
});

test('AC-6.9: cada motivo de rechazo de una propuesta se informa y no cambia nada', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const id = (nombre) => idDe(e, nombre);
  const intentar = (estado, extra) => proponer(estado, { proponenteId: P.id, ofrecidaId: id('Platos'), pedidaId: id('Basura'), ...extra }, ctx);
  const casos = [
    [{ proponenteId: 'no-existe' }, 'proponente'],
    [{ proponenteId: firulais(e).id }, 'proponente'],
    [{ ofrecidaId: id('Basura') }, 'ofrecida-ajena'],
    [{ pedidaId: id('Barrer') }, 'pedida-propia'],
    [{ pedidaId: id('Paseo') }, 'pedida-mascota'],
    [{ ofrecidaId: 'no-existe' }, 'no-pendiente'],
    [{ pedidaId: 'no-existe' }, 'no-pendiente'],
  ];
  for (const [extra, error] of casos) {
    const r = intentar(e, extra);
    assert.deepEqual([r.ok, r.error, r.estado === e], [false, error, true], JSON.stringify(extra));
  }
  assert.equal(intentar(marcarHecha(e, id('Platos'), HOY, ctx), {}).error, 'no-pendiente');
  assert.equal(intentar(eliminarActividad(e, id('Basura'), ctx), {}).error, 'no-pendiente');
  const conPropuesta = proponerOk(e, P, 'Platos', 'Basura', ctx);
  assert.equal(intentar(conPropuesta, {}).error, 'ya-en-propuesta');
  assert.equal(intentar(conPropuesta, { ofrecidaId: id('Barrer') }).error, 'ya-en-propuesta'); // la pedida (Basura) ya está en una
  assert.equal(intentar(conPropuesta, { pedidaId: id('Ropa') }).error, 'ya-en-propuesta'); // la ofrecida (Platos) ya está en una
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  assert.equal(proponer(intercambiadas, { proponenteId: P.id, ofrecidaId: id('Plantas'), pedidaId: id('Ropa') }, ctx).error, 'regreso');
  assert.equal(proponer(intercambiadas, { proponenteId: luis(e).id, ofrecidaId: id('Ropa'), pedidaId: id('Barrer') }, ctx).error, 'regreso');
});

test('AC-6.6, AC-6.7: sin actividades que intercambiar, o con 20 propuestas vigentes, no se puede proponer', () => {
  const ctx = crearCtx();
  const vacio = hogarBase(ctx);
  assert.equal(motivoSinPropuesta(vacio, propietarioDe(vacio).id), 'nada');
  const solo = crearHogarInicial(ctx);
  const soloConPlatos = nueva(solo, 'Platos', propietarioDe(solo), ctx);
  assert.equal(motivoSinPropuesta(soloConPlatos, propietarioDe(solo).id), 'nada'); // nadie más a quien pedir
  let e = hogarBase(ctx);
  const P = propietarioDe(e);
  for (let n = 0; n < LIMITE_INTERCAMBIOS; n++) {
    e = nueva(nueva(e, `A${n}`, P, ctx), `B${n}`, diana(e), ctx);
  }
  e = nueva(nueva(e, 'Extra 1', P, ctx), 'Extra 2', luis(e), ctx);
  for (let n = 0; n < LIMITE_INTERCAMBIOS; n++) {
    assert.equal(motivoSinPropuesta(e, P.id), null, `con ${n} propuestas`);
    e = proponerOk(e, P, `A${n}`, `B${n}`, ctx);
  }
  assert.equal(intercambiosVigentes(e).length, LIMITE_INTERCAMBIOS);
  assert.equal(motivoSinPropuesta(e, P.id), 'limite');
  const r = proponer(e, { proponenteId: P.id, ofrecidaId: idDe(e, 'Extra 1'), pedidaId: idDe(e, 'Extra 2') }, ctx);
  assert.deepEqual([r.ok, r.error, r.estado === e], [false, 'limite', true]);
  const una = eliminarActividad(e, idDe(e, 'B0'), ctx); // una propuesta que deja de ser vigente libera un lugar
  assert.equal(intercambiosVigentes(una).length, LIMITE_INTERCAMBIOS - 1);
  assert.equal(motivoSinPropuesta(una, P.id), null);
});

test('AC-6.11, AC-7.1, AC-7.4, AC-7.6: cada persona ve solo sus propuestas recibidas y enviadas, y el número cuenta las vigentes recibidas', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx); // el propietario → Diana
  const i1 = ultimo(p1);
  assert.deepEqual(intercambiosDe(p1, P.id), { recibidas: [], enviadas: [i1] });
  assert.deepEqual(intercambiosDe(p1, diana(e).id), { recibidas: [i1], enviadas: [] });
  assert.deepEqual(intercambiosDe(p1, luis(e).id), { recibidas: [], enviadas: [] });
  assert.deepEqual([P, diana(e), luis(e)].map((m) => numeroRecibidas(p1, m.id)), [0, 1, 0]);
  const p2 = proponerOk(p1, luis(e), 'Ropa', 'Plantas', ctx); // Luis → Diana
  assert.equal(numeroRecibidas(p2, diana(e).id), 2);
  assert.deepEqual(intercambiosDe(p2, luis(e).id).enviadas.map((i) => i.id), [ultimo(p2).id]);
});

test('AC-8.1, AC-8.15: aceptar dos puntuales intercambia a sus responsables y no cambia nada más', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const r = aceptar(p1, ultimo(p1).id, diana(e).id, ctx);
  assert.equal(r.ok, true);
  const despues = r.estado;
  const [platos, basura] = [idDe(e, 'Platos'), idDe(e, 'Basura')].map((id) => despues.actividades.find((a) => a.id === id));
  const antes = [idDe(e, 'Platos'), idDe(e, 'Basura')].map((id) => e.actividades.find((a) => a.id === id));
  assert.deepEqual([platos.miembroId, platos.devolverA, basura.miembroId, basura.devolverA], [diana(e).id, null, P.id, null]);
  const campos = (a) => [a.nombre, a.icono, a.espacioId, a.tipo, a.vence, a.frecuenciaDias, a.hechaEn];
  assert.deepEqual([campos(platos), campos(basura)], [campos(antes[0]), campos(antes[1])]);
  assert.ok(platos.actualizadoEn > antes[0].actualizadoEn && basura.actualizadoEn > antes[1].actualizadoEn);
  const i = buscarIntercambio(despues, ultimo(p1).id);
  assert.deepEqual([i.estado, i.respondidoEn !== null, i.actualizadoEn > ultimo(p1).actualizadoEn], ['aceptado', true, true]);
  assert.deepEqual([esVigente(despues, i), intercambiosVigentes(despues), numeroRecibidas(despues, diana(e).id)], [false, [], 0]);
  assert.deepEqual([despues.espacios, despues.miembros], [e.espacios, e.miembros]);
});

test('AC-8.2, AC-8.3: cada repetitiva recuerda a su responsable original; una puntual no recuerda a nadie', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const dosRepetitivas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  const [barrer, plantas] = ['Barrer', 'Plantas'].map((n) => dosRepetitivas.actividades.find((a) => a.nombre === n));
  assert.deepEqual([barrer.miembroId, barrer.devolverA, plantas.miembroId, plantas.devolverA], [diana(e).id, P.id, P.id, diana(e).id]);
  const mixta = proponerYAceptar(e, P, 'Platos', 'Plantas', ctx); // una puntual por una repetitiva
  const [platos, plantas2] = ['Platos', 'Plantas'].map((n) => mixta.actividades.find((a) => a.nombre === n));
  assert.deepEqual([platos.miembroId, platos.devolverA, plantas2.miembroId, plantas2.devolverA], [diana(e).id, null, P.id, diana(e).id]);
  assert.equal(barrer.vence, '2026-10-06');
});

test('AC-8.4: "Hecho" devuelve cada repetitiva intercambiada a su responsable original, con su nuevo vencimiento', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  const sinBarrer = marcarHecha(intercambiadas, idDe(e, 'Barrer'), HOY, ctx); // cualquier jugador puede hacerla
  const barrer = buscarActividad(sinBarrer, idDe(e, 'Barrer'));
  assert.deepEqual([barrer.miembroId, barrer.devolverA, barrer.vence], [P.id, null, '2026-10-13']);
  const plantas = buscarActividad(marcarHecha(sinBarrer, idDe(e, 'Plantas'), '2026-10-08', ctx), idDe(e, 'Plantas'));
  assert.deepEqual([plantas.miembroId, plantas.devolverA, plantas.vence], [diana(e).id, null, '2026-10-11']);
  assert.equal(textoIntercambio(sinBarrer, barrer), '');
});

test('AC-7.3, AC-7.5, AC-7.6: rechazar y retirar no cambian las actividades y solo las hacen quienes corresponde', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p1 = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p1);
  assert.equal(rechazar(p1, id, P.id, ctx).error, 'destinataria');
  assert.equal(rechazar(p1, id, luis(e).id, ctx).error, 'destinataria');
  assert.equal(aceptar(p1, id, P.id, ctx).error, 'destinataria');
  assert.equal(retirar(p1, id, diana(e).id, ctx).error, 'autor');
  assert.equal(retirar(p1, id, luis(e).id, ctx).error, 'autor');
  const rechazada = rechazar(p1, id, diana(e).id, ctx);
  assert.equal(rechazada.ok, true);
  assert.deepEqual(rechazada.estado.actividades, p1.actividades);
  assert.deepEqual([buscarIntercambio(rechazada.estado, id).estado, buscarIntercambio(rechazada.estado, id).respondidoEn !== null], ['rechazado', true]);
  assert.equal(numeroRecibidas(rechazada.estado, diana(e).id), 0);
  const retirada = retirar(p1, id, P.id, ctx);
  assert.equal(retirada.ok, true);
  assert.deepEqual(retirada.estado.actividades, p1.actividades);
  assert.equal(buscarIntercambio(retirada.estado, id).estado, 'retirado');
  assert.equal(aceptar(rechazada.estado, id, diana(e).id, ctx).error, 'no-encontrado');
  assert.equal(rechazar(retirada.estado, id, diana(e).id, ctx).error, 'no-encontrado');
  assert.equal(aceptar(p1, 'no-existe', diana(e).id, ctx).error, 'no-encontrado');
  assert.deepEqual(nombres(actividadesOfrecibles(rechazada.estado, P.id)), ['Platos', 'Barrer']); // quedan libres para otra propuesta
});

test('AC-7.10: una propuesta que dejó de ser vigente no se acepta, ni se rechaza ni se retira', () => {
  const { ctx, e } = escenario();
  const p1 = proponerOk(e, propietarioDe(e), 'Platos', 'Basura', ctx);
  const { id } = ultimo(p1);
  const platos = buscarActividad(p1, idDe(p1, 'Platos'));
  const editada = editarActividad(p1, platos.id, { ...platos, nombre: 'Platos y vasos' }, ctx).estado;
  for (const [f, quien] of [[aceptar, diana(e)], [rechazar, diana(e)], [retirar, propietarioDe(e)]]) {
    const r = f(editada, id, quien.id, ctx);
    assert.deepEqual([r.ok, r.error, r.estado === editada], [false, 'no-vigente', true], f.name);
  }
});

test('AC-9.1 a AC-9.4: cada operación que cambia una de las dos actividades, o las bajas en cascada, deja la propuesta no vigente', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'cocina', ctx);
  const cocina2 = espaciosDeTipo(e, 'cocina')[1];
  e = nueva(e, 'Platos', propietarioDe(e), ctx, { espacioId: cocina2.id });
  e = nueva(e, 'Basura', diana(e), ctx);
  const p = proponerOk(e, propietarioDe(e), 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  assert.equal(esVigente(p, ultimo(p)), true);
  const editar = (nombre) => (s) => editarActividad(s, idDe(s, nombre), { ...buscarActividad(s, idDe(s, nombre)), icono: 'platos' }, ctx).estado;
  const operaciones = {
    'editar la ofrecida': editar('Platos'),
    'editar la pedida': editar('Basura'),
    'eliminar la ofrecida': (s) => eliminarActividad(s, idDe(s, 'Platos'), ctx),
    'eliminar la pedida': (s) => eliminarActividad(s, idDe(s, 'Basura'), ctx),
    'marcar la ofrecida como hecha': (s) => marcarHecha(s, idDe(s, 'Platos'), HOY, ctx),
    'marcar la pedida como hecha': (s) => marcarHecha(s, idDe(s, 'Basura'), HOY, ctx),
    'eliminar el espacio de la ofrecida': (s) => eliminarEspacio(s, cocina2.id, ctx),
    'eliminar a la destinataria': (s) => eliminarHabitante(s, diana(s).id, ctx),
  };
  for (const [nombre, operacion] of Object.entries(operaciones)) {
    const despues = operacion(p);
    assert.notEqual(despues, p, nombre);
    assert.equal(esVigente(despues, buscarIntercambio(despues, id)), false, nombre);
    assert.equal(numeroRecibidas(despues, diana(p).id), 0, nombre);
    assert.equal(aceptar(despues, id, diana(p).id, ctx).ok, false, nombre);
  }
});

test('AC-9.5, AC-9.6: renombrar a una persona o a un espacio no anula la propuesta, y la vigencia no depende del día', () => {
  const { ctx, e } = escenario();
  const p = proponerOk(e, propietarioDe(e), 'Platos', 'Basura', ctx);
  const i = ultimo(p);
  const renombrada = renombrarMiembro(p, diana(e).id, 'Dana', ctx).estado;
  const espacio = renombrarEspacio(p, cocina(e).id, 'La cocina', ctx).estado;
  assert.equal(esVigente(renombrada, buscarIntercambio(renombrada, i.id)), true);
  assert.equal(esVigente(espacio, buscarIntercambio(espacio, i.id)), true);
  assert.equal(esVigente.length, 2); // solo recibe (estado, intercambio): el paso de los días no la anula
});

test('AC-9.7, AC-9.8: restaurar el valor anterior no revive la propuesta, y las actividades quedan libres para otra', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  const platos = buscarActividad(p, idDe(p, 'Platos'));
  const cambiada = editarActividad(p, platos.id, { ...platos, nombre: 'Otro' }, ctx).estado;
  const restaurada = editarActividad(cambiada, platos.id, { ...platos, nombre: 'Platos' }, ctx).estado;
  assert.equal(esVigente(restaurada, buscarIntercambio(restaurada, id)), false);
  assert.deepEqual(nombres(actividadesOfrecibles(restaurada, P.id)), ['Platos', 'Barrer']);
  const nueva2 = proponerOk(restaurada, P, 'Platos', 'Basura', ctx);
  assert.equal(esVigente(nueva2, buscarIntercambio(nueva2, id)), false);
  assert.equal(esVigente(nueva2, ultimo(nueva2)), true);
  assert.equal(intercambiosVigentes(nueva2).length, 1);
});

test('AC-7.8: quitar una propuesta que no es vigente la deja rechazada o retirada según quién la quita, y una vigente no se quita', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const { id } = ultimo(p);
  assert.equal(quitar(p, id, diana(e).id, ctx).error, 'sigue-vigente');
  const platos = buscarActividad(p, idDe(p, 'Platos'));
  const editada = editarActividad(p, platos.id, { ...platos, nombre: 'Platos y vasos' }, ctx).estado;
  assert.deepEqual(intercambiosDe(editada, diana(e).id).recibidas.map((i) => esVigente(editada, i)), [false]); // se muestra como "ya no vigente"
  assert.equal(numeroRecibidas(editada, diana(e).id), 0);
  const quitadaPorDiana = quitar(editada, id, diana(e).id, ctx);
  assert.deepEqual([quitadaPorDiana.ok, buscarIntercambio(quitadaPorDiana.estado, id).estado], [true, 'rechazado']);
  const quitadaPorElPropietario = quitar(editada, id, P.id, ctx);
  assert.deepEqual([quitadaPorElPropietario.ok, buscarIntercambio(quitadaPorElPropietario.estado, id).estado], [true, 'retirado']);
  assert.equal(quitar(editada, id, luis(e).id, ctx).error, 'participante');
  assert.deepEqual(intercambiosDe(quitadaPorDiana.estado, diana(e).id), { recibidas: [], enviadas: [] });
  assert.equal(quitar(quitadaPorDiana.estado, id, diana(e).id, ctx).error, 'no-encontrado');
});

test('AC-8.6: los textos de la nota "por intercambio" y de las filas del panel', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const i = ultimo(p);
  assert.equal(textoPropuesta(p, i, 'recibida'), 'Personaje 1 te ofrece «Platos» por «Basura»');
  assert.equal(textoPropuesta(p, i, 'enviada'), 'Ofreciste «Platos» a Diana por «Basura»');
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  const barrer = intercambiadas.actividades.find((a) => a.nombre === 'Barrer');
  assert.equal(textoIntercambio(intercambiadas, barrer), 'por intercambio (vuelve a Personaje 1)');
  assert.equal(textoIntercambio(e, e.actividades[0]), '');
  const conMarcado = renombrarMiembro(p, diana(e).id, '<b>Dana</b>', ctx).estado;
  assert.equal(textoPropuesta(conMarcado, i, 'enviada'), 'Ofreciste «Platos» a <b>Dana</b> por «Basura»'); // texto plano: la pantalla lo inserta como texto
});

test('AC-8.7, AC-8.8, AC-8.9: aceptar no cambia el total ni el estado de los espacios; las pendientes y la burbuja de un miembro siguen al responsable actual', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const P = propietarioDe(e);
  e = nueva(e, 'Platos', P, ctx, { vence: '2026-10-03' });
  e = nueva(e, 'Ropa', luis(e), ctx, { espacioId: null });
  e = nueva(e, 'Barrer', P, ctx);
  const despues = proponerYAceptar(e, P, 'Platos', 'Ropa', ctx);
  assert.equal(contarActividades(despues), contarActividades(e));
  assert.equal(limpiezaDeEspacio(despues, cocina(e).id, HOY), limpiezaDeEspacio(e, cocina(e).id, HOY));
  assert.deepEqual(nombres(actividadesPendientes(despues).filter((a) => a.miembroId === P.id)), ['Ropa', 'Barrer']);
  assert.deepEqual([pendientesDeMiembro(despues, luis(e).id), pendientesDeMiembro(despues, P.id)], [1, 2]);
  const delEspacio = (estado) => burbujas(estado, HOY).find((b) => b.tipo === 'espacio');
  assert.deepEqual(delEspacio(despues), delEspacio(e)); // Platos sigue en la cocina
  const delMiembro = (estado, id) => burbujas(estado, HOY).find((b) => b.tipo === 'miembro' && b.id === id);
  assert.equal(delMiembro(e, luis(e).id).actividades.length, 1);
  assert.equal(delMiembro(despues, luis(e).id), undefined);
  assert.deepEqual(delMiembro(despues, P.id).actividades, [idDe(e, 'Ropa')]);
});

test('AC-8.14: una repetitiva con regreso pendiente no se ofrece ni se pide hasta que vuelve a su responsable', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const intercambiadas = proponerYAceptar(e, P, 'Barrer', 'Plantas', ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(intercambiadas, P.id)), ['Platos']);
  assert.deepEqual(nombres(actividadesOfrecibles(intercambiadas, diana(e).id)), ['Basura']);
  assert.deepEqual(nombres(actividadesPedibles(intercambiadas, luis(e).id)), ['Platos', 'Basura']);
  const devuelta = marcarHecha(intercambiadas, idDe(e, 'Barrer'), HOY, ctx);
  assert.deepEqual(nombres(actividadesOfrecibles(devuelta, P.id)), ['Platos', 'Barrer']);
});

test('AC-11.1 a AC-11.5: cada propuesta conserva su identidad, su auditoría y sus referencias por identificador', () => {
  const { ctx, e } = escenario();
  const P = propietarioDe(e);
  const p = proponerOk(e, P, 'Platos', 'Basura', ctx);
  const i = ultimo(p);
  assert.ok(i.id && i.creadoEn && i.actualizadoEn);
  assert.deepEqual([i.creadoPor, i.actualizadoPor, i.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
  assert.equal('cuentaId' in i, false);
  const aceptada = buscarIntercambio(aceptar(p, i.id, diana(e).id, ctx).estado, i.id);
  assert.equal(aceptada.id, i.id);
  assert.ok(aceptada.actualizadoEn > i.creadoEn);
  assert.deepEqual([aceptada.proponenteId, aceptada.destinatarioId], [P.id, diana(e).id]);
  const renombrada = renombrarMiembro(p, diana(e).id, 'Dana', ctx).estado;
  assert.deepEqual(buscarIntercambio(renombrada, i.id), i);
  assert.equal(p.intercambios.length, 1); // quitar o responder nunca borra el registro
});

function sinReferenciasRotas(estado, nombre) {
  const miembros = new Set(miembrosActivos(estado).map((m) => m.id));
  for (const i of intercambiosVigentes(estado)) {
    assert.ok(buscarActividad(estado, i.actividadOfrecidaId) && buscarActividad(estado, i.actividadPedidaId), `${nombre}: propuesta vigente con una actividad que no está pendiente`);
  }
  for (const a of actividadesPendientes(estado)) {
    assert.ok(miembros.has(a.miembroId), `${nombre}: actividad de un miembro eliminado`);
    assert.ok(a.devolverA === null || miembros.has(a.devolverA), `${nombre}: regreso a un miembro eliminado`);
  }
}

test('Reliability, FR-10: ninguna baja de un espacio o de un miembro deja una propuesta vigente con una actividad eliminada ni un regreso a un miembro eliminado', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'cocina', ctx), 'lavanderia', ctx);
  const [c1, c2] = espaciosDeTipo(e, 'cocina');
  const [lavanderia] = espaciosDeTipo(e, 'lavanderia');
  const P = propietarioDe(e);
  e = nueva(e, 'P rep', P, ctx, { tipo: 'repetitiva', frecuenciaDias: 7, espacioId: c1.id });
  e = nueva(e, 'D rep', diana(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 7, espacioId: c2.id });
  e = nueva(e, 'P punt', P, ctx, { espacioId: lavanderia.id });
  e = nueva(e, 'D punt', diana(e), ctx, { espacioId: c2.id });
  e = nueva(e, 'L punt', luis(e), ctx, { espacioId: lavanderia.id });
  e = nueva(e, 'L rep', luis(e), ctx, { tipo: 'repetitiva', frecuenciaDias: 3, espacioId: c1.id });
  e = proponerYAceptar(e, P, 'P rep', 'D rep', ctx); // regreso pendiente en las dos repetitivas
  e = proponerOk(e, P, 'P punt', 'L punt', ctx);
  e = proponerOk(e, diana(e), 'D punt', 'L rep', ctx);
  sinReferenciasRotas(e, 'inicial');
  for (const espacio of espaciosActivos(e).filter((x) => puedeEliminar(e, x.id))) {
    sinReferenciasRotas(eliminarEspacio(e, espacio.id, ctx), `sin el espacio ${espacio.id}`);
  }
  for (const miembro of [diana(e), luis(e), firulais(e)]) {
    sinReferenciasRotas(eliminarHabitante(e, miembro.id, ctx), `sin ${miembro.nombre}`);
  }
});
```

- [ ] Run: `cd poc && node --test test/intercambios.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/intercambios.js`)
- [ ] Crear el módulo de intercambios:
```js
// src/intercambios.js
// Intercambios de actividades (feature 005): operaciones puras sobre `estado.intercambios` (ADR-005 de intercambios). La vigencia
// no se guarda: sale de comparar la marca `actualizadoEn` de las dos actividades con la que tenían al proponer.
import { LIMITE_INTERCAMBIOS } from './catalogo.js';
import { actividadesPendientes, miembrosActivos, auditoriaNueva, tocar } from './hogar.js';
import { buscarActividad } from './actividades.js';

const esPersona = (estado, id) => miembrosActivos(estado).some((m) => m.id === id && m.tipo === 'persona');
const nombreDe = (estado, id) => estado.miembros.find((m) => m.id === id)?.nombre ?? ''; // también de los eliminados
const nombreDeActividad = (estado, id) => estado.actividades.find((a) => a.id === id)?.nombre ?? '';
const rechazo = (estado, error) => ({ ok: false, error, estado });

export const buscarIntercambio = (estado, id) => estado.intercambios.find((i) => i.id === id) ?? null;
const pendiente = (estado, id) => {
  const i = buscarIntercambio(estado, id);
  return i && i.estado === 'pendiente' ? i : null;
};

// Vigente (FR-10): pendiente, con sus dos actividades pendientes y sin ningún cambio desde que se propuso.
export function esVigente(estado, i) {
  if (i.estado !== 'pendiente') return false;
  const ofrecida = buscarActividad(estado, i.actividadOfrecidaId);
  const pedida = buscarActividad(estado, i.actividadPedidaId);
  return Boolean(ofrecida) && Boolean(pedida) && ofrecida.actualizadoEn === i.marcaOfrecida && pedida.actualizadoEn === i.marcaPedida;
}

export const intercambiosVigentes = (estado) => estado.intercambios.filter((i) => esVigente(estado, i));
export const numeroRecibidas = (estado, personaId) => intercambiosVigentes(estado).filter((i) => i.destinatarioId === personaId).length;

// Las propuestas pendientes de una persona para el panel (FR-8): las que recibió y las que envió, vigentes o no, en el orden en que se crearon.
export function intercambiosDe(estado, personaId) {
  const pendientes = estado.intercambios.filter((i) => i.estado === 'pendiente');
  return {
    recibidas: pendientes.filter((i) => i.destinatarioId === personaId),
    enviadas: pendientes.filter((i) => i.proponenteId === personaId),
  };
}

// Actividades que están en una propuesta vigente (una actividad está a lo sumo en una).
function actividadesEnPropuestas(estado) {
  const ids = new Set();
  for (const i of intercambiosVigentes(estado)) {
    ids.add(i.actividadOfrecidaId);
    ids.add(i.actividadPedidaId);
  }
  return ids;
}

// Se pueden ofrecer las pendientes de quien propone, y pedir las pendientes de otras personas (nunca las de una mascota); ninguna
// que ya esté en una propuesta vigente ni una repetitiva con regreso pendiente (FR-7).
export function actividadesOfrecibles(estado, personaId) {
  const usadas = actividadesEnPropuestas(estado);
  return actividadesPendientes(estado).filter((a) => a.miembroId === personaId && !a.devolverA && !usadas.has(a.id));
}

export function actividadesPedibles(estado, personaId) {
  const usadas = actividadesEnPropuestas(estado);
  return actividadesPendientes(estado)
    .filter((a) => a.miembroId !== personaId && esPersona(estado, a.miembroId) && !a.devolverA && !usadas.has(a.id));
}

// Por qué "Proponer" está desactivado (AC-6.6, AC-6.7): 'limite' si ya hay 20 propuestas vigentes; 'nada' si no hay qué ofrecer o qué pedir.
export function motivoSinPropuesta(estado, personaId) {
  if (intercambiosVigentes(estado).length >= LIMITE_INTERCAMBIOS) return 'limite';
  if (actividadesOfrecibles(estado, personaId).length === 0 || actividadesPedibles(estado, personaId).length === 0) return 'nada';
  return null;
}

export function proponer(estado, datos, ctx) {
  const { proponenteId, ofrecidaId, pedidaId } = datos;
  if (!esPersona(estado, proponenteId)) return rechazo(estado, 'proponente');
  const ofrecida = buscarActividad(estado, ofrecidaId);
  const pedida = buscarActividad(estado, pedidaId);
  if (!ofrecida || !pedida) return rechazo(estado, 'no-pendiente');
  if (ofrecida.miembroId !== proponenteId) return rechazo(estado, 'ofrecida-ajena');
  if (pedida.miembroId === proponenteId) return rechazo(estado, 'pedida-propia');
  if (!esPersona(estado, pedida.miembroId)) return rechazo(estado, 'pedida-mascota');
  const usadas = actividadesEnPropuestas(estado);
  if (usadas.has(ofrecida.id) || usadas.has(pedida.id)) return rechazo(estado, 'ya-en-propuesta');
  if (ofrecida.devolverA || pedida.devolverA) return rechazo(estado, 'regreso');
  if (intercambiosVigentes(estado).length >= LIMITE_INTERCAMBIOS) return rechazo(estado, 'limite');
  const intercambio = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, proponenteId, destinatarioId: pedida.miembroId,
    actividadOfrecidaId: ofrecida.id, actividadPedidaId: pedida.id, marcaOfrecida: ofrecida.actualizadoEn, marcaPedida: pedida.actualizadoEn,
    estado: 'pendiente', respondidoEn: null, ...auditoriaNueva(ctx),
  };
  return { ok: true, estado: { ...estado, intercambios: [...estado.intercambios, intercambio] } };
}

// Deja la propuesta en su estado final, con la fecha en que se respondió; su registro no se borra (FR-13).
function cerrar(estado, id, nuevoEstado, ctx) {
  const ahora = ctx.ahora();
  const intercambios = estado.intercambios.map((i) => (i.id === id ? { ...tocar(i, ctx), estado: nuevoEstado, respondidoEn: ahora } : i));
  return { ...estado, intercambios };
}

// Aceptar (FR-9): solo la destinataria y solo una propuesta vigente. Cada actividad pasa a la persona responsable de la otra; una
// repetitiva recuerda a su responsable original, una puntual no.
export function aceptar(estado, id, respondeId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (i.destinatarioId !== respondeId) return rechazo(estado, 'destinataria');
  if (!esVigente(estado, i)) return rechazo(estado, 'no-vigente');
  const ofrecida = buscarActividad(estado, i.actividadOfrecidaId);
  const pedida = buscarActividad(estado, i.actividadPedidaId);
  const regreso = (a) => (a.tipo === 'repetitiva' ? a.miembroId : null);
  const nuevos = new Map([
    [ofrecida.id, { miembroId: pedida.miembroId, devolverA: regreso(ofrecida) }],
    [pedida.id, { miembroId: ofrecida.miembroId, devolverA: regreso(pedida) }],
  ]);
  const actividades = estado.actividades.map((a) => (nuevos.has(a.id) ? { ...tocar(a, ctx), ...nuevos.get(a.id) } : a));
  return { ok: true, estado: cerrar({ ...estado, actividades }, id, 'aceptado', ctx) };
}

export function rechazar(estado, id, respondeId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (i.destinatarioId !== respondeId) return rechazo(estado, 'destinataria');
  if (!esVigente(estado, i)) return rechazo(estado, 'no-vigente');
  return { ok: true, estado: cerrar(estado, id, 'rechazado', ctx) };
}

export function retirar(estado, id, quienId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (i.proponenteId !== quienId) return rechazo(estado, 'autor');
  if (!esVigente(estado, i)) return rechazo(estado, 'no-vigente');
  return { ok: true, estado: cerrar(estado, id, 'retirado', ctx) };
}

// Quitar (AC-7.8): solo una propuesta que dejó de ser vigente, por cualquiera de sus dos personas. Queda rechazada si la quita la
// destinataria y retirada si la quita quien propuso.
export function quitar(estado, id, quienId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (quienId !== i.destinatarioId && quienId !== i.proponenteId) return rechazo(estado, 'participante');
  if (esVigente(estado, i)) return rechazo(estado, 'sigue-vigente');
  return { ok: true, estado: cerrar(estado, id, quienId === i.destinatarioId ? 'rechazado' : 'retirado', ctx) };
}

export const MENSAJES_INTERCAMBIO = {
  proponente: 'Solo una persona del hogar puede proponer un intercambio.',
  'ofrecida-ajena': 'La actividad que ofreces debe ser tuya.',
  'pedida-propia': 'Pide una actividad de otra persona.',
  'pedida-mascota': 'Las actividades de las mascotas no se intercambian.',
  'no-pendiente': 'Una de las actividades ya no está pendiente.',
  'ya-en-propuesta': 'Una de las actividades ya está en otra propuesta vigente.',
  regreso: 'Una repetitiva que volverá a su responsable no se puede intercambiar.',
  limite: 'Ya hay 20 propuestas vigentes.',
  'no-encontrado': 'Esa propuesta ya no está pendiente.',
  destinataria: 'Solo la persona a quien se propuso puede responder.',
  autor: 'Solo quien propuso puede retirarla.',
  'no-vigente': 'Esa propuesta ya no está vigente.',
  participante: 'Solo las dos personas de la propuesta pueden quitarla.',
  'sigue-vigente': 'Esa propuesta sigue vigente.',
};

// ---------- Textos ----------

// Nota de una repetitiva que está con otra persona y volverá a su responsable original (AC-8.6); '' si no la tiene.
export const textoIntercambio = (estado, actividad) => (actividad.devolverA ? `por intercambio (vuelve a ${nombreDe(estado, actividad.devolverA)})` : '');

// Fila del panel (AC-7.1, AC-7.4): la propuesta vista por quien la recibe ('recibida') o por quien la hizo ('enviada').
export function textoPropuesta(estado, i, vista) {
  const ofrecida = nombreDeActividad(estado, i.actividadOfrecidaId);
  const pedida = nombreDeActividad(estado, i.actividadPedidaId);
  return vista === 'recibida'
    ? `${nombreDe(estado, i.proponenteId)} te ofrece «${ofrecida}» por «${pedida}»`
    : `Ofreciste «${ofrecida}» a ${nombreDe(estado, i.destinatarioId)} por «${pedida}»`;
}
```

- [ ] Run: `cd poc && node --test test/intercambios.test.js` — expect: PASS (`# pass 19`, `# fail 0`)
- [ ] Run: `cd poc && npm test` — expect: solo falla `test/contrato-intercambios.test.js` en las exportaciones del jugador (`propietarioDe` y siguientes, `cambiarJugador`); todo lo demás pasa
- [ ] Commit: `feat(poc): add exchange proposals with derived validity` (cuerpo: `Plan section: Phase 3: Intercambios` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 4: Jugador activo y cambio de jugador

**Implements:** FR-1 (lógica), FR-2, FR-3, FR-4, FR-5 (baja del jugador), FR-6 (lógica) | **Satisfies:** AC-1.9 (lista), AC-2.1 a AC-2.6, AC-3.2, AC-3.3, AC-3.4, AC-3.6, AC-4.2 (colocación), AC-4.7 (lógica), AC-5.3, AC-5.4
**Files:** `poc/src/hogar.js`, `poc/src/movimiento.js`, `poc/test/jugador.test.js`
**Interfaces:** Consumes: `esPropietario`, `familiares`, `miembrosActivos` (001/002); `colocarHabitantes`, `avanzarHabitantes`, `ocupadasPorHabitantes`, `nuevoMovil` (privada), `rutaMasCorta` (004). Produces:
- Desde `hogar.js`: `propietarioDe(estado)` → el miembro del propietario; `personasQueJuegan(estado)` → `[propietario, ...familiares]`; `puedeJugar(estado, id)`; `jugadorInicial(estado, guardada)` → id de quien juega al abrir (`guardada` es el documento de posición o `null`).
- Desde `movimiento.js`: `cambiarJugador(moviles, saliente, nuevoId, distribucion, objetivos = new Map())` → `{ jugador: { id, x, y, direccion }, moviles }`. `saliente` es `{ id, x, y, direccion }` de quien jugaba, o `null` si ya no existe; `nuevoId` es un id de `moviles`; `objetivos` son los de rutina de los familiares.

Implementa el ADR del jugador activo: quién puede jugar, quién juega al abrir y el cambio de jugador como función pura sobre la lista de móviles. El nuevo jugador sale de los móviles y toma su casilla; el saliente entra como móvil en la suya con su objetivo (el de su rutina si es un familiar; libre si es el propietario); un familiar fuera aparece en la entrada; y quien comparte casilla con el nuevo jugador se aparta a la libre más cercana por camino.

- [ ] Escribir las pruebas del jugador:
```js
// test/jugador.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, eliminarHabitante, espaciosDeTipo, familiares, mascotas, miembrosActivos, propietarioDe,
  personasQueJuegan, puedeJugar, jugadorInicial,
} from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { claveCasilla } from '../src/posicion.js';
import { colocarHabitantes, avanzarHabitantes, cambiarJugador } from '../src/movimiento.js';
import { crearCtx, azarReproducible } from './ayuda.js';

function hogar() {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', parentesco: 'hermano', genero: 'masculino' }, ctx).estado;
  e = agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
  return { ctx, e };
}

const idsSin = (e, ...sin) => miembrosActivos(e).map((m) => m.id).filter((id) => !sin.includes(id));

// Partida: juega el propietario, quieto en la casilla de aparición; los demás miembros son móviles.
function partida(semilla = 3) {
  const { ctx, e } = hogar();
  const d = generarDistribucion(e);
  const propietario = propietarioDe(e);
  const jugador = { id: propietario.id, x: d.aparicion.x, y: d.aparicion.y, direccion: 'abajo' };
  const azar = azarReproducible(semilla);
  const moviles = colocarHabitantes(idsSin(e, propietario.id), d, { ...jugador, desde: null }, azar);
  return { ctx, e, d, azar, propietario, jugador, moviles };
}

// Nadie en una casilla no transitable ni en la de quien juega; quienes pasean nunca comparten casilla entre sí.
function verificar(d, moviles, jugador) {
  assert.ok(esTransitable(d, jugador.x, jugador.y), 'el jugador en una casilla no transitable');
  const vistas = new Set();
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    assert.ok(esTransitable(d, h.x, h.y), `${h.id} en una casilla no transitable (${h.x},${h.y})`);
    const k = claveCasilla(h.x, h.y);
    assert.notEqual(k, claveCasilla(jugador.x, jugador.y), `${h.id} comparte la casilla del jugador`);
    if (h.fase === 'pasea') {
      assert.ok(!vistas.has(k), `${h.id} comparte la casilla ${k} con otro que pasea`);
      vistas.add(k);
    }
  }
}

test('FR-1, AC-1.9: pueden jugar el propietario y los familiares, no las mascotas, y el propietario va primero', () => {
  const { e } = hogar();
  assert.deepEqual(personasQueJuegan(e).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Luis']);
  assert.deepEqual(personasQueJuegan(e).map((m) => puedeJugar(e, m.id)), [true, true, true]);
  assert.equal(puedeJugar(e, mascotas(e)[0].id), false);
  assert.equal(puedeJugar(e, 'no-existe'), false);
  assert.equal(propietarioDe(e).id, miembrosActivos(e)[0].id);
});

test('AC-5.3, AC-5.4: al abrir juega la persona guardada si todavía puede jugar; si no, el propietario', () => {
  const { ctx, e } = hogar();
  const P = propietarioDe(e);
  const dianaId = familiares(e)[0].id;
  assert.equal(jugadorInicial(e, null), P.id);
  assert.equal(jugadorInicial(e, { clave: 'x', dx: 0, dy: 0, direccion: 'abajo' }), P.id); // posición guardada por una feature anterior
  assert.equal(jugadorInicial(e, { jugadorId: dianaId }), dianaId);
  assert.equal(jugadorInicial(e, { jugadorId: 'no-existe' }), P.id);
  assert.equal(jugadorInicial(e, { jugadorId: mascotas(e)[0].id }), P.id);
  assert.equal(jugadorInicial(e, { jugadorId: 7 }), P.id);
  assert.equal(jugadorInicial(eliminarHabitante(e, dianaId, ctx), { jugadorId: dianaId }), P.id);
});

test('AC-2.1, AC-2.2, AC-2.5: el familiar elegido pasa a ser el jugador en su casilla y quien jugaba queda en la suya', () => {
  const { e, d, propietario, jugador, moviles } = partida();
  const diana = familiares(e)[0];
  const antes = moviles.find((h) => h.id === diana.id);
  const r = cambiarJugador(moviles, jugador, diana.id, d);
  assert.deepEqual(r.jugador, { id: diana.id, x: antes.x, y: antes.y, direccion: 'abajo' });
  assert.equal(r.moviles.length, moviles.length);
  assert.equal(r.moviles.some((h) => h.id === diana.id), false);
  const saliente = r.moviles.find((h) => h.id === propietario.id);
  assert.deepEqual([saliente.x, saliente.y, saliente.fase, saliente.objetivo], [jugador.x, jugador.y, 'pasea', { tipo: 'libre' }]);
  for (const h of moviles.filter((x) => x.id !== diana.id)) assert.deepEqual(r.moviles.find((x) => x.id === h.id), h); // los demás no cambian
  verificar(d, r.moviles, r.jugador);
});

test('AC-2.3, AC-2.4, AC-3.6: quien deja de jugar toma el objetivo de su rutina: espacio, fuera o libre; el propietario, siempre libre', () => {
  const { e, d, propietario, jugador, moviles } = partida();
  const [diana, luis] = familiares(e);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[0];
  const r1 = cambiarJugador(moviles, jugador, diana.id, d); // juega Diana
  const r2 = cambiarJugador(r1.moviles, r1.jugador, luis.id, d, new Map([[diana.id, { tipo: 'espacio', espacioId: dormitorio.id }]]));
  const dianaMovil = r2.moviles.find((h) => h.id === diana.id);
  assert.deepEqual([dianaMovil.objetivo, dianaMovil.fase], [{ tipo: 'espacio', espacioId: dormitorio.id }, 'planifica']);
  const r3 = cambiarJugador(r2.moviles, r2.jugador, propietario.id, d, new Map([[luis.id, { tipo: 'fuera' }]]));
  const luisMovil = r3.moviles.find((h) => h.id === luis.id);
  assert.deepEqual([luisMovil.objetivo, luisMovil.fase], [{ tipo: 'fuera' }, 'planifica']);
  const r4 = cambiarJugador(r3.moviles, r3.jugador, diana.id, d, new Map([[propietario.id, { tipo: 'libre' }]]));
  const propietarioMovil = r4.moviles.find((h) => h.id === propietario.id);
  assert.deepEqual([propietarioMovil.objetivo, propietarioMovil.fase], [{ tipo: 'libre' }, 'pasea']);
  verificar(d, r4.moviles, r4.jugador);
});

test('AC-3.2, AC-3.3: un familiar fuera de casa aparece en la entrada; si está ocupada, en la casilla libre más cercana por camino', () => {
  const { e, d, azar, propietario, jugador } = partida();
  const [diana, luis] = familiares(e);
  const fuera = new Map([[diana.id, { tipo: 'fuera' }]]);
  const solo = colocarHabitantes([diana.id], d, { ...jugador, desde: null }, azar, fuera);
  assert.equal(solo[0].fase, 'fuera');
  const r = cambiarJugador(solo, jugador, diana.id, d);
  assert.deepEqual([r.jugador.x, r.jugador.y], [d.entrada.x, d.entrada.y]);
  assert.equal(r.moviles.find((h) => h.id === propietario.id).x, jugador.x);
  const dos = colocarHabitantes([diana.id, luis.id], d, { ...jugador, desde: null }, azar, fuera);
  const conLuisEnLaEntrada = dos.map((h) => (h.id === luis.id ? { ...h, x: d.entrada.x, y: d.entrada.y } : h));
  const ocupada = cambiarJugador(conLuisEnLaEntrada, jugador, diana.id, d);
  const distancia = Math.abs(ocupada.jugador.x - d.entrada.x) + Math.abs(ocupada.jugador.y - d.entrada.y);
  assert.ok(distancia >= 1 && distancia <= 3, `a ${distancia} casillas de la entrada`); // cerca de la entrada, nunca en ella
  assert.ok(esTransitable(d, ocupada.jugador.x, ocupada.jugador.y));
  assert.notDeepEqual([ocupada.jugador.x, ocupada.jugador.y], [jugador.x, jugador.y]); // ni en la casilla de quien jugaba
  assert.deepEqual(cambiarJugador(conLuisEnLaEntrada, jugador, diana.id, d).jugador, ocupada.jugador); // siempre la misma
  verificar(d, ocupada.moviles, ocupada.jugador);
  const sobreLaEntrada = { ...jugador, x: d.entrada.x, y: d.entrada.y }; // quien jugaba está parado en la entrada
  const sola = cambiarJugador(colocarHabitantes([diana.id], d, { ...sobreLaEntrada, desde: null }, azar, fuera), sobreLaEntrada, diana.id, d);
  assert.notDeepEqual([sola.jugador.x, sola.jugador.y], [d.entrada.x, d.entrada.y]);
  assert.deepEqual([sola.moviles[0].x, sola.moviles[0].y], [d.entrada.x, d.entrada.y]);
});

test('AC-2.5: quien está en ruta en la casilla del nuevo jugador se aparta a la libre más cercana, sin perder su objetivo', () => {
  const { e, d, jugador } = partida();
  const [diana, luis] = familiares(e);
  const [deDiana, deLuis] = colocarHabitantes([diana.id, luis.id], d, { ...jugador, desde: null }, azarReproducible(5));
  const espacioId = d.espacioEn[deDiana.y][deDiana.x];
  const luisEnRuta = { ...deLuis, x: deDiana.x, y: deDiana.y, desde: null, fase: 'ruta', objetivo: { tipo: 'espacio', espacioId } };
  const r = cambiarJugador([deDiana, luisEnRuta], jugador, diana.id, d);
  const luisDespues = r.moviles.find((h) => h.id === luis.id);
  assert.notDeepEqual([luisDespues.x, luisDespues.y], [r.jugador.x, r.jugador.y]);
  const lejos = Math.abs(luisDespues.x - deDiana.x) + Math.abs(luisDespues.y - deDiana.y);
  assert.ok(lejos >= 1 && lejos <= 3, `a ${lejos} casillas de donde estaba`); // la libre más cercana
  assert.deepEqual([luisDespues.objetivo, luisDespues.fase, luisDespues.ruta], [{ tipo: 'espacio', espacioId }, 'planifica', []]);
  verificar(d, r.moviles, r.jugador);
});

test('AC-2.1: el nuevo jugador mira hacia donde miraba su personaje, o hacia abajo si no tenía dirección', () => {
  const { e, d, jugador, moviles } = partida();
  const diana = familiares(e)[0];
  const mirando = moviles.map((h) => (h.id === diana.id ? { ...h, direccion: 'izquierda' } : h));
  assert.equal(cambiarJugador(mirando, jugador, diana.id, d).jugador.direccion, 'izquierda');
  assert.equal(cambiarJugador(moviles, jugador, diana.id, d).jugador.direccion, 'abajo');
});

test('AC-4.7: si quien jugaba ya no existe, juega el propietario en la casilla que ocupaba como personaje quieto', () => {
  const { e, d, propietario, jugador, moviles } = partida();
  const diana = familiares(e)[0];
  const r1 = cambiarJugador(moviles, jugador, diana.id, d); // juega Diana; el propietario queda quieto donde estaba
  const r2 = cambiarJugador(r1.moviles, null, propietario.id, d); // Diana se elimina: ya no hay quien salga
  assert.deepEqual([r2.jugador.id, r2.jugador.x, r2.jugador.y], [propietario.id, jugador.x, jugador.y]);
  assert.equal(r2.moviles.length, r1.moviles.length - 1);
  assert.equal(r2.moviles.some((h) => h.id === propietario.id), false);
  verificar(d, r2.moviles, r2.jugador);
});

test('FR-3: con el propietario entre los móviles, todos ocupan casillas distintas y pasean', () => {
  const { e, d, azar, jugador } = partida();
  const diana = familiares(e)[0];
  const moviles = colocarHabitantes(idsSin(e, diana.id), d, { x: jugador.x, y: jugador.y, desde: null }, azar);
  assert.equal(moviles.length, 3); // el propietario, Luis y la mascota
  assert.ok(moviles.every((h) => h.fase === 'pasea' && h.objetivo.tipo === 'libre'));
  verificar(d, moviles, jugador);
});

test('Reliability, AC-2.5: tras varios cambios de jugador y minutos de movimiento, nadie comparte casilla con quien juega ni pisa una pared', () => {
  const { e, d, azar, jugador: inicial, moviles: iniciales } = partida(9);
  const personas = personasQueJuegan(e).map((m) => m.id);
  let jugador = inicial;
  let moviles = iniciales;
  for (let ronda = 0; ronda < 12; ronda++) {
    const r = cambiarJugador(moviles, jugador, personas[(ronda + 1) % personas.length], d);
    moviles = r.moviles;
    jugador = r.jugador;
    verificar(d, moviles, jugador);
    for (let t = 0; t < 5000; t += 50) {
      moviles = avanzarHabitantes(moviles, d, { x: jugador.x, y: jugador.y, desde: null }, 50, azar);
      verificar(d, moviles, jugador);
    }
  }
  assert.equal(moviles.length + 1, miembrosActivos(e).length); // siempre todos los miembros: uno juega y los demás son móviles
});
```

- [ ] Run: `cd poc && node --test test/jugador.test.js` — expect: FAIL (`SyntaxError`: `../src/hogar.js` no exporta `propietarioDe`)
- [ ] Agregar al final de `src/hogar.js`, antes de `export const MENSAJES_ERROR`:
```js
// ---------- Jugador activo (feature 005) ----------

export const propietarioDe = (estado) => miembrosActivos(estado).find((m) => esPropietario(estado, m)) ?? null;

// Pueden jugar el propietario y los familiares activos, el propietario primero; las mascotas no (FR-1 de la 005).
export const personasQueJuegan = (estado) => [propietarioDe(estado), ...familiares(estado)];
export const puedeJugar = (estado, id) => personasQueJuegan(estado).some((m) => m.id === id);

// Quién juega al abrir la app (FR-6 de la 005): la persona guardada junto a la posición si todavía puede jugar; si no hay ninguna
// guardada (un hogar de una feature anterior) o ya no existe, el propietario.
export function jugadorInicial(estado, guardada) {
  const id = guardada?.jugadorId;
  return typeof id === 'string' && puedeJugar(estado, id) ? id : propietarioDe(estado).id;
}
```

- [ ] En `src/movimiento.js`, agregar al final del archivo:
```js

// Cambio de jugador (FR-2 a FR-4 de la 005, ADR-005 de jugador activo). Pura y sin azar. `saliente` es { id, x, y, direccion } de quien
// jugaba (o null si ya no existe) y `nuevoId` es uno de los móviles. El nuevo jugador sale de los móviles y toma la casilla que
// ocupaba (o a la que se dirigía); un familiar fuera de casa aparece en la entrada, o en la casilla libre más cercana por camino
// si está ocupada. El saliente pasa a ser un móvil en su casilla con el objetivo de su rutina (`objetivos`) o libre. Quien comparte
// casilla con el nuevo jugador se aparta a la libre más cercana, sin perder su objetivo.
export function cambiarJugador(moviles, saliente, nuevoId, distribucion, objetivos = new Map()) {
  const entrante = moviles.find((h) => h.id === nuevoId);
  const resto = moviles.filter((h) => h.id !== nuevoId);
  const clave = (c) => claveCasilla(c.x, c.y);
  const ocupadas = ocupadasPorHabitantes(resto);
  if (saliente) ocupadas.add(clave(saliente));
  let casilla = { x: entrante.x, y: entrante.y };
  if (entrante.fase === 'fuera') {
    const { entrada } = distribucion;
    casilla = ocupadas.has(clave(entrada))
      ? rutaMasCorta(distribucion, entrada, (x, y) => !ocupadas.has(claveCasilla(x, y))).at(-1)
      : { x: entrada.x, y: entrada.y };
  }
  const jugador = { id: nuevoId, x: casilla.x, y: casilla.y, direccion: entrante.direccion ?? 'abajo' };

  const choca = (h) => h.fase !== 'fuera' && (clave(h) === clave(casilla) || (h.desde !== null && clave(h.desde) === clave(casilla)));
  const tomadas = ocupadasPorHabitantes(resto.filter((h) => !choca(h)));
  tomadas.add(clave(casilla));
  if (saliente) tomadas.add(clave(saliente));
  const aparte = new Map();
  for (const h of resto.filter(choca)) {
    const libre = rutaMasCorta(distribucion, h, (x, y) => !tomadas.has(claveCasilla(x, y))).at(-1);
    tomadas.add(clave(libre));
    aparte.set(h.id, nuevoMovil(h.id, libre.x, libre.y, h.objetivo, h.objetivo.tipo === 'libre' ? 'pasea' : 'planifica'));
  }

  const lista = resto.map((h) => aparte.get(h.id) ?? h);
  if (saliente) {
    const objetivo = objetivos.get(saliente.id) ?? LIBRE;
    lista.push(nuevoMovil(saliente.id, saliente.x, saliente.y, objetivo, objetivo.tipo === 'libre' ? 'pasea' : 'planifica'));
  }
  return { jugador, moviles: lista };
}
```

- [ ] Run: `cd poc && node --test test/jugador.test.js` — expect: PASS (`# pass 10`, `# fail 0`)
- [ ] Run: `cd poc && npm test` — expect: PASS (`# pass 253`, `# fail 0`; incluye ahora las pruebas de contrato de la Fase 0)
- [ ] Commit: `feat(poc): add active player and seamless player switching` (cuerpo: `Plan section: Phase 4: Jugador activo y cambio de jugador` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 5: Presentación: quién juega

**Implements:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6 (cableado), NFR Usability | **Satisfies:** AC-1.1 a AC-1.9, AC-2.1 a AC-2.11, AC-3.1 a AC-3.8, AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.8, AC-4.9, AC-4.10, AC-5.1, AC-5.2, AC-5.5, AC-5.6, AC-5.7
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: `personasQueJuegan`, `puedeJugar`, `jugadorInicial` (Fase 4), `cambiarJugador` (Fase 4), `objetivosDeFamiliares` (004). Produces: la aplicación con jugador activo; ningún contrato nuevo.

Capa de presentación delgada: toda regla vive en los módulos puros. `juego.js` guarda el jugador como `{ id, x, y, direccion }`, construye la lista de móviles con todos los miembros menos quien juega, aplica `cambiarJugador` y guarda quién juega junto con su posición. El cambio elegido en medio de un paso se aplica al terminarlo. Los nombres se insertan con `textContent`.

> **Complexity note:** Gate: Integration-First (pruebas antes del código). Violation: la capa de presentación no tiene pruebas automáticas, igual que las Fases 5 de la 003 y la 004. Justification: depende del motor de la PoC, que es desechable. Las reglas quedaron en módulos puros probados en las Fases 1 a 4, y esta capa se verifica con la comprobación estática de este paso y con la lista manual de la Fase 7.

Verificación previa (falla esperada): `cd poc && grep -n "cambiarJugador\|id=\"juega\"" src/juego.js index.html` no encuentra nada.

- [ ] En `index.html`, agregar antes de `  </style>` los estilos del botón y de los paneles modales (los de "Intercambios" se usan en la Fase 6):
```css
    #juega, #intercambios { position: fixed; right: 12px; padding: 10px 14px; max-width: 62vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #juega { top: calc(60px + env(safe-area-inset-top)); }
    #intercambios { top: calc(108px + env(safe-area-inset-top)); }
    .modal { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    .modal section, .modal form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(340px, 90vw);
      max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
    .modal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .modal button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    .modal .peligro { background: #a32d2d; }
    .modal .item { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 1px solid #d9cfb4; }
    .modal .item.tocable { cursor: pointer; }
    .modal .item small { display: block; opacity: .7; }
    .modal .botones { display: flex; gap: 6px; }
    .modal .subtitulo { display: block; margin: 12px 0 4px; }
    .modal select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    .modal .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    .modal .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .modal .ancho { width: 100%; margin-top: 8px; padding: 10px; }
    .nota { display: block; font-size: 13px; opacity: .7; min-height: 1em; }
```

- [ ] En `index.html`, reemplazar `  <button id="editar">Editar</button>` por:
```html
  <button id="editar">Editar</button>
  <button id="juega">Juega</button>
```

- [ ] En `index.html`, agregar antes de `  <div id="aviso" role="status"></div>`:
```html
  <div id="quien" class="modal">
    <section aria-label="¿Quién juega?">
      <header><strong>¿Quién juega?</strong><button type="button" id="quien-cerrar">Cerrar</button></header>
      <div id="quien-lista"></div>
    </section>
  </div>
```

- [ ] En `src/juego.js`, hacer estos reemplazos exactos:
  1. En el import de `./hogar.js`, `  eliminarHabitante, pendientesDeMiembro, bloquesDeMiembro,\n} from './hogar.js';` por:
```js
  eliminarHabitante, pendientesDeMiembro, bloquesDeMiembro, personasQueJuegan, puedeJugar, jugadorInicial,
} from './hogar.js';
```
  2. En el import de `./movimiento.js`, `ocupadasPorHabitantes, fijarObjetivos,\n} from './movimiento.js';` por `ocupadasPorHabitantes, fijarObjetivos, cambiarJugador,\n} from './movimiento.js';`.
  3. Después de la línea `const PROF_EN_RUTA = 9;` y su `ESTILO_CARTEL`, agregar:
```js
// Jugador activo (FR-1 de la 005): el color de cada miembro y el resalte de la etiqueta de quien juega.
const COLOR_PROPIETARIO = 0xd4537e;
const COLOR_RESALTE = '#ffd166';
function colorDe(miembro) {
  if (miembro.tipo === 'mascota') return COLOR_MASCOTA[miembro.especie];
  if (esPropietario(estado, miembro)) return COLOR_PROPIETARIO;
  return COLOR_FAMILIAR[miembro.genero ?? 'otro'];
}
```
  4. `let jugador = resolverPosicion(distribucion, posGuardada);` por:
```js
let jugador = { id: jugadorInicial(estado, posGuardada), ...resolverPosicion(distribucion, posGuardada) }; // quién juega y dónde (FR-6 de la 005)
let cambioPendiente = null; // jugador elegido en medio de un paso: se aplica al terminarlo (AC-2.7 de la 005)
```
  5. `function idsHabitantes() { return habitantes(estado).map((h) => h.id); }` por:
```js
// Móviles: todos los miembros salvo quien juega; el propietario es uno más cuando no juega (ADR-005 de jugador activo).
function idsHabitantes() { return [propietario().id, ...habitantes(estado).map((h) => h.id)].filter((id) => id !== jugador.id); }
```
  6. `posiciones.set(propietario().id, { x: jugador.x, y: jugador.y });` por `posiciones.set(jugador.id, { x: jugador.x, y: jugador.y });`.
  7. En `guardarPosicion`, `posGuardada = posicionRelativa(distribucion, jugador.x, jugador.y, jugador.direccion);` por `posGuardada = { ...posicionRelativa(distribucion, jugador.x, jugador.y, jugador.direccion), jugadorId: jugador.id };`.
  8. En `Escena.create`, `    this.personaje = this.add.container(0, 0, [\n      this.add.rectangle(0, 0, 12, 14, 0xd4537e).setStrokeStyle(1, 0x4b1528),` por:
```js
    this.cuerpoPersonaje = this.add.rectangle(0, 0, 12, 14, COLOR_PROPIETARIO).setStrokeStyle(1, 0x4b1528);
    this.personaje = this.add.container(0, 0, [
      this.cuerpoPersonaje,
```
  9. En `dibujarEtiquetas`, `    this.etiquetaPersonaje.setText(propietario().nombre).setScale(escala);` por `    this.dibujarJugador(escala);` y agregar a continuación de ese método, antes de `dibujarInsignias()`:
```js
  // Nombre, color y resalte de quien juega (AC-2.8 de la 005): su etiqueta lleva un fondo de color que no tienen las demás.
  dibujarJugador(escala) {
    const miembro = buscarMiembro(estado, jugador.id);
    this.cuerpoPersonaje.setFillStyle(colorDe(miembro));
    this.etiquetaPersonaje.setText(miembro.nombre).setScale(escala).setBackgroundColor(COLOR_RESALTE).setFontStyle('bold');
  }

```
  10. En `colocarBurbujas`, las líneas `    const idPropietario = propietario().id;\n    for (const b of this.burbujas) {\n      if (b.tipo !== 'miembro') continue;\n      const cuerpo = b.id === idPropietario ? this.personaje : this.sprites.get(b.id)?.cuerpo;` por:
```js
    for (const b of this.burbujas) {
      if (b.tipo !== 'miembro') continue;
      const cuerpo = b.id === jugador.id ? this.personaje : this.sprites.get(b.id)?.cuerpo;
```
  11. En `sincronizarSprites`, las tres líneas que van desde `const cuerpo = miembro.tipo === 'mascota'` hasta `...COLOR_FAMILIAR[miembro.genero ?? 'otro']);` por:
```js
      const cuerpo = miembro.tipo === 'mascota'
        ? this.add.rectangle(0, 0, 8, 8, colorDe(miembro))
        : this.add.rectangle(0, 0, 12, 14, colorDe(miembro));
```
  12. En `mover`, `jugador = { x: r.x, y: r.y, direccion: r.direccion };` por `jugador = { id: jugador.id, x: r.x, y: r.y, direccion: r.direccion };` y `onComplete: () => { moviendo = false; jugadorDesde = null; },` por `onComplete: () => { moviendo = false; jugadorDesde = null; if (cambioPendiente) elegirJugador(cambioPendiente); },`.
  13. En `mostrarExploracion`, después de la línea de `editar`, agregar `  $('juega').style.display = visible ? 'block' : 'none';`.
  14. En el manejador de `listo`, `  modo = 'exploracion';\n  jugador = resolverPosicion(distribucion, posGuardada);` por `  modo = 'exploracion';\n  jugador = { id: jugador.id, ...resolverPosicion(distribucion, posGuardada) };` y, en ese mismo manejador, después de las líneas `  s.colocarPersonaje();\n  s.seguirPersonaje();` (las últimas antes del `});`), agregar `  actualizarBotones(); // el nombre de quien juega pudo cambiar en la edición`.
  15. En `aplicar`, `  distribucion = generarDistribucion(estado);\n  jugador = resolverPosicion(distribucion, posGuardada);` por:
```js
  distribucion = generarDistribucion(estado);
  if (puedeJugar(estado, jugador.id)) jugador = { id: jugador.id, ...resolverPosicion(distribucion, posGuardada) };
  else pasarElJuegoAlPropietario(); // la persona que jugaba se eliminó (AC-4.7 de la 005)
```
  16. En `tocarMapa`, las líneas desde `  if (x === jugador.x && y === jugador.y) { abrirFicha('propietario', propietario().id); return; }` hasta el `}` del `if (habitante)` por:
```js
  const ocupante = x === jugador.x && y === jugador.y ? jugador : moviles.find((h) => h.fase !== 'fuera' && h.x === x && h.y === y);
  if (ocupante) { abrirFichaDeMiembro(buscarMiembro(estado, ocupante.id)); return; } // AC-4.4 y AC-4.5 de la 005
```
  17. Antes del comentario de `tocarMapa` (`// Al tocar el mapa (FR-8 de la 003, ...`), agregar:
```js
// Ficha de cualquier miembro (AC-4.4 de la 005): la del propietario solo renombra; las de familiares y mascotas, la de siempre.
function abrirFichaDeMiembro(miembro) {
  if (esPropietario(estado, miembro)) abrirFicha('propietario', miembro.id);
  else abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
}

```
  18. Antes de `// ---------- Ciclo de vida ----------`, agregar:
```js
// ---------- Quién juega (FR-1 a FR-6 de la 005) ----------

function actualizarBotones() {
  $('juega').textContent = `Juega: ${buscarMiembro(estado, jugador.id).nombre}`;
}

const cerrarQuien = () => { $('quien').style.display = 'none'; };
// Al cambiar de jugador se cierran las hojas y los paneles abiertos (AC-2.9).
function cerrarPaneles() {
  cerrarHoja();
  cerrarQuien();
}

// Lista "¿Quién juega?" (AC-1.3, AC-3.1): el propietario y los familiares; un familiar fuera de casa también se puede elegir.
function abrirQuien() {
  const cont = $('quien-lista');
  cont.replaceChildren();
  for (const m of personasQueJuegan(estado)) {
    const datos = elemento('span');
    datos.append(elemento('strong', m.nombre));
    if (moviles.some((h) => h.id === m.id && h.fase === 'fuera')) datos.append(elemento('small', 'Fuera de casa · entra por la puerta'));
    const fila = elemento('div', undefined, 'item tocable');
    fila.append(datos, elemento('span', m.id === jugador.id ? 'Jugando' : ''));
    fila.addEventListener('click', () => { cerrarQuien(); elegirJugador(m.id); });
    cont.append(fila);
  }
  $('quien').style.display = 'flex';
}

// Cambia quién juega sin mover a nadie (FR-2): lo hace la lógica pura; aquí se guarda, se redibuja y se centra la cámara.
function elegirJugador(id) {
  if (id === jugador.id || !puedeJugar(estado, id)) { cambioPendiente = null; return; }
  if (moviendo) { cambioPendiente = id; return; } // se aplica al terminar el paso (AC-2.7)
  cambioPendiente = null;
  const t0 = performance.now();
  const saliente = { id: jugador.id, x: jugador.x, y: jugador.y, direccion: jugador.direccion };
  const r = cambiarJugador(moviles, saliente, id, distribucion, objetivosDeFamiliares(estado, ahora));
  moviles = r.moviles;
  jugador = r.jugador;
  cerrarPaneles();
  guardarPosicion(); // AC-5.2
  actualizarBotones();
  const s = escena();
  s.colocarPersonaje();
  s.seguirPersonaje(); // centra la cámara y rehace etiquetas, nombres, burbujas y cartel
  ultimaRegeneracionMs = performance.now() - t0; // meta de 100 ms (AC-2.10)
}

// Si se elimina a quien jugaba (en el modo edición), juega el propietario en la casilla donde estaba (AC-4.7).
function pasarElJuegoAlPropietario() {
  const r = cambiarJugador(moviles, null, propietario().id, distribucion);
  moviles = r.moviles;
  jugador = r.jugador;
  guardarPosicion();
}

$('juega').addEventListener('click', abrirQuien);
$('quien-cerrar').addEventListener('click', cerrarQuien);

```
  19. Antes de `if (inicio.aviso) avisar(inicio.aviso);`, agregar `actualizarBotones();`.

- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 253`, `# fail 0`
- [ ] Comprobación estática (script desechable con `node -e`, sin commitear): cada nombre que `juego.js` importa existe en su módulo, y cada `$('id')` usado en `juego.js` existe como `id=` en `index.html` — expect: 0 faltantes
- [ ] Run: servir `poc/` con `python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"` y abrir `http://localhost:8080` con un viewport de teléfono. Expect:
  - Con un familiar creado en "Editar", el botón "Juega: Personaje 1" aparece debajo de "Editar"; al tocarlo se abre "¿Quién juega?" con el propietario ("Jugando") y el familiar.
  - Al elegir al familiar, la cámara se centra en él, su etiqueta queda resaltada y el propietario sigue en su casilla, ahora caminando solo; la cruceta mueve al familiar.
  - Al recargar, sigue jugando el familiar en su posición.
  - En "Editar", tocar la casilla del propietario abre su ficha (sin Eliminar) y tocar al familiar abre la suya; eliminar al familiar que juega pasa el juego al propietario.
  - Con una rutina "Fuera de casa" en el bloque actual de un familiar, la lista lo muestra con "Fuera de casa · entra por la puerta"; al elegirlo aparece en la entrada.
- [ ] Commit: `feat(poc): let any household person play as the active player` (cuerpo: `Plan section: Phase 5: Presentación: quién juega` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 6: Presentación: intercambios

**Implements:** FR-7, FR-8, FR-9 (nota), FR-11, NFR Security y Usability | **Satisfies:** AC-6.1, AC-6.2, AC-6.3, AC-6.5, AC-6.6, AC-6.7, AC-6.8, AC-6.9, AC-6.10, AC-7.1 a AC-7.9, AC-7.11, AC-8.6, AC-8.7, AC-9.10, AC-10.2
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: todo lo producido en las Fases 3 y 5 (nombres exactos en sus líneas Interfaces). Produces: la aplicación con intercambios; ningún contrato nuevo.

Todos los cambios de intercambios pasan por `aplicarActividades`, que ya guarda, redibuja burbujas y estados, y repinta la hoja abierta; ahora también actualiza el botón y el panel. Los textos de las filas y de las listas se insertan con `textContent` y `new Option`.

- [ ] En `index.html`, reemplazar `  <button id="juega">Juega</button>` por:
```html
  <button id="juega">Juega</button>
  <button id="intercambios">Intercambios</button>
```

- [ ] En `index.html`, agregar antes de `  <div id="aviso" role="status"></div>`:
```html
  <div id="panel-intercambios" class="modal">
    <section aria-label="Intercambios">
      <header><strong>Intercambios</strong><button type="button" id="intercambios-cerrar">Cerrar</button></header>
      <strong class="subtitulo">Recibidas</strong>
      <div id="intercambios-recibidas"></div>
      <strong class="subtitulo">Enviadas</strong>
      <div id="intercambios-enviadas"></div>
      <button type="button" id="intercambios-proponer" class="ancho">Proponer</button>
      <div class="error" id="intercambios-motivo"></div>
    </section>
  </div>
  <div id="ficha-intercambio" class="modal">
    <form>
      <strong>Proponer intercambio</strong>
      <select id="intercambio-ofrecida" aria-label="Tu actividad"></select>
      <select id="intercambio-pedida" aria-label="Por la de"></select>
      <div class="error" id="intercambio-error"></div>
      <div class="acciones">
        <button type="button" id="intercambio-cancelar">Cancelar</button>
        <button type="submit" id="intercambio-guardar">Proponer</button>
      </div>
    </form>
  </div>
```

- [ ] En `index.html`, reemplazar `      <select id="actividad-miembro" aria-label="Asignada a"></select>` por:
```html
      <select id="actividad-miembro" aria-label="Asignada a"></select>
      <small class="nota" id="actividad-nota"></small>
```

- [ ] En `src/juego.js`, hacer estos reemplazos exactos:
  1. Después del import de `./aspecto.js` (`import { INSIGNIAS, objetosDelSuelo, casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';`), agregar:
```js
import {
  numeroRecibidas, intercambiosDe, actividadesOfrecibles, actividadesPedibles, motivoSinPropuesta, proponer, aceptar, rechazar, retirar,
  quitar, esVigente, textoPropuesta, textoIntercambio, MENSAJES_INTERCAMBIO,
} from './intercambios.js';
```
  2. En `mostrarExploracion`, después de la línea de `juega`, agregar `  $('intercambios').style.display = visible ? 'block' : 'none';`.
  3. En `aplicarActividades`, `  if (hojaActual) pintarHoja();\n}\n\n// El día cambió con la app abierta` por:
```js
  if (hojaActual) pintarHoja();
  actualizarBotones(); // cambia el número de propuestas recibidas
  if (intercambiosAbierto()) pintarIntercambios(); // AC-7.11
}

// El día cambió con la app abierta
```
  4. En `pintarHoja`, la línea que empieza por `    datos.append(elemento('strong', a.nombre), elemento('small',` y termina en `${textoPlazo(a, hoy)}`));` (sin `${lugar}`) por:
```js
    const nota = textoIntercambio(estado, a); // AC-8.6
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${textoPlazo(a, hoy)}${nota ? ` · ${nota}` : ''}`));
```
  5. En `pintarActividades`, la línea equivalente que lleva `${lugar} ·` antes de `${textoPlazo(a, hoy)}` por:
```js
    const nota = textoIntercambio(estado, a); // AC-8.6
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${lugar} · ${textoPlazo(a, hoy)}${nota ? ` · ${nota}` : ''}`));
```
  6. En `abrirFichaActividad`, después de la línea `opciones($('actividad-miembro'), ...` agregar `  $('actividad-nota').textContent = a ? textoIntercambio(estado, a) : ''; // AC-8.6`.
  7. En el bloque de la Fase 5, reemplazar todo lo que va desde `function actualizarBotones() {` hasta el `}` final de `cerrarPaneles` (incluida la línea de `cerrarQuien` y el comentario de `cerrarPaneles`) por:
```js
function actualizarBotones() {
  $('juega').textContent = `Juega: ${buscarMiembro(estado, jugador.id).nombre}`;
  const n = numeroRecibidas(estado, jugador.id);
  $('intercambios').textContent = n > 0 ? `Intercambios (${n})` : 'Intercambios'; // AC-6.1
}

const cerrarQuien = () => { $('quien').style.display = 'none'; };
// Al cambiar de jugador se cierran las hojas y los paneles abiertos (AC-2.9).
function cerrarPaneles() {
  cerrarHoja();
  cerrarQuien();
  cerrarIntercambios();
}
```
  8. Antes de `// ---------- Ciclo de vida ----------`, agregar:
```js
// ---------- Intercambios (FR-7 a FR-11 de la 005) ----------
const MOTIVOS_SIN_PROPUESTA = { limite: MENSAJES_INTERCAMBIO.limite, nada: 'No hay actividades para intercambiar' };

const intercambiosAbierto = () => $('panel-intercambios').style.display === 'flex';
function abrirIntercambios() {
  pintarIntercambios();
  $('panel-intercambios').style.display = 'flex';
}
function cerrarIntercambios() {
  $('panel-intercambios').style.display = 'none';
  cerrarFichaIntercambio();
}

// Panel de quien juega (AC-6.2): sus propuestas recibidas (Aceptar, Rechazar) y enviadas (Retirar); una que dejó de ser vigente
// se muestra como "Ya no vigente" y solo ofrece "Quitar" (AC-7.8).
function pintarIntercambios() {
  const { recibidas, enviadas } = intercambiosDe(estado, jugador.id);
  pintarListaIntercambios($('intercambios-recibidas'), recibidas, 'recibida');
  pintarListaIntercambios($('intercambios-enviadas'), enviadas, 'enviada');
  const motivo = motivoSinPropuesta(estado, jugador.id);
  $('intercambios-proponer').disabled = motivo !== null; // AC-6.6, AC-6.7
  $('intercambios-motivo').textContent = motivo ? MOTIVOS_SIN_PROPUESTA[motivo] : '';
}

function pintarListaIntercambios(cont, lista, vista) {
  cont.replaceChildren(...(lista.length === 0 ? [elemento('p', 'Ninguna')] : lista.map((i) => {
    const vigente = esVigente(estado, i);
    const datos = elemento('span');
    datos.append(elemento('strong', textoPropuesta(estado, i, vista)));
    if (!vigente) datos.append(elemento('small', 'Ya no vigente'));
    const botones = elemento('span', undefined, 'botones');
    const accion = (texto, operacion, clase) => {
      const boton = elemento('button', texto, clase);
      boton.addEventListener('click', () => responderIntercambio(operacion(estado, i.id, jugador.id, ctx)));
      botones.append(boton);
    };
    if (!vigente) accion('Quitar', quitar);
    else if (vista === 'recibida') { accion('Aceptar', aceptar); accion('Rechazar', rechazar, 'peligro'); }
    else accion('Retirar', retirar);
    const fila = elemento('div', undefined, 'item');
    fila.append(datos, botones);
    return fila;
  })));
}

// Los cambios de intercambios usan el mismo camino que los de actividades: guardan, redibujan burbujas y estados y repintan la hoja.
function responderIntercambio(r) {
  if (!r.ok) { avisar(MENSAJES_INTERCAMBIO[r.error]); return; }
  aplicarActividades(r.estado);
}

// Ficha de proponer (AC-6.3, AC-6.4): dos listas sin valor inicial; guardar se activa con las dos elegidas.
function abrirFichaIntercambio() {
  const ofrecibles = actividadesOfrecibles(estado, jugador.id);
  const pedibles = actividadesPedibles(estado, jugador.id);
  opciones($('intercambio-ofrecida'), [['', 'Tu actividad…'], ...ofrecibles.map((a) => [a.id, `${a.nombre} · ${textoPlazo(a, hoy)}`])], '');
  opciones($('intercambio-pedida'), [['', 'Por la de…'], ...pedibles.map((a) => [a.id, `${a.nombre} · ${buscarMiembro(estado, a.miembroId).nombre}`])], '');
  $('intercambio-error').textContent = '';
  actualizarFichaIntercambio();
  $('ficha-intercambio').style.display = 'flex';
}
const actualizarFichaIntercambio = () => {
  $('intercambio-guardar').disabled = $('intercambio-ofrecida').value === '' || $('intercambio-pedida').value === '';
};
const cerrarFichaIntercambio = () => { $('ficha-intercambio').style.display = 'none'; };

$('intercambios').addEventListener('click', abrirIntercambios);
$('intercambios-cerrar').addEventListener('click', cerrarIntercambios);
$('intercambios-proponer').addEventListener('click', abrirFichaIntercambio);
$('intercambio-cancelar').addEventListener('click', cerrarFichaIntercambio);
for (const campo of ['intercambio-ofrecida', 'intercambio-pedida']) $(campo).addEventListener('change', actualizarFichaIntercambio);
$('ficha-intercambio').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const r = proponer(estado, { proponenteId: jugador.id, ofrecidaId: $('intercambio-ofrecida').value, pedidaId: $('intercambio-pedida').value }, ctx);
  if (!r.ok) { $('intercambio-error').textContent = MENSAJES_INTERCAMBIO[r.error]; return; } // AC-6.9
  cerrarFichaIntercambio();
  aplicarActividades(r.estado);
});

```

- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 253`, `# fail 0`
- [ ] Comprobación estática (mismo script de la Fase 5): importaciones de `juego.js` y `$('id')` contra `index.html` — expect: 0 faltantes
- [ ] Run: servir `poc/` como en la Fase 5 y abrir `http://localhost:8080` con un viewport de teléfono. Expect:
  - Con un familiar y actividades del propietario y del familiar, "Intercambios" abre el panel con "Ninguna" en las dos secciones y "Proponer" activo.
  - "Proponer" abre la ficha con las dos listas sin valor y "Proponer" desactivado hasta elegir las dos; al guardar, la propuesta aparece en "Enviadas" con "Retirar".
  - Al cambiar de jugador al familiar, el botón dice "Intercambios (1)" y "Recibidas" muestra la propuesta con "Aceptar" y "Rechazar"; al aceptar, las dos actividades cambian de responsable en la hoja y la lista del panel de edición.
  - Una repetitiva aceptada muestra "por intercambio (vuelve a …)" y, al marcarla "Hecho", vuelve a su responsable.
  - Editar una actividad de una propuesta vigente la deja como "Ya no vigente", con solo "Quitar".
  - Un nombre de actividad con `<b>` se ve como texto.
- [ ] Commit: `feat(poc): add exchange proposals panel and notes` (cuerpo: `Plan section: Phase 6: Presentación: intercambios` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Phase 7: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: `# pass 253`, `# fail 0`
- [ ] Servir en la red local con `python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('0.0.0.0', 8080), h).serve_forever()"` desde `poc/` y abrir `http://<IP-del-computador>:8080` en el Android, en la misma Wi-Fi y con internet para cargar Phaser. Al terminar, parar el servidor.
  > **Nota sobre la caché:** no usar `python3 -m http.server` a secas. Solo envía `Last-Modified`, y el navegador del teléfono puede mezclar módulos viejos y nuevos; entonces el mapa no se dibuja (incidencia de la 002). Si aun así pasa, borrar los datos de navegación del sitio.
- [ ] Verificar manualmente en el Android, marcando cada uno:
  - [ ] AC-1.1 a AC-1.9: botón "Juega" debajo de "Editar" sin tapar la cruceta ni el cartel; lista "¿Quién juega?" con propietario y familiares, sin mascotas, con "Jugando"; elegir, repetir y cerrar; nombres como texto.
  - [ ] AC-2.1 a AC-2.11: el elegido toma el control en su casilla y la cámara se centra; quien jugaba camina solo (el propietario por toda la casa; un familiar según su rutina); nadie salta ni comparte casilla; etiqueta resaltada solo en quien juega; cambio en medio de un paso se aplica al terminarlo; hojas y paneles se cierran.
  - [ ] AC-3.1 a AC-3.8: un familiar con bloque "Fuera de casa" aparece en la entrada al elegirlo (y en la casilla libre más cercana si está ocupada), el cartel baja su cuenta, su rutina no lo mueve mientras juega, al soltarlo retoma su rutina y sale por la puerta; sus burbujas aparecen sobre él.
  - [ ] AC-4.1 a AC-4.10: modo edición con cualquier jugador, "Listo" ubica a todos, "Hecho" en actividades ajenas, fichas por toque (propietario sin Eliminar), eliminar al familiar que juega pasa el juego al propietario, asignar actividades a cualquiera.
  - [ ] AC-5.1 a AC-5.7: cerrar y reabrir mantiene a quien juega y su posición; un jugador eliminado o hogar de una feature anterior abre con el propietario.
  - [ ] AC-6.1 a AC-6.11: botón "Intercambios (n)", panel con "Recibidas" y "Enviadas", ficha de proponer con listas filtradas (sin mascotas, sin las ya propuestas, sin repetitivas intercambiadas), "Proponer" desactivado con su texto, mensajes de rechazo.
  - [ ] AC-7.1 a AC-7.11: aceptar, rechazar, retirar; solo la destinataria responde; cambiar de jugador cambia el número y las listas; "Ya no vigente" con "Quitar".
  - [ ] AC-8.1 a AC-8.15: puntual y repetitiva intercambiadas; "por intercambio" en hoja, ficha y lista; "Hecho" devuelve la repetitiva; burbujas y estados sin cambio; reasignar o volver puntual borra la nota; eliminar al original y a quien la tiene.
  - [ ] AC-9.1 a AC-9.10: editar, eliminar, "Hecho" y eliminar un espacio o a una persona anulan la propuesta; renombrar no.
  - [ ] AC-10.1 a AC-10.8: cerrar y reabrir; abrir con los datos guardados por la versión anterior (con habitantes, actividades y rutinas) sin aviso. AC-10.4 a AC-10.6 están cubiertos por pruebas automáticas.
- [ ] Medir rendimiento con el indicador de depuración:
  - Con 8 familiares, 4 mascotas, el propietario caminando solo y 50 actividades vencidas repartidas por el hogar más grande, caminando 30 s: 60 fps o más.
  - En 20 cambios seguidos de jugador y de propuestas: `regen` por debajo de 100 ms en todos.
  - Anotar el modelo de teléfono y los resultados en `docs/specs/005-jugador-activo-e-intercambios/verification.md`.
- [ ] Commit: `docs(005-jugador-activo-e-intercambios): record integration verification` (cuerpo: `Plan section: Phase 7: Integration Verification` y `Feature: 005-jugador-activo-e-intercambios`)

---

## Quickstart Validation

1. `cd poc && npm test` → `# pass 253`, `# fail 0`.
2. Servir `poc/` con el comando de la Fase 5 y abrir `http://localhost:8080`: aparece el hogar con "Juega: Personaje 1" debajo de "Editar".
3. **Editar** → agregar un familiar "Diana" y dos actividades: "Platos" asignada a Personaje 1 y "Basura" asignada a Diana, ambas que vencen hoy → **Listo**.
4. **Juega** → elegir a Diana: la cámara pasa a ella y el propietario sigue caminando solo.
5. Elegir de nuevo a Personaje 1 → **Intercambios** → **Proponer** → "Platos" por "Basura" → guardar: aparece en "Enviadas".
6. Elegir a Diana: el botón dice "Intercambios (1)"; en "Recibidas", **Aceptar**. Tocar la burbuja de la cocina: "Platos" está ahora con Diana y "Basura" con Personaje 1.
7. Recargar la página: sigue jugando Diana y los responsables siguen cambiados.
