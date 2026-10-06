// src/fechas.js
// Fechas del calendario local como texto AAAA-MM-DD (ADR-003 de estado derivado): sin hora ni zona horaria.
const MS_POR_DIA = 86400000;
const PATRON = /^(\d{4})-(\d{2})-(\d{2})$/;
const dos = (n) => String(n).padStart(2, '0');

// Número de día (días desde el 1970-01-01) de una fecha AAAA-MM-DD, o null si no es una fecha real del calendario.
export function numeroDeDia(texto) {
  const partes = typeof texto === 'string' ? PATRON.exec(texto) : null;
  if (!partes) return null;
  const [anio, mes, dia] = partes.slice(1).map(Number);
  const instante = new Date(Date.UTC(anio, mes - 1, dia));
  if (instante.getUTCFullYear() !== anio || instante.getUTCMonth() !== mes - 1 || instante.getUTCDate() !== dia) return null;
  return instante.getTime() / MS_POR_DIA;
}

export const esFechaValida = (texto) => numeroDeDia(texto) !== null;

function textoDeDia(numero) {
  const d = new Date(numero * MS_POR_DIA);
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
}

// Fecha que resulta de sumar `dias` (puede ser negativo) a una fecha válida.
export const sumarDias = (texto, dias) => textoDeDia(numeroDeDia(texto) + dias);

// Días enteros desde `desde` hasta `hasta`: positivo si `hasta` es posterior.
export const diasEntre = (desde, hasta) => numeroDeDia(hasta) - numeroDeDia(desde);

// Día del calendario local de un instante: la presentación lo usa para obtener `hoy` (FR-10).
export const fechaLocal = (instante) => `${instante.getFullYear()}-${dos(instante.getMonth() + 1)}-${dos(instante.getDate())}`;
