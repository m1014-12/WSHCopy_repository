import '../App.css';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useAdmin } from '../context/AdminContext';
import { useUserSession } from '../context/UserSessionContext';
import { translations } from '../translations/translations';
import ThemeLanguageToggles from '../components/ThemeLanguageToggles';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [accessName, setAccessName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const navigate = useNavigate();
  
  // Use centralized theme and language context
  const { language, isDarkMode, toggleTheme, toggleLanguage } = useThemeLanguage();
  const { login: adminLogin } = useAdmin();
  const { login } = useUserSession();
  const t = translations[language];

  // Secret Code to unlock Admin Mode
  const handleSecretCode = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
      setAdminMode(!adminMode);
      alert(`Admin Mode ${!adminMode ? "Activated" : "Deactivated"}`);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleSecretCode);
    return () => {
      document.removeEventListener('keydown', handleSecretCode);
    };
  }, [adminMode]);

  // User login
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      alert(t.fillAllFields);
      return;
    }
    try {
      const res = await axios.post("http://localhost:3001/login", {
        email: email,
        password: password,
      });
      if (res.data.success) {
        // Use the UserSession context to manage login
        login(res.data.user, res.data.token);
        navigate("/home");
      } else {
        alert(res.data.message || t.loginFailed);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(t.loginFailedDetails);
    }
  };

  // Admin login 
  const handleAdminLogin = async (event) => {
    event.preventDefault();
    if (!accessName || !adminPassword || !adminKey) {
      alert(t.fillAllFields);
      return;
    }
    try {
      const res = await axios.post("http://localhost:3001/adminLogin", {
        accessName: accessName,
        password: adminPassword,
        adminKey: adminKey,
      });
      if (res.data.success) {
        // Store admin data and token in context
        adminLogin({
          id: res.data.adminId,
          accessName: res.data.accessName,
          email: res.data.email,
          role: 'admin'
        }, res.data.token);
        navigate("/admin-home");
      } else {
        alert(res.data.message || t.loginFailed);
      }
    } catch (err) {
      console.error("Admin login error:", err);
      alert(t.loginFailedDetails);
    }
  };

  return (
    <div className={`container${isDarkMode ? ' dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="header header-flex">
        <h1 className={isDarkMode ? 'dark' : ''}>{t.welcome}</h1>
        <ThemeLanguageToggles />
      </div>
      <div className="login-form login-form-responsive fade-in">
        <h2 className={isDarkMode ? 'dark' : ''}>{adminMode ? t.adminLogin : t.login}</h2>
        {!adminMode ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className={isDarkMode ? 'dark' : ''}>{t.email}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className={isDarkMode ? 'dark' : ''}>{t.password}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <Link to="/forgot-password" className={`forgot-password${isDarkMode ? ' dark' : ''}`}>{t.forgotPassword}</Link>
            <button type="submit" className={`login-button${isDarkMode ? ' dark' : ''}`}>{t.login}</button>
            <p className={`no-account${isDarkMode ? ' dark' : ''}`}>{t.noAccount} <Link to="/registration" className={`link-button${isDarkMode ? ' dark' : ''}`}>{t.registerHere}</Link></p>
            <p><Link to="/" className={`link-button get-started-blue no-account${isDarkMode ? ' dark' : ''}`}>{t.getStarted}</Link></p>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label htmlFor="accessName" className={isDarkMode ? 'dark' : ''}>{t.accessName}</label>
              <input
                type="text"
                id="accessName"
                value={accessName}
                onChange={(e) => setAccessName(e.target.value)}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="adminPassword" className={isDarkMode ? 'dark' : ''}>{t.password}</label>
              <input
                type="password"
                id="adminPassword"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="adminKey" className={isDarkMode ? 'dark' : ''}>{t.adminKey}</label>
              <input
                type="password"
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <button type="submit" className={`login-button${isDarkMode ? ' dark' : ''}`}>{t.loginAsAdmin}</button>
            <p><Link to="/" className={`link-button get-started-blue no-account${isDarkMode ? ' dark' : ''}`}>{t.getStarted}</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;