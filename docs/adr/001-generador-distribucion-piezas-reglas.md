# ADR-001-generador-distribucion-piezas-reglas: Generador de distribución con piezas prediseñadas y reglas de ensamblaje

**Status:** Accepted
**Date:** 2026-10-04
**Feature:** 001-mapa-editor-hogar

## Context

El hogar se representa como un mapa 2D en cuadrícula (tiles de 16 px, vista cenital estilo GBA). Cada vez que el usuario cambia un contador de espacios, la app debe producir la cuadrícula completa: qué se dibuja en cada casilla, qué casillas bloquean el paso, dónde están las puertas y pasillos, y a qué espacio pertenece cada casilla.

Requisitos del PRD que condicionan la decisión:

- Todas las combinaciones de contadores permitidas deben generar un mapa correcto y navegable (criterio de éxito 1).
- La regeneración debe completarse en menos de 100 ms (criterio de éxito 3).
- El mismo estado guardado (espacios y qué cuarto contiene cada baño interno) debe producir siempre el mismo mapa, para que el usuario entienda el resultado y para que la posición guardada relativa a un espacio siga siendo válida.
- Ningún espacio cambia por efecto secundario de otra acción (principio rector del PRD): el generador ubica los espacios, pero no decide cuáles existen ni qué cuarto contiene cada baño.
- El stack oficial no está decidido. La PoC se hace en Phaser 3, por lo que la lógica de distribución debe poder portarse a otro stack (Kotlin, Godot u otro) sin reescribirse.
- Los tipos de espacio deben poder ampliarse en el futuro.
- El tamaño del hogar está acotado (hogar típico: hasta 4 dormitorios, 2 oficinas, 2 cocinas y 7 baños), así que el número de combinaciones (contadores y qué cuartos contienen baño interno) es finito, del orden de decenas de miles.

## Options Considered

### Option A: Piezas prediseñadas por tipo de espacio + reglas de ensamblaje

Cada tipo de espacio es una pieza diseñada a mano en tiles, con sus paredes, mobiliario, casillas bloqueadas y puntos de puerta. Un conjunto de reglas fijas coloca las piezas en zonas alrededor de la sala, agrega pasillos cuando corresponde y anexa cada baño interno al cuarto que lo contiene.

**Pros:** determinista; mobiliario siempre bien ubicado (diseñado a mano); las combinaciones finitas permiten verificar exhaustivamente todas en un test; lógica simple y fácil de portar; un tipo de espacio nuevo es una pieza más una regla de zona, sin tocar el generador.
**Cons:** todos los espacios de un mismo tipo se ven iguales; cada tipo nuevo requiere dibujar su pieza; no escala a hogares de forma o tamaño arbitrario.

### Option B: Mapas completos prediseñados por combinación

Se dibuja a mano un mapa completo para cada combinación de contadores.

**Pros:** máximo control artístico sobre cada hogar.
**Cons:** con miles de combinaciones es inviable de producir y mantener; solo funcionaría restringiendo drásticamente los contadores, lo que contradice los requisitos.

### Option C: Generador procedural (particionado BSP o resolución de restricciones)

Un algoritmo divide un terreno en regiones, las asigna a tipos de espacio respetando restricciones de adyacencia y coloca el mobiliario por reglas dentro de cada región.

**Pros:** escala a cualquier tamaño y forma de hogar; habitaciones de dimensiones variadas; hogares distintos entre sí.
**Cons:** resultados poco predecibles (agregar un baño puede reorganizar toda la casa); ubicación de muebles propensa a casos defectuosos (camas tapando puertas, regiones demasiado estrechas); difícil de verificar de forma exhaustiva; más costoso de portar; resuelve un problema (tamaño ilimitado) que el límite del hogar típico ya eliminó.

## Decision

**We chose Option A (piezas prediseñadas + reglas de ensamblaje)** because es la única opción que cumple a la vez los cuatro requisitos del PRD que más pesan: con combinaciones finitas permite verificar exhaustivamente que todo mapa es correcto y navegable (criterio de éxito 1); su determinismo hace que la posición guardada relativa a un espacio siga siendo válida; su costo computacional es trivial frente a la meta de 100 ms; y al ser lógica pura sin dependencias del motor se porta al stack oficial cuando se decida. La Option C aporta flexibilidad que el límite del hogar típico hace innecesaria, y la Option B es inviable con miles de combinaciones.

## Consequences

**Separación en tres capas.** Esta decisión fija la arquitectura del mapa en tres unidades independientes:

1. **Modelo del hogar.** Espacios y sus datos, sin gráficos.
2. **Generador de distribución.** Función pura y determinista. Entrada: la lista ordenada de espacios activos del hogar, incluido qué cuarto contiene cada baño interno (dato guardado, no calculado), y el catálogo de tipos de espacio. Salida: la cuadrícula de tiles, el mapa de colisiones, las puertas y pasillos y la correspondencia casilla → espacio. No depende del motor de renderizado.
3. **Renderizador.** Dibuja la salida del generador. Hoy Phaser 3, mañana el stack oficial.

**Más fácil:**
- Probar el generador sin interfaz, incluido un test exhaustivo de todas las combinaciones permitidas de contadores y de cuartos con baño interno.
- Portar el modelo y el generador al stack oficial; solo se reescribe el renderizador.
- Agregar tipos de espacio: entrada en el catálogo (zona, límites, pieza, si admite baño interno) más su pieza dibujada.
- Agregar variantes visuales por pieza más adelante, sin rehacer el generador.

**Más difícil:**
- Variedad visual: todos los dormitorios lucen iguales hasta que se agreguen variantes.
- Cada tipo de espacio nuevo exige trabajo de arte.

**A revisar si este ADR es reemplazado:** si en el futuro se eliminan los límites del hogar típico o se pide que el usuario dibuje formas libres, habría que reevaluar la Option C. El contrato de entrada y salida del generador debería mantenerse, de modo que el modelo y el renderizador no cambien.
