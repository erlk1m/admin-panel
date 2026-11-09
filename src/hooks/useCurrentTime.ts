"use client";

import { useEffect, useState } from "react";

export function useCurrentTime(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    const initTimer = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}

