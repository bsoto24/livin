# PRD: Despliegue público de la PoC

**Date:** 2026-10-12
**Feature:** 012-despliegue-publico

## Problem

La PoC de Livin (features 001 a 011) solo se puede jugar en la máquina de desarrollo (`npm start`, o el teléfono dentro de la misma red local). No hay forma de **mostrarla a otras personas ni de jugarla desde un teléfono cualquiera** sin que quien la desarrolla tenga el servidor encendido. Quien quiere enseñar el producto (familia, posibles usuarios, interesados) no puede compartir un enlace.

Hasta ahora el proyecto no tenía infraestructura: el steering dice «Infraestructura: ninguna» (local-first, un dispositivo, sin servidor ni cuentas). Esta es la primera decisión de despliegue, y debe respetar dos restricciones del responsable del producto: **minimizar costos** y **seguridad básica**.

## Users & Context

**Usuarios:**
- **Quien muestra la PoC** (el responsable del producto): quiere mandar un enlace y que funcione en cualquier teléfono, sin encender nada.
- **Quien la juega** (familia, invitados, interesados): abre el enlace en el navegador del teléfono (Android, en vertical), sin crear cuenta ni instalar nada.

**Contexto técnico (verificado en el repo):**
- La PoC es **100 % estática**: `poc/index.html`, módulos ES en `poc/src/`, una fuente local en `poc/assets/` (≈ 316 KB en total) y Phaser 3.80.1 desde cdnjs. No hay servidor de aplicación ni base de datos.
- Los datos de cada jugador viven en el `localStorage` de **su propio navegador**; lo que juega una persona no lo ve nadie más, y no hay datos de usuarios en el servidor.
- Todas las rutas son relativas, así que la PoC funciona bajo un subdirectorio.
- El repo `bsoto24/livin` es privado; la PoC está en `poc/`, no en la raíz. El código tiene 459 pruebas automáticas (`npm test` en `poc/`, sin dependencias, unos segundos).

**Decisiones del brainstorm (responsable del producto):**
- Acceso **público con el enlace**, sin autenticación.
- **Subdominio gratis** de la plataforma, sin dominio propio por ahora.
- Plataforma **GitHub Pages**, haciendo **público el repo** completo (se acepta que el correo del autor en los 185 commits, `docs/` y `.claude/` queden visibles).
- Phaser se mantiene en cdnjs, con **SRI** y una **CSP por `<meta>`**.
- Publicar **automáticamente con cada push a `main`** (más un botón manual), con las pruebas como compuerta.

## Goals

1. Publicar la PoC en una URL pública estable con HTTPS: `https://bsoto24.github.io/livin/`.
2. Que el costo mensual sea **$0**.
3. Que cada versión de `main` con las pruebas en verde se publique sola, y que una con pruebas rotas **no** se publique.
4. Aplicar la seguridad básica posible sin cabeceras HTTP: integridad verificada en el script de terceros (Phaser) y una política CSP por `<meta>`.
5. Dejar documentado qué queda público, qué limitaciones de seguridad se aceptan y cómo se publica, para que el siguiente cambio de hosting no parta de cero.
6. Mantener el juego funcionando igual que en local: se puede jugar en un Android en vertical a 60 fps.

## Non-Goals

- No se agrega servidor de aplicación, base de datos, cuentas ni autenticación.
- No se restringe el acceso (cualquiera con el enlace puede jugar).
- No se copian las partidas a la nube ni se sincroniza entre dispositivos.
- No se cambia el comportamiento del juego, su modelo de datos ni el formato guardado (`version: 7`).
- No se compra ni configura un dominio propio.
- No se publican `test/` ni `package.json` en el sitio.

## Success Criteria

1. Abrir `https://bsoto24.github.io/livin/` en un teléfono Android en vertical carga el juego y se puede jugar a 60 fps o más, con el mismo aspecto que en local.
2. Un push a `main` con una prueba fallando **no** despliega; con todas en verde, sí, sin pasos manuales. El botón manual del workflow también publica.
3. La consola del navegador **no muestra errores de CSP ni de SRI** en la primera carga ni durante una sesión de juego normal (mapa, editor, menú y formularios, historial).
4. Prueba negativa: si se altera el hash de integridad de Phaser, el navegador rechaza el script y el juego no arranca (queda demostrado que el SRI está activo).
5. El sitio publicado contiene solo lo necesario para jugar (`index.html`, `src/`, `assets/`), sin `test/` ni `package.json`.
6. El costo mensual verificado es de **$0** (sin cuenta de pago ni servicio nuevo).
7. Antes de cambiar la visibilidad del repo se ejecutó una búsqueda de secretos con una herramienta dedicada sobre todo el historial, sin hallazgos (o con los hallazgos resueltos).
8. Quedan actualizados el steering (`tech-stack.md`, que decía «Infraestructura: ninguna») y la nota correspondiente de `CLAUDE.md`.

## Architecture Decisions

- [Hosting estático en GitHub Pages desde un repo público](../../adr/012-hosting-estatico-github-pages.md) — se publica `poc/` con un workflow de GitHub Actions (pruebas como compuerta) en `bsoto24.github.io/livin/`, a costo $0, aceptando que el repo y su historial sean públicos.
- [Seguridad básica sin cabeceras: SRI y CSP por `<meta>`](../../adr/012-seguridad-sin-cabeceras-sri-y-csp.md) — integridad verificada en Phaser desde cdnjs y política CSP por etiqueta, documentando las limitaciones por no poder usar cabeceras HTTP.

**Decisiones menores, sin ADR (fáciles de cambiar):**
- **Disparador del despliegue:** push a `main` más un botón manual (`workflow_dispatch`). Cambiarlo a «solo manual» o «por etiqueta» es editar un archivo.
- **Subdominio gratis** `bsoto24.github.io/livin/` sin dominio propio. Pasar a un dominio propio después es una configuración de Pages, pero las partidas guardadas por origen no se trasladan (ver el ADR de hosting).

## Out of Scope

- Dominio propio, analítica, PWA o modo sin conexión.
- Copia de partidas en la nube y multiusuario con servidor.
- Control de acceso (contraseña, correo autorizado, Cloudflare Access): descartado al elegir acceso público; si se necesita después, exige migrar de hosting.
- Reescribir el historial de git para ocultar el correo del autor (se evaluó y se aceptó dejarlo público).
- Copiar Phaser al repo para eliminar la dependencia de cdnjs (se evaluó y se descartó a favor de SRI).
- Publicar otras ramas, entornos de prueba o vistas previas por pull request.
