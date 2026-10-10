// src/arte/casillas.js
import { espaciosActivos } from '../hogar.js';
import { SUELOS, PAREDES } from './texturas.js';
import { MUEBLES, EJE_DE_PIEZA } from './mobiliario.js';

// Todos los dibujos por clave de textura: 'suelo:<tipo>', 'pared:frente', 'pared:cima' y 'mueble:<letra>:<variante>'.
export const TEXTURAS = {
  ...Object.fromEntries(Object.entries(SUELOS).map(([tipo, g]) => [`suelo:${tipo}`, g])),
  ...Object.fromEntries(Object.entries(PAREDES).map(([vista, g]) => [`pared:${vista}`, g])),
  ...Object.fromEntries(Object.entries(MUEBLES).map(([clave, g]) => [`mueble:${clave}`, g])),
};

// FR-3 de la 008: la pared se ve de frente si la casilla de debajo existe y no es pared ni vacío; en cualquier otro caso, desde arriba.
export function vistaDePared(tiles, x, y) {
  const debajo = tiles[y + 1]?.[x];
  return debajo !== undefined && debajo !== '#' && debajo !== ' ' ? 'frente' : 'cima';
}

// FR-4 de la 008: variante de una casilla de mueble según sus vecinas de la misma pieza a lo largo de su eje. Las piezas de una sola
// casilla (sin eje) son 'unico'; una pieza de varias casillas sin vecinas es 'solo' y no tiene dibujo.
export function varianteDeMueble(tiles, x, y) {
  const letra = tiles[y][x];
  const eje = EJE_DE_PIEZA[letra];
  if (!eje) return 'unico';
  const [dx, dy] = eje === 'vertical' ? [0, 1] : [1, 0];
  const antes = tiles[y - dy]?.[x - dx] === letra;
  const despues = tiles[y + dy]?.[x + dx] === letra;
  if (antes && despues) return 'medio';
  if (despues) return 'inicio';
  if (antes) return 'fin';
  return 'solo';
}

// FR-5 de la 008: el arte de cada casilla del mapa. `null` para el vacío; si no, el suelo o la pared (`base`) y, si la casilla es de
// mobiliario, el mueble que va encima (`mueble`). Pura y determinista: depende solo del estado (tipos de espacio) y de la distribución.
export function arteDelMapa(estado, distribucion) {
  const tipoDe = new Map(espaciosActivos(estado).map((e) => [e.id, e.tipo]));
  const { tiles, espacioEn } = distribucion;
  return tiles.map((fila, y) => [...fila].map((ch, x) => {
    if (ch === ' ') return null;
    if (ch === '#') return { base: `pared:${vistaDePared(tiles, x, y)}`, mueble: null };
    const clave = espacioEn[y][x];
    const tipo = clave?.startsWith('pasillo:') ? 'pasillo' : tipoDe.get(clave);
    const mueble = `mueble:${ch}:${varianteDeMueble(tiles, x, y)}`;
    return { base: SUELOS[tipo] ? `suelo:${tipo}` : null, mueble: TEXTURAS[mueble] ? mueble : null };
  }));
}
