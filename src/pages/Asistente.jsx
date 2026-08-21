import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import toast from 'react-hot-toast';
import {
  Wand2, Search, Loader, ShoppingCart, Package, Tag, Sparkles,
  ArrowRight, Lightbulb, CheckCircle2, Globe, ExternalLink, BookOpen,
  Scale, X, Trophy, ThumbsUp, ThumbsDown, Medal, ChevronDown
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

const SUGERENCIAS = [
  'Shampoo para pulgas',
  'Alimento para gato adulto',
  'Snacks para perro',
  'Arena para gatos',
  'Collar para perro grande',
  'Juguete para morder',
];

const ProductPicker = ({ label, value, onChange, products, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = products
    .filter((p) => String(p._id) !== String(value?._id))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return `${p.nombre} ${p.sku} ${p.categoria?.nombre || ''}`.toLowerCase().includes(q);
    })
    .slice(0, 30);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-textMuted mb-1 font-medium">{label}</label>
      {value ? (
        <div className="flex items-center justify-between gap-2 bg-background border border-stone-700 rounded-xl px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-textLight truncate">{value.nombre}</p>
            <p className="text-[10px] text-textMuted font-mono">
              {value.sku} — {formatCurrency(value.precioVenta)} — {value.stock} en stock
            </p>
          </div>
          <button
            onClick={() => { onChange(null); setSearch(''); }}
            className="shrink-0 text-textMuted hover:text-danger transition-colors"
            title="Quitar producto"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-2 bg-background border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-textMuted hover:border-primary transition-colors"
        >
          <span>{placeholder}</span>
          <ChevronDown size={16} />
        </button>
      )}

      {open && !value && (
        <div className="absolute z-30 mt-1 w-full bg-surface border border-stone-700 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-2 border-b border-stone-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              autoFocus
              className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-4 text-xs text-textMuted text-center">No hay productos que coincidan</p>
            )}
            {filtered.map((p) => (
              <button
                key={p._id}
                onClick={() => { onChange(p); setOpen(false); setSearch(''); }}
                disabled={disabled}
                className="w-full text-left px-4 py-2.5 hover:bg-stone-800/60 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-textLight truncate">{p.nombre}</p>
                  <p className="text-[10px] text-textMuted font-mono">
                    {p.sku} · {p.categoria?.nombre || 'Sin categoría'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-primary">{formatCurrency(p.precioVenta)}</p>
                  <p className={`text-[10px] font-bold ${p.stock > 0 ? 'text-emerald-400' : 'text-danger'}`}>
                    {p.stock > 0 ? `${p.stock} en stock` : 'Sin stock'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Asistente = () => {
  const navigate = useNavigate();
  const { cartItems, addToCart } = useContext(CartContext);

  const [modo, setModo] = useState('catalogo');

  // Modo catálogo
  const [consulta, setConsulta] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Modo web
  const [webProducto, setWebProducto] = useState('');
  const [webReferencia, setWebReferencia] = useState('');
  const [webLoading, setWebLoading] = useState(false);
  const [webResult, setWebResult] = useState(null);

  // Modo comparar
  const MAX_COMPARE_PRODUCTS = 4;
  const [catalogo, setCatalogo] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compResult, setCompResult] = useState(null);

  useEffect(() => {
    api
      .get('/products')
      .then(({ data }) => setCatalogo(Array.isArray(data) ? data : []))
      .catch(() => setCatalogo([]));
  }, []);

  const handleRecommend = async (query) => {
    const q = (query ?? consulta).trim();
    if (!q) return toast.error('Escribí qué busca el cliente');
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/recommendations', { consulta: q });
      setResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al buscar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleWebSearch = async () => {
    const producto = webProducto.trim();
    if (!producto) return toast.error('Indicá el nombre del producto');
    setWebLoading(true);
    setWebResult(null);
    try {
      const { data } = await api.post('/recommendations/web', {
        producto,
        referencia: webReferencia,
      });
      setWebResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al buscar en internet');
    } finally {
      setWebLoading(false);
    }
  };

  const addProduct = (p) => {
    setCompResult(null);
    setSelected((prev) =>
      prev.some((s) => String(s._id) === String(p._id)) || prev.length >= MAX_COMPARE_PRODUCTS
        ? prev
        : [...prev, p]
    );
  };
  const removeProduct = (idx) => {
    setCompResult(null);
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleCompare = async () => {
    if (selected.length < 2) return toast.error('Seleccioná al menos dos productos para comparar');
    setCompLoading(true);
    setCompResult(null);
    try {
      const { data } = await api.post('/recommendations/compare', {
        productoIds: selected.map((p) => p._id),
      });
      setCompResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al comparar productos');
    } finally {
      setCompLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const added = addToCart(product);
    if (added) {
      toast.success(`${product.nombre} agregado al carrito`);
    }
  };

  const inCart = (productId) => cartItems.some(i => i.producto === productId);

  const cartCount = cartItems.reduce((s, i) => s + i.cantidad, 0);

  const COL_COLORS = [
    'bg-primary/10 text-primary',
    'bg-beige/10 text-beige',
    'bg-emerald-500/10 text-emerald-400',
    'bg-amber-500/10 text-amber-400',
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Wand2 className="text-primary" size={28} />
            Ayuda al Vendedor
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Recomendá productos, compará opciones y buscá información, con el apoyo de la IA
          </p>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => navigate('/pos')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <ShoppingCart size={18} />
            {cartCount} en carrito — Ir al POS
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Toggle de modo */}
      <div className="grid grid-cols-3 gap-2 bg-surface p-1.5 rounded-xl border border-stone-800 max-w-lg">
        <button
          onClick={() => setModo('catalogo')}
          className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${modo === 'catalogo' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-textLight'}`}
        >
          <Package size={16} />
          Mi catálogo
        </button>
        <button
          onClick={() => setModo('comparar')}
          className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${modo === 'comparar' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20' : 'text-textMuted hover:text-textLight'}`}
        >
          <Scale size={16} />
          Comparar
        </button>
        <button
          onClick={() => setModo('web')}
          className={`py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${modo === 'web' ? 'bg-gradient-to-r from-primary to-primaryDark text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:text-textLight'}`}
        >
          <Globe size={16} />
          Internet
        </button>
      </div>

      {modo === 'catalogo' ? (
        <>
          {/* Buscador catálogo */}
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <div className="relative">
              <Search className="absolute left-4 top-4 text-stone-400" size={20} />
              <textarea
                rows={2}
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRecommend(); } }}
                placeholder="Ej: un alimento balanceado para cachorro de raza grande, o un shampoo para gato con pulgas..."
                className="w-full bg-background border border-stone-700 rounded-xl pl-12 pr-4 py-3 text-textLight focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <button
              onClick={() => handleRecommend()}
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-primary to-primaryDark hover:from-orange-400 hover:to-primaryDark disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? 'Recomendando...' : 'Recomendar de mi catálogo'}
            </button>
            <div className="flex flex-wrap gap-2 mt-4">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setConsulta(s); handleRecommend(s); }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-800 text-textMuted hover:text-textLight hover:border-primary border border-stone-700 transition-colors disabled:opacity-50"
                >
                  <Lightbulb size={12} className="inline mr-1 text-amber-400" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Cargando catálogo */}
          {loading && (
            <div className="bg-surface rounded-xl border border-stone-800 p-10 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-textMuted text-sm animate-pulse">
                Analizando catálogo y buscando el mejor producto para el cliente...
              </p>
            </div>
          )}

          {/* Resultados catálogo */}
          {!loading && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-textLight font-bold flex items-center gap-2">
                  <Search size={16} className="text-primary" />
                  Recomendaciones para: <span className="text-primary italic">"{result.consulta}"</span>
                </p>
                {result.fuente === 'local' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                    Sin IA — búsqueda local
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {result.recomendaciones.map((rec) => {
                  const p = rec.producto;
                  const added = inCart(p._id);
                  return (
                    <div key={p._id} className="bg-surface rounded-xl border border-stone-800 hover:border-primary/40 transition-all flex flex-col">
                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-xs text-textMuted font-mono">{p.sku}</p>
                            <h4 className="font-bold text-textLight leading-tight">{p.nombre}</h4>
                          </div>
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            <Tag size={10} /> {p.categoria?.nombre || 'Sin cat.'}
                          </span>
                        </div>

                        {rec.motivo && (
                          <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-3">
                            <Lightbulb size={12} className="inline mr-1" />
                            {rec.motivo}
                          </p>
                        )}

                        {p.descripcion && (
                          <p className="text-xs text-textMuted leading-relaxed line-clamp-3 mb-3">{p.descripcion}</p>
                        )}

                        {p.esBolsaAlimento && (
                          <p className="text-xs text-textMuted font-mono mb-1">Bolsa de {p.kilosPorBolsa} Kilos</p>
                        )}

                        <div className="flex justify-between items-end mt-2">
                          <p className="font-bold text-lg text-primary">{formatCurrency(p.precioVenta)}</p>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${p.stock > p.stockMinimo ? 'bg-emerald-500/20 text-emerald-500' : p.stock > 0 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>
                            {p.stock} en stock
                          </span>
                        </div>
                      </div>

                      <div className="p-4 border-t border-stone-800">
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={p.stock <= 0 || added}
                          className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                            added
                              ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                              : 'bg-primary hover:bg-primaryDark disabled:opacity-50 disabled:hover:bg-primary text-white shadow-lg shadow-primary/20'
                          }`}
                        >
                          {added ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />}
                          {added ? 'En el carrito' : 'Agregar al carrito'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {cartCount > 0 && (
                <button
                  onClick={() => navigate('/pos')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <ShoppingCart size={18} />
                  Finalizar la venta en el Punto de Venta ({cartCount} ítems)
                </button>
              )}
            </div>
          )}

          {!loading && !result && (
            <div className="bg-surface rounded-xl border border-stone-800 border-dashed p-10 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Package className="text-primary" size={32} />
              </div>
              <p className="text-textLight font-bold">¿Qué está pidiendo el cliente?</p>
              <p className="text-textMuted text-sm max-w-md">
                Describí lo que busca (puede ser una necesidad, un problema o un producto puntual) y
                el asistente revisará el catálogo con las descripciones de cada producto para
                recomendarte las mejores opciones disponibles en stock.
              </p>
            </div>
          )}
        </>
      ) : modo === 'comparar' ? (
        <>
          {/* Selector de productos */}
          <div className="bg-surface rounded-xl border border-stone-800 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selected.map((p, i) => (
                <div key={p._id} className="flex items-center justify-between gap-2 bg-background border border-stone-700 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-textLight truncate">{p.nombre}</p>
                      <p className="text-[10px] text-textMuted font-mono">
                        {p.sku} — {formatCurrency(p.precioVenta)} — {p.stock} en stock
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeProduct(i)} className="shrink-0 text-textMuted hover:text-danger transition-colors" title="Quitar producto">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {selected.length < MAX_COMPARE_PRODUCTS ? (
              <ProductPicker
                label={`Agregar producto (${selected.length}/${MAX_COMPARE_PRODUCTS})`}
                value={null}
                onChange={addProduct}
                products={catalogo.filter((p) => !selected.some((s) => String(s._id) === String(p._id)))}
                disabled={false}
                placeholder="Seleccionar producto para agregar..."
              />
            ) : (
              <p className="text-xs text-textMuted">
                Alcanzaste el máximo de {MAX_COMPARE_PRODUCTS} productos por comparación.
              </p>
            )}

            <button
              onClick={handleCompare}
              disabled={compLoading || selected.length < 2}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {compLoading ? <Loader size={18} className="animate-spin" /> : <Scale size={18} />}
              {compLoading
                ? 'Comparando con IA...'
                : `Comparar con IA (${selected.length} producto${selected.length === 1 ? '' : 's'})`}
            </button>
          </div>

          {compLoading && (
            <div className="bg-surface rounded-xl border border-stone-800 p-10 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-textMuted text-sm animate-pulse">
                Analizando las propiedades de cada producto y armando la comparación detallada...
              </p>
            </div>
          )}

          {!compLoading && compResult && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-textLight flex-wrap">
                <Scale size={16} className="text-emerald-400" />
                <span className="font-bold">Comparación:</span>
                {compResult.productos.map((p, i) => (
                  <React.Fragment key={p._id}>
                    {i > 0 && <span className="text-textMuted">vs</span>}
                    <span className="text-textLight">{p.nombre}</span>
                  </React.Fragment>
                ))}
                {compResult.fuente === 'local' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400">
                    Sin IA — datos básicos
                  </span>
                )}
              </div>

              {/* Resumen */}
              {compResult.resumen && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-[10px] uppercase font-bold text-textMuted mb-2 flex items-center gap-1">
                    <BookOpen size={12} /> Resumen
                  </p>
                  <p className="text-sm text-textLight leading-relaxed">{compResult.resumen}</p>
                </div>
              )}

              {/* Tabla comparativa */}
              {compResult.tabla_comparativa?.length > 0 && (
                <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-800">
                    <p className="text-sm font-bold text-textLight">Tabla comparativa detallada</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-900/50 text-xs text-textMuted uppercase">
                        <tr>
                          <th className="px-4 py-3 w-1/5">Atributo</th>
                          {compResult.productos.map((p, i) => (
                            <th key={p._id} className={`px-4 py-3 whitespace-nowrap ${COL_COLORS[i % COL_COLORS.length]}`}>
                              {p.nombre}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {compResult.tabla_comparativa.map((row, i) => (
                          <tr key={i} className="hover:bg-stone-800/40">
                            <td className="px-4 py-3 font-semibold text-textLight whitespace-nowrap">{row.atributo}</td>
                            {(row.valores || []).map((v, j) => (
                              <td key={j} className="px-4 py-3 text-textMuted">{v || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Puntos fuertes y débiles */}
              {(compResult.puntos_fuertes?.length > 0 || compResult.puntos_debiles?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compResult.puntos_fuertes.map((pf, idx) => {
                    const debiles = compResult.puntos_debiles?.find((d) => d.producto === pf.producto)?.detalles || [];
                    const fuertes = pf.detalles || [];
                    if (fuertes.length === 0 && debiles.length === 0) return null;
                    return (
                      <div key={idx} className="bg-surface rounded-xl border border-stone-800 p-5">
                        <p className="text-sm font-bold text-textLight mb-3">{pf.producto}</p>
                        {fuertes.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1">
                              <ThumbsUp size={12} /> Puntos fuertes
                            </p>
                            <ul className="space-y-1.5">
                              {fuertes.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-emerald-300/90">
                                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {debiles.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-danger mb-1 flex items-center gap-1">
                              <ThumbsDown size={12} /> Puntos débiles
                            </p>
                            <ul className="space-y-1.5">
                              {debiles.map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-red-300/90">
                                  <X size={14} className="text-danger mt-0.5 shrink-0" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Relación precio-calidad */}
              {compResult.relacion_precio_calidad && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-sm font-bold text-textLight mb-2 flex items-center gap-2">
                    <Medal size={16} className="text-amber-400" /> Mejor relación precio-calidad
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded ${compResult.relacion_precio_calidad.ganador === 'empate' ? 'bg-stone-700 text-textLight' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {compResult.relacion_precio_calidad.ganador}
                    </span>
                    {compResult.relacion_precio_calidad.detalle && (
                      <p className="text-xs text-textMuted">{compResult.relacion_precio_calidad.detalle}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Para quién es cada uno */}
              {compResult.para_quien?.length > 0 && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-sm font-bold text-textLight mb-3 flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-400" /> ¿Para quién es cada uno?
                  </p>
                  <div className="space-y-2">
                    {compResult.para_quien.map((pq, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-textLight">
                          <span className="font-bold">{pq.producto}</span>
                          {pq.ideal_para && <span className="text-textMuted"> — {pq.ideal_para}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Veredicto */}
              {compResult.veredicto && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Trophy className="text-emerald-400" size={26} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Veredicto de la IA</p>
                    <p className="text-lg font-bold text-textLight">{compResult.veredicto.ganador}</p>
                    {compResult.veredicto.motivo && (
                      <p className="text-xs text-textMuted mt-1">{compResult.veredicto.motivo}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Recomendación para el vendedor */}
              {compResult.recomendacion_vendedor && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-sm font-bold text-textLight mb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" /> Recomendación para vos
                  </p>
                  <p className="text-sm text-textLight leading-relaxed">{compResult.recomendacion_vendedor}</p>
                </div>
              )}
            </div>
          )}

          {!compLoading && !compResult && (
            <div className="bg-surface rounded-xl border border-stone-800 border-dashed p-10 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Scale className="text-emerald-400" size={32} />
              </div>
              <p className="text-textLight font-bold">Compará dos productos de tu catálogo</p>
              <p className="text-textMuted text-sm max-w-md">
                Elegí dos alimentos o productos de la tienda y la IA te arma una comparación
                detallada: propiedades, ingredientes, precio, precio por kilo, puntos fuertes y
                débiles de cada uno, y un veredicto sobre cuál conviene ofrecer.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Buscador web */}
          <div className="bg-surface rounded-xl border border-stone-800 p-5 space-y-4">
            <div>
              <label className="block text-xs text-textMuted mb-1 font-medium">Producto / lo que pide el cliente</label>
              <input
                type="text"
                value={webProducto}
                onChange={(e) => setWebProducto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleWebSearch(); }}
                placeholder="Ej: Shampoo antipulgas para perros"
                className="w-full bg-background border border-stone-700 rounded-xl px-4 py-3 text-textLight focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1 font-medium">Referencia (marca, modelo o detalle que menciona el cliente)</label>
              <input
                type="text"
                value={webReferencia}
                onChange={(e) => setWebReferencia(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleWebSearch(); }}
                placeholder="Ej: marca 'Pedigree', 15 kg, para adulto"
                className="w-full bg-background border border-stone-700 rounded-xl px-4 py-3 text-textLight focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={handleWebSearch}
              disabled={webLoading}
              className="w-full bg-gradient-to-r from-primary to-primaryDark hover:from-orange-400 hover:to-primaryDark disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              {webLoading ? <Loader size={18} className="animate-spin" /> : <Globe size={18} />}
              {webLoading ? 'Buscando en internet...' : 'Buscar en internet y comparar'}
            </button>
          </div>

          {webLoading && (
            <div className="bg-surface rounded-xl border border-stone-800 p-10 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-textMuted text-sm animate-pulse">
                Buscando información actualizada en internet y armando la comparación...
              </p>
            </div>
          )}

          {!webLoading && webResult && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-textLight">
                <Globe size={16} className="text-primary" />
                <span className="font-bold">Resultados para:</span>
                <span className="text-primary italic">{webResult.producto}</span>
                {webResult.referencia && <span className="text-textMuted">({webResult.referencia})</span>}
              </div>

              {webResult.resumen && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-[10px] uppercase font-bold text-textMuted mb-2 flex items-center gap-1">
                    <BookOpen size={12} /> Resumen
                  </p>
                  <p className="text-sm text-textLight leading-relaxed">{webResult.resumen}</p>
                </div>
              )}

              {webResult.comparaciones?.length > 0 && (
                <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-800">
                    <p className="text-sm font-bold text-textLight">Comparación de opciones</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-900/50 text-xs text-textMuted uppercase">
                        <tr>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3">Marca</th>
                          <th className="px-4 py-3">Precio aprox.</th>
                          <th className="px-4 py-3">Características</th>
                          <th className="px-4 py-3">Pros</th>
                          <th className="px-4 py-3">Contras</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {webResult.comparaciones.map((c, i) => (
                          <tr key={i} className="hover:bg-stone-800/40">
                            <td className="px-4 py-3 font-semibold text-textLight">{c.producto}</td>
                            <td className="px-4 py-3 text-textMuted">{c.marca || '—'}</td>
                            <td className="px-4 py-3 font-bold text-primary whitespace-nowrap">{c.precio_aprox || '—'}</td>
                            <td className="px-4 py-3 text-textMuted">{c.caracteristicas || '—'}</td>
                            <td className="px-4 py-3 text-emerald-400">{c.pros || '—'}</td>
                            <td className="px-4 py-3 text-red-400">{c.contras || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {webResult.recomendaciones?.length > 0 && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-sm font-bold text-textLight mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" /> Recomendaciones
                  </p>
                  <div className="space-y-2">
                    {webResult.recomendaciones.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-textLight"><span className="font-bold">{r.producto}</span>
                          {r.motivo && <span className="text-textMuted"> — {r.motivo}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {webResult.notas && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-[10px] uppercase font-bold text-amber-400 mb-1">Notas para el vendedor</p>
                  <p className="text-sm text-amber-300/90">{webResult.notas}</p>
                </div>
              )}

              {webResult.fuentes?.length > 0 && (
                <div className="bg-surface rounded-xl border border-stone-800 p-5">
                  <p className="text-xs font-bold text-textMuted uppercase mb-3">Fuentes</p>
                  <div className="space-y-2">
                    {webResult.fuentes.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline">
                        <ExternalLink size={14} className="shrink-0" />
                        <span className="truncate">{f.titulo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!webLoading && !webResult && (
            <div className="bg-surface rounded-xl border border-stone-800 border-dashed p-10 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Globe className="text-primary" size={32} />
              </div>
              <p className="text-textLight font-bold">Compará con información real de internet</p>
              <p className="text-textMuted text-sm max-w-md">
                Ingresá el nombre del producto y una referencia (marca, modelo, presentación). El
                agente buscará en internet precios y alternativas en Argentina, y te armará una
                comparación con recomendaciones para vender.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Asistente;