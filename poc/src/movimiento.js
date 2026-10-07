// src/movimiento.js
// Movimiento autónomo de los habitantes (ADR-002 de movimiento, ampliado por el ADR-004 de movimiento hacia un objetivo):
// lógica pura; el azar se inyecta y el motor solo anima.
import { esTransitable } from './distribucion.js';
import { DIRECCIONES, claveCasilla } from './posicion.js';
import { rutaMasCorta, casillasDe } from './rutas.js';

export const MS_POR_PASO = 500; // 2 casillas por segundo (AC-4.2 de la 002)
export const PAUSA_MIN_MS = 1000;
export const PAUSA_MAX_MS = 4000;
export const TRAMO_MIN = 1;
export const TRAMO_MAX = 6;
export const ESPERA_MS = 1000; // quien encuentra su espacio lleno vuelve a intentarlo cada segundo (AC-3.10 de la 004)

const ORDEN_DIRECCIONES = ['arriba', 'abajo', 'izquierda', 'derecha'];
const LIBRE = { tipo: 'libre' };
const enteroEntre = (min, max, azar) => min + Math.floor(azar() * (max - min + 1));
const pausaAleatoria = (azar) => enteroEntre(PAUSA_MIN_MS, PAUSA_MAX_MS, azar);

// Dos objetivos son el mismo si coinciden su tipo y, si son un espacio, el espacio.
export const mismoObjetivo = (a, b) => a.tipo === b.tipo && (a.tipo !== 'espacio' || a.espacioId === b.espacioId);

// Estado de sesión de un habitante (no se guarda). (x, y) es la casilla que ocupa o a la que se dirige; mientras progresoMs > 0
// también ocupa `desde`. `objetivo` es { tipo: 'libre' }, { tipo: 'fuera' } o { tipo: 'espacio', espacioId } (ADR-004).
// `fase` dice qué hace: 'pasea' (al azar; dentro de su espacio si su objetivo es uno), 'planifica' (decide su ruta; si tiene
// pausa, espera), 'ruta' (pisa en orden las casillas de `ruta`) o 'fuera' (salió por la entrada y no está en el mapa).
const nuevoMovil = (id, x, y, objetivo = LIBRE, fase = 'pasea') => ({
  id, x, y, desde: null, progresoMs: 0, pausaMs: 0, tramo: 0, direccion: null, objetivo, fase, ruta: [],
});

// Casillas que ocupan los habitantes en el mapa: la suya y, mientras caminan, también la de origen. Quien está fuera de casa no
// ocupa ninguna (AC-4.2 de la 004).
export function ocupadasPorHabitantes(moviles) {
  const ocupadas = new Set();
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    ocupadas.add(claveCasilla(h.x, h.y));
    if (h.desde) ocupadas.add(claveCasilla(h.desde.x, h.desde.y));
  }
  return ocupadas;
}

// Casillas del jugador: la que ocupa y, mientras da un paso, la de origen (AC-5.2 de la 002).
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

// Saca de `libres` la más cercana, por camino, a la primera casilla de un espacio lleno (AC-6.3 de la 004): siempre la misma para
// el mismo mapa y las mismas casillas ocupadas.
function tomarMasCercana(libres, distribucion, espacioId) {
  const claves = new Set(libres.map((c) => claveCasilla(c.x, c.y)));
  const [origen] = casillasDe(distribucion, espacioId);
  const destino = rutaMasCorta(distribucion, origen, (x, y) => claves.has(claveCasilla(x, y))).at(-1);
  return libres.splice(libres.findIndex((c) => c.x === destino.x && c.y === destino.y), 1)[0];
}

// Coloca a cada habitante, quieto, después del jugador (FR-7 de la 002, FR-6 de la 004): quien tiene objetivo de espacio, en una
// casilla libre de ese espacio elegida al azar (o en la libre más cercana si está lleno); quien está fuera, fuera del mapa; el resto,
// en cualquier casilla transitable libre al azar. Nunca en la casilla de otro ni en las del jugador.
export function colocarHabitantes(ids, distribucion, jugador, azar, objetivos = new Map()) {
  const libres = casillasLibres(distribucion, ocupadasPorJugador(jugador));
  return ids.map((id) => {
    const objetivo = objetivos.get(id) ?? LIBRE;
    if (objetivo.tipo === 'fuera') return nuevoMovil(id, distribucion.entrada.x, distribucion.entrada.y, objetivo, 'fuera');
    if (objetivo.tipo === 'espacio') {
      const dentro = libres.filter((c) => distribucion.espacioEn[c.y][c.x] === objetivo.espacioId);
      if (dentro.length === 0) {
        const c = tomarMasCercana(libres, distribucion, objetivo.espacioId);
        return nuevoMovil(id, c.x, c.y, objetivo, 'planifica');
      }
      const elegida = dentro[Math.floor(azar() * dentro.length)];
      libres.splice(libres.indexOf(elegida), 1);
      return nuevoMovil(id, elegida.x, elegida.y, objetivo);
    }
    const c = tomarAlAzar(libres, azar);
    return nuevoMovil(id, c.x, c.y, objetivo);
  });
}

