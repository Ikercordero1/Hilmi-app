//En este componente se logra apreciar los registros clínicos  existentes ofreciendo mayores
//  datos sobre las mascotas atendidas e infiriendo directamente en el stock
"use client";

import { useState, useEffect } from "react";
import SuppliesEditor from "./SuppliesEditor";
import PetSelector from "./PetSelector";

const EMPTY_FORM = {
  pet: null,
  vet_name: "",
  visit_date: new Date().toISOString().split("T")[0],
  diagnosis: "",
  treatment: "",
  notes: "",
  supplies: [],
};

export default function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medical-records");
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch (err) {
      console.error("Error al cargar registros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setError(null);
    setStockWarnings([]);

    if (!form.pet) {
      setError("Selecciona una mascota.");
      return;
    }
    if (!form.visit_date || !form.diagnosis) {
      setError("Completa los campos obligatorios: Fecha y Diagnóstico.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pet_id: form.pet.id,
        vet_name: form.vet_name || null,
        visit_date: form.visit_date,
        diagnosis: form.diagnosis,
        treatment: form.treatment || null,
        notes: form.notes || null,
        supplies: form.supplies.map((s) => ({
          inventory_id: s.inventory_id,
          quantity_used: s.quantity_used,
        })),
      };

      const res = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Error al guardar");
        return;
      }

      if (json.stockWarnings?.length > 0) {
        setStockWarnings(json.stockWarnings);
      } else {
        closeModal();
      }

      await fetchRecords();
    } catch (err) {
      setError("Error de conexión al guardar el registro.");
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setError(null);
    setStockWarnings([]);
  };

  const filtered = records.filter((r) => {
    // La busqueda muestra todo si no hay una mascota registrada escrita en el searchbard
    if (!search && filterSpecies === "all") return true;

    const term = search.toLowerCase();

    // Se convierte la búsqueda a texto limpio (solo letras y números, sin espacios ni símbolos)
    // Esto nos sirve específicamente para comparar cédulas y teléfonos
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");

    // Función salvavidas normal
    const safeString = (val) => (val ? String(val).toLowerCase() : "");
    // Función para limpiar de símbolos y espacios la data de la DB
    const cleanString = (val) => safeString(val).replace(/[^a-z0-9]/g, "");

    const matchesSearch =
      !search ||
      safeString(r.pet_name).includes(term) ||
      safeString(r.owner_name).includes(term) ||
      // Usamos cleanString para que "V - 30.849.008" se convierta en "v30849008" y coincida siempre algo importante al transcribir
      cleanString(r.owner_cedula).includes(cleanTerm) ||
      cleanString(r.owner_phone).includes(cleanTerm) ||
      safeString(r.species).includes(term) ||
      safeString(r.breed).includes(term) ||
      safeString(r.diagnosis).includes(term) ||
      safeString(r.treatment).includes(term) ||
      safeString(r.vet_name).includes(term);

    const matchesSpecies =
      filterSpecies === "all" || safeString(r.species) === filterSpecies;

    return matchesSearch && matchesSpecies;
  });

  const species = [...new Set(records.map((r) => r.species).filter(Boolean))];

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mascota, dueño, diagnóstico..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
            />
          </div>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700
                       focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
          >
            <option value="all">Todas las especies</option>
            {species.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {capitalize(s)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700
                     text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm
                     hover:from-teal-700 hover:to-cyan-800 transition-all active:scale-95"
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
          Nuevo registro
        </button>
      </div>

      <p className="text-xs text-slate-500">
        {loading
          ? "Cargando..."
          : `${filtered.length} registro${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* ── Lista ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState onNew={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              onView={() => setViewModal(record)}
            />
          ))}
        </div>
      )}

      {/* ── MODAL: Nuevo Registro  ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-700 to-cyan-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ClipboardIcon className="w-5 h-5 text-teal-200" />
                Nuevo Registro Clínico
              </h2>
              <button
                onClick={closeModal}
                className="text-white/70 hover:text-white transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="space-y-6">
                {/* Alertas */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <AlertTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {stockWarnings.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
                    <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangleIcon className="w-4 h-4" />
                      Registro guardado con advertencias de stock:
                    </p>
                    <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                      {stockWarnings.map((w, i) => (
                        <li key={i}>{w.message}</li>
                      ))}
                    </ul>
                    <button
                      onClick={closeModal}
                      className="mt-2 text-xs font-semibold text-amber-800 underline hover:text-amber-900"
                    >
                      Entendido, cerrar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  {/* Selector de mascota (Ocupa ambas columnas) */}
                  <div className="md:col-span-2">
                    <Section title="Paciente">
                      <PetSelector
                        value={form.pet}
                        onChange={(pet) => handleChange("pet", pet)}
                      />
                    </Section>
                  </div>

                  {/* Consulta - Columna 1 */}
                  <div className="space-y-5">
                    <Section title="Datos de la Visita">
                      <div>
                        <label className={labelClass}>Fecha de visita *</label>
                        <input
                          type="date"
                          value={form.visit_date}
                          onChange={(e) =>
                            handleChange("visit_date", e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Veterinario</label>
                        <input
                          type="text"
                          value={form.vet_name}
                          onChange={(e) =>
                            handleChange("vet_name", e.target.value)
                          }
                          placeholder="Nombre del veterinario tratante"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Diagnóstico *</label>
                        <textarea
                          rows={3}
                          value={form.diagnosis}
                          onChange={(e) =>
                            handleChange("diagnosis", e.target.value)
                          }
                          placeholder="Diagnóstico clínico detallado..."
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </Section>
                  </div>

                  {/* Consulta - Columna 2 */}
                  <div className="space-y-5">
                    <Section title="Tratamiento y Notas">
                      <div>
                        <label className={labelClass}>Tratamiento</label>
                        <textarea
                          rows={3}
                          value={form.treatment}
                          onChange={(e) =>
                            handleChange("treatment", e.target.value)
                          }
                          placeholder="Plan de tratamiento indicado..."
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Notas adicionales</label>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={(e) =>
                            handleChange("notes", e.target.value)
                          }
                          placeholder="Observaciones, recomendaciones o próximos pasos..."
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </Section>
                  </div>

                  {/* Insumos (Ocupa ambas columnas) */}
                  <div className="md:col-span-2">
                    <Section
                      title="Insumos utilizados"
                      subtitle="Se descontarán automáticamente del inventario al guardar el registro."
                    >
                      <SuppliesEditor
                        value={form.supplies}
                        onChange={(supplies) =>
                          handleChange("supplies", supplies)
                        }
                      />
                    </Section>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 flex-shrink-0">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600
                           hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700
                           text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-sm
                           hover:from-teal-700 hover:to-cyan-800 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {saving ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Guardar registro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Ver Registro ── */}
      {viewModal && (
        <ViewRecordModal
          record={viewModal}
          onClose={() => setViewModal(null)}
        />
      )}
    </div>
  );
}

// ── Sub-componentes ─────────────────────────────────────────────

function RecordCard({ record, onView }) {
  return (
    <div
      onClick={onView}
      className="bg-white rounded-xl border border-slate-200 px-5 py-4 cursor-pointer
                 hover:border-teal-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <SpeciesIcon species={record.species} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-slate-800 truncate">
                {record.pet_name}
              </span>
              {record.species && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium flex-shrink-0">
                  {capitalize(record.species)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-1.5">
              {record.owner_name}
              {record.vet_name && ` • Dr/a. ${record.vet_name}`}
            </p>
            <p className="text-sm text-slate-700 line-clamp-2">
              {record.diagnosis}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            {formatDate(record.visit_date)}
          </p>
          {record.supplies?.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
                         bg-cyan-50 text-cyan-700 border border-cyan-100"
            >
              <PackageIcon className="w-3.5 h-3.5" />
              {record.supplies.length} insumo
              {record.supplies.length !== 1 ? "s" : ""}
            </span>
          )}
          <div className="text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium pt-1">
            Ver detalle →
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewRecordModal({ record, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-700 to-cyan-800">
          <div className="flex items-center gap-4">
            <SpeciesIcon species={record.species} lightMode />
            <div>
              <h2 className="text-lg font-bold text-white">
                {record.pet_name}
              </h2>
              <p className="text-xs text-teal-100">
                {record.owner_name} • {formatDate(record.visit_date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {record.species && (
              <InfoRow label="Especie" value={capitalize(record.species)} />
            )}
            {record.breed && <InfoRow label="Raza" value={record.breed} />}
            {record.age && <InfoRow label="Edad" value={record.age} />}
            {record.vet_name && (
              <InfoRow label="Veterinario" value={`Dr/a. ${record.vet_name}`} />
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <InfoRow label="Diagnóstico" value={record.diagnosis} />
            {record.treatment && (
              <InfoRow label="Tratamiento" value={record.treatment} />
            )}
            {record.notes && <InfoRow label="Notas" value={record.notes} />}
          </div>

          <div className="border-t border-slate-100 pt-4 flex gap-6">
            {record.owner_cedula && (
              <InfoRow label="Cédula Dueño" value={record.owner_cedula} />
            )}
            {record.owner_phone && (
              <InfoRow label="Teléfono Dueño" value={record.owner_phone} />
            )}
          </div>

          {record.supplies?.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                Insumos utilizados
              </p>
              <div className="space-y-2">
                {record.supplies.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-teal-50 rounded-lg
                               px-4 py-2.5 border border-teal-100"
                  >
                    <div className="flex items-center gap-2">
                      <PackageIcon className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-slate-700">
                        {s.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-teal-700">
                      {s.quantity_used} {s.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200
                       hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-100 pb-1.5">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 px-5 py-4 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="space-y-2 flex-1 pt-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="text-center py-16 px-4 space-y-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
      <div className="flex justify-center">
        <div className="p-4 bg-teal-100 rounded-full">
          <ClipboardIcon className="w-8 h-8 text-teal-600" />
        </div>
      </div>
      <div>
        <p className="text-slate-700 font-semibold text-lg">
          No hay registros clínicos
        </p>
        <p className="text-slate-500 text-sm mt-1">
          Crea el primer registro médico para comenzar a llevar el historial.
        </p>
      </div>
      <button
        onClick={onNew}
        className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700 text-white
                   text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm
                   hover:from-teal-700 hover:to-cyan-800 transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        Crear primer registro
      </button>
    </div>
  );
}

// ── UI Helpers  ─────────────────────────────────────────────

const inputClass = `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800
                    focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white transition-colors`;
const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Componente Dinámico para Ícono de Especies
function SpeciesIcon({ species, lightMode = false }) {
  const s = (species || "").toLowerCase();

  // Colores dinámicos según la especie para mantener la variedad visual de forma elegante
  let colorClass = lightMode
    ? "bg-white/20 text-white border-white/30"
    : "bg-slate-50 text-slate-500 border-teal-900";

  if (!lightMode) {
    if (s === "perro") colorClass = "bg-blue-50 text-blue-500 border-blue-200";
    else if (s === "gato")
      colorClass = "bg-indigo-50 text-indigo-500 border-indigo-200";
    else if (s === "ave") colorClass = "bg-sky-50 text-sky-500 border-sky-200";
    else if (s === "conejo")
      colorClass = "bg-pink-50 text-pink-500 border-pink-200";
    else if (s === "reptil")
      colorClass = "bg-emerald-50 text-emerald-500 border-emerald-200";
  }

  return (
    <div
      className={`p-2.5 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorClass}`}
    >
      <PawIcon className="w-5 h-5 currentColor" />
    </div>
  );
}

// ── SVG Icons ─────────────────────────────────────────────

function PawIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 256 256">
      <path d="M88,104a24,24,0,1,0-24-24A24,24,0,0,0,88,104Zm80-48a24,24,0,1,0,24,24A24,24,0,0,0,168,56Zm48,56a24,24,0,1,0,24,24A24,24,0,0,0,216,112ZM40,112a24,24,0,1,0,24,24A24,24,0,0,0,40,112Zm116.32,16H99.68A47.74,47.74,0,0,0,52,175.68a40.06,40.06,0,0,0,15,36A55.77,55.77,0,0,0,99.68,224h56.64A55.77,55.77,0,0,0,189,211.69a40.06,40.06,0,0,0,15-36A47.74,47.74,0,0,0,156.32,128Z" />
    </svg>
  );
}

function PackageIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );
}

function ClipboardIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      <path d="M9 14h6"></path>
      <path d="M9 18h6"></path>
      <path d="M9 10h.01"></path>
    </svg>
  );
}

function AlertTriangleIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function SaveIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function SpinnerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
  );
}
