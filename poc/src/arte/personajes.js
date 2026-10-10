// src/arte/personajes.js
import { ASPECTOS, ESPECIES } from '../catalogo.js';
import { esPropietario } from '../hogar.js';
import { lienzo, rect, caja, cuadricula } from './lienzo.js';

// Personajes de los habitantes (FR-1 y FR-2 de la 009, ADR-009): 14 personajes de 16×16 con 9 cuadros: las vistas de frente, de espalda
// y de lado (mirando a la derecha; la izquierda es la de lado volteada en la presentación), cada una con el cuadro 0 (parado) y los
// cuadros 1 y 2 (paso con cada pie). Las personas se componen a partir de rasgos con nombre; cada mascota tiene su propia función.
export const VISTAS = ['frente', 'espalda', 'lado'];
export const CUADROS = [0, 1, 2];
const PIEL = 'f';

// Rasgos de las personas (FR-2): colores de pelo, camisa, cuello (detalle de la camisa) y pantalón, y las piezas que las distinguen.
const RASGOS = {
  protagonista: { pelo: 'a', camisa: 'm', cuello: 'n', pantalon: 'a', gorra: 'm', visera: 'n' },
  adulto: { pelo: 'd', camisa: 'g', cuello: 'h', pantalon: 'i' },
  adulta: { pelo: 'd', camisa: 'r', cuello: 'j', pantalon: 'a', largo: true },
  neutro: { pelo: 'a', camisa: 'x', cuello: 'w', pantalon: 'a' },
  nino: { pelo: 'd', camisa: 'g', cuello: 'h', pantalon: 'i', nino: true },
  nina: { pelo: 'd', camisa: 'r', cuello: 'j', pantalon: 'a', nino: true, coletas: true },
  anciano: { pelo: 'l', camisa: 'i', cuello: 'g', pantalon: 'a', baston: true },
  anciana: { pelo: 'l', camisa: 'e', cuello: 'f', pantalon: 'a', mono: true },
};

// Persona de frente o de espalda. Adultos: cabeza de 10×8 desde la fila 1, cuerpo de 4 filas y piernas de 3; niños: cabeza de 8×7
// desde la fila 4, cuerpo de 3 filas y piernas de 2 (AC-2.1). En los pasos, una pierna se acorta una fila: el pie levantado.
function persona(r, vista, cuadro) {
  const l = lienzo();
  const n = Boolean(r.nino);
  const hy = n ? 4 : 1; // fila de arriba de la cabeza
  const hh = n ? 7 : 8; // alto de la cabeza
  const by = hy + hh; // fila de arriba del cuerpo
  const bh = n ? 3 : 4; // alto del cuerpo
  const py = by + bh; // fila de arriba de las piernas
  if (vista === 'lado') return personaDeLado(l, r, cuadro, { n, hy, hh, by, bh, py });
  const [x0, x1] = n ? [4, 11] : [3, 12]; // columnas de la cabeza
  if (r.mono) rect(l, 6, hy - 1, 9, hy - 1, r.pelo);
  caja(l, x0, hy, x1, hy + hh - 1, PIEL);
  if (vista === 'espalda') rect(l, x0 + 1, hy + 1, x1 - 1, hy + hh - 2, r.pelo);
  else {
    rect(l, x0 + 1, hy + 1, x1 - 1, hy + 2, r.pelo);
    rect(l, x0 + 1, hy + 3, x0 + 1, hy + 4, r.pelo);
    rect(l, x1 - 1, hy + 3, x1 - 1, hy + 4, r.pelo);
    l[hy + 4][6] = 'k';
    l[hy + 4][9] = 'k';
  }
  if (r.largo) { rect(l, x0, hy + 3, x0, hy + hh, r.pelo); rect(l, x1, hy + 3, x1, hy + hh, r.pelo); }
  if (r.coletas) { rect(l, 2, hy + 2, 3, hy + 4, r.pelo); rect(l, 12, hy + 2, 13, hy + 4, r.pelo); }
  if (r.gorra) {
    caja(l, x0, hy, x1, hy + 2, r.gorra);
    if (vista === 'frente') rect(l, x0 + 1, hy + 3, x1 - 1, hy + 3, r.visera);
  }
  caja(l, n ? 5 : 3, by, n ? 10 : 12, by + bh - 1, r.camisa);
  if (vista === 'frente') rect(l, n ? 7 : 6, by + 1, n ? 8 : 9, by + 1, r.cuello);
  if (n) { l[by + 2][5] = PIEL; l[by + 2][10] = PIEL; } else { l[by + 3][3] = PIEL; l[by + 3][12] = PIEL; }
  const [i0, i1, d0, d1] = n ? [6, 7, 8, 9] : [5, 7, 8, 10]; // columnas de las piernas izquierda y derecha
  caja(l, i0, py, i1, cuadro === 1 ? 14 : 15, r.pantalon);
  caja(l, d0, py, d1, cuadro === 2 ? 14 : 15, r.pantalon);
  if (r.baston) rect(l, 13, by + 2, 13, 15, 'k');
  return l;
}

