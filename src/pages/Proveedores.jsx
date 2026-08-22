import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Building2, Plus, Edit3, Trash2, Search, X, Package, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const emptySupplier = { nombre: '', contacto: '', telefono: '', email: '', direccion: '', cbu: '', productos: [], observaciones: '' };

const Proveedores = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...emptySupplier });
  const [editing, setEditing] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers?all=true'),
        api.get('/products'),
      ]);
      setSuppliers(supRes.data);
      setAllProducts(prodRes.data?.items || prodRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditing(item);
    setForm(item
      ? { ...item, productos: item.productos?.map(p => typeof p === 'string' ? p : p._id) || [] }
      : { ...emptySupplier }
    );
    setProductSearch('');
    setModal(true);
  };

  const toggleProduct = (productId) => {
    setForm(prev => {
      const current = prev.productos || [];
      const exists = current.includes(productId);
      return {
        ...prev,
        productos: exists ? current.filter(id => id !== productId) : [...current, productId],
      };
    });
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const { data } = await api.put(`/suppliers/${editing._id}`, form);
        setSuppliers(prev => prev.map(s => s._id === data._id ? data : s));
        toast.success('Proveedor actualizado');
      } else {
        const { data } = await api.post('/suppliers', form);
        setSuppliers(prev => [...prev, data]);
        toast.success('Proveedor creado');
      }
      setModal(false);
      setEditing(null);
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setSuppliers(prev => prev.map(s => s._id === id ? { ...s, activo: false } : s));
      toast.success('Proveedor desactivado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filtered = search
    ? suppliers.filter(s =>
        s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        s.contacto?.toLowerCase().includes(search.toLowerCase()) ||
        s.telefono?.includes(search)
      )
    : suppliers;

  const filteredProducts = productSearch
    ? allProducts.filter(p =>
        p.nombre?.toLowerCase().includes(productSearch.toLowerCase())
      )
    : allProducts;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Building2 size={28} className="text-primary" />
            Proveedores
          </h1>
          <p className="text-textMuted text-sm mt-1">{suppliers.filter(s => s.activo).length} proveedores activos</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm">
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
        <input type="text" placeholder="Buscar por nombre, contacto o teléfono..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
      </div>

      <div className="bg-surface rounded-xl border border-stone-800 overflow-x-auto">
        <table className="w-full text-left text-sm text-textLight min-w-[800px]">
          <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">CBU</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Observaciones</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-textMuted">No hay proveedores</td></tr>
            )}
            {filtered.map(s => (
              <tr key={s._id} className={`hover:bg-stone-800/40 transition-colors ${!s.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium">{s.nombre}</td>
                <td className="px-4 py-3 text-textMuted">{s.contacto || '—'}</td>
                <td className="px-4 py-3">{s.telefono || '—'}</td>
                <td className="px-4 py-3 text-textMuted">{s.email || '—'}</td>
                <td className="px-4 py-3 text-xs text-textMuted font-mono">{s.cbu || '—'}</td>
                <td className="px-4 py-3">
                  {s.productos && s.productos.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.productos.slice(0, 3).map(p => (
                        <span key={p._id || p} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                          {p.nombre || 'Producto'}
                        </span>
                      ))}
                      {s.productos.length > 3 && (
                        <span className="px-2 py-0.5 rounded bg-stone-700/50 text-textMuted text-xs">
                          +{s.productos.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-textMuted text-xs">Sin productos</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {s.observaciones ? (
                    <p className="text-xs text-textMuted max-w-[200px] truncate" title={s.observaciones}>{s.observaciones}</p>
                  ) : (
                    <span className="text-textMuted text-xs">—</span>
                  )}
                </td>
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

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">{editing ? 'Editar' : 'Nuevo'} Proveedor</h3>
              <button onClick={() => setModal(false)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} required />
              <Input label="Contacto" value={form.contacto} onChange={v => setForm({ ...form, contacto: v })} />
              <Input label="Teléfono" value={form.telefono} onChange={v => setForm({ ...form, telefono: v })} />
              <Input label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              <Input label="Dirección" value={form.direccion} onChange={v => setForm({ ...form, direccion: v })} />
              <Input label="CBU" value={form.cbu} onChange={v => setForm({ ...form, cbu: v })} />

              {/* Productos */}
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">
                  <Package size={12} className="inline mr-1" />
                  Productos que maneja ({form.productos?.length || 0} seleccionados)
                </label>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary mb-2"
                />
                <div className="max-h-48 overflow-y-auto border border-stone-700 rounded-lg divide-y divide-stone-700/50">
                  {filteredProducts.length === 0 && (
                    <p className="px-3 py-4 text-xs text-textMuted text-center">No hay productos disponibles</p>
                  )}
                  {filteredProducts.map(p => {
                    const isSelected = form.productos?.includes(p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => toggleProduct(p._id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                          isSelected ? 'bg-primary/10 text-primary' : 'text-textLight hover:bg-stone-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary border-primary' : 'border-stone-600'
                          }`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                          <span className="truncate">{p.nombre}</span>
                        </div>
                        <span className="text-xs text-textMuted shrink-0 ml-2">
                          {p.unidadMedida === 'kg' ? '/kg' : '/un'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Observaciones</label>
                <textarea
                  value={form.observaciones || ''}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={3}
                  placeholder="Info adicional: horarios de entrega, condiciones de pago, notas variadas..."
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              <button onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg">
                {editing ? 'Guardar Cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text', required = false }) => (
  <div>
    <label className="block text-xs text-textMuted mb-1 font-medium">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
  </div>
);

export default Proveedores;
