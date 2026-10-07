// src/rutas.js
// Rutas sobre el mapa (ADR-004 de movimiento): búsqueda en anchura sobre las casillas transitables de la distribución, sin tener
// en cuenta a los personajes. Pura y determinista: explora las direcciones siempre en el mismo orden.
import { esTransitable } from './distribucion.js';
import { DIRECCIONES, claveCasilla } from './posicion.js';

const ORDEN = ['arriba', 'abajo', 'izquierda', 'derecha'];

// Camino más corto desde `desde` hasta la casilla más cercana que cumple `esDestino(x, y)`: la lista de casillas que hay que
// pisar, en orden y sin la de partida. Devuelve [] si `desde` ya es un destino y null si no hay ninguno alcanzable.
export function rutaMasCorta(distribucion, desde, esDestino) {
  if (esDestino(desde.x, desde.y)) return [];
  const previa = new Map([[claveCasilla(desde.x, desde.y), null]]);
  const cola = [{ x: desde.x, y: desde.y }];
  for (let i = 0; i < cola.length; i++) {
    const actual = cola[i];
    for (const direccion of ORDEN) {
      const x = actual.x + DIRECCIONES[direccion].dx;
      const y = actual.y + DIRECCIONES[direccion].dy;
      const clave = claveCasilla(x, y);
      if (previa.has(clave) || !esTransitable(distribucion, x, y)) continue;
      previa.set(clave, actual);
      if (esDestino(x, y)) return reconstruir(previa, { x, y });
      cola.push({ x, y });
    }
  }
  return null;
}

function reconstruir(previa, fin) {
  const camino = [];
  for (let c = fin; previa.get(claveCasilla(c.x, c.y)) !== null; c = previa.get(claveCasilla(c.x, c.y))) camino.push(c);
  return camino.reverse();
}

// Casillas transitables de un espacio, en orden de lectura (fila a fila); incluye sus puertas.
export function casillasDe(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const casillas = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (distribucion.espacioEn[y][x] === espacioId && esTransitable(distribucion, x, y)) casillas.push({ x, y });
    }
  }
  return casillas;
}
