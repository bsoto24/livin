# Implementation Plan: Mapa y editor del hogar

**Spec:** docs/specs/001-mapa-editor-hogar/spec.md (v1.1.0; las Fases 0 a 5 implementan la v1.0.0 y la Fase 6 se agregó en la v1.1.0)
**Decisions:** docs/adr/001-generador-distribucion-piezas-reglas.md, docs/adr/001-modelo-datos-local-first-multiusuario.md
**Created:** 2026-10-04

## Global Constraints

- El movimiento del personaje se mantiene a 60 cuadros por segundo en cualquier teléfono Android lanzado desde octubre de 2023.
- Tras cada cambio en modo edición (contador, eliminación o renombre), el mapa actualizado se muestra en menos de 100 ms.
- Caminata continua a 4 casillas por segundo (250 ms por casilla).
- Todo nombre tiene como máximo 20 caracteres; se recortan espacios al inicio y al final.
- Límites por tipo: sala 1–1, comedor 0–1, cocina 1–2, lavandería 0–2, espacio de mascota 0–2, dormitorio 1–4, oficina 0–2, baño 1–(1 + dormitorios + oficinas).
- Ningún espacio se crea, elimina ni modifica como efecto secundario de otra acción, salvo el baño interno de un cuarto eliminado (FR-4).
- Ningún dato sale del dispositivo. No hay autenticación.
- Orientación vertical.
- PoC desechable en web con Phaser 3 (pinned 3.80.1, cargado desde cdnjs). Sin dependencias npm: pruebas con el runner integrado de Node (`node:test`, Node ≥ 20).
- Arte de marcador original (rectángulos de color); sin recursos de terceros con copyright.
- El modelo, el generador y la lógica de posición no importan Phaser ni el DOM (ADR del generador: capas portables).
- *(v1.1.0)* Las etiquetas de nombre del mapa (FR-12) se calculan en una función pura, sin Phaser ni DOM; la capa de presentación solo las dibuja.

**Pre-implementation gates:**
- *Simplicity:* 3 componentes: dominio (`catalogo.js`, `hogar.js`, `almacen.js`), generador (`distribucion.js`, `posicion.js`) y presentación (`juego.js`, `index.html`). Una sola dependencia externa (Phaser, decidida en el PRD). ✓
- *Anti-Abstraction:* un único modelo canónico (objetos planos del estado guardado, sin DTO ni view models); Phaser y el DOM se usan directamente, sin envoltorios. ✓
- *Integration-First:* los contratos de los módulos (funciones exportadas y forma de la distribución) se fijan con pruebas en la Fase 0, antes de cualquier implementación. ✓

---

## Goal

Una PoC web, jugable en el navegador de un Android, donde el usuario recorre su hogar con cruceta y lo reconfigura en modo edición, con todo el dominio y el generador cubiertos por 40 pruebas automáticas (incluida la verificación exhaustiva de 7.560 mapas).

Estructura de archivos (bajo `poc/`):

| Archivo | Responsabilidad única |
|---|---|
| `package.json` | Scripts `test` y `start`; módulos ES |
| `src/catalogo.js` | Tipos de espacio, etiquetas, límites, zonas y piezas dibujadas (datos) |
| `src/hogar.js` | Estado del hogar y sus operaciones puras (crear, agregar, quitar, eliminar, renombrar, consultas) |
| `src/distribucion.js` | Generador puro: estado → cuadrícula, espacios por casilla, puertas, pasillos, aparición |
| `src/posicion.js` | Posición relativa del personaje y paso de movimiento |
| `src/etiquetas.js` | *(v1.1.0)* Cálculo puro de las etiquetas de nombre de los espacios sobre el mapa |
| `src/almacen.js` | Persistencia local y arranque de sesión |
| `src/juego.js` | Escena Phaser, cruceta, modo edición, fichas y avisos |
| `index.html` | Estructura de la página, estilos y carga de scripts |
| `test/*.test.js` | Pruebas por módulo; `test/ayuda.js` con utilidades deterministas |

---

## Phase 0: Contracts and Tests First

**Implements:** FR-3 (contrato de salida), FR-1/FR-10/FR-11 (contrato de funciones) | **Satisfies:** — (fija contratos; los AC se satisfacen en fases siguientes)
**Files:** `poc/package.json`, `poc/test/ayuda.js`, `poc/test/contrato.test.js`
**Interfaces:** Consumes: nothing. Produces: `crearCtx()` → `{ cuentaId, nuevoId(), ahora() }` determinista; `almacenEnMemoria(inicial)` → objeto con `getItem`, `setItem`, `datos`; contrato de nombres exportados por `src/hogar.js`, `src/distribucion.js`, `src/posicion.js`, `src/almacen.js`, y forma de `generarDistribucion(estado)` → `{ ancho, alto, tiles: string[], espacioEn: (string|null)[][], rects: Record<clave, {x,y,w,h}>, puertas: {x,y}[], pasillos: {lado,x,y,w,h}[], aparicion: {x,y} }`.

Fija la forma pública de cada módulo antes de implementarlos, para que las fases siguientes (y cualquier port futuro al stack oficial) respeten el mismo contrato.

- [ ] Crear `poc/package.json`:
```json
{
  "name": "livin-poc-mapa-hogar",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"test/*.test.js\"",
    "start": "npx --yes serve -l 8080 ."
  }
}
```

- [ ] Crear las utilidades de prueba:
```js
// test/ayuda.js
// Contexto determinista para las pruebas: ids y fechas predecibles.
export function crearCtx() {
  let id = 0;
  let tick = 0;
  return {
    cuentaId: 'cuenta-1',
    nuevoId: () => `id-${++id}`,
    ahora: () => new Date(Date.UTC(2026, 9, 4, 0, 0, tick++)).toISOString(),
  };
}

export function almacenEnMemoria(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)); },
    datos,
  };
}
```

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as hogar from '../src/hogar.js';
import * as distribucion from '../src/distribucion.js';
import * as posicion from '../src/posicion.js';
import * as almacen from '../src/almacen.js';
import { crearCtx } from './ayuda.js';

test('contrato del modelo: funciones exportadas', () => {
  for (const f of ['crearHogarInicial', 'espaciosActivos', 'espaciosDeTipo', 'contar', 'limites', 'puedeAgregar',
    'puedeQuitar', 'puedeEliminar', 'agregarEspacio', 'quitarUltimo', 'ultimoDeTipo', 'eliminarEspacio',
    'consecuenciasDeEliminar', 'requiereConfirmacion', 'siguienteDestinoBano', 'nombreVisible',
    'renombrarEspacio', 'renombrarMiembro']) {
    assert.equal(typeof hogar[f], 'function', f);
  }
});

test('contrato del generador: forma de la distribución', () => {
  const d = distribucion.generarDistribucion(hogar.crearHogarInicial(crearCtx()));
  assert.equal(typeof d.ancho, 'number');
  assert.equal(typeof d.alto, 'number');
  assert.equal(d.tiles.length, d.alto);
  assert.ok(d.tiles.every((fila) => fila.length === d.ancho));
  assert.equal(d.espacioEn.length, d.alto);
  assert.ok(Array.isArray(d.puertas) && Array.isArray(d.pasillos));
  assert.deepEqual(Object.keys(d.aparicion).sort(), ['x', 'y']);
  assert.equal(typeof d.rects, 'object');
});

test('contrato de posición y almacén: funciones exportadas', () => {
  for (const f of ['posicionRelativa', 'resolverPosicion', 'paso']) assert.equal(typeof posicion[f], 'function', f);
  for (const f of ['crearAlmacen', 'iniciarSesion']) assert.equal(typeof almacen[f], 'function', f);
});
```

- [ ] Run: `cd poc && node --test test/contrato.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND`: los módulos aún no existen)
- [ ] Commit: `test: add module contract tests for map and home editor`

---

## Phase 1: Catálogo y modelo de dominio

**Implements:** FR-1 (creación del estado), FR-2, FR-4, FR-8, FR-9, FR-11, Stories 1, 3, 4, 5, 6, 8 (lógica) | **Satisfies:** AC-1.1, AC-1.2, AC-3.2, AC-3.3, AC-3.4, AC-3.7, AC-4.1 (asignación), AC-4.2, AC-4.3, AC-4.4, AC-4.5, AC-4.6, AC-4.7, AC-4.8, AC-4.9 (sin cambios hasta confirmar), AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6, AC-6.7, AC-8.1, AC-8.2, AC-8.3, AC-8.4
**Files:** `poc/src/catalogo.js`, `poc/src/hogar.js`, `poc/test/hogar.test.js`
**Interfaces:** Consumes: `crearCtx()` (Fase 0). Produces: desde `catalogo.js`: `TIPOS`, `ETIQUETAS`, `LIMITES`, `ZONA_SERVICIO`, `ZONA_PRIVADA`, `ADMITE_BANO`, `TRANSITABLE`, `PIEZAS`, `CENTRO`, `ANCHO_PASILLO`, `FILA_PUERTA_PASILLO`. Desde `hogar.js` (todas puras, `ctx = { cuentaId, nuevoId(), ahora() }`): `crearHogarInicial(ctx)`, `espaciosActivos(estado)`, `miembrosActivos(estado)`, `buscarEspacio(estado, id)`, `espaciosDeTipo(estado, tipo)`, `banoComun(estado)`, `banosInternos(estado)`, `cuartosEnOrden(estado)`, `banoDe(estado, cuartoId)`, `siguienteDestinoBano(estado, excluirId?)`, `contar(estado, tipo)`, `limites(estado, tipo)`, `puedeAgregar(estado, tipo)`, `puedeQuitar(estado, tipo)`, `puedeEliminar(estado, id)`, `nombreAutomatico(estado, espacio)`, `nombreVisible(estado, espacio)`, `agregarEspacio(estado, tipo, ctx)`, `consecuenciasDeEliminar(estado, id)` → `{ tieneNombrePersonalizado, banoSeElimina, banoSeMueve }`, `requiereConfirmacion(estado, id)`, `eliminarEspacio(estado, id, ctx)`, `quitarUltimo(estado, tipo, ctx)`, `ultimoDeTipo(estado, tipo)`, `renombrarEspacio(estado, id, texto, ctx)` y `renombrarMiembro(estado, id, texto, ctx)` → `{ ok, estado, error? }` con `error ∈ 'vacio' | 'largo' | 'duplicado' | 'formato-automatico'`, `MENSAJES_ERROR`.

Implementa todas las reglas del hogar como funciones puras sobre un estado de objetos planos (modelo del ADR de datos). La confirmación (AC-4.9, AC-5.3) se decide aquí con `requiereConfirmacion`; el diálogo se implementa en la Fase 4.

- [ ] Escribir las pruebas del modelo:
```js
// test/hogar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  crearHogarInicial, espaciosDeTipo, espaciosActivos, contar, puedeAgregar, puedeQuitar, puedeEliminar,
  agregarEspacio, quitarUltimo, eliminarEspacio, requiereConfirmacion, siguienteDestinoBano, banoDe,
  nombreVisible, renombrarEspacio, renombrarMiembro, buscarEspacio,
} from '../src/hogar.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const nombres = (estado, tipo) => espaciosDeTipo(estado, tipo).map((e) => nombreVisible(estado, e));

