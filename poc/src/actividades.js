// src/actividades.js
// Actividades del hogar (feature 003): operaciones puras sobre `estado.actividades` (ADR-003 de modelo de actividades).
import { ICONOS, FRECUENCIAS, LIMITE_ACTIVIDADES, MAX_NOMBRE_ACTIVIDAD } from './catalogo.js';
import { buscarMiembro, buscarEspacio, actividadesPendientes, auditoriaNueva, tocar } from './hogar.js';
import { esFechaValida, sumarDias, diasEntre } from './fechas.js';

export const buscarActividad = (estado, id) => actividadesPendientes(estado).find((a) => a.id === id) ?? null;
// El límite cuenta las pendientes: las eliminadas y las puntuales hechas no ocupan cupo (FR-1).
export const contarActividades = (estado) => actividadesPendientes(estado).length;
export const puedeAgregarActividad = (estado) => contarActividades(estado) < LIMITE_ACTIVIDADES;

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);

// Valida y normaliza los datos de la ficha (FR-1). Devuelve { error } o { datos } listos para guardar.
function validarActividad(estado, datos) {
  const nombre = (datos.nombre ?? '').trim();
  if (nombre === '') return { error: 'vacio' };
  if (nombre.length > MAX_NOMBRE_ACTIVIDAD) return { error: 'largo' };
  if (!enLista(ICONOS, datos.icono)) return { error: 'icono' };
  if (!buscarMiembro(estado, datos.miembroId)) return { error: 'miembro' };
  const espacioId = datos.espacioId ?? null;
  if (espacioId !== null && !buscarEspacio(estado, espacioId)) return { error: 'espacio' };
  if (!esFechaValida(datos.vence)) return { error: 'fecha' };
  const comunes = { nombre, icono: datos.icono, miembroId: datos.miembroId, espacioId, vence: datos.vence };
  if (datos.tipo === 'puntual') return { datos: { ...comunes, tipo: 'puntual', frecuenciaDias: null } };
  if (datos.tipo !== 'repetitiva') return { error: 'tipo' };
  if (!FRECUENCIAS.includes(datos.frecuenciaDias)) return { error: 'frecuencia' };
  return { datos: { ...comunes, tipo: 'repetitiva', frecuenciaDias: datos.frecuenciaDias } };
}

export function agregarActividad(estado, datos, ctx) {
  if (!puedeAgregarActividad(estado)) return { ok: false, error: 'limite', estado };
  const v = validarActividad(estado, datos);
  if (v.error) return { ok: false, error: v.error, estado };
  const actividad = { id: ctx.nuevoId(), hogarId: estado.hogares[0].id, ...v.datos, hechaEn: null, devolverA: null, ...auditoriaNueva(ctx) };
  return { ok: true, estado: { ...estado, actividades: [...estado.actividades, actividad] } };
}

export function editarActividad(estado, id, datos, ctx) {
  const actual = buscarActividad(estado, id);
  if (!actual) return { ok: false, error: 'no-encontrada', estado };
  const v = validarActividad(estado, datos);
  if (v.error) return { ok: false, error: v.error, estado };
  // El regreso pendiente sobrevive solo si sigue siendo repetitiva y con la misma persona responsable (FR-9 de la 005).
  const devolverA = v.datos.tipo === 'repetitiva' && v.datos.miembroId === actual.miembroId ? (actual.devolverA ?? null) : null;
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...v.datos, devolverA } : a));
  return { ok: true, estado: { ...estado, actividades } };
}

// Borrado lógico (FR-8): el registro queda con su fecha de eliminación; no afecta a nada más.
export function eliminarActividad(estado, id, ctx) {
  if (!buscarActividad(estado, id)) return estado;
  const ahora = ctx.ahora();
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), eliminadoEn: ahora } : a));
  return { ...estado, actividades };
}

// "Hecho" (FR-3): solo para una actividad por hacer (vence hoy o antes). La puntual registra el día; la repetitiva vuelve a vencer
// hoy más su frecuencia, sin acumular atrasos, y, si estaba en poder de otra persona por un intercambio, vuelve a su responsable
// original (si ese ya no está activo, se queda con quien la tiene; FR-9 de la 005).
export function marcarHecha(estado, id, hoy, ctx) {
  const actividad = buscarActividad(estado, id);
  if (!actividad || diasEntre(actividad.vence, hoy) < 0) return estado;
  let cambio = { hechaEn: hoy };
  if (actividad.tipo === 'repetitiva') {
    cambio = { vence: sumarDias(hoy, actividad.frecuenciaDias), devolverA: null };
    if (actividad.devolverA && buscarMiembro(estado, actividad.devolverA)) cambio.miembroId = actividad.devolverA;
  }
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...cambio } : a));
  return { ...estado, actividades };
}

