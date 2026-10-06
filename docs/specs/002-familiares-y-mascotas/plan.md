# Implementation Plan: Familiares y mascotas

**Spec:** docs/specs/002-familiares-y-mascotas/spec.md (v1.0.0)
**Decisions:** docs/adr/002-modelo-miembros-personas-mascotas.md, docs/adr/002-movimiento-habitantes-modulo-puro.md
**Data model:** docs/specs/002-familiares-y-mascotas/data-model.md
**Created:** 2026-10-05

## Global Constraints

- Hasta 8 familiares activos y hasta 4 mascotas activas, sin contar al personaje del propietario; los eliminados no cuentan.
- Parentescos (lista cerrada): Pareja, Hijo/a, Padre o madre, Hermano/a, Abuelo/a, Otro familiar. Géneros: Femenino, Masculino, Otro. Especies: Perro, Gato, Otro. Sin valor preseleccionado.
- Las mascotas no tienen parentesco ni género; los familiares no tienen especie. El género solo cambia el aspecto.
- Nombres de miembros: sin espacios al inicio ni al final, entre 1 y 20 caracteres, únicos sin distinguir mayúsculas entre todos los miembros activos (propietario, familiares y mascotas).
- Movimiento autónomo solo en exploración: pausas de 1 a 4 s, tramos de 1 a 6 casillas, 2 casillas por segundo (500 ms por casilla). En modo edición los habitantes están quietos.
- Nadie comparte casilla con nadie: los habitantes son obstáculos para el jugador y no entran en la casilla del jugador ni en la que este acaba de empezar a ocupar.
- Al tocar una casilla en modo edición, la prioridad es: personaje del propietario, luego habitante, luego espacio.
- La posición de los habitantes no se guarda. Al abrir la app y al tocar "Listo" se coloca primero al jugador y después a cada habitante en una casilla libre al azar.
- El documento guardado pasa a `version: 2` en la misma clave `livin:datos:v1`; un documento `version: 1` se migra al cargar y se guarda como v2 en el siguiente guardado. La posición del jugador sigue en `livin:posicion:v1`.
- 60 cuadros por segundo con 8 familiares y 4 mascotas en el dispositivo de referencia; menos de 100 ms tras cada alta, edición o baja.
- Ningún dato sale del dispositivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs; arte de marcador original.
- El modelo, el generador, la posición y el movimiento no importan Phaser ni el DOM (ADR del generador de la 001 y ADR de movimiento de la 002).

**Pre-implementation gates:**
- *Simplicity:* siguen siendo 3 componentes. Dominio (`catalogo.js`, `hogar.js`, `almacen.js`), lógica pura de mapa y movimiento (`distribucion.js`, `posicion.js`, `etiquetas.js` y el nuevo `movimiento.js`) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* un único modelo canónico de miembro (objetos planos del estado guardado). El estado de movimiento de la sesión (`moviles`) no es una vista de `Miembro`: es la posición de la sesión, que por decisión de la spec no se guarda (ADR de movimiento). Phaser y el DOM se usan directamente. ✓
- *Integration-First:* los contratos (exportaciones, listas cerradas, constantes del movimiento, migración) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que el propietario registre hasta 8 familiares y 4 mascotas en modo edición y los vea caminar solos por su hogar sin superponerse con nadie, con los datos conservados entre sesiones y los hogares de la feature 001 migrados sin pérdida, cubierto por 89 pruebas automáticas (55 existentes + 34 nuevas).

Archivos (bajo `poc/`): `src/catalogo.js` (listas y límites), `src/hogar.js` (operaciones puras de habitantes), `src/almacen.js` (migración y validación v2), `src/posicion.js` (paso con ocupación), `src/movimiento.js` (nuevo: movimiento puro), `src/juego.js` e `index.html` (presentación), y pruebas en `test/` (`ayuda.js`, `contrato-habitantes.test.js`, `habitantes.test.js`, `almacen.test.js`, `posicion.test.js`, `movimiento.test.js`).

---

## Phase 0: Contracts and Tests First

**Implements:** FR-2 (listas cerradas), FR-5 (constantes de movimiento), FR-9 (migración), contrato de FR-1/FR-4/FR-7 | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/ayuda.js`, `poc/test/contrato-habitantes.test.js`
**Interfaces:** Consumes: nada. Produces: `azarReproducible(semilla)` → función sin argumentos que devuelve números en [0, 1) en una secuencia determinista; el contrato de nombres exportados por `src/catalogo.js` (`PARENTESCOS`, `GENEROS`, `ESPECIES`, `LIMITES_HABITANTES`), `src/hogar.js` (`agregarHabitante`, `editarHabitante`, `eliminarHabitante`, `puedeAgregarHabitante`, `puedeEliminarMiembro`, `familiares`, `mascotas`, `habitantes`, `contarHabitantes`, `buscarMiembro`, `esPropietario`, `MENSAJES_ERROR.limite`), `src/almacen.js` (`migrarAV2`), `src/posicion.js` (`claveCasilla(x, y)` → `"x,y"`) y `src/movimiento.js` (`MS_POR_PASO = 500`, `PAUSA_MIN_MS = 1000`, `PAUSA_MAX_MS = 4000`, `TRAMO_MIN = 1`, `TRAMO_MAX = 6`, `colocarHabitantes`, `avanzarHabitantes`, `sincronizarHabitantes`, `congelarHabitantes`, `ocupadasPorHabitantes`, `ocupadasPorJugador`).

Fija la forma pública de lo nuevo antes de implementarlo. La prueba de contrato queda en rojo (`ERR_MODULE_NOT_FOUND` de `src/movimiento.js`) hasta el final de la Fase 3; las Fases 1 y 2 se verifican con sus propios archivos de prueba.

- [ ] Agregar al final de `test/ayuda.js` (sin cambiar lo existente) el azar reproducible:
```js
// Azar reproducible para las pruebas de movimiento (mulberry32): misma semilla, misma secuencia en [0, 1).
export function azarReproducible(semilla = 1) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato-habitantes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as posicion from '../src/posicion.js';
import * as movimiento from '../src/movimiento.js';
import { azarReproducible } from './ayuda.js';

test('contrato del catálogo de habitantes: listas cerradas y límites', () => {
  assert.deepEqual(Object.keys(catalogo.PARENTESCOS), ['pareja', 'hijo', 'padre_madre', 'hermano', 'abuelo', 'otro']);
  assert.deepEqual(Object.values(catalogo.PARENTESCOS), ['Pareja', 'Hijo/a', 'Padre o madre', 'Hermano/a', 'Abuelo/a', 'Otro familiar']);
  assert.deepEqual(catalogo.GENEROS, { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' });
  assert.deepEqual(catalogo.ESPECIES, { perro: 'Perro', gato: 'Gato', otro: 'Otro' });
  assert.deepEqual(catalogo.LIMITES_HABITANTES, { familiar: 8, mascota: 4 });
});

test('contrato del modelo y del almacén: funciones de habitantes y migración', () => {
  for (const f of ['agregarHabitante', 'editarHabitante', 'eliminarHabitante', 'puedeAgregarHabitante', 'puedeEliminarMiembro',
    'familiares', 'mascotas', 'habitantes', 'contarHabitantes', 'buscarMiembro', 'esPropietario']) {
    assert.equal(typeof hogar[f], 'function', f);
  }
  assert.equal(typeof hogar.MENSAJES_ERROR.limite, 'string');
  assert.equal(typeof almacen.migrarAV2, 'function');
});

test('contrato del movimiento: funciones y constantes del ADR', () => {
  for (const f of ['colocarHabitantes', 'avanzarHabitantes', 'sincronizarHabitantes', 'congelarHabitantes',
    'ocupadasPorHabitantes', 'ocupadasPorJugador']) {
    assert.equal(typeof movimiento[f], 'function', f);
  }
  assert.deepEqual(
    [movimiento.MS_POR_PASO, movimiento.PAUSA_MIN_MS, movimiento.PAUSA_MAX_MS, movimiento.TRAMO_MIN, movimiento.TRAMO_MAX],
    [500, 1000, 4000, 1, 6],
  );
  assert.equal(posicion.claveCasilla(3, 4), '3,4');
});

test('azar reproducible: misma semilla, misma secuencia, valores en [0, 1)', () => {
  const a = Array.from({ length: 200 }, azarReproducible(42));
  const b = Array.from({ length: 200 }, azarReproducible(42));
  assert.deepEqual(a, b);
  assert.ok(a.every((n) => n >= 0 && n < 1));
  assert.notDeepEqual(a, Array.from({ length: 200 }, azarReproducible(43)));
});
```

- [ ] Run: `cd poc && node --test test/contrato-habitantes.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/movimiento.js`)
- [ ] Commit: `test(poc): add contract tests for family members and pets` (cuerpo: `Plan section: Phase 0: Contracts and Tests First`)

---

## Phase 1: Catálogo y modelo de habitantes

**Implements:** FR-1, FR-2, FR-3, FR-4 (lógica), FR-10, Stories 1, 2, 3, 7, 8, 10 (lógica) | **Satisfies:** AC-1.2 (datos), AC-1.3, AC-1.4 (lógica), AC-2.2 (datos), AC-2.3, AC-2.4 (lógica), AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-7.5 (lógica), AC-7.6 (lógica), AC-7.8 (lógica), AC-8.3, AC-8.4, AC-9.4 (hogar inicial), AC-10.1, AC-10.2, AC-10.3
**Files:** `poc/src/catalogo.js`, `poc/src/hogar.js`, `poc/test/habitantes.test.js`
**Interfaces:** Consumes: `crearCtx()` (Fase 0 de la 001); de `catalogo.js` las listas nuevas. Produces: desde `catalogo.js`: `PARENTESCOS`, `GENEROS`, `ESPECIES` (objetos clave → etiqueta) y `LIMITES_HABITANTES = { familiar: 8, mascota: 4 }`. Desde `hogar.js` (todas puras, `ctx = { cuentaId, nuevoId(), ahora() }`): `crearHogarInicial(ctx)` ahora devuelve `version: 2` y un propietario `{ tipo: 'persona', parentesco: null, genero: null, especie: null }`; `esPropietario(estado, miembro)`; `buscarMiembro(estado, id)` → miembro activo o `null`; `familiares(estado)`, `mascotas(estado)`, `habitantes(estado)` (familiares y luego mascotas, en orden de alta); `contarHabitantes(estado, clase)`; `puedeAgregarHabitante(estado, clase)`; `agregarHabitante(estado, clase, datos, ctx)` y `editarHabitante(estado, id, datos, ctx)` → `{ ok, estado, error? }` con `clase ∈ 'familiar' | 'mascota'`, `datos = { nombre, parentesco?, genero?, especie? }` y `error ∈ 'limite' | 'vacio' | 'largo' | 'duplicado' | 'parentesco' | 'genero' | 'especie' | 'no-editable'`; `puedeEliminarMiembro(estado, id)`; `eliminarHabitante(estado, id, ctx)` → estado (sin cambios si no se puede); `renombrarMiembro` con el mismo comportamiento que en la 001; `MENSAJES_ERROR` con las claves nuevas.

Agrega las reglas de los habitantes como funciones puras sobre `estado.miembros`, reutilizando las reglas de nombres de la 001 (ADR de modelo de miembros: las mascotas son miembros sin cuenta). La validación de nombres se extrae de `renombrarMiembro` para compartirla, sin cambiar su comportamiento.

- [ ] Escribir las pruebas del modelo de habitantes:
```js
// test/habitantes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, agregarHabitante, editarHabitante, eliminarHabitante, puedeAgregarHabitante, puedeEliminarMiembro,
  familiares, mascotas, habitantes, contarHabitantes, buscarMiembro, esPropietario, renombrarMiembro, espaciosActivos,
} from '../src/hogar.js';
import { crearCtx } from './ayuda.js';

const FAMILIAR = { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' };
const MASCOTA = { nombre: 'Firulais', especie: 'perro' };

function alta(estado, clase, datos, ctx) {
  const r = agregarHabitante(estado, clase, datos, ctx);
  assert.equal(r.ok, true, `alta de ${datos.nombre}: ${r.error}`);
  return r.estado;
}

test('FR-1, AC-9.4: el hogar inicial tiene versión 2 y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 2);
  const [propietario] = e.miembros;
  assert.deepEqual([propietario.tipo, propietario.parentesco, propietario.genero, propietario.especie], ['persona', null, null, null]);
  assert.equal(esPropietario(e, propietario), true);
  assert.deepEqual(habitantes(e), []);
  assert.deepEqual([contarHabitantes(e, 'familiar'), contarHabitantes(e, 'mascota')], [0, 0]);
});

test('AC-1.2, AC-10.3: alta de un familiar con nombre, parentesco y género', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  const [f] = familiares(e);
  assert.deepEqual([f.nombre, f.tipo, f.parentesco, f.genero, f.especie, f.cuentaId], ['Diana', 'persona', 'pareja', 'femenino', null, null]);
  assert.equal(f.hogarId, e.hogares[0].id);
  assert.equal(contarHabitantes(e, 'familiar'), 1);
  assert.deepEqual(mascotas(e), []);
});

