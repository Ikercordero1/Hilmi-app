//SIDEBAR ADMIN CON ANIMACIONES Y MEJORAS DE UX
"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, LayoutGroup } from "framer-motion"; 
import {
  Home,
  Settings,
  User,
  Package,
  PieChart,
  Dog,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: <Home />, label: "Dashboard", href: "/admin/home" },
    { icon: <Dog />, label: "Medical history", href: "/admin/historial" },
    { icon: <PieChart />, label: "Stats", href: "/admin/stats" },
    { icon: <Package />, label: "Stock", href: "/admin/stock" },
    { icon: <User />, label: "Reportes", href: "/admin/reportes" },
  ];

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-[100dvh] text-white overflow-hidden border-r border-cyan-400/20 shadow-2xl transition-all duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
          ${isCollapsed ? "md:w-20" : "md:w-72"}`}
      >
        {/* CAPA DE FONDO */}
        <div className="absolute inset-0 -z-10 bg-[#074652]">
          <div className="absolute -top-20 -left-20 w-full h-[60%] bg-cyan-400/30 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-full h-[50%] bg-teal-400/20 blur-[80px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/50 via-transparent to-cyan-400/10" />
        </div>

        {/* HEADER */}
        <div
          className={`p-6 mb-2 flex items-center justify-between ${isCollapsed ? "flex-col gap-4" : ""}`}
        >
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                HILMI
              </h1>
              <div className="bg-teal-400 h-2 w-16 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
            </motion.div>
          ) : (
            <div className="text-2xl font-black text-teal-400 italic">H.</div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block text-cyan-200 hover:text-white transition-colors"
          >
            {isCollapsed ? <Menu size={24} /> : <ChevronLeft size={26} />}
          </button>
        </div>

        {/* NAVEGACIÓN DINÁMICA */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <LayoutGroup>
            {menuItems.map((item) => (
              <NavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={pathname === item.href}
                isCollapsed={isCollapsed}
              />
            ))}
          </LayoutGroup>
        </nav>

        {/* SECCIÓN INFERIOR */}
        <div
          className={`mt-auto flex flex-col p-4 gap-4 pb-8 ${isCollapsed ? "items-center" : ""}`}
        >
          <div className="pt-4 border-t border-white/10 w-full">
            <NavItem
              icon={<Settings />}
              label="Configuración"
              href="/settings"
              active={pathname === "/settings"}
              isCollapsed={isCollapsed}
            />
          </div>

          <Link href="/" className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full bg-teal-500 rounded-xl font-extrabold flex items-center justify-center hover:bg-teal-400 transition-colors shadow-lg ${
                isCollapsed
                  ? "h-12 w-12"
                  : "py-4 gap-3 text-sm uppercase tracking-widest"
              }`}
            >
              {!isCollapsed && <span>Cerrar Sesión</span>}
            </motion.button>
          </Link>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ icon, label, href, active, isCollapsed }) => (
  <Link href={href} className="block relative">
    <motion.div
      whileHover={{ x: isCollapsed ? 0 : 5 }}
      whileTap={{ scale: 0.97 }}
      className={`group flex items-center rounded-xl cursor-pointer transition-colors duration-300 relative
        ${isCollapsed ? "justify-center h-12 w-12 mx-auto px-0" : "px-5 py-4 gap-4"}
        ${active ? "text-white" : "text-cyan-100/70 hover:text-white"}`}
    >
      {/* Indicador de fondo animado (La pastilla deslizante) */}
      {active && (
        <motion.div
          layoutId="activePill"
          className="absolute inset-0 bg-white/15 border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      {/* Ícono animado */}
      <motion.div
        animate={{
          scale: active ? 1.15 : 1,
          rotate: active ? [0, -5, 5, 0] : 0,
        }}
        className={`transition-colors shrink-0 ${
          active
            ? "text-teal-300"
            : "text-cyan-200/40 group-hover:text-teal-300"
        }`}
      >
        {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
      </motion.div>

      {/* Texto */}
      {!isCollapsed && (
        <span
          className={`text-sm font-bold tracking-tight transition-opacity duration-300 ${active ? "opacity-100" : "opacity-80"}`}
        >
          {label}
        </span>
      )}
    </motion.div>
  </Link>
);

export default Sidebar;
