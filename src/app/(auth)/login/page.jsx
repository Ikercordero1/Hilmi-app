"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Requisitos de contraseña fuera del componente
const passwordRequirements = [
  { id: 1, label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { id: 2, label: "Una letra mayúscula", test: (pw) => /[A-Z]/.test(pw) },
  { id: 3, label: "Al menos un número", test: (pw) => /\d/.test(pw) },
  {
    id: 4,
    label: "Carácter especial (@$.!%*?&)",
    test: (pw) => /[@$.!%*?&]/.test(pw),
  },
];

// Componentes principales de la página de login
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  //Requisitos obligatorios para el usuario en caso de falta de datos
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email === "" || password === "") {
      alert("Por favor, debe llenar los campos requeridos para ingresar");
      return;
    }

    const allMet = passwordRequirements.every((req) => req.test(password));
    if (!allMet) {
      alert(
        "La contraseña no cumple con los requisitos de seguridad de Hilmi.",
      );
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(data.redirectTo);
      } else {
        alert(data.message || "Algo salió mal");
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      alert("No se pudo conectar con el servidor.");
    }
  };

  // Variantes para animaciones del lado izquierdo del login
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* SECCIÓN IZQUIERDA */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-16 overflow-hidden bg-slate-800">
        <Image
          src="/manchis.webp"
          alt="Mascotas"
          fill
          priority
          className="object-cover opacity-50 mix-blend-overlay"
        />

        {/* Overlays decorativos parte del fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-slate-950/90 z-10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] z-0" />

        {/* Header Superior Izquierdo, titulo de Hilmi */}
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
          <motion.div variants={itemVariants} className="mb-6">
            <span className="text-teal-400 text-sm font-bold uppercase tracking-[0.3em] bg-teal-400/10 px-4 py-2 rounded-full border border-teal-400/20">
              Bienvenido de vuelta
            </span>
          </motion.div>
          {/*titulo principal con efecto de aparición*/}
          <motion.h1
            variants={itemVariants}
            className="text-6xl xl:text-7xl font-black text-white leading-none tracking-tight"
          >
            Cuidar es <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              hacerlo simple.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-slate-400 mt-8 text-lg font-medium max-w-md leading-relaxed"
          >
            La plataforma inteligente que conecta la pasión veterinaria con una
            gestión clínica impecable.
          </motion.p>

          <motion.div variants={itemVariants} className="flex gap-3 mt-10">
            <div className="h-1.5 w-12 bg-teal-500 rounded-full" />
            <div className="h-1.5 w-4 bg-slate-700 rounded-full" />
            <div className="h-1.5 w-4 bg-slate-700 rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/* SECCIÓN DERECHA: FORMULARIO */}
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
          <div className="mb-10">
            <div className="text-teal-600 font-black text-3xl mb-1 tracking-tighter">
              HILMI
            </div>
            <h2 className="text-slate-900 text-3xl font-bold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              ¿Aún no tienes cuenta?{" "}
              <Link
                href="/register"
                className="text-teal-600 font-bold hover:text-teal-700 transition-all"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="block text-slate-800 text-xs font-bold uppercase tracking-widest ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-4 text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                placeholder="nombre@ejemplo.com"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-slate-800 text-xs font-bold uppercase tracking-widest ml-1">
                  Contraseña
                </label>
                <Link
                  href="#"
                  className="text-xs text-teal-600 font-bold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onFocus={() => setShowRequirements(true)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-4 pr-12 text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
                  placeholder="••••••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.483 8.613 7.641 4.438 12 4.438s8.517 4.175 9.964 7.24c.066.14.066.301 0 .441-1.487 3.066-5.645 7.24-9.964 7.24s-8.517-4.175-9.964-7.24Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
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
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 ml-1">
                      {passwordRequirements.map((req) => {
                        const isMet = req.test(password);
                        return (
                          <div
                            key={req.id}
                            className={`flex items-center gap-2 text-[11px] font-bold transition-colors duration-300 ${isMet ? "text-teal-600" : "text-slate-400"}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${isMet ? "bg-teal-500 border-teal-500 text-white" : "border-slate-300 text-transparent"}`}
                            >
                              <svg
                                className="w-2.5 h-2.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-900 text-white py-5 rounded-xl font-bold text-lg hover:bg-teal-700 transform transition-all duration-300 mt-4 shadow-lg active:scale-95"
            >
              Ingresar
            </button>
          </form>

          {/* Botón de volver */}
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
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
