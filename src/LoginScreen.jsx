import React, { useState } from "react";

const BACKEND_URL = "https://gas-page-back-production.up.railway.app";

const LoginScreen = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      if (res.status === 401) {
        setError("Correo no autorizado");
        return;
      }

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

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

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
