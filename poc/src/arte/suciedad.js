// src/arte/suciedad.js
import { lienzo, rect, caja, cuadricula } from './lienzo.js';

// Arte del desorden (FR-1 y FR-5 de la 010, ADR-008): objetos del suelo por grupo de arte, manchas, telarañas, moscas y las sobreposiciones de
// los muebles desordenados o sucios. Cuadrículas de 16×16 con claves de la paleta; '.' es transparente. Datos puros: sin Phaser ni DOM, y sin
// importar el dominio ni el generador.
const una = (dibujar) => { const l = lienzo(); dibujar(l); return cuadricula(l); };
const px = (l, puntos, c) => { for (const [x, y] of puntos) if (l[y]?.[x] !== undefined) l[y][x] = c; };
const sinEsquinas = (l, x0, y0, x1, y1) => px(l, [[x0, y0], [x1, y0], [x0, y1], [x1, y1]], '.');
const espejo = (g) => g.map((fila) => [...fila].reverse().join(''));
const ruido = (x, y) => (x * 7 + y * 13 + x * y * 3) % 11; // determinista: el mismo píxel da siempre el mismo valor

// Línea de un píxel de ancho entre dos puntos.
function linea(l, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) px(l, [[Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n)]], c);
}

// Mancha irregular: relleno `c`, borde punteado `borde` y brillos `hi`; `semilla` la desplaza un píxel y cambia su ruido.
function mancha(semilla, rx, ry, c, hi, borde = c) {
  return una((l) => {
    const cx = 7.5 + ((semilla * 3) % 3) - 1;
    const cy = 7.5 + ((semilla * 5) % 3) - 1;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const r = dx * dx + dy * dy + 0.4 * (ruido(x + semilla, y + semilla * 2) / 11 - 0.5);
        if (r < 0.7) l[y][x] = r < 0.45 && ruido(x + semilla * 3, y) % 6 === 0 ? hi : c;
        else if (r < 1 && (x + y) % 2 === 0) l[y][x] = borde;
      }
    }
  });
}

// ---------- Grupos de arte (FR-1) ----------
export const GRUPOS = ['dormitorio', 'cocina', 'sala', 'lavanderia', 'bano', 'mascota', 'oficina'];
// La sala y el comedor comparten grupo; el baño común y los internos, también.
export const GRUPO_DE_TIPO = {
  sala: 'sala', comedor: 'sala', cocina: 'cocina', bano: 'bano', lavanderia: 'lavanderia', mascota: 'mascota', dormitorio: 'dormitorio', oficina: 'oficina',
};
export const NOMBRES_DE_OBJETOS = {
  dormitorio: ['camiseta', 'pantalon', 'calcetin', 'zapato', 'libro', 'peluche'],
  cocina: ['olla', 'plato-sucio', 'platano', 'manzana', 'envoltura', 'pizza'],
  sala: ['control', 'cojin', 'revista', 'vaso', 'snacks', 'calcetin'],
  lavanderia: ['ropa-sucia', 'escoba', 'recogedor', 'detergente', 'calcetin', 'balde'],
  bano: ['toalla', 'papel-higienico', 'camiseta', 'patito', 'jabon', 'cepillo'],
  mascota: ['hueso', 'comida', 'plato-volcado', 'pelota', 'pelos', 'pluma'],
  oficina: ['papel', 'taza', 'hoja', 'lapicero', 'cuaderno', 'carpeta'],
};
export const TIPOS_CON_AGUA = ['cocina', 'bano'];
export const TIPOS_CON_MOSCAS = ['cocina', 'bano', 'mascota'];
export const MANCHAS_DE_AGUA = 2; // las primeras manchas de un espacio con agua