test('AC-1.1, AC-1.2, AC-8.4: hogar inicial', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  assert.deepEqual(['sala', 'cocina', 'bano', 'dormitorio', 'comedor', 'oficina'].map((t) => contar(e, t)), [1, 1, 1, 1, 0, 0]);
  assert.equal(e.hogares[0].nombre, 'Mi hogar');
  assert.equal(e.miembros.length, 1);
  assert.equal(e.miembros[0].nombre, 'Personaje 1');
  assert.equal(e.miembros[0].cuentaId, e.cuentas[0].id);
  assert.deepEqual(e.membresias.map((m) => [m.cuentaId, m.hogarId, m.rol]), [[e.cuentas[0].id, e.hogares[0].id, 'propietario']]);
});

test('AC-3.2: + agrega al final del tipo', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  assert.deepEqual(nombres(e, 'dormitorio'), ['Dormitorio 1', 'Dormitorio 2']);
});

test('AC-3.3, AC-3.4: límites desactivan + y −', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  assert.equal(puedeQuitar(e, 'cocina'), false);
  assert.equal(puedeAgregar(e, 'sala'), false);
  assert.equal(puedeQuitar(e, 'sala'), false);
  e = agregar(e, ctx, 'dormitorio', 'dormitorio', 'dormitorio');
  assert.equal(puedeAgregar(e, 'dormitorio'), false);
  const intento = agregarEspacio(e, 'dormitorio', ctx);
  assert.equal(contar(intento, 'dormitorio'), 4);
});

test('AC-3.7: − quita el último y no toca otros espacios', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'lavanderia');
  const idsAntes = espaciosActivos(e).map((x) => x.id);
  const ultimo = espaciosDeTipo(e, 'dormitorio')[2].id;
  const despues = quitarUltimo(e, 'dormitorio', ctx);
  assert.deepEqual(espaciosActivos(despues).map((x) => x.id), idsAntes.filter((id) => id !== ultimo));
});

test('AC-4.1, AC-4.2: + en baños usa el primer cuarto libre', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'oficina');
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  e = agregarEspacio(e, 'bano', ctx);
  assert.equal(banoDe(e, d1.id).contenidoEn, d1.id);
  assert.equal(siguienteDestinoBano(e).id, d2.id);
});

test('AC-4.3, AC-4.5: límites del contador de baños', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  assert.equal(puedeQuitar(e, 'bano'), false);
  e = agregarEspacio(e, 'bano', ctx);
  assert.equal(puedeAgregar(e, 'bano'), false);
});

test('AC-4.4: − elimina el baño creado más recientemente', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano', 'bano', 'bano');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, banoDe(e, d1.id).id, ctx); // libera Dormitorio 1
  e = agregarEspacio(e, 'bano', ctx); // nuevo baño en Dormitorio 1: el más reciente
  const banoD2 = banoDe(e, d2.id).id;
  const banoD3 = banoDe(e, d3.id).id;
  e = quitarUltimo(e, 'bano', ctx);
  assert.equal(banoDe(e, d1.id), null);
  assert.equal(banoDe(e, d2.id).id, banoD2);
  assert.equal(banoDe(e, d3.id).id, banoD3);
});

test('AC-4.6: eliminar un cuarto mueve su baño al primer cuarto libre', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, banoDe(e, d1.id).id, ctx);
  e = agregarEspacio(e, 'bano', ctx); // en Dormitorio 1
  e = agregarEspacio(e, 'bano', ctx); // en Dormitorio 2
  const banoD2 = banoDe(e, d2.id);
  e = renombrarEspacio(e, banoD2.id, 'Baño de visitas', ctx).estado;
  assert.equal(requiereConfirmacion(e, d2.id), false);
  e = eliminarEspacio(e, d2.id, ctx);
  const movido = buscarEspacio(e, banoD2.id);
  assert.equal(movido.contenidoEn, d3.id);
  assert.equal(movido.nombrePersonalizado, 'Baño de visitas');
});

test('AC-4.7: si no hay cuarto libre el baño se elimina con su cuarto, con confirmación', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'oficina', 'bano', 'bano');
  const oficina = espaciosDeTipo(e, 'oficina')[0];
  assert.equal(requiereConfirmacion(e, oficina.id), true);
  e = eliminarEspacio(e, oficina.id, ctx);
  assert.equal(contar(e, 'bano'), 2);
  assert.equal(contar(e, 'oficina'), 0);
});

test('AC-4.8: agregar o eliminar otros espacios no mueve los baños', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano', 'bano', 'bano');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, banoDe(e, d2.id).id, ctx);
  const b1 = banoDe(e, d1.id).id;
  const b3 = banoDe(e, d3.id).id;
  e = agregar(e, ctx, 'oficina', 'lavanderia');
  e = eliminarEspacio(e, espaciosDeTipo(e, 'lavanderia')[0].id, ctx);
  assert.equal(banoDe(e, d1.id).id, b1);
  assert.equal(banoDe(e, d3.id).id, b3);
});

test('AC-5.2: eliminar un espacio concreto renumera a los demás', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio');
  const [, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, d2.id, ctx);
  assert.deepEqual(nombres(e, 'dormitorio'), ['Dormitorio 1', 'Dormitorio 2']);
  assert.equal(espaciosDeTipo(e, 'dormitorio')[1].id, d3.id);
});

test('AC-5.3, AC-5.4: confirmación solo con nombre personalizado', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  assert.equal(requiereConfirmacion(e, d2.id), false);
  e = renombrarEspacio(e, d2.id, 'Cuarto de Bryam', ctx).estado;
  assert.equal(requiereConfirmacion(e, d2.id), true);
});

test('AC-5.5: no se puede eliminar en el mínimo ni el baño común', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  for (const tipo of ['sala', 'cocina', 'bano', 'dormitorio']) {
    assert.equal(puedeEliminar(e, espaciosDeTipo(e, tipo)[0].id), false, tipo);
  }
});

test('AC-6.1, AC-6.2, AC-6.3: nombre personalizado estable y restablecible', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio');
  const d3 = espaciosDeTipo(e, 'dormitorio')[2];
  e = renombrarEspacio(e, d3.id, '  Cuarto de Bryam ', ctx).estado;
  e = eliminarEspacio(e, espaciosDeTipo(e, 'dormitorio')[0].id, ctx);
  assert.equal(nombreVisible(e, buscarEspacio(e, d3.id)), 'Cuarto de Bryam');
  e = renombrarEspacio(e, d3.id, '   ', ctx).estado;
  assert.equal(nombreVisible(e, buscarEspacio(e, d3.id)), 'Dormitorio 2');
});

test('AC-6.4: rechaza duplicados y formato automático', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  e = renombrarEspacio(e, d1.id, 'Estudio', ctx).estado;
  for (const [texto, error] of [['cocina 1', 'formato-automatico'], ['Dormitorio 3', 'formato-automatico'], ['BAÑO 7', 'formato-automatico'], ['estudio', 'duplicado']]) {
    const r = renombrarEspacio(e, d2.id, texto, ctx);
    assert.equal(r.ok, false, texto);
    assert.equal(r.error, error, texto);
    assert.equal(buscarEspacio(r.estado, d2.id).nombrePersonalizado, null);
  }
});

test('AC-6.5: máximo 20 caracteres', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const sala = espaciosDeTipo(e, 'sala')[0];
  assert.equal(renombrarEspacio(e, sala.id, 'x'.repeat(21), ctx).error, 'largo');
  assert.equal(renombrarEspacio(e, sala.id, 'x'.repeat(20), ctx).ok, true);
});

test('AC-6.6, AC-6.7: renombrar personaje', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const id = e.miembros[0].id;
  assert.equal(renombrarMiembro(e, id, 'Diana', ctx).estado.miembros[0].nombre, 'Diana');
  const vacio = renombrarMiembro(e, id, '  ', ctx);
  assert.equal(vacio.ok, false);
  assert.equal(vacio.estado.miembros[0].nombre, 'Personaje 1');
});

test('AC-8.1: el identificador sobrevive a renombres, renumeraciones y mudanzas', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio', 'bano');
  const [d1, , d3] = espaciosDeTipo(e, 'dormitorio');
  const bano = banoDe(e, d1.id);
  e = renombrarEspacio(e, d3.id, 'Taller', ctx).estado;
  e = eliminarEspacio(e, d1.id, ctx);
  assert.ok(buscarEspacio(e, d3.id));
  assert.ok(buscarEspacio(e, bano.id));
  assert.notEqual(buscarEspacio(e, bano.id).contenidoEn, d1.id);
});

test('AC-8.2: borrado lógico y nombre reutilizable', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio');
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  e = renombrarEspacio(e, d2.id, 'Taller', ctx).estado;
  e = eliminarEspacio(e, d2.id, ctx);
  const registro = e.espacios.find((x) => x.id === d2.id);
  assert.ok(registro.eliminadoEn);
  assert.equal(buscarEspacio(e, d2.id), null);
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  assert.equal(renombrarEspacio(e, d1.id, 'Taller', ctx).ok, true);
});

test('AC-8.3: auditoría en cada registro', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = agregarEspacio(e, 'oficina', ctx);
  const oficina = espaciosDeTipo(e, 'oficina')[0];
  e = renombrarEspacio(e, oficina.id, 'Estudio', ctx).estado;
  const registros = [...e.cuentas, ...e.hogares, ...e.membresias, ...e.espacios, ...e.miembros];
  for (const r of registros) {
    assert.ok(r.creadoEn && r.actualizadoEn);
    assert.equal(r.creadoPor, 'cuenta-1');
    assert.equal(r.actualizadoPor, 'cuenta-1');
    assert.ok('eliminadoEn' in r);
  }
  const renombrada = buscarEspacio(e, oficina.id);
  assert.ok(renombrada.actualizadoEn > renombrada.creadoEn);
});
```

- [ ] Run: `cd poc && node --test test/hogar.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/hogar.js`)
- [ ] Implementar el catálogo (los datos de piezas los usa la Fase 2):
```js
// src/catalogo.js
export const TIPOS = ['sala', 'comedor', 'cocina', 'bano', 'lavanderia', 'mascota', 'dormitorio', 'oficina'];

export const ETIQUETAS = {
  sala: 'Sala', comedor: 'Comedor', cocina: 'Cocina', bano: 'Baño',
  lavanderia: 'Lavandería', mascota: 'Espacio de mascota',
  dormitorio: 'Dormitorio', oficina: 'Oficina',
};

export const LIMITES = {
  sala: { min: 1, max: 1 }, comedor: { min: 0, max: 1 }, cocina: { min: 1, max: 2 },
  lavanderia: { min: 0, max: 2 }, mascota: { min: 0, max: 2 },
  dormitorio: { min: 1, max: 4 }, oficina: { min: 0, max: 2 },
  // bano: min 1, max dinámico = 1 + dormitorios + oficinas (ver hogar.js)
};

export const ZONA_SERVICIO = ['cocina', 'bano', 'lavanderia', 'mascota'];
export const ZONA_PRIVADA = ['dormitorio', 'oficina'];
export const ADMITE_BANO = ['dormitorio', 'oficina'];

// Leyenda: '#' pared, '.' piso, '*' aparición (piso). Mobiliario (bloquea):
// B cama, n velador, S sofá, T mesa de centro, M mesa comedor, s silla comedor,
// K cocina, R refrigeradora, L lavadero, W inodoro, w lavamanos, U ducha,
// E escritorio, e silla de escritorio, V lavadora, P cama de mascota, o plato.
export const TRANSITABLE = new Set(['.', '*']);

