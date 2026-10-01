import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { Brain, Calendar, Send, Sparkles, AlertTriangle, User, Bot } from 'lucide-react';

const fmtDate = (date) =>
  date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const SUGERENCIAS = [
  '¿Qué días de la semana se vendió más?',
  '¿Cuál fue el producto más vendido del período?',
  '¿Qué productos necesito reponer?',
  '¿Cuál fue la ganancia y el ticket promedio?',
  '¿Qué horarios tienen más ventas?',
];

export default function PreguntarIA() {
  const [desde, setDesde] = useState(() => fmtDate(addDays(new Date(), -89)));
  const [hasta, setHasta] = useState(() => fmtDate(new Date()));
  const [pregunta, setPregunta] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const handleSend = async (texto) => {
    const q = (texto ?? pregunta).trim();
    if (!q || loading) return;
    setMsgs((m) => [...m, { rol: 'user', pregunta: q }]);
    setPregunta('');
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai-features/preguntar', { pregunta: q, desde, hasta });
      setMsgs((m) => [
        ...m,
        { rol: 'assistant', respuesta: res.data.respuesta, datosClave: res.data.datosClave || [], period: res.data.period },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo responder la consulta. Reintentá en unos segundos.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-textLight text-2xl font-bold">Preguntale a la IA</h1>
            <p className="text-textMuted text-sm">Hacé consultas sobre tus ventas, productos y ganancias</p>
          </div>
        </div>

        {/* Período + consulta */}
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-textMuted text-xs font-medium uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 text-textMuted text-xs font-medium uppercase tracking-wider mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full bg-background border border-stone-700 rounded-lg px-3 py-2 text-sm text-textLight focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => {
                setDesde(fmtDate(addDays(new Date(), -89)));
                setHasta(fmtDate(new Date()));
              }}
              className="bg-background border border-stone-700 text-textMuted hover:text-textLight hover:border-stone-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Últimos 90 días
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-textMuted text-xs font-medium uppercase tracking-wider">Tu pregunta</label>
            <textarea
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder="Ej: ¿Qué día de la semana se hicieron más ventas?"
              className="w-full bg-background border border-stone-700 rounded-xl px-4 py-3 text-sm text-textLight focus:outline-none focus:border-primary resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  {s}
                </button>
              ))}
              <button
                onClick={() => handleSend()}
                disabled={loading || !pregunta.trim()}
                className="ml-auto flex items-center gap-2 bg-primary hover:bg-primaryDark text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Consultando...' : 'Preguntar'}
              </button>
            </div>
          </div>
        </div>

        {/* Conversación */}
        <div className="bg-surface rounded-2xl border border-stone-800/80 p-6 min-h-[200px]">
          {msgs.length === 0 && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bot className="w-12 h-12 text-primary/40 mb-3" />
              <p className="text-textMuted text-sm">
                Hacé una pregunta sobre el período seleccionado y la IA la responde con tus datos reales.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {msgs.map((m, i) =>
              m.rol === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] bg-primary/15 border border-primary/30 rounded-2xl rounded-br-sm px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary text-xs font-bold uppercase tracking-wider">Vos</span>
                    </div>
                    <p className="text-textLight text-sm whitespace-pre-wrap">{m.pregunta}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[90%] bg-background border border-stone-800 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary text-xs font-bold uppercase tracking-wider">IA</span>
                      {m.period && (
                        <span className="text-textMuted text-[11px]">
                          {m.period.desde} → {m.period.hasta}
                        </span>
                      )}
                    </div>
                    <p className="text-textLight text-sm whitespace-pre-wrap">{m.respuesta}</p>
                    {m.datosClave?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {m.datosClave.map((d, j) => (
                          <span key={j} className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-background border border-stone-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-textMuted text-sm">La IA está analizando tus datos...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}