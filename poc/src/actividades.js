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
  const actividad = { id: ctx.nuevoId(), hogarId: estado.hogares[0].id, ...v.datos, hechaEn: null, ...auditoriaNueva(ctx) };
  return { ok: true, estado: { ...estado, actividades: [...estado.actividades, actividad] } };
}

export function editarActividad(estado, id, datos, ctx) {
  if (!buscarActividad(estado, id)) return { ok: false, error: 'no-encontrada', estado };
  const v = validarActividad(estado, datos);
  if (v.error) return { ok: false, error: v.error, estado };
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), ...v.datos } : a));
  return { ok: true, estado: { ...estado, actividades } };
}

// Borrado lógico (FR-8): el registro queda con su fecha de eliminación; no afecta a nada más.
export function eliminarActividad(estado, id, ctx) {
  if (!buscarActividad(estado, id)) return estado;
  const ahora = ctx.ahora();
  const actividades = estado.actividades.map((a) => (a.id === id ? { ...tocar(a, ctx), eliminadoEn: ahora } : a));
  return { ...estado, actividades };
}

// "Hecho" (FR-3): solo para una actividad por hacer (vence hoy o antes). La puntual registra el día;
// la repetitiva vuelve a vencer hoy más su frecuencia, sin acumular atrasos.
export function marcarHecha(estado, id, hoy, ctx) {
  const actividad = buscarActividad(estado, id);
  if (!actividad || diasEntre(actividad.vence, hoy) < 0) return estado;
  const cambio = actividad.tipo === 'puntual' ? { hechaEn: hoy } : { vence: sumarDias(hoy, actividad.frecuenciaDias) };
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
