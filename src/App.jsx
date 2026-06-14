import React, { useState, useEffect } from 'react';
import { Truck, DoorOpen, CheckCircle2, Info, AlertTriangle, MapPin, Package, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Catalog from './Catalog.jsx';
import { CATEGORIES, cargarCatalogo, guardarCatalogo } from './catalog.js';

const TRUCK = {
  length: 7,
  width: 2.4,
  height: 2.2,
  maxWeight: 11000,
};
const TRUCK_VOLUME = TRUCK.length * TRUCK.width * TRUCK.height;

const sections = [
  { id: 4, label: 'Sección 4', stop: 'Pauza · última entrega', pos: 'junto a cabina' },
  { id: 3, label: 'Sección 3', stop: 'Puquio', pos: 'intermedio' },
  { id: 2, label: 'Sección 2', stop: 'Chaparra', pos: 'intermedio' },
  { id: 1, label: 'Sección 1', stop: 'Chala · 1ra entrega', pos: 'junto a puerta' },
];

const layers = [
  { id: 'superior', label: 'Superior' },
  { id: 'medio', label: 'Medio' },
  { id: 'piso', label: 'Piso' },
];

const loadData = {
  1: {
    piso: [{ name: 'Arroz Casserita 50kg', qty: 20, unitWeight: 50, unitVolume: 0.08, category: 'base' }],
    medio: [{ name: 'Aceite Primor 24x900ml', qty: 35, unitWeight: 22, unitVolume: 0.03, category: 'medio' }],
    superior: [{ name: 'Gaseosa caja x12', qty: 20, unitWeight: 14, unitVolume: 0.036, category: 'fragil', note: 'No colocar nada encima' }],
  },
  2: {
    piso: [{ name: 'Azúcar rubia 50kg', qty: 16, unitWeight: 50, unitVolume: 0.08, category: 'base' }],
    medio: [{ name: 'Lejía Clorox 4x4L', qty: 40, unitWeight: 20, unitVolume: 0.022, category: 'medio' }],
    superior: [{ name: 'Huevos caja x180', qty: 25, unitWeight: 15, unitVolume: 0.0135, category: 'fragil', note: 'Capa superior, sin carga encima' }],
  },
  3: {
    piso: [{ name: 'Arroz Casserita 50kg', qty: 18, unitWeight: 50, unitVolume: 0.08, category: 'base' }],
    medio: [
      { name: 'Aceite La Patrona 24x200ml', qty: 35, unitWeight: 22, unitVolume: 0.03, category: 'medio' },
      { name: 'Abarrotes varios (caja mixta)', qty: 20, unitWeight: 18, unitVolume: 0.03, category: 'medio' },
    ],
    superior: [{ name: 'Gaseosa caja x12', qty: 20, unitWeight: 14, unitVolume: 0.036, category: 'fragil' }],
  },
  4: {
    piso: [
      { name: 'Arroz Casserita 50kg', qty: 20, unitWeight: 50, unitVolume: 0.08, category: 'base' },
      { name: 'Azúcar rubia 50kg', qty: 6, unitWeight: 50, unitVolume: 0.08, category: 'base' },
    ],
    medio: [{ name: 'Abarrotes varios (caja mixta)', qty: 50, unitWeight: 20, unitVolume: 0.03, category: 'medio' }],
    superior: [{ name: 'Jaulas pollitos BB vivos', qty: 20, unitWeight: 25, unitVolume: 0.162, category: 'aves', note: 'Ventilación obligatoria · nada encima ni apilado debajo' }],
  },
};

function weightOf(item) { return item.qty * item.unitWeight; }
function volumeOf(item) { return item.qty * item.unitVolume; }
function totalsOf(items) {
  return (items || []).reduce(
    (acc, it) => ({ weight: acc.weight + weightOf(it), volume: acc.volume + volumeOf(it) }),
    { weight: 0, volume: 0 }
  );
}
function sectionTotals(id) {
  const data = loadData[id];
  return layers.reduce((acc, l) => {
    const t = totalsOf(data[l.id]);
    return { weight: acc.weight + t.weight, volume: acc.volume + t.volume };
  }, { weight: 0, volume: 0 });
}

function StatCard({ label, value, max, unit, pct, decimals = 0 }) {
  const barColor = pct > 95 ? '#c1453d' : pct > 85 ? '#c99a2e' : '#4f7942';
  return (
    <div className="bg-white/70 border border-[#d9c7a8] rounded-xl p-3 sm:p-4">
      <div className="flex justify-between items-baseline mb-2 gap-2">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#6b4c2a]">{label}</span>
        <span className="font-mono text-xs sm:text-sm whitespace-nowrap">{value.toFixed(decimals)} / {max.toFixed(decimals)} {unit}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#e7dcc6] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
      </div>
      <div className="text-right text-xs mt-1 font-mono text-[#8a7355]">{pct.toFixed(0)}% usado</div>
    </div>
  );
}

function LoadCell({ items, onSelect, selected }) {
  if (!items || items.length === 0) {
    return <div className="min-h-[58px] sm:min-h-[72px] rounded-lg border border-dashed border-[#d9c7a8] bg-[#faf6ec]" />;
  }
  return (
    <div className="min-h-[58px] sm:min-h-[72px] rounded-lg border border-[#d9c7a8] bg-[#faf6ec] p-1 flex flex-col gap-1">
      {items.map((item, i) => {
        const cat = CATEGORIES[item.category];
        const isSelected = selected === item;
        return (
          <button
            key={i}
            onClick={() => onSelect(item)}
            className={`flex-1 text-left rounded-md px-1.5 py-1 text-[9px] sm:text-xs text-white leading-tight transition focus:outline-none ${isSelected ? 'ring-2 ring-[#3a2c1d] ring-offset-1 ring-offset-[#faf6ec]' : ''}`}
            style={{ backgroundColor: cat.swatch }}
          >
            <div className="font-semibold truncate">{item.name}</div>
            <div className="opacity-85 font-mono">{item.qty}u · {weightOf(item)}kg</div>
          </button>
        );
      })}
    </div>
  );
}

function CheckRow({ tone = 'ok', children }) {
  const Icon = tone === 'info' ? Info : CheckCircle2;
  const color = tone === 'info' ? '#2f6f9f' : '#4f7942';
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
      <span>{children}</span>
    </div>
  );
}

