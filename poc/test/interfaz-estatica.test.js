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
