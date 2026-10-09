# ADR-005-intercambios-formato-v5: Intercambios de actividades, "solo la próxima vez" y documento guardado versión 5

**Status:** Accepted
**Date:** 2026-10-08
**Feature:** 005-jugador-activo-e-intercambios

## Context

El documento guardado `livin:datos:v1` está en `version: 4` con espacios, miembros, actividades y bloques de rutina, todos con identidad estable y borrado lógico. El [ADR-001 de modelo de datos](001-modelo-datos-local-first-multiusuario.md) fija que las entidades se referencian por id y que cada registro lleva auditoría. El [ADR-003 del modelo de actividades](003-modelo-actividades-formato-v3.md) y el [ADR-004 del modelo de rutinas](004-modelo-rutinas-formato-v4.md) aplicaron ese criterio con colecciones planas y bajas en cascada en la misma operación pura. La responsabilidad de una actividad es su `miembroId`, y de él cuelgan las burbujas, la hoja, las listas, el contador de pendientes de un miembro y las bajas en cascada.

Esta feature agrega los intercambios: un miembro propone cambiar una de sus actividades por una de otro, y el otro acepta o rechaza en su turno. Requisitos del PRD que condicionan la decisión:

- Un intercambio es de una actividad por una actividad entre dos personas (propietario o familiares). Las actividades de las mascotas no se intercambian.
- Flujo de propuesta y respuesta, sin contraofertas. Una propuesta queda pendiente hasta que la respondan o la retire quien la hizo.
- **Solo la próxima vez:** una actividad puntual cambia de responsable hasta que se hace; en una repetitiva, solo la próxima vez, y después vuelve a su responsable original.
- Una propuesta deja de ser válida si una de sus dos actividades se edita, se elimina, se marca como hecha o pierde a su responsable.
- Una actividad solo puede estar en una propuesta pendiente a la vez. Hay un tope de propuestas pendientes.
- Hay hogares guardados con `version` 1, 2, 3 y 4 en dispositivos reales: abrirlos no debe perder datos ni mostrar un error.
- El formato guardado es difícil de revertir. Y el código ya verificado en el teléfono (003 y 004) no debe tocarse más de lo necesario.

## Options Considered

### Option A: Colección `intercambios`, campo `devolverA` en la actividad y vigencia derivada de una marca de actualización

Cada intercambio es un registro con los dos miembros, las dos actividades, el estado (`pendiente`, `aceptado`, `rechazado` o `retirado`) y una marca por actividad: su `actualizadoEn` en el momento de proponer. Es **vigente** mientras sea `pendiente`, las dos actividades sigan pendientes y conserven esa marca. Al aceptar se intercambian los `miembroId` de las dos actividades; en una repetitiva `devolverA` guarda al responsable original y, al marcarla como hecha, vuelve a él. El documento pasa a `version: 5` con `intercambios: []` y cada actividad gana `devolverA: null`.

**Pros:** `miembroId` sigue siendo el responsable actual, así que burbujas, hoja, listas y bajas en cascada de la 003 y la 004 funcionan sin cambios; la vigencia no exige tocar ninguna operación existente, porque cualquier cambio de una actividad ya actualiza su marca; la migración es mínima.
**Cons:** `devolverA` es un campo derivado que hay que mantener (se borra al volver, al reasignar a mano y al eliminar al original); la vigencia depende de que la marca de cada actividad crezca con cada cambio; `tocar` lo garantiza añadiendo un sufijo `+` a la marca anterior cuando el reloj no avanzó (dos cambios en el mismo instante), por lo que la limitación de un reloj detenido ya no existe.

### Option B: Responsable derivado de los intercambios aceptados

`miembroId` no cambia nunca por un intercambio; una función `responsableActual(actividad)` consulta los intercambios aceptados que aún no se consumieron.

**Pros:** una sola fuente de verdad y un historial completo de quién tuvo qué.
**Cons:** toda lectura de `miembroId` en la 003 y la 004 (burbujas, hoja, lista, pendientes por miembro, bajas en cascada, ficha) pasa a ser una llamada a la función, y olvidar una produce un error silencioso; toca código ya verificado en el teléfono.

### Option C: Vigencia con anulación explícita en cada operación

Igual que A en el modelo, pero cada operación que toca una actividad (editar, eliminar, marcar como hecha) y las dos bajas en cascada buscan sus propuestas y las pasan a `anulado`.

**Pros:** el estado de cada propuesta es siempre explícito en el documento.
**Cons:** hay que tocar cinco operaciones ya probadas y olvidar una deja propuestas zombis; más código y más lugares donde fallar.

### Option D: Cambio permanente de responsable, sin registro de la propuesta

Aceptar intercambia los `miembroId` para siempre y no se guarda nada de la propuesta.

**Pros:** el más simple.
**Cons:** una repetitiva no vuelve a su responsable (no cumple "solo la próxima vez"); no hay propuestas pendientes que mostrar, aceptar o retirar.

## Decision

