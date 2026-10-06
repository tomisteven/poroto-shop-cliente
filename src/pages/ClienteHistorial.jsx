import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft, Search, X, Users, Phone, Mail, MapPin, Calendar, ShoppingBag,
  Receipt, Award, ChevronDown, ChevronUp, Filter, Loader, Wallet, Package, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);
const formatNum = (v) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(v || 0);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('es-AR') : '—');
const formatDateTime = (d) => (d ? new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const METODOS = [
  { value: '', label: 'Todos los pagos' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
];

const ClienteHistorial = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('compras');

  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [page, setPage] = useState(1);
  const [openSale, setOpenSale] = useState({});

  // Debounce del buscador de productos
  useEffect(() => {
    const t = setTimeout(() => { setQ(qInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => { setPage(1); }, [startDate, endDate, metodoPago]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (q) params.set('q', q);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (metodoPago) params.set('metodoPago', metodoPago);
      const { data: res } = await api.get(`/customers/${id}/historial?${params.toString()}`);
      setData(res);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [id, page, q, startDate, endDate, metodoPago]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const limpiar = () => {
    setQInput(''); setQ(''); setStartDate(''); setEndDate(''); setMetodoPago(''); setPage(1);
  };

  const hayFiltros = !!(q || startDate || endDate || metodoPago);

  const cliente = data?.cliente;
  const resumen = data?.resumen;

  const totalGastadoTotal = useMemo(
    () => (resumen?.gastado || 0) + (resumen?.gastadoPedidosWeb || 0),
    [resumen]
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/clientes')} className="mt-1 p-2 rounded-lg border border-stone-700 text-textMuted hover:text-textLight hover:border-primary transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-textLight flex items-center gap-3">
              <Users size={26} className="text-primary" />
              {cliente?.nombre || 'Cliente'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-textMuted">
              {cliente?.telefono && <span className="flex items-center gap-1"><Phone size={12} /> {cliente.telefono}</span>}
              {cliente?.email && <span className="flex items-center gap-1"><Mail size={12} /> {cliente.email}</span>}
              {cliente?.direccion && <span className="flex items-center gap-1"><MapPin size={12} /> {cliente.direccion}</span>}
              <span className={`font-bold ${cliente?.activo ? 'text-emerald-400' : 'text-red-400'}`}>{cliente?.activo ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </div>
        <Link to="/clientes" className="px-4 py-2 rounded-lg border border-stone-700 text-textMuted hover:text-textLight hover:border-primary transition-colors text-sm font-medium">
          Volver a Clientes
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Stat icon={Wallet} label="Total gastado" value={formatCurrency(totalGastadoTotal)} accent />
        <Stat icon={Receipt} label="Compras" value={resumen?.compras ?? '—'} />
        <Stat icon={ShoppingBag} label="Pedidos online" value={resumen?.pedidosWeb ?? '—'} />
        <Stat icon={Package} label="Items" value={resumen?.items ?? '—'} />
        <Stat icon={Award} label="Puntos" value={resumen?.esAfiliado ? resumen.puntos : 'No afiliado'} />
        <Stat icon={Clock} label="Última compra" value={resumen?.ultimaCompra ? formatDate(resumen.ultimaCompra) : '—'} />
      </div>

      {resumen?.primeraCompra && (
        <p className="text-xs text-textMuted">
          Cliente desde {formatDate(resumen.primeraCompra)} · Ticket promedio {formatCurrency(resumen.ticketPromedio)}
          {resumen.gastadoPedidosWeb > 0 && ` · ${formatCurrency(resumen.gastadoPedidosWeb)} en pedidos online`}
        </p>
      )}

      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-stone-800 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-textMuted uppercase tracking-wider">
          <Filter size={14} /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              value={qInput}
              onChange={e => setQInput(e.target.value)}
              placeholder="Buscar producto comprado..."
              className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-textMuted mb-1">Desde</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-textMuted mb-1">Hasta</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-textMuted mb-1">Método de pago</label>
            <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
              className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary">
              {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        {hayFiltros && (
          <button onClick={limpiar} className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primaryDark transition-colors font-medium">
            <X size={13} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={tab === 'compras'} onClick={() => setTab('compras')} icon={Receipt}>
          Compras {data ? `(${data.total})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'productos'} onClick={() => setTab('productos')} icon={Package}>
          Productos {data?.productos ? `(${data.productos.length})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'pedidos'} onClick={() => setTab('pedidos')} icon={ShoppingBag}>
          Pedidos online {data?.pedidos ? `(${data.pedidos.length})` : ''}
        </TabBtn>
        <TabBtn active={tab === 'canjes'} onClick={() => setTab('canjes')} icon={Award}>
          Canjes {data?.canjes ? `(${data.canjes.length})` : ''}
        </TabBtn>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader size={28} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {tab === 'compras' && <ComprasTab data={data} openSale={openSale} setOpenSale={setOpenSale} />}
          {tab === 'productos' && <ProductosTab productos={data?.productos || []} />}
          {tab === 'pedidos' && <PedidosTab pedidos={data?.pedidos || []} />}
          {tab === 'canjes' && <CanjesTab canjes={data?.canjes || []} />}

          {tab === 'compras' && data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg border border-stone-700 text-sm text-textLight disabled:opacity-30 hover:border-primary transition-colors">
                Anterior
              </button>
              <span className="text-xs text-textMuted">Página {data.page} de {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg border border-stone-700 text-sm text-textLight disabled:opacity-30 hover:border-primary transition-colors">
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Tabs ─── */
const ComprasTab = ({ data, openSale, setOpenSale }) => {
  const ventas = data?.ventas || [];
  if (!ventas.length) return <Empty msg="No hay compras para estos filtros" />;
  return (
    <div className="space-y-3">
      {ventas.map(v => {
        const isOpen = openSale[v._id];
        return (
          <div key={v._id} className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
            <button
              onClick={() => setOpenSale(p => ({ ...p, [v._id]: !p[v._id] }))}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-stone-800/40 transition-colors text-left"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
                <span className="font-bold text-primary text-sm">{v.numeroTicket}</span>
                <span className="text-xs text-textMuted flex items-center gap-1"><Calendar size={12} /> {formatDateTime(v.fecha)}</span>
                <span className="text-xs text-textMuted">{v.items?.length || 0} items</span>
                {v.empleado?.nombre && <span className="text-xs text-textMuted">Atendió: {v.empleado.nombre}</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold text-textLight text-sm">{formatCurrency(v.totalFinal)}</span>
                {isOpen ? <ChevronUp size={16} className="text-textMuted" /> : <ChevronDown size={16} className="text-textMuted" />}
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-stone-800 px-4 py-3 space-y-2">
                {v.items?.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-textLight">
                      {it.nombre || it.producto?.nombre || 'Ítem'}
                      <span className="text-textMuted"> x{formatNum(it.cantidad)}{it.esVentaSuelta ? ' kg' : ''}</span>
                    </span>
                    <span className="text-textMuted">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs text-textMuted pt-2 border-t border-stone-800/60">
                  <span>Pago: {v.metodoPago}</span>
                  {v.puntosGanados > 0 && <span className="text-amber-400">+{v.puntosGanados} puntos</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ProductosTab = ({ productos }) => {
  if (!productos.length) return <Empty msg="No hay productos para estos filtros" />;
  return (
    <div className="bg-surface rounded-xl border border-stone-800 overflow-x-auto">
      <table className="w-full text-left text-sm text-textLight">
        <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3 text-center">Veces</th>
            <th className="px-4 py-3 text-center">Cantidad</th>
            <th className="px-4 py-3 text-center">Kilos</th>
            <th className="px-4 py-3 text-right">Total gastado</th>
            <th className="px-4 py-3 text-right">Última vez</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800">
          {productos.map(p => (
            <tr key={p._id || p.nombre} className="hover:bg-stone-800/40 transition-colors">
              <td className="px-4 py-3 font-medium">{p.nombre || 'Sin nombre'}</td>
              <td className="px-4 py-3 text-center">{p.veces}</td>
              <td className="px-4 py-3 text-center text-textMuted">{formatNum(p.cantidad)}</td>
              <td className="px-4 py-3 text-center text-textMuted">{p.kilos ? formatNum(p.kilos) : '—'}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.gastado)}</td>
              <td className="px-4 py-3 text-right text-textMuted text-xs">{formatDate(p.ultima)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PedidosTab = ({ pedidos }) => {
  if (!pedidos.length) return <Empty msg="No hay pedidos online para estos filtros" />;
  return (
    <div className="space-y-3">
      {pedidos.map(p => (
        <div key={p._id} className="bg-surface rounded-xl border border-stone-800 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-bold text-primary text-sm">{p.numero}</span>
              <span className="text-xs text-textMuted flex items-center gap-1"><Calendar size={12} /> {formatDateTime(p.createdAt)}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                p.estado === 'entregado' ? 'bg-emerald-500/20 text-emerald-400'
                  : p.estado === 'cancelado' ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'}`}>
                {p.estado}
              </span>
            </div>
            <span className="font-bold text-textLight text-sm">{formatCurrency(p.total)}</span>
          </div>
          <div className="mt-2 text-xs text-textMuted space-y-1">
            {p.items?.map((it, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span>{it.nombre} x{formatNum(it.cantidad)}{it.esVentaSuelta ? ' kg' : ''}</span>
                <span>{formatCurrency(it.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const CanjesTab = ({ canjes }) => {
  if (!canjes.length) return <Empty msg="No tiene canjes registrados" />;
  return (
    <div className="bg-surface rounded-xl border border-stone-800 overflow-x-auto">
      <table className="w-full text-left text-sm text-textLight">
        <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Recompensa</th>
            <th className="px-4 py-3 text-right">Puntos usados</th>
            <th className="px-4 py-3 text-right">Empleado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800">
          {canjes.map(c => (
            <tr key={c._id} className="hover:bg-stone-800/40 transition-colors">
              <td className="px-4 py-3 text-textMuted">{formatDate(c.fecha)}</td>
              <td className="px-4 py-3 font-medium">{c.recompensa?.nombre || '—'}</td>
              <td className="px-4 py-3 text-right">{c.puntosUsados}</td>
              <td className="px-4 py-3 text-right text-textMuted">{c.empleado?.nombre || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ─── Helpers visual ─── */
const Stat = ({ icon: Icon, label, value, accent }) => (
  <div className={`rounded-xl border p-4 ${accent ? 'bg-primary/10 border-primary/30' : 'bg-surface border-stone-800'}`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon size={14} className={accent ? 'text-primary' : 'text-textMuted'} />
      <span className="text-[11px] text-textMuted uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-lg font-bold text-textLight">{value}</p>
  </div>
);

const TabBtn = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
      active ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-surface border-stone-800 text-textMuted hover:text-textLight'}`}
  >
    <Icon size={14} /> {children}
  </button>
);

const Empty = ({ msg }) => (
  <div className="bg-surface rounded-xl border border-stone-800 py-12 text-center text-textMuted text-sm">{msg}</div>
);

export default ClienteHistorial;