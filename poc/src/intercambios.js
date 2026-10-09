// src/intercambios.js
// Intercambios de actividades (feature 005): operaciones puras sobre `estado.intercambios` (ADR-005 de intercambios). La vigencia
// no se guarda: sale de comparar la marca `actualizadoEn` de las dos actividades con la que tenían al proponer.
import { LIMITE_INTERCAMBIOS } from './catalogo.js';
import { actividadesPendientes, miembrosActivos, auditoriaNueva, tocar } from './hogar.js';
import { buscarActividad } from './actividades.js';

const esPersona = (estado, id) => miembrosActivos(estado).some((m) => m.id === id && m.tipo === 'persona');
const nombreDe = (estado, id) => estado.miembros.find((m) => m.id === id)?.nombre ?? ''; // también de los eliminados
const nombreDeActividad = (estado, id) => estado.actividades.find((a) => a.id === id)?.nombre ?? '';
const rechazo = (estado, error) => ({ ok: false, error, estado });

export const buscarIntercambio = (estado, id) => estado.intercambios.find((i) => i.id === id) ?? null;
const pendiente = (estado, id) => {
  const i = buscarIntercambio(estado, id);
  return i && i.estado === 'pendiente' ? i : null;
};

// Vigente (FR-10): pendiente, con sus dos actividades pendientes y sin ningún cambio desde que se propuso.
export function esVigente(estado, i) {
  if (i.estado !== 'pendiente') return false;
  const ofrecida = buscarActividad(estado, i.actividadOfrecidaId);
  const pedida = buscarActividad(estado, i.actividadPedidaId);
  return Boolean(ofrecida) && Boolean(pedida) && ofrecida.actualizadoEn === i.marcaOfrecida && pedida.actualizadoEn === i.marcaPedida;
}

export const intercambiosVigentes = (estado) => estado.intercambios.filter((i) => esVigente(estado, i));
export const numeroRecibidas = (estado, personaId) => intercambiosVigentes(estado).filter((i) => i.destinatarioId === personaId).length;

// Las propuestas pendientes de una persona para el panel (FR-8): las que recibió y las que envió, vigentes o no, en el orden en que se crearon.
export function intercambiosDe(estado, personaId) {
  const pendientes = estado.intercambios.filter((i) => i.estado === 'pendiente');
  return {
    recibidas: pendientes.filter((i) => i.destinatarioId === personaId),
    enviadas: pendientes.filter((i) => i.proponenteId === personaId),
  };
}

// Actividades que están en una propuesta vigente (una actividad está a lo sumo en una).
function actividadesEnPropuestas(estado) {
  const ids = new Set();
  for (const i of intercambiosVigentes(estado)) {
    ids.add(i.actividadOfrecidaId);
    ids.add(i.actividadPedidaId);
  }
  return ids;
}

// Se pueden ofrecer las pendientes de quien propone, y pedir las pendientes de otras personas (nunca las de una mascota); ninguna
// que ya esté en una propuesta vigente ni una repetitiva con regreso pendiente (FR-7).
export function actividadesOfrecibles(estado, personaId) {
  const usadas = actividadesEnPropuestas(estado);
  return actividadesPendientes(estado).filter((a) => a.miembroId === personaId && !a.devolverA && !usadas.has(a.id));
}

export function actividadesPedibles(estado, personaId) {
  const usadas = actividadesEnPropuestas(estado);
  return actividadesPendientes(estado)
    .filter((a) => a.miembroId !== personaId && esPersona(estado, a.miembroId) && !a.devolverA && !usadas.has(a.id));
}

// Por qué "Proponer" está desactivado (AC-6.6, AC-6.7): 'limite' si ya hay 20 propuestas vigentes; 'nada' si no hay qué ofrecer o qué pedir.
export function motivoSinPropuesta(estado, personaId) {
  if (intercambiosVigentes(estado).length >= LIMITE_INTERCAMBIOS) return 'limite';
  if (actividadesOfrecibles(estado, personaId).length === 0 || actividadesPedibles(estado, personaId).length === 0) return 'nada';
  return null;
}

export function proponer(estado, datos, ctx) {
  const { proponenteId, ofrecidaId, pedidaId } = datos;
  if (!esPersona(estado, proponenteId)) return rechazo(estado, 'proponente');
  const ofrecida = buscarActividad(estado, ofrecidaId);
  const pedida = buscarActividad(estado, pedidaId);
  if (!ofrecida || !pedida) return rechazo(estado, 'no-pendiente');
  if (ofrecida.miembroId !== proponenteId) return rechazo(estado, 'ofrecida-ajena');
  if (pedida.miembroId === proponenteId) return rechazo(estado, 'pedida-propia');
  if (!esPersona(estado, pedida.miembroId)) return rechazo(estado, 'pedida-mascota');
  const usadas = actividadesEnPropuestas(estado);
  if (usadas.has(ofrecida.id) || usadas.has(pedida.id)) return rechazo(estado, 'ya-en-propuesta');
  if (ofrecida.devolverA || pedida.devolverA) return rechazo(estado, 'regreso');
  if (intercambiosVigentes(estado).length >= LIMITE_INTERCAMBIOS) return rechazo(estado, 'limite');
  const intercambio = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, proponenteId, destinatarioId: pedida.miembroId,
    actividadOfrecidaId: ofrecida.id, actividadPedidaId: pedida.id, marcaOfrecida: ofrecida.actualizadoEn, marcaPedida: pedida.actualizadoEn,
    estado: 'pendiente', respondidoEn: null, ...auditoriaNueva(ctx),
  };
  return { ok: true, estado: { ...estado, intercambios: [...estado.intercambios, intercambio] } };
}

