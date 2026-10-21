import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Percent, Receipt, CreditCard, Landmark, Banknote, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPaymentMethodLabel } from '../utils/paymentFees';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

const hoyISO = () => new Date().toISOString().split('T')[0];
const mesActual = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const anioActual = () => String(new Date().getFullYear());

const PERIODOS = [
  { value: 'daily', label: 'Día' },
  { value: 'weekly', label: 'Semana' },
  { value: 'monthly', label: 'Mes' },
  { value: 'annual', label: 'Año' },
];

const Impuestos = () => {
  const [period, setPeriod] = useState('monthly');
  const [date, setDate] = useState(hoyISO());
  const [month, setMonth] = useState(mesActual());
  const [year, setYear] = useState(anioActual());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === 'daily' || period === 'weekly') params.set('date', date);
      if (period === 'monthly') {
        const [y, m] = month.split('-');
        params.set('year', y);
        params.set('month', m);
      }
      if (period === 'annual') params.set('year', year);

      const { data } = await api.get(`/reports/taxes?${params.toString()}`);
      setData(data);
    } catch {
      toast.error('Error al cargar los impuestos');
    } finally {
      setLoading(false);
    }
  }, [period, date, month, year]);

  useEffect(() => {
    fetchTaxes();
  }, [fetchTaxes]);

  const totales = data?.totales || { facturacion: 0, retencionIIBB: 0, comisionMP: 0, impuestosTotal: 0, ventas: 0 };
  const porMetodo = (data?.porMetodo || []).filter((m) => m.impuestosTotal > 0 || m.facturacion > 0);
  const porDia = data?.porDia || [];

  const cards = [
    { label: 'Facturación', value: totales.facturacion, icon: Receipt, color: 'text-textLight' },
    { label: 'Comisión Mercado Pago', value: totales.comisionMP, icon: CreditCard, color: 'text-amber-400' },
    { label: 'Retención IIBB', value: totales.retencionIIBB, icon: Landmark, color: 'text-orange-400' },
    { label: 'Total impuestos', value: totales.impuestosTotal, icon: TrendingDown, color: 'text-danger' },
    { label: 'Neto después de impuestos', value: totales.facturacion - totales.impuestosTotal, icon: Banknote, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight flex items-center gap-2">
            <Percent size={28} className="text-primary" /> Pago de Impuestos
          </h2>
          <p className="text-textMuted text-sm mt-1">
            Comisiones de Mercado Pago y retenciones de IIBB que se descuentan de la ganancia según el medio de pago.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface p-3 rounded-xl border border-stone-800 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold uppercase text-textMuted mb-1">Período</label>
          <div className="flex gap-1 bg-background p-1 rounded-lg border border-stone-700">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  period === p.value ? 'bg-primary text-white' : 'text-textMuted hover:text-textLight'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {(period === 'daily' || period === 'weekly') && (
          <div>
            <label className="block text-[11px] font-bold uppercase text-textMuted mb-1">
              {period === 'daily' ? 'Fecha' : 'Fecha dentro de la semana'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {period === 'monthly' && (
          <div>
            <label className="block text-[11px] font-bold uppercase text-textMuted mb-1">Mes</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {period === 'annual' && (
          <div>
            <label className="block text-[11px] font-bold uppercase text-textMuted mb-1">Año</label>
            <input
              type="number"
              min="2020"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-28 bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="bg-surface rounded-xl border border-stone-800 p-4">
                <div className="flex items-center gap-2 text-textMuted mb-2">
                  <c.icon size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{c.label}</span>
                </div>
                <p className={`text-lg font-black ${c.color}`}>{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>

          {/* Desglose por método */}
          <div className="bg-surface rounded-xl border border-stone-800 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-textLight p-5 border-b border-stone-800">Desglose por medio de pago</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-textLight">
                <thead className="bg-stone-900 text-xs text-textMuted uppercase border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">Medio de pago</th>
                    <th className="px-4 py-3 text-center">Ventas</th>
                    <th className="px-4 py-3 text-right">Facturado</th>
                    <th className="px-4 py-3 text-right">Comisión MP</th>
                    <th className="px-4 py-3 text-right">Retención IIBB</th>
                    <th className="px-4 py-3 text-right">Total impuestos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {porMetodo.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-textMuted">No hay ventas en este período.</td>
                    </tr>
                  ) : (
                    porMetodo.map((m) => (
                      <tr key={m._id} className="hover:bg-stone-800/50">
                        <td className="px-4 py-3 font-semibold">{getPaymentMethodLabel(m._id)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">{m.ventas}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{formatCurrency(m.facturacion)}</td>
                        <td className="px-4 py-3 text-right text-amber-400">{m.comisionMP > 0 ? `-${formatCurrency(m.comisionMP)}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-orange-400">{m.retencionIIBB > 0 ? `-${formatCurrency(m.retencionIIBB)}` : '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-danger">{m.impuestosTotal > 0 ? `-${formatCurrency(m.impuestosTotal)}` : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {porMetodo.length > 0 && (
                  <tfoot className="border-t-2 border-stone-700 bg-stone-900/60">
                    <tr className="font-black text-textLight">
                      <td className="px-4 py-3">TOTAL</td>
                      <td className="px-4 py-3 text-center">{totales.ventas}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(totales.facturacion)}</td>
                      <td className="px-4 py-3 text-right text-amber-400">-{formatCurrency(totales.comisionMP)}</td>
                      <td className="px-4 py-3 text-right text-orange-400">-{formatCurrency(totales.retencionIIBB)}</td>
                      <td className="px-4 py-3 text-right text-danger">-{formatCurrency(totales.impuestosTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Desglose por día */}
          {porDia.length > 0 && (
            <div className="bg-surface rounded-xl border border-stone-800 shadow-sm overflow-hidden">
              <h3 className="text-lg font-semibold text-textLight p-5 border-b border-stone-800">Detalle por día</h3>
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-sm text-textLight">
                  <thead className="bg-stone-900 text-xs text-textMuted uppercase border-b border-stone-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3 text-center">Ventas</th>
                      <th className="px-4 py-3 text-right">Facturado</th>
                      <th className="px-4 py-3 text-right">Comisión MP</th>
                      <th className="px-4 py-3 text-right">Retención IIBB</th>
                      <th className="px-4 py-3 text-right">Total impuestos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {porDia.map((d) => (
                      <tr key={d._id} className="hover:bg-stone-800/50">
                        <td className="px-4 py-3 font-mono text-xs">{d._id}</td>
                        <td className="px-4 py-3 text-center">{d.ventas}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(d.facturacion)}</td>
                        <td className="px-4 py-3 text-right text-amber-400">{d.comisionMP > 0 ? `-${formatCurrency(d.comisionMP)}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-orange-400">{d.retencionIIBB > 0 ? `-${formatCurrency(d.retencionIIBB)}` : '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-danger">{d.impuestosTotal > 0 ? `-${formatCurrency(d.impuestosTotal)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-textMuted">
            Las comisiones de Mercado Pago y las retenciones de IIBB no modifican el precio que paga el cliente; se descuentan de la ganancia del comercio.
          </p>
        </>
      )}
    </div>
  );
};

export default Impuestos;
