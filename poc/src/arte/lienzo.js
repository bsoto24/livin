// src/arte/lienzo.js
import { TAM } from './paleta.js';

// Herramientas para armar cuadrículas de texto de TAM×TAM (ADR-008): una lista de TAM cadenas de TAM caracteres, cada uno una clave
// de la paleta, con '.' para el píxel transparente. Un lienzo es una matriz de caracteres que se pinta con `rect` y `caja`.
export const lienzo = () => Array.from({ length: TAM }, () => Array(TAM).fill('.'));

// Rectángulo relleno, con los extremos incluidos.
export function rect(l, x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) l[y][x] = c;
}

// Rectángulo relleno con un borde de un píxel.
export function caja(l, x0, y0, x1, y1, relleno, borde = 'k') {
  rect(l, x0, y0, x1, y1, borde);
  rect(l, x0 + 1, y0 + 1, x1 - 1, y1 - 1, relleno);
}

export const cuadricula = (l) => l.map((fila) => fila.join(''));

// Cuadrícula calculada píxel a píxel: `clave(x, y)` devuelve la clave de la paleta de cada píxel.
export const patron = (clave) => Array.from({ length: TAM }, (_, y) => Array.from({ length: TAM }, (_, x) => clave(x, y)).join(''));
