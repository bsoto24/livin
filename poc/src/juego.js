// src/juego.js
/* global Phaser */
import { TIPOS, ETIQUETAS, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES } from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';
import {
  MS_POR_PASO, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes, congelarHabitantes, ocupadasPorHabitantes,
} from './movimiento.js';

const TILE = 16;
const MS_POR_CASILLA = 250; // 4 casillas por segundo (AC-2.2)
const ZOOM_EXPLORACION = 3;
const COLOR_PISO = { sala: 0xe8dcc0, comedor: 0xe2d2b0, cocina: 0xd9e4e8, bano: 0xcfe3ea, lavanderia: 0xdde3d6,
  mascota: 0xeadfcf, dormitorio: 0xe9d6dc, oficina: 0xdcd8ea, pasillo: 0xd6d1c4 };
const COLOR_MUEBLE = { B: 0x7f77dd, n: 0x8a6d4b, S: 0x1d9e75, T: 0x8a6d4b, M: 0x8a6d4b, s: 0xa6875f, K: 0x5f5e5a,
  R: 0xb4b2a9, L: 0x888780, W: 0xffffff, w: 0xf1efe8, U: 0x85b7eb, E: 0x8a6d4b, e: 0x444441, V: 0xb4b2a9, P: 0xd85a30, o: 0xef9f27 };
const COLOR_PARED = 0x5b4a3f;
// Profundidades: mapa 0, etiquetas de espacio 5, personaje 10, nombre del personaje 20.
const PROF_ETIQUETA_ESPACIO = 5;
const PROF_PERSONAJE = 10;
const PROF_ETIQUETA_PERSONAJE = 20;
// Las etiquetas se crean siempre con este estilo fijo y se contrarrestan con setScale(1 / zoom): así se ven 1:1 en pantalla.
const ESTILO_ETIQUETA = {
  fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#2a221c',
  backgroundColor: 'rgba(242,234,211,0.85)', padding: { x: 3, y: 2 },
};
// Aspecto de los habitantes (FR-8), arte de marcador: personas de 12×14 según su género, mascotas de 8×8 según su especie.
const COLOR_FAMILIAR = { femenino: 0xe8833a, masculino: 0x3a7bd5, otro: 0x8e6bbf };
const COLOR_MASCOTA = { perro: 0x9c6b3c, gato: 0x7d7d7d, otro: 0x4f9d69 };
const COLOR_BORDE_HABITANTE = 0x2a221c;

const $ = (id) => document.getElementById(id);
// Si el navegador bloquea el almacenamiento, hasta acceder a localStorage lanza; se usa uno que siempre falla
// para que el almacén muestre el aviso y la app funcione sin persistencia.
function obtenerStorage() {
  try { return window.localStorage; } catch {
    const falla = () => { throw new Error('almacenamiento no disponible'); };
    return { getItem: falla, setItem: falla };
  }
}
const almacen = crearAlmacen(obtenerStorage());
// crypto.randomUUID solo existe en contextos seguros (https/localhost); por http en la red local se usa getRandomValues.
function nuevoUuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const ctx = { cuentaId: nuevoUuid(), nuevoId: nuevoUuid, ahora: () => new Date().toISOString() };
const inicio = iniciarSesion(almacen, ctx);
let estado = inicio.estado;
ctx.cuentaId = estado.cuentas[0].id;
let distribucion = generarDistribucion(estado);
let posGuardada = almacen.cargarPosicion();
let jugador = resolverPosicion(distribucion, posGuardada);
let modo = 'exploracion';
let moviendo = false;
let posicionSinGuardar = false;
let direccionTactil = null;
let ultimaRegeneracionMs = 0;
let jugadorDesde = null; // casilla de origen mientras el jugador da un paso: también bloquea a los habitantes (AC-5.2)
const azar = Math.random; // el movimiento recibe el azar inyectado (ADR-002 de movimiento)
function idsHabitantes() { return habitantes(estado).map((h) => h.id); }
function propietario() { return estado.miembros.find((m) => m.eliminadoEn === null && esPropietario(estado, m)); }
const casillaJugador = () => ({ x: jugador.x, y: jugador.y, desde: jugadorDesde });
let moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7: al abrir, después del jugador

