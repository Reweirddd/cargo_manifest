import React, { useState, useEffect } from 'react';
import { Package, ClipboardList } from 'lucide-react';
import Catalog from './Catalog.jsx';
import TripBuilder from './TripBuilder.jsx';
import Welcome from './Welcome.jsx';
import { cargarCatalogo, guardarCatalogo } from './catalog.js';
import { DESTINOS_DEFECTO, viajeEjemplo } from './planModel.js';

export default function CargoPlanner() {
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);
  const [tab, setTab] = useState('viaje'); // 'viaje' | 'catalogo'
  const [productos, setProductos] = useState(() => cargarCatalogo());

  // Estado del viaje a nivel App: se conserva al cambiar de pestaña y arranca
  // con un viaje de ejemplo precargado (demo).
  const [destinos, setDestinos] = useState(DESTINOS_DEFECTO);
  const [lineas, setLineas] = useState(() => viajeEjemplo(productos));

  useEffect(() => { guardarCatalogo(productos); }, [productos]);

  if (mostrarBienvenida) {
    return <Welcome onComenzar={() => setMostrarBienvenida(false)} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#f3ecdf] text-[#3a2c1d] p-3 sm:p-6 font-sans">
      <header className="max-w-5xl mx-auto mb-4">
        <button onClick={() => setMostrarBienvenida(true)} className="text-left group" title="Volver al inicio">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8a5a2b] font-semibold group-hover:underline">Plan de carga · inicio</p>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Isuzu FRR CL — Lima (VMT) a Pauza</h1>
        </button>
        <p className="text-xs sm:text-sm text-[#8a7355] mt-1 font-mono">
          Carrocería 7.00 × 2.40 × 2.20 m · Capacidad reforzada 11,000 kg
        </p>
      </header>

      <nav className="max-w-5xl mx-auto mb-4 flex gap-1 bg-white/50 border border-[#d9c7a8] rounded-xl p-1 w-fit">
        {[
          { id: 'viaje', label: 'Armar viaje', Icon: ClipboardList },
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

      {tab === 'catalogo'
        ? <Catalog productos={productos} setProductos={setProductos} />
        : <TripBuilder
            productos={productos}
            destinos={destinos}
            setDestinos={setDestinos}
            lineas={lineas}
            setLineas={setLineas}
          />}

      <footer className="max-w-5xl mx-auto text-[11px] sm:text-xs text-[#8a7355] pb-4 mt-2">
        {tab === 'catalogo'
          ? 'El catálogo se autoguarda en este navegador. Usa “Exportar” para respaldar la base de datos en un archivo JSON y “Importar” para restaurarla en otra PC.'
          : 'La distribución se sugiere automáticamente por reglas (orden de entrega, capa por categoría y balance de peso). Próxima etapa: que el sistema recuerde tus ajustes manuales.'}
      </footer>
    </div>
  );
}
