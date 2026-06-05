//En esta página se muestra el inventario desde la perspectiva del asistente, utilizando el componente StockManager 
// para gestionar y visualizar los productos disponibles.
import Stock from "../../components/StockManager";

export default function StockAssistantPage() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4 text-teal-800 ">
        Inventario (Vista de Asistente)
      </h1>

      <Stock />
    </div>
  );
}
