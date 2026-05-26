// Modal para gestionar cuentas de pago (bancos, paypal, etc) visibles para los pacientes al agendar, en palabras sencillas, 
// permite al asistente colocar los datos de pago para que el cliente los visualice 
// en su calendario de citas y pueda realizar el pago por su cuenta. No es un sistema de pago integrado,
//  solo una forma de mostrar la información de pago al cliente.
"use client";
import { useState, useEffect } from "react";
export default function PaymentModal({ isOpen, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_holder: "",
  });

  useEffect(() => {
    if (isOpen) loadAccounts();
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/paymentaccounts", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/paymentaccounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setForm({ bank_name: "", account_number: "", account_holder: "" });
      setShowForm(false);
      loadAccounts();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/paymentaccounts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) loadAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Cuentas de pago
            </h2>
            <p className="text-xs text-gray-400">
              Visibles para los pacientes al agendar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Lista de cuentas */}
        <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
          {accounts.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl text-sm text-gray-400 border border-dashed border-gray-200">
              No hay cuentas registradas aún
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {acc.bank_name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {acc.account_number}
                  </p>
                  <p className="text-xs text-gray-400">{acc.account_holder}</p>
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  disabled={deleting === acc.id}
                  className="ml-3 w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center text-xs transition flex-shrink-0 disabled:opacity-50"
                >
                  {deleting === acc.id ? "..." : "🗑"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formulario añadir */}
        {showForm ? (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">
              Nueva cuenta
            </p>
            <PField
              label="Banco"
              value={form.bank_name}
              onChange={(v) => setForm((f) => ({ ...f, bank_name: v }))}
              placeholder="Ej: Banco de Venezuela"
            />
            <PField
              label="Número de cuenta"
              value={form.account_number}
              onChange={(v) => setForm((f) => ({ ...f, account_number: v }))}
              placeholder="Ej: 0102-1234-56-7890123456"
            />
            <PField
              label="Titular"
              value={form.account_holder}
              onChange={(v) => setForm((f) => ({ ...f, account_holder: v }))}
              placeholder="Ej: Clínica Hilmi C.A."
            />

            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                disabled={
                  loading ||
                  !form.bank_name ||
                  !form.account_number ||
                  !form.account_holder
                }
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border border-dashed border-teal-300 hover:border-teal-400 hover:bg-teal-50 text-teal-600 rounded-xl py-2.5 text-sm font-medium transition mb-4"
          >
            + Añadir cuenta
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function PField({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
    </div>
  );
}
