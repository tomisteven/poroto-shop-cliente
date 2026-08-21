import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Sparkles, Tag, Eye, Pencil, Pause, Play, Trash2,
  Loader, X, Plus, Search, CheckCircle2
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

const Promociones = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.rol === 'admin';

  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Generador IA
  const [showGenerator, setShowGenerator] = useState(false);
  const [mainProductId, setMainProductId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [selectedProposals, setSelectedProposals] = useState([]);

  // Detalle / Edición
  const [detailPromo, setDetailPromo] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const params = filterEstado ? `?estado=${filterEstado}` : '';
      const { data } = await api.get(`/promotions${params}`);
      setPromotions(data);
    } catch {
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromotions(); }, [filterEstado]);
  useEffect(() => { fetchPromotions(); }, []);

  useEffect(() => {
    if (showGenerator || editPromo) {
      api.get('/products').then(({ data }) => setProducts(data)).catch(() => {});
    }
  }, [showGenerator, editPromo]);

  const handleGenerate = async () => {
    if (!mainProductId) return toast.error('Seleccioná un producto principal');
    setGenerating(true);
    setProposals([]);
    setSelectedProposals([]);
    try {
      const { data } = await api.post('/promotions/generar', { productoPrincipalId: mainProductId });
      setProposals(data.promociones || []);
      if (data.promociones?.length) {
        setSelectedProposals(data.promociones.map((_, i) => i));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al generar promociones');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProposals = async () => {
    const toSave = proposals.filter((_, i) => selectedProposals.includes(i));
    if (toSave.length === 0) return toast.error('Seleccioná al menos una promoción');

    let saved = 0;
    for (const prop of toSave) {
      try {
        await api.post('/promotions', {
          nombre: prop.nombre,
          descripcion: prop.descripcion,
          productoPrincipal: mainProductId,
          items: prop.items.map(i => ({ producto: i.producto, cantidad: i.cantidad })),
          descuento: prop.descuento,
        });
        saved++;
      } catch {
        toast.error(`No se pudo guardar "${prop.nombre}"`);
      }
    }

    if (saved > 0) {
      toast.success(`${saved} promoción(es) guardada(s) correctamente`);
      setShowGenerator(false);
      setProposals([]);
      setSelectedProposals([]);
      setMainProductId('');
      fetchPromotions();
    }
  };

  const toggleSelected = (idx) => {
    setSelectedProposals(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleToggleEstado = async (promo) => {
    try {
      const { data } = await api.patch(`/promotions/${promo._id}/estado`);
      setPromotions(prev => prev.map(p => p._id === promo._id ? data : p));
      toast.success(data.estado === 'activa' ? 'Promoción activada' : 'Promoción pausada');
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (promo) => {
    if (!confirm(`¿Eliminar la promoción "${promo.nombre}"?`)) return;
    try {
      await api.delete(`/promotions/${promo._id}`);
      setPromotions(prev => prev.filter(p => p._id !== promo._id));
      toast.success('Promoción eliminada');
    } catch {
      toast.error('Error al eliminar promoción');
    }
  };

  const openEdit = (promo) => {
    setEditPromo(promo);
    setEditForm({
      nombre: promo.nombre,
      descripcion: promo.descripcion || '',
      descuento: promo.descuento,
      items: promo.items.map(i => ({
        producto: i.producto._id,
        cantidad: i.cantidad,
      })),
    });
  };

  const addEditItem = () => {
    setEditForm(prev => ({ ...prev, items: [...prev.items, { producto: '', cantidad: 1 }] }));
  };

  const updateEditItem = (idx, field, val) => {
    setEditForm(prev => {
      const items = [...prev.items];
      items[idx][field] = field === 'cantidad' ? Number(val) : val;
      return { ...prev, items };
    });
  };

  const removeEditItem = (idx) => {
    setEditForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const editPreview = (() => {
    if (!editForm) return null;
    const items = editForm.items
      .map(i => {
        const prod = products.find(p => p._id === i.producto);
        if (!prod || !i.cantidad) return null;
        return { ...i, prod, subtotalVenta: prod.precioVenta * i.cantidad, subtotalCosto: prod.precioCompra * i.cantidad };
      })
      .filter(Boolean);

    const subtotalVenta = items.reduce((s, i) => s + i.subtotalVenta, 0);
    const subtotalCosto = items.reduce((s, i) => s + i.subtotalCosto, 0);
    const desc = Math.min(Math.max(editForm.descuento || 0, 0), 100);
    const precioFinal = subtotalVenta * (1 - desc / 100);
    const ganancia = precioFinal - subtotalCosto;
    const margen = precioFinal > 0 ? (ganancia / precioFinal) * 100 : 0;
    return { subtotalVenta, subtotalCosto, precioFinal, ganancia, margen };
  })();

  const handleSaveEdit = async () => {
    if (!editForm.nombre?.trim()) return toast.error('El nombre es obligatorio');
    if (editForm.items.length === 0) return toast.error('La promoción debe tener productos');
    setSavingEdit(true);
    try {
      const { data } = await api.put(`/promotions/${editPromo._id}`, {
        nombre: editForm.nombre,
        descripcion: editForm.descripcion,
        items: editForm.items.map(i => ({ producto: i.producto, cantidad: i.cantidad })),
        descuento: editForm.descuento,
      });
      setPromotions(prev => prev.map(p => p._id === data._id ? data : p));
      toast.success('Promoción actualizada');
      setEditPromo(null);
      setEditForm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setSavingEdit(false);
    }
  };

  const filtered = promotions.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.nombre?.toLowerCase().includes(s) ||
      p.numero?.toLowerCase().includes(s) ||
      p.productoPrincipal?.nombre?.toLowerCase().includes(s);
  });

  const getEstadoBadge = (estado) => (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${estado === 'activa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
      {estado === 'activa' ? 'Activa' : 'Pausada'}
    </span>
  );

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Tag className="text-primary" size={28} />
            Promociones
          </h2>
          <p className="text-textMuted text-sm mt-1">Combos creados con IA. Ver costo, ganancia y margen de cada uno</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowGenerator(true)}
            className="bg-gradient-to-r from-primary to-primaryDark hover:from-orange-400 hover:to-primaryDark text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Sparkles size={18} />
            Generar con IA
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-stone-800 p-4">
          <p className="text-xs text-textMuted uppercase font-bold">Promociones</p>
          <p className="text-2xl font-black text-textLight mt-1">{promotions.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-stone-800 p-4">
          <p className="text-xs text-textMuted uppercase font-bold">Activas</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{promotions.filter(p => p.estado === 'activa').length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-stone-800 p-4">
          <p className="text-xs text-textMuted uppercase font-bold">Pausadas</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{promotions.filter(p => p.estado === 'pausada').length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-stone-800 p-4">
          <p className="text-xs text-textMuted uppercase font-bold">Ganancia potencial</p>
          <p className="text-2xl font-black text-primary mt-1">{formatCurrency(promotions.reduce((s, p) => s + p.ganancia, 0))}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['', 'activa', 'pausada'].map(e => (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterEstado === e ? 'bg-primary text-white' : 'bg-surface text-textMuted hover:text-textLight border border-stone-700'
              }`}
            >
              {e === '' ? 'Todas' : e === 'activa' ? 'Activas' : 'Pausadas'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary w-64" />
        </div>
      </div>

      {/* Lista */}
      <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
        <table className="w-full text-left text-sm text-textLight">
          <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
            <tr>
              <th className="px-4 py-3">Promoción</th>
              <th className="px-4 py-3">Producto Principal</th>
              <th className="px-4 py-3 text-center">Productos</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3 text-center">Margen</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-center w-44">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-textMuted">
                No hay promociones. {isAdmin && 'Usá "Generar con IA" para crear combos automáticamente.'}
              </td></tr>
            )}
            {filtered.map(p => (
              <tr key={p._id} className="hover:bg-stone-800/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-bold text-primary">{p.nombre}</p>
                  <p className="text-xs text-textMuted font-mono">{p.numero}</p>
                </td>
                <td className="px-4 py-3 text-textMuted">{p.productoPrincipal?.nombre || '—'}</td>
                <td className="px-4 py-3 text-center text-textMuted">{p.items?.length}</td>
                <td className="px-4 py-3 text-right text-textMuted">{formatCurrency(p.subtotalCosto)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">{formatCurrency(p.precioFinal)}</td>
                <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(p.ganancia)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.margen >= 30 ? 'bg-emerald-500/20 text-emerald-400' : p.margen >= 15 ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-400'}`}>
                    {p.margen?.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{getEstadoBadge(p.estado)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setDetailPromo(p)} className="p-1.5 text-stone-400 hover:bg-stone-800 rounded-lg transition-colors" title="Ver detalle">
                      <Eye size={15} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleToggleEstado(p)} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title={p.estado === 'activa' ? 'Pausar' : 'Activar'}>
                          {p.estado === 'activa' ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 size={15} />
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

      {/* === MODAL GENERADOR IA === */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !generating && setShowGenerator(false)}>
          <div className="bg-surface w-full max-w-3xl max-h-[88vh] rounded-2xl border border-stone-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center">
                  <Sparkles className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-textLight">Generador de Promociones con IA</h3>
                  <p className="text-xs text-textMuted">Elegí un producto principal y la IA armará combos con el resto del catálogo</p>
                </div>
              </div>
              <button onClick={() => setShowGenerator(false)} className="text-textMuted hover:text-textLight p-1"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {proposals.length === 0 && (
                <>
                  <div>
                    <label className="block text-xs text-textMuted mb-1 font-medium">Producto principal</label>
                    <select value={mainProductId} onChange={e => setMainProductId(e.target.value)}
                      className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-textLight focus:outline-none focus:border-primary">
                      <option value="">Seleccionar producto...</option>
                      {products.filter(p => p.activo).map(p => (
                        <option key={p._id} value={p._id}>{p.nombre} — {formatCurrency(p.precioVenta)}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleGenerate} disabled={generating || !mainProductId}
                    className="w-full bg-gradient-to-r from-primary to-primaryDark hover:from-orange-400 hover:to-primaryDark disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                    {generating ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {generating ? 'Generando combos...' : 'Generar promociones con IA'}
                  </button>
                  {generating && (
                    <p className="text-xs text-textMuted text-center animate-pulse">
                      La IA está analizando el catálogo y armando combos con mejor margen de ganancia...
                    </p>
                  )}
                </>
              )}

              {proposals.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-textLight font-bold">Propuestas generadas ({proposals.length})</p>
                    <div className="flex gap-2">
                      <button onClick={() => setProposals([])} className="px-3 py-1.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight text-xs transition-colors">
                        Generar con otro producto
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {proposals.map((prop, idx) => {
                      const checked = selectedProposals.includes(idx);
                      return (
                        <div key={idx} onClick={() => toggleSelected(idx)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all ${checked ? 'border-primary bg-primary/5' : 'border-stone-800 bg-background hover:border-stone-600'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${checked ? 'bg-primary border-primary' : 'border-stone-600'}`}>
                              {checked && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-textLight">{prop.nombre}</p>
                              {prop.descripcion && <p className="text-xs text-textMuted mt-0.5">{prop.descripcion}</p>}
                              <ul className="mt-2 space-y-1">
                                {prop.items.map((item, i) => (
                                  <li key={i} className="text-xs text-textMuted flex justify-between">
                                    <span>{item.cantidad} x {item.nombre}</span>
                                    <span className="font-mono">{formatCurrency(item.subtotal)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                                <div className="bg-stone-800/60 rounded-lg p-2">
                                  <p className="text-[10px] text-textMuted uppercase font-bold">Costo</p>
                                  <p className="text-sm font-bold text-stone-300">{formatCurrency(prop.subtotalCosto)}</p>
                                </div>
                                <div className="bg-stone-800/60 rounded-lg p-2">
                                  <p className="text-[10px] text-textMuted uppercase font-bold">S/Desc</p>
                                  <p className="text-sm font-bold text-stone-300">{formatCurrency(prop.subtotalVenta)}</p>
                                </div>
                                <div className="bg-stone-800/60 rounded-lg p-2">
                                  <p className="text-[10px] text-textMuted uppercase font-bold">Desc</p>
                                  <p className="text-sm font-bold text-amber-400">{prop.descuento}%</p>
                                </div>
                                <div className="bg-stone-800/60 rounded-lg p-2">
                                  <p className="text-[10px] text-textMuted uppercase font-bold">Precio</p>
                                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(prop.precioFinal)}</p>
                                </div>
                                <div className="bg-stone-800/60 rounded-lg p-2">
                                  <p className="text-[10px] text-textMuted uppercase font-bold">Ganancia</p>
                                  <p className="text-sm font-bold text-primary">{formatCurrency(prop.ganancia)} <span className="text-[10px]">({prop.margen?.toFixed(1)}%)</span></p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setProposals([])}
                      className="flex-1 py-3 rounded-xl border border-stone-700 text-textMuted hover:text-textLight font-medium text-sm transition-colors">
                      Descartar
                    </button>
                    <button onClick={handleSaveProposals}
                      className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20">
                      Guardar seleccionadas ({selectedProposals.length})
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === MODAL DETALLE === */}
      {detailPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setDetailPromo(null)}>
          <div className="bg-surface w-full max-w-2xl max-h-[88vh] rounded-2xl border border-stone-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs text-primary font-mono font-bold">{detailPromo.numero}</p>
                <h3 className="text-xl font-bold text-textLight">{detailPromo.nombre}</h3>
                <p className="text-xs text-textMuted mt-1">{detailPromo.productoPrincipal?.nombre} + {detailPromo.items.length} producto(s)</p>
              </div>
              <button onClick={() => setDetailPromo(null)} className="text-textMuted hover:text-textLight p-1"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {detailPromo.descripcion && (
                <p className="text-sm text-textMuted">{detailPromo.descripcion}</p>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase text-textMuted mb-2">Productos del combo</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-textMuted uppercase border-b border-stone-800">
                      <th className="py-2 text-left">Producto</th>
                      <th className="py-2 text-center">Cant.</th>
                      <th className="py-2 text-right">Unit.</th>
                      <th className="py-2 text-right">Costo u.</th>
                      <th className="py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {detailPromo.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 font-medium text-textLight">{item.producto?.nombre}</td>
                        <td className="py-2 text-center text-textMuted">{item.cantidad}</td>
                        <td className="py-2 text-right">{formatCurrency(item.precioVenta)}</td>
                        <td className="py-2 text-right text-textMuted">{formatCurrency(item.precioCompra)}</td>
                        <td className="py-2 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                  <p className="text-[10px] text-textMuted uppercase font-bold">Subtotal venta</p>
                  <p className="text-lg font-bold text-textLight">{formatCurrency(detailPromo.subtotalVenta)}</p>
                </div>
                <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                  <p className="text-[10px] text-textMuted uppercase font-bold">Descuento</p>
                  <p className="text-lg font-bold text-amber-400">{detailPromo.descuento}%</p>
                </div>
                <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                  <p className="text-[10px] text-textMuted uppercase font-bold">Costo total</p>
                  <p className="text-lg font-bold text-stone-300">{formatCurrency(detailPromo.subtotalCosto)}</p>
                </div>
                <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                  <p className="text-[10px] text-textMuted uppercase font-bold">Precio final</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(detailPromo.precioFinal)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl p-4 border border-primary/20">
                <div>
                  <p className="text-[10px] text-textMuted uppercase font-bold">Ganancia</p>
                  <p className="text-2xl font-black text-primary">{formatCurrency(detailPromo.ganancia)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-textMuted uppercase font-bold">Margen</p>
                  <p className="text-2xl font-black text-emerald-400">{detailPromo.margen?.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-textMuted uppercase font-bold">Estado</p>
                  <div className="mt-1">{getEstadoBadge(detailPromo.estado)}</div>
                </div>
              </div>

              <p className="text-xs text-textMuted">
                Creada el {new Date(detailPromo.createdAt).toLocaleDateString('es-AR')} por {detailPromo.empleado?.nombre || '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL EDICIÓN === */}
      {editPromo && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !savingEdit && setEditPromo(null)}>
          <div className="bg-surface w-full max-w-2xl max-h-[88vh] rounded-2xl border border-stone-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-textLight flex items-center gap-2"><Pencil size={20} className="text-primary" /> Editar promoción</h3>
                <p className="text-xs text-textMuted font-mono">{editPromo.numero}</p>
              </div>
              <button onClick={() => setEditPromo(null)} className="text-textMuted hover:text-textLight p-1"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Nombre</label>
                <input type="text" value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Descripción</label>
                <textarea rows={2} value={editForm.descripcion} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
                  className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary resize-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-textMuted font-medium">Productos del combo</label>
                  <button onClick={addEditItem} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus size={14} /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-background/50 p-2 rounded-lg border border-stone-700/50">
                      <div className="flex-1 min-w-0">
                        <select value={item.producto} onChange={e => updateEditItem(idx, 'producto', e.target.value)}
                          className="w-full bg-background border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-textLight focus:outline-none focus:border-primary mb-1">
                          <option value="">Seleccionar...</option>
                          {products.filter(p => p.activo).map(p => (
                            <option key={p._id} value={p._id}>{p.nombre} — V {formatCurrency(p.precioVenta)} / C {formatCurrency(p.precioCompra)}</option>
                          ))}
                        </select>
                        <input type="number" min="1" value={item.cantidad} onChange={e => updateEditItem(idx, 'cantidad', e.target.value)}
                          className="w-24 bg-background border border-stone-700 rounded px-2 py-1 text-xs text-textLight focus:outline-none focus:border-primary" placeholder="Cantidad" />
                      </div>
                      <button onClick={() => removeEditItem(idx)} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1 font-medium">Descuento (%)</label>
                <input type="number" min="0" max="100" value={editForm.descuento} onChange={e => setEditForm({ ...editForm, descuento: Number(e.target.value) })}
                  className="w-32 bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary" />
              </div>

              {editPreview && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                  <div className="bg-stone-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-textMuted uppercase font-bold">Costo</p>
                    <p className="text-sm font-bold text-stone-300">{formatCurrency(editPreview.subtotalCosto)}</p>
                  </div>
                  <div className="bg-stone-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-textMuted uppercase font-bold">S/Desc</p>
                    <p className="text-sm font-bold text-stone-300">{formatCurrency(editPreview.subtotalVenta)}</p>
                  </div>
                  <div className="bg-stone-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-textMuted uppercase font-bold">Precio</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(editPreview.precioFinal)}</p>
                  </div>
                  <div className="bg-stone-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-textMuted uppercase font-bold">Ganancia</p>
                    <p className="text-sm font-bold text-primary">{formatCurrency(editPreview.ganancia)}</p>
                  </div>
                  <div className="bg-stone-800/60 rounded-lg p-2">
                    <p className="text-[10px] text-textMuted uppercase font-bold">Margen</p>
                    <p className="text-sm font-bold text-emerald-400">{editPreview.margen.toFixed(1)}%</p>
                  </div>
                </div>
              )}

              {editPreview && editPreview.ganancia <= 0 && (
                <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg p-3">
                  Esta promoción no genera ganancia. Ajustá el descuento o los productos.
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setEditPromo(null)} disabled={savingEdit}
                  className="flex-1 py-3 rounded-xl border border-stone-700 text-textMuted hover:text-textLight font-medium text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} disabled={savingEdit || (editPreview && editPreview.ganancia <= 0)}
                  className="flex-[2] py-3 rounded-xl bg-primary hover:bg-primaryDark disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  {savingEdit && <Loader size={16} className="animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promociones;