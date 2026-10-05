// src/hogar.js
import { TIPOS, ETIQUETAS, LIMITES, ADMITE_BANO } from './catalogo.js';

const MAX_NOMBRE = 20;
const PATRON_AUTOMATICO = new RegExp(
  `^(${Object.values(ETIQUETAS).map((e) => e.toLocaleLowerCase('es')).join('|')}) \\d+$`,
);

const normalizar = (texto) => texto.trim().toLocaleLowerCase('es');

function auditoriaNueva(ctx) {
  const ahora = ctx.ahora();
  return { creadoEn: ahora, actualizadoEn: ahora, creadoPor: ctx.cuentaId, actualizadoPor: ctx.cuentaId, eliminadoEn: null };
}

function tocar(registro, ctx) {
  return { ...registro, actualizadoEn: ctx.ahora(), actualizadoPor: ctx.cuentaId };
}

// ---------- Creación ----------

export function crearHogarInicial(ctx) {
  const cuentaId = ctx.cuentaId;
  const hogarId = ctx.nuevoId();
  const a = () => auditoriaNueva(ctx);
  const cuenta = { id: cuentaId, ...a() };
  const hogar = { id: hogarId, nombre: 'Mi hogar', ...a() };
  const membresia = { id: ctx.nuevoId(), cuentaId, hogarId, rol: 'propietario', ...a() };
  const tipos = ['sala', 'cocina', 'bano', 'dormitorio'];
  const espacios = tipos.map((tipo, i) => ({
    id: ctx.nuevoId(), hogarId, tipo, orden: 1, secuencia: i + 1,
    nombrePersonalizado: null, contenidoEn: null, ...a(),
  }));
  const miembro = { id: ctx.nuevoId(), hogarId, nombre: 'Personaje 1', cuentaId, ...a() };
  return { version: 1, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro] };
}

// ---------- Consultas ----------

export const espaciosActivos = (estado) => estado.espacios.filter((e) => e.eliminadoEn === null);
export const miembrosActivos = (estado) => estado.miembros.filter((m) => m.eliminadoEn === null);
export const buscarEspacio = (estado, id) => espaciosActivos(estado).find((e) => e.id === id) ?? null;

export function espaciosDeTipo(estado, tipo) {
  return espaciosActivos(estado).filter((e) => e.tipo === tipo).sort((a, b) => a.orden - b.orden);
}

export const banoComun = (estado) => espaciosDeTipo(estado, 'bano').find((b) => b.contenidoEn === null);
export const banosInternos = (estado) => espaciosActivos(estado).filter((e) => e.tipo === 'bano' && e.contenidoEn !== null);

// Cuartos que pueden contener baño, en el orden de FR-4.
export function cuartosEnOrden(estado) {
  return ADMITE_BANO.flatMap((tipo) => espaciosDeTipo(estado, tipo));
}

export function banoDe(estado, cuartoId) {
  return banosInternos(estado).find((b) => b.contenidoEn === cuartoId) ?? null;
}

export function siguienteDestinoBano(estado, excluirId = null) {
  return cuartosEnOrden(estado).find((c) => c.id !== excluirId && banoDe(estado, c.id) === null) ?? null;
}

export function contar(estado, tipo) {
  return espaciosDeTipo(estado, tipo).length;
}

export function limites(estado, tipo) {
  if (tipo === 'bano') return { min: 1, max: 1 + contar(estado, 'dormitorio') + contar(estado, 'oficina') };
  return LIMITES[tipo];
}

export const puedeAgregar = (estado, tipo) => contar(estado, tipo) < limites(estado, tipo).max;
export const puedeQuitar = (estado, tipo) => contar(estado, tipo) > limites(estado, tipo).min;

export function puedeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  if (!espacio) return false;
  if (espacio.tipo === 'bano') return espacio.contenidoEn !== null;
  return puedeQuitar(estado, espacio.tipo);
}

// ---------- Nombres ----------

export function nombreAutomatico(estado, espacio) {
  if (espacio.tipo === 'bano') {
    if (espacio.contenidoEn === null) return 'Baño 1';
    const internos = cuartosEnOrden(estado).map((c) => banoDe(estado, c.id)).filter(Boolean);
    return `Baño ${internos.findIndex((b) => b.id === espacio.id) + 2}`;
  }
  return `${ETIQUETAS[espacio.tipo]} ${espacio.orden}`;
}

export const nombreVisible = (estado, espacio) => espacio.nombrePersonalizado ?? nombreAutomatico(estado, espacio);

// ---------- Mutaciones ----------

function siguienteSecuencia(estado) {
  return Math.max(0, ...estado.espacios.map((e) => e.secuencia)) + 1;
}

function reemplazar(estado, cambios) {
  const porId = new Map(cambios.map((e) => [e.id, e]));
  return { ...estado, espacios: estado.espacios.map((e) => porId.get(e.id) ?? e) };
}

