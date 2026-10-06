// src/juego.js
/* global Phaser */
import { TIPOS, ETIQUETAS, PARENTESCOS, GENEROS, ESPECIES, LIMITES_HABITANTES, ICONOS, FRECUENCIAS, LIMITE_ACTIVIDADES } from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante, pendientesDeMiembro,
} from './hogar.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';
import {
  MS_POR_PASO, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes, congelarHabitantes, ocupadasPorHabitantes,
} from './movimiento.js';
import {
  contarActividades, puedeAgregarActividad, buscarActividad, agregarActividad, editarActividad, eliminarActividad, marcarHecha,
  limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo, MENSAJES_ACTIVIDAD,
} from './actividades.js';
import { INSIGNIAS, objetosDelSuelo, casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';
import { fechaLocal } from './fechas.js';

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
// Actividades (FR-5 y FR-6 de la 003), arte de marcador: iconos como emoji del sistema y objetos como cuadrados de colores.
const GLIFO_ICONO = { platos: '🍽️', barrer: '🧹', ropa: '🧺', basura: '🗑️', limpiar: '🧽', compras: '🛒', plantas: '🪴', mascota: '🐾', otra: '📌' };
const COLOR_INSIGNIA = { limpio: '#2e9e4f', desordenado: '#c98a00', desastre: '#c0392b' };
const COLOR_OBJETO = [0xc0392b, 0x2980b9, 0xf1c40f, 0x8e44ad, 0x16a085, 0xd35400];
const PROF_BURBUJA = 30;
const ESTILO_BURBUJA = { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#2a221c', backgroundColor: '#ffffff', padding: { x: 4, y: 2 } };

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
let hoy = fechaLocal(new Date()); // el día de hoy se inyecta en las funciones puras (ADR-003 de estado derivado)
// Casilla actual de cada miembro en el mapa: el propietario es el jugador; los habitantes, sus móviles (FR-6 de la 003).
function posicionesDeMiembros() {
  const posiciones = new Map(moviles.map((h) => [h.id, { x: h.x, y: h.y }]));
  posiciones.set(propietario().id, { x: jugador.x, y: jugador.y });
  return posiciones;
}

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
    this.insignias = new Map(); // clave de espacio → insignia de su estado de limpieza (FR-5 de la 003)
    this.burbujas = []; // burbujas de los lugares con actividades por hacer, cada una con su texto (FR-6 de la 003)
    this.sprites = new Map(); // id de habitante → { cuerpo, etiqueta } (FR-8; nunca interactivos)
    this.personaje = this.add.container(0, 0, [
      this.add.rectangle(0, 0, 12, 14, 0xd4537e).setStrokeStyle(1, 0x4b1528),
      this.add.triangle(0, 5, 0, 0, 6, 0, 3, 4, 0x4b1528),
    ]).setDepth(PROF_PERSONAJE);
    this.etiquetaPersonaje = this.add.text(0, 0, '', ESTILO_ETIQUETA).setOrigin(0.5, 1).setDepth(PROF_ETIQUETA_PERSONAJE);
    this.teclas = this.input.keyboard.createCursorKeys();
    // En exploración solo responden las burbujas; en edición, también personajes y espacios (FR-8 de la 003).
    this.input.on('pointerup', (p) => tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE)));
    this.scale.on('resize', () => (modo === 'edicion' ? this.encuadrarHogar() : null));
    this.redibujar();
    this.colocarPersonaje();
    this.seguirPersonaje();
  }

  redibujar() {
    this.dibujarSuelo();
    this.dibujarEtiquetas();
  }

  // Casillas del mapa y, encima, los objetos del suelo según el estado de limpieza (FR-5 de la 003): decoración
  // por debajo de los personajes, que no cambia las colisiones.
  dibujarSuelo() {
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
    for (const espacio of espaciosActivos(estado)) {
      for (const o of objetosDelSuelo(distribucion, espacio.id, limpiezaDeEspacio(estado, espacio.id, hoy))) {
        g.fillStyle(COLOR_OBJETO[o.variante]);
        g.fillRect(o.x * TILE + 4, o.y * TILE + 4, TILE - 8, TILE - 8);
      }
    }
  }

  // Tras un cambio de actividades o de día: suelo, insignias y burbujas, sin rehacer a los personajes, que siguen caminando.
  refrescarActividades() {
    this.dibujarSuelo();
    this.dibujarInsignias();
    this.dibujarBurbujas();
  }

  // Etiquetas de nombre (FR-12 de la 001, FR-8 de la 002) con la insignia de cada espacio, y burbujas (FR-5, FR-6 de la 003).
  dibujarEtiquetas() {
    this.etiquetas.forEach((t) => t.destroy());
    this.etiquetas.clear();
    const escala = 1 / this.cameras.main.zoom; // contrarresta el zoom de la cámara: tamaño constante en pantalla
    for (const e of etiquetasDeEspacios(estado, distribucion, null, null)) {
      const texto = this.add.text(e.x * TILE, e.y * TILE, e.texto, ESTILO_ETIQUETA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.etiquetas.set(e.clave, texto);
    }
    this.dibujarInsignias();
    this.etiquetaPersonaje.setText(propietario().nombre).setScale(escala);
    this.sincronizarSprites();
    this.dibujarBurbujas();
  }

  // Insignia del estado de limpieza junto al nombre de cada espacio (FR-5 de la 003); los pasillos no tienen etiqueta ni insignia.
  dibujarInsignias() {
    this.insignias.forEach((t) => t.destroy());
    this.insignias.clear();
    const escala = 1 / this.cameras.main.zoom;
    for (const clave of this.etiquetas.keys()) {
      const limpieza = limpiezaDeEspacio(estado, clave, hoy);
      const estilo = { ...ESTILO_ETIQUETA, color: '#ffffff', backgroundColor: COLOR_INSIGNIA[limpieza] };
      const insignia = this.add.text(0, 0, INSIGNIAS[limpieza], estilo).setOrigin(0, 0.5).setScale(escala).setDepth(PROF_ETIQUETA_ESPACIO);
      this.insignias.set(clave, insignia);
    }
    this.colocarInsignias();
  }

  // La insignia va pegada a la derecha de la etiqueta de su espacio, también cuando esta se desplaza en exploración.
  colocarInsignias() {
    const separacion = 2 / this.cameras.main.zoom;
    for (const [clave, insignia] of this.insignias) {
      const etiqueta = this.etiquetas.get(clave);
      insignia.setPosition(etiqueta.x + etiqueta.displayWidth / 2 + separacion, etiqueta.y);
    }
  }

  // Una burbuja por lugar con actividades por hacer (FR-6 de la 003): icono de la más atrasada y "+" si hay más.
  // La de un espacio queda fija en su casilla; la de un miembro la coloca `colocarBurbujas` en cada cuadro.
  dibujarBurbujas() {
    for (const b of this.burbujas) b.texto.destroy();
    const escala = 1 / this.cameras.main.zoom;
    this.burbujas = burbujas(estado, hoy).map((b) => {
      const texto = this.add.text(0, 0, `${GLIFO_ICONO[b.icono]}${b.mas ? '+' : ''}`, ESTILO_BURBUJA)
        .setOrigin(0.5).setScale(escala).setDepth(PROF_BURBUJA);
      const casilla = b.tipo === 'espacio' ? casillaDeBurbuja(distribucion, b.id) : null;
      if (casilla) texto.setPosition(casilla.x * TILE + TILE / 2, casilla.y * TILE + TILE / 2);
      return { ...b, texto };
    });
    this.colocarBurbujas();
  }

  // Las burbujas de los miembros siguen a su personaje, centradas en la casilla de encima de él: la misma que responde al toque (AC-6.8).
  colocarBurbujas() {
    const idPropietario = propietario().id;
    for (const b of this.burbujas) {
      if (b.tipo !== 'miembro') continue;
      const cuerpo = b.id === idPropietario ? this.personaje : this.sprites.get(b.id)?.cuerpo;
      if (cuerpo) b.texto.setPosition(cuerpo.x, cuerpo.y - TILE);
    }
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

  // Por cuadro: los nombres y las burbujas de los miembros siguen a sus personajes; en exploración, la etiqueta del espacio
  // actual (con su insignia) se desplaza a la parte visible.
  actualizarEtiquetas() {
    this.etiquetaPersonaje.setPosition(this.personaje.x, this.personaje.y - TILE * 0.75);
    for (const s of this.sprites.values()) s.etiqueta.setPosition(s.cuerpo.x, s.cuerpo.y - TILE * 0.6);
    this.colocarBurbujas();
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
    this.colocarInsignias();
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
    const fecha = fechaLocal(new Date());
    if (fecha !== hoy) cambiarDia(fecha); // FR-10 de la 003: medianoche con la app abierta o vuelta a primer plano otro día
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
  cerrarHoja(); // la hoja de exploración ofrece "Hecho"; en edición se vuelve a abrir desde la burbuja con Editar y Eliminar
  guardarPosicion();
  modo = 'edicion';
  moviles = congelarHabitantes(moviles); // quietos en la casilla a la que se dirigían (AC-7.2 de la 002)
  mostrarExploracion(false);
  pintarPanel();
  escena().encuadrarHogar();
});

$('listo').addEventListener('click', () => {
  cerrarHoja();
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
  moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7 de la 002
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10 de la 001, AC-9.2)
  s.colocarPersonaje();
  s.encuadrarHogar();
  pintarPanel();
  if (hojaActual) pintarHoja();
}

// Cambios de actividades (alta, edición, baja y "Hecho"): no cambian la distribución ni a los habitantes (FR-3 y FR-8 de la 003).
function aplicarActividades(nuevo) {
  if (nuevo === estado) return;
  const t0 = performance.now();
  estado = nuevo;
  escena().refrescarActividades();
  ultimaRegeneracionMs = performance.now() - t0; // misma meta de 100 ms (AC-6.10 de la 003)
  guardarEstado(); // se guarda en el momento en que se aplica (AC-8.2 de la 003)
  if (modo === 'edicion') pintarPanel();
  if (hojaActual) pintarHoja();
}

// El día cambió con la app abierta (FR-10 de la 003): burbujas, estados y objetos se recalculan con la nueva fecha.
function cambiarDia(fecha) {
  hoy = fecha;
  escena().refrescarActividades();
  if (modo === 'edicion') pintarPanel();
  if (hojaActual) pintarHoja();
}

const textoActividades = (n) => (n === 1 ? 'Se eliminará 1 actividad.' : `Se eliminarán ${n} actividades.`);

// Confirmación de eliminar un espacio (AC-5.3, AC-4.7 de la 001; AC-7.1, AC-7.4 y AC-7.6 de la 003).
function confirmarEliminacion(id) {
  if (!requiereConfirmacion(estado, id)) return true;
  const espacio = buscarEspacio(estado, id);
  const c = consecuenciasDeEliminar(estado, id);
  const partes = [`¿Eliminar "${nombreVisible(estado, espacio)}"?`];
  if (c.banoSeElimina) partes.push('También se eliminará su baño interno.');
  if (c.tieneNombrePersonalizado) partes.push('Se perderá su nombre personalizado.');
  if (c.actividades > 0) partes.push(textoActividades(c.actividades));
  return window.confirm(partes.join(' '));
}

function pintarPanel() {
  const cont = $('contadores');
  cont.replaceChildren();
  for (const tipo of TIPOS) {
    const fila = elemento('div', undefined, 'fila');
    const destino = tipo === 'bano' ? siguienteDestinoBano(estado) : null;
    const nombre = elemento('span', ETIQUETAS[tipo]);
    if (destino) nombre.append(elemento('small', `Siguiente: ${nombreVisible(estado, destino)}`)); // texto, nunca marcado (NFR de seguridad de la 003)
    const menos = elemento('button', '−');
    menos.setAttribute('aria-label', 'Quitar');
    const mas = elemento('button', '+');
    mas.setAttribute('aria-label', 'Agregar');
    fila.append(nombre, menos, elemento('span', String(contar(estado, tipo)), 'cuenta'), mas);
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
  pintarActividades();
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

// Los textos escritos por el usuario se insertan siempre como texto, nunca como marcado (NFR de seguridad de la 003).
function elemento(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined) el.textContent = texto;
  if (clase) el.className = clase;
  return el;
}

// Sección "Actividades" del panel (FR-8, AC-6.1 de la 003): contador "n de 50", alta y lista de todas las pendientes.
function pintarActividades() {
  const cont = $('actividades');
  cont.replaceChildren();
  const cabecera = elemento('div', undefined, 'fila cabecera');
  const mas = elemento('button', '+ Actividad');
  mas.disabled = !puedeAgregarActividad(estado);
  mas.addEventListener('click', () => abrirFichaActividad(null));
  cabecera.append(elemento('span', 'Pendientes'), elemento('span', `${contarActividades(estado)} de ${LIMITE_ACTIVIDADES}`, 'cuenta'), mas);
  cont.append(cabecera);
  for (const a of listaDelPanel(estado)) {
    const fila = elemento('div', undefined, 'fila actividad');
    const lugar = a.espacioId ? nombreVisible(estado, buscarEspacio(estado, a.espacioId)) : 'Sin espacio';
    const datos = elemento('span');
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${lugar} · ${textoPlazo(a, hoy)}`));
    fila.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos);
    fila.addEventListener('click', () => abrirFichaActividad(a.id));
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

// Solo el alta de un habitante (id null) deshabilita guardar hasta tener nombre y todos sus datos elegidos (AC-1.3, AC-2.3).
// La edición de un habitante existente lo deja activo: un nombre vacío llega a editarHabitante, que lo rechaza y se muestra el mensaje (AC-3.5).
function actualizarGuardar() {
  if (fichaActual?.tipo !== 'habitante' || fichaActual.id) { $('ficha-guardar').disabled = false; return; }
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

// Al tocar el mapa (FR-8 de la 003): en exploración solo responden las burbujas; en edición la prioridad es
// personaje del propietario, habitante, burbuja y espacio (AC-7.3 y AC-7.4 de la 002, AC-6.8 de la 003).
function tocarMapa(x, y) {
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  const burbuja = ubicarBurbujas(burbujas(estado, hoy), distribucion, posicionesDeMiembros()).find((b) => b.x === x && b.y === y);
  if (modo === 'exploracion') {
    if (burbuja) abrirHoja(burbuja);
    return;
  }
  if (x === jugador.x && y === jugador.y) { abrirFicha('propietario', propietario().id); return; }
  const habitante = moviles.find((h) => h.x === x && h.y === y);
  if (habitante) {
    const miembro = buscarMiembro(estado, habitante.id);
    abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
    return;
  }
  if (burbuja) { abrirHoja(burbuja); return; }
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
    const n = pendientesDeMiembro(estado, id);
    const pregunta = `¿Eliminar a "${buscarMiembro(estado, id).nombre}"?${n > 0 ? ` ${textoActividades(n)}` : ''}`;
    if (!window.confirm(pregunta)) return; // AC-8.1 y AC-8.2 de la 002; AC-7.7 y AC-7.8 de la 003
    cerrarFicha();
    aplicar(eliminarHabitante(estado, id, ctx));
    return;
  }
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});

// ---------- Hoja de un lugar (FR-7 de la 003) ----------
let hojaActual = null; // lugar de la hoja abierta: { tipo: 'espacio' | 'miembro', id }

function abrirHoja(lugar) {
  hojaActual = { tipo: lugar.tipo, id: lugar.id };
  pintarHoja();
}

const cerrarHoja = () => { $('hoja').style.display = 'none'; hojaActual = null; };

// En exploración, cada actividad ofrece solo "Hecho" (AC-3.1); en edición, Editar y Eliminar (AC-6.7).
// La hoja se cierra cuando el lugar ya no tiene actividades por hacer (AC-3.2).
function pintarHoja() {
  const lugar = hojaActual.tipo === 'espacio' ? buscarEspacio(estado, hojaActual.id) : buscarMiembro(estado, hojaActual.id);
  const lista = lugar ? actividadesDelLugar(estado, hojaActual, hoy) : [];
  if (lista.length === 0) { cerrarHoja(); return; }
  $('hoja-titulo').textContent = hojaActual.tipo === 'espacio' ? nombreVisible(estado, lugar) : lugar.nombre;
  const cont = $('hoja-lista');
  cont.replaceChildren();
  for (const a of lista) {
    const datos = elemento('span');
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${textoPlazo(a, hoy)}`));
    const botones = elemento('span', undefined, 'botones');
    if (modo === 'exploracion') {
      const hecho = elemento('button', 'Hecho');
      hecho.addEventListener('click', () => aplicarActividades(marcarHecha(estado, a.id, hoy, ctx)));
      botones.append(hecho);
    } else {
      const editar = elemento('button', 'Editar');
      editar.addEventListener('click', () => abrirFichaActividad(a.id));
      const eliminar = elemento('button', 'Eliminar', 'peligro');
      eliminar.addEventListener('click', () => confirmarYEliminarActividad(a.id));
      botones.append(editar, eliminar);
    }
    const item = elemento('div', undefined, 'item');
    item.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos, botones);
    cont.append(item);
  }
  $('hoja').style.display = 'block';
}
$('hoja-cerrar').addEventListener('click', cerrarHoja);

