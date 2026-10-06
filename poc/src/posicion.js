// src/posicion.js
import { esTransitable } from './distribucion.js';

export const DIRECCIONES = { arriba: { dx: 0, dy: -1 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 }, derecha: { dx: 1, dy: 0 } };

// Clave de una casilla para los conjuntos de casillas ocupadas.
export const claveCasilla = (x, y) => `${x},${y}`;

// Convierte una casilla absoluta del mapa en una posición relativa a su espacio o pasillo (FR-10 de la 001).
export function posicionRelativa(distribucion, x, y, direccion) {
  const clave = distribucion.espacioEn[y][x];
  const r = distribucion.rects[clave];
  return { clave, dx: x - r.x, dy: y - r.y, direccion };
}

// Devuelve la casilla absoluta para una posición guardada, o la aparición de la sala si ya no es válida.
export function resolverPosicion(distribucion, guardada) {
  const enSala = { x: distribucion.aparicion.x, y: distribucion.aparicion.y, direccion: 'abajo' };
  if (!guardada) return enSala;
  const r = distribucion.rects[guardada.clave];
  if (!r || guardada.dx < 0 || guardada.dy < 0 || guardada.dx >= r.w || guardada.dy >= r.h) return enSala;
  const x = r.x + guardada.dx;
  const y = r.y + guardada.dy;
  if (!esTransitable(distribucion, x, y) || distribucion.espacioEn[y][x] !== guardada.clave) return enSala;
  return { x, y, direccion: guardada.direccion };
}

// Un paso del modo exploración (AC-2.1 y AC-2.3 de la 001). Las casillas de `ocupadas` (los habitantes) también
// bloquean el paso (FR-6 de la 002); sin ese argumento el comportamiento es el de la 001.
export function paso(distribucion, actual, direccion, ocupadas = new Set()) {
  const { dx, dy } = DIRECCIONES[direccion];
  const x = actual.x + dx;
  const y = actual.y + dy;
  if (esTransitable(distribucion, x, y) && !ocupadas.has(claveCasilla(x, y))) return { x, y, direccion, movio: true };
  return { x: actual.x, y: actual.y, direccion, movio: false };
}
