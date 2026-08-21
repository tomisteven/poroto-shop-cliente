import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  FileText, Search, Phone, ShoppingCart, X, Check, Clock,
  Trash2, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const formatWhatsApp = (b) => {
  const items = b.items.map(i =>
    `• ${i.producto?.nombre || 'Producto'} x ${i.cantidad} = ${formatCurrency(i.subtotal)}`
  ).join('\n');
  const estado = b.estado === 'pendiente' ? '📋 *PENDIENTE*' : b.estado === 'convertido' ? '✅ *CONVERTIDO*' : '❌ *VENCIDO*';
  return encodeURIComponent(
    `🧾 *Presupuesto ${b.numero}* — ${estado}\n` +
    `━━━━━━━━━━━━━━━━━━\n${items}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Subtotal: ${formatCurrency(b.subtotal)}\n` +
    (b.descuento > 0 ? `Descuento: ${b.descuento}%\n` : '') +
    `*Total: ${formatCurrency(b.total)}*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    (b.clienteNombre ? `👤 ${b.clienteNombre}\n` : '') +
    `📅 ${new Date(b.fecha).toLocaleDateString('es-AR')}\n` +
    `👨‍💼 ${b.empleado?.nombre || ''}`
  );
};

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      const params = filterEstado ? `?estado=${filterEstado}` : '';
      const { data } = await api.get(`/budgets${params}`);
      setBudgets(data);
    } catch (error) {
      toast.error('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [filterEstado]);

  const handleConvert = async (id) => {
    if (!confirm('¿Convertir este presupuesto en venta?')) return;
    try {
      const { data } = await api.patch(`/budgets/${id}/convertir`);
      setBudgets(prev => prev.map(b => b._id === id ? data : b));
      toast.success('Presupuesto convertido a venta');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Cancelar este presupuesto?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(prev => prev.map(b => b._id === id ? { ...b, estado: 'vencido' } : b));
      toast.success('Presupuesto cancelado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleWhatsApp = (b) => {
    const phone = b.clienteTelefono?.replace(/\D/g, '');
    if (!phone) return toast.error('El presupuesto no tiene teléfono de cliente');
    const msg = formatWhatsApp(b);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const getStatusBadge = (estado) => {
    const styles = {
      pendiente: 'bg-amber-500/20 text-amber-400',
      convertido: 'bg-emerald-500/20 text-emerald-400',
      vencido: 'bg-red-500/20 text-red-400'
    };
    const labels = { pendiente: 'Pendiente', convertido: 'Convertido', vencido: 'Vencido' };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${styles[estado]}`}>{labels[estado]}</span>;
  };

  const filtered = budgets.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b.numero?.toLowerCase().includes(s) ||
      b.clienteNombre?.toLowerCase().includes(s) ||
      b.items?.some(i => i.producto?.nombre?.toLowerCase().includes(s));
  });

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-textLight">Presupuestos</h2>
        <p className="text-textMuted text-sm mt-1">Cotizaciones creadas desde el Punto de Venta</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['', 'pendiente', 'convertido', 'vencido'].map(e => (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterEstado === e
                  ? 'bg-primary text-white'
                  : 'bg-surface text-textMuted hover:text-textLight border border-stone-700'
              }`}
            >
              {e === '' ? 'Todos' : e === 'pendiente' ? 'Pendientes' : e === 'convertido' ? 'Convertidos' : 'Vencidos'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary w-64" />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-left text-sm text-textLight">
          <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
            <tr>
              <th className="px-4 py-3">N° Presupuesto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-center w-36">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-textMuted">
                No hay presupuestos {filterEstado ? `con estado "${filterEstado}"` : ''}
              </td></tr>
            )}
            {filtered.map(b => (
              <tr key={b._id} className="hover:bg-stone-800/40 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-primary">{b.numero}</td>
                <td className="px-4 py-3 font-medium">{b.clienteNombre || <span className="text-textMuted">—</span>}</td>
                <td className="px-4 py-3">{b.clienteTelefono || <span className="text-textMuted">—</span>}</td>
                <td className="px-4 py-3 text-textMuted">{b.items?.length} productos</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatCurrency(b.total)}</td>
                <td className="px-4 py-3 text-center">{getStatusBadge(b.estado)}</td>
                <td className="px-4 py-3 text-textMuted">{b.empleado?.nombre || '—'}</td>
                <td className="px-4 py-3 text-textMuted text-xs">
                  {new Date(b.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => handleWhatsApp(b)}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Enviar por WhatsApp">
                      <Phone size={15} />
                    </button>
                    {b.estado === 'pendiente' && (
                      <>
                        <button onClick={() => handleConvert(b._id)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Convertir a venta">
                          <ShoppingCart size={15} />
                        </button>
                        <button onClick={() => handleDelete(b._id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Cancelar presupuesto">
                          <X size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets;
