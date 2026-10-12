# Verificación de la feature 012: Despliegue público de la PoC

**Fecha:** 2026-10-12
**Spec:** [spec.md](spec.md) (v1.0.2) · **Plan:** [plan.md](plan.md) · **Guía:** [quickstart.md](quickstart.md)
**Estado:** **casi completa.** Automática, escritorio y flujo de publicación verificados sobre el sitio real; quedan **dos comprobaciones de la persona responsable**: el teléfono Android (AC-1.2 y AC-6.3) y el uso de facturación en $0 (ver «Pendiente»).
**Commit publicado:** `e188b7b` (merge de la 012 en `main`). Sitio: https://bsoto24.github.io/livin/

---

## Automática

| Comprobación | Resultado |
|--------------|-----------|
| `cd poc && npm test` en `main` (`e188b7b`) | 473 pruebas, 473 pasan, 0 fallan (463 anteriores + 10 de `test/despliegue.test.js`) |
| El flujo ejecutó las mismas pruebas en GitHub (Node 22) | `pruebas` ✓ en 21 s (ejecución 38210261150) |
| AC-6.2: `git diff 280d576..main --stat -- poc/` | solo `poc/index.html` (+2 −1) y `poc/test/despliegue.test.js` (+127); ningún archivo de `poc/src/` |

## AC-3.2: el hash de Phaser coincide en los tres lugares

| Fuente | Valor |
|--------|-------|
| Archivo descargado de cdnjs (`openssl dgst -sha512 -binary \| base64`) | `zQK11u7QyhUWLmhK+Kyn4Oac0n2d5+AcuEiCagfm2YrGa2wMrdbj5EJammEmGU7bGnckmRoNTUT29Dl+DaRSlg==` |
| API de cdnjs (`/libraries/phaser/3.80.1?fields=sri`) | `sha512-zQK11u7…DaRSlg==` |
| `integrity` en `poc/index.html` | `sha512-zQK11u7…DaRSlg==` |

Se usó SHA-512 en lugar de SHA-384 porque cdnjs solo publica ese algoritmo (spec 1.0.1).

## AC-4.1 y AC-4.2: secretos

`gitleaks` 8.30.1 (instalado con Homebrew) con `gitleaks git --log-opts="--all -m" --redact .`:

| Cuándo | Commits escaneados | Resultado |
|--------|-------------------|-----------|
| 2026-10-12, antes de la feature | 185 (169 sin merges + 16 merges) | no leaks found |
| 2026-10-12, con los commits de la feature | 192 | no leaks found |
| 2026-10-12, tras publicar | 193 | no leaks found |

`gitleaks dir --redact .` sobre el árbol de trabajo: no leaks found. AC-4.2 lo cubre `despliegue.test.js:121`.

**Desvío registrado:** el repo se hizo público **antes** de la primera búsqueda (la spec en FR-6 y AC-4.1 pedía lo contrario). La búsqueda se hizo el mismo día, justo después de hacerlo público, y no halló nada; no hubo credenciales que rotar.

## AC-4.3: ajustes de GitHub

| Ajuste | Valor |
|--------|-------|
| Visibilidad (`gh repo view --json visibility`) | `PUBLIC` |
| Pages (`gh api repos/bsoto24/livin/pages`) | `build_type: workflow`, `https_enforced: true`, `html_url: https://bsoto24.github.io/livin/` |

Antes del cambio, Pages estaba en `build_type: legacy` (`main`, `/`): servía el repo entero y `…/livin/` daba 404.

## Sitio publicado: HTTP (AC-1.3, AC-2.1, AC-5.1)

| URL | Respuesta |
|-----|-----------|
| `/livin/`, `/livin/index.html`, `/livin/src/juego.js`, `/livin/assets/fonts/silkscreen-latin.woff2` | 200 |
| `/livin/poc/`, `/livin/poc/package.json`, `/livin/poc/test/hogar.test.js`, `/livin/package.json`, `/livin/test/despliegue.test.js`, `/livin/CLAUDE.html` | 404 (con el modo rama anterior daban 200) |
| `http://bsoto24.github.io/livin/` | 301 → `https://bsoto24.github.io/livin/` |
| `curl …/livin/index.html \| diff - poc/index.html` | idéntico |

