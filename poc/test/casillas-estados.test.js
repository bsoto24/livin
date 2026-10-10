// test/casillas-estados.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarEspacio, renombrarEspacio, espaciosActivos, espaciosDeTipo } from '../src/hogar.js';
import { generarDistribucion } from '../src/distribucion.js';
import { casillasLibres, objetosDelSuelo, manchasDelSuelo, moscasDelSuelo, esquinasDelEspacio } from '../src/aspecto.js';
import { arteDelMapa, ORDEN_DE_CAPAS, estadosCambiaron, TEXTURAS } from '../src/arte/casillas.js';
import { LETRAS_MUEBLE } from '../src/arte/mobiliario.js';
import { SUCIEDAD, SOBREPOSICIONES, GRUPO_DE_TIPO, TIPOS_CON_AGUA, TIPOS_CON_MOSCAS } from '../src/arte/suciedad.js';
import { crearCtx, todasLasCombinaciones } from './ayuda.js';

// Hogar con un espacio de cada tipo y dos baños internos: sala, comedor, cocina, baño común, lavandería, mascota, dormitorio, oficina y 2 baños.
function hogarCompleto() {
  const ctx = crearCtx();
  return ['comedor', 'lavanderia', 'mascota', 'oficina', 'bano', 'bano'].reduce((e, t) => agregarEspacio(e, t, ctx), crearHogarInicial(ctx));
}
const todos = (estado, valor) => new Map(espaciosActivos(estado).map((e) => [e.id, valor]));
const solo = (id, valor) => new Map([[id, valor]]);
const clave = (c) => `${c.x},${c.y}`;
// Casillas del mapa con una capa dada: [{ x, y, valor }] en orden de lectura.
const conCapa = (arte, capa) => arte.flatMap((fila, y) => fila.flatMap((celda, x) => (celda?.[capa] ? [{ x, y, valor: celda[capa] }] : [])));
const mapaDe = (e) => { const d = generarDistribucion(e); return { d, arte: (limpiezas) => arteDelMapa(e, d, limpiezas) }; };

test('AC-8.1: con todo limpio, o sin indicar estados, el arte es el de la 008 y las capas nuevas están vacías', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  assert.deepEqual(arte(todos(e, 'limpio')), arte());
  for (const fila of arte()) for (const celda of fila) {
    if (!celda) continue;
    for (const capa of ['mancha', 'sobre', 'telarana', 'objeto', 'moscas']) assert.equal(celda[capa], null, capa);
  }
  assert.deepEqual(ORDEN_DE_CAPAS.filter((c) => c !== 'base' && c !== 'mueble'), ['mancha', 'sobre', 'telarana', 'objeto', 'moscas']);
  assert.ok(d.alto > 0);
});

test('AC-2.1, AC-2.2, AC-2.3, AC-2.5, AC-2.6: los objetos son 4 y 12, en casillas libres, del grupo de su tipo, y el desastre conserva los del desorden', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const espacio of espaciosActivos(e)) {
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    const grupo = GRUPO_DE_TIPO[espacio.tipo];
    assert.deepEqual(conCapa(arte(solo(espacio.id, 'limpio')), 'objeto'), []);
    const porEstado = {};
    for (const [estado, n] of [['desordenado', 4], ['desastre', 12]]) {
      const objetos = conCapa(arte(solo(espacio.id, estado)), 'objeto');
      porEstado[estado] = objetos;
      assert.equal(objetos.length, Math.min(n, libres.size), `${espacio.tipo} ${estado}`);
      assert.equal(new Set(objetos.map(clave)).size, objetos.length);
      for (const o of objetos) assert.ok(libres.has(clave(o)), `${espacio.tipo}: objeto fuera de las casillas libres`);
      const esperados = objetosDelSuelo(d, espacio.id, estado).map((o) => ({ x: o.x, y: o.y, valor: `objeto:${grupo}:${o.variante}` }));
      assert.deepEqual(objetos.sort((a, b) => a.y - b.y || a.x - b.x), esperados.sort((a, b) => a.y - b.y || a.x - b.x));
    }
    for (const o of porEstado.desordenado) assert.ok(porEstado.desastre.some((p) => p.x === o.x && p.y === o.y && p.valor === o.valor), 'el desastre conserva el objeto');
  }
});

