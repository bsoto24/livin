# Feature 012: Despliegue público de la PoC

**Status:** Approved
**Version:** 1.0.1
**Created:** 2026-10-12
**Last Updated:** 2026-10-12
**Branch:** `feat/012-despliegue-publico`
**Source:** [prd.md](prd.md) · [ADR hosting estático en GitHub Pages desde un repo público](../../adr/012-hosting-estatico-github-pages.md) · [ADR seguridad básica sin cabeceras: SRI y CSP por `<meta>`](../../adr/012-seguridad-sin-cabeceras-sri-y-csp.md) · se apoya en la [spec 007](../007-menu-y-formularios-simples/spec.md) (v1.0.0) y la [spec 011](../011-iconos-propios-y-recolor/spec.md) (v2.0.0) por la carga de `index.html` y su respaldo de 4 s

Los criterios llevan al final la forma de comprobarlos: **[auto]** (prueba automática sin red, sin Phaser ni pantalla), **[nav]** (se mira o mide en un navegador de escritorio y en el teléfono Android sobre el sitio publicado o una copia local) o **[manual]** (lo hace o lo confirma la persona responsable del producto en GitHub, y queda registrado en `verification.md`).

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-10-12 | Spec inicial aprobada |
| 1.0.1 | 2026-10-12 | PATCH: el hash de integridad de Phaser pasa de SHA-384 a SHA-512 (AC-3.1, AC-3.2, FR-4). Motivo: cdnjs publica para `phaser.min.js` 3.80.1 solo el hash SHA-512, y así AC-3.2 compara directo los tres valores. Confirmado por el usuario el 2026-10-12. |

---

## Problem Statement

La PoC de Livin solo se puede jugar en la máquina de desarrollo o, con el servidor local encendido, desde un teléfono en la misma red. Quien quiere enseñar el producto (familia, invitados, interesados) no puede compartir un enlace. Esta feature publica la PoC en una dirección pública estable con HTTPS, a costo $0, de modo que cualquiera con el enlace pueda jugarla en su teléfono sin crear cuenta ni instalar nada, y aplica la seguridad básica posible. No cambia ninguna regla del juego ni lo que se guarda.

## Goals

- Una **dirección pública estable** con HTTPS: `https://bsoto24.github.io/livin/`.
- **Costo mensual de $0**, sin cuenta de pago ni servicio nuevo.
- Que **cada versión de `main` con todas las pruebas en verde se publique sola**, que una con alguna prueba en rojo **no** se publique, y que la persona responsable pueda publicar a mano cuando quiera.
- Que el sitio publicado contenga **solo lo necesario para jugar** (`index.html`, `src/`, `assets/`).
- **Seguridad básica sin cabeceras HTTP**: el script de terceros (Phaser, versión fija 3.80.1) solo se ejecuta si coincide con la copia verificada, y la página solo ejecuta código de su propio origen y de ese script.
- Que **antes de hacer público el repo** se compruebe que el historial completo no contiene secretos.
- Que quede **documentado** qué queda público, qué límites de seguridad se aceptan y cómo se publica y se vuelve a una versión anterior.
- Que el juego se comporte **igual que en local**: se juega en un Android en vertical a 60 cuadros por segundo o más.

## Non-Goals

- No hay servidor de aplicación, base de datos, cuentas ni autenticación, y no se restringe el acceso: cualquiera con el enlace puede jugar.
- No se copian las partidas a la nube ni se sincronizan entre dispositivos.
- No cambian el comportamiento del juego, el modelo, el generador ni el formato guardado (sigue `version: 7`).
- No hay dominio propio, analítica, modo sin conexión (PWA) ni entornos de prueba o vistas previas por rama.
- No se reescribe el historial de git ni se copia Phaser al repositorio.
- No se agrega un mensaje de error propio cuando Phaser no carga (ver Error Scenarios).
- El cambio de visibilidad del repo y la configuración de Pages en GitHub no los hace el código: los hace la persona responsable (ver FR-6).

