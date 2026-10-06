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
