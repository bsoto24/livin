# Implementation Plan: Despliegue público de la PoC

**Spec:** docs/specs/012-despliegue-publico/spec.md (v1.0.1, aprobada)
**Decisions:** docs/adr/012-hosting-estatico-github-pages.md, docs/adr/012-seguridad-sin-cabeceras-sri-y-csp.md
**Created:** 2026-10-12

No hay `data-model.md` ni `contracts/`: la feature no guarda datos nuevos ni expone API (FR-8, AC-6.2). La guía de despliegue de AC-5.4 es el `quickstart.md` de la feature (Fase 3).

## Context

La PoC es 100 % estática (`poc/index.html`, `poc/src/`, `poc/assets/`, Phaser 3.80.1 desde cdnjs) y hoy solo se juega con `npm start` en la máquina de desarrollo. La 012 la publica en `https://bsoto24.github.io/livin/` con un flujo de GitHub Actions que corre las pruebas como compuerta, agrega SRI a Phaser y una CSP por `<meta>`, y deja documentado lo que queda público. El repo pasa a público y Pages se configura con la fuente "GitHub Actions"; esos dos pasos los hace la persona responsable (FR-6).

Lo que dice el código y la red hoy (verificado el 2026-10-12):
- `index.html` tiene un `<style>` en línea (línea 7), un `<script>` en línea con el respaldo de 4 s (línea 269: `setTimeout(function () { document.body.classList.remove('preparando'); }, 4000);`), Phaser desde cdnjs sin `integrity` (línea 270) y `<script type="module" src="src/juego.js">` (línea 271). No hay atributos `style="…"`, `on…=`, `innerHTML`, `eval` ni `new Function` en `index.html` ni en `src/`; `src/imagenes.js` genera URLs `data:` con `toDataURL`.
- Todas las rutas son relativas (`src/juego.js`, `assets/fonts/silkscreen-latin.woff2`).
- SHA-512 de `phaser.min.js` 3.80.1: el archivo descargado de cdnjs y la API de cdnjs dan el mismo valor, `sha512-zQK11u7QyhUWLmhK+Kyn4Oac0n2d5+AcuEiCagfm2YrGa2wMrdbj5EJammEmGU7bGnckmRoNTUT29Dl+DaRSlg==`. cdnjs responde con `access-control-allow-origin: *`, lo que permite `crossorigin="anonymous"`.
- SHA-256 del script en línea (contenido exacto entre `<script>` y `</script>`): `OVaPb1Xg4e319UWloNbKPvLAsSeTGHPmO8K4zzIRlHk=`.
- `test/interfaz-estatica.test.js` (011) lee el `<style>` en línea de `index.html` para comprobar que no hay colores escritos a mano: el `<style>` se queda en línea.
- Versiones vigentes de las acciones oficiales (consultadas con `gh api …/releases/latest`): `actions/checkout` v7, `actions/setup-node` v7, `actions/upload-pages-artifact` v5, `actions/deploy-pages` v5. Node local: 22.
- Límites de Pages (documentación oficial): sitio ≤ 1 GB, 100 GB al mes de tráfico blando, despliegue ≤ 10 min; el límite de 10 builds por hora no aplica con un flujo propio.
- `.gitignore` solo cubre `.DS_Store`, `node_modules/` y `.superpowers/`.
- **Estado al 2026-10-12 (verificado con `gh api`):** el repo ya es **público** y Pages está en modo «desde una rama» (`build_type: legacy`, `main`, carpeta `/`). Como `index.html` está en `poc/` y no en la raíz, `https://bsoto24.github.io/livin/` da 404; mientras tanto la PoC se juega en `https://bsoto24.github.io/livin/poc/`, que sirve el repo entero (también `poc/test/`, `poc/package.json` y los `.md` convertidos a HTML) sin SRI ni CSP. El selector solo ofrece `/` o `/docs`, por eso la fuente debe pasar a «GitHub Actions» (Fase 4).
- **Desvío aceptado del orden de la spec:** el repo se hizo público **antes** de buscar secretos (AC-4.1 y FR-6 pedían lo contrario). La búsqueda se hizo justo después, el mismo día (ver Fase 4).