function avisar(texto) {
  const caja = $('aviso');
  caja.textContent = texto;
  caja.style.display = 'block';
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => { caja.style.display = 'none'; }, 4000);
}

function guardarEstado() {
  if (!almacen.guardar(estado).ok) avisar('No se pudo guardar. Se reintentará en el próximo cambio.');
}

function guardarPosicion() {
  posGuardada = posicionRelativa(distribucion, jugador.x, jugador.y, jugador.direccion);
  posicionSinGuardar = false;
  if (!almacen.guardarPosicion(posGuardada).ok) avisar('No se pudo guardar la posición.');
}

class Escena extends Phaser.Scene {
  constructor() { super('principal'); }

  create() {
    this.mapa = this.add.graphics();
    this.etiquetas = new Map(); // clave de espacio → objeto de texto de su etiqueta (solo visuales, nunca interactivas)
    this.sprites = new Map(); // id de habitante → { cuerpo, etiqueta } (FR-8; nunca interactivos)
    this.personaje = this.add.container(0, 0, [
      this.add.rectangle(0, 0, 12, 14, 0xd4537e).setStrokeStyle(1, 0x4b1528),
      this.add.triangle(0, 5, 0, 0, 6, 0, 3, 4, 0x4b1528),
    ]).setDepth(PROF_PERSONAJE);
    this.etiquetaPersonaje = this.add.text(0, 0, '', ESTILO_ETIQUETA).setOrigin(0.5, 1).setDepth(PROF_ETIQUETA_PERSONAJE);
    this.teclas = this.input.keyboard.createCursorKeys();
    this.input.on('pointerup', (p) => { if (modo === 'edicion') tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE)); });
    this.scale.on('resize', () => (modo === 'edicion' ? this.encuadrarHogar() : null));
    this.redibujar();
    this.colocarPersonaje();
    this.seguirPersonaje();
  }

  redibujar() {
    const g = this.mapa;
    g.clear();
    const tipoDe = new Map(espaciosActivos(estado).map((e) => [e.id, e.tipo]));
    distribucion.tiles.forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (ch === ' ') return;
      const clave = distribucion.espacioEn[y][x];
      const tipo = clave?.startsWith('pasillo:') ? 'pasillo' : tipoDe.get(clave);
      if (ch === '#') g.fillStyle(COLOR_PARED);
      else g.fillStyle(COLOR_PISO[tipo] ?? 0xe8dcc0);
      g.fillRect(x * TILE, y * TILE, TILE, TILE);
      if (COLOR_MUEBLE[ch] !== undefined) {
        g.fillStyle(COLOR_MUEBLE[ch]);
        g.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
      }
    }));
    this.dibujarEtiquetas();
  }

  // Etiquetas de nombre (FR-12 de la 001, FR-8 de la 002): una por espacio, la del personaje y las de los habitantes.
  dibujarEtiquetas() {
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas.clear();
    const escala = 1 / this.cameras.main.zoom; // contrarresta el zoom de la cámara: tamaño constante en pantalla
    for (const e of etiquetasDeEspacios(estado, distribucion, null, null)) {
      const texto = this.add.text(e.x * TILE, e.y * TILE, e.texto, ESTILO_ETIQUETA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.etiquetas.set(e.clave, texto);
    }
    this.etiquetaPersonaje.setText(propietario().nombre).setScale(escala);
    this.sincronizarSprites();
  }

  // Cuerpos y nombres de los habitantes (FR-8): se rehacen desde `moviles` al redibujar o cambiar el zoom.
  sincronizarSprites() {
    for (const s of this.sprites.values()) {
      this.tweens.killTweensOf(s.cuerpo);
      s.cuerpo.destroy();
      s.etiqueta.destroy();
    }
    this.sprites.clear();
    const escala = 1 / this.cameras.main.zoom;
    for (const h of moviles) {
      const miembro = buscarMiembro(estado, h.id);
      const cuerpo = miembro.tipo === 'mascota'
        ? this.add.rectangle(0, 0, 8, 8, COLOR_MASCOTA[miembro.especie])
        : this.add.rectangle(0, 0, 12, 14, COLOR_FAMILIAR[miembro.genero ?? 'otro']);
      cuerpo.setStrokeStyle(1, COLOR_BORDE_HABITANTE).setDepth(PROF_PERSONAJE)
        .setPosition(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2);
      const etiqueta = this.add.text(cuerpo.x, cuerpo.y - TILE * 0.6, miembro.nombre, ESTILO_ETIQUETA)
        .setOrigin(0.5, 1).setScale(escala).setDepth(PROF_ETIQUETA_PERSONAJE);
      this.sprites.set(h.id, { cuerpo, etiqueta });
    }
  }

  // Por cuadro, solo en exploración: avanza el movimiento autónomo (FR-5) y anima cada paso nuevo durante MS_POR_PASO.
  moverHabitantes(dtMs) {
    if (modo !== 'exploracion') return;
    const antes = new Map(moviles.map((h) => [h.id, h]));
    moviles = avanzarHabitantes(moviles, distribucion, casillaJugador(), dtMs, azar);
    for (const h of moviles) {
      const previo = antes.get(h.id);
      const s = this.sprites.get(h.id);
      if (!s || (previo.x === h.x && previo.y === h.y)) continue;
      this.tweens.add({ targets: s.cuerpo, x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2, duration: MS_POR_PASO, ease: 'Linear' });
    }
  }

  // Por cuadro: los nombres siguen a sus personajes; en exploración, la etiqueta del espacio actual se desplaza a la parte visible.
  actualizarEtiquetas() {
    this.etiquetaPersonaje.setPosition(this.personaje.x, this.personaje.y - TILE * 0.75);
    for (const s of this.sprites.values()) s.etiqueta.setPosition(s.cuerpo.x, s.cuerpo.y - TILE * 0.6);
    if (modo !== 'exploracion') return; // en edición se ve todo el hogar: las etiquetas quedan centradas
    const v = this.cameras.main.worldView;
    const vista = { x: v.x / TILE, y: v.y / TILE, w: v.width / TILE, h: v.height / TILE };
    const medir = (texto) => {
      for (const t of this.etiquetas.values()) {
        if (t.text === texto) return { w: t.displayWidth / TILE, h: t.displayHeight / TILE };
      }
      return { w: 0, h: 0 };
    };
    for (const e of etiquetasDeEspacios(estado, distribucion, { x: jugador.x, y: jugador.y }, vista, medir)) {
      this.etiquetas.get(e.clave)?.setPosition(e.x * TILE, e.y * TILE);
    }
  }

  colocarPersonaje() {
    this.personaje.setPosition(jugador.x * TILE + TILE / 2, jugador.y * TILE + TILE / 2);
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[jugador.direccion]);
  }

  seguirPersonaje() {
    const cam = this.cameras.main;
    cam.setZoom(ZOOM_EXPLORACION);
    cam.startFollow(this.personaje, true);
    this.dibujarEtiquetas(); // la escala de las etiquetas depende del zoom
  }

  encuadrarHogar() {
    const cam = this.cameras.main;
    const altoPanel = $('panel').offsetHeight;
    const zoom = Math.min(cam.width / (distribucion.ancho * TILE), (cam.height - altoPanel) / (distribucion.alto * TILE)) * 0.95;
    cam.stopFollow();
    cam.setZoom(zoom);
    cam.centerOn((distribucion.ancho * TILE) / 2, (distribucion.alto * TILE) / 2 + altoPanel / 2 / zoom);
    this.dibujarEtiquetas();
  }

  direccionActual() {
    const t = this.teclas;
    if (t.up.isDown) return 'arriba';
    if (t.down.isDown) return 'abajo';
    if (t.left.isDown) return 'izquierda';
    if (t.right.isDown) return 'derecha';
    return direccionTactil;
  }

  mover(direccion) {
    if (moviendo || modo !== 'exploracion') return;
    const r = paso(distribucion, jugador, direccion, ocupadasPorHabitantes(moviles)); // los habitantes son obstáculos (FR-6)
    const origen = { x: jugador.x, y: jugador.y };
    jugador = { x: r.x, y: r.y, direccion: r.direccion };
    posicionSinGuardar = true;
    if (!r.movio) { this.colocarPersonaje(); return; }
    moviendo = true;
    jugadorDesde = origen;
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[direccion]);
    this.tweens.add({
      targets: this.personaje, x: r.x * TILE + TILE / 2, y: r.y * TILE + TILE / 2, duration: MS_POR_CASILLA, ease: 'Linear',
      onComplete: () => { moviendo = false; jugadorDesde = null; },
    });
  }

  update(_tiempo, deltaMs) {
    const dir = this.direccionActual();
    if (dir) this.mover(dir);
    this.moverHabitantes(deltaMs);
    this.actualizarEtiquetas();
    if (!dir && !moviendo && posicionSinGuardar && modo === 'exploracion') guardarPosicion(); // en reposo tras caminar (FR-10)
    $('depuracion').textContent = `${Math.round(this.game.loop.actualFps)} fps · regen ${ultimaRegeneracionMs.toFixed(1)} ms`;
  }
}

