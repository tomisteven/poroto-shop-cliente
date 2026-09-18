import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { X, Search, Plus, Minus, Trash2, Tag, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const arsFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formatCurrency = (val) => arsFormat.format(val);

const SalesEditor = ({ sale, onClose, onSaved }) => {
  const [lines, setLines] = useState([]);
  const [products, setProducts] = useState([]);
  const [promos, setPromos] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [showPromos, setShowPromos] = useState(false);
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/sales/${sale._id}`),
      api.get('/products'),
      api.get('/promotions?estado=activa'),
    ])
      .then(([saleRes, prodRes, promoRes]) => {
        if (!active) return;
        setProducts(prodRes.data);
        setPromos(promoRes.data);
        const full = saleRes.data;
        const prodById = new Map(prodRes.data.map((p) => [String(p._id), p]));

        const initialLines = full.items.map((it, i) => {
          if (it.promocion) {
            return {
              key: `promo-${it.promocion}-${i}`,
              esPromocion: true,
              promocion: it.promocion,
              producto: it.producto,
              nombre: it.nombre || 'Promoción',
              precioVenta: it.precioVentaHisto,
              precioCompra: it.precioCompraHisto,
              cantidad: it.cantidad,
              kilosVendidos: it.kilosVendidos,
            };
          }
          const p = prodById.get(String(it.producto)) || {};
          return {
            key: `${it.producto}-${i}`,
            esPromocion: false,
            producto: it.producto,
            nombre: it.nombre || it.producto?.nombre || p.nombre || 'Producto',
            precioVenta: it.esVentaSuelta && it.cantidad > 0 ? it.subtotal / it.cantidad : it.precioVentaHisto,
            precioCompra: it.precioCompraHisto ?? p.precioCompra ?? 0,
            cantidad: it.cantidad,
            esVentaSuelta: !!it.esVentaSuelta,
            kilosVendidos: it.kilosVendidos,
            esGenerico: !!p.esGenerico,
            esBolsaAlimento: !!p.esBolsaAlimento,
            kilosPorBolsa: p.kilosPorBolsa,
          };
        });

        if (initialLines.length === 0) {
          setLoadError(true);
          return;
        }

        setLines(initialLines);
        setDescuento(full.descuento || 0);
        setMetodoPago(full.metodoPago || 'efectivo');
        setMontoPagado(full.montoPagado != null ? String(full.montoPagado) : '');
        setNotas(full.notas || '');
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [sale._id]);

  const { subtotal, totalFinal } = useMemo(() => {
    const sub = lines.reduce((acc, l) => acc + l.precioVenta * l.cantidad, 0);
    return { subtotal: sub, totalFinal: sub - sub * (descuento / 100) };
  }, [lines, descuento]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const base = products.filter((p) => !q || p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    return showPromos ? [] : base;
  }, [products, debouncedSearch, showPromos]);

  const setLineQty = (key, qty) => {
    if (qty < 1) return removeLine(key);
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const multiplier = qty / l.cantidad;
        return {
          ...l,
          cantidad: qty,
          kilosVendidos: l.esVentaSuelta && l.kilosVendidos ? Number((l.kilosVendidos * multiplier).toFixed(3)) : l.kilosVendidos,
        };
      })
    );
  };

  const removeLine = (key) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const addProduct = (p) => {
    const existing = lines.find((l) => !l.esPromocion && !l.esVentaSuelta && !l.esGenerico && String(l.producto) === String(p._id));
    if (existing) {
      setLineQty(existing.key, existing.cantidad + 1);
      return;
    }
    const key = `${p._id}-${Date.now()}`;
    setLines((prev) => [
      ...prev,
      {
        key,
        esPromocion: false,
        producto: p._id,
        nombre: p.nombre,
        precioVenta: p.precioVenta,
        precioCompra: p.precioCompra,
        cantidad: 1,
        esVentaSuelta: false,
        kilosVendidos: undefined,
        esGenerico: !!p.esGenerico,
        esBolsaAlimento: !!p.esBolsaAlimento,
        kilosPorBolsa: p.kilosPorBolsa,
      },
    ]);
  };

  const addPromo = (promo) => {
    const existing = lines.find((l) => l.esPromocion && String(l.promocion) === String(promo._id));
    if (existing) {
      setLineQty(existing.key, existing.cantidad + 1);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: `promo-${promo._id}-${Date.now()}`,
        esPromocion: true,
        promocion: promo._id,
        producto: promo.productoPrincipal,
        nombre: promo.nombre,
        precioVenta: promo.precioFinal,
        precioCompra: promo.subtotalCosto,
        cantidad: 1,
        kilosVendidos: undefined,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (lines.length === 0) return toast.error('No hay ítems para guardar');
    const numPagado = parseFloat(montoPagado);
    if (metodoPago === 'efectivo' && (isNaN(numPagado) || numPagado < totalFinal - 0.01)) {
      return toast.error('El monto pagado en efectivo debe cubrir el total');
    }

    const items = lines.map((l) =>
      l.esPromocion
        ? { promocion: l.promocion, producto: l.producto, cantidad: l.cantidad }
        : {
            producto: l.producto,
            cantidad: l.cantidad,
            esVentaSuelta: !!l.esVentaSuelta,
            kilosVendidos: l.esVentaSuelta ? l.kilosVendidos : undefined,
            subtotal: l.esVentaSuelta ? l.cantidad * l.precioVenta : undefined,
            precioUnitario: l.esGenerico ? l.precioVenta : undefined,
          }
    );

    setSaving(true);
    try {
      await api.patch(`/sales/${sale._id}`, {
        items,
        descuento: Number(descuento) || 0,
        metodoPago,
        montoPagado: isNaN(numPagado) ? totalFinal : numPagado,
        notas,
      });
      toast.success('Venta editada correctamente');
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al editar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-5xl rounded-t-2xl md:rounded-2xl border border-stone-700 shadow-2xl flex flex-col max-h-[94dvh] overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-stone-800 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-textLight flex items-center gap-2">
              <Package size={18} className="text-primary" /> Editar venta — {sale.numeroTicket}
            </h3>
            <p className="text-xs text-textMuted mt-0.5">Modificá ítems, cantidades, descuento y forma de pago. El stock se ajusta automáticamente.</p>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textLight"><X size={24} /></button>
        </div>

        {loadError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-textMuted text-sm">No se pudieron cargar los datos de la venta.</p>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-800 text-textLight hover:bg-stone-700 transition-colors text-sm font-semibold">Cerrar</button>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Columna catálogo */}
            <div className="md:w-2/5 border-b md:border-b-0 md:border-r border-stone-800 flex flex-col min-h-0 md:max-h-none">
              <div className="p-3 border-b border-stone-800 shrink-0 space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={() => setShowPromos((v) => !v)}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                    showPromos ? 'bg-primary/20 border-primary text-primary' : 'bg-stone-800 border-stone-700 text-textMuted hover:text-textLight'
                  }`}
                >
                  <Tag size={14} /> Promociones
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {showPromos ? (
                  promos.length === 0 ? (
                    <p className="text-sm text-textMuted text-center py-6">No hay promociones activas.</p>
                  ) : (
                    promos.map((promo) => (
                      <button
                        key={promo._id}
                        onClick={() => addPromo(promo)}
                        className="w-full text-left bg-background border border-primary/30 rounded-xl p-2.5 hover:border-primary hover:bg-stone-900 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-textLight truncate">{promo.nombre}</p>
                          <span className="text-[10px] font-bold text-primary shrink-0">{formatCurrency(promo.precioFinal)}</span>
                        </div>
                        <p className="text-[11px] text-textMuted">{promo.items?.length} productos · {promo.descuento}% OFF</p>
                      </button>
                    ))
                  )
                ) : filteredProducts.length === 0 ? (
                  <p className="text-sm text-textMuted text-center py-6">No se encontraron productos.</p>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => addProduct(p)}
                      className="w-full text-left bg-background border border-stone-800 rounded-xl p-2.5 hover:border-primary/60 hover:bg-stone-900 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-textLight truncate">{p.nombre}</p>
                        <span className="text-xs font-bold text-primary shrink-0">{formatCurrency(p.precioVenta)}</span>
                      </div>
                      <p className="text-[11px] text-textMuted">{p.sku} · Stock: {p.stock ?? '-'}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Columna edición */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-stone-800">
                {lines.length === 0 && (
                  <p className="text-sm text-textMuted text-center py-10">No quedan ítems. Agregá productos desde la izquierda.</p>
                )}
                {lines.map((l) => (
                  <div key={l.key} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textLight truncate">{l.nombre}</p>
                      <p className="text-[11px] text-textMuted">
                        {l.esPromocion ? 'Promoción' : l.esVentaSuelta ? `Venta suelta · ${l.kilosVendidos ?? 0} kg` : l.esGenerico ? 'Genérico' : ''} · {formatCurrency(l.precioVenta)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setLineQty(l.key, l.cantidad - 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"><Minus size={13} /></button>
                      <span className="w-9 text-center text-sm font-bold text-textLight">{l.cantidad}</span>
                      <button onClick={() => setLineQty(l.key, l.cantidad + 1)} disabled={l.cantidad >= 999} className="w-7 h-7 flex items-center justify-center rounded-md bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors disabled:opacity-40"><Plus size={13} /></button>
                    </div>
                    <p className="w-24 text-right text-sm font-bold text-textLight shrink-0">{formatCurrency(l.cantidad * l.precioVenta)}</p>
                    <button onClick={() => removeLine(l.key)} className="text-danger hover:text-red-400 shrink-0"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-stone-800 space-y-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-textMuted mb-1">Descuento (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={descuento}
                      onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                      className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-textMuted mb-1">Forma de pago</label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
                {metodoPago === 'efectivo' && (
                  <div>
                    <label className="block text-xs font-medium text-textMuted mb-1">Monto recibido</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                      className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-1">Notas</label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Motivo de la edición..."
                    className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-textMuted space-y-0.5">
                    <p>Subtotal: <span className="font-semibold text-textLight">{formatCurrency(subtotal)}</span></p>
                    {descuento > 0 && (
                      <p>Desc {descuento}%: <span className="font-semibold text-red-400">-{formatCurrency(subtotal * descuento / 100)}</span></p>
                    )}
                    <p className="text-base font-bold text-textLight">TOTAL: {formatCurrency(totalFinal)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={onClose} className="px-4 py-2.5 rounded-lg bg-stone-800 text-textLight hover:bg-stone-700 transition-colors text-sm font-semibold">Cancelar</button>
                    <button onClick={handleSubmit} disabled={saving || lines.length === 0} className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                      {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>}
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesEditor;