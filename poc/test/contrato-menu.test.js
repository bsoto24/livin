// test/contrato-menu.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as actividades from '../src/actividades.js';
import * as almacen from '../src/almacen.js';
import * as formularios from '../src/formularios.js';
import * as secciones from '../src/secciones.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo: aspectos, especies y sugerencias', () => {
  assert.deepEqual(Object.keys(catalogo.ASPECTOS), ['adulto', 'adulta', 'nino', 'nina', 'anciano', 'anciana', 'neutro']);
  assert.deepEqual(Object.keys(catalogo.DATOS_ASPECTO), Object.keys(catalogo.ASPECTOS));
  assert.deepEqual(Object.values(catalogo.DATOS_ASPECTO).map((d) => d.icono), ['👨', '👩', '👦', '👧', '👴', '👵', '🧑']);
  assert.equal(catalogo.ASPECTO_INICIAL, 'neutro');
  assert.deepEqual(Object.keys(catalogo.ESPECIES), ['perro', 'gato', 'conejo', 'hamster', 'loro', 'otro']);
  assert.deepEqual(Object.keys(catalogo.DATOS_ESPECIE), Object.keys(catalogo.ESPECIES));
  assert.deepEqual(Object.values(catalogo.DATOS_ESPECIE).map((d) => d.icono), ['🐶', '🐱', '🐰', '🐹', '🦜', '🐾']);
  assert.equal(catalogo.ESPECIE_INICIAL, 'otro');
  assert.equal(catalogo.PARENTESCOS, undefined);
  assert.equal(catalogo.GENEROS, undefined);
  assert.equal(catalogo.SUGERENCIAS.length, 10);
  assert.equal(catalogo.SUGERENCIAS_INICIALES, 6);
  assert.equal(catalogo.ICONO_GENERICO, 'otra');
});

test('contrato del modelo y del almacén: hogar inicial v7, mensajes y migración', () => {
  const e = hogar.crearHogarInicial(crearCtx());
  assert.equal(e.version, 7);
  assert.deepEqual([e.miembros[0].aspecto, 'genero' in e.miembros[0], 'parentesco' in e.miembros[0]], [null, false, false]);
  assert.equal(typeof hogar.MENSAJES_ERROR.aspecto, 'string');
  assert.equal(hogar.MENSAJES_ERROR.parentesco, undefined);
  assert.equal(hogar.MENSAJES_ERROR.genero, undefined);
  assert.equal(typeof almacen.migrarAV7, 'function');
});

test('contrato de las actividades: varios lugares y responsables personas', () => {
  assert.equal(typeof actividades.agregarActividades, 'function');
  assert.equal(actividades.MENSAJES_ACTIVIDAD.mascota, 'Las mascotas no pueden encargarse de actividades.');
  assert.equal(actividades.MENSAJES_ACTIVIDAD['limite-varios'], 'Con estos lugares se superarían las 50 actividades pendientes.');
});

test('contrato de los módulos puros de la 007: formularios y secciones', () => {
  for (const f of ['normalizarTexto', 'sugerenciasPara', 'sugerenciaExacta', 'iconoDeFicha', 'iconoDeEdicion', 'datosDeRecurrencia',
    'valorDeRecurrencia', 'etiquetaDeRecurrencia', 'resumenDeFicha', 'inicialDe']) {
    assert.equal(typeof formularios[f], 'function', f);
  }
  assert.ok(Array.isArray(formularios.OPCIONES_RECURRENCIA));
  assert.deepEqual(secciones.SECCIONES.map((s) => s.clave), ['espacios', 'familia', 'actividades', 'intercambios']);
  for (const f of ['textoPestana', 'accionDeToque']) assert.equal(typeof secciones[f], 'function', f);
});