## Users and Context

**Primary users:** las personas que abren el enlace para jugar la PoC (familia, invitados, interesados) en un teléfono Android en vertical, sin cuentas ni conexión previa con el proyecto.
**Secondary users:** la persona responsable del producto, que publica versiones y comparte el enlace; y quien desarrolla, que mantiene el flujo de publicación.
**Usage context:** sesiones cortas desde el navegador del teléfono tras abrir un enlace compartido por mensajería; y publicación tras cada merge a `main`.
**User mental model:** "mandar un enlace y que funcione". Vocabulario nuevo: "publicar" (dejar una versión de `main` disponible en la dirección pública), "compuerta de pruebas" (las pruebas deben pasar antes de publicar) y "origen" (la dirección `bsoto24.github.io`, que es lo que delimita los datos guardados de cada navegador).

**Relación con las specs anteriores.** Esta feature no cambia ninguna pantalla ni regla:

- **Spec 011:** conserva el respaldo de 4 s (la interfaz se muestra aunque el módulo principal no llegue a cargar) y la regla de que `index.html` no escribe colores a mano. Los cambios de `index.html` de esta feature (integridad, política de contenido y, si hace falta, mover el script en línea) no pueden romper ninguna de las dos.
- **Spec 001:** el documento guardado sigue en el almacenamiento local del navegador; al publicarse, queda ligado al origen `bsoto24.github.io` (ver FR-1 y FR-6).

## User Stories

### Story 1: Jugar desde un enlace

**As a** persona que recibe el enlace de la PoC
**I want** abrirlo en mi teléfono y jugar
**So that** pueda probar Livin sin instalar nada ni crear una cuenta

**Acceptance criteria:**

- [ ] **AC-1.1** Given la PoC publicada When se abre `https://bsoto24.github.io/livin/` en un navegador de escritorio Then se muestra el mapa del hogar y todos los recursos que pide la página (código, fuente y Phaser) responden con éxito, sin errores de carga en la consola. **[nav]**
- [ ] **AC-1.2** Given la PoC publicada y un teléfono Android con el navegador en vertical When se abre la dirección y se juega una sesión normal (caminar, abrir el menú, el editor, un formulario, el historial) Then el juego se ve y funciona igual que en local y el movimiento se mantiene a 60 cuadros por segundo o más. **[nav]**
- [ ] **AC-1.3** Given la dirección con `http://` delante When se abre Then el navegador termina en `https://` y nunca muestra el juego por una conexión sin cifrar. **[nav]**
- [ ] **AC-1.4** Given un navegador sin partida previa en ese origen When se abre la dirección Then aparece el hogar inicial de siempre (el mismo que en local con almacenamiento vacío) sin pedir cuenta, contraseña ni ninguna aceptación previa. **[nav]**
- [ ] **AC-1.5** Given una partida creada en el sitio publicado When se recarga la página o se cierra y vuelve a abrir el navegador Then el hogar, los miembros y las actividades siguen como se dejaron. **[nav]**
- [ ] **AC-1.6** Given el contenido de `index.html`, de `src/` y de las hojas que carga When se revisan todas las rutas de recursos Then ninguna es absoluta desde la raíz del servidor (empieza por `/`) y ninguna depende de que el sitio esté en la raíz del dominio. **[auto]**

### Story 2: Publicación automática protegida por las pruebas

**As a** persona responsable del producto
**I want** que cada versión buena de `main` se publique sola y las malas no
**So that** el enlace que comparto siempre muestre una versión que pasó las pruebas, sin pasos manuales

**Acceptance criteria:**

