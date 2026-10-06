# ADR-003-modelo-actividades-formato-v3: Modelo de actividades y documento guardado versión 3

**Status:** Accepted
**Date:** 2026-10-06
**Feature:** 003-actividades

## Context

La feature 001 dejó espacios y miembros con identidad estable (UUID) y un documento guardado `livin:datos:v1`. La feature 002 amplió `Miembro` y subió el documento a `version: 2` con una migración pura desde la v1. El [ADR-001 de modelo de datos](001-modelo-datos-local-first-multiusuario.md) ya fija que una futura actividad apunta a un miembro (obligatorio, no a la cuenta) y a un espacio (opcional), y que ambos se referencian por id, nunca por nombre ni posición.

Esta feature agrega las actividades del hogar. Requisitos del PRD que condicionan la decisión:

- Una actividad tiene nombre, un icono de una lista cerrada, un miembro asignado (obligatorio) y un espacio (opcional).
- Puede ser **puntual** (vence una fecha y, al hacerla, deja de estar pendiente) o **repetitiva** (cada N días; al hacerla vuelve a vencer hoy más N).
- Los plazos son por día, sin hora.
- Eliminar un espacio elimina sus actividades; eliminar un miembro elimina las suyas. Ambas son bajas lógicas, como en las features anteriores.
- No hay historial de actividades hechas.
- Hay hogares guardados con `version: 1` y `version: 2` en dispositivos reales: abrirlos no debe perder datos ni mostrar un error.
- El formato guardado es difícil de revertir: con datos v3 en los dispositivos, volver atrás exige otra migración.

Hay una restricción que viene de la feature 001: al eliminar un cuarto, su baño interno pasa a otro cuarto si hay uno que pueda recibirlo y, si no, se elimina junto con él (FR-4 de la 001). Esa excepción decide qué actividades se eliminan en cascada.

## Options Considered

### Option A: Colección `actividades` con un registro por actividad, referencias por id, documento `version: 3`

Cada actividad es un registro del documento con `miembroId` y `espacioId` (nulo si no tiene espacio), `tipo`, `vence` (fecha de la próxima vez que toca) y, si es repetitiva, `frecuenciaDias`. Al hacerla, una función pura cambia solo ese registro: una puntual queda marcada como hecha y una repetitiva avanza su `vence`. El documento pasa a `version: 3` y una migración pura desde la v2 agrega `actividades: []`.

**Pros:** es lo que el ADR-001 ya anticipó; una única colección con ids estables que las piezas siguientes (rutinas, intercambios) pueden referenciar; el registro único evita guardar datos que el PRD dejó fuera (historial); la migración es mínima y se prueba con documentos reales.
**Cons:** las bajas en cascada deben hacerse con cuidado en la misma operación pura; el validador debe comprobar las referencias.

### Option B: Anidar las actividades dentro del espacio o del miembro

Cada espacio (o cada miembro) lleva su lista de actividades.

**Pros:** el dueño de la actividad es evidente y la baja del dueño arrastra a las actividades sin código extra.
**Cons:** una actividad tiene dos referencias distintas (miembro obligatorio, espacio opcional), así que habría que duplicarla o elegir un dueño y buscar por el otro; las actividades sin espacio no tendrían dónde vivir si el dueño fuera el espacio; rompe la colección plana de ids estables que fija el ADR-001.

### Option C: Guardar una ocurrencia por cada vez que toca una actividad repetitiva

Una actividad repetitiva genera un registro nuevo por cada fecha en que vence, y hacerla marca esa ocurrencia como hecha.

**Pros:** conserva el historial completo, útil para calificaciones y estadísticas en piezas futuras.
**Cons:** el PRD dejó el historial fuera de esta pieza (YAGNI); la colección crece sin límite en un dispositivo con almacenamiento acotado; obliga a decidir cuándo se generan las ocurrencias futuras y qué pasa si la app pasa semanas cerrada.

## Decision

**We chose Option A (colección `actividades`, un registro por actividad, documento `version: 3`)** porque cumple lo que el ADR-001 anticipó, resuelve con un solo registro los dos dueños de una actividad y no guarda nada que el PRD dejó fuera. El historial, si una pieza futura lo necesita, se agrega sin romper este modelo.