test('AC-2.4: el baño interno, con 4 casillas libres, muestra 4 objetos en desordenado y en desastre', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  const bano = espaciosActivos(e).find((s) => s.tipo === 'bano' && s.contenidoEn !== null);
  assert.equal(casillasLibres(d, bano.id).length, 4);
  for (const estado of ['desordenado', 'desastre']) assert.equal(conCapa(arte(solo(bano.id, estado)), 'objeto').length, 4);
});

test('AC-2.8 y AC-2.9: el pasillo no tiene arte de estado, y el comedor usa los objetos de la sala', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  assert.ok(d.pasillos.length > 0);
  const mapa = arte(todos(e, 'desastre'));
  d.espacioEn.forEach((fila, y) => fila.forEach((id, x) => {
    if (!id?.startsWith('pasillo:')) return;
    for (const capa of ['mancha', 'sobre', 'telarana', 'objeto', 'moscas']) assert.equal(mapa[y][x]?.[capa] ?? null, null, `pasillo ${x},${y} ${capa}`);
  }));
  const comedor = espaciosDeTipo(e, 'comedor')[0];
  const objetos = conCapa(arte(solo(comedor.id, 'desordenado')), 'objeto');
  assert.equal(objetos.length, 4);
  for (const o of objetos) assert.ok(o.valor.startsWith('objeto:sala:'), o.valor);
});

test('AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5: las manchas solo salen en desastre, con agua en cocina y baño, alternando tamaños y debajo del objeto', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const espacio of espaciosActivos(e)) {
    for (const estado of ['limpio', 'desordenado']) assert.deepEqual(conCapa(arte(solo(espacio.id, estado)), 'mancha'), []);
    const mapa = arte(solo(espacio.id, 'desastre'));
    const manchas = manchasDelSuelo(d, espacio.id, 'desastre');
    assert.equal(conCapa(mapa, 'mancha').length, manchas.length);
    const valores = manchas.map((c) => mapa[c.y][c.x].mancha);
    const conAgua = TIPOS_CON_AGUA.includes(espacio.tipo);
    valores.forEach((v, i) => assert.equal(v === 'mancha:agua', conAgua && i < 2, `${espacio.tipo} mancha ${i}`));
    const suciedad = valores.filter((v) => v !== 'mancha:agua');
    suciedad.forEach((v, i) => assert.equal(v, i % 2 === 0 ? 'mancha:suciedad-grande' : 'mancha:suciedad-pequena', `${espacio.tipo} suciedad ${i}`));
    const libres = new Set(casillasLibres(d, espacio.id).map(clave));
    for (const c of manchas) assert.ok(libres.has(clave(c)));
  }
  assert.ok(ORDEN_DE_CAPAS.indexOf('mancha') < ORDEN_DE_CAPAS.indexOf('objeto'));
  assert.ok(ORDEN_DE_CAPAS.indexOf('mancha') < ORDEN_DE_CAPAS.indexOf('mueble'));
});

test('AC-4.1, AC-4.5, AC-4.6: las moscas son 2 casillas solo en desastre y solo en cocina, baño y mascota, encima del objeto', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const espacio of espaciosActivos(e)) {
    for (const estado of ['limpio', 'desordenado']) assert.deepEqual(conCapa(arte(solo(espacio.id, estado)), 'moscas'), []);
    const moscas = conCapa(arte(solo(espacio.id, 'desastre')), 'moscas');
    if (!TIPOS_CON_MOSCAS.includes(espacio.tipo)) { assert.deepEqual(moscas, [], espacio.tipo); continue; }
    assert.equal(moscas.length, 2, espacio.tipo);
    assert.deepEqual(moscas.map(clave).sort(), moscasDelSuelo(d, espacio.id, 'desastre').map(clave).sort());
  }
  assert.ok(ORDEN_DE_CAPAS.indexOf('moscas') > ORDEN_DE_CAPAS.indexOf('objeto'));
});

