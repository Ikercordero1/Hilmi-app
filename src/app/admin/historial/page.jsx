//Página del historial médico para el admin, muestra el 
// historial de todos los pacientes (mascotas) enlazada con un componente
import MedicalHistory from "../../components/MedicalHistory";

export default function MedicalHistoryAdmin() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-900">
        Vista (Admin)
      </h1>

      <MedicalHistory />
    </div>
  );
}
