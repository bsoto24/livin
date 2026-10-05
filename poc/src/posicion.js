// src/posicion.js
import { esTransitable } from './distribucion.js';

export const DIRECCIONES = { arriba: { dx: 0, dy: -1 }, abajo: { dx: 0, dy: 1 }, izquierda: { dx: -1, dy: 0 }, derecha: { dx: 1, dy: 0 } };

// Convierte una casilla absoluta del mapa en una posición relativa a su espacio o pasillo (FR-10).
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

// Un paso del modo exploración: devuelve la nueva casilla y dirección (AC-2.1, AC-2.3).
export function paso(distribucion, actual, direccion) {
  const { dx, dy } = DIRECCIONES[direccion];
  const x = actual.x + dx;
  const y = actual.y + dy;
  if (esTransitable(distribucion, x, y)) return { x, y, direccion, movio: true };
  return { x: actual.x, y: actual.y, direccion, movio: false };
}