// ---------- Ficha de una actividad (FR-1 y FR-8 de la 003) ----------
let actividadEnFicha = null; // id de la actividad en edición, o null en un alta

function opciones(select, pares, valor) {
  select.replaceChildren(...pares.map(([clave, texto]) => new Option(texto, clave)));
  select.value = valor;
}

// Alta: nombre vacío, icono "Otra", miembro sin elegir, "Sin espacio", "Puntual", fecha de hoy (AC-1.1).
function abrirFichaActividad(id) {
  actividadEnFicha = id;
  const a = id ? buscarActividad(estado, id) : null;
  $('actividad-titulo').textContent = a ? a.nombre : 'Nueva actividad';
  $('actividad-nombre').value = a?.nombre ?? '';
  opciones($('actividad-icono'), Object.entries(ICONOS).map(([clave, texto]) => [clave, `${GLIFO_ICONO[clave]} ${texto}`]), a?.icono ?? 'otra');
  const miembros = [propietario(), ...habitantes(estado)];
  opciones($('actividad-miembro'), [['', 'Asignar a…'], ...miembros.map((m) => [m.id, m.nombre])], a?.miembroId ?? '');
  opciones($('actividad-espacio'), [['', 'Sin espacio'], ...espaciosActivos(estado).map((e) => [e.id, nombreVisible(estado, e)])], a?.espacioId ?? '');
  opciones($('actividad-tipo'), [['puntual', 'Puntual'], ['repetitiva', 'Repetitiva']], a?.tipo ?? 'puntual');
  $('actividad-vence').value = a?.vence ?? hoy;
  const frecuencias = FRECUENCIAS.map((n) => [String(n), n === 1 ? 'Cada día' : `Cada ${n} días`]);
  opciones($('actividad-frecuencia'), [['', 'Elegir frecuencia…'], ...frecuencias], a?.frecuenciaDias ? String(a.frecuenciaDias) : '');
  $('actividad-error').textContent = '';
  $('actividad-eliminar').style.display = a ? 'block' : 'none';
  actualizarFichaActividad();
  $('ficha-actividad').style.display = 'flex';
}