// ---------- Objetos sueltos del piso ----------
const DIBUJOS = {
  camiseta: una((l) => { caja(l, 2, 5, 13, 8, 'g'); caja(l, 4, 5, 11, 13, 'g'); px(l, [[7, 5], [8, 5]], 'k'); px(l, [[5, 7], [6, 8], [10, 9]], 'h'); }),
  pantalon: una((l) => { caja(l, 4, 3, 11, 6, 'i'); caja(l, 4, 6, 7, 13, 'i'); caja(l, 8, 6, 11, 13, 'i'); px(l, [[5, 4], [6, 4], [5, 9]], 'g'); }),
  calcetin: una((l) => { caja(l, 5, 3, 8, 9, 'm'); caja(l, 5, 8, 12, 12, 'm'); px(l, [[6, 4], [7, 4], [6, 10], [7, 10], [8, 10]], 'n'); }),
  zapato: una((l) => { caja(l, 2, 8, 13, 12, 'd'); caja(l, 3, 5, 7, 8, 'd'); rect(l, 3, 12, 12, 12, 'k'); px(l, [[5, 6], [6, 7], [9, 10]], 'e'); px(l, [[4, 6]], 'j'); }),
  libro: una((l) => { caja(l, 3, 4, 12, 12, 'q'); rect(l, 4, 5, 4, 11, 'k'); rect(l, 6, 6, 10, 6, 'r'); rect(l, 6, 8, 9, 8, 'r'); }),
  peluche: una((l) => { caja(l, 5, 6, 10, 12, 'A'); caja(l, 4, 3, 6, 6, 'A'); caja(l, 9, 3, 11, 6, 'A'); px(l, [[6, 8], [9, 8]], 'k'); px(l, [[7, 10], [8, 10]], 'm'); }),
  olla: una((l) => { caja(l, 3, 5, 12, 12, 's'); rect(l, 1, 7, 2, 8, 'k'); rect(l, 13, 7, 14, 8, 'k'); rect(l, 4, 6, 11, 7, 'a'); px(l, [[5, 9], [6, 9], [9, 10]], 'v'); }),
  'plato-sucio': una((l) => { caja(l, 3, 6, 12, 12, 'j'); sinEsquinas(l, 3, 6, 12, 12); rect(l, 5, 8, 10, 9, 'd'); px(l, [[6, 8], [9, 9], [8, 10]], 'q'); }),
  platano: una((l) => { caja(l, 2, 8, 13, 11, 'r'); sinEsquinas(l, 2, 8, 13, 11); caja(l, 4, 5, 9, 8, 'r'); px(l, [[6, 9], [9, 9], [11, 10]], 'd'); px(l, [[3, 9]], 'k'); }),
  manzana: una((l) => {
    caja(l, 4, 5, 11, 12, 'q'); sinEsquinas(l, 4, 5, 11, 12); rect(l, 9, 5, 11, 8, '.'); rect(l, 9, 7, 10, 9, 'j');
    px(l, [[8, 8]], 'k'); px(l, [[7, 3], [7, 4]], 'd'); px(l, [[8, 3]], 'o'); px(l, [[5, 7]], 'n');
  }),
  envoltura: una((l) => { caja(l, 3, 6, 12, 11, 'r'); px(l, [[2, 7], [2, 9], [13, 8], [13, 10]], 'r'); rect(l, 5, 7, 10, 8, 'q'); px(l, [[6, 10], [8, 10], [9, 10]], 'j'); }),
  pizza: una((l) => { caja(l, 2, 4, 13, 12, 'z'); rect(l, 3, 5, 12, 5, 'A'); px(l, [[5, 8], [8, 7], [10, 9], [6, 10]], 'q'); px(l, [[7, 8], [9, 8], [7, 10]], 'r'); }),
  control: una((l) => { caja(l, 5, 2, 10, 13, 'a'); px(l, [[6, 4]], 'q'); px(l, [[8, 4]], 'o'); px(l, [[6, 6], [7, 6], [8, 6], [9, 6]], 'b'); px(l, [[6, 8], [8, 8], [6, 10], [8, 10]], 'b'); }),
  cojin: una((l) => { caja(l, 3, 4, 12, 12, 'n'); sinEsquinas(l, 3, 4, 12, 12); px(l, [[7, 7], [8, 8], [7, 8], [8, 7]], 'm'); }),
  revista: una((l) => { caja(l, 3, 3, 12, 12, 'h'); rect(l, 5, 5, 10, 6, 'j'); rect(l, 5, 8, 10, 8, 'j'); rect(l, 5, 10, 8, 10, 'g'); }),
  vaso: una((l) => { caja(l, 5, 4, 10, 12, 'u'); rect(l, 6, 8, 9, 11, 'r'); px(l, [[6, 5]], 'j'); }),
  snacks: una((l) => { caja(l, 4, 7, 11, 12, 'j'); sinEsquinas(l, 4, 7, 11, 12); rect(l, 5, 5, 10, 6, 'r'); px(l, [[6, 4], [8, 4], [9, 5], [5, 6]], 'A'); }),
  'ropa-sucia': una((l) => { caja(l, 3, 5, 12, 12, 'e'); sinEsquinas(l, 3, 5, 12, 12); rect(l, 4, 6, 7, 8, 'h'); rect(l, 8, 8, 11, 11, 'n'); px(l, [[9, 6], [5, 10], [7, 11]], 'd'); }),
  escoba: una((l) => { linea(l, 11, 1, 5, 11, 'd'); linea(l, 12, 1, 6, 11, 'd'); caja(l, 2, 11, 8, 14, 'r'); px(l, [[3, 13], [5, 13], [7, 13]], 'd'); }),
  recogedor: una((l) => { caja(l, 2, 8, 11, 12, 's'); rect(l, 11, 5, 12, 10, 'a'); rect(l, 3, 9, 9, 10, 'v'); px(l, [[5, 9], [7, 9]], 'A'); }),
  detergente: una((l) => { caja(l, 5, 4, 10, 13, 'g'); rect(l, 6, 2, 9, 3, 'q'); rect(l, 6, 7, 9, 10, 'j'); px(l, [[7, 8], [8, 9]], 'g'); }),
  balde: una((l) => { caja(l, 4, 6, 11, 13, 's'); rect(l, 5, 7, 10, 8, 'h'); rect(l, 3, 3, 3, 6, 'k'); rect(l, 12, 3, 12, 6, 'k'); rect(l, 3, 3, 12, 3, 'k'); }),
  toalla: una((l) => { caja(l, 3, 4, 12, 12, 'h'); rect(l, 4, 7, 11, 7, 'j'); rect(l, 4, 9, 11, 9, 'j'); px(l, [[3, 12], [5, 12], [7, 12], [9, 12], [11, 12]], 'g'); }),
  'papel-higienico': una((l) => { caja(l, 4, 3, 10, 8, 'j'); px(l, [[7, 5], [7, 6]], 'l'); caja(l, 6, 9, 9, 14, 'j'); px(l, [[7, 11], [8, 12]], 'l'); }),
  patito: una((l) => { caja(l, 5, 7, 11, 12, 'r'); caja(l, 4, 3, 8, 7, 'r'); px(l, [[3, 5], [3, 4]], 'q'); px(l, [[6, 4]], 'k'); px(l, [[10, 9]], 'd'); }),
  jabon: una((l) => { caja(l, 4, 7, 11, 11, 'n'); sinEsquinas(l, 4, 7, 11, 11); px(l, [[6, 8], [7, 8]], 'y'); px(l, [[12, 6], [13, 5], [13, 7]], 'j'); }),
  cepillo: una((l) => { linea(l, 3, 12, 11, 6, 'g'); linea(l, 4, 12, 12, 6, 'g'); rect(l, 11, 3, 13, 5, 'j'); px(l, [[11, 3], [12, 3], [13, 3]], 'h'); }),
  hueso: una((l) => { caja(l, 3, 6, 12, 9, 'j'); caja(l, 2, 4, 4, 7, 'j'); caja(l, 2, 8, 4, 11, 'j'); caja(l, 11, 4, 13, 7, 'j'); caja(l, 11, 8, 13, 11, 'j'); }),
  comida: una((l) => { px(l, [[3, 4], [6, 3], [10, 5], [12, 8], [5, 8], [8, 7], [4, 11], [9, 12], [12, 12], [7, 10]], 'd'); px(l, [[4, 4], [7, 3], [11, 5], [6, 8], [10, 12]], 'e'); }),
  'plato-volcado': una((l) => { caja(l, 3, 7, 12, 12, 'r'); sinEsquinas(l, 3, 7, 12, 12); rect(l, 4, 8, 11, 8, 'q'); px(l, [[13, 10], [14, 9], [14, 11], [15, 10]], 'd'); }),
  pelota: una((l) => { caja(l, 5, 5, 10, 10, 'o'); sinEsquinas(l, 5, 5, 10, 10); px(l, [[6, 6], [7, 6]], 'p'); px(l, [[9, 9]], 'k'); }),
  pelos: una((l) => { linea(l, 3, 10, 8, 6, 'd'); linea(l, 5, 12, 11, 8, 'A'); linea(l, 7, 5, 11, 4, 'r'); linea(l, 6, 9, 12, 12, 'd'); }),
  pluma: una((l) => { linea(l, 4, 12, 12, 3, 'o'); linea(l, 5, 12, 13, 3, 'p'); px(l, [[3, 13]], 'k'); }),
  papel: una((l) => { caja(l, 4, 5, 10, 10, 'j'); sinEsquinas(l, 4, 5, 10, 10); px(l, [[6, 7], [7, 7], [8, 8], [6, 9]], 'l'); }),
  taza: una((l) => { caja(l, 4, 5, 10, 11, 'j'); caja(l, 10, 7, 13, 9, 'j'); rect(l, 5, 6, 9, 7, 'd'); }),
  hoja: una((l) => { caja(l, 3, 3, 12, 13, 'j'); rect(l, 5, 5, 10, 5, 'l'); rect(l, 5, 7, 10, 7, 'l'); rect(l, 5, 9, 8, 9, 'l'); }),
  lapicero: una((l) => { linea(l, 3, 12, 12, 4, 'k'); linea(l, 3, 11, 12, 3, 'r'); linea(l, 4, 12, 13, 4, 'r'); px(l, [[2, 13], [3, 13]], 'k'); }),
  cuaderno: una((l) => { caja(l, 3, 3, 12, 13, 'x'); rect(l, 4, 3, 4, 13, 'k'); rect(l, 6, 5, 11, 5, 'w'); rect(l, 6, 7, 11, 7, 'w'); }),
  carpeta: una((l) => { caja(l, 3, 4, 12, 12, 'r'); rect(l, 3, 4, 7, 5, 'r'); rect(l, 5, 8, 10, 8, 'd'); }),
};
export const OBJETOS = Object.fromEntries(Object.entries(NOMBRES_DE_OBJETOS).flatMap(([grupo, nombres]) =>
  nombres.map((nombre, i) => [`objeto:${grupo}:${i}`, DIBUJOS[nombre]])));

