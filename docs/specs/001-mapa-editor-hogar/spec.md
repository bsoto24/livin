# Feature 001: Mapa y editor del hogar

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-04
**Branch:** `001-mapa-editor-hogar`
**Source:** [prd.md](prd.md) · [ADR generador](../../adr/001-generador-distribucion-piezas-reglas.md) · [ADR modelo de datos](../../adr/001-modelo-datos-local-first-multiusuario.md)

---

## Problem Statement

Las tareas del hogar se gestionan con listas o chats que nadie disfruta revisar, y que no muestran de un vistazo cómo está la casa. El proyecto propone gestionarlas a través de un videojuego 2D de vista cenital donde la casa real del usuario aparece como un mapa que se puede recorrer. Esta feature construye esa base: un mapa fiel a la composición del hogar, recorrible con un personaje y reconfigurable al instante, sobre el que ocurrirán todas las piezas posteriores (familiares, rutinas, actividades).

## Goals

- El usuario puede recorrer su hogar con un personaje, casilla a casilla, en un mapa que respeta paredes y mobiliario.
- El usuario puede agregar, quitar, eliminar y renombrar espacios, y cada cambio se ve en el mapa en menos de 100 ms.
- Toda combinación de espacios permitida produce un mapa en el que cada espacio es alcanzable caminando.
- Ningún espacio cambia como efecto secundario de otra acción, salvo la única excepción definida para baños internos (FR-4).
- El hogar, los nombres y la posición del personaje se conservan entre sesiones.
- Espacios y miembros tienen identidad estable, de modo que futuras features (actividades, multiusuario) puedan referenciarlos sin migrar datos.

## Non-Goals

- No permite crear familiares ni mascotas: el único miembro es el personaje del usuario.
- No mueve personajes de forma autónoma ni tiene noción de horario.
- No gestiona actividades ni muestra estados de limpieza de los espacios.
- No incluye inicio de sesión, cuentas reales, servidor ni sincronización.
- No aplica permisos por rol.
- No permite editar mobiliario ni elegir una distribución distinta de las reglas definidas.

## Users and Context

**Primary users:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión.
**Secondary users:** los demás miembros del hogar, que en features futuras tendrán su propia cuenta. En esta feature no interactúan con la app, pero el modelo de datos los contempla.
**Usage context:** sesiones cortas en el celular, en orientación vertical. El usuario configura su hogar una vez y luego lo ajusta ocasionalmente; recorre el mapa como en un juego de consola portátil.
**User mental model:** un juego estilo Pokémon de GBA: vista desde arriba, movimiento por casillas con cruceta, muebles que bloquean el paso. Vocabulario: "espacio" (cualquier ambiente del hogar), "cuarto" (dormitorio u oficina), "baño común", "baño interno" (baño dentro de un cuarto), "modo edición".

## User Stories

### Story 1: Primer arranque

**As a** usuario que abre la app por primera vez
**I want** encontrar un hogar básico ya armado
**So that** pueda empezar a recorrerlo y ajustarlo sin pasos previos

**Acceptance criteria:**

- [ ] **AC-1.1** Dado que no existen datos guardados en el dispositivo, Cuando el usuario abre la app, Entonces se muestra en modo exploración un hogar con exactamente 1 sala, 1 cocina, 1 baño común y 1 dormitorio, sin pantalla de bienvenida previa.
- [ ] **AC-1.2** Dado el primer arranque, Cuando se muestra el mapa, Entonces existe un único personaje llamado "Personaje 1" ubicado en la casilla de aparición de la sala.
- [ ] **AC-1.3** Dado el hogar inicial, Cuando se observa la distribución, Entonces la sala está al centro, la cocina y el baño común a la izquierda de la sala y el dormitorio a la derecha, y no hay pasillos.

### Story 2: Recorrer mi hogar

**As a** usuario
**I want** mover mi personaje por el mapa con una cruceta
**So that** pueda explorar mi hogar como en un juego de GBA

**Acceptance criteria:**

