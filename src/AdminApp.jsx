import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { BACKEND_URL } from "./config";
import TrialCounter from "./TrialCounter";

const statusLabel = (u) => {
  if (u.status === "disabled") return "Desactivado";
  if (u.status === "unlimited") return "Ilimitado";
  if (u.status === "not_started") return `Sin entrar aún, ${u.daysLeft} días`;
  if (u.status === "active") return `Quedan ${u.daysLeft} días`;
  return "Vencida";
};

const AdminApp = ({ token, logout }) => {
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newTrialDays, setNewTrialDays] = useState(7);
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);

  const auth = { Authorization: `Bearer ${token}` };
  const jsonAuth = { "Content-Type": "application/json", ...auth };

  const loadUsers = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, { headers: auth });
    const data = await res.json();
    if (Array.isArray(data)) setUsers(data);
  };

  const loadWhatsapp = async () => {
    const res = await fetch(`${BACKEND_URL}/public-config`);
    const data = await res.json();
    setWhatsapp(data.whatsapp ?? "");
  };

  const addUser = async () => {
    if (!newEmail.trim()) return;

    await fetch(`${BACKEND_URL}/admin/add-user`, {
      method: "POST",
      headers: jsonAuth,
      body: JSON.stringify({ email: newEmail.trim(), trialDays: newTrialDays })
    });

    setNewEmail("");
    setNewTrialDays(7);
    loadUsers();
  };

  const updateTrial = async (id, trialDays) => {
    await fetch(`${BACKEND_URL}/admin/user/${id}/trial`, {
      method: "PUT",
      headers: jsonAuth,
      body: JSON.stringify({ trialDays })
    });

    loadUsers();
  };

  const toggleUser = async (id) => {
    await fetch(`${BACKEND_URL}/admin/toggle-user/${id}`, {
      method: "PUT",
      headers: auth
    });

    loadUsers();
  };

  const saveWhatsapp = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/settings`, {
      method: "PUT",
      headers: jsonAuth,
      body: JSON.stringify({ whatsapp: whatsapp.trim() })
    });

    if (res.ok) {
      setWhatsappSaved(true);
      setTimeout(() => setWhatsappSaved(false), 2000);
    }
  };

  useEffect(() => {
    loadUsers();
    loadWhatsapp();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Panel Administrador</h1>
        <button onClick={logout}>
          <LogOut />
        </button>
      </div>

      {/* ALTA DE CLIENTE */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Nuevo usuario"
          className="p-2 rounded text-black flex-1 min-w-[200px]"
        />

        <TrialCounter value={newTrialDays} onChange={setNewTrialDays} />

        <button onClick={addUser} className="bg-emerald-600 px-4 py-2 rounded">
          Agregar
        </button>
      </div>

      {/* NÚMERO DE WHATSAPP */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <span className="text-sm text-slate-400">WhatsApp de ventas</span>

        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
          placeholder="59171234567"
          className="p-2 rounded text-black w-48"
        />

        <button onClick={saveWhatsapp} className="bg-slate-700 px-4 py-2 rounded">
          Guardar
        </button>

        {whatsappSaved && <span className="text-emerald-400 text-sm">Guardado</span>}
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-slate-800 p-3 rounded flex flex-wrap gap-3 justify-between items-center"
          >
            <div className="min-w-[220px]">
              <div>{u.email}</div>
              <div className="text-xs text-slate-400">{statusLabel(u)}</div>
            </div>

            <div className="flex gap-2 items-center">
              <TrialCounter
                value={u.trialDays ?? null}
                onChange={(days) => updateTrial(u.id, days)}
              />

              <button
                onClick={() => toggleUser(u.id)}
                className="bg-slate-700 text-white px-3 py-2 rounded"
              >
                {u.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApp;
