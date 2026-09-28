import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import { prefs } from "@/lib/storage";
import type { Lang } from "@/lib/types";

export const LANGS: Lang[] = ["en", "hi", "mr"];
const KEY = "astrovastu.lang";

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return code === "hi" || code === "mr" ? code : "en";
}

const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, mr: { translation: mr } },
  lng: deviceLang(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/** Restore the language the user picked last time (falls back to the device language). */
export async function restoreLanguage() {
  const saved = await prefs.get(KEY).catch(() => null);
  if (saved && (LANGS as string[]).includes(saved) && saved !== i18n.language) await i18n.changeLanguage(saved);
}

export async function setLanguage(lang: Lang) {
  await i18n.changeLanguage(lang);
  await prefs.set(KEY, lang).catch(() => {});
}

export const currentLang = (): Lang => ((LANGS as string[]).includes(i18n.language) ? (i18n.language as Lang) : "en");

export default i18n;
