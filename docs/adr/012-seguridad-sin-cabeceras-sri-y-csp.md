# ADR-012-seguridad-sin-cabeceras-sri-y-csp: Seguridad básica sin cabeceras HTTP: SRI en Phaser y CSP por `<meta>`

**Status:** Accepted
**Date:** 2026-10-12
**Feature:** 012-despliegue-publico

## Context

La PoC se publica en GitHub Pages ([ADR de hosting](012-hosting-estatico-github-pages.md)), que **no permite configurar cabeceras HTTP**. Eso deja fuera una `Content-Security-Policy` real y cabeceras como `X-Content-Type-Options` o `frame-ancestors`. El PRD pide «seguridad básica» al menor costo.

Superficie de ataque real de la PoC (verificada en `poc/index.html`):
- Carga **un script de terceros**: Phaser 3.80.1 desde `cdnjs.cloudflare.com`, sin verificación de integridad. Si ese CDN se viera comprometido, el código malicioso correría en el origen de la PoC y podría leer o modificar el `localStorage` de quien juegue (clave `livin:datos:v1`).
- Tiene un `<script>` en línea (`setTimeout` que quita la clase `preparando` tras 4 s) y estilos en línea en `index.html`.
- La fuente Silkscreen y el resto del código son locales (`assets/fonts/`, `src/`).
- No hay formularios que envíen datos a un servidor, ni `fetch` a terceros, ni cuentas; los datos viven solo en el navegador del jugador.

Restricción de proyecto: la regla vigente es «la única dependencia externa es Phaser, fijo en 3.80.1 desde cdnjs» (`.claude/rules/javascript.md` y `phaser.md`).

## Options Considered

### Option A: SRI sobre el script de cdnjs, más CSP por `<meta http-equiv>`

Se añaden `integrity="sha512-..."` (SHA-512, el algoritmo con el que cdnjs publica el hash de `phaser.min.js` 3.80.1; corregido el 2026-10-12, antes decía SHA-384) y `crossorigin="anonymous"` al `<script>` de Phaser (el hash se calcula descargando el archivo y se contrasta con el que publica cdnjs). Se agrega una política CSP por `<meta>` que limita `script-src` a `'self'` y `cdnjs.cloudflare.com`, `img-src` a `'self' data: blob:` y `font-src` a `'self'`. El script en línea se mueve a un archivo o se permite por hash en lugar de usar `'unsafe-inline'`.

**Pros:** el navegador rechaza Phaser si el archivo cambia; la CSP acota de dónde puede venir código; son cambios pequeños en `index.html`, sin sumar peso al repo; se mantiene la regla de Phaser fijo en 3.80.1 desde cdnjs.
**Cons:** la CSP por `<meta>` es menos completa que una cabecera (no soporta `frame-ancestors`, ni `report-uri`, ni `sandbox`) y solo se aplica desde el punto en que el navegador procesa la etiqueta; hay que probar en un navegador que Phaser (creación de `blob:` y `data:`, estilos en línea) no se rompa; si cdnjs reemplazara legítimamente el archivo (no debería con una versión fija), la carga fallaría y habría que actualizar el hash.

### Option B: Copiar `phaser.min.js` al repo y servirlo desde el mismo origen

Se versiona el archivo (≈ 1,2 MB) en `poc/` y se elimina cdnjs de la página; la CSP puede ser `script-src 'self'`.

**Pros:** elimina la dependencia de un tercero y la posibilidad de que el CDN falle o sea comprometido; la CSP queda más estricta.
**Cons:** agrega un archivo grande al repo; obliga a cambiar la regla del proyecto que fija cdnjs como origen de Phaser; hay que mantener la copia (aunque con la versión fija esto es mínimo).

### Option C: Dejarlo como está

Sin SRI ni CSP.

**Pros:** cero trabajo.
**Cons:** deja sin protección el único script de terceros en una página que guarda datos del jugador en `localStorage`.

## Decision

**We chose Option A** porque da la mayor protección por el menor costo, cumple «seguridad básica a costo mínimo» del PRD y no obliga a cambiar la regla de Phaser desde cdnjs. SRI cubre el único riesgo concreto de la PoC (que el script de un tercero cambie sin que nadie lo note) y la CSP limita el daño de cualquier otra inyección. Se descartó B porque su ventaja adicional (no depender de cdnjs) no justifica 1,2 MB en el repo ni cambiar la regla del proyecto para una PoC desechable, y C porque deja el riesgo abierto sin ahorro real.

## Consequences

**Más fácil:** el cambio entra en `index.html` y se verifica con la consola del navegador (sin errores de CSP ni de SRI); una prueba negativa (alterar el hash) demuestra que el navegador rechaza el script.

**Más difícil / a vigilar:**
- **Limitaciones aceptadas y documentadas:** sin `frame-ancestors` (la PoC podría incrustarse en el marco de otro sitio), sin HSTS configurable ni `X-Content-Type-Options` (Pages ya sirve HTTPS), y la CSP por `<meta>` no reporta violaciones.
- **El `localStorage` es por origen** (`bsoto24.github.io`): la CSP no impide que otro sitio bajo la misma cuenta lo lea. Ver las consecuencias del [ADR de hosting](012-hosting-estatico-github-pages.md).
- **Cada cambio en `index.html` debe respetar la CSP:** un script o estilo en línea nuevo se bloquea. Conviene una prueba estática que verifique que `index.html` mantiene la `<meta>` de CSP y el atributo `integrity` en el script de Phaser.
- **Subir la versión de Phaser** exige recalcular el hash y revisar la CSP, además de actualizar el plan (regla ya existente: no cambiar la versión sin actualizarlo).
- Si el proyecto migra a un hosting con cabeceras (por ejemplo Cloudflare Pages con `_headers`), esta decisión se reemplaza por una CSP en cabecera, y el `<meta>` pasa a ser redundante.