test('AC-2.2, AC-10.3: alta de una mascota con nombre y especie, sin parentesco ni género', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'mascota', { ...MASCOTA, parentesco: 'pareja', genero: 'femenino' }, ctx);
  const [m] = mascotas(e);
  assert.deepEqual([m.nombre, m.tipo, m.parentesco, m.genero, m.especie, m.cuentaId], ['Firulais', 'mascota', null, null, 'perro', null]);
  assert.equal(contarHabitantes(e, 'mascota'), 1);
});

test('AC-1.3, AC-2.3, FR-2: faltan datos o están fuera de las listas cerradas', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const casos = [
    ['familiar', { nombre: 'Ana', genero: 'femenino' }, 'parentesco'],
    ['familiar', { nombre: 'Ana', parentesco: 'pareja' }, 'genero'],
    ['familiar', { nombre: 'Ana', parentesco: 'tia', genero: 'femenino' }, 'parentesco'],
    ['familiar', { nombre: 'Ana', parentesco: 'toString', genero: 'femenino' }, 'parentesco'],
    ['familiar', { nombre: 'Ana', parentesco: 'pareja', genero: 'x' }, 'genero'],
    ['mascota', { nombre: 'Michi' }, 'especie'],
    ['mascota', { nombre: 'Michi', especie: 'loro' }, 'especie'],
    ['familiar', { nombre: '', parentesco: 'pareja', genero: 'femenino' }, 'vacio'],
  ];
  for (const [clase, datos, error] of casos) {
    const r = agregarHabitante(e, clase, datos, ctx);
    assert.equal(r.ok, false, JSON.stringify(datos));
    assert.equal(r.error, error, JSON.stringify(datos));
    assert.equal(r.estado, e);
  }
});

test('AC-1.4, AC-2.4, FR-1: límites de 8 familiares y 4 mascotas; los eliminados no cuentan', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  for (let i = 1; i <= 8; i++) e = alta(e, 'familiar', { nombre: `F${i}`, parentesco: 'hijo', genero: 'otro' }, ctx);
  for (let i = 1; i <= 4; i++) e = alta(e, 'mascota', { nombre: `M${i}`, especie: 'gato' }, ctx);
  assert.equal(puedeAgregarHabitante(e, 'familiar'), false);
  assert.equal(puedeAgregarHabitante(e, 'mascota'), false);
  assert.equal(agregarHabitante(e, 'familiar', { nombre: 'F9', parentesco: 'hijo', genero: 'otro' }, ctx).error, 'limite');
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'M5', especie: 'gato' }, ctx).error, 'limite');
  e = eliminarHabitante(e, familiares(e)[0].id, ctx);
  assert.equal(contarHabitantes(e, 'familiar'), 7);
  assert.equal(puedeAgregarHabitante(e, 'familiar'), true);
});

test('AC-3.1: el nombre se guarda sin espacios al inicio ni al final', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'familiar', { ...FAMILIAR, nombre: '  Diana  ' }, ctx);
  assert.equal(familiares(e)[0].nombre, 'Diana');
});

test('AC-3.2: el nombre es único entre todos los miembros sin distinguir mayúsculas', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = renombrarMiembro(e, e.miembros[0].id, 'Diana', ctx).estado; // el personaje del propietario
  assert.equal(agregarHabitante(e, 'familiar', { ...FAMILIAR, nombre: 'diana' }, ctx).error, 'duplicado');
  assert.equal(agregarHabitante(e, 'mascota', { ...MASCOTA, nombre: 'DIANA' }, ctx).error, 'duplicado');
  e = alta(e, 'mascota', MASCOTA, ctx);
  assert.equal(agregarHabitante(e, 'familiar', { ...FAMILIAR, nombre: 'firulais' }, ctx).error, 'duplicado');
});

test('AC-3.3: máximo 20 caracteres', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'x'.repeat(21), especie: 'otro' }, ctx).error, 'largo');
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'x'.repeat(20), especie: 'otro' }, ctx).ok, true);
});

test('AC-3.4: el nombre de un habitante eliminado puede reutilizarse', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'mascota', { nombre: 'Luna', especie: 'gato' }, ctx);
  e = eliminarHabitante(e, mascotas(e)[0].id, ctx);
  assert.equal(agregarHabitante(e, 'mascota', { nombre: 'Luna', especie: 'perro' }, ctx).ok, true);
});

test('AC-3.5, AC-7.6, AC-10.1: editar cambia nombre y datos, rechaza el nombre vacío y conserva el identificador', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  const id = familiares(e)[0].id;
  const vacio = editarHabitante(e, id, { ...FAMILIAR, nombre: '   ' }, ctx);
  assert.equal(vacio.ok, false);
  assert.equal(vacio.error, 'vacio');
  assert.equal(buscarMiembro(vacio.estado, id).nombre, 'Diana');
  e = editarHabitante(e, id, { nombre: 'Dana', parentesco: 'hermano', genero: 'otro' }, ctx).estado;
  const f = buscarMiembro(e, id);
  assert.deepEqual([f.id, f.nombre, f.parentesco, f.genero], [id, 'Dana', 'hermano', 'otro']);
  assert.ok(f.actualizadoEn > f.creadoEn);
});

test('AC-7.5: editar una mascota cambia su especie y nunca le asigna parentesco ni género', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'mascota', MASCOTA, ctx);
  const id = mascotas(e)[0].id;
  e = editarHabitante(e, id, { nombre: 'Firulais', especie: 'gato', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  const m = buscarMiembro(e, id);
  assert.deepEqual([m.especie, m.parentesco, m.genero], ['gato', null, null]);
});

test('AC-7.8, FR-4: el personaje del propietario no se edita como habitante ni se elimina', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const id = e.miembros[0].id;
  assert.equal(puedeEliminarMiembro(e, id), false);
  assert.equal(eliminarHabitante(e, id, ctx), e);
  const r = editarHabitante(e, id, FAMILIAR, ctx);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'no-editable');
});

test('AC-8.3, AC-8.4: eliminar es un borrado lógico y no toca a nadie más', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  e = alta(e, 'mascota', MASCOTA, ctx);
  const [diana] = familiares(e);
  const espaciosAntes = espaciosActivos(e);
  const mascotaAntes = mascotas(e)[0];
  const despues = eliminarHabitante(e, diana.id, ctx);
  const registro = despues.miembros.find((m) => m.id === diana.id);
  assert.ok(registro.eliminadoEn);
  assert.equal(buscarMiembro(despues, diana.id), null);
  assert.equal(contarHabitantes(despues, 'familiar'), 0);
  assert.deepEqual(espaciosActivos(despues), espaciosAntes);
  assert.deepEqual(mascotas(despues)[0], mascotaAntes);
  assert.equal(esPropietario(despues, despues.miembros[0]), true);
});