// Deja la propuesta en su estado final, con la fecha en que se respondió; su registro no se borra (FR-13).
function cerrar(estado, id, nuevoEstado, ctx) {
  const ahora = ctx.ahora();
  const intercambios = estado.intercambios.map((i) => (i.id === id ? { ...tocar(i, ctx), estado: nuevoEstado, respondidoEn: ahora } : i));
  return { ...estado, intercambios };
}

// Aceptar (FR-9): solo la destinataria y solo una propuesta vigente. Cada actividad pasa a la persona responsable de la otra; una
// repetitiva recuerda a su responsable original, una puntual no.
export function aceptar(estado, id, respondeId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (i.destinatarioId !== respondeId) return rechazo(estado, 'destinataria');
  if (!esVigente(estado, i)) return rechazo(estado, 'no-vigente');
  const ofrecida = buscarActividad(estado, i.actividadOfrecidaId);
  const pedida = buscarActividad(estado, i.actividadPedidaId);
  const regreso = (a) => (a.tipo === 'repetitiva' ? a.miembroId : null);
  const nuevos = new Map([
    [ofrecida.id, { miembroId: pedida.miembroId, devolverA: regreso(ofrecida) }],
    [pedida.id, { miembroId: ofrecida.miembroId, devolverA: regreso(pedida) }],
  ]);
  const actividades = estado.actividades.map((a) => (nuevos.has(a.id) ? { ...tocar(a, ctx), ...nuevos.get(a.id) } : a));
  return { ok: true, estado: cerrar({ ...estado, actividades }, id, 'aceptado', ctx) };
}

export function rechazar(estado, id, respondeId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (i.destinatarioId !== respondeId) return rechazo(estado, 'destinataria');
  if (!esVigente(estado, i)) return rechazo(estado, 'no-vigente');
  return { ok: true, estado: cerrar(estado, id, 'rechazado', ctx) };
}

export function retirar(estado, id, quienId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (i.proponenteId !== quienId) return rechazo(estado, 'autor');
  if (!esVigente(estado, i)) return rechazo(estado, 'no-vigente');
  return { ok: true, estado: cerrar(estado, id, 'retirado', ctx) };
}

// Quitar (AC-7.8): solo una propuesta que dejó de ser vigente, por cualquiera de sus dos personas. Queda rechazada si la quita la
// destinataria y retirada si la quita quien propuso.
export function quitar(estado, id, quienId, ctx) {
  const i = pendiente(estado, id);
  if (!i) return rechazo(estado, 'no-encontrado');
  if (quienId !== i.destinatarioId && quienId !== i.proponenteId) return rechazo(estado, 'participante');
  if (esVigente(estado, i)) return rechazo(estado, 'sigue-vigente');
  return { ok: true, estado: cerrar(estado, id, quienId === i.destinatarioId ? 'rechazado' : 'retirado', ctx) };
}

export const MENSAJES_INTERCAMBIO = {
  proponente: 'Solo una persona del hogar puede proponer un intercambio.',
  'ofrecida-ajena': 'La actividad que ofreces debe ser tuya.',
  'pedida-propia': 'Pide una actividad de otra persona.',
  'pedida-mascota': 'Las actividades de las mascotas no se intercambian.',
  'no-pendiente': 'Una de las actividades ya no está pendiente.',
  'ya-en-propuesta': 'Una de las actividades ya está en otra propuesta vigente.',
  regreso: 'Una repetitiva que volverá a su responsable no se puede intercambiar.',
  limite: 'Ya hay 20 propuestas vigentes',
  'no-encontrado': 'Esa propuesta ya no está pendiente.',
  destinataria: 'Solo la persona a quien se propuso puede responder.',
  autor: 'Solo quien propuso puede retirarla.',
  'no-vigente': 'Esa propuesta ya no está vigente.',
  participante: 'Solo las dos personas de la propuesta pueden quitarla.',
  'sigue-vigente': 'Esa propuesta sigue vigente.',
};

// ---------- Textos ----------

// Nota de una repetitiva que está con otra persona y volverá a su responsable original (AC-8.6); '' si no la tiene.
export const textoIntercambio = (estado, actividad) => (actividad.devolverA ? `por intercambio (vuelve a ${nombreDe(estado, actividad.devolverA)})` : '');

// Fila del panel (AC-7.1, AC-7.4): la propuesta vista por quien la recibe ('recibida') o por quien la hizo ('enviada').
export function textoPropuesta(estado, i, vista) {
  const ofrecida = nombreDeActividad(estado, i.actividadOfrecidaId);
  const pedida = nombreDeActividad(estado, i.actividadPedidaId);
  return vista === 'recibida'
    ? `${nombreDe(estado, i.proponenteId)} te ofrece «${ofrecida}» por «${pedida}»`
    : `Ofreciste «${ofrecida}» a ${nombreDe(estado, i.destinatarioId)} por «${pedida}»`;
}
