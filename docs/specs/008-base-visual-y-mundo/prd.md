# PRD: Base visual y mundo

**Date:** 2026-10-09
**Feature:** 008-base-visual-y-mundo

## Problem

Livin quiere ser un videojuego 2D de vista cenital estilo GBA, pero hoy el mapa se ve como un plano de colores: cada tipo de espacio es un color liso, el mobiliario son cuadrados de color sin forma reconocible, las paredes son todas iguales y la letra es la del sistema. En el teléfono, el hogar se entiende por las etiquetas y no por su aspecto; y el juego no transmite la identidad de "casa de videojuego" que dice la fundación del proyecto.

Este es el primero de tres pasos para dar al juego su arte (ver "Hoja de ruta"). Esta feature fija la **línea gráfica común** y dibuja **el mundo**: paleta, tipografía, suelos, paredes y mobiliario.

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, como en las features 001 a 007. La observación viene del uso real del PoC en Android y en escritorio.

**Estilo elegido:** pixel art clásico de GBA, entre tres direcciones comparadas con muestras (colores planos mejorados; pixel art GBA clásico; pixel art cálido con sombras). Contorno oscuro, paleta corta y suelo con textura, de modo que cada espacio se reconozca de un vistazo (principio 3 de la fundación). Quien decide el producto confirmó la paleta de 32 colores y las nueve texturas de suelo mostradas durante el brainstorm.

**Hoja de ruta (decidida en el brainstorm, tres features independientes):**
1. **008 Base visual y mundo** (esta): paleta, tipografía, canal de arte, suelos, paredes y mobiliario.
2. **009 Habitantes animados**: caminar en cuatro direcciones para los siete aspectos y las seis especies.
3. **010 Estados e iconos**: limpio, desordenado y desastre dibujados en el mapa, y un juego de iconos propio para la barra, los drawers y las burbujas; recolor de la interfaz HTML con la paleta.

Cada una pasa por su propio brainstorm, spec y plan. La 008 deja la paleta y las convenciones listas para las otras dos.

**Sistemas existentes que toca:**
- El **dibujo del mapa** (`dibujarSuelo` en `juego.js`) y sus constantes `COLOR_PISO`, `COLOR_MUEBLE`, `COLOR_PARED`: se reemplazan por textura y mobiliario dibujados.
- La **leyenda del mobiliario** (`catalogo.js`): las 17 letras actuales siguen siendo la fuente; no se tocan.
- Los **estilos de texto** de Phaser (`ESTILO_ETIQUETA`, `ESTILO_CARTEL`, insignias) y el CSS de la barra inferior y de los títulos de los drawers: cambian de fuente.
- **No se tocan:** el modelo, el generador, las colisiones, el formato guardado, las rutinas, los intercambios ni el historial.

**Conservado tal como está hasta su feature:** los habitantes (rectángulos de color) hasta la 009; los objetos del suelo según el estado de limpieza (rectángulos de color, que se siguen dibujando encima del suelo nuevo, por debajo de los personajes, y se redibujan al cambiar las actividades o el día), las insignias, las burbujas con emoji y los colores de la interfaz HTML (barra, drawers, fichas) hasta la 010. Esta feature solo cambia la **fuente** de la barra inferior y de los títulos de los drawers, no sus colores.

**Plataforma.** El PoC web sigue siendo desechable y el stack oficial no está decidido; por eso el arte se guarda como datos independientes del motor (ADR-008). Toda la interfaz y los documentos siguen en español.

## Goals

**Paleta y canal de arte**
- Una **paleta única de 32 colores** en 11 familias (contorno y pared, madera, azul, rosa, verde, neutros, azulejo, lavanda, arena y piedra, verde grisáceo, acento), definida en un solo módulo y compartida con las features 009 y 010. Ningún dibujo usa un color fuera de la paleta.
- El arte son **cuadrículas de texto de 16×16 píxeles** con una clave de paleta por píxel, guardadas como datos puros en la capa de presentación y convertidas en texturas de Phaser al arrancar (ADR-008).

**Suelos y paredes**
- **Nueve texturas de suelo**, una por tipo de espacio y el pasillo, que siguen los tonos actuales: sala en madera cálida, comedor en madera clara, cocina con baldosa en damero, baño con azulejo pequeño, lavandería con concreto verdoso, espacio de mascota con paja, dormitorio con alfombra rosa, oficina con alfombra lavanda y pasillo con piedra.
- **Dos vistas de pared**: de frente (borde claro arriba, ladrillo y zócalo) cuando la casilla de abajo no es pared, y vista desde arriba en los demás casos. La elección depende solo de las casillas vecinas y no cambia la distribución ni las colisiones.

**Mobiliario**
- Las **17 piezas actuales** (cama, velador, sofá, mesa de centro, mesa de comedor, silla de comedor, cocina, refrigeradora, lavadero, inodoro, lavamanos, ducha, escritorio, silla de escritorio, lavadora, cama de mascota y plato) se redibujan con forma reconocible y contorno oscuro. Las piezas que ocupan varias casillas (sofá, mesas, camas, escritorios, lavadoras) usan variantes de borde según sus vecinas, para dibujarse como un solo objeto.
- No se añaden muebles nuevos ni cambia ninguna pieza de la distribución.

**Tipografía**
- **Silkscreen** (licencia SIL OFL) en un archivo local `.woff2`, para funcionar sin conexión. Se usa en el **mapa** (etiquetas de espacios y de habitantes, insignias de estado, cartel "n fuera") y en la **barra inferior y los títulos de los drawers**. Los campos de texto, las listas, la ficha de actividad y el historial siguen con la fuente del sistema, donde se escribe y se lee mucho.
- La fuente está cargada antes de crear los textos del mapa; si no carga, el juego sigue con la fuente del sistema sin errores.

**Dibujo del mapa**
- El suelo, las paredes y el mobiliario se dibujan como un `Tilemap` de Phaser en vez de un `fillRect` por casilla. Qué arte lleva cada casilla lo decide una función pura de la distribución, probada sin Phaser.

## Non-Goals

- Personajes y mascotas con sprites o animación de caminar (feature 009).
- Estados de limpieza dibujados en el mapa, iconos propios y recolor de la interfaz HTML (feature 010).
- Muebles o espacios nuevos, decoración que no bloquea (alfombras, ventanas, cuadros) o cambios en las reglas de distribución.
- Cambios en el formato guardado, migraciones, o en las reglas del modelo.
- Modo oscuro, temas intercambiables o ajustes de arte desde la aplicación.
- Arte importado (PNG, hojas de sprites o paquetes de terceros).

## Success Criteria

**Cobertura del arte (automático, sin Phaser):**
- Cada cuadrícula mide 16×16 y usa solo claves de la paleta.
- Los 8 tipos de espacio, el pasillo y las 17 piezas del mobiliario tienen arte, y ninguna casilla cae a un color de respaldo en los 7.560 mapas permitidos.
- Elegir el arte de una casilla es determinista: dos llamadas con el mismo estado dan el mismo resultado.
- Las suites de las features 001 a 007 siguen pasando sin cambios (346 pruebas) y el formato guardado no cambia.

**En el teléfono (como en las verificaciones anteriores, con un hogar completo de 8 familiares, 4 mascotas, 50 pendientes y 200 entradas):**
- El movimiento se mantiene a 60 fps o más.
- El redibujo en modo edición tarda menos de 100 ms; no empeora respecto a los 62,7 ms actuales con la carga completa.
- La generación de texturas al arrancar tarda menos de 300 ms (se mide y se registra).
- Cada espacio se reconoce por su suelo sin leer la etiqueta, y los muebles se distinguen entre sí.
- Tildes y ñ se ven bien en Silkscreen; las etiquetas se leen con el zoom bajo del modo edición. Si alguna letra no existe en la fuente, se usa la del sistema para esa letra y se registra.

## Architecture Decisions

- [El arte como cuadrículas de texto con paleta compartida](../../adr/008-arte-cuadriculas-con-paleta.md) — texturas y sprites como datos puros de 16×16 con una sola paleta, producidos en el proyecto y convertidos a texturas al arrancar, en vez de PNG propios o un paquete CC0.

Decisiones menores que se quedan aquí, sin ADR (fáciles de revertir y locales a la capa de presentación): el suelo y el mobiliario se dibujan con un `Tilemap` de Phaser (si no cumple los 100 ms con la carga completa, se cambia a un `RenderTexture` dentro de `juego.js`); la tipografía es Silkscreen local y se aplica solo al mapa y a la barra; los muebles de varias casillas usan variantes según sus vecinas.

## Out of Scope

- Cualquier cosa de las features 009 y 010 de la hoja de ruta (habitantes animados, estados, iconos propios, recolor de la interfaz HTML).
- Las otras dos direcciones de arte comparadas (colores planos mejorados y pixel art cálido con sombras); de la segunda queda abierto añadir sombras o alfombras como mejora posterior.
- Decoración que no bloquea y muebles nuevos.
- Una herramienta o vista previa para dibujar el arte; si la 009 la necesita, se decide en su brainstorm.
- Arte importado y paquetes de terceros.
- Modo oscuro y temas.
