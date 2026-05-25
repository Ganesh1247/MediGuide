import React, { createContext, useContext, useState, useEffect } from "react";
import { LANGUAGES, translations, LanguageCode, Language } from "../data/translations";

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRtl: boolean;
  activeLanguage: Language;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [activeTranslations, setActiveTranslations] = useState<Record<string, string>>(translations["en"]);

  useEffect(() => {
    const savedLang = localStorage.getItem("mediguide_language") as LanguageCode;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ lang: language })
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.translations) {
            setActiveTranslations(data.translations);
            return;
          }
        }
      } catch (error) {
        console.warn("Translation fetch failed", error);
      }

      setActiveTranslations(translations[language] || translations["en"]);
    };

    loadTranslations();
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem("mediguide_language", lang);
    }
  };

  const t = (key: string): string => {
    return activeTranslations[key] || translations[language]?.[key] || translations["en"][key] || key;
  };

  const activeLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isRtl = activeLanguage.isRtl;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, activeLanguage }}>
      <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "rtl-text-align" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
