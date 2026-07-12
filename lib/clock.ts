"use client";

import { useEffect, useState } from "react";

/** "HH:MM" wall clock, empty until mounted so SSR and client agree. */
export function useClock(): string {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes(),
        ).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return time;
}