// Piezas de zona lateral: puerta en la pared que mira al centro, en la fila `puerta`.
export const PIEZAS = {
  cocina: { filas: ['########', '#KLR...#', '#......#', '#......#', '#......#', '########'], puerta: 2 },
  bano: { filas: ['########', '#WwU...#', '#......#', '#......#', '########'], puerta: 2 },
  lavanderia: { filas: ['########', '#VV....#', '#......#', '#......#', '########'], puerta: 2 },
  mascota: { filas: ['########', '#P.o...#', '#......#', '#......#', '########'], puerta: 2 },
  dormitorio: {
    filas: ['#########', '#.....nB#', '#......B#', '#.......#', '#.......#', '#.......#', '#########'],
    puerta: 3,
    conBano: {
      filas: ['#########', '#Bn..#WU#', '#B.....w#', '#....#..#', '#....####', '#.......#', '#########'],
      banoRect: { x: 5, y: 0, w: 4, h: 5 },
    },
  },
  oficina: {
    filas: ['#########', '#....EE.#', '#....e..#', '#.......#', '#.......#', '#########'],
    puerta: 3,
    conBano: {
      filas: ['#########', '#EE..#WU#', '#e.....w#', '#....#..#', '#....####', '#########'],
      banoRect: { x: 5, y: 0, w: 4, h: 5 },
    },
  },
};

// Columna central (ancho 10). El comedor no tiene pared inferior: forma un solo
// espacio con la sala. La sala se estira repitiendo `salaEstirable`.
export const CENTRO = {
  ancho: 10,
  paredSuperior: '##########',
  comedor: ['##########', '#........#', '#..MMMM..#', '#..ssss..#', '#........#', '#........#'],
  sala: ['#........#', '#..SSSS..#', '#........#', '#...TT...#', '#....*...#'],
  salaEstirable: '#........#',
  paredInferior: '##########',
};

export const ANCHO_PASILLO = 3;
export const FILA_PUERTA_PASILLO = 2;
```

- [ ] Implementar el modelo:
```js
// src/hogar.js
import { TIPOS, ETIQUETAS, LIMITES, ADMITE_BANO } from './catalogo.js';

const MAX_NOMBRE = 20;
const PATRON_AUTOMATICO = new RegExp(
  `^(${Object.values(ETIQUETAS).map((e) => e.toLocaleLowerCase('es')).join('|')}) \\d+$`,
);

const normalizar = (texto) => texto.trim().toLocaleLowerCase('es');

function auditoriaNueva(ctx) {
  const ahora = ctx.ahora();
  return { creadoEn: ahora, actualizadoEn: ahora, creadoPor: ctx.cuentaId, actualizadoPor: ctx.cuentaId, eliminadoEn: null };
}

function tocar(registro, ctx) {
  return { ...registro, actualizadoEn: ctx.ahora(), actualizadoPor: ctx.cuentaId };
}

// ---------- Creación ----------

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
  const miembro = { id: ctx.nuevoId(), hogarId, nombre: 'Personaje 1', cuentaId, ...a() };
  return { version: 1, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro] };
}

// ---------- Consultas ----------

export const espaciosActivos = (estado) => estado.espacios.filter((e) => e.eliminadoEn === null);
export const miembrosActivos = (estado) => estado.miembros.filter((m) => m.eliminadoEn === null);
export const buscarEspacio = (estado, id) => espaciosActivos(estado).find((e) => e.id === id) ?? null;

export function espaciosDeTipo(estado, tipo) {
  return espaciosActivos(estado).filter((e) => e.tipo === tipo).sort((a, b) => a.orden - b.orden);
}

export const banoComun = (estado) => espaciosDeTipo(estado, 'bano').find((b) => b.contenidoEn === null);
export const banosInternos = (estado) => espaciosActivos(estado).filter((e) => e.tipo === 'bano' && e.contenidoEn !== null);

// Cuartos que pueden contener baño, en el orden de FR-4.
export function cuartosEnOrden(estado) {
  return ADMITE_BANO.flatMap((tipo) => espaciosDeTipo(estado, tipo));
}

export function banoDe(estado, cuartoId) {
  return banosInternos(estado).find((b) => b.contenidoEn === cuartoId) ?? null;
}

export function siguienteDestinoBano(estado, excluirId = null) {
  return cuartosEnOrden(estado).find((c) => c.id !== excluirId && banoDe(estado, c.id) === null) ?? null;
}

export function contar(estado, tipo) {
  return espaciosDeTipo(estado, tipo).length;
}

export function limites(estado, tipo) {
  if (tipo === 'bano') return { min: 1, max: 1 + contar(estado, 'dormitorio') + contar(estado, 'oficina') };
  return LIMITES[tipo];
}

export const puedeAgregar = (estado, tipo) => contar(estado, tipo) < limites(estado, tipo).max;
export const puedeQuitar = (estado, tipo) => contar(estado, tipo) > limites(estado, tipo).min;

export function puedeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  if (!espacio) return false;
  if (espacio.tipo === 'bano') return espacio.contenidoEn !== null;
  return puedeQuitar(estado, espacio.tipo);
}

// ---------- Nombres ----------

export function nombreAutomatico(estado, espacio) {
  if (espacio.tipo === 'bano') {
    if (espacio.contenidoEn === null) return 'Baño 1';
    const internos = cuartosEnOrden(estado).map((c) => banoDe(estado, c.id)).filter(Boolean);
    return `Baño ${internos.findIndex((b) => b.id === espacio.id) + 2}`;
  }
  return `${ETIQUETAS[espacio.tipo]} ${espacio.orden}`;
}

export const nombreVisible = (estado, espacio) => espacio.nombrePersonalizado ?? nombreAutomatico(estado, espacio);

// ---------- Mutaciones ----------

function siguienteSecuencia(estado) {
  return Math.max(0, ...estado.espacios.map((e) => e.secuencia)) + 1;
}

function reemplazar(estado, cambios) {
  const porId = new Map(cambios.map((e) => [e.id, e]));
  return { ...estado, espacios: estado.espacios.map((e) => porId.get(e.id) ?? e) };
}

export function agregarEspacio(estado, tipo, ctx) {
  if (!TIPOS.includes(tipo) || !puedeAgregar(estado, tipo)) return estado;
  const hogarId = estado.hogares[0].id;
  if (tipo === 'bano') {
    const destino = siguienteDestinoBano(estado);
    const orden = contar(estado, 'bano') + 1;
    const bano = { id: ctx.nuevoId(), hogarId, tipo, orden, secuencia: siguienteSecuencia(estado),
      nombrePersonalizado: null, contenidoEn: destino.id, ...auditoriaNueva(ctx) };
    return { ...estado, espacios: [...estado.espacios, bano] };
  }
  const nuevo = { id: ctx.nuevoId(), hogarId, tipo, orden: contar(estado, tipo) + 1,
    secuencia: siguienteSecuencia(estado), nombrePersonalizado: null, contenidoEn: null, ...auditoriaNueva(ctx) };
  return { ...estado, espacios: [...estado.espacios, nuevo] };
}

// Qué pasaría al eliminar este espacio (para decidir si se pide confirmación).
export function consecuenciasDeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  const bano = espacio ? banoDe(estado, espacio.id) : null;
  return {
    tieneNombrePersonalizado: Boolean(espacio?.nombrePersonalizado),
    banoSeElimina: Boolean(bano) && siguienteDestinoBano(estado, id) === null,
    banoSeMueve: Boolean(bano) && siguienteDestinoBano(estado, id) !== null,
  };
}

export const requiereConfirmacion = (estado, id) => {
  const c = consecuenciasDeEliminar(estado, id);
  return c.tieneNombrePersonalizado || c.banoSeElimina;
};

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

export function quitarUltimo(estado, tipo, ctx) {
  if (!puedeQuitar(estado, tipo)) return estado;
  if (tipo === 'bano') {
    const masReciente = [...banosInternos(estado)].sort((a, b) => b.secuencia - a.secuencia)[0];
    return eliminarEspacio(estado, masReciente.id, ctx);
  }
  const ultimo = espaciosDeTipo(estado, tipo).at(-1);
  return eliminarEspacio(estado, ultimo.id, ctx);
}

export function ultimoDeTipo(estado, tipo) {
  if (tipo === 'bano') return [...banosInternos(estado)].sort((a, b) => b.secuencia - a.secuencia)[0] ?? null;
  return espaciosDeTipo(estado, tipo).at(-1) ?? null;
}

export function renombrarEspacio(estado, id, texto, ctx) {
  const espacio = buscarEspacio(estado, id);
  const nombre = texto.trim();
  if (nombre.length > MAX_NOMBRE) return { ok: false, error: 'largo', estado };
  if (nombre === '') return { ok: true, estado: reemplazar(estado, [{ ...tocar(espacio, ctx), nombrePersonalizado: null }]) };
  if (PATRON_AUTOMATICO.test(normalizar(nombre))) return { ok: false, error: 'formato-automatico', estado };
  const repetido = espaciosActivos(estado).some((e) => e.id !== id && normalizar(nombreVisible(estado, e)) === normalizar(nombre));
  if (repetido) return { ok: false, error: 'duplicado', estado };
  return { ok: true, estado: reemplazar(estado, [{ ...tocar(espacio, ctx), nombrePersonalizado: nombre }]) };
}

export function renombrarMiembro(estado, id, texto, ctx) {
  const nombre = texto.trim();
  if (nombre === '') return { ok: false, error: 'vacio', estado };
  if (nombre.length > MAX_NOMBRE) return { ok: false, error: 'largo', estado };
  const repetido = miembrosActivos(estado).some((m) => m.id !== id && normalizar(m.nombre) === normalizar(nombre));
  if (repetido) return { ok: false, error: 'duplicado', estado };
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), nombre } : m));
  return { ok: true, estado: { ...estado, miembros } };
}

export const MENSAJES_ERROR = {
  vacio: 'El nombre no puede estar vacío.',
  largo: 'El nombre puede tener como máximo 20 caracteres.',
  duplicado: 'Ya existe otro con ese nombre.',
  'formato-automatico': 'Ese formato está reservado para los nombres automáticos (por ejemplo, "Dormitorio 3").',
};
```

- [ ] Run: `cd poc && node --test test/hogar.test.js` — expect: PASS (`# pass 20`, `# fail 0`)
- [ ] Commit: `feat: add space catalog and pure home domain model`

---

## Phase 2: Generador de distribución

**Implements:** FR-3, FR-5, NFR Reliability (verificación exhaustiva), NFR Performance (generación) | **Satisfies:** AC-1.3, AC-3.5, AC-3.6, AC-4.1 (puerta solo hacia su cuarto), AC-7.1 (mismas posiciones por determinismo)
**Files:** `poc/src/distribucion.js`, `poc/test/distribucion.test.js`
**Interfaces:** Consumes: de `catalogo.js`: `PIEZAS`, `CENTRO`, `TRANSITABLE`, `ZONA_SERVICIO`, `ZONA_PRIVADA`, `ANCHO_PASILLO`, `FILA_PUERTA_PASILLO`; de `hogar.js`: `espaciosDeTipo`, `banoComun`, `banoDe`. Produces: `generarDistribucion(estado)` con la forma fijada en la Fase 0 (claves de `rects`/`espacioEn`: id de espacio, o `'pasillo:izq'` / `'pasillo:der'`), `esTransitable(distribucion, x, y)`.

