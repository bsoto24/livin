// src/formularios.js
// Lógica pura de los formularios simples (feature 007): sugerencias de actividad, icono que se puede o no cambiar, recurrencia y línea-resumen.
// No toca el DOM ni Phaser: la presentación solo pinta lo que estas funciones devuelven.
import { SUGERENCIAS, SUGERENCIAS_INICIALES, ICONO_GENERICO, FRECUENCIAS } from './catalogo.js';

// Compara sin distinguir mayúsculas, acentos ni espacios al inicio o al final (AC-8.3, AC-8.6).
export const normalizarTexto = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('es');

// Sugerencias que se ven (AC-8.2, AC-8.3): las primeras con el campo vacío; con texto, las que lo contienen.
export function sugerenciasPara(texto) {
  const buscado = normalizarTexto(texto);
  if (buscado === '') return SUGERENCIAS.slice(0, SUGERENCIAS_INICIALES);
  return SUGERENCIAS.filter((s) => normalizarTexto(s.nombre).includes(buscado));
}

export const sugerenciaExacta = (texto) => SUGERENCIAS.find((s) => normalizarTexto(s.nombre) === normalizarTexto(texto)) ?? null;

// Icono de la ficha (AC-8.5 a AC-8.11): con un texto igual a una sugerencia, el suyo y no se puede cambiar (y se descarta el elegido a mano);
// si no, el elegido a mano o el genérico, y se puede cambiar. `manual` es el icono elegido a mano, o null; el estado vive solo en la ficha.
export function iconoDeFicha(texto, manual) {
  const sugerencia = sugerenciaExacta(texto);
  if (sugerencia) return { icono: sugerencia.icono, editable: false, manual: null };
  return { icono: manual ?? ICONO_GENERICO, editable: true, manual: manual ?? null };
}

// Al abrir una actividad existente (AC-8.15): se respeta el icono guardado; solo queda fijo si el nombre ya es el de una sugerencia.
export const iconoDeEdicion = (nombre, iconoGuardado) => ({ icono: iconoGuardado, editable: sugerenciaExacta(nombre) === null, manual: iconoGuardado });

// Recurrencia (AC-9.7): un solo selector. El valor '0' es "una vez" (puntual); los demás, la frecuencia en días (repetitiva).
export const OPCIONES_RECURRENCIA = [
  ['0', 'Una vez'],
  ...FRECUENCIAS.map((dias) => [String(dias), dias === 1 ? 'Cada día' : `Cada ${dias} días`]),
];
export const datosDeRecurrencia = (valor) => (valor === '0'
  ? { tipo: 'puntual', frecuenciaDias: null }
  : { tipo: 'repetitiva', frecuenciaDias: Number(valor) });
export const valorDeRecurrencia = (actividad) => (actividad.tipo === 'puntual' ? '0' : String(actividad.frecuenciaDias));
export const etiquetaDeRecurrencia = (valor) => OPCIONES_RECURRENCIA.find(([v]) => v === valor)?.[1] ?? 'Una vez';

// Línea-resumen de la ficha (AC-9.4, AC-9.8): fecha, recurrencia y lugares (sus nombres).
export function resumenDeFicha({ vence, hoy, recurrencia, lugares }) {
  const fecha = vence === hoy ? 'Hoy' : (vence || 'Sin fecha');
  const donde = lugares.length === 0 ? 'Sin lugar' : (lugares.length === 1 ? lugares[0] : `${lugares.length} lugares`);
  return `📅 ${fecha} · ${etiquetaDeRecurrencia(recurrencia)} · ${donde}`;
}

// Inicial de un círculo de responsable (AC-9.1): la primera letra del nombre, en mayúscula.
export const inicialDe = (nombre) => [...nombre.trim()][0]?.toLocaleUpperCase('es') ?? '?';
