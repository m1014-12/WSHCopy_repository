import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';
import ThemeLanguageToggles from '../components/ThemeLanguageToggles';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { language, isDarkMode } = useThemeLanguage();
  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage(translations[language].fillEmail);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/forgot-password', {
        email: email,
      });

      setMessage(response.data.message || translations[language].resetLinkSent);
    } catch (error) {
      console.error("Error sending password reset link:", error);
      setMessage(translations[language].errorMessage);
    }
  };

  return (
    <div className={`container${isDarkMode ? ' dark' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="header header-flex">
        <h1 className={isDarkMode ? 'dark' : ''}>{t.forgotPassword}</h1>
        <ThemeLanguageToggles />
      </div>
      <div className='login-form login-form-responsive'> 
        <form onSubmit={handleSubmit} className='form-box'>
          <div className="form-group">
            <label htmlFor="forgo-email" className="dark:text-gray-200">
              {t.email}
            </label>
            <div className="input-with-icon">
              <input
                type="email"
                id="email"
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="login-button">
            {t.sendResetLink}
          </button>
          
          <p className="no-account dark:text-gray-200">
            {t.knowPassword} <Link to="/login" className='link-button get-started-blue'>{t.login}</Link>
          </p>
          
        </form>
        {message && (
          <p className={`message ${message.includes('error') || message.includes('wrong') ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </div>
  </div>
  );
};

export default ForgotPasswordPage;
