// Este código define una página de reservas para pacientes (calendario).
"use client"
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PatientCalendar from "../../components/PatientCalendar";
import SearchBar from "../../components/SearchBar";

function BookingContent({ clientId }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  return (
    
    <div className="min-h-screen p-4 md:p-8 w-full flex justify-center">
      
      <div className="w-full max-w-6xl flex flex-col">
        {/* Cabecera */}
    
        <div className="mb-6 md:mb-8 flex flex-col items-center gap-4 md:flex-row md:justify-between w-full">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-teal-800 drop-shadow-md text-center md:text-left">
            Directorio Clínico y Citas
          </h1>
    
          <div className="w-full max-w-sm md:max-w-md md:w-auto flex-1">
            <SearchBar placeholder="Buscar mascota..." />
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {query && (
          <div className="mb-8 md:mb-10 w-full flex flex-col items-center md:items-start">
            <h2 className="text-lg md:text-xl mb-4 font-bold text-teal-700 drop-shadow-sm text-center md:text-left">
              Resultados para:{" "}
              <span className="text-teal-900 font-black">"{query}"</span>
            </h2>

            {/* justify-items-center asegura que la tarjeta se centre en la pantalla del celular */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center md:justify-items-stretch">
              {/* Tarjeta de Mascota: Añadido max-w-sm en móvil para que no se vea desproporcionada */}
              <div className="w-full max-w-sm md:max-w-none rounded-2xl bg-gradient-to-br from-teal-900 to-teal-700 p-5 md:p-6 transition-transform hover:-translate-y-1 shadow-xl border border-teal-950">
                <h2 className="text-lg md:text-xl font-bold text-white text-center md:text-left">
                  Boby
                </h2>
                <p className="text-xs md:text-sm text-gray-200 mt-1 text-center md:text-left">
                  Dueño: Carlos Mendoza
                </p>
                <div className="mt-4 md:mt-5 flex items-center justify-between">
                  <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full shadow-inner">
                    Canino
                  </span>
                  <button className="text-xs md:text-sm text-white hover:text-teal-200 hover:underline font-semibold transition-colors">
                    Ver Historial →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenedor del Calendario */}
        <div className="w-full rounded-2xl border border-gray-200 bg-white/40 p-4 md:p-6 backdrop-blur-md shadow-lg mt-2 md:mt-8 overflow-x-auto flex flex-col items-center md:items-stretch">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-teal-800 text-center md:text-left w-full">
            Agenda de Citas
          </h2>
          {/* Contenedor interno para centrar el calendario si es más pequeño que la caja */}
          <div className="w-full min-w-[280px] max-w-4xl mx-auto">
            <PatientCalendar clientId={clientId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(
        new RegExp("(^| )" + name + "=([^;]+)"),
      );
      return match ? match[2] : null;
    };

    const id = getCookie("user_id");
    if (id) {
      setClientId(parseInt(id));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full gap-4 p-6 text-center">
        <p className="text-gray-600 text-sm md:text-base font-medium max-w-sm">
          Debes iniciar sesión para agendar una cita
        </p>
        <a
          href="/login"
          className="bg-teal-600 hover:bg-teal-800 text-white rounded-xl px-6 py-3 text-sm md:text-base font-bold transition shadow-lg w-full max-w-[200px]"
        >
          Ir al login
        </a>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen w-full">
          <div className="w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingContent clientId={clientId} />
    </Suspense>
  );
}
