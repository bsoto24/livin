// src/arte/iconos.js
import { TAM } from './paleta.js';
import { lienzo, rect, caja, cuadricula } from './lienzo.js';
import { CUADROS_DE_PERSONAJES, PERSONAJES, claveDeCuadro, personajeDe } from './personajes.js';

// Iconos propios de la interfaz (FR-1 de la 011, ADR-011): 23 cuadrículas de 16×16 con claves de la paleta, a color y con contorno oscuro
// ('k'), como los muebles del mundo. Son datos puros: los pinta la hoja de texturas del mapa y el módulo de imágenes de la interfaz.
const dibujar = (f) => { const l = lienzo(); f(l); return cuadricula(l); };
const puntos = (l, lista, c) => { for (const [x, y] of lista) l[y][x] = c; };

// Giro de 90° en sentido horario de un lienzo: de la flecha hacia arriba salen las otras tres.
const girar = (l) => l.map((_, y) => l.map((__, x) => l[TAM - 1 - x][y]));

function flechaArriba() {
  const l = lienzo();
  for (let f = 0; f < 6; f++) { // la cabeza: seis filas que se ensanchan
    const y = 1 + f;
    l[y][7 - f] = 'k';
    l[y][8 + f] = 'k';
    rect(l, 8 - f, y, 7 + f, y, 'g');
  }
  rect(l, 2, 7, 13, 7, 'k'); // la base de la cabeza
  caja(l, 5, 7, 10, 14, 'g'); // el tallo
  return l;
}
const ARRIBA = flechaArriba();
const DERECHA = girar(ARRIBA);
const ABAJO = girar(DERECHA);
const IZQUIERDA = girar(ABAJO);

const ESTRELLA = [
  [7, 1], [8, 1], [7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [9, 3],
  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5],
  [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
  [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7],
  [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8],
  [3, 9], [4, 9], [5, 9], [6, 9], [9, 9], [10, 9], [11, 9], [12, 9],
  [3, 10], [4, 10], [5, 10], [10, 10], [11, 10], [12, 10], [2, 11], [3, 11], [4, 11], [11, 11], [12, 11], [13, 11],
];
function estrella(relleno) {
  const l = lienzo();
  const dentro = new Set(ESTRELLA.map(([x, y]) => `${x},${y}`));
  puntos(l, ESTRELLA, relleno);
  for (const [x, y] of ESTRELLA) { // el contorno: los vecinos que no son de la estrella
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < TAM && ny < TAM && !dentro.has(`${nx},${ny}`)) l[ny][nx] = 'k';
    }
  }
  return cuadricula(l);
}

