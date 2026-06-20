import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { translations } from '../translations/translations';
import '../css/ResetPasswordPage.css';

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    maxLength: false,
    upperCase: false,
    lowerCase: false,
    number: false,
    specialChar: false
  });

  const { id, token } = useParams();
  const navigate = useNavigate();
  const { language, isDarkMode, toggleTheme, toggleLanguage } = useThemeLanguage();
  const t = translations[language];

  const validateFields = () => {
    const newErrors = {};

    if (password.length < 8 || password.length > 20) {
      newErrors.password = t.errors.passwordLength;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t.errors.passwordMismatch;
    }

    return newErrors;
  };

  // Real-time password validations
  useEffect(() => {
    setErrors(validateFields());
    setPasswordValidations({
      minLength: password.length >= 8,
      maxLength: password.length <= 20,
      upperCase: /[A-Z]/.test(password),
      lowerCase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[\W_]/.test(password),
    });
  }, [password, confirmPassword, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateFields();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) return;

    try {
      const res = await axios.post(`http://localhost:3001/reset-password/${id}/${token}`, {
        password: password,  
        confirmPassword: confirmPassword, 
      });
      
      setMessage(res.data.message);
      setMessageType("success");

      if (res.data.success) {
        alert(t.success.passwordUpdated);
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      setMessage(t.errors.somethingWrong);
      setMessageType("error");
    }
  };

  return (
    <div className="reset-password-container">
      {/* Theme and Language Controls */}
      <div className="controls-container">
        <button 
          className="control-button" 
          onClick={toggleTheme}
          title={isDarkMode ? t.theme.light : t.theme.dark}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <button 
          className="control-button" 
          onClick={toggleLanguage}
          title={language === 'en' ? t.language.arabic : t.language.english}
        >
          {language === 'en' ? 'عربي' : 'EN'}
        </button>
      </div>

      <div className="reset-password-card">
        <h1 className="reset-password-title">{t.resetPassword}</h1>
        
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className={`form-group ${errors.password ? 'error' : password ? 'valid' : ''}`}>
            <label htmlFor="password">{t.newPassword}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <ul className="password-requirements">
              <li className={passwordValidations.minLength ? 'valid' : 'invalid'}>
                {t.passwordRequirements.minLength}
              </li>
              <li className={passwordValidations.maxLength ? 'valid' : 'invalid'}>
                {t.passwordRequirements.maxLength}
              </li>
              <li className={passwordValidations.upperCase ? 'valid' : 'invalid'}>
                {t.passwordRequirements.upperCase}
              </li>
              <li className={passwordValidations.lowerCase ? 'valid' : 'invalid'}>
                {t.passwordRequirements.lowerCase}
              </li>
              <li className={passwordValidations.number ? 'valid' : 'invalid'}>
                {t.passwordRequirements.number}
              </li>
              <li className={passwordValidations.specialChar ? 'valid' : 'invalid'}>
                {t.passwordRequirements.specialChar}
              </li>
            </ul>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className={`form-group ${errors.confirmPassword ? 'error' : confirmPassword ? 'valid' : ''}`}>
            <label htmlFor="confirmPassword">{t.confirmPassword}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="submit-button">
            {t.resetPasswordButton}
          </button>
          
          <p className="login-link">
            {t.rememberPassword} <Link to="/login">{t.loginHere}</Link>
          </p>
          
          {message && (
            <p className={`message ${messageType}`}>
              {message}
            </p>
          )}
        </form>
      </div>
  </div>
  );
};

export default ResetPassword;
