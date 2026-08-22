import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Clock, Globe, Package, Scale, Trash2, Eye, ChevronLeft, ChevronRight,
  Search, Filter, Sparkles, Lightbulb, CheckCircle2, ExternalLink, BookOpen,
  ArrowRight, ShoppingCart
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

const TIPOS = [
  { key: 'catalogo', label: 'Catálogo', icon: Package, color: 'text-primary' },
  { key: 'internet', label: 'Internet', icon: Globe, color: 'text-emerald-400' },
  { key: 'comparar', label: 'Comparar', icon: Scale, color: 'text-amber-400' },
];

const AIHistory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = async (p = page, tipo = tipoFilter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (tipo) params.tipo = tipo;
      const { data } = await api.get('/ai-history', { params });
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHistory(1, tipoFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFilter]);

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/ai-history/${id}`);
      setSelectedItem(data);
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ai-history/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setTotal((prev) => prev - 1);
      if (selectedItem?._id === id) setSelectedItem(null);
      toast.success('Eliminada del historial');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchHistory(newPage, tipoFilter);
  };

  const reloadAsistente = (item) => {
    const params = new URLSearchParams();
    if (item.tipo === 'catalogo') {
      params.set('q', item.consulta);
      navigate(`/asistente?mode=catalogo&q=${encodeURIComponent(item.consulta)}`);
    } else if (item.tipo === 'internet') {
      params.set('q', item.consulta);
      params.set('r', item.referencia || '');
      navigate(`/asistente?mode=internet&q=${encodeURIComponent(item.consulta)}&r=${encodeURIComponent(item.referencia || '')}`);
    } else if (item.tipo === 'comparar') {
      const ids = (item.resultado?.productos || []).map((p) => p._id);
      navigate(`/asistente?mode=comparar&ids=${ids.join(',')}`);
    }
  };

  const tipoInfo = (tipo) => TIPOS.find((t) => t.key === tipo) || TIPOS[0];

  const renderResultado = (item) => {
    const r = item.resultado;
    if (!r) return null;

    if (item.tipo === 'catalogo') {
      const recs = r.recomendaciones || [];
      return (
        <div className="space-y-3">
          <p className="text-sm text-textLight"><span className="font-bold">Consulta:</span> <span className="italic text-primary">"{item.consulta}"</span></p>
          {r.fuente === 'local' && (
            <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400">Sin IA — búsqueda local</span>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recs.map((rec, i) => {
              const p = rec.producto;
              return (
                <div key={i} className="bg-background border border-stone-700 rounded-xl p-3">
                  <p className="text-xs text-textMuted font-mono">{p.sku}</p>
                  <p className="text-sm font-bold text-textLight">{p.nombre}</p>
                  {rec.motivo && <p className="text-xs text-emerald-400 mt-1">{rec.motivo}</p>}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-bold text-primary">{formatCurrency(p.precioVenta)}</span>
                    <span className={`text-[10px] font-bold ${p.stock > 0 ? 'text-emerald-400' : 'text-danger'}`}>
                      {p.stock} en stock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (item.tipo === 'internet') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-textLight"><span className="font-bold">Producto:</span> <span className="text-primary">{item.consulta}</span></p>
          {item.referencia && <p className="text-sm text-textMuted"><span className="font-bold">Referencia:</span> {item.referencia}</p>}
          {r.resumen && <p className="text-sm text-textLight bg-stone-800/50 rounded-lg p-3">{r.resumen}</p>}
          {r.comparaciones?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-textMuted uppercase border-b border-stone-700">
                  <tr>
                    <th className="py-2 pr-3">Producto</th>
                    <th className="py-2 pr-3">Marca</th>
                    <th className="py-2 pr-3">Precio</th>
                    <th className="py-2 pr-3">Pros</th>
                    <th className="py-2">Contras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {r.comparaciones.map((c, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 font-semibold text-textLight">{c.producto}</td>
                      <td className="py-2 pr-3 text-textMuted">{c.marca || '—'}</td>
                      <td className="py-2 pr-3 text-primary font-bold">{c.precio_aprox || '—'}</td>
                      <td className="py-2 pr-3 text-emerald-400">{c.pros || '—'}</td>
                      <td className="py-2 text-red-400">{c.contras || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.recomendaciones?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-textMuted mb-1">Recomendaciones:</p>
              {r.recomendaciones.map((rec, i) => (
                <p key={i} className="text-sm text-textLight">• <span className="font-bold">{rec.producto}</span>{rec.motivo && ` — ${rec.motivo}`}</p>
              ))}
            </div>
          )}
          {r.fuentes?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-textMuted mb-1">Fuentes:</p>
              {r.fuentes.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink size={10} /> {f.titulo}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.tipo === 'comparar') {
      const prods = r.productos || [];
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {prods.map((p, i) => (
              <span key={i} className="text-sm text-textLight font-bold">
                {i > 0 && <span className="text-textMuted mx-1">vs</span>}
                {p.nombre}
              </span>
            ))}
          </div>
          {r.resumen && <p className="text-sm text-textLight bg-stone-800/50 rounded-lg p-3">{r.resumen}</p>}
          {r.tabla_comparativa?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-textMuted uppercase border-b border-stone-700">
                  <tr>
                    <th className="py-2 pr-3">Atributo</th>
                    {prods.map((p, i) => (
                      <th key={i} className="py-2 pr-3">{p.nombre}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {r.tabla_comparativa.map((row, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 font-semibold text-textLight whitespace-nowrap">{row.atributo}</td>
                      {(row.valores || []).map((v, j) => (
                        <td key={j} className="py-2 pr-3 text-textMuted">{v || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.veredicto && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-xs text-emerald-400 font-bold">Veredicto: {r.veredicto.ganador}</p>
              {r.veredicto.motivo && <p className="text-xs text-textMuted mt-1">{r.veredicto.motivo}</p>}
            </div>
          )}
          {r.recomendacion_vendedor && (
            <p className="text-sm text-textLight italic"><span className="font-bold not-italic text-primary">Recomendación:</span> {r.recomendacion_vendedor}</p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-3">
            <Clock className="text-primary" size={28} />
            Historial de IA
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Consultas anteriores del asistente — {total} registro{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTipoFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!tipoFilter ? 'bg-primary text-white' : 'bg-surface border border-stone-700 text-textMuted hover:text-textLight'}`}
        >
          Todos
        </button>
        {TIPOS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTipoFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${tipoFilter === t.key ? 'bg-primary text-white' : 'bg-surface border border-stone-700 text-textMuted hover:text-textLight'}`}
            >
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Lista + Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista */}
        <div className={`space-y-2 ${selectedItem ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="bg-surface rounded-xl border border-stone-800 p-10 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-textMuted text-sm">Cargando historial...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-surface rounded-xl border border-stone-800 border-dashed p-10 flex flex-col items-center text-center gap-3">
              <Clock className="text-stone-600" size={32} />
              <p className="text-textMuted text-sm">No hay consultas registradas</p>
              <p className="text-textMuted text-xs">Usá el asistente y las consultas se guardarán acá</p>
            </div>
          ) : (
            <div className={`grid gap-2 ${selectedItem ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {items.map((item) => {
                const info = tipoInfo(item.tipo);
                const Icon = info.icon;
                const isSelected = selectedItem?._id === item._id;
                return (
                  <div
                    key={item._id}
                    className={`bg-surface rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/40 ${
                      isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-stone-800'
                    }`}
                    onClick={() => handleViewDetail(item._id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={14} className={info.color} />
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${info.color} bg-current/10`}>
                          {info.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-textMuted shrink-0">
                        {new Date(item.createdAt).toLocaleDateString('es-AR')} {new Date(item.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-textLight truncate">{item.titulo}</p>
                    <p className="text-xs text-textMuted truncate mt-0.5">{item.consulta}</p>
                    {item.fuente && (
                      <span className={`text-[10px] mt-2 inline-block px-1.5 py-0.5 rounded ${item.fuente === 'ia' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'}`}>
                        {item.fuente === 'ia' ? 'IA' : 'Local'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-surface border border-stone-700 text-textMuted hover:text-textLight disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-textMuted">Página {page} de {pages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pages}
                className="p-2 rounded-lg bg-surface border border-stone-700 text-textMuted hover:text-textLight disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Detalle */}
        {selectedItem && (
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-xl border border-stone-800 p-5 sticky top-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const info = tipoInfo(selectedItem.tipo);
                    const Icon = info.icon;
                    return (
                      <>
                        <Icon size={16} className={info.color} />
                        <span className="text-sm font-bold text-textLight">{info.label}</span>
                      </>
                    );
                  })()}
                  <span className="text-xs text-textMuted">
                    {new Date(selectedItem.createdAt).toLocaleDateString('es-AR')} {new Date(selectedItem.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reloadAsistente(selectedItem)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary hover:bg-primaryDark text-white flex items-center gap-1 transition-colors"
                  >
                    <ArrowRight size={12} /> Volver a consultar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem._id)}
                    className="p-1.5 rounded-lg text-textMuted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 rounded-lg text-textMuted hover:text-textLight hover:bg-stone-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                renderResultado(selectedItem)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIHistory;
