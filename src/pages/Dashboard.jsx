import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, ShoppingCart, DollarSign, Receipt, AlertTriangle, Package,
  PackageX, ShoppingBag, Clock, ArrowRight, Sparkles, ChevronRight,
  Store, AlertCircle, Globe, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const formatNum = (val) => {
  if (val === undefined || val === null) return '0';
  return Number.isInteger(val) ? val.toLocaleString('es-AR') : Number(val).toLocaleString('es-AR', { maximumFractionDigits: 0 });
};

const now = new Date();
const greeting = () => {
  const h = now.getHours();
  if (h < 12) return 'Buenos d\u00edas';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};
const dias = ['Domingo', 'Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const fechaStr = dias[now.getDay()] + ', ' + now.getDate() + ' de ' + meses[now.getMonth()] + ' de ' + now.getFullYear();

const Card = ({ icon: Icon, label, value, sub, gradient }) => (
  <div className="group bg-surface rounded-2xl border border-stone-800/80 p-5 hover:border-stone-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/50 hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div className={'w-11 h-11 rounded-xl flex items-center justify-center ' + gradient}>
        <Icon size={20} className="text-white" />
      </div>
      {sub !== undefined && (
        <span className={'text-xs font-bold px-2 py-1 rounded-full ' + (sub >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
          {sub > 0 ? '+' : ''}{sub}
        </span>
      )}
    </div>
    <p className="text-textMuted text-xs font-medium mt-4 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-extrabold text-textLight mt-1 truncate">{value}</p>
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [withoutMovement, setWithoutMovement] = useState({ total: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resSummary, resLow, resGlobal, resWM, resSales] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/products/low-stock'),
          api.get('/reports/global-stats'),
          api.get('/products/without-movement?months=3'),
          api.get('/sales?limit=5'),
        ]);

        const chartData = (resSummary.data.ventasPorHora || []).map(item => ({
          hora: String(item._id).padStart(2, '0') + ':00',
          total: item.total,
        }));

        setSummary({ ...resSummary.data, chartData });
        setLowStock(resLow.data);
        setGlobalStats(resGlobal.data);
        setWithoutMovement(resWM.data);
        setRecentSales(resSales.data.slice(0, 5));
      } catch (error) {
        console.error('Error cargando dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleShareCatalog = () => {
    const url = window.location.origin + '/catalogo';
    navigator.clipboard.writeText(url);
    toast.success('Link del cat\u00e1logo copiado');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalProducts = globalStats && globalStats.productos ? globalStats.productos.total : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-textLight">{greeting()}!</h2>
              <p className="text-textMuted text-xs mt-0.5">{fechaStr}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/products" className="bg-white/5 hover:bg-white/10 border border-stone-700/50 text-textLight px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium">
            <Package size={16} className="mr-2 opacity-70" />
            Productos
          </Link>
          <Link to="/pos" className="bg-gradient-to-r from-primary to-primaryDark hover:from-orange-400 hover:to-primaryDark text-white px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium shadow-lg shadow-primary/20">
            <ShoppingCart size={16} className="mr-2" />
            Nueva Venta
          </Link>
          <Link to="/catalogo" target="_blank" className="bg-white/5 hover:bg-white/10 border border-stone-700/50 text-textLight px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium">
            <Globe size={16} className="mr-2 opacity-70" />
            Catalogo
          </Link>
          <button onClick={handleShareCatalog} className="bg-white/5 hover:bg-white/10 border border-stone-700/50 text-textLight px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium" title="Compartir cat\u00e1logo">
            <Share2 size={16} className="opacity-70" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          icon={DollarSign}
          label="Facturaci\u00f3n Hoy"
          value={formatCurrency(summary ? summary.facturacionHoy : 0)}
          gradient="bg-gradient-to-br from-primary to-primaryDark"
        />
        <Card
          icon={TrendingUp}
          label="Ganancia Hoy"
          value={formatCurrency(summary ? summary.gananciaHoy : 0)}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          sub={summary && summary.facturacionHoy > 0 ? Math.round((summary.gananciaHoy / summary.facturacionHoy) * 100) : 0}
        />
        <Card
          icon={Receipt}
          label="Tickets"
          value={summary ? summary.ventasHoy : 0}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
        />
        <Card
          icon={Package}
          label="Productos"
          value={formatNum(totalProducts)}
          gradient="bg-gradient-to-br from-stone-600 to-stone-800"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Store size={16} className="text-primary" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Facturaci\u00f3n del Mes</p>
          </div>
          <p className="text-xl font-bold text-textLight">{formatCurrency(summary && summary.mes ? summary.mes.facturacion : 0)}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-rose-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Ganancia del Mes</p>
          </div>
          <p className="text-xl font-bold text-textLight">{formatCurrency(summary && summary.mes ? summary.mes.ganancia : 0)}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Stock Bajo</p>
          </div>
          <p className="text-xl font-bold text-textLight">{lowStock.length}</p>
        </div>
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <PackageX size={16} className="text-rose-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Sin Movimiento</p>
          </div>
          <p className="text-xl font-bold text-textLight">{withoutMovement ? withoutMovement.total : 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-stone-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-textLight flex items-center gap-2">
              <BarChart size={18} className="text-primary" />
              Ventas por Hora
            </h3>
            <span className="text-[10px] text-textMuted bg-stone-800/50 px-2 py-1 rounded-full uppercase tracking-wider">Hoy</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary ? summary.chartData : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hora" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => '$' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)} />
                <RechartsTooltip
                  cursor={{ fill: '#1e293b', opacity: 0.6 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', border: '1px solid #334155', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                  formatter={(value) => [formatCurrency(value), 'Ventas']}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-stone-800/80 p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
              <button
                onClick={() => setActiveTab('top')}
                className={'text-xs font-bold px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'top' ? 'bg-primary/15 text-primary' : 'text-textMuted hover:text-textLight')}
              >
                Top Productos
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={'text-xs font-bold px-3 py-1.5 rounded-lg transition-all ' + (activeTab === 'stock' ? 'bg-amber-500/15 text-amber-400' : 'text-textMuted hover:text-textLight')}
              >
                Stock Bajo
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {activeTab === 'top' ? (
                summary && summary.topProducts && summary.topProducts.length > 0 ? (
                  summary.topProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold ' + (idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-stone-400/20 text-stone-300' : idx === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-stone-800 text-textMuted')}>
                          {idx + 1}
                        </div>
                        <p className="text-sm font-medium text-textLight truncate max-w-[140px]">{p.nombre}</p>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{p.cantidad} und.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-textMuted text-sm text-center py-6">Sin ventas hoy</p>
                )
              ) : (
                lowStock.length > 0 ? (
                  lowStock.slice(0, 6).map((p) => (
                    <div key={p._id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-800/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={'w-7 h-7 rounded-lg flex items-center justify-center ' + (p.stock === 0 ? 'bg-red-500/15' : 'bg-amber-500/15')}>
                          <AlertCircle size={14} className={p.stock === 0 ? 'text-red-400' : 'text-amber-400'} />
                        </div>
                        <p className="text-sm text-textLight truncate max-w-[140px]">{p.nombre}</p>
                      </div>
                      <span className={'text-xs font-bold px-2 py-1 rounded-md ' + (p.stock === 0 ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400')}>
                        {p.stock} {p.unidadMedida === 'unidad' ? 'u.' : p.unidadMedida}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-textMuted text-sm text-center py-6">Stock en orden</p>
                )
              )}
            </div>
            <Link to={activeTab === 'top' ? '/rventas' : '/products'} className="mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors pt-2 border-t border-stone-800/50">
              Ver m\u00e1s <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {recentSales.length > 0 && (
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-textLight flex items-center gap-2">
              <Clock size={16} className="text-stone-400" />
              \u00daltimas Ventas
            </h3>
            <Link to="/sales" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-textMuted text-[10px] uppercase tracking-wider border-b border-stone-800">
                  <th className="text-left pb-3 font-medium">Ticket</th>
                  <th className="text-left pb-3 font-medium">Cliente</th>
                  <th className="text-right pb-3 font-medium">Total</th>
                  <th className="text-right pb-3 font-medium hidden sm:table-cell">Pago</th>
                  <th className="text-right pb-3 font-medium hidden sm:table-cell">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50">
                {recentSales.slice(0, 5).map((s) => (
                  <tr key={s._id} className="hover:bg-stone-800/20 transition-colors">
                    <td className="py-3 text-textLight font-mono text-xs">{s.numeroTicket}</td>
                    <td className="py-3 text-textLight text-sm">{s.cliente || '\u2014'}</td>
                    <td className="py-3 text-textLight font-bold text-right">{formatCurrency(s.totalFinal)}</td>
                    <td className="py-3 text-textMuted text-right hidden sm:table-cell capitalize">{s.metodoPago}</td>
                    <td className="py-3 text-textMuted text-xs text-right hidden sm:table-cell">
                      {new Date(s.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
