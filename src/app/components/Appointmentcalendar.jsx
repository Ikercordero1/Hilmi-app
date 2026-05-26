//Calendario de citas para veterinaria, con vistas diaria y semanal, gestión de veterinarios y CRUD completo de citas. 
// Manejo correcto de fechas en zona local sin problemas de UTC. Interfaz limpia y funcional 
// con modales para detalles y edición.
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
} from "lucide-react";

//  Manejo de fechas (Sin problemas de zona horaria)
const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalFixedDate = (dateString) => {
  if (!dateString) return new Date();
  const cleanDate = dateString.split("T")[0]; // Cortamos cualquier hora si la hay
  const [year, month, day] = cleanDate.split("-");
  return new Date(year, month - 1, day); // Mes en JS va de 0 a 11
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
const fmtTime = (t) => t?.slice(0, 5) ?? "";

const fmtDate = (d) =>
  getLocalFixedDate(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

const getWeekDays = (base) => {
  const date = getLocalFixedDate(base);
  const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    // Devolución del formato YYYY-MM-DD en base local, no con toISOString (UTC)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
};

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function AppointmentCalendar() {
  const today = getLocalTodayString(); // El "hoy" siempre será correcto localmente

  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState("day");
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
  }, [selectedDate, view]);

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
      const dates = view === "week" ? weekDays : [selectedDate];
      setAppointments(
        data.filter((a) =>
          dates.some((d) => a.appointment_date?.startsWith(d)),
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
        a.appointment_date?.startsWith(date ?? selectedDate),
    );

  const openSlot = (time, vetName, date) => {
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
      setActiveSlot({ time, vetName, date: date ?? selectedDate });
      setApptForm({ pet_name: "", owner_name: "" });
      setModal("newAppt");
    }
  };

  const closeModal = () => {
    setModal(null);
    setError("");
  };

  // ── CRUD Citas ────────────────────────────────────────────────
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
      setError("Error de conexión");
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
      setError("Error de conexión");
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
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD Vets ─────────────────────────────────────────────────
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
      setError("Error de conexión");
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
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const shiftDate = (days) => {
    const d = getLocalFixedDate(selectedDate);
    d.setDate(d.getDate() + days);

    // Convertimos manualmente en lugar de toISOString
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    setSelectedDate(`${year}-${month}-${day}`);
  };

  const todayLabel = getLocalFixedDate(selectedDate).toLocaleDateString(
    "es-ES",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );
  const weekLabel = `${fmtDate(weekDays[0])} — ${getLocalFixedDate(weekDays[6]).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="w-full">
      {/* ── Header del calendario ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Tabs día/semana */}
        <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
          {["day", "week"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === v
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {v === "day" ? "Día" : "Semana"}
            </button>
          ))}
        </div>

        {/* Navegación fechas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(view === "day" ? -1 : -7)}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition flex items-center justify-center shadow-sm"
          >
            ‹
          </button>
          <span className="text-sm text-gray-600 min-w-[200px] text-center capitalize font-medium">
            {view === "day" ? todayLabel : weekLabel}
          </span>
          <button
            onClick={() => shiftDate(view === "day" ? 1 : 7)}
            className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition flex items-center justify-center shadow-sm"
          >
            ›
          </button>
          <button
            onClick={() => setSelectedDate(today)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 hover:border-teal-400 hover:text-teal-600 transition shadow-sm"
          >
            Hoy
          </button>
        </div>

        {/* Botón nuevo veterinario */}
        <button
          onClick={() => {
            setNewVetName("");
            setError("");
            setModal("newVet");
          }}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm"
        >
          + Veterinario
        </button>
      </div>

      {/* ── Vista Diaria ── */}
      {view === "day" && (
        <div className="bg-white rounded-2xl border border-cyan-800 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-teal-500">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase w-20">
                    Hora
                  </th>
                  {vets.length === 0 ? (
                    <th className="py-3 px-4 text-gray-300 font-normal italic text-center text-xs">
                      Añade un veterinario para comenzar →
                    </th>
                  ) : (
                    vets.map((vet) => (
                      <th key={vet.id} className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {vet.name}
                          </span>
                          <button
                            onClick={() => {
                              setActiveVet(vet);
                              setError("");
                              setModal("confirmDeleteVet");
                            }}
                            className="w-4 h-4 rounded-full bg-white hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center align-center text-xs transition"
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {HOURS.map((hour) => (
                  <tr
                    key={hour}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs font-mono font-semibold bg-gray-100 text-gray-500">
                      {hour}
                    </td>
                    {vets.length === 0 ? (
                      <td className="py-3 px-4 text-center text-gray-200 text-xs">
                        —
                      </td>
                    ) : (
                      vets.map((vet) => {
                        const appt = getAppt(hour, vet.name, selectedDate);
                        return (
                          <td key={vet.id} className="py-2 px-3">
                            {appt ? (
                              <button
                                onClick={() =>
                                  openSlot(hour, vet.name, selectedDate)
                                }
                                className="w-full rounded-xl py-2 px-3 text-left bg-teal-50 border border-teal-200 hover:bg-teal-100 transition"
                              >
                                <div className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                                  <PawPrint
                                    size={14}
                                    className="text-teal-600"
                                  />{" "}
                                  {appt.pet_name}
                                </div>
                                <p className="text-xs text-teal-600 mt-0.5 ml-5">
                                  {appt.owner_name}
                                </p>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openSlot(hour, vet.name, selectedDate)
                                }
                                className="w-full rounded-xl py-2 px-3 text-center text-xs text-gray-300 border border-dashed border-gray-200 hover:border-teal-300 hover:text-teal-500 hover:bg-teal-50/50 transition"
                              >
                                + Agendar
                              </button>
                            )}
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Vista Semanal ── */}
      {view === "week" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-400 uppercase w-20">
                    Hora
                  </th>
                  {weekDays.map((d, i) => {
                    const isToday = d === today;
                    return (
                      <th key={d} className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-400">
                            {DAY_LABELS[i]}
                          </span>
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                              isToday
                                ? "bg-teal-600 text-white"
                                : "text-gray-600"
                            }`}
                          >
                            {/* Ajuste local para renderizar el número correcto del día en la semana */}
                            {getLocalFixedDate(d).getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {HOURS.map((hour) => (
                  <tr
                    key={hour}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs font-mono font-semibold text-gray-400">
                      {hour}
                    </td>
                    {weekDays.map((d) => {
                      const dayAppts = vets
                        .map((v) => getAppt(hour, v.name, d))
                        .filter(Boolean);
                      return (
                        <td
                          key={d}
                          className="py-1.5 px-1.5 align-top min-w-[100px]"
                        >
                          {dayAppts.length > 0 ? (
                            dayAppts.map((appt) => (
                              <button
                                key={appt.id}
                                onClick={() => {
                                  setActiveAppt(appt);
                                  setApptForm({
                                    pet_name: appt.pet_name,
                                    owner_name: appt.owner_name || "",
                                  });
                                  setError("");
                                  setModal("detail");
                                }}
                                className="w-full mb-1 rounded-lg py-1.5 px-2 text-left bg-teal-50 border border-teal-200 hover:bg-teal-100 transition"
                              >
                                <p className="text-xs font-semibold text-teal-800 truncate flex items-center gap-1">
                                  <PawPrint
                                    size={10}
                                    className="text-teal-600"
                                  />{" "}
                                  {appt.pet_name}
                                </p>
                                <p className="text-[10px] text-teal-500 truncate ml-3 mt-0.5">
                                  {appt.vet_name}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="w-full rounded-lg py-2 text-center text-gray-200 text-xs border border-dashed border-gray-100">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modales ── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {/* Nueva cita */}
            {modal === "newAppt" && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-1">
                  Nueva cita
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  {activeSlot.time} · {activeSlot.vetName} ·{" "}
                  {fmtDate(activeSlot.date)}
                </p>
                <Field
                  label="Dueño"
                  value={apptForm.owner_name}
                  onChange={(v) =>
                    setApptForm((f) => ({ ...f, owner_name: v }))
                  }
                  placeholder="Ej: Juan Pérez"
                />
                <Field
                  label="Mascota"
                  value={apptForm.pet_name}
                  onChange={(v) => setApptForm((f) => ({ ...f, pet_name: v }))}
                  placeholder="Ej: Firulais"
                  onEnter={createAppt}
                />
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2 mt-2">
                  <Btn
                    onClick={createAppt}
                    loading={loading}
                    disabled={!apptForm.pet_name || !apptForm.owner_name}
                  >
                    Confirmar
                  </Btn>
                  <Ghost onClick={closeModal}>Cancelar</Ghost>
                </div>
              </>
            )}

            {/* Detalle de la cita */}
            {modal === "detail" && activeAppt && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  Detalle de cita
                </h2>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-5">
                  <Row
                    icon={<Clock size={16} />}
                    label="Hora"
                    value={fmtTime(activeAppt.appointment_time)}
                  />
                  <Row
                    icon={<Calendar size={16} />}
                    label="Fecha"
                    value={fmtDate(activeAppt.appointment_date)}
                  />
                  <Row
                    icon={<Stethoscope size={16} />}
                    label="Veterinario"
                    value={activeAppt.vet_name}
                  />
                  <Row
                    icon={<PawPrint size={16} />}
                    label="Mascota"
                    value={activeAppt.pet_name}
                  />
                  <Row
                    icon={<User size={16} />}
                    label="Dueño"
                    value={activeAppt.owner_name || "—"}
                  />
                </div>
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex flex-col gap-2">
                  <Btn
                    onClick={() => {
                      setError("");
                      setModal("editAppt");
                    }}
                  >
                    <span className="flex justify-center items-center gap-2">
                      <Pencil size={16} /> Editar
                    </span>
                  </Btn>
                  <div className="flex gap-2">
                    <Danger
                      onClick={() => {
                        setError("");
                        setModal("confirmDeleteAppt");
                      }}
                    >
                      <span className="flex justify-center items-center gap-2">
                        <Trash2 size={16} /> Eliminar
                      </span>
                    </Danger>
                    <Ghost onClick={closeModal}>Cerrar</Ghost>
                  </div>
                </div>
              </>
            )}

            {/* Editar */}
            {modal === "editAppt" && activeAppt && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-1">
                  Editar cita
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  {fmtTime(activeAppt.appointment_time)} · {activeAppt.vet_name}
                </p>
                <Field
                  label="Dueño"
                  value={apptForm.owner_name}
                  onChange={(v) =>
                    setApptForm((f) => ({ ...f, owner_name: v }))
                  }
                  placeholder="Ej: Juan Pérez"
                />
                <Field
                  label="Mascota"
                  value={apptForm.pet_name}
                  onChange={(v) => setApptForm((f) => ({ ...f, pet_name: v }))}
                  placeholder="Ej: Firulais"
                  onEnter={updateAppt}
                />
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2 mt-2">
                  <Btn
                    onClick={updateAppt}
                    loading={loading}
                    disabled={!apptForm.pet_name || !apptForm.owner_name}
                  >
                    Guardar
                  </Btn>
                  <Ghost onClick={() => setModal("detail")}>Volver</Ghost>
                </div>
              </>
            )}

            {/* Confirmar eliminar cita */}
            {modal === "confirmDeleteAppt" && activeAppt && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                  ¿Eliminar cita?
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Cita de <strong>{activeAppt.pet_name}</strong> (
                  {activeAppt.owner_name}) a las{" "}
                  {fmtTime(activeAppt.appointment_time)}. No se puede deshacer.
                </p>
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2">
                  <Danger onClick={deleteAppt} loading={loading}>
                    Sí, eliminar
                  </Danger>
                  <Ghost onClick={() => setModal("detail")}>Cancelar</Ghost>
                </div>
              </>
            )}

            {/* Nuevo veterinario */}
            {modal === "newVet" && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  Nuevo veterinario
                </h2>
                <Field
                  label="Nombre"
                  value={newVetName}
                  onChange={setNewVetName}
                  placeholder="Ej: Dr. Rodríguez"
                  onEnter={createVet}
                />
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2 mt-2">
                  <Btn
                    onClick={createVet}
                    loading={loading}
                    disabled={!newVetName.trim()}
                  >
                    Añadir
                  </Btn>
                  <Ghost onClick={closeModal}>Cancelar</Ghost>
                </div>
              </>
            )}

            {/* Confirmar eliminar vet */}
            {modal === "confirmDeleteVet" && activeVet && (
              <>
                <h2 className="text-base font-bold text-gray-800 mb-2">
                  ¿Eliminar veterinario?
                </h2>
                <p className="text-sm text-gray-500 mb-5">
                  Se eliminará a <strong>{activeVet.name}</strong>. Primero
                  elimina sus citas activas si las tiene.
                </p>
                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                <div className="flex gap-2">
                  <Danger onClick={deleteVet} loading={loading}>
                    Sí, eliminar
                  </Danger>
                  <Ghost onClick={closeModal}>Cancelar</Ghost>
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
function Field({ label, value, onChange, placeholder, onEnter }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      />
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 flex justify-center text-teal-600">{icon}</span>
      <span className="text-xs text-gray-400 w-24">{label}</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
}

function Btn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
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
      className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}

function Ghost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
    >
      {children}
    </button>
  );
}
