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
