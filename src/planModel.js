// ───────────────────────────────────────────────────────────────────────────
// Motor de distribución de carga
//
// A partir de una lista de líneas (producto del catálogo + cantidad + destino)
// arma automáticamente la distribución en 4 secciones × 3 capas, respetando:
//   - Orden de entrega: lo que se descarga primero va junto a la puerta (S1),
//     lo último junto a la cabina (S4).
//   - Reglas de apilado por categoría: base→piso, medio→capa media,
//     frágil/aves→capa superior.
//   - Balance de peso: lo marcado como "Automático" se reparte para equilibrar.
//
// (La "memoria" de ajustes del usuario es una etapa posterior; este motor solo
//  aplica reglas.)
// ───────────────────────────────────────────────────────────────────────────

import { CATEGORIES, volumenDe, pesoCargaDe } from './catalog.js';

export const TRUCK = { length: 7, width: 2.4, height: 2.2, maxWeight: 11000 };
export const TRUCK_VOLUME = +(TRUCK.length * TRUCK.width * TRUCK.height).toFixed(2);

// Capas de arriba hacia abajo (para mostrar en pantalla).
export const layers = [
  { id: 'superior', label: 'Superior' },
  { id: 'medio', label: 'Medio' },
  { id: 'piso', label: 'Piso' },
];

// Orden de visualización: cabina a la izquierda → puerta a la derecha.
export const SECTION_DISPLAY = [4, 3, 2, 1];
export const SECTION_IDS = [1, 2, 3, 4]; // S1 = puerta (1ra entrega) … S4 = cabina

export const DESTINOS_DEFECTO = ['Chala', 'Chaparra', 'Puquio', 'Pauza'];

// Metadatos de cada sección, con el nombre de parada que define el usuario.
export function sectionsMeta(destinos = DESTINOS_DEFECTO) {
  const pos = { 1: 'junto a puerta', 2: 'intermedio', 3: 'intermedio', 4: 'junto a cabina' };
  return SECTION_DISPLAY.map((id) => ({
    id,
    label: `Sección ${id}`,
    pos: pos[id],
    stop: destinos[id - 1] || '',
  }));
}

function planVacio() {
  const p = {};
  for (const id of SECTION_IDS) p[id] = { piso: [], medio: [], superior: [] };
  return p;
}

// Inserta un item en una celda, fusionando si ya existe el mismo producto.
function insertar(celda, item) {
  const existente = celda.find((x) => x.name === item.name);
  if (existente) existente.qty += item.qty;
  else celda.push({ ...item });
}

export function weightOf(item) { return item.qty * item.unitWeight; }
export function volumeOf(item) { return item.qty * item.unitVolume; }

export function totalsOf(items) {
  return (items || []).reduce(
    (acc, it) => ({ weight: acc.weight + weightOf(it), volume: acc.volume + volumeOf(it) }),
    { weight: 0, volume: 0 }
  );
}

export function sectionTotals(plan, id) {
  return layers.reduce((acc, l) => {
    const t = totalsOf(plan[id][l.id]);
    return { weight: acc.weight + t.weight, volume: acc.volume + t.volume };
  }, { weight: 0, volume: 0 });
}

export function grandTotals(plan) {
  return SECTION_IDS.reduce((acc, id) => {
    const t = sectionTotals(plan, id);
    return { weight: acc.weight + t.weight, volume: acc.volume + t.volume };
  }, { weight: 0, volume: 0 });
}

// ── Viaje de ejemplo (para la demo) ──────────────────────────────────────────
// Reparte productos en las 4 paradas mostrando todas las categorías y dejando
// el camión bien lleno pero dentro de límites (~9,200 kg de 11,000).
const VIAJE_EJEMPLO = [
  { nombre: 'Arroz Casserita', cantidad: 20, destino: 1 },
  { nombre: 'Aceite Primor', cantidad: 35, destino: 1 },
  { nombre: 'Gaseosa', cantidad: 20, destino: 1 },

  { nombre: 'Azúcar rubia', cantidad: 16, destino: 2 },
  { nombre: 'Lejía Clorox', cantidad: 40, destino: 2 },
  { nombre: 'Huevos', cantidad: 25, destino: 2 },

  { nombre: 'Arroz Casserita', cantidad: 18, destino: 3 },
  { nombre: 'Aceite La Patrona', cantidad: 35, destino: 3 },
  { nombre: 'Abarrotes varios', cantidad: 20, destino: 3 },

  { nombre: 'Arroz Casserita', cantidad: 20, destino: 4 },
  { nombre: 'Azúcar rubia', cantidad: 6, destino: 4 },
  { nombre: 'Abarrotes varios', cantidad: 50, destino: 4 },
  { nombre: 'Jaulas pollitos BB vivos', cantidad: 20, destino: 4 },
];