// ---------- Manchas, telarañas y moscas ----------
export const MANCHAS = {
  'mancha:suciedad-grande': mancha(1, 7, 6, 'd', 'e'),
  'mancha:suciedad-pequena': mancha(2, 4.5, 3.8, 'd', 'e'),
  'mancha:agua': mancha(3, 6, 5, 'h', 'j', 'g'),
};
// Telaraña de la esquina superior izquierda; la de la derecha es su espejo.
const telaranaIzquierda = una((l) => {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const r = Math.round(Math.hypot(x, y));
      const radio = x === 0 || y === 0 || x === y || (y > 0 && x === 2 * y) || (x > 0 && y === 2 * x);
      if (r <= 13 && (radio || r === 5 || r === 9 || r === 13)) l[y][x] = 's';
    }
  }
});
export const TELARANAS = { 'telarana:izquierda': telaranaIzquierda, 'telarana:derecha': espejo(telaranaIzquierda) };
export const MOSCAS = ['moscas'];
const dibujoDeMoscas = una((l) => { px(l, [[4, 3], [11, 6], [7, 11], [12, 12]], 'k'); px(l, [[5, 3], [10, 6], [8, 11], [11, 12]], 'c'); });

// ---------- Muebles desordenados o sucios (FR-5): sobreposiciones transparentes sobre el mueble de la 008 ----------
const camaInicio = una((l) => { // colcha corrida, almohada torcida y la sábana que asoma
  rect(l, 3, 4, 12, 8, 'g'); rect(l, 6, 4, 12, 7, 'j'); rect(l, 6, 7, 12, 7, 'l');
  for (let y = 9; y <= 15; y++) rect(l, 3, y, 3 + (y - 9), y, 'j');
  px(l, [[5, 11], [9, 12], [11, 14], [8, 10]], 'i'); px(l, [[11, 10], [10, 11]], 'h');
});
const camaFin = una((l) => { // la sábana sigue en el pie y la colcha cuelga del costado
  for (let y = 0; y <= 6; y++) rect(l, 3, y, 3 + (6 - y), y, 'j');
  px(l, [[10, 3], [11, 4], [9, 8], [6, 9], [12, 9]], 'i'); px(l, [[8, 4]], 'h');
  rect(l, 12, 5, 13, 9, 'g'); px(l, [[13, 5], [13, 6], [13, 7], [13, 8], [13, 9]], 'k');
});
const cocinaGrasa = una((l) => {
  px(l, [[3, 3], [4, 4], [5, 5], [10, 4], [11, 6], [4, 9], [5, 10], [10, 9], [11, 11], [3, 12], [8, 12]], 'd');
  px(l, [[4, 3], [5, 4], [11, 5], [10, 10], [4, 11], [9, 12], [6, 2]], 'r');
  rect(l, 3, 7, 8, 7, 'd'); px(l, [[9, 7], [12, 7]], 'd');
});
const lavaderoPlatos = una((l) => { caja(l, 4, 5, 8, 8, 'j'); caja(l, 7, 6, 11, 9, 'j'); px(l, [[5, 6], [6, 7], [9, 7], [10, 8]], 'd'); px(l, [[8, 7]], 'q'); });
const lavaderoEspuma = una((l) => {
  caja(l, 4, 5, 8, 8, 'j'); caja(l, 7, 6, 11, 9, 'j'); px(l, [[5, 6], [9, 7]], 'd');
  for (const [x, y] of [[3, 4], [7, 3], [11, 4], [5, 10], [9, 10], [6, 6], [10, 7]]) {
    rect(l, x, y, x + 1, y + 1, 'j'); px(l, [[x, y]], 'h');
  }
  px(l, [[13, 9], [2, 8]], 'j'); px(l, [[3, 12], [4, 13], [12, 12], [13, 13]], 'h');
});
// Migas y derrames de las mesas: `dx` desplaza algunos puntos para que las partes de una mesa larga no se vean calcadas.
const mesaMigas = (dx) => una((l) => { px(l, [[3 + dx, 6], [8, 9], [12 - dx, 5], [6, 10]], 'A'); px(l, [[4, 8], [10, 7], [13 - dx, 10]], 'd'); });
const mesaDerrame = (dx) => una((l) => {
  px(l, [[3 + dx, 6], [8, 9], [12 - dx, 5], [6, 10]], 'A');
  rect(l, 3, 6, 11, 9, 'D'); rect(l, 2, 7, 12, 8, 'D'); rect(l, 5, 5, 9, 10, 'D');
  px(l, [[4, 7], [6, 8], [9, 6], [8, 9]], 'd'); px(l, [[10, 8], [11, 8]], 'q');
});
const lavamanosEspuma = una((l) => { px(l, [[7, 5], [8, 5], [6, 6], [9, 6]], 'j'); px(l, [[7, 6]], 'h'); px(l, [[5, 13]], 'h'); });
const lavamanosLleno = una((l) => { rect(l, 6, 5, 9, 8, 'j'); px(l, [[6, 5], [9, 7]], 'h'); px(l, [[4, 13], [5, 13], [11, 13]], 'h'); px(l, [[3, 2], [11, 2]], 'j'); });
const inodoroSucio = una((l) => { px(l, [[6, 7], [8, 8], [9, 10], [7, 12], [6, 11], [9, 3]], 'd'); px(l, [[7, 9], [8, 11]], 'A'); px(l, [[11, 13], [12, 13], [12, 14]], 'h'); });
const duchaMoho = una((l) => {
  px(l, [[3, 11], [4, 12], [5, 13], [5, 11], [10, 12], [11, 13], [12, 12], [12, 10], [3, 9], [4, 10], [11, 5]], 'o');
  px(l, [[4, 11], [11, 12], [4, 9]], 'p'); rect(l, 7, 11, 8, 13, 'j');
});
const camaRevuelta = una((l) => { rect(l, 4, 5, 10, 8, 'n'); rect(l, 5, 9, 12, 11, 'q'); px(l, [[3, 12], [4, 12], [2, 11]], 'q'); px(l, [[6, 6]], 'm'); });
const camaManchada = una((l) => {
  rect(l, 4, 5, 10, 8, 'n'); rect(l, 5, 9, 12, 11, 'q'); px(l, [[3, 12], [4, 12], [2, 11]], 'q'); px(l, [[6, 6]], 'm');
  px(l, [[8, 7], [10, 10]], 'd'); px(l, [[5, 5], [9, 6], [7, 9]], 'A');
});
const escritorioPapeles = (dx) => una((l) => { caja(l, 4 + dx, 4, 9 + dx, 8, 'j'); caja(l, 6 + dx, 6, 11 + dx, 9, 'j'); px(l, [[5 + dx, 5], [7 + dx, 7], [10 + dx, 8]], 'l'); });
const escritorioTaza = (dx) => una((l) => {
  caja(l, 3 + dx, 3, 8 + dx, 8, 'j'); caja(l, 6 + dx, 5, 11 + dx, 9, 'j'); caja(l, 9 + dx, 6, 13 + dx, 10, 'l'); px(l, [[4 + dx, 4], [7 + dx, 7]], 'l');
  rect(l, 4, 9, 9, 10, 'd'); px(l, [[3, 10], [10, 10]], 'd');
});

