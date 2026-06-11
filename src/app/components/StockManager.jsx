//Stock visual que se mostrara en admin y asistentes (Diseño Fresco con SVGs)
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

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const isLow = (item) =>
    parseFloat(item.quantity) <= parseFloat(item.min_stock);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-900 tracking-tight">
            Inventario Clínico
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Control de stock, insumos y medicamentos
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadInventory}
            className="flex items-center justify-center w-10 h-10 border border-teal-100 bg-white hover:bg-teal-50 text-teal-600 rounded-full transition shadow-sm"
            title="Actualizar inventario"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
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
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-full px-5 py-2 text-sm font-semibold transition shadow-md shadow-teal-500/20"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Añadir Item
          </button>
        </div>
      </div>

      {/* ── Alerta de stock bajo ── */}
      {alertCount > 0 && (
        <button
          onClick={() => setFilter("alerts")}
          className="w-full mb-8 bg-teal-50 border border-teal-200 hover:bg-teal-100/80 rounded-2xl p-4 flex items-center justify-between transition-all group shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white text-teal-600 w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-teal-800">
                {alertCount} item{alertCount > 1 ? "s" : ""} con stock crítico
              </p>
              <p className="text-sm text-teal-600 font-medium">
                Toca aquí para filtrar y revisar los niveles bajos
              </p>
            </div>
          </div>
          <svg
            className="w-6 h-6 text-teal-500 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      )}

      {/* ── Buscador + Filtros ── */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-teal-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar medicamento o insumo..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm overflow-x-auto hide-scrollbar">
          {["all", "alerts", ...CATEGORIES].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                filter === f
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {f === "alerts" && (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {f === "all"
                ? "Todos"
                : f === "alerts"
                  ? `Alertas (${alertCount})`
                  : f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla de inventario ── */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-cyan-800 text-sm font-medium">
            Cargando inventario...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <svg
            className="w-16 h-16 text-teal-200 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-gray-500 text-base font-medium">
            {search
              ? "No encontramos items que coincidan con tu búsqueda."
              : "El inventario está vacío."}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-8">
            <h3 className="text-sm font-extrabold text-teal-800 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              {cat}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-teal-50/50 text-teal-800 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-4 px-6 rounded-tl-2xl">Item</th>
                      <th className="py-4 px-6 text-center">
                        Stock Disponible
                      </th>
                      <th className="py-4 px-6 text-center hidden sm:table-cell">
                        Mínimo
                      </th>
                      <th className="py-4 px-6 text-center hidden md:table-cell">
                        Precio
                      </th>
                      <th className="py-4 px-6 text-center rounded-tr-2xl">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {catItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-teal-50/30 transition-colors group ${
                          isLow(item) ? "bg-red-50/20" : ""
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {isLow(item) && (
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}
                            <span className="font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              isLow(item)
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-teal-50 text-teal-700 border border-teal-100"
                            }`}
                          >
                            {fmtQty(item.quantity)} {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 font-medium hidden sm:table-cell">
                          {fmtQty(item.min_stock)} {item.unit}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-500 font-medium hidden md:table-cell">
                          {item.price > 0
                            ? `$${parseFloat(item.price).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setAdjustment("");
                                setAdjustType("add");
                                setError("");
                                setModal("adjust");
                              }}
                              title="Ajustar Stock"
                              className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 flex items-center justify-center transition"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                                />
                              </svg>
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
                              title="Editar"
                              className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-600 flex items-center justify-center transition"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.112l-2.83.793c-.5.14-.94-.3-.8-.8l.793-2.83a4.5 4.5 0 011.112-1.89l13.438-13.438zM16.862 4.487L19.5 7.125"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setModal("confirmDelete");
                              }}
                              title="Eliminar"
                              className="w-8 h-8 rounded-lg bg-teal-50 hover:bg-red-100 hover:text-red-600 text-teal-600 flex items-center justify-center transition"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {/* ── MODALES ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            {/* Crear / Editar item */}
            {(modal === "create" || modal === "edit") && (
              <>
                <h2 className="text-xl font-extrabold text-teal-900 mb-6 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-teal-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    {modal === "create" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.89 1.113l-3.4.952c-.5.14-.94-.3-.8-.8l.953-3.4a4.5 4.5 0 011.112-1.89l10.305-10.305z"
                      />
                    )}
                  </svg>
                  {modal === "create" ? "Nuevo Item" : "Editar Item"}
                </h2>

                <SField
                  label="Nombre del producto *"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="Ej: Amoxicilina 500mg"
                />

                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="w-full bg-teal-50/30 border border-teal-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
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

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <SField
                    label="Stock Mínimo"
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

                {error && (
                  <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg mb-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <SGhost onClick={closeModal}>Cancelar</SGhost>
                  <SBtn
                    onClick={modal === "create" ? createItem : updateItem}
                    loading={formLoading}
                    disabled={!form.name || form.quantity === ""}
                  >
                    {modal === "create" ? "Guardar Item" : "Actualizar"}
                  </SBtn>
                </div>
              </>
            )}

            {/* Ajustar cantidad */}
            {modal === "adjust" && activeItem && (
              <>
                <h2 className="text-xl font-extrabold text-teal-900 mb-2 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-teal-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                    />
                  </svg>
                  Ajustar Stock
                </h2>
                <div className="bg-teal-50 rounded-xl p-3 mb-5 border border-teal-100">
                  <p className="text-sm font-semibold text-teal-800">
                    {activeItem.name}
                  </p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    Stock actual:{" "}
                    <strong
                      className={
                        isLow(activeItem) ? "text-red-600" : "text-teal-700"
                      }
                    >
                      {fmtQty(activeItem.quantity)} {activeItem.unit}
                    </strong>
                  </p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
                  <button
                    onClick={() => setAdjustType("add")}
                    className={`flex-1 py-2 flex justify-center items-center gap-1 rounded-lg text-sm font-bold transition-all ${
                      adjustType === "add"
                        ? "bg-white text-teal-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Entrada
                  </button>
                  <button
                    onClick={() => setAdjustType("subtract")}
                    className={`flex-1 py-2 flex justify-center items-center gap-1 rounded-lg text-sm font-bold transition-all ${
                      adjustType === "subtract"
                        ? "bg-white text-red-500 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 12h-15"
                      />
                    </svg>
                    Salida
                  </button>
                </div>

                <div className="mb-2">
                  <SField
                    label="Cantidad a modificar"
                    value={adjustment}
                    type="number"
                    onChange={setAdjustment}
                    placeholder="Ej: 10"
                  />
                </div>

                {adjustment && parseFloat(adjustment) > 0 && (
                  <div className="flex items-center justify-between bg-teal-50/50 border border-teal-100 rounded-xl px-4 py-3 mb-6">
                    <span className="text-sm text-teal-700 font-medium">
                      Nuevo total:
                    </span>
                    <span className="text-lg font-black text-teal-900">
                      {fmtQty(
                        adjustType === "add"
                          ? parseFloat(activeItem.quantity) +
                              parseFloat(adjustment)
                          : parseFloat(activeItem.quantity) -
                              parseFloat(adjustment),
                      )}{" "}
                      <span className="text-sm font-semibold text-teal-700">
                        {activeItem.unit}
                      </span>
                    </span>
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg mb-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-3 mt-2">
                  <SGhost onClick={closeModal}>Cancelar</SGhost>
                  <SBtn
                    onClick={adjustItem}
                    loading={formLoading}
                    disabled={!adjustment}
                  >
                    Confirmar
                  </SBtn>
                </div>
              </>
            )}

            {/* Confirmar eliminar */}
            {modal === "confirmDelete" && activeItem && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                  ¿Eliminar registro?
                </h2>
                <p className="text-sm text-gray-500 mb-8">
                  Se borrará{" "}
                  <strong className="text-gray-800">{activeItem.name}</strong>{" "}
                  del sistema. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <SGhost onClick={closeModal}>Cancelar</SGhost>
                  <button
                    onClick={deleteItem}
                    disabled={formLoading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold transition shadow-md shadow-red-500/20 disabled:opacity-50"
                  >
                    {formLoading ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponentes Estilizados ──────────────────────────────────────────────
function SField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-teal-50/30 border border-teal-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-teal-600/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
      />
    </div>
  );
}

function SBtn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-xl py-2.5 text-sm font-bold transition shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:shadow-none"
    >
      {loading ? "Procesando..." : children}
    </button>
  );
}

function SGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 bg-white border border-teal-200 hover:bg-teal-50 text-teal-700 rounded-xl py-2.5 text-sm font-bold transition"
    >
      {children}
    </button>
  );
}
