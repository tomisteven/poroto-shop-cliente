import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Search, Package, ShoppingBag, ChevronDown } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data } = await api.get('/products/public/catalog');
        setProducts(data);
        const cats = [...new Map(data.filter(p => p.categoria).map(p => [p.categoria._id, p.categoria])).values()];
        setCategories(cats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoria?._id === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term))
      );
    }
    return result;
  }, [products, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-stone-900 to-gray-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(168,85,247,0.08),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <ShoppingBag size={16} />
              Catálogo de Productos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Nuestros{' '}
              <span className="bg-gradient-to-r from-primary via-amber-300 to-beige bg-clip-text text-transparent">
                Productos
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto">
              Explorá nuestra variedad de productos con los mejores precios
            </p>
          </div>

          <div className="mt-10 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-stone-700/50 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-stone-500 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/5 border-stone-700/50 text-stone-400 hover:bg-white/10 hover:text-stone-200'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat._id
                    ? 'text-white shadow-lg'
                    : 'bg-white/5 border-stone-700/50 text-stone-400 hover:bg-white/10 hover:text-stone-200'
                }`}
                style={selectedCategory === cat._id ? { backgroundColor: cat.color || '#6366f1', borderColor: cat.color || '#6366f1', boxShadow: `0 10px 15px -3px ${cat.color || '#6366f1'}33` } : {}}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="flex flex-wrap gap-6 justify-center">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-full sm:w-[280px] bg-white/5 rounded-2xl border border-stone-700/50 overflow-hidden animate-pulse">
                <div className="h-48 bg-stone-800/50" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-stone-800/50 rounded w-3/4" />
                  <div className="h-3 bg-stone-800/50 rounded w-1/2" />
                  <div className="h-6 bg-stone-800/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-stone-600 mb-4" />
            <p className="text-stone-400 text-lg">No se encontraron productos</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-stone-500 text-sm">
                Mostrando <span className="text-stone-300 font-semibold">{filtered.length}</span> producto{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
              {filtered.map(p => (
                <div
                  key={p._id}
                  className="group w-full sm:w-[280px] bg-white/5 rounded-2xl border border-stone-700/50 overflow-hidden hover:border-stone-600/50 hover:bg-white/[0.07] transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="relative h-14 bg-gradient-to-r from-stone-800/80 to-stone-900/80 flex items-center px-5">
                    {p.categoria && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: p.categoria.color ? `${p.categoria.color}22` : '#6366f122', color: p.categoria.color || '#6366f1', border: `1px solid ${p.categoria.color ? `${p.categoria.color}44` : '#6366f144'}` }}
                      >
                        {p.categoria.nombre}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${p.stock > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${p.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.stock > 0 ? 'Stock' : 'Agotado'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 pt-4">
                    <h3 className="font-bold text-white text-base truncate group-hover:text-primary transition-colors">
                      {p.nombre}
                    </h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-2xl font-extrabold bg-gradient-to-r from-primary to-beige bg-clip-text text-transparent">
                        {formatCurrency(p.precioVenta)}
                      </span>
                    </div>
                    {p.unidadMedida && p.unidadMedida !== 'unidad' && (
                      <p className="text-[10px] text-stone-600 mt-2 uppercase tracking-wider">Venta por {p.unidadMedida}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-stone-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-600 text-sm">
            &copy; {new Date().getFullYear()} Poroto PetShop — Todos los precios pueden variar sin previo aviso
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Catalogo;
