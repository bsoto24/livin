// src/arte/colores.js
import { PALETA } from './paleta.js';

// Colores de la interfaz (FR-7 de la 011, ADR-011): cada rol de la interfaz es una clave de la paleta. De esta tabla salen las variables
// de color del CSS y los colores del texto del mapa; `index.html` no tiene ningún color propio.
export const ROLES = {
  fondo: 'k', linea: 'k', separador: 'A',
  barra: 'k', 'barra-tx': 'z', sel: 'e', 'sel-tx': 'k',
  panel: 'j', tx: 'k', campo: 'j',
  boton: 'i', 'boton-tx': 'j', suave: 'z', 'suave-tx': 'k',
  peligro: 'q', 'peligro-tx': 'j', depuracion: 'p',
  'etiqueta-fondo': 'z', 'etiqueta-tx': 'k', 'cartel-fondo': 'k', 'cartel-tx': 'j', resalte: 'r',
};
// El velo de los modales: el color de contorno con alfa; es la única transparencia de la interfaz.
export const VELO = { clave: 'k', alfa: 0.55 };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Variables CSS: una por clave de la paleta (`--c-k`), una por rol (`--barra`) y `--velo`. Pura: mismo resultado en cada llamada.
export function variablesDeColor(paleta = PALETA) {
  const v = {};
  for (const [clave, color] of Object.entries(paleta)) v[`--c-${clave}`] = color;
  for (const [rol, clave] of Object.entries(ROLES)) v[`--${rol}`] = paleta[clave];
  const [r, g, b] = rgb(paleta[VELO.clave]);
  v['--velo'] = `rgba(${r}, ${g}, ${b}, ${VELO.alfa})`;
  return v;
}

// Contraste de WCAG entre dos colores `#rrggbb`: de 1 a 21.
const luminancia = (hex) => {
  const [r, g, b] = rgb(hex).map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

// Pares [rol del fondo, rol del texto] que deben cumplir 4,5 a 1 (AC-7.7, AC-7.9).
export const PARES_DE_TEXTO = [
  ['barra', 'barra-tx'], ['sel', 'sel-tx'], ['panel', 'tx'], ['boton', 'boton-tx'], ['suave', 'suave-tx'], ['peligro', 'peligro-tx'],
  ['campo', 'tx'], ['panel', 'peligro'], ['fondo', 'depuracion'],
  ['etiqueta-fondo', 'etiqueta-tx'], ['cartel-fondo', 'cartel-tx'], ['resalte', 'etiqueta-tx'],
];

// Colores del texto y de las burbujas del mapa (AC-7.8): los usa Phaser, que no lee las variables del CSS.
export const COLORES_DEL_MAPA = {
  fondo: PALETA[ROLES.fondo],
  etiquetaFondo: PALETA[ROLES['etiqueta-fondo']], etiquetaTx: PALETA[ROLES['etiqueta-tx']],
  cartelFondo: PALETA[ROLES['cartel-fondo']], cartelTx: PALETA[ROLES['cartel-tx']],
  resalte: PALETA[ROLES.resalte],
  burbujaFondo: PALETA[ROLES.panel], burbujaBorde: PALETA[ROLES.linea],
};
export const numeroDeColor = (hex) => parseInt(hex.slice(1), 16);
