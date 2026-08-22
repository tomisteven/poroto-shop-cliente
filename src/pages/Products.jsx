import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { useDebounce } from '../hooks/useDebounce';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Search, Edit2, Trash2, X, PackagePlus, Plus, Minus, Download, CheckSquare, Square, ChevronDown, Sparkles, Loader, Puzzle, Trash } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const formatStock = (val) => {
  if (val === undefined || val === null) return '0';
  return Number.isInteger(val) ? val.toString() : Number(val).toFixed(2);
};

const Products = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterWithoutMovement, setFilterWithoutMovement] = useState(false);
  const [filterOnlyCombos, setFilterOnlyCombos] = useState(false);
  const [withoutMovementData, setWithoutMovementData] = useState(null);
  const [loadingWM, setLoadingWM] = useState(false);

  const withoutMovementIds = withoutMovementData
    ? new Set(withoutMovementData.products.map(p => p._id))
    : new Set();

  const displayProducts = products.filter(p => {
    if (filterOnlyCombos && !p.esCombo) return false;
    if (filterWithoutMovement && !withoutMovementIds.has(p._id)) return false;
    return true;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', sku: '', categoria: '', precioCompra: 0, precioVenta: 0, 
    stock: 0, stockMinimo: 5, unidadMedida: 'unidad', proveedor: '', imagen: '',
    esGenerico: false, esBolsaAlimento: false, kilosPorBolsa: '', precioKilo: '', margenSuelto: 42,
    notasIA: ''
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockFormData, setStockFormData] = useState({ tipo: 'entrada', cantidad: '', motivo: '' });
  const [stockProduct, setStockProduct] = useState(null);

  // Combo Manual
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [comboForm, setComboForm] = useState({
    nombre: '',
    descripcion: '',
    sku: '',
    categoria: '',
    descuentoPorcentaje: 10,
    items: [], // [{productoId, cantidad}]
    imagen: ''
  });
  const [comboSearch, setComboSearch] = useState('');
  const [comboLoading, setComboLoading] = useState(false);

  // Selección masiva
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [showBulkValueInput, setShowBulkValueInput] = useState(false);
  const [loadingBulk, setLoadingBulk] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, categoria: res.data[0]._id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/products?';
      if (debouncedSearch) url += `search=${debouncedSearch}&`;
      if (selectedCategory !== 'all') url += `category=${selectedCategory}`;
      
      const res = await api.get(url);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory]);

  const calculateMargin = (compra, venta) => {
    if (!compra || compra === 0) return 0;
    return (((venta - compra) / compra) * 100).toFixed(2);
  };

  const handleMarginChange = (e) => {
    const margin = parseFloat(e.target.value) || 0;
    const compra = parseFloat(formData.precioCompra) || 0;
    const newVenta = compra * (1 + (margin / 100));
    setFormData({ ...formData, precioVenta: parseFloat(newVenta.toFixed(2)) });
  };

  const syncKiloFields = (fd, changed) => {
    const kilos = parseFloat(fd.kilosPorBolsa) || 0;
    const venta = parseFloat(fd.precioVenta) || 0;
    const margen = parseFloat(fd.margenSuelto) || 0;
    const pk = parseFloat(fd.precioKilo) || 0;
    const next = { ...fd };

    if (changed === 'margenSuelto' || changed === 'precioVenta' || changed === 'kilosPorBolsa') {
      if (kilos > 0 && venta > 0) {
        const derived = (venta / kilos) * (1 + margen / 100);
        next.precioKilo = parseFloat(derived.toFixed(2));
      }
    } else if (changed === 'precioKilo') {
      if (kilos > 0 && venta > 0 && pk > 0) {
        const derived = ((pk * kilos) / venta - 1) * 100;
        next.margenSuelto = Math.max(0, Math.round(derived));
      }
    }
    return next;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = { ...formData, [name]: type === 'checkbox' ? checked : value };
    if (name === 'margenSuelto' || name === 'precioKilo' || name === 'kilosPorBolsa' || name === 'precioVenta') {
      return setFormData(syncKiloFields(next, name));
    }
    setFormData(next);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      nombre: '', descripcion: '', sku: '', categoria: categories[0]?._id || '', 
      precioCompra: 0, precioVenta: 0, stock: 0, stockMinimo: 5, 
      unidadMedida: 'unidad', proveedor: '', imagen: '',
      esGenerico: false, esBolsaAlimento: false, kilosPorBolsa: '', precioKilo: '', margenSuelto: 42,
      notasIA: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingId(p._id);
    setFormData({
      nombre: p.nombre, descripcion: p.descripcion || '', sku: p.sku, categoria: p.categoria._id, 
      precioCompra: p.precioCompra, precioVenta: p.precioVenta, 
      stock: p.stock, stockMinimo: p.stockMinimo, 
      unidadMedida: p.unidadMedida, proveedor: p.proveedor || '', imagen: p.imagen || '',
      esGenerico: p.esGenerico || false, esBolsaAlimento: p.esBolsaAlimento || false, 
      kilosPorBolsa: p.kilosPorBolsa || '', precioKilo: p.precioKilo || '', margenSuelto: p.margenSuelto || 42,
      notasIA: p.notasIA || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    }
  };

  const [loadingDesc, setLoadingDesc] = useState(false);

  const handleGenerateDescription = async () => {
    const nombre = formData.nombre.trim();
    if (!nombre) return toast.error('Escribí el nombre del producto primero');
    setLoadingDesc(true);
    try {
      const { data } = await api.post('/recommendations/generate-description', {
        nombre,
        notas: formData.notasIA,
      });
      setFormData((prev) => ({ ...prev, descripcion: data.descripcion }));
      toast.success('Descripción generada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al generar descripción');
    } finally {
      setLoadingDesc(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Producto eliminado');
        fetchProducts();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const openStockModal = (p) => {
    setStockProduct(p);
    setStockFormData({ tipo: 'entrada', cantidad: '', motivo: '' });
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/products/${stockProduct._id}/stock`, stockFormData);
      toast.success('Stock ajustado exitosamente');
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al ajustar stock');
    }
  };

  const quickAdjustStock = async (product, amount) => {
    if (product.stock + amount < 0) return toast.error('El stock no puede ser negativo');
    
    try {
      const tipo = amount > 0 ? 'entrada' : 'salida';
      await api.patch(`/products/${product._id}/stock`, {
        tipo,
        cantidad: Math.abs(amount),
        motivo: 'Ajuste rápido'
      });
      toast.success('Stock actualizado');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar stock');
    }
  };

  const exportToCSV = () => {
     if (!products || products.length === 0) return toast.error('No hay productos para exportar');
     
     let csvContent = "data:text/csv;charset=utf-8,";
     csvContent += "Producto,SKU,Categoria,Stock,Unidad,Stock Minimo,Costo,Precio Venta,Margen (%)\n";
     
     products.forEach(p => {
        const nombre = `"${(p.nombre || '').replace(/"/g, '""')}"`;
        const sku = `"${(p.sku || '').replace(/"/g, '""')}"`;
        const categoria = `"${(p.categoria?.nombre || '').replace(/"/g, '""')}"`;
        const stock = p.stock || 0;
        const unidad = p.unidadMedida || '';
        const min = p.stockMinimo || 0;
        const costo = p.precioCompra || 0;
        const venta = p.precioVenta || 0;
        const margen = calculateMargin(costo, venta);

        csvContent += `${nombre},${sku},${categoria},${stock},${unidad},${min},${costo},${venta},${margen}\n`;
     });

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `inventario_completo.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // ── Selección masiva ──────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayProducts.map(p => p._id));
    }
  };

  const BULK_ACTIONS = [
    { value: 'eliminar',           label: '🗑️  Eliminar seleccionados',         needsValue: false },
    { value: 'limpiar_stock',      label: '📦  Limpiar stock (poner en 0)',     needsValue: false },
    { value: 'agregar_stock',      label: '➕  Agregar unidades de stock',    needsValue: true, placeholder: 'Cantidad a agregar', type: 'number' },
    { value: 'aplicar_margen_venta', label: '📈  Subir precio venta en %',     needsValue: true, placeholder: 'Ej: 5 (para +5%)', type: 'number' },
    { value: 'aplicar_margen_costo', label: '🔄  Recalcular precio desde costo en %', needsValue: true, placeholder: 'Ej: 42 (costo + 42%)', type: 'number' },
  ];

  const handleBulkActionChange = (e) => {
    const a = e.target.value;
    setBulkAction(a);
    setBulkValue('');
    const found = BULK_ACTIONS.find(x => x.value === a);
    setShowBulkValueInput(found?.needsValue || false);
  };

  const handleBulkExecute = async () => {
    if (!bulkAction) return toast.error('Seleccioná una acción');
    if (selectedIds.length === 0) return toast.error('No hay productos seleccionados');

    const accionInfo = BULK_ACTIONS.find(x => x.value === bulkAction);
    if (accionInfo?.needsValue && !bulkValue) return toast.error('Ingresá un valor para esta acción');

    const confirmMsg = `¿Ejecutar "${accionInfo?.label}" sobre ${selectedIds.length} productos?`;
    if (!window.confirm(confirmMsg)) return;

    setLoadingBulk(true);
    try {
      const res = await api.post('/products/bulk-action', {
        ids: selectedIds,
        accion: bulkAction,
        valor: bulkValue
      });
      toast.success(res.data.message);
      setSelectedIds([]);
      setBulkAction('');
      setBulkValue('');
      setShowBulkValueInput(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al ejecutar acción masiva');
    } finally {
      setLoadingBulk(false);
    setLoadingBulk(false);
    }
  };

  // ── Combo Manual ────────────────────────────────────────────────
  const openComboModal = () => {
    setComboForm({
      nombre: '',
      descripcion: '',
      sku: '',
      categoria: '', // Se auto-asigna al crear (categoría del primer item)
      descuentoPorcentaje: 10,
      items: [],
      imagen: ''
    });
    setComboSearch('');
    setIsComboModalOpen(true);
  };

  const addComboItem = (product) => {
    if (comboForm.items.some(i => i.productoId === product._id)) return toast.error('Ya está en el combo');
    setComboForm(prev => ({
      ...prev,
      items: [...prev.items, { productoId: product._id, cantidad: 1 }]
    }));
  };

  const removeComboItem = (index) => {
    setComboForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleComboSubmit = async (e) => {
    e.preventDefault();
    if (comboForm.items.length < 2) return toast.error('Mínimo 2 productos para un combo');
    if (!comboForm.nombre.trim()) return toast.error('Nombre requerido');

    setComboLoading(true);
    try {
      const items = comboForm.items.map(i => ({
        producto: i.productoId,
        cantidad: i.cantidad
      }));
      const res = await api.post('/ai-features/crear-combo', {
        nombre: comboForm.nombre,
        descripcion: comboForm.descripcion,
        items,
        descuentoPorcentaje: comboForm.descuentoPorcentaje,
      });
      toast.success(`✅ ${res.data.combo.nombre} creado - Margen: ${res.data.stats.margenPorcentaje}%`);
      setIsComboModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear combo');
    } finally {
      setComboLoading(false);
    }
  };

  const filteredComboProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(comboSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(comboSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-3xl font-bold text-textLight">
              Productos 
              {!loading && <span className="text-primary text-xl ml-3 opacity-80">({displayProducts.length})</span>}
            </h2>
            <p className="text-textMuted text-sm mt-1">Gestión de inventario y precios</p>
          </div>
          <button
            onClick={async () => {
              if (filterWithoutMovement) { setFilterWithoutMovement(false); return; }
              if (!withoutMovementData) {
                setLoadingWM(true);
                try {
                  const { data } = await api.get('/products/without-movement?months=3');
                  setWithoutMovementData(data);
} catch {
        toast.error('Error al cargar');
        return;
                } finally {
                  setLoadingWM(false);
                }
              }
              setFilterWithoutMovement(true);
            }}
            className={`self-start mt-1 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider whitespace-nowrap transition-all shadow-sm border-2 ${
              filterWithoutMovement
                ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                : 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-400'
            }`}
          >
            {loadingWM ? (
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> CARGANDO</span>
            ) : (
              <span className="flex items-center gap-1.5"><span className="text-[10px] opacity-80">VER PRODUCTOS SIN VENTAS</span></span>
            )}
          </button>
        </div>
<div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="bg-stone-800 hover:bg-stone-700 text-textLight px-4 py-2 rounded-lg transition-colors flex items-center border border-stone-700 shadow-sm"
              title="Exportar inventario a Excel/CSV"
            >
              <Download size={18} className="mr-2 text-emerald-400" />
              Exportar
            </button>
            <button
              onClick={() => setFilterOnlyCombos(!filterOnlyCombos)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                filterOnlyCombos
                  ? 'bg-purple-600 text-white shadow-purple-500/20'
                  : 'bg-stone-800 hover:bg-stone-700 text-textMuted border border-stone-700'
              }`}
              title="Filtrar solo combos"
            >
              <Puzzle size={14} className="mr-1" />
              Combos
            </button>
            {(user?.rol === 'admin') && (
               <>
                 <button 
                   onClick={openComboModal}
                   className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-purple-500/20"
                 >
                   <Puzzle size={18} className="mr-2" />
                   Crear Combo
                 </button>
                 <button 
                   onClick={openNewModal}
                   className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-primary/20"
                 >
                   <PlusCircle size={18} className="mr-2" />
                   Nuevo Producto
                 </button>
               </>
            )}
        </div>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-stone-800 shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-stone-700 rounded-lg pl-10 pr-4 py-2 text-textLight focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Acciones Masivas - visible cuando hay selección */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">{selectedIds.length} sel.</span>
              <select
                value={bulkAction}
                onChange={handleBulkActionChange}
                className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
              >
                <option value="">-- Acción masiva --</option>
                {BULK_ACTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {showBulkValueInput && (
                <input
                  type="number"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  placeholder={BULK_ACTIONS.find(x => x.value === bulkAction)?.placeholder || 'Valor'}
                  className="w-32 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
                />
              )}
              <button
                onClick={handleBulkExecute}
                disabled={!bulkAction || loadingBulk}
                className="bg-primary hover:bg-primaryDark disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center"
              >
                {loadingBulk ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Aplicando...
                  </>
                ) : 'Aplicar'}
              </button>
              <button
                onClick={() => { setSelectedIds([]); setBulkAction(''); setBulkValue(''); setShowBulkValueInput(false); }}
                className="text-textMuted hover:text-textLight text-xs px-2 py-2"
              ><X size={16}/></button>
            </div>
          )}
        </div>

        {/* Filtros de Categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'bg-stone-800 border-stone-700 text-textMuted hover:border-stone-500 hover:text-textLight'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat._id
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-stone-800 border-stone-700 text-textMuted hover:border-stone-500 hover:text-textLight'
              }`}
              style={selectedCategory === cat._id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {filterWithoutMovement && (
          <div className="flex items-center gap-2 px-1 text-xs text-red-400">
            <span>Mostrando solo productos sin movimiento ({withoutMovementData?.total || displayProducts.length})</span>
            <button onClick={() => setFilterWithoutMovement(false)} className="hover:text-white transition-colors"><X size={14} /></button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-surface border border-stone-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-textLight">
            <thead className="text-xs text-textMuted uppercase bg-stone-900 border-b border-stone-800 sticky top-0">
              <tr>
                <th className="px-4 py-4">
                  <button onClick={toggleSelectAll} className="text-textMuted hover:text-primary transition-colors">
                    {selectedIds.length === displayProducts.length && displayProducts.length > 0
                      ? <CheckSquare size={16} className="text-primary" />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-4">Producto</th>
                <th className="px-4 py-4">SKU</th>
                <th className="px-4 py-4">Categoría</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4 text-right">Compra</th>
                <th className="px-4 py-4 text-right">Venta</th>
                <th className="px-4 py-4 text-right">P. Kilo</th>
                <th className="px-4 py-4 text-right">Margen</th>
                <th className="px-4 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : displayProducts.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-10 text-textMuted">{filterWithoutMovement ? 'No hay productos sin movimiento en esta categoría.' : 'No se encontraron productos.'}</td></tr>
              ) : (
                displayProducts.map((p) => {
                   const isSelected = selectedIds.includes(p._id);
                   return (
                   <tr key={p._id} className={`hover:bg-stone-800/50 transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                     <td className="px-4 py-4">
                       <button onClick={() => toggleSelect(p._id)} className="text-textMuted hover:text-primary transition-colors">
                         {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                       </button>
                     </td>
                      <td className="px-4 py-4 font-medium flex items-center">
                        {p.imagen && (
                          <img src={p.imagen} alt={p.nombre} className="w-8 h-8 rounded shrink-0 mr-3 object-cover" />
                        )}
                        <span className="text-textLight">{p.nombre}</span>
                    </td>
                    <td className="px-4 py-4 text-textMuted font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-4">{p.categoria?.nombre || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => quickAdjustStock(p, -1)} disabled={p.stock <= 0} className="w-6 h-6 flex items-center justify-center rounded bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors disabled:opacity-50"><Minus size={12} /></button>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > p.stockMinimo ? 'bg-emerald-500/20 text-emerald-500' : p.stock > 0 ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>
                           {formatStock(p.stock)} {p.unidadMedida === 'unidad' ? 'u.' : p.unidadMedida}
                        </span>
                        <button onClick={() => quickAdjustStock(p, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"><Plus size={12} /></button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">{formatCurrency(p.precioCompra)}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(p.precioVenta)}</td>
                    <td className="px-4 py-4 text-right">
                      {p.precioKilo != null && p.precioKilo > 0 ? (
                        <span className="text-xs font-bold text-primary">{formatCurrency(p.precioKilo)}/kg</span>
                      ) : (
                        <span className="text-xs text-textMuted">No especifica</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                       <span className={`text-xs ml-2 ${calculateMargin(p.precioCompra, p.precioVenta) > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {calculateMargin(p.precioCompra, p.precioVenta)}%
                       </span>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex items-center justify-center space-x-3">
                          <button onClick={() => openStockModal(p)} className="text-emerald-400 hover:text-emerald-300" title="Ajustar Stock"><PackagePlus size={16} /></button>
                          <button onClick={() => openEditModal(p)} className="text-primary hover:text-primary/80" title="Editar"><Edit2 size={16} /></button>
                          {(user?.rol === 'admin') && (
                             <button onClick={() => handleDelete(p._id)} className="text-danger hover:text-red-400" title="Eliminar"><Trash2 size={16} /></button>
                          )}
                       </div>
                    </td>
                  </tr>
                   );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-2xl rounded-2xl border border-stone-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <h3 className="text-xl font-bold text-textLight">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-textLight"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
               <form id="productForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-textMuted mb-2">Nombre del Producto</label>
                    <input required name="nombre" value={formData.nombre} onChange={handleInputChange} type="text" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                 </div>
                 
<div>
                     <label className="block text-sm font-medium text-textMuted mb-2">SKU / Código</label>
                     <input name="sku" value={formData.sku} onChange={handleInputChange} type="text" placeholder="Auto si vacío" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                     <p className="text-[10px] text-textMuted mt-1">Si lo dejás vacío, se genera automáticamente</p>
                  </div>

                 <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">Categoría</label>
                    <select required name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none">
                       {categories.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </select>
                 </div>

                 <div className="md:col-span-2 border border-stone-700 p-4 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-textLight">Configuración de Tienda de Mascotas</h4>
                    <div className="flex flex-col gap-3">
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="esGenerico" checked={formData.esGenerico} onChange={handleInputChange} className="w-4 h-4 text-primary bg-stone-800 border-stone-600 rounded focus:ring-primary" />
                          <span className="text-sm text-textMuted">Es un producto genérico (Preguntar precio en el momento de la venta)</span>
                       </label>

                       <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="esBolsaAlimento" checked={formData.esBolsaAlimento} onChange={handleInputChange} className="w-4 h-4 text-primary bg-stone-800 border-stone-600 rounded focus:ring-primary" />
                          <span className="text-sm text-textMuted">Es bolsa de alimento fraccionable (Se puede vender suelto)</span>
                       </label>
                    </div>

                    {formData.esBolsaAlimento && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-stone-800/30 p-3 rounded-lg border border-stone-800">
                          <div>
                             <label className="block text-xs font-medium text-textMuted mb-1">Kilos totales de la bolsa</label>
                             <input required type="number" step="0.1" min="0.1" name="kilosPorBolsa" value={formData.kilosPorBolsa} onChange={handleInputChange} className="w-full bg-background border border-stone-700 rounded-lg px-3 py-1.5 text-textLight focus:ring-1 focus:ring-primary focus:outline-none text-sm" />
                          </div>
                          <div>
                             <label className="block text-xs font-medium text-primary mb-1">Precio por Kilo ($) <span className="text-textMuted">· exacto</span></label>
                             <input type="number" min="0" step="0.01" name="precioKilo" value={formData.precioKilo} onChange={handleInputChange} placeholder="Ej: 8500" className="w-full bg-background border border-stone-700 rounded-lg px-3 py-1.5 text-textLight focus:ring-1 focus:ring-primary focus:outline-none text-sm" />
                             {formData.precioKilo && formData.kilosPorBolsa && (
                                <p className="text-[10px] text-textMuted mt-1">Bolsa ≈ {formatCurrency(Number(formData.precioKilo) * Number(formData.kilosPorBolsa))}</p>
                              )}
                          </div>
                          <div>
                             <label className="block text-xs font-medium text-textMuted mb-1">Margen Venta Suelta (+%)</label>
                             <input required type="number" step="1" name="margenSuelto" value={formData.margenSuelto} onChange={handleInputChange} className="w-full bg-background border border-stone-700 rounded-lg px-3 py-1.5 text-textLight focus:ring-1 focus:ring-primary focus:outline-none text-sm" />
                          </div>
                       </div>
                    )}
                 </div>

                 <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 bg-stone-800/30 p-4 rounded-xl border border-stone-800">
                     <div>
                        <label className="block text-sm font-medium text-textMuted mb-2">Costo (Precio Compra)</label>
                        <input required min="0" step="0.01" name="precioCompra" value={formData.precioCompra} onChange={handleInputChange} type="number" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-emerald-400 mb-2">Margen Ganancia (%)</label>
                        <div className="relative">
                           <input 
                              type="number" 
                              step="0.1" 
                              value={calculateMargin(formData.precioCompra, formData.precioVenta)} 
                              onChange={handleMarginChange} 
                              className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg px-4 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/50 font-bold">%</span>
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-textMuted mb-2">Precio Venta Final</label>
                        <input required min="0" step="0.01" name="precioVenta" value={formData.precioVenta} onChange={handleInputChange} type="number" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                     </div>
                 </div>

                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">
                       {editingId ? 'Stock Actual' : 'Stock Inicial'}
                    </label>
                    <input required min="0" name="stock" value={formData.stock} onChange={handleInputChange} type="number" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">Stock Mínimo</label>
                    <input required min="0" name="stockMinimo" value={formData.stockMinimo} onChange={handleInputChange} type="number" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-textMuted">Descripción del producto</label>
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={loadingDesc || !formData.nombre.trim()}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primaryDark hover:from-orange-400 hover:to-primaryDark disabled:opacity-40 text-white transition-all"
                      >
                        {loadingDesc ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {loadingDesc ? 'Generando...' : 'Generar con IA'}
                      </button>
                    </div>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Descripción del producto (se genera con IA o se carga manualmente)..."
                      className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none resize-none text-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-textMuted mb-2">Notas para IA (opcional)</label>
                    <input
                      name="notasIA"
                      value={formData.notasIA}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="Ej: marca Royal Canin, raza golden, para cachorros..."
                      className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none text-sm"
                    />
                    <p className="text-[10px] text-textMuted mt-1">Aclaraciones que la IA tendrá en cuenta al generar la descripción</p>
                  </div>

                  {/* Espacio reservado para centrar */}
                </form>
            </div>

            <div className="p-6 border-t border-stone-800 flex justify-end gap-3 rounded-b-2xl shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg border border-stone-700 text-textLight hover:bg-stone-800 transition-colors">Cancelar</button>
               <button type="submit" form="productForm" className="px-6 py-2 rounded-lg bg-primary hover:bg-primaryDark text-white font-semibold transition-colors shadow-lg shadow-primary/20">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste Stock */}
      {isStockModalOpen && stockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-stone-700 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <div>
                 <h3 className="text-xl font-bold text-textLight">Ajustar Stock</h3>
                 <p className="text-xs text-textMuted">{stockProduct.nombre}</p>
              </div>
              <button onClick={() => setIsStockModalOpen(false)} className="text-textMuted hover:text-textLight"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Tipo de Movimiento</label>
                  <select required value={stockFormData.tipo} onChange={(e) => setStockFormData({...stockFormData, tipo: e.target.value})} className="w-full bg-background border border-stone-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none">
                     <option value="entrada">Entrada (+)</option>
                     <option value="salida">Salida (-)</option>
                     <option value="ajuste">Ajuste (Reemplazo directo)</option>
                  </select>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">{stockFormData.tipo === 'ajuste' ? 'Nuevo Stock Total' : 'Cantidad a mover'}</label>
                  <input required min="1" value={stockFormData.cantidad} onChange={(e) => setStockFormData({...stockFormData, cantidad: e.target.value})} type="number" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
               </div>

               <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Motivo (Opcional)</label>
                  <input value={stockFormData.motivo} onChange={(e) => setStockFormData({...stockFormData, motivo: e.target.value})} type="text" placeholder="Ej: Mercadería recibida, Vencimiento..." className="w-full bg-background border border-stone-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
               </div>

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsStockModalOpen(false)} className="flex-1 py-3 rounded-lg border border-stone-700 text-textLight hover:bg-stone-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-lg shadow-emerald-500/20">Confirmar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Combo Manual */}
      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-3xl rounded-2xl border border-stone-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <h3 className="text-xl font-bold text-textLight">Crear Combo Manual</h3>
              <button onClick={() => setIsComboModalOpen(false)} className="text-textMuted hover:text-textLight"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleComboSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Nombre del Combo</label>
                  <input required name="nombre" value={comboForm.nombre} onChange={e => setComboForm({...comboForm, nombre: e.target.value})} type="text" placeholder="Ej: Combo Perro Activo" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">SKU</label>
                  <input name="sku" value={comboForm.sku} onChange={e => setComboForm({...comboForm, sku: e.target.value})} type="text" placeholder="Auto si vacío" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Categoría</label>
                  <select name="categoria" value={comboForm.categoria} onChange={e => setComboForm({...comboForm, categoria: e.target.value})} className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none">
                    <option value="">Auto (categoría del primer item)</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                  </select>
                  <p className="text-[10px] text-textMuted mt-1">Si vacío, usa la categoría del primer producto agregado</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Descuento (%)</label>
                  <input type="number" min="0" max="50" step="1" name="descuentoPorcentaje" value={comboForm.descuentoPorcentaje} onChange={e => setComboForm({...comboForm, descuentoPorcentaje: parseInt(e.target.value) || 0})} className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">Descripción</label>
                <textarea name="descripcion" value={comboForm.descripcion} onChange={e => setComboForm({...comboForm, descripcion: e.target.value})} rows={2} className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-textMuted">Productos del Combo (mín. 2)</label>
                  <span className="text-xs text-textMuted">{comboForm.items.length} items</span>
                </div>
                <div className="mb-3">
                  <input 
                    type="text" 
                    placeholder="Buscar producto por nombre o SKU..." 
                    value={comboSearch}
                    onChange={e => setComboSearch(e.target.value)}
                    className="w-full bg-background border border-stone-700 rounded-lg px-4 py-2 text-textLight focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-stone-800 rounded-lg p-3 bg-background">
                  {filteredComboProducts.length === 0 ? (
                    <p className="text-textMuted text-sm text-center py-4">Sin coincidencias</p>
                  ) : (
                    filteredComboProducts.map(p => {
                      const inCombo = comboForm.items.some(i => i.productoId === p._id);
                      return (
                        <div key={p._id} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${inCombo ? 'bg-purple-500/10 border-purple-500/30' : 'bg-stone-800/30 border-stone-700 hover:border-stone-600'}`}>
                          {p.imagen && <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-textLight truncate">{p.nombre}</p>
                            <p className="text-xs text-textMuted">{p.categoria?.nombre} · Stock: {p.stock} {p.unidadMedida}</p>
                          </div>
                          <span className="text-xs text-emerald-400 font-bold">{formatCurrency(p.precioVenta)}</span>
                          {inCombo ? (
                            <button type="button" onClick={() => removeComboItem(comboForm.items.findIndex(i => i.productoId === p._id))} className="text-red-400 hover:text-red-300" title="Quitar"><Trash size={16} /></button>
                          ) : (
                            <button type="button" onClick={() => addComboItem(p)} className="text-primary hover:text-primary/80 font-bold px-3 py-1 rounded bg-primary/10" title="Agregar">+</button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {comboForm.items.length > 0 && (() => {
      const precioLista = comboForm.items.reduce((s, i) => s + (products.find(p => p._id === i.productoId)?.precioVenta || 0) * i.cantidad, 0);
      const costoTotal = comboForm.items.reduce((s, i) => s + (products.find(p => p._id === i.productoId)?.precioCompra || 0) * i.cantidad, 0);
      const precioConDesc = precioLista * (1 - comboForm.descuentoPorcentaje / 100);
      const gananciaNeta = precioConDesc - costoTotal;
      const margenPct = precioConDesc > 0 ? ((gananciaNeta / precioConDesc) * 100).toFixed(1) : 0;

      return (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-2">
          <h4 className="text-textLight font-medium">Resumen del Combo</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between"><span className="text-textMuted">Productos</span><span className="text-textLight font-bold">{comboForm.items.length}</span></div>
            <div className="flex justify-between"><span className="text-textMuted">Descuento</span><span className="text-pink-400 font-bold">{comboForm.descuentoPorcentaje}%</span></div>
            <div className="flex justify-between"><span className="text-textMuted">Precio lista</span><span className="text-textLight font-bold">{precioLista.toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</span></div>
            <div className="flex justify-between"><span className="text-textMuted">Con descuento</span><span className="text-pink-400 font-bold">{precioConDesc.toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</span></div>
            <div className="flex justify-between"><span className="text-textMuted">Costo total</span><span className="text-textLight font-bold">{costoTotal.toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</span></div>
            <div className="flex justify-between"><span className="text-textMuted">Ganancia neta</span><span className="text-emerald-400 font-bold">{gananciaNeta.toLocaleString('es-AR', {style:'currency', currency:'ARS'})}</span></div>
            <div className="flex justify-between"><span className="text-textMuted">Margen %</span><span className="text-emerald-400 font-bold">{margenPct}%</span></div>
          </div>
        </div>
      );
    })()}

              <div className="pt-4 flex gap-3 border-t border-stone-800">
                <button type="button" onClick={() => setIsComboModalOpen(false)} className="flex-1 py-3 rounded-lg border border-stone-700 text-textLight hover:bg-stone-800 transition-colors">Cancelar</button>
                <button type="submit" disabled={comboLoading || comboForm.items.length < 2} className="flex-1 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold transition-colors shadow-lg shadow-purple-500/20">
                  {comboLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
                      Creando...
                    </>
                  ) : (
                    'Crear Combo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