Implementa el enfoque A del ADR: piezas fijas apiladas por zona, sala estirable para colindar con zonas sin pasillo, pasillo de 3 casillas cuando una zona supera 2 espacios y baño interno estampado como variante de su cuarto. La prueba exhaustiva recorre las 7.560 combinaciones permitidas (2 comedor × 2 cocinas × 3 lavanderías × 3 mascotas × 210 combinaciones de cuartos con o sin baño).

Geometría resultante (las piezas tienen pared propia de 1 casilla; entre piezas vecinas la pared es doble y la puerta abre ambas):

- Zona de servicio: ancho 8, a la izquierda. Pasillo izquierdo (si existe): ancho 3.
- Centro: ancho 10. Comedor 6 filas sin pared inferior + sala de 5 filas fijas, estiramiento y pared inferior.
- Zona privada: ancho 9, a la derecha. Baño interno: rectángulo 4×5 en la esquina superior derecha del cuarto.

- [ ] Escribir las pruebas del generador:
```js
// test/distribucion.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo, espaciosActivos, banoDe, cuartosEnOrden } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function alcanzables(d) {
  const visto = new Set([`${d.aparicion.x},${d.aparicion.y}`]);
  const cola = [d.aparicion];
  while (cola.length) {
    const { x, y } = cola.shift();
    for (const [dx, dy] of VECINOS) {
      const k = `${x + dx},${y + dy}`;
      if (!visto.has(k) && esTransitable(d, x + dx, y + dy)) { visto.add(k); cola.push({ x: x + dx, y: y + dy }); }
    }
  }
  return visto;
}

const seCruzan = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const contiene = (a, b) => b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;

// Verifica FR-3 y FR-5 sobre una distribución (Reliability, criterio exhaustivo).
function verificarMapa(estado) {
  const d = generarDistribucion(estado);
  const visto = alcanzables(d);
  for (let y = 0; y < d.alto; y++) for (let x = 0; x < d.ancho; x++) {
    if (esTransitable(d, x, y)) assert.ok(visto.has(`${x},${y}`), `casilla aislada ${x},${y}`);
  }
  for (const p of d.puertas) assert.ok(visto.has(`${p.x},${p.y}`), `puerta bloqueada ${p.x},${p.y}`);
  const activos = espaciosActivos(estado);
  for (const e of activos) {
    const r = d.rects[e.id];
    assert.ok(r, `sin rect ${e.tipo}`);
    let alcanzable = false;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (d.espacioEn[y][x] === e.id && visto.has(`${x},${y}`)) alcanzable = true;
    }
    assert.ok(alcanzable, `inalcanzable ${e.tipo}`);
  }
  const externos = activos.filter((e) => !(e.tipo === 'bano' && e.contenidoEn)).map((e) => d.rects[e.id]);
  const cajas = [...externos, ...d.pasillos];
  for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) {
    assert.ok(!seCruzan(cajas[i], cajas[j]), 'piezas superpuestas');
  }
  for (const b of activos.filter((e) => e.tipo === 'bano' && e.contenidoEn)) {
    assert.ok(contiene(d.rects[b.contenidoEn], d.rects[b.id]), 'baño fuera de su cuarto');
    const r = d.rects[b.id];
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (!esTransitable(d, x, y)) continue;
      for (const [dx, dy] of VECINOS) {
        if (!esTransitable(d, x + dx, y + dy)) continue;
        const vecino = d.espacioEn[y + dy][x + dx];
        assert.ok(vecino === b.id || vecino === b.contenidoEn, 'baño accesible desde fuera de su cuarto');
      }
    }
  }
  assert.deepEqual(generarDistribucion(estado), d, 'no determinista');
}

function* todasLasCombinaciones() {
  for (const comedor of [0, 1]) for (const cocinas of [1, 2]) for (const lav of [0, 1, 2]) for (const masc of [0, 1, 2])
    for (const dorms of [1, 2, 3, 4]) for (const ofis of [0, 1, 2]) {
      const ctx = crearCtx();
      let base = crearHogarInicial(ctx);
      base = agregar(base, ctx, ...Array(comedor).fill('comedor'), ...Array(cocinas - 1).fill('cocina'),
        ...Array(lav).fill('lavanderia'), ...Array(masc).fill('mascota'), ...Array(dorms - 1).fill('dormitorio'), ...Array(ofis).fill('oficina'));
      const cuartos = cuartosEnOrden(base);
      base = agregar(base, ctx, ...Array(cuartos.length).fill('bano'));
      for (let mascara = 0; mascara < 2 ** cuartos.length; mascara++) {
        let e = base;
        cuartos.forEach((c, i) => { if (!(mascara & (1 << i))) e = eliminarEspacio(e, banoDe(e, c.id).id, ctx); });
        yield e;
      }
    }
}

test('Reliability: todas las combinaciones generan mapas correctos y navegables', () => {
  let total = 0;
  for (const estado of todasLasCombinaciones()) { verificarMapa(estado); total++; }
  assert.equal(total, 7560);
});

test('AC-1.3: distribución inicial sin pasillos', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const r = (tipo) => d.rects[espaciosDeTipo(e, tipo)[0].id];
  assert.ok(r('cocina').x + r('cocina').w <= r('sala').x);
  assert.ok(r('bano').x + r('bano').w <= r('sala').x);
  assert.ok(r('dormitorio').x >= r('sala').x + r('sala').w);
  assert.equal(d.pasillos.length, 0);
});

test('AC-3.5: el comedor queda encima de la sala sin pared entre ambos', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'comedor', ctx);
  const d = generarDistribucion(e);
  const com = d.rects[espaciosDeTipo(e, 'comedor')[0].id];
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  assert.equal(com.y + com.h, sala.y);
  assert.equal(com.x, sala.x);
  for (let x = sala.x + 1; x < sala.x + sala.w - 1; x++) {
    assert.ok(esTransitable(d, x, sala.y - 1) || esTransitable(d, x, sala.y), `pared entre comedor y sala en x=${x}`);
  }
  assert.ok(esTransitable(d, sala.x + 1, sala.y - 1) && esTransitable(d, sala.x + 1, sala.y));
});

test('AC-3.6: con más de 2 espacios en una zona aparece un pasillo', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  assert.equal(generarDistribucion(e).pasillos.length, 0);
  e = agregarEspacio(e, 'oficina', ctx);
  const d = generarDistribucion(e);
  assert.deepEqual(d.pasillos.map((p) => p.lado), ['der']);
  const pasillo = d.pasillos[0];
  for (const c of [...espaciosDeTipo(e, 'dormitorio'), ...espaciosDeTipo(e, 'oficina')]) {
    const r = d.rects[c.id];
    const puerta = d.puertas.find((p) => p.x === r.x && p.y >= r.y && p.y < r.y + r.h);
    assert.ok(puerta, 'cuarto sin puerta');
    assert.equal(d.espacioEn[puerta.y][puerta.x - 1], `pasillo:der`);
    assert.equal(puerta.x - 1, pasillo.x + pasillo.w - 1);
  }
});

test('AC-4.1: el baño interno tiene puerta solo hacia su cuarto', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx);
  verificarMapa(e);
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  assert.equal(generarDistribucion(e).rects[banoDe(e, d1.id).id] !== undefined, true);
});

test('NFR rendimiento: generar el hogar más grande toma menos de 100 ms', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  e = agregar(e, ctx, ...Array(6).fill('bano'));
  const inicio = performance.now();
  generarDistribucion(e);
  assert.ok(performance.now() - inicio < 100);
});
```

- [ ] Run: `cd poc && node --test test/distribucion.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/distribucion.js`)
- [ ] Implementar el generador:
```js
// src/distribucion.js
import { PIEZAS, CENTRO, TRANSITABLE, ZONA_SERVICIO, ZONA_PRIVADA, ANCHO_PASILLO, FILA_PUERTA_PASILLO } from './catalogo.js';
import { espaciosDeTipo, banoComun, banoDe } from './hogar.js';

// Lista de piezas de una zona lateral, en orden de apilado (FR-3).
function piezasDeZona(estado, tipos) {
  const lista = [];
  for (const tipo of tipos) {
    const espacios = tipo === 'bano' ? [banoComun(estado)] : espaciosDeTipo(estado, tipo);
    for (const espacio of espacios) {
      const base = PIEZAS[tipo];
      const bano = banoDe(estado, espacio.id);
      const variante = bano ? base.conBano : null;
      lista.push({ espacio, bano, filas: variante ? variante.filas : base.filas, banoRect: variante?.banoRect ?? null, puerta: base.puerta });
    }
  }
  return lista;
}

const alturaDe = (piezas) => piezas.reduce((total, p) => total + p.filas.length, 0);

// Función pura: el mismo estado produce siempre la misma distribución.
export function generarDistribucion(estado) {
  const izquierda = piezasDeZona(estado, ZONA_SERVICIO);
  const derecha = piezasDeZona(estado, ZONA_PRIVADA);
  const pasilloIzq = izquierda.length > 2;
  const pasilloDer = derecha.length > 2;
  const altoIzq = alturaDe(izquierda);
  const altoDer = alturaDe(derecha);

  // Centro: comedor (opcional) + sala estirada para colindar con zonas sin pasillo.
  const comedor = espaciosDeTipo(estado, 'comedor')[0] ?? null;
  const sala = espaciosDeTipo(estado, 'sala')[0];
  const filasSuperiores = comedor ? CENTRO.comedor : [CENTRO.paredSuperior];
  const base = filasSuperiores.length + CENTRO.sala.length + 1;
  const requerido = Math.max(pasilloIzq ? 0 : altoIzq, pasilloDer ? 0 : altoDer);
  const estiramiento = Math.max(0, requerido - base);
  const filasCentro = [...filasSuperiores, ...CENTRO.sala, ...Array(estiramiento).fill(CENTRO.salaEstirable), CENTRO.paredInferior];

  const anchoIzq = PIEZAS.cocina.filas[0].length;
  const anchoDer = PIEZAS.dormitorio.filas[0].length;
  const xPasilloIzq = anchoIzq;
  const xCentro = anchoIzq + (pasilloIzq ? ANCHO_PASILLO : 0);
  const xPasilloDer = xCentro + CENTRO.ancho;
  const xDer = xPasilloDer + (pasilloDer ? ANCHO_PASILLO : 0);
  const ancho = xDer + anchoDer;
  const alto = Math.max(altoIzq, altoDer, filasCentro.length);

  const tiles = Array.from({ length: alto }, () => Array(ancho).fill(' '));
  const espacioEn = Array.from({ length: alto }, () => Array(ancho).fill(null));
  const rects = {};
  const puertas = [];

  const estampar = (filas, x0, y0, clave) => {
    filas.forEach((fila, dy) => [...fila].forEach((ch, dx) => {
      tiles[y0 + dy][x0 + dx] = ch;
      espacioEn[y0 + dy][x0 + dx] = clave;
    }));
  };
  const abrir = (x, y) => { tiles[y][x] = '.'; puertas.push({ x, y }); };

  // Centro
  estampar(filasCentro, xCentro, 0, sala.id);
  const altoComedor = comedor ? CENTRO.comedor.length : 0;
  if (comedor) {
    for (let y = 0; y < altoComedor; y++) for (let x = 0; x < CENTRO.ancho; x++) espacioEn[y][xCentro + x] = comedor.id;
    rects[comedor.id] = { x: xCentro, y: 0, w: CENTRO.ancho, h: altoComedor };
  }
  rects[sala.id] = { x: xCentro, y: altoComedor, w: CENTRO.ancho, h: filasCentro.length - altoComedor };
  const filaAparicion = filasCentro.findIndex((f) => f.includes('*'));
  const aparicion = { x: xCentro + filasCentro[filaAparicion].indexOf('*'), y: filaAparicion };

  const pasillos = [];
  const colocarZona = (piezas, x0, lado, conPasillo, xPasillo, altoZona) => {
    let y = 0;
    for (const p of piezas) {
      estampar(p.filas, x0, y, p.espacio.id);
      const w = p.filas[0].length;
      rects[p.espacio.id] = { x: x0, y, w, h: p.filas.length };
      if (p.bano) {
        const r = p.banoRect;
        for (let dy = 0; dy < r.h; dy++) for (let dx = 0; dx < r.w; dx++) espacioEn[y + r.y + dy][x0 + r.x + dx] = p.bano.id;
        rects[p.bano.id] = { x: x0 + r.x, y: y + r.y, w: r.w, h: r.h };
      }
      const yPuerta = y + p.puerta;
      const xParedPieza = lado === 'izq' ? x0 + w - 1 : x0;
      abrir(xParedPieza, yPuerta);
      const xVecino = lado === 'izq' ? x0 + w : x0 - 1; // pared del pasillo o del centro
      abrir(xVecino, yPuerta);
      y += p.filas.length;
    }
    if (conPasillo) {
      const clave = `pasillo:${lado}`;
      const filas = Array.from({ length: altoZona }, (_, i) => (i === 0 || i === altoZona - 1 ? '###' : '#.#'));
      // Las puertas de las piezas ya abrieron la pared exterior del pasillo; estampar respetándolas.
      filas.forEach((fila, dy) => [...fila].forEach((ch, dx) => {
        const x = xPasillo + dx;
        if (tiles[dy][x] === '.' && puertas.some((pt) => pt.x === x && pt.y === dy)) { espacioEn[dy][x] = clave; return; }
        tiles[dy][x] = ch;
        espacioEn[dy][x] = clave;
      }));
      rects[clave] = { x: xPasillo, y: 0, w: ANCHO_PASILLO, h: altoZona };
      pasillos.push({ lado, ...rects[clave] });
      const xParedInterior = lado === 'izq' ? xPasillo + ANCHO_PASILLO - 1 : xPasillo;
      const xParedCentro = lado === 'izq' ? xCentro : xCentro + CENTRO.ancho - 1;
      abrir(xParedInterior, FILA_PUERTA_PASILLO);
      abrir(xParedCentro, FILA_PUERTA_PASILLO);
    }
  };
  colocarZona(izquierda, 0, 'izq', pasilloIzq, xPasilloIzq, altoIzq);
  colocarZona(derecha, xDer, 'der', pasilloDer, xPasilloDer, altoDer);

  return {
    ancho, alto,
    tiles: tiles.map((fila) => fila.join('')),
    espacioEn, rects, puertas, pasillos, aparicion,
  };
}

export function esTransitable(distribucion, x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return false;
  return TRANSITABLE.has(distribucion.tiles[y][x]);
}
```

