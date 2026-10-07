// src/hogar.js
import { TIPOS, ETIQUETAS, LIMITES, ADMITE_BANO, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES } from './catalogo.js';

const MAX_NOMBRE = 20;
const PATRON_AUTOMATICO = new RegExp(
  `^(${Object.values(ETIQUETAS).map((e) => e.toLocaleLowerCase('es')).join('|')}) \\d+$`,
);

const normalizar = (texto) => texto.trim().toLocaleLowerCase('es');

export function auditoriaNueva(ctx) {
  const ahora = ctx.ahora();
  return { creadoEn: ahora, actualizadoEn: ahora, creadoPor: ctx.cuentaId, actualizadoPor: ctx.cuentaId, eliminadoEn: null };
}

export function tocar(registro, ctx) {
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
  // El personaje del propietario es una persona sin parentesco ni género (ADR-002 de modelo de miembros).
  const miembro = {
    id: ctx.nuevoId(), hogarId, nombre: 'Personaje 1', cuentaId,
    tipo: 'persona', parentesco: null, genero: null, especie: null, ...a(),
  };
  // Documento versión 4 (ADR-004 de modelo de rutinas): el hogar empieza sin actividades ni bloques de rutina.
  return {
    version: 4, cuentas: [cuenta], hogares: [hogar], membresias: [membresia], espacios, miembros: [miembro], actividades: [], bloques: [],
  };
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

// Qué pasaría al eliminar este espacio (para decidir si se pide confirmación). `actividades` cuenta las pendientes
// que se eliminarían con él, incluidas las de su baño interno si se elimina con él (FR-9 de la 003).
export function consecuenciasDeEliminar(estado, id) {
  const espacio = buscarEspacio(estado, id);
  const bano = espacio ? banoDe(estado, espacio.id) : null;
  const banoSeElimina = Boolean(bano) && siguienteDestinoBano(estado, id) === null;
  return {
    tieneNombrePersonalizado: Boolean(espacio?.nombrePersonalizado),
    banoSeElimina,
    banoSeMueve: Boolean(bano) && !banoSeElimina,
    actividades: pendientesDeEspacios(estado, banoSeElimina ? [id, bano.id] : [id]),
  };
}

export const requiereConfirmacion = (estado, id) => {
  const c = consecuenciasDeEliminar(estado, id);
  return c.tieneNombrePersonalizado || c.banoSeElimina || c.actividades > 0;
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
  // Baja en cascada de las actividades del espacio y, si se elimina con él, de su baño interno (FR-9 de la 003).
  const eliminados = bano && !destino ? [id, bano.id] : [id];
  resultado = darDeBajaActividades(resultado, (a) => eliminados.includes(a.espacioId), ahora, ctx);
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

// Reglas de nombre de miembro (FR-9 de la 001, FR-3 de la 002): sin espacios en los extremos, 1–20 caracteres,
// único sin distinguir mayúsculas entre los miembros activos (propietario, familiares y mascotas).
function validarNombreMiembro(estado, texto, idExcluido) {
  const nombre = texto.trim();
  if (nombre === '') return { error: 'vacio' };
  if (nombre.length > MAX_NOMBRE) return { error: 'largo' };
  const repetido = miembrosActivos(estado).some((m) => m.id !== idExcluido && normalizar(m.nombre) === normalizar(nombre));
  if (repetido) return { error: 'duplicado' };
  return { nombre };
}

export function renombrarMiembro(estado, id, texto, ctx) {
  const v = validarNombreMiembro(estado, texto, id);
  if (v.error) return { ok: false, error: v.error, estado };
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), nombre: v.nombre } : m));
  return { ok: true, estado: { ...estado, miembros } };
}

// ---------- Habitantes (feature 002) ----------

const cuentaPropietaria = (estado) =>
  estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId ?? null;

// El personaje del propietario es el miembro vinculado a la cuenta propietaria; no es un habitante.
export const esPropietario = (estado, miembro) => miembro.cuentaId !== null && miembro.cuentaId === cuentaPropietaria(estado);
export const buscarMiembro = (estado, id) => miembrosActivos(estado).find((m) => m.id === id) ?? null;
export const familiares = (estado) => miembrosActivos(estado).filter((m) => m.tipo === 'persona' && !esPropietario(estado, m));
export const mascotas = (estado) => miembrosActivos(estado).filter((m) => m.tipo === 'mascota');
export const habitantes = (estado) => [...familiares(estado), ...mascotas(estado)];
export const contarHabitantes = (estado, clase) => (clase === 'familiar' ? familiares(estado) : mascotas(estado)).length;
export const puedeAgregarHabitante = (estado, clase) => contarHabitantes(estado, clase) < LIMITES_HABITANTES[clase];

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);

// Datos obligatorios según la clase (FR-2): familiar → parentesco y género; mascota → especie.
function validarDatos(clase, datos) {
  if (clase === 'familiar') {
    if (!enLista(PARENTESCOS, datos.parentesco)) return 'parentesco';
    if (!enLista(GENEROS, datos.genero)) return 'genero';
    return null;
  }
  return enLista(ESPECIES, datos.especie) ? null : 'especie';
}

