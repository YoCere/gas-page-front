import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

const BACKEND_URL = "https://gas-page-back-production.up.railway.app";

const AdminApp = ({ token, logout }) => {
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");

  const loadUsers = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    setUsers(data);
  };

  const addUser = async () => {
    if (!newEmail.trim()) return;

    await fetch(`${BACKEND_URL}/admin/add-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ email: newEmail.trim() })
    });

    setNewEmail("");
    loadUsers();
  };

  const toggleUser = async (id) => {
    await fetch(`${BACKEND_URL}/admin/toggle-user/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });

    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Panel Administrador</h1>
        <button onClick={logout}>
          <LogOut />
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Nuevo usuario"
          className="p-2 rounded text-black flex-1"
        />
        <button
          onClick={addUser}
          className="bg-emerald-600 px-4 rounded"
        >
          Agregar
        </button>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-blue text-white p-3 rounded flex justify-between"
          >
            <div>
              {u.email} — {u.active ? "Activo" : "Inactivo"}
            </div>

            <button
              onClick={() => toggleUser(u.id)}
              className="bg-slate-800 text-white px-3 rounded"
            >
              {u.active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApp;
