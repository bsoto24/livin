// src/catalogo.js
export const TIPOS = ['sala', 'comedor', 'cocina', 'bano', 'lavanderia', 'mascota', 'dormitorio', 'oficina'];

export const ETIQUETAS = {
  sala: 'Sala', comedor: 'Comedor', cocina: 'Cocina', bano: 'Baño',
  lavanderia: 'Lavandería', mascota: 'Espacio de mascota',
  dormitorio: 'Dormitorio', oficina: 'Oficina',
};

export const LIMITES = {
  sala: { min: 1, max: 1 }, comedor: { min: 0, max: 1 }, cocina: { min: 1, max: 2 },
  lavanderia: { min: 0, max: 2 }, mascota: { min: 0, max: 2 },
  dormitorio: { min: 1, max: 4 }, oficina: { min: 0, max: 2 },
  // bano: min 1, max dinámico = 1 + dormitorios + oficinas (ver hogar.js)
};

export const ZONA_SERVICIO = ['cocina', 'bano', 'lavanderia', 'mascota'];
export const ZONA_PRIVADA = ['dormitorio', 'oficina'];
export const ADMITE_BANO = ['dormitorio', 'oficina'];

// Leyenda: '#' pared, '.' piso, '*' aparición (piso). Mobiliario (bloquea):
// B cama, n velador, S sofá, T mesa de centro, M mesa comedor, s silla comedor,
// K cocina, R refrigeradora, L lavadero, W inodoro, w lavamanos, U ducha,
// E escritorio, e silla de escritorio, V lavadora, P cama de mascota, o plato.
export const TRANSITABLE = new Set(['.', '*']);

// Piezas de zona lateral: puerta en la pared que mira al centro, en la fila `puerta`.
export const PIEZAS = {
  cocina: { filas: ['########', '#KLR...#', '#......#', '#......#', '#......#', '########'], puerta: 2 },
  bano: { filas: ['########', '#WwU...#', '#......#', '#......#', '########'], puerta: 2 },
  lavanderia: { filas: ['########', '#VV....#', '#......#', '#......#', '########'], puerta: 2 },
  mascota: { filas: ['########', '#P.o...#', '#......#', '#......#', '########'], puerta: 2 },
  dormitorio: {
    filas: ['#########', '#.....nB#', '#......B#', '#.......#', '#.......#', '#.......#', '#########'],
    puerta: 3,
    conBano: {
      filas: ['#########', '#Bn..#WU#', '#B.....w#', '#....#..#', '#....####', '#.......#', '#########'],
      banoRect: { x: 5, y: 0, w: 4, h: 5 },
    },
  },
  oficina: {
    filas: ['#########', '#....EE.#', '#....e..#', '#.......#', '#.......#', '#########'],
    puerta: 3,
    conBano: {
      filas: ['#########', '#EE..#WU#', '#e.....w#', '#....#..#', '#....####', '#########'],
      banoRect: { x: 5, y: 0, w: 4, h: 5 },
    },
  },
};

// Columna central (ancho 10). El comedor no tiene pared inferior: forma un solo
// espacio con la sala. La sala se estira repitiendo `salaEstirable`.
export const CENTRO = {
  ancho: 10,
  paredSuperior: '##########',
  comedor: ['##########', '#........#', '#..MMMM..#', '#..ssss..#', '#........#', '#........#'],
  sala: ['#........#', '#..SSSS..#', '#........#', '#...TT...#', '#....*...#'],
  salaEstirable: '#........#',
  paredInferior: '##########',
};

export const ANCHO_PASILLO = 3;
export const FILA_PUERTA_PASILLO = 2;

