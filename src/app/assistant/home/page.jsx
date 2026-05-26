// Página principal del asistente, con calendario y panel de solicitudes
"use client";
import { useState, useEffect } from "react";
import AppointmentCalendar from "../../components/Appointmentcalendar";
import RequestPanel from "../../components/RequestPanel";
import PaymentModal from "../../components/PaymentModal";
import { Calendar, User, Bell } from "lucide-react";

export default function AssistantHome() {
  const [tab, setTab] = useState("calendar"); // "calendar" | "requests"
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [stats, setStats] = useState({
    todayAppts: 0,
    pendingRequests: 0,
    totalVets: 0,
  });

  useEffect(() => {
    loadStats();

    // Reducido a 10 segundos (10000ms) para una sensación más "en tiempo real"
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]; // Ej: "2026-05-18"
      const time = Date.now();

      const [apptRes, reqRes, vetRes] = await Promise.all([
        fetch(`/api/appointments?t=${time}`, { cache: "no-store" }),
        fetch(`/api/requests?t=${time}`, { cache: "no-store" }),
        fetch(`/api/vets?t=${time}`, { cache: "no-store" }),
      ]);

      const [apptsData, reqsData, vetsData] = await Promise.all([
        apptRes.json(),
        reqRes.json(),
        vetRes.json(),
      ]);

      // pruebas a la API, para ver que datos devuelve exactamente y asi evitar errores al tratar de acceder a campos que no existen o que tienen nombres diferentes
      console.log("📦 Datos Citas:", apptsData);
      console.log("📦 Datos Solicitudes:", reqsData);
      console.log("📦 Datos Veterinarios:", vetsData);

      // Truco: Si tu API devuelve { data: [...] }, esto extrae el arreglo. Si ya es arreglo, lo deja igual.
      const appts = Array.isArray(apptsData)
        ? apptsData
        : apptsData.data || apptsData.appointments || [];
      const reqs = Array.isArray(reqsData)
        ? reqsData
        : reqsData.data || reqsData.requests || [];
      const vets = Array.isArray(vetsData)
        ? vetsData
        : vetsData.data || vetsData.vets || [];

      const todayAppts = appts.filter((a) => {
        // Aseguramiento de que exista el campo antes de usar startsWith
        if (!a.appointment_date) return false;
        return a.appointment_date.startsWith(today);
      }).length;

      const pendingRequests = reqs.filter((r) => {
        if (!r.status) return false;
        // Conversión a minúsculas por si acaso en la BD dice "En Revision" o "Pendiente_Pago"
        const estado = r.status.toLowerCase();
        return estado.includes("revision") || estado.includes("pendiente");
      }).length;

      const totalVets = vets.length;

      setPendingCount(pendingRequests);
      setStats({ todayAppts, pendingRequests, totalVets });
    } catch (e) {
      console.error("❌ Error cargando estadísticas:", e);
    }
  };

  return (
    <div className="w-full">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-700 via-cyan-600 to-teal-700 text-transparent bg-clip-text shadow-sm-md">
            Panel del asistente
          </h1>
          <p className="text-sm text-cyan-800 mt-1">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-teal-400 hover:bg-teal-50 text-cyan-700 rounded-xl px-4 py-2 text-sm font-medium transition shadow-sm"
        >
          🏦 Cuentas de pago
        </button>
      </div>

      {/*Stats*/}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Calendar className="w-10 h-10 " />}
          label="Citas hoy"
          value={stats.todayAppts}
          color="teal"
        />
        <StatCard
          icon={<Bell className="w-10 h-10" />}
          label="Solicitudes pendientes"
          value={stats.pendingRequests}
          color={stats.pendingRequests > 0 ? "alert" : "cyan"}
          onClick={() => setTab("requests")}
          clickable={stats.pendingRequests > 0}
        />

        <StatCard
          icon={<User className="w-10 h-10 " />}
          label="Veterinarios activos"
          value={stats.totalVets}
          color="cyan"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-fit mb-6">
        <TabBtn active={tab === "calendar"} onClick={() => setTab("calendar")}>
          📆 Calendario
        </TabBtn>

        <TabBtn active={tab === "requests"} onClick={() => setTab("requests")}>
          <span className="relative flex items-center gap-2">
            <span
              className={`text-base ${pendingCount > 0 ? "animate-bounce" : ""}`}
            >
              🔔
            </span>
            Solicitudes
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </span>
        </TabBtn>
      </div>

      {/* Contenido */}
      {tab === "calendar" && pendingCount > 0 && (
        <button
          onClick={() => setTab("requests")}
          className="w-full mb-4 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl px-4 py-3 flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl animate-bounce">🔔</span>
            <div className="text-left">
              <p className="text-sm font-bold text-red-700">
                {pendingCount} solicitud{pendingCount > 1 ? "es" : ""} pendiente
                {pendingCount > 1 ? "s" : ""} de revisión
              </p>
              <p className="text-xs text-red-500">
                Toca aquí para revisar y aprobar
              </p>
            </div>
          </div>
          <span className="text-red-400 text-lg">›</span>
        </button>
      )}

      {tab === "calendar" && <AppointmentCalendar />}

      {/* IMPORTANTE: Le pasamos la función loadStats al panel */}
      {tab === "requests" && <RequestPanel refreshStats={loadStats} />}

      {/* ── Modal cuentas de pago ── */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}

// ── Subcomponentes independientes ──────────────────────────────────────────────

function StatCard({ icon, label, value, color, onClick, clickable }) {
  const colors = {
    teal: "bg-teal-50 border-teal-100 text-teal-700",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
    cyan: "bg-cyan-50 border-cyan-100 text-cyan-700",
    gray: "bg-gray-50 border-gray-100 text-gray-500",
    alert: "bg-red-500 border-red-600 text-white",
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`rounded-2xl border p-5 flex items-center gap-4 transition relative overflow-hidden
        ${colors[color]}
        ${clickable ? "cursor-pointer hover:shadow-md" : ""}
        ${color === "alert" ? "shadow-lg shadow-red-300" : ""}
      `}
    >
      {color === "alert" && (
        <span className="absolute inset-0 rounded-2xl border-2 border-red-400 animate-ping opacity-30" />
      )}

      <div className="relative z-10 flex items-center gap-4 w-full">
        <span className={color === "alert" ? "animate-bounce" : ""}>
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs font-medium opacity-80">
            {color === "alert" ? "¡Requiere atención!" : label}
          </p>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
