# Data Model: Calificaciones e historial de actividades hechas

Este documento describe solo lo que cambia respecto a los modelos de datos de las features [001](../001-mapa-editor-hogar/data-model.md), [002](../002-familiares-y-mascotas/data-model.md), [003](../003-actividades/data-model.md), [004](../004-rutinas/data-model.md) y [005](../005-jugador-activo-e-intercambios/data-model.md). Cuenta, Hogar, Membresía, Espacio, Miembro, Actividad, Bloque e Intercambio no cambian. El documento sigue en la clave `livin:datos:v1`; su campo `version` pasa de 5 a 6 y gana la lista `historial` (ADR-006 de historial). La clave `livin:posicion:v1` no cambia.

## Entities

### EntradaHistorial (nueva en la versión 6)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable (AC-9.1) |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece |
| actividadId | uuid | FK → Actividad.id, not null | Actividad que se hizo (puede estar eliminada) |
| miembroId | uuid | FK → Miembro.id, not null | Persona o mascota a cargo de la actividad al hacerla (antes del regreso de una repetitiva intercambiada); puede estar eliminada |
| espacioId | uuid \| null | FK → Espacio.id | Espacio de la actividad al hacerla, o null; puede estar eliminado |
| nombre | string | not null, no vacío | Nombre de la actividad al hacerla (instantánea) |
| icono | string | not null | Icono de la actividad al hacerla (instantánea) |
| hechaEn | string | not null, no vacío | Fecha y hora del instante (`ctx.ahora()`, UTC) |
| dia | string | `AAAA-MM-DD` real, not null | Día del calendario local en que se hizo (el `hoy` con que se marcó "Hecho"); base de "Hoy", "Ayer" y "Hace N días" |
| estrellas | integer \| null | 1 a 5, o null | Calificación; null mientras no esté calificada |
| calificadoPor | uuid \| null | FK → Miembro.id; null si y solo si `estrellas` es null | Persona que dio las estrellas; la única que puede cambiarlas o quitarlas; puede estar eliminada |
| (auditoría) | | | Igual que en la 001: creadoEn, actualizadoEn, creadoPor, actualizadoPor, eliminadoEn |

**Indexes:** no aplica (documento JSON; a lo sumo 200 entradas, recorridas linealmente).
**Relationships:** N:1 con Hogar; N:1 con Actividad; N:1 con Miembro (acreditada); N:1 con Espacio (opcional); N:1 con Miembro (quien calificó, opcional). Las referencias son por id y los registros de actividades, miembros y espacios nunca se borran, así que siempre resuelven. Orden: el arreglo está en orden de creación. Límite al crear: 200 entradas (se descartan las más antiguas por posición).
**Spec requirement:** FR-1, FR-2, FR-5, FR-6, FR-9

---

### Estado derivado (solo en memoria; no se guarda)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| lista | EntradaHistorial[] | por filtro | Las entradas de la más reciente a la más antigua, todas o las de un miembro |
| promedio | `{ calificadas, texto }` | por miembro | Media de las estrellas de sus entradas calificadas que siguen en el historial; un decimal, coma decimal, mitades hacia arriba |
| estado de calificación | 'libre' \| 'propia' \| 'mia' \| 'bloqueada' | por entrada y jugador | Qué puede hacer quien juega con la calificación de una entrada |
| día mostrado | string | por entrada | "Hoy", "Ayer", "Hace N días" o la fecha, a partir de `dia` y de `hoy` |

**Indexes:** no aplica.
**Relationships:** se calcula con `(estado, hoy, jugadorId)`; se recalcula tras cada cambio del historial o del filtro.
**Spec requirement:** FR-3, FR-4

---

### Documento `livin:datos:v1` (versión 6)

```json
{
  "version": 6,
  "cuentas": [Cuenta],
  "hogares": [Hogar],
  "membresias": [Membresia],
  "espacios": [Espacio],
  "miembros": [Miembro],
  "actividades": [Actividad],
  "bloques": [Bloque],
  "intercambios": [Intercambio],
  "historial": [EntradaHistorial]
}
```

**Migración:**
- Un documento `version: 5` que cumple las condiciones de la 005 se migra al cargar: el hogar recibe `historial: []`.
- Los documentos `version` 1 a 4 se migran en cadena hasta la 5 y luego a la 6.
- Abrir un documento no lo reescribe: se guarda como versión 6 en el siguiente guardado.

**Ilegible** (se crea el hogar inicial con aviso), además de las condiciones de la 005: falta la lista `historial`; alguna entrada tiene un `nombre` o un `hechaEn` que no es texto no vacío, o un `dia` que no es una fecha real; una `actividadId` o un `miembroId` que no existen en el documento (eliminados incluidos), o un `espacioId` no nulo que no existe; unas `estrellas` que no son nulas ni un entero de 1 a 5; `estrellas` y `calificadoPor` no ambos nulos ni ambos presentes; o un `calificadoPor` que no es un miembro del documento. El tope de 200 se aplica al crear, no al cargar. Cualquier `version` distinta de 1 a 6 sigue siendo ilegible.

**Spec requirement:** FR-8
