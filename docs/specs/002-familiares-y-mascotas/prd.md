# PRD: Familiares y mascotas

**Date:** 2026-10-05
**Feature:** 002-familiares-y-mascotas

## Problem

El hogar de Livin hoy tiene un único habitante: el personaje del propietario. Pero la idea del proyecto es gestionar las tareas del hogar a través de un videojuego donde el hogar real aparece como un mapa vivo, y un hogar real lo habitan varias personas y, a menudo, mascotas. Sin ellos, el mapa se ve vacío y no hay a quién asignar nada: las rutinas (pieza 3) y las actividades (pieza 4) necesitan primero que existan los familiares y las mascotas.

Esta feature agrega esa base: el usuario registra a los familiares (con su parentesco y género) y a las mascotas (con su especie), y los ve caminar solos por su casa.

## Users & Context

**Usuario de la v1:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Es quien registra a los demás habitantes; ellos no tienen cuenta ni usan la app.

**Usuarios futuros:** los familiares tendrán su propia cuenta y usarán el juego en su dispositivo. Esta feature no implementa nada de eso; el modelo ya contempla miembros sin cuenta (ver el ADR de modelo de datos de la feature 001).

**Lugar en el proyecto.** Es la pieza 2 de las cinco en que se dividió el proyecto (mapa y editor del hogar → **familiares y mascotas** → rutinas → actividades → capa social). Se apoya en la feature 001, ya implementada, y deja el terreno listo para las rutinas, que reemplazarán el movimiento aleatorio por movimiento con sentido según el horario.

**Sistemas existentes que toca:**
- El **modo edición** de la feature 001: su panel gana una sección de habitantes y sus fichas se reutilizan para editar a cada uno.
- El **modelo `Miembro`** y el documento guardado: se amplían y el formato guardado cambia de versión.
- Las **etiquetas de nombre en el mapa** (feature 001, v1.1.0): cada habitante lleva su nombre encima.
- El **mapa y su distribución** (solo se leen para saber por dónde se puede caminar).

**Relación con la spec 001.** Esta feature reemplaza dos exclusiones de la 001 (que "no permite crear familiares ni mascotas" y que "no mueve personajes de forma autónoma") y amplía la lista de obstáculos para el jugador de FR-6 de la 001, que hoy son paredes, mobiliario y bordes del mapa, con los habitantes. El resto de la 001 sigue vigente sin cambios.

**Plataforma.** La PoC web sigue siendo desechable y su stack oficial no está decidido. La lógica de reglas debe seguir siendo portable, sin depender del motor gráfico.

## Goals

- El usuario puede registrar hasta **8 familiares** (además de su propio personaje), cada uno con nombre, **parentesco con el propietario** (Pareja, Hijo/a, Padre o madre, Hermano/a, Abuelo/a, Otro familiar) y **género** (Femenino, Masculino, Otro).
- El usuario puede registrar hasta **4 mascotas**, cada una con nombre y **especie** (Perro, Gato, Otro).
- Todos se gestionan en el **modo edición**: alta desde el panel, y edición o baja desde su ficha al tocarlos en el mapa.
- En modo exploración, los familiares y las mascotas **caminan solos y al azar por todo el hogar**: alternan pausas y tramos de caminata, a menor velocidad que el jugador, cruzando puertas y pasillos, sin atravesar paredes, muebles, a otro habitante ni al jugador. Valores iniciales, ajustables tras probarlos en un teléfono: pausas de 1 a 4 s, tramos de 1 a 6 casillas y 2 casillas por segundo (la mitad que el jugador).
- **Nadie se superpone con nadie, jugador incluido:** los habitantes son obstáculos para el jugador, que no puede entrar a la casilla de un habitante. Si uno está parado en una puerta de una casilla, el jugador espera a que se mueva.
- En **modo edición** los habitantes se ven **quietos** donde estaban, con su nombre. Un habitante recién creado aparece en una casilla libre al azar; si un cambio del mapa deja inválida u ocupada la casilla de alguno, pasa a otra casilla libre al azar. Al tocar una casilla, la ficha que se abre tiene esta prioridad: el personaje del propietario, luego el habitante, luego el espacio.
- Cada habitante muestra su **nombre encima**, en exploración y en edición, y un aspecto distinto según su género (personas) o su especie (mascotas).
- Los habitantes, sus nombres, parentescos, géneros y especies **se conservan entre sesiones**; su posición no.
- Los hogares ya guardados con la feature 001 **se abren sin perder datos**.
- Eliminar un habitante **pide confirmación** y conserva su registro (borrado lógico), como los espacios.

## Non-Goals

