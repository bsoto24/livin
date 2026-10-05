# ADR-001-modelo-datos-local-first-multiusuario: Modelo de datos local-first preparado para multiusuario

**Status:** Accepted
**Date:** 2026-10-04
**Feature:** 001-mapa-editor-hogar

## Context

Hoy la app la usa una sola persona, el propietario del hogar, que gestiona a todos los miembros como personajes en un único dispositivo y sin conexión. A futuro, cada miembro (por ejemplo, la pareja o un hijo) tendrá su propia cuenta y usará el videojuego en su propio dispositivo, con los datos del hogar compartidos entre todos.

Requisitos que condicionan la decisión:

- La v1 funciona solo en local, sin inicio de sesión ni servidor.
- Pasar luego a multiusuario no debe obligar a reescribir los datos existentes.
- Los espacios y los miembros deben poder renombrarse, y su identidad debe sobrevivir a cambios de nombre y de posición, porque futuras actividades apuntarán a un miembro (obligatorio) y a un espacio (opcional).
- Los miembros pueden existir sin cuenta: hoy ninguno la tiene, y las mascotas nunca la tendrán.
- El stack oficial y el motor de almacenamiento no están decididos (la PoC se hace en Phaser 3).

## Options Considered

### Option A: Modelo local simple

Identificadores numéricos autoincrementales, los miembros solo como personajes y sin registro de quién ni cuándo se hizo cada cambio.

**Pros:** el más rápido de implementar hoy.
**Cons:** los identificadores numéricos chocan entre dispositivos; sin autoría ni fechas no hay base para sincronizar; pasar a multiusuario implica migrar todos los datos y redefinir qué es un miembro.

### Option B: Modelo local-first preparado para multiusuario

Todo se guarda en el dispositivo, pero con identificadores globales (UUID), separación entre miembro del hogar y cuenta de usuario, registro de membresía con rol, fechas y autoría en cada registro, y borrado lógico.

**Pros:** costo apenas mayor que la Option A; la sincronización futura se agrega encima sin migrar datos; un miembro puede vincular su cuenta más tarde sin cambiar nada más; soporta miembros sin cuenta (incluidas las mascotas).
**Cons:** algunos campos (autoría, borrado lógico, membresía) no tienen uso visible en la v1; obliga a filtrar los registros marcados como eliminados en todas las consultas.

### Option C: Backend y cuentas desde el inicio

Inicio de sesión, servidor y sincronización desde la v1.

**Pros:** el multiusuario queda resuelto de entrada.
**Cons:** costo alto (autenticación, servidor, resolución de conflictos, conectividad) para una v1 que tiene un solo usuario; retrasa la PoC, cuyo objetivo es validar el mapa y elegir stack; atarse hoy a un proveedor de backend antes de decidir el stack.

## Decision

**We chose Option B (local-first preparado para multiusuario)** because cumple el requisito de funcionar en local sin servidor en la v1 y, con un costo casi igual al de la Option A, evita la migración de datos que la Option A haría inevitable cuando los miembros pasen a tener cuentas. La Option C resuelve un problema que la v1 no tiene y retrasa el objetivo inmediato de la PoC.

## Consequences

**Registros que se guardan:**

| Registro | Contenido |
|---|---|
| Cuenta | Identidad de una persona. En la v1 existe solo la del propietario, creada localmente sin inicio de sesión. |
| Hogar | Nombre del hogar. |
| Membresía | Qué cuenta pertenece a qué hogar y con qué rol (propietario o miembro). En la v1 solo existe la del propietario. |
| Espacio | UUID, hogar, tipo (clave del catálogo), posición dentro de su tipo, nombre personalizado opcional y "contenido en": UUID del dormitorio u oficina que contiene al espacio (solo para baños internos; vacío en los demás). |
| Miembro | UUID, hogar, nombre, vínculo opcional a una cuenta. |
| Posición del personaje | Espacio (UUID), casilla relativa a la esquina del espacio y dirección. Estado exclusivo del dispositivo: no se sincronizará. |

Todos los registros sincronizables (cuenta, hogar, membresía, espacio y miembro) llevan fecha de creación, fecha de modificación, cuenta que creó, cuenta que modificó y fecha de eliminación. El borrado es lógico: se completa la fecha de eliminación en lugar de destruir el registro.

**Datos que no se guardan, sino que se calculan:** la cuadrícula del mapa, las colisiones, las puertas y pasillos y los nombres automáticos de los espacios ("Dormitorio 2"). Qué cuarto contiene cada baño interno sí se guarda, porque depende del historial de eliminaciones y no puede deducirse del orden de los espacios.

**Sin efectos secundarios:** ninguna operación sobre un espacio o un miembro modifica otro espacio, salvo la excepción del baño interno definida en el PRD (se mueve a otro cuarto libre o, si no hay ninguno, se elimina con su cuarto). Eliminar un miembro nunca afecta a los espacios. Ver [ADR-001-generador-distribucion-piezas-reglas](001-generador-distribucion-piezas-reglas.md).

**El nombre del miembro pertenece al hogar, no a la cuenta.** Al vincular una cuenta a un miembro, el miembro conserva el nombre que tiene en el hogar, independientemente del nombre de perfil de la cuenta.

**Más fácil:**
- Agregar sincronización entre dispositivos sin migrar datos.
- Que un miembro vincule su cuenta y vea lo que ya se le había asignado.
- Que futuras actividades referencien miembros y espacios de forma estable aunque cambien de nombre o posición.

**Más difícil:**
- Toda consulta debe excluir los registros con fecha de eliminación.
- Los nombres únicos deben validarse solo contra registros no eliminados.

**Asuntos pendientes para la pieza de multiusuario (no se resuelven en esta feature):**
- Mecanismo de sincronización y resolución de conflictos (por ejemplo, dos personas renombrando el mismo espacio a la vez). El modelo ya registra fecha y autor de cada cambio, que es el insumo necesario.
- Permisos por rol: qué puede hacer un miembro frente al propietario.

**Fuera de esta decisión:** el motor de almacenamiento concreto. La PoC usa el almacenamiento del navegador; el motor definitivo se decide junto con el stack oficial.
