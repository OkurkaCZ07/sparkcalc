'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('sc_lang');
    if (saved) setLangState(saved);
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('sc_lang', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
