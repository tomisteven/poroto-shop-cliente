import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Users, Plus, Edit3, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyCustomer = { nombre: '', telefono: '', email: '', direccion: '' };

const Clientes = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...emptyCustomer });
  const [editing, setEditing] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/customers?all=true');
      setCustomers(data);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditing(item);
    setForm(item ? { ...item } : { ...emptyCustomer });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const { data } = await api.put(`/customers/${editing._id}`, form);
        setCustomers(prev => prev.map(c => c._id === data._id ? data : c));
        toast.success('Cliente actualizado');
      } else {
        const { data } = await api.post('/customers', form);
        setCustomers(prev => [data, ...prev]);
        toast.success('Cliente creado');
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
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.map(c => c._id === id ? { ...c, activo: false } : c));
      toast.success('Cliente desactivado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filtered = search
    ? customers.filter(c =>
        c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        c.telefono?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Users size={28} className="text-primary" />
            Clientes
          </h1>
          <p className="text-textMuted text-sm mt-1">{customers.filter(c => c.activo).length} clientes activos</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm">
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
        <input type="text" placeholder="Buscar por nombre, teléfono o email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
      </div>

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
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-textMuted">No hay clientes</td></tr>
            )}
            {filtered.map(c => (
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

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">{editing ? 'Editar' : 'Nuevo'} Cliente</h3>
              <button onClick={() => setModal(false)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Nombre" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} required />
              <Input label="Teléfono" value={form.telefono} onChange={v => setForm({ ...form, telefono: v })} />
              <Input label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              <Input label="Dirección" value={form.direccion} onChange={v => setForm({ ...form, direccion: v })} />
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

export default Clientes;
