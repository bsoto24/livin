# ADR-004-movimiento-hacia-objetivo-reloj: Movimiento de los familiares hacia un objetivo derivado del reloj, con rutas y paso a través en ruta

**Status:** Accepted
**Date:** 2026-10-06
**Feature:** 004-rutinas

## Context

Hoy los habitantes caminan al azar ([ADR-002 de movimiento](002-movimiento-habitantes-modulo-puro.md)): un módulo puro `movimiento` decide cada paso con un azar inyectado, reserva casillas y nunca entra en una casilla ocupada por otro habitante o por el jugador. Ese ADR dejó la política de elección del siguiente paso como único punto de sustitución para las rutinas, y advirtió que, si las rutinas necesitaban rutas largas entre espacios, el módulo tendría que calcular recorridos. El [ADR-003 de estado derivado](003-estado-derivado-fechas-reloj-inyectado.md) maneja solo días del calendario local, con `hoy` inyectado, y advirtió que las rutinas podrían necesitar horas.

Requisitos del PRD que condicionan la decisión:

- Un familiar con un bloque activo en un espacio va a ese espacio y se queda en él; con un bloque **fuera de casa**, sale por la **entrada** del hogar y deja de verse en el mapa; sin bloque activo, camina por toda la casa como hoy.
- Los cambios de bloque ocurren con la app abierta: el familiar camina hasta su nuevo lugar, cruzando puertas y pasillos.
- Al abrir la app, o al volver del modo edición, cada familiar aparece directamente donde dice su rutina, sin repetir el camino que no se vio.
- La posición y el lugar donde debería estar un familiar no se guardan (decisión de la feature 002 y del [ADR del modelo de rutinas](004-modelo-rutinas-formato-v4.md)).
- Las pruebas no dependen del reloj real ni del azar real; la lógica debe ser portable y sin motor gráfico (ADR-001 del generador).
- 60 cuadros por segundo con 8 familiares en ruta y 4 mascotas en el teléfono Android de referencia.
- Los pasillos laterales tienen **una casilla de ancho** (`#.#`) y las puertas son de una casilla: con la regla actual de no entrar nunca en una casilla ocupada, dos familiares que caminan en sentidos opuestos por un pasillo se bloquean para siempre.

## Options Considered

### Option A: Objetivo derivado del reloj, rutas por búsqueda en anchura y paso a través mientras se camina en ruta

Una función pura deriva, de la rutina y de `ahora` (fecha y minuto locales inyectados), el objetivo de cada familiar: un espacio, `fuera` o `libre`. El módulo `movimiento` gana, para cada familiar con objetivo, una ruta calculada sobre las casillas transitables de la distribución, y la recorre. Mientras camina en ruta no lo detienen los otros habitantes (puede pasar por su casilla), pero sí el jugador. Al llegar a su espacio vuelve a caminar al azar, solo dentro de ese espacio.

**Pros:** amplía el ADR-002 en el punto que dejó previsto, sin cambiar las reservas ni la animación; el objetivo no se guarda y siempre es el correcto al abrir la app, igual que el estado del ADR-003; el paso a través elimina los bloqueos en pasillos de una casilla, y con él el tiempo de llegada queda acotado por la longitud de la ruta, lo que se prueba de forma automática; es un recurso habitual en juegos de vista cenital (por ejemplo, los vecinos de *Stardew Valley* se atraviesan al caminar).
**Cons:** relaja una invariante del ADR-002 (dos habitantes nunca en la misma casilla) para los familiares en ruta: dos personajes pueden dibujarse superpuestos un instante; hay que calcular rutas y mantenerlas al día cuando cambia el mapa.

### Option B: Objetivo derivado del reloj, rutas y retroceso sin superposición

Igual que A en el objetivo y las rutas, pero nadie entra nunca en una casilla ocupada. Un familiar bloqueado más de 1 s recalcula la ruta tratando a los demás habitantes como paredes y, si no hay ruta, da un paso a una casilla libre al azar y vuelve a intentar.

