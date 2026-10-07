// test/distribucion.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { crearHogarInicial, agregarEspacio, eliminarEspacio, espaciosDeTipo, espaciosActivos, banoDe, banoComun, cuartosEnOrden } from '../src/hogar.js';
import { generarDistribucion, esTransitable } from '../src/distribucion.js';
import { paso } from '../src/posicion.js';
import { crearCtx } from './ayuda.js';

const agregar = (estado, ctx, ...tipos) => tipos.reduce((e, t) => agregarEspacio(e, t, ctx), estado);
const VECINOS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function alcanzables(d) {
  const visto = new Set([`${d.aparicion.x},${d.aparicion.y}`]);
  const cola = [d.aparicion];
  while (cola.length) {
    const { x, y } = cola.shift();
    for (const [dx, dy] of VECINOS) {
      const k = `${x + dx},${y + dy}`;
      if (!visto.has(k) && esTransitable(d, x + dx, y + dy)) { visto.add(k); cola.push({ x: x + dx, y: y + dy }); }
    }
  }
  return visto;
}

const seCruzan = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const contiene = (a, b) => b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;

// Verifica FR-3 y FR-5 sobre una distribución (Reliability, criterio exhaustivo).
function verificarMapa(estado) {
  const d = generarDistribucion(estado);
  const visto = alcanzables(d);
  for (let y = 0; y < d.alto; y++) for (let x = 0; x < d.ancho; x++) {
    if (esTransitable(d, x, y)) assert.ok(visto.has(`${x},${y}`), `casilla aislada ${x},${y}`);
  }
  for (const p of d.puertas) assert.ok(visto.has(`${p.x},${p.y}`), `puerta bloqueada ${p.x},${p.y}`);
  const activos = espaciosActivos(estado);
  for (const e of activos) {
    const r = d.rects[e.id];
    assert.ok(r, `sin rect ${e.tipo}`);
    let alcanzable = false;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (d.espacioEn[y][x] === e.id && visto.has(`${x},${y}`)) alcanzable = true;
    }
    assert.ok(alcanzable, `inalcanzable ${e.tipo}`);
  }
  const externos = activos.filter((e) => !(e.tipo === 'bano' && e.contenidoEn)).map((e) => d.rects[e.id]);
  const cajas = [...externos, ...d.pasillos];
  for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) {
    assert.ok(!seCruzan(cajas[i], cajas[j]), 'piezas superpuestas');
  }
  for (const b of activos.filter((e) => e.tipo === 'bano' && e.contenidoEn)) {
    assert.ok(contiene(d.rects[b.contenidoEn], d.rects[b.id]), 'baño fuera de su cuarto');
    const r = d.rects[b.id];
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (!esTransitable(d, x, y)) continue;
      for (const [dx, dy] of VECINOS) {
        if (!esTransitable(d, x + dx, y + dy)) continue;
        const vecino = d.espacioEn[y + dy][x + dx];
        assert.ok(vecino === b.id || vecino === b.contenidoEn, 'baño accesible desde fuera de su cuarto');
      }
    }
  }
  // Entrada (AC-9.1, AC-9.2 de la 004): casilla transitable de la pared inferior de la sala, bajo la aparición, alcanzable y que no
  // lleva a ninguna parte. Como el mapa es conexo, desde ella se llega a cada espacio.
  const salaId = espaciosDeTipo(estado, 'sala')[0].id;
  const sala = d.rects[salaId];
  assert.deepEqual(d.entrada, { x: d.aparicion.x, y: sala.y + sala.h - 1 });
  assert.equal(d.espacioEn[d.entrada.y][d.entrada.x], salaId);
  assert.ok(visto.has(`${d.entrada.x},${d.entrada.y}`), 'entrada inalcanzable');
  for (let x = sala.x; x < sala.x + sala.w; x++) {
    assert.equal(esTransitable(d, x, d.entrada.y), x === d.entrada.x, `pared inferior de la sala en x=${x}`);
  }
  assert.equal(esTransitable(d, d.entrada.x, d.entrada.y + 1), false, 'la entrada lleva fuera del hogar');
  assert.deepEqual(generarDistribucion(estado), d, 'no determinista');
}

