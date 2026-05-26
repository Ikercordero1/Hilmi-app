//Panel de bienvenida para las personas que ingresen a la plataforma.

"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function landingPage() {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="flex flex-col bg-white min-h-screen w-full items-center">
      {/* Tarjeta de presentación principal de HILMI */}
      <section
        id="bienvenida"
        className="flex flex-col md:flex-row items-center md:items-center justify-center min-h-[80vh] pt-32 px-4 w-full max-w-7xl mx-auto"
      >
        <div className="flex flex-col p-4 text-center md:text-left flex-1 pb-12 md:pb-0">
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-700 bg-clip-text text-transparent text-7xl md:text-9xl font-bold leading-tight">
            HILMI
          </h1>
          <h2 className="font-vollkorn bg-gradient-to-r from-teal-500 via-cyan-600 to-cyan-700 bg-clip-text text-transparent text-xl md:text-2xl font-bold max-w-md mt-4">
            "Una plataforma para registros clínicos y seguimientos en el área de
            veterinarias"
          </h2>

          <Link href="./register">
            <div className="mt-8 flex justify-center md:justify-start">
              <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-teal-500/30">
                Empezar ahora
              </button>
            </div>
          </Link>
        </div>

        <div className="flex-1 flex justify-center items-end self-end">
          <Image
            src="/pets.webp"
            alt="Gatos y perros"
            width={600}
            height={400}
            priority
            className="object-contain drop-shadow-2xl translate-y-2"
          />
        </div>
      </section>

      {/* Tarjeta de presentación con características de Hilmi */}
      <section
        id="proposito"
        className="relative flex flex-col items-center w-full bg-sky-950 py-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M18 10h4v20h-4zM10 18h20v4H10z' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center px-4 mb-16">
          <h2 className="font-vollkorn text-white text-3xl md:text-4xl text-center max-w-2xl font-bold leading-tight">
            ¿Para qué está hecho realmente Hilmi?
          </h2>
          <div className="mt-6 h-1 w-20 bg-teal-500 rounded-full"></div>
        </div>

        {/* Contenedor del Grid */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 justify-items-center">
            {/* Tarjeta 01 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -10 }}
              className="relative flex flex-col z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:bg-white/20"
            >
              <Image
                src="/data.webp"
                alt="Digitalización de datos"
                width={900}
                height={600}
                priority
                className="w-full h-64 object-cover"
              />
              <div className="p-8 md:p-10">
                <div className="text-cyan-400 font-bold mb-4">01</div>
                <h3 className="text-white text-2xl font-bold mb-4">
                  ¡Adiós al papeleo!
                </h3>
                <p className="text-indigo-100/80 leading-relaxed">
                  Digitaliza cada ficha clínica y olvida los archivos físicos
                  para siempre.
                </p>
              </div>
            </motion.div>

            {/* Tarjeta 02 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -10 }}
              className="relative flex flex-col z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:bg-white/20"
            >
              <Image
                src="/historial.webp"
                alt="Gestión de citas"
                width={900}
                height={600}
                priority
                className="w-full h-64 object-cover"
              />
              <div className="p-8 md:p-10">
                <div className="text-cyan-400 font-bold mb-4">02</div>
                <h3 className="text-white text-2xl font-bold mb-4">
                  Citas bajo control
                </h3>
                <p className="text-indigo-100/80 leading-relaxed">
                  Organiza tu agenda de forma inteligente y evita cruces de
                  horarios.
                </p>
              </div>
            </motion.div>

            {/* Tarjeta 03 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -10 }}
              className="relative flex flex-col z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:bg-white/20"
            >
              <Image
                src="/medicinas.webp"
                alt="Historiales médicos"
                width={900}
                height={600}
                priority
                className="w-full h-64 object-cover"
              />
              <div className="p-8 md:p-10">
                <div className="text-cyan-400 font-bold mb-4">03</div>
                <h3 className="text-white text-2xl font-bold mb-4">
                  Historiales al instante
                </h3>
                <p className="text-indigo-100/80 leading-relaxed">
                  Accede a la información de tus pacientes en segundos desde
                  cualquier lugar.
                </p>
              </div>
            </motion.div>
          </div>{" "}
          {/* Cierre del Grid */}
        </div>
      </section>

      {/* Sección de Social Proof o Testimonios */}
      <section
        id="testimonios"
        className="relative w-full bg-sky-950 py-24 border-t border-white/5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="container mx-auto px-4">
          {/* Título de la sección */}
          <div className="text-center mb-16">
            <h2 className="font-vollkorn text-white text-3xl md:text-5xl font-bold mb-4">
              Con la confianza de expertos
            </h2>
            <p className="text-teal-400 font-medium tracking-widest uppercase text-sm">
              Lo que dicen los veterinarios sobre Hilmi
            </p>
          </div>

          {/* Grid de Testimonios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonio 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-teal-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-indigo-100/90 italic mb-8 leading-relaxed">
                "Hilmi ha transformado la forma en que manejamos nuestras fichas
                médicas. El ahorro de tiempo es increíble y la interfaz es
                sumamente intuitiva."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold border-2 border-white/20">
                  DR
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">
                    Dr. Roberto Méndez
                  </h4>
                  <span className="text-teal-500 text-xs uppercase tracking-wider">
                    Clínica San Roque
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Testimonio 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-teal-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-indigo-100/90 italic mb-8 leading-relaxed">
                "La gestión de citas ya no es un caos. Me encanta la seguridad
                con la que se manejan los datos de mis pacientes. Muy
                recomendado."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold border-2 border-white/20">
                  DRA
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">
                    Dra. Lucía Fernández
                  </h4>
                  <span className="text-teal-500 text-xs uppercase tracking-wider">
                    Especialista Felina
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Testimonio 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-teal-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-indigo-100/90 italic mb-8 leading-relaxed">
                "Poder acceder al historial médico desde mi tablet en cualquier
                parte de la clínica es vital. Hilmi es la herramienta que
                necesitábamos."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold border-2 border-white/20">
                  DR
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">
                    Dr. Carlos Paéz
                  </h4>
                  <span className="text-teal-500 text-xs uppercase tracking-wider">
                    Centro Veterinario VetPro
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sección de Precios */}
      <section
        id="precios"
        className="relative w-full bg-sky-950 py-24 px-4 overflow-hidden"
      >
        {/* Decoración de fondo (Círculos difusos) */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-vollkorn text-white text-4xl md:text-5xl font-bold mb-4">
              Planes que crecen con tu clínica
            </h2>
            <p className="text-indigo-100/60 max-w-xl mx-auto">
              Elige la opción que mejor se adapte al volumen de tus pacientes.
              Sin contratos ocultos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Básico */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 flex flex-col"
            >
              <h3 className="text-white text-xl font-bold mb-2">Esencial</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$10</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-indigo-100/80 text-sm">
                  <svg
                    className="w-5 h-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Hasta 50 registros clínicos
                </li>
                <li className="flex items-center gap-3 text-indigo-100/80 text-sm">
                  <svg
                    className="w-5 h-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Gestión de citas básica
                </li>
                <li className="flex items-center gap-3 text-indigo-100/80 text-sm">
                  <svg
                    className="w-5 h-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  1 usuario administrador
                </li>
              </ul>
              <button className="w-full py-3 rounded-full border border-teal-500/50 text-teal-400 font-bold hover:bg-teal-500/10 transition-all">
                Empezar gratis
              </button>
            </motion.div>

            {/* Plan Profesional - DESTACADO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl border-2 border-teal-500 rounded-3xl p-8 flex flex-col transform md:scale-105 shadow-2xl shadow-teal-900/20"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                Recomendado
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Profesional</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-indigo-100/40 text-sm">/mes</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-white text-sm">
                  <svg
                    className="w-5 h-5 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Registros ilimitados
                </li>
                <li className="flex items-center gap-3 text-white text-sm">
                  <svg
                    className="w-5 h-5 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Recordatorios por correo
                </li>
                <li className="flex items-center gap-3 text-white text-sm">
                  <svg
                    className="w-5 h-5 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Hasta 5 usuarios
                </li>
                <li className="flex items-center gap-3 text-white text-sm">
                  <svg
                    className="w-5 h-5 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Soporte prioritario
                </li>
              </ul>
              <button className="w-full py-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-700 text-white font-bold shadow-lg shadow-teal-500/30 hover:brightness-110 transition-all">
                Prueba gratuita de 14 días
              </button>
            </motion.div>

            {/* Plan Clínica */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 flex flex-col"
            >
              <h3 className="text-white text-xl font-bold mb-2">Clínica</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$59</span>
                <span className="text-indigo-100/40 text-sm">/mes</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-indigo-100/80 text-sm">
                  <svg
                    className="w-5 h-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Múltiples sucursales
                </li>
                <li className="flex items-center gap-3 text-indigo-100/80 text-sm">
                  <svg
                    className="w-5 h-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Usuarios ilimitados
                </li>
                <li className="flex items-center gap-3 text-indigo-100/80 text-sm">
                  <svg
                    className="w-5 h-5 text-teal-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Integración de estadisticas epistemológicas
                </li>
              </ul>
              <button className="w-full py-3 rounded-full border border-teal-500/50 text-teal-400 font-bold hover:bg-teal-500/10 transition-all">
                Contactar ventas
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
