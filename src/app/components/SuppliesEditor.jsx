// SuppliesEditor
// Componente dropdown que carga insumos del inventario en tiempo real.
// Permite seleccionar múltiples insumos con su cantidad y valida vs. stock disponible.

"use client";

import { useState, useEffect, useRef } from "react";

export default function SuppliesEditor({
  value = [],
  onChange,
  disabled = false,
}) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Cargar inventario al montar
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const json = await res.json();
        if (json.success) setInventory(json.data);
      } catch (err) {
        console.error("Error al cargar inventario:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Insumos que no están ya seleccionados + filtramos por búsqueda
  const selectedIds = new Set(value.map((v) => v.inventory_id));

  const filteredInventory = inventory.filter((item) => {
    const alreadySelected = selectedIds.has(item.inventory_id);
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase());
    return !alreadySelected && matchesSearch && item.stock > 0;
  });

  // Agregar insumo seleccionado desde el dropdown
  const handleSelect = (item) => {
    const newItem = {
      inventory_id: item.inventory_id,
      name: item.name,
      quantity_used: 1,
      unit: item.unit,
      stock: item.stock,
      category: item.category,
    };
    onChange([...value, newItem]);
    setSearch("");
    setDropdownOpen(false);
  };

  // Cambiar cantidad de un insumo ya seleccionado
  const handleQuantityChange = (inventory_id, rawValue) => {
    const qty = parseInt(rawValue, 10);
    if (isNaN(qty) || qty < 0) return;
    onChange(
      value.map((item) =>
        item.inventory_id === inventory_id
          ? { ...item, quantity_used: qty }
          : item,
      ),
    );
  };

  // Quitar insumo de la lista
  const handleRemove = (inventory_id) => {
    onChange(value.filter((item) => item.inventory_id !== inventory_id));
  };

  // Determinar si la cantidad excede el stock (advertencia visual)
  const isOverStock = (item) => item.quantity_used > item.stock;

  // Agrupar inventario disponible por categoría para el dropdown
  const groupedInventory = filteredInventory.reduce((acc, item) => {
    const cat = item.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          Insumos utilizados
        </label>
        {value.length > 0 && (
          <span className="text-xs text-slate-500">
            {value.length} insumo{value.length !== 1 ? "s" : ""} seleccionado
            {value.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Lista de insumos seleccionados */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item) => {
            const over = isOverStock(item);
            return (
              <div
                key={item.inventory_id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                  over
                    ? "bg-amber-50 border-amber-300"
                    : "bg-teal-50 border-teal-200"
                }`}
              >
                {/* Ícono de categoría */}
                <span className="text-lg select-none">
                  {getCategoryIcon(item.category)}
                </span>

                {/* Info del insumo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Stock disponible:{" "}
                    <span
                      className={
                        over
                          ? "text-amber-600 font-semibold"
                          : "text-teal-700 font-semibold"
                      }
                    >
                      {item.stock} {item.unit}
                    </span>
                  </p>
                </div>

                {/* Control de cantidad */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={disabled || item.quantity_used <= 1}
                    onClick={() =>
                      handleQuantityChange(
                        item.inventory_id,
                        item.quantity_used - 1,
                      )
                    }
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-600 
                               flex items-center justify-center text-sm font-bold
                               hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity_used}
                    disabled={disabled}
                    onChange={(e) =>
                      handleQuantityChange(item.inventory_id, e.target.value)
                    }
                    className={`w-14 text-center text-sm rounded border px-1 py-0.5 font-semibold
                                focus:outline-none focus:ring-2 transition-colors
                                ${
                                  over
                                    ? "border-amber-400 text-amber-700 focus:ring-amber-300 bg-amber-50"
                                    : "border-teal-300 text-teal-800 focus:ring-teal-300 bg-white"
                                }
                                disabled:opacity-50`}
                  />

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      handleQuantityChange(
                        item.inventory_id,
                        item.quantity_used + 1,
                      )
                    }
                    className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-600 
                               flex items-center justify-center text-sm font-bold
                               hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors"
                  >
                    +
                  </button>

                  <span className="text-xs text-slate-400 w-8">
                    {item.unit}
                  </span>
                </div>

                {/* Botón quitar */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item.inventory_id)}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-1 flex-shrink-0"
                    title="Quitar insumo"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}

                {/* Advertencia de stock */}
                {over && (
                  <span
                    title={`Stock insuficiente. Solo hay ${item.stock} ${item.unit} disponibles. Se descontarán ${item.stock}.`}
                    className="text-amber-500 flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Advertencia global si hay algún insumo sobre stock */}
      {value.some(isOverStock) && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <svg
            className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-amber-700">
            Algunos insumos tienen cantidad mayor al stock. Se descontará solo
            lo disponible y el registro se guardará con advertencia.
          </p>
        </div>
      )}

      {/* Dropdown para añadir insumos */}
      {!disabled && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            disabled={loading}
            className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed 
                       border-teal-300 px-3 py-2 text-sm text-teal-700 font-medium
                       hover:border-teal-500 hover:bg-teal-50 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {loading ? "Cargando inventario..." : "Agregar insumo"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Panel del dropdown */}
          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {/* Buscador */}
              <div className="p-2 border-b border-slate-100">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar insumo o categoría..."
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>

              {/* Lista agrupada */}
              <div className="max-h-64 overflow-y-auto">
                {Object.keys(groupedInventory).length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-slate-400">
                      {search
                        ? "Sin resultados para esa búsqueda"
                        : "Todos los insumos con stock ya están seleccionados"}
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedInventory).map(([category, items]) => (
                    <div key={category}>
                      {/* Header de categoría */}
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {getCategoryIcon(category)} {category}
                        </span>
                      </div>

                      {/* Items de la categoría */}
                      {items.map((item) => (
                        <button
                          key={item.inventory_id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left
                                     hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                item.stock <= (item.min_stock || 0)
                                  ? "bg-red-100 text-red-600"
                                  : item.stock <= (item.min_stock || 0) * 2
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-teal-100 text-teal-700"
                              }`}
                            >
                              {item.stock} {item.unit}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Footer info */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  Solo se muestran insumos con stock disponible
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {value.length === 0 && !dropdownOpen && (
        <p className="text-xs text-slate-400 text-center py-1">
          No se han registrado insumos para esta consulta
        </p>
      )}
    </div>
  );
}

// Helper -  ícono por categoría
function getCategoryIcon(category) {
  const map = {
    medicamento: "💊",
    medicina: "💊",
    vacuna: "💉",
    jeringa: "💉",
    material: "🩺",
    material_quirurgico: "🩺",
    quirúrgico: "🩺",
    quirurgico: "🩺",
    limpieza: "🧴",
    alimento: "🐾",
    suero: "🧪",
    antibiótico: "🔬",
    antibiotico: "🔬",
    antiparasitario: "🐛",
    anestesia: "😴",
  };
  const key = (category || "").toLowerCase().replace(/\s+/g, "_");
  return map[key] || "📦";
}