// Al entrar al modo edición (AC-7.2 de la 002, AC-6.4 de la 004): cada habitante queda quieto en la casilla a la que se dirigía,
// con su objetivo; quien está fuera sigue fuera.
export const congelarHabitantes = (moviles) => moviles.map((h) => nuevoMovil(h.id, h.x, h.y, h.objetivo,
  h.fase === 'fuera' ? 'fuera' : (h.objetivo.tipo === 'libre' ? 'pasea' : 'planifica')));

// Tras un cambio del modo edición (FR-7 de la 002): conserva a los que siguen, quita a los eliminados, coloca a los nuevos en
// casillas libres al azar y reubica solo a los que quedaron en una casilla inválida u ocupada. Quien está fuera no se toca
// (AC-6.7 de la 004).
export function sincronizarHabitantes(moviles, ids, distribucion, jugador, azar) {
  const ocupadas = ocupadasPorJugador(jugador);
  const conservados = new Map();
  for (const h of moviles) {
    if (!ids.includes(h.id)) continue;
    if (h.fase === 'fuera') { conservados.set(h.id, h); continue; }
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

// Al cambiar el minuto (FR-3 de la 004): quien tiene un objetivo nuevo cancela su pausa o su tramo, termina el paso que ya empezó
// y planifica su ruta (AC-3.7); quien está fuera sigue fuera hasta reaparecer. Los demás, mascotas incluidas, no cambian.
export function fijarObjetivos(moviles, objetivos) {
  return moviles.map((h) => {
    const objetivo = objetivos.get(h.id) ?? LIBRE;
    if (mismoObjetivo(h.objetivo, objetivo)) return h;
    return { ...h, objetivo, fase: h.fase === 'fuera' ? 'fuera' : 'planifica', ruta: [], pausaMs: 0, tramo: 0, direccion: null };
  });
}

// Avanza `dtMs` milisegundos el movimiento de todos los habitantes (FR-5 de la 002; FR-3, FR-4 y FR-7 de la 004). Pura: devuelve
// un arreglo nuevo. Se procesan en orden con un único conteo de casillas ocupadas: quien pasea nunca elige una casilla ocupada
// (AC-4.5 de la 002) y quien va en ruta solo evita las del jugador (ADR-004). Si un paso termina y el habitante sigue caminando,
// el siguiente empieza en la misma llamada con el tiempo que sobró del cuadro, para que los pasos promedien 500 ms sin importar
// los cuadros por segundo (AC-4.2 de la 002, AC-3.8 de la 004).
export function avanzarHabitantes(moviles, distribucion, jugador, dtMs, azar) {
  const ocupadas = new Map(); // casilla → cuántos habitantes la ocupan (en ruta pueden compartirla)
  const esperan = new Map(); // casillas de quienes esperan a que se libere su espacio: no bloquean a quien pasea (ruling del plan)
  const sumar = (mapa, x, y) => { const k = claveCasilla(x, y); mapa.set(k, (mapa.get(k) ?? 0) + 1); };
  const restar = (mapa, x, y) => {
    const k = claveCasilla(x, y);
    const n = (mapa.get(k) ?? 0) - 1;
    if (n > 0) mapa.set(k, n); else mapa.delete(k);
  };
  for (const h of moviles) {
    if (h.fase === 'fuera') continue;
    sumar(ocupadas, h.x, h.y);
    if (h.desde) sumar(ocupadas, h.desde.x, h.desde.y);
    if (h.fase === 'planifica' && h.pausaMs > 0 && h.progresoMs === 0) sumar(esperan, h.x, h.y);
  }
  const delJugador = ocupadasPorJugador(jugador);
  const esDelJugador = (x, y) => delJugador.has(claveCasilla(x, y));
  const ocupada = (x, y) => ocupadas.has(claveCasilla(x, y)) || esDelJugador(x, y);
  const bloquea = (x, y) => esDelJugador(x, y) || (ocupadas.get(claveCasilla(x, y)) ?? 0) > (esperan.get(claveCasilla(x, y)) ?? 0);
  const { entrada } = distribucion;
  const enEntrada = (x, y) => x === entrada.x && y === entrada.y;

  // Paseo al azar del ADR-002: alterna pausas y tramos; con objetivo de espacio, solo por casillas de ese espacio (AC-3.2).
  const pasear = (h, sobranteMs) => {
    const propio = h.objetivo.tipo === 'espacio' ? h.objetivo.espacioId : null;
    const libre = (x, y) => esTransitable(distribucion, x, y) && !bloquea(x, y)
      && (propio === null || distribucion.espacioEn[y][x] === propio);
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
    sumar(ocupadas, x, y);
    const restante = tramo - 1;
    return {
      ...h, x, y, desde: { x: h.x, y: h.y }, progresoMs: Math.max(1, MS_POR_PASO - sobranteMs),
      tramo: restante, direccion: restante > 0 ? direccion : null, pausaMs: restante > 0 ? 0 : pausaAleatoria(azar),
    };
  };

  // Sigue su ruta (AC-3.1, AC-8.1, AC-8.3): puede pisar la casilla de otro habitante, pero espera al jugador.
  const seguirRuta = (h, sobranteMs) => {
    const [siguiente, ...resto] = h.ruta;
    if (esDelJugador(siguiente.x, siguiente.y)) return h;
    sumar(ocupadas, siguiente.x, siguiente.y);
    return { ...h, x: siguiente.x, y: siguiente.y, desde: { x: h.x, y: h.y }, progresoMs: Math.max(1, MS_POR_PASO - sobranteMs), ruta: resto };
  };

  // Decide qué hace quien no tiene ruta (ADR-004): sale si está en la entrada; si no, va a ella; con objetivo de espacio (o libre),
  // se queda si ya está en una casilla propia sin compartir (AC-3.3, AC-3.4) o va a la libre más cercana (AC-3.9); si no hay
  // ninguna, espera (AC-3.10). Quien termina una ruta en una casilla compartida se aparta a una libre.
  const planificar = (h) => {
    if (h.objetivo.tipo === 'fuera') {
      if (enEntrada(h.x, h.y)) { restar(ocupadas, h.x, h.y); return { ...h, fase: 'fuera', ruta: [] }; } // AC-4.1, AC-4.8
      return { ...h, fase: 'ruta', ruta: rutaMasCorta(distribucion, h, enEntrada) };
    }
    const propio = h.objetivo.tipo === 'espacio' ? h.objetivo.espacioId : null;
    const dentro = (x, y) => propio === null || distribucion.espacioEn[y][x] === propio;
    const compartida = (ocupadas.get(claveCasilla(h.x, h.y)) ?? 0) > 1;
    if (dentro(h.x, h.y) && !compartida) return { ...h, fase: 'pasea', ruta: [] };
    const hacia = rutaMasCorta(distribucion, h, (x, y) => dentro(x, y) && !ocupada(x, y))
      ?? (compartida ? rutaMasCorta(distribucion, h, (x, y) => !ocupada(x, y)) : null);
    if (hacia && hacia.length > 0) return { ...h, fase: 'ruta', ruta: hacia };
    return { ...h, fase: 'planifica', pausaMs: ESPERA_MS };
  };

  // Quien está fuera reaparece en la entrada cuando su objetivo deja de ser 'fuera' y la entrada está libre (AC-4.3, AC-4.6).
  const reaparecer = (h) => {
    if (h.objetivo.tipo === 'fuera' || ocupada(entrada.x, entrada.y)) return h;
    sumar(ocupadas, entrada.x, entrada.y);
    return nuevoMovil(h.id, entrada.x, entrada.y, h.objetivo, 'planifica');
  };

  return moviles.map((original) => {
    let h = original;
    let sobranteMs = 0;
    if (h.fase === 'fuera') return reaparecer(h);
    if (h.progresoMs > 0) {
      const restanteMs = h.progresoMs - dtMs;
      if (restanteMs > 0) return { ...h, progresoMs: restanteMs };
      restar(ocupadas, h.desde.x, h.desde.y); // llegó: libera la casilla de origen
      h = { ...h, progresoMs: 0, desde: null };
      sobranteMs = -restanteMs;
      if (h.fase === 'ruta' && h.ruta.length === 0) h = { ...h, fase: 'planifica' }; // terminó su ruta: decide si llegó
      else if (h.fase === 'pasea' && h.tramo === 0) return h; // fin del tramo: sigue la pausa que se sorteó al iniciar el último paso
    } else if (h.pausaMs > 0) {
      return { ...h, pausaMs: Math.max(0, h.pausaMs - dtMs) };
    }
    if (h.fase === 'planifica') {
      h = planificar(h);
      if (h.fase === 'fuera' || h.fase === 'planifica') return h;
    }
    if (h.fase === 'ruta') return seguirRuta(h, sobranteMs);
    return pasear(h, sobranteMs);
  });
}
