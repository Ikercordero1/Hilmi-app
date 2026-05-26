"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
// Requisitos de contraseña con funciones de prueba
const passwordRequirements = [
  { id: 1, label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { id: 2, label: "Una letra mayúscula", test: (pw) => /[A-Z]/.test(pw) },
  { id: 3, label: "Al menos un número", test: (pw) => /\d/.test(pw) },
  {
    id: 4,
    label: "Especial (@$!%*?&.#)",
    test: (pw) => /[@$!%*?&.#\-_]/.test(pw),
  },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const router = useRouter();

  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      alert("Por favor, completa todos los campos");
      return;
    }

    const allMet = passwordRequirements.every((req) => req.test(password));
    if (!allMet) {
      alert("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/login");
      } else {
        const data = await response.json();
        alert(data.message || "Error al registrar");
      }
    } catch (error) {
      alert("Error de conexión con el servidor");
    }
  };
  // Variantes para animar el contenedor de la izquierda
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden">
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-16 overflow-hidden bg-slate-800">
        <Image
          src="/timin.webp"
          alt="Mascotas"
          fill
          priority
          className="object-cover opacity-50 mix-blend-overlay"
        />

        {/* Overlays para el fondo decorativos */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-slate-950/90 z-10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] z-0" />

        {/* Header Superior Izquierdo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-20 flex items-center gap-2"
        >
          <span className="text-white font-black text-xl tracking-tighter">
            HILMI
          </span>
        </motion.div>

        {/* Contenido Central/Inferior */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-20"
        >
          <motion.div variants={containerVariants} className="mb-6">
            <span className="text-teal-400 text-sm font-bold uppercase tracking-[0.3em] bg-teal-400/10 px-4 py-2 rounded-full border border-teal-400/20">
              ¿Nuevo por aquí?
            </span>
          </motion.div>

          <motion.h1
            variants={containerVariants}
            className="text-6xl xl:text-7xl font-black text-white leading-none tracking-tight"
          >
            Agenda citas <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              de manera sencilla.
            </span>
          </motion.h1>

          <motion.p
            variants={containerVariants}
            className="text-slate-400 mt-8 text-lg font-medium max-w-md leading-relaxed"
          >
            ¡El software de gestión que simplifica los datos clínicos de tu
            amada mascota!
          </motion.p>

          <motion.div variants={containerVariants} className="flex gap-3 mt-10">
            <div className="h-1.5 w-12 bg-teal-500 rounded-full" />
            <div className="h-1.5 w-4 bg-slate-700 rounded-full" />
            <div className="h-1.5 w-4 bg-slate-700 rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/*Sección de la Derecha*/}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-white">
        <div
          className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 19V10h2v9h9v2h-9v9h-2v-9h-9v-2h9z' fill='%23000000'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Efectos de aparición para la carta/formulario de datos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <div className="mb-8">
            <div className="text-teal-600 font-black text-3xl mb-1 tracking-tighter">
              HILMI
            </div>
            <h2 className="text-slate-900 text-3xl font-bold tracking-tight">
              Crea tu cuenta
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              ¿Ya eres miembro?{" "}
              <Link
                href="/login"
                className="text-teal-600 font-bold hover:text-teal-700 transition-all"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>

          {/* Aviso de rol */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
            <span className="text-lg">🐾</span>
            <div>
              <p className="text-xs font-bold text-teal-800">
                Cuenta de paciente
              </p>
              <p className="text-xs text-teal-600">
                Al registrarte tendrás acceso para agendar citas para tu
                mascota. Si eres parte del equipo clínico, contacta al
                administrador.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Correo */}
            <div className="space-y-1.5">
              <label className="block text-slate-800 text-xs font-bold uppercase tracking-widest ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3.5 text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                placeholder="tu@email.com"
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-slate-800 text-xs font-bold uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onFocus={() => setShowRequirements(true)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-3.5 pr-12 text-slate-800 focus:border-teal-500 transition-all outline-none"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 p-1"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L3 3m11.72 11.72L21 21"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showRequirements && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-2 pt-1 ml-1"
                  >
                    {passwordRequirements.map((req) => (
                      <div
                        key={req.id}
                        className={`flex items-center gap-1.5 text-[10px] font-bold ${req.test(password) ? "text-teal-600" : "text-slate-400"}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${req.test(password) ? "bg-teal-500 border-teal-500 text-white" : "border-slate-300 text-transparent"}`}
                        >
                          <svg
                            className="w-2 h-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="4"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        {req.label}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <label className="block text-slate-800 text-xs font-bold uppercase tracking-widest ml-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-50 border-2 rounded-xl px-5 py-3.5 text-slate-800 outline-none transition-all ${
                  confirmPassword === ""
                    ? "border-slate-100"
                    : passwordsMatch
                      ? "border-teal-500 ring-4 ring-teal-500/10"
                      : "border-red-500 ring-4 ring-red-500/10"
                }`}
                placeholder="Repite tu contraseña"
              />
              {confirmPassword !== "" && !passwordsMatch && (
                <p className="text-[10px] text-red-500 font-extrabold ml-1 uppercase tracking-tighter">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-600 transform transition-all duration-300 mt-4 shadow-lg active:scale-95"
            >
              Registrarse ahora
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-slate-400 text-sm font-semibold hover:text-teal-600 transition-colors inline-flex items-center gap-2"
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
                  strokeWidth="2.5"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver a la página principal
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