test('AC-10.2: cada habitante tiene auditoría con la cuenta del propietario', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  e = alta(e, 'mascota', MASCOTA, ctx);
  for (const h of habitantes(e)) {
    assert.ok(h.creadoEn && h.actualizadoEn);
    assert.equal(h.creadoPor, 'cuenta-1');
    assert.equal(h.actualizadoPor, 'cuenta-1');
    assert.equal(h.eliminadoEn, null);
  }
});
```

- [ ] Run: `cd poc && node --test test/habitantes.test.js` — expect: FAIL (`SyntaxError`: el módulo `../src/hogar.js` no exporta `agregarHabitante`)
- [ ] Agregar al final de `src/catalogo.js`:
```js
// Habitantes (feature 002): listas cerradas y límites. Las claves se guardan; las etiquetas se muestran.
export const PARENTESCOS = {
  pareja: 'Pareja', hijo: 'Hijo/a', padre_madre: 'Padre o madre', hermano: 'Hermano/a', abuelo: 'Abuelo/a', otro: 'Otro familiar',
};
export const GENEROS = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
export const ESPECIES = { perro: 'Perro', gato: 'Gato', otro: 'Otro' };
export const LIMITES_HABITANTES = { familiar: 8, mascota: 4 };
```

- [ ] En `src/hogar.js`, reemplazar la línea de import por:
```js
import { TIPOS, ETIQUETAS, LIMITES, ADMITE_BANO, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES } from './catalogo.js';
```

- [ ] En `src/hogar.js`, reemplazar `crearHogarInicial` completa por:
```js
export function crearHogarInicial(ctx) {
  const cuentaId = ctx.cuentaId;
  const hogarId = ctx.nuevoId();
  const a = () => auditoriaNueva(ctx);
  const cuenta = { id: cuentaId, ...a() };
  const hogar = { id: hogarId, nombre: 'Mi hogar', ...a() };
  const membresia = { id: ctx.nuevoId(), cuentaId, hogarId, rol: 'propietario', ...a() };
  const tipos = ['sala', 'cocina', 'bano', 'dormitorio'];
  const espacios = tipos.map((tipo, i) => ({
    id: ctx.nuevoId(), hogarId, tipo, orden: 1, secuencia: i + 1,
    nombrePersonalizado: null, contenidoEn: null, ...a(),
  }));
  // El personaje del propietario es una persona sin parentesco ni género (ADR-002 de modelo de miembros).
  const miembro = {
    id: ctx.nuevoId(), hogarId, nombre: 'Personaje 1', cuentaId,
    tipo: 'persona', parentesco: null, genero: null, especie: null, ...a(),
  };
  return { version: 2, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro] };
}
```

- [ ] En `src/hogar.js`, reemplazar `renombrarMiembro` completa por la validación compartida, la versión nueva de `renombrarMiembro` y la sección de habitantes:
```js
// Reglas de nombre de miembro (FR-9 de la 001, FR-3 de la 002): sin espacios en los extremos, 1–20 caracteres,
// único sin distinguir mayúsculas entre los miembros activos (propietario, familiares y mascotas).
function validarNombreMiembro(estado, texto, idExcluido) {
  const nombre = texto.trim();
  if (nombre === '') return { error: 'vacio' };
  if (nombre.length > MAX_NOMBRE) return { error: 'largo' };
  const repetido = miembrosActivos(estado).some((m) => m.id !== idExcluido && normalizar(m.nombre) === normalizar(nombre));
  if (repetido) return { error: 'duplicado' };
  return { nombre };
}

export function renombrarMiembro(estado, id, texto, ctx) {
  const v = validarNombreMiembro(estado, texto, id);
  if (v.error) return { ok: false, error: v.error, estado };
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), nombre: v.nombre } : m));
  return { ok: true, estado: { ...estado, miembros } };
}

// ---------- Habitantes (feature 002) ----------

const cuentaPropietaria = (estado) =>
  estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId ?? null;

// El personaje del propietario es el miembro vinculado a la cuenta propietaria; no es un habitante.
export const esPropietario = (estado, miembro) => miembro.cuentaId !== null && miembro.cuentaId === cuentaPropietaria(estado);
export const buscarMiembro = (estado, id) => miembrosActivos(estado).find((m) => m.id === id) ?? null;
export const familiares = (estado) => miembrosActivos(estado).filter((m) => m.tipo === 'persona' && !esPropietario(estado, m));
export const mascotas = (estado) => miembrosActivos(estado).filter((m) => m.tipo === 'mascota');
export const habitantes = (estado) => [...familiares(estado), ...mascotas(estado)];
export const contarHabitantes = (estado, clase) => (clase === 'familiar' ? familiares(estado) : mascotas(estado)).length;
export const puedeAgregarHabitante = (estado, clase) => contarHabitantes(estado, clase) < LIMITES_HABITANTES[clase];

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);

// Datos obligatorios según la clase (FR-2): familiar → parentesco y género; mascota → especie.
function validarDatos(clase, datos) {
  if (clase === 'familiar') {
    if (!enLista(PARENTESCOS, datos.parentesco)) return 'parentesco';
    if (!enLista(GENEROS, datos.genero)) return 'genero';
    return null;
  }
  return enLista(ESPECIES, datos.especie) ? null : 'especie';
}

const datosDeClase = (clase, datos) => (clase === 'familiar'
  ? { tipo: 'persona', parentesco: datos.parentesco, genero: datos.genero, especie: null }
  : { tipo: 'mascota', parentesco: null, genero: null, especie: datos.especie });

export function agregarHabitante(estado, clase, datos, ctx) {
  if (!puedeAgregarHabitante(estado, clase)) return { ok: false, error: 'limite', estado };
  const v = validarNombreMiembro(estado, datos.nombre ?? '', null);
  if (v.error) return { ok: false, error: v.error, estado };
  const errorDatos = validarDatos(clase, datos);
  if (errorDatos) return { ok: false, error: errorDatos, estado };
  const miembro = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, nombre: v.nombre, cuentaId: null,
    ...datosDeClase(clase, datos), ...auditoriaNueva(ctx),
  };
  return { ok: true, estado: { ...estado, miembros: [...estado.miembros, miembro] } };
}

export function editarHabitante(estado, id, datos, ctx) {
  const miembro = buscarMiembro(estado, id);
  if (!miembro || esPropietario(estado, miembro)) return { ok: false, error: 'no-editable', estado };
  const clase = miembro.tipo === 'mascota' ? 'mascota' : 'familiar';
  const v = validarNombreMiembro(estado, datos.nombre ?? '', id);
  if (v.error) return { ok: false, error: v.error, estado };
  const errorDatos = validarDatos(clase, datos);
  if (errorDatos) return { ok: false, error: errorDatos, estado };
  const miembros = estado.miembros.map((m) => (m.id === id
    ? { ...tocar(m, ctx), nombre: v.nombre, ...datosDeClase(clase, datos) }
    : m));
  return { ok: true, estado: { ...estado, miembros } };
}

export function puedeEliminarMiembro(estado, id) {
  const miembro = buscarMiembro(estado, id);
  return Boolean(miembro) && !esPropietario(estado, miembro);
}

// Borrado lógico (FR-4, FR-10): el registro queda con su fecha de eliminación; no afecta a nadie más.
export function eliminarHabitante(estado, id, ctx) {
  if (!puedeEliminarMiembro(estado, id)) return estado;
  const ahora = ctx.ahora();
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), eliminadoEn: ahora } : m));
  return { ...estado, miembros };
}
```

- [ ] En `src/hogar.js`, reemplazar `MENSAJES_ERROR` completo por:
```js
export const MENSAJES_ERROR = {
  vacio: 'El nombre no puede estar vacío.',
  largo: 'El nombre puede tener como máximo 20 caracteres.',
  duplicado: 'Ya existe otro con ese nombre.',
  'formato-automatico': 'Ese formato está reservado para los nombres automáticos (por ejemplo, "Dormitorio 3").',
  limite: 'Ya se alcanzó el límite de habitantes de esta clase.',
  parentesco: 'Elige un parentesco de la lista.',
  genero: 'Elige un género de la lista.',
  especie: 'Elige una especie de la lista.',
  'no-editable': 'El personaje del propietario solo se puede renombrar.',
};
```

- [ ] Run: `cd poc && node --test test/habitantes.test.js test/hogar.test.js` — expect: PASS (`# pass 35`, `# fail 0`: 14 nuevas + las 21 existentes de `hogar.test.js`)
- [ ] Commit: `feat(poc): add family members and pets to the home model` (cuerpo: `Plan section: Phase 1: Catálogo y modelo de habitantes`)

---

## Phase 2: Persistencia y compatibilidad

**Implements:** FR-9, FR-10 (registro guardado), Story 9 | **Satisfies:** AC-9.1, AC-9.3, AC-9.4, AC-9.5, AC-8.4 (registro guardado)
**Files:** `poc/src/almacen.js`, `poc/test/almacen.test.js`
**Interfaces:** Consumes: `crearHogarInicial`, `agregarHabitante`, `familiares`, `mascotas` (Fase 1); `PARENTESCOS`, `GENEROS`, `ESPECIES` (Fase 1); `almacenEnMemoria`, `crearCtx` (001). Produces: `migrarAV2(estado)` → documento v2 (función pura); `crearAlmacen(storage).cargar()` acepta `version` 1 (lo migra) o 2 (lo valida con las reglas del ADR) y devuelve `{ estado: null, error: 'ilegible' }` en cualquier otro caso; `iniciarSesion` sin cambios de firma. Las claves `CLAVE_DATOS` y `CLAVE_POSICION` no cambian.

Implementa el ADR de modelo de miembros en el almacén. Regla de validación de la v2: una persona puede tener `parentesco` y `genero` nulos (es lo que deja la migración), pero nunca un valor fuera de las listas; una mascota necesita una especie de la lista y nunca tiene parentesco ni género; y hay exactamente un miembro activo vinculado a la cuenta propietaria. Así el fixture de AC-8.5 de la 001 (un miembro sin cuenta copiado del propietario) sigue siendo válido sin cambios.

- [ ] En `test/almacen.test.js`, reemplazar las dos líneas de import de `../src/almacen.js` y `../src/hogar.js` por:
```js
import { crearAlmacen, iniciarSesion, migrarAV2, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
import {
  agregarEspacio, renombrarEspacio, espaciosDeTipo, crearHogarInicial, agregarHabitante, familiares, mascotas,
} from '../src/hogar.js';
```

