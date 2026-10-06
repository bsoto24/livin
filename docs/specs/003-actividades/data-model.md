# Data Model: Actividades

Este documento describe solo lo que cambia respecto a los modelos de datos de la [feature 001](../001-mapa-editor-hogar/data-model.md) y la [feature 002](../002-familiares-y-mascotas/data-model.md). Cuenta, Hogar, Membresía, Espacio, Miembro y PosicionPersonaje no cambian. El documento sigue en la clave `livin:datos:v1`; su campo `version` pasa de 2 a 3 y gana la lista `actividades` (ADR-003 de modelo de actividades).

## Entities

### Actividad (nueva en la versión 3)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable (AC-9.1) |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece |
| nombre | string | not null, 1–30 caracteres, sin espacios en los extremos; puede repetirse | Nombre de la tarea |
| icono | 'platos' \| 'barrer' \| 'ropa' \| 'basura' \| 'limpiar' \| 'compras' \| 'plantas' \| 'mascota' \| 'otra' | not null | Icono de la burbuja y de las listas |
| miembroId | uuid | FK → Miembro.id (activo), not null | Miembro asignado: el propietario, un familiar o una mascota |
| espacioId | uuid \| null | FK → Espacio.id (activo) | Espacio de la actividad; null = sin espacio. Nunca un pasillo |
| tipo | 'puntual' \| 'repetitiva' | not null | Si se hace una vez o se repite |
| vence | 'AAAA-MM-DD' | not null, fecha real del calendario local | Próxima fecha de vencimiento; en una repetitiva avanza a hoy + frecuencia al hacerla |
| frecuenciaDias | 1 \| 2 \| 3 \| 7 \| 14 \| 30 \| null | not null en las repetitivas; null en las puntuales | Cada cuántos días se repite |
| hechaEn | 'AAAA-MM-DD' \| null | null mientras está pendiente; siempre null en las repetitivas | Día en que se hizo una puntual |
| (auditoría) | | | Igual que en la 001: creadoEn, actualizadoEn, creadoPor, actualizadoPor, eliminadoEn |

**Indexes:** no aplica (documento JSON; búsqueda lineal sobre a lo sumo unas decenas de actividades).
**Relationships:** N:1 con Hogar; N:1 con Miembro (obligatorio); N:0..1 con Espacio. Invariante: ninguna actividad no eliminada apunta a un miembro o a un espacio eliminado. La baja de un espacio o de un miembro da de baja a sus actividades en la misma operación (también las del baño interno que se elimina con su cuarto). Límite al crear: 50 actividades pendientes.
**Spec requirement:** FR-1, FR-3, FR-9, FR-11, FR-12

---

### Estado derivado (solo en memoria; no se guarda)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| atraso | integer | días entre `vence` y hoy | Negativo si vence en el futuro; 0 si vence hoy |
| porHacer | Actividad[] | pendientes con atraso ≥ 0 | Ordenadas de la más atrasada a la menos; a igual atraso, por creación |
| limpieza de un espacio | 'limpio' \| 'desordenado' \| 'desastre' | según la más atrasada de sus actividades por hacer | Atraso 0 o ninguna: limpio; 1–2: desordenado; 3 o más: desastre |
| burbuja | { tipo: 'espacio' \| 'miembro', id, icono, actividades: id[], mas } | una por lugar | Lugar = espacio, o miembro para las actividades sin espacio |
| objetos del suelo | { x, y, variante }[] | 0, 4 o 12, limitados por las casillas libres del espacio | Posiciones fijas derivadas del id del espacio y de la casilla |

**Indexes:** no aplica.
**Relationships:** se calcula con `(estado, hoy)` y, para las casillas, con la distribución del mapa; se recalcula al cambiar las actividades, los espacios o el día (ADR-003 de estado derivado).
**Spec requirement:** FR-2, FR-4, FR-5, FR-6, FR-10

---

### Documento `livin:datos:v1` (versión 3)

```json
{
  "version": 3,
  "cuentas": [Cuenta],
  "hogares": [Hogar],
  "membresias": [Membresia],
  "espacios": [Espacio],
  "miembros": [Miembro],
  "actividades": [Actividad]
}
```

**Migración:**
- Un documento `version: 2` que cumple las condiciones de la 002 se migra al cargar: recibe `actividades: []`.
- Un documento `version: 1` que cumple las de la 001 se migra a la versión 2 y luego a la 3.
- Abrir un documento no lo reescribe: se guarda como versión 3 en el siguiente guardado.

**Ilegible** (se crea el hogar inicial con aviso), además de las condiciones de la 002: el documento no tiene la lista `actividades`, o alguna actividad no eliminada cumple cualquiera de estas condiciones:
- Su `nombre` no es texto.
- Su `icono` no está en la lista, o su `vence` no es una fecha real.
- Apunta a un miembro que no está activo, o a un espacio no nulo que no está activo.
- Es puntual con frecuencia, o con un `hechaEn` que no es nulo ni una fecha real.
- Es repetitiva sin una frecuencia de la lista, o con `hechaEn`.

Las actividades eliminadas no se validan. Cualquier `version` distinta de 1, 2 o 3 sigue siendo ilegible.

**Spec requirement:** FR-11
