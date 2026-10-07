// test/contrato-rutinas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as fechas from '../src/fechas.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as rutinas from '../src/rutinas.js';
import * as rutas from '../src/rutas.js';
import * as movimiento from '../src/movimiento.js';
import { generarDistribucion } from '../src/distribucion.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo de rutinas: horarios, paso y límite', () => {
  assert.deepEqual(catalogo.DIAS_RUTINA, { laborables: 'Lun–Vie', finde: 'Sáb–Dom' });
  assert.deepEqual([catalogo.PASO_RUTINA, catalogo.LIMITE_BLOQUES], [30, 8]);
});

test('contrato de fechas y rutinas: funciones, minutos del día y mensajes', () => {
  for (const f of ['diaDeSemana', 'minutoLocal', 'ahoraLocal']) assert.equal(typeof fechas[f], 'function', f);
  for (const f of ['esFamiliar', 'buscarBloque', 'bloquesDe', 'contarBloques', 'puedeAgregarBloque', 'agregarBloque', 'editarBloque',
    'eliminarBloque', 'textoHora', 'textoBloque', 'textoBajas', 'horarioDelDia', 'bloqueVigente', 'objetivoDe', 'objetivosDeFamiliares',
    'finDeSalida', 'textoVuelta']) {
    assert.equal(typeof rutinas[f], 'function', f);
  }
  assert.equal(rutinas.MINUTOS_DIA, 1440);
  for (const clave of ['familiar', 'dias', 'limite', 'hora', 'fin', 'lugar', 'superpuesto', 'no-encontrado']) {
    assert.equal(typeof rutinas.MENSAJES_BLOQUE[clave], 'string', clave);
  }
});

test('contrato del modelo y del almacén: consultas de bloques, hogar inicial v4 y migración', () => {
  for (const f of ['bloquesActivos', 'bloquesDeEspacios', 'bloquesDeMiembro']) assert.equal(typeof hogar[f], 'function', f);
  assert.equal(typeof almacen.migrarAV4, 'function');
  const e = hogar.crearHogarInicial(crearCtx());
  assert.deepEqual([e.version, e.bloques], [4, []]);
});

test('contrato de rutas, movimiento y entrada: funciones, fases y constantes del ADR', () => {
  for (const f of ['rutaMasCorta', 'casillasDe']) assert.equal(typeof rutas[f], 'function', f);
  for (const f of ['fijarObjetivos', 'mismoObjetivo', 'colocarHabitantes', 'avanzarHabitantes']) assert.equal(typeof movimiento[f], 'function', f);
  assert.equal(movimiento.ESPERA_MS, 1000);
  const d = generarDistribucion(hogar.crearHogarInicial(crearCtx()));
  assert.deepEqual(Object.keys(d.entrada).sort(), ['x', 'y']);
  const [h] = movimiento.colocarHabitantes(['h-1'], d, { ...d.aparicion, desde: null }, () => 0);
  assert.deepEqual([h.objetivo, h.fase, h.ruta], [{ tipo: 'libre' }, 'pasea', []]);
});