- [ ] **AC-2.1** Dado el modo exploración, Cuando el usuario toca una dirección de la cruceta y la casilla siguiente es transitable, Entonces el personaje avanza exactamente una casilla en esa dirección y queda mirando hacia ella.
- [ ] **AC-2.2** Dado el modo exploración, Cuando el usuario mantiene presionada una dirección, Entonces el personaje avanza casilla tras casilla de forma continua, a 4 casillas por segundo, hasta que el usuario suelta o la siguiente casilla no es transitable.
- [ ] **AC-2.3** Dado que la casilla siguiente es pared, mobiliario o borde del mapa, Cuando el usuario toca esa dirección, Entonces el personaje no cambia de casilla y queda mirando hacia esa dirección.
- [ ] **AC-2.4** Dado un dispositivo con teclado, Cuando el usuario presiona una tecla de flecha, Entonces el personaje se comporta igual que con la dirección equivalente de la cruceta.
- [ ] **AC-2.5** Dado que el personaje camina, Cuando cruza una puerta entre dos espacios, Entonces pasa al otro espacio sin pantalla de transición y la cámara sigue centrada en el personaje.

### Story 3: Configurar los espacios de mi hogar

**As a** usuario
**I want** aumentar o disminuir la cantidad de cada tipo de espacio con contadores
**So that** el mapa refleje la composición real de mi hogar

**Acceptance criteria:**

- [ ] **AC-3.1** Dado el modo exploración, Cuando el usuario toca "Editar", Entonces la vista se aleja hasta mostrar el hogar completo, el personaje queda inmóvil y aparece un panel con un contador por cada tipo de espacio.
- [ ] **AC-3.2** Dado el modo edición con 1 dormitorio, Cuando el usuario toca + en Dormitorios, Entonces se crea "Dormitorio 2" debajo de "Dormitorio 1" en la zona privada y el mapa actualizado se muestra en menos de 100 ms, sin pedir confirmación.
- [ ] **AC-3.3** Dado un tipo de espacio en su máximo (por ejemplo, 4 dormitorios), Cuando se muestra su contador, Entonces el botón + está desactivado.
- [ ] **AC-3.4** Dado un tipo de espacio en su mínimo (por ejemplo, 1 cocina), Cuando se muestra su contador, Entonces el botón − está desactivado.
- [ ] **AC-3.5** Dado el modo edición sin comedor, Cuando el usuario toca + en Comedor, Entonces el comedor aparece directamente encima de la sala, sin pared ni puerta entre ambos.
- [ ] **AC-3.6** Dada una zona privada con 2 dormitorios cuyas puertas dan a la sala, Cuando el usuario agrega una oficina, Entonces aparece un pasillo entre la zona privada y el centro, y las puertas de los tres espacios pasan a dar al pasillo.
- [ ] **AC-3.7** Dado el modo edición con 3 dormitorios, Cuando el usuario toca − en Dormitorios, Entonces se elimina "Dormitorio 3" (el último) y ningún otro espacio se crea, elimina ni mueve, salvo lo indicado en FR-4 para su baño interno.
- [ ] **AC-3.8** Dado el modo edición, Cuando el usuario toca "Listo", Entonces la app vuelve al modo exploración con la cámara siguiendo al personaje.

### Story 4: Gestionar baños internos

**As a** usuario
**I want** agregar baños dentro de dormitorios y oficinas
**So that** el mapa represente mis baños propios

**Acceptance criteria:**