const datosDeClase = (clase, datos) => (clase === 'familiar'
  ? { tipo: 'persona', parentesco: datos.parentesco, genero: datos.genero, especie: null }
  : { tipo: 'mascota', parentesco: null, genero: null, especie: datos.especie });

export function agregarHabitante(estado, clase, datos, ctx) {
  if (!puedeAgregarHabitante(estado, clase)) return { ok: false, error: 'limite', estado };
  const v = validarNombreMiembro(estado, datos.nombre ?? '', null);
  if (v.error) return { ok: false, error: v.error, estado };
  const errorDatos = validarDatos(clase, datos);
  if (errorDatos) return { ok: false, error: errorDatos, estado };
  const miembro = {
    id: ctx.nuevoId(), hogarId: estado.hogares[0].id, nombre: v.nombre, cuentaId: null,
    ...datosDeClase(clase, datos), ...auditoriaNueva(ctx),
  };
  return { ok: true, estado: { ...estado, miembros: [...estado.miembros, miembro] } };
}

export function editarHabitante(estado, id, datos, ctx) {
  const miembro = buscarMiembro(estado, id);
  if (!miembro || esPropietario(estado, miembro)) return { ok: false, error: 'no-editable', estado };
  const clase = miembro.tipo === 'mascota' ? 'mascota' : 'familiar';
  const v = validarNombreMiembro(estado, datos.nombre ?? '', id);
  if (v.error) return { ok: false, error: v.error, estado };
  const errorDatos = validarDatos(clase, datos);
  if (errorDatos) return { ok: false, error: errorDatos, estado };
  const miembros = estado.miembros.map((m) => (m.id === id
    ? { ...tocar(m, ctx), nombre: v.nombre, ...datosDeClase(clase, datos) }
    : m));
  return { ok: true, estado: { ...estado, miembros } };
}

export function puedeEliminarMiembro(estado, id) {
  const miembro = buscarMiembro(estado, id);
  return Boolean(miembro) && !esPropietario(estado, miembro);
}

// Borrado lógico (FR-4, FR-10 de la 002): el registro queda con su fecha de eliminación; no afecta a los espacios
// ni a los demás miembros. Sus actividades se dan de baja en la misma operación (FR-9 de la 003).
export function eliminarHabitante(estado, id, ctx) {
  if (!puedeEliminarMiembro(estado, id)) return estado;
  const ahora = ctx.ahora();
  const miembros = estado.miembros.map((m) => (m.id === id ? { ...tocar(m, ctx), eliminadoEn: ahora } : m));
  return darDeBajaActividades({ ...estado, miembros }, (a) => a.miembroId === id, ahora, ctx);
}

// ---------- Actividades (feature 003): consultas y bajas en cascada ----------

// Pendiente: no eliminada y, si es puntual, todavía no hecha (FR-2 de la 003). Las repetitivas nunca tienen `hechaEn`.
export const actividadesPendientes = (estado) => estado.actividades.filter((a) => a.eliminadoEn === null && a.hechaEn === null);
export const pendientesDeEspacios = (estado, ids) => actividadesPendientes(estado).filter((a) => ids.includes(a.espacioId)).length;
export const pendientesDeMiembro = (estado, id) => actividadesPendientes(estado).filter((a) => a.miembroId === id).length;

// Baja lógica, con la misma fecha, de todas las actividades no eliminadas (pendientes y hechas) que cumplen `afectada` (FR-9 de la 003).
function darDeBajaActividades(estado, afectada, ahora, ctx) {
  const actividades = estado.actividades.map((a) => (a.eliminadoEn === null && afectada(a) ? { ...tocar(a, ctx), eliminadoEn: ahora } : a));
  return { ...estado, actividades };
}

// ---------- Bloques de rutina (feature 004): consultas ----------

export const bloquesActivos = (estado) => estado.bloques.filter((b) => b.eliminadoEn === null);
export const bloquesDeEspacios = (estado, ids) => bloquesActivos(estado).filter((b) => ids.includes(b.espacioId)).length;
export const bloquesDeMiembro = (estado, id) => bloquesActivos(estado).filter((b) => b.miembroId === id).length;

export const MENSAJES_ERROR = {
  vacio: 'El nombre no puede estar vacío.',
  largo: 'El nombre puede tener como máximo 20 caracteres.',
  duplicado: 'Ya existe otro con ese nombre.',
  'formato-automatico': 'Ese formato está reservado para los nombres automáticos (por ejemplo, "Dormitorio 3").',
  limite: 'Ya se alcanzó el límite de habitantes de esta clase.',
  parentesco: 'Elige un parentesco de la lista.',
  genero: 'Elige un género de la lista.',
  especie: 'Elige una especie de la lista.',
  'no-editable': 'El personaje del propietario solo se puede renombrar.',
};