- [ ] **AC-2.1** Given un commit en `main` con las 459 pruebas actuales y las nuevas en verde When termina el flujo de publicación Then la dirección pública sirve el mismo `index.html` que `poc/index.html` de ese commit. **[nav]**
- [ ] **AC-2.2** Given un commit con al menos una prueba en rojo When corre el flujo de publicación Then no se publica nada y el sitio conserva la versión anterior. **[auto]** para la dependencia (la definición del flujo hace que publicar dependa de que las pruebas pasen) y **[manual]** con una ejecución real sobre una rama de prueba con una prueba fallando, registrada en `verification.md`.
- [ ] **AC-2.3** Given `main` When la persona responsable lanza el flujo a mano desde GitHub, sin hacer un commit nuevo Then se publica el contenido actual de `main` igual que con un push. **[manual]**
- [ ] **AC-2.4** Given un push a una rama que no es `main`, o un pull request When corre algún flujo Then no se publica nada en la dirección pública. **[auto]** (la definición del flujo solo publica desde `main`) y **[manual]** (confirmado en una rama de prueba).
- [ ] **AC-2.5** Given la definición del flujo When se revisa Then pide solo los permisos necesarios para leer el código y publicar en Pages, y las acciones de terceros que usa son las oficiales de GitHub, fijadas a una versión. **[auto]**
- [ ] **AC-2.6** Given un despliegue que falla a mitad (por ejemplo, se agota el tiempo) When termina el flujo Then el sitio sigue sirviendo la versión anterior completa, nunca una mezcla de archivos de dos versiones. **[manual]**

### Story 3: Script de terceros verificado y política de contenido

**As a** persona que juega
**I want** que la página no ejecute código que alguien alteró
**So that** mi partida guardada en el navegador no corra riesgo por un script ajeno

**Acceptance criteria:**

- [ ] **AC-3.1** Given `index.html` When se revisa su texto Then el script de Phaser sigue en la versión 3.80.1 desde cdnjs y lleva un atributo de integridad con un hash SHA-512 y el atributo de origen anónimo. **[auto]**
- [ ] **AC-3.2** Given el hash de integridad de `index.html` When se compara con el hash SHA-512 del archivo de Phaser 3.80.1 descargado de cdnjs y con el que cdnjs publica para ese archivo Then los tres coinciden, y la comparación queda registrada en `verification.md`. **[manual]**
- [ ] **AC-3.3** Given `index.html` When se revisa su texto Then contiene una política de contenido por etiqueta `<meta>` que (a) restringe por defecto todo origen que no se nombre, (b) permite scripts solo del propio origen y de `cdnjs.cloudflare.com`, (c) permite imágenes del propio origen y de datos y blobs, (d) permite la fuente solo del propio origen, y (e) no permite `unsafe-eval` ni `unsafe-inline` para scripts. **[auto]**
- [ ] **AC-3.4** Given el sitio en un navegador de escritorio When se juega una sesión que recorre el mapa, el modo edición, el menú inferior con sus cuatro secciones, un formulario, el historial, un intercambio y los personajes caminando Then la consola no muestra ningún error ni aviso de política de contenido ni de integridad. **[nav]**
- [ ] **AC-3.5** Given una copia local de la página en la que se altera un carácter del hash de integridad When se abre Then el navegador rechaza el script de Phaser, la consola indica el fallo de integridad y el juego no arranca. **[nav]**
- [ ] **AC-3.6** Given una copia local de la página a la que se agrega una etiqueta de script que apunta a otro origen que no sea cdnjs When se abre Then el navegador la bloquea y la consola indica la violación de la política. **[nav]**
- [ ] **AC-3.7** Given una copia local de la página en la que el módulo principal no llega a cargar When pasan 4 segundos Then la interfaz se muestra igualmente (comportamiento de la spec 011), con la política de contenido activa. **[nav]**
- [ ] **AC-3.8** Given `index.html` When se revisa Then no contiene un color escrito a mano nuevo (la prueba estática de la spec 011 sigue en verde) y el atributo de integridad y la política `<meta>` están protegidos por una prueba estática que falla si alguien los quita. **[auto]**

### Story 4: Hacer público el repo sin exponer secretos

