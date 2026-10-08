# ADR-005-jugador-activo-movimiento-unificado: Jugador activo como estado del dispositivo y movimiento unificado de los miembros

**Status:** Accepted
**Date:** 2026-10-08
**Feature:** 005-jugador-activo-e-intercambios

## Context

Hasta la feature 004 el personaje del mapa es siempre el del propietario: la cruceta lo mueve, se guarda su posición en `livin:posicion:v1` y es el único miembro que no camina solo. Los familiares y las mascotas son "móviles" ([ADR-002 de movimiento](002-movimiento-habitantes-modulo-puro.md)) y los familiares siguen su rutina ([ADR-004 de movimiento](004-movimiento-hacia-objetivo-reloj.md)).

Esta feature hace que varias personas compartan un mismo teléfono: un selector "Juega: <nombre>" cambia quién actúa y quién es el personaje del mapa. Requisitos del PRD que condicionan la decisión:

- Pueden jugar el propietario y los familiares; las mascotas no.
- Al cambiar de jugador, el nuevo toma el control desde donde está, sin teletransportarse, y el anterior sigue caminando solo desde su casilla.
- Mientras alguien juega, su rutina queda en pausa; al dejar de jugar la retoma. El propietario no tiene rutina y, cuando no juega, camina al azar como las mascotas.
- Un familiar que está fuera de casa se puede elegir: aparece en la entrada.
- Al cerrar y reabrir la app sigue jugando la misma persona, en su posición.
- La pieza futura de multiusuario dará a cada persona su propio dispositivo y cuenta; no debe haber que deshacer lo que se decida aquí.
- No se puede romper lo verificado en el teléfono: 60 cuadros por segundo con 8 familiares, 4 mascotas y 50 actividades.

## Options Considered

### Option A: Jugador en la clave del dispositivo; todos los miembros salvo el jugador son móviles

Se agrega un campo `jugadorId` al documento de `livin:posicion:v1`, que ya es estado del teléfono y que pasa a guardar la posición de quien juega. Un documento sin ese campo significa "juega el propietario". El módulo de movimiento no cambia de contrato: recibe los ids de los móviles (propietario y habitantes menos el jugador) y los objetivos de rutina de los familiares; el propietario no tiene objetivo y se mueve como `libre`.

**Pros:** "quién juega" es una propiedad del teléfono, igual que la posición; no hay migración del documento del hogar ni de la posición (el campo es opcional); el multiusuario no tiene que deshacer nada, porque cada dispositivo tendrá su jugador; el módulo `movimiento` se reutiliza tal cual.
**Cons:** la posición y el jugador viven en el mismo registro; si se borra esa clave, vuelve a jugar el propietario en la aparición de la sala.

### Option B: Jugador en el documento del hogar (campo nuevo en la versión 5)

**Pros:** un solo documento guardado.
**Cons:** el hogar compartiría un único jugador activo, lo contrario de lo que hará el multiusuario; el cambio de jugador reescribiría el documento del hogar; entra en la migración v4→v5 sin necesidad.

### Option C: No guardar el jugador; al abrir juega siempre el propietario

**Pros:** el más simple; sin campo nuevo.
**Cons:** contradice lo elegido (sigue jugando la misma persona al reabrir) y obliga a repetir el cambio cada vez en un teléfono compartido.

### Option D: El personaje del mapa es siempre el del propietario; el jugador activo es solo la identidad con la que se actúa

**Pros:** el movimiento no cambia; no hay móviles nuevos.
**Cons:** quien juega no se ve en el mapa ni puede caminar por la casa, que es el núcleo del juego; contradice lo elegido.

## Decision

**We chose Option A (jugador en la clave del dispositivo, todos los miembros salvo el jugador como móviles)** porque es la única que conserva la continuidad al reabrir sin acoplar el hogar a un dispositivo, y reutiliza el módulo de movimiento sin cambiar su contrato.

Reglas que fija la decisión:

- **Quién puede jugar:** el propietario y los familiares activos. Si el `jugadorId` guardado no corresponde a uno de ellos, juega el propietario.
- **Posición guardada:** `{ clave, dx, dy, direccion, jugadorId }`. La posición es la de `jugadorId`. Se guarda al cambiar de jugador y en los momentos en que ya se guardaba. Un documento sin `jugadorId` es el del propietario.
- **Móviles:** los ids que se pasan al módulo de movimiento son los del propietario y los habitantes, sin el jugador. El propietario no tiene objetivo (`libre`): camina al azar por toda la casa. Un familiar que no juega recupera su objetivo de rutina.
- **Cambio de jugador:**
  1. El jugador actual pasa a ser un móvil en la casilla en que está, con su objetivo (el de su rutina si es un familiar; `libre` si es el propietario). Si su objetivo es `fuera`, camina a la entrada y sale como hoy.
  2. El nuevo jugador se retira de los móviles y pasa a ser el personaje del mapa en la casilla en que estaba (o a la que se dirigía), sin teletransporte.
  3. Un familiar que está fuera de casa aparece como jugador en la entrada. Si la entrada está ocupada, en la casilla libre más cercana por camino.
  4. Nadie queda en la casilla de otro; el nuevo jugador nunca comparte casilla con un móvil.
- **Pausa de la rutina:** quien juega no tiene objetivo. No hay estado de pausa guardado: es consecuencia de no estar entre los móviles.
- **Modo edición:** los móviles quedan quietos como hoy; el personaje del jugador, también. Tocar a cualquier miembro (jugador, propietario, familiar o mascota) abre su ficha.
- **Baja del jugador:** si se elimina a quien juega, juega el propietario, que toma la casilla donde estaba como móvil.
- **Cambio con la app cerrada:** al abrir, el jugador guardado ocupa su posición guardada aunque su rutina diga `fuera`; la rutina vuelve a regir cuando deja de jugar.

## Consequences

**Más fácil:**
- `movimiento.js` queda como está: solo cambia qué ids recibe y cómo se construye el móvil del jugador saliente.
- El multiusuario puede reemplazar el selector por la cuenta del dispositivo sin tocar el hogar guardado.
- Probar el cambio de jugador sin interfaz: dado un estado, un jugador y un cambio, el resultado son un jugador nuevo y una lista de móviles.

**Más difícil:**
- Hay que construir un móvil a partir del jugador saliente (con su dirección y su objetivo) y viceversa, y probar los casos del familiar fuera, de la entrada ocupada y de la baja del jugador.
- La ficha del propietario ya no se abre "al tocar al jugador", sino al tocar al propietario donde esté; el orden de prioridad al tocar en modo edición debe actualizarse.
- El número de móviles no crece (siempre es uno menos que los miembros, como máximo 12), pero ahora cualquiera de los familiares puede estar quieto como jugador y el propietario caminar solo; el rendimiento con 8 familiares en ruta se vuelve a medir en el teléfono.
- El mapa, con otro jugador, no lleva ninguna marca visible de quién juega, hasta que la spec la fije.

**A revisar si este ADR es reemplazado:** si el multiusuario trae jugadores en dispositivos distintos al mismo tiempo, este modelo (un único jugador por dispositivo) se mantiene; lo que cambiará es de dónde sale el `jugadorId`.
