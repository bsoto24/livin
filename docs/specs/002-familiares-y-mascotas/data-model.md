# Data Model: Familiares y mascotas

Este documento describe solo lo que cambia respecto al [modelo de datos de la feature 001](../001-mapa-editor-hogar/data-model.md). Cuenta, Hogar, Membresía, Espacio y PosicionPersonaje no cambian. El documento sigue en la clave `livin:datos:v1`; lo que cambia es su campo `version`, que pasa de 1 a 2 (ADR-002 de modelo de miembros).

## Entities

### Miembro (ampliado en la versión 2)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, not null | Identidad estable del miembro (AC-10.1) |
| hogarId | uuid | FK → Hogar.id, not null | Hogar al que pertenece |
| nombre | string | not null, 1–20 caracteres, sin espacios en los extremos, único entre miembros activos sin distinguir mayúsculas | Nombre en este hogar |
| cuentaId | uuid \| null | FK → Cuenta.id | Solo el personaje del propietario está vinculado; los habitantes nunca (AC-10.3) |
| tipo | 'persona' \| 'mascota' | not null | Clase del miembro |
| parentesco | 'pareja' \| 'hijo' \| 'padre_madre' \| 'hermano' \| 'abuelo' \| 'otro' \| null | null en mascotas y en el propietario; obligatorio al dar de alta un familiar | Relación del familiar con el propietario |
| genero | 'femenino' \| 'masculino' \| 'otro' \| null | null en mascotas; obligatorio al dar de alta un familiar; nulo en el propietario | Solo afecta al aspecto |
| especie | 'perro' \| 'gato' \| 'otro' \| null | null en personas; obligatoria en mascotas | Aspecto de la mascota |
| (auditoría) | | | Igual que en la 001: creadoEn, actualizadoEn, creadoPor, actualizadoPor, eliminadoEn |

**Indexes:** no aplica (documento JSON; búsqueda lineal sobre menos de 20 miembros).
**Relationships:** N:1 con Hogar; 0..1 con Cuenta. Invariante: exactamente un miembro activo vinculado a la cuenta propietaria (el personaje del propietario). Límites al crear: 8 familiares y 4 mascotas activos.
**Spec requirement:** FR-1, FR-2, FR-3, FR-9, FR-10

---

### HabitanteEnMovimiento (solo en memoria; no se guarda)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | = Miembro.id de un habitante activo | A quién representa |
| x, y | integer | casilla transitable | Casilla que ocupa o a la que se dirige |
| desde | { x, y } \| null | no null solo mientras camina | Casilla de origen del paso; también se considera ocupada |
| progresoMs | integer | 0–500 | Tiempo que falta para terminar el paso |
| pausaMs | integer | 0–4000 | Tiempo de pausa restante |
| tramo | integer | 0–6 | Casillas que le quedan del tramo actual |
| direccion | 'arriba' \| 'abajo' \| 'izquierda' \| 'derecha' \| null | null fuera de un tramo | Dirección del tramo |

**Indexes:** no aplica.
**Relationships:** referencia débil a Miembro.id; se recrea al abrir la app y al tocar "Listo" (FR-7).
**Spec requirement:** FR-5, FR-6, FR-7

---

### Documento `livin:datos:v1` (versión 2)

```json
{
  "version": 2,
  "cuentas": [Cuenta],
  "hogares": [Hogar],
  "membresias": [Membresia],
  "espacios": [Espacio],
  "miembros": [Miembro]
}
```

**Migración:** un documento `version: 1` que cumple las condiciones de la 001 se migra al cargar: cada miembro recibe `tipo: 'persona'` y `parentesco`, `genero` y `especie` nulos. No se reescribe al abrir; se guarda como versión 2 en el siguiente guardado.

**Ilegible** (se crea el hogar inicial con aviso), además de las condiciones de la 001: un miembro activo con `tipo` distinto de `persona` o `mascota`; una mascota con parentesco o género, o sin especie de la lista; una persona con especie, o con un parentesco o género que no es nulo ni de la lista; o un número de miembros activos vinculados a la cuenta propietaria distinto de uno. Cualquier `version` distinta de 1 o 2 sigue siendo ilegible. Los miembros eliminados no se validan (FR-10).

**Spec requirement:** FR-9
