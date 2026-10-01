"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LOCATION } from "@/lib/prayer";

const KEY = "yusr.location";

export type LocationState = {
  latitude: number;
  longitude: number;
  isDefault: boolean;
  status: "idle" | "locating" | "denied";
  request: () => void;
};

/** Last known position (cached), falling back to Cairo like the Flutter app. */
export function useLocation(autoRequest = false): LocationState {
  const [coords, setCoords] = useState({ ...DEFAULT_LOCATION, isDefault: true });
  const [status, setStatus] = useState<LocationState["status"]>("idle");

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) return setStatus("denied");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const next = { latitude, longitude, isDefault: false };
        setCoords(next);
        setStatus("idle");
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 3_600_000 },
    );
  }, []);

  useEffect(() => {
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {}
    // Hydrating from browser-only storage after mount is intended here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached) setCoords(cached);
    else if (autoRequest) request();
  }, [autoRequest, request]);

  return { ...coords, status, request };
}

/** Re-renders every `intervalMs`; returns null until mounted to avoid hydration mismatch. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
