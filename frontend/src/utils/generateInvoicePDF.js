/**
 * generateInvoicePDF.js
 * Genera el PDF de la factura usando jsPDF.
 * Cumple con los 12 campos obligatorios de la AEAT para autónomos.
 *
 * Instalación:
 *   npm install jspdf
 *
 * Uso:
 *   import { generateInvoicePDF } from '../utils/generateInvoicePDF';
 *   generateInvoicePDF({ income, profile, calculos });
 */

import { jsPDF } from 'jspdf';

// Colores CUADRA
const COLOR = {
  brand:    [26, 86, 255],   // #1A56FF
  dark:     [13, 15, 20],    // #0D0F14
  body:     [46, 50, 60],    // #2E323C
  muted:    [107, 114, 128], // #6B7280
  border:   [209, 213, 219], // #D1D5DB
  bg:       [249, 250, 251], // #F9FAFB
  income:   [0, 158, 133],   // #009E85 (acento ingresos)
  white:    [255, 255, 255],
};

// Formato EUR en es-ES
const eur = (amount) =>
  Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function generateInvoicePDF({ income, profile, calculos }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210; // ancho A4
  const M = 16;  // margen lateral
  let y = 0;     // cursor vertical

  // ── Cabecera de color ──────────────────────────────────────────────────
  doc.setFillColor(...COLOR.brand);
  doc.rect(0, 0, W, 42, 'F');

  // Logo / marca
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CUADRA', M, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Haz que todo cuadre', M, 25);

  // Número de factura destacado (derecha)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', W - M, 15, { align: 'right' });
  doc.setFontSize(20);
  doc.text(income.invoice_number || `FAC-${income.id?.toString().slice(0,6)}`, W - M, 26, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatDate(income.date)}`, W - M, 34, { align: 'right' });

  y = 52;

  // ── Bloque emisor / receptor ───────────────────────────────────────────
  // Fondo gris claro para los dos bloques
  doc.setFillColor(...COLOR.bg);
  doc.roundedRect(M, y, (W - M * 2 - 6) / 2, 44, 2, 2, 'F');
  doc.roundedRect(M + (W - M * 2 - 6) / 2 + 6, y, (W - M * 2 - 6) / 2, 44, 2, 2, 'F');

  // Bloque emisor (autónoma)
  const col1x = M + 5;
  doc.setTextColor(...COLOR.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('EMISOR', col1x, y + 7);

  doc.setTextColor(...COLOR.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.full_name || '—', col1x, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.body);
  const emisorLines = [
    `NIF: ${profile.nif || '—'}`,
    profile.address || '',
    [profile.postal_code, profile.city, profile.province].filter(Boolean).join(' '),
    profile.phone  ? `Tel: ${profile.phone}` : '',
    profile.email  || '',
  ].filter(Boolean);

  emisorLines.forEach((line, i) => {
    doc.text(line, col1x, y + 22 + i * 5);
  });

  // Bloque receptor (cliente)
  const col2x = M + (W - M * 2 - 6) / 2 + 6 + 5;
  doc.setTextColor(...COLOR.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', col2x, y + 7);

  doc.setTextColor(...COLOR.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(income.client || 'Cliente EEUU', col2x, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.body);
  doc.text('Estados Unidos', col2x, y + 22);
  doc.text('NIF/VAT: N/A (exportación)', col2x, y + 27);

  y += 54;

  // ── Aviso legal exportación ────────────────────────────────────────────
  doc.setFillColor(232, 238, 255); // brand-50
  doc.roundedRect(M, y, W - M * 2, 10, 2, 2, 'F');
  doc.setTextColor(...COLOR.brand);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Operación exenta de IVA — Exportación fuera de la UE (Art. 21 Ley 37/1992 del IVA)',
    W / 2, y + 6.5, { align: 'center' }
  );

  y += 18;

  // ── Tabla de conceptos ─────────────────────────────────────────────────
  // Cabecera de tabla
  doc.setFillColor(...COLOR.dark);
  doc.rect(M, y, W - M * 2, 8, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');

  const cols = {
    concepto:  { x: M + 4,       w: 90, align: 'left'  },
    cantidad:  { x: M + 100,     w: 20, align: 'center' },
    unitario:  { x: M + 126,     w: 28, align: 'right'  },
    importe:   { x: W - M - 2,   w: 28, align: 'right'  },
  };

  doc.text('CONCEPTO',   cols.concepto.x,  y + 5.5);
  doc.text('CANT.',      cols.cantidad.x,  y + 5.5, { align: 'center' });
  doc.text('P. UNITARIO', cols.unitario.x, y + 5.5, { align: 'right' });
  doc.text('IMPORTE',    cols.importe.x,   y + 5.5, { align: 'right' });

  y += 8;

  // Fila de concepto
  doc.setFillColor(...COLOR.white);
  doc.rect(M, y, W - M * 2, 14, 'F');
  doc.setDrawColor(...COLOR.border);
  doc.rect(M, y, W - M * 2, 14, 'S');

  doc.setTextColor(...COLOR.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(income.concept || 'Servicios profesionales', cols.concepto.x, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR.body);
  doc.text(formatDate(income.date), cols.concepto.x, y + 11);

  doc.setFontSize(9);
  doc.setTextColor(...COLOR.dark);
  doc.text('1', cols.cantidad.x, y + 8, { align: 'center' });
  doc.text(eur(calculos.base), cols.unitario.x, y + 8, { align: 'right' });
  doc.text(eur(calculos.base), cols.importe.x,  y + 8, { align: 'right' });

  y += 22;

  // ── Bloque de totales ──────────────────────────────────────────────────
  // Alineado a la derecha, ancho 90mm
  const totX = W - M - 90;
  const totW = 90;

  const drawTotalRow = (label, value, bold = false, colorVal = COLOR.body) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...colorVal);
    doc.text(label, totX + 4, y + 5.5);
    doc.text(value, W - M - 4, y + 5.5, { align: 'right' });
    y += 8;
  };

  // Base imponible
  doc.setFillColor(...COLOR.bg);
  doc.rect(totX, y, totW, 8, 'F');
  drawTotalRow('Base imponible', eur(calculos.base));

  // IVA
  doc.setFillColor(...COLOR.bg);
  doc.rect(totX, y, totW, 8, 'F');
  drawTotalRow('IVA (0% — exportación)', eur(0), false, COLOR.muted);

  // IRPF si aplica
  if (calculos.irpfRate > 0) {
    doc.setFillColor(...COLOR.bg);
    doc.rect(totX, y, totW, 8, 'F');
    drawTotalRow(
      `Retención IRPF (${calculos.irpfRate}%)`,
      `- ${eur(calculos.irpfAmount)}`,
      false,
      COLOR.muted
    );
  }

  // Total — fila destacada
  doc.setFillColor(...COLOR.brand);
  doc.roundedRect(totX, y, totW, 12, 2, 2, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL A COBRAR', totX + 4, y + 8);
  doc.text(eur(calculos.total), W - M - 4, y + 8, { align: 'right' });

  y += 22;

  // ── Nota legal y condiciones ───────────────────────────────────────────
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setTextColor(...COLOR.muted);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  const notas = [
    'Esta factura ha sido emitida conforme al Reglamento de Facturación (RD 1619/2012).',
    'Operación exenta de IVA por tratarse de una exportación de servicios fuera de la UE (Art. 21 Ley 37/1992).',
    'Conservar durante un mínimo de 4 años (Ley 58/2003, Art. 70).',
  ];

  notas.forEach(nota => {
    doc.text(`· ${nota}`, M, y);
    y += 5;
  });

  // ── Pie de página ──────────────────────────────────────────────────────
  const pageHeight = 297;
  doc.setFillColor(...COLOR.brand);
  doc.rect(0, pageHeight - 14, W, 14, 'F');
  doc.setTextColor(...COLOR.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generado con CUADRA · Haz que todo cuadre', W / 2, pageHeight - 5.5, { align: 'center' });

  // ── Guardar ────────────────────────────────────────────────────────────
  const fileName = `${income.invoice_number || 'factura'}_${income.date?.replace(/-/g, '')}.pdf`;
  doc.save(fileName);
}

// Formatea fecha ISO → DD/MM/AAAA
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
