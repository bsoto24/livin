# Implementation Plan: Actividades

**Spec:** docs/specs/003-actividades/spec.md (v1.0.0)
**Decisions:** docs/adr/003-modelo-actividades-formato-v3.md, docs/adr/003-estado-derivado-fechas-reloj-inyectado.md
**Data model:** docs/specs/003-actividades/data-model.md
**Created:** 2026-10-06

## Global Constraints

- Actividad: nombre de 1 a 30 caracteres, sin espacios en los extremos, **repetible**; icono de la lista cerrada (Platos, Barrer, Ropa, Basura, Limpiar, Compras, Plantas, Mascota, Otra; "Otra" por defecto); miembro activo obligatorio (propietario, familiar o mascota); espacio activo opcional (nunca un pasillo); tipo puntual o repetitiva; fecha de vencimiento real, puede ser pasada; frecuencia de la lista 1, 2, 3, 7, 14 o 30 días solo en las repetitivas.
- Hasta 50 actividades **pendientes** por hogar. *Ruling:* la spec dice "activas"; se cuentan las pendientes (no eliminadas y, si son puntuales, no hechas), porque las puntuales hechas no aparecen en ninguna lista ni se pueden borrar, y contarlas podría bloquear el cupo para siempre. Coste si es incorrecto: cambiar `contarActividades` y una prueba.
- Plazos por día del calendario local, sin hora, como texto `AAAA-MM-DD`. **Por hacer** = pendiente con vencimiento hoy o antes. **Atraso** = días enteros entre el vencimiento y hoy.
- Estado de un espacio por la actividad por hacer más atrasada **vinculada a él**: limpio (ninguna o atraso 0), desordenado (1–2 días), desastre (3 o más). Cada baño interno es un espacio propio. Objetos en el suelo: 0, 4 y 12. Insignias: ✓, ! y !!. Los pasillos no tienen estado.
- Una burbuja por lugar (un espacio, o un miembro para sus actividades sin espacio). El icono es el de la más atrasada (a igual atraso, la creada primero) y lleva "+" si hay más. *Ruling:* la burbuja de un espacio ocupa la primera casilla libre de su área en orden de lectura, y la de un miembro se toca en la casilla de encima de él. Cada burbuja se dibuja centrada en la casilla donde se toca.
- "Hecho" solo en exploración, desde la hoja, para actividades por hacer. Puntual: registra `hechaEn = hoy`. Repetitiva: `vence = hoy + frecuencia`. No se deshace.
- Crear, editar y eliminar actividades solo en modo edición. Al tocar una casilla en edición, la prioridad es: personaje del propietario, habitante, burbuja, espacio.
- Eliminar un espacio o un miembro da de baja lógica a todas sus actividades en la misma operación, incluida la excepción del baño interno que se elimina con su cuarto. La confirmación dice cuántas actividades pendientes se eliminan.
- Nada derivado se guarda (estado, burbujas, atrasos, objetos). `hoy` se inyecta: lo obtiene la presentación y lo pasa. Al cambiar el día con la app abierta se recalcula todo.
- Documento `version: 3` en la misma clave `livin:datos:v1`. Las versiones 1 y 2 se migran al cargar y se guardan como v3 en el siguiente guardado. Se validan solo las actividades no eliminadas.
- 60 cuadros por segundo con 8 familiares, 4 mascotas y 50 actividades vencidas en el dispositivo de referencia, y menos de 100 ms tras cada cambio. Los textos del usuario se insertan siempre como texto, nunca como marcado.
- Ningún dato sale del dispositivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs; arte de marcador original (rectángulos de color y emoji del sistema).
- Modelo, fechas, actividades y aspecto no importan Phaser ni el DOM (ADR del generador de la 001 y ADR de estado derivado de la 003).

**Pre-implementation gates:**
- *Simplicity:* siguen siendo 3 componentes. Dominio (`catalogo.js`, `hogar.js`, `almacen.js` y el nuevo `actividades.js`), lógica pura de mapa, tiempo y movimiento (`distribucion.js`, `posicion.js`, `etiquetas.js`, `movimiento.js` y los nuevos `fechas.js` y `aspecto.js`) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* un único modelo canónico de actividad (objetos planos del estado guardado). Burbujas, estados y objetos del suelo son resultados de funciones puras, no vistas guardadas ni clases. Phaser y el DOM se usan directamente. ✓
- *Integration-First:* los contratos (exportaciones, listas cerradas, umbrales, insignias y objetos por estado, migración) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que el propietario registre actividades puntuales y repetitivas, las vea en el mapa como burbujas, objetos e insignias según su atraso, y las marque como hechas desde una hoja. También que las gestione en modo edición, que las bajas de espacios y miembros las arrastren y que los hogares de las features 001 y 002 se abran sin pérdida. Todo cubierto por 150 pruebas automáticas (100 existentes + 50 nuevas).

Archivos (bajo `poc/`):
- **Lógica:** `src/catalogo.js` (listas y límites), `src/fechas.js` (nuevo: fechas locales), `src/hogar.js` (consultas de actividades y bajas en cascada), `src/actividades.js` (nuevo: operaciones y estado derivado), `src/aspecto.js` (nuevo: burbujas y objetos en el mapa), `src/almacen.js` (formato v3).
- **Presentación:** `src/juego.js`, `index.html`.
- **Pruebas en `test/`:** `contrato-actividades.test.js`, `fechas.test.js`, `almacen.test.js`, `habitantes.test.js`, `actividades.test.js`, `aspecto.test.js`.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1 (listas cerradas y límites), FR-4 (umbrales), FR-5 (insignias y objetos), FR-11 (migración), contrato de FR-2/FR-3/FR-6/FR-7/FR-8/FR-9 | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/contrato-actividades.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de nombres exportados por `src/catalogo.js` (`ICONOS`, `FRECUENCIAS`, `LIMITE_ACTIVIDADES = 50`, `MAX_NOMBRE_ACTIVIDAD = 30`), `src/fechas.js` (`numeroDeDia`, `esFechaValida`, `sumarDias`, `diasEntre`, `fechaLocal`), `src/actividades.js` (operaciones, estado derivado, `UMBRAL_DESORDENADO = 1`, `UMBRAL_DESASTRE = 3`, `MENSAJES_ACTIVIDAD`), `src/hogar.js` (`actividadesPendientes`, `pendientesDeEspacios`, `pendientesDeMiembro`, `auditoriaNueva`, `tocar`), `src/almacen.js` (`migrarAV3`) y `src/aspecto.js` (`INSIGNIAS`, `OBJETOS_POR_ESTADO`, `casillasLibres`, `casillaDeBurbuja`, `objetosDelSuelo`, `ubicarBurbujas`).

Fija la forma pública de lo nuevo antes de implementarlo. La prueba de contrato queda en rojo (`ERR_MODULE_NOT_FOUND`) hasta el final de la Fase 4; las Fases 1 a 3 se verifican con sus propios archivos de prueba.

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato-actividades.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as fechas from '../src/fechas.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as actividades from '../src/actividades.js';
import * as aspecto from '../src/aspecto.js';

test('contrato del catálogo de actividades: listas cerradas y límites', () => {
  assert.deepEqual(Object.keys(catalogo.ICONOS), ['platos', 'barrer', 'ropa', 'basura', 'limpiar', 'compras', 'plantas', 'mascota', 'otra']);
  assert.deepEqual(Object.values(catalogo.ICONOS), ['Platos', 'Barrer', 'Ropa', 'Basura', 'Limpiar', 'Compras', 'Plantas', 'Mascota', 'Otra']);
  assert.deepEqual(catalogo.FRECUENCIAS, [1, 2, 3, 7, 14, 30]);
  assert.equal(catalogo.LIMITE_ACTIVIDADES, 50);
  assert.equal(catalogo.MAX_NOMBRE_ACTIVIDAD, 30);
});

test('contrato de fechas, actividades y estado derivado: funciones y umbrales del ADR', () => {
  for (const f of ['numeroDeDia', 'esFechaValida', 'sumarDias', 'diasEntre', 'fechaLocal']) assert.equal(typeof fechas[f], 'function', f);
  for (const f of ['buscarActividad', 'contarActividades', 'puedeAgregarActividad', 'agregarActividad', 'editarActividad',
    'eliminarActividad', 'marcarHecha', 'atraso', 'porHacer', 'limpiezaDeEspacio', 'burbujas', 'actividadesDelLugar',
    'listaDelPanel', 'textoPlazo']) {
    assert.equal(typeof actividades[f], 'function', f);
  }
  assert.deepEqual([actividades.UMBRAL_DESORDENADO, actividades.UMBRAL_DESASTRE], [1, 3]);
  for (const clave of ['vacio', 'largo', 'icono', 'miembro', 'espacio', 'tipo', 'fecha', 'frecuencia', 'limite', 'no-encontrada']) {
    assert.equal(typeof actividades.MENSAJES_ACTIVIDAD[clave], 'string', clave);
  }
});

test('contrato del modelo y del almacén: consultas de actividades, bajas en cascada y migración a v3', () => {
  for (const f of ['actividadesPendientes', 'pendientesDeEspacios', 'pendientesDeMiembro', 'auditoriaNueva', 'tocar']) {
    assert.equal(typeof hogar[f], 'function', f);
  }
  assert.equal(typeof almacen.migrarAV3, 'function');
});

test('contrato del aspecto: insignias, objetos por estado y funciones de ubicación', () => {
  assert.deepEqual(aspecto.INSIGNIAS, { limpio: '✓', desordenado: '!', desastre: '!!' });
  assert.deepEqual(aspecto.OBJETOS_POR_ESTADO, { limpio: 0, desordenado: 4, desastre: 12 });
  for (const f of ['casillasLibres', 'casillaDeBurbuja', 'objetosDelSuelo', 'ubicarBurbujas']) assert.equal(typeof aspecto[f], 'function', f);
});
```

- [ ] Run: `cd poc && node --test test/contrato-actividades.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` de uno de los módulos nuevos)
- [ ] Commit: `test(poc): add contract tests for activities` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 003-actividades`)

---

## Phase 1: Fechas del calendario local

**Implements:** FR-2 (días sin hora), FR-10 (fecha de hoy del dispositivo) | **Satisfies:** AC-5.5
**Files:** `poc/src/fechas.js`, `poc/test/fechas.test.js`
**Interfaces:** Consumes: nada. Produces: desde `fechas.js`: `numeroDeDia(texto)` → número de día desde 1970-01-01 o `null` si no es una fecha real `AAAA-MM-DD`; `esFechaValida(texto)` → booleano; `sumarDias(texto, dias)` → texto `AAAA-MM-DD`; `diasEntre(desde, hasta)` → entero (positivo si `hasta` es posterior); `fechaLocal(instante: Date)` → texto `AAAA-MM-DD` del calendario local.

Implementa la representación de fechas del ADR de estado derivado: texto del calendario local, aritmética por partes de la fecha, sin hora ni zona horaria. La conversión a "hoy" (`fechaLocal`) es la única que mira la hora local y solo la usa la presentación.

- [ ] Escribir las pruebas de fechas:
```js
// test/fechas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numeroDeDia, esFechaValida, sumarDias, diasEntre, fechaLocal } from '../src/fechas.js';

test('FR-1, FR-11: solo son válidas las fechas reales con formato AAAA-MM-DD', () => {
  for (const valida of ['2026-10-06', '2024-02-29', '2000-01-01', '2099-12-31']) assert.equal(esFechaValida(valida), true, valida);
  for (const invalida of ['2026-02-29', '2026-13-01', '2026-10-32', '2026-00-10', '2026-1-5', '06-10-2026', '2026-10-06T00:00',
    '0099-01-01', '', null, undefined, 20261006]) {
    assert.equal(esFechaValida(invalida), false, String(invalida));
    assert.equal(numeroDeDia(invalida), null, String(invalida));
  }
  assert.equal(numeroDeDia('1970-01-02'), 1);
});

test('FR-2: diasEntre cuenta días enteros del calendario, también entre meses y años', () => {
  assert.equal(diasEntre('2026-10-04', '2026-10-06'), 2);
  assert.equal(diasEntre('2026-10-06', '2026-10-06'), 0);
  assert.equal(diasEntre('2026-10-07', '2026-10-06'), -1);
  assert.equal(diasEntre('2025-12-31', '2026-01-01'), 1);
  assert.equal(diasEntre('2024-02-28', '2024-03-01'), 2);
});

test('AC-3.3: sumarDias devuelve una fecha AAAA-MM-DD y cruza meses, años y años bisiestos', () => {
  assert.equal(sumarDias('2026-10-06', 7), '2026-10-13');
  assert.equal(sumarDias('2026-12-30', 3), '2027-01-02');
  assert.equal(sumarDias('2024-02-28', 1), '2024-02-29');
  assert.equal(sumarDias('2026-10-06', 30), '2026-11-05');
  assert.equal(sumarDias('2026-03-28', 7), '2026-04-04');
  assert.equal(sumarDias('2026-01-05', -10), '2025-12-26');
});

test('sumarDias y diasEntre son coherentes en todos los días de un año bisiesto', () => {
  let dia = '2024-01-01';
  for (let i = 0; i < 366; i++) {
    const siguiente = sumarDias(dia, 1);
    assert.equal(esFechaValida(siguiente), true, siguiente);
    assert.equal(diasEntre(dia, siguiente), 1, dia);
    assert.equal(sumarDias(siguiente, -1), dia);
    dia = siguiente;
  }
  assert.equal(dia, '2025-01-01');
});

test('AC-5.5, FR-10: fechaLocal da el mismo día a las 00:00 y a las 23:59 de la hora local', () => {
  assert.equal(fechaLocal(new Date(2026, 9, 6, 0, 0, 0)), '2026-10-06');
  assert.equal(fechaLocal(new Date(2026, 9, 6, 23, 59, 59)), '2026-10-06');
  assert.equal(fechaLocal(new Date(2026, 0, 5, 12, 0)), '2026-01-05');
});
```

- [ ] Run: `cd poc && node --test test/fechas.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/fechas.js`)
- [ ] Crear el módulo de fechas:
```js
// src/fechas.js
// Fechas del calendario local como texto AAAA-MM-DD (ADR-003 de estado derivado): sin hora ni zona horaria.
const MS_POR_DIA = 86400000;
const PATRON = /^(\d{4})-(\d{2})-(\d{2})$/;
const dos = (n) => String(n).padStart(2, '0');

// Número de día (días desde el 1970-01-01) de una fecha AAAA-MM-DD, o null si no es una fecha real del calendario.
export function numeroDeDia(texto) {
  const partes = typeof texto === 'string' ? PATRON.exec(texto) : null;
  if (!partes) return null;
  const [anio, mes, dia] = partes.slice(1).map(Number);
  const instante = new Date(Date.UTC(anio, mes - 1, dia));
  if (instante.getUTCFullYear() !== anio || instante.getUTCMonth() !== mes - 1 || instante.getUTCDate() !== dia) return null;
  return instante.getTime() / MS_POR_DIA;
}

export const esFechaValida = (texto) => numeroDeDia(texto) !== null;

function textoDeDia(numero) {
  const d = new Date(numero * MS_POR_DIA);
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
}

// Fecha que resulta de sumar `dias` (puede ser negativo) a una fecha válida.
export const sumarDias = (texto, dias) => textoDeDia(numeroDeDia(texto) + dias);

// Días enteros desde `desde` hasta `hasta`: positivo si `hasta` es posterior.
export const diasEntre = (desde, hasta) => numeroDeDia(hasta) - numeroDeDia(desde);

// Día del calendario local de un instante: la presentación lo usa para obtener `hoy` (FR-10).
export const fechaLocal = (instante) => `${instante.getFullYear()}-${dos(instante.getMonth() + 1)}-${dos(instante.getDate())}`;
```

- [ ] Run: `cd poc && node --test test/fechas.test.js` — expect: PASS (`# pass 5`, `# fail 0`)
- [ ] Commit: `feat(poc): add local calendar dates for activities` (cuerpo: `Plan section: Phase 1: Fechas del calendario local` y `Feature: 003-actividades`)

---

## Phase 2: Formato guardado v3 y migración

**Implements:** FR-11, FR-12 (registro guardado), Story 8 | **Satisfies:** AC-8.1, AC-8.3, AC-8.4, AC-8.5, AC-8.6
**Files:** `poc/src/catalogo.js`, `poc/src/hogar.js`, `poc/src/almacen.js`, `poc/test/almacen.test.js`, `poc/test/habitantes.test.js`
**Interfaces:** Consumes: `esFechaValida` (Fase 1); `crearCtx`, `almacenEnMemoria` (001); `agregarHabitante`, `espaciosDeTipo` (001/002). Produces: desde `catalogo.js`: `ICONOS` (clave → etiqueta), `FRECUENCIAS = [1, 2, 3, 7, 14, 30]`, `LIMITE_ACTIVIDADES = 50`, `MAX_NOMBRE_ACTIVIDAD = 30`. Desde `hogar.js`: `crearHogarInicial(ctx)` devuelve `version: 3` y `actividades: []`. Desde `almacen.js`: `migrarAV3(estado)` → documento v3 (pura); `crearAlmacen(storage).cargar()` acepta `version` 1 (migra a v2 y a v3), 2 (valida y migra a v3) o 3 (valida también las actividades no eliminadas) y devuelve `{ estado: null, error: 'ilegible' }` en cualquier otro caso. Las claves `CLAVE_DATOS` y `CLAVE_POSICION` no cambian.

Implementa el ADR de modelo de actividades en el almacén. Una actividad no eliminada es válida si tiene nombre de texto, icono de la lista, vencimiento real, un miembro activo y, si tiene espacio, un espacio activo. Además, una puntual no tiene frecuencia y su `hechaEn` es nulo o una fecha real; una repetitiva tiene una frecuencia de la lista y `hechaEn` nulo. Las dos pruebas existentes que fijaban la versión 2 pasan a fijar la versión 3, y el documento de la feature 001 de las pruebas deja de llevar la lista de actividades, como los reales.

- [ ] En `test/habitantes.test.js`, reemplazar la prueba `'FR-1, AC-9.4: el hogar inicial tiene versión 2 y el personaje del propietario no es un habitante'` completa por:
```js
test('FR-1, AC-9.4 (002), FR-11 (003): el hogar inicial tiene versión 3, sin actividades, y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 3);
  assert.deepEqual(e.actividades, []);
  const [propietario] = e.miembros;
  assert.deepEqual([propietario.tipo, propietario.parentesco, propietario.genero, propietario.especie], ['persona', null, null, null]);
  assert.equal(esPropietario(e, propietario), true);
  assert.deepEqual(habitantes(e), []);
  assert.deepEqual([contarHabitantes(e, 'familiar'), contarHabitantes(e, 'mascota')], [0, 0]);
});
```

- [ ] En `test/almacen.test.js`, reemplazar la línea de import de `../src/almacen.js` por:
```js
import { crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
```

- [ ] En `test/almacen.test.js`, reemplazar la función `comoV1` completa por:
```js
// Documento como lo guardaba la feature 001: versión 1, sin actividades y miembros sin tipo, parentesco, género ni especie.
function comoV1(estado) {
  const { actividades, ...resto } = estado;
  return { ...resto, version: 1, miembros: estado.miembros.map(({ tipo, parentesco, genero, especie, ...m }) => m) };
}
```

- [ ] En `test/almacen.test.js`, en la prueba `'AC-9.3: un hogar de la feature 001 se abre sin aviso y se guarda en el formato nuevo en el siguiente guardado'`, cambiar el título a `'AC-9.3 (002), AC-8.3 (003): un hogar de la feature 001 se abre sin aviso y se guarda como versión 3 en el siguiente guardado'`, el comentario `// mismos espacios, nombres y personaje; ya en versión 2 en memoria` por `// mismos espacios, nombres y personaje, sin actividades; ya en versión 3 en memoria` y la última línea por:
```js
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 3);
```

- [ ] Agregar al final de `test/almacen.test.js`:
```js
// Documento como lo guardaba la feature 002: versión 2 y sin actividades.
function comoV2(estado) {
  const { actividades, ...resto } = estado;
  return { ...resto, version: 2 };
}

// Actividad guardada tal como la escribe la feature 003 (para probar el almacén sin depender de sus operaciones).
function actividadGuardada(estado, id, extra = {}) {
  const [, diana] = estado.miembros;
  return {
    id, hogarId: estado.hogares[0].id, nombre: 'Lavar los platos', icono: 'platos', miembroId: diana.id,
    espacioId: espaciosDeTipo(estado, 'cocina')[0].id, tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null, hechaEn: null,
    creadoEn: '2026-10-06T10:00:00.000Z', actualizadoEn: '2026-10-06T10:00:00.000Z',
    creadoPor: 'cuenta-1', actualizadoPor: 'cuenta-1', eliminadoEn: null, ...extra,
  };
}

function hogarConActividades(ctx) {
  const e = hogarConHabitantes(ctx);
  const propietario = e.miembros[0];
  return {
    ...e,
    actividades: [
      actividadGuardada(e, 'act-1'),
      actividadGuardada(e, 'act-2', { nombre: 'Barrer', icono: 'barrer', miembroId: propietario.id, espacioId: null, tipo: 'repetitiva', frecuenciaDias: 7 }),
      actividadGuardada(e, 'act-3', { hechaEn: '2026-10-05' }),
    ],
  };
}

const conActividad = (base, nueva) => ({ ...base, actividades: base.actividades.map((a) => (a.id === nueva.id ? nueva : a)) });

test('AC-8.1 (003): las actividades se guardan y se restauran igual', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConActividades(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
});

test('AC-8.4 (003): un hogar de la feature 002 se abre sin aviso, sin actividades, y se guarda como versión 3 en el siguiente guardado', () => {
  const e = hogarConHabitantes(crearCtx());
  const textoV2 = JSON.stringify(comoV2(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV2 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios y habitantes, sin actividades; ya en versión 3 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV2); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 3);
});

test('migrarAV3 es pura: no modifica el documento de entrada y solo agrega la lista de actividades vacía', () => {
  const v2 = comoV2(hogarConHabitantes(crearCtx()));
  const copia = structuredClone(v2);
  const v3 = migrarAV3(v2);
  assert.deepEqual(v2, copia);
  assert.equal(v3.version, 3);
  assert.deepEqual(v3.actividades, []);
  assert.deepEqual(comoV2(v3), v2);
});

test('AC-8.5 (003): una actividad activa inválida vuelve ilegible el documento', () => {
  const base = hogarConActividades(crearCtx());
  const [act1, act2, act3] = base.actividades;
  const variantes = [
    { ...act1, tipo: 'mensual' },
    { ...act1, icono: 'escoba' },
    { ...act1, icono: 'toString' },
    { ...act1, nombre: 42 },
    { ...act1, vence: '2026-02-30' },
    { ...act1, vence: null },
    { ...act1, frecuenciaDias: 7 },
    { ...act1, miembroId: 'no-existe' },
    { ...act1, espacioId: 'no-existe' },
    { ...act1, espacioId: 'pasillo:izq' },
    { ...act2, frecuenciaDias: 5 },
    { ...act2, frecuenciaDias: '7' },
    { ...act2, hechaEn: '2026-10-05' },
    { ...act3, hechaEn: '2026-13-01' },
  ];
  for (const mala of variantes) {
    const { estado, aviso } = abrirDatos(conActividad(base, mala));
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(mala));
    assert.deepEqual(estado.actividades, []);
    assert.equal(estado.miembros.length, 1);
  }
});

test('AC-8.5 (003): un documento v3 sin lista de actividades, o con una activa que apunta a un miembro o a un espacio eliminados, es ilegible', () => {
  const base = hogarConActividades(crearCtx());
  const { actividades, ...sinLista } = base;
  assert.match(abrirDatos(sinLista).aviso, /No se pudo recuperar/);
  const diana = base.miembros[1];
  const sinDiana = { ...base, miembros: base.miembros.map((m) => (m.id === diana.id ? { ...m, eliminadoEn: '2026-10-06T11:00:00.000Z' } : m)) };
  assert.match(abrirDatos(sinDiana).aviso, /No se pudo recuperar/); // act-1 sigue activa y apunta a Diana
  const borrado = { ...base.espacios[0], id: 'esp-borrado', tipo: 'lavanderia', eliminadoEn: '2026-10-06T11:00:00.000Z' };
  const conEspacioBorrado = conActividad({ ...base, espacios: [...base.espacios, borrado] }, { ...base.actividades[0], espacioId: 'esp-borrado' });
  assert.match(abrirDatos(conEspacioBorrado).aviso, /No se pudo recuperar/);
});

test('AC-8.6 (003): una actividad eliminada con datos inválidos no vuelve ilegible el documento', () => {
  const base = hogarConActividades(crearCtx());
  const mala = { ...base.actividades[0], icono: 'escoba', miembroId: 'no-existe', vence: 'ayer', eliminadoEn: '2026-10-06T11:00:00.000Z' };
  const guardado = conActividad(base, mala);
  const { estado, aviso } = abrirDatos(guardado);
  assert.equal(aviso, null);
  assert.deepEqual(estado, JSON.parse(JSON.stringify(guardado)));
});
```

- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js` — expect: FAIL (`SyntaxError`: `../src/almacen.js` no exporta `migrarAV3`; y en `habitantes.test.js` la versión del hogar inicial es 2, no 3)
- [ ] Agregar al final de `src/catalogo.js`:
```js
// Actividades (feature 003): listas cerradas y límites. Las claves se guardan; las etiquetas se muestran.
export const ICONOS = {
  platos: 'Platos', barrer: 'Barrer', ropa: 'Ropa', basura: 'Basura', limpiar: 'Limpiar',
  compras: 'Compras', plantas: 'Plantas', mascota: 'Mascota', otra: 'Otra',
};
export const FRECUENCIAS = [1, 2, 3, 7, 14, 30]; // días
export const LIMITE_ACTIVIDADES = 50;
export const MAX_NOMBRE_ACTIVIDAD = 30;
```

- [ ] En `src/hogar.js`, en `crearHogarInicial`, reemplazar la línea `return { version: 2, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro] };` por:
```js
  // Documento versión 3 (ADR-003 de modelo de actividades): el hogar empieza sin actividades.
  return { version: 3, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [] };
```

- [ ] Reemplazar `src/almacen.js` completo por:
```js
// src/almacen.js
import { crearHogarInicial } from './hogar.js';
import { PARENTESCOS, GENEROS, ESPECIES, ICONOS, FRECUENCIAS } from './catalogo.js';
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

export function crearAlmacen(storage) {
  return {
    cargar() {
      try {
        const texto = storage.getItem(CLAVE_DATOS);
        if (texto === null) return { estado: null, error: null };
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) return { estado: migrarAV3(migrarAV2(estado)), error: null };
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidos(estado)) return { estado: migrarAV3(estado), error: null };
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)) {
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

// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002, FR-11 de la 003): recupera el hogar (migrándolo si es
// de una versión anterior) o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar();
  if (estado) return { estado, aviso: null };
  const nuevo = crearHogarInicial(ctx);
  almacen.guardar(nuevo);
  return { estado: nuevo, aviso: error === 'ilegible' ? 'No se pudo recuperar tu hogar guardado. Se creó un hogar nuevo.' : null };
}
```

- [ ] Run: `cd poc && node --test test/almacen.test.js test/habitantes.test.js test/hogar.test.js` — expect: PASS (`# pass 56`, `# fail 0`: 21 de almacén, 6 de ellas nuevas; 14 de habitantes y 21 de hogar)
- [ ] Commit: `feat(poc): save homes in format v3 with activities` (cuerpo: `Plan section: Phase 2: Formato guardado v3 y migración` y `Feature: 003-actividades`)

---

## Phase 3: Operaciones de actividades y bajas en cascada

**Implements:** FR-1, FR-3, FR-8 (lógica), FR-9, FR-12, Stories 1, 3, 6, 7, 9 (lógica) | **Satisfies:** AC-1.2 (lógica), AC-1.3 (datos), AC-1.4 (datos), AC-1.5 (datos), AC-1.6 (lógica), AC-1.7 (lógica), AC-1.9, AC-1.10, AC-3.2 (lógica), AC-3.3, AC-3.6, AC-3.8 (lógica), AC-6.3 (lógica), AC-6.4, AC-6.5, AC-6.6 (lógica), AC-7.1 a AC-7.10 (lógica), AC-9.1 a AC-9.5
**Files:** `poc/src/hogar.js`, `poc/src/actividades.js`, `poc/test/actividades.test.js`
**Interfaces:** Consumes: `ICONOS`, `FRECUENCIAS`, `LIMITE_ACTIVIDADES`, `MAX_NOMBRE_ACTIVIDAD` (Fase 2); `esFechaValida`, `sumarDias`, `diasEntre` (Fase 1); `crearCtx` y las operaciones de espacios y habitantes (001/002). Produces:
- **Desde `hogar.js`:**
  - `auditoriaNueva(ctx)` y `tocar(registro, ctx)`, ahora exportadas.
  - `actividadesPendientes(estado)`: no eliminadas y sin `hechaEn`.
  - `pendientesDeEspacios(estado, ids)` y `pendientesDeMiembro(estado, id)`: números de pendientes.
  - `consecuenciasDeEliminar(estado, id)`: gana `actividades`, el número de pendientes que se eliminarían, incluidas las del baño interno que se elimina con su cuarto.
  - `requiereConfirmacion`: también es `true` si `actividades > 0`.
  - `eliminarEspacio` y `eliminarHabitante`: dan de baja a sus actividades en la misma operación.
- **Desde `actividades.js`:**
  - Actividad (registro guardado): `{ id, hogarId, nombre, icono, miembroId, espacioId, tipo, vence, frecuenciaDias, hechaEn, ...auditoría }`.
  - Datos de la ficha: `{ nombre, icono, miembroId, espacioId (null = sin espacio), tipo, vence, frecuenciaDias }`.
  - `buscarActividad(estado, id)` → pendiente o `null`; `contarActividades(estado)` → número de pendientes; `puedeAgregarActividad(estado)`.
  - `agregarActividad(estado, datos, ctx)` y `editarActividad(estado, id, datos, ctx)` → `{ ok, estado, error? }`, con `error ∈ 'limite' | 'vacio' | 'largo' | 'icono' | 'miembro' | 'espacio' | 'fecha' | 'tipo' | 'frecuencia' | 'no-encontrada'`.
  - `eliminarActividad(estado, id, ctx)` y `marcarHecha(estado, id, hoy, ctx)` → estado (el mismo objeto si no aplica).
  - `MENSAJES_ACTIVIDAD`.

Implementa el ADR de modelo de actividades: un registro por actividad con su próxima fecha y referencias por id. Las operaciones son puras como las de espacios y habitantes. La baja en cascada vive en `hogar.js`, dentro de las mismas funciones que eliminan el espacio o el miembro, para que no exista un estado intermedio con referencias rotas.

- [ ] Escribir las pruebas de las operaciones:
```js
// test/actividades.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, agregarEspacio, eliminarEspacio, quitarUltimo, ultimoDeTipo, renombrarEspacio,
  renombrarMiembro, eliminarHabitante, espaciosDeTipo, espaciosActivos, miembrosActivos, familiares, mascotas, banoDe,
  consecuenciasDeEliminar, requiereConfirmacion, actividadesPendientes, pendientesDeMiembro, nombreVisible, buscarEspacio,
  puedeEliminar,
} from '../src/hogar.js';
import {
  agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, contarActividades, puedeAgregarActividad,
} from '../src/actividades.js';
import { crearCtx } from './ayuda.js';

const HOY = '2026-10-06';

function hogarBase(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

const cocina = (estado) => espaciosDeTipo(estado, 'cocina')[0];
const diana = (estado) => familiares(estado)[0];

// Datos válidos de la ficha: una puntual de Diana en la cocina que vence hoy; `extra` cambia lo que haga falta.
const datos = (estado, extra = {}) => ({
  nombre: 'Lavar los platos', icono: 'platos', miembroId: diana(estado).id, espacioId: cocina(estado).id,
  tipo: 'puntual', vence: HOY, frecuenciaDias: null, ...extra,
});

function alta(estado, d, ctx) {
  const r = agregarActividad(estado, d, ctx);
  assert.equal(r.ok, true, `alta de ${d.nombre}: ${r.error}`);
  return r.estado;
}

const ultima = (estado) => estado.actividades.at(-1);

test('AC-1.3, AC-9.2, AC-9.3: crear una puntual guarda sus datos, su auditoría y sus referencias por id', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  const e = alta(base, datos(base), ctx);
  const a = ultima(e);
  assert.deepEqual(
    [a.nombre, a.icono, a.miembroId, a.espacioId, a.tipo, a.vence, a.frecuenciaDias, a.hechaEn, a.hogarId],
    ['Lavar los platos', 'platos', diana(base).id, cocina(base).id, 'puntual', HOY, null, null, base.hogares[0].id],
  );
  assert.ok(a.id && a.creadoEn && a.actualizadoEn);
  assert.deepEqual([a.creadoPor, a.actualizadoPor, a.eliminadoEn], ['cuenta-1', 'cuenta-1', null]);
  assert.equal('cuentaId' in a, false);
  assert.deepEqual([contarActividades(base), contarActividades(e)], [0, 1]);
  assert.deepEqual(buscarActividad(e, a.id), a);
});

test('AC-1.2, FR-1: una repetitiva exige una frecuencia de la lista; una puntual nunca guarda frecuencia', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  for (const frecuenciaDias of [null, 5, '7', 0]) {
    const r = agregarActividad(e, datos(e, { tipo: 'repetitiva', frecuenciaDias }), ctx);
    assert.equal(r.error, 'frecuencia', String(frecuenciaDias));
    assert.equal(r.estado, e);
  }
  for (const frecuenciaDias of [1, 2, 3, 7, 14, 30]) {
    assert.equal(ultima(alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias }), ctx)).frecuenciaDias, frecuenciaDias);
  }
  assert.equal(ultima(alta(e, datos(e, { tipo: 'puntual', frecuenciaDias: 7 }), ctx)).frecuenciaDias, null);
});

test('AC-1.6, FR-1: faltan datos o están fuera de las listas cerradas', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const firulais = mascotas(e)[0];
  e = eliminarHabitante(e, firulais.id, ctx);
  const casos = [
    [{ nombre: '' }, 'vacio'],
    [{ nombre: '   ' }, 'vacio'],
    [{ miembroId: undefined }, 'miembro'],
    [{ miembroId: '' }, 'miembro'],
    [{ miembroId: firulais.id }, 'miembro'], // miembro eliminado
    [{ icono: 'escoba' }, 'icono'],
    [{ icono: 'toString' }, 'icono'],
    [{ espacioId: 'pasillo:izq' }, 'espacio'],
    [{ espacioId: 'no-existe' }, 'espacio'],
    [{ tipo: 'mensual' }, 'tipo'],
    [{ vence: '2026-02-30' }, 'fecha'],
    [{ vence: '' }, 'fecha'],
  ];
  for (const [extra, error] of casos) {
    const r = agregarActividad(e, datos(e, extra), ctx);
    assert.equal(r.ok, false, JSON.stringify(extra));
    assert.equal(r.error, error, JSON.stringify(extra));
    assert.equal(r.estado, e);
  }
});

test('AC-1.9, AC-1.10: el nombre se recorta, admite hasta 30 caracteres y puede repetirse', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { nombre: '  Barrer  ' }), ctx);
  assert.equal(ultima(e).nombre, 'Barrer');
  e = alta(e, datos(e, { nombre: 'barrer' }), ctx);
  assert.equal(ultima(e).nombre, 'barrer');
  assert.equal(agregarActividad(e, datos(e, { nombre: 'x'.repeat(31) }), ctx).error, 'largo');
  assert.equal(ultima(alta(e, datos(e, { nombre: 'x'.repeat(30) }), ctx)).nombre, 'x'.repeat(30));
});

test('AC-1.4, AC-1.5, FR-1: la fecha puede ser pasada o futura y el espacio es opcional', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  assert.equal(ultima(alta(e, datos(e, { vence: '2026-10-03' }), ctx)).vence, '2026-10-03');
  assert.equal(ultima(alta(e, datos(e, { vence: '2026-12-24' }), ctx)).vence, '2026-12-24');
  assert.equal(ultima(alta(e, datos(e, { espacioId: null }), ctx)).espacioId, null);
  assert.equal(ultima(alta(e, datos(e, { espacioId: undefined }), ctx)).espacioId, null);
});

test('AC-1.7, FR-1: hasta 50 actividades pendientes; las eliminadas y las hechas no cuentan', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  for (let i = 1; i <= 50; i++) e = alta(e, datos(e, { nombre: `Tarea ${i}` }), ctx);
  assert.equal(contarActividades(e), 50);
  assert.equal(puedeAgregarActividad(e), false);
  const r = agregarActividad(e, datos(e, { nombre: 'Tarea 51' }), ctx);
  assert.deepEqual([r.ok, r.error, r.estado === e], [false, 'limite', true]);
  e = eliminarActividad(e, e.actividades[0].id, ctx);
  assert.equal(puedeAgregarActividad(e), true);
  e = alta(e, datos(e, { nombre: 'Tarea 51' }), ctx);
  e = marcarHecha(e, e.actividades[1].id, HOY, ctx);
  assert.equal(contarActividades(e), 49);
  assert.equal(puedeAgregarActividad(e), true);
});

test('AC-6.3, AC-6.4, AC-9.1: editar cambia todos los datos, pasa de puntual a repetitiva y vuelta, y conserva el identificador', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  const { id, creadoEn } = ultima(e);
  const firulais = mascotas(e)[0];
  let r = editarActividad(e, id, {
    nombre: 'Pasear', icono: 'mascota', miembroId: firulais.id, espacioId: null, tipo: 'repetitiva', vence: '2026-10-08', frecuenciaDias: 2,
  }, ctx);
  assert.equal(r.ok, true, r.error);
  let a = buscarActividad(r.estado, id);
  assert.deepEqual(
    [a.id, a.nombre, a.icono, a.miembroId, a.espacioId, a.tipo, a.vence, a.frecuenciaDias, a.hechaEn],
    [id, 'Pasear', 'mascota', firulais.id, null, 'repetitiva', '2026-10-08', 2, null],
  );
  assert.equal(a.creadoEn, creadoEn);
  assert.ok(a.actualizadoEn > a.creadoEn);
  r = editarActividad(r.estado, id, { ...a, tipo: 'puntual' }, ctx);
  a = buscarActividad(r.estado, id);
  assert.deepEqual([a.id, a.tipo, a.frecuenciaDias], [id, 'puntual', null]);
  assert.equal(r.estado.actividades.length, 1);
});

test('AC-6.5: editar con un nombre vacío se rechaza y conserva el nombre anterior', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  const { id } = ultima(e);
  const r = editarActividad(e, id, datos(e, { nombre: '   ' }), ctx);
  assert.deepEqual([r.ok, r.error, r.estado === e], [false, 'vacio', true]);
  assert.equal(buscarActividad(e, id).nombre, 'Lavar los platos');
  assert.equal(editarActividad(e, 'no-existe', datos(e), ctx).error, 'no-encontrada');
});

test('AC-6.6, AC-7.10, FR-8: eliminar es un borrado lógico y no toca nada más', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e), ctx);
  e = alta(e, datos(e, { nombre: 'Barrer', icono: 'barrer' }), ctx);
  const [platos, barrer] = e.actividades;
  const despues = eliminarActividad(e, platos.id, ctx);
  const registro = despues.actividades.find((a) => a.id === platos.id);
  assert.ok(registro.eliminadoEn);
  assert.equal(buscarActividad(despues, platos.id), null);
  assert.equal(contarActividades(despues), 1);
  assert.deepEqual(despues.actividades.find((a) => a.id === barrer.id), barrer);
  assert.deepEqual([despues.espacios, despues.miembros], [e.espacios, e.miembros]);
  assert.equal(eliminarActividad(despues, platos.id, ctx), despues);
  assert.equal(eliminarActividad(despues, 'no-existe', ctx), despues);
});

test('AC-3.2, AC-3.6, AC-3.8, AC-9.5: marcar como hecha una puntual de cualquier miembro registra el día y deja de estar pendiente', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { miembroId: mascotas(e)[0].id, vence: '2026-10-04' }), ctx);
  const { id } = ultima(e);
  const despues = marcarHecha(e, id, HOY, ctx);
  const a = despues.actividades.find((x) => x.id === id);
  assert.deepEqual([a.id, a.hechaEn, a.eliminadoEn, a.vence], [id, HOY, null, '2026-10-04']);
  assert.equal(buscarActividad(despues, id), null);
  assert.deepEqual(actividadesPendientes(despues), []);
});

test('AC-3.3, AC-5.6: marcar como hecha una repetitiva la hace vencer hoy más su frecuencia, sin acumular atrasos', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias: 7, vence: '2026-09-20' }), ctx);
  e = alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias: 3, vence: HOY }), ctx);
  const [semanal, cadaTres] = e.actividades;
  e = marcarHecha(e, semanal.id, HOY, ctx);
  e = marcarHecha(e, cadaTres.id, HOY, ctx);
  assert.deepEqual([buscarActividad(e, semanal.id).vence, buscarActividad(e, cadaTres.id).vence], ['2026-10-13', '2026-10-09']);
  assert.equal(buscarActividad(e, semanal.id).hechaEn, null);
  assert.equal(contarActividades(e), 2);
});

test('FR-3: no se marca como hecha una actividad futura, ya hecha, eliminada o inexistente', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { vence: '2026-10-07' }), ctx);
  e = alta(e, datos(e, { nombre: 'Barrer' }), ctx);
  e = alta(e, datos(e, { nombre: 'Basura' }), ctx);
  const [futura, barrer, basura] = e.actividades;
  assert.equal(marcarHecha(e, futura.id, HOY, ctx), e);
  e = marcarHecha(e, barrer.id, HOY, ctx);
  assert.equal(marcarHecha(e, barrer.id, HOY, ctx), e);
  e = eliminarActividad(e, basura.id, ctx);
  assert.equal(marcarHecha(e, basura.id, HOY, ctx), e);
  assert.equal(marcarHecha(e, 'no-existe', HOY, ctx), e);
});

test('AC-7.1, AC-7.3, FR-9: eliminar un espacio elimina todas sus actividades y ninguna otra; la confirmación cuenta las pendientes', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'lavanderia', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const lavanderia = espaciosDeTipo(e, 'lavanderia')[0];
  e = alta(e, datos(e, { espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { espacioId: d2.id, vence: '2026-10-20' }), ctx);
  e = alta(e, datos(e, { espacioId: d2.id, nombre: 'Hecha' }), ctx);
  e = marcarHecha(e, ultima(e).id, HOY, ctx);
  e = alta(e, datos(e), ctx); // en la cocina
  e = alta(e, datos(e, { espacioId: null }), ctx); // sin espacio
  assert.equal(consecuenciasDeEliminar(e, d2.id).actividades, 2);
  assert.equal(requiereConfirmacion(e, d2.id), true); // sin nombre personalizado, pero con actividades
  assert.equal(requiereConfirmacion(e, lavanderia.id), false); // sin nombre personalizado ni actividades
  const despues = eliminarEspacio(e, d2.id, ctx);
  const deD2 = despues.actividades.filter((a) => a.espacioId === d2.id);
  assert.equal(deD2.length, 3);
  assert.ok(deD2.every((a) => a.eliminadoEn !== null));
  assert.ok(despues.actividades.filter((a) => a.espacioId !== d2.id).every((a) => a.eliminadoEn === null));
  assert.equal(contarActividades(despues), 2);
});

test('AC-7.4: si el baño interno se elimina con su cuarto, también se eliminan sus actividades y la confirmación las suma', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  e = agregarEspacio(agregarEspacio(e, 'bano', ctx), 'bano', ctx); // los dos dormitorios tienen baño: no hay adónde moverlo
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const banoD1 = banoDe(e, d1.id);
  const banoD2 = banoDe(e, d2.id);
  e = alta(e, datos(e, { espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { espacioId: banoD2.id }), ctx);
  e = alta(e, datos(e, { espacioId: banoD2.id, vence: '2026-10-20' }), ctx);
  e = alta(e, datos(e, { espacioId: banoD1.id }), ctx);
  const c = consecuenciasDeEliminar(e, d2.id);
  assert.deepEqual([c.banoSeElimina, c.actividades], [true, 3]);
  const despues = eliminarEspacio(e, d2.id, ctx);
  assert.equal(buscarEspacio(despues, banoD2.id), null);
  assert.deepEqual(actividadesPendientes(despues).map((a) => a.espacioId), [banoD1.id]);
});

test('AC-7.5: si el baño interno se mueve a otro cuarto, conserva sus actividades y solo se eliminan las del cuarto', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx); // el baño va a Dormitorio 1
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = alta(e, datos(e, { espacioId: d1.id }), ctx);
  e = alta(e, datos(e, { espacioId: bano.id }), ctx);
  const c = consecuenciasDeEliminar(e, d1.id);
  assert.deepEqual([c.banoSeMueve, c.actividades], [true, 1]);
  const despues = eliminarEspacio(e, d1.id, ctx);
  assert.equal(buscarEspacio(despues, bano.id).contenidoEn, d2.id);
  assert.deepEqual(actividadesPendientes(despues).map((a) => a.espacioId), [bano.id]);
});

test('AC-7.6: quitar con "−" pide la misma confirmación y aplica la misma cascada', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'bano', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const bano = ultimoDeTipo(e, 'bano');
  e = alta(e, datos(e, { espacioId: d2.id }), ctx);
  e = alta(e, datos(e, { espacioId: bano.id }), ctx);
  assert.equal(ultimoDeTipo(e, 'dormitorio').id, d2.id);
  assert.deepEqual([requiereConfirmacion(e, d2.id), consecuenciasDeEliminar(e, d2.id).actividades], [true, 1]);
  assert.deepEqual([requiereConfirmacion(e, bano.id), consecuenciasDeEliminar(e, bano.id).actividades], [true, 1]);
  assert.deepEqual(actividadesPendientes(quitarUltimo(e, 'dormitorio', ctx)).map((a) => a.espacioId), [bano.id]);
  assert.deepEqual(actividadesPendientes(quitarUltimo(e, 'bano', ctx)).map((a) => a.espacioId), [d2.id]);
});

test('AC-7.7, AC-7.8, AC-7.9, FR-9: eliminar un habitante elimina sus actividades; el propietario no se elimina', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const propietario = miembrosActivos(e)[0];
  const firulais = mascotas(e)[0];
  for (const nombre of ['Uno', 'Dos', 'Tres', 'Hecha']) e = alta(e, datos(e, { nombre }), ctx);
  e = marcarHecha(e, ultima(e).id, HOY, ctx);
  e = alta(e, datos(e, { nombre: 'Del propietario', miembroId: propietario.id }), ctx);
  assert.equal(pendientesDeMiembro(e, diana(e).id), 3);
  assert.equal(pendientesDeMiembro(e, firulais.id), 0);
  const sinDiana = eliminarHabitante(e, diana(e).id, ctx);
  assert.ok(sinDiana.actividades.filter((a) => a.miembroId === diana(e).id).every((a) => a.eliminadoEn !== null));
  assert.deepEqual(actividadesPendientes(sinDiana).map((a) => a.nombre), ['Del propietario']);
  assert.equal(eliminarHabitante(e, propietario.id, ctx), e);
});

test('AC-9.4: renombrar o renumerar el espacio o renombrar el miembro no cambia los vínculos', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(agregarEspacio(hogarBase(ctx), 'dormitorio', ctx), 'dormitorio', ctx);
  const [, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = alta(e, datos(e, { espacioId: d3.id }), ctx);
  const { id } = ultima(e);
  e = eliminarEspacio(e, d2.id, ctx);
  assert.equal(nombreVisible(e, buscarEspacio(e, d3.id)), 'Dormitorio 2');
  e = renombrarEspacio(e, d3.id, 'Cuarto de Bryam', ctx).estado;
  e = renombrarMiembro(e, diana(e).id, 'Dana', ctx).estado;
  const a = buscarActividad(e, id);
  assert.deepEqual([a.espacioId, a.miembroId], [d3.id, diana(e).id]);
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
  const miembros = new Set(miembrosActivos(estado).map((m) => m.id));
  const espacios = new Set(espaciosActivos(estado).map((x) => x.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null)
    .every((a) => miembros.has(a.miembroId) && (a.espacioId === null || espacios.has(a.espacioId)));
}

test('Reliability, FR-9: ninguna baja de un espacio o de un miembro deja una actividad activa con referencias rotas', () => {
  for (const banos of [0, 3, 6]) {
    const ctx = crearCtx();
    let e = hogarCompleto(ctx, banos);
    for (const m of miembrosActivos(e)) e = alta(e, datos(e, { miembroId: m.id, espacioId: null }), ctx);
    for (const x of espaciosActivos(e)) e = alta(e, datos(e, { espacioId: x.id }), ctx);
    for (const x of espaciosActivos(e).filter((x) => puedeEliminar(e, x.id))) {
      const despues = eliminarEspacio(e, x.id, ctx);
      assert.ok(referenciasValidas(despues), `${banos} baños, sin ${nombreVisible(e, x)}`);
      assert.ok(contarActividades(despues) < contarActividades(e));
    }
    for (const m of miembrosActivos(e).slice(1)) assert.ok(referenciasValidas(eliminarHabitante(e, m.id, ctx)), m.nombre);
  }
});
```

