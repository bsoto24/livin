# Verificación de integración: Rutinas

**Feature:** 004-rutinas
**Fase del plan:** Phase 8: Integration Verification
**Fecha:** 2026-10-07
**Código verificado:** rama `feat/004-rutinas` en `03ad63f` (carpeta `poc/`)
**Estado:** verificación automática y en navegador de escritorio **completa**; verificación en el teléfono Android **pendiente** (sección "Pendiente en el Android").

## Resultado automático

| Dato | Valor |
|---|---|
| `npm test` | 207 pruebas, 207 pasan, 0 fallan (150 de las features anteriores + 57 nuevas) |
| Distribuciones comprobadas de forma exhaustiva | 7.560, con entrada alcanzable en todas |
| Huella de las 7.560 distribuciones, con la entrada cerrada, frente al generador de `main` (feature 003) | idéntica (`f3e2f4bd…77393`), comprobada de forma independiente por el revisor |
| Revisión de alineación con la spec (`sdd-review`, modo B) | ronda 1: DRIFT DETECTED; ronda 2: **SPEC-ALIGNED** |
| Criterios de aceptación | 112: 80 cubiertos por pruebas automáticas, 32 solo de interfaz (verificados por lectura del código y, en parte, en el navegador); ninguno parcial ni faltante |

### Hallazgos de la revisión y su resolución

| Hallazgo | Resolución |
|---|---|
| D1 (AC-3.10): un familiar lejos de un espacio lleno no iba a esperar junto a él; reproducido a mano (a 30 s seguía a 15 casillas, sin moverse) | Corregido en `planificar` (Phase 9), con su prueba |
| D4 (AC-6.5): la hora de vuelta del cartel cambiaba al editar rutinas | Corregido: se calcula con las rutinas del momento de entrar a editar; comprobado en el navegador (04:00 durante la edición, 03:30 tras "Listo") |
| D5 (AC-8.6, FR-7): dos nombres de familiares en ruta en una misma casilla podían taparse | Corregido: se apilan; **sin comprobar visualmente** |
| Cobertura parcial de AC-3.5, AC-10.11, AC-11.6, AC-9.3 y AC-9.7 | Pruebas agregadas (Phases 9 y 10) |
| D2: el cartel es más ancho que una casilla | Aceptado: ruling del plan (alineado a la derecha contra la entrada, no tapa nada) |
| D3: quien espera un espacio lleno no bloquea a quien pasea | Aceptado: ruling del plan (evita un bloqueo real en la puerta de un baño interno; la spec define "en ruta" como caminar hacia el lugar) |

## Verificado en el navegador de escritorio (ventana de 375×812)

Sobre una copia del código y, para lo último, sobre el código de la rama:

- La entrada se ve como un hueco en la pared inferior de la sala; el personaje la pisa y no pasa de ella.
- "Rutina" solo aparece en la ficha de un familiar; la rutina abre en "Lun–Vie" con "Sin bloques" y "0 de 8".
- La ficha de bloque empieza sin valores elegidos y con "Guardar" desactivado; ofrece 48 inicios (00:00–23:30), fines hasta 24:00 y "Fuera de casa" más los espacios sin pasillos.
- Se muestran los mensajes de fin anterior al inicio y de superposición; el bloque se guarda de inmediato en formato v4.
- Con un bloque "Fuera de casa" vigente, al tocar "Listo" el familiar no está en el mapa y el cartel dice "1 fuera"; su hoja dice "Vuelve a las HH:MM". El cartel se puede tocar con el personaje en la casilla de aparición (se corrigió la cruceta, que lo tapaba) y la cruceta sigue moviendo al personaje.
- En modo edición el cartel sigue visible y su fila abre la ficha del familiar.
- Al empezar el bloque siguiente (cambio a las 00:30 con la app abierta), el familiar vuelve a entrar por la entrada y camina hasta la cocina; con el personaje en la casilla de arriba, esperó y entró cuando este se apartó.
- Eliminar a un familiar con bloques pide confirmación: "¿Eliminar a "Diana"? Se eliminarán 2 bloques de rutina."

## Pendiente en el Android

Servir `poc/` por la red local con la cabecera `Cache-Control: no-cache` (ver la lección de la caché de módulos en `docs/lessons/`), abrir `http://<IP-del-computador>:8080` en el teléfono y apagar el servidor al terminar:

```bash
cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('0.0.0.0', 8080), h).serve_forever()"
```

- [ ] **Rendimiento (AC-8.7):** 60 fps o más con 8 familiares cuyos bloques empiezan a la vez en espacios lejanos del hogar más grande, 4 mascotas y 50 actividades, durante el cambio de bloque y 30 s después.
- [ ] **Tiempo de respuesta (AC-6.2, AC-5.15):** `regen` por debajo de 100 ms en 10 "Listo" seguidos con rutinas cargadas.
- [ ] **Legibilidad y tamaño:** cartel ("n fuera !"), filas de su hoja, textos de la ficha y de la rutina, y nombres de los personajes.
- [ ] **Posición y área táctil del cartel (D2):** con el zoom de exploración y con el de edición, el cartel no tapa la entrada ni nada más, y tocar cualquier punto de su dibujo abre la hoja.
- [ ] **Nombres que se apilan (D5, AC-8.6):** dos familiares en ruta que se cruzan en un pasillo: ambos nombres se distinguen y no tapan a otros personajes (el apilado usa 18 px por nombre, una estimación).
- [ ] **Espera junto a un espacio lleno (D1):** un familiar que espera en una puerta o un pasillo puede bloquear al jugador; ver cómo se siente.
- [ ] **Cruceta y cartel (AC-5.14):** al soltar un dedo sobre un botón de la cruceta no se abre la hoja del cartel ni una burbuja.
- [ ] **Hora (AC-7.6 a AC-7.9):** cambio de bloque con la app abierta; volver de segundo plano tras horas (los familiares caminan hacia donde corresponde); reabrir la app tras horas (aparecen donde corresponde); si se puede, dejar la app abierta un viernes a medianoche.
- [ ] **Listas nativas (AC-1.4, AC-2.1):** los selectores de inicio (48 valores), fin y lugar se ven y se eligen bien.
- [ ] **Nombres como texto (AC-1.12):** un espacio llamado `<b>x</b>` se ve como texto en la lista de lugares, en la rutina y en las confirmaciones.
- [ ] **Cierre inesperado (AC-11.9):** matar la app y reabrirla pierde como máximo el último cambio.
- [ ] Anotar el modelo del teléfono y los valores de `fps` y `regen` aquí.
