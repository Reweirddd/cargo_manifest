import React, { useState } from 'react';
import { Truck, DoorOpen, CheckCircle2, Info, AlertTriangle, MapPin, XCircle, LayoutGrid, Box } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from './catalog.js';
import {
  TRUCK, TRUCK_VOLUME, layers, SECTION_DISPLAY, sectionsMeta,
  weightOf, volumeOf, sectionTotals, verificarPlan,
} from './planModel.js';
import Truck3D from './Truck3D.jsx';

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
            style={{ backgroundColor: cat?.swatch || '#777' }}
          >
            <div className="font-semibold truncate">{item.name}</div>
            <div className="opacity-85 font-mono">{item.qty}u · {weightOf(item).toFixed(0)}kg</div>
          </button>
        );
      })}
    </div>
  );
}

function CheckRow({ tone = 'ok', children }) {
  const cfg = {
    ok:    { Icon: CheckCircle2, color: '#4f7942' },
    info:  { Icon: Info,         color: '#2f6f9f' },
    warn:  { Icon: AlertTriangle, color: '#c99a2e' },
    error: { Icon: XCircle,      color: '#c1453d' },
  }[tone] || { Icon: CheckCircle2, color: '#4f7942' };
  return (
    <div className="flex items-start gap-2">
      <cfg.Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
      <span>{children}</span>
    </div>
  );
}

export default function PlanView({ plan, destinos }) {
  const [selected, setSelected] = useState(null);
  const [vista, setVista] = useState('2d'); // '2d' | '3d'
  const meta = sectionsMeta(destinos);
  const verif = verificarPlan(plan);
  const { grand, weightPct, volumePct, secW, checks } = verif;

  const algoCargado = grand.weight > 0 || grand.volume > 0;
  const dentroLimites = weightPct <= 100 && volumePct <= 100;
  const sinAlertas = !checks.some((c) => c.tone === 'warn' || c.tone === 'error');

  const chartData = SECTION_DISPLAY.map((id) => ({
    name: `S${id}`,
    kg: Math.round(secW[id]),
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <StatCard label="Peso cargado" value={grand.weight} max={TRUCK.maxWeight} unit="kg" pct={weightPct} />
        <StatCard label="Volumen ocupado" value={grand.volume} max={TRUCK_VOLUME} unit="m³" pct={volumePct} decimals={1} />
      </section>

      <div className="flex gap-1 mb-3 bg-white/50 border border-[#d9c7a8] rounded-xl p-1 w-fit">
        {[
          { id: '2d', label: 'Vista 2D', Icon: LayoutGrid },
          { id: '3d', label: 'Vista 3D', Icon: Box },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setVista(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              vista === id ? 'bg-[#8a5a2b] text-white' : 'text-[#6b4c2a] hover:bg-[#e7dcc6]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {vista === '3d' && <Truck3D plan={plan} destinos={destinos} />}

      <section className={`bg-white/60 border-2 border-[#8a5a2b] rounded-2xl p-3 sm:p-5 mb-4 relative overflow-hidden ${vista === '3d' ? 'hidden' : ''}`}>
        {algoCargado && (
          <div
            className="absolute -top-2 right-2 sm:right-4 -rotate-6 border-[3px] rounded-md px-2 sm:px-3 py-0.5 sm:py-1 font-bold uppercase text-[9px] sm:text-xs tracking-widest opacity-80 bg-[#f3ecdf]"
            style={{ color: dentroLimites ? '#4f7942' : '#c1453d', borderColor: dentroLimites ? '#4f7942' : '#c1453d' }}
          >
            {dentroLimites ? '✓ dentro de límites' : '✕ excede límites'}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mb-3 mt-3 sm:mt-1 text-xs sm:text-sm font-semibold text-[#6b4c2a]">
          <div className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Cabina</div>
          <div className="flex-1 border-t border-dashed border-[#c2a878] mx-2" />
          <div className="flex items-center gap-1.5">Puerta <DoorOpen className="w-4 h-4" /></div>
        </div>

        <div className="grid gap-1 sm:gap-2" style={{ gridTemplateColumns: '40px repeat(4, 1fr)' }}>
          <div />
          {meta.map((s) => (
            <div key={s.id} className="text-center px-0.5">
              <div className="font-bold text-[10px] sm:text-sm">{s.label}</div>
              <div className="text-[8px] sm:text-[10px] text-[#8a7355] leading-tight">{s.pos}</div>
              <div className="text-[8px] sm:text-[10px] text-[#8a7355] leading-tight flex items-center justify-center gap-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{s.stop || '—'}</span>
              </div>
            </div>
          ))}

          {layers.map((layer) => (
            <React.Fragment key={layer.id}>
              <div className="flex items-center justify-center text-center text-[8px] sm:text-[10px] font-bold text-[#8a7355] uppercase">
                {layer.label}
              </div>
              {meta.map((s) => (
                <LoadCell
                  key={`${s.id}-${layer.id}`}
                  items={plan[s.id][layer.id]}
                  onSelect={setSelected}
                  selected={selected}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-2.5 sm:gap-4 mb-4 text-[11px] sm:text-sm">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: cat.swatch }} />
            <span>{cat.label}</span>
          </div>
        ))}
      </section>

      {selected && (
        <section className="bg-white border border-[#d9c7a8] rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wide text-[#8a7355] font-semibold">{CATEGORIES[selected.category]?.label}</div>
              <div className="font-bold text-sm sm:text-lg">{selected.name}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#8a7355] text-sm leading-none px-1">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 font-mono text-xs sm:text-sm">
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Cantidad</span>{selected.qty} u</div>
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Peso unit.</span>{selected.unitWeight} kg</div>
            <div><span className="text-[#8a7355] text-[10px] sm:text-xs block">Peso total</span>{weightOf(selected).toFixed(0)} kg</div>
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

      <section className="bg-white/60 border border-[#d9c7a8] rounded-xl p-3 sm:p-4 mb-4">
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
          S1 = junto a la puerta (primera entrega) · S4 = junto a la cabina (última entrega).
        </p>
      </section>

      <section className="bg-white/60 border border-[#d9c7a8] rounded-xl p-3 sm:p-4 mb-4 text-xs sm:text-sm space-y-1.5">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#6b4c2a] mb-1">Verificaciones automáticas</h2>
        {!algoCargado ? (
          <CheckRow tone="info">Agrega productos al viaje para generar la distribución y sus verificaciones.</CheckRow>
        ) : (
          <>
            {checks.map((c, i) => <CheckRow key={i} tone={c.tone}>{c.text}</CheckRow>)}
            {sinAlertas && <CheckRow tone="info">Distribución sugerida automáticamente — puedes ajustarla cargando o quitando productos.</CheckRow>}
          </>
        )}
      </section>
    </div>
  );
}
