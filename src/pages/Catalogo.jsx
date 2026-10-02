import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../api/axios';
import {
  Search, Package, MessageCircle, Plus, Minus, Trash2, X, ShoppingCart,
  CheckCircle2, Loader, MapPin, Phone, Mail, Clock, ChevronDown, ChevronLeft, ChevronRight,
  PawPrint, Truck, ArrowRight, Sparkles, Heart, ShieldCheck, Store, Star
} from 'lucide-react';
import Chatbot from '../components/Chatbot';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
const isKg = (p) => p.unidadMedida === 'kg';

const STORE = {
  nombre: 'Poroto PetShop',
  tagline: 'Todo lo que tu mascota necesita, en un solo lugar',
  descripcion: 'Alimentos premium, accesorios, juguetes y mas. Elegi online, retira en el local o coordina el envio.',
  ubicacion: 'Av. Siempre Viva 742, Buenos Aires, Argentina',
  telefono: '+54 11 5555-1234',
  whatsapp: import.meta.env.VITE_OWNER_WHATSAPP || '5491162589131',
  email: 'info@porotopetshop.com',
  horario: 'Lunes a Sabado · 9:00 a 20:00 hs',
  instagram: 'https://instagram.com/porotopetshop',
  facebook: 'https://facebook.com/porotopetshop',
};

const BANNERS = [
  {
    id: 'b1',
    imagen: '/banners/banner1.jpg',
    fallbackGradient: 'from-orange-400 via-orange-500 to-amber-500',
    etiqueta: 'Nueva temporada',
    titulo: 'Todo para tu mascota',
    sub: 'Alimentos premium, accesorios y juguetes. Elegi online y pasalo a buscar o pedi el envio.',
    cta: 'Ver productos',
    action: 'products',
  },
  {
    id: 'b2',
    imagen: '/banners/banner2.jpg',
    fallbackGradient: 'from-amber-500 via-orange-500 to-orange-600',
    etiqueta: 'Pedidos rapidos',
    titulo: 'Pedi por WhatsApp',
    sub: 'Arma tu pedido en el catalogo y envialo directo al local. Rapido, facil y sin esperas.',
    cta: 'Hacer un pedido',
    action: 'order',
  },
];

const BENEFITS = [
  { icon: Truck, text: 'Envios a coordinar', sub: 'Coordinamos la entrega' },
  { icon: Store, text: 'Retiro en local', sub: 'Pasalo a buscar' },
  { icon: ShieldCheck, text: 'Pago seguro', sub: 'Efectivo, transferencia' },
  { icon: Heart, text: 'Atencion personalizada', sub: 'Te asesoramos' },
];

