// Este componente maneja la vista principal de solicitudes, con filtros, 
// detalle y acciones de aprobación/rechazo.
"use client";
import { useState, useEffect } from "react";
import { useCountdown } from "../../lib/useCountdown";
import {
  User,
  IdCard,
  Phone,
  PawPrint,
  Bone,
  Dog,
  Calendar,
  FileText,
  Stethoscope,
  Clock,
} from "lucide-react";

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
  new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtTime = (t) => t?.slice(0, 5) ?? "";

export default function RequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [active, setActive] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("en_revision");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadRequests();
    // Refresco automático cada 30s
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setProcessing(true);
    setError("");
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejection_reason: status === "rechazada" ? rejectionReason : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setModal(null);
      setActive(null);
      setRejectionReason("");
      loadRequests();
    } catch {
      setError("Error de conexión");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    setProcessing(true);
    try {
      await fetch(`/api/requests/${id}`, { method: "DELETE" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setModal(null);
      setActive(null);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = requests.filter((r) =>
    filter === "all" ? true : r.status === filter,
  );
  const enRevisionCount = requests.filter(
    (r) => r.status === "en_revision",
  ).length;
  const pendingCount = requests.filter(
    (r) => r.status === "pendiente_pago",
  ).length;

  const FILTERS = [
    { key: "en_revision", label: "En revisión", count: enRevisionCount },
    { key: "pendiente_pago", label: "Pend. pago", count: pendingCount },
    { key: "aprobada", label: "Aprobadas", count: 0 },
    { key: "rechazada", label: "Rechazadas", count: 0 },
    { key: "expirada", label: "Expiradas", count: 0 },
    { key: "all", label: "Todas", count: 0 },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">
            Solicitudes de citas
          </h2>
          {enRevisionCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {enRevisionCount} por revisar
            </span>
          )}
        </div>
        <button
          onClick={loadRequests}
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 rounded-xl px-3 py-2 text-sm transition shadow-sm"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-fit mb-6 flex-wrap gap-1">
        {FILTERS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  filter === key
                    ? "bg-white/30 text-white"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Cargando solicitudes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-sm">
            No hay solicitudes en este estado
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const s = STATUS_LABEL[req.status] ?? STATUS_LABEL.expirada;

            {
              (req.status === "en_revision" ||
                req.status === "pendiente_pago") &&
                req.expires_at && (
                  <AssistantCountdown
                    expiresAt={req.expires_at}
                    onExpire={loadRequests}
                  />
                );
            }

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 hover:border-teal-200 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                    <PawPrint size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      {req.pet_name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <User size={12} className="text-teal-600" />{" "}
                      {req.owner_name} ·{" "}
                      <Phone size={12} className="text-teal-600" /> {req.phone}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req.vet_name} · {fmtDate(req.requested_date)}{" "}
                      {fmtTime(req.requested_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.className}`}
                  >
                    {s.text}
                  </span>
                  <button
                    onClick={() => {
                      setActive(req);
                      setError("");
                      setRejectionReason("");
                      setModal("detail");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-xs font-medium transition"
                  >
                    Ver detalle
                  </button>
                  {req.status === "en_revision" && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "aprobada")}
                        disabled={processing}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition disabled:opacity-50"
                      >
                        ✓ Aprobar
                      </button>
                      <button
                        onClick={() => {
                          setActive(req);
                          setModal("reject");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition"
                      >
                        ✕ Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle */}
      {modal === "detail" && active && (
        <ModalWrap onClose={() => setModal(null)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-800">
              Solicitud #{active.id}
            </h2>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_LABEL[active.status]?.className}`}
            >
              {STATUS_LABEL[active.status]?.text}
            </span>
          </div>

          {(active.status === "en_revision" ||
            active.status === "pendiente_pago") &&
            active.expires_at && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">
                  Tiempo restante para validar:
                </p>
                <AssistantCountdown
                  expiresAt={active.expires_at}
                  onExpire={() => {
                    setModal(null);
                    loadRequests();
                  }}
                />
              </div>
            )}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4 max-h-[45vh] overflow-y-auto">
            <STitle>Dueño</STitle>
            <IRow
              icon={<User size={16} />}
              label="Nombre"
              value={active.owner_name}
            />
            <IRow
              icon={<IdCard size={16} />}
              label="Cédula"
              value={active.cedula}
            />
            <IRow
              icon={<Phone size={16} />}
              label="Teléfono"
              value={active.phone}
            />

            <STitle>Mascota</STitle>
            <IRow
              icon={<PawPrint size={16} />}
              label="Nombre"
              value={active.pet_name}
            />
            <IRow
              icon={<Bone size={16} />}
              label="Especie"
              value={active.pet_species}
            />
            <IRow
              icon={<Dog size={16} />}
              label="Raza"
              value={active.pet_breed || "—"}
            />
            <IRow
              icon={<Calendar size={16} />}
              label="Edad"
              value={active.pet_age || "—"}
            />
            <IRow
              icon={<FileText size={16} />}
              label="Motivo"
              value={active.reason || "—"}
            />

            <STitle>Cita</STitle>
            <IRow
              icon={<Stethoscope size={16} />}
              label="Veterinario"
              value={active.vet_name}
            />
            <IRow
              icon={<Calendar size={16} />}
              label="Fecha"
              value={fmtDate(active.requested_date)}
            />
            <IRow
              icon={<Clock size={16} />}
              label="Hora"
              value={fmtTime(active.requested_time)}
            />
          </div>
          {active.payment_proof ? (
            <a
              href={active.payment_proof}
              target="_blank"
              rel="noreferrer"
              className="w-full block mb-4 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 py-2.5 text-sm text-teal-700 font-medium transition text-center"
            >
              🧾 Ver comprobante de pago
            </a>
          ) : (
            <div className="w-full mb-4 rounded-xl border border-dashed border-gray-200 py-2.5 text-center text-xs text-gray-400">
              Sin comprobante adjunto
            </div>
          )}
          {active.rejection_reason && (
            <div className="bg-red-50 rounded-xl p-3 mb-4 text-xs text-red-600">
              <strong>Motivo de rechazo:</strong> {active.rejection_reason}
            </div>
          )}
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex flex-col gap-2">
            {active.status === "en_revision" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(active.id, "aprobada")}
                  disabled={processing}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
                >
                  {processing ? "Procesando..." : "✓ Aprobar cita"}
                </button>
                <button
                  onClick={() => setModal("reject")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition"
                >
                  ✕ Rechazar
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(active.id)}
                disabled={processing}
                className="flex-1 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
              >
                🗑 Eliminar
              </button>
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalWrap>
      )}

      {/* Modal rechazar con motivo */}
      {modal === "reject" && active && (
        <ModalWrap onClose={() => setModal("detail")}>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            Rechazar solicitud
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            El horario será liberado y el paciente será notificado.
          </p>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Motivo del rechazo
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ej: Comprobante no válido, monto incorrecto..."
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent mb-4 resize-none"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(active.id, "rechazada")}
              disabled={processing || !rejectionReason.trim()}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-50"
            >
              {processing ? "Procesando..." : "Confirmar rechazo"}
            </button>
            <button
              onClick={() => setModal("detail")}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-sm font-medium transition"
            >
              Volver
            </button>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────

function AssistantCountdown({ expiresAt, onExpire }) {
  const { timeLeft, expired } = useCountdown(expiresAt);

  useEffect(() => {
    if (expired && onExpire) onExpire();
  }, [expired]);

  if (!timeLeft) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
        expired
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-orange-50 text-orange-600 border border-orange-200"
      }`}
    >
      <span>{expired ? "⏰ Expirada" : "⏱"}</span>
      <span>{expired ? "Tiempo agotado" : timeLeft}</span>
    </div>
  );
}

function ModalWrap({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}

function STitle({ children }) {
  return (
    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider pt-2">
      {children}
    </p>
  );
}

function IRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 flex justify-center text-teal-600">{icon}</span>
      <span className="text-xs text-gray-400 w-24">{label}</span>
      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
}
