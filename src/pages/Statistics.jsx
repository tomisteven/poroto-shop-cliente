import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Briefcase, ShoppingCart, DollarSign, TrendingUp, Package, PieChart as PieChartIcon,
  Calendar, Info, CreditCard, ArrowRightLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const SalesHeatmap = ({ data }) => {
  const navigate = useNavigate();
  const generateGrid = () => {
    // Filtrar solo los días que tienen ventas
    const activeDays = data
      .filter(item => item.total > 0)
      .map(item => {
        const dateObj = new Date(item.date + 'T12:00:00');
        return {
          ...item,
          dayName: dateObj.getDay(),
          dateObj
        };
      });

    return activeDays;
  };

  const days = generateGrid();

  const getColor = (total) => {
    if (total > 100000) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    if (total >= 50000) return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
    if (total > 20000) return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.2)]';
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
  };

  // Agrupar por meses para etiquetas (ahora basado en los días activos existentes)
  const months = [];
  days.forEach((day, i) => {
    const monthName = new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(day.dateObj);
    if (months.length === 0 || months[months.length - 1].name !== monthName) {
      months.push({ name: monthName, index: Math.floor(i / 7) });
    }
  });

  return (
    <div className="bg-surface/50 p-10 rounded-2xl border border-stone-800 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-10 gap-6">
        <div>
          <h3 className="text-2xl font-bold text-textLight flex items-center">
            <Calendar className="mr-3 text-primary" size={28} />
            Historial de Días Facturados
          </h3>
          <p className="text-textMuted text-sm mt-1">Línea de tiempo de actividad económica</p>
        </div>

        <div className="flex items-center gap-6 bg-stone-900/50 p-4 rounded-xl border border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div>
            <span className="text-[10px] text-textMuted uppercase font-semibold">&lt; 20k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]"></div>
            <span className="text-[10px] text-textMuted uppercase font-semibold">20k - 50k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]"></div>
            <span className="text-[10px] text-textMuted uppercase font-semibold">50k - 100k</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] text-textMuted uppercase font-semibold">&gt; 100k</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-8 select-none">
        <div className="flex gap-4 min-w-full py-4 px-2">
          {days.map((day, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/statistics/day/${day.date}`)}
              className={`flex-shrink-0 w-40 min-h-[180px] rounded-3xl p-5 flex flex-col transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-2xl relative overflow-hidden cursor-pointer group ${getColor(day.total)}`}
            >
              {/* Fondo decorativo */}
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={80} />
              </div>

              <div className="relative z-10 mb-2">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{day.dateObj.toLocaleDateString('es-AR', { month: 'short' })}</span>
                    <span className="text-2xl font-black">{day.dateObj.getDate()}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase py-1 px-2 bg-white/20 rounded-full">{day.dateObj.toLocaleDateString('es-AR', { weekday: 'short' })}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase opacity-60">Facturado</span>
                    <span className="text-sm font-black truncate">{formatCurrency(day.total)}</span>
                  </div>
                  <div className="flex flex-col ">
                    <span className="text-[9px] font-bold uppercase opacity-60 ">Ganancia</span>
                    <span className="text-sm font-black text-white/90 truncate">{formatCurrency(day.profit)}</span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/20 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1 opacity-70">
                        <DollarSign size={10} />
                        <span>EFE</span>
                      </div>
                      <span>{formatCurrency(day.efectivo || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1 opacity-70">
                        <CreditCard size={10} />
                        <span>TAR</span>
                      </div>
                      <span>{formatCurrency(day.tarjeta || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1 opacity-70">
                        <ArrowRightLeft size={10} />
                        <span>TRA</span>
                      </div>
                      <span>{formatCurrency(day.transferencia || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, heatmapRes] = await Promise.all([
          api.get('/reports/global-stats'),
          api.get('/reports/sales-heatmap?months=12')
        ]);
        setStats(statsRes.data);
        setHeatmap(heatmapRes.data);
      } catch (error) {
        toast.error('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div>
        <h2 className="text-3xl font-bold text-textLight">Estadísticas Generales</h2>
        <p className="text-textMuted text-sm mt-1">Visión global del negocio y rendimiento histórico</p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-2xl border border-stone-800 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-colors">
            <DollarSign size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-textMuted text-sm font-medium mb-1">Facturación Histórica</p>
            <p className="text-3xl font-bold text-textLight">{formatCurrency(stats?.ventas.facturacionTotal)}</p>
            <div className="mt-4 flex items-center text-xs text-emerald-400">
              <TrendingUp size={14} className="mr-1" />
              <span>Total acumulado</span>
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-stone-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-textMuted text-sm font-medium mb-1">Ganancia Neta Total</p>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(stats?.ventas.gananciaTotal)}</p>
            <p className="text-xs text-textMuted mt-4">Restando costo de mercadería histórica</p>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-stone-800 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="absolute -right-4 -bottom-4 text-primary/5 group-hover:text-primary/10 transition-colors">
            <ShoppingCart size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-textMuted text-sm font-medium mb-1">Ventas Realizadas</p>
            <p className="text-3xl font-bold text-textLight">{stats?.ventas.totalCount}</p>
            <p className="text-xs text-textMuted mt-4">Tickets emitidos exitosamente</p>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <SalesHeatmap data={heatmap} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Value */}
        <div className="bg-surface p-6 rounded-2xl border border-stone-800 shadow-lg">
          <h3 className="text-xl font-bold text-textLight mb-6 flex items-center">
            <Package className="mr-2 text-primary" size={20} />
            Valor del Inventario
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-stone-800/30 rounded-xl border border-stone-700/50">
              <div>
                <p className="text-textMuted text-sm">Valor a Precio de Costo</p>
                <p className="text-2xl font-bold text-textLight">{formatCurrency(stats?.productos.valorCoste)}</p>
              </div>
              <div className="w-12 h-12 bg-stone-700/50 rounded-full flex items-center justify-center text-stone-400">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div>
                <p className="text-primary text-sm font-medium">Valor Potencial de Venta</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats?.productos.valorVenta)}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              <p className="text-emerald-500 text-sm font-medium">Margen Potencial Total</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(stats?.productos.valorVenta - stats?.productos.valorCoste)}
                <span className="text-sm font-normal text-emerald-400/60 ml-2">
                  ({((stats?.productos.valorVenta - stats?.productos.valorCoste) / stats?.productos.valorVenta * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-surface p-6 rounded-2xl border border-stone-800 shadow-lg flex flex-col">
          <h3 className="text-xl font-bold text-textLight mb-4 flex items-center">
            <PieChartIcon className="mr-2 text-amber-500" size={20} />
            Inversión por Categoría
          </h3>
          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <PieChart>
                <Pie
                  data={stats?.productos.breakdown}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="valorCoste"
                  nameKey="nombre"
                >
                  {stats?.productos.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-surface rounded-2xl border border-stone-800 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-stone-800 bg-stone-800/20">
          <h3 className="text-xl font-bold text-textLight flex items-center">
            <Briefcase className="mr-2 text-primary" size={20} />
            Detalle de Inversión por Categoría
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
              <tr>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Variedad (SKUs)</th>
                <th className="px-6 py-4 text-center">Stock Físico</th>
                <th className="px-6 py-4 text-right">Valor de Inversión (Costo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {stats?.productos.breakdown.map((c, i) => (
                <tr key={i} className="hover:bg-stone-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    {c.nombre}
                  </td>
                  <td className="px-6 py-4 text-center">{c.count} prod.</td>
                  <td className="px-6 py-4 text-center">{c.stockTotal.toFixed(1)} uds.</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(c.valorCoste)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-stone-900/40 font-bold border-t border-stone-700">
              <tr>
                <td className="px-6 py-4">TOTAL</td>
                <td className="px-6 py-4 text-center">{stats?.productos.total} prod.</td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-right text-lg text-primary">{formatCurrency(stats?.productos.valorCoste)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