const CATEGORY_PRIORITY = ['comida para perro', 'comida para gato', 'piedras sanitarias', 'huesos', 'snacks', 'accesorios'];
const normalizeName = (nombre) => (nombre || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ─── Iconos SVG para redes (lucide-react los removio) ─── */
const InstagramIcon = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

/* ─── ProductCard ─── */
const ProductCard = ({ p, cart, onAdd, onUpdate, onRemove, lista = false }) => {
  const soldByKg = isKg(p);
  const vendeSuelto = soldByKg || (p.precioKilo && p.precioKilo > 0);
  const bagCart = cart.find((i) => i.producto === p._id && i.tipo === 'bag');
  const kiloCart = cart.find((i) => i.producto === p._id && i.tipo === 'kilo');

  const inCartControls = (item, label) => (
    <div className="flex items-center justify-between bg-orange-900/30 rounded-lg px-3 py-2 border border-orange-500/30">
      <span className="text-xs text-orange-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdate(p._id, -1, item.tipo)}
          className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="text-sm font-bold text-white min-w-[40px] text-center">
          {item.cantidad} {item.tipo === 'kilo' ? 'kg' : 'un'}
        </span>
        <button
          onClick={() => onUpdate(p._id, 1, item.tipo)}
          className="w-7 h-7 rounded-md bg-[#1a1a1a] border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={() => onRemove(p._id, item.tipo)}
          className="w-7 h-7 rounded-md text-neutral-500 hover:text-red-400 flex items-center justify-center transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  const kiloButtons = () => (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onAdd(p, 1, 'kilo')}
        disabled={p.stock <= 0}
        className="py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        1 kg
      </button>
      <button
        onClick={() => onAdd(p, 2, 'kilo')}
        disabled={p.stock <= 0}
        className="py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        2 kg
      </button>
    </div>
  );

  if (lista) {
    const btn = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-colors';
    const btnAdd = `${btn} bg-orange-500 hover:bg-orange-400 text-white`;
    const btnSec = `${btn} bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`;

    const precioLinea = (valor, sufijo) => (
      <p className="text-sm font-bold text-white whitespace-nowrap">
        {formatCurrency(valor)}
        {sufijo && <span className="text-xs font-normal text-neutral-500 ml-1">{sufijo}</span>}
      </p>
    );

    let precio;
    let acciones = null;

    if (soldByKg) {
      precio = precioLinea(p.precioVenta, '/kg');
      if (kiloCart) {
        acciones = inCartControls(kiloCart, 'En tu pedido');
      } else if (p.stock > 0) {
        acciones = (
          <div className="flex gap-2">
            <button onClick={() => onAdd(p, 1, 'kilo')} className={btnSec}>1 kg</button>
            <button onClick={() => onAdd(p, 2, 'kilo')} className={btnSec}>2 kg</button>
          </div>
        );
      }
    } else {
      precio = precioLinea(p.precioVenta, p.kilosPorBolsa ? `bolsa · ${p.kilosPorBolsa}kg` : '');
      if (vendeSuelto) {
        const bagAccion = bagCart
          ? inCartControls(bagCart, 'Bolsa en pedido')
          : p.stock > 0 && !p.esCombo
            ? <button onClick={() => onAdd(p, 1, 'bag')} className={btnSec}><ShoppingCart size={14} /> Agregar bolsa</button>
            : null;
        const sueltoAccion = kiloCart
          ? inCartControls(kiloCart, 'Suelto en pedido')
          : p.stock > 0
            ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 whitespace-nowrap">{formatCurrency(p.precioKilo)}/kg</span>
                <button onClick={() => onAdd(p, 1, 'kilo')} className={btnSec}>1 kg</button>
                <button onClick={() => onAdd(p, 2, 'kilo')} className={btnSec}>2 kg</button>
              </div>
            )
            : null;
        acciones = (
          <div className="flex flex-col items-end gap-2">
            {bagAccion}
            {sueltoAccion}
          </div>
        );
      } else if (p.esCombo && p.comboVendible === false && !bagCart) {
        acciones = (
          <button disabled className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium cursor-not-allowed">
            Sin stock (combo)
          </button>
        );
      } else if (p.stock > 0 && !bagCart && !p.esCombo) {
        acciones = (
          <button onClick={() => onAdd(p, 1, 'bag')} className={btnAdd}>
            <Plus size={14} /> Agregar
          </button>
        );
      } else if (bagCart) {
        acciones = inCartControls(bagCart, 'En tu pedido');
      }
    }

    return (
      <div className="group bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden hover:border-orange-500/40 transition-all">
        <div className="px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">{p.nombre}</h3>
              {p.categoria && (
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: p.categoria.color ? `${p.categoria.color}30` : 'rgba(0,0,0,0.5)',
                    color: p.categoria.color || '#ccc',
                    border: `1px solid ${p.categoria.color ? `${p.categoria.color}40` : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {p.categoria.nombre}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 truncate">
              {soldByKg
                ? 'Venta por kilo'
                : p.esCombo
                  ? 'Combo'
                  : p.unidadMedida && p.unidadMedida !== 'unidad'
                    ? `Venta por ${p.unidadMedida}`
                    : p.descripcion || 'Producto'}
              {p.stock <= 0 && <span className="text-neutral-600 font-medium"> · Agotado</span>}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            {precio}
            {acciones}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden hover:border-orange-500/40 hover:shadow-lg hover:shadow-black/30 transition-all flex flex-col">
      {/* Imagen del producto */}
      <div className="relative h-44 bg-[#222] overflow-hidden">
        {p.imagen ? (
          <img
            src={p.imagen}
            alt={p.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div
          className={`${p.imagen ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#222]`}
        >
          <PawPrint size={40} className="text-[#333]" />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {p.categoria && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm"
              style={{
                backgroundColor: p.categoria.color ? `${p.categoria.color}30` : 'rgba(0,0,0,0.5)',
                color: p.categoria.color || '#ccc',
                border: `1px solid ${p.categoria.color ? `${p.categoria.color}40` : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {p.categoria.nombre}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          {p.stock > 0 ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-orange-400/20 text-orange-400 border border-orange-500/30 backdrop-blur-sm">
              En stock
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-sm">
              Sin stock
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-white leading-snug mb-1 line-clamp-2 min-h-[2.5rem]">
          {p.nombre}
        </h3>

        {p.descripcion && (
          <p className="text-xs text-neutral-500 leading-relaxed mb-3 line-clamp-2">{p.descripcion}</p>
        )}

        <div className="mt-auto">
          {soldByKg ? (
            <>
              <p className="text-lg font-bold text-white mb-3">
                {formatCurrency(p.precioVenta)}
                <span className="text-xs font-normal text-neutral-500 ml-1">/kg</span>
              </p>
              {p.stock > 0 && !kiloCart && <div className="mb-3">{kiloButtons()}</div>}
              {kiloCart && inCartControls(kiloCart, 'En tu pedido')}
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-white mb-3">
                {formatCurrency(p.precioVenta)}
                {p.kilosPorBolsa && (
                  <span className="text-xs font-normal text-neutral-500 ml-1">bolsa · {p.kilosPorBolsa}kg</span>
                )}
              </p>

              {vendeSuelto ? (
                <div className="space-y-3">
                  {bagCart ? (
                    inCartControls(bagCart, 'Bolsa en pedido')
                  ) : p.stock > 0 && !p.esCombo && (
                    <button
                      onClick={() => onAdd(p, 1, 'bag')}
                      className="w-full py-2.5 rounded-lg border border-[#333] text-neutral-300 text-sm font-medium hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors"
                    >
                      Agregar bolsa
                    </button>
                  )}

                  <div className="border-t border-[#2a2a2a] pt-3">
                    <p className="text-xs text-neutral-500 mb-1.5">
                      Suelto: <span className="text-neutral-300 font-medium">{formatCurrency(p.precioKilo)}/kg</span>
                    </p>
                    {kiloCart ? (
                      inCartControls(kiloCart, 'Suelto en pedido')
                    ) : p.stock > 0 ? (
                      kiloButtons()
                    ) : (
                      <p className="text-xs text-neutral-600">Agotado</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {p.stock > 0 && !bagCart && !p.esCombo && (
                    <button
                      onClick={() => onAdd(p, 1, 'bag')}
                      className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Agregar al pedido
                    </button>
                  )}
                  {p.esCombo && p.comboVendible === false && !bagCart && (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium cursor-not-allowed"
                    >
                      Sin stock (combo)
                    </button>
                  )}
                  {bagCart && inCartControls(bagCart, 'En tu pedido')}
                </>
              )}
            </>
          )}

          {p.stock <= 0 && !bagCart && !kiloCart && (
            <div className="py-2 text-center">
              <span className="text-xs text-neutral-500 font-medium">Agotado</span>
            </div>
          )}

          {soldByKg && <p className="text-xs text-neutral-600 mt-2">Venta por kilo</p>}
          {p.unidadMedida && p.unidadMedida !== 'unidad' && p.unidadMedida !== 'kg' && (
            <p className="text-xs text-neutral-600 mt-2">Venta por {p.unidadMedida}</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Catalogo (Landing Page + E-commerce) ─── */
const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openCat, setOpenCat] = useState(null);
  const [banner, setBanner] = useState(0);
  const [bannerErrors, setBannerErrors] = useState({});

  const toggleSeccion = (id) => {
    setOpenCat((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (searchTerm.trim()) setOpenCat('all');
    else if (selectedCategory !== 'all') setOpenCat(selectedCategory);
    else setOpenCat(null);
  }, [searchTerm, selectedCategory]);

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderData, setOrderData] = useState({ nombre: '', telefono: '', notas: '' });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const productsRef = useRef(null);

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

  useEffect(() => {
    const t = setInterval(() => setBanner((b) => (b + 1) % BANNERS.length), 7000);
    return () => clearInterval(t);
  }, []);

  const addToCart = useCallback((product, qty = 1, tipo = 'bag') => {
    if (product.esCombo && product.comboVendible === false) {
      alert('Este combo no tiene stock disponible en sus componentes.');
      return;
    }
    const esKilo = tipo === 'kilo';
    const key = `${product._id}:${tipo}`;
    const precio = esKilo
      ? (Number(product.precioKilo) > 0 ? Number(product.precioKilo) : Number(product.precioVenta))
      : Number(product.precioVenta);
    setCart((prev) => {
      const exists = prev.find((i) => i.key === key);
      if (exists) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, cantidad: Math.round((i.cantidad + qty) * 100) / 100 }
            : i
        );
      }
      return [...prev, {
        key,
        producto: product._id,
        tipo,
        nombre: product.nombre,
        precio,
        cantidad: Math.round(qty * 100) / 100,
        stock: product.stock,
        unidadMedida: esKilo ? 'kg' : (product.unidadMedida || 'unidad'),
      }];
    });
  }, []);

  const updateCartQty = useCallback((productId, delta, tipo) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.producto !== productId || i.tipo !== tipo) return i;
          const step = i.tipo === 'kilo' ? 0.5 : 1;
          const newQty = Math.round((i.cantidad + delta * step) * 100) / 100;
          return { ...i, cantidad: newQty };
        })
        .filter((i) => i.cantidad > 0.01);
    });
  }, []);

  const removeFromCart = useCallback((productId, tipo) => {
    setCart((prev) => prev.filter((i) => i.producto !== productId || i.tipo !== tipo));
  }, []);

  const cartTotal = useMemo(() => cart.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.cantidad, 0), [cart]);

  const handleWhatsAppShare = () => {
    const grouped = {};
    products.filter(p => p.precioVenta > 0).forEach((p) => {
      const cat = p.categoria?.nombre || 'Sin categoria';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });

    const lines = ['*Catalogo Poroto PetShop*', ''];
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
    lines.push(`Ver catalogo completo: ${url}`);
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
        items: cart.map((i) => ({ producto: i.producto, cantidad: i.cantidad, esVentaSuelta: i.tipo === 'kilo' })),
        notas: orderData.notas,
      });
      setOrderSuccess(data);
      setCart([]);
      setShowOrderForm(false);

      const ownerPhone = import.meta.env.VITE_OWNER_WHATSAPP || '5491162589131';
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
        alert('Mensaje copiado al portapapeles. Pegalo en WhatsApp del dueno.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar el pedido');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleBannerCta = (action) => {
    if (action === 'order') {
      window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent('¡Hola! Quiero hacer un pedido en Poroto PetShop')}`, '_blank');
    } else {
      productsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const goToSection = (id) => {
    setSelectedCategory('all');
    setSearchTerm('');
    setTimeout(() => document.getElementById('sec-' + id)?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  const handleBannerError = (id) => {
    setBannerErrors((prev) => ({ ...prev, [id]: true }));
  };

  const filtered = useMemo(() => {
    let result = products.filter(p => p.precioVenta > 0);
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoria?._id === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))
      );
    }
    return result;
  }, [products, selectedCategory, searchTerm]);

  const sections = useMemo(() => {
    const groups = new Map();
    filtered.forEach(p => {
      const id = p.categoria?._id || 'sin-categoria';
      if (!groups.has(id)) {
        groups.set(id, { id, nombre: p.categoria?.nombre || 'Sin categoria', color: p.categoria?.color, items: [] });
      }
      groups.get(id).items.push(p);
    });
    return [...groups.values()].sort((a, b) => {
      const pa = CATEGORY_PRIORITY.indexOf(normalizeName(a.nombre));
      const pb = CATEGORY_PRIORITY.indexOf(normalizeName(b.nombre));
      const rankA = pa === -1 ? CATEGORY_PRIORITY.length : pa;
      const rankB = pb === -1 ? CATEGORY_PRIORITY.length : pb;
      return rankA - rankB;
    });
  }, [filtered]);

  const featuredProducts = useMemo(() => {
    return products
      .filter(p => p.precioVenta > 0 && p.stock > 0 && p.imagen)
      .slice(0, 4);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">

      {/* Franja superior */}
      <div className="bg-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-center gap-2 text-xs font-medium">
          <Truck size={14} />
          <span>Envios a coordinar · Retiro en el local seguro</span>
          <span className="hidden sm:inline text-orange-200">|</span>
          <span className="hidden sm:inline">{STORE.horario}</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#1a1a1a]/95 backdrop-blur border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
                <PawPrint size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{STORE.nombre}</h1>
                <p className="text-xs text-neutral-500 leading-tight">Catalogo online</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleWhatsAppShare}
                disabled={products.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333] text-white text-sm font-semibold transition-colors hover:border-orange-500/50 disabled:opacity-40"
              >
                <MessageCircle size={16} className="text-orange-400" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors shadow-lg shadow-orange-600/20"
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Mi Pedido</span>
                {cartCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO: Carrusel de banners con imagen ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${banner * 100}%)` }}
          >
            {BANNERS.map((b) => (
              <div
                key={b.id}
                className="min-w-full relative overflow-hidden h-[280px] sm:h-[340px] md:h-[400px]"
              >
                {/* Imagen de fondo o fallback gradient */}
                {!bannerErrors[b.id] ? (
                  <img
                    src={b.imagen}
                    alt={b.titulo}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => handleBannerError(b.id)}
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${b.fallbackGradient}`} />
                )}

                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                {/* Contenido */}
                <div className="relative h-full flex items-center">
                  <div className="px-6 sm:px-10 md:px-14 max-w-xl">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 text-white rounded-full px-3 py-1 mb-4 backdrop-blur-sm">
                      <Sparkles size={12} /> {b.etiqueta}
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3 drop-shadow-lg">
                      {b.titulo}
                    </h2>
                    <p className="text-white/90 text-sm sm:text-base mb-6 drop-shadow leading-relaxed">{b.sub}</p>
                    <button
                      onClick={() => handleBannerCta(b.action)}
                      className="inline-flex items-center gap-2 bg-white text-neutral-900 font-bold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
                    >
                      {b.cta}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flechas */}
          <button
            onClick={() => setBanner((b) => (b - 1 + BANNERS.length) % BANNERS.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setBanner((b) => (b + 1) % BANNERS.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ChevronRight size={20} />
          </button>

          {/* Puntos indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBanner(i)}
                className={`h-2 rounded-full transition-all ${i === banner ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Barra de beneficios ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                <b.icon size={18} className="text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{b.text}</p>
                <p className="text-[10px] text-neutral-500 truncate">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Filtros + Busqueda ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8" ref={productsRef}>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 space-y-3 sticky top-[72px] z-30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white'
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

      {/* ─── Productos destacados (solo cuando no hay filtro) ─── */}
      {!searchTerm && selectedCategory === 'all' && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <button onClick={() => toggleSeccion('destacados')} className="w-full flex items-center justify-between gap-3 text-left group">
            <div className="flex items-center gap-3">
              <Star size={20} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Destacados</h2>
            </div>
            <ChevronDown size={20} className={`text-neutral-400 transition-transform duration-300 group-hover:text-white ${openCat === 'destacados' ? 'rotate-180' : ''}`} />
          </button>
          <div className={`grid transition-all duration-300 ease-in-out ${openCat === 'destacados' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="pt-4 grid grid-cols-1 gap-2">
                {featuredProducts.map(p => (
                  <ProductCard
                    key={p._id}
                    p={p}
                    cart={cart}
                    onAdd={addToCart}
                    onUpdate={updateCartQty}
                    onRemove={removeFromCart}
                    lista
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Productos por categoria ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-32">
        {loading ? (
          <div className="grid grid-cols-1 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden animate-pulse px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#222] rounded w-1/3" />
                  <div className="h-3 bg-[#222] rounded w-1/4" />
                </div>
                <div className="h-8 bg-[#222] rounded w-28 shrink-0" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-500">No se encontraron productos</p>
          </div>
        ) : (
          <div className="space-y-10">
            <p className="text-sm text-neutral-500">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
            </p>
            {sections.map((sec) => {
              const open = openCat === sec.id || openCat === 'all';
              return (
                <section key={sec.id} id={'sec-' + sec.id} className="scroll-mt-36">
                  <button onClick={() => toggleSeccion(sec.id)} className="w-full flex items-center justify-between gap-3 text-left group">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-8 rounded-full" style={{ backgroundColor: sec.color || '#666' }} />
                      <div>
                        <h2 className="text-lg font-bold text-white">{sec.nombre}</h2>
                        <p className="text-xs text-neutral-500">{sec.items.length} producto{sec.items.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronDown size={20} className={`text-neutral-400 transition-transform duration-300 group-hover:text-white ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <div className="pt-4 grid grid-cols-1 gap-2">
                        {sec.items.map(p => (
                          <ProductCard
                            key={p._id}
                            p={p}
                            cart={cart}
                            onAdd={addToCart}
                            onUpdate={updateCartQty}
                            onRemove={removeFromCart}
                            lista
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Banner CTA final ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-extrabold text-white mb-1">¿No encontras lo que buscas?</h3>
            <p className="text-white/85 text-sm">Consulta por otros productos, tamannos o marcas. Te lo conseguimos.</p>
          </div>
          <a
            href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent('¡Hola! Estaba viendo el catalogo y queria consultar por un producto')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-orange-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-neutral-100 transition-colors shrink-0"
          >
            <MessageCircle size={18} />
            Consultar por WhatsApp
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#2a2a2a] bg-[#161616] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Marca + redes */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <PawPrint size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">{STORE.nombre}</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mb-5">{STORE.descripcion}</p>
              <div className="flex gap-3">
                <a href={STORE.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#222] hover:bg-orange-500/20 border border-[#333] hover:border-orange-500/40 flex items-center justify-center text-neutral-400 hover:text-white transition-colors" aria-label="Instagram">
                  <InstagramIcon size={18} />
                </a>
                <a href={STORE.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#222] hover:bg-orange-500/20 border border-[#333] hover:border-orange-500/40 flex items-center justify-center text-neutral-400 hover:text-white transition-colors" aria-label="Facebook">
                  <FacebookIcon size={18} />
                </a>
                <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#222] hover:bg-orange-500/20 border border-[#333] hover:border-orange-500/40 flex items-center justify-center text-neutral-400 hover:text-white transition-colors" aria-label="WhatsApp">
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <span>{STORE.ubicacion}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <a href={`tel:${STORE.telefono.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{STORE.telefono}</a>
                </li>
                <li className="flex items-start gap-3">
                  <Mail size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <a href={`mailto:${STORE.email}`} className="hover:text-white transition-colors">{STORE.email}</a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <span>{STORE.horario}</span>
                </li>
              </ul>
            </div>

            {/* Categorias */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Categorias</h4>
              <ul className="space-y-2.5 text-sm">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <li key={cat._id}>
                      <button
                        onClick={() => goToSection(cat._id)}
                        className="text-neutral-400 hover:text-orange-400 transition-colors flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#666' }} />
                        {cat.nombre}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="text-neutral-600 text-xs">Se cargan al tener productos</li>
                )}
              </ul>
            </div>

            {/* Pedidos */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Pedidos</h4>
              <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                Arma tu pedido en el catalogo y envialo por WhatsApp. Te confirmamos disponibilidad y formas de pago.
              </p>
              <a
                href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent('¡Hola! Quiero hacer un pedido en Poroto PetShop')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <MessageCircle size={16} />
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#242424]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-600">
            <p>&copy; {new Date().getFullYear()} {STORE.nombre} — Precios sujetos a cambios sin previo aviso</p>
            <p className="flex items-center gap-1">
              Hecho con <span className="text-orange-400">♥</span> para tu mascota
            </p>
          </div>
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
                  <p className="text-sm text-neutral-500">Tu pedido esta vacio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const soldByKg = item.unidadMedida === 'kg';
                    const unit = soldByKg ? 'kg' : 'un';
                    return (
                      <div key={item.key} className="flex items-center gap-3 py-3 border-b border-[#222] last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white leading-snug">{item.nombre}</p>
                          <p className="text-xs text-neutral-500">{formatCurrency(item.precio)} / {unit}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(item.producto, -1, item.tipo)}
                            className="w-7 h-7 rounded-md border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold text-white w-12 text-center">
                            {item.cantidad} {unit}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.producto, 1, item.tipo)}
                            className="w-7 h-7 rounded-md border border-[#333] text-neutral-400 hover:text-white flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-white w-28 text-right">
                          {formatCurrency(item.precio * item.cantidad)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.producto, item.tipo)}
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
                  className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
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
                  placeholder="Juan Perez"
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Telefono (WhatsApp) *</label>
                <input
                  required
                  type="tel"
                  value={orderData.telefono}
                  onChange={(e) => setOrderData({ ...orderData, telefono: e.target.value })}
                  placeholder="11 5555 1234"
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500 outline-none"
                />
                <p className="text-[11px] text-neutral-600 mt-1">Si ya sos cliente, se vincula automaticamente</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Notas (opcional)</label>
                <textarea
                  value={orderData.notas}
                  onChange={(e) => setOrderData({ ...orderData, notas: e.target.value })}
                  rows={2}
                  placeholder="Ej: Entregar despues de las 18hs..."
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-orange-500/40 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              <div className="bg-[#222] rounded-lg p-4 border border-[#2a2a2a]">
                <p className="text-xs font-semibold text-neutral-500 mb-2">Resumen:</p>
                {cart.map((i) => {
                  const unit = i.unidadMedida === 'kg' ? 'kg' : 'un';
                  return (
                    <div key={i.key} className="flex justify-between text-sm py-1">
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
                className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
            <div className="w-14 h-14 rounded-full bg-orange-400/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">¡Pedido Enviado!</h3>
            <p className="text-sm text-neutral-400 mb-1">
              Numero: <span className="font-mono font-bold text-white">{orderSuccess.numero}</span>
            </p>
            <p className="text-sm text-neutral-400 mb-4">
              Total: <span className="font-bold text-white">{formatCurrency(orderSuccess.total)}</span>
            </p>
            {orderSuccess.clienteAsignado && (
              <p className="text-xs text-orange-400 bg-orange-400/10 border border-orange-500/20 rounded-lg px-3 py-2 mb-4">
                Se vinculo a tu cuenta de cliente registrada
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
