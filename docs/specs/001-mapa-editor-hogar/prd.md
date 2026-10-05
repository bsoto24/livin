# PRD: Mapa y editor del hogar

**Date:** 2026-10-04
**Feature:** 001-mapa-editor-hogar

## Problem

Las tareas del hogar suelen gestionarse con listas o chats que nadie disfruta revisar, y no muestran de un vistazo cómo está la casa ni quién se encarga de qué. El proyecto propone gestionar las actividades del hogar a través de un videojuego 2D estilo Pokémon Esmeralda, donde la casa real del usuario aparece como un mapa que se puede recorrer.

Esta feature construye la base de todo lo demás: un mapa 2D que reproduce la composición del hogar del usuario, que se puede recorrer con un personaje y que se reconfigura al instante cuando el usuario agrega, quita o renombra espacios. Sin un mapa fiel y editable, ninguna de las piezas posteriores (familiares, rutinas, actividades) tiene dónde ocurrir.

## Users & Context

**Usuario de la v1:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Configura su hogar y recorre el mapa con su personaje.

**Usuarios futuros:** los demás miembros del hogar tendrán su propia cuenta y usarán el videojuego en su dispositivo. Esta feature no implementa nada de eso, pero el modelo de datos queda preparado (ver ADR de modelo de datos).

**Lugar en el proyecto.** El proyecto se dividió en piezas independientes, cada una con su propio ciclo de brainstorm y spec:

1. **Mapa y editor del hogar (esta feature).**
2. Familiares y mascotas: creación, parentesco, género, renderizado con movimiento aleatorio.
3. Rutinas: movimiento con sentido según horario, incluido el estado "fuera de casa".
4. Actividades: asignación a un miembro (obligatorio) y a un espacio (opcional), estados y estado visual del espacio (limpio, desordenado, desastre).
5. Capa social: negociación de intercambios y calificación con estrellas.

**Plataforma.** El stack oficial no está decidido. Esta feature se implementará primero como PoC desechable en web con Phaser 3, para probarla en el navegador de un celular Android. Las métricas de rendimiento de la PoC servirán de evidencia para un ADR posterior que elegirá el stack oficial. El modelo y el generador de distribución deben escribirse como lógica pura, sin dependencias del motor, para poder portarlos.

**Estilo visual.** Vista cenital, tiles de 16 px y caminata en 4 direcciones, al estilo GBA. Se usa arte original o de licencia libre (por ejemplo, CC0). No se usan sprites ni recursos de Pokémon. La app se usa solo en orientación vertical.

**Sistemas existentes:** ninguno. Es la primera feature del proyecto.

## Goals

**Principio rector:** ningún espacio se crea, elimina ni modifica como efecto secundario de otra acción, sea sobre una persona o sobre otro espacio. Solo cambia el espacio que el usuario modifica explícitamente. La única excepción es el baño interno de un cuarto eliminado cuando no hay otro cuarto que pueda recibirlo (ver objetivo 4).

1. **Hogar inicial.** En el primer arranque, sin onboarding, se crea un hogar mínimo con sala, cocina, baño común y 1 dormitorio, y un personaje llamado "Personaje 1" ubicado en la sala.

2. **Catálogo de tipos de espacio.** Hay ocho tipos de espacio, descritos como datos de catálogo (zona, límites, pieza dibujada, si admite baño interno) y no como código. Así se pueden agregar tipos en el futuro sin modificar el generador:

   | Espacio | Mín. | Máx. | Zona | Admite baño interno |
   |---|---|---|---|---|
   | Sala | 1 | 1 | Centro | No |
   | Comedor | 0 | 1 | Centro, sobre la sala | No |
   | Cocina | 1 | 2 | Servicio (izquierda) | No |
   | Baño | 1 | 1 + dormitorios + oficinas | Ver regla de baños | — |
   | Lavandería | 0 | 2 | Servicio (izquierda) | No |
   | Espacio de mascota | 0 | 2 | Servicio (izquierda) | No |
   | Dormitorio | 1 | 4 | Privada (derecha) | Sí |
   | Oficina | 0 | 2 | Privada (derecha) | Sí |

3. **Reglas de distribución.** El mapa se genera con piezas prediseñadas por tipo de espacio, ensambladas según reglas fijas:
   - **Centro:** la sala. Si hay comedor, va directamente encima de la sala y forman un espacio continuo, sin pared ni puerta entre ambos (sala-comedor).
   - **Zona de servicio (a la izquierda del centro):** apilada de arriba hacia abajo en este orden: cocina(s), baño común, lavandería(s) y espacio(s) de mascota.
   - **Zona privada (a la derecha del centro):** apilada de arriba hacia abajo en este orden: dormitorios (1 a 4) y luego oficinas (1 a 2).
   - **Pasillos:** si una zona lateral tiene 2 espacios o menos, cada uno tiene una puerta que da directamente a la sala o sala-comedor. Si tiene más de 2, se genera un pasillo entre esa zona y el centro; todas las puertas de la zona dan al pasillo y el pasillo se abre al centro. Los baños internos no cuentan para este umbral.
   - **Determinismo:** el mismo estado guardado (los espacios y qué cuarto contiene cada baño interno) produce siempre el mismo mapa.
   - **Un solo mapa:** toda la casa es un único mapa continuo; las puertas son casillas transitables y no hay pantallas de transición entre espacios.