- [ ] **AC-4.1** Dado un hogar con 3 dormitorios y 1 oficina sin baños internos, Cuando el usuario toca + en Baños, Entonces se crea un baño interno dentro de "Dormitorio 1", con puerta únicamente hacia ese dormitorio.
- [ ] **AC-4.2** Dado que "Dormitorio 1" ya tiene baño interno y "Dormitorio 2" no, Cuando se muestra el contador de Baños, Entonces indica "Siguiente: Dormitorio 2".
- [ ] **AC-4.3** Dado que todos los dormitorios y oficinas tienen baño interno, Cuando se muestra el contador de Baños, Entonces el botón + está desactivado.
- [ ] **AC-4.4** Dado un hogar con baños internos creados en distintos momentos, Cuando el usuario toca − en Baños, Entonces se elimina el baño interno creado más recientemente y los demás baños no cambian de lugar.
- [ ] **AC-4.5** Dado un hogar con solo el baño común, Cuando se muestra el contador de Baños, Entonces el botón − está desactivado.
- [ ] **AC-4.6** Dado que "Dormitorio 2" tiene baño interno y "Dormitorio 3" no, Cuando el usuario elimina "Dormitorio 2", Entonces su baño pasa a estar dentro del primer dormitorio u oficina sin baño según el orden de FR-4, conservando su identidad y su nombre personalizado.
- [ ] **AC-4.7** Dado que todos los dormitorios y oficinas tienen baño interno, Cuando el usuario elimina uno de ellos (desde su ficha o con − en su contador), Entonces se pide confirmación indicando que también se eliminará su baño, y al confirmar se eliminan ambos y el contador de Baños disminuye en 1.
- [ ] **AC-4.8** Dado que "Dormitorio 1" y "Dormitorio 3" tienen baño interno, Cuando el usuario agrega o elimina un espacio que no los contiene, Entonces ambos baños permanecen dentro de sus mismos dormitorios.
- [ ] **AC-4.9** Dada la confirmación de AC-4.7, Cuando el usuario cancela, Entonces el cuarto y su baño se mantienen sin cambios.

### Story 5: Eliminar un espacio concreto

**As a** usuario
**I want** eliminar un espacio específico tocándolo en el mapa
**So that** no esté obligado a quitar siempre el último de su tipo

**Acceptance criteria:**

- [ ] **AC-5.1** Dado el modo edición, Cuando el usuario toca un espacio del mapa, Entonces se abre una ficha de ese espacio con las opciones Renombrar y Eliminar.
- [ ] **AC-5.2** Dados 3 dormitorios, Cuando el usuario elimina "Dormitorio 2" desde su ficha, Entonces se elimina ese dormitorio y el que era "Dormitorio 3" pasa a mostrarse como "Dormitorio 2", conservando su identidad.
- [ ] **AC-5.3** Dado un espacio con nombre personalizado, Cuando el usuario toca Eliminar, Entonces se pide confirmación antes de eliminarlo, y si el usuario cancela, el espacio no cambia.
- [ ] **AC-5.4** Dado un espacio sin nombre personalizado (y sin baño interno que vaya a eliminarse con él), Cuando el usuario toca Eliminar, Entonces se elimina sin pedir confirmación.
- [ ] **AC-5.5** Dado un tipo de espacio en su mínimo, o el baño común, Cuando el usuario abre su ficha, Entonces la opción Eliminar está desactivada.
- [ ] **AC-5.6** Dado el modo edición con el personaje dentro de un espacio, Cuando el usuario toca la casilla del personaje, Entonces se abre la ficha del personaje; Cuando toca cualquier otra casilla de ese espacio, Entonces se abre la ficha del espacio.

### Story 6: Renombrar espacios y personaje

**As a** usuario
**I want** dar nombres propios a los espacios y a mi personaje
**So that** el mapa use el vocabulario de mi hogar ("Cuarto de Bryam", "Diana")

**Acceptance criteria:**

- [ ] **AC-6.1** Dado el modo edición, Cuando el usuario renombra "Dormitorio 1" a "Cuarto de Bryam", Entonces el mapa y su ficha muestran "Cuarto de Bryam".
- [ ] **AC-6.2** Dado un espacio llamado "Cuarto de Bryam", Cuando se elimina otro espacio de su mismo tipo y la numeración cambia, Entonces sigue llamándose "Cuarto de Bryam".
- [ ] **AC-6.3** Dado un espacio con nombre personalizado, Cuando el usuario guarda un nombre vacío o solo con espacios en blanco, Entonces vuelve a mostrarse su nombre automático.
- [ ] **AC-6.4** Dado otro espacio que ya se muestra como "Cocina 1", Cuando el usuario intenta renombrar un espacio a "cocina 1", "Dormitorio 3" o cualquier texto con formato de nombre automático, Entonces el cambio se rechaza con un mensaje que explica el motivo y el nombre anterior se mantiene.
- [ ] **AC-6.5** Dado el campo de nombre, Cuando el usuario intenta ingresar más de 20 caracteres, Entonces el campo no acepta caracteres más allá del vigésimo y el nombre guardado tiene como máximo 20 caracteres.
- [ ] **AC-6.6** Dado el modo edición, Cuando el usuario toca su personaje y lo renombra a "Diana", Entonces el personaje se muestra como "Diana".
- [ ] **AC-6.7** Dado el personaje, Cuando el usuario intenta guardar un nombre vacío, Entonces el cambio se rechaza con un mensaje y el nombre anterior se mantiene.