function* todasLasCombinaciones() {
  for (const comedor of [0, 1]) for (const cocinas of [1, 2]) for (const lav of [0, 1, 2]) for (const masc of [0, 1, 2])
    for (const dorms of [1, 2, 3, 4]) for (const ofis of [0, 1, 2]) {
      const ctx = crearCtx();
      let base = crearHogarInicial(ctx);
      base = agregar(base, ctx, ...Array(comedor).fill('comedor'), ...Array(cocinas - 1).fill('cocina'),
        ...Array(lav).fill('lavanderia'), ...Array(masc).fill('mascota'), ...Array(dorms - 1).fill('dormitorio'), ...Array(ofis).fill('oficina'));
      const cuartos = cuartosEnOrden(base);
      base = agregar(base, ctx, ...Array(cuartos.length).fill('bano'));
      for (let mascara = 0; mascara < 2 ** cuartos.length; mascara++) {
        let e = base;
        cuartos.forEach((c, i) => { if (!(mascara & (1 << i))) e = eliminarEspacio(e, banoDe(e, c.id).id, ctx); });
        yield e;
      }
    }
}

test('Reliability: todas las combinaciones generan mapas correctos y navegables', () => {
  let total = 0;
  for (const estado of todasLasCombinaciones()) { verificarMapa(estado); total++; }
  assert.equal(total, 7560);
});

test('AC-1.3: distribución inicial sin pasillos', () => {
  const e = crearHogarInicial(crearCtx());
  const d = generarDistribucion(e);
  const r = (tipo) => d.rects[espaciosDeTipo(e, tipo)[0].id];
  assert.ok(r('cocina').x + r('cocina').w <= r('sala').x);
  assert.ok(r('bano').x + r('bano').w <= r('sala').x);
  assert.ok(r('dormitorio').x >= r('sala').x + r('sala').w);
  assert.equal(d.pasillos.length, 0);
});

test('AC-3.5: el comedor queda encima de la sala sin pared entre ambos', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'comedor', ctx);
  const d = generarDistribucion(e);
  const com = d.rects[espaciosDeTipo(e, 'comedor')[0].id];
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  assert.equal(com.y + com.h, sala.y);
  assert.equal(com.x, sala.x);
  for (let x = sala.x + 1; x < sala.x + sala.w - 1; x++) {
    assert.ok(esTransitable(d, x, sala.y - 1), `pared entre comedor y sala en x=${x} (última fila del comedor)`);
    assert.ok(esTransitable(d, x, sala.y), `pared entre comedor y sala en x=${x} (primera fila de la sala)`);
  }
  assert.ok(esTransitable(d, sala.x + 1, sala.y - 1) && esTransitable(d, sala.x + 1, sala.y));
});

test('AC-3.6: con más de 2 espacios en una zona aparece un pasillo', () => {
  const ctx = crearCtx();
  let e = agregarEspacio(crearHogarInicial(ctx), 'dormitorio', ctx);
  assert.equal(generarDistribucion(e).pasillos.length, 0);
  e = agregarEspacio(e, 'oficina', ctx);
  const d = generarDistribucion(e);
  assert.deepEqual(d.pasillos.map((p) => p.lado), ['der']);
  const pasillo = d.pasillos[0];
  for (const c of [...espaciosDeTipo(e, 'dormitorio'), ...espaciosDeTipo(e, 'oficina')]) {
    const r = d.rects[c.id];
    const puerta = d.puertas.find((p) => p.x === r.x && p.y >= r.y && p.y < r.y + r.h);
    assert.ok(puerta, 'cuarto sin puerta');
    assert.equal(d.espacioEn[puerta.y][puerta.x - 1], `pasillo:der`);
    assert.equal(puerta.x - 1, pasillo.x + pasillo.w - 1);
  }
});

