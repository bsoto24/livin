// src/movimiento.js
// Movimiento autónomo de los habitantes (ADR-002 de movimiento): lógica pura; el azar se inyecta y el motor solo anima.
import { esTransitable } from './distribucion.js';
import { DIRECCIONES, claveCasilla } from './posicion.js';

export const MS_POR_PASO = 500; // 2 casillas por segundo (AC-4.2)
export const PAUSA_MIN_MS = 1000;
export const PAUSA_MAX_MS = 4000;
export const TRAMO_MIN = 1;
export const TRAMO_MAX = 6;

const ORDEN_DIRECCIONES = ['arriba', 'abajo', 'izquierda', 'derecha'];
const enteroEntre = (min, max, azar) => min + Math.floor(azar() * (max - min + 1));
const pausaAleatoria = (azar) => enteroEntre(PAUSA_MIN_MS, PAUSA_MAX_MS, azar);

// Estado de sesión de un habitante (no se guarda): (x, y) es la casilla que ocupa o a la que se dirige;
// mientras progresoMs > 0 también ocupa `desde`, la casilla de origen del paso.
const nuevoMovil = (id, x, y) => ({ id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null });

// Casillas que ocupan los habitantes: la suya y, mientras caminan, también la de origen.
export function ocupadasPorHabitantes(moviles) {
  const ocupadas = new Set();
  for (const h of moviles) {
    ocupadas.add(claveCasilla(h.x, h.y));
    if (h.desde) ocupadas.add(claveCasilla(h.desde.x, h.desde.y));
  }
  return ocupadas;
}

// Casillas del jugador: la que ocupa y, mientras da un paso, la de origen (AC-5.2).
export function ocupadasPorJugador(jugador) {
  const ocupadas = new Set([claveCasilla(jugador.x, jugador.y)]);
  if (jugador.desde) ocupadas.add(claveCasilla(jugador.desde.x, jugador.desde.y));
  return ocupadas;
}

function casillasLibres(distribucion, ocupadas) {
  const libres = [];
  for (let y = 0; y < distribucion.alto; y++) for (let x = 0; x < distribucion.ancho; x++) {
    if (esTransitable(distribucion, x, y) && !ocupadas.has(claveCasilla(x, y))) libres.push({ x, y });
  }
  return libres;
}

// Saca una casilla al azar de la lista (la quita para que no se repita).
const tomarAlAzar = (libres, azar) => libres.splice(Math.floor(azar() * libres.length), 1)[0];

// Coloca a cada habitante, quieto, en una casilla transitable libre al azar, distinta de las demás y de las del jugador (FR-7).
export function colocarHabitantes(ids, distribucion, jugador, azar) {
  const libres = casillasLibres(distribucion, ocupadasPorJugador(jugador));
  return ids.map((id) => {
    const c = tomarAlAzar(libres, azar);
    return nuevoMovil(id, c.x, c.y);
  });
}

// Al entrar al modo edición: cada habitante queda quieto en la casilla a la que se dirigía (AC-7.2).
export const congelarHabitantes = (moviles) => moviles.map((h) => nuevoMovil(h.id, h.x, h.y));

// Tras un cambio del modo edición (FR-7): conserva a los que siguen, quita a los eliminados, coloca a los nuevos
// en casillas libres al azar y reubica solo a los que quedaron en una casilla inválida u ocupada.
export function sincronizarHabitantes(moviles, ids, distribucion, jugador, azar) {
  const ocupadas = ocupadasPorJugador(jugador);
  const conservados = new Map();
  for (const h of moviles) {
    if (!ids.includes(h.id)) continue;
    const clave = claveCasilla(h.x, h.y);
    if (esTransitable(distribucion, h.x, h.y) && !ocupadas.has(clave)) {
      ocupadas.add(clave);
      conservados.set(h.id, h);
    }
  }
  const libres = casillasLibres(distribucion, ocupadas);
  return ids.map((id) => {
    if (conservados.has(id)) return conservados.get(id);
    const c = tomarAlAzar(libres, azar);
    return nuevoMovil(id, c.x, c.y);
  });
}

// Avanza `dtMs` milisegundos el movimiento de todos los habitantes (FR-5, FR-6). Pura: devuelve un arreglo nuevo.
// Se procesan en orden con un único conjunto de ocupadas, así dos habitantes nunca eligen la misma casilla (AC-4.5).
export function avanzarHabitantes(moviles, distribucion, jugador, dtMs, azar) {
  const ocupadas = new Set([...ocupadasPorHabitantes(moviles), ...ocupadasPorJugador(jugador)]);
  const libre = (x, y) => esTransitable(distribucion, x, y) && !ocupadas.has(claveCasilla(x, y));
  return moviles.map((h) => {
    if (h.progresoMs > 0) {
      const progresoMs = Math.max(0, h.progresoMs - dtMs);
      if (progresoMs > 0) return { ...h, progresoMs };
      ocupadas.delete(claveCasilla(h.desde.x, h.desde.y)); // llegó: libera la casilla de origen
      return { ...h, progresoMs: 0, desde: null };
    }
    if (h.pausaMs > 0) return { ...h, pausaMs: Math.max(0, h.pausaMs - dtMs) };
    let { tramo, direccion } = h;
    if (tramo === 0) {
      const opciones = ORDEN_DIRECCIONES.filter((d) => libre(h.x + DIRECCIONES[d].dx, h.y + DIRECCIONES[d].dy));
      if (opciones.length === 0) return { ...h, pausaMs: pausaAleatoria(azar) };
      direccion = opciones[Math.floor(azar() * opciones.length)];
      tramo = enteroEntre(TRAMO_MIN, TRAMO_MAX, azar);
    }
    const x = h.x + DIRECCIONES[direccion].dx;
    const y = h.y + DIRECCIONES[direccion].dy;
    if (!libre(x, y)) return { ...h, tramo: 0, direccion: null, pausaMs: pausaAleatoria(azar) }; // obstáculo: termina el tramo
    ocupadas.add(claveCasilla(x, y));
    const restante = tramo - 1;
    return {
      ...h, x, y, desde: { x: h.x, y: h.y }, progresoMs: MS_POR_PASO,
      tramo: restante, direccion: restante > 0 ? direccion : null, pausaMs: restante > 0 ? 0 : pausaAleatoria(azar),
    };
  });
}