test('AC-4.1, AC-4.2, AC-4.3, AC-4.4: las telarañas van solo en desastre, en las esquinas superiores, encima del mueble y no en la sala bajo el comedor', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  const pared = (x, y) => d.tiles[y]?.[x] === '#';
  for (const espacio of espaciosActivos(e)) {
    for (const estado of ['limpio', 'desordenado']) assert.deepEqual(conCapa(arte(solo(espacio.id, estado)), 'telarana'), []);
  }
  const mapa = arte(todos(e, 'desastre'));
  let sobreMueble = 0;
  d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
    const celda = mapa[y][x];
    if (!celda) return;
    const id = d.espacioEn[y][x];
    let esperada = null;
    if (ch !== '#' && !id?.startsWith('pasillo:') && pared(x, y - 1)) {
      if (pared(x - 1, y)) esperada = 'telarana:izquierda';
      else if (pared(x + 1, y)) esperada = 'telarana:derecha';
    }
    assert.equal(celda.telarana, esperada, `telaraña en ${x},${y}`);
    if (esperada && celda.mueble) sobreMueble++;
  }));
  assert.ok(sobreMueble > 0, 'alguna esquina está ocupada por un mueble y lleva telaraña encima');
  const sala = espaciosDeTipo(e, 'sala')[0];
  assert.deepEqual(esquinasDelEspacio(d, sala.id), []);
  assert.deepEqual(conCapa(arte(solo(sala.id, 'desastre')), 'telarana'), []);
  assert.ok(ORDEN_DE_CAPAS.indexOf('telarana') > ORDEN_DE_CAPAS.indexOf('sobre'));
});

test('AC-5.3 y AC-5.4: un mueble lleva su sobreposición solo en los estados y partes declarados; los demás se ven como en la 008', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  for (const estado of ['limpio', 'desordenado', 'desastre']) {
    const mapa = arte(todos(e, estado));
    let con = 0;
    d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      const celda = mapa[y][x];
      if (!celda) return;
      if (!LETRAS_MUEBLE.includes(ch)) { assert.equal(celda.sobre, null); return; }
      const variante = celda.mueble.split(':')[2];
      const clave = `sobre:${ch}:${variante}:${estado}`;
      if (clave in SOBREPOSICIONES) { assert.equal(celda.sobre, clave); con++; } else assert.equal(celda.sobre, null, clave);
      assert.ok(TEXTURAS[celda.mueble], 'el mueble de la 008 se conserva');
    }));
    if (estado === 'limpio') assert.equal(con, 0);
    else assert.ok(con > 0, estado);
  }
  assert.ok(ORDEN_DE_CAPAS.indexOf('sobre') === ORDEN_DE_CAPAS.indexOf('mueble') + 1);
});

test('AC-6.1 y AC-6.2: cada espacio se ve distinto en los tres estados, y el desastre conserva el desorden y suma lo suyo', () => {
  const e = hogarCompleto();
  const { d, arte } = mapaDe(e);
  const area = (mapa, id) => {
    const r = d.rects[id];
    return JSON.stringify(mapa.slice(r.y, r.y + r.h).map((fila) => fila.slice(r.x, r.x + r.w)));
  };
  for (const espacio of espaciosActivos(e)) {
    const vistas = ['limpio', 'desordenado', 'desastre'].map((estado) => area(arte(solo(espacio.id, estado)), espacio.id));
    assert.equal(new Set(vistas).size, 3, `${espacio.tipo}: los tres estados deben verse distintos`);
    const desordenado = conCapa(arte(solo(espacio.id, 'desordenado')), 'objeto');
    const desastre = conCapa(arte(solo(espacio.id, 'desastre')), 'objeto');
    for (const o of desordenado) assert.ok(desastre.some((p) => clave(p) === clave(o)));
    assert.ok(conCapa(arte(solo(espacio.id, 'desastre')), 'mancha').length > 0);
  }
});

test('AC-2.7, AC-3.6, AC-4.7: el mismo hogar y los mismos estados dan el mismo arte, también al renombrar un espacio', () => {
  const e = hogarCompleto();
  const limpiezas = new Map(espaciosActivos(e).map((s, i) => [s.id, ['limpio', 'desordenado', 'desastre'][i % 3]]));
  const a = arteDelMapa(e, generarDistribucion(e), limpiezas);
  assert.deepEqual(arteDelMapa(e, generarDistribucion(e), limpiezas), a);
  const renombrado = renombrarEspacio(e, espaciosDeTipo(e, 'cocina')[0].id, 'Cocina nueva', crearCtx()).estado;
  assert.deepEqual(arteDelMapa(renombrado, generarDistribucion(renombrado), limpiezas), a);
});

