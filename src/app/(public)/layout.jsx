//Layout para la página publica con un loader de 3 segundos antes de mostrar el contenido. El loader se muestra mientras isLoading es true, y después de 3 segundos se establece en false para mostrar el contenido.

"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Loader from "../components/loader";

export default function PublicLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Loader isLoading={isLoading} />

      <Header />
      {children}
    </>
  );
}
