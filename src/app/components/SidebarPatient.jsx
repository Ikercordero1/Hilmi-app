//Sidebar para pacientes.
"use client";
import React, { useState } from "react";
import {
  Calendar,
  Settings,
  Dog,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); // Móvil
  const [isCollapsed, setIsCollapsed] = useState(false); // Escritorio

  return (
    <>
      {/* BOTÓN FLOTANTE MÓVIL */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 right-4 z-40 p-2.5 rounded-xl bg-[#074652] border border-cyan-400/20 text-white shadow-lg md:hidden transition-all duration-300 hover:bg-teal-600 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Menu size={24} />
      </button>

      {/* OVERLAY FONDO OSCURO */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-[100dvh] text-white overflow-hidden border-r border-cyan-400/20 shadow-2xl transition-all duration-300 ease-in-out
        ${isCollapsed ? "md:w-20" : "md:w-72"}
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* CAPA DE FONDO DECORATIVA */}
        <div className="absolute inset-0 -z-10 bg-[#074652]">
          <div className="absolute -top-20 -left-20 w-full h-[60%] bg-cyan-400/30 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-full h-[50%] bg-teal-400/20 blur-[80px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/50 via-transparent to-cyan-400/10" />
        </div>

        {/* HEADER */}
        <div
          className={`flex items-center p-6 mb-2 transition-all duration-300 ${isCollapsed ? "flex-col gap-4 justify-center" : "justify-between"}`}
        >
          {/* Logo Adaptativo */}
          {!isCollapsed ? (
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic drop-shadow-md">
                HILMI
              </h1>
              <div className="bg-teal-400 h-1.5 w-12 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
            </div>
          ) : (
            <div className="text-2xl font-black text-teal-400 italic">H.</div>
          )}

          <div className="flex items-center">
            {/* TOGGLE DESKTOP */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-xl text-cyan-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isCollapsed ? <Menu size={22} /> : <ChevronLeft size={24} />}
            </button>
            {/* CERRAR MÓVIL */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden text-cyan-200 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <NavItem
            icon={<Calendar />}
            label="Calendario"
            active
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Dog />}
            label="Mis Mascotas"
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<Bell />}
            label="Notificaciones"
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* SECCIÓN INFERIOR */}
        <div
          className={`mt-auto flex flex-col p-4 gap-4 pb-8 ${isCollapsed ? "items-center" : ""}`}
        >
          <div
            className={`pt-4 border-t border-white/10 w-full ${isCollapsed ? "flex justify-center" : ""}`}
          >
            <NavItem
              icon={<Settings />}
              label="Configuración"
              isCollapsed={isCollapsed}
            />
          </div>

          <Link href="/" className="w-full">
            <button
              title={isCollapsed ? "Cerrar Sesión" : ""}
              className={`w-full bg-teal-500 text-white flex items-center justify-center rounded-xl font-extrabold hover:bg-cyan-400 transition-all duration-300 shadow-lg active:scale-95 border border-white/10 group
                ${isCollapsed ? "h-12 w-12 mx-auto px-0" : "py-4 px-5 gap-3 text-sm uppercase tracking-widest"}`}
            >
              <LogOut
                size={18}
                strokeWidth={3}
                className={`transition-transform flex-shrink-0 ${!isCollapsed && "group-hover:-translate-x-1"}`}
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap transition-opacity duration-300">
                  Cerrar Sesión
                </span>
              )}
            </button>
          </Link>
        </div>
      </aside>
    </>
  );
};

// Sub-componente NavItem optimizado
const NavItem = ({ icon, label, active = false, isCollapsed }) => (
  <div
    title={isCollapsed ? label : ""}
    className={`group flex items-center rounded-xl cursor-pointer transition-all duration-200
    ${isCollapsed ? "justify-center h-12 w-12 mx-auto px-0" : "px-5 py-4 gap-4"}
    ${
      active
        ? "bg-white/15 text-white border border-white/10 shadow-inner"
        : "text-cyan-100/70 hover:bg-white/5 hover:text-white"
    }`}
  >
    <div
      className={`flex-shrink-0 transition-colors duration-200 ${
        active ? "text-teal-300" : "text-cyan-200/40 group-hover:text-teal-300"
      }`}
    >
      {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    </div>

    {!isCollapsed && (
      <span
        className={`text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
          active ? "opacity-100" : "opacity-80"
        }`}
      >
        {label}
      </span>
    )}
  </div>
);

export default Sidebar;