- [ ] Run: `cd poc && node --test test/distribucion.test.js` — expect: PASS (`# pass 6`, `# fail 0`; la prueba exhaustiva tarda unos segundos)
- [ ] Commit: `feat: add deterministic piece-and-rule layout generator`

---

## Phase 3: Posición y persistencia

**Implements:** FR-1 (arranque), FR-6 (regla de paso), FR-10, FR-11 (posición solo en el dispositivo), Error Scenarios | **Satisfies:** AC-1.1 (arranque sin datos), AC-2.1, AC-2.3, AC-2.5, AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-8.5
**Files:** `poc/src/posicion.js`, `poc/src/almacen.js`, `poc/test/posicion.test.js`, `poc/test/almacen.test.js`
**Interfaces:** Consumes: `generarDistribucion`, `esTransitable` (Fase 2); `crearHogarInicial` y operaciones de `hogar.js` (Fase 1); `almacenEnMemoria` (Fase 0). Produces: `DIRECCIONES`; `posicionRelativa(distribucion, x, y, direccion)` → `{ clave, dx, dy, direccion }`; `resolverPosicion(distribucion, guardada | null)` → `{ x, y, direccion }` (aparición de la sala con dirección `'abajo'` si no es válida); `paso(distribucion, actual, direccion)` → `{ x, y, direccion, movio }`; `CLAVE_DATOS = 'livin:datos:v1'`, `CLAVE_POSICION = 'livin:posicion:v1'`; `crearAlmacen(storage)` → `{ cargar(), guardar(estado), cargarPosicion(), guardarPosicion(pos) }` (las escrituras devuelven `{ ok }` y nunca lanzan); `iniciarSesion(almacen, ctx)` → `{ estado, aviso: string | null }`.

La posición se guarda relativa a su espacio o pasillo para sobrevivir a los cambios del mapa; el almacén recibe el `storage` como parámetro para poder probarlo sin navegador.

- [ ] Escribir las pruebas de posición:
```js
// test/posicion.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { posicionRelativa, resolverPosicion, paso } from '../src/posicion.js';
import { crearCtx } from './ayuda.js';

test('AC-2.1: un paso a una casilla transitable avanza una casilla', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  const inicio = { ...d.aparicion, direccion: 'abajo' };
  const r = paso(d, inicio, 'abajo');
  assert.deepEqual(r, { x: inicio.x, y: inicio.y + 1, direccion: 'abajo', movio: true });
});

test('AC-2.3: contra una pared no se mueve pero cambia la dirección', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  let pos = { ...d.aparicion, direccion: 'abajo' };
  while (paso(d, pos, 'abajo').movio) pos = paso(d, pos, 'abajo');
  const r = paso(d, { ...pos, direccion: 'izquierda' }, 'abajo');
  assert.equal(r.movio, false);
  assert.equal(r.direccion, 'abajo');
  assert.deepEqual([r.x, r.y], [pos.x, pos.y]);
});

test('AC-2.5: cruzar una puerta no requiere transición (mapa continuo)', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = espaciosDeTipo(e, 'sala')[0].id;
  const dorm = espaciosDeTipo(e, 'dormitorio')[0].id;
  const puerta = d.puertas.find((p) => d.espacioEn[p.y][p.x] === dorm);
  assert.ok(esTransitable(d, puerta.x - 1, puerta.y));
  assert.equal(d.espacioEn[puerta.y][puerta.x - 1], sala);
});

test('AC-7.3: la posición relativa sigue al espacio cuando se desplaza', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  const antes = generarDistribucion(e);
  const r = antes.rects[d2.id];
  const guardada = posicionRelativa(antes, r.x + 2, r.y + 4, 'izquierda');
  e = agregarEspacio(e, 'oficina', ctx); // aparece un pasillo: la zona privada se desplaza
  const despues = generarDistribucion(e);
  assert.notEqual(despues.rects[d2.id].x, r.x);
  const resuelta = resolverPosicion(despues, guardada);
  assert.deepEqual(resuelta, { x: despues.rects[d2.id].x + 2, y: despues.rects[d2.id].y + 4, direccion: 'izquierda' });
});

test('AC-7.4: posición inválida vuelve a la aparición de la sala', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  const d2 = espaciosDeTipo(e, 'dormitorio')[1];
  let d = generarDistribucion(e);
  const r = d.rects[d2.id];
  const enD2 = posicionRelativa(d, r.x + 6, r.y + 2, 'arriba'); // espacio que se eliminará
  e = eliminarEspacio(e, d2.id, ctx);
  d = generarDistribucion(e);
  assert.deepEqual(resolverPosicion(d, enD2), { ...d.aparicion, direccion: 'abajo' });
  assert.deepEqual(resolverPosicion(d, null), { ...d.aparicion, direccion: 'abajo' });
  // casilla que queda ocupada por un baño interno
  const ctx2 = crearCtx();
  let e2 = crearHogarInicial(ctx2);
  let d3 = generarDistribucion(e2);
  const dorm = espaciosDeTipo(e2, 'dormitorio')[0].id;
  const rd = d3.rects[dorm];
  const guardada = posicionRelativa(d3, rd.x + 5, rd.y + 1, 'arriba');
  e2 = agregarEspacio(e2, 'bano', ctx2);
  d3 = generarDistribucion(e2);
  assert.deepEqual(resolverPosicion(d3, guardada), { ...d3.aparicion, direccion: 'abajo' });
  // pasillo que desaparece
  const ctx3 = crearCtx();
  let e3 = agregarEspacio(agregarEspacio(crearHogarInicial(ctx3), 'dormitorio', ctx3), 'oficina', ctx3);
  let d4 = generarDistribucion(e3);
  const p = d4.pasillos[0];
  const enPasillo = posicionRelativa(d4, p.x + 1, p.y + 3, 'abajo');
  e3 = eliminarEspacio(e3, espaciosDeTipo(e3, 'oficina')[0].id, ctx3);
  d4 = generarDistribucion(e3);
  assert.deepEqual(resolverPosicion(d4, enPasillo), { ...d4.aparicion, direccion: 'abajo' });
});
```

- [ ] Escribir las pruebas de persistencia:
```js
// test/almacen.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen, iniciarSesion, CLAVE_DATOS, CLAVE_POSICION } from '../src/almacen.js';
import { agregarEspacio, renombrarEspacio, espaciosDeTipo, crearHogarInicial } from '../src/hogar.js';
import { crearCtx, almacenEnMemoria } from './ayuda.js';

test('AC-1.1: sin datos se crea y guarda el hogar inicial, sin aviso', () => {
  const storage = almacenEnMemoria();
  const { estado, aviso } = iniciarSesion(crearAlmacen(storage), crearCtx());
  assert.equal(aviso, null);
  assert.equal(espaciosDeTipo(estado, 'sala').length, 1);
  assert.ok(storage.datos.has(CLAVE_DATOS));
});

test('AC-7.1: lo guardado se restaura igual', () => {
  const ctx = crearCtx();
  const almacen = crearAlmacen(almacenEnMemoria());
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  e = agregarEspacio(e, 'bano', ctx);
  e = renombrarEspacio(e, espaciosDeTipo(e, 'dormitorio')[1].id, 'Cuarto de Bryam', ctx).estado;
  almacen.guardar(e);
  assert.deepEqual(iniciarSesion(almacen, crearCtx()).estado, e);
});

test('AC-7.2: la posición se guarda y se recupera', () => {
  const almacen = crearAlmacen(almacenEnMemoria());
  const pos = { clave: 'id-5', dx: 2, dy: 3, direccion: 'izquierda' };
  almacen.guardarPosicion(pos);
  assert.deepEqual(almacen.cargarPosicion(), pos);
});

test('Error: datos ilegibles crean hogar inicial con aviso', () => {
  for (const basura of ['{no es json', JSON.stringify({ version: 1, espacios: [] })]) {
    const storage = almacenEnMemoria({ [CLAVE_DATOS]: basura });
    const { estado, aviso } = iniciarSesion(crearAlmacen(storage), crearCtx());
    assert.match(aviso, /No se pudo recuperar/);
    assert.equal(espaciosDeTipo(estado, 'dormitorio').length, 1);
  }
});

test('AC-8.5: un miembro sin cuenta se carga como válido', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const conMiembroSinCuenta = { ...e, miembros: [...e.miembros, { ...e.miembros[0], id: 'id-99', nombre: 'Firulais', cuentaId: null }] };
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(conMiembroSinCuenta) });
  const { aviso, estado } = iniciarSesion(crearAlmacen(storage), crearCtx());
  assert.equal(aviso, null);
  assert.equal(estado.miembros[1].cuentaId, null);
});

test('Error: si falla el guardado se informa sin lanzar', () => {
  const roto = { getItem: () => null, setItem: () => { throw new Error('cuota llena'); } };
  const almacen = crearAlmacen(roto);
  assert.deepEqual(almacen.guardar({}), { ok: false });
  assert.deepEqual(almacen.guardarPosicion({}), { ok: false });
  assert.equal(CLAVE_POSICION, 'livin:posicion:v1');
});
```

