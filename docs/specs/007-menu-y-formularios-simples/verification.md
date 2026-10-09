# Verificación: 007 menú por secciones y formularios simples

**Fecha:** 2026-10-09
**Rama:** `feat/007-menu-y-formularios-simples`
**Sección del plan:** Phase 7: Integration Verification

## Pruebas automáticas

- `cd poc && npm test` → 341 pruebas, 341 pasan, 0 fallan, 0 canceladas, 0 omitidas.
- `cd poc && node --check src/juego.js` → sin salida (sintaxis válida).

El plan decía 340 pruebas; el total real es 341 (el conteo del plan tenía un error de uno).

## Navegador de escritorio

Panel del navegador integrado (Chromium), servido con un servidor estático temporal en el puerto 8099 (apagado al terminar; no queda nada escuchando). Se empezó con `localStorage` vacío. El panel mide 333 × 399 px, así que los controles de ancho de escritorio se hicieron con el viewport emulado de 1000 × 800 y los de teléfono con el emulado de 375 × 812.

Cómo se actuó (para saber qué es evidencia de toque real y qué no):

- **Toques reales con el ratón (eventos de puntero sobre el lienzo y los botones):** pestañas de la barra, "Listo", tocar cuartos, personajes y burbujas en el mapa (secciones Espacios, Familia, Actividades e Intercambios), "Hecho", una estrella, "Aceptar" y escribir en los campos de nombre.
- **Clics de DOM con `element.click()` (no son toques reales):** el resto de los botones de los formularios y drawers (guardar, elegir un icono del selector, chips, círculos, "Cambiar", "+", "Rechazar", etc.), y las asignaciones de valor con el evento `input` en los campos para armar cargas grandes. Cubren la lógica de la interfaz, no el área táctil.
- **Teclas:** la tecla Espacio y el texto "Lavar platos" se escribieron con teclado real (eventos de confianza) en cinco campos. Las flechas reales dentro de un campo de texto movieron el cursor. Las flechas reales de la exploración no mueven al personaje con esta herramienta (el `keydown` y el `keyup` llegan con 1 ms de diferencia y el juego lee el estado de la tecla por cuadro), así que para mover al personaje se enviaron eventos `keydown`/`keyup` sintéticos con la tecla mantenida entre 0,5 y 3 s.

