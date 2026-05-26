//Stock visual que se mostrara en admin y asistentes (necesita mejoras)
"use client";
import { useState, useEffect } from "react";

const CATEGORIES = ["Medicamentos", "Insumos", "Equipos", "Limpieza", "Otros"];

const fmtQty = (q) =>
  parseFloat(q ?? 0)
    .toFixed(2)
    .replace(/\.00$/, "");

export default function StockManager() {
  const [items, setItems] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "alerts" | category
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  // null | "create" | "edit" | "adjust" | "confirmDelete"
  const [activeItem, setActiveItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "Medicamentos",
    quantity: "",
    unit: "",
    min_stock: "5",
    price: "",
  });
  const [adjustment, setAdjustment] = useState("");
  const [adjustType, setAdjustType] = useState("add"); // "add" | "subtract"

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/Stock", { cache: "no-store" });
      const data = await res.json();
      setItems(data.items ?? []);
      setAlertCount(data.alertCount ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setError("");
    setActiveItem(null);
    setAdjustment("");
    setAdjustType("add");
    setForm({
      name: "",
      category: "Medicamentos",
      quantity: "",
      unit: "",
      min_stock: "5",
      price: "",
    });
  };

  // ── CRUD ──────────────────────────────────────────────────
  const createItem = async () => {
    setFormLoading(true);
    setError("");
    try {
      const res = await fetch("/api/Stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity) || 0,
          min_stock: parseFloat(form.min_stock) || 5,
          price: parseFloat(form.price) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadInventory();
    } catch {
      setError("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const updateItem = async () => {
    setFormLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/Stock/${activeItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity) || 0,
          min_stock: parseFloat(form.min_stock) || 5,
          price: parseFloat(form.price) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadInventory();
    } catch {
      setError("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const adjustItem = async () => {
    setFormLoading(true);
    setError("");
    try {
      const value = parseFloat(adjustment);
      if (!value || value <= 0) {
        setError("Ingresa una cantidad válida");
        return;
      }
      const adj = adjustType === "add" ? value : -value;

      const res = await fetch(`/api/Stock/${activeItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: adj }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }

      // Actualizar local inmediatamente
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItem.id ? { ...i, quantity: data.quantity } : i,
        ),
      );
      closeModal();
    } catch {
      setError("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const deleteItem = async () => {
    setFormLoading(true);
    try {
      await fetch(`/api/Stock/${activeItem.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== activeItem.id));
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Filtrado ──────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase());
    if (filter === "alerts")
      return (
        matchSearch && parseFloat(item.quantity) <= parseFloat(item.min_stock)
      );
    if (filter !== "all") return matchSearch && item.category === filter;
    return matchSearch;
  });

  // Agrupar por categoría
  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const isLow = (item) =>
    parseFloat(item.quantity) <= parseFloat(item.min_stock);

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-teal-800">Inventario</h1>
          <p className="text-sm text-cyan-800">
            Gestión de stock e insumos clínicos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadInventory}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl px-3 py-2 text-sm transition shadow-sm"
          >
            ↻
          </button>
          <button
            onClick={() => {
              setForm({
                name: "",
                category: "Medicamentos",
                quantity: "",
                unit: "",
                min_stock: "5",
                price: "",
              });
              setError("");
              setModal("create");
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm"
          >
            + Añadir item
          </button>
        </div>
      </div>

      {/* ── Alerta de stock bajo ── */}
      {alertCount > 0 && (
        <button
          onClick={() => setFilter("alerts")}
          className="w-full mb-5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl px-4 py-3 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl animate-bounce">⚠️</span>
            <div className="text-left">
              <p className="text-sm font-bold text-red-700">
                {alertCount} item{alertCount > 1 ? "s" : ""} con stock bajo
              </p>
              <p className="text-xs text-red-500">
                Toca para ver solo los items críticos
              </p>
            </div>
          </div>
          <span className="text-red-400 text-lg">›</span>
        </button>
      )}

      {/* ── Buscador + Filtros ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar item..."
          className="border bg-white border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm w-64"
        />
        <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm flex-wrap gap-1">
          {["all", "alerts", ...CATEGORIES].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {f === "all"
                ? "Todo"
                : f === "alerts"
                  ? `⚠️ Alertas${alertCount > 0 ? ` (${alertCount})` : ""}`
                  : f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla de inventario ── */}
      {loading ? (
        <div className="text-center py-16 text-cyan-800 text-sm">
          Cargando inventario...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-red-700 text-sm">
            {search ? "No se encontraron items" : "Sin items en inventario"}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {cat}
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-teal-100 bg-teal-500">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase">
                      Item
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-white uppercase">
                      Stock
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-white uppercase">
                      Mín.
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-white uppercase">
                      Precio
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-semibold text-white uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/50 transition-colors ${isLow(item) ? "bg-red-50/30" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isLow(item) && (
                            <span className="text-red-500 text-xs animate-pulse">
                              ⚠️
                            </span>
                          )}
                          <span className="font-medium text-gray-800">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold text-sm ${
                            isLow(item) ? "text-red-600" : "text-teal-700"
                          }`}
                        >
                          {fmtQty(item.quantity)} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-400">
                        {fmtQty(item.min_stock)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500">
                        {item.price > 0
                          ? `$${parseFloat(item.price).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setAdjustment("");
                              setAdjustType("add");
                              setError("");
                              setModal("adjust");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium transition"
                          >
                            ±
                          </button>
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setForm({
                                name: item.name,
                                category: item.category ?? "Otros",
                                quantity: String(item.quantity),
                                unit: item.unit ?? "",
                                min_stock: String(item.min_stock),
                                price: String(item.price ?? 0),
                              });
                              setError("");
                              setModal("edit");
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs font-medium transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              setActiveItem(item);
                              setModal("confirmDelete");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium transition"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* ── MODALES ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {/* Crear / Editar item */}
            {(modal === "create" || modal === "edit") && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-5">
                  {modal === "create" ? "Nuevo item" : "Editar item"}
                </h2>

                <SField
                  label="Nombre *"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Ej: Amoxicilina"
                />

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <SField
                    label="Cantidad *"
                    value={form.quantity}
                    type="number"
                    onChange={(v) => setForm((f) => ({ ...f, quantity: v }))}
                    placeholder="0"
                  />
                  <SField
                    label="Unidad"
                    value={form.unit}
                    onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                    placeholder="ml, mg, un"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <SField
                    label="Stock mínimo"
                    value={form.min_stock}
                    type="number"
                    onChange={(v) => setForm((f) => ({ ...f, min_stock: v }))}
                    placeholder="5"
                  />
                  <SField
                    label="Precio ($)"
                    value={form.price}
                    type="number"
                    onChange={(v) => setForm((f) => ({ ...f, price: v }))}
                    placeholder="0.00"
                  />
                </div>

                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2">
                  <SBtn
                    onClick={modal === "create" ? createItem : updateItem}
                    loading={formLoading}
                    disabled={!form.name || form.quantity === ""}
                  >
                    {modal === "create" ? "Añadir" : "Guardar"}
                  </SBtn>
                  <SGhost onClick={closeModal}>Cancelar</SGhost>
                </div>
              </>
            )}

            {/* Ajustar cantidad */}
            {modal === "adjust" && activeItem && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-1">
                  Ajustar stock
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  {activeItem.name} · Stock actual:{" "}
                  <strong
                    className={
                      isLow(activeItem) ? "text-red-600" : "text-teal-700"
                    }
                  >
                    {fmtQty(activeItem.quantity)} {activeItem.unit}
                  </strong>
                </p>

                {/* Toggle entrada/salida */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1 mb-4">
                  <button
                    onClick={() => setAdjustType("add")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      adjustType === "add"
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    ＋ Entrada
                  </button>
                  <button
                    onClick={() => setAdjustType("subtract")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      adjustType === "subtract"
                        ? "bg-red-500 text-white shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    － Salida
                  </button>
                </div>

                <SField
                  label="Cantidad"
                  value={adjustment}
                  type="number"
                  onChange={setAdjustment}
                  placeholder="Ej: 10"
                />

                {/* Preview del resultado */}
                {adjustment && parseFloat(adjustment) > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-center">
                    <span className="text-gray-500">Resultado: </span>
                    <span className="font-bold text-gray-800">
                      {fmtQty(
                        adjustType === "add"
                          ? parseFloat(activeItem.quantity) +
                              parseFloat(adjustment)
                          : parseFloat(activeItem.quantity) -
                              parseFloat(adjustment),
                      )}{" "}
                      {activeItem.unit}
                    </span>
                  </div>
                )}

                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2">
                  <SBtn
                    onClick={adjustItem}
                    loading={formLoading}
                    disabled={!adjustment}
                  >
                    Confirmar
                  </SBtn>
                  <SGhost onClick={closeModal}>Cancelar</SGhost>
                </div>
              </>
            )}

            {/* Confirmar eliminar */}
            {modal === "confirmDelete" && activeItem && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                  ¿Eliminar item?
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Se eliminará <strong>{activeItem.name}</strong> del inventario
                  permanentemente.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={deleteItem}
                    disabled={formLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
                  >
                    {formLoading ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                  <SGhost onClick={closeModal}>Cancelar</SGhost>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────
function SField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
    </div>
  );
}

function SBtn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}

function SGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
    >
      {children}
    </button>
  );
}
