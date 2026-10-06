// src/almacen.js
import { crearHogarInicial } from './hogar.js';
import { PARENTESCOS, GENEROS, ESPECIES, ICONOS, FRECUENCIAS } from './catalogo.js';
import { esFechaValida } from './fechas.js';

export const CLAVE_DATOS = 'livin:datos:v1';
export const CLAVE_POSICION = 'livin:posicion:v1';

// Condiciones de la feature 001, comunes a todas las versiones del documento.
function tieneHogarValido(estado) {
  for (const lista of ['cuentas', 'hogares', 'membresias', 'espacios', 'miembros']) {
    if (!Array.isArray(estado[lista])) return false;
  }
  const activos = estado.espacios.filter((e) => e.eliminadoEn === null);
  const cuenta = (tipo) => activos.filter((e) => e.tipo === tipo).length;
  return estado.hogares.length === 1 && cuenta('sala') === 1 && cuenta('cocina') >= 1 && cuenta('dormitorio') >= 1
    && activos.filter((e) => e.tipo === 'bano' && e.contenidoEn === null).length === 1;
}

const enLista = (lista, valor) => typeof valor === 'string' && Object.hasOwn(lista, valor);
const nuloOEnLista = (lista, valor) => valor === null || enLista(lista, valor);

// Reglas de los miembros desde la versión 2 (ADR-002 de modelo de miembros, FR-9 de la 002).
// Solo se validan los miembros activos: los eliminados quedan fuera de toda validación (FR-10).
function miembrosValidos(estado) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const activos = estado.miembros.filter((m) => m.eliminadoEn === null);
  if (!propietaria || activos.filter((m) => m.cuentaId === propietaria).length !== 1) return false;
  return activos.every((m) => {
    if (m.tipo === 'mascota') return m.parentesco === null && m.genero === null && enLista(ESPECIES, m.especie);
    if (m.tipo === 'persona') return m.especie === null && nuloOEnLista(PARENTESCOS, m.parentesco) && nuloOEnLista(GENEROS, m.genero);
    return false;
  });
}

// Reglas de las actividades en la versión 3 (ADR-003 de modelo de actividades, FR-11 de la 003).
// Solo se validan las no eliminadas; deben apuntar a un miembro activo y, si tienen espacio, a un espacio activo.
function actividadesValidas(estado) {
  if (!Array.isArray(estado.actividades)) return false;
  const miembros = new Set(estado.miembros.filter((m) => m.eliminadoEn === null).map((m) => m.id));
  const espacios = new Set(estado.espacios.filter((e) => e.eliminadoEn === null).map((e) => e.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null).every((a) => {
    if (typeof a.nombre !== 'string' || !enLista(ICONOS, a.icono) || !esFechaValida(a.vence)) return false;
    if (!miembros.has(a.miembroId) || (a.espacioId !== null && !espacios.has(a.espacioId))) return false;
    if (a.tipo === 'puntual') return a.frecuenciaDias === null && (a.hechaEn === null || esFechaValida(a.hechaEn));
    if (a.tipo === 'repetitiva') return FRECUENCIAS.includes(a.frecuenciaDias) && a.hechaEn === null;
    return false;
  });
}

// Migración pura v1 → v2: todo miembro existente pasa a ser una persona sin parentesco, género ni especie.
export function migrarAV2(estado) {
  return {
    ...estado,
    version: 2,
    miembros: estado.miembros.map((m) => ({ ...m, tipo: 'persona', parentesco: null, genero: null, especie: null })),
  };
}

// Migración pura v2 → v3: el hogar pasa a tener una lista de actividades, vacía.
export function migrarAV3(estado) {
  return { ...estado, version: 3, actividades: [] };
}

export function crearAlmacen(storage) {
  return {
    cargar() {
      try {
        const texto = storage.getItem(CLAVE_DATOS);
        if (texto === null) return { estado: null, error: null };
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) return { estado: migrarAV3(migrarAV2(estado)), error: null };
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidos(estado)) return { estado: migrarAV3(estado), error: null };
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado)) {
          return { estado, error: null };
        }
        return { estado: null, error: 'ilegible' };
      } catch {
        return { estado: null, error: 'ilegible' };
      }
    },
    guardar(estado) {
      try { storage.setItem(CLAVE_DATOS, JSON.stringify(estado)); return { ok: true }; } catch { return { ok: false }; }
    },
    cargarPosicion() {
      try { return JSON.parse(storage.getItem(CLAVE_POSICION)); } catch { return null; }
    },
    guardarPosicion(posicion) {
      try { storage.setItem(CLAVE_POSICION, JSON.stringify(posicion)); return { ok: true }; } catch { return { ok: false }; }
    },
  };
}

// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002, FR-11 de la 003): recupera el hogar (migrándolo si es
// de una versión anterior) o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar();
  if (estado) return { estado, aviso: null };
  const nuevo = crearHogarInicial(ctx);
  almacen.guardar(nuevo);
  return { estado: nuevo, aviso: error === 'ilegible' ? 'No se pudo recuperar tu hogar guardado. Se creó un hogar nuevo.' : null };
}
