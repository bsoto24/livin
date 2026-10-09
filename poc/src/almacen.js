// src/almacen.js
import { crearHogarInicial, tocar } from './hogar.js';
import {
  ASPECTOS, ASPECTO_INICIAL, ESPECIES, ICONOS, FRECUENCIAS, DIAS_RUTINA, PASO_RUTINA, ESTADOS_INTERCAMBIO, MIN_ESTRELLAS, MAX_ESTRELLAS,
} from './catalogo.js';
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

// Listas cerradas hasta la versión 6 (features 002 a 006), solo para validar y migrar documentos anteriores (ADR-007 de aspecto).
const PARENTESCOS_V6 = {
  pareja: 'Pareja', hijo: 'Hijo/a', padre_madre: 'Padre o madre', hermano: 'Hermano/a', abuelo: 'Abuelo/a', otro: 'Otro familiar',
};
const GENEROS_V6 = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
const ESPECIES_V6 = { perro: 'Perro', gato: 'Gato', otro: 'Otro' };
const ASPECTO_DE_GENERO_V6 = { femenino: 'adulta', masculino: 'adulto', otro: 'neutro' };

// Reglas de los miembros desde la versión 2 (ADR-002 de modelo de miembros, FR-9 de la 002).
// Solo se validan los miembros activos: los eliminados quedan fuera de toda validación (FR-10).
function miembrosValidosV6(estado) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const activos = estado.miembros.filter((m) => m.eliminadoEn === null);
  if (!propietaria || activos.filter((m) => m.cuentaId === propietaria).length !== 1) return false;
  return activos.every((m) => {
    if (m.tipo === 'mascota') return m.parentesco === null && m.genero === null && enLista(ESPECIES_V6, m.especie);
    if (m.tipo === 'persona') return m.especie === null && nuloOEnLista(PARENTESCOS_V6, m.parentesco) && nuloOEnLista(GENEROS_V6, m.genero);
    return false;
  });
}

// Reglas de los miembros en la versión 7 (ADR-007 de aspecto, FR-14 de la 007). Solo se validan los miembros activos: una mascota
// tiene una especie de la lista y ningún aspecto; el propietario no tiene aspecto; cualquier otra persona, un aspecto de la lista.
function miembrosValidos(estado) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const activos = estado.miembros.filter((m) => m.eliminadoEn === null);
  if (!propietaria || activos.filter((m) => m.cuentaId === propietaria).length !== 1) return false;
  return activos.every((m) => {
    if (m.tipo === 'mascota') return m.aspecto === null && enLista(ESPECIES, m.especie);
    if (m.tipo === 'persona') return m.especie === null && (m.cuentaId === propietaria ? m.aspecto === null : enLista(ASPECTOS, m.aspecto));
    return false;
  });
}

