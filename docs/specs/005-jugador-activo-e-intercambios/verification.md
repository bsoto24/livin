# Verificación de integración: Jugador activo e intercambios

**Feature:** 005-jugador-activo-e-intercambios
**Fase del plan:** Phase 7: Integration Verification
**Fecha:** 2026-10-08
**Código verificado:** rama `feat/005-jugador-activo-e-intercambios` en `f2f8e49` (carpeta `poc/`); el código de `poc/` es el de `d00cfab`, los dos commits posteriores solo tocan la memoria del proyecto
**Estado:** verificación automática, en navegador de escritorio y en el teléfono Android **completa** (sección "Verificado en el Android").

## Resultado automático

| Dato | Valor |
|---|---|
| `npm test` | 258 pruebas, 258 pasan, 0 fallan (207 de las features anteriores + 51 nuevas) |
| Mutaciones del plan | 25 de 25 detectadas durante la validación del plan; la mutación de la corrección A1 (`tocar` sin hacer crecer la marca) la detectan las tres pruebas de contrato con reloj congelado |
| Revisión de alineación con la spec (`sdd-review`, modo B) | ronda 1: DRIFT DETECTED (menor); ronda 2: **SPEC-ALIGNED** |
| Criterios de aceptación | 105: ninguno fallido ni faltante; los de interfaz se verifican por lectura del código, en el navegador de escritorio y en el teléfono |

### Hallazgos de la revisión y su resolución

| Hallazgo | Resolución |
|---|---|
| A1 (NFR Reliability): la vigencia no se rompía con editar ni con "Hecho" en una repetitiva si el reloj no avanzaba entre dos operaciones, y no había prueba de contrato por operación | Corregido: `tocar` (`poc/src/hogar.js`) hace crecer la marca con un sufijo `+` cuando el reloj no avanzó. Pruebas de contrato con reloj congelado para editar, eliminar, "Hecho" (puntual y repetitiva), aceptar, baja de espacio y baja de miembro, y para que restaurar el valor anterior no reviva la propuesta (AC-9.7). ADR de intercambios enmendado |
| B3 (AC-6.7): el mensaje del límite llevaba un punto final que la spec no tiene | Corregido, con prueba que fija el texto |
| A2: sin aserciones propias para AC-7.9 y AC-9.9; prueba débil de AC-9.6 | Pruebas agregadas y AC-9.6 reforzado |
| B1: al cambiar de jugador, los sprites de quienes caminan se recrean en su destino y podrían saltar hasta una casilla | Revisado en el teléfono: sin observaciones (ver abajo) |
| B2: el nuevo jugador casi siempre mira hacia abajo | Aceptado: la spec lo permite |
| E4: el validador exige marcas de texto no vacío, la spec dice "texto" | Aceptado: sin impacto funcional |
| A3: la escritura de `jugadorId` en `livin:posicion:v1` no tiene prueba automática | Aceptado: es capa de presentación; verificado al reabrir la app en el teléfono |

## Verificado en el navegador de escritorio (ventana de 375×812)

Durante la validación del plan, sobre una copia del código con `window.__juego` expuesto para depurar:

- El botón "Juega: <nombre>" aparece bajo "Editar"; la lista "¿Quién juega?" muestra al propietario ("Jugando") y a los familiares.
- Un familiar fuera de casa aparece en la entrada al elegirlo.
- Proponer, cambiar de jugador y aceptar un intercambio; las notas "por intercambio (vuelve a …)" y las fichas en modo edición.
- Eliminar a quien juega pasa el juego al propietario.

## Verificado en el Android

**Fecha:** 2026-10-08
**Origen de las pruebas:** servidor estático de la carpeta `poc/` por la red local (`http://<IP-del-computador>:8080`, HTTP sin cifrar), con la cabecera `Cache-Control: no-cache`, abierto desde el teléfono. El servidor se apagó al terminar.

La verificación manual en un dispositivo Android real **no encontró fallos** en ningún punto de la lista.

| Dato | Valor |
|---|---|
| Fotogramas por segundo (indicador en pantalla) | 73 fps |
| `regen` (indicador en pantalla) | 10,9 ms |
| Puntos de la lista que fallaron | ninguno |
| Dispositivo | no se indicó (las verificaciones anteriores fueron en un Samsung Galaxy S23 Ultra con Android 16) |

Metas de la spec: 60 fps o más y cambio de jugador y acciones del panel por debajo de 100 ms. Con los valores reportados se cumplen ambas.

Quien probó recorrió la lista del teléfono y reportó que todo estaba conforme. La lista cubría:

- Posición de los botones "Juega" e "Intercambios" respecto de la cruceta y del cartel.
- Cambio de jugador con personajes caminando (B1), sin saltos ni superposiciones.
- Flujo completo de un intercambio: proponer, cambiar de jugador, aceptar, notas, burbujas y "Hecho" en la repetitiva.
- Familiar fuera de casa elegido como jugador (aparece en la entrada).
- Continuidad al cerrar y reabrir la app (quién juega y su posición).
- Rendimiento con 8 familiares, 4 mascotas, el propietario caminando solo y 50 actividades, y `regen` al cambiar de jugador.

### Lo que este registro no incluye

- No se anotó el modelo del teléfono.
- El reporte es global ("todo conforme"): no se registró punto por punto qué se hizo en cada casilla ni el peor `regen` de varios cambios seguidos, solo el valor del indicador (10,9 ms). No se anotaron observaciones de sensación de uso.
- No se registró si se probó el caso de 20 propuestas vigentes en el teléfono (el mensaje y el límite están cubiertos por pruebas automáticas).
- Las pruebas fueron en un solo teléfono.

### Asuntos abiertos

- **Rulings aceptados** (sin acción): B2 (dirección inicial del nuevo jugador), E4 (validador de marcas) y A3 (`jugadorId` sin prueba automática).
- La **feature 006** (calificaciones con estrellas e historial de actividades hechas) es un brainstorm aparte, aún no iniciado.