- [ ] Run: `cd poc && node --test test/actividades.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/actividades.js`)
- [ ] En `src/hogar.js`, reemplazar `function auditoriaNueva(ctx) {` por `export function auditoriaNueva(ctx) {` y `function tocar(registro, ctx) {` por `export function tocar(registro, ctx) {` (las usa `actividades.js` para la misma auditoría).
- [ ] En `src/hogar.js`, reemplazar `consecuenciasDeEliminar` y `requiereConfirmacion` completas por:
```js
// Qué pasaría al eliminar este espacio (para decidir si se pide confirmación). `actividades` cuenta las pendientes
// que se eliminarían con él, incluidas las de su baño interno si se elimina con él (FR-9 de la 003).
export function consecuenciasDeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  const bano = espacio ? banoDe(estado, espacio.id) : null;
  const banoSeElimina = Boolean(bano) && siguienteDestinoBano(estado, id) === null;
  return {
    tieneNombrePersonalizado: Boolean(espacio?.nombrePersonalizado),
    banoSeElimina,
    banoSeMueve: Boolean(bano) && !banoSeElimina,
    actividades: pendientesDeEspacios(estado, banoSeElimina ? [id, bano.id] : [id]),
  };
}

export const requiereConfirmacion = (estado, id) => {
  const c = consecuenciasDeEliminar(estado, id);
  return c.tieneNombrePersonalizado || c.banoSeElimina || c.actividades > 0;
};
```

- [ ] En `src/hogar.js`, reemplazar `eliminarEspacio` completa por:
```js
export function eliminarEspacio(estado, id, ctx) {
  if (!puedeEliminar(estado, id)) return estado;
  const espacio = buscarEspacio(estado, id);
  const bano = banoDe(estado, id);
  const destino = bano ? siguienteDestinoBano(estado, id) : null;
  const ahora = ctx.ahora();
  const cambios = [{ ...tocar(espacio, ctx), eliminadoEn: ahora }];
  if (bano && destino) cambios.push({ ...tocar(bano, ctx), contenidoEn: destino.id });
  if (bano && !destino) cambios.push({ ...tocar(bano, ctx), eliminadoEn: ahora });
  let resultado = reemplazar(estado, cambios);
  // Baja en cascada de las actividades del espacio y, si se elimina con él, de su baño interno (FR-9 de la 003).
  const eliminados = bano && !destino ? [id, bano.id] : [id];
  resultado = darDeBajaActividades(resultado, (a) => eliminados.includes(a.espacioId), ahora, ctx);
  // Recompactar el orden de los restantes del mismo tipo (solo cambia el nombre automático).
  const restantes = espaciosDeTipo(resultado, espacio.tipo);
  const reordenados = restantes.filter((e, i) => e.orden !== i + 1).map((e) => ({ ...tocar(e, ctx), orden: restantes.indexOf(e) + 1 }));
  resultado = reemplazar(resultado, reordenados);
  if (bano && !destino) {
    const banos = espaciosDeTipo(resultado, 'bano');
    resultado = reemplazar(resultado, banos.filter((b, i) => b.orden !== i + 1).map((b) => ({ ...tocar(b, ctx), orden: banos.indexOf(b) + 1 })));
  }
  return resultado;
}
```

- [ ] En `src/hogar.js`, reemplazar `eliminarHabitante` completa por:
```js
// Borrado lógico (FR-4, FR-10 de la 002): el registro queda con su fecha de eliminación; no afecta a los espacios
// ni a los demás miembros. Sus actividades se dan de baja en la misma operación (FR-9 de la 003).
export function eliminarHabitante(estado, id, ctx) {
  if (!puedeEliminarMiembro(estado, id)) return estado;
  const ahora = ctx.ahora();
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), eliminadoEn: ahora } : m));
  return darDeBajaActividades({ ...estado, miembros }, (a) => a.miembroId === id, ahora, ctx);
}
```

- [ ] En `src/hogar.js`, agregar antes de `export const MENSAJES_ERROR`:
```js
// ---------- Actividades (feature 003): consultas y bajas en cascada ----------

// Pendiente: no eliminada y, si es puntual, todavía no hecha (FR-2 de la 003). Las repetitivas nunca tienen `hechaEn`.
export const actividadesPendientes = (estado) => estado.actividades.filter((a) => a.eliminadoEn === null && a.hechaEn === null);
export const pendientesDeEspacios = (estado, ids) => actividadesPendientes(estado).filter((a) => ids.includes(a.espacioId)).length;
export const pendientesDeMiembro = (estado, id) => actividadesPendientes(estado).filter((a) => a.miembroId === id).length;

// Baja lógica, con la misma fecha, de todas las actividades no eliminadas (pendientes y hechas) que cumplen `afectada` (FR-9 de la 003).
function darDeBajaActividades(estado, afectada, ahora, ctx) {
  const actividades = estado.actividades.map((a) => (a.eliminadoEn === null && afectada(a) ? { ...tocar(a, ctx), eliminadoEn: ahora } : a));
  return { ...estado, actividades };
}
```

- [ ] Crear el módulo de actividades:
```js
// src/actividades.js
// Actividades del hogar (feature 003): operaciones puras sobre `estado.actividades` (ADR-003 de modelo de actividades).
import { ICONOS, FRECUENCIAS, LIMITE_ACTIVIDADES, MAX_NOMBRE_ACTIVIDAD } from './catalogo.js';
import { buscarMiembro, buscarEspacio, actividadesPendientes, auditoriaNueva, tocar } from './hogar.js';
import { esFechaValida, sumarDias, diasEntre } from './fechas.js';

export const buscarActividad = (estado, id) => actividadesPendientes(estado).find((a) => a.id === id) ?? null;
// El límite cuenta las pendientes: las eliminadas y las puntuales hechas no ocupan cupo (FR-1).
export const contarActividades = (estado) => actividadesPendientes(estado).length;
export const puedeAgregarActividad = (estado) => contarActividades(estado) < LIMITE_ACTIVIDADES;

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);

// Valida y normaliza los datos de la ficha (FR-1). Devuelve { error } o { datos } listos para guardar.
function validarActividad(estado, datos) {
  const nombre = (datos.nombre ?? '').trim();
  if (nombre === '') return { error: 'vacio' };
  if (nombre.length > MAX_NOMBRE_ACTIVIDAD) return { error: 'largo' };
  if (!enLista(ICONOS, datos.icono)) return { error: 'icono' };
  if (!buscarMiembro(estado, datos.miembroId)) return { error: 'miembro' };
  const espacioId = datos.espacioId ?? null;
  if (espacioId !== null && !buscarEspacio(estado, espacioId)) return { error: 'espacio' };
  if (!esFechaValida(datos.vence)) return { error: 'fecha' };
  const comunes = { nombre, icono: datos.icono, miembroId: datos.miembroId, espacioId, vence: datos.vence };
  if (datos.tipo === 'puntual') return { datos: { ...comunes, tipo: 'puntual', frecuenciaDias: null } };
  if (datos.tipo !== 'repetitiva') return { error: 'tipo' };
  if (!FRECUENCIAS.includes(datos.frecuenciaDias)) return { error: 'frecuencia' };
  return { datos: { ...comunes, tipo: 'repetitiva', frecuenciaDias: datos.frecuenciaDias } };
}

export function agregarActividad(estado, datos, ctx) {
  if (!puedeAgregarActividad(estado)) return { ok: false, error: 'limite', estado };
  const v = validarActividad(estado, datos);
  if (v.error) return { ok: false, error: v.error, estado };
  const actividad = { id: ctx.nuevoId(), hogarId: estado.hogares[0].id, ...v.datos, hechaEn: null, ...auditoriaNueva(ctx) };
  return { ok: true, estado: { ...estado, actividades: [...estado.actividades, actividad] } };
}

export function editarActividad(estado, id, datos, ctx) {
  if (!buscarActividad(estado, id)) return { ok: false, error: 'no-encontrada', estado };
  const v = validarActividad(estado, datos);
  if (v.error) return { ok: false, error: v.error, estado };
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...v.datos } : a));
  return { ok: true, estado: { ...estado, actividades } };
}

// Borrado lógico (FR-8): el registro queda con su fecha de eliminación; no afecta a nada más.
export function eliminarActividad(estado, id, ctx) {
  if (!buscarActividad(estado, id)) return estado;
  const ahora = ctx.ahora();
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), eliminadoEn: ahora } : a));
  return { ...estado, actividades };
}

// "Hecho" (FR-3): solo para una actividad por hacer (vence hoy o antes). La puntual registra el día;
// la repetitiva vuelve a vencer hoy más su frecuencia, sin acumular atrasos.
export function marcarHecha(estado, id, hoy, ctx) {
  const actividad = buscarActividad(estado, id);
  if (!actividad || diasEntre(actividad.vence, hoy) < 0) return estado;
  const cambio = actividad.tipo === 'puntual' ? { hechaEn: hoy } : { vence: sumarDias(hoy, actividad.frecuenciaDias) };
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...cambio } : a));
  return { ...estado, actividades };
}

export const MENSAJES_ACTIVIDAD = {
  vacio: 'El nombre no puede estar vacío.',
  largo: 'El nombre puede tener como máximo 30 caracteres.',
  icono: 'Elige un icono de la lista.',
  miembro: 'Elige a quién se asigna.',
  espacio: 'Elige un espacio de la lista.',
  tipo: 'Elige si es puntual o repetitiva.',
  fecha: 'Elige una fecha válida.',
  frecuencia: 'Elige cada cuántos días se repite.',
  limite: 'Ya hay 50 actividades pendientes.',
  'no-encontrada': 'Esa actividad ya no está pendiente.',
};
```

- [ ] Run: `cd poc && node --test test/actividades.test.js test/hogar.test.js test/habitantes.test.js test/almacen.test.js` — expect: PASS (`# pass 75`, `# fail 0`: 19 de actividades, 21 de hogar, 14 de habitantes y 21 de almacén)
- [ ] Commit: `feat(poc): add activities with cascading removal` (cuerpo: `Plan section: Phase 3: Operaciones de actividades y bajas en cascada` y `Feature: 003-actividades`)

---

## Phase 4: Estado derivado, burbujas y aspecto en el mapa

**Implements:** FR-2, FR-4, FR-5 (lógica), FR-6 (lógica), FR-7 (lógica), FR-8 (lista), FR-10 (lógica), Stories 2, 4, 5 (lógica) | **Satisfies:** AC-2.1 a AC-2.8 (lógica), AC-3.1 (textos), AC-3.4, AC-3.5, AC-4.1 a AC-4.7 (lógica), AC-5.1, AC-5.2, AC-5.6, AC-6.1 (lista)
**Files:** `poc/src/actividades.js`, `poc/src/aspecto.js`, `poc/test/actividades.test.js`, `poc/test/aspecto.test.js`
**Interfaces:** Consumes: `actividadesPendientes` (Fase 3); `diasEntre` (Fase 1); `generarDistribucion`, `esTransitable` (001); `claveCasilla` (002). Produces:
- **Desde `actividades.js`:**
  - `UMBRAL_DESORDENADO = 1` y `UMBRAL_DESASTRE = 3`.
  - `atraso(actividad, hoy)` → entero.
  - `porHacer(estado, hoy)` → pendientes con atraso ≥ 0, de la más atrasada a la menos; a igual atraso, en orden de creación.
  - `limpiezaDeEspacio(estado, espacioId, hoy)` → `'limpio' | 'desordenado' | 'desastre'`.
  - `burbujas(estado, hoy)` → `[{ tipo: 'espacio' | 'miembro', id, icono, actividades: [ids], mas }]`.
  - `actividadesDelLugar(estado, { tipo, id }, hoy)`.
  - `listaDelPanel(estado)` → pendientes por fecha de vencimiento.
  - `textoPlazo(actividad, hoy)`.
