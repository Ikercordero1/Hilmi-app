//Header con menú responsive y animaciones usando Framer Motion.
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
// Componente Header con menú responsive y animaciones
export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-lg border-b border-white/20">
      <nav className="container mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-teal-500 font-bold text-2xl cursor-pointer"
        >
          HILMI
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center text-white/80 font-medium">
          <a href="/panel1" className="text-teal-400 transition-colors">
            Inicio
          </a>
          <a href="/panel2" className="text-teal-400 transition-colors">
            Funciones
          </a>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all flex items-center"
            >
              Iniciar sesión
            </Link>

            <Link href="/register">
              <button className="relative p-[2px] rounded-full bg-gradient-to-r from-teal-600 to-cyan-700 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 group">
                <div className="bg-white px-4 py-2 rounded-full transition-all duration-300 group-hover:bg-opacity-90">
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-700 bg-clip-text text-transparent font-bold text-sm">
                    Registrarse
                  </span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-teal-500 p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-sky-950/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col gap-6 p-8 items-center text-white font-medium">
              <a
                href="bienvenida"
                onClick={() => setIsOpen(false)}
                className="text-xl"
              >
                Inicio
              </a>
              <a
                href="proposito"
                onClick={() => setIsOpen(false)}
                className="text-xl"
              >
                Funciones
              </a>
              <hr className="w-full border-white/10" />

              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-700 text-white py-3 rounded-full font-bold text-center hover:brightness-110 transition-all"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full border-2 text-center border-teal-500 text-teal-400 py-3 rounded-full font-bold"
              >
                Registrarse
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