const juego = new Phaser.Game({
  type: Phaser.AUTO, parent: 'juego', backgroundColor: '#1d1d1d', pixelArt: true,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: Escena,
});
const escena = () => juego.scene.getScene('principal');

// ---------- Cruceta ----------
for (const boton of document.querySelectorAll('#cruceta button')) {
  const dir = boton.dataset.dir;
  boton.addEventListener('pointerdown', (ev) => { ev.preventDefault(); direccionTactil = dir; escena().mover(dir); });
  for (const fin of ['pointerup', 'pointerleave', 'pointercancel']) {
    boton.addEventListener(fin, () => { if (direccionTactil === dir) direccionTactil = null; });
  }
}

// ---------- Modo edición ----------
function mostrarExploracion(visible) {
  $('cruceta').style.display = visible ? 'grid' : 'none';
  $('editar').style.display = visible ? 'block' : 'none';
  $('panel').style.display = visible ? 'none' : 'block';
}

$('editar').addEventListener('click', () => {
  if (moviendo) return;
  guardarPosicion();
  modo = 'edicion';
  moviles = congelarHabitantes(moviles); // quietos en la casilla a la que se dirigían (AC-7.2)
  mostrarExploracion(false);
  pintarPanel();
  escena().encuadrarHogar();
});

$('listo').addEventListener('click', () => {
  modo = 'exploracion';
  jugador = resolverPosicion(distribucion, posGuardada);
  guardarPosicion();
  moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7: primero el jugador, después ellos
  mostrarExploracion(true);
  const s = escena();
  s.redibujar();
  s.colocarPersonaje();
  s.seguirPersonaje();
});