4. **Regla de baños.** Hay un único contador de baños.
   - Siempre existe exactamente un baño común, ubicado en la zona de servicio. No se puede eliminar.
   - Los demás baños son internos: cada uno está dentro de un dormitorio u oficina, tiene puerta solo hacia ese cuarto y se guarda qué cuarto lo contiene.
   - **+** crea un baño interno dentro del primer dormitorio u oficina sin baño, en este orden: Dormitorio 1, 2, 3, 4 y luego Oficina 1, 2. Se desactiva si todos los dormitorios y oficinas ya tienen baño, de modo que el contador nunca supera 1 + dormitorios + oficinas.
   - **−** elimina el baño interno creado más recientemente. Se desactiva si solo queda el baño común.
   - Un baño interno concreto también se puede eliminar desde su ficha (objetivo 7).
   - Al eliminar un dormitorio u oficina que contiene un baño interno:
     - si existe algún dormitorio u oficina sin baño, el baño se mueve dentro del primero de ellos en el orden anterior y conserva su identidad y su nombre personalizado;
     - si no existe ninguno, el baño se elimina junto con el cuarto.
   - Ninguna otra acción mueve un baño: eliminar o agregar un cuarto no reacomoda los baños de los demás cuartos.

5. **Mobiliario fijo con colisiones.** Cada pieza trae mobiliario genérico que bloquea el paso y que el usuario no puede editar:
   - Dormitorio: cama y velador.
   - Sala: sofá y mesa de centro.
   - Comedor: mesa con sillas.
   - Cocina: cocina, refrigeradora y lavadero.
   - Baño: inodoro, lavamanos y ducha.
   - Oficina: escritorio y silla.
   - Lavandería: lavadora.
   - Espacio de mascota: cama de mascota y plato.

   El mobiliario nunca bloquea una puerta ni deja casillas transitables aisladas dentro de la pieza.

6. **Navegación (modo exploración).**
   - Cruceta virtual en pantalla, abajo a la izquierda. En escritorio, también las flechas del teclado.
   - El movimiento es por casilla: cada toque avanza una casilla y mantener presionado camina de forma continua.
   - Paredes, mobiliario y bordes del mapa bloquean el paso.
   - La cámara sigue al personaje.
   - Un botón "Editar", arriba a la derecha, abre el modo edición.

7. **Modo edición.**
   - La cámara se aleja hasta mostrar el hogar completo y el personaje queda inmóvil.
   - Un panel inferior muestra un contador por tipo de espacio con botones − y +. Los botones se desactivan al alcanzar el mínimo o el máximo. El contador de baños indica qué espacio recibirá el siguiente baño (por ejemplo, "Siguiente: Dormitorio 2").
   - **+** agrega un espacio al final de su tipo. **−** quita el último espacio de su tipo. El contador de baños sigue su propia regla (objetivo 4).
   - Cada cambio regenera y muestra el mapa de inmediato, sin confirmación.
   - Tocar un espacio en el mapa abre una ficha con **Renombrar** y **Eliminar**. Eliminar quita ese espacio en particular y no está disponible si su tipo ya está en el mínimo ni para el baño común. Si el espacio es un dormitorio u oficina con baño interno, su baño se trata según el objetivo 4. Pide confirmación solo si el espacio tiene nombre personalizado.
   - Al eliminar un espacio, los demás de su tipo se renumeran (los nombres automáticos se recalculan), pero conservan su identidad y su nombre personalizado, si lo tienen.
   - Tocar el personaje abre la opción de renombrarlo.
   - El botón **Listo** vuelve al modo exploración con la cámara siguiendo de nuevo al personaje.

8. **Nombres.**
   - Cada espacio tiene un nombre automático calculado a partir de su tipo y su posición ("Dormitorio 2", "Baño 1") y un nombre personalizado opcional ("Cuarto de Bryam"). Se muestra el personalizado cuando existe. Si se vacía, vuelve a mostrarse el automático.
   - El nombre de un baño interno es automático y se calcula a partir de su número ("Baño 2"), mientras no tenga nombre personalizado.
   - El personaje tiene un nombre editable ("Personaje 1" → "Diana").
   - Los nombres visibles son únicos sin distinguir mayúsculas, por separado entre espacios y entre miembros del hogar, y tienen un máximo de 20 caracteres. Un nombre personalizado no puede coincidir con el nombre visible de otro espacio ni tener el formato de un nombre automático ("<tipo> <número>", por ejemplo "Dormitorio 3"). Así, la renumeración tras una eliminación nunca puede producir dos espacios con el mismo nombre.

