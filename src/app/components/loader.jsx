//Este componente muestra una animación de carga con un perro corriendo,
// Nota: Este Loader es un homenaje a mi perrito "Frankie" de el en parte se
//  tomo la inspiración para realizar el proyecto <3.

"use client";
import { useState, useEffect } from "react";
export default function Loader({ isLoading }) {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  const totalFrames = 8;
  const animationSpeed = 120;

  useEffect(() => {
    // 1. Precarga de imágenes para evitar parpadeos
    for (let i = 1; i <= totalFrames; i++) {
      const img = new window.Image();
      img.src = `/auths/${i}.png`;
    }

    // 2. Lógica de animación del perro
    let frame = 1;
    const animationInterval = setInterval(() => {
      frame = (frame % totalFrames) + 1;
      setCurrentFrame(frame);
    }, animationSpeed);

    //  Si el componente se desmonta
    return () => clearInterval(animationInterval);
  }, []);

  // 3. Lógica para desaparecer suavemente
  useEffect(() => {
    if (!isLoading) {
      setFade(true);

      const timer = setTimeout(() => {
        setShow(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 w-screen h-lvh bg-cyan-800 flex flex-col justify-center items-center z-[9999] transition-opacity duration-500 ease-in-out ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={`/auths/${currentFrame}.png`}
        alt="Cargando sistema..."
        className="w-[150px] h-[150px] object-contain object-center"
        style={{ imageRendering: "pixelated" }}
      />

      <h3 className="mt-[60px] text-white font-semibold tracking-wide text-xl">
        Cargando, espere un momento...
      </h3>
    </div>
  );
}
