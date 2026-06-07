// Ruta: src/app/historial/page.jsx (o el nombre de la carpeta donde lo tengas)
import ClientPets from "../../components/ClientPets";

export default function MyPets() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 mt-8">
      {/* Encabezado de la página */}
      <h1 className="text-3xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-900">
        Bienvenido a tu tarjetero de mascotas
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Ingresa tu número de cédula para consultar el historial médico y las vacunas de tus mascotas.
      </p>

      {/* Componente principal que maneja la búsqueda y los resultados */}
      <ClientPets />
    </div>
  );
}