- [ ] Run: `cd poc && node --test test/posicion.test.js test/almacen.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND`)
- [ ] Implementar la posición:
```js
// src/posicion.js
import { esTransitable } from './distribucion.js';

export const DIRECCIONES = { arriba: { dx: 0, dy: -1 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 }, derecha: { dx: 1, dy: 0 } };

// Convierte una casilla absoluta del mapa en una posición relativa a su espacio o pasillo (FR-10).
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

// Un paso del modo exploración: devuelve la nueva casilla y dirección (AC-2.1, AC-2.3).
export function paso(distribucion, actual, direccion) {
  const { dx, dy } = DIRECCIONES[direccion];
  const x = actual.x + dx;
  const y = actual.y + dy;
  if (esTransitable(distribucion, x, y)) return { x, y, direccion, movio: true };
  return { x: actual.x, y: actual.y, direccion, movio: false };
}
```

- [ ] Implementar la persistencia:
```js
// src/almacen.js
import { crearHogarInicial } from './hogar.js';

export const CLAVE_DATOS = 'livin:datos:v1';
export const CLAVE_POSICION = 'livin:posicion:v1';

function esEstadoValido(estado) {
  if (!estado || estado.version !== 1) return false;
  for (const lista of ['cuentas', 'hogares', 'membresias', 'espacios', 'miembros']) {
    if (!Array.isArray(estado[lista])) return false;
  }
  const activos = estado.espacios.filter((e) => e.eliminadoEn === null);
  const cuenta = (tipo) => activos.filter((e) => e.tipo === tipo).length;
  return estado.hogares.length === 1 && cuenta('sala') === 1 && cuenta('cocina') >= 1 && cuenta('dormitorio') >= 1
    && activos.filter((e) => e.tipo === 'bano' && e.contenidoEn === null).length === 1;
}

export function crearAlmacen(storage) {
  return {
    cargar() {
      const texto = storage.getItem(CLAVE_DATOS);
      if (texto === null) return { estado: null, error: null };
      try {
        const estado = JSON.parse(texto);
        return esEstadoValido(estado) ? { estado, error: null } : { estado: null, error: 'ilegible' };
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

// Arranque de la app (FR-1, FR-10): recupera el hogar o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar();
  if (estado) return { estado, aviso: null };
  const nuevo = crearHogarInicial(ctx);
  almacen.guardar(nuevo);
  return { estado: nuevo, aviso: error === 'ilegible' ? 'No se pudo recuperar tu hogar guardado. Se creó un hogar nuevo.' : null };
}
```

- [ ] Run: `cd poc && npm test` — expect: PASS (`# pass 40`, `# fail 0`; incluye ahora las pruebas de contrato de la Fase 0)
- [ ] Commit: `feat: add relative player position and local persistence`

---

## Phase 4: Juego: exploración y modo edición

**Implements:** FR-6, FR-7, FR-8 (diálogos de confirmación), FR-9 (fichas y mensajes), FR-10 (momentos de guardado), NFR Performance (medición en pantalla) | **Satisfies:** AC-2.2, AC-2.4, AC-3.1, AC-3.8, AC-4.7 (diálogo), AC-4.9, AC-5.1, AC-5.3 (diálogo), AC-5.6, y la parte visible de todos los AC de las Stories 2 a 7
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: todo lo producido en las Fases 1 a 3 (nombres exactos en sus líneas Interfaces) y el global `Phaser` (3.80.1). Produces: la aplicación jugable; un indicador de depuración `"<fps> fps · regen <ms> ms"` para medir las metas de rendimiento.

Capa de presentación delgada: toda decisión de reglas se delega en los módulos puros. El paso de "prueba que falla" es manual porque esta capa depende de Phaser y del DOM; su verificación completa está en la Fase 5.

> **Complexity note:** Gate: Integration-First (pruebas antes del código). Violation: la capa de presentación no tiene pruebas automáticas. Justification: depende del motor de la PoC, que es desechable según el PRD; toda lógica con reglas de la spec quedó en módulos puros probados en las Fases 1 a 3, y esta capa se verifica con la lista manual de la Fase 5.

- [ ] Verificación previa (falla esperada): `cd poc && npm start`, abrir `http://localhost:8080` — expect: página en blanco con error de carga de `index.html` (aún no existe)
- [ ] Crear la página:
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <title>Livin · PoC mapa del hogar</title>
  <style>
    html, body { margin: 0; height: 100%; background: #1d1d1d; overflow: hidden; font-family: system-ui, sans-serif; touch-action: none; }
    #juego { position: fixed; inset: 0; }
    button { font: inherit; border: 0; border-radius: 8px; background: #f2ead3; color: #2a221c; }
    button:disabled { opacity: .35; }
    #editar { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; padding: 8px 14px; }
    #cruceta { position: fixed; left: 16px; bottom: calc(24px + env(safe-area-inset-bottom)); display: grid;
      grid-template: repeat(3, 52px) / repeat(3, 52px); gap: 4px; user-select: none; }
    #cruceta button { font-size: 20px; background: rgba(242, 234, 211, .85); }
    #cruceta [data-dir="arriba"] { grid-area: 1 / 2; } #cruceta [data-dir="izquierda"] { grid-area: 2 / 1; }
    #cruceta [data-dir="derecha"] { grid-area: 2 / 3; } #cruceta [data-dir="abajo"] { grid-area: 3 / 2; }
    #panel { position: fixed; left: 0; right: 0; bottom: 0; max-height: 45%; overflow-y: auto; background: #2a221c; color: #f2ead3;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); display: none; }
    #panel header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .fila { display: grid; grid-template-columns: 1fr 36px 28px 36px; align-items: center; gap: 6px; padding: 4px 0; }
    .fila small { display: block; opacity: .7; }
    .fila button { height: 32px; font-size: 18px; }
    .fila .cuenta { text-align: center; }
    #ficha { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    #ficha form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(320px, 86vw); }
    #ficha input { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 8px 0 4px; }
    #ficha .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    #ficha .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha .acciones button { padding: 8px 12px; background: #2a221c; color: #f2ead3; }
    #ficha .acciones .peligro { background: #a32d2d; margin-right: auto; }
    #aviso { position: fixed; top: calc(56px + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); background: #2a221c;
      color: #f2ead3; padding: 8px 14px; border-radius: 8px; display: none; max-width: 86vw; }
    #depuracion { position: fixed; top: calc(8px + env(safe-area-inset-top)); left: 8px; color: #9fe1cb; font: 12px monospace; }
  </style>
</head>
<body>
  <div id="juego"></div>
  <div id="depuracion"></div>
  <button id="editar">Editar</button>
  <div id="cruceta">
    <button data-dir="arriba" aria-label="Arriba">▲</button>
    <button data-dir="izquierda" aria-label="Izquierda">◀</button>
    <button data-dir="derecha" aria-label="Derecha">▶</button>
    <button data-dir="abajo" aria-label="Abajo">▼</button>
  </div>
  <section id="panel">
    <header><strong>Espacios</strong><button id="listo">Listo</button></header>
    <div id="contadores"></div>
  </section>
  <div id="ficha">
    <form>
      <strong id="ficha-titulo"></strong>
      <input id="ficha-nombre" maxlength="20" autocomplete="off">
      <div class="error" id="ficha-error"></div>
      <div class="acciones">
        <button type="button" class="peligro" id="ficha-eliminar">Eliminar</button>
        <button type="button" id="ficha-cancelar">Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  </div>
  <div id="aviso" role="status"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js"></script>
  <script type="module" src="src/juego.js"></script>
</body>
</html>
```

- [ ] Implementar la escena y la interfaz:
```js
// src/juego.js
/* global Phaser */
import { TIPOS, ETIQUETAS } from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';

const TILE = 16;
const MS_POR_CASILLA = 250; // 4 casillas por segundo (AC-2.2)
const ZOOM_EXPLORACION = 3;
const COLOR_PISO = { sala: 0xe8dcc0, comedor: 0xe2d2b0, cocina: 0xd9e4e8, bano: 0xcfe3ea, lavanderia: 0xdde3d6,
  mascota: 0xeadfcf, dormitorio: 0xe9d6dc, oficina: 0xdcd8ea, pasillo: 0xd6d1c4 };
const COLOR_MUEBLE = { B: 0x7f77dd, n: 0x8a6d4b, S: 0x1d9e75, T: 0x8a6d4b, M: 0x8a6d4b, s: 0xa6875f, K: 0x5f5e5a,
  R: 0xb4b2a9, L: 0x888780, W: 0xffffff, w: 0xf1efe8, U: 0x85b7eb, E: 0x8a6d4b, e: 0x444441, V: 0xb4b2a9, P: 0xd85a30, o: 0xef9f27 };
const COLOR_PARED = 0x5b4a3f;

const $ = (id) => document.getElementById(id);
const almacen = crearAlmacen(window.localStorage);
const ctx = { cuentaId: crypto.randomUUID(), nuevoId: () => crypto.randomUUID(), ahora: () => new Date().toISOString() };
const inicio = iniciarSesion(almacen, ctx);
let estado = inicio.estado;
ctx.cuentaId = estado.cuentas[0].id;
let distribucion = generarDistribucion(estado);
let posGuardada = almacen.cargarPosicion();
let jugador = resolverPosicion(distribucion, posGuardada);
let modo = 'exploracion';
let moviendo = false;
let direccionTactil = null;
let ultimaRegeneracionMs = 0;

function avisar(texto) {
  const caja = $('aviso');
  caja.textContent = texto;
  caja.style.display = 'block';
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => { caja.style.display = 'none'; }, 4000);
}

function guardarEstado() {
  if (!almacen.guardar(estado).ok) avisar('No se pudo guardar. Se reintentará en el próximo cambio.');
}

function guardarPosicion() {
  posGuardada = posicionRelativa(distribucion, jugador.x, jugador.y, jugador.direccion);
  if (!almacen.guardarPosicion(posGuardada).ok) avisar('No se pudo guardar la posición.');
}

class Escena extends Phaser.Scene {
  constructor() { super('principal'); }