// Reglas de las actividades en la versión 3 (ADR-003 de modelo de actividades, FR-11 de la 003). Desde la versión 7, el responsable debe
// ser una persona activa (`soloPersonas`, ADR-007 de aspecto). Solo se validan las no eliminadas; deben apuntar a un miembro activo y,
// si tienen espacio, a un espacio activo.
function actividadesValidas(estado, soloPersonas = false) {
  if (!Array.isArray(estado.actividades)) return false;
  const miembros = new Set(estado.miembros
    .filter((m) => m.eliminadoEn === null && (!soloPersonas || m.tipo === 'persona')).map((m) => m.id));
  const espacios = new Set(estado.espacios.filter((e) => e.eliminadoEn === null).map((e) => e.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null).every((a) => {
    if (typeof a.nombre !== 'string' || !enLista(ICONOS, a.icono) || !esFechaValida(a.vence)) return false;
    if (!miembros.has(a.miembroId) || (a.espacioId !== null && !espacios.has(a.espacioId))) return false;
    if (a.tipo === 'puntual') return a.frecuenciaDias === null && (a.hechaEn === null || esFechaValida(a.hechaEn));
    if (a.tipo === 'repetitiva') return FRECUENCIAS.includes(a.frecuenciaDias) && a.hechaEn === null;
    return false;
  });
}

const esMinuto = (n, min, max) => Number.isInteger(n) && n % PASO_RUTINA === 0 && n >= min && n <= max;

// Reglas de los bloques de rutina en la versión 4 (ADR-004 de modelo de rutinas, FR-10 de la 004). Solo se validan los no
// eliminados: horario de la lista, minutos múltiplos de 30 con el fin posterior al inicio, un familiar activo, un espacio activo
// o "Fuera de casa" (null), y sin superposición con otro bloque del mismo familiar y horario.
function bloquesValidos(estado) {
  if (!Array.isArray(estado.bloques)) return false;
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId;
  const familiares = new Set(estado.miembros
    .filter((m) => m.eliminadoEn === null && m.tipo === 'persona' && m.cuentaId !== propietaria).map((m) => m.id));
  const espacios = new Set(estado.espacios.filter((e) => e.eliminadoEn === null).map((e) => e.id));
  const activos = estado.bloques.filter((b) => b.eliminadoEn === null);
  const bienFormados = activos.every((b) => enLista(DIAS_RUTINA, b.dias) && esMinuto(b.inicio, 0, 1440 - PASO_RUTINA)
    && esMinuto(b.fin, PASO_RUTINA, 1440) && b.fin > b.inicio && familiares.has(b.miembroId)
    && (b.espacioId === null || espacios.has(b.espacioId)));
  if (!bienFormados) return false;
  return activos.every((a, i) => activos.slice(i + 1)
    .every((b) => a.miembroId !== b.miembroId || a.dias !== b.dias || a.fin <= b.inicio || b.fin <= a.inicio));
}

// Regreso pendiente en la versión 5 (ADR-005 de intercambios, FR-12 de la 005). Solo se validan las actividades no eliminadas:
// `devolverA` es null o, en una repetitiva, una persona activa distinta de su responsable.
function regresosValidos(estado) {
  const personas = new Set(estado.miembros.filter((m) => m.eliminadoEn === null && m.tipo === 'persona').map((m) => m.id));
  return estado.actividades.filter((a) => a.eliminadoEn === null)
    .every((a) => a.devolverA === null || (a.tipo === 'repetitiva' && personas.has(a.devolverA) && a.devolverA !== a.miembroId));
}

const esTexto = (valor) => typeof valor === 'string' && valor !== '';

// Propuestas en la versión 5 (ADR-005 de intercambios, FR-12 de la 005). Todas deben tener un estado de la lista; solo las
// pendientes se validan además: personas y actividades que existen en el documento (eliminadas incluidas, porque su vigencia se
// calcula) y marcas de texto. Las resueltas no se validan más.
function intercambiosValidos(estado) {
  if (!Array.isArray(estado.intercambios)) return false;
  const miembros = new Set(estado.miembros.map((m) => m.id));
  const actividades = new Set(estado.actividades.map((a) => a.id));
  return estado.intercambios.every((i) => enLista(ESTADOS_INTERCAMBIO, i.estado)
    && (i.estado !== 'pendiente' || (miembros.has(i.proponenteId) && miembros.has(i.destinatarioId)
      && actividades.has(i.actividadOfrecidaId) && actividades.has(i.actividadPedidaId)
      && esTexto(i.marcaOfrecida) && esTexto(i.marcaPedida))));
}

// Historial en la versión 6 (ADR-006 de historial, FR-8 de la 006). Todas las entradas se validan: textos no vacíos, un día real,
// referencias a una actividad, un miembro y, si lo hay, un espacio que existen en el documento (eliminados incluidos, porque las
// entradas los sobreviven), y estrellas y autora o ambas nulas o ambas presentes (un entero de 1 a 5 y un miembro del documento).
function historialValido(estado) {
  if (!Array.isArray(estado.historial)) return false;
  const miembros = new Set(estado.miembros.map((m) => m.id));
  const actividades = new Set(estado.actividades.map((a) => a.id));
  const espacios = new Set(estado.espacios.map((e) => e.id));
  return estado.historial.every((x) => esTexto(x.nombre) && esTexto(x.hechaEn) && esFechaValida(x.dia)
    && actividades.has(x.actividadId) && miembros.has(x.miembroId) && (x.espacioId === null || espacios.has(x.espacioId))
    && ((x.estrellas === null && x.calificadoPor === null)
      || (Number.isInteger(x.estrellas) && x.estrellas >= MIN_ESTRELLAS && x.estrellas <= MAX_ESTRELLAS && miembros.has(x.calificadoPor))));
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

// Migración pura v3 → v4: el hogar pasa a tener una lista de bloques de rutina, vacía.
export function migrarAV4(estado) {
  return { ...estado, version: 4, bloques: [] };
}

// Migración pura v4 → v5: ninguna actividad tiene regreso pendiente y el hogar pasa a tener una lista de intercambios, vacía.
export function migrarAV5(estado) {
  return { ...estado, version: 5, actividades: estado.actividades.map((a) => ({ ...a, devolverA: null })), intercambios: [] };
}

// Migración pura v5 → v6: el hogar pasa a tener un historial de actividades hechas, vacío.
export function migrarAV6(estado) {
  return { ...estado, version: 6, historial: [] };
}

// Migración pura v6 → v7 (ADR-007 de aspecto): `aspecto` reemplaza a `genero`, desaparece `parentesco` y las actividades no eliminadas de las
// mascotas se dan de baja. El propietario se identifica por su membresía. `reloj` devuelve la hora de la baja y solo se llama si hace falta.
export function migrarAV7(estado, reloj) {
  const propietaria = estado.membresias.find((m) => m.rol === 'propietario' && m.eliminadoEn === null)?.cuentaId ?? null;
  const mascotasActivas = new Set(estado.miembros.filter((m) => m.eliminadoEn === null && m.tipo === 'mascota').map((m) => m.id));
  const miembros = estado.miembros.map(({ genero, parentesco, ...m }) => ({
    ...m,
    aspecto: m.tipo === 'persona' && m.cuentaId !== propietaria
      ? (Object.hasOwn(ASPECTO_DE_GENERO_V6, genero) ? ASPECTO_DE_GENERO_V6[genero] : ASPECTO_INICIAL)
      : null,
  }));
  const deMascota = (a) => a.eliminadoEn === null && mascotasActivas.has(a.miembroId);
  const ahora = estado.actividades.some(deMascota) ? reloj() : null;
  const ctxBaja = { ahora: () => ahora, cuentaId: propietaria ?? estado.cuentas[0].id };
  const actividades = estado.actividades.map((a) => (deMascota(a) ? { ...tocar(a, ctxBaja), eliminadoEn: ahora } : a));
  return { ...estado, version: 7, miembros, actividades };
}

export function crearAlmacen(storage) {
  return {
    // `reloj` da la hora de la migración a la versión 7 (baja de las actividades de mascotas); solo se llama si hace falta.
    cargar(reloj) {
      try {
        const texto = storage.getItem(CLAVE_DATOS);
        if (texto === null) return { estado: null, error: null };
        const estado = JSON.parse(texto);
        if (estado?.version === 1 && tieneHogarValido(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(migrarAV4(migrarAV3(migrarAV2(estado))))), reloj), error: null };
        }
        if (estado?.version === 2 && tieneHogarValido(estado) && miembrosValidosV6(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(migrarAV4(migrarAV3(estado)))), reloj), error: null };
        }
        if (estado?.version === 3 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(migrarAV4(estado))), reloj), error: null };
        }
        if (estado?.version === 4 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)
          && bloquesValidos(estado)) {
          return { estado: migrarAV7(migrarAV6(migrarAV5(estado)), reloj), error: null };
        }
        if (estado?.version === 5 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado)) {
          return { estado: migrarAV7(migrarAV6(estado), reloj), error: null };
        }
        if (estado?.version === 6 && tieneHogarValido(estado) && miembrosValidosV6(estado) && actividadesValidas(estado)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado) && historialValido(estado)) {
          return { estado: migrarAV7(estado, reloj), error: null };
        }
        if (estado?.version === 7 && tieneHogarValido(estado) && miembrosValidos(estado) && actividadesValidas(estado, true)
          && bloquesValidos(estado) && regresosValidos(estado) && intercambiosValidos(estado) && historialValido(estado)) {
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

// Arranque de la app (FR-1 y FR-10 de la 001, FR-9 de la 002, FR-11 de la 003, FR-10 de la 004, FR-12 de la 005, FR-8 de la 006, FR-14 de la 007):
// recupera el hogar (migrándolo si es de una versión anterior) o crea el inicial.
export function iniciarSesion(almacen, ctx) {
  const { estado, error } = almacen.cargar(ctx.ahora);
  if (estado) return { estado, aviso: null };
  const nuevo = crearHogarInicial(ctx);
  almacen.guardar(nuevo);
  return { estado: nuevo, aviso: error === 'ilegible' ? 'No se pudo recuperar tu hogar guardado. Se creó un hogar nuevo.' : null };
}
