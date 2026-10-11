// test/colores.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETA } from '../src/arte/paleta.js';
import {
  ROLES, VELO, variablesDeColor, contraste, PARES_DE_TEXTO, COLORES_DEL_MAPA, numeroDeColor,
} from '../src/arte/colores.js';

test('AC-7.1: hay una variable por clave de la paleta, con exactamente su color', () => {
  const v = variablesDeColor();
  for (const [clave, color] of Object.entries(PALETA)) assert.equal(v[`--c-${clave}`], color);
  assert.equal(Object.keys(v).filter((n) => n.startsWith('--c-')).length, 32);
});

test('AC-7.1: cada rol es una variable con el color de su clave, y el velo es el contorno con alfa', () => {
  const v = variablesDeColor();
  for (const [rol, clave] of Object.entries(ROLES)) {
    assert.ok(clave in PALETA, `${rol}: ${clave} no está en la paleta`);
    assert.equal(v[`--${rol}`], PALETA[clave]);
  }
  assert.equal(VELO.clave, 'k');
  assert.equal(VELO.alfa, 0.55);
  assert.equal(v['--velo'], 'rgba(46, 34, 51, 0.55)');
});

test('AC-7.1: la función es pura: mismo resultado en cada llamada y acepta otra paleta', () => {
  assert.deepEqual(variablesDeColor(), variablesDeColor());
  const otra = { ...PALETA, k: '#000000' };
  assert.equal(variablesDeColor(otra)['--c-k'], '#000000');
  assert.equal(variablesDeColor(otra)['--fondo'], '#000000');
  assert.equal(variablesDeColor(otra)['--velo'], 'rgba(0, 0, 0, 0.55)');
  assert.equal(PALETA.k, '#2e2233');
});

test('contraste de WCAG: negro sobre blanco 21 a 1, y simétrico', () => {
  assert.equal(contraste('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(contraste('#ffffff', '#000000'), contraste('#000000', '#ffffff'));
});

test('AC-7.7: cada par de texto y fondo de la interfaz cumple 4,5 a 1', () => {
  const paresHtml = PARES_DE_TEXTO.filter(([f]) => !f.startsWith('etiqueta') && !f.startsWith('cartel') && f !== 'resalte');
  assert.ok(paresHtml.length >= 8);
  for (const [fondo, texto] of paresHtml) {
    const c = contraste(PALETA[ROLES[fondo]], PALETA[ROLES[texto]]);
    assert.ok(c >= 4.5, `${texto} sobre ${fondo}: ${c.toFixed(2)}`);
  }
});

test('AC-7.9: el texto del mapa (etiqueta, cartel y resalte) cumple 4,5 a 1', () => {
  const paresMapa = PARES_DE_TEXTO.filter(([f]) => f.startsWith('etiqueta') || f.startsWith('cartel') || f === 'resalte');
  assert.equal(paresMapa.length, 3);
  for (const [fondo, texto] of paresMapa) {
    const c = contraste(PALETA[ROLES[fondo]], PALETA[ROLES[texto]]);
    assert.ok(c >= 4.5, `${texto} sobre ${fondo}: ${c.toFixed(2)}`);
  }
});

test('AC-7.8: los colores del mapa son los de la paleta y no los marrones de antes', () => {
  assert.deepEqual(COLORES_DEL_MAPA, {
    fondo: '#2e2233', etiquetaFondo: '#eadfcf', etiquetaTx: '#2e2233', cartelFondo: '#2e2233', cartelTx: '#f4f1ea', resalte: '#f2c14e',
    burbujaFondo: '#f4f1ea', burbujaBorde: '#2e2233',
  });
  for (const color of Object.values(COLORES_DEL_MAPA)) assert.ok(Object.values(PALETA).includes(color), color);
  assert.equal(numeroDeColor('#2e2233'), 0x2e2233);
});
