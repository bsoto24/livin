# ADR-008-arte-cuadriculas-con-paleta: El arte del juego como cuadrículas de texto con paleta compartida

**Status:** Accepted
**Date:** 2026-10-09
**Feature:** 008-base-visual-y-mundo

## Context

Hoy el mapa de Livin se dibuja con rectángulos de color: `COLOR_PISO` (un color por tipo de espacio), `COLOR_MUEBLE` (un color por letra de la leyenda de `catalogo.js`) y `COLOR_PARED`; los habitantes son rectángulos de 12×14 px, los iconos son emoji del sistema y la letra es `system-ui`. El PRD de esta feature, la primera de tres (008 base visual y mundo, 009 habitantes animados, 010 estados e iconos), elige el estilo **pixel art clásico de GBA**: contorno oscuro, paleta corta, suelo con textura y mobiliario reconocible.

Hay que decidir **cómo se crea y se guarda el arte**, porque las tres features lo van a producir y porque cambiarlo después obliga a rehacer todo el contenido. Las restricciones que pesan:

- Regla del proyecto (`.claude/rules/phaser.md`): arte original o CC0, nunca sprites con derechos de terceros; Phaser es solo el renderizador y el estado del juego no vive en objetos de Phaser.
- Regla del proyecto (`.claude/rules/javascript.md`): sin dependencias npm y sin paso de compilación; Phaser 3.80.1 es la única dependencia externa.
- El stack oficial no está decidido (`tech-stack.md`); el modelo y el generador deben poder portarse y solo el renderizador es desechable. El arte debería poder viajar con ellos.
- Las pruebas corren con `node:test` sin Phaser ni DOM (`.claude/rules/testing.md`); el arte debería poder validarse así.
- Quien produce el arte en este proyecto es Claude dentro de las sesiones de trabajo; no hay un artista ni un editor de píxeles en el flujo. Quien decide el producto eligió explícitamente esta línea.
- El juego funciona sin conexión; cualquier recurso debe estar dentro del repositorio.
- Rendimiento: 60 fps y redibujo en edición por debajo de 100 ms; hoy, con la carga completa, 62,7 ms.

## Options Considered

### Option A: Cuadrículas de texto con paleta, en módulos de datos de la capa de presentación

Cada textura o sprite es una lista de cadenas de 16 caracteres, uno por píxel, donde cada carácter es una clave de una paleta única (`.` es transparente). Viven en `src/arte/` como datos puros (`paleta.js`, `texturas.js`, `mobiliario.js`), sin importar Phaser ni tocar el DOM. Al arrancar, `juego.js` las convierte en una hoja de texturas de Phaser. Es el mismo formato que ya usan `PIEZAS` y `CENTRO` en `catalogo.js`.

**Pros:** sin arte binario ni herramientas externas; los cambios se leen en el diff; se validan sin Phaser (tamaño, claves de paleta); Claude puede producir y revisar el arte; es portable a cualquier motor; la paleta compartida queda impuesta por una prueba y no por disciplina; es la opción con menos dependencias, que es lo que exigen las reglas del proyecto.
**Cons:** dibujar a mano en texto es lento y no hay vista previa integrada (se mitiga con la prueba de formato y la revisión en el navegador); un sprite grande o con muchos cuadros crece en líneas; la calidad artística depende de lo que se pueda expresar en 16×16 con la paleta.

### Option B: PNG propios (hojas de sprites) dibujados en un editor de píxeles

Las texturas y los sprites se dibujan en Aseprite, Piskel o similar, y Phaser carga las hojas de sprites desde `poc/assets/`.

**Pros:** es el flujo habitual del pixel art y permite iterar viendo la imagen; el techo de calidad artística es el más alto.
**Cons:** introduce archivos binarios sin diff legible; Claude no puede producirlos ni revisarlos de forma fiable, así que el avance dependería de que quien decide el producto los dibuje o los encargue; la paleta compartida solo se puede comprobar con un script o a ojo; el formato viaja peor entre motores sin una herramienta de exportación.

