import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import {
  Calendar, CalendarPlus, Pencil, Trash2, Check, CheckCircle2, X,
  ChevronLeft, ChevronRight, Clock, DollarSign, Repeat, AlertTriangle,
  ListTodo, Info, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const TIPOS = {
  tarea:        { label: 'Tarea',        dot: 'bg-orange-500',  chip: 'bg-primary/15 text-primary border-primary/30' },
  recordatorio: { label: 'Recordatorio', dot: 'bg-beige',       chip: 'bg-beige/15 text-beige border-beige/30' },
  pago:         { label: 'Pago',         dot: 'bg-red-500',     chip: 'bg-red-500/15 text-red-400 border-red-500/30' },
  compra:       { label: 'Compra',       dot: 'bg-amber-500',   chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  servicio:     { label: 'Servicio',     dot: 'bg-teal-500',    chip: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  nota:         { label: 'Nota',         dot: 'bg-stone-500',   chip: 'bg-stone-500/15 text-stone-400 border-stone-500/30' },
  orden:        { label: 'Orden compra', dot: 'bg-orange-600',  chip: 'bg-orange-600/15 text-orange-400 border-orange-600/30' },
  presupuesto:  { label: 'Presupuesto',  dot: 'bg-yellow-400',  chip: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30' },
  gasto:        { label: 'Gasto',        dot: 'bg-rose-500',    chip: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  otro:         { label: 'Otro',         dot: 'bg-gray-500',    chip: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
};

const FORM_TIPOS = ['tarea', 'recordatorio', 'pago', 'compra', 'servicio', 'nota', 'otro'];

const FRECUENCIAS = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' }
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const toDateKey = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMonthRange = (monthDate) => {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const offsetStart = (first.getDay() + 6) % 7;
  const start = new Date(y, m, 1 - offsetStart);
  const offsetEnd = (last.getDay() + 6) % 7;
  const end = new Date(y, m + 1, last.getDate() + (6 - offsetEnd));
  return { start, end };
};

const buildGrid = (viewDate) => {
  const { start } = getMonthRange(viewDate);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const emptyForm = (fecha) => ({
  titulo: '',
  tipo: 'tarea',
  fecha: fecha || toDateKey(new Date()),
  hora: '',
  importe: '',
  categoria: '',
  recurrente: false,
  frecuencia: 'semanal',
  descripcion: '',
  referenciaTipo: '',
  referenciaId: '',
  referenciaNombre: ''
});

const Calendario = () => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTypes, setActiveTypes] = useState(() => new Set(Object.keys(TIPOS)));
  const [showIntegrados, setShowIntegrados] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(null);
  const [applySerie, setApplySerie] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [dayList, setDayList] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getMonthRange(viewDate);
      const { data } = await api.get('/calendar', {
        params: { startDate: toDateKey(start), endDate: toDateKey(end) }
      });
      setItems(data);
    } catch {
      toast.error('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  }, [viewDate]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  useEffect(() => {
    api.get('/suppliers?all=true').then(r => setSuppliers(r.data)).catch(() => {});
    api.get('/customers?all=true').then(r => setCustomers(r.data)).catch(() => {});
  }, []);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(toDateKey(now) + 'T12:00:00');
  }, []);
  const todayKey = toDateKey(today);

  const visibleItems = useMemo(() => {
    return items.filter(i => {
      if (i.origen !== 'evento' && !showIntegrados) return false;
      return activeTypes.has(i.tipo);
    });
  }, [items, activeTypes, showIntegrados]);

  const grid = useMemo(() => buildGrid(viewDate), [viewDate]);

  const itemsByDay = (day) => {
    const key = toDateKey(day);
    return visibleItems.filter(i => toDateKey(new Date(i.fecha)) === key);
  };

  const pendientes = useMemo(() => {
    const vencidos = [];
    const hoy = [];
    const proximos = [];
    const futuros = [];
    visibleItems.forEach(i => {
      if (i.estado === 'completado') return;
      const key = toDateKey(new Date(i.fecha));
      const fecha = new Date(key + 'T12:00:00');
      if (key === todayKey) hoy.push(i);
      else if (fecha < today) vencidos.push(i);
      else if (fecha.getTime() - today.getTime() <= 7 * 24 * 3600 * 1000) proximos.push(i);
      else futuros.push(i);
    });
    return { vencidos, hoy, proximos, futuros };
  }, [visibleItems, todayKey, today]);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday = () => {
    const d = new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const toggleType = (tipo) => {
    const next = new Set(activeTypes);
    if (next.has(tipo)) next.delete(tipo); else next.add(tipo);
    setActiveTypes(next);
  };

  const openNew = (fecha) => {
    setEditing(null);
    setApplySerie(false);
    setForm(emptyForm(fecha ? toDateKey(fecha) : todayKey));
    setModal(true);
  };

  const openEdit = (evento) => {
    setEditing(evento);
    setApplySerie(false);
    setForm({
      titulo: evento.titulo || '',
      tipo: evento.tipo || 'tarea',
      fecha: toDateKey(new Date(evento.fecha)),
      hora: evento.hora || '',
      importe: evento.importe != null ? evento.importe : '',
      categoria: evento.categoria || '',
      recurrente: !!evento.recurrente?.activa,
      frecuencia: evento.recurrente?.frecuencia || 'semanal',
      descripcion: evento.descripcion || '',
      referenciaTipo: evento.referenciaTipo || '',
      referenciaId: evento.referenciaId || '',
      referenciaNombre: evento.referenciaNombre || ''
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fecha) {
      toast.error('Completá título y fecha');
      return;
    }
    const payload = {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      fecha: form.fecha,
      hora: form.hora || undefined,
      importe: form.importe !== '' && form.importe != null ? Number(form.importe) : undefined,
      categoria: form.categoria || undefined,
      descripcion: form.descripcion || undefined,
      recurrente: form.recurrente ? { activa: true, frecuencia: form.frecuencia } : { activa: false },
      referenciaTipo: form.referenciaTipo || undefined,
      referenciaId: form.referenciaId || undefined,
      referenciaNombre: form.referenciaNombre || undefined
    };
    try {
      if (editing) {
        await api.put(`/calendar/events/${editing.id || editing._id}`, { ...payload, serie: applySerie });
        toast.success('Evento actualizado');
      } else {
        await api.post('/calendar/events', payload);
        toast.success(form.recurrente ? 'Evento recurrente creado' : 'Evento creado');
      }
      setModal(false);
      setEditing(null);
      fetchCalendar();
    } catch {
      toast.error('Error al guardar');
    }
  };

  const handleToggleStatus = async (evento, nuevoEstado) => {
    try {
      await api.patch(`/calendar/events/${evento.id || evento._id}/estado`, { estado: nuevoEstado, serie: false });
      toast.success(nuevoEstado === 'completado' ? 'Marcado como completado' : 'Marcado como pendiente');
      setDetalle(null);
      fetchCalendar();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (evento) => {
    let serie = applySerie;
    if (evento.recurrente?.activa) {
      serie = confirm('¿Eliminar TODA la serie recurrente? "Cancelar" elimina solo esta ocurrencia.');
    }
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await api.delete(`/calendar/events/${evento.id || evento._id}`, { data: { serie } });
      toast.success('Evento eliminado');
      setDetalle(null);
      setModal(false);
      fetchCalendar();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const referenciaOptions = () => {
    if (form.referenciaTipo === 'proveedor') return suppliers.filter(s => s.activo);
    if (form.referenciaTipo === 'cliente') return customers.filter(c => c.activo);
    return [];
  };

  const setReferenciaId = (id) => {
    const list = referenciaOptions();
    const match = list.find(r => r._id === id);
    setForm({
      ...form,
      referenciaId: id,
      referenciaNombre: match ? match.nombre : ''
    });
  };

  const renderPill = (item) => {
    const style = TIPOS[item.tipo] || TIPOS.otro;
    const done = item.estado === 'completado';
    return (
      <button
        key={`${item.origen}-${item.id}`}
        onClick={(e) => { e.stopPropagation(); setDetalle(item); }}
        className={`flex items-center gap-1 w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight hover:bg-stone-700/50 transition-colors ${
          done ? 'opacity-50 line-through' : ''
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
        <span className="truncate">{item.titulo}</span>
      </button>
    );
  };

  const renderDetalleItem = (item) => {
    const style = TIPOS[item.tipo] || TIPOS.otro;
    const isEvento = item.origen === 'evento';
    return (
      <div key={`${item.origen}-${item.id}`} className="flex items-center gap-3 py-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <button
          onClick={() => setDetalle(item)}
          className={`flex-1 min-w-0 text-left hover:text-primary transition-colors ${item.estado === 'completado' ? 'opacity-50 line-through' : ''}`}
        >
          <span className="text-sm font-medium text-textLight truncate block">{item.titulo}</span>
          <span className="text-xs text-textMuted block">
            {item.hora && `${item.hora} · `}
            {item.importe != null && `${formatCurrency(item.importe)} · `}
            {item.categoria || ''}
          </span>
        </button>
        {isEvento && item.estado !== 'completado' && (
          <button
            onClick={() => handleToggleStatus(item, 'completado')}
            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            title="Marcar como completado"
          >
            <CheckCircle2 size={16} />
          </button>
        )}
      </div>
    );
  };

  const monthLabel = viewDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  if (loading && items.length === 0) {
    return <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Calendar className="text-primary" size={28} />
            Calendario
          </h2>
          <p className="text-textMuted text-sm mt-1">Todas tus tareas, pagos, compras y servicios en un solo lugar</p>
        </div>
        <button
          onClick={() => openNew()}
          className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm font-medium"
        >
          <CalendarPlus size={18} />
          Nuevo evento
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendario */}
        <div className="xl:col-span-9 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg bg-surface border border-stone-700 text-textMuted hover:text-textLight transition-colors" title="Mes anterior">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-lg bg-surface border border-stone-700 text-textMuted hover:text-textLight transition-colors" title="Mes siguiente">
                <ChevronRight size={18} />
              </button>
              <button onClick={goToday} className="px-3 py-2 rounded-lg bg-surface border border-stone-700 text-sm text-textLight hover:border-primary transition-colors font-medium">
                Hoy
              </button>
              <h3 className="text-lg font-bold text-textLight capitalize ml-2">{monthLabel}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowIntegrados(!showIntegrados)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${
                  showIntegrados ? 'bg-surface border-stone-700 text-textLight' : 'bg-background border-stone-800 text-textMuted'
                }`}
              >
                Mostrar integrados
              </button>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(TIPOS).map(t => {
                  const s = TIPOS[t];
                  const on = activeTypes.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                        on ? s.chip : 'bg-background border-stone-800 text-textMuted opacity-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-stone-800 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-stone-800 bg-stone-900/50">
              {DIAS_SEMANA.map(d => (
                <div key={d} className="py-2.5 text-center text-xs font-bold uppercase tracking-wider text-textMuted">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((day, i) => {
                const key = toDateKey(day);
                const inMonth = day.getMonth() === viewDate.getMonth();
                const isToday = key === todayKey;
                const dayItems = itemsByDay(day);
                const more = dayItems.length > 3;
                const shown = dayItems.slice(0, 3);
                return (
                  <div
                    key={i}
                    onClick={() => openNew(day)}
                    className={`min-h-[92px] border-stone-800/60 p-1.5 cursor-pointer transition-colors hover:bg-stone-800/30 ${
                      i % 7 !== 6 ? 'border-r' : ''
                    } ${i < 35 ? 'border-b' : ''} ${!inMonth ? 'bg-background/40 opacity-40' : ''}`}
                  >
                    <div className={`flex items-center justify-between mb-1 px-1`}>
                      <span className={`text-xs font-bold ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : inMonth ? 'text-textLight' : 'text-textMuted'}`}>
                        {day.getDate()}
                      </span>
                      {dayItems.length > 0 && !isToday && (
                        <span className="text-[10px] text-textMuted">{dayItems.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {shown.map(renderPill)}
                      {more && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDayList({ key, items: dayItems }); }}
                          className="text-[10px] text-textMuted hover:text-primary px-1.5"
                        >
                          +{dayItems.length - 3} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-textMuted">
            {FORM_TIPOS.map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${TIPOS[t].dot}`} />
                {TIPOS[t].label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <Info size={12} />
              Completadas: atenuadas y tachadas
            </span>
          </div>
        </div>

        {/* Panel de pendientes */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-surface rounded-2xl border border-stone-800 p-4">
            <h4 className="font-bold text-textLight mb-3 flex items-center gap-2">
              <ListTodo size={16} className="text-primary" />
              Pendientes
            </h4>
            <div className="space-y-4">
              {pendientes.vencidos.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Vencidos
                  </p>
                  <div className="divide-y divide-stone-800/50">{pendientes.vencidos.map(renderDetalleItem)}</div>
                </div>
              )}
              {pendientes.hoy.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">Hoy</p>
                  <div className="divide-y divide-stone-800/50">{pendientes.hoy.map(renderDetalleItem)}</div>
                </div>
              )}
              {pendientes.proximos.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-textMuted mb-1">Próximos 7 días</p>
                  <div className="divide-y divide-stone-800/50">{pendientes.proximos.map(renderDetalleItem)}</div>
                </div>
              )}
              {pendientes.futuros.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-textMuted mb-1">Más adelante</p>
                  <div className="divide-y divide-stone-800/50">{pendientes.futuros.map(renderDetalleItem)}</div>
                </div>
              )}
              {pendientes.vencidos.length === 0 && pendientes.hoy.length === 0 && pendientes.proximos.length === 0 && pendientes.futuros.length === 0 && (
                <p className="text-sm text-textMuted text-center py-4">Sin pendientes 🎉</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal nuevo / editar evento */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-stone-800 sticky top-0 bg-surface z-10">
              <h3 className="text-lg font-bold text-textLight">
                {editing ? 'Editar evento' : 'Nuevo evento'}
              </h3>
              <button onClick={() => setModal(false)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Título" required>
                <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Pagar a proveedor" className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
                    {FORM_TIPOS.map(t => (
                      <option key={t} value={t}>{TIPOS[t].label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha" required>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hora (opcional)">
                  <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Importe (opcional)">
                  <input type="number" min="0" value={form.importe} onChange={e => setForm({ ...form, importe: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="Categoría (opcional)">
                <input type="text" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Alimento balanceado" className={inputClass} />
              </Field>
              <Field label="Descripción (opcional)">
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
              </Field>
              <div className="bg-background/50 border border-stone-800 rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.recurrente} onChange={e => setForm({ ...form, recurrente: e.target.checked })} className="w-4 h-4 rounded border-stone-600 bg-background text-primary focus:ring-primary/30" />
                  <span className="text-sm text-textLight font-medium flex items-center gap-2">
                    <Repeat size={14} className="text-primary" />
                    Evento recurrente
                  </span>
                </label>
                {form.recurrente && (
                  <div>
                    <label className="block text-xs text-textMuted mb-1 font-medium">Frecuencia</label>
                    <select value={form.frecuencia} onChange={e => setForm({ ...form, frecuencia: e.target.value })} className={inputClass}>
                      {FRECUENCIAS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-textMuted mt-2">
                      Se generan automáticamente las próximas ocurrencias por un año. Perfecto para compras o pagos fijos.
                    </p>
                  </div>
                )}
              </div>
              <Field label="Vincular a (opcional)">
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.referenciaTipo} onChange={e => setForm({ ...form, referenciaTipo: e.target.value, referenciaId: '', referenciaNombre: '' })} className={inputClass}>
                    <option value="">Sin vínculo</option>
                    <option value="proveedor">Proveedor</option>
                    <option value="cliente">Cliente</option>
                  </select>
                  <select value={form.referenciaId} onChange={e => setReferenciaId(e.target.value)} className={inputClass} disabled={!form.referenciaTipo}>
                    <option value="">Seleccionar...</option>
                    {referenciaOptions().map(r => (
                      <option key={r._id} value={r._id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              </Field>
              {editing && editing.recurrente?.activa && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={applySerie} onChange={e => setApplySerie(e.target.checked)} className="w-4 h-4 rounded border-stone-600 bg-background text-primary focus:ring-primary/30" />
                  <span className="text-sm text-textMuted">Aplicar a toda la serie recurrente</span>
                </label>
              )}
              {editing && editing.recurrente?.activa && applySerie && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  Se edita toda la serie. Si cambiás la fecha o la frecuencia, las próximas ocurrencias se regeneran automáticamente; las ya ocurridas se conservan.
                </p>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800 sticky bottom-0 bg-surface">
              <button onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg">
                {editing ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lista del día */}
      {dayList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDayList(null)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-textLight capitalize">
                {new Date(dayList.key + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setDayList(null)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-1 max-h-[60vh] overflow-y-auto">
              {dayList.items.map(item => {
                const style = TIPOS[item.tipo] || TIPOS.otro;
                const done = item.estado === 'completado';
                return (
                  <button
                    key={`${item.origen}-${item.id}`}
                    onClick={() => { setDetalle(item); setDayList(null); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-stone-800/50 transition-colors text-left ${done ? 'opacity-50' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-medium text-textLight truncate ${done ? 'line-through' : ''}`}>{item.titulo}</span>
                      <span className="block text-xs text-textMuted">
                        {item.hora && `${item.hora} · `}
                        {item.importe != null && `${formatCurrency(item.importe)} · `}
                        {(TIPOS[item.tipo] || TIPOS.otro).label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-5 border-t border-stone-800">
              <button
                onClick={() => { setDayList(null); openNew(new Date(dayList.key + 'T12:00:00')); }}
                className="w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg"
              >
                Agregar evento a este día
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetalle(null)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-stone-800 flex items-start justify-between gap-3">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${(TIPOS[detalle.tipo] || TIPOS.otro).chip}`}>
                  {(TIPOS[detalle.tipo] || TIPOS.otro).label}
                </span>
                <h3 className="text-lg font-bold text-textLight mt-2">{detalle.titulo}</h3>
              </div>
              <button onClick={() => setDetalle(null)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-textMuted">
                <Calendar size={16} className="text-primary" />
                {new Date(detalle.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {detalle.hora && (
                <div className="flex items-center gap-2 text-textMuted">
                  <Clock size={16} className="text-primary" />
                  {detalle.hora}
                </div>
              )}
              {detalle.importe != null && (
                <div className="flex items-center gap-2 text-textMuted">
                  <DollarSign size={16} className="text-primary" />
                  {formatCurrency(detalle.importe)}
                </div>
              )}
              {detalle.categoria && (
                <div className="flex items-center gap-2 text-textMuted">
                  <TagIcon />
                  {detalle.categoria}
                </div>
              )}
              {detalle.recurrente?.activa && (
                <div className="flex items-center gap-2 text-textMuted">
                  <Repeat size={16} className="text-primary" />
                  Recurrente {FRECUENCIAS.find(f => f.value === detalle.recurrente.frecuencia)?.label || detalle.recurrente.frecuencia}
                </div>
              )}
              {detalle.referenciaNombre && (
                <div className="flex items-center gap-2 text-textMuted">
                  <Link2 size={16} className="text-primary" />
                  {detalle.referenciaTipo === 'proveedor' ? 'Proveedor' : detalle.referenciaTipo === 'cliente' ? 'Cliente' : 'Vinculado'}: {detalle.referenciaNombre}
                </div>
              )}
              {detalle.descripcion && (
                <p className="text-textMuted bg-background/50 border border-stone-800 rounded-lg p-3 whitespace-pre-wrap">{detalle.descripcion}</p>
              )}
              {detalle.empleado && (
                <p className="text-xs text-textMuted">Creado por {detalle.empleado}</p>
              )}
              {detalle.origen !== 'evento' && (
                <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>
                    {detalle.origen === 'orden' && 'Es una orden de compra pendiente. Se gestiona desde Gestión → Órdenes de Compra.'}
                    {detalle.origen === 'presupuesto' && 'Es un presupuesto pendiente. Se gestiona desde la sección Presupuestos.'}
                    {detalle.origen === 'gasto' && 'Es un gasto registrado. Se gestiona desde Gestión → Gastos Operativos.'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              {detalle.origen === 'evento' && detalle.estado !== 'completado' && (
                <button
                  onClick={() => handleToggleStatus(detalle, 'completado')}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Completado
                </button>
              )}
              {detalle.origen === 'evento' && detalle.estado === 'completado' && (
                <button
                  onClick={() => handleToggleStatus(detalle, 'pendiente')}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-surface border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium"
                >
                  Marcar pendiente
                </button>
              )}
              {detalle.origen === 'evento' && (
                <>
                  <button
                    onClick={() => { openEdit(detalle); setDetalle(null); }}
                    className="p-2.5 rounded-lg border border-stone-700 text-primary hover:bg-primary/10 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(detalle)}
                    className="p-2.5 rounded-lg border border-stone-700 text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              {detalle.origen !== 'evento' && (
                <button onClick={() => setDetalle(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium">
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, required = false, children }) => (
  <div>
    <label className="block text-xs text-textMuted mb-1 font-medium">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = 'w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary';

const TagIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
};

export default Calendario;