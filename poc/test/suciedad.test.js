// test/suciedad.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS } from '../src/catalogo.js';
import { TAM, PALETA } from '../src/arte/paleta.js';
import { EJE_DE_PIEZA } from '../src/arte/mobiliario.js';
import {
  GRUPOS, GRUPO_DE_TIPO, NOMBRES_DE_OBJETOS, OBJETOS, MANCHAS, TELARANAS, MOSCAS, SOBREPOSICIONES, SUCIEDAD,
  TIPOS_CON_AGUA, TIPOS_CON_MOSCAS, MANCHAS_DE_AGUA,
} from '../src/arte/suciedad.js';

// Mide TAM×TAM y solo usa claves de la paleta o '.'.
function verificar(nombre, g) {
  assert.equal(g.length, TAM, `${nombre}: alto`);
  for (const fila of g) {
    assert.equal(fila.length, TAM, `${nombre}: ancho`);
    for (const c of fila) assert.ok(c === '.' || c in PALETA, `${nombre}: la clave ${c} no está en la paleta`);
  }
}
const pixeles = (g) => g.join('').replace(/\./g, '').length;

test('AC-1.1: hay siete grupos de arte y cada tipo de espacio tiene uno; sala y comedor comparten el suyo', () => {
  assert.deepEqual([...GRUPOS].sort(), ['bano', 'cocina', 'dormitorio', 'lavanderia', 'mascota', 'oficina', 'sala']);
  assert.deepEqual(Object.keys(GRUPO_DE_TIPO).sort(), [...TIPOS].sort());
  for (const tipo of TIPOS) assert.ok(GRUPOS.includes(GRUPO_DE_TIPO[tipo]), tipo);
  assert.equal(GRUPO_DE_TIPO.sala, GRUPO_DE_TIPO.comedor);
  assert.equal(GRUPO_DE_TIPO.bano, 'bano');
});

test('AC-1.2 y AC-1.6: cada grupo tiene seis objetos con claves distintas y dibujos distintos, y son los de la spec', () => {
  assert.deepEqual(NOMBRES_DE_OBJETOS, {
    dormitorio: ['camiseta', 'pantalon', 'calcetin', 'zapato', 'libro', 'peluche'],
    cocina: ['olla', 'plato-sucio', 'platano', 'manzana', 'envoltura', 'pizza'],
    sala: ['control', 'cojin', 'revista', 'vaso', 'snacks', 'calcetin'],
    lavanderia: ['ropa-sucia', 'escoba', 'recogedor', 'detergente', 'calcetin', 'balde'],
    bano: ['toalla', 'papel-higienico', 'camiseta', 'patito', 'jabon', 'cepillo'],
    mascota: ['hueso', 'comida', 'plato-volcado', 'pelota', 'pelos', 'pluma'],
    oficina: ['papel', 'taza', 'hoja', 'lapicero', 'cuaderno', 'carpeta'],
  });
  for (const grupo of GRUPOS) {
    assert.equal(NOMBRES_DE_OBJETOS[grupo].length, 6, grupo);
    assert.equal(new Set(NOMBRES_DE_OBJETOS[grupo]).size, 6, grupo);
    const dibujos = [0, 1, 2, 3, 4, 5].map((i) => OBJETOS[`objeto:${grupo}:${i}`].join('\n'));
    assert.equal(new Set(dibujos).size, 6, `${grupo}: dibujos repetidos`);
  }
  assert.equal(Object.keys(OBJETOS).length, 42);
});

test('AC-1.3, AC-1.4 y AC-1.5: cada objeto mide 16×16, usa la paleta y deja ver el piso y tiene color', () => {
  for (const [clave, g] of Object.entries(OBJETOS)) {
    verificar(clave, g);
    assert.ok(g.join('').includes('.'), `${clave}: sin píxeles transparentes`);
    assert.ok(pixeles(g) > 0, `${clave}: vacío`);
  }
});

