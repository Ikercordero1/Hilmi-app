//Barra de busqueda integrada en el paciente. Permite filtrar por nombre de dueño o mascota,
//  actualizando la URL con el término de búsqueda.
"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

export default function SearchBar({ placeholder }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const timeoutRef = useRef(null);

  const handleSearch = (term) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (term) {
        params.set("query", term);
      } else {
        params.delete("query");
      }

      replace(`${pathname}?${params.toString()}`);
    }, 300);
  };

  return (
    
    <div className="relative flex flex-1 w-full">
      <label htmlFor="search" className="sr-only">
        Buscar dueño o mascota
      </label>

      <input
        id="search"
        type="text"
      
        className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 md:px-5 md:py-3 text-sm md:text-base text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30 shadow-sm"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString()}
      />
    </div>
  );
}
