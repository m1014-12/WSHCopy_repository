import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Moon, User, Sun } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useUserSession } from '../context/UserSessionContext';
import { translations } from '../translations/translations';

function UserHeader() {
  const navigate = useNavigate();
  const { isDarkMode, language, toggleTheme, toggleLanguage } = useThemeLanguage();
  const { logout } = useUserSession();
  const t = translations[language];
  const logo = require('./wshLogo.png');

  // Navigation functions
  const goTohome = () => navigate('/home');
  const goToProfile = () => navigate('/profile');
  const goTonotifications = () => navigate('/notifications');
  const handleLogout = () => {
    console.log('User logged out');
    logout();
    navigate('/login');
  };

  return (
    <header className={`user-header ${isDarkMode ? 'dark' : ''}`}>
      <div className="header-left">
        <div className="logo-container" onClick={goTohome}>
          <img src={logo} alt="WHS Logo" className="logo" />
        </div>
      </div>

      <nav className="user-nav">
        <Link to="/help" className="nav-link">
          {t.homePage.helpSupport}
        </Link>
        <span onClick={toggleLanguage} className="nav-link">
          {language === 'en' ? 'العربية' : 'English'}
        </span>
        <span onClick={handleLogout} className="nav-link">
          {t.homePage.signOut}
        </span>
        {/* Theme Mode Icon */}
        <span onClick={toggleTheme} className="nav-icon-link">
          {isDarkMode ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
        </span>
        {/* Notifications Icon */}
        <span onClick={goTonotifications} className="nav-icon-link">
          <Bell className="nav-icon" />
        </span>
        {/* User Profile Icon */}
        <span onClick={goToProfile} className="nav-icon-link">
          <User className="nav-icon" />
        </span>
      </nav>
    </header>
  );
}

export default UserHeader;
