// src/distribucion.js
import { PIEZAS, CENTRO, TRANSITABLE, ZONA_SERVICIO, ZONA_PRIVADA, ANCHO_PASILLO, FILA_PUERTA_PASILLO } from './catalogo.js';
import { espaciosDeTipo, banoComun, banoDe } from './hogar.js';

// Lista de piezas de una zona lateral, en orden de apilado (FR-3).
function piezasDeZona(estado, tipos) {
  const lista = [];
  for (const tipo of tipos) {
    const espacios = tipo === 'bano' ? [banoComun(estado)] : espaciosDeTipo(estado, tipo);
    for (const espacio of espacios) {
      const base = PIEZAS[tipo];
      const bano = banoDe(estado, espacio.id);
      const variante = bano ? base.conBano : null;
      lista.push({ espacio, bano, filas: variante ? variante.filas : base.filas, banoRect: variante?.banoRect ?? null, puerta: base.puerta });
    }
  }
  return lista;
}

const alturaDe = (piezas) => piezas.reduce((total, p) => total + p.filas.length, 0);

// Función pura: el mismo estado produce siempre la misma distribución.
export function generarDistribucion(estado) {
  const izquierda = piezasDeZona(estado, ZONA_SERVICIO);
  const derecha = piezasDeZona(estado, ZONA_PRIVADA);
  const pasilloIzq = izquierda.length > 2;
  const pasilloDer = derecha.length > 2;
  const altoIzq = alturaDe(izquierda);
  const altoDer = alturaDe(derecha);

  // Centro: comedor (opcional) + sala estirada para colindar con zonas sin pasillo.
  const comedor = espaciosDeTipo(estado, 'comedor')[0] ?? null;
  const sala = espaciosDeTipo(estado, 'sala')[0];
  const filasSuperiores = comedor ? CENTRO.comedor : [CENTRO.paredSuperior];
  const base = filasSuperiores.length + CENTRO.sala.length + 1;
  const requerido = Math.max(pasilloIzq ? 0 : altoIzq, pasilloDer ? 0 : altoDer);
  const estiramiento = Math.max(0, requerido - base);
  const filasCentro = [...filasSuperiores, ...CENTRO.sala, ...Array(estiramiento).fill(CENTRO.salaEstirable), CENTRO.paredInferior];

  const anchoIzq = PIEZAS.cocina.filas[0].length;
  const anchoDer = PIEZAS.dormitorio.filas[0].length;
  const xPasilloIzq = anchoIzq;
  const xCentro = anchoIzq + (pasilloIzq ? ANCHO_PASILLO : 0);
  const xPasilloDer = xCentro + CENTRO.ancho;
  const xDer = xPasilloDer + (pasilloDer ? ANCHO_PASILLO : 0);
  const ancho = xDer + anchoDer;
  const alto = Math.max(altoIzq, altoDer, filasCentro.length);

  const tiles = Array.from({ length: alto }, () => Array(ancho).fill(' '));
  const espacioEn = Array.from({ length: alto }, () => Array(ancho).fill(null));
  const rects = {};
  const puertas = [];

  const estampar = (filas, x0, y0, clave) => {
    filas.forEach((fila, dy) => [...fila].forEach((ch, dx) => {
      tiles[y0 + dy][x0 + dx] = ch;
      espacioEn[y0 + dy][x0 + dx] = clave;
    }));
  };
  const abrir = (x, y) => { tiles[y][x] = '.'; puertas.push({ x, y }); };

  // Centro
  estampar(filasCentro, xCentro, 0, sala.id);
  const altoComedor = comedor ? CENTRO.comedor.length : 0;
  if (comedor) {
    for (let y = 0; y < altoComedor; y++) for (let x = 0; x < CENTRO.ancho; x++) espacioEn[y][xCentro + x] = comedor.id;
    rects[comedor.id] = { x: xCentro, y: 0, w: CENTRO.ancho, h: altoComedor };
  }
  rects[sala.id] = { x: xCentro, y: altoComedor, w: CENTRO.ancho, h: filasCentro.length - altoComedor };
  const filaAparicion = filasCentro.findIndex((f) => f.includes('*'));
  const aparicion = { x: xCentro + filasCentro[filaAparicion].indexOf('*'), y: filaAparicion };

  const pasillos = [];
  const colocarZona = (piezas, x0, lado, conPasillo, xPasillo, altoZona) => {
    let y = 0;
    for (const p of piezas) {
      estampar(p.filas, x0, y, p.espacio.id);
      const w = p.filas[0].length;
      rects[p.espacio.id] = { x: x0, y, w, h: p.filas.length };
      if (p.bano) {
        const r = p.banoRect;
        for (let dy = 0; dy < r.h; dy++) for (let dx = 0; dx < r.w; dx++) espacioEn[y + r.y + dy][x0 + r.x + dx] = p.bano.id;
        rects[p.bano.id] = { x: x0 + r.x, y: y + r.y, w: r.w, h: r.h };
      }
      const yPuerta = y + p.puerta;
      const xParedPieza = lado === 'izq' ? x0 + w - 1 : x0;
      abrir(xParedPieza, yPuerta);
      const xVecino = lado === 'izq' ? x0 + w : x0 - 1; // pared del pasillo o del centro
      abrir(xVecino, yPuerta);
      y += p.filas.length;
    }
    if (conPasillo) {
      const clave = `pasillo:${lado}`;
      const filas = Array.from({ length: altoZona }, (_, i) => (i === 0 || i === altoZona - 1 ? '###' : '#.#'));
      // Las puertas de las piezas ya abrieron la pared exterior del pasillo; estampar respetándolas.
      filas.forEach((fila, dy) => [...fila].forEach((ch, dx) => {
        const x = xPasillo + dx;
        if (tiles[dy][x] === '.' && puertas.some((pt) => pt.x === x && pt.y === dy)) { espacioEn[dy][x] = clave; return; }
        tiles[dy][x] = ch;
        espacioEn[dy][x] = clave;
      }));
      rects[clave] = { x: xPasillo, y: 0, w: ANCHO_PASILLO, h: altoZona };
      pasillos.push({ lado, ...rects[clave] });
      const xParedInterior = lado === 'izq' ? xPasillo + ANCHO_PASILLO - 1 : xPasillo;
      const xParedCentro = lado === 'izq' ? xCentro : xCentro + CENTRO.ancho - 1;
      abrir(xParedInterior, FILA_PUERTA_PASILLO);
      abrir(xParedCentro, FILA_PUERTA_PASILLO);
    }
  };
  colocarZona(izquierda, 0, 'izq', pasilloIzq, xPasilloIzq, altoIzq);
  colocarZona(derecha, xDer, 'der', pasilloDer, xPasilloDer, altoDer);

  return {
    ancho, alto,
    tiles: tiles.map((fila) => fila.join('')),
    espacioEn, rects, puertas, pasillos, aparicion,
  };
}

export function esTransitable(distribucion, x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return false;
  return TRANSITABLE.has(distribucion.tiles[y][x]);
}