- No hay parentesco entre familiares (árbol familiar): cada uno solo se relaciona con el propietario.
- No hay rutinas ni movimiento con sentido según el horario, ni estado "fuera de casa" (pieza 3).
- No hay actividades ni estados de limpieza (pieza 4).
- No hay cuentas, inicio de sesión ni sincronización para los familiares; ninguno tiene cuenta.
- No se guarda la posición de los habitantes; no se pueden mover a mano ni colocar en un espacio concreto.
- No interactúan con los muebles ni entre sí; tocarlos en modo exploración no hace nada.
- No hay género ni parentesco para las mascotas, ni género que limite el parentesco.
- No se cambia el nombre de la casa ni se agregan tipos de espacio.

## Success Criteria

1. El usuario crea un familiar (nombre, parentesco y género) y una mascota (nombre y especie) en modo edición, y ambos aparecen en el mapa en menos de 100 ms.
2. Al tocar **Listo**, todos los habitantes aparecen en casillas libres distintas y empiezan a caminar solos; en un teléfono Android de los últimos 3 años (desde octubre de 2023) con 8 familiares y 4 mascotas en pantalla, el movimiento se mantiene a 60 cuadros por segundo.
3. Ningún habitante atraviesa una pared o un mueble, ni ocupa la casilla de otro habitante o del jugador; esto se verifica con pruebas automáticas de recorridos largos con un azar reproducible.
4. Al cerrar y reabrir la app, siguen todos los habitantes con sus nombres, parentescos, géneros y especies; su posición se reparte de nuevo.
5. Un hogar guardado con la feature 001 se abre con todos sus espacios y el nombre de su personaje, y queda guardado en el formato nuevo en el siguiente guardado.
6. No se pueden superar los límites (8 familiares y 4 mascotas) ni repetir nombres entre los habitantes (sin distinguir mayúsculas, hasta 20 caracteres), y el personaje del propietario no se puede eliminar.
7. Eliminar un habitante pide confirmación; cancelar no cambia nada; confirmar lo quita del mapa y del panel y deja su nombre libre para reutilizarse.
8. El jugador no puede entrar a la casilla de un habitante, ni ningún habitante a la del jugador; en una puerta de una casilla ocupada por un habitante, el jugador espera y puede pasar en cuanto este se aparta.
9. En modo edición, tocar a un habitante abre su ficha, y la prioridad entre personaje, habitante y espacio es siempre la misma; un habitante creado en edición es visible de inmediato y nunca comparte casilla con otro ni con el jugador.

## Architecture Decisions

- [Modelo de familiares y mascotas como miembros del hogar](../../adr/002-modelo-miembros-personas-mascotas.md) — `Miembro` se amplía con `tipo`, `parentesco`, `genero` y `especie`; el documento guardado pasa a la versión 2 con una migración pura desde la v1, porque conserva a las mascotas como miembros sin cuenta (ADR-001) y reutiliza las reglas de nombres y borrado.
- [Movimiento aleatorio de los habitantes como módulo puro con azar inyectado](../../adr/002-movimiento-habitantes-modulo-puro.md) — la elección del siguiente paso y las reservas de casilla viven en un módulo puro y probado, con el azar inyectado; Phaser solo anima. Deja un único punto de sustitución para las rutinas.

**Decisiones menores, sin ADR** (reversibles y sin alternativas con costes reales; se registran aquí):
- **Interfaz en el modo edición:** el panel gana una sección "Habitantes" con "+ Familiar" (n/8) y "+ Mascota" (n/4); cada alta abre una ficha. En exploración, tocar a un habitante no hace nada.
- **Apariencia:** rectángulos de color como el jugador, sin arte de terceros; el color depende del género en las personas y de la especie en las mascotas, que son más pequeñas.
- **Etiquetas de nombre** sobre cada habitante, como la del jugador. Con 12 personajes en movimiento puede saturarse el mapa; es lo primero a ajustar tras probarlo en un teléfono.
- **Listas cerradas:** parentescos y especies son listas fijas; no se pueden escribir valores libres.
- **Nombres:** las reglas de la feature 001 para nombres de miembros (únicos sin distinguir mayúsculas, hasta 20 caracteres, sin espacios en los extremos) se aplican a todos los habitantes a la vez, y el nombre de un habitante nuevo es obligatorio.
- **Límites:** los 8 familiares y las 4 mascotas se cuentan sobre los miembros activos; los eliminados no cuentan.
- **Ficha del propietario:** solo permite renombrar, como en la feature 001. No tiene parentesco ni género ni Eliminar.

## Out of Scope

- Árbol familiar y relaciones entre familiares.
- Rutinas, horarios y el estado "fuera de casa" (pieza 3).
- Actividades, asignaciones y estado visual de los espacios (pieza 4).
- Negociación de intercambios y calificaciones (pieza 5).
- Cuentas reales, inicio de sesión, sincronización y permisos para los familiares (pieza de multiusuario).
- Guardar la posición de los habitantes, colocarlos a mano o elegir en qué espacio viven.
- Interacción de los habitantes con los muebles o entre sí; tocarlos en exploración.
- Género o parentesco para las mascotas; más especies que Perro, Gato y Otro.
- Arte definitivo, animaciones de caminata, sonido y música.
- Más de un propietario o más de un hogar por cuenta.
