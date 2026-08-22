import React, { useState, useCallback } from 'react';
import api from '../api/axios';
import {
  Bot, Package, DollarSign, Users, TrendingUp, Sparkles, Loader,
  RefreshCw, AlertTriangle, Clock, Trash2, ChevronDown, ChevronUp,
  ExternalLink
} from 'lucide-react';

const TABS = [
  { key: 'restock', label: 'Re-stock', icon: Package, endpoint: '/ai-features/restock', color: '#F59E0B' },
  { key: 'precios', label: 'Precios', icon: DollarSign, endpoint: '/ai-features/precios', color: '#3B82F6' },
  { key: 'clientes', label: 'Clientes', icon: Users, endpoint: '/ai-features/clientes-inactivos', color: '#10B981' },
  { key: 'tendencias', label: 'Tendencias', icon: TrendingUp, endpoint: '/ai-features/tendencias', color: '#8B5CF6' },
  { key: 'promos', label: 'Promos IA', icon: Sparkles, endpoint: '/ai-features/promociones-ia', color: '#EC4899' },
];

export default function AIHub() {
  const [activeTab, setActiveTab] = useState('restock');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [_creatingComboId, setCreatingComboId] = useState(null);

  const fetchData = useCallback(async (tabKey) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const tab = TABS.find(t => t.key === tabKey);
      const res = await api.get(tab.endpoint);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al obtener datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/ai-features-history');
      setHistory(res.data.items || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadFromHistory = async (item) => {
    if (item.resultado) {
      setData(item.resultado);
      setActiveTab(item.tipo);
      setShowHistory(false);
    } else {
      // Cargar detalle completo si no vino en la lista
      try {
        const res = await api.get(`/ai-features-history/${item._id}`);
        setData(res.data.resultado);
        setActiveTab(res.data.tipo);
        setShowHistory(false);
      } catch {
        alert('No se pudo cargar el análisis');
      }
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      await api.delete(`/ai-features-history/${id}`);
      setHistory(prev => prev.filter(h => h._id !== id));
    } catch { /* ignore */ }
  };

  const handleCrearCombo = async (promo, idx) => {
    setCreatingComboId(idx);
    try {
      const items = promo.productos.map(p => ({
        producto: typeof p === 'string' ? p : p.id,
        cantidad: typeof p === 'object' ? (p.cantidad || 1) : 1,
      }));
      const res = await api.post('/ai-features/crear-combo', {
        nombre: promo.nombre,
        descripcion: promo.descripcion,
        items,
        descuentoPorcentaje: promo.descuentoPorcentaje,
      });
      alert(`✅ Combo creado: ${res.data.combo.nombre}\nMargen: ${res.data.stats.margenPorcentaje}% | Ganancia: $${res.data.stats.gananciaUnitaria.toLocaleString('es-AR')}`);
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingComboId(null);
    }
  };

  const getRelativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    const days = Math.floor(hrs / 24);
    return days + 'd';
  };

  const toggleExpand = (key) => {
    setExpandedItem(prev => prev === key ? null : key);
  };

  const renderRestock = (d) => {
    const { stockData, totalCriticos, totalProductos, ia } = d;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Total Productos</p>
            <p className="text-textLight text-2xl font-bold">{totalProductos}</p>
          </div>
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Criticos</p>
            <p className="text-amber-400 text-2xl font-bold">{totalCriticos}</p>
          </div>
        </div>

        {ia?.analisis && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Analisis de IA</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.analisis}</p>
          </div>
        )}

        {!ia?.analisis && ia?.resumen && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Analisis de IA</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.resumen}</p>
          </div>
        )}

        {stockData?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-900/50 text-textMuted text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Minimo</th>
                  <th className="px-4 py-3 text-right">Vendidos 30d</th>
                  <th className="px-4 py-3 text-right">Prom/Dia</th>
                  <th className="px-4 py-3 text-right">Dias p/Agotarse</th>
                  <th className="px-4 py-3 text-center">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {stockData.map((p, i) => {
                  const stockColor = p.stock <= p.stockMinimo
                    ? 'text-red-400'
                    : p.diasHasta <= 7
                      ? 'text-amber-400'
                      : 'text-textLight';
                  const accionBadge = p.necesitaReponer
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400';
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 text-textLight">{p.nombre}</td>
                      <td className="px-4 py-3 text-textMuted">{p.sku || '-'}</td>
                      <td className={`px-4 py-3 text-right font-bold ${stockColor}`}>{p.stock}</td>
                      <td className="px-4 py-3 text-right text-textMuted">{p.stockMinimo}</td>
                      <td className="px-4 py-3 text-right text-textLight">{p.vendidos30d}</td>
                      <td className="px-4 py-3 text-right text-textMuted">{p.promedioDiario}</td>
                      <td className={`px-4 py-3 text-right font-medium ${stockColor}`}>{p.diasHasta}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${accionBadge}`}>
                          {p.necesitaReponer ? 'Reponer' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {ia?.productos?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-3">Sugerencias de Re-stock</h4>
            <div className="space-y-2">
              {ia.productos.map((item, i) => {
                if (typeof item === 'string') {
                  return (
                    <div key={i} className="flex items-start gap-3 bg-background rounded-lg p-3 border border-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <p className="text-sm text-textLight">{item}</p>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex items-start gap-3 bg-background rounded-lg p-3 border border-stone-700">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${
                      item.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                      item.prioridad === 'media' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>{item.prioridad || '-'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textLight">{item.nombre || item.producto || 'Producto'}</p>
                      {item.cantidadSugerida && <p className="text-xs text-textMuted">Sugerido: {item.cantidadSugerida} unidades</p>}
                      {item.motivo && <p className="text-xs text-textMuted mt-1">{item.motivo}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ia?.proveedores?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-3">Proveedores prioritarios</h4>
            <div className="space-y-2">
              {ia.proveedores.map((prov, i) => {
                if (typeof prov === 'string') {
                  return (
                    <div key={i} className="flex items-center gap-3 bg-background rounded-lg p-3 border border-stone-700">
                      <span className="px-2 py-0.5 rounded text-xs font-bold shrink-0 bg-emerald-500/20 text-emerald-400">info</span>
                      <p className="text-sm text-textLight">{prov}</p>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex items-center gap-3 bg-background rounded-lg p-3 border border-stone-700">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${
                      prov.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                      prov.prioridad === 'media' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>{prov.prioridad || '-'}</span>
                    <div>
                      <p className="text-sm font-medium text-textLight">{prov.nombre}</p>
                      {prov.productos?.length > 0 && (
                        <p className="text-xs text-textMuted">{prov.productos.join(', ')}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPrecios = (d) => {
    const { productos, ia } = d;
    const iaProductos = ia?.productos || [];
    const merged = productos?.map((p) => {
      const iaMatch = iaProductos.find((x) => x.nombre === p.nombre || x.id === p.id);
      return { ...p, ...iaMatch, miPrecio: iaMatch?.miPrecio || p.precioVenta };
    }) || [];
    const needAttention = merged.filter((p) => p.estado && p.estado !== 'competitivo').length;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Productos Analizados</p>
            <p className="text-textLight text-2xl font-bold">{merged.length}</p>
          </div>
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Necesitan Atencion</p>
            <p className="text-amber-400 text-2xl font-bold">{needAttention}</p>
          </div>
        </div>

        {ia?.resumen && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Analisis de IA</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.resumen}</p>
          </div>
        )}

        {merged.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-900/50 text-textMuted text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-right">Mi Precio</th>
                  <th className="px-4 py-3 text-right">Precio Ref.</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">Sugerencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {merged.map((p, i) => {
                  const estadoBadge = p.estado === 'competitivo'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : p.estado === 'alto'
                      ? 'bg-red-500/20 text-red-400'
                      : p.estado === 'bajo'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-stone-500/20 text-stone-400';
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 text-textLight">{p.nombre}</td>
                      <td className="px-4 py-3 text-right text-textLight">${p.miPrecio}</td>
                      <td className="px-4 py-3 text-right text-textMuted">{p.precioReferencia || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${estadoBadge}`}>{p.estado || 'sin datos'}</span>
                      </td>
                      <td className="px-4 py-3 text-textMuted text-xs">{p.sugerencia || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {ia?.recomendacionesGenerales && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-3">Recomendaciones Generales</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.recomendacionesGenerales}</p>
          </div>
        )}
      </div>
    );
  };

  const renderClientes = (d) => {
    const { clientes, totalClientes, totalInactivos, ia } = d;
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Total Clientes</p>
            <p className="text-textLight text-2xl font-bold">{totalClientes}</p>
          </div>
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Inactivos</p>
            <p className="text-amber-400 text-2xl font-bold">{totalInactivos}</p>
          </div>
        </div>

        {ia?.resumen && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Analisis de IA</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.resumen}</p>
          </div>
        )}

        {clientes?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-900/50 text-textMuted text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Telefono</th>
                  <th className="px-4 py-3 text-right">Compras</th>
                  <th className="px-4 py-3 text-right">Total Gastado</th>
                  <th className="px-4 py-3 text-left">Ultima Compra</th>
                  <th className="px-4 py-3 text-right">Dias Inactivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {clientes.map((c, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-textLight">{c.nombre}</td>
                    <td className="px-4 py-3 text-textMuted">{c.telefono || '-'}</td>
                    <td className="px-4 py-3 text-right text-textLight">{c.totalCompras}</td>
                    <td className="px-4 py-3 text-right text-textLight">${c.totalGastado}</td>
                    <td className="px-4 py-3 text-textMuted">{c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('es-AR') : '-'}</td>
                    <td className="px-4 py-3 text-right text-textLight">{c.diasSinComprar ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ia?.clientes?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-3">Estrategias de Reactivacion</h4>
            <div className="space-y-3">
              {ia.clientes.map((c, i) => {
                const nivelBadge = c.nivel === 'alto'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : c.nivel === 'medio'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400';
                const key = c._id || i;
                const isExpanded = expandedItem === key;
                return (
                  <div key={key} className="bg-background rounded-lg border border-stone-700">
                    <button
                      onClick={() => toggleExpand(key)}
                      className="w-full flex items-center justify-between p-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-textLight font-medium text-sm">{c.nombre || c.cliente}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${nivelBadge}`}>{c.nivel}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-textMuted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-textMuted" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        <p className="text-sm text-textLight">{c.estrategia}</p>
                        {c.mensajeWhatsApp && (
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(c.mensajeWhatsApp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ia?.estrategiasGenerales?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-3">Estrategias Generales</h4>
            <ul className="space-y-1">
              {ia.estrategiasGenerales.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                  <span className="text-emerald-400 mt-0.5">-</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderTendencias = (d) => {
    const { categoriasActuales, totalProductos, ia } = d;
    const tendencias = ia?.tendencias || [];
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Categorias Actuales</p>
            <p className="text-textLight text-2xl font-bold">{categoriasActuales}</p>
          </div>
          <div className="bg-background rounded-xl border border-stone-700 p-4">
            <p className="text-textMuted text-xs mb-1">Total Productos</p>
            <p className="text-textLight text-2xl font-bold">{totalProductos}</p>
          </div>
        </div>

        {ia?.resumen && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Analisis de IA</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.resumen}</p>
          </div>
        )}

        {tendencias.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tendencias.map((t, i) => {
              const relevanciaBadge = t.relevancia === 'alta'
                ? 'bg-emerald-500/20 text-emerald-400'
                : t.relevancia === 'media'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400';
              return (
                <div key={i} className="bg-surface rounded-xl border border-stone-800 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-textLight font-medium">{t.tendencia || t.nombre || 'Tendencia'}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${relevanciaBadge}`}>{t.relevancia}</span>
                  </div>
                  <p className="text-textMuted text-sm mb-3">{t.descripcion}</p>
                  {t.productosRecomendados?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {t.productosRecomendados.map((prod, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs">
                          {prod}
                        </span>
                      ))}
                    </div>
                  )}
                  {t.categoriaSugerida && (
                    <p className="text-textMuted text-xs">Categoria sugerida: <span className="text-purple-400 font-medium">{t.categoriaSugerida}</span></p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ia?.accionesConcretas?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-3">Acciones Concretas</h4>
            <ul className="space-y-1">
              {ia.accionesConcretas.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                  <span className="text-purple-400 mt-0.5">-</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
const renderPromos = (d) => {
    const { ia } = d;
    const promociones = ia?.promociones || [];

    return (
      <div className="space-y-5">
        {ia?.resumen && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Analisis de IA</h4>
            <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.resumen}</p>
          </div>
        )}

        {promociones.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promociones.map((promo, i) => {
              const tipoBadge = promo.tipo === 'descuento'
                ? 'bg-pink-500/20 text-pink-400'
                : promo.tipo === 'combo'
                  ? 'bg-blue-500/20 text-blue-400'
                  : promo.tipo === '2x1'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-stone-500/20 text-stone-400';
              const isCreating = _creatingComboId === i;
              return (
                <div key={i} className="bg-surface rounded-xl border border-stone-800 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-textLight font-medium">{promo.nombre}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${tipoBadge}`}>{promo.tipo}</span>
                  </div>
                  <p className="text-textMuted text-sm mb-3">{promo.descripcion}</p>

                  {promo.productos?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-textMuted text-xs font-bold uppercase tracking-wide mb-1">Productos</p>
                      <ul className="space-y-0.5">
                        {promo.productos.map((pid, j) => {
                          const nombre = typeof pid === 'string' ? pid : (pid.nombre || pid.id);
                          const cat = typeof pid === 'object' ? (pid.categoria || '') : '';
                          return (
                            <li key={j} className="flex items-center gap-1 text-xs text-textLight">
                              <span className="text-blue-400">-</span>
                              {nombre} {cat && <span className="text-textMuted">({cat})</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {promo.descuentoPorcentaje && (
                    <p className="text-textMuted text-xs mb-1">Descuento: <span className="text-pink-400 font-bold">{promo.descuentoPorcentaje}%</span></p>
                  )}
                  {promo.motivo && (
                    <p className="text-textMuted text-xs mb-1">Motivo: <span className="text-textLight">{promo.motivo}</span></p>
                  )}
                  {promo.impactoEsperado && (
                    <p className="text-textMuted text-xs mb-2">Impacto esperado: <span className="text-emerald-400 font-medium">{promo.impactoEsperado}</span></p>
                  )}

                  {promo.tipo === 'combo' && (
                    <div className="border-t border-stone-700 pt-3 mt-2 space-y-1">
                      <p className="text-textMuted text-xs font-bold uppercase tracking-wide mb-1">Stats estimados</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-background rounded-lg p-2">
                          <span className="text-textMuted">Precio lista</span>
                          <div className="text-textLight font-bold">{promo.productos.reduce((s, p) => s + (typeof p === 'object' ? (p.precioVenta || 0) * (p.cantidad || 1) : 0), 0).toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</div>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <span className="text-textMuted">Con descuento</span>
                          <div className="text-pink-400 font-bold">~{promo.descuentoPorcentaje ? (promo.productos.reduce((s, p) => s + (typeof p === 'object' ? (p.precioVenta || 0) * (p.cantidad || 1) : 0), 0) * (1 - promo.descuentoPorcentaje/100)).toLocaleString('es-AR', {style:'currency', currency:'ARS'}) : 'N/A'}</div>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <span className="text-textMuted">Costo est.</span>
                          <div className="text-textLight font-bold">{promo.productos.reduce((s, p) => s + (typeof p === 'object' ? (p.precioCompra || 0) * (p.cantidad || 1) : 0), 0).toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</div>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <span className="text-textMuted">Margen est.</span>
                          <div className="text-emerald-400 font-bold">~{promo.descuentoPorcentaje && promo.productos.length ? Math.round(((promo.productos.reduce((s, p) => s + (typeof p === 'object' ? (p.precioVenta || 0) * (p.cantidad || 1) : 0), 0) * (1 - promo.descuentoPorcentaje/100)) - promo.productos.reduce((s, p) => s + (typeof p === 'object' ? (p.precioCompra || 0) * (p.cantidad || 1) : 0), 0)) / (promo.productos.reduce((s, p) => s + (typeof p === 'object' ? (p.precioVenta || 0) * (p.cantidad || 1) : 0), 0) * (1 - promo.descuentoPorcentaje/100)) * 100) : 0}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {promo.tipo === 'combo' && (
                    <button
                      onClick={() => handleCrearCombo(promo, i)}
                      disabled={isCreating}
                      className="w-full mt-3 flex items-center justify-center gap-2 bg-primary hover:bg-primaryDark disabled:bg-primary/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isCreating ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4" />
                          Crear Combo Real
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ia?.fuentes?.length > 0 && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <h4 className="text-textLight font-medium text-sm mb-2">Fuentes</h4>
            <ul className="space-y-1">
              {ia.fuentes.map((f, i) => (
                <li key={i} className="text-xs text-textMuted">{f.titulo || f.url || JSON.stringify(f)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-textMuted text-sm">Analizando datos...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <p className="text-red-400 font-medium mb-2">Error</p>
          <p className="text-textMuted text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchData(activeTab)}
            className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Bot className="w-12 h-12 text-textMuted mb-4 opacity-50" />
          <p className="text-textMuted text-sm">Presiona 'Analizar' para obtener resultados</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'restock': return renderRestock(data);
      case 'precios': return renderPrecios(data);
      case 'clientes': return renderClientes(data);
      case 'tendencias': return renderTendencias(data);
      case 'promos': return renderPromos(data);
      default: return null;
    }
  };

  const historyFilterTabs = ['todos', 'restock', 'precios', 'clientes', 'tendencias', 'promos'];
  const [historyFilter, setHistoryFilter] = useState('todos');

  const filteredHistory = historyFilter === 'todos'
    ? history
    : history.filter(h => h.tipo === historyFilter);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-textLight text-2xl font-bold">Centro de IA</h1>
              <p className="text-textMuted text-sm">Herramientas inteligentes para tu negocio</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchHistory();
            }}
            className="flex items-center gap-2 bg-surface border border-stone-800 text-textMuted hover:text-textLight hover:border-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Clock className="w-4 h-4" />
            Historial
          </button>
        </div>

        {showHistory && (
          <div className="bg-surface rounded-xl border border-stone-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-textLight font-medium">Historial de Analisis</h3>
              <button onClick={() => setShowHistory(false)} className="text-textMuted hover:text-textLight">
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {historyFilterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setHistoryFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    historyFilter === tab
                      ? 'bg-primary text-white'
                      : 'bg-background text-textMuted hover:text-textLight border border-stone-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <p className="text-textMuted text-sm text-center py-8">No hay analisis guardados</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredHistory.map((item) => {
                  const tab = TABS.find(t => t.key === item.tipo);
                  const Icon = tab?.icon || Bot;
                  return (
                    <div key={item._id} className="flex items-center gap-3 bg-background rounded-lg border border-stone-700 p-3">
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: tab?.color }} />
                      <span className={`px-2 py-0.5 rounded text-xs font-bold`} style={{ backgroundColor: (tab?.color || '#888') + '20', color: tab?.color || '#888' }}>
                        {item.tipo}
                      </span>
                      <span className="text-textLight text-sm flex-1 truncate">{item.titulo || 'Analisis'}</span>
                      <span className="text-textMuted text-xs">{getRelativeTime(item.fecha)}</span>
                      <button
                        onClick={() => loadFromHistory(item)}
                        className="text-primary hover:text-primaryDark text-xs font-medium"
                      >
                        Cargar
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item._id)}
                        className="text-textMuted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'bg-surface border border-stone-800 text-textMuted hover:text-textLight hover:border-stone-700'
                }`}
                style={isActive ? { backgroundColor: tab.color } : undefined}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {renderContent()}

        <div className="flex justify-center">
          <button
            onClick={() => fetchData(activeTab)}
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Analizar
          </button>
        </div>
      </div>
    </div>
  );
}