## Global Constraints

- **Dirección (FR-1):** `https://bsoto24.github.io/livin/`, HTTPS, sin autenticación; ninguna ruta absoluta desde la raíz.
- **Contenido publicado (FR-2):** solo `index.html`, `src/` y `assets/` de `poc/`; nunca `test/`, `package.json` ni nada fuera de `poc/`.
- **Flujo (FR-3):** se dispara con push a `main` y a mano (`workflow_dispatch`); publica solo si pasan todas las pruebas y solo desde `main`; permisos mínimos (`contents: read` global; `pages: write` e `id-token: write` solo en el trabajo que publica); solo acciones `actions/*` fijadas a una versión mayor; `persist-credentials: false` en cada checkout; Node 22.
- **Integridad (FR-4):** Phaser 3.80.1 desde cdnjs con `integrity="sha512-zQK11u7QyhUWLmhK+Kyn4Oac0n2d5+AcuEiCagfm2YrGa2wMrdbj5EJammEmGU7bGnckmRoNTUT29Dl+DaRSlg=="` y `crossorigin="anonymous"`; ningún otro script de terceros.
- **Política de contenido (FR-5):** `<meta http-equiv="Content-Security-Policy">` antes de cualquier `<style>` o `<script>`, con exactamente: `default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'sha256-OVaPb1Xg4e319UWloNbKPvLAsSeTGHPmO8K4zzIRlHk='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`. Sin `unsafe-eval` ni `unsafe-inline` en scripts; ningún `*`.
- **El juego no cambia (FR-8):** documento `version: 7`, clave `livin:datos:v1`; no cambian `catalogo.js`, `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js` ni ningún otro módulo de `src/`; en `poc/` solo cambia `index.html` (dos líneas) y se agrega `test/despliegue.test.js`. Las 463 pruebas anteriores no se modifican.
- **Costo:** $0; ningún servicio fuera de GitHub; ninguna credencial guardada en el repo ni en el flujo.
- **Rendimiento (NFR):** 60 fps o más en el teléfono; primera carga ≤ 2 MB transferidos.
- **Commits:** `<tipo>(012-despliegue-publico): <mensaje>` en inglés, como el historial; rama `feat/012-despliegue-publico`.

**Pre-implementation gates:**
- *Simplicity:* 3 piezas: dos líneas de `index.html`, un flujo de GitHub Actions y una prueba estática. Sin dependencias nuevas en el proyecto; `gitleaks` solo se usa una vez, a mano, fuera del repo. ✓
- *Anti-Abstraction:* el flujo usa las acciones oficiales de Pages directamente; no hay scripts de despliegue propios ni envoltorios. ✓
- *Integration-First:* la prueba estática fija el contrato de `index.html` y del flujo en la Fase 0, antes de tocarlos. ✓

> **Complexity note** (Fase 1, política de contenido): `style-src` permite `'unsafe-inline'`. Motivo: el `<style>` en línea de `index.html` es la fuente que comprueba la prueba de colores de la 011 (`interfaz-estatica.test.js`) y los estilos no ejecutan código; la spec (AC-3.3) solo prohíbe `unsafe-inline` en scripts. El script en línea se permite por su hash en lugar de moverlo a un archivo: conserva exacto el respaldo de 4 s (se ejecuta antes de que Phaser bloquee el análisis) y no crea un script clásico que rompa la regla de módulos ES.

---

## Goal

La PoC publicada en `https://bsoto24.github.io/livin/` por un flujo que solo publica `main` con las pruebas en verde, con Phaser verificado por SRI y una CSP por `<meta>`, el repo público revisado sin secretos y la documentación al día, verificado en escritorio y en el teléfono.

---

## Phase 0: Contracts and Tests First

