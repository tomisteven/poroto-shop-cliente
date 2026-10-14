import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, ShoppingCart, DollarSign, Receipt, AlertTriangle, Package,
  PackageX, ShoppingBag, Clock, ArrowRight, Sparkles, ChevronRight,
  AlertCircle, Globe, Share2, BarChart3, Lock, X,
  Target, RefreshCw, ArrowUpRight, ArrowDownRight, Calculator, ReceiptText, Home, Wallet,
  Users, Search, Phone, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const FIXED_COSTS_MONTHLY = 1000000;
const META_FACTURACION_MENSUAL_DEFECTO = 4000000;
const META_FACTURACION_DIARIA_DEFECTO = 40000;
const META_GANANCIA_DIARIA_DEFECTO = 30000;

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const formatNum = (val) => {
  if (val === undefined || val === null) return '0';
  return Number.isInteger(val) ? val.toLocaleString('es-AR') : Number(val).toLocaleString('es-AR', { maximumFractionDigits: 0 });
};

const formatHours = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} · ${hora}`;
};

const formatTimeAgo = (iso) => {
  if (!iso) return '';
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h`;
};

const now = new Date();
const greeting = () => {
  const h = now.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};
const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const fechaStr = dias[now.getDay()] + ', ' + now.getDate() + ' de ' + meses[now.getMonth()] + ' de ' + now.getFullYear();

/* ─── Buscador rápido de clientes ─── */
const BuscadorClientesRapido = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/customers/buscar?q=${encodeURIComponent(texto)}&limit=8`);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const ir = (id) => {
    setOpen(false);
    setQ('');
    setResults([]);
    navigate(`/clientes/${id}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && results[0]) ir(results[0]._id);
        }}
        placeholder="Buscar cliente rápido (nombre o teléfono)..."
        className="w-full bg-surface border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-textLight placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
      />
      {loading && (
        <RefreshCw size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted animate-spin" />
      )}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-surface border border-stone-800 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-textMuted text-center">Sin resultados para "{q.trim()}"</p>
          ) : (
            results.map(c => (
              <button
                key={c._id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => ir(c._id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-800/50 transition-colors text-left border-b border-stone-800/60 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-textLight truncate">{c.nombre}</p>
                  <p className="text-xs text-textMuted flex items-center gap-1">
                    <Phone size={11} /> {c.telefono || 'sin teléfono'} · {c.totalCompras || 0} compras
                    {c.ultimaCompra && ` · última ${new Date(c.ultimaCompra).toLocaleDateString('es-AR')}`}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">{formatCurrency(c.totalGastado)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Card = ({ icon: Icon, label, value, sub, gradient }) => (
  <div className="group bg-surface rounded-2xl border border-stone-800/80 p-5 hover:border-stone-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/50 hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div className={'w-11 h-11 rounded-xl flex items-center justify-center ' + gradient}>
        <Icon size={20} className="text-white" />
      </div>
      {sub !== undefined && (
        <span className={'text-xs font-bold px-2 py-1 rounded-full ' + (sub >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
          {sub > 0 ? '+' : ''}{sub}%
        </span>
      )}
    </div>
    <p className="text-textMuted text-xs font-medium mt-4 uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-extrabold text-textLight mt-1 truncate">{value}</p>
  </div>
);

const GoalMeter = ({ icon: Icon, label, value, target, gradient, barColor, subtext, pct }) => (
  <div className="bg-surface rounded-2xl border border-stone-800/80 p-5 hover:border-stone-700/80 transition-all duration-300">
    <div className="flex items-center gap-3 mb-3">
      <div className={'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ' + gradient}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider">{label}</p>
      </div>
      {target !== undefined && (
        <div className="text-right shrink-0">
          <p className="text-[10px] text-textMuted uppercase">Meta</p>
          <p className="text-sm font-bold text-textLight">{formatCurrency(target)}</p>
        </div>
      )}
    </div>
    <p className="text-2xl font-extrabold text-textLight mb-3">{value}</p>
    {pct !== undefined && (
      <>
        <div className="h-2.5 bg-stone-800 rounded-full overflow-hidden mb-2">
          <div className={'h-full rounded-full bg-gradient-to-r transition-all duration-700 ' + barColor} style={{ width: Math.min(pct || 0, 100) + '%' }} />
        </div>
        <div className="flex justify-between items-center">
          <span className={'text-xs font-bold ' + ((pct || 0) >= 100 ? 'text-emerald-400' : (pct || 0) >= 70 ? 'text-amber-400' : 'text-red-400')}>
            {(pct || 0).toFixed(0)}%
          </span>
          <span className="text-[10px] text-textMuted">{subtext}</span>
        </div>
      </>
    )}
    {pct === undefined && (
      <p className="text-xs text-textMuted">{subtext}</p>
    )}
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [withoutMovement, setWithoutMovement] = useState({ total: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [showRecentSales, setShowRecentSales] = useState(true);
  const [refreshingSales, setRefreshingSales] = useState(false);
  const [unreadOrders, setUnreadOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top');
  const [showCashClose, setShowCashClose] = useState(false);
  const [cashClose, setCashClose] = useState(null);
  const [loadingCashClose, setLoadingCashClose] = useState(false);
  const [dashboardExtra, setDashboardExtra] = useState(null);
  const [metaDiaria, setMetaDiaria] = useState(META_FACTURACION_DIARIA_DEFECTO);
  const [metaMensual, setMetaMensual] = useState(META_FACTURACION_MENSUAL_DEFECTO);
  const [metaGananciaDiaria, setMetaGananciaDiaria] = useState(META_GANANCIA_DIARIA_DEFECTO);

  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoMotivo, setGastoMotivo] = useState('');
  const [gastoCategoria, setGastoCategoria] = useState('caja');
  const [savingGasto, setSavingGasto] = useState(false);

  const [calcMonto, setCalcMonto] = useState('');
  const [calcPct, setCalcPct] = useState('');

  const fetchMain = async () => {
    try {
      const [resSummary, resLow, resGlobal, resWM, resSales] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/products/low-stock'),
        api.get('/reports/global-stats'),
        api.get('/products/without-movement?months=3'),
        api.get('/reports/latest-sales?limit=5'),
      ]);

      const chartData = (resSummary.data.ventasPorHora || []).map(item => ({
        hora: String(item._id).padStart(2, '0') + ':00',
        total: item.total,
      }));

      setSummary({ ...resSummary.data, chartData });
      setLowStock(resLow.data);
      setGlobalStats(resGlobal.data);
      setWithoutMovement(resWM.data);
      setRecentSales(Array.isArray(resSales.data) ? resSales.data : []);
    } catch (error) {
      console.error('Error cargando dashboard', error);
    }
  };

  const fetchExtra = async () => {
    try {
      const resExtra = await api.get('/reports/dashboard-extra');
      setDashboardExtra(resExtra.data);
    } catch (error) {
      console.error('Error cargando dashboard-extra', error);
    }
  };

  useEffect(() => {
    api.get('/system-config')
      .then(res => {
        const c = res.data?.config;
        if (c) {
          setMetaDiaria(c.metaFacturacionDiaria || META_FACTURACION_DIARIA_DEFECTO);
          setMetaMensual(c.metaFacturacionMensual || META_FACTURACION_MENSUAL_DEFECTO);
          setMetaGananciaDiaria(c.metaGananciaDiaria || META_GANANCIA_DIARIA_DEFECTO);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      await fetchMain();
      setLoading(false);
      await fetchExtra();
    };
    fetchAll();
    // refresca las ultimas ventas cada 60s para que aparezcan sin recargar
    const intervalo = setInterval(() => fetchMain(), 60000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    // revisa pedidos nuevos del catálogo cada 15 segundos
    cargarPedidosNuevos();
    const t = setInterval(cargarPedidosNuevos, 15000);
    return () => clearInterval(t);
  }, []);

  const handleShareCatalog = () => {
    const url = window.location.origin + '/catalogo';
    navigator.clipboard.writeText(url);
    toast.success('Link del catálogo copiado');
  };

  const refreshSales = async () => {
    setRefreshingSales(true);
    try {
      const { data } = await api.get('/reports/latest-sales?limit=5');
      setRecentSales(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudieron actualizar las ventas');
    } finally {
      setRefreshingSales(false);
    }
  };

  const cargarPedidosNuevos = async () => {
    try {
      const { data } = await api.get('/orders/unread-list?limit=5');
      setUnreadOrders(Array.isArray(data) ? data : []);
    } catch {
      // silencioso: la próxima pasada reintenta
    }
  };

  const marcarPedidosLeidos = async () => {
    try {
      await Promise.all(unreadOrders.map(o => api.patch(`/orders/${o._id}/read`)));
      setUnreadOrders([]);
      toast.success('Pedidos marcados como leídos');
    } catch {
      toast.error('No se pudieron marcar los pedidos');
    }
  };

  const handleCashClose = async () => {
    setLoadingCashClose(true);
    try {
      const { data } = await api.get('/reports/cash-close');
      setCashClose(data);
      setShowCashClose(true);
    } catch {
      toast.error('Error al cargar cierre de caja');
    } finally {
      setLoadingCashClose(false);
    }
  };

  const handleSaveGasto = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(String(gastoMonto).replace(/[^\d.]/g, ''));
    if (!montoNum || montoNum <= 0) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (!gastoMotivo.trim()) {
      toast.error('Ingresá el motivo del gasto');
      return;
    }
    setSavingGasto(true);
    try {
      await api.post('/expenses', {
        descripcion: gastoMotivo.trim(),
        monto: montoNum,
        categoria: gastoCategoria,
      });
      toast.success('Gasto registrado y descontado de la facturación');
      setGastoMonto('');
      setGastoMotivo('');
      setGastoCategoria('caja');
      await fetchMain();
      await fetchExtra();
    } catch {
      toast.error('Error al registrar el gasto');
    } finally {
      setSavingGasto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalProducts = globalStats && globalStats.productos ? globalStats.productos.total : 0;
  const extra = dashboardExtra || {};
  const mes = extra.mesActual || {};
  const historico = extra.historicoMensual || [];
  const reposicion = extra.reposicionMercaderia || {};

  const facturacionMesAnterior = mes.facturacionMesAnterior || 0;
  const facturacionActual = summary && summary.mes ? summary.mes.facturacion : 0;
  const gananciaMes = summary && summary.mes ? summary.mes.ganancia : 0;
  const gananciaNeta = mes.gananciaNeta || 0;
  const gastosMes = mes.gastosTotal || 0;
  const diaDelMes = mes.diaDelMes || now.getDate();
  const diasEnMes = mes.diasEnMes || 30;

  const pctFacturacion = facturacionMesAnterior > 0 ? (facturacionActual / facturacionMesAnterior) * 100 : 0;
  const pctGastosFijos = FIXED_COSTS_MONTHLY > 0 ? (facturacionActual / FIXED_COSTS_MONTHLY) * 100 : 0;

  const pctMetaFacturacion = metaMensual > 0 ? (facturacionActual / metaMensual) * 100 : 0;
  const faltaMeta = Math.max(0, metaMensual - facturacionActual);
  const gastosFijosCubiertos = facturacionActual >= FIXED_COSTS_MONTHLY;
  const faltaGastosFijos = Math.max(0, FIXED_COSTS_MONTHLY - facturacionActual);
  const histFacturacion = globalStats && globalStats.ventas ? globalStats.ventas.facturacionTotal : 0;
  const ventasMes = summary && summary.mes ? summary.mes.ventas : 0;
  const netoMes = facturacionActual - gastosMes;

  const gastosHoy = summary ? summary.gastosHoy || 0 : 0;
  const facturacionHoy = summary ? summary.facturacionHoy || 0 : 0;
  const facturacionNetaHoy = summary ? summary.facturacionNetaHoy || 0 : 0;
  const gananciaHoy = summary ? summary.gananciaHoy || 0 : 0;

  const calcMontoNum = parseFloat(String(calcMonto).replace(/[^\d.]/g, '')) || 0;
  const calcPctNum = parseFloat(String(calcPct).replace(/[^\d.]/g, '')) || 0;
  const calcResultado = (calcMontoNum * calcPctNum) / 100;
  const calcFinal = calcMontoNum - calcResultado;

  const ticketPromedio = summary && summary.mes && summary.mes.ventas > 0
    ? summary.mes.facturacion / summary.mes.ventas
    : 0;

  return (
    <div className="space-y-6">

      {/* Aviso de pedidos nuevos del catálogo */}
      {unreadOrders.length > 0 && (
        <section className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-3.5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
                  <ShoppingBag size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-textLight">
                    {unreadOrders.length === 1
                      ? '¡Tenés 1 pedido nuevo del catálogo!'
                      : `¡Tenés ${unreadOrders.length} pedidos nuevos del catálogo!`}
                  </p>
                  <p className="text-xs text-textMuted truncate">Se actualiza automáticamente cada 15 segundos</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={marcarPedidosLeidos}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-stone-700/60 text-xs font-medium text-textLight transition-colors"
                >
                  Marcar como leídos
                </button>
                <Link
                  to="/orders"
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primaryDark text-xs font-bold text-white transition-colors"
                >
                  Ver pedidos
                </Link>
              </div>
            </div>

            <div className="space-y-1.5">
              {unreadOrders.map(o => (
                <Link
                  key={o._id}
                  to="/orders"
                  className="flex items-center gap-3 bg-surface/60 border border-stone-800/60 rounded-lg px-3 py-2 hover:border-primary/40 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-textLight font-mono">{o.numero}</span>
                  <span className="text-xs text-textLight truncate">{o.cliente && o.cliente.nombre ? o.cliente.nombre : o.clienteNombre}</span>
                  <span className="text-xs text-textMuted hidden sm:inline">{o.items.length} {o.items.length === 1 ? 'producto' : 'productos'}</span>
                  <span className="text-xs font-bold text-primary ml-auto shrink-0">{formatCurrency(o.total)}</span>
                  <span className="text-[11px] text-textMuted hidden md:inline shrink-0">{formatTimeAgo(o.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Header */}
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
        <div className="flex gap-2 flex-wrap">
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
          <button onClick={handleShareCatalog} className="bg-white/5 hover:bg-white/10 border border-stone-700/50 text-textLight px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium" title="Compartir catálogo">
            <Share2 size={16} className="opacity-70" />
          </button>
          <Link to="/analisis-ventas" target="_blank" className="bg-white/5 hover:bg-white/10 border border-stone-700/50 text-textLight px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium" title="Generar análisis de ventas con IA">
            <BarChart3 size={16} className="mr-2 text-primary" />
            Generar análisis de ventas
          </Link>
          <button
            onClick={handleCashClose}
            disabled={loadingCashClose}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all flex items-center text-sm font-medium shadow-lg shadow-emerald-500/20"
          >
            {loadingCashClose ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Lock size={16} className="mr-2" />
            )}
            Cierre de Caja
          </button>
        </div>
      </div>

      {/* Buscador rápido de clientes */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <BuscadorClientesRapido />
        <Link to="/clientes" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-700/50 text-textLight text-sm font-medium hover:border-primary hover:text-primary transition-colors shrink-0">
          <Users size={16} /> Ver todos los clientes
        </Link>
      </div>

      {/* Barras de Progreso Diarias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {(() => {
        const pctDiaria = metaDiaria > 0 ? (facturacionHoy / metaDiaria) * 100 : 0;
        const faltaDiaria = Math.max(0, metaDiaria - facturacionHoy);
        const supero = pctDiaria >= 100;
        return (
          <div className={'rounded-2xl border p-5 transition-all duration-300 ' + (supero ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-surface border-stone-800/80')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ' + (supero ? 'from-emerald-500 to-emerald-700' : 'from-primary to-primaryDark')}>
                  <Target size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-textLight uppercase tracking-wider">Meta Diaria</p>
                  <p className="text-[10px] text-textMuted">{formatCurrency(metaDiaria)} objetivo de facturación</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-textLight">{formatCurrency(facturacionHoy)}</p>
                <p className={'text-xs font-bold ' + (supero ? 'text-emerald-400' : faltaDiaria > 0 ? 'text-amber-400' : 'text-textMuted')}>
                  {supero ? '¡Superaste la meta!' : 'Falta ' + formatCurrency(faltaDiaria)}
                </p>
              </div>
            </div>
            <div className="h-4 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={'h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 ' + (supero ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : pctDiaria >= 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-orange-400')}
                style={{ width: Math.min(pctDiaria, 100) + '%' }}
              >
                {pctDiaria >= 15 && (
                  <span className="text-[10px] font-extrabold text-white drop-shadow-md">{pctDiaria.toFixed(0)}%</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-textMuted">$0</span>
              <span className={'text-xs font-extrabold ' + (supero ? 'text-emerald-400' : 'text-primary')}>
                {pctDiaria.toFixed(0)}%
              </span>
              <span className="text-[10px] text-textMuted">{formatCurrency(metaDiaria)}</span>
            </div>
          </div>
        );
      })()}

      {(() => {
        const pctGanancia = metaGananciaDiaria > 0 ? (gananciaHoy / metaGananciaDiaria) * 100 : 0;
        const faltaGanancia = Math.max(0, metaGananciaDiaria - gananciaHoy);
        const superoGanancia = pctGanancia >= 100;
        return (
          <div className={'rounded-2xl border p-5 transition-all duration-300 ' + (superoGanancia ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-surface border-stone-800/80')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ' + (superoGanancia ? 'from-emerald-500 to-emerald-700' : 'from-violet-500 to-purple-700')}>
                  <Wallet size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-textLight uppercase tracking-wider">Meta de Ganancia Diaria</p>
                  <p className="text-[10px] text-textMuted">{formatCurrency(metaGananciaDiaria)} objetivo de ganancia</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-textLight">{formatCurrency(gananciaHoy)}</p>
                <p className={'text-xs font-bold ' + (superoGanancia ? 'text-emerald-400' : faltaGanancia > 0 ? 'text-amber-400' : 'text-textMuted')}>
                  {superoGanancia ? '¡Superaste la meta!' : 'Falta ' + formatCurrency(faltaGanancia)}
                </p>
              </div>
            </div>
            <div className="h-4 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={'h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 ' + (superoGanancia ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : pctGanancia >= 70 ? 'bg-gradient-to-r from-violet-500 to-purple-400' : 'bg-gradient-to-r from-red-500 to-orange-400')}
                style={{ width: Math.min(pctGanancia, 100) + '%' }}
              >
                {pctGanancia >= 15 && (
                  <span className="text-[10px] font-extrabold text-white drop-shadow-md">{pctGanancia.toFixed(0)}%</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-textMuted">$0</span>
              <span className={'text-xs font-extrabold ' + (superoGanancia ? 'text-emerald-400' : 'text-primary')}>
                {pctGanancia.toFixed(0)}%
              </span>
              <span className="text-[10px] text-textMuted">{formatCurrency(metaGananciaDiaria)}</span>
            </div>
          </div>
        );
      })()}
      </div>

      {/* Row 1: Today's stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center">
              <DollarSign size={20} className="text-white" />
            </div>
            {summary && facturacionHoy > 0 && gastosHoy > 0 && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                -{Math.round((gastosHoy / facturacionHoy) * 100)}% gastos
              </span>
            )}
          </div>
          <p className="text-textMuted text-xs font-medium mt-4 uppercase tracking-wider">Facturacion Hoy</p>
          <p className="text-2xl font-extrabold text-textLight mt-1 truncate">{formatCurrency(facturacionHoy)}</p>
          {gastosHoy > 0 && (
            <p className="text-[10px] text-textMuted mt-1">
              - Gastos: <span className="text-danger">{formatCurrency(gastosHoy)}</span> = Neto{' '}
              <span className={'font-bold ' + (facturacionNetaHoy > 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(facturacionNetaHoy)}
              </span>
            </p>
          )}
          {gastosHoy === 0 && (
            <p className="text-[10px] text-textMuted mt-1">Sin gastos hoy</p>
          )}
        </div>
        <Card
          icon={TrendingUp}
          label="Ganancia Hoy"
          value={formatCurrency(summary ? summary.gananciaHoy : 0)}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          sub={summary && summary.facturacionHoy > 0 ? Math.round((summary.gananciaHoy / summary.facturacionHoy) * 100) : 0}
        />
        <Card
          icon={Receipt}
          label="Tickets Hoy"
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

      {/* Row 1.5: Quick actions - Gasto del dia + Calculadora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <ReceiptText size={16} className="text-red-400" />
            </div>
            <h3 className="text-sm font-bold text-textLight">Gasto del Dia</h3>
            <span className="text-[10px] text-textMuted bg-stone-800/50 px-2 py-1 rounded-full ml-auto">Se descuenta de la caja</span>
          </div>
          <form onSubmit={handleSaveGasto} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Monto ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={gastoMonto}
                  onChange={(e) => setGastoMonto(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-background border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-textLight focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-stone-600"
                />
              </div>
              <div>
                <label className="block text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Categoria</label>
                <select
                  value={gastoCategoria}
                  onChange={(e) => setGastoCategoria(e.target.value)}
                  className="w-full bg-background border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-textLight focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="caja">Caja</option>
                  <option value="otros">Otros</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="servicios">Servicios</option>
                  <option value="insumos">Insumos</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="impuestos">Impuestos</option>
                  <option value="sueldos">Sueldos</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Motivo / Razon</label>
              <input
                type="text"
                value={gastoMotivo}
                onChange={(e) => setGastoMotivo(e.target.value)}
                placeholder="Ej: comida del dia, viatico, bolsas..."
                className="w-full bg-background border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-textLight focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-stone-600"
              />
            </div>
            <button
              type="submit"
              disabled={savingGasto}
              className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingGasto ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ReceiptText size={15} />
                  Registrar Gasto
                </>
              )}
            </button>
            {gastosHoy > 0 && (
              <p className="text-[10px] text-textMuted text-center">
                Hoy ya llevas <span className="text-danger font-bold">{formatCurrency(gastosHoy)}</span> en gastos de caja
              </p>
            )}
          </form>
        </div>

        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Calculator size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-textLight">Calculadora de Porcentaje</h3>
            <span className="text-[10px] text-textMuted bg-stone-800/50 px-2 py-1 rounded-full ml-auto">Descuento rapido</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Monto ($)</label>
              <input
                type="number"
                min="0"
                value={calcMonto}
                onChange={(e) => setCalcMonto(e.target.value)}
                placeholder="100000"
                className="w-full bg-background border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-textLight focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-stone-600"
              />
            </div>
            <div>
              <label className="block text-[10px] text-textMuted uppercase tracking-wider font-bold mb-1">Porcentaje (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={calcPct}
                onChange={(e) => setCalcPct(e.target.value)}
                placeholder="15"
                className="w-full bg-background border border-stone-700 rounded-xl px-3 py-2.5 text-sm text-textLight focus:outline-none focus:ring-2 focus:ring-emerald-500/40 placeholder:text-stone-600"
              />
            </div>
          </div>
          {calcMontoNum > 0 && calcPctNum > 0 && (
            <div className="mt-4 bg-background rounded-xl p-4 border border-stone-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-textMuted">{calcPctNum}% de {formatCurrency(calcMontoNum)}</span>
                <span className="text-sm font-extrabold text-primary">{formatCurrency(calcResultado)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-textMuted">Descuento a aplicar</span>
                <span className="text-sm font-bold text-danger">-{formatCurrency(calcResultado)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-stone-700 pt-2">
                <span className="text-xs font-bold text-textLight uppercase">Precio final</span>
                <span className="text-lg font-extrabold text-emerald-400">{formatCurrency(calcFinal)}</span>
              </div>
            </div>
          )}
          {calcMontoNum === 0 && (
            <p className="text-[10px] text-textMuted mt-4 text-center">
              Ingresá un monto y un % para calcular al instante
            </p>
          )}
          {calcMontoNum > 0 && calcPctNum === 0 && (
            <p className="text-[10px] text-textMuted mt-4 text-center">
              Ingresá el porcentaje de descuento
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Monthly Goals */}
      <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Target size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-textLight uppercase tracking-wider">Metas del Mes</h3>
          <span className="text-[10px] text-textMuted bg-stone-800/50 px-2 py-1 rounded-full">
            Dia {diaDelMes} de {diasEnMes}
          </span>
          <span className={'text-[10px] px-2 py-1 rounded-full ' + (gastosFijosCubiertos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
            {gastosFijosCubiertos
              ? 'Alquiler y servicios cubiertos'
              : 'Falta ' + formatCurrency(faltaGastosFijos) + ' para alquiler y servicios'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GoalMeter
            icon={Home}
            label="Alquiler y Servicios"
            value={formatCurrency(facturacionActual)}
            target={FIXED_COSTS_MONTHLY}
            gradient="from-emerald-500 to-emerald-700"
            barColor={pctGastosFijos >= 100 ? 'from-emerald-500 to-emerald-600' : pctGastosFijos >= 70 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600'}
            pct={pctGastosFijos}
            subtext={pctGastosFijos >= 100
              ? '¡Facturacion del mes cubre los $' + (FIXED_COSTS_MONTHLY / 1000000).toFixed(0) + 'M!'
              : 'Falta ' + formatCurrency(faltaGastosFijos) + ' para cubrirlos'}
          />
          <GoalMeter
            icon={BarChart3}
            label="Facturacion Historica"
            value={formatCurrency(histFacturacion)}
            gradient="from-indigo-500 to-indigo-700"
            subtext={'Total de toda la historia del pet shop'}
          />
          <GoalMeter
            icon={ReceiptText}
            label="Ventas del Mes"
            value={ventasMes + ' ventas'}
            gradient="from-violet-500 to-violet-700"
            subtext={'Cantidad total de ventas en el mes'}
          />
          <GoalMeter
            icon={Wallet}
            label="Facturacion menos Gastos"
            value={formatCurrency(netoMes)}
            gradient={netoMes >= 0 ? 'from-emerald-500 to-emerald-700' : 'from-rose-500 to-rose-700'}
            subtext={
              'Facturacion ' + formatCurrency(facturacionActual) + ' - Gastos ' + formatCurrency(gastosMes)
            }
          />
        </div>
        <div className="mt-5 pt-4 border-t border-stone-800/60 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">Meta Facturacion del Mes ($4M)</span>
              <span className="text-[10px] text-textMuted">{formatCurrency(facturacionActual)} / {formatCurrency(metaMensual)}</span>
            </div>
            <div className="h-2 rounded-full bg-stone-800/70 overflow-hidden">
              <div
                className={'h-full rounded-full transition-all duration-700 bg-gradient-to-r ' + (pctMetaFacturacion >= 100 ? 'from-emerald-500 to-emerald-600' : pctMetaFacturacion >= 70 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600')}
                style={{ width: Math.min(100, pctMetaFacturacion) + '%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-textMuted">{pctMetaFacturacion.toFixed(0)}%</span>
              <span className="text-[10px] font-bold text-textMuted">
                {pctMetaFacturacion >= 100 ? <span className="text-emerald-400">¡Meta lograda!</span> : 'Falta ' + formatCurrency(faltaMeta)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-textMuted">
            {facturacionMesAnterior > 0 && (
              <span className="flex items-center gap-1">
                <span className={'font-bold ' + (pctFacturacion >= 100 ? 'text-emerald-400' : 'text-red-400')}>
                  {pctFacturacion >= 100 ? '+' : ''}{(pctFacturacion - 100).toFixed(0)}%
                </span>
                vs mes anterior
              </span>
            )}
            <span>Promedio diario: <span className="font-bold text-textLight">{formatCurrency(mes.promedioDiario || 0)}</span></span>
            <span className="flex items-center gap-1">
              <RefreshCw size={12} className="text-rose-400" />
              Reponer {reposicion.productosNecesitan || 0} productos ({formatCurrency(reposicion.costoTotal || 0)})
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Month summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <ReceiptText size={16} className="text-rose-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Gastos del Mes</p>
          </div>
          <p className="text-xl font-bold text-textLight">{formatCurrency(gastosMes)}</p>
          <p className="text-[10px] text-textMuted mt-1">
            {(mes.gastosPorCategoria || []).length} categorias de gasto
          </p>
        </div>
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Ganancia Neta</p>
          </div>
          <p className={'text-xl font-bold ' + (gananciaNeta >= 0 ? 'text-textLight' : 'text-red-400')}>
            {formatCurrency(gananciaNeta)}
          </p>
          <p className="text-[10px] text-textMuted mt-1">
            Bruta: {formatCurrency(gananciaMes)} · Gastos: {formatCurrency(gastosMes)}
          </p>
        </div>
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <DollarSign size={16} className="text-amber-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Ticket Promedio</p>
          </div>
          <p className="text-xl font-bold text-textLight">{formatCurrency(ticketPromedio)}</p>
          <p className="text-[10px] text-textMuted mt-1">
            {summary && summary.mes ? summary.mes.ventas : 0} ventas este mes
          </p>
        </div>
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <p className="text-textMuted text-xs font-medium uppercase tracking-wider">Stock Bajo</p>
          </div>
          <p className="text-xl font-bold text-textLight">{lowStock.length}</p>
          <p className="text-[10px] text-textMuted mt-1">
            Sin movimiento: {withoutMovement ? withoutMovement.total : 0}
          </p>
        </div>
      </div>

      {/* Row 4: Historical billing chart + quick table */}
      {historico.length > 0 && (
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-textLight flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Facturacion Historica
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] text-textMuted">Facturacion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-textMuted">Ganancia Neta</span>
              </div>
              <span className="text-[10px] text-textMuted bg-stone-800/50 px-2 py-1 rounded-full uppercase tracking-wider">12 meses</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-72 lg:h-auto lg:min-h-[288px] lg:col-span-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historico}>
                  <defs>
                    <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="nombre" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => '$' + (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)} />
                  <RechartsTooltip
                    cursor={{ fill: '#1e293b', opacity: 0.6 }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', border: '1px solid #334155', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                    labelStyle={{ color: '#94a3b8', fontSize: 12 }}
                    formatter={(value, name) => [formatCurrency(value), name === 'facturacion' ? 'Facturacion' : 'Ganancia Neta']}
                  />
                  <Area type="monotone" dataKey="facturacion" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorFacturacion)" />
                  <Area type="monotone" dataKey="gananciaNeta" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGanancia)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-background rounded-xl border border-stone-800/80 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-800 bg-stone-900/60 text-[10px] font-bold text-textMuted uppercase tracking-wider">
                Registro Mensual
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="text-textMuted text-[10px] uppercase tracking-wider">
                      <th className="text-left px-4 py-2 font-medium">Mes</th>
                      <th className="text-right px-3 py-2 font-medium">Facturacion</th>
                      <th className="text-right px-4 py-2 font-medium">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {historico.slice().reverse().map((h) => (
                      <tr key={h.mes} className={'hover:bg-stone-800/30 transition-colors ' + (h.mes === (mes.mesActualSeleccionado || historico[historico.length - 1]?.mes) ? 'bg-primary/5' : '')}>
                        <td className="px-4 py-2.5 text-xs font-bold text-textLight">{h.nombre}</td>
                        <td className="px-3 py-2.5 text-right text-xs text-textLight font-medium">{formatCurrency(h.facturacion)}</td>
                        <td className={'px-4 py-2.5 text-right text-xs font-bold ' + (h.gananciaNeta >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {formatCurrency(h.gananciaNeta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 5: Hourly chart + Top/Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-stone-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-textLight flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Ventas por Hora
            </h3>
            <span className="text-[10px] text-textMuted bg-stone-800/50 px-2 py-1 rounded-full uppercase tracking-wider">Hoy</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
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
              Ver más <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Ultimas 5 ventas (contraible) */}
      <section className="bg-surface rounded-2xl border border-stone-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecentSales(s => !s)}
            className="flex items-center gap-2 py-1 text-left flex-1 min-w-0 transition-colors"
            title={showRecentSales ? 'Contraer' : 'Expandir'}
          >
            <Clock size={16} className="text-stone-400 shrink-0" />
            <h3 className="text-base font-bold text-textLight">
              Últimas 5 ventas
              <span className="ml-2 text-xs font-normal text-textMuted">({recentSales.length})</span>
            </h3>
            {showRecentSales ? <ChevronUp size={16} className="text-stone-400 shrink-0" /> : <ChevronDown size={16} className="text-stone-400 shrink-0" />}
          </button>
          <button
            onClick={refreshSales}
            disabled={refreshingSales}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-textLight transition-colors shrink-0"
            title="Actualizar ventas"
          >
            <RefreshCw size={14} className={refreshingSales ? 'animate-spin' : ''} />
          </button>
          <Link to="/sales" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 shrink-0">
            Ver todas <ArrowRight size={12} />
          </Link>
        </div>

        {showRecentSales && (
          <div className="space-y-2 mt-2 pb-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-surface border border-stone-800/60 rounded-xl px-4 py-4 animate-pulse space-y-2">
                  <div className="h-3 w-40 rounded bg-stone-800" />
                  <div className="h-3 w-full rounded bg-stone-800" />
                  <div className="h-3 w-24 rounded bg-stone-800" />
                </div>
              ))
            ) : recentSales.length === 0 ? (
              <p className="text-sm text-textMuted py-6 text-center">Todavía no hay ventas registradas.</p>
            ) : (
              recentSales.map(v => (
                <div key={v._id} className="bg-surface border border-stone-800/60 rounded-xl px-3.5 py-2.5 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-textLight">
                      <Receipt size={13} className="text-primary" />
                      {v.numeroTicket}
                    </span>
                    <span className="text-xs text-textMuted inline-flex items-center gap-1">
                      <Clock size={11} /> {formatHours(v.fecha)}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800/60 text-textMuted capitalize">{v.metodoPago}</span>
                    {v.cliente ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-sky-400">
                        <Users size={11} className="shrink-0" />
                        <span className="truncate">{v.cliente.nombre}</span>
                        {v.cliente.telefono && <span className="text-textMuted">· {v.cliente.telefono}</span>}
                        {v.puntosGanados > 0 && <span className="text-[10px] px-1.5 py-px rounded bg-primary/15 text-primary">+{v.puntosGanados} pts</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-textMuted italic">Sin cliente asignado</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {v.items.map((i, idx) => (
                      <span key={`${i.nombre}-${idx}`} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary/90 border border-primary/15">
                        {i.nombre} <b className="text-textLight">x{i.cantidad}</b>
                        {i.esVentaSuelta && i.kilosVendidos ? <span className="text-primary/70"> ({i.kilosVendidos} kg)</span> : null}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-5 border-t border-stone-800/60 pt-2 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-textMuted">Gasto</p>
                      <p className="text-sm font-bold text-textLight">{formatCurrency(v.totalFinal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-textMuted">Costo</p>
                      <p className="text-sm text-textMuted">{formatCurrency(v.costo)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-textMuted">Ganancia</p>
                      <p className={`text-sm font-bold ${v.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {v.ganancia >= 0 ? '+' : '−'}{formatCurrency(Math.abs(v.ganancia))}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Modal Cierre de Caja */}
      {showCashClose && cashClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-stone-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <div>
                <h3 className="text-xl font-bold text-textLight flex items-center gap-2">
                  <Lock size={20} className="text-emerald-400" />
                  Cierre de Caja
                </h3>
                <p className="text-xs text-textMuted mt-1">
                  {new Date(cashClose.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setShowCashClose(false)} className="text-textMuted hover:text-textLight">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background rounded-xl p-4 border border-stone-700">
                  <p className="text-[10px] uppercase font-bold text-textMuted mb-1">Total Ventas</p>
                  <p className="text-lg font-extrabold text-textLight">{cashClose.ventas.total}</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-stone-700">
                  <p className="text-[10px] uppercase font-bold text-textMuted mb-1">Facturación</p>
                  <p className="text-lg font-extrabold text-primary">{formatCurrency(cashClose.ventas.montoTotal)}</p>
                </div>
              </div>

              <div className="bg-background rounded-xl p-4 border border-stone-700 space-y-3">
                <p className="text-xs font-bold text-textLight uppercase tracking-wider">Métodos de Pago</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textMuted">Efectivo</span>
                    <span className="text-sm font-bold text-textLight">{formatCurrency(cashClose.ventas.efectivo)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textMuted">Tarjeta</span>
                    <span className="text-sm font-bold text-textLight">{formatCurrency(cashClose.ventas.tarjeta)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-textMuted">Transferencia</span>
                    <span className="text-sm font-bold text-textLight">{formatCurrency(cashClose.ventas.transferencia)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-700 pt-2">
                    <span className="text-sm text-emerald-400 font-bold">Efectivo en Caja</span>
                    <span className="text-sm font-extrabold text-emerald-400">{formatCurrency(cashClose.ventas.efectivoEnCaja)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-xl p-4 border border-stone-700 space-y-3">
                <p className="text-xs font-bold text-textLight uppercase tracking-wider">Gastos del Día</p>
                {cashClose.gastos.porCategoria.length > 0 ? (
                  <div className="space-y-2">
                    {cashClose.gastos.porCategoria.map((g) => (
                      <div key={g._id} className="flex items-center justify-between">
                        <span className="text-sm text-textMuted capitalize">{g._id} ({g.cantidad})</span>
                        <span className="text-sm font-bold text-danger">{formatCurrency(g.total)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-stone-700 pt-2">
                      <span className="text-sm text-danger font-bold">Total Gastos</span>
                      <span className="text-sm font-extrabold text-danger">{formatCurrency(cashClose.gastos.total)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-textMuted">Sin gastos registrados</p>
                )}
              </div>

              <div className={'rounded-xl p-5 border-2 ' + (cashClose.balanceNeto >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-danger/10 border-danger/30')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-textMuted">Ganancia Bruta</span>
                  <span className={'text-sm font-bold ' + (cashClose.gananciaBruta >= 0 ? 'text-emerald-400' : 'text-danger')}>
                    {formatCurrency(cashClose.gananciaBruta)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-textMuted">- Gastos</span>
                  <span className="text-sm font-bold text-danger">{formatCurrency(cashClose.gastos.total)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-700 mt-3 pt-3">
                  <span className="text-base font-bold text-textLight">Balance Neto del Día</span>
                  <span className={'text-xl font-extrabold ' + (cashClose.balanceNeto >= 0 ? 'text-emerald-400' : 'text-danger')}>
                    {formatCurrency(cashClose.balanceNeto)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-800 rounded-b-2xl">
              <button
                onClick={() => setShowCashClose(false)}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-textLight font-bold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
