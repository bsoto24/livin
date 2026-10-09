# ADR-007-aspecto-miembros-formato-v7: Aspecto de los familiares, mascotas sin actividades y documento guardado versión 7

**Status:** Accepted
**Date:** 2026-10-09
**Feature:** 007-menu-y-formularios-simples

## Context

El documento guardado `livin:datos:v1` está en `version: 6`. Los miembros (ADR-002 de modelo de miembros) son `persona` o `mascota`; una persona que no es el propietario guarda `parentesco` (6 valores) y `genero` (femenino, masculino, otro), ambos obligatorios en el alta (FR-2 de la 002), y una mascota guarda `especie` (perro, gato, otro). Revisando el código, `parentesco` solo se guarda y se valida: ninguna pantalla, dibujo ni regla lo lee. `genero` solo decide el color del personaje. Una actividad (ADR-003 de modelo de actividades) puede asignarse a cualquier miembro activo, mascotas incluidas, y desde la 006 una mascota también recibe crédito en el historial.

El PRD de esta feature pide, a partir del uso real del PoC en escritorio y en Android:

- Un alta de **familiar** reducida a nombre más un selector de icono de siete opciones que mezclan edad y género: adulto, adulta, niño, niña, anciano, anciana y neutro.
- Un alta de **mascota** reducida a nombre más un selector de especie con seis opciones: perro, gato, conejo, hámster, loro y otro.
- Que las **mascotas no puedan ser responsables de una actividad**, porque no pueden ejecutarla.
- Que los hogares ya guardados (`version` 1 a 6) se abran sin error. El juego **aún no está en producción**, así que se acepta perder datos que ya no tienen sentido, pero no se acepta un error al abrir.
- Que los datos sigan referenciándose por id y los registros mantengan su auditoría ([ADR-001 de modelo de datos](001-modelo-datos-local-first-multiusuario.md)); el [ADR-006 de historial](006-historial-calificaciones-formato-v6.md) fija que las entradas del historial no se tocan por bajas posteriores.
- El formato guardado es difícil de revertir y el código ya verificado en el teléfono (001 a 005) no debe tocarse más de lo necesario.

## Options Considered

### Option A: Un solo campo `aspecto` con siete valores cerrados; se elimina `parentesco`; mascotas fuera del reparto de actividades; documento `version: 7`

`aspecto` reemplaza a `genero` en las personas (el propietario lo deja vacío). Cada valor es un registro del catálogo con su icono, su color de marcador y su tamaño de dibujo. `parentesco` desaparece. La especie de una mascota se amplía con `conejo`, `hamster` y `loro`. `agregarActividad` y `editarActividad` rechazan una mascota como responsable. La migración v6→v7 convierte `genero` en `aspecto` y da de baja las actividades asignadas a mascotas.

**Pros:** el selector del formulario coincide uno a uno con el dato guardado; hay un campo menos y ninguno muerto; el catálogo es dato puro y se prueba sin interfaz; la migración es una función pura de miembros y actividades.
**Cons:** no se puede consultar por edad o por género por separado; el formato cambia (`genero` y `parentesco` salen) y los datos v7 no se leen con versiones anteriores.

### Option B: Dos campos, `etapa` (niño, adulto, anciano) y `genero` (femenino, masculino, neutro)

El selector del formulario sigue mostrando siete iconos, pero cada uno se descompone en dos datos al guardar.

**Pros:** es el modelo más "correcto" si una función futura necesitara filtrar por edad o por género por separado.
**Cons:** guarda dos datos que hoy nadie consulta; el neutro no tiene etapa y obliga a una regla especial (¿neutro adulto, niño, anciano?); la validación y la migración doblan sus casos; es más de lo que pide el PRD (YAGNI).

### Option C: Conservar `genero` y `parentesco` en el modelo y añadir `aspecto` solo para el dibujo

Los formularios nuevos llenan `aspecto`; `genero` y `parentesco` quedan en el documento como campos heredados.

**Pros:** ninguna migración de miembros; los datos antiguos quedan intactos.
**Cons:** deja dos datos que dicen lo mismo (`genero` y `aspecto`) y uno que nadie puede llenar (`parentesco`); el validador tiene que aceptar ambos mundos para siempre; contradice la intención de simplificar.

## Decision

**We chose Option A (campo único `aspecto`, `parentesco` eliminado, mascotas sin actividades, documento `version: 7`)** porque es la única que hace que el formulario simplificado del PRD guarde exactamente lo que muestra, sin datos muertos ni reglas especiales, y porque el juego aún no está en producción: no hay datos de valor que justifiquen el coste de la opción C. La opción B resuelve consultas que ninguna feature pide.

Reglas que fija la decisión:

- **Catálogo `ASPECTOS`** (dato en `catalogo.js`): `adulto` 👨, `adulta` 👩, `nino` 👦, `nina` 👧, `anciano` 👴, `anciana` 👵 y `neutro` 🧑. Cada uno lleva etiqueta, icono, color de marcador y tamaño de dibujo (los niños se dibujan más pequeños). Los valores nuevos no usan arte nuevo: siguen los rectángulos de color de la 002.
- **Personas:** una persona que no es el propietario tiene `aspecto` en `ASPECTOS`; el propietario tiene `aspecto: null` y solo se renombra, como hoy. `genero` y `parentesco` ya no existen en el documento v7.
- **Mascotas:** `especie` está en `ESPECIES` = `perro`, `gato`, `conejo`, `hamster`, `loro`, `otro`; `aspecto` es `null`. Las tres claves existentes no cambian, así que no hay migración de especies.
- **Valores por omisión del alta:** `neutro` para familiares y `otro` para mascotas, de modo que basta el nombre para guardar. Es una regla de presentación; `agregarHabitante` sigue exigiendo un valor de la lista.
- **Mascotas no son responsables:** `agregarActividad`, `editarActividad` y la creación en varios lugares rechazan un `miembroId` que no sea una persona activa, con un mensaje que explica el motivo. Los intercambios ya ocurren solo entre personas (005). Las entradas de historial con una mascota acreditada, que solo pueden venir de datos anteriores, se conservan y se pueden calificar como hasta ahora.
- **Migración v6→v7 (pura, con la hora inyectada):**
  - el propietario se identifica por su membresía (como hace hoy `miembrosValidos`), no por su `genero`, y queda con `aspecto: null`; cada otra persona pasa de `genero` a `aspecto`: `femenino` → `adulta`, `masculino` → `adulto`, `otro` → `neutro`, y con `genero` nulo → `neutro`, para que el v7 resultante siempre sea válido;
  - se quitan `genero` y `parentesco` de todos los miembros; las mascotas quedan con `aspecto: null`;
  - cada actividad **no eliminada** cuyo responsable sea una mascota se da de baja con borrado lógico (`eliminadoEn` y auditoría), la misma baja que ya usa la eliminación de un miembro; los intercambios que la involucraban dejan de ser vigentes por la regla de vigencia derivada de la 005; el historial **no se toca**;
  - se acepta `version` 1 a 7 y las migraciones se encadenan (v1→v2→…→v7); un documento antiguo se guarda como v7 en el siguiente guardado, no al abrirlo; las claves de almacenamiento no cambian.
- **Un documento v7 es ilegible** (se crea el hogar inicial con aviso, como hoy) si no cumple las condiciones de las versiones anteriores que siguen vigentes (hogar, actividades, bloques, regresos, intercambios, historial) o si: una persona activa no propietaria tiene un `aspecto` fuera de `ASPECTOS`; una mascota activa tiene una `especie` fuera de `ESPECIES` o un `aspecto` no nulo; el propietario tiene un `aspecto` no nulo; o una actividad no eliminada tiene como responsable a un miembro que no es una persona activa.

Alternativas descartadas dentro de la migración de actividades de mascotas:

- **Pasarlas al propietario:** conserva la actividad, pero reasigna una responsabilidad sin que nadie lo decida. Se descartó por indicación explícita de quien decide el producto: el juego no está en producción y la baja es más simple y predecible.
- **Conservarlas como están:** deja actividades "huérfanas" con un responsable que ya no puede serlo, y complica los intercambios y las calificaciones.

## Consequences

**Más fácil:**
- Los formularios de familiar y de mascota guardan exactamente lo que muestran; no hay campos que nadie llene.
- Una futura función de personajes (arte real, edad, cumpleaños) parte de un catálogo de aspectos ya definido y de ids estables; añadir `fechaNacimiento` o `etapa` más adelante es un campo nuevo, no una migración de los existentes.
- Las reglas de "quién puede ser responsable" quedan en un solo lugar de la capa de dominio.

**Más difícil:**
- Un hogar guardado con la 002 a la 006 pierde `parentesco` y las actividades de sus mascotas al guardarse como v7. Es deliberado y está aceptado porque el juego no está en producción.
- Los datos v7 no se pueden leer con una versión anterior. En la PoC (desechable, solo local) es aceptable.
- Las pruebas de la 002 que exigen `parentesco` y `genero`, y las que asignan actividades a mascotas, cambian por diseño; sus expectativas se reescriben en la fase de pruebas del plan, no se borran.
- El filtro del historial ya no ofrece mascotas que nunca tuvieron entradas: solo las que tienen alguna, para no mostrar opciones vacías.

**A revisar si este ADR es reemplazado:** si una pieza futura necesitara la edad o el género por separado, habría que pasar a la opción B partiendo `aspecto` en dos campos (la tabla `ASPECTOS` ya dice qué etapa y qué género corresponden a cada valor); si las mascotas llegaran a tener responsabilidades propias, habría que revisar la regla de responsables y la migración que da de baja sus actividades.
