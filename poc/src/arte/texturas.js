// src/arte/texturas.js
import { patron } from './lienzo.js';

// Ruido determinista para las motas: el mismo píxel da siempre el mismo valor.
const ruido = (x, y) => (x * 7 + y * 13 + x * y * 3) % 11;

// Un suelo por tipo de espacio y uno para el pasillo (FR-2 de la 008). Cada patrón se repite sin costura al ponerse casilla con casilla.
export const SUELOS = {
  sala: patron((x, y) => { // madera cálida en tablas horizontales
    if (y % 8 === 7 || (x + (y >> 3) * 5) % 16 === 0) return 'd';
    return y % 8 === 0 && x % 6 < 3 ? 'f' : 'e';
  }),
  comedor: patron((x, y) => ((x % 8 === 7 || (y + (x >> 3) * 5) % 16 === 0) ? 'e' : 'f')), // madera clara en tablas verticales
  cocina: patron((x, y) => { // baldosa en damero con junta gris azulada
    if (x % 8 === 7 || y % 8 === 7) return 's';
    return ((x >> 3) + (y >> 3)) % 2 ? 'v' : 'j';
  }),
  bano: patron((x, y) => ((x % 4 === 3 || y % 4 === 3) ? 'u' : 't')), // azulejo pequeño
  lavanderia: patron((x, y) => (ruido(x, y) % 9 === 0 ? 'E' : 'D')), // concreto verdoso moteado
  mascota: patron((x, y) => ((x + 2 * y) % 9 === 0 ? 'A' : 'z')), // paja con motas
  dormitorio: patron((x, y) => ((x + y) % 4 === 0 ? 'Y' : 'y')), // alfombra rosa tejida
  oficina: patron((x, y) => ((x % 4 === 0 || y % 4 === 0) ? 'x' : 'w')), // alfombra lavanda cuadriculada
  pasillo: patron((x, y) => { // piedra con juntas
    if (y % 8 === 7) return 'C';
    return (x + ((y >> 3) % 2) * 8) % 16 === 15 ? 'C' : 'B';
  }),
};

// Las dos vistas de una casilla de pared (FR-3 de la 008): de frente, con borde claro arriba, ladrillo y zócalo; y desde arriba.
export const PAREDES = {
  frente: patron((x, y) => {
    if (y < 2) return 'c';
    if (y >= 14) return 'k';
    if (y >= 12) return 'a';
    if (y % 6 === 5) return 'a';
    return (x + (Math.floor(y / 6) % 2) * 8) % 16 === 0 ? 'a' : 'b';
  }),
  cima: patron((x, y) => {
    if (y === 0 || y === 15 || x === 0 || x === 15) return 'k';
    return y === 1 ? 'c' : 'b';
  }),
};