test('AC-3.6 (zona izquierda): con más de 2 espacios aparece el pasillo izquierdo', () => {
  const ctx = crearCtx();
  // Hogar inicial: cocina + baño común = 2 espacios de servicio → sin pasillo izquierdo.
  const inicial = crearHogarInicial(ctx);
  assert.deepEqual(generarDistribucion(inicial).pasillos.map((p) => p.lado), []);

  // Cocina, cocina, baño común = 3 espacios de servicio → pasillo izquierdo (y la zona privada sigue sin pasillo).
  const e = agregarEspacio(inicial, 'cocina', ctx);
  const d = generarDistribucion(e);
  assert.deepEqual(d.pasillos.map((p) => p.lado), ['izq']);
  const pasillo = d.pasillos[0];
  const servicio = [...espaciosDeTipo(e, 'cocina'), banoComun(e)];
  assert.equal(servicio.length, 3);
  for (const s of servicio) {
    const r = d.rects[s.id];
    const xPared = r.x + r.w - 1;
    const puerta = d.puertas.find((p) => p.x === xPared && p.y >= r.y && p.y < r.y + r.h);
    assert.ok(puerta, 'espacio de servicio sin puerta en su pared derecha');
    assert.equal(d.espacioEn[puerta.y][puerta.x + 1], 'pasillo:izq');
    assert.equal(puerta.x + 1, pasillo.x, 'la puerta da a la columna del pasillo contigua a las piezas');
    assert.equal(esTransitable(d, puerta.x, puerta.y), true);
    assert.equal(esTransitable(d, puerta.x + 1, puerta.y), true);
  }
  // El pasillo queda entre la zona de servicio y la sala.
  const sala = d.rects[espaciosDeTipo(e, 'sala')[0].id];
  assert.ok(pasillo.x + pasillo.w <= sala.x);
  verificarMapa(e);
});

test('AC-4.1: el baño interno tiene puerta solo hacia su cuarto', () => {
  const ctx = crearCtx();
  const e = agregarEspacio(crearHogarInicial(ctx), 'bano', ctx);
  verificarMapa(e);
  const d1 = espaciosDeTipo(e, 'dormitorio')[0];
  const bano = banoDe(e, d1.id);
  assert.ok(bano, 'Dormitorio 1 debe tener baño interno');
  const d = generarDistribucion(e);
  const cuarto = d.rects[d1.id];
  const rb = d.rects[bano.id];
  assert.ok(contiene(cuarto, rb), 'el baño está dentro de su dormitorio');
  // Ninguna casilla transitable del baño toca (4 vecinos) una casilla transitable ajena al baño o a su dormitorio.
  let casillasBano = 0;
  for (let y = rb.y; y < rb.y + rb.h; y++) for (let x = rb.x; x < rb.x + rb.w; x++) {
    if (d.espacioEn[y][x] !== bano.id || !esTransitable(d, x, y)) continue;
    casillasBano++;
    for (const [dx, dy] of VECINOS) {
      if (!esTransitable(d, x + dx, y + dy)) continue;
      const vecino = d.espacioEn[y + dy][x + dx];
      assert.ok(vecino === bano.id || vecino === d1.id, `casilla del baño ${x},${y} comunica con ${vecino}`);
    }
  }
  assert.ok(casillasBano > 0, 'el baño tiene casillas transitables');
  // La puerta del dormitorio hacia afuera (pared que mira a la sala) no está dentro del baño.
  const puertasFuera = d.puertas.filter((p) => p.x === cuarto.x && p.y >= cuarto.y && p.y < cuarto.y + cuarto.h);
  assert.ok(puertasFuera.length > 0, 'el dormitorio tiene puerta hacia afuera');
  for (const p of puertasFuera) {
    const dentroDelBano = p.x >= rb.x && p.x < rb.x + rb.w && p.y >= rb.y && p.y < rb.y + rb.h;
    assert.equal(dentroDelBano, false, `la puerta ${p.x},${p.y} del dormitorio está dentro del baño`);
  }
});

test('FR-3: orden de apilado de las zonas', () => {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'mascota', 'dormitorio', 'oficina');
  const d = generarDistribucion(e);
  const r = (espacio) => d.rects[espacio.id];
  const [cocina1, cocina2] = espaciosDeTipo(e, 'cocina');
  const servicio = [cocina1, cocina2, banoComun(e), espaciosDeTipo(e, 'lavanderia')[0], espaciosDeTipo(e, 'mascota')[0]];
  const [dorm1, dorm2] = espaciosDeTipo(e, 'dormitorio');
  const privada = [dorm1, dorm2, espaciosDeTipo(e, 'oficina')[0]];
  const comedor = r(espaciosDeTipo(e, 'comedor')[0]);
  const sala = r(espaciosDeTipo(e, 'sala')[0]);

  // Cada zona se apila de arriba hacia abajo, contigua y en una misma columna.
  for (const zona of [servicio, privada]) {
    for (let i = 0; i < zona.length; i++) {
      assert.equal(r(zona[i]).x, r(zona[0]).x, 'misma columna dentro de la zona');
      if (i > 0) assert.equal(r(zona[i]).y, r(zona[i - 1]).y + r(zona[i - 1]).h, `${zona[i].tipo} va justo debajo de ${zona[i - 1].tipo}`);
    }
  }
  assert.equal(r(servicio[0]).y, 0);
  assert.equal(r(privada[0]).y, 0);

  // Comedor directamente encima de la sala.
  assert.equal(comedor.y + comedor.h, sala.y);
  assert.equal(comedor.x, sala.x);

  // Servicio a la izquierda del centro (con 5 espacios, el pasillo izquierdo queda entre ambos); privada a la derecha (3 espacios → pasillo derecho).
  const pasillo = (lado) => d.pasillos.find((p) => p.lado === lado);
  assert.ok(pasillo('izq') && pasillo('der'));
  assert.ok(r(servicio[0]).x + r(servicio[0]).w <= pasillo('izq').x);
  assert.ok(pasillo('izq').x + pasillo('izq').w <= sala.x);
  assert.ok(sala.x + sala.w <= pasillo('der').x);
  assert.ok(pasillo('der').x + pasillo('der').w <= r(privada[0]).x);
  verificarMapa(e);
});


