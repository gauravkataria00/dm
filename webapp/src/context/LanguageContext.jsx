import { createContext, useContext, useState, useEffect } from "react";
import translations from "../utils/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    // Get saved language from localStorage or default to English
    return localStorage.getItem("appLanguage") || "en";
  });

  useEffect(() => {
    // Save language to localStorage whenever it changes
    localStorage.setItem("appLanguage", language);
  }, [language]);

  const setLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguageState(newLanguage);
    }
  };

  const t = translations[language] || translations.en;

  const value = {
    language,
    setLanguage,
    t,
    translations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
