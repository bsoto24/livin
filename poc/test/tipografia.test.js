// test/tipografia.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const leer = (ruta) => readFileSync(new URL(ruta, raiz), 'utf8');

test('AC-8.4: la fuente Silkscreen está en el repositorio, con su licencia y su origen al lado', () => {
  const bytes = readFileSync(new URL('assets/fonts/silkscreen-latin.woff2', raiz));
  assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2');
  assert.ok(bytes.length > 1000 && bytes.length < 200000, `tamaño inesperado: ${bytes.length}`);
  assert.match(leer('assets/fonts/OFL.txt'), /SIL OPEN FONT LICENSE/i);
  const leeme = leer('assets/fonts/LEEME.md');
  assert.match(leeme, /Silkscreen/);
  assert.match(leeme, /SIL Open Font License/);
  assert.match(leeme, /https:\/\//);
});

test('AC-7.1, AC-7.3 y AC-8.1: index.html declara Silkscreen local y la usa solo en las pestañas y en el título del drawer', () => {
  const html = leer('index.html');
  assert.match(html, /@font-face\s*\{[^}]*font-family:\s*'Silkscreen'[^}]*url\('assets\/fonts\/silkscreen-latin\.woff2'\)/);
  assert.match(html, /#barra \.pestana small\s*\{[^}]*font-family:\s*'Silkscreen'/);
  assert.match(html, /#drawer-titulo\s*\{[^}]*font-family:\s*'Silkscreen'/);
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(leer('src/juego.js'), /fonts\.googleapis|fonts\.gstatic/);
});