### Option C: Paquete CC0 de terceros adaptado a la paleta

Se parte de un paquete gratuito con licencia CC0 (por ejemplo, de Kenney u OpenGameArt) y se recolorea.

**Pros:** el resultado profesional más rápido para suelos y mobiliario genéricos.
**Cons:** el estilo y las proporciones son los de otro proyecto y no garantizan la paleta común; los estados de limpieza, los siete aspectos y las seis especies seguirían exigiendo arte propio; hay que verificar la licencia de cada pieza y mantener la procedencia; sigue siendo binario.

## Decision

**We chose Option A (cuadrículas de texto con paleta, en módulos de datos de la capa de presentación)** porque es la única opción que cumple a la vez lo que exige el proyecto y lo que pide el PRD: arte original sin binarios ni dependencias (`phaser.md`, `javascript.md`), validable de forma automática con `node:test` sin Phaser (`testing.md`), portable junto al modelo y al generador, y producible dentro del flujo de trabajo actual sin depender de un artista externo. Las opciones B y C tienen mejor techo artístico o velocidad inicial, pero ambas añaden binarios y dejan sin resolver los estados, los aspectos y las especies; quien decide el producto eligió explícitamente la opción A.

Reglas que fija la decisión:

- **Una sola paleta.** `src/arte/paleta.js` define la paleta única (32 colores en 11 familias en esta feature); cada clave es un carácter. Las features 009 y 010 reutilizan esa paleta y pueden ampliarla, no sustituirla. Una prueba comprueba que ninguna cuadrícula usa una clave fuera de la paleta.
- **Tamaño de casilla.** Cada textura es de 16×16 píxeles (la casilla actual); las cuadrículas son rectangulares y de ese tamaño. Los sprites más grandes (habitantes, 009) fijan su tamaño en su propia spec.
- **Capa de presentación sin Phaser.** Los módulos de `src/arte/` son datos y funciones puras, importables desde las pruebas; solo `juego.js` convierte las cuadrículas en texturas. Los módulos de dominio y de generador no importan nada de `src/arte/`.
- **El arte no entra en el documento guardado.** No cambia el formato guardado ni requiere migración; una casilla elige su arte a partir de la distribución ya generada (tipo de espacio y letra de la leyenda).
- **Qué arte va en cada casilla es una función pura** (`src/arte/casillas.js`) de la distribución, para poder probar la elección sin Phaser.
- **Procedencia.** Todo el arte es original, producido en el proyecto. La única pieza externa es la tipografía Silkscreen (licencia SIL OFL), guardada como archivo local `.woff2` en `poc/assets/fonts/`; no es arte con derechos de terceros, pero se registra su licencia junto al archivo.

## Consequences

**Más fácil:**
- Revisar y versionar el arte como texto; las pruebas de formato y de paleta evitan colores sueltos y cuadrículas torcidas.
- Reutilizar la paleta y las convenciones en las features 009 (caminar en cuatro direcciones) y 010 (estados e iconos) sin volver a decidir el formato.
- Portar el arte a un motor oficial distinto: son datos, no código de Phaser.

**Más difícil:**
- Dibujar a mano en texto es lento, sobre todo con animaciones de varios cuadros; la feature 009 puede necesitar una pequeña utilidad de vista previa, que se decide en su propio brainstorm.
- Si más adelante alguien quiere arte dibujado en un editor, hay que escribir un importador o una conversión (PNG a cuadrícula); el formato de cuadrícula con paleta lo facilita pero no lo evita.
- Añadir un color nuevo exige ampliar la paleta en un único lugar y puede obligar a revisar el arte existente.

**A revisar si este ADR es reemplazado:** si el stack oficial incluye un flujo de arte propio (hojas de sprites, atlas o un editor), o si la calidad que se puede expresar en 16×16 con texto se queda corta para los habitantes o los estados. Un cambio a PNG (Option B) no obligaría a tocar el modelo, el generador ni `casillas.js`; solo reemplazaría la conversión de cuadrículas a texturas en `juego.js`.