// Persona de lado, mirando a la derecha: el pelo cae hacia atrás y, en los pasos, las piernas se separan (la de atrás y la de adelante).
function personaDeLado(l, r, cuadro, { n, hy, hh, by, bh, py }) {
  const [x0, x1] = n ? [5, 11] : [4, 12]; // columnas de la cabeza
  if (r.mono) rect(l, x0 + 1, hy - 1, x0 + 3, hy - 1, r.pelo);
  if (r.coletas) rect(l, x0 - 2, hy + 2, x0 - 1, hy + 4, r.pelo);
  caja(l, x0, hy, x1, hy + hh - 1, PIEL);
  rect(l, x0 + 1, hy + 1, x1 - 1, hy + 2, r.pelo);
  rect(l, x0 + 1, hy + 3, x0 + 3, hy + 5, r.pelo);
  if (r.largo) rect(l, x0, hy + 3, x0 + 1, hy + hh, r.pelo);
  if (r.gorra) { caja(l, x0, hy, x1, hy + 2, r.gorra); rect(l, x1 - 2, hy + 3, x1 + 1, hy + 3, r.visera); }
  l[hy + 4][x1 - 2] = 'k';
  const [c0, c1] = n ? [6, 10] : [5, 11]; // columnas del cuerpo
  caja(l, c0, by, c1, by + bh - 1, r.camisa);
  rect(l, c0 + 2, by + 1, c1 - 2, by + bh - 2, r.cuello);
  if (cuadro === 0) caja(l, c0 + 1, py, c1 - 1, 15, r.pantalon);
  else {
    caja(l, c0, py, c0 + 2, cuadro === 2 ? 14 : 15, r.pantalon); // pierna de atrás
    caja(l, c1 - 2, py, c1, cuadro === 1 ? 14 : 15, r.pantalon); // pierna de adelante
  }
  if (r.baston) rect(l, x1 + 1, by + 2, x1 + 1, 15, 'k');
  return l;
}

// Patas o pies de una mascota, de `y0` a `y1`, a partir de cada columna de `xs`; en un paso se levantan las de un lado (una fila menos).
function patas(l, xs, y0, y1, cuadro, color = 'k', ancho = 2) {
  xs.forEach((x, i) => {
    const levantada = (cuadro === 1 && i % 2 === 0) || (cuadro === 2 && i % 2 === 1);
    rect(l, x, y0, x + ancho - 1, levantada ? y1 - 1 : y1, color);
  });
}

// Mascotas (FR-2): una función por especie, con su silueta de lado y sus vistas de frente y de espalda.
function perro(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    patas(l, [3, 6, 9, 11], 12, 14, cuadro);
    caja(l, 1, 4, 2, 6, 'd'); // cola
    caja(l, 2, 6, 11, 11, 'd'); rect(l, 4, 8, 9, 10, 'e'); // cuerpo y panza
    caja(l, 10, 3, 14, 8, 'd'); caja(l, 9, 3, 11, 6, 'a'); // cabeza y oreja
    l[5][12] = 'k'; caja(l, 13, 6, 14, 8, 'e'); l[6][14] = 'k'; // ojo, hocico y nariz
    return l;
  }
  patas(l, [5, 9], 13, 15, cuadro);
  caja(l, 4, 10, 11, 13, 'd');
  if (vista === 'frente') rect(l, 6, 11, 9, 12, 'e'); else rect(l, 7, 9, 8, 12, 'a'); // pecho o cola
  caja(l, 2, 2, 4, 7, 'a'); caja(l, 11, 2, 13, 7, 'a'); // orejas
  caja(l, 4, 2, 11, 9, 'd');
  if (vista === 'frente') { l[5][6] = 'k'; l[5][9] = 'k'; caja(l, 6, 6, 9, 9, 'e'); rect(l, 7, 7, 8, 7, 'k'); }
  return l;
}

