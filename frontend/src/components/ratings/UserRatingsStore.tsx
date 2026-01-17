"use client";

import * as React from "react";

type RatingsState = {
  ratingsByKey: Record<string, number>; // 0..5
};

type RatingsApi = RatingsState & {
  setRating: (key: string, rating: number) => void;
};

const STORAGE_KEY = "vibely.userRatings.v1";
const Ctx = React.createContext<RatingsApi | null>(null);

function safeParse(json: string | null): RatingsState | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Partial<RatingsState>;
    if (!v || typeof v !== "object") return null;
    return {
      ratingsByKey:
        v.ratingsByKey && typeof v.ratingsByKey === "object"
          ? (v.ratingsByKey as Record<string, number>)
          : {},
    };
  } catch {
    return null;
  }
}

export function UserRatingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<RatingsState>(() => ({
    ratingsByKey: {},
  }));

  React.useEffect(() => {
    const restored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (restored) setState(restored);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api = React.useMemo<RatingsApi>(() => {
    return {
      ...state,
      setRating: (key, rating) => {
        const clamped = Math.max(0, Math.min(5, Math.round(rating)));
        setState((s) => ({
          ratingsByKey: { ...s.ratingsByKey, [key]: clamped },
        }));
      },
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useUserRatings() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useUserRatings must be used within UserRatingsProvider");
  return ctx;
}

export function useUserRating(key: string) {
  const { ratingsByKey, setRating } = useUserRatings();
  return [ratingsByKey[key] ?? 0, (v: number) => setRating(key, v)] as const;
}

