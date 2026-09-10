import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { BACKEND_URL } from "./config";

const MESSAGE = "Hola, mi prueba del plan de gastritis terminó y quiero el acceso completo.";

const TrialExpired = ({ onBack }) => {
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    fetch(`${BACKEND_URL}/public-config`)
      .then((res) => res.json())
      .then((data) => setWhatsapp(data.whatsapp ?? ""))
      .catch(() => setWhatsapp(""));
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-8 rounded-2xl space-y-5 w-full max-w-sm text-center">
        <Clock size={48} className="text-emerald-600 mx-auto" />

        <h2 className="font-black text-xl">Tu prueba terminó</h2>

        <p className="text-slate-600 text-sm">
          Esperamos que las recetas te hayan ayudado. Para seguir con acceso completo al
          plan y al asistente, escríbenos y te lo activamos.
        </p>

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold"
          >
            Escribir por WhatsApp
          </a>
        )}

        <button onClick={onBack} className="text-slate-500 text-sm underline">
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default TrialExpired;
