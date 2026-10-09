// src/historial.js
// Historial de actividades hechas y calificaciones (feature 006): operaciones y consultas puras sobre `estado.historial`
// (ADR-006 de historial). Nada derivado se guarda: el orden, el filtro y el promedio salen de las entradas.
import { LIMITE_HISTORIAL, MIN_ESTRELLAS, MAX_ESTRELLAS } from './catalogo.js';
import { auditoriaNueva, tocar, buscarEspacio, nombreVisible, personasQueJuegan, puedeJugar, mascotas } from './hogar.js';
import { diasEntre } from './fechas.js';

const rechazo = (estado, error) => ({ ok: false, error, estado });
const nombreDe = (estado, id) => estado.miembros.find((m) => m.id === id)?.nombre ?? ''; // también de los eliminados
const estaActivo = (estado, id) => estado.miembros.some((m) => m.id === id && m.eliminadoEn === null);
const conAviso = (estado, id) => (estaActivo(estado, id) ? nombreDe(estado, id) : `${nombreDe(estado, id)} (ya no está)`);

export const buscarEntrada = (estado, id) => estado.historial.find((x) => x.id === id) ?? null;

// Agrega la entrada de un "Hecho" (FR-1) y recorta el historial a las últimas LIMITE_HISTORIAL por orden de creación (FR-2).
// `actividad` es la actividad tal como estaba antes de marcarla: su responsable de ese momento es quien recibe el crédito, aunque
// una repetitiva intercambiada vuelva después a su responsable original.
export function agregarEntrada(estado, actividad, hoy, ctx) {
  const auditoria = auditoriaNueva(ctx);
  const entrada = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, actividadId: actividad.id, miembroId: actividad.miembroId,
    espacioId: actividad.espacioId, nombre: actividad.nombre, icono: actividad.icono, hechaEn: auditoria.creadoEn, dia: hoy,
    estrellas: null, calificadoPor: null, ...auditoria,
  };
  return { ...estado, historial: [...estado.historial, entrada].slice(-LIMITE_HISTORIAL) };
}

// ---------- Consultas ----------

// De la más reciente a la más antigua (AC-2.3): el historial se guarda en orden de creación.
export const entradasDelHistorial = (estado) => [...estado.historial].reverse();
export const entradasDe = (estado, miembroId) => entradasDelHistorial(estado).filter((x) => x.miembroId === miembroId);

// Opciones del filtro (AC-3.1): el propietario, luego los familiares y luego las mascotas, todos activos.
export const miembrosDelFiltro = (estado) => [...personasQueJuegan(estado), ...mascotas(estado)];

// ---------- Textos ----------

const TEXTO_PROPIA = 'No puedes calificar tus propias actividades';

export const textoAcreditada = (estado, entrada) => conAviso(estado, entrada.miembroId);

// El espacio con su nombre actual (AC-7.3), "Espacio eliminado" si ya no existe (AC-7.4) y '' si la actividad no tenía (AC-2.4).
export function textoEspacio(estado, entrada) {
  if (entrada.espacioId === null) return '';
  const espacio = buscarEspacio(estado, entrada.espacioId);
  return espacio ? nombreVisible(estado, espacio) : 'Espacio eliminado';
}

// Día de la entrada respecto de hoy (AC-2.5); si es posterior a hoy (la fecha del teléfono se movió hacia atrás), su fecha.
export function textoDia(dia, hoy) {
  const dias = diasEntre(dia, hoy);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return dias > 1 ? `Hace ${dias} días` : dia;
}

// Línea de datos de una fila (AC-2.4): persona acreditada · espacio (si tenía) · día.
export const textoLinea = (estado, entrada, hoy) => [
  textoAcreditada(estado, entrada), textoEspacio(estado, entrada), textoDia(entrada.dia, hoy),
].filter(Boolean).join(' · ');

export function textoVacio(estado, miembroId) {
  return miembroId === null ? 'Aún no hay actividades hechas' : `${nombreDe(estado, miembroId)} no tiene actividades hechas en el historial`;
}

// ---------- Promedio ----------

