"use client";

import * as React from "react";

export type Collection = {
  id: string;
  name: string;
};

type StoreState = {
  collections: Collection[]; // user-created lists (not including "all")
  pinToCollectionId: Record<string, string | null>; // null => uncategorized
};

type StoreApi = StoreState & {
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  setPinCollection: (pinId: string, collectionId: string | null) => void;
};

const STORAGE_KEY = "pinIt.collections.v1";

function safeParse(json: string | null): StoreState | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Partial<StoreState>;
    if (!v || typeof v !== "object") return null;
    return {
      collections: Array.isArray(v.collections) ? (v.collections as Collection[]) : [],
      pinToCollectionId:
        v.pinToCollectionId && typeof v.pinToCollectionId === "object"
          ? (v.pinToCollectionId as Record<string, string | null>)
          : {},
    };
  } catch {
    return null;
  }
}

function makeId(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `${base || "list"}-${Date.now().toString(36)}`;
}

const CollectionsContext = React.createContext<StoreApi | null>(null);

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<StoreState>(() => ({
    collections: [{ id: "favourites", name: "Favourite Restaurants" }],
    pinToCollectionId: {},
  }));

  React.useEffect(() => {
    const restored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (restored) setState(restored);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const api = React.useMemo<StoreApi>(() => {
    return {
      ...state,
      createCollection: (name) => {
        const id = makeId(name);
        setState((s) => ({
          ...s,
          collections: [...s.collections, { id, name: name.trim() }],
        }));
        return id;
      },
      renameCollection: (id, name) => {
        setState((s) => ({
          ...s,
          collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)),
        }));
      },
      deleteCollection: (id) => {
        setState((s) => {
          const nextMap: Record<string, string | null> = { ...s.pinToCollectionId };
          for (const [pinId, collId] of Object.entries(nextMap)) {
            if (collId === id) nextMap[pinId] = null;
          }
          return {
            collections: s.collections.filter((c) => c.id !== id),
            pinToCollectionId: nextMap,
          };
        });
      },
      setPinCollection: (pinId, collectionId) => {
        setState((s) => ({
          ...s,
          pinToCollectionId: { ...s.pinToCollectionId, [pinId]: collectionId },
        }));
      },
    };
  }, [state]);

  return (
    <CollectionsContext.Provider value={api}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const ctx = React.useContext(CollectionsContext);
  if (!ctx) throw new Error("useCollections must be used within CollectionsProvider");
  return ctx;
}

