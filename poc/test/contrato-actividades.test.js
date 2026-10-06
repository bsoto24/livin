// test/contrato-actividades.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as fechas from '../src/fechas.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as actividades from '../src/actividades.js';
import * as aspecto from '../src/aspecto.js';

test('contrato del catálogo de actividades: listas cerradas y límites', () => {
  assert.deepEqual(Object.keys(catalogo.ICONOS), ['platos', 'barrer', 'ropa', 'basura', 'limpiar', 'compras', 'plantas', 'mascota', 'otra']);
  assert.deepEqual(Object.values(catalogo.ICONOS), ['Platos', 'Barrer', 'Ropa', 'Basura', 'Limpiar', 'Compras', 'Plantas', 'Mascota', 'Otra']);
  assert.deepEqual(catalogo.FRECUENCIAS, [1, 2, 3, 7, 14, 30]);
  assert.equal(catalogo.LIMITE_ACTIVIDADES, 50);
  assert.equal(catalogo.MAX_NOMBRE_ACTIVIDAD, 30);
});

test('contrato de fechas, actividades y estado derivado: funciones y umbrales del ADR', () => {
  for (const f of ['numeroDeDia', 'esFechaValida', 'sumarDias', 'diasEntre', 'fechaLocal']) assert.equal(typeof fechas[f], 'function', f);
  for (const f of ['buscarActividad', 'contarActividades', 'puedeAgregarActividad', 'agregarActividad', 'editarActividad',
    'eliminarActividad', 'marcarHecha', 'atraso', 'porHacer', 'limpiezaDeEspacio', 'burbujas', 'actividadesDelLugar',
    'listaDelPanel', 'textoPlazo']) {
    assert.equal(typeof actividades[f], 'function', f);
  }
  assert.deepEqual([actividades.UMBRAL_DESORDENADO, actividades.UMBRAL_DESASTRE], [1, 3]);
  for (const clave of ['vacio', 'largo', 'icono', 'miembro', 'espacio', 'tipo', 'fecha', 'frecuencia', 'limite', 'no-encontrada']) {
    assert.equal(typeof actividades.MENSAJES_ACTIVIDAD[clave], 'string', clave);
  }
});

test('contrato del modelo y del almacén: consultas de actividades, bajas en cascada y migración a v3', () => {
  for (const f of ['actividadesPendientes', 'pendientesDeEspacios', 'pendientesDeMiembro', 'auditoriaNueva', 'tocar']) {
    assert.equal(typeof hogar[f], 'function', f);
  }
  assert.equal(typeof almacen.migrarAV3, 'function');
});

test('contrato del aspecto: insignias, objetos por estado y funciones de ubicación', () => {
  assert.deepEqual(aspecto.INSIGNIAS, { limpio: '✓', desordenado: '!', desastre: '!!' });
  assert.deepEqual(aspecto.OBJETOS_POR_ESTADO, { limpio: 0, desordenado: 4, desastre: 12 });
  for (const f of ['casillasLibres', 'casillaDeBurbuja', 'objetosDelSuelo', 'ubicarBurbujas']) assert.equal(typeof aspecto[f], 'function', f);
});
