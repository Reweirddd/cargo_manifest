// ───────────────────────────────────────────────────────────────────────────
// Catálogo de productos — modelo de datos, semilla y persistencia
//
// Cada producto se registra UNA sola vez con sus especificaciones. Al armar un
// viaje solo se elige el producto + cantidad, y el sistema ya conoce su peso y
// volumen. La fuente de respaldo es un archivo JSON (exportar/importar); además
// se autoguarda en el navegador (localStorage) para no perder datos al recargar.
// ───────────────────────────────────────────────────────────────────────────

export const CATEGORIES = {
  base:   { label: 'Sacos · base / pesado',      swatch: '#8a5a2b', capa: 'piso',     orden: 1 },
  medio:  { label: 'Cajas medianas',             swatch: '#2f6f9f', capa: 'medio',    orden: 2 },
  fragil: { label: 'Frágil · sin peso encima',   swatch: '#c1453d', capa: 'superior', orden: 3 },
  aves:   { label: 'Aves vivas · ventilación',   swatch: '#c99a2e', capa: 'superior', orden: 4 },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

// Modelo de un producto del catálogo:
//   id            identificador único
//   nombre        "Aceite Primor"
//   marca         "Primor"
//   presentacion  unidad real de carga, ej. "Caja 24×900 ml" / "Saco 50 kg"
//   categoria     base | medio | fragil | aves  (define la capa y las reglas)
//   pesoNeto      kg de contenido (referencia)
//   pesoBruto     kg con empaque  → es el peso que se usa para cargar el camión
//   largo/ancho/alto  dimensiones en metros (para calcular volumen)
//   usarVolumenManual  true si el volumen se ingresa a mano (producto irregular)
//   volumenManual      m³ ingresado a mano cuando usarVolumenManual = true
//   restriccion   nota de apilado, ej. "Sin peso encima"
//   fuente        URL/origen donde se obtuvo la medida (opcional)

export function nuevoProducto(parcial) {
  const p = parcial || {};
  return {
    id: p.id ?? nuevoId(),
    nombre: '',
    marca: '',
    presentacion: '',
    categoria: 'medio',
    pesoNeto: 0,
    pesoBruto: 0,
    largo: null,
    ancho: null,
    alto: null,
    usarVolumenManual: false,
    volumenManual: 0,
    restriccion: '',
    fuente: '',
    ...p,
  };
}

// ID único con respaldo si crypto.randomUUID no está disponible.
function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Volumen efectivo (m³): manual si está marcado, si no largo×ancho×alto.
export function volumenDe(p) {
  if (p.usarVolumenManual) return Number(p.volumenManual) || 0;
  const l = Number(p.largo) || 0;
  const a = Number(p.ancho) || 0;
  const h = Number(p.alto) || 0;
  return +(l * a * h).toFixed(4);
}

// Peso que cuenta para la carga del camión.
export function pesoCargaDe(p) {
  return Number(p.pesoBruto) || Number(p.pesoNeto) || 0;
}

// ── Semilla: los productos del prototipo, ya convertidos a catálogo editable ──
// El volumen viene del prototipo (modo manual); falta capturar las dimensiones
// reales de cada caja/saco — se editan en la ficha de cada producto.
export const PRODUCTOS_SEMILLA = [
  {
    nombre: 'Arroz Casserita', marca: 'Casserita', presentacion: 'Saco 50 kg',
    categoria: 'base', pesoNeto: 50, pesoBruto: 50,
    usarVolumenManual: true, volumenManual: 0.08, restriccion: 'Siempre en el piso',
  },
  {
    nombre: 'Azúcar rubia', marca: '', presentacion: 'Saco 50 kg',
    categoria: 'base', pesoNeto: 50, pesoBruto: 50,
    usarVolumenManual: true, volumenManual: 0.08, restriccion: 'Siempre en el piso',
  },
  {
    nombre: 'Aceite Primor', marca: 'Primor', presentacion: 'Caja 24×900 ml',
    categoria: 'medio', pesoNeto: 21.6, pesoBruto: 22,
    usarVolumenManual: true, volumenManual: 0.03, restriccion: '',
  },
  {
    nombre: 'Aceite La Patrona', marca: 'La Patrona', presentacion: 'Caja 24×900 ml',
    categoria: 'medio', pesoNeto: 21.6, pesoBruto: 22,
    usarVolumenManual: true, volumenManual: 0.03, restriccion: '',
  },
  {
    nombre: 'Lejía Clorox', marca: 'Clorox', presentacion: 'Caja 4×4 L',
    categoria: 'medio', pesoNeto: 16, pesoBruto: 20,
    usarVolumenManual: true, volumenManual: 0.022, restriccion: '',
  },
  {
    nombre: 'Abarrotes varios', marca: '', presentacion: 'Caja mixta',
    categoria: 'medio', pesoNeto: 18, pesoBruto: 20,
    usarVolumenManual: true, volumenManual: 0.03, restriccion: '',
  },
  {
    nombre: 'Gaseosa', marca: '', presentacion: 'Caja ×12',
    categoria: 'fragil', pesoNeto: 13, pesoBruto: 14,
    usarVolumenManual: true, volumenManual: 0.036, restriccion: 'No colocar nada encima',
  },
  {
    nombre: 'Huevos', marca: '', presentacion: 'Caja ×180',
    categoria: 'fragil', pesoNeto: 11, pesoBruto: 15,
    usarVolumenManual: true, volumenManual: 0.0135, restriccion: 'Capa superior, sin carga encima',
  },
  {
    nombre: 'Jaulas pollitos BB vivos', marca: '', presentacion: 'Jaba',
    categoria: 'aves', pesoNeto: 25, pesoBruto: 25,
    usarVolumenManual: true, volumenManual: 0.162,
    restriccion: 'Ventilación obligatoria · nada encima ni apilado debajo',
  },
].map((p) => nuevoProducto(p));

// ── Persistencia ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cargo-planner:catalogo';

export function cargarCatalogo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PRODUCTOS_SEMILLA;
    const datos = JSON.parse(raw);
    if (!Array.isArray(datos) || datos.length === 0) return PRODUCTOS_SEMILLA;
    return datos.map((p) => nuevoProducto(p));
  } catch {
    return PRODUCTOS_SEMILLA;
  }
}

export function guardarCatalogo(productos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  } catch {
    // almacenamiento lleno o no disponible: el respaldo es el archivo JSON
  }
}

// ── Exportar / importar archivo JSON ─────────────────────────────────────────
export function exportarJSON(productos) {
  const blob = new Blob([JSON.stringify(productos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `catalogo-carga-${fecha}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parsearImportado(texto) {
  const datos = JSON.parse(texto);
  if (!Array.isArray(datos)) throw new Error('El archivo no contiene una lista de productos.');
  return datos.map((p) => nuevoProducto(p));
}
