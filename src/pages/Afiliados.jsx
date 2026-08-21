import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import {
  Award, Users, Gift, Settings, Plus, Pencil, Trash2, X, Search, Check,
  Crown, Package, Percent, Wallet, ShoppingBag, Receipt, Star, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useContext } from 'react';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const TABS = [
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'rewards', label: 'Recompensas', icon: Gift },
  { key: 'redemptions', label: 'Canjes', icon: Receipt },
  { key: 'config', label: 'Configuración', icon: Settings }
];

const REWARD_TYPES = {
  efectivo: { label: 'Efectivo ($)', chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  porcentaje: { label: 'Descuento %', chip: 'bg-primary/15 text-primary border-primary/30' },
  producto: { label: 'Producto', chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  regalo: { label: 'Regalo / Obsequio', chip: 'bg-beige/15 text-beige border-beige/30' }
};

const emptyReward = { nombre: '', descripcion: '', tipo: 'efectivo', valor: '', producto: '', puntosRequeridos: '' };

const Afiliados = () => {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState('customers');
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [config, setConfig] = useState({ pesosPorPunto: 200 });
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  const [rewardModal, setRewardModal] = useState(false);
  const [form, setForm] = useState(emptyReward);
  const [editing, setEditing] = useState(null);

  const [redeemModal, setRedeemModal] = useState(null);
  const [redeemReward, setRedeemReward] = useState('');
  const [redeemNotas, setRedeemNotas] = useState('');

  const [configInput, setConfigInput] = useState(200);

  const isAdmin = user?.rol === 'admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cus, rew, red, cfg, prod] = await Promise.all([
        api.get('/loyalty/customers'),
        api.get('/loyalty/rewards'),
        api.get('/loyalty/redemptions'),
        api.get('/loyalty/config'),
        api.get('/products')
      ]);
      setCustomers(cus.data);
      setRewards(rew.data);
      setRedemptions(red.data);
      setConfig(cfg.data);
      setConfigInput(cfg.data.pesosPorPunto);
      setProducts(prod.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDetalle = async (customer) => {
    setDetalle(customer);
    setDetalleLoading(true);
    try {
      const { data } = await api.get(`/loyalty/customers/${customer._id}`);
      setDetalle(data);
    } catch {
      toast.error('Error al cargar el detalle');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleAfiliar = async (id) => {
    try {
      await api.patch(`/loyalty/customers/${id}/afiliar`);
      toast.success('Cliente afiliado');
      fetchData();
    } catch {
      toast.error('Error al afiliar');
    }
  };

  const openRewardModal = (reward = null) => {
    setEditing(reward);
    setForm(reward || { ...emptyReward });
    setRewardModal(true);
  };

  const handleSaveReward = async () => {
    if (!form.nombre || !form.tipo || !form.puntosRequeridos) {
      return toast.error('Completá nombre, tipo y puntos requeridos');
    }
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || undefined,
      tipo: form.tipo,
      valor: form.valor !== '' && form.valor != null ? Number(form.valor) : undefined,
      producto: form.tipo === 'producto' && form.producto ? form.producto : undefined,
      puntosRequeridos: Number(form.puntosRequeridos)
    };
    try {
      if (editing) {
        await api.put(`/loyalty/rewards/${editing._id}`, payload);
        toast.success('Recompensa actualizada');
      } else {
        await api.post('/loyalty/rewards', payload);
        toast.success('Recompensa creada');
      }
      setRewardModal(false);
      setEditing(null);
      fetchData();
    } catch {
      toast.error('Error al guardar recompensa');
    }
  };

  const handleToggleReward = async (reward) => {
    try {
      await api.put(`/loyalty/rewards/${reward._id}`, { activo: !reward.activo });
      toast.success(reward.activo ? 'Recompensa desactivada' : 'Recompensa activada');
      fetchData();
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteReward = async (reward) => {
    if (!confirm('¿Desactivar esta recompensa?')) return;
    try {
      await api.delete(`/loyalty/rewards/${reward._id}`);
      toast.success('Recompensa desactivada');
      fetchData();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveConfig = async () => {
    const val = Number(configInput);
    if (!val || val <= 0) return toast.error('Ingresá un valor válido');
    try {
      await api.put('/loyalty/config', { pesosPorPunto: val });
      toast.success('Configuración guardada');
      fetchData();
    } catch {
      toast.error('Error al guardar configuración');
    }
  };

  const openRedeem = (cliente = null) => {
    setRedeemModal(cliente);
    setRedeemReward('');
    setRedeemNotas('');
  };

  const handleRedeem = async () => {
    if (!redeemModal || !redeemReward) return toast.error('Seleccioná cliente y recompensa');
    const reward = rewards.find(r => r._id === redeemReward);
    if (redeemModal.puntos < reward.puntosRequeridos) return toast.error('Puntos insuficientes');
    try {
      await api.post('/loyalty/redeem', {
        clienteId: redeemModal._id,
        recompensaId: redeemReward,
        notas: redeemNotas.trim() || undefined
      });
      toast.success('Recompensa canjeada');
      setRedeemModal(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al canjear');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.nombre?.toLowerCase().includes(s) || c.telefono?.includes(s);
  });

  const rewardValor = (r) => {
    if (r.tipo === 'efectivo') return formatCurrency(r.valor || 0);
    if (r.tipo === 'porcentaje') return `${r.valor || 0}%`;
    if (r.tipo === 'producto') return r.producto?.nombre || '—';
    return r.valor ? formatCurrency(r.valor) : '—';
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Award className="text-amber-400" size={28} />
            Programa de Afiliados
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Puntos por compra, recompensas y clientes afiliados en un solo lugar
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface border border-stone-800 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Crown size={16} className="text-amber-400" />
            <span className="text-textMuted">Regla:</span>
            <span className="text-textLight font-semibold">Cada {formatCurrency(config.pesosPorPunto)} = 1 punto</span>
          </div>
        </div>
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

      {tab !== 'config' && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-textMuted text-sm">
            {tab === 'customers' && `${customers.filter(c => c.esAfiliado).length} afiliados · ${customers.length} clientes`}
            {tab === 'rewards' && `${rewards.filter(r => r.activo).length} recompensas activas`}
            {tab === 'redemptions' && `${redemptions.length} canjes registrados`}
          </p>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary w-64" />
          </div>
        </div>
      )}

      {/* Clientes */}
      {tab === 'customers' && (
        <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-center">Afiliado</th>
                <th className="px-4 py-3 text-right">Puntos</th>
                <th className="px-4 py-3 text-right">Gasto del mes</th>
                <th className="px-4 py-3 text-right">Total gastado</th>
                <th className="px-4 py-3 text-right">Compras</th>
                <th className="px-4 py-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredCustomers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-textMuted">No hay clientes registrados</td></tr>
              )}
              {filteredCustomers.map(c => (
                <tr key={c._id} className="hover:bg-stone-800/40 transition-colors cursor-pointer" onClick={() => openDetalle(c)}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.nombre}</div>
                    <div className="text-xs text-textMuted">{c.telefono || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.esAfiliado ? (
                      <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1"><Award size={13} /> Afiliado</span>
                    ) : (
                      <span className="text-xs text-textMuted">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-400">{c.puntos}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.gastoMes)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.totalGastado)}</td>
                  <td className="px-4 py-3 text-right text-textMuted">{c.ventas}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                      {!c.esAfiliado && (
                        <button onClick={() => handleAfiliar(c._id)} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Afiliar">
                          <Award size={15} />
                        </button>
                      )}
                      <button onClick={() => openDetalle(c)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Ver detalle">
                        <Search size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recompensas */}
      {tab === 'rewards' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => openRewardModal()} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm font-medium">
              <Plus size={18} /> Nueva recompensa
            </button>
          </div>
          <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
            <table className="w-full text-left text-sm text-textLight">
              <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">Recompensa</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3 text-right">Puntos</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {rewards.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-textMuted">No hay recompensas configuradas</td></tr>
                )}
                {rewards.map(r => (
                  <tr key={r._id} className={`hover:bg-stone-800/40 transition-colors ${!r.activo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.nombre}</div>
                      {r.descripcion && <div className="text-xs text-textMuted">{r.descripcion}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${REWARD_TYPES[r.tipo]?.chip}`}>
                        {REWARD_TYPES[r.tipo]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{rewardValor(r)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">{r.puntosRequeridos}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold ${r.activo ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openRewardModal(r)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => handleToggleReward(r)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title={r.activo ? 'Desactivar' : 'Activar'}>
                          <Check size={15} />
                        </button>
                        <button onClick={() => handleDeleteReward(r)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Canjes */}
      {tab === 'redemptions' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => openRedeem()} className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg text-sm font-medium">
              <Plus size={18} /> Nuevo canje
            </button>
          </div>
          <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
            <table className="w-full text-left text-sm text-textLight">
              <thead className="bg-stone-900/50 text-xs text-textMuted uppercase border-b border-stone-800">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Recompensa</th>
                  <th className="px-4 py-3 text-right">Puntos usados</th>
                  <th className="px-4 py-3">Registró</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {redemptions.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-textMuted">No hay canjes registrados</td></tr>
                )}
                {redemptions.map(r => (
                  <tr key={r._id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="px-4 py-3 text-textMuted">{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 font-medium">{r.cliente?.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${REWARD_TYPES[r.recompensa?.tipo]?.chip}`}>
                        {r.recompensa?.nombre || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">-{r.puntosUsados}</td>
                    <td className="px-4 py-3 text-textMuted">{r.empleado?.nombre || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Configuración */}
      {tab === 'config' && (
        <div className="max-w-md">
          <div className="bg-surface rounded-xl border border-stone-800 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Settings className="text-amber-400" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-textLight">Regla de puntos</h3>
                <p className="text-xs text-textMuted">Cuántos pesos gastados equivalen a 1 punto</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1 font-medium">Pesos por punto</label>
              <input
                type="number"
                min="1"
                value={configInput}
                onChange={e => setConfigInput(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <p className="text-[11px] text-textMuted mt-2">
                Ejemplo: con {formatCurrency(config.pesosPorPunto)} por punto, una compra de {formatCurrency(config.pesosPorPunto * 10)} otorga 10 puntos.
              </p>
            </div>
            {isAdmin ? (
              <button onClick={handleSaveConfig} className="w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg flex items-center justify-center gap-2">
                <RefreshCw size={16} /> Guardar configuración
              </button>
            ) : (
              <p className="text-xs text-textMuted bg-stone-800/50 border border-stone-700 rounded-lg p-3">
                Solo el administrador puede cambiar la regla de puntos.
              </p>
            )}
            <div className="border-t border-stone-800 pt-4 space-y-2">
              <p className="text-xs font-bold text-textMuted uppercase">Cómo funciona</p>
              <p className="text-sm text-textMuted">Al asignar un cliente a una venta (desde el POS o Ventas), se afilia automáticamente y acumula puntos según la regla. Los puntos no expiran.</p>
              <p className="text-sm text-textMuted">Las recompensas se canjean desde la sección Clientes o Canjes, descontando puntos del cliente.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle cliente */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetalle(null)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-stone-800 flex items-start justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-textLight flex items-center gap-2">
                  {detalle.cliente?.nombre || detalle.nombre}
                  {detalle.cliente?.esAfiliado && <Award size={18} className="text-amber-400" />}
                </h3>
                <p className="text-xs text-textMuted">{detalle.cliente?.telefono || '—'}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-textMuted hover:text-textLight"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-stone-800 shrink-0">
              <StatCard label="Puntos" value={detalle.cliente?.puntos ?? 0} color="text-amber-400" />
              <StatCard label="Gasto del mes" value={formatCurrency(detalle.gastoMes || 0)} />
              <StatCard label="Compras del mes" value={detalle.ventasMes || 0} />
              <StatCard label="Canjes" value={detalle.canjes?.length || 0} />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              <div>
                <h4 className="font-bold text-textLight mb-3 flex items-center gap-2"><ShoppingBag size={16} className="text-primary" /> Historial de compras</h4>
                {detalleLoading ? (
                  <div className="text-center py-6"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                ) : detalle.ventas?.length === 0 ? (
                  <p className="text-sm text-textMuted text-center py-4">Sin compras registradas</p>
                ) : (
                  <div className="bg-background/50 border border-stone-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs text-textLight">
                      <thead className="bg-stone-900/50 text-textMuted uppercase border-b border-stone-800">
                        <tr>
                          <th className="px-3 py-2">Ticket</th>
                          <th className="px-3 py-2">Fecha</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-right">Puntos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/50">
                        {detalle.ventas?.map(v => (
                          <tr key={v._id}>
                            <td className="px-3 py-2 font-mono font-bold text-primary">{v.numeroTicket}</td>
                            <td className="px-3 py-2 text-textMuted">{new Date(v.fecha).toLocaleDateString('es-AR')}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(v.totalFinal)}</td>
                            <td className="px-3 py-2 text-right text-amber-400 font-bold">+{v.puntosGanados || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-textLight mb-3 flex items-center gap-2"><Gift size={16} className="text-amber-400" /> Recompensas canjeadas</h4>
                {detalle.canjes?.length === 0 ? (
                  <p className="text-sm text-textMuted text-center py-4">Sin canjes todavía</p>
                ) : (
                  <div className="space-y-2">
                    {detalle.canjes?.map(c => (
                      <div key={c._id} className="flex items-center justify-between bg-background/50 border border-stone-800 rounded-lg px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-textLight">{c.recompensa?.nombre || '—'}</p>
                          <p className="text-xs text-textMuted">{new Date(c.fecha).toLocaleDateString('es-AR')}</p>
                        </div>
                        <span className="text-amber-400 font-bold text-sm">-{c.puntosUsados} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-stone-800 flex gap-3 shrink-0">
              <button onClick={() => setDetalle(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">
                Cerrar
              </button>
              <button onClick={() => openRedeem(detalle.cliente || detalle)} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg flex items-center justify-center gap-2">
                <Gift size={16} /> Canjear puntos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar recompensa */}
      {rewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRewardModal(false)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight">{editing ? 'Editar recompensa' : 'Nueva recompensa'}</h3>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Nombre" required>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} placeholder="Ej: Descuento de $500" />
              </Field>
              <Field label="Tipo" required>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
                  {Object.keys(REWARD_TYPES).map(t => (
                    <option key={t} value={t}>{REWARD_TYPES[t].label}</option>
                  ))}
                </select>
              </Field>
              {form.tipo === 'efectivo' && (
                <Field label="Valor en pesos" required>
                  <input type="number" min="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className={inputClass} placeholder="0" />
                </Field>
              )}
              {form.tipo === 'porcentaje' && (
                <Field label="Porcentaje de descuento" required>
                  <input type="number" min="0" max="100" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className={inputClass} placeholder="10" />
                </Field>
              )}
              {form.tipo === 'producto' && (
                <Field label="Producto a entregar" required>
                  <select value={form.producto} onChange={e => setForm({ ...form, producto: e.target.value })} className={inputClass}>
                    <option value="">Seleccionar...</option>
                    {products.filter(p => p.activo).map(p => (
                      <option key={p._id} value={p._id}>{p.nombre}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-textMuted mt-1">Al canjear se descuenta 1 unidad del stock.</p>
                </Field>
              )}
              {form.tipo === 'regalo' && (
                <Field label="Valor estimado (opcional)">
                  <input type="number" min="0" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className={inputClass} placeholder="0" />
                </Field>
              )}
              <Field label="Puntos requeridos" required>
                <input type="number" min="1" value={form.puntosRequeridos} onChange={e => setForm({ ...form, puntosRequeridos: e.target.value })} className={inputClass} placeholder="100" />
              </Field>
              <Field label="Descripción (opcional)">
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
              </Field>
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              <button onClick={() => setRewardModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={handleSaveReward} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg">
                {editing ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal canje */}
      {redeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRedeemModal(null)}>
          <div className="bg-surface rounded-2xl border border-stone-800 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-stone-800">
              <h3 className="text-lg font-bold text-textLight flex items-center gap-2">
                <Gift size={18} className="text-amber-400" /> Canjear recompensa
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Cliente">
                <select value={redeemModal?._id || ''} onChange={e => {
                  const c = customers.find(x => x._id === e.target.value);
                  if (c) setRedeemModal(c);
                }} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {customers.filter(c => c.esAfiliado).map(c => (
                    <option key={c._id} value={c._id}>{c.nombre} ({c.puntos} pts)</option>
                  ))}
                </select>
              </Field>
              {redeemModal?.esAfiliado && (
                <p className="text-sm text-amber-400 font-semibold flex items-center gap-2"><Star size={14} /> {redeemModal.puntos} puntos disponibles</p>
              )}
              <Field label="Recompensa">
                <select value={redeemReward} onChange={e => setRedeemReward(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {rewards.filter(r => r.activo).map(r => (
                    <option key={r._id} value={r._id} disabled={redeemModal && redeemModal.puntos < r.puntosRequeridos}>
                      {r.nombre} — {r.puntosRequeridos} pts
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notas (opcional)">
                <textarea value={redeemNotas} onChange={e => setRedeemNotas(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
              </Field>
            </div>
            <div className="flex gap-3 p-5 border-t border-stone-800">
              <button onClick={() => setRedeemModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-stone-700 text-textMuted hover:text-textLight transition-colors text-sm font-medium">Cancelar</button>
              <button onClick={handleRedeem} className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primaryDark text-white transition-colors text-sm font-medium shadow-lg">
                Canjear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color = 'text-textLight' }) => (
  <div className="bg-background/50 border border-stone-800 rounded-xl p-3">
    <p className="text-[11px] text-textMuted uppercase font-bold">{label}</p>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
);

const Field = ({ label, required = false, children }) => (
  <div>
    <label className="block text-xs text-textMuted mb-1 font-medium">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = 'w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary';

export default Afiliados;