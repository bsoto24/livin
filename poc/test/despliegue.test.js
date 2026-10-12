// test/despliegue.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = new URL('../', import.meta.url); // poc/
const repo = new URL('../', raiz);
const leer = (ruta) => readFileSync(new URL(ruta, raiz), 'utf8');
const flujo = () => readFileSync(new URL('.github/workflows/publicar.yml', repo), 'utf8');
const URL_PHASER = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js';
const SRI_PHASER = 'sha512-zQK11u7QyhUWLmhK+Kyn4Oac0n2d5+AcuEiCagfm2YrGa2wMrdbj5EJammEmGU7bGnckmRoNTUT29Dl+DaRSlg==';

// Las directivas de la política de contenido de la <meta>, como { directiva: [fuentes] }.
function politica(html) {
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(m, 'falta la <meta> de Content-Security-Policy');
  return Object.fromEntries(m[1].split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [nombre, ...fuentes] = d.split(/\s+/);
    return [nombre, fuentes];
  }));
}

// El texto de un trabajo del flujo (desde «  nombre:» hasta el siguiente trabajo o el final).
function trabajo(yml, nombre) {
  const m = yml.match(new RegExp(`^  ${nombre}:\\n([\\s\\S]*?)(?=^  [a-z-]+:\\n|(?![\\s\\S]))`, 'm'));
  assert.ok(m, `falta el trabajo ${nombre}`);
  return m[1];
}