  create() {
    this.mapa = this.add.graphics();
    this.etiquetas = [];
    this.personaje = this.add.container(0, 0, [
      this.add.rectangle(0, 0, 12, 14, 0xd4537e).setStrokeStyle(1, 0x4b1528),
      this.add.triangle(0, 5, 0, 0, 6, 0, 3, 4, 0x4b1528),
    ]);
    this.teclas = this.input.keyboard.createCursorKeys();
    this.input.on('pointerup', (p) => { if (modo === 'edicion') tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE)); });
    this.scale.on('resize', () => (modo === 'edicion' ? this.encuadrarHogar() : null));
    this.redibujar();
    this.colocarPersonaje();
    this.seguirPersonaje();
  }

  redibujar() {
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
    this.dibujarEtiquetas();
  }

  dibujarEtiquetas() {
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas = [];
    if (modo !== 'edicion') return;
    const zoom = this.cameras.main.zoom;
    for (const e of espaciosActivos(estado)) {
      const r = distribucion.rects[e.id];
      const texto = this.add.text((r.x + r.w / 2) * TILE, (r.y + r.h / 2) * TILE, nombreVisible(estado, e), {
        fontFamily: 'system-ui, sans-serif', fontSize: `${Math.round(12 / zoom)}px`, color: '#2a221c',
        backgroundColor: 'rgba(242,234,211,0.85)', padding: { x: 2 / zoom, y: 1 / zoom },
      }).setOrigin(0.5);
      this.etiquetas.push(texto);
    }
  }

  colocarPersonaje() {
    this.personaje.setPosition(jugador.x * TILE + TILE / 2, jugador.y * TILE + TILE / 2);
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[jugador.direccion]);
  }

  seguirPersonaje() {
    const cam = this.cameras.main;
    cam.setZoom(ZOOM_EXPLORACION);
    cam.startFollow(this.personaje, true);
  }

  encuadrarHogar() {
    const cam = this.cameras.main;
    const altoPanel = $('panel').offsetHeight;
    const zoom = Math.min(cam.width / (distribucion.ancho * TILE), (cam.height - altoPanel) / (distribucion.alto * TILE)) * 0.95;
    cam.stopFollow();
    cam.setZoom(zoom);
    cam.centerOn((distribucion.ancho * TILE) / 2, (distribucion.alto * TILE) / 2 + altoPanel / 2 / zoom);
    this.dibujarEtiquetas();
  }

  direccionActual() {
    const t = this.teclas;
    if (t.up.isDown) return 'arriba';
    if (t.down.isDown) return 'abajo';
    if (t.left.isDown) return 'izquierda';
    if (t.right.isDown) return 'derecha';
    return direccionTactil;
  }

  mover(direccion) {
    if (moviendo || modo !== 'exploracion') return;
    const r = paso(distribucion, jugador, direccion);
    jugador = { x: r.x, y: r.y, direccion: r.direccion };
    if (!r.movio) { this.colocarPersonaje(); return; }
    moviendo = true;
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[direccion]);
    this.tweens.add({
      targets: this.personaje, x: r.x * TILE + TILE / 2, y: r.y * TILE + TILE / 2, duration: MS_POR_CASILLA, ease: 'Linear',
      onComplete: () => {
        moviendo = false;
        if (this.direccionActual() === null) guardarPosicion(); // se detuvo tras caminar (FR-10)
      },
    });
  }

  update() {
    const dir = this.direccionActual();
    if (dir) this.mover(dir);
    $('depuracion').textContent = `${Math.round(this.game.loop.actualFps)} fps · regen ${ultimaRegeneracionMs.toFixed(1)} ms`;
  }
}

const juego = new Phaser.Game({
  type: Phaser.AUTO, parent: 'juego', backgroundColor: '#1d1d1d', pixelArt: true,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: Escena,
});
const escena = () => juego.scene.getScene('principal');

// ---------- Cruceta ----------
for (const boton of document.querySelectorAll('#cruceta button')) {
  const dir = boton.dataset.dir;
  boton.addEventListener('pointerdown', (ev) => { ev.preventDefault(); direccionTactil = dir; escena().mover(dir); });
  for (const fin of ['pointerup', 'pointerleave', 'pointercancel']) {
    boton.addEventListener(fin, () => { if (direccionTactil === dir) direccionTactil = null; });
  }
}

// ---------- Modo edición ----------
function mostrarExploracion(visible) {
  $('cruceta').style.display = visible ? 'grid' : 'none';
  $('editar').style.display = visible ? 'block' : 'none';
  $('panel').style.display = visible ? 'none' : 'block';
}

$('editar').addEventListener('click', () => {
  if (moviendo) return;
  guardarPosicion();
  modo = 'edicion';
  mostrarExploracion(false);
  pintarPanel();
  escena().encuadrarHogar();
});

$('listo').addEventListener('click', () => {
  modo = 'exploracion';
  jugador = resolverPosicion(distribucion, posGuardada);
  guardarPosicion();
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
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10)
  s.colocarPersonaje();
  s.encuadrarHogar();
  pintarPanel();
}

function confirmarEliminacion(id) {
  if (!requiereConfirmacion(estado, id)) return true;
  const espacio = buscarEspacio(estado, id);
  const c = consecuenciasDeEliminar(estado, id);
  const partes = [`¿Eliminar "${nombreVisible(estado, espacio)}"?`];
  if (c.banoSeElimina) partes.push('También se eliminará su baño interno.');
  if (c.tieneNombrePersonalizado) partes.push('Se perderá su nombre personalizado.');
  return window.confirm(partes.join(' '));
}

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
}

// ---------- Fichas ----------
let fichaActual = null;

function abrirFicha(tipo, id) {
  fichaActual = { tipo, id };
  const esEspacio = tipo === 'espacio';
  const espacio = esEspacio ? buscarEspacio(estado, id) : null;
  const miembro = esEspacio ? null : estado.miembros.find((m) => m.id === id);
  $('ficha-titulo').textContent = esEspacio ? nombreVisible(estado, espacio) : miembro.nombre;
  $('ficha-nombre').value = esEspacio ? (espacio.nombrePersonalizado ?? '') : miembro.nombre;
  $('ficha-nombre').placeholder = esEspacio ? nombreAutomatico(estado, espacio) : 'Nombre del personaje';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = esEspacio ? 'block' : 'none';
  $('ficha-eliminar').disabled = !esEspacio || !puedeEliminar(estado, id);
  $('ficha').style.display = 'flex';
}

const cerrarFicha = () => { $('ficha').style.display = 'none'; fichaActual = null; };

function tocarMapa(x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  if (x === jugador.x && y === jugador.y) { abrirFicha('miembro', estado.miembros[0].id); return; } // AC-5.6
  const clave = distribucion.espacioEn[y][x];
  if (clave && buscarEspacio(estado, clave)) abrirFicha('espacio', clave);
}

$('ficha').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const texto = $('ficha-nombre').value;
  const r = fichaActual.tipo === 'espacio'
    ? renombrarEspacio(estado, fichaActual.id, texto, ctx)
    : renombrarMiembro(estado, fichaActual.id, texto, ctx);
  if (!r.ok) { $('ficha-error').textContent = MENSAJES_ERROR[r.error]; return; }
  cerrarFicha();
  aplicar(r.estado);
});
$('ficha-nombre').addEventListener('input', () => { $('ficha-error').textContent = ''; });
$('ficha-cancelar').addEventListener('click', cerrarFicha);
$('ficha-eliminar').addEventListener('click', () => {
  const id = fichaActual.id;
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});

// ---------- Ciclo de vida ----------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && modo === 'exploracion') guardarPosicion();
});
if (inicio.aviso) avisar(inicio.aviso);
```

- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 40`, `# fail 0`
- [ ] Run: `cd poc && npm start`, abrir `http://localhost:8080` en el escritorio — expect: hogar inicial visible, el personaje camina con las flechas y "Editar" abre el panel
- [ ] Commit: `feat: add Phaser exploration scene and edit mode UI`

---

## Phase 5: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: `# pass 40`, `# fail 0`
- [ ] Servir en la red local: `cd poc && npm start`; en el Android (misma red Wi-Fi) abrir `http://<IP-del-computador>:8080`
- [ ] Verificar manualmente en el Android, marcando cada uno:
  - [ ] AC-1.1 a AC-1.3: borrar datos del sitio, recargar; hogar inicial sin bienvenida, "Personaje 1" en la sala, sin pasillos.
  - [ ] AC-2.1 a AC-2.5: tocar y mantener cada dirección; choques contra paredes y muebles; cruzar puertas sin transición. Con cronómetro: 8 casillas en ~2 s al mantener presionado.
  - [ ] AC-3.1 a AC-3.8: entrar a edición; + y − en cada tipo hasta sus límites; comedor sobre la sala; pasillo al tercer espacio de una zona.
  - [ ] AC-4.1 a AC-4.9: baños en orden, pista "Siguiente", − quita el más reciente, eliminar cuarto con baño (se mueve o pide confirmación y cancelar no cambia nada).
  - [ ] AC-5.1 a AC-5.6: fichas, renumeración, confirmaciones, Eliminar desactivado en mínimos y baño común, toque sobre el personaje.
  - [ ] AC-6.1 a AC-6.7: renombres válidos e inválidos con sus mensajes; campo limitado a 20 caracteres.
  - [ ] AC-7.1 a AC-7.4: cerrar la pestaña y reabrir; mandar a segundo plano; desplazar un cuarto con el personaje dentro; eliminar el espacio del personaje.
  - [ ] AC-8.1 a AC-8.5: cubiertos por pruebas automáticas (revisar que `npm test` los incluya).
- [ ] Medir rendimiento con el indicador de depuración: caminando de forma continua durante 30 s, los fps se mantienen en 60; en 20 cambios seguidos de modo edición, `regen` < 100 ms en todos. Anotar modelo de teléfono y resultados en el commit.
- [ ] Commit: `feat: complete map and home editor PoC`

---

## Phase 6 (added v1.1.0): Etiquetas de nombre en el mapa

**Implements:** FR-12, Story 9 | **Satisfies:** AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5 (y el lado visible de AC-6.1 y AC-6.6)
**Files:** `poc/src/etiquetas.js`, `poc/test/etiquetas.test.js`, `poc/src/juego.js`
**Interfaces:** Consumes: de `hogar.js`: `espaciosActivos`, `nombreVisible` (y en las pruebas `crearHogarInicial`, `agregarEspacio`, `eliminarEspacio`, `renombrarEspacio`, `espaciosDeTipo`, `banoDe`); de `distribucion.js`: `generarDistribucion`, `esTransitable` y la forma de la distribución (`rects`, `espacioEn`, `aparicion`); `crearCtx()` (Fase 0). Produces: `etiquetasDeEspacios(estado, distribucion, jugador, vista, medir?)` → `{ clave, texto, x, y, actual }[]`, una por espacio activo, con `x`/`y` en coordenadas de mapa medidas en casillas (pueden ser fraccionarias), `actual: true` solo para el espacio que contiene la casilla del personaje; `jugador` es `{ x, y }` o `null`; `vista` es `{ x, y, w, h }` en casillas o `null` cuando se ve todo el hogar; `medir(texto)` → `{ w, h }` (tamaño de la etiqueta en casillas; por defecto `{ w: 0, h: 0 }`).

> **Complexity note:** la lógica con reglas de la spec (qué etiquetas existen, qué texto llevan y cómo se desplaza la del espacio actual para seguir visible) queda en una función pura con pruebas automáticas; `etiquetas.js` pertenece a la capa del generador (sin Phaser ni DOM) y no agrega componentes. El dibujo de los textos en Phaser no tiene pruebas automáticas, igual que la Fase 4, y se verifica a mano.

Las etiquetas se calculan a partir del estado ya guardado y de la distribución; no se guardan (FR-12). Los pasillos no tienen nombre y no llevan etiqueta. Si el personaje está en un pasillo, ninguna etiqueta es la actual.

