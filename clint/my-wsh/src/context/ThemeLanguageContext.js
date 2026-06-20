import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeLanguageContext = createContext();

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};

export const ThemeLanguageProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' for English language, 'ar' for Arabic language

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('language', language);
  }, [isDarkMode, language]);

  // Apply theme to document body
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.setAttribute('data-language', language);
  }, [isDarkMode, language]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const value = {
    isDarkMode,
    language,
    toggleTheme,
    toggleLanguage,
  };

  return (
    <ThemeLanguageContext.Provider value={value}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}; 