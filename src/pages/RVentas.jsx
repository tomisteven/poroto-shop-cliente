import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, Search,
  Percent, Download, Weight, Box
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const fmt = (val) => {
  const n = Number(val);
  if (Number.isInteger(n)) return n.toFixed(0);
  return parseFloat(n.toFixed(3)).toString();
};

const RVentas = () => {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState('cantidadVendida');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [res, catRes] = await Promise.all([
        api.get('/reports/sales-stats'),
        api.get('/categories')
      ]);
      setData(res.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Error al cargar estadísticas de ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredByCategory = data?.products.filter(p =>
    !categoryFilter || p.categoria === categoryFilter
  ) || [];

  const filteredProducts = filteredByCategory.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const multiplier = sortDir === 'desc' ? -1 : 1;
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    return aVal > bVal ? multiplier : aVal < bVal ? -multiplier : 0;
  });

  const totalUnidad = sortedProducts.reduce((acc, p) => acc + p.cantidadUnidad, 0);
  const totalSuelta = sortedProducts.reduce((acc, p) => acc + p.cantidadSuelta, 0);

  const filteredSummary = {
    facturacionTotal: filteredByCategory.reduce((acc, p) => acc + p.ingresosGenerados, 0),
    costoTotal: filteredByCategory.reduce((acc, p) => acc + p.costoTotal, 0),
    gananciaTotal: filteredByCategory.reduce((acc, p) => acc + p.ganancia, 0),
    margenGeneral: (() => {
      const ing = filteredByCategory.reduce((acc, p) => acc + p.ingresosGenerados, 0);
      const cost = filteredByCategory.reduce((acc, p) => acc + p.costoTotal, 0);
      return ing > 0 ? ((ing - cost) / ing * 100) : 0;
    })(),
    totalVentas: data?.summary.totalVentas || 0,
    productosConVentas: filteredByCategory.filter(p => p.cantidadVendida > 0).length
  };

  const exportToCSV = () => {
    if (!data || !data.products.length) return toast.error('No hay datos para exportar');

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Producto,SKU,Categoria,Unid. Vendidas,Kilos Vendidos,Ingresos x Unidad,Ingresos x Kilo,Ingresos Totales,Costo,Ganancia,Margen %\n";

    sortedProducts.forEach((p, i) => {
      csvContent += `${i + 1},"${p.nombre}",${p.sku},${p.categoria},${fmt(p.cantidadUnidad)},${fmt(p.cantidadSuelta)},${p.ingresosUnidad},${p.ingresosSuelta},${p.ingresosGenerados},${p.costoTotal},${p.ganancia},${p.margen.toFixed(1)}%,${p.stockActual}\n`;
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "estadisticas_ventas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const summary = categoryFilter ? filteredSummary : (data?.summary || {});
  const chartData = sortedProducts.slice(0, 10);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-textLight">R - Ventas</h2>
          <p className="text-textMuted text-sm mt-1">Estadísticas completas de ventas por producto</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !categoryFilter
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'bg-surface text-textMuted hover:text-textLight border border-stone-700'
          }`}
        >
          Todas
        </button>
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => setCategoryFilter(cat.nombre)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              categoryFilter === cat.nombre
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-surface text-textMuted hover:text-textLight border border-stone-700'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-stone-800">
          <p className="text-textMuted text-xs mb-1">Facturación Total</p>
          <p className="text-lg font-bold text-textLight flex items-center">
            <DollarSign size={16} className="text-primary mr-1" />
            {formatCurrency(summary.facturacionTotal)}
          </p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-stone-800">
          <p className="text-textMuted text-xs mb-1">Costo Total</p>
          <p className="text-lg font-bold text-stone-400">{formatCurrency(summary.costoTotal)}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-stone-800">
          <p className="text-textMuted text-xs mb-1">Ganancia Neta</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(summary.gananciaTotal)}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-stone-800">
          <p className="text-textMuted text-xs mb-1">Margen General</p>
          <p className="text-lg font-bold text-amber-400 flex items-center">
            <Percent size={16} className="mr-1" />
            {summary.margenGeneral?.toFixed(1)}%
          </p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-stone-800">
          <p className="text-textMuted text-xs mb-1">Ventas Realizadas</p>
          <p className="text-lg font-bold text-textLight flex items-center">
            <ShoppingCart size={16} className="text-primary mr-1" />
            {summary.totalVentas}
          </p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-stone-800">
          <p className="text-textMuted text-xs mb-1">Productos Vendidos</p>
          <p className="text-lg font-bold text-textLight flex items-center">
            <Package size={16} className="text-beige mr-1" />
            {summary.productosConVentas}
          </p>
        </div>
      </div>

      {sortedProducts.length > 0 && (
        <div className="bg-surface p-6 rounded-xl border border-stone-800">
          <h3 className="text-lg font-semibold text-textLight mb-4">Top 10 Más Vendidos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.toFixed(0)} />
                <YAxis type="category" dataKey="nombre" stroke="#94a3b8" fontSize={11} width={140} tickFormatter={(val) => val.length > 18 ? val.slice(0, 18) + '...' : val} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  formatter={(value, name) => [value.toFixed(0), name === 'cantidadVendida' ? 'Unidades' : '']}
                />
                <Bar dataKey="cantidadVendida" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-stone-800 overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-textLight">
            Productos
            <span className="text-sm font-normal text-textMuted ml-2">
              ({sortedProducts.length} productos con ventas)
            </span>
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="divide-y divide-stone-800">
          {sortedProducts.length === 0 && (
            <div className="px-4 py-12 text-center text-textMuted">
              No se encontraron productos{search ? ` para "${search}"` : ' con ventas'}
            </div>
          )}
          {sortedProducts.map((p, i) => {
            const actualRank = filteredProducts.indexOf(p) + 1;
            const esBolsa = p.cantidadUnidad > 0;
            const esSuelta = p.cantidadSuelta > 0;
            const vendioAmbos = esBolsa && esSuelta;
            return (
              <div key={p._id} className="p-4 hover:bg-stone-800/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Izquierda: Rank + Nombre + Tipo de venta */}
                  <div className="flex items-center gap-3 lg:w-72 shrink-0">
                    <div className={'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 ' + (actualRank <= 3 ? 'bg-primary/20 text-primary' : 'bg-stone-800 text-textMuted')}>
                      #{actualRank}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-textLight">{p.nombre}</p>
                      <p className="text-[10px] text-textMuted">{p.categoria} · {p.sku}</p>
                    </div>
                  </div>

                  {/* Centro: Tipo de venta + Cantidad */}
                  <div className="flex flex-wrap items-center gap-3 lg:flex-1">
                    {esBolsa && (
                      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                        <Box size={14} className="text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-blue-300/70 uppercase font-bold">Bolsa cerrada</p>
                          <p className="text-sm font-extrabold text-blue-400">{fmt(p.cantidadUnidad)} vendidas</p>
                        </div>
                        {p.ingresosUnidad > 0 && (
                          <span className="text-[10px] text-blue-300/50 ml-1">{formatCurrency(p.ingresosUnidad)}</span>
                        )}
                      </div>
                    )}
                    {esSuelta && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        <Weight size={14} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-amber-300/70 uppercase font-bold">Por kilo</p>
                          <p className="text-sm font-extrabold text-amber-400">{fmt(p.cantidadSuelta)} kg</p>
                        </div>
                        {p.ingresosSuelta > 0 && (
                          <span className="text-[10px] text-amber-300/50 ml-1">{formatCurrency(p.ingresosSuelta)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Derecha: Facturó, Costo, Ganancia, Margen */}
                  <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4 lg:gap-6 shrink-0">
                    <div className="text-center min-w-[90px]">
                      <p className="text-[10px] text-textMuted uppercase font-bold">Facturó</p>
                      <p className="text-sm font-bold text-textLight">{formatCurrency(p.ingresosGenerados)}</p>
                    </div>
                    <div className="text-center min-w-[90px]">
                      <p className="text-[10px] text-textMuted uppercase font-bold">Costo</p>
                      <p className="text-sm font-bold text-stone-400">{formatCurrency(p.costoTotal)}</p>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <p className="text-[10px] text-textMuted uppercase font-bold">Ganancia</p>
                      <p className={'text-base font-extrabold ' + (p.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {formatCurrency(p.ganancia)}
                      </p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-[10px] text-textMuted uppercase font-bold">Margen</p>
                      <span className={'text-sm font-extrabold ' + (p.margen >= 30 ? 'text-emerald-400' : p.margen >= 15 ? 'text-amber-400' : 'text-red-400')}>
                        {p.margen.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RVentas;
