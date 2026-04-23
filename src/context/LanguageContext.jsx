import { createContext, useContext } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const lang = "en";
  const changeLang = () => {};

  /**
   * t("nav.home")               → "Home"
   * t("home.greeting", {name})  → "Welcome back, Anu"
   */
  const t = (key, vars = {}) => {
    const keys = key.split(".");
    let val = translations[lang];
    for (const k of keys) val = val?.[k];

    // Fallback to English if key missing
    if (typeof val !== "string") {
      val = translations.en;
      for (const k of keys) val = val?.[k];
    }
    if (typeof val !== "string") return key;

    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, v),
      val
    );
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
