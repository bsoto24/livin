# ADR-004-modelo-rutinas-formato-v4: Modelo de rutinas como colección de bloques y documento guardado versión 4

**Status:** Accepted
**Date:** 2026-10-06
**Feature:** 004-rutinas

## Context

Las features anteriores dejaron un documento guardado `livin:datos:v1` con `version: 3`, con espacios, miembros (personas y mascotas) y actividades, todos con identidad estable y borrado lógico. El [ADR-001 de modelo de datos](001-modelo-datos-local-first-multiusuario.md) fija que las entidades se referencian por id, nunca por nombre ni posición, para que las piezas futuras (capa social, multiusuario) no migren datos. El [ADR-003 del modelo de actividades](003-modelo-actividades-formato-v3.md) aplicó ese criterio con una colección plana y bajas en cascada en la misma operación pura.

Esta feature agrega las rutinas de los familiares. Requisitos del PRD que condicionan la decisión:

- Solo los familiares (miembros `persona` que no son el personaje del propietario) tienen rutina; las mascotas y el propietario no.
- Cada familiar tiene dos horarios opcionales: **lunes a viernes** y **sábado y domingo**.
- Un horario es una lista de hasta 8 **bloques**. Un bloque tiene inicio y fin en pasos de 30 minutos, entre 00:00 y 24:00, con el fin posterior al inicio (no cruza la medianoche), y un lugar: un espacio activo o **fuera de casa**.
- Los bloques de un mismo horario no se superponen; pueden tocarse.
- Eliminar un familiar elimina sus bloques; eliminar un espacio elimina los bloques que apuntan a él. Si un cuarto se elimina junto con su baño interno, también se eliminan los bloques del baño; si el baño pasa a otro cuarto, los conserva.
- Hay hogares guardados con `version` 1, 2 y 3 en dispositivos reales: abrirlos no debe perder datos ni mostrar un error.
- El formato guardado es difícil de revertir: con datos v4 en los dispositivos, volver atrás exige otra migración.

## Options Considered

### Option A: Colección `bloques` con un registro por bloque, referencias por id, documento `version: 4`

Cada bloque es un registro del documento con `miembroId`, `dias` (`laborables` o `finde`), `inicio` y `fin` en minutos desde las 00:00, y `espacioId` (nulo si es fuera de casa). El documento pasa a `version: 4` y una migración pura desde la v3 agrega `bloques: []`.

**Pros:** es el mismo patrón que `actividades`: la baja en cascada por `espacioId` y por `miembroId`, la validación de referencias y el borrado lógico reutilizan código ya probado; cada bloque tiene id estable y auditoría, que es lo que una sincronización por registro necesitará; la migración es mínima; los minutos enteros hacen que el paso de 30 minutos y la superposición se comprueben con aritmética simple.
**Cons:** un horario se arma filtrando la colección por miembro y por `dias`; el validador debe comprobar la superposición entre registros, no dentro de una lista.

### Option B: Rutina anidada dentro de `Miembro`

Cada familiar lleva `rutina = { laborables: [...], finde: [...] }`, con bloques sin identificador propio.

**Pros:** el horario completo de un familiar está en un solo lugar; la baja del familiar arrastra la rutina sin código extra.
**Cons:** la baja en cascada al eliminar un espacio obliga a recorrer las listas de todos los miembros, con un código distinto al de las actividades; los bloques no tienen id ni auditoría, contra el ADR-001; dos dispositivos que editen la rutina del mismo familiar chocarían en un único campo; cambia el registro `Miembro`, que ya tuvo su migración en la v2.

### Option C: Colección `rutinas` con un registro por familiar

Cada familiar tiene un registro `rutina` con id propio que contiene las dos listas de bloques.

**Pros:** la rutina tiene id y auditoría; no toca el registro `Miembro`.
**Cons:** sigue teniendo bloques sin identidad dentro de listas; la cascada por espacio recorre listas anidadas igual que en la opción B; agrega una entidad intermedia que el usuario no percibe (él edita bloques, no "una rutina").

## Decision

**We chose Option A (colección `bloques`, un registro por bloque, documento `version: 4`)** porque es la única que cumple el ADR-001 (cada bloque con id estable y auditoría) y resuelve las bajas en cascada del PRD, incluido el caso del baño interno, con el mismo mecanismo ya probado en las actividades. Las opciones B y C dejan los bloques sin identidad y obligan a una cascada distinta, recorriendo listas anidadas.

