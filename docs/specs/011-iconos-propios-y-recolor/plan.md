# Implementation Plan: Iconos propios y recolor de la interfaz

**Spec:** docs/specs/011-iconos-propios-y-recolor/spec.md (v1.0.1, aprobada; el PATCH 1.0.1 solo aclara y no cambia este plan)
**Decisions:** docs/adr/011-arte-de-la-interfaz-html-desde-las-cuadriculas.md, docs/adr/008-arte-cuadriculas-con-paleta.md
**Created:** 2026-10-10

No hay `data-model.md` ni `contracts/`: la feature no guarda datos nuevos ni cambia el documento guardado (FR-6, AC-10.1).

## Context

Tras la 008 a la 010 el mapa es pixel art, pero la interfaz que lo rodea usa emoji del sistema y un marrón y crema ajenos a la paleta (`index.html` tiene ~110 reglas de CSS con colores propios). La 011 da 23 iconos propios (cuadrículas de 16×16 con la paleta), usa los personajes de la 009 como avatar, y recolorea toda la interfaz con variables derivadas de `paleta.js` en aspecto de marco de videojuego (ADR-011, opción A: canvas a imagen al arrancar; variables CSS desde la paleta). Las burbujas y las insignias del mapa pasan a la hoja de texturas de Phaser.

Lo que dice el código hoy (verificado):
- Emoji y símbolos: `SECCIONES[].icono` (`secciones.js`), `📅` en `resumenDeFicha` (`formularios.js`), `GLIFO_ICONO`, `iconoDeMiembro`, `★ ☆` y los usos de `DATOS_ASPECTO[..].icono`/`DATOS_ESPECIE[..].icono` en `juego.js`, `INSIGNIAS` (`aspecto.js`) y `▲ ◀ ▶ ▼` en `index.html`.
- `test/secciones.test.js` (AC-1.1) y `test/formularios.test.js` (AC-9.4, AC-9.8) fijan el emoji y el prefijo 📅; `test/contrato-actividades.test.js` fija `INSIGNIAS`; `test/contrato-menu.test.js` fija los emoji de `catalogo.js`. Solo se ajustan las dos primeras (spec, AC-10.2).
- `test/tipografia.test.js` fija en `index.html` el `@font-face` de Silkscreen, `#barra .pestana small` y `#drawer-titulo` con Silkscreen: esos selectores se conservan.
- `prepararArte(escena)` (`juego.js`) pinta `{ ...TEXTURAS, ...SUCIEDAD, ...CUADROS_DE_PERSONAJES }` en la hoja `arte` (cuadrícula de 64 columnas).

## Global Constraints

- **23 iconos (FR-1):** `pestana:espacios`, `pestana:familia`, `pestana:actividades`, `pestana:intercambios`; `actividad:platos`, `actividad:barrer`, `actividad:ropa`, `actividad:basura`, `actividad:limpiar`, `actividad:compras`, `actividad:plantas`, `actividad:mascota`, `actividad:otra`; `estado:limpio`, `estado:desordenado`, `estado:desastre`; `estrella:llena`, `estrella:vacia`; `fecha`; `flecha:arriba`, `flecha:izquierda`, `flecha:derecha`, `flecha:abajo`. Cuadrículas de 16×16 con claves de `PALETA` o `.`; a color y con contorno oscuro (`k`); nada de emoji, símbolos ni arte importado. Una clave de `ICONOS` desconocida cae en `actividad:otra`.
- **Tamaños (FR-2):** sin suavizado y a múltiplos enteros de 16 px: ×2 (32 px) en pestañas, filas de listas (actividades, historial, Familia), botón de icono de las fichas, estrellas, flechas y opciones del selector de aspecto y especie; ×3 (48 px) en el selector de iconos de actividad; ×1 (16 px) en chips y en el icono de fecha; 16 px en pantalla sin importar el zoom en burbujas e insignias del mapa.
- **Avatar (FR-3):** cuadro de frente en reposo (vista `frente`, cuadro 0) del personaje de `personajeDe`, pintado desde las cuadrículas de `personajes.js` por el mismo camino que los demás iconos; solo en la lista de Familia, el selector de aspecto y especie y el botón de icono de la ficha del habitante. Respaldo: personaje `neutro`.
- **Mapa (FR-4):** la burbuja muestra el icono de la actividad más atrasada y un «+» como texto si hay más; la insignia es el icono de su estado, pegado a la derecha de la etiqueta; ambos viven en la hoja de texturas de Phaser (64 columnas, sin pasar de 4.096 px por lado) con las mismas profundidades y ubicación de hoy.
- **Símbolos de texto (FR-5):** `SECCIONES[].icono` es la clave `pestana:<clave>`; `resumenDeFicha` devuelve `<fecha> · <recurrencia> · <lugares>` sin prefijo y la presentación dibuja `fecha` antes; estrellas con `estrella:llena`/`estrella:vacia`; cruceta con `flecha:*`. `INSIGNIAS` y los emoji de `catalogo.js` no cambian y quedan sin uso en la presentación.
- **Colores (FR-7):** una variable `--c-<clave>` por clave de la paleta y variables de rol derivadas de ella (tabla `ROLES` de `src/arte/colores.js`, la de FR-7); `index.html` solo colorea con `var(--…)`; la transparencia solo como la variable `--velo` (color de contorno con alfa 0,55); la cruceta es opaca. Texto del mapa: etiquetas `z` y `k`, cartel `k` y `j`, resalte `r`. Cada par texto/fondo cumple un contraste de 4,5 a 1. No cambian los colores de miembros (`catalogo.js`), mundo ni personajes.
- **Marco de videojuego (FR-8):** esquinas cuadradas; borde oscuro de 3 px en paneles y de 2 px en botones, chips y campos; sombra dura de 3 px en paneles y de 2 px en botones, sin desenfoque; los botones se hunden (sin sombra, desplazados 2 px) al pulsarse; Silkscreen en títulos de drawers, rótulos de pestañas y texto de botones; campos, listas, ficha de actividad e historial siguen con la fuente del sistema; disposición y áreas táctiles no se encogen; el tamaño de letra del mapa sigue en 12 px.
- **Preparación y respaldo (FR-6):** cada icono y avatar se prepara una sola vez al arrancar y se reutiliza; si falla uno se muestra el respaldo (`actividad:otra`, avatar `neutro`) o nada, sin errores; la interfaz no se ve sin estilo mientras se preparan colores e imágenes; no se bloquea el arranque más allá de la espera de la fuente (1 s); no se guarda nada nuevo.
- **Capas y reglas del proyecto:** `src/arte/iconos.js` y `src/arte/colores.js` son datos y funciones puras (sin Phaser ni DOM); ni el dominio ni el generador importan de `src/arte/`; el módulo con DOM vive fuera de `src/arte/` (`src/imagenes.js`); sin dependencias nuevas.
- **Formato (FR-6):** documento `version: 7`; no cambian `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js`, `movimiento.js`, `rutas.js`, `rutinas.js`, `actividades.js`, `intercambios.js`, `historial.js`, `catalogo.js`, `aspecto.js`, `src/arte/paleta.js`, `texturas.js`, `mobiliario.js`, `suciedad.js`, `casillas.js`, `personajes.js` ni `caminar.js`.
- **Rendimiento (NFR):** 60 fps o más con la carga completa; `regen` sin empeorar los 24,9 ms de la 010 y por debajo de 100 ms; preparar la hoja de texturas y las imágenes de la interfaz juntas en menos de 300 ms; listas de 50 y 200 filas sin tirones.
- **Pruebas ajustadas (AC-10.2):** solo `test/secciones.test.js` (AC-1.1) y `test/formularios.test.js` (AC-9.4, AC-9.8). El resto de las 431 pruebas no cambia.

**Pre-implementation gates:**
- *Simplicity:* 3 componentes nuevos: arte puro (`iconos.js`, `colores.js`), módulo de presentación con DOM (`imagenes.js`) y los cambios de `index.html`/`juego.js`. Sin dependencias nuevas. ✓
- *Anti-Abstraction:* `imagen()` solo crea un `<img>` desde una URL de datos y `prepararArte` usa las texturas de canvas de Phaser directamente; no hay clases ni vistas-modelo intermedias. ✓
- *Integration-First:* los contratos de `iconos.js` y `colores.js` y la prueba estática de `index.html` y de los fuentes se escriben en la Fase 0, antes de cualquier implementación. ✓

---

## Goal

La interfaz y el mapa sin ningún emoji ni color ajeno a la paleta: 23 iconos propios y los personajes de la 009 como avatar, en un marco de videojuego, todo preparado una sola vez al arrancar y verificado en escritorio y en el teléfono.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1, FR-3, FR-5, FR-7 (contratos) | **Satisfies:** AC-1.1 a AC-1.8, AC-2.1, AC-3.2, AC-5.1 a AC-5.3, AC-6.3, AC-7.1 a AC-7.5, AC-7.7, AC-7.9, AC-10.2
**Files:** `poc/test/iconos.test.js` (nuevo), `poc/test/colores.test.js` (nuevo), `poc/test/interfaz-estatica.test.js` (nuevo), `poc/test/secciones.test.js` y `poc/test/formularios.test.js` (ajustes)
**Interfaces:** Consumes: nada de las fases siguientes; solo lo existente (`PALETA`, `personajeDe`, `CUADROS_DE_PERSONAJES`, `ICONOS`, `hogarDePrueba1`, `hogarDePrueba2`). Produces: fija los contratos que implementan las Fases 1 a 4: de `src/arte/iconos.js`, `ICONOS_DE_INTERFAZ`, `CLAVES_DE_ICONOS`, `claveDeIconoDeActividad(icono)`, `claveDeIconoDeEstado(limpieza)`, `claveDeAvatarDePersonaje(personaje)`, `claveDeAvatar(estado, miembro)`, `AVATARES`; de `src/arte/colores.js`, `ROLES`, `VELO`, `variablesDeColor(paleta?)`, `contraste(a, b)`, `PARES_DE_TEXTO`, `COLORES_DEL_MAPA`, `numeroDeColor(hex)`.

Antes de escribir una línea de implementación se fijan los contratos con pruebas que fallan: el arte de los iconos y de los avatares, las variables y los contrastes de color, y una prueba estática de `index.html` y de los fuentes (sin colores propios ni emoji).

- [ ] Crear `poc/test/iconos.test.js`:

