import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { BACKEND_URL } from "./config";

const ChatWidget = ({ token, currentRecipe, onExpired }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy tu asistente de gastritis. Pregúntame sobre recetas, ingredientes o consejos de alimentación 🍽️" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          currentRecipe: currentRecipe?.recipe ? {
            day: currentRecipe.day,
            meal: currentRecipe.meal,
            title: currentRecipe.title,
            recipe: currentRecipe.recipe
          } : null
        })
      });

      if (res.status === 403) {
        onExpired();
        return;
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.text || "Sin respuesta" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-16 right-3 z-50 w-[340px] h-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-bold text-sm">Asistente Gastritis</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
                  <span className="animate-pulse">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Escribe tu pregunta..."
              className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-emerald-600 text-white p-2 rounded-full disabled:opacity-40 hover:bg-emerald-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