// Habitantes (features 002 y 007, ADR-007 de aspecto): listas cerradas y límites. Las claves se guardan; las etiquetas se muestran.
// El aspecto de un familiar mezcla edad y género; cada uno lleva su icono, su color de marcador y su escala de dibujo.
export const ASPECTOS = {
  adulto: 'Adulto', adulta: 'Adulta', nino: 'Niño', nina: 'Niña', anciano: 'Anciano', anciana: 'Anciana', neutro: 'Neutro',
};
export const DATOS_ASPECTO = {
  adulto: { icono: '👨', color: 0x3a7bd5, escala: 1 },
  adulta: { icono: '👩', color: 0xe8833a, escala: 1 },
  nino: { icono: '👦', color: 0x3a7bd5, escala: 0.75 },
  nina: { icono: '👧', color: 0xe8833a, escala: 0.75 },
  anciano: { icono: '👴', color: 0x3a7bd5, escala: 1 },
  anciana: { icono: '👵', color: 0xe8833a, escala: 1 },
  neutro: { icono: '🧑', color: 0x8e6bbf, escala: 1 },
};
export const ASPECTO_INICIAL = 'neutro';
export const ESPECIES = { perro: 'Perro', gato: 'Gato', conejo: 'Conejo', hamster: 'Hámster', loro: 'Loro', otro: 'Otro' };
export const DATOS_ESPECIE = {
  perro: { icono: '🐶', color: 0x9c6b3c },
  gato: { icono: '🐱', color: 0x7d7d7d },
  conejo: { icono: '🐰', color: 0xd9b8c4 },
  hamster: { icono: '🐹', color: 0xe0b85c },
  loro: { icono: '🦜', color: 0x1f9bb0 },
  otro: { icono: '🐾', color: 0x4f9d69 },
};
export const ESPECIE_INICIAL = 'otro';
export const LIMITES_HABITANTES = { familiar: 8, mascota: 4 };

// Actividades (feature 003): listas cerradas y límites. Las claves se guardan; las etiquetas se muestran.
export const ICONOS = {
  platos: 'Platos', barrer: 'Barrer', ropa: 'Ropa', basura: 'Basura', limpiar: 'Limpiar',
  compras: 'Compras', plantas: 'Plantas', mascota: 'Mascota', otra: 'Otra',
};
export const FRECUENCIAS = [1, 2, 3, 7, 14, 30]; // días
export const LIMITE_ACTIVIDADES = 50;
export const MAX_NOMBRE_ACTIVIDAD = 30;

// Sugerencias de actividad (feature 007): lista cerrada de selección rápida; cada una fija el nombre y el icono. Sin texto se ven las primeras.
export const SUGERENCIAS = [
  { nombre: 'Lavar platos', icono: 'platos' },
  { nombre: 'Barrer', icono: 'barrer' },
  { nombre: 'Trapear', icono: 'limpiar' },
  { nombre: 'Limpiar el baño', icono: 'limpiar' },
  { nombre: 'Lavar ropa', icono: 'ropa' },
  { nombre: 'Sacar la basura', icono: 'basura' },
  { nombre: 'Hacer compras', icono: 'compras' },
  { nombre: 'Regar las plantas', icono: 'plantas' },
  { nombre: 'Dar de comer a la mascota', icono: 'mascota' },
  { nombre: 'Pasear al perro', icono: 'mascota' },
];
export const SUGERENCIAS_INICIALES = 6;
export const ICONO_GENERICO = 'otra';

// Rutinas (feature 004): horarios, paso y límite. Las claves se guardan; las etiquetas se muestran.
export const DIAS_RUTINA = { laborables: 'Lun–Vie', finde: 'Sáb–Dom' };
export const PASO_RUTINA = 30; // minutos
export const LIMITE_BLOQUES = 8; // por familiar y por horario

// Intercambios (feature 005): estados de una propuesta y límite de propuestas vigentes. Las claves se guardan; las etiquetas se muestran.
export const ESTADOS_INTERCAMBIO = { pendiente: 'Pendiente', aceptado: 'Aceptado', rechazado: 'Rechazado', retirado: 'Retirado' };
export const LIMITE_INTERCAMBIOS = 20;

// Historial de actividades hechas y calificaciones (feature 006, ADR-006 de historial): las últimas 200 entradas y estrellas de 1 a 5.
export const LIMITE_HISTORIAL = 200;
export const MIN_ESTRELLAS = 1;
export const MAX_ESTRELLAS = 5;
