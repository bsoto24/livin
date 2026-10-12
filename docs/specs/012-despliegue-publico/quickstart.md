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

- Un push a una rama que no es `main` no dispara el flujo; si se lanza a mano desde otra rama, corre las pruebas pero no publica.
- Seguir la última ejecución:

```bash
gh run watch "$(gh run list --workflow publicar.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

## Configuración de Pages

En Settings → Pages → Build and deployment, la fuente (Source) debe ser **GitHub Actions**. Con «Deploy from a branch» Pages solo ofrece publicar `/` o `/docs`, y como el `index.html` está en `poc/` el sitio da 404 (o sirve el repo entero, con `test/` y `package.json`). Comprobación:

```bash
gh api repos/bsoto24/livin/pages --jq '{build_type, https_enforced, html_url}'
```

Esperado: `build_type: workflow`, `https_enforced: true`, `html_url: https://bsoto24.github.io/livin/`.

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