- [ ] Agregar al final de `test/almacen.test.js`:
```js
// Documento como lo guardaba la feature 001: versión 1 y miembros sin tipo, parentesco, género ni especie.
function comoV1(estado) {
  return { ...estado, version: 1, miembros: estado.miembros.map(({ tipo, parentesco, genero, especie, ...resto }) => resto) };
}

function hogarConHabitantes(ctx) {
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  return agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
}

test('AC-9.1: los habitantes y sus datos se guardan y se restauran igual', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const e = hogarConHabitantes(crearCtx());
  assert.deepEqual(almacen.guardar(e), { ok: true });
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
  assert.deepEqual(familiares(estado).map((f) => [f.nombre, f.parentesco, f.genero]), [['Diana', 'pareja', 'femenino']]);
  assert.deepEqual(mascotas(estado).map((m) => [m.nombre, m.especie]), [['Firulais', 'perro']]);
});

test('AC-9.3: un hogar de la feature 001 se abre sin aviso y se guarda en el formato nuevo en el siguiente guardado', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  e = renombrarEspacio(e, espaciosDeTipo(e, 'dormitorio')[1].id, 'Cuarto de Bryam', ctx).estado;
  const textoV1 = JSON.stringify(comoV1(e));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV1 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, crearCtx());
  assert.equal(aviso, null);
  assert.deepEqual(estado, e); // mismos espacios, nombres y personaje; ya en versión 2 en memoria
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV1); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 2);
});

test('AC-9.4: tras migrar, el personaje del propietario conserva nombre y cuenta y no recibe parentesco ni género', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const migrado = migrarAV2(comoV1(e));
  const conFamilia = agregarHabitante(migrado, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  const propietario = conFamilia.miembros[0];
  assert.deepEqual(
    [propietario.nombre, propietario.cuentaId, propietario.tipo, propietario.parentesco, propietario.genero],
    ['Personaje 1', e.cuentas[0].id, 'persona', null, null],
  );
  assert.equal(familiares(conFamilia).length, 1);
});

test('migrarAV2 es pura: no modifica el documento de entrada y solo agrega los campos nuevos', () => {
  const v1 = comoV1(crearHogarInicial(crearCtx()));
  const copia = structuredClone(v1);
  const v2 = migrarAV2(v1);
  assert.deepEqual(v1, copia);
  assert.equal(v2.version, 2);
  assert.deepEqual(comoV1(v2), v1);
});

test('AC-9.5: datos con un habitante inválido se consideran ilegibles', () => {
  const base = hogarConHabitantes(crearCtx());
  const [, diana, firulais] = base.miembros;
  const variantes = [
    { ...diana, tipo: 'robot' },
    { ...firulais, parentesco: 'pareja' },
    { ...firulais, genero: 'femenino' },
    { ...diana, especie: 'perro' },
    { ...diana, parentesco: 'tia' },
    { ...diana, genero: 'x' },
    { ...firulais, especie: 'loro' },
    { ...diana, cuentaId: base.cuentas[0].id }, // dos miembros vinculados a la cuenta del propietario
  ];
  const abrir = (datos) => iniciarSesion(crearAlmacen(almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(datos) })), crearCtx());
  for (const malo of variantes) {
    const { estado, aviso } = abrir({ ...base, miembros: base.miembros.map((m) => (m.id === malo.id ? malo : m)) });
    assert.match(aviso, /No se pudo recuperar/, JSON.stringify(malo));
    assert.equal(estado.miembros.length, 1);
  }
  const sinPropietario = { ...base, miembros: base.miembros.map((m, i) => (i === 0 ? { ...m, cuentaId: null } : m)) };
  assert.match(abrir(sinPropietario).aviso, /No se pudo recuperar/);
});
```

- [ ] Run: `cd poc && node --test test/almacen.test.js` — expect: FAIL (`SyntaxError`: `../src/almacen.js` no exporta `migrarAV2`)
- [ ] Reemplazar `src/almacen.js` completo por:
```js
// src/almacen.js
import { crearHogarInicial } from './hogar.js';
import { PARENTESCOS, GENEROS, ESPECIES } from './catalogo.js';

export const CLAVE_DATOS = 'livin:datos:v1';
export const CLAVE_POSICION = 'livin:posicion:v1';

// Condiciones de la feature 001, comunes a las versiones 1 y 2 del documento.
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

// Reglas de los miembros en la versión 2 (ADR-002 de modelo de miembros, FR-9 de la 002).
function miembrosValidos(estado) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const activos = estado.miembros.filter((m) => m.eliminadoEn === null);
  if (!propietaria || activos.filter((m) => m.cuentaId === propietaria).length !== 1) return false;
  return estado.miembros.every((m) => {
    if (m.tipo === 'mascota') return m.parentesco === null && m.genero === null && enLista(ESPECIES, m.especie);
    if (m.tipo === 'persona') return m.especie === null && nuloOEnLista(PARENTESCOS, m.parentesco) && nuloOEnLista(GENEROS, m.genero);
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

export function crearAlmacen(storage) {
  return {
    cargar() {
      try {
        const texto = storage.getItem(CLAVE_DATOS);
        if (texto === null) return { estado: null, error: null };
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) return { estado: migrarAV2(estado), error: null };
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidos(estado)) return { estado, error: null };
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

// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002): recupera el hogar (migrándolo si es v1) o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar();
  if (estado) return { estado, aviso: null };
  const nuevo = crearHogarInicial(ctx);
  almacen.guardar(nuevo);
  return { estado: nuevo, aviso: error === 'ilegible' ? 'No se pudo recuperar tu hogar guardado. Se creó un hogar nuevo.' : null };
}
```

- [ ] Run: `cd poc && node --test test/almacen.test.js` — expect: PASS (`# pass 12`, `# fail 0`: 5 nuevas + 7 de la 001, incluida AC-8.5 sin cambios)
- [ ] Commit: `feat(poc): migrate saved homes to format v2 and validate members` (cuerpo: `Plan section: Phase 2: Persistencia y compatibilidad`)

---

## Phase 3: Movimiento autónomo y bloqueo mutuo

**Implements:** FR-5, FR-6, FR-7 (lógica), Stories 4, 5, 6 (lógica), NFR Reliability | **Satisfies:** AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-6.1 (lógica), AC-6.2 (lógica), AC-6.3, AC-7.2 (lógica), AC-7.7 (lógica)
**Files:** `poc/src/posicion.js`, `poc/src/movimiento.js`, `poc/test/posicion.test.js`, `poc/test/movimiento.test.js`
**Interfaces:** Consumes: `generarDistribucion`, `esTransitable` (001); `crearHogarInicial`, `agregarEspacio`, `eliminarEspacio`, `espaciosDeTipo` (001); `azarReproducible`, `crearCtx` (Fase 0). Produces: desde `posicion.js`: `claveCasilla(x, y)` → `"x,y"` y `paso(distribucion, actual, direccion, ocupadas = new Set())`, que ahora también bloquea las casillas de `ocupadas`. Desde `movimiento.js`: las constantes del ADR; un **móvil** es `{ id, x, y, desde: { x, y } | null, progresoMs, pausaMs, tramo, direccion }` (estado de sesión: `(x, y)` es la casilla que ocupa o a la que se dirige y, mientras `progresoMs > 0`, también ocupa `desde`); el **jugador** se pasa como `{ x, y, desde? }`; `colocarHabitantes(ids, distribucion, jugador, azar)` → móviles quietos en casillas libres distintas; `avanzarHabitantes(moviles, distribucion, jugador, dtMs, azar)` → móviles nuevos; `sincronizarHabitantes(moviles, ids, distribucion, jugador, azar)` → móviles en el orden de `ids`; `congelarHabitantes(moviles)`; `ocupadasPorHabitantes(moviles)` y `ocupadasPorJugador(jugador)` → `Set` de claves de casilla.

Implementa el ADR de movimiento: toda la lógica es pura y determinista dado el azar, de modo que las invariantes de FR-5 y FR-6 se verifican con recorridos largos reproducibles. El paso del jugador de la 001 gana un parámetro opcional; sin él, se comporta exactamente igual que antes.

- [ ] En `test/posicion.test.js`, reemplazar la línea `import { posicionRelativa, resolverPosicion, paso } from '../src/posicion.js';` por:
```js
import { posicionRelativa, resolverPosicion, paso, claveCasilla } from '../src/posicion.js';
```

- [ ] Agregar al final de `test/posicion.test.js`:
```js
test('AC-5.1, AC-5.3 (002): un habitante bloquea el paso del jugador y deja pasar cuando se aparta', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const inicio = { ...d.aparicion, direccion: 'izquierda' };
  const conHabitante = new Set([claveCasilla(inicio.x, inicio.y + 1)]);
  assert.deepEqual(paso(d, inicio, 'abajo', conHabitante), { x: inicio.x, y: inicio.y, direccion: 'abajo', movio: false });
  assert.deepEqual(paso(d, inicio, 'abajo', new Set()), { x: inicio.x, y: inicio.y + 1, direccion: 'abajo', movio: true });
  assert.deepEqual(paso(d, inicio, 'abajo'), { x: inicio.x, y: inicio.y + 1, direccion: 'abajo', movio: true });
});
```

