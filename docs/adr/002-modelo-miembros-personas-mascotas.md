# ADR-002-modelo-miembros-personas-mascotas: Modelo de familiares y mascotas como miembros del hogar

**Status:** Accepted
**Date:** 2026-10-05
**Feature:** 002-familiares-y-mascotas

## Context

La feature 001 dejó un modelo de `Miembro` (UUID, hogar, nombre, vínculo opcional a una cuenta, auditoría y borrado lógico) y un documento guardado `livin:datos:v1` con `version: 1`. El [ADR-001 de modelo de datos](001-modelo-datos-local-first-multiusuario.md) ya establece que un miembro puede existir sin cuenta, "incluidas las mascotas", y que las futuras actividades apuntarán a un miembro (obligatorio) y a un espacio (opcional).

Esta feature agrega dos clases de habitantes con datos distintos:

- **Familiares** (hasta 8, además del propietario): nombre, parentesco con el propietario (Pareja, Hijo/a, Padre o madre, Hermano/a, Abuelo/a, Otro familiar) y género (Femenino, Masculino, Otro).
- **Mascotas** (hasta 4): nombre y especie (Perro, Gato, Otro). Sin parentesco ni género.

Restricciones que condicionan la decisión:

- Ya hay hogares guardados en dispositivos con `version: 1`; abrirlos no debe perder datos ni mostrar un error.
- El validador actual declara ilegible todo documento con `version ≠ 1`, y en ese caso crea un hogar inicial con aviso: dejar el validador como está borraría el hogar de quien actualice.
- Las reglas de nombre (único sin distinguir mayúsculas, hasta 20 caracteres, sin espacios en los extremos), el borrado lógico y la auditoría ya existen para `Miembro`.
- La posición de los habitantes no se guarda (decisión del PRD), así que el formato guardado solo gana datos de identidad y apariencia.
- El formato guardado es difícil de revertir: una vez que hay datos v2 en los dispositivos, volver atrás exige otra migración.

## Options Considered

### Option A: `Miembro` ampliado, documento `version: 2` con migración desde v1

Cada `Miembro` gana `tipo` (`persona` o `mascota`), `parentesco`, `genero` y `especie`, nulos según el tipo. El documento pasa a `version: 2`. Una función pura migra un documento v1 completo a v2, y el almacén la aplica al cargar.

**Pros:** reutiliza sin cambios las reglas de nombres, el borrado lógico y la auditoría; coincide con el ADR-001, donde las mascotas son miembros sin cuenta; las futuras actividades siguen apuntando a una única colección `miembros`; la migración es pequeña, pura y se prueba con datos v1 reales.
**Cons:** cada consumidor de `miembros` debe distinguir `tipo`; hay que actualizar el validador de `version`; el formato guardado queda ligado a una versión nueva.

### Option B: Colección `mascotas` aparte, `miembros` solo para personas

**Pros:** no toca el formato de `miembros`; el tipo de cada colección es evidente.
**Cons:** contradice el ADR-001, que trata a las mascotas como miembros sin cuenta; duplica las reglas de nombre único (que deben ser únicas entre ambas colecciones), el borrado lógico y la auditoría; una futura actividad que apunte a un miembro no podría apuntar a una mascota; sigue exigiendo cambiar el documento (nueva lista) y por tanto una versión nueva.

### Option C: Entidad `Habitante` que reemplaza a `Miembro`

**Pros:** un único registro con todos los campos y sin campos nulos por tipo.
**Cons:** rompe la identidad estable de `Miembro` y todas las referencias que el ADR-001 quiere preservar; la migración es grande y de riesgo alto; no aporta nada visible al usuario.

## Decision

**We chose Option A (`Miembro` ampliado, documento `version: 2` con migración)** porque es la única opción que mantiene a las mascotas como miembros sin cuenta, tal como fija el ADR-001, reutiliza las reglas ya probadas de nombres y borrado, y preserva los hogares guardados con una migración acotada y verificable. Las otras opciones duplican reglas (B) o ponen en riesgo identidades estables (C) sin beneficio para el usuario.

Reglas que fija la decisión:

- `tipo` es obligatorio. En una persona, `especie` es nulo; en una mascota, `parentesco` y `genero` son nulos.
- El personaje del propietario es el miembro vinculado a la cuenta del propietario: es de `tipo: persona`, con `parentesco` nulo, no puede eliminarse y su `genero` puede ser nulo (conserva su aspecto actual).
- El nombre es único entre todos los miembros activos, personas y mascotas a la vez.
- Los límites (8 familiares, 4 mascotas, sin contar al propietario) se aplican al crear, no al cargar.
- La migración v1→v2 marca todo miembro existente como `persona`, con `parentesco`, `genero` y `especie` nulos, y no cambia ningún otro dato. Un documento v1 se acepta al cargar y se guarda como v2 en el siguiente guardado.
- Se acepta `version` 1 o 2; cualquier otra se sigue tratando como ilegible. Las claves de almacenamiento **no cambian**: el documento sigue en `livin:datos:v1` (la versión del formato vive en su campo `version`) y la posición del personaje en `livin:posicion:v1`.
- Un documento v2 se considera **ilegible** (se crea el hogar inicial con aviso, como hoy) si no cumple las condiciones ya vigentes de la feature 001 o si algún miembro: no tiene `tipo` válido; es una persona con `especie`, o una mascota con `parentesco` o `genero`; tiene un `parentesco`, un `genero` o una `especie` fuera de las listas cerradas; o si no hay exactamente un miembro vinculado a la cuenta del propietario. Un documento v1 solo se valida con las reglas de la 001 y se migra antes de usarse.
- La ficha del propietario solo permite renombrar, como en la feature 001: no muestra parentesco ni género ni Eliminar.

## Consequences

**Más fácil:**
- Actividades futuras que apunten a "un miembro" pueden apuntar a una persona o a una mascota con una sola referencia estable.
- Vincular una cuenta a un familiar más adelante sigue siendo cambiar `cuentaId`, sin migrar nada más.
- Añadir otra clase de habitante en el futuro es un `tipo` nuevo y una versión nueva con su migración.

**Más difícil:**
- Todo código que lea `miembros` debe filtrar por `tipo` según lo que necesite (por ejemplo, contar familiares y mascotas por separado).
- Los datos v2 no se pueden leer con una versión anterior de la app. En la PoC (desechable, solo local) esto es aceptable; para el producto real, la migración y el validador pasarán al stack oficial.
- Hay que probar la migración con documentos v1 reales y con documentos corruptos.

**A revisar si este ADR es reemplazado:** si la sincronización multiusuario exigiera resolver conflictos entre dispositivos con versiones de formato distintas, habría que definir una política de compatibilidad entre versiones; el campo `version` y la función de migración son el insumo para ello.
