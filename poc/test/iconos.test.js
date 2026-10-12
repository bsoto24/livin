// test/iconos.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ICONOS, ASPECTOS, ESPECIES } from '../src/catalogo.js';
import { PALETA, TAM } from '../src/arte/paleta.js';
import { TEXTURAS } from '../src/arte/casillas.js';
import { SUCIEDAD } from '../src/arte/suciedad.js';
import { CUADROS_DE_PERSONAJES, personajeDe } from '../src/arte/personajes.js';
import {
  ICONOS_DE_INTERFAZ, CLAVES_DE_ICONOS, AVATARES, claveDeIconoDeActividad, claveDeIconoDeEstado, claveDeAvatarDePersonaje, claveDeAvatar,
} from '../src/arte/iconos.js';
import { hogarDePrueba1, hogarDePrueba2 } from './hogares-de-prueba.js';

const CLAVES_ESPERADAS = [
  'pestana:espacios', 'pestana:familia', 'pestana:actividades', 'pestana:intercambios',
  'actividad:platos', 'actividad:barrer', 'actividad:ropa', 'actividad:basura', 'actividad:limpiar', 'actividad:compras', 'actividad:plantas',
  'actividad:mascota', 'actividad:otra',
  'estado:limpio', 'estado:desordenado', 'estado:desastre',
  'estrella:llena', 'estrella:vacia', 'fecha',
];

test('AC-1.1: el catálogo tiene exactamente los 19 iconos de FR-1, sin repetidos', () => {
  assert.deepEqual([...CLAVES_DE_ICONOS].sort(), [...CLAVES_ESPERADAS].sort());
  assert.equal(CLAVES_DE_ICONOS.length, 19);
  assert.equal(new Set(CLAVES_DE_ICONOS).size, 19);
});

test('AC-1.2 y AC-1.3: cada icono mide 16×16 y solo usa claves de la paleta o transparente', () => {
  for (const [clave, g] of Object.entries(ICONOS_DE_INTERFAZ)) {
    assert.equal(g.length, TAM, `${clave}: alto`);
    for (const fila of g) {
      assert.equal(fila.length, TAM, `${clave}: ancho`);
      for (const c of fila) assert.ok(c === '.' || c in PALETA, `${clave}: la clave ${c} no está en la paleta`);
    }
  }
});

test('AC-1.4: cada icono tiene píxeles de color y el contorno oscuro de la paleta', () => {
  for (const [clave, g] of Object.entries(ICONOS_DE_INTERFAZ)) {
    const texto = g.join('');
    assert.ok([...texto].some((c) => c !== '.'), `${clave}: vacío`);
    assert.ok(texto.includes('k'), `${clave}: sin contorno oscuro`);
  }
});

test('AC-1.5: los 9 iconos de actividades son distintos entre sí', () => {
  const dibujos = CLAVES_DE_ICONOS.filter((c) => c.startsWith('actividad:')).map((c) => ICONOS_DE_INTERFAZ[c].join('\n'));
  assert.equal(dibujos.length, 9);
  assert.equal(new Set(dibujos).size, 9);
});

test('AC-1.6 y AC-3.2: cada clave de ICONOS tiene su icono y una clave desconocida cae en el genérico', () => {
  for (const clave of Object.keys(ICONOS)) {
    assert.ok(Object.hasOwn(ICONOS_DE_INTERFAZ, `actividad:${clave}`), clave);
    assert.equal(claveDeIconoDeActividad(clave), `actividad:${clave}`);
  }
  assert.equal(claveDeIconoDeActividad('inexistente'), 'actividad:otra');
  assert.equal(claveDeIconoDeActividad(undefined), 'actividad:otra');
  assert.equal(claveDeIconoDeActividad(null), 'actividad:otra');
});

test('AC-1.7: los tres estados de limpieza tienen icono y son distintos entre sí', () => {
  const dibujos = ['limpio', 'desordenado', 'desastre'].map((e) => {
    assert.ok(Object.hasOwn(ICONOS_DE_INTERFAZ, claveDeIconoDeEstado(e)), e);
    return ICONOS_DE_INTERFAZ[claveDeIconoDeEstado(e)].join('\n');
  });
  assert.equal(new Set(dibujos).size, 3);
  assert.equal(claveDeIconoDeEstado('raro'), 'estado:limpio');
});

test('AC-1.8: pedir claves y avatares no modifica el catálogo y devuelve lo mismo cada vez', () => {
  const antes = JSON.stringify(ICONOS_DE_INTERFAZ);
  const estado = hogarDePrueba1();
  const m = estado.miembros[0];
  const a = [claveDeIconoDeActividad('platos'), claveDeIconoDeEstado('desastre'), claveDeAvatar(estado, m)];
  const b = [claveDeIconoDeActividad('platos'), claveDeIconoDeEstado('desastre'), claveDeAvatar(estado, m)];
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(ICONOS_DE_INTERFAZ), antes);
});

test('los iconos de la interfaz no repiten claves de los dibujos del mapa (comparten la hoja de Phaser)', () => {
  const otras = new Set([...Object.keys(TEXTURAS), ...Object.keys(SUCIEDAD), ...Object.keys(CUADROS_DE_PERSONAJES)]);
  for (const clave of CLAVES_DE_ICONOS) assert.ok(!otras.has(clave), `${clave} ya existe en la hoja`);
});

test('AC-5.1: el avatar de un miembro es el cuadro de frente en reposo de su personaje, el mismo que el del mapa', () => {
  for (const estado of [hogarDePrueba1(), hogarDePrueba2()]) {
    for (const m of estado.miembros) {
      const clave = claveDeAvatar(estado, m);
      assert.equal(clave, `personaje:${personajeDe(estado, m)}:frente:0`);
      assert.ok(Object.hasOwn(AVATARES, clave), clave);
      assert.equal(AVATARES[clave], CUADROS_DE_PERSONAJES[clave]);
    }
  }
});

test('AC-5.2: los 14 personajes tienen avatar', () => {
  const personajes = ['protagonista', ...Object.keys(ASPECTOS), ...Object.keys(ESPECIES)];
  assert.equal(personajes.length, 14);
  for (const p of personajes) {
    const clave = claveDeAvatarDePersonaje(p);
    assert.equal(clave, `personaje:${p}:frente:0`);
    assert.ok(Object.hasOwn(AVATARES, clave), clave);
  }
  assert.equal(Object.keys(AVATARES).length, 14);
});

test('AC-5.3: un aspecto o una especie fuera de las listas cae en el avatar de respaldo, sin error', () => {
  const estado = hogarDePrueba2();
  assert.equal(claveDeAvatar(estado, { tipo: 'persona', aspecto: 'zzz', cuentaId: null }), 'personaje:neutro:frente:0');
  assert.equal(claveDeAvatar(estado, { tipo: 'mascota', especie: 'dragon', cuentaId: null }), 'personaje:otro:frente:0');
  assert.equal(claveDeAvatarDePersonaje('no-existe'), 'personaje:neutro:frente:0');
});