**As a** persona responsable del producto
**I want** comprobar que el historial completo no contiene secretos antes de hacer público el repo
**So that** publicar el código no filtre ninguna credencial

**Acceptance criteria:**

- [ ] **AC-4.1** Given el repositorio completo (todas las ramas y los 185+ commits) When se ejecuta una herramienta dedicada de búsqueda de secretos sobre todo el historial antes de cambiar la visibilidad Then no hay hallazgos, o cada hallazgo está resuelto y explicado en `verification.md`. **[manual]**
- [ ] **AC-4.2** Given el repositorio When se listan los archivos que sigue git Then no hay archivos de claves, credenciales ni configuración local de entorno, y `.gitignore` cubre los de ese tipo. **[auto]**
- [ ] **AC-4.3** Given la persona responsable ya hizo público el repo y configuró Pages para publicar con el flujo de GitHub Actions When se revisan los ajustes del repo Then la visibilidad es pública, la fuente de Pages es GitHub Actions y HTTPS está forzado. **[manual]**

### Story 5: Contenido del sitio y documentación al día

**As a** persona que mantiene el proyecto
**I want** que el sitio contenga solo lo necesario y que el proceso esté escrito
**So that** el siguiente cambio de hosting o la siguiente publicación no parta de cero

**Acceptance criteria:**

- [ ] **AC-5.1** Given el sitio publicado When se piden `test/` y `package.json` Then responden "no encontrado" y el sitio solo sirve `index.html`, `src/` y `assets/`. **[nav]**
- [ ] **AC-5.2** Given el paquete que el flujo sube a Pages When se lista su contenido Then es exactamente el contenido de `poc/` menos `test/` y `package.json`, sin archivos de sistema (por ejemplo `.DS_Store`). **[auto]** o **[manual]**, según lo que permita el plan; si no se puede automatizar, queda registrado en `verification.md`.
- [ ] **AC-5.3** Given `.claude/memory/steering/tech-stack.md` y `CLAUDE.md` When se leen tras la feature Then ya no dicen "Infraestructura: ninguna", describen el hosting en GitHub Pages con la dirección pública, y las reglas de `.claude/rules/javascript.md` y `phaser.md` mencionan que Phaser se carga con verificación de integridad. **[manual]**
- [ ] **AC-5.4** Given la guía de despliegue de la feature When se lee Then explica: qué queda público (el repo, su historial y el correo del autor), cómo se publica (por push a `main` y a mano), cómo volver a una versión anterior, qué se debe hacer al subir la versión de Phaser (recalcular el hash y revisar la política), y las limitaciones aceptadas (sin cabeceras HTTP, datos ligados al origen compartido de la cuenta, sin control de acceso). **[manual]**

### Story 6: El juego no cambia

**As a** persona que ya conoce la PoC
**I want** que el juego publicado sea el mismo que ya conozco
**So that** desplegarlo no rompa nada de lo hecho en las features 001 a 011

**Acceptance criteria:**

- [ ] **AC-6.1** Given el repo con esta feature aplicada When se ejecuta la suite completa de la PoC Then pasan las 459 pruebas anteriores sin modificar y las nuevas de esta feature. **[auto]**
- [ ] **AC-6.2** Given el código de la PoC When se compara con `main` anterior a esta feature Then no cambia ningún módulo del modelo ni del generador (`catalogo.js`, `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js`), ni el formato guardado (`version: 7`, clave `livin:datos:v1`). **[manual]** (revisión del diff, registrada en `verification.md`); el formato guardado además lo cubren las pruebas existentes.
- [ ] **AC-6.3** Given el sitio publicado en el teléfono Android When se mide un recorrido con el hogar de carga completa de la feature 011 Then se mantienen los 60 cuadros por segundo o más y el tiempo de redibujo del mundo no empeora respecto a lo registrado en la verificación de la 011 (24,9 ms en la 010, 0,0 ms en la 011). **[nav]**

