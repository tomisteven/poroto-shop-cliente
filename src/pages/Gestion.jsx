import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Building2, ShoppingCart, Receipt, Users, Plus, Edit3, Trash2,
  Search, X, Check, Package, DollarSign, Calendar, FileText,
  Truck, Ban, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const TABS = [
  { key: 'suppliers', label: 'Proveedores', icon: Building2 },
  { key: 'orders', label: 'Órdenes de Compra', icon: ShoppingCart },
  { key: 'expenses', label: 'Gastos Operativos', icon: Receipt },
  { key: 'customers', label: 'Clientes', icon: Users }
];

const emptySupplier = { nombre: '', contacto: '', telefono: '', email: '', direccion: '', cbu: '' };
const emptyOrder = { proveedor: '', items: [], notas: '' };
const emptyExpense = { descripcion: '', monto: '', categoria: 'otros', fecha: new Date().toISOString().split('T')[0], notas: '' };
const emptyCustomer = { nombre: '', telefono: '', email: '', direccion: '' };

const CATEGORIAS_GASTO = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'sueldos', label: 'Sueldos' },
  { value: 'otros', label: 'Otros' }
];

const Gestion = () => {
  const [tab, setTab] = useState('suppliers');
  const [loading, setLoading] = useState(true);

  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sup, ord, exp, cus, prod] = await Promise.all([
        api.get('/suppliers?all=true'),
        api.get('/purchase-orders'),
        api.get('/expenses'),
        api.get('/customers?all=true'),
        api.get('/products')
      ]);
      setSuppliers(sup.data);
      setOrders(ord.data);
      setExpenses(exp.data);
      setCustomers(cus.data);
      setProducts(prod.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditing(item);
    if (tab === 'suppliers') setForm(item || { ...emptySupplier });
    else if (tab === 'orders') setForm(item || { ...emptyOrder, items: [] });
    else if (tab === 'expenses') setForm(item || { ...emptyExpense });
    else if (tab === 'customers') setForm(item || { ...emptyCustomer });
    setModal(tab);
  };

  const handleSave = async () => {
    try {
      if (tab === 'suppliers') {
        if (editing) {
          const { data } = await api.put(`/suppliers/${editing._id}`, form);
          setSuppliers(prev => prev.map(s => s._id === data._id ? data : s));
        } else {
          const { data } = await api.post('/suppliers', form);
          setSuppliers(prev => [...prev, data]);
        }
        toast.success(editing ? 'Proveedor actualizado' : 'Proveedor creado');
      } else if (tab === 'orders') {
        const payload = {
          proveedor: form.proveedor,
          items: form.items.map(i => ({ producto: i.producto, cantidad: Number(i.cantidad), precioUnitario: Number(i.precioUnitario) })),
          notas: form.notas
        };
        const { data } = await api.post('/purchase-orders', payload);
        const populated = await api.get(`/purchase-orders/${data._id}`);
        setOrders(prev => [populated.data, ...prev]);
        toast.success('Orden de compra creada');
      } else if (tab === 'expenses') {
        if (editing) {
          const { data } = await api.put(`/expenses/${editing._id}`, form);
          setExpenses(prev => prev.map(e => e._id === data._id ? data : e));
        } else {
          const { data } = await api.post('/expenses', form);
          setExpenses(prev => [data, ...prev]);
        }
        toast.success(editing ? 'Gasto actualizado' : 'Gasto registrado');
      } else if (tab === 'customers') {
        if (editing) {
          const { data } = await api.put(`/customers/${editing._id}`, form);
          setCustomers(prev => prev.map(c => c._id === data._id ? data : c));
        } else {
          const { data } = await api.post('/customers', form);
          setCustomers(prev => [...prev, data]);
        }
        toast.success(editing ? 'Cliente actualizado' : 'Cliente creado');
      }
      setModal(null);
      setEditing(null);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro?')) return;
    try {
      if (tab === 'suppliers') {
        await api.delete(`/suppliers/${id}`);
        setSuppliers(prev => prev.map(s => s._id === id ? { ...s, activo: false } : s));
      } else if (tab === 'expenses') {
        await api.delete(`/expenses/${id}`);
        setExpenses(prev => prev.filter(e => e._id !== id));
      } else if (tab === 'customers') {
        await api.delete(`/customers/${id}`);
        setCustomers(prev => prev.map(c => c._id === id ? { ...c, activo: false } : c));
      }
      toast.success('Eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleReceiveOrder = async (id) => {
    try {
      const { data } = await api.patch(`/purchase-orders/${id}/recibir`);
      setOrders(prev => prev.map(o => o._id === id ? data : o));
      toast.success('Orden recibida — stock actualizado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error');
    }
  };

  const handleCancelOrder = async (id) => {
    try {
      const { data } = await api.patch(`/purchase-orders/${id}/cancelar`);
      setOrders(prev => prev.map(o => o._id === id ? data : o));
      toast.success('Orden cancelada');
    } catch (error) {
      toast.error('Error al cancelar');
    }
  };

  const handleViewOrderDetail = (order) => {
    setOrderDetail(order);
  };

  const getStatusBadge = (estado) => {
    const styles = {
      pendiente: 'bg-amber-500/20 text-amber-400',
      recibida: 'bg-emerald-500/20 text-emerald-400',
      cancelada: 'bg-red-500/20 text-red-400'
    };
    const labels = { pendiente: 'Pendiente', recibida: 'Recibida', cancelada: 'Cancelada' };
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${styles[estado]}`}>{labels[estado]}</span>;
  };

  const filtered = (list) => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(item => {
      if (tab === 'suppliers') return item.nombre?.toLowerCase().includes(s) || item.contacto?.toLowerCase().includes(s) || item.telefono?.includes(s);
      if (tab === 'orders') return item.numero?.toLowerCase().includes(s) || item.proveedor?.nombre?.toLowerCase().includes(s);
      if (tab === 'expenses') return item.descripcion?.toLowerCase().includes(s) || item.categoria?.toLowerCase().includes(s);
      if (tab === 'customers') return item.nombre?.toLowerCase().includes(s) || item.telefono?.includes(s) || item.email?.toLowerCase().includes(s);
      return true;
    });
  };

  const addOrderItem = () => {
    if (!form.items) form.items = [];
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

  const renderModal = () => {
    if (!modal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
        <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-stone-800">
            <h3 className="text-lg font-bold text-textLight">
              {editing ? 'Editar' : 'Nuevo'} {tab === 'suppliers' ? 'Proveedor' : tab === 'orders' ? 'Orden de Compra' : tab === 'expenses' ? 'Gasto' : 'Cliente'}
            </h3>
            <button onClick={() => setModal(null)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
          </div>
          <div className="p-5 space-y-4">
            {tab === 'suppliers' && (
              <>
                <Input label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} required />
                <Input label="Contacto" value={form.contacto} onChange={v => setForm({ ...form, contacto: v })} />
                <Input label="Teléfono" value={form.telefono} onChange={v => setForm({ ...form, telefono: v })} />
                <Input label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                <Input label="Dirección" value={form.direccion} onChange={v => setForm({ ...form, direccion: v })} />
                <Input label="CBU" value={form.cbu} onChange={v => setForm({ ...form, cbu: v })} />
              </>
            )}
            {tab === 'orders' && (
              <>
                <div>
                  <label className="block text-xs text-textMuted mb-1 font-medium">Proveedor</label>
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
                <Input label="Notas" value={form.notas} onChange={v => setForm({ ...form, notas: v })} textarea />
              </>
            )}
            {tab === 'expenses' && (
              <>
                <Input label="Descripción" value={form.descripcion} onChange={v => setForm({ ...form, descripcion: v })} required />
                <Input label="Monto" type="number" value={form.monto} onChange={v => setForm({ ...form, monto: v })} required />
                <div>
                  <label className="block text-xs text-textMuted mb-1 font-medium">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary">
                    {CATEGORIAS_GASTO.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <Input label="Fecha" type="date" value={form.fecha} onChange={v => setForm({ ...form, fecha: v })} />
                <Input label="Notas" value={form.notas} onChange={v => setForm({ ...form, notas: v })} textarea />
              </>
            )}
            {tab === 'customers' && (
              <>
                <Input label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} required />
                <Input label="Teléfono" value={form.telefono} onChange={v => setForm({ ...form, telefono: v })} />
                <Input label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
                <Input label="Dirección" value={form.direccion} onChange={v => setForm({ ...form, direccion: v })} />
              </>
            )}
          </div>
          <div className="flex gap-3 p-5 border-t border-stone-800">
            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg">
              {editing ? 'Guardar Cambios' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderDetailModal = () => {
    if (!orderDetail) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setOrderDetail(null)}>
        <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-stone-800">
            <h3 className="text-lg font-bold text-textLight">Detalle de Orden: {orderDetail.numero}</h3>
            <button onClick={() => setOrderDetail(null)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-textMuted">Proveedor:</span>
                <p className="font-medium text-textLight">{orderDetail.proveedor?.nombre || '—'}</p>
              </div>
              <div>
                <span className="text-textMuted">Fecha:</span>
                <p className="font-medium text-textLight">{new Date(orderDetail.fecha).toLocaleDateString('es-AR')}</p>
              </div>
              <div>
                <span className="text-textMuted">Estado:</span>
                <p className="font-medium">{getStatusBadge(orderDetail.estado)}</p>
              </div>
              <div>
                <span className="text-textMuted">Total:</span>
                <p className="font-bold text-emerald-400 text-lg">{formatCurrency(orderDetail.total)}</p>
              </div>
            </div>
            {orderDetail.notas && (
              <div>
                <span className="text-textMuted text-sm">Notas:</span>
                <p className="text-textLight mt-1">{orderDetail.notas}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium text-textLight mb-2">Productos ({orderDetail.items?.length || 0})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-textMuted uppercase border-b border-stone-800">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 text-center">SKU</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-right">Precio Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {orderDetail.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-800/40">
                        <td className="px-3 py-2 font-medium">{item.producto?.nombre || '—'}</td>
                        <td className="px-3 py-2 text-center text-xs font-mono text-textMuted">{item.producto?.sku || '—'}</td>
                        <td className="px-3 py-2 text-center">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(item.precioUnitario)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.cantidad * item.precioUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-900/40 font-bold border-t border-stone-700">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right">Total</td>
                      <td className="px-3 py-2 text-right text-emerald-400">{formatCurrency(orderDetail.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Gestión</h2>
          <p className="text-textMuted text-sm mt-1">Administración de proveedores, órdenes, gastos y clientes</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm">
          <Plus size={18} />
          {tab === 'suppliers' ? 'Nuevo Proveedor' : tab === 'orders' ? 'Nueva Orden' : tab === 'expenses' ? 'Nuevo Gasto' : 'Nuevo Cliente'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-0">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg border-b-2 -mb-px ${
                tab === t.key ? 'text-primary border-primary' : 'text-textMuted border-transparent hover:text-textLight'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-textMuted text-sm">
          {tab === 'suppliers' && `${suppliers.filter(s => s.activo).length} proveedores activos`}
          {tab === 'orders' && `${orders.length} órdenes`}
          {tab === 'expenses' && `${expenses.length} gastos registrados`}
          {tab === 'customers' && `${customers.filter(c => c.activo).length} clientes activos`}
        </p>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary w-64" />
        </div>
      </div>

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">CBU</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filtered(suppliers).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-textMuted">No hay proveedores</td></tr>
              )}
              {filtered(suppliers).map(s => (
                <tr key={s._id} className={`hover:bg-stone-800/40 transition-colors ${!s.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{s.nombre}</td>
                  <td className="px-4 py-3 text-textMuted">{s.contacto || '—'}</td>
                  <td className="px-4 py-3">{s.telefono || '—'}</td>
                  <td className="px-4 py-3 text-textMuted">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-textMuted font-mono">{s.cbu || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${s.activo ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(s)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
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
              {filtered(orders).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-textMuted">No hay órdenes de compra</td></tr>
              )}
              {filtered(orders).map(o => (
                <tr key={o._id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{o.numero}</td>
                  <td className="px-4 py-3 font-medium">{o.proveedor?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-textMuted">{new Date(o.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-textMuted">{o.items?.length} productos</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(o.estado)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleViewOrderDetail(o)} title="Ver detalle"
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Eye size={15} /></button>
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
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
              <tr>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Registró</th>
                <th className="px-4 py-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filtered(expenses).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-textMuted">No hay gastos registrados</td></tr>
              )}
              {filtered(expenses).map(e => (
                <tr key={e._id} className="hover:bg-stone-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.descripcion}</div>
                    {e.notas && <div className="text-xs text-textMuted">{e.notas}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-stone-700/50 text-textMuted px-2 py-0.5 rounded text-xs capitalize">
                      {CATEGORIAS_GASTO.find(c => c.value === e.categoria)?.label || e.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-textMuted">{new Date(e.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-400">{formatCurrency(e.monto)}</td>
                  <td className="px-4 py-3 text-textMuted">{e.empleado?.nombre || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(e)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(e._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-stone-900/40 font-bold border-t border-stone-700">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-textLight">Total Gastos</td>
                <td className="px-4 py-3 text-right text-red-400">{formatCurrency(expenses.reduce((sum, e) => sum + e.monto, 0))}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Customers Tab */}
      {tab === 'customers' && (
        <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filtered(customers).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-textMuted">No hay clientes</td></tr>
              )}
              {filtered(customers).map(c => (
                <tr key={c._id} className={`hover:bg-stone-800/40 transition-colors ${!c.activo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3">{c.telefono || '—'}</td>
                  <td className="px-4 py-3 text-textMuted">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-textMuted">{c.direccion || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${c.activo ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(c)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderModal()}
      {renderOrderDetailModal()}
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', required = false, textarea = false }) => (
  <div>
    <label className="block text-xs text-textMuted mb-1 font-medium">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    {textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary resize-none" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
    )}
  </div>
);

export default Gestion;
