import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Search, Package, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const formatStock = (val) => {
  if (val === undefined || val === null) return '0';
  // Si es entero, lo dejamos como está, si tiene decimales, limitamos a 2
  return Number.isInteger(val) ? val.toString() : Number(val).toFixed(2);
};

const formatKg = (gramos) => (gramos / 1000).toLocaleString('es-AR', { maximumFractionDigits: 3 });

const getTipoIcon = (tipo) => {
  switch(tipo) {
     case 'entrada': return <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-500"><ArrowDownToLine size={16} /></div>;
     case 'salida': return <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-500"><ArrowUpFromLine size={16} /></div>;
     case 'ajuste': return <div className="p-1.5 rounded-md bg-beige/20 text-beige"><RefreshCcw size={16} /></div>;
     case 'venta': return <div className="p-1.5 rounded-md bg-primary/20 text-primary"><ArrowRightLeft size={16} /></div>;
     default: return null;
  }
};

const StockRow = React.memo(function StockRow({ m }) {
  return (
    <tr className="hover:bg-stone-800/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
         <div>{new Date(m.fecha).toLocaleDateString()}</div>
         <div className="text-xs text-textMuted">{new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </td>
      <td className="px-6 py-4">
         <div className="flex items-center">
            {getTipoIcon(m.tipo)}
            <span className="ml-2 font-medium capitalize text-sm">{m.tipo}</span>
         </div>
      </td>
      <td className="px-6 py-4">
         <div className="font-medium text-primary">{m.producto?.nombre}</div>
         <div className="text-xs text-textMuted font-mono mt-0.5">{m.producto?.sku}</div>
      </td>
      <td className="px-4 py-4 text-center">
           <span className={`font-bold ${m.tipo === 'entrada' || (m.tipo === 'ajuste' && m.stockNuevo > m.stockAnterior) ? 'text-emerald-400' : 'text-danger'}`}>
              {m.tipo === 'entrada' || (m.tipo === 'ajuste' && m.stockNuevo > m.stockAnterior) ? '+' : '-'}{formatStock(m.cantidad)}
           </span>
       </td>
       <td className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
             <span className="text-textMuted line-through opacity-50">{formatStock(m.stockAnterior)}</span>
             <span className="text-white/20">→</span>
             <span className="font-bold text-textLight">{formatStock(m.stockNuevo)}</span>
          </div>
       </td>
      <td className="px-6 py-4 text-textMuted text-xs max-w-xs truncate">{m.motivo || '-'}</td>
      <td className="px-6 py-4 border-l border-stone-800 text-xs">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold">
               {m.usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[100px]">{m.usuario?.nombre}</span>
         </div>
      </td>
    </tr>
  );
});

const Stock = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bolsas, setBolsas] = useState([]);
  const [loadingBolsas, setLoadingBolsas] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tipo, setTipo] = useState('');
  const debouncedStartDate = useDebounce(startDate, 400);
  const debouncedEndDate = useDebounce(endDate, 400);
  const debouncedTipo = useDebounce(tipo, 300);

  const fetchBolsas = useCallback(async () => {
    setLoadingBolsas(true);
    try {
      const res = await api.get('/products');
      setBolsas(res.data.filter((p) => p.esBolsaAlimento));
    } catch {
      // No bloquea la lista de movimientos
    } finally {
      setLoadingBolsas(false);
    }
  }, []);

  useEffect(() => {
    fetchBolsas();
  }, [fetchBolsas]);

  const openBolsa = async (id) => {
    try {
      await api.post(`/products/${id}/abrir-bolsa`);
      toast.success('Bolsa abierta para venta suelta');
      fetchBolsas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al abrir la bolsa');
    }
  };

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/stock-movements?';
      if (debouncedStartDate) url += `startDate=${debouncedStartDate}&`;
      if (debouncedEndDate) url += `endDate=${debouncedEndDate}&`;
      if (debouncedTipo) url += `tipo=${debouncedTipo}`;
      
      const res = await api.get(url);
      setMovements(res.data);
    } catch {
      toast.error('Error al obtener movimientos');
    } finally {
      setLoading(false);
    }
  }, [debouncedStartDate, debouncedEndDate, debouncedTipo]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Movimientos de Stock</h2>
          <p className="text-textMuted text-sm mt-1">Historial de entradas, salidas y ajustes</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <select 
             value={tipo}
             onChange={e => setTipo(e.target.value)}
             className="bg-surface border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
           >
             <option value="">Todos los tipos</option>
             <option value="entrada">Entrada</option>
             <option value="salida">Salida</option>
             <option value="ajuste">Ajuste</option>
             <option value="venta">Venta</option>
           </select>
           <input 
             type="date" 
             value={startDate}
             onChange={e => setStartDate(e.target.value)}
             className="bg-surface border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
           />
           <span className="text-textMuted flex items-center">-</span>
           <input 
             type="date" 
             value={endDate}
             onChange={e => setEndDate(e.target.value)}
             className="bg-surface border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
           />
        </div>
      </div>

      <div className="bg-surface border border-stone-800 rounded-xl overflow-hidden shrink-0">
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-textLight flex items-center gap-2">
              <Package size={18} className="text-primary" /> Bolsas de alimento fraccionable
            </h3>
            <p className="text-xs text-textMuted mt-0.5">Stock de bolsas selladas y kilos restantes de la bolsa abierta para venta suelta</p>
          </div>
          <span className="text-[10px] font-bold uppercase text-textMuted bg-stone-800 px-2 py-1 rounded-full whitespace-nowrap">{bolsas.length} producto(s)</span>
        </div>
        <div className="divide-y divide-stone-800 max-h-96 overflow-y-auto custom-scrollbar">
          {loadingBolsas ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : bolsas.length === 0 ? (
            <p className="text-center py-8 text-textMuted text-sm">No hay productos marcados como bolsa de alimento.</p>
          ) : (
            bolsas.map((b) => {
              const gramos = Number(b.gramosBolsaAbierta) || 0;
              const totalBolsa = Number(b.kilosPorBolsa) * 1000;
              const disponibleKg = (Number(b.stock) * Number(b.kilosPorBolsa)) + (gramos / 1000);
              const pctRestante = totalBolsa > 0 ? (gramos / totalBolsa) * 100 : 0;
              const barColor = gramos > 0 ? (pctRestante > 40 ? 'bg-emerald-500' : pctRestante > 15 ? 'bg-warning' : 'bg-danger') : 'bg-stone-700';
              const estado = gramos > 0 ? `Abierta · ${formatKg(gramos)} kg de ${formatKg(totalBolsa)} kg` : 'Sin bolsa abierta';
              return (
                <div key={b._id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-textLight truncate">{b.nombre}</p>
                    <p className="text-xs text-textMuted mt-0.5">Bolsa de {formatStock(b.kilosPorBolsa)} kg · {formatStock(b.stock)} sellada(s) · {disponibleKg.toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg disponibles</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-80 shrink-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-[11px] mb-1 gap-2">
                        <span className={`font-bold uppercase ${gramos > 0 ? (pctRestante > 15 ? 'text-emerald-400' : 'text-danger') : 'text-textMuted'}`}>{estado}</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.max(0, Math.min(100, pctRestante))}%` }} />
                      </div>
                    </div>
                    {gramos <= 0 ? (
                      <button
                        onClick={() => openBolsa(b._id)}
                        disabled={Number(b.stock) < 1}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primaryDark disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <PackageOpen size={14} /> Abrir bolsa
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold uppercase text-textMuted shrink-0">{pctRestante.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 bg-surface border border-stone-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="text-xs text-textMuted uppercase bg-stone-900 border-b border-stone-800 sticky top-0">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-4 py-4 text-center">Cant.</th>
                <th className="px-4 py-4 text-center">Variación</th>
                <th className="px-6 py-4">Motivo / Factura</th>
                <th className="px-6 py-4 border-l border-stone-800">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-textMuted">No se encontraron movimientos registrados.</td></tr>
              ) : (
                movements.map((m) => (
                  <StockRow key={m._id} m={m} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