**Pros:** conserva intacta la invariante del ADR-002; nunca hay personajes superpuestos.
**Cons:** en un pasillo de una casilla el único paso libre es retroceder, así que dos familiares enfrentados se desatascan solo por azar y pueden tardar mucho en un pasillo largo; el tiempo de llegada no queda acotado y no se puede afirmar en una prueba sin depender de la semilla; agrega estados (bloqueado, retrocediendo) y temporizadores al módulo.

### Option C: Reaparecer en el lugar del bloque, sin rutas

Al cambiar de bloque, el familiar desaparece y vuelve a aparecer dentro del espacio de su nuevo bloque, o desaparece si es fuera de casa.

**Pros:** no hay rutas ni bloqueos; cambia muy poco el módulo actual.
**Cons:** nadie sale caminando por la entrada, que es lo que el PRD eligió para mostrar quién está fuera; el mapa se siente menos vivo, en contra del principio 2 de la fundación ("el juego es el medio"); un personaje que se desvanece a la vista del jugador parece un fallo.

## Decision

**We chose Option A (objetivo derivado del reloj, rutas por búsqueda en anchura y paso a través en ruta)** porque es la única que muestra a los familiares caminando hasta su lugar y saliendo por la entrada, como pide el PRD, sin bloqueos en los pasillos de una casilla y con un tiempo de llegada acotado que se verifica en pruebas automáticas. La opción B no garantiza la llegada; la opción C no cumple el comportamiento elegido.

Reglas que fija la decisión:

- **El reloj se inyecta como `ahora = { fecha, minuto }`:** `fecha` es el texto `AAAA-MM-DD` del calendario local (el mismo `hoy` del ADR-003) y `minuto` es el minuto local del día, de 0 a 1439. El día de la semana se deriva de `fecha` con una función pura sobre sus partes, sin hora ni zona horaria. Lunes a viernes usan el horario `laborables`; sábado y domingo, `finde`. Ningún módulo de dominio lee el reloj por su cuenta. Se siguen usando días del calendario y minutos locales, no instantes: el ADR-003 no se reemplaza, se amplía con el minuto.
- **Objetivo:** una función pura devuelve, para un familiar y un `ahora`, `{ espacioId }` si un bloque activo de su horario cubre ese minuto y apunta a un espacio, `fuera` si apunta a fuera de casa, y `libre` si ningún bloque lo cubre. Solo los familiares tienen objetivo: las mascotas siguen moviéndose al azar como en el ADR-002, y el personaje del propietario lo mueve el jugador.
- **Cambio de minuto:** la presentación compara en cada cuadro el `ahora` actual con el último usado, igual que hace con `hoy`, y al cambiar vuelve a derivar los objetivos; también al volver a primer plano.
- **Entrada:** la distribución gana un campo `entrada: { x, y }`, una casilla de puerta en la pared inferior de la sala, debajo de la casilla de aparición. Es transitable y pertenece a la sala; no lleva a ninguna parte (no hay casillas transitables fuera del hogar).
- **Rutas:** búsqueda en anchura sobre las casillas transitables de la distribución (solo el mapa, sin los personajes), desde la casilla del familiar hasta la casilla más cercana de su espacio objetivo (`espacioEn` igual a su id) o hasta la entrada. Se exploran las direcciones en un orden fijo, así que la misma entrada da la misma ruta. Se calcula solo cuando cambia el objetivo o la distribución, no en cada cuadro.
- **Estados de un familiar en movimiento** (de sesión, no se guardan):
  - **libre:** camina al azar por toda la casa, como en el ADR-002.
  - **en ruta:** al cambiar su objetivo, el familiar cancela la pausa o el tramo al azar que tuviera en curso (termina, eso sí, el paso que ya empezó) y sigue su ruta a 2 casillas por segundo; el tiempo de llegada se cuenta desde ese momento. **Puede entrar en una casilla ocupada o reservada por otro habitante**; no entra en la casilla del jugador ni en la que el jugador está a punto de ocupar: si el jugador le cierra el paso, espera (el jugador siempre puede apartarse). Mientras está en ruta sigue ocupando su casilla para el jugador y para los habitantes que caminan al azar, que lo evitan como hoy.
  - **en su espacio:** al llegar a una casilla de su espacio que no ocupa otro habitante, camina al azar como en el ADR-002 pero solo por casillas de ese espacio. Si llega a una casilla ocupada, sigue en ruta hasta una libre del espacio. Si el espacio no tiene ninguna casilla libre, espera en la casilla libre más cercana fuera de él y vuelve a intentarlo cuando se libera una.
  - **fuera:** al llegar a la entrada desaparece del mapa y deja de ocupar casillas. Cuando su objetivo deja de ser `fuera`, reaparece en la entrada (si la entrada está ocupada, espera fuera del mapa hasta que se libere) y pasa a **en ruta** o a **libre**.
