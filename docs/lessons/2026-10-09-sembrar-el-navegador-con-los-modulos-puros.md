---
date: 2026-10-09
spec: "006"
tags: [verificacion, navegador, phaser, datos-de-prueba]
---

# Lección: verificar la interfaz sembrando el hogar con los módulos puros desde la consola

## Contexto

La capa de presentación (Phaser y el DOM) no tiene pruebas automáticas, y el estado de `juego.js` (`estado`, `jugador`) no es accesible desde la página. Verificar la 006 en el navegador exigía un hogar con familiares, una mascota, actividades, entradas y hasta 200 entradas.

## Qué pasó

En vez de crear todo a mano con el modo edición, se usó la consola del navegador (`javascript_tool`): `await import('/src/hogar.js')` y `await import('/src/actividades.js')` cargan los mismos módulos puros que usa la app; con ellos se construyó un hogar con un contexto de ids y reloj, se marcó "Hecho" con `marcarHecha` y se escribió el documento resultante en `localStorage['livin:datos:v1']`; al recargar, la app lo abrió como un hogar real. Así se verificaron también el límite de 200 entradas, el rendimiento del panel y la migración de un documento v5 (borrando `historial` y poniendo `version: 5`). Lo único que no se pudo hacer fue tocar la burbuja de la hoja en el mapa (el lienzo de Phaser no tiene DOM), y se anotó como no verificado.

## Qué hacer la próxima vez

- Para verificar una función de interfaz, sembrar el estado con las funciones puras importadas desde la página, guardarlo en `localStorage` y recargar; después manejar los paneles del DOM con JavaScript o con clics por coordenadas (las coordenadas de `computer` están en el doble de los píxeles CSS de la ventana).
- Anotar en `verification.md` qué parte se sembró y qué no se tocó (los toques sobre el lienzo), para que la verificación en el teléfono la complete.
- Apagar el servidor estático temporal y limpiar `localStorage` al terminar.

## Señales a vigilar

Un registro de verificación que dice "verificado en el navegador" sin decir cómo se creó el estado de prueba; pruebas manuales que dependen de crear a mano decenas de datos.
