import { jsPDF } from 'jspdf';

const fmt = (n) =>
  '$' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0));

// Etiqueta estilo supermercado.
// - Producto simple: un precio grande + unidad.
// - Alimento fraccionado (precioKilo > 0): dos precios, fraccionado (/kg) y bolsa cerrada.
function drawLabel(doc, p, x, y, w, h) {
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 1.5, 1.5);

  const pad = 2.6;
  const innerX = x + pad;
  const innerRight = x + w - pad;
  const innerW = w - pad * 2;

  // Nombre del producto (hasta 2 líneas, mayúsculas)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15);
  const nombre = String(p.nombre || '').toUpperCase();
  const nameLines = doc.splitTextToSize(nombre, innerW).slice(0, 2);
  doc.text(nameLines, innerX, y + pad + 3.4);

  const precioKilo = Number(p.precioKilo) || 0;
  const esFraccionado = precioKilo > 0;

  if (esFraccionado) {
    // Dos líneas de precio: fraccionado y bolsa cerrada.
    const row1 = y + h - 15;
    const row2 = y + h - 8.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70);
    doc.text('Fraccionado', innerX, row1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`${fmt(precioKilo)} /kg`, innerRight, row1, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70);
    const bolsaLabel = p.kilosPorBolsa ? `Bolsa ${fmt(p.kilosPorBolsa)}kg` : 'Bolsa cerrada';
    doc.text(bolsaLabel, innerX, row2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(fmt(p.precioVenta), innerRight, row2, { align: 'right' });
  } else {
    // Precio único grande.
    const rowP = y + h - 11;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text(fmt(p.precioVenta), innerX, rowP);

    const unidad = p.unidadMedida && p.unidadMedida !== 'unidad' ? `por ${p.unidadMedida}` : '';
    if (unidad) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80);
      doc.text(unidad, innerX, rowP + 4.5);
    }

    if (p.sku) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(150);
      doc.text(String(p.sku), innerRight, y + h - 2.4, { align: 'right' });
    }
  }
}

// Genera y descarga un PDF A4 con todas las etiquetas de precios.
export function generarEtiquetasPrecios(allProducts, filename = 'etiquetas-precios.pdf') {
  // Solo productos activos con al menos un precio cargado.
  const products = (allProducts || []).filter((p) => {
    const venta = Number(p.precioVenta) || 0;
    const kilo = Number(p.precioKilo) || 0;
    return p.activo !== false && (venta > 0 || kilo > 0);
  });

  if (products.length === 0) return false;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const marginX = 8;
  const marginY = 8;
  const gap = 3;
  const cols = 3;
  const labelH = 32;
  const labelW = (pageW - marginX * 2 - gap * (cols - 1)) / cols;
  const rows = Math.floor((pageH - marginY * 2 + gap) / (labelH + gap));
  const perPage = cols * rows;

  products.forEach((p, i) => {
    const idx = i % perPage;
    if (idx === 0 && i > 0) doc.addPage();

    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const lx = marginX + col * (labelW + gap);
    const ly = marginY + row * (labelH + gap);
    drawLabel(doc, p, lx, ly, labelW, labelH);
  });

  doc.save(filename);
  return true;
}

export default generarEtiquetasPrecios;