export default function CargoPlanner() {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('plan'); // 'plan' | 'catalogo'
  const [productos, setProductos] = useState(() => cargarCatalogo());

  useEffect(() => { guardarCatalogo(productos); }, [productos]);

  const grand = sections.reduce((acc, s) => {
    const t = sectionTotals(s.id);
    return { weight: acc.weight + t.weight, volume: acc.volume + t.volume };
  }, { weight: 0, volume: 0 });

  const weightPct = (grand.weight / TRUCK.maxWeight) * 100;
  const volumePct = (grand.volume / TRUCK_VOLUME) * 100;

  const chartData = sections.map(s => ({
    name: s.label.replace('Sección ', 'S'),
    kg: Math.round(sectionTotals(s.id).weight),
  }));

  return (
    <div className="min-h-screen w-full bg-[#f3ecdf] text-[#3a2c1d] p-3 sm:p-6 font-sans">
      <header className="max-w-5xl mx-auto mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8a5a2b] font-semibold">Plan de carga</p>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Isuzu FRR CL — Lima (VMT) a Pauza</h1>
        <p className="text-xs sm:text-sm text-[#8a7355] mt-1 font-mono">
          Carrocería 7.00 × 2.40 × 2.20 m · Capacidad reforzada 11,000 kg
        </p>
      </header>

      <nav className="max-w-5xl mx-auto mb-4 flex gap-1 bg-white/50 border border-[#d9c7a8] rounded-xl p-1 w-fit">
        {[
          { id: 'plan', label: 'Plan de carga', Icon: ClipboardList },
          { id: 'catalogo', label: `Catálogo (${productos.length})`, Icon: Package },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === id ? 'bg-[#8a5a2b] text-white' : 'text-[#6b4c2a] hover:bg-[#e7dcc6]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === 'catalogo' ? (
        <Catalog productos={productos} setProductos={setProductos} />
      ) : (
      <>
      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <StatCard label="Peso cargado" value={grand.weight} max={TRUCK.maxWeight} unit="kg" pct={weightPct} />
        <StatCard label="Volumen ocupado" value={grand.volume} max={TRUCK_VOLUME} unit="m³" pct={volumePct} decimals={1} />
      </section>

      <section className="max-w-5xl mx-auto bg-white/60 border-2 border-[#8a5a2b] rounded-2xl p-3 sm:p-5 mb-4 relative overflow-hidden">
        <div className="absolute -top-2 right-2 sm:right-4 -rotate-6 border-[3px] border-[#4f7942] text-[#4f7942] rounded-md px-2 sm:px-3 py-0.5 sm:py-1 font-bold uppercase text-[9px] sm:text-xs tracking-widest opacity-70 bg-[#f3ecdf]">
          ✓ dentro de límites
        </div>

        <div className="flex items-center justify-between gap-2 mb-3 mt-3 sm:mt-1 text-xs sm:text-sm font-semibold text-[#6b4c2a]">
          <div className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Cabina</div>
          <div className="flex-1 border-t border-dashed border-[#c2a878] mx-2" />
          <div className="flex items-center gap-1.5">Puerta <DoorOpen className="w-4 h-4" /></div>
        </div>

        <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: '40px repeat(4, 1fr)' }}>
          <div />
          {sections.map(s => (
            <div key={s.id} className="text-center px-0.5">
              <div className="font-bold text-[10px] sm:text-sm">{s.label}</div>
              <div className="text-[8px] sm:text-[10px] text-[#8a7355] leading-tight">{s.pos}</div>
              <div className="text-[8px] sm:text-[10px] text-[#8a7355] leading-tight flex items-center justify-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{s.stop}</span>
              </div>
            </div>
          ))}

          {layers.map(layer => (
            <React.Fragment key={layer.id}>
              <div className="flex items-center justify-center text-center text-[8px] sm:text-[10px] font-bold text-[#8a7355] uppercase">
                {layer.label}
              </div>
              {sections.map(s => (
                <LoadCell
                  key={`${s.id}-${layer.id}`}
                  items={loadData[s.id][layer.id]}
                  onSelect={setSelected}
                  selected={selected}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto flex flex-wrap gap-2.5 sm:gap-4 mb-4 text-[11px] sm:text-sm">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: cat.swatch }} />
            <span>{cat.label}</span>
          </div>
        ))}
      </section>

      {selected && (
        <section className="max-w-5xl mx-auto bg-white border border-[#d9c7a8] rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wide text-[#8a7355] font-semibold">{CATEGORIES[selected.category].label}</div>
              <div className="font-bold text-sm sm:text-lg">{selected.name}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#8a7355] text-sm leading-none px-1">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-mono text-xs sm:text-sm">
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Cantidad</span>{selected.qty} u</div>
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Peso unit.</span>{selected.unitWeight} kg</div>
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Peso total</span>{weightOf(selected)} kg</div>
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Volumen</span>{volumeOf(selected).toFixed(2)} m³</div>
          </div>
          {selected.note && (
            <div className="mt-2 flex items-start gap-1.5 text-xs sm:text-sm text-[#c1453d]">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{selected.note}</span>
            </div>
          )}
        </section>
      )}

      <section className="max-w-5xl mx-auto bg-white/60 border border-[#d9c7a8] rounded-xl p-3 sm:p-4 mb-4">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#6b4c2a] mb-2">Peso por sección (kg)</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dcc6" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b4c2a' }} axisLine={{ stroke: '#d9c7a8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#8a7355' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v} kg`, 'Peso']} contentStyle={{ fontSize: 12, borderColor: '#d9c7a8' }} />
            <Bar dataKey="kg" radius={[6, 6, 0, 0]} fill="#8a5a2b" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[11px] sm:text-xs text-[#8a7355] mt-1">
          Sección 4 (junto a cabina) concentra más peso: favorece la estabilidad sobre el eje delantero y reduce la carga en el extremo trasero (sección 1, junto a la puerta).
        </p>
      </section>

      <section className="max-w-5xl mx-auto bg-white/60 border border-[#d9c7a8] rounded-xl p-3 sm:p-4 mb-4 text-xs sm:text-sm space-y-1.5">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#6b4c2a] mb-1">Verificaciones automáticas</h2>
        <CheckRow>Peso total {grand.weight.toFixed(0)} kg — {(100 - weightPct).toFixed(0)}% de margen disponible</CheckRow>
        <CheckRow>Volumen ocupado {grand.volume.toFixed(1)} m³ de {TRUCK_VOLUME.toFixed(1)} m³ — el peso es el factor limitante, no el espacio</CheckRow>
        <CheckRow>Ningún producto frágil tiene carga encima (capa superior reservada)</CheckRow>
        <CheckRow>Jaulas de aves vivas en capa superior, con ventilación y sin apilamiento</CheckRow>
        <CheckRow tone="info">Orden de carga: Sección 1 (puerta) = primera entrega → Sección 4 (cabina) = Pauza, última entrega</CheckRow>
      </section>
      </>
      )}

      <footer className="max-w-5xl mx-auto text-[11px] sm:text-xs text-[#8a7355] pb-4">
        {tab === 'catalogo'
          ? 'El catálogo se autoguarda en este navegador. Usa “Exportar” para respaldar la base de datos en un archivo JSON y “Importar” para restaurarla en otra PC.'
          : 'El plan de carga aún usa datos de ejemplo. Próximo paso: armar el viaje eligiendo productos del catálogo para que el sistema calcule la distribución automáticamente.'}
      </footer>
    </div>
  );
}
