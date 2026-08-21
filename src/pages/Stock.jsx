import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const formatStock = (val) => {
  if (val === undefined || val === null) return '0';
  // Si es entero, lo dejamos como está, si tiene decimales, limitamos a 2
  return Number.isInteger(val) ? val.toString() : Number(val).toFixed(2);
};

const Stock = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tipo, setTipo] = useState('');

  useEffect(() => {
    fetchMovements();
  }, [startDate, endDate, tipo]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      let url = '/stock-movements?';
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (tipo) url += `tipo=${tipo}`;
      
      const res = await api.get(url);
      setMovements(res.data);
    } catch (error) {
      toast.error('Error al obtener movimientos');
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
       case 'entrada': return <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-500"><ArrowDownToLine size={16} /></div>;
       case 'salida': return <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-500"><ArrowUpFromLine size={16} /></div>;
       case 'ajuste': return <div className="p-1.5 rounded-md bg-beige/20 text-beige"><RefreshCcw size={16} /></div>;
       case 'venta': return <div className="p-1.5 rounded-md bg-primary/20 text-primary"><ArrowRightLeft size={16} /></div>;
       default: return null;
    }
  };

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
                  <tr key={m._id} className="hover:bg-stone-800/50 transition-colors">
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