Reglas que fija la decisión:

- Campos de `Actividad`: `id`, `hogarId`, `nombre`, `icono`, `miembroId`, `espacioId` (nulo si no tiene espacio), `tipo` (`puntual` o `repetitiva`), `vence` (texto `AAAA-MM-DD`), `frecuenciaDias` (entero de la lista cerrada para las repetitivas; nulo en las puntuales), `hechaEn` (texto `AAAA-MM-DD` con el día en que se hizo una puntual; nulo mientras está pendiente y siempre nulo en las repetitivas) y la auditoría de siempre (`creadoEn`, `actualizadoEn`, `creadoPor`, `actualizadoPor`, `eliminadoEn`).
- Una actividad está **pendiente** si no está eliminada y, siendo puntual, `hechaEn` es nulo. Las repetitivas activas siempre están pendientes.
- Hacer una puntual fija `hechaEn` con la fecha de hoy. Hacer una repetitiva fija `vence` en la fecha de hoy más `frecuenciaDias`, sin acumular atrasos pasados.
- `miembroId` apunta a un miembro activo y `espacioId`, si no es nulo, a un espacio activo. Los pasillos no son espacios y no pueden recibir actividades.
- **Baja en cascada.** Eliminar un espacio elimina de forma lógica sus actividades pendientes y hechas, en la **misma operación pura** que lo elimina; igual al eliminar un miembro. Si la baja de un cuarto elimina también su baño interno (excepción de la feature 001), las actividades de ese baño se eliminan también; si el baño interno pasa a otro cuarto, conserva sus actividades porque su identidad no cambia.
- Un documento v3 se considera **ilegible** (se crea el hogar inicial con aviso, como hoy) si no cumple las condiciones vigentes de las versiones anteriores o si alguna actividad **activa**: no tiene `tipo` o `icono` válido; tiene un `vence` o un `hechaEn` que no es una fecha `AAAA-MM-DD` real; es repetitiva sin una `frecuenciaDias` de la lista cerrada, o puntual con `frecuenciaDias`; es repetitiva con `hechaEn`; o referencia un miembro o un espacio que no está activo. Las eliminadas no se validan, igual que en la feature 002.
- Se acepta `version` 1, 2 o 3. Un documento v1 se migra a v2 y luego a v3; uno v2 se migra a v3; ambas migraciones son puras y no cambian ningún otro dato. Un documento antiguo se guarda como v3 en el siguiente guardado, no al abrirlo. Cualquier otra versión es ilegible. Las claves de almacenamiento **no cambian** (`livin:datos:v1` y `livin:posicion:v1`).
- Los límites (50 actividades activas por hogar) y las reglas del nombre se aplican al crear o editar, no al cargar.

## Consequences

**Más fácil:**
- Las rutinas (pieza 3) y los intercambios (pieza 5) pueden referenciar una actividad por su id estable.
- Cambiar el miembro o el espacio de una actividad es cambiar un campo.
- Agregar historial más adelante es una colección nueva de registros que apuntan a `actividades`, sin migrar las actividades.

**Más difícil:**
- Toda operación que elimine espacios o miembros debe aplicar la cascada en el mismo paso. La eliminación de un cuarto con baño interno es el caso delicado y debe tener pruebas propias, con el baño que se mueve y con el que se elimina.
- Los datos v3 no se pueden leer con una versión anterior de la app. En la PoC (desechable, solo local) es aceptable; para el producto real la migración y el validador pasan al stack oficial.
- La baja en cascada elimina trabajo registrado como efecto secundario de otra baja. Es una decisión del usuario: la confirmación de eliminar avisa cuántas actividades se borrarán, y como son bajas lógicas los registros quedan en el documento.
- Hay que probar la migración con documentos v1 y v2 reales y con documentos corruptos.

**A revisar si este ADR es reemplazado:** si la sincronización multiusuario exigiera resolver conflictos de actividades entre dispositivos, habría que definir una política de fusión por registro; el id estable y la auditoría de cada actividad son el insumo para ello.