- **Desde `aspecto.js`:**
  - `INSIGNIAS` y `OBJETOS_POR_ESTADO`.
  - `casillasLibres(distribucion, espacioId)` → `[{ x, y }]`: casillas de su área, transitables y sin puertas, en orden de lectura.
  - `casillaDeBurbuja(distribucion, espacioId)` → la primera de esas casillas o `null`.
  - `objetosDelSuelo(distribucion, espacioId, limpieza)` → `[{ x, y, variante }]`, con `variante` de 0 a 5.
  - `ubicarBurbujas(lista, distribucion, posiciones: Map<miembroId, { x, y }>)` → cada burbuja con su `x, y` (la de un miembro, una casilla encima de él; si el miembro no está en `posiciones`, se omite).

Implementa el ADR de estado derivado: nada de esto se guarda; todo es una función pura de `(estado, hoy)` y, para el mapa, de la distribución. Los objetos del suelo se eligen con un hash del identificador del espacio y de la casilla, sin azar. Así no cambian entre cuadros ni al recargar, y el desastre siempre agrega objetos a los del desorden.

- [ ] En `test/actividades.test.js`, reemplazar el import de `../src/actividades.js` (de varias líneas) por:
```js
import {
  agregarActividad, editarActividad, eliminarActividad, marcarHecha, buscarActividad, contarActividades, puedeAgregarActividad,
  atraso, porHacer, limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo,
} from '../src/actividades.js';
```

- [ ] Agregar al final de `test/actividades.test.js`:
```js
// ---------- Estado derivado ----------

// Hogar con una actividad de Diana en la cocina por cada fecha de `vences`, en ese orden de creación.
function conVencimientos(vences, extra = {}) {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  for (const vence of vences) e = alta(e, datos(e, { vence, ...extra }), ctx);
  return { e, ctx };
}

test('FR-2, AC-2.7: por hacer son las pendientes que vencen hoy o antes, de la más atrasada a la menos', () => {
  const { e: base, ctx } = conVencimientos([HOY, '2026-10-05', '2026-10-07', '2026-10-01', '2026-10-02']);
  const [hoy, ayer, manana, hecha, eliminada] = base.actividades;
  let e = marcarHecha(base, hecha.id, HOY, ctx);
  e = eliminarActividad(e, eliminada.id, ctx);
  assert.deepEqual(porHacer(e, HOY).map((a) => a.id), [ayer.id, hoy.id]);
  assert.deepEqual([atraso(hoy, HOY), atraso(ayer, HOY), atraso(manana, HOY)], [0, 1, -1]);
});

test('AC-4.1 a AC-4.4, Reliability: umbrales del estado por días de atraso de la actividad más atrasada', () => {
  const casos = [
    [[], 'limpio'], [[HOY], 'limpio'], [['2026-10-07'], 'limpio'], [['2026-10-05'], 'desordenado'],
    [['2026-10-04'], 'desordenado'], [['2026-10-03'], 'desastre'], [['2026-09-01'], 'desastre'],
    [[HOY, '2026-10-04', '2026-10-07'], 'desordenado'],
  ];
  for (const [vences, esperado] of casos) {
    const { e } = conVencimientos(vences);
    assert.equal(limpiezaDeEspacio(e, cocina(e).id, HOY), esperado, vences.join(', '));
  }
});

test('AC-3.4, AC-3.5: al marcar como hecha la más atrasada, el estado sigue a la que queda', () => {
  const { e: base, ctx } = conVencimientos(['2026-10-02', '2026-10-05']);
  const [cuatro, uno] = base.actividades;
  assert.equal(limpiezaDeEspacio(base, cocina(base).id, HOY), 'desastre');
  const e = marcarHecha(base, cuatro.id, HOY, ctx);
  assert.equal(limpiezaDeEspacio(e, cocina(e).id, HOY), 'desordenado');
  assert.equal(limpiezaDeEspacio(marcarHecha(e, uno.id, HOY, ctx), cocina(e).id, HOY), 'limpio');
});

test('AC-4.5, AC-4.6: el estado de un espacio solo considera sus propias actividades; el baño interno es un espacio propio', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(hogarBase(ctx), 'bano', ctx);
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  const bano = banoDe(e, d1.id);
  const sala = espaciosDeTipo(e, 'sala')[0];
  e = alta(e, datos(e, { vence: '2026-10-01' }), ctx);
  e = alta(e, datos(e, { vence: '2026-10-01', espacioId: null }), ctx);
  e = alta(e, datos(e, { vence: '2026-10-05', espacioId: bano.id }), ctx);
  assert.deepEqual(
    [cocina(e), sala, d1, bano].map((x) => limpiezaDeEspacio(e, x.id, HOY)),
    ['desastre', 'limpio', 'limpio', 'desordenado'],
  );
});

test('AC-2.1, AC-2.2, AC-2.5, AC-2.6, FR-6: una burbuja por lugar, con el icono de la más atrasada y el indicador de más', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  const sala = espaciosDeTipo(e, 'sala')[0];
  const firulais = mascotas(e)[0];
  e = alta(e, datos(e, { icono: 'platos', vence: HOY }), ctx);
  e = alta(e, datos(e, { icono: 'basura', vence: '2026-10-04' }), ctx);
  e = alta(e, datos(e, { icono: 'limpiar', vence: '2026-10-05' }), ctx);
  e = alta(e, datos(e, { icono: 'barrer', espacioId: sala.id }), ctx);
  e = alta(e, datos(e, { icono: 'ropa', espacioId: null, vence: '2026-10-05' }), ctx);
  e = alta(e, datos(e, { icono: 'compras', espacioId: null }), ctx);
  e = alta(e, datos(e, { icono: 'mascota', miembroId: firulais.id }), ctx); // con espacio: va en la burbuja de la cocina
  const [platos, basura, limpiar, barrer, ropa, compras, paseo] = e.actividades;
  assert.deepEqual(burbujas(e, HOY), [
    { tipo: 'espacio', id: cocina(e).id, icono: 'basura', actividades: [basura.id, limpiar.id, platos.id, paseo.id], mas: true },
    { tipo: 'miembro', id: diana(e).id, icono: 'ropa', actividades: [ropa.id, compras.id], mas: true },
    { tipo: 'espacio', id: sala.id, icono: 'barrer', actividades: [barrer.id], mas: false },
  ]);
});

test('AC-2.3: a igual atraso, la burbuja muestra el icono de la actividad creada primero', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { icono: 'plantas', vence: '2026-10-05' }), ctx);
  e = alta(e, datos(e, { icono: 'basura', vence: '2026-10-05' }), ctx);
  assert.equal(burbujas(e, HOY)[0].icono, 'plantas');
});

test('FR-7: la hoja de un lugar lista sus actividades por hacer en el orden de la burbuja', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { nombre: 'Hoy' }), ctx);
  e = alta(e, datos(e, { nombre: 'Atrasada', vence: '2026-10-03' }), ctx);
  e = alta(e, datos(e, { nombre: 'Futura', vence: '2026-10-09' }), ctx);
  e = alta(e, datos(e, { nombre: 'Sin espacio', espacioId: null }), ctx);
  const nombres = (lugar) => actividadesDelLugar(e, lugar, HOY).map((a) => a.nombre);
  assert.deepEqual(nombres({ tipo: 'espacio', id: cocina(e).id }), ['Atrasada', 'Hoy']);
  assert.deepEqual(nombres({ tipo: 'miembro', id: diana(e).id }), ['Sin espacio']);
  assert.deepEqual(nombres({ tipo: 'miembro', id: mascotas(e)[0].id }), []);
});

test('AC-6.1, FR-8: la lista del panel tiene todas las pendientes por fecha de vencimiento, sin las hechas ni las eliminadas', () => {
  const { e: base, ctx } = conVencimientos(['2026-10-20', HOY, '2026-10-01', '2026-10-09', '2026-10-02']);
  const [veinte, hoy, uno, nueve, dos] = base.actividades;
  let e = marcarHecha(base, dos.id, HOY, ctx);
  e = eliminarActividad(e, nueve.id, ctx);
  assert.deepEqual(listaDelPanel(e).map((a) => a.id), [uno.id, hoy.id, veinte.id]);
});

test('AC-3.1: el texto del plazo dice si vence hoy, cuántos días lleva atrasada o cuándo vence', () => {
  assert.deepEqual(
    [HOY, '2026-10-05', '2026-10-03', '2026-10-07', '2026-10-20'].map((vence) => textoPlazo({ vence }, HOY)),
    ['Vence hoy', 'Atrasada 1 día', 'Atrasada 3 días', 'Vence mañana', 'Vence el 2026-10-20'],
  );
});

test('AC-5.1, AC-5.2, AC-5.6, FR-10: al cambiar el día cambian las burbujas y el estado', () => {
  const ver = (estado, dia) => [burbujas(estado, dia).length, limpiezaDeEspacio(estado, cocina(estado).id, dia)];
  const { e: base } = conVencimientos(['2026-10-07']);
  assert.deepEqual(ver(base, HOY), [0, 'limpio']);
  assert.deepEqual(ver(base, '2026-10-07'), [1, 'limpio']);
  assert.deepEqual(ver(base, '2026-10-09'), [1, 'desordenado']);
  assert.deepEqual(ver(base, '2026-10-10'), [1, 'desastre']);
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { tipo: 'repetitiva', frecuenciaDias: 3 }), ctx);
  const { id } = ultima(e);
  e = marcarHecha(e, id, HOY, ctx);
  assert.deepEqual(ver(e, '2026-10-08'), [0, 'limpio']);
  assert.deepEqual(ver(e, '2026-10-09'), [1, 'limpio']);
  assert.equal(atraso(buscarActividad(e, id), '2026-10-09'), 0);
});

test('el estado derivado es puro: no modifica el estado y repite el resultado con los mismos argumentos', () => {
  const { e } = conVencimientos(['2026-10-01', HOY, '2026-10-09'], { espacioId: null });
  const copia = structuredClone(e);
  const calcular = () => [burbujas(e, HOY), porHacer(e, HOY), listaDelPanel(e), limpiezaDeEspacio(e, cocina(e).id, HOY)];
  assert.deepEqual(calcular(), calcular());
  assert.deepEqual(e, copia);
});
```

- [ ] Escribir las pruebas del aspecto:
```js
// test/aspecto.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, agregarHabitante, espaciosActivos, espaciosDeTipo, banoDe, familiares } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { agregarActividad, burbujas } from '../src/actividades.js';
import { casillasLibres, casillaDeBurbuja, objetosDelSuelo, ubicarBurbujas, OBJETOS_POR_ESTADO } from '../src/aspecto.js';
import { crearCtx } from './ayuda.js';

// Hogar con todos los tipos de espacio y dos baños internos (en Dormitorio 1 y Dormitorio 2).
function hogarConBanos() {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  for (const tipo of ['comedor', 'cocina', 'lavanderia', 'mascota', 'dormitorio', 'dormitorio', 'oficina', 'bano', 'bano']) {
    e = agregarEspacio(e, tipo, ctx);
  }
  return e;
}

const esPuerta = (d, c) => d.puertas.some((p) => p.x === c.x && p.y === c.y);

test('FR-5, AC-4.7: las casillas libres de cada espacio son de su área, transitables y no son puertas', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = casillasLibres(d, espacio.id);
    assert.ok(libres.length > 0, espacio.id);
    for (const c of libres) {
      assert.equal(d.espacioEn[c.y][c.x], espacio.id);
      assert.ok(esTransitable(d, c.x, c.y));
      assert.ok(!esPuerta(d, c));
    }
  }
});

test('AC-2.8: la burbuja de un espacio está en la primera casilla libre de su área, siempre la misma', () => {
  const e = hogarConBanos();
  const d1 = generarDistribucion(e);
  const d2 = generarDistribucion(e);
  for (const espacio of espaciosActivos(e)) {
    const c = casillaDeBurbuja(d1, espacio.id);
    assert.deepEqual(c, casillasLibres(d1, espacio.id)[0]);
    assert.deepEqual(casillaDeBurbuja(d2, espacio.id), c);
    assert.ok(!esPuerta(d1, c));
  }
});

test('AC-4.3, AC-4.4, AC-4.7: objetos del suelo según el estado, en casillas libres distintas, siempre las mismas', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  for (const espacio of espaciosDeTipo(e, 'cocina')) {
    const libres = new Set(casillasLibres(d, espacio.id).map((c) => `${c.x},${c.y}`));
    const desordenado = objetosDelSuelo(d, espacio.id, 'desordenado');
    const desastre = objetosDelSuelo(d, espacio.id, 'desastre');
    assert.deepEqual(objetosDelSuelo(d, espacio.id, 'limpio'), []);
    assert.equal(desordenado.length, OBJETOS_POR_ESTADO.desordenado);
    assert.equal(desastre.length, OBJETOS_POR_ESTADO.desastre);
    assert.deepEqual(desastre.slice(0, desordenado.length), desordenado); // el desastre agrega objetos a los del desorden
    assert.equal(new Set(desastre.map((o) => `${o.x},${o.y}`)).size, desastre.length);
    for (const o of desastre) {
      assert.ok(libres.has(`${o.x},${o.y}`));
      assert.ok(Number.isInteger(o.variante) && o.variante >= 0 && o.variante < 6);
    }
    assert.deepEqual(objetosDelSuelo(generarDistribucion(e), espacio.id, 'desastre'), desastre);
  }
});

test('AC-4.3, AC-4.7: si hay menos casillas libres que objetos, se muestran tantos como casillas libres haya', () => {
  const e = hogarConBanos();
  const d = generarDistribucion(e);
  const bano = banoDe(e, espaciosDeTipo(e, 'dormitorio')[0].id);
  const libres = casillasLibres(d, bano.id).length;
  assert.equal(libres, 4); // el baño interno es el espacio más pequeño del catálogo
  assert.ok(libres < OBJETOS_POR_ESTADO.desastre);
  assert.equal(objetosDelSuelo(d, bano.id, 'desastre').length, libres);
  assert.equal(objetosDelSuelo(d, bano.id, 'desordenado').length, Math.min(OBJETOS_POR_ESTADO.desordenado, libres));
});

test('FR-6: ubicarBurbujas pone la de un espacio en su casilla fija y la de un miembro en la casilla de encima de él', () => {
  const ctx = crearCtx();
  let e = agregarHabitante(crearHogarInicial(ctx), 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  const diana = familiares(e)[0];
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  const base = { nombre: 'Tarea', icono: 'otra', miembroId: diana.id, tipo: 'puntual', vence: '2026-10-06', frecuenciaDias: null };
  e = agregarActividad(e, { ...base, espacioId: cocina.id }, ctx).estado;
  e = agregarActividad(e, { ...base, espacioId: null }, ctx).estado;
  const d = generarDistribucion(e);
  const lista = burbujas(e, '2026-10-06');
  const fija = casillaDeBurbuja(d, cocina.id);
  assert.deepEqual(
    ubicarBurbujas(lista, d, new Map([[diana.id, { x: 20, y: 7 }]])).map((b) => [b.tipo, b.x, b.y]),
    [['espacio', fija.x, fija.y], ['miembro', 20, 6]],
  );
  assert.deepEqual(ubicarBurbujas(lista, d, new Map()).map((b) => b.tipo), ['espacio']);
});
```

