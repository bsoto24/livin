// src/arte/mobiliario.js
import { lienzo, rect, caja, cuadricula } from './lienzo.js';

// Mobiliario (FR-4 de la 008): un dibujo por pieza de la leyenda de catalogo.js. La clave es "<letra>:<variante>". Las piezas de una
// casilla usan 'unico'; las que son un solo objeto de varias casillas usan 'inicio', 'medio' y 'fin' según sus vecinas de la misma pieza
// a lo largo de su eje. Los bordes de unión de las variantes coinciden para que se vean como un objeto.
export const EJE_DE_PIEZA = { B: 'vertical', S: 'horizontal', T: 'horizontal', M: 'horizontal', E: 'horizontal', V: 'horizontal' };

const una = (dibujar) => { const l = lienzo(); dibujar(l); return cuadricula(l); };
const sinEsquinas = (l, esquinas) => { for (const [x, y] of esquinas) l[y][x] = '.'; };

const velador = una((l) => { caja(l, 2, 3, 13, 13, 'e'); rect(l, 3, 4, 12, 4, 'f'); caja(l, 4, 8, 11, 11, 'd'); rect(l, 7, 9, 8, 10, 'r'); });
const sillaComedor = una((l) => { caja(l, 4, 2, 11, 4, 'd'); caja(l, 4, 5, 11, 12, 'e'); rect(l, 5, 6, 10, 6, 'f'); });
const cocina = una((l) => {
  caja(l, 1, 1, 14, 14, 'v');
  for (const [x, y] of [[3, 3], [9, 3], [3, 8], [9, 8]]) { caja(l, x, y, x + 3, y + 3, 's'); rect(l, x + 1, y + 1, x + 2, y + 2, 'k'); }
  rect(l, 3, 12, 12, 12, 'l');
});
const refrigeradora = una((l) => {
  caja(l, 2, 1, 13, 14, 'j');
  rect(l, 3, 2, 12, 2, 'l'); rect(l, 3, 7, 12, 7, 'l'); rect(l, 3, 13, 12, 13, 'l');
  rect(l, 11, 3, 11, 6, 's'); rect(l, 11, 9, 11, 12, 's');
});
const lavadero = una((l) => { caja(l, 1, 2, 14, 13, 's'); caja(l, 3, 4, 12, 10, 'u'); rect(l, 4, 5, 11, 9, 't'); rect(l, 7, 3, 8, 3, 'v'); });
const inodoro = una((l) => { caja(l, 4, 1, 11, 4, 'j'); caja(l, 4, 5, 11, 14, 'j'); rect(l, 6, 7, 9, 12, 'l'); });
const lavamanos = una((l) => { caja(l, 3, 3, 12, 12, 'j'); caja(l, 5, 5, 10, 10, 't'); rect(l, 7, 4, 8, 4, 's'); });
const ducha = una((l) => { caja(l, 1, 1, 14, 14, 'h'); rect(l, 2, 7, 13, 7, 'g'); rect(l, 7, 6, 8, 9, 'k'); caja(l, 2, 2, 4, 4, 's'); });
const sillaEscritorio = una((l) => { caja(l, 4, 2, 11, 4, 'a'); caja(l, 4, 5, 11, 12, 'b'); });
const camaMascota = una((l) => { caja(l, 1, 3, 14, 13, 'q'); sinEsquinas(l, [[1, 3], [14, 3], [1, 13], [14, 13]]); rect(l, 3, 5, 12, 11, 'n'); });
const plato = una((l) => { caja(l, 4, 5, 11, 11, 'r'); sinEsquinas(l, [[4, 5], [11, 5], [4, 11], [11, 11]]); rect(l, 6, 7, 9, 9, 'd'); });

// Cama de dos casillas en vertical: la de arriba lleva la cabecera y la almohada; la de abajo, el pie.
function cama(parte) {
  const l = lienzo();
  rect(l, 1, 0, 1, 15, 'k'); rect(l, 14, 0, 14, 15, 'k'); // costados
  rect(l, 2, 0, 2, 15, 'd'); rect(l, 13, 0, 13, 15, 'd'); // marco de madera
  rect(l, 3, 0, 12, 15, 'g'); // colcha
  if (parte === 'inicio') {
    rect(l, 1, 0, 14, 0, 'k');
    rect(l, 2, 1, 13, 3, 'd'); rect(l, 2, 1, 13, 1, 'e'); // cabecera
    rect(l, 4, 4, 11, 8, 'j'); rect(l, 4, 8, 11, 8, 'l'); // almohada
    rect(l, 3, 9, 12, 9, 'i'); rect(l, 3, 10, 12, 10, 'h'); // doblez de la colcha
  } else {
    rect(l, 3, 1, 12, 1, 'h'); rect(l, 3, 6, 12, 6, 'i'); // pliegues
    rect(l, 2, 12, 13, 14, 'd'); // pie de la cama
    rect(l, 1, 15, 14, 15, 'k'); rect(l, 1, 12, 1, 14, 'k'); rect(l, 14, 12, 14, 14, 'k');
  }
  return cuadricula(l);
}