- [ ] Escribir las pruebas del movimiento:
```js
// test/movimiento.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { paso, claveCasilla } from '../src/posicion.js';
import {
  MS_POR_PASO, PAUSA_MIN_MS, PAUSA_MAX_MS, TRAMO_MAX, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes,
  congelarHabitantes, ocupadasPorHabitantes,
} from '../src/movimiento.js';
import { crearCtx, azarReproducible } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const IDS = Array.from({ length: 12 }, (_, i) => `h-${i + 1}`);
const movil = (id, x, y, extra = {}) => ({ id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null, ...extra });
const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function hogarMasGrande() {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  return agregar(e, ctx, ...Array(6).fill('bano'));
}

function alcanzablesDesde(d, inicio) {
  const visto = new Set([claveCasilla(inicio.x, inicio.y)]);
  const cola = [inicio];
  while (cola.length) {
    const { x, y } = cola.shift();
    for (const [dx, dy] of VECINOS) {
      const k = claveCasilla(x + dx, y + dy);
      if (!visto.has(k) && esTransitable(d, x + dx, y + dy)) { visto.add(k); cola.push({ x: x + dx, y: y + dy }); }
    }
  }
  return visto;
}

// Invariantes de FR-5 y FR-6: nadie fuera de una casilla transitable y nadie compartiendo casilla (incluidos los orígenes).
function verificarInvariantes(d, moviles, jugador) {
  const vistas = new Set();
  const marcar = (x, y, quien) => {
    assert.ok(esTransitable(d, x, y), `${quien} en una casilla no transitable (${x},${y})`);
    const k = claveCasilla(x, y);
    assert.ok(!vistas.has(k), `${quien} comparte la casilla ${k}`);
    vistas.add(k);
  };
  marcar(jugador.x, jugador.y, 'jugador');
  if (jugador.desde) marcar(jugador.desde.x, jugador.desde.y, 'jugador (origen)');
  for (const h of moviles) {
    marcar(h.x, h.y, h.id);
    if (h.desde) marcar(h.desde.x, h.desde.y, `${h.id} (origen)`);
  }
}

// Simula `ms` milisegundos en cuadros de 50 ms con el jugador caminando al azar a 4 casillas por segundo.
function simular(d, moviles, jugadorInicial, ms, azar, alCuadro = () => {}) {
  const DT = 50;
  let jugador = { x: jugadorInicial.x, y: jugadorInicial.y, direccion: 'abajo', desde: null };
  let restanteJugador = 0;
  for (let t = 0; t < ms; t += DT) {
    if (restanteJugador > 0) {
      restanteJugador -= DT;
      if (restanteJugador <= 0) jugador = { ...jugador, desde: null };
    } else {
      const direccion = ['arriba', 'abajo', 'izquierda', 'derecha'][Math.floor(azar() * 4)];
      const r = paso(d, jugador, direccion, ocupadasPorHabitantes(moviles));
      if (r.movio) {
        jugador = { x: r.x, y: r.y, direccion, desde: { x: jugador.x, y: jugador.y } };
        restanteJugador = 250;
      }
    }
    moviles = avanzarHabitantes(moviles, d, jugador, DT, azar);
    verificarInvariantes(d, moviles, jugador);
    alCuadro(moviles);
  }
  return moviles;
}

test('AC-6.1, AC-6.3: los habitantes se colocan en casillas libres distintas, transitables y alcanzables', () => {
  for (const estado of [crearHogarInicial(crearCtx()), hogarMasGrande()]) {
    const d = generarDistribucion(estado);
    const jugador = { ...d.aparicion };
    const alcanzables = alcanzablesDesde(d, d.aparicion);
    const moviles = colocarHabitantes(IDS, d, jugador, azarReproducible(7));
    assert.deepEqual(moviles.map((h) => h.id), IDS);
    verificarInvariantes(d, moviles, jugador);
    for (const h of moviles) {
      assert.ok(alcanzables.has(claveCasilla(h.x, h.y)), `${h.id} inalcanzable`);
      assert.deepEqual(h, movil(h.id, h.x, h.y));
    }
  }
});

test('AC-4.2: cada paso dura 500 ms (2 casillas por segundo)', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { x: d.aparicion.x, y: d.aparicion.y + 3 };
  const inicio = movil('h-1', d.aparicion.x - 2, d.aparicion.y, { tramo: 1, direccion: 'izquierda' });
  let [h] = avanzarHabitantes([inicio], d, jugador, 0, azarReproducible(1));
  assert.deepEqual([h.x, h.y, h.desde, h.progresoMs], [inicio.x - 1, inicio.y, { x: inicio.x, y: inicio.y }, MS_POR_PASO]);
  assert.equal(MS_POR_PASO, 500);
  [h] = avanzarHabitantes([h], d, jugador, 499, azarReproducible(1));
  assert.notEqual(h.desde, null);
  [h] = avanzarHabitantes([h], d, jugador, 1, azarReproducible(1));
  assert.equal(h.desde, null);
  assert.equal(h.progresoMs, 0);
});

test('AC-4.1: alterna pausas de 1 a 4 s con tramos de 1 a 6 casillas', () => {
  const d = generarDistribucion(hogarMasGrande());
  const azar = azarReproducible(11);
  const jugador = { ...d.aparicion };
  let moviles = colocarHabitantes(['h-1'], d, jugador, azar);
  const pausas = [];
  const tramos = [];
  let pasosSeguidos = 0;
  for (let t = 0; t < 120000; t += 50) {
    const antes = moviles[0];
    moviles = avanzarHabitantes(moviles, d, jugador, 50, azar);
    const h = moviles[0];
    if (h.x !== antes.x || h.y !== antes.y) pasosSeguidos++;
    if (antes.pausaMs === 0 && h.pausaMs > 0) {
      pausas.push(h.pausaMs);
      if (pasosSeguidos > 0) tramos.push(pasosSeguidos);
      pasosSeguidos = 0;
    }
  }
  assert.ok(pausas.length > 10, 'debería alternar pausas');
  assert.ok(pausas.every((p) => p >= PAUSA_MIN_MS && p <= PAUSA_MAX_MS), 'pausa fuera de rango');
  assert.ok(tramos.length > 10, 'debería caminar tramos');
  assert.ok(tramos.every((n) => n >= 1 && n <= TRAMO_MAX), 'tramo fuera de rango');
});

test('AC-4.3, AC-5.2: un habitante no entra en un mueble, en otro habitante ni en las casillas del jugador', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const { x, y } = d.aparicion;
  const casos = [
    ['jugador', { x: x - 1, y, desde: null }, 'izquierda'],
    ['origen del paso del jugador', { x: x + 1, y: y + 1, desde: { x: x + 1, y } }, 'derecha'],
    ['mueble', { x, y: y + 3, desde: null }, 'arriba'],
  ];
  for (const [motivo, jugador, direccion] of casos) {
    const [h] = avanzarHabitantes([movil('h-1', x, y, { tramo: 3, direccion })], d, jugador, 50, azarReproducible(3));
    assert.deepEqual([h.x, h.y], [x, y], motivo);
    assert.ok(h.pausaMs >= PAUSA_MIN_MS, motivo);
    assert.equal(h.tramo, 0, motivo);
  }
  const [h] = avanzarHabitantes(
    [movil('h-1', x, y, { tramo: 2, direccion: 'derecha' }), movil('h-2', x + 1, y, { pausaMs: 2000 })],
    d, { x, y: y + 3, desde: null }, 50, azarReproducible(3),
  );
  assert.deepEqual([h.x, h.y], [x, y], 'otro habitante');
});

test('AC-4.5: si dos habitantes van a la vez a la misma casilla, solo uno entra', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const { x, y } = d.aparicion;
  const a = movil('h-1', x - 1, y, { tramo: 1, direccion: 'derecha' });
  const b = movil('h-2', x + 1, y, { tramo: 1, direccion: 'izquierda' });
  const resultado = avanzarHabitantes([a, b], d, { x, y: y + 3, desde: null }, 50, azarReproducible(5));
  const enDestino = resultado.filter((h) => h.x === x && h.y === y);
  assert.equal(enDestino.length, 1);
  const otro = resultado.find((h) => h !== enDestino[0]);
  assert.ok(otro.pausaMs >= PAUSA_MIN_MS);
});

test('AC-5.4, AC-4.4, Reliability: en recorridos largos nadie comparte casilla y los habitantes cruzan puertas', () => {
  for (const [estado, semilla] of [[crearHogarInicial(crearCtx()), 21], [hogarMasGrande(), 22]]) {
    const d = generarDistribucion(estado);
    const azar = azarReproducible(semilla);
    const espaciosVisitados = new Map(IDS.map((id) => [id, new Set()]));
    simular(d, colocarHabitantes(IDS, d, d.aparicion, azar), d.aparicion, 300000, azar, (moviles) => {
      for (const h of moviles) espaciosVisitados.get(h.id).add(d.espacioEn[h.y][h.x]);
    });
    assert.ok([...espaciosVisitados.values()].some((s) => s.size >= 2), 'ningún habitante cruzó una puerta');
  }
});

test('AC-7.2: al entrar al modo edición cada habitante queda quieto en la casilla a la que se dirigía', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const { x, y } = d.aparicion;
  const [enPaso] = avanzarHabitantes([movil('h-1', x - 1, y, { tramo: 3, direccion: 'derecha' })], d, { x, y: y + 3 }, 0, azarReproducible(1));
  assert.notEqual(enPaso.desde, null);
  assert.deepEqual(congelarHabitantes([enPaso]), [movil('h-1', x, y)]);
});

test('AC-7.7, FR-7: tras un cambio en modo edición solo se reubica al habitante afectado', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  let d = generarDistribucion(e);
  const r = d.rects[d2.id];
  const enDormitorio = movil('h-1', r.x + 2, r.y + 4); // dentro de "Dormitorio 2", que se va a eliminar
  const enSala = movil('h-2', d.aparicion.x - 2, d.aparicion.y); // la sala no cambia de lugar
  const jugador = { ...d.aparicion };
  assert.ok(esTransitable(d, enDormitorio.x, enDormitorio.y));
  e = eliminarEspacio(e, d2.id, ctx);
  d = generarDistribucion(e);
  assert.equal(esTransitable(d, enDormitorio.x, enDormitorio.y), false);
  const despues = sincronizarHabitantes([enDormitorio, enSala], ['h-1', 'h-2'], d, jugador, azarReproducible(9));
  assert.deepEqual(despues.map((h) => h.id), ['h-1', 'h-2']);
  assert.deepEqual(despues[1], enSala);
  assert.notDeepEqual([despues[0].x, despues[0].y], [enDormitorio.x, enDormitorio.y]);
  verificarInvariantes(d, despues, jugador);
});

test('FR-7: al dar de alta o de baja se agregan habitantes en casillas libres y se quitan los eliminados', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const jugador = { ...d.aparicion };
  const azar = azarReproducible(4);
  const antes = colocarHabitantes(['h-1', 'h-2'], d, jugador, azar);
  const despues = sincronizarHabitantes(antes, ['h-2', 'h-3'], d, jugador, azar);
  assert.deepEqual(despues.map((h) => h.id), ['h-2', 'h-3']);
  assert.deepEqual(despues[0], antes[1]);
  verificarInvariantes(d, despues, jugador);
});

test('el movimiento es puro y reproducible con la misma semilla', () => {
  const d = generarDistribucion(hogarMasGrande());
  const inicial = colocarHabitantes(IDS, d, d.aparicion, azarReproducible(3));
  const copia = structuredClone(inicial);
  const a = simular(d, inicial, d.aparicion, 20000, azarReproducible(8));
  const b = simular(d, inicial, d.aparicion, 20000, azarReproducible(8));
  assert.deepEqual(a, b);
  assert.deepEqual(inicial, copia);
});
```

