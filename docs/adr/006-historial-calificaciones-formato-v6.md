# ADR-006-historial-calificaciones-formato-v6: Historial de actividades hechas, calificaciones y documento guardado versión 6

**Status:** Accepted
**Date:** 2026-10-08
**Feature:** 006-calificaciones-e-historial

## Context

El documento guardado `livin:datos:v1` está en `version: 5` con espacios, miembros, actividades, bloques de rutina e intercambios, todos con identidad estable y borrado lógico. El [ADR-001 de modelo de datos](001-modelo-datos-local-first-multiusuario.md) fija que las entidades se referencian por id y que cada registro lleva auditoría. El [ADR-003 del modelo de actividades](003-modelo-actividades-formato-v3.md) descartó guardar el historial en aquella pieza (opción C: una ocurrencia por vez) por el crecimiento sin límite en un dispositivo con almacenamiento acotado, y dejó anotado que "agregar historial más adelante es una colección nueva de registros que apuntan a `actividades`, sin migrar las actividades". El [ADR-005 de intercambios](005-intercambios-formato-v5.md) hace que `miembroId` sea siempre el responsable actual y calcula la vigencia de una propuesta con la marca `actualizadoEn` de cada actividad.

Hoy una actividad no guarda su pasado: una puntual conserva solo `hechaEn` (un día) y una repetitiva solo su próximo `vence`, así que lo que se hizo, cuándo y quién lo hizo se pierde. Requisitos del PRD que condicionan la decisión:

- Cada "Hecho" de cualquier actividad (puntual o repetitiva, de persona o de mascota) deja una entrada en un historial del hogar, acreditada a la persona **responsable en ese momento** (`miembroId`, que ya refleja los intercambios).
- Una entrada se puede calificar con 1 a 5 estrellas, una sola calificación por entrada, por una persona distinta de la acreditada. Solo quien calificó puede cambiarla o quitarla.
- El historial conserva solo las **últimas 200 entradas**; al llegar la 201, se descarta la más antigua, esté calificada o no.
- El promedio de estrellas por persona se **calcula**, no se guarda.
- Las entradas deben seguir mostrándose aunque la actividad se edite o se elimine después, o la persona acreditada se elimine.
- Hay hogares guardados con `version` 1 a 5 en dispositivos reales: abrirlos no debe perder datos ni mostrar un error.
- El formato guardado es difícil de revertir, y el código ya verificado en el teléfono (003 a 005) no debe tocarse más de lo necesario.

## Options Considered

### Option A: Colección `historial` con una entrada por "Hecho", instantánea del nombre y el icono, documento `version: 6`

Cada entrada es un registro del documento con `actividadId`, `miembroId` (responsable en el momento de "Hecho"), `espacioId` (o nulo), una instantánea de `nombre` e `icono`, `hechaEn` (fecha y hora), `estrellas` y `calificadoPor` (ambos nulos mientras no esté calificada). `marcarHecha` agrega la entrada en la **misma operación pura** que actualiza la actividad y recorta la colección a 200. Calificar es otra operación pura que cambia solo ese registro. El documento pasa a `version: 6` con `historial: []`; las actividades no cambian.

**Pros:** es lo que el ADR-003 anticipó; la actividad, las burbujas, las listas, los intercambios y las rutinas no cambian; el historial sobrevive a la edición o baja de la actividad porque guarda su propia instantánea; el tope se aplica en un solo lugar; la migración es mínima.
**Cons:** `marcarHecha`, ya verificada en el teléfono, gana un efecto (agrega una entrada y recorta); el nombre y el icono quedan duplicados; hay que mantener el tope y la regla de calificación en operaciones puras con sus pruebas.

### Option B: Derivar el historial de las propias actividades

No se guarda nada nuevo. El historial se arma leyendo `hechaEn` de las actividades.

**Pros:** cero cambios de formato; ninguna operación existente cambia.
**Cons:** una repetitiva no conserva sus "Hecho" pasados (solo el próximo `vence`), así que su historial se pierde, y las repetitivas son justamente las que más se hacen; una puntual eliminada deja de aparecer; no hay dónde guardar una calificación por vez. No cumple el requisito.

### Option C: Registro genérico de eventos (hecho, calificado, cambiado…)

Una colección de eventos de solo agregado, de la que se derivan el historial, las calificaciones y los promedios.

**Pros:** el más flexible, sirve para estadísticas y auditoría futuras; no se muta nunca un registro.
**Cons:** hay que reconstruir cada entrada y su calificación vigente recorriendo eventos; el tope de 200 entradas pasa a ser un tope sobre eventos que mezcla tipos; es más de lo que pide el PRD (YAGNI) y el ADR-003 ya advertía contra un registro creciente sin necesidad.

## Decision

**We chose Option A (colección `historial`, una entrada por "Hecho" con instantánea de nombre e icono, documento `version: 6`)** porque es la única que conserva el pasado de las repetitivas, cumple el tope de 200 entradas con una sola regla en una sola operación y no toca las burbujas, la hoja, los intercambios ni las rutinas de las features anteriores. La opción B no puede reconstruir lo que ya pasó; la C resuelve necesidades que el PRD dejó fuera.

Reglas que fija la decisión:

- **Campos de `EntradaHistorial`:** `id`, `hogarId`, `actividadId`, `miembroId` (quién estaba a cargo al hacerla), `espacioId` (nulo si la actividad no tenía espacio), `nombre`, `icono`, `hechaEn` (texto de fecha y hora, de `ctx.ahora()`), `dia` (texto `AAAA-MM-DD`: el `hoy` local con que se marcó "Hecho", que la presentación usa para mostrar "Hoy", "Ayer" o "Hace N días" sin depender de la zona horaria), `estrellas` (entero de 1 a 5, o nulo), `calificadoPor` (id de una persona, o nulo) y la auditoría de siempre.
- **Orden:** el historial se guarda en orden de creación y la más reciente es la última del arreglo; ese orden desempata cuando dos entradas comparten `hechaEn` (reloj detenido).
- **Crear una entrada:** `marcarHecha` agrega la entrada solo cuando la operación se aplica (es decir, cuando la actividad estaba por hacer). El `miembroId` de la entrada es el **responsable al momento de "Hecho", antes de que una repetitiva intercambiada vuelva a su responsable original** (`devolverA` del ADR-005 de intercambios): quien tenía la actividad es quien recibe el crédito. Las actividades de mascotas generan entradas igual.
- **Tope:** después de agregar, si hay más de 200 entradas, se descartan las más antiguas hasta quedar en 200, estén calificadas o no. Las entradas no se borran de ninguna otra forma: ni la baja de una actividad, de un espacio o de un miembro las elimina, ni existe "deshacer Hecho".
- **Calificar:** una operación pura que recibe el id de la entrada, la persona que juega y las estrellas. Exige que la entrada exista, que quien califica sea una persona activa (propietario o familiar) y **distinta de `miembroId`**, y que las estrellas sean un entero de 1 a 5. Si la entrada ya tiene calificación, solo puede cambiarla o quitarla quien la dio (`calificadoPor`); cualquier otra persona la ve bloqueada. Quitar la calificación deja `estrellas` y `calificadoPor` en nulo. Cada cambio actualiza la auditoría de la entrada.
- **Calificación huérfana:** si quien calificó se elimina después, la calificación se conserva y queda bloqueada para todos. Si la persona acreditada se elimina, la entrada se conserva y se muestra con su nombre y la nota "(ya no está)".
- **Promedio por persona:** se calcula a partir de las entradas que siguen en el historial con `miembroId` igual a esa persona y `estrellas` no nulo (ignorando las no calificadas); se muestra con la cantidad de entradas calificadas. No se guarda.
- **Versión 6:** se acepta `version` 1 a 6. La migración v5→v6 agrega `historial: []` y no cambia nada más; las migraciones se encadenan (v1→v2→…→v6). Un documento antiguo se guarda como v6 en el siguiente guardado, no al abrirlo. Las claves de almacenamiento no cambian.
- Un documento v6 es **ilegible** (se crea el hogar inicial con aviso, como hoy) si no cumple las condiciones de las versiones anteriores o si: falta la lista `historial`; alguna entrada no tiene un `hechaEn` o un `nombre` que sea texto, o un `dia` que no sea una fecha `AAAA-MM-DD` real; tiene `actividadId` o `miembroId` que no existen en el documento (eliminados incluidos), o un `espacioId` no nulo que no existe; `estrellas` no es nulo ni un entero de 1 a 5; `estrellas` y `calificadoPor` no son ambos nulos o ambos presentes; o `calificadoPor` no es el id de un miembro del documento. El tope de 200 se aplica al crear, no al cargar.

## Consequences

**Más fácil:**
- La 003, la 004 y la 005 siguen funcionando sin cambios en burbujas, hoja, lista, intercambios y rutinas; solo `marcarHecha` gana un efecto en la misma operación.
- Una futura función de estadísticas, logros o puntos puede leer el historial sin migrar actividades.
- Una sincronización multiusuario puede fusionar entradas registro a registro, con su id y su auditoría.

**Más difícil:**
- `marcarHecha`, ya verificada en el teléfono, cambia de comportamiento. Una prueba de contrato debe comprobar que agrega exactamente una entrada, con el responsable previo al regreso de `devolverA`, que no agrega nada si la actividad no estaba por hacer, y que sus efectos anteriores (vencimiento, `devolverA`, vigencia de los intercambios) siguen iguales.
- El tope de 200 hace que un hogar muy activo pierda historial en pocas semanas y que las calificaciones más antiguas se descarten con él. Es un límite aceptado de la PoC; el producto real tendrá que decidir una retención por fecha o un archivo.
- El nombre y el icono duplicados significan que una actividad renombrada después conserva su nombre anterior en el historial. Es deliberado: el historial dice lo que se hizo entonces.
- Una calificación cuyo autor fue eliminado queda bloqueada de forma permanente.
- Los datos v6 no se pueden leer con una versión anterior. En la PoC (desechable, solo local) es aceptable.

**A revisar si este ADR es reemplazado:** si una pieza futura exigiera conservar todo el historial, calificaciones de varias personas por entrada, o deshacer un "Hecho", habría que pasar a un registro de eventos (opción C) o ampliar `EntradaHistorial` con una colección de calificaciones; los ids estables y la auditoría de cada entrada son el insumo para migrar.
