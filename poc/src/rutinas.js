// src/rutinas.js
// Rutinas de los familiares (feature 004): operaciones puras sobre `estado.bloques` (ADR-004 de modelo de rutinas) y, más
// abajo, el lugar que corresponde a cada familiar según la fecha y el minuto locales (ADR-004 de movimiento).
import { DIAS_RUTINA, PASO_RUTINA, LIMITE_BLOQUES } from './catalogo.js';
import {
  buscarMiembro, buscarEspacio, esPropietario, familiares, bloquesActivos, nombreVisible, auditoriaNueva, tocar,
} from './hogar.js';
import { diaDeSemana } from './fechas.js';

export const MINUTOS_DIA = 1440;

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);
const esMinuto = (n, min, max) => Number.isInteger(n) && n % PASO_RUTINA === 0 && n >= min && n <= max;
const seSuperponen = (a, b) => a.inicio < b.fin && b.inicio < a.fin;

// Solo los familiares tienen rutina: personas activas que no son el personaje del propietario (FR-1).
export function esFamiliar(estado, id) {
  const miembro = buscarMiembro(estado, id);
  return Boolean(miembro) && miembro.tipo === 'persona' && !esPropietario(estado, miembro);
}

export const buscarBloque = (estado, id) => bloquesActivos(estado).find((b) => b.id === id) ?? null;

// Bloques activos de un horario de un familiar, ordenados por inicio (AC-1.3).
export const bloquesDe = (estado, miembroId, dias) => bloquesActivos(estado)
  .filter((b) => b.miembroId === miembroId && b.dias === dias)
  .sort((a, b) => a.inicio - b.inicio);
export const contarBloques = (estado, miembroId, dias) => bloquesDe(estado, miembroId, dias).length;
export const puedeAgregarBloque = (estado, miembroId, dias) => contarBloques(estado, miembroId, dias) < LIMITE_BLOQUES;

// Valida inicio, fin y lugar de un bloque del horario `dias` de `miembroId` (FR-1). `idExcluido` es el bloque que se edita,
// que no se superpone consigo mismo. Devuelve { error } o { datos } listos para guardar.
function validarBloque(estado, miembroId, dias, datos, idExcluido) {
  const { inicio, fin } = datos;
  const espacioId = datos.espacioId ?? null;
  if (!esMinuto(inicio, 0, MINUTOS_DIA - PASO_RUTINA) || !esMinuto(fin, PASO_RUTINA, MINUTOS_DIA)) return { error: 'hora' };
  if (fin <= inicio) return { error: 'fin' };
  if (espacioId !== null && !buscarEspacio(estado, espacioId)) return { error: 'lugar' };
  const choca = bloquesDe(estado, miembroId, dias).some((b) => b.id !== idExcluido && seSuperponen(b, { inicio, fin }));
  if (choca) return { error: 'superpuesto' };
  return { datos: { inicio, fin, espacioId } };
}

export function agregarBloque(estado, datos, ctx) {
  if (!esFamiliar(estado, datos.miembroId)) return { ok: false, error: 'familiar', estado };
  if (!enLista(DIAS_RUTINA, datos.dias)) return { ok: false, error: 'dias', estado };
  if (!puedeAgregarBloque(estado, datos.miembroId, datos.dias)) return { ok: false, error: 'limite', estado };
  const v = validarBloque(estado, datos.miembroId, datos.dias, datos, null);
  if (v.error) return { ok: false, error: v.error, estado };
  const bloque = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, miembroId: datos.miembroId, dias: datos.dias, ...v.datos, ...auditoriaNueva(ctx),
  };
  return { ok: true, estado: { ...estado, bloques: [...estado.bloques, bloque] } };
}

// Editar cambia inicio, fin y lugar; el familiar y el horario de un bloque no cambian (FR-8).
export function editarBloque(estado, id, datos, ctx) {
  const bloque = buscarBloque(estado, id);
  if (!bloque) return { ok: false, error: 'no-encontrado', estado };
  const v = validarBloque(estado, bloque.miembroId, bloque.dias, datos, id);
  if (v.error) return { ok: false, error: v.error, estado };
  const bloques = estado.bloques.map((b) => (b.id === id ? { ...tocar(b, ctx), ...v.datos } : b));
  return { ok: true, estado: { ...estado, bloques } };
}

// Borrado lógico (FR-8): el registro queda con su fecha de eliminación; no afecta a nada más.
export function eliminarBloque(estado, id, ctx) {
  if (!buscarBloque(estado, id)) return estado;
  const ahora = ctx.ahora();
  const bloques = estado.bloques.map((b) => (b.id === id ? { ...tocar(b, ctx), eliminadoEn: ahora } : b));
  return { ...estado, bloques };
}

export const MENSAJES_BLOQUE = {
  familiar: 'Solo los familiares tienen rutina.',
  dias: 'Elige Lun–Vie o Sáb–Dom.',
  limite: 'Este horario ya tiene 8 bloques.',
  hora: 'Elige el inicio y el fin de la lista.',
  fin: 'El fin debe ser posterior al inicio.',
  lugar: 'Elige un lugar de la lista.',
  superpuesto: 'Se superpone con otro bloque de este horario.',
  'no-encontrado': 'Ese bloque ya no existe.',
};

// ---------- Textos ----------

const dos = (n) => String(n).padStart(2, '0');

// Hora "HH:MM" de un minuto del día; el final del día se muestra como 24:00 (AC-1.3).
export const textoHora = (minutos) => `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;

// Fila de la lista de la rutina: "09:00–18:00 · Fuera de casa" o "09:00–18:00 · <nombre del espacio>" (AC-1.3).
export function textoBloque(estado, bloque) {
  const lugar = bloque.espacioId === null ? 'Fuera de casa' : nombreVisible(estado, buscarEspacio(estado, bloque.espacioId));
  return `${textoHora(bloque.inicio)}–${textoHora(bloque.fin)} · ${lugar}`;
}

// Aviso de las confirmaciones de eliminar un espacio o un familiar: nombra solo lo que se elimina (AC-10.1, AC-10.2, AC-10.7).
export function textoBajas(actividades, bloques) {
  const partes = [];
  if (actividades > 0) partes.push(actividades === 1 ? '1 actividad' : `${actividades} actividades`);
  if (bloques > 0) partes.push(bloques === 1 ? '1 bloque de rutina' : `${bloques} bloques de rutina`);
  if (partes.length === 0) return '';
  return `Se eliminará${actividades + bloques === 1 ? '' : 'n'} ${partes.join(' y ')}.`;
}
