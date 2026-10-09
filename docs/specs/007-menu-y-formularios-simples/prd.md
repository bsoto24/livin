# PRD: Menú por secciones y formularios simples

**Date:** 2026-10-09
**Feature:** 007-menu-y-formularios-simples

## Problem

El PoC de Livin ya tiene todas las piezas del plan original (mapa, familiares y mascotas, actividades, rutinas, intercambios, historial), pero al usarlo en el teléfono y en el navegador de escritorio aparecen tres problemas de uso y un error:

1. **Un menú único, grande y denso.** Hoy hay cuatro botones sueltos a la derecha (Editar, Juega, Intercambios, Historial) y "Editar" abre un panel que mezcla los espacios, los habitantes y todas las actividades. Quien quiere cambiar solo una cosa tiene que recorrer todo.
2. **Los formularios piden demasiado.** Agregar un familiar exige nombre, parentesco y género; agregar una actividad exige nombre, icono, miembro, espacio, tipo, fecha y frecuencia. El parentesco, además, no se usa en ninguna parte.
3. **Las mascotas pueden recibir actividades**, aunque no pueden ejecutarlas.
4. **Un error en escritorio:** los campos de nombre (espacios, familiares, mascotas, actividades) no aceptan la tecla Espacio en el navegador de escritorio; en Android sí. La causa es que Phaser captura esa tecla en toda la ventana para el movimiento y cancela el carácter en los campos de texto.

Esta feature reorganiza la navegación en secciones y simplifica los formularios, sin cambiar lo que el juego hace.

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten **un solo teléfono**, sin cuentas ni conexión, igual que en las features 001 a 006. Las observaciones salen del uso real del PoC en un teléfono Android y en un navegador de escritorio.

**Usuarios futuros:** cada persona con su propio dispositivo y su cuenta. Esta feature no implementa nada de eso.

**Lugar en el proyecto.** Es la primera feature después de completar el plan original (001 a 006). Es una mejora de usabilidad y de modelo sobre piezas ya verificadas.

**Sistemas existentes que toca:**
- El **modo edición y su panel único** (001): se reemplazan por una barra inferior y un drawer por sección.
- Las **fichas de familiar y de mascota** (002) y la **ficha de actividad** (003): se rehacen más simples.
- Los **botones Juega, Intercambios e Historial** (005, 006): Juega pasa a un indicador de estado; Intercambios pasa a la barra; el Historial pasa a ser una pestaña dentro de Actividades.
- El **modelo de miembros y de actividades** y el documento guardado: cambian de forma y el formato guardado sube a `version: 7`.
- La **capa de presentación** (Phaser): se corrige la captura global de la tecla Espacio.

**Relación con las specs anteriores.** Esta feature reemplaza: el panel único de edición (001); el parentesco y el género obligatorios de un familiar y la lista de tres especies (002); que una mascota pueda ser responsable de una actividad (003); y los botones sueltos de Intercambios e Historial (005, 006). El resto de esas specs sigue vigente sin cambios.

**Plataforma.** La PoC web sigue siendo desechable y su stack oficial no está decidido. Las reglas nuevas (aspectos, responsables, creación en varios lugares, migración) deben seguir siendo portables, sin depender del motor gráfico. Toda la interfaz y los documentos siguen en español.

## Goals

