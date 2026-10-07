// test/rutinas-lugar.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearHogarInicial, agregarHabitante, espaciosDeTipo, familiares, mascotas, miembrosActivos } from '../src/hogar.js';
import {
  agregarBloque, horarioDelDia, bloqueVigente, objetivoDe, objetivosDeFamiliares, finDeSalida, textoVuelta, textoHora, MINUTOS_DIA,
} from '../src/rutinas.js';
import { crearCtx } from './ayuda.js';

const VIERNES = '2026-10-09';
const SABADO = '2026-10-10';
const DOMINGO = '2026-10-11';
const LUNES = '2026-10-12';
const a = (fecha, hora, minuto = 0) => ({ fecha, minuto: hora * 60 + minuto });

// Hogar con Diana (familiar) y Firulais (mascota); `bloques(estado)` da los bloques de Diana, por defecto Lun–Vie y fuera de casa.
function hogarConRutina(bloques) {
  const ctx = crearCtx();
  let e = crearHogarInicial(ctx);
  e = agregarHabitante(e, 'familiar', { nombre: 'Diana', parentesco: 'pareja', genero: 'femenino' }, ctx).estado;
  e = agregarHabitante(e, 'mascota', { nombre: 'Firulais', especie: 'perro' }, ctx).estado;
  const diana = familiares(e)[0];
  for (const b of bloques(e)) {
    const r = agregarBloque(e, { miembroId: diana.id, dias: 'laborables', espacioId: null, ...b }, ctx);
    assert.equal(r.ok, true, r.error);
    e = r.estado;
  }
  return { e, diana };
}

test('AC-7.1, AC-7.2, FR-2: un bloque está vigente desde su inicio hasta justo antes de su fin; dos que se tocan se suceden', () => {
  const { e, diana } = hogarConRutina((x) => [
    { inicio: 540, fin: 780, espacioId: espaciosDeTipo(x, 'cocina')[0].id }, // 09:00–13:00
    { inicio: 780, fin: 1080 }, // 13:00–18:00, fuera
  ]);
  const [cocina, fuera] = e.bloques;
  const vigente = (h, m) => bloqueVigente(e, diana.id, a(LUNES, h, m))?.id ?? null;
  assert.deepEqual(
    [vigente(8, 59), vigente(9, 0), vigente(12, 59), vigente(13, 0), vigente(17, 59), vigente(18, 0)],
    [null, cocina.id, cocina.id, fuera.id, fuera.id, null],
  );
});

test('AC-7.3, AC-7.4, FR-2: de lunes a viernes rige "Lun–Vie" y el fin de semana "Sáb–Dom", también al pasar la medianoche', () => {
  assert.deepEqual([VIERNES, SABADO, DOMINGO, LUNES].map(horarioDelDia), ['laborables', 'finde', 'finde', 'laborables']);
  const { e, diana } = hogarConRutina((x) => [
    { inicio: 1080, fin: 1440 }, // Lun–Vie 18:00–24:00, fuera
    { inicio: 0, fin: 420, dias: 'finde', espacioId: espaciosDeTipo(x, 'dormitorio')[0].id },
  ]);
  const dormitorio = espaciosDeTipo(e, 'dormitorio')[0];
  assert.deepEqual(objetivoDe(e, diana.id, a(VIERNES, 23, 59)), { tipo: 'fuera' });
  assert.deepEqual(objetivoDe(e, diana.id, a(SABADO, 0, 0)), { tipo: 'espacio', espacioId: dormitorio.id });
  assert.deepEqual(objetivoDe(e, diana.id, a(DOMINGO, 6, 59)), { tipo: 'espacio', espacioId: dormitorio.id });
  assert.deepEqual(objetivoDe(e, diana.id, a(SABADO, 18, 0)), { tipo: 'libre' });
  assert.deepEqual(objetivoDe(e, diana.id, a(LUNES, 0, 0)), { tipo: 'libre' });
});

test('FR-2, FR-3: el objetivo es el espacio del bloque vigente, fuera o libre; solo los familiares tienen objetivo', () => {
  const { e, diana } = hogarConRutina((x) => [{ inicio: 540, fin: 600, espacioId: espaciosDeTipo(x, 'sala')[0].id }, { inicio: 600, fin: 660 }]);
  const sala = espaciosDeTipo(e, 'sala')[0];
  const objetivos = objetivosDeFamiliares(e, a(LUNES, 9, 30));
  assert.deepEqual([...objetivos.keys()], [diana.id]);
  assert.deepEqual(objetivos.get(diana.id), { tipo: 'espacio', espacioId: sala.id });
  assert.deepEqual(objetivosDeFamiliares(e, a(LUNES, 10, 0)).get(diana.id), { tipo: 'fuera' });
  assert.deepEqual(objetivosDeFamiliares(e, a(LUNES, 11, 0)).get(diana.id), { tipo: 'libre' });
  assert.equal(objetivos.has(mascotas(e)[0].id), false);
  assert.equal(objetivos.has(miembrosActivos(e)[0].id), false);
});

test('AC-5.4, AC-5.5, AC-5.6, AC-5.7: la hora de vuelta es el fin del tramo continuo fuera de casa de hoy', () => {
  const { e, diana } = hogarConRutina((x) => [
    { inicio: 540, fin: 780 }, { inicio: 780, fin: 1080 }, // 09:00–13:00 y 13:00–18:00, fuera
    { inicio: 1080, fin: 1140, espacioId: espaciosDeTipo(x, 'cocina')[0].id },
    { inicio: 1200, fin: 1440 }, // 20:00–24:00, fuera
  ]);
  assert.equal(finDeSalida(e, diana.id, a(LUNES, 10, 0)), 1080);
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 10, 0)), 'Vuelve a las 18:00');
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 14, 0)), 'Vuelve a las 18:00');
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 21, 0)), 'Vuelve mañana');
  assert.equal(finDeSalida(e, diana.id, a(LUNES, 18, 30)), null);
  assert.equal(textoVuelta(e, diana.id, a(LUNES, 18, 30)), 'Volviendo');
  assert.equal(textoVuelta(e, diana.id, a(SABADO, 10, 0)), 'Volviendo');
  assert.deepEqual([0, 30, 540, 1410, MINUTOS_DIA].map(textoHora), ['00:00', '00:30', '09:00', '23:30', '24:00']);
});

test('las funciones de hora y lugar son puras y repiten el resultado con los mismos argumentos', () => {
  const { e, diana } = hogarConRutina(() => [{ inicio: 540, fin: 1080 }]);
  const copia = structuredClone(e);
  const ahora = a(LUNES, 10, 0);
  assert.deepEqual(objetivoDe(e, diana.id, ahora), objetivoDe(e, diana.id, ahora));
  assert.deepEqual(objetivosDeFamiliares(e, ahora), objetivosDeFamiliares(e, ahora));
  assert.equal(textoVuelta(e, diana.id, ahora), textoVuelta(e, diana.id, ahora));
  assert.deepEqual(e, copia);
  assert.deepEqual(ahora, a(LUNES, 10, 0));
});
