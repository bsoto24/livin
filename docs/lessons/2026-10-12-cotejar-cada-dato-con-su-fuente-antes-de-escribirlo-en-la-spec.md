---
date: 2026-10-12
spec: "012"
tags: [sdd-specify, sdd-plan, spec, datos]
---

# Lección: cotejar cada dato con su fuente antes de escribirlo en la spec o el ADR

## Contexto

Feature 012. Tres datos que parecían obvios resultaron distintos al medirlos:

- La spec y el ADR pedían un hash **SHA-384** para el SRI de Phaser; cdnjs solo publica **SHA-512** para `phaser.min.js` 3.80.1.
- La spec y el PRD decían que la suite tenía **459** pruebas (el número de `CLAUDE.md`); `npm test` en `main` dio **463**.
- El plan decía que la prueba nueva dejaría «1 pass y 9 fail»; al ejecutarla eran 2 pass y 8 fail (el caso «el único script de terceros es Phaser» ya pasaba).

## Qué pasó

Los tres se detectaron al ejecutar el plan, no al escribirlo, y costaron una versión PATCH de la spec (1.0.1 por el algoritmo, 1.0.2 por el conteo) más commits de corrección. Además, al corregir el conteo con un `sed 's/459/463/g'` sobre todos los documentos de la feature, el texto «actual» que el plan citaba del archivo `CLAUDE.md` pasó a decir 463 cuando el archivo real seguía diciendo 459: la sustitución global cambió una cita de un archivo ajeno. El subagente de la Fase 3 lo notó porque su instrucción no coincidía con el archivo.

## Qué hacer la próxima vez

- Al escribir la spec o el ADR, obtener el dato de su fuente en ese momento: `npm test` para los conteos, la API del proveedor para algoritmos y hashes (`api.cdnjs.com/…?fields=sri`), `gh api` para el estado del hosting. No copiar cifras de `CLAUDE.md` ni de la memoria.
- Calcular los «pasa/falla esperado» de las pruebas ejecutándolas (ver la lección del 2026-10-10 sobre validar el código del plan ejecutándolo), no contando a mano.
- No usar reemplazos globales de números en documentos que citan texto de otros archivos: revisar cada coincidencia, o cambiar solo la propia y leer la cita del archivo original.

## Señales a vigilar

- Cifras redondas o heredadas en una spec («459 pruebas», «SHA-384») sin una orden o URL anotada que las respalde.
- Un plan que cita «el texto actual» de otro archivo: comprobarlo con `grep` antes de aprobarlo.
