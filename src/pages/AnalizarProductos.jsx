import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import {
  BarChart3, Sparkles, TrendingUp, Package, DollarSign, Percent, Award, Receipt, RefreshCw
} from 'lucide-react';

const fmt = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
const fmtNum = (val) => (val || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });

const PERIODOS = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
  { label: '365 días', value: 365 },
  { label: 'Todo', value: null },
];

const SORTS = [
  { key: 'score', label: 'Recomendado' },
  { key: 'ganancia', label: 'Ganancia total' },
  { key: 'vendidos', label: 'Más vendidos' },
  { key: 'margen', label: 'Margen %' },
  { key: 'baratos', label: 'Más baratos' },
];

const getTier = (p) => {
  if (p.score >= 90) return { label: 'Alta', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (p.score >= 45) return { label: 'Media', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  return { label: 'Baja', cls: 'bg-stone-800 text-textMuted border-stone-700' };
};

const Card = ({ icon, label, value, sub, gradient }) => {
  const Icon = icon;
  return (
    <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-textMuted text-xs font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-extrabold text-textLight leading-snug whitespace-nowrap">{value}</p>
      {sub && <p className="text-xs text-textMuted mt-1">{sub}</p>}
    </div>
  );
};

const AnalizarProductos = () => {
  const [dias, setDias] = useState(null);
  const [cat, setCat] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [soloVentas, setSoloVentas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = dias ? { dias } : {};
      const res = await api.get('/reports/product-analysis', { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar el análisis');
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = useMemo(
    () => [...new Set((data?.products || []).map(p => p.categoria))].sort(),
    [data]
  );

  const list = useMemo(() => {
    let l = data?.products || [];
    if (cat) l = l.filter(p => p.categoria === cat);
    if (soloVentas) l = l.filter(p => p.tieneVentas);
    return l;
  }, [data, cat, soloVentas]);

  const sorted = useMemo(() => {
    const arr = [...list];
    const sorters = {
      score: (a, b) => b.score - a.score,
      ganancia: (a, b) => b.gananciaHistorica - a.gananciaHistorica,
      vendidos: (a, b) => b.volumen - a.volumen,
      margen: (a, b) => b.margenPct - a.margenPct,
      baratos: (a, b) => a.precioCompra - b.precioCompra,
    };
    return arr.sort(sorters[sortKey] || sorters.score);
  }, [list, sortKey]);

  const activos = sorted.filter(p => p.activo);
  const top = activos.slice(0, 6);
  const s = data?.summary || {};

  const razones = (p) => {
    if (p.esFraccionable) {
      const kg = fmtNum(p.kilosVendidos + p.bolsasVendidas * p.kilosPorBolsa);
      return [
        `Se vende suelto por kilo: ${fmt(p.bolsa.precioKiloEfectivo)}/kg${p.kilosPorBolsa ? ` (base ${fmt(p.bolsa.precioKiloBase)})` : ''}`,
        `Gana ${fmt(p.bolsa.gananciaPorKilo)} por kilo (${p.margenPct}% de margen)`,
        `Costo por kilo: ${fmt(p.bolsa.costoPorKilo)}`,
        `ROI del ${p.roiPct}% por kilo`,
        p.tieneVentas
          ? `Se vendieron ${kg} kg (${fmtNum(p.kilosVendidos)} kg sueltos + ${fmtNum(p.bolsasVendidas)} bolsas)`
          : 'Todavía no tiene ventas en el periodo',
      ];
    }
    const r = [
      `Gana ${fmt(p.gananciaUnitaria)} por unidad (${p.margenPct}% de margen)`,
    ];
    if (p.precioCompra > 0) {
      r.push(`ROI del ${p.roiPct}%: cada ${fmt(p.precioCompra)} que invertís te devuelve ${fmt(p.gananciaUnitaria)} netos`);
    }
    r.push(`Es barato de comprar: ${fmt(p.precioCompra)}`);
    if (p.tieneVentas) {
      r.push(`Se vendieron ${fmtNum(p.unidadesVendidas)} en el periodo (${p.tickets} veces)`);
    } else {
      r.push('Todavía no tiene ventas en el periodo');
    }
    return r;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <BarChart3 className="text-primary" size={28} />
            Analizar Productos
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Qué vender más según costo y ganancia: alto margen, baratos y con rotación
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-surface border border-stone-800 rounded-xl p-3">
        <div className="flex items-center gap-1 bg-background rounded-lg border border-stone-800 p-1">
          {PERIODOS.map(p => (
            <button
              key={p.label}
              onClick={() => setDias(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${dias === p.value ? 'bg-primary text-white' : 'text-textMuted hover:text-textLight'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          className="bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-textMuted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloVentas}
            onChange={e => setSoloVentas(e.target.checked)}
            className="w-4 h-4 rounded border-stone-600 bg-background text-primary focus:ring-primary/30"
          />
          Solo con ventas
        </label>
        <div className="flex flex-wrap items-center gap-1 ml-auto">
          <span className="text-xs text-textMuted mr-1">Ordenar:</span>
          {SORTS.map(sort => (
            <button
              key={sort.key}
              onClick={() => setSortKey(sort.key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${sortKey === sort.key ? 'bg-primary/15 text-primary border border-primary/30' : 'text-textMuted hover:text-textLight border border-stone-800'}`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-textMuted text-sm">Analizando productos y ventas...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-red-400 font-medium mb-2">No se pudo generar el análisis</p>
          <p className="text-textMuted text-sm mb-4">{error}</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card icon={Package} label="Productos" value={fmtNum(s.totalProductos)} sub={`${fmtNum(s.conVentas)} con ventas`} gradient="from-blue-500 to-blue-700" />
            <Card icon={DollarSign} label="Ingresos" value={fmt(s.ingresosPeriodo)} sub={data.periodo.dias ? `Últimos ${data.periodo.dias} días` : 'Todo el historial'} gradient="from-emerald-500 to-emerald-700" />
            <Card icon={Award} label="Ganancia" value={fmt(s.gananciaPeriodo)} gradient="from-amber-500 to-orange-600" />
            <Card icon={Percent} label="Margen global" value={`${s.margenPromedioPct}%`} gradient="from-purple-500 to-purple-700" />
            <Card icon={Receipt} label="Costo vendido" value={fmt(s.costoPeriodo)} gradient="from-pink-500 to-pink-700" />
          </div>

          {/* Recomendación */}
          {top.length > 0 && (
            <>
              <div className="flex items-center gap-3 bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="text-primary" size={22} />
                </div>
                <div>
                  <p className="font-bold text-textLight">
                    Para ganar más, impulsá estos productos
                  </p>
                  <p className="text-xs text-textMuted">
                    Combina alto margen, bajo costo de compra y buena rotación. Cuanto más barato el producto y mayor la ganancia por unidad, más conviene venderlo.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {top.map((p, i) => {
                  const t = getTier(p);
                  return (
                    <div key={p.id} className="bg-surface rounded-2xl border border-stone-800/80 p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-primary">{i + 1}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${t.cls}`}>
                          Prioridad {t.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-textLight leading-snug">{p.nombre}</h3>
                      <p className="text-xs text-textMuted mb-3">{p.categoria} · {p.sku || 'sin SKU'}</p>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-background/50 border border-stone-800 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-textMuted uppercase">{p.esFraccionable ? 'Costo /kg' : 'Costo'}</p>
                          <p className="text-sm font-bold text-textLight">{p.esFraccionable ? fmt(p.bolsa.costoPorKilo) : fmt(p.precioCompra)}</p>
                        </div>
                        <div className="bg-background/50 border border-stone-800 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-textMuted uppercase">{p.esFraccionable ? 'Precio /kg' : 'Precio'}</p>
                          <p className="text-sm font-bold text-textLight">{p.esFraccionable ? fmt(p.bolsa.precioKiloEfectivo) : fmt(p.precioVenta)}</p>
                        </div>
                        <div className="bg-background/50 border border-stone-800 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-textMuted uppercase">{p.esFraccionable ? 'Gan. /kg' : 'Ganancia'}</p>
                          <p className="text-sm font-bold text-emerald-400">{p.esFraccionable ? fmt(p.bolsa.gananciaPorKilo) : fmt(p.gananciaUnitaria)}</p>
                        </div>
                        <div className="bg-background/50 border border-stone-800 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-textMuted uppercase">ROI</p>
                          <p className="text-sm font-bold text-primary">{p.roiPct}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-textMuted flex items-center gap-1">
                          <TrendingUp size={12} className="text-emerald-400" />
                          {p.tieneVentas
                            ? `${fmtNum(p.volumen)}${p.esFraccionable ? ' kg' : ' vendidos'} · ${fmt(p.gananciaHistorica)} ganados`
                            : 'Sin ventas en el periodo'}
                        </span>
                      </div>
                      <ul className="space-y-1 mt-auto">
                        {razones(p).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-textMuted">
                            <span className="text-emerald-400 mt-0.5">-</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Tabla completa */}
          <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-textLight text-sm flex items-center gap-2">
                <Package size={16} className="text-primary" /> Todos los productos ({sorted.length})
              </h3>
              {top.length > 0 && (
                <p className="text-xs text-textMuted hidden sm:block">
                  Recomendados: <span className="text-textLight font-semibold">{top.map(p => p.nombre).slice(0, 3).join(', ')}</span>
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-textLight whitespace-nowrap">
                <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-right">Costo</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Ganancia</th>
                    <th className="px-4 py-3 text-right">Margen</th>
                    <th className="px-4 py-3 text-right">ROI</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">Vendidos</th>
                    <th className="px-4 py-3 text-right">Ganancia periodo</th>
                    <th className="px-4 py-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {sorted.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-textMuted">No hay productos para mostrar</td></tr>
                  )}
                  {sorted.map(p => {
                    const t = getTier(p);
                    return (
                      <tr key={p.id} className={`hover:bg-stone-800/40 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.nombre}</p>
                          <p className="text-xs text-textMuted">{p.esFraccionable ? `${p.categoria} · ${fmt(p.bolsa.precioKiloEfectivo)}/kg` : `${p.categoria} · ${p.sku || 'sin SKU'}`}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-textMuted">{p.esFraccionable ? `${fmt(p.bolsa.costoPorKilo)}/kg` : fmt(p.precioCompra)}</td>
                        <td className="px-4 py-3 text-right">{p.esFraccionable ? `${fmt(p.bolsa.precioKiloEfectivo)}/kg` : fmt(p.precioVenta)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{p.esFraccionable ? `${fmt(p.bolsa.gananciaPorKilo)}/kg` : fmt(p.gananciaUnitaria)}</td>
                        <td className="px-4 py-3 text-right">{p.margenPct}%</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{p.roiPct}%</td>
                        <td className="px-4 py-3 text-right font-bold">{p.stock}</td>
                        <td className="px-4 py-3 text-right text-textMuted">
                          {p.tieneVentas
                            ? p.esFraccionable
                              ? `${fmtNum(p.kilosVendidos)}kg${p.bolsasVendidas ? ` + ${fmtNum(p.bolsasVendidas)} bolsas` : ''}${p.tickets ? ` (${p.tickets}x)` : ''}`
                              : `${fmtNum(p.unidadesVendidas)}${p.tickets ? ` (${p.tickets}x)` : ''}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">{p.tieneVentas ? fmt(p.gananciaHistorica) : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${t.cls}`}>{p.score}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalizarProductos;