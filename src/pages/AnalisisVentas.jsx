import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Brain, RefreshCw, TrendingUp, AlertTriangle, Clock,
  DollarSign, Receipt, Percent, Printer, Calendar, Sparkles
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
const formatNum = (val) => (val || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });

const PERIODOS = [7, 30, 90, 180, 365];

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

export default function AnalisisVentas() {
  const [dias, setDias] = useState(90);
  const [ciclo10, setCiclo10] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fmtDate = (date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

  // Ciclo del 10 al 10: si hoy ya pasó el 10, va del 10 del mes anterior al 10 del mes actual;
  // si todavía no llegó al 10, usa el ciclo completo anterior.
  const computeCycle10 = () => {
    const hoy = new Date();
    let desde, hasta;
    if (hoy.getDate() >= 10) {
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 10);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 10, 23, 59, 59);
    } else {
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 10);
      hasta = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 10, 23, 59, 59);
    }
    return { desde: fmtDate(desde), hasta: fmtDate(hasta) };
  };

  const runAnalysis = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = opts.desde && opts.hasta ? { desde: opts.desde, hasta: opts.hasta } : { dias: opts.dias || 90 };
      const res = await api.get('/ai-features/analisis-ventas', { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar el análisis');
    } finally {
      setLoading(false);
    }
  }, []);

  const runCurrent = useCallback(() => {
    if (ciclo10) {
      runAnalysis(computeCycle10());
    } else {
      runAnalysis({ dias });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciclo10, dias, runAnalysis]);

  useEffect(() => {
    runCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDias = (d) => {
    setDias(d);
    setCiclo10(false);
    runAnalysis({ dias: d });
  };

  const handleCiclo10 = () => {
    setCiclo10(true);
    runAnalysis(computeCycle10());
  };

  const chartDias = (data?.diasSemana || []).map((d) => ({
    nombre: d.nombre,
    Facturación: Math.round(d.facturacion),
    Ventas: d.ventas,
    cerrado: !!d.cerrado,
  }));

  const diasCerrados = data?.diasCerrados || [];

  const chartHoras = (data?.horas || []).map((h) => ({
    hora: String(h.hora).padStart(2, '0') + ':00',
    Facturación: Math.round(h.facturacion),
  }));

  const kpi = data?.resumen || {};
  const ia = data?.ia || {};

  return (
    <div className="min-h-screen bg-background p-6 print:p-0">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-textLight text-2xl font-bold">Análisis de Ventas</h1>
              <p className="text-textMuted text-sm">Reporte completo con inteligencia artificial</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-surface rounded-xl border border-stone-800 p-1">
              {PERIODOS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleDias(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    !ciclo10 && dias === p ? 'bg-primary text-white' : 'text-textMuted hover:text-textLight'
                  }`}
                >
                  {p} días
                </button>
              ))}
              <button
                onClick={handleCiclo10}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  ciclo10 ? 'bg-primary text-white' : 'text-textMuted hover:text-textLight'
                }`}
              >
                Del 10 al 10
              </button>
            </div>
            <button
              onClick={runCurrent}
              disabled={loading}
              className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Analizar de nuevo
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-surface border border-stone-800 text-textMuted hover:text-textLight hover:border-stone-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-textMuted text-sm">Procesando ventas con IA...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-400 font-medium mb-2">No se pudo generar el análisis</p>
            <p className="text-textMuted text-sm mb-4">{error}</p>
            <button
              onClick={runCurrent}
              className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        )}

        {/* Reporte */}
        {!loading && data && (
          <>
            {/* Periodo y KPIs */}
            <div className="flex items-center gap-2 text-textMuted text-xs font-medium print:hidden">
              <Calendar className="w-4 h-4" />
              {ciclo10 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">Ciclo 10 al 10</span>
              )}
              Periodo analizado: {data?.period?.desde} a {data?.period?.hasta} ({data?.period?.dias} días)
            </div>
            <div className="flex items-center gap-2 text-textMuted text-sm mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">Datos del periodo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card icon={Receipt} label="Ventas" value={formatNum(kpi.ventas)} gradient="from-primary to-primaryDark" />
              <Card icon={DollarSign} label="Facturación" value={formatCurrency(kpi.facturacion)} gradient="from-emerald-500 to-emerald-700" />
              <Card icon={TrendingUp} label="Ganancia estimada" value={formatCurrency(kpi.ganancia)} gradient="from-amber-500 to-orange-600" />
              <Card icon={Receipt} label="Ticket promedio" value={formatCurrency(kpi.ticketPromedio)} gradient="from-blue-500 to-blue-700" />
              <Card icon={Percent} label="Margen global" value={kpi.margenPct + '%'} gradient="from-purple-500 to-purple-700" />
              <Card icon={BarChart3} label="Unidades" value={formatNum(kpi.unidades)} gradient="from-pink-500 to-pink-700" />
            </div>

            {/* Análisis IA */}
            {ia?.resumen && (
              <div className="bg-surface rounded-2xl border border-stone-800/80 p-6 print:border-0">
                <h3 className="flex items-center gap-2 font-bold text-textLight mb-4">
                  <Brain className="w-5 h-5 text-primary" /> Análisis de la IA
                </h3>
                <p className="text-sm text-textLight leading-relaxed whitespace-pre-wrap">{ia.resumen}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  {ia.mejoresDias?.length > 0 && (
                    <div className="bg-background rounded-xl border border-stone-700 p-4">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">Mejores días</p>
                      <ul className="space-y-1">
                        {ia.mejoresDias.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                            <span className="text-emerald-400 mt-0.5">-</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ia.peoresDias?.length > 0 && (
                    <div className="bg-background rounded-xl border border-stone-700 p-4">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">Peores días</p>
                      <ul className="space-y-1">
                        {ia.peoresDias.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                            <span className="text-red-400 mt-0.5">-</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ia.categoriasDestacadas?.length > 0 && (
                    <div className="bg-background rounded-xl border border-stone-700 p-4">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-2">Categorías destacadas</p>
                      <ul className="space-y-1">
                        {ia.categoriasDestacadas.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                            <span className="text-purple-400 mt-0.5">-</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ia.proyeccionProximaSemana && (
                    <div className="bg-background rounded-xl border border-stone-700 p-4">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">Proyección próxima semana</p>
                      <p className="text-lg font-bold text-textLight">{formatCurrency(ia.proyeccionProximaSemana.facturacionEstimada)}</p>
                      {ia.proyeccionProximaSemana.explicacion && (
                        <p className="text-xs text-textMuted mt-1">{ia.proyeccionProximaSemana.explicacion}</p>
                      )}
                    </div>
                  )}
                </div>

                {ia.productosParaInvertir?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">Productos para invertir</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ia.productosParaInvertir.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 bg-background rounded-xl border border-stone-700 p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${
                            p.prioridad === 'alta' ? 'bg-red-500/20 text-red-400' :
                            p.prioridad === 'media' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>{p.prioridad || '-'}</span>
                          <div>
                            <p className="text-sm font-medium text-textLight">{p.nombre}</p>
                            {p.motivo && <p className="text-xs text-textMuted mt-1">{p.motivo}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ia.accionesConcretas?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Acciones concretas (próximos 7 días)</p>
                    <ul className="space-y-1">
                      {ia.accionesConcretas.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                          <span className="text-primary mt-0.5">-</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ia.riesgos?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2">Riesgos detectados</p>
                    <ul className="space-y-1">
                      {ia.riesgos.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-textLight">
                          <span className="text-red-400 mt-0.5">-</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
                <h3 className="font-bold text-textLight text-sm mb-2">Facturación por día de semana</h3>
                {diasCerrados.length > 0 && (
                  <p className="text-xs text-textMuted mb-3">
                    {diasCerrados.join(', ')}: local cerrado (no se hacen ventas)
                  </p>
                )}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartDias} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis dataKey="nombre" tick={{ fill: '#a8a29e', fontSize: 11 }} />
                    <YAxis yAxisId="izq" tick={{ fill: '#a8a29e', fontSize: 11 }} width={60} />
                    <YAxis yAxisId="der" orientation="right" tick={{ fill: '#a8a29e', fontSize: 11 }} width={40} />
                    <Tooltip
                      contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: 12 }}
                      labelStyle={{ color: '#f8fafc' }}
                      formatter={(value, name) => name === 'Facturación' ? formatCurrency(value) : formatNum(value)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#a8a29e' }} />
                    <Bar yAxisId="izq" dataKey="Facturación" radius={[6, 6, 0, 0]}>
                      {chartDias.map((d, i) => (
                        <Cell key={i} fill={d.cerrado ? '#57534e' : '#f97316'} />
                      ))}
                    </Bar>
                    <Bar yAxisId="der" dataKey="Ventas" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
                <h3 className="font-bold text-textLight text-sm mb-4">Facturación por hora</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartHoras} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis dataKey="hora" tick={{ fill: '#a8a29e', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#a8a29e', fontSize: 11 }} width={60} />
                    <Tooltip
                      contentStyle={{ background: '#1c1917', border: '1px solid #44403c', borderRadius: 12 }}
                      labelStyle={{ color: '#f8fafc' }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="Facturación" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Categorías */}
            {data?.categorias?.length > 0 && (
              <div className="bg-surface rounded-2xl border border-stone-800/80 p-5 overflow-x-auto">
                <h3 className="font-bold text-textLight text-sm mb-4">Rentabilidad por categoría</h3>
                <table className="w-full text-sm">
                  <thead className="bg-stone-900/50 text-textMuted text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Categoría</th>
                      <th className="px-4 py-3 text-right">Unidades</th>
                      <th className="px-4 py-3 text-right">Facturación</th>
                      <th className="px-4 py-3 text-right">Ganancia</th>
                      <th className="px-4 py-3 text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {data.categorias.map((c, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-textLight">{c.nombre}</td>
                        <td className="px-4 py-3 text-right text-textMuted">{formatNum(c.unidades)}</td>
                        <td className="px-4 py-3 text-right text-textLight">{formatCurrency(c.facturacion)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(c.ganancia)}</td>
                        <td className="px-4 py-3 text-right text-textLight">{c.margenPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top productos */}
            {data?.productos?.length > 0 && (
              <div className="bg-surface rounded-2xl border border-stone-800/80 p-5 overflow-x-auto">
                <h3 className="font-bold text-textLight text-sm mb-4">Productos (por facturación)</h3>
                <table className="w-full text-sm">
                  <thead className="bg-stone-900/50 text-textMuted text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-right">Unidades</th>
                      <th className="px-4 py-3 text-right">Facturación</th>
                      <th className="px-4 py-3 text-right">Ganancia</th>
                      <th className="px-4 py-3 text-right">Margen</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {data.productos.slice(0, 30).map((p) => (
                      <tr key={p.id} className={p.necesitaReponer ? 'bg-red-500/5' : ''}>
                        <td className="px-4 py-3">
                          <p className="text-textLight">{p.nombre}</p>
                          <p className="text-xs text-textMuted">{p.categoria} · SKU {p.sku || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-textMuted">{formatNum(p.unidades)}</td>
                        <td className="px-4 py-3 text-right text-textLight">{formatCurrency(p.facturacion)}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(p.ganancia)}</td>
                        <td className="px-4 py-3 text-right text-textLight">{p.margenPct}%</td>
                        <td className={'px-4 py-3 text-right font-bold ' + (p.necesitaReponer ? 'text-red-400' : 'text-textLight')}>
                          {formatNum(p.stock)}{p.necesitaReponer ? ' · reponer' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={runCurrent}
                disabled={loading}
                className="flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                Actualizar análisis ({new Date().toLocaleDateString('es-AR')})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}