**Navegación por secciones**
- Una **barra inferior fija** con cuatro pestañas: **Espacios, Familia, Actividades e Intercambios**. Tocar una abre su drawer, con solo su contenido, y activa el modo edición como hoy (el mapa se encuadra entero y los personajes dejan de caminar).
- Tocar otra pestaña cambia de drawer sin salir del modo edición. Tocar la pestaña activa, o "Listo", cierra el drawer y vuelve a exploración.
- En modo edición, tocar el mapa solo responde a lo de la sección activa: Espacios abre la ficha del espacio, Familia la ficha de la persona o mascota, Actividades la burbuja de ese lugar; Intercambios no responde al mapa.
- Arriba a la derecha queda un único indicador, **"Juega: <nombre>"**, que además es el botón para cambiar de personaje (el selector de la 005). Los botones sueltos "Editar", "Intercambios" e "Historial" desaparecen. La cruceta sube para quedar sobre la barra en exploración.
- Contenido de cada drawer: **Espacios**, los contadores con − y +; **Familia**, las listas de Familiares y Mascotas, cada una con su "+"; **Actividades**, dos pestañas **Pendientes | Hechas** (Pendientes es la lista actual con "+ Actividad"; Hechas es el historial de la 006 con su filtro por persona, promedio y estrellas); **Intercambios**, Recibidas, Enviadas y Proponer como hoy.

**Formulario de actividad simple**
- Una fila con un botón de **icono** a la izquierda y el campo de **nombre** al lado, con chips de **sugerencia** debajo que se filtran mientras se escribe (con el campo vacío salen las primeras 6). Sugerencias iniciales, cada una con su icono: Lavar platos, Barrer, Trapear, Limpiar el baño, Lavar ropa, Sacar la basura, Hacer compras, Regar las plantas, Dar de comer a la mascota, Pasear al perro.
- Elegir una sugerencia pone su nombre y su icono. El icono **solo se puede cambiar si el texto no coincide con ninguna sugerencia**: entonces el botón muestra el icono genérico (📌) y, al tocarlo, abre un selector con los 9 iconos de hoy. No se guarda una marca aparte: el icono editable se deduce del nombre. La comparación ignora mayúsculas, acentos y espacios al inicio y al final (como la unicidad de nombres del proyecto). Al editar una actividad existente se respeta el icono guardado hasta que el nombre pase a coincidir con una sugerencia.
- **Quién:** círculos con el color y la inicial de cada persona (propietario y familiares, nunca mascotas). Viene preseleccionado quien juega, así que con solo el nombre ya se puede guardar.
- Una línea-resumen "📅 Hoy · Una vez · Sin lugar" con un **"Cambiar"** que despliega la fecha (hoy por defecto), la recurrencia (un solo selector: Una vez, Cada día, Cada 2, 3, 7, 14 o 30 días; reemplaza al par Tipo + Frecuencia sin cambiar los datos guardados) y los lugares.
- **Lugares como chips de selección múltiple** al crear: cada chip marcado genera una actividad independiente con la misma persona, fecha y recurrencia (por ejemplo, Barrer cuarto 1, Barrer cuarto 2 y Barrer sala, todas de Diana). Sin ningún chip se crea una sola actividad "Sin lugar". Si el total superaría las 50 pendientes (el mismo conteo que el tope actual: actividades no eliminadas y no hechas), no se crea ninguna y se explica el motivo. Es una sola operación y un solo guardado.
- **Al editar**, una actividad es un registro suelto con un solo lugar (chips de selección única); editar una no toca las que se crearon junto con ella.

**Formularios de familiar y de mascota simples**
- **Familiar:** botón de icono a la izquierda y nombre al lado. El icono es el **aspecto** y abre un selector de siete: 👨 adulto, 👩 adulta, 👦 niño, 👧 niña, 👴 anciano, 👵 anciana, 🧑 neutro. Viene en neutro, así que basta el nombre. Al editar un familiar existente, el botón "Rutina" sigue ahí.
- **Mascota:** botón de icono a la izquierda y nombre al lado. El icono es la **especie** y abre un selector de seis: 🐶 perro, 🐱 gato, 🐰 conejo, 🐹 hámster, 🦜 loro, 🐾 otro. Viene en "otro", así que basta el nombre.
- El **parentesco desaparece** del modelo. El personaje del propietario sigue como hoy: solo se renombra y no tiene aspecto.

