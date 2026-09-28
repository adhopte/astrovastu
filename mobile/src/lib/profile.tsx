import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { setLanguage } from "@/i18n";
import { getProfile, logActivity, ProfileRow, saveProfile, setProfileLanguage } from "./store";
import type { Lang } from "./types";

interface ProfileState {
  /** null until the first-run "what's your name?" screen has been completed. */
  profile: ProfileRow | null;
  ready: boolean;
  createProfile: (name: string, language: Lang) => void;
  updateName: (name: string) => void;
  changeLanguage: (l: Lang) => Promise<void>;
}

const Ctx = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // The database read is synchronous and local, so there's no loading state to wait out.
  const [profile, setProfile] = useState<ProfileRow | null>(() => getProfile());
  const ready = true;

  const createProfile = useCallback((name: string, language: Lang) => {
    setProfile(saveProfile(name, language));
    logActivity("profile.create");
  }, []);

  const updateName = useCallback((name: string) => {
    setProfile((prev) => (prev ? saveProfile(name, prev.language) : prev));
    logActivity("profile.update", undefined, { name });
  }, []);

  const changeLanguage = useCallback(async (l: Lang) => {
    await setLanguage(l);
    setProfileLanguage(l);
    setProfile((prev) => (prev ? { ...prev, language: l } : prev));
  }, []);

  const value = useMemo(() => ({ profile, ready, createProfile, updateName, changeLanguage }), [profile, ready, createProfile, updateName, changeLanguage]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