- [ ] Run: `cd poc && node --test test/posicion.test.js test/movimiento.test.js` — expect: FAIL en ambos archivos (`SyntaxError`: `../src/posicion.js` no exporta `claveCasilla`; `ERR_MODULE_NOT_FOUND` para `src/movimiento.js`)
- [ ] Reemplazar `src/posicion.js` completo por:
```js
// src/posicion.js
import { esTransitable } from './distribucion.js';

export const DIRECCIONES = { arriba: { dx: 0, dy: -1 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 }, derecha: { dx: 1, dy: 0 } };

// Clave de una casilla para los conjuntos de casillas ocupadas.
export const claveCasilla = (x, y) => `${x},${y}`;

// Convierte una casilla absoluta del mapa en una posición relativa a su espacio o pasillo (FR-10 de la 001).
export function posicionRelativa(distribucion, x, y, direccion) {
  const clave = distribucion.espacioEn[y][x];
  const r = distribucion.rects[clave];
  return { clave, dx: x - r.x, dy: y - r.y, direccion };
}

// Devuelve la casilla absoluta para una posición guardada, o la aparición de la sala si ya no es válida.
export function resolverPosicion(distribucion, guardada) {
  const enSala = { x: distribucion.aparicion.x, y: distribucion.aparicion.y, direccion: 'abajo' };
  if (!guardada) return enSala;
  const r = distribucion.rects[guardada.clave];
  if (!r || guardada.dx < 0 || guardada.dy < 0 || guardada.dx >= r.w || guardada.dy >= r.h) return enSala;
  const x = r.x + guardada.dx;
  const y = r.y + guardada.dy;
  if (!esTransitable(distribucion, x, y) || distribucion.espacioEn[y][x] !== guardada.clave) return enSala;
  return { x, y, direccion: guardada.direccion };
}

// Un paso del modo exploración (AC-2.1 y AC-2.3 de la 001). Las casillas de `ocupadas` (los habitantes) también
// bloquean el paso (FR-6 de la 002); sin ese argumento el comportamiento es el de la 001.
export function paso(distribucion, actual, direccion, ocupadas = new Set()) {
  const { dx, dy } = DIRECCIONES[direccion];
  const x = actual.x + dx;
  const y = actual.y + dy;
  if (esTransitable(distribucion, x, y) && !ocupadas.has(claveCasilla(x, y))) return { x, y, direccion, movio: true };
  return { x: actual.x, y: actual.y, direccion, movio: false };
}
```

- [ ] Crear el módulo de movimiento:
```js
// src/movimiento.js
// Movimiento autónomo de los habitantes (ADR-002 de movimiento): lógica pura; el azar se inyecta y el motor solo anima.
import { esTransitable } from './distribucion.js';
import { DIRECCIONES, claveCasilla } from './posicion.js';

export const MS_POR_PASO = 500; // 2 casillas por segundo (AC-4.2)
export const PAUSA_MIN_MS = 1000;
export const PAUSA_MAX_MS = 4000;
export const TRAMO_MIN = 1;
export const TRAMO_MAX = 6;

const ORDEN_DIRECCIONES = ['arriba', 'abajo', 'izquierda', 'derecha'];
const enteroEntre = (min, max, azar) => min + Math.floor(azar() * (max - min + 1));
const pausaAleatoria = (azar) => enteroEntre(PAUSA_MIN_MS, PAUSA_MAX_MS, azar);

// Estado de sesión de un habitante (no se guarda): (x, y) es la casilla que ocupa o a la que se dirige;
// mientras progresoMs > 0 también ocupa `desde`, la casilla de origen del paso.
const nuevoMovil = (id, x, y) => ({ id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null });

// Casillas que ocupan los habitantes: la suya y, mientras caminan, también la de origen.
export function ocupadasPorHabitantes(moviles) {
  const ocupadas = new Set();
  for (const h of moviles) {
    ocupadas.add(claveCasilla(h.x, h.y));
    if (h.desde) ocupadas.add(claveCasilla(h.desde.x, h.desde.y));
  }
  return ocupadas;
}

// Casillas del jugador: la que ocupa y, mientras da un paso, la de origen (AC-5.2).
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

// Coloca a cada habitante, quieto, en una casilla transitable libre al azar, distinta de las demás y de las del jugador (FR-7).
export function colocarHabitantes(ids, distribucion, jugador, azar) {
  const libres = casillasLibres(distribucion, ocupadasPorJugador(jugador));
  return ids.map((id) => {
    const c = tomarAlAzar(libres, azar);
    return nuevoMovil(id, c.x, c.y);
  });
}

// Al entrar al modo edición: cada habitante queda quieto en la casilla a la que se dirigía (AC-7.2).
export const congelarHabitantes = (moviles) => moviles.map((h) => nuevoMovil(h.id, h.x, h.y));

// Tras un cambio del modo edición (FR-7): conserva a los que siguen, quita a los eliminados, coloca a los nuevos
// en casillas libres al azar y reubica solo a los que quedaron en una casilla inválida u ocupada.
export function sincronizarHabitantes(moviles, ids, distribucion, jugador, azar) {
  const ocupadas = ocupadasPorJugador(jugador);
  const conservados = new Map();
  for (const h of moviles) {
    if (!ids.includes(h.id)) continue;
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

// Avanza `dtMs` milisegundos el movimiento de todos los habitantes (FR-5, FR-6). Pura: devuelve un arreglo nuevo.
// Se procesan en orden con un único conjunto de ocupadas, así dos habitantes nunca eligen la misma casilla (AC-4.5).
export function avanzarHabitantes(moviles, distribucion, jugador, dtMs, azar) {
  const ocupadas = new Set([...ocupadasPorHabitantes(moviles), ...ocupadasPorJugador(jugador)]);
  const libre = (x, y) => esTransitable(distribucion, x, y) && !ocupadas.has(claveCasilla(x, y));
  return moviles.map((h) => {
    if (h.progresoMs > 0) {
      const progresoMs = Math.max(0, h.progresoMs - dtMs);
      if (progresoMs > 0) return { ...h, progresoMs };
      ocupadas.delete(claveCasilla(h.desde.x, h.desde.y)); // llegó: libera la casilla de origen
      return { ...h, progresoMs: 0, desde: null };
    }
    if (h.pausaMs > 0) return { ...h, pausaMs: Math.max(0, h.pausaMs - dtMs) };
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
    ocupadas.add(claveCasilla(x, y));
    const restante = tramo - 1;
    return {
      ...h, x, y, desde: { x: h.x, y: h.y }, progresoMs: MS_POR_PASO,
      tramo: restante, direccion: restante > 0 ? direccion : null, pausaMs: restante > 0 ? 0 : pausaAleatoria(azar),
    };
  });
}
```

- [ ] Run: `cd poc && node --test test/posicion.test.js test/movimiento.test.js` — expect: PASS (`# pass 16`, `# fail 0`: 6 de posición y 10 de movimiento)
- [ ] Run: `cd poc && npm test` — expect: PASS (`# pass 89`, `# fail 0`; incluye ahora las pruebas de contrato de la Fase 0)
- [ ] Commit: `feat(poc): add pure autonomous movement and mutual blocking` (cuerpo: `Plan section: Phase 3: Movimiento autónomo y bloqueo mutuo`)

---

## Phase 4: Presentación: habitantes en el mapa y en el modo edición

**Implements:** FR-4 (interfaz), FR-5, FR-6 y FR-7 (cableado), FR-8 | **Satisfies:** AC-1.1, AC-1.2, AC-1.5, AC-2.1, AC-2.2, AC-4.7, AC-4.8, AC-6.1, AC-6.2, AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5, AC-7.6, AC-7.7, AC-7.8, AC-8.1, AC-8.2, AC-9.2, y la parte visible de los AC de las Stories 1 a 8
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: todo lo producido en las Fases 1 a 3 (nombres exactos en sus líneas Interfaces) y el global `Phaser` (3.80.1). Produces: la aplicación con habitantes; ningún contrato nuevo.

Capa de presentación delgada: toda regla vive en los módulos puros. `juego.js` mantiene `moviles` (estado de sesión), lo avanza en cada cuadro solo en exploración, lo congela al entrar a edición, lo sincroniza tras cada cambio y lo recoloca al tocar "Listo".

> **Complexity note:** Gate: Integration-First (pruebas antes del código). Violation: la capa de presentación no tiene pruebas automáticas, igual que la Fase 4 de la 001. Justification: depende del motor de la PoC, que es desechable; las reglas de la spec quedaron en módulos puros probados en las Fases 1 a 3, y esta capa se verifica con la comprobación estática de este paso y con la lista manual de la Fase 5.

Verificación previa (falla esperada): `cd poc && grep -n "movimiento.js\|ficha-parentesco\|id=\"habitantes\"" src/juego.js index.html` no encuentra nada.

- [ ] En `index.html`, agregar dentro de `<style>`, después de la regla `.fila .cuenta { ... }`:
```css
    .fila.habitante { grid-template-columns: 1fr auto 36px; }
    .subtitulo { display: block; margin: 12px 0 4px; }
    #ficha select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
```

- [ ] En `index.html`, reemplazar la sección `#panel` y el bloque `#ficha` completos por:
```html
  <section id="panel">
    <header><strong>Espacios</strong><button id="listo">Listo</button></header>
    <div id="contadores"></div>
    <strong class="subtitulo">Habitantes</strong>
    <div id="habitantes"></div>
  </section>
  <div id="ficha">
    <form>
      <strong id="ficha-titulo"></strong>
      <input id="ficha-nombre" maxlength="20" autocomplete="off">
      <select id="ficha-parentesco" aria-label="Parentesco"></select>
      <select id="ficha-genero" aria-label="Género"></select>
      <select id="ficha-especie" aria-label="Especie"></select>
      <div class="error" id="ficha-error"></div>
      <div class="acciones">
        <button type="button" class="peligro" id="ficha-eliminar">Eliminar</button>
        <button type="button" id="ficha-cancelar">Cancelar</button>
        <button type="submit" id="ficha-guardar">Renombrar</button>
      </div>
    </form>
  </div>
```

