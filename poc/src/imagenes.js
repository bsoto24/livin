// src/imagenes.js
// Presentación (con DOM): lleva el arte de `src/arte/` a la interfaz HTML (FR-2, FR-3 y FR-6 de la 011, ADR-011). Pinta cada icono y cada avatar
// una sola vez en un canvas de 16×16, guarda su URL de datos y entrega imágenes sin suavizado a escala entera. No tiene reglas de negocio.
import { PALETA, TAM } from './arte/paleta.js';
import { ICONOS_DE_INTERFAZ, AVATARES } from './arte/iconos.js';
import { variablesDeColor } from './arte/colores.js';

// clave → URL de datos. Se exporta para poder vaciarla desde la consola al verificar el respaldo (AC-9.3).
export const urlsDeImagenes = new Map();

// FR-7: las variables de color de la interfaz, derivadas de la paleta.
export function fijarVariablesDeColor(raiz = document.documentElement) {
  for (const [nombre, valor] of Object.entries(variablesDeColor())) raiz.style.setProperty(nombre, valor);
}

function urlDe(cuadricula) {
  const lienzo = document.createElement('canvas');
  lienzo.width = TAM;
  lienzo.height = TAM;
  const contexto = lienzo.getContext('2d');
  cuadricula.forEach((fila, y) => [...fila].forEach((ch, x) => {
    if (ch === '.') return;
    contexto.fillStyle = PALETA[ch];
    contexto.fillRect(x, y, 1, 1);
  }));
  return lienzo.toDataURL('image/png');
}

// FR-6: se llama una vez al arrancar. Si un dibujo falla, se queda sin URL y se muestra su respaldo; no se lanzan errores. Devuelve los milisegundos.
export function prepararImagenes() {
  const t0 = performance.now();
  for (const [clave, cuadricula] of Object.entries({ ...ICONOS_DE_INTERFAZ, ...AVATARES })) {
    try { urlsDeImagenes.set(clave, urlDe(cuadricula)); } catch { /* sin imagen: se usa el respaldo */ }
  }
  return performance.now() - t0;
}

const RESPALDOS = [['personaje:', 'personaje:neutro:frente:0'], ['actividad:', 'actividad:otra']];
const respaldoDe = (clave) => RESPALDOS.find(([prefijo]) => clave.startsWith(prefijo))?.[1] ?? null;

// Una imagen de la interfaz a `escala` veces 16 px (FR-2). Sin su URL usa el respaldo de su clase (`actividad:otra`, el avatar neutro); si
// tampoco hay, un hueco del mismo tamaño, para no mover la disposición.
export function imagen(clave, escala) {
  const url = urlsDeImagenes.get(clave) ?? urlsDeImagenes.get(respaldoDe(clave));
  const lado = `${TAM * escala}px`;
  if (!url) {
    const hueco = document.createElement('span');
    hueco.className = 'px';
    hueco.style.width = lado;
    hueco.style.height = lado;
    return hueco;
  }
  const img = document.createElement('img');
  img.className = 'px';
  img.src = url;
  img.alt = '';
  img.draggable = false;
  img.style.width = lado;
  img.style.height = lado;
  return img;
}
