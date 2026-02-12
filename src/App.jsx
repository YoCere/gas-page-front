import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Utensils,
  BookOpen,
  Sparkles,
  MessageSquare,
  X
} from "lucide-react";

const BACKEND_URL = "https://gas-page-back-production.up.railway.app";

const App = () => {

  // =============================
  // AUTH
  // =============================

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");

  // =============================
  // DATA
  // =============================

  const [menu, setMenu] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [query, setQuery] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const scrollRef = useRef(null);

  // =============================
  // LOGIN
  // =============================

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      } else {
        alert("Correo no autorizado");
      }
    } catch {
      alert("Error de conexión");
    }
  };

  // =============================
  // CARGAR RECETAS
  // =============================

  useEffect(() => {
    if (!token) return;

    fetch(`${BACKEND_URL}/recipes`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setMenu(data))
      .catch(() => alert("Error cargando recetas"));
  }, [token]);

  // =============================
  // PRELOAD NEXT + PREV IMAGES
  // =============================

  useEffect(() => {
    if (!menu.length) return;

    const next = currentPage + 1;
    const prev = currentPage - 1;

    if (menu[next]?.image) {
      const imgNext = new Image();
      imgNext.src = menu[next].image;
    }

    if (menu[prev]?.image) {
      const imgPrev = new Image();
      imgPrev.src = menu[prev].image;
    }

  }, [currentPage, menu]);

  // =============================
  // GEMINI PROTEGIDO
  // =============================

  const callGemini = async (prompt, systemPrompt) => {
    const response = await fetch(`${BACKEND_URL}/gemini`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, systemPrompt })
    });

    if (!response.ok) {
      throw new Error("Error backend");
    }

    const data = await response.json();
    return data.text;
  };

  const analyzeRecipe = async () => {
    setLoadingAi(true);
    try {
      const result = await callGemini(
        `Plato: ${menu[currentPage]?.title}`,
        "Explica en 2 frases breves por qué este plato es bueno para la gastritis."
      );
      setAiAnalysis(result);
    } catch {
      setAiAnalysis("Error al analizar.");
    } finally {
      setLoadingAi(false);
    }
  };

  const askGemini = async () => {
    if (!query) return;
    setLoadingAi(true);
    try {
      const result = await callGemini(
        query,
        "Responde si el alimento es seguro para la gastritis. Máximo 2 frases."
      );
      setChatResponse(result);
    } catch {
      setChatResponse("Error en la consulta.");
    } finally {
      setLoadingAi(false);
      setQuery("");
    }
  };

  useEffect(() => {
    setAiAnalysis("");
    setChatResponse("");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentPage]);

  // =============================
  // LOGIN SCREEN
  // =============================

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-white p-6 rounded-xl space-y-4 w-80">
          <h2 className="font-bold text-lg text-center">Acceso privado</h2>
          <input
            className="border p-2 rounded w-full"
            placeholder="Correo autorizado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="bg-emerald-600 text-white px-4 py-2 rounded w-full"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  if (!menu.length) {
    return <div className="text-white p-10">Cargando recetas...</div>;
  }

  const pageData = menu[currentPage];
  if (!pageData) return null;

  // =============================
  // MAIN RENDER
  // =============================

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="bg-emerald-600 px-4 py-3 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <BookOpen size={18} />
          <span className="text-xs font-bold uppercase">
            Pág {currentPage + 1}/{menu.length}
          </span>
        </div>

        {pageData.day && (
          <span className="text-sm font-bold capitalize">
            {pageData.day}
          </span>
        )}

        <button
          onClick={() => setIsAssistantOpen(true)}
          className="bg-white/20 p-1.5 rounded-lg"
        >
          <MessageSquare size={18} />
        </button>
      </header>

      {/* MAIN */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto bg-white">

        {pageData.type === "cover" ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <Utensils size={64} className="text-emerald-500" />
            <h1 className="text-4xl font-black">{pageData.title}</h1>
            <p className="text-emerald-600 font-bold">{pageData.subtitle}</p>
            <p className="text-slate-400">{pageData.description}</p>
            <button
              onClick={() => setCurrentPage(1)}
              className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold"
            >
              Comenzar
            </button>
          </div>
        ) : pageData.type === "warning" ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <AlertTriangle size={64} className="text-rose-500" />
            <h2 className="text-2xl font-black">{pageData.title}</h2>
            <p className="bg-rose-50 p-6 rounded-xl text-sm">
              {pageData.content}
            </p>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="underline"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">

            <div>
              <span className="text-emerald-500 text-xs font-black uppercase">
                {pageData.meal}
              </span>
              <h2 className="text-2xl font-black">{pageData.title}</h2>
            </div>

            {pageData.image && (
              <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-100">
                <img
                  key={pageData.image}
                  src={pageData.image}
                  alt={pageData.title}
                  className="w-full h-[220px] object-cover transition-opacity duration-300"
                />
              </div>
            )}

            <pre className="bg-slate-50 p-5 rounded-xl whitespace-pre-line">
              {pageData.recipe}
            </pre>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={analyzeRecipe}
                className="bg-emerald-50 text-emerald-700 p-3 rounded-xl font-bold"
              >
                <Sparkles size={16} /> Beneficios IA
              </button>

              <button
                onClick={() => setIsAssistantOpen(true)}
                className="bg-slate-900 text-white p-3 rounded-xl font-bold"
              >
                Consultor IA
              </button>
            </div>

            {aiAnalysis && (
              <div className="bg-emerald-600 text-white p-5 rounded-xl">
                {aiAnalysis}
              </div>
            )}
          </div>
        )}

      </main>
      {isAssistantOpen && (
  <div className="fixed inset-0 bg-black/60 flex items-end z-50">
    <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">

      <div className="flex justify-between items-center">
        <h3 className="font-black text-lg">Consultor IA</h3>
        <button onClick={() => setIsAssistantOpen(false)}>
          <X />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border rounded-xl p-3"
          placeholder="¿Puedo comer…?"
        />
        <button
          onClick={askGemini}
          className="bg-emerald-600 text-white px-4 rounded-xl"
        >
          →
        </button>
      </div>

      {loadingAi && (
        <div className="text-sm text-gray-500">Consultando...</div>
      )}

      {chatResponse && (
        <div className="bg-emerald-50 p-4 rounded-xl">
          {chatResponse}
        </div>
      )}

    </div>
  </div>
)}
      {/* FOOTER */}
      <footer className="bg-white border-t p-4 flex justify-between">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === menu.length - 1}
        >
          <ChevronRight />
        </button>
      </footer>

    </div>
  );
};

export default App;
