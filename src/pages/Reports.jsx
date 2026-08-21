import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Filter, DollarSign, TrendingUp, Receipt, Percent, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const Reports = () => {
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period, date]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let d = date;
      if (!d) d = new Date().toISOString().split('T')[0];
      
      const [resReport, resTop] = await Promise.all([
        api.get(`/reports/${period}?date=${d}`),
        api.get(`/reports/top-products?period=${period}&date=${d}`)
      ]);
      
      setData(resReport.data);
      setTopProducts(resTop.data);
    } catch (error) {
      toast.error('Error al generar reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
     if (!data || !data.timeline || data.timeline.length === 0) return toast.error('No hay datos para exportar');
     
     let csvContent = "data:text/csv;charset=utf-8,";
     csvContent += "Fecha/Hora,Total Ventas,Monto Total,Costo Total,Ganancia Neta\n";
     
     data.timeline.forEach(row => {
        const fechaHora = period === 'daily' ? `${row._id}:00` : row._id;
        const totalV = row.totalVentas || 0;
        const monto = row.montoTotal || 0;
        const costo = row.costoTotal || 0;
        const ganancia = row.gananciaNeta || 0;
        csvContent += `${fechaHora},${totalV},${monto},${costo},${ganancia}\n`;
     });

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `reporte_${period}_${date}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Reportes</h2>
          <p className="text-textMuted text-sm mt-1">Análisis de rendimiento y ventas</p>
        </div>
        
        <div className="bg-surface p-2 rounded-xl border border-stone-800 flex flex-wrap gap-2 items-center">
            <Filter size={18} className="text-stone-400 mx-2" />
            <select 
               value={period} 
               onChange={(e) => setPeriod(e.target.value)}
               className="bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            >
               <option value="daily">Diario</option>
               <option value="weekly">Semanal</option>
               <option value="monthly">Mensual</option>
               <option value="annual">Anual</option>
            </select>
            {(period === 'daily' || period === 'weekly') && (
               <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
               />
            )}
            <button 
               onClick={exportToCSV}
               disabled={loading || !data}
               className="bg-primary hover:bg-primaryDark text-white px-3 py-2 rounded-lg transition-colors flex items-center ml-2 shadow-lg disabled:opacity-50"
               title="Exportar a CSV"
            >
               <Download size={18} />
            </button>
        </div>
      </div>

      {loading || !data ? (
         <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <>
          {/* Tarjetas de Metricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-surface p-6 rounded-xl border border-stone-800">
               <p className="text-textMuted text-sm mb-1">Total Facturado</p>
               <p className="text-2xl font-bold text-textLight flex items-center">
                 <DollarSign size={20} className="text-primary mr-1" />
                 {formatCurrency(data.totales.montoTotal)}
               </p>
             </div>
             <div className="bg-surface p-6 rounded-xl border border-stone-800">
               <p className="text-textMuted text-sm mb-1">Costo Mercadería</p>
               <p className="text-2xl font-bold text-textLight flex items-center text-stone-400">
                 {formatCurrency(data.totales.costoTotal)}
               </p>
             </div>
             <div className="bg-surface p-6 rounded-xl border border-stone-800 relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-10"><TrendingUp size={100} /></div>
               <p className="text-textMuted text-sm mb-1 relative z-10">Ganancia Neta</p>
               <p className="text-2xl font-bold text-emerald-400 relative z-10">
                 {formatCurrency(data.totales.gananciaNeta)}
               </p>
             </div>
             <div className="bg-surface p-6 rounded-xl border border-stone-800 grid grid-cols-2 gap-4">
               <div>
                  <p className="text-textMuted text-sm mb-1">Tickets</p>
                  <p className="text-xl font-bold text-textLight">{data.totales.totalVentas}</p>
               </div>
               <div>
                  <p className="text-textMuted text-sm mb-1">Promedio</p>
                  <p className="text-xl font-bold text-textLight">{formatCurrency(data.totales.ticketPromedio)}</p>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grafico Evolucion */}
            <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-stone-800 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-textLight mb-6">Evolución de Ventas y Ganancias</h3>
              <div className="h-72 w-full flex-1">
                {data.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeline.map(t => ({...t, displayDate: period === 'daily' ? `${t._id}:00` : t._id}))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                        formatter={(value) => formatCurrency(value)} 
                      />
                      <Legend />
                      <Line type="monotone" name="Facturación" dataKey="montoTotal" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Ganancia" dataKey="gananciaNeta" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="h-full flex items-center justify-center text-textMuted">No hay datos para graficar</div>
                )}
              </div>
            </div>

            {/* Metodos de Pago */}
            <div className="bg-surface p-6 rounded-xl border border-stone-800 shadow-sm flex flex-col">
               <h3 className="text-lg font-semibold text-textLight mb-4 flex items-center">Métodos de Pago</h3>
               <div className="h-64 w-full relative">
                  {data.ventasPorMetodoPago.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={data.ventasPorMetodoPago}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="total"
                              nameKey="_id"
                           >
                              {data.ventasPorMetodoPago.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                              formatter={(value) => formatCurrency(value)} 
                           />
                        </PieChart>
                     </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-textMuted">No hay datos</div>}
                  {data.ventasPorMetodoPago.length > 0 && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-textMuted text-xs">Total</span>
                        <span className="text-lg font-bold text-textLight">{formatCurrency(data.totales.montoTotal)}</span>
                     </div>
                  )}
               </div>
               <div className="mt-4 grid grid-cols-2 gap-2">
                  {data.ventasPorMetodoPago.map((p, idx) => (
                     <div key={p._id} className="flex items-center text-sm capitalize">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-textLight">{p._id}</span>
                        <span className="text-textMuted ml-auto text-xs">{((p.total / data.totales.montoTotal) * 100).toFixed(1)}%</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-surface rounded-xl border border-stone-800 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-textLight p-6 border-b border-stone-800">Top 10 Productos Más Vendidos</h3>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-textLight">
                  <thead className="bg-stone-900 text-xs text-textMuted uppercase border-b border-stone-800">
                     <tr>
                        <th className="px-6 py-4">Ranking</th>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4 text-center">Unidades</th>
                        <th className="px-6 py-4 text-right">Ingresos</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                     {topProducts.map((p, i) => (
                        <tr key={p._id} className="hover:bg-stone-800/50">
                           <td className="px-6 py-3 font-bold text-stone-500">#{i + 1}</td>
                           <td className="px-6 py-3 font-medium">{p.nombre} <span className="text-xs text-textMuted block">{p.sku}</span></td>
                           <td className="px-6 py-3 text-center">
                              <span className="bg-primary/20 text-primary px-2 py-1 rounded font-bold">{p.cantidadVendida}</span>
                           </td>
                           <td className="px-6 py-3 text-right font-bold text-emerald-400">{formatCurrency(p.ingresosGenerados)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