- **Aparición** (al abrir la app y al salir del modo edición, que es cuando el ADR-002 ya recoloca a los habitantes): un familiar con objetivo de espacio aparece en una casilla libre de ese espacio elegida con el azar inyectado; si no hay ninguna, en la casilla libre más cercana fuera de él. Un familiar con objetivo `fuera` no aparece. Uno `libre` aparece como en el ADR-002. Nadie recorre el camino que no se vio.
- **Modo edición:** los habitantes se quedan quietos, como en el ADR-002. Los cambios de rutina hechos en el modo edición se aplican al salir de él, con la aparición.
- **Cambio del mapa en modo edición** (un espacio eliminado, una distribución nueva): al salir del modo edición se recalculan objetivos, rutas y aparición; ningún familiar queda con una ruta de la distribución anterior.

## Consequences

**Más fácil:**
- Probar sin interfaz, con un `ahora` fijo y un azar reproducible: que cada familiar llega a su espacio o a la entrada en un tiempo no mayor que (longitud de su ruta + 1) por 500 ms, contado desde que cambia su objetivo y cuando el jugador no le cierra el paso (el "+ 1" cubre el paso que ya había empezado); que nadie pisa paredes ni muebles; que los habitantes que caminan al azar siguen sin superponerse; y que un familiar fuera no ocupa casillas.
- Cambiar la política de movimiento sin tocar las reservas ni la animación, y portar el módulo al stack oficial; solo se reescribe el dibujo.
- Reutilizar la misma ruta en piezas futuras (por ejemplo, ir hasta el espacio de una actividad).

**Más difícil:**
- La invariante del ADR-002 "dos habitantes nunca en la misma casilla" pasa a valer solo entre habitantes que no están en ruta. Las pruebas del módulo deben distinguir los dos casos, y la presentación debe dibujar sin parpadeos a dos personajes en la misma casilla.
- La presentación debe pasar `ahora` de forma consistente y no olvidar el cambio de minuto con la app abierta.
- El jugador puede cerrarle el paso a un familiar en un pasillo de una casilla de forma indefinida; es una acción voluntaria del jugador y se acepta.
- En el cambio de horario de verano un minuto local puede repetirse o no existir; el objetivo se deriva igual del minuto local y el efecto es, a lo sumo, un bloque que dura una hora más o menos ese día.
- El rendimiento con 8 familiares en ruta a la vez, las rutas y los dibujos superpuestos se verifican en el teléfono con el indicador de cuadros por segundo, no con pruebas automáticas.

**A revisar si este ADR es reemplazado:** si una pieza futura necesitara que los personajes nunca se superpongan, o rutas que tengan en cuenta a los demás personajes, habría que pasar a una búsqueda con ocupación y a una política de prioridad entre familiares. El contrato del módulo (distribución, ocupación, objetivos, azar y `ahora` como entrada; la siguiente acción de cada habitante como salida) debería mantenerse.