## Flujo de publicación (AC-2.1 a AC-2.6)

| AC | Cómo se probó | Resultado |
|----|---------------|-----------|
| AC-2.1 | push de `main` (`e188b7b`) | ejecución 38210261150: `pruebas` ✓ 21 s, `publicar` ✓ 1 min 22 s; el sitio sirve el mismo `index.html` |
| AC-2.3 | `gh workflow run publicar.yml --ref main`, sin commit nuevo | ejecución 38210520545 (`workflow_dispatch`, mismo SHA `e188b7b`): `success` |
| AC-2.2 | rama temporal `test/012-compuerta-roja` con una prueba en rojo, flujo lanzado a mano sobre ella | ejecución 38210710058: `pruebas` **failure**, `publicar` **skipped**; el sitio quedó igual a `main` |
| AC-2.4 | el push de esa rama a GitHub | **no** disparó ninguna ejecución (la lista de ejecuciones no cambió); la rama temporal se borró local y remotamente |
| AC-2.5 | `despliegue.test.js:100` (permisos mínimos, solo `actions/*@vN`, `persist-credentials: false`) | ✓ |
| AC-2.6 | ejecución manual 38210599923 cancelada cuando el paso `deploy-pages` estaba `in_progress` | `cancelled`; el sitio siguió sirviendo `index.html` y `src/juego.js` idénticos a `main` y todo en 200 |

## Escritorio, sitio publicado (AC-1.1, AC-1.4, AC-1.5, AC-3.4)

Navegador del panel de la app, ventana sin datos previos de ese origen:

- **AC-1.1:** se muestra el mapa del hogar; 31 solicitudes (`index.html`, 28 módulos, fuente y Phaser) y las de la red de la página, todas con respuesta 200; la consola solo registra el log de Phaser 3.80.1 (el SRI aceptó el archivo) y ningún error.
- **AC-1.4:** primera carga sin partida: el hogar inicial de siempre («Personaje 1»), sin pedir cuenta, contraseña ni aceptación.
- **AC-1.5:** se agregó un Comedor (el mapa se regeneró, `regen` ≈ 2 ms) y se recargó la página: `livin:datos:v1` sigue en `version: 7` con 5 espacios, uno de ellos el comedor.
- **AC-3.4:** sesión con el mapa, las secciones Espacios y Familia, el modo edición (agregar un espacio); consola sin errores ni violaciones de CSP ni de integridad. Fotogramas por segundo del indicador: 97 a 118 fps.
- **NFR, primera carga:** 98 KB transferidos por red con Phaser ya en caché del navegador, y **1,39 MB descomprimidos en total** (1.458.976 bytes), por debajo de los 2 MB incluso sin contar la compresión ni la caché. Orígenes de la página: solo `bsoto24.github.io` y `cdnjs.cloudflare.com`.

**No ejercitado en el sitio publicado:** los flujos de intercambio, historial con datos y estrellas de calificación (hacen falta dos jugadores con actividades hechas). El hogar de carga completa no se puede cargar ahí con `import('/test/hogares-de-prueba.js')`, como se hacía en la 011, porque `test/` ya no se publica (es lo que pide FR-2); el JSON de ese hogar pesa 185 KB y se puede pegar con `localStorage.setItem` desde la consola si se quiere repetir.

## Copia local servida bajo `/livin/` (antes de publicar): AC-3.4 a AC-3.7

