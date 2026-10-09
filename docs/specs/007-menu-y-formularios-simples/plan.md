# Implementation Plan: Menú por secciones y formularios simples

**Spec:** docs/specs/007-menu-y-formularios-simples/spec.md (v1.0.0)
**Decisions:** docs/adr/007-aspecto-miembros-formato-v7.md
**Data model:** docs/specs/007-menu-y-formularios-simples/data-model.md
**Created:** 2026-10-09

## Global Constraints

- **Aspecto de un familiar:** campo `aspecto` con siete claves cerradas —`adulto`, `adulta`, `nino`, `nina`, `anciano`, `anciana`, `neutro`— con etiquetas "Adulto", "Adulta", "Niño", "Niña", "Anciano", "Anciana", "Neutro" e iconos 👨 👩 👦 👧 👴 👵 🧑. Reemplaza a `genero`; `parentesco` desaparece del modelo. El propietario y las mascotas tienen `aspecto: null`. Por omisión en el alta: `neutro`. Colores: masculinos (`adulto`, `nino`, `anciano`) comparten uno, femeninos (`adulta`, `nina`, `anciana`) otro y `neutro` un tercero; `nino` y `nina` se dibujan más pequeños (`escala` < 1), el resto con `escala` 1.
- **Especie de una mascota:** seis claves cerradas —`perro`, `gato`, `conejo`, `hamster`, `loro`, `otro`— con etiquetas "Perro", "Gato", "Conejo", "Hámster", "Loro", "Otro", iconos 🐶 🐱 🐰 🐹 🦜 🐾 y un color de marcador propio, distinto en las seis. Por omisión en el alta: `otro`. Las claves `perro`, `gato` y `otro` no cambian.
- **Mensajes nuevos (texto exacto):** "Elige un aspecto de la lista." (`aspecto`), "Elige una especie de la lista." (`especie`, ya existe), "Las mascotas no pueden encargarse de actividades." (`mascota`), "Con estos lugares se superarían las 50 actividades pendientes." (`limite-varios`), "Aún no hay familiares", "Aún no hay mascotas". Marcadores de campo: "Nombre del familiar", "Nombre de la mascota", "Nombre de la actividad".
- **Responsable de una actividad:** solo una persona activa (propietario o familiar), es decir, `puedeJugar(estado, miembroId)`. Una mascota activa se rechaza con `mascota`; cualquier otro miembro inexistente o eliminado, con `miembro` (el orden de comprobación de `validarActividad` no cambia). Los intercambios ya son solo entre personas.
- **Sugerencias de actividad (lista cerrada, en este orden, nombre ≤ 30 caracteres):** Lavar platos (platos), Barrer (barrer), Trapear (limpiar), Limpiar el baño (limpiar), Lavar ropa (ropa), Sacar la basura (basura), Hacer compras (compras), Regar las plantas (plantas), Dar de comer a la mascota (mascota), Pasear al perro (mascota). Con el campo vacío se ven las primeras 6; con texto, las que lo contienen. La comparación ignora mayúsculas, acentos y espacios al inicio y al final. Icono genérico: `otra` (📌).
- **Icono editable:** se deduce del nombre, no se guarda. Con un nombre igual a una sugerencia, el icono es el suyo y no se puede cambiar; si no, es el elegido a mano o el genérico y se puede cambiar con un selector de los 9 iconos de la 003. Un icono elegido a mano se mantiene mientras el texto no coincida con una sugerencia, se descarta al coincidir, y tras dejar de coincidir vuelve a `otra`. Al editar una actividad existente se respeta el icono guardado hasta que el nombre pase a coincidir con una sugerencia.
- **Recurrencia en la ficha:** un solo selector "Una vez" (puntual) / "Cada día" / "Cada 2 días" / "Cada 3 días" / "Cada 7 días" / "Cada 14 días" / "Cada 30 días" (repetitiva); el modelo guardado (`tipo`, `frecuenciaDias`) no cambia. Fecha por omisión: hoy (puede ser pasada). Línea-resumen: `📅 <Hoy|AAAA-MM-DD|Sin fecha> · <recurrencia> · <Sin lugar|nombre|n lugares>`.
- **Varios lugares:** `agregarActividades(estado, datos, espacioIds, ctx)` crea una actividad independiente (id propio, misma persona, fecha, tipo, frecuencia, nombre e icono) por cada espacio pedido, en el orden de `espaciosActivos(estado)` (no en el orden pedido); sin espacios crea una sin espacio. Es atómica: si el total superaría `LIMITE_ACTIVIDADES` (mismo conteo que hoy: no eliminadas y no hechas) o cualquier dato o espacio es inválido, no crea ninguna y devuelve el estado original. Al editar, una actividad tiene un solo lugar.
- **Barra y drawers:** cuatro pestañas fijas —Espacios 🏠, Familia 👨‍👩‍👧, Actividades 📋, Intercambios 🔄— siempre visibles; abrir una activa el modo edición (hogar completo, personajes inmóviles) y muestra su drawer con título y "Listo"; cambiar de pestaña no sale de la edición ni reencuadra la cámara; "Listo" o tocar la pestaña activa vuelve a exploración. El drawer mide el 45 % de la altura de la pantalla (siempre ≤ la mitad), por encima de la barra, y se recorre por dentro. La pestaña Intercambios dice "Intercambios (n)" con n propuestas recibidas vigentes de quien juega. La app abre siempre en exploración y no guarda drawer ni pestaña.
- **El mapa en edición responde según la sección:** Espacios → ficha del espacio; Familia → ficha del propietario o del habitante (en ese orden) y la hoja "Fuera de casa" desde el cartel; Actividades → hoja de la burbuja con Editar y Eliminar; Intercambios → nada. En exploración, como en las features 003 y 004.
- **Indicador "Juega: <nombre>":** siempre visible arriba a la derecha; abre "¿Quién juega?" también en edición. Cambiar de jugador en edición mantiene el drawer y su pestaña (con el contenido de la nueva persona), cierra fichas y hojas, no mueve a nadie salvo la aparición en la entrada de un familiar que estaba fuera de casa, y deja la cámara en el encuadre completo.
- **Actividades:** pestañas "Pendientes | Hechas" (Pendientes al abrir). Hechas = el historial de la 006 sin cambios de reglas; su filtro ofrece a las personas y solo a las mascotas con alguna entrada, y vuelve a "Todos" cada vez que se muestra la pestaña. No hay botones "Editar", "Intercambios" ni "Historial" sueltos, ni "Hecho" en el drawer.
- **Tecla Espacio:** el motor gráfico solo registra las cuatro flechas y sin captura global, de modo que Espacio y las demás teclas de escritura llegan a los campos de texto.
- **Documento `version: 7`** en la misma clave `livin:datos:v1`. Las versiones 1 a 6 se migran al cargar (cadena de migraciones puras; `migrarAV7(estado, reloj)` recibe el reloj inyectado y solo lo llama si hay algo que dar de baja) y se guardan como v7 en el siguiente guardado; abrir no reescribe. v6→v7: el propietario se identifica por su membresía y queda con `aspecto: null`; cada otra persona pasa `genero` → `aspecto` (femenino → `adulta`, masculino → `adulto`, `otro` o ausente → `neutro`); se quitan `genero` y `parentesco` de todos los miembros (las mascotas quedan con `aspecto: null`); cada actividad no eliminada cuyo responsable sea una mascota activa se da de baja (`eliminadoEn` y auditoría con `tocar`); el historial no se toca. Un v7 es ilegible (aviso y hogar inicial) si no cumple las condiciones de las versiones anteriores que siguen vigentes o si: una persona activa no propietaria tiene un `aspecto` fuera de la lista, una mascota activa tiene una `especie` fuera de la lista o un `aspecto` no nulo, el propietario tiene `aspecto`, o una actividad no eliminada tiene como responsable a un miembro que no es una persona activa. Las listas de `parentesco`, `genero` y `especie` hasta la v6 se conservan solo dentro de `almacen.js`, para validar documentos anteriores.
- **Rendimiento:** 60 cuadros por segundo con 8 familiares, 4 mascotas, el propietario caminando solo, 50 actividades y 200 entradas; abrir un drawer, cambiar de pestaña, abrir una ficha o un selector, elegir una sugerencia y guardar (incluso en varios lugares) muestran el resultado en menos de 100 ms.
- Los textos del usuario (nombres de miembros, espacios y actividades) se insertan siempre como texto, nunca como marcado. Ningún dato sale del dispositivo. Sin dependencias npm; Phaser 3.80.1 desde cdnjs; arte de marcador original. `formularios.js`, `secciones.js` y el resto del dominio no importan Phaser ni el DOM.

**Pre-implementation gates:**
- *Simplicity:* siguen siendo 3 componentes. Dominio y lógica pura (`catalogo.js`, `hogar.js`, `actividades.js`, `almacen.js`, `historial.js` y los nuevos `formularios.js` y `secciones.js`), lógica pura de mapa, tiempo y movimiento (sin cambios) y presentación (`juego.js`, `index.html`). Sin dependencias nuevas. ✓
- *Anti-Abstraction:* un único modelo canónico (objetos planos del estado guardado). Las sugerencias, el icono editable, el resumen, las pestañas y la respuesta del mapa son resultados de funciones puras, no vistas guardadas ni clases; Phaser y el DOM se usan directamente. ✓
- *Integration-First:* los contratos (exportaciones, catálogos, mensajes, formato v7) se fijan con pruebas en la Fase 0. ✓

---

## Goal

Que agregar una actividad, un familiar o una mascota tome unos segundos, que cada sección del hogar (espacios, familia, actividades e intercambios) tenga su propio drawer en una barra inferior, que las mascotas no puedan encargarse de actividades, que la tecla Espacio funcione en escritorio, y que los hogares guardados con las features 001 a 006 se abran en el formato nuevo (v7). La lógica queda cubierta por pruebas automáticas (301 existentes + 39 nuevas = 340).

Archivos (bajo `poc/`):
- **Lógica:** `src/catalogo.js` (aspectos, especies, sugerencias), `src/hogar.js` (aspecto, hogar inicial v7), `src/actividades.js` (responsables personas, varios lugares), `src/almacen.js` (formato v7 y migración), `src/historial.js` (filtro), `src/formularios.js` (nuevo), `src/secciones.js` (nuevo).
- **Presentación:** `src/juego.js`, `index.html`.
- **Pruebas en `test/`:** `ayuda.js` (helper legado), `contrato-menu.test.js`, `catalogo.test.js`, `formularios.test.js`, `secciones.test.js` (nuevos); `habitantes.test.js`, `contrato-habitantes.test.js`, `actividades.test.js`, `almacen.test.js`, `calificaciones.test.js`, `historial.test.js`, `intercambios.test.js`, `contrato-rutinas.test.js`, `contrato-intercambios.test.js`, `contrato-historial.test.js` y otras que crean familiares (adaptadas).

---

## Phase 0: Contracts and Tests First

**Implements:** FR-5, FR-6, FR-8, FR-9, FR-10, FR-14, FR-1 y FR-2 (contrato) | **Satisfies:** — (fija contratos; los AC se satisfacen en las fases siguientes)
**Files:** `poc/test/contrato-menu.test.js`
**Interfaces:** Consumes: nada. Produces: el contrato de nombres exportados por `src/catalogo.js` (`ASPECTOS`, `DATOS_ASPECTO`, `ASPECTO_INICIAL`, `ESPECIES`, `DATOS_ESPECIE`, `ESPECIE_INICIAL`, `SUGERENCIAS`, `SUGERENCIAS_INICIALES`, `ICONO_GENERICO`; sin `PARENTESCOS` ni `GENEROS`), `src/hogar.js` (hogar inicial `version: 7`; `MENSAJES_ERROR.aspecto`), `src/actividades.js` (`agregarActividades`, `MENSAJES_ACTIVIDAD.mascota` y `['limite-varios']`), `src/almacen.js` (`migrarAV7`), `src/formularios.js` y `src/secciones.js`.

Fija la forma pública de lo nuevo antes de implementarlo. La prueba de contrato queda en rojo (`ERR_MODULE_NOT_FOUND` o exportaciones que faltan) hasta el final de la Fase 4; las Fases 1 a 4 se verifican con sus propios archivos de prueba.

- [ ] Escribir las pruebas de contrato:
```js
// test/contrato-menu.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as actividades from '../src/actividades.js';
import * as almacen from '../src/almacen.js';
import * as formularios from '../src/formularios.js';
import * as secciones from '../src/secciones.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo: aspectos, especies y sugerencias', () => {
  assert.deepEqual(Object.keys(catalogo.ASPECTOS), ['adulto', 'adulta', 'nino', 'nina', 'anciano', 'anciana', 'neutro']);
  assert.deepEqual(Object.keys(catalogo.DATOS_ASPECTO), Object.keys(catalogo.ASPECTOS));
  assert.deepEqual(Object.values(catalogo.DATOS_ASPECTO).map((d) => d.icono), ['👨', '👩', '👦', '👧', '👴', '👵', '🧑']);
  assert.equal(catalogo.ASPECTO_INICIAL, 'neutro');
  assert.deepEqual(Object.keys(catalogo.ESPECIES), ['perro', 'gato', 'conejo', 'hamster', 'loro', 'otro']);
  assert.deepEqual(Object.keys(catalogo.DATOS_ESPECIE), Object.keys(catalogo.ESPECIES));
  assert.deepEqual(Object.values(catalogo.DATOS_ESPECIE).map((d) => d.icono), ['🐶', '🐱', '🐰', '🐹', '🦜', '🐾']);
  assert.equal(catalogo.ESPECIE_INICIAL, 'otro');
  assert.equal(catalogo.PARENTESCOS, undefined);
  assert.equal(catalogo.GENEROS, undefined);
  assert.equal(catalogo.SUGERENCIAS.length, 10);
  assert.equal(catalogo.SUGERENCIAS_INICIALES, 6);
  assert.equal(catalogo.ICONO_GENERICO, 'otra');
});

test('contrato del modelo y del almacén: hogar inicial v7, mensajes y migración', () => {
  const e = hogar.crearHogarInicial(crearCtx());
  assert.equal(e.version, 7);
  assert.deepEqual([e.miembros[0].aspecto, 'genero' in e.miembros[0], 'parentesco' in e.miembros[0]], [null, false, false]);
  assert.equal(typeof hogar.MENSAJES_ERROR.aspecto, 'string');
  assert.equal(hogar.MENSAJES_ERROR.parentesco, undefined);
  assert.equal(hogar.MENSAJES_ERROR.genero, undefined);
  assert.equal(typeof almacen.migrarAV7, 'function');
});

test('contrato de las actividades: varios lugares y responsables personas', () => {
  assert.equal(typeof actividades.agregarActividades, 'function');
  assert.equal(actividades.MENSAJES_ACTIVIDAD.mascota, 'Las mascotas no pueden encargarse de actividades.');
  assert.equal(actividades.MENSAJES_ACTIVIDAD['limite-varios'], 'Con estos lugares se superarían las 50 actividades pendientes.');
});

test('contrato de los módulos puros de la 007: formularios y secciones', () => {
  for (const f of ['normalizarTexto', 'sugerenciasPara', 'sugerenciaExacta', 'iconoDeFicha', 'iconoDeEdicion', 'datosDeRecurrencia',
    'valorDeRecurrencia', 'etiquetaDeRecurrencia', 'resumenDeFicha', 'inicialDe']) {
    assert.equal(typeof formularios[f], 'function', f);
  }
  assert.ok(Array.isArray(formularios.OPCIONES_RECURRENCIA));
  assert.deepEqual(secciones.SECCIONES.map((s) => s.clave), ['espacios', 'familia', 'actividades', 'intercambios']);
  for (const f of ['textoPestana', 'accionDeToque']) assert.equal(typeof secciones[f], 'function', f);
});
```
- [ ] Run: `cd poc && node --test test/contrato-menu.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/formularios.js`)
- [ ] Commit: `test(poc): add contract tests for the section menu and the simple forms` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 1: Aspecto, especie y responsables personas

**Implements:** FR-5 (modelo), FR-6 (modelo), FR-10 | **Satisfies:** AC-5.4, AC-5.5, AC-5.8, AC-5.9, AC-5.11, AC-6.4, AC-6.7, AC-6.8, AC-6.9, AC-11.2, AC-11.3, AC-11.4, AC-11.5, AC-11.6 (la parte de pantalla de AC-5.3, AC-6.3 y AC-11.1 se satisface en la Fase 6)
**Files:** `poc/src/catalogo.js`, `poc/src/hogar.js`, `poc/src/actividades.js`, `poc/src/almacen.js` (solo cabecera), `poc/test/ayuda.js`, `poc/test/catalogo.test.js`, `poc/test/habitantes.test.js`, `poc/test/contrato-habitantes.test.js`, `poc/test/actividades.test.js`, `poc/test/calificaciones.test.js`, `poc/test/historial.test.js`, `poc/test/intercambios.test.js`, y las pruebas que crean familiares (`aspecto.test.js`, `jugador.test.js`, `rutinas.test.js`, `rutinas-lugar.test.js`)
**Interfaces:** Consumes: `agregarHabitante`, `editarHabitante`, `validarActividad` (003), `puedeJugar` (005). Produces: desde `catalogo.js`: `ASPECTOS` (claves → etiquetas), `DATOS_ASPECTO` (`{ icono, color, escala }` por clave), `ASPECTO_INICIAL = 'neutro'`, `ESPECIES` (seis), `DATOS_ESPECIE` (`{ icono, color }`), `ESPECIE_INICIAL = 'otro'`, `SUGERENCIAS` (`[{ nombre, icono }]`), `SUGERENCIAS_INICIALES = 6`, `ICONO_GENERICO = 'otra'`; sin `PARENTESCOS` ni `GENEROS`. Desde `hogar.js`: `agregarHabitante(estado, 'familiar', { nombre, aspecto }, ctx)` y `editarHabitante` guardan `aspecto` (error `aspecto` si falta o no es de la lista); las mascotas guardan `especie` y `aspecto: null`; `crearHogarInicial` devuelve `version: 7` con el propietario sin `aspecto`, `genero` ni `parentesco`; `MENSAJES_ERROR.aspecto`. Desde `actividades.js`: `agregarActividad`/`editarActividad` rechazan una mascota con el error `mascota`. Desde `test/ayuda.js`: `agregarActividadLegada(estado, datos, ctx)`.

Cambia el modelo de los miembros y la regla de responsables. Como el documento guardado aún no entiende la v7 (Fase 2), esta fase se verifica con los archivos de prueba que no pasan por el almacén; el resto de la suite vuelve a verde al final de la Fase 2.