**Mascotas sin actividades**
- Una mascota **no puede ser responsable** de una actividad: ninguna pantalla la ofrece y crear o editar con una mascota se rechaza con un mensaje que explica el motivo. Las actividades sobre mascotas se asignan a una persona (por eso las sugerencias "Dar de comer a la mascota" y "Pasear al perro").

**Error de los espacios**
- La tecla Espacio funciona en todos los campos de texto en el navegador de escritorio. Las flechas siguen moviendo al personaje en exploración.

**Datos guardados**
- Los hogares guardados con las features 001 a 006 **se abren sin error** y quedan en el formato nuevo en el siguiente guardado: los aspectos se derivan del género (femenino → adulta, masculino → adulto, otro → neutro), el parentesco se pierde y las actividades asignadas a mascotas se dan de baja. El historial no se toca.

## Non-Goals

- No hay arte nuevo: los personajes, mascotas y burbujas siguen siendo rectángulos de color (los niños, más pequeños).
- No se pueden editar ni mover las actividades de un grupo creado en varios lugares como si fueran una sola: cada una es un registro suelto.
- No hay sugerencias personalizables por el usuario ni iconos nuevos de actividad: son una lista cerrada y los 9 de hoy.
- El propietario no tiene aspecto ni se le agrega un selector de icono.
- No se conserva el parentesco ni la posibilidad de agregarlo después desde la interfaz.
- El botón "Hecho" no aparece dentro del drawer de Pendientes: sigue en las burbujas del mapa, en exploración.
- No se cambian las reglas de intercambios, rutinas, calificaciones ni el tope de 200 entradas del historial.
- No hay cuentas, contraseñas ni sincronización entre teléfonos: sigue siendo un solo teléfono compartido.

## Success Criteria

1. La barra inferior tiene exactamente cuatro pestañas; cada una abre su drawer con solo su contenido y activa el modo edición; cambiar de pestaña no sale de la edición; "Listo" o tocar la pestaña activa vuelve a exploración; los botones sueltos "Editar", "Intercambios" e "Historial" ya no existen; "Juega: <nombre>" siempre es visible y abre el selector de personaje. Se verifica en el navegador y en el teléfono.
2. En modo edición, tocar el mapa solo abre la ficha, la burbuja o la acción de la sección activa; con Intercambios activo no responde. Se verifica en el navegador.
3. Se puede escribir espacios en el nombre de un espacio, de un familiar, de una mascota y de una actividad en Chrome de escritorio (por ejemplo, "Lavar platos"); en exploración las flechas del teclado siguen moviendo al personaje. Se verifica a mano en escritorio, con un paso concreto registrado en `verification.md`, porque las reglas del proyecto prohíben pruebas automáticas con DOM o Phaser.
4. Crear o editar una actividad con una mascota como responsable se rechaza con un mensaje; ningún selector de la interfaz ofrece una mascota como responsable; al migrar un hogar v3 a v6 con actividades de mascotas, esas actividades quedan dadas de baja y el historial queda idéntico. Se verifica con pruebas automáticas sin interfaz.
5. En un alta de actividad, escribir solo el nombre (con quien juega preseleccionado) y tocar Guardar crea **una** actividad puntual, vence hoy, sin lugar, con el icono genérico; elegir una sugerencia pone su nombre e icono y el icono queda fijo; escribir un texto que no coincide con ninguna sugerencia deja el icono editable. Se verifica con pruebas automáticas de las funciones puras (sugerencias, icono editable, valores por omisión) y a mano en el teléfono.
6. Marcar *n* lugares crea exactamente *n* actividades independientes con la misma persona, fecha y recurrencia, en un solo guardado; marcar ninguno crea una; si el total superaría las 50 pendientes no se crea ninguna y se muestra el motivo. Se verifica con pruebas automáticas, incluido el límite (49, 50 y 51).
7. En el alta de un familiar, con solo el nombre se guarda un familiar con aspecto neutro; cada uno de los siete aspectos se puede elegir y se guarda; en el alta de una mascota, con solo el nombre se guarda una mascota de especie "otro"; cada una de las seis especies se puede elegir y se guarda. Se verifica con pruebas automáticas del modelo y a mano en el teléfono.
8. Un hogar guardado con cualquiera de las features 001 a 006 se abre con todos sus datos válidos, sin aviso, y queda guardado como `version: 7` en el siguiente guardado; los aspectos se derivan según la tabla de la sección Goals; un documento v7 inválido (aspecto fuera de la lista, actividad con una mascota como responsable) se trata como ilegible con el aviso de siempre. Se verifica con pruebas automáticas de la migración en cada versión de origen.
9. En la pestaña Hechas de Actividades el historial hace lo mismo que el botón Historial de la 006 (filtro por persona, promedio, calificar con estrellas, bloqueo), sin cambios de reglas. Se verifica con las pruebas de la 006 y a mano.
10. En el teléfono Android de referencia, con 8 familiares, 4 mascotas, 50 actividades y 200 entradas de historial, el movimiento se mantiene a 60 cuadros por segundo; abrir un drawer, cambiar de pestaña y abrir un formulario muestran el resultado en menos de 100 ms.