### Story 7: Conservar mi hogar entre sesiones

**As a** usuario
**I want** que al volver a abrir la app todo esté como lo dejé
**So that** no tenga que reconfigurar ni buscar a mi personaje

**Acceptance criteria:**

- [ ] **AC-7.1** Dado un hogar con espacios agregados, eliminados y renombrados, Cuando el usuario cierra y vuelve a abrir la app, Entonces se muestran los mismos espacios, con los mismos nombres, en las mismas posiciones del mapa y con los baños internos en los mismos cuartos.
- [ ] **AC-7.2** Dado que el personaje se detuvo en una casilla mirando a la izquierda, Cuando la app pasa a segundo plano y se vuelve a abrir, Entonces el personaje aparece en esa misma casilla mirando a la izquierda.
- [ ] **AC-7.3** Dado que el personaje estaba dentro de "Dormitorio 2", Cuando en modo edición se agrega un espacio que desplaza a "Dormitorio 2" en el mapa y se toca "Listo", Entonces el personaje aparece en la misma casilla relativa dentro de "Dormitorio 2".
- [ ] **AC-7.4** Dado que el personaje estaba en un espacio que luego se eliminó, o en un pasillo que desapareció, o en una casilla que quedó ocupada, Cuando se toca "Listo" o se reabre la app, Entonces el personaje aparece en la casilla de aparición de la sala.

### Story 8: Identidad estable para la evolución del hogar

**As a** propietario que más adelante compartirá su hogar con su familia
**I want** que mis espacios y personajes conserven su identidad y su historial de cambios
**So that** futuras funciones (actividades, cuentas de familiares) se apoyen en ellos sin perder ni rehacer datos

**Acceptance criteria:**

- [ ] **AC-8.1** Dado un espacio con un identificador, Cuando se renombra, se renumera por la eliminación de otro espacio de su tipo o, si es un baño interno, se mueve a otro cuarto, Entonces su identificador sigue siendo el mismo.
- [ ] **AC-8.2** Dado un espacio eliminado, Cuando se inspeccionan los datos guardados, Entonces su registro sigue existiendo con fecha de eliminación, no aparece en el mapa ni en el panel y su nombre personalizado puede volver a usarse en otro espacio.
- [ ] **AC-8.3** Dado que se crea o modifica un hogar, espacio, miembro, cuenta o pertenencia, Cuando se inspecciona su registro, Entonces contiene fecha de creación, fecha de última modificación y la cuenta local del propietario como autora.
- [ ] **AC-8.4** Dado el primer arranque, Cuando se inspeccionan los datos guardados, Entonces existen una cuenta local, una pertenencia de esa cuenta al hogar con rol propietario y el personaje vinculado a esa cuenta.
- [ ] **AC-8.5** Dados datos guardados que incluyen un miembro sin cuenta vinculada, Cuando se abre la app, Entonces los datos se cargan como válidos, sin aviso de error.

## Functional Requirements

### FR-1: Hogar inicial

**Must:**
- Crear, cuando no hay datos guardados, un hogar con 1 sala, 1 cocina, 1 baño común y 1 dormitorio, y un personaje llamado "Personaje 1" en la casilla de aparición de la sala.
- Asociar el hogar a una cuenta local única que representa al propietario, sin pedir inicio de sesión, y vincular el personaje a esa cuenta.
- Nombrar el hogar "Mi hogar". El nombre del hogar no se puede editar en esta feature.

