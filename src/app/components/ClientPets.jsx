"use client";
import { useState } from "react";

export default function ClientPets() {
  const [cedula, setCedula] = useState("");
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Estados para el formulario de vacunas
  const [activePetId, setActivePetId] = useState(null);
  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");
  const [savingVaccine, setSavingVaccine] = useState(false);

  // Busca el historial por cédula
  const buscarMascotas = async (e) => {
    e.preventDefault();
    if (!cedula) return;

    setLoading(true);
    setError("");
    setPets([]);
    setActivePetId(null); // Cerramos cualquier formulario abierto

    try {
      const response = await fetch(`/api/client-pets?cedula=${cedula}`);
      const data = await response.json();

      if (response.ok) {
        setPets(data.pets || []);
        if (data.pets?.length === 0) {
          setError("No se encontraron pacientes para esta cédula.");
        }
      } else {
        setError(data.error || "Ocurrió un error en la búsqueda.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Envía la nueva vacuna a tu api/vaccines
  const registrarVacuna = async (e, petId) => {
    e.preventDefault();
    if (!vaccineName || !vaccineDate) return;

    setSavingVaccine(true);

    // Creamos el FormData porque tu API lo requiere así
    const formData = new FormData();
    formData.append("pet_id", petId);
    formData.append("name", vaccineName);
    formData.append("application_date", vaccineDate);
    // formData.append("proof", archivo); // <- Descomentar cuando manejes archivos

    try {
      const response = await fetch("/api/vaccines", {
        method: "POST",
        body: formData, // Enviamos FormData, no JSON
      });

      const data = await response.json();

      if (response.ok) {
        // Actualizamos la lista de vacunas en la pantalla sin tener que recargar todo
        setPets((prevPets) =>
          prevPets.map((pet) => {
            if (pet.id === petId) {
              return {
                ...pet,
                vaccines: [...(pet.vaccines || []), data],
              };
            }
            return pet;
          }),
        );

        // Limpiamos el formulario
        setVaccineName("");
        setVaccineDate("");
        setActivePetId(null);
        alert("¡Vacuna registrada con éxito!");
      } else {
        alert(data.error || "Error al registrar la vacuna.");
      }
    } catch (error) {
      alert("Error de red al guardar la vacuna.");
    } finally {
      setSavingVaccine(false);
    }
  };

  return (
    <div className="mt-6 w-full max-w-4xl mx-auto">
      {/* Buscador */}
      <form onSubmit={buscarMascotas} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ingresa tu cédula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          className="border border-gray-300 p-2 rounded w-full md:w-1/2 text-black"
        />
        <button
          type="submit"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? "Buscando..." : "Buscar Tarjetero"}
        </button>
      </form>

      {/* Mensajes de error */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="border border-teal-200 p-5 rounded-lg shadow-md bg-white text-gray-800"
          >
            <h2 className="text-xl font-bold text-teal-800 capitalize">
              {pet.pet_name}
            </h2>
            <p>
              <span className="font-semibold">Especie:</span> {pet.species}
            </p>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 border-b pb-1 mb-2">
                Historial de Vacunas
              </h3>
              {pet.vaccines && pet.vaccines.length > 0 ? (
                <ul className="list-disc list-inside text-sm mb-4">
                  {pet.vaccines.map((vacuna, index) => (
                    <li key={index} className="mb-1">
                      <span className="font-medium">{vacuna.name}</span> -{" "}
                      {vacuna.application_date}
                      {vacuna.note === "Autodeclarada" && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          Reportada por cliente
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic mb-4">
                  No hay vacunas registradas.
                </p>
              )}
            </div>

            {/* Botón y Formulario para añadir vacuna */}
            {activePetId === pet.id ? (
              <form
                onSubmit={(e) => registrarVacuna(e, pet.id)}
                className="mt-4 bg-gray-50 p-3 rounded border"
              >
                <h4 className="text-sm font-bold mb-2">
                  Registrar nueva vacuna
                </h4>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la vacuna (ej. Rabia)"
                    value={vaccineName}
                    onChange={(e) => setVaccineName(e.target.value)}
                    className="border p-1 rounded text-sm text-black"
                    required
                  />
                  <input
                    type="date"
                    value={vaccineDate}
                    onChange={(e) => setVaccineDate(e.target.value)}
                    className="border p-1 rounded text-sm text-black"
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={savingVaccine}
                      className="bg-teal-600 text-white text-sm px-3 py-1 rounded w-full"
                    >
                      {savingVaccine ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePetId(null)}
                      className="bg-gray-300 text-gray-800 text-sm px-3 py-1 rounded w-full"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setActivePetId(pet.id)}
                className="w-full mt-2 text-sm text-teal-700 font-semibold border border-teal-700 py-1.5 rounded hover:bg-teal-50 transition"
              >
                + Reportar Vacuna
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