**We chose Option A (colección `intercambios`, `devolverA` y vigencia derivada de la marca de actualización, documento `version: 5`)** porque es la única que cumple "solo la próxima vez" y la anulación por edición sin tocar el código verificado de las features anteriores. La opción B lo cumple pero obliga a cambiar todos los consumidores de `miembroId`; la C exige tocar cinco operaciones; la D no cumple el requisito.

Reglas que fija la decisión:

- **Campos de `Intercambio`:** `id`, `hogarId`, `proponenteId`, `destinatarioId` (miembros), `actividadOfrecidaId`, `actividadPedidaId`, `marcaOfrecida` y `marcaPedida` (el `actualizadoEn` de cada actividad al proponer), `estado` (`pendiente`, `aceptado`, `rechazado` o `retirado`), `respondidoEn` (texto de fecha y hora, o nulo) y la auditoría de siempre.
- **Vigente:** un intercambio es vigente si está `pendiente`, las dos actividades existen, no están eliminadas, no están hechas y su `actualizadoEn` es igual a la marca guardada. Solo los vigentes se muestran como propuestas, se pueden aceptar y cuentan para el tope. Los no vigentes se muestran como "ya no vigente", conservan el estado `pendiente` en el documento y no se borran.
- **Proponer** exige que: quien propone sea una persona (propietario o familiar activo) y dueña de la actividad ofrecida; la pedida sea de otra persona activa (no una mascota); las dos sean pendientes (también las que aún no vencen); ninguna esté ya en un intercambio vigente; ninguna sea una repetitiva con `devolverA` no nulo; y haya menos de 20 intercambios vigentes en el hogar.
- **Aceptar** exige que sea vigente y que responda el destinatario. Intercambia los `miembroId` de las dos actividades y actualiza su auditoría. En cada repetitiva, `devolverA` pasa a ser su responsable anterior; en una puntual, `devolverA` sigue siendo nulo. El intercambio queda `aceptado`. **Rechazar** lo deja `rechazado` y **retirar** (solo quien propuso) lo deja `retirado`; ninguno cambia las actividades.
- **Marcar como hecha** una repetitiva con `devolverA` no nulo la devuelve a ese miembro (`miembroId = devolverA`, `devolverA = null`) además de avanzar su vencimiento. Si ese miembro ya no está activo, la actividad se queda con quien la tiene.
- **Reasignar a mano** una actividad desde su ficha borra su `devolverA`. **Eliminar a un miembro** borra el `devolverA` de las actividades que debían volver a él.
- Nada derivado se guarda: ni la vigencia, ni los avisos de propuestas pendientes por jugador.
- **Versión 5:** se acepta `version` 1, 2, 3, 4 o 5. La migración v4→v5 agrega `intercambios: []` y `devolverA: null` a cada actividad, y no cambia nada más; las migraciones se encadenan (v1→v2→v3→v4→v5). Un documento antiguo se guarda como v5 en el siguiente guardado, no al abrirlo. Las claves de almacenamiento no cambian.
- Un documento v5 es **ilegible** (se crea el hogar inicial con aviso, como hoy) si no cumple las condiciones de las versiones anteriores o si: alguna actividad no eliminada tiene un `devolverA` que no es nulo ni el de un miembro activo distinto de su `miembroId`, o lo tiene siendo puntual; falta la lista `intercambios`; o algún intercambio `pendiente` tiene un `estado` fuera de la lista, referencias a ids que no existen en el documento (eliminados incluidos) o marcas que no son texto. Los intercambios resueltos (`aceptado`, `rechazado`, `retirado`) no se validan más allá de su estado.

## Consequences

**Más fácil:**
- La 003 y la 004 siguen funcionando sin cambios: `miembroId` es el responsable actual para todos.
- Una futura calificación de la pieza 6 puede leer el historial de intercambios aceptados sin migrar nada.
- Una sincronización multiusuario puede fusionar propuestas registro a registro, con su id y su auditoría.

**Más difícil:**
- `devolverA` es un dato extra con cuatro reglas de mantenimiento (volver al hacerla, reasignar a mano, eliminar al original, no volver a intercambiar mientras está fuera de su responsable); cada una necesita su prueba.
- La vigencia confía en que toda operación que cambia una actividad llame a la misma función que actualiza su auditoría. Una prueba de contrato debe comprobarlo para editar, eliminar, marcar como hecha, aceptar y las bajas en cascada, también con el reloj detenido.
- Los intercambios no vigentes se acumulan en el documento. A la escala de la PoC no importa; el producto real tendrá que decidir su limpieza.
- Los datos v5 no se pueden leer con una versión anterior. En la PoC (desechable, solo local) es aceptable.

**A revisar si este ADR es reemplazado:** si una pieza futura permitiera contraofertas, varias actividades por intercambio o favores con "deuda", habría que ampliar el registro de `Intercambio`; la regla "solo la próxima vez" con `devolverA` se mantiene o se sustituye por un historial (opción B).
