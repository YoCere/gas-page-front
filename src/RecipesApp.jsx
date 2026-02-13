import React, { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Utensils,
  BookOpen,
  Sparkles,
  LogOut
} from "lucide-react";

const BACKEND_URL = "https://gas-page-back-production.up.railway.app";

const RecipesApp = ({ token, logout }) => {
  const [menu, setMenu] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/recipes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMenu(data);
      })
      .catch(() => alert("Error cargando recetas"));
  }, [token]);

  useEffect(() => {
    setAiAnalysis("");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [currentPage]);

  if (!menu.length) {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white p-10">
        Cargando recetas...
      </div>
    );
  }

  const pageData = menu[currentPage];
  if (!pageData) return null;

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

        <button onClick={logout} className="bg-white/20 p-2 rounded">
          <LogOut size={18} />
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
              onClick={() => setCurrentPage((p) => p + 1)}
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
                  src={pageData.image}
                  alt={pageData.title}
                  className="w-full h-[220px] object-cover"
                />
              </div>
            )}

            <pre className="bg-slate-50 p-5 rounded-xl whitespace-pre-line">
              {pageData.recipe}
            </pre>

          </div>

        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t p-4 flex justify-between">
        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === menu.length - 1}
        >
          <ChevronRight />
        </button>
      </footer>

    </div>
  );
};

export default RecipesApp;