**Must not:**
- Mostrar pantallas de bienvenida u onboarding.

### FR-2: Catálogo de tipos de espacio y límites

Tipos de espacio disponibles y sus límites. Cómo se describen internamente los tipos (catálogo como datos) está decidido en el [ADR del generador](../../adr/001-generador-distribucion-piezas-reglas.md).

| Espacio | Mín. | Máx. | Zona | Admite baño interno |
|---|---|---|---|---|
| Sala | 1 | 1 | Centro | No |
| Comedor | 0 | 1 | Centro, encima de la sala | No |
| Cocina | 1 | 2 | Servicio (izquierda) | No |
| Baño | 1 | 1 + dormitorios + oficinas | Ver FR-4 | — |
| Lavandería | 0 | 2 | Servicio (izquierda) | No |
| Espacio de mascota | 0 | 2 | Servicio (izquierda) | No |
| Dormitorio | 1 | 4 | Privada (derecha) | Sí |
| Oficina | 0 | 2 | Privada (derecha) | Sí |

**Must:**
- Impedir cualquier acción que deje un tipo por debajo de su mínimo o por encima de su máximo.

**Must not:**
- Permitir más de una sala ni eliminar la sala.

### FR-3: Distribución del mapa

**Must:**
- Construir el mapa con una pieza visual fija por tipo de espacio.
- Ubicar la sala al centro; si hay comedor, directamente encima de la sala, formando un espacio continuo sin pared ni puerta entre ambos.
- Apilar la zona de servicio a la izquierda del centro, de arriba hacia abajo: cocinas, baño común, lavanderías, espacios de mascota.
- Apilar la zona privada a la derecha del centro, de arriba hacia abajo: dormitorios en orden (1 a 4) y luego oficinas en orden (1 a 2).
- Si una zona lateral tiene 2 espacios o menos, dar a cada uno una puerta directa a la sala o sala-comedor; para ello, la sala o sala-comedor debe colindar con todos esos espacios.
- Si una zona lateral tiene más de 2 espacios, generar un pasillo entre esa zona y el centro, con todas las puertas de la zona hacia el pasillo y el pasillo abierto al centro. Los baños internos no cuentan para este umbral.
- Ubicar cada baño interno dentro del cuarto que lo contiene, con puerta solo hacia ese cuarto.
- Producir siempre el mismo mapa, casilla por casilla, para el mismo estado guardado (espacios, su orden y qué cuarto contiene cada baño interno).
- Representar toda la casa como un único mapa continuo, con las puertas como casillas transitables.

**Must not:**
- Superponer piezas.
- Dejar un espacio inalcanzable caminando desde la sala.

### FR-4: Baños

**Must:**
- Mantener siempre exactamente un baño común en la zona de servicio.
- Tratar todo baño adicional como baño interno, contenido en un dormitorio u oficina, y guardar qué cuarto lo contiene.
- Con +, crear el baño interno dentro del primer cuarto sin baño en el orden: Dormitorio 1, 2, 3, 4, Oficina 1, 2 (según su orden actual).
- Con −, eliminar el baño interno creado más recientemente.
- Mostrar en el contador de baños qué cuarto recibirá el siguiente baño.
- Al eliminar un cuarto que contiene un baño interno: si existe algún cuarto sin baño, mover el baño al primero de ellos en el orden anterior, conservando su identidad y su nombre personalizado; si no existe ninguno, eliminar el baño junto con el cuarto.
- Numerar los nombres automáticos de baño así: el baño común es "Baño 1"; los internos se numeran desde 2 siguiendo el orden de su cuarto contenedor (Dormitorio 1 a 4, Oficina 1 a 2).

**Must not:**
- Eliminar el baño común.
- Mover un baño interno por cualquier acción distinta de la eliminación de su propio cuarto.
- Permitir + cuando todos los dormitorios y oficinas ya tienen baño interno.

### FR-5: Mobiliario

