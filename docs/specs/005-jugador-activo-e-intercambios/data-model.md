# Data Model: Jugador activo e intercambios

Este documento describe solo lo que cambia respecto a los modelos de datos de las features [001](../001-mapa-editor-hogar/data-model.md), [002](../002-familiares-y-mascotas/data-model.md), [003](../003-actividades/data-model.md) y [004](../004-rutinas/data-model.md). Cuenta, Hogar, Membresía, Espacio, Miembro y Bloque no cambian. El documento sigue en la clave `livin:datos:v1`; su campo `version` pasa de 4 a 5, gana la lista `intercambios` y cada actividad gana el campo `devolverA` (ADR-005 de intercambios). La clave `livin:posicion:v1` gana el campo opcional `jugadorId` (ADR-005 de jugador activo).

## Entities

### Intercambio (nuevo en la versión 5)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable (AC-11.1) |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece |
| proponenteId | uuid | FK → Miembro.id, not null | Persona que propone y dueña de la actividad ofrecida |
| destinatarioId | uuid | FK → Miembro.id, not null | Persona a quien se propone: la dueña de la actividad pedida al proponer |
| actividadOfrecidaId | uuid | FK → Actividad.id, not null | Actividad de quien propone |
| actividadPedidaId | uuid | FK → Actividad.id, not null | Actividad de la destinataria |
| marcaOfrecida | string | not null | `actualizadoEn` de la ofrecida al proponer |
| marcaPedida | string | not null | `actualizadoEn` de la pedida al proponer |
| estado | 'pendiente' \| 'aceptado' \| 'rechazado' \| 'retirado' | not null | Estado de la propuesta |
| respondidoEn | string \| null | null mientras está pendiente | Fecha y hora en que se aceptó, rechazó, retiró o quitó |
| (auditoría) | | | Igual que en la 001: creadoEn, actualizadoEn, creadoPor, actualizadoPor, eliminadoEn |

**Indexes:** no aplica (documento JSON; búsqueda lineal sobre a lo sumo unas decenas de propuestas vigentes).
**Relationships:** N:1 con Hogar; N:1 con dos Miembros; N:1 con dos Actividades. Las referencias son por id y las propuestas nunca se borran, así que siempre resuelven; si una persona o una actividad se elimina, la propuesta deja de ser vigente (se calcula, no se guarda). Límite al crear: 20 propuestas vigentes por hogar.
**Spec requirement:** FR-7, FR-8, FR-10, FR-12, FR-13

---

### Actividad (cambia en la versión 5)

Gana un campo; el resto no cambia.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| devolverA | uuid \| null | FK → Miembro.id (persona activa distinta de miembroId); solo en repetitivas; null en las puntuales | Responsable original de una repetitiva que está en poder de otra persona por un intercambio; vuelve a él al hacerla |

**Reglas de mantenimiento:** se fija al aceptar un intercambio (solo en repetitivas); se borra al marcar "Hecho" (la actividad vuelve a ese miembro), al reasignarla a otra persona desde su ficha, al volverla puntual y al eliminar al miembro al que debía volver. Una actividad con `devolverA` no nulo no se ofrece ni se pide en un intercambio.
**Spec requirement:** FR-9, FR-12

---

### Estado derivado (solo en memoria; no se guarda)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| vigente | boolean | por propuesta | Verdadero si la propuesta está pendiente, sus dos actividades siguen pendientes y su `actualizadoEn` es igual a `marcaOfrecida` y `marcaPedida` |
| recibidas / enviadas | Intercambio[] | por persona | Propuestas pendientes (vigentes o no) donde la persona es destinataria o proponente |
| número de recibidas | integer | por persona | Propuestas vigentes recibidas; es el `(n)` del botón "Intercambios" |
| ofrecibles / pedibles | Actividad[] | por persona | Actividades que se pueden ofrecer (pendientes de la persona) o pedir (pendientes de otras personas, no de mascotas), sin las que están en una propuesta vigente ni las que tienen regreso pendiente |

**Indexes:** no aplica.
**Relationships:** se calcula con `(estado)`; se recalcula tras cada cambio de actividades o de propuestas (ADR-005 de intercambios).
**Spec requirement:** FR-6, FR-7, FR-8, FR-10

---

### Documento `livin:datos:v1` (versión 5)

```json
{
  "version": 5,
  "cuentas": [Cuenta],
  "hogares": [Hogar],
  "membresias": [Membresia],
  "espacios": [Espacio],
  "miembros": [Miembro],
  "actividades": [Actividad],
  "bloques": [Bloque],
  "intercambios": [Intercambio]
}
```

**Migración:**
- Un documento `version: 4` que cumple las condiciones de la 004 se migra al cargar: cada actividad recibe `devolverA: null` y el hogar `intercambios: []`.
- Los documentos `version` 1, 2 y 3 se migran en cadena hasta la 4 y luego a la 5.
- Abrir un documento no lo reescribe: se guarda como versión 5 en el siguiente guardado.

**Ilegible** (se crea el hogar inicial con aviso), además de las condiciones de la 004: alguna actividad no eliminada tiene un `devolverA` que no es nulo ni una persona activa distinta de su responsable, o lo tiene siendo puntual; falta la lista `intercambios`; algún intercambio tiene un `estado` fuera de la lista; o algún intercambio `pendiente` tiene referencias a miembros o actividades que no existen en el documento (eliminados incluidos) o marcas que no son texto.

Las actividades eliminadas y los intercambios ya respondidos no se validan más allá de su estado. Cualquier `version` distinta de 1 a 5 sigue siendo ilegible.

**Spec requirement:** FR-12

---

### Posición guardada `livin:posicion:v1` (cambia)

```json
{ "clave": "<espacio>", "dx": 0, "dy": 0, "direccion": "abajo", "jugadorId": "<uuid>" }
```

`jugadorId` es opcional: un documento sin él significa que juega el propietario. Si el miembro no existe, ya no es el propietario ni un familiar activo, o no es un texto, juega el propietario. La posición es la de quien juega. Es estado del dispositivo: no va en el documento del hogar.

**Spec requirement:** FR-6