## Functional Requirements

### FR-1: Dirección pública estable

La PoC se sirve en `https://bsoto24.github.io/livin/`, por HTTPS, accesible sin autenticación.

**Must:**
- Cargar y funcionar bajo el subdirectorio `/livin/` sin cambiar el comportamiento del juego.
- Responder por HTTPS y llevar a HTTPS cualquier solicitud sin cifrar.
- Guardar la partida de cada persona en su propio navegador, ligada al origen `bsoto24.github.io`.

**Must not:**
- Pedir cuenta, contraseña, aceptación de condiciones ni ninguna interacción previa para jugar.
- Usar rutas absolutas desde la raíz del servidor.

### FR-2: Contenido publicado

Solo se publica lo necesario para jugar.

**Must:**
- Publicar `index.html`, `src/` (incluido `src/arte/`) y `assets/` de `poc/`.
- Reflejar fielmente el contenido de `poc/` del commit publicado.

**Must not:**
- Publicar `test/`, `package.json`, archivos de sistema ni nada fuera de `poc/`.

### FR-3: Publicación automática con compuerta de pruebas

Cada versión de `main` se publica sola solo si pasan todas las pruebas, y también se puede publicar a mano.

**Must:**
- Ejecutar la suite completa de la PoC antes de publicar.
- Publicar solo si todas las pruebas pasan, y solo desde `main`.
- Permitir lanzar la publicación a mano desde GitHub, sin un commit nuevo.
- Usar los permisos mínimos necesarios y solo acciones oficiales de GitHub fijadas a una versión.
- Dejar la versión anterior intacta si una publicación falla.

**Must not:**
- Publicar desde otras ramas ni desde pull requests.
- Requerir un servicio de pago, un servicio de terceros distinto de GitHub ni credenciales guardadas por la persona responsable.

### FR-4: Integridad del script de terceros

Phaser (versión fija 3.80.1, desde cdnjs) solo se ejecuta si coincide con la copia verificada.

**Must:**
- Declarar la integridad del script con un hash SHA-512 correcto para ese archivo exacto.
- Mantener la versión 3.80.1 y el origen cdnjs (regla de `phaser.md` y `javascript.md`).
- Fallar de forma visible en la consola (y no ejecutar el script) si el archivo no coincide.

**Must not:**
- Cargar ningún otro script de terceros.

### FR-5: Política de contenido

La página limita de dónde puede venir lo que carga y ejecuta.

**Must:**
- Declarar la política por etiqueta `<meta>` con las restricciones de AC-3.3.
- No ejecutar scripts en línea sin protección ni permitir `unsafe-eval`.
- Mantener el respaldo de 4 s de la spec 011 funcionando bajo la política.
- Seguir mostrando correctamente fuente local, imágenes generadas en canvas y estilos de la interfaz.

**Must not:**
- Romper ninguna pantalla, control ni tipografía de las features 001 a 011.
- Añadir colores escritos a mano en `index.html`.

### FR-6: Visibilidad pública del repo

El repo completo y su historial pasan a ser públicos, y esto se hace con una comprobación previa.

**Must:**
- Buscar secretos en todo el historial con una herramienta dedicada antes del cambio de visibilidad.
- Registrar el resultado en `verification.md`.
- Dejar documentado que el cambio de visibilidad y la configuración de Pages son pasos de la persona responsable (el código no los hace) y que el repo público incluye `docs/`, `.claude/` y el correo del autor.

**Must not:**
- Cambiar la visibilidad del repo desde el flujo de publicación ni desde el código.

### FR-7: Documentación

Lo decidido queda escrito donde se busca.

**Must:**
- Actualizar `tech-stack.md`, `CLAUDE.md` y las reglas de Phaser y JavaScript (AC-5.3).
- Incluir una guía de despliegue con lo de AC-5.4.
- Registrar la evidencia en `verification.md`.

### FR-8: El juego no cambia

