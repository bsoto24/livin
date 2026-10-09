// src/historial.js
// Historial de actividades hechas y calificaciones (feature 006): operaciones y consultas puras sobre `estado.historial`
// (ADR-006 de historial). Nada derivado se guarda: el orden, el filtro y el promedio salen de las entradas.
import { LIMITE_HISTORIAL } from './catalogo.js';
import { auditoriaNueva } from './hogar.js';

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
