// test/hogares-de-prueba.js
// Dos hogares de prueba (FR-7 de la 009) que juntos muestran los 14 personajes, para revisarlos en el juego. Se arman con las
// operaciones reales del modelo y no forman parte de la aplicación; cómo cargarlos está en docs/specs/009-habitantes-animados/verification.md.
import { ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { crearHogarInicial, agregarHabitante, agregarEspacio, renombrarMiembro, esPropietario, espaciosActivos } from '../src/hogar.js';
import { agregarActividad } from '../src/actividades.js';
import { sumarDias } from '../src/fechas.js';

// Ids y fechas predecibles, sin `crypto.randomUUID`, que no existe al abrir el juego por la IP de la red local (lección del 2026-10-05).
export function ctxDePrueba() {
  let id = 0;
  let tick = 0;
  return {
    cuentaId: 'cuenta-prueba',
    nuevoId: () => `prueba-${++id}`,
    ahora: () => new Date(Date.UTC(2026, 9, 10, 9, 0, tick++)).toISOString(),
  };
}

function exigir(r) {
  if (!r.ok) throw new Error(`hogar de prueba inválido: ${r.error}`);
  return r.estado;
}

// El propietario se llama «Protagonista»; cada familiar y cada mascota, como su aspecto o su especie (AC-8.3).
function armar(aspectos, especies, ctx) {
  let estado = crearHogarInicial(ctx);
  const propietario = estado.miembros.find((m) => esPropietario(estado, m));
  estado = exigir(renombrarMiembro(estado, propietario.id, 'Protagonista', ctx));
  for (const aspecto of aspectos) estado = exigir(agregarHabitante(estado, 'familiar', { nombre: ASPECTOS[aspecto], aspecto }, ctx));
  for (const especie of especies) estado = exigir(agregarHabitante(estado, 'mascota', { nombre: ESPECIES[especie], especie }, ctx));
  return estado;
}

// AC-8.1: el protagonista, los seis aspectos de género y edad, y cuatro mascotas.
export const hogarDePrueba1 = (ctx = ctxDePrueba()) =>
  armar(['adulto', 'adulta', 'nino', 'nina', 'anciano', 'anciana'], ['perro', 'gato', 'conejo', 'hamster'], ctx);

// AC-8.2: el protagonista, el neutro, el loro y «Otro».
export const hogarDePrueba2 = (ctx = ctxDePrueba()) => armar(['neutro'], ['loro', 'otro'], ctx);

// Días de atraso que dejan a un espacio en cada estado de limpieza (umbrales de 1 y 3 días de la 003).
const ATRASO = { desordenado: 1, desastre: 3 };

// FR-9 de la 010: un hogar con un espacio de cada uno de los ocho tipos y dos baños internos. Con `limpieza` 'desordenado' o 'desastre', cada
// espacio tiene una actividad puntual a cargo del propietario atrasada 1 o 3 días respecto de `hoy` ('AAAA-MM-DD'); con 'limpio', ninguna.
export function hogarDePruebaDeEstados(limpieza, hoy, ctx = ctxDePrueba()) {
  let estado = crearHogarInicial(ctx);
  const propietario = estado.miembros.find((m) => esPropietario(estado, m));
  estado = exigir(renombrarMiembro(estado, propietario.id, 'Protagonista', ctx));
  for (const tipo of ['comedor', 'lavanderia', 'mascota', 'oficina', 'bano', 'bano']) estado = agregarEspacio(estado, tipo, ctx);
  if (!(limpieza in ATRASO)) return estado;
  for (const espacio of espaciosActivos(estado)) {
    estado = exigir(agregarActividad(estado, {
      nombre: 'Limpiar', icono: 'limpiar', tipo: 'puntual', miembroId: propietario.id, espacioId: espacio.id, vence: sumarDias(hoy, -ATRASO[limpieza]),
    }, ctx));
  }
  return estado;
}
