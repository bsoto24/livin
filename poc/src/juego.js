// src/juego.js
/* global Phaser */
import { TIPOS, ETIQUETAS } from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';

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

  // Etiquetas de nombre (FR-12): una por espacio y la del personaje; en ambos modos. Se rehacen al redibujar o cambiar el zoom.
  dibujarEtiquetas() {
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas.clear();
    const escala = 1 / this.cameras.main.zoom; // contrarresta el zoom de la cámara: tamaño constante en pantalla
    for (const e of etiquetasDeEspacios(estado, distribucion, null, null)) {
      const texto = this.add.text(e.x * TILE, e.y * TILE, e.texto, ESTILO_ETIQUETA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.etiquetas.set(e.clave, texto);
    }
    this.etiquetaPersonaje.setText(estado.miembros[0].nombre).setScale(escala);
  }

  // Por cuadro: el nombre sigue al personaje; en exploración, la etiqueta del espacio actual se desplaza a la parte visible.
  actualizarEtiquetas() {
    this.etiquetaPersonaje.setPosition(this.personaje.x, this.personaje.y - TILE * 0.75);
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
    const r = paso(distribucion, jugador, direccion);
    jugador = { x: r.x, y: r.y, direccion: r.direccion };
    posicionSinGuardar = true;
    if (!r.movio) { this.colocarPersonaje(); return; }
    moviendo = true;
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[direccion]);
    this.tweens.add({
      targets: this.personaje, x: r.x * TILE + TILE / 2, y: r.y * TILE + TILE / 2, duration: MS_POR_CASILLA, ease: 'Linear',
      onComplete: () => { moviendo = false; },
    });
  }

  update() {
    const dir = this.direccionActual();
    if (dir) this.mover(dir);
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
  mostrarExploracion(false);
  pintarPanel();
  escena().encuadrarHogar();
});

$('listo').addEventListener('click', () => {
  modo = 'exploracion';
  jugador = resolverPosicion(distribucion, posGuardada);
  guardarPosicion();
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
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10)
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
}

// ---------- Fichas ----------
let fichaActual = null;

function abrirFicha(tipo, id) {
  fichaActual = { tipo, id };
  const esEspacio = tipo === 'espacio';
  const espacio = esEspacio ? buscarEspacio(estado, id) : null;
  const miembro = esEspacio ? null : estado.miembros.find((m) => m.id === id);
  $('ficha-titulo').textContent = esEspacio ? nombreVisible(estado, espacio) : miembro.nombre;
  $('ficha-nombre').value = esEspacio ? (espacio.nombrePersonalizado ?? '') : miembro.nombre;
  $('ficha-nombre').placeholder = esEspacio ? nombreAutomatico(estado, espacio) : 'Nombre del personaje';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = esEspacio ? 'block' : 'none';
  $('ficha-eliminar').disabled = !esEspacio || !puedeEliminar(estado, id);
  $('ficha').style.display = 'flex';
}

const cerrarFicha = () => { $('ficha').style.display = 'none'; fichaActual = null; };

function tocarMapa(x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  if (x === jugador.x && y === jugador.y) { abrirFicha('miembro', estado.miembros[0].id); return; } // AC-5.6
  const clave = distribucion.espacioEn[y][x];
  if (clave && buscarEspacio(estado, clave)) abrirFicha('espacio', clave);
}

$('ficha').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const texto = $('ficha-nombre').value;
  const r = fichaActual.tipo === 'espacio'
    ? renombrarEspacio(estado, fichaActual.id, texto, ctx)
    : renombrarMiembro(estado, fichaActual.id, texto, ctx);
  if (!r.ok) { $('ficha-error').textContent = MENSAJES_ERROR[r.error]; return; }
  cerrarFicha();
  aplicar(r.estado);
});
$('ficha-nombre').addEventListener('input', () => { $('ficha-error').textContent = ''; });
$('ficha-cancelar').addEventListener('click', cerrarFicha);
$('ficha-eliminar').addEventListener('click', () => {
  const id = fichaActual.id;
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});

// ---------- Ciclo de vida ----------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && modo === 'exploracion') guardarPosicion();
});
if (inicio.aviso) avisar(inicio.aviso);