**Implements:** FR-1, FR-2, FR-3, FR-4, FR-5 (contratos) | **Satisfies:** AC-1.6, AC-2.2 [auto], AC-2.4 [auto], AC-2.5, AC-3.1, AC-3.3, AC-3.8, AC-4.2, AC-5.2
**Files:** `poc/test/despliegue.test.js` (nuevo)
**Interfaces:** Consumes: `poc/index.html`, `poc/src/**/*.js`, `.gitignore` y `git ls-files` tal como están. Produces: fija el contrato que cumplen las Fases 1 y 2: la etiqueta exacta de Phaser con `integrity`, la `<meta>` de CSP con las directivas de Global Constraints, el archivo `.github/workflows/publicar.yml` con los trabajos `pruebas` y `publicar`, y los patrones `.env`, `.env.*`, `*.pem`, `*.key` en `.gitignore`.

Una prueba estática, sin red ni Phaser, con 10 casos; hoy fallan 8 y pasan 2, que quedan como guarda: AC-1.6 (las rutas ya son relativas) y «el único script de terceros es Phaser».

- [ ] Crear `poc/test/despliegue.test.js`:

```js
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
```

- [ ] Run: `cd poc && node --test test/despliegue.test.js` — expect: 2 pass (AC-1.6 y el único script de terceros) y 8 fail (falta la `<meta>`, la `integrity`, `publicar.yml` y los patrones de `.gitignore`).
- [ ] Run: `cd poc && npm test` — expect: las 463 anteriores en verde y las 8 de arriba en rojo.
- [ ] Commit: `test(012-despliegue-publico): fix the contract of the CSP, the Phaser SRI and the publish workflow`

---

## Phase 1: Integridad de Phaser y política de contenido en `index.html`

**Implements:** FR-1, FR-4, FR-5, FR-8 | **Satisfies:** AC-1.6, AC-3.1, AC-3.2, AC-3.3, AC-3.4 (copia local), AC-3.5, AC-3.6, AC-3.7, AC-3.8
**Files:** `poc/index.html`
**Interfaces:** Consumes: el contrato de la Fase 0. Produces: `index.html` con la `<meta>` de CSP y la etiqueta de Phaser con SRI, que la Fase 2 publica tal cual.

Dos líneas de `index.html`; nada más de `poc/` cambia.

- [ ] En `poc/index.html`, insertar justo después de `<meta charset="utf-8">` (línea 4), antes del viewport y del `<style>`:

```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'sha256-OVaPb1Xg4e319UWloNbKPvLAsSeTGHPmO8K4zzIRlHk='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'">
```

- [ ] En `poc/index.html`, reemplazar la línea de Phaser:

```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js"></script>
```

por:

```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js" integrity="sha512-zQK11u7QyhUWLmhK+Kyn4Oac0n2d5+AcuEiCagfm2YrGa2wMrdbj5EJammEmGU7bGnckmRoNTUT29Dl+DaRSlg==" crossorigin="anonymous"></script>
```

  El script en línea del respaldo de 4 s (`<script>setTimeout(function () { document.body.classList.remove('preparando'); }, 4000);</script>`) no se toca: su hash ya está en `script-src`.
- [ ] Run: `cd poc && node --test test/despliegue.test.js` — expect: pasan los 5 casos de `index.html` (AC-1.6, los dos de AC-3.1, el de la política y el del hash del script en línea); siguen en rojo los 5 del flujo y de `.gitignore`.
- [ ] Run: `cd poc && npm test` — expect: las 463 anteriores en verde (incluida `interfaz-estatica.test.js`, AC-3.8).
- [ ] AC-3.2 [manual]: comparar los tres valores y anotarlos para `verification.md`:

```bash
curl -sf https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js | openssl dgst -sha512 -binary | base64
```
```bash
curl -s "https://api.cdnjs.com/libraries/phaser/3.80.1?fields=sri"
```
```bash
grep -o 'integrity="[^"]*"' poc/index.html
```
  Expect: el mismo `zQK11u7…DaRSlg==` en los tres (ya coincidieron el 2026-10-12).
- [ ] Preparar una copia local servida bajo `/livin/` (el mismo subdirectorio que Pages) en el directorio temporal de la sesión, y servirla con `npx --yes serve -l 8081 <tmp>/sitio`:

