// Layout de pacientes o contenido principal.
import Sidebar from "../components/SidebarPatient";

export default function PatientsLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0 bg-[#e6f4f6]" />

      <div className="fixed inset-0 z-0 bg-linear-to-r from-[#074652]/20 via-transparent to-transparent" />

      <div
        className="fixed inset-0 z-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='25' height='25' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 19V10h2v9h9v2h-9v9h-2v-9h-9v-2h9z' fill='%230891b2'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="fixed -top-24 left-1/4 w-150 h-150 z-0 bg-cyan-300/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed -bottom-20 right-0 w-175 h-175 z-0 bg-teal-400/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="fixed inset-0 z-0 bg-linear-to-tr from-cyan-100/50 via-transparent to-white/30 pointer-events-none" />

      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />

        <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
