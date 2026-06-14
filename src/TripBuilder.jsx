import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp, Box } from 'lucide-react';
import { CATEGORIES, pesoCargaDe } from './catalog.js';
import {
  SECTION_IDS, DESTINOS_DEFECTO, generarDistribucion, weightOf,
} from './planModel.js';
import PlanView from './PlanView.jsx';

const inputCls =
  'rounded-lg border border-[#d9c7a8] bg-white px-3 py-2 text-sm text-[#3a2c1d] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#8a5a2b]/40';

export default function TripBuilder({ productos }) {
  const [destinos, setDestinos] = useState(DESTINOS_DEFECTO);
  const [lineas, setLineas] = useState([]);
  const [sel, setSel] = useState({ productoId: '', cantidad: 1, destino: 'auto' });
  const [verRuta, setVerRuta] = useState(false);

  const productosOrden = useMemo(
    () => [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [productos]
  );
  const productosById = useMemo(
    () => Object.fromEntries(productos.map((p) => [p.id, p])),
    [productos]
  );

  const plan = useMemo(
    () => generarDistribucion(lineas, productosById),
    [lineas, productosById]
  );

  function agregar() {
    if (!sel.productoId || Number(sel.cantidad) <= 0) return;
    setLineas((prev) => [...prev, { id: crypto.randomUUID(), ...sel, cantidad: Number(sel.cantidad) }]);
    setSel({ productoId: '', cantidad: 1, destino: 'auto' });
  }

  function quitar(id) {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  }

  function destinoLabel(destino) {
    const id = Number(destino);
    return SECTION_IDS.includes(id) ? `S${id} · ${destinos[id - 1] || ''}` : 'Automático';
  }

  const pesoLineas = lineas.reduce((acc, l) => {
    const p = productosById[l.productoId];
    return acc + (p ? pesoCargaDe(p) * l.cantidad : 0);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Configuración de ruta (paradas) */}
      <div className="mb-3 bg-white/50 border border-[#d9c7a8] rounded-xl">
        <button
          onClick={() => setVerRuta((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-[#6b4c2a]"
        >
          <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Ruta y paradas</span>
          {verRuta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {verRuta && (
          <div className="px-3 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SECTION_IDS.map((id) => (
              <label key={id} className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7355] mb-1 block">
                  S{id} {id === 1 ? '(puerta · 1ra)' : id === 4 ? '(cabina · última)' : ''}
                </span>
                <input
                  className={inputCls + ' w-full'}
                  value={destinos[id - 1]}
                  onChange={(e) => setDestinos((prev) => prev.map((d, i) => (i === id - 1 ? e.target.value : d)))}
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Agregar producto al viaje */}
      <div className="mb-3 bg-white/60 border border-[#d9c7a8] rounded-xl p-3">
        {productos.length === 0 ? (
          <p className="text-sm text-[#8a7355]">
            Tu catálogo está vacío. Ve a la pestaña <strong>Catálogo</strong> y registra productos primero.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[180px]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7355] mb-1 block">Producto</span>
              <select className={inputCls + ' w-full'} value={sel.productoId} onChange={(e) => setSel((s) => ({ ...s, productoId: e.target.value }))}>
                <option value="">Elegir producto…</option>
                {productosOrden.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}{p.presentacion ? ` · ${p.presentacion}` : ''} ({pesoCargaDe(p)} kg)
                  </option>
                ))}
              </select>
            </label>
            <label className="w-20">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7355] mb-1 block">Cant.</span>
              <input type="number" min="1" className={inputCls + ' w-full'} value={sel.cantidad} onChange={(e) => setSel((s) => ({ ...s, cantidad: e.target.value }))} />
            </label>
            <label className="min-w-[140px]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a7355] mb-1 block">Destino</span>
              <select className={inputCls + ' w-full'} value={sel.destino} onChange={(e) => setSel((s) => ({ ...s, destino: e.target.value }))}>
                <option value="auto">Automático</option>
                {SECTION_IDS.map((id) => (
                  <option key={id} value={id}>S{id} · {destinos[id - 1]}</option>
                ))}
              </select>
            </label>
            <button onClick={agregar} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#8a5a2b]">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
        )}
      </div>

      {/* Lista de líneas del viaje */}
      {lineas.length > 0 && (
        <div className="mb-4 bg-white/60 border border-[#d9c7a8] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#6b4c2a]">Carga del viaje ({lineas.length})</h3>
            <span className="text-xs font-mono text-[#8a7355]">{pesoLineas.toFixed(0)} kg en total</span>
          </div>
          <div className="space-y-1.5">
            {lineas.map((l) => {
              const p = productosById[l.productoId];
              if (!p) return null;
              const cat = CATEGORIES[p.categoria];
              return (
                <div key={l.id} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.swatch }} />
                  <span className="flex-1 min-w-0 truncate">
                    <strong>{l.cantidad}×</strong> {p.nombre}{p.presentacion ? ` · ${p.presentacion}` : ''}
                  </span>
                  <span className="font-mono text-xs text-[#6b4c2a] whitespace-nowrap">{(pesoCargaDe(p) * l.cantidad).toFixed(0)} kg</span>
                  <span className="text-[11px] text-[#8a7355] whitespace-nowrap hidden sm:inline">{destinoLabel(l.destino)}</span>
                  <button onClick={() => quitar(l.id)} className="p-1 rounded text-[#c1453d] hover:bg-[#f3d9d6]"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lineas.length === 0 && productos.length > 0 && (
        <div className="text-center text-[#8a7355] text-sm py-6 mb-4 border border-dashed border-[#d9c7a8] rounded-xl">
          <Box className="w-6 h-6 mx-auto mb-2 opacity-60" />
          Agrega productos arriba y el sistema generará la distribución automáticamente.
        </div>
      )}

      {/* Plan generado */}
      <PlanView plan={plan} destinos={destinos} />
    </div>
  );
}
