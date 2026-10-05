# Data Model: Mapa y editor del hogar

Todo se guarda en el almacenamiento local del navegador como dos documentos JSON: `livin:datos:v1` (estado del hogar, sincronizable en el futuro) y `livin:posicion:v1` (posición del personaje, solo de este dispositivo). Los identificadores son UUID v4 (`crypto.randomUUID()`); las fechas, cadenas ISO 8601 en UTC.

Campos de auditoría comunes a Cuenta, Hogar, Membresía, Espacio y Miembro (FR-11):

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| creadoEn | string (ISO 8601) | not null | Fecha de creación |
| actualizadoEn | string (ISO 8601) | not null, ≥ creadoEn | Fecha de la última modificación |
| creadoPor | uuid | not null, FK → Cuenta.id | Cuenta que creó el registro |
| actualizadoPor | uuid | not null, FK → Cuenta.id | Cuenta que lo modificó por última vez |
| eliminadoEn | string (ISO 8601) \| null | null = activo | Borrado lógico |

## Entities

### Cuenta

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad de una persona; en esta feature, solo la del propietario |
| (auditoría) | | | Ver tabla común |

**Indexes:** no aplica (documento JSON; búsqueda lineal sobre menos de 30 registros en total).
**Relationships:** 1 Cuenta → N Membresía; 1 Cuenta → 0..N Miembro (vínculo opcional).
**Spec requirement:** FR-1, FR-11

---

### Hogar

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identificador del hogar |
| nombre | string | not null, = "Mi hogar" | No editable en esta feature |
| (auditoría) | | | Ver tabla común |

**Indexes:** no aplica.
**Relationships:** 1 Hogar → N Membresía, N Espacio, N Miembro. Exactamente un Hogar por estado guardado.
**Spec requirement:** FR-1, FR-11

---

### Membresia

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identificador de la pertenencia |
| cuentaId | uuid | FK → Cuenta.id, not null | Cuenta que pertenece al hogar |
| hogarId | uuid | FK → Hogar.id, not null | Hogar |
| rol | 'propietario' \| 'miembro' | not null | Sin efecto sobre permisos en esta feature |
| (auditoría) | | | Ver tabla común |

**Indexes:** no aplica.
**Relationships:** N:1 con Cuenta y con Hogar.
**Spec requirement:** FR-11, AC-8.4

---

### Espacio

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable: no cambia al renombrar, renumerar ni mover (AC-8.1) |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece |
| tipo | 'sala' \| 'comedor' \| 'cocina' \| 'bano' \| 'lavanderia' \| 'mascota' \| 'dormitorio' \| 'oficina' | not null | Clave del catálogo |
| orden | integer | ≥ 1; consecutivo entre activos del mismo tipo | Posición dentro del tipo; define el nombre automático (no se usa para nombrar baños) |
| secuencia | integer | ≥ 1; creciente por hogar, nunca se reutiliza | Orden de creación; − en Baños elimina el de mayor secuencia |
| nombrePersonalizado | string \| null | ≤ 20 caracteres; único entre activos sin distinguir mayúsculas; sin formato "<tipo> <número>" | Nombre elegido por el usuario |
| contenidoEn | uuid \| null | FK → Espacio.id (dormitorio u oficina activo); solo para tipo 'bano'; null = baño común | Cuarto que contiene al baño interno |
| (auditoría) | | | Ver tabla común |

**Indexes:** no aplica.
**Relationships:** N:1 con Hogar. Baño interno 0..1 : 1 con su cuarto contenedor (cada cuarto contiene como máximo un baño). Invariante: exactamente un baño activo con `contenidoEn = null`.
**Spec requirement:** FR-2, FR-3, FR-4, FR-8, FR-9, FR-11

---

### Miembro

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable del personaje |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece |
| nombre | string | not null, 1–20 caracteres, único entre miembros activos sin distinguir mayúsculas | Nombre del personaje en este hogar; no depende de la cuenta |
| cuentaId | uuid \| null | FK → Cuenta.id | Vínculo opcional; el personaje del propietario está vinculado a su cuenta |
| (auditoría) | | | Ver tabla común |

**Indexes:** no aplica.
**Relationships:** N:1 con Hogar; 0..1 con Cuenta.
**Spec requirement:** FR-1, FR-9, FR-11, AC-8.5

---

### PosicionPersonaje (solo dispositivo, `livin:posicion:v1`)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| clave | uuid \| 'pasillo:izq' \| 'pasillo:der' | not null | Espacio o pasillo donde está el personaje |
| dx | integer | ≥ 0, < ancho del rectángulo | Columna relativa a la esquina del espacio |
| dy | integer | ≥ 0, < alto del rectángulo | Fila relativa a la esquina del espacio |
| direccion | 'arriba' \| 'abajo' \| 'izquierda' \| 'derecha' | not null | Hacia dónde mira |

**Indexes:** no aplica.
**Relationships:** referencia débil a Espacio.id; si deja de ser válida, el personaje aparece en la sala (AC-7.4). Sin auditoría: no se sincroniza.
**Spec requirement:** FR-10, FR-11

---

### Documento `livin:datos:v1`

```json
{
  "version": 1,
  "cuentas": [Cuenta],
  "hogares": [Hogar],
  "membresias": [Membresia],
  "espacios": [Espacio],
  "miembros": [Miembro]
}
```

Se considera ilegible (y se crea el hogar inicial con aviso) si no es JSON válido, si `version ≠ 1`, si falta alguna lista, o si no hay exactamente un hogar, una sala activa, un baño común activo, y al menos una cocina y un dormitorio activos.
