// src/arte/casillas.js
import { espaciosActivos } from '../hogar.js';
import { objetosDelSuelo, manchasDelSuelo, moscasDelSuelo, esquinasDelEspacio } from '../aspecto.js';
import { claveCasilla } from '../posicion.js';
import { SUELOS, PAREDES } from './texturas.js';
import { MUEBLES, EJE_DE_PIEZA } from './mobiliario.js';
import { SUCIEDAD, GRUPO_DE_TIPO, TIPOS_CON_AGUA, TIPOS_CON_MOSCAS, MANCHAS_DE_AGUA } from './suciedad.js';

// Todos los dibujos del mundo por clave de textura: 'suelo:<tipo>', 'pared:frente', 'pared:cima' y 'mueble:<letra>:<variante>'. Los del desorden
// (FR-1 de la 010) están en `SUCIEDAD`, de `suciedad.js`.
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

// FR-6 de la 010: orden en que se dibujan las capas de una casilla, de abajo hacia arriba.
export const ORDEN_DE_CAPAS = ['base', 'mancha', 'mueble', 'sobre', 'telarana', 'objeto', 'moscas'];

// Capas del desorden de un espacio (FR-2 a FR-4 de la 010): "x,y" → { mancha?, telarana?, objeto?, moscas? }. Un tipo sin grupo de objetos
// no lleva objetos ni manchas, pero sí el resto de su estado.
function capasDeDesorden(distribucion, espacioId, tipo, limpieza) {
  const porCasilla = new Map();
  const poner = (c, capa, clave) => {
    const k = claveCasilla(c.x, c.y);
    porCasilla.set(k, { ...porCasilla.get(k), [capa]: clave });
  };
  const grupo = GRUPO_DE_TIPO[tipo];
  if (grupo) {
    for (const o of objetosDelSuelo(distribucion, espacioId, limpieza)) poner(o, 'objeto', `objeto:${grupo}:${o.variante}`);
    let suciedad = 0; // las de suciedad alternan grande y pequeña empezando por la grande; las de agua van primero
    manchasDelSuelo(distribucion, espacioId, limpieza).forEach((c, i) => {
      const agua = TIPOS_CON_AGUA.includes(tipo) && i < MANCHAS_DE_AGUA;
      poner(c, 'mancha', agua ? 'mancha:agua' : `mancha:suciedad-${suciedad++ % 2 === 0 ? 'grande' : 'pequena'}`);
    });
  }
  if (TIPOS_CON_MOSCAS.includes(tipo)) for (const c of moscasDelSuelo(distribucion, espacioId, limpieza)) poner(c, 'moscas', 'moscas');
  if (limpieza === 'desastre') for (const e of esquinasDelEspacio(distribucion, espacioId)) poner(e, 'telarana', `telarana:${e.lado}`);
  return porCasilla;
}

// FR-5 de la 008 y FR-6 de la 010: el arte de cada casilla del mapa. `null` para el vacío; si no, un objeto con las capas de ORDEN_DE_CAPAS
// (clave de textura o `null`). `limpiezas`: Map de id de espacio → estado de limpieza; los espacios que no están, como el pasillo, son limpios.
// Pura y determinista: depende solo del estado (tipos de espacio), de la distribución y de `limpiezas`; no mira la fecha.
export function arteDelMapa(estado, distribucion, limpiezas = new Map()) {
  const espacios = new Map(espaciosActivos(estado).map((e) => [e.id, e]));
  const desorden = new Map();
  for (const [id, limpieza] of limpiezas) {
    const espacio = espacios.get(id);
    if (!espacio || limpieza === 'limpio') continue;
    for (const [k, capas] of capasDeDesorden(distribucion, id, espacio.tipo, limpieza)) desorden.set(k, capas);
  }
  const { tiles, espacioEn } = distribucion;
  const vacias = { mancha: null, sobre: null, telarana: null, objeto: null, moscas: null };
  return tiles.map((fila, y) => [...fila].map((ch, x) => {
    if (ch === ' ') return null;
    if (ch === '#') return { base: `pared:${vistaDePared(tiles, x, y)}`, mueble: null, ...vacias };
    const clave = espacioEn[y][x];
    const tipo = clave?.startsWith('pasillo:') ? 'pasillo' : espacios.get(clave)?.tipo;
    const variante = varianteDeMueble(tiles, x, y);
    const mueble = `mueble:${ch}:${variante}`;
    const sobre = `sobre:${ch}:${variante}:${limpiezas.get(clave) ?? 'limpio'}`;
    return {
      base: SUELOS[tipo] ? `suelo:${tipo}` : null,
      mueble: TEXTURAS[mueble] ? mueble : null,
      ...vacias,
      ...desorden.get(claveCasilla(x, y)),
      sobre: TEXTURAS[mueble] && SUCIEDAD[sobre] ? sobre : null,
    };
  }));
}

// FR-7 de la 010: ¿cambió el estado de algún espacio? Un espacio que falta en uno de los dos mapas cuenta como limpio.
export function estadosCambiaron(antes, despues) {
  for (const id of new Set([...antes.keys(), ...despues.keys()])) {
    if ((antes.get(id) ?? 'limpio') !== (despues.get(id) ?? 'limpio')) return true;
  }
  return false;
}