```bash
rm -rf "$TMPDIR/livin-012" && mkdir -p "$TMPDIR/livin-012/sitio/livin" && cp -R poc/index.html poc/src poc/assets "$TMPDIR/livin-012/sitio/livin/"
```
- [ ] AC-3.4 [nav] (copia local, escritorio): abrir `http://localhost:8081/livin/` en el navegador del panel, jugar una sesión con el hogar de carga completa de la 011 (`test/hogares-de-prueba.js`): caminar, modo edición, las cuatro secciones del menú, un formulario, el historial, un intercambio, personajes caminando. Expect: ninguna violación de CSP ni error de integridad en `read_console_messages`. Si aparece una violación por un recurso propio, se agrega solo la fuente mínima a la directiva afectada, se ajusta la prueba de AC-3.3 y se anota en `verification.md`.
- [ ] AC-3.5 [nav]: en la copia, cambiar un carácter del hash (`zQK11u7` → `zQK11u8`) y recargar. Expect: la consola indica el fallo de integridad de `phaser.min.js` y el mapa no aparece. Restaurar la copia.
- [ ] AC-3.6 [nav]: en la copia, agregar `<script src="https://example.com/x.js"></script>` antes de `src/juego.js` y recargar. Expect: la consola indica la violación de `script-src` y el juego sigue arrancando. Restaurar la copia.
- [ ] AC-3.7 [nav]: en la copia, renombrar `src/juego.js` a `src/juego.js.off` y recargar. Expect: tras 4 s se ve la interfaz (barra inferior), sin violación de CSP del script en línea. Restaurar la copia.
- [ ] Commit: `feat(012-despliegue-publico): load Phaser with SRI and add the CSP meta to index.html`

---

## Phase 2: Flujo de publicación y `.gitignore`

**Implements:** FR-2, FR-3, FR-6 (archivos sensibles) | **Satisfies:** AC-2.1 [auto], AC-2.2 [auto], AC-2.4 [auto], AC-2.5, AC-4.2, AC-5.2
**Files:** `.github/workflows/publicar.yml` (nuevo), `.gitignore`
**Interfaces:** Consumes: el contrato de la Fase 0 y `index.html` de la Fase 1. Produces: el flujo «Publicar PoC» con los trabajos `pruebas` y `publicar` y el entorno `github-pages`, que la Fase 4 dispara.

- [ ] Crear `.github/workflows/publicar.yml`:

```yaml
# Publica la PoC (poc/) en GitHub Pages: las pruebas son la compuerta y solo se publica main (feature 012).
name: Publicar PoC

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  pruebas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - run: npm test
        working-directory: poc

  publicar:
    needs: pruebas
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.despliegue.outputs.page_url }}
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - name: Preparar el sitio (solo index.html, src/ y assets/)
        run: |
          mkdir _sitio
          cp -R poc/index.html poc/src poc/assets _sitio/
      - uses: actions/upload-pages-artifact@v5
        with:
          path: _sitio
      - id: despliegue
        uses: actions/deploy-pages@v5
```

- [ ] Agregar al final de `.gitignore`:

```gitignore
.env
.env.*
*.pem
*.key
```

- [ ] Run: `cd poc && node --test test/despliegue.test.js` — expect: 10 pass.
- [ ] Run: `cd poc && npm test` — expect: 473 pass (463 + 10), 0 fail.
- [ ] Commit: `feat(012-despliegue-publico): add the GitHub Pages workflow gated by the tests`

---

## Phase 3: Documentación y guía de despliegue

**Implements:** FR-6 (documentación de lo público), FR-7 | **Satisfies:** AC-5.3, AC-5.4
**Files:** `docs/specs/012-despliegue-publico/quickstart.md` (nuevo), `.claude/memory/steering/tech-stack.md`, `CLAUDE.md`, `.claude/rules/phaser.md`, `.claude/rules/javascript.md`, `.claude/rules/testing.md`
**Interfaces:** Consumes: lo construido en las Fases 1 y 2 (nombres de archivo, trabajos, valores de la CSP). Produces: la guía que siguen la Fase 4 y quien publique después.

- [ ] Crear `docs/specs/012-despliegue-publico/quickstart.md`:

````markdown
# Guía de despliegue de la PoC (feature 012)

