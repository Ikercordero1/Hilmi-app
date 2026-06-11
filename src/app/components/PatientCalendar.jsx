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
  User,
  ChevronDown,
} from "lucide-react";

// ── UTILIDADES PARA MANEJO DE FECHAS ──────────────────────────────────────────
const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalFixedDate = (dateString) => {
  if (!dateString) return new Date();
  const cleanDate = dateString.split("T")[0];
  const [year, month, day] = cleanDate.split("-");
  return new Date(year, month - 1, day);
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

// ── VALIDACION ─────────────────────────────────────────────────────────────────
const validatePatientFormData = (form) => {
  const pet = form.pet_name?.trim() || "";
  const owner = form.owner_name?.trim() || "";
  const cedula = form.cedula?.trim() || "";
  const phone = form.phone?.trim() || "";

  if (!pet || !owner || !cedula || !phone || !form.pet_species)
    return "Todos los campos obligatorios deben estar rellenos.";

  if (pet.length < 2)
    return "El nombre de la mascota debe tener al menos 2 caracteres.";
  if (owner.length < 3)
    return "El nombre del dueno debe tener al menos 3 caracteres.";

  const cleanPet = pet.toLowerCase().replace(/\s+/g, "");
  const cleanOwner = owner.toLowerCase().replace(/\s+/g, "");
  if (new Set(cleanPet).size === 1)
    return "El nombre de la mascota no parece valido.";
  if (new Set(cleanOwner).size === 1)
    return "El nombre del dueno no parece valido.";

  const consonantMashRegex = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
  if (consonantMashRegex.test(cleanPet) || consonantMashRegex.test(cleanOwner))
    return "Los nombres ingresados contienen combinaciones invalidas.";

  const validNameRegex = /^[a-zA-ZA-\u00ff\s.'-]+$/;
  if (!validNameRegex.test(pet))
    return "El nombre de la mascota solo debe contener letras.";
  if (!validNameRegex.test(owner))
    return "El nombre del dueno solo debe contener letras.";

  const cleanCedula = cedula.replace(/[\s.-]/g, "").replace(/^[VEve]-?/, "");
  const onlyNumbersRegex = /^\d+$/;
  if (!onlyNumbersRegex.test(cleanCedula))
    return "La cedula debe contener solo numeros.";
  if (cleanCedula.length < 6 || cleanCedula.length > 9)
    return "La cedula debe tener entre 6 y 9 digitos.";

  const cleanPhone = phone.replace(/[\s.-]/g, "");
  if (!onlyNumbersRegex.test(cleanPhone))
    return "El telefono debe contener solo numeros.";
  if (cleanPhone.length < 10 || cleanPhone.length > 15)
    return "El numero de telefono debe tener entre 10 y 15 digitos.";

  return null;
};

const STATUS_LABEL = {
  pendiente_pago: {
    text: "Pendiente de pago",
    className: "bg-orange-100 text-orange-700",
  },
  en_revision: { text: "En revision", className: "bg-blue-100 text-blue-700" },
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

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────────
export default function PatientCalendar({ clientId, adminMode = false }) {
  const today = getLocalTodayString();

  const [vets, setVets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  // Selecciones inline (secciones 1-3)
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedVet, setSelectedVet] = useState(null); // objeto vet completo
  const [selectedTime, setSelectedTime] = useState(null); // string hora

  // Modal: null | "step1" | "step2" | "step3_done" | "status"
  const [modal, setModal] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const [paymentInfo, setPaymentInfo] = useState({ bank: "", reference: "" });

  useEffect(() => {
    loadVets();
    loadPaymentAccounts();
    if (clientId) loadMyRequests();
    const cron = setInterval(
      () => fetch("/requests/expire", { method: "POST" }),
      60000,
    );
    return () => clearInterval(cron);
  }, [clientId]);

  useEffect(() => {
    loadAppointments();
    // Al cambiar fecha resetear selecciones dependientes
    setSelectedVet(null);
    setSelectedTime(null);
  }, [selectedDate]);

  useEffect(() => {
    // Al cambiar vet resetear hora
    setSelectedTime(null);
  }, [selectedVet]);

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

  const allSlotsForSelectedVet = selectedVet
    ? HOURS.map((h) => ({
        time: h,
        confirmed: isConfirmed(h, selectedVet.name),
        blocked: isBlocked(h, selectedVet.name),
      }))
    : [];

  // Abrir modal step1 cuando se tiene vet + hora seleccionados
  const openBookingModal = () => {
    if (!selectedVet || !selectedTime || adminMode) return;
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

  // ── Step 1: Crear solicitud ────────────────────────────────────────────────
  const handleStep1 = async () => {
    setError("");
    const validationError = validatePatientFormData(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const formattedCedula = form.cedula
        .replace(/[\s.-]/g, "")
        .replace(/^[VEve]-?/, "");
      const formattedPhone = form.phone.replace(/[\s.-]/g, "");

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          ...form,
          owner_name: form.owner_name.trim(),
          pet_name: form.pet_name.trim(),
          cedula: formattedCedula,
          phone: formattedPhone,
          vet_name: selectedVet.name,
          requested_date: selectedDate,
          requested_time: selectedTime,
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
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Subir comprobante ──────────────────────────────────────────────
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

  // Calcular cuantos slots libres tiene un vet en el dia seleccionado
  const freeSlotCount = (vetName) =>
    HOURS.filter((h) => !isConfirmed(h, vetName) && !isBlocked(h, vetName))
      .length;

  return (
    <div className="w-full max-w-3xl ml-auto space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 via-cyan-600 to-teal-700 text-transparent bg-clip-text">
            Agendar cita
          </h1>
          <p className="text-sm text-teal-600">
            Selecciona fecha, veterinario y horario
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
            <ClipboardList size={16} className="text-teal-600" />
            Mis solicitudes
            {pendingCount > 0 && (
              <span className="bg-yellow-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ══ SECCION 1: Fecha ════════════════════════════════════════════════════ */}
      <SectionCard step={1} title="Selecciona la fecha">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => shiftDate(-1)}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[220px] text-center capitalize">
            {todayLabel}
          </span>
          <button
            onClick={() => shiftDate(1)}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition flex items-center justify-center shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setSelectedDate(today)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-500 hover:border-teal-400 hover:text-teal-600 transition shadow-sm"
          >
            Hoy
          </button>
        </div>
      </SectionCard>

      {/* ══ SECCION 2: Veterinario ═══════════════════════════════════════════════ */}
      <SectionCard step={2} title="Elige un veterinario">
        {vets.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No hay veterinarios disponibles.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {vets.map((vet) => {
              const free = freeSlotCount(vet.name);
              const isSelected = selectedVet?.id === vet.id;
              return (
                <button
                  key={vet.id}
                  onClick={() => setSelectedVet(isSelected ? null : vet)}
                  disabled={adminMode}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 shadow-teal-100 shadow-md"
                        : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/40"
                    }`}
                >
                  {/* Avatar inicial */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold transition-all
                      ${isSelected ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700"}`}
                  >
                    {vet.name.charAt(0).toUpperCase()}
                  </div>
                  <p
                    className={`text-xs font-semibold leading-tight ${isSelected ? "text-teal-800" : "text-gray-700"}`}
                  >
                    {vet.name}
                  </p>
                  {/* Badge slots libres */}
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                      ${
                        free === 0
                          ? "bg-gray-100 text-gray-400"
                          : isSelected
                            ? "bg-teal-600 text-white"
                            : "bg-teal-100 text-teal-700"
                      }`}
                  >
                    {free === 0
                      ? "Sin disponibilidad"
                      : `${free} horarios libres`}
                  </span>
                  {/* Check seleccionado */}
                  {isSelected && (
                    <CheckCircle2
                      size={16}
                      className="absolute top-2 right-2 text-teal-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ══ SECCION 3: Horarios ══════════════════════════════════════════════════ */}
      {selectedVet && (
        <SectionCard
          step={3}
          title={`Horarios disponibles · ${selectedVet.name}`}
        >
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {allSlotsForSelectedVet.map(({ time, confirmed, blocked }) => {
              const isSelected = selectedTime === time;

              if (confirmed) {
                return (
                  <div
                    key={time}
                    className="rounded-xl py-2.5 px-2 text-center text-xs bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  >
                    <p className="font-mono font-semibold">{time}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">No disp.</p>
                  </div>
                );
              }
              if (blocked) {
                return (
                  <div
                    key={time}
                    className="rounded-xl py-2.5 px-2 text-center text-xs bg-orange-50 text-orange-500 border border-orange-200 cursor-not-allowed flex flex-col items-center gap-0.5"
                  >
                    <Lock size={12} />
                    <p className="font-mono font-semibold">{time}</p>
                    <p className="text-[10px] opacity-70">Reservado</p>
                  </div>
                );
              }
              return (
                <button
                  key={time}
                  onClick={() => {
                    if (adminMode) return;
                    setSelectedTime(isSelected ? null : time);
                  }}
                  disabled={adminMode}
                  className={`rounded-xl py-2.5 px-2 text-center text-xs border-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 text-teal-800 shadow-sm"
                        : "border-dashed border-teal-200 text-teal-600 hover:border-teal-400 hover:bg-teal-50"
                    }`}
                >
                  <p className="font-mono font-semibold">{time}</p>
                  <p className="text-[10px] mt-0.5 opacity-60">
                    {isSelected ? "Seleccionado" : "Disponible"}
                  </p>
                  {isSelected && (
                    <CheckCircle2
                      size={12}
                      className="mx-auto mt-1 text-teal-600"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* CTA reservar */}
          {selectedTime && !adminMode && (
            <div className="mt-4 pt-4 border-t border-teal-100 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-teal-700">
                  {selectedTime}
                </span>
                {" · "}
                <span className="capitalize">{fmtDate(selectedDate)}</span>
                {" · "}
                <span>{selectedVet.name}</span>
              </div>
              <button
                onClick={openBookingModal}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition shadow-sm"
              >
                Continuar con la reserva →
              </button>
            </div>
          )}
        </SectionCard>
      )}

      {/* ══ MODALES ══════════════════════════════════════════════════════════════ */}

      {/* Modal Step 1: Datos de la cita */}
      {modal === "step1" && (
        <ModalWrapper onClose={closeModal} size="max-w-2xl">
          <ModalHeader onClose={closeModal}>
            <StepIndicator step={1} />
          </ModalHeader>

          <h2 className="text-base font-bold text-gray-800 mb-0.5">
            Datos de la cita
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {selectedTime} · {selectedVet?.name} · {fmtDate(selectedDate)}
          </p>

          {/* Grid responsivo con scroll solo en el contenido */}
          <div className="overflow-y-auto max-h-[55vh] pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
              <div>
                <SectionTitle>Datos del dueno</SectionTitle>
                <PField
                  label="Nombre completo"
                  value={form.owner_name}
                  onChange={(v) => setForm((f) => ({ ...f, owner_name: v }))}
                  placeholder="Ej: Juan Perez"
                />
                <PField
                  label="Cedula"
                  value={form.cedula}
                  onChange={(v) => setForm((f) => ({ ...f, cedula: v }))}
                  placeholder="Ej: V-12345678"
                />
                <PField
                  label="Telefono"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  placeholder="Ej: 0414-1234567"
                />
              </div>
              <div>
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
                  placeholder="Ej: 3 anos"
                />
                <PField
                  label="Motivo de consulta"
                  value={form.reason}
                  onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
                  placeholder="Ej: Revision general"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

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

      {/* Modal Step 2: Pago */}
      {modal === "step2" && (
        <ModalWrapper onClose={closeModal} size="max-w-xl">
          <ModalHeader onClose={closeModal}>
            <StepIndicator step={2} />
          </ModalHeader>

          <h2 className="text-base font-bold text-gray-800 mb-2">
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
            Tu horario esta bloqueado. Tienes hasta que expire el temporizador
            para registrar tu pago.
          </p>

          <div className="overflow-y-auto max-h-[50vh] pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Col izq: cuentas + datos de pago */}
              <div>
                <SectionTitle>
                  <Landmark size={14} className="inline mr-1 -mt-0.5" /> Cuentas
                  disponibles
                </SectionTitle>
                <div className="space-y-2 mb-4">
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
                  <ReceiptText size={14} className="inline mr-1 -mt-0.5" />{" "}
                  Datos de tu pago
                </SectionTitle>
                <PField
                  label="Banco de origen / Metodo"
                  value={paymentInfo.bank}
                  onChange={(v) => setPaymentInfo((p) => ({ ...p, bank: v }))}
                  placeholder="Ej: Banesco, Pago Movil..."
                />
                <PField
                  label="Numero de referencia"
                  value={paymentInfo.reference}
                  onChange={(v) =>
                    setPaymentInfo((p) => ({ ...p, reference: v }))
                  }
                  placeholder="Ej: 123456"
                />
              </div>

              {/* Col der: adjuntar comprobante */}
              <div className="flex flex-col">
                <SectionTitle>
                  <Paperclip size={14} className="inline mr-1 -mt-0.5" />{" "}
                  Adjuntar comprobante
                </SectionTitle>
                <div
                  className={`w-full flex-1 min-h-[180px] rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer transition
                    ${proofFile ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-300"}`}
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
                    className="cursor-pointer w-full h-full flex flex-col items-center justify-center gap-2"
                  >
                    {proofFile ? (
                      <>
                        <CheckCircle2 size={36} className="text-teal-600" />
                        <p className="text-sm text-teal-700 font-semibold text-center px-2 truncate max-w-[180px]">
                          {proofFile.name}
                        </p>
                        <p className="text-[10px] text-teal-500">
                          Toca para cambiar
                        </p>
                      </>
                    ) : (
                      <>
                        <Paperclip size={36} className="text-teal-400" />
                        <p className="text-xs text-gray-500 font-medium text-center px-4">
                          Toca para seleccionar imagen o PDF
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

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

      {/* Modal Step 3: Confirmacion */}
      {modal === "step3_done" && (
        <ModalWrapper onClose={closeModal} size="max-w-sm">
          <ModalHeader onClose={closeModal}>
            <StepIndicator step={3} />
          </ModalHeader>
          <div className="text-center py-2">
            <PartyPopper size={44} className="text-teal-600 mx-auto mb-3" />
            <h2 className="text-base font-bold text-gray-800 mb-1">
              Cita y pago enviados
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Tu solicitud esta <strong>en revision</strong>. El asistente
              validara tu pago y confirmara la cita.
            </p>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700 text-left space-y-2 mb-5">
              <p className="flex items-center gap-2">
                <PawPrint size={13} className="text-teal-600 shrink-0" />
                <strong>Mascota:</strong> {form.pet_name}
              </p>
              <p className="flex items-center gap-2">
                <Stethoscope size={13} className="text-teal-600 shrink-0" />
                <strong>Veterinario:</strong> {selectedVet?.name}
              </p>
              <p className="flex items-center gap-2">
                <Clock size={13} className="text-teal-600 shrink-0" />
                <strong>Hora:</strong> {selectedTime}
              </p>
              <p className="flex items-center gap-2">
                <Calendar size={13} className="text-teal-600 shrink-0" />
                <strong>Fecha:</strong> {fmtDate(selectedDate)}
              </p>
            </div>
            <PBtn onClick={closeModal}>Entendido</PBtn>
          </div>
        </ModalWrapper>
      )}

      {/* Modal: Mis solicitudes */}
      {modal === "status" && (
        <ModalWrapper onClose={() => setModal(null)} size="max-w-md">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800">
              Mis solicitudes
            </h2>
            <button
              onClick={() => setModal(null)}
              className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
          {myRequests.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No tienes solicitudes aun
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
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

// ── Countdown ─────────────────────────────────────────────────────────────────
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
          El horario ha sido liberado automaticamente
        </p>
      )}
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({ step, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Cabecera de sección */}
      <div className="flex items-center gap-3 px-4 py-3 bg-teal-500">
        <span className="w-6 h-6 rounded-full bg-white/30 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {/* Contenido */}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── ModalWrapper ──────────────────────────────────────────────────────────────
function ModalWrapper({ children, onClose, size = "max-w-md" }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${size} flex flex-col`}
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
      >
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

// ── ModalHeader ───────────────────────────────────────────────────────────────
function ModalHeader({ children, onClose }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>{children}</div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 flex items-center justify-center shrink-0 ml-2"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ── StepIndicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step >= s ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-400"}`}
          >
            {step > s ? <CheckCircle2 size={14} /> : s}
          </div>
          {s < 3 && (
            <div
              className={`h-0.5 w-6 transition-all ${step > s ? "bg-teal-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
      <span className="ml-1 text-xs text-gray-400">
        {step === 1 ? "Tus datos" : step === 2 ? "Pago" : "Listo"}
      </span>
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mt-3 mb-2 flex items-center gap-1">
      {children}
    </div>
  );
}

// ── PField ────────────────────────────────────────────────────────────────────
function PField({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
      />
    </div>
  );
}

// ── PBtn ──────────────────────────────────────────────────────────────────────
function PBtn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}

// ── PGhost ────────────────────────────────────────────────────────────────────
function PGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl py-2.5 text-sm font-medium transition"
    >
      {children}
    </button>
  );
}
