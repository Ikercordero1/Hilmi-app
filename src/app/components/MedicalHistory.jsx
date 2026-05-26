//Historial médico de mascotas: búsqueda, creación y edición de fichas, gestión de registros médicos
//  con insumos asociados, interfaz intuitiva y moderna para veterinarios.
"use client";
import { useState, useEffect } from "react";
import {
  Dog,
  Cat,
  PawPrint,
  User,
  IdCard,
  Phone,
  AlertCircle,
  Pencil,
  Trash2,
  Calendar,
  Stethoscope,
  Pill,
  StickyNote,
  FlaskConical,
  X,
  Plus,
  Eye,
  Beaker,
} from "lucide-react";
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function MedicalHistoryPage() {
  // ── Estado principal ──────────────────────────────────────
  const [view, setView] = useState("search"); // "search" | "pet" | "newPet"
  const [search, setSearch] = useState("");
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [records, setRecords] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Modal ─────────────────────────────────────────────────
  const [modal, setModal] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);

  // ── Formulario mascota ────────────────────────────────────
  const [petForm, setPetForm] = useState({
    owner_name: "",
    owner_cedula: "",
    owner_phone: "",
    pet_name: "",
    species: "",
    breed: "",
    age: "",
    notes: "",
  });

  // ── Formulario registro médico ────────────────────────────
  const [recordForm, setRecordForm] = useState({
    vet_name: "",
    visit_date: new Date().toISOString().split("T")[0],
    diagnosis: "",
    treatment: "",
    notes: "",
  });
  const [supplies, setSupplies] = useState([]);

  // ── Búsqueda ──────────────────────────────────────────────
  useEffect(() => {
    if (search.trim().length < 2) {
      setPets([]);
      return;
    }
    const timeout = setTimeout(() => searchPets(), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const searchPets = async () => {
    setSearching(true);
    try {
      const res = await fetch(
        `/api/pets?search=${encodeURIComponent(search)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (Array.isArray(data)) setPets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const loadPet = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pets/${id}`, { cache: "no-store" });
      const data = await res.json();
      setActivePet(data.pet);
      setRecords(data.records ?? []);
      setView("pet");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setError("");
    setActiveRecord(null);
    setSupplies([]);
    setRecordForm({
      vet_name: "",
      visit_date: new Date().toISOString().split("T")[0],
      diagnosis: "",
      treatment: "",
      notes: "",
    });
  };

  // ── CRUD Mascotas ─────────────────────────────────────────
  const createPet = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      await loadPet(data.id);
      setPetForm({
        owner_name: "",
        owner_cedula: "",
        owner_phone: "",
        pet_name: "",
        species: "",
        breed: "",
        age: "",
        notes: "",
      });
      setView("pet");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/pets/${activePet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadPet(activePet.id);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const deletePet = async () => {
    setLoading(true);
    try {
      await fetch(`/api/pets/${activePet.id}`, { method: "DELETE" });
      setView("search");
      setActivePet(null);
      setRecords([]);
      setSearch("");
      setPets([]);
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Registros médicos ────────────────────────────────
  const createRecord = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...recordForm, pet_id: activePet.id, supplies }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadPet(activePet.id);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/medical-records/${activeRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...recordForm, supplies }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadPet(activePet.id);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async () => {
    setLoading(true);
    try {
      await fetch(`/api/medical-records/${activeRecord.id}`, {
        method: "DELETE",
      });
      setRecords((prev) => prev.filter((r) => r.id !== activeRecord.id));
      closeModal();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Insumos ───────────────────────────────────────────────
  const addSupply = () =>
    setSupplies((prev) => [
      ...prev,
      { supply_name: "", quantity: 1, unit: "" },
    ]);

  const updateSupply = (i, field, value) =>
    setSupplies((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );

  const removeSupply = (i) =>
    setSupplies((prev) => prev.filter((_, idx) => idx !== i));

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white w-full rounded-3xl relative overflow-hidden p-6 md:p-10 font-sans text-gray-800">
      
      <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-teal-50 rounded-full mix-blend-multiply blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[30rem] h-[30rem] bg-sky-50 rounded-full mix-blend-multiply blur-3xl opacity-70 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-teal-800 shadow-text-lg  tracking-tight">
              Historial  de Mascotas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Busca una mascota o registra una nueva
            </p>
          </div>
          <div className="flex gap-3">
            {view === "pet" && (
              <button
                onClick={() => setView("search")}
                className="bg-white/60 border border-gray-200 hover:bg-gray-50 backdrop-blur-sm text-gray-600 rounded-xl px-5 py-2.5 text-sm font-medium transition shadow-sm"
              >
                ← Volver
              </button>
            )}
            <button
              onClick={() => {
                setPetForm({
                  owner_name: "",
                  owner_cedula: "",
                  owner_phone: "",
                  pet_name: "",
                  species: "",
                  breed: "",
                  age: "",
                  notes: "",
                });
                setError("");
                setView("newPet");
              }}
              className="bg-teal-600 hover:bg-teal-700 backdrop-blur-md border border-teal-500 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition shadow-[0_4px_14px_0_rgba(13,148,136,0.39)]"
            >
              + Nueva mascota
            </button>
          </div>
        </div>

        {/* ── VISTA: Búsqueda ── */}
        {view === "search" && (
          <div className="max-w-2xl">
            <div className="relative mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de mascota, dueño o cédula..."
                className="w-full bg-white/70 border pl-4 border-gray-200 rounded-2xl px-6 py-4 text-base text-gray-800 placeholder-gray-400 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm pr-12"
              />
              {searching && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {search.trim().length >= 2 && pets.length === 0 && !searching && (
              <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-3xl border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm mb-5">
                  No se encontraron mascotas con ese criterio
                </p>
                <button
                  onClick={() => {
                    setPetForm({
                      owner_name: "",
                      owner_cedula: "",
                      owner_phone: "",
                      pet_name: "",
                      species: "",
                      breed: "",
                      age: "",
                      notes: "",
                    });
                    setView("newPet");
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 py-2.5 text-sm font-medium transition shadow-md"
                >
                  + Registrar nueva mascota
                </button>
              </div>
            )}

            {pets.length > 0 && (
              <div className="space-y-3">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => loadPet(pet.id)}
                    className="w-full gap-6 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-5 hover:bg-gray-50 hover:border-teal-300 transition duration-300 text-left group"
                  >
                    <div className="w-14 gap-4 h-14 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                      {pet.species?.toLowerCase().includes("perro") ? (
                        <Dog className="w-7  h-7" strokeWidth={2} />
                      ) : pet.species?.toLowerCase().includes("gato") ? (
                        <Cat className="w-7 h-7" strokeWidth={2} />
                      ) : (
                        <PawPrint className="w-7 h-7" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-lg">
                        {pet.pet_name}
                      </p>
                      <p className="text-sm text-teal-600 mb-0.5 font-medium">
                        {pet.species} {pet.breed ? `· ${pet.breed}` : ""}
                      </p>
                      <p className="text-xs text-gray-500">
                        👤 {pet.owner_name}{" "}
                        <span className="mx-1 text-gray-300">|</span> 🪪{" "}
                        {pet.owner_cedula}
                      </p>
                    </div>
                    <span className="ml-auto text-gray-300 text-3xl flex-shrink-0 group-hover:text-teal-500 transition-colors">
                      ›
                    </span>
                  </button>
                ))}
              </div>
            )}

            {search.trim().length === 0 && (
              <div className="text-center py-24 text-gray-400">
                <p className="text-6xl mb-5 opacity-40">🔍</p>
                <p className="text-sm tracking-wide font-medium">
                  Escribe al menos 2 caracteres para buscar
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── VISTA: Nueva mascota ── */}
        {view === "newPet" && (
          <div className="max-w-xl bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
              Nueva ficha de mascota
            </h2>

            <SectionTitle>Datos del dueño</SectionTitle>
            <MField
              label="Nombre completo *"
              value={petForm.owner_name}
              onChange={(v) => setPetForm((f) => ({ ...f, owner_name: v }))}
              placeholder="Ej: Juan Pérez"
            />
            <MField
              label="Cédula *"
              value={petForm.owner_cedula}
              onChange={(v) => setPetForm((f) => ({ ...f, owner_cedula: v }))}
              placeholder="Ej: V-12345678"
            />
            <MField
              label="Teléfono"
              value={petForm.owner_phone}
              onChange={(v) => setPetForm((f) => ({ ...f, owner_phone: v }))}
              placeholder="Ej: 0414-1234567"
            />

            <SectionTitle>Datos de la mascota</SectionTitle>
            <MField
              label="Nombre *"
              value={petForm.pet_name}
              onChange={(v) => setPetForm((f) => ({ ...f, pet_name: v }))}
              placeholder="Ej: Firulais"
            />
            <MField
              label="Especie *"
              value={petForm.species}
              onChange={(v) => setPetForm((f) => ({ ...f, species: v }))}
              placeholder="Ej: Perro, Gato"
            />
            <MField
              label="Raza"
              value={petForm.breed}
              onChange={(v) => setPetForm((f) => ({ ...f, breed: v }))}
              placeholder="Ej: Labrador"
            />
            <MField
              label="Edad"
              value={petForm.age}
              onChange={(v) => setPetForm((f) => ({ ...f, age: v }))}
              placeholder="Ej: 3 años"
            />
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Notas adicionales
              </label>
              <textarea
                value={petForm.notes}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Alergias conocidas, condiciones previas..."
                rows={3}
                className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none transition backdrop-blur-sm"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm mb-5 bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-8">
              <MBtn
                onClick={createPet}
                loading={loading}
                disabled={
                  !petForm.owner_name ||
                  !petForm.owner_cedula ||
                  !petForm.pet_name ||
                  !petForm.species
                }
              >
                Registrar mascota
              </MBtn>
              <MGhost onClick={() => setView("search")}>Cancelar</MGhost>
            </div>
          </div>
        )}

        {/* ── VISTA: Perfil de mascota ── */}
        {view === "pet" && activePet && (
          <>
            {/* Ficha de la mascota */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-lg p-8 mb-10 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-teal-100/50 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-wrap items-start justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-4xl shadow-inner">
                    {activePet.species?.toLowerCase().includes("perro") ? (
                      <Dog className="w-6 h-6 text-teal-600" strokeWidth={2} />
                    ) : activePet.species?.toLowerCase().includes("gato") ? (
                      <Cat className="w-6 h-6 text-teal-600" strokeWidth={2} />
                    ) : (
                      <PawPrint
                        className="w-6 h-6 text-teal-600"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {activePet.pet_name}
                      </h2>
                      <span className="text-xs bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-full font-semibold tracking-wider">
                        #{activePet.id}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {activePet.species}{" "}
                      {activePet.breed ? `· ${activePet.breed}` : ""}{" "}
                      {activePet.age ? `· ${activePet.age}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mt-1">
                      {/* Nombre del Dueño */}
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <User
                          className="w-3.5 h-3.5 text-teal-600"
                          strokeWidth={2.5}
                        />
                        {activePet.owner_name}
                      </span>

                      {/* Cédula */}
                      <span className="flex items-center gap-1.5">
                        <IdCard
                          className="w-3.5 h-3.5 text-gray-400"
                          strokeWidth={2}
                        />
                        {activePet.owner_cedula}
                      </span>

                      {/* Teléfono (Condicional) */}
                      {activePet.owner_phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone
                            className="w-3.5 h-3.5 text-gray-400"
                            strokeWidth={2}
                          />
                          {activePet.owner_phone}
                        </span>
                      )}
                    </div>

                    {/* Notas (Condicional) */}
                    {activePet.notes && (
                      <div className="inline-flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mt-3 shadow-sm">
                        <AlertCircle
                          className="w-4 h-4 text-amber-600 flex-shrink-0 mt-px"
                          strokeWidth={2.5}
                        />
                        <span className="leading-relaxed">
                          {activePet.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPetForm({ ...activePet });
                      setError("");
                      setModal("editPet");
                    }}
                    className="flex items-center gap-2 bg-white/60 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 hover:text-teal-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-all backdrop-blur-sm shadow-sm"
                  >
                    <Pencil
                      className="w-4 h-4 text-gray-500 group-hover:text-teal-600"
                      strokeWidth={2}
                    />
                    Editar ficha
                  </button>

                  <button
                    onClick={() => setModal("confirmDeletePet")}
                    className="flex items-center gap-2 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 text-red-600 hover:text-red-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-all backdrop-blur-sm shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Historial */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                Historial médico
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                  {records.length} registros
                </span>
              </h3>
              <button
                onClick={() => {
                  setRecordForm({
                    vet_name: "",
                    visit_date: new Date().toISOString().split("T")[0],
                    diagnosis: "",
                    treatment: "",
                    notes: "",
                  });
                  setSupplies([]);
                  setError("");
                  setModal("newRecord");
                }}
                className="bg-teal-600 hover:bg-teal-700 backdrop-blur-md border border-teal-500 text-white rounded-xl px-5 py-2 text-sm font-medium transition shadow-md"
              >
                + Nuevo registro
              </button>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                <p className="text-5xl mb-4 opacity-40">📋</p>
                <p className="text-gray-500 text-sm font-medium">
                  Sin registros médicos aún
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-teal-300 hover:shadow-md transition duration-300"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      {/* COLUMNA IZQUIERDA: Información */}
                      <div className="min-w-0 flex-1 w-full">
                        {/* Encabezado: ID, Fecha, Vet */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="text-xs font-mono bg-gray-100 border border-gray-200 text-gray-600 px-2 py-1 rounded-md">
                            #{rec.id}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-bold text-gray-800 tracking-tight">
                            <Calendar
                              className="w-4 h-4 text-teal-600"
                              strokeWidth={2.5}
                            />
                            {fmtDate(rec.visit_date)}
                          </span>
                          {rec.vet_name && (
                            <span className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                              <User className="w-3.5 h-3.5" strokeWidth={2.5} />
                              {rec.vet_name}
                            </span>
                          )}
                        </div>

                        {/* Cuerpo: Diagnóstico y Tratamiento */}
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2">
                            <Stethoscope
                              className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5"
                              strokeWidth={2}
                            />
                            <p className="text-base text-gray-800 font-semibold tracking-tight leading-snug">
                              {rec.diagnosis}
                            </p>
                          </div>

                          {rec.treatment && (
                            <div className="flex items-start gap-2">
                              <Pill
                                className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
                                strokeWidth={2}
                              />
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {rec.treatment}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Insumos */}
                        {rec.supplies?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                            {rec.supplies.map((s, i) => (
                              <span
                                key={i}
                                className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 border border-blue-100 px-3 py-1.5 rounded-lg font-medium shadow-sm"
                              >
                                <Beaker
                                  className="w-3 h-3 text-blue-600"
                                  strokeWidth={2.5}
                                />
                                {s.supply_name}
                                <span className="text-blue-500 font-semibold ml-1">
                                  {s.quantity} {s.unit}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* COLUMNA DERECHA: Botones de Acción */}
                      <div className="flex sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            setActiveRecord(rec);
                            setRecordForm({
                              vet_name: rec.vet_name ?? "",
                              visit_date: rec.visit_date ?? "",
                              diagnosis: rec.diagnosis ?? "",
                              treatment: rec.treatment ?? "",
                              notes: rec.notes ?? "",
                            });
                            setSupplies(rec.supplies ?? []);
                            setError("");
                            setModal("viewRecord");
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-sm"
                        >
                          <Eye
                            className="w-4 h-4 text-gray-500"
                            strokeWidth={2}
                          />
                          <span>Ver</span>
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setActiveRecord(rec);
                              setRecordForm({
                                vet_name: rec.vet_name ?? "",
                                visit_date: rec.visit_date ?? "",
                                diagnosis: rec.diagnosis ?? "",
                                treatment: rec.treatment ?? "",
                                notes: rec.notes ?? "",
                              });
                              setSupplies(rec.supplies ?? []);
                              setError("");
                              setModal("editRecord");
                            }}
                            className="flex items-center justify-center w-11 h-11 bg-white border border-gray-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-gray-600 rounded-xl transition-all shadow-sm flex-shrink-0"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={2} />
                          </button>

                          <button
                            onClick={() => {
                              setActiveRecord(rec);
                              setModal("confirmDeleteRecord");
                            }}
                            className="flex items-center justify-center w-11 h-11 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 text-red-600 rounded-xl transition-all shadow-sm flex-shrink-0"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODALES ── */}
        {/* Confirmar eliminar mascota */}
        {modal === "confirmDeletePet" && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Eliminar mascota?
            </h2>
            <p className="text-sm text-red-800 mb-8 bg-red-50 border border-red-200 p-5 rounded-2xl">
              Se eliminará la ficha de{" "}
              <strong className="font-bold">{activePet?.pet_name}</strong> y
              todo su historial médico. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={deletePet}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 border border-red-500 text-white rounded-xl py-3 text-sm font-medium transition shadow-md disabled:opacity-50"
              >
                {loading ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <MGhost onClick={closeModal}>Cancelar</MGhost>
            </div>
          </>
        )}

        {(modal === "newRecord" || modal === "editRecord") && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">
              {modal === "newRecord"
                ? "Nuevo registro médico"
                : "Editar registro"}
            </h2>

            {/* Fecha + Veterinario */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={recordForm.visit_date}
                  onChange={(e) =>
                    setRecordForm((f) => ({ ...f, visit_date: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>
              <MField
                label="Veterinario"
                value={recordForm.vet_name}
                onChange={(v) => setRecordForm((f) => ({ ...f, vet_name: v }))}
                placeholder="Nombre del veterinario"
              />
            </div>

            {/* Diagnóstico */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                Diagnóstico *
              </label>
              <textarea
                value={recordForm.diagnosis}
                onChange={(e) =>
                  setRecordForm((f) => ({ ...f, diagnosis: e.target.value }))
                }
                placeholder="Describe el diagnóstico..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none transition"
              />
            </div>

            {/* Tratamiento + Notas en 2 columnas */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Tratamiento
                </label>
                <textarea
                  value={recordForm.treatment}
                  onChange={(e) =>
                    setRecordForm((f) => ({ ...f, treatment: e.target.value }))
                  }
                  placeholder="Medicamentos, procedimientos..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Notas
                </label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) =>
                    setRecordForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Observaciones, seguimiento..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none transition"
                />
              </div>
            </div>

            {/* Insumos */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">
                  Insumos utilizados
                </p>
                <button
                  onClick={addSupply}
                  className="flex items-center gap-1 text-xs text-teal-700 font-semibold bg-white border border-teal-200 hover:bg-teal-50 rounded-lg px-2.5 py-1 transition"
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                  Añadir
                </button>
              </div>

              {supplies.length === 0 ? (
                <div className="text-center py-3 border border-dashed border-gray-300 rounded-xl text-xs text-gray-400 bg-white">
                  Sin insumos — toca "Añadir" para registrar materiales usados
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_70px_60px_32px] gap-2 px-1">
                    <span className="text-xs text-gray-400">Nombre</span>
                    <span className="text-xs text-gray-400 text-center">
                      Cant.
                    </span>
                    <span className="text-xs text-gray-400 text-center">
                      Unidad
                    </span>
                    <span />
                  </div>
                  {supplies.map((s, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_70px_60px_32px] gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={s.supply_name}
                        onChange={(e) =>
                          updateSupply(i, "supply_name", e.target.value)
                        }
                        placeholder="Ej: Amoxicilina"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input
                        type="number"
                        value={s.quantity}
                        onChange={(e) =>
                          updateSupply(i, "quantity", Number(e.target.value))
                        }
                        placeholder="0"
                        min="0"
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input
                        type="text"
                        value={s.unit}
                        onChange={(e) =>
                          updateSupply(i, "unit", e.target.value)
                        }
                        placeholder="ml"
                        className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => removeSupply(i)}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 flex items-center justify-center transition flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 p-3 rounded-xl">
                <p className="text-red-700 text-xs font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-gray-200">
              <MBtn
                onClick={modal === "newRecord" ? createRecord : updateRecord}
                loading={loading}
                disabled={!recordForm.diagnosis || !recordForm.visit_date}
              >
                {modal === "newRecord" ? "Guardar registro" : "Guardar cambios"}
              </MBtn>
              <MGhost onClick={closeModal}>Cancelar</MGhost>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <p className="text-xs font-bold text-teal-700 uppercase tracking-widest mt-6 mb-4 border-b border-gray-100 pb-2">
      {children}
    </p>
  );
}

function MField({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition backdrop-blur-sm shadow-sm"
      />
    </div>
  );
}

function IRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 text-sm">
      <span className="w-6 text-center text-xl flex-shrink-0">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-teal-700 w-28 flex-shrink-0 pt-1">
        {label}
      </span>
      <span className="text-base font-semibold text-gray-800 pt-0.5">
        {value}
      </span>
    </div>
  );
}

function MBtn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-teal-600 hover:bg-teal-700 backdrop-blur-md border border-teal-500 text-white rounded-xl py-3 text-sm font-medium transition shadow-[0_4px_14px_0_rgba(13,148,136,0.39)] disabled:opacity-50 disabled:shadow-none disabled:hover:bg-teal-600"
    >
      {loading ? "Guardando..." : children}
    </button>
  );
}

function MGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 bg-white/50 border border-gray-200 hover:bg-gray-100 backdrop-blur-sm text-gray-700 rounded-xl py-3 text-sm font-medium transition shadow-sm"
    >
      {children}
    </button>
  );
}
