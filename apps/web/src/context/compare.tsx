"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const MAX_COMPARE = 4;

type CompareContextValue = {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  max: number;
};

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "modelrank:compare";

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelected(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      /* ignore */
    }
  }, [selected, hydrated]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);
  const has = useCallback((id: string) => selected.includes(id), [selected]);

  const value = useMemo(
    () => ({ selected, toggle, clear, has, max: MAX_COMPARE }),
    [selected, toggle, clear, has]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
