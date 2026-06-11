// El componente StockAdminPage es la página principal para la gestión del inventario desde la perspectiva del administrador.
// Aquí se muestra un título y se incluye el componente StockManager, que es responsable de manejar todas las funcionalidades
// relacionadas con el inventario, como agregar, editar y eliminar productos, esta página proporciona
// una interfaz centralizada para que los administradores puedan gestionar eficientemente el stock de productos en la aplicación.
import StockManager from "../../components/StockManager";

export default function StockAdminPage() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-teal-800 mb-4">Vista (Admin)</h1>

      <StockManager />
    </div>
  );
}