- [ ] Run: `cd poc && node --test test/actividades.test.js test/aspecto.test.js` — expect: FAIL (`SyntaxError`: `../src/actividades.js` no exporta `atraso`; `ERR_MODULE_NOT_FOUND` para `src/aspecto.js`)
- [ ] Agregar al final de `src/actividades.js`:
```js
// ---------- Estado derivado (ADR-003 de estado derivado): nada se guarda; todo sale de (estado, hoy) ----------

export const UMBRAL_DESORDENADO = 1; // días de atraso (FR-4); valores de partida, ajustables tras probarlos
export const UMBRAL_DESASTRE = 3;

export const atraso = (actividad, hoy) => diasEntre(actividad.vence, hoy);

// Por hacer (FR-2): pendientes que vencen hoy o antes, de la más atrasada a la menos. El orden es estable:
// a igual atraso se conserva el orden de creación (el de `estado.actividades`).
export function porHacer(estado, hoy) {
  return actividadesPendientes(estado)
    .map((a) => ({ a, dias: atraso(a, hoy) }))
    .filter((x) => x.dias >= 0)
    .sort((x, y) => y.dias - x.dias)
    .map((x) => x.a);
}

// Estado de un espacio (FR-4) según la actividad por hacer más atrasada vinculada a él.
export function limpiezaDeEspacio(estado, espacioId, hoy) {
  const peor = porHacer(estado, hoy).find((a) => a.espacioId === espacioId);
  const dias = peor ? atraso(peor, hoy) : 0;
  if (dias >= UMBRAL_DESASTRE) return 'desastre';
  if (dias >= UMBRAL_DESORDENADO) return 'desordenado';
  return 'limpio';
}

// Una burbuja por lugar con actividades por hacer (FR-6): el espacio, o el miembro para las que no tienen espacio.
// El icono es el de la primera del lugar en el orden de `porHacer`; `mas` indica que hay más de una.
export function burbujas(estado, hoy) {
  const porLugar = new Map();
  for (const a of porHacer(estado, hoy)) {
    const tipo = a.espacioId === null ? 'miembro' : 'espacio';
    const id = a.espacioId ?? a.miembroId;
    const clave = `${tipo}:${id}`;
    if (!porLugar.has(clave)) porLugar.set(clave, { tipo, id, icono: a.icono, actividades: [] });
    porLugar.get(clave).actividades.push(a.id);
  }
  return [...porLugar.values()].map((b) => ({ ...b, mas: b.actividades.length > 1 }));
}

// Actividades por hacer de un lugar, en el orden de su burbuja (FR-7).
export const actividadesDelLugar = (estado, lugar, hoy) => porHacer(estado, hoy).filter((a) => (lugar.tipo === 'espacio'
  ? a.espacioId === lugar.id
  : a.espacioId === null && a.miembroId === lugar.id));

// Lista del panel del modo edición (FR-8): todas las pendientes, por fecha de vencimiento (las fechas AAAA-MM-DD ordenan como texto).
export const listaDelPanel = (estado) => [...actividadesPendientes(estado)]
  .sort((x, y) => (x.vence < y.vence ? -1 : x.vence > y.vence ? 1 : 0));

// Texto del plazo para la hoja y el panel (AC-3.1, AC-6.1).
export function textoPlazo(actividad, hoy) {
  const dias = atraso(actividad, hoy);
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Atrasada 1 día';
  if (dias > 1) return `Atrasada ${dias} días`;
  if (dias === -1) return 'Vence mañana';
  return `Vence el ${actividad.vence}`;
}
```

- [ ] Crear el módulo de aspecto:
```js
// src/aspecto.js
// Aspecto de los espacios en el mapa (FR-5 y FR-6 de la 003): dónde van las burbujas y los objetos del suelo.
// Puro y sin azar: la misma distribución y el mismo estado dan siempre las mismas casillas.
import { esTransitable } from './distribucion.js';
import { claveCasilla } from './posicion.js';

export const INSIGNIAS = { limpio: '✓', desordenado: '!', desastre: '!!' };
export const OBJETOS_POR_ESTADO = { limpio: 0, desordenado: 4, desastre: 12 };

// Hash FNV-1a de 32 bits: el mismo texto da siempre el mismo número.
function hash(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Casillas del área de un espacio donde se puede pisar y que no son puertas, en orden de lectura (fila a fila).
export function casillasLibres(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const puertas = new Set(distribucion.puertas.map((p) => claveCasilla(p.x, p.y)));
  const libres = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (distribucion.espacioEn[y][x] === espacioId && esTransitable(distribucion, x, y) && !puertas.has(claveCasilla(x, y))) {
        libres.push({ x, y });
      }
    }
  }
  return libres;
}

// Casilla fija de la burbuja de un espacio (AC-2.8): la primera casilla libre de su área.
export const casillaDeBurbuja = (distribucion, espacioId) => casillasLibres(distribucion, espacioId)[0] ?? null;

// Objetos del suelo (FR-5): tantos como pide el estado, limitados por las casillas libres del espacio.
// El orden sale del hash del espacio y la casilla, así que el desastre siempre agrega objetos a los del desorden.
export function objetosDelSuelo(distribucion, espacioId, limpieza) {
  const libres = casillasLibres(distribucion, espacioId);
  return libres
    .map((c) => ({ ...c, h: hash(`${espacioId}:${claveCasilla(c.x, c.y)}`) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, OBJETOS_POR_ESTADO[limpieza])
    .map(({ x, y, h }) => ({ x, y, variante: h % 6 }));
}

// Casilla de cada burbuja (FR-6): la de un espacio, su casilla fija; la de un miembro, la de encima de él.
export function ubicarBurbujas(lista, distribucion, posiciones) {
  return lista.flatMap((b) => {
    if (b.tipo === 'espacio') {
      const c = casillaDeBurbuja(distribucion, b.id);
      return c ? [{ ...b, x: c.x, y: c.y }] : [];
    }
    const p = posiciones.get(b.id);
    return p ? [{ ...b, x: p.x, y: p.y - 1 }] : [];
  });
}
```

- [ ] Run: `cd poc && node --test test/actividades.test.js test/aspecto.test.js` — expect: PASS (`# pass 35`, `# fail 0`: 30 de actividades y 5 de aspecto)
- [ ] Run: `cd poc && npm test` — expect: PASS (`# pass 150`, `# fail 0`; incluye ahora las pruebas de contrato de la Fase 0)
- [ ] Commit: `feat(poc): derive cleanliness, bubbles and floor objects from activities` (cuerpo: `Plan section: Phase 4: Estado derivado, burbujas y aspecto en el mapa` y `Feature: 003-actividades`)

---

## Phase 5: Presentación: burbujas, hoja, panel y ficha de actividades

**Implements:** FR-3, FR-5, FR-6, FR-7, FR-8, FR-9 (confirmaciones) y FR-10 (cableado), NFR Security y Usability | **Satisfies:** AC-1.1, AC-1.2, AC-1.3, AC-1.6, AC-1.8, AC-2.9, AC-3.1, AC-3.2, AC-3.7, AC-3.9, AC-4.8, AC-4.9, AC-5.3, AC-5.4, AC-6.1, AC-6.2, AC-6.7, AC-6.8, AC-6.9, AC-6.10, AC-7.1, AC-7.6, AC-7.7, AC-7.8, AC-8.2, y la parte visible de los AC de las Stories 1 a 7
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: todo lo producido en las Fases 1 a 4 (nombres exactos en sus líneas Interfaces), `pendientesDeMiembro` y `consecuenciasDeEliminar(...).actividades` (Fase 3), y el global `Phaser` (3.80.1). Produces: la aplicación con actividades; ningún contrato nuevo.

Capa de presentación delgada: toda regla vive en los módulos puros. `juego.js` guarda `hoy` (la fecha local del dispositivo), lo compara en cada cuadro y, si cambia, redibuja el suelo, las insignias y las burbujas. Los cambios de actividades se aplican sin regenerar la distribución ni recolocar a los habitantes. Los textos del usuario se insertan con `textContent`.

> **Complexity note:** Gate: Integration-First (pruebas antes del código). Violation: la capa de presentación no tiene pruebas automáticas, igual que las Fases 4 de la 001 y de la 002. Justification: depende del motor de la PoC, que es desechable. Las reglas de la spec quedaron en módulos puros probados en las Fases 1 a 4, y esta capa se verifica con la comprobación estática de este paso y con la lista manual de la Fase 6.

Verificación previa (falla esperada): `cd poc && grep -n "actividades.js\|id=\"hoja\"\|ficha-actividad" src/juego.js index.html` no encuentra nada.

- [ ] En `index.html`, reemplazar las reglas CSS desde `.fila.habitante { ... }` hasta `#ficha .acciones .peligro { ... }` (ambas incluidas) por:
```css
    .fila.habitante { grid-template-columns: 1fr auto 36px; }
    .fila.cabecera { grid-template-columns: 1fr auto auto; }
    .fila.cabecera button { font-size: 15px; padding: 0 10px; }
    .fila.actividad { grid-template-columns: 28px 1fr; cursor: pointer; }
    .icono { font-size: 20px; text-align: center; }
    .subtitulo { display: block; margin: 12px 0 4px; }
    #ficha select, #ficha-actividad select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    #ficha, #ficha-actividad { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    #ficha form, #ficha-actividad form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(320px, 86vw); }
    #ficha input, #ficha-actividad input { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 8px 0 4px; }
    #ficha .error, #ficha-actividad .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    #ficha .acciones, #ficha-actividad .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha .acciones button, #ficha-actividad .acciones button { padding: 8px 12px; background: #2a221c; color: #f2ead3; }
    #ficha .acciones .peligro, #ficha-actividad .acciones .peligro { background: #a32d2d; margin-right: auto; }
    #hoja { position: fixed; left: 0; right: 0; bottom: 0; max-height: 55%; overflow-y: auto; background: #f2ead3; color: #2a221c;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border-radius: 14px 14px 0 0; display: none; }
    #hoja header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    #hoja .item { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 1px solid #d9cfb4; }
    #hoja .item small { display: block; opacity: .7; }
    #hoja .botones { display: flex; gap: 6px; }
    #hoja button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    #hoja .peligro { background: #a32d2d; }
```

- [ ] En `index.html`, reemplazar la sección `#panel` completa por:
```html
  <section id="panel">
    <header><strong>Espacios</strong><button id="listo">Listo</button></header>
    <div id="contadores"></div>
    <strong class="subtitulo">Habitantes</strong>
    <div id="habitantes"></div>
    <strong class="subtitulo">Actividades</strong>
    <div id="actividades"></div>
  </section>
```

- [ ] En `index.html`, agregar después del bloque `<div id="ficha"> ... </div>` (antes de `<div id="aviso" role="status"></div>`):
```html
  <section id="hoja" aria-label="Actividades del lugar">
    <header><strong id="hoja-titulo"></strong><button type="button" id="hoja-cerrar">Cerrar</button></header>
    <div id="hoja-lista"></div>
  </section>
  <div id="ficha-actividad">
    <form>
      <strong id="actividad-titulo"></strong>
      <input id="actividad-nombre" maxlength="30" autocomplete="off" placeholder="Nombre de la actividad">
      <select id="actividad-icono" aria-label="Icono"></select>
      <select id="actividad-miembro" aria-label="Asignada a"></select>
      <select id="actividad-espacio" aria-label="Espacio"></select>
      <select id="actividad-tipo" aria-label="Tipo"></select>
      <input id="actividad-vence" type="date" aria-label="Vence">
      <select id="actividad-frecuencia" aria-label="Frecuencia"></select>
      <div class="error" id="actividad-error"></div>
      <div class="acciones">
        <button type="button" class="peligro" id="actividad-eliminar">Eliminar</button>
        <button type="button" id="actividad-cancelar">Cancelar</button>
        <button type="submit" id="actividad-guardar">Guardar</button>
      </div>
    </form>
  </div>
```

- [ ] En `src/juego.js`, reemplazar el bloque de imports (todas las líneas `import`) por:
```js
import { TIPOS, ETIQUETAS, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES, ICONOS, FRECUENCIAS, LIMITE_ACTIVIDADES } from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante, pendientesDeMiembro,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';
import {
  MS_POR_PASO, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes, congelarHabitantes, ocupadasPorHabitantes,
} from './movimiento.js';
import {
  contarActividades, puedeAgregarActividad, buscarActividad, agregarActividad, editarActividad, eliminarActividad, marcarHecha,
  limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo, MENSAJES_ACTIVIDAD,
} from './actividades.js';
import { INSIGNIAS, objetosDelSuelo, casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';
import { fechaLocal } from './fechas.js';
```

- [ ] En `src/juego.js`, agregar después de la constante `COLOR_BORDE_HABITANTE`:
```js
// Actividades (FR-5 y FR-6 de la 003), arte de marcador: iconos como emoji del sistema y objetos como cuadrados de colores.
const GLIFO_ICONO = { platos: '🍽️', barrer: '🧹', ropa: '🧺', basura: '🗑️', limpiar: '🧽', compras: '🛒', plantas: '🪴', mascota: '🐾', otra: '📌' };
const COLOR_INSIGNIA = { limpio: '#2e9e4f', desordenado: '#c98a00', desastre: '#c0392b' };
const COLOR_OBJETO = [0xc0392b, 0x2980b9, 0xf1c40f, 0x8e44ad, 0x16a085, 0xd35400];
const PROF_BURBUJA = 30;
const ESTILO_BURBUJA = { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#2a221c', backgroundColor: '#ffffff', padding: { x: 4, y: 2 } };
```

- [ ] En `src/juego.js`, agregar después de la línea `let moviles = colocarHabitantes(...); // FR-7: al abrir, después del jugador`:
```js
let hoy = fechaLocal(new Date()); // el día de hoy se inyecta en las funciones puras (ADR-003 de estado derivado)
// Casilla actual de cada miembro en el mapa: el propietario es el jugador; los habitantes, sus móviles (FR-6 de la 003).
function posicionesDeMiembros() {
  const posiciones = new Map(moviles.map((h) => [h.id, { x: h.x, y: h.y }]));
  posiciones.set(propietario().id, { x: jugador.x, y: jugador.y });
  return posiciones;
}
```

