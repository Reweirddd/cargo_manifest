// Genera una "Hoja de carga" en PDF a partir del plan, construida por código
// (texto y tablas) para que salga nítida y liviana, sin capturas de pantalla.

import { jsPDF } from 'jspdf';
import { CATEGORIES } from './catalog.js';
import {
  TRUCK, SECTION_IDS, sectionsMeta, weightOf, sectionTotals,
} from './planModel.js';

const C = {
  brown: [138, 90, 43],
  dark: [58, 44, 29],
  muted: [138, 115, 85],
  line: [217, 199, 168],
  panel: [250, 246, 236],
  green: [79, 121, 66],
  amber: [201, 154, 46],
  red: [193, 69, 61],
};

export function descargarPDF(plan, destinos, verif) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const Hp = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = M;

  const ensure = (need) => {
    if (y + need > Hp - M) { doc.addPage(); y = M; }
  };

  // ── Encabezado ──
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...C.dark);
  doc.text('Hoja de carga — Isuzu FRR CL', M, y);
  y += 7;
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...C.muted);
  const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Lima (VMT) -> Pauza  ·  ${fecha}`, M, y);
  y += 5;
  doc.text(`Caja 7.00 x 2.40 x 2.20 m  ·  Capacidad ${TRUCK.maxWeight.toLocaleString('es-PE')} kg`, M, y);
  y += 8;

  // ── Resumen ──
  const { grand, weightPct, volumePct } = verif;
  doc.setDrawColor(...C.line).setFillColor(...C.panel);
  doc.roundedRect(M, y, W - 2 * M, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...C.dark);
  doc.text(`Peso total: ${grand.weight.toFixed(0)} kg  (${weightPct.toFixed(0)}%)`, M + 4, y + 6);
  doc.text(`Volumen: ${grand.volume.toFixed(1)} m3  (${volumePct.toFixed(0)}%)`, M + 4, y + 11);
  doc.text('Orden de descarga: S1 (puerta) primero -> S4 (cabina) al final', W - M - 4, y + 8.5, { align: 'right' });
  y += 20;

  // ── Secciones (en orden de entrega S1..S4) ──
  const meta = {};
  sectionsMeta(destinos).forEach((s) => { meta[s.id] = s; });

  const cP = M + 2;
  const cCat = M + 92;
  const cCant = W - M - 38;
  const cPeso = W - M - 2;

  for (const id of SECTION_IDS) {
    const rows = [];
    for (const capa of ['piso', 'medio', 'superior']) {
      for (const it of plan[id][capa]) rows.push({ capa, it });
    }
    if (rows.length === 0) continue;

    const st = sectionTotals(plan, id);
    ensure(20);

    // Título de sección
    doc.setFillColor(...C.brown);
    doc.roundedRect(M, y, W - 2 * M, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(255, 255, 255);
    const m = meta[id] || {};
    doc.text(`Seccion ${id} · ${m.stop || '—'}  (${m.pos || ''})`, M + 3, y + 5.5);
    doc.text(`${st.weight.toFixed(0)} kg`, W - M - 3, y + 5.5, { align: 'right' });
    y += 11;

    // Cabecera de tabla
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...C.muted);
    doc.text('Producto', cP, y);
    doc.text('Capa / categoria', cCat, y);
    doc.text('Cant.', cCant, y, { align: 'right' });
    doc.text('Peso', cPeso, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(...C.line).line(M, y, W - M, y);
    y += 4;

    // Filas
    doc.setFont('helvetica', 'normal').setFontSize(9);
    for (const { capa, it } of rows) {
      ensure(6);
      const cat = CATEGORIES[it.category];
      let name = it.name;
      if (name.length > 50) name = name.slice(0, 48) + '…';
      doc.setTextColor(...C.dark).text(name, cP, y);
      doc.setTextColor(...C.muted).text(`${capa} · ${cat ? cat.label.split(' · ')[0] : it.category}`, cCat, y);
      doc.setTextColor(...C.dark);
      doc.text(String(it.qty), cCant, y, { align: 'right' });
      doc.text(`${weightOf(it).toFixed(0)} kg`, cPeso, y, { align: 'right' });
      y += 6;
    }
    y += 5;
  }

  // ── Verificaciones ──
  ensure(12);
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...C.dark);
  doc.text('Verificaciones', M, y);
  y += 6;
  doc.setFont('helvetica', 'normal').setFontSize(9);
  for (const c of verif.checks) {
    const col = c.tone === 'error' ? C.red : c.tone === 'warn' ? C.amber : C.green;
    const lines = doc.splitTextToSize(c.text, W - 2 * M - 5);
    ensure(5 * lines.length + 1);
    doc.setTextColor(...col).text('•', M, y);
    doc.setTextColor(...C.dark).text(lines, M + 4, y);
    y += 5 * lines.length + 1;
  }

  // ── Pie ──
  ensure(8);
  y = Math.max(y, Hp - M - 4);
  doc.setFont('helvetica', 'italic').setFontSize(8).setTextColor(...C.muted);
  doc.text('Generado con Plan de carga · demo', M, Hp - M);

  const fechaArchivo = new Date().toISOString().slice(0, 10);
  doc.save(`hoja-de-carga-${fechaArchivo}.pdf`);
}
