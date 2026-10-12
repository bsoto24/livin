---
date: 2026-10-12
spec: "012"
tags: [despliegue, sdd-specify, verificacion]
---

# Lección: al excluir `test/` del sitio, revisar las verificaciones que lo usaban

## Contexto

Feature 012. FR-2 pide publicar solo `index.html`, `src/` y `assets/`, sin `test/`. AC-6.3 pedía medir en el teléfono, con el sitio publicado, el hogar de carga completa de la 011 (8 familiares, 4 mascotas, 50 pendientes, 200 entradas).

## Qué pasó

La verificación de la 011 cargaba ese hogar desde la consola con `await import('/test/hogares-de-prueba.js')`, y esa ruta ya no existe en el sitio publicado (da 404, que es lo que exige AC-5.1). El AC-6.3 quedó imposible de cumplir tal cual: se midió una partida normal (78 fps, `regen` 8,2 ms) y se anotó la salvedad en `verification.md`. Pegar el JSON a mano era posible en escritorio (185 KB), pero no en el teléfono, donde no hay consola. Para colmo, el `regen` de 0,0 ms de la 011 no es comparable: vale 0,0 cuando no hubo redibujado.

## Qué hacer la próxima vez

- Al redactar los AC de verificación de una feature de despliegue, listar de dónde sale cada dato de prueba y comprobar que sigue disponible en lo que se publica.
- Si hace falta una carga de prueba en el sitio publicado, decidirlo en la spec: una página de pruebas fuera del sitio, un botón o parámetro de depuración (con su riesgo) o aceptar medir con el hogar normal. No prometer la carga completa sin un camino para cargarla.
- Redactar los AC de rendimiento con el indicador exacto y su condición («`regen` tras un cambio de estado») y no comparar un valor con otro registrado en una situación distinta.

## Señales a vigilar

- Un AC que menciona «el hogar de carga completa» o cualquier archivo de `test/` en un entorno donde `test/` no se sirve.
- Una comparación de `regen` entre mediciones hechas con y sin redibujado.
