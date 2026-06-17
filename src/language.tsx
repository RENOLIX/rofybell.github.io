import { createContext, useContext, type ReactNode } from "react";

type LanguageContextValue = {
  language: "fr";
  setLanguage: (language: "fr") => void;
  isArabic: false;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageContext.Provider value={{ language: "fr", setLanguage: () => undefined, isArabic: false }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider absent");
  return value;
}
