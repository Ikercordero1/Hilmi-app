//Layout del home para administradores, caracteristicas generales que se mantendran en el diseño.
import Sidebar from "../components/SidebarAdmin";

export default function DashboardLayout({ children }) {
  return (
    <div className="relative min-h-screen flex">
      <div className="fixed inset-0 -z-10 bg-[#e6f4f6]" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-[#074652]/20 via-transparent to-transparent" />
      <div
        className="fixed inset-0 -z-10 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='25' height='25' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 19V10h2v9h9v2h-9v9h-2v-9h-9v-2h9z' fill='%230891b2'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="fixed -top-24 left-1/4 w-[600px] h-[600px] -z-10 bg-cyan-300/40 blur-[120px] rounded-full" />
      <div className="fixed -bottom-20 right-0 w-[700px] h-[700px] -z-10 bg-teal-400/30 blur-[100px] rounded-full" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-tr from-cyan-100/50 via-transparent to-white/30" />

      <Sidebar />

      <main className="flex-1 lg:ml-64 items-center justify-center min-h-screen">
        <div className="p-6 lg:p-12">{children}</div>
      </main>
    </div>
  );
}
