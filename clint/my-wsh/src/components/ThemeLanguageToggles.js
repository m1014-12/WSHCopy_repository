import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';

const ThemeLanguageToggles = () => {
  const { language, isDarkMode, toggleTheme, toggleLanguage } = useThemeLanguage();
  const t = translations[language];

  return (
    <div className="icon-container icon-container-gap">
      {/* Theme toggle button */}
      <button className="icon-button neutral-icon" onClick={toggleTheme} aria-label="Toggle theme" type="button">
        {isDarkMode ? (
          <svg className="icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
        ) : (
          <svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        )}
      </button>
      {/* Language toggle button */}
      <button className="icon-button neutral-icon" onClick={toggleLanguage} aria-label="Toggle language" type="button">
        {language === 'en' ? t.language.arabic : t.language.english}
      </button>
    </div>
  );
};

export default ThemeLanguageToggles; 