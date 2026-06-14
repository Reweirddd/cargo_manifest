import React from 'react';
import { Truck, Route, Scale, Layers, Box, ArrowRight, CheckCircle2 } from 'lucide-react';

const beneficios = [
  { Icon: Route, title: 'Entregas en orden', text: 'Cada parada en su sección: no descargas todo el camión en cada pueblo.' },
  { Icon: Scale, title: 'Peso bajo control', text: 'Avisa antes de pasarte del límite y reparte la carga entre los ejes.' },
  { Icon: Layers, title: 'Carga segura', text: 'Sacos abajo, frágil arriba, aves ventiladas — sin aplastar nada.' },
  { Icon: Box, title: 'Vista 3D del camión', text: 'Mira cómo queda la carga acomodada antes de subir el primer saco.' },
];

const specs = [
  { label: 'Caja interna', value: '7.00 × 2.40 × 2.20 m' },
  { label: 'Capacidad', value: '11,000 kg' },
  { label: 'Ruta', value: 'Lima → Pauza' },
];

export default function Welcome({ onComenzar }) {
  return (
    <div className="min-h-screen w-full bg-[#f3ecdf] text-[#3a2c1d] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-3xl">
        <div className="bg-white/70 border-2 border-[#8a5a2b] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Acento decorativo */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#8a5a2b]/10" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-[#4f7942]/10" />

          <div className="relative">
            <div className="flex items-center gap-2 text-[#8a5a2b] mb-4">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#8a5a2b] text-white">
                <Truck className="w-6 h-6" />
              </span>
              <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-bold">Plan de carga · Isuzu FRR CL</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Carga tu camión en minutos,<br className="hidden sm:block" />
              <span className="text-[#8a5a2b]"> sin errores de peso ni de orden de entrega.</span>
            </h1>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#6b4c2a] max-w-xl">
              El sistema reparte automáticamente abarrotes, sacos y carga frágil en las secciones del
              camión, respeta el orden de las entregas y te avisa si algo se pasa de peso o rompe una
              regla de apilado. Menos tiempo cargando, menos multas, menos pérdidas.
            </p>

            {/* Specs */}
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              {specs.map((s) => (
                <div key={s.label} className="bg-[#faf6ec] border border-[#d9c7a8] rounded-xl px-2 py-2.5 text-center">
                  <div className="text-[9px] sm:text-[11px] uppercase tracking-wide text-[#8a7355] font-semibold">{s.label}</div>
                  <div className="text-[11px] sm:text-sm font-bold font-mono mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Beneficios */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {beneficios.map(({ Icon, title, text }) => (
                <div key={title} className="flex gap-3 bg-[#faf6ec] border border-[#d9c7a8] rounded-xl p-3">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#8a5a2b]/10 text-[#8a5a2b]">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#4f7942]" /> {title}
                    </div>
                    <div className="text-xs text-[#6b4c2a] mt-0.5 leading-snug">{text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={onComenzar}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#8a5a2b] text-white font-bold text-sm sm:text-base hover:bg-[#73491f] transition shadow"
              >
                Comenzar <ArrowRight className="w-5 h-5" />
              </button>
              <span className="text-[11px] sm:text-xs text-[#8a7355]">
                Demo con productos de ejemplo · puedes editar el catálogo y armar un viaje.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