La PoC se publica en **https://bsoto24.github.io/livin/** con GitHub Pages. Decisiones: [ADR de hosting](../../adr/012-hosting-estatico-github-pages.md) y [ADR de seguridad](../../adr/012-seguridad-sin-cabeceras-sri-y-csp.md).

## Qué queda público

- **El repo `bsoto24/livin` completo y todo su historial**: código, `docs/`, `.claude/` y el correo del autor en cada commit. Volver a privado no borra clones, forks ni copias de terceros.
- **El sitio**: solo `poc/index.html`, `poc/src/` y `poc/assets/`. No se publican `poc/test/` ni `poc/package.json`.
- Las partidas **no** salen del navegador de cada persona (almacenamiento local, clave `livin:datos:v1`).

## Cómo se publica

- **Automático:** cada push a `main` dispara el flujo «Publicar PoC» (`.github/workflows/publicar.yml`). El trabajo `pruebas` corre `npm test` en `poc/` con Node 22; solo si pasa, el trabajo `publicar` sube `index.html`, `src/` y `assets/` y los despliega.
- **A mano:** en GitHub, Actions → «Publicar PoC» → Run workflow → rama `main`. O desde la terminal:

```bash
gh workflow run publicar.yml --ref main
```

- Desde otra rama el flujo corre las pruebas pero no publica.
- Seguir la última ejecución:

```bash
gh run watch "$(gh run list --workflow publicar.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

## Cómo volver a una versión anterior

Pages sirve el último despliegue exitoso. Para volver atrás se revierte el commit en `main` y se empuja; el flujo publica la versión revertida:

```bash
git revert <commit> && git push origin main
```

Si se quiere republicar sin cambios (por ejemplo, tras un fallo de GitHub), basta con lanzar el flujo a mano.

## Al subir la versión de Phaser

1. Cambiar la versión en la URL de `poc/index.html` y en el plan (regla de `phaser.md`).
2. Tomar el hash SHA-512 que publica cdnjs y compararlo con el del archivo descargado:

```bash
curl -s "https://api.cdnjs.com/libraries/phaser/<versión>?fields=sri"
```
```bash
curl -sf https://cdnjs.cloudflare.com/ajax/libs/phaser/<versión>/phaser.min.js | openssl dgst -sha512 -binary | base64
```

3. Actualizar `integrity` en `poc/index.html` y `URL_PHASER`/`SRI_PHASER` en `poc/test/despliegue.test.js`.
4. Revisar en el navegador que la consola no muestre violaciones de la política de contenido.

## Al cambiar `index.html`

- Un script en línea nuevo o modificado necesita su hash `'sha256-…'` en `script-src`; si falta, `test/despliegue.test.js` falla e indica el valor exacto.
- Un script, imagen, fuente o conexión de otro origen se bloquea: hay que justificarlo y agregar solo esa fuente a la directiva, con su prueba.

## Limitaciones aceptadas

- **Sin cabeceras HTTP:** Pages no permite configurarlas. La política va en una `<meta>`, que no soporta `frame-ancestors` (la PoC puede incrustarse en otro sitio) ni reportes; tampoco hay HSTS configurable.
- **Origen compartido:** el almacenamiento local pertenece a `bsoto24.github.io`. Cualquier otro sitio publicado bajo esa cuenta podría leer las partidas de Livin. Antes de publicar otro sitio en la cuenta, mover Livin a un dominio propio o a otro hosting.
- **Sin control de acceso:** cualquiera con el enlace puede jugar.
- **Dependencia de cdnjs:** si cdnjs no responde o el archivo no coincide con el hash, el juego no arranca; a los 4 s solo se ve la interfaz.
- **Cambiar la dirección pierde las partidas** guardadas en la anterior.
- **Términos de Pages:** no sirve para un negocio en línea ni un SaaS comercial.
````

- [ ] En `.claude/memory/steering/tech-stack.md`, reemplazar la sección `## Infrastructure`:

```markdown
## Infrastructure
Static hosting on GitHub Pages at https://bsoto24.github.io/livin/ (feature 012, ADR `012-hosting-estatico-github-pages`): the public repo's `.github/workflows/publicar.yml` runs `npm test` in `poc/` and, only on `main`, publishes `poc/index.html`, `poc/src/` and `poc/assets/`. No application server, database or authentication; game data stays in each browser's local storage. Target: Android phone browser, portrait. Phaser loads with SRI and `index.html` carries a CSP `<meta>` (ADR `012-seguridad-sin-cabeceras-sri-y-csp`).
```