function gato(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 1, 3, 2, 9, 's'); // cola
    patas(l, [4, 7, 10], 12, 14, cuadro);
    caja(l, 3, 7, 11, 11, 's'); rect(l, 5, 8, 5, 9, 'b'); rect(l, 8, 8, 8, 9, 'b'); // cuerpo con rayas
    caja(l, 10, 3, 14, 8, 's'); l[2][10] = 'k'; l[2][14] = 'k'; // cabeza y orejas
    l[5][11] = 'o'; l[5][13] = 'o'; l[7][12] = 'n';
    return l;
  }
  if (vista === 'espalda') rect(l, 12, 6, 13, 12, 'b'); // cola
  patas(l, [5, 9], 13, 15, cuadro);
  caja(l, 4, 9, 11, 13, 's'); rect(l, 6, 10, 6, 11, 'b'); rect(l, 9, 10, 9, 11, 'b');
  caja(l, 3, 1, 5, 3, 's'); caja(l, 10, 1, 12, 3, 's'); // orejas
  caja(l, 3, 3, 12, 9, 's');
  if (vista === 'frente') { l[6][5] = 'o'; l[6][10] = 'o'; rect(l, 7, 7, 8, 7, 'n'); }
  else { rect(l, 6, 4, 6, 7, 'b'); rect(l, 9, 4, 9, 7, 'b'); }
  return l;
}

function conejo(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 9, 0, 10, 5, 'y'); caja(l, 11, 1, 12, 5, 'y'); rect(l, 10, 1, 10, 4, 'n'); // orejas
    patas(l, [4, 9], 14, 15, cuadro, 'k', 3);
    caja(l, 3, 8, 11, 13, 'y'); caja(l, 1, 9, 2, 11, 'j'); // cuerpo y cola
    caja(l, 9, 5, 13, 10, 'y'); l[7][12] = 'k'; l[8][13] = 'n';
    return l;
  }
  caja(l, 4, 0, 6, 5, 'y'); caja(l, 9, 0, 11, 5, 'y'); rect(l, 5, 1, 5, 4, 'n'); rect(l, 10, 1, 10, 4, 'n');
  patas(l, [4, 9], 14, 15, cuadro, 'k', 3);
  caja(l, 4, 10, 11, 13, 'y');
  caja(l, 3, 4, 12, 10, 'y');
  if (vista === 'frente') { l[7][6] = 'k'; l[7][9] = 'k'; rect(l, 7, 8, 8, 8, 'n'); } else rect(l, 6, 11, 9, 12, 'j');
  return l;
}

function hamster(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 3, 7, 12, 13, 'e'); rect(l, 5, 8, 8, 8, 'd'); caja(l, 9, 5, 10, 6, 'd'); // cuerpo, raya y oreja
    rect(l, 9, 9, 11, 12, 'f'); l[9][11] = 'k'; l[10][12] = 'n';
    patas(l, [4, 10], 14, 15, cuadro, 'n');
    return l;
  }
  caja(l, 4, 5, 5, 6, 'd'); caja(l, 10, 5, 11, 6, 'd'); // orejas
  caja(l, 4, 7, 11, 13, 'e');
  if (vista === 'frente') { rect(l, 6, 9, 9, 12, 'f'); l[9][6] = 'k'; l[9][9] = 'k'; rect(l, 7, 11, 8, 11, 'n'); }
  else rect(l, 7, 8, 8, 12, 'd'); // raya del lomo
  patas(l, [5, 9], 14, 15, cuadro, 'n');
  return l;
}

