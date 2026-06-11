// Calendario semanal para el asistente de Hilmi.
// Selector de veterinario con pills + scroll horizontal (escala a N vets).
// Vista semanal unica. CRUD completo de citas. Modales limpios.
"use client";
import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Stethoscope,
  PawPrint,
  User,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ── Utilidades de fecha (sin UTC) ─────────────────────────────────────────────
const getLocalTodayString = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const getLocalFixedDate = (dateString) => {
  if (!dateString) return new Date();
  const [y, m, d] = dateString.split("T")[0].split("-");
  return new Date(y, m - 1, d);
};

const toDateString = (d) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");

const getWeekDays = (base) => {
  const date = getLocalFixedDate(base);
  const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateString(d);
  });
};

const HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const fmtTime = (t) => t?.slice(0, 5) ?? "";
const fmtShort = (d) =>
  getLocalFixedDate(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
const fmtLong = (d) =>
  getLocalFixedDate(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// ── Componente principal ──────────────────────────────────────────────────────
export default function AppointmentCalendar() {
  const today = getLocalTodayString();

  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedVet, setSelectedVet] = useState(null); // objeto vet | null = todos

  const [modal, setModal] = useState(null);
  const [activeAppt, setActiveAppt] = useState(null);
  const [activeVet, setActiveVet] = useState(null);
  const [activeSlot, setActiveSlot] = useState({
    time: "",
    vetName: "",
    date: "",
  });
  const [apptForm, setApptForm] = useState({ pet_name: "", owner_name: "" });
  const [newVetName, setNewVetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weekDays = getWeekDays(selectedDate);

  useEffect(() => {
    loadVets();
  }, []);
  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  // Si el vet seleccionado fue eliminado, resetear
  useEffect(() => {
    if (selectedVet && !vets.find((v) => v.id === selectedVet.id)) {
      setSelectedVet(null);
    }
  }, [vets]);

  const loadVets = async () => {
    try {
      const res = await fetch("/api/vets", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setVets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAppointments = async () => {
    try {
      const res = await fetch("/api/appointments", { cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setAppointments(
        data.filter((a) =>
          weekDays.some((d) => a.appointment_date?.startsWith(d)),
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const getAppt = (time, vetName, date) =>
    appointments.find(
      (a) =>
        a.appointment_time?.startsWith(time) &&
        a.vet_name === vetName &&
        a.appointment_date?.startsWith(date),
    );

  // Vets a mostrar segun filtro
  const visibleVets = selectedVet ? [selectedVet] : vets;

  const shiftWeek = (dir) => {
    const d = getLocalFixedDate(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(toDateString(d));
  };

  const weekLabel = `${fmtShort(weekDays[0])} — ${fmtLong(weekDays[6])}`;

  // ── Acciones de modal ────────────────────────────────────────────────────
  const openSlotModal = (time, vetName, date) => {
    setError("");
    const appt = getAppt(time, vetName, date);
    if (appt) {
      setActiveAppt(appt);
      setApptForm({
        pet_name: appt.pet_name,
        owner_name: appt.owner_name || "",
      });
      setModal("detail");
    } else {
      setActiveSlot({ time, vetName, date });
      setApptForm({ pet_name: "", owner_name: "" });
      setModal("newAppt");
    }
  };

  const closeModal = () => {
    setModal(null);
    setError("");
  };

  // ── CRUD Citas ────────────────────────────────────────────────────────────
  const createAppt = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: 1,
          pet_name: apptForm.pet_name,
          owner_name: apptForm.owner_name,
          vet_name: activeSlot.vetName,
          appointment_date: activeSlot.date,
          appointment_time: activeSlot.time,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadAppointments();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const updateAppt = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${activeAppt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_name: apptForm.pet_name,
          owner_name: apptForm.owner_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      closeModal();
      loadAppointments();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const deleteAppt = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${activeAppt.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.message);
        return;
      }
      closeModal();
      loadAppointments();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Vets ─────────────────────────────────────────────────────────────
  const createVet = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newVetName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setNewVetName("");
      closeModal();
      loadVets();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const deleteVet = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/vets/${activeVet.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setVets((prev) => prev.filter((v) => v.id !== activeVet.id));
      closeModal();
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 text-slate-800 antialiased font-sans">
      {/* ── Barra superior (Rediseñada con Inspiración del Dashboard UX) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        {/* Navegacion semana */}
        <div className="flex items-center justify-between w-full sm:w-auto bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 border border-slate-200 shadow-sm">
          <NavBtn onClick={() => shiftWeek(-1)}>
            <ChevronLeft size={18} />
          </NavBtn>
          <span className="text-sm font-bold text-slate-800 min-w-[160px] sm:min-w-[190px] text-center capitalize select-none tracking-tight">
            {weekLabel}
          </span>
          <NavBtn onClick={() => shiftWeek(1)}>
            <ChevronRight size={18} />
          </NavBtn>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setSelectedDate(today)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 hover:text-teal-700 text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-center"
          >
            Hoy
          </button>
          <button
            onClick={() => {
              setNewVetName("");
              setError("");
              setModal("newVet");
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-5 py-2.5 text-sm font-bold transition-all shadow-md shadow-teal-600/20 hover:scale-[1.02] hover:-translate-y-0.5"
          >
            <Plus size={16} /> Veterinario
          </button>
        </div>
      </div>

      {/* ── Pills selector de veterinario ── */}
      {vets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Pill "Todos" */}
          <VetPill
            label="Todos"
            count={null}
            active={selectedVet === null}
            onClick={() => setSelectedVet(null)}
            onDelete={null}
          />
          {vets.map((vet) => {
            const apptCount = appointments.filter(
              (a) => a.vet_name === vet.name,
            ).length;
            return (
              <VetPill
                key={vet.id}
                label={vet.name}
                count={apptCount}
                active={selectedVet?.id === vet.id}
                onClick={() =>
                  setSelectedVet(selectedVet?.id === vet.id ? null : vet)
                }
                onDelete={() => {
                  setActiveVet(vet);
                  setError("");
                  setModal("confirmDeleteVet");
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Tabla semanal ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {vets.length === 0 ? (
          <EmptyVets
            onAdd={() => {
              setNewVetName("");
              setError("");
              setModal("newVet");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* Fila de dias */}
                <tr className="bg-teal-500">
                  {/* Columna hora + vet (sticky izq) */}
                  <th className="py-3 px-3 w-[90px] min-w-[90px]">
                    <span className="text-[10px] font-semibold text-teal-200 uppercase tracking-wider">
                      Hora
                    </span>
                  </th>
                  {weekDays.map((d, i) => {
                    const isToday = d === today;
                    return (
                      <th key={d} className="py-2 px-1 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium text-teal-200 uppercase">
                            {DAY_LABELS[i]}
                          </span>
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                              ${isToday ? "bg-white text-teal-700" : "text-white"}`}
                          >
                            {getLocalFixedDate(d).getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* Fila de nombres de vet (solo si hay mas de 1 visible) */}
                {visibleVets.length > 1 && (
                  <tr className="bg-teal-50 border-b border-teal-100">
                    <td className="py-2 px-3 text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
                      Vet
                    </td>
                    {weekDays.map((d) => (
                      <td key={d} className="py-2 px-1">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {visibleVets.map((v) => (
                            <span
                              key={v.id}
                              className="text-[9px] font-semibold text-teal-700 bg-teal-100 rounded-full px-1.5 py-0.5 truncate max-w-[60px]"
                              title={v.name}
                            >
                              {v.name.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-gray-50">
                {HOURS.map((hour, hi) => (
                  <tr
                    key={hour}
                    className={`transition-colors hover:bg-gray-50/60 ${hi % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                    {/* Hora */}
                    <td className="py-2 px-3 text-xs font-mono font-semibold text-gray-400 align-top pt-3 w-[90px] min-w-[90px]">
                      {hour}
                    </td>

                    {/* Celdas por dia */}
                    {weekDays.map((d) => {
                      const cellAppts = visibleVets
                        .map((v) => ({
                          appt: getAppt(hour, v.name, d),
                          vet: v,
                        }))
                        .filter((x) => x.appt);

                      return (
                        <td
                          key={d}
                          className="py-1 px-1 align-top min-w-[90px]"
                        >
                          <div className="flex flex-col gap-1">
                            {/* Citas existentes */}
                            {cellAppts.map(({ appt, vet }) => (
                              <button
                                key={appt.id}
                                onClick={() => openSlotModal(hour, vet.name, d)}
                                className="w-full text-left rounded-lg px-2 py-1.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 hover:border-teal-400 transition group"
                              >
                                <p className="text-[11px] font-semibold text-teal-800 flex items-center gap-1 truncate">
                                  <PawPrint
                                    size={10}
                                    className="text-teal-500 shrink-0"
                                  />
                                  {appt.pet_name}
                                </p>
                                <p className="text-[10px] text-teal-500 truncate ml-[14px]">
                                  {appt.owner_name || appt.vet_name}
                                </p>
                              </button>
                            ))}

                            {/* Slot vacio: mostrar boton solo si hay un vet seleccionado */}
                            {cellAppts.length === 0 && selectedVet && (
                              <button
                                onClick={() =>
                                  openSlotModal(hour, selectedVet.name, d)
                                }
                                className="w-full rounded-lg py-2 text-center text-[11px] text-gray-300 border border-dashed border-gray-200 hover:border-teal-300 hover:text-teal-400 hover:bg-teal-50/40 transition"
                              >
                                <Plus size={12} className="inline -mt-0.5" />
                              </button>
                            )}

                            {/* Vista todos: mostrar + solo si hay algun slot libre visible */}
                            {cellAppts.length === 0 && !selectedVet && (
                              <div className="w-full rounded-lg py-2 text-center text-gray-200 text-[11px] border border-dashed border-gray-100">
                                —
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALES ══════════════════════════════════════════════════════════════ */}
      {modal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col border border-slate-100"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
          >
            <div className="overflow-y-auto flex-1 p-8">
              {/* Nueva cita ─────────────────────────────────── */}
              {modal === "newAppt" && (
                <>
                  <ModalHeader title="Nueva cita" onClose={closeModal} />
                  <p className="text-xs text-gray-400 mb-5 flex items-center gap-1.5 font-medium">
                    <Clock size={12} className="text-teal-500" />{" "}
                    {activeSlot.time}
                    <span className="text-gray-200">·</span>
                    <Stethoscope size={12} className="text-teal-500" />{" "}
                    {activeSlot.vetName}
                    <span className="text-gray-200">·</span>
                    <Calendar size={12} className="text-teal-500" />{" "}
                    {fmtShort(activeSlot.date)}
                  </p>
                  <Field
                    label="Dueño"
                    value={apptForm.owner_name}
                    onChange={(v) =>
                      setApptForm((f) => ({ ...f, owner_name: v }))
                    }
                    placeholder="Ej: Juan Perez"
                  />
                  <Field
                    label="Mascota"
                    value={apptForm.pet_name}
                    onChange={(v) =>
                      setApptForm((f) => ({ ...f, pet_name: v }))
                    }
                    placeholder="Ej: Firulais"
                    onEnter={createAppt}
                  />
                  <ErrorMsg msg={error} />
                  <div className="flex gap-3 mt-5">
                    <Btn
                      onClick={createAppt}
                      loading={loading}
                      disabled={!apptForm.pet_name || !apptForm.owner_name}
                    >
                      Confirmar cita
                    </Btn>
                    <Ghost onClick={closeModal}>Cancelar</Ghost>
                  </div>
                </>
              )}

              {/* Detalle ─────────────────────────────────────── */}
              {modal === "detail" && activeAppt && (
                <>
                  <ModalHeader title="Detalle de cita" onClose={closeModal} />
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 mb-5 border border-slate-100">
                    <InfoRow
                      icon={<Clock size={14} />}
                      label="Hora"
                      value={fmtTime(activeAppt.appointment_time)}
                    />
                    <InfoRow
                      icon={<Calendar size={14} />}
                      label="Fecha"
                      value={fmtShort(activeAppt.appointment_date)}
                    />
                    <InfoRow
                      icon={<Stethoscope size={14} />}
                      label="Veterinario"
                      value={activeAppt.vet_name}
                    />
                    <InfoRow
                      icon={<PawPrint size={14} />}
                      label="Mascota"
                      value={activeAppt.pet_name}
                    />
                    <InfoRow
                      icon={<User size={14} />}
                      label="Dueño"
                      value={activeAppt.owner_name || "—"}
                    />
                  </div>
                  <ErrorMsg msg={error} />
                  <div className="flex flex-col gap-2">
                    <Btn
                      onClick={() => {
                        setError("");
                        setModal("editAppt");
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Pencil size={14} /> Editar cita
                      </span>
                    </Btn>
                    <div className="flex gap-3">
                      <Danger
                        onClick={() => {
                          setError("");
                          setModal("confirmDeleteAppt");
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Trash2 size={14} /> Eliminar
                        </span>
                      </Danger>
                      <Ghost onClick={closeModal}>Cerrar</Ghost>
                    </div>
                  </div>
                </>
              )}

              {/* Editar ──────────────────────────────────────── */}
              {modal === "editAppt" && activeAppt && (
                <>
                  <ModalHeader title="Editar cita" onClose={closeModal} />
                  <p className="text-xs text-gray-400 mb-5 font-medium">
                    {fmtTime(activeAppt.appointment_time)} ·{" "}
                    {activeAppt.vet_name}
                  </p>
                  <Field
                    label="Dueño"
                    value={apptForm.owner_name}
                    onChange={(v) =>
                      setApptForm((f) => ({ ...f, owner_name: v }))
                    }
                    placeholder="Ej: Juan Perez"
                  />
                  <Field
                    label="Mascota"
                    value={apptForm.pet_name}
                    onChange={(v) =>
                      setApptForm((f) => ({ ...f, pet_name: v }))
                    }
                    placeholder="Ej: Firulais"
                    onEnter={updateAppt}
                  />
                  <ErrorMsg msg={error} />
                  <div className="flex gap-3 mt-5">
                    <Btn
                      onClick={updateAppt}
                      loading={loading}
                      disabled={!apptForm.pet_name || !apptForm.owner_name}
                    >
                      Guardar cambios
                    </Btn>
                    <Ghost onClick={() => setModal("detail")}>Volver</Ghost>
                  </div>
                </>
              )}

              {/* Confirmar eliminar cita ─────────────────────── */}
              {modal === "confirmDeleteAppt" && activeAppt && (
                <>
                  <ModalHeader title="Eliminar cita" onClose={closeModal} />
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-5 text-sm text-rose-700 font-medium leading-relaxed">
                    Se eliminará la cita de{" "}
                    <strong>{activeAppt.pet_name}</strong> (
                    {activeAppt.owner_name}) a las{" "}
                    {fmtTime(activeAppt.appointment_time)}. Esta acción no se
                    puede deshacer.
                  </div>
                  <ErrorMsg msg={error} />
                  <div className="flex gap-3">
                    <Danger onClick={deleteAppt} loading={loading}>
                      Confirmar eliminación
                    </Danger>
                    <Ghost onClick={() => setModal("detail")}>Cancelar</Ghost>
                  </div>
                </>
              )}

              {/* Nuevo veterinario ───────────────────────────── */}
              {modal === "newVet" && (
                <>
                  <ModalHeader title="Nuevo veterinario" onClose={closeModal} />
                  <Field
                    label="Nombre completo"
                    value={newVetName}
                    onChange={setNewVetName}
                    placeholder="Ej: Dr. Rodriguez"
                    onEnter={createVet}
                  />
                  <ErrorMsg msg={error} />
                  <div className="flex gap-3 mt-5">
                    <Btn
                      onClick={createVet}
                      loading={loading}
                      disabled={!newVetName.trim()}
                    >
                      Agregar
                    </Btn>
                    <Ghost onClick={closeModal}>Cancelar</Ghost>
                  </div>
                </>
              )}

              {/* Confirmar eliminar vet ──────────────────────── */}
              {modal === "confirmDeleteVet" && activeVet && (
                <>
                  <ModalHeader
                    title="Eliminar veterinario"
                    onClose={closeModal}
                  />
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-5 text-sm text-rose-700 font-medium leading-relaxed">
                    Se eliminará a <strong>{activeVet.name}</strong>. Primero
                    elimina sus citas activas si las tiene.
                  </div>
                  <ErrorMsg msg={error} />
                  <div className="flex gap-3">
                    <Danger onClick={deleteVet} loading={loading}>
                      Confirmar
                    </Danger>
                    <Ghost onClick={closeModal}>Cancelar</Ghost>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyVets({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
        <Stethoscope size={26} className="text-teal-400" />
      </div>
      <p className="text-sm font-bold text-slate-800">
        Sin veterinarios registrados
      </p>
      <p className="text-xs text-slate-400 max-w-[200px] font-medium leading-relaxed">
        Agrega al menos un veterinario para comenzar a gestionar citas.
      </p>
      <button
        onClick={onAdd}
        className="mt-1 flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2 text-sm font-bold transition shadow-sm"
      >
        <Plus size={14} /> Agregar veterinario
      </button>
    </div>
  );
}

// ── VetPill ───────────────────────────────────────────────────────────────────
function VetPill({ label, count, active, onClick, onDelete }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer select-none transition-all shrink-0 border
        ${
          active
            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
            : "bg-white text-slate-500 border-slate-200 hover:border-teal-300 hover:text-teal-700"
        }`}
      onClick={onClick}
    >
      {onDelete && (
        <span
          className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black
            ${active ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"}`}
        >
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="truncate max-w-[100px]">{label}</span>
      {count !== null && count > 0 && (
        <span
          className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none
            ${active ? "bg-white/25 text-white" : "bg-teal-100 text-teal-600"}`}
        >
          {count}
        </span>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition ml-0.5
            ${active ? "hover:bg-white/20 text-white/70 hover:text-white" : "text-slate-300 hover:text-rose-500 hover:bg-rose-50"}`}
          title={`Eliminar ${label}`}
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
}

// ── NavBtn (Modificado para ser responsive con Estilo Íconos Dashboard) ──
function NavBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center"
    >
      {children}
    </button>
  );
}

// ── ModalHeader ───────────────────────────────────────────────────────────────
function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">
        {title}
      </h2>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 flex items-center justify-center transition-all"
      >
        <X size={15} />
      </button>
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-teal-500 shrink-0">{icon}</span>
      <span className="text-xs text-slate-400 w-20 shrink-0 font-bold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-700 truncate">
        {value}
      </span>
    </div>
  );
}

// ── ErrorMsg ──────────────────────────────────────────────────────────────────
function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2 mt-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
      <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
      <p className="text-xs text-rose-600 font-medium">{msg}</p>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, onEnter }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
      />
    </div>
  );
}

// ── Botones de Modales (Sincronizados con ABtn / AGhost / Danger del Dashboard) ──
function Btn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 hover:scale-[1.02] text-center"
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}

function Danger({ children, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 text-center"
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}

function Ghost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl py-3 text-sm font-bold transition-all shadow-sm text-center"
    >
      {children}
    </button>
  );
}
