//El panel de administración es una sección exclusiva para los administradores de la plataforma, donde pueden gestionar 
// y supervisar diversos aspectos del sistema. Aquí, los administradores pueden acceder a herramientas y funcionalidades que les permiten controlar
//  el contenido, los usuarios, las configuraciones y otros elementos clave de la plataforma. El diseño del panel de administración está pensado para ser intuitivo y eficiente, 
// facilitando la navegación y el acceso a las funciones necesarias para mantener el buen funcionamiento de la plataforma. 
import AdminDashboard from "../../components/AdminDashboard";

export const metadata = {
  title: "Panel de Administración | Hilmi",
  description: "Gestión administrativa de la plataforma",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50  rounded-3xl relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-teal-100/50 rounded-full mix-blend-multiply blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-cyan-100/50 rounded-full mix-blend-multiply blur-3xl opacity-70 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <AdminDashboard />
      </div>
    </main>
  );
}
