# ADR-012-hosting-estatico-github-pages: La PoC se publica como sitio estático en GitHub Pages desde un repo público

**Status:** Accepted
**Date:** 2026-10-12
**Feature:** 012-despliegue-publico

## Context

La PoC (features 001 a 011) debe poder jugarse y mostrarse a otras personas desde un enlace, con el menor costo posible y seguridad básica. Es la primera decisión de infraestructura del proyecto: hasta ahora el steering decía «Infraestructura: ninguna» (local-first, un dispositivo, sin servidor ni cuentas).

Hechos que pesan (verificados en el repo):
- La PoC es **100 % estática**: `poc/index.html`, módulos ES en `poc/src/`, una fuente en `poc/assets/` (≈ 316 KB en total) y Phaser 3.80.1 desde cdnjs. Todas las rutas son relativas, así que funciona bajo un subdirectorio como `/livin/`.
- Los datos del jugador viven en el `localStorage` de su navegador (clave `livin:datos:v1`). No hay datos de usuarios en el servidor.
- El repo `bsoto24/livin` es **privado**. La PoC vive en `poc/`, no en la raíz.
- Decisiones del brainstorm: acceso **público con el enlace** (sin autenticación), **subdominio gratis** de la plataforma (sin dominio propio), costo objetivo **$0**, y el responsable del producto decidió **hacer público el repo** y usar GitHub Pages.
- Límites de GitHub Pages (documentación oficial, consultada el 2026-10-12): sitio publicado hasta 1 GB, ancho de banda con límite blando de 100 GB al mes, despliegue con tiempo máximo de 10 minutos, y el límite de 10 builds por hora no aplica cuando se publica con un workflow propio de GitHub Actions. Uso prohibido: alojar gratis un negocio en línea, comercio electrónico o SaaS comercial, y manejar transacciones sensibles (contraseñas, tarjetas). La PoC no hace ninguna de las dos cosas.
- Con la opción «desplegar desde una rama», Pages solo publica la raíz (`/`) o `/docs`; para publicar `poc/` hace falta un workflow de Actions.

## Options Considered

### Option A: GitHub Pages con repo público, publicado por un workflow de GitHub Actions

El repo pasa a ser público. Un workflow corre `npm test` en `poc/` y, si pasa, sube la carpeta `poc/` (sin `test/` ni `package.json`) como artefacto de Pages. Se dispara con cada push a `main` y con un botón manual. URL: `https://bsoto24.github.io/livin/`.

**Pros:** $0 de forma sostenida (en repos públicos Pages y Actions son gratuitos; el límite de 10 builds por hora no aplica con workflow propio); HTTPS automático; despliegue en el mismo lugar donde ya está el código, sin cuenta ni servicio nuevo; no hay que mover nada del repo; las pruebas pueden frenar un despliegue roto; 100 GB al mes de tráfico blando es holgado para un sitio de ≈ 316 KB más Phaser desde cdnjs.
**Cons:** obliga a hacer público el repo, con su historial completo (el correo del autor en 185 commits, `docs/` y `.claude/`); no permite configurar cabeceras HTTP (ver [ADR-012 de seguridad](012-seguridad-sin-cabeceras-sri-y-csp.md)); el `localStorage` es por origen (`bsoto24.github.io`), así que se comparte con cualquier otro sitio que se publique bajo la misma cuenta; no hay control de acceso posible.

### Option B: Cloudflare Pages desde el repo privado

Cuenta de Cloudflare conectada al repo privado; subdominio `*.pages.dev`; carpeta de salida `poc/`.

**Pros:** el repo puede seguir privado; permite un archivo `_headers` con CSP y otras cabeceras reales; el contenido estático no tiene tope de tráfico en el plan gratuito según la documentación comercial de Cloudflare (no se verificó en esta sesión); abre la puerta a Cloudflare Access si más adelante se quiere restringir el acceso.
**Cons:** agrega una cuenta y un servicio nuevos que mantener; el responsable del producto ya decidió no seguir por este camino.

### Option C: Netlify o Vercel

Conectar el repo privado a Netlify (`*.netlify.app`) o a Vercel (`*.vercel.app`).

**Pros:** repo privado; despliegue por Git sencillo; cabeceras configurables.
**Cons:** los planes gratuitos tienen topes de uso y, en el caso de Vercel Hobby, están pensados para uso no comercial (no se verificó el detalle vigente en esta sesión); dependencia de un servicio más sin ventaja clara sobre Cloudflare.

### Option D: Repo público nuevo solo con la PoC

Mantener este repo privado y crear otro, público, que contenga solo `poc/`, publicado con Pages desde la rama.

**Pros:** `docs/`, `.claude/` y el historial siguen privados; Pages publica directo desde la raíz sin workflow.
**Cons:** hay que sincronizar dos repos; se pierde la trazabilidad entre la PoC publicada y su historial; las pruebas ya no frenan un despliegue a menos que se repliquen.

## Decision

**We chose Option A** porque cumple el costo de $0 y la ausencia de cuentas nuevas pedidos en el PRD, y el responsable del producto aceptó que el repo completo sea público (incluidos el correo del autor y `docs/`). El workflow de Actions resuelve que la PoC esté en `poc/`, y permite que la suite de 463 pruebas actúe como compuerta antes de publicar. Se descartaron B y C porque añaden una cuenta y un servicio sin que ninguna de sus ventajas (repo privado, cabeceras reales) sea un requisito de esta feature, y D porque duplica el mantenimiento.

## Consequences

**Más fácil:** compartir un enlace estable (`https://bsoto24.github.io/livin/`); publicar con un merge a `main`; no pagar nada; dejar el proceso SDD visible como portafolio.

**Más difícil / a vigilar:**
- **Todo el repo y su historial son públicos de forma práctica irreversible:** volver a privado no borra clones, forks ni archivos ya copiados por terceros. Antes de cambiar la visibilidad hay que repetir la búsqueda de secretos con una herramienta dedicada (por ejemplo `gitleaks`).
- **Aislamiento de datos por origen:** el `localStorage` pertenece a `bsoto24.github.io`. Otro sitio publicado bajo la misma cuenta podría leer las partidas de Livin. Mientras no haya otros sitios en la cuenta el riesgo es bajo; si los hay, hay que cambiar a un dominio propio o a otra plataforma.
- **Sin autenticación posible:** si más adelante hace falta restringir el acceso, esta opción no lo permite y habría que migrar (B con Cloudflare Access sería el camino).
- **Cambiar la URL pierde las partidas guardadas** de quien ya jugó, porque el `localStorage` no viaja entre orígenes.
- **Términos de uso:** si el producto se vuelve comercial (por ejemplo, un SaaS), Pages deja de ser un hosting permitido para esa parte.
- Hay que actualizar `.claude/memory/steering/tech-stack.md` (la línea «Infraestructura: ninguna») y la nota correspondiente de `CLAUDE.md`.

Si este ADR se reemplaza por otro hosting, hay que revisar el [ADR de seguridad](012-seguridad-sin-cabeceras-sri-y-csp.md), porque sus limitaciones nacen de no poder usar cabeceras HTTP.