test('012 AC-1.6: ninguna ruta de index.html ni de src/ es absoluta desde la raíz del servidor', () => {
  const html = leer('index.html');
  assert.doesNotMatch(html, /\s(?:src|href)="\/(?!\/)/);
  assert.doesNotMatch(html, /url\(\s*['"]?\/(?!\/)/);
  const fuentes = readdirSync(new URL('src/', raiz), { recursive: true }).filter((n) => n.endsWith('.js'));
  assert.ok(fuentes.length > 10, 'se leen los fuentes');
  for (const nombre of fuentes) {
    assert.doesNotMatch(leer(`src/${nombre}`), /\bfrom\s+['"]\/|import\(\s*['"]\/|fetch\(\s*['"]\//, `src/${nombre}`);
  }
});

test('012 AC-3.1: Phaser 3.80.1 desde cdnjs lleva integridad SHA-512 y origen anónimo', () => {
  assert.ok(leer('index.html').includes(`<script src="${URL_PHASER}" integrity="${SRI_PHASER}" crossorigin="anonymous"></script>`));
});

test('012 AC-3.1: el único script de terceros es Phaser; los demás son del propio origen', () => {
  const fuentes = [...leer('index.html').matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
  const deTerceros = fuentes.filter((s) => /^(?:[a-z]+:)?\/\//i.test(s));
  assert.deepEqual(deTerceros, [URL_PHASER]);
  for (const s of fuentes.filter((f) => !deTerceros.includes(f))) assert.match(s, /^src\//);
});

test('012 AC-3.3: la política de contenido restringe los orígenes', () => {
  const p = politica(leer('index.html'));
  assert.deepEqual(p['default-src'], ["'self'"]);
  assert.ok(p['script-src'].includes("'self'"));
  assert.ok(p['script-src'].includes('https://cdnjs.cloudflare.com'));
  for (const f of p['script-src']) {
    assert.ok(["'self'", 'https://cdnjs.cloudflare.com'].includes(f) || /^'sha256-[A-Za-z0-9+/]+=*'$/.test(f), `fuente de script no permitida: ${f}`);
  }
  assert.deepEqual(p['style-src'], ["'self'", "'unsafe-inline'"]);
  assert.deepEqual([...p['img-src']].sort(), ["'self'", 'blob:', 'data:']);
  assert.deepEqual(p['font-src'], ["'self'"]);
  assert.deepEqual(p['connect-src'], ["'self'"]);
  assert.deepEqual(p['object-src'], ["'none'"]);
  assert.deepEqual(p['base-uri'], ["'self'"]);
  const todas = Object.values(p).flat();
  assert.ok(!todas.includes('*'), 'ningún comodín');
  assert.ok(!todas.includes("'unsafe-eval'"), 'sin unsafe-eval');
});

test('012 AC-3.3 y AC-3.8: cada script en línea está permitido por su hash y la política va antes de cualquier estilo o script', () => {
  const html = leer('index.html');
  const p = politica(html);
  for (const [, codigo] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const hash = `'sha256-${createHash('sha256').update(codigo).digest('base64')}'`;
    assert.ok(p['script-src'].includes(hash), `falta ${hash} en script-src`);
  }
  const meta = html.indexOf('http-equiv="Content-Security-Policy"');
  assert.ok(meta > 0 && meta < html.indexOf('<style>') && meta < html.indexOf('<script'), 'la <meta> va antes del <style> y de los <script>');
});

test('012 AC-2.1 y AC-2.4: el flujo se dispara solo con push a main y a mano, y publica solo desde main', () => {
  const yml = flujo();
  assert.match(yml, /^on:\n  push:\n    branches: \[main\]\n  workflow_dispatch:\n/m);
  assert.doesNotMatch(yml, /pull_request|schedule:|release:|workflow_run/);
  assert.match(trabajo(yml, 'publicar'), /^    if: github\.ref == 'refs\/heads\/main'$/m);
});

test('012 AC-2.2: publicar depende de que pasen todas las pruebas de poc/', () => {
  const yml = flujo();
  const pruebas = trabajo(yml, 'pruebas');
  assert.match(pruebas, /node-version: 22/);
  assert.match(pruebas, /- run: npm test\n\s+working-directory: poc/);
  assert.match(trabajo(yml, 'publicar'), /^    needs: pruebas$/m);
});

test('012 AC-2.5: permisos mínimos y solo acciones oficiales de GitHub fijadas a una versión', () => {
  const yml = flujo();
  assert.match(yml, /^permissions:\n  contents: read\n/m);
  const publicar = trabajo(yml, 'publicar');
  assert.match(publicar, /pages: write/);
  assert.match(publicar, /id-token: write/);
  assert.equal(yml.match(/pages: write/g).length, 1);
  assert.equal(yml.match(/id-token: write/g).length, 1);
  const usos = [...yml.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
  assert.ok(usos.length >= 4);
  for (const u of usos) assert.match(u, /^actions\/[a-z-]+@v\d+$/, u);
  assert.equal((yml.match(/persist-credentials: false/g) ?? []).length, (yml.match(/actions\/checkout@/g) ?? []).length);
});

test('012 AC-5.2: el paquete publicado contiene solo index.html, src/ y assets/', () => {
  const publicar = trabajo(flujo(), 'publicar');
  assert.match(publicar, /cp -R poc\/index\.html poc\/src poc\/assets _sitio\//);
  assert.match(publicar, /path: _sitio/);
  assert.doesNotMatch(publicar, /poc\/test|package\.json|path: poc/);
});

test('012 AC-4.2: git no sigue archivos de claves ni credenciales y .gitignore los cubre', () => {
  const archivos = execFileSync('git', ['ls-files'], { cwd: fileURLToPath(repo), encoding: 'utf8' }).split('\n').filter(Boolean);
  const SENSIBLE = /(^|\/)\.env(\.|$)|\.(pem|key|p12|pfx)$|(^|\/)id_(rsa|ed25519)|credentials/i;
  assert.deepEqual(archivos.filter((a) => SENSIBLE.test(a)), []);
  const ignorados = readFileSync(new URL('.gitignore', repo), 'utf8').split('\n');
  for (const patron of ['.env', '.env.*', '*.pem', '*.key']) assert.ok(ignorados.includes(patron), `.gitignore no cubre ${patron}`);
});