// La frecuencia solo se ve en las repetitivas (AC-1.2). En un alta, guardar se activa con nombre, miembro y, si es
// repetitiva, frecuencia (AC-1.6). En una edición queda activo: un nombre vacío llega a editarActividad, que lo
// rechaza con su mensaje (AC-6.5).
function actualizarFichaActividad() {
  const repetitiva = $('actividad-tipo').value === 'repetitiva';
  $('actividad-frecuencia').style.display = repetitiva ? 'block' : 'none';
  if (actividadEnFicha) { $('actividad-guardar').disabled = false; return; }
  $('actividad-guardar').disabled = $('actividad-nombre').value.trim() === '' || $('actividad-miembro').value === ''
    || (repetitiva && $('actividad-frecuencia').value === '');
}

const cerrarFichaActividad = () => { $('ficha-actividad').style.display = 'none'; actividadEnFicha = null; };

function datosDeFichaActividad() {
  const frecuencia = $('actividad-frecuencia').value;
  return {
    nombre: $('actividad-nombre').value, icono: $('actividad-icono').value, miembroId: $('actividad-miembro').value,
    espacioId: $('actividad-espacio').value || null, tipo: $('actividad-tipo').value, vence: $('actividad-vence').value,
    frecuenciaDias: frecuencia === '' ? null : Number(frecuencia),
  };
}

