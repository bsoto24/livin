// src/arte/paleta.js
export const TAM = 16; // lado de una casilla y de cada dibujo, en píxeles

// Paleta única (FR-1 de la 008, ADR-008): 32 colores en 11 familias. La clave de un carácter identifica el color en las cuadrículas;
// '.' queda reservado para el píxel transparente. Las features 009 y 010 la reutilizan y pueden ampliarla, no sustituirla.
export const FAMILIAS = [
  { nombre: 'Contorno y pared', colores: { k: '#2e2233', a: '#4f4260', b: '#7a6a8c', c: '#a799b8' } },
  { nombre: 'Madera', colores: { d: '#b87f48', e: '#d9a066', f: '#ecc99a' } },
  { nombre: 'Azul', colores: { i: '#3f5fb0', g: '#5b7fd6', h: '#8fb0f0' } },
  { nombre: 'Rosa', colores: { m: '#d4537e', n: '#e888a8', y: '#e9d6dc', Y: '#dcc0c9' } },
  { nombre: 'Verde', colores: { o: '#5fa05a', p: '#8bc27d' } },
  { nombre: 'Neutros', colores: { j: '#f4f1ea', l: '#cfc8b8', s: '#9aa5ad', v: '#c4ccd1' } },
  { nombre: 'Azulejo', colores: { t: '#cfe3ea', u: '#a9c9d6' } },
  { nombre: 'Lavanda', colores: { w: '#dcd8ea', x: '#bdb7d6' } },
  { nombre: 'Arena y piedra', colores: { z: '#eadfcf', A: '#d4c3a8', B: '#d6d1c4', C: '#b9b3a3' } },
  { nombre: 'Verde grisáceo', colores: { D: '#dde3d6', E: '#c3ccba' } },
  { nombre: 'Acento', colores: { q: '#c0392b', r: '#f2c14e' } },
];
export const PALETA = Object.fromEntries(FAMILIAS.flatMap((f) => Object.entries(f.colores)));