- [ ] Escribir la prueba del catálogo (`test/catalogo.test.js`, nueva):
```js
// test/catalogo.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASPECTOS, DATOS_ASPECTO, ESPECIES, DATOS_ESPECIE, SUGERENCIAS, ICONOS, MAX_NOMBRE_ACTIVIDAD,
} from '../src/catalogo.js';

test('AC-5.9: los aspectos masculinos comparten color, los femeninos otro y el neutro un tercero, todos distintos', () => {
  const color = (clave) => DATOS_ASPECTO[clave].color;
  assert.equal(new Set(['adulto', 'nino', 'anciano'].map(color)).size, 1);
  assert.equal(new Set(['adulta', 'nina', 'anciana'].map(color)).size, 1);
  assert.equal(new Set([color('adulto'), color('adulta'), color('neutro')]).size, 3);
});

test('AC-5.9: un niño o una niña se dibuja más pequeño que un adulto; un anciano o una anciana, igual', () => {
  const escala = (clave) => DATOS_ASPECTO[clave].escala;
  assert.ok(escala('nino') < escala('adulto') && escala('nina') < escala('adulta'));
  assert.equal(escala('anciano'), escala('adulto'));
  assert.equal(escala('anciana'), escala('adulta'));
  assert.equal(escala('neutro'), escala('adulto'));
  assert.deepEqual(Object.values(ASPECTOS), ['Adulto', 'Adulta', 'Niño', 'Niña', 'Anciano', 'Anciana', 'Neutro']);
});

test('AC-6.4: las seis especies tienen un color propio y sus etiquetas', () => {
  assert.equal(new Set(Object.values(DATOS_ESPECIE).map((d) => d.color)).size, 6);
  assert.deepEqual(Object.values(ESPECIES), ['Perro', 'Gato', 'Conejo', 'Hámster', 'Loro', 'Otro']);
});

test('AC-8.4: las diez sugerencias, con su icono, nombres de a lo sumo 30 caracteres y sin repetir', () => {
  assert.deepEqual(SUGERENCIAS.map((s) => [s.nombre, s.icono]), [
    ['Lavar platos', 'platos'], ['Barrer', 'barrer'], ['Trapear', 'limpiar'], ['Limpiar el baño', 'limpiar'], ['Lavar ropa', 'ropa'],
    ['Sacar la basura', 'basura'], ['Hacer compras', 'compras'], ['Regar las plantas', 'plantas'],
    ['Dar de comer a la mascota', 'mascota'], ['Pasear al perro', 'mascota'],
  ]);
  assert.ok(SUGERENCIAS.every((s) => s.nombre.length <= MAX_NOMBRE_ACTIVIDAD && Object.hasOwn(ICONOS, s.icono)));
  assert.equal(new Set(SUGERENCIAS.map((s) => s.nombre.toLocaleLowerCase('es'))).size, SUGERENCIAS.length);
});
```
- [ ] Run: `cd poc && node --test test/catalogo.test.js` — expect: FAIL (los exports nuevos no existen)
- [ ] Implementar el catálogo. En `src/catalogo.js`, reemplazar el bloque de habitantes:
```js
// Habitantes (feature 002): listas cerradas y límites. Las claves se guardan; las etiquetas se muestran.
export const PARENTESCOS = {
  pareja: 'Pareja', hijo: 'Hijo/a', padre_madre: 'Padre o madre', hermano: 'Hermano/a', abuelo: 'Abuelo/a', otro: 'Otro familiar',
};
export const GENEROS = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
export const ESPECIES = { perro: 'Perro', gato: 'Gato', otro: 'Otro' };
export const LIMITES_HABITANTES = { familiar: 8, mascota: 4 };
```
  por:
```js
// Habitantes (features 002 y 007, ADR-007 de aspecto): listas cerradas y límites. Las claves se guardan; las etiquetas se muestran.
// El aspecto de un familiar mezcla edad y género; cada uno lleva su icono, su color de marcador y su escala de dibujo.
export const ASPECTOS = {
  adulto: 'Adulto', adulta: 'Adulta', nino: 'Niño', nina: 'Niña', anciano: 'Anciano', anciana: 'Anciana', neutro: 'Neutro',
};
export const DATOS_ASPECTO = {
  adulto: { icono: '👨', color: 0x3a7bd5, escala: 1 },
  adulta: { icono: '👩', color: 0xe8833a, escala: 1 },
  nino: { icono: '👦', color: 0x3a7bd5, escala: 0.75 },
  nina: { icono: '👧', color: 0xe8833a, escala: 0.75 },
  anciano: { icono: '👴', color: 0x3a7bd5, escala: 1 },
  anciana: { icono: '👵', color: 0xe8833a, escala: 1 },
  neutro: { icono: '🧑', color: 0x8e6bbf, escala: 1 },
};
export const ASPECTO_INICIAL = 'neutro';
export const ESPECIES = { perro: 'Perro', gato: 'Gato', conejo: 'Conejo', hamster: 'Hámster', loro: 'Loro', otro: 'Otro' };
export const DATOS_ESPECIE = {
  perro: { icono: '🐶', color: 0x9c6b3c },
  gato: { icono: '🐱', color: 0x7d7d7d },
  conejo: { icono: '🐰', color: 0xd9b8c4 },
  hamster: { icono: '🐹', color: 0xe0b85c },
  loro: { icono: '🦜', color: 0x1f9bb0 },
  otro: { icono: '🐾', color: 0x4f9d69 },
};
export const ESPECIE_INICIAL = 'otro';
export const LIMITES_HABITANTES = { familiar: 8, mascota: 4 };
```
  y, a continuación del bloque `// Actividades (feature 003)` (después de `MAX_NOMBRE_ACTIVIDAD`), agregar:
```js
// Sugerencias de actividad (feature 007): lista cerrada de selección rápida; cada una fija el nombre y el icono. Sin texto se ven las primeras.
export const SUGERENCIAS = [
  { nombre: 'Lavar platos', icono: 'platos' },
  { nombre: 'Barrer', icono: 'barrer' },
  { nombre: 'Trapear', icono: 'limpiar' },
  { nombre: 'Limpiar el baño', icono: 'limpiar' },
  { nombre: 'Lavar ropa', icono: 'ropa' },
  { nombre: 'Sacar la basura', icono: 'basura' },
  { nombre: 'Hacer compras', icono: 'compras' },
  { nombre: 'Regar las plantas', icono: 'plantas' },
  { nombre: 'Dar de comer a la mascota', icono: 'mascota' },
  { nombre: 'Pasear al perro', icono: 'mascota' },
];
export const SUGERENCIAS_INICIALES = 6;
export const ICONO_GENERICO = 'otra';
```
- [ ] Run: `cd poc && node --test test/catalogo.test.js` — expect: PASS (4 pruebas)

- [ ] Cabecera de `src/almacen.js`: las listas de parentesco y género dejan el catálogo, así que el almacén las guarda para validar documentos anteriores. Reemplazar las líneas 2–6 (los `import`) por:
```js
import { crearHogarInicial, tocar } from './hogar.js';
import {
  ASPECTOS, ASPECTO_INICIAL, ESPECIES, ICONOS, FRECUENCIAS, DIAS_RUTINA, PASO_RUTINA, ESTADOS_INTERCAMBIO, MIN_ESTRELLAS, MAX_ESTRELLAS,
} from './catalogo.js';
import { esFechaValida } from './fechas.js';
```
  Debajo de `const nuloOEnLista = ...` agregar:
```js
// Listas cerradas hasta la versión 6 (features 002 a 006), solo para validar y migrar documentos anteriores (ADR-007 de aspecto).
const PARENTESCOS_V6 = {
  pareja: 'Pareja', hijo: 'Hijo/a', padre_madre: 'Padre o madre', hermano: 'Hermano/a', abuelo: 'Abuelo/a', otro: 'Otro familiar',
};
const GENEROS_V6 = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
const ESPECIES_V6 = { perro: 'Perro', gato: 'Gato', otro: 'Otro' };
const ASPECTO_DE_GENERO_V6 = { femenino: 'adulta', masculino: 'adulto', otro: 'neutro' };
```
  Y dentro de `miembrosValidos` (que en la Fase 2 pasa a ser la validación de la v6) cambiar los nombres de las listas:
```js
    if (m.tipo === 'mascota') return m.parentesco === null && m.genero === null && enLista(ESPECIES_V6, m.especie);
    if (m.tipo === 'persona') return m.especie === null && nuloOEnLista(PARENTESCOS_V6, m.parentesco) && nuloOEnLista(GENEROS_V6, m.genero);
```
  (`ASPECTOS`, `ASPECTO_INICIAL`, `ESPECIES` y `tocar` se importan ya, pero se usan en la Fase 2.)

- [ ] Escribir las pruebas del modelo. En `test/habitantes.test.js`, aplicar estos cambios (el resto del archivo no cambia):
  1. La línea de import del catálogo (agregar tras los imports de `../src/hogar.js`):
```js
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
```
  2. Reemplazar `const FAMILIAR = { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' };` por:
```js
const FAMILIAR = { nombre: 'Diana', aspecto: 'adulta' };
```
  3. Reemplazar las cuatro pruebas siguientes (el hogar inicial, el alta de un familiar, el alta de una mascota y los datos que faltan) por:
```js
test('FR-1, AC-9.4 (002), FR-11 (003), FR-10 (004), FR-12 (005), FR-8 (006), FR-14 (007): el hogar inicial tiene versión 7, sin actividades, bloques, intercambios ni historial, y el personaje del propietario no es un habitante', () => {
  const e = crearHogarInicial(crearCtx());
  assert.equal(e.version, 7);
  assert.deepEqual([e.actividades, e.bloques, e.intercambios, e.historial], [[], [], [], []]);
  const [propietario] = e.miembros;
  assert.deepEqual([propietario.tipo, propietario.aspecto, propietario.especie], ['persona', null, null]);
  assert.deepEqual(['genero' in propietario, 'parentesco' in propietario], [false, false]);
  assert.equal(esPropietario(e, propietario), true);
  assert.deepEqual(habitantes(e), []);
  assert.deepEqual([contarHabitantes(e, 'familiar'), contarHabitantes(e, 'mascota')], [0, 0]);
});

test('AC-5.4, AC-10.3: alta de un familiar con nombre y aspecto, sin género ni parentesco', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'familiar', FAMILIAR, ctx);
  const [f] = familiares(e);
  assert.deepEqual([f.nombre, f.tipo, f.aspecto, f.especie, f.cuentaId], ['Diana', 'persona', 'adulta', null, null]);
  assert.deepEqual(['genero' in f, 'parentesco' in f], [false, false]);
  assert.equal(f.hogarId, e.hogares[0].id);
  assert.equal(contarHabitantes(e, 'familiar'), 1);
  assert.deepEqual(mascotas(e), []);
});

test('AC-6.4, AC-10.3: alta de una mascota con nombre y especie, sin aspecto', () => {
  const ctx = crearCtx();
  const e = alta(crearHogarInicial(ctx), 'mascota', { ...MASCOTA, aspecto: 'adulta' }, ctx);
  const [m] = mascotas(e);
  assert.deepEqual([m.nombre, m.tipo, m.aspecto, m.especie, m.cuentaId], ['Firulais', 'mascota', null, 'perro', null]);
  assert.deepEqual(['genero' in m, 'parentesco' in m], [false, false]);
  assert.equal(contarHabitantes(e, 'mascota'), 1);
});

test('AC-5.4, AC-6.4: cada aspecto y cada especie de las listas cerradas se acepta y se guarda', () => {
  const ctx = crearCtx();
  for (const aspecto of Object.keys(ASPECTOS)) {
    const r = agregarHabitante(crearHogarInicial(ctx), 'familiar', { nombre: 'Ana', aspecto }, ctx);
    assert.equal(r.ok, true, aspecto);
    assert.equal(familiares(r.estado)[0].aspecto, aspecto);
  }
  for (const especie of Object.keys(ESPECIES)) {
    const r = agregarHabitante(crearHogarInicial(ctx), 'mascota', { nombre: 'Michi', especie }, ctx);
    assert.equal(r.ok, true, especie);
    assert.equal(mascotas(r.estado)[0].especie, especie);
  }
});

test('AC-5.11, AC-6.9, FR-2: faltan datos o están fuera de las listas cerradas', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const casos = [
    ['familiar', { nombre: 'Ana' }, 'aspecto'],
    ['familiar', { nombre: 'Ana', aspecto: 'robot' }, 'aspecto'],
    ['familiar', { nombre: 'Ana', aspecto: 'toString' }, 'aspecto'],
    ['familiar', { nombre: 'Ana', aspecto: 'femenino' }, 'aspecto'], // la clave antigua de género ya no vale
    ['mascota', { nombre: 'Michi' }, 'especie'],
    ['mascota', { nombre: 'Michi', especie: 'canario' }, 'especie'],
    ['mascota', { nombre: 'Michi', especie: 'toString' }, 'especie'],
    ['familiar', { nombre: '', aspecto: 'adulta' }, 'vacio'],
  ];
  for (const [clase, datos, error] of casos) {
    const r = agregarHabitante(e, clase, datos, ctx);
    assert.equal(r.ok, false, JSON.stringify(datos));
    assert.equal(r.error, error, JSON.stringify(datos));
    assert.equal(r.estado, e);
  }
});
```
  4. En la prueba de los límites (`AC-1.4, AC-2.4, FR-1`), reemplazar las dos apariciones de `parentesco: 'hijo', genero: 'otro'` por `aspecto: 'nino'`.
  5. En la prueba de editar (`AC-3.5, AC-7.6, AC-10.1`), reemplazar las tres líneas de la edición (la llamada a `editarHabitante`, `const f` y el `assert.deepEqual`) por:
```js
  e = editarHabitante(e, id, { nombre: 'Dana', aspecto: 'anciana' }, ctx).estado;
  const f = buscarMiembro(e, id);
  assert.deepEqual([f.id, f.nombre, f.aspecto], [id, 'Dana', 'anciana']);
```
  6. Reemplazar la prueba `AC-7.5` (editar una mascota) por:
```js
test('AC-6.5: editar una mascota cambia su especie y nunca le asigna aspecto', () => {
  const ctx = crearCtx();
  let e = alta(crearHogarInicial(ctx), 'mascota', MASCOTA, ctx);
  const id = mascotas(e)[0].id;
  e = editarHabitante(e, id, { nombre: 'Firulais', especie: 'conejo', aspecto: 'adulta' }, ctx).estado;
  const m = buscarMiembro(e, id);
  assert.deepEqual([m.especie, m.aspecto], ['conejo', null]);
});
```
- [ ] En `test/contrato-habitantes.test.js`, reemplazar la primera prueba por:
```js
test('contrato del catálogo de habitantes: listas cerradas y límites', () => {
  assert.deepEqual(Object.values(catalogo.ASPECTOS), ['Adulto', 'Adulta', 'Niño', 'Niña', 'Anciano', 'Anciana', 'Neutro']);
  assert.deepEqual(catalogo.ESPECIES, { perro: 'Perro', gato: 'Gato', conejo: 'Conejo', hamster: 'Hámster', loro: 'Loro', otro: 'Otro' });
  assert.deepEqual(catalogo.LIMITES_HABITANTES, { familiar: 8, mascota: 4 });
});
```
- [ ] En `test/contrato-rutinas.test.js`, `test/contrato-intercambios.test.js` y `test/contrato-historial.test.js`, cambiar la versión del hogar inicial de 6 a 7 (`[6, []]` → `[7, []]` y `hogar inicial v6` → `hogar inicial v7` en los títulos).
- [ ] Reemplazo mecánico de los familiares en las demás pruebas (macOS):
```bash
cd poc
for f in actividades aspecto calificaciones historial intercambios jugador rutinas rutinas-lugar; do
  sed -i '' -E \
    -e "s/parentesco: '[a-z_]+', genero: 'femenino'/aspecto: 'adulta'/g" \
    -e "s/parentesco: '[a-z_]+', genero: 'masculino'/aspecto: 'adulto'/g" \
    -e "s/parentesco: '[a-z_]+', genero: 'otro'/aspecto: 'neutro'/g" "test/$f.test.js"
done
grep -n "parentesco\|genero" test/{actividades,aspecto,calificaciones,historial,intercambios,jugador,rutinas,rutinas-lugar}.test.js
```
  Expect: sin salida.
- [ ] Escribir las pruebas de la regla de responsables. Agregar al final de `test/actividades.test.js`:
```js
test('AC-11.2, AC-11.3, FR-10: una mascota no puede ser responsable al crear ni al editar; una persona sí', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  const firulais = mascotas(e)[0];
  const r = agregarActividad(e, datos(e, { miembroId: firulais.id }), ctx);
  assert.deepEqual([r.ok, r.error], [false, 'mascota']);
  assert.equal(r.estado, e);
  assert.equal(MENSAJES_ACTIVIDAD.mascota, 'Las mascotas no pueden encargarse de actividades.');
  const con = alta(e, datos(e), ctx);
  const edicion = editarActividad(con, ultima(con).id, datos(con, { miembroId: firulais.id }), ctx);
  assert.deepEqual([edicion.ok, edicion.error], [false, 'mascota']);
  assert.equal(edicion.estado, con);
  const propietario = miembrosActivos(e)[0];
  assert.equal(agregarActividad(e, datos(e, { miembroId: propietario.id }), ctx).ok, true);
});

test('AC-11.4: sin actividades de mascotas, ninguna burbuja ni lista corresponde a una mascota', () => {
  const ctx = crearCtx();
  let e = hogarBase(ctx);
  e = alta(e, datos(e, { espacioId: null }), ctx);
  const firulais = mascotas(e)[0];
  assert.equal(pendientesDeMiembro(e, firulais.id), 0);
  assert.ok(burbujas(e, HOY).every((b) => !(b.tipo === 'miembro' && b.id === firulais.id)));
  assert.ok(listaDelPanel(e).every((a) => a.miembroId !== firulais.id));
});

test('AC-11.6: "Dar de comer a la mascota" y "Pasear al perro" se asignan a una persona como cualquier otra', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  for (const nombre of ['Dar de comer a la mascota', 'Pasear al perro']) {
    const con = alta(e, datos(e, { nombre, icono: 'mascota', espacioId: null }), ctx);
    assert.equal(ultima(con).miembroId, diana(e).id);
  }
});
```
  y agregar `MENSAJES_ACTIVIDAD` a la lista de imports de `../src/actividades.js` en ese archivo:
```js
  atraso, porHacer, limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo, MENSAJES_ACTIVIDAD,
```
- [ ] Run: `cd poc && node --test test/habitantes.test.js test/contrato-habitantes.test.js test/actividades.test.js` — expect: FAIL (el modelo y la regla aún no están; además `hogar.js` todavía exige `parentesco`)
- [ ] Implementar el modelo de miembros. En `src/hogar.js`:
  1. Primera línea de imports:
```js
import { TIPOS, ETIQUETAS, LIMITES, ADMITE_BANO, ASPECTOS, ESPECIES, LIMITES_HABITANTES } from './catalogo.js';
```
  2. En `crearHogarInicial`, reemplazar el comentario, el miembro y el comentario y el retorno por:
```js
  // El personaje del propietario es una persona sin aspecto (ADR-002 de modelo de miembros, ADR-007 de aspecto).
  const miembro = {
    id: ctx.nuevoId(), hogarId, nombre: 'Personaje 1', cuentaId,
    tipo: 'persona', aspecto: null, especie: null, ...a(),
  };
  // Documento versión 7 (ADR-007 de aspecto): el hogar empieza sin actividades, bloques de rutina, intercambios ni historial.
  return {
    version: 7, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [], bloques: [],
    intercambios: [], historial: [],
  };
```
  3. Reemplazar `validarDatos` y `datosDeClase` por:
```js
// Datos obligatorios según la clase (FR-2 de la 002, FR-5 y FR-6 de la 007): familiar → aspecto; mascota → especie.
function validarDatos(clase, datos) {
  if (clase === 'familiar') return enLista(ASPECTOS, datos.aspecto) ? null : 'aspecto';
  return enLista(ESPECIES, datos.especie) ? null : 'especie';
}

const datosDeClase = (clase, datos) => (clase === 'familiar'
  ? { tipo: 'persona', aspecto: datos.aspecto, especie: null }
  : { tipo: 'mascota', aspecto: null, especie: datos.especie });
```
  4. En `MENSAJES_ERROR`, reemplazar las líneas `parentesco: ...` y `genero: ...` por:
```js
  aspecto: 'Elige un aspecto de la lista.',
```
- [ ] Implementar la regla de responsables. En `src/actividades.js`:
  1. Import de `hogar.js`:
```js
import { buscarMiembro, buscarEspacio, actividadesPendientes, auditoriaNueva, tocar, puedeJugar } from './hogar.js';
```
  2. En `validarActividad`, reemplazar la línea `if (!buscarMiembro(estado, datos.miembroId)) return { error: 'miembro' };` por:
```js
  if (buscarMiembro(estado, datos.miembroId)?.tipo === 'mascota') return { error: 'mascota' }; // ADR-007: las mascotas no pueden encargarse
  if (!puedeJugar(estado, datos.miembroId)) return { error: 'miembro' };
```
  3. En `MENSAJES_ACTIVIDAD`, agregar tras `miembro`:
```js
  mascota: 'Las mascotas no pueden encargarse de actividades.',
```
- [ ] Ayuda de pruebas para datos de una versión anterior. En `test/ayuda.js`, agregar al inicio el import y al final la función:
```js
import { agregarActividad } from '../src/actividades.js';
```
```js
// Alta de una actividad que admite a una mascota como responsable: representa datos de una versión anterior a la 007 (ADR-007), que el
// dominio ya no deja crear. Se crea para una persona y se reasigna a la mascota saltándose las reglas. Sin mascota, es `agregarActividad`.
export function agregarActividadLegada(estado, datos, ctx) {
  const mascota = estado.miembros.find((m) => m.id === datos.miembroId && m.tipo === 'mascota' && m.eliminadoEn === null);
  if (!mascota) return agregarActividad(estado, datos, ctx);
  const persona = estado.miembros.find((m) => m.tipo === 'persona' && m.eliminadoEn === null);
  const r = agregarActividad(estado, { ...datos, miembroId: persona.id }, ctx);
  if (!r.ok) return r;
  const actividades = r.estado.actividades.map((a, i, todas) => (i === todas.length - 1 ? { ...a, miembroId: mascota.id } : a));
  return { ok: true, estado: { ...r.estado, actividades } };
}
```
- [ ] Adaptar las pruebas que asignan actividades a una mascota (datos de versiones anteriores). Macros (macOS):
```bash
cd poc
sed -i '' -E 's/agregarActividad\(/agregarActividadLegada(/g' test/calificaciones.test.js test/historial.test.js test/intercambios.test.js
sed -i '' -E "s#import \{ crearCtx \} from './ayuda.js';#import { crearCtx, agregarActividadLegada } from './ayuda.js';#" test/calificaciones.test.js test/intercambios.test.js
sed -i '' -E "s#import \{ crearCtx, almacenEnMemoria \} from './ayuda.js';#import { crearCtx, almacenEnMemoria, agregarActividadLegada } from './ayuda.js';#" test/historial.test.js
grep -c "agregarActividadLegada" test/calificaciones.test.js test/historial.test.js test/intercambios.test.js
```
  Expect: cada archivo con al menos 2 apariciones. Y en `test/actividades.test.js`:
  - importar el helper: `import { crearCtx, agregarActividadLegada } from './ayuda.js';`
  - en `'AC-3.2, AC-3.6, AC-3.8, AC-9.5: marcar como hecha una puntual de cualquier miembro…'`, reemplazar la línea del alta por:
```js
  e = agregarActividadLegada(e, datos(e, { miembroId: mascotas(e)[0].id, vence: '2026-10-04' }), ctx).estado; // dato de una versión anterior
```
  - en `'AC-6.3, AC-6.4, AC-9.1: editar cambia todos los datos…'`, reemplazar `const firulais = mascotas(e)[0];` por `const propietario = miembrosActivos(e)[0];` y, en el resto de la prueba, `firulais.id` por `propietario.id` (dos apariciones: el `miembroId` de la edición y el valor esperado).
  - en `'AC-2.1, AC-2.2, AC-2.5, AC-2.6, FR-6: una burbuja por lugar…'`, reemplazar la línea `e = alta(e, datos(e, { icono: 'mascota', miembroId: firulais.id }), ctx); // con espacio…` por:
```js
  e = alta(e, datos(e, { icono: 'mascota' }), ctx); // con espacio: va en la burbuja de la cocina
```
  - en la prueba del regreso pendiente (`datosDe({ miembroId: mascotas(e)[0].id }).devolverA`), reemplazar esa línea por:
```js
  assert.equal(editarActividad(e, id, { ...a, miembroId: mascotas(e)[0].id }, ctx).error, 'mascota'); // una mascota no puede recibirla
```
- [ ] Run: `cd poc && node --test test/habitantes.test.js test/contrato-habitantes.test.js test/catalogo.test.js test/actividades.test.js test/aspecto.test.js test/jugador.test.js test/rutinas.test.js test/rutinas-lugar.test.js test/calificaciones.test.js test/intercambios.test.js` — expect: PASS (todas, sin fallos). Las pruebas que pasan por el almacén (`almacen.test.js`, `contrato.test.js`, `historial.test.js`) se arreglan en la Fase 2.
- [ ] Commit: `feat(hogar): replace gender and relationship with an aspect and let only people take charge of activities` (cuerpo: `Plan section: Phase 1: Aspecto, especie y responsables personas` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 2: Formato guardado v7 y migración

**Implements:** FR-14, FR-15 | **Satisfies:** AC-7.9, AC-15.1, AC-15.2, AC-15.3, AC-15.4, AC-15.5, AC-15.6, AC-15.7, AC-15.8, AC-15.9, AC-15.10, AC-15.11, AC-15.12
**Files:** `poc/src/almacen.js`, `poc/test/almacen.test.js`, `poc/test/historial.test.js`
**Interfaces:** Consumes: `tocar` (001), `esFechaValida`, las validaciones de las versiones 1 a 6 (001 a 006), `ASPECTOS`, `ASPECTO_INICIAL`, `ESPECIES` (Fase 1). Produces: `migrarAV7(estado, reloj)` → documento v7 (pura; `reloj` es una función que devuelve la hora y solo se llama si hay actividades de mascotas que dar de baja); `crearAlmacen(storage).cargar(reloj)` acepta `version` 1 a 6 (cadena de migraciones hasta la 7) y 7 (valida además aspectos, especies y responsables personas), y devuelve `{ estado: null, error: 'ilegible' }` en cualquier otro caso; `iniciarSesion(almacen, ctx)` pasa `ctx.ahora` como reloj. Las claves `CLAVE_DATOS` y `CLAVE_POSICION` no cambian.

Implementa el ADR de aspecto en el almacén. Las pruebas que simulan versiones anteriores pasan a partir de un documento v6 (con género y parentesco), y lo que se abre y se guarda queda en v7. Al terminar esta fase vuelve a verde toda la suite.

- [ ] Preparar `test/almacen.test.js` (cambios mecánicos y fixtures). Desde `poc/` (macOS):
```bash
cd poc
# los familiares de los fixtures ahora llevan aspecto
sed -i '' -E \
  -e "s/parentesco: '[a-z_]+', genero: 'femenino'/aspecto: 'adulta'/g" \
  -e "s/parentesco: '[a-z_]+', genero: 'masculino'/aspecto: 'adulto'/g" \
  -e "s/parentesco: '[a-z_]+', genero: 'otro'/aspecto: 'neutro'/g" test/almacen.test.js
# lo que se abre y se guarda ahora queda en versión 7 (la prueba de migrarAV6 conserva su 6)
sed -i '' -E '/v6\.version/! s/version, 6\)/version, 7)/' test/almacen.test.js
sed -i '' -E '/^test\(/ s/(como|en) versión 6/\1 versión 7/' test/almacen.test.js
sed -i '' -E 's/ya en versión 6 en memoria/ya en versión 7 en memoria/' test/almacen.test.js
grep -c "version, 7)" test/almacen.test.js
grep -n "parentesco: '" test/almacen.test.js
```
  Expect: `8` y, en el último `grep`, las líneas que aún mencionan `parentesco` en variantes inválidas (se reescriben en los pasos siguientes; ninguna debe quedar dentro de una llamada a `agregarHabitante`).
- [ ] En `test/almacen.test.js`, reemplazar la línea de imports de `../src/almacen.js` y la de `../src/hogar.js`, agregar `esVigente`, y definir las ayudas justo después de los imports:
```js
import {
  crearAlmacen, iniciarSesion, migrarAV2, migrarAV3, migrarAV4, migrarAV5, migrarAV6, migrarAV7, CLAVE_DATOS, CLAVE_POSICION,
} from '../src/almacen.js';
import {
  agregarEspacio, renombrarEspacio, espaciosDeTipo, crearHogarInicial, agregarHabitante, eliminarHabitante, familiares, mascotas,
  actividadesPendientes,
} from '../src/hogar.js';
import { esVigente } from '../src/intercambios.js';
import { generarDistribucion } from '../src/distribucion.js';
import { crearCtx, almacenEnMemoria } from './ayuda.js';

const RELOJ = () => '2026-10-09T10:00:00.000Z';

// Documento como lo guardaba la feature 006: versión 6, con género y parentesco en lugar de aspecto (ADR-007 de aspecto). Un miembro que
// ya tiene la forma antigua (sin `aspecto`) queda igual.
const GENERO_DE_ASPECTO = { adulta: 'femenino', adulto: 'masculino', neutro: 'otro' };
function comoV6(estado) {
  return {
    ...estado,
    version: 6,
    miembros: estado.miembros.map((m) => {
      if (!('aspecto' in m)) return m;
      const { aspecto, ...resto } = m;
      const conAspecto = m.tipo === 'persona' && aspecto !== null;
      return { ...resto, parentesco: conAspecto ? 'otro' : null, genero: conAspecto ? GENERO_DE_ASPECTO[aspecto] : null };
    }),
  };
}
```
  (las dos líneas de import originales de `almacen.js`, `hogar.js` y `ayuda.js` se sustituyen por este bloque.)
- [ ] En `test/almacen.test.js`, reemplazar las ayudas de las versiones anteriores para que partan de `comoV6`:
```js
// Documento como lo guardaba la feature 001: versión 1, sin actividades y miembros sin tipo, aspecto, parentesco, género ni especie.
function comoV1(estado) {
  const { actividades, bloques, intercambios, historial, ...resto } = estado;
  return {
    ...resto, version: 1,
    miembros: estado.miembros.map(({ tipo, aspecto, parentesco, genero, especie, ...m }) => m),
  };
}
```
```js
// Documento como lo guardaba la feature 002: versión 2 y sin actividades.
function comoV2(estado) {
  const { actividades, bloques, intercambios, historial, ...resto } = comoV6(estado);
  return { ...resto, version: 2 };
}
```
```js
// Documento como lo guardaba la feature 003: versión 3 y sin bloques de rutina.
function comoV3(estado) {
  const { bloques, intercambios, historial, ...resto } = comoV6(estado);
  return { ...resto, version: 3, actividades: estado.actividades.map(({ devolverA, ...a }) => a) };
}
```
```js
// Documento como lo guardaba la feature 004: versión 4, sin intercambios ni regreso pendiente en las actividades.
function comoV4(estado) {
  const { intercambios, historial, ...resto } = comoV6(estado);
  return { ...resto, version: 4, actividades: estado.actividades.map(({ devolverA, ...a }) => a) };
}
```
```js
// Documento como lo guardaba la feature 005: versión 5, sin historial.
function comoV5(estado) {
  const { historial, ...resto } = comoV6(estado);
  return { ...resto, version: 5 };
}
```
- [ ] En `test/almacen.test.js`, ajustar las pruebas que fijaban el modelo anterior:
  1. En `'AC-8.5: un miembro sin cuenta se carga como válido'`, agregar `aspecto: 'neutro'` al miembro copiado: `{ ...e.miembros[0], id: 'id-99', nombre: 'Firulais', cuentaId: null, aspecto: 'neutro' }`.
  2. En `'AC-9.1: los habitantes y sus datos se guardan y se restauran igual'`, reemplazar la línea de `familiares(estado).map(...)` por:
```js
  assert.deepEqual(familiares(estado).map((f) => [f.nombre, f.aspecto]), [['Diana', 'adulta']]);
```
  3. Reemplazar la prueba `'AC-9.4: tras migrar…'` por:
```js
test('AC-9.4: tras migrar, el personaje del propietario conserva nombre y cuenta y no recibe aspecto', () => {
  const ctx = crearCtx();
  const e = crearHogarInicial(ctx);
  const migrado = migrarAV7(migrarAV6(migrarAV5(migrarAV4(migrarAV3(migrarAV2(comoV1(e)))))), RELOJ);
  const propietario = migrado.miembros[0];
  assert.deepEqual(
    [propietario.nombre, propietario.cuentaId, propietario.tipo, propietario.aspecto],
    ['Personaje 1', e.cuentas[0].id, 'persona', null],
  );
  const conFamilia = agregarHabitante(migrado, 'familiar', { nombre: 'Diana', aspecto: 'adulta' }, ctx).estado;
  assert.equal(familiares(conFamilia).length, 1);
});
```
  4. En `'AC-9.5: datos con un habitante inválido se consideran ilegibles'`, reemplazar la desestructuración y la lista `variantes` por:
```js
  const [propietario, diana, firulais] = base.miembros;
  const variantes = [
    { ...diana, tipo: 'robot' },
    { ...firulais, aspecto: 'adulta' },
    { ...diana, especie: 'perro' },
    { ...diana, aspecto: 'femenino' }, // la clave antigua de género
    { ...diana, aspecto: 'x' },
    { ...diana, aspecto: null }, // un familiar sin aspecto
    { ...propietario, aspecto: 'adulto' }, // el propietario no tiene aspecto
    { ...firulais, especie: 'canario' },
    { ...diana, cuentaId: base.cuentas[0].id }, // dos miembros vinculados a la cuenta del propietario
  ];
```
  5. En `'FR-10: un miembro eliminado con datos inválidos…'`, reemplazar la lista `casos` por:
```js
  const casos = [
    [sinDiana, { ...eliminadaDiana, aspecto: 'x' }],
    [sinDiana, { ...eliminadaDiana, tipo: 'robot' }],
    [sinDiana, { ...eliminadaDiana, especie: 'perro' }],
    [sinDiana, { ...eliminadaDiana, aspecto: null }],
    [sinFirulais, { ...eliminadoFirulais, aspecto: 'adulta' }],
  ];
```
  6. En `'AC-9.5: los valores de prototipo no cuentan…'`, reemplazar la línea del `variantes.push` por:
```js
    variantes.push({ ...diana, aspecto: clave }, { ...firulais, especie: clave });
```
- [ ] Escribir las pruebas nuevas del formato v7. Agregar al final de `test/almacen.test.js`:
```js
// ---------- Feature 007: aspecto y mascotas sin actividades (versión 7) ----------

test('AC-15.2, AC-15.3, AC-15.4, AC-15.10 (007): migrarAV7 convierte el género en aspecto, quita parentesco y género y es pura y determinista', () => {
  const ctx = crearCtx();
  let e = hogarConHabitantes(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Luis', aspecto: 'adulto' }, ctx).estado;
  e = agregarHabitante(e, 'familiar', { nombre: 'Sol', aspecto: 'neutro' }, ctx).estado;
  const v6 = comoV6(e);
  const copia = structuredClone(v6);
  const v7 = migrarAV7(v6, RELOJ);
  assert.deepEqual(v6, copia);
  assert.equal(v7.version, 7);
  assert.deepEqual(v7.miembros.map((m) => [m.nombre, m.aspecto, m.especie]), [
    ['Personaje 1', null, null], ['Diana', 'adulta', null], ['Firulais', null, 'perro'], ['Luis', 'adulto', null], ['Sol', 'neutro', null],
  ]);
  assert.ok(v7.miembros.every((m) => !('genero' in m) && !('parentesco' in m)));
  assert.deepEqual(v7, e);
  assert.deepEqual(migrarAV7(v6, RELOJ), v7);
});

test('AC-15.3 (007): el propietario se identifica por su membresía, no por su género, y un familiar sin género pasa a neutro', () => {
  const v6 = comoV6(hogarConHabitantes(crearCtx()));
  const raro = { ...v6, miembros: v6.miembros.map((m, i) => (i === 0 ? { ...m, genero: 'femenino' } : i === 1 ? { ...m, genero: null } : m)) };
  const v7 = migrarAV7(raro, RELOJ);
  assert.deepEqual([v7.miembros[0].aspecto, v7.miembros[1].aspecto], [null, 'neutro']);
});

test('AC-15.5 (007): migrarAV7 da de baja las actividades no eliminadas de las mascotas y deja las demás como estaban', () => {
  const base = hogarConActividades(crearCtx());
  const firulais = base.miembros[2];
  const deMascota = (id, extra = {}) => actividadGuardada(base, id, { nombre: id, miembroId: firulais.id, espacioId: null, ...extra });
  const v6 = comoV6({
    ...base,
    actividades: [...base.actividades, deMascota('act-4'), deMascota('act-5', { hechaEn: '2026-10-05' }),
      deMascota('act-6', { eliminadoEn: '2026-10-06T09:00:00.000Z' })],
  });
  const copia = structuredClone(v6);
  const v7 = migrarAV7(v6, RELOJ);
  assert.deepEqual(v6, copia);
  const por = (id) => v7.actividades.find((a) => a.id === id);
  assert.deepEqual(['act-1', 'act-2', 'act-3'].map(por), base.actividades);
  assert.equal(por('act-4').eliminadoEn, '2026-10-09T10:00:00.000Z');
  assert.equal(por('act-5').eliminadoEn, '2026-10-09T10:00:00.000Z');
  assert.equal(por('act-6').eliminadoEn, '2026-10-06T09:00:00.000Z'); // ya estaba eliminada: no se toca
  assert.equal(por('act-6').actualizadoEn, '2026-10-06T10:00:00.000Z');
  assert.ok(por('act-4').actualizadoEn > '2026-10-06T10:00:00.000Z');
  assert.deepEqual(actividadesPendientes(v7).map((a) => a.id), ['act-1', 'act-2']);
});

test('AC-15.6, AC-15.7, AC-7.9 (007): el historial queda idéntico y una propuesta con una actividad de mascota deja de ser vigente', () => {
  const base = hogarConHistorial(crearCtx());
  const firulais = base.miembros[2];
  const paseo = actividadGuardada(base, 'act-9', { nombre: 'Paseo', miembroId: firulais.id, espacioId: null });
  const propuesta = intercambioGuardado(base, 'int-9', {
    actividadOfrecidaId: 'act-9', actividadPedidaId: 'act-1', marcaOfrecida: paseo.actualizadoEn, marcaPedida: base.actividades[0].actualizadoEn,
  });
  const conMascota = {
    ...base,
    actividades: [...base.actividades, paseo],
    intercambios: [...base.intercambios, propuesta],
    historial: [...base.historial,
      entradaGuardada(base, 'ent-9', { actividadId: 'act-9', miembroId: firulais.id, espacioId: null, nombre: 'Paseo', icono: 'otra' })],
  };
  assert.equal(esVigente(conMascota, propuesta), true);
  const v6 = comoV6(conMascota);
  const v7 = migrarAV7(v6, RELOJ);
  assert.deepEqual(v7.historial, v6.historial);
  assert.equal(esVigente(v7, v7.intercambios.find((i) => i.id === 'int-9')), false);
  assert.equal(abrirDatos(v7).aviso, null); // una entrada acreditada a una mascota es legible en la versión 7
});

test('AC-15.1, AC-15.5, AC-15.8 (007): un hogar de la feature 006 con actividades de mascotas se abre sin aviso, con esas actividades dadas de baja, y se guarda como versión 7 en el siguiente guardado', () => {
  const base = hogarConHistorial(crearCtx());
  const firulais = base.miembros[2];
  const conMascota = {
    ...base, actividades: [...base.actividades, actividadGuardada(base, 'act-9', { nombre: 'Paseo', miembroId: firulais.id, espacioId: null })],
  };
  const textoV6 = JSON.stringify(comoV6(conMascota));
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: textoV6 });
  const almacen = crearAlmacen(storage);
  const { estado, aviso } = iniciarSesion(almacen, { cuentaId: 'cuenta-1', nuevoId: () => 'x', ahora: RELOJ });
  assert.equal(aviso, null);
  assert.equal(estado.actividades.find((a) => a.id === 'act-9').eliminadoEn, '2026-10-09T10:00:00.000Z');
  assert.deepEqual({ ...estado, actividades: estado.actividades.slice(0, -1) }, base); // todo lo demás, igual
  assert.equal(storage.datos.get(CLAVE_DATOS), textoV6); // abrir no reescribe el documento
  almacen.guardar(estado);
  assert.equal(JSON.parse(storage.datos.get(CLAVE_DATOS)).version, 7);
});

test('AC-15.1, AC-15.10 (007): un hogar de la feature 006 sin actividades de mascotas se abre igual y sin llamar al reloj', () => {
  const e = hogarConHistorial(crearCtx());
  const storage = almacenEnMemoria({ [CLAVE_DATOS]: JSON.stringify(comoV6(e)) });
  const reloj = () => { throw new Error('el reloj no debe llamarse'); };
  const { estado, aviso } = iniciarSesion(crearAlmacen(storage), { cuentaId: 'cuenta-1', nuevoId: () => 'x', ahora: reloj });
  assert.equal(aviso, null);
  assert.deepEqual(estado, e);
});

test('AC-15.11 (007): el mapa generado del hogar migrado es idéntico al del hogar guardado', () => {
  const e = hogarConHistorial(crearCtx());
  assert.deepEqual(generarDistribucion(migrarAV7(comoV6(e), RELOJ)), generarDistribucion(e));
});

test('AC-15.9 (007): en un documento v6, un parentesco, un género o una especie fuera de las listas anteriores lo vuelven ilegible', () => {
  const v6 = comoV6(hogarConHabitantes(crearCtx()));
  const [, diana, firulais] = v6.miembros;
  assert.equal(abrirDatos(v6).aviso, null);
  for (const malo of [{ ...diana, parentesco: 'tia' }, { ...diana, genero: 'x' }, { ...firulais, especie: 'loro' }, { ...firulais, genero: 'femenino' }]) {
    assert.match(abrirDatos(conMiembro(v6, malo)).aviso, /No se pudo recuperar/, JSON.stringify(malo));
  }
});

test('AC-15.9 (007): en un documento v7, una actividad no eliminada asignada a una mascota lo vuelve ilegible; eliminada, no', () => {
  const base = hogarConActividades(crearCtx());
  const firulais = base.miembros[2];
  const [act1] = base.actividades;
  assert.match(abrirDatos(conActividad(base, { ...act1, miembroId: firulais.id })).aviso, /No se pudo recuperar/);
  assert.equal(abrirDatos(conActividad(base, { ...act1, miembroId: firulais.id, eliminadoEn: '2026-10-06T11:00:00.000Z' })).aviso, null);
});
```
- [ ] En `test/historial.test.js`, la prueba `'Reliability: ninguna baja ni el tope de 200 entradas…'` vuelve a cargar documentos con el almacén, y una actividad de una mascota ya no es legible en la v7: cambiar `(el documento v6 se vuelve a cargar)` por `(el documento v7 se vuelve a cargar)` en el título y borrar la línea:
```js
  base = hacer(base, 'Paseo', ctx, { miembroId: firulais(base).id });
```
- [ ] Run: `cd poc && node --test test/almacen.test.js test/historial.test.js` — expect: FAIL (`migrarAV7` no existe y el almacén no acepta la versión 7)
- [ ] Implementar el almacén. En `src/almacen.js`:
  1. Renombrar la función `miembrosValidos` actual a `miembrosValidosV6` (la validación de las versiones 2 a 6) y agregar, a continuación, la de la v7:
```js
// Reglas de los miembros en la versión 7 (ADR-007 de aspecto, FR-14 de la 007). Solo se validan los miembros activos: una mascota
// tiene una especie de la lista y ningún aspecto; el propietario no tiene aspecto; cualquier otra persona, un aspecto de la lista.
function miembrosValidos(estado) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const activos = estado.miembros.filter((m) => m.eliminadoEn === null);
  if (!propietaria || activos.filter((m) => m.cuentaId === propietaria).length !== 1) return false;
  return activos.every((m) => {
    if (m.tipo === 'mascota') return m.aspecto === null && enLista(ESPECIES, m.especie);
    if (m.tipo === 'persona') return m.especie === null && (m.cuentaId === propietaria ? m.aspecto === null : enLista(ASPECTOS, m.aspecto));
    return false;
  });
}
```
  2. En `actividadesValidas`, agregar el parámetro y usarlo al armar el conjunto de miembros:
```js
// Reglas de las actividades en la versión 3 (ADR-003 de modelo de actividades, FR-11 de la 003). Desde la versión 7, el responsable debe
// ser una persona activa (`soloPersonas`, ADR-007 de aspecto). Solo se validan las no eliminadas.
function actividadesValidas(estado, soloPersonas = false) {
  if (!Array.isArray(estado.actividades)) return false;
  const miembros = new Set(estado.miembros
    .filter((m) => m.eliminadoEn === null && (!soloPersonas || m.tipo === 'persona')).map((m) => m.id));
```
     (el resto de la función no cambia.)
  3. Agregar la migración a continuación de `migrarAV6`:
```js
// Migración pura v6 → v7 (ADR-007 de aspecto): `aspecto` reemplaza a `genero`, desaparece `parentesco` y las actividades no eliminadas de las
// mascotas se dan de baja. El propietario se identifica por su membresía. `reloj` devuelve la hora de la baja y solo se llama si hace falta.
export function migrarAV7(estado, reloj) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId ?? null;
  const mascotasActivas = new Set(estado.miembros.filter((m) => m.eliminadoEn === null && m.tipo === 'mascota').map((m) => m.id));
  const miembros = estado.miembros.map(({ genero, parentesco, ...m }) => ({
    ...m,
    aspecto: m.tipo === 'persona' && m.cuentaId !== propietaria
      ? (Object.hasOwn(ASPECTO_DE_GENERO_V6, genero) ? ASPECTO_DE_GENERO_V6[genero] : ASPECTO_INICIAL)
      : null,
  }));
  const deMascota = (a) => a.eliminadoEn === null && mascotasActivas.has(a.miembroId);
  const ahora = estado.actividades.some(deMascota) ? reloj() : null;
  const ctxBaja = { ahora: () => ahora, cuentaId: propietaria ?? estado.cuentas[0].id };
  const actividades = estado.actividades.map((a) => (deMascota(a) ? { ...tocar(a, ctxBaja), eliminadoEn: ahora } : a));
  return { ...estado, version: 7, miembros, actividades };
}
```
  4. Reemplazar el método `cargar()` de `crearAlmacen` por:
```js
    // `reloj` da la hora de la migración a la versión 7 (baja de las actividades de mascotas); solo se llama si hace falta.
    cargar(reloj) {
      try {
        const texto = storage.getItem(CLAVE_DATOS);
        if (texto === null) return { estado: null, error: null };
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(migrarAV4(migrarAV3(migrarAV2(estado))))), reloj), error: null };
        }
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidosV6(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(migrarAV4(migrarAV3(estado)))), reloj), error: null };
        }
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(migrarAV4(estado))), reloj), error: null };
        }
        if (estado?.version === 4 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)
          && bloquesValidos(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(estado)), reloj), error: null };
        }
        if (estado?.version === 5 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado)) {
          return { estado: migrarAV7(migrarAV6(estado), reloj), error: null };
        }
        if (estado?.version === 6 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado) && historialValido(estado)) {
          return { estado: migrarAV7(estado, reloj), error: null };
        }
        if (estado?.version === 7 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado, true)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado) && historialValido(estado)) {
          return { estado, error: null };
        }
        return { estado: null, error: 'ilegible' };
      } catch {
        return { estado: null, error: 'ilegible' };
      }
    },
```
  5. En `iniciarSesion`, reemplazar la primera línea y el comentario por:
```js
// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002, FR-11 de la 003, FR-10 de la 004, FR-12 de la 005, FR-8 de la 006, FR-14 de la 007):
// recupera el hogar (migrándolo si es de una versión anterior) o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar(ctx.ahora);
```
- [ ] Run: `cd poc && node --test $(ls test/*.test.js | grep -v contrato-menu)` — expect: PASS, 0 fallos (toda la suite vuelve a verde: las 301 existentes más las nuevas de las Fases 1 y 2).
  Nota: `npm test` también ejecuta `test/contrato-menu.test.js`, que falla (`ERR_MODULE_NOT_FOUND` de `formularios.js`) hasta el final de la Fase 4; por eso en las Fases 1 a 4 se excluye de la verificación.
- [ ] Commit: `feat(almacen): save the household as version 7 and migrate the earlier versions` (cuerpo: `Plan section: Phase 2: Formato guardado v7 y migración` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 3: Lógica de los formularios y varios lugares

**Implements:** FR-8 (lógica pura), FR-9 | **Satisfies:** AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6, AC-8.7, AC-8.8, AC-8.9, AC-8.10, AC-8.11, AC-8.13, AC-8.15, AC-9.4, AC-9.7, AC-9.8, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-10.6, AC-10.7, AC-10.9, AC-10.10, AC-10.11, AC-11.2
**Files:** `poc/src/formularios.js` (nuevo), `poc/src/actividades.js`, `poc/test/formularios.test.js` (nuevo), `poc/test/actividades.test.js`
**Interfaces:** Consumes: `SUGERENCIAS`, `SUGERENCIAS_INICIALES`, `ICONO_GENERICO`, `FRECUENCIAS`, `LIMITE_ACTIVIDADES` (`catalogo.js`); `agregarActividad`, `contarActividades`, `espaciosActivos`. Produces: desde `formularios.js` (puro, sin DOM): `normalizarTexto(texto)`, `sugerenciasPara(texto)` → `SUGERENCIAS[]`, `sugerenciaExacta(texto)` → sugerencia o `null`, `iconoDeFicha(texto, manual)` → `{ icono, editable, manual }`, `iconoDeEdicion(nombre, iconoGuardado)` → `{ icono, editable, manual }`, `OPCIONES_RECURRENCIA` (`[valor, etiqueta][]`, valor `'0'` = una vez), `datosDeRecurrencia(valor)` → `{ tipo, frecuenciaDias }`, `valorDeRecurrencia(actividad)`, `etiquetaDeRecurrencia(valor)`, `resumenDeFicha({ vence, hoy, recurrencia, lugares })`, `inicialDe(nombre)`. Desde `actividades.js`: `agregarActividades(estado, datos, espacioIds, ctx)` → `{ ok, estado }` o `{ ok: false, error, estado }`; `MENSAJES_ACTIVIDAD['limite-varios']`.

Las reglas de los formularios se prueban sin interfaz: qué sugerencias salen, cuándo el icono se puede cambiar, qué dice el resumen y cómo se crean varias actividades de una vez.

- [ ] Escribir las pruebas de `test/formularios.test.js` (nuevo):
```js
// test/formularios.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarTexto, sugerenciasPara, sugerenciaExacta, iconoDeFicha, iconoDeEdicion, OPCIONES_RECURRENCIA, datosDeRecurrencia,
  valorDeRecurrencia, etiquetaDeRecurrencia, resumenDeFicha, inicialDe,
} from '../src/formularios.js';

const nombres = (lista) => lista.map((s) => s.nombre);

test('AC-8.2: con el campo vacío salen las primeras 6 sugerencias, en su orden', () => {
  const esperadas = ['Lavar platos', 'Barrer', 'Trapear', 'Limpiar el baño', 'Lavar ropa', 'Sacar la basura'];
  assert.deepEqual(nombres(sugerenciasPara('')), esperadas);
  assert.deepEqual(nombres(sugerenciasPara('   ')), esperadas);
});

test('AC-8.3: con texto salen las que lo contienen, sin distinguir mayúsculas, acentos ni espacios en los extremos', () => {
  assert.deepEqual(nombres(sugerenciasPara('ba')), ['Barrer', 'Limpiar el baño', 'Sacar la basura']);
  assert.deepEqual(nombres(sugerenciasPara(' BAÑO ')), ['Limpiar el baño']);
  assert.deepEqual(nombres(sugerenciasPara('limpiar el bano')), ['Limpiar el baño']);
  assert.deepEqual(nombres(sugerenciasPara('LAVAR')), ['Lavar platos', 'Lavar ropa']);
  assert.deepEqual(nombres(sugerenciasPara('mascota')), ['Dar de comer a la mascota']);
  assert.deepEqual(sugerenciasPara('zzz'), []);
});

test('AC-8.6: un texto igual a una sugerencia (sin distinguir mayúsculas, acentos ni extremos) la encuentra; uno parcial, no', () => {
  assert.equal(sugerenciaExacta('barrer ')?.icono, 'barrer');
  assert.equal(sugerenciaExacta('LIMPIAR EL BAÑO')?.icono, 'limpiar');
  assert.equal(sugerenciaExacta('limpiar el bano')?.nombre, 'Limpiar el baño');
  assert.equal(sugerenciaExacta('barr'), null);
  assert.equal(sugerenciaExacta(''), null);
  assert.equal(normalizarTexto('  ÁrBol Ñandú '), 'arbol nandu');
});

test('AC-8.5 a AC-8.11: el icono de la ficha — genérico por omisión, fijo con una sugerencia, a mano mientras no coincida', () => {
  assert.deepEqual(iconoDeFicha('', null), { icono: 'otra', editable: true, manual: null }); // AC-8.8
  assert.deepEqual(iconoDeFicha('Podar', null), { icono: 'otra', editable: true, manual: null });
  assert.deepEqual(iconoDeFicha('Barrer', null), { icono: 'barrer', editable: false, manual: null }); // AC-8.5, AC-8.6
  assert.deepEqual(iconoDeFicha('Trapear', 'ropa'), { icono: 'limpiar', editable: false, manual: null }); // AC-8.10: se descarta el manual
  assert.deepEqual(iconoDeFicha('Podar', 'plantas'), { icono: 'plantas', editable: true, manual: 'plantas' }); // AC-8.7, AC-8.9
  assert.deepEqual(iconoDeFicha('Podar mucho', 'plantas'), { icono: 'plantas', editable: true, manual: 'plantas' }); // AC-8.9
  // AC-8.10 y AC-8.11: tras coincidir con una sugerencia, al dejar de coincidir vuelve al genérico
  const coincide = iconoDeFicha('Barrer', 'plantas');
  assert.deepEqual(iconoDeFicha('Barre', coincide.manual), { icono: 'otra', editable: true, manual: null });
});

test('AC-8.15: al editar se respeta el icono guardado hasta que el nombre coincida con una sugerencia', () => {
  assert.deepEqual(iconoDeEdicion('Podar', 'plantas'), { icono: 'plantas', editable: true, manual: 'plantas' });
  assert.deepEqual(iconoDeEdicion('Lavar platos', 'ropa'), { icono: 'ropa', editable: false, manual: 'ropa' });
  // al cambiar el texto, rige la regla de siempre
  assert.deepEqual(iconoDeFicha('Lavar plato', 'ropa'), { icono: 'ropa', editable: true, manual: 'ropa' });
  assert.deepEqual(iconoDeFicha('Lavar platos', 'ropa'), { icono: 'platos', editable: false, manual: null });
});

test('AC-9.7: la recurrencia es un solo selector que se traduce a tipo y frecuencia', () => {
  assert.deepEqual(OPCIONES_RECURRENCIA, [
    ['0', 'Una vez'], ['1', 'Cada día'], ['2', 'Cada 2 días'], ['3', 'Cada 3 días'], ['7', 'Cada 7 días'], ['14', 'Cada 14 días'],
    ['30', 'Cada 30 días'],
  ]);
  assert.deepEqual(datosDeRecurrencia('0'), { tipo: 'puntual', frecuenciaDias: null });
  assert.deepEqual(datosDeRecurrencia('7'), { tipo: 'repetitiva', frecuenciaDias: 7 });
  assert.equal(valorDeRecurrencia({ tipo: 'puntual', frecuenciaDias: null }), '0');
  assert.equal(valorDeRecurrencia({ tipo: 'repetitiva', frecuenciaDias: 14 }), '14');
  assert.equal(etiquetaDeRecurrencia('3'), 'Cada 3 días');
});

test('AC-9.4, AC-9.8: la línea-resumen dice la fecha, la recurrencia y los lugares', () => {
  const hoy = '2026-10-06';
  assert.equal(resumenDeFicha({ vence: hoy, hoy, recurrencia: '0', lugares: [] }), '📅 Hoy · Una vez · Sin lugar');
  assert.equal(resumenDeFicha({ vence: '2026-10-09', hoy, recurrencia: '7', lugares: ['Sala'] }), '📅 2026-10-09 · Cada 7 días · Sala');
  assert.equal(resumenDeFicha({ vence: hoy, hoy, recurrencia: '1', lugares: ['Sala', 'Cocina', 'Dormitorio 1'] }), '📅 Hoy · Cada día · 3 lugares');
  assert.equal(resumenDeFicha({ vence: '', hoy, recurrencia: '0', lugares: [] }), '📅 Sin fecha · Una vez · Sin lugar');
});

test('AC-9.1: la inicial de un círculo es la primera letra del nombre en mayúscula', () => {
  assert.equal(inicialDe('diana'), 'D');
  assert.equal(inicialDe('  ángel'), 'Á');
  assert.equal(inicialDe(''), '?');
});
```
- [ ] Run: `cd poc && node --test test/formularios.test.js` — expect: FAIL (`ERR_MODULE_NOT_FOUND` para `src/formularios.js`)
- [ ] Implementar `src/formularios.js`:
```js
// src/formularios.js
// Lógica pura de los formularios simples (feature 007): sugerencias de actividad, icono que se puede o no cambiar, recurrencia y línea-resumen.
// No toca el DOM ni Phaser: la presentación solo pinta lo que estas funciones devuelven.
import { SUGERENCIAS, SUGERENCIAS_INICIALES, ICONO_GENERICO, FRECUENCIAS } from './catalogo.js';

// Compara sin distinguir mayúsculas, acentos ni espacios al inicio o al final (AC-8.3, AC-8.6).
export const normalizarTexto = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('es');

// Sugerencias que se ven (AC-8.2, AC-8.3): las primeras con el campo vacío; con texto, las que lo contienen.
export function sugerenciasPara(texto) {
  const buscado = normalizarTexto(texto);
  if (buscado === '') return SUGERENCIAS.slice(0, SUGERENCIAS_INICIALES);
  return SUGERENCIAS.filter((s) => normalizarTexto(s.nombre).includes(buscado));
}

export const sugerenciaExacta = (texto) => SUGERENCIAS.find((s) => normalizarTexto(s.nombre) === normalizarTexto(texto)) ?? null;

// Icono de la ficha (AC-8.5 a AC-8.11): con un texto igual a una sugerencia, el suyo y no se puede cambiar (y se descarta el elegido a mano);
// si no, el elegido a mano o el genérico, y se puede cambiar. `manual` es el icono elegido a mano, o null; el estado vive solo en la ficha.
export function iconoDeFicha(texto, manual) {
  const sugerencia = sugerenciaExacta(texto);
  if (sugerencia) return { icono: sugerencia.icono, editable: false, manual: null };
  return { icono: manual ?? ICONO_GENERICO, editable: true, manual: manual ?? null };
}

// Al abrir una actividad existente (AC-8.15): se respeta el icono guardado; solo queda fijo si el nombre ya es el de una sugerencia.
export const iconoDeEdicion = (nombre, iconoGuardado) => ({ icono: iconoGuardado, editable: sugerenciaExacta(nombre) === null, manual: iconoGuardado });

// Recurrencia (AC-9.7): un solo selector. El valor '0' es "una vez" (puntual); los demás, la frecuencia en días (repetitiva).
export const OPCIONES_RECURRENCIA = [
  ['0', 'Una vez'],
  ...FRECUENCIAS.map((dias) => [String(dias), dias === 1 ? 'Cada día' : `Cada ${dias} días`]),
];
export const datosDeRecurrencia = (valor) => (valor === '0'
  ? { tipo: 'puntual', frecuenciaDias: null }
  : { tipo: 'repetitiva', frecuenciaDias: Number(valor) });
export const valorDeRecurrencia = (actividad) => (actividad.tipo === 'puntual' ? '0' : String(actividad.frecuenciaDias));
export const etiquetaDeRecurrencia = (valor) => OPCIONES_RECURRENCIA.find(([v]) => v === valor)?.[1] ?? 'Una vez';

// Línea-resumen de la ficha (AC-9.4, AC-9.8): fecha, recurrencia y lugares (sus nombres).
export function resumenDeFicha({ vence, hoy, recurrencia, lugares }) {
  const fecha = vence === hoy ? 'Hoy' : (vence || 'Sin fecha');
  const donde = lugares.length === 0 ? 'Sin lugar' : (lugares.length === 1 ? lugares[0] : `${lugares.length} lugares`);
  return `📅 ${fecha} · ${etiquetaDeRecurrencia(recurrencia)} · ${donde}`;
}

// Inicial de un círculo de responsable (AC-9.1): la primera letra del nombre, en mayúscula.
export const inicialDe = (nombre) => [...nombre.trim()][0]?.toLocaleUpperCase('es') ?? '?';
```
- [ ] Run: `cd poc && node --test test/formularios.test.js` — expect: PASS (8 pruebas)
- [ ] Escribir las pruebas de la creación en varios lugares. En `test/actividades.test.js`, agregar `agregarActividades` y `LIMITE_ACTIVIDADES` a los imports (`agregarActividades` en la lista de `../src/actividades.js`; `import { LIMITE_ACTIVIDADES } from '../src/catalogo.js';`) y al final del archivo:
```js
// ---------- Feature 007: una actividad en varios lugares ----------

test('AC-10.3, AC-10.4, AC-10.5, AC-10.11: n lugares crean n actividades independientes con los mismos datos, en el orden de los espacios', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const sala = espaciosDeTipo(e, 'sala')[0];
  // se piden en otro orden: se crean en el orden en que los espacios se crearon (sala, dormitorio 1, dormitorio 2)
  const r = agregarActividades(e, datos(e, { nombre: 'Barrer', icono: 'barrer' }), [d2.id, sala.id, d1.id], ctx);
  assert.equal(r.ok, true, r.error);
  const nuevas = r.estado.actividades.slice(e.actividades.length);
  assert.deepEqual(nuevas.map((a) => a.espacioId), [sala.id, d1.id, d2.id]);
  assert.ok(nuevas.every((a) => a.nombre === 'Barrer' && a.icono === 'barrer' && a.miembroId === diana(e).id && a.vence === HOY
    && a.tipo === 'puntual' && a.hechaEn === null));
  assert.equal(new Set(nuevas.map((a) => a.id)).size, 3);
  assert.equal(contarActividades(r.estado), 3);
  const { actividades: _despues, ...restoDespues } = r.estado;
  const { actividades: _antes, ...restoAntes } = e;
  assert.deepEqual(restoDespues, restoAntes); // no cambia ningún espacio, miembro, bloque, intercambio ni entrada
});

test('AC-10.2: sin ningún lugar se crea una sola actividad sin espacio', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  const r = agregarActividades(e, datos(e), [], ctx); // `datos` trae la cocina, que se ignora
  assert.equal(r.ok, true, r.error);
  const nuevas = r.estado.actividades.slice(e.actividades.length);
  assert.deepEqual(nuevas.map((a) => a.espacioId), [null]);
});

test('AC-10.6: el tope de 50 pendientes se respeta con todo o nada (48, 49, 50 y 51)', () => {
  const ctx = crearCtx();
  const base = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  const lugares = espaciosActivos(base).map((x) => x.id);
  const llenar = (n) => {
    let e = base;
    for (let i = 0; i < n; i += 1) e = alta(e, datos(e, { nombre: `A${i}` }), ctx);
    return e;
  };
  let r = agregarActividades(llenar(48), datos(base), lugares.slice(0, 2), ctx); // 48 + 2 = 50
  assert.equal(r.ok, true);
  assert.equal(contarActividades(r.estado), LIMITE_ACTIVIDADES);
  const e49 = llenar(49);
  r = agregarActividades(e49, datos(base), lugares.slice(0, 2), ctx); // 49 + 2 = 51
  assert.deepEqual([r.ok, r.error], [false, 'limite-varios']);
  assert.equal(r.estado, e49);
  assert.equal(agregarActividades(e49, datos(base), lugares.slice(0, 1), ctx).ok, true); // 49 + 1 = 50
  const e50 = llenar(50);
  r = agregarActividades(e50, datos(base), lugares.slice(0, 1), ctx); // 50 + 1 = 51
  assert.deepEqual([r.ok, r.error], [false, 'limite']);
  assert.equal(r.estado, e50);
  assert.equal(MENSAJES_ACTIVIDAD['limite-varios'], 'Con estos lugares se superarían las 50 actividades pendientes.');
});

test('AC-10.7, AC-11.2: un dato inválido, un lugar que no existe o una mascota no crean ninguna actividad', () => {
  const ctx = crearCtx();
  const e = hogarBase(ctx);
  const lugares = [cocina(e).id];
  const casos = [
    [{ nombre: '' }, lugares, 'vacio'],
    [{ nombre: 'x'.repeat(31) }, lugares, 'largo'],
    [{ icono: 'escoba' }, lugares, 'icono'],
    [{ vence: '2026-02-30' }, lugares, 'fecha'],
    [{ tipo: 'repetitiva', frecuenciaDias: 5 }, lugares, 'frecuencia'],
    [{ miembroId: 'no-existe' }, lugares, 'miembro'],
    [{ miembroId: mascotas(e)[0].id }, lugares, 'mascota'],
    [{}, ['no-existe'], 'espacio'],
    [{}, ['pasillo:izq'], 'espacio'],
    [{}, [cocina(e).id, 'no-existe'], 'espacio'],
  ];
  for (const [extra, espacioIds, error] of casos) {
    const r = agregarActividades(e, datos(e, extra), espacioIds, ctx);
    assert.deepEqual([r.ok, r.error], [false, error], JSON.stringify(extra));
    assert.equal(r.estado, e);
  }
});

test('AC-10.9, AC-10.10: las actividades creadas juntas son independientes al editar, eliminar y marcar "Hecho"', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(hogarBase(ctx), 'dormitorio', ctx);
  const [d1, d2] = espaciosDeTipo(e, 'dormitorio');
  const r = agregarActividades(e, datos(e, { nombre: 'Barrer', tipo: 'repetitiva', frecuenciaDias: 7 }), [d1.id, d2.id], ctx);
  const [a1, a2] = r.estado.actividades.slice(e.actividades.length);
  const editada = editarActividad(r.estado, a1.id, datos(r.estado, { nombre: 'Barrer fuerte', espacioId: d1.id, tipo: 'repetitiva', frecuenciaDias: 7 }), ctx).estado;
  assert.equal(buscarActividad(editada, a1.id).nombre, 'Barrer fuerte');
  assert.deepEqual(buscarActividad(editada, a2.id), buscarActividad(r.estado, a2.id));
  const eliminada = eliminarActividad(r.estado, a1.id, ctx);
  assert.equal(buscarActividad(eliminada, a1.id), null);
  assert.notEqual(buscarActividad(eliminada, a2.id), null);
  const hecha = marcarHecha(r.estado, a1.id, HOY, ctx);
  assert.equal(buscarActividad(hecha, a1.id).vence, '2026-10-13');
  assert.equal(buscarActividad(hecha, a2.id).vence, HOY);
});
```
- [ ] Run: `cd poc && node --test test/actividades.test.js` — expect: FAIL (`agregarActividades` no existe)
- [ ] Implementar la creación en varios lugares. En `src/actividades.js`, agregar `espaciosActivos` al import de `hogar.js`:
```js
import { buscarMiembro, buscarEspacio, espaciosActivos, actividadesPendientes, auditoriaNueva, tocar, puedeJugar } from './hogar.js';
```
  Agregar a continuación de `agregarActividad`:
```js
// Alta en varios lugares (FR-9 de la 007): una actividad independiente —con su id, su auditoría y los mismos datos— por cada espacio pedido, creadas
// en el orden de los espacios (no en el orden pedido) y en una sola operación, todas o ninguna. Sin espacios crea una sola, sin espacio.
export function agregarActividades(estado, datos, espacioIds, ctx) {
  const unicos = [...new Set(espacioIds)];
  const lugares = espaciosActivos(estado).map((e) => e.id).filter((id) => unicos.includes(id));
  if (lugares.length !== unicos.length) return { ok: false, error: 'espacio', estado }; // un lugar que no existe o ya no está
  const destinos = lugares.length === 0 ? [null] : lugares;
  if (contarActividades(estado) + destinos.length > LIMITE_ACTIVIDADES) {
    return { ok: false, error: destinos.length === 1 ? 'limite' : 'limite-varios', estado };
  }
  let resultado = estado;
  for (const espacioId of destinos) {
    const r = agregarActividad(resultado, { ...datos, espacioId }, ctx);
    if (!r.ok) return { ok: false, error: r.error, estado };
    resultado = r.estado;
  }
  return { ok: true, estado: resultado };
}
```
  y, en `MENSAJES_ACTIVIDAD`, agregar tras `limite`:
```js
  'limite-varios': 'Con estos lugares se superarían las 50 actividades pendientes.',
```
- [ ] Run: `cd poc && node --test test/actividades.test.js test/formularios.test.js` — expect: PASS
- [ ] Run: `cd poc && node --test $(ls test/*.test.js | grep -v contrato-menu)` — expect: PASS, 0 fallos
- [ ] Commit: `feat(actividades): add the pure form logic and create an activity in several places at once` (cuerpo: `Plan section: Phase 3: Lógica de los formularios y varios lugares` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 4: Secciones, respuesta del mapa y filtro del historial

**Implements:** FR-1 (lógica), FR-2 (lógica), FR-7 (filtro) | **Satisfies:** AC-1.1, AC-1.8, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-7.5, AC-7.9
**Files:** `poc/src/secciones.js` (nuevo), `poc/src/historial.js`, `poc/test/secciones.test.js` (nuevo), `poc/test/calificaciones.test.js`
**Interfaces:** Consumes: `personasQueJuegan`, `mascotas` (`hogar.js`). Produces: desde `secciones.js` (puro): `SECCIONES` (`[{ clave, etiqueta, icono }]`, en el orden de la barra), `textoPestana(clave, recibidas)`, `accionDeToque(seccion, toque)` → `{ tipo: 'ficha-espacio', id } | { tipo: 'ficha-miembro', id } | { tipo: 'hoja-fuera' } | { tipo: 'hoja', lugar } | null`, con `toque = { ocupante, enCartel, burbuja, espacioId }`. Desde `historial.js`: `miembrosDelFiltro(estado)` ofrece las personas y solo las mascotas con alguna entrada.

Fija qué pestañas hay, cómo se rotulan y qué responde el mapa en cada sección, para que la presentación solo ejecute la acción que devuelve la función pura. Al terminar esta fase también pasa la prueba de contrato de la Fase 0.

- [ ] Escribir las pruebas de `test/secciones.test.js` (nuevo):
```js
// test/secciones.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECCIONES, textoPestana, accionDeToque } from '../src/secciones.js';

const TOQUE = { ocupante: 'm1', enCartel: true, burbuja: { tipo: 'espacio', id: 'e1' }, espacioId: 'e1' };

test('AC-1.1: la barra tiene cuatro secciones, en este orden, cada una con su etiqueta y su icono', () => {
  assert.deepEqual(SECCIONES.map((s) => [s.clave, s.etiqueta, s.icono]), [
    ['espacios', 'Espacios', '🏠'], ['familia', 'Familia', '👨‍👩‍👧'], ['actividades', 'Actividades', '📋'], ['intercambios', 'Intercambios', '🔄'],
  ]);
});

test('AC-1.8: la pestaña Intercambios dice cuántas propuestas recibidas vigentes hay; las demás no cambian', () => {
  assert.equal(textoPestana('intercambios', 0), 'Intercambios');
  assert.equal(textoPestana('intercambios', 3), 'Intercambios (3)');
  assert.equal(textoPestana('familia', 5), 'Familia');
  assert.equal(textoPestana('espacios', 2), 'Espacios');
});

test('AC-2.1, AC-2.6: en Espacios el mapa abre la ficha del espacio, haya o no alguien encima, y no responde a lo demás', () => {
  assert.deepEqual(accionDeToque('espacios', TOQUE), { tipo: 'ficha-espacio', id: 'e1' });
  assert.deepEqual(accionDeToque('espacios', { ocupante: null, enCartel: false, burbuja: null, espacioId: 'e2' }), { tipo: 'ficha-espacio', id: 'e2' });
  assert.equal(accionDeToque('espacios', { ...TOQUE, espacioId: null }), null);
});

test('AC-2.2, AC-2.3, AC-2.6: en Familia el mapa abre la ficha de quien está en la casilla o la hoja del cartel, y nada más', () => {
  assert.deepEqual(accionDeToque('familia', TOQUE), { tipo: 'ficha-miembro', id: 'm1' });
  assert.deepEqual(accionDeToque('familia', { ...TOQUE, ocupante: null }), { tipo: 'hoja-fuera' });
  assert.equal(accionDeToque('familia', { ocupante: null, enCartel: false, burbuja: TOQUE.burbuja, espacioId: 'e1' }), null);
});

test('AC-2.4, AC-2.5: en Actividades el mapa abre la hoja de la burbuja; en Intercambios y en exploración no responde', () => {
  assert.deepEqual(accionDeToque('actividades', TOQUE), { tipo: 'hoja', lugar: { tipo: 'espacio', id: 'e1' } });
  assert.equal(accionDeToque('actividades', { ...TOQUE, burbuja: null }), null);
  assert.equal(accionDeToque('intercambios', TOQUE), null);
  assert.equal(accionDeToque(null, TOQUE), null);
});
```
- [ ] Escribir la prueba del filtro. Agregar al final de `test/calificaciones.test.js`:
```js
test('AC-7.5 (007): el filtro ofrece a una mascota solo si tiene alguna entrada en el historial', () => {
  const ctx = crearCtx();
  const base = hogarBase(ctx);
  assert.deepEqual(miembrosDelFiltro(base).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Luis']);
  const con = hacer(base, 'Paseo', ctx, { miembroId: firulais(base).id }); // dato de una versión anterior (agregarActividadLegada)
  assert.deepEqual(miembrosDelFiltro(con).map((m) => m.nombre), ['Personaje 1', 'Diana', 'Luis', 'Firulais']);
  assert.equal(calificar(con, entrada(con, 'Paseo').id, propietarioDe(con).id, 4, ctx).ok, true); // AC-7.9: se puede calificar
});
```
- [ ] Run: `cd poc && node --test test/secciones.test.js test/calificaciones.test.js` — expect: FAIL (`src/secciones.js` no existe; el filtro aún ofrece la mascota sin entradas)
- [ ] Implementar `src/secciones.js`:
```js
// src/secciones.js
// Barra y secciones del modo edición (feature 007): lógica pura, sin DOM ni Phaser. Qué pestañas hay, cómo se rotulan y qué responde el
// mapa al tocarlo según la sección abierta (FR-1 y FR-2 de la 007).

export const SECCIONES = [
  { clave: 'espacios', etiqueta: 'Espacios', icono: '🏠' },
  { clave: 'familia', etiqueta: 'Familia', icono: '👨‍👩‍👧' },
  { clave: 'actividades', etiqueta: 'Actividades', icono: '📋' },
  { clave: 'intercambios', etiqueta: 'Intercambios', icono: '🔄' },
];

// Rótulo de una pestaña (AC-1.8): Intercambios muestra las propuestas recibidas vigentes de quien juega.
export function textoPestana(clave, recibidas) {
  const { etiqueta } = SECCIONES.find((s) => s.clave === clave);
  return clave === 'intercambios' && recibidas > 0 ? `${etiqueta} (${recibidas})` : etiqueta;
}

// Qué responde el mapa al tocar una casilla en modo edición (FR-2). `toque`: { ocupante, enCartel, burbuja, espacioId } con el id de quien
// está en la casilla (propietario o habitante) o null, si se tocó el cartel de la entrada, la burbuja de la casilla o null, y el espacio de
// la casilla o null. Devuelve la acción o null. Cada sección responde solo a lo suyo.
export function accionDeToque(seccion, toque) {
  switch (seccion) {
    case 'espacios':
      return toque.espacioId ? { tipo: 'ficha-espacio', id: toque.espacioId } : null;
    case 'familia':
      if (toque.ocupante) return { tipo: 'ficha-miembro', id: toque.ocupante };
      return toque.enCartel ? { tipo: 'hoja-fuera' } : null;
    case 'actividades':
      return toque.burbuja ? { tipo: 'hoja', lugar: toque.burbuja } : null;
    default:
      return null;
  }
}
```
- [ ] Implementar el filtro. En `src/historial.js`, reemplazar la línea de `miembrosDelFiltro` y su comentario por:
```js
// Opciones del filtro (AC-3.1 de la 006, AC-7.5 de la 007): el propietario y los familiares siempre, y las mascotas activas solo si tienen alguna entrada
// (únicamente pueden venir de datos anteriores a la 007).
export const miembrosDelFiltro = (estado) => [
  ...personasQueJuegan(estado),
  ...mascotas(estado).filter((m) => estado.historial.some((x) => x.miembroId === m.id)),
];
```
- [ ] Run: `cd poc && npm test` — expect: PASS, 340 pruebas, 0 fallos (301 existentes + 39 nuevas: 4 contrato, 4 catálogo, 1 habitantes, 3 + 5 actividades, 8 formularios, 4 secciones, 1 calificaciones, 9 almacén)
- [ ] Commit: `feat(secciones): add the section bar logic, the map reaction per section and the history filter for pets` (cuerpo: `Plan section: Phase 4: Secciones, respuesta del mapa y filtro del historial` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 5: Barra, drawers y fichas de familiar y mascota

**Implements:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7 (drawer, Hechas), FR-11, FR-12, FR-13 | **Satisfies:** AC-1.1 a AC-1.11, AC-2.1 a AC-2.7, AC-3.1 a AC-3.3, AC-4.1 a AC-4.7, AC-5.1, AC-5.2, AC-5.3, AC-5.6, AC-5.7, AC-5.9, AC-5.10, AC-6.1 a AC-6.6, AC-7.1 a AC-7.9, AC-12.1 a AC-12.7, AC-13.1 a AC-13.5, AC-14.1 a AC-14.4
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: `SECCIONES`, `textoPestana`, `accionDeToque` (Fase 4); `ASPECTOS`, `DATOS_ASPECTO`, `ASPECTO_INICIAL`, `ESPECIES`, `DATOS_ESPECIE`, `ESPECIE_INICIAL` (Fase 1); `agregarHabitante`, `editarHabitante` con `aspecto`/`especie` (Fase 1); `miembrosDelFiltro` (Fase 4); `familiares`, `mascotas` (`hogar.js`). Produces: en la página, la barra `#barra`, el drawer `#drawer` con las secciones `#sec-espacios`, `#sec-familia`, `#sec-actividades` (`#pendientes`, `#hechas`) y `#sec-intercambios`, el indicador `#juega`, el selector de iconos `#selector-iconos` y la ficha de habitante con el botón de icono `#ficha-icono`. En `juego.js`: `seccion` (`null` en exploración), `abrirSeccion`, `cerrarSeccion`, `pintarDrawer`, `mostrarChrome`, `cerrarFichasYHojas`, `abrirSelectorIconos(titulo, opciones, actual, alElegir)`. La ficha de actividad sigue siendo la anterior hasta la Fase 6.

Reorganiza la presentación: la barra inferior con sus cuatro drawers, el indicador "Juega" siempre visible, el mapa que responde según la sección, la tecla Espacio liberada y las fichas de familiar y mascota de una fila. No hay prueba automática previa porque la fase es solo de presentación (`.claude/rules/testing.md`: sin pruebas que dependan de renderizado real); toda decisión de qué mostrar vive en `secciones.js` y `formularios.js` con sus pruebas de las Fases 3 y 4, y la fase se verifica en el navegador (Fase 7).

> **Complexity note** (Phase 5): Gate: Simplicity. Violation: la fase toca `index.html` y `juego.js` completos y es la más grande del plan. Justification: la barra, los drawers, el indicador y la ficha de habitante comparten el mismo HTML y las mismas funciones de pintado (`pintarDrawer`, `abrirSeccion`); partirla dejaría la página sin cargar entre dos fases. La ficha de actividad, que es independiente, queda para la Fase 6.

- [ ] Reemplazar `poc/index.html` por (la ficha de actividad conserva su marcado anterior hasta la Fase 6):
```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <title>Livin · PoC mapa del hogar</title>
  <style>
    :root { --base: calc(56px + env(safe-area-inset-bottom)); } /* alto de la barra inferior */
    html, body { margin: 0; height: 100%; background: #1d1d1d; overflow: hidden; font-family: system-ui, sans-serif; touch-action: none; }
    #juego { position: fixed; inset: 0; }
    button { font: inherit; border: 0; border-radius: 8px; background: #f2ead3; color: #2a221c; }
    button:disabled { opacity: .35; }
    #juega { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; padding: 10px 14px; max-width: 62vw;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cruceta { position: fixed; left: 16px; bottom: calc(24px + var(--base)); display: grid; grid-template: repeat(3, 52px) / repeat(3, 52px);
      gap: 4px; user-select: none; pointer-events: none; } /* los huecos de la cruceta dejan pasar el toque al mapa: cartel y burbujas (AC-5.4) */
    #cruceta button { font-size: 20px; background: rgba(242, 234, 211, .85); pointer-events: auto; }
    #cruceta [data-dir="arriba"] { grid-area: 1 / 2; } #cruceta [data-dir="izquierda"] { grid-area: 2 / 1; }
    #cruceta [data-dir="derecha"] { grid-area: 2 / 3; } #cruceta [data-dir="abajo"] { grid-area: 3 / 2; }
    #barra { position: fixed; left: 0; right: 0; bottom: 0; height: var(--base); padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box;
      display: flex; background: #2a221c; }
    #barra .pestana { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
      padding: 4px 2px; border-radius: 0; background: transparent; color: #f2ead3; }
    #barra .pestana .icono { font-size: 20px; line-height: 1; }
    #barra .pestana small { font-size: 11px; white-space: nowrap; }
    #barra .pestana[aria-pressed="true"] { background: #f2ead3; color: #2a221c; }
    #drawer { position: fixed; left: 0; right: 0; bottom: var(--base); height: 45%; overflow-y: auto; box-sizing: border-box; display: none;
      background: #f2ead3; color: #2a221c; padding: 0 16px 12px; border-radius: 14px 14px 0 0; }
    #drawer header { position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 0 8px; background: #f2ead3; }
    #drawer button { background: #2a221c; color: #f2ead3; }
    #drawer select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    .fila { display: grid; grid-template-columns: 1fr 36px 28px 36px; align-items: center; gap: 6px; padding: 4px 0; }
    .fila small { display: block; opacity: .7; }
    .fila button { height: 32px; font-size: 18px; }
    .fila .cuenta { text-align: center; }
    .fila.cabecera { grid-template-columns: 1fr auto auto; }
    .fila.cabecera button { font-size: 15px; padding: 0 10px; }
    .fila.actividad { grid-template-columns: 28px 1fr; cursor: pointer; }
    .icono { font-size: 20px; text-align: center; }
    .subtitulo { display: block; margin: 12px 0 4px; }
    .selector { display: flex; gap: 6px; margin-bottom: 8px; }
    .selector button { flex: 1; padding: 8px 10px; }
    #drawer .selector button[aria-pressed="false"], #rutina .selector button[aria-pressed="false"] { background: #d9cfb4; color: #2a221c; }
    #ficha-actividad select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    #ficha, #ficha-actividad { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    #ficha form, #ficha-actividad form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(320px, 86vw);
      max-height: 90vh; overflow-y: auto; box-sizing: border-box; }
    #ficha input, #ficha-actividad input { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 8px 0 4px; }
    #ficha .error, #ficha-actividad .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    #ficha .acciones, #ficha-actividad .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha .acciones button, #ficha-actividad .acciones button { padding: 8px 12px; background: #2a221c; color: #f2ead3; }
    #ficha .acciones .peligro, #ficha-actividad .acciones .peligro { background: #a32d2d; margin-right: auto; }
    .fila-nombre { display: flex; gap: 8px; align-items: center; margin: 8px 0 4px; }
    #ficha .fila-nombre input, #ficha-actividad .fila-nombre input { flex: 1; width: auto; min-width: 0; margin: 0; }
    .icono-boton { width: 44px; height: 44px; flex: none; padding: 0; font-size: 22px; background: #fff; border: 1px solid #b9ad8c; }
    .icono-boton[aria-disabled="true"] { background: #e9e2cb; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
    .chip { padding: 6px 10px; border-radius: 16px; background: #d9cfb4; color: #2a221c; }
    .chip[aria-pressed="true"] { background: #2a221c; color: #f2ead3; }
    .circulos { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; }
    .circulo { width: 40px; height: 40px; padding: 0; border-radius: 50%; color: #fff; font-weight: bold; outline-offset: 2px; }
    .circulo[aria-pressed="true"] { outline: 3px solid #2a221c; }
    .resumen-ficha { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #d9cfb4; }
    .resumen-ficha button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    #actividad-mas label { display: block; margin: 6px 0; font-size: 13px; }
    .rejilla { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .opcion-icono { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; background: #d9cfb4; color: #2a221c; }
    .opcion-icono .icono { font-size: 26px; }
    .opcion-icono[aria-pressed="true"] { outline: 3px solid #2a221c; }
    #hoja { position: fixed; left: 0; right: 0; bottom: 0; max-height: 55%; overflow-y: auto; background: #f2ead3; color: #2a221c;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border-radius: 14px 14px 0 0; display: none; }
    #hoja header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    #hoja .item { display: grid; grid-template-columns: 28px 1fr auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 1px solid #d9cfb4; }
    #hoja .item small { display: block; opacity: .7; }
    #hoja .botones { display: flex; gap: 6px; }
    #hoja button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    #hoja .peligro { background: #a32d2d; }
    #hoja .item.tocable { cursor: pointer; }
    #ficha .rutina { width: 100%; padding: 8px; margin: 4px 0; background: #2a221c; color: #f2ead3; }
    #rutina, #ficha-bloque { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    #rutina section, #ficha-bloque form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(340px, 90vw);
      max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
    #rutina header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    #rutina button, #ficha-bloque .acciones button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    #rutina .bloque { padding: 10px 0; border-top: 1px solid #d9cfb4; cursor: pointer; }
    #ficha-bloque select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    #ficha-bloque .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    #ficha-bloque .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha-bloque .acciones .peligro { background: #a32d2d; margin-right: auto; }
    #aviso { position: fixed; top: calc(60px + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); background: #2a221c;
      color: #f2ead3; padding: 8px 14px; border-radius: 8px; display: none; max-width: 86vw; }
    #depuracion { position: fixed; top: calc(8px + env(safe-area-inset-top)); left: 8px; color: #9fe1cb; font: 12px monospace; }
    .modal { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: none; align-items: center; justify-content: center; }
    .modal section, .modal form { background: #f2ead3; color: #2a221c; padding: 16px; border-radius: 12px; width: min(340px, 90vw);
      max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
    .modal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .modal button { padding: 6px 10px; background: #2a221c; color: #f2ead3; }
    .modal .peligro, #drawer .peligro { background: #a32d2d; }
    .modal .item, #drawer .item { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 1px solid #d9cfb4; }
    .modal .item.tocable, #drawer .item.tocable { cursor: pointer; }
    .modal .item small, #drawer .item small { display: block; opacity: .7; }
    .modal .botones, #drawer .botones { display: flex; gap: 6px; }
    .modal .subtitulo { display: block; margin: 12px 0 4px; }
    .modal select { width: 100%; box-sizing: border-box; padding: 8px; font: inherit; margin: 4px 0; }
    .modal .error, #drawer .error { color: #a32d2d; min-height: 1.2em; font-size: 13px; }
    .modal .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .modal .ancho, #drawer .ancho { width: 100%; margin-top: 8px; padding: 10px; }
    .nota { display: block; font-size: 13px; opacity: .7; min-height: 1em; }
    .modal .resumen, #drawer .resumen { display: block; margin: 8px 0; }
    .modal .fila-historial, #drawer .fila-historial { padding: 8px 0; border-top: 1px solid #d9cfb4; }
    .modal .fila-historial small, #drawer .fila-historial small { display: block; opacity: .7; }
    .modal .fila-historial .pie, #drawer .fila-historial .pie { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .modal .estrellas, #drawer .estrellas { display: flex; gap: 2px; }
    .modal .estrellas button, #drawer .estrellas button { min-width: 40px; min-height: 40px; padding: 0; font-size: 22px; background: transparent; color: #2a221c; }
    .modal .estrellas button:disabled, #drawer .estrellas button:disabled { opacity: .45; }
  </style>
</head>
<body>
  <div id="juego"></div>
  <div id="depuracion"></div>
  <button id="juega">Juega</button>
  <div id="cruceta">
    <button data-dir="arriba" aria-label="Arriba">▲</button>
    <button data-dir="izquierda" aria-label="Izquierda">◀</button>
    <button data-dir="derecha" aria-label="Derecha">▶</button>
    <button data-dir="abajo" aria-label="Abajo">▼</button>
  </div>
  <section id="drawer" aria-label="Sección abierta">
    <header><strong id="drawer-titulo"></strong><button type="button" id="listo">Listo</button></header>
    <div id="sec-espacios" class="seccion"><div id="contadores"></div></div>
    <div id="sec-familia" class="seccion"></div>
    <div id="sec-actividades" class="seccion">
      <div class="selector" role="group" aria-label="Actividades">
        <button type="button" data-pestana="pendientes">Pendientes</button>
        <button type="button" data-pestana="hechas">Hechas</button>
      </div>
      <div id="pendientes"></div>
      <div id="hechas">
        <select id="historial-filtro" aria-label="Persona"></select>
        <strong class="resumen" id="historial-resumen"></strong>
        <div id="historial-lista"></div>
        <div class="error" id="historial-error"></div>
      </div>
    </div>
    <div id="sec-intercambios" class="seccion">
      <strong class="subtitulo">Recibidas</strong>
      <div id="intercambios-recibidas"></div>
      <strong class="subtitulo">Enviadas</strong>
      <div id="intercambios-enviadas"></div>
      <button type="button" id="intercambios-proponer" class="ancho">Proponer</button>
      <div class="error" id="intercambios-motivo"></div>
    </div>
  </section>
  <nav id="barra" aria-label="Secciones"></nav>
  <div id="ficha">
    <form>
      <strong id="ficha-titulo"></strong>
      <div class="fila-nombre">
        <button type="button" id="ficha-icono" class="icono-boton"></button>
        <input id="ficha-nombre" maxlength="20" autocomplete="off">
      </div>
      <button type="button" id="ficha-rutina" class="rutina">Rutina</button>
      <div class="error" id="ficha-error"></div>
      <div class="acciones">
        <button type="button" class="peligro" id="ficha-eliminar">Eliminar</button>
        <button type="button" id="ficha-cancelar">Cancelar</button>
        <button type="submit" id="ficha-guardar">Renombrar</button>
      </div>
    </form>
  </div>
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
      <small class="nota" id="actividad-nota"></small>
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
  <div id="quien" class="modal">
    <section aria-label="¿Quién juega?">
      <header><strong>¿Quién juega?</strong><button type="button" id="quien-cerrar">Cerrar</button></header>
      <div id="quien-lista"></div>
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
  <div id="selector-iconos" class="modal">
    <section aria-label="Elegir icono">
      <header><strong id="selector-titulo"></strong><button type="button" id="selector-cerrar">Cerrar</button></header>
      <div id="selector-lista" class="rejilla"></div>
    </section>
  </div>
  <div id="aviso" role="status"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js"></script>
  <script type="module" src="src/juego.js"></script>
</body>
</html>
```
- [ ] Imports de `src/juego.js`. Reemplazar las líneas de `import … from './catalogo.js'` y `import … from './hogar.js'` y agregar el de `secciones.js` (la ficha de actividad aún usa `FRECUENCIAS` y `agregarActividad`, que se quitan en la Fase 6):
```js
import {
  TIPOS, ETIQUETAS, ASPECTOS, DATOS_ASPECTO, ASPECTO_INICIAL, ESPECIES, DATOS_ESPECIE, ESPECIE_INICIAL, LIMITES_HABITANTES, ICONOS, FRECUENCIAS,
  LIMITE_ACTIVIDADES, DIAS_RUTINA, LIMITE_BLOQUES, MAX_ESTRELLAS,
} from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, familiares, mascotas, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante, pendientesDeMiembro, bloquesDeMiembro, personasQueJuegan, puedeJugar, jugadorInicial,
} from './hogar.js';
import { SECCIONES, textoPestana, accionDeToque } from './secciones.js';
```
- [ ] Colores y tamaños. En `src/juego.js`, reemplazar las líneas desde el comentario `// Aspecto de los habitantes (FR-8), arte de marcador…` hasta `const COLOR_BORDE_HABITANTE = 0x2a221c;` (las constantes `COLOR_FAMILIAR` y `COLOR_MASCOTA`) por:
```js
// Aspecto de los habitantes (FR-8 de la 002, FR-5 y FR-6 de la 007), arte de marcador: personas de 12×14 —más pequeñas si son niños— y
// mascotas de 8×8; los colores y la escala salen del catálogo.
const COLOR_BORDE_HABITANTE = 0x2a221c;
```
  y reemplazar la función `colorDe` (y su comentario de apertura quedan) por:
```js
function colorDe(miembro) {
  if (miembro.tipo === 'mascota') return DATOS_ESPECIE[miembro.especie].color;
  if (esPropietario(estado, miembro)) return COLOR_PROPIETARIO;
  return DATOS_ASPECTO[miembro.aspecto].color;
}
const escalaDe = (miembro) => (miembro.tipo === 'persona' && miembro.aspecto !== null ? DATOS_ASPECTO[miembro.aspecto].escala : 1);
const colorCss = (color) => `#${color.toString(16).padStart(6, '0')}`;
const iconoDeMiembro = (miembro) => (miembro.tipo === 'mascota' ? DATOS_ESPECIE[miembro.especie].icono : (DATOS_ASPECTO[miembro.aspecto]?.icono ?? '🧑'));
```
  En `dibujarJugador(escala)`, reemplazar `this.cuerpoPersonaje.setFillStyle(colorDe(miembro));` por:
```js
    this.cuerpoPersonaje.setFillStyle(colorDe(miembro)).setSize(12 * escalaDe(miembro), 14 * escalaDe(miembro));
```
  En `sincronizarSprites()`, reemplazar `: this.add.rectangle(0, 0, 12, 14, colorDe(miembro));` por:
```js
        : this.add.rectangle(0, 0, 12 * escalaDe(miembro), 14 * escalaDe(miembro), colorDe(miembro));
```
- [ ] Tecla Espacio (FR-13). En `Escena.create()`, reemplazar `this.teclas = this.input.keyboard.createCursorKeys();` por:
```js
    // Solo las cuatro flechas y sin captura global del teclado: `createCursorKeys` también captura Espacio y Mayúsculas, y cancelaba esa tecla en
    // los campos de texto del navegador de escritorio (FR-13 de la 007).
    const { UP, DOWN, LEFT, RIGHT } = Phaser.Input.Keyboard.KeyCodes;
    this.teclas = this.input.keyboard.addKeys({ up: UP, down: DOWN, left: LEFT, right: RIGHT }, false);
```
- [ ] Encuadre del hogar. En `encuadrarHogar()`, reemplazar `const altoPanel = $('panel').offsetHeight;` por:
```js
    const altoPanel = $('drawer').offsetHeight + $('barra').offsetHeight; // el hogar completo se ve por encima del drawer y de la barra (AC-1.6)
```
- [ ] Navegación. Reemplazar todo el bloque `// ---------- Modo edición ----------` (desde esa línea hasta justo antes de `function aplicar(nuevo) {`, es decir, `mostrarExploracion`, `estadoAlEditar`, y los manejadores de `#editar` y `#listo`) por:
```js
// ---------- Barra y drawers (FR-1 y FR-2 de la 007) ----------
let seccion = null; // sección abierta: 'espacios' | 'familia' | 'actividades' | 'intercambios'; null en exploración
let pestanaActividades = 'pendientes'; // 'pendientes' | 'hechas'
let estadoAlEditar = null; // rutinas tal como estaban al entrar al modo edición: el cartel no cambia hasta "Listo" (AC-6.5 de la 004)

// La barra se arma desde las secciones: una pestaña por sección, siempre visible (AC-1.1, AC-1.7).
for (const s of SECCIONES) {
  const pestana = elemento('button', undefined, 'pestana');
  pestana.type = 'button';
  pestana.dataset.seccion = s.clave;
  pestana.append(elemento('span', s.icono, 'icono'), elemento('small', s.etiqueta, 'etiqueta'));
  pestana.addEventListener('click', () => abrirSeccion(s.clave));
  $('barra').append(pestana);
}

// Muestra u oculta la cruceta, el drawer y su sección, y marca la pestaña activa (AC-1.3, AC-1.7).
function mostrarChrome() {
  const edicion = seccion !== null;
  $('cruceta').style.display = edicion ? 'none' : 'grid';
  $('drawer').style.display = edicion ? 'block' : 'none';
  for (const el of document.querySelectorAll('#drawer .seccion')) el.style.display = el.id === `sec-${seccion}` ? 'block' : 'none';
  for (const b of document.querySelectorAll('#barra .pestana')) b.setAttribute('aria-pressed', String(b.dataset.seccion === seccion));
  $('drawer-titulo').textContent = SECCIONES.find((s) => s.clave === seccion)?.etiqueta ?? '';
}

// Cierra fichas, hojas y selectores abiertos sin guardar nada (AC-1.11, AC-12.4).
function cerrarFichasYHojas() {
  cerrarHoja();
  cerrarFicha();
  cerrarFichaActividad();
  cerrarFichaIntercambio();
  cerrarSelectorIconos();
  cerrarQuien();
  $('rutina').style.display = 'none';
  rutinaActual = null;
  cerrarFichaBloque();
}

// Entra al modo edición: los habitantes quedan quietos en la casilla a la que se dirigían (AC-7.2 de la 002). Espera si hay un paso en curso.
function entrarEdicion() {
  if (moviendo) return false;
  estadoAlEditar = estado;
  guardarPosicion();
  modo = 'edicion';
  moviles = congelarHabitantes(moviles);
  return true;
}

// Abre el drawer de una sección (AC-1.3); con otro abierto, cambia de sección sin salir de la edición ni mover la cámara (AC-1.4); tocar la
// pestaña activa cierra el drawer (AC-1.5).
function abrirSeccion(clave) {
  if (clave === seccion) { cerrarSeccion(); return; }
  const entrando = seccion === null;
  if (entrando && !entrarEdicion()) return;
  cerrarFichasYHojas();
  seccion = clave;
  if (clave === 'actividades') pestanaActividades = 'pendientes'; // AC-7.1
  mostrarChrome();
  pintarDrawer();
  if (entrando) escena().encuadrarHogar(); // el drawer ya tiene su altura fija: el hogar completo se ve por encima (AC-1.6)
}

// Vuelve a exploración con la cámara siguiendo a quien juega (AC-1.5, AC-3.8 de la 001).
function cerrarSeccion() {
  cerrarFichasYHojas();
  seccion = null;
  modo = 'exploracion';
  jugador = { id: jugador.id, ...resolverPosicion(distribucion, posGuardada) };
  guardarPosicion();
  ahora = ahoraLocal(new Date());
  // FR-6 de la 004: primero el jugador; después cada familiar donde dice su rutina en este momento, con los cambios hechos en edición.
  moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar, objetivosDeFamiliares(estado, ahora));
  mostrarChrome();
  const s = escena();
  s.redibujar();
  s.colocarPersonaje();
  s.seguirPersonaje();
  actualizarBotones(); // el nombre de quien juega pudo cambiar en la edición
}

$('listo').addEventListener('click', cerrarSeccion);

```
- [ ] Cambios de estado que repintan. En `aplicar(nuevo)`, reemplazar las líneas desde `s.colocarPersonaje();` hasta `if (hojaActual) pintarHoja();` por:
```js
  s.colocarPersonaje();
  pintarDrawer(); // antes de reencuadrar: el drawer tiene altura fija, pero su contenido puede cambiar
  s.encuadrarHogar();
  if (hojaActual) pintarHoja();
```
  En `aplicarActividades(nuevo)`, reemplazar `if (modo === 'edicion') pintarPanel();` por `if (seccion) pintarDrawer();` y borrar la última línea `if (intercambiosAbierto()) pintarIntercambios(); // AC-7.11`. En `cambiarDia(fecha)`, reemplazar `if (modo === 'edicion') pintarPanel();` por `if (seccion) pintarDrawer();` y borrar la línea `if (historialAbierto()) pintarHistorial();…`.
- [ ] Contenido de los drawers. Reemplazar el bloque desde `function pintarPanel() {` hasta el final de la función `pintarActividades()` (justo antes de `// ---------- Fichas ----------`; incluye `pintarHabitantes` y `elemento`) por:
```js
// Pinta el drawer de la sección abierta (FR-3, FR-4, FR-7 y FR-12 de la 007).
function pintarDrawer() {
  if (seccion === 'espacios') pintarEspacios();
  else if (seccion === 'familia') pintarFamilia();
  else if (seccion === 'actividades') pintarActividades();
  else if (seccion === 'intercambios') pintarIntercambios();
}

// Los textos escritos por el usuario se insertan siempre como texto, nunca como marcado (NFR de seguridad de la 003).
function elemento(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined) el.textContent = texto;
  if (clase) el.className = clase;
  return el;
}

// Drawer "Espacios" (AC-3.1): un contador por tipo de espacio con − y +; sin habitantes ni actividades.
function pintarEspacios() {
  const cont = $('contadores');
  cont.replaceChildren();
  for (const tipo of TIPOS) {
    const fila = elemento('div', undefined, 'fila');
    const destino = tipo === 'bano' ? siguienteDestinoBano(estado) : null;
    const nombre = elemento('span', ETIQUETAS[tipo]);
    if (destino) nombre.append(elemento('small', `Siguiente: ${nombreVisible(estado, destino)}`)); // texto, nunca marcado (NFR de seguridad de la 003)
    const menos = elemento('button', '−');
    menos.setAttribute('aria-label', 'Quitar');
    const mas = elemento('button', '+');
    mas.setAttribute('aria-label', 'Agregar');
    fila.append(nombre, menos, elemento('span', String(contar(estado, tipo)), 'cuenta'), mas);
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

// Drawer "Familia" (AC-4.1 a AC-4.7): Familiares y Mascotas, cada una con su contador "n de límite", su "+" y la lista de sus habitantes.
function pintarFamilia() {
  const cont = $('sec-familia');
  cont.replaceChildren();
  const secciones = [
    ['familiar', 'Familiares', familiares(estado), 'Aún no hay familiares'],
    ['mascota', 'Mascotas', mascotas(estado), 'Aún no hay mascotas'],
  ];
  for (const [clase, titulo, lista, vacio] of secciones) {
    const mas = elemento('button', '+');
    mas.setAttribute('aria-label', `Agregar ${clase}`);
    mas.disabled = !puedeAgregarHabitante(estado, clase);
    mas.addEventListener('click', () => abrirFichaHabitante(clase, null));
    const cabecera = elemento('div', undefined, 'fila cabecera');
    cabecera.append(elemento('strong', titulo), elemento('span', `${contarHabitantes(estado, clase)} de ${LIMITES_HABITANTES[clase]}`, 'cuenta'), mas);
    cont.append(cabecera);
    if (lista.length === 0) cont.append(elemento('p', vacio, 'nota'));
    for (const m of lista) {
      const fila = elemento('div', undefined, 'fila actividad');
      fila.append(elemento('span', iconoDeMiembro(m), 'icono'), elemento('strong', m.nombre));
      fila.addEventListener('click', () => abrirFichaHabitante(clase, m.id));
      cont.append(fila);
    }
  }
}

// Drawer "Actividades" (AC-7.1 a AC-7.9): las pestañas Pendientes y Hechas (el historial de la 006).
function pintarActividades() {
  for (const b of document.querySelectorAll('#sec-actividades [data-pestana]')) b.setAttribute('aria-pressed', String(b.dataset.pestana === pestanaActividades));
  $('pendientes').style.display = pestanaActividades === 'pendientes' ? 'block' : 'none';
  $('hechas').style.display = pestanaActividades === 'hechas' ? 'block' : 'none';
  if (pestanaActividades === 'pendientes') pintarPendientes();
  else pintarHistorial();
}

for (const boton of document.querySelectorAll('#sec-actividades [data-pestana]')) {
  boton.addEventListener('click', () => {
    pestanaActividades = boton.dataset.pestana;
    if (pestanaActividades === 'hechas') reiniciarFiltroHistorial(); // AC-7.5: el filtro vuelve a "Todos"
    pintarActividades();
  });
}

// Pestaña "Pendientes" (AC-7.2, FR-8 de la 003): contador "n de 50", alta y lista de todas las pendientes.
function pintarPendientes() {
  const cont = $('pendientes');
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
    const nota = textoIntercambio(estado, a); // AC-8.6
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${lugar} · ${textoPlazo(a, hoy)}${nota ? ` · ${nota}` : ''}`));
    fila.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos);
    fila.addEventListener('click', () => abrirFichaActividad(a.id));
    cont.append(fila);
  }
}
```
- [ ] Fichas y mapa. Reemplazar el bloque desde `// ---------- Fichas ----------` hasta la línea `$('ficha-rutina').addEventListener('click', () => abrirRutina(fichaActual.id));` (inclusive; son `llenarSelect`, `mostrarCampos`, `actualizarGuardar`, `abrirFicha`, `abrirFichaHabitante`, `cerrarFicha`, `abrirFichaDeMiembro`, `tocarMapa` y los manejadores de la ficha) por:
```js
// ---------- Fichas ----------
let fichaActual = null; // { tipo: 'espacio' | 'propietario' | 'habitante', id, clase?, icono? }

// Opciones del selector de iconos de un habitante: los aspectos de un familiar o las especies de una mascota (AC-5.2, AC-6.2).
function opcionesDeIcono(clase) {
  return clase === 'familiar'
    ? Object.entries(ASPECTOS).map(([clave, etiqueta]) => [clave, DATOS_ASPECTO[clave].icono, etiqueta])
    : Object.entries(ESPECIES).map(([clave, etiqueta]) => [clave, DATOS_ESPECIE[clave].icono, etiqueta]);
}
const glifoDeIcono = (clase, clave) => (clase === 'familiar' ? DATOS_ASPECTO[clave].icono : DATOS_ESPECIE[clave].icono);

// Selector de iconos (AC-5.2, AC-6.2, AC-8.7): una rejilla de [clave, icono, etiqueta] con la actual marcada; al elegir una, se cierra y llama a `alElegir`.
function abrirSelectorIconos(titulo, opcionesLista, actual, alElegir) {
  $('selector-titulo').textContent = titulo;
  $('selector-lista').replaceChildren(...opcionesLista.map(([clave, icono, etiqueta]) => {
    const boton = elemento('button', undefined, 'opcion-icono');
    boton.type = 'button';
    boton.setAttribute('aria-pressed', String(clave === actual));
    boton.append(elemento('span', icono, 'icono'), elemento('small', etiqueta));
    boton.addEventListener('click', () => { cerrarSelectorIconos(); alElegir(clave); });
    return boton;
  }));
  $('selector-iconos').style.display = 'flex';
}
const cerrarSelectorIconos = () => { $('selector-iconos').style.display = 'none'; };
$('selector-cerrar').addEventListener('click', cerrarSelectorIconos);

// Solo el alta de un habitante (id null) deshabilita guardar hasta tener nombre (AC-5.1, AC-6.1). La edición de un habitante existente lo
// deja activo: un nombre vacío llega a editarHabitante, que lo rechaza y se muestra el mensaje.
function actualizarGuardar() {
  const alta = fichaActual?.tipo === 'habitante' && !fichaActual.id;
  $('ficha-guardar').disabled = alta && $('ficha-nombre').value.trim() === '';
}

function pintarIconoFicha() {
  const boton = $('ficha-icono');
  boton.style.display = 'block';
  boton.textContent = glifoDeIcono(fichaActual.clase, fichaActual.icono);
  boton.setAttribute('aria-label', fichaActual.clase === 'familiar' ? 'Elegir aspecto' : 'Elegir especie');
}

$('ficha-icono').addEventListener('click', () => {
  const { clase, icono } = fichaActual;
  abrirSelectorIconos(clase === 'familiar' ? 'Aspecto' : 'Especie', opcionesDeIcono(clase), icono, (clave) => {
    fichaActual.icono = clave;
    pintarIconoFicha();
  });
});

// Ficha de un espacio o del personaje del propietario (como en la 001: solo renombrar; Eliminar solo en espacios; sin icono, AC-5.10).
function abrirFicha(tipo, id) {
  fichaActual = { tipo, id };
  const esEspacio = tipo === 'espacio';
  const espacio = esEspacio ? buscarEspacio(estado, id) : null;
  const miembro = esEspacio ? null : buscarMiembro(estado, id);
  $('ficha-titulo').textContent = esEspacio ? nombreVisible(estado, espacio) : miembro.nombre;
  $('ficha-nombre').value = esEspacio ? (espacio.nombrePersonalizado ?? '') : miembro.nombre;
  $('ficha-nombre').placeholder = esEspacio ? nombreAutomatico(estado, espacio) : 'Nombre del personaje';
  $('ficha-icono').style.display = 'none';
  $('ficha-rutina').style.display = 'none'; // solo los familiares tienen rutina (AC-1.1 de la 004)
  $('ficha-guardar').textContent = 'Renombrar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = esEspacio ? 'block' : 'none';
  $('ficha-eliminar').disabled = !esEspacio || !puedeEliminar(estado, id);
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

// Ficha de un habitante (AC-5.1, AC-5.6, AC-6.1, AC-6.5): alta si `id` es null; edición si no. Un botón de icono (aspecto o especie) a la izquierda
// del nombre, con "Neutro" u "Otro" por omisión en el alta (AC-5.3, AC-6.3).
function abrirFichaHabitante(clase, id) {
  const miembro = id ? buscarMiembro(estado, id) : null;
  const familiar = clase === 'familiar';
  const icono = miembro ? (familiar ? miembro.aspecto : miembro.especie) : (familiar ? ASPECTO_INICIAL : ESPECIE_INICIAL);
  fichaActual = { tipo: 'habitante', id, clase, icono };
  $('ficha-titulo').textContent = miembro ? miembro.nombre : (familiar ? 'Nuevo familiar' : 'Nueva mascota');
  $('ficha-nombre').value = miembro?.nombre ?? '';
  $('ficha-nombre').placeholder = familiar ? 'Nombre del familiar' : 'Nombre de la mascota';
  pintarIconoFicha();
  $('ficha-rutina').style.display = miembro && familiar ? 'block' : 'none'; // AC-1.1 de la 004
  $('ficha-guardar').textContent = 'Guardar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = miembro ? 'block' : 'none';
  $('ficha-eliminar').disabled = !miembro;
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

const cerrarFicha = () => { $('ficha').style.display = 'none'; fichaActual = null; };

// Ficha de cualquier miembro (AC-4.4 de la 005): la del propietario solo renombra; las de familiares y mascotas, la de siempre.
function abrirFichaDeMiembro(miembro) {
  if (esPropietario(estado, miembro)) abrirFicha('propietario', miembro.id);
  else abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
}

const burbujaEn = (x, y) => ubicarBurbujas(burbujas(estado, hoy), distribucion, posicionesDeMiembros()).find((b) => b.x === x && b.y === y) ?? null;

// Al tocar el mapa. En exploración responden el cartel y las burbujas (FR-8 de la 003, FR-5 de la 004). En edición responde solo lo de la sección
// abierta, según `accionDeToque` (FR-2 de la 007): Espacios, la ficha del espacio; Familia, la del propietario o el habitante y el cartel;
// Actividades, la hoja de la burbuja; Intercambios, nada.
function tocarMapa(x, y, enCartel) {
  if (modo === 'exploracion' && enCartel) { abrirHoja({ tipo: 'fuera' }); return; }
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  if (modo === 'exploracion') {
    const burbuja = burbujaEn(x, y);
    if (burbuja) abrirHoja(burbuja);
    return;
  }
  const ocupante = x === jugador.x && y === jugador.y ? jugador : moviles.find((h) => h.fase !== 'fuera' && h.x === x && h.y === y);
  const clave = distribucion.espacioEn[y][x];
  const accion = accionDeToque(seccion, {
    ocupante: ocupante?.id ?? null, enCartel, burbuja: burbujaEn(x, y), espacioId: clave && buscarEspacio(estado, clave) ? clave : null,
  });
  if (!accion) return;
  if (accion.tipo === 'ficha-espacio') abrirFicha('espacio', accion.id);
  else if (accion.tipo === 'ficha-miembro') abrirFichaDeMiembro(buscarMiembro(estado, accion.id));
  else if (accion.tipo === 'hoja-fuera') abrirHoja({ tipo: 'fuera' });
  else if (accion.tipo === 'hoja') abrirHoja(accion.lugar);
}

$('ficha').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const { tipo, id, clase } = fichaActual;
  const texto = $('ficha-nombre').value;
  let r;
  if (tipo === 'espacio') r = renombrarEspacio(estado, id, texto, ctx);
  else if (tipo === 'propietario') r = renombrarMiembro(estado, id, texto, ctx);
  else {
    const datos = clase === 'familiar' ? { nombre: texto, aspecto: fichaActual.icono } : { nombre: texto, especie: fichaActual.icono };
    r = id ? editarHabitante(estado, id, datos, ctx) : agregarHabitante(estado, clase, datos, ctx);
  }
  if (!r.ok) { $('ficha-error').textContent = MENSAJES_ERROR[r.error]; return; }
  cerrarFicha();
  aplicar(r.estado);
});
$('ficha-nombre').addEventListener('input', () => { $('ficha-error').textContent = ''; actualizarGuardar(); });
$('ficha-cancelar').addEventListener('click', cerrarFicha);
$('ficha-eliminar').addEventListener('click', () => {
  const { tipo, id } = fichaActual;
  if (tipo === 'habitante') {
    const bajas = textoBajas(pendientesDeMiembro(estado, id), bloquesDeMiembro(estado, id));
    const pregunta = `¿Eliminar a "${buscarMiembro(estado, id).nombre}"?${bajas ? ` ${bajas}` : ''}`;
    if (!window.confirm(pregunta)) return; // AC-8.1, AC-8.2 de la 002; AC-7.7, AC-7.8 de la 003; AC-10.7 a AC-10.9 de la 004
    cerrarFicha();
    aplicar(eliminarHabitante(estado, id, ctx));
    return;
  }
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});

$('ficha-rutina').addEventListener('click', () => abrirRutina(fichaActual.id));
```
- [ ] Indicador "Juega" y cambio de jugador. En el bloque `// ---------- Quién juega ----------`, reemplazar `actualizarBotones` y `cerrarPaneles` (hasta antes del comentario de `abrirQuien`) por:
```js
function actualizarBotones() {
  $('juega').textContent = `Juega: ${buscarMiembro(estado, jugador.id).nombre}`; // AC-12.1
  const pestana = document.querySelector('#barra [data-seccion="intercambios"] .etiqueta');
  pestana.textContent = textoPestana('intercambios', numeroRecibidas(estado, jugador.id)); // AC-1.8
}

const cerrarQuien = () => { $('quien').style.display = 'none'; };
```
  (la línea `const cerrarQuien = …` ya existía justo antes de `cerrarPaneles`: dejar una sola.) En `elegirJugador(id)`, reemplazar desde `moviles = r.moviles;` hasta `ultimaRegeneracionMs = performance.now() - t0; // meta de 100 ms (AC-2.10)` por:
```js
  moviles = modo === 'edicion' ? congelarHabitantes(r.moviles) : r.moviles; // en edición nadie camina (AC-12.4)
  jugador = r.jugador;
  cerrarFichasYHojas(); // AC-12.4
  guardarPosicion(); // AC-5.2
  actualizarBotones();
  const s = escena();
  s.colocarPersonaje();
  if (modo === 'edicion') s.encuadrarHogar(); // la cámara sigue en el encuadre completo (AC-12.4)
  else s.seguirPersonaje(); // centra la cámara y rehace etiquetas, nombres, burbujas y cartel
  if (seccion) pintarDrawer(); // el drawer sigue en su pestaña, con el contenido de la nueva persona (AC-12.3)
  ultimaRegeneracionMs = performance.now() - t0; // meta de 100 ms (AC-2.10)
```
- [ ] Intercambios dentro del drawer. En el bloque `// ---------- Intercambios ----------`, borrar `const intercambiosAbierto = …`, las funciones `abrirIntercambios` y `cerrarIntercambios` y las dos líneas `$('intercambios').addEventListener('click', abrirIntercambios);` y `$('intercambios-cerrar').addEventListener('click', cerrarIntercambios);`; agregar, junto a `cerrarFichaIntercambio`, nada más (esa constante ya existe). Cambiar el comentario del bloque a `// ---------- Intercambios (FR-7 a FR-11 de la 005, FR-12 de la 007) ----------`. `pintarIntercambios()` no cambia: ahora pinta dentro del drawer.
- [ ] Hechas dentro del drawer. En el bloque `// ---------- Historial y calificaciones ----------`: borrar `const historialAbierto = …`, las funciones `abrirHistorial` y `cerrarHistorial` y las líneas `$('historial').addEventListener('click', abrirHistorial);` y `$('historial-cerrar').addEventListener('click', cerrarHistorial);`; mantener `let filtroHistorial` y el manejador de `#historial-filtro`; agregar en su lugar:
```js
// El filtro vuelve a "Todos" cada vez que se muestra la pestaña "Hechas" (AC-3.10 de la 006, AC-7.5 de la 007). Ofrece las personas y solo las
// mascotas con alguna entrada.
function reiniciarFiltroHistorial() {
  filtroHistorial = null;
  opciones($('historial-filtro'), [['', 'Todos'], ...miembrosDelFiltro(estado).map((m) => [m.id, m.nombre])], '');
  $('historial-error').textContent = '';
}
```
  y en `aplicarHistorial(r)`, reemplazar las tres líneas que usan `$('panel-historial').querySelector('section')` por:
```js
  const desplazamiento = $('drawer').scrollTop;
  pintarHistorial();
  $('drawer').scrollTop = desplazamiento;
```
- [ ] Arranque. Al final de `src/juego.js`, reemplazar `actualizarBotones();` y la línea siguiente por:
```js
actualizarBotones();
mostrarChrome();
if (inicio.aviso) avisar(inicio.aviso);
```
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida (sintaxis válida)
- [ ] Run: `cd poc && grep -nE '\$\(.(editar|intercambios|historial|panel|panel-intercambios|panel-historial|ficha-parentesco|ficha-genero|ficha-especie).\)|pintarPanel|mostrarExploracion|PARENTESCOS|GENEROS' src/juego.js` — expect: sin salida (no quedan referencias a lo que se quitó)
- [ ] Run: `cd poc && npm test` — expect: PASS, 340 pruebas (la presentación no cambia las pruebas)
- [ ] Commit: `feat(poc): add the bottom bar with a drawer per section and the one-row family and pet forms` (cuerpo: `Plan section: Phase 5: Barra, drawers y fichas de familiar y mascota` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 6: Ficha de actividad simple

**Implements:** FR-8, FR-9 | **Satisfies:** AC-8.1, AC-8.2, AC-8.3, AC-8.5, AC-8.6, AC-8.7, AC-8.8, AC-8.9, AC-8.10, AC-8.11, AC-8.12, AC-8.13, AC-8.14, AC-8.15, AC-8.16, AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6, AC-9.7, AC-9.8, AC-9.9, AC-9.10, AC-9.11, AC-10.1, AC-10.2, AC-10.3, AC-10.4, AC-10.5, AC-10.6, AC-10.7, AC-10.8, AC-10.9, AC-10.10, AC-10.11, AC-11.1, AC-11.6
**Files:** `poc/index.html`, `poc/src/juego.js`
**Interfaces:** Consumes: `sugerenciasPara`, `iconoDeFicha`, `iconoDeEdicion`, `OPCIONES_RECURRENCIA`, `datosDeRecurrencia`, `valorDeRecurrencia`, `resumenDeFicha`, `inicialDe` (Fase 3); `agregarActividades`, `editarActividad`, `MENSAJES_ACTIVIDAD` (Fases 1 y 3); `abrirSelectorIconos`, `colorDe`, `colorCss` (Fase 5). Produces: la ficha `#ficha-actividad` rehecha (icono + nombre, sugerencias, responsable, línea-resumen con "Cambiar", fecha, recurrencia y lugares) y las funciones `abrirFichaActividad(id)`, `pintarFichaActividad()`, `cerrarFichaActividad`.

Cierra la presentación: la ficha de actividad de una fila con sugerencias, círculos de responsable y lugares como chips de selección múltiple. Toda regla (qué sugerencias salen, cuándo el icono se puede cambiar, qué dice el resumen, cómo se crean varias) vive en las funciones puras de la Fase 3; esta fase solo las pinta y se verifica en el navegador (Fase 7).

- [ ] Reemplazar en `poc/index.html` el bloque `<div id="ficha-actividad"> … </div>` por:
```html
  <div id="ficha-actividad">
    <form>
      <strong id="actividad-titulo"></strong>
      <div class="fila-nombre">
        <button type="button" id="actividad-icono" class="icono-boton"></button>
        <input id="actividad-nombre" maxlength="30" autocomplete="off" placeholder="Nombre de la actividad">
      </div>
      <div id="actividad-sugerencias" class="chips"></div>
      <span class="subtitulo">Quién</span>
      <div id="actividad-quien" class="circulos"></div>
      <small class="nota" id="actividad-nota"></small>
      <div class="resumen-ficha"><span id="actividad-resumen"></span><button type="button" id="actividad-cambiar">Cambiar</button></div>
      <div id="actividad-mas">
        <label>Fecha <input id="actividad-vence" type="date"></label>
        <label>Recurrencia <select id="actividad-recurrencia"></select></label>
        <span class="subtitulo">Lugares</span>
        <div id="actividad-lugares" class="chips"></div>
      </div>
      <div class="error" id="actividad-error"></div>
      <div class="acciones">
        <button type="button" class="peligro" id="actividad-eliminar">Eliminar</button>
        <button type="button" id="actividad-cancelar">Cancelar</button>
        <button type="submit" id="actividad-guardar">Guardar</button>
      </div>
    </form>
  </div>
```
- [ ] Imports de `src/juego.js`: quitar `FRECUENCIAS` de la lista de `./catalogo.js`; en la lista de `./actividades.js`, reemplazar `agregarActividad` por `agregarActividades`; y agregar:
```js
import {
  sugerenciasPara, iconoDeFicha, iconoDeEdicion, OPCIONES_RECURRENCIA, datosDeRecurrencia, valorDeRecurrencia, resumenDeFicha, inicialDe,
} from './formularios.js';
```
- [ ] Reemplazar el bloque desde `// ---------- Ficha de una actividad (FR-1 y FR-8 de la 003) ----------` hasta el manejador de `#actividad-eliminar` (inclusive; es decir, `actividadEnFicha`, `opciones`, `abrirFichaActividad`, `actualizarFichaActividad`, `cerrarFichaActividad`, `datosDeFichaActividad`, `confirmarYEliminarActividad` y sus manejadores) por:
```js
// ---------- Ficha de una actividad (FR-8 y FR-9 de la 007) ----------
let actividadEnFicha = null; // id de la actividad en edición, o null en un alta
let fichaAct = null; // estado de la ficha abierta: { quien, lugares (Set de ids), icono ({ icono, editable, manual }), desplegada }

function opciones(select, pares, valor) {
  select.replaceChildren(...pares.map(([clave, texto]) => new Option(texto, clave)));
  select.value = valor;
}

// Alta (AC-8.1, AC-9.2, AC-9.4): nombre vacío, icono 📌, quien juega, hoy, una vez y sin lugar. Edición: los datos de la actividad (AC-8.15).
function abrirFichaActividad(id) {
  actividadEnFicha = id;
  const a = id ? buscarActividad(estado, id) : null;
  fichaAct = {
    quien: a ? a.miembroId : jugador.id,
    lugares: new Set(a?.espacioId ? [a.espacioId] : []),
    icono: a ? iconoDeEdicion(a.nombre, a.icono) : iconoDeFicha('', null),
    desplegada: false,
  };
  $('actividad-titulo').textContent = a ? a.nombre : 'Nueva actividad';
  $('actividad-nombre').value = a?.nombre ?? '';
  $('actividad-vence').value = a?.vence ?? hoy;
  opciones($('actividad-recurrencia'), OPCIONES_RECURRENCIA, a ? valorDeRecurrencia(a) : '0');
  $('actividad-nota').textContent = a ? textoIntercambio(estado, a) : ''; // AC-8.6 de la 005
  $('actividad-error').textContent = '';
  $('actividad-eliminar').style.display = a ? 'block' : 'none';
  pintarFichaActividad();
  $('ficha-actividad').style.display = 'flex';
}

// Repinta lo que depende del estado de la ficha: icono, sugerencias, responsable, lugares y resumen; y habilita Guardar.
function pintarFichaActividad() {
  const texto = $('actividad-nombre').value;
  const icono = $('actividad-icono');
  icono.textContent = GLIFO_ICONO[fichaAct.icono.icono];
  icono.setAttribute('aria-disabled', String(!fichaAct.icono.editable));
  icono.setAttribute('aria-label', fichaAct.icono.editable ? 'Elegir icono' : 'Icono de la sugerencia');
  $('actividad-sugerencias').replaceChildren(...sugerenciasPara(texto).map((s) => { // AC-8.2, AC-8.3
    const chip = elemento('button', `${GLIFO_ICONO[s.icono]} ${s.nombre}`, 'chip');
    chip.type = 'button';
    chip.addEventListener('click', () => { $('actividad-nombre').value = s.nombre; alCambiarNombre(); }); // AC-8.5
    return chip;
  }));
  $('actividad-quien').replaceChildren(...personasQueJuegan(estado).map((m) => { // AC-9.1: personas, nunca mascotas
    const circulo = elemento('button', inicialDe(m.nombre), 'circulo');
    circulo.type = 'button';
    circulo.style.background = colorCss(colorDe(m));
    circulo.setAttribute('aria-label', m.nombre);
    circulo.setAttribute('aria-pressed', String(m.id === fichaAct.quien));
    circulo.addEventListener('click', () => { fichaAct.quien = m.id; pintarFichaActividad(); }); // AC-9.3
    return circulo;
  }));
  const espacios = espaciosActivos(estado);
  $('actividad-lugares').replaceChildren(...espacios.map((e) => { // AC-10.1
    const chip = elemento('button', nombreVisible(estado, e), 'chip');
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(fichaAct.lugares.has(e.id)));
    chip.addEventListener('click', () => alTocarLugar(e.id));
    return chip;
  }));
  $('actividad-resumen').textContent = resumenDeFicha({
    vence: $('actividad-vence').value, hoy, recurrencia: $('actividad-recurrencia').value,
    lugares: espacios.filter((e) => fichaAct.lugares.has(e.id)).map((e) => nombreVisible(estado, e)),
  });
  $('actividad-mas').style.display = fichaAct.desplegada ? 'block' : 'none';
  $('actividad-cambiar').textContent = fichaAct.desplegada ? 'Ocultar' : 'Cambiar';
  // En un alta, guardar se activa con nombre y responsable (AC-8.12). En una edición queda activo: un nombre vacío llega a editarActividad,
  // que lo rechaza con su mensaje (AC-6.5 de la 003).
  $('actividad-guardar').disabled = actividadEnFicha === null && ($('actividad-nombre').value.trim() === '' || fichaAct.quien === '');
}

// Al crear, los lugares son de selección múltiple (AC-10.1); al editar, de selección única y se pueden desmarcar (AC-10.8).
function alTocarLugar(id) {
  if (actividadEnFicha) fichaAct.lugares = new Set(fichaAct.lugares.has(id) ? [] : [id]);
  else if (fichaAct.lugares.has(id)) fichaAct.lugares.delete(id);
  else fichaAct.lugares.add(id);
  pintarFichaActividad();
}

// Al cambiar el texto del nombre, el icono se recalcula (AC-8.5 a AC-8.11): fijo con una sugerencia, a mano o genérico si no.
function alCambiarNombre() {
  fichaAct.icono = iconoDeFicha($('actividad-nombre').value, fichaAct.icono.manual);
  $('actividad-error').textContent = '';
  pintarFichaActividad();
}

const cerrarFichaActividad = () => { $('ficha-actividad').style.display = 'none'; actividadEnFicha = null; fichaAct = null; };

function datosDeFichaActividad() {
  return {
    nombre: $('actividad-nombre').value, icono: fichaAct.icono.icono, miembroId: fichaAct.quien, espacioId: [...fichaAct.lugares][0] ?? null,
    vence: $('actividad-vence').value, ...datosDeRecurrencia($('actividad-recurrencia').value),
  };
}

// Eliminar una actividad pide confirmación con su nombre (AC-6.6). Devuelve si se eliminó.
function confirmarYEliminarActividad(id) {
  const a = buscarActividad(estado, id);
  if (!a || !window.confirm(`¿Eliminar la actividad "${a.nombre}"?`)) return false;
  aplicarActividades(eliminarActividad(estado, id, ctx));
  return true;
}

// Guardar: una edición cambia solo esa actividad; un alta crea una por cada lugar marcado, o una sin espacio (AC-9.9, AC-10.2, AC-10.3).
$('ficha-actividad').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const datos = datosDeFichaActividad();
  const r = actividadEnFicha
    ? editarActividad(estado, actividadEnFicha, datos, ctx)
    : agregarActividades(estado, datos, [...fichaAct.lugares], ctx);
  if (!r.ok) { $('actividad-error').textContent = MENSAJES_ACTIVIDAD[r.error]; return; }
  cerrarFichaActividad();
  aplicarActividades(r.estado);
});
$('actividad-nombre').addEventListener('input', alCambiarNombre);
$('actividad-icono').addEventListener('click', () => {
  if (!fichaAct.icono.editable) return; // con una sugerencia el icono es el suyo (AC-8.5)
  const lista = Object.entries(ICONOS).map(([clave, etiqueta]) => [clave, GLIFO_ICONO[clave], etiqueta]);
  abrirSelectorIconos('Icono de la actividad', lista, fichaAct.icono.icono, (clave) => {
    fichaAct.icono = iconoDeFicha($('actividad-nombre').value, clave); // AC-8.7
    pintarFichaActividad();
  });
});
for (const campo of ['actividad-vence', 'actividad-recurrencia']) {
  $(campo).addEventListener('input', () => { $('actividad-error').textContent = ''; pintarFichaActividad(); });
}
$('actividad-cambiar').addEventListener('click', () => { fichaAct.desplegada = !fichaAct.desplegada; pintarFichaActividad(); }); // AC-9.5
$('actividad-cancelar').addEventListener('click', cerrarFichaActividad);
$('actividad-eliminar').addEventListener('click', () => {
  if (confirmarYEliminarActividad(actividadEnFicha)) cerrarFichaActividad();
});
```
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida (sintaxis válida)
- [ ] Run: `cd poc && grep -nE 'actividad-(miembro|espacio|tipo|frecuencia)|actualizarFichaActividad|FRECUENCIAS|agregarActividad[^e]' src/juego.js` — expect: sin salida (no quedan referencias a la ficha anterior)
- [ ] Run: `cd poc && npm test` — expect: PASS, 340 pruebas
- [ ] Commit: `feat(poc): replace the activity form with a simple one with suggestions, a responsible picker and several places` (cuerpo: `Plan section: Phase 6: Ficha de actividad simple` y `Feature: 007-menu-y-formularios-simples`)

---

## Phase 7: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs

- [ ] Run full test suite: `cd poc && npm test` — expect: 340 pruebas, 0 fallos
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida
- [ ] Verificar en el navegador de escritorio (`cd poc && npm start` → http://localhost:8080; limpiar `localStorage` para empezar con un hogar nuevo), siguiendo estos pasos (con la ventana ancha y luego con el viewport emulado de 375×812):
  1. **Barra (AC-1.1, AC-1.2, AC-1.9, AC-12.1):** en exploración se ven las cuatro pestañas abajo (Espacios, Familia, Actividades, Intercambios), sin botones "Editar", "Intercambios" ni "Historial", la cruceta por encima de la barra y "Juega: Personaje 1" arriba a la derecha.
  2. **Drawer y modo edición (AC-1.3 a AC-1.7, AC-3.1):** tocar "Espacios": el drawer ocupa el 45 % inferior, el mapa se aleja y los personajes quedan quietos, el hogar completo se ve por encima, la barra sigue visible con la pestaña marcada; tocar "Familia", "Actividades" e "Intercambios" cambia el drawer sin reencuadrar ni mover nada; tocar la pestaña activa o "Listo" vuelve a exploración con la cámara siguiendo al personaje.
  3. **Mapa por sección (AC-2.1 a AC-2.6):** con "Espacios", tocar un cuarto abre su ficha (aunque haya alguien encima); con "Familia", tocar a un personaje abre su ficha y tocar un cuarto no abre nada; con "Actividades", tocar una burbuja abre su hoja con Editar y Eliminar; con "Intercambios", tocar el mapa no hace nada.
  4. **Tecla Espacio (AC-14.1 a AC-14.3):** en Chrome de escritorio, en la ficha de un cuarto, del propietario, de un familiar, de una mascota y de una actividad, escribir "Lavar platos": cada espacio aparece. En exploración, las flechas mueven al personaje; con un campo de texto con foco, las flechas mueven el cursor del campo.
  5. **Familiar (AC-5.1 a AC-5.9, AC-4.1 a AC-4.6):** en "Familia", "+" de Familiares abre "Nuevo familiar" con el botón 🧑 a la izquierda del nombre y "Guardar" desactivado; escribir "Ana María" lo activa; tocar 🧑 abre el selector de siete aspectos; elegir 👧 y guardar: la fila muestra 👧 y el personaje se dibuja más pequeño y de color femenino; agregar otro con solo el nombre queda 🧑; crear 8 desactiva el "+".
  6. **Mascota (AC-6.1 a AC-6.7):** "+" de Mascotas abre "Nueva mascota" con 🐾; el selector ofrece seis especies; crear una de cada una y comprobar que los seis colores se distinguen en el mapa; con solo el nombre queda 🐾 "Otro"; crear 4 desactiva el "+".
  7. **Actividad simple (AC-8.1 a AC-8.14, AC-9.1 a AC-9.9):** en "Actividades" → "Pendientes" → "+ Actividad": se ve solo el icono 📌, el nombre, 6 sugerencias, los círculos de las personas (sin mascotas, con quien juega marcado) y "📅 Hoy · Una vez · Sin lugar" con "Cambiar". Escribir "ba": quedan Barrer, Limpiar el baño y Sacar la basura. Tocar "Barrer": nombre e icono 🧹, y tocar el icono no abre el selector. Borrar y escribir "Podar": 📌, y tocar el icono abre el selector de 9; elegir 🪴; seguir escribiendo mantiene 🪴; escribir "Barrer" completo cambia a 🧹 y lo fija; volver a "Barre" devuelve 📌. Con solo "Barrer" y "Guardar": una actividad puntual de hoy, sin lugar, de quien juega.
  8. **Varios lugares (AC-10.1 a AC-10.11):** "+ Actividad" "Barrer" → "Cambiar": se despliegan fecha (hoy), recurrencia y lugares; marcar "Dormitorio 1", "Dormitorio 2" y "Sala" y elegir "Cada 7 días": el resumen dice "📅 Hoy · Cada 7 días · 3 lugares"; guardar crea tres actividades "Barrer", una por lugar, con la misma persona; editar una cambia solo esa y sus chips son de selección única; llegar a 49 actividades y marcar 2 lugares muestra "Con estos lugares se superarían las 50 actividades pendientes." sin crear ninguna.
  9. **Hechas (AC-7.1 a AC-7.9, AC-12.3):** marcar "Hecho" en tres actividades en exploración; en "Actividades" → "Hechas" se ve el historial con filtro "Todos", se puede calificar como la 006; cambiar de jugador desde "Juega: …" con el drawer abierto mantiene la pestaña y las estrellas pasan a ser las de la nueva persona; reabrir "Hechas" devuelve el filtro a "Todos"; no hay botón "Hecho" en "Pendientes".
  10. **Intercambios (AC-13.1 a AC-13.5, AC-1.8):** proponer un intercambio desde el drawer; la pestaña de la persona destinataria dice "Intercambios (1)"; aceptar y rechazar siguen las reglas de la 005.
  11. **Mascotas sin actividades (AC-11.1, AC-11.4):** en ninguna ficha ni selector aparece una mascota como responsable.
  12. **Texto como texto (AC-4.6, AC-8.16, AC-12.6):** llamar a un familiar `<b>x</b>` y a una actividad `<i>y</i>`: se ven como texto en las filas, los círculos, las hojas y el indicador.
- [ ] Verificar la migración desde un hogar v6 en el navegador. En la consola, con un hogar que tenga una mascota y una actividad, ejecutar:
```js
const d = JSON.parse(localStorage.getItem('livin:datos:v1'));
const mascota = d.miembros.find((m) => m.tipo === 'mascota');
const persona = d.miembros.find((m) => m.tipo === 'persona' && m.cuentaId === null);
d.version = 6;
for (const m of d.miembros) {
  if (m.tipo === 'persona') { m.genero = m.cuentaId === null ? 'femenino' : null; m.parentesco = m.cuentaId === null ? 'pareja' : null; }
  else { m.genero = null; m.parentesco = null; }
  delete m.aspecto;
}
const base = d.actividades[0] ?? null;
if (base && mascota) d.actividades.push({ ...base, id: 'act-mascota', nombre: 'Paseo', miembroId: mascota.id, espacioId: null, hechaEn: null, eliminadoEn: null });
localStorage.setItem('livin:datos:v1', JSON.stringify(d));
location.reload();
```
  Esperado (AC-15.1 a AC-15.8): se abre sin aviso; el familiar queda 👩 ("adulta"); "Paseo" no aparece en ninguna lista ni burbuja; el historial no cambia; `JSON.parse(localStorage['livin:datos:v1']).version` sigue en `6` hasta el primer cambio y pasa a `7` tras él; los miembros ya no tienen `genero` ni `parentesco`.
- [ ] Verificar el rendimiento y el tope con carga: con 8 familiares, 4 mascotas, 50 actividades y 200 entradas de historial (la consola puede armar el documento como en la verificación de la 006, con `version: 7`), abrir cada drawer, cambiar de pestaña, abrir una ficha y un selector de iconos, y guardar una actividad en varios lugares: el indicador `regen` queda por debajo de 100 ms y el movimiento se mantiene a 60 cuadros por segundo en exploración.
- [ ] Verificación en el teléfono Android de referencia (la hace el usuario; servir `poc/` en la red local solo mientras dura la prueba y con `Cache-Control: no-cache`, y apagar el servidor después): repetir los pasos 1, 2, 5, 6, 7 y 8; comprobar que la barra y el drawer no tapan la cruceta ni el cartel, que los chips se ajustan a varias líneas y que la ficha de actividad cabe y se recorre; con 8 familiares, 4 mascotas, 50 actividades y 200 entradas, el movimiento se mantiene a 60 cuadros por segundo y abrir un drawer, cambiar de pestaña y guardar muestran el resultado en menos de 100 ms.
- [ ] Escribir `docs/specs/007-menu-y-formularios-simples/verification.md` con los resultados (pruebas automáticas, navegador de escritorio —incluido el paso 4 de la tecla Espacio—, teléfono) y los límites aceptados.
- [ ] Commit: `feat: complete 007 menu por secciones y formularios simples` (cuerpo: `Plan section: Phase 7: Integration Verification` y `Feature: 007-menu-y-formularios-simples`)

**Cobertura de FR por fase:** FR-1 → Fases 4 y 5; FR-2 → Fases 4 y 5; FR-3 → Fase 5; FR-4 → Fase 5; FR-5 → Fases 1 y 5; FR-6 → Fases 1 y 5; FR-7 → Fases 4 y 5; FR-8 → Fases 3 y 6; FR-9 → Fases 3 y 6; FR-10 → Fases 1 y 6; FR-11 → Fase 5; FR-12 → Fase 5; FR-13 → Fase 5; FR-14 → Fase 2; FR-15 → Fases 2 y 3.

**Cobertura de historias por fase:** Story 1 y 2 → Fases 4, 5 y 7; Story 3 → Fase 5; Story 4 → Fases 4 y 5; Story 5 → Fases 1 y 5; Story 6 → Fases 1 y 5; Story 7 → Fases 4 y 5; Story 8 → Fases 3 y 6; Story 9 → Fases 3 y 6; Story 10 → Fases 3 y 6; Story 11 → Fases 1, 3 y 6; Story 12 → Fase 5; Story 13 → Fase 5; Story 14 → Fases 5 y 7; Story 15 → Fase 2.

---

## Quickstart Validation

```bash
cd poc
npm test                      # 340 pruebas, 0 fallos
node --check src/juego.js     # sintaxis de la escena
npm start                     # http://localhost:8080 (teléfono: http://<IP-LAN>:8080)
```

En la app: tocar "Familia" en la barra → "+" de Familiares → escribir "Ana María" (con espacio), tocar el icono y elegir 👧 → Guardar → tocar "Actividades" → "+ Actividad" → escribir "ba" y tocar "Barrer" (icono 🧹 fijo) → "Cambiar" → marcar dos cuartos y "Cada 7 días" → Guardar: aparecen dos actividades "Barrer" → "Listo" → marcar "Hecho" en una → "Actividades" → "Hechas" para verla en el historial → recargar la página y comprobar que todo sigue.