- [ ] En `src/juego.js`, reemplazar el bloque de imports (todas las líneas `import`) por:
```js
import { TIPOS, ETIQUETAS, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES } from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';
import {
  MS_POR_PASO, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes, congelarHabitantes, ocupadasPorHabitantes,
} from './movimiento.js';
```

- [ ] En `src/juego.js`, agregar después de la constante `ESTILO_ETIQUETA`:
```js
// Aspecto de los habitantes (FR-8), arte de marcador: personas de 12×14 según su género, mascotas de 8×8 según su especie.
const COLOR_FAMILIAR = { femenino: 0xe8833a, masculino: 0x3a7bd5, otro: 0x8e6bbf };
const COLOR_MASCOTA = { perro: 0x9c6b3c, gato: 0x7d7d7d, otro: 0x4f9d69 };
const COLOR_BORDE_HABITANTE = 0x2a221c;
```

- [ ] En `src/juego.js`, agregar después de la línea `let ultimaRegeneracionMs = 0;`:
```js
let jugadorDesde = null; // casilla de origen mientras el jugador da un paso: también bloquea a los habitantes (AC-5.2)
const azar = Math.random; // el movimiento recibe el azar inyectado (ADR-002 de movimiento)
function idsHabitantes() { return habitantes(estado).map((h) => h.id); }
function propietario() { return estado.miembros.find((m) => m.eliminadoEn === null && esPropietario(estado, m)); }
const casillaJugador = () => ({ x: jugador.x, y: jugador.y, desde: jugadorDesde });
let moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7: al abrir, después del jugador
```

- [ ] En la clase `Escena`, reemplazar `create()` completo por:
```js
  create() {
    this.mapa = this.add.graphics();
    this.etiquetas = new Map(); // clave de espacio → objeto de texto de su etiqueta (solo visuales, nunca interactivas)
    this.sprites = new Map(); // id de habitante → { cuerpo, etiqueta } (FR-8; nunca interactivos)
    this.personaje = this.add.container(0, 0, [
      this.add.rectangle(0, 0, 12, 14, 0xd4537e).setStrokeStyle(1, 0x4b1528),
      this.add.triangle(0, 5, 0, 0, 6, 0, 3, 4, 0x4b1528),
    ]).setDepth(PROF_PERSONAJE);
    this.etiquetaPersonaje = this.add.text(0, 0, '', ESTILO_ETIQUETA).setOrigin(0.5, 1).setDepth(PROF_ETIQUETA_PERSONAJE);
    this.teclas = this.input.keyboard.createCursorKeys();
    this.input.on('pointerup', (p) => { if (modo === 'edicion') tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE)); });
    this.scale.on('resize', () => (modo === 'edicion' ? this.encuadrarHogar() : null));
    this.redibujar();
    this.colocarPersonaje();
    this.seguirPersonaje();
  }
```

- [ ] En la clase `Escena`, reemplazar `dibujarEtiquetas()` completo y agregar a continuación `sincronizarSprites()` y `moverHabitantes(dtMs)`:
```js
  // Etiquetas de nombre (FR-12 de la 001, FR-8 de la 002): una por espacio, la del personaje y las de los habitantes.
  dibujarEtiquetas() {
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas.clear();
    const escala = 1 / this.cameras.main.zoom; // contrarresta el zoom de la cámara: tamaño constante en pantalla
    for (const e of etiquetasDeEspacios(estado, distribucion, null, null)) {
      const texto = this.add.text(e.x * TILE, e.y * TILE, e.texto, ESTILO_ETIQUETA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.etiquetas.set(e.clave, texto);
    }
    this.etiquetaPersonaje.setText(propietario().nombre).setScale(escala);
    this.sincronizarSprites();
  }

  // Cuerpos y nombres de los habitantes (FR-8): se rehacen desde `moviles` al redibujar o cambiar el zoom.
  sincronizarSprites() {
    for (const s of this.sprites.values()) {
      this.tweens.killTweensOf(s.cuerpo);
      s.cuerpo.destroy();
      s.etiqueta.destroy();
    }
    this.sprites.clear();
    const escala = 1 / this.cameras.main.zoom;
    for (const h of moviles) {
      const miembro = buscarMiembro(estado, h.id);
      const cuerpo = miembro.tipo === 'mascota'
        ? this.add.rectangle(0, 0, 8, 8, COLOR_MASCOTA[miembro.especie])
        : this.add.rectangle(0, 0, 12, 14, COLOR_FAMILIAR[miembro.genero ?? 'otro']);
      cuerpo.setStrokeStyle(1, COLOR_BORDE_HABITANTE).setDepth(PROF_PERSONAJE)
        .setPosition(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2);
      const etiqueta = this.add.text(cuerpo.x, cuerpo.y - TILE * 0.6, miembro.nombre, ESTILO_ETIQUETA)
        .setOrigin(0.5, 1).setScale(escala).setDepth(PROF_ETIQUETA_PERSONAJE);
      this.sprites.set(h.id, { cuerpo, etiqueta });
    }
  }

  // Por cuadro, solo en exploración: avanza el movimiento autónomo (FR-5) y anima cada paso nuevo durante MS_POR_PASO.
  moverHabitantes(dtMs) {
    if (modo !== 'exploracion') return;
    const antes = new Map(moviles.map((h) => [h.id, h]));
    moviles = avanzarHabitantes(moviles, distribucion, casillaJugador(), dtMs, azar);
    for (const h of moviles) {
      const previo = antes.get(h.id);
      const s = this.sprites.get(h.id);
      if (!s || (previo.x === h.x && previo.y === h.y)) continue;
      this.tweens.add({ targets: s.cuerpo, x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2, duration: MS_POR_PASO, ease: 'Linear' });
    }
  }
```

- [ ] En la clase `Escena`, reemplazar `actualizarEtiquetas()` completo por:
```js
  // Por cuadro: los nombres siguen a sus personajes; en exploración, la etiqueta del espacio actual se desplaza a la parte visible.
  actualizarEtiquetas() {
    this.etiquetaPersonaje.setPosition(this.personaje.x, this.personaje.y - TILE * 0.75);
    for (const s of this.sprites.values()) s.etiqueta.setPosition(s.cuerpo.x, s.cuerpo.y - TILE * 0.6);
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
  }
```

- [ ] En la clase `Escena`, reemplazar `mover(direccion)` y `update()` completos por:
```js
  mover(direccion) {
    if (moviendo || modo !== 'exploracion') return;
    const r = paso(distribucion, jugador, direccion, ocupadasPorHabitantes(moviles)); // los habitantes son obstáculos (FR-6)
    const origen = { x: jugador.x, y: jugador.y };
    jugador = { x: r.x, y: r.y, direccion: r.direccion };
    posicionSinGuardar = true;
    if (!r.movio) { this.colocarPersonaje(); return; }
    moviendo = true;
    jugadorDesde = origen;
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[direccion]);
    this.tweens.add({
      targets: this.personaje, x: r.x * TILE + TILE / 2, y: r.y * TILE + TILE / 2, duration: MS_POR_CASILLA, ease: 'Linear',
      onComplete: () => { moviendo = false; jugadorDesde = null; },
    });
  }

  update(_tiempo, deltaMs) {
    const dir = this.direccionActual();
    if (dir) this.mover(dir);
    this.moverHabitantes(deltaMs);
    this.actualizarEtiquetas();
    if (!dir && !moviendo && posicionSinGuardar && modo === 'exploracion') guardarPosicion(); // en reposo tras caminar (FR-10)
    $('depuracion').textContent = `${Math.round(this.game.loop.actualFps)} fps · regen ${ultimaRegeneracionMs.toFixed(1)} ms`;
  }
```

- [ ] Reemplazar los manejadores de `editar` y `listo` y la función `aplicar` completos por:
```js
$('editar').addEventListener('click', () => {
  if (moviendo) return;
  guardarPosicion();
  modo = 'edicion';
  moviles = congelarHabitantes(moviles); // quietos en la casilla a la que se dirigían (AC-7.2)
  mostrarExploracion(false);
  pintarPanel();
  escena().encuadrarHogar();
});

$('listo').addEventListener('click', () => {
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
  moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10 de la 001, AC-9.2)
  s.colocarPersonaje();
  s.encuadrarHogar();
  pintarPanel();
}
```

- [ ] Reemplazar `pintarPanel()` completo por esta versión y la nueva `pintarHabitantes()`:
```js
function pintarPanel() {
  const cont = $('contadores');
  cont.replaceChildren();
  for (const tipo of TIPOS) {
    const fila = document.createElement('div');
    fila.className = 'fila';
    const destino = tipo === 'bano' ? siguienteDestinoBano(estado) : null;
    const pista = tipo === 'bano' && destino ? `<small>Siguiente: ${nombreVisible(estado, destino)}</small>` : '';
    fila.innerHTML = `<span>${ETIQUETAS[tipo]}${pista}</span><button aria-label="Quitar">−</button>`
      + `<span class="cuenta">${contar(estado, tipo)}</span><button aria-label="Agregar">+</button>`;
    const [menos, mas] = fila.querySelectorAll('button');
    menos.disabled = !puedeQuitar(estado, tipo);
    mas.disabled = !puedeAgregar(estado, tipo);
    menos.addEventListener('click', () => {
      const objetivo = ultimoDeTipo(estado, tipo);
      if (objetivo && confirmarEliminacion(objetivo.id)) aplicar(quitarUltimo(estado, tipo, ctx));
    });
    mas.addEventListener('click', () => aplicar(agregarEspacio(estado, tipo, ctx)));
    cont.append(fila);
  }
  pintarHabitantes();
}

// Sección "Habitantes" del panel (FR-4, AC-7.1): contador "n de límite" y botón "+" por clase.
function pintarHabitantes() {
  const cont = $('habitantes');
  cont.replaceChildren();
  for (const [clase, titulo] of [['familiar', 'Familiares'], ['mascota', 'Mascotas']]) {
    const fila = document.createElement('div');
    fila.className = 'fila habitante';
    fila.innerHTML = `<span>${titulo}</span><span class="cuenta">${contarHabitantes(estado, clase)} de ${LIMITES_HABITANTES[clase]}</span>`
      + `<button aria-label="Agregar ${clase}">+</button>`;
    const mas = fila.querySelector('button');
    mas.disabled = !puedeAgregarHabitante(estado, clase);
    mas.addEventListener('click', () => abrirFichaHabitante(clase, null));
    cont.append(fila);
  }
}
```

