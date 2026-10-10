---
date: 2026-10-10
spec: "009"
tags: [verificacion, navegador, phaser, instrumentacion]
---

# Lección: verificar la presentación de Phaser envolviendo métodos del prototipo

## Contexto

La escena de Phaser de `juego.js` no se expone en la página (`Phaser.GAMES[0]` no existe y `escena` es una variable del módulo), y las reglas del proyecto prohíben pruebas automáticas con el motor. La 009 necesitaba comprobar en el navegador qué cuadro, vista y personaje se aplicaba a cada imagen mientras caminaban.

## Qué pasó

Se envolvieron dos métodos desde la consola: `Phaser.GameObjects.Image.prototype.setFrame` (cada cambio de cuadro de una imagen ya creada) y `Phaser.GameObjects.GameObjectFactory.prototype.image` (cada imagen que crea `add.image`, por ejemplo al redibujar). Con eso se registraron las secuencias de cuadros del jugador, `lado:1, 0, 2, 0` cada 125 ms, y de los habitantes, qué cuadro se crea al salir de la edición, al cambiar el tamaño de la ventana, al agregar un familiar o al cambiar de jugador. Los pulsadores táctiles se manejaron con eventos `PointerEvent` sobre los botones de la cruceta (`pointerdown` y `pointerup`), mantenidos con una espera.

Un fallo: una instrumentación lanzada en un script que pasó los 45 s del límite de la herramienta siguió corriendo en la página y, al terminar sus 75 s, restauró el `setFrame` original y borró la instrumentación que se había puesto después. El registro se detuvo sin avisar y los datos parecían indicar que el habitante no se movía.

## Qué hacer la próxima vez

- Para ver qué hace la escena sin exponerla, envolver los métodos del prototipo (`setFrame`, `image`) y restaurarlos siempre en el mismo script.
- Guardar el original en una variable de `window` (`window.__origSet`) y restaurar siempre desde ahí, para que ningún script anterior deje un original equivocado.
- Mantener cada script por debajo de los 45 s de la herramienta; para esperas largas, repetir llamadas de 40 s. Si un script se pasa del tiempo, asumir que sigue corriendo y que su cierre puede deshacer cambios posteriores.
- Los hogares con rutinas se pueden sembrar con `agregarBloque` del módulo `rutinas.js`, con `inicio: 0` y un `fin` múltiplo de 30 minutos, para ver salir y volver a un familiar sin esperar horas.
- Anotar en `verification.md` lo que solo se vio con esta instrumentación y lo que no se comprobó, por ejemplo el toque sobre un personaje en edición.

## Señales a vigilar

Un registro de cuadros que se corta a mitad de la prueba; instrumentación envuelta sin una restauración desde un original guardado; conclusiones sobre el movimiento sacadas de una lista de eventos que puede estar incompleta.