- [ ] Escribir las pruebas de la función pura:
```js
// test/etiquetas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, renombrarEspacio, espaciosDeTipo, banoDe } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { etiquetasDeEspacios } from '../src/etiquetas.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const centro = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const medir = () => ({ w: 3, h: 1 }); // etiqueta de 3 × 1 casillas

function casillaDe(d, clave) {
  for (let y = 0; y < d.alto; y++) for (let x = 0; x < d.ancho; x++) {
    if (d.espacioEn[y][x] === clave && esTransitable(d, x, y)) return { x, y };
  }
  return null;
}

test('AC-9.1: una etiqueta por espacio activo, centrada en su área', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const etiquetas = etiquetasDeEspacios(e, d, null, null);
  assert.deepEqual(etiquetas.map((t) => t.texto).sort(), ['Baño 1', 'Cocina 1', 'Dormitorio 1', 'Sala 1']);
  for (const t of etiquetas) {
    assert.deepEqual({ x: t.x, y: t.y }, centro(d.rects[t.clave]));
    assert.equal(t.actual, false);
  }
});

test('AC-9.1: muestra el nombre personalizado en lugar del automático', () => {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  const sala = espaciosDeTipo(e, 'sala')[0];
  e = renombrarEspacio(e, sala.id, 'Living', ctx).estado;
  const t = etiquetasDeEspacios(e, generarDistribucion(e), null, null).find((x) => x.clave === sala.id);
  assert.equal(t.texto, 'Living');
});

test('AC-9.3: tras renumerar y eliminar, las etiquetas son las vigentes y no hay etiquetas de espacios eliminados', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'dormitorio');
  const [d1, d2, d3] = espaciosDeTipo(e, 'dormitorio');
  e = eliminarEspacio(e, d2.id, ctx);
  const etiquetas = etiquetasDeEspacios(e, generarDistribucion(e), null, null);
  assert.equal(etiquetas.some((t) => t.clave === d2.id), false);
  assert.deepEqual([d1.id, d3.id].map((id) => etiquetas.find((t) => t.clave === id).texto), ['Dormitorio 1', 'Dormitorio 2']);
  assert.equal(etiquetas.length, 5); // sala, cocina, baño común y los dos dormitorios restantes
});

test('AC-9.2: la etiqueta del espacio actual se desplaza para seguir visible en la vista', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const salaId = espaciosDeTipo(e, 'sala')[0].id;
  const sala = d.rects[salaId];
  // El centro de la sala cae dentro de la vista, pero la etiqueta centrada se saldría por la derecha.
  const vista = { x: sala.x, y: sala.y, w: 6, h: 8 };
  const etiquetas = etiquetasDeEspacios(e, d, d.aparicion, vista, medir);
  const actual = etiquetas.filter((t) => t.actual);
  assert.deepEqual(actual.map((t) => t.clave), [salaId]);
  assert.ok(actual[0].x - 1.5 >= vista.x && actual[0].x + 1.5 <= vista.x + vista.w, 'etiqueta fuera de la vista en x');
  assert.ok(actual[0].y - 0.5 >= vista.y && actual[0].y + 0.5 <= vista.y + vista.h, 'etiqueta fuera de la vista en y');
  const otra = etiquetas.find((t) => !t.actual);
  assert.deepEqual({ x: otra.x, y: otra.y }, centro(d.rects[otra.clave])); // las demás no se mueven
});

test('AC-9.2: si la etiqueta cabe en la vista no se mueve', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  const vista = { x: 0, y: 0, w: d.ancho, h: d.alto };
  const actual = etiquetasDeEspacios(e, d, d.aparicion, vista, medir).find((t) => t.actual);
  assert.deepEqual({ x: actual.x, y: actual.y }, centro(sala));
});

test('AC-9.2: dentro de un baño interno la etiqueta actual es la del baño', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx);
  const d = generarDistribucion(e);
  const bano = banoDe(e, espaciosDeTipo(e, 'dormitorio')[0].id);
  const casilla = casillaDe(d, bano.id);
  assert.ok(casilla, 'el baño interno tiene casillas transitables');
  const actuales = etiquetasDeEspacios(e, d, casilla, null).filter((t) => t.actual);
  assert.deepEqual(actuales.map((t) => t.clave), [bano.id]);
});

test('AC-9.2: en un pasillo ninguna etiqueta es la actual (los pasillos no tienen nombre)', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'dormitorio', 'oficina');
  const d = generarDistribucion(e);
  const casilla = casillaDe(d, 'pasillo:der');
  assert.ok(casilla, 'hay un pasillo derecho transitable');
  const etiquetas = etiquetasDeEspacios(e, d, casilla, null);
  assert.equal(etiquetas.length, 6);
  assert.ok(etiquetas.every((t) => !t.actual));
});

test('etiquetasDeEspacios es pura y determinista', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const vista = { x: 8, y: 0, w: 6, h: 8 };
  const copia = structuredClone({ e, d });
  const a = etiquetasDeEspacios(e, d, d.aparicion, vista, medir);
  const b = etiquetasDeEspacios(e, d, d.aparicion, vista, medir);
  assert.deepEqual(a, b);
  assert.deepEqual({ e, d }, copia); // no muta sus entradas
});
```

- [ ] Run: `cd poc && node --test test/etiquetas.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/etiquetas.js`)
- [ ] Implementar la función pura:
```js
// src/etiquetas.js
import { espaciosActivos, nombreVisible } from './hogar.js';

const SIN_MEDIDA = () => ({ w: 0, h: 0 });

// Centro de una etiqueta de tamaño `tam` ajustado al tramo visible [inicio, fin] de un espacio.
function ajustarEje(centro, inicio, fin, tam) {
  if (fin - inicio <= tam) return (inicio + fin) / 2;
  return Math.min(Math.max(centro, inicio + tam / 2), fin - tam / 2);
}

// Etiqueta de nombre de cada espacio activo (FR-12), en coordenadas de mapa medidas en casillas.
// La del espacio que contiene al personaje se desplaza, si hace falta, hacia la parte visible de ese espacio.
export function etiquetasDeEspacios(estado, distribucion, jugador, vista, medir = SIN_MEDIDA) {
  const claveActual = jugador ? (distribucion.espacioEn[jugador.y]?.[jugador.x] ?? null) : null;
  return espaciosActivos(estado).map((espacio) => {
    const r = distribucion.rects[espacio.id];
    const texto = nombreVisible(estado, espacio);
    const actual = espacio.id === claveActual;
    let x = r.x + r.w / 2;
    let y = r.y + r.h / 2;
    if (actual && vista) {
      const { w, h } = medir(texto);
      const x0 = Math.max(r.x, vista.x);
      const x1 = Math.min(r.x + r.w, vista.x + vista.w);
      const y0 = Math.max(r.y, vista.y);
      const y1 = Math.min(r.y + r.h, vista.y + vista.h);
      if (x1 > x0 && y1 > y0) { // si el espacio no se ve en absoluto, no hay nada que ajustar
        x = ajustarEje(x, x0, x1, w);
        y = ajustarEje(y, y0, y1, h);
      }
    }
    return { clave: espacio.id, texto, x, y, actual };
  });
}
```
- [ ] Run: `cd poc && node --test test/etiquetas.test.js` — expect: PASS (`# pass 8`, `# fail 0`)
- [ ] Run: `cd poc && npm test` — expect: PASS (los 44 existentes más los 8 nuevos: `# pass 52`, `# fail 0`)
- [ ] Commit: `feat: add pure map label computation`

Capa de presentación (`poc/src/juego.js`). Verificación previa (falla esperada): en `http://localhost:8080`, en modo exploración no se ve ninguna etiqueta de espacio ni el nombre del personaje (hoy `dibujarEtiquetas` sale en seco fuera del modo edición y el personaje no tiene etiqueta).

- [ ] Reemplazar la creación de textos de `dibujarEtiquetas()` para que:
  - dibuje las etiquetas en **ambos modos** (quitar la salida anticipada `if (modo !== 'edicion') return;`) usando `etiquetasDeEspacios(estado, distribucion, jugadorEnCasilla, vista, medir)`; guarda los objetos de texto por `clave` para poder moverlos sin recrearlos;
  - mantenga un tamaño de texto legible constante en pantalla (`12 / zoom` px, como hoy) y vuelva a dibujarlas cuando cambia el zoom (al entrar a exploración con `seguirPersonaje()`, al encuadrar con `encuadrarHogar()`) o cambian los espacios o los nombres (`redibujar()`);
  - los textos sean solo visuales: **sin** `setInteractive()` y sin capturar entrada (AC-9.5).
- [ ] En `update()`, en modo exploración, recalcular cada fotograma la posición de la etiqueta actual: `vista` = `cam.worldView` convertido a casillas (dividir entre `TILE`), `jugadorEnCasilla` = `{ x: jugador.x, y: jugador.y }`, `medir(texto)` = ancho y alto del objeto de texto en píxeles de mundo entre `TILE`. Solo reposicionar objetos existentes (`setPosition`), sin crear ni destruir textos por fotograma. En modo edición `vista = null` (se ve todo el hogar) y no se reposiciona.
- [ ] Agregar la etiqueta del personaje: un texto con `estado.miembros[0].nombre`, origen `(0.5, 1)`, colocado justo encima del contenedor del personaje (`personaje.x`, `personaje.y - TILE * 0.75`) y actualizado en cada fotograma para que siga el movimiento del tween; se ve en exploración y en edición, con el mismo tamaño legible (`12 / zoom`); su texto se actualiza en `redibujar()` (que `aplicar()` ya invoca tras renombrar al personaje).
- [ ] Run: `cd poc && node --check src/juego.js && npm test` — expect: sin errores de sintaxis; `# pass 52`, `# fail 0`
- [ ] Verificación manual en el navegador de escritorio con el viewport de un teléfono (375 × 812): recorrer la sala y el dormitorio por la puerta; la etiqueta del espacio actual permanece visible siempre (AC-9.2); el nombre del personaje lo sigue (AC-9.4); renombrar un espacio y tocar **Listo** actualiza la etiqueta (AC-9.3); caminar sigue a 60 fps y la cruceta responde igual (AC-9.5).
- [ ] Verificación en el Android: recorrer todos los espacios sin entrar al modo edición y comprobar que siempre se ve en qué espacio estás; los fps del indicador se mantienen en 60 o más.
- [ ] Commit: `feat: show space and character name labels on the map`

---

## Plan Changelog

| Version | Phase | Change |
|---------|-------|--------|
| 1.1.0 | Phase 6 | Added: implements FR-12 y Story 9 (etiquetas de nombre de espacios y personaje sobre el mapa, en exploración y en edición); nuevo módulo puro `src/etiquetas.js` |

---

## Quickstart Validation

1. `cd poc && npm test` → `# pass 40`, `# fail 0`.
2. `npm start` y abrir `http://localhost:8080`: aparece el hogar inicial con el personaje en la sala.
3. Caminar con las flechas hasta el dormitorio cruzando la puerta.
4. Tocar **Editar** → + en Dormitorios y + en Oficina: aparece un pasillo a la derecha en menos de 100 ms (ver indicador).
5. + en Baños: el baño aparece dentro de "Dormitorio 1" y la pista indica "Siguiente: Dormitorio 2".
6. Tocar "Dormitorio 2" → renombrar a "Cuarto de Bryam" → Eliminar → confirmar.
7. **Listo**, recargar la página: el hogar, los nombres y la posición del personaje se mantienen.
8. *(v1.1.0)* Sin entrar al modo edición, caminar de la sala al dormitorio: el nombre del espacio donde estás está siempre visible y el nombre del personaje lo acompaña.
