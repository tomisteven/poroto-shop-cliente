import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Receipt, Plus, Edit3, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const CATEGORIAS_GASTO = ['alquiler', 'servicios', 'insumos', 'mantenimiento', 'impuestos', 'sueldos', 'otros'];

const emptyExpense = { descripcion: '', monto: '', categoria: 'otros', fecha: new Date().toISOString().split('T')[0], notas: '' };

const Gastos = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...emptyExpense });
  const [editing, setEditing] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data);
    } catch {
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditing(item);
    if (item) {
      setForm({
        descripcion: item.descripcion || '',
        monto: item.monto || '',
        categoria: item.categoria || 'otros',
        fecha: item.fecha ? new Date(item.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notas: item.notas || ''
      });
    } else {
      setForm({ ...emptyExpense });
    }
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.descripcion.trim()) return toast.error('La descripcion es obligatoria');
    if (!form.monto || Number(form.monto) <= 0) return toast.error('El monto debe ser mayor a 0');
    try {
      if (editing) {
        const { data } = await api.put(`/expenses/${editing._id}`, form);
        setExpenses(prev => prev.map(e => e._id === data._id ? data : e));
        toast.success('Gasto actualizado');
      } else {
        const { data } = await api.post('/expenses', form);
        setExpenses(prev => [...prev, data]);
        toast.success('Gasto registrado');
      }
      setModal(false);
      setEditing(null);
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Estas seguro de eliminar este gasto?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
      toast.success('Gasto eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filtered = search
    ? expenses.filter(e =>
        e.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
        e.categoria?.toLowerCase().includes(search.toLowerCase())
      )
    : expenses;

  const totalGastos = filtered.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Receipt size={28} className="text-primary" />
            Gastos Operativos
          </h1>
          <p className="text-textMuted text-sm mt-1">{filtered.length} registros</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm">
          <Plus size={18} /> Nuevo Gasto
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
        <input type="text" placeholder="Buscar por descripcion o categoria..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
      </div>

      <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-left text-sm text-textLight">
          <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
            <tr>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-center w-24">Registro</th>
              <th className="px-4 py-3 text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-textMuted">No hay gastos registrados</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e._id} className="hover:bg-stone-800/40 transition-colors">
                <td className="px-4 py-3 font-medium">{e.descripcion}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                    {e.categoria}
                  </span>
                </td>
                <td className="px-4 py-3 text-textMuted text-xs">
                  {new Date(e.fecha).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-400">{formatCurrency(e.monto)}</td>
                <td className="px-4 py-3 text-center text-xs text-textMuted">
                  {new Date(e.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openModal(e)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                    <button onClick={() => handleDelete(e._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-800">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-xs text-textMuted font-medium uppercase">Total Gastos</td>
              <td className="px-4 py-3 text-right font-bold text-red-400 text-lg">{formatCurrency(totalGastos)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">{editing ? 'Editar' : 'Nuevo'} Gasto</h3>
              <button onClick={() => setModal(false)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Descripcion" value={form.descripcion} onChange={v => setForm({ ...form, descripcion: v })} required />
              <Input label="Monto" type="number" value={form.monto} onChange={v => setForm({ ...form, monto: v })} required />
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Categoria</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary">
                  {CATEGORIAS_GASTO.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <Input label="Fecha" type="date" value={form.fecha} onChange={v => setForm({ ...form, fecha: v })} />
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Notas</label>
                <textarea value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} rows={3}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary resize-none" />
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

export default Gastos;