9. **Persistencia local.**
   - El hogar, sus espacios, sus nombres y el personaje se guardan en el dispositivo y se restauran al volver a abrir la app.
   - La posición del personaje se guarda relativa a un espacio: UUID del espacio, casilla contada desde la esquina de ese espacio y dirección en la que mira.
   - La posición se guarda cuando el personaje se detiene después de caminar, al entrar en modo edición y cuando la app pasa a segundo plano.
   - Si la posición guardada deja de ser válida (el espacio se eliminó, la casilla quedó ocupada o el pasillo desapareció), el personaje aparece en la sala. Esto también se verifica al salir del modo edición.

10. **Modelo de datos preparado para multiusuario.** El modelo separa cuenta, hogar, membresía, espacio y miembro, con UUID, fechas, autoría y borrado lógico, según el ADR de modelo de datos. La posición del personaje es estado exclusivo del dispositivo.

## Non-Goals

- No permite crear familiares ni mascotas. El único miembro es el personaje del usuario.
- No mueve personajes de forma autónoma ni tiene noción de horario.
- No gestiona actividades ni muestra estados de limpieza de los espacios.
- No incluye inicio de sesión, cuentas reales, servidor ni sincronización.
- No aplica permisos por rol.
- No permite editar mobiliario ni elegir otra distribución distinta de las reglas definidas.
- No define el stack oficial.

## Success Criteria

1. **Mapas correctos y navegables.** Para todas las combinaciones permitidas por el catálogo, de contadores y de qué dormitorios y oficinas contienen un baño interno:
   - cada espacio es alcanzable caminando desde la sala;
   - ninguna puerta queda bloqueada por mobiliario;
   - ninguna pieza se superpone con otra;
   - cada baño interno está dentro del cuarto que lo contiene y solo es accesible desde él.

   Se verifica de forma exhaustiva y automática, generando todas las combinaciones.
2. **Se siente como un juego de GBA.** El movimiento del personaje se mantiene a 60 cuadros por segundo en el navegador de un teléfono Android de gama media.
3. **Edición instantánea.** El mapa se regenera y se muestra en menos de 100 ms después de cada cambio de contador, renombre o eliminación.
4. **El hogar se conserva.** Al cerrar y volver a abrir la app se restauran los mismos espacios, los nombres personalizados, el nombre del personaje y su posición y dirección, o la sala si la posición dejó de ser válida.
5. **Determinismo.** El mismo estado guardado produce siempre un mapa idéntico, casilla por casilla.
6. **Sin efectos secundarios.** Ninguna acción crea, elimina o mueve un espacio distinto del que el usuario modificó, salvo la excepción del baño interno definida en el objetivo 4.

## Architecture Decisions

- [Generador de distribución con piezas prediseñadas y reglas de ensamblaje](../../adr/001-generador-distribucion-piezas-reglas.md) — el mapa se arma con piezas dibujadas a mano por tipo de espacio y reglas fijas de zona, en vez de generación procedural. Así es determinista, verificable de forma exhaustiva y portable. Fija además la separación en modelo, generador puro y renderizador intercambiable.
- [Modelo de datos local-first preparado para multiusuario](../../adr/001-modelo-datos-local-first-multiusuario.md) — todo es local en la v1, pero con UUID, separación entre miembro y cuenta, membresía con rol, fechas, autoría y borrado lógico, para que la sincronización futura no exija migrar datos.

Decisiones menores que no requieren ADR y quedan registradas aquí:

- **PoC en Phaser 3 (web).** Es un spike desechable. El stack oficial se decidirá en un ADR posterior a la PoC.
- **Movimiento por casilla con cruceta.**
- **Mobiliario fijo por tipo de espacio.**
- **Límites del hogar típico.**
- **Modo edición con la cámara alejada.**
- **Orientación solo vertical.**

## Out of Scope

| Excluido de esta feature | Dónde o cuándo se resuelve |
|---|---|
| Crear familiares y mascotas (parentesco, género) | Pieza 2 |
| Rutinas y movimiento según horario | Pieza 3 |
| Actividades (miembro obligatorio, espacio opcional) y estado limpio/desordenado/desastre | Pieza 4 |
| Negociar intercambios y calificar con estrellas | Pieza 5 |
| Inicio de sesión, cuentas reales, sincronización y backend | Pieza de multiusuario |
| Permisos por rol (propietario frente a miembro) | Pieza de multiusuario |
| Resolución de ediciones simultáneas desde varios dispositivos | Pieza de multiusuario |
| Más de un hogar por cuenta | Futuro (el modelo lo permite) |
| Personalizar, mover o agregar muebles | Futuro |
| Mover espacios a mano o elegir otra distribución | Futuro |
| Variantes visuales de cada pieza | Futuro |
| Tipos de espacio adicionales y editor de tipos | Futuro (vía catálogo) |
| Transiciones entre espacios, zoom con gestos y modo horizontal | Futuro |
| Arte definitivo | Futuro |
| Sonido y música | Futuro |
| Elección del stack oficial | ADR posterior a la PoC |

Requisito ya conocido para la pieza 4, registrado para no perderlo: una actividad se asigna a un miembro (obligatorio, no a la cuenta) y opcionalmente a un espacio. Para esa pieza quedan abiertos qué ocurre con una actividad cuando se elimina su espacio y que el estado visual de un espacio solo considera las actividades vinculadas a él.
