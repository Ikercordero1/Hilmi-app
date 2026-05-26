//Historial médico  de asistente, practicamente conserva las mismas carcateristicas que el diseño de administradores
//ya que el componente esta hecho para ambos roles, solo se le cambia el titulo y el rol que se le asigna al componente para mostrar la informacion correspondiente a cada rol
import MedicalHistory from "../../components/shared/MedicalHistory";

export default function MedicalHistoryAssistant() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Historial Médico (Assistente)</h1>

      <MedicalHistory />
    </div>
  );
}