- **AC-3.4:** sesión completa en el navegador del panel: carga, drawers de Familia (avatar como imagen `data:`), Actividades y Espacios, formulario «Nueva actividad» (iconos, chips y círculos), guardar una actividad (aparece en la lista y la burbuja en el mapa), modo edición (agregar un Comedor), pestaña «Hechas». Sin errores ni violaciones en la consola. La pestaña Intercambios no hace nada con un solo jugador (comportamiento de la 005).
- **AC-3.5:** con un carácter del hash cambiado (`zQK11u8…`): «Failed to find a valid digest in the 'integrity' attribute for resource 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js' … The resource has been blocked.» y «Uncaught ReferenceError: Phaser is not defined»; el mapa no aparece.
- **AC-3.6:** con `<script src="https://example.com/x.js">` añadido: «Loading the script 'https://example.com/x.js' violates the following Content Security Policy directive: "script-src 'self' https://cdnjs.cloudflare.com 'sha256-OVaPb…'"… The action has been blocked.»; el juego arranca normal.
- **AC-3.7:** con el módulo principal inexistente: pantalla en blanco al inicio y, a los 4 s, aparece la interfaz sin estilo (cruceta y botón «Juega»); sin violaciones de CSP del script en línea, cuyo hash está permitido.
- Se comparó la misma partida sin CSP (`index.html` de `main` anterior) y con CSP: el mundo se dibuja igual. Un primer intento mostró el mapa oscuro porque el origen de la copia local tenía una partida antigua (formato v2) de otra sesión con la posición fuera del mapa; no era la política.

## Documentación (AC-5.3, AC-5.4)

`tech-stack.md` ya no dice «Infraestructura: ninguna»; `CLAUDE.md` indica la dirección pública, el flujo y las 473 pruebas; las reglas de Phaser, JavaScript y pruebas recogen el SRI, la CSP y `despliegue.test.js`; la guía [quickstart.md](quickstart.md) cubre qué queda público, cómo publicar y volver atrás, la configuración de Pages, la subida de versión de Phaser, los cambios en `index.html` y las limitaciones aceptadas.

## Matriz de criterios

| AC | Resultado |
|----|-----------|
| AC-1.1 | ✓ escritorio, sitio publicado |
| AC-1.2 | ⏳ pendiente: teléfono Android en vertical (persona responsable) |
| AC-1.3 | ✓ 301 a HTTPS |
| AC-1.4, AC-1.5 | ✓ escritorio, sitio publicado |
| AC-1.6 | ✓ `despliegue.test.js:33` |
| AC-2.1 a AC-2.6 | ✓ ver «Flujo de publicación» |
| AC-3.1, AC-3.3, AC-3.8 | ✓ `despliegue.test.js:44`, `:48`, `:55`, `:74` |
| AC-3.2 | ✓ tres hashes iguales |
| AC-3.4 | ✓ copia local y sitio publicado en escritorio, con la salvedad de arriba (intercambio y estrellas no ejercitados) |
| AC-3.5, AC-3.6, AC-3.7 | ✓ copia local |
| AC-4.1 | ✓ sin hallazgos, con el desvío de orden |
| AC-4.2, AC-4.3 | ✓ |
| AC-5.1 | ✓ 404 en `package.json` y `test/` |
| AC-5.2 | ✓ `despliegue.test.js:114` y el paquete del flujo (ejecución 38210261150) |
| AC-5.3, AC-5.4 | ✓ |
| AC-6.1, AC-6.2 | ✓ |
| AC-6.3 | ⏳ pendiente: fps y `regen` en el teléfono (ver nota) |
| NFR: primera carga ≤ 2 MB | ✓ 1,39 MB descomprimidos |
| NFR: costo $0 | ⏳ pendiente: confirmar en Settings → Billing (persona responsable); el flujo solo usa Actions y Pages de un repo público |

## Pendiente (persona responsable)

1. **Teléfono Android en vertical (AC-1.2, AC-6.3):** abrir https://bsoto24.github.io/livin/, jugar una sesión (caminar, menú, editor, un formulario, historial) y anotar fps y `regen` del indicador de la esquina superior izquierda. Nota sobre AC-6.3: la carga completa de la 011 ya no se puede cargar desde `/test/` en el sitio publicado; si se quiere medirla en el teléfono hay que pegar el JSON por la consola de un navegador con acceso a ella o seguir midiéndola con `npm start` por la red local, como en la 011 (79 fps, `regen` 0,0 ms). El código de `src/` no cambió en esta feature.
2. **Costo $0:** revisar en GitHub → Settings → Billing que el uso de Actions y Pages del mes está en $0.