- [ ] En `CLAUDE.md`, sección «Project state»: cambiar «features 001 to 011 are implemented and merged into `main` (001 to 011 pushed), with 463 automated tests» por «features 001 to 012 are implemented and merged into `main`, with 473 automated tests», y agregar al final del párrafo de features: «Feature 012 (`012-despliegue-publico`) publishes the PoC at https://bsoto24.github.io/livin/ from the public repo with a GitHub Actions workflow (`.github/workflows/publicar.yml`) gated by the tests; Phaser loads with SRI (SHA-512) and `index.html` has a CSP `<meta>`; see `docs/specs/012-despliegue-publico/quickstart.md`.» En «Commands»: cambiar «(463 passing tests as of feature 011)» por «(473 passing tests as of feature 012)».
- [ ] En `.claude/rules/phaser.md`, reemplazar «- ✓ Load Phaser pinned at 3.80.1 from cdnjs; do not bump without updating the plan.» por «- ✓ Load Phaser pinned at 3.80.1 from cdnjs with `integrity` (SHA-512, the value cdnjs publishes) and `crossorigin="anonymous"`; do not bump without updating the plan, the hash and `test/despliegue.test.js`.»
- [ ] En `.claude/rules/javascript.md`, agregar después de la regla de `index.html`: «- ✓ `index.html` keeps its CSP `<meta>` before any style or script: scripts only from the own origin, cdnjs and the `'sha256-…'` hash of each inline script (no `unsafe-inline`/`unsafe-eval` for scripts); any new origin needs a justification and a test.»
- [ ] En `.claude/rules/testing.md`, agregar: «- ✓ `test/despliegue.test.js` checks statically the Phaser SRI, the CSP `<meta>` (and the hash of each inline script), that no path is root-absolute, the publish workflow (triggers, `needs: pruebas`, main only, minimal permissions, official pinned actions, only `index.html`, `src/` and `assets/` published) and that git tracks no key or credential files.»
- [ ] Run: `cd poc && npm test` — expect: 473 pass.
- [ ] Commit: `docs(012-despliegue-publico): add the deployment guide and update the steering, CLAUDE.md and rules`

---

## Phase 4: Publicación (pasos de la persona responsable)

**Implements:** FR-6, FR-3 (primera publicación) | **Satisfies:** AC-4.1 (hecho), AC-4.3, AC-5.1
**Files:** ninguno del repo (se anota la evidencia en la Fase 5)
**Interfaces:** Consumes: la rama `feat/012-despliegue-publico` con las Fases 0 a 3. Produces: Pages con fuente «GitHub Actions» y la primera publicación desde `main`.

Estado de partida: el repo ya es público y la búsqueda de secretos ya se hizo. Puntos de parada: los pasos marcados **(persona responsable)** los hace quien es dueño del repo en GitHub; el agente no cambia los ajustes de Pages.

- [x] AC-4.1 (hecho el 2026-10-12, después de hacer público el repo): `gitleaks` 8.30.1 (instalado con Homebrew) sobre todo el historial: `gitleaks git -v --log-opts="--all -m" --redact .` → 185 commits escaneados (169 sin merges + 16 merges), «no leaks found»; `gitleaks dir --redact .` sobre el árbol de trabajo → «no leaks found». Se anota en `verification.md`.
- [x] AC-4.3 (visibilidad, hecho por la persona responsable): `gh repo view bsoto24/livin --json visibility` → `PUBLIC`.
- [ ] Repetir la búsqueda con los commits de la feature, antes de integrar:

```bash
gitleaks git --log-opts="--all -m" --redact .
```
  Expect: «no leaks found». Si hubiera un hallazgo: se detiene la fase, se rota la credencial (el repo ya es público) y se anota en `verification.md`.