Reglas que fija la decisión:

- **Campos de `Bloque`:** `id`, `hogarId`, `miembroId`, `dias` (`laborables` o `finde`), `inicio` (entero de minutos, múltiplo de 30, de 0 a 1410), `fin` (entero de minutos, múltiplo de 30, de 30 a 1440, mayor que `inicio`), `espacioId` (id de un espacio, o nulo para **fuera de casa**) y la auditoría de siempre (`creadoEn`, `actualizadoEn`, `creadoPor`, `actualizadoPor`, `eliminadoEn`).
- **Un bloque está activo** si no está eliminado. Un bloque cubre los minutos `inicio ≤ m < fin` de los días de su horario: `laborables` de lunes a viernes, `finde` sábado y domingo.
- **`miembroId`** apunta a un miembro activo de `tipo: persona` que no es el personaje del propietario. **`espacioId`**, si no es nulo, apunta a un espacio activo; los pasillos no son espacios y no pueden ser el lugar de un bloque.
- **Superposición:** dos bloques activos del mismo miembro y de los mismos `dias` no pueden cubrir un mismo minuto. Que el fin de uno sea el inicio del otro está permitido.
- **Baja en cascada**, en la **misma operación pura** que elimina el espacio o el miembro: se eliminan de forma lógica los bloques del miembro eliminado y los que apuntan al espacio eliminado. Si la baja de un cuarto elimina también su baño interno (FR-4 de la feature 001), se eliminan los bloques del baño; si el baño pasa a otro cuarto, conserva sus bloques porque su identidad no cambia.
- **Límite:** hasta 8 bloques activos por miembro y por `dias`. Se aplica al crear, no al cargar, como los demás límites.
- Un documento v4 se considera **ilegible** (se crea el hogar inicial con aviso, como hoy) si no cumple las condiciones vigentes de las versiones anteriores o si algún bloque **activo**: tiene un `dias` fuera de la lista; tiene `inicio` o `fin` que no son enteros múltiplos de 30 en su rango, o `fin ≤ inicio`; apunta a un miembro que no es un familiar activo, o a un espacio que no está activo; o se superpone con otro bloque activo del mismo miembro y los mismos `dias`. Los bloques eliminados no se validan.
- Se acepta `version` 1, 2, 3 o 4. Las migraciones se encadenan (v1→v2→v3→v4); la de v3→v4 agrega `bloques: []` y no cambia ningún otro dato. Un documento antiguo se guarda como v4 en el siguiente guardado, no al abrirlo. Cualquier otra versión es ilegible. Las claves de almacenamiento **no cambian** (`livin:datos:v1` y `livin:posicion:v1`).
- Nada derivado de la rutina se guarda: ni dónde debería estar cada familiar ni su posición (ver el [ADR del movimiento hacia un objetivo](004-movimiento-hacia-objetivo-reloj.md)).

## Consequences

**Más fácil:**
- La baja en cascada de bloques reutiliza el mismo recorrido que la de actividades, con las mismas pruebas del cuarto con baño interno.
- Agregar más adelante horarios por día de la semana es ampliar la lista cerrada de `dias` con una migración que reparta los bloques existentes, sin cambiar su identidad.
- Una sincronización multiusuario puede fusionar bloques registro a registro, con su id y su auditoría.

**Más difícil:**
- El validador comprueba la superposición entre registros, y cada operación que crea o edita un bloque debe rechazar la superposición antes de guardar.
- La confirmación de eliminar un espacio debe contar también los bloques que se eliminarán, además de las actividades.
- Los datos v4 no se pueden leer con una versión anterior de la app. En la PoC (desechable, solo local) es aceptable; para el producto real la migración y el validador pasan al stack oficial.
- Hay que probar la migración con documentos v1, v2 y v3 reales y con documentos corruptos.

**A revisar si este ADR es reemplazado:** si una pieza futura permitiera bloques que cruzan la medianoche, rutinas para mascotas o horarios por día de la semana, habría que relajar las reglas de `fin`, de `miembroId` o de `dias`; el registro por bloque se mantiene y solo cambian el validador y una migración.
