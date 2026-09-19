import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('mm_lang') || 'gu';
  });

  const setLanguage = (lang) => {
    if (lang === 'gu' || lang === 'en') {
      setLanguageState(lang);
      localStorage.setItem('mm_lang', lang);
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'gu' ? 'en' : 'gu';
    setLanguage(nextLang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Nested translation helper with fallback
  const t = (path, fallback) => {
    if (!path) return '';
    const keys = path.split('.');
    
    // Check current language
    let current = translations[language];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined) return current;

    // Check English fallback
    if (language !== 'en') {
      let enFallback = translations.en;
      for (const key of keys) {
        if (enFallback && enFallback[key] !== undefined) {
          enFallback = enFallback[key];
        } else {
          enFallback = undefined;
          break;
        }
      }
      if (enFallback !== undefined) return enFallback;
    }

    return fallback !== undefined ? fallback : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
