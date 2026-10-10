import { agregarActividad } from '../src/actividades.js';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, banoDe, cuartosEnOrden } from '../src/hogar.js';

const agregarTipos = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);

// Contexto determinista para las pruebas: ids y fechas predecibles.
export function crearCtx() {
  let id = 0;
  let tick = 0;
  return {
    cuentaId: 'cuenta-1',
    nuevoId: () => `id-${++id}`,
    ahora: () => new Date(Date.UTC(2026, 9, 4, 0, 0, tick++)).toISOString(),
  };
}

export function almacenEnMemoria(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => { datos.set(k, String(v)); },
    datos,
  };
}

// Azar reproducible para las pruebas de movimiento (mulberry32): misma semilla, misma secuencia en [0, 1).
export function azarReproducible(semilla = 1) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Alta de una actividad que admite a una mascota como responsable: representa datos de una versión anterior a la 007 (ADR-007), que el
// dominio ya no deja crear. Se crea para una persona y se reasigna a la mascota saltándose las reglas. Sin mascota, es `agregarActividad`.
export function agregarActividadLegada(estado, datos, ctx) {
  const mascota = estado.miembros.find((m) => m.id === datos.miembroId && m.tipo === 'mascota' && m.eliminadoEn === null);
  if (!mascota) return agregarActividad(estado, datos, ctx);
  const persona = estado.miembros.find((m) => m.tipo === 'persona' && m.eliminadoEn === null);
  const r = agregarActividad(estado, { ...datos, miembroId: persona.id }, ctx);
  if (!r.ok) return r;
  const actividades = r.estado.actividades.map((a, i, todas) => (i === todas.length - 1 ? { ...a, miembroId: mascota.id } : a));
  return { ok: true, estado: { ...r.estado, actividades } };
}

// Las 7.560 combinaciones permitidas de espacios: comedor, cocinas, lavanderías, espacios de mascota, dormitorios, oficinas y baños internos.
export function* todasLasCombinaciones() {
  for (const comedor of [0, 1]) for (const cocinas of [1, 2]) for (const lav of [0, 1, 2]) for (const masc of [0, 1, 2])
    for (const dorms of [1, 2, 3, 4]) for (const ofis of [0, 1, 2]) {
      const ctx = crearCtx();
      let base = crearHogarInicial(ctx);
      base = agregarTipos(base, ctx, ...Array(comedor).fill('comedor'), ...Array(cocinas - 1).fill('cocina'),
        ...Array(lav).fill('lavanderia'), ...Array(masc).fill('mascota'), ...Array(dorms - 1).fill('dormitorio'), ...Array(ofis).fill('oficina'));
      const cuartos = cuartosEnOrden(base);
      base = agregarTipos(base, ctx, ...Array(cuartos.length).fill('bano'));
      for (let mascara = 0; mascara < 2 ** cuartos.length; mascara++) {
        let e = base;
        cuartos.forEach((c, i) => { if (!(mascara & (1 << i))) e = eliminarEspacio(e, banoDe(e, c.id).id, ctx); });
        yield e;
      }
    }
}
