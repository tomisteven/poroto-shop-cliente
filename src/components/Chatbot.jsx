import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { MessageCircle, Send, X, Bot, User, ShoppingCart, Plus, Minus } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

const Chatbot = ({ onAddToCart }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hola! Soy el asistente de Poroto PetShop. ¿En qué te puedo ayudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai-features/chatbot', { mensaje: text });

      setMessages((prev) => [...prev, {
        role: 'bot',
        text: data.respuesta,
        productos: data.productosRecomendados || [],
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Disculpá, hubo un error. Intentá de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-all hover:scale-110"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-2xl flex flex-col h-[500px] max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#222] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Asistente Poroto</p>
              <p className="text-[10px] text-neutral-500">Siempre disponible</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={12} className="text-emerald-400" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-[#222] text-neutral-200 border border-[#333] rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.productos && msg.productos.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.productos.map((p) => (
                      <div key={p._id} className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{p.nombre}</p>
                          <p className="text-[10px] text-neutral-500">
                            {formatCurrency(p.precioVenta)} · {p.stock > 0 ? `${p.stock} disp.` : 'Sin stock'}
                          </p>
                        </div>
                        {p.stock > 0 && onAddToCart && (
                          <button
                            onClick={() => onAddToCart(p)}
                            className="shrink-0 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
                          >
                            <Plus size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center shrink-0 mt-1">
                  <User size={12} className="text-neutral-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={12} className="text-emerald-400" />
              </div>
              <div className="bg-[#222] border border-[#333] rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-[#2a2a2a]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribí tu consulta..."
              className="flex-1 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-600"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
