// test/contrato-intercambios.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogo from '../src/catalogo.js';
import * as hogar from '../src/hogar.js';
import * as almacen from '../src/almacen.js';
import * as intercambios from '../src/intercambios.js';
import * as movimiento from '../src/movimiento.js';
import { crearCtx } from './ayuda.js';

test('contrato del catálogo de intercambios: estados y límite', () => {
  assert.deepEqual(Object.keys(catalogo.ESTADOS_INTERCAMBIO), ['pendiente', 'aceptado', 'rechazado', 'retirado']);
  assert.equal(catalogo.LIMITE_INTERCAMBIOS, 20);
});

test('contrato del modelo y del almacén: jugador activo, hogar inicial v7 y migración', () => {
  for (const f of ['propietarioDe', 'personasQueJuegan', 'puedeJugar', 'jugadorInicial']) assert.equal(typeof hogar[f], 'function', f);
  assert.equal(typeof almacen.migrarAV5, 'function');
  const e = hogar.crearHogarInicial(crearCtx());
  assert.deepEqual([e.version, e.intercambios], [7, []]);
});

test('contrato de los intercambios: funciones y mensajes', () => {
  for (const f of ['buscarIntercambio', 'esVigente', 'intercambiosVigentes', 'numeroRecibidas', 'intercambiosDe', 'actividadesOfrecibles',
    'actividadesPedibles', 'motivoSinPropuesta', 'proponer', 'aceptar', 'rechazar', 'retirar', 'quitar', 'textoIntercambio',
    'textoPropuesta']) {
    assert.equal(typeof intercambios[f], 'function', f);
  }
  for (const clave of ['proponente', 'ofrecida-ajena', 'pedida-propia', 'pedida-mascota', 'no-pendiente', 'ya-en-propuesta', 'regreso',
    'limite', 'no-encontrado', 'destinataria', 'autor', 'no-vigente', 'participante', 'sigue-vigente']) {
    assert.equal(typeof intercambios.MENSAJES_INTERCAMBIO[clave], 'string', clave);
  }
});

test('contrato del movimiento: cambio de jugador', () => {
  assert.equal(typeof movimiento.cambiarJugador, 'function');
});
