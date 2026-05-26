/**
 * Hook que recibe una fecha de expiración (ISO string)
 * y devuelve el tiempo restante formateado + si ya expiró
 */
import { useState, useEffect } from "react";
export function useCountdown(expiresAt) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setExpired(true);
        return;
      }

      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
      setExpired(false);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { timeLeft, expired };
}
