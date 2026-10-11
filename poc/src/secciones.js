// src/secciones.js
// Barra y secciones del modo edición (feature 007): lógica pura, sin DOM ni Phaser. Qué pestañas hay, cómo se rotulan y qué responde el
// mapa al tocarlo según la sección abierta (FR-1 y FR-2 de la 007).

export const SECCIONES = [
  { clave: 'espacios', etiqueta: 'Espacios', icono: 'pestana:espacios' },
  { clave: 'familia', etiqueta: 'Familia', icono: 'pestana:familia' },
  { clave: 'actividades', etiqueta: 'Actividades', icono: 'pestana:actividades' },
  { clave: 'intercambios', etiqueta: 'Intercambios', icono: 'pestana:intercambios' },
];

// Rótulo de una pestaña (AC-1.8): Intercambios muestra las propuestas recibidas vigentes de quien juega.
export function textoPestana(clave, recibidas) {
  const { etiqueta } = SECCIONES.find((s) => s.clave === clave);
  return clave === 'intercambios' && recibidas > 0 ? `${etiqueta} (${recibidas})` : etiqueta;
}

// Qué responde el mapa al tocar una casilla en modo edición (FR-2). `toque`: { ocupante, enCartel, burbuja, espacioId } con el id de quien
// está en la casilla (propietario o habitante) o null, si se tocó el cartel de la entrada, la burbuja de la casilla o null, y el espacio de
// la casilla o null. Devuelve la acción o null. Cada sección responde solo a lo suyo.
export function accionDeToque(seccion, toque) {
  switch (seccion) {
    case 'espacios':
      return toque.espacioId ? { tipo: 'ficha-espacio', id: toque.espacioId } : null;
    case 'familia':
      if (toque.ocupante) return { tipo: 'ficha-miembro', id: toque.ocupante };
      return toque.enCartel ? { tipo: 'hoja-fuera' } : null;
    case 'actividades':
      return toque.burbuja ? { tipo: 'hoja', lugar: toque.burbuja } : null;
    default:
      return null;
  }
}

// Quién está en la casilla (x, y) (AC-2.2: el propietario, luego el habitante). `posiciones`: Map id → { x, y } con quienes están en el mapa
// (quien está fuera de casa no aparece). Devuelve el id o null.
export function ocupanteEn(x, y, posiciones, propietarioId) {
  const alli = (p) => p !== undefined && p.x === x && p.y === y;
  if (alli(posiciones.get(propietarioId))) return propietarioId;
  for (const [id, p] of posiciones) if (id !== propietarioId && alli(p)) return id;
  return null;
}