- [ ] Integrar la rama con `sdd-superpowers:finishing-a-development-branch` (merge a `main`), **sin empujar todavía**.
- [ ] AC-4.3 **(persona responsable)**: Settings → Pages → Build and deployment → Source: cambiar de «Deploy from a branch» a **GitHub Actions**, justo antes del push. Con el cambio, la dirección temporal `…/livin/poc/` puede dejar de funcionar hasta el primer despliegue; el flujo no puede publicar si Pages sigue en modo rama.
- [ ] Empujar `main`:

```bash
git push origin main
```
- [ ] Run: `gh run watch "$(gh run list --workflow publicar.yml --limit 1 --json databaseId --jq '.[0].databaseId')"` — expect: `pruebas` ✓ y `publicar` ✓; la URL del entorno es `https://bsoto24.github.io/livin/`.
- [ ] Comprobar los ajustes:

```bash
gh repo view bsoto24/livin --json visibility --jq .visibility
```
```bash
gh api repos/bsoto24/livin/pages --jq '{build_type, https_enforced, html_url}'
```
  Expect: `PUBLIC`; `build_type: workflow`, `https_enforced: true`, `html_url: https://bsoto24.github.io/livin/`.
- [ ] AC-5.1: lo que sirvía el modo rama ya no se sirve:

```bash
for u in livin/ livin/poc/ livin/poc/package.json livin/poc/test/hogar.test.js livin/CLAUDE.html; do printf "%s  " $u; curl -s -o /dev/null -w '%{http_code}\n' https://bsoto24.github.io/$u; done
```
  Expect: `livin/` → 200; todas las demás → 404.

---

## Phase 5: Integration Verification

**Implements:** All FRs | **Satisfies:** AC-1.1 a AC-1.5, AC-2.1 a AC-2.4 [manual], AC-2.6, AC-3.4 (sitio publicado), AC-5.1 (sitio), AC-6.1 a AC-6.3, NFR (2 MB, $0)
**Files:** `docs/specs/012-despliegue-publico/verification.md` (nuevo)
**Interfaces:** Consumes: el sitio publicado de la Fase 4. Produces: la evidencia de cierre.

- [ ] AC-6.1: `cd poc && npm test` — expect: 473 pass, 0 fail.
- [ ] AC-6.2 [manual]: revisar el diff de la feature sobre `poc/`:

```bash
git diff 280d576..main --stat -- poc/
```
  Expect: solo `poc/index.html` (2 líneas) y `poc/test/despliegue.test.js`.
- [ ] AC-2.1 [nav]: comparar lo servido con `main`:

```bash
curl -sf https://bsoto24.github.io/livin/index.html | diff - poc/index.html && echo IGUAL
```
- [ ] AC-5.1 [nav]: expect `404` en ambos:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://bsoto24.github.io/livin/package.json
```
```bash
curl -s -o /dev/null -w '%{http_code}\n' https://bsoto24.github.io/livin/test/despliegue.test.js
```
- [ ] AC-1.3 [nav]: expect `301` hacia `https://`:

```bash
curl -sI http://bsoto24.github.io/livin/ | grep -iE '^(HTTP|location)'
```
- [ ] AC-1.1, AC-1.4, AC-3.4 [nav] (escritorio, navegador del panel, ventana sin datos del sitio): abrir `https://bsoto24.github.io/livin/`; expect: hogar inicial sin pedir nada; `read_network_requests` sin respuestas de error; `read_console_messages` sin violaciones de CSP ni errores de integridad tras la sesión completa de AC-3.4 (mapa, edición, cuatro secciones del menú, formulario, historial, intercambio, personajes caminando). Anotar el total transferido de la primera carga (NFR ≤ 2 MB).
- [ ] AC-1.5 [nav]: agregar un espacio y una actividad, recargar, cerrar y reabrir; expect: siguen ahí.
- [ ] AC-1.2, AC-6.3 [nav] **(persona responsable, en el teléfono Android en vertical)**: abrir la dirección, cargar el hogar de carga completa de la 011 y jugar la misma sesión; anotar fps y `regen` del indicador. Expect: ≥ 60 fps y `regen` sin empeorar respecto a la 011.
- [ ] AC-2.3 [manual]: `gh workflow run publicar.yml --ref main` y, tras unos segundos, `gh run watch "$(gh run list --workflow publicar.yml --limit 1 --json databaseId --jq '.[0].databaseId')"` — expect: `pruebas` ✓, `publicar` ✓, sin commit nuevo.
- [ ] AC-2.2 y AC-2.4 [manual]: rama de prueba con una prueba en rojo, ejecutada a mano:

```bash
git switch -c test/012-compuerta-roja main
```
```bash
printf "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('compuerta roja (temporal)', () => assert.equal(1, 2));\n" > poc/test/compuerta-roja.test.js && git add poc/test/compuerta-roja.test.js && git commit -m "test(012-despliegue-publico): temporary red test to check the publish gate" && git push -u origin test/012-compuerta-roja
```
```bash
gh workflow run publicar.yml --ref test/012-compuerta-roja
```
  Tras unos segundos, seguirla con `gh run watch "$(gh run list --workflow publicar.yml --limit 1 --json databaseId --jq '.[0].databaseId')"`. Expect: el push a la rama no dispara el flujo (AC-2.4); en la ejecución manual `pruebas` ✗ y `publicar` omitido; `curl … | diff - poc/index.html` sigue igual a `main`. Limpiar:

```bash
git switch main && git branch -D test/012-compuerta-roja && git push origin --delete test/012-compuerta-roja
```
- [ ] AC-2.6 [manual]: `gh workflow run publicar.yml --ref main`; cuando el trabajo `publicar` esté en «deploy», `gh run cancel <id>`. Expect: el sitio sigue respondiendo `200` en `index.html`, `src/juego.js` y `assets/fonts/silkscreen-latin.woff2`, con el mismo contenido que antes. Relanzar el flujo a mano y confirmar ✓.
- [ ] NFR costo [manual] **(persona responsable)**: Settings → Billing → uso del mes de Actions y Pages en $0.
- [ ] Escribir `docs/specs/012-despliegue-publico/verification.md` con: fecha; resultado de `npm test`; salida de `gitleaks` (la del 2026-10-12 y la repetida en la Fase 4), dejando constancia de que el repo se hizo público antes de la primera búsqueda; los tres hashes de AC-3.2; las comprobaciones con `curl` (AC-1.3, AC-2.1, AC-5.1); las ejecuciones del flujo (enlaces de `gh run`) de AC-2.2, AC-2.3, AC-2.4 y AC-2.6; consola y red de escritorio (AC-1.1, AC-1.4, AC-1.5, AC-3.4 a AC-3.7) con el total transferido; fps y `regen` del teléfono (AC-1.2, AC-6.3); visibilidad y ajustes de Pages (AC-4.3); costo; y una tabla AC → resultado.
- [ ] Commit: `docs(012-despliegue-publico): record the verification of the public deployment`

---

## Quickstart Validation

1. `cd poc && npm test` → 473 pass.
2. `gh run list --workflow publicar.yml --limit 1` → la última ejecución en `main` terminó en `success`.
3. Abrir `https://bsoto24.github.io/livin/` en el teléfono Android en vertical → se ve el hogar y se camina con la cruceta.
4. En escritorio, la consola del sitio no muestra violaciones de CSP ni errores de integridad.
5. `curl -s -o /dev/null -w '%{http_code}\n' https://bsoto24.github.io/livin/package.json` → `404`.

## Cobertura de la spec

| Requisito | Fases |
|-----------|-------|
| FR-1 Dirección pública | 0 (AC-1.6), 1, 5 |
| FR-2 Contenido publicado | 0, 2, 5 |
| FR-3 Publicación con compuerta | 0, 2, 4, 5 |
| FR-4 Integridad de Phaser | 0, 1 |
| FR-5 Política de contenido | 0, 1, 5 |
| FR-6 Repo público | 2 (`.gitignore`), 3 (guía), 4 (búsqueda de secretos ya hecha y repetida) |
| FR-7 Documentación | 3, 5 |
| FR-8 El juego no cambia | todas (suite en verde), 5 (AC-6.2) |

Todos los AC de la spec (AC-1.1 a AC-6.3) aparecen en al menos una fase.