**Must:**
- Mantener sin cambios el comportamiento, el modelo, el generador y el formato guardado.
- Mantener la suite anterior en verde.

**Must not:**
- Cambiar nada fuera de `index.html`, la definición del flujo de publicación, las pruebas nuevas y los documentos, salvo que mover el script en línea exija un archivo nuevo de presentación.

## Non-Functional Requirements

### Performance

- Movimiento a 60 cuadros por segundo o más en el teléfono, y redibujo del mundo sin empeorar respecto a la verificación de la 011 (AC-6.3).
- La primera carga de la página transfiere en total 2 MB o menos (código, fuente, Phaser y el resto), medido en el panel de red del navegador y registrado en `verification.md`. **[nav]**

### Security

- Sin cuentas, sin datos de personas en servidor y sin credenciales de la persona responsable en el flujo ni en el repo.
- Phaser verificado por integridad (FR-4) y política de contenido (FR-5).
- Limitaciones aceptadas y documentadas: no se pueden configurar cabeceras HTTP (sin protección contra incrustación en otros sitios ni HSTS configurable), y el almacenamiento local es por origen, así que cualquier otro sitio publicado bajo `bsoto24.github.io` podría leer las partidas.
- El repo es público: cualquier persona puede leer el código, la documentación y el correo del autor en el historial.

### Reliability

- Una publicación fallida deja la versión anterior intacta (AC-2.6).
- Si cdnjs no responde, el juego no arranca; no hay respaldo alternativo (ver Error Scenarios).
- Costo mensual de $0, comprobado en los ajustes de facturación de la cuenta tras la primera publicación. **[manual]**

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Una prueba falla en `main` | No se publica; el sitio conserva la versión anterior; el fallo es visible en la ejecución del flujo |
| La publicación a Pages falla o se agota el tiempo | El sitio sigue sirviendo la versión anterior completa; se puede reintentar a mano |
| El archivo de Phaser en cdnjs no coincide con el hash | El navegador rechaza el script, la consola muestra el fallo de integridad y el juego no arranca; tras 4 s se muestra la interfaz sin mapa (comportamiento actual de la spec 011) |
| cdnjs no responde | Igual que la fila anterior: el juego no arranca; no hay mensaje propio |
| La política de contenido bloquea un recurso propio | Se detecta en la consola durante la verificación (AC-3.4) y se corrige antes de publicar; no se acepta ninguna violación en la verificación |
| Alguien quita el hash de integridad o la política de `index.html` | Una prueba estática falla y el flujo no publica (AC-3.8) |
| La búsqueda de secretos encuentra una credencial en el historial | No se cambia la visibilidad del repo hasta resolverlo; se registra en `verification.md` |
| Una persona abre una partida guardada con la dirección antigua (por ejemplo `localhost`) | No ve esa partida en el sitio publicado, porque el almacenamiento es por origen; es un límite conocido y documentado |
| Se publica otro sitio bajo la misma cuenta `bsoto24.github.io` | Ese sitio comparte el origen y podría leer las partidas; riesgo aceptado, documentado en la guía |

## Open Questions

Ninguna. Resuelta el 2026-10-12: si Phaser no carga (cdnjs caído o hash que no coincide) se acepta el comportamiento actual, sin aviso propio (ver Non-Goals y Error Scenarios).

## Out of Scope (Future Considerations)

- Dominio propio y migración de las partidas guardadas a otro origen.
- Control de acceso (contraseña, correos autorizados) y, con él, un cambio de hosting.
- Copia de partidas en la nube, cuentas y multiusuario con servidor.
- Modo sin conexión (PWA) y analítica.
- Entornos de prueba y vistas previas por rama o pull request.
- Copiar Phaser al repositorio para no depender de cdnjs.
- Reescribir el historial para ocultar el correo del autor.
- Cabeceras HTTP reales (CSP en cabecera, HSTS, protección contra incrustación), que exigirían otro hosting.