test('NFR rendimiento: generar el hogar más grande toma menos de 100 ms', () => {
  const ctx = crearCtx();
  let e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  e = agregar(e, ctx, ...Array(6).fill('bano'));
  const inicio = performance.now();
  generarDistribucion(e);
  assert.ok(performance.now() - inicio < 100);
});

function hogarMasGrande() {
  const ctx = crearCtx();
  const e = agregar(crearHogarInicial(ctx), ctx, 'comedor', 'cocina', 'lavanderia', 'lavanderia', 'mascota', 'mascota',
    'dormitorio', 'dormitorio', 'dormitorio', 'oficina', 'oficina');
  return agregar(e, ctx, ...Array(6).fill('bano'));
}

test('AC-9.1, AC-9.3: la entrada es la única diferencia con el mapa de las features anteriores', () => {
  const d = generarDistribucion(crearHogarInicial(crearCtx()));
  assert.deepEqual(d.entrada, { x: 13, y: 10 });
  assert.deepEqual(d.tiles, [
    '###########################',
    '#KLR...##........##.....nB#',
    '#..........SSSS..##......B#',
    '#......##.................#',
    '#......##...TT...##.......#',
    '#########....*...##.......#',
    '#########........##########',
    '#WwU...##........#         ',
    '#................#         ',
    '#......##........#         ',
    '#############.####         ',
  ]);
  const grande = generarDistribucion(hogarMasGrande());
  assert.deepEqual([grande.entrada, grande.ancho, grande.alto], [{ x: 16, y: 11 }, 33, 40]);
  assert.equal(grande.tiles[11], '#########.######.#####.##....####');
  assert.equal(grande.tiles[12], '#########.#          #.##.......#');
});

test('AC-9.5, FR-12: el jugador puede pisar la entrada pero no salir por ella', () => {
  for (const estado of [crearHogarInicial(crearCtx()), hogarMasGrande()]) {
    const d = generarDistribucion(estado);
    const r = paso(d, { x: d.entrada.x, y: d.entrada.y - 1 }, 'abajo');
    assert.deepEqual([r.x, r.y, r.movio], [d.entrada.x, d.entrada.y, true]);
    assert.deepEqual(paso(d, d.entrada, 'abajo'), { x: d.entrada.x, y: d.entrada.y, direccion: 'abajo', movio: false });
    for (const lado of ['izquierda', 'derecha']) assert.equal(paso(d, d.entrada, lado).movio, false);
  }
});

test('AC-9.3: con la entrada cerrada, las 7.560 distribuciones son idénticas a las de las features anteriores', () => {
  // Huella de las 7.560 distribuciones generadas por la feature 003 (sin entrada), con esta misma serialización.
  const HUELLA_003 = 'f3e2f4bd336a7019084a58fc35df7d5c0adbd8c005e7880d93b1e19968f77393';
  const huella = createHash('sha256');
  let total = 0;
  for (const estado of todasLasCombinaciones()) {
    const d = generarDistribucion(estado);
    const { entrada, ...resto } = d;
    const tiles = d.tiles.map((fila, y) => (y === entrada.y ? fila.slice(0, entrada.x) + '#' + fila.slice(entrada.x + 1) : fila));
    huella.update(JSON.stringify({ ...resto, tiles }));
    total++;
  }
  assert.equal(total, 7560);
  assert.equal(huella.digest('hex'), HUELLA_003);
});