// Sofá de cuatro casillas: brazo en cada extremo y cojines en el medio.
function sofa(parte) {
  const l = lienzo();
  rect(l, 0, 1, 15, 1, 'k'); rect(l, 0, 14, 15, 14, 'k'); // contorno de arriba y de abajo
  rect(l, 0, 2, 15, 5, 'o'); rect(l, 0, 2, 15, 2, 'p'); // respaldo
  rect(l, 0, 6, 15, 6, 'k'); // unión del respaldo y el asiento
  rect(l, 0, 7, 15, 12, 'p'); rect(l, 0, 13, 15, 13, 'o'); // asiento y frente
  if (parte === 'medio') rect(l, 8, 7, 8, 12, 'o'); // costura entre cojines
  if (parte === 'inicio') {
    rect(l, 0, 1, 0, 14, '.'); rect(l, 1, 1, 1, 14, 'k'); rect(l, 2, 2, 3, 13, 'o'); rect(l, 2, 2, 3, 2, 'p'); rect(l, 4, 6, 4, 12, 'k');
  }
  if (parte === 'fin') {
    rect(l, 15, 1, 15, 14, '.'); rect(l, 14, 1, 14, 14, 'k'); rect(l, 12, 2, 13, 13, 'o'); rect(l, 12, 2, 13, 2, 'p'); rect(l, 11, 6, 11, 12, 'k');
  }
  return cuadricula(l);
}

// Tablero de una mesa: de `y0` a `y1`, con borde y brillo arriba; los extremos cierran el contorno.
function mesa(y0, y1, tapa, brillo, parte) {
  const l = lienzo();
  rect(l, 0, y0, 15, y0, 'k'); rect(l, 0, y1, 15, y1, 'k');
  rect(l, 0, y0 + 1, 15, y1 - 1, tapa); rect(l, 0, y0 + 1, 15, y0 + 1, brillo); rect(l, 0, y1 - 1, 15, y1 - 1, 'd');
  if (parte === 'inicio') { rect(l, 0, y0, 0, y1, '.'); rect(l, 1, y0, 1, y1, 'k'); }
  if (parte === 'fin') { rect(l, 15, y0, 15, y1, '.'); rect(l, 14, y0, 14, y1, 'k'); }
  return l;
}

// Escritorio de dos casillas: monitor a la izquierda, papeles y lápiz a la derecha.
function escritorio(parte) {
  const l = mesa(3, 12, 'e', 'f', parte);
  if (parte === 'inicio') { caja(l, 4, 4, 12, 8, 'a'); rect(l, 5, 5, 11, 7, 'h'); rect(l, 7, 9, 9, 10, 'd'); }
  else { rect(l, 3, 5, 9, 9, 'j'); rect(l, 3, 9, 9, 9, 'l'); rect(l, 11, 5, 12, 7, 'r'); }
  return cuadricula(l);
}

// Lavadora de dos casillas: un solo mueble con dos puertas de vidrio.
function lavadora(parte) {
  const l = lienzo();
  rect(l, 0, 2, 15, 2, 'k'); rect(l, 0, 13, 15, 13, 'k'); rect(l, 0, 3, 15, 12, 'v'); rect(l, 0, 12, 15, 12, 's');
  if (parte === 'inicio') { rect(l, 1, 2, 1, 13, 'k'); rect(l, 0, 2, 0, 13, '.'); }
  else { rect(l, 14, 2, 14, 13, 'k'); rect(l, 15, 2, 15, 13, '.'); }
  const cx = parte === 'inicio' ? 9 : 7;
  caja(l, cx - 4, 4, cx + 3, 11, 'j'); rect(l, cx - 2, 6, cx + 1, 9, 'u');
  return cuadricula(l);
}

export const MUEBLES = {
  'n:unico': velador, 's:unico': sillaComedor, 'K:unico': cocina, 'R:unico': refrigeradora, 'L:unico': lavadero, 'W:unico': inodoro,
  'w:unico': lavamanos, 'U:unico': ducha, 'e:unico': sillaEscritorio, 'P:unico': camaMascota, 'o:unico': plato,
  'B:inicio': cama('inicio'), 'B:fin': cama('fin'),
  'S:inicio': sofa('inicio'), 'S:medio': sofa('medio'), 'S:fin': sofa('fin'),
  'T:inicio': cuadricula(mesa(3, 12, 'e', 'f', 'inicio')), 'T:fin': cuadricula(mesa(3, 12, 'e', 'f', 'fin')),
  'M:inicio': cuadricula(mesa(2, 13, 'f', 'j', 'inicio')), 'M:medio': cuadricula(mesa(2, 13, 'f', 'j', 'medio')),
  'M:fin': cuadricula(mesa(2, 13, 'f', 'j', 'fin')),
  'E:inicio': escritorio('inicio'), 'E:fin': escritorio('fin'),
  'V:inicio': lavadora('inicio'), 'V:fin': lavadora('fin'),
};

export const LETRAS_MUEBLE = [...new Set(Object.keys(MUEBLES).map((clave) => clave[0]))];
