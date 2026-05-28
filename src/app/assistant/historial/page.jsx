//Historial médico  de asistente, practicamente conserva las mismas carcateristicas que el diseño de administradores
//ya que el componente esta hecho para ambos roles, solo se le cambia el titulo y el rol que se le asigna al componente para mostrar la informacion correspondiente a cada rol
import MedicalHistory from "../../components/MedicalHistory";

export default function MedicalHistoryAssistant() {
  return (
    <div className="w-full  flex flex-col bg-white/70 transparent border/20 shadow-lg p-6 rounded-lg backdrop-blur-md opacity-100">
      <h1 className="text-2xl font-bold text-transparent shadow-md-text bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text mb-4">
        Historial Médico
         (Assistente)
      </h1>

      <MedicalHistory />
    </div>
  );
}
