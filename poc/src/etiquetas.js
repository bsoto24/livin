// src/etiquetas.js
import { espaciosActivos, nombreVisible } from './hogar.js';

const SIN_MEDIDA = () => ({ w: 0, h: 0 });

// Centro de una etiqueta de tamaño `tam` ajustado al tramo visible [inicio, fin] de un espacio.
function ajustarEje(centro, inicio, fin, tam) {
  if (fin - inicio <= tam) return (inicio + fin) / 2;
  return Math.min(Math.max(centro, inicio + tam / 2), fin - tam / 2);
}

// Etiqueta de nombre de cada espacio activo (FR-12), en coordenadas de mapa medidas en casillas.
// La del espacio que contiene al personaje se desplaza, si hace falta, hacia la parte visible de ese espacio.
export function etiquetasDeEspacios(estado, distribucion, jugador, vista, medir = SIN_MEDIDA) {
  const claveActual = jugador ? (distribucion.espacioEn[jugador.y]?.[jugador.x] ?? null) : null;
  return espaciosActivos(estado).map((espacio) => {
    const r = distribucion.rects[espacio.id];
    const texto = nombreVisible(estado, espacio);
    const actual = espacio.id === claveActual;
    let x = r.x + r.w / 2;
    let y = r.y + r.h / 2;
    if (actual && vista) {
      const { w, h } = medir(texto);
      const x0 = Math.max(r.x, vista.x);
      const x1 = Math.min(r.x + r.w, vista.x + vista.w);
      const y0 = Math.max(r.y, vista.y);
      const y1 = Math.min(r.y + r.h, vista.y + vista.h);
      if (x1 > x0 && y1 > y0) { // si el espacio no se ve en absoluto, no hay nada que ajustar
        x = ajustarEje(x, x0, x1, w);
        y = ajustarEje(y, y0, y1, h);
      }
    }
    return { clave: espacio.id, texto, x, y, actual };
  });
}