export const MENSAJES_ACTIVIDAD = {
  vacio: 'El nombre no puede estar vacío.',
  largo: 'El nombre puede tener como máximo 30 caracteres.',
  icono: 'Elige un icono de la lista.',
  miembro: 'Elige a quién se asigna.',
  espacio: 'Elige un espacio de la lista.',
  tipo: 'Elige si es puntual o repetitiva.',
  fecha: 'Elige una fecha válida.',
  frecuencia: 'Elige cada cuántos días se repite.',
  limite: 'Ya hay 50 actividades pendientes.',
  'no-encontrada': 'Esa actividad ya no está pendiente.',
};

// ---------- Estado derivado (ADR-003 de estado derivado): nada se guarda; todo sale de (estado, hoy) ----------

export const UMBRAL_DESORDENADO = 1; // días de atraso (FR-4); valores de partida, ajustables tras probarlos
export const UMBRAL_DESASTRE = 3;

export const atraso = (actividad, hoy) => diasEntre(actividad.vence, hoy);

// Por hacer (FR-2): pendientes que vencen hoy o antes, de la más atrasada a la menos. El orden es estable:
// a igual atraso se conserva el orden de creación (el de `estado.actividades`).
export function porHacer(estado, hoy) {
  return actividadesPendientes(estado)
    .map((a) => ({ a, dias: atraso(a, hoy) }))
    .filter((x) => x.dias >= 0)
    .sort((x, y) => y.dias - x.dias)
    .map((x) => x.a);
}

// Estado de un espacio (FR-4) según la actividad por hacer más atrasada vinculada a él.
export function limpiezaDeEspacio(estado, espacioId, hoy) {
  const peor = porHacer(estado, hoy).find((a) => a.espacioId === espacioId);
  const dias = peor ? atraso(peor, hoy) : 0;
  if (dias >= UMBRAL_DESASTRE) return 'desastre';
  if (dias >= UMBRAL_DESORDENADO) return 'desordenado';
  return 'limpio';
}

// Una burbuja por lugar con actividades por hacer (FR-6): el espacio, o el miembro para las que no tienen espacio.
// El icono es el de la primera del lugar en el orden de `porHacer`; `mas` indica que hay más de una.
export function burbujas(estado, hoy) {
  const porLugar = new Map();
  for (const a of porHacer(estado, hoy)) {
    const tipo = a.espacioId === null ? 'miembro' : 'espacio';
    const id = a.espacioId ?? a.miembroId;
    const clave = `${tipo}:${id}`;
    if (!porLugar.has(clave)) porLugar.set(clave, { tipo, id, icono: a.icono, actividades: [] });
    porLugar.get(clave).actividades.push(a.id);
  }
  return [...porLugar.values()].map((b) => ({ ...b, mas: b.actividades.length > 1 }));
}

// Actividades por hacer de un lugar, en el orden de su burbuja (FR-7).
export const actividadesDelLugar = (estado, lugar, hoy) => porHacer(estado, hoy).filter((a) => (lugar.tipo === 'espacio'
  ? a.espacioId === lugar.id
  : a.espacioId === null && a.miembroId === lugar.id));

// Lista del panel del modo edición (FR-8): todas las pendientes, por fecha de vencimiento (las fechas AAAA-MM-DD ordenan como texto).
export const listaDelPanel = (estado) => [...actividadesPendientes(estado)]
  .sort((x, y) => (x.vence < y.vence ? -1 : x.vence > y.vence ? 1 : 0));

// Texto del plazo para la hoja y el panel (AC-3.1, AC-6.1).
export function textoPlazo(actividad, hoy) {
  const dias = atraso(actividad, hoy);
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Atrasada 1 día';
  if (dias > 1) return `Atrasada ${dias} días`;
  if (dias === -1) return 'Vence mañana';
  return `Vence el ${actividad.vence}`;
}