function loro(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    rect(l, 6, 13, 7, 15, 'i'); // cola
    patas(l, [8, 10], 13, 14, cuadro, 'r', 1);
    caja(l, 5, 6, 10, 12, 'o'); caja(l, 5, 7, 8, 11, 'g'); // cuerpo y ala
    caja(l, 6, 1, 11, 6, 'o'); rect(l, 8, 0, 9, 1, 'q'); // cabeza y cresta
    l[3][8] = 'j'; l[3][9] = 'k'; rect(l, 12, 3, 13, 4, 'r'); l[5][12] = 'k'; // ojo y pico
    return l;
  }
  if (vista === 'espalda') rect(l, 7, 13, 8, 15, 'i'); // cola
  patas(l, [6, 9], 14, 15, cuadro, 'r', 1);
  caja(l, 4, 7, 11, 13, 'o'); caja(l, 3, 8, 5, 12, 'g'); caja(l, 10, 8, 12, 12, 'g'); // cuerpo y alas
  caja(l, 4, 1, 11, 7, 'o'); rect(l, 7, 0, 8, 1, 'q');
  if (vista === 'frente') { l[4][6] = 'k'; l[4][9] = 'k'; rect(l, 7, 5, 8, 6, 'r'); }
  return l;
}

function otro(vista, cuadro) {
  const l = lienzo();
  if (vista === 'lado') {
    caja(l, 8, 3, 9, 5, 'p'); // oreja
    caja(l, 3, 6, 12, 13, 'p');
    rect(l, 10, 8, 11, 9, 'j'); l[9][11] = 'k'; l[11][11] = 'k'; // ojo y boca
    patas(l, [4, 9], 14, 15, cuadro, 'o', 3);
    return l;
  }
  caja(l, 4, 3, 5, 5, 'p'); caja(l, 10, 3, 11, 5, 'p'); // orejas
  caja(l, 3, 6, 12, 13, 'p');
  if (vista === 'frente') {
    rect(l, 5, 8, 6, 9, 'j'); l[9][6] = 'k'; rect(l, 9, 8, 10, 9, 'j'); l[9][10] = 'k'; rect(l, 7, 11, 8, 11, 'k');
  } else rect(l, 7, 12, 8, 12, 'o'); // colita
  patas(l, [4, 9], 14, 15, cuadro, 'o', 3);
  return l;
}

const MASCOTAS = { perro, gato, conejo, hamster, loro, otro };
const dibujo = (clave, vista, cuadro) => (RASGOS[clave] ? persona(RASGOS[clave], vista, cuadro) : MASCOTAS[clave](vista, cuadro));

export const PERSONAJES = Object.fromEntries([...Object.keys(RASGOS), ...Object.keys(MASCOTAS)].map((clave) => [clave,
  Object.fromEntries(VISTAS.map((vista) => [vista, CUADROS.map((cuadro) => cuadricula(dibujo(clave, vista, cuadro)))]))]));

export const claveDeCuadro = (personaje, vista, cuadro) => `personaje:${personaje}:${vista}:${cuadro}`;

// Los 126 cuadros por clave de textura, para la hoja de dibujos que prepara la presentación.
export const CUADROS_DE_PERSONAJES = Object.fromEntries(Object.entries(PERSONAJES).flatMap(([personaje, vistas]) =>
  Object.entries(vistas).flatMap(([vista, cuadros]) => cuadros.map((g, cuadro) => [claveDeCuadro(personaje, vista, cuadro), g]))));

// FR-3: el personaje de un miembro. El propietario es el protagonista; una persona usa su aspecto y una mascota su especie. Si el dato no
// está en las listas, el de respaldo de su clase (Error Scenarios de la 009). Pura: no depende del nombre, del id ni de la posición.
export function personajeDe(estado, miembro) {
  if (esPropietario(estado, miembro)) return 'protagonista';
  if (miembro.tipo === 'mascota') return Object.hasOwn(ESPECIES, miembro.especie) ? miembro.especie : 'otro';
  return Object.hasOwn(ASPECTOS, miembro.aspecto) ? miembro.aspecto : 'neutro';
}