function aplicar(nuevo) {
  if (nuevo === estado) return;
  const t0 = performance.now();
  estado = nuevo;
  distribucion = generarDistribucion(estado);
  jugador = resolverPosicion(distribucion, posGuardada);
  moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10 de la 001, AC-9.2)
  s.colocarPersonaje();
  s.encuadrarHogar();
  pintarPanel();
}

function confirmarEliminacion(id) {
  if (!requiereConfirmacion(estado, id)) return true;
  const espacio = buscarEspacio(estado, id);
  const c = consecuenciasDeEliminar(estado, id);
  const partes = [`¿Eliminar "${nombreVisible(estado, espacio)}"?`];
  if (c.banoSeElimina) partes.push('También se eliminará su baño interno.');
  if (c.tieneNombrePersonalizado) partes.push('Se perderá su nombre personalizado.');
  return window.confirm(partes.join(' '));
}

function pintarPanel() {
  const cont = $('contadores');
  cont.replaceChildren();
  for (const tipo of TIPOS) {
    const fila = document.createElement('div');
    fila.className = 'fila';
    const destino = tipo === 'bano' ? siguienteDestinoBano(estado) : null;
    const pista = tipo === 'bano' && destino ? `<small>Siguiente: ${nombreVisible(estado, destino)}</small>` : '';
    fila.innerHTML = `<span>${ETIQUETAS[tipo]}${pista}</span><button aria-label="Quitar">−</button>`
      + `<span class="cuenta">${contar(estado, tipo)}</span><button aria-label="Agregar">+</button>`;
    const [menos, mas] = fila.querySelectorAll('button');
    menos.disabled = !puedeQuitar(estado, tipo);
    mas.disabled = !puedeAgregar(estado, tipo);
    menos.addEventListener('click', () => {
      const objetivo = ultimoDeTipo(estado, tipo);
      if (objetivo && confirmarEliminacion(objetivo.id)) aplicar(quitarUltimo(estado, tipo, ctx));
    });
    mas.addEventListener('click', () => aplicar(agregarEspacio(estado, tipo, ctx)));
    cont.append(fila);
  }
  pintarHabitantes();
}