const SOBRE = {
  B: { desordenado: { inicio: camaInicio, fin: camaFin }, desastre: { inicio: camaInicio, fin: camaFin } },
  K: { desastre: { unico: cocinaGrasa } },
  L: { desordenado: { unico: lavaderoPlatos }, desastre: { unico: lavaderoEspuma } },
  M: {
    desordenado: { inicio: mesaMigas(0), medio: mesaMigas(1), fin: mesaMigas(2) },
    desastre: { inicio: mesaDerrame(0), medio: mesaDerrame(1), fin: mesaDerrame(2) },
  },
  T: { desordenado: { inicio: mesaMigas(0), fin: mesaMigas(2) }, desastre: { inicio: mesaDerrame(0), fin: mesaDerrame(2) } },
  w: { desordenado: { unico: lavamanosEspuma }, desastre: { unico: lavamanosLleno } },
  W: { desastre: { unico: inodoroSucio } },
  U: { desastre: { unico: duchaMoho } },
  P: { desordenado: { unico: camaRevuelta }, desastre: { unico: camaManchada } },
  E: { desordenado: { inicio: escritorioPapeles(0), fin: escritorioPapeles(1) }, desastre: { inicio: escritorioTaza(0), fin: escritorioTaza(1) } },
};
export const SOBREPOSICIONES = Object.fromEntries(Object.entries(SOBRE).flatMap(([letra, porEstado]) =>
  Object.entries(porEstado).flatMap(([estado, partes]) =>
    Object.entries(partes).map(([variante, g]) => [`sobre:${letra}:${variante}:${estado}`, g]))));

// Todos los dibujos nuevos por clave, para preparar la hoja de texturas.
export const SUCIEDAD = { ...OBJETOS, ...MANCHAS, ...TELARANAS, moscas: dibujoDeMoscas, ...SOBREPOSICIONES };
