"use client";

import * as React from "react";
import type { Pin } from "@/lib/sampleData";
import { pins as seededPins } from "@/lib/sampleData";

type PinsState = {
  pins: Pin[];
};

type PinsApi = PinsState & {
  createPin: (pin: Pin) => void;
  updatePin: (id: string, patch: Partial<Pin>) => void;
  getPinById: (id: string) => Pin | undefined;
};

const STORAGE_KEY = "vibely.pins.v1";
const Ctx = React.createContext<PinsApi | null>(null);

function safeParse(json: string | null): PinsState | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Partial<PinsState>;
    if (!v || typeof v !== "object") return null;
    if (!Array.isArray(v.pins)) return null;
    return { pins: v.pins as Pin[] };
  } catch {
    return null;
  }
}

export function PinsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PinsState>(() => ({
    pins: seededPins,
  }));

  React.useEffect(() => {
    const restored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (restored) setState(restored);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api = React.useMemo<PinsApi>(() => {
    return {
      ...state,
      createPin: (pin) => setState((s) => ({ pins: [pin, ...s.pins] })),
      updatePin: (id, patch) =>
        setState((s) => ({
          pins: s.pins.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      getPinById: (id) => state.pins.find((p) => p.id === id),
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePins() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("usePins must be used within PinsProvider");
  return ctx;
}