// Promedio de las estrellas de las entradas calificadas de un miembro que siguen en el historial (FR-4): un decimal, coma decimal
// y las mitades hacia arriba, en aritmética entera para no depender de decimales binarios. No se guarda.
export function promedioDe(estado, miembroId) {
  const dadas = estado.historial.filter((x) => x.miembroId === miembroId && x.estrellas !== null).map((x) => x.estrellas);
  if (dadas.length === 0) return { calificadas: 0, texto: null };
  const suma = dadas.reduce((a, b) => a + b, 0);
  const decimas = Math.floor((suma * 20 + dadas.length) / (2 * dadas.length));
  return { calificadas: dadas.length, texto: `${Math.floor(decimas / 10)},${decimas % 10}` };
}

// Encabezado del filtro (AC-3.3, AC-3.4); '' con "Todos" (AC-3.6).
export function textoResumen(estado, miembroId) {
  if (miembroId === null) return '';
  const { calificadas, texto } = promedioDe(estado, miembroId);
  const nombre = nombreDe(estado, miembroId);
  return calificadas === 0 ? `${nombre}: sin calificaciones` : `${nombre}: ${texto} ★ (${calificadas} calificadas)`;
}

// ---------- Calificar ----------

// Qué puede hacer quien juega con una entrada (FR-5, FR-6):
//  'libre'     sin calificación y de otra persona: se puede calificar;
//  'propia'    sin calificación y acreditada a quien juega: no se puede calificar;
//  'mia'       la dio quien juega: la puede cambiar o quitar;
//  'bloqueada' la dio otra persona: nadie más la cambia, tampoco la persona acreditada.
export function estadoDeCalificacion(entrada, jugadorId) {
  if (entrada.calificadoPor === null) return entrada.miembroId === jugadorId ? 'propia' : 'libre';
  return entrada.calificadoPor === jugadorId ? 'mia' : 'bloqueada';
}

export function textoCalificacion(estado, entrada, jugadorId) {
  switch (estadoDeCalificacion(entrada, jugadorId)) {
    case 'mia': return 'Tu calificación';
    case 'bloqueada': return `Calificó ${conAviso(estado, entrada.calificadoPor)}`;
    case 'propia': return TEXTO_PROPIA;
    default: return '';
  }
}

const reemplazarEntrada = (estado, nueva) => ({ ...estado, historial: estado.historial.map((x) => (x.id === nueva.id ? nueva : x)) });

// Califica (o cambia la calificación de) una entrada (FR-5, FR-6). Repetir las mismas estrellas no cambia nada: se devuelve el mismo estado.
export function calificar(estado, entradaId, jugadorId, estrellas, ctx) {
  const entrada = buscarEntrada(estado, entradaId);
  if (!entrada) return rechazo(estado, 'no-encontrada');
  if (!puedeJugar(estado, jugadorId)) return rechazo(estado, 'no-persona');
  if (!Number.isInteger(estrellas) || estrellas < MIN_ESTRELLAS || estrellas > MAX_ESTRELLAS) return rechazo(estado, 'estrellas');
  if (entrada.calificadoPor !== null && entrada.calificadoPor !== jugadorId) return rechazo(estado, 'bloqueada');
  if (entrada.miembroId === jugadorId) return rechazo(estado, 'propia');
  if (entrada.estrellas === estrellas) return { ok: true, estado };
  return { ok: true, estado: reemplazarEntrada(estado, { ...tocar(entrada, ctx), estrellas, calificadoPor: jugadorId }) };
}

// Quita la calificación: solo quien la dio. La entrada queda sin estrellas y vuelve a poder calificarse.
export function quitarCalificacion(estado, entradaId, jugadorId, ctx) {
  const entrada = buscarEntrada(estado, entradaId);
  if (!entrada) return rechazo(estado, 'no-encontrada');
  if (!puedeJugar(estado, jugadorId)) return rechazo(estado, 'no-persona');
  if (entrada.calificadoPor === null) return rechazo(estado, 'sin-calificacion');
  if (entrada.calificadoPor !== jugadorId) return rechazo(estado, 'bloqueada');
  return { ok: true, estado: reemplazarEntrada(estado, { ...tocar(entrada, ctx), estrellas: null, calificadoPor: null }) };
}

export const MENSAJES_HISTORIAL = {
  'no-encontrada': 'Esa entrada ya no está en el historial.',
  'no-persona': 'Solo una persona del hogar puede calificar.',
  estrellas: 'Elige de 1 a 5 estrellas.',
  bloqueada: 'Solo quien dio la calificación puede cambiarla.',
  propia: `${TEXTO_PROPIA}.`,
  'sin-calificacion': 'Esa entrada no tiene calificación.',
};
