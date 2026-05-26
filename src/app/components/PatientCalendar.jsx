//Calendario que aparecerá en la vista de pacientes/ dueños de mascotas.
"use client";
import { useState, useEffect } from "react";
import { useCountdown } from "../../lib/useCountdown";
import {
  ClipboardList,
  Lock,
  PartyPopper,
  PawPrint,
  Stethoscope,
  Clock,
  Calendar,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ReceiptText,
} from "lucide-react";

// ── UTILIDADES PARA MANEJO DE FECHAS (Sin problemas de zona horaria) ──
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

const STATUS_LABEL = {
  pendiente_pago: {
    text: "Pendiente de pago",
    className: "bg-orange-100 text-orange-700",
  },
  en_revision: { text: "En revisión", className: "bg-blue-100 text-blue-700" },
  aprobada: { text: "Aprobada", className: "bg-green-100 text-green-700" },
  rechazada: { text: "Rechazada", className: "bg-red-100 text-red-700" },
  expirada: { text: "Expirada", className: "bg-gray-100 text-gray-500" },
};

const fmtDate = (d) =>
  getLocalFixedDate(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtTime = (t) => t?.slice(0, 5) ?? "";

export default function PatientCalendar({ clientId, adminMode = false }) {
  const today = getLocalTodayString();

  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);

  // Modal: null | "step1" | "step2" | "step3_done" | "status"
  const [modal, setModal] = useState(null);
  const [activeSlot, setActiveSlot] = useState({ time: "", vetName: "" });
  const [requestId, setRequestId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Formulario de cita
  const [form, setForm] = useState({
    owner_name: "",
    cedula: "",
    phone: "",
    pet_name: "",
    pet_species: "",
    pet_breed: "",
    pet_age: "",
    reason: "",
  });

  // Formulario de pago
  const [paymentInfo, setPaymentInfo] = useState({
    bank: "",
    reference: "",
  });

  useEffect(() => {
    loadVets();
    loadPaymentAccounts();
    if (clientId) loadMyRequests();
    // Cron local: llamar expire cada 60s
    const cron = setInterval(
      () => fetch("/requests/expire", { method: "POST" }),
      60000,
    );
    return () => clearInterval(cron);
  }, [clientId]);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadVets = async () => {
    const res = await fetch("/api/vets", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data)) setVets(data);
  };

  const loadAppointments = async () => {
    const res = await fetch("/api/appointments", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data))
      setAppointments(
        data.filter((a) => a.appointment_date?.startsWith(selectedDate)),
      );
  };

  const loadMyRequests = async () => {
    const res = await fetch("/api/requests", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data))
      setMyRequests(data.filter((r) => r.client_id === clientId));
  };

  const loadPaymentAccounts = async () => {
    const res = await fetch("/api/paymentaccounts", { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data)) setPaymentAccounts(data);
  };

  const isConfirmed = (time, vetName) =>
    appointments.some(
      (a) => a.appointment_time?.startsWith(time) && a.vet_name === vetName,
    );

  const isBlocked = (time, vetName) =>
    myRequests.some(
      (r) =>
        r.requested_time?.startsWith(time) &&
        r.vet_name === vetName &&
        r.requested_date?.startsWith(selectedDate) &&
        ["pendiente_pago", "en_revision"].includes(r.status),
    );

  const openSlot = (time, vetName) => {
    if (isConfirmed(time, vetName) || isBlocked(time, vetName) || adminMode)
      return;
    setActiveSlot({ time, vetName });
    setForm({
      owner_name: "",
      cedula: "",
      phone: "",
      pet_name: "",
      pet_species: "",
      pet_breed: "",
      pet_age: "",
      reason: "",
    });
    setPaymentInfo({ bank: "", reference: "" });
    setError("");
    setModal("step1");
  };

  const closeModal = () => {
    setModal(null);
    setError("");
    setRequestId(null);
    setExpiresAt(null);
    setProofFile(null);
  };

  // ── creación de la solicitud (bloqueo temporal) ──
  const handleStep1 = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          ...form,
          vet_name: activeSlot.vetName,
          requested_date: selectedDate,
          requested_time: activeSlot.time,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setRequestId(data.id);
      setExpiresAt(data.expires_at);
      setModal("step2");
      loadMyRequests();
      loadAppointments();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ── Subir comprobante y datos de pago ──
  const handleStep2 = async () => {
    if (!proofFile || !requestId || !paymentInfo.bank || !paymentInfo.reference)
      return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("request_id", requestId);
      formData.append("bank", paymentInfo.bank);
      formData.append("reference", paymentInfo.reference);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setModal("step3_done");
      loadMyRequests();
    } catch {
      setError("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  const shiftDate = (days) => {
    const d = getLocalFixedDate(selectedDate);
    d.setDate(d.getDate() + days);

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

  const pendingCount = myRequests.filter((r) =>
    ["pendiente_pago", "en_revision"].includes(r.status),
  ).length;

  return (
    <div className="w-full max-w-6xl ml-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 via-cyan-600 to-teal-700 text-transparent bg-clip-text shadow-sm-md">
            Agendar cita
          </h1>
          <p className="text-sm text-teal-600">
            Selecciona un horario disponible
          </p>
        </div>
        {!adminMode && (
          <button
            onClick={() => {
              loadMyRequests();
              setModal("status");
            }}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm"
          >
            <ClipboardList size={16} className="text-teal-600" /> Mis
            solicitudes
            {pendingCount > 0 && (
              <span className="bg-yellow-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Navegación fecha ── */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => shiftDate(-1)}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-gray-600 min-w-[200px] text-center capitalize font-medium">
          {todayLabel}
        </span>
        <button
          onClick={() => shiftDate(1)}
          className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition flex items-center justify-center shadow-sm"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => setSelectedDate(today)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-500 hover:border-teal-400 hover:text-teal-600 transition shadow-sm"
        >
          Hoy
        </button>
      </div>

      {/* ── Tabla slots ── */}
      <div className="bg-white rounded-2xl border border-teal-500 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-teal-500 bg-teal-500">
                <th className="py-3 px-4 text-left text-xs font-semibold text-white uppercase w-20">
                  Hora
                </th>
                {vets.length === 0 ? (
                  <th className="py-3 px-4 text-gray-300 font-normal italic text-center text-xs">
                    No hay veterinarios disponibles
                  </th>
                ) : (
                  vets.map((vet) => (
                    <th
                      key={vet.id}
                      className="py-3 px-4 text-center font-semibold text-white text-sm"
                    >
                      {vet.name}
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
                  <td className="py-3 px-4 text-xs font-mono font-semibold text-gray-400">
                    {hour}
                  </td>
                  {vets.map((vet) => {
                    const confirmed = isConfirmed(hour, vet.name);
                    const blocked = isBlocked(hour, vet.name);
                    return (
                      <td key={vet.id} className="py-2 px-3">
                        {confirmed ? (
                          <div className="w-full rounded-xl py-2 px-3 text-center text-xs bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                            No disponible
                          </div>
                        ) : blocked ? (
                          <div className="w-full flex justify-center items-center gap-1 rounded-xl py-2 px-3 text-center text-xs bg-orange-50 text-orange-500 border border-orange-200">
                            <Lock size={12} /> Reservado
                          </div>
                        ) : (
                          <button
                            onClick={() => openSlot(hour, vet.name)}
                            disabled={adminMode}
                            className="w-full rounded-xl py-2 px-3 text-center text-xs text-teal-600 border border-dashed border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Disponible
                          </button>
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

      {/* ── MODALES ── */}

      {/* Datos del dueño y mascota */}
      {modal === "step1" && (
        <ModalWrapper onClose={closeModal} size="max-w-2xl">
          <StepIndicator step={1} />
          <h2 className="text-base font-bold text-gray-800 mb-1">
            Datos de la cita
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {activeSlot.time} · {activeSlot.vetName} · {fmtDate(selectedDate)}
          </p>

          <div className="max-h-[55vh] overflow-y-auto pr-1 gap-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex flex-col">
              <SectionTitle>Datos del dueño</SectionTitle>
              <PField
                label="Nombre completo"
                value={form.owner_name}
                onChange={(v) => setForm((f) => ({ ...f, owner_name: v }))}
                placeholder="Ej: Juan Pérez"
              />
              <PField
                label="Cédula"
                value={form.cedula}
                onChange={(v) => setForm((f) => ({ ...f, cedula: v }))}
                placeholder="Ej: V-12345678"
              />
              <PField
                label="Teléfono"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                placeholder="Ej: 0414-1234567"
              />
            </div>

            <div className="flex flex-col">
              <SectionTitle>Datos de la mascota</SectionTitle>
              <PField
                label="Nombre"
                value={form.pet_name}
                onChange={(v) => setForm((f) => ({ ...f, pet_name: v }))}
                placeholder="Ej: Firulais"
              />
              <PField
                label="Especie"
                value={form.pet_species}
                onChange={(v) => setForm((f) => ({ ...f, pet_species: v }))}
                placeholder="Ej: Perro, Gato"
              />
              <PField
                label="Raza"
                value={form.pet_breed}
                onChange={(v) => setForm((f) => ({ ...f, pet_breed: v }))}
                placeholder="Ej: Labrador"
              />
              <PField
                label="Edad"
                value={form.pet_age}
                onChange={(v) => setForm((f) => ({ ...f, pet_age: v }))}
                placeholder="Ej: 3 años"
              />
              <PField
                label="Motivo de consulta"
                value={form.reason}
                onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
                placeholder="Ej: Revisión general"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs mt-3 mb-1">{error}</p>}
          <div className="flex gap-2 mt-4">
            <PBtn
              onClick={handleStep1}
              loading={loading}
              disabled={
                !form.owner_name ||
                !form.cedula ||
                !form.phone ||
                !form.pet_name ||
                !form.pet_species
              }
            >
              Reservar horario →
            </PBtn>
            <PGhost onClick={closeModal}>Cancelar</PGhost>
          </div>
        </ModalWrapper>
      )}

      {/*  Pago + comprobante */}
      {modal === "step2" && (
        <ModalWrapper onClose={closeModal} size="max-w-xl">
          <StepIndicator step={2} />
          <h2 className="text-base font-bold text-gray-800 mb-1">
            Realiza el pago
          </h2>

          <Countdown
            expiresAt={expiresAt}
            onExpire={() => {
              closeModal();
              loadMyRequests();
              loadAppointments();
            }}
          />

          <p className="text-xs text-gray-400 mb-4">
            Tu horario está bloqueado. Tienes hasta que expire el temporizador
            para registrar tu pago.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-1">
            {/* Columna Izquierda: Información de cuentas y registro */}
            <div>
              <SectionTitle>
                <Landmark size={14} className="inline mr-1 -mt-0.5" /> Cuentas
                disponibles
              </SectionTitle>
              <div className="space-y-2 mb-5">
                {paymentAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs space-y-1"
                  >
                    <p className="font-semibold text-teal-800">
                      {acc.bank_name}
                    </p>
                    <p className="text-teal-700">
                      Cuenta:{" "}
                      <span className="font-mono">{acc.account_number}</span>
                    </p>
                    <p className="text-teal-600">
                      Titular: {acc.account_holder}
                    </p>
                    {acc.amount > 0 && (
                      <p className="text-teal-800 font-bold mt-1">
                        Monto: {acc.currency} {acc.amount}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <SectionTitle>
                <ReceiptText size={14} className="inline mr-1 -mt-0.5" /> Datos
                de tu pago
              </SectionTitle>
              <PField
                label="Banco de origen / Método"
                value={paymentInfo.bank}
                onChange={(v) =>
                  setPaymentInfo((prev) => ({ ...prev, bank: v }))
                }
                placeholder="Ej: Banesco, Pago Móvil..."
              />
              <PField
                label="Número de referencia"
                value={paymentInfo.reference}
                onChange={(v) =>
                  setPaymentInfo((prev) => ({ ...prev, reference: v }))
                }
                placeholder="Ej: 123456"
              />
            </div>

            {/* Columna Derecha: Adjuntar archivo */}
            <div className="flex flex-col">
              <SectionTitle>
                <Paperclip size={14} className="inline mr-1 -mt-0.5" /> Adjuntar
                Comprobante
              </SectionTitle>
              <div
                className={`w-full flex-1 min-h-[160px] rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition mb-4 flex flex-col items-center justify-center ${
                  proofFile
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-teal-300"
                }`}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
                >
                  {proofFile ? (
                    <p className="text-sm text-teal-700 font-medium flex flex-col items-center gap-2">
                      <CheckCircle2 size={32} className="text-teal-600" />
                      <span className="truncate max-w-[180px]">
                        {proofFile.name}
                      </span>
                    </p>
                  ) : (
                    <>
                      <Paperclip
                        size={32}
                        className="text-teal-600 mx-auto mb-3"
                      />
                      <p className="text-xs text-gray-500 font-medium px-4">
                        Toca para seleccionar imagen o documento PDF
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <PBtn
              onClick={handleStep2}
              loading={loading}
              disabled={
                !proofFile || !paymentInfo.bank || !paymentInfo.reference
              }
            >
              Enviar pago y confirmar
            </PBtn>
            <PGhost onClick={closeModal}>Cancelar</PGhost>
          </div>
        </ModalWrapper>
      )}

      {/* Confirmación */}
      {modal === "step3_done" && (
        <ModalWrapper onClose={closeModal}>
          <div className="text-center py-4">
            <PartyPopper size={48} className="text-teal-600 mx-auto mb-4" />
            <h2 className="text-base font-bold text-gray-800 mb-2">
              ¡Cita y pago enviados!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Tu solicitud está <strong>en revisión</strong>. El asistente
              validará tu pago y confirmará la cita.
            </p>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700 text-left space-y-2 mb-6">
              <p className="flex items-center gap-1.5">
                <PawPrint size={14} className="text-teal-600" />{" "}
                <strong>Mascota:</strong> {form.pet_name}
              </p>
              <p className="flex items-center gap-1.5">
                <Stethoscope size={14} className="text-teal-600" />{" "}
                <strong>Veterinario:</strong> {activeSlot.vetName}
              </p>
              <p className="flex items-center gap-1.5">
                <Clock size={14} className="text-teal-600" />{" "}
                <strong>Hora:</strong> {activeSlot.time}
              </p>
              <p className="flex items-center gap-1.5">
                <Calendar size={14} className="text-teal-600" />{" "}
                <strong>Fecha:</strong> {fmtDate(selectedDate)}
              </p>
            </div>
            <PBtn onClick={closeModal}>Entendido</PBtn>
          </div>
        </ModalWrapper>
      )}

      {/* Mis solicitudes */}
      {modal === "status" && (
        <ModalWrapper onClose={() => setModal(null)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800">
              Mis solicitudes
            </h2>
            <button
              onClick={() => setModal(null)}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 flex items-center justify-center text-sm"
            >
              <X size={16} />
            </button>
          </div>
          {myRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tienes solicitudes aún
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {myRequests.map((req) => {
                const s = STATUS_LABEL[req.status] ?? STATUS_LABEL.expirada;
                return (
                  <div
                    key={req.id}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <PawPrint size={14} className="text-teal-600" />{" "}
                        {req.pet_name}
                      </p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.className}`}
                      >
                        {s.text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{req.vet_name}</p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(req.requested_date)} ·{" "}
                      {fmtTime(req.requested_time)}
                    </p>
                    {["pendiente_pago", "en_revision"].includes(req.status) &&
                      req.expires_at && (
                        <Countdown
                          expiresAt={req.expires_at}
                          onExpire={loadMyRequests}
                          compact
                        />
                      )}
                    {req.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        Motivo: {req.rejection_reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ModalWrapper>
      )}
    </div>
  );
}

// ── Componente Countdown ───────────────────────────────────────
function Countdown({ expiresAt, onExpire, compact = false }) {
  const { timeLeft, expired } = useCountdown(expiresAt);

  useEffect(() => {
    if (expired && onExpire) onExpire();
  }, [expired]);

  if (!timeLeft) return null;

  if (compact) {
    return (
      <p
        className={`text-xs mt-1 font-mono font-bold flex items-center gap-1 ${expired ? "text-red-500" : "text-orange-500"}`}
      >
        {expired ? (
          <>
            <AlertCircle size={14} /> Expirada
          </>
        ) : (
          <>
            <Clock size={14} /> {timeLeft}
          </>
        )}
      </p>
    );
  }

  return (
    <div
      className={`rounded-xl p-3 mb-4 text-center ${expired ? "bg-red-50 border border-red-200" : "bg-orange-50 border border-orange-200"}`}
    >
      <p className="text-xs font-semibold text-gray-600 mb-1">
        Tiempo restante para completar el pago
      </p>
      <p
        className={`text-2xl font-black font-mono ${expired ? "text-red-600" : "text-orange-600"}`}
      >
        {expired ? "EXPIRADO" : timeLeft}
      </p>
      {expired && (
        <p className="text-xs text-red-500 mt-1">
          El horario ha sido liberado automáticamente
        </p>
      )}
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────
function ModalWrapper({ children, onClose, size = "max-w-md" }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-6 transition-all ${size}`}
      >
        {children}
      </div>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className={`h-0.5 w-8 transition-all ${step > s ? "bg-teal-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-gray-400">
        {step === 1 ? "Tus datos" : step === 2 ? "Pago" : "¡Listo!"}
      </span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mt-3 mb-2 flex items-center">
      {children}
    </div>
  );
}

function PField({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-semibold text-gray-500 mb-0.5">
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

function PBtn({ children, onClick, loading, disabled }) {
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

function PGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
    >
      {children}
    </button>
  );
}
