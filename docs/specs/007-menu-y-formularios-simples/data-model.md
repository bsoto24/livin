# Data Model: Menú por secciones y formularios simples

Este documento describe solo lo que cambia respecto a los modelos de datos de las features [001](../001-mapa-editor-hogar/data-model.md), [002](../002-familiares-y-mascotas/data-model.md), [003](../003-actividades/data-model.md), [004](../004-rutinas/data-model.md), [005](../005-jugador-activo-e-intercambios/data-model.md) y [006](../006-calificaciones-e-historial/data-model.md). Cuenta, Hogar, Membresía, Espacio, Bloque, Intercambio y EntradaHistorial no cambian. El documento sigue en la clave `livin:datos:v1`; su campo `version` pasa de 6 a 7 (ADR-007 de aspecto). La clave `livin:posicion:v1` no cambia.

## Entities

### Miembro (cambia en la versión 7)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable (sin cambios) |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece (sin cambios) |
| nombre | string | 1–20 caracteres, único entre los activos | Nombre (sin cambios) |
| cuentaId | uuid \| null | FK → Cuenta.id | Cuenta vinculada; solo el propietario la tiene (sin cambios) |
| tipo | 'persona' \| 'mascota' | not null | Clase de miembro (sin cambios) |
| aspecto | string \| null | uno de `adulto`, `adulta`, `nino`, `nina`, `anciano`, `anciana`, `neutro` en un familiar activo; `null` en el propietario y en las mascotas | **Nuevo.** Reemplaza a `genero`: edad y género en un solo dato; decide el icono, el color y el tamaño del dibujo |
| especie | string \| null | uno de `perro`, `gato`, `conejo`, `hamster`, `loro`, `otro` en una mascota activa; `null` en las personas | Se amplía con tres claves; las tres anteriores no cambian |
| (auditoría) | | | Igual que en la 001: creadoEn, actualizadoEn, creadoPor, actualizadoPor, eliminadoEn |

Se eliminan `genero` y `parentesco`.

**Indexes:** no aplica (documento JSON).
**Relationships:** sin cambios.
**Spec requirement:** FR-5, FR-6, FR-14

---

### Actividad (cambia una restricción en la versión 7)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| miembroId | uuid | FK → Miembro.id, not null; una **persona** activa (propietario o familiar) en toda actividad no eliminada | Responsable. **Cambia:** desde la v7 una mascota ya no puede serlo |
| (demás campos) | | sin cambios | `nombre`, `icono`, `espacioId`, `tipo`, `vence`, `frecuenciaDias`, `hechaEn`, `devolverA` y la auditoría no cambian |

La migración da de baja (`eliminadoEn` y auditoría) las actividades no eliminadas de mascotas. Crear una actividad en varios lugares crea un registro independiente por lugar, con id propio y sin ningún vínculo entre ellos.

**Indexes:** no aplica (documento JSON).
**Relationships:** sin cambios; la restricción es sobre la referencia a Miembro.
**Spec requirement:** FR-9, FR-10, FR-14

---

### Catálogos (datos de código, no se guardan)

| Catálogo | Contenido |
|----------|-----------|
| ASPECTOS / DATOS_ASPECTO | 7 claves con etiqueta, icono (👨 👩 👦 👧 👴 👵 🧑), color de marcador (masculinos, femeninos y neutro) y escala (0,75 para niño y niña; 1 para el resto) |
| ESPECIES / DATOS_ESPECIE | 6 claves con etiqueta, icono (🐶 🐱 🐰 🐹 🦜 🐾) y color de marcador propio |
| SUGERENCIAS | 10 sugerencias de actividad (nombre ≤ 30 y uno de los 9 iconos); se ven las primeras 6 con el campo vacío |
| SECCIONES | 4 secciones de la barra: Espacios, Familia, Actividades e Intercambios |

**Indexes:** no aplica (constantes del código).
**Relationships:** `aspecto` de un Miembro apunta a ASPECTOS, `especie` a ESPECIES e `icono` de una sugerencia a los 9 iconos de la 003.
**Spec requirement:** FR-1, FR-5, FR-6, FR-8

---

### Estado derivado (solo en memoria; no se guarda)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| sección abierta | string \| null | una de las 4 claves o null | Qué drawer está abierto; null en exploración |
| pestaña de Actividades | 'pendientes' \| 'hechas' | | Pestaña elegida dentro del drawer |
| icono de la ficha | `{ icono, editable, manual }` | por ficha | Se deduce del nombre escrito: fijo con una sugerencia; a mano o genérico si no |
| lugares marcados | conjunto de ids de espacio | por ficha | Selección múltiple al crear, única al editar |

**Indexes:** no aplica.
**Relationships:** se calcula con el estado de la ficha y el documento; no se guarda.
**Spec requirement:** FR-1, FR-8, FR-9

---

### Documento `livin:datos:v1` (versión 7)

```json
{
  "version": 7,
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
- Un documento `version: 6` que cumple las condiciones de la 006 se migra al cargar (`migrarAV7`): el propietario (por su membresía) queda con `aspecto: null`; cada otra persona pasa de `genero` a `aspecto` (femenino → `adulta`, masculino → `adulto`, otro o ausente → `neutro`); se quitan `genero` y `parentesco` de todos los miembros; las actividades no eliminadas de mascotas activas se dan de baja con la misma hora (`reloj` inyectado) y su auditoría. El historial no se toca.
- Los documentos `version` 1 a 5 se migran en cadena hasta la 6 y luego a la 7.
- Abrir un documento no lo reescribe: se guarda como versión 7 en el siguiente guardado.

**Ilegible** (se crea el hogar inicial con aviso), además de las condiciones de las versiones anteriores que siguen vigentes: una persona activa no propietaria con un `aspecto` fuera de la lista; una mascota activa con una `especie` fuera de la lista o con un `aspecto` no nulo; el propietario con un `aspecto` no nulo; o una actividad no eliminada cuyo responsable no es una persona activa. Cualquier `version` distinta de 1 a 7 sigue siendo ilegible.

**Indexes:** no aplica.
**Relationships:** agrupa las colecciones de las features 001 a 006; no se agregan colecciones nuevas.
**Spec requirement:** FR-14, FR-15
