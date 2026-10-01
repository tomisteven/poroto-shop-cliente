import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  Receipt, Plus, Edit3, Trash2, ChevronLeft, ChevronRight,
  CheckCircle2, X, Loader, Clock, Banknote, Calendar, CalendarCheck2
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const CATEGORIAS_GASTO = ['alquiler', 'servicios', 'insumos', 'mantenimiento', 'impuestos', 'sueldos', 'otros'];

const CATEGORIA_COLORS = {
  alquiler: 'text-amber-400 bg-amber-400/10',
  servicios: 'text-sky-400 bg-sky-400/10',
  insumos: 'text-violet-400 bg-violet-400/10',
  mantenimiento: 'text-cyan-400 bg-cyan-400/10',
  impuestos: 'text-red-400 bg-red-400/10',
  sueldos: 'text-emerald-400 bg-emerald-400/10',
  otros: 'text-stone-400 bg-stone-400/10',
};

const emptyForm = { nombre: '', monto: '', categoria: 'otros', diaVencimiento: '', activo: true, notas: '' };

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (mm, delta) => {
  const [y, m] = mm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const GastosFijos = () => {
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fechaPago, setFechaPago] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fixed-expenses/status', { params: { month } });
      setStatus(data);
    } catch {
      toast.error('Error al cargar gastos fijos');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const sortedItems = useCallback(() => {
    if (!status) return [];
    return [...status.items].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      if (a.pagado !== b.pagado) return a.pagado ? 1 : -1;
      return (a.diaVencimiento || 31) - (b.diaVencimiento || 31);
    });
  }, [status]);

  const handlePay = async () => {
    if (!payModal) return;
    setPaying(payModal._id);
    try {
      await api.post(`/fixed-expenses/${payModal._id}/pay`, { mes: month, fechaPago });
      toast.success('Gasto marcado como pagado');
      setPayModal(null);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al marcar como pagado');
    } finally {
      setPaying(null);
    }
  };

  const handleUnpay = async (item) => {
    if (!confirm(`¿Desmarcar "${item.nombre}" como pagado? Se eliminará el gasto generado.`)) return;
    setPaying(item._id);
    try {
      await api.delete(`/fixed-expenses/${item._id}/pay`, { params: { mes: month } });
      toast.success('Pago desmarcado');
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al desmarcar pago');
    } finally {
      setPaying(null);
    }
  };

  const openModal = (item = null) => {
    setEditing(item);
    if (item) {
      setForm({
        nombre: item.nombre || '',
        monto: item.monto || '',
        categoria: item.categoria || 'otros',
        diaVencimiento: item.diaVencimiento || '',
        activo: item.activo !== false,
        notas: item.notas || '',
      });
    } else {
      setForm({ ...emptyForm });
    }
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!form.monto || Number(form.monto) <= 0) return toast.error('El monto debe ser mayor a 0');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/fixed-expenses/${editing._id}`, form);
        toast.success('Gasto fijo actualizado');
      } else {
        await api.post('/fixed-expenses', form);
        toast.success('Gasto fijo creado');
      }
      setModal(false);
      fetchStatus();
    } catch {
      toast.error('Error al guardar gasto fijo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item.nombre}"? Se borrarán también los gastos generados.`)) return;
    try {
      await api.delete(`/fixed-expenses/${item._id}`);
      toast.success('Gasto fijo eliminado');
      fetchStatus();
    } catch {
      toast.error('Error al eliminar gasto fijo');
    }
  };

  const progress = status && status.total > 0 ? Math.round((status.pagado / status.total) * 100) : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Receipt size={28} className="text-primary" />
            Gastos Fijos
          </h1>
          <p className="text-textMuted text-sm mt-1">
            Alquiler, servicios, impuestos y otros gastos recurrentes, mes a mes.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm"
        >
          <Plus size={18} /> Nuevo Gasto Fijo
        </button>
      </div>

      {/* Selector de mes + resumen */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Selector de mes */}
        <div className="lg:w-72 shrink-0 bg-surface rounded-xl border border-stone-800 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-textMuted mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> Mes a visualizar
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="w-9 h-9 rounded-lg bg-background border border-stone-700 text-textMuted hover:text-textLight hover:border-primary flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-lg font-bold text-textLight text-center flex-1">
              {status?.mesEtiqueta || month}
            </span>
            <button
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="w-9 h-9 rounded-lg bg-background border border-stone-700 text-textMuted hover:text-textLight hover:border-primary flex items-center justify-center transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMonth(currentMonth())}
              className="flex-1 px-3 py-2 rounded-lg border border-stone-700 text-xs text-textMuted hover:text-textLight hover:border-primary transition-colors"
            >
              Hoy ({currentMonth().split('-')[0]})
            </button>
          </div>
        </div>

        {/* Cards de resumen */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1 flex items-center gap-2">
              <Banknote size={14} className="text-primary" /> Total del mes
            </p>
            <p className="text-2xl font-extrabold text-textLight">$ {status ? formatCurrency(status.total) : '—'}</p>
            <p className="text-xs text-textMuted mt-1">{status?.activos} gastos activos</p>
          </div>
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400" /> Pagado
            </p>
            <p className="text-2xl font-extrabold text-emerald-400">$ {status ? formatCurrency(status.pagado) : '—'}</p>
            <p className="text-xs text-textMuted mt-1">{status?.pagados} de {status?.activos} pagos</p>
          </div>
          <div className="bg-surface rounded-xl border border-stone-800 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1 flex items-center gap-2">
              <Clock size={14} className="text-amber-400" /> Pendiente
            </p>
            <p className="text-2xl font-extrabold text-amber-400">$ {status ? formatCurrency(status.pendiente) : '—'}</p>
            <p className="text-xs text-textMuted mt-1">{status?.pendientes} sin pagar</p>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      {status && (
        <div className="bg-surface rounded-xl border border-stone-800 p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-textMuted">Progreso del mes</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden border border-stone-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-amber-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Listado */}
      <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !status || sortedItems().length === 0 ? (
          <div className="py-16 text-center">
            <Receipt size={40} className="mx-auto text-stone-600 mb-3" />
            <p className="text-textMuted">No tenés gastos fijos cargados.</p>
            <button
              onClick={() => openModal()}
              className="mt-4 inline-flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus size={16} /> Crear el primero
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-textLight">
              <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">Gasto</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-center">Estado {status?.mesEtiqueta}</th>
                  <th className="px-4 py-3 text-right w-56">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {sortedItems().map((item) => (
                  <tr key={item._id} className={`hover:bg-stone-800/40 transition-colors ${!item.activo ? 'opacity-45' : 'opacity-100'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-stone-800 flex items-center justify-center shrink-0">
                          <Receipt size={16} className="text-textMuted" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-textLight">{item.nombre}</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${CATEGORIA_COLORS[item.categoria] || CATEGORIA_COLORS.otros}`}>
                            {item.categoria}
                          </span>
                          {!item.activo && <span className="text-[10px] text-stone-500 ml-2 font-medium">DESACTIVADO</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-textMuted">
                      {item.diaVencimiento ? `Día ${item.diaVencimiento}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-textLight">{formatCurrency(item.monto)}</td>
                    <td className="px-4 py-3 text-center">
                      {item.pagado ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1">
                          <CheckCircle2 size={13} />
                          Pagado{item.fechaPago ? ` · ${new Date(item.fechaPago).toLocaleDateString('es-AR')}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1">
                          <Clock size={13} />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {item.activo ? (
                          item.pagado ? (
                            <button
                              onClick={() => handleUnpay(item)}
                              disabled={paying === item._id}
                              className="px-3 py-1.5 rounded-lg border border-stone-700 text-textMuted hover:text-amber-300 hover:border-amber-500/40 text-xs font-medium transition-colors disabled:opacity-40"
                            >
                              {paying === item._id ? '...' : 'Desmarcar'}
                            </button>
                          ) : (
                            <button
                              onClick={() => { setPayModal(item); setFechaPago(new Date().toISOString().split('T')[0]); }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 size={13} /> Marcar pagado
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => openModal(item)}
                            className="px-3 py-1.5 rounded-lg text-xs text-textMuted"
                          >
                            — Inactivo —
                          </button>
                        )}
                        <button
                          onClick={() => openModal(item)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {status && (
                <tfoot className="border-t border-stone-800">
                  <tr className="bg-stone-900/30">
                    <td colSpan={2} className="px-4 py-3 text-right text-xs text-textMuted font-medium uppercase">
                      Total fijo del mes
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-textLight text-lg">{formatCurrency(status.total)}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-primary">{progress}%</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-textMuted leading-relaxed bg-surface/50 border border-stone-800 rounded-lg px-4 py-3">
        <span className="font-bold text-primary">¿Cómo funciona?</span> Cada gasto fijo se repite todos los meses.
        Cuando esté pagado, tocá "Marcar pagado" y se genera automáticamente un gasto real en la sección
        <span className="text-textLight font-semibold"> Gastos Operativos</span>, entrando en los reportes y el cierre de caja de ese mes.
      </p>

      {/* Modal editar/crear */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">{editing ? 'Editar' : 'Nuevo'} Gasto Fijo</h3>
              <button onClick={() => setModal(false)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Nombre <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Alquiler, Luz, Monotributo..."
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-textMuted mb-1 font-medium">Monto mensual <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1 font-medium">Día de vencimiento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.diaVencimiento}
                    onChange={(e) => setForm({ ...form, diaVencimiento: e.target.value })}
                    placeholder="Día del mes"
                    className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                >
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={2}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary resize-none"
                  placeholder="Opcional"
                />
              </div>
              {editing && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-background rounded-lg border border-stone-800">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-600 bg-background text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm text-textLight font-medium">Activo (incluido en el mes)</span>
                </label>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              <button onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader size={14} className="animate-spin" />}
                {editing ? 'Guardar Cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal marcar pagado */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">Marcar como pagado</h3>
              <button onClick={() => setPayModal(null)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-background rounded-lg border border-stone-800 p-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CalendarCheck2 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-textLight">{payModal.nombre}</p>
                  <p className="text-sm text-textMuted">{formatCurrency(payModal.monto)} · {status?.mesEtiqueta}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Fecha de pago</label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-textMuted mt-1.5">
                  Se generará un gasto real en Gastos Operativos con esta fecha.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              <button onClick={() => setPayModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
              <button
                onClick={handlePay}
                disabled={paying === payModal._id}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying === payModal._id && <Loader size={14} className="animate-spin" />}
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GastosFijos;