**Must:**
- Incluir en cada pieza mobiliario fijo que bloquea el paso: dormitorio (cama, velador); sala (sofá, mesa de centro); comedor (mesa con sillas); cocina (cocina, refrigeradora, lavadero); baño (inodoro, lavamanos, ducha); oficina (escritorio, silla); lavandería (lavadora); espacio de mascota (cama de mascota, plato).
- Definir en la pieza de la sala una casilla de aparición transitable.

**Must not:**
- Bloquear una puerta con mobiliario.
- Dejar casillas transitables aisladas dentro de una pieza.
- Permitir al usuario mover, agregar o quitar muebles.

### FR-6: Modo exploración

**Must:**
- Ofrecer una cruceta virtual abajo a la izquierda y aceptar las flechas del teclado como entrada equivalente.
- Mover al personaje una casilla por toque, y de forma continua a 4 casillas por segundo mientras se mantiene una dirección.
- Bloquear el paso por paredes, mobiliario y bordes del mapa.
- Mantener la cámara siguiendo al personaje.
- Ofrecer un botón "Editar" arriba a la derecha.
- Funcionar en orientación vertical.

**Must not:**
- Mostrar pantallas de transición al pasar entre espacios.

### FR-7: Modo edición

**Must:**
- Alejar la vista hasta mostrar el hogar completo e inmovilizar al personaje.
- Mostrar un panel con un contador por tipo de espacio, con botones − y + que se desactivan en los límites.
- Con + agregar un espacio al final de su tipo; con − eliminar el último de su tipo (para baños rige FR-4).
- Regenerar y mostrar el mapa tras cada cambio, sin pedir confirmación salvo en los casos indicados en FR-8.
- Al tocar una casilla de un espacio, abrir su ficha con Renombrar y Eliminar.
- Al tocar la casilla donde está el personaje, abrir su ficha con Renombrar; esto tiene prioridad sobre la ficha del espacio que lo contiene.
- Con "Listo", volver al modo exploración con la cámara siguiendo al personaje.

**Must not:**
- Permitir mover al personaje mientras dura el modo edición.

### FR-8: Eliminación y ausencia de efectos secundarios

**Must:**
- Eliminar únicamente el espacio que el usuario eliminó explícitamente, salvo la excepción de FR-4.
- Pedir confirmación antes de eliminar un espacio con nombre personalizado.
- Pedir confirmación, indicando que también se eliminará el baño, antes de eliminar un cuarto cuyo baño interno se eliminará con él, ya sea desde su ficha o con − en su contador.
- Recalcular los nombres automáticos de los espacios restantes del mismo tipo, conservando su identidad y sus nombres personalizados.
- Desactivar Eliminar para el baño común y para espacios cuyo tipo está en el mínimo.

**Must not:**
- Crear, eliminar o mover un espacio distinto del modificado por el usuario, salvo la excepción de FR-4.

### FR-9: Nombres

**Must:**
- Asignar a cada espacio un nombre automático "<tipo> <número>" calculado según su orden (para baños, según FR-4).
- Permitir un nombre personalizado opcional por espacio y mostrarlo en lugar del automático cuando existe.
- Eliminar los espacios en blanco al inicio y al final de un nombre ingresado; un nombre de espacio vacío restablece el nombre automático.
- Rechazar, con un mensaje que explique el motivo, los nombres de espacio que coincidan sin distinguir mayúsculas con el nombre visible de otro espacio, o que tengan el formato de un nombre automático.
- Rechazar, con un mensaje, nombres de miembro vacíos o que coincidan sin distinguir mayúsculas con el de otro miembro del hogar.
- Limitar todo nombre a 20 caracteres.

**Must not:**
- Permitir que dos espacios, o dos miembros, se muestren con el mismo nombre.

### FR-10: Persistencia local

**Must:**
- Guardar en el dispositivo el hogar, sus espacios, su orden, los nombres, qué cuarto contiene cada baño interno y el personaje.
- Guardar cada cambio del modo edición (agregar, quitar, eliminar o renombrar) en el momento en que se aplica.
- Guardar la posición del personaje como espacio, casilla relativa a ese espacio y dirección.
- Guardar la posición cuando el personaje se detiene tras caminar, al entrar al modo edición y cuando la app pasa a segundo plano.
- Restaurar todo lo anterior al reabrir la app.
- Si los datos guardados no se pueden leer al abrir la app, mostrar un aviso y crear el hogar inicial de FR-1.
- Ubicar al personaje en la casilla de aparición de la sala si su posición guardada ya no es válida, verificándolo al salir del modo edición y al abrir la app.