- [ ] En la clase `Escena`, reemplazar `create()` completo por:
```js
  create() {
    this.mapa = this.add.graphics();
    this.etiquetas = new Map(); // clave de espacio → objeto de texto de su etiqueta (solo visuales, nunca interactivas)
    this.insignias = new Map(); // clave de espacio → insignia de su estado de limpieza (FR-5 de la 003)
    this.burbujas = []; // burbujas de los lugares con actividades por hacer, cada una con su texto (FR-6 de la 003)
    this.sprites = new Map(); // id de habitante → { cuerpo, etiqueta } (FR-8; nunca interactivos)
    this.personaje = this.add.container(0, 0, [
      this.add.rectangle(0, 0, 12, 14, 0xd4537e).setStrokeStyle(1, 0x4b1528),
      this.add.triangle(0, 5, 0, 0, 6, 0, 3, 4, 0x4b1528),
    ]).setDepth(PROF_PERSONAJE);
    this.etiquetaPersonaje = this.add.text(0, 0, '', ESTILO_ETIQUETA).setOrigin(0.5, 1).setDepth(PROF_ETIQUETA_PERSONAJE);
    this.teclas = this.input.keyboard.createCursorKeys();
    // En exploración solo responden las burbujas; en edición, también personajes y espacios (FR-8 de la 003).
    this.input.on('pointerup', (p) => tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE)));
    this.scale.on('resize', () => (modo === 'edicion' ? this.encuadrarHogar() : null));
    this.redibujar();
    this.colocarPersonaje();
    this.seguirPersonaje();
  }
```

- [ ] En la clase `Escena`, reemplazar `redibujar()` completo por `redibujar()`, `dibujarSuelo()` y `refrescarActividades()`:
```js
  redibujar() {
    this.dibujarSuelo();
    this.dibujarEtiquetas();
  }

  // Casillas del mapa y, encima, los objetos del suelo según el estado de limpieza (FR-5 de la 003): decoración
  // por debajo de los personajes, que no cambia las colisiones.
  dibujarSuelo() {
    const g = this.mapa;
    g.clear();
    const tipoDe = new Map(espaciosActivos(estado).map((e) => [e.id, e.tipo]));
    distribucion.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (ch === ' ') return;
      const clave = distribucion.espacioEn[y][x];
      const tipo = clave?.startsWith('pasillo:') ? 'pasillo' : tipoDe.get(clave);
      if (ch === '#') g.fillStyle(COLOR_PARED);
      else g.fillStyle(COLOR_PISO[tipo] ?? 0xe8dcc0);
      g.fillRect(x * TILE, y * TILE, TILE, TILE);
      if (COLOR_MUEBLE[ch] !== undefined) {
        g.fillStyle(COLOR_MUEBLE[ch]);
        g.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
      }
    }));
    for (const espacio of espaciosActivos(estado)) {
      for (const o of objetosDelSuelo(distribucion, espacio.id, limpiezaDeEspacio(estado, espacio.id, hoy))) {
        g.fillStyle(COLOR_OBJETO[o.variante]);
        g.fillRect(o.x * TILE + 4, o.y * TILE + 4, TILE - 8, TILE - 8);
      }
    }
  }

  // Tras un cambio de actividades o de día: suelo, insignias y burbujas, sin rehacer a los personajes, que siguen caminando.
  refrescarActividades() {
    this.dibujarSuelo();
    this.dibujarInsignias();
    this.dibujarBurbujas();
  }
```

- [ ] En la clase `Escena`, reemplazar `dibujarEtiquetas()` completo por esta versión y agregar a continuación `dibujarInsignias()`, `colocarInsignias()`, `dibujarBurbujas()` y `colocarBurbujas()`:
```js
  // Etiquetas de nombre (FR-12 de la 001, FR-8 de la 002) con la insignia de cada espacio, y burbujas (FR-5, FR-6 de la 003).
  dibujarEtiquetas() {
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas.clear();
    const escala = 1 / this.cameras.main.zoom; // contrarresta el zoom de la cámara: tamaño constante en pantalla
    for (const e of etiquetasDeEspacios(estado, distribucion, null, null)) {
      const texto = this.add.text(e.x * TILE, e.y * TILE, e.texto, ESTILO_ETIQUETA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.etiquetas.set(e.clave, texto);
    }
    this.dibujarInsignias();
    this.etiquetaPersonaje.setText(propietario().nombre).setScale(escala);
    this.sincronizarSprites();
    this.dibujarBurbujas();
  }

  // Insignia del estado de limpieza junto al nombre de cada espacio (FR-5 de la 003); los pasillos no tienen etiqueta ni insignia.
  dibujarInsignias() {
    this.insignias.forEach((t) => t.destroy());
    this.insignias.clear();
    const escala = 1 / this.cameras.main.zoom;
    for (const clave of this.etiquetas.keys()) {
      const limpieza = limpiezaDeEspacio(estado, clave, hoy);
      const estilo = { ...ESTILO_ETIQUETA, color: '#ffffff', backgroundColor: COLOR_INSIGNIA[limpieza] };
      const insignia = this.add.text(0, 0, INSIGNIAS[limpieza], estilo).setOrigin(0, 0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.insignias.set(clave, insignia);
    }
    this.colocarInsignias();
  }

  // La insignia va pegada a la derecha de la etiqueta de su espacio, también cuando esta se desplaza en exploración.
  colocarInsignias() {
    const separacion = 2 / this.cameras.main.zoom;
    for (const [clave, insignia] of this.insignias) {
      const etiqueta = this.etiquetas.get(clave);
      insignia.setPosition(etiqueta.x + etiqueta.displayWidth / 2 + separacion, etiqueta.y);
    }
  }

  // Una burbuja por lugar con actividades por hacer (FR-6 de la 003): icono de la más atrasada y "+" si hay más.
  // La de un espacio queda fija en su casilla; la de un miembro la coloca `colocarBurbujas` en cada cuadro.
  dibujarBurbujas() {
    for (const b of this.burbujas) b.texto.destroy();
    const escala = 1 / this.cameras.main.zoom;
    this.burbujas = burbujas(estado, hoy).map((b) => {
      const texto = this.add.text(0, 0, `${GLIFO_ICONO[b.icono]}${b.mas ? '+' : ''}`, ESTILO_BURBUJA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_BURBUJA);
      const casilla = b.tipo === 'espacio' ? casillaDeBurbuja(distribucion, b.id) : null;
      if (casilla) texto.setPosition(casilla.x * TILE + TILE / 2, casilla.y * TILE + TILE / 2);
      return { ...b, texto };
    });
    this.colocarBurbujas();
  }

  // Las burbujas de los miembros siguen a su personaje, centradas en la casilla de encima de él: la misma que responde al toque (AC-6.8).
  colocarBurbujas() {
    const idPropietario = propietario().id;
    for (const b of this.burbujas) {
      if (b.tipo !== 'miembro') continue;
      const cuerpo = b.id === idPropietario ? this.personaje : this.sprites.get(b.id)?.cuerpo;
      if (cuerpo) b.texto.setPosition(cuerpo.x, cuerpo.y - TILE);
    }
  }
```

- [ ] En la clase `Escena`, reemplazar `actualizarEtiquetas()` completo por:
```js
  // Por cuadro: los nombres y las burbujas de los miembros siguen a sus personajes; en exploración, la etiqueta del espacio
  // actual (con su insignia) se desplaza a la parte visible.
  actualizarEtiquetas() {
    this.etiquetaPersonaje.setPosition(this.personaje.x, this.personaje.y - TILE * 0.75);
    for (const s of this.sprites.values()) s.etiqueta.setPosition(s.cuerpo.x, s.cuerpo.y - TILE * 0.6);
    this.colocarBurbujas();
    if (modo !== 'exploracion') return; // en edición se ve todo el hogar: las etiquetas quedan centradas
    const v = this.cameras.main.worldView;
    const vista = { x: v.x / TILE, y: v.y / TILE, w: v.width / TILE, h: v.height / TILE };
    const medir = (texto) => {
      for (const t of this.etiquetas.values()) {
        if (t.text === texto) return { w: t.displayWidth / TILE, h: t.displayHeight / TILE };
      }
      return { w: 0, h: 0 };
    };
    for (const e of etiquetasDeEspacios(estado, distribucion, { x: jugador.x, y: jugador.y }, vista, medir)) {
      this.etiquetas.get(e.clave)?.setPosition(e.x * TILE, e.y * TILE);
    }
    this.colocarInsignias();
  }
```

- [ ] En la clase `Escena`, reemplazar `update()` completo por:
```js
  update(_tiempo, deltaMs) {
    const fecha = fechaLocal(new Date());
    if (fecha !== hoy) cambiarDia(fecha); // FR-10 de la 003: medianoche con la app abierta o vuelta a primer plano otro día
    const dir = this.direccionActual();
    if (dir) this.mover(dir);
    this.moverHabitantes(deltaMs);
    this.actualizarEtiquetas();
    if (!dir && !moviendo && posicionSinGuardar && modo === 'exploracion') guardarPosicion(); // en reposo tras caminar (FR-10)
    $('depuracion').textContent = `${Math.round(this.game.loop.actualFps)} fps · regen ${ultimaRegeneracionMs.toFixed(1)} ms`;
  }
```

- [ ] Reemplazar los manejadores de `editar` y `listo` y la función `aplicar` completos por estos, y agregar `aplicarActividades` y `cambiarDia`:
```js
$('editar').addEventListener('click', () => {
  if (moviendo) return;
  cerrarHoja(); // la hoja de exploración ofrece "Hecho"; en edición se vuelve a abrir desde la burbuja con Editar y Eliminar
  guardarPosicion();
  modo = 'edicion';
  moviles = congelarHabitantes(moviles); // quietos en la casilla a la que se dirigían (AC-7.2 de la 002)
  mostrarExploracion(false);
  pintarPanel();
  escena().encuadrarHogar();
});

$('listo').addEventListener('click', () => {
  cerrarHoja();
  modo = 'exploracion';
  jugador = resolverPosicion(distribucion, posGuardada);
  guardarPosicion();
  moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7: primero el jugador, después ellos
  mostrarExploracion(true);
  const s = escena();
  s.redibujar();
  s.colocarPersonaje();
  s.seguirPersonaje();
});

function aplicar(nuevo) {
  if (nuevo === estado) return;
  const t0 = performance.now();
  estado = nuevo;
  distribucion = generarDistribucion(estado);
  jugador = resolverPosicion(distribucion, posGuardada);
  moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7 de la 002
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10 de la 001, AC-9.2)
  s.colocarPersonaje();
  s.encuadrarHogar();
  pintarPanel();
  if (hojaActual) pintarHoja();
}

// Cambios de actividades (alta, edición, baja y "Hecho"): no cambian la distribución ni a los habitantes (FR-3 y FR-8 de la 003).
function aplicarActividades(nuevo) {
  if (nuevo === estado) return;
  const t0 = performance.now();
  estado = nuevo;
  escena().refrescarActividades();
  ultimaRegeneracionMs = performance.now() - t0; // misma meta de 100 ms (AC-6.10 de la 003)
  guardarEstado(); // se guarda en el momento en que se aplica (AC-8.2 de la 003)
  if (modo === 'edicion') pintarPanel();
  if (hojaActual) pintarHoja();
}

// El día cambió con la app abierta (FR-10 de la 003): burbujas, estados y objetos se recalculan con la nueva fecha.
function cambiarDia(fecha) {
  hoy = fecha;
  escena().refrescarActividades();
  if (modo === 'edicion') pintarPanel();
  if (hojaActual) pintarHoja();
}
```

- [ ] Reemplazar `confirmarEliminacion` completa por esta versión y el texto compartido de actividades:
```js
const textoActividades = (n) => (n === 1 ? 'Se eliminará 1 actividad.' : `Se eliminarán ${n} actividades.`);

// Confirmación de eliminar un espacio (AC-5.3, AC-4.7 de la 001; AC-7.1, AC-7.4 y AC-7.6 de la 003).
function confirmarEliminacion(id) {
  if (!requiereConfirmacion(estado, id)) return true;
  const espacio = buscarEspacio(estado, id);
  const c = consecuenciasDeEliminar(estado, id);
  const partes = [`¿Eliminar "${nombreVisible(estado, espacio)}"?`];
  if (c.banoSeElimina) partes.push('También se eliminará su baño interno.');
  if (c.tieneNombrePersonalizado) partes.push('Se perderá su nombre personalizado.');
  if (c.actividades > 0) partes.push(textoActividades(c.actividades));
  return window.confirm(partes.join(' '));
}
```

- [ ] En `pintarPanel()`, reemplazar su última línea `  pintarHabitantes();` por:
```js
  pintarHabitantes();
  pintarActividades();
```

- [ ] En `pintarPanel()`, reemplazar las seis líneas que construyen cada fila de espacio (desde `const fila = document.createElement('div');` hasta `const [menos, mas] = fila.querySelectorAll('button');`, ambas incluidas) por esta versión, que inserta el nombre personalizado del espacio como texto y no como marcado (NFR de seguridad). Las líneas siguientes (`menos.disabled`, `mas.disabled`, los dos `addEventListener` y `cont.append(fila)`) no cambian:
```js
    const fila = elemento('div', undefined, 'fila');
    const destino = tipo === 'bano' ? siguienteDestinoBano(estado) : null;
    const nombre = elemento('span', ETIQUETAS[tipo]);
    if (destino) nombre.append(elemento('small', `Siguiente: ${nombreVisible(estado, destino)}`)); // texto, nunca marcado (NFR de seguridad de la 003)
    const menos = elemento('button', '−');
    menos.setAttribute('aria-label', 'Quitar');
    const mas = elemento('button', '+');
    mas.setAttribute('aria-label', 'Agregar');
    fila.append(nombre, menos, elemento('span', String(contar(estado, tipo)), 'cuenta'), mas);
```