- [ ] Reemplazar todo el bloque desde `// ---------- Fichas ----------` hasta la línea anterior a `// ---------- Ciclo de vida ----------` por:
```js
// ---------- Fichas ----------
let fichaActual = null; // { tipo: 'espacio' | 'propietario' | 'habitante', id, clase? }

function llenarSelect(select, lista, valor) {
  select.replaceChildren(new Option('Elegir…', ''), ...Object.entries(lista).map(([clave, texto]) => new Option(texto, clave)));
  select.value = valor ?? '';
}

function mostrarCampos({ parentesco = false, genero = false, especie = false }) {
  $('ficha-parentesco').style.display = parentesco ? 'block' : 'none';
  $('ficha-genero').style.display = genero ? 'block' : 'none';
  $('ficha-especie').style.display = especie ? 'block' : 'none';
}

// En la ficha de un habitante, guardar se activa solo con nombre y todos sus datos elegidos (AC-1.3, AC-2.3).
function actualizarGuardar() {
  if (fichaActual?.tipo !== 'habitante') { $('ficha-guardar').disabled = false; return; }
  const datosElegidos = fichaActual.clase === 'familiar'
    ? $('ficha-parentesco').value !== '' && $('ficha-genero').value !== ''
    : $('ficha-especie').value !== '';
  $('ficha-guardar').disabled = $('ficha-nombre').value.trim() === '' || !datosElegidos;
}

// Ficha de un espacio o del personaje del propietario (como en la 001: solo renombrar; Eliminar solo en espacios).
function abrirFicha(tipo, id) {
  fichaActual = { tipo, id };
  const esEspacio = tipo === 'espacio';
  const espacio = esEspacio ? buscarEspacio(estado, id) : null;
  const miembro = esEspacio ? null : buscarMiembro(estado, id);
  $('ficha-titulo').textContent = esEspacio ? nombreVisible(estado, espacio) : miembro.nombre;
  $('ficha-nombre').value = esEspacio ? (espacio.nombrePersonalizado ?? '') : miembro.nombre;
  $('ficha-nombre').placeholder = esEspacio ? nombreAutomatico(estado, espacio) : 'Nombre del personaje';
  mostrarCampos({});
  $('ficha-guardar').textContent = 'Renombrar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = esEspacio ? 'block' : 'none';
  $('ficha-eliminar').disabled = !esEspacio || !puedeEliminar(estado, id);
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

// Ficha de un habitante (FR-4): alta si `id` es null; edición si no. Familiar: nombre, parentesco y género; mascota: nombre y especie.
function abrirFichaHabitante(clase, id) {
  fichaActual = { tipo: 'habitante', id, clase };
  const miembro = id ? buscarMiembro(estado, id) : null;
  const familiar = clase === 'familiar';
  $('ficha-titulo').textContent = miembro ? miembro.nombre : (familiar ? 'Nuevo familiar' : 'Nueva mascota');
  $('ficha-nombre').value = miembro?.nombre ?? '';
  $('ficha-nombre').placeholder = familiar ? 'Nombre del familiar' : 'Nombre de la mascota';
  llenarSelect($('ficha-parentesco'), PARENTESCOS, miembro?.parentesco);
  llenarSelect($('ficha-genero'), GENEROS, miembro?.genero);
  llenarSelect($('ficha-especie'), ESPECIES, miembro?.especie);
  mostrarCampos(familiar ? { parentesco: true, genero: true } : { especie: true });
  $('ficha-guardar').textContent = 'Guardar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = miembro ? 'block' : 'none';
  $('ficha-eliminar').disabled = !miembro;
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

const cerrarFicha = () => { $('ficha').style.display = 'none'; fichaActual = null; };

// Prioridad al tocar una casilla (FR-4): personaje del propietario, luego habitante, luego espacio (AC-7.3, AC-7.4).
function tocarMapa(x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  if (x === jugador.x && y === jugador.y) { abrirFicha('propietario', propietario().id); return; }
  const habitante = moviles.find((h) => h.x === x && h.y === y);
  if (habitante) {
    const miembro = buscarMiembro(estado, habitante.id);
    abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
    return;
  }
  const clave = distribucion.espacioEn[y][x];
  if (clave && buscarEspacio(estado, clave)) abrirFicha('espacio', clave);
}

$('ficha').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const { tipo, id, clase } = fichaActual;
  const texto = $('ficha-nombre').value;
  let r;
  if (tipo === 'espacio') r = renombrarEspacio(estado, id, texto, ctx);
  else if (tipo === 'propietario') r = renombrarMiembro(estado, id, texto, ctx);
  else {
    const datos = { nombre: texto, parentesco: $('ficha-parentesco').value, genero: $('ficha-genero').value, especie: $('ficha-especie').value };
    r = id ? editarHabitante(estado, id, datos, ctx) : agregarHabitante(estado, clase, datos, ctx);
  }
  if (!r.ok) { $('ficha-error').textContent = MENSAJES_ERROR[r.error]; return; }
  cerrarFicha();
  aplicar(r.estado);
});
$('ficha-nombre').addEventListener('input', () => { $('ficha-error').textContent = ''; actualizarGuardar(); });
for (const campo of ['ficha-parentesco', 'ficha-genero', 'ficha-especie']) $(campo).addEventListener('change', actualizarGuardar);
$('ficha-cancelar').addEventListener('click', cerrarFicha);
$('ficha-eliminar').addEventListener('click', () => {
  const { tipo, id } = fichaActual;
  if (tipo === 'habitante') {
    if (!window.confirm(`¿Eliminar a "${buscarMiembro(estado, id).nombre}"?`)) return; // AC-8.1, AC-8.2
    cerrarFicha();
    aplicar(eliminarHabitante(estado, id, ctx));
    return;
  }
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});
```

- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 89`, `# fail 0`
- [ ] Comprobación estática (script desechable con `node -e`, sin commitear): cada nombre que `juego.js` importa existe en su módulo, y cada `$('id')` usado en `juego.js` existe como `id=` en `index.html` — expect: 0 faltantes
- [ ] Run: servir `poc/` con `python3 -m http.server 8080 --bind 127.0.0.1` y abrir `http://localhost:8080` con un viewport de teléfono — expect: en "Editar" aparece la sección Habitantes; "+" abre la ficha con "Guardar" desactivado; tras guardar un familiar y una mascota aparecen con su nombre; al tocar "Listo" caminan; el jugador no puede pisarlos; tocar a un habitante en edición abre su ficha; eliminar pide confirmación; al recargar siguen ahí
- [ ] Commit: `feat(poc): show and manage family members and pets on the map` (cuerpo: `Plan section: Phase 4: Presentación: habitantes en el mapa y en el modo edición`)

---

## Phase 5: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: `# pass 89`, `# fail 0`
- [ ] Servir en la red local (`python3 -m http.server 8080 --bind 0.0.0.0` desde `poc/`) y abrir `http://<IP-del-computador>:8080` en el Android (misma Wi-Fi, con internet para cargar Phaser); al terminar, parar el servidor.
- [ ] Verificar manualmente en el Android, marcando cada uno:
  - [ ] AC-1.1 a AC-1.5 y AC-2.1 a AC-2.4: altas de familiares y mascotas, listas sin preselección, "Guardar" desactivado hasta completar, límites 8 y 4, cancelar sin cambios.
  - [ ] AC-3.1 a AC-3.5: nombres con espacios, repetidos (también contra el propietario), 21 caracteres y vacíos.
  - [ ] AC-4.1 a AC-4.8: pausas y tramos, 2 casillas por segundo con cronómetro (≈ 4 casillas en 2 s), cruce de puertas, aspecto distinto por género y especie, mascotas más pequeñas, nombres encima.
  - [ ] AC-5.1 a AC-5.4: el jugador no pisa a ningún habitante; en una puerta ocupada espera y luego pasa; nunca hay dos personajes en una casilla.
  - [ ] AC-6.1 a AC-6.3: al abrir la app y al tocar "Listo", todos aparecen en casillas libres y empiezan a caminar.
  - [ ] AC-7.1 a AC-7.8: sección Habitantes, habitantes quietos en edición, prioridad al tocar (personaje → habitante → espacio), fichas de familiar y de mascota, ficha del propietario solo con Renombrar, reubicación tras quitar un espacio.
  - [ ] AC-8.1 a AC-8.4: eliminar con confirmación; cancelar no cambia nada.
  - [ ] AC-9.1 a AC-9.5: cerrar y reabrir; abrir con datos guardados por la versión anterior (sin habitantes) sin aviso; AC-9.5 y AC-10.x quedan cubiertos por pruebas automáticas.
- [ ] Medir rendimiento con el indicador de depuración: con 8 familiares y 4 mascotas, caminando 30 s, los fps se mantienen en 60 o más; en 20 cambios seguidos de modo edición, `regen` < 100 ms en todos. Anotar el modelo de teléfono y los resultados en `docs/specs/002-familiares-y-mascotas/verification.md`.
- [ ] Commit: `docs(002-familiares-y-mascotas): record integration verification` (cuerpo: `Plan section: Phase 5: Integration Verification`)

---

## Quickstart Validation

1. `cd poc && npm test` → `# pass 89`, `# fail 0`.
2. Servir `poc/` y abrir `http://localhost:8080`: aparece el hogar con el personaje en la sala.
3. **Editar** → en Habitantes, "+" de Familiares → nombre "Diana", parentesco "Pareja", género "Femenino" → **Guardar**: aparece en el mapa con su nombre.
4. "+" de Mascotas → nombre "Firulais", especie "Perro" → **Guardar**: aparece más pequeña, con su nombre.
5. **Listo**: ambos aparecen en casillas libres y caminan solos; el personaje no puede pisarlos.
6. **Editar** → tocar a Diana → cambiar el género a "Otro" → **Guardar**: cambia su aspecto. Tocar a Firulais → **Eliminar** → confirmar.
7. **Listo**, recargar la página: Diana sigue con sus datos; Firulais ya no está.
