# ADR-003-estado-derivado-fechas-reloj-inyectado: Estado de los espacios derivado de las actividades, con fechas locales y reloj inyectado

**Status:** Accepted
**Date:** 2026-10-06
**Feature:** 003-actividades

## Context

El estado visual de un espacio (limpio, desordenado, desastre), las burbujas del mapa y los atrasos dependen de las actividades pendientes y del día de hoy. Requisitos del PRD que condicionan la decisión:

- El usuario no marca el estado a mano: sale de las actividades vencidas del espacio y de los días de atraso de la más atrasada.
- Los plazos son por día, sin hora. Una actividad vence al empezar su día.
- La app puede quedar cerrada días; al abrirla, el estado debe ser el correcto sin ninguna acción.
- Con la app abierta puede cambiar el día (pasar la medianoche) y el mapa debe reflejarlo.
- Las pruebas automáticas no pueden depender del reloj real (regla del proyecto: sin pruebas con temporizadores ni fecha del sistema).
- La lógica de reglas debe ser portable, sin depender del motor gráfico (ADR del generador de la feature 001), y las rutinas de la pieza 3 trabajarán con horarios sobre las mismas fechas.

## Options Considered

### Option A: Derivar el estado al vuelo con funciones puras y un `hoy` inyectado, con fechas como días del calendario local

Un módulo puro recibe el estado del hogar y la fecha de hoy y devuelve los atrasos, el estado de cada espacio y las burbujas. Las fechas son texto `AAAA-MM-DD` del calendario local; la diferencia en días se calcula con las partes de la fecha (no con la hora), de modo que no hay saltos por zona horaria ni por cambio de hora. La presentación obtiene `hoy` del reloj del dispositivo y lo pasa.

**Pros:** el estado siempre es correcto al abrir la app, sin recalcular nada guardado; se prueba con fechas fijas y recorridos de varios días; es coherente con la separación de capas y con el azar inyectado de la feature 002; no hay nada que migrar si cambian los umbrales.
**Cons:** hay que recalcular el estado en cada redibujado y al cambiar el día (el costo es pequeño: decenas de actividades); la presentación debe detectar el cambio de día.

### Option B: Guardar el estado de cada espacio y actualizarlo con un temporizador o al abrir la app

Cada espacio lleva su estado en el documento y un proceso lo recalcula periódicamente.

**Pros:** el dibujo lee un campo ya calculado.
**Cons:** un dato derivado guardado se desactualiza si la app pasa días cerrada, así que hay que recalcularlo igualmente al abrir; dos fuentes de verdad (actividades y estado) pueden contradecirse; cambiar un umbral exige migrar datos; aporta un temporizador, que las pruebas deben evitar.

### Option C: Calcular el estado dentro de la escena de Phaser con la fecha del sistema

La escena lee `Date` y decide el estado de cada espacio al dibujar.

**Pros:** menos código de unión.
**Cons:** rompe la separación del ADR del generador; las reglas de vencimiento y de umbrales quedan sin pruebas automáticas, justo la parte donde un error de un día cambia lo que el usuario ve; hace imposible reproducir un caso con una fecha fija.

## Decision

**We chose Option A (derivación pura con `hoy` inyectado y fechas locales como texto)** porque es la única opción con una sola fuente de verdad, que no se desactualiza con la app cerrada, que se prueba con fechas fijas y que mantiene las reglas en la capa portable. Las otras dos duplican el dato (B) o dejan las reglas sin pruebas (C).

Reglas que fija la decisión:

- **Fechas:** el texto `AAAA-MM-DD` del calendario local del dispositivo. Una función pura convierte el texto a un número de día usando las partes de la fecha (año, mes, día) y compara sin hora. Sumar días a una fecha (para la próxima vez de una repetitiva) usa la misma conversión y el resultado vuelve a ser un texto.
- **Atraso** = días entre `vence` y `hoy`. Una actividad pendiente con atraso mayor o igual a cero está **por hacer** (vence hoy o antes). Las que vencen en el futuro no cuentan para el estado ni para las burbujas.
- **Estado de un espacio** según la actividad por hacer más atrasada de ese espacio (solo cuentan las vinculadas a él por `espacioId`): sin ninguna por hacer o con atraso 0, **limpio**; atraso de 1 o 2 días, **desordenado**; atraso de 3 o más días, **desastre**. Los umbrales son constantes exportadas, valores de partida ajustables tras probarlos en un teléfono.
- **Burbuja:** una por lugar. En un espacio, la forman sus actividades por hacer; en un miembro, las suyas por hacer que no tienen espacio. El icono principal es el de la actividad más atrasada; si hay empate, la creada primero. Un indicador de "más" aparece si el lugar tiene más de una actividad por hacer.
- **El reloj se inyecta:** la presentación pasa `hoy` (el texto de la fecha local del dispositivo) a las funciones puras; las pruebas pasan fechas fijas. Ningún módulo de dominio llama a `Date` por su cuenta, salvo el contexto de la aplicación que ya provee `ahora()` para la auditoría.
- **Cambio de día:** la presentación compara el `hoy` actual con el último usado en cada cuadro (una comparación de texto) y, si cambió, recalcula burbujas, estados y objetos del suelo; hace lo mismo al volver a primer plano.
- **Los objetos del suelo** (el aspecto de desordenado y de desastre) también se derivan, con una función pura del identificador del espacio, el estado y las casillas libres de su plano, sin azar: la misma entrada da las mismas posiciones, de modo que no parpadean ni cambian al recargar.

## Consequences

**Más fácil:**
- Probar el estado con fechas fijas, incluidos los límites de los umbrales y el cambio de día, sin reloj real.
- Cambiar los umbrales, o cómo se elige el icono principal, sin migrar datos.
- Portar el módulo al stack oficial; solo se reescribe el dibujo.
- Que las rutinas de la pieza 3 reutilicen las mismas fechas locales.

**Más difícil:**
- La presentación debe obtener `hoy` de forma consistente y no olvidar el cambio de día con la app abierta.
- La zona horaria del dispositivo cambia lo que cuenta como "hoy". Es aceptable para un hogar en un solo lugar; si el dispositivo viaja, los atrasos cambian de un día.
- Un teléfono con la fecha mal configurada muestra atrasos mal calculados. No se corrige en esta pieza.
- El dibujo de burbujas y objetos, y el rendimiento con muchas actividades, se verifican a mano y con el indicador de cuadros por segundo.

**A revisar si este ADR es reemplazado:** si las rutinas o la sincronización multiusuario exigieran plazos con hora o zonas horarias distintas por miembro, habría que representar instantes en lugar de días del calendario; las funciones puras de fechas serían el único punto a reemplazar.