export const ICONOS_DE_INTERFAZ = {
  // Pestañas de la barra inferior
  'pestana:espacios': dibujar((l) => {
    rect(l, 7, 1, 8, 1, 'k'); rect(l, 5, 2, 10, 2, 'k'); rect(l, 3, 3, 12, 3, 'k'); rect(l, 1, 4, 14, 4, 'k');
    rect(l, 6, 2, 9, 2, 'q'); rect(l, 4, 3, 11, 3, 'q'); rect(l, 2, 4, 13, 4, 'q');
    rect(l, 1, 5, 14, 5, 'k'); rect(l, 2, 5, 13, 5, 'q');
    caja(l, 2, 6, 13, 14, 'z');
    caja(l, 6, 9, 9, 14, 'd'); puntos(l, [[8, 12]], 'r');
    caja(l, 3, 8, 5, 10, 'h'); caja(l, 10, 8, 12, 10, 'h');
  }),
  'pestana:familia': dibujar((l) => {
    caja(l, 2, 2, 6, 6, 'e'); rect(l, 2, 2, 6, 3, 'd'); caja(l, 1, 7, 7, 14, 'g'); // el adulto
    caja(l, 9, 6, 13, 10, 'e'); rect(l, 9, 6, 13, 7, 'm'); caja(l, 8, 11, 14, 14, 'n'); // el niño
  }),
  'pestana:actividades': dibujar((l) => {
    caja(l, 2, 2, 13, 15, 'j'); caja(l, 5, 0, 10, 3, 's');
    for (const y of [6, 9, 12]) { rect(l, 4, y, 5, y, 'o'); rect(l, 7, y, 11, y, 'l'); }
    puntos(l, [[3, 7], [4, 7]], 'k');
  }),
  'pestana:intercambios': dibujar((l) => {
    rect(l, 2, 4, 11, 5, 'k'); rect(l, 3, 4, 11, 4, 'g'); rect(l, 3, 5, 10, 5, 'i');
    puntos(l, [[10, 2], [11, 3], [12, 4], [11, 5], [10, 6], [11, 2], [12, 3], [13, 4], [12, 5], [11, 6]], 'k'); puntos(l, [[11, 3], [12, 4], [11, 5]], 'g');
    rect(l, 4, 10, 13, 11, 'k'); rect(l, 4, 10, 12, 10, 'o'); rect(l, 5, 11, 12, 11, 'p');
    puntos(l, [[5, 8], [4, 9], [3, 10], [4, 11], [5, 12], [4, 8], [3, 9], [2, 10], [3, 11], [4, 12]], 'k'); puntos(l, [[4, 9], [3, 10], [4, 11]], 'p');
  }),
  // Actividades (las 9 claves de ICONOS de catalogo.js)
  'actividad:platos': dibujar((l) => {
    caja(l, 1, 8, 14, 13, 'j'); rect(l, 3, 10, 12, 11, 'l');
    caja(l, 2, 4, 13, 9, 'j'); rect(l, 3, 5, 12, 5, 'h');
    caja(l, 3, 1, 12, 5, 'j'); rect(l, 4, 2, 11, 2, 'h');
    rect(l, 4, 14, 11, 14, 'k');
  }),
  'actividad:barrer': dibujar((l) => {
    for (let i = 0; i < 9; i++) { l[1 + i][10 - i] = 'k'; l[1 + i][11 - i] = 'd'; }
    caja(l, 1, 10, 8, 14, 'r'); rect(l, 2, 12, 7, 12, 'd'); puntos(l, [[3, 14], [5, 14], [7, 14]], 'k');
    rect(l, 2, 11, 7, 11, 'A');
  }),
  'actividad:ropa': dibujar((l) => {
    caja(l, 1, 8, 14, 14, 'd'); rect(l, 2, 10, 13, 10, 'e'); rect(l, 2, 12, 13, 12, 'e');
    caja(l, 3, 2, 12, 9, 'h'); rect(l, 6, 2, 9, 3, 'k'); rect(l, 4, 5, 11, 5, 'g'); puntos(l, [[7, 6], [8, 6]], 'j');
  }),
  'actividad:basura': dibujar((l) => {
    rect(l, 3, 2, 12, 3, 'k'); rect(l, 6, 1, 9, 1, 'k'); rect(l, 4, 2, 11, 2, 's');
    caja(l, 3, 4, 12, 15, 'v');
    for (const x of [6, 8, 10]) rect(l, x, 6, x, 13, 's');
  }),
  'actividad:limpiar': dibujar((l) => {
    caja(l, 2, 7, 13, 14, 'r'); rect(l, 3, 8, 12, 9, 'j'); rect(l, 3, 10, 12, 13, 'r');
    puntos(l, [[4, 11], [7, 12], [10, 11], [9, 13]], 'k');
    puntos(l, [[4, 3], [11, 2], [8, 4]], 'h');
    puntos(l, [[3, 4], [5, 4], [4, 2], [10, 2], [12, 2], [11, 1], [11, 3], [8, 3], [8, 5], [7, 4], [9, 4]], 'j');
  }),
  'actividad:compras': dibujar((l) => {
    rect(l, 0, 1, 3, 1, 'k'); puntos(l, [[3, 2], [4, 3]], 'k');
    caja(l, 4, 3, 14, 9, 'g'); rect(l, 5, 4, 13, 4, 'h'); rect(l, 6, 6, 12, 6, 'h');
    rect(l, 5, 10, 13, 10, 'k');
    caja(l, 5, 12, 7, 14, 's'); caja(l, 11, 12, 13, 14, 's');
  }),
  'actividad:plantas': dibujar((l) => {
    caja(l, 4, 10, 11, 15, 'd'); rect(l, 5, 11, 10, 11, 'e'); rect(l, 3, 9, 12, 9, 'k'); rect(l, 4, 9, 11, 9, 'd');
    puntos(l, [[8, 8], [8, 7], [8, 6]], 'o');
    caja(l, 3, 2, 7, 6, 'p'); caja(l, 9, 3, 13, 7, 'o'); rect(l, 4, 3, 5, 3, 'p'); rect(l, 10, 4, 11, 4, 'p');
  }),
  'actividad:mascota': dibujar((l) => {
    caja(l, 5, 8, 10, 13, 'd'); rect(l, 6, 9, 9, 11, 'e');
    caja(l, 1, 5, 3, 8, 'd'); caja(l, 4, 2, 6, 5, 'd'); caja(l, 9, 2, 11, 5, 'd'); caja(l, 12, 5, 14, 8, 'd');
    puntos(l, [[2, 6], [5, 3], [10, 3], [13, 6]], 'e');
  }),
  'actividad:otra': dibujar((l) => {
    caja(l, 4, 1, 11, 7, 'q'); rect(l, 5, 2, 6, 3, 'n');
    rect(l, 7, 8, 8, 14, 'k'); puntos(l, [[7, 8], [7, 9], [7, 10], [7, 11], [7, 12], [7, 13]], 's');
  }),
  // Estados de limpieza (insignia junto al nombre de cada espacio)
  'estado:limpio': dibujar((l) => {
    caja(l, 2, 2, 13, 13, 'o');
    puntos(l, [[5, 8], [6, 9], [7, 10], [8, 9], [9, 8], [10, 7], [11, 6], [5, 9], [6, 10], [7, 11], [8, 10], [9, 9], [10, 8], [11, 7]], 'j');
  }),
  'estado:desordenado': dibujar((l) => { caja(l, 2, 2, 13, 13, 'r'); rect(l, 7, 4, 8, 9, 'k'); rect(l, 7, 11, 8, 11, 'k'); }),
  'estado:desastre': dibujar((l) => {
    caja(l, 2, 2, 13, 13, 'q');
    rect(l, 5, 4, 6, 9, 'j'); rect(l, 5, 11, 6, 11, 'j'); rect(l, 9, 4, 10, 9, 'j'); rect(l, 9, 11, 10, 11, 'j');
  }),
  // Estrellas del historial, fecha de la ficha y flechas de la cruceta
  'estrella:llena': estrella('r'),
  'estrella:vacia': estrella('l'),
  fecha: dibujar((l) => {
    caja(l, 1, 3, 14, 14, 'j'); rect(l, 2, 4, 13, 6, 'q');
    rect(l, 4, 1, 4, 4, 'k'); rect(l, 11, 1, 11, 4, 'k');
    for (const y of [8, 11]) for (const x of [3, 6, 9, 12]) rect(l, x, y, x + 1, y + 1, 's');
  }),
  'flecha:arriba': cuadricula(ARRIBA),
  'flecha:derecha': cuadricula(DERECHA),
  'flecha:abajo': cuadricula(ABAJO),
  'flecha:izquierda': cuadricula(IZQUIERDA),
};
export const CLAVES_DE_ICONOS = Object.keys(ICONOS_DE_INTERFAZ);

