import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setToken, setUnauthorizedHandler } from "./api";
import { secure } from "./storage";
import { currentLang, setLanguage } from "@/i18n";
import type { AuthResponse, Lang, User } from "./types";

const TOKEN_KEY = "astrovastu.token";

interface AuthState {
  user: User | null;
  ready: boolean;
  /** Persist a session returned by any login endpoint. */
  signIn: (res: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUser: (u: User) => void;
  changeLanguage: (l: Lang) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(async () => {
    setToken(null);
    setUser(null);
    await secure.remove(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { void clear(); });
    (async () => {
      try {
        const stored = await secure.get(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          const me = await api.me();
          setUser(me.user);
        }
      } catch {
        // Expired or revoked token, or offline on launch: fall back to the login screen.
        await clear();
      } finally {
        setReady(true);
      }
    })();
  }, [clear]);

  const signIn = useCallback(async (res: AuthResponse) => {
    setToken(res.token);
    await secure.set(TOKEN_KEY, res.token);
    // A returning user's saved language wins over the one picked on the login screen.
    if (!res.created && res.user.language !== currentLang()) await setLanguage(res.user.language);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {});
    await clear();
  }, [clear]);

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    await clear();
  }, [clear]);

  const changeLanguage = useCallback(async (l: Lang) => {
    await setLanguage(l);
    if (user) {
      const res = await api.updateMe({ language: l }).catch(() => null);
      if (res) setUser(res.user);
    }
  }, [user]);

  const value = useMemo(() => ({ user, ready, signIn, signOut, deleteAccount, updateUser: setUser, changeLanguage }), [user, ready, signIn, signOut, deleteAccount, changeLanguage]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