| Paso | AC | Resultado | Evidencia |
|---|---|---|---|
| 1. Barra en exploración | AC-1.1, AC-1.2, AC-1.9, AC-12.1 | PASS | Cuatro pestañas (Espacios, Familia, Actividades, Intercambios) en una barra de 56 px abajo; los únicos botones visibles son la cruceta, las cuatro pestañas y "Juega: Personaje 1" arriba a la derecha (sin "Editar", "Intercambios" ni "Historial" sueltos). Cruceta con su borde inferior en y=720 y la barra desde y=744 (1000 × 800); en 375 × 812 la captura muestra la cruceta sobre la barra sin tapar el cartel. |
| 2. Drawer y modo edición | AC-1.3 a AC-1.7, AC-3.1 | PASS | "Espacios": drawer de 360 px sobre 800 (45 %), pestaña con `aria-pressed=true`, cruceta oculta y el hogar completo visible por encima del drawer (captura). Cambiar a Familia, Actividades e Intercambios con toques: el encuadre del mapa no cambió entre capturas. Tocar la pestaña activa (Intercambios) volvió a exploración: drawer oculto, cruceta visible. "Listo" también: la cámara volvió a seguir al personaje (captura con zoom centrado en él) y las flechas lo movieron. Personajes quietos: dos capturas con 4 s de diferencia en la sección Familia salieron idénticas. |
| 3. Mapa por sección | AC-2.1 a AC-2.6 | PASS | Espacios: tocar el personaje que está sobre la Sala abrió la ficha "Sala 1" (también "Cocina 1" al tocar el cuarto). Familia: tocar al propietario abrió su ficha y tocar la Cocina no abrió nada. Actividades: tocar una burbuja abrió la hoja "Cocina 1" con "Editar" y "Eliminar" por fila. Intercambios: tocar el personaje y un cuarto no abrió ninguna ficha ni hoja. |
| 4. Tecla Espacio | AC-14.1 a AC-14.3 | PASS | Con teclado real, "Lavar platos" quedó completo con el espacio en la ficha del cuarto (Cocina 1), del propietario, de una mascota (Pet3), de un familiar nuevo y de la actividad. Con foco en un campo, tres `ArrowLeft` reales movieron el cursor de la posición 12 a la 9. Las flechas movieron al personaje en exploración con eventos sintéticos mantenidos (la posición guardada cambió de (7,5) a (5,5), etc.). Las flechas reales instantáneas de esta herramienta no mueven al personaje: limitación de la herramienta, no se pudo comprobar una pulsación real mantenida. |
| 5. Familiar | AC-5.1 a AC-5.9, AC-4.1 a AC-4.6 | PASS | "Nuevo familiar" con 🧑 a la izquierda del nombre (x=356 contra x=408) y "Guardar" desactivado; con "Ana María" se activó. El selector "Aspecto" ofrece siete: 👨 Adulto, 👩 Adulta, 👦 Niño, 👧 Niña, 👴 Anciano, 👵 Anciana, 🧑 Neutro. Elegir 👧 y guardar: la fila muestra 👧 y el documento guarda `aspecto: "nina"`; el catálogo da escala 0,75 y color naranja a las niñas. Un familiar solo con nombre queda 🧑 (`neutro`). Con 8 el "+" se desactiva ("8 de 8"). |
| 6. Mascota | AC-6.1 a AC-6.7 | PASS | "Nueva mascota" con 🐾; el selector "Especie" ofrece seis: Perro, Gato, Conejo, Hámster, Loro, Otro. Con el tope de 4 no caben las seis a la vez: se crearon perro, gato, conejo y hámster, se eliminaron dos y se crearon un loro y una sin elegir especie (queda 🐾 `otro`). Los seis colores del catálogo son distintos (#9c6b3c, #7d7d7d, #d9b8c4, #e0b85c, #1f9bb0, #4f9d69). Con 4 el "+" se desactiva. Solo se comprobó que los colores difieren en el catálogo y se vieron tres en una captura; no se comparó el seis a ojo en el mapa. |
| 7. Actividad simple | AC-8.1 a AC-8.14, AC-9.1 a AC-9.9 | PASS | El formulario nuevo muestra solo el icono 📌, el nombre, las 6 sugerencias, los círculos (propietario y familiares, sin mascotas, con "Personaje 1" marcado) y "📅 Hoy · Una vez · Sin lugar" con "Cambiar"; "Guardar" desactivado. Con "ba" (teclado real) quedan Barrer, Limpiar el baño y Sacar la basura. "Barrer" fija 🧹 y el icono queda `aria-disabled`; tocarlo no abre el selector. Con "Podar" vuelve 📌 y el selector tiene 9 opciones (Platos, Barrer, Ropa, Basura, Limpiar, Compras, Plantas, Mascota, Otra); elegir 🪴 se mantiene al seguir escribiendo ("Podar r", "Podar rosas"); "Barrer" completo vuelve a 🧹 y lo fija; "Barre" devuelve 📌. Guardar solo "Barrer": una actividad con vencimiento de hoy, sin lugar y de quien juega (documento en versión 7). |
| 8. Varios lugares | AC-10.1 a AC-10.11 | PASS | "Cambiar" despliega fecha (hoy), recurrencia (Una vez ... Cada 30 días) y cinco lugares. Con Dormitorio 1, Dormitorio 2, Sala 1 y "Cada 7 días" el resumen dijo "📅 Hoy · Cada 7 días · 3 lugares"; al guardar se crearon tres "Barrer" (uno por lugar) de la misma persona. Al editar el de la Sala solo cambió ese (pasó a Cocina) y los chips son de selección única. Con 49 pendientes y 2 lugares: "Con estos lugares se superarían las 50 actividades pendientes." y no se creó ninguna (49 antes y después); con 1 lugar llegó a 50 y el "+ Actividad" quedó desactivado. En el plan los lugares se llaman "Sala"; la app los muestra "Sala 1". |
| 9. Hechas | AC-7.1 a AC-7.9, AC-12.3 | PASS | Tres "Hecho" desde las hojas del mapa (los tres con toque real) generaron tres filas en "Hechas", la última primero, con filtro "Todos". En "Pendientes" no hay botón "Hecho" (el único botón es "+ Actividad"). Como propietario no se puede calificar la fila propia; al cambiar a Ana María desde "Juega:" con el drawer abierto se mantuvo la pestaña Actividades > Hechas y las estrellas pasaron a ser las de ella; un toque en la cuarta estrella la dejó en 4 (resumen "Personaje 1: 4,0 ★ (1 calificadas)", "Tu calificación", "Quitar"). Cambiar a Pendientes y volver a Hechas devolvió el filtro a "Todos". |
| 10. Intercambios | AC-13.1 a AC-13.5, AC-1.8 | PASS | Se propuso "Barrer" por "Trapear" desde el drawer; al cambiar a la persona destinataria su pestaña dijo "Intercambios (1)" y la fila "Personaje 1 te ofrece «Barrer» por «Trapear»"; "Aceptar" (toque real) los intercambió (estado `aceptado`, la actividad pasó a la otra persona) y volvió a "Intercambios". Una segunda propuesta se rechazó con "Rechazar" (estado `rechazado`). Una repetitiva que volverá a su responsable se rechaza con el mensaje de la 005. |
| 11. Mascotas sin actividades | AC-11.1, AC-11.4 | PASS | Los círculos del formulario son P, A y F (personas); no hay mascotas en el selector de responsable, en el filtro del historial ni en el selector de intercambios. Con el hogar migrado, una actividad "Paseo" de una mascota no aparece (ver migración). |
| 12. Texto como texto | AC-4.6, AC-8.16, AC-12.6 | PASS | Familiar `<b>x</b>` y actividad `<i>y</i>`: se ven como texto en la fila de Familia, la fila de Pendientes, el círculo (inicial "<"), la hoja del mapa (título `<b>x</b>`, fila `<i>y</i>`), la lista de "¿Quién juega?", el filtro del historial, el indicador "Juega: <b>x</b>" y la etiqueta del mapa. Cero elementos `b` o `i` creados en la página. |

### Diseño en 375 × 812

- Formulario de actividad con "Cambiar" desplegado: 716 px de alto dentro de un viewport de 812 (cabe), sin desplazamiento horizontal; los cinco lugares y los diez círculos se ajustan en dos líneas (`flex-wrap`); la ficha tiene `overflow-y: auto` y `max-height: 90vh` para recorrerse en pantallas más bajas.
- Con la barra y el drawer abiertos, el hogar completo sigue visible encima y la cruceta solo está en exploración (por encima de la barra).

### Migración desde un hogar v6

Se armó un hogar real (propietario, un familiar "Ana" con 👩, una mascota perro "Firu", dos actividades y una entrada de historial) y se ejecutó el fragmento del plan sin cambios. La única adaptación fue de preparación: se usó un hogar nuevo con una mascota de especie válida para la v6 (perro, gato u otro) y no el de las pruebas anteriores, que tenía conejo, hámster y loro (especies que solo existen desde la v7 y que un documento v6 real no puede tener). El fragmento marca `version: 6`, agrega `genero: "femenino"` y `parentesco: "pareja"` al familiar, `genero: null` y `parentesco: null` al resto, borra `aspecto` y agrega la actividad "Paseo" de la mascota. Resultado (AC-15.1 a AC-15.8):

- Se abrió sin aviso (`#aviso` vacío y oculto), con el hogar completo.
- El familiar quedó 👩 (aspecto `adulta`); la mascota 🐶.
- "Paseo" no aparece en Pendientes (solo "Regar") ni en burbujas; el historial sigue con la misma entrada ("Barrer").
- `JSON.parse(localStorage['livin:datos:v1']).version` seguía en `6` tras abrir; tras agregar un familiar pasó a `7`, los miembros ya no tienen `genero` ni `parentesco`, y "Paseo" quedó dada de baja (`eliminadoEn` con valor).

### Rendimiento y límites con carga

Documento armado desde la consola con `version: 7`: 8 familiares + el propietario, 4 mascotas, 50 actividades pendientes y 200 entradas de historial (146.791 caracteres). Se abrió sin aviso y con todos los datos.

| Medida | Resultado |
|---|---|
| Cuadros por segundo en exploración con el personaje caminando 3,5 s | 120 fps por `requestAnimationFrame` y 118 a 121 fps en el indicador `#depuracion` (la pantalla es de 120 Hz; pestaña visible y en primer plano) |
| Abrir y cambiar entre los cuatro drawers, abrir "Hechas" (23 filas con el filtro), filtrar y volver a "Pendientes" | 16 a 18 ms cada uno (el mínimo medible: dos cuadros a 120 Hz) |
| Abrir la ficha de un familiar, abrir y elegir en el selector de aspecto | 16 a 17 ms |
| Abrir el formulario de actividad, abrir y elegir en el selector de iconos, desplegar "Cambiar" | 16 a 17 ms |
| Guardar un familiar | 16,4 ms; `regen` 7,7 ms |
| Guardar una actividad en 3 lugares (50 de 50) | 17,4 ms; `regen` 3,9 ms |
| Agregar un dormitorio | 16,1 ms; `regen` 8,7 ms |

`regen` máximo observado: 8,7 ms (límite 100 ms). Los 50 pendientes y los 200 de historial se mostraron sin degradar los cuadros por segundo.

## Defectos encontrados

Ninguno en el producto. Un solo error de consola, `Cannot read properties of null (reading 'desplegada')` en `poc/src/juego.js:1071`, apareció porque el script de la prueba hizo clic en el botón "Cambiar" mientras el formulario de actividad no estaba abierto (el "+ Actividad" estaba desactivado por tener 50 pendientes). Ese botón está dentro de un modal oculto, así que un usuario no puede llegar a ese estado; se anota solo como observación.

## Límites y observaciones aceptados

- El formulario de actividad está centrado en la pantalla, así que el campo de nombre se desplaza verticalmente cuando las sugerencias filtradas cambian el alto de la ficha; es cómodo con un dedo, pero con el ratón hay que volver a ubicar el campo (una vez en la verificación un clic cayó fuera por esto).
- Con 4 mascotas no se pueden tener a la vez las seis especies; el plan pedía "una de cada una" y se resolvió eliminando dos y creando las otras dos.
- El círculo de un familiar muestra la inicial del nombre; con `<b>x</b>` es "<" (se ve como texto, como pide AC-12.6).
- Las pruebas de teclas del paso 4 usaron un Chromium integrado; las flechas reales mantenidas y los toques reales con el dedo no se pudieron enviar con esta herramienta.
- Los toques con el ratón sobre el lienzo y los botones son eventos de puntero, no un dedo: el tamaño del área táctil y los gestos reales quedan para el teléfono.
- No se midieron los 60 cuadros por segundo del teléfono; en este equipo el navegador va a 120 Hz.

## Pendiente: verificación en el teléfono Android

Esto lo debe hacer el usuario en el teléfono Android de referencia (servir `poc/` en la red local solo mientras dura la prueba y con `Cache-Control: no-cache`, y apagar el servidor después). No se ha hecho y esta verificación no afirma que pase.

- [ ] Paso 1: barra con las cuatro pestañas, sin botones "Editar", "Intercambios" ni "Historial", cruceta por encima de la barra y "Juega: …" arriba a la derecha.
- [ ] Paso 2: el drawer ocupa el 45 % inferior, el mapa se aleja y los personajes quedan quietos; cambiar de pestaña no reencuadra; la pestaña activa y "Listo" vuelven a exploración con la cámara siguiendo al personaje.
- [ ] Paso 5: formulario de familiar con el botón 🧑, el selector de siete aspectos, 👧 dibujada más pequeña y con color femenino, y el "+" desactivado con 8.
- [ ] Paso 6: formulario de mascota con 🐾, seis especies y los seis colores distinguibles en el mapa, "+" desactivado con 4.
- [ ] Paso 7: formulario de actividad simple (sugerencias, icono fijo o elegible, responsable, "Cambiar") y que la ficha cabe y se recorre con el dedo.
- [ ] Paso 8: varios lugares con "Cambiar", chips que se ajustan a varias líneas y el mensaje con 49 pendientes y 2 lugares.
- [ ] Con 8 familiares, 4 mascotas, 50 actividades y 200 entradas: el movimiento se mantiene a 60 cuadros por segundo; abrir un drawer, cambiar de pestaña y guardar muestran el resultado en menos de 100 ms.
- [ ] La barra y el drawer no tapan la cruceta ni el cartel del cuarto, y los toques del dedo sobre las pestañas, las burbujas y los círculos de personas aciertan sin tocar el elemento de al lado.
- [ ] En el teclado del teléfono: escribir "Lavar platos" con espacio en los campos de nombre (cuarto, propietario, familiar, mascota, actividad).