test('AC-7.5: el mundo solo se recompone si cambió el estado de algún espacio; un espacio ausente cuenta como limpio', () => {
  const antes = new Map([['a', 'limpio'], ['b', 'desordenado']]);
  assert.equal(estadosCambiaron(antes, new Map([['a', 'limpio'], ['b', 'desordenado']])), false);
  assert.equal(estadosCambiaron(antes, new Map([['b', 'desordenado']])), false); // 'a' ausente = limpio
  assert.equal(estadosCambiaron(new Map(), new Map([['a', 'limpio']])), false);
  assert.equal(estadosCambiaron(antes, new Map([['a', 'limpio'], ['b', 'desastre']])), true);
  assert.equal(estadosCambiaron(antes, new Map([['a', 'desordenado'], ['b', 'desordenado']])), true);
  assert.equal(estadosCambiaron(antes, new Map([['b', 'desordenado'], ['c', 'desastre']])), true);
  assert.equal(estadosCambiaron(antes, new Map()), true); // 'b' deja de estar desordenado
});

test('AC-8.3: los objetos, manchas y muebles sucios no cambian las colisiones ni la distribución', () => {
  const e = hogarCompleto();
  const d1 = generarDistribucion(e);
  arteDelMapa(e, d1, todos(e, 'desastre'));
  assert.deepEqual(generarDistribucion(e), d1);
});

test('Error: un espacio de un tipo sin grupo de objetos se dibuja sin objetos ni manchas pero con el resto de su estado', () => {
  const e = hogarCompleto();
  const d = generarDistribucion(e);
  const cocina = espaciosDeTipo(e, 'cocina')[0];
  // Un tipo que el catálogo de grupos no conoce (dato futuro o corrupto que el validador no atrapó).
  const sinGrupo = { ...e, espacios: e.espacios.map((s) => (s.id === cocina.id ? { ...s, tipo: 'desconocido' } : s)) };
  const mapa = arteDelMapa(sinGrupo, d, solo(cocina.id, 'desastre'));
  assert.deepEqual(conCapa(mapa, 'objeto'), []);
  assert.deepEqual(conCapa(mapa, 'mancha'), []);
  assert.ok(conCapa(mapa, 'telarana').length > 0);
});

test('Reliability: en los 7.560 mapas toda casilla tiene arte en desastre y todo lo dibujado existe, en casillas libres y sin repetir capas', () => {
  const conocidas = new Set([...Object.keys(TEXTURAS), ...Object.keys(SUCIEDAD)]);
  let total = 0;
  for (const estado of todasLasCombinaciones()) {
    const d = generarDistribucion(estado);
    const limpiezas = todos(estado, total % 3 === 0 ? 'desordenado' : 'desastre');
    const arte = arteDelMapa(estado, d, limpiezas);
    const fallos = [];
    const libres = new Set(espaciosActivos(estado).flatMap((s) => casillasLibres(d, s.id).map(clave)));
    d.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      const celda = arte[y][x];
      if (ch === ' ') { if (celda !== null) fallos.push(`vacío con arte en (${x},${y})`); return; }
      for (const capa of ORDEN_DE_CAPAS) {
        if (celda[capa] !== null && !conocidas.has(celda[capa])) fallos.push(`${capa} sin dibujo en (${x},${y}): ${celda[capa]}`);
      }
      for (const capa of ['mancha', 'objeto', 'moscas']) {
        if (celda[capa] !== null && !libres.has(clave({ x, y }))) fallos.push(`${capa} fuera de las casillas libres en (${x},${y})`);
      }
      if (ch === '#' && ORDEN_DE_CAPAS.some((c) => c !== 'base' && celda[c] !== null)) fallos.push(`pared con capas en (${x},${y})`);
    }));
    assert.deepEqual(fallos, [], `mapa ${total}`);
    if (total % 500 === 0) assert.deepEqual(arteDelMapa(estado, d, limpiezas), arte, 'no determinista');
    total++;
  }
  assert.equal(total, 7560);
});