// Sección "Habitantes" del panel (FR-4, AC-7.1): contador "n de límite" y botón "+" por clase.
function pintarHabitantes() {
  const cont = $('habitantes');
  cont.replaceChildren();
  for (const [clase, titulo] of [['familiar', 'Familiares'], ['mascota', 'Mascotas']]) {
    const fila = document.createElement('div');
    fila.className = 'fila habitante';
    fila.innerHTML = `<span>${titulo}</span><span class="cuenta">${contarHabitantes(estado, clase)} de ${LIMITES_HABITANTES[clase]}</span>`
      + `<button aria-label="Agregar ${clase}">+</button>`;
    const mas = fila.querySelector('button');
    mas.disabled = !puedeAgregarHabitante(estado, clase);
    mas.addEventListener('click', () => abrirFichaHabitante(clase, null));
    cont.append(fila);
  }
}

// ---------- Fichas ----------
let fichaActual = null; // { tipo: 'espacio' | 'propietario' | 'habitante', id, clase? }

function llenarSelect(select, lista, valor) {
  select.replaceChildren(new Option('Elegir…', ''), ...Object.entries(lista).map(([clave, texto]) => new Option(texto, clave)));
  select.value = valor ?? '';
}

function mostrarCampos({ parentesco = false, genero = false, especie = false }) {
  $('ficha-parentesco').style.display = parentesco ? 'block' : 'none';
  $('ficha-genero').style.display = genero ? 'block' : 'none';
  $('ficha-especie').style.display = especie ? 'block' : 'none';
}

// En la ficha de un habitante, guardar se activa solo con nombre y todos sus datos elegidos (AC-1.3, AC-2.3).
function actualizarGuardar() {
  if (fichaActual?.tipo !== 'habitante') { $('ficha-guardar').disabled = false; return; }
  const datosElegidos = fichaActual.clase === 'familiar'
    ? $('ficha-parentesco').value !== '' && $('ficha-genero').value !== ''
    : $('ficha-especie').value !== '';
  $('ficha-guardar').disabled = $('ficha-nombre').value.trim() === '' || !datosElegidos;
}