test('FR-1: las manchas, las telarañas y las moscas miden 16×16, usan la paleta y no están vacías', () => {
  assert.deepEqual(Object.keys(MANCHAS).sort(), ['mancha:agua', 'mancha:suciedad-grande', 'mancha:suciedad-pequena']);
  assert.deepEqual(Object.keys(TELARANAS).sort(), ['telarana:derecha', 'telarana:izquierda']);
  assert.deepEqual(MOSCAS, ['moscas']);
  for (const [clave, g] of Object.entries({ ...MANCHAS, ...TELARANAS, moscas: SUCIEDAD.moscas })) {
    verificar(clave, g);
    assert.ok(pixeles(g) > 0, `${clave}: vacío`);
  }
  assert.ok(pixeles(MANCHAS['mancha:suciedad-grande']) > pixeles(MANCHAS['mancha:suciedad-pequena']));
  assert.deepEqual(TELARANAS['telarana:derecha'], TELARANAS['telarana:izquierda'].map((f) => [...f].reverse().join('')));
  assert.equal(MANCHAS_DE_AGUA, 2);
  assert.deepEqual([...TIPOS_CON_AGUA].sort(), ['bano', 'cocina']);
  assert.deepEqual([...TIPOS_CON_MOSCAS].sort(), ['bano', 'cocina', 'mascota']);
});

test('AC-5.1 y AC-5.2: las sobreposiciones son exactamente las de la spec, de 16×16 y con algún píxel', () => {
  const esperadas = [
    'B:inicio:desordenado', 'B:fin:desordenado', 'B:inicio:desastre', 'B:fin:desastre',
    'K:unico:desastre',
    'L:unico:desordenado', 'L:unico:desastre',
    'M:inicio:desordenado', 'M:medio:desordenado', 'M:fin:desordenado', 'M:inicio:desastre', 'M:medio:desastre', 'M:fin:desastre',
    'T:inicio:desordenado', 'T:fin:desordenado', 'T:inicio:desastre', 'T:fin:desastre',
    'w:unico:desordenado', 'w:unico:desastre',
    'W:unico:desastre', 'U:unico:desastre',
    'P:unico:desordenado', 'P:unico:desastre',
    'E:inicio:desordenado', 'E:fin:desordenado', 'E:inicio:desastre', 'E:fin:desastre',
  ].map((k) => `sobre:${k}`);
  assert.deepEqual(Object.keys(SOBREPOSICIONES).sort(), esperadas.sort());
  for (const [clave, g] of Object.entries(SOBREPOSICIONES)) {
    verificar(clave, g);
    assert.ok(pixeles(g) > 0, `${clave}: vacía`);
  }
});

test('AC-5.6: las sobreposiciones de desordenado y desastre difieren, salvo la cama deshecha, que es la misma', () => {
  for (const [clave, g] of Object.entries(SOBREPOSICIONES)) {
    if (!clave.endsWith(':desordenado')) continue;
    const par = SOBREPOSICIONES[clave.replace(':desordenado', ':desastre')];
    if (clave.startsWith('sobre:B:')) assert.deepEqual(par, g, clave);
    else assert.notDeepEqual(par, g, clave);
  }
});

test('AC-5.5: las sobreposiciones de las partes contiguas de una pieza se unen en el borde que comparten', () => {
  const PARTES = { B: ['inicio', 'fin'], M: ['inicio', 'medio', 'fin'], T: ['inicio', 'fin'], E: ['inicio', 'fin'] };
  const fila = (g, y) => g[y];
  const columna = (g, x) => g.map((f) => f[x]).join('');
  for (const [letra, partes] of Object.entries(PARTES)) {
    for (const estado of ['desordenado', 'desastre']) {
      for (let i = 0; i + 1 < partes.length; i++) {
        const a = SOBREPOSICIONES[`sobre:${letra}:${partes[i]}:${estado}`];
        const b = SOBREPOSICIONES[`sobre:${letra}:${partes[i + 1]}:${estado}`];
        if (EJE_DE_PIEZA[letra] === 'vertical') assert.equal(fila(a, TAM - 1), fila(b, 0), `${letra} ${estado}: unión vertical`);
        else assert.equal(columna(a, TAM - 1), columna(b, 0), `${letra} ${estado}: unión horizontal`);
      }
    }
  }
});

test('FR-1: SUCIEDAD reúne todos los dibujos nuevos por clave, sin repetir claves', () => {
  const partes = [OBJETOS, MANCHAS, TELARANAS, { moscas: SUCIEDAD.moscas }, SOBREPOSICIONES];
  const total = partes.reduce((n, p) => n + Object.keys(p).length, 0);
  assert.equal(Object.keys(SUCIEDAD).length, total);
  assert.equal(total, 42 + 3 + 2 + 1 + 27);
});
