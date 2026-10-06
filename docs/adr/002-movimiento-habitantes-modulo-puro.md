# ADR-002-movimiento-habitantes-modulo-puro: Movimiento aleatorio de los habitantes como módulo puro con azar inyectado

**Status:** Accepted
**Date:** 2026-10-05
**Feature:** 002-familiares-y-mascotas

## Context

Los familiares y las mascotas caminan solos por el hogar mientras el usuario está en modo exploración. Requisitos del PRD que condicionan la decisión:

- Caminan casilla a casilla por cualquier casilla transitable, cruzando puertas y pasillos, y no atraviesan paredes, muebles, a otro habitante ni al jugador.
- Alternan pausas con tramos de caminata, a menor velocidad que el jugador.
- Su posición no se guarda: al abrir la app y al volver del modo edición reaparecen en casillas libres al azar. En modo edición están quietos.
- Hasta 12 personajes en movimiento (8 familiares y 4 mascotas) sin bajar de 60 cuadros por segundo en un teléfono Android de los últimos 3 años.
- La pieza 3 (rutinas) hará que los habitantes se muevan con sentido según el horario, así que la forma de decidir el siguiente paso va a cambiar.

El [ADR-001 del generador](001-generador-distribucion-piezas-reglas.md) fija una arquitectura de tres capas portables: modelo, generador puro y renderizador, y exige que la lógica de reglas no dependa del motor gráfico. La capa de presentación de la PoC (Phaser) no tiene pruebas automáticas.

## Options Considered

### Option A: Módulo puro con azar inyectado

Un módulo `movimiento` decide el siguiente paso de cada habitante a partir de la distribución, de las casillas ocupadas o reservadas y de una función `azar()` que recibe como parámetro. Phaser solo anima el desplazamiento y avisa cuando termina.

**Pros:** coherente con el ADR del generador (capas portables); se prueba con un azar reproducible, verificando invariantes (nunca pisa una pared, un mueble, otro habitante ni al jugador; nunca sale del mapa; libera las reservas); las rutinas de la pieza 3 pueden reemplazar solo la política de elección del siguiente paso.
**Cons:** hay que modelar con cuidado las reservas de casilla; el módulo no incluye la animación, que sigue sin pruebas automáticas.

### Option B: Lógica dentro de la escena de Phaser

Cada personaje decide su siguiente paso en la escena, con las utilidades de azar del motor.

**Pros:** menos archivos y menos código de unión con el motor.
**Cons:** las reglas de colisión quedan sin pruebas automáticas; rompe la separación del ADR del generador y la portabilidad de la lógica; las rutinas obligarían a reescribirla.

### Option C: Recorridos precalculados por semilla

Cada habitante sigue un recorrido calculado de antemano a partir de su identificador.

**Pros:** determinista y fácil de probar.
**Cons:** el movimiento se vuelve repetitivo y predecible, lo contrario de lo que pide el PRD; no resuelve las colisiones con el jugador, que se mueve de forma impredecible; las rutinas lo reemplazarían por completo.

## Decision

**We chose Option A (módulo puro con azar inyectado)** porque es la única opción que mantiene la lógica de colisiones y de elección de pasos con pruebas automáticas, respeta la separación de capas del ADR del generador y deja un único punto de sustitución para las rutinas de la pieza 3.

Comportamiento que fija la decisión (valores de partida; se ajustan con evidencia en un teléfono):

- Cada habitante alterna **pausas** de 1 a 4 s con **tramos** de 1 a 6 casillas en una dirección elegida al azar entre las libres, deteniéndose al encontrar un obstáculo.
- Camina a **2 casillas por segundo**, la mitad que el jugador.
- **Reserva** la casilla de destino antes de moverse y la libera al llegar; no entra en una casilla ocupada o reservada por otro habitante ni en la del jugador (incluida la que el jugador está a punto de ocupar). Si está bloqueado, espera.
- **Los habitantes son obstáculos para el jugador:** el paso del jugador deja de poder entrar en una casilla ocupada o reservada por un habitante. La función de paso del jugador recibe, además de la distribución, el conjunto de casillas ocupadas o reservadas. Si un habitante está en una puerta de una casilla, el jugador espera.
- **Aparición:** al abrir la app y al salir del modo edición, cada habitante ocupa una casilla transitable libre elegida al azar, distinta de la de los demás y de la del jugador.
- **En modo edición los habitantes no se mueven y siguen visibles** donde estaban. Un habitante recién creado ocupa una casilla libre al azar. Cuando un cambio del mapa deja la casilla de un habitante inválida u ocupada, solo ese habitante pasa a otra casilla libre al azar; los demás no se mueven.
- **La función de azar se inyecta:** en la app es el generador del navegador y en las pruebas es uno reproducible.

La prioridad al tocar una casilla en modo edición (personaje del propietario, luego habitante, luego espacio) es una regla de presentación y se fija en la spec, no en esta decisión.

## Consequences

**Más fácil:**
- Probar el movimiento sin interfaz, incluido un recorrido largo con muchos habitantes comprobando las invariantes.
- Cambiar la política de movimiento en las rutinas de la pieza 3 sin tocar las reservas ni la animación.
- Portar el módulo al stack oficial; solo se reescribe la animación.

**Más difícil:**
- La función de paso del jugador de la feature 001 deja de depender solo de la distribución: debe consultar también la ocupación. Eso amplía un comportamiento ya implementado y probado, y sus pruebas deben ampliarse.
- Mantener sincronizados el estado lógico (casillas reservadas) y la animación del motor: si la animación se interrumpe, las reservas deben liberarse.
- La animación y la cantidad de personajes en pantalla se verifican a mano y con la medición de cuadros por segundo del indicador, no con pruebas automáticas.

**A revisar si este ADR es reemplazado:** si las rutinas necesitaran rutas largas con búsqueda de caminos entre espacios, habría que ampliar el módulo con un cálculo de recorrido. El contrato de entrada (distribución, ocupación, azar) y de salida (siguiente acción de cada habitante) debería mantenerse.