// Eliminar una actividad pide confirmación con su nombre (AC-6.6). Devuelve si se eliminó.
function confirmarYEliminarActividad(id) {
  const a = buscarActividad(estado, id);
  if (!a || !window.confirm(`¿Eliminar la actividad "${a.nombre}"?`)) return false;
  aplicarActividades(eliminarActividad(estado, id, ctx));
  return true;
}

$('ficha-actividad').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const datos = datosDeFichaActividad();
  const r = actividadEnFicha ? editarActividad(estado, actividadEnFicha, datos, ctx) : agregarActividad(estado, datos, ctx);
  if (!r.ok) { $('actividad-error').textContent = MENSAJES_ACTIVIDAD[r.error]; return; }
  cerrarFichaActividad();
  aplicarActividades(r.estado);
});
$('actividad-nombre').addEventListener('input', () => { $('actividad-error').textContent = ''; actualizarFichaActividad(); });
for (const campo of ['actividad-miembro', 'actividad-tipo', 'actividad-frecuencia']) $(campo).addEventListener('change', actualizarFichaActividad);
$('actividad-cancelar').addEventListener('click', cerrarFichaActividad);
$('actividad-eliminar').addEventListener('click', () => {
  if (confirmarYEliminarActividad(actividadEnFicha)) cerrarFichaActividad();
});

// ---------- Ciclo de vida ----------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && modo === 'exploracion') guardarPosicion();
});
if (inicio.aviso) avisar(inicio.aviso);