export function agregarEspacio(estado, tipo, ctx) {
  if (!TIPOS.includes(tipo) || !puedeAgregar(estado, tipo)) return estado;
  const hogarId = estado.hogares[0].id;
  if (tipo === 'bano') {
    const destino = siguienteDestinoBano(estado);
    const orden = contar(estado, 'bano') + 1;
    const bano = { id: ctx.nuevoId(), hogarId, tipo, orden, secuencia: siguienteSecuencia(estado),
      nombrePersonalizado: null, contenidoEn: destino.id, ...auditoriaNueva(ctx) };
    return { ...estado, espacios: [...estado.espacios, bano] };
  }
  const nuevo = { id: ctx.nuevoId(), hogarId, tipo, orden: contar(estado, tipo) + 1,
    secuencia: siguienteSecuencia(estado), nombrePersonalizado: null, contenidoEn: null, ...auditoriaNueva(ctx) };
  return { ...estado, espacios: [...estado.espacios, nuevo] };
}

// Qué pasaría al eliminar este espacio (para decidir si se pide confirmación).
export function consecuenciasDeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  const bano = espacio ? banoDe(estado, espacio.id) : null;
  return {
    tieneNombrePersonalizado: Boolean(espacio?.nombrePersonalizado),
    banoSeElimina: Boolean(bano) && siguienteDestinoBano(estado, id) === null,
    banoSeMueve: Boolean(bano) && siguienteDestinoBano(estado, id) !== null,
  };
}

export const requiereConfirmacion = (estado, id) => {
  const c = consecuenciasDeEliminar(estado, id);
  return c.tieneNombrePersonalizado || c.banoSeElimina;
};

export function eliminarEspacio(estado, id, ctx) {
  if (!puedeEliminar(estado, id)) return estado;
  const espacio = buscarEspacio(estado, id);
  const bano = banoDe(estado, id);
  const destino = bano ? siguienteDestinoBano(estado, id) : null;
  const ahora = ctx.ahora();
  const cambios = [{ ...tocar(espacio, ctx), eliminadoEn: ahora }];
  if (bano && destino) cambios.push({ ...tocar(bano, ctx), contenidoEn: destino.id });
  if (bano && !destino) cambios.push({ ...tocar(bano, ctx), eliminadoEn: ahora });
  let resultado = reemplazar(estado, cambios);
  // Recompactar el orden de los restantes del mismo tipo (solo cambia el nombre automático).
  const restantes = espaciosDeTipo(resultado, espacio.tipo);
  const reordenados = restantes.filter((e, i) => e.orden !== i + 1).map((e) => ({ ...tocar(e, ctx), orden: restantes.indexOf(e) + 1 }));
  resultado = reemplazar(resultado, reordenados);
  if (bano && !destino) {
    const banos = espaciosDeTipo(resultado, 'bano');
    resultado = reemplazar(resultado, banos.filter((b, i) => b.orden !== i + 1).map((b) => ({ ...tocar(b, ctx), orden: banos.indexOf(b) + 1 })));
  }
  return resultado;
}

export function quitarUltimo(estado, tipo, ctx) {
  if (!puedeQuitar(estado, tipo)) return estado;
  if (tipo === 'bano') {
    const masReciente = [...banosInternos(estado)].sort((a, b) => b.secuencia - a.secuencia)[0];
    return eliminarEspacio(estado, masReciente.id, ctx);
  }
  const ultimo = espaciosDeTipo(estado, tipo).at(-1);
  return eliminarEspacio(estado, ultimo.id, ctx);
}

export function ultimoDeTipo(estado, tipo) {
  if (tipo === 'bano') return [...banosInternos(estado)].sort((a, b) => b.secuencia - a.secuencia)[0] ?? null;
  return espaciosDeTipo(estado, tipo).at(-1) ?? null;
}

export function renombrarEspacio(estado, id, texto, ctx) {
  const espacio = buscarEspacio(estado, id);
  const nombre = texto.trim();
  if (nombre.length > MAX_NOMBRE) return { ok: false, error: 'largo', estado };
  if (nombre === '') return { ok: true, estado: reemplazar(estado, [{ ...tocar(espacio, ctx), nombrePersonalizado: null }]) };
  if (PATRON_AUTOMATICO.test(normalizar(nombre))) return { ok: false, error: 'formato-automatico', estado };
  const repetido = espaciosActivos(estado).some((e) => e.id !== id && normalizar(nombreVisible(estado, e)) === normalizar(nombre));
  if (repetido) return { ok: false, error: 'duplicado', estado };
  return { ok: true, estado: reemplazar(estado, [{ ...tocar(espacio, ctx), nombrePersonalizado: nombre }]) };
}

export function renombrarMiembro(estado, id, texto, ctx) {
  const nombre = texto.trim();
  if (nombre === '') return { ok: false, error: 'vacio', estado };
  if (nombre.length > MAX_NOMBRE) return { ok: false, error: 'largo', estado };
  const repetido = miembrosActivos(estado).some((m) => m.id !== id && normalizar(m.nombre) === normalizar(nombre));
  if (repetido) return { ok: false, error: 'duplicado', estado };
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), nombre } : m));
  return { ok: true, estado: { ...estado, miembros } };
}

export const MENSAJES_ERROR = {
  vacio: 'El nombre no puede estar vacío.',
  largo: 'El nombre puede tener como máximo 20 caracteres.',
  duplicado: 'Ya existe otro con ese nombre.',
  'formato-automatico': 'Ese formato está reservado para los nombres automáticos (por ejemplo, "Dormitorio 3").',
};
