import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Edit2, Trash2, X, Tags } from 'lucide-react';
import toast from 'react-hot-toast';

const Categories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', color: '#3b82f6', icono: 'tag' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error('Error al obtener categorías');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nombre: '', color: '#3b82f6', icono: 'tag' });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingId(c._id);
    setFormData({ nombre: c.nombre, color: c.color, icono: c.icono });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/categories', formData);
        toast.success('Categoría creada');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Error al guardar categoría');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta categoría? Esto no eliminará los productos asociados, pero dejarán de verse en los filtros si requiere categoría activa.')) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success('Categoría eliminada');
        fetchCategories();
      } catch (error) {
        toast.error('Error al eliminara');
      }
    }
  };

  // Selectable colors
  const colorOptions = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-textLight">Categorías</h2>
          <p className="text-textMuted text-sm mt-1">Clasificación de productos</p>
        </div>
        {(user?.rol === 'admin') && (
           <button 
             onClick={openNewModal}
             className="bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-lg transition-colors flex items-center shadow-lg shadow-primary/20"
           >
             <PlusCircle size={18} className="mr-2" />
             Nueva Categoría
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
         ) : categories.length === 0 ? (
            <div className="text-center py-20 text-textMuted">No hay categorías configuradas.</div>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {categories.map(c => (
                  <div key={c._id} className="bg-surface p-6 rounded-xl border border-stone-800 flex flex-col items-center shadow-sm relative group">
                     {user?.rol === 'admin' && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                           <button onClick={() => openEditModal(c)} className="w-8 h-8 rounded-full bg-stone-800 text-textLight flex items-center justify-center hover:bg-stone-700">
                              <Edit2 size={14} />
                           </button>
                           <button onClick={() => handleDelete(c._id)} className="w-8 h-8 rounded-full bg-stone-800 text-danger flex items-center justify-center hover:bg-red-500/20">
                              <Trash2 size={14} />
                           </button>
                        </div>
                     )}
                     <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white"
                        style={{ backgroundColor: c.color }}
                     >
                        <Tags size={28} />
                     </div>
                     <h4 className="text-lg font-bold text-textLight">{c.nombre}</h4>
                  </div>
               ))}
            </div>
         )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-2xl border border-stone-700 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <h3 className="text-xl font-bold text-textLight">{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-textLight"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Nombre</label>
                  <input required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} type="text" className="w-full bg-background border border-stone-700 rounded-lg px-4 py-3 text-textLight focus:ring-1 focus:ring-primary focus:outline-none" />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-textMuted mb-3">Color Identificador</label>
                  <div className="flex flex-wrap gap-2">
                     {colorOptions.map(color => (
                        <button 
                           key={color} 
                           type="button"
                           onClick={() => setFormData({...formData, color})}
                           className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-110'}`}
                           style={{ backgroundColor: color }}
                        />
                     ))}
                  </div>
               </div>

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-lg border border-stone-700 text-textLight hover:bg-stone-800 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 rounded-lg bg-primary hover:bg-primaryDark text-white font-semibold transition-colors shadow-lg shadow-primary/20">Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
