import * as XLSX from 'xlsx';
import api from '../api/axios';

const MONEY = '"$"#,##0.00';

const HEADER_FILL = { fgColor: { rgb: '232323' } };
const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFF' } };
const HEADER_ALIGN = { horizontal: 'center', vertical: 'center' };
const CENTER = { horizontal: 'center', vertical: 'center' };
const RIGHT = { horizontal: 'right', vertical: 'center' };

const sheetHeader = (labels) => labels.map((label) => ({
  t: 's',
  v: label,
  s: {
    font: HEADER_FONT,
    fill: HEADER_FILL,
    alignment: HEADER_ALIGN,
    border: { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } },
  },
}));

const money = (v) => ({ t: 'n', v: Number(v) || 0, z: MONEY, s: { alignment: RIGHT } });
const text = (v, opts = {}) => ({ t: 's', v: String(v ?? ''), s: { alignment: opts.center ? CENTER : { vertical: 'center' } } });
const number = (v, opts = {}) => ({ t: 'n', v: Number(v) || 0, s: { alignment: opts.center ? CENTER : { vertical: 'center' } } });

const sanitizeSheetName = (name) => {
  const clean = String(name).replace(/[\[\]:*?/\\]/g, ' ').trim().slice(0, 31);
  return clean || 'Categoría';
};

const buildProductSheet = (catName, products) => {
  const headers = ['Producto', 'SKU', 'Stock', 'Unidad', 'Precio Compra', 'Precio Venta', 'P. Kilo', 'Margen %', 'Tipo', 'Proveedor'];

  const rows = products.map((p) => {
    const compra = Number(p.precioCompra) || 0;
    const venta = Number(p.precioVenta) || 0;
    const margen = compra > 0 ? (((venta - compra) / compra) * 100) : 0;
    const precioKilo = Number(p.precioKilo) || 0;

    const tipo = p.esCombo
      ? 'Combo'
      : p.esBolsaAlimento
        ? 'Bolsa alimento'
        : '';

    return [
      text(p.nombre),
      text(p.sku || ''),
      number(p.stock, { center: true }),
      text(p.unidadMedida || 'unidad', { center: true }),
      money(compra),
      money(venta),
      precioKilo > 0 ? money(precioKilo) : text('', { center: true }),
      number(parseFloat(margen.toFixed(2)), { center: true }),
      text(tipo, { center: true }),
      text(p.proveedor || ''),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  headers.forEach((_, i) => {
    ws[XLSX.utils.encode_cell({ r: 0, c: i })] = sheetHeader(headers)[i];
  });

  ws['!cols'] = [
    { wch: 40 }, { wch: 18 }, { wch: 9 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 15 }, { wch: 22 },
  ];

  ws['!pageSetup'] = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  ws['!margins'] = { left: 0.3, right: 0.3, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 };
  ws['!freeze'] = { rowSplit: 1 };

  return ws;
};

const buildSummarySheet = (groups) => {
  const headers = ['Categoría', 'Productos', 'Valor Compra (stock)', 'Valor Venta (stock)'];
  const rows = groups.map((g) => {
    const valorCompra = g.products.reduce((acc, p) => acc + (Number(p.stock) || 0) * (Number(p.precioCompra) || 0), 0);
    const valorVenta = g.products.reduce((acc, p) => acc + (Number(p.stock) || 0) * (Number(p.precioVenta) || 0), 0);
    return [
      text(g.nombre),
      number(g.products.length, { center: true }),
      money(valorCompra),
      money(valorVenta),
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  headers.forEach((_, i) => {
    ws[XLSX.utils.encode_cell({ r: 0, c: i })] = sheetHeader(headers)[i];
  });

  ws['!cols'] = [
    { wch: 30 }, { wch: 10 }, { wch: 22 }, { wch: 22 },
  ];
  ws['!pageSetup'] = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  ws['!freeze'] = { rowSplit: 1 };

  return ws;
};

export const exportProductsToExcel = async ({ conPrecio = false } = {}) => {
  const { data } = await api.get('/products');
  const lista = conPrecio
    ? data.filter((p) => (Number(p.precioCompra) || 0) > 0 || (Number(p.precioVenta) || 0) > 0)
    : data;

  if (!lista || lista.length === 0) {
    throw new Error(conPrecio ? 'No hay productos con precio para exportar' : 'No hay productos para exportar');
  }

  const groupsMap = new Map();
  lista.forEach((p) => {
    const catName = p.categoria?.nombre || 'Sin categoría';
    if (!groupsMap.has(catName)) groupsMap.set(catName, []);
    groupsMap.get(catName).push(p);
  });

  const groups = [...groupsMap.entries()]
    .map(([nombre, products]) => ({ nombre, products }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(groups), 'Resumen');
  groups.forEach((g) => {
    XLSX.utils.book_append_sheet(wb, buildProductSheet(g.nombre, g.products), sanitizeSheetName(g.nombre));
  });

  const fecha = new Date().toISOString().slice(0, 10);
  const nombreArchivo = conPrecio ? `Productos-Con-Precio-${fecha}.xlsx` : `Productos-Lista-Precios-${fecha}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
  return { grupos: groups.map((g) => g.nombre), total: lista.length, conPrecio };
};