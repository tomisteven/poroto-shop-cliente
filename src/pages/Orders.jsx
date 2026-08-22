import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  ShoppingCart, CheckCircle2, Clock, XCircle, User,
  Phone, MessageCircle, Package
} from 'lucide-react';


const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#F59E0B22', icon: Clock },
  confirmado: { label: 'Confirmado', color: '#3B82F6', bg: '#3B82F622', icon: Package },
  entregado: { label: 'Entregado', color: '#10B981', bg: '#10B98122', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: '#EF4444', bg: '#EF444422', icon: XCircle },
};

const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter) params.estado = filter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.items);
      setPages(data.pages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/estado`, { estado: newStatus });
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, estado: newStatus }));
      }
    } catch {
      alert('Error al actualizar el estado');
    }
  };

  const openDetail = async (order) => {
    setSelectedOrder(order);
    try {
      if (!order.leido) {
        await api.patch(`/orders/${order._id}/read`);
        setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, leido: true } : o));
      }
    } catch { /* ignore */ }
  };

  const openWhatsApp = async (order) => {
    const items = order.items.map((i) => `• ${i.nombre} x${i.cantidad} — ${formatCurrency(i.subtotal)}`);
    const lines = [
      `🛒 *Pedido ${order.numero}*`,
      '',
      ...items,
      '',
      `💰 *Total: ${formatCurrency(order.total)}*`,
      `📋 Estado: ${STATUS_CONFIG[order.estado]?.label || order.estado}`,
      order.notas ? `📝 Notas: ${order.notas}` : '',
    ].filter(Boolean);
    const text = lines.join('%0A');
    window.open(`https://wa.me/${order.clienteTelefono}?text=${text}`, '_blank');

    try {
      await api.patch(`/orders/${order._id}/whatsapp`);
      setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, whatsappEnviado: true } : o));
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-textLight">Pedidos del Catálogo</h1>
          <p className="text-sm text-textMuted mt-1">Pedidos recibidos desde el catálogo público</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setFilter(''); setPage(1); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!filter ? 'bg-primary text-white' : 'bg-surface border border-stone-700 text-textMuted hover:text-textLight'}`}
        >
          Todos
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              filter === key ? 'text-white' : 'bg-surface text-textMuted hover:text-textLight'
            }`}
            style={filter === key ? { backgroundColor: cfg.color, borderColor: cfg.color } : { borderColor: '#44403c33' }}
          >
            <cfg.icon size={14} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-stone-700 p-4 animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-stone-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-800 rounded w-1/4" />
                <div className="h-3 bg-stone-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={48} className="mx-auto text-stone-600 mb-4" />
          <p className="text-stone-400 text-lg">No hay pedidos{filter ? ` con estado "${STATUS_CONFIG[filter]?.label}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.estado];
            const StatusIcon = cfg?.icon || Clock;
            return (
              <div
                key={order._id}
                className={`bg-surface rounded-xl border p-4 cursor-pointer hover:bg-white/[0.03] transition-all ${
                  !order.leido ? 'border-primary/40 shadow-[0_0_12px_rgba(99,102,241,0.08)]' : 'border-stone-700'
                }`}
                onClick={() => openDetail(order)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg?.bg }}>
                    <StatusIcon size={20} style={{ color: cfg?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{order.numero}</span>
                      {!order.leido && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    </div>
                    <p className="text-sm text-textLight truncate">{order.clienteNombre} — {order.clienteTelefono}</p>
                    <p className="text-xs text-textMuted">{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-primary">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-textMuted">
                      {new Date(order.createdAt).toLocaleDateString('es-AR')} {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-surface border border-stone-700 text-sm font-bold text-textLight disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-textMuted">Página {page} de {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-4 py-2 rounded-xl bg-surface border border-stone-700 text-sm font-bold text-textLight disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-lg rounded-2xl border border-stone-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <div>
                <h3 className="text-xl font-bold text-textLight flex items-center gap-2">
                  <span className="font-mono text-primary">{selectedOrder.numero}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: STATUS_CONFIG[selectedOrder.estado]?.bg, color: STATUS_CONFIG[selectedOrder.estado]?.color }}>
                    {STATUS_CONFIG[selectedOrder.estado]?.label}
                  </span>
                </h3>
                <p className="text-xs text-textMuted mt-1">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('es-AR')} {new Date(selectedOrder.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-textMuted hover:text-textLight"><XCircle size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Cliente */}
              <div className="bg-background rounded-xl p-4 border border-stone-700">
                <p className="text-xs font-bold text-textMuted mb-2 uppercase tracking-wider">Cliente</p>
                <div className="space-y-1">
                  <p className="text-sm text-textLight font-bold flex items-center gap-2"><User size={14} /> {selectedOrder.clienteNombre}</p>
                  <p className="text-sm text-textMuted flex items-center gap-2"><Phone size={14} /> {selectedOrder.clienteTelefono}</p>
                  {selectedOrder.cliente && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                      <CheckCircle2 size={12} /> Cliente registrado — {selectedOrder.cliente.esAfiliado ? 'Afiliado' : 'No afiliado'}
                    </p>
                  )}
                  {!selectedOrder.cliente && (
                    <p className="text-xs text-amber-400 flex items-center gap-1 mt-2">
                      <User size={12} /> Cliente nuevo (no registrado)
                    </p>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="bg-background rounded-xl p-4 border border-stone-700">
                <p className="text-xs font-bold text-textMuted mb-3 uppercase tracking-wider">Productos</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-textLight">{item.nombre}</span>
                        <span className="text-textMuted ml-2">x{item.cantidad}</span>
                      </div>
                      <span className="font-bold text-primary">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-stone-700 mt-3 pt-3">
                  <span className="font-bold text-textLight">Total</span>
                  <span className="font-extrabold text-primary text-lg">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Notas */}
              {selectedOrder.notas && (
                <div className="bg-background rounded-xl p-4 border border-stone-700">
                  <p className="text-xs font-bold text-textMuted mb-2 uppercase tracking-wider">Notas del cliente</p>
                  <p className="text-sm text-textLight">{selectedOrder.notas}</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="p-6 border-t border-stone-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openWhatsApp(selectedOrder)}
                  className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle size={16} />
                  WhatsApp al cliente
                </button>
                {selectedOrder.clienteTelefono && (
                  <a
                    href={`tel:${selectedOrder.clienteTelefono}`}
                    className="py-2.5 px-4 rounded-xl bg-surface border border-stone-700 text-textLight font-bold"
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {['pendiente', 'confirmado', 'entregado', 'cancelado'].map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedOrder._id, s)}
                      disabled={selectedOrder.estado === s}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: selectedOrder.estado === s ? cfg.color : 'transparent',
                        borderColor: cfg.color,
                        color: selectedOrder.estado === s ? 'white' : cfg.color,
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
