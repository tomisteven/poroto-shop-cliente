import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
  ArrowLeft, ShoppingBag, Printer, X, TrendingUp, 
  Calendar as CalendarIcon, User as UserIcon, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const DailySales = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('todos');

  useEffect(() => {
    fetchDailySales();
  }, [date]);

  const fetchDailySales = async () => {
    setLoading(true);
    try {
      // Usar el endpoint de ventas con filtro de fecha para el día específico
      const res = await api.get(`/sales?startDate=${date}&endDate=${date}`);
      setSales(res.data);
    } catch (error) {
      toast.error('Error al obtener el desglose de ventas');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    paymentFilter === 'todos' || sale.metodoPago === paymentFilter
  );

  const totals = sales.reduce((acc, sale) => {
    if (sale.estado === 'completada') {
      acc.total += sale.totalFinal;
      acc.count += 1;
      
      // Totales por método de pago para el resumen
      if (sale.metodoPago === 'efectivo') acc.efectivo += sale.totalFinal;
      if (sale.metodoPago === 'tarjeta') acc.tarjeta += sale.totalFinal;
      if (sale.metodoPago === 'transferencia') acc.transferencia += sale.totalFinal;
    }
    return acc;
  }, { total: 0, count: 0, efectivo: 0, tarjeta: 0, transferencia: 0 });

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/statistics')}
            className="p-2 hover:bg-stone-800 rounded-xl transition-colors border border-stone-700 bg-surface shadow-lg text-textMuted hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest mb-1">
              <CalendarIcon size={14} />
              <span>{new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long' })}</span>
            </div>
            <h2 className="text-3xl font-black text-textLight">
              Ventas del {new Date(date + 'T12:00:00').toLocaleDateString('es-AR')}
            </h2>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="bg-surface/50 px-6 py-3 rounded-2xl border border-stone-800 shadow-xl backdrop-blur-md flex flex-col justify-center">
              <p className="text-[10px] text-textMuted font-bold uppercase mb-1">Operaciones</p>
              <p className="text-xl font-black text-primary">{totals.count}</p>
           </div>
           <div className="bg-surface/50 px-6 py-3 rounded-2xl border border-stone-800 shadow-xl backdrop-blur-md">
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] text-textMuted font-bold uppercase mb-1">Total Día</p>
                  <p className="text-xl font-black text-emerald-400">{formatCurrency(totals.total)}</p>
                </div>
                <div className="h-10 w-[1px] bg-stone-800 self-center"></div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-[8px] text-textMuted font-bold uppercase">Efectivo</p>
                    <p className="text-xs font-black text-textLight">{formatCurrency(totals.efectivo)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-textMuted font-bold uppercase">Tarjeta</p>
                    <p className="text-xs font-black text-textLight">{formatCurrency(totals.tarjeta)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-textMuted font-bold uppercase">Transf.</p>
                    <p className="text-xs font-black text-textLight">{formatCurrency(totals.transferencia)}</p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-stone-900/50 p-1.5 rounded-2xl border border-stone-800 self-start">
        {['todos', 'efectivo', 'tarjeta', 'transferencia'].map((m) => (
          <button
            key={m}
            onClick={() => setPaymentFilter(m)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              paymentFilter === m 
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                : 'text-textMuted hover:text-white hover:bg-stone-800'
            }`}
          >
            {m === 'todos' ? 'Ver Todas' : m}
          </button>
        ))}
      </div>

      {/* Sales Table */}
      <div className="flex-1 bg-surface/30 border border-stone-800 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-textLight border-collapse">
            <thead className="sticky top-0 bg-stone-900 z-10">
              <tr className="border-b border-stone-800 font-bold uppercase text-[10px] text-textMuted">
                <th className="px-6 py-5">Ticket</th>
                <th className="px-6 py-5">Hora</th>
                <th className="px-6 py-5">Empleado</th>
                <th className="px-6 py-5">Método de Pago</th>
                <th className="px-6 py-5 text-right">Monto Final</th>
                <th className="px-6 py-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-textMuted font-medium animate-pulse uppercase tracking-widest text-[10px]">Cargando detalle...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <ShoppingBag size={48} className="mb-4" />
                      <p className="text-lg">No hay ventas con este método de pago</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr 
                    key={sale._id} 
                    className="group hover:bg-stone-800/40 transition-all cursor-pointer"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono font-black text-primary group-hover:scale-110 inline-block transition-transform">{sale.numeroTicket}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-medium">{new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
                             <UserIcon size={12} className="text-stone-400" />
                          </div>
                          <span>{sale.empleado?.nombre || 'S/N'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-primary/60" />
                          <span className="uppercase text-[11px] font-black">{sale.metodoPago}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-base">
                      {formatCurrency(sale.totalFinal)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        sale.estado === 'completada' 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {sale.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal (Copy from Sales.jsx) */}
      {selectedSale && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white text-black w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col relative print:shadow-none print:w-[80mm] print:m-0 print:border-none animate-in zoom-in-95 duration-200">
               <button onClick={() => setSelectedSale(null)} className="absolute top-4 right-4 text-stone-400 hover:text-black no-print transition-colors z-20">
                  <X size={24} />
               </button>
               
               <div className="p-8 bg-white shrink-0 print:p-0 print:w-[80mm] print:text-[12px] font-mono">
                  <div className="text-center mb-6">
                     {selectedSale.estado === 'anulada' && <div className="text-red-600 font-bold border-2 border-red-600 inline-block px-4 py-1 rounded-lg mb-4 text-lg transform -rotate-12">ANULADA</div>}
                     <h2 className="text-2xl font-black uppercase tracking-tighter">POROTO PETSHOP</h2>
                     <p className="text-xs mt-2 font-black bg-gray-100 inline-block px-3 py-1 rounded-full print:bg-transparent print:border-y print:border-black print:block print:w-full italic">TICKET: {selectedSale.numeroTicket}</p>
                  </div>
                  
                  <div className="border-t border-b border-gray-200 border-dashed py-3 mb-4 text-[11px] flex justify-between font-bold text-gray-500 uppercase tracking-widest">
                     <span>{new Date(selectedSale.fecha).toLocaleDateString('es-AR')}</span>
                     <span>{new Date(selectedSale.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})} hs</span>
                  </div>

                  <table className="w-full text-xs text-left mb-6">
                     <thead>
                        <tr className="border-b-2 border-gray-100 font-black text-gray-400 uppercase">
                           <th className="pb-2 w-8">Cant</th>
                           <th className="pb-2">Descripción</th>
                           <th className="pb-2 text-right">Subtotal</th>
                        </tr>
                     </thead>
                     <tbody className="font-bold">
                        {selectedSale.items.map((item, idx) => (
                           <tr key={idx} className="border-b border-gray-50 last:border-0 align-top">
                              <td className="py-2">{item.cantidad}x</td>
                              <td className="py-2 pr-2">{item.producto?.nombre}
                                    {item.esVentaSuelta && item.kilosVendidos > 0 && (
                                       <span className="text-gray-400 font-bold"> · {formatCurrency(item.subtotal / item.kilosVendidos)}/kg</span>
                                    )}
                                 </td>
                              <td className="py-2 text-right whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>

                  <div className="border-t-2 border-gray-100 pt-4 text-sm text-right space-y-1">
                     <p className="text-gray-500 font-bold">Subtotal: {formatCurrency(selectedSale.subtotal)}</p>
                     {selectedSale.descuento > 0 && <p className="text-gray-500 font-bold">Descuento {selectedSale.descuento}%: -{formatCurrency(selectedSale.subtotal * (selectedSale.descuento / 100))}</p>}
                     <p className="text-xl font-black mt-3 border-t border-gray-900 pt-2">TOTAL: {formatCurrency(selectedSale.totalFinal)}</p>
                  </div>

                  <div className="mt-6 text-[10px] space-y-1 text-right border-t border-gray-100 pt-3 font-bold uppercase text-gray-400">
                     <p>Pago: <span className="text-gray-900">{selectedSale.metodoPago}</span></p>
                     {selectedSale.metodoPago === 'efectivo' && <p>Recibido: {formatCurrency(selectedSale.montoPagado)}</p>}
                     {selectedSale.metodoPago === 'efectivo' && <p>Vuelto: {formatCurrency(selectedSale.vuelto)}</p>}
                  </div>

                  <div className="mt-8 text-center text-[10px] font-bold text-gray-400 uppercase">
                     <p>Atendido por: {selectedSale.empleado?.nombre}</p>
                     <p className="mt-2 opacity-50">Documento no válido como factura</p>
                  </div>
               </div>
               
               <div className="p-6 bg-stone-50 no-print mt-auto border-t border-stone-100">
                  <button onClick={() => window.print()} className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl flex justify-center items-center hover:bg-black transition-all hover:scale-[1.02] shadow-xl group">
                     <Printer size={20} className="mr-3 group-hover:rotate-12 transition-transform" /> RE-IMPRIMIR TICKET
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default DailySales;
