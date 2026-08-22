import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { ShoppingCart, Plus, Check, Ban, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const OrdenesCompra = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ proveedor: '', items: [], notas: '' });

  const fetchData = useCallback(async () => {
    try {
      const [ord, sup, prod] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers?all=true'),
        api.get('/products'),
      ]);
      setOrders(ord.data);
      setSuppliers(sup.data);
      setProducts(prod.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      const payload = {
        proveedor: form.proveedor,
        items: form.items.map(i => ({
          producto: i.producto,
          cantidad: Number(i.cantidad),
          precioUnitario: Number(i.precioUnitario),
        })),
        notas: form.notas,
      };
      const { data } = await api.post('/purchase-orders', payload);
      const populated = await api.get(`/purchase-orders/${data._id}`);
      setOrders(prev => [populated.data, ...prev]);
      toast.success('Orden de compra creada');
      setModal(false);
      setForm({ proveedor: '', items: [], notas: '' });
    } catch {
      toast.error('Error al crear orden');
    }
  };

  const handleReceiveOrder = async (id) => {
    try {
      const { data } = await api.patch(`/purchase-orders/${id}/recibir`);
      setOrders(prev => prev.map(o => o._id === id ? data : o));
      toast.success('Orden recibida — stock actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleCancelOrder = async (id) => {
    try {
      const { data } = await api.patch(`/purchase-orders/${id}/cancelar`);
      setOrders(prev => prev.map(o => o._id === id ? data : o));
      toast.success('Orden cancelada');
    } catch {
      toast.error('Error al cancelar');
    }
  };

  const getStatusBadge = (estado) => {
    const styles = {
      pendiente: 'bg-amber-500/20 text-amber-400',
      recibida: 'bg-emerald-500/20 text-emerald-400',
      cancelada: 'bg-red-500/20 text-red-400',
    };
    const labels = { pendiente: 'Pendiente', recibida: 'Recibida', cancelada: 'Cancelada' };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${styles[estado]}`}>{labels[estado]}</span>;
  };

  const addOrderItem = () => {
    setForm({ ...form, items: [...form.items, { producto: '', cantidad: 1, precioUnitario: 0 }] });
  };

  const updateOrderItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx][field] = val;
    if (field === 'producto') {
      const prod = products.find(p => p._id === val);
      if (prod) items[idx].precioUnitario = prod.precioCompra;
    }
    setForm({ ...form, items });
  };

  const removeOrderItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const orderTotal = form.items?.reduce((sum, i) => sum + (Number(i.cantidad) || 0) * (Number(i.precioUnitario) || 0), 0) || 0;

  const filtered = search
    ? orders.filter(o =>
        o.numero?.toLowerCase().includes(search.toLowerCase()) ||
        o.proveedor?.nombre?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <ShoppingCart size={28} className="text-primary" />
            Órdenes de Compra
          </h1>
          <p className="text-textMuted text-sm mt-1">{orders.length} órdenes registradas</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm">
          <Plus size={18} /> Nueva Orden
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
        <input type="text" placeholder="Buscar por número o proveedor..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
      </div>

      <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-left text-sm text-textLight">
          <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
            <tr>
              <th className="px-4 py-3">N° Orden</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center w-28">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-textMuted">No hay órdenes de compra</td></tr>
            )}
            {filtered.map(o => (
              <tr key={o._id} className="hover:bg-stone-800/40 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-primary">{o.numero}</td>
                <td className="px-4 py-3 font-medium">{o.proveedor?.nombre || '—'}</td>
                <td className="px-4 py-3 text-textMuted">{new Date(o.fecha).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 text-textMuted">{o.items?.length} productos</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3 text-center">{getStatusBadge(o.estado)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {o.estado === 'pendiente' && (
                      <>
                        <button onClick={() => handleReceiveOrder(o._id)} title="Recibir"
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"><Check size={15} /></button>
                        <button onClick={() => handleCancelOrder(o._id)} title="Cancelar"
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Ban size={15} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">Nueva Orden de Compra</h3>
              <button onClick={() => setModal(false)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Proveedor *</label>
                <select value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary">
                  <option value="">Seleccionar...</option>
                  {suppliers.filter(s => s.activo).map(s => (
                    <option key={s._id} value={s._id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-textMuted font-medium">Productos</label>
                  <button onClick={addOrderItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus size={14} /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-background/50 p-2 rounded-lg border border-stone-700/50">
                      <div className="flex-1 min-w-0">
                        <select value={item.producto} onChange={e => updateOrderItem(idx, 'producto', e.target.value)}
                          className="w-full bg-background border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-textLight focus:outline-none focus:border-primary mb-1">
                          <option value="">Seleccionar...</option>
                          {products.filter(p => p.activo).map(p => (
                            <option key={p._id} value={p._id}>{p.nombre} (${p.precioCompra})</option>
                          ))}
                        </select>
                        <div className="flex gap-1">
                          <input type="number" placeholder="Cant." value={item.cantidad} onChange={e => updateOrderItem(idx, 'cantidad', e.target.value)}
                            className="w-20 bg-background border border-stone-700 rounded px-2 py-1 text-xs text-textLight focus:outline-none focus:border-primary" min="1" />
                          <input type="number" placeholder="$ Unit." value={item.precioUnitario} onChange={e => updateOrderItem(idx, 'precioUnitario', e.target.value)}
                            className="flex-1 bg-background border border-stone-700 rounded px-2 py-1 text-xs text-textLight focus:outline-none focus:border-primary" min="0" />
                          <span className="text-xs text-textMuted whitespace-nowrap self-center">
                            {formatCurrency((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0))}
                          </span>
                          <button onClick={() => removeOrderItem(idx)} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {form.items?.length > 0 && (
                  <div className="text-right text-sm font-bold text-textLight mt-2">
                    Total: {formatCurrency(orderTotal)}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Notas</label>
                <textarea value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              <button onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg">
                Crear Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesCompra;
