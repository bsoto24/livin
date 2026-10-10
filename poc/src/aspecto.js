// src/aspecto.js
// Aspecto de los espacios en el mapa (FR-5 y FR-6 de la 003): dónde van las burbujas y los objetos del suelo.
// Puro y sin azar: la misma distribución y el mismo estado dan siempre las mismas casillas.
import { esTransitable } from './distribucion.js';
import { claveCasilla } from './posicion.js';

export const INSIGNIAS = { limpio: '✓', desordenado: '!', desastre: '!!' };
export const OBJETOS_POR_ESTADO = { limpio: 0, desordenado: 4, desastre: 12 };

// Hash FNV-1a de 32 bits: el mismo texto da siempre el mismo número.
function hash(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Casillas del área de un espacio donde se puede pisar y que no son puertas ni la entrada del hogar, en orden de lectura
// (fila a fila). La entrada queda libre de objetos y de burbujas (AC-9.6 de la 004).
export function casillasLibres(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const excluidas = new Set([...distribucion.puertas, distribucion.entrada].map((p) => claveCasilla(p.x, p.y)));
  const libres = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (distribucion.espacioEn[y][x] === espacioId && esTransitable(distribucion, x, y) && !excluidas.has(claveCasilla(x, y))) {
        libres.push({ x, y });
      }
    }
  }
  return libres;
}

// Casilla fija de la burbuja de un espacio (AC-2.8): la primera casilla libre de su área.
export const casillaDeBurbuja = (distribucion, espacioId) => casillasLibres(distribucion, espacioId)[0] ?? null;

// Objetos del suelo (FR-5): tantos como pide el estado, limitados por las casillas libres del espacio.
// El orden sale del hash del espacio y la casilla, así que el desastre siempre agrega objetos a los del desorden.
export function objetosDelSuelo(distribucion, espacioId, limpieza) {
  const libres = casillasLibres(distribucion, espacioId);
  return libres
    .map((c) => ({ ...c, h: hash(`${espacioId}:${claveCasilla(c.x, c.y)}`) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, OBJETOS_POR_ESTADO[limpieza])
    .map(({ x, y, h }) => ({ x, y, variante: h % 6 }));
}

// Casilla de cada burbuja (FR-6): la de un espacio, su casilla fija; la de un miembro, la de encima de él.
export function ubicarBurbujas(lista, distribucion, posiciones) {
  return lista.flatMap((b) => {
    if (b.tipo === 'espacio') {
      const c = casillaDeBurbuja(distribucion, b.id);
      return c ? [{ ...b, x: c.x, y: c.y }] : [];
    }
    const p = posiciones.get(b.id);
    return p ? [{ ...b, x: p.x, y: p.y - 1 }] : [];
  });
}

// ---------- Casillas del desastre (FR-3 y FR-4 de la 010) ----------
export const MANCHAS_POR_DESASTRE = 6;
export const MOSCAS_POR_DESASTRE = 2;

// Casillas libres de un espacio en orden de hash con una sal propia: otra tanda que la de los objetos del suelo. Mismo espacio, misma tanda.
function casillasPorHash(distribucion, espacioId, sal) {
  return casillasLibres(distribucion, espacioId)
    .map((c) => ({ ...c, h: hash(`${sal}${espacioId}:${claveCasilla(c.x, c.y)}`) }))
    .sort((a, b) => a.h - b.h)
    .map(({ x, y }) => ({ x, y }));
}

// Manchas del piso: solo en desastre, hasta MANCHAS_POR_DESASTRE casillas libres.
export const manchasDelSuelo = (distribucion, espacioId, limpieza) => (limpieza === 'desastre'
  ? casillasPorHash(distribucion, espacioId, 'mancha:').slice(0, MANCHAS_POR_DESASTRE)
  : []);

// Casillas con moscas: solo en desastre, MOSCAS_POR_DESASTRE casillas libres. Qué tipos de espacio las llevan lo decide el arte.
export const moscasDelSuelo = (distribucion, espacioId, limpieza) => (limpieza === 'desastre'
  ? casillasPorHash(distribucion, espacioId, 'moscas:').slice(0, MOSCAS_POR_DESASTRE)
  : []);

const esPared = (distribucion, x, y) => distribucion.tiles[y]?.[x] === '#';

// Esquinas superiores de un espacio (FR-4): casillas interiores suyas (ni pared ni vacío) con pared al norte y pared al oeste ('izquierda')
// o, si no, pared al este ('derecha'). En orden de lectura; una sola esquina por casilla. Vale también si un mueble ocupa la casilla.
export function esquinasDelEspacio(distribucion, espacioId) {
  const r = distribucion.rects[espacioId];
  if (!r) return [];
  const esquinas = [];
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const ch = distribucion.tiles[y][x];
      if (distribucion.espacioEn[y][x] !== espacioId || ch === '#' || ch === ' ' || !esPared(distribucion, x, y - 1)) continue;
      if (esPared(distribucion, x - 1, y)) esquinas.push({ x, y, lado: 'izquierda' });
      else if (esPared(distribucion, x + 1, y)) esquinas.push({ x, y, lado: 'derecha' });
    }
  }
  return esquinas;
}