**Must not:**
- Enviar datos fuera del dispositivo.

### FR-11: Identidad y preparación para multiusuario

**Must:**
- Dar a cada espacio y a cada miembro un identificador estable y globalmente único, que no cambie al renombrarlos, reordenarlos o moverlos.
- Distinguir entre miembro del hogar (personaje) y cuenta de usuario; un miembro puede no tener cuenta.
- Registrar la pertenencia de cada cuenta a un hogar con un rol (propietario o miembro); en esta feature solo existe la del propietario.
- Registrar en cada cuenta, hogar, pertenencia, espacio y miembro la fecha de creación, la fecha de última modificación y la cuenta autora de cada una.
- Marcar como eliminados los registros borrados, con su fecha de eliminación, en lugar de destruirlos, y excluirlos de toda vista y validación.
- Mantener la posición del personaje como dato exclusivo del dispositivo.

**Must not:**
- Hacer que el nombre de un miembro dependa del nombre de una cuenta.
- Hacer que la eliminación de un miembro afecte a los espacios.

## Non-Functional Requirements

### Performance

- El movimiento del personaje se mantiene a 60 cuadros por segundo en el dispositivo de referencia: cualquier teléfono Android lanzado en los últimos 3 años (desde octubre de 2023).
- Tras cada cambio en modo edición (contador, eliminación o renombre), el mapa actualizado se muestra en menos de 100 ms en el dispositivo de referencia.

### Security

- No hay autenticación en esta feature; la cuenta del propietario es local.
- Ningún dato sale del dispositivo.

### Reliability

- Para todas las combinaciones permitidas de contadores y de cuartos con baño interno, el mapa resultante cumple FR-3 y FR-5: cada espacio alcanzable desde la sala, ninguna puerta bloqueada, ninguna pieza superpuesta, cada baño interno dentro de su cuarto y accesible solo desde él. Se verifica de forma automática recorriendo todas las combinaciones.
- Un cierre inesperado de la app pierde como máximo el último tramo de caminata no guardado; los cambios de modo edición se guardan en el momento en que se aplican.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| El usuario ingresa un nombre de espacio duplicado o con formato de nombre automático | Se rechaza, se muestra el motivo y se mantiene el nombre anterior |
| El usuario ingresa un nombre de personaje vacío o duplicado | Se rechaza, se muestra el motivo y se mantiene el nombre anterior |
| El usuario intenta superar 20 caracteres en un nombre | No se guarda un nombre de más de 20 caracteres |
| La posición guardada del personaje ya no es válida | El personaje aparece en la casilla de aparición de la sala |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer al abrir la app | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de FR-1 |
| Se elimina un cuarto cuyo baño interno se eliminará con él (no hay otro cuarto libre) | Se pide confirmación indicando que también se eliminará su baño; si el usuario cancela, nada cambia |

## Open Questions

- Ninguna. Las tres preguntas abiertas se resolvieron con el usuario el 2026-10-04.

## Out of Scope (Future Considerations)

- Crear familiares y mascotas, con parentesco y género (pieza 2).
- Rutinas y movimiento según horario (pieza 3).
- Actividades asignadas a un miembro (obligatorio) y a un espacio (opcional), y estado visual limpio/desordenado/desastre (pieza 4).
- Negociar intercambios y calificar con estrellas (pieza 5).
- Inicio de sesión, cuentas reales, sincronización entre dispositivos, permisos por rol y resolución de ediciones simultáneas (pieza de multiusuario).
- Más de un hogar por cuenta.
- Personalizar, mover o agregar muebles; mover espacios a mano o elegir otra distribución.
- Variantes visuales por pieza y tipos de espacio adicionales.
- Transiciones entre espacios, zoom con gestos y orientación horizontal.
- Arte definitivo, sonido y música.
