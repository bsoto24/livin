// src/juego.js
/* global Phaser */
import {
  TIPOS, ETIQUETAS, ASPECTOS, DATOS_ASPECTO, ASPECTO_INICIAL, ESPECIES, DATOS_ESPECIE, ESPECIE_INICIAL, LIMITES_HABITANTES, ICONOS,
  LIMITE_ACTIVIDADES, DIAS_RUTINA, LIMITE_BLOQUES, MAX_ESTRELLAS,
} from './catalogo.js';
import {
  espaciosActivos, buscarEspacio, contar, puedeAgregar, puedeQuitar, puedeEliminar, agregarEspacio, quitarUltimo,
  ultimoDeTipo, eliminarEspacio, requiereConfirmacion, consecuenciasDeEliminar, siguienteDestinoBano,
  nombreVisible, nombreAutomatico, renombrarEspacio, renombrarMiembro, MENSAJES_ERROR,
  habitantes, familiares, mascotas, buscarMiembro, esPropietario, contarHabitantes, puedeAgregarHabitante, agregarHabitante, editarHabitante,
  eliminarHabitante, pendientesDeMiembro, bloquesDeMiembro, personasQueJuegan, puedeJugar, jugadorInicial,
} from './hogar.js';
import { SECCIONES, textoPestana, accionDeToque, ocupanteEn } from './secciones.js';
import { generarDistribucion } from './distribucion.js';
import { crearAlmacen, iniciarSesion } from './almacen.js';
import { posicionRelativa, resolverPosicion, paso } from './posicion.js';
import { etiquetasDeEspacios } from './etiquetas.js';
import {
  MS_POR_PASO, colocarHabitantes, avanzarHabitantes, sincronizarHabitantes, congelarHabitantes, ocupadasPorHabitantes, fijarObjetivos, cambiarJugador,
} from './movimiento.js';
import {
  contarActividades, puedeAgregarActividad, buscarActividad, agregarActividades, editarActividad, eliminarActividad, marcarHecha,
  limpiezaDeEspacio, burbujas, actividadesDelLugar, listaDelPanel, textoPlazo, MENSAJES_ACTIVIDAD,
} from './actividades.js';
import {
  buscarBloque, bloquesDe, contarBloques, puedeAgregarBloque, agregarBloque, editarBloque, eliminarBloque, MENSAJES_BLOQUE,
  textoHora, textoBloque, textoBajas, objetivosDeFamiliares, textoVuelta,
} from './rutinas.js';
import { INSIGNIAS, objetosDelSuelo, casillaDeBurbuja, ubicarBurbujas } from './aspecto.js';
import {
  numeroRecibidas, intercambiosDe, actividadesOfrecibles, actividadesPedibles, motivoSinPropuesta, proponer, aceptar, rechazar, retirar,
  quitar, esVigente, textoPropuesta, textoIntercambio, MENSAJES_INTERCAMBIO,
} from './intercambios.js';
import {
  entradasDelHistorial, entradasDe, miembrosDelFiltro, textoLinea, textoResumen, textoVacio, estadoDeCalificacion, textoCalificacion,
  calificar, quitarCalificacion, MENSAJES_HISTORIAL,
} from './historial.js';
import {
  sugerenciasPara, iconoDeFicha, iconoDeEdicion, OPCIONES_RECURRENCIA, datosDeRecurrencia, valorDeRecurrencia, resumenDeFicha, inicialDe,
} from './formularios.js';
import { ahoraLocal } from './fechas.js';

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
// Aspecto de los habitantes (FR-8 de la 002, FR-5 y FR-6 de la 007), arte de marcador: personas de 12×14 —más pequeñas si son niños— y
// mascotas de 8×8; los colores y la escala salen del catálogo.
const COLOR_BORDE_HABITANTE = 0x2a221c;
// Actividades (FR-5 y FR-6 de la 003), arte de marcador: iconos como emoji del sistema y objetos como cuadrados de colores.
const GLIFO_ICONO = { platos: '🍽️', barrer: '🧹', ropa: '🧺', basura: '🗑️', limpiar: '🧽', compras: '🛒', plantas: '🪴', mascota: '🐾', otra: '📌' };
const COLOR_INSIGNIA = { limpio: '#2e9e4f', desordenado: '#c98a00', desastre: '#c0392b' };
const COLOR_OBJETO = [0xc0392b, 0x2980b9, 0xf1c40f, 0x8e44ad, 0x16a085, 0xd35400];
const PROF_BURBUJA = 30;
const ESTILO_BURBUJA = { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#2a221c', backgroundColor: '#ffffff', padding: { x: 4, y: 2 } };
// Rutinas (FR-5 y FR-7 de la 004): en una casilla compartida, quien va en ruta se dibuja debajo de quien no; el cartel de la entrada.
const PROF_EN_RUTA = 9;
const ESTILO_CARTEL = { ...ESTILO_ETIQUETA, color: '#ffffff', backgroundColor: '#2a221c' };
// Jugador activo (FR-1 de la 005): el color de cada miembro y el resalte de la etiqueta de quien juega.
const COLOR_PROPIETARIO = 0xd4537e;
const COLOR_RESALTE = '#ffd166';
function colorDe(miembro) {
  if (miembro.tipo === 'mascota') return DATOS_ESPECIE[miembro.especie].color;
  if (esPropietario(estado, miembro)) return COLOR_PROPIETARIO;
  return DATOS_ASPECTO[miembro.aspecto].color;
}
const escalaDe = (miembro) => (miembro.tipo === 'persona' && miembro.aspecto !== null ? DATOS_ASPECTO[miembro.aspecto].escala : 1);
const colorCss = (color) => `#${color.toString(16).padStart(6, '0')}`;
const iconoDeMiembro = (miembro) => (miembro.tipo === 'mascota' ? DATOS_ESPECIE[miembro.especie].icono : (DATOS_ASPECTO[miembro.aspecto]?.icono ?? '🧑'));

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
let jugador = { id: jugadorInicial(estado, posGuardada), ...resolverPosicion(distribucion, posGuardada) }; // quién juega y dónde (FR-6 de la 005)
let cambioPendiente = null; // jugador elegido en medio de un paso: se aplica al terminarlo (AC-2.7 de la 005)
let modo = 'exploracion';
let moviendo = false;
let posicionSinGuardar = false;
let direccionTactil = null;
let ultimaRegeneracionMs = 0;
let jugadorDesde = null; // casilla de origen mientras el jugador da un paso: también bloquea a los habitantes (AC-5.2)
const azar = Math.random; // el movimiento recibe el azar inyectado (ADR-002 de movimiento)
// Móviles: todos los miembros salvo quien juega; el propietario es uno más cuando no juega (ADR-005 de jugador activo).
function idsHabitantes() { return [propietario().id, ...habitantes(estado).map((h) => h.id)].filter((id) => id !== jugador.id); }
function propietario() { return estado.miembros.find((m) => m.eliminadoEn === null && esPropietario(estado, m)); }
const casillaJugador = () => ({ x: jugador.x, y: jugador.y, desde: jugadorDesde });
let ahora = ahoraLocal(new Date()); // fecha y minuto locales: se inyectan en las rutinas (ADR-004 de movimiento)
let hoy = ahora.fecha; // el día de hoy se inyecta en las funciones puras (ADR-003 de estado derivado)
let hojaActual = null; // hoja abierta: { tipo: 'espacio' | 'miembro', id } o { tipo: 'fuera' } (FR-7 de la 003, FR-5 de la 004)
// FR-6 de la 004: al abrir, después del jugador, cada familiar donde dice su rutina y los demás al azar.
let moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar, objetivosDeFamiliares(estado, ahora));
// Casilla actual de cada miembro en el mapa: el propietario es el jugador; los habitantes, sus móviles (FR-6 de la 003). Quien está
// fuera de casa no está en el mapa (AC-5.8 de la 004).
function posicionesDeMiembros() {
  const posiciones = new Map(moviles.filter((h) => h.fase !== 'fuera').map((h) => [h.id, { x: h.x, y: h.y }]));
  posiciones.set(jugador.id, { x: jugador.x, y: jugador.y });
  return posiciones;
}
// Familiares fuera de casa (FR-5 de la 004) y una firma que cambia cuando alguien sale, vuelve o ya no debería estar fuera.
const familiaresFuera = () => moviles.filter((h) => h.fase === 'fuera');
const firmaFuera = () => familiaresFuera().map((h) => `${h.id}${h.objetivo.tipo === 'fuera' ? '' : '~'}`).join(',');
const tienePendientesSinEspacio = (id) => actividadesDelLugar(estado, { tipo: 'miembro', id }, hoy).length > 0;

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
  posGuardada = { ...posicionRelativa(distribucion, jugador.x, jugador.y, jugador.direccion), jugadorId: jugador.id };
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
    this.cuerpoPersonaje = this.add.rectangle(0, 0, 12, 14, COLOR_PROPIETARIO).setStrokeStyle(1, 0x4b1528);
    this.personaje = this.add.container(0, 0, [
      this.cuerpoPersonaje,
      this.add.triangle(0, 5, 0, 0, 6, 0, 3, 4, 0x4b1528),
    ]).setDepth(PROF_PERSONAJE);
    this.etiquetaPersonaje = this.add.text(0, 0, '', ESTILO_ETIQUETA).setOrigin(0.5, 1).setDepth(PROF_ETIQUETA_PERSONAJE);
    this.cartel = this.add.text(0, 0, '', ESTILO_CARTEL).setOrigin(1, 0.5).setDepth(PROF_BURBUJA).setVisible(false); // FR-5 de la 004
    this.firmaCartel = null;
    // Solo las cuatro flechas y sin captura global del teclado: `createCursorKeys` también captura Espacio y Mayúsculas, y cancelaba esa tecla en
    // los campos de texto del navegador de escritorio (FR-13 de la 007).
    const { UP, DOWN, LEFT, RIGHT } = Phaser.Input.Keyboard.KeyCodes;
    this.teclas = this.input.keyboard.addKeys({ up: UP, down: DOWN, left: LEFT, right: RIGHT }, false);
    // En exploración responden el cartel y las burbujas; en edición, también personajes y espacios (FR-8 de la 003, FR-5 de la 004).
    this.input.on('pointerup', (p) => tocarMapa(Math.floor(p.worldX / TILE), Math.floor(p.worldY / TILE), this.tocaCartel(p.worldX, p.worldY)));
    this.scale.on('resize', () => (modo === 'edicion' ? this.encuadrarHogar() : this.seguirPersonaje())); // cada modo rehace su vista
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

  // Tras un cambio de actividades o de día: suelo, insignias, burbujas y la señal "!" del cartel, sin rehacer a los personajes.
  refrescarActividades() {
    this.dibujarSuelo();
    this.dibujarInsignias();
    this.dibujarBurbujas();
    this.actualizarCartel();
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
    this.dibujarJugador(escala);
    this.sincronizarSprites();
    this.dibujarBurbujas();
    this.actualizarCartel();
  }

  // Nombre, color y resalte de quien juega (AC-2.8 de la 005): su etiqueta lleva un fondo de color que no tienen las demás.
  dibujarJugador(escala) {
    const miembro = buscarMiembro(estado, jugador.id);
    this.cuerpoPersonaje.setFillStyle(colorDe(miembro)).setSize(12 * escalaDe(miembro), 14 * escalaDe(miembro));
    this.etiquetaPersonaje.setText(miembro.nombre).setScale(escala).setBackgroundColor(COLOR_RESALTE).setFontStyle('bold');
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

  // Las burbujas de los miembros siguen a su personaje, centradas en la casilla de encima de él: la misma que responde al toque
  // (AC-6.8 de la 003). La de un familiar fuera de casa no se ve (AC-5.8 de la 004).
  colocarBurbujas() {
    for (const b of this.burbujas) {
      if (b.tipo !== 'miembro') continue;
      const cuerpo = b.id === jugador.id ? this.personaje : this.sprites.get(b.id)?.cuerpo;
      b.texto.setVisible(Boolean(cuerpo?.visible));
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
        ? this.add.rectangle(0, 0, 8, 8, colorDe(miembro))
        : this.add.rectangle(0, 0, 12 * escalaDe(miembro), 14 * escalaDe(miembro), colorDe(miembro));
      cuerpo.setStrokeStyle(1, COLOR_BORDE_HABITANTE).setDepth(PROF_PERSONAJE)
        .setPosition(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2);
      const etiqueta = this.add.text(cuerpo.x, cuerpo.y - TILE * 0.6, miembro.nombre, ESTILO_ETIQUETA)
        .setOrigin(0.5, 1).setScale(escala).setDepth(PROF_ETIQUETA_PERSONAJE);
      cuerpo.setVisible(h.fase !== 'fuera'); // quien está fuera de casa no se ve (AC-4.1 de la 004)
      etiqueta.setVisible(h.fase !== 'fuera');
      this.sprites.set(h.id, { cuerpo, etiqueta });
    }
  }

  // Por cuadro, solo en exploración: avanza el movimiento (FR-5 de la 002; FR-3 y FR-4 de la 004) y anima cada paso nuevo durante
  // MS_POR_PASO. Quien sale por la entrada se oculta; quien vuelve aparece en ella sin animación. Quien va en ruta se dibuja
  // debajo de quien pasea (AC-8.6 de la 004).
  moverHabitantes(dtMs) {
    if (modo !== 'exploracion') return;
    const antes = new Map(moviles.map((h) => [h.id, h]));
    moviles = avanzarHabitantes(moviles, distribucion, casillaJugador(), dtMs, azar);
    for (const h of moviles) {
      const previo = antes.get(h.id);
      const s = this.sprites.get(h.id);
      if (!s) continue;
      const visible = h.fase !== 'fuera';
      s.cuerpo.setVisible(visible).setDepth(h.fase === 'pasea' ? PROF_PERSONAJE : PROF_EN_RUTA);
      s.etiqueta.setVisible(visible);
      if (previo.fase === 'fuera' && visible) {
        this.tweens.killTweensOf(s.cuerpo);
        s.cuerpo.setPosition(h.x * TILE + TILE / 2, h.y * TILE + TILE / 2);
        continue;
      }
      if (previo.x === h.x && previo.y === h.y) continue;
      this.tweens.add({ targets: s.cuerpo, x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2, duration: MS_POR_PASO, ease: 'Linear' });
    }
    if (firmaFuera() !== this.firmaCartel) this.actualizarCartel();
  }

  // Cartel de la entrada (FR-5 de la 004): "n fuera" y " !" si alguno tiene actividades por hacer sin espacio. Se dibuja sobre la
  // pared, alineado a la derecha contra la entrada para no taparla, y no se ve si no hay nadie fuera.
  actualizarCartel() {
    const fuera = familiaresFuera();
    this.firmaCartel = firmaFuera();
    const aviso = fuera.some((h) => tienePendientesSinEspacio(h.id)) ? ' !' : '';
    this.cartel.setText(`${fuera.length} fuera${aviso}`).setVisible(fuera.length > 0).setScale(1 / this.cameras.main.zoom)
      .setPosition(distribucion.entrada.x * TILE, distribucion.entrada.y * TILE + TILE / 2);
    if (hojaActual?.tipo === 'fuera') pintarHoja();
  }

  // El cartel responde al toque en toda el área donde se dibuja (lección de la 003: área táctil igual al área dibujada).
  tocaCartel(xMundo, yMundo) {
    return this.cartel.visible && this.cartel.getBounds().contains(xMundo, yMundo);
  }

  // Por cuadro: los nombres y las burbujas de los miembros siguen a sus personajes; en exploración, la etiqueta del espacio
  // actual (con su insignia) se desplaza a la parte visible.
  actualizarEtiquetas() {
    this.etiquetaPersonaje.setPosition(this.personaje.x, this.personaje.y - TILE * 0.75);
    // En una casilla compartida, el nombre de quien va en ruta pasa debajo de su cuerpo para no tapar el otro (AC-8.6 de la 004).
    const porCasilla = new Map();
    for (const h of moviles) if (h.fase !== 'fuera') porCasilla.set(`${h.x},${h.y}`, (porCasilla.get(`${h.x},${h.y}`) ?? 0) + 1);
    const bajados = new Map(); // nombres ya puestos debajo en cada casilla: se apilan para que ninguno tape por completo a otro (FR-7)
    const alto = 18 / this.cameras.main.zoom; // alto de una etiqueta en el mapa (12 px de letra más el relleno)
    for (const h of moviles) {
      const s = this.sprites.get(h.id);
      if (!s) continue;
      const clave = `${h.x},${h.y}`;
      const debajo = h.fase !== 'pasea' && porCasilla.get(clave) > 1;
      const nivel = debajo ? (bajados.get(clave) ?? 0) : 0;
      if (debajo) bajados.set(clave, nivel + 1);
      s.etiqueta.setOrigin(0.5, debajo ? 0 : 1).setPosition(s.cuerpo.x, s.cuerpo.y + (debajo ? TILE * 0.6 + nivel * alto : -TILE * 0.6));
    }
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

  // La vista de la cámara: en exploración termina donde empieza la barra, así el cartel de la entrada nunca queda debajo de ella (AC-1.2); en
  // edición ocupa todo el lienzo y `encuadrarHogar` descuenta el drawer y la barra.
  ajustarVista() {
    const cam = this.cameras.main;
    cam.setSize(this.scale.width, this.scale.height - (modo === 'exploracion' ? $('barra').offsetHeight : 0));
  }

  seguirPersonaje() {
    const cam = this.cameras.main;
    this.ajustarVista();
    cam.setZoom(ZOOM_EXPLORACION);
    cam.startFollow(this.personaje, true);
    this.dibujarEtiquetas(); // la escala de las etiquetas depende del zoom
  }

  encuadrarHogar() {
    const cam = this.cameras.main;
    this.ajustarVista();
    const altoPanel = $('drawer').offsetHeight + $('barra').offsetHeight; // el hogar completo se ve por encima del drawer y de la barra (AC-1.6)
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
    jugador = { id: jugador.id, x: r.x, y: r.y, direccion: r.direccion };
    posicionSinGuardar = true;
    if (!r.movio) { this.colocarPersonaje(); return; }
    moviendo = true;
    jugadorDesde = origen;
    this.personaje.setAngle({ abajo: 0, izquierda: 90, arriba: 180, derecha: 270 }[direccion]);
    this.tweens.add({
      targets: this.personaje, x: r.x * TILE + TILE / 2, y: r.y * TILE + TILE / 2, duration: MS_POR_CASILLA, ease: 'Linear',
      onComplete: () => { moviendo = false; jugadorDesde = null; if (cambioPendiente) elegirJugador(cambioPendiente); },
    });
  }

  update(_tiempo, deltaMs) {
    const reloj = ahoraLocal(new Date());
    if (reloj.fecha !== hoy) cambiarDia(reloj.fecha); // FR-10 de la 003: medianoche con la app abierta o vuelta a primer plano otro día
    // FR-2 y FR-3 de la 004: en exploración, al cambiar el minuto cada familiar recibe el objetivo de su rutina; en edición no (AC-6.5).
    if (modo === 'exploracion' && (reloj.minuto !== ahora.minuto || reloj.fecha !== ahora.fecha)) cambiarMinuto(reloj);
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

// ---------- Barra y drawers (FR-1 y FR-2 de la 007) ----------
let seccion = null; // sección abierta: 'espacios' | 'familia' | 'actividades' | 'intercambios'; null en exploración
let pestanaActividades = 'pendientes'; // 'pendientes' | 'hechas'
let estadoAlEditar = null; // rutinas tal como estaban al entrar al modo edición: el cartel no cambia hasta "Listo" (AC-6.5 de la 004)

// La barra se arma desde las secciones: una pestaña por sección, siempre visible (AC-1.1, AC-1.7).
for (const s of SECCIONES) {
  const pestana = elemento('button', undefined, 'pestana');
  pestana.type = 'button';
  pestana.dataset.seccion = s.clave;
  pestana.append(elemento('span', s.icono, 'icono'), elemento('small', s.etiqueta, 'etiqueta'));
  pestana.addEventListener('click', () => abrirSeccion(s.clave));
  $('barra').append(pestana);
}

// Muestra u oculta la cruceta, el drawer y su sección, y marca la pestaña activa (AC-1.3, AC-1.7).
function mostrarChrome() {
  const edicion = seccion !== null;
  $('cruceta').style.display = edicion ? 'none' : 'grid';
  $('drawer').style.display = edicion ? 'block' : 'none';
  for (const el of document.querySelectorAll('#drawer .seccion')) el.style.display = el.id === `sec-${seccion}` ? 'block' : 'none';
  for (const b of document.querySelectorAll('#barra .pestana')) b.setAttribute('aria-pressed', String(b.dataset.seccion === seccion));
  $('drawer-titulo').textContent = SECCIONES.find((s) => s.clave === seccion)?.etiqueta ?? '';
}

// Cierra fichas, hojas y selectores abiertos sin guardar nada (AC-1.11, AC-12.4).
function cerrarFichasYHojas() {
  cerrarHoja();
  cerrarFicha();
  cerrarFichaActividad();
  cerrarFichaIntercambio();
  cerrarSelectorIconos();
  cerrarQuien();
  $('rutina').style.display = 'none';
  rutinaActual = null;
  cerrarFichaBloque();
}

// Entra al modo edición: los habitantes quedan quietos en la casilla a la que se dirigían (AC-7.2 de la 002). Espera si hay un paso en curso.
function entrarEdicion() {
  if (moviendo) return false;
  estadoAlEditar = estado;
  guardarPosicion();
  modo = 'edicion';
  moviles = congelarHabitantes(moviles);
  return true;
}

// Abre el drawer de una sección (AC-1.3); con otro abierto, cambia de sección sin salir de la edición ni mover la cámara (AC-1.4); tocar la
// pestaña activa cierra el drawer (AC-1.5).
function abrirSeccion(clave) {
  if (clave === seccion) { cerrarSeccion(); return; }
  const entrando = seccion === null;
  if (entrando && !entrarEdicion()) return;
  cerrarFichasYHojas();
  seccion = clave;
  if (clave === 'actividades') pestanaActividades = 'pendientes'; // AC-7.1
  mostrarChrome();
  pintarDrawer();
  if (entrando) escena().encuadrarHogar(); // el drawer ya tiene su altura fija: el hogar completo se ve por encima (AC-1.6)
}

// Vuelve a exploración con la cámara siguiendo a quien juega (AC-1.5, AC-3.8 de la 001).
function cerrarSeccion() {
  cerrarFichasYHojas();
  seccion = null;
  modo = 'exploracion';
  jugador = { id: jugador.id, ...resolverPosicion(distribucion, posGuardada) };
  guardarPosicion();
  ahora = ahoraLocal(new Date());
  // FR-6 de la 004: primero el jugador; después cada familiar donde dice su rutina en este momento, con los cambios hechos en edición.
  moviles = colocarHabitantes(idsHabitantes(), distribucion, casillaJugador(), azar, objetivosDeFamiliares(estado, ahora));
  mostrarChrome();
  const s = escena();
  s.redibujar();
  s.colocarPersonaje();
  s.seguirPersonaje();
  actualizarBotones(); // el nombre de quien juega pudo cambiar en la edición
}

$('listo').addEventListener('click', cerrarSeccion);

function aplicar(nuevo) {
  if (nuevo === estado) return;
  const t0 = performance.now();
  estado = nuevo;
  distribucion = generarDistribucion(estado);
  if (puedeJugar(estado, jugador.id)) jugador = { id: jugador.id, ...resolverPosicion(distribucion, posGuardada) };
  else pasarElJuegoAlPropietario(); // la persona que jugaba se eliminó (AC-4.7 de la 005)
  actualizarBotones(); // el indicador "Juega" y el rótulo de Intercambios se ven también en edición (AC-12.1, AC-1.8)
  moviles = sincronizarHabitantes(moviles, idsHabitantes(), distribucion, casillaJugador(), azar); // FR-7, AC-7.7 de la 002
  const s = escena();
  s.redibujar();
  ultimaRegeneracionMs = performance.now() - t0; // medición de la meta de 100 ms (NFR)
  guardarEstado(); // cada cambio del modo edición se guarda al aplicarse (FR-10 de la 001, AC-9.2)
  s.colocarPersonaje();
  pintarDrawer(); // antes de reencuadrar: el drawer tiene altura fija, pero su contenido puede cambiar
  s.encuadrarHogar();
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
  if (seccion) pintarDrawer();
  if (hojaActual) pintarHoja();
  actualizarBotones(); // cambia el número de propuestas recibidas
}

// El día cambió con la app abierta (FR-10 de la 003): burbujas, estados y objetos se recalculan con la nueva fecha.
function cambiarDia(fecha) {
  hoy = fecha;
  escena().refrescarActividades();
  if (seccion) pintarDrawer();
  if (hojaActual) pintarHoja();
}

// El minuto cambió en exploración (FR-3 de la 004): cada familiar con un objetivo nuevo empieza a ir a su lugar.
function cambiarMinuto(reloj) {
  ahora = reloj;
  moviles = fijarObjetivos(moviles, objetivosDeFamiliares(estado, ahora));
}

// Confirmación de eliminar un espacio (AC-5.3, AC-4.7 de la 001; AC-7.1, AC-7.4 y AC-7.6 de la 003; AC-10.1, AC-10.2, AC-10.4 y
// AC-10.6 de la 004): dice cuántas actividades y cuántos bloques de rutina se eliminan con él.
function confirmarEliminacion(id) {
  if (!requiereConfirmacion(estado, id)) return true;
  const espacio = buscarEspacio(estado, id);
  const c = consecuenciasDeEliminar(estado, id);
  const partes = [`¿Eliminar "${nombreVisible(estado, espacio)}"?`];
  if (c.banoSeElimina) partes.push('También se eliminará su baño interno.');
  if (c.tieneNombrePersonalizado) partes.push('Se perderá su nombre personalizado.');
  const bajas = textoBajas(c.actividades, c.bloques);
  if (bajas) partes.push(bajas);
  return window.confirm(partes.join(' '));
}

// Pinta el drawer de la sección abierta (FR-3, FR-4, FR-7 y FR-12 de la 007).
function pintarDrawer() {
  if (seccion === 'espacios') pintarEspacios();
  else if (seccion === 'familia') pintarFamilia();
  else if (seccion === 'actividades') pintarActividades();
  else if (seccion === 'intercambios') pintarIntercambios();
}

// Los textos escritos por el usuario se insertan siempre como texto, nunca como marcado (NFR de seguridad de la 003).
function elemento(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined) el.textContent = texto;
  if (clase) el.className = clase;
  return el;
}

// Drawer "Espacios" (AC-3.1): un contador por tipo de espacio con − y +; sin habitantes ni actividades.
function pintarEspacios() {
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
}

// Drawer "Familia" (AC-4.1 a AC-4.7): Familiares y Mascotas, cada una con su contador "n de límite", su "+" y la lista de sus habitantes.
function pintarFamilia() {
  const cont = $('sec-familia');
  cont.replaceChildren();
  const secciones = [
    ['familiar', 'Familiares', familiares(estado), 'Aún no hay familiares'],
    ['mascota', 'Mascotas', mascotas(estado), 'Aún no hay mascotas'],
  ];
  for (const [clase, titulo, lista, vacio] of secciones) {
    const mas = elemento('button', '+');
    mas.setAttribute('aria-label', `Agregar ${clase}`);
    mas.disabled = !puedeAgregarHabitante(estado, clase);
    mas.addEventListener('click', () => abrirFichaHabitante(clase, null));
    const cabecera = elemento('div', undefined, 'fila cabecera');
    cabecera.append(elemento('strong', titulo), elemento('span', `${contarHabitantes(estado, clase)} de ${LIMITES_HABITANTES[clase]}`, 'cuenta'), mas);
    cont.append(cabecera);
    if (lista.length === 0) cont.append(elemento('p', vacio, 'nota'));
    for (const m of lista) {
      const fila = elemento('div', undefined, 'fila actividad');
      fila.append(elemento('span', iconoDeMiembro(m), 'icono'), elemento('strong', m.nombre));
      fila.addEventListener('click', () => abrirFichaHabitante(clase, m.id));
      cont.append(fila);
    }
  }
}

// Drawer "Actividades" (AC-7.1 a AC-7.9): las pestañas Pendientes y Hechas (el historial de la 006).
function pintarActividades() {
  for (const b of document.querySelectorAll('#sec-actividades [data-pestana]')) b.setAttribute('aria-pressed', String(b.dataset.pestana === pestanaActividades));
  $('pendientes').style.display = pestanaActividades === 'pendientes' ? 'block' : 'none';
  $('hechas').style.display = pestanaActividades === 'hechas' ? 'block' : 'none';
  if (pestanaActividades === 'pendientes') pintarPendientes();
  else pintarHistorial();
}

for (const boton of document.querySelectorAll('#sec-actividades [data-pestana]')) {
  boton.addEventListener('click', () => {
    pestanaActividades = boton.dataset.pestana;
    if (pestanaActividades === 'hechas') reiniciarFiltroHistorial(); // AC-7.5: el filtro vuelve a "Todos"
    pintarActividades();
  });
}

// Pestaña "Pendientes" (AC-7.2, FR-8 de la 003): contador "n de 50", alta y lista de todas las pendientes.
function pintarPendientes() {
  const cont = $('pendientes');
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
    const nota = textoIntercambio(estado, a); // AC-8.6
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${lugar} · ${textoPlazo(a, hoy)}${nota ? ` · ${nota}` : ''}`));
    fila.append(elemento('span', GLIFO_ICONO[a.icono], 'icono'), datos);
    fila.addEventListener('click', () => abrirFichaActividad(a.id));
    cont.append(fila);
  }
}

// ---------- Fichas ----------
let fichaActual = null; // { tipo: 'espacio' | 'propietario' | 'habitante', id, clase?, icono? }

// Opciones del selector de iconos de un habitante: los aspectos de un familiar o las especies de una mascota (AC-5.2, AC-6.2).
function opcionesDeIcono(clase) {
  return clase === 'familiar'
    ? Object.entries(ASPECTOS).map(([clave, etiqueta]) => [clave, DATOS_ASPECTO[clave].icono, etiqueta])
    : Object.entries(ESPECIES).map(([clave, etiqueta]) => [clave, DATOS_ESPECIE[clave].icono, etiqueta]);
}
const glifoDeIcono = (clase, clave) => (clase === 'familiar' ? DATOS_ASPECTO[clave].icono : DATOS_ESPECIE[clave].icono);

// Selector de iconos (AC-5.2, AC-6.2, AC-8.7): una rejilla de [clave, icono, etiqueta] con la actual marcada; al elegir una, se cierra y llama a `alElegir`.
function abrirSelectorIconos(titulo, opcionesLista, actual, alElegir) {
  $('selector-titulo').textContent = titulo;
  $('selector-lista').replaceChildren(...opcionesLista.map(([clave, icono, etiqueta]) => {
    const boton = elemento('button', undefined, 'opcion-icono');
    boton.type = 'button';
    boton.setAttribute('aria-pressed', String(clave === actual));
    boton.append(elemento('span', icono, 'icono'), elemento('small', etiqueta));
    boton.addEventListener('click', () => { cerrarSelectorIconos(); alElegir(clave); });
    return boton;
  }));
  $('selector-iconos').style.display = 'flex';
}
const cerrarSelectorIconos = () => { $('selector-iconos').style.display = 'none'; };
$('selector-cerrar').addEventListener('click', cerrarSelectorIconos);

// Solo el alta de un habitante (id null) deshabilita guardar hasta tener nombre (AC-5.1, AC-6.1). La edición de un habitante existente lo
// deja activo: un nombre vacío llega a editarHabitante, que lo rechaza y se muestra el mensaje.
function actualizarGuardar() {
  const alta = fichaActual?.tipo === 'habitante' && !fichaActual.id;
  $('ficha-guardar').disabled = alta && $('ficha-nombre').value.trim() === '';
}

function pintarIconoFicha() {
  const boton = $('ficha-icono');
  boton.style.display = 'block';
  boton.textContent = glifoDeIcono(fichaActual.clase, fichaActual.icono);
  boton.setAttribute('aria-label', fichaActual.clase === 'familiar' ? 'Elegir aspecto' : 'Elegir especie');
}

$('ficha-icono').addEventListener('click', () => {
  const { clase, icono } = fichaActual;
  abrirSelectorIconos(clase === 'familiar' ? 'Aspecto' : 'Especie', opcionesDeIcono(clase), icono, (clave) => {
    fichaActual.icono = clave;
    pintarIconoFicha();
  });
});

// Ficha de un espacio o del personaje del propietario (como en la 001: solo renombrar; Eliminar solo en espacios; sin icono, AC-5.10).
function abrirFicha(tipo, id) {
  fichaActual = { tipo, id };
  const esEspacio = tipo === 'espacio';
  const espacio = esEspacio ? buscarEspacio(estado, id) : null;
  const miembro = esEspacio ? null : buscarMiembro(estado, id);
  $('ficha-titulo').textContent = esEspacio ? nombreVisible(estado, espacio) : miembro.nombre;
  $('ficha-nombre').value = esEspacio ? (espacio.nombrePersonalizado ?? '') : miembro.nombre;
  $('ficha-nombre').placeholder = esEspacio ? nombreAutomatico(estado, espacio) : 'Nombre del personaje';
  $('ficha-icono').style.display = 'none';
  $('ficha-rutina').style.display = 'none'; // solo los familiares tienen rutina (AC-1.1 de la 004)
  $('ficha-guardar').textContent = 'Renombrar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = esEspacio ? 'block' : 'none';
  $('ficha-eliminar').disabled = !esEspacio || !puedeEliminar(estado, id);
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

// Ficha de un habitante (AC-5.1, AC-5.6, AC-6.1, AC-6.5): alta si `id` es null; edición si no. Un botón de icono (aspecto o especie) a la izquierda
// del nombre, con "Neutro" u "Otro" por omisión en el alta (AC-5.3, AC-6.3).
function abrirFichaHabitante(clase, id) {
  const miembro = id ? buscarMiembro(estado, id) : null;
  const familiar = clase === 'familiar';
  const icono = miembro ? (familiar ? miembro.aspecto : miembro.especie) : (familiar ? ASPECTO_INICIAL : ESPECIE_INICIAL);
  fichaActual = { tipo: 'habitante', id, clase, icono };
  $('ficha-titulo').textContent = miembro ? miembro.nombre : (familiar ? 'Nuevo familiar' : 'Nueva mascota');
  $('ficha-nombre').value = miembro?.nombre ?? '';
  $('ficha-nombre').placeholder = familiar ? 'Nombre del familiar' : 'Nombre de la mascota';
  pintarIconoFicha();
  $('ficha-rutina').style.display = miembro && familiar ? 'block' : 'none'; // AC-1.1 de la 004
  $('ficha-guardar').textContent = 'Guardar';
  $('ficha-error').textContent = '';
  $('ficha-eliminar').style.display = miembro ? 'block' : 'none';
  $('ficha-eliminar').disabled = !miembro;
  actualizarGuardar();
  $('ficha').style.display = 'flex';
}

const cerrarFicha = () => { $('ficha').style.display = 'none'; fichaActual = null; };

// Ficha de cualquier miembro (AC-4.4 de la 005): la del propietario solo renombra; las de familiares y mascotas, la de siempre.
function abrirFichaDeMiembro(miembro) {
  if (esPropietario(estado, miembro)) abrirFicha('propietario', miembro.id);
  else abrirFichaHabitante(miembro.tipo === 'mascota' ? 'mascota' : 'familiar', miembro.id);
}

const burbujaEn = (x, y) => ubicarBurbujas(burbujas(estado, hoy), distribucion, posicionesDeMiembros()).find((b) => b.x === x && b.y === y) ?? null;

// Al tocar el mapa. En exploración responden el cartel y las burbujas (FR-8 de la 003, FR-5 de la 004). En edición responde solo lo de la sección
// abierta, según `accionDeToque` (FR-2 de la 007): Espacios, la ficha del espacio; Familia, la del propietario o el habitante y el cartel;
// Actividades, la hoja de la burbuja; Intercambios, nada.
function tocarMapa(x, y, enCartel) {
  if (modo === 'exploracion' && enCartel) { abrirHoja({ tipo: 'fuera' }); return; }
  if (y < 0 || y >= distribucion.alto || x < 0 || x >= distribucion.ancho) return;
  if (modo === 'exploracion') {
    const burbuja = burbujaEn(x, y);
    if (burbuja) abrirHoja(burbuja);
    return;
  }
  const ocupante = ocupanteEn(x, y, posicionesDeMiembros(), propietario().id); // AC-2.2: el propietario, luego el habitante
  const clave = distribucion.espacioEn[y][x];
  const accion = accionDeToque(seccion, {
    ocupante, enCartel, burbuja: burbujaEn(x, y), espacioId: clave && buscarEspacio(estado, clave) ? clave : null,
  });
  if (!accion) return;
  if (accion.tipo === 'ficha-espacio') abrirFicha('espacio', accion.id);
  else if (accion.tipo === 'ficha-miembro') abrirFichaDeMiembro(buscarMiembro(estado, accion.id));
  else if (accion.tipo === 'hoja-fuera') abrirHoja({ tipo: 'fuera' });
  else if (accion.tipo === 'hoja') abrirHoja(accion.lugar);
}

$('ficha').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const { tipo, id, clase } = fichaActual;
  const texto = $('ficha-nombre').value;
  let r;
  if (tipo === 'espacio') r = renombrarEspacio(estado, id, texto, ctx);
  else if (tipo === 'propietario') r = renombrarMiembro(estado, id, texto, ctx);
  else {
    const datos = clase === 'familiar' ? { nombre: texto, aspecto: fichaActual.icono } : { nombre: texto, especie: fichaActual.icono };
    r = id ? editarHabitante(estado, id, datos, ctx) : agregarHabitante(estado, clase, datos, ctx);
  }
  if (!r.ok) { $('ficha-error').textContent = MENSAJES_ERROR[r.error]; return; }
  cerrarFicha();
  aplicar(r.estado);
});
$('ficha-nombre').addEventListener('input', () => { $('ficha-error').textContent = ''; actualizarGuardar(); });
$('ficha-cancelar').addEventListener('click', cerrarFicha);
$('ficha-eliminar').addEventListener('click', () => {
  const { tipo, id } = fichaActual;
  if (tipo === 'habitante') {
    const bajas = textoBajas(pendientesDeMiembro(estado, id), bloquesDeMiembro(estado, id));
    const pregunta = `¿Eliminar a "${buscarMiembro(estado, id).nombre}"?${bajas ? ` ${bajas}` : ''}`;
    if (!window.confirm(pregunta)) return; // AC-8.1, AC-8.2 de la 002; AC-7.7, AC-7.8 de la 003; AC-10.7 a AC-10.9 de la 004
    cerrarFicha();
    aplicar(eliminarHabitante(estado, id, ctx));
    return;
  }
  if (!confirmarEliminacion(id)) return;
  cerrarFicha();
  aplicar(eliminarEspacio(estado, id, ctx));
});

$('ficha-rutina').addEventListener('click', () => abrirRutina(fichaActual.id));

// ---------- Hoja de un lugar (FR-7 de la 003) ----------

function abrirHoja(lugar) {
  hojaActual = { tipo: lugar.tipo, id: lugar.id };
  pintarHoja();
}

const cerrarHoja = () => { $('hoja').style.display = 'none'; hojaActual = null; };

// En exploración, cada actividad ofrece solo "Hecho" (AC-3.1); en edición, Editar y Eliminar (AC-6.7).
// La hoja se cierra cuando el lugar ya no tiene actividades por hacer (AC-3.2).
function pintarHoja() {
  if (hojaActual.tipo === 'fuera') { pintarHojaFuera(); return; }
  const lugar = hojaActual.tipo === 'espacio' ? buscarEspacio(estado, hojaActual.id) : buscarMiembro(estado, hojaActual.id);
  const lista = lugar ? actividadesDelLugar(estado, hojaActual, hoy) : [];
  if (lista.length === 0) { cerrarHoja(); return; }
  $('hoja-titulo').textContent = hojaActual.tipo === 'espacio' ? nombreVisible(estado, lugar) : lugar.nombre;
  const cont = $('hoja-lista');
  cont.replaceChildren();
  for (const a of lista) {
    const datos = elemento('span');
    const nota = textoIntercambio(estado, a); // AC-8.6
    datos.append(elemento('strong', a.nombre), elemento('small', `${buscarMiembro(estado, a.miembroId).nombre} · ${textoPlazo(a, hoy)}${nota ? ` · ${nota}` : ''}`));
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

// Hoja del cartel (FR-5 de la 004): los familiares fuera con su hora de vuelta y "!" si tienen actividades por hacer sin espacio.
// En exploración, la fila con "!" abre la hoja de actividades de ese familiar (AC-5.9); en edición, cada fila abre su ficha (AC-5.12).
function pintarHojaFuera() {
  const fuera = familiaresFuera();
  if (fuera.length === 0) { cerrarHoja(); return; }
  $('hoja-titulo').textContent = 'Fuera de casa';
  const cont = $('hoja-lista');
  cont.replaceChildren();
  for (const h of fuera) {
    const conPendientes = tienePendientesSinEspacio(h.id);
    const datos = elemento('span');
    datos.append(elemento('strong', buscarMiembro(estado, h.id).nombre), elemento('small', textoVuelta(modo === 'edicion' ? estadoAlEditar : estado, h.id, ahora)));
    const item = elemento('div', undefined, 'item');
    item.append(elemento('span', conPendientes ? '!' : '', 'icono'), datos, elemento('span'));
    if (modo === 'edicion') {
      item.classList.add('tocable');
      item.addEventListener('click', () => { cerrarHoja(); abrirFichaHabitante('familiar', h.id); });
    } else if (conPendientes) {
      item.classList.add('tocable');
      item.addEventListener('click', () => abrirHoja({ tipo: 'miembro', id: h.id }));
    }
    cont.append(item);
  }
  $('hoja').style.display = 'block';
}

// ---------- Ficha de una actividad (FR-8 y FR-9 de la 007) ----------
let actividadEnFicha = null; // id de la actividad en edición, o null en un alta
let fichaAct = null; // estado de la ficha abierta: { quien, lugares (Set de ids), icono ({ icono, editable, manual }), desplegada }

function opciones(select, pares, valor) {
  select.replaceChildren(...pares.map(([clave, texto]) => new Option(texto, clave)));
  select.value = valor;
}

// Alta (AC-8.1, AC-9.2, AC-9.4): nombre vacío, icono 📌, quien juega, hoy, una vez y sin lugar. Edición: los datos de la actividad (AC-8.15).
function abrirFichaActividad(id) {
  actividadEnFicha = id;
  const a = id ? buscarActividad(estado, id) : null;
  fichaAct = {
    quien: a ? a.miembroId : jugador.id,
    lugares: new Set(a?.espacioId ? [a.espacioId] : []),
    icono: a ? iconoDeEdicion(a.nombre, a.icono) : iconoDeFicha('', null),
    desplegada: false,
  };
  $('actividad-titulo').textContent = a ? a.nombre : 'Nueva actividad';
  $('actividad-nombre').value = a?.nombre ?? '';
  $('actividad-vence').value = a?.vence ?? hoy;
  opciones($('actividad-recurrencia'), OPCIONES_RECURRENCIA, a ? valorDeRecurrencia(a) : '0');
  $('actividad-nota').textContent = a ? textoIntercambio(estado, a) : ''; // AC-8.6 de la 005
  $('actividad-error').textContent = '';
  $('actividad-eliminar').style.display = a ? 'block' : 'none';
  pintarFichaActividad();
  $('ficha-actividad').style.display = 'flex';
}

// Repinta lo que depende del estado de la ficha: icono, sugerencias, responsable, lugares y resumen; y habilita Guardar.
function pintarFichaActividad() {
  const texto = $('actividad-nombre').value;
  const icono = $('actividad-icono');
  icono.textContent = GLIFO_ICONO[fichaAct.icono.icono];
  icono.setAttribute('aria-disabled', String(!fichaAct.icono.editable));
  icono.setAttribute('aria-label', fichaAct.icono.editable ? 'Elegir icono' : 'Icono de la sugerencia');
  $('actividad-sugerencias').replaceChildren(...sugerenciasPara(texto).map((s) => { // AC-8.2, AC-8.3
    const chip = elemento('button', `${GLIFO_ICONO[s.icono]} ${s.nombre}`, 'chip');
    chip.type = 'button';
    chip.addEventListener('click', () => { $('actividad-nombre').value = s.nombre; alCambiarNombre(); }); // AC-8.5
    return chip;
  }));
  $('actividad-quien').replaceChildren(...personasQueJuegan(estado).map((m) => { // AC-9.1: personas, nunca mascotas
    const circulo = elemento('button', inicialDe(m.nombre), 'circulo');
    circulo.type = 'button';
    circulo.style.background = colorCss(colorDe(m));
    circulo.setAttribute('aria-label', m.nombre);
    circulo.setAttribute('aria-pressed', String(m.id === fichaAct.quien));
    circulo.addEventListener('click', () => { fichaAct.quien = m.id; pintarFichaActividad(); }); // AC-9.3
    return circulo;
  }));
  const espacios = espaciosActivos(estado);
  $('actividad-lugares').replaceChildren(...espacios.map((e) => { // AC-10.1
    const chip = elemento('button', nombreVisible(estado, e), 'chip');
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(fichaAct.lugares.has(e.id)));
    chip.addEventListener('click', () => alTocarLugar(e.id));
    return chip;
  }));
  $('actividad-resumen').textContent = resumenDeFicha({
    vence: $('actividad-vence').value, hoy, recurrencia: $('actividad-recurrencia').value,
    lugares: espacios.filter((e) => fichaAct.lugares.has(e.id)).map((e) => nombreVisible(estado, e)),
  });
  $('actividad-mas').style.display = fichaAct.desplegada ? 'block' : 'none';
  $('actividad-cambiar').textContent = fichaAct.desplegada ? 'Ocultar' : 'Cambiar';
  // En un alta, guardar se activa con nombre y responsable (AC-8.12). En una edición queda activo: un nombre vacío llega a editarActividad,
  // que lo rechaza con su mensaje (AC-6.5 de la 003).
  $('actividad-guardar').disabled = actividadEnFicha === null && ($('actividad-nombre').value.trim() === '' || fichaAct.quien === '');
}

// Al crear, los lugares son de selección múltiple (AC-10.1); al editar, de selección única y se pueden desmarcar (AC-10.8).
function alTocarLugar(id) {
  if (actividadEnFicha) fichaAct.lugares = new Set(fichaAct.lugares.has(id) ? [] : [id]);
  else if (fichaAct.lugares.has(id)) fichaAct.lugares.delete(id);
  else fichaAct.lugares.add(id);
  pintarFichaActividad();
}

// Al cambiar el texto del nombre, el icono se recalcula (AC-8.5 a AC-8.11): fijo con una sugerencia, a mano o genérico si no.
function alCambiarNombre() {
  fichaAct.icono = iconoDeFicha($('actividad-nombre').value, fichaAct.icono.manual);
  $('actividad-error').textContent = '';
  pintarFichaActividad();
}

const cerrarFichaActividad = () => { $('ficha-actividad').style.display = 'none'; actividadEnFicha = null; fichaAct = null; };

function datosDeFichaActividad() {
  return {
    nombre: $('actividad-nombre').value, icono: fichaAct.icono.icono, miembroId: fichaAct.quien, espacioId: [...fichaAct.lugares][0] ?? null,
    vence: $('actividad-vence').value, ...datosDeRecurrencia($('actividad-recurrencia').value),
  };
}

// Eliminar una actividad pide confirmación con su nombre (AC-6.6). Devuelve si se eliminó.
function confirmarYEliminarActividad(id) {
  const a = buscarActividad(estado, id);
  if (!a || !window.confirm(`¿Eliminar la actividad "${a.nombre}"?`)) return false;
  aplicarActividades(eliminarActividad(estado, id, ctx));
  return true;
}

// Guardar: una edición cambia solo esa actividad; un alta crea una por cada lugar marcado, o una sin espacio (AC-9.9, AC-10.2, AC-10.3).
$('ficha-actividad').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const datos = datosDeFichaActividad();
  const r = actividadEnFicha
    ? editarActividad(estado, actividadEnFicha, datos, ctx)
    : agregarActividades(estado, datos, [...fichaAct.lugares], ctx);
  if (!r.ok) { $('actividad-error').textContent = MENSAJES_ACTIVIDAD[r.error]; return; }
  cerrarFichaActividad();
  aplicarActividades(r.estado);
});
$('actividad-nombre').addEventListener('input', alCambiarNombre);
$('actividad-icono').addEventListener('click', () => {
  if (!fichaAct.icono.editable) return; // con una sugerencia el icono es el suyo (AC-8.5)
  const lista = Object.entries(ICONOS).map(([clave, etiqueta]) => [clave, GLIFO_ICONO[clave], etiqueta]);
  abrirSelectorIconos('Icono de la actividad', lista, fichaAct.icono.icono, (clave) => {
    fichaAct.icono = iconoDeFicha($('actividad-nombre').value, clave); // AC-8.7
    pintarFichaActividad();
  });
});
for (const campo of ['actividad-vence', 'actividad-recurrencia']) {
  $(campo).addEventListener('input', () => { $('actividad-error').textContent = ''; pintarFichaActividad(); });
}
$('actividad-cambiar').addEventListener('click', () => { fichaAct.desplegada = !fichaAct.desplegada; pintarFichaActividad(); }); // AC-9.5
$('actividad-cancelar').addEventListener('click', cerrarFichaActividad);
$('actividad-eliminar').addEventListener('click', () => {
  if (confirmarYEliminarActividad(actividadEnFicha)) cerrarFichaActividad();
});

// ---------- Rutina de un familiar (FR-8 de la 004) ----------
let rutinaActual = null; // { miembroId, dias } de la rutina abierta
let bloqueEnFicha = null; // id del bloque en edición, o null en un alta
const MINUTOS_INICIO = Array.from({ length: 48 }, (_, i) => i * 30); // 00:00 a 23:30
const MINUTOS_FIN = MINUTOS_INICIO.map((m) => m + 30); // 00:30 a 24:00

function abrirRutina(miembroId) {
  cerrarFicha();
  rutinaActual = { miembroId, dias: 'laborables' };
  pintarRutina();
  $('rutina').style.display = 'flex';
}

// Selector de horario, contador "n de 8", lista por inicio y "+ Bloque" (AC-1.2, AC-1.3, AC-1.9).
function pintarRutina() {
  const { miembroId, dias } = rutinaActual;
  $('rutina-titulo').textContent = `Rutina de ${buscarMiembro(estado, miembroId).nombre}`;
  for (const boton of document.querySelectorAll('#rutina [data-dias]')) boton.setAttribute('aria-pressed', String(boton.dataset.dias === dias));
  $('rutina-cuenta').textContent = `${contarBloques(estado, miembroId, dias)} de ${LIMITE_BLOQUES}`;
  $('rutina-agregar').disabled = !puedeAgregarBloque(estado, miembroId, dias);
  const lista = bloquesDe(estado, miembroId, dias);
  $('rutina-lista').replaceChildren(...(lista.length === 0 ? [elemento('p', 'Sin bloques')] : lista.map((b) => {
    const fila = elemento('div', textoBloque(estado, b), 'bloque');
    fila.addEventListener('click', () => abrirFichaBloque(b.id));
    return fila;
  })));
}

// Al cerrar la rutina se vuelve a la ficha del familiar (AC-2.7).
function cerrarRutina() {
  const { miembroId } = rutinaActual;
  $('rutina').style.display = 'none';
  rutinaActual = null;
  abrirFichaHabitante('familiar', miembroId);
}

$('rutina-cerrar').addEventListener('click', cerrarRutina);
for (const boton of document.querySelectorAll('#rutina [data-dias]')) {
  boton.addEventListener('click', () => { rutinaActual.dias = boton.dataset.dias; pintarRutina(); });
}
$('rutina-agregar').addEventListener('click', () => abrirFichaBloque(null));

// Ficha de un bloque (AC-1.4, AC-2.1): alta sin valores elegidos; edición con inicio, fin y lugar actuales.
function abrirFichaBloque(id) {
  bloqueEnFicha = id;
  const b = id ? buscarBloque(estado, id) : null;
  $('bloque-titulo').textContent = `${b ? 'Bloque' : 'Nuevo bloque'} · ${DIAS_RUTINA[rutinaActual.dias]}`;
  opciones($('bloque-inicio'), [['', 'Inicio…'], ...MINUTOS_INICIO.map((m) => [String(m), textoHora(m)])], b ? String(b.inicio) : '');
  opciones($('bloque-fin'), [['', 'Fin…'], ...MINUTOS_FIN.map((m) => [String(m), textoHora(m)])], b ? String(b.fin) : '');
  const lugares = [['fuera', 'Fuera de casa'], ...espaciosActivos(estado).map((e) => [e.id, nombreVisible(estado, e)])];
  opciones($('bloque-lugar'), [['', 'Lugar…'], ...lugares], b ? (b.espacioId ?? 'fuera') : '');
  $('bloque-error').textContent = '';
  $('bloque-eliminar').style.display = b ? 'block' : 'none';
  actualizarFichaBloque();
  $('ficha-bloque').style.display = 'flex';
}

// Guardar se activa con inicio, fin y lugar elegidos (AC-1.5); fin no posterior y superposición los rechaza el dominio con su
// mensaje (AC-1.7, AC-1.8, AC-2.3, AC-2.4).
function actualizarFichaBloque() {
  $('bloque-guardar').disabled = ['bloque-inicio', 'bloque-fin', 'bloque-lugar'].some((campo) => $(campo).value === '');
}

const cerrarFichaBloque = () => { $('ficha-bloque').style.display = 'none'; bloqueEnFicha = null; };

// Los cambios de rutina se guardan al aplicarse (AC-11.2) y no mueven a nadie hasta tocar "Listo" (AC-6.5).
function aplicarRutina(nuevo) {
  estado = nuevo;
  guardarEstado();
  pintarRutina();
}

$('ficha-bloque').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const lugar = $('bloque-lugar').value;
  const datos = { inicio: Number($('bloque-inicio').value), fin: Number($('bloque-fin').value), espacioId: lugar === 'fuera' ? null : lugar };
  const { miembroId, dias } = rutinaActual;
  const r = bloqueEnFicha ? editarBloque(estado, bloqueEnFicha, datos, ctx) : agregarBloque(estado, { ...datos, miembroId, dias }, ctx);
  if (!r.ok) { $('bloque-error').textContent = MENSAJES_BLOQUE[r.error]; return; }
  cerrarFichaBloque();
  aplicarRutina(r.estado);
});
for (const campo of ['bloque-inicio', 'bloque-fin', 'bloque-lugar']) {
  $(campo).addEventListener('change', () => { $('bloque-error').textContent = ''; actualizarFichaBloque(); });
}
$('bloque-cancelar').addEventListener('click', cerrarFichaBloque);
// Eliminar un bloque pide confirmación con el familiar y el horario (AC-2.5).
$('bloque-eliminar').addEventListener('click', () => {
  const b = buscarBloque(estado, bloqueEnFicha);
  const pregunta = `¿Eliminar el bloque ${textoBloque(estado, b)} de "${buscarMiembro(estado, b.miembroId).nombre}" (${DIAS_RUTINA[b.dias]})?`;
  if (!window.confirm(pregunta)) return;
  cerrarFichaBloque();
  aplicarRutina(eliminarBloque(estado, b.id, ctx));
});

// ---------- Quién juega (FR-1 a FR-6 de la 005) ----------

function actualizarBotones() {
  $('juega').textContent = `Juega: ${buscarMiembro(estado, jugador.id).nombre}`; // AC-12.1
  const pestana = document.querySelector('#barra [data-seccion="intercambios"] .etiqueta');
  pestana.textContent = textoPestana('intercambios', numeroRecibidas(estado, jugador.id)); // AC-1.8
}

const cerrarQuien = () => { $('quien').style.display = 'none'; };

// Lista "¿Quién juega?" (AC-1.3, AC-3.1): el propietario y los familiares; un familiar fuera de casa también se puede elegir.
function abrirQuien() {
  const cont = $('quien-lista');
  cont.replaceChildren();
  for (const m of personasQueJuegan(estado)) {
    const datos = elemento('span');
    datos.append(elemento('strong', m.nombre));
    if (moviles.some((h) => h.id === m.id && h.fase === 'fuera')) datos.append(elemento('small', 'Fuera de casa · entra por la puerta'));
    const fila = elemento('div', undefined, 'item tocable');
    fila.append(datos, elemento('span', m.id === jugador.id ? 'Jugando' : ''));
    fila.addEventListener('click', () => { cerrarQuien(); elegirJugador(m.id); });
    cont.append(fila);
  }
  $('quien').style.display = 'flex';
}

// Cambia quién juega sin mover a nadie (FR-2): lo hace la lógica pura; aquí se guarda, se redibuja y se centra la cámara.
function elegirJugador(id) {
  if (id === jugador.id || !puedeJugar(estado, id)) { cambioPendiente = null; return; }
  if (moviendo) { cambioPendiente = id; return; } // se aplica al terminar el paso (AC-2.7)
  cambioPendiente = null;
  const t0 = performance.now();
  const saliente = { id: jugador.id, x: jugador.x, y: jugador.y, direccion: jugador.direccion };
  const r = cambiarJugador(moviles, saliente, id, distribucion, objetivosDeFamiliares(estado, ahora));
  moviles = modo === 'edicion' ? congelarHabitantes(r.moviles) : r.moviles; // en edición nadie camina (AC-12.4)
  jugador = r.jugador;
  cerrarFichasYHojas(); // AC-12.4
  guardarPosicion(); // AC-5.2
  actualizarBotones();
  const s = escena();
  s.colocarPersonaje();
  if (modo === 'edicion') s.encuadrarHogar(); // la cámara sigue en el encuadre completo (AC-12.4)
  else s.seguirPersonaje(); // centra la cámara y rehace etiquetas, nombres, burbujas y cartel
  if (seccion) pintarDrawer(); // el drawer sigue en su pestaña, con el contenido de la nueva persona (AC-12.3)
  ultimaRegeneracionMs = performance.now() - t0; // meta de 100 ms (AC-2.10)
}

// Si se elimina a quien jugaba (en el modo edición), juega el propietario en la casilla donde estaba (AC-4.7).
function pasarElJuegoAlPropietario() {
  const r = cambiarJugador(moviles, null, propietario().id, distribucion);
  moviles = r.moviles;
  jugador = r.jugador;
  guardarPosicion();
}

$('juega').addEventListener('click', abrirQuien);
$('quien-cerrar').addEventListener('click', cerrarQuien);

// ---------- Intercambios (FR-7 a FR-11 de la 005, FR-12 de la 007) ----------
const MOTIVOS_SIN_PROPUESTA = { limite: MENSAJES_INTERCAMBIO.limite, nada: 'No hay actividades para intercambiar' };

// Panel de quien juega (AC-6.2): sus propuestas recibidas (Aceptar, Rechazar) y enviadas (Retirar); una que dejó de ser vigente
// se muestra como "Ya no vigente" y solo ofrece "Quitar" (AC-7.8).
function pintarIntercambios() {
  const { recibidas, enviadas } = intercambiosDe(estado, jugador.id);
  pintarListaIntercambios($('intercambios-recibidas'), recibidas, 'recibida');
  pintarListaIntercambios($('intercambios-enviadas'), enviadas, 'enviada');
  const motivo = motivoSinPropuesta(estado, jugador.id);
  $('intercambios-proponer').disabled = motivo !== null; // AC-6.6, AC-6.7
  $('intercambios-motivo').textContent = motivo ? MOTIVOS_SIN_PROPUESTA[motivo] : '';
}

function pintarListaIntercambios(cont, lista, vista) {
  cont.replaceChildren(...(lista.length === 0 ? [elemento('p', 'Ninguna')] : lista.map((i) => {
    const vigente = esVigente(estado, i);
    const datos = elemento('span');
    datos.append(elemento('strong', textoPropuesta(estado, i, vista)));
    if (!vigente) datos.append(elemento('small', 'Ya no vigente'));
    const botones = elemento('span', undefined, 'botones');
    const accion = (texto, operacion, clase) => {
      const boton = elemento('button', texto, clase);
      boton.addEventListener('click', () => responderIntercambio(operacion(estado, i.id, jugador.id, ctx)));
      botones.append(boton);
    };
    if (!vigente) accion('Quitar', quitar);
    else if (vista === 'recibida') { accion('Aceptar', aceptar); accion('Rechazar', rechazar, 'peligro'); }
    else accion('Retirar', retirar);
    const fila = elemento('div', undefined, 'item');
    fila.append(datos, botones);
    return fila;
  })));
}

// Los cambios de intercambios usan el mismo camino que los de actividades: guardan, redibujan burbujas y estados y repintan la hoja.
function responderIntercambio(r) {
  if (!r.ok) { avisar(MENSAJES_INTERCAMBIO[r.error]); return; }
  aplicarActividades(r.estado);
}

// Ficha de proponer (AC-6.3, AC-6.4): dos listas sin valor inicial; guardar se activa con las dos elegidas.
function abrirFichaIntercambio() {
  const ofrecibles = actividadesOfrecibles(estado, jugador.id);
  const pedibles = actividadesPedibles(estado, jugador.id);
  opciones($('intercambio-ofrecida'), [['', 'Tu actividad…'], ...ofrecibles.map((a) => [a.id, `${a.nombre} · ${textoPlazo(a, hoy)}`])], '');
  opciones($('intercambio-pedida'), [['', 'Por la de…'], ...pedibles.map((a) => [a.id, `${a.nombre} · ${buscarMiembro(estado, a.miembroId).nombre}`])], '');
  $('intercambio-error').textContent = '';
  actualizarFichaIntercambio();
  $('ficha-intercambio').style.display = 'flex';
}
const actualizarFichaIntercambio = () => {
  $('intercambio-guardar').disabled = $('intercambio-ofrecida').value === '' || $('intercambio-pedida').value === '';
};
const cerrarFichaIntercambio = () => { $('ficha-intercambio').style.display = 'none'; };

$('intercambios-proponer').addEventListener('click', abrirFichaIntercambio);
$('intercambio-cancelar').addEventListener('click', cerrarFichaIntercambio);
for (const campo of ['intercambio-ofrecida', 'intercambio-pedida']) $(campo).addEventListener('change', actualizarFichaIntercambio);
$('ficha-intercambio').querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const r = proponer(estado, { proponenteId: jugador.id, ofrecidaId: $('intercambio-ofrecida').value, pedidaId: $('intercambio-pedida').value }, ctx);
  if (!r.ok) { $('intercambio-error').textContent = MENSAJES_INTERCAMBIO[r.error]; return; } // AC-6.9
  cerrarFichaIntercambio();
  aplicarActividades(r.estado);
});

// ---------- Historial y calificaciones (FR-3 a FR-6 de la 006) ----------
let filtroHistorial = null; // null = "Todos"; si no, el id de un miembro. Vuelve a "Todos" cada vez que se muestra la pestaña "Hechas" (AC-3.10)

// El filtro vuelve a "Todos" cada vez que se muestra la pestaña "Hechas" (AC-3.10 de la 006, AC-7.5 de la 007). Ofrece las personas y solo las
// mascotas con alguna entrada.
function reiniciarFiltroHistorial() {
  filtroHistorial = null;
  opciones($('historial-filtro'), [['', 'Todos'], ...miembrosDelFiltro(estado).map((m) => [m.id, m.nombre])], '');
  $('historial-error').textContent = '';
}

// Lista del panel (AC-2.3, AC-2.6): el resumen del miembro elegido y una fila por entrada, de la más reciente a la más antigua.
function pintarHistorial() {
  const lista = filtroHistorial === null ? entradasDelHistorial(estado) : entradasDe(estado, filtroHistorial);
  $('historial-resumen').textContent = textoResumen(estado, filtroHistorial); // AC-3.3, AC-3.4, AC-3.6
  $('historial-lista').replaceChildren(...(lista.length === 0
    ? [elemento('p', textoVacio(estado, filtroHistorial))]
    : lista.map(filaDeHistorial)));
}

// Fila de una entrada (AC-2.4): icono y nombre, persona · espacio · día, y cinco estrellas. Según `estadoDeCalificacion`, las estrellas se
// pueden tocar (libre, mía) o no (propia, bloqueada), y solo una calificación mía ofrece "Quitar" (AC-4.1, AC-4.3, AC-5.1, AC-5.5).
function filaDeHistorial(entrada) {
  const situacion = estadoDeCalificacion(entrada, jugador.id);
  const titulo = elemento('div');
  titulo.append(elemento('span', GLIFO_ICONO[entrada.icono], 'icono'), elemento('strong', entrada.nombre));
  const estrellas = elemento('span', undefined, 'estrellas');
  for (let k = 1; k <= MAX_ESTRELLAS; k += 1) {
    const boton = elemento('button', entrada.estrellas !== null && k <= entrada.estrellas ? '★' : '☆');
    boton.type = 'button';
    boton.disabled = situacion === 'propia' || situacion === 'bloqueada';
    boton.setAttribute('aria-label', `${k} ${k === 1 ? 'estrella' : 'estrellas'}`);
    boton.addEventListener('click', () => aplicarHistorial(calificar(estado, entrada.id, jugador.id, k, ctx)));
    estrellas.append(boton);
  }
  const pie = elemento('div', undefined, 'pie');
  pie.append(estrellas);
  const nota = textoCalificacion(estado, entrada, jugador.id);
  if (nota) pie.append(elemento('small', nota));
  if (situacion === 'mia') {
    const quitarEstrellas = elemento('button', 'Quitar', 'peligro');
    quitarEstrellas.type = 'button';
    quitarEstrellas.addEventListener('click', () => aplicarHistorial(quitarCalificacion(estado, entrada.id, jugador.id, ctx)));
    pie.append(quitarEstrellas);
  }
  const fila = elemento('div', undefined, 'fila-historial');
  fila.append(titulo, elemento('small', textoLinea(estado, entrada, hoy)), pie);
  return fila;
}

// Aplica una calificación: guarda en el momento (AC-8.2), repinta conservando el desplazamiento (AC-2.7) y mide los 100 ms (AC-2.10).
// Las mismas estrellas no cambian nada (AC-5.3); un rechazo muestra su motivo y no cambia nada (AC-4.7).
function aplicarHistorial(r) {
  if (!r.ok) { $('historial-error').textContent = MENSAJES_HISTORIAL[r.error]; return; }
  $('historial-error').textContent = '';
  if (r.estado === estado) return;
  const t0 = performance.now();
  estado = r.estado;
  guardarEstado();
  const desplazamiento = $('drawer').scrollTop;
  pintarHistorial();
  $('drawer').scrollTop = desplazamiento;
  ultimaRegeneracionMs = performance.now() - t0;
}

$('historial-filtro').addEventListener('change', () => {
  filtroHistorial = $('historial-filtro').value || null;
  pintarHistorial();
});

// ---------- Ciclo de vida ----------
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && modo === 'exploracion') guardarPosicion();
});
actualizarBotones();
mostrarChrome();
if (inicio.aviso) avisar(inicio.aviso);
