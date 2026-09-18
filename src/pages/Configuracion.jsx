import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Settings, Save, Target, TrendingUp, Award, Coins, RefreshCw, DollarSign, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

const inicial = {
  metaFacturacionDiaria: 40000,
  metaGananciaDiaria: 30000,
  metaFacturacionMensual: 4000000,
  margenSueltoDefecto: 42,
  pesosPorPunto: 200,
};

const CAMPOS = [
  {
    key: 'metaFacturacionDiaria',
    title: 'Meta de facturación diaria',
    desc: 'Objetivo de $ vendidos por día que se muestra en el Dashboard (barra de progreso).',
    icon: Target,
    gradient: 'from-primary to-primaryDark',
    type: 'currency',
  },
  {
    key: 'metaGananciaDiaria',
    title: 'Meta de ganancia diaria',
    desc: 'Objetivo de ganancia ($) por día, mostrado como barra de progreso en el Dashboard.',
    icon: Wallet,
    gradient: 'from-violet-500 to-purple-700',
    type: 'currency',
  },
  {
    key: 'metaFacturacionMensual',
    title: 'Meta de facturación mensual',
    desc: 'Objetivo de $ vendidos por mes que se muestra en el Dashboard.',
    icon: DollarSign,
    gradient: 'from-blue-500 to-blue-700',
    type: 'currency',
  },
  {
    key: 'margenSueltoDefecto',
    title: 'Margen por defecto para venta suelta (%)',
    desc: 'Margen que se usa como default al crear un alimento fraccionable o fraccionar por kilo.',
    icon: TrendingUp,
    gradient: 'from-amber-500 to-orange-600',
    type: 'percent',
    suffix: '%',
  },
  {
    key: 'pesosPorPunto',
    title: 'Pesos por punto de afiliado',
    desc: 'Cada $X gastados por un cliente afiliado = 1 punto (ej: cada $200 = 1 punto).',
    icon: Award,
    gradient: 'from-purple-500 to-purple-700',
    type: 'money',
  },
];

const Configuracion = () => {
  const [form, setForm] = useState(inicial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/system-config')
      .then(res => {
        const c = res.data?.config;
        if (c) setForm({ ...inicial, ...c });
      })
      .catch(err => toast.error(err.response?.data?.message || 'Error al cargar la configuración'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    const num = parseFloat(value);
    setForm(f => ({ ...f, [key]: isNaN(num) ? '' : num }));
  };

  const handleSave = async () => {
    const payload = {};
    for (const c of CAMPOS) {
      const val = Number(form[c.key]);
      if (!isNaN(val) && val >= 0) payload[c.key] = val;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/system-config', payload);
      if (data.config) setForm({ ...inicial, ...data.config });
      toast.success(data.message || 'Configuración guardada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-textLight">Configuración del sistema</h2>
            <p className="text-textMuted text-xs mt-0.5">Variables que se usan en todo el sistema y que pueden cambiar con el tiempo</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPOS.map((campo) => {
          const Icon = campo.icon;
          const val = form[campo.key];
          return (
            <div key={campo.key} className="bg-surface rounded-2xl border border-stone-800/80 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${campo.gradient}`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-textLight text-sm">{campo.title}</p>
                  {campo.type === 'currency' && val !== '' && (
                    <p className="text-[10px] text-textMuted">Vigente: {fmt(val)}</p>
                  )}
                  {campo.type === 'money' && val !== '' && (
                    <p className="text-[10px] text-textMuted">Vigente: 1 punto cada {fmt(val)}</p>
                  )}
                  {campo.type === 'percent' && val !== '' && (
                    <p className="text-[10px] text-textMuted">Vigente: {val}%</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-textMuted mb-4">{campo.desc}</p>
              <div className="relative">
                {campo.type === 'currency' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                )}
                <input
                  type="number"
                  min="0"
                  step={campo.type === 'percent' ? '1' : '100'}
                  value={val}
                  onChange={(e) => handleChange(campo.key, e.target.value)}
                  className={`w-full bg-background border border-stone-700 rounded-xl py-3 ${campo.type === 'currency' ? 'pl-8' : 'pl-4'} pr-14 text-textLight focus:outline-none focus:border-primary font-bold text-lg`}
                />
                {campo.suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">{campo.suffix}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-xs text-textMuted">
        <Coins size={16} className="text-primary shrink-0 mt-0.5" />
        <p>
          Estos valores se aplican de inmediato en todo el sistema: las metas del Dashboard, la creación de productos alimenticios y el cálculo de puntos de los afiliados. No hace falta reiniciar nada.
        </p>
      </div>
    </div>
  );
};

export default Configuracion;