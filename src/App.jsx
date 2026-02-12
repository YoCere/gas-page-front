import React, { useState, useEffect, useRef } from "react";

const BACKEND_URL = "https://gas-page-back-production.up.railway.app";

const App = () => {

  // =============================
  // AUTH STATES
  // =============================

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("");

  // =============================
  // DATA STATES
  // =============================

  const [menu, setMenu] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const scrollRef = useRef(null);

  // =============================
  // LOGIN
  // =============================

  const handleLogin = async () => {
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

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-white p-6 rounded-xl space-y-4">
          <h2 className="font-bold text-lg">Acceso privado</h2>
          <input
            className="border p-2 rounded"
            placeholder="Correo autorizado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="bg-emerald-600 text-white px-4 py-2 rounded"
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">{pageData.title}</h2>
      {pageData.recipe && <pre>{pageData.recipe}</pre>}
    </div>
  );
};

export default App;
