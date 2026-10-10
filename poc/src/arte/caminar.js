// src/arte/caminar.js
// Reglas del caminar de los personajes (FR-4 y FR-5 de la 009, ADR-009): hacia dónde mira cada uno y qué cuadro muestra. Son puras:
// la presentación guarda el registro de cada miembro (no entra en el documento guardado) y le pasa la hora.

// Vista de cada dirección; la izquierda es la de lado volteada horizontalmente (AC-4.1).
const VISTA_DE_DIRECCION = {
  abajo: { vista: 'frente', volteada: false },
  arriba: { vista: 'espalda', volteada: false },
  derecha: { vista: 'lado', volteada: false },
  izquierda: { vista: 'lado', volteada: true },
};
export const vistaDeDireccion = (direccion) => VISTA_DE_DIRECCION[direccion] ?? VISTA_DE_DIRECCION.abajo;

// Dirección del paso entre dos casillas vecinas (AC-4.2); null si no son vecinas (por ejemplo, al reaparecer en otra casilla).
export function direccionDelPaso(desde, hasta) {
  const dx = hasta.x - desde.x;
  const dy = hasta.y - desde.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1) return 'derecha';
  if (dx === -1) return 'izquierda';
  return dy === 1 ? 'abajo' : 'arriba';
}

// Registro de caminar de un personaje: hacia dónde mira, el pie de su último paso (1 o 2) y, si está dando un paso, cuándo empezó
// y cuánto dura, en milisegundos. Quien se coloca de nuevo en el mapa mira de frente y quieto (AC-4.7).
export const REPOSO = Object.freeze({ direccion: 'abajo', pie: 2, inicio: null, duracion: 0 });
export const otroPie = (pie) => (pie === 1 ? 2 : 1);
// Cada paso nuevo cambia de pie (AC-5.2).
export const pasoNuevo = (registro, direccion, inicio, duracion) => ({ direccion, pie: otroPie(registro.pie), inicio, duracion });
// Girar sin dar un paso: mira hacia `direccion` y queda parado (AC-4.4, AC-4.6).
export const mirarHacia = (registro, direccion) => ({ ...registro, direccion, inicio: null });

// Lo avanzado del paso en curso, de 0 a menos de 1; null si no está dando un paso o ya terminó.
export function progresoDelPaso(registro, ahoraMs) {
  if (registro.inicio === null || registro.duracion <= 0) return null;
  const progreso = (ahoraMs - registro.inicio) / registro.duracion;
  return progreso >= 0 && progreso < 1 ? progreso : null;
}

// AC-5.1 y AC-5.3: en la primera mitad del paso, el cuadro del pie que toca; en la segunda mitad y fuera de un paso, el parado (0).
export const cuadroDeCaminar = (progreso, pie) => (progreso !== null && progreso < 0.5 ? pie : 0);
