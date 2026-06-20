import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useAdmin } from '../context/AdminContext';
import { translations } from '../translations/translations';
import ThemeLanguageToggles from './ThemeLanguageToggles';
import wshLogo from './wshLogo.png';
import '../css/AdminHeader.css';

function AdminHeader() {
  const navigate = useNavigate();
  const { language, isDarkMode } = useThemeLanguage();
  const { adminData, logout } = useAdmin();
  const t = translations[language];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToAdminHome = () => {
    navigate('/admin-home');
  };

  return (
    <header className={`admin-header ${isDarkMode ? 'dark' : ''}`}>
      <div className="header-left">
        <div className="logo-container" onClick={goToAdminHome}>
          <img src={wshLogo} alt="WSH Logo" className="logo" />
          <span className="logo-text">WSH</span>
        </div>
        <div className="admin-info">
          <span className="admin-label">{t.adminHomePage?.accessName || 'Access Name'}: </span>
          <span className="admin-name">{adminData?.accessName || adminData?.name || 'Admin'}</span>
        </div>
      </div>
      
      <div className="header-right">
        <ThemeLanguageToggles />
        <button 
          onClick={handleLogout}
          className="logout-button"
        >
          {t.adminHomePage?.logout || t.logout || 'Logout'}
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
