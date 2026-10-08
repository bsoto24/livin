# Data Model: Rutinas

Documento guardado en `livin:datos:v1`, ahora con `version: 4`. Cambios respecto de la 003: nueva colección `bloques`. Las
versiones 1, 2 y 3 se migran al cargar (`migrarAV2`, `migrarAV3`, `migrarAV4`) y se guardan como v4 en el siguiente guardado.

## Entities

### Bloque

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null, estable | Identificador del bloque; no cambia al editarlo |
| hogarId | uuid | FK → Hogar, not null | Hogar al que pertenece |
| miembroId | uuid | FK → Miembro, not null; familiar activo (persona que no es el personaje del propietario) | Familiar dueño del bloque; no cambia al editarlo |
| dias | texto | `laborables` o `finde`; no cambia al editarlo | Horario: Lun–Vie o Sáb–Dom |
| inicio | entero | múltiplo de 30, de 0 a 1410 | Minuto del día en que empieza |
| fin | entero | múltiplo de 30, de 30 a 1440, mayor que `inicio` | Minuto del día en que termina (no incluido) |
| espacioId | uuid o null | FK → Espacio activo (nunca un pasillo); null = "Fuera de casa" | Lugar del bloque |
| creadoEn | texto ISO | not null | Auditoría |
| actualizadoEn | texto ISO | not null | Auditoría |
| creadoPor | uuid | FK → Cuenta | Cuenta local del propietario |
| actualizadoPor | uuid | FK → Cuenta | Cuenta local del propietario |
| eliminadoEn | texto ISO o null | null mientras está activo | Borrado lógico |

**Indexes:** ninguno (documento local). Las consultas recorren la colección por `miembroId` + `dias` o por `espacioId`; como mucho
8 familiares × 16 bloques activos.
**Relationships:** N:1 con Miembro (`miembroId`); N:1 opcional con Espacio (`espacioId`); N:1 con Hogar. Sin superposición entre
bloques activos del mismo `miembroId` y `dias`. Baja lógica en cascada con su familiar o con su espacio (y con el baño interno que
se elimina con su cuarto).
**Spec requirement:** FR-1, FR-9, FR-10, FR-11.

---

### Móvil (estado de sesión, no se guarda)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | = Miembro.id | Habitante que se mueve |
| x, y, desde, progresoMs, pausaMs, tramo, direccion | — | como en la feature 002 | Casilla, paso en curso y paseo al azar |
| objetivo | objeto | `{ tipo: 'libre' }`, `{ tipo: 'fuera' }` o `{ tipo: 'espacio', espacioId }` | Lo que pide su bloque vigente; mascotas siempre libres |
| fase | texto | `pasea`, `planifica`, `ruta` o `fuera` | Qué está haciendo |
| ruta | lista de casillas | vacía salvo en fase `ruta` | Casillas que le faltan pisar |

**Indexes:** —
**Relationships:** uno por habitante activo.
**Spec requirement:** FR-2, FR-3, FR-4, FR-6, FR-7 (nada de esto se guarda: AC-11.8).
