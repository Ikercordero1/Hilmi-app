//En este componente se logra apreciar los registros clínicos  existentes ofreciendo mayores
//  datos sobre las mascotas atendidas e infiriendo directamente en el stock
"use client";

import { useState, useEffect } from "react";
import SuppliesEditor from "./SuppliesEditor";
import PetSelector from "./PetSelector";

const EMPTY_FORM = {
  id: null,
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

  // Estados para modales
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

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

  // ── FUNCIÓN PARA ABRIR MODO EDICIÓN ──
  const openEdit = (record) => {
    setViewModal(null);
    setForm({
      id: record.id,
      pet: {
        id: record.pet_id,
        pet_name: record.pet_name,
        owner_name: record.owner_name,
        owner_cedula: record.owner_cedula,
        species: record.species,
      },
      vet_name: record.vet_name || "",
      visit_date: new Date(record.visit_date).toISOString().split("T")[0],
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      notes: record.notes || "",
      supplies: record.supplies || [],
    });
    setModalOpen(true);
  };

  // ── GUARDAR (CREAR Y EDITAR) ──
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
      const isEditing = !!form.id;
      const url = isEditing
        ? `/api/medical-records/${form.id}`
        : "/api/medical-records";
      const method = isEditing ? "PUT" : "POST";

      const payload = isEditing
        ? {
            vet_name: form.vet_name || null,
            visit_date: form.visit_date,
            diagnosis: form.diagnosis,
            treatment: form.treatment || null,
            notes: form.notes || null,
          }
        : {
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Error al guardar");
        return;
      }

      if (!isEditing && json.stockWarnings?.length > 0) {
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

  // ── FUNCIÓN PARA ELIMINAR ──
  const executeDelete = async () => {
    if (!deleteModal) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/medical-records/${deleteModal.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Error al eliminar");
        setSaving(false);
        return;
      }

      setDeleteModal(null);
      setViewModal(null);
      await fetchRecords();
    } catch (err) {
      setError("Error de conexión al eliminar.");
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
    if (!search && filterSpecies === "all") return true;

    const term = search.toLowerCase();
    const cleanTerm = term.replace(/[^a-z0-9]/g, "");

    const safeString = (val) => (val ? String(val).toLowerCase() : "");
    const cleanString = (val) => safeString(val).replace(/[^a-z0-9]/g, "");

    const matchesSearch =
      !search ||
      safeString(r.pet_name).includes(term) ||
      safeString(r.owner_name).includes(term) ||
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-gray-900 placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
          <select
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                     text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm
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

      <p className="text-xs font-bold text-gray-500">
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

      {/* ── MODAL: Formulario (Crear / Editar)  ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-700 to-cyan-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ClipboardIcon className="w-5 h-5 text-teal-200" />
                {form.id ? "Editar Registro Médico" : "Nuevo Registro Clínico"}
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
                    <AlertTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-800">{error}</p>
                  </div>
                )}

                {stockWarnings.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
                    <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangleIcon className="w-4 h-4" />
                      Registro guardado con advertencias de stock:
                    </p>
                    <ul className="list-disc list-inside text-xs font-bold text-amber-800 space-y-1">
                      {stockWarnings.map((w, i) => (
                        <li key={i}>{w.message}</li>
                      ))}
                    </ul>
                    <button
                      onClick={closeModal}
                      className="mt-2 text-xs font-black text-amber-900 underline hover:text-amber-950"
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
                        disabled={!!form.id}
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

                  {/* Insumos */}
                  <div className="md:col-span-2">
                    {form.id ? (
                      <Section
                        title="Insumos utilizados"
                        subtitle="Por seguridad del inventario, los insumos no se pueden modificar tras guardar el registro."
                      >
                        {form.supplies?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {form.supplies.map((s, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                              >
                                <span className="text-sm font-bold text-teal-900 flex items-center gap-2">
                                  <PackageIcon className="w-4 h-4 text-teal-700" />
                                  {s.name || s.supply_name}
                                </span>
                                <span className="text-sm font-bold text-teal-900">
                                  {s.quantity_used} {s.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-teal-900 italic">
                            No se usaron insumos en este registro.
                          </p>
                        )}
                      </Section>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-sm font-black text-gray-900 bg-white border border-slate-300
                           hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700
                           text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm
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
                    {form.id ? "Actualizar registro" : "Guardar registro"}
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
          onEdit={() => openEdit(viewModal)}
          onDelete={() => setDeleteModal(viewModal)}
        />
      )}

      {/* ── MODAL: Confirmar Eliminación ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                >
                  <AlertTriangleIcon className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-black" style={{ color: "#dc2626" }}>
                ¿Eliminar registro médico?
              </h3>
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                Estás a punto de borrar permanentemente el historial médico de{" "}
                <span
                  className="font-black text-base uppercase"
                  style={{ color: "#dc2626" }}
                >
                  {deleteModal.pet_name}
                </span>{" "}
                del {formatDate(deleteModal.visit_date)}.
                <br />
                <br />
                <span className="text-xs italic text-gray-500 font-normal">
                  Nota: Los insumos descontados no regresarán automáticamente al
                  inventario.
                </span>
              </p>
            </div>
            {error && (
              <p
                className="text-xs font-bold text-white text-center rounded-lg px-3 py-2"
                style={{ backgroundColor: "#dc2626" }}
              >
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-black text-gray-900 bg-white border border-slate-300 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={saving}
                style={{ backgroundColor: "#dc2626", color: "white" }}
                className="flex-1 flex items-center justify-center gap-2 hover:opacity-80 text-sm font-black px-4 py-2.5 rounded-lg shadow-lg shadow-red-500/40 transition-all disabled:opacity-50"
              >
                {saving ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
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
              <span className="text-sm font-bold text-gray-900 truncate">
                {record.pet_name}
              </span>
              {record.species && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-gray-700 font-bold flex-shrink-0">
                  {capitalize(record.species)}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-600 mb-1.5">
              {record.owner_name}
              {record.vet_name && ` • Dr/a. ${record.vet_name}`}
            </p>
            <p className="text-sm font-bold text-teal-900 line-clamp-2">
              {record.diagnosis}
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 space-y-2">
          <p className="text-xs font-black text-gray-800">
            {formatDate(record.visit_date)}
          </p>
          {record.supplies?.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
                         bg-cyan-50 text-cyan-800 border border-cyan-200"
            >
              <PackageIcon className="w-3.5 h-3.5" />
              {record.supplies.length} insumo
              {record.supplies.length !== 1 ? "s" : ""}
            </span>
          )}
          <div className="text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold pt-1">
            Ver detalle →
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewRecordModal({ record, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 z-[40] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-700 to-cyan-800">
          <div className="flex items-center gap-4">
            <SpeciesIcon species={record.species} lightMode />
            <div>
              <h2 className="text-lg font-bold text-white">
                {record.pet_name}
              </h2>
              <p className="text-xs font-medium text-teal-100">
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

          <div className="border-t border-slate-200 pt-4 space-y-4">
            <InfoRow label="Diagnóstico" value={record.diagnosis} />
            {record.treatment && (
              <InfoRow label="Tratamiento" value={record.treatment} />
            )}
            {record.notes && <InfoRow label="Notas" value={record.notes} />}
          </div>

          <div className="border-t border-slate-200 pt-4 flex gap-6">
            {record.owner_cedula && (
              <InfoRow label="Cédula Dueño" value={record.owner_cedula} />
            )}
            {record.owner_phone && (
              <InfoRow label="Teléfono Dueño" value={record.owner_phone} />
            )}
          </div>

          {record.supplies?.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-3">
                Insumos utilizados
              </p>
              <div className="space-y-2">
                {record.supplies.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-teal-50 rounded-lg
                               px-4 py-2.5 border border-teal-200"
                  >
                    <div className="flex items-center gap-2">
                      <PackageIcon className="w-4 h-4 text-teal-700" />
                      <span className="text-sm font-bold text-teal-900">
                        {s.name || s.supply_name}
                      </span>
                    </div>
                    <span className="text-sm font-black text-teal-800">
                      {s.quantity_used} {s.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── BOTONERA DE ACCIONES EN DETALLES ── */}
        <div className="px-6 py-4 border-t border-slate-200 bg-gray-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black text-teal-800 bg-teal-100 hover:bg-teal-200 transition-colors shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
              Editar
            </button>
            <button
              onClick={onDelete}
              style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black hover:opacity-80 transition-all shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              Eliminar
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-black text-gray-900 bg-white border border-slate-300
                       hover:bg-slate-100 transition-colors shadow-sm"
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
      <div className="border-b border-slate-200 pb-1.5">
        <p className="text-sm font-black text-gray-900">{title}</p>
        {subtitle && (
          <p className="text-xs font-bold text-gray-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm font-bold text-teal-900 leading-relaxed whitespace-pre-wrap">
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
    <div className="text-center py-16 px-4 space-y-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
      <div className="flex justify-center">
        <div className="p-4 bg-teal-100 rounded-full">
          <ClipboardIcon className="w-8 h-8 text-teal-700" />
        </div>
      </div>
      <div>
        <p className="text-gray-900 font-black text-lg">
          No hay registros clínicos
        </p>
        <p className="text-gray-600 font-bold text-sm mt-1">
          Crea el primer registro médico para comenzar a llevar el historial.
        </p>
      </div>
      <button
        onClick={onNew}
        className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-700 text-white
                   text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm
                   hover:from-teal-700 hover:to-cyan-800 transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        Crear primer registro
      </button>
    </div>
  );
}

// ── UI Helpers  ─────────────────────────────────────────────

// Actualizado a text-teal-900 y font-bold para alto contraste en los formularios
const inputClass = `w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-teal-900 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white transition-colors`;
const labelClass = "block text-xs font-black text-gray-900 mb-1.5";

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

  let colorClass = lightMode
    ? "bg-white/20 text-white border-white/30"
    : "bg-teal-50 text-teal-900 border-teal-200";

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
