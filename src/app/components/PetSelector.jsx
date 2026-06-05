"use client";

import { useState, useEffect, useRef } from "react";

const EMPTY_PET_FORM = {
  pet_name: "",
  species: "",
  breed: "",
  age: "",
  owner_name: "",
  owner_cedula: "",
  owner_phone: "",
  notes: "",
};

const SPECIES_OPTIONS = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"];

export default function PetSelector({ value, onChange, disabled = false }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [crudMode, setCrudMode] = useState(null);
  const [crudTarget, setCrudTarget] = useState(null);
  const [petForm, setPetForm] = useState(EMPTY_PET_FORM);
  const [crudSaving, setCrudSaving] = useState(false);
  const [crudError, setCrudError] = useState(null);
  const dropdownRef = useRef(null);

  const fetchPets = async () => {
    try {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setPets(json.data);
    } catch (err) {
      console.error("Error al cargar mascotas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = pets.filter((p) => {
    if (!search) return true;
    const t = search.toLowerCase();
    return (
      p.pet_name?.toLowerCase().includes(t) ||
      p.owner_name?.toLowerCase().includes(t) ||
      p.owner_cedula?.toLowerCase().includes(t) ||
      p.owner_phone?.toLowerCase().includes(t) ||
      p.species?.toLowerCase().includes(t) ||
      p.breed?.toLowerCase().includes(t) ||
      p.age?.toLowerCase().includes(t)
    );
  });

  const handleSelect = (pet) => {
    onChange(pet);
    setDropdownOpen(false);
    setSearch("");
  };
  const handleClear = () => onChange(null);

  const openCreate = (e) => {
    e.stopPropagation();
    setDropdownOpen(false);
    setPetForm(EMPTY_PET_FORM);
    setCrudError(null);
    setCrudMode("create");
  };

  const openEdit = (e, pet) => {
    e.stopPropagation();
    setDropdownOpen(false);
    setCrudTarget(pet);
    setPetForm({
      pet_name: pet.pet_name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      age: pet.age || "",
      owner_name: pet.owner_name || "",
      owner_cedula: pet.owner_cedula || "",
      owner_phone: pet.owner_phone || "",
      notes: pet.notes || "",
    });
    setCrudError(null);
    setCrudMode("edit");
  };

  const openDelete = (e, pet) => {
    e.stopPropagation();
    setDropdownOpen(false);
    setCrudTarget(pet);
    setCrudMode("delete");
  };

  const closeCrud = () => {
    setCrudMode(null);
    setCrudTarget(null);
    setCrudError(null);
    setPetForm(EMPTY_PET_FORM);
  };

  const validateForm = () => {
    if (
      !petForm.pet_name ||
      !petForm.species ||
      !petForm.owner_name ||
      !petForm.owner_cedula
    ) {
      setCrudError(
        "Completa: nombre de mascota, especie, nombre del dueno y cedula.",
      );
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    setCrudError(null);
    if (!validateForm()) return;
    setCrudSaving(true);
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petForm),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) {
        setCrudError(json.message);
        return;
      }
      await fetchPets();
      const updated = await fetch("/api/pets").then((r) => r.json());
      const nueva = updated.data?.find((p) => p.id === json.id);
      if (nueva) onChange(nueva);
      closeCrud();
    } catch (err) {
      setCrudError("Error de conexion: " + err.message);
    } finally {
      setCrudSaving(false);
    }
  };

  const handleUpdate = async () => {
    setCrudError(null);
    if (!validateForm()) return;
    setCrudSaving(true);
    try {
      const res = await fetch(`/api/pets/${crudTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petForm),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) {
        setCrudError(json.message);
        return;
      }
      await fetchPets();
      if (value?.id === crudTarget.id) onChange({ ...crudTarget, ...petForm });
      closeCrud();
    } catch (err) {
      setCrudError("Error de conexion: " + err.message);
    } finally {
      setCrudSaving(false);
    }
  };

  const handleDelete = async () => {
    setCrudSaving(true);
    try {
      const res = await fetch(`/api/pets/${crudTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) {
        setCrudError(json.message);
        return;
      }
      await fetchPets();
      if (value?.id === crudTarget.id) onChange(null);
      closeCrud();
    } catch (err) {
      setCrudError("Error de conexion: " + err.message);
    } finally {
      setCrudSaving(false);
    }
  };

  const speciesIcon = (s) => {
    const map = {
      perro: "🐶",
      gato: "🐱",
      ave: "🐦",
      conejo: "🐰",
      reptil: "🦎",
    };
    return map[(s || "").toLowerCase()] || "🐾";
  };

  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-600">
          Paciente (mascota) *
        </label>

        {value ? (
          <div className="flex items-center gap-3 rounded-lg border border-teal-300 bg-teal-50 px-3 py-2.5">
            <span className="text-xl">{speciesIcon(value.species)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {value.pet_name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {value.owner_name}
                {value.species && ` - ${value.species}`}
                {value.breed && ` - ${value.breed}`}
                {value.age && ` - ${value.age}`}
              </p>
            </div>
            {!disabled && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => openEdit(e, value)}
                  className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                  title="Editar mascota"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Cambiar mascota"
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
              </div>
            )}
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((p) => !p)}
              disabled={disabled || loading}
              className="w-full flex items-center justify-between gap-2 rounded-lg border-2
                         border-dashed border-teal-300 px-3 py-2.5 text-sm text-teal-700 font-medium
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                  />
                </svg>
                {loading ? "Cargando mascotas..." : "Seleccionar mascota..."}
              </span>
              <svg
                className={`w-4 h-4 flex-shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
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

            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="p-2 border-b border-slate-100">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nombre, dueno, cedula, especie..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm text-slate-400">
                        {search
                          ? "Sin resultados"
                          : "No hay mascotas registradas"}
                      </p>
                    </div>
                  ) : (
                    filtered.map((pet) => (
                      <div
                        key={pet.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50
                                   transition-colors border-b border-slate-50 last:border-0 group/item"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(pet)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <span className="text-xl flex-shrink-0">
                            {speciesIcon(pet.species)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {pet.pet_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {pet.owner_name}
                              {pet.species && ` - ${pet.species}`}
                              {pet.breed && ` - ${pet.breed}`}
                            </p>
                          </div>
                          {pet.age && (
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {pet.age}
                            </span>
                          )}
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => openEdit(e, pet)}
                            className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                            title="Editar"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDelete(e, pet)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="w-full flex items-center justify-center gap-2 rounded-lg
                               bg-gradient-to-r from-teal-600 to-cyan-700 text-white
                               text-sm font-semibold px-3 py-2
                               hover:from-teal-700 hover:to-cyan-800 transition-all"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Nueva mascota
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {value && !disabled && (
          <button
            type="button"
            onClick={openCreate}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium underline underline-offset-2 transition-colors"
          >
            + Registrar otra mascota
          </button>
        )}
      </div>

      {/* Modal crear / editar */}
      {crudMode && crudMode !== "delete" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-700 to-cyan-800">
              <h3 className="text-base font-bold text-white">
                {crudMode === "create"
                  ? "Nueva Mascota"
                  : `Editar - ${crudTarget?.pet_name}`}
              </h3>
              <button
                onClick={closeCrud}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
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
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {crudError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <svg
                    className="w-4 h-4 text-red-500 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-700">{crudError}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Mascota
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Nombre *</label>
                    <input
                      type="text"
                      value={petForm.pet_name}
                      onChange={(e) =>
                        setPetForm((p) => ({ ...p, pet_name: e.target.value }))
                      }
                      placeholder="ej: Max"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Especie *</label>
                    <select
                      value={petForm.species}
                      onChange={(e) =>
                        setPetForm((p) => ({ ...p, species: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">Seleccionar...</option>
                      {SPECIES_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Raza</label>
                    <input
                      type="text"
                      value={petForm.breed}
                      onChange={(e) =>
                        setPetForm((p) => ({ ...p, breed: e.target.value }))
                      }
                      placeholder="ej: Labrador"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Edad</label>
                    <input
                      type="text"
                      value={petForm.age}
                      onChange={(e) =>
                        setPetForm((p) => ({ ...p, age: e.target.value }))
                      }
                      placeholder="ej: 3 anos"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Dueno
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Nombre completo *</label>
                    <input
                      type="text"
                      value={petForm.owner_name}
                      onChange={(e) =>
                        setPetForm((p) => ({
                          ...p,
                          owner_name: e.target.value,
                        }))
                      }
                      placeholder="ej: Carlos Perez"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Cedula *</label>
                    <input
                      type="text"
                      value={petForm.owner_cedula}
                      onChange={(e) =>
                        setPetForm((p) => ({
                          ...p,
                          owner_cedula: e.target.value,
                        }))
                      }
                      placeholder="ej: V-12345678"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telefono</label>
                    <input
                      type="text"
                      value={petForm.owner_phone}
                      onChange={(e) =>
                        setPetForm((p) => ({
                          ...p,
                          owner_phone: e.target.value,
                        }))
                      }
                      placeholder="ej: 0414-1234567"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Notas</label>
                <textarea
                  rows={2}
                  value={petForm.notes}
                  onChange={(e) =>
                    setPetForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Observaciones generales..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={closeCrud}
                disabled={crudSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600
                           hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={crudMode === "create" ? handleCreate : handleUpdate}
                disabled={crudSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700
                           text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-sm
                           hover:from-teal-700 hover:to-cyan-800 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {crudSaving ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Guardando...
                  </>
                ) : crudMode === "create" ? (
                  "Registrar mascota"
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminacion */}
      {crudMode === "delete" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="text-4xl">⚠️</div>
              <h3 className="text-base font-bold text-slate-800">
                Eliminar mascota?
              </h3>
              <p className="text-sm text-slate-600">
                Vas a eliminar a <strong>{crudTarget?.pet_name}</strong> (
                {crudTarget?.owner_name}). Esta accion no se puede deshacer.
              </p>
            </div>
            {crudError && (
              <p className="text-xs text-red-600 text-center bg-red-50 rounded-lg px-3 py-2">
                {crudError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={closeCrud}
                disabled={crudSaving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-600
                           border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={crudSaving}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600
                           text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors
                           disabled:opacity-50"
              >
                {crudSaving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white transition-colors";
const labelClass = "block text-xs font-semibold text-slate-600 mb-1";
