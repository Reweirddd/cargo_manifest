import React, { useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Download, Upload, Search, X, Box, AlertTriangle } from 'lucide-react';
import {
  CATEGORIES, CATEGORY_KEYS, nuevoProducto, volumenDe, pesoCargaDe,
  exportarJSON, parsearImportado,
} from './catalog.js';

const inputCls =
  'w-full rounded-lg border border-[#d9c7a8] bg-white px-3 py-2 text-sm text-[#3a2c1d] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#8a5a2b]/40';
const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-[#8a7355] mb-1 block';

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function FichaProducto({ producto, onGuardar, onCancelar }) {
  const [p, setP] = useState(() => nuevoProducto(producto));
  const set = (campo) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setP((prev) => ({ ...prev, [campo]: v }));
  };
  const setNum = (campo) => (e) =>
    setP((prev) => ({ ...prev, [campo]: e.target.value === '' ? null : Number(e.target.value) }));

  const volCalculado = volumenDe(p);
  const valido = p.nombre.trim() !== '' && pesoCargaDe(p) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-3 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#f3ecdf] rounded-2xl border-2 border-[#8a5a2b] p-4 sm:p-5 my-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-[#3a2c1d]">
            {producto ? 'Editar producto' : 'Nuevo producto'}
          </h3>
          <button onClick={onCancelar} className="text-[#8a7355] p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Campo label="Nombre *">
              <input className={inputCls} value={p.nombre} onChange={set('nombre')} placeholder="Aceite Primor" />
            </Campo>
          </div>
          <Campo label="Marca">
            <input className={inputCls} value={p.marca} onChange={set('marca')} placeholder="Primor" />
          </Campo>
          <Campo label="Presentación">
            <input className={inputCls} value={p.presentacion} onChange={set('presentacion')} placeholder="Caja 24×900 ml" />
          </Campo>
          <Campo label="Categoría">
            <select className={inputCls} value={p.categoria} onChange={set('categoria')}>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{CATEGORIES[k].label}</option>
              ))}
            </select>
          </Campo>
          <div className="hidden sm:block" />

          <Campo label="Peso neto (kg)">
            <input type="number" min="0" step="0.1" className={inputCls} value={p.pesoNeto ?? ''} onChange={setNum('pesoNeto')} />
          </Campo>
          <Campo label="Peso bruto (kg) — el que se carga">
            <input type="number" min="0" step="0.1" className={inputCls} value={p.pesoBruto ?? ''} onChange={setNum('pesoBruto')} />
          </Campo>
        </div>

        {/* Dimensiones / volumen */}
        <div className="mt-3 rounded-xl border border-[#d9c7a8] bg-white/60 p-3">
          <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-[#6b4c2a]">
            <input type="checkbox" checked={p.usarVolumenManual} onChange={set('usarVolumenManual')} />
            Ingresar volumen manualmente (producto irregular)
          </label>

          {p.usarVolumenManual ? (
            <Campo label="Volumen (m³)">
              <input type="number" min="0" step="0.001" className={inputCls} value={p.volumenManual ?? ''} onChange={setNum('volumenManual')} />
            </Campo>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Campo label="Largo (m)">
                <input type="number" min="0" step="0.01" className={inputCls} value={p.largo ?? ''} onChange={setNum('largo')} />
              </Campo>
              <Campo label="Ancho (m)">
                <input type="number" min="0" step="0.01" className={inputCls} value={p.ancho ?? ''} onChange={setNum('ancho')} />
              </Campo>
              <Campo label="Alto (m)">
                <input type="number" min="0" step="0.01" className={inputCls} value={p.alto ?? ''} onChange={setNum('alto')} />
              </Campo>
            </div>
          )}
          <div className="text-right text-xs font-mono text-[#8a7355] mt-2">
            Volumen = {volCalculado.toFixed(3)} m³
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Campo label="Restricción de apilado">
            <input className={inputCls} value={p.restriccion} onChange={set('restriccion')} placeholder="Sin peso encima" />
          </Campo>
          <Campo label="Fuente (URL / origen de la medida)">
            <input className={inputCls} value={p.fuente} onChange={set('fuente')} placeholder="https://…" />
          </Campo>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancelar} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#6b4c2a] hover:bg-[#e7dcc6]">
            Cancelar
          </button>
          <button
            onClick={() => onGuardar(p)}
            disabled={!valido}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#8a5a2b] disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Catalog({ productos, setProductos }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [editando, setEditando] = useState(null); // producto | {} (nuevo) | null
  const fileRef = useRef(null);

  const visibles = productos
    .filter((p) => filtro === 'todas' || p.categoria === filtro)
    .filter((p) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (`${p.nombre} ${p.marca} ${p.presentacion}`).toLowerCase().includes(q);
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  function guardar(prod) {
    setProductos((prev) => {
      const existe = prev.some((x) => x.id === prod.id);
      return existe ? prev.map((x) => (x.id === prod.id ? prod : x)) : [...prev, prod];
    });
    setEditando(null);
  }

  function eliminar(id) {
    const prod = productos.find((x) => x.id === id);
    if (window.confirm(`¿Eliminar "${prod?.nombre}" del catálogo?`)) {
      setProductos((prev) => prev.filter((x) => x.id !== id));
    }
  }

  async function importar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      const nuevos = parsearImportado(texto);
      if (window.confirm(`Importar ${nuevos.length} productos y reemplazar el catálogo actual?`)) {
        setProductos(nuevos);
      }
    } catch (err) {
      window.alert('No se pudo leer el archivo: ' + err.message);
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7355]" />
          <input
            className={inputCls + ' pl-9'}
            placeholder="Buscar por nombre o marca…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button onClick={() => setEditando({})} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#8a5a2b]">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
        <button onClick={() => exportarJSON(productos)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#6b4c2a] border border-[#d9c7a8] bg-white/70">
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#6b4c2a] border border-[#d9c7a8] bg-white/70">
          <Upload className="w-4 h-4" /> Importar
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importar} />
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-2.5 py-1 rounded-full border ${filtro === 'todas' ? 'bg-[#3a2c1d] text-white border-[#3a2c1d]' : 'border-[#d9c7a8] text-[#6b4c2a]'}`}
        >
          Todas ({productos.length})
        </button>
        {CATEGORY_KEYS.map((k) => {
          const n = productos.filter((p) => p.categoria === k).length;
          const activo = filtro === k;
          return (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${activo ? 'text-white border-transparent' : 'border-[#d9c7a8] text-[#6b4c2a]'}`}
              style={activo ? { backgroundColor: CATEGORIES[k].swatch } : undefined}
            >
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORIES[k].swatch }} />
              {CATEGORIES[k].label.split(' · ')[0]} ({n})
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {visibles.length === 0 ? (
        <div className="text-center text-[#8a7355] text-sm py-10 border border-dashed border-[#d9c7a8] rounded-xl">
          <Box className="w-6 h-6 mx-auto mb-2 opacity-60" />
          No hay productos que coincidan. Usa “Nuevo” para registrar uno.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visibles.map((p) => {
            const cat = CATEGORIES[p.categoria];
            const sinDimensiones = !p.usarVolumenManual && volumenDe(p) === 0;
            return (
              <div key={p.id} className="bg-white/70 border border-[#d9c7a8] rounded-xl p-3 flex gap-3">
                <span className="w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.swatch }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#3a2c1d] truncate">{p.nombre}</div>
                      <div className="text-xs text-[#8a7355] truncate">
                        {[p.marca, p.presentacion].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditando(p)} className="p-1.5 rounded-md text-[#6b4c2a] hover:bg-[#e7dcc6]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => eliminar(p.id)} className="p-1.5 rounded-md text-[#c1453d] hover:bg-[#f3d9d6]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 font-mono text-[11px] text-[#6b4c2a]">
                    <span>{pesoCargaDe(p)} kg</span>
                    <span>{volumenDe(p).toFixed(3)} m³</span>
                    <span className="text-[#8a7355]">{cat.label.split(' · ')[0]}</span>
                  </div>
                  {p.restriccion && (
                    <div className="mt-1 text-[11px] text-[#8a5a2b]">{p.restriccion}</div>
                  )}
                  {sinDimensiones && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[#c99a2e]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Falta capturar dimensiones
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editando !== null && (
        <FichaProducto
          producto={Object.keys(editando).length ? editando : null}
          onGuardar={guardar}
          onCancelar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
