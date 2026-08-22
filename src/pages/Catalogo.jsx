import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';
import { Search, Package, MessageCircle, Plus, Minus, Trash2, X, ShoppingCart, CheckCircle2, Loader } from 'lucide-react';
import Chatbot from '../components/Chatbot';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderData, setOrderData] = useState({ nombre: '', telefono: '', notas: '' });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [weightInputs, setWeightInputs] = useState({});

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

  const isKg = (p) => p.unidadMedida === 'kg';

  const addToCart = useCallback((product, qty = 1) => {
    // Validar combos sin stock
    if (product.esCombo && product.comboVendible === false) {
      alert('❌ Este combo no tiene stock disponible en sus componentes. No se puede vender hasta reponer.');
      return;
    }
    setCart((prev) => {
      const exists = prev.find((i) => i.producto === product._id);
      if (exists) {
        return prev.map((i) =>
          i.producto === product._id
            ? { ...i, cantidad: Math.round((i.cantidad + qty) * 100) / 100 }
            : i
        );
      }
      return [...prev, {
        producto: product._id,
        nombre: product.nombre,
        precio: product.precioVenta,
        cantidad: Math.round(qty * 100) / 100,
        stock: product.stock,
        unidadMedida: product.unidadMedida || 'unidad',
      }];
    });
    setWeightInputs((prev) => ({ ...prev, [product._id]: '' }));
  }, []);

  const updateCartQty = useCallback((productId, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.producto !== productId) return i;
          const step = i.unidadMedida === 'kg' ? 0.5 : 1;
          const newQty = Math.round((i.cantidad + delta * step) * 100) / 100;
          return { ...i, cantidad: newQty };
        })
        .filter((i) => i.cantidad > 0.01);
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i.producto !== productId));
  }, []);

  const handleWeightInput = useCallback((productId, value) => {
    setWeightInputs((prev) => ({ ...prev, [productId]: value }));
  }, []);

  const submitWeight = useCallback((product) => {
    const raw = weightInputs[product._id];
    if (!raw && raw !== 0) return;
    const num = parseFloat(String(raw).replace(',', '.'));
    if (isNaN(num) || num <= 0) return;
    const qty = Math.round(num * 100) / 100;
    addToCart(product, qty);
  }, [weightInputs, addToCart]);

  const cartTotal = useMemo(() => cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.cantidad, 0), [cart]);

  const handleWhatsAppShare = () => {
    const grouped = {};
    products.forEach((p) => {
      const cat = p.categoria?.nombre || 'Sin categoría';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    const lines = ['*Catálogo Poroto PetShop*', ''];
    Object.entries(grouped).forEach(([cat, items]) => {
      lines.push(`*${cat}*`);
      items.forEach((p) => {
        const precio = formatCurrency(p.precioVenta);
        const unit = p.unidadMedida === 'kg' ? '/kg' : '';
        const stock = p.stock > 0 ? `Stock: ${p.stock}` : 'Sin stock';
        lines.push(`- ${p.nombre} — ${precio}${unit} (${stock})`);
      });
      lines.push('');
    });

    const url = window.location.origin + '/catalogo';
    lines.push(`Ver catálogo completo: ${url}`);
    const text = lines.join('%0A');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setOrderLoading(true);
    try {
      const { data } = await api.post('/orders/public', {
        clienteNombre: orderData.nombre,
        clienteTelefono: orderData.telefono,
        items: cart.map((i) => ({ producto: i.producto, cantidad: i.cantidad })),
        notas: orderData.notas,
      });
      setOrderSuccess(data);
      setCart([]);
      setShowOrderForm(false);

      const ownerPhone = import.meta.env.VITE_OWNER_WHATSAPP || '';
      const waLines = [
        `*Nuevo Pedido — ${data.numero}*`,
        '',
        `${data.clienteNombre}${data.clienteAsignado ? ' (cliente registrado)' : ''}`,
        `Tel: ${data.clienteTelefono}`,
        '',
        'Productos:',
        ...cart.map((i) => {
          const unit = i.unidadMedida === 'kg' ? 'kg' : 'un';
          return `- ${i.nombre} x${i.cantidad} ${unit} — ${formatCurrency(i.precio * i.cantidad)}`;
        }),
        '',
        `Total: ${formatCurrency(data.total)}`,
        orderData.notas ? `Notas: ${orderData.notas}` : '',
      ].filter(Boolean);
      const waText = waLines.join('%0A');

      if (ownerPhone) {
        window.open(`https://wa.me/${ownerPhone}?text=${waText}`, '_blank');
      } else {
        navigator.clipboard.writeText(waLines.join('\n'));
        alert('Mensaje copiado al portapapeles. Pegalo en WhatsApp del dueño.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar el pedido');
    } finally {
      setOrderLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#0f0f0f]">

      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Poroto PetShop</h1>
                <p className="text-xs text-neutral-500 leading-tight">Catálogo de productos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleWhatsAppShare}
                disabled={products.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                <MessageCircle size={16} />
                <span className="hidden sm:inline">Compartir</span>
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-sm font-semibold transition-colors border border-[#333]"
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Mi Pedido</span>
                {cartCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-600 text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-600 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#222] text-neutral-400 hover:bg-[#2a2a2a] border border-[#333]'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  selectedCategory === cat._id
                    ? 'text-white border-transparent'
                    : 'bg-[#222] text-neutral-400 hover:bg-[#2a2a2a] border-[#333]'
                }`}
                style={selectedCategory === cat._id ? { backgroundColor: cat.color || '#2a2a2a' } : {}}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 animate-pulse">
                <div className="h-3 bg-[#222] rounded w-20 mb-3" />
                <div className="h-5 bg-[#222] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#222] rounded w-1/3 mb-4" />
                <div className="h-8 bg-[#222] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-500">No se encontraron productos</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-4">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => {
                const inCart = cart.find((i) => i.producto === p._id);
                const soldByKg = isKg(p);
                const weightVal = weightInputs[p._id] || '';

                return (
                  <div
                    key={p._id}
                    className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 flex flex-col hover:border-[#333] transition-colors"
                  >
                    {/* Category + Stock badge */}
                    <div className="flex items-center justify-between mb-2">
                      {p.categoria && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: p.categoria.color ? `${p.categoria.color}20` : '#222',
                            color: p.categoria.color || '#888',
                          }}
                        >
                          {p.categoria.nombre}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${p.stock > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                        {p.stock > 0 ? `${p.stock} ${soldByKg ? 'kg' : 'un'} disp.` : 'Sin stock'}
                      </span>
                    </div>

                    {/* Product name - full */}
                    <h3 className="text-sm font-semibold text-white leading-snug mb-1">
                      {p.nombre}
                    </h3>

                    {/* Price */}
                    <p className="text-lg font-bold text-white mb-3">
                      {formatCurrency(p.precioVenta)}
                      {soldByKg && <span className="text-xs font-normal text-neutral-500 ml-1">/kg</span>}
                    </p>

                    {/* Weight input for kg products */}
                    {soldByKg && p.stock > 0 && !inCart && (
                      <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Kg"
                            value={weightVal}
                            onChange={(e) => handleWeightInput(p._id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitWeight(p); }}
                            className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-600 outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">kg</span>
                        </div>
                        <button
                          onClick={() => submitWeight(p)}
                          disabled={!weightVal || parseFloat(String(weightVal).replace(',', '.')) <= 0}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}

                    {/* Add button for unit products */}
                    {!soldByKg && p.stock > 0 && !inCart && !p.esCombo && (
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="w-full py-2 rounded-lg border border-[#333] text-neutral-300 text-sm font-medium hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors mb-3"
                      >
                        Agregar
                      </button>
                    )}

                    {/* Combo sin stock */}
                    {!soldByKg && p.esCombo && p.comboVendible === false && !inCart && (
                      <button
                        disabled
                        className="w-full py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium cursor-not-allowed mb-3"
                        title="Combo sin stock en componentes"
                      >
                        ⚠ Sin stock (combo)
                      </button>
                    )}

                    {/* In cart controls */}
                    {inCart && (
                      <div className="flex items-center justify-between bg-[#222] rounded-lg px-3 py-2 mb-3 border border-emerald-600/30">
                        <span className="text-xs text-emerald-400 font-medium">En tu pedido</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQty(p._id, -1)}
                            className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold text-white min-w-[40px] text-center">
                            {inCart.cantidad} {soldByKg ? 'kg' : 'un'}
                          </span>
                          <button
                            onClick={() => updateCartQty(p._id, 1)}
                            className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(p._id)}
                            className="w-7 h-7 rounded-md text-neutral-500 hover:text-red-400 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sold out */}
                    {p.stock <= 0 && (
                      <div className="py-2 text-center mb-3">
                        <span className="text-xs text-neutral-500 font-medium">Agotado</span>
                      </div>
                    )}

                    {/* Unit label */}
                    {soldByKg && (
                      <p className="text-xs text-neutral-600 mt-auto">Venta por kilo</p>
                    )}
                    {p.unidadMedida && p.unidadMedida !== 'unidad' && p.unidadMedida !== 'kg' && (
                      <p className="text-xs text-neutral-600 mt-auto">Venta por {p.unidadMedida}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#1a1a1a] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} Poroto PetShop — Precios sujetos a cambios sin previo aviso
          </p>
        </div>
      </footer>

      {/* ─── Cart Drawer ─── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-[#1a1a1a] shadow-2xl flex flex-col border-l border-[#2a2a2a]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white">Mi Pedido ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart size={36} className="mx-auto text-neutral-600 mb-3" />
                  <p className="text-sm text-neutral-500">Tu pedido está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const soldByKg = item.unidadMedida === 'kg';
                    const unit = soldByKg ? 'kg' : 'un';
                    return (
                      <div key={item.producto} className="flex items-center gap-3 py-3 border-b border-[#222] last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white leading-snug">{item.nombre}</p>
                          <p className="text-xs text-neutral-500">{formatCurrency(item.precio)} / {unit}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(item.producto, -1)}
                            className="w-7 h-7 rounded-md border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold text-white w-12 text-center">
                            {item.cantidad} {unit}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.producto, 1)}
                            className="w-7 h-7 rounded-md border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-white w-28 text-right">
                          {formatCurrency(item.precio * item.cantidad)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.producto)}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#2a2a2a] px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-white">Total</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(cartTotal)}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowOrderForm(true); }}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={18} />
                  Enviar Pedido por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Order Form Modal ─── */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowOrderForm(false)} />
          <div className="relative bg-[#1a1a1a] w-full max-w-md rounded-xl shadow-2xl border border-[#2a2a2a]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white">Confirmar Pedido</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-neutral-500 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitOrder} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Tu nombre *</label>
                <input
                  required
                  type="text"
                  value={orderData.nombre}
                  onChange={(e) => setOrderData({ ...orderData, nombre: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Teléfono (WhatsApp) *</label>
                <input
                  required
                  type="tel"
                  value={orderData.telefono}
                  onChange={(e) => setOrderData({ ...orderData, telefono: e.target.value })}
                  placeholder="11 5555 1234"
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-600 outline-none"
                />
                <p className="text-[11px] text-neutral-600 mt-1">Si ya sos cliente, se vincula automáticamente</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Notas (opcional)</label>
                <textarea
                  value={orderData.notas}
                  onChange={(e) => setOrderData({ ...orderData, notas: e.target.value })}
                  rows={2}
                  placeholder="Ej: Entregar después de las 18hs..."
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-600 outline-none resize-none"
                />
              </div>

              <div className="bg-[#222] rounded-lg p-4 border border-[#2a2a2a]">
                <p className="text-xs font-semibold text-neutral-500 mb-2">Resumen:</p>
                {cart.map((i) => {
                  const unit = i.unidadMedida === 'kg' ? 'kg' : 'un';
                  return (
                    <div key={i.producto} className="flex justify-between text-sm py-1">
                      <span className="text-neutral-300">{i.nombre} x{i.cantidad} {unit}</span>
                      <span className="font-medium text-white">{formatCurrency(i.precio * i.cantidad)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-[#333] mt-2 pt-2">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-white">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {orderLoading ? <Loader size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                {orderLoading ? 'Enviando...' : 'Enviar Pedido'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Success Modal ─── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOrderSuccess(null)} />
          <div className="relative bg-[#1a1a1a] w-full max-w-sm rounded-xl shadow-2xl border border-[#2a2a2a] p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">¡Pedido Enviado!</h3>
            <p className="text-sm text-neutral-400 mb-1">
              Número: <span className="font-mono font-bold text-white">{orderSuccess.numero}</span>
            </p>
            <p className="text-sm text-neutral-400 mb-4">
              Total: <span className="font-bold text-white">{formatCurrency(orderSuccess.total)}</span>
            </p>
            {orderSuccess.clienteAsignado && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
                Se vinculó a tu cuenta de cliente registrada
              </p>
            )}
            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white font-semibold transition-colors border border-[#333]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <Chatbot onAddToCart={(product) => addToCart(product, 1)} />
    </div>
  );
};

export default Catalogo;