// Construye las líneas del viaje de ejemplo a partir del catálogo actual,
// emparejando por nombre (omite lo que no exista en el catálogo).
export function viajeEjemplo(productos) {
  const idPorNombre = {};
  for (const p of productos) if (!(p.nombre in idPorNombre)) idPorNombre[p.nombre] = p.id;
  return VIAJE_EJEMPLO
    .filter((l) => idPorNombre[l.nombre])
    .map((l, i) => ({
      id: `ej-${i}`,
      productoId: idPorNombre[l.nombre],
      cantidad: l.cantidad,
      destino: l.destino,
    }));
}

// ── Algoritmo principal ──────────────────────────────────────────────────────
// lineas: [{ productoId, cantidad, destino }]  destino = 1..4 o 'auto'
// productosById: { [id]: producto }
export function generarDistribucion(lineas, productosById) {
  const plan = planVacio();
  const auto = [];

  for (const linea of lineas) {
    const prod = productosById[linea.productoId];
    const cant = Number(linea.cantidad) || 0;
    if (!prod || cant <= 0) continue;

    const capa = CATEGORIES[prod.categoria]?.capa || 'medio';
    const item = {
      name: prod.nombre + (prod.presentacion ? ` · ${prod.presentacion}` : ''),
      qty: cant,
      unitWeight: pesoCargaDe(prod),
      unitVolume: volumenDe(prod),
      category: prod.categoria,
      note: prod.restriccion || '',
    };

    const destinoId = SECTION_IDS.includes(Number(linea.destino)) ? Number(linea.destino) : null;
    if (destinoId) insertar(plan[destinoId][capa], item);
    else auto.push({ item, capa });
  }

  // Reparto de los "Automático": el más pesado primero, a la sección con menos peso.
  auto.sort((a, b) => weightOf(b.item) - weightOf(a.item));
  for (const { item, capa } of auto) {
    let mejor = SECTION_IDS[0];
    let menor = Infinity;
    for (const id of SECTION_IDS) {
      const w = sectionTotals(plan, id).weight;
      if (w < menor) { menor = w; mejor = id; }
    }
    insertar(plan[mejor][capa], item);
  }

  return plan;
}

// ── Verificación / alertas ───────────────────────────────────────────────────
export function verificarPlan(plan) {
  const grand = grandTotals(plan);
  const weightPct = (grand.weight / TRUCK.maxWeight) * 100;
  const volumePct = (grand.volume / TRUCK_VOLUME) * 100;

  const secW = {};
  for (const id of SECTION_IDS) secW[id] = sectionTotals(plan, id).weight;
  const rear = secW[1] + secW[2];   // mitad trasera (puerta)
  const front = secW[3] + secW[4];  // mitad delantera (cabina)

  const checks = [];

  // Peso total
  if (weightPct > 100) {
    checks.push({ tone: 'error', text: `Peso total ${grand.weight.toFixed(0)} kg — excede la capacidad de ${TRUCK.maxWeight} kg` });
  } else if (weightPct > 95) {
    checks.push({ tone: 'warn', text: `Peso total ${grand.weight.toFixed(0)} kg — al ${weightPct.toFixed(0)}%, sobre el margen de seguridad` });
  } else {
    checks.push({ tone: 'ok', text: `Peso total ${grand.weight.toFixed(0)} kg — ${(100 - weightPct).toFixed(0)}% de margen disponible` });
  }

  // Volumen
  if (volumePct > 100) {
    checks.push({ tone: 'error', text: `Volumen ${grand.volume.toFixed(1)} m³ — excede los ${TRUCK_VOLUME} m³ disponibles` });
  } else if (volumePct > 95) {
    checks.push({ tone: 'warn', text: `Volumen ${grand.volume.toFixed(1)} m³ — al ${volumePct.toFixed(0)}% del espacio` });
  } else {
    checks.push({ tone: 'ok', text: `Volumen ${grand.volume.toFixed(1)} m³ de ${TRUCK_VOLUME} m³ ocupados` });
  }

  // Balance de ejes
  const total = grand.weight || 1;
  const pctMayor = Math.max(rear, front) / total;
  if (pctMayor > 0.62) {
    const lado = front > rear ? 'cabina (S3-S4)' : 'puerta (S1-S2)';
    checks.push({ tone: 'warn', text: `Peso cargado hacia ${lado} (${(pctMayor * 100).toFixed(0)}%) — considera repartir para equilibrar los ejes` });
  } else if (grand.weight > 0) {
    checks.push({ tone: 'ok', text: `Reparto entre ejes equilibrado (trasera ${rear.toFixed(0)} kg · delantera ${front.toFixed(0)} kg)` });
  }

  // Reglas de apilado: con la asignación por categoría se cumplen por construcción.
  const hayFragilAves = SECTION_IDS.some((id) =>
    plan[id].superior.some((i) => i.category === 'fragil' || i.category === 'aves')
  );
  if (hayFragilAves) {
    checks.push({ tone: 'ok', text: 'Frágil y aves vivas en la capa superior, sin carga encima' });
  }

  return { grand, weightPct, volumePct, secW, rear, front, checks };
}