// FR-1: el icono de una actividad guardada; una clave desconocida cae en el genérico (AC-3.2).
export const claveDeIconoDeActividad = (icono) => (typeof icono === 'string' && Object.hasOwn(ICONOS_DE_INTERFAZ, `actividad:${icono}`) ? `actividad:${icono}` : 'actividad:otra');

// FR-4: el icono de la insignia de un estado de limpieza; un estado desconocido se ve como limpio.
export const claveDeIconoDeEstado = (limpieza) => (typeof limpieza === 'string' && Object.hasOwn(ICONOS_DE_INTERFAZ, `estado:${limpieza}`) ? `estado:${limpieza}` : 'estado:limpio');

// FR-3: el avatar de un personaje es su cuadro de frente en reposo (vista `frente`, cuadro 0). Un personaje desconocido cae en el neutro.
export const claveDeAvatarDePersonaje = (personaje) => {
  const clave = claveDeCuadro(personaje, 'frente', 0);
  return Object.hasOwn(CUADROS_DE_PERSONAJES, clave) ? clave : claveDeCuadro('neutro', 'frente', 0);
};
// El avatar de un miembro: el de su personaje, el mismo que se ve en el mapa (AC-5.1).
export const claveDeAvatar = (estado, miembro) => claveDeAvatarDePersonaje(personajeDe(estado, miembro));

// Los 14 cuadros de frente, para pintarlos en la interfaz por el mismo camino que los iconos.
export const AVATARES = Object.fromEntries(Object.keys(PERSONAJES).map((p) => {
  const clave = claveDeAvatarDePersonaje(p);
  return [clave, CUADROS_DE_PERSONAJES[clave]];
}));
