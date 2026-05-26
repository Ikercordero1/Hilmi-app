/// Componente principal del panel de administración, con navegación entre secciones y gestión de usuarios.
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  PawPrint,
  Users,
  Wallet,
  Calendar,
  Bell,
  Activity,
  RefreshCw,
  Plus,
  UserCog,
  Trash2,
  Crown,
  Loader2,
  LogOut,
} from "lucide-react";
//Rutas
import AppointmentCalendar from "./Appointmentcalendar";
import RequestsPanel from "./RequestPanel";
import PaymentModal from "./PaymentModal";
import PatientCalendar from "./PatientCalendar";

const ROLE_LABEL = {
  user: {
    text: "Usuario",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  assistant: {
    text: "Asistente",
    className: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  },
  admin: {
    text: "Admin",
    className:
      "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border border-transparent shadow-sm",
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState("dashboard");
  const [assistantTab, setAssistantTab] = useState("calendar");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [stats, setStats] = useState({
    todayAppts: 0,
    pendingRequests: 0,
    totalVets: 0,
    totalUsers: 0,
  });

  // Usuarios
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userModal, setUserModal] = useState(null); // null | "create" | "editRole"
  const [activeUser, setActiveUser] = useState(null);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  // 1. Envolvemos loadStats en useCallback para evitar re-renderizados
  const loadStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [apptRes, reqRes, vetRes, userRes] = await Promise.all([
        fetch("/api/appointments", { cache: "no-store" }),
        fetch("/api/requests", { cache: "no-store" }),
        fetch("/api/vets", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);

      const parseJsonSafe = async (res, label) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error(`Error en ${label}:`, res.status, errorData);
          return null;
        }
        return res.json().catch((error) => {
          console.error(`Error parseando JSON de ${label}:`, error);
          return null;
        });
      };

      const [appts, reqs, vets, usrs] = await Promise.all([
        parseJsonSafe(apptRes, "appointments"),
        parseJsonSafe(reqRes, "requests"),
        parseJsonSafe(vetRes, "vets"),
        parseJsonSafe(userRes, "users"),
      ]);
      setStats({
        todayAppts: Array.isArray(appts)
          ? appts.filter((a) => a.appointment_date?.startsWith(today)).length
          : 0,
        pendingRequests: Array.isArray(reqs)
          ? reqs.filter((r) => r.status === "pending").length
          : 0,
        totalVets: Array.isArray(vets) ? vets.length : 0,
        totalUsers: Array.isArray(usrs) ? usrs.length : 0,
      });
    } catch (e) {
      console.error(e);
    }
  }, []); // Sin dependencias, la función es estable

  // Envolvimiento de loadUsers en useCallback
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Error cargando usuarios:", res.status, errorData);
        return;
      }
      const data = await res.json().catch((error) => {
        console.error("Error parseando JSON de usuarios:", error);
        return null;
      });
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }, []); // Sin dependencias

  // Efectos limpios dependiendo de las funciones estabilizadas
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (mainTab === "users") loadUsers();
  }, [mainTab, loadUsers]);

  const createUser = async () => {
    setUserLoading(true);
    setUserError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserError(data.message);
        return;
      }
      setUserModal(null);
      setUserForm({ email: "", password: "", role: "user" });
      loadUsers();
      loadStats();
    } catch {
      setUserError("Error de conexión");
    } finally {
      setUserLoading(false);
    }
  };

  const updateRole = async () => {
    if (!activeUser) return;
    setUserLoading(true);
    setUserError("");
    try {
      const res = await fetch(`/api/admin/users/${activeUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: activeUser.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserError(data.message);
        return;
      }
      setUserModal(null);
      setActiveUser(null);
      loadUsers();
      loadStats();
    } catch {
      setUserError("Error de conexión");
    } finally {
      setUserLoading(false);
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        loadStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeUserModal = () => {
    setUserModal(null);
    setUserError("");
    setActiveUser(null);
    setUserForm({ email: "", password: "", role: "user" });
  };

  const TABS = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "assistant", icon: UserCheck, label: "Asistente" },
    { key: "patient", icon: PawPrint, label: "Paciente" },
    { key: "users", icon: Users, label: "Usuarios" },
  ];

  return (
    <div className="w-full text-slate-800  antialiased font-sans">
      {/*Header*/}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              <Crown className="w-3.5 h-3.5 text-teal-600" /> Administrador
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-teal-900 to-teal-800 bg-clip-text text-transparent tracking-tight">
            Panel de Control
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1.5 capitalize">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-white backdrop-blur-md border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Wallet className="w-4 h-4 text-teal-500" /> Cuentas de pago
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 bg-white backdrop-blur-md border  border-rose-100 hover:border-rose-300 hover:bg-rose-50 text-rose-600 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      {/* Navegación principal */}
      <div className="flex items-center gap-2 bg-white/80  backdrop-blur-xl rounded-2xl p-2 border border-slate-200 shadow-sm w-fit mb-8 flex-wrap">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              mainTab === key
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/20 scale-[1.02]"
                : "text-slate-500 hover:text-teal-600 hover:bg-white"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${mainTab === key ? "text-white" : "text-slate-400"}`}
            />
            {label}
            {key === "assistant" && stats.pendingRequests > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse ml-1">
                {stats.pendingRequests}
              </span>
            )}
          </button>
        ))}
      </div>

      {/*DASHBOARD */}
      {mainTab === "dashboard" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
              icon={Calendar}
              label="Citas de hoy"
              value={stats.todayAppts}
              color="cyan"
            />
            <StatCard
              icon={Bell}
              label="Solicitudes pendientes"
              value={stats.pendingRequests}
              color={stats.pendingRequests > 0 ? "gradient" : "slate"}
              onClick={() => setMainTab("assistant")}
              clickable={stats.pendingRequests > 0}
            />
            <StatCard
              icon={Activity}
              label="Veterinarios activos"
              value={stats.totalVets}
              color="cyan"
            />
            <StatCard
              icon={Users}
              label="Usuarios registrados"
              value={stats.totalUsers}
              color="teal"
              onClick={() => setMainTab("users")}
              clickable
            />
          </div>

          {/* Accesos rápidos con sus iconos */}
          <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">
            Accesos Rápidos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                title: "Calendario",
                desc: "Ver y gestionar citas del día",
                action: () => {
                  setMainTab("assistant");
                  setAssistantTab("calendar");
                },
              },
              {
                icon: Bell,
                title: "Solicitudes",
                desc: "Revisar solicitudes de pacientes",
                action: () => {
                  setMainTab("assistant");
                  setAssistantTab("requests");
                },
              },
              {
                icon: Users,
                title: "Usuarios",
                desc: "Crear y gestionar roles de usuarios",
                action: () => setMainTab("users"),
              },
            ].map(({ icon: Icon, title, desc, action }) => (
              <button
                key={title}
                onClick={action}
                className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm p-6 text-left hover:border-teal-300 hover:bg-white transition-all duration-300 group hover:shadow-xl hover:shadow-teal-900/5 hover:-translate-y-1"
              >
                <div className="p-3 bg-teal-50 rounded-2xl w-fit mb-4 group-hover:bg-teal-500 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
                </div>
                <p className="font-bold text-slate-800 text-lg group-hover:text-teal-700 transition-colors">
                  {title}
                </p>
                <p className="text-sm text-slate-500 mt-1.5 font-medium leading-relaxed">
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Vista de Asistente en admin ── */}
      {mainTab === "assistant" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-xl p-1.5 border border-slate-200 shadow-sm w-fit">
            <TabBtn
              active={assistantTab === "calendar"}
              onClick={() => setAssistantTab("calendar")}
            >
              <Calendar className="w-4 h-4 text-teal-600" /> Calendario
            </TabBtn>
            <TabBtn
              active={assistantTab === "requests"}
              onClick={() => setAssistantTab("requests")}
            >
              <Bell className="w-4 h-4 text-teal-600" /> Solicitudes
              {stats.pendingRequests > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {stats.pendingRequests}
                </span>
              )}
            </TabBtn>
          </div>
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            {assistantTab === "calendar" && <AppointmentCalendar />}
            {assistantTab === "requests" && <RequestsPanel />}
          </div>
        </div>
      )}

      {/* ── Vista paciente en Admin ── */}
      {mainTab === "patient" && (
        <>
          <div className="bg-teal-50 backdrop-blur-sm border border-teal-200 rounded-2xl px-6 py-4 text-sm text-teal-800 font-bold mb-6 flex items-center gap-3 shadow-sm">
            <Crown className="w-5 h-5 text-teal-600" />
            Estás viendo la vista del paciente en modo supervisión
            (Administrador)
          </div>
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <PatientCalendar clientId={null} adminMode={true} />
          </div>
        </>
      )}

      {/*Gestión de usuarios desde Admin */}
      {mainTab === "users" && (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Usuarios registrados
            </h2>
            <div className="flex gap-3">
              <button
                onClick={loadUsers}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl px-5 py-2.5 text-sm font-bold transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" /> Actualizar
              </button>
              <button
                onClick={() => {
                  setUserForm({ email: "", password: "", role: "user" });
                  setUserError("");
                  setUserModal("create");
                }}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all shadow-md shadow-teal-600/20 hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" /> Crear usuario
              </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm font-medium">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-bold text-sm">
                No hay usuarios registrados
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Creado
                      </th>
                      <th className="py-4 px-6 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const r = ROLE_LABEL[u.role] ?? ROLE_LABEL.user;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 transition-colors duration-200"
                        >
                          <td className="py-4 px-6 text-slate-700 font-semibold">
                            {u.email}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-xs font-bold px-3 py-1.5 rounded-full ${r.className}`}
                            >
                              {r.text}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-500 text-sm font-medium">
                            {new Date(u.created_at).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveUser({ ...u });
                                  setUserError("");
                                  setUserModal("editRole");
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-slate-600 hover:text-teal-700 text-xs font-bold transition shadow-sm"
                              >
                                <UserCog className="w-3.5 h-3.5" /> Rol
                              </button>
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-500 transition shadow-sm"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modalidades de pago ── */}
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}

      {/* Modal de Usuarios */}
      {userModal && (
        <Modal onClose={closeUserModal}>
          <h3 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">
            {userModal === "create"
              ? "Crear nuevo usuario"
              : "Editar rol de usuario"}
          </h3>

          {userError && (
            <p className="text-rose-600 text-sm mb-5 bg-rose-50 border border-rose-100 p-3 rounded-xl font-medium">
              {userError}
            </p>
          )}

          {userModal === "create" && (
            <>
              <UField
                label="Correo electrónico"
                placeholder="ejemplo@correo.com"
                value={userForm.email}
                onChange={(v) => setUserForm({ ...userForm, email: v })}
              />
              <UField
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={userForm.password}
                onChange={(v) => setUserForm({ ...userForm, password: v })}
              />
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Rol de la cuenta
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm cursor-pointer"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value })
                  }
                >
                  <option value="user">Usuario (Cliente)</option>
                  <option value="assistant">Asistente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3">
                <ABtn
                  onClick={createUser}
                  loading={userLoading}
                  disabled={!userForm.email || !userForm.password}
                >
                  Crear usuario
                </ABtn>
                <AGhost onClick={closeUserModal}>Cancelar</AGhost>
              </div>
            </>
          )}

          {userModal === "editRole" && activeUser && (
            <>
              <div className="mb-8">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                    Usuario seleccionado
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {activeUser.email}
                  </p>
                </div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Nuevo Rol
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm cursor-pointer"
                  value={activeUser.role}
                  onChange={(e) =>
                    setActiveUser({ ...activeUser, role: e.target.value })
                  }
                >
                  <option value="user">Usuario (Cliente)</option>
                  <option value="assistant">Asistente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3">
                <ABtn onClick={updateRole} loading={userLoading}>
                  Guardar cambios
                </ABtn>
                <AGhost onClick={closeUserModal}>Cancelar</AGhost>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Subcomponentes Auxiliares Compartidos ──

function StatCard({ icon: Icon, label, value, color, onClick, clickable }) {
  const colors = {
    teal: "bg-white border-slate-200 text-teal-700 hover:border-teal-300",
    cyan: "bg-white border-slate-200 text-cyan-700 hover:border-cyan-300",
    gradient:
      "bg-teal-50 border-teal-200 text-teal-900 hover:border-teal-400 shadow-teal-100",
    slate: "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`rounded-3xl border p-6 flex items-center gap-5 transition-all duration-300 shadow-sm ${colors[color]} ${
        clickable ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : ""
      }`}
    >
      <div
        className={`p-3.5 rounded-2xl shadow-sm ${color === "gradient" ? "bg-white" : "bg-slate-50"}`}
      >
        <Icon
          className={`w-7 h-7 ${color === "gradient" ? "text-teal-600" : "text-slate-700"}`}
        />
      </div>
      <div>
        <p className="text-3xl font-black text-slate-800 tracking-tight">
          {value}
        </p>
        <p className="text-sm font-semibold text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
        active
          ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-100"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-8 transform transition-all">
        {children}
      </div>
    </div>
  );
}

function UField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
      />
    </div>
  );
}

function ABtn({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 hover:scale-[1.02]"
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}

function AGhost({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl py-3 text-sm font-bold transition-all shadow-sm"
    >
      {children}
    </button>
  );
}