- [ ] Agregar después de la función `pintarHabitantes()`:
```js
// Los textos escritos por el usuario se insertan siempre como texto, nunca como marcado (NFR de seguridad de la 003).
function elemento(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined) el.textContent = texto;
  if (clase) el.className = clase;
  return el;
}

// Sección "Actividades" del panel (FR-8, AC-6.1 de la 003): contador "n de 50", alta y lista de todas las pendientes.
function pintarActividades() {
  const cont = $('actividades');
  cont.replaceChildren();
  const cabecera = elemento('div', undefined, 'fila cabecera');
  const mas = elemento('button', '+ Actividad');
  mas.disabled = !puedeAgregarActividad(estado);
  mas.addEventListener('click', () => abrirFichaActividad(null));
  cabecera.append(elemento('span', 'Pendientes'), elemento('span', `${contarActividades(estado)} de ${LIMITE_ACTIVIDADES}`, 'cuenta'), mas);
  cont.append(cabecera);
  for (const a of listaDelPanel(estado)) {
    const fila = elemento('div', undefined, 'fila actividad');
    const lugar = a.espacioId ? nombreVisible(estado, buscarEspacio(estado, a.espacioId)) : 'Sin espacio';
    const datos = elemento('span');
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${lugar} · ${textoPlazo(a, hoy)}`));
    fila.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos);
    fila.addEventListener('click', () => abrirFichaActividad(a.id));
    cont.append(fila);
  }
}
```

- [ ] Reemplazar `tocarMapa` completa por:
```js
// Al tocar el mapa (FR-8 de la 003): en exploración solo responden las burbujas; en edición la prioridad es
// personaje del propietario, habitante, burbuja y espacio (AC-7.3 y AC-7.4 de la 002, AC-6.8 de la 003).
function tocarMapa(x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  const burbuja = ubicarBurbujas(burbujas(estado, hoy), distribucion, posicionesDeMiembros()).find((b) => b.x === x && b.y === y);
  if (modo === 'exploracion') {
    if (burbuja) abrirHoja(burbuja);
    return;
  }
  if (x === jugador.x && y === jugador.y) { abrirFicha('propietario', propietario().id); return; }
  const habitante = moviles.find((h) => h.x === x && h.y === y);
  if (habitante) {
    const miembro = buscarMiembro(estado, habitante.id);
    abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
    return;
  }
  if (burbuja) { abrirHoja(burbuja); return; }
  const clave = distribucion.espacioEn[y][x];
  if (clave && buscarEspacio(estado, clave)) abrirFicha('espacio', clave);
}
```

- [ ] Reemplazar el manejador de `ficha-eliminar` completo por:
```js
$('ficha-eliminar').addEventListener('click', () => {
  const { tipo, id } = fichaActual;
  if (tipo === 'habitante') {
    const n = pendientesDeMiembro(estado, id);
    const pregunta = `¿Eliminar a "${buscarMiembro(estado, id).nombre}"?${n > 0 ? ` ${textoActividades(n)}` : ''}`;
    if (!window.confirm(pregunta)) return; // AC-8.1 y AC-8.2 de la 002; AC-7.7 y AC-7.8 de la 003
    cerrarFicha();
    aplicar(eliminarHabitante(estado, id, ctx));
    return;
  }
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});
```

- [ ] Agregar antes de `// ---------- Ciclo de vida ----------`:
```js
// ---------- Hoja de un lugar (FR-7 de la 003) ----------
let hojaActual = null; // lugar de la hoja abierta: { tipo: 'espacio' | 'miembro', id }

function abrirHoja(lugar) {
  hojaActual = { tipo: lugar.tipo, id: lugar.id };
  pintarHoja();
}

const cerrarHoja = () => { $('hoja').style.display = 'none'; hojaActual = null; };

// En exploración, cada actividad ofrece solo "Hecho" (AC-3.1); en edición, Editar y Eliminar (AC-6.7).
// La hoja se cierra cuando el lugar ya no tiene actividades por hacer (AC-3.2).
function pintarHoja() {
  const lugar = hojaActual.tipo === 'espacio' ? buscarEspacio(estado, hojaActual.id) : buscarMiembro(estado, hojaActual.id);
  const lista = lugar ? actividadesDelLugar(estado, hojaActual, hoy) : [];
  if (lista.length === 0) { cerrarHoja(); return; }
  $('hoja-titulo').textContent = hojaActual.tipo === 'espacio' ? nombreVisible(estado, lugar) : lugar.nombre;
  const cont = $('hoja-lista');
  cont.replaceChildren();
  for (const a of lista) {
    const datos = elemento('span');
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${textoPlazo(a, hoy)}`));
    const botones = elemento('span', undefined, 'botones');
    if (modo === 'exploracion') {
      const hecho = elemento('button', 'Hecho');
      hecho.addEventListener('click', () => aplicarActividades(marcarHecha(estado, a.id, hoy, ctx)));
      botones.append(hecho);
    } else {
      const editar = elemento('button', 'Editar');
      editar.addEventListener('click', () => abrirFichaActividad(a.id));
      const eliminar = elemento('button', 'Eliminar', 'peligro');
      eliminar.addEventListener('click', () => confirmarYEliminarActividad(a.id));
      botones.append(editar, eliminar);
    }
    const item = elemento('div', undefined, 'item');
    item.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos, botones);
    cont.append(item);
  }
  $('hoja').style.display = 'block';
}
$('hoja-cerrar').addEventListener('click', cerrarHoja);

// ---------- Ficha de una actividad (FR-1 y FR-8 de la 003) ----------
let actividadEnFicha = null; // id de la actividad en edición, o null en un alta

function opciones(select, pares, valor) {
  select.replaceChildren(...pares.map(([clave, texto]) => new Option(texto, clave)));
  select.value = valor;
}

// Alta: nombre vacío, icono "Otra", miembro sin elegir, "Sin espacio", "Puntual", fecha de hoy (AC-1.1).
function abrirFichaActividad(id) {
  actividadEnFicha = id;
  const a = id ? buscarActividad(estado, id) : null;
  $('actividad-titulo').textContent = a ? a.nombre : 'Nueva actividad';
  $('actividad-nombre').value = a?.nombre ?? '';
  opciones($('actividad-icono'), Object.entries(ICONOS).map(([clave, texto]) => [clave, `${GLIFO_ICONO[clave]} ${texto}`]), a?.icono ?? 'otra');
  const miembros = [propietario(), ...habitantes(estado)];
  opciones($('actividad-miembro'), [['', 'Asignar a…'], ...miembros.map((m) => [m.id, m.nombre])], a?.miembroId ?? '');
  opciones($('actividad-espacio'), [['', 'Sin espacio'], ...espaciosActivos(estado).map((e) => [e.id, nombreVisible(estado, e)])], a?.espacioId ?? '');
  opciones($('actividad-tipo'), [['puntual', 'Puntual'], ['repetitiva', 'Repetitiva']], a?.tipo ?? 'puntual');
  $('actividad-vence').value = a?.vence ?? hoy;
  const frecuencias = FRECUENCIAS.map((n) => [String(n), n === 1 ? 'Cada día' : `Cada ${n} días`]);
  opciones($('actividad-frecuencia'), [['', 'Elegir frecuencia…'], ...frecuencias], a?.frecuenciaDias ? String(a.frecuenciaDias) : '');
  $('actividad-error').textContent = '';
  $('actividad-eliminar').style.display = a ? 'block' : 'none';
  actualizarFichaActividad();
  $('ficha-actividad').style.display = 'flex';
}

// La frecuencia solo se ve en las repetitivas (AC-1.2). En un alta, guardar se activa con nombre, miembro y, si es
// repetitiva, frecuencia (AC-1.6). En una edición queda activo: un nombre vacío llega a editarActividad, que lo
// rechaza con su mensaje (AC-6.5).
function actualizarFichaActividad() {
  const repetitiva = $('actividad-tipo').value === 'repetitiva';
  $('actividad-frecuencia').style.display = repetitiva ? 'block' : 'none';
  if (actividadEnFicha) { $('actividad-guardar').disabled = false; return; }
  $('actividad-guardar').disabled = $('actividad-nombre').value.trim() === '' || $('actividad-miembro').value === ''
    || (repetitiva && $('actividad-frecuencia').value === '');
}

const cerrarFichaActividad = () => { $('ficha-actividad').style.display = 'none'; actividadEnFicha = null; };

function datosDeFichaActividad() {
  const frecuencia = $('actividad-frecuencia').value;
  return {
    nombre: $('actividad-nombre').value, icono: $('actividad-icono').value, miembroId: $('actividad-miembro').value,
    espacioId: $('actividad-espacio').value || null, tipo: $('actividad-tipo').value, vence: $('actividad-vence').value,
    frecuenciaDias: frecuencia === '' ? null : Number(frecuencia),
  };
}

// Eliminar una actividad pide confirmación con su nombre (AC-6.6). Devuelve si se eliminó.
function confirmarYEliminarActividad(id) {
  const a = buscarActividad(estado, id);
  if (!a || !window.confirm(`¿Eliminar la actividad "${a.nombre}"?`)) return false;
  aplicarActividades(eliminarActividad(estado, id, ctx));
  return true;
}

$('ficha-actividad').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const datos = datosDeFichaActividad();
  const r = actividadEnFicha ? editarActividad(estado, actividadEnFicha, datos, ctx) : agregarActividad(estado, datos, ctx);
  if (!r.ok) { $('actividad-error').textContent = MENSAJES_ACTIVIDAD[r.error]; return; }
  cerrarFichaActividad();
  aplicarActividades(r.estado);
});
$('actividad-nombre').addEventListener('input', () => { $('actividad-error').textContent = ''; actualizarFichaActividad(); });
for (const campo of ['actividad-miembro', 'actividad-tipo', 'actividad-frecuencia']) $(campo).addEventListener('change', actualizarFichaActividad);
$('actividad-cancelar').addEventListener('click', cerrarFichaActividad);
$('actividad-eliminar').addEventListener('click', () => {
  if (confirmarYEliminarActividad(actividadEnFicha)) cerrarFichaActividad();
});
```

- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 150`, `# fail 0`
- [ ] Comprobación estática (script desechable con `node -e`, sin commitear): cada nombre que `juego.js` importa existe en su módulo, y cada `$('id')` usado en `juego.js` existe como `id=` en `index.html` — expect: 0 faltantes
- [ ] Run: servir `poc/` desde su carpeta con `python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"` y abrir `http://localhost:8080` con un viewport de teléfono. Expect:
  - En "Editar" aparece la sección Actividades con "0 de 50" y "+ Actividad".
  - La ficha de alta trae "Otra", "Sin espacio", "Puntual" y la fecha de hoy, con "Guardar" desactivado hasta tener nombre y miembro; con "Repetitiva" aparece la frecuencia.
  - Una actividad de la cocina con fecha de hace 3 días deja la cocina con "!!", 12 objetos y una burbuja.
  - Al tocar la burbuja en edición se ve Editar y Eliminar; al tocar "Listo" y luego la burbuja se ve "Hecho", y al tocarlo la cocina queda "✓" sin objetos.
  - Eliminar un dormitorio con actividades pide confirmación con el número.
  - Una actividad sin espacio muestra su burbuja sobre el miembro.
  - Al recargar, todo sigue.
- [ ] Commit: `feat(poc): show activities on the map with bubbles, sheet and edit panel` (cuerpo: `Plan section: Phase 5: Presentación: burbujas, hoja, panel y ficha de actividades` y `Feature: 003-actividades`)

---

## Phase 6: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: `# pass 150`, `# fail 0`
- [ ] Servir en la red local con `python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('0.0.0.0', 8080), h).serve_forever()"` desde `poc/` y abrir `http://<IP-del-computador>:8080` en el Android, en la misma Wi-Fi y con internet para cargar Phaser. Al terminar, parar el servidor.
  > **Nota sobre la caché:** no usar `python3 -m http.server` a secas. Solo envía `Last-Modified`, y el navegador del teléfono puede mezclar módulos viejos y nuevos; entonces el mapa no se dibuja (incidencia de la 002). Si aun así pasa, borrar los datos de navegación del sitio.
- [ ] Verificar manualmente en el Android, marcando cada uno:
  - [ ] AC-1.1 a AC-1.10: ficha de alta con sus valores iniciales, frecuencia solo en repetitivas, "Guardar" desactivado hasta completar, fechas pasadas y futuras, límite de 50, cancelar sin cambios, 30 caracteres, nombres repetidos.
  - [ ] AC-2.1 a AC-2.9: una sola burbuja por lugar con el icono de la más atrasada y "+", burbuja sobre el miembro para las actividades sin espacio que lo sigue al caminar, las futuras no se ven, las burbujas no bloquean ni capturan la cruceta. En modo edición la burbuja de un miembro se dibuja sobre su nombre: anotar si estorba.
  - [ ] AC-3.1 a AC-3.9: la hoja muestra plazo y "Hecho"; tras "Hecho", la puntual desaparece y la repetitiva vuelve a vencer; el espacio se limpia; la hoja se puede recorrer con muchas actividades.
  - [ ] AC-4.1 a AC-4.9: insignias ✓, ! y !!; 4 y 12 objetos que no bloquean y quedan por debajo de los personajes; baño interno con su propio estado; los pasillos sin insignia.
  - [ ] AC-5.3 y AC-5.4: con la app en segundo plano o cerrada, al volver otro día el estado corresponde a la fecha. AC-5.1, AC-5.2, AC-5.5 y AC-5.6 están cubiertos por pruebas automáticas; si se puede, dejar la app abierta pasada la medianoche.
  - [ ] AC-6.1 a AC-6.10: lista del panel, ficha de edición, cambio de tipo, nombre vacío, eliminar con confirmación, hoja en edición con Editar y Eliminar, prioridad al tocar (personaje, habitante, burbuja, espacio), nada que gestionar en exploración.
  - [ ] AC-7.1 a AC-7.10: confirmaciones con el número de actividades al eliminar un espacio (desde la ficha y con "−"), un cuarto con baño interno (que se elimina o que se mueve) y un habitante; cancelar no cambia nada; el propietario no se elimina.
  - [ ] AC-8.1 a AC-8.6: cerrar y reabrir; abrir con los datos guardados por la versión anterior (con habitantes y sin actividades) sin aviso. AC-8.5, AC-8.6 y la Story 9 están cubiertos por pruebas automáticas.
- [ ] Medir rendimiento con el indicador de depuración:
  - Con 8 familiares, 4 mascotas y 50 actividades vencidas repartidas por todos los espacios del hogar más grande, caminando 30 s: 60 fps o más.
  - En 20 cambios seguidos de actividades en modo edición: `regen` por debajo de 100 ms en todos.
  - Anotar el modelo de teléfono y los resultados en `docs/specs/003-actividades/verification.md`.
- [ ] Commit: `docs(003-actividades): record integration verification` (cuerpo: `Plan section: Phase 6: Integration Verification` y `Feature: 003-actividades`)

---

## Quickstart Validation

1. `cd poc && npm test` → `# pass 150`, `# fail 0`.
2. Servir `poc/` con el comando de la Fase 5 y abrir `http://localhost:8080`: aparece el hogar con el personaje en la sala y todas las insignias en "✓".
3. **Editar** → en Actividades, "+ Actividad" → nombre "Lavar los platos", icono Platos, asignada a "Personaje 1", espacio "Cocina 1", fecha de hace 3 días → **Guardar**: la cocina muestra "!!", 12 objetos y una burbuja 🍽️.
4. "+ Actividad" → nombre "Sacar la basura", icono Basura, "Sin espacio", tipo Repetitiva, "Cada 7 días", fecha de hoy → **Guardar**: aparece una burbuja 🗑️ sobre el personaje.
5. **Listo** → tocar la burbuja de la cocina → **Hecho**: la cocina queda en "✓", sin objetos ni burbuja.
6. Tocar la burbuja del personaje → **Hecho**: la burbuja desaparece. En **Editar**, la lista muestra "Sacar la basura" con su próximo vencimiento en 7 días.
7. Recargar la página: todo sigue igual.

---

## Plan Changelog

| Date | Section | Change |
|------|---------|--------|
| 2026-10-06 | Phase 4 | `objetosDelSuelo` ya no reserva la casilla de la burbuja: un baño interno, con 4 casillas libres, muestra 4 objetos como exige AC-4.3 y AC-4.7. Las pruebas del aspecto se corrigen en consecuencia. Hallazgo de la revisión de alineación (ronda 1), corregido en `e13328c`. |
| 2026-10-06 | Phase 5 | La pista "Siguiente:" de la fila "Baño" del panel se construye con nodos de texto y no con `innerHTML`, porque un nombre personalizado de espacio como `<b>x</b>` se interpretaba como marcado (NFR de seguridad). Hallazgo de la ronda 1, corregido en `a4056e9`. |
| 2026-10-06 | Phase 5 | Las burbujas se dibujan centradas en la casilla donde responden al toque: antes la de un miembro quedaba 1,4 casillas por encima y tocar el icono visible no abría la hoja (AC-6.8). Hallazgo de la ronda 2, corregido en `e890a58`. |
