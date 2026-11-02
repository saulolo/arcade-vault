"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type User = { name: string };

type SessionValue = {
  user: User | null;
  login: (user: User | null) => void;
  signOut: () => void;
};

const USER_KEY = "av_user";

const SessionContext = createContext<SessionValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// Snapshot = string crudo (primitivo, estable entre lecturas).
function getSnapshot(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

// En el servidor y durante la hidratación no hay sesión.
function getServerSnapshot(): string | null {
  return null;
}

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User | null;
    return parsed && typeof parsed.name === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo(() => parseUser(raw), [raw]);

  const login = useCallback((u: User | null) => {
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    } catch {
      // localStorage bloqueado: la sesión no persiste.
    }
    listeners.forEach((l) => l());
  }, []);

  const signOut = useCallback(() => login(null), [login]);

  const value = useMemo(() => ({ user, login, signOut }), [user, login, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