```js
// test/iconos.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICONOS, ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { PALETA, TAM } from '../src/arte/paleta.js';
import { TEXTURAS } from '../src/arte/casillas.js';
import { SUCIEDAD } from '../src/arte/suciedad.js';
import { CUADROS_DE_PERSONAJES, personajeDe } from '../src/arte/personajes.js';
import {
  ICONOS_DE_INTERFAZ, CLAVES_DE_ICONOS, AVATARES, claveDeIconoDeActividad, claveDeIconoDeEstado, claveDeAvatarDePersonaje, claveDeAvatar,
} from '../src/arte/iconos.js';
import { hogarDePrueba1, hogarDePrueba2 } from './hogares-de-prueba.js';

const CLAVES_ESPERADAS = [
  'pestana:espacios', 'pestana:familia', 'pestana:actividades', 'pestana:intercambios',
  'actividad:platos', 'actividad:barrer', 'actividad:ropa', 'actividad:basura', 'actividad:limpiar', 'actividad:compras', 'actividad:plantas',
  'actividad:mascota', 'actividad:otra',
  'estado:limpio', 'estado:desordenado', 'estado:desastre',
  'estrella:llena', 'estrella:vacia', 'fecha',
  'flecha:arriba', 'flecha:izquierda', 'flecha:derecha', 'flecha:abajo',
];

test('AC-1.1: el catálogo tiene exactamente los 23 iconos de FR-1, sin repetidos', () => {
  assert.deepEqual([...CLAVES_DE_ICONOS].sort(), [...CLAVES_ESPERADAS].sort());
  assert.equal(CLAVES_DE_ICONOS.length, 23);
  assert.equal(new Set(CLAVES_DE_ICONOS).size, 23);
});

test('AC-1.2 y AC-1.3: cada icono mide 16×16 y solo usa claves de la paleta o transparente', () => {
  for (const [clave, g] of Object.entries(ICONOS_DE_INTERFAZ)) {
    assert.equal(g.length, TAM, `${clave}: alto`);
    for (const fila of g) {
      assert.equal(fila.length, TAM, `${clave}: ancho`);
      for (const c of fila) assert.ok(c === '.' || c in PALETA, `${clave}: la clave ${c} no está en la paleta`);
    }
  }
});

test('AC-1.4: cada icono tiene píxeles de color y el contorno oscuro de la paleta', () => {
  for (const [clave, g] of Object.entries(ICONOS_DE_INTERFAZ)) {
    const texto = g.join('');
    assert.ok([...texto].some((c) => c !== '.'), `${clave}: vacío`);
    assert.ok(texto.includes('k'), `${clave}: sin contorno oscuro`);
  }
});

test('AC-1.5: los 9 iconos de actividades son distintos entre sí', () => {
  const dibujos = CLAVES_DE_ICONOS.filter((c) => c.startsWith('actividad:')).map((c) => ICONOS_DE_INTERFAZ[c].join('\n'));
  assert.equal(dibujos.length, 9);
  assert.equal(new Set(dibujos).size, 9);
});

test('AC-1.6 y AC-3.2: cada clave de ICONOS tiene su icono y una clave desconocida cae en el genérico', () => {
  for (const clave of Object.keys(ICONOS)) {
    assert.ok(Object.hasOwn(ICONOS_DE_INTERFAZ, `actividad:${clave}`), clave);
    assert.equal(claveDeIconoDeActividad(clave), `actividad:${clave}`);
  }
  assert.equal(claveDeIconoDeActividad('inexistente'), 'actividad:otra');
  assert.equal(claveDeIconoDeActividad(undefined), 'actividad:otra');
  assert.equal(claveDeIconoDeActividad(null), 'actividad:otra');
});

test('AC-1.7: los tres estados de limpieza tienen icono y son distintos entre sí', () => {
  const dibujos = ['limpio', 'desordenado', 'desastre'].map((e) => {
    assert.ok(Object.hasOwn(ICONOS_DE_INTERFAZ, claveDeIconoDeEstado(e)), e);
    return ICONOS_DE_INTERFAZ[claveDeIconoDeEstado(e)].join('\n');
  });
  assert.equal(new Set(dibujos).size, 3);
  assert.equal(claveDeIconoDeEstado('raro'), 'estado:limpio');
});

test('AC-1.8: pedir claves y avatares no modifica el catálogo y devuelve lo mismo cada vez', () => {
  const antes = JSON.stringify(ICONOS_DE_INTERFAZ);
  const estado = hogarDePrueba1();
  const m = estado.miembros[0];
  const a = [claveDeIconoDeActividad('platos'), claveDeIconoDeEstado('desastre'), claveDeAvatar(estado, m)];
  const b = [claveDeIconoDeActividad('platos'), claveDeIconoDeEstado('desastre'), claveDeAvatar(estado, m)];
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(ICONOS_DE_INTERFAZ), antes);
});

test('los iconos de la interfaz no repiten claves de los dibujos del mapa (comparten la hoja de Phaser)', () => {
  const otras = new Set([...Object.keys(TEXTURAS), ...Object.keys(SUCIEDAD), ...Object.keys(CUADROS_DE_PERSONAJES)]);
  for (const clave of CLAVES_DE_ICONOS) assert.ok(!otras.has(clave), `${clave} ya existe en la hoja`);
});

test('AC-5.1: el avatar de un miembro es el cuadro de frente en reposo de su personaje, el mismo que el del mapa', () => {
  for (const estado of [hogarDePrueba1(), hogarDePrueba2()]) {
    for (const m of estado.miembros) {
      const clave = claveDeAvatar(estado, m);
      assert.equal(clave, `personaje:${personajeDe(estado, m)}:frente:0`);
      assert.ok(Object.hasOwn(AVATARES, clave), clave);
      assert.equal(AVATARES[clave], CUADROS_DE_PERSONAJES[clave]);
    }
  }
});

test('AC-5.2: los 14 personajes tienen avatar', () => {
  const personajes = ['protagonista', ...Object.keys(ASPECTOS), ...Object.keys(ESPECIES)];
  assert.equal(personajes.length, 14);
  for (const p of personajes) {
    const clave = claveDeAvatarDePersonaje(p);
    assert.equal(clave, `personaje:${p}:frente:0`);
    assert.ok(Object.hasOwn(AVATARES, clave), clave);
  }
  assert.equal(Object.keys(AVATARES).length, 14);
});

test('AC-5.3: un aspecto o una especie fuera de las listas cae en el avatar de respaldo, sin error', () => {
  const estado = hogarDePrueba2();
  assert.equal(claveDeAvatar(estado, { tipo: 'persona', aspecto: 'zzz', cuentaId: null }), 'personaje:neutro:frente:0');
  assert.equal(claveDeAvatar(estado, { tipo: 'mascota', especie: 'dragon', cuentaId: null }), 'personaje:otro:frente:0');
  assert.equal(claveDeAvatarDePersonaje('no-existe'), 'personaje:neutro:frente:0');
});
```

- [ ] Crear `poc/test/colores.test.js`:

```js
// test/colores.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETA } from '../src/arte/paleta.js';
import {
  ROLES, VELO, variablesDeColor, contraste, PARES_DE_TEXTO, COLORES_DEL_MAPA, numeroDeColor,
} from '../src/arte/colores.js';

test('AC-7.1: hay una variable por clave de la paleta, con exactamente su color', () => {
  const v = variablesDeColor();
  for (const [clave, color] of Object.entries(PALETA)) assert.equal(v[`--c-${clave}`], color);
  assert.equal(Object.keys(v).filter((n) => n.startsWith('--c-')).length, 32);
});

test('AC-7.1: cada rol es una variable con el color de su clave, y el velo es el contorno con alfa', () => {
  const v = variablesDeColor();
  for (const [rol, clave] of Object.entries(ROLES)) {
    assert.ok(clave in PALETA, `${rol}: ${clave} no está en la paleta`);
    assert.equal(v[`--${rol}`], PALETA[clave]);
  }
  assert.equal(VELO.clave, 'k');
  assert.equal(VELO.alfa, 0.55);
  assert.equal(v['--velo'], 'rgba(46, 34, 51, 0.55)');
});

test('AC-7.1: la función es pura: mismo resultado en cada llamada y acepta otra paleta', () => {
  assert.deepEqual(variablesDeColor(), variablesDeColor());
  const otra = { ...PALETA, k: '#000000' };
  assert.equal(variablesDeColor(otra)['--c-k'], '#000000');
  assert.equal(variablesDeColor(otra)['--fondo'], '#000000');
  assert.equal(variablesDeColor(otra)['--velo'], 'rgba(0, 0, 0, 0.55)');
  assert.equal(PALETA.k, '#2e2233');
});

test('contraste de WCAG: negro sobre blanco 21 a 1, y simétrico', () => {
  assert.equal(contraste('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(contraste('#ffffff', '#000000'), contraste('#000000', '#ffffff'));
});

test('AC-7.7: cada par de texto y fondo de la interfaz cumple 4,5 a 1', () => {
  const paresHtml = PARES_DE_TEXTO.filter(([f]) => !f.startsWith('etiqueta') && !f.startsWith('cartel') && f !== 'resalte');
  assert.ok(paresHtml.length >= 8);
  for (const [fondo, texto] of paresHtml) {
    const c = contraste(PALETA[ROLES[fondo]], PALETA[ROLES[texto]]);
    assert.ok(c >= 4.5, `${texto} sobre ${fondo}: ${c.toFixed(2)}`);
  }
});

test('AC-7.9: el texto del mapa (etiqueta, cartel y resalte) cumple 4,5 a 1', () => {
  const paresMapa = PARES_DE_TEXTO.filter(([f]) => f.startsWith('etiqueta') || f.startsWith('cartel') || f === 'resalte');
  assert.equal(paresMapa.length, 3);
  for (const [fondo, texto] of paresMapa) {
    const c = contraste(PALETA[ROLES[fondo]], PALETA[ROLES[texto]]);
    assert.ok(c >= 4.5, `${texto} sobre ${fondo}: ${c.toFixed(2)}`);
  }
});

test('AC-7.8: los colores del mapa son los de la paleta y no los marrones de antes', () => {
  assert.deepEqual(COLORES_DEL_MAPA, {
    fondo: '#2e2233', etiquetaFondo: '#eadfcf', etiquetaTx: '#2e2233', cartelFondo: '#2e2233', cartelTx: '#f4f1ea', resalte: '#f2c14e',
    burbujaFondo: '#f4f1ea', burbujaBorde: '#2e2233',
  });
  for (const color of Object.values(COLORES_DEL_MAPA)) assert.ok(Object.values(PALETA).includes(color), color);
  assert.equal(numeroDeColor('#2e2233'), 0x2e2233);
});
```

- [ ] Crear `poc/test/interfaz-estatica.test.js` (comprobaciones sobre el texto de `index.html` y de los fuentes, sin DOM):

```js
// test/interfaz-estatica.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { variablesDeColor } from '../src/arte/colores.js';

const raiz = new URL('../', import.meta.url);
const leer = (ruta) => readFileSync(new URL(ruta, raiz), 'utf8');
const SIMBOLO = /\p{Extended_Pictographic}|[★☆▲▼◀▶✓✔]/u;
const NOMBRES_DE_COLOR = /(?:^|[\s:,(])(?:white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|brown|silver|gold|navy|teal|maroon|cyan|magenta)(?=[\s;,)]|$)/i;

// Los bloques de declaraciones de la hoja de estilos (lo que va entre llaves) y los atributos `style` del cuerpo.
function declaraciones(html) {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const bloques = [...css.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
  const enLinea = [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]);
  return [...bloques, ...enLinea];
}

test('AC-7.2: index.html no contiene colores escritos a mano (solo variables de la paleta)', () => {
  const html = leer('index.html');
  for (const d of declaraciones(html)) {
    assert.doesNotMatch(d, /#[0-9a-fA-F]{3,8}\b/, `color hexadecimal en: ${d.trim().slice(0, 80)}`);
    assert.doesNotMatch(d, /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i, `función de color en: ${d.trim().slice(0, 80)}`);
    assert.doesNotMatch(d, NOMBRES_DE_COLOR, `nombre de color en: ${d.trim().slice(0, 80)}`);
  }
});

test('AC-7.2: cada variable que usa index.html la define la paleta o la propia hoja de estilos', () => {
  const html = leer('index.html');
  const definidas = new Set([...Object.keys(variablesDeColor()), ...[...html.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1])]);
  const usadas = [...html.matchAll(/var\((--[a-z0-9-]+)/gi)].map((m) => m[1]);
  assert.ok(usadas.length > 40, 'la interfaz usa las variables');
  for (const nombre of usadas) assert.ok(definidas.has(nombre), `${nombre} no está definida`);
});

test('AC-7.3: index.html no contiene emoji ni símbolos-icono', () => {
  assert.doesNotMatch(leer('index.html'), SIMBOLO);
});

test('AC-7.4: juego.js, secciones.js, formularios.js e imagenes.js no contienen emoji ni símbolos-icono', () => {
  for (const ruta of ['src/juego.js', 'src/secciones.js', 'src/formularios.js', 'src/imagenes.js']) {
    const m = leer(ruta).match(SIMBOLO);
    assert.equal(m, null, `${ruta}: ${m?.[0]}`);
  }
});

test('AC-7.5: juego.js ya no usa INSIGNIAS ni los emoji de DATOS_ASPECTO y DATOS_ESPECIE', () => {
  const js = leer('src/juego.js');
  assert.doesNotMatch(js, /INSIGNIAS/);
  assert.doesNotMatch(js, /DATOS_(?:ASPECTO|ESPECIE)\[[^\]]*\]\.icono/);
  assert.doesNotMatch(js, /GLIFO_ICONO|iconoDeMiembro|glifoDeIcono/);
});

test('AC-9.5: el cuerpo arranca oculto mientras se preparan los colores y las imágenes', () => {
  const html = leer('index.html');
  assert.match(html, /<body class="preparando">/);
  assert.match(html, /body\.preparando\s*>\s*\*\s*\{[^}]*visibility:\s*hidden/);
});
```

- [ ] Ajustar `poc/test/secciones.test.js` (AC-1.1 de la 007: el icono de cada pestaña es ahora su clave de icono). Reemplazar el cuerpo del primer test:

```js
test('AC-1.1: la barra tiene cuatro secciones, en este orden, cada una con su etiqueta y la clave de su icono', () => {
  assert.deepEqual(SECCIONES.map((s) => [s.clave, s.etiqueta, s.icono]), [
    ['espacios', 'Espacios', 'pestana:espacios'], ['familia', 'Familia', 'pestana:familia'],
    ['actividades', 'Actividades', 'pestana:actividades'], ['intercambios', 'Intercambios', 'pestana:intercambios'],
  ]);
});
```

- [ ] Ajustar `poc/test/formularios.test.js` (AC-9.4, AC-9.8: la línea-resumen ya no lleva el prefijo 📅). Reemplazar el cuerpo del test:

```js
test('AC-9.4, AC-9.8: la línea-resumen dice la fecha, la recurrencia y los lugares, sin símbolo al comienzo', () => {
  const hoy = '2026-10-06';
  assert.equal(resumenDeFicha({ vence: hoy, hoy, recurrencia: '0', lugares: [] }), 'Hoy · Una vez · Sin lugar');
  assert.equal(resumenDeFicha({ vence: '2026-10-09', hoy, recurrencia: '7', lugares: ['Sala'] }), '2026-10-09 · Cada 7 días · Sala');
  assert.equal(resumenDeFicha({ vence: hoy, hoy, recurrencia: '1', lugares: ['Sala', 'Cocina', 'Dormitorio 1'] }), 'Hoy · Cada día · 3 lugares');
  assert.equal(resumenDeFicha({ vence: '', hoy, recurrencia: '0', lugares: [] }), 'Sin fecha · Una vez · Sin lugar');
});
```

- [ ] Run: `cd poc && node --test test/iconos.test.js test/colores.test.js test/interfaz-estatica.test.js test/secciones.test.js test/formularios.test.js` — expect: FAIL (los módulos `src/arte/iconos.js` y `src/arte/colores.js` no existen; `secciones` y `formularios` y `index.html` aún tienen el emoji y los colores).
- [ ] Commit: `test(iconos): fijar los contratos de iconos, colores y la prueba estática de la interfaz` (cuerpo: `Plan section: Phase 0: Contracts and Tests First` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 1: Iconos y avatares (arte puro)

**Implements:** FR-1, FR-3 | **Satisfies:** AC-1.1 a AC-1.8, AC-3.2, AC-5.1, AC-5.2, AC-5.3 (y AC-1.9 a mano en la Fase 7)
**Files:** `poc/src/arte/iconos.js` (nuevo), `poc/test/iconos.test.js`
**Interfaces:** Consumes: `PALETA`, `TAM` (`src/arte/paleta.js`); `lienzo`, `rect`, `caja`, `cuadricula` (`src/arte/lienzo.js`); `PERSONAJES`, `CUADROS_DE_PERSONAJES`, `claveDeCuadro`, `personajeDe` (`src/arte/personajes.js`). Produces: `ICONOS_DE_INTERFAZ: { [clave]: string[16] }`, `CLAVES_DE_ICONOS: string[23]`, `AVATARES: { [clave]: string[16] }` (14 cuadros de frente), `claveDeIconoDeActividad(icono): string`, `claveDeIconoDeEstado(limpieza): string`, `claveDeAvatarDePersonaje(personaje): string`, `claveDeAvatar(estado, miembro): string`.

Los 23 iconos se dibujan con la paleta de la 008 (bocetos del brainstorm, más fecha y las cuatro flechas) y se exponen con las funciones que eligen la clave por actividad, por estado y por miembro. `iconos.js` importa `personajes.js` (arte con arte); ni el dominio ni el generador lo importan.

- [ ] Run: `cd poc && node --test test/iconos.test.js` — expect: FAIL (`iconos.js` no existe).
- [ ] Crear `poc/src/arte/iconos.js`:

```js
// src/arte/iconos.js
import { TAM } from './paleta.js';
import { lienzo, rect, caja, cuadricula } from './lienzo.js';
import { CUADROS_DE_PERSONAJES, PERSONAJES, claveDeCuadro, personajeDe } from './personajes.js';

// Iconos propios de la interfaz (FR-1 de la 011, ADR-011): 23 cuadrículas de 16×16 con claves de la paleta, a color y con contorno oscuro
// ('k'), como los muebles del mundo. Son datos puros: los pinta la hoja de texturas del mapa y el módulo de imágenes de la interfaz.
const dibujar = (f) => { const l = lienzo(); f(l); return cuadricula(l); };
const puntos = (l, lista, c) => { for (const [x, y] of lista) l[y][x] = c; };

// Giro de 90° en sentido horario de un lienzo: de la flecha hacia arriba salen las otras tres.
const girar = (l) => l.map((_, y) => l.map((__, x) => l[TAM - 1 - x][y]));

function flechaArriba() {
  const l = lienzo();
  for (let f = 0; f < 6; f++) { // la cabeza: seis filas que se ensanchan
    const y = 1 + f;
    l[y][7 - f] = 'k';
    l[y][8 + f] = 'k';
    rect(l, 8 - f, y, 7 + f, y, 'g');
  }
  rect(l, 2, 7, 13, 7, 'k'); // la base de la cabeza
  caja(l, 5, 7, 10, 14, 'g'); // el tallo
  return l;
}
const ARRIBA = flechaArriba();
const DERECHA = girar(ARRIBA);
const ABAJO = girar(DERECHA);
const IZQUIERDA = girar(ABAJO);

const ESTRELLA = [
  [7, 1], [8, 1], [7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3],
  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
  [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
  [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7],
  [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8],
  [3, 9], [4, 9], [5, 9], [6, 9], [9, 9], [10, 9], [11, 9], [12, 9],
  [3, 10], [4, 10], [5, 10], [10, 10], [11, 10], [12, 10], [2, 11], [3, 11], [4, 11], [11, 11], [12, 11], [13, 11],
];
function estrella(relleno) {
  const l = lienzo();
  const dentro = new Set(ESTRELLA.map(([x, y]) => `${x},${y}`));
  puntos(l, ESTRELLA, relleno);
  for (const [x, y] of ESTRELLA) { // el contorno: los vecinos que no son de la estrella
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < TAM && ny < TAM && !dentro.has(`${nx},${ny}`)) l[ny][nx] = 'k';
    }
  }
  return cuadricula(l);
}

export const ICONOS_DE_INTERFAZ = {
  // Pestañas de la barra inferior
  'pestana:espacios': dibujar((l) => {
    rect(l, 7, 1, 8, 1, 'k'); rect(l, 5, 2, 10, 2, 'k'); rect(l, 3, 3, 12, 3, 'k'); rect(l, 1, 4, 14, 4, 'k');
    rect(l, 6, 2, 9, 2, 'q'); rect(l, 4, 3, 11, 3, 'q'); rect(l, 2, 4, 13, 4, 'q');
    rect(l, 1, 5, 14, 5, 'k'); rect(l, 2, 5, 13, 5, 'q');
    caja(l, 2, 6, 13, 14, 'z');
    caja(l, 6, 9, 9, 14, 'd'); puntos(l, [[8, 12]], 'r');
    caja(l, 3, 8, 5, 10, 'h'); caja(l, 10, 8, 12, 10, 'h');
  }),
  'pestana:familia': dibujar((l) => {
    caja(l, 2, 2, 6, 6, 'e'); rect(l, 2, 2, 6, 3, 'd'); caja(l, 1, 7, 7, 14, 'g'); // el adulto
    caja(l, 9, 6, 13, 10, 'e'); rect(l, 9, 6, 13, 7, 'm'); caja(l, 8, 11, 14, 14, 'n'); // el niño
  }),
  'pestana:actividades': dibujar((l) => {
    caja(l, 2, 2, 13, 15, 'j'); caja(l, 5, 0, 10, 3, 's');
    for (const y of [6, 9, 12]) { rect(l, 4, y, 5, y, 'o'); rect(l, 7, y, 11, y, 'l'); }
    puntos(l, [[3, 7], [4, 7]], 'k');
  }),
  'pestana:intercambios': dibujar((l) => {
    rect(l, 2, 4, 11, 5, 'k'); rect(l, 3, 4, 11, 4, 'g'); rect(l, 3, 5, 10, 5, 'i');
    puntos(l, [[10, 2], [11, 3], [12, 4], [11, 5], [10, 6], [11, 2], [12, 3], [13, 4], [12, 5], [11, 6]], 'k'); puntos(l, [[11, 3], [12, 4], [11, 5]], 'g');
    rect(l, 4, 10, 13, 11, 'k'); rect(l, 4, 10, 12, 10, 'o'); rect(l, 5, 11, 12, 11, 'p');
    puntos(l, [[5, 8], [4, 9], [3, 10], [4, 11], [5, 12], [4, 8], [3, 9], [2, 10], [3, 11], [4, 12]], 'k'); puntos(l, [[4, 9], [3, 10], [4, 11]], 'p');
  }),
  // Actividades (las 9 claves de ICONOS de catalogo.js)
  'actividad:platos': dibujar((l) => {
    caja(l, 1, 8, 14, 13, 'j'); rect(l, 3, 10, 12, 11, 'l');
    caja(l, 2, 4, 13, 9, 'j'); rect(l, 3, 5, 12, 5, 'h');
    caja(l, 3, 1, 12, 5, 'j'); rect(l, 4, 2, 11, 2, 'h');
    rect(l, 4, 14, 11, 14, 'k');
  }),
  'actividad:barrer': dibujar((l) => {
    for (let i = 0; i < 9; i++) { l[1 + i][10 - i] = 'k'; l[1 + i][11 - i] = 'd'; }
    caja(l, 1, 10, 8, 14, 'r'); rect(l, 2, 12, 7, 12, 'd'); puntos(l, [[3, 14], [5, 14], [7, 14]], 'k');
    rect(l, 2, 11, 7, 11, 'A');
  }),
  'actividad:ropa': dibujar((l) => {
    caja(l, 1, 8, 14, 14, 'd'); rect(l, 2, 10, 13, 10, 'e'); rect(l, 2, 12, 13, 12, 'e');
    caja(l, 3, 2, 12, 9, 'h'); rect(l, 6, 2, 9, 3, 'k'); rect(l, 4, 5, 11, 5, 'g'); puntos(l, [[7, 6], [8, 6]], 'j');
  }),
  'actividad:basura': dibujar((l) => {
    rect(l, 3, 2, 12, 3, 'k'); rect(l, 6, 1, 9, 1, 'k'); rect(l, 4, 2, 11, 2, 's');
    caja(l, 3, 4, 12, 15, 'v');
    for (const x of [6, 8, 10]) rect(l, x, 6, x, 13, 's');
  }),
  'actividad:limpiar': dibujar((l) => {
    caja(l, 2, 7, 13, 14, 'r'); rect(l, 3, 8, 12, 9, 'j'); rect(l, 3, 10, 12, 13, 'r');
    puntos(l, [[4, 11], [7, 12], [10, 11], [9, 13]], 'k');
    puntos(l, [[4, 3], [11, 2], [8, 4]], 'h');
    puntos(l, [[3, 4], [5, 4], [4, 2], [10, 2], [12, 2], [11, 1], [11, 3], [8, 3], [8, 5], [7, 4], [9, 4]], 'j');
  }),
  'actividad:compras': dibujar((l) => {
    rect(l, 0, 1, 3, 1, 'k'); puntos(l, [[3, 2], [4, 3]], 'k');
    caja(l, 4, 3, 14, 9, 'g'); rect(l, 5, 4, 13, 4, 'h'); rect(l, 6, 6, 12, 6, 'h');
    rect(l, 5, 10, 13, 10, 'k');
    caja(l, 5, 12, 7, 14, 's'); caja(l, 11, 12, 13, 14, 's');
  }),
  'actividad:plantas': dibujar((l) => {
    caja(l, 4, 10, 11, 15, 'd'); rect(l, 5, 11, 10, 11, 'e'); rect(l, 3, 9, 12, 9, 'k'); rect(l, 4, 9, 11, 9, 'd');
    puntos(l, [[8, 8], [8, 7], [8, 6]], 'o');
    caja(l, 3, 2, 7, 6, 'p'); caja(l, 9, 3, 13, 7, 'o'); rect(l, 4, 3, 5, 3, 'p'); rect(l, 10, 4, 11, 4, 'p');
  }),
  'actividad:mascota': dibujar((l) => {
    caja(l, 5, 8, 10, 13, 'd'); rect(l, 6, 9, 9, 11, 'e');
    caja(l, 1, 5, 3, 8, 'd'); caja(l, 4, 2, 6, 5, 'd'); caja(l, 9, 2, 11, 5, 'd'); caja(l, 12, 5, 14, 8, 'd');
    puntos(l, [[2, 6], [5, 3], [10, 3], [13, 6]], 'e');
  }),
  'actividad:otra': dibujar((l) => {
    caja(l, 4, 1, 11, 7, 'q'); rect(l, 5, 2, 6, 3, 'n');
    rect(l, 7, 8, 8, 14, 'k'); puntos(l, [[7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13]], 's');
  }),
  // Estados de limpieza (insignia junto al nombre de cada espacio)
  'estado:limpio': dibujar((l) => {
    caja(l, 2, 2, 13, 13, 'o');
    puntos(l, [[5, 8], [6, 9], [7, 10], [8, 9], [9, 8], [10, 7], [11, 6], [5, 9], [6, 10], [7, 11], [8, 10], [9, 9], [10, 8], [11, 7]], 'j');
  }),
  'estado:desordenado': dibujar((l) => { caja(l, 2, 2, 13, 13, 'r'); rect(l, 7, 4, 8, 9, 'k'); rect(l, 7, 11, 8, 11, 'k'); }),
  'estado:desastre': dibujar((l) => {
    caja(l, 2, 2, 13, 13, 'q');
    rect(l, 5, 4, 6, 9, 'j'); rect(l, 5, 11, 6, 11, 'j'); rect(l, 9, 4, 10, 9, 'j'); rect(l, 9, 11, 10, 11, 'j');
  }),
  // Estrellas del historial, fecha de la ficha y flechas de la cruceta
  'estrella:llena': estrella('r'),
  'estrella:vacia': estrella('l'),
  fecha: dibujar((l) => {
    caja(l, 1, 3, 14, 14, 'j'); rect(l, 2, 4, 13, 6, 'q');
    rect(l, 4, 1, 4, 4, 'k'); rect(l, 11, 1, 11, 4, 'k');
    for (const y of [8, 11]) for (const x of [3, 6, 9, 12]) rect(l, x, y, x + 1, y + 1, 's');
  }),
  'flecha:arriba': cuadricula(ARRIBA),
  'flecha:derecha': cuadricula(DERECHA),
  'flecha:abajo': cuadricula(ABAJO),
  'flecha:izquierda': cuadricula(IZQUIERDA),
};
export const CLAVES_DE_ICONOS = Object.keys(ICONOS_DE_INTERFAZ);

// FR-1: el icono de una actividad guardada; una clave desconocida cae en el genérico (AC-3.2).
export const claveDeIconoDeActividad = (icono) => (typeof icono === 'string' && Object.hasOwn(ICONOS_DE_INTERFAZ, `actividad:${icono}`) ? `actividad:${icono}` : 'actividad:otra');

// FR-4: el icono de la insignia de un estado de limpieza; un estado desconocido se ve como limpio.
export const claveDeIconoDeEstado = (limpieza) => (typeof limpieza === 'string' && Object.hasOwn(ICONOS_DE_INTERFAZ, `estado:${limpieza}`) ? `estado:${limpieza}` : 'estado:limpio');

// FR-3: el avatar de un personaje es su cuadro de frente en reposo (vista `frente`, cuadro 0). Un personaje desconocido cae en el neutro.
export const claveDeAvatarDePersonaje = (personaje) => {
  const clave = claveDeCuadro(personaje, 'frente', 0);
  return Object.hasOwn(CUADROS_DE_PERSONAJES, clave) ? clave : claveDeCuadro('neutro', 'frente', 0);
};
// El avatar de un miembro: el de su personaje, el mismo que se ve en el mapa (AC-5.1).
export const claveDeAvatar = (estado, miembro) => claveDeAvatarDePersonaje(personajeDe(estado, miembro));

// Los 14 cuadros de frente, para pintarlos en la interfaz por el mismo camino que los iconos.
export const AVATARES = Object.fromEntries(Object.keys(PERSONAJES).map((p) => {
  const clave = claveDeAvatarDePersonaje(p);
  return [clave, CUADROS_DE_PERSONAJES[clave]];
}));
```

- [ ] Run: `cd poc && node --test test/iconos.test.js` — expect: PASS (11 pruebas).
- [ ] Run: `cd poc && node --test test/arte.test.js test/personajes.test.js test/suciedad.test.js test/contrato-arte.test.js` — expect: PASS (el arte existente no cambió).
- [ ] Commit: `feat(iconos): dibujar los 23 iconos y elegir el avatar de cada miembro` (cuerpo: `Plan section: Phase 1: Iconos y avatares (arte puro)` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 2: Colores de la interfaz desde la paleta

**Implements:** FR-7 | **Satisfies:** AC-7.1, AC-7.7, AC-7.8 (los valores), AC-7.9
**Files:** `poc/src/arte/colores.js` (nuevo), `poc/test/colores.test.js`
**Interfaces:** Consumes: `PALETA` (`src/arte/paleta.js`). Produces: `ROLES: { [rol]: clave de la paleta }`, `VELO: { clave, alfa }`, `variablesDeColor(paleta?): { [--nombre]: valor CSS }`, `contraste(a, b): número`, `PARES_DE_TEXTO: [fondo, texto][]` (nombres de rol), `COLORES_DEL_MAPA: { fondo, etiquetaFondo, etiquetaTx, cartelFondo, cartelTx, resalte, burbujaFondo, burbujaBorde }` (colores `#rrggbb`), `numeroDeColor(hex): número`.

Una sola tabla de roles (FR-7) deriva de la paleta las variables de la interfaz y los colores del texto del mapa; una función de contraste verifica cada par. Pura: sin DOM ni Phaser.

- [ ] Run: `cd poc && node --test test/colores.test.js` — expect: FAIL (`colores.js` no existe).
- [ ] Crear `poc/src/arte/colores.js`:

```js
// src/arte/colores.js
import { PALETA } from './paleta.js';

// Colores de la interfaz (FR-7 de la 011, ADR-011): cada rol de la interfaz es una clave de la paleta. De esta tabla salen las variables
// de color del CSS y los colores del texto del mapa; `index.html` no tiene ningún color propio.
export const ROLES = {
  fondo: 'k', linea: 'k', separador: 'A',
  barra: 'k', 'barra-tx': 'z', sel: 'e', 'sel-tx': 'k',
  panel: 'j', tx: 'k', campo: 'j',
  boton: 'i', 'boton-tx': 'j', suave: 'z', 'suave-tx': 'k',
  peligro: 'q', 'peligro-tx': 'j', depuracion: 'p',
  'etiqueta-fondo': 'z', 'etiqueta-tx': 'k', 'cartel-fondo': 'k', 'cartel-tx': 'j', resalte: 'r',
};
// El velo de los modales: el color de contorno con alfa; es la única transparencia de la interfaz.
export const VELO = { clave: 'k', alfa: 0.55 };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Variables CSS: una por clave de la paleta (`--c-k`), una por rol (`--barra`) y `--velo`. Pura: mismo resultado en cada llamada.
export function variablesDeColor(paleta = PALETA) {
  const v = {};
  for (const [clave, color] of Object.entries(paleta)) v[`--c-${clave}`] = color;
  for (const [rol, clave] of Object.entries(ROLES)) v[`--${rol}`] = paleta[clave];
  const [r, g, b] = rgb(paleta[VELO.clave]);
  v['--velo'] = `rgba(${r}, ${g}, ${b}, ${VELO.alfa})`;
  return v;
}

// Contraste de WCAG entre dos colores `#rrggbb`: de 1 a 21.
const luminancia = (hex) => {
  const [r, g, b] = rgb(hex).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

// Pares [rol del fondo, rol del texto] que deben cumplir 4,5 a 1 (AC-7.7, AC-7.9).
export const PARES_DE_TEXTO = [
  ['barra', 'barra-tx'], ['sel', 'sel-tx'], ['panel', 'tx'], ['boton', 'boton-tx'], ['suave', 'suave-tx'], ['peligro', 'peligro-tx'],
  ['campo', 'tx'], ['panel', 'peligro'], ['fondo', 'depuracion'],
  ['etiqueta-fondo', 'etiqueta-tx'], ['cartel-fondo', 'cartel-tx'], ['resalte', 'etiqueta-tx'],
];

// Colores del texto y de las burbujas del mapa (AC-7.8): los usa Phaser, que no lee las variables del CSS.
export const COLORES_DEL_MAPA = {
  fondo: PALETA[ROLES.fondo],
  etiquetaFondo: PALETA[ROLES['etiqueta-fondo']], etiquetaTx: PALETA[ROLES['etiqueta-tx']],
  cartelFondo: PALETA[ROLES['cartel-fondo']], cartelTx: PALETA[ROLES['cartel-tx']],
  resalte: PALETA[ROLES.resalte],
  burbujaFondo: PALETA[ROLES.panel], burbujaBorde: PALETA[ROLES.linea],
};
export const numeroDeColor = (hex) => parseInt(hex.slice(1), 16);
```

- [ ] Run: `cd poc && node --test test/colores.test.js` — expect: PASS (7 pruebas).
- [ ] Commit: `feat(colores): derivar las variables de color y los colores del mapa de la paleta` (cuerpo: `Plan section: Phase 2: Colores de la interfaz desde la paleta` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 3: Contratos puros que llevaban el emoji

**Implements:** FR-5 | **Satisfies:** AC-2.1, AC-6.3, AC-10.2
**Files:** `poc/src/secciones.js`, `poc/src/formularios.js`, `poc/test/secciones.test.js`, `poc/test/formularios.test.js`
**Interfaces:** Consumes: `ICONOS_DE_INTERFAZ` (solo en la prueba, para comprobar que cada clave existe). Produces: `SECCIONES[i].icono` es `'pestana:<clave>'`; `resumenDeFicha(...)` devuelve `'<fecha> · <recurrencia> · <lugares>'` sin prefijo.

Los dos módulos puros dejan de guardar texto-icono: la pestaña lleva la clave de su icono y la línea-resumen solo el texto (la presentación dibuja `fecha` antes). Las pruebas de la Fase 0 ya los fijan.

- [ ] Run: `cd poc && node --test test/secciones.test.js test/formularios.test.js` — expect: FAIL (los módulos aún devuelven el emoji y el prefijo).
- [ ] En `poc/src/secciones.js`, reemplazar la lista:

```js
export const SECCIONES = [
  { clave: 'espacios', etiqueta: 'Espacios', icono: 'pestana:espacios' },
  { clave: 'familia', etiqueta: 'Familia', icono: 'pestana:familia' },
  { clave: 'actividades', etiqueta: 'Actividades', icono: 'pestana:actividades' },
  { clave: 'intercambios', etiqueta: 'Intercambios', icono: 'pestana:intercambios' },
];
```

- [ ] En `poc/src/formularios.js`, reemplazar el comentario y el retorno de `resumenDeFicha`:

```js
// Línea-resumen de la ficha (AC-9.4, AC-9.8, FR-5 de la 011): fecha, recurrencia y lugares (sus nombres), sin símbolo al comienzo;
// la presentación dibuja el icono de fecha antes del texto.
export function resumenDeFicha({ vence, hoy, recurrencia, lugares }) {
  const fecha = vence === hoy ? 'Hoy' : (vence || 'Sin fecha');
  const donde = lugares.length === 0 ? 'Sin lugar' : (lugares.length === 1 ? lugares[0] : `${lugares.length} lugares`);
  return `${fecha} · ${etiquetaDeRecurrencia(recurrencia)} · ${donde}`;
}
```

- [ ] Añadir al final de `poc/test/secciones.test.js` (cada clave de icono de la barra existe en el catálogo de iconos):

```js
import { ICONOS_DE_INTERFAZ } from '../src/arte/iconos.js';

test('AC-2.1: cada pestaña lleva la clave de un icono que existe, y ninguna es un emoji', () => {
  for (const s of SECCIONES) {
    assert.ok(Object.hasOwn(ICONOS_DE_INTERFAZ, s.icono), s.icono);
    assert.doesNotMatch(s.icono, /\p{Extended_Pictographic}/u);
  }
});
```

- [ ] Run: `cd poc && node --test test/secciones.test.js test/formularios.test.js test/contrato-menu.test.js test/contrato-actividades.test.js` — expect: PASS (los contratos de `catalogo.js` e `INSIGNIAS` no cambiaron).
- [ ] Commit: `feat(interfaz): la pestaña lleva la clave de su icono y el resumen no lleva símbolo` (cuerpo: `Plan section: Phase 3: Contratos puros que llevaban el emoji` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 4: Recolor de `index.html` (marco de videojuego)

**Implements:** FR-7, FR-8 | **Satisfies:** AC-7.2, AC-7.3, AC-7.6, AC-8.1 a AC-8.6, AC-9.5
**Files:** `poc/index.html`
**Interfaces:** Consumes: las variables de `variablesDeColor()` (`--c-<clave>`, `--fondo`, `--linea`, `--separador`, `--barra`, `--barra-tx`, `--sel`, `--sel-tx`, `--panel`, `--tx`, `--campo`, `--boton`, `--boton-tx`, `--suave`, `--suave-tx`, `--peligro`, `--peligro-tx`, `--depuracion`, `--velo`), que fija la Fase 5 al arrancar. Produces: la hoja de estilos con la clase `.px` (imágenes sin suavizado) y `body.preparando` (oculto hasta que se preparan colores e imágenes); la cruceta sin símbolos; las clases `.icono`, `.chip`, `.estrellas`, `#actividad-resumen` que usa `juego.js` en la Fase 5.

Toda la hoja de estilos pasa a usar solo variables de la paleta y a verse como un marco de videojuego, con la misma disposición y los mismos selectores de antes. La prueba estática de la Fase 0 (AC-7.2, AC-7.3, AC-9.5) pasa. Sin la Fase 5 la página queda oculta (`preparando`), así que esta fase se verifica con las pruebas y la fase siguiente con el navegador.

Decisiones de esta fase: los círculos de responsable conservan su forma redonda (AC-5.6: no cambian) con borde oscuro; las estrellas y los botones de icono no llevan el relieve del resto porque contienen solo una imagen; los chips y los campos de la ficha de actividad usan la fuente del sistema (AC-8.3), pero los botones de acción de esa ficha («Cancelar», «Guardar») usan Silkscreen como todos los botones; la barra pasa de 56 a 68 px de alto para que quepa el icono de 32 px con un rótulo de dos líneas («Intercambios (3)»).

- [ ] Run: `cd poc && node --test test/interfaz-estatica.test.js` — expect: FAIL (la hoja tiene colores propios y la cruceta, símbolos).
- [ ] En `poc/index.html`, reemplazar todo el bloque `<style>…</style>` por:

```html
  <style>
    @font-face { font-family: 'Silkscreen'; src: url('assets/fonts/silkscreen-latin.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
    :root {
      --base: calc(68px + env(safe-area-inset-bottom)); /* alto de la barra inferior */
      --borde: 3px solid var(--linea); --borde-fino: 2px solid var(--linea);
      --sombra: 3px 3px 0 var(--linea); --sombra-fina: 2px 2px 0 var(--linea);
      --letra-juego: 'Silkscreen', system-ui, sans-serif;
    }
    body.preparando > * { visibility: hidden; } /* hasta que juego.js fija los colores y prepara las imágenes (AC-9.5) */
    html, body { margin: 0; height: 100%; background: var(--fondo); overflow: hidden; font-family: system-ui, sans-serif; touch-action: none; }
    #juego { position: fixed; inset: 0; }
    .px { image-rendering: pixelated; display: block; flex: none; }
    button { font: inherit; font-family: var(--letra-juego); font-size: 12px; border: var(--borde-fino); border-radius: 0; background: var(--suave); color: var(--suave-tx);
      box-shadow: var(--sombra-fina); }
    button:active:not(:disabled) { transform: translate(2px, 2px); box-shadow: none; }
    button:disabled { opacity: .45; box-shadow: none; }
    #juega { position: fixed; top: calc(12px + env(safe-area-inset-top)); right: 12px; padding: 10px 14px; max-width: 62vw;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: var(--panel); color: var(--tx); }
    #cruceta { position: fixed; left: 16px; bottom: calc(24px + var(--base)); display: grid; grid-template: repeat(3, 52px) / repeat(3, 52px);
      gap: 4px; user-select: none; pointer-events: none; } /* los huecos de la cruceta dejan pasar el toque al mapa: cartel y burbujas (AC-5.4) */
    #cruceta button { padding: 0; display: flex; align-items: center; justify-content: center; pointer-events: auto; }
    #cruceta [data-dir="arriba"] { grid-area: 1 / 2; } #cruceta [data-dir="izquierda"] { grid-area: 2 / 1; }
    #cruceta [data-dir="derecha"] { grid-area: 2 / 3; } #cruceta [data-dir="abajo"] { grid-area: 3 / 2; }
    #barra { position: fixed; left: 0; right: 0; bottom: 0; height: var(--base); padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box;
      display: flex; background: var(--barra); border-top: var(--borde); }
    #barra .pestana { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
      padding: 4px 2px; border: 0; box-shadow: none; background: transparent; color: var(--barra-tx); }
    #barra .pestana:active:not(:disabled) { transform: none; }
    #barra .pestana small { font-family: 'Silkscreen', system-ui, sans-serif; font-size: 8px; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
    #drawer-titulo { font-family: 'Silkscreen', system-ui, sans-serif; font-size: 16px; font-weight: 400; }
    #barra .pestana[aria-pressed="true"] { background: var(--sel); color: var(--sel-tx); }
    #drawer { position: fixed; left: 0; right: 0; bottom: var(--base); height: 45%; overflow-y: auto; box-sizing: border-box; display: none;
      background: var(--panel); color: var(--tx); padding: 0 16px 12px; border: var(--borde); border-bottom: 0; box-shadow: var(--sombra); }
    #drawer header { position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 0 8px; background: var(--panel); }
    #drawer button { background: var(--boton); color: var(--boton-tx); }
    input, select { font: inherit; background: var(--campo); color: var(--tx); border: var(--borde-fino); border-radius: 0; box-sizing: border-box; }
    #drawer select { width: 100%; padding: 8px; margin: 4px 0; }
    .fila { display: grid; grid-template-columns: 1fr 36px 28px 36px; align-items: center; gap: 6px; padding: 4px 0; }
    .fila small { display: block; opacity: .75; }
    .fila button { height: 32px; font-size: 16px; }
    .fila .cuenta { text-align: center; }
    .fila.cabecera { grid-template-columns: 1fr auto auto; }
    .fila.cabecera button { font-size: 12px; padding: 0 10px; }
    .fila.actividad { grid-template-columns: 36px 1fr; cursor: pointer; }
    .icono { display: flex; align-items: center; justify-content: center; }
    .subtitulo { display: block; margin: 12px 0 4px; }
    .selector { display: flex; gap: 6px; margin-bottom: 8px; }
    .selector button { flex: 1; padding: 8px 10px; }
    #drawer .selector button[aria-pressed="false"], #rutina .selector button[aria-pressed="false"] { background: var(--suave); color: var(--suave-tx); }
    #ficha-actividad select { width: 100%; padding: 8px; margin: 4px 0; }
    #ficha, #ficha-actividad { position: fixed; inset: 0; background: var(--velo); display: none; align-items: center; justify-content: center; }
    #ficha form, #ficha-actividad form { background: var(--panel); color: var(--tx); padding: 16px; border: var(--borde); box-shadow: var(--sombra); width: min(320px, 86vw);
      max-height: 90vh; overflow-y: auto; box-sizing: border-box; }
    #ficha input, #ficha-actividad input { width: 100%; padding: 8px; margin: 8px 0 4px; }
    #ficha .error, #ficha-actividad .error { color: var(--peligro); min-height: 1.2em; font-size: 13px; }
    #ficha .acciones, #ficha-actividad .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha .acciones button, #ficha-actividad .acciones button { padding: 8px 12px; background: var(--boton); color: var(--boton-tx); }
    #ficha .acciones .peligro, #ficha-actividad .acciones .peligro { background: var(--peligro); color: var(--peligro-tx); margin-right: auto; }
    .fila-nombre { display: flex; gap: 8px; align-items: center; margin: 8px 0 4px; }
    #ficha .fila-nombre input, #ficha-actividad .fila-nombre input { flex: 1; width: auto; min-width: 0; margin: 0; }
    .icono-boton { width: 44px; height: 44px; flex: none; padding: 0; display: flex; align-items: center; justify-content: center; background: var(--campo); }
    .icono-boton[aria-disabled="true"] { background: var(--suave); box-shadow: none; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
    .chip { padding: 6px 10px; display: flex; align-items: center; gap: 4px; text-align: left; font-family: system-ui, sans-serif; font-size: 14px;
      background: var(--suave); color: var(--suave-tx); }
    .chip[aria-pressed="true"] { background: var(--boton); color: var(--boton-tx); }
    .circulos { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; }
    .circulo { width: 40px; height: 40px; padding: 0; border-radius: 50%; color: var(--panel); font-family: system-ui, sans-serif; font-size: 16px; font-weight: bold;
      box-shadow: none; outline-offset: 2px; }
    .circulo[aria-pressed="true"] { outline: 3px solid var(--linea); }
    .resumen-ficha { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 2px solid var(--separador); }
    .resumen-ficha button { padding: 6px 10px; background: var(--boton); color: var(--boton-tx); }
    #actividad-resumen { display: flex; align-items: center; gap: 4px; }
    #actividad-mas label { display: block; margin: 6px 0; font-size: 13px; }
    .rejilla { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .opcion-icono { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; background: var(--suave); color: var(--suave-tx); }
    .opcion-icono[aria-pressed="true"] { background: var(--sel); color: var(--sel-tx); }
    #hoja { position: fixed; left: 0; right: 0; bottom: 0; max-height: 55%; overflow-y: auto; background: var(--panel); color: var(--tx);
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border: var(--borde); border-bottom: 0; box-shadow: var(--sombra); display: none; }
    #hoja header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    #hoja .item { display: grid; grid-template-columns: 36px 1fr auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 2px solid var(--separador); }
    #hoja .item small { display: block; opacity: .75; }
    #hoja .botones { display: flex; gap: 6px; }
    #hoja button { padding: 6px 10px; background: var(--boton); color: var(--boton-tx); }
    #hoja .peligro { background: var(--peligro); color: var(--peligro-tx); }
    #hoja .item.tocable { cursor: pointer; }
    #ficha .rutina { width: 100%; padding: 8px; margin: 4px 0; background: var(--boton); color: var(--boton-tx); }
    #rutina, #ficha-bloque { position: fixed; inset: 0; background: var(--velo); display: none; align-items: center; justify-content: center; }
    #rutina section, #ficha-bloque form { background: var(--panel); color: var(--tx); padding: 16px; border: var(--borde); box-shadow: var(--sombra); width: min(340px, 90vw);
      max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
    #rutina header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    #rutina button, #ficha-bloque .acciones button { padding: 6px 10px; background: var(--boton); color: var(--boton-tx); }
    #rutina .bloque { padding: 10px 0; border-top: 2px solid var(--separador); cursor: pointer; }
    #ficha-bloque select { width: 100%; padding: 8px; margin: 4px 0; }
    #ficha-bloque .error { color: var(--peligro); min-height: 1.2em; font-size: 13px; }
    #ficha-bloque .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    #ficha-bloque .acciones .peligro { background: var(--peligro); color: var(--peligro-tx); margin-right: auto; }
    #aviso { position: fixed; top: calc(60px + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); background: var(--barra);
      color: var(--barra-tx); border: var(--borde-fino); box-shadow: var(--sombra-fina); padding: 8px 14px; display: none; max-width: 86vw; }
    #depuracion { position: fixed; top: calc(8px + env(safe-area-inset-top)); left: 8px; color: var(--depuracion); font: 12px monospace; }
    .modal { position: fixed; inset: 0; background: var(--velo); display: none; align-items: center; justify-content: center; }
    .modal section, .modal form { background: var(--panel); color: var(--tx); padding: 16px; border: var(--borde); box-shadow: var(--sombra); width: min(340px, 90vw);
      max-height: 80vh; overflow-y: auto; box-sizing: border-box; }
    .modal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .modal button { padding: 6px 10px; background: var(--boton); color: var(--boton-tx); }
    .modal .peligro, #drawer .peligro { background: var(--peligro); color: var(--peligro-tx); }
    .modal .item, #drawer .item { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; padding: 8px 0; border-top: 2px solid var(--separador); }
    .modal .item.tocable, #drawer .item.tocable { cursor: pointer; }
    .modal .item small, #drawer .item small { display: block; opacity: .75; }
    .modal .botones, #drawer .botones { display: flex; gap: 6px; }
    .modal .subtitulo { display: block; margin: 12px 0 4px; }
    .modal select { width: 100%; padding: 8px; margin: 4px 0; }
    .modal .error, #drawer .error { color: var(--peligro); min-height: 1.2em; font-size: 13px; }
    .modal .acciones { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
    .modal .ancho, #drawer .ancho { width: 100%; margin-top: 8px; padding: 10px; }
    .nota { display: block; font-size: 13px; opacity: .75; min-height: 1em; }
    .modal .resumen, #drawer .resumen { display: block; margin: 8px 0; }
    .modal .fila-historial, #drawer .fila-historial { padding: 8px 0; border-top: 2px solid var(--separador); }
    .modal .fila-historial small, #drawer .fila-historial small { display: block; opacity: .75; }
    .modal .fila-historial .pie, #drawer .fila-historial .pie { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .modal .estrellas, #drawer .estrellas { display: flex; gap: 2px; }
    .modal .estrellas button, #drawer .estrellas button { min-width: 40px; min-height: 40px; padding: 0; display: flex; align-items: center; justify-content: center;
      background: transparent; border: 0; box-shadow: none; }
    .modal .estrellas button:disabled, #drawer .estrellas button:disabled { opacity: .45; }
  </style>
```

- [ ] En `poc/index.html`, sustituir la etiqueta `<body>` por `<body class="preparando">`.
- [ ] En `poc/index.html`, dejar los botones de la cruceta sin símbolos (la presentación les pone la flecha; se conserva el nombre accesible):

```html
  <div id="cruceta">
    <button data-dir="arriba" aria-label="Arriba"></button>
    <button data-dir="izquierda" aria-label="Izquierda"></button>
    <button data-dir="derecha" aria-label="Derecha"></button>
    <button data-dir="abajo" aria-label="Abajo"></button>
  </div>
```

- [ ] En `poc/index.html`, justo antes de `<script src="https://cdnjs.cloudflare.com/…phaser.min.js">`, añadir el respaldo que muestra la página si el módulo no llega a quitar la clase (por ejemplo, si falla un script):

```html
  <script>setTimeout(function () { document.body.classList.remove('preparando'); }, 4000);</script>
```

- [ ] Run: `cd poc && node --test test/interfaz-estatica.test.js` — expect: PASS en las pruebas de `index.html` (AC-7.2, AC-7.3, AC-9.5); siguen FALLANDO AC-7.4 y AC-7.5 (`juego.js` aún tiene emoji, `INSIGNIAS` y `imagenes.js` no existe), que se cierran en las Fases 5 y 6.
- [ ] Run: `cd poc && node --test test/tipografia.test.js` — expect: PASS (siguen el `@font-face`, `#barra .pestana small` y `#drawer-titulo`).
- [ ] Commit: `feat(interfaz): recolorear index.html con la paleta en marco de videojuego` (cuerpo: `Plan section: Phase 4: Recolor de index.html (marco de videojuego)` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 5: Imágenes de la interfaz y avatares en el HTML

**Implements:** FR-2, FR-3, FR-5, FR-6 | **Satisfies:** AC-2.2, AC-2.3, AC-3.1 a AC-3.6, AC-5.4 a AC-5.6, AC-6.1 a AC-6.4, AC-7.4, AC-7.5, AC-9.1, AC-9.3, AC-9.5
**Files:** `poc/src/imagenes.js` (nuevo), `poc/src/juego.js`
**Interfaces:** Consumes: `ICONOS_DE_INTERFAZ`, `AVATARES`, `claveDeIconoDeActividad`, `claveDeAvatar`, `claveDeAvatarDePersonaje` (`src/arte/iconos.js`); `variablesDeColor` (`src/arte/colores.js`); `PALETA`, `TAM` (`src/arte/paleta.js`). Produces: `fijarVariablesDeColor(raiz?)`, `prepararImagenes(): ms`, `imagen(clave, escala, claseExtra?): HTMLElement`, `urlsDeImagenes: Map`.

Un módulo de presentación pinta una vez cada icono y cada avatar en un canvas de 16×16, guarda su URL de datos y entrega `<img>` a cualquier tamaño entero; fija las variables de color y `juego.js` lo usa en la barra, las listas, las fichas, los selectores, el historial, la cruceta y la línea-resumen. Las burbujas y las insignias del mapa (Phaser) son la Fase 6.

- [ ] Crear `poc/src/imagenes.js`:

```js
// src/imagenes.js
// Presentación (con DOM): lleva el arte de `src/arte/` a la interfaz HTML (FR-2, FR-3 y FR-6 de la 011, ADR-011). Pinta cada icono y cada avatar
// una sola vez en un canvas de 16×16, guarda su URL de datos y entrega imágenes sin suavizado a escala entera. No tiene reglas de negocio.
import { PALETA, TAM } from './arte/paleta.js';
import { ICONOS_DE_INTERFAZ, AVATARES } from './arte/iconos.js';
import { variablesDeColor } from './arte/colores.js';

// clave → URL de datos. Se exporta para poder vaciarla desde la consola al verificar el respaldo (AC-9.3).
export const urlsDeImagenes = new Map();

// FR-7: las variables de color de la interfaz, derivadas de la paleta.
export function fijarVariablesDeColor(raiz = document.documentElement) {
  for (const [nombre, valor] of Object.entries(variablesDeColor())) raiz.style.setProperty(nombre, valor);
}

function urlDe(cuadricula) {
  const lienzo = document.createElement('canvas');
  lienzo.width = TAM;
  lienzo.height = TAM;
  const contexto = lienzo.getContext('2d');
  cuadricula.forEach((fila, y) => [...fila].forEach((ch, x) => {
    if (ch === '.') return;
    contexto.fillStyle = PALETA[ch];
    contexto.fillRect(x, y, 1, 1);
  }));
  return lienzo.toDataURL('image/png');
}

// FR-6: se llama una vez al arrancar. Si un dibujo falla, se queda sin URL y se muestra su respaldo; no se lanzan errores. Devuelve los milisegundos.
export function prepararImagenes() {
  const t0 = performance.now();
  for (const [clave, cuadricula] of Object.entries({ ...ICONOS_DE_INTERFAZ, ...AVATARES })) {
    try { urlsDeImagenes.set(clave, urlDe(cuadricula)); } catch { /* sin imagen: se usa el respaldo */ }
  }
  return performance.now() - t0;
}

const RESPALDOS = [['personaje:', 'personaje:neutro:frente:0'], ['actividad:', 'actividad:otra']];
const respaldoDe = (clave) => RESPALDOS.find(([prefijo]) => clave.startsWith(prefijo))?.[1] ?? null;

// Una imagen de la interfaz a `escala` veces 16 px (FR-2). Sin su URL usa el respaldo de su clase (`actividad:otra`, el avatar neutro); si
// tampoco hay, un hueco del mismo tamaño, para no mover la disposición.
export function imagen(clave, escala) {
  const url = urlsDeImagenes.get(clave) ?? urlsDeImagenes.get(respaldoDe(clave));
  const lado = `${TAM * escala}px`;
  if (!url) {
    const hueco = document.createElement('span');
    hueco.className = 'px';
    hueco.style.width = lado;
    hueco.style.height = lado;
    return hueco;
  }
  const img = document.createElement('img');
  img.className = 'px';
  img.src = url;
  img.alt = '';
  img.draggable = false;
  img.style.width = lado;
  img.style.height = lado;
  return img;
}
```

- [ ] En `poc/src/juego.js`, importaciones: quitar `INSIGNIAS` de `./aspecto.js`, y añadir las nuevas debajo de `import { SUCIEDAD } from './arte/suciedad.js';`:

```js
import { casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';
```

```js
import { claveDeIconoDeActividad, claveDeAvatar, claveDeAvatarDePersonaje } from './arte/iconos.js';
import { fijarVariablesDeColor, prepararImagenes, imagen } from './imagenes.js';
```

- [ ] En `poc/src/juego.js`, reemplazar el bloque de constantes de marcador (desde `// Actividades (FR-5 y FR-6 de la 003), arte de marcador…` hasta `const ESTILO_BURBUJA = …;`) por la versión sin emoji ni colores propios (la Fase 6 completa el estilo de las burbujas):

```js
const PROF_BURBUJA = 30;
```

y borrar las constantes `GLIFO_ICONO`, `COLOR_INSIGNIA` y `ESTILO_BURBUJA`, y la función `iconoDeMiembro`. Añadir en su lugar, después de `colorCss`, los auxiliares de iconos y avatares:

```js
// Iconos y avatares de la interfaz (FR-2 y FR-3 de la 011): una imagen entera dentro de un `span.icono`; `imagen` ya cuida el respaldo (FR-6).
function iconoEl(clave, escala) {
  const contenedor = elemento('span', undefined, 'icono');
  contenedor.append(imagen(clave, escala));
  return contenedor;
}
const iconoDeActividadEl = (icono, escala) => iconoEl(claveDeIconoDeActividad(icono), escala);
```

- [ ] En `poc/src/juego.js`, al comienzo del cuerpo del módulo (justo después de `const $ = (id) => document.getElementById(id);`), fijar los colores y preparar las imágenes antes de crear ninguna parte de la interfaz:

```js
// FR-6 y FR-7 de la 011: los colores y las imágenes de la interfaz se preparan una sola vez, antes de crear la barra y los listados; mientras
// tanto la página está oculta (`preparando`). El tiempo se suma al de la hoja de texturas en el indicador.
fijarVariablesDeColor();
const msImagenes = prepararImagenes();
```

- [ ] En `poc/src/juego.js`, indicador de depuración: reemplazar la línea que escribe `$('depuracion').textContent` por la versión que añade el tiempo de las imágenes:

```js
    $('depuracion').textContent = `${Math.round(this.game.loop.actualFps)} fps · regen ${ultimaRegeneracionMs.toFixed(1)} ms · arte ${this.msArte.toFixed(0)} ms · ui ${msImagenes.toFixed(0)} ms`;
```

- [ ] En `poc/src/juego.js`, la cruceta: dentro del bucle `for (const boton of document.querySelectorAll('#cruceta button'))`, tras `const dir = boton.dataset.dir;`, añadir:

```js
  boton.append(imagen(`flecha:${dir}`, 2)); // la flecha dibujada (AC-6.4); el nombre accesible sigue en aria-label
```

- [ ] En `poc/src/juego.js`, la barra: reemplazar la línea `pestana.append(elemento('span', s.icono, 'icono'), elemento('small', s.etiqueta, 'etiqueta'));` por:

```js
  pestana.append(iconoEl(s.icono, 2), elemento('small', s.etiqueta, 'etiqueta')); // AC-2.2: el icono dibujado a ×2
```

- [ ] En `poc/src/juego.js`, la lista de Familia: reemplazar `fila.append(elemento('span', iconoDeMiembro(m), 'icono'), elemento('strong', m.nombre));` por:

```js
      fila.append(iconoEl(claveDeAvatar(estado, m), 2), elemento('strong', m.nombre)); // AC-5.4: el avatar de su personaje
```

- [ ] En `poc/src/juego.js`, la lista de pendientes: reemplazar `fila.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos);` por:

```js
    fila.append(iconoDeActividadEl(a.icono, 2), datos); // AC-3.1, AC-3.5
```

- [ ] En `poc/src/juego.js`, la hoja de un lugar: reemplazar `item.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos, botones);` por:

```js
    item.append(iconoDeActividadEl(a.icono, 2), datos, botones);
```

- [ ] En `poc/src/juego.js`, el historial: reemplazar la línea `titulo.append(elemento('span', GLIFO_ICONO[entrada.icono], 'icono'), elemento('strong', entrada.nombre));` por:

```js
  titulo.append(iconoDeActividadEl(entrada.icono, 2), elemento('strong', entrada.nombre));
```

y, en el mismo bucle de estrellas, reemplazar `const boton = elemento('button', entrada.estrellas !== null && k <= entrada.estrellas ? '★' : '☆');` por:

```js
    const boton = elemento('button');
    boton.append(imagen(entrada.estrellas !== null && k <= entrada.estrellas ? 'estrella:llena' : 'estrella:vacia', 2)); // AC-6.1
```

- [ ] En `poc/src/juego.js`, el selector de iconos recibe la clave de imagen de cada opción y la escala. Reemplazar `opcionesDeIcono`, `glifoDeIcono` y `abrirSelectorIconos`:

```js
// Opciones del selector de iconos de un habitante: los aspectos de un familiar o las especies de una mascota (AC-5.2, AC-6.2), cada una con su
// avatar (AC-5.5). Las claves de aspecto y de especie son las de sus personajes.
function opcionesDeIcono(clase) {
  return Object.entries(clase === 'familiar' ? ASPECTOS : ESPECIES).map(([clave, etiqueta]) => [clave, claveDeAvatarDePersonaje(clave), etiqueta]);
}

// Selector de iconos (AC-5.2, AC-6.2, AC-8.7): una rejilla de [clave, clave de imagen, etiqueta] con la actual marcada; al elegir una, se cierra y
// llama a `alElegir`. `escala` es el tamaño de la imagen (×2 los avatares, ×3 los iconos de actividad; FR-2).
function abrirSelectorIconos(titulo, opcionesLista, actual, alElegir, escala) {
  $('selector-titulo').textContent = titulo;
  $('selector-lista').replaceChildren(...opcionesLista.map(([clave, claveImagen, etiqueta]) => {
    const boton = elemento('button', undefined, 'opcion-icono');
    boton.type = 'button';
    boton.setAttribute('aria-pressed', String(clave === actual));
    boton.append(iconoEl(claveImagen, escala), elemento('small', etiqueta));
    boton.addEventListener('click', () => { cerrarSelectorIconos(); alElegir(clave); });
    return boton;
  }));
  $('selector-iconos').style.display = 'flex';
}
```

- [ ] En `poc/src/juego.js`, la ficha del habitante: reemplazar el cuerpo de `pintarIconoFicha` y la llamada al selector:

```js
function pintarIconoFicha() {
  const boton = $('ficha-icono');
  boton.style.display = 'flex';
  boton.replaceChildren(imagen(claveDeAvatarDePersonaje(fichaActual.icono), 2)); // AC-5.5: el avatar del aspecto o de la especie elegidos
  boton.setAttribute('aria-label', fichaActual.clase === 'familiar' ? 'Elegir aspecto' : 'Elegir especie');
}

$('ficha-icono').addEventListener('click', () => {
  const { clase, icono } = fichaActual;
  abrirSelectorIconos(clase === 'familiar' ? 'Aspecto' : 'Especie', opcionesDeIcono(clase), icono, (clave) => {
    fichaActual.icono = clave;
    pintarIconoFicha();
  }, 2);
});
```

- [ ] En `poc/src/juego.js`, la ficha de actividad: reemplazar, en `pintarFichaActividad`, la línea `icono.textContent = GLIFO_ICONO[fichaAct.icono.icono];` por `icono.replaceChildren(imagen(claveDeIconoDeActividad(fichaAct.icono.icono), 2)); // AC-3.4`; el chip por:

```js
    const chip = elemento('button', undefined, 'chip');
    chip.append(imagen(claveDeIconoDeActividad(s.icono), 1), elemento('span', s.nombre)); // AC-3.6: icono a ×1 antes del nombre
```

y la línea-resumen (`$('actividad-resumen').textContent = resumenDeFicha({…});`) por:

```js
  $('actividad-resumen').replaceChildren(imagen('fecha', 1), elemento('span', resumenDeFicha({ // AC-6.3: el icono de fecha y el texto sin símbolo
    vence: $('actividad-vence').value, hoy, recurrencia: $('actividad-recurrencia').value,
    lugares: espacios.filter((e) => fichaAct.lugares.has(e.id)).map((e) => nombreVisible(estado, e)),
  })));
```

- [ ] En `poc/src/juego.js`, el selector de iconos de la actividad: reemplazar el cuerpo del listener de `#actividad-icono`:

```js
$('actividad-icono').addEventListener('click', () => {
  if (!fichaAct.icono.editable) return; // con una sugerencia el icono es el suyo (AC-8.5)
  const lista = Object.entries(ICONOS).map(([clave, etiqueta]) => [clave, claveDeIconoDeActividad(clave), etiqueta]);
  abrirSelectorIconos('Icono de la actividad', lista, fichaAct.icono.icono, (clave) => {
    fichaAct.icono = iconoDeFicha($('actividad-nombre').value, clave); // AC-8.7
    pintarFichaActividad();
  }, 3); // AC-3.3: ×3 (48 px)
});
```

- [ ] En `poc/src/juego.js`, el comentario de `abrirFichaActividad` dice «icono 📌»: reemplazar `icono 📌` por `icono genérico`.
- [ ] En `poc/src/juego.js`, las lecturas de `DATOS_ASPECTO`/`DATOS_ESPECIE` que quedan son solo `.color` (en `colorDe`); `ICONOS_DE_INTERFAZ` y `CLAVES_DE_ICONOS` se usan en la Fase 6. Si `node --check` o la prueba estática señalan un `.icono` o un símbolo que quedó en un comentario, reescribir esa línea sin el símbolo.
- [ ] Al final del módulo, en el ciclo de vida (las líneas `actualizarBotones(); mostrarChrome(); if (inicio.aviso) …`), mostrar la página una vez que todo está creado: reemplazar la llamada `mostrarChrome();` de esa línea final (no la definición de la función) por:

```js
mostrarChrome();
document.body.classList.remove('preparando'); // AC-9.5: la interfaz aparece ya con sus colores e imágenes
```

- [ ] Run: `cd poc && node --check src/juego.js && node --check src/imagenes.js` — expect: sin salida.
- [ ] Run: `cd poc && node --test test/interfaz-estatica.test.js` — expect: PASS en AC-7.3, AC-7.2, AC-9.5 y AC-7.5; AC-7.4 pasa cuando la Fase 6 quite los emoji que quedan en las burbujas y en `INSIGNIAS`.
- [ ] Commit: `feat(interfaz): iconos y avatares dibujados en la barra, las listas y las fichas` (cuerpo: `Plan section: Phase 5: Imágenes de la interfaz y avatares en el HTML` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 6: Burbujas, insignias y texto del mapa con el arte y la paleta

**Implements:** FR-4, FR-7 (texto del mapa) | **Satisfies:** AC-4.1 a AC-4.7, AC-7.4, AC-7.8, AC-9.2
**Files:** `poc/src/juego.js`
**Interfaces:** Consumes: `ICONOS_DE_INTERFAZ`, `claveDeIconoDeActividad`, `claveDeIconoDeEstado` (`src/arte/iconos.js`); `COLORES_DEL_MAPA`, `numeroDeColor` (`src/arte/colores.js`). Produces: la hoja `arte` con los 23 iconos; burbujas como `Container` (`b.objeto`) e insignias como imágenes; etiquetas, cartel y resalte con colores de la paleta.

Los iconos entran en la hoja de texturas de Phaser; las burbujas y las insignias dejan de ser texto con emoji o cuadros de color y son los iconos dibujados; las etiquetas, el cartel, el resalte y el fondo del juego usan los colores de la paleta, con el mismo tamaño, posición y comportamiento.

- [ ] En `poc/src/juego.js`, añadir las importaciones de esta fase debajo de las de la Fase 5:

```js
import { ICONOS_DE_INTERFAZ, claveDeIconoDeEstado } from './arte/iconos.js';
import { COLORES_DEL_MAPA, numeroDeColor } from './arte/colores.js';
```

y ampliar la ya existente `import { claveDeIconoDeActividad, … } from './arte/iconos.js';` fusionándolas en una sola (`claveDeIconoDeActividad, claveDeIconoDeEstado, claveDeAvatar, claveDeAvatarDePersonaje, ICONOS_DE_INTERFAZ`).
- [ ] En `poc/src/juego.js`, estilos y colores del mapa: reemplazar las constantes `ESTILO_ETIQUETA`, `ESTILO_CARTEL` y `COLOR_RESALTE` y añadir las de las burbujas (la profundidad de la burbuja, `PROF_BURBUJA = 30`, ya está de la Fase 5):

```js
// Las etiquetas se crean siempre con este estilo fijo y se contrarrestan con setScale(1 / zoom): así se ven 1:1 en pantalla. Colores de la paleta (FR-7 de la 011).
const ESTILO_ETIQUETA = {
  fontFamily: FUENTE, fontSize: TAM_LETRA_MAPA, color: COLORES_DEL_MAPA.etiquetaTx,
  backgroundColor: COLORES_DEL_MAPA.etiquetaFondo, padding: { x: 3, y: 2 },
};
```

```js
const ESTILO_CARTEL = { ...ESTILO_ETIQUETA, color: COLORES_DEL_MAPA.cartelTx, backgroundColor: COLORES_DEL_MAPA.cartelFondo };
```

```js
const COLOR_RESALTE = COLORES_DEL_MAPA.resalte;
// Burbuja (FR-4 de la 011): un recuadro claro con borde oscuro, el icono de la actividad más atrasada (16 px) y un «+» en texto si hay más.
const ALTO_BURBUJA = 20;
const ANCHO_BURBUJA = 20;
const ANCHO_BURBUJA_CON_MAS = 30;
const ESTILO_MAS = { fontFamily: FUENTE, fontSize: TAM_LETRA_MAPA, color: COLORES_DEL_MAPA.etiquetaTx };
```

- [ ] En `poc/src/juego.js`, el fondo del juego: en `new Phaser.Game({ type: Phaser.AUTO, parent: 'juego', backgroundColor: '#1d1d1d', …` cambiar el color por `backgroundColor: COLORES_DEL_MAPA.fondo`.
- [ ] En `poc/src/juego.js`, `prepararArte`: sumar los iconos a la hoja y actualizar el comentario de cabecera (`FR-1 y AC-9.5 de la 008, … y FR-4 de la 011: …iconos de las burbujas y las insignias`):

```js
  const dibujos = { ...TEXTURAS, ...SUCIEDAD, ...CUADROS_DE_PERSONAJES, ...ICONOS_DE_INTERFAZ };
```

- [ ] En `poc/src/juego.js`, `dibujarInsignias`: la insignia es la imagen del icono del estado.

```js
  // Insignia del estado de limpieza junto al nombre de cada espacio (FR-5 de la 003, FR-4 de la 011): el icono de su estado, a 16 px en pantalla;
  // los pasillos no tienen etiqueta ni insignia.
  dibujarInsignias() {
    this.insignias.forEach((t) => t.destroy());
    this.insignias.clear();
    const escala = 1 / this.cameras.main.zoom;
    for (const clave of this.etiquetas.keys()) {
      const limpieza = limpiezaDeEspacio(estado, clave, hoy);
      const insignia = this.add.image(0, 0, 'arte', claveDeIconoDeEstado(limpieza)).setOrigin(0, 0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.insignias.set(clave, insignia);
    }
    this.colocarInsignias();
  }
```

- [ ] En `poc/src/juego.js`, `dibujarBurbujas` y `colocarBurbujas`: cada burbuja es un `Container` (`b.objeto`) en lugar de un texto (`b.texto`).

```js
  // Una burbuja por lugar con actividades por hacer (FR-6 de la 003, FR-4 de la 011): icono de la más atrasada y "+" si hay más.
  // La de un espacio queda fija en su casilla; la de un miembro la coloca `colocarBurbujas` en cada cuadro.
  dibujarBurbujas() {
    for (const b of this.burbujas) b.objeto.destroy();
    const escala = 1 / this.cameras.main.zoom;
    this.burbujas = burbujas(estado, hoy).map((b) => {
      const ancho = b.mas ? ANCHO_BURBUJA_CON_MAS : ANCHO_BURBUJA;
      const fondo = this.add.rectangle(0, 0, ancho, ALTO_BURBUJA, numeroDeColor(COLORES_DEL_MAPA.burbujaFondo))
        .setStrokeStyle(1, numeroDeColor(COLORES_DEL_MAPA.burbujaBorde));
      const partes = [fondo, this.add.image(b.mas ? -5 : 0, 0, 'arte', claveDeIconoDeActividad(b.icono))];
      if (b.mas) partes.push(this.add.text(9, 0, '+', ESTILO_MAS).setOrigin(0.5));
      const objeto = this.add.container(0, 0, partes).setScale(escala).setDepth(PROF_BURBUJA);
      const casilla = b.tipo === 'espacio' ? casillaDeBurbuja(distribucion, b.id) : null;
      if (casilla) objeto.setPosition(casilla.x * TILE + TILE / 2, casilla.y * TILE + TILE / 2);
      return { ...b, objeto };
    });
    this.colocarBurbujas();
  }

  // Las burbujas de los miembros siguen a su personaje, centradas en la casilla de encima de él: la misma que responde al toque
  // (AC-6.8 de la 003). La de un familiar fuera de casa no se ve (AC-5.8 de la 004).
  colocarBurbujas() {
    for (const b of this.burbujas) {
      if (b.tipo !== 'miembro') continue;
      const cuerpo = b.id === jugador.id ? this.personaje : this.sprites.get(b.id)?.cuerpo;
      b.objeto.setVisible(Boolean(cuerpo?.visible));
      if (cuerpo) b.objeto.setPosition(cuerpo.x, cuerpo.y - TILE);
    }
  }
```

- [ ] Run: `cd poc && grep -n "b\.texto\|\.texto\.\|GLIFO_ICONO\|COLOR_INSIGNIA\|ESTILO_BURBUJA\|'#[0-9a-fA-F]\{3,6\}'" src/juego.js` — expect: sin coincidencias (si queda alguna referencia a `b.texto` en otro método, cambiarla por `b.objeto`).
- [ ] Run: `cd poc && node --check src/juego.js` — expect: sin salida.
- [ ] Run: `cd poc && npm test` — expect: PASS, 0 fallos (las 431 de la 010 con los dos ajustes de la Fase 3, más las nuevas de las Fases 0 a 3 y la estática: ya pasan AC-7.4 y AC-7.5).
- [ ] Commit: `feat(mapa): burbujas e insignias dibujadas y texto del mapa con colores de la paleta` (cuerpo: `Plan section: Phase 6: Burbujas, insignias y texto del mapa con el arte y la paleta` y `Feature: 011-iconos-propios-y-recolor`)

---

## Phase 7: Integration Verification

**Implements:** All FRs | **Satisfies:** All ACs (AC-1.9, AC-2.2, AC-2.3, AC-3.1, AC-3.3 a AC-3.6, AC-4.1 a AC-4.7, AC-5.4 a AC-5.6, AC-6.1, AC-6.2, AC-6.4, AC-7.6, AC-7.8, AC-8.1 a AC-8.6, AC-9.1 a AC-9.5, AC-10.1, AC-10.3, AC-10.4 y la comprobación a mano del resto)
**Files:** `docs/specs/011-iconos-propios-y-recolor/verification.md` (nuevo); posibles retoques a `poc/src/arte/iconos.js` y `poc/index.html`

- [ ] Run: `cd poc && npm test`. Expect: 0 fallos; anotar el total (431 de la 010 + las pruebas nuevas) para `verification.md` (AC-10.2).
- [ ] Run: `cd poc && node --check src/juego.js && node --check src/imagenes.js`. Expect: sin salida.
- [ ] El dominio, el generador y el arte del mapa no cambiaron (FR-6, AC-10.2). Run, desde la raíz del repositorio: `git diff --stat main -- poc/src/catalogo.js poc/src/hogar.js poc/src/almacen.js poc/src/distribucion.js poc/src/posicion.js poc/src/movimiento.js poc/src/rutas.js poc/src/rutinas.js poc/src/actividades.js poc/src/intercambios.js poc/src/historial.js poc/src/aspecto.js poc/src/arte/paleta.js poc/src/arte/texturas.js poc/src/arte/mobiliario.js poc/src/arte/suciedad.js poc/src/arte/casillas.js poc/src/arte/personajes.js poc/src/arte/caminar.js`. Expect: sin salida. Y solo estos dos archivos de pruebas cambiaron de las 431: `git diff --stat main -- poc/test/` debe listar `secciones.test.js` y `formularios.test.js` como modificados, más los tres nuevos.
- [ ] Servir `poc/` sin caché: `cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"`. Abrir `http://localhost:8080` en el navegador de la app.
- [ ] Cargar los hogares de prueba desde la consola (los de la 009 y la 010; la fecha es la de hoy en el navegador):
```js
const { hogarDePruebaDeEstados, hogarDePrueba1 } = await import('/test/hogares-de-prueba.js');
const { fechaLocal } = await import('/src/fechas.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDePruebaDeEstados('desastre', fechaLocal(new Date()))));
localStorage.removeItem('livin:posicion:v1');
location.reload();
// Para ver los 14 avatares: cambiar la segunda línea por JSON.stringify(hogarDePrueba1()) (seis aspectos y cuatro mascotas) y luego hogarDePrueba2().
```
- [ ] Verificar en el navegador de escritorio y en el viewport de teléfono (375×812):
  1. **Arranque (AC-9.2, AC-9.5):** se abre sin avisos ni errores en la consola; el indicador muestra `arte N ms · ui M ms`: anotar N y M (la suma, menor que 300 ms); `document.body.classList.contains('preparando')` es `false`. En la consola, las dimensiones de la hoja `game.textures.get('arte').getSourceImage()` no superan 4.096. Al recargar con la CPU ralentizada (DevTools, 6×) no se ve la barra ni los paneles sin colores.
  2. **Iconos (AC-1.9, AC-2.2, AC-3.1):** ver a ×2 sobre crema y sobre el morado oscuro los 23 iconos (la barra y las 9 actividades, creando una actividad con cada icono desde el selector). Se reconocen y los de actividad se distinguen entre sí. Retocar los que no se entiendan en `src/arte/iconos.js` y repetir `node --test test/iconos.test.js`; anotar los retoques.
  3. **Barra y drawers (AC-2.2, AC-2.3, AC-8.1 a AC-8.4, AC-8.6):** cada pestaña muestra su icono a ×2 con su rótulo; con propuestas recibidas el rótulo «Intercambios (n)» cabe sin tapar el icono (si no cabe, subir `--base`); marco de 3 px, esquinas cuadradas, sombra dura; botones con relieve que se hunden; Silkscreen en títulos, rótulos y botones; campos, listas e historial en la fuente del sistema; la disposición coincide con la de la 010.
  4. **Actividades (AC-3.3 a AC-3.6):** el selector de iconos muestra 9 opciones a ×3 con la actual marcada; con un nombre igual a una sugerencia, el botón de icono muestra el suyo y no se puede cambiar; los chips llevan el icono a ×1; con 50 pendientes y 200 entradas, desplazar las listas sin tirones.
  5. **Avatares (AC-5.4 a AC-5.6):** en Familia y en el selector de aspecto y especie cada fila y opción muestra el personaje de frente (con `hogarDePrueba1` y `hogarDePrueba2` salen los 14); coincide con el del mapa; los círculos de responsable, «¿Quién juega?», los intercambios y el historial se ven como antes.
  6. **Burbujas e insignias (AC-4.1 a AC-4.7):** la burbuja de un lugar muestra el icono de la actividad más atrasada y el «+» si hay más; tocarla abre la hoja como antes; junto a cada nombre de espacio se ve el icono de su estado, a 16 px a cualquier zoom, y sigue a la etiqueta al desplazarse en exploración; con «Hecho» en la última actividad atrasada el icono pasa a limpio; el pasillo no tiene icono; el cartel «n fuera» conserva su texto y su toque.
  7. **Estrellas, fecha y cruceta (AC-6.1, AC-6.2, AC-6.4):** calificar de 1 a 5 muestra n estrellas llenas; las propias o bloqueadas están desactivadas; la línea-resumen de la ficha lleva el icono de fecha antes del texto; la cruceta muestra las cuatro flechas, mueve al personaje y deja pasar el toque entre sus botones.
  8. **Colores del mapa (AC-7.8):** etiquetas, cartel y resalte son de la paleta (inspeccionar `ESTILO_ETIQUETA` en la consola o comparar con capturas), con el mismo tamaño y posición que en la 010.
  9. **Respaldo (AC-9.3):** en la consola, `const m = await import('/src/imagenes.js'); m.urlsDeImagenes.delete('actividad:platos');` y cambiar de pestaña para repintar: las actividades con ese icono muestran el genérico `otra`; `m.urlsDeImagenes.clear()` y repintar: la interfaz sigue usable con huecos del mismo tamaño y sin errores en la consola. Recargar para restaurar.
  10. **Reutilización (AC-9.1):** al cambiar de pestaña y abrir fichas no se crean canvas nuevos (`document.querySelectorAll('canvas').length` no crece) y los `<img>` usan URLs de datos ya preparadas.
  11. **Hogar guardado (AC-10.1):** con un hogar guardado antes de esta feature se abre sin aviso y el documento sigue en `version: 7`.
  12. **Uso completo (AC-10.3, AC-10.4):** jugar, cambiar de jugador, editar espacios, familia, actividades, rutinas, intercambios y calificaciones: todo funciona como en la 010; mundo, personajes y estados se ven igual.
- [ ] Rendimiento con carga completa (AC-9.4): armar desde la consola, como en la verificación de la 010, un hogar `version: 7` con 8 familiares, 4 mascotas, 50 actividades atrasadas 3 días o más y 200 entradas de historial, y todos los espacios en desastre. Caminar 30 segundos; abrir los drawers de Actividades y Hechas; en edición, cambiar contadores. Expect: 60 fps o más y `regen` sin superar los 24,9 ms de la 010, y siempre por debajo de 100 ms.
- [ ] Verificación en el teléfono Android (la hace el usuario; servir en `0.0.0.0:8080` solo mientras dura la prueba, con el mismo servidor sin caché, y apagarlo después). Repetir los pasos 1 a 8 con el hogar de prueba y el hogar completo, y anotar fps, `regen`, `arte` y `ui`. Si la barra no cabe, o la sombra dura o la letra de los botones quedan demasiado grandes o anchas (Silkscreen es más ancha: lección del 2026-10-10), ajustar `--base` o el tamaño de los botones en `index.html` y repetir; si las burbujas no se leen, ajustar `ANCHO_BURBUJA` y `ALTO_BURBUJA`.
- [ ] Escribir `docs/specs/011-iconos-propios-y-recolor/verification.md` con: las pruebas automáticas y el comando; el fragmento para cargar los hogares de prueba; los pasos de escritorio y sus resultados; el teléfono; los tiempos de `arte`, `ui` y `regen`; los retoques a los iconos; los límites aceptados.
- [ ] Pedir confirmación al usuario y, si la da, actualizar la documentación del proyecto (no editar sin confirmación):
  - En `CLAUDE.md` (estado del proyecto, arquitectura): la feature 011, `iconos.js` y `colores.js` en `src/arte/`, `imagenes.js` como módulo de presentación con DOM, 23 iconos, avatares y que la interfaz HTML usa solo colores de la paleta.
  - En `.claude/rules/phaser.md`: burbujas e insignias son iconos de la hoja de texturas (ya no emoji) y el texto del mapa usa colores de la paleta.
  - En `.claude/rules/javascript.md`: `iconos.js` y `colores.js` puros; `imagenes.js` fuera de `src/arte/` por tocar el DOM.
  - En `.claude/rules/testing.md`: la validación de los iconos, los contrastes y la prueba estática de `index.html` y de los fuentes.
- [ ] Commit: `feat: complete 011 iconos propios y recolor de la interfaz` (cuerpo: `Plan section: Phase 7: Integration Verification` y `Feature: 011-iconos-propios-y-recolor`)

**Cobertura de FR por fase:** FR-1 → Fases 0 y 1; FR-2 → Fases 4, 5 y 6; FR-3 → Fases 1 y 5; FR-4 → Fase 6; FR-5 → Fases 3 y 5; FR-6 → Fases 4, 5 y 6; FR-7 → Fases 0, 2, 4 y 6; FR-8 → Fase 4.

**Cobertura de AC por fase:**
- **Story 1:** AC-1.1 a AC-1.8 → Fases 0 y 1; AC-1.9 → Fase 7.
- **Story 2:** AC-2.1 → Fase 3; AC-2.2 y AC-2.3 → Fases 4, 5 y 7.
- **Story 3:** AC-3.2 → Fases 0 y 1; AC-3.1 y AC-3.3 a AC-3.6 → Fases 4, 5 y 7.
- **Story 4:** AC-4.1 a AC-4.7 → Fases 6 y 7.
- **Story 5:** AC-5.1 a AC-5.3 → Fases 0 y 1; AC-5.4 a AC-5.6 → Fases 5 y 7.
- **Story 6:** AC-6.3 → Fases 0 y 3; AC-6.1, AC-6.2 y AC-6.4 → Fases 4, 5 y 7.
- **Story 7:** AC-7.1, AC-7.7 y AC-7.9 → Fases 0 y 2; AC-7.2 y AC-7.3 → Fases 0 y 4; AC-7.4 y AC-7.5 → Fases 0, 5 y 6; AC-7.6 → Fases 4 y 7; AC-7.8 → Fases 2, 6 y 7.
- **Story 8:** AC-8.1 a AC-8.6 → Fases 4 y 7.
- **Story 9:** AC-9.1 → Fases 5 y 7; AC-9.2 → Fases 5, 6 y 7; AC-9.3 → Fases 5 y 7; AC-9.4 → Fase 7; AC-9.5 → Fases 0, 4, 5 y 7.
- **Story 10:** AC-10.1 → Fase 7 (y las suites de `almacen`); AC-10.2 → Fases 3 y 7; AC-10.3 y AC-10.4 → Fase 7.

---

## Quickstart Validation

```bash
cd poc
npm test                      # 0 fallos (431 de la 010, con dos pruebas ajustadas, más las nuevas)
node --check src/juego.js     # sintaxis de la escena
python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"   # http://localhost:8080
```

En la app:
1. Cargar el hogar de prueba `desastre` con el fragmento de la Fase 7.
2. Mirar la barra: cuatro pestañas con su icono, marco oscuro y rótulos en Silkscreen.
3. Abrir Actividades, crear una actividad con cada uno de los 9 iconos y verlos en la lista, en la hoja del lugar y en la burbuja del mapa.
4. Abrir Familia: cada fila con el personaje de frente. Cargar `hogarDePrueba1` y `hogarDePrueba2` y ver los 14.
5. Marcar «Hecho» en la última actividad atrasada de la cocina: su icono de estado pasa a limpio.
6. Calificar una actividad hecha: las estrellas se llenan.

---

## Validación previa

Los bloques de código de las Fases 0 a 6 se aplicaron a una **copia de `poc/` fuera del repositorio** (sin escribir archivos del repositorio): los archivos nuevos y el bloque de estilos de `index.html` se extrajeron de este mismo plan con un guion, y los cambios de `secciones.js`, `formularios.js`, las pruebas y `juego.js` se aplicaron con reemplazos exactos sobre el código real:
- **Pruebas:** la copia pasa **456 pruebas, 0 fallos** (las 431 de la 010 y 25 nuevas: iconos, colores, la prueba estática y la de `secciones`). La suite tarda unos 6,5 s.
- **Orden de las pruebas:** con solo las Fases 0 a 4 aplicadas, fallaban exactamente AC-7.4 y AC-7.5 (`juego.js` aún con emoji e `INSIGNIAS`), y pasaron al aplicar las Fases 5 y 6, como dice el plan.
- **Sintaxis:** `node --check` sin errores en `src/juego.js` e `src/imagenes.js`; no quedan referencias a `b.texto`, `GLIFO_ICONO`, `COLOR_INSIGNIA`, `ESTILO_BURBUJA` ni colores `#rrggbb` en `juego.js`.
- **Catálogo:** `CLAVES_DE_ICONOS` tiene 23 claves y `AVATARES` 14.
- **En el navegador** (copia servida sin caché, viewport de teléfono 375×812, hogar de prueba `desastre`): se abre sin errores en la consola; la barra muestra sus cuatro iconos con Silkscreen y la pestaña abierta resaltada; la cruceta muestra las cuatro flechas; «Juega: Protagonista» y el drawer de Familia se ven con el marco de videojuego (borde, sombra dura, esquinas cuadradas); en edición se ven las burbujas con su icono y las insignias de estado dibujadas junto a los nombres de los espacios.
- **No validado:** el aspecto final de los iconos en el teléfono, que la barra de 68 px acepte el rótulo de dos líneas de «Intercambios (n)», los tiempos de `arte` y `ui` en el teléfono, que 50 y 200 filas se desplacen sin tirones y el tamaño de las burbujas con el zoom bajo de la edición (ya era mayor que una casilla antes de esta feature); todo se verifica en la Fase 7.