## Architecture Decisions

- [Aspecto de los familiares, mascotas sin actividades y documento guardado versión 7](../../adr/007-aspecto-miembros-formato-v7.md) — un campo único `aspecto` con siete valores reemplaza a `genero`, se elimina `parentesco`, las mascotas dejan de poder ser responsables (la migración da de baja sus actividades y no toca el historial) y el documento pasa a `version: 7` con migración pura desde v1 a v6.

**Decisiones menores, sin ADR** (reversibles y sin alternativas con costes reales; se registran aquí):
- **Navegación:** barra inferior fija con cuatro pestañas. Se descartaron un botón "Menú" que despliega una lista y un menú a pantalla completa con mosaicos por tocar más veces y por tapar el mapa. El modo edición se activa al abrir cualquier pestaña, no solo Espacios.
- **Historial dentro de Actividades:** pestaña "Hechas"; el botón independiente se elimina.
- **"Juega" como estado:** el indicador "Juega: <nombre>" arriba a la derecha es también el botón para cambiar de personaje.
- **Formulario de actividad:** esencial más resumen que se expande ("Cambiar"). Se descartó mostrar los seis campos compactos en una sola pantalla por seguir pareciendo un formulario largo.
- **Icono editable:** se deduce del nombre (no coincide con ninguna sugerencia); no se guarda ninguna marca extra.
- **Sugerencias:** lista cerrada de 10 en `catalogo.js`, cada una con nombre (máximo 30 caracteres) e icono de los 9 existentes; con el campo vacío se muestran las primeras 6.
- **Varios lugares:** una actividad independiente por cada lugar, con la misma persona, fecha y recurrencia, en una sola operación atómica respecto del tope de 50.
- **Quien juega preseleccionado** en el alta de actividad y el aspecto neutro / especie "otro" por omisión en las altas de habitantes: reglas de presentación; el dominio sigue exigiendo un valor válido.
- **Filtro del historial:** ofrece a las personas siempre y a las mascotas solo si tienen alguna entrada (solo pueden venir de datos anteriores).
- **Corrección de la tecla Espacio:** la escena deja de capturar esa tecla de forma global; la captura queda limitada a las flechas.

## Out of Scope

- Arte real para personajes, mascotas y burbujas.
- Aspecto para el propietario y fecha de nacimiento, edad o cumpleaños de los familiares.
- Agrupar o editar como conjunto las actividades creadas en varios lugares.
- Sugerencias de actividad personalizables o aprendidas del uso.
- Más iconos de actividad.
- El botón "Hecho" dentro del drawer de Pendientes.
- Responsabilidades propias de las mascotas.
- Cambios en intercambios, rutinas, calificaciones o el tope del historial.
- El stack oficial, el multiusuario y las cuentas.