// Ficha de un espacio o del personaje del propietario (como en la 001: solo renombrar; Eliminar solo en espacios).
function abrirFicha(tipo, id) {
  fichaActual = { tipo, id };
  const esEspacio = tipo === 'espacio';
  const espacio = esEspacio ? buscarEspacio(estado, id) : null;
  const miembro = esEspacio ? null : buscarMiembro(estado, id);
  $('ficha-titulo').textContent = esEspacio ? nombreVisible(estado, espacio) : miembro.nombre;
  $('ficha-nombre').value = esEspacio ? (espacio.nombrePersonalizado ?? '') : miembro.nombre;
  $('ficha-nombre').placeholder = esEspacio ? nombreAutomatico(estado, espacio) : 'Nombre del personaje';
  mostrarCampos({});
  $('ficha-guardar').textContent = 'Renombrar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = esEspacio ? 'block' : 'none';
  $('ficha-eliminar').disabled = !esEspacio || !puedeEliminar(estado, id);
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

// Ficha de un habitante (FR-4): alta si `id` es null; edición si no. Familiar: nombre, parentesco y género; mascota: nombre y especie.
function abrirFichaHabitante(clase, id) {
  fichaActual = { tipo: 'habitante', id, clase };
  const miembro = id ? buscarMiembro(estado, id) : null;
  const familiar = clase === 'familiar';
  $('ficha-titulo').textContent = miembro ? miembro.nombre : (familiar ? 'Nuevo familiar' : 'Nueva mascota');
  $('ficha-nombre').value = miembro?.nombre ?? '';
  $('ficha-nombre').placeholder = familiar ? 'Nombre del familiar' : 'Nombre de la mascota';
  llenarSelect($('ficha-parentesco'), PARENTESCOS, miembro?.parentesco);
  llenarSelect($('ficha-genero'), GENEROS, miembro?.genero);
  llenarSelect($('ficha-especie'), ESPECIES, miembro?.especie);
  mostrarCampos(familiar ? { parentesco: true, genero: true } : { especie: true });
  $('ficha-guardar').textContent = 'Guardar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = miembro ? 'block' : 'none';
  $('ficha-eliminar').disabled = !miembro;
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

const cerrarFicha = () => { $('ficha').style.display = 'none'; fichaActual = null; };

// Prioridad al tocar una casilla (FR-4): personaje del propietario, luego habitante, luego espacio (AC-7.3, AC-7.4).
function tocarMapa(x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  if (x === jugador.x && y === jugador.y) { abrirFicha('propietario', propietario().id); return; }
  const habitante = moviles.find((h) => h.x === x && h.y === y);
  if (habitante) {
    const miembro = buscarMiembro(estado, habitante.id);
    abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
    return;
  }
  const clave = distribucion.espacioEn[y][x];
  if (clave && buscarEspacio(estado, clave)) abrirFicha('espacio', clave);
}

$('ficha').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const { tipo, id, clase } = fichaActual;
  const texto = $('ficha-nombre').value;
  let r;
  if (tipo === 'espacio') r = renombrarEspacio(estado, id, texto, ctx);
  else if (tipo === 'propietario') r = renombrarMiembro(estado, id, texto, ctx);
  else {
    const datos = { nombre: texto, parentesco: $('ficha-parentesco').value, genero: $('ficha-genero').value, especie: $('ficha-especie').value };
    r = id ? editarHabitante(estado, id, datos, ctx) : agregarHabitante(estado, clase, datos, ctx);
  }
  if (!r.ok) { $('ficha-error').textContent = MENSAJES_ERROR[r.error]; return; }
  cerrarFicha();
  aplicar(r.estado);
});
$('ficha-nombre').addEventListener('input', () => { $('ficha-error').textContent = ''; actualizarGuardar(); });
for (const campo of ['ficha-parentesco', 'ficha-genero', 'ficha-especie']) $(campo).addEventListener('change', actualizarGuardar);
$('ficha-cancelar').addEventListener('click', cerrarFicha);
$('ficha-eliminar').addEventListener('click', () => {
  const { tipo, id } = fichaActual;
  if (tipo === 'habitante') {
    if (!window.confirm(`¿Eliminar a "${buscarMiembro(estado, id).nombre}"?`)) return; // AC-8.1, AC-8.2
    cerrarFicha();
    aplicar(eliminarHabitante(estado, id, ctx));
    return;
  }
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});

// ---------- Ciclo de vida ----------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && modo === 'exploracion') guardarPosicion();
});
if (inicio.aviso) avisar(inicio